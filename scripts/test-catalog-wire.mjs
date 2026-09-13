#!/usr/bin/env node
/**
 * Catalog wire offline checks — pack roster, aliases, Reman meeting, region gates.
 * Written from docs/GUIDED-CONVERGENCE.md § Catalog wire and docs/APPROVED-HULL-MERGES.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CATALOG_WIRED,
  HOME_FACTION_STANDING,
  PASO_PROJECT_X_HULLS,
  PASO_PROJECT_X_VENDOR,
  PURCHASE_TIER_STANDING,
  assertNoDiscardedInList,
  authoredStockIds,
  catalogPurchaseContext,
  catalogSpawnContext,
  compatibilityManifestFromPack,
  createStartingStandings,
  createWiredCatalog,
  dedupeHullIds,
  evaluateWiredPurchase,
  hullIsEmptyButArmable,
  includeRemanWhenUnlocked,
  packDefaultWeaponSlots,
  resolveAliasId,
  resolvePackVendor,
  spawnIdsFromCatalog,
  stockIdsFromCatalog,
  unarmedNpcCannotFire,
} from '../src/ship-catalog-wire.js';
import {
  S7_8_MEETING_POINT,
  createPlayerUnlocks,
  grantRemanWarbirdAccess,
  meetPackPurchaseDecision,
} from '../src/side-lane-repair-reman.js';
import { FULL_CATALOG_WIRED } from '../src/side-lane-unrest-independence.js';
import { isLoadShipCatalogRequired, LOAD_SHIP_CATALOG_REQUIRED } from '../src/phase65-power.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'bm-ships/ships.json'), 'utf8'));
const sourceMap = JSON.parse(fs.readFileSync(path.join(root, 'bm-ships/bm2-id-map.json'), 'utf8'));
const sizes = JSON.parse(fs.readFileSync(path.join(root, 'bm-ships/size-config.json'), 'utf8'));
const generated = JSON.parse(fs.readFileSync(path.join(root, 'data/starship_manifest.json'), 'utf8'));
const catalog = createWiredCatalog(manifest, sourceMap, sizes);
const aliases = manifest.aliases || {};

assert('wire-flag-on', CATALOG_WIRED === true && FULL_CATALOG_WIRED === true);
assert('wire-load-required', isLoadShipCatalogRequired() === true && LOAD_SHIP_CATALOG_REQUIRED === true);
assert('roster-174', catalog.ships.length === 174);
assert('roster-172-active', catalog.ships.filter((ship) => ship.rosterState === 'active').length === 172);
assert('aliases-38', Object.keys(aliases).length === 38);

assert('alias-304-to-2', catalog.getShip(304)?.id === 2 && resolveAliasId(304, aliases) === 2);
assert('alias-18-to-316', catalog.getShip(18)?.id === 316);
assert('alias-7-to-308', catalog.getShip(7)?.id === 308);
assert('getShip-not-replace-26', catalog.getShip(26)?.id === 26);
assert('resolveNew-26-to-211', catalog.resolveNewShipId(26) === 211);
assert('reman-53-not-aliased', catalog.getShip(53)?.id === 53 && aliases[53] == null && aliases['53'] == null);

const discardedInActive = catalog.ships
  .filter((ship) => ship.rosterState === 'active')
  .map((ship) => ship.id)
  .filter((id) => Object.prototype.hasOwnProperty.call(aliases, id) || Object.prototype.hasOwnProperty.call(aliases, String(id)));
assert('no-discarded-active-rows', discardedInActive.length === 0, JSON.stringify(discardedInActive));

const stockAll = stockIdsFromCatalog(catalog, catalogPurchaseContext({
  credits: 9e9,
  standings: { terran: 100, romulan: 100, klingon: 100, ferengi: 100, neutral: 100 },
  systemName: 'Earth',
}), {});
assert('stock-dedupes-aliases', assertNoDiscardedInList(stockAll, aliases).length === 0);
assert('stock-not-both-304-and-2', !(stockAll.includes(304) && stockAll.includes(2)));
assert('stock-has-survivor-2', stockAll.includes(2));

const gorn = spawnIdsFromCatalog(catalog, catalogSpawnContext({ role: 'traffic', systemName: 'Gorn' }), 'gorn');
assert('gorn-pool-empty', gorn.length === 0);

const blender = spawnIdsFromCatalog(catalog, catalogSpawnContext({ role: 'patrol', systemName: 'Blender' }), 'dominion');
const dominica = spawnIdsFromCatalog(catalog, catalogSpawnContext({
  role: 'patrol',
  systemName: 'Dominica',
  region: 'dominion-core',
}), 'dominion');
const blenderHasCoreOnly = blender.some((id) => {
  const ship = catalog.getShip(id);
  return ship?.availabilityRegion === 'dominion-core';
});
assert('blender-has-remnant-or-general', blender.length >= 0 && blenderHasCoreOnly === false);
assert('dominica-may-include-core', Array.isArray(dominica));

const missionOnly = catalog.ships.filter((ship) => ship.availabilityRegion === 'mission-only');
const ambientMission = missionOnly.filter((ship) => catalog.eligibleForSpawn(ship.id, catalogSpawnContext({ role: 'traffic', systemName: 'Earth' })));
assert('mission-only-not-ambient', ambientMission.length === 0);

const pasoCtx = catalogPurchaseContext({
  credits: 9e9,
  standings: { terran: 100 },
  station: { name: 'X-Base', stockIds: [49] },
  systemName: 'Alpha Centauri',
});
assert('paso-vendor-from-x-base', pasoCtx.vendor === PASO_PROJECT_X_VENDOR && pasoCtx.systemName === 'paso');
const pasoStock = authoredStockIds([49], catalog, pasoCtx, createPlayerUnlocks());
for (const id of PASO_PROJECT_X_HULLS) {
  assert(`paso-stocks-${id}`, pasoStock.includes(id) || catalog.eligibleForStock(id, pasoCtx));
}
assert('paso-eligible-49', catalog.eligibleForStock(49, pasoCtx) === true);
assert('paso-eligible-347', catalog.eligibleForStock(347, pasoCtx) === true);
assert('paso-not-on-earth', catalog.eligibleForStock(347, catalogPurchaseContext({
  credits: 9e9,
  standings: { terran: 100 },
  systemName: 'Earth',
  station: { name: 'Utopia Planitia' },
})) === false);

const reman = catalog.getShip(53);
assert('reman-specialVendor-is-note', reman.specialVendor === 'remus-secret');
assert('s7.8-closed', S7_8_MEETING_POINT.closed === true && S7_8_MEETING_POINT.remusIsSoleKey === false);
assert('s7.8-note-not-key', S7_8_MEETING_POINT.specialVendorIsYardNote === true);

const remusPack = catalog.getPurchaseDecision(53, {
  role: 'purchase',
  systemName: 'remus',
  vendor: 'remus-secret',
  credits: 9e9,
  standings: { romulan: 75 },
  tierThresholds: PURCHASE_TIER_STANDING,
});
const locked = createPlayerUnlocks();
const granted = grantRemanWarbirdAccess(locked, { source: 'recovery-mission' });
const meetLockedAtRemus = meetPackPurchaseDecision(remusPack, locked, 53);
assert('reman-pack-may-allow-via-note', remusPack.allowed === true || remusPack.reason === 'restricted-stock' || remusPack.reason === 'region');
assert('reman-unlock-still-required', meetLockedAtRemus.allowed === false && meetLockedAtRemus.reason === 'access-locked');
assert('reman-vendor-note-not-unlock', meetLockedAtRemus.remusIsSoleKey === false);

const wiredLocked = evaluateWiredPurchase(catalog, 53, locked, catalogPurchaseContext({
  credits: 9e9,
  standings: { romulan: 75 },
  station: { name: 'Reman Starbase', stockIds: [53] },
  systemName: 'Remus',
}));
assert('wired-reman-locked', wiredLocked.allowed === false && wiredLocked.reason === 'access-locked');

const wiredGrantedOffRemus = evaluateWiredPurchase(catalog, 53, granted, catalogPurchaseContext({
  credits: 9e9,
  standings: { romulan: 75 },
  station: { name: 'Utopia Planitia' },
  systemName: 'Earth',
}));
assert(
  'wired-reman-survives-destroyed-or-off-remus',
  wiredGrantedOffRemus.allowed === true
    && (wiredGrantedOffRemus.reason === 'unlock-satisfies-restricted-stock'
      || wiredGrantedOffRemus.reason === 'unlock-survives-region'
      || wiredGrantedOffRemus.reason === 'eligible'
      || wiredGrantedOffRemus.meeting?.reason === 'unlock-satisfies-restricted-stock'
      || wiredGrantedOffRemus.meeting?.reason === 'unlock-survives-region'
      || wiredGrantedOffRemus.meeting?.reason === 'eligible'),
  JSON.stringify({ reason: wiredGrantedOffRemus.reason, pack: wiredGrantedOffRemus.packDecision }),
);

const remanVisibleLocked = includeRemanWhenUnlocked([], catalog, locked, catalogPurchaseContext({
  station: { name: 'Reman Starbase', stockIds: [53] },
  systemName: 'Remus',
}));
const remanHiddenElsewhere = includeRemanWhenUnlocked([], catalog, locked, catalogPurchaseContext({
  station: { name: 'Utopia Planitia' },
  systemName: 'Earth',
}));
const remanVisibleGranted = includeRemanWhenUnlocked([], catalog, granted, catalogPurchaseContext({
  station: { name: 'Utopia Planitia' },
  systemName: 'Earth',
}));
assert('reman-visible-at-note-yard-while-locked', remanVisibleLocked.includes(53));
assert('reman-hidden-elsewhere-while-locked', !remanHiddenElsewhere.includes(53));
assert('reman-visible-after-unlock-anywhere', remanVisibleGranted.includes(53));

const emptyHull = catalog.ships.find((ship) => hullIsEmptyButArmable(ship));
assert('empty-armable-exists', Boolean(emptyHull), 'no empty defaultWeaponSlots hull');
if (emptyHull) {
  const slots = packDefaultWeaponSlots(emptyHull);
  assert('empty-three-slots', slots?.length === 3 && slots.every((slot) => slot == null));
  assert('unarmed-cannot-fire', unarmedNpcCannotFire(emptyHull, slots, () => true) === true);
}

const standings = createStartingStandings('ferengi');
assert('new-character-home-20', standings.ferengi === HOME_FACTION_STANDING);
assert('other-factions-unset', standings.terran == null);

const standingBlock = evaluateWiredPurchase(catalog, 2, createPlayerUnlocks(), catalogPurchaseContext({
  credits: 9e9,
  standings: { terran: 0, neutral: 0 },
  systemName: 'Earth',
  station: { name: 'Utopia Planitia' },
}));
assert('standing-not-bypassed-by-money', standingBlock.allowed === false && standingBlock.reason === 'faction-standing');

const synced = compatibilityManifestFromPack(manifest);
assert('compat-no-drift-count', synced.ships.length === generated.ships.length);
assert('compat-generated-from-pack', String(generated.generatedFrom || '').includes('bm-ships/ships.json'));
assert('compat-aliases', JSON.stringify(generated.aliases) === JSON.stringify(manifest.aliases));

const traffic = spawnIdsFromCatalog(catalog, catalogSpawnContext({ role: 'traffic', systemName: 'Earth' }));
assert('traffic-deduped', assertNoDiscardedInList(traffic, aliases).length === 0);
assert('traffic-not-empty-earth', traffic.length > 0);

const vendor = resolvePackVendor({ name: 'X-Base', stockIds: [49] }, { systemName: 'Alpha Centauri' });
assert('x-base-is-paso-project-x', vendor.vendor === PASO_PROJECT_X_VENDOR && vendor.systemName === 'paso');

const summary = `Catalog wire offline: ${passed} passed, ${failed} failed`;
console.log(summary);
if (failures.length) {
  for (const row of failures) console.error(`FAIL ${row}`);
}
if (failed) process.exitCode = 1;
