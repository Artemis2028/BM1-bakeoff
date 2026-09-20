#!/usr/bin/env node
/**
 * Offline economy / difficulty knob probes (S26 family).
 * Written from docs/economy-difficulty/ only. Does not crib remastered-work.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadShipCatalog } from '../bm-ships/catalog.mjs';
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
import { POWER_CONSUMERS } from '../src/phase65-power.js';
import { ROE_MODES } from '../src/phase2-security.js';
import {
  HOME_FACTION_STANDING,
  PURCHASE_TIER_STANDING,
  catalogPurchaseContext,
  evaluateWiredPurchase,
} from '../src/ship-catalog-wire.js';
import { createPlayerUnlocks } from '../src/side-lane-repair-reman.js';
import {
  FORBIDDEN_FIRE_INJECT,
  PHASE8_MAGNITUDES,
  TRUSTED_SHOP_STANDING_CAP,
  applyShopBuy,
  applyShopSell,
  boundTravelSalvage,
  emptyMarketBook,
  injectIndependentRestrictedMarket,
  injectMarket,
  resolveMagnitudes,
  shopStandingDelta,
  tickMarketBook,
} from '../src/phase8-markets.js';
import {
  ALLOWED_PHASE8_OVERLAY_FAMILIES,
  DEFAULT_DIFFICULTY_PROFILE,
  DIFFICULTY_PROFILES,
  ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED,
  INVENTED_TABLES_REFUSED,
  PROFILE_OVERLAYS,
  applyDifficultyProfile,
  assertDifficultyIdentityInvariant,
  assertFarmsClosedOnEasy,
  assertMoneyStandingRemanDistinct,
  breenDominionStaticFriendship,
  defensePlatformNeverRepair,
  difficultyChangeMustNotRestock,
  difficultyInjectMustNotGiftFire,
  emptyEconomyDifficultyBook,
  overlayDirection,
  pickAllowedPhase8Families,
  refuseInventedDifficultyTables,
  requireEconomyDifficultyHelpers,
  resolveDifficultyMagnitudes,
  restoreEconomyDifficultyBook,
  snapshotEconomyDifficulty,
} from '../src/economy-difficulty.js';

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
const srcEconomy = fs.readFileSync(path.join(root, 'src/economy-difficulty.js'), 'utf8');
const srcPhase8 = fs.readFileSync(path.join(root, 'src/phase8-markets.js'), 'utf8');
const srcCatalog = fs.readFileSync(path.join(root, 'src/ship-catalog-wire.js'), 'utf8');

assert('s26.startup-helpers', typeof resolveDifficultyMagnitudes === 'function'
  && typeof snapshotEconomyDifficulty === 'function'
  && typeof applyDifficultyProfile === 'function'
  && typeof requireEconomyDifficultyHelpers === 'function'
  && typeof refuseInventedDifficultyTables === 'function');

let helpersOk = true;
try {
  requireEconomyDifficultyHelpers();
} catch {
  helpersOk = false;
}
assert('s26.startup-subscribe', helpersOk === true);

assert('s26.8 lock-false', ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED === false
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

assert('s26.8 profiles', DIFFICULTY_PROFILES.includes('easy')
  && DIFFICULTY_PROFILES.includes('standard')
  && DIFFICULTY_PROFILES.includes('hard')
  && DEFAULT_DIFFICULTY_PROFILE === 'standard');

const standard = resolveDifficultyMagnitudes('standard');
const phase8 = resolveMagnitudes();
assert('s26.1 standard-equals-phase8', overlayDirection('standard').standardEqualsPhase8 === true
  && Object.keys(PHASE8_MAGNITUDES).every((key) => standard[key] === PHASE8_MAGNITUDES[key])
  && Object.keys(PHASE8_MAGNITUDES).every((key) => standard[key] === phase8[key]), JSON.stringify({
  standardStock: standard.stockCap,
  phase8Stock: PHASE8_MAGNITUDES.stockCap,
}));

const easy = resolveDifficultyMagnitudes('easy');
const hard = resolveDifficultyMagnitudes('hard');
assert('s26.1 allowed-families-only', ALLOWED_PHASE8_OVERLAY_FAMILIES.every((key) => (
  Object.prototype.hasOwnProperty.call(easy, key)
))
  && easy.listPrice === PHASE8_MAGNITUDES.listPrice
  && hard.premiumMultiplier === PHASE8_MAGNITUDES.premiumMultiplier
  && Object.keys(PROFILE_OVERLAYS.easy).every((key) => ALLOWED_PHASE8_OVERLAY_FAMILIES.includes(key))
  && Object.keys(PROFILE_OVERLAYS.hard).every((key) => ALLOWED_PHASE8_OVERLAY_FAMILIES.includes(key)));

const injected = resolveDifficultyMagnitudes('easy', { salvageLatinumCap: 77, listPrice: 999, unrestThresholds: undefined });
assert('s26.1 inject-allowed-only', injected.salvageLatinumCap === 77
  && injected.listPrice === PHASE8_MAGNITUDES.listPrice
  && injected.unrestThresholds == null);

const infinityDropped = resolveDifficultyMagnitudes('easy', { salvageLatinumCap: Infinity });
assert('s26.4 no-infinity-cap', Number.isFinite(infinityDropped.salvageLatinumCap)
  && infinityDropped.salvageLatinumCap !== Infinity);

assert('s26.1 easy-slack-direction', easy.stockCap >= standard.stockCap
  && easy.salvageLatinumCap >= standard.salvageLatinumCap
  && easy.holdingGraceJumps >= standard.holdingGraceJumps
  && easy.fleetUpkeepPerParked <= standard.fleetUpkeepPerParked
  && easy.repairPremiumWithoutSupply <= standard.repairPremiumWithoutSupply
  && easy.worsenDelta <= standard.worsenDelta);
assert('s26.1 hard-pressure-direction', hard.stockCap <= standard.stockCap
  && hard.salvageLatinumCap <= standard.salvageLatinumCap
  && hard.holdingGraceJumps <= standard.holdingGraceJumps
  && hard.fleetUpkeepPerParked >= standard.fleetUpkeepPerParked
  && hard.repairPremiumWithoutSupply >= standard.repairPremiumWithoutSupply
  && hard.worsenDelta >= standard.worsenDelta);

const identityEasy = assertDifficultyIdentityInvariant('easy', {
  relations: {},
  concession: { faction: 'terran', privateInstallation: true },
  playerSide: 'ferengi',
  concessionOwner: 'terran',
  arrivalScene: {
    ships: [{ id: 'hostile-1', faction: 'klingon', role: 'raid' }],
    stations: [{ id: 'conc-1', faction: 'terran', privateInstallation: true }],
  },
  customPolityId: 'custom:77',
  customPolityAfter: 'custom:77',
});
const identityHard = assertDifficultyIdentityInvariant('hard', {
  relations: { breen: { friendly: ['dominion'], hostile: [] }, dominion: { friendly: ['breen'], hostile: [] } },
  concession: { faction: 'terran', privateInstallation: true },
  playerSide: 'ferengi',
});
assert('s26.1 pacing-not-ownership', identityEasy.flagShareIsControl === false
  && identityEasy.ownershipRewritten === false
  && identityEasy.customPolityIntact === true
  && identityHard.flagShareIsControl === false);
assert('s26.2 identity-easy', identityEasy.concessionForeign === true
  && identityEasy.independentsAreAlliance === false
  && identityEasy.breenDominionStaticFriendship === false
  && identityEasy.arrivalDeletesHostileFleet === false
  && identityEasy.twoModeRoe === true);
assert('s26.2 identity-hard-strips-static-friend', identityHard.breenDominionStaticFriendship === false
  && breenDominionStaticFriendship({
    breen: { friendly: ['dominion'], hostile: [] },
    dominion: { friendly: ['breen'], hostile: [] },
  }) === false);

let inventedThrew = false;
try {
  refuseInventedDifficultyTables({ unrestThresholds: 3 });
} catch (error) {
  inventedThrew = error.inventedTables === true;
}
let repairTableThrew = false;
try {
  resolveDifficultyMagnitudes('easy', { repairPrices: { hull: 2 } });
} catch (error) {
  repairTableThrew = error.inventedTables === true;
}
assert('s26.3 no-invented-tables', inventedThrew === true
  && repairTableThrew === true
  && INVENTED_TABLES_REFUSED.repairPrices === false
  && INVENTED_TABLES_REFUSED.unrestThresholds === false
  && INVENTED_TABLES_REFUSED.prestigeCurve === false
  && defensePlatformNeverRepair() === true
  && !srcEconomy.includes('UNREST_THRESHOLD_EASY =')
  && !srcEconomy.includes('REPAIR_PRICE_BY_DIFFICULTY')
  && !srcEconomy.includes('prestigePerJump ='));

const snap = snapshotEconomyDifficulty({
  profile: 'easy',
  concession: { faction: 'terran', privateInstallation: true },
  playerSide: 'ferengi',
  relations: {},
});
assert('s26.3 snapshot-overlay', snap.ok === true
  && snap.missing !== true
  && snap.profile === 'easy'
  && snap.inventedTables.repairPrices === false
  && snap.inventedTables.unrestThresholds === false
  && snap.inventedTables.prestigeCurve === false
  && snap.repair.defensePlatformRepair === false
  && snap.overlay.salvageLatinumCap != null, JSON.stringify(snap.inventedTables));

const farms = assertFarmsClosedOnEasy('easy');
assert('s26.4 farms-closed-easy', farms.shopReversalStanding === 0
  && farms.shopStandingCap === 15
  && farms.trustedCapUntouched === true
  && farms.jumpRestocksToCap === false
  && farms.salvageCapped === true
  && farms.transportCapped === true
  && shopStandingDelta({ isReversal: true, writeStanding: true }) === 0
  && TRUSTED_SHOP_STANDING_CAP === 15);

const shop = emptyMarketBook();
injectMarket(shop, {
  marketId: 'mkt-s26',
  locationId: 'port:s26',
  good: 'fuel',
  stock: 4,
  stockCap: 8,
  restriction: 'open',
});
const buy = applyShopBuy(shop, { marketId: 'mkt-s26', credits: 50 }, easy);
const sell = applyShopSell(shop, { marketId: 'mkt-s26', credits: 50 }, easy);
tickMarketBook(shop, { atStrategicJumps: 1, injected: easy });
tickMarketBook(shop, { atStrategicJumps: 2, injected: easy });
tickMarketBook(shop, { atStrategicJumps: 3, injected: easy });
const salvage = boundTravelSalvage(emptyMarketBook(), 500, easy);
assert('s26.4 easy-shop-jump', buy.standingDelta === 0
  && sell.standingDelta === 0
  && sell.reversal === true
  && shop.markets['mkt-s26'].stock === 4
  && salvage.bounded === true
  && salvage.paid <= easy.salvageLatinumCap);

const catalog = loadShipCatalog();
const military = evaluateWiredPurchase(catalog, 2, createPlayerUnlocks(), catalogPurchaseContext({
  credits: 9e9,
  standings: { terran: 0, neutral: 0 },
  systemName: 'Earth',
  station: { name: 'Utopia Planitia' },
}));
const reman = evaluateWiredPurchase(catalog, 53, createPlayerUnlocks(), catalogPurchaseContext({
  credits: 9e9,
  standings: { reman: 100, terran: 100, ferengi: 100, neutral: 100 },
  systemName: 'Remus',
  station: { name: 'Reman Starbase' },
}));
const purchase = assertMoneyStandingRemanDistinct({ military, reman });
const independent = injectIndependentRestrictedMarket(emptyMarketBook(), {
  restriction: 'embargo',
  good: 'munitions',
});
assert('s26.5 money-ne-standing-ne-reman', military.allowed === false
  && military.reason === 'faction-standing'
  && reman.allowed === false
  && reman.reason === 'access-locked'
  && purchase.homeUntouched === true
  && HOME_FACTION_STANDING === 20
  && PURCHASE_TIER_STANDING.military === 50
  && independent.market.restriction === 'embargo');

const fire = difficultyInjectMustNotGiftFire({
  firingSolution: true,
  engagement_authorized: true,
  cultureFire: true,
});
assert('s26.6 no-fire-gift', fire.firingSolutionPresent === false
  && fire.engagementAuthorizedPresent === false
  && fire.cultureFire === false
  && fire.tractorIsBoard === false
  && fire.twoModeRoe.join(',') === 'return-fire,defend'
  && !Object.prototype.hasOwnProperty.call(fire.row, 'firingSolution')
  && !Object.prototype.hasOwnProperty.call(fire.row, FORBIDDEN_FIRE_INJECT)
  && tractorIsBoarding() === false
  && ROE_MODES.length === 2);

const book = emptyEconomyDifficultyBook();
const jumpFarmBefore = { salvagePaid: 12, transportPaid: 4 };
const changed = applyDifficultyProfile(book, 'hard', {
  fireInject: { firingSolution: true, engagement_authorized: true },
});
assert('s26.4 mid-run-pacing-only', changed.ok === true
  && changed.profile === 'hard'
  && changed.restocked === false
  && changed.jumpFarmReset === false
  && changed.standingRewritten === false
  && changed.remanMinted === false
  && changed.fireGifted === false
  && difficultyChangeMustNotRestock().restocked === false
  && jumpFarmBefore.salvagePaid === 12);

const restored = restoreEconomyDifficultyBook({ profile: 'easy', extra: true });
assert('s26.1 book-roundtrip', restored.profile === 'easy'
  && restored.version === 1
  && restored.extra == null);

assert('s26.7 landed-lanes-preserved', BOARDING_IMPLEMENTED === true
  && EW_BOARDING === true
  && tractorIsBoarding() === false
  && snap.tractorIsBoard === false
  && POWER_CONSUMERS.join(',') === 'propulsion,weapons,cloak,sensors,ew'
  && srcPhase8.includes('shopStandingDelta')
  && srcPhase8.includes('jumpMustNotReprintInfinity')
  && srcCatalog.includes('PURCHASE_TIER_STANDING')
  && srcMain.includes('economyDifficulty: createEconomyDifficultyProbeApi()')
  && srcMain.includes('livePhase8Magnitudes'));
assert('s26.7 no-reopen', !srcEconomy.includes('Thaleron Test Facility')
  && !srcEconomy.includes('dockClear')
  && !srcEconomy.includes('game_items.json')
  && !srcEconomy.includes('git am')
  && !/from ['"][^'"]*remastered/i.test(srcEconomy + srcMain)
  && !srcEconomy.includes('function createMarketBook')
  && pickAllowedPhase8Families({ listPrice: 1, stockCap: 9 }).listPrice == null
  && pickAllowedPhase8Families({ listPrice: 1, stockCap: 9 }).stockCap === 9);

if (failed) {
  console.error(`Economy difficulty offline probes: ${passed} passed, ${failed} failed`);
  for (const rowId of failures) console.error(`  FAIL ${rowId}`);
  process.exit(1);
}
console.log(`Economy difficulty offline probes: ${passed} passed, ${failed} failed`);
