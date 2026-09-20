#!/usr/bin/env node
/**
 * Read-only HTML catalog generator (S25).
 *
 * Subscribes to the landed weapon ledger + in-repo JSON and writes static
 * review pages under docs/html-catalogs/. Does not write game_items.json,
 * station JSON, or src/. Does not crib remastered-work.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FLASH_PRICES_ARE_LIVE_LOCKS,
  INHERITED_NOT_IN_FLASH_IDS,
  VACANT_CATALOG_IDS,
  snapshotWeaponLedger,
} from '../src/weapon-source-ledger.js';
import { buildWeaponsMatrix, listDeferredFlashUtilities } from '../src/phase9-weapons-matrix.js';

export const HTML_CATALOG_LOCKED_FROM_REMASTERED = false;
export const FLASH_REQUIRED = false;
export const SHOP_CONTROLS = false;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'docs/html-catalogs');

const UNKNOWN_STOCK_IDS = Object.freeze([46, 47, 48, 50, 51, 52, 58]);
const REPAIR_CAPABLE_SIZE_CLASSES = Object.freeze(['starbase', 'shipyard', 'heavy-shipyard']);
const REPAIR_MAINTENANCE_TYPE_ID = 83;
const REPAIR_DEFENSE_PLATFORM_TYPE_IDS = Object.freeze([86, 87]);

const FLASH_NOTES = Object.freeze({
  1: 'Default player starter in empty-armable cite only; do not auto-fill.',
  3: 'Row-scoped lore note only. No universal bypass.',
  5: 'Hull/device cutter. Not capture. Not universal bypass.',
  6: 'Flash identity Cannon (dual). Live name shares “Disruptor Cannon” with id 7 — audit finding, not a merge.',
  7: 'Flash identity Canon (single). Live display name collides with id 6 — do not collapse the rows.',
  10: 'Flash family Pulse vs live Cannon — observation, not a retune.',
  12: 'Third disruptor identity (Turret).',
  14: 'Flash family Pulse vs live Turret — observation, not a retune.',
  17: 'Flash name; Flash price not supplied. Live 7200 is current data, uncertified.',
  18: 'Row-scoped Borg-shield lore. No universal bypass.',
  19: 'Row-scoped lore note only. Shields-then-hull default.',
  22: 'Device. Phase 6 cloak already landed. Not utilityBook.',
  23: 'Device drain / engine sting. Not a fire-permission token.',
  24: 'Device. Not a gifted firingSolution.',
  25: 'Device slot. Not cargo. Not utilityBook. Not boarding.',
  26: 'Cloud weapon. Not the Thaleron Test Facility pass. Not boarding. Not a facility invent.',
});

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cell(value, fallback = '—') {
  if (value == null || value === '') return fallback;
  return escapeHtml(value);
}

function slotClassFor(item) {
  const type = String(item?.type || '').toLowerCase();
  if (Number(item?.id) === 25) return 'device';
  if (type === 'device') return 'device';
  if (type === 'heavy') return 'combat/device (Heavy)';
  return 'combat';
}

function repairCite(station) {
  const id = Number(station.id);
  if (REPAIR_DEFENSE_PLATFORM_TYPE_IDS.includes(id) || station.sizeClass === 'defense-platform') {
    return { label: 'never repair', key: 'never-repair' };
  }
  if (REPAIR_CAPABLE_SIZE_CLASSES.includes(station.sizeClass) || id === REPAIR_MAINTENANCE_TYPE_ID) {
    return { label: 'repair-capable per PR #18', key: 'repair-capable-cite' };
  }
  return { label: 'not a repair yard (cite PR #18)', key: 'cite-only' };
}

function stockLabel(id, liveIds) {
  const numeric = Number(id);
  if (liveIds.has(numeric)) {
    return { kind: 'live', text: 'live weapon def (current data)' };
  }
  if (VACANT_CATALOG_IDS.includes(numeric)) {
    return { kind: 'vacant', text: 'vacant / no live weapon def' };
  }
  if (UNKNOWN_STOCK_IDS.includes(numeric)) {
    return { kind: 'unknown', text: 'listed in station stock; no live weapon def on this tip' };
  }
  return { kind: 'unknown', text: 'listed in station stock; no live weapon def on this tip' };
}

export function collectCatalogModel() {
  const gameItems = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/game_items.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/station_manifest.json'), 'utf8'));
  const stationData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/stationData.json'), 'utf8'));
  const items = gameItems.weapons || [];
  const liveIds = new Set(items.map((row) => Number(row.id)));
  const matrixRows = buildWeaponsMatrix(items, []);
  const snap = snapshotWeaponLedger({
    items,
    tradeGoods: gameItems.tradeGoods,
    utilityBook: { items: [], facility_pass: [] },
    hulls: [],
  });
  const byId = new Map(items.map((row) => [Number(row.id), row]));
  const matrixById = new Map(matrixRows.map((row) => [Number(row.id), row]));

  const liveRows = items.map((item) => {
    const id = Number(item.id);
    const matrix = matrixById.get(id);
    const inherited = INHERITED_NOT_IN_FLASH_IDS.includes(id);
    const flashPrice = inherited || id === 17 ? null : (matrix?.flashPrice ?? null);
    return {
      kind: inherited ? 'inherited' : 'live',
      id,
      flashName: matrix?.flashName || (id === 17 ? 'Plasma Torpedo' : null),
      flashPrice,
      flashCertified: false,
      liveName: item.name,
      liveType: item.type,
      livePrice: item.price,
      slotClass: slotClassFor(item),
      provenance: snap.rows.find((row) => Number(row.id) === id)?.provenance || (inherited ? 'bake-off-game-items' : 'BM1-flash'),
      livePriceLock: false,
      notes: inherited
        ? 'Inherited extra. Flash price empty / not in this Flash table.'
        : (FLASH_NOTES[id] || 'Ledger-cited current data. Not a live lock.'),
    };
  });

  const deferred = listDeferredFlashUtilities().map((row) => ({
    kind: 'deferred',
    id: null,
    flashName: row.flashName,
    flashPrice: row.flashPrice,
    flashCertified: false,
    liveName: '—',
    liveType: '—',
    livePrice: null,
    slotClass: 'deferred utility',
    provenance: 'BM1-flash',
    livePriceLock: false,
    notes: row.flashName === 'Warp Core'
      ? 'Explicitly deferred utility. bakeoffId null. Distinct from cargo “Warp Cores.” Not utilityBook. No invented id.'
      : 'Explicitly deferred utility. bakeoffId null. Not cargo. Not utilityBook. No invented id.',
  }));

  const hoj = {
    kind: 'hoj',
    id: null,
    flashName: '—',
    flashPrice: null,
    flashCertified: false,
    liveName: snap.hoj?.name || 'Home-on-Jam / anti-emitter (proposed)',
    liveType: '—',
    livePrice: null,
    slotClass: 'unmounted',
    provenance: 'new',
    livePriceLock: false,
    notes: 'provenance new; unmounted; not a catalog id.',
  };

  const vacant = VACANT_CATALOG_IDS.map((id) => ({
    id,
    live: liveIds.has(id),
  }));

  const types = (manifest.stations || []).map((station) => {
    const cite = repairCite(station);
    return {
      id: station.id,
      name: station.name,
      description: station.description || '',
      sizeClass: station.sizeClass,
      cost: station.cost,
      hull: station.hull,
      shields: station.shields,
      mass: station.mass,
      cargoCapacity: station.cargoCapacity,
      image: station.image,
      repairCite: cite.label,
      repairKey: cite.key,
    };
  });

  const placements = (stationData.stations || []).map((row) => ({
    id: row.id,
    name: row.name,
    systemNumber: row.systemNumber,
    stationTypeId: row.stationTypeId,
    typeName: types.find((type) => Number(type.id) === Number(row.stationTypeId))?.name || 'unknown type',
    weaponIds: Array.isArray(row.stock?.weaponIds) ? row.stock.weaponIds.map(Number) : [],
  }));

  const stockIds = [...new Set(placements.flatMap((row) => row.weaponIds))].sort((a, b) => a - b);
  const stockAudit = stockIds.map((id) => ({
    id,
    ...stockLabel(id, liveIds),
    liveName: byId.get(id)?.name || null,
  }));

  return {
    htmlCatalogLockedFromRemastered: HTML_CATALOG_LOCKED_FROM_REMASTERED === true,
    flashRequired: FLASH_REQUIRED === true,
    flashPricesAreLiveLocks: FLASH_PRICES_ARE_LIVE_LOCKS === true,
    shopControls: SHOP_CONTROLS === true,
    snap,
    liveRows,
    deferred,
    hoj,
    vacant,
    types,
    placements,
    stockAudit,
    liveIds,
  };
}

const SHARED_CSS = `
:root{color-scheme:dark;font:16px/1.5 system-ui,sans-serif;background:#0b1320;color:#e8eef5}
*{box-sizing:border-box}
body{margin:0}
main{max-width:1480px;padding:28px;margin:auto}
h1{font-size:clamp(24px,4vw,38px);line-height:1.15;margin:10px 0 14px}
h2{font-size:20px;margin:28px 0 10px}
p{color:#b8c8d9}
.eyebrow{color:#ffce5b;font-size:12px;letter-spacing:1.5px;text-transform:uppercase}
.banner{background:#121f31;border:1px solid #34465f;border-radius:12px;padding:16px 18px;margin:16px 0}
.banner code,.lock{color:#ffdb87}
nav{display:flex;flex-wrap:wrap;gap:12px;margin:16px 0 8px}
nav a{color:#a8d7ff}
.toolbar{position:sticky;top:0;z-index:1;background:#0b1320f5;padding:12px 0;display:flex;gap:10px;border-bottom:1px solid #344458}
input{font:inherit;color:inherit;background:#182438;border:1px solid #52617a;border-radius:8px;padding:10px 12px;flex:1}
.table-wrap{overflow:auto;border:1px solid #34465f;border-radius:10px}
table{width:100%;border-collapse:collapse;min-width:980px}
th,td{padding:8px 10px;border-bottom:1px solid #2a3a50;text-align:left;vertical-align:top}
th{position:sticky;top:0;background:#182438;color:#adc6df;font-size:13px;letter-spacing:.3px}
tr[hidden]{display:none}
.finding{color:#ffce5b}
.note{color:#9dafc2;font-size:13px}
footer{margin:28px 0;font-size:13px;color:#9aafc4}
a{color:#a8d7ff}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{font-size:12px;padding:2px 8px;border-radius:999px;background:#0c1727;border:1px solid #34465f}
.chip.vacant,.chip.unknown{color:#ffce5b}
.chip.live{color:#b8e0c4}
`;

function pageShell({ title, heading, intro, body }) {
  return `<!doctype html>
<html lang="en"
  data-html-catalog-locked-from-remastered="false"
  data-flash-required="false"
  data-flash-prices-are-live-locks="false"
  data-shop-controls="false"
  data-firing-solution-present="false"
  data-engagement-authorized-present="false"
  data-src-combat-untouched="true">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${SHARED_CSS}</style>
<main>
  <div class="eyebrow">S25 static HTML review · bake-off docs · Flash is evidence</div>
  <h1>${escapeHtml(heading)}</h1>
  <div class="banner" data-lock-banner="true">
    <p><code>HTML_CATALOG_LOCKED_FROM_REMASTERED === false</code></p>
    <p><code>FLASH_PRICES_ARE_LIVE_LOCKS === false</code> · Flash is source evidence, not a viewer. No SWF embed.</p>
    <p>Inspect defs only. Not a shop. Not a live price lock. Not a combat retune. Opening this page never gifts <code>firingSolution</code>, culture fire, or <code>engagement_authorized</code>.</p>
    <p>Brief <a href="BM1-HTML-WEAPON-STATION-REVIEW-CATALOGS-PROPOSAL.md">#54</a> stay-locked. Cite <a href="../weapon-ledger/BM1-WEAPON-DEVICE-SOURCE-LEDGER-PROPOSAL.md">docs/weapon-ledger/</a> + landed <code>snapshotWeaponLedger</code>. No Referee Pass claimed.</p>
  </div>
  <nav>
    <a href="index.html">Index</a>
    <a href="weapons.html">Weapons</a>
    <a href="stations.html">Stations</a>
    <a href="LOCK-NOTE.md">Lock note</a>
  </nav>
  <p>${intro}</p>
  ${body}
  <footer>Generated from bake-off JSON + ledger subscribe only. Does not write combat fields. Does not reopen #33–#54.</footer>
</main>
</html>
`;
}

function weaponRowHtml(row, extra = '') {
  const flashPrice = row.flashPrice == null ? 'empty / not supplied' : row.flashPrice;
  const livePrice = row.livePrice == null ? '—' : row.livePrice;
  const attrs = [
    row.id != null ? `data-weapon-id="${escapeHtml(row.id)}"` : '',
    row.flashName ? `data-flash-name="${escapeHtml(row.flashName)}"` : '',
    `data-flash-certified="${row.flashCertified === true}"`,
    `data-live-price-lock="false"`,
    `data-slot-class="${escapeHtml(row.slotClass)}"`,
    `data-provenance="${escapeHtml(row.provenance)}"`,
    extra,
  ].filter(Boolean).join(' ');
  return `<tr ${attrs}>
    <td>${cell(row.flashName)}</td>
    <td data-flash-price="${row.flashPrice == null ? '' : escapeHtml(row.flashPrice)}">${cell(flashPrice)}</td>
    <td>${row.id == null ? '—' : escapeHtml(row.id)}</td>
    <td>${cell(row.liveName)}</td>
    <td>${cell(row.liveType)}</td>
    <td data-live-price="${row.livePrice == null ? '' : escapeHtml(row.livePrice)}">${cell(livePrice)}</td>
    <td>${cell(row.slotClass)}</td>
    <td>${cell(row.provenance)}</td>
    <td>No</td>
    <td class="note">${cell(row.notes)}</td>
  </tr>`;
}

function renderWeapons(model) {
  const live = model.liveRows.filter((row) => row.kind === 'live').map((row) => {
    const extras = [];
    if (row.id === 7) extras.push('data-flash-identity="Disrupter Canon"');
    if (row.id === 6) extras.push('data-flash-identity="Disrupter Cannon"');
    if (row.id === 12) extras.push('data-flash-identity="Disrupter Turret"');
    if (row.id === 25) extras.push('data-tractor="true"');
    if (row.id === 17) extras.push('data-plasma="true" data-uncertified="true"');
    return weaponRowHtml(row, extras.join(' '));
  }).join('\n');

  const inherited = model.liveRows.filter((row) => row.kind === 'inherited').map((row) => (
    weaponRowHtml(row, `data-inherited-id="${row.id}"`)
  )).join('\n');

  const deferred = model.deferred.map((row) => (
    weaponRowHtml(row, `data-deferred-utility="${escapeHtml(row.flashName)}" data-bakeoff-id=""`)
  )).join('\n');

  const hoj = weaponRowHtml(model.hoj, 'data-hoj="true" data-catalog-id=""');
  const vacant = model.vacant.map((row) => (
    `<tr data-vacant-id="${row.id}"><td>${row.id}</td><td>vacant</td><td>no live weapon def</td><td>Do not invent a row.</td></tr>`
  )).join('\n');

  const body = `
  <p class="finding">Canon / Cannon / Turret stay three identities (ids 7 / 6 / 12). Live names of 6 and 7 both read “Disruptor Cannon” — shown as an audit finding, not merged.</p>
  <div class="toolbar"><input id="search" type="search" placeholder="Filter rows (inspect only)"></div>
  <h2>Flash vs bake-off identities</h2>
  <div class="table-wrap">
  <table id="weapons">
    <thead><tr>
      <th>Flash name</th><th>Flash price (source)</th><th>Bake-off id</th>
      <th>Live name</th><th>Live type</th><th>Live price (current data)</th>
      <th>Slot class</th><th>Provenance</th><th>Live price lock?</th><th>Notes</th>
    </tr></thead>
    <tbody>
      ${live}
      ${deferred}
      ${inherited}
      ${hoj}
    </tbody>
  </table>
  </div>
  <h2>Vacant catalog ids (not invented)</h2>
  <div class="table-wrap">
  <table id="vacant">
    <thead><tr><th>Id</th><th>Status</th><th>Live def</th><th>Notes</th></tr></thead>
    <tbody>${vacant}</tbody>
  </table>
  </div>
  <p class="note">Description cells stay empty: Flash flavor copy was not in the bake-off source packet. Tractor id 25 remains a Device. Bajoran Sail / Warp Core remain deferred. Plasma 7200 is uncertified.</p>
  <script>
    const input = document.getElementById('search');
    const tables = ['weapons', 'vacant'].map((id) => document.getElementById(id));
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase();
      for (const table of tables) {
        for (const row of table.tBodies[0].rows) {
          row.hidden = Boolean(q) && !row.textContent.toLowerCase().includes(q);
        }
      }
    });
  </script>`;

  return pageShell({
    title: 'BM1 weapon review catalog',
    heading: 'Weapon / device review catalog',
    intro: 'Read-only inspect of landed ledger identities and <code>data/game_items.json</code>. Flash and bake-off are both shown. This page is knowledge, not a vendor.',
    body,
  });
}

function renderStations(model) {
  const typeRows = model.types.map((station) => `
    <tr data-station-id="${escapeHtml(station.id)}" data-repair="${escapeHtml(station.repairKey)}">
      <td>${escapeHtml(station.id)}</td>
      <td>${escapeHtml(station.name)}</td>
      <td>${escapeHtml(station.sizeClass)}</td>
      <td data-cost-lock="false">${escapeHtml(station.cost)}</td>
      <td>${escapeHtml(station.hull)}</td>
      <td>${escapeHtml(station.shields)}</td>
      <td>${escapeHtml(station.mass)}</td>
      <td>${escapeHtml(station.cargoCapacity)}</td>
      <td class="note">${escapeHtml(station.image)}</td>
      <td class="note">${escapeHtml(station.repairCite)}</td>
      <td class="note">${escapeHtml(station.description)}</td>
    </tr>`).join('\n');

  const stockRows = model.stockAudit.map((row) => `
    <tr data-stock-id="${row.id}" data-stock-label="${row.kind}">
      <td>${row.id}</td>
      <td>${cell(row.liveName, row.kind === 'live' ? '—' : 'unknown')}</td>
      <td>${escapeHtml(row.kind)}</td>
      <td class="note">${escapeHtml(row.text)}</td>
    </tr>`).join('\n');

  const placementRows = model.placements.map((row) => {
    const chips = row.weaponIds.map((id) => {
      const label = stockLabel(id, model.liveIds);
      return `<span class="chip ${label.kind}" data-stock-id="${id}" data-stock-label="${label.kind}">${id} · ${escapeHtml(label.kind)}</span>`;
    }).join(' ') || '<span class="note">none listed</span>';
    return `<tr data-placement-id="${escapeHtml(row.id)}">
      <td>${escapeHtml(row.id)}</td>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.systemNumber)}</td>
      <td>${escapeHtml(row.stationTypeId)}</td>
      <td>${escapeHtml(row.typeName)}</td>
      <td><div class="chips">${chips}</div></td>
    </tr>`;
  }).join('\n');

  const body = `
  <p data-station-type-count="${model.types.length}">${model.types.length} station types from <code>data/station_manifest.json</code>. Costs / hull / shields are bake-off current data, not Flash-certified prices. Construction-site language is a visual lane already landed (PRs #52/#53); this page does not draw sites and does not reopen #53.</p>
  <p class="note">A research-named type is current JSON only. It does not ship a Thaleron pass or facility.</p>
  <div class="toolbar"><input id="search" type="search" placeholder="Filter rows (inspect only)"></div>
  <h2>Type catalog</h2>
  <div class="table-wrap">
  <table id="types">
    <thead><tr>
      <th>Id</th><th>Name</th><th>sizeClass</th><th>Cost (current data)</th>
      <th>Hull</th><th>Shields</th><th>Mass</th><th>Cargo</th><th>Image</th>
      <th>Repair cite</th><th>Description (current JSON)</th>
    </tr></thead>
    <tbody>${typeRows}</tbody>
  </table>
  </div>
  <h2>Placement stock weapon ids</h2>
  <p class="note">Ids listed on placements that lack a live <code>weapons[]</code> def stay labeled. They are not invented and not dropped.</p>
  <div class="table-wrap">
  <table id="stock">
    <thead><tr><th>Stock id</th><th>Live name</th><th>Label</th><th>Notes</th></tr></thead>
    <tbody>${stockRows}</tbody>
  </table>
  </div>
  <h2>Placements (${model.placements.length})</h2>
  <div class="table-wrap">
  <table id="placements">
    <thead><tr><th>Placement id</th><th>Name</th><th>System</th><th>Type id</th><th>Type name</th><th>stock.weaponIds (inspect)</th></tr></thead>
    <tbody>${placementRows}</tbody>
  </table>
  </div>
  <script>
    const input = document.getElementById('search');
    const tables = ['types', 'stock', 'placements'].map((id) => document.getElementById(id));
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase();
      for (const table of tables) {
        for (const row of table.tBodies[0].rows) {
          row.hidden = Boolean(q) && !row.textContent.toLowerCase().includes(q);
        }
      }
    });
  </script>`;

  return pageShell({
    title: 'BM1 station review catalog',
    heading: 'Station review catalog',
    intro: 'Read-only inspect of <code>data/station_manifest.json</code> (36 types) and <code>data/stationData.json</code> placements. Not a second market and not a construction reopen.',
    body,
  });
}

function renderIndex(model) {
  const body = `
  <ul>
    <li><a href="weapons.html">Weapon / device catalog</a> — Flash vs bake-off, ledger-cited identities, Tractor Device, deferred Sail / Warp Core, Plasma 7200 uncertified.</li>
    <li><a href="stations.html">Station type + placement catalog</a> — ${model.types.length} types; vacant / unknown stock ids labeled.</li>
    <li><a href="LOCK-NOTE.md">Companion lock note</a> — remastered-lock false.</li>
    <li><a href="BM1-HTML-WEAPON-STATION-REVIEW-CATALOGS-PROPOSAL.md">Passed brief (stay locked)</a></li>
  </ul>
  <h2>Hard gates on these pages</h2>
  <ol>
    <li>Catalogs are HTML. Flash is evidence, not the viewer.</li>
    <li>Inspect only — no Buy chrome, no shop, no live price lock, no JSON combat writes.</li>
    <li>Subscribe ledger + JSON read-only; show both; cite the ledger; no silent Canon/Cannon/Turret merge.</li>
    <li>Opening a page never gifts fire.</li>
    <li>Do not reopen #33–#53. Brief #54 stay-locked.</li>
    <li>Named outs held (dockClear, economy knobs, combat retune, Thaleron facility, remastered crib).</li>
    <li><code>HTML_CATALOG_LOCKED_FROM_REMASTERED === false</code>.</li>
  </ol>`;
  return pageShell({
    title: 'BM1 HTML weapon / station review catalogs',
    heading: 'HTML review catalogs',
    intro: 'Static docs page set for inspecting weapon and station defs without the Flash client. Medium analog: <a href="../ship-balance/REVIEW.html">docs/ship-balance/REVIEW.html</a> (hull review only — not a number source).',
    body,
  });
}

export function writeCatalogPages(model = collectCatalogModel()) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = {
    'index.html': renderIndex(model),
    'weapons.html': renderWeapons(model),
    'stations.html': renderStations(model),
  };
  for (const [name, html] of Object.entries(files)) {
    fs.writeFileSync(path.join(OUT_DIR, name), html);
  }
  return Object.keys(files).map((name) => path.join(OUT_DIR, name));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const written = writeCatalogPages();
  console.log(`Wrote ${written.length} HTML catalog pages (lock=${HTML_CATALOG_LOCKED_FROM_REMASTERED})`);
}
