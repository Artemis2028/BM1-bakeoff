#!/usr/bin/env node
/**
 * Offline Bajoran Solar Sailor probes (S32 family).
 * Written from docs/bajoran-solar-sailor/ only. Does not crib remastered-work.
 * S18.18 stays unamended. Screenshot / no-clip N/A (no sailor chrome).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROE_MODES } from '../src/phase2-security.js';
import { emptyDominionBook } from '../src/phase10-dominion-book.js';
import { PHASE10_ROSTER_LOCKED_FROM_REMASTERED } from '../src/phase10-roster.js';
import {
  FLASH_PRICES_ARE_LIVE_LOCKS,
  listDeferredFlashUtilities,
} from '../src/phase9-weapons-matrix.js';
import {
  hullIsEmptyButArmable,
  packDefaultWeaponSlots,
  unarmedNpcCannotFire,
} from '../src/ship-catalog-wire.js';
import {
  EMPTY_ARMABLE_LOCKED_FROM_REMASTERED,
  mayEmitProjectile,
  resolveCombatWeaponId,
} from '../src/empty-armable.js';
import {
  LEDGER_LOCKED_FROM_REMASTERED,
  classifyDeferredUtilities,
  snapshotWeaponLedger,
} from '../src/weapon-source-ledger.js';
import { THALERON_TEST_FACILITY_PASS, UTILITY_LOCKED_FROM_REMASTERED } from '../src/utility-inventory.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as BOARDING_ODDS_LOCKED } from '../src/boarding-eligibility.js';
import {
  BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED,
  applySolarSailorInject,
  emptySolarSailorBook,
  requireSolarSailorHelpers,
  restoreSolarSailorBook,
  serializeSolarSailorBook,
  solarSailorPosture,
  solarSailorSnapshot,
} from '../src/bajoran-solar-sailor.js';

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

function slotsEmpty(slots) {
  return Array.isArray(slots) && slots.length === 3 && slots.every((slot) => slot == null);
}

function withoutInjectedId(snap) {
  const copy = JSON.parse(JSON.stringify(snap));
  delete copy.injectedHullId;
  return JSON.stringify(copy);
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

const srcSailor = fs.readFileSync(path.join(root, 'src/bajoran-solar-sailor.js'), 'utf8');
const srcMain = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
const srcMatrix = fs.readFileSync(path.join(root, 'src/phase9-weapons-matrix.js'), 'utf8');
const srcLedger = fs.readFileSync(path.join(root, 'src/weapon-source-ledger.js'), 'utf8');
const srcDominion = fs.readFileSync(path.join(root, 'src/phase10-dominion-book.js'), 'utf8');
const srcPhase10Test = fs.readFileSync(path.join(root, 'scripts/test-phase10-dominion.mjs'), 'utf8');
const srcProbe = fs.readFileSync(path.join(root, 'scripts/behavior-probe.mjs'), 'utf8');
const srcRoe = fs.readFileSync(path.join(root, 'src/phase2-security.js'), 'utf8');
const gameItems = JSON.parse(fs.readFileSync(path.join(root, 'data/game_items.json'), 'utf8'));
const pack = JSON.parse(fs.readFileSync(path.join(root, 'bm-ships/ships.json'), 'utf8'));
const hulls = (pack.ships || []).filter((row) => row.rosterState === 'active');

let helpersThrew = false;
try {
  requireSolarSailorHelpers();
} catch {
  helpersThrew = true;
}

assert('s32.startup-helpers', helpersThrew === false
  && typeof emptySolarSailorBook === 'function'
  && typeof solarSailorSnapshot === 'function'
  && typeof applySolarSailorInject === 'function'
  && typeof solarSailorPosture === 'function'
  && BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED === false);

const snap = solarSailorSnapshot(emptySolarSailorBook());
const forbidden = [
  'firingSolution',
  'engagement_authorized',
  'cultureFire',
  'cost',
  'art',
  'artPath',
  'image',
  'hull',
  'shields',
  'speed',
  'id',
  'rosterPlayable',
];

assert('s32.1 ship-not-utility', snap.missing !== true
  && snap.classification === 'ship'
  && snap.flashName === 'Bajoran Sail'
  && snap.displayName === 'Bajoran Solar Sailor'
  && snap.faction === 'bajoran'
  && snap.shipClass === 'shuttle'
  && snap.role === 'fragile-freighter'
  && snap.cargo === false
  && snap.utilityBook === false
  && snap.weaponCatalogId === null
  && snap.inLiveUtilityBook === false
  && snap.inLiveTradeGoods === false
  && forbidden.every((key) => !hasOwn(snap, key)));

const posture = solarSailorPosture();
const helperSlots = packDefaultWeaponSlots(posture);
assert('s32.2 begins-unarmed', snap.beginsUnarmed === true
  && snap.armedByDefault === false
  && slotsEmpty(snap.defaultWeaponSlots)
  && slotsEmpty(helperSlots)
  && hullIsEmptyButArmable(posture) === true
  && snap.emptyButArmable === true
  && unarmedNpcCannotFire(posture, helperSlots, () => true) === true
  && snap.unarmedCannotFire === true
  && mayEmitProjectile(helperSlots, { isCombatWeapon: () => true }) === false
  && snap.emitsProjectile === false
  && resolveCombatWeaponId(helperSlots, { ship: posture, isCombatWeapon: () => true }) == null
  && snap.combatWeaponId == null);

const dominion = emptyDominionBook();
const scopeBefore = dominion.scope;
const playableBefore = JSON.stringify(dominion.rosterPlayable);
const withDominion = solarSailorSnapshot(emptySolarSailorBook(), { dominionBook: dominion });
assert('s32.3 no-playable-gift', snap.rosterPlayableGift === false
  && withDominion.dominionScope === 'dominion-first'
  && withDominion.rosterPlayableIndependent === false
  && withDominion.rosterPlayableFerengi === false
  && withDominion.rosterPlayableVulcan === false
  && dominion.scope === scopeBefore
  && dominion.scope === 'dominion-first'
  && JSON.stringify(dominion.rosterPlayable) === playableBefore
  && dominion.rosterPlayable.ferengi === false
  && dominion.rosterPlayable.independent === false
  && dominion.rosterPlayable.vulcan === false
  && srcPhase10Test.includes("assert('s18.18 dominion-first'")
  && srcPhase10Test.includes("emptyDominionBook().scope === 'dominion-first'")
  && !srcDominion.includes('bajoran-solar-sailor')
  && !srcSailor.includes('state.dominionBook')
  && !srcSailor.includes('rosterPlayable ='));

const fired = emptySolarSailorBook();
applySolarSailorInject(fired, {
  firingSolution: true,
  engagement_authorized: true,
  cultureFire: true,
  grantsFire: true,
});
const firedSnap = solarSailorSnapshot(fired);
assert('s32.4 no-gifted-fire', snap.grantsFire === false
  && snap.cultureGrantsFire === false
  && snap.mayAutoEngageFromSailor === false
  && firedSnap.grantsFire === false
  && forbidden.every((key) => !hasOwn(firedSnap, key))
  && !hasOwn(serializeSolarSailorBook(fired), 'firingSolution')
  && !hasOwn(serializeSolarSailorBook(fired), 'engagement_authorized'));

const deferred = listDeferredFlashUtilities();
const matrixSail = deferred.find((row) => row.flashName === 'Bajoran Sail');
const matrixCore = deferred.find((row) => row.flashName === 'Warp Core');
const classified = classifyDeferredUtilities(['Warp Cores'], { items: [] }, deferred);
const classSail = classified.find((row) => row.flashName === 'Bajoran Sail');
const classCore = classified.find((row) => row.flashName === 'Warp Core');
const ledger = snapshotWeaponLedger({
  items: gameItems.weapons,
  tradeGoods: gameItems.tradeGoods,
  utilityBook: { items: [], facility_pass: [] },
  hulls,
  tractorIsBoard: false,
  boardingImplemented: true,
});
const ledgerCore = ledger.deferredUtilities.find((row) => row.flashName === 'Warp Core');
const ledgerSail = ledger.deferredUtilities.find((row) => row.flashName === 'Bajoran Sail');
assert('s32.5 lanes-and-warp-core', snap.classification === 'ship'
  && matrixSail?.mapping === 'deferred-utility'
  && matrixSail?.bakeoffId == null
  && matrixCore?.mapping === 'deferred-utility-not-trade-good'
  && matrixCore?.bakeoffId == null
  && deferred.length === 2
  && classSail?.classification === 'deferred-utility'
  && classCore?.classification === 'deferred-utility-not-trade-good'
  && classCore?.cargoNameWarpCoresDistinct === true
  && ledger.combatUnchanged === true
  && ledger.flashPricesAreLiveLocks === false
  && ledgerSail?.classification === 'deferred-utility'
  && ledgerCore?.classification === 'deferred-utility-not-trade-good'
  && ledgerCore?.cargo === false
  && ledgerCore?.cargoNameWarpCoresDistinct === true
  && snap.namedOuts.matrixSailMapping === 'deferred-utility'
  && snap.namedOuts.matrixWarpCoreMapping === 'deferred-utility-not-trade-good'
  && srcMatrix.includes("flashName: 'Bajoran Sail', flashPrice: 5000, flashFamily: 'Utility', mapping: 'deferred-utility', bakeoffId: null")
  && srcMatrix.includes("flashName: 'Warp Core', flashPrice: 12000, flashFamily: 'Utility', mapping: 'deferred-utility-not-trade-good', bakeoffId: null")
  && srcLedger.includes("classification: 'deferred-utility'")
  && !srcMatrix.includes('bajoran-solar-sailor')
  && !srcLedger.includes('bajoran-solar-sailor'));

assert('s32.6 no-third-roe', JSON.stringify(ROE_MODES) === JSON.stringify(['return-fire', 'defend'])
  && JSON.stringify(snap.roeModes) === JSON.stringify(['return-fire', 'defend'])
  && snap.protectAll === false
  && snap.protectApplied === 'record_only'
  && !snap.roeModes.includes('protect-all')
  && srcRoe.includes("export const ROE_MODES = Object.freeze(['return-fire', 'defend'])")
  && !srcSailor.includes('protect-all')
  && !srcSailor.includes('ROE_MODES.push'));

const beforeInject = solarSailorSnapshot(emptySolarSailorBook());
const injectedBook = emptySolarSailorBook();
applySolarSailorInject(injectedBook, {
  hullId: 345,
  idLocked: true,
  magnitudesLocked: true,
  lockedFromRemastered: true,
  cost: 5000,
  artPath: 'bm-ships/locked.png',
  image: 'locked.png',
  hull: 12,
  shields: 8,
  speed: 3,
  firingSolution: true,
  engagement_authorized: true,
  cultureFire: true,
  classification: 'deferred-utility',
  armedByDefault: true,
  defaultWeaponSlots: [1, 2, 3],
  weaponCatalogId: 9,
  rosterPlayableGift: true,
  grantsFire: true,
  cargo: true,
  utilityBook: true,
});
const afterInject = solarSailorSnapshot(injectedBook);
const lockOnly = emptySolarSailorBook();
applySolarSailorInject(lockOnly, { idLocked: true, magnitudesLocked: true, id: '345' });
const lockOnlySnap = solarSailorSnapshot(lockOnly);
assert('s32.7 blind-injectable-id', snap.lockedFromRemastered === false
  && snap.idLocked === false
  && snap.magnitudesLocked === false
  && !hasOwn(beforeInject, 'injectedHullId')
  && !hasOwn(beforeInject, 'id')
  && afterInject.injectedHullId === 345
  && afterInject.idLocked === false
  && afterInject.magnitudesLocked === false
  && afterInject.lockedFromRemastered === false
  && afterInject.classification === 'ship'
  && slotsEmpty(afterInject.defaultWeaponSlots)
  && afterInject.armedByDefault === false
  && afterInject.weaponCatalogId === null
  && withoutInjectedId(beforeInject) === withoutInjectedId(afterInject)
  && !hasOwn(lockOnlySnap, 'injectedHullId')
  && lockOnlySnap.idLocked === false
  && withoutInjectedId(beforeInject) === withoutInjectedId(lockOnlySnap)
  && !srcSailor.includes('345'));

const poisoned = serializeSolarSailorBook(emptySolarSailorBook());
poisoned.classification = 'deferred-utility';
poisoned.idLocked = true;
poisoned.magnitudesLocked = true;
poisoned.BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED = true;
poisoned.defaultWeaponSlots = [1, null, null];
poisoned.armedByDefault = true;
poisoned.firingSolution = true;
poisoned.engagement_authorized = true;
poisoned.grantsFire = true;
poisoned.rosterPlayableGift = true;
poisoned.cost = 5000;
poisoned.id = 345;
poisoned.weaponCatalogId = 8;
poisoned.cargo = true;
poisoned.utilityBook = true;
const restored = solarSailorSnapshot(restoreSolarSailorBook(poisoned));
const roundTrip = serializeSolarSailorBook(injectedBook);
const roundSnap = solarSailorSnapshot(restoreSolarSailorBook(roundTrip));
assert('s32.7 restore-strips-locks', restored.classification === 'ship'
  && restored.lockedFromRemastered === false
  && restored.idLocked === false
  && restored.magnitudesLocked === false
  && restored.grantsFire === false
  && restored.rosterPlayableGift === false
  && restored.cargo === false
  && restored.utilityBook === false
  && restored.weaponCatalogId === null
  && restored.armedByDefault === false
  && slotsEmpty(restored.defaultWeaponSlots)
  && !hasOwn(restored, 'injectedHullId')
  && !hasOwn(restored, 'id')
  && !hasOwn(restored, 'firingSolution')
  && !hasOwn(restored, 'cost')
  && roundTrip.classification === 'ship'
  && roundTrip.idLocked === false
  && roundTrip.injectedHullId === 345
  && !hasOwn(roundTrip, 'firingSolution')
  && !hasOwn(roundTrip, 'cost')
  && !hasOwn(roundTrip, 'id')
  && roundSnap.injectedHullId === 345
  && roundSnap.idLocked === false
  && roundSnap.classification === 'ship');

assert('s32.8 named-outs', FLASH_PRICES_ARE_LIVE_LOCKS === false
  && snap.namedOuts.flashPricesAreLiveLocks === false
  && THALERON_TEST_FACILITY_PASS.shipped === false
  && THALERON_TEST_FACILITY_PASS.verified === false
  && snap.namedOuts.thaleronShipped === false
  && snap.namedOuts.thaleronVerified === false
  && BOARDING_ODDS_LOCKED === false
  && snap.namedOuts.boardingOddsLocked === false
  && snap.namedOuts.warpCoreBakeoffId == null
  && classCore?.flashName === 'Warp Core'
  && classCore?.classification !== 'ship'
  && gameItems.tradeGoods.includes('Warp Cores')
  && !gameItems.tradeGoods.includes('Warp Core')
  && !gameItems.tradeGoods.includes('Bajoran Sail'));

assert('s32.locks-stay-false', BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED === false
  && PHASE10_ROSTER_LOCKED_FROM_REMASTERED === false
  && LEDGER_LOCKED_FROM_REMASTERED === false
  && EMPTY_ARMABLE_LOCKED_FROM_REMASTERED === false
  && UTILITY_LOCKED_FROM_REMASTERED === false
  && snap.lockedFromRemastered === false);

assert('s32.wire', srcMain.includes("from './bajoran-solar-sailor.js'")
  && srcMain.includes('solarSailorBook: emptySolarSailorBook()')
  && srcMain.includes('solarSailorBook: serializeSolarSailorBook(ensureSolarSailorBook())')
  && srcMain.includes('state.solarSailorBook = restoreSolarSailorBook(s.solarSailorBook)')
  && (srcMain.match(/state\.solarSailorBook = emptySolarSailorBook\(\)/g) || []).length === 3
  && (srcMain.match(/solarSailor: createSolarSailorProbeApi\(\)/g) || []).length === 2
  && srcProbe.includes('S32.1 ship-not-utility')
  && srcProbe.includes('S32.7 blind')
  && !srcMain.includes('data-bajoran-solar-sailor')
  && !srcSailor.includes('data-bajoran-solar-sailor')
  && !srcSailor.includes('git am')
  && !srcSailor.includes('state.weaponSlots')
  && !/classification:\s*'deferred-utility'/.test(srcSailor));

const untouched = [
  'src/phase9-weapons-matrix.js',
  'src/weapon-source-ledger.js',
  'src/phase10-dominion-book.js',
  'src/phase10-roster.js',
  'src/empty-armable.js',
  'src/utility-inventory.js',
  'src/phase2-security.js',
  'src/dock-clear.js',
];
assert('s32.untouched-lanes', untouched.every((file) => !fs.readFileSync(path.join(root, file), 'utf8').includes('bajoran-solar-sailor')));

console.log(`Bajoran Solar Sailor offline: ${passed} passed, ${failed} failed`);
if (failed) {
  console.error(failures.join('\n'));
  process.exit(1);
}
