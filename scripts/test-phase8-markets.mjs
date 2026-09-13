#!/usr/bin/env node
/**
 * Offline Phase 8 market-book / restriction / standing-cap / holding checks.
 * Written from docs/phase8/ only. Does not crib remastered-work.
 */
import {
  CATALOG_WIRE_CLOSED,
  FORBIDDEN_FIRE_INJECT,
  MEET_PACK_ONLY_REMAN,
  PHASE5_SUBSCRIBE_ONLY,
  PHASE8_MAGNITUDES,
  REMAN_HULL_ID,
  TRUSTED_SHOP_STANDING_CAP,
  applyFleetUpkeep,
  applyHoldingJumpTick,
  applyHoldingNeglect,
  applyPhase5Fill,
  applyPhase5Worsen,
  applyShopBuy,
  applyShopSell,
  boundTravelSalvage,
  cheaperHullStillUseful,
  closedShortageMustNotReprint,
  creditWorthwhileTrip,
  cultureFireFromMarketForbidden,
  embargoNoticeStandingWrite,
  emptyMarketBook,
  evaluateCargoDeal,
  evaluateDockService,
  evaluateHoldingIncome,
  evaluateJobEligibility,
  evaluateWartimeHullOffer,
  higherBidCannotPermit,
  independentStandingIsNotImmunity,
  injectIndependentRestrictedMarket,
  injectMarket,
  injectWartimePorts,
  lastRefuseKind,
  markHoldingLost,
  mintHoldingOnClaim,
  obligationsMet,
  phase5OutcomesUntouched,
  plantFlagDoesNotGrantMarketTrust,
  recoverHolding,
  resolveMagnitudes,
  restockOnLoadForbidden,
  restoreMarketBook,
  serializeMarketBook,
  setObligations,
  shopStandingDelta,
  tickMarketBook,
  wartimeExceptionSellsHull,
} from '../src/phase8-markets.js';
import { PURCHASE_TIER_STANDING } from '../src/ship-catalog-wire.js';
import { S7_8_MEETING_POINT } from '../src/side-lane-repair-reman.js';

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

assert('s13.helpers-present', typeof injectMarket === 'function' && typeof injectWartimePorts === 'function');
assert('s13.trusted-cites-wire', TRUSTED_SHOP_STANDING_CAP === PURCHASE_TIER_STANDING.trusted && TRUSTED_SHOP_STANDING_CAP === 15);
assert('s13.magnitudes-injectable', resolveMagnitudes({ stockCap: 3 }).stockCap === 3 && PHASE8_MAGNITUDES.stockCap !== undefined);
assert('s13.no-fire-key', FORBIDDEN_FIRE_INJECT === 'engagement_authorized');
assert('s13.gate6-flags', PHASE5_SUBSCRIBE_ONLY === true && CATALOG_WIRE_CLOSED === true && MEET_PACK_ONLY_REMAN === true);
assert('s13.reman-meeting-cited', S7_8_MEETING_POINT.closed === true && REMAN_HULL_ID === 53);

const book = emptyMarketBook();
const minted = injectMarket(book, {
  marketId: 'mkt-probe',
  locationId: 'port:sol',
  locationName: 'Sol dock',
  systemIndex: 0,
  good: 'food',
  stock: 4,
  demand: 5,
  stockCap: 6,
  demandCap: 7,
  floor: 0,
  price: 5,
  restriction: 'open',
});
assert('s13.1-inject-ok', minted.ok === true && minted.market.stock === 4 && minted.market.demand === 5);

const bought = applyShopBuy(book, { marketId: 'mkt-probe', credits: 100 });
assert('s13.1-buy-lowers-stock', bought.ok && bought.stock === 3 && bought.standingDelta === 0);

