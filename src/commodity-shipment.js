/**
 * S35 — commodity and shipment book.
 *
 * Source of truth:
 * - docs/commodity-shipment/BM1-COMMODITY-SHIPMENT-BOOK-PROPOSAL.md
 * - docs/commodity-shipment/BM1-COMMODITY-SHIPMENT-ENGINE-DEPENDENCIES.md
 *
 * Sibling book beside worldCargoBook. A commodity entry is a name. A shipment
 * record indexes an existing contract. This module does not complete freight,
 * write standing, or sell prize goods. Sell-back takes the player's
 * book-bought lot. COMMODITY_SHIPMENT_LOCKED_FROM_REMASTERED stays false.
 */

import { regionAllows } from '../bm-ships/catalog.mjs';
import { tractorIsBoarding } from './phase9-ew.js';
import {
  PER_TON_SETTLE_DEFAULTS,
  PHASE8_MAGNITUDES,
  evaluateCargoDeal,
  goodSpec,
  postMovePrice,
  premiumCharge,
  restoreGoodContraband,
  settleMarketTons,
} from './phase8-markets.js';

export const COMMODITY_SHIPMENT_VERSION = 1;
export const COMMODITY_SHIPMENT_LOCKED_FROM_REMASTERED = false;

export const COMMODITY_SHIPMENT_CONFIG = Object.freeze({
  rowCap: 8,
  recoveryStep: 1,
  priceStep: PER_TON_SETTLE_DEFAULTS.priceStep,
  priceFloor: PER_TON_SETTLE_DEFAULTS.priceFloor,
  priceCap: PER_TON_SETTLE_DEFAULTS.priceCap,
});

