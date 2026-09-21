#!/usr/bin/env node
/**
 * Offline standing / purchase-tier probes (S27 family).
 * Written from docs/standing-tiers/ only. Does not crib remastered-work.
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
import { LEDGER_LOCKED_FROM_REMASTERED } from '../src/weapon-source-ledger.js';
import { EMPTY_ARMABLE_LOCKED_FROM_REMASTERED } from '../src/empty-armable.js';
import { CONSTRUCTION_LOCKED_FROM_REMASTERED } from '../src/construction-visuals.js';
import { HTML_CATALOG_LOCKED_FROM_REMASTERED } from '../scripts/build-html-catalogs.mjs';
import { ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED } from '../src/economy-difficulty.js';
import { POWER_CONSUMERS } from '../src/phase65-power.js';
import { ROE_MODES } from '../src/phase2-security.js';
import { applyStandingOnce, createIncidentLedger } from '../src/phase4-incidents.js';
import {
  HOME_FACTION_STANDING,
  OPEN_FACTION_STANDING,
  PURCHASE_TIER_STANDING,
  catalogPurchaseContext,
  createStartingStandings,
  createWiredCatalog,
  evaluateWiredPurchase,
} from '../src/ship-catalog-wire.js';
import { createPlayerUnlocks } from '../src/side-lane-repair-reman.js';
import { TRUSTED_SHOP_STANDING_CAP } from '../src/phase8-markets.js';
import {
  FIRST_PASS_TIERS,
  FORBIDDEN_STANDING_FIRE,
  INVENTED_CURVES_REFUSED,
  STANDING_TIERS_LOCKED_FROM_REMASTERED,
  STANDING_TIER_HULLS,
  assertCreditsCannotBuyHighTiers,
  assertIndependentConcordStandingVendor,
  citeLandedThresholds,
  evaluateStandingPurchase,
  refuseInventedStandingCurves,
  replayPriceCannotBypassBan,
  replaySingleStandingToken,
  requireStandingTiersHelpers,
  snapshotStandingTiers,
  standingInjectMustNotGiftFire,
  startingStandingsOpenZero,
} from '../src/standing-tiers.js';

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

const srcMain = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
const srcStanding = fs.readFileSync(path.join(root, 'src/standing-tiers.js'), 'utf8');
const srcCatalog = fs.readFileSync(path.join(root, 'src/ship-catalog-wire.js'), 'utf8');
const srcEconomy = fs.readFileSync(path.join(root, 'src/economy-difficulty.js'), 'utf8');
const srcPhase8 = fs.readFileSync(path.join(root, 'src/phase8-markets.js'), 'utf8');
const srcReman = fs.readFileSync(path.join(root, 'src/side-lane-repair-reman.js'), 'utf8');

assert('s27.startup-helpers', typeof evaluateStandingPurchase === 'function'
  && typeof snapshotStandingTiers === 'function'
  && typeof requireStandingTiersHelpers === 'function'
  && typeof citeLandedThresholds === 'function'
  && typeof startingStandingsOpenZero === 'function');

let helpersOk = true;
try {
  requireStandingTiersHelpers();
} catch {
  helpersOk = false;
}
assert('s27.startup-subscribe', helpersOk === true);

assert('s27.8 lock-false', STANDING_TIERS_LOCKED_FROM_REMASTERED === false
  && ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED === false
  && SLOT_LOCK === false
  && PHASE92_LOCK === false
  && PHASE93_LOCK === false
  && PHASE94_LOCK === false
  && BOARDING_LOCK === false
  && PHASE10_LOCK === false
  && UTILITY_LOCKED_FROM_REMASTERED === false
  && LEDGER_LOCKED_FROM_REMASTERED === false
  && EMPTY_ARMABLE_LOCKED_FROM_REMASTERED === false
  && CONSTRUCTION_LOCKED_FROM_REMASTERED === false
  && HTML_CATALOG_LOCKED_FROM_REMASTERED === false);

const cited = citeLandedThresholds();
assert('s27.8 first-pass-source', cited.homeUntouched === true
  && cited.othersUntouched === true
  && cited.tableUntouched === true
  && cited.shopCapUntouched === true
  && cited.economyMustNotRetune === true
  && HOME_FACTION_STANDING === 20
  && OPEN_FACTION_STANDING === 0
  && PURCHASE_TIER_STANDING.military === 50
  && PURCHASE_TIER_STANDING.strategic === 75
  && PURCHASE_TIER_STANDING.excalibur === 100
  && FIRST_PASS_TIERS.concord === 100
  && TRUSTED_SHOP_STANDING_CAP === 15);

const catalog = createWiredCatalog(
  JSON.parse(fs.readFileSync(path.join(root, 'bm-ships/ships.json'), 'utf8')),
  JSON.parse(fs.readFileSync(path.join(root, 'bm-ships/bm2-id-map.json'), 'utf8')),
  JSON.parse(fs.readFileSync(path.join(root, 'bm-ships/size-config.json'), 'utf8')),
);
const unlocks = createPlayerUnlocks();
const highTiers = assertCreditsCannotBuyHighTiers(catalog, unlocks, { homeStanding: 20 });
assert('s27.1 credits-ne-military-strategic-excalibur', highTiers.military.allowed === false
  && highTiers.military.reason === 'faction-standing'
  && highTiers.strategic.allowed === false
  && highTiers.strategic.reason === 'faction-standing'
  && highTiers.excalibur.allowed === false
  && highTiers.excalibur.reason === 'faction-standing'
  && highTiers.standingNotFunds === true
  && highTiers.reasonsCollapsed === false
  && highTiers.military.reason !== 'funds', JSON.stringify({
  military: highTiers.military.reason,
  strategic: highTiers.strategic.reason,
  excalibur: highTiers.excalibur.reason,
}));
assert('s27.1 reman-still-access-locked', highTiers.reman.allowed === false
  && highTiers.reman.reason === 'access-locked'
  && highTiers.remanReasonDistinct === true);

const throughWire = evaluateStandingPurchase(catalog, STANDING_TIER_HULLS.military, unlocks, catalogPurchaseContext({
  credits: 9e9,
  standings: { terran: 0 },
  systemName: 'Earth',
  station: { name: 'Utopia Planitia' },
}));
const directWire = evaluateWiredPurchase(catalog, STANDING_TIER_HULLS.military, unlocks, catalogPurchaseContext({
  credits: 9e9,
  standings: { terran: 0 },
  systemName: 'Earth',
  station: { name: 'Utopia Planitia' },
}));
assert('s27.1 subscribe-not-second-shop', throughWire.allowed === directWire.allowed
  && throughWire.reason === directWire.reason
  && srcStanding.includes('evaluateWiredPurchase(catalog, hullId, unlocks')
  && !srcStanding.includes('if (credits >= ship.cost) return { allowed: true }'));

const start = startingStandingsOpenZero('ferengi');
const landStart = createStartingStandings('ferengi');
const terranMilitary = evaluateStandingPurchase(catalog, STANDING_TIER_HULLS.military, unlocks, catalogPurchaseContext({
  credits: 9e9,
  standings: start.standings,
  systemName: 'Earth',
  station: { name: 'Utopia Planitia' },
}));
assert('s27.2 new-game-20-others-open-0', start.homeIs20 === true
  && start.homeStanding === 20
  && start.othersMissingOrZero === true
  && start.othersAtHomeTrust === false
  && start.othersAtExcalibur === false
  && landStart.ferengi === HOME_FACTION_STANDING
  && landStart.terran == null
  && terranMilitary.allowed === false
  && terranMilitary.reason === 'faction-standing'
  && terranMilitary.currentStanding === 0, JSON.stringify({
  start,
  currentStanding: terranMilitary.currentStanding,
}));

const concord = assertIndependentConcordStandingVendor(catalog, unlocks);
assert('s27.3 concord-standing-plus-vendor', concord.richNeutralZero.allowed === false
  && concord.richNeutralZero.reason === 'faction-standing'
  && concord.richNeutralZero.requiredFaction === 'neutral'
  && concord.standingAtEarth.allowed === false
  && concord.standingAtEarth.reason !== 'funds'
  && concord.concordNeedsVendor === true
  && concord.latinumStillSeparate === true
  && (concord.standingAtVendor.allowed === true || concord.standingBrokeAtVendor.reason === 'funds'), JSON.stringify({
  zero: concord.richNeutralZero.reason,
  earth: concord.standingAtEarth.reason,
  vendor: concord.standingAtVendor.reason,
  broke: concord.standingBrokeAtVendor.reason,
}));

const priceBan = replayPriceCannotBypassBan(100);
assert('s27.4 price-ne-ban', priceBan.standingDoesNotLift === true
  && priceBan.embargo.allowed === false
  && priceBan.embargo.kind === 'embargo'
  && priceBan.embargoBid.allowed === false
  && priceBan.license.kind === 'license'
  && priceBan.seller.kind === 'seller_rule'
  && priceBan.independentDeal.allowed === false
  && priceBan.kinds.join(',') === 'embargo,license,seller_rule,premium');

const token = replaySingleStandingToken();
const ledger = createIncidentLedger();
const first = applyStandingOnce(ledger, 's27-offline', () => {});
const repeat = applyStandingOnce(ledger, 's27-offline', () => {});
assert('s27.5 single-standing-token', token.doubleStandingOnKill === false
  && token.writes === 1
  && token.alreadyCharged === true
  && first.applied === true
  && repeat.reason === 'already-charged'
  && token.shopNoticeWrite === false
  && token.captureIsKillCascade === false);

const fire = standingInjectMustNotGiftFire({
  firingSolution: true,
  engagement_authorized: true,
  cultureFire: true,
});
assert('s27.6 no-fire-gift', fire.firingSolutionPresent === false
  && fire.engagementAuthorizedPresent === false
  && fire.cultureFire === false
  && fire.tractorIsBoard === false
  && fire.twoModeRoe.join(',') === 'return-fire,defend'
  && !Object.prototype.hasOwnProperty.call(fire.row, 'firingSolution')
  && !Object.prototype.hasOwnProperty.call(fire.row, FORBIDDEN_STANDING_FIRE)
  && tractorIsBoarding() === false
  && ROE_MODES.length === 2);

let inventedThrew = false;
try {
  refuseInventedStandingCurves({ unrestThresholds: 3, prestigeEarn: true });
} catch (error) {
  inventedThrew = error.inventedCurves === true;
}
const snap = snapshotStandingTiers({
  catalog,
  unlocks,
  homeFaction: 'ferengi',
  fireInject: { firingSolution: true, engagement_authorized: true },
});
assert('s27.8 snapshot-and-no-curves', inventedThrew === true
  && snap.ok === true
  && snap.missing !== true
  && snap.lockedFromRemastered === false
  && snap.homeStanding === 20
  && snap.othersDefault === 0
  && snap.tiers.military === 50
  && snap.purchase.standingNotFunds === true
  && snap.purchase.concordNeedsVendor === true
  && snap.purchase.remanReasonDistinct === true
  && snap.token.doubleStandingOnKill === false
  && snap.fire.firingSolutionPresent === false
  && snap.inventedCurves.unrest === false
  && snap.inventedCurves.prestigeEarn === false
  && INVENTED_CURVES_REFUSED.unrest === false);

assert('s27.7 landed-lanes-preserved', BOARDING_IMPLEMENTED === true
  && EW_BOARDING === true
  && tractorIsBoarding() === false
  && snap.tractorIsBoard === false
  && POWER_CONSUMERS.join(',') === 'propulsion,weapons,cloak,sensors,ew'
  && srcCatalog.includes('PURCHASE_TIER_STANDING')
  && srcCatalog.includes('evaluateWiredPurchase')
  && srcReman.includes('meetPackPurchaseDecision')
  && srcPhase8.includes('higherBidCannotPermit')
  && srcEconomy.includes('ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED')
  && srcMain.includes('standingTiers: createStandingTiersProbeApi()')
  && srcMain.includes('economyDifficulty: createEconomyDifficultyProbeApi()'));
assert('s27.7 no-reopen', !srcStanding.includes('Thaleron Test Facility')
  && !srcStanding.includes('dockClear')
  && !srcStanding.includes('game_items.json')
  && !srcStanding.includes('git am')
  && !/from ['"][^'"]*remastered/i.test(srcStanding + srcMain)
  && !srcStanding.includes('function getPurchaseDecision')
  && !srcStanding.includes('function meetPackPurchaseDecision')
  && !srcStanding.includes('function createMarketBook')
  && !srcStanding.includes('PROFILE_OVERLAYS')
  && srcStanding.includes('evaluateWiredPurchase')
  && srcStanding.includes('meetPackPurchaseDecision'));

if (failed) {
  console.error(`Standing tiers offline probes: ${passed} passed, ${failed} failed`);
  for (const rowId of failures) console.error(`  FAIL ${rowId}`);
  process.exit(1);
}
console.log(`Standing tiers offline probes: ${passed} passed, ${failed} failed`);