const fill = applyPhase5Fill(book, { marketId: 'mkt-probe', token: 'fill:asg-1', atStrategicJumps: 1 });
assert('s13.1-fill-raises-stock', fill.ok && fill.stock === 5 && fill.demand === 3);
const fill2 = applyPhase5Fill(book, { marketId: 'mkt-probe', token: 'fill:asg-2', atStrategicJumps: 2 });
assert('s13.1-fill-clamped', fill2.ok && fill2.stock === 6 && fill2.saturated === true);
const fillAgain = applyPhase5Fill(book, { marketId: 'mkt-probe', token: 'fill:asg-2', atStrategicJumps: 3 });
assert('s13.1-repeat-token-no-grow', fillAgain.alreadyApplied === true && fillAgain.stock === 6 && fillAgain.reprinted === false);

const preLoss = { stock: book.markets['mkt-probe'].stock, demand: book.markets['mkt-probe'].demand };
const worsen = applyPhase5Worsen(book, { marketId: 'mkt-probe', token: 'worsen:asg-3', atStrategicJumps: 4 });
assert('s13.2-worsen-bounded', worsen.ok && worsen.stock === preLoss.stock - 2 && worsen.demand === Math.min(7, preLoss.demand + 2));
const tick = tickMarketBook(book, { atStrategicJumps: 5, restockToCap: false });
assert('s13.2-jump-no-reprint', tick.ok && tick.restockedToCap === false && book.markets['mkt-probe'].stock === worsen.stock);
const forbiddenRestock = tickMarketBook(book, { restockToCap: true });
assert('s13.2-restock-flag-refused', forbiddenRestock.ok === false && forbiddenRestock.reason === 'restock-forbidden');

const closed = closedShortageMustNotReprint(book, 'fill:asg-1');
assert('s13.3-closed-token-no-reprint', closed.reprinted === false && closed.reopened === false && closed.mintedReplacementCargo === false);

const restored = restoreMarketBook(serializeMarketBook(book));
assert('s13.1-roundtrip', restored.markets['mkt-probe']?.stock === book.markets['mkt-probe'].stock);
assert('s13.1-load-no-restock', restockOnLoadForbidden(restored) === true && restored.lastLoadRestocked === false);

const ports = injectWartimePorts(emptyMarketBook(), { good: 'munitions' });
assert('s13.5-wartime-fixture', ports.ok && ports.imperial.restriction === 'embargo' && ports.neutral.restriction === 'premium');
const embargo = evaluateCargoDeal(ports.book, { marketId: ports.imperial.marketId, credits: 9e9, priceOffered: 9e9 });
const embargoBid = higherBidCannotPermit(embargo, 9e9);
assert('s13.4-embargo-any-price', embargo.allowed === false && embargo.kind === 'embargo' && embargoBid.allowed === false);
assert('s13.5-imperial-refuses', /embargo/i.test(embargo.sayable) && embargo.priceMayBypass === false);

const licenseBook = emptyMarketBook();
injectMarket(licenseBook, {
  marketId: 'mkt-lic',
  locationId: 'orion:broker',
  good: 'munitions',
  restriction: 'license',
  licenseId: 'wartime-orion',
  stock: 3,
});
const noPermit = evaluateCargoDeal(licenseBook, { marketId: 'mkt-lic', credits: 9e9 });
assert('s13.4-license-refuses', noPermit.allowed === false && noPermit.kind === 'license');
const granted = { ...licenseBook, licenses: { 'wartime-orion': true } };
const withPermit = evaluateCargoDeal(granted, { marketId: 'mkt-lic', credits: 9e9, hasLicense: true });
assert('s13.4-license-allows-when-held', withPermit.allowed === true);

const sellerBook = emptyMarketBook();
injectMarket(sellerBook, {
  marketId: 'mkt-seller',
  locationId: 'indep:shop',
  good: 'parts',
  restriction: 'seller_rule',
  sellerWillDeal: false,
});
const seller = evaluateCargoDeal(sellerBook, { marketId: 'mkt-seller', credits: 9e9, sellerHostile: true });
assert('s13.4-seller-refuses', seller.allowed === false && seller.kind === 'seller_rule');

const premium = evaluateCargoDeal(ports.book, { marketId: ports.neutral.marketId, credits: 9e9 });
assert('s13.4-premium-allows-worse-price', premium.allowed === true && premium.kind === 'premium' && premium.price > ports.neutral.price);
assert('s13.5-sayable-names-kind', /premium|black-market/i.test(premium.sayable));
assert('s13.4-kinds-distinct', embargo.kind !== premium.kind && lastRefuseKind(ports.book) === 'embargo');

