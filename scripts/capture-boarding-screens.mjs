#!/usr/bin/env node
/**
 * Capture 1280×720 boarding UI / order-path / dock-fit shots.
 * Usage:
 *   node scripts/capture-boarding-screens.mjs --out docs/boarding/screenshots/boarding
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outDir = path.resolve(root, outIdx >= 0 ? args[outIdx + 1] : 'docs/boarding/screenshots/boarding');
const PORT = Number(process.env.PROBE_PORT) || 8767;
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
        text: String(el.innerText || '').slice(0, 600),
      };
    };
    const panel = document.getElementById('top-left-panel');
    const content = panel?.querySelector('.top-left-panel-content');
    const dock = document.getElementById('bottom-dock');
    const target = document.getElementById('target-window');
    const fleet = document.getElementById('fleet-order-panel');
    const panelBox = box(panel);
    const contentBox = box(content);
    const dockBox = box(dock);
    const targetBox = box(target);
    const fleetBox = box(fleet);
    const clippedControls = [];
    const dockRect = dock && !dock.classList.contains('hidden') ? dock.getBoundingClientRect() : null;
    const panelRect = panel && !panel.classList.contains('hidden') ? panel.getBoundingClientRect() : null;
    const targetRect = target && !target.classList.contains('hidden') ? target.getBoundingClientRect() : null;
    const nodes = [
      ...(panel ? [...panel.querySelectorAll('button, [data-ew-ops] button, .ew-row button, .ship-actions button')] : []),
      ...(target && !target.classList.contains('hidden') ? [...target.querySelectorAll('button')] : []),
      ...(fleet && !fleet.classList.contains('hidden') ? [...fleet.querySelectorAll('button')] : []),
    ];
    for (const el of nodes) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const clipHost = panel?.contains(el) ? panelRect : (fleet?.contains(el) ? fleet.getBoundingClientRect() : targetRect);
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
    const dockClear = Boolean(
      panelBox && dockBox && !panelBox.hidden && !dockBox.hidden
        && panelBox.bottom <= dockBox.top + 1,
    );
    const targetDockClear = Boolean(
      targetBox && dockBox && !targetBox.hidden && !dockBox.hidden
        && targetBox.bottom <= dockBox.top + 1,
    );
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      ops: contentBox,
      panel: panelBox,
      inventory: contentBox,
      settings: contentBox,
      target: targetBox,
      fleet: fleetBox,
      dock: dockBox,
      clippedControls,
      overflowX: Boolean(contentBox?.overflowX || panelBox?.overflowX || targetBox?.overflowX),
      dockClear,
      targetDockClear,
      hasBoard: Boolean(document.querySelector('[data-board-action]')),
      hasCapture: Boolean(document.querySelector('[data-board-action="capture"]')),
      hasXp: /not tracked yet/i.test(document.body.innerText || ''),
      hasTransfer: Boolean(document.querySelector('[data-command-transfer]')),
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
    hasBoard: dump.hasBoard,
    hasCapture: dump.hasCapture,
    hasXp: dump.hasXp,
    hasTransfer: dump.hasTransfer,
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
    await page.evaluate(() => globalThis.BM1Probe.startGame('ferengi', {
      arena: { clearTraffic: false, latinum: 2800, hull: 100, shields: 100 },
    }));
    await page.waitForTimeout(400);

    await shot(page, '01-flight-hud');

    await page.evaluate(() => {
      document.querySelector('[data-top-left-tab="power"]')?.click();
      document.querySelector('[data-dock-action="power"]')?.click();
    });
    await page.waitForTimeout(200);
    const opsDump = await page.evaluate(measureScript());
    await shot(page, '02-ops-ew');
    fs.writeFileSync(path.join(outDir, '02-ops-overflow.json'), JSON.stringify(opsDump, null, 2));

    await page.evaluate(() => document.querySelector('[data-top-left-tab="inventory"]')?.click());
    await page.waitForTimeout(200);
    const invDump = await page.evaluate(measureScript());
    await shot(page, '03-inventory');
    fs.writeFileSync(path.join(outDir, '03-inventory-overflow.json'), JSON.stringify(invDump, null, 2));

    await page.evaluate(() => {
      const p = globalThis.__BM1_PROBE__;
      if (p?.openSettings) p.openSettings();
      else document.querySelector('[data-top-left-tab="settings"]')?.click();
    });
    await page.waitForTimeout(200);
    const setDump = await page.evaluate(measureScript());
    await shot(page, '04-settings');
    fs.writeFileSync(path.join(outDir, '04-settings-overflow.json'), JSON.stringify(setDump, null, 2));

    const targetInfo = await page.evaluate(() => {
      document.querySelector('[data-top-action="close-panel"]')?.click();
      const p = globalThis.BM1Probe;
      p.placePlayer?.(1200, 900);
      const victim = p.spawnShip?.({
        id: 'shot-board-target',
        faction: 'klingon',
        role: 'patrol',
        x: 1260,
        y: 900,
        hostile: false,
        weaponSlots: [null, null, null],
      });
      const id = victim?.securityInstanceId || victim?.id;
      const board = globalThis.__BM1_PROBE__?.boarding;
      board?.injectDetection?.({ id, detected: true, firingSolution: false });
      board?.selectTarget?.(id);
      document.querySelector('[data-dock-action="target"]')?.click();
      return { victim, id, boardingPresent: Boolean(board) };
    });
    await page.waitForTimeout(250);
    const tgtDump = await page.evaluate(measureScript());
    await shot(page, '05-target-full-hull');
    fs.writeFileSync(path.join(outDir, '05-target-full-hull-overflow.json'), JSON.stringify(tgtDump, null, 2));

    await page.evaluate(({ id }) => {
      const board = globalThis.__BM1_PROBE__.boarding;
      board.injectHullRatio(id, 0.10);
      board.injectDetection({ id, detected: true, firingSolution: false });
      board.selectTarget(id);
      document.querySelector('[data-dock-action="target"]')?.click();
    }, { id: targetInfo.id });
    await page.waitForTimeout(250);
    const boardDump = await page.evaluate(measureScript());
    await shot(page, '06-target-boardable');
    fs.writeFileSync(path.join(outDir, '06-target-boardable-overflow.json'), JSON.stringify(boardDump, null, 2));

    await page.evaluate(({ id }) => {
      const board = globalThis.__BM1_PROBE__.boarding;
      board.injectBoardingAttempt({ id, victimInstanceId: id, outcome: 'capture' });
      board.selectTarget(id);
      document.querySelector('[data-dock-action="target"]')?.click();
    }, { id: targetInfo.id });
    await page.waitForTimeout(250);
    const prizeDump = await page.evaluate(measureScript());
    await shot(page, '07-command-transfer');
    fs.writeFileSync(path.join(outDir, '07-command-transfer-overflow.json'), JSON.stringify(prizeDump, null, 2));

    const notes = `# Boarding after-implementation screenshots

Captured from the running game after the boarding / capture / command-transfer engine. Viewport 1280×720 Chromium (Playwright). Compare with \`docs/boarding/screenshots/baseline-main/\`.

**No Referee Pass claimed.** Tractor remains not boarding. Away-team XP is **Not tracked yet**.

## Shots

| File | What |
| --- | --- |
| \`01-flight-hud.png\` | Flight HUD, stats strip, minimap, bottom dock |
| \`02-ops-ew.png\` | OPS / Power + EW (unchanged lane) |
| \`03-inventory.png\` | Inventory / weapon slots |
| \`04-settings.png\` | Settings + Security operator panel |
| \`05-target-full-hull.png\` | Target window at full hull — Board refused |
| \`06-target-boardable.png\` | ≤10% hull, detected, no gifted FS — Board / Capture / Scuttle / Fail + XP |
| \`07-command-transfer.png\` | After named capture inject — command-transfer path + XP |

## UI fit

\`clippedControls: []\` continues. Target host sits above the dock (\`targetDockClear\`).

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

Target (full hull):
\`\`\`json
${clipSummary(tgtDump, 'target')}
\`\`\`

Target (boardable):
\`\`\`json
${clipSummary(boardDump, 'target')}
\`\`\`

Command transfer:
\`\`\`json
${clipSummary(prizeDump, 'fleet')}
\`\`\`
`;
    fs.writeFileSync(path.join(outDir, 'NOTES.md'), notes);
    fs.writeFileSync(path.join(outDir, 'overflow.json'), JSON.stringify({
      ops: opsDump,
      inventory: invDump,
      settings: setDump,
      targetFull: tgtDump,
      targetBoardable: boardDump,
      transfer: prizeDump,
    }, null, 2));
    console.log(`Boarding screenshots written to ${outDir}`);
    console.log(`clippedControls boardable=${JSON.stringify(boardDump.clippedControls)} targetDockClear=${boardDump.targetDockClear}`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
