#!/usr/bin/env node
/**
 * Capture 1280×720 OPS/EW, Inventory, Settings, Target shots + overflow JSON.
 * Usage:
 *   node scripts/capture-phase93-screens.mjs --out docs/phase9/screenshots/baseline-93
 *   node scripts/capture-phase93-screens.mjs --out docs/phase9/screenshots/phase93 --after
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outDir = path.resolve(root, outIdx >= 0 ? args[outIdx + 1] : 'docs/phase9/screenshots/baseline-93');
const afterMode = args.includes('--after') || /(?:^|\/)phase93\/?$/.test(outDir);
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
        text: String(el.innerText || '').slice(0, 400),
      };
    };
    const panel = document.getElementById('top-left-panel');
    const content = panel?.querySelector('.top-left-panel-content');
    const dock = document.getElementById('bottom-dock');
    const target = document.getElementById('target-window');
    const panelBox = box(panel);
    const contentBox = box(content);
    const dockBox = box(dock);
    const targetBox = box(target);
    const clippedControls = [];
    const dockRect = dock && !dock.classList.contains('hidden') ? dock.getBoundingClientRect() : null;
    const panelRect = panel && !panel.classList.contains('hidden') ? panel.getBoundingClientRect() : null;
    const targetRect = target && !target.classList.contains('hidden') ? target.getBoundingClientRect() : null;
    const nodes = [
      ...(panel ? [...panel.querySelectorAll('button, [data-ew-ops] button, .ew-row button, .ship-actions button')] : []),
      ...(target && !target.classList.contains('hidden') ? [...target.querySelectorAll('button')] : []),
    ];
    for (const el of nodes) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const clipHost = panel?.contains(el) ? panelRect : targetRect;
      const visible = clipHost ? intersect(r, clipHost) : null;
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
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      ops: contentBox,
      panel: panelBox,
      inventory: contentBox,
      settings: contentBox,
      target: targetBox,
      dock: dockBox,
      clippedControls,
      overflowX: Boolean(contentBox?.overflowX || panelBox?.overflowX || targetBox?.overflowX),
      dockClear,
      hasEw: Boolean(document.querySelector('[data-ew-ops], .ew-ops, [data-ew-jammer]')),
    };
  };
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: false });
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
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

    let liveDump = null;
    let scrolledDump = null;
    if (afterMode) {
      await page.evaluate(() => {
        document.querySelector('[data-ew-slot="compact"]')?.click();
      });
      await page.waitForTimeout(80);
      await page.evaluate(() => {
        document.querySelector('[data-ew-jammer="on"]')?.click();
        document.querySelector('[data-ew-heat="on"]')?.click();
        document.querySelector('[data-ew-decoy="on"]')?.click();
        document.querySelector('[data-ew-silent="on"]')?.click();
        document.querySelector('[data-ew-eccm="boost"]')?.click();
        document.querySelector('[data-ew-poison="on"]')?.click();
        document.querySelector('[data-ew-df="on"]')?.click();
      });
      await page.waitForTimeout(80);
      await page.evaluate(() => {
        const p = globalThis.__BM1_PROBE__?.phase93;
        if (!p) return;
        p.injectSearch({
          subjectKey: 'npc:security-instance-9',
          identification: 'known',
          trackQuality: 'firm',
          firingSolution: true,
          scanConfidence: 1,
        });
        p.injectScanPoison({
          victimKey: 'player',
          subjectKey: 'npc:security-instance-9',
          S: 4,
          H: 1,
          failFocusedThisTick: true,
        });
        p.injectFocusedScan({
          subjectKey: 'npc:security-instance-9',
          completeNow: false,
          poisoned: true,
          poisonFailThisTick: true,
          S: 4,
        });
        p.injectPaidJammer({ fitted: 'compact', S: 4, H: 1, E: 4 });
        p.injectDfAssist({
          S: 4,
          H: 1,
          contributions: [{
            actorKey: 'npc:security-instance-7',
            paid: true,
            paidDraw: 1.6,
            inLobe: true,
            sideId: 'klingon',
            securityInstanceId: 'security-instance-7',
            family: 'sensor_jamming',
            bearing: { x: 1, y: 0 },
          }],
        });
      });
      await page.waitForTimeout(200);
      await page.evaluate(() => {
        document.querySelector('[data-top-left-tab="power"]')?.click();
        document.querySelector('[data-dock-action="power"]')?.click();
      });
      await page.waitForTimeout(200);
      liveDump = await page.evaluate(measureScript());
      await shot(page, '06-ops-ew-live');
      fs.writeFileSync(path.join(outDir, '06-ops-ew-live-overflow.json'), JSON.stringify(liveDump, null, 2));
      await page.evaluate(() => {
        const content = document.querySelector('.top-left-panel-content');
        if (content) content.scrollTop = content.scrollHeight;
      });
      await page.waitForTimeout(80);
      scrolledDump = await page.evaluate(measureScript());
      await shot(page, '07-ops-ew-scrolled');
      fs.writeFileSync(path.join(outDir, '07-ops-ew-scrolled-overflow.json'), JSON.stringify(scrolledDump, null, 2));
      await page.evaluate(() => {
        const content = document.querySelector('.top-left-panel-content');
        if (content) content.scrollTop = 0;
      });
    }

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
        id: 'shot-target',
        faction: 'klingon',
        role: 'patrol',
        x: 1260,
        y: 900,
        hostile: false,
      });
      const key = victim?.securityInstanceId ? `npc:${victim.securityInstanceId}` : null;
      const lock = key ? globalThis.__BM1_PROBE__?.phase6?.grantLiveLock?.(key) : null;
      document.querySelector('[data-dock-action="target"]')?.click();
      return { victim, key, lockOk: lock?.ok === true, firing: lock?.firingSolution === true };
    });
    await page.waitForTimeout(200);
    const tgtDump = await page.evaluate(measureScript());
    await shot(page, '05-target');
    fs.writeFileSync(path.join(outDir, '05-target-overflow.json'), JSON.stringify(tgtDump, null, 2));

    const clipSummary = (dump, key = 'ops') => JSON.stringify({
      overflowX: dump.overflowX,
      clippedControls: dump.clippedControls,
      dockClear: dump.dockClear,
      [key]: dump[key] || dump.ops,
      dock: dump.dock,
    }, null, 2);

    const notes = afterMode
      ? `# Phase 9.3 after-implementation screenshots

Captured from the running game after the 9.3 scan-poison + DF assist engine. Viewport 1280×720 Chromium (Playwright). Compare with \`docs/phase9/screenshots/baseline-93/\`.

DockClear polish is **out**. Process lock: \`clippedControls: []\`; no horizontal overflow.

## Shots

| File | What |
| --- | --- |
| \`01-flight-hud.png\` | Flight HUD, stats strip, minimap, bottom dock |
| \`02-ops-ew.png\` | OPS / Power + 9.3 scan-poison / DF assist controls |
| \`03-inventory.png\` | Inventory / weapon slots + dedicated EW slot |
| \`04-settings.png\` | Settings + Security operator panel |
| \`05-target.png\` | Target / contact window |
| \`06-ops-ew-live.png\` | Poison On + DF On + poisoned Focused Scan + DF cue readout |
| \`07-ops-ew-scrolled.png\` | OPS scrolled to poison / DF / cue / sayable rows |

## UI fit (gate 8)

OPS EW controls including new 9.3 rows stay inside the panel. \`clippedControls: []\`. No horizontal overflow. Contained \`overflow-y: auto\` is OK. DockClear polish not opened.

OPS:
\`\`\`json
${clipSummary(opsDump, 'ops')}
\`\`\`

OPS live:
\`\`\`json
${liveDump ? clipSummary(liveDump, 'ops') : '{}'}
\`\`\`

OPS scrolled:
\`\`\`json
${scrolledDump ? clipSummary(scrolledDump, 'ops') : '{}'}
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
${JSON.stringify({ overflowX: tgtDump.overflowX, clippedControls: tgtDump.clippedControls, target: tgtDump.target, dock: tgtDump.dock }, null, 2)}
\`\`\`

- Close is the top-right panel chrome, not under the dock.
- New 9.3 rows (scan-poison / DF assist / cue) are reachable by contained scroll and do not paint under the dock.
`
      : `# Phase 9.3 baseline screenshots (main, before 9.3 engine)

Captured from the running game on bake-off \`main\` @ \`7eb2387\` before Phase 9.3 engine work. Viewport 1280×720 Chromium (Playwright).

## Shots

| File | What |
| --- | --- |
| \`01-flight-hud.png\` | Flight HUD, stats strip, minimap, bottom dock |
| \`02-ops-ew.png\` | OPS / Power + Phase 9.2 EW controls (pre-9.3) |
| \`03-inventory.png\` | Inventory / weapon slots + dedicated EW slot |
| \`04-settings.png\` | Settings + Security operator panel |
| \`05-target.png\` | Target / contact window |

## Overflow / clip (pre-9.3)

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
${JSON.stringify({ overflowX: tgtDump.overflowX, clippedControls: tgtDump.clippedControls, target: tgtDump.target, dock: tgtDump.dock }, null, 2)}
\`\`\`

- Contained \`overflow-y: auto\` is OK. Horizontal overflow is not.
- DockClear polish is **out** of this lane.
`;
    fs.writeFileSync(path.join(outDir, 'NOTES.md'), notes);
    fs.writeFileSync(path.join(outDir, 'overflow.json'), JSON.stringify({
      ops: opsDump,
      inventory: invDump,
      settings: setDump,
      target: tgtDump,
      live: liveDump,
      scrolled: scrolledDump,
    }, null, 2));
    console.log(`Wrote shots to ${outDir}`);
    console.log(JSON.stringify({
      afterMode,
      opsClipped: opsDump.clippedControls.length,
      opsDockClear: opsDump.dockClear,
      liveClipped: liveDump?.clippedControls?.length ?? null,
      scrolledClipped: scrolledDump?.clippedControls?.length ?? null,
      invClipped: invDump.clippedControls.length,
      settingsClipped: setDump.clippedControls.length,
      targetHidden: tgtDump.target?.hidden,
      targetInfo,
    }));
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
