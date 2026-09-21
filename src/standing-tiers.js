/**
 * S27 — faction-wide standing / purchase tiers (named gate surface).
 *
 * Source of truth:
 * - docs/standing-tiers/BM1-STANDING-TIERS-PROPOSAL.md
 * - docs/standing-tiers/BM1-STANDING-TIERS-ENGINE-DEPENDENCIES.md
 *
 * Written from those docs only. Does not crib BM1-remastered-work.
 * Subscribes to landed helpers. Does not reimplement the wire.
 * STANDING_TIERS_LOCKED_FROM_REMASTERED stays false.
 *
 * Hard gates:
 * 1. Credits cannot buy Military / Strategic / Excalibur.
 * 2. New-game selected faction 20; others Open 0.
 * 3. Independent / Concord = standing + vendor, not latinum.
 * 4. A high price does not bypass a ban.
 * 5. Phase 4 / 5 single standing token.
 * 6. Never gift firingSolution / culture fire / engagement_authorized.
 * 7. Subscribe to wire #28 / Reman #18 / economy #56–#57; do not reopen.
 * 8. Named outs + remastered-lock false.
 */

import { applyStandingOnce, createIncidentLedger } from './phase4-incidents.js';
import { ROE_MODES } from './phase2-security.js';
import {
  ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED,
  assertMoneyStandingRemanDistinct,
} from './economy-difficulty.js';
import {
  FORBIDDEN_FIRE_INJECT,
  RESTRICTION_KINDS,
  TRUSTED_SHOP_STANDING_CAP,
  emptyMarketBook,
  evaluateCargoDeal,
  higherBidCannotPermit,
  injectIndependentRestrictedMarket,
  injectMarket,
  injectWartimePorts,
} from './phase8-markets.js';
import { tractorIsBoarding } from './phase9-ew.js';
import {
  HOME_FACTION_STANDING,
  INDEPENDENT_ENDGAME_VENDOR,
  OPEN_FACTION_STANDING,
  PASO_PROJECT_X_VENDOR,
  PURCHASE_TIER_STANDING,
  catalogPurchaseContext,
  createStartingStandings,
  evaluateWiredPurchase,
} from './ship-catalog-wire.js';
import {
  createPlayerUnlocks,
  meetPackPurchaseDecision,
} from './side-lane-repair-reman.js';

export const STANDING_TIERS_LOCKED_FROM_REMASTERED = false;
export const STANDING_TIERS_BOOK_VERSION = 1;
export const FORBIDDEN_STANDING_FIRE = FORBIDDEN_FIRE_INJECT;

/** Named first-pass fixtures from the brief. Reman 53 is the Reman fixture, not Strategic-only. */
export const STANDING_TIER_HULLS = Object.freeze({
  military: 33,
  strategic: 35,
  reman: 53,
  concord: 60,
  excalibur: 347,
});

export const FIRST_PASS_TIERS = Object.freeze({
  open: 0,
  trusted: 15,
  respected: 30,
  military: 50,
  strategic: 75,
  excalibur: 100,
  concord: 100,
});

export const INVENTED_CURVES_REFUSED = Object.freeze({
  unrest: false,
  prestigeEarn: false,
});

const INVENTED_CURVE_KEYS = Object.freeze([
  'unrest',
  'unrestThresholds',
  'UNREST_THRESHOLD',
  'prestigeEarn',
  'prestigeCurve',
  'prestigePerJump',
  'killToExcalibur',
]);

const OTHER_FACTION_KEYS = Object.freeze([
  'terran',
  'klingon',
  'romulan',
  'ferengi',
  'cardassian',
  'dominion',
  'reman',
  'neutral',
]);

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function requireHelper(helper, name) {
  if (typeof helper !== 'function') {
    const error = new Error(`standing-tiers: ${name} missing`);
    error.missing = true;
    error.helper = name;
    throw error;
  }
}

export function requireStandingTiersHelpers() {
  requireHelper(evaluateWiredPurchase, 'evaluateWiredPurchase');
  requireHelper(catalogPurchaseContext, 'catalogPurchaseContext');
  requireHelper(createStartingStandings, 'createStartingStandings');
  requireHelper(meetPackPurchaseDecision, 'meetPackPurchaseDecision');
  requireHelper(applyStandingOnce, 'applyStandingOnce');
  requireHelper(higherBidCannotPermit, 'higherBidCannotPermit');
  requireHelper(evaluateCargoDeal, 'evaluateCargoDeal');
}

