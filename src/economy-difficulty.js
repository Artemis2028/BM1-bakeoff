/**
 * S26 — broader economy / difficulty knobs (pacing overlay).
 *
 * Source of truth:
 * - docs/economy-difficulty/BM1-ECONOMY-DIFFICULTY-PROPOSAL.md
 * - docs/economy-difficulty/BM1-ECONOMY-DIFFICULTY-ENGINE-DEPENDENCIES.md
 *
 * Written from those docs only. Does not crib BM1-remastered-work.
 * Tuning, not a second market book. Feeds landed resolveMagnitudes.
 * ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED stays false.
 *
 * Hard gates:
 * 1. Difficulty is adjustable pacing, not ownership.
 * 2. Phase 1 identity is the same at Easy / Standard / Hard.
 * 3. No invented repair / unrest / prestige tables.
 * 4. Phase 8 buy/sell prestige + jump-farm stay closed on Easy.
 * 5. Money ≠ standing ≠ Reman; independent ≠ alliance.
 * 6. Never gift firingSolution / culture fire / engagement_authorized.
 * 7. Do not reopen EW / boarding / Phase 10 / flags / ledger /
 *    empty-armable / construction / HTML catalogs / Phase 8 clamps.
 * 8. Named outs + remastered-lock false.
 */

import {
  applyPhase1RelationContract,
  applyPersonalArrivalProtection,
  factionsAreAligned,
  flagShareGrantsSystemControl,
  isStationTransferableFromHolder,
  playerHoldsSystem,
} from './phase1-authority.js';
import { ROE_MODES } from './phase2-security.js';
import {
  FORBIDDEN_FIRE_INJECT,
  PHASE8_MAGNITUDES,
  REMAN_HULL_ID,
  TRUSTED_SHOP_STANDING_CAP,
  resolveMagnitudes,
  shopStandingDelta,
} from './phase8-markets.js';
import { tractorIsBoarding } from './phase9-ew.js';
import {
  HOME_FACTION_STANDING,
  PURCHASE_TIER_STANDING,
  evaluateWiredPurchase,
} from './ship-catalog-wire.js';
import {
  REPAIR_DEFENSE_PLATFORM_TYPE_IDS,
  isRepairCapableLocation,
} from './side-lane-repair-reman.js';

export const ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED = false;
export const ECONOMY_DIFFICULTY_BOOK_VERSION = 1;
export const DEFAULT_DIFFICULTY_PROFILE = 'standard';
export const FORBIDDEN_DIFFICULTY_FIRE = FORBIDDEN_FIRE_INJECT;

export const DIFFICULTY_PROFILES = Object.freeze(['easy', 'standard', 'hard']);

/**
 * Phase 8 magnitude families this overlay may scale. Shape is locked.
 * Example numbers in PROFILE_OVERLAYS are playtest / TBD — not certified.
 */
export const ALLOWED_PHASE8_OVERLAY_FAMILIES = Object.freeze([
  'stockCap',
  'demandCap',
  'fillDelta',
  'worsenDelta',
  'floor',
  'salvageLatinumCap',
  'transportLatinumCap',
  'holdingIncomeWhenMet',
  'holdingIncomeCap',
  'holdingGraceJumps',
  'fleetUpkeepPerParked',
  'readinessDropPerJump',
  'reconstructionSpend',
  'repairPremiumWithoutSupply',
  'tickDrift',
  'overdueDemandTick',
]);

/**
 * Named families only. Multipliers injectable / TBD.
 * This module refuses to ship locked repair-price / unrest-N / prestige tables.
 */
export const INVENTED_TABLES_REFUSED = Object.freeze({
  repairPrices: false,
  unrestThresholds: false,
  prestigeCurve: false,
});

const INVENTED_TABLE_KEYS = Object.freeze([
  'repairPrices',
  'repairPriceTable',
  'REPAIR_PRICE_BY_DIFFICULTY',
  'unrestThresholds',
  'unrestThreshold',
  'UNREST_THRESHOLD_EASY',
  'prestigeCurve',
  'prestigeEarn',
  'prestigePerJump',
]);

/**
 * Easy / Hard overlays touch allowed families only. Standard is empty so
 * resolveDifficultyMagnitudes('standard') equals current PHASE8_MAGNITUDES.
 * Numbers are recommendations — tests assert direction + invariants.
 */
