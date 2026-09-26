#!/usr/bin/env node
/**
 * 1280×720 shots for the header Flash acknowledge button, the top-left
 * SETTINGS / campaign-knowledge pair, and the empty briefing panel.
 *
 *   node scripts/capture-cleanup-screens.mjs --mode baseline --out /opt/cursor/artifacts/screenshots/baseline
 *   node scripts/capture-cleanup-screens.mjs --mode after --out /opt/cursor/artifacts/screenshots/after
 *
 * After mode exits non-zero unless clippedControls, occluders, and
 * pillOverlaps are all empty and the empty-briefing sentence appears once.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { longestHeaderStatusMessage, realAllCapsFactionShipMessage, realWmHeavyAllCapsMessage, typedShipHeaderStatusMessage, wideCapsHeaderStatusMessage } from './header-status-worst.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const modeIdx = args.indexOf('--mode');
const mode = modeIdx >= 0 ? args[modeIdx + 1] : 'after';
const outDir = path.resolve(outIdx >= 0 ? args[outIdx + 1] : (
  mode === 'baseline'
    ? '/opt/cursor/artifacts/screenshots/baseline'
    : '/opt/cursor/artifacts/screenshots/after'
));
const PORT = Number(process.env.PROBE_PORT) || 8776;
const BASE = `http://127.0.0.1:${PORT}/`;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.wav': 'audio/wav',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '');
    const filePath = path.normalize(path.join(root, relative));
    if (!filePath.startsWith(root)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(error.code === 'ENOENT' ? 404 : 500).end(String(error.message));
        return;
      }
      res.writeHead(200, { 'content-type': MIME[path.extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((resolve, reject) => {
    server.listen(PORT, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

function measureCleanup() {
  return () => {
    const overlap = (a, b) => a && b && !a.hidden && !b.hidden
      && a.left < b.right - 0.5 && a.right > b.left + 0.5
      && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
    const boxOf = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const hidden = el.classList.contains('hidden') || style.display === 'none' || style.visibility === 'hidden' || r.width < 2 || r.height < 2;
      return {
        hidden,
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
      };
    };
    const pillBoxes = [...document.querySelectorAll('.top-strip > *')].map((el) => {
      const box = boxOf(el);
      return {
        ...box,
        text: String(el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80),
        el,
      };
    }).filter((box) => box && !box.hidden);
    const menuButtons = [...document.querySelectorAll('#top-left-menu button')].map((el) => {
      const box = boxOf(el);
      return {
        ...box,
        name: String(el.innerText || '').replace(/\s+/g, ' ').trim().toUpperCase() || 'BUTTON',
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        el,
      };
    });
    const readout = boxOf(document.getElementById('phase10-readout'));
    const message = document.querySelector('.top-message');
    const textEl = document.querySelector('.top-message-text');
    const ack = document.querySelector('.flash-ack');
    const ackBox = boxOf(ack);
    const textBox = boxOf(textEl);
    const statusBox = boxOf(message);
    const lineRects = [];
    if (textEl) {
      const range = document.createRange();
      range.selectNodeContents(textEl);
      for (const rect of range.getClientRects()) {
        if (rect.width > 0.5 && rect.height > 0.5) {
          lineRects.push({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom });
        }
      }
    }
    const pillOverlaps = [];
    for (let i = 0; i < pillBoxes.length; i += 1) {
      for (let j = i + 1; j < pillBoxes.length; j += 1) {
        if (overlap(pillBoxes[i], pillBoxes[j])) {
          pillOverlaps.push(`${pillBoxes[i].text} ~ ${pillBoxes[j].text}`);
        }
      }
    }
    const headerPill = statusBox ? { ...statusBox, text: 'header pill' } : null;
    for (const button of menuButtons) {
      if (button.hidden) continue;
      if (overlap(button, headerPill)) {
        const label = `${button.name} ~ header pill`;
        if (!pillOverlaps.includes(label)) pillOverlaps.push(label);
      }
      for (const pill of pillBoxes) {
        if (overlap(button, pill)) {
          const label = `${button.name} ~ ${pill.text}`;
          if (!pillOverlaps.includes(label)) pillOverlaps.push(label);
        }
      }
    }
    if (ackBox && !ackBox.hidden) {
      for (const line of lineRects) {
        if (overlap(line, ackBox)) {
          const label = 'status text ~ Acknowledge';
          if (!pillOverlaps.includes(label)) pillOverlaps.push(label);
        }
      }
      if (textBox && overlap(textBox, ackBox)) {
        const label = 'status text box ~ Acknowledge';
        if (!pillOverlaps.includes(label)) pillOverlaps.push(label);
      }
    }
    const occluders = [];
    const campaign = readout && !readout.hidden ? readout : null;
    for (const button of menuButtons) {
      if (button.hidden) continue;
      if (campaign && overlap(button, campaign)) {
        const label = `${button.name} overlaps campaign panel`;
        if (!occluders.includes(label)) occluders.push(label);
      }
      if (headerPill && overlap(button, headerPill)) {
        const label = `${button.name} overlaps header pill`;
        if (!occluders.includes(label)) occluders.push(label);
      }
      for (const pill of pillBoxes) {
        if (overlap(button, pill)) {
          const label = `${button.name} overlaps ${pill.text}`;
          if (!occluders.includes(label)) occluders.push(label);
        }
      }
    }
    if (campaign) {
      for (const pill of pillBoxes) {
        if (overlap(campaign, pill)) {
          const label = `campaign panel overlaps ${pill.text}`;
          if (!occluders.includes(label)) occluders.push(label);
        }
      }
    }
    const clippedControls = [];
    const considerClip = (el, host) => {
      if (!el) return;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      const hostStyle = host ? getComputedStyle(host) : null;
      const hostRect = host ? host.getBoundingClientRect() : null;
      const hostClips = Boolean(hostStyle) && !['visible', ''].includes(hostStyle.overflow) && hostStyle.overflow !== 'visible';
      const outsideHost = Boolean(hostClips && hostRect) && (
        r.left < hostRect.left - 1
        || r.right > hostRect.right + 1
        || r.top < hostRect.top - 1
        || r.bottom > hostRect.bottom + 1
      );
      const outsideViewport = r.left < -1 || r.top < -1 || r.right > window.innerWidth + 1 || r.bottom > window.innerHeight + 1;
      const textCut = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
      if (outsideHost || outsideViewport || textCut) clippedControls.push(String(el.textContent || '').trim().slice(0, 80));
    };
    for (const el of document.querySelectorAll('.top-strip button, #top-left-menu button')) {
      considerClip(el, el.closest('.top-message, .top-strip, #top-left-menu'));
    }
    const cargo = boxOf(document.getElementById('world-cargo'));
    const separation = (a, b) => {
      const dx = Math.max(a.left, b.left) - Math.min(a.right, b.right);
      const dy = Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom);
      if (dx < 0 && dy < 0) return Math.max(dx, dy);
      if (dx < 0) return dy;
      if (dy < 0) return dx;
      return Math.hypot(dx, dy);
    };
    const leftPanels = [
      ...menuButtons.filter((button) => !button.hidden).map((button) => ({ name: button.name, box: button })),
      ...(campaign ? [{ name: 'campaign panel', box: campaign }] : []),
      ...(cargo && !cargo.hidden ? [{ name: 'world cargo', box: cargo }] : []),
      ...(() => {
        const dock = boxOf(document.getElementById('bottom-dock'));
        return dock && !dock.hidden ? [{ name: 'bottom dock', box: dock }] : [];
      })(),
      ...(() => {
        const target = boxOf(document.getElementById('target-window'));
        return target && !target.hidden ? [{ name: 'target window', box: target }] : [];
      })(),
    ];
    const panelGaps = [];
    for (let i = 0; i < leftPanels.length; i += 1) {
      for (let j = i + 1; j < leftPanels.length; j += 1) {
        const gap = separation(leftPanels[i].box, leftPanels[j].box);
        panelGaps.push({
          pair: `${leftPanels[i].name} ~ ${leftPanels[j].name}`,
          gap: Math.round(gap * 100) / 100,
        });
        if (gap < 0.5) {
          const label = `${leftPanels[i].name} overlaps ${leftPanels[j].name}`;
          if (!occluders.includes(label)) occluders.push(label);
        }
      }
    }
    const minimumGap = panelGaps.length ? Math.min(...panelGaps.map((row) => row.gap)) : null;
    const briefing = document.getElementById('briefing-archive');
    const briefingText = String(briefing?.innerText || '');
    const emptyCount = briefingText.split('No briefing has been filed.').length - 1;
    const ackInside = !ackBox || !statusBox || (
      ackBox.top >= statusBox.top - 0.5
      && ackBox.bottom <= statusBox.bottom + 0.5
      && ackBox.left >= statusBox.left - 0.5
      && ackBox.right <= statusBox.right + 0.5
    );
    const textClearsAck = !ackBox || !textBox || textBox.right <= ackBox.left + 0.5;
    const linesClearAck = !ackBox || lineRects.every((line) => line.right <= ackBox.left + 0.5);
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      clippedControls,
      occluders,
      pillOverlaps,
      flashAckVisible: Boolean(ackBox && !ackBox.hidden),
      ackInsidePill: ackInside,
      textClearsAck,
      linesClearAck,
      emptyBriefingCount: emptyCount,
      headerMode: message?.dataset.headerMode || null,
      fontSize: textEl ? getComputedStyle(textEl).fontSize : null,
      statusText: String(textEl?.textContent || '').slice(0, 180),
      menu: menuButtons.map((button) => ({
        name: button.name,
        left: Math.round(button.left),
        right: Math.round(button.right),
        top: Math.round(button.top),
        bottom: Math.round(button.bottom),
        scrollWidth: button.scrollWidth,
        clientWidth: button.clientWidth,
      })),
      campaign: campaign ? {
        left: Math.round(campaign.left),
        right: Math.round(campaign.right),
        top: Math.round(campaign.top),
        bottom: Math.round(campaign.bottom),
      } : null,
      ack: ackBox && !ackBox.hidden ? {
        left: Math.round(ackBox.left),
        right: Math.round(ackBox.right),
        top: Math.round(ackBox.top),
        bottom: Math.round(ackBox.bottom),
      } : null,
      text: textBox && !textBox.hidden ? {
        left: Math.round(textBox.left),
        right: Math.round(textBox.right),
        top: Math.round(textBox.top),
        bottom: Math.round(textBox.bottom),
      } : null,
      lineRights: lineRects.map((line) => Math.round(line.right)),
      panelGaps,
      minimumGap,
      campaignTop: campaign ? Math.round(campaign.top) : null,
      worldCargoTop: cargo && !cargo.hidden ? Math.round(cargo.top) : null,
      dockTop: (() => {
        const dock = boxOf(document.getElementById('bottom-dock'));
        return dock && !dock.hidden ? Math.round(dock.top) : null;
      })(),
    };
  };
}

async function boot(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => globalThis.BM1Probe?.ready?.(), null, { timeout: 30000 });
  await page.evaluate(() => {
    globalThis.BM1Probe.skipIntro();
    globalThis.BM1Probe.freezeLoop();
  });
  await page.evaluate(() => globalThis.BM1Probe.startGame('ferengi', {
    arena: { clearTraffic: true, latinum: 1600, hull: 100, shields: 100 },
  }));
  await page.waitForTimeout(300);
}

async function showFlashAck(page, message) {
  await page.evaluate((text) => {
    const probe = globalThis.__BM1_PROBE__;
    const shown = probe?.showHeaderFlashAck?.(true);
    if (!shown?.displayOnly) throw new Error(`display flash hook failed: ${JSON.stringify(shown || null)}`);
    probe.setStatus(text);
    globalThis.BM1Probe.paint?.();
  }, message);
  await page.waitForTimeout(200);
}

async function measureFit(page, message) {
  return page.evaluate((text) => {
    const probe = globalThis.__BM1_PROBE__;
    probe.setStatus(text);
    const messageEl = document.querySelector('.top-message');
    const textEl = document.querySelector('.top-message-text');
    const ack = document.querySelector('.flash-ack');
    const shortLabel = ack?.textContent === 'ACK';
    return {
      text: textEl?.textContent || '',
      mode: messageEl?.dataset.headerMode || null,
      fontSize: textEl ? getComputedStyle(textEl).fontSize : null,
      shortLabel,
      ackText: ack?.textContent || '',
      ackTitle: ack?.getAttribute('title') || '',
      ackAria: ack?.getAttribute('aria-label') || '',
      displayOnly: Boolean(ack?.hasAttribute('data-flash-ack-display')) && !ack?.hasAttribute('data-flash-ack'),
    };
  }, message);
}

async function shot(page, name, clip) {
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false, clip });
  return file;
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.setDefaultTimeout(30000);
    await boot(page);
    const typedText = typedShipHeaderStatusMessage();
    const realCapsText = realAllCapsFactionShipMessage();
    const wmHeavyText = realWmHeavyAllCapsMessage();
    const wideText = wideCapsHeaderStatusMessage();
    const longestText = longestHeaderStatusMessage();
    await showFlashAck(page, typedText);
    const regions = await page.evaluate(() => {
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      };
      const pad = (box, extra) => {
        if (!box) return null;
        const x = Math.max(0, box.x - extra);
        const y = Math.max(0, box.y - extra);
        return {
          x,
          y,
          width: Math.min(1280 - x, box.width + extra * 2),
          height: Math.min(720 - y, box.height + extra * 2),
        };
      };
      const menu = document.getElementById('top-left-menu');
      const settings = document.querySelector('#top-left-menu button[data-top-left-tab="settings"]');
      const campaign = document.getElementById('phase10-readout');
      const cargo = document.getElementById('world-cargo');
      const dock = document.getElementById('bottom-dock');
      const briefing = document.getElementById('briefing-archive');
      const header = document.querySelector('.top-strip');
      const boxes = [menu, settings, campaign, cargo, dock].map(rect).filter(Boolean);
      const left = boxes.length ? {
        x: Math.min(...boxes.map((box) => box.x)),
        y: Math.min(...boxes.map((box) => box.y)),
        width: Math.max(...boxes.map((box) => box.x + box.width)) - Math.min(...boxes.map((box) => box.x)),
        height: Math.max(...boxes.map((box) => box.y + box.height)) - Math.min(...boxes.map((box) => box.y)),
      } : null;
      return {
        header: pad(rect(header), 12),
        settings: pad(left, 16),
        briefing: pad(rect(briefing), 12),
      };
    });
    await shot(page, '01-overview');
    if (regions.header) await shot(page, '02-header-flash-ack', regions.header);
    if (regions.settings) await shot(page, '03-settings-campaign', regions.settings);
    if (regions.briefing) await shot(page, '04-empty-briefing', regions.briefing);
    const measured = await page.evaluate(measureCleanup());
    const fits = {
      typed36: await measureFit(page, typedText),
      realAllCapsFactionShip: await measureFit(page, realCapsText),
      realWmHeavyAllCaps: await measureFit(page, wmHeavyText),
      longestRealNames: await measureFit(page, longestText),
      wideCaps: await measureFit(page, wideText),
    };
    await showFlashAck(page, typedText);
    const overflow = {
      viewport: measured.viewport,
      clippedControls: measured.clippedControls,
      occluders: measured.occluders,
      pillOverlaps: measured.pillOverlaps,
      flashAckVisible: measured.flashAckVisible,
      ackInsidePill: measured.ackInsidePill,
      textClearsAck: measured.textClearsAck,
      linesClearAck: measured.linesClearAck,
      emptyBriefingCount: measured.emptyBriefingCount,
      headerMode: measured.headerMode,
      fontSize: measured.fontSize,
      statusText: measured.statusText,
      menu: measured.menu,
      campaign: measured.campaign,
      ack: measured.ack,
      text: measured.text,
      lineRights: measured.lineRights,
      panelGaps: measured.panelGaps,
      minimumGap: measured.minimumGap,
      campaignTop: measured.campaignTop,
      worldCargoTop: measured.worldCargoTop,
      dockTop: measured.dockTop,
      fits,
    };
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'noclip.json'), JSON.stringify(overflow, null, 2));
    console.log(JSON.stringify({
      clippedControls: overflow.clippedControls,
      occluders: overflow.occluders,
      pillOverlaps: overflow.pillOverlaps,
      minimumGap: overflow.minimumGap,
      campaignTop: overflow.campaignTop,
      worldCargoTop: overflow.worldCargoTop,
      dockTop: overflow.dockTop,
      flashAckVisible: overflow.flashAckVisible,
      emptyBriefingCount: overflow.emptyBriefingCount,
      fits: overflow.fits,
    }, null, 2));
    if (mode === 'after') {
      const fitOk = overflow.fits?.typed36?.mode === 'full'
        && overflow.fits?.realAllCapsFactionShip?.mode === 'full'
        && overflow.fits?.realWmHeavyAllCaps?.mode === 'full'
        && overflow.fits?.longestRealNames?.mode === 'full'
        && overflow.fits?.wideCaps?.mode === 'clamped'
        && overflow.fits?.typed36?.displayOnly === true
        && overflow.fits?.realAllCapsFactionShip?.displayOnly === true
        && overflow.fits?.realWmHeavyAllCaps?.displayOnly === true
        && overflow.fits?.wideCaps?.displayOnly === true;
      const ok = overflow.clippedControls.length === 0
        && overflow.occluders.length === 0
        && overflow.pillOverlaps.length === 0
        && Number.isFinite(overflow.minimumGap)
        && overflow.minimumGap > 0
        && overflow.campaignTop === 70
        && overflow.worldCargoTop === 298
        && overflow.flashAckVisible === true
        && overflow.ackInsidePill === true
        && overflow.textClearsAck === true
        && overflow.linesClearAck === true
        && overflow.emptyBriefingCount === 1
        && overflow.viewport?.width === 1280
        && overflow.viewport?.height === 720
        && fitOk;
      if (!ok) process.exitCode = 1;
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