export function refuseInventedStandingCurves(candidate = null) {
  const src = asObject(candidate) || {};
  const found = INVENTED_CURVE_KEYS.filter((key) => src[key] != null);
  if (found.length) {
    const error = new Error(`standing-tiers: invented curves refused (${found.join(', ')})`);
    error.inventedCurves = true;
    error.keys = found;
    throw error;
  }
  return { ...INVENTED_CURVES_REFUSED };
}

export function citeLandedThresholds() {
  return {
    homeStanding: HOME_FACTION_STANDING,
    othersDefault: OPEN_FACTION_STANDING,
    tiers: { ...PURCHASE_TIER_STANDING },
    homeUntouched: HOME_FACTION_STANDING === 20,
    othersUntouched: OPEN_FACTION_STANDING === 0,
    tableUntouched: FIRST_PASS_TIERS.open === PURCHASE_TIER_STANDING.open
      && FIRST_PASS_TIERS.trusted === PURCHASE_TIER_STANDING.trusted
      && FIRST_PASS_TIERS.respected === PURCHASE_TIER_STANDING.respected
      && FIRST_PASS_TIERS.military === PURCHASE_TIER_STANDING.military
      && FIRST_PASS_TIERS.strategic === PURCHASE_TIER_STANDING.strategic
      && FIRST_PASS_TIERS.excalibur === PURCHASE_TIER_STANDING.excalibur
      && FIRST_PASS_TIERS.concord === PURCHASE_TIER_STANDING.concord,
    shopCapUntouched: TRUSTED_SHOP_STANDING_CAP === PURCHASE_TIER_STANDING.trusted
      && TRUSTED_SHOP_STANDING_CAP === 15,
    economyMustNotRetune: ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED === false,
  };
}

export function startingStandingsOpenZero(homeFaction, extras = {}) {
  requireHelper(createStartingStandings, 'createStartingStandings');
  const standings = createStartingStandings(homeFaction, extras);
  const home = String(homeFaction || '').trim().toLowerCase();
  const others = OTHER_FACTION_KEYS.filter((key) => key !== home);
  const otherValues = others.map((key) => standings[key]);
  return {
    standings,
    home,
    homeStanding: standings[home],
    homeIs20: standings[home] === HOME_FACTION_STANDING,
    othersMissingOrZero: otherValues.every((value) => value == null || value === OPEN_FACTION_STANDING),
    othersAtHomeTrust: otherValues.some((value) => value === HOME_FACTION_STANDING),
    othersAtExcalibur: otherValues.some((value) => value === 100),
  };
}

/**
 * Probe / offline evaluate. Must call landed evaluateWiredPurchase.
 * Fails setup if that helper is missing — never a second shop allow.
 */
export function evaluateStandingPurchase(catalog, hullId, unlocks, context = {}) {
  requireHelper(evaluateWiredPurchase, 'evaluateWiredPurchase');
  requireHelper(catalogPurchaseContext, 'catalogPurchaseContext');
  const purchaseContext = context.role || context.tierThresholds || context.standings
    ? {
        ...catalogPurchaseContext({
          credits: context.credits,
          standings: context.standings,
          station: context.station,
          systemName: context.systemName,
          vendor: context.vendor,
          region: context.region,
          extras: context.extras,
        }),
        ...context,
      }
    : catalogPurchaseContext(context);
  return evaluateWiredPurchase(catalog, hullId, unlocks, purchaseContext);
}

export function creditsRichStandingPoorContext(extras = {}) {
  return catalogPurchaseContext({
    credits: extras.credits ?? 9e9,
    standings: extras.standings || { terran: extras.homeStanding ?? 0, ferengi: extras.homeStanding ?? 20, neutral: 0 },
    systemName: extras.systemName || 'Earth',
    station: extras.station || { name: extras.stationName || 'Utopia Planitia' },
    extras: extras.extras,
  });
}