const PAYABLE_KEYS = ['latinum', 'credits', 'legalPayout', 'covertReward', 'payout', 'price', 'stock', 'demand'];

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function asInt(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function configOf(config) {
  return { ...COMMODITY_SHIPMENT_CONFIG, ...(config && typeof config === 'object' ? config : {}) };
}

function settleInject(config) {
  const cfg = configOf(config);
  return {
    priceStep: cfg.priceStep,
    priceFloor: Math.max(1, cfg.priceFloor),
    priceCap: Math.max(1, cfg.priceCap),
  };
}

function emptyPodShape(pod) {
  pod.tons = 0;
  pod.item = 'Nothing';
  pod.destination = undefined;
  pod.payout = 0;
  delete pod.destinationIndex;
  delete pod.contractId;
  delete pod.targetIndex;
  delete pod.targetName;
  delete pod.bookLotId;
  delete pod.bookSaleId;
}

function cargoUsed(pods) {
  return (pods || []).reduce((sum, pod) => sum + Math.max(0, asInt(pod?.tons, 0)), 0);
}

function findEmptySlot(pods) {
  return (pods || []).find((pod) => pod && (!pod.tons || pod.item === 'Nothing')) || null;
}

function pushNotice(book, line) {
  const text = String(line || '').trim();
  if (!text) return;
  if (!Array.isArray(book.notices)) book.notices = [];
  book.notices.push(text);
  if (book.notices.length > 6) book.notices.splice(0, book.notices.length - 6);
  book.lastNotice = text;
}

function takeSeq(book) {
  const n = Math.max(1, asInt(book.nextSeq, 1));
  book.nextSeq = n + 1;
  return n;
}

function issueSaleId(book) {
  const id = Math.max(1, asInt(book.nextSaleId, 1));
  book.nextSaleId = id + 1;
  return id;
}

/** An issued id that is no longer in sales has been consumed. There is no fifth map. */
function saleIsConsumed(book, saleId) {
  const id = asInt(saleId, 0);
  if (id <= 0) return false;
  if (book?.sales && Object.prototype.hasOwnProperty.call(book.sales, String(id))) return false;
  return id < asInt(book?.nextSaleId, 1);
}

function trimOldest(map, cap, keep) {
  const rows = Object.values(map || {});
  if (rows.length <= cap) return;
  const droppable = rows.filter((row) => !keep || !keep(row)).sort((a, b) => asInt(a.seq, 0) - asInt(b.seq, 0));
  let extra = rows.length - cap;
  for (const row of droppable) {
    if (extra <= 0) break;
    const key = [row.id, row.lotId, row.saleId, row.name].find((candidate) => (
      candidate != null && Object.prototype.hasOwnProperty.call(map, String(candidate))
    ));
    if (key != null) {
      delete map[String(key)];
      extra -= 1;
    }
  }
}

function trimShipments(shipments, cap) {
  const rows = Object.values(shipments || {});
  if (rows.length <= cap) return;
  const droppable = rows
    .filter((row) => row.worldCargoStatus === 'delivered' || row.worldCargoStatus === 'expired')
    .sort((a, b) => asInt(a.seq, 0) - asInt(b.seq, 0));
  let extra = rows.length - cap;
  for (const row of droppable) {
    if (extra <= 0) break;
    delete shipments[row.id];
    extra -= 1;
  }
}

function saleLotHeld(sale, pods) {
  return Array.isArray(pods) && pods.some((pod) => podTaggedForSale(pod, sale));
}

function lotIsAboard(lot, pods) {
  if (!lot || !Array.isArray(pods)) return false;
  if (lot.source === 'book-bought' || lot.saleId != null) {
    return pods.some((pod) => String(pod.bookLotId ?? '') === String(lot.lotId) && asInt(pod.tons, 0) > 0);
  }
  if (lot.source === 'contract') {
    const id = String(lot.lotId || '').replace(/^contract:/, '');
    return pods.some((pod) => String(pod.contractId ?? '') === id && asInt(pod.tons, 0) > 0);
  }
  return pods.some((pod, index) => (
    (`pod:${index}` === String(lot.lotId) || String(pod.bookLotId ?? '') === String(lot.lotId))
    && pod?.item === lot.good
    && asInt(pod.tons, 0) > 0
    && !pod.bookSaleId
  ));
}

function enforceCaps(book, config, pods) {
  const cap = Math.max(1, asInt(configOf(config).rowCap, COMMODITY_SHIPMENT_CONFIG.rowCap));
  trimOldest(book.commodities, cap);
  trimShipments(book.shipments, cap);
  const keepLot = Array.isArray(pods) ? (row) => lotIsAboard(row, pods) : null;
  trimOldest(book.lots, cap, keepLot);
  trimOldest(book.sales, cap, Array.isArray(pods) ? (row) => saleLotHeld(row, pods) : null);
  book.rowCap = cap;
}

function stripPayable(row) {
  const copy = { ...row };
  for (const key of PAYABLE_KEYS) delete copy[key];
  return copy;
}

export function emptyCommodityShipmentBook() {
  return {
    version: COMMODITY_SHIPMENT_VERSION,
    lockedFromRemastered: false,
    nextSaleId: 1,
    nextSeq: 1,
    selectedId: null,
    commodities: {},
    shipments: {},
    lots: {},
    sales: {},
    notices: [],
    lastNotice: '',
  };
}

export function serializeCommodityShipmentBook(book) {
  const source = book && book.version === COMMODITY_SHIPMENT_VERSION ? book : emptyCommodityShipmentBook();
  return {
    version: COMMODITY_SHIPMENT_VERSION,
    lockedFromRemastered: false,
    nextSaleId: Math.max(1, asInt(source.nextSaleId, 1)),
    nextSeq: Math.max(1, asInt(source.nextSeq, 1)),
    selectedId: source.selectedId ?? null,
    commodities: source.commodities || {},
    shipments: source.shipments || {},
    lots: source.lots || {},
    sales: source.sales || {},
  };
}

function podTaggedForSale(pod, sale) {
  if (!pod || !sale) return false;
  return String(pod.bookSaleId ?? '') === String(sale.saleId)
    && String(pod.bookLotId ?? '') === String(sale.lotId)
    && pod.item === sale.good
    && asInt(pod.tons, 0) >= asInt(sale.tons, 0)
    && asInt(sale.tons, 0) > 0;
}

export function restoreCommodityShipmentBook(saved, context = {}) {
  if (!asObject(saved)) return emptyCommodityShipmentBook();
  const book = emptyCommodityShipmentBook();
  const cap = Math.max(1, asInt(context.rowCap, COMMODITY_SHIPMENT_CONFIG.rowCap));
  book.selectedId = saved.selectedId == null ? null : String(saved.selectedId);
  let maxIssued = 0;
  delete book.consumedSaleIds;
  let maxSeq = 0;
  for (const [key, row] of Object.entries(asObject(saved.commodities) || {})) {
    const source = asObject(row);
    if (!source) continue;
    const name = String(source.name || key || '').trim();
    if (!name || name === 'Nothing') continue;
    const seq = asInt(source.seq, 0) || takeSeq(book);
    maxSeq = Math.max(maxSeq, seq);
    book.commodities[name] = {
      name,
      seenOn: source.seenOn === 'contract' ? 'contract' : 'pod',
      firstSeenAtStrategicJumps: asInt(source.firstSeenAtStrategicJumps, 0),
      seq,
    };
  }
  for (const [key, row] of Object.entries(asObject(saved.shipments) || {})) {
    const source = asObject(row);
    if (!source) continue;
    const id = String(source.id || source.contractId || key || '').trim();
    if (!id) continue;
    const seq = asInt(source.seq, 0) || takeSeq(book);
    maxSeq = Math.max(maxSeq, seq);
    const status = source.worldCargoStatus === 'delivered' || source.worldCargoStatus === 'expired' || source.worldCargoStatus === 'open'
      ? source.worldCargoStatus
      : null;
    book.shipments[id] = {
      id,
      contractId: id,
      good: String(source.good || ''),
      tons: asInt(source.tons, 0),
      originIndex: source.originIndex == null ? null : asInt(source.originIndex, null),
      targetIndex: source.targetIndex == null ? null : asInt(source.targetIndex, null),
      targetName: String(source.targetName || ''),
      worldCargoStatus: status,
      mode: source.mode === 'open' || source.mode === 'covert' ? source.mode : null,
      lastAttemptReason: source.lastAttemptReason ? String(source.lastAttemptReason) : null,
      inWorldCargoBook: source.inWorldCargoBook === true,
      seq,
    };
  }
  for (const [key, row] of Object.entries(asObject(saved.lots) || {})) {
    const source = asObject(row);
    if (!source) continue;
    const lotId = String(source.lotId || key || '').trim();
    if (!lotId) continue;
    const sourceTag = source.source === 'book-bought' || source.source === 'contract' || source.source === 'pod'
      ? source.source
      : 'pod';
    const seq = asInt(source.seq, 0) || takeSeq(book);
    maxSeq = Math.max(maxSeq, seq);
    book.lots[lotId] = {
      lotId,
      good: String(source.good || ''),
      source: sourceTag,
      contraband: restoreGoodContraband(source.good, source.contraband === true),
      saleId: source.saleId == null ? null : asInt(source.saleId, null),
      seq,
    };
  }
  const pods = Array.isArray(context.pods) ? context.pods : null;
  for (const [key, row] of Object.entries(asObject(saved.sales) || {})) {
    const source = asObject(row);
    if (!source || source.soldByBook !== true) continue;
    const saleId = asInt(source.saleId ?? key, 0);
    if (!saleId) continue;
    maxIssued = Math.max(maxIssued, saleId);
    const sale = {
      saleId,
      lotId: String(source.lotId || ''),
      good: String(source.good || ''),
      tons: asInt(source.tons, 0),
      soldByBook: true,
      seq: asInt(source.seq, 0) || takeSeq(book),
    };
    maxSeq = Math.max(maxSeq, sale.seq);
    if (pods && !pods.some((pod) => podTaggedForSale(pod, sale))) continue;
    book.sales[String(saleId)] = sale;
  }
  let maxPodSale = 0;
  for (const pod of pods || []) {
    maxPodSale = Math.max(maxPodSale, asInt(pod?.bookSaleId, 0));
  }
  const savedNext = Math.max(1, asInt(saved.nextSaleId, 1));
  book.nextSaleId = Math.max(savedNext, maxIssued + 1, maxPodSale + 1);
  book.nextSeq = Math.max(asInt(saved.nextSeq, 1), maxSeq + 1, book.nextSeq);
  book.lockedFromRemastered = false;
  enforceCaps(book, { rowCap: cap }, pods);
  book.notices = [];
  book.lastNotice = '';
  return stripPayable(book) && book;
}

export function selectCommodityShipment(book, id) {
  const store = book && book.commodities ? book : emptyCommodityShipmentBook();
  store.selectedId = id == null ? null : String(id);
  store.lockedFromRemastered = false;
  return store;
}

function blockedName(input, name) {
  const list = input?.notCommodities;
  if (!list) return false;
  if (typeof list.has === 'function') return list.has(name);
  return Array.isArray(list) && list.includes(name);
}

function upsertCommodity(book, name, seenOn, strategicJumps, input = {}) {
  const key = String(name || '').trim();
  if (!key || key === 'Nothing' || blockedName(input, key)) return;
  const existing = book.commodities[key];
  if (existing) {
    if (seenOn === 'pod') existing.seenOn = 'pod';
    return;
  }
  book.commodities[key] = {
    name: key,
    seenOn: seenOn === 'contract' ? 'contract' : 'pod',
    firstSeenAtStrategicJumps: asInt(strategicJumps, 0),
    seq: takeSeq(book),
  };
}

function contractRows(openContracts, worldCargoBook) {
  const rows = new Map();
  for (const contract of openContracts || []) {
    if (!contract || contract.id == null) continue;
    rows.set(String(contract.id), { contract, world: null });
  }
  const contracts = asObject(worldCargoBook?.contracts) || {};
  for (const [key, world] of Object.entries(contracts)) {
    if (!world) continue;
    const id = String(world.id || key);
    const existing = rows.get(id);
    rows.set(id, { contract: existing?.contract || world, world });
  }
  return rows;
}

export function indexCommodityShipment(book, input = {}) {
  const store = book && book.version === COMMODITY_SHIPMENT_VERSION ? book : emptyCommodityShipmentBook();
  store.lockedFromRemastered = false;
  const jumps = asInt(input.strategicJumps, 0);
  const pods = Array.isArray(input.pods) ? input.pods : [];
  const seenNames = new Set();
  pods.forEach((pod, index) => {
    if (!pod || asInt(pod.tons, 0) <= 0 || !pod.item || pod.item === 'Nothing') return;
    if (blockedName(input, pod.item)) return;
    seenNames.add(pod.item);
    upsertCommodity(store, pod.item, 'pod', jumps, input);
    if (pod.bookLotId && store.lots[pod.bookLotId]) return;
    if (pod.bookSaleId) return;
    const lotId = `pod:${index}`;
    const existing = store.lots[lotId];
    store.lots[lotId] = {
      lotId,
      good: pod.item,
      source: 'pod',
      contraband: existing?.contraband === true || pod.contraband === true,
      saleId: null,
      seq: existing?.seq || takeSeq(store),
    };
  });
  const rows = contractRows(input.openContracts, input.worldCargoBook);
  const liveShipmentIds = new Set();
  for (const [id, packed] of rows) {
    const contract = packed.contract || {};
    const world = packed.world;
    const good = String((world && world.good) || contract.goods || contract.good || '');
    if (good && !blockedName(input, good)) {
      seenNames.add(good);
      upsertCommodity(store, good, pods.some((pod) => pod?.item === good && asInt(pod.tons, 0) > 0) ? 'pod' : 'contract', jumps, input);
    }
    const previous = store.shipments[id];
    const shipmentCap = Math.max(1, asInt(configOf(input.config).rowCap, COMMODITY_SHIPMENT_CONFIG.rowCap));
    const shipmentRows = Object.values(store.shipments);
    const everyRowOpen = shipmentRows.length >= shipmentCap && shipmentRows.every((row) => (
      row.worldCargoStatus !== 'delivered' && row.worldCargoStatus !== 'expired'
    ));
    if (!previous && everyRowOpen) {
      const line = 'Shipment book is full. Every row is still open. This shipment was not indexed.';
      if (store.lastNotice !== line) pushNotice(store, line);
      continue;
    }
    liveShipmentIds.add(id);
    store.shipments[id] = {
      id,
      contractId: id,
      good,
      tons: asInt((world && world.tons) ?? contract.tons, 0),
      originIndex: contract.originIndex ?? world?.originIndex ?? null,
      targetIndex: contract.targetIndex ?? world?.targetIndex ?? null,
      targetName: String(contract.targetName || world?.targetName || ''),
      worldCargoStatus: world ? (world.status === 'delivered' || world.status === 'expired' ? world.status : 'open') : null,
      mode: world && (world.mode === 'covert' || world.mode === 'open') ? world.mode : null,
      lastAttemptReason: world?.lastAttempt?.reason ? String(world.lastAttempt.reason) : null,
      inWorldCargoBook: Boolean(world),
      seq: previous?.seq || takeSeq(store),
    };
    const lotId = `contract:${id}`;
    const existingLot = store.lots[lotId];
    store.lots[lotId] = {
      lotId,
      good,
      source: 'contract',
      contraband: contract.contraband === true || world?.contraband === true,
      saleId: null,
      seq: existingLot?.seq || takeSeq(store),
    };
  }
  for (const id of Object.keys(store.shipments)) {
    if (!liveShipmentIds.has(id)) delete store.shipments[id];
  }
  for (const [lotId, lot] of Object.entries(store.lots)) {
    if (lot.source === 'book-bought') continue;
    if (lot.source === 'pod' && !pods.some((pod, index) => `pod:${index}` === lotId && pod?.item === lot.good && asInt(pod.tons, 0) > 0 && !pod.bookSaleId)) {
      delete store.lots[lotId];
    }
    if (lot.source === 'contract' && !liveShipmentIds.has(String(lotId).replace(/^contract:/, ''))) {
      delete store.lots[lotId];
    }
  }
  for (const name of Object.keys(store.commodities)) {
    if (!seenNames.has(name)) delete store.commodities[name];
  }
  enforceCaps(store, input.config, pods);
  return store;
}

function tradeRefusalNotice(reason) {
  if (reason === 'missing-scope') return 'Trade refused. This market has no dominion scope. The market did not move.';
  if (reason === 'missing-region') return 'Trade refused. This world has no known region. The market did not move.';
  return 'Dominion trade is closed at this world.';
}

export function dominionTradeAllowed(context = {}) {
  const scope = context?.availabilityRegion || context?.scope || null;
  if (!scope) {
    return {
      allowed: false,
      refused: true,
      reason: context?.worldRegionMissing === true ? 'missing-region' : 'missing-scope',
      roeModesUnchanged: true,
      offersProtectAll: false,
      engagement_authorized: false,
    };
  }
  const allowed = regionAllows({ availabilityRegion: scope }, {
    systemName: context.systemName,
    region: context.region,
    role: context.role || 'traffic',
    authorizedDeployment: context.authorizedDeployment === true,
    vendor: context.vendor,
    controller: context.controller,
  }) === true;
  return {
    allowed,
    refused: !allowed,
    reason: allowed ? 'region-allows' : 'region-refused',
    roeModesUnchanged: true,
    offersProtectAll: false,
    engagement_authorized: false,
  };
}

function refuseTrade(book, reason, notice) {
  const line = String(notice || reason || 'Trade refused. The market did not move.');
  pushNotice(book, line);
  return {
    ok: false,
    paid: 0,
    reason,
    book,
    latinumDelta: 0,
    logBand: null,
    logLine: line,
    cultureFire: false,
    firingSolution: false,
    engagement_authorized: false,
  };
}

function tonPhrase(count) {
  const n = Math.max(0, asInt(count, 0));
  return n === 1 ? '1 ton' : `${n} tons`;
}

function dealBook(market, input) {
  const store = input.marketBook;
  if (store?.markets && (store.markets[market.marketId] || Object.values(store.markets).includes(market))) {
    return store;
  }
  return {
    markets: { [market.marketId]: market },
    licenses: input.licenses && typeof input.licenses === 'object' ? input.licenses : {},
    goods: {},
  };
}

/** Same deal inputs the shop passes to evaluateCargoDeal. Price is not a ban bypass. */
function evaluateBookDeal(market, input, injected) {
  const dealInput = {
    marketId: market.marketId,
    good: market.good,
    credits: input.credits,
    hasLicense: input.hasLicense,
    licenseId: input.licenseId,
    sellerHostile: input.sellerHostile,
  };
  if (input.licenses) dealInput.licenses = input.licenses;
  return evaluateCargoDeal(dealBook(market, input), dealInput, injected);
}

function chargeTons(settled, market, injected) {
  const prices = (settled.prices || []).map((price) => premiumCharge(price, market, injected));
  const paid = prices.reduce((sum, amount) => sum + amount, 0);
  return { ...settled, prices, paid };
}

function tradeLine(verb, tons, good, paid, deal) {
  const premium = deal?.kind === 'premium' && deal.sayable ? ` ${deal.sayable}` : '';
  return `${verb} ${tonPhrase(tons)} of ${good} for ${paid} latinum.${premium}`;
}

export function buyCommodityLot(book, input = {}) {
  const store = book && book.version === COMMODITY_SHIPMENT_VERSION ? book : emptyCommodityShipmentBook();
  store.lockedFromRemastered = false;
  const access = dominionTradeAllowed(input.dominion || {});
  if (access.refused) {
    return refuseTrade(store, access.reason || 'region-refused', tradeRefusalNotice(access.reason));
  }
  const market = input.market;
  if (!market) return refuseTrade(store, 'missing-market', 'No market for this good.');
  const spec = input.spec || goodSpec(input.marketBook, market.good, null);
  const inject = settleInject(input.config);
  const deal = evaluateBookDeal(market, input, inject);
  if (!deal.allowed) return refuseTrade(store, deal.kind || 'refused', deal.sayable);
  const tons = Math.max(1, asInt(input.tons, 1));
  const pods = Array.isArray(input.pods) ? input.pods : [];
  const rowCap = Math.max(1, asInt(configOf(input.config).rowCap, COMMODITY_SHIPMENT_CONFIG.rowCap));
  const heldSales = Object.values(store.sales || {}).filter((sale) => saleLotHeld(sale, pods));
  if (heldSales.length >= rowCap) {
    return refuseTrade(
      store,
      'sale-cap',
      'Sale book is full. Every open row is still in the hold. Purchase refused. The market did not move.',
    );
  }
  const heldLots = Object.values(store.lots || {}).filter((lot) => lotIsAboard(lot, pods));
  if (heldLots.length >= rowCap) {
    return refuseTrade(
      store,
      'lot-cap',
      'Lot book is full. Every open row is still in the hold. Purchase refused. The market did not move.',
    );
  }
  const cargoCap = asInt(input.cargoCap, 20);
  if (cargoUsed(pods) + tons > cargoCap) {
    return refuseTrade(store, 'hold-full', 'Hold is full. Purchase refused. The market did not move.');
  }
  if (!findEmptySlot(pods)) {
    return refuseTrade(store, 'no-pod-slot', 'No empty cargo pod. Purchase refused. The market did not move.');
  }
  const quote = chargeTons(settleMarketTons({ ...market }, 'buy', tons, spec, inject), market, inject);
  if (!quote.ok) {
    return refuseTrade(store, quote.reason, quote.reason === 'stock-floor'
      ? 'Buy refused. Stock is at the floor. The market did not move.'
      : 'Buy refused. The market did not move.');
  }
  if (asInt(input.credits, quote.paid) < quote.paid) {
    return refuseTrade(store, 'funds', 'Not enough latinum. The market did not move.');
  }
  const before = { stock: market.stock, demand: market.demand, price: market.price };
  const settledRaw = settleMarketTons(market, 'buy', tons, spec, inject);
  const settled = chargeTons(settledRaw, market, inject);
  if (!settled.ok) {
    market.stock = before.stock;
    market.demand = before.demand;
    market.price = before.price;
    return refuseTrade(store, settled.reason, 'Buy refused. The market did not move.');
  }
  const slot = findEmptySlot(pods);
  if (!slot) {
    market.stock = before.stock;
    market.demand = before.demand;
    market.price = before.price;
    return refuseTrade(store, 'no-pod-slot', 'No empty cargo pod. Purchase refused. The market did not move.');
  }
  const saleId = issueSaleId(store);
  const lotId = `lot:${saleId}`;
  slot.tons = tons;
  slot.item = market.good;
  slot.destination = undefined;
  slot.payout = 0;
  delete slot.destinationIndex;
  delete slot.contractId;
  slot.bookLotId = lotId;
  slot.bookSaleId = saleId;
  store.lots[lotId] = {
    lotId,
    good: market.good,
    source: 'book-bought',
    contraband: input.contraband === true || market.contraband === true,
    saleId,
    seq: takeSeq(store),
  };
  store.sales[String(saleId)] = {
    saleId,
    lotId,
    good: market.good,
    tons,
    soldByBook: true,
    seq: takeSeq(store),
  };
  upsertCommodity(store, market.good, 'pod', input.strategicJumps);
  const line = tradeLine('Bought', tons, market.good, settled.paid, deal);
  pushNotice(store, line);
  enforceCaps(store, input.config, pods);
  return {
    ok: true,
    paid: settled.paid,
    prices: settled.prices,
    reason: 'bought',
    saleId,
    lotId,
    book: store,
    latinumDelta: -settled.paid,
    logBand: null,
    logLine: line,
    cultureFire: false,
    firingSolution: false,
    engagement_authorized: false,
    market,
  };
}

export function sellBackBookLot(book, input = {}) {
  const store = book && book.version === COMMODITY_SHIPMENT_VERSION ? book : emptyCommodityShipmentBook();
  store.lockedFromRemastered = false;
  const access = dominionTradeAllowed(input.dominion || {});
  if (access.refused) {
    return refuseTrade(store, access.reason || 'region-refused', tradeRefusalNotice(access.reason));
  }
  const saleId = input.saleId;
  const key = String(saleId ?? '');
  if (saleIsConsumed(store, saleId)) {
    return refuseTrade(store, 'sale-consumed', 'That sale was already used.');
  }
  const sale = store.sales[key];
  if (!sale || sale.soldByBook !== true) {
    delete store.sales[key];
    return refuseTrade(store, 'not-book-bought', 'Sell-back paid 0. That sale row is not a book-bought lot.');
  }
  const pods = Array.isArray(input.pods) ? input.pods : [];
  const pod = pods.find((row) => podTaggedForSale(row, sale));
  if (!pod) {
    delete store.sales[key];
    return refuseTrade(store, 'missing-pod', 'Sell-back paid 0. The tagged lot is not aboard.');
  }
  const market = input.market;
  if (!market) return refuseTrade(store, 'missing-market', 'No market for this good.');
  const spec = input.spec || goodSpec(input.marketBook, market.good, null);
  const inject = settleInject(input.config);
  const deal = evaluateBookDeal(market, input, inject);
  if (!deal.allowed) return refuseTrade(store, deal.kind || 'refused', deal.sayable);
  const before = { stock: market.stock, demand: market.demand, price: market.price };
  const settled = chargeTons(settleMarketTons(market, 'sell', sale.tons, spec, inject), market, inject);
  if (!settled.ok) {
    market.stock = before.stock;
    market.demand = before.demand;
    market.price = before.price;
    const notice = settled.reason === 'demand-floor'
      ? 'Sell at the demand floor paid 0. The market did not move.'
      : settled.reason === 'stock-cap'
        ? 'Sell refused. Stock would pass the cap. The market did not move.'
        : 'Sell refused. The market did not move.';
    return refuseTrade(store, settled.reason, notice);
  }
  pod.tons = asInt(pod.tons, 0) - asInt(sale.tons, 0);
  if (pod.tons <= 0) emptyPodShape(pod);
  delete store.sales[key];
  const lot = store.lots[sale.lotId];
  if (lot) lot.saleId = null;
  const line = tradeLine('Sold', sale.tons, sale.good, settled.paid, deal);
  pushNotice(store, line);
  return {
    ok: true,
    paid: settled.paid,
    prices: settled.prices,
    reason: 'sold',
    saleId: sale.saleId,
    book: store,
    latinumDelta: settled.paid,
    logBand: null,
    logLine: line,
    cultureFire: false,
    firingSolution: false,
    engagement_authorized: false,
    contraband: lot?.contraband === true,
    market,
  };
}

export function noteTractorLoosePod(book) {
  const store = book && book.version === COMMODITY_SHIPMENT_VERSION ? book : emptyCommodityShipmentBook();
  return {
    book: store,
    tractorIsBoarding: tractorIsBoarding() === true,
    salesAdded: false,
    source: 'pod',
  };
}

export function recoverMarketBounded(market, spec = {}, config = COMMODITY_SHIPMENT_CONFIG) {
  if (!market) return { drifted: 0, restockedToCap: false, tickDrift: PHASE8_MAGNITUDES.tickDrift };
  const step = Math.max(0, asInt(configOf(config).recoveryStep, 1));
  const stockCap = asInt(spec.stockCap, PHASE8_MAGNITUDES.stockCap);
  const demandCap = asInt(spec.demandCap, PHASE8_MAGNITUDES.demandCap);
  const before = market.stock;
  const stockRoom = Math.max(0, stockCap - asInt(market.stock, 0));
  market.stock = asInt(market.stock, 0) + Math.min(step, stockRoom);
  const demandRoom = Math.max(0, demandCap - asInt(market.demand, 0));
  market.demand = asInt(market.demand, 0) + Math.min(step, demandRoom);
  return {
    drifted: market.stock - before,
    restockedToCap: false,
    tickDrift: PHASE8_MAGNITUDES.tickDrift,
  };
}

export function commodityShipmentSnapshot(book, extra = {}) {
  const store = book && book.commodities ? book : emptyCommodityShipmentBook();
  const names = Object.keys(store.commodities || {});
  return {
    commodityNames: names,
    shipmentIds: Object.keys(store.shipments || {}),
    lots: store.lots || {},
    sales: store.sales || {},
    nextSaleId: store.nextSaleId,
    selectedId: store.selectedId,
    notices: store.notices || [],
    lastNotice: store.lastNotice || '',
    lockedFromRemastered: COMMODITY_SHIPMENT_LOCKED_FROM_REMASTERED === true,
    rowCap: COMMODITY_SHIPMENT_CONFIG.rowCap,
    priceStep: COMMODITY_SHIPMENT_CONFIG.priceStep,
    priceFloor: COMMODITY_SHIPMENT_CONFIG.priceFloor,
    priceCap: COMMODITY_SHIPMENT_CONFIG.priceCap,
    tickDrift: PHASE8_MAGNITUDES.tickDrift,
    tractorIsBoarding: tractorIsBoarding() === true,
    entriesHavePrice: names.some((name) => store.commodities[name] && Object.prototype.hasOwnProperty.call(store.commodities[name], 'price')),
    postMoveSample: extra.market ? postMovePrice(extra.market, 'buy', settleInject()) : null,
    ...extra,
  };
}

export function requireCommodityShipmentHelpers() {
  const names = [
    emptyCommodityShipmentBook,
    restoreCommodityShipmentBook,
    indexCommodityShipment,
    buyCommodityLot,
    sellBackBookLot,
    selectCommodityShipment,
  ];
  if (names.some((fn) => typeof fn !== 'function')) {
    throw new Error('commodity-shipment helpers missing');
  }
  if (COMMODITY_SHIPMENT_LOCKED_FROM_REMASTERED !== false) {
    throw new Error('commodity shipment lock must stay false');
  }
}
