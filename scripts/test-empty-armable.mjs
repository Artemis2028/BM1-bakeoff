#!/usr/bin/env node
/**
 * Offline empty-but-armable probes (S23 family).
 * Written from docs/empty-armable/ only. Does not crib remastered-work.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tractorIsBoarding, BOARDING_IMPLEMENTED as EW_BOARDING } from '../src/phase9-ew.js';
import { BOARDING_IMPLEMENTED } from '../src/boarding-eligibility.js';
import { emptySlotsStayEmpty } from '../src/boarding-identity.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as SLOT_LOCK } from '../src/phase91-ew-slot.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE92_LOCK } from '../src/phase92-magnitudes.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE93_LOCK } from '../src/phase93-magnitudes.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE94_LOCK } from '../src/phase94-magnitudes.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as BOARDING_LOCK } from '../src/boarding-eligibility.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE10_LOCK } from '../src/phase10-magnitudes.js';
import { UTILITY_LOCKED_FROM_REMASTERED } from '../src/utility-inventory.js';
import { LEDGER_LOCKED_FROM_REMASTERED } from '../src/weapon-source-ledger.js';
import { POWER_CONSUMERS } from '../src/phase65-power.js';
import {
  hullIsEmptyButArmable,
  packDefaultWeaponSlots,
  unarmedNpcCannotFire,
} from '../src/ship-catalog-wire.js';
import {
  CANONICAL_EMPTY_SLOTS,
  DEFAULT_WEAPON_ID_TYPE_X,
  EMPTY_ARMABLE_LOCKED_FROM_REMASTERED,
  EMPTY_ARMABLE_SLOT_COUNT,
  PACK_EMPTY_EXAMPLES,
  TRACTOR_BEAM_ID,
  assertNoTypeXAutofill,
  canonicalizeWeaponSlots,
  emptyArmableInjectMustNotGiftFire,
  hullPackIsEmptyArmable,
  mayEmitProjectile,
  refuseAutofillDefaultWeapon,
  requireEmptyArmableHelpers,
  resolveCombatWeaponId,
  slotsAreEmpty,
  snapshotEmptyArmable,
} from '../src/empty-armable.js';

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

const pack = JSON.parse(fs.readFileSync(path.join(root, 'bm-ships/ships.json'), 'utf8'));
const gameItems = JSON.parse(fs.readFileSync(path.join(root, 'data/game_items.json'), 'utf8'));
const srcMain = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
const srcEmpty = fs.readFileSync(path.join(root, 'src/empty-armable.js'), 'utf8');
const srcCatalog = fs.readFileSync(path.join(root, 'src/ship-catalog-wire.js'), 'utf8');

assert('s23.startup-helpers', typeof canonicalizeWeaponSlots === 'function'
  && typeof slotsAreEmpty === 'function'
  && typeof mayEmitProjectile === 'function'
  && typeof snapshotEmptyArmable === 'function'
  && typeof packDefaultWeaponSlots === 'function'
  && typeof hullIsEmptyButArmable === 'function'
  && typeof unarmedNpcCannotFire === 'function');

let helpersOk = true;
try {
  requireEmptyArmableHelpers();
} catch {
  helpersOk = false;
}
assert('s23.startup-subscribe', helpersOk === true);

const emptyHulls = (pack.ships || []).filter((ship) => hullIsEmptyButArmable(ship));
assert('s23.1 pack-examples', PACK_EMPTY_EXAMPLES.every((id) => emptyHulls.some((ship) => Number(ship.id) === id)));
const shuttle = emptyHulls.find((ship) => Number(ship.id) === 350);
const packSlots = packDefaultWeaponSlots(shuttle);
assert('s23.1 three-slots', EMPTY_ARMABLE_SLOT_COUNT === 3
  && canonicalizeWeaponSlots([]).length === 3
  && canonicalizeWeaponSlots([null, null, null]).length === 3
  && packSlots?.length === 3
  && packSlots.every((slot) => slot == null));
assert('s23.1 canonical-empty', slotsAreEmpty([]) === true
  && slotsAreEmpty([null, null, null]) === true
  && slotsAreEmpty([null]) === true
  && JSON.stringify(canonicalizeWeaponSlots([])) === JSON.stringify(CANONICAL_EMPTY_SLOTS)
  && JSON.stringify(canonicalizeWeaponSlots([null, null, null, 1])) === JSON.stringify(CANONICAL_EMPTY_SLOTS));
assert('s23.1 no-fourth', canonicalizeWeaponSlots([1, 15, 25, 7]).length === 3
  && canonicalizeWeaponSlots([1, 15, 25, 7])[2] === 25);

const snap = snapshotEmptyArmable({
  weaponSlots: [],
  npcShipId: 350,
  npcSlots: [null, null, null],
  npcShip: shuttle,
  isCombatWeapon: (id) => Number(id) > 0 && Number(id) !== TRACTOR_BEAM_ID,
  utilityBook: { items: [], facility_pass: [] },
  tractorIsBoard: tractorIsBoarding() === true,
  boardingImplemented: BOARDING_IMPLEMENTED === true,
  emptySlotsStayEmpty: emptySlotsStayEmpty([null, null, null], [null, null, null]),
});
assert('s23.1 helpers-present', snap.missing !== true && snap.ok === true, JSON.stringify(snap));
assert('s23.1 snapshot-empty', snap.slotCount === 3
  && snap.equippedWeaponId == null
  && snap.canonicalEmpty === true
  && snap.autoFilledDefaultWeapon === false
  && snap.fourthSlotPresent !== true
  && snap.utilityBookHoldsCombatSlots !== true, JSON.stringify(snap));

let autofillRefused = false;
try {
  refuseAutofillDefaultWeapon('test');
} catch (error) {
  autofillRefused = String(error.message || '').includes('DEFAULT_WEAPON_ID');
}
assert('s23.1 autofill-hard-fail', autofillRefused === true);
let stayEmptyRefused = false;
try {
  assertNoTypeXAutofill([], [DEFAULT_WEAPON_ID_TYPE_X, null, null]);
} catch (error) {
  stayEmptyRefused = error.autoFill === true;
}
assert('s23.2 persist-no-type-x', stayEmptyRefused === true
  && JSON.stringify(assertNoTypeXAutofill([], [null, null, null])) === JSON.stringify(CANONICAL_EMPTY_SLOTS));

const forcedEmpty = resolveCombatWeaponId([], {
  ship: { id: 2, armedByDefault: true },
  isCombatWeapon: (id) => Number(id) > 0 && Number(id) !== 25,
});
assert('s23.3 unarmed-cannot-fire', mayEmitProjectile([], { isCombatWeapon: Boolean }) === false
  && mayEmitProjectile([null, null, null], { isCombatWeapon: Boolean }) === false
  && unarmedNpcCannotFire(shuttle, [], () => true) === true
  && unarmedNpcCannotFire({ armedByDefault: true }, [], () => true) === true
  && forcedEmpty == null
  && snap.npc.combatWeaponId == null);

const photonSlots = canonicalizeWeaponSlots([15, null, null]);
assert('s23.4 installed-def-only', resolveCombatWeaponId(photonSlots, {
  ship: shuttle,
  isCombatWeapon: (id) => Number(id) === 15,
}) === 15
  && mayEmitProjectile(photonSlots, { isCombatWeapon: (id) => Number(id) === 15 }) === true
  && resolveCombatWeaponId([null, null, null], {
    ship: shuttle,
    isCombatWeapon: (id) => Number(id) === 15,
  }) == null
  && srcMain.includes('function buyWeapon')
  && srcMain.includes('function loadWeaponSlot')
  && srcMain.includes('loadWeaponSlot(weapon.id, emptySlot + 1)'));

const tractor = (gameItems.weapons || []).find((row) => Number(row.id) === TRACTOR_BEAM_ID);
assert('s23.5 tractor-slot', tractor
  && tractor.type === 'Device'
  && snap.tractor.id === 25
  && snap.tractor.type === 'Device'
  && snap.tractor.slot === true
  && snap.tractor.cargo === false
  && snap.tractor.boarding === false
  && tractorIsBoarding() === false
  && mayEmitProjectile([25, null, null], {
    isCombatWeapon: (id) => Number(id) > 0 && Number(id) !== 25,
  }) === false);

const gifted = emptyArmableInjectMustNotGiftFire({
  firingSolution: true,
  engagement_authorized: true,
  cultureFire: true,
});
assert('s23.5 no-fire-gift', gifted.firingSolutionPresent === false
  && gifted.engagementAuthorizedPresent === false
  && gifted.cultureFire === false
  && !Object.prototype.hasOwnProperty.call(gifted.row, 'firingSolution')
  && !Object.prototype.hasOwnProperty.call(gifted.row, 'engagement_authorized')
  && snap.fire.firingSolutionPresent === false
  && snap.fire.engagementAuthorizedPresent === false);

assert('s23.6 lock-false', EMPTY_ARMABLE_LOCKED_FROM_REMASTERED === false
  && snap.emptyArmableLockedFromRemastered === false
  && SLOT_LOCK === false
  && PHASE92_LOCK === false
  && PHASE93_LOCK === false
  && PHASE94_LOCK === false
  && BOARDING_LOCK === false
  && PHASE10_LOCK === false
  && UTILITY_LOCKED_FROM_REMASTERED === false
  && LEDGER_LOCKED_FROM_REMASTERED === false);
assert('s23.6 boarding-preserved', BOARDING_IMPLEMENTED === true
  && EW_BOARDING === true
  && tractorIsBoarding() === false
  && snap.boarding.tractorIsBoard === false
  && snap.boarding.implemented === true
  && snap.boarding.emptySlotsStayEmpty === true
  && emptySlotsStayEmpty([null, null, null], [null, null, null]) === true);
assert('s23.6 five-consumers', POWER_CONSUMERS.join(',') === 'propulsion,weapons,cloak,sensors,ew');
assert('s23.6 no-remastered-import', !/from ['"][^'"]*remastered/i.test(srcEmpty + srcMain)
  && !srcEmpty.includes('git am')
  && !srcMain.includes('git am')
  && srcMain.includes('emptyArmable: createEmptyArmableProbeApi()'));
assert('s23.6 no-reopen', !srcEmpty.includes('Thaleron Test Facility')
  && !srcEmpty.includes('dockClear')
  && !srcEmpty.includes('game_items.json')
  && srcCatalog.includes('Live `[]` means three empty')
  && hullPackIsEmptyArmable(shuttle) === true);

if (failed) {
  console.error(`Empty-armable offline probes: ${passed} passed, ${failed} failed`);
  for (const rowId of failures) console.error(`  FAIL ${rowId}`);
  process.exit(1);
}
console.log(`Empty-armable offline probes: ${passed} passed, ${failed} failed`);