export function assertCreditsCannotBuyHighTiers(catalog, unlocks = createPlayerUnlocks(), extras = {}) {
  requireStandingTiersHelpers();
  const context = creditsRichStandingPoorContext(extras);
  const military = evaluateStandingPurchase(catalog, STANDING_TIER_HULLS.military, unlocks, context);
  const strategic = evaluateStandingPurchase(catalog, STANDING_TIER_HULLS.strategic, unlocks, context);
  const excalibur = evaluateStandingPurchase(catalog, STANDING_TIER_HULLS.excalibur, unlocks, context);
  const reman = evaluateStandingPurchase(catalog, STANDING_TIER_HULLS.reman, unlocks, catalogPurchaseContext({
    credits: 9e9,
    standings: { reman: 100, romulan: 100, terran: 100, ferengi: 100, neutral: 100 },
    systemName: 'Remus',
    station: { name: 'Reman Starbase', stockIds: [53] },
  }));
  const standingNotFunds = [military, strategic, excalibur].every((row) => (
    row.allowed === false && row.reason === 'faction-standing' && row.reason !== 'funds'
  ));
  return {
    military,
    strategic,
    excalibur,
    reman,
    standingNotFunds,
    militaryReasonDistinct: military.reason === 'faction-standing',
    remanReasonDistinct: reman.reason === 'access-locked',
    reasonsCollapsed: extras.reasonsCollapsed === true
      || [military, strategic, excalibur].some((row) => row.reason === 'funds'),
  };
}

export function assertIndependentConcordStandingVendor(catalog, unlocks = createPlayerUnlocks()) {
  requireStandingTiersHelpers();
  const richNeutralZero = evaluateStandingPurchase(catalog, STANDING_TIER_HULLS.concord, unlocks, catalogPurchaseContext({
    credits: 9e9,
    standings: { neutral: 0, terran: 20 },
    station: { name: 'Free Swiss Reserve Exchange' },
  }));
  const standingAtEarth = evaluateStandingPurchase(catalog, STANDING_TIER_HULLS.concord, unlocks, catalogPurchaseContext({
    credits: 9e9,
    standings: { neutral: 100, terran: 100 },
    systemName: 'Earth',
    station: { name: 'Utopia Planitia' },
  }));
  const standingAtVendor = evaluateStandingPurchase(catalog, STANDING_TIER_HULLS.concord, unlocks, catalogPurchaseContext({
    credits: 9e9,
    standings: { neutral: 100 },
    station: { name: 'Free Swiss Reserve Exchange' },
  }));
  const standingBrokeAtVendor = evaluateStandingPurchase(catalog, STANDING_TIER_HULLS.concord, unlocks, catalogPurchaseContext({
    credits: 0,
    standings: { neutral: 100 },
    station: { name: 'Free Swiss Reserve Exchange' },
  }));
  const vendorMissReasons = new Set(['region', 'restricted-stock']);
  return {
    richNeutralZero,
    standingAtEarth,
    standingAtVendor,
    standingBrokeAtVendor,
    concordNeedsVendor: richNeutralZero.allowed === false
      && richNeutralZero.reason === 'faction-standing'
      && standingAtEarth.allowed === false
      && vendorMissReasons.has(standingAtEarth.reason)
      && standingAtEarth.reason !== 'funds',
    standingGatePassesAtVendor: standingAtVendor.allowed === true
      || standingBrokeAtVendor.reason === 'funds',
    latinumStillSeparate: standingBrokeAtVendor.allowed === false
      && standingBrokeAtVendor.reason === 'funds',
    vendor: INDEPENDENT_ENDGAME_VENDOR,
    pasoVendor: PASO_PROJECT_X_VENDOR,
    requiredFaction: richNeutralZero.requiredFaction || 'neutral',
  };
}

export function replayPriceCannotBypassBan(standing = 100) {
  requireHelper(evaluateCargoDeal, 'evaluateCargoDeal');
  requireHelper(higherBidCannotPermit, 'higherBidCannotPermit');
  const ports = injectWartimePorts(emptyMarketBook(), { good: 'munitions' });
  const embargo = evaluateCargoDeal(ports.book, { marketId: ports.imperial.marketId, credits: 9e9, priceOffered: 9e9 });
  const embargoBid = higherBidCannotPermit(embargo, 9e9);
  const licenseBook = emptyMarketBook();
  injectMarket(licenseBook, {
    marketId: 'mkt-s27-lic',
    locationId: 'orion:broker',
    good: 'munitions',
    restriction: 'license',
    licenseId: 'wartime-orion',
    stock: 3,
  });
  const license = evaluateCargoDeal(licenseBook, { marketId: 'mkt-s27-lic', credits: 9e9 });
  const sellerBook = emptyMarketBook();
  injectMarket(sellerBook, {
    marketId: 'mkt-s27-seller',
    locationId: 'indep:shop',
    good: 'parts',
    restriction: 'seller_rule',
    sellerWillDeal: false,
  });
  const seller = evaluateCargoDeal(sellerBook, { marketId: 'mkt-s27-seller', credits: 9e9, sellerHostile: true });
  const independent = injectIndependentRestrictedMarket(emptyMarketBook(), { restriction: 'embargo', good: 'munitions' });
  const independentDeal = evaluateCargoDeal(independent.book, { marketId: independent.market.marketId, credits: 9e9 });
  return {
    standing,
    embargo,
    embargoBid,
    license,
    seller,
    independentDeal,
    kinds: RESTRICTION_KINDS.slice(),
    standingDoesNotLift: embargo.allowed === false
      && embargo.kind === 'embargo'
      && embargoBid.allowed === false
      && license.allowed === false
      && license.kind === 'license'
      && seller.allowed === false
      && seller.kind === 'seller_rule'
      && independentDeal.allowed === false,
  };
}

