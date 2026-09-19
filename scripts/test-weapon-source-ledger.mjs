#!/usr/bin/env node
/**
 * Offline weapon / device source-ledger probes (S22 family).
 * Written from docs/weapon-ledger/ only. Does not crib remastered-work.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tractorIsBoarding, BOARDING_IMPLEMENTED as EW_BOARDING } from '../src/phase9-ew.js';
import { BOARDING_IMPLEMENTED } from '../src/boarding-eligibility.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as SLOT_LOCK } from '../src/phase91-ew-slot.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE92_LOCK } from '../src/phase92-magnitudes.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE93_LOCK } from '../src/phase93-magnitudes.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE94_LOCK } from '../src/phase94-magnitudes.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as BOARDING_LOCK } from '../src/boarding-eligibility.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE10_LOCK } from '../src/phase10-magnitudes.js';
import { UTILITY_LOCKED_FROM_REMASTERED } from '../src/utility-inventory.js';
import { POWER_CONSUMERS } from '../src/phase65-power.js';
import {
  BASELINE_COMBAT_NUMBERS,
  FLASH_PRICES_ARE_LIVE_LOCKS as MATRIX_FLASH_LOCK,
  MATRIX_COLUMNS,
  UNIVERSAL_SHIELD_BYPASS as MATRIX_BYPASS,
  buildWeaponsMatrix,
  combatNumbersUnchanged,
  disruptorIdentities,
  listDeferredFlashUtilities,
  tractorRow,
} from '../src/phase9-weapons-matrix.js';
import {
  CANNON_ID,
  CANON_ID,
  FLASH_PRICES_ARE_LIVE_LOCKS,
  INHERITED_NOT_IN_FLASH_IDS,
  LEDGER_LOCKED_FROM_REMASTERED,
  PLASMA_TORPEDO_ID,
  PROVENANCE_VALUES,
  TURRET_ID,
  UNIVERSAL_SHIELD_BYPASS,
  VACANT_CATALOG_IDS,
  classifyDeferredUtilities,
  ledgerInjectMustNotGiftFire,
  lockFlashPrices,
  provenanceForLedgerRow,
  snapshotWeaponLedger,
  writeCombatNumbers,
} from '../src/weapon-source-ledger.js';

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

const gameItems = JSON.parse(fs.readFileSync(path.join(root, 'data/game_items.json'), 'utf8'));
const pack = JSON.parse(fs.readFileSync(path.join(root, 'bm-ships/ships.json'), 'utf8'));
const hulls = (pack.ships || []).filter((row) => row.rosterState === 'active');
const srcMain = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
const srcLedger = fs.readFileSync(path.join(root, 'src/weapon-source-ledger.js'), 'utf8');
const srcMatrix = fs.readFileSync(path.join(root, 'src/phase9-weapons-matrix.js'), 'utf8');
const srcUtil = fs.readFileSync(path.join(root, 'src/utility-inventory.js'), 'utf8');

assert('s22.startup-helpers', typeof snapshotWeaponLedger === 'function'
  && typeof writeCombatNumbers === 'function'
  && typeof classifyDeferredUtilities === 'function'
  && typeof buildWeaponsMatrix === 'function'
  && typeof listDeferredFlashUtilities === 'function'
  && typeof disruptorIdentities === 'function'
  && typeof tractorRow === 'function'
  && typeof combatNumbersUnchanged === 'function');

const snap = snapshotWeaponLedger({
  items: gameItems.weapons,
  tradeGoods: gameItems.tradeGoods,
  utilityBook: { items: [], facility_pass: [] },
  hulls,
  tractorIsBoard: tractorIsBoarding() === true,
  boardingImplemented: BOARDING_IMPLEMENTED === true,
});

assert('s22.1 helpers-present', snap.missing !== true, JSON.stringify(snap));
assert('s22.1 combat-unchanged', snap.combatUnchanged === true
  && combatNumbersUnchanged(gameItems.weapons, BASELINE_COMBAT_NUMBERS).unchanged === true,
JSON.stringify(snap.combatMismatches));
assert('s22.1 matrix-ten-columns', snap.matrixColumns === 10 && MATRIX_COLUMNS.length === 10);
assert('s22.1 live-prices-match-baseline', gameItems.weapons.every((item) => {
  const expected = BASELINE_COMBAT_NUMBERS[item.id];
  if (!expected) return true;
  return Number(item.damage) === expected.damage
    && Number(item.cooldown) === expected.cooldown
    && Number(item.range) === expected.range
    && Number(item.price) === expected.price;
}));

let writeRefused = false;
try {
  writeCombatNumbers(gameItems.weapons, 1, { damage: 99, price: 1 });
} catch (error) {
  writeRefused = String(error.message || '').includes('combat-number writes are forbidden');
}
assert('s22.1 combat-write-hard-fail', writeRefused === true);

assert('s22.2 three-ids', snap.disruptors.canon.id === CANON_ID
  && snap.disruptors.cannon.id === CANNON_ID
  && snap.disruptors.turret.id === TURRET_ID
  && snap.disruptors.distinct === true);
assert('s22.2 flash-identities', snap.disruptors.canon.flashIdentity === 'Disrupter Canon'
  && snap.disruptors.cannon.flashIdentity === 'Disrupter Cannon'
  && snap.disruptors.turret.flashIdentity === 'Disrupter Turret');
assert('s22.2 collision-is-finding', snap.findings.displayNameCollision.collision === true
  && snap.findings.displayNameCollision.merged === false
  && snap.findings.displayNameCollision.liveName === 'Disruptor Cannon');
assert('s22.2 tractor-device-slot', snap.tractor.id === 25
  && snap.tractor.type === 'Device'
  && snap.tractor.slot === true
  && snap.tractor.cargo === false
  && snap.tractor.boarding === false
  && tractorIsBoarding() === false);

assert('s22.3 flash-not-lock', snap.flashPricesAreLiveLocks === false
  && FLASH_PRICES_ARE_LIVE_LOCKS === false
  && MATRIX_FLASH_LOCK === false);
let flashLockRefused = false;
try {
  lockFlashPrices();
} catch (error) {
  flashLockRefused = String(error.message || '').includes('not live locks');
}
assert('s22.3 inject-not-required-to-lock', flashLockRefused === true);
assert('s22.3 plasma-uncertified', snap.plasmaTorpedo.id === PLASMA_TORPEDO_ID
  && snap.plasmaTorpedo.livePrice === 7200
  && snap.plasmaTorpedo.flashCertified === false
  && snap.plasmaTorpedo.flashPrice == null
  && snap.plasmaTorpedo.label === 'Flash name / bake-off price');

assert('s22.4 deferred-present', snap.deferredUtilities.length === 2
  && snap.deferredUtilities.every((row) => row.bakeoffId === null));
const sail = snap.deferredUtilities.find((row) => row.flashName === 'Bajoran Sail');
const core = snap.deferredUtilities.find((row) => row.flashName === 'Warp Core');
assert('s22.4 sail-not-cargo-or-book', sail
  && sail.cargo === false
  && sail.utilityBook === false
  && !gameItems.tradeGoods.includes('Bajoran Sail'));
assert('s22.4 warp-core-distinct', core
  && core.cargo === false
  && core.utilityBook === false
  && core.cargoNameWarpCoresDistinct === true
  && gameItems.tradeGoods.includes('Warp Cores')
  && !gameItems.tradeGoods.includes('Warp Core'));
assert('s22.4 not-in-utility-source', !srcUtil.includes('Bajoran Sail')
  && !srcUtil.includes('Warp Core')
  && listDeferredFlashUtilities().every((row) => row.bakeoffId === null));

assert('s22.5 inherited-complete', JSON.stringify(snap.inheritedNotInFlash) === JSON.stringify(INHERITED_NOT_IN_FLASH_IDS)
  && INHERITED_NOT_IN_FLASH_IDS.join(',') === '2,27,28,29,30,38,39,44,45');
assert('s22.5 no-invented-flash', snap.inheritedRows.every((row) => row.flashPrice == null && row.flashCertified === false));
assert('s22.5 hoj-new', snap.hoj.provenance === 'new' && snap.hoj.catalogId == null);
assert('s22.5 vacant-still-vacant', JSON.stringify(snap.vacantIdsStillVacant) === JSON.stringify(VACANT_CATALOG_IDS));

const allowedProvenance = new Set(PROVENANCE_VALUES);
assert('s22.6 provenance-enum', Array.isArray(snap.rows)
  && snap.rows.length > 0
  && snap.rows.every((row) => allowedProvenance.has(row.provenance)));
assert('s22.6 plasma-split-allowed', provenanceForLedgerRow(17) === 'BM1-flash'
  && snap.plasmaTorpedo.liveNumbersProvenance === 'bake-off-game-items');
assert('s22.6 no-universal-bypass', snap.universalShieldBypass === false
  && UNIVERSAL_SHIELD_BYPASS === false
  && MATRIX_BYPASS === false
  && snap.shields.ordinaryBeam.bypassedShields === false
  && snap.shields.ordinaryBeam.interaction === 'shields-then-hull'
  && snap.shields.loreDoesNotInherit === true);
const gifted = ledgerInjectMustNotGiftFire({
  firingSolution: true,
  engagement_authorized: true,
  cultureFire: true,
});
assert('s22.6 no-fire-gift', gifted.firingSolutionPresent === false
  && gifted.engagementAuthorizedPresent === false
  && gifted.cultureFire === false
  && !Object.prototype.hasOwnProperty.call(gifted.row, 'firingSolution')
  && !Object.prototype.hasOwnProperty.call(gifted.row, 'engagement_authorized')
  && snap.fire.firingSolutionPresent === false
  && snap.fire.engagementAuthorizedPresent === false);

assert('s22.7 lock-false', LEDGER_LOCKED_FROM_REMASTERED === false
  && snap.ledgerLockedFromRemastered === false
  && SLOT_LOCK === false
  && PHASE92_LOCK === false
  && PHASE93_LOCK === false
  && PHASE94_LOCK === false
  && BOARDING_LOCK === false
  && PHASE10_LOCK === false
  && UTILITY_LOCKED_FROM_REMASTERED === false);
assert('s22.7 boarding-preserved', BOARDING_IMPLEMENTED === true
  && EW_BOARDING === true
  && tractorIsBoarding() === false
  && snap.boarding.tractorIsBoard === false
  && snap.boarding.implemented === true);
assert('s22.7 five-consumers', POWER_CONSUMERS.join(',') === 'propulsion,weapons,cloak,sensors,ew');
assert('s22.7 no-remastered-import', !/from ['"][^'"]*remastered/i.test(srcLedger + srcMain)
  && !srcLedger.includes('git am')
  && !srcMain.includes('git am')
  && srcMain.includes('weaponLedger: createWeaponLedgerProbeApi()'));
assert('s22.7 matrix-not-rewritten', srcMatrix.includes('FLASH_PRICES_ARE_LIVE_LOCKS === false')
  || srcMatrix.includes('export const FLASH_PRICES_ARE_LIVE_LOCKS = false'));
assert('s22.7 no-ew-family-invent', !srcLedger.includes('new EW famil')
  && !srcLedger.includes('empty-but-armable')
  && !srcLedger.includes('Thaleron Test Facility'));

if (failed) {
  console.error(`Weapon source ledger offline probes: ${passed} passed, ${failed} failed`);
  for (const rowId of failures) console.error(`  FAIL ${rowId}`);
  process.exit(1);
}
console.log(`Weapon source ledger offline probes: ${passed} passed, ${failed} failed`);
