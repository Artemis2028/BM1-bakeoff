/**
 * S32 — Bajoran Solar Sailor thin subscribe catalog.
 *
 * Source of truth:
 * - docs/bajoran-solar-sailor/BM1-BAJORAN-SOLAR-SAILOR-PROPOSAL.md §3
 * - docs/bajoran-solar-sailor/BM1-BAJORAN-SOLAR-SAILOR-ENGINE-DEPENDENCIES.md
 *
 * Sibling book beside dominionBook. Records class + empty-arms posture only.
 * Does not crib BM1-remastered-work. BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED
 * stays false. Ids and magnitudes stay injectable / TBD.
 *
 * Does not write weapon slots, utilityBook, cargo, dominionBook.rosterPlayable,
 * dominionBook.scope, or ROE_MODES. Does not gift firingSolution, culture fire,
 * or engagement_authorized. Phase 9 matrix labels stay read-only (Q4).
 *
 * Hard gates:
 * 1. Ship, not utility / cargo / credential.
 * 2. Begins unarmed. Three empty slots. No invented combat fit.
 * 3. Knowledge / catalog only. No playable unlock. No rosterPlayable gift.
 * 4. Never gift firingSolution / culture fire / engagement_authorized.
 * 5. Do not reopen #33–#70. S18.18 stays unamended.
 * 6. No third ROE. Paths are not a mode inject.
 * 7. Blind. Remastered ids, costs, and art paths are not locks.
 * 8. Warp Core, Flash prices, Thaleron, and boarding odds stay named outs.
 */

import {
  hullIsEmptyButArmable,
  packDefaultWeaponSlots,
  unarmedNpcCannotFire,
} from './ship-catalog-wire.js';
import {
  mayEmitProjectile,
  resolveCombatWeaponId,
} from './empty-armable.js';
import { ROE_MODES, offersProtectAll } from './phase2-security.js';
import { foldDoctrineResponse } from './phase4-incidents.js';
import { cultureGrantsFirePermission } from './side-lane-unrest-independence.js';
import {
  FLASH_PRICES_ARE_LIVE_LOCKS,
  listDeferredFlashUtilities,
} from './phase9-weapons-matrix.js';
import { THALERON_TEST_FACILITY_PASS } from './utility-inventory.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as BOARDING_ODDS_LOCKED_FROM_REMASTERED } from './boarding-eligibility.js';

export const SOLAR_SAILOR_BOOK_VERSION = 1;
export const BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED = false;

const FORBIDDEN_FIRE_KEYS = Object.freeze([
  'firingSolution',
  'engagement_authorized',
  'cultureFire',
  'culture',
]);

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function requireHelper(helper, name) {
  if (typeof helper !== 'function') {
    const error = new Error(`bajoran-solar-sailor: ${name} missing`);
    error.missing = true;
    error.helper = name;
    throw error;
  }
}

function emptySlots() {
  return [null, null, null];
}

function positiveInteger(value) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function postureFields() {
  return {
    flashName: 'Bajoran Sail',
    displayName: 'Bajoran Solar Sailor',
    classification: 'ship',
    faction: 'bajoran',
    shipClass: 'shuttle',
    role: 'fragile-freighter',
    beginsUnarmed: true,
    defaultWeaponSlots: emptySlots(),
    armedByDefault: false,
    cargo: false,
    utilityBook: false,
    weaponCatalogId: null,
    rosterPlayableGift: false,
    grantsFire: false,
    idLocked: false,
    magnitudesLocked: false,
  };
}

/** Hull object for empty-armable reads. No id, cost, art, or magnitudes. */
export function solarSailorPosture() {
  return {
    ...postureFields(),
    assetType: 'ship',
  };
}

export function requireSolarSailorHelpers() {
  requireHelper(packDefaultWeaponSlots, 'packDefaultWeaponSlots');
  requireHelper(hullIsEmptyButArmable, 'hullIsEmptyButArmable');
  requireHelper(unarmedNpcCannotFire, 'unarmedNpcCannotFire');
  requireHelper(mayEmitProjectile, 'mayEmitProjectile');
  requireHelper(resolveCombatWeaponId, 'resolveCombatWeaponId');
  requireHelper(listDeferredFlashUtilities, 'listDeferredFlashUtilities');
  requireHelper(emptySolarSailorBook, 'emptySolarSailorBook');
  requireHelper(serializeSolarSailorBook, 'serializeSolarSailorBook');
  requireHelper(restoreSolarSailorBook, 'restoreSolarSailorBook');
  requireHelper(applySolarSailorInject, 'applySolarSailorInject');
}

export function emptySolarSailorBook() {
  return {
    version: SOLAR_SAILOR_BOOK_VERSION,
    BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED: false,
    ...postureFields(),
    injectedHullId: null,
  };
}

export function serializeSolarSailorBook(book) {
  const store = restoreSolarSailorBook(book);
  return {
    version: SOLAR_SAILOR_BOOK_VERSION,
    BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED: false,
    ...postureFields(),
    injectedHullId: store.injectedHullId,
  };
}

