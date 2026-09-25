#!/usr/bin/env node
/**
 * 1280×720 header status-strip shots.
 *
 *   node scripts/capture-header-strip-screens.mjs --mode baseline --out docs/header-strip/screenshots/baseline
 *   node scripts/capture-header-strip-screens.mjs --mode after --out docs/header-strip/screenshots/after
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { longestHeaderStatusMessage } from './header-status-worst.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const modeIdx = args.indexOf('--mode');
const mode = modeIdx >= 0 ? args[modeIdx + 1] : 'after';
const outDir = path.resolve(root, outIdx >= 0 ? args[outIdx + 1] : (
  mode === 'baseline' ? 'docs/header-strip/screenshots/baseline' : 'docs/header-strip/screenshots/after'
));
const PORT = Number(process.env.PROBE_PORT) || 8775;
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

function measureHeaderStrip() {
  return () => {
    const overlap = (a, b) => a && b && a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
    const boxOf = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const hidden = el.classList.contains('hidden') || style.display === 'none' || style.visibility === 'hidden';
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
    const textEl = document.querySelector('.top-message-text') || document.querySelector('.top-message');
    const message = document.querySelector('.top-message');
    const lineRects = [];
    if (textEl) {
      const range = document.createRange();
      range.selectNodeContents(textEl);
      for (const rect of range.getClientRects()) {
        if (rect.width > 0.5 && rect.height > 0.5) lineRects.push(rect);
      }
    }
    const pill = message ? message.getBoundingClientRect() : null;
    const linesInside = Boolean(pill) && lineRects.length > 0 && lineRects.every((rect) => (
      rect.top >= pill.top - 0.5
      && rect.bottom <= pill.bottom + 0.5
      && rect.left >= pill.left - 0.5
      && rect.right <= pill.right + 0.5
    ));
    const pills = [...document.querySelectorAll('.top-strip > *')];
    const pillBoxes = pills.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        text: String(el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80),
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
      };
    });
    const pillOverlaps = [];
    for (let i = 0; i < pillBoxes.length; i += 1) {
      for (let j = i + 1; j < pillBoxes.length; j += 1) {
        if (overlap(pillBoxes[i], pillBoxes[j])) {
          pillOverlaps.push(`${pillBoxes[i].text} ~ ${pillBoxes[j].text}`);
        }
      }
    }
    const menuButtons = [...document.querySelectorAll('#top-left-menu button')].map((el) => ({
      text: String(el.innerText || '').trim(),
      ...(() => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      })(),
    }));
    const readout = boxOf(document.getElementById('phase10-readout'));
    const cargo = boxOf(document.getElementById('world-cargo'));
    const planetMenu = boxOf(document.getElementById('planet-menu'));
    const strip = boxOf(document.querySelector('.top-strip'));
    const neighbors = [
      ...menuButtons.map((button) => ({ name: `menu:${button.text}`, box: button })),
      ...(readout && !readout.hidden ? [{ name: '#phase10-readout', box: readout }] : []),
      ...(cargo && !cargo.hidden ? [{ name: '#world-cargo', box: cargo }] : []),
      ...(planetMenu && !planetMenu.hidden ? [{ name: '#planet-menu', box: planetMenu }] : []),
    ];
    const occluders = [];
    for (const pill of pillBoxes) {
      for (const neighbor of neighbors) {
        if (overlap(pill, neighbor.box)) {
          const label = `${neighbor.name} overlaps ${pill.text}`;
          if (!occluders.includes(label)) occluders.push(label);
        }
      }
    }
    const clippedControls = [];
    for (const el of document.querySelectorAll('.top-strip button')) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const host = el.closest('.top-message, .top-strip');
      const hostRect = host ? host.getBoundingClientRect() : null;
      const cut = hostRect && (
        r.left < hostRect.left - 1
        || r.right > hostRect.right + 1
        || r.top < hostRect.top - 1
        || r.bottom > hostRect.bottom + 1
        || el.scrollWidth > el.clientWidth + 1
      );
      if (cut) clippedControls.push(String(el.textContent || '').trim().slice(0, 80));
    }
    const style = textEl ? getComputedStyle(textEl) : null;
    const scrollWidth = textEl ? textEl.scrollWidth : 0;
    const clientWidth = textEl ? textEl.clientWidth : 0;
    const scrollHeight = textEl ? textEl.scrollHeight : 0;
    const clientHeight = textEl ? textEl.clientHeight : 0;
    const pillScrollHeight = message ? message.scrollHeight : 0;
    const pillClientHeight = message ? message.clientHeight : 0;
    const fits = Boolean(textEl && message)
      && scrollWidth <= clientWidth + 1
      && scrollHeight <= clientHeight + 1
      && pillScrollHeight <= pillClientHeight + 1
      && linesInside
      && lineRects.length <= 2
      && style?.textOverflow !== 'ellipsis'
      && style?.whiteSpace !== 'nowrap';
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      text: String(textEl?.textContent || ''),
      title: message?.getAttribute('title') || '',
      scrollWidth,
      clientWidth,
      scrollHeight,
      clientHeight,
      pillScrollHeight,
      pillClientHeight,
      lineCount: lineRects.length,
      linesInside,
      fontSize: style?.fontSize || null,
      fits,
      textOverflow: style?.textOverflow || null,
      whiteSpace: style?.whiteSpace || null,
      stripBottom: strip ? Math.round(strip.bottom) : null,
      readoutTop: readout && !readout.hidden ? Math.round(readout.top) : null,
      worldCargoTop: cargo && !cargo.hidden ? Math.round(cargo.top) : null,
      clearsReadout: !readout || readout.hidden || !strip || strip.bottom <= readout.top + 0.5,
      clearsWorldCargo: !cargo || cargo.hidden || !strip || strip.bottom <= cargo.top + 0.5,
      pillOverlaps,
      occluders,
      clippedControls,
      pills: pillBoxes.map((pill) => ({
        text: pill.text,
        left: Math.round(pill.left),
        right: Math.round(pill.right),
        top: Math.round(pill.top),
        bottom: Math.round(pill.bottom),
      })),
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

async function shot(page, name) {
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

async function showCaptain(page) {
  await page.evaluate(() => {
    globalThis.BM1Probe.startGame('ferengi', {
      arena: { clearTraffic: true, latinum: 1600, hull: 100, shields: 100 },
    });
    globalThis.BM1Probe.paint?.();
  });
  await page.waitForTimeout(200);
}

async function showDocked(page) {
  await page.evaluate(() => {
    const cargo = globalThis.__BM1_PROBE__?.worldCargo;
    if (cargo?.placeAtWorld) cargo.placeAtWorld();
    globalThis.BM1Probe.tryDockPlanet();
    globalThis.BM1Probe.paint?.();
  });
  await page.waitForTimeout(200);
}

async function showWorst(page, text) {
  await page.evaluate((message) => {
    const cargo = globalThis.__BM1_PROBE__?.worldCargo;
    if (cargo?.undock) cargo.undock();
    const setStatus = globalThis.__BM1_PROBE__?.setStatus;
    if (typeof setStatus !== 'function') throw new Error('setStatus probe missing');
    setStatus(message);
    globalThis.BM1Probe.paint?.();
  }, text);
  await page.waitForTimeout(200);
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
    await showCaptain(page);
    await shot(page, '01-captain-aboard');
    const captain = mode === 'after' ? await page.evaluate(measureHeaderStrip()) : null;
    await showDocked(page);
    await shot(page, '02-docked-ferenginar');
    const docked = mode === 'after' ? await page.evaluate(measureHeaderStrip()) : null;
    let worst = null;
    const worstText = longestHeaderStatusMessage();
    if (mode === 'after') {
      await showWorst(page, worstText);
      await shot(page, '03-worst-case');
      worst = await page.evaluate(measureHeaderStrip());
      const overflow = {
        viewport: { width: 1280, height: 720 },
        measuredOn: '.top-message-text',
        clippedControls: [...new Set([
          ...(captain?.clippedControls || []),
          ...(docked?.clippedControls || []),
          ...(worst?.clippedControls || []),
        ])],
        occluders: [...new Set([
          ...(captain?.occluders || []),
          ...(docked?.occluders || []),
          ...(worst?.occluders || []),
          ...(captain?.pillOverlaps || []),
          ...(docked?.pillOverlaps || []),
          ...(worst?.pillOverlaps || []),
        ])],
        pillOverlaps: [...new Set([
          ...(captain?.pillOverlaps || []),
          ...(docked?.pillOverlaps || []),
          ...(worst?.pillOverlaps || []),
        ])],
        statusScrollFits: captain?.fits === true && docked?.fits === true && worst?.fits === true,
        captain: {
          text: captain?.text,
          scrollWidth: captain?.scrollWidth,
          clientWidth: captain?.clientWidth,
          scrollHeight: captain?.scrollHeight,
          clientHeight: captain?.clientHeight,
          pillScrollHeight: captain?.pillScrollHeight,
          pillClientHeight: captain?.pillClientHeight,
          lineCount: captain?.lineCount,
          linesInside: captain?.linesInside === true,
          fontSize: captain?.fontSize,
          fits: captain?.fits === true,
          stripBottom: captain?.stripBottom,
          clearsReadout: captain?.clearsReadout === true,
          clearsWorldCargo: captain?.clearsWorldCargo === true,
        },
        docked: {
          text: docked?.text,
          scrollWidth: docked?.scrollWidth,
          clientWidth: docked?.clientWidth,
          scrollHeight: docked?.scrollHeight,
          clientHeight: docked?.clientHeight,
          pillScrollHeight: docked?.pillScrollHeight,
          pillClientHeight: docked?.pillClientHeight,
          lineCount: docked?.lineCount,
          linesInside: docked?.linesInside === true,
          fontSize: docked?.fontSize,
          fits: docked?.fits === true,
          stripBottom: docked?.stripBottom,
          clearsReadout: docked?.clearsReadout === true,
          clearsWorldCargo: docked?.clearsWorldCargo === true,
        },
        worstCase: {
          text: worst?.text,
          expected: worstText,
          title: worst?.title,
          scrollWidth: worst?.scrollWidth,
          clientWidth: worst?.clientWidth,
          scrollHeight: worst?.scrollHeight,
          clientHeight: worst?.clientHeight,
          pillScrollHeight: worst?.pillScrollHeight,
          pillClientHeight: worst?.pillClientHeight,
          lineCount: worst?.lineCount,
          linesInside: worst?.linesInside === true,
          fontSize: worst?.fontSize,
          fits: worst?.fits === true && worst?.text === worstText && worst?.title === worstText,
          stripBottom: worst?.stripBottom,
          readoutTop: worst?.readoutTop,
          worldCargoTop: worst?.worldCargoTop,
          clearsReadout: worst?.clearsReadout === true,
          clearsWorldCargo: worst?.clearsWorldCargo === true,
          textOverflow: worst?.textOverflow,
        },
      };
      fs.writeFileSync(path.join(outDir, 'overflow.json'), JSON.stringify(overflow, null, 2));
      const ok = overflow.clippedControls.length === 0
        && overflow.occluders.length === 0
        && overflow.pillOverlaps.length === 0
        && overflow.statusScrollFits
        && overflow.worstCase.fits
        && overflow.captain.fits
        && overflow.docked.fits
        && overflow.worstCase.scrollWidth <= overflow.worstCase.clientWidth + 1
        && overflow.worstCase.scrollHeight <= overflow.worstCase.clientHeight + 1
        && overflow.worstCase.pillScrollHeight <= overflow.worstCase.pillClientHeight + 1
        && overflow.worstCase.linesInside
        && overflow.worstCase.lineCount <= 2
        && overflow.worstCase.lineCount >= 1
        && overflow.captain.clearsReadout
        && overflow.docked.clearsReadout
        && overflow.worstCase.clearsReadout
        && overflow.captain.clearsWorldCargo
        && overflow.docked.clearsWorldCargo
        && overflow.worstCase.clearsWorldCargo;
      if (!ok) {
        console.error(JSON.stringify({
          clippedControls: overflow.clippedControls,
          occluders: overflow.occluders,
          pillOverlaps: overflow.pillOverlaps,
          captain: overflow.captain,
          docked: overflow.docked,
          worstCase: overflow.worstCase,
        }, null, 2));
        process.exitCode = 1;
      }
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