const openBook = emptyMarketBook();
injectMarket(openBook, {
  marketId: 'mkt-open',
  locationId: 'port:orion-open',
  good: 'munitions',
  restriction: 'open',
  stock: 4,
});
injectMarket(openBook, {
  marketId: 'mkt-ban',
  locationId: 'earth:utopia',
  good: 'munitions',
  restriction: 'embargo',
  stock: 4,
});
const localOpen = evaluateCargoDeal(openBook, { marketId: 'mkt-open', credits: 100 });
const localBan = evaluateCargoDeal(openBook, { marketId: 'mkt-ban', credits: 100 });
assert('s13.8-local-not-global', localOpen.allowed === true && localBan.allowed === false && localBan.galaxyWide === false);
assert('s13.8-sayable-local', /utopia|embargo/i.test(localBan.sayable));

const independent = injectIndependentRestrictedMarket(emptyMarketBook(), { restriction: 'embargo', good: 'munitions' });
const indDeal = evaluateCargoDeal(independent.book, { marketId: independent.market.marketId, credits: 9e9 });
const immunity = independentStandingIsNotImmunity(40, indDeal);
assert('s13.7-independent-not-immune', indDeal.allowed === false && immunity.immune === false && immunity.pact === false);
assert('s13.7-trusted-neutral-no-lift', immunity.trustedDoesNotLiftEmbargo === true);

const hull53 = evaluateWartimeHullOffer(53, { credits: 9e9, hasRemanAccess: false });
assert('s13.15-black-market-no-53', wartimeExceptionSellsHull(53) === false && hull53.allowed === false && hull53.reason === 'access-locked');
const hullBroke = evaluateWartimeHullOffer(53, { credits: 1, price: 50000, hasRemanAccess: true });
assert('s13.6-reasons-distinct-shape', hull53.reason === 'access-locked' && hullBroke.reason === 'funds');

const shop = emptyMarketBook();
injectMarket(shop, { marketId: 'mkt-shop', locationId: 'port:shop', good: 'fuel', stock: 5, restriction: 'open' });
const buy = applyShopBuy(shop, { marketId: 'mkt-shop', credits: 50 });
const sell = applyShopSell(shop, { marketId: 'mkt-shop', credits: 50 });
assert('s13.9-reversal-zero-standing', buy.standingDelta === 0 && sell.standingDelta === 0 && sell.reversal === true);
assert('s13.9-cap-helper', shopStandingDelta({ currentStanding: 20, writeStanding: true, isReversal: false }) === 0);
assert('s13.9-reversal-helper', shopStandingDelta({ isReversal: true, writeStanding: true }) === 0);

const farm = emptyMarketBook();
injectMarket(farm, { marketId: 'mkt-farm', locationId: 'port:farm', good: 'food', stock: 2, stockCap: 8 });
const firstSalvage = boundTravelSalvage(farm, 30);
const secondSalvage = boundTravelSalvage(farm, 30);
assert('s13.10-salvage-capped', firstSalvage.paid === 30 && secondSalvage.paid === 10 && secondSalvage.attackerId === null);
tickMarketBook(farm, { atStrategicJumps: 1 });
tickMarketBook(farm, { atStrategicJumps: 2 });
tickMarketBook(farm, { atStrategicJumps: 3 });
assert('s13.10-jump-no-cap-refill', farm.markets['mkt-farm'].stock === 2);

const conquest = emptyMarketBook();
const holding = mintHoldingOnClaim(conquest, { systemIndex: 4, locationName: 'Occupied world', graceJumpsRemaining: 0 });
assert('s13.11-holding-minted', holding.ok && obligationsMet(holding.holding) === false);
const neglectedIncome = evaluateHoldingIncome(holding.holding);
assert('s13.11-no-snowball', neglectedIncome.income === 0 && neglectedIncome.reason === 'neglected');
setObligations(holding.holding, { all: true });
const metIncome = evaluateHoldingIncome(holding.holding);
assert('s13.11-met-bounded', metIncome.income > 0 && metIncome.income <= PHASE8_MAGNITUDES.holdingIncomeCap);
const paid = applyHoldingJumpTick(conquest, { atStrategicJumps: 1 });
assert('s13.11-income-while-met', paid.results[0].income > 0 && paid.freeNavy === false);

