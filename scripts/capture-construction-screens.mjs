#!/usr/bin/env node
/**
 * Capture 1280×720 construction-site language shots (scaffold / workbee / blue beam).
 * Usage:
 *   node scripts/capture-construction-screens.mjs --out docs/construction-visuals/screenshots/construction
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outDir = path.resolve(root, outIdx >= 0 ? args[outIdx + 1] : 'docs/construction-visuals/screenshots/construction');
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

async function shot(page, name) {
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.setDefaultTimeout(45000);
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => globalThis.BM1Probe?.ready?.() === true, null, { timeout: 60000 });
    await page.evaluate(() => {
      globalThis.BM1Probe.skipIntro();
      globalThis.BM1Probe.freezeLoop();
    });
    await page.evaluate(() => globalThis.BM1Probe.startGame('ferengi', {
      arena: { clearTraffic: true, latinum: 28000, hull: 70, shields: 70 },
    }));
    await page.evaluate(() => {
      document.querySelector('[data-top-action="close-panel"]')?.click();
      const settings = document.getElementById('settings-panel');
      if (settings) settings.classList.add('hidden');
    });
    await page.waitForTimeout(200);

    const before = await page.evaluate(() => {
      const p = globalThis.__BM1_PROBE__.constructionVisuals;
      if (!p) return { missing: true };
      globalThis.BM1Probe.freezeLoop();
      return { missing: false, idle: p.snapshot() };
    });
    await shot(page, '01-baseline-no-site');

    const built = await page.evaluate(() => {
      const p = globalThis.__BM1_PROBE__.constructionVisuals;
      const started = p.startBuild(75);
      const centered = p.centerOnSite(started.id);
      return {
        id: started.id,
        snap: p.snapshot(),
        language: started.language,
        centered,
      };
    });
    await page.waitForTimeout(120);
    await shot(page, '02-construction-site-language');

    const completed = await page.evaluate(({ id }) => {
      const p = globalThis.__BM1_PROBE__.constructionVisuals;
      const done = p.completeBuild(id);
      const centered = p.centerOnSite(id);
      return { ...done, centered };
    }, { id: built.id });
    await page.waitForTimeout(120);
    await shot(page, '03-construction-complete');

    const platform = await page.evaluate(() => {
      const p = globalThis.__BM1_PROBE__.constructionVisuals;
      const started = p.startBuild(86);
      const centered = p.centerOnSite(started.id);
      return {
        id: started.id,
        snap: p.snapshot(),
        centered,
      };
    });
    await page.waitForTimeout(120);
    await shot(page, '04-constructing-defense-platform');

    const notes = `# Construction visuals after-implementation screenshots

Captured from the running game after the S24 construction-visuals engine. Viewport 1280×720 Chromium (Playwright).

Scaffold / workbee / **blue**-beam language is programmatic because \`stationconstructing.gif\` is not in-tree (\`assetMissing: true\`). Placeholder gold/cyan dashes remain as HUD only.

**No Referee Pass claimed.** Repair overlay is unchanged. Construction beams are not Phase 4 evidence.

## Shots

| File | What |
| --- | --- |
| \`01-baseline-no-site.png\` | Flight view before a constructing station is injected |
| \`02-construction-site-language.png\` | Player-built site: scaffold frame, workbees, blue construction beams + remaining-days HUD |
| \`03-construction-complete.png\` | After \`completeDueStationConstructions\` — scaffold / workbee / blue-beam language stops |
| \`04-constructing-defense-platform.png\` | Constructing platform still shows build language and still cannot repair |

## Probe

\`\`\`json
${JSON.stringify({ before, built, platform, completed }, null, 2)}
\`\`\`
`;
    fs.writeFileSync(path.join(outDir, 'NOTES.md'), notes);
    fs.writeFileSync(path.join(outDir, 'probe.json'), JSON.stringify({ before, built, platform, completed }, null, 2));
    console.log(`Construction screenshots written to ${outDir}`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
