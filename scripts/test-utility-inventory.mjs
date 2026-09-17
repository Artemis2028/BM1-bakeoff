#!/usr/bin/env node
/**
 * Offline flags / passes / utility-inventory probes (S21 family).
 * Written from docs/flags-passes/ only. Does not crib remastered-work.
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
import { POWER_CONSUMERS } from '../src/phase65-power.js';
import { flagShareGrantsSystemControl } from '../src/phase1-authority.js';
import { plantFlagDoesNotGrantMarketTrust } from '../src/phase8-markets.js';
import {
  LIVE_FLAG_PRICE_DEFAULT,
  LIVE_FLAG_PRICE_DEFAULT_SOURCE,
  UTILITY_ACTIVATION,
  UTILITY_CAPACITY,
  UTILITY_LOCKED_FROM_REMASTERED,
  UTILITY_BOOK_VERSION,
  applyPriceInject,
  assertNoCombatStoreMutation,
  combatStoresContainCredential,
  copyCombatStores,
  deriveUtilityItems,
  emptyUtilityBook,
  grantFactionFlagCredential,
  knowledgeDoesNotGiftFire,
  liveFlagPriceSource,
  resolveFlagKnobs,
  resolveLiveFlagPrice,
  restoreUtilityBook,
  serializeUtilityBook,
  snapshotUtilityBook,
  syncUtilityBookAlias,
  writeCredentialIntoCombatStore,
} from '../src/utility-inventory.js';

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
const knobSource = gameItems.settings.factionFlags;
const srcMain = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
const srcUtil = fs.readFileSync(path.join(root, 'src/utility-inventory.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

assert('s21.startup-helpers', typeof emptyUtilityBook === 'function'
  && typeof snapshotUtilityBook === 'function'
  && typeof grantFactionFlagCredential === 'function'
  && typeof applyPriceInject === 'function'
  && typeof restoreUtilityBook === 'function');

const state = {
  playerFlags: ['ferengi'],
  utilityBook: emptyUtilityBook(),
  weaponSlots: [1, null, null],
  weaponInventory: [1],
  cargoArray: [{ item: 'Empty', tons: 0 }],
  sensorSuiteId: 'scout',
  ewEquipmentId: null,
  playerFaction: 'ferengi',
};
syncUtilityBookAlias(state);
const before = copyCombatStores(state);
const granted = grantFactionFlagCredential(state, 'klingon');
assert('s21.1 grant-ok', granted.ok === true && granted.wroteSlots === false, JSON.stringify(granted));
assert('s21.1 slots-unchanged', combatStoresEqualSafe(before, state), JSON.stringify({ before, after: copyCombatStores(state) }));
assert('s21.1 alias-flag', state.playerFlags.includes('klingon')
  && deriveUtilityItems(state.playerFlags, state.utilityBook).some((row) => row.kind === 'faction_flag' && row.id === 'klingon'));
assert('s21.1 not-in-slots', combatStoresContainCredential(state) === false);
assert('s21.1 buy-neq-raise', state.playerFaction === 'ferengi');

let slotWriteRefused = false;
try {
  writeCredentialIntoCombatStore('weaponSlots', { kind: 'faction_flag', id: 'klingon' });
} catch (error) {
  slotWriteRefused = String(error.message || '').includes('must not write');
}
assert('s21.1 refuse-slot-write', slotWriteRefused === true);
assert('s21.1 refuse-intoSlots', grantFactionFlagCredential(state, 'romulan', { intoSlots: true }).ok === false);

const saved = serializeUtilityBook(state.utilityBook, state.playerFlags);
assert('s21.2 sibling-shape', saved.version === UTILITY_BOOK_VERSION
  && Array.isArray(saved.items)
  && Array.isArray(saved.facility_pass)
  && saved.facility_pass.length === 0, JSON.stringify(saved));
const roundTrip = restoreUtilityBook(saved, state.playerFlags);
assert('s21.2 roundtrip-flags', roundTrip.playerFlags.includes('klingon') && roundTrip.playerFlags.includes('ferengi'));
assert('s21.2 roundtrip-passes-empty', Array.isArray(roundTrip.book.facility_pass) && roundTrip.book.facility_pass.length === 0);

const legacy = restoreUtilityBook(undefined, ['ferengi', 'cardassian']);
assert('s21.2 old-save-alias', legacy.playerFlags.includes('cardassian') && legacy.book.facility_pass.length === 0);
assert('s21.2 old-save-no-thaleron', legacy.book.thaleronTestFacilityPass.shipped === false
  && !legacy.playerFlags.includes('thaleron'));
assert('s21.2 not-in-systemStates', !Object.prototype.hasOwnProperty.call(saved, 'systemStates')
  && srcMain.includes('utilityBook: serializeUtilityBook')
  && srcMain.includes('state.systemStates = {}'));

const omitPrice = resolveLiveFlagPrice(knobSource, null);
assert('s21.3 omit-documented-1000', omitPrice === LIVE_FLAG_PRICE_DEFAULT && LIVE_FLAG_PRICE_DEFAULT === 1000);
assert('s21.3 omit-source', liveFlagPriceSource(null) === LIVE_FLAG_PRICE_DEFAULT_SOURCE);
assert('s21.3 knobs-not-inventory', knobSource.basePrice === 1800
  && knobSource.marketMultiplier === 175
  && JSON.stringify(knobSource.blockedFactions) === JSON.stringify(['pirate', 'borg']));
assert('s21.3 lock-false', UTILITY_LOCKED_FROM_REMASTERED === false
  && snapshotUtilityBook().utilityLockedFromRemastered === false);

applyPriceInject(state.utilityBook, { liveFlagPrice: 2500 });
const injectedSnap = snapshotUtilityBook(state.utilityBook, {
  playerFlags: state.playerFlags,
  knobs: knobSource,
  weaponSlots: state.weaponSlots,
  weaponInventory: state.weaponInventory,
  cargoArray: state.cargoArray,
});
assert('s21.3 inject-live-price', injectedSnap.liveFlagPrice === 2500
  && injectedSnap.liveFlagPriceSource === 'inject-liveFlagPrice');
applyPriceInject(state.utilityBook, { basePrice: 2200, useKnobs: true });
const knobSnap = snapshotUtilityBook(state.utilityBook, { playerFlags: state.playerFlags, knobs: knobSource });
assert('s21.3 inject-basePrice', knobSnap.knobs.basePrice === 2200 && knobSnap.liveFlagPrice === 2200, JSON.stringify(knobSnap.knobs));
applyPriceInject(state.utilityBook, null);
const resetSnap = snapshotUtilityBook(state.utilityBook, { playerFlags: state.playerFlags, knobs: knobSource });
assert('s21.3 omit-after-reset', resetSnap.liveFlagPrice === 1000
  && resetSnap.liveFlagPriceSource === LIVE_FLAG_PRICE_DEFAULT_SOURCE);
assert('s21.3 book-shape', resetSnap.book.items.every((row) => row.kind === 'faction_flag' || row.kind === 'facility_pass')
  && resetSnap.book.facility_pass.length === 0);

assert('s21.4 thaleron-not-shipped', resetSnap.thaleronTestFacilityPass.shipped === false
  && resetSnap.thaleronTestFacilityPass.verified === false);
assert('s21.4 no-vendor-pin-quest', resetSnap.thaleronItemId == null
  && resetSnap.thaleronVendor == null
  && resetSnap.thaleronMapPin == null
  && resetSnap.thaleronQuest == null
  && resetSnap.guidedThaleronPriceLock == null);
assert('s21.4 no-invented-facility', !srcUtil.includes('Nausica Orbital Bar')
  && !srcMain.includes('Thaleron Test Facility')
  && resetSnap.asteroidPassShipped === false);
assert('s21.4 no-90000-lock', !srcUtil.includes('90000') && resetSnap.guidedThaleronPriceLock !== 90000);

const fire = knowledgeDoesNotGiftFire();
assert('s21.5 no-fs', fire.firingSolutionPresent === false && resetSnap.fire.firingSolutionPresent === false);
assert('s21.5 no-auth', fire.engagementAuthorizedPresent === false && fire.cultureFire === false);
assert('s21.5 phase1-subscribe', flagShareGrantsSystemControl() === false
  && plantFlagDoesNotGrantMarketTrust().catalogStanding === false
  && resetSnap.phase1.flagShareGrantsControl === false
  && resetSnap.phase1.plantGrantsMarketTrust === false);
assert('s21.5 reman53', resetSnap.reman53.id === 53 && resetSnap.reman53.key === 'bm-ship:53');
assert('s21.5 tractor', tractorIsBoarding() === false);

assert('s21.6 capacity-null', UTILITY_CAPACITY === null && resetSnap.capacity === null && resetSnap.book.capacity === null);
assert('s21.6 activation-unset', UTILITY_ACTIVATION === 'unset' && resetSnap.activation === 'unset');
assert('s21.6 no-hotkeys', resetSnap.hotkeys == null);
assert('s21.6 no-stack-cap-const', !srcUtil.includes('UTILITY_BAR')
  && !srcUtil.includes('utilitySlots = 4')
  && !srcUtil.includes('press F'));

assert('s21.7 lock-flags-false', SLOT_LOCK === false && PHASE92_LOCK === false && PHASE93_LOCK === false
  && PHASE94_LOCK === false && BOARDING_LOCK === false && PHASE10_LOCK === false
  && UTILITY_LOCKED_FROM_REMASTERED === false);
assert('s21.7 boarding-preserved', BOARDING_IMPLEMENTED === true && EW_BOARDING === true && tractorIsBoarding() === false);
assert('s21.7 five-consumers', POWER_CONSUMERS.join(',') === 'propulsion,weapons,cloak,sensors,ew');
assert('s21.7 dockclear-untouched', styles.includes('--bm1-dock-clear'));
assert('s21.7 no-remastered-import', !/from ['"][^'"]*remastered/i.test(srcUtil + srcMain)
  && !srcMain.includes('git am')
  && UTILITY_LOCKED_FROM_REMASTERED === false);
assert('s21.7 empty-pass-ui', srcMain.includes('data-utility-passes="empty"')
  && srcMain.includes('Credentials. Inventory — not a weapon slot, not a firing solution.'));

function combatStoresEqualSafe(beforeStores, afterState) {
  try {
    assertNoCombatStoreMutation(beforeStores, afterState);
    return true;
  } catch {
    return false;
  }
}

if (failed) {
  console.error(`Utility inventory offline probes: ${passed} passed, ${failed} failed`);
  for (const rowId of failures) console.error(`  FAIL ${rowId}`);
  process.exit(1);
}
console.log(`Utility inventory offline probes: ${passed} passed, ${failed} failed`);
