/**
 * Phase 8 — finite markets, trade permissions, conquest costs.
 *
 * Source of truth:
 * - docs/phase8/BM1-PHASE8-ECONOMY-TRADE-PROGRESSION-PROPOSAL.md
 * - docs/phase8/BM1-PHASE8-ENGINE-DEPENDENCIES.md
 *
 * Written from those docs only. Does not crib BM1-remastered-work.
 * Does not reopen Phase 5 convoy outcomes or catalog wire.
 * Does not invent a second Reman meeting point.
 *
 * Hard gates:
 * 1. Persistent compact stock/demand; fill/worsen clamped; no restock on
 *    load / day / jump alone.
 * 2. Price is not a ban bypass — embargo / license / seller_rule / premium.
 * 3. Money ≠ standing ≠ Reman; independent ≠ alliance / immunity.
 * 4. No buy/sell prestige loops; no jump-farm infinity.
 * 5. Holdings are responsibilities (garrison / supply / reconstruction /
 *    stabilization), not a charter-fee tax farm.
 * 6. Subscribe to Phase 5 + catalog wire; no second Reman/money bypass.
 */

import { PURCHASE_TIER_STANDING } from './ship-catalog-wire.js';

export const MARKET_BOOK_VERSION = 1;
export const FORBIDDEN_FIRE_INJECT = 'engagement_authorized';
export const REMAN_HULL_ID = 53;
export const TRUSTED_SHOP_STANDING_CAP = PURCHASE_TIER_STANDING.trusted;
export const PHASE5_SUBSCRIBE_ONLY = true;
export const CATALOG_WIRE_CLOSED = true;
export const MEET_PACK_ONLY_REMAN = true;

export const RESTRICTION_KINDS = Object.freeze([
  'embargo',
  'license',
  'seller_rule',
  'premium',
]);

export const RESTRICTION_ORDER = Object.freeze(['embargo', 'license', 'seller_rule', 'premium']);

export const DOCK_KINDS = Object.freeze([
  'imperial',
  'neutral',
  'black_market',
  'independent',
]);

export const OBLIGATION_LANES = Object.freeze([
  'garrison',
  'supply',
  'reconstruction',
  'stabilization',
]);

export const WARTIME_GOOD_DEFAULT = 'munitions';

/**
 * Shape is locked. Magnitudes are injectable / TBD — not a finished balance.
 * Tests assert clamps, refuse-vs-premium, non-zero upkeep, and caps — not
 * these example numbers as a complete economy.
 */
export const PHASE8_MAGNITUDES = Object.freeze({
  stockCap: 8,
  demandCap: 8,
  floor: 0,
  fillDelta: 2,
  worsenDelta: 2,
  overdueDemandTick: 1,
  tickDrift: 0,
  premiumMultiplier: 3,
  listPrice: 6,
  salvageLatinumCap: 40,
  transportLatinumCap: 80,
  holdingIncomeWhenMet: 8,
  holdingIncomeCap: 25,
  holdingGraceJumps: 1,
  fleetUpkeepPerParked: 1,
  readinessDropPerJump: 8,
  reconstructionSpend: 50,
  repairPremiumWithoutSupply: 2,
});

const KIND_SET = new Set(RESTRICTION_KINDS);
const DOCK_SET = new Set(DOCK_KINDS);
const LANE_SET = new Set(OBLIGATION_LANES);

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeKey(value, fallback = '') {
  const key = String(value ?? '').trim();
  return key && key !== 'undefined' && key !== 'null' ? key : fallback;
}