const neglected = emptyMarketBook();
const raw = mintHoldingOnClaim(neglected, { systemIndex: 5, locationName: 'Frontier', graceJumpsRemaining: 0 });
let unrestHits = 0;
const neglect = applyHoldingNeglect(neglected, raw.holding, {
  unrestWriter: () => { unrestHits += 1; },
  systemIndex: 5,
});
assert('s13.12-sayable-penalty', /neglected/i.test(neglect.sayable) && neglect.wiped === false && neglect.navySpawned === false);
assert('s13.12-optional-unrest', unrestHits === 1 && neglect.unrestCalled === true);
const dock = evaluateDockService(raw.holding, 'repair', { baseCost: 1 });
assert('s13.10-repair-refuse-without-supply', dock.refuse === true && dock.allowed === false);

const lost = markHoldingLost(neglected, 5);
assert('s13.13-lost-keeps-record', lost.ok && lost.holding.lost === true && lost.remanTouched === false);
const recovered = recoverHolding(neglected, lost.holding, 'supply-convoy');
assert('s13.13-recovery', recovered.ok && recovered.remanCheat === false && recovered.moneyCheat === false && lost.holding.lost === false);
assert('s13.13-flag-no-trust', plantFlagDoesNotGrantMarketTrust().catalogStanding === false);

const trip = emptyMarketBook();
const firstPay = creditWorthwhileTrip(trip, 'trip:asg-9', () => 2);
const replay = creditWorthwhileTrip(trip, 'trip:asg-9', () => 2);
assert('s13.17-trip-once', firstPay.paid === true && replay.paid === false && replay.reason === 'already-credited');

const board = { orders: { 'ford-1': { orderId: 'ford-1', kind: 'hold_outside', status: 'standing', assignedShipIds: ['esc-a'] } } };
const upkeep = applyFleetUpkeep(emptyMarketBook(), board, { parkedShipIds: ['esc-a'] });
assert('s13.16-upkeep-nonzero', upkeep.charge > 0 && upkeep.readinessDrop > 0);
assert('s13.16-kind-unchanged', upkeep.orderKindsUnchanged === true && board.orders['ford-1'].kind === 'hold_outside' && board.orders['ford-1'].status === 'standing');

const cheap = evaluateJobEligibility({ id: 18, capital: false, stockClass: 'light' }, {
  requiresLicense: true,
  hasLicense: false,
  upkeepBlocksCapital: true,
  capitalHullIds: [61],
  stockClass: 'light',
});
const capital = evaluateJobEligibility({ id: 61, capital: true, stockClass: 'capital' }, {
  requiresLicense: true,
  hasLicense: false,
  upkeepBlocksCapital: true,
  capitalHullIds: [61],
  stockClass: 'light',
});
assert('s13.18-cheaper-useful', cheap.allowed === true && capital.allowed === false && cheaperHullStillUseful().magicPrices === false);

const refuseDeal = evaluateCargoDeal(ports.book, { marketId: ports.imperial.marketId, credits: 1 });
assert('s13.15-no-culture-fire', cultureFireFromMarketForbidden(refuseDeal) === true && refuseDeal.attackId === null);
assert('s13.15-embargo-no-standing', embargoNoticeStandingWrite().standingWrite === false && embargoNoticeStandingWrite().doubleStanding === false);
assert('s13.14-phase5-untouched', phase5OutcomesUntouched().overdueIsDestroyed === false && phase5OutcomesUntouched().overdueHasAttacker === false);

if (failed) {
  console.error(`Phase 8 market tests: ${passed} passed, ${failed} failed`);
  for (const row of failures) console.error(`  FAIL ${row}`);
  process.exitCode = 1;
} else {
  console.log(`Phase 8 market tests: ${passed} passed, ${failed} failed`);
}