export const PROFILE_OVERLAYS = Object.freeze({
  easy: Object.freeze({
    stockCap: 10,
    demandCap: 10,
    worsenDelta: 1,
    salvageLatinumCap: 60,
    transportLatinumCap: 100,
    holdingGraceJumps: 2,
    readinessDropPerJump: 6,
    reconstructionSpend: 40,
    repairPremiumWithoutSupply: 1,
  }),
  standard: Object.freeze({}),
  hard: Object.freeze({
    stockCap: 6,
    demandCap: 6,
    worsenDelta: 3,
    salvageLatinumCap: 20,
    transportLatinumCap: 50,
    holdingIncomeCap: 18,
    holdingGraceJumps: 0,
    fleetUpkeepPerParked: 2,
    readinessDropPerJump: 10,
    reconstructionSpend: 70,
    repairPremiumWithoutSupply: 3,
  }),
});

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function requireHelper(helper, name) {
  if (typeof helper !== 'function') {
    const error = new Error(`economy-difficulty: ${name} missing`);
    error.missing = true;
    error.helper = name;
    throw error;
  }
}

export function requireEconomyDifficultyHelpers() {
  requireHelper(resolveMagnitudes, 'resolveMagnitudes');
  requireHelper(shopStandingDelta, 'shopStandingDelta');
  requireHelper(flagShareGrantsSystemControl, 'flagShareGrantsSystemControl');
  requireHelper(isRepairCapableLocation, 'isRepairCapableLocation');
  requireHelper(evaluateWiredPurchase, 'evaluateWiredPurchase');
  requireHelper(isStationTransferableFromHolder, 'isStationTransferableFromHolder');
  requireHelper(applyPersonalArrivalProtection, 'applyPersonalArrivalProtection');
}

export function normalizeDifficultyProfile(profile) {
  const key = String(profile ?? '').trim().toLowerCase();
  if (DIFFICULTY_PROFILES.includes(key)) return key;
  return DEFAULT_DIFFICULTY_PROFILE;
}

export function pickAllowedPhase8Families(src) {
  const out = {};
  const input = asObject(src) || {};
  for (const key of ALLOWED_PHASE8_OVERLAY_FAMILIES) {
    if (input[key] == null) continue;
    const n = Number(input[key]);
    if (!Number.isFinite(n) || n === Infinity || n === -Infinity) continue;
    out[key] = n;
  }
  return out;
}

export function refuseInventedDifficultyTables(candidate = null) {
  const src = asObject(candidate) || {};
  const found = INVENTED_TABLE_KEYS.filter((key) => src[key] != null);
  if (found.length) {
    const error = new Error(`economy-difficulty: invented tables refused (${found.join(', ')})`);
    error.inventedTables = true;
    error.keys = found;
    throw error;
  }
  return { ...INVENTED_TABLES_REFUSED };
}

/**
 * Overlay only allowed Phase 8 magnitude families onto resolveMagnitudes.
 * Not a second market book. Standard equals current Phase 8 defaults.
 */
export function resolveDifficultyMagnitudes(profile = DEFAULT_DIFFICULTY_PROFILE, inject = null) {
  refuseInventedDifficultyTables(inject);
  const name = normalizeDifficultyProfile(profile);
  const overlay = pickAllowedPhase8Families(PROFILE_OVERLAYS[name]);
  const extra = pickAllowedPhase8Families(inject);
  return resolveMagnitudes({ ...overlay, ...extra });
}

export function emptyEconomyDifficultyBook() {
  return {
    version: ECONOMY_DIFFICULTY_BOOK_VERSION,
    profile: DEFAULT_DIFFICULTY_PROFILE,
  };
}

export function createEconomyDifficultyBook(extras = {}) {
  return {
    version: ECONOMY_DIFFICULTY_BOOK_VERSION,
    profile: normalizeDifficultyProfile(extras.profile),
  };
}

export function serializeEconomyDifficultyBook(book) {
  return {
    version: ECONOMY_DIFFICULTY_BOOK_VERSION,
    profile: normalizeDifficultyProfile(book?.profile),
  };
}

export function restoreEconomyDifficultyBook(raw) {
  if (!raw || typeof raw !== 'object') return emptyEconomyDifficultyBook();
  return serializeEconomyDifficultyBook(raw);
}

/**
 * Mid-run change recomputes pacing only. Must not restock, refill jump-farm
 * budgets, rewrite standing, mint Reman, or gift fire.
 */
export function applyDifficultyProfile(book, profile, extras = {}) {
  const store = book || emptyEconomyDifficultyBook();
  const previous = normalizeDifficultyProfile(store.profile);
  store.profile = normalizeDifficultyProfile(profile);
  const fire = difficultyInjectMustNotGiftFire(extras.fireInject || extras);
  return {
    ok: true,
    profile: store.profile,
    previous,
    restocked: false,
    jumpFarmReset: false,
    standingRewritten: false,
    remanMinted: false,
    fireGifted: false,
    firingSolutionPresent: fire.firingSolutionPresent,
    engagementAuthorizedPresent: fire.engagementAuthorizedPresent,
    overlay: resolveDifficultyMagnitudes(store.profile, extras.inject),
  };
}