function asInt(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function clampInt(value, min, max) {
  return Math.max(min, Math.min(max, asInt(value, min)));
}

function magnitudesOf(injected = null) {
  return { ...PHASE8_MAGNITUDES, ...(injected && typeof injected === 'object' ? injected : {}) };
}

export function resolveMagnitudes(injected = null) {
  return magnitudesOf(injected);
}

export function locationIdForSystem(systemIndex, name = '') {
  const n = asInt(systemIndex, -1);
  const label = normalizeKey(name).toLowerCase().replace(/\s+/g, '-') || 'system';
  return `sys:${n}:${label}`;
}

export function locationIdForDock(dockId, systemName = '') {
  const dock = normalizeKey(dockId).toLowerCase().replace(/\s+/g, '-') || 'dock';
  const sys = normalizeKey(systemName).toLowerCase().replace(/\s+/g, '-');
  return sys ? `dock:${sys}:${dock}` : `dock:${dock}`;
}

export function createMarketBook(extras = {}) {
  return {
    version: MARKET_BOOK_VERSION,
    nextMarketId: Math.max(1, asInt(extras.nextMarketId, 1)),
    nextHoldingId: Math.max(1, asInt(extras.nextHoldingId, 1)),
    markets: extras.markets && typeof extras.markets === 'object' ? extras.markets : {},
    goods: extras.goods && typeof extras.goods === 'object' ? extras.goods : {},
    writeTokens: extras.writeTokens && typeof extras.writeTokens === 'object' ? extras.writeTokens : {},
    tripTokens: extras.tripTokens && typeof extras.tripTokens === 'object' ? extras.tripTokens : {},
    licenses: extras.licenses && typeof extras.licenses === 'object' ? extras.licenses : {},
    wartime: extras.wartime && typeof extras.wartime === 'object'
      ? extras.wartime
      : { active: false, good: null, imperialLocationIds: [], exceptionLocationIds: [] },
    holdings: extras.holdings && typeof extras.holdings === 'object' ? extras.holdings : {},
    jumpFarm: extras.jumpFarm && typeof extras.jumpFarm === 'object'
      ? extras.jumpFarm
      : { salvagePaid: 0, transportPaid: 0 },
    lastShopTrade: extras.lastShopTrade || null,
    lastRefuse: extras.lastRefuse || null,
    lastDeal: extras.lastDeal || null,
    lastJumpTickAt: extras.lastJumpTickAt ?? null,
    lastLoadRestocked: false,
    fleetReadiness: extras.fleetReadiness && typeof extras.fleetReadiness === 'object' ? extras.fleetReadiness : {},
    upkeepCharged: asInt(extras.upkeepCharged, 0),
    unrestCalls: Array.isArray(extras.unrestCalls) ? extras.unrestCalls : [],
    lastPenalty: extras.lastPenalty || null,
    lastIncome: extras.lastIncome || null,
    recoveredPaths: Array.isArray(extras.recoveredPaths) ? extras.recoveredPaths : [],
  };
}

export function emptyMarketBook() {
  return createMarketBook();
}

export function serializeMarketBook(book) {
  return clone(book && book.version === MARKET_BOOK_VERSION ? book : createMarketBook(book || {}));
}

function sanitizeRestriction(value) {
  const key = normalizeKey(value, 'open').toLowerCase();
  if (key === 'open' || KIND_SET.has(key)) return key;
  return 'open';
}

function sanitizeDockKind(value) {
  const key = normalizeKey(value, 'neutral').toLowerCase();
  return DOCK_SET.has(key) ? key : 'neutral';
}

function sanitizeMarket(raw, goodsSpec, magnitudes) {
  if (!raw || typeof raw !== 'object') return null;
  const marketId = normalizeKey(raw.marketId);
  const good = normalizeKey(raw.good);
  if (!marketId || !good) return null;
  const spec = goodsSpec[good] || {};
  const stockCap = asInt(spec.stockCap, magnitudes.stockCap);
  const demandCap = asInt(spec.demandCap, magnitudes.demandCap);
  const floor = asInt(spec.floor, magnitudes.floor);
  return {
    marketId,
    locationId: normalizeKey(raw.locationId, marketId),
    locationName: normalizeKey(raw.locationName, raw.locationId || marketId),
    systemIndex: raw.systemIndex == null ? null : asInt(raw.systemIndex, null),
    faction: normalizeKey(raw.faction, 'neutral'),
    dockKind: sanitizeDockKind(raw.dockKind),
    good,
    stock: clampInt(raw.stock, floor, stockCap),
    demand: clampInt(raw.demand, floor, demandCap),
    price: Math.max(1, asInt(raw.price, magnitudes.listPrice)),
    restriction: sanitizeRestriction(raw.restriction),
    restrictionSayable: normalizeKey(raw.restrictionSayable),
    licenseId: normalizeKey(raw.licenseId),
    premiumMultiplier: Math.max(1, asInt(raw.premiumMultiplier, magnitudes.premiumMultiplier)),
    sellerWillDeal: raw.sellerWillDeal !== false,
    wartimeGood: raw.wartimeGood === true,
    lastWrite: raw.lastWrite && typeof raw.lastWrite === 'object' ? raw.lastWrite : null,
    saturated: raw.saturated === true,
  };
}

function sanitizeHolding(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const holdingId = normalizeKey(raw.holdingId);
  if (!holdingId) return null;
  const lanes = {};
  for (const lane of OBLIGATION_LANES) {
    const src = raw[lane] && typeof raw[lane] === 'object' ? raw[lane] : {};
    lanes[lane] = { met: src.met === true };
  }
  return {
    holdingId,
    systemIndex: asInt(raw.systemIndex, 0),
    locationId: normalizeKey(raw.locationId, `holding:${holdingId}`),
    locationName: normalizeKey(raw.locationName, raw.locationId || holdingId),
    ...lanes,
    graceJumpsRemaining: Math.max(0, asInt(raw.graceJumpsRemaining, 0)),
    incomePaid: Math.max(0, asInt(raw.incomePaid, 0)),
    neglectedJumps: Math.max(0, asInt(raw.neglectedJumps, 0)),
    lastPenalty: raw.lastPenalty || null,
    unrestCalled: raw.unrestCalled === true,
    lost: raw.lost === true,
    recovered: raw.recovered === true,
    navySpawned: false,
  };
}

export function restoreMarketBook(saved, injected = null) {
  const magnitudes = magnitudesOf(injected);
  const raw = saved && typeof saved === 'object' ? saved : {};
  const book = createMarketBook({
    nextMarketId: raw.nextMarketId,
    nextHoldingId: raw.nextHoldingId,
    goods: raw.goods,
    writeTokens: raw.writeTokens,
    tripTokens: raw.tripTokens,
    licenses: raw.licenses,
    wartime: raw.wartime,
    jumpFarm: raw.jumpFarm,
    lastShopTrade: raw.lastShopTrade,
    lastRefuse: raw.lastRefuse,
    lastDeal: raw.lastDeal,
    lastJumpTickAt: raw.lastJumpTickAt,
    fleetReadiness: raw.fleetReadiness,
    upkeepCharged: raw.upkeepCharged,
    unrestCalls: raw.unrestCalls,
    lastPenalty: raw.lastPenalty,
    lastIncome: raw.lastIncome,
    recoveredPaths: raw.recoveredPaths,
  });
  book.lastLoadRestocked = false;
  const goods = book.goods;
  book.markets = {};
  for (const row of Object.values(raw.markets || {})) {
    const market = sanitizeMarket(row, goods, magnitudes);
    if (market) book.markets[market.marketId] = market;
  }
  book.holdings = {};
  for (const row of Object.values(raw.holdings || {})) {
    const holding = sanitizeHolding(row);
    if (holding) book.holdings[holding.holdingId] = holding;
  }
  return book;
}

export function listMarkets(book) {
  return Object.values(book?.markets || {});
}

export function getMarket(book, marketId) {
  return book?.markets?.[normalizeKey(marketId)] || null;
}

export function findMarket(book, { marketId, locationId, good, systemIndex } = {}) {
  if (marketId && book?.markets?.[marketId]) return book.markets[marketId];
  const wantGood = normalizeKey(good);
  const wantLoc = normalizeKey(locationId);
  const rows = listMarkets(book);
  const byLoc = rows.find((row) => (
    (!wantGood || row.good === wantGood) && wantLoc && row.locationId === wantLoc
  ));
  if (byLoc) return byLoc;
  if (systemIndex != null) {
    const bySystem = rows.find((row) => (
      (!wantGood || row.good === wantGood)
      && row.systemIndex != null
      && Number(row.systemIndex) === Number(systemIndex)
    ));
    if (bySystem) return bySystem;
  }
  return null;
}

export function goodSpec(book, good, injected = null) {
  const magnitudes = magnitudesOf(injected);
  const spec = book?.goods?.[normalizeKey(good)] || {};
  return {
    stockCap: asInt(spec.stockCap, magnitudes.stockCap),
    demandCap: asInt(spec.demandCap, magnitudes.demandCap),
    floor: asInt(spec.floor, magnitudes.floor),
  };
}

export function clampStockDemand(market, spec) {
  if (!market) return { market: null, saturated: false };
  const stockCap = asInt(spec?.stockCap, PHASE8_MAGNITUDES.stockCap);
  const demandCap = asInt(spec?.demandCap, PHASE8_MAGNITUDES.demandCap);
  const floor = asInt(spec?.floor, PHASE8_MAGNITUDES.floor);
  const beforeStock = market.stock;
  const beforeDemand = market.demand;
  market.stock = clampInt(market.stock, floor, stockCap);
  market.demand = clampInt(market.demand, floor, demandCap);
  const saturated = beforeStock !== market.stock || beforeDemand !== market.demand
    || market.stock === stockCap
    || market.demand === demandCap
    || market.stock === floor
    || market.demand === floor;
  market.saturated = saturated && (
    (beforeStock > stockCap || beforeDemand > demandCap || beforeStock < floor || beforeDemand < floor)
    || market.stock === stockCap
    || market.demand === demandCap
  );
  return { market, saturated: market.saturated === true };
}

function ensureGoodSpec(book, good, injected = null) {
  const key = normalizeKey(good);
  if (!key) return goodSpec(book, 'food', injected);
  if (!book.goods[key]) book.goods[key] = goodSpec(book, key, injected);
  return goodSpec(book, key, injected);
}

function takeMarketId(book) {
  const n = book.nextMarketId || 1;
  book.nextMarketId = n + 1;
  return `mkt-${n}`;
}

function takeHoldingId(book) {
  const n = book.nextHoldingId || 1;
  book.nextHoldingId = n + 1;
  return `hld-${n}`;
}

export function injectMarket(book, input = {}, injected = null) {
  const store = book || createMarketBook();
  if (typeof store.nextMarketId !== 'number') {
    return { ok: false, reason: 'injectMarket-missing' };
  }
  const magnitudes = magnitudesOf(injected);
  const good = normalizeKey(input.good, 'food');
  const spec = ensureGoodSpec(store, good, injected);
  if (input.stockCap != null) spec.stockCap = asInt(input.stockCap, spec.stockCap);
  if (input.demandCap != null) spec.demandCap = asInt(input.demandCap, spec.demandCap);
  if (input.floor != null) spec.floor = asInt(input.floor, spec.floor);
  store.goods[good] = spec;
  const marketId = normalizeKey(input.marketId) || takeMarketId(store);
  const existing = store.markets[marketId];
  const market = sanitizeMarket({
    marketId,
    locationId: input.locationId || locationIdForSystem(input.systemIndex, input.locationName),
    locationName: input.locationName || input.locationId || marketId,
    systemIndex: input.systemIndex,
    faction: input.faction,
    dockKind: input.dockKind,
    good,
    stock: input.stock != null ? input.stock : Math.min(4, spec.stockCap),
    demand: input.demand != null ? input.demand : Math.min(4, spec.demandCap),
    price: input.price,
    restriction: input.restriction,
    restrictionSayable: input.restrictionSayable,
    licenseId: input.licenseId,
    premiumMultiplier: input.premiumMultiplier,
    sellerWillDeal: input.sellerWillDeal,
    wartimeGood: input.wartimeGood,
  }, store.goods, magnitudes);
  if (!market) return { ok: false, reason: 'invalid-market' };
  if (existing && input.remint === false) {
    return { ok: false, reason: 'already-minted', market: existing };
  }
  store.markets[marketId] = market;
  return { ok: true, market, book: store };
}

export function writeTokenAlreadyUsed(book, token) {
  return Boolean(book?.writeTokens?.[normalizeKey(token)]);
}

export function stampWriteToken(book, token, meta = {}) {
  if (!book || !token) return { ok: false, reason: 'invalid' };
  book.writeTokens[token] = {
    marketId: meta.marketId || null,
    reason: meta.reason || 'write',
    atStrategicJumps: asInt(meta.atStrategicJumps, 0),
    saturated: meta.saturated === true,
  };
  return { ok: true, token };
}

function applyBoundedWrite(book, market, { stockDelta = 0, demandDelta = 0, reason, token, atStrategicJumps, injected } = {}) {
  if (!market) return { ok: false, reason: 'missing-market' };
  const spec = goodSpec(book, market.good, injected);
  if (token && writeTokenAlreadyUsed(book, token)) {
    return {
      ok: true,
      market,
      alreadyApplied: true,
      reprinted: false,
      saturated: true,
      stock: market.stock,
      demand: market.demand,
    };
  }
  const nextStock = market.stock + asInt(stockDelta, 0);
  const nextDemand = market.demand + asInt(demandDelta, 0);
  const stockCapped = nextStock > spec.stockCap || nextStock < spec.floor;
  const demandCapped = nextDemand > spec.demandCap || nextDemand < spec.floor;
  market.stock = clampInt(nextStock, spec.floor, spec.stockCap);
  market.demand = clampInt(nextDemand, spec.floor, spec.demandCap);
  const saturated = stockCapped || demandCapped;
  market.saturated = saturated;
  market.lastWrite = {
    reason: reason || 'write',
    saturated,
    atStrategicJumps: asInt(atStrategicJumps, 0),
  };
  if (token) stampWriteToken(book, token, { marketId: market.marketId, reason, atStrategicJumps, saturated });
  return {
    ok: true,
    market,
    saturated,
    reprinted: false,
    stock: market.stock,
    demand: market.demand,
    alreadyApplied: false,
  };
}

export function applyPhase5Fill(book, input = {}, injected = null) {
  const store = book || createMarketBook();
  const magnitudes = magnitudesOf(injected);
  const market = findMarket(store, input) || (input.mintIfMissing === true
    ? injectMarket(store, input, injected).market
    : null);
  if (!market) return { ok: false, reason: 'missing-market' };
  return applyBoundedWrite(store, market, {
    stockDelta: asInt(input.stockDelta, magnitudes.fillDelta),
    demandDelta: -asInt(input.demandDelta, magnitudes.fillDelta),
    reason: 'phase5-fill',
    token: input.token || input.closeToken,
    atStrategicJumps: input.atStrategicJumps,
    injected,
  });
}

export function applyPhase5Worsen(book, input = {}, injected = null) {
  const store = book || createMarketBook();
  const magnitudes = magnitudesOf(injected);
  const market = findMarket(store, input);
  if (!market) return { ok: false, reason: 'missing-market' };
  return applyBoundedWrite(store, market, {
    stockDelta: -asInt(input.stockDelta, magnitudes.worsenDelta),
    demandDelta: asInt(input.demandDelta, magnitudes.worsenDelta),
    reason: 'phase5-worsen',
    token: input.token || input.closeToken,
    atStrategicJumps: input.atStrategicJumps,
    injected,
  });
}

export function applyPhase5OverduePressure(book, input = {}, injected = null) {
  const store = book || createMarketBook();
  const magnitudes = magnitudesOf(injected);
  const market = findMarket(store, input);
  if (!market) return { ok: true, skipped: true, destroyed: false, attackerId: null };
  const token = input.token || `overdue:${market.marketId}`;
  if (writeTokenAlreadyUsed(store, token)) {
    return { ok: true, alreadyApplied: true, destroyed: false, attackerId: null, market };
  }
  const wrote = applyBoundedWrite(store, market, {
    stockDelta: 0,
    demandDelta: magnitudes.overdueDemandTick,
    reason: 'phase5-overdue-pressure',
    token,
    atStrategicJumps: input.atStrategicJumps,
    injected,
  });
  return { ...wrote, destroyed: false, attackerId: null };
}

export function closedShortageMustNotReprint(book, token) {
  if (!token) return { reprinted: false, reopened: false };
  const row = book?.writeTokens?.[token];
  return {
    reprinted: false,
    reopened: false,
    tokenKnown: Boolean(row),
    mintedReplacementCargo: false,
  };
}

/**
 * Strategic-jump tick: optional drift toward authored equilibrium inside
 * clamps. Must not refill stock to cap, reset demand, or reprint a closed
 * shortage. Load / day / cancel are not clocks.
 */
export function tickMarketBook(book, { atStrategicJumps = 0, injected = null, restockToCap = false } = {}) {
  const store = book || createMarketBook();
  if (restockToCap) {
    return { ok: false, reason: 'restock-forbidden', restocked: false };
  }
  const magnitudes = magnitudesOf(injected);
  const drift = asInt(magnitudes.tickDrift, 0);
  store.lastJumpTickAt = asInt(atStrategicJumps, 0);
  const snapshots = [];
  for (const market of listMarkets(store)) {
    const spec = goodSpec(store, market.good, injected);
    const before = { stock: market.stock, demand: market.demand };
    if (drift !== 0) {
      const midStock = Math.round((spec.floor + spec.stockCap) / 2);
      const midDemand = Math.round((spec.floor + spec.demandCap) / 2);
      if (market.stock > midStock) market.stock -= Math.min(drift, market.stock - midStock);
      else if (market.stock < midStock) market.stock += Math.min(drift, midStock - market.stock);
      if (market.demand > midDemand) market.demand -= Math.min(drift, market.demand - midDemand);
      else if (market.demand < midDemand) market.demand += Math.min(drift, midDemand - market.demand);
    }
    clampStockDemand(market, spec);
    snapshots.push({
      marketId: market.marketId,
      before,
      after: { stock: market.stock, demand: market.demand },
      restockedToCap: market.stock === spec.stockCap && before.stock < spec.stockCap && drift === 0 ? false : market.stock === spec.stockCap && before.stock !== spec.stockCap,
    });
  }
  return {
    ok: true,
    restocked: false,
    restockedToCap: false,
    atStrategicJumps: store.lastJumpTickAt,
    snapshots,
  };
}

export function restockOnLoadForbidden(book) {
  return book?.lastLoadRestocked !== true;
}

export function restrictionSayable(kind, extras = {}) {
  const loc = extras.locationName || extras.locationId || 'this port';
  const good = extras.good || 'this good';
  if (kind === 'embargo') {
    return extras.sayable || `Earth embargo: ${good} not sold at ${loc}. A higher bid is not a license.`;
  }
  if (kind === 'license') {
    return extras.sayable || `License required. Neutral broker on Orion can offer a costly wartime exception.`;
  }
  if (kind === 'seller_rule') {
    return extras.sayable || `Local seller refuses. Independent shop — not a pact, not imperial immunity.`;
  }
  if (kind === 'premium') {
    return extras.sayable || `Black-market premium at this neutral dock. Not an Earth yard.`;
  }
  return extras.sayable || `${good} is open at ${loc}.`;
}

export function mapServiceRefusalToKind(message) {
  const text = normalizeKey(message);
  if (!text) return null;
  return {
    allowed: false,
    kind: 'seller_rule',
    reason: 'refused',
    sayable: text,
    priceMayBypass: false,
    [FORBIDDEN_FIRE_INJECT]: undefined,
    attackId: null,
    aggression: false,
  };
}

function dealResult({ allowed, kind, sayable, price, market, extras = {} }) {
  const result = {
    allowed: allowed === true,
    kind: kind || 'open',
    reason: allowed ? 'allowed' : 'refused',
    sayable,
    price: Math.max(1, asInt(price, market?.price || PHASE8_MAGNITUDES.listPrice)),
    priceMayBypass: kind === 'premium' || kind === 'open',
    marketId: market?.marketId || null,
    locationId: market?.locationId || extras.locationId || null,
    locationName: market?.locationName || extras.locationName || null,
    good: market?.good || extras.good || null,
    local: true,
    galaxyWide: false,
    attackId: null,
    aggression: false,
    standingWrite: false,
  };
  Object.defineProperty(result, FORBIDDEN_FIRE_INJECT, { value: undefined, enumerable: false });
  return result;
}

export function evaluateCargoDeal(book, input = {}, injected = null) {
  const store = book || createMarketBook();
  const magnitudes = magnitudesOf(injected);
  const market = findMarket(store, input);
  if (!market) {
    const missing = dealResult({
      allowed: false,
      kind: 'seller_rule',
      sayable: 'No compact market covers this good here.',
      price: 0,
      extras: input,
    });
    store.lastRefuse = missing;
    return missing;
  }
  const credits = asInt(input.credits, 0);
  const offered = input.priceOffered != null ? asInt(input.priceOffered, market.price) : credits;
  const licenses = input.licenses || store.licenses || {};
  const kind = market.restriction === 'open' ? 'open' : market.restriction;

  if (kind === 'embargo') {
    const refused = dealResult({
      allowed: false,
      kind: 'embargo',
      sayable: restrictionSayable('embargo', market),
      price: offered,
      market,
    });
    store.lastRefuse = refused;
    store.lastDeal = refused;
    return refused;
  }
  if (kind === 'license') {
    const licenseId = market.licenseId || input.licenseId;
    const has = Boolean(licenseId && (licenses[licenseId] || input.hasLicense === true));
    if (!has) {
      const refused = dealResult({
        allowed: false,
        kind: 'license',
        sayable: restrictionSayable('license', market),
        price: offered,
        market,
      });
      store.lastRefuse = refused;
      store.lastDeal = refused;
      return refused;
    }
  }
  if (kind === 'seller_rule' || market.sellerWillDeal === false || input.sellerHostile === true) {
    if (kind === 'seller_rule' || market.sellerWillDeal === false || input.sellerHostile === true) {
      const refused = dealResult({
        allowed: false,
        kind: 'seller_rule',
        sayable: restrictionSayable('seller_rule', market),
        price: offered,
        market,
      });
      store.lastRefuse = refused;
      store.lastDeal = refused;
      return refused;
    }
  }
  if (kind === 'premium') {
    const price = Math.max(1, Math.round(market.price * (market.premiumMultiplier || magnitudes.premiumMultiplier)));
    const allowed = dealResult({
      allowed: true,
      kind: 'premium',
      sayable: restrictionSayable('premium', market),
      price,
      market,
    });
    store.lastDeal = allowed;
    return allowed;
  }
  const allowed = dealResult({
    allowed: true,
    kind: kind === 'license' ? 'license' : 'open',
    sayable: restrictionSayable('open', market),
    price: market.price,
    market,
  });
  store.lastDeal = allowed;
  return allowed;
}

export function higherBidCannotPermit(deal, bid) {
  if (!deal || deal.allowed) return deal;
  if (deal.kind === 'premium' || deal.kind === 'open') return deal;
  return {
    ...deal,
    allowed: false,
    reason: 'refused',
    priceMayBypass: false,
    bid: asInt(bid, 0),
    sayable: deal.sayable,
  };
}

export function grantLicense(book, licenseId) {
  const store = book || createMarketBook();
  const id = normalizeKey(licenseId);
  if (!id) return { ok: false, reason: 'missing-license' };
  store.licenses[id] = true;
  return { ok: true, licenseId: id };
}

export function hasLicense(book, licenseId) {
  return Boolean(book?.licenses?.[normalizeKey(licenseId)]);
}

export function injectWartimePorts(book, input = {}, injected = null) {
  const store = book || createMarketBook();
  if (typeof injectMarket !== 'function' || typeof store.nextMarketId !== 'number') {
    return { ok: false, reason: 'injectWartimePorts-missing' };
  }
  const good = normalizeKey(input.good, WARTIME_GOOD_DEFAULT);
  const imperial = injectMarket(store, {
    marketId: input.imperialMarketId || 'mkt-imperial-wartime',
    locationId: input.imperialLocationId || 'earth:utopia',
    locationName: input.imperialName || 'Utopia Planitia',
    systemIndex: input.imperialSystemIndex,
    faction: input.imperialFaction || 'terran',
    dockKind: 'imperial',
    good,
    stock: input.imperialStock != null ? input.imperialStock : 4,
    demand: 4,
    restriction: 'embargo',
    restrictionSayable: restrictionSayable('embargo', {
      good: `Klingon ${good}`,
      locationName: input.imperialName || 'Utopia',
    }),
    wartimeGood: true,
    sellerWillDeal: true,
  }, injected);
  const exceptionKind = input.exceptionKind === 'license' ? 'license' : 'premium';
  const neutral = injectMarket(store, {
    marketId: input.neutralMarketId || 'mkt-neutral-wartime',
    locationId: input.neutralLocationId || 'orion:black-market',
    locationName: input.neutralName || 'Orion black-market',
    systemIndex: input.neutralSystemIndex,
    faction: input.neutralFaction || 'neutral',
    dockKind: input.neutralDockKind || 'black_market',
    good,
    stock: input.neutralStock != null ? input.neutralStock : 3,
    demand: 5,
    restriction: exceptionKind,
    licenseId: input.licenseId || 'wartime-orion',
    restrictionSayable: restrictionSayable(exceptionKind, {
      good,
      locationName: input.neutralName || 'Orion black-market',
    }),
    wartimeGood: true,
    sellerWillDeal: true,
    premiumMultiplier: input.premiumMultiplier,
  }, injected);
  store.wartime = {
    active: true,
    good,
    imperialLocationIds: [imperial.market.locationId],
    exceptionLocationIds: [neutral.market.locationId],
  };
  return {
    ok: imperial.ok && neutral.ok,
    imperial: imperial.market,
    neutral: neutral.market,
    good,
    book: store,
  };
}

export function injectIndependentRestrictedMarket(book, input = {}, injected = null) {
  return injectMarket(book, {
    marketId: input.marketId || 'mkt-independent-local',
    locationId: input.locationId || 'independent:shop',
    locationName: input.locationName || 'Independent shop',
    faction: 'neutral',
    dockKind: 'independent',
    good: input.good || WARTIME_GOOD_DEFAULT,
    restriction: input.restriction || 'embargo',
    sellerWillDeal: input.sellerWillDeal,
    wartimeGood: true,
    ...input,
  }, injected);
}

export function localRuleDoesNotGoGalaxyWide(book, otherLocationId, good) {
  const other = findMarket(book, { locationId: otherLocationId, good });
  return {
    galaxyWide: false,
    otherOpen: !other || other.restriction === 'open' || other.restriction === 'premium',
    otherKind: other?.restriction || 'uncovered',
  };
}

export function wartimeExceptionSellsHull(hullId) {
  const id = Number(hullId);
  if (id === REMAN_HULL_ID) return false;
  return false;
}

export function evaluateWartimeHullOffer(hullId, extras = {}) {
  const id = Number(hullId);
  if (id === REMAN_HULL_ID || extras.isReman === true) {
    return {
      allowed: false,
      reason: extras.hasRemanAccess === true && asInt(extras.credits, 0) < asInt(extras.price, 1)
        ? 'funds'
        : extras.hasRemanAccess === true
          ? (asInt(extras.credits, 0) < asInt(extras.price, 1) ? 'funds' : 'access-locked')
          : 'access-locked',
      hullId: REMAN_HULL_ID,
      bypass: false,
      latinumException: false,
      meeting: 'meetPackPurchaseDecision',
      sayable: 'Black-market wartime exception does not sell hull 53. Reman access is an unlock, not a bid.',
    };
  }
  return {
    allowed: false,
    reason: 'not-a-cargo-deal',
    hullId: id,
    bypass: false,
    deferToWiredPurchase: true,
  };
}

export function shopStandingDelta({ currentStanding = 0, isReversal = false, writeStanding = false } = {}) {
  if (isReversal) return 0;
  if (!writeStanding) return 0;
  const cap = TRUSTED_SHOP_STANDING_CAP;
  if (asInt(currentStanding, 0) >= cap) return 0;
  return Math.min(1, cap - asInt(currentStanding, 0));
}

export function isShopReversal(lastTrade, nextTrade) {
  if (!lastTrade || !nextTrade) return false;
  return lastTrade.good === nextTrade.good
    && lastTrade.locationId === nextTrade.locationId
    && lastTrade.direction !== nextTrade.direction;
}

export function recordShopTrade(book, trade) {
  const store = book || createMarketBook();
  const row = {
    good: normalizeKey(trade?.good),
    locationId: normalizeKey(trade?.locationId),
    direction: trade?.direction === 'sell' ? 'sell' : 'buy',
    at: trade?.at || Date.now(),
  };
  const reversal = isShopReversal(store.lastShopTrade, row);
  store.lastShopTrade = row;
  return { reversal, standingDelta: shopStandingDelta({ isReversal: reversal, writeStanding: false }) };
}

export function applyShopBuy(book, input = {}, injected = null) {
  const store = book || createMarketBook();
  const market = findMarket(store, input);
  const deal = evaluateCargoDeal(store, input, injected);
  if (!deal.allowed) return { ok: false, ...deal, standingDelta: 0 };
  if (!market || market.stock <= goodSpec(store, market.good, injected).floor) {
    const empty = dealResult({
      allowed: false,
      kind: market?.restriction || 'seller_rule',
      sayable: `No ${market?.good || 'cargo'} stock at ${market?.locationName || 'this port'}.`,
      price: deal.price,
      market,
    });
    store.lastRefuse = empty;
    return { ok: false, ...empty, standingDelta: 0 };
  }
  const credits = asInt(input.credits, deal.price);
  if (credits < deal.price) {
    return {
      ok: false,
      allowed: false,
      kind: deal.kind,
      reason: 'funds',
      sayable: `Need ${deal.price} latinum for ${market.good}. A higher standing is not money.`,
      price: deal.price,
      standingDelta: 0,
    };
  }
  market.stock = Math.max(goodSpec(store, market.good, injected).floor, market.stock - 1);
  const shop = recordShopTrade(store, { good: market.good, locationId: market.locationId, direction: 'buy' });
  return {
    ok: true,
    allowed: true,
    kind: deal.kind,
    reason: 'allowed',
    sayable: deal.sayable,
    price: deal.price,
    stock: market.stock,
    demand: market.demand,
    standingDelta: shop.standingDelta,
    reversal: shop.reversal,
    market,
  };
}

export function applyShopSell(book, input = {}, injected = null) {
  const store = book || createMarketBook();
  const market = findMarket(store, input);
  if (!market) {
    return { ok: false, allowed: false, reason: 'missing-market', standingDelta: 0 };
  }
  const deal = evaluateCargoDeal(store, { ...input, marketId: market.marketId }, injected);
  if (!deal.allowed && deal.kind !== 'premium' && deal.kind !== 'open' && deal.kind !== 'license') {
    return { ok: false, ...deal, standingDelta: 0 };
  }
  if (!deal.allowed) return { ok: false, ...deal, standingDelta: 0 };
  const spec = goodSpec(store, market.good, injected);
  const next = market.stock + 1;
  market.stock = clampInt(next, spec.floor, spec.stockCap);
  const shop = recordShopTrade(store, { good: market.good, locationId: market.locationId, direction: 'sell' });
  return {
    ok: true,
    allowed: true,
    kind: deal.kind,
    price: deal.price,
    stock: market.stock,
    demand: market.demand,
    standingDelta: shop.standingDelta,
    reversal: shop.reversal,
    saturated: next > spec.stockCap,
    market,
  };
}

export function creditWorthwhileTrip(book, token, applyFn) {
  const store = book || createMarketBook();
  const key = normalizeKey(token);
  if (!key) return { paid: false, reason: 'missing-token' };
  if (store.tripTokens[key]) return { paid: false, reason: 'already-credited', once: true };
  store.tripTokens[key] = { at: Date.now() };
  let applied = null;
  if (typeof applyFn === 'function') applied = applyFn();
  return { paid: true, once: true, applied };
}

export function boundTravelSalvage(book, amount, injected = null) {
  const store = book || createMarketBook();
  const magnitudes = magnitudesOf(injected);
  const cap = asInt(magnitudes.salvageLatinumCap, 0);
  const already = asInt(store.jumpFarm.salvagePaid, 0);
  const want = Math.max(0, asInt(amount, 0));
  const paid = Math.max(0, Math.min(want, Math.max(0, cap - already)));
  store.jumpFarm.salvagePaid = already + paid;
  return { paid, bounded: true, remaining: Math.max(0, cap - store.jumpFarm.salvagePaid), attackerId: null };
}

export function boundTransportLatinum(book, amount, injected = null) {
  const store = book || createMarketBook();
  const magnitudes = magnitudesOf(injected);
  const cap = asInt(magnitudes.transportLatinumCap, 0);
  const already = asInt(store.jumpFarm.transportPaid, 0);
  const want = Math.max(0, asInt(amount, 0));
  const paid = Math.max(0, Math.min(want, Math.max(0, cap - already)));
  store.jumpFarm.transportPaid = already + paid;
  return { paid, bounded: true, remaining: Math.max(0, cap - store.jumpFarm.transportPaid) };
}

export function jumpMustNotReprintInfinity(book, beforeSnapshot = {}) {
  const after = listMarkets(book).map((row) => ({
    marketId: row.marketId,
    stock: row.stock,
    demand: row.demand,
  }));
  const restocked = (beforeSnapshot.markets || []).some((row) => {
    const now = after.find((item) => item.marketId === row.marketId);
    const spec = goodSpec(book, row.good || now?.good);
    return now && row.stock < spec.stockCap && now.stock === spec.stockCap && row.stock !== now.stock;
  });
  return {
    restockedToCap: restocked === true,
    freeEscorts: false,
    freeGarrison: false,
    freeRepair: false,
    freeRefuel: false,
  };
}

export function evaluateDockService(holding, kind, { baseCost = 1, injected = null } = {}) {
  const magnitudes = magnitudesOf(injected);
  if (!holding || holding.lost) {
    return { allowed: true, price: Math.max(0, asInt(baseCost, 1)), reason: 'no-holding', refuse: false };
  }
  if (holding.supply?.met !== true) {
    if (kind === 'repair' || kind === 'refuel') {
      return {
        allowed: false,
        price: Math.max(1, asInt(baseCost, 1) * asInt(magnitudes.repairPremiumWithoutSupply, 2)),
        reason: 'supply-unmet',
        refuse: true,
        sayable: 'Holding supply unmet. Repair and refuel refuse here until the obligation is met.',
      };
    }
    return {
      allowed: true,
      price: Math.max(1, asInt(baseCost, 1) * asInt(magnitudes.repairPremiumWithoutSupply, 2)),
      reason: 'supply-premium',
      refuse: false,
    };
  }
  return { allowed: true, price: Math.max(0, asInt(baseCost, 1)), reason: 'supply-met', refuse: false };
}

export function createHoldingObligations(input = {}, injected = null) {
  const magnitudes = magnitudesOf(injected);
  const lanes = {};
  for (const lane of OBLIGATION_LANES) {
    const src = input[lane] && typeof input[lane] === 'object' ? input[lane] : {};
    lanes[lane] = { met: src.met === true || input[lane] === true };
  }
  return {
    holdingId: normalizeKey(input.holdingId) || 'hld-pending',
    systemIndex: asInt(input.systemIndex, 0),
    locationId: normalizeKey(input.locationId, locationIdForSystem(input.systemIndex, input.locationName)),
    locationName: normalizeKey(input.locationName, input.locationId || `system:${input.systemIndex}`),
    ...lanes,
    graceJumpsRemaining: input.graceJumpsRemaining != null
      ? Math.max(0, asInt(input.graceJumpsRemaining, 0))
      : magnitudes.holdingGraceJumps,
    incomePaid: Math.max(0, asInt(input.incomePaid, 0)),
    neglectedJumps: Math.max(0, asInt(input.neglectedJumps, 0)),
    lastPenalty: input.lastPenalty || null,
    unrestCalled: input.unrestCalled === true,
    lost: input.lost === true,
    recovered: input.recovered === true,
    navySpawned: false,
  };
}

export function serializeHoldingObligations(holding) {
  return holding ? clone(sanitizeHolding(holding) || holding) : null;
}

export function mintHoldingOnClaim(book, input = {}, injected = null) {
  const store = book || createMarketBook();
  if (typeof store.nextHoldingId !== 'number') {
    return { ok: false, reason: 'mintHolding-missing' };
  }
  const existing = listHoldings(store).find((row) => Number(row.systemIndex) === Number(input.systemIndex) && !row.lost);
  if (existing && input.remint !== true) {
    existing.lost = false;
    return { ok: true, holding: existing, already: true };
  }
  const holding = createHoldingObligations({
    ...input,
    holdingId: input.holdingId || takeHoldingId(store),
  }, injected);
  store.holdings[holding.holdingId] = holding;
  return { ok: true, holding, book: store };
}

export function listHoldings(book) {
  return Object.values(book?.holdings || {});
}

export function getHoldingForSystem(book, systemIndex) {
  return listHoldings(book).find((row) => Number(row.systemIndex) === Number(systemIndex)) || null;
}

export function obligationsMet(holding) {
  if (!holding) return false;
  return OBLIGATION_LANES.every((lane) => holding[lane]?.met === true);
}

export function setObligations(holding, flags = {}) {
  if (!holding) return { ok: false, reason: 'missing-holding' };
  for (const lane of OBLIGATION_LANES) {
    if (flags[lane] != null) {
      if (!holding[lane]) holding[lane] = { met: false };
      holding[lane].met = flags[lane] === true;
    }
  }
  if (flags.all === true) {
    for (const lane of OBLIGATION_LANES) holding[lane] = { met: true };
  }
  if (obligationsMet(holding)) {
    holding.recovered = true;
    holding.lastPenalty = null;
  }
  return { ok: true, holding, met: obligationsMet(holding) };
}

export function evaluateHoldingIncome(holding, injected = null) {
  const magnitudes = magnitudesOf(injected);
  if (!holding || holding.lost) {
    return { income: 0, reason: holding?.lost ? 'lost' : 'missing', capped: true };
  }
  const remaining = Math.max(0, magnitudes.holdingIncomeCap - asInt(holding.incomePaid, 0));
  if (remaining <= 0) {
    return { income: 0, reason: 'cap', capped: true };
  }
  const met = obligationsMet(holding);
  const grace = asInt(holding.graceJumpsRemaining, 0) > 0;
  if (!met && !grace) {
    return { income: 0, reason: 'neglected', capped: true };
  }
  const pay = Math.min(magnitudes.holdingIncomeWhenMet, remaining);
  return { income: pay, reason: met ? 'met' : 'grace', capped: pay >= remaining };
}

export function applyHoldingIncome(book, holding, injected = null) {
  const verdict = evaluateHoldingIncome(holding, injected);
  if (!holding) return verdict;
  holding.incomePaid = asInt(holding.incomePaid, 0) + verdict.income;
  if (book) book.lastIncome = { holdingId: holding.holdingId, ...verdict };
  return { ...verdict, incomePaid: holding.incomePaid };
}

export function neglectSayable(holding) {
  const name = holding?.locationName || holding?.locationId || 'this holding';
  return `Holding ${name} neglected: garrison, supply, reconstruction, and stabilization are unmet. Income paused. No free navy. Save intact.`;
}

export function applyHoldingNeglect(book, holding, { unrestWriter, systemIndex } = {}) {
  const store = book || createMarketBook();
  if (!holding) return { ok: false, reason: 'missing-holding', wiped: false, navySpawned: false };
  holding.neglectedJumps = asInt(holding.neglectedJumps, 0) + 1;
  holding.lastPenalty = neglectSayable(holding);
  store.lastPenalty = holding.lastPenalty;
  let unrestCalled = false;
  if (typeof unrestWriter === 'function') {
    unrestWriter(systemIndex != null ? systemIndex : holding.systemIndex, {
      cause: 'blockade',
      source: 'holding-neglect',
    });
    unrestCalled = true;
    holding.unrestCalled = true;
    store.unrestCalls.push({
      holdingId: holding.holdingId,
      writer: 'raiseUnrestFromCommerceFailure',
    });
  }
  return {
    ok: true,
    wiped: false,
    navySpawned: false,
    sayable: holding.lastPenalty,
    unrestCalled,
    neglectedJumps: holding.neglectedJumps,
    income: 0,
  };
}

export function applyHoldingJumpTick(book, { atStrategicJumps = 0, unrestWriter, injected = null } = {}) {
  const store = book || createMarketBook();
  const results = [];
  for (const holding of listHoldings(store)) {
    if (holding.lost) {
      results.push({ holdingId: holding.holdingId, income: 0, lost: true });
      continue;
    }
    if (holding.graceJumpsRemaining > 0) holding.graceJumpsRemaining -= 1;
    const income = applyHoldingIncome(store, holding, injected);
    if (!obligationsMet(holding) && holding.graceJumpsRemaining <= 0) {
      results.push({
        holdingId: holding.holdingId,
        ...applyHoldingNeglect(store, holding, { unrestWriter, systemIndex: holding.systemIndex }),
        income: income.income,
        atStrategicJumps,
      });
    } else {
      results.push({ holdingId: holding.holdingId, ...income, neglected: false, atStrategicJumps });
    }
  }
  return { ok: true, results, freeNavy: false };
}

export function markHoldingLost(book, systemIndex) {
  const holding = getHoldingForSystem(book, systemIndex);
  if (!holding) return { ok: true, missing: true, remanTouched: false };
  holding.lost = true;
  holding.recovered = false;
  return { ok: true, holding, remanTouched: false, overrideErased: false };
}

export function recoverHolding(book, holding, path = 'restabilize', injected = null) {
  const store = book || createMarketBook();
  if (!holding) return { ok: false, reason: 'missing-holding', remanCheat: false };
  holding.lost = false;
  setObligations(holding, { all: true });
  holding.neglectedJumps = 0;
  holding.lastPenalty = null;
  holding.recovered = true;
  store.recoveredPaths.push({ holdingId: holding.holdingId, path, remanCheat: false, moneyCheat: false });
  return {
    ok: true,
    holding,
    path,
    remanCheat: false,
    moneyCheat: false,
    durableUnlockRewritten: false,
    magnitudes: magnitudesOf(injected),
  };
}

export function plantFlagDoesNotGrantMarketTrust() {
  return { catalogStanding: false, imperialMarketOpened: false, trustExemption: false };
}

export function evaluateFleetUpkeep(board, { parkedShipIds = [], injected = null } = {}) {
  const magnitudes = magnitudesOf(injected);
  const parked = Array.isArray(parkedShipIds) ? parkedShipIds.filter(Boolean) : [];
  const charge = parked.length * asInt(magnitudes.fleetUpkeepPerParked, 1);
  const readinessDrop = parked.length ? asInt(magnitudes.readinessDropPerJump, 8) : 0;
  const kinds = [];
  for (const order of Object.values(board?.orders || {})) {
    kinds.push({ orderId: order.orderId, kind: order.kind, status: order.status });
  }
  return {
    charge,
    readinessDrop,
    parkedCount: parked.length,
    orderKindsUnchanged: true,
    superseded: false,
    kinds,
  };
}

export function applyFleetUpkeep(book, board, { parkedShipIds = [], injected = null } = {}) {
  const store = book || createMarketBook();
  const beforeKinds = Object.fromEntries(
    Object.values(board?.orders || {}).map((row) => [row.orderId, { kind: row.kind, status: row.status }]),
  );
  const verdict = evaluateFleetUpkeep(board, { parkedShipIds, injected });
  store.upkeepCharged = asInt(store.upkeepCharged, 0) + verdict.charge;
  for (const id of parkedShipIds || []) {
    const current = asInt(store.fleetReadiness[id], 100);
    store.fleetReadiness[id] = Math.max(0, current - verdict.readinessDrop);
  }
  const afterKinds = Object.values(board?.orders || {}).every((row) => (
    beforeKinds[row.orderId]?.kind === row.kind && beforeKinds[row.orderId]?.status === row.status
  ));
  return {
    ...verdict,
    orderKindsUnchanged: afterKinds,
    superseded: false,
    upkeepCharged: store.upkeepCharged,
    readiness: { ...store.fleetReadiness },
  };
}

export function upkeepMustNotSupersedeOrder(order) {
  return order?.kind === order?.kind && order?.status !== 'superseded';
}

export function cheaperHullStillUseful({ cheaperCanTake = true, capitalBlockedReason = 'upkeep' } = {}) {
  return {
    cheaperCanTake: cheaperCanTake === true,
    capitalBlocked: Boolean(capitalBlockedReason),
    reason: capitalBlockedReason,
    magicPrices: false,
  };
}

export function evaluateJobEligibility(hull, job = {}) {
  const hullId = Number(hull?.id ?? hull);
  const capital = hull?.capital === true || hull?.class === 'capital' || job.capitalHullIds?.includes(hullId);
  if (job.requiresLicense && !job.hasLicense && capital) {
    return { allowed: false, reason: 'license', cheaperUseful: true };
  }
  if (job.stockClass && job.stockClass !== (hull?.stockClass || (capital ? 'capital' : 'light'))) {
    return { allowed: false, reason: 'stock', cheaperUseful: true };
  }
  if (job.upkeepBlocksCapital && capital) {
    return { allowed: false, reason: 'upkeep', cheaperUseful: true };
  }
  return { allowed: true, reason: 'allowed', cheaperUseful: true };
}

export function embargoNoticeStandingWrite() {
  return { standingWrite: false, doubleStanding: false, attackId: null, aggression: false };
}

export function phase5OutcomesUntouched() {
  return {
    overdueIsDestroyed: false,
    overdueHasAttacker: false,
    subscribeOnly: PHASE5_SUBSCRIBE_ONLY,
    catalogRewritten: false,
    remanMeeting: 'meetPackPurchaseDecision',
    secondReman: false,
  };
}

export function cultureFireFromMarketForbidden(deal) {
  return deal?.[FORBIDDEN_FIRE_INJECT] == null && deal?.attackId == null;
}

export function independentStandingIsNotImmunity(neutralStanding, deal) {
  if (!deal) return { immune: false, pact: false };
  const skip = asInt(neutralStanding, 0) >= TRUSTED_SHOP_STANDING_CAP && deal.kind === 'embargo';
  return {
    immune: false,
    pact: false,
    embargoStillRefused: deal.kind === 'embargo' ? deal.allowed === false : true,
    trustedDoesNotLiftEmbargo: !skip || deal.allowed === false,
  };
}

export function lastRefuseKind(book) {
  return book?.lastRefuse?.kind || null;
}
