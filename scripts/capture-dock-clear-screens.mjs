#!/usr/bin/env node
/**
 * Capture 1280×720 dockClear / UI-fit shots + overflow JSON.
 * Usage:
 *   node scripts/capture-dock-clear-screens.mjs --mode baseline --out docs/dock-clear/screenshots/baseline
 *   node scripts/capture-dock-clear-screens.mjs --mode after --out docs/dock-clear/screenshots/after
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
  mode === 'baseline' ? 'docs/dock-clear/screenshots/baseline' : 'docs/dock-clear/screenshots/after'
));
const PORT = Number(process.env.PROBE_PORT) || 8771;
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

function measureScript() {
  return () => {
    const overlap = (a, b) => a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const intersect = (a, b) => {
      if (!a || !b) return null;
      const left = Math.max(a.left, b.left);
      const right = Math.min(a.right, b.right);
      const top = Math.max(a.top, b.top);
      const bottom = Math.min(a.bottom, b.bottom);
      if (right <= left || bottom <= top) return null;
      return { left, right, top, bottom };
    };
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        hidden: el.classList.contains('hidden') || getComputedStyle(el).display === 'none',
        overflowX: el.scrollWidth > el.clientWidth + 1,
        overflowY: el.scrollHeight > el.clientHeight + 1,
        scrollW: el.scrollWidth,
        scrollH: el.scrollHeight,
        clientW: el.clientWidth,
        clientH: el.clientHeight,
        panelW: Math.round(r.width),
        panelH: Math.round(r.height),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        left: Math.round(r.left),
        right: Math.round(r.right),
        text: String(el.innerText || '').slice(0, 800),
      };
    };
    const panel = document.getElementById('top-left-panel');
    const content = panel?.querySelector('.top-left-panel-content');
    const dock = document.getElementById('bottom-dock');
    const target = document.getElementById('target-window');
    const mapFrame = document.getElementById('interstellar-map-frame');
    const mapClose = document.getElementById('btn-close-map');
    const knowledge = document.getElementById('phase10-readout') || document.querySelector('[data-phase10-knowledge]');
    const panelBox = box(panel);
    const contentBox = box(content);
    const dockBox = box(dock);
    const targetBox = box(target);
    let mapBox = box(mapFrame);
    const closeBox = box(mapClose);
    const knowledgeBox = box(knowledge);
    const mapOpen = Boolean(document.body.classList.contains('map-open'));
    if (mapOpen && mapFrame) {
      const cs = getComputedStyle(mapFrame);
      const top = Number.parseFloat(cs.getPropertyValue('--map-panel-top'));
      const left = Number.parseFloat(cs.getPropertyValue('--map-panel-left'));
      const right = Number.parseFloat(cs.getPropertyValue('--map-panel-right'));
      const bottom = Number.parseFloat(cs.getPropertyValue('--map-panel-bottom'));
      if ([top, left, right, bottom].every((n) => Number.isFinite(n))) {
        mapBox = {
          ...(mapBox || {}),
          hidden: false,
          top: Math.round(top),
          left: Math.round(left),
          right: Math.round(right),
          bottom: Math.round(bottom),
          panelW: Math.round(right - left),
          panelH: Math.round(bottom - top),
        };
      }
    }
    const clippedControls = [];
    const dockRect = dock && !dock.classList.contains('hidden') ? dock.getBoundingClientRect() : null;
    const panelRect = panel && !panel.classList.contains('hidden') ? panel.getBoundingClientRect() : null;
    const targetRect = target && !target.classList.contains('hidden') ? target.getBoundingClientRect() : null;
    const mapRect = mapFrame && !mapFrame.classList.contains('hidden') ? mapFrame.getBoundingClientRect() : null;
    const closeRect = mapClose && mapFrame && !mapFrame.classList.contains('hidden')
      ? mapClose.getBoundingClientRect()
      : null;
    const nodes = [
      ...(panel && !panel.classList.contains('hidden') ? [...panel.querySelectorAll('button')] : []),
      ...(target && !target.classList.contains('hidden') ? [...target.querySelectorAll('button')] : []),
      ...(mapClose && mapFrame && !mapFrame.classList.contains('hidden') ? [mapClose] : []),
    ];
    for (const el of nodes) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const clipHost = panel?.contains(el)
        ? panelRect
        : (target?.contains(el) ? targetRect : (el === mapClose ? closeRect : mapRect));
      const visible = clipHost ? intersect(r, clipHost) : r;
      if (!visible || (visible.bottom - visible.top) < 2) continue;
      if (dockRect && overlap(visible, dockRect) && visible.bottom > dockRect.top + 1) {
        clippedControls.push({
          label: String(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 80),
          top: Math.round(visible.top),
          bottom: Math.round(visible.bottom),
          dockTop: Math.round(dockRect.top),
        });
      }
    }
    const bodyText = String(document.body.innerText || '');
    const leakNeedles = ['Dominica', 'Founders Watch', 'JemHadar Relay', 'Karemma Exchange', 'Dosi Gate', 'T-Rogoran Annex', 'Gamma Quadrant'];
    const leakedNames = leakNeedles.filter((name) => bodyText.includes(name));
    const token = getComputedStyle(document.body).getPropertyValue('--bm1-dock-clear').trim();
    const dockClear = Boolean(
      panelBox && dockBox && !panelBox.hidden && !dockBox.hidden
      && panelBox.bottom <= dockBox.top + 1,
    );
    const targetDockClear = Boolean(
      targetBox && dockBox && !targetBox.hidden && !dockBox.hidden
      && targetBox.bottom <= dockBox.top + 1,
    );
    const mapDockClear = Boolean(
      mapOpen
      && mapBox && dockBox && !mapBox.hidden && !dockBox.hidden
      && mapBox.bottom <= dockBox.top + 1
      && (!closeBox || closeBox.hidden || closeBox.bottom <= dockBox.top + 1),
    );
    const knowledgeDockClear = Boolean(
      !knowledgeBox || knowledgeBox.hidden || !dockBox || dockBox.hidden
      || knowledgeBox.bottom <= dockBox.top + 1,
    );
    const reachable = (target && !target.classList.contains('hidden'))
      ? [...target.querySelectorAll('button')].map((el) => String(el.textContent || '').trim()).filter(Boolean)
      : [];
    const probeFit = globalThis.__BM1_PROBE__?.dockClear?.snapshotDockFit?.()
      || globalThis.__BM1_PROBE__?.phase92?.snapshotDockFit?.()
      || null;
    const probeSnap = globalThis.__BM1_PROBE__?.dockClear?.snapshot?.() || null;
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      token,
      ops: contentBox,
      panel: panelBox,
      inventory: contentBox,
      settings: contentBox,
      target: targetBox,
      map: mapBox,
      mapClose: closeBox,
      knowledge: knowledgeBox,
      dock: dockBox,
      clippedControls,
      overflowX: Boolean(contentBox?.overflowX || panelBox?.overflowX || targetBox?.overflowX),
      dockClear,
      targetDockClear,
      mapDockClear,
      knowledgeDockClear,
      leakedNames,
      mapOpen,
      reachable,
      dockButtons: dock ? dock.querySelectorAll('button').length : 0,
      probeFit,
      probeSnap,
    };
  };
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: false });
}

function clipSummary(dump, extra = {}) {
  return JSON.stringify({
    overflowX: dump.overflowX,
    clippedControls: dump.clippedControls,
    dockClear: dump.dockClear,
    targetDockClear: dump.targetDockClear,
    mapDockClear: dump.mapDockClear,
    knowledgeDockClear: dump.knowledgeDockClear,
    leakedNames: dump.leakedNames,
    mapOpen: dump.mapOpen,
    token: dump.token,
    panel: dump.panel,
    target: dump.target,
    map: dump.map,
    mapClose: dump.mapClose,
    dock: dump.dock,
    reachable: dump.reachable,
    ...extra,
  }, null, 2);
}

async function bootGame(page, faction = 'ferengi') {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => globalThis.BM1Probe?.ready?.() === true, null, { timeout: 60000 });
  await page.evaluate(() => {
    globalThis.BM1Probe.skipIntro();
    globalThis.BM1Probe.freezeLoop();
  });
  await page.evaluate((faction) => globalThis.BM1Probe.startGame(faction, {
    arena: { clearTraffic: true, latinum: 2800, hull: 100, shields: 100 },
  }), faction);
  await page.waitForTimeout(300);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  try {
    await bootGame(page, 'ferengi');

    await page.evaluate(() => {
      document.querySelector('[data-top-left-tab="power"]')?.click();
      document.querySelector('[data-dock-action="power"]')?.click();
    });
    await page.waitForTimeout(200);
    const opsDump = await page.evaluate(measureScript());
    await shot(page, '01-ops');
    fs.writeFileSync(path.join(outDir, '01-ops-overflow.json'), JSON.stringify(opsDump, null, 2));

    await page.evaluate(() => document.querySelector('[data-top-left-tab="inventory"]')?.click());
    await page.waitForTimeout(160);
    const invDump = await page.evaluate(measureScript());
    await shot(page, '02-inventory');
    fs.writeFileSync(path.join(outDir, '02-inventory-overflow.json'), JSON.stringify(invDump, null, 2));

    await page.evaluate(() => {
      const p = globalThis.__BM1_PROBE__;
      if (p?.openSettings) p.openSettings();
      else document.querySelector('[data-top-left-tab="settings"]')?.click();
    });
    await page.waitForTimeout(160);
    const setDump = await page.evaluate(measureScript());
    await shot(page, '03-settings');
    fs.writeFileSync(path.join(outDir, '03-settings-overflow.json'), JSON.stringify(setDump, null, 2));

    await page.evaluate(() => {
      document.querySelector('[data-top-action="close-panel"]')?.click();
      const p = globalThis.BM1Probe;
      p.placePlayer?.(1200, 900);
      const victim = p.spawnShip?.({
        id: 'dock-clear-target',
        faction: 'klingon',
        role: 'patrol',
        x: 1260,
        y: 900,
        hostile: false,
      });
      const key = victim?.securityInstanceId ? `npc:${victim.securityInstanceId}` : null;
      if (key) globalThis.__BM1_PROBE__?.phase6?.grantLiveLock?.(key);
      const id = victim?.securityInstanceId || victim?.id;
      globalThis.__BM1_PROBE__?.boarding?.injectDetection?.({
        id,
        detected: true,
        identification: 'known',
        firingSolution: false,
      });
      globalThis.__BM1_PROBE__?.boarding?.selectTarget?.(id);
      p.paint?.();
      return { id, key };
    });
    await page.waitForTimeout(250);
    await page.evaluate(() => globalThis.BM1Probe?.paint?.());
    await page.waitForTimeout(120);
    const tgtDump = await page.evaluate(measureScript());
    await shot(page, '04-target');
    fs.writeFileSync(path.join(outDir, '04-target-overflow.json'), JSON.stringify(tgtDump, null, 2));

    await page.evaluate(() => {
      document.querySelector('[data-dock-action="map"]')?.click();
      document.getElementById('btn-map')?.click();
      globalThis.__BM1_PROBE__?.dockClear?.openMap?.();
      globalThis.BM1Probe?.paint?.();
    });
    await page.waitForTimeout(250);
    const mapDump = await page.evaluate(measureScript());
    await shot(page, '05-starchart');
    fs.writeFileSync(path.join(outDir, '05-starchart-overflow.json'), JSON.stringify(mapDump, null, 2));

    await page.evaluate(() => {
      document.getElementById('btn-close-map')?.click();
      globalThis.BM1Probe?.paint?.();
    });
    await page.waitForTimeout(120);

    const hoverDump = await page.evaluate(async () => {
      const dock = document.getElementById('bottom-dock');
      const btn = dock?.querySelector('[data-dock-action="target"]');
      btn?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      btn?.focus();
      return true;
    });
    await page.locator('#bottom-dock [data-dock-action="target"]').hover();
    await page.waitForTimeout(180);
    const dockHoverDump = await page.evaluate(measureScript());
    dockHoverDump.hoverProbe = hoverDump;
    await shot(page, '06-dock-hover');
    fs.writeFileSync(path.join(outDir, '06-dock-hover-overflow.json'), JSON.stringify(dockHoverDump, null, 2));

    const notes = mode === 'baseline'
      ? `# DockClear baseline screenshots (main, before S28 layout)

Captured from bake-off \`main\` @ \`3bdc18a\` (dock-clear brief merged, engine not yet applied). Viewport 1280×720 Chromium (Playwright).

**No Referee Pass claimed.** Operator-panel S16.15 is the regression check. Target / map / related dock chrome are the residual.

## Shots

| File | What |
| --- | --- |
| \`01-ops.png\` | OPS / Power operator panel |
| \`02-inventory.png\` | Inventory operator panel |
| \`03-settings.png\` | Settings operator panel |
| \`04-target.png\` | Target window (operator panel closed) |
| \`05-starchart.png\` | Interstellar map / star-chart chrome |
| \`06-dock-hover.png\` | Bottom-dock hover-expand |

## UI fit

OPS:
\`\`\`json
${clipSummary(opsDump)}
\`\`\`

Inventory:
\`\`\`json
${clipSummary(invDump)}
\`\`\`

Settings:
\`\`\`json
${clipSummary(setDump)}
\`\`\`

Target:
\`\`\`json
${clipSummary(tgtDump)}
\`\`\`

Star chart:
\`\`\`json
${clipSummary(mapDump)}
\`\`\`

Dock hover:
\`\`\`json
${clipSummary(dockHoverDump)}
\`\`\`
`
      : `# DockClear after-implementation screenshots (S28)

Captured after the S28 layout slice. Viewport 1280×720 Chromium (Playwright). Compare with \`docs/dock-clear/screenshots/baseline/\`.

**No Referee Pass claimed.** Operator-panel S16.15 preserved. Visible-box metrics: \`dockClear\` / \`targetDockClear\` / \`mapDockClear\`.

## Shots

| File | What |
| --- | --- |
| \`01-ops.png\` | OPS / Power operator panel |
| \`02-inventory.png\` | Inventory operator panel |
| \`03-settings.png\` | Settings operator panel |
| \`04-target.png\` | Target window (operator panel closed) |
| \`05-starchart.png\` | Interstellar map / star-chart chrome |
| \`06-dock-hover.png\` | Bottom-dock hover-expand |

## UI fit

OPS:
\`\`\`json
${clipSummary(opsDump)}
\`\`\`

Inventory:
\`\`\`json
${clipSummary(invDump)}
\`\`\`

Settings:
\`\`\`json
${clipSummary(setDump)}
\`\`\`

Target:
\`\`\`json
${clipSummary(tgtDump)}
\`\`\`

Star chart:
\`\`\`json
${clipSummary(mapDump)}
\`\`\`

Dock hover:
\`\`\`json
${clipSummary(dockHoverDump)}
\`\`\`
`;

    fs.writeFileSync(path.join(outDir, 'NOTES.md'), notes);
    console.log(`Wrote ${mode} shots to ${outDir}`);
    console.log(JSON.stringify({
      mode,
      ops: { dockClear: opsDump.dockClear, clipped: opsDump.clippedControls.length },
      target: { dockClear: tgtDump.dockClear, targetDockClear: tgtDump.targetDockClear, bottom: tgtDump.target?.bottom },
      map: { dockClear: mapDump.dockClear, mapDockClear: mapDump.mapDockClear, leaked: mapDump.leakedNames },
      hover: { dockRight: dockHoverDump.dock?.right, overflowX: dockHoverDump.overflowX },
    }, null, 2));
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