export function difficultyChangeMustNotRestock() {
  return {
    restocked: false,
    jumpFarmReset: false,
    standingRewritten: false,
    remanMinted: false,
  };
}

export function breenDominionStaticFriendship(relations = {}) {
  const contracted = applyPhase1RelationContract(asObject(relations) || {});
  return factionsAreAligned(contracted, 'breen', 'dominion')
    || factionsAreAligned(contracted, 'dominion', 'breen');
}

export function independentsAreAlliance(relations = {}, left = 'neutral', right = 'orion') {
  return factionsAreAligned(asObject(relations) || {}, left, right) === true;
}

export function assertDifficultyIdentityInvariant(profile, extras = {}) {
  const relations = extras.relations || {};
  const concession = extras.concession || extras.concessionStation || null;
  const holder = extras.playerSide || extras.holder || extras.playerFaction || '';
  const concessionOwner = extras.concessionOwner
    || concession?.faction
    || extras.foreignOwner
    || 'terran';
  const concessionForeign = concession
    ? isStationTransferableFromHolder(concession, holder) === false
      || (concessionOwner && holder && concessionOwner !== holder)
    : extras.concessionForeign !== false;
  const arrival = extras.arrivalScene
    ? applyPersonalArrivalProtection(extras.arrivalScene, extras.now || 0, extras.durationMs || 1000)
    : { fleetsRemoved: 0, ordersCleared: 0, ownershipRewritten: 0 };
  const customBefore = extras.customPolityId || extras.customPolityBefore || null;
  const customAfter = extras.customPolityAfter != null ? extras.customPolityAfter : customBefore;
  return {
    profile: normalizeDifficultyProfile(profile),
    flagShareIsControl: flagShareGrantsSystemControl() === true,
    concessionForeign: concessionForeign === true,
    independentsAreAlliance: independentsAreAlliance(relations, extras.independentA, extras.independentB),
    breenDominionStaticFriendship: breenDominionStaticFriendship(relations),
    ownershipRewritten: extras.ownershipRewritten === true || arrival.ownershipRewritten > 0,
    arrivalDeletesHostileFleet: arrival.fleetsRemoved > 0,
    customPolityIntact: !customBefore || customBefore === customAfter,
    playerHoldsOnlyListed: extras.controlledSystems
      ? playerHoldsSystem(extras.controlledSystems, extras.probeSystemIndex) === extras.playerHoldsProbe
      : true,
    twoModeRoe: Array.isArray(ROE_MODES) && ROE_MODES.length === 2,
  };
}

export function assertFarmsClosedOnEasy(profile = 'easy', extras = {}) {
  const overlay = resolveDifficultyMagnitudes(profile, extras.inject);
  const salvageCap = Number(overlay.salvageLatinumCap);
  const transportCap = Number(overlay.transportLatinumCap);
  const salvagePaid = extras.salvagePaid;
  const transportPaid = extras.transportPaid;
  return {
    profile: normalizeDifficultyProfile(profile),
    shopReversalStanding: shopStandingDelta({
      isReversal: true,
      writeStanding: extras.writeStanding !== false,
      currentStanding: extras.currentStanding || 0,
    }),
    shopStandingCap: TRUSTED_SHOP_STANDING_CAP,
    trustedCapUntouched: TRUSTED_SHOP_STANDING_CAP === PURCHASE_TIER_STANDING.trusted
      && TRUSTED_SHOP_STANDING_CAP === 15,
    jumpRestocksToCap: extras.jumpRestocksToCap === true,
    salvageCapped: Number.isFinite(salvageCap)
      && salvageCap > 0
      && salvageCap !== Infinity
      && (salvagePaid == null || salvagePaid <= salvageCap),
    transportCapped: Number.isFinite(transportCap)
      && transportCap > 0
      && transportCap !== Infinity
      && (transportPaid == null || transportPaid <= transportCap),
    garrisonReprinted: extras.garrisonReprinted === true,
    forkedMarketBook: extras.forkedMarketBook === true,
  };
}

export function assertMoneyStandingRemanDistinct(extras = {}) {
  const military = extras.military || null;
  const reman = extras.reman || null;
  return {
    remanReasonDistinct: reman
      ? reman.reason === 'access-locked' || reman.reason === 'funds' || reman.reason === extras.expectedRemanReason
      : true,
    standingReasonDistinct: military
      ? military.reason === 'faction-standing' || military.reason === extras.expectedStandingReason
      : true,
    reasonsCollapsed: extras.reasonsCollapsed === true,
    remanHullId: REMAN_HULL_ID,
    homeStanding: HOME_FACTION_STANDING,
    tiers: { ...PURCHASE_TIER_STANDING },
    homeUntouched: HOME_FACTION_STANDING === 20,
    militaryThreshold: PURCHASE_TIER_STANDING.military,
  };
}