export function restoreSolarSailorBook(saved) {
  const book = emptySolarSailorBook();
  const source = asObject(saved);
  if (!source) return book;
  if (positiveInteger(source.injectedHullId)) book.injectedHullId = source.injectedHullId;
  book.BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED = false;
  book.idLocked = false;
  book.magnitudesLocked = false;
  book.classification = 'ship';
  book.defaultWeaponSlots = emptySlots();
  book.armedByDefault = false;
  book.beginsUnarmed = true;
  book.cargo = false;
  book.utilityBook = false;
  book.weaponCatalogId = null;
  book.rosterPlayableGift = false;
  book.grantsFire = false;
  return book;
}

function injectableHullId(inject) {
  const row = asObject(inject);
  if (!row) return null;
  if (positiveInteger(row.injectedHullId)) return row.injectedHullId;
  if (positiveInteger(row.hullId)) return row.hullId;
  if (positiveInteger(row.id)) return row.id;
  return null;
}

/**
 * The only snapshot field an inject may change is injectedHullId.
 * idLocked cannot become true. Fire, cost, art, fit, and class writes are dropped.
 */
export function applySolarSailorInject(book, inject = {}) {
  const store = restoreSolarSailorBook(book);
  const hullId = injectableHullId(inject);
  if (hullId != null) store.injectedHullId = hullId;
  store.idLocked = false;
  store.magnitudesLocked = false;
  store.BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED = false;
  store.classification = 'ship';
  store.defaultWeaponSlots = emptySlots();
  store.armedByDefault = false;
  store.grantsFire = false;
  store.rosterPlayableGift = false;
  store.weaponCatalogId = null;
  store.cargo = false;
  store.utilityBook = false;
  if (book && typeof book === 'object' && !Array.isArray(book)) {
    for (const key of Object.keys(book)) delete book[key];
    Object.assign(book, store);
  }
  const cleaned = asObject(inject) ? { ...inject } : {};
  for (const key of FORBIDDEN_FIRE_KEYS) delete cleaned[key];
  return {
    book: store,
    idLocked: false,
    magnitudesLocked: false,
    grantsFire: false,
    firingSolutionPresent: false,
    engagementAuthorizedPresent: false,
    cultureFire: false,
    cleaned,
  };
}

function readNamedOuts() {
  const deferred = listDeferredFlashUtilities();
  const sail = deferred.find((row) => row.flashName === 'Bajoran Sail') || null;
  const core = deferred.find((row) => row.flashName === 'Warp Core') || null;
  return {
    matrixSailMapping: sail ? sail.mapping : null,
    matrixWarpCoreMapping: core ? core.mapping : null,
    warpCoreBakeoffId: core ? core.bakeoffId ?? null : null,
    flashPricesAreLiveLocks: FLASH_PRICES_ARE_LIVE_LOCKS === true,
    thaleronShipped: THALERON_TEST_FACILITY_PASS.shipped === true,
    thaleronVerified: THALERON_TEST_FACILITY_PASS.verified === true,
    boardingOddsLocked: BOARDING_ODDS_LOCKED_FROM_REMASTERED === true,
  };
}

export function solarSailorSnapshot(book = null, context = {}) {
  try {
    requireSolarSailorHelpers();
  } catch (error) {
    return {
      ok: false,
      missing: true,
      reason: error.helper ? `${error.helper}-missing` : String(error.message || error),
    };
  }

  const store = restoreSolarSailorBook(book);
  const posture = solarSailorPosture();
  const slots = packDefaultWeaponSlots(posture);
  const isCombatWeapon = () => true;
  const cannotFire = unarmedNpcCannotFire(posture, slots, isCombatWeapon) === true;
  const emits = mayEmitProjectile(slots, { isCombatWeapon }) === true;
  const combatWeaponId = resolveCombatWeaponId(slots, {
    ship: posture,
    isCombatWeapon,
  });
  const ctx = asObject(context) || {};
  const dominion = asObject(ctx.dominionBook);
  const playable = asObject(dominion?.rosterPlayable);
  const protectFold = foldDoctrineResponse('protect');
  const snap = {
    ok: true,
    missing: false,
    lockedFromRemastered: BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED === true,
    ...postureFields(),
    emitsProjectile: emits,
    unarmedCannotFire: cannotFire,
    combatWeaponId: combatWeaponId ?? null,
    emptyButArmable: hullIsEmptyButArmable(posture) === true,
    cultureGrantsFire: cultureGrantsFirePermission() === true,
    roeModes: ROE_MODES.slice(),
    protectAll: offersProtectAll(null) === true,
    protectApplied: protectFold.appliedResponse,
    mayAutoEngageFromSailor: false,
    dominionScope: typeof dominion?.scope === 'string' ? dominion.scope : null,
    rosterPlayableIndependent: playable?.independent === true,
    rosterPlayableFerengi: playable?.ferengi === true,
    rosterPlayableVulcan: playable?.vulcan === true,
    inLiveUtilityBook: ctx.inLiveUtilityBook === true,
    inLiveTradeGoods: ctx.inLiveTradeGoods === true,
    namedOuts: readNamedOuts(),
  };
  if (positiveInteger(store.injectedHullId)) snap.injectedHullId = store.injectedHullId;
  for (const key of FORBIDDEN_FIRE_KEYS) delete snap[key];
  delete snap.cost;
  delete snap.art;
  delete snap.artPath;
  delete snap.image;
  delete snap.hull;
  delete snap.shields;
  delete snap.speed;
  delete snap.id;
  delete snap.rosterPlayable;
  return snap;
}
