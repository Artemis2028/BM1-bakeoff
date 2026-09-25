#!/usr/bin/env node
/**
 * 1280×720 world-cargo shots.
 * Baseline (main, before the panel): cargo / contract / planet-dock area.
 * After: open delivery outcome and covert-drop outcome, plus no-clip JSON on #world-cargo.
 *
 *   node scripts/capture-world-cargo-screens.mjs --mode baseline --out docs/world-cargo-delivery/screenshots/baseline
 *   node scripts/capture-world-cargo-screens.mjs --mode after --out docs/world-cargo-delivery/screenshots/after
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
const outDir = path.resolve(root, outIdx >= 0 ? args[outIdx + 1] : (
  mode === 'baseline' ? 'docs/world-cargo-delivery/screenshots/baseline' : 'docs/world-cargo-delivery/screenshots/after'
));
const PORT = Number(process.env.PROBE_PORT) || 8774;
const BASE = `http://127.0.0.1:${PORT}/`;

const OPEN_OUTCOME = 'Legal delivery complete.';
const CLOAK_FAIL = 'Not a legal delivery. Inspection not cleared. Cargo still aboard.';
const COVERT_PAID = 'Covert drop at Ferenginar. Paid 27 latinum.';
const COVERT_MARK = 'Inspection not cleared.';

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

function measureWorldCargoHost() {
  return () => {
    const overlap = (a, b) => a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const host = document.getElementById('world-cargo');
    const dock = document.getElementById('bottom-dock');
    const contracts = host?.querySelector('.world-cargo-contracts') || null;
    const outcome = host?.querySelector('.world-cargo-outcome') || null;
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        hidden: el.classList.contains('hidden') || style.display === 'none',
        overflowX: el.scrollWidth > el.clientWidth + 1,
        overflowY: el.scrollHeight > el.clientHeight + 1,
        textOverflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
        scrollW: el.scrollWidth,
        clientW: el.clientWidth,
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        left: Math.round(r.left),
        right: Math.round(r.right),
        text: String(el.innerText || '').slice(0, 1600),
      };
    };
    const hostRect = host && !host.classList.contains('hidden') ? host.getBoundingClientRect() : null;
    const dockRect = dock && !dock.classList.contains('hidden') ? dock.getBoundingClientRect() : null;
    const clippedControls = [];
    const nodes = host ? [...host.querySelectorAll('button')] : [];
    for (const el of nodes) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const visibleBottom = Math.min(r.bottom, hostRect ? hostRect.bottom : r.bottom);
      const visibleTop = Math.max(r.top, hostRect ? hostRect.top : r.top);
      const visibleLeft = Math.max(r.left, hostRect ? hostRect.left : r.left);
      const visibleRight = Math.min(r.right, hostRect ? hostRect.right : r.right);
      if (visibleRight - visibleLeft < 2 || visibleBottom - visibleTop < 2) continue;
      const horizontalCut = hostRect && (r.left < hostRect.left - 1 || r.right > hostRect.right + 1);
      const dockHit = dockRect && overlap(
        { left: visibleLeft, right: visibleRight, top: visibleTop, bottom: visibleBottom },
        dockRect,
      ) && visibleBottom > dockRect.top + 1;
      if (horizontalCut || dockHit) {
        clippedControls.push(String(el.textContent || '').trim().slice(0, 80));
      }
    }
    const text = String(host?.innerText || '');
    const outcomeText = String(outcome?.innerText || '');
    const occluders = [];
    if (hostRect && hostRect.width > 40 && hostRect.height > 40) {
      const inset = 8;
      const points = [];
      const steps = 6;
      for (let ix = 0; ix <= steps; ix += 1) {
        for (let iy = 0; iy <= steps; iy += 1) {
          points.push({
            x: hostRect.left + inset + ((hostRect.width - inset * 2) * ix) / steps,
            y: hostRect.top + inset + ((hostRect.height - inset * 2) * iy) / steps,
          });
        }
      }
      for (const point of points) {
        const hit = document.elementFromPoint(point.x, point.y);
        if (!hit || hit === host || host.contains(hit)) continue;
        const name = hit.id ? `#${hit.id}` : (hit.getAttribute?.('aria-label') || hit.className || hit.tagName);
        const label = `${String(name).slice(0, 80)} @${Math.round(point.x)},${Math.round(point.y)}`;
        if (!occluders.includes(label)) occluders.push(label);
      }
    }
    const sentenceCut = outcome && (
      getComputedStyle(outcome).textOverflow === 'ellipsis'
      || outcome.scrollWidth > outcome.clientWidth + 1
    );
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      hostPresent: Boolean(host),
      host: box(host),
      contracts: box(contracts),
      outcome: box(outcome),
      dock: box(dock),
      hostClearsDock: !hostRect || !dockRect || hostRect.bottom <= dockRect.top + 1,
      hostOverflowX: Boolean(host && host.scrollWidth > host.clientWidth + 1),
      contractsOverflowX: Boolean(contracts && contracts.scrollWidth > contracts.clientWidth + 1),
      outcomeOverflowX: Boolean(outcome && outcome.scrollWidth > outcome.clientWidth + 1),
      outcomeOverflowYContained: Boolean(outcome && (getComputedStyle(outcome).overflowY === 'auto' || getComputedStyle(outcome).overflowY === 'scroll')),
      clippedControls,
      sentenceCut: sentenceCut === true,
      occluders,
      text,
      outcomeText,
    };
  };
}

async function clearWorldCargoObstructions(page) {
  await page.evaluate(() => {
    document.getElementById('btn-close-map')?.click();
    document.getElementById('interstellar-map-frame')?.classList.add('hidden');
    document.getElementById('interstellar-map-canvas')?.classList.add('hidden');
    const minimap = document.getElementById('minimap-panel');
    if (minimap) minimap.style.display = 'none';
    document.getElementById('briefing-archive')?.classList.add('hidden');
    document.getElementById('phase10-readout')?.classList.add('hidden');
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
}

async function shot(page, name) {
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
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
    if (mode === 'baseline') {
      await page.evaluate(() => {
        document.querySelector('[data-dock-action="inventory"]')?.click();
        globalThis.BM1Probe?.paint?.();
      });
      await page.waitForTimeout(300);
      await shot(page, '01-cargo-inventory');
      await page.evaluate(() => {
        document.querySelector('[data-top-action="close-panel"]')?.click();
        const probe = globalThis.__BM1_PROBE__;
        if (probe?.placeAtApproach) probe.placeAtApproach();
        const dock = globalThis.BM1Probe;
        if (typeof dock?.paint === 'function') dock.paint();
      });
      await page.evaluate(() => {
        const api = globalThis.__BM1_PROBE__;
        if (api && typeof api.tryDockPlanet === 'function') {
          const markerReady = true;
          if (markerReady) api.tryDockPlanet();
        }
        globalThis.BM1Probe?.paint?.();
      });
      await page.waitForTimeout(300);
      await shot(page, '02-planet-dock-contracts');
      fs.writeFileSync(path.join(outDir, 'baseline-note.json'), JSON.stringify({
        mode: 'baseline',
        viewport: { width: 1280, height: 720 },
        hostPresent: false,
        note: 'Captured on main before #world-cargo existed. 01 is the cargo inventory. 02 is the planet-dock / contract area. The header strip clip predates this work and is out of scope.',
      }, null, 2));
      return;
    }

    const openScene = await page.evaluate(() => {
      const api = globalThis.__BM1_PROBE__?.worldCargo;
      if (!api) throw new Error('worldCargo probe missing');
      api.placeAtWorld();
      const enrolled = api.enroll({
        id: 'wc-open-shot',
        mode: 'open',
        good: 'Grain',
        tons: 4,
        legalPayout: 48,
        targetName: 'Ferenginar',
        contraband: false,
      });
      api.installPods(enrolled.id);
      api.setCloak(false);
      const completed = api.completeOpen({ contractId: enrolled.id });
      globalThis.BM1Probe?.paint?.();
      const text = String(document.getElementById('world-cargo')?.innerText || '');
      return { enrolled, completed, text };
    });
    await page.waitForTimeout(250);
    await clearWorldCargoObstructions(page);
    await shot(page, '01-open-delivery');
    const openFit = await page.evaluate(measureWorldCargoHost());

    const covertScene = await page.evaluate(() => {
      const api = globalThis.__BM1_PROBE__.worldCargo;
      const probe = globalThis.BM1Probe;
      const statusText = () => String(document.querySelector('.top-message-text')?.textContent || '');
      const requireRange = (label, range) => {
        const distance = Number(range?.distance);
        const dockDistance = Number(range?.dockDistance);
        if (!Number.isFinite(distance) || !Number.isFinite(dockDistance) || distance > dockDistance || range?.inside !== true) {
          throw new Error(`${label} distance ${distance} is outside getPlanetDockDistance ${dockDistance}`);
        }
        if (range.docked === true) throw new Error(`${label} is still docked`);
        return { distance, dockDistance, inside: true, docked: false };
      };
      const undockAlongFlightPath = () => {
        const before = api.serviceRange();
        if (before.docked !== true) {
          api.placeAtWorld();
          const docked = probe.tryDockPlanet();
          if (docked !== true) throw new Error(`flight undock needs a dock first, tryDockPlanet returned ${docked}`);
        }
        const planet = api.serviceRange().planetWorld;
        if (!Number.isFinite(Number(planet?.x)) || !Number.isFinite(Number(planet?.y))) {
          throw new Error('planet world position missing');
        }
        probe.placePlayer(planet.x + 6000, planet.y + 6000);
        probe.tick(1);
        api.placeAtWorld();
        const range = requireRange('flight undock', api.serviceRange());
        const status = statusText();
        if (status.includes('Docked')) throw new Error(`status still contains Docked after flight undock: ${status}`);
        return { range, status };
      };
      const covert = api.enroll({
        id: 'wc-covert-shot',
        mode: 'covert',
        good: 'Spices',
        tons: 3,
        covertReward: 27,
        targetName: 'Ferenginar',
        contraband: true,
      });
      api.installPods(covert.id);
      api.placeAtWorld();
      const undocked = undockAlongFlightPath();
      api.setCloak(true);
      const covertRange = requireRange('covert drop', api.serviceRange());
      const dropped = api.drop({ contractId: covert.id });
      const openFail = api.enroll({
        id: 'wc-open-cloak-shot',
        mode: 'open',
        good: 'Medical Supplies',
        tons: 2,
        legalPayout: 36,
        targetName: 'Ferenginar',
        contraband: false,
      });
      api.installPods(openFail.id);
      api.placeAtWorld();
      api.setCloak(true);
      const openCloakRange = requireRange('cloaked open drop', api.serviceRange());
      const failed = api.drop({ contractId: openFail.id });
      if (failed?.reason !== 'cloak-not-legal') {
        throw new Error(`cloaked open drop failed for ${failed?.reason || 'unknown'}, expected cloak-not-legal`);
      }
      const status = statusText();
      if (status.includes('Docked')) throw new Error(`status contains Docked after cloaked open drop: ${status}`);
      return { covert, dropped, openFail, failed, text: String(document.getElementById('world-cargo')?.innerText || ''), covertRange, openCloakRange, undocked, status };
    });
    await page.waitForTimeout(1600);
    const captureState = await page.evaluate(() => {
      globalThis.BM1Probe.redraw();
      const status = String(document.querySelector('.top-message-text')?.textContent || '');
      const pops = globalThis.BM1Probe.worldPopTexts();
      const range = globalThis.__BM1_PROBE__.worldCargo.serviceRange();
      if (status.includes('Docked')) throw new Error(`visible status contains Docked at capture: ${status}`);
      if (pops.some((text) => String(text).includes('Docked'))) {
        throw new Error(`planet tag still says Docked at capture: ${pops.join(' | ')}`);
      }
      const distance = Number(range?.distance);
      const dockDistance = Number(range?.dockDistance);
      if (!Number.isFinite(distance) || !Number.isFinite(dockDistance) || distance > dockDistance || range?.inside !== true || range?.docked === true) {
        throw new Error(`capture left the dock radius: ${distance} / ${dockDistance} docked=${range?.docked}`);
      }
      return {
        status,
        pops,
        distance,
        dockDistance,
        inside: true,
        docked: false,
      };
    });
    await clearWorldCargoObstructions(page);
    await shot(page, '02-covert-drop');
    const covertFit = await page.evaluate(measureWorldCargoHost());

    const openText = String(openScene.text || openFit.text || '');
    const covertText = String(covertScene.text || covertFit.text || '');
    const overflow = {
      viewport: { width: 1280, height: 720 },
      measuredOn: '#world-cargo',
      headerStrip: 'Measured separately under docs/header-strip/screenshots/after/overflow.json',
      covertUndock: covertScene.covertRange,
      flightUndock: covertScene.undocked || null,
      statusAtCapture: captureState.status,
      planetTagsAtCapture: captureState.pops,
      captureRange: {
        distance: captureState.distance,
        dockDistance: captureState.dockDistance,
        inside: captureState.inside,
        docked: captureState.docked,
      },
      openCloakUndock: {
        ...(covertScene.openCloakRange || {}),
        reason: covertScene.failed?.reason || null,
      },
      openDelivery: openFit,
      covertDrop: covertFit,
      openOutcomeShown: openText.includes(OPEN_OUTCOME) && openText.includes('Ferenginar') && openText.includes('48'),
      cloakFailShown: covertText.includes(CLOAK_FAIL),
      covertPaidShown: covertText.includes(COVERT_PAID),
      covertInspectionShown: covertText.includes(COVERT_MARK) && covertText.includes('27'),
      occluders: [
        ...(openFit.occluders || []),
        ...(covertFit.occluders || []),
      ],
      clippedControls: [
        ...(openFit.clippedControls || []),
        ...(covertFit.clippedControls || []),
      ],
      hostClearsDock: openFit.hostClearsDock === true && covertFit.hostClearsDock === true,
      hostOverflowX: openFit.hostOverflowX === true || covertFit.hostOverflowX === true,
      sentenceCut: openFit.sentenceCut === true || covertFit.sentenceCut === true,
    };
    overflow.clippedControls = [...new Set(overflow.clippedControls)];
    overflow.occluders = [...new Set(overflow.occluders)];
    fs.writeFileSync(path.join(outDir, 'overflow.json'), JSON.stringify(overflow, null, 2));
    fs.writeFileSync(path.join(outDir, 'NOTES.md'), [
      '# World cargo after shots',
      '',
      'Viewport 1280×720. `01-open-delivery.png` is a completed open delivery at the world.',
      '`02-covert-drop.png` is the covert-drop outcome, including the cloaked drop of an open contract.',
      '',
      'The cloaked drops are taken after the flight undock path, still inside getPlanetDockDistance. The open-contract cloak failure is cloak-not-legal. The header and planet tag do not say Docked.',
      '',
      `clippedControls: ${JSON.stringify(overflow.clippedControls)}`,
      '',
    ].join('\n'));
    const ok = overflow.clippedControls.length === 0
      && overflow.occluders.length === 0
      && overflow.openOutcomeShown
      && overflow.cloakFailShown
      && overflow.covertPaidShown
      && overflow.covertInspectionShown
      && overflow.hostClearsDock
      && !overflow.hostOverflowX
      && !overflow.sentenceCut
      && covertScene.failed?.reason === 'cloak-not-legal'
      && covertScene.openCloakRange?.inside === true
      && covertScene.openCloakRange?.docked === false
      && Number(covertScene.openCloakRange?.distance) <= Number(covertScene.openCloakRange?.dockDistance)
      && covertScene.covertRange?.inside === true
      && covertScene.covertRange?.docked === false
      && captureState.status.includes('Docked') === false
      && captureState.pops.some((text) => String(text).includes('Docked')) === false
      && captureState.inside === true
      && captureState.docked === false
      && Number(captureState.distance) <= Number(captureState.dockDistance);
    if (!ok) {
      console.error(JSON.stringify({
        openOutcomeShown: overflow.openOutcomeShown,
        cloakFailShown: overflow.cloakFailShown,
        covertPaidShown: overflow.covertPaidShown,
        covertInspectionShown: overflow.covertInspectionShown,
        clippedControls: overflow.clippedControls,
        occluders: overflow.occluders,
        hostClearsDock: overflow.hostClearsDock,
        hostOverflowX: overflow.hostOverflowX,
        sentenceCut: overflow.sentenceCut,
        openText: openText.slice(0, 800),
        covertText: covertText.slice(0, 800),
      }, null, 2));
      process.exitCode = 1;
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