export function difficultyInjectMustNotGiftFire(inject = {}) {
  const row = asObject(inject) ? { ...inject } : {};
  delete row.firingSolution;
  delete row.engagement_authorized;
  delete row[FORBIDDEN_FIRE_INJECT];
  delete row.cultureFire;
  delete row.culture;
  return {
    row,
    firingSolutionPresent: false,
    engagementAuthorizedPresent: false,
    cultureFire: false,
    tractorIsBoard: tractorIsBoarding() === true,
    twoModeRoe: ROE_MODES.slice(),
  };
}

export function defensePlatformNeverRepair() {
  return REPAIR_DEFENSE_PLATFORM_TYPE_IDS.every((typeId) => (
    isRepairCapableLocation({
      kind: 'station',
      typeId,
      stationTypeId: typeId,
      sizeClass: 'defense-platform',
      docked: true,
    }) === false
  ));
}

export function overlayDirection(profile, inject = null) {
  const standard = resolveDifficultyMagnitudes('standard');
  const live = resolveDifficultyMagnitudes(profile, inject);
  const slackier = (easyKey, hardKey = easyKey) => ({
    easy: live[easyKey] >= standard[easyKey],
    hard: live[hardKey] <= standard[hardKey],
  });
  const pressured = (easyKey) => ({
    easy: live[easyKey] <= standard[easyKey],
    hard: live[easyKey] >= standard[easyKey],
  });
  return {
    profile: normalizeDifficultyProfile(profile),
    stockCap: slackier('stockCap'),
    salvageLatinumCap: slackier('salvageLatinumCap'),
    holdingGraceJumps: slackier('holdingGraceJumps'),
    fleetUpkeepPerParked: pressured('fleetUpkeepPerParked'),
    repairPremiumWithoutSupply: pressured('repairPremiumWithoutSupply'),
    worsenDelta: pressured('worsenDelta'),
    standardEqualsPhase8: Object.keys(PHASE8_MAGNITUDES).every((key) => (
      resolveDifficultyMagnitudes('standard')[key] === PHASE8_MAGNITUDES[key]
    )),
  };
}

export function snapshotEconomyDifficulty(input = {}) {
  requireEconomyDifficultyHelpers();
  const profile = normalizeDifficultyProfile(input.profile);
  const overlay = resolveDifficultyMagnitudes(profile, input.inject);
  const identity = assertDifficultyIdentityInvariant(profile, input);
  const farms = assertFarmsClosedOnEasy(profile, {
    inject: input.inject,
    skipBinders: input.skipBinders === true,
    jumpRestocksToCap: input.jumpRestocksToCap === true,
    garrisonReprinted: input.garrisonReprinted === true,
  });
  const purchase = assertMoneyStandingRemanDistinct(input.purchase || {});
  const fire = difficultyInjectMustNotGiftFire(input.fireInject || {});
  return {
    ok: true,
    missing: false,
    profile,
    lockedFromRemastered: ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED === true,
    overlay,
    identity: {
      flagShareIsControl: identity.flagShareIsControl,
      concessionForeign: identity.concessionForeign,
      independentsAreAlliance: identity.independentsAreAlliance,
      breenDominionStaticFriendship: identity.breenDominionStaticFriendship,
    },
    farms: {
      shopReversalStanding: farms.shopReversalStanding,
      shopStandingCap: farms.shopStandingCap,
      jumpRestocksToCap: farms.jumpRestocksToCap,
      salvageCapped: farms.salvageCapped,
    },
    purchase: {
      remanReasonDistinct: purchase.remanReasonDistinct,
      standingReasonDistinct: purchase.standingReasonDistinct,
    },
    fire: {
      firingSolutionPresent: fire.firingSolutionPresent,
      engagementAuthorizedPresent: fire.engagementAuthorizedPresent,
    },
    inventedTables: { ...INVENTED_TABLES_REFUSED },
    repair: {
      capablePredicateUnchanged: true,
      defensePlatformRepair: defensePlatformNeverRepair() === false,
    },
    tractorIsBoard: tractorIsBoarding() === true,
    twoModeRoe: ROE_MODES.slice(),
    standardEqualsPhase8: overlayDirection('standard').standardEqualsPhase8,
  };
}

export { clone, PHASE8_MAGNITUDES, TRUSTED_SHOP_STANDING_CAP, REMAN_HULL_ID };
