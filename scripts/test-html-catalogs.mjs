#!/usr/bin/env node
/**
 * Offline HTML catalog file-contract checks (S25 family).
 * Written from docs/html-catalogs/ only. Does not crib remastered-work.
 * Not a combat probe and not a new __BM1_PROBE__ namespace.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { FLASH_PRICES_ARE_LIVE_LOCKS } from '../src/weapon-source-ledger.js';
import { BASELINE_COMBAT_NUMBERS } from '../src/phase9-weapons-matrix.js';
import {
  HTML_CATALOG_LOCKED_FROM_REMASTERED,
  collectCatalogModel,
} from './build-html-catalogs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogDir = path.join(root, 'docs/html-catalogs');

let passed = 0;
let failed = 0;
const failures = [];

function assert(id, condition, detail = '') {
  if (condition) {
    passed += 1;
    return;
  }
  failed += 1;
  failures.push(`${id}${detail ? `: ${detail}` : ''}`);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function gitDiff(paths) {
  try {
    return execFileSync('git', ['diff', '--', ...paths], {
      cwd: root,
      encoding: 'utf8',
    });
  } catch (error) {
    return String(error.stdout || error.message || error);
  }
}

const pages = {
  index: path.join(catalogDir, 'index.html'),
  weapons: path.join(catalogDir, 'weapons.html'),
  stations: path.join(catalogDir, 'stations.html'),
  lockNote: path.join(catalogDir, 'LOCK-NOTE.md'),
};
const html = {
  index: fs.readFileSync(pages.index, 'utf8'),
  weapons: fs.readFileSync(pages.weapons, 'utf8'),
  stations: fs.readFileSync(pages.stations, 'utf8'),
};
const allHtml = `${html.index}\n${html.weapons}\n${html.stations}`;
const lockNote = fs.readFileSync(pages.lockNote, 'utf8');
const builder = read('scripts/build-html-catalogs.mjs');
const gameItems = JSON.parse(read('data/game_items.json'));
const manifest = JSON.parse(read('data/station_manifest.json'));
const stationData = JSON.parse(read('data/stationData.json'));
const model = collectCatalogModel();

assert('s25.1 pages-exist', fs.existsSync(pages.index)
  && fs.existsSync(pages.weapons)
  && fs.existsSync(pages.stations)
  && fs.existsSync(pages.lockNote));
assert('s25.1 html-not-markdown-only', html.index.includes('<!doctype html>')
  && html.weapons.includes('<table')
  && html.stations.includes('<table'));
assert('s25.1 flash-not-required', html.index.includes('Flash is source evidence')
  && !/\.swf/i.test(allHtml)
  && !/<embed/i.test(allHtml)
  && !/<object/i.test(allHtml)
  && !/application\/x-shockwave-flash/i.test(allHtml)
  && /data-flash-required="false"/.test(allHtml)
  && FLASH_PRICES_ARE_LIVE_LOCKS === false);

const shopChrome = /<(button|a|input)[^>]*>[\s\S]{0,80}?\b(Buy|Equip|Restock|Purchase|Checkout)\b/i;
const shopAction = /data-(shop-action|buy|equip|restock)|class="[^"]*\b(buy|equip|cart|checkout)\b/i;
assert('s25.2 no-shop-chrome', !shopChrome.test(allHtml)
  && !shopAction.test(allHtml)
  && /data-shop-controls="false"/.test(allHtml)
  && /not a shop/i.test(allHtml)
  && !/\bBuy now\b/i.test(allHtml)
  && !/add to loadout/i.test(allHtml)
  && !/install in slot/i.test(allHtml)
  && !/<button/i.test(allHtml));
assert('s25.2 flash-not-lock', /FLASH_PRICES_ARE_LIVE_LOCKS === false/.test(allHtml)
  && /data-flash-prices-are-live-locks="false"/.test(allHtml)
  && /Flash price \(source\)/.test(html.weapons));

const combatFields = ['id', 'name', 'type', 'price', 'damage', 'cooldown', 'range'];
const combatUnchanged = gameItems.weapons.every((item) => {
  const expected = BASELINE_COMBAT_NUMBERS[item.id];
  if (!expected) return true;
  return Number(item.damage) === expected.damage
    && Number(item.cooldown) === expected.cooldown
    && Number(item.range) === expected.range
    && Number(item.price) === expected.price;
});
const jsonDiff = gitDiff([
  'data/game_items.json',
  'data/station_manifest.json',
  'data/stationData.json',
]);
const srcDiff = gitDiff(['src/']);
assert('s25.2 no-json-combat-writes', combatUnchanged === true && jsonDiff === '');
assert('s25.5 src-combat-untouched', srcDiff === '');
assert('s25.2 generator-writes-docs-only', !builder.includes('writeFileSync(path.join(ROOT, \'data/')
  && builder.includes('docs/html-catalogs')
  && !builder.includes('__BM1_PROBE__'));

assert('s25.3 three-identities', html.weapons.includes('data-weapon-id="7"')
  && html.weapons.includes('data-flash-identity="Disrupter Canon"')
  && html.weapons.includes('data-weapon-id="6"')
  && html.weapons.includes('data-flash-identity="Disrupter Cannon"')
  && html.weapons.includes('data-weapon-id="12"')
  && html.weapons.includes('data-flash-identity="Disrupter Turret"')
  && html.weapons.includes('audit finding, not a merge'));
assert('s25.3 tractor-device', html.weapons.includes('data-weapon-id="25"')
  && html.weapons.includes('data-tractor="true"')
  && html.weapons.includes('data-slot-class="device"')
  && /Tractor Beam/.test(html.weapons)
  && /Not cargo/.test(html.weapons));
assert('s25.3 deferred-utilities', html.weapons.includes('data-deferred-utility="Bajoran Sail"')
  && html.weapons.includes('data-deferred-utility="Warp Core"')
  && html.weapons.includes('data-bakeoff-id=""')
  && /explicitly deferred utility/i.test(html.weapons)
  && /Warp Cores/.test(html.weapons));
assert('s25.3 inherited-empty-flash', [2, 27, 28, 29, 30, 38, 39, 44, 45].every((id) => (
  html.weapons.includes(`data-inherited-id="${id}"`)
)) && html.weapons.includes('Flash price empty / not in this Flash table'));
assert('s25.3 plasma-uncertified', html.weapons.includes('data-weapon-id="17"')
  && html.weapons.includes('data-plasma="true"')
  && html.weapons.includes('data-uncertified="true"')
  && html.weapons.includes('data-live-price="7200"')
  && /uncertified/.test(html.weapons));
assert('s25.3 cite-ledger', html.weapons.includes('docs/weapon-ledger/')
  && html.index.includes('snapshotWeaponLedger')
  && html.weapons.includes('provenance'));
assert('s25.3 vacant-not-invented', [20, 21, 31, 32, 33, 34, 35, 36, 37, 40, 41, 42, 43].every((id) => (
  html.weapons.includes(`data-vacant-id="${id}"`)
)));
assert('s25.3 station-type-count', manifest.stations.length === 36
  && html.stations.includes('data-station-type-count="36"')
  && [70, 83, 86, 87, 205].every((id) => html.stations.includes(`data-station-id="${id}"`)));
assert('s25.3 unknown-stock-labeled', [46, 47, 48, 50, 51, 52, 58].every((id) => (
  html.stations.includes(`data-stock-id="${id}"`)
  && html.stations.includes(`data-stock-label="unknown"`)
)) && html.stations.includes('listed in station stock; no live weapon def on this tip')
  && html.stations.includes('vacant / no live weapon def')
  && /unknown/i.test(html.stations));
assert('s25.3 defense-never-repair', html.stations.includes('data-station-id="86"')
  && html.stations.includes('data-repair="never-repair"')
  && html.stations.includes('data-station-id="87"')
  && !/repairCapable:\s*true/.test(html.stations));
assert('s25.3 model-matches-json', model.types.length === 36
  && (stationData.stations || []).length === 269
  && model.placements.length === 269
  && model.snap.disruptors.distinct === true
  && model.snap.plasmaTorpedo.flashCertified === false);

assert('s25.4 no-fire-gift', /never gifts/.test(allHtml)
  && /data-firing-solution-present="false"/.test(allHtml)
  && /data-engagement-authorized-present="false"/.test(allHtml)
  && !/firingSolution\s*=/.test(allHtml)
  && !/engagement_authorized\s*=/.test(allHtml)
  && !builder.includes('__BM1' + '_PROBE__'));

assert('s25.5 no-reopen-named-outs', !/git am/.test(allHtml)
  && html.index.includes('Do not reopen #33–#53')
  && html.index.includes('Brief #54 stay-locked')
  && !html.stations.includes('underConstruction')
  && !/Thaleron Test Facility pass shipped/.test(allHtml));

assert('s25.6 remastered-lock-false', HTML_CATALOG_LOCKED_FROM_REMASTERED === false
  && /HTML_CATALOG_LOCKED_FROM_REMASTERED === false/.test(allHtml)
  && /data-html-catalog-locked-from-remastered="false"/.test(allHtml)
  && lockNote.includes('HTML_CATALOG_LOCKED_FROM_REMASTERED === false')
  && !/LOCKED_FROM_REMASTERED === true/.test(allHtml));

if (failed) {
  console.error(`HTML catalogs file-contract: ${passed} passed, ${failed} failed`);
  for (const rowId of failures) console.error(`  FAIL ${rowId}`);
  process.exit(1);
}
console.log(`HTML catalogs file-contract: ${passed} passed, ${failed} failed`);
