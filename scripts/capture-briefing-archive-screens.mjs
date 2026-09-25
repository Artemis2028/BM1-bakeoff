#!/usr/bin/env node
/**
 * 1280×720 captains-briefing / jump-intel archive shots.
 * Baseline (main, before the panel): flight area where the host will sit, and the jump UI.
 * After: briefing view and archive view, plus no-clip JSON on #briefing-archive.
 *
 *   node scripts/capture-briefing-archive-screens.mjs --mode baseline --out docs/briefing-archive/screenshots/baseline
 *   node scripts/capture-briefing-archive-screens.mjs --mode after --out docs/briefing-archive/screenshots/after
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
  mode === 'baseline' ? 'docs/briefing-archive/screenshots/baseline' : 'docs/briefing-archive/screenshots/after'
));
const PORT = Number(process.env.PROBE_PORT) || 8773;
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

function measureBriefingHost() {
  return () => {
    const overlap = (a, b) => a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const host = document.getElementById('briefing-archive');
    const dock = document.getElementById('bottom-dock');
    const select = host?.querySelector('.briefing-archive-select') || null;
    const body = host?.querySelector('.briefing-archive-body') || null;
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
        text: String(el.innerText || '').slice(0, 1200),
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
    const ghostSentence = 'Ghost contact. Sensor record only — no hull, no firing solution.';
    const suspicion = 'Suspicion only — not a firing solution, not identity.';
    const ghostEl = [...(host?.querySelectorAll('.briefing-line') || [])].find((el) => String(el.textContent || '').includes('Ghost'));
    let ghostWordClipped = false;
    let ghostWordBox = null;
    if (ghostEl) {
      const style = getComputedStyle(ghostEl);
      if (style.textOverflow === 'ellipsis' || style.whiteSpace === 'nowrap') ghostWordClipped = true;
      if (ghostEl.scrollWidth > ghostEl.clientWidth + 1) ghostWordClipped = true;
      const textNode = ghostEl.firstChild;
      const word = 'Ghost';
      const idx = textNode && textNode.nodeType === 3 ? textNode.textContent.indexOf(word) : -1;
      if (idx >= 0 && hostRect) {
        const range = document.createRange();
        range.setStart(textNode, idx);
        range.setEnd(textNode, idx + word.length);
        const rect = range.getBoundingClientRect();
        ghostWordBox = {
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          width: Math.round(rect.width),
        };
        const inside = rect.width > 8
          && rect.left >= hostRect.left - 1
          && rect.right <= hostRect.right + 1
          && rect.top >= hostRect.top - 1
          && rect.bottom <= hostRect.bottom + 1;
        if (!inside) ghostWordClipped = true;
      } else if (!String(ghostEl.textContent || '').includes(ghostSentence)) {
        ghostWordClipped = true;
      }
    }
    const text = String(host?.innerText || '');
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      hostPresent: Boolean(host),
      host: box(host),
      select: box(select),
      body: box(body),
      dock: box(dock),
      hostClearsDock: !hostRect || !dockRect || hostRect.bottom <= dockRect.top + 1,
      hostOverflowX: Boolean(host && host.scrollWidth > host.clientWidth + 1),
      selectOverflowX: Boolean(select && select.scrollWidth > select.clientWidth + 1),
      bodyOverflowX: Boolean(body && body.scrollWidth > body.clientWidth + 1),
      bodyOverflowYContained: Boolean(body && getComputedStyle(body).overflowY === 'auto'),
      clippedControls,
      ghostSentencePresent: text.includes(ghostSentence),
      suspicionPresent: text.includes(suspicion) || text.includes('Claim only'),
      ghostWordClipped,
      ghostWordBox,
      view: host?.dataset?.view || null,
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
      await shot(page, '01-briefing-area');
      await page.evaluate(() => {
        document.querySelector('[data-dock-action="map"]')?.click();
        document.getElementById('btn-map')?.click();
        globalThis.BM1Probe?.paint?.();
      });
      await page.waitForTimeout(300);
      await shot(page, '02-jump-archive-area');
      fs.writeFileSync(path.join(outDir, 'baseline-note.json'), JSON.stringify({
        mode: 'baseline',
        viewport: { width: 1280, height: 720 },
        hostPresent: false,
        note: 'Captured on main before #briefing-archive existed. 01 is the flight area where the briefing host will sit. 02 is the current jump / arrival map.',
      }, null, 2));
      return;
    }
    await page.evaluate(() => {
      const api = globalThis.__BM1_PROBE__?.briefingArchive;
      if (!api) throw new Error('briefingArchive probe missing');
      api.installPerceivedContact({
        contactId: 'ctc-0000-ghost',
        subjectKey: 'ghost:baseline-shot',
        ghost: true,
        source: 'ew_ghost',
        detected: true,
        identification: 'none',
        trackQuality: 'area',
        firingSolution: false,
        trueHull: 'Jem Hadar Attack Ship',
        sideId: 'dominion',
      });
      api.installPerceivedContact({
        contactId: 'ctc-0001-spoof',
        subjectKey: 'npc:spoof-shot',
        detected: true,
        identification: 'partial',
        trackQuality: 'area',
        firingSolution: false,
        spoofExposed: false,
        sideId: 'dominion',
        transponderClaim: { mode: 'spoof', spoofedFaction: 'bajoran' },
      });
      const first = api.produce({ systemIndex: 0, strategicJumps: 0 });
      api.select(first.id);
      api.setView('briefing');
      globalThis.BM1Probe?.paint?.();
    });
    await page.waitForTimeout(250);
    await shot(page, '01-briefing-view');
    const briefingFit = await page.evaluate(measureBriefingHost());
    const archiveScene = await page.evaluate(() => {
      const api = globalThis.__BM1_PROBE__.briefingArchive;
      const second = api.produce({ systemIndex: 0, strategicJumps: 1 });
      api.setView('archive');
      const selected = api.select('brf-1');
      globalThis.BM1Probe?.paint?.();
      const text = String(document.getElementById('briefing-archive')?.innerText || '');
      return {
        secondId: second.id,
        secondDeduped: second.deduped === true,
        selectedId: selected.selectedId,
        bodyStartsJump0: (selected.lines || []).some((line) => String(line).includes('Jump 0')),
        text,
      };
    });
    await page.waitForTimeout(200);
    await shot(page, '02-archive-view');
    const archiveFit = await page.evaluate(measureBriefingHost());
    const archiveText = String(archiveScene.text || '');
    const archiveList = archiveText.toLowerCase();
    const twoRows = archiveList.includes('brf-1') && archiveList.includes('brf-2');
    const overflow = {
      viewport: { width: 1280, height: 720 },
      measuredOn: '#briefing-archive',
      briefingView: briefingFit,
      archiveView: archiveFit,
      archiveScene: {
        secondId: archiveScene.secondId,
        secondDeduped: archiveScene.secondDeduped,
        selectedId: archiveScene.selectedId,
        bodyStartsJump0: archiveScene.bodyStartsJump0,
        twoRows,
      },
      clippedControls: [
        ...(briefingFit.clippedControls || []),
        ...(archiveFit.clippedControls || []),
      ],
      hostClearsDock: briefingFit.hostClearsDock === true && archiveFit.hostClearsDock === true,
      hostOverflowX: briefingFit.hostOverflowX === true || archiveFit.hostOverflowX === true,
      ghostWordClipped: briefingFit.ghostWordClipped === true || archiveFit.ghostWordClipped === true,
      ghostSentencePresent: briefingFit.ghostSentencePresent === true && archiveFit.ghostSentencePresent === true,
    };
    overflow.clippedControls = [...new Set(overflow.clippedControls)];
    fs.writeFileSync(path.join(outDir, 'overflow.json'), JSON.stringify(overflow, null, 2));
    const archiveShowsFrozenJump0 = archiveScene.secondDeduped === false
      && archiveScene.secondId === 'brf-2'
      && archiveScene.selectedId === 'brf-1'
      && archiveScene.bodyStartsJump0 === true
      && twoRows
      && archiveList.includes('jump 0');
    if (overflow.clippedControls.length || overflow.ghostWordClipped || !overflow.ghostSentencePresent || !overflow.hostClearsDock || overflow.hostOverflowX || !archiveShowsFrozenJump0) {
      console.error(JSON.stringify(overflow, null, 2));
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
