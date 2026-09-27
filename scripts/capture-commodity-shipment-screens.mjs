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
import crypto from 'node:crypto';
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

    const filled = await page.evaluate(() => {
      const api = globalThis.__BM1_PROBE__?.commodityShipment;
      const p8 = globalThis.__BM1_PROBE__?.phase8;
      const probe = globalThis.BM1Probe;
      if (!api || !p8) return { missing: true };
      probe?.freezeLoop?.();
      globalThis.__BM1_PROBE__?.worldCargo?.placeAtWorld?.();
      probe?.tryDockPlanet?.();
      document.querySelector('[data-dock-tab="market"]')?.click();
      api.emptyHold?.();
      const here = globalThis.__BM1_PROBE__.snapshot().currentPlanet;
      const goods = [
        "Xiang's Brand Vodka",
        'Feminine Products',
        'Isolinear Chips',
        'Medical Supplies',
        'Dinner Napkins',
        'Historic Books',
        'Beetlesnuff',
        'Old Paintings',
      ];
      const buys = [];
      for (const good of goods) {
        const marketId = `mkt-cap-${good.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        p8.injectMarket({
          marketId,
          good,
          stock: 8,
          demand: 6,
          stockCap: 8,
          demandCap: 8,
          floor: 0,
          price: 10,
          systemIndex: here,
          restriction: 'open',
        });
        const before = p8.snapshot().book.markets[marketId]?.stock;
        const bought = api.playBuy(good);
        const after = p8.snapshot().book.markets[marketId]?.stock;
        buys.push({
          good,
          ok: bought?.ok === true,
          paid: bought?.paid || 0,
          stockDown: before != null && after === before - 1,
          pod: (bought?.podTons || 0) > 0,
        });
      }
      const refused = api.playBuy(goods[0]);
      const cargo = globalThis.__BM1_PROBE__?.worldCargo;
      const enrolled = [];
      for (let n = 0; n < goods.length; n += 1) {
        enrolled.push(cargo?.enroll?.({
          id: `cap-ship-${n}`,
          good: goods[n],
          tons: 1,
          legalPayout: 4,
          targetName: 'Near',
          mode: 'open',
        })?.ok === true);
      }
      api.index?.();
      const briefing = globalThis.__BM1_PROBE__?.briefingArchive;
      for (let n = 0; n < 16; n += 1) briefing?.produce?.({ strategicJumps: n + 4 });
      const filed = briefing?.produce?.({ strategicJumps: 2 });
      if (filed?.id) briefing?.select?.(filed.id);
      api.close?.();
      probe?.redraw?.();
      const snap = api.snapshot();
      return {
        buys,
        refusedReason: refused?.reason || null,
        enrolled,
        entries: (snap.commodityNames || []).length,
        records: (snap.shipmentIds || []).length,
        sales: Object.keys(snap.sales || {}).length,
      };
    });
    if (filled?.missing) throw new Error('commodityShipment probe missing');
    const buyFailed = (filled.buys || []).filter((row) => !row.ok || !row.paid || !row.stockDown || !row.pod);
    if (buyFailed.length || filled.refusedReason !== 'sale-cap' || filled.entries !== 8 || filled.records !== 8 || filled.sales !== 8 || (filled.enrolled || []).some((ok) => !ok)) {
      console.error('capped book was not filled by real trades', JSON.stringify(filled));
      process.exitCode = 1;
    }
    console.log('capped book', JSON.stringify(filled));
    const measurePaused = () => page.evaluate(() => {
      globalThis.BM1Probe?.freezeLoop?.();
      globalThis.BM1Probe?.redraw?.();
      const hashOf = () => {
        const api = globalThis.__BM1_PROBE__?.commodityShipment;
        const phase8 = globalThis.__BM1_PROBE__?.phase8?.snapshot?.() || {};
        const markets = Object.values(phase8.book?.markets || {}).map((row) => [row.marketId, row.stock, row.price, row.demand]);
        const body = JSON.stringify({
          book: api?.save?.() || {},
          markets,
          latinum: api?.snapshot?.()?.latinum ?? null,
          pods: api?.snapshot?.()?.podDigest ?? null,
        });
        let hash = 2166136261;
        for (let i = 0; i < body.length; i += 1) {
          hash ^= body.charCodeAt(i);
          hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(16);
      };
      const saveHash = hashOf();
      const mutations = [];
      const observer = new MutationObserver((records) => {
        for (const record of records) mutations.push(record.type);
      });
      for (const id of ['briefing-archive', 'world-cargo', 'planet-menu', 'target-window', 'phase10-readout', 'bottom-dock']) {
        const root = document.getElementById(id);
        if (root) observer.observe(root, { subtree: true, childList: true, attributes: true, characterData: true });
      }
      const measured = globalThis.__BM1_PROBE__.commodityShipment.measureNoClip();
      observer.disconnect();
      const saveHashAfter = hashOf();
      return { ...measured, observerMutations: mutations.length, saveHash, saveHashAfter, saveHashMatch: saveHash === saveHashAfter };
    });
    const listsOf = (row) => ({
      clippedControls: row.clippedControls,
      occluders: row.occluders,
      pillOverlaps: row.pillOverlaps,
      squashedControls: row.squashedControls,
      cutOffLines: row.cutOffLines,
      bookCounts: row.bookCounts,
      expectedCounts: row.expectedCounts,
      observerMutations: row.observerMutations,
      saveHashMatch: row.saveHashMatch,
    });
    const logRefusal = () => page.evaluate(() => {
      const api = globalThis.__BM1_PROBE__?.commodityShipment;
      const snap = api?.snapshot?.() || {};
      const line = (snap.notices || []).find((row) => /purchase refused|paid 0|at the floor|empty cargo pod/i.test(row))
        || snap.lastNotice
        || 'Hold is full. Purchase refused. The market did not move.';
      api?.log?.(line);
      return line;
    });
    const rectsOf = () => page.evaluate(() => {
      const ids = ['phase10-readout', 'briefing-archive', 'world-cargo', 'bottom-dock', 'planet-menu', 'target-window', 'minimap-panel', 'stats', 'commodity-shipment'];
      const box = (el) => {
        if (!el) return null;
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          hidden: el.classList.contains('hidden') || style.display === 'none',
          left: Math.round(rect.left),
          top: Math.round(rect.top),
          right: Math.round(rect.right),
          bottom: Math.round(rect.bottom),
        };
      };
      const book = document.querySelector('#planet-menu .commodity-book-section');
      return {
        ids: Object.fromEntries(ids.map((id) => [id, box(document.getElementById(id))])),
        book: box(book),
      };
    });
    await showCampaignAndCargo(page);
    await page.evaluate(() => {
      const book = globalThis.__BM1_PROBE__?.commodityShipment;
      book?.close?.();
      book?.clearCombatTarget?.();
      globalThis.BM1Probe?.paint?.();
    });
    await logRefusal();
    await page.waitForTimeout(150);
    await shot(page, 'after-campaign');
    const campaign = await measurePaused();
    await page.evaluate(() => {
      document.querySelector('#briefing-archive [data-commodity-book-toggle]')?.click();
      globalThis.BM1Probe?.paint?.();
    });
    await logRefusal();
    await page.waitForTimeout(150);
    await shot(page, 'after-briefing');
    const briefing = await measurePaused();
    const briefingFit = await page.evaluate(() => {
      const archive = document.getElementById('briefing-archive');
      const box = (el) => {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          height: Math.round(rect.height),
          text: String(el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80),
        };
      };
      const scroll = archive?.querySelector('.commodity-book-scroll');
      return {
        pill: box(archive?.querySelector('[data-briefing-select]')),
        jump: box(archive?.querySelector('.briefing-jump')),
        body: box(archive?.querySelector('.briefing-archive-body')),
        buy: box(archive?.querySelector('[data-commodity-buy]')),
        book: box(archive?.querySelector(':scope > .commodity-book-section')),
        scroll: scroll ? {
          client: scroll.clientHeight,
          scroll: scroll.scrollHeight,
          bar: scroll.offsetWidth - scroll.clientWidth,
        } : null,
        lines: [...(archive?.querySelectorAll('.briefing-line') || [])].map((el) => box(el)),
      };
    });
    console.log('briefing fit', JSON.stringify(briefingFit));
    console.log('briefing rects', JSON.stringify(await rectsOf()));
    await page.evaluate(() => {
      const book = globalThis.__BM1_PROBE__?.commodityShipment;
      if (document.querySelector('#briefing-archive > .commodity-book-section')) {
        document.querySelector('#briefing-archive [data-commodity-book-toggle]')?.click();
      }
      book?.close?.();
      globalThis.BM1Probe?.paint?.();
    });
    await logRefusal();
    await page.evaluate(() => {
      document.getElementById('phase10-readout')?.classList.add('hidden');
    });
    await page.waitForTimeout(150);
    await shot(page, 'after-world-cargo');
    const worldCargo = await measurePaused();
    await showCampaignAndCargo(page);
    await page.evaluate(() => {
      globalThis.__BM1_PROBE__?.commodityShipment?.close?.();
      globalThis.__BM1_PROBE__?.commodityShipment?.clearCombatTarget?.();
      const spawned = globalThis.BM1Probe?.spawnShip?.({
        id: 'shot-odyssey',
        name: 'SS Odyssey',
        faction: 'ferengi',
        attitude: 'neutral',
      });
      globalThis.__BM1_PROBE__?.boarding?.selectTarget?.(spawned?.id || 'shot-odyssey');
      globalThis.BM1Probe?.paint?.();
    });
    await logRefusal();
    await page.waitForTimeout(200);
    await shot(page, 'after-target-undocked');
    const target = await measurePaused();
    console.log('target rects', JSON.stringify(await rectsOf()));
    await page.evaluate(() => {
      document.querySelector('#briefing-archive [data-commodity-book-toggle]')?.click();
      globalThis.BM1Probe?.paint?.();
    });
    await logRefusal();
    await page.waitForTimeout(200);
    await shot(page, 'after-book-target');
    const bookTarget = await measurePaused();
    console.log('book-target rects', JSON.stringify(await rectsOf()));
    await page.evaluate(() => {
      const boarding = globalThis.__BM1_PROBE__?.boarding;
      boarding?.injectHullRatio?.('shot-odyssey', 0.10);
      globalThis.BM1Probe?.paint?.();
    });
    await page.waitForTimeout(200);
    await shot(page, 'after-book-target-low-hull');
    const bookTargetLow = await measurePaused();
    console.log('book-target-low rects', JSON.stringify(await rectsOf()));
    await showDockMarket(page);
    await page.evaluate(() => {
      globalThis.__BM1_PROBE__?.commodityShipment?.clearCombatTarget?.();
      globalThis.BM1Probe?.paint?.();
    });
    await logRefusal();
    await page.waitForTimeout(150);
    await shot(page, 'after-dock-market');
    const dock = await measurePaused();
    console.log('dock rects', JSON.stringify(await rectsOf()));
    const countsMatch = (row) => row.bookCounts
      && row.expectedCounts
      && row.bookCounts.entries === row.expectedCounts.entries
      && row.bookCounts.records === row.expectedCounts.records
      && row.bookCounts.lines === row.expectedCounts.lines;
    const atCap = (row) => countsMatch(row) && row.bookCounts.entries === 8 && row.bookCounts.records === 8;
    const empty = (row) => row.clippedControls.length === 0 && row.occluders.length === 0 && row.pillOverlaps.length === 0
      && row.squashedControls.length === 0 && row.cutOffLines.length === 0 && row.nameCut !== true
      && row.observerMutations === 0 && row.saveHashMatch === true && countsMatch(row);
    const states = {
      briefing: listsOf(briefing),
      campaign: listsOf(campaign),
      worldCargo: listsOf(worldCargo),
      target: listsOf(target),
      bookTarget: listsOf(bookTarget),
      bookTargetLow: listsOf(bookTargetLow),
      dock: listsOf(dock),
    };
    const report = {
      viewport: dock.viewport,
      clippedControls: [],
      occluders: [],
      pillOverlaps: [],
      squashedControls: [],
      cutOffLines: [],
      states,
    };
    const failed = [briefing, campaign, worldCargo, target, bookTarget, bookTargetLow, dock].filter((row) => !empty(row));
    if (![bookTarget, bookTargetLow, dock].every(atCap)) {
      console.error('full-state counts are not at the caps', JSON.stringify({
        bookTarget: bookTarget.bookCounts,
        bookTargetLow: bookTargetLow.bookCounts,
        dock: dock.bookCounts,
      }));
      process.exitCode = 1;
    }
    if (failed.length) {
      report.clippedControls = failed.flatMap((row) => row.clippedControls);
      report.occluders = failed.flatMap((row) => row.occluders);
      report.pillOverlaps = failed.flatMap((row) => row.pillOverlaps);
      report.squashedControls = failed.flatMap((row) => row.squashedControls);
      report.cutOffLines = failed.flatMap((row) => row.cutOffLines);
    }
    fs.writeFileSync(path.join(outDir, 'noclip.json'), `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({
      campaign: { bookText: campaign.bookText, panels: campaign.panels, ...listsOf(campaign) },
      briefing: { bookText: briefing.bookText, panels: briefing.panels, ...listsOf(briefing) },
      worldCargo: { panels: worldCargo.panels, ...listsOf(worldCargo) },
      target: { bookText: target.bookText, headerText: target.headerText, panels: target.panels, ...listsOf(target) },
      bookTarget: { bookText: bookTarget.bookText, headerText: bookTarget.headerText, panels: bookTarget.panels, ...listsOf(bookTarget) },
      bookTargetLow: { bookText: bookTargetLow.bookText, headerText: bookTargetLow.headerText, panels: bookTargetLow.panels, ...listsOf(bookTargetLow) },
      dock: { bookText: dock.bookText, headerText: dock.headerText, panels: dock.panels, ...listsOf(dock) },
    }, null, 2));
    const duplicate = path.join(outDir, 'after-book-panel.png');
    if (fs.existsSync(duplicate)) fs.unlinkSync(duplicate);
    const afterNames = ['after-campaign', 'after-briefing', 'after-world-cargo', 'after-target-undocked', 'after-book-target', 'after-book-target-low-hull', 'after-dock-market'];
    const hashes = afterNames.map((name) => crypto.createHash('sha256').update(fs.readFileSync(path.join(outDir, `${name}.png`))).digest('hex'));
    console.log('after hashes', Object.fromEntries(afterNames.map((name, index) => [name, hashes[index].slice(0, 12)])));
    if (new Set(hashes).size !== hashes.length) {
      console.error('after shots are not all distinct');
      process.exitCode = 1;
    }
    if (failed.length) {
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
