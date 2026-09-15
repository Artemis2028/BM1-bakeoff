#!/usr/bin/env node
/**
 * Capture 1280×720 Phase 10 / Dominion-first UI shots.
 * Usage:
 *   node scripts/capture-phase10-screens.mjs --out docs/phase10/screenshots/baseline-main --mode baseline
 *   node scripts/capture-phase10-screens.mjs --out docs/phase10/screenshots/phase10 --mode after
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
  mode === 'baseline' ? 'docs/phase10/screenshots/baseline-main' : 'docs/phase10/screenshots/phase10'
));
const PORT = Number(process.env.PROBE_PORT) || 8768;
const BASE = `http://127.0.0.1:${PORT}/`;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
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
    const fleet = document.getElementById('fleet-order-panel');
    const knowledge = document.getElementById('phase10-readout') || document.querySelector('[data-phase10-knowledge]');
    const panelBox = box(panel);
    const contentBox = box(content);
    const dockBox = box(dock);
    const targetBox = box(target);
    const fleetBox = box(fleet);
    const knowledgeBox = box(knowledge);
    const clippedControls = [];
    const dockRect = dock && !dock.classList.contains('hidden') ? dock.getBoundingClientRect() : null;
    const panelRect = panel && !panel.classList.contains('hidden') ? panel.getBoundingClientRect() : null;
    const targetRect = target && !target.classList.contains('hidden') ? target.getBoundingClientRect() : null;
    const nodes = [
      ...(panel ? [...panel.querySelectorAll('button, [data-ew-ops] button, .ew-row button, .ship-actions button')] : []),
      ...(target && !target.classList.contains('hidden') ? [...target.querySelectorAll('button')] : []),
      ...(fleet && !fleet.classList.contains('hidden') ? [...fleet.querySelectorAll('button')] : []),
      ...(knowledge && !knowledge.classList.contains('hidden') ? [...knowledge.querySelectorAll('button')] : []),
    ];
    for (const el of nodes) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const clipHost = panel?.contains(el)
        ? panelRect
        : (fleet?.contains(el) ? fleet.getBoundingClientRect() : (knowledge?.contains(el) ? knowledge.getBoundingClientRect() : targetRect));
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
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      ops: contentBox,
      panel: panelBox,
      inventory: contentBox,
      settings: contentBox,
      target: targetBox,
      fleet: fleetBox,
      knowledge: knowledgeBox,
      dock: dockBox,
      clippedControls,
      overflowX: Boolean(contentBox?.overflowX || panelBox?.overflowX || targetBox?.overflowX || knowledgeBox?.overflowX),
      dockClear: Boolean(
        panelBox && dockBox && !panelBox.hidden && !dockBox.hidden
        && panelBox.bottom <= dockBox.top + 1,
      ),
      targetDockClear: Boolean(
        targetBox && dockBox && !targetBox.hidden && !dockBox.hidden
        && targetBox.bottom <= dockBox.top + 1,
      ),
      knowledgeDockClear: Boolean(
        !knowledgeBox || knowledgeBox.hidden || !dockBox || dockBox.hidden
        || knowledgeBox.bottom <= dockBox.top + 1,
      ),
      leakedNames,
      hasPhase10: Boolean(globalThis.__BM1_PROBE__?.phase10),
      hasKnowledge: Boolean(knowledge),
      mapOpen: Boolean(document.body.classList.contains('map-open')),
    };
  };
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: false });
}

function clipSummary(dump, key = 'ops') {
  return JSON.stringify({
    overflowX: dump.overflowX,
    clippedControls: dump.clippedControls,
    dockClear: dump.dockClear,
    targetDockClear: dump.targetDockClear,
    knowledgeDockClear: dump.knowledgeDockClear,
    leakedNames: dump.leakedNames,
    hasPhase10: dump.hasPhase10,
    hasKnowledge: dump.hasKnowledge,
    mapOpen: dump.mapOpen,
    [key]: dump[key] || dump.ops,
    dock: dump.dock,
  }, null, 2);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => globalThis.BM1Probe?.ready?.() === true, null, { timeout: 60000 });
    await page.evaluate(() => {
      globalThis.BM1Probe.skipIntro();
      globalThis.BM1Probe.freezeLoop();
    });
    await page.evaluate(() => globalThis.BM1Probe.startGame('dominion', {
      arena: { clearTraffic: true, latinum: 1600, hull: 100, shields: 100 },
    }));
    await page.waitForTimeout(400);

    const startSnap = await page.evaluate(() => ({
      faction: globalThis.__BM1_PROBE__?.snapshot?.()?.playerFaction,
      planet: globalThis.BM1Probe?.snapshot?.()?.currentPlanet,
      planetName: (() => {
        const p = globalThis.__BM1_PROBE__;
        return p?.phase10?.snapshot?.()?.hide?.currentSystem
          || document.body.innerText.slice(0, 200);
      })(),
      phase10: Boolean(globalThis.__BM1_PROBE__?.phase10),
    }));

    await shot(page, '01-flight-hud-blender-dominion');

    await page.evaluate(() => {
      document.querySelector('[data-dock-action="map"]')?.click();
      document.getElementById('btn-map')?.click();
      globalThis.__BM1_PROBE__?.phase10?.selectNamedSystem?.('Dominica');
      globalThis.BM1Probe?.paint?.();
    });
    await page.waitForTimeout(250);
    const mapDump = await page.evaluate(measureScript());
    await shot(page, '02-starchart-dominion-start');
    fs.writeFileSync(path.join(outDir, '02-starchart-overflow.json'), JSON.stringify({ ...mapDump, startSnap }, null, 2));

    if (mode === 'after') {
      await page.evaluate(() => {
        document.getElementById('btn-close-map')?.click();
        const p10 = globalThis.__BM1_PROBE__?.phase10;
        p10?.injectKnowledge?.({ layer: 'rumor' });
        globalThis.BM1Probe?.paint?.();
      });
      await page.waitForTimeout(200);
      await shot(page, '03-knowledge-rumor');
      const rumorDump = await page.evaluate(measureScript());
      fs.writeFileSync(path.join(outDir, '03-knowledge-rumor-overflow.json'), JSON.stringify(rumorDump, null, 2));

      await page.evaluate(() => {
        document.querySelector('[data-dock-action="map"]')?.click();
        document.getElementById('btn-map')?.click();
        const p10 = globalThis.__BM1_PROBE__?.phase10;
        p10?.injectDiscovery?.({ observerKey: 'player', systemNames: ['Dominica'] });
        p10?.selectNamedSystem?.('Dominica');
        globalThis.BM1Probe?.paint?.();
      });
      await page.waitForTimeout(250);
      await shot(page, '04-starchart-dominica-discovered');
      const discDump = await page.evaluate(measureScript());
      fs.writeFileSync(path.join(outDir, '04-starchart-discovered-overflow.json'), JSON.stringify(discDump, null, 2));
    }

    await page.evaluate(() => {
      document.getElementById('btn-close-map')?.click();
      document.querySelector('[data-top-left-tab="power"]')?.click();
      document.querySelector('[data-dock-action="power"]')?.click();
    });
    await page.waitForTimeout(200);
    const opsDump = await page.evaluate(measureScript());
    await shot(page, mode === 'after' ? '05-ops' : '03-ops');
    fs.writeFileSync(path.join(outDir, `${mode === 'after' ? '05' : '03'}-ops-overflow.json`), JSON.stringify(opsDump, null, 2));

    await page.evaluate(() => document.querySelector('[data-top-left-tab="inventory"]')?.click());
    await page.waitForTimeout(200);
    const invDump = await page.evaluate(measureScript());
    await shot(page, mode === 'after' ? '06-inventory' : '04-inventory');
    fs.writeFileSync(path.join(outDir, `${mode === 'after' ? '06' : '04'}-inventory-overflow.json`), JSON.stringify(invDump, null, 2));

    await page.evaluate(() => {
      const p = globalThis.__BM1_PROBE__;
      if (p?.openSettings) p.openSettings();
      else document.querySelector('[data-top-left-tab="settings"]')?.click();
    });
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      const campaign = document.querySelector('.phase10-campaign');
      campaign?.scrollIntoView({ block: 'center', inline: 'nearest' });
    });
    await page.waitForTimeout(150);
    const setDump = await page.evaluate(measureScript());
    await shot(page, mode === 'after' ? '07-settings' : '05-settings');
    fs.writeFileSync(path.join(outDir, `${mode === 'after' ? '07' : '05'}-settings-overflow.json`), JSON.stringify(setDump, null, 2));

    await page.evaluate(() => {
      document.querySelector('[data-top-action="close-panel"]')?.click();
      const p = globalThis.BM1Probe;
      p.placePlayer?.(1200, 900);
      const victim = p.spawnShip?.({
        id: 'shot-p10-target',
        faction: 'klingon',
        role: 'patrol',
        x: 1240,
        y: 900,
        hostile: false,
        weaponSlots: [null, null, null],
      });
      const id = victim?.securityInstanceId || victim?.id;
      const board = globalThis.__BM1_PROBE__?.boarding;
      board?.injectDetection?.({ id, detected: true, identification: 'known', firingSolution: false });
      board?.selectTarget?.(id);
      return { id };
    });
    await page.waitForTimeout(250);
    const tgtDump = await page.evaluate(measureScript());
    await shot(page, mode === 'after' ? '08-target' : '06-target');
    fs.writeFileSync(path.join(outDir, `${mode === 'after' ? '08' : '06'}-target-overflow.json`), JSON.stringify(tgtDump, null, 2));

    const notes = mode === 'baseline'
      ? `# Phase 10 baseline screenshots (main, before engine)

Captured from the running game on bake-off \`main\` @ \`706b7d0\` (Phase 10 brief merged, engine not yet implemented). Viewport 1280×720 Chromium (Playwright). Dominion remnant start in Blender. Distant Gamma names still leak in map chrome on this baseline.

**No Referee Pass claimed.**

## Shots

| File | What |
| --- | --- |
| \`01-flight-hud-blender-dominion.png\` | Flight HUD at Dominion / Blender start |
| \`02-starchart-dominion-start.png\` | Star chart — Gamma labels still sayable (leak to close) |
| \`03-ops.png\` | OPS / Power + EW (preserve) |
| \`04-inventory.png\` | Inventory |
| \`05-settings.png\` | Settings + Security — no campaign readout yet |
| \`06-target.png\` | Target / contact window |

## UI fit

\`clippedControls: []\` continues.

OPS:
\`\`\`json
${clipSummary(opsDump, 'ops')}
\`\`\`

Inventory:
\`\`\`json
${clipSummary(invDump, 'inventory')}
\`\`\`

Settings:
\`\`\`json
${clipSummary(setDump, 'settings')}
\`\`\`

Target:
\`\`\`json
${clipSummary(tgtDump, 'target')}
\`\`\`

Star chart leakedNames (baseline leak expected):
\`\`\`json
${JSON.stringify(mapDump.leakedNames || [], null, 2)}
\`\`\`
`
      : `# Phase 10 after-implementation screenshots

Captured from the running game after the Dominion-first engine. Viewport 1280×720 Chromium (Playwright). Compare with \`docs/phase10/screenshots/baseline-main/\`.

**No Referee Pass claimed.** Stories remain knowledge layers. Tractor remains not boarding.

## Shots

| File | What |
| --- | --- |
| \`01-flight-hud-blender-dominion.png\` | Flight HUD at Dominion / Blender start (Gamma still hidden) |
| \`02-starchart-dominion-start.png\` | Star chart — no Dominica / Founders Watch labels |
| \`03-knowledge-rumor.png\` | Knowledge readout: rumor ≠ FS |
| \`04-starchart-dominica-discovered.png\` | After discovery inject for listed systems only |
| \`05-ops.png\` | OPS / EW preserved, dock-clear |
| \`06-inventory.png\` | Inventory preserved |
| \`07-settings.png\` | Settings + campaign / knowledge readout |
| \`08-target.png\` | Target window preserved |

## UI fit

\`clippedControls: []\` continues.

OPS:
\`\`\`json
${clipSummary(opsDump, 'ops')}
\`\`\`

Inventory:
\`\`\`json
${clipSummary(invDump, 'inventory')}
\`\`\`

Settings:
\`\`\`json
${clipSummary(setDump, 'settings')}
\`\`\`

Target:
\`\`\`json
${clipSummary(tgtDump, 'target')}
\`\`\`

Star chart (hidden) leakedNames:
\`\`\`json
${JSON.stringify(mapDump.leakedNames || [], null, 2)}
\`\`\`
`;
    fs.writeFileSync(path.join(outDir, 'NOTES.md'), notes);
    fs.writeFileSync(path.join(outDir, 'overflow.json'), JSON.stringify({
      startSnap,
      map: mapDump,
      ops: opsDump,
      inventory: invDump,
      settings: setDump,
      target: tgtDump,
    }, null, 2));
    console.log(`Phase 10 ${mode} screenshots written to ${outDir}`);
    console.log(`clippedControls ops=${JSON.stringify(opsDump.clippedControls)} leaked=${JSON.stringify(mapDump.leakedNames)}`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
