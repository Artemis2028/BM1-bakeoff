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
    globalThis.BM1Probe?.closeMap?.();
    globalThis.BM1Probe?.freezeLoop?.();
    globalThis.BM1Probe?.redraw?.();
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
    globalThis.__BM1_PROBE__?.worldCargo?.undock?.();
    globalThis.BM1Probe?.freezeLoop?.();
    globalThis.BM1Probe?.redraw?.();
  });
}

async function showDockMarket(page) {
  await page.evaluate(() => {
    globalThis.BM1Probe?.worldCargo?.placeAtWorld?.();
    globalThis.BM1Probe?.tryDockPlanet?.();
    globalThis.BM1Probe?.freezeLoop?.();
    globalThis.BM1Probe?.redraw?.();
    document.querySelector('#planet-menu [data-dock-tab="market"]')?.click();
    globalThis.BM1Probe?.freezeLoop?.();
    globalThis.BM1Probe?.redraw?.();
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
        globalThis.BM1Probe?.freezeLoop?.();
      globalThis.BM1Probe?.redraw?.();
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
    const measurePaused = (mustShow = []) => page.evaluate((mustShow) => {
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
      const measured = globalThis.__BM1_PROBE__.commodityShipment.measureNoClip(mustShow);
      observer.disconnect();
      const saveHashAfter = hashOf();
      return { ...measured, observerMutations: mutations.length, saveHash, saveHashAfter, saveHashMatch: saveHash === saveHashAfter };
    }, mustShow);
    const listsOf = (row) => ({
      clippedControls: row.clippedControls,
      occluders: row.occluders,
      pillOverlaps: row.pillOverlaps,
      squashedControls: row.squashedControls,
      cutOffLines: row.cutOffLines,
      bookCounts: row.bookCounts,
      reachableCounts: row.reachableCounts,
      expectedCounts: row.expectedCounts,
      mustShow: row.mustShow,
      doctrine: row.doctrine,
      doctrineBefore: row.doctrineBefore || null,
      targetCard: row.targetCard,
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
    const initialDoctrine = await page.evaluate(() => globalThis.__BM1_PROBE__.commodityShipment.doctrineFacts());
    const failStep = (step, detail) => {
      console.error(`setup step failed: ${step}`, typeof detail === 'string' ? detail : JSON.stringify(detail));
      process.exitCode = 1;
    };
    const solutionKey = (row) => `${row?.id || ''}\t${row?.source || ''}`;
    const sameSolutions = (left, right) => {
      const a = [...(left || [])].map(solutionKey).sort();
      const b = [...(right || [])].map(solutionKey).sort();
      return a.length === b.length && a.every((key, index) => key === b[index]);
    };
    const doctrineDrift = (actual, expected) => {
      const names = [];
      if (!actual || actual.roe !== expected.roe) names.push('roe');
      if (!actual || actual.engagement_authorized !== expected.engagement_authorized) names.push('engagement_authorized');
      if (!actual || !sameSolutions(actual.firingSolutions, expected.firingSolutions)) names.push('firingSolutions');
      return names;
    };
    const assertDoctrine = (step, actual, expected) => {
      const drift = doctrineDrift(actual, expected);
      if (!drift.length) return true;
      failStep(step, { drift, actual, expected });
      return false;
    };
    const addedSolutions = (before, after) => {
      const seen = new Set((before?.firingSolutions || []).map(solutionKey));
      return (after?.firingSolutions || []).filter((row) => !seen.has(solutionKey(row)));
    };
    const assertUnchanged = (before, after, step) => assertDoctrine(step, after, {
      roe: before?.roe,
      engagement_authorized: before?.engagement_authorized,
      firingSolutions: before?.firingSolutions || [],
    });
    const withBefore = (row, before) => ({ ...row, doctrineBefore: before });
    const briefingLine = await page.evaluate(() => {
      const el = document.querySelector('#briefing-archive .briefing-line');
      return String(el?.textContent || '').replace(/\s+/g, ' ').trim();
    });
    if (!briefingLine) failStep('briefing-line', 'no filed briefing line');
    const cardHigh = [
      { selector: '#target-window .target-window-head b', text: 'SS Odyssey' },
      { selector: '#target-window .target-meter-head', text: 'Hull100%' },
      { selector: '#target-window [data-hail-action="hail"]', text: 'Hail Ship' },
      { selector: '#target-window .target-boarding-note', text: 'Tractor hold is not a capture.' },
      { selector: '#target-window .target-boarding-note', text: 'Hull above 10%. Boarding refused. · hull-above-threshold' },
    ];
    const cardLow = [
      { selector: '#target-window .target-window-head b', text: 'SS Odyssey' },
      { selector: '#target-window .target-meter-head', text: 'Hull10%' },
      { selector: '#target-window [data-hail-action="hail"]', text: 'Hail Ship' },
      { selector: '#target-window .target-boarding-note', text: 'Tractor hold is not a capture.' },
      { selector: '#target-window .target-boarding-note', text: 'Hull at or below 10%. Boarding available — tractor hold is not a capture.' },
      { selector: '#target-window [data-board-action="capture"]', text: 'Capture', enabled: true },
      { selector: '#target-window [data-board-action="scuttle"]', text: 'Scuttle', enabled: true },
    ];
    const bookHead = [
      { selector: '#briefing-archive .commodity-shipment-title', text: 'COMMODITY BOOK' },
      { selector: '#briefing-archive .commodity-entry', text: "Xiang's Brand Vodka" },
    ];
    const briefingTop = [{ selector: '#briefing-archive .briefing-line', text: briefingLine }];
    const archivePoint = () => page.evaluate(() => {
      const host = document.getElementById('briefing-archive');
      const rect = host?.getBoundingClientRect();
      if (!rect || rect.width < 20) return null;
      return { x: Math.round(rect.left + Math.min(48, rect.width / 3)), y: Math.round(rect.top + 28) };
    });
    const wheelTo = async (point, mustShow, step) => {
      if (!point) {
        failStep(step, 'no wheel point');
        return false;
      }
      await page.mouse.move(point.x, point.y);
      let wheeled = false;
      for (let stepN = 0; stepN < 48; stepN += 1) {
        const place = await page.evaluate((mustShow) => {
          const row = globalThis.__BM1_PROBE__.commodityShipment.measureNoClip(mustShow);
          if (row.mustShow.ok) return 'ready';
          const host = document.getElementById('briefing-archive')?.getBoundingClientRect();
          const missing = row.mustShow.missing?.[0];
          const wanted = String(missing?.text || '').replace(/\s+/g, ' ').trim();
          const el = missing ? [...document.querySelectorAll(missing.selector)].find((node) => String(node.textContent || '').replace(/\s+/g, ' ').trim() === wanted) : null;
          const box = el?.getBoundingClientRect();
          if (!box || !host) return 'below';
          if (box.bottom < host.top + 4) return 'above';
          return 'below';
        }, mustShow);
        if (place === 'ready' && wheeled) return true;
        await page.mouse.wheel(0, place === 'above' ? -110 : 130);
        wheeled = true;
        await page.waitForTimeout(30);
      }
      failStep(step, 'wheel did not bring the row into view');
      return false;
    };
    const openBook = async (step) => {
      const scroll = await page.evaluate(() => {
        const host = document.getElementById('briefing-archive');
        const before = host?.scrollTop || 0;
        document.querySelector('#briefing-archive [data-commodity-book-toggle]')?.click();
        globalThis.BM1Probe?.freezeLoop?.();
        globalThis.BM1Probe?.redraw?.();
        return { before, after: host?.scrollTop || 0 };
      });
      if (scroll.before !== scroll.after) failStep(step, scroll);
      return scroll.before === scroll.after;
    };
    await page.evaluate(() => {
      const book = globalThis.__BM1_PROBE__?.commodityShipment;
      book?.close?.();
      book?.clearCombatTarget?.();
      globalThis.BM1Probe?.freezeLoop?.();
      globalThis.BM1Probe?.redraw?.();
    });
    await logRefusal();
    await page.waitForTimeout(150);
    await shot(page, 'after-campaign');
    const campaign = withBefore(await measurePaused(), initialDoctrine);
    if (!(await openBook('briefing-open'))) return;
    await logRefusal();
    await page.waitForTimeout(150);
    await shot(page, 'after-briefing');
    const briefing = withBefore(await measurePaused(briefingTop), initialDoctrine);
    const point = await archivePoint();
    await wheelTo(point, bookHead, 'briefing-book-wheel');
    await shot(page, 'after-briefing-book');
    const briefingBook = withBefore(await measurePaused(bookHead), initialDoctrine);
    await page.evaluate(() => {
      const book = globalThis.__BM1_PROBE__?.commodityShipment;
      if (document.querySelector('#briefing-archive > .commodity-book-section')) {
        document.querySelector('#briefing-archive [data-commodity-book-toggle]')?.click();
      }
      book?.close?.();
      globalThis.BM1Probe?.freezeLoop?.();
      globalThis.BM1Probe?.redraw?.();
    });
    await logRefusal();
    await page.waitForTimeout(150);
    await shot(page, 'after-world-cargo');
    const worldCargo = withBefore(await measurePaused(), initialDoctrine);
    await showCampaignAndCargo(page);
    const lockPrep = await page.evaluate(() => {
      const probe = globalThis.BM1Probe;
      const facts = () => globalThis.__BM1_PROBE__.commodityShipment.doctrineFacts();
      const before = facts();
      globalThis.__BM1_PROBE__?.commodityShipment?.close?.();
      globalThis.__BM1_PROBE__?.commodityShipment?.clearCombatTarget?.();
      const spawned = probe.spawnShip({
        id: 'shot-odyssey',
        name: 'SS Odyssey',
        faction: 'ferengi',
        attitude: 'neutral',
        speed: 0,
      });
      if (!spawned?.id) return { ok: false, step: 'spawn', before };
      const origin = { x: spawned.x - 240, y: spawned.y };
      const obstacles = [
        origin,
        ...(probe.snapshot?.().npcShips || [])
          .filter((row) => row && !row.destroyed && row.id !== spawned.id)
          .map((row) => ({ x: Number(row.x) || 0, y: Number(row.y) || 0 })),
      ];
      let clearSky = null;
      for (let x = origin.x - 2800; x <= origin.x + 2800 && !clearSky; x += 400) {
        for (let y = origin.y - 2800; y <= origin.y + 2800; y += 400) {
          const clear = obstacles.every((row) => Math.hypot(row.x - x, row.y - y) > 2000);
          if (clear) clearSky = { x, y };
        }
      }
      if (!clearSky) return { ok: false, step: 'sensor-paint', before, reason: 'no-clear-sky' };
      probe.placePlayer(clearSky.x, clearSky.y);
      const playerX = clearSky.x;
      const playerY = clearSky.y;
      const canvas = document.getElementById('game');
      const rect = canvas.getBoundingClientRect();
      const offsets = [];
      for (const dx of [-220, -160, -100, -40, 40, 100, 160, 220, 260]) {
        for (const dy of [-210, -150, -90, -30, 40, 110]) {
          const dist = Math.hypot(dx, dy);
          if (dist < 90 || dist > 360) continue;
          offsets.push([dx, dy, dist]);
        }
      }
      offsets.sort((a, b) => a[2] - b[2]);
      let last = null;
      for (const [dx, dy, dist] of offsets) {
        probe.patchShip('shot-odyssey', {
          x: playerX + dx,
          y: playerY + dy,
          speed: 0,
          destination: { x: playerX + dx, y: playerY + dy },
        });
        probe.paint();
        probe.freezeLoop();
        const screen = probe.screenOf('shot-odyssey');
        const distance = probe.ship('shot-odyssey')?.playerDistance;
        if (!screen || !Number.isFinite(distance)) continue;
        const x = rect.left + screen.x * (rect.width / canvas.width);
        const y = rect.top + screen.y * (rect.height / canvas.height);
        const after = facts();
        const hit = (x >= 2 && y >= 2 && x <= window.innerWidth - 2 && y <= window.innerHeight - 2)
          ? document.elementFromPoint(x, y)
          : null;
        const onCanvas = Boolean(hit && (hit === canvas || canvas.contains(hit)));
        last = {
          dx, dy, dist: Math.round(distance), x: Math.round(x), y: Math.round(y),
          onCanvas,
          hit: hit ? (hit.id || String(hit.className || '') || hit.tagName) : null,
          after,
        };
        if (onCanvas && distance >= 100 && distance <= 360 && after.roe === before.roe && after.engagement_authorized === false && !after.boardingOutcome && !after.lastRefuse) {
          return { ok: true, step: 'sensor-paint', before, spawnedId: spawned.id, ...last };
        }
      }
      return { ok: false, step: 'lock-sky', before, last };
    });
    console.log('target lock prep', JSON.stringify(lockPrep));
    const newFiringSolutions = lockPrep.ok ? addedSolutions(lockPrep.before, lockPrep.after) : [];
    const paintedSolutions = [{ id: 'shot-odyssey', source: 'passive' }];
    if (!lockPrep.ok) {
      failStep(lockPrep.step || 'lock-sky', lockPrep);
    } else if (lockPrep.before.roe !== lockPrep.after.roe) {
      failStep('sensor-paint', { drift: ['roe'], before: lockPrep.before, after: lockPrep.after });
    } else if (lockPrep.after.engagement_authorized !== false) {
      failStep('sensor-paint', { drift: ['engagement_authorized'], before: lockPrep.before, after: lockPrep.after });
    } else if (!newFiringSolutions.length || newFiringSolutions.some((row) => row.id !== 'shot-odyssey' || row.source !== 'passive')) {
      failStep('sensor-paint', {
        drift: ['firingSolutions'],
        newFiringSolutions,
        before: lockPrep.before?.firingSolutions || [],
        after: lockPrep.after?.firingSolutions || [],
      });
    } else if (!sameSolutions(lockPrep.after?.firingSolutions, paintedSolutions)) {
      failStep('sensor-paint', {
        drift: ['firingSolutions'],
        newFiringSolutions,
        before: lockPrep.before?.firingSolutions || [],
        after: lockPrep.after?.firingSolutions || [],
        expected: paintedSolutions,
      });
    }
    let locked = { hidden: true, facts: lockPrep.after, text: '' };
    if (lockPrep.ok) {
      await page.mouse.click(lockPrep.x, lockPrep.y);
      locked = await page.evaluate(() => {
        globalThis.BM1Probe?.freezeLoop?.();
        globalThis.BM1Probe?.redraw?.();
        const card = document.getElementById('target-window');
        const hidden = !card || card.classList.contains('hidden') || getComputedStyle(card).display === 'none';
        return {
          hidden,
          text: hidden ? '' : String(card.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 260),
          facts: globalThis.__BM1_PROBE__.commodityShipment.doctrineFacts(),
        };
      });
      console.log('target lock click', JSON.stringify(locked));
      if (locked.hidden || !/odyssey/i.test(locked.text || '')) failStep('lock-click', locked);
      else if (!assertDoctrine('lock-click', locked.facts, {
        roe: lockPrep.before.roe,
        engagement_authorized: false,
        firingSolutions: paintedSolutions,
      })) {
        /* drift names are logged by assertDoctrine */
      } else if (locked.facts.firingSolution !== lockPrep.after.firingSolution) {
        failStep('lock-click', { drift: ['firingSolution'], before: lockPrep.after, after: locked.facts });
      } else if (locked.facts.targetFiringSolution === true && locked.facts.firingSolutionSource !== 'passive') {
        failStep('lock-click', { drift: ['firingSolutionSource'], facts: locked.facts });
      }
    }
    const afterLock = locked.facts || lockPrep.after;
    await logRefusal();
    await page.waitForTimeout(200);
    await shot(page, 'after-target-undocked');
    const target = withBefore(await measurePaused(cardHigh), lockPrep.before);
    if (!(await openBook('book-target-open'))) return;
    await logRefusal();
    await page.waitForTimeout(200);
    await shot(page, 'after-book-target');
    const bookTarget = withBefore(await measurePaused([...briefingTop, ...cardHigh]), lockPrep.before);
    await wheelTo(await archivePoint(), [...bookHead, ...cardHigh], 'book-target-wheel');
    await shot(page, 'after-book-target-book');
    const bookTargetBook = withBefore(await measurePaused([...bookHead, ...cardHigh]), lockPrep.before);
    const hull = await page.evaluate(() => {
      const facts = () => globalThis.__BM1_PROBE__.commodityShipment.doctrineFacts();
      const before = facts();
      const result = globalThis.__BM1_PROBE__?.boarding?.injectHullRatio?.('shot-odyssey', 0.10);
      globalThis.BM1Probe?.freezeLoop?.();
      globalThis.BM1Probe?.redraw?.();
      return { result, before, after: facts() };
    });
    console.log('low hull', JSON.stringify(hull));
    if (!hull?.result || hull.result.ok !== true) failStep('low-hull', hull);
    else if (!assertUnchanged(hull.before, hull.after, 'low-hull')) {
      /* named above */
    } else if (hull.after.boardingOutcome || hull.after.lastRefuse) {
      failStep('low-hull', { outcome: hull.after.boardingOutcome, lastRefuse: hull.after.lastRefuse });
    }
    await wheelTo(await archivePoint(), [...briefingTop, ...cardLow], 'book-target-low-top');
    await page.waitForTimeout(200);
    await shot(page, 'after-book-target-low-hull');
    const bookTargetLow = withBefore(await measurePaused([...briefingTop, ...cardLow]), lockPrep.before);
    await wheelTo(await archivePoint(), [...bookHead, ...cardLow], 'book-target-low-wheel');
    await shot(page, 'after-book-target-low-hull-book');
    const bookTargetLowBook = withBefore(await measurePaused([...bookHead, ...cardLow]), lockPrep.before);
    await showDockMarket(page);
    const dockScroll = await page.evaluate(() => {
      globalThis.__BM1_PROBE__?.commodityShipment?.clearCombatTarget?.();
      globalThis.BM1Probe?.freezeLoop?.();
      globalThis.BM1Probe?.redraw?.();
      return {
        panel: document.querySelector('#planet-menu .dock-panel')?.scrollTop || 0,
        book: document.querySelector('#planet-menu .commodity-book-scroll')?.scrollTop || 0,
      };
    });
    if (dockScroll.panel !== 0 || dockScroll.book !== 0) failStep('dock-open-scroll', dockScroll);
    const shopText = await page.evaluate(() => {
      const good = document.querySelector('#planet-menu .market-good');
      return String(good?.textContent || '').replace(/\s+/g, ' ').trim();
    });
    const lastBookLine = await page.evaluate(() => {
      const lines = [...document.querySelectorAll('#planet-menu .commodity-book-scroll .commodity-shipment-line')];
      return String(lines.at(-1)?.textContent || '').replace(/\s+/g, ' ').trim();
    });
    if (!shopText) failStep('dock-shop', 'no shop row');
    if (!lastBookLine) failStep('dock-last-line', 'no book line');
    const dockMust = [
      { selector: '#planet-menu .commodity-shipment-title', text: 'COMMODITY BOOK' },
      { selector: '#planet-menu [data-commodity-buy]', text: 'Buy one ton' },
      { selector: '#planet-menu .panel-head', text: 'Cargo Market' },
      { selector: '#planet-menu .market-good', text: shopText },
      { selector: '#planet-menu [data-market-buy]', text: 'Buy' },
      { selector: '#planet-menu [data-market-sell]', text: 'Sell' },
    ];
    const dockLast = [
      { selector: '#planet-menu .commodity-book-scroll .commodity-shipment-line', text: lastBookLine },
    ];
    await logRefusal();
    await page.waitForTimeout(150);
    await shot(page, 'after-dock-market');
    const dock = withBefore(await measurePaused(dockMust), lockPrep.before);
    const bookPoint = await page.evaluate(() => {
      const scroll = document.querySelector('#planet-menu .commodity-book-scroll');
      const rect = scroll?.getBoundingClientRect();
      if (!rect || rect.width < 8 || rect.height < 8) return null;
      return { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) };
    });
    if (!bookPoint) failStep('dock-book-wheel', 'book scroller is not on screen');
    else {
      await page.mouse.move(bookPoint.x, bookPoint.y);
      let ready = false;
      let wheeled = false;
      for (let stepN = 0; stepN < 48 && !ready; stepN += 1) {
        const place = await page.evaluate((mustShow) => {
          const row = globalThis.__BM1_PROBE__.commodityShipment.measureNoClip(mustShow);
          if (row.mustShow.ok) return 'ready';
          const host = document.querySelector('#planet-menu .commodity-book-scroll')?.getBoundingClientRect();
          const line = [...document.querySelectorAll('#planet-menu .commodity-book-scroll .commodity-shipment-line')].at(-1);
          const box = line?.getBoundingClientRect();
          if (!box || !host) return 'below';
          if (box.bottom < host.top + 4) return 'above';
          return 'below';
        }, dockLast);
        if (place === 'ready' && wheeled) {
          ready = true;
          break;
        }
        await page.mouse.wheel(0, place === 'above' ? -90 : 100);
        wheeled = true;
        await page.waitForTimeout(30);
      }
      if (!ready) failStep('dock-book-wheel', lastBookLine);
    }
    await shot(page, 'after-dock-market-book');
    const dockBook = withBefore(await measurePaused(dockLast), lockPrep.before);
    const sumCounts = (row) => ({
      entries: row.bookCounts.entries + row.reachableCounts.entries,
      records: row.bookCounts.records + row.reachableCounts.records,
      lines: row.bookCounts.lines + row.reachableCounts.lines,
    });
    const countsOk = (row) => {
      const got = sumCounts(row);
      return got.entries === row.expectedCounts.entries
        && got.records === row.expectedCounts.records
        && got.lines === row.expectedCounts.lines;
    };
    const atCap = (row) => countsOk(row) && row.expectedCounts.entries === 8 && row.expectedCounts.records === 8;
    const empty = (row) => row.clippedControls.length === 0 && row.occluders.length === 0 && row.pillOverlaps.length === 0
      && row.squashedControls.length === 0 && row.cutOffLines.length === 0 && row.nameCut !== true
      && row.observerMutations === 0 && row.saveHashMatch === true && row.mustShow?.ok === true && countsOk(row);
    const states = {
      campaign: listsOf(campaign),
      briefing: listsOf(briefing),
      briefingBook: listsOf(briefingBook),
      worldCargo: listsOf(worldCargo),
      target: listsOf(target),
      bookTarget: listsOf(bookTarget),
      bookTargetBook: listsOf(bookTargetBook),
      bookTargetLow: listsOf(bookTargetLow),
      bookTargetLowBook: listsOf(bookTargetLowBook),
      dock: listsOf(dock),
      dockBook: listsOf(dockBook),
    };
    const report = {
      viewport: dock.viewport,
      setup: {
        before: lockPrep.before,
        afterPaint: lockPrep.after || null,
        afterLock,
        afterHull: hull?.after || null,
        firingSolutionSource: afterLock?.firingSolutionSource || null,
        firingSolutionsBefore: lockPrep.before?.firingSolutions || [],
        firingSolutionsAfterPaint: lockPrep.after?.firingSolutions || [],
        newFiringSolutions,
        passiveFiringSolution: lockPrep.before?.firingSolution === false && afterLock?.firingSolution === true && afterLock?.firingSolutionSource === 'passive',
        lock: { dist: lockPrep.dist, x: lockPrep.x, y: lockPrep.y, onCanvas: lockPrep.onCanvas },
        shopText,
        lastBookLine,
        briefingLine,
      },
      clippedControls: [],
      occluders: [],
      pillOverlaps: [],
      squashedControls: [],
      cutOffLines: [],
      states,
    };
    const quietDoctrine = {
      roe: initialDoctrine.roe,
      engagement_authorized: false,
      firingSolutions: [],
    };
    const paintedDoctrine = {
      roe: initialDoctrine.roe,
      engagement_authorized: false,
      firingSolutions: paintedSolutions,
    };
    const doctrineExpectations = {
      campaign: quietDoctrine,
      briefing: quietDoctrine,
      briefingBook: quietDoctrine,
      worldCargo: quietDoctrine,
      target: paintedDoctrine,
      bookTarget: paintedDoctrine,
      bookTargetBook: paintedDoctrine,
      bookTargetLow: paintedDoctrine,
      bookTargetLowBook: paintedDoctrine,
      dock: paintedDoctrine,
      dockBook: paintedDoctrine,
    };
    const doctrineChecks = {};
    for (const [name, expected] of Object.entries(doctrineExpectations)) {
      const drift = doctrineDrift(states[name]?.doctrine, expected);
      doctrineChecks[name] = drift.length ? { ok: false, drift, actual: states[name]?.doctrine, expected } : { ok: true };
      if (drift.length) assertDoctrine(name, states[name]?.doctrine, expected);
    }
    report.setup.doctrineChecks = doctrineChecks;
    console.log('doctrine checks', JSON.stringify(doctrineChecks));
    if (report.setup.passiveFiringSolution !== true) {
      console.error('passiveFiringSolution', JSON.stringify({
        before: lockPrep.before?.firingSolution ?? null,
        after: afterLock?.firingSolution ?? null,
        source: afterLock?.firingSolutionSource ?? null,
        newFiringSolutions,
      }));
      process.exitCode = 1;
    }
    const measuredStates = [campaign, briefing, briefingBook, worldCargo, target, bookTarget, bookTargetBook, bookTargetLow, bookTargetLowBook, dock, dockBook];
    const failed = measuredStates.filter((row) => !empty(row));
    const capped = [briefing, briefingBook, bookTarget, bookTargetBook, bookTargetLow, bookTargetLowBook, dock, dockBook];
    if (!capped.every(atCap)) {
      console.error('full-state visible+reachable counts are not at the caps', JSON.stringify(capped.map((row) => ({
        visible: row.bookCounts,
        reachable: row.reachableCounts,
        expected: row.expectedCounts,
        mustShow: row.mustShow,
      }))));
      process.exitCode = 1;
    }
    for (const row of measuredStates) {
      if (row.mustShow?.ok === false) {
        console.error('mustShow missing', JSON.stringify(row.mustShow.missing));
        process.exitCode = 1;
      }
    }
    if (failed.length) {
      report.clippedControls = failed.flatMap((row) => row.clippedControls);
      report.occluders = failed.flatMap((row) => row.occluders);
      report.pillOverlaps = failed.flatMap((row) => row.pillOverlaps);
      report.squashedControls = failed.flatMap((row) => row.squashedControls);
      report.cutOffLines = failed.flatMap((row) => row.cutOffLines);
    }
    fs.writeFileSync(path.join(outDir, 'noclip.json'), `${JSON.stringify(report, null, 2)}\n`);
    const staleBottom = path.join(outDir, 'after-dock-market-bottom.png');
    if (fs.existsSync(staleBottom)) fs.unlinkSync(staleBottom);
    const duplicate = path.join(outDir, 'after-book-panel.png');
    if (fs.existsSync(duplicate)) fs.unlinkSync(duplicate);
    const afterNames = [
      'after-campaign', 'after-briefing', 'after-briefing-book', 'after-world-cargo', 'after-target-undocked',
      'after-book-target', 'after-book-target-book', 'after-book-target-low-hull', 'after-book-target-low-hull-book',
      'after-dock-market', 'after-dock-market-book',
    ];
    const hashes = afterNames.map((name) => crypto.createHash('md5').update(fs.readFileSync(path.join(outDir, `${name}.png`))).digest('hex'));
    console.log('after md5', Object.fromEntries(afterNames.map((name, index) => [name, hashes[index]])));
    if (new Set(hashes).size !== hashes.length) {
      console.error('after shots are not all distinct');
      process.exitCode = 1;
    }
    if (failed.length || process.exitCode) {
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