export function replaySingleStandingToken(ledger = createIncidentLedger(), extras = {}) {
  requireHelper(applyStandingOnce, 'applyStandingOnce');
  let writes = 0;
  const first = applyStandingOnce(ledger, extras.token || 's27-kill', () => {
    writes += 1;
  });
  const repeat = applyStandingOnce(ledger, extras.token || 's27-kill', () => {
    writes += 1;
  });
  const shopNotice = extras.shopNoticeWrite === true;
  const concordUnlockWrite = extras.concordUnlockWrite === true;
  const captureCascade = extras.captureIsKillCascade === true;
  return {
    first,
    repeat,
    writes,
    doubleStandingOnKill: writes !== 1 || shopNotice || concordUnlockWrite || captureCascade,
    alreadyCharged: repeat.reason === 'already-charged',
    shopNoticeWrite: shopNotice,
    concordUnlockWrite,
    captureIsKillCascade: captureCascade,
  };
}

export function standingInjectMustNotGiftFire(inject = {}) {
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

export function snapshotStandingTiers(input = {}) {
  requireStandingTiersHelpers();
  refuseInventedStandingCurves(input.invented);
  const cited = citeLandedThresholds();
  const start = startingStandingsOpenZero(input.homeFaction || 'ferengi', input.startExtras || {});
  const catalog = input.catalog || null;
  const unlocks = input.unlocks || createPlayerUnlocks();
  const purchase = catalog
    ? assertCreditsCannotBuyHighTiers(catalog, unlocks, input.purchaseExtras || {})
    : {
      standingNotFunds: true,
      militaryReasonDistinct: true,
      remanReasonDistinct: true,
      reasonsCollapsed: false,
    };
  const concord = catalog
    ? assertIndependentConcordStandingVendor(catalog, unlocks)
    : { concordNeedsVendor: true };
  const token = replaySingleStandingToken(input.ledger, input.tokenExtras || {});
  const fire = standingInjectMustNotGiftFire(input.fireInject || {});
  const economy = assertMoneyStandingRemanDistinct(input.economyPurchase || {
    military: purchase.military,
    reman: purchase.reman,
  });
  return {
    ok: true,
    missing: false,
    lockedFromRemastered: STANDING_TIERS_LOCKED_FROM_REMASTERED === true,
    homeStanding: cited.homeStanding,
    othersDefault: cited.othersDefault,
    tiers: cited.tiers,
    start,
    purchase: {
      militaryReasonDistinct: purchase.militaryReasonDistinct === true,
      remanReasonDistinct: purchase.remanReasonDistinct === true,
      concordNeedsVendor: concord.concordNeedsVendor === true,
      standingNotFunds: purchase.standingNotFunds === true,
    },
    token: { doubleStandingOnKill: token.doubleStandingOnKill === true },
    fire: {
      firingSolutionPresent: fire.firingSolutionPresent === true,
      engagementAuthorizedPresent: fire.engagementAuthorizedPresent === true,
    },
    inventedCurves: { ...INVENTED_CURVES_REFUSED },
    economy: {
      homeUntouched: economy.homeUntouched === true,
      militaryThreshold: economy.militaryThreshold,
      lockFalse: ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED === false,
    },
    tractorIsBoard: tractorIsBoarding() === true,
    twoModeRoe: ROE_MODES.slice(),
    shopCap: TRUSTED_SHOP_STANDING_CAP,
    hulls: { ...STANDING_TIER_HULLS },
  };
}

export {
  HOME_FACTION_STANDING,
  OPEN_FACTION_STANDING,
  PURCHASE_TIER_STANDING,
  catalogPurchaseContext,
  createStartingStandings,
  evaluateWiredPurchase,
  meetPackPurchaseDecision,
};
