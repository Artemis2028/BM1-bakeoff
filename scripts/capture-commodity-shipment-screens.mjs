#!/usr/bin/env node
/**
 * 1280×720 commodity-shipment shots.
 * Baseline (main, before the book panel): dock/market, campaign readout, world cargo.
 * After: the same views with #commodity-shipment open, plus no-clip JSON.
 *
 *   node scripts/capture-commodity-shipment-screens.mjs --mode baseline --out docs/commodity-shipment/screenshots
 *   node scripts/capture-commodity-shipment-screens.mjs --mode after --out docs/commodity-shipment/screenshots
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const modeIdx = args.indexOf('--mode');
const mode = modeIdx >= 0 ? args[modeIdx + 1] : 'after';
const outDir = path.resolve(root, outIdx >= 0 ? args[outIdx + 1] : 'docs/commodity-shipment/screenshots');
const PORT = Number(process.env.PROBE_PORT) || 8778;
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

function measureNoClip() {
  return () => {
    const overlap = (a, b) => a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const boxOf = (el) => {
      if (!el) return null;
      const style = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const hidden = el.classList.contains('hidden') || style.display === 'none' || style.visibility === 'hidden' || r.width < 2 || r.height < 2;
      return {
        hidden,
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        text: String(el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 240),
      };
    };
    const pillBoxes = [...document.querySelectorAll('.top-strip > *')].map((el) => {
      const box = boxOf(el);
      return box ? { ...box, text: String(el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80) } : null;
    }).filter((box) => box && !box.hidden);
    const pillOverlaps = [];
    for (let i = 0; i < pillBoxes.length; i += 1) {
      for (let j = i + 1; j < pillBoxes.length; j += 1) {
        if (overlap(pillBoxes[i], pillBoxes[j])) {
          pillOverlaps.push(`${pillBoxes[i].text} ~ ${pillBoxes[j].text}`);
        }
      }
    }
    const named = [
      ['campaign panel', document.getElementById('phase10-readout')],
      ['world cargo', document.getElementById('world-cargo')],
      ['bottom dock', document.getElementById('bottom-dock')],
      ['briefing archive', document.getElementById('briefing-archive')],
      ['planet menu', document.getElementById('planet-menu')],
      ['target window', document.getElementById('target-window')],
      ['interstellar map', document.getElementById('interstellar-map-frame')],
      ['header strip', document.querySelector('.top-strip')],
      ['commodity book', document.getElementById('commodity-shipment')],
    ];
    const surfaces = named.map(([name, el]) => {
      const box = boxOf(el);
      return box && !box.hidden ? { name, box } : null;
    }).filter(Boolean);
    const occluders = [];
    for (let i = 0; i < surfaces.length; i += 1) {
      for (let j = i + 1; j < surfaces.length; j += 1) {
        if (overlap(surfaces[i].box, surfaces[j].box)) {
          occluders.push(`${surfaces[i].name} overlaps ${surfaces[j].name}`);
        }
      }
      if (surfaces[i].name === 'commodity book') {
        for (const pill of pillBoxes) {
          if (overlap(surfaces[i].box, pill)) {
            const label = `commodity book overlaps ${pill.text}`;
            if (!occluders.includes(label)) occluders.push(label);
            const pillLabel = `commodity book ~ ${pill.text}`;
            if (!pillOverlaps.includes(pillLabel)) pillOverlaps.push(pillLabel);
          }
        }
      }
    }
    const clippedControls = [];
    const hosts = [
      document.getElementById('commodity-shipment'),
      document.getElementById('world-cargo'),
      document.getElementById('phase10-readout'),
    ].filter(Boolean);
    for (const host of hosts) {
      if (host.classList.contains('hidden')) continue;
      const hostRect = host.getBoundingClientRect();
      const nodes = [...host.querySelectorAll('button, .commodity-shipment-title, .commodity-entry, .shipment-record, .commodity-shipment-detail, .commodity-entries, .shipment-records')];
      for (const el of nodes) {
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        const outsideHost = r.left < hostRect.left - 1 || r.right > hostRect.right + 1;
        const textCut = (style.textOverflow === 'ellipsis')
          || (style.overflowX === 'hidden' && el.scrollWidth > el.clientWidth + 1 && style.whiteSpace === 'nowrap');
        if (outsideHost || textCut) {
          clippedControls.push(String(el.textContent || '').trim().slice(0, 80));
        }
      }
    }
    const bookHost = document.getElementById('commodity-shipment');
    const nameCut = bookHost ? [...bookHost.querySelectorAll('.commodity-shipment-title, .commodity-entry, .shipment-record, .commodity-shipment-detail')].some((el) => {
      const style = getComputedStyle(el);
      return style.textOverflow === 'ellipsis' || (style.whiteSpace === 'nowrap' && el.scrollWidth > el.clientWidth + 1);
    }) : false;
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      clippedControls,
      occluders,
      pillOverlaps,
      nameCut,
      bookPresent: Boolean(bookHost),
      bookHidden: !bookHost || bookHost.classList.contains('hidden'),
      bookText: String(bookHost?.innerText || '').slice(0, 1600),
      campaignText: String(document.getElementById('phase10-readout')?.innerText || '').slice(0, 400),
      worldCargoText: String(document.getElementById('world-cargo')?.innerText || '').slice(0, 400),
      dockHidden: document.getElementById('bottom-dock')?.classList.contains('hidden') === true,
      surfaces: surfaces.map((row) => ({
        name: row.name,
        left: Math.round(row.box.left),
        right: Math.round(row.box.right),
        top: Math.round(row.box.top),
        bottom: Math.round(row.box.bottom),
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
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    document.getElementById('btn-close-map')?.click();
    document.getElementById('interstellar-map-frame')?.classList.add('hidden');
    document.getElementById('interstellar-map-canvas')?.classList.add('hidden');
    const minimap = document.getElementById('minimap-panel');
    if (minimap) minimap.style.display = 'none';
    document.getElementById('briefing-archive')?.classList.add('hidden');
  });
}

async function shot(page, name) {
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

async function showCampaignAndCargo(page) {
  await page.evaluate(() => {
    const api = globalThis.__BM1_PROBE__?.worldCargo;
    api?.undock?.();
    document.getElementById('planet-menu')?.classList.add('hidden');
    document.getElementById('phase10-readout')?.classList.remove('hidden');
    document.getElementById('world-cargo')?.classList.remove('hidden');
    document.getElementById('bottom-dock')?.classList.remove('hidden');
    globalThis.BM1Probe?.paint?.();
  });
}

async function showDockMarket(page) {
  await page.evaluate(() => {
    globalThis.BM1Probe?.worldCargo?.placeAtWorld?.();
    globalThis.BM1Probe?.tryDockPlanet?.();
    globalThis.BM1Probe?.paint?.();
  });
  await page.evaluate(() => {
    const menu = document.getElementById('planet-menu');
    menu?.querySelector('[data-dock-tab="market"]')?.click();
    globalThis.BM1Probe?.paint?.();
  });
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
    if (mode === 'baseline') {
      await showCampaignAndCargo(page);
      await page.waitForTimeout(200);
      await shot(page, 'baseline-campaign');
      await page.evaluate(() => {
        const api = globalThis.__BM1_PROBE__?.worldCargo;
        if (api?.enroll) {
          api.placeAtWorld();
          api.enroll({
            id: 'baseline-wc',
            mode: 'open',
            good: 'Medical Supplies',
            tons: 2,
            targetName: 'Ferenginar',
            legalPayout: 20,
          });
          api.installPods?.('baseline-wc');
        }
        globalThis.BM1Probe?.paint?.();
      });
      await page.waitForTimeout(200);
      await shot(page, 'baseline-world-cargo');
      await showDockMarket(page);
      await shot(page, 'baseline-dock-market');
      return;
    }

    const staged = await page.evaluate(() => {
      const api = globalThis.__BM1_PROBE__?.commodityShipment;
      if (!api) return { missing: true };
      return api.stageScreenshots();
    });
    if (staged?.missing) throw new Error('commodityShipment probe missing');
    const replayCloakRefusal = () => page.evaluate(() => {
      const wc = globalThis.__BM1_PROBE__?.worldCargo;
      const book = globalThis.__BM1_PROBE__?.commodityShipment;
      wc?.undock?.();
      wc?.placeAtWorld?.();
      wc?.setCloak?.(true);
      const dropped = wc?.drop?.({ contractId: 'shot-long' });
      wc?.setCloak?.(false);
      book?.index?.();
      book?.open?.();
      return dropped?.reason || null;
    });
    const cloakReason = await replayCloakRefusal();
    console.log('staged drop', staged?.dropReason, 'replay', cloakReason);
    await showCampaignAndCargo(page);
    await page.evaluate(() => globalThis.__BM1_PROBE__?.commodityShipment?.open?.());
    await page.waitForTimeout(200);
    await shot(page, 'after-campaign');
    await page.evaluate(() => {
      globalThis.__BM1_PROBE__?.worldCargo?.placeAtWorld?.();
      globalThis.BM1Probe?.paint?.();
    });
    await page.waitForTimeout(150);
    await shot(page, 'after-world-cargo');
    await showDockMarket(page);
    await page.evaluate(() => globalThis.__BM1_PROBE__?.commodityShipment?.open?.());
    await page.waitForTimeout(150);
    await shot(page, 'after-dock-market');
    const restoredReason = await replayCloakRefusal();
    console.log('restored drop', restoredReason);
    await page.evaluate(() => {
      const api = globalThis.__BM1_PROBE__?.commodityShipment;
      document.getElementById('planet-menu')?.classList.add('hidden');
      document.getElementById('phase10-readout')?.classList.remove('hidden');
      document.getElementById('world-cargo')?.classList.remove('hidden');
      document.getElementById('bottom-dock')?.classList.remove('hidden');
      api?.clearCombatTarget?.();
      api?.open?.();
      globalThis.BM1Probe?.paint?.();
      const snap = api?.snapshot?.() || {};
      const line = (snap.notices || []).find((row) => /purchase refused|paid 0|at the floor|empty cargo pod/i.test(row))
        || snap.lastNotice
        || 'Hold is full. Purchase refused. The market did not move.';
      api?.log?.(line);
    });
    await page.waitForTimeout(150);
    await shot(page, 'after-book-panel');
    const measured = await page.evaluate(measureNoClip());
    const report = {
      viewport: measured.viewport,
      clippedControls: measured.clippedControls,
      occluders: measured.occluders,
      pillOverlaps: measured.pillOverlaps,
      nameCut: measured.nameCut,
      bookPresent: measured.bookPresent,
      bookHidden: measured.bookHidden,
    };
    fs.writeFileSync(path.join(outDir, 'noclip.json'), `${JSON.stringify(report, null, 2)}\n`);
    const headerText = await page.evaluate(() => String(document.querySelector('.top-message-text')?.textContent || ''));
    console.log(JSON.stringify({
      headerText,
      bookText: measured.bookText,
      campaignText: measured.campaignText,
      worldCargoText: measured.worldCargoText,
      surfaces: measured.surfaces,
    }, null, 2));
    if (report.clippedControls.length || report.occluders.length || report.pillOverlaps.length || report.nameCut) {
      console.error(JSON.stringify(report, null, 2));
      process.exitCode = 1;
    } else {
      console.log(JSON.stringify(report, null, 2));
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
