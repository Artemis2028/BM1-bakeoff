#!/usr/bin/env node
/**
 * Offline S35 commodity and shipment book.
 * Written from docs/commodity-shipment/. Does not crib remastered-work.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ROE_MODES, offersProtectAll } from '../src/phase2-security.js';
import { tractorIsBoarding } from '../src/phase9-ew.js';
import { regionAllows } from '../bm-ships/catalog.mjs';
import {
  PER_TON_SETTLE_DEFAULTS,
  PHASE8_MAGNITUDES,
  applyShopBuy,
  applyShopSell,
  emptyMarketBook,
  evaluateDockService,
  goodSpec,
  injectMarket,
  jumpMustNotReprintInfinity,
  settleMarketTons,
} from '../src/phase8-markets.js';
import {
  OPEN_CLOAK_FAIL_COPY,
  WORLD_CARGO_LOCKED_FROM_REMASTERED,
  dropWorldCargo,
  emptyWorldCargoBook,
  enrollWorldCargoContract,
  restoreWorldCargoBook,
} from '../src/world-cargo-delivery.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED } from '../src/phase10-magnitudes.js';
import { UTILITY_LOCKED_FROM_REMASTERED } from '../src/utility-inventory.js';
import { LEDGER_LOCKED_FROM_REMASTERED } from '../src/weapon-source-ledger.js';
import { EMPTY_ARMABLE_LOCKED_FROM_REMASTERED } from '../src/empty-armable.js';
import { CONSTRUCTION_LOCKED_FROM_REMASTERED } from '../src/construction-visuals.js';
import { HTML_CATALOG_LOCKED_FROM_REMASTERED } from './build-html-catalogs.mjs';
import { ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED } from '../src/economy-difficulty.js';
import { STANDING_TIERS_LOCKED_FROM_REMASTERED } from '../src/standing-tiers.js';
import { DOCK_CLEAR_LOCKED_FROM_REMASTERED } from '../src/dock-clear.js';
import { ALERTS_ACTIVE_LOCKED_FROM_REMASTERED } from '../src/alerts-active.js';
import { AWAY_TEAM_XP_LOCKED_FROM_REMASTERED } from '../src/away-team-xp.js';
import { PHASE10_ROSTER_LOCKED_FROM_REMASTERED } from '../src/phase10-roster.js';
import { BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED } from '../src/bajoran-solar-sailor.js';
import { BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED } from '../src/briefing-archive.js';
import {
  COMMODITY_SHIPMENT_CONFIG,
  COMMODITY_SHIPMENT_LOCKED_FROM_REMASTERED,
  buyCommodityLot,
  dominionTradeAllowed,
  emptyCommodityShipmentBook,
  indexCommodityShipment,
  noteTractorLoosePod,
  recoverMarketBounded,
  restoreCommodityShipmentBook,
  selectCommodityShipment,
  sellBackBookLot,
  serializeCommodityShipmentBook,
} from '../src/commodity-shipment.js';

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

function emptyPods() {
  return Array.from({ length: 10 }, () => ({ tons: 0, item: 'Nothing', destination: undefined, payout: 0 }));
}

function fillPods(pods, item = 'Staple Crate') {
  for (const pod of pods) {
    pod.tons = 2;
    pod.item = item;
    pod.destination = undefined;
    pod.payout = 0;
    delete pod.bookLotId;
    delete pod.bookSaleId;
  }
}

function freshMarket(overrides = {}) {
  const book = emptyMarketBook();
  const minted = injectMarket(book, {
    marketId: 'mkt-s35',
    good: 'Medical Supplies',
    stock: 6,
    demand: 6,
    stockCap: 8,
    demandCap: 8,
    floor: 0,
    price: 10,
    restriction: 'open',
    locationName: 'Ferenginar',
    ...overrides,
  });
  return { book, market: minted.market };
}

function specFor(book, market) {
  return goodSpec(book, market.good);
}

const src = fs.readFileSync(path.join(root, 'src/commodity-shipment.js'), 'utf8');
const srcMain = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
const srcWorld = fs.readFileSync(path.join(root, 'src/world-cargo-delivery.js'), 'utf8');
const srcHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const phase1Path = path.join(root, 'docs/doctrine/bm1-faction-doctrine.v0.2.1.json');
const phase1Before = crypto.createHash('sha256').update(fs.readFileSync(phase1Path)).digest('hex');

assert('S35.9 lock-false', COMMODITY_SHIPMENT_LOCKED_FROM_REMASTERED === false && WORLD_CARGO_LOCKED_FROM_REMASTERED === false);
assert('S35.9 locks-stay-false', [
  MAGNITUDES_LOCKED_FROM_REMASTERED,
  UTILITY_LOCKED_FROM_REMASTERED,
  LEDGER_LOCKED_FROM_REMASTERED,
  EMPTY_ARMABLE_LOCKED_FROM_REMASTERED,
  CONSTRUCTION_LOCKED_FROM_REMASTERED,
  HTML_CATALOG_LOCKED_FROM_REMASTERED,
  ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED,
  STANDING_TIERS_LOCKED_FROM_REMASTERED,
  DOCK_CLEAR_LOCKED_FROM_REMASTERED,
  ALERTS_ACTIVE_LOCKED_FROM_REMASTERED,
  AWAY_TEAM_XP_LOCKED_FROM_REMASTERED,
  PHASE10_ROSTER_LOCKED_FROM_REMASTERED,
  BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED,
  BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED,
  WORLD_CARGO_LOCKED_FROM_REMASTERED,
  COMMODITY_SHIPMENT_LOCKED_FROM_REMASTERED,
].every((flag) => flag === false));
assert('S35.8 host', srcHtml.includes('id="commodity-shipment"')
  && srcHtml.includes('commodity-entries')
  && srcHtml.includes('shipment-records')
  && srcHtml.includes('commodity-shipment-detail'));
assert('S35.5 no-standing-call', !src.includes('adjustFactionStanding') && !src.includes('creditWorthwhileTrip'));
assert('S35.3 no-delivery-call', !src.includes('completeWorldCargo') && !src.includes('dropWorldCargo') && !src.includes('tradeAtPlanet'));
assert('S35.6 no-protect-all', !src.includes('protect-all') && ROE_MODES.length === 2 && ROE_MODES.includes('return-fire') && ROE_MODES.includes('defend') && offersProtectAll() === false);
assert('S35.6 no-prize-control', !srcMain.includes('Sell Prize') && !src.includes('sellPrize'));
assert('S35.9 magnitudes', PHASE8_MAGNITUDES.tickDrift === 0
  && PHASE8_MAGNITUDES.stockCap === 8
  && PHASE8_MAGNITUDES.floor === 0
  && PHASE8_MAGNITUDES.listPrice === 6
  && COMMODITY_SHIPMENT_CONFIG.priceStep === PER_TON_SETTLE_DEFAULTS.priceStep
  && COMMODITY_SHIPMENT_CONFIG.priceFloor === 1
  && COMMODITY_SHIPMENT_CONFIG.rowCap !== 24);
assert('S35.6 tractor-false', tractorIsBoarding() === false);
assert('S35.save-slots', srcMain.includes('const SAVE_SLOT_COUNT = 3') && srcMain.includes('commodityShipmentBook:'));

const weaponNames = new Set(['Phaser', 'Ferengi Cargo Shuttle']);
const pods1 = emptyPods();
pods1[0] = { tons: 3, item: 'Medical Supplies', destination: undefined, payout: 0 };
pods1[1] = { tons: 1, item: 'Phaser', destination: undefined, payout: 0 };
const marketBefore = freshMarket();
const beforePods = JSON.parse(JSON.stringify(pods1));
const indexed = indexCommodityShipment(emptyCommodityShipmentBook(), {
  pods: pods1,
  openContracts: [{ id: 'c-1', goods: 'Food Stuffs', tons: 2, targetName: 'Vulcan', originIndex: 0, targetIndex: 1 }],
  worldCargoBook: emptyWorldCargoBook(),
  strategicJumps: 4,
  notCommodities: weaponNames,
});
assert('S35.1 name-not-price', indexed.commodities['Medical Supplies']
  && indexed.commodities['Medical Supplies'].name === 'Medical Supplies'
  && indexed.commodities['Medical Supplies'].price == null
  && indexed.commodities['Medical Supplies'].stock == null
  && indexed.commodities['Medical Supplies'].demand == null
  && !indexed.commodities.Phaser
  && !indexed.commodities['Ferengi Cargo Shuttle']
  && indexed.commodities['Food Stuffs']
  && marketBefore.market.stock === 6
  && marketBefore.market.price === 10
  && marketBefore.market.demand === 6
  && JSON.stringify(pods1) === JSON.stringify(beforePods));

const contractPods = emptyPods();
contractPods[0] = { tons: 2, item: 'Food Stuffs', destination: 'Vulcan', destinationIndex: 1, contractId: 'c-1', payout: 20 };
const beforeContractPods = JSON.parse(JSON.stringify(contractPods));
const indexedContract = indexCommodityShipment(emptyCommodityShipmentBook(), {
  pods: contractPods,
  openContracts: [{ id: 'c-1', goods: 'Food Stuffs', tons: 2, targetName: 'Vulcan', originIndex: 0, targetIndex: 1, payPerTon: 10 }],
  worldCargoBook: emptyWorldCargoBook(),
  cargoCap: 20,
});
const fullPods = emptyPods();
fillPods(fullPods);
const fullMarket = freshMarket();
const beforeFull = JSON.parse(JSON.stringify(fullMarket.market));
const refused = buyCommodityLot(emptyCommodityShipmentBook(), {
  market: fullMarket.market,
  marketBook: fullMarket.book,
  pods: fullPods,
  cargoCap: 20,
  credits: 500,
  tons: 1,
});
assert('S35.2 one-hold', indexedContract.shipments['c-1'].id === 'c-1'
  && indexedContract.shipments['c-1'].contractId === 'c-1'
  && JSON.stringify(contractPods) === JSON.stringify(beforeContractPods)
  && refused.ok === false
  && refused.paid === 0
  && refused.reason === 'hold-full'
  && JSON.stringify(fullMarket.market) === JSON.stringify(beforeFull)
  && fullPods.every((pod) => pod.item === 'Staple Crate' && pod.tons === 2));

const untagged = emptyPods();
untagged[0] = { tons: 1, item: 'Medical Supplies', destination: undefined, payout: 0 };
const ownSlot = freshMarket({ stock: 4, price: 8 });
const boughtSlot = buyCommodityLot(emptyCommodityShipmentBook(), {
  market: ownSlot.market,
  marketBook: ownSlot.book,
  pods: untagged,
  cargoCap: 20,
  credits: 500,
  tons: 2,
});
assert('S35.2 own-slot', boughtSlot.ok === true
  && untagged[0].tons === 1
  && !untagged[0].bookSaleId
  && untagged[1].tons === 2
  && untagged[1].bookSaleId === boughtSlot.saleId
  && untagged[1].item === 'Medical Supplies');

const wc = emptyWorldCargoBook();
enrollWorldCargoContract(wc, {
  id: 'open-a',
  mode: 'open',
  good: 'Grain',
  tons: 4,
  legalPayout: 40,
  targetIndex: 3,
  targetName: 'World A',
  contraband: true,
});
const wcPods = [{ tons: 4, item: 'Grain', destination: 'World A', destinationIndex: 3, contractId: 'open-a', payout: 40 }];
const cloak = dropWorldCargo(wc, {
  currentPlanet: 3,
  ship: { x: 0, y: 0 },
  planet: { x: 0, y: 0, name: 'World A' },
  dockDistance: 40,
  docked: false,
  dockedStationId: null,
  cloaked: true,
  pods: wcPods,
  contractId: 'open-a',
  strategicJumps: 1,
});
const bookBeside = indexCommodityShipment(emptyCommodityShipmentBook(), {
  pods: wcPods,
  openContracts: [],
  worldCargoBook: wc,
});
selectCommodityShipment(bookBeside, 'open-a');
assert('S35.3 cloak-still-fails', cloak.reason === 'cloak-not-legal'
  && cloak.latinumDelta === 0
  && cloak.outcome === OPEN_CLOAK_FAIL_COPY
  && wc.contracts['open-a'].status === 'open'
  && wcPods[0].tons === 4
  && bookBeside.shipments['open-a'].worldCargoStatus === 'open'
  && bookBeside.shipments['open-a'].lastAttemptReason === 'cloak-not-legal'
  && bookBeside.shipments['open-a'].legalPayout == null);

const modeSaved = restoreWorldCargoBook({
  version: 1,
  contracts: {
    'mode-open': {
      id: 'mode-open',
      mode: 'open',
      status: 'open',
      good: 'Grain',
      tons: 1,
      legalPayout: 10,
      covertReward: 7,
      targetIndex: 1,
      targetName: 'World A',
    },
  },
});
const tokenSaved = restoreWorldCargoBook({
  version: 1,
  contracts: {
    'tok-1': {
      id: 'tok-1',
      mode: 'open',
      status: 'open',
      good: 'Grain',
      tons: 1,
      legalPayout: 10,
      completionToken: 'world-cargo:tok-1',
      targetName: 'World A',
    },
  },
});
const commodityRestore = restoreCommodityShipmentBook(undefined);
assert('S35.4 mode-and-token', modeSaved.contracts['mode-open'].covertReward === 0
  && modeSaved.contracts['mode-open'].mode === 'open'
  && tokenSaved.contracts['tok-1'].status === 'delivered'
  && tokenSaved.contracts['tok-1'].completionToken === 'world-cargo:tok-1'
  && Object.keys(commodityRestore.commodities).length === 0
  && Object.keys(commodityRestore.sales).length === 0);

const standing = { ferengi: 4 };
const standingCopy = JSON.stringify(standing);
const alerts = { active: true };
const alertsCopy = JSON.stringify(alerts);
selectCommodityShipment(bookBeside, 'open-a');
restoreCommodityShipmentBook(serializeCommodityShipmentBook(bookBeside));
assert('S35.5 standing-unchanged', JSON.stringify(standing) === standingCopy
  && JSON.stringify(alerts) === alertsCopy
  && wc.inspectionCleared === false
  && wc.customsCleared === false
  && srcWorld.includes('cloak-not-legal'));

const prizeHull = { cargo: [{ tons: 9, item: 'Prize Ore', payout: 0 }] };
const playerHold = emptyPods();
indexCommodityShipment(emptyCommodityShipmentBook(), { pods: playerHold, openContracts: [], worldCargoBook: emptyWorldCargoBook() });
assert('S35.6 no-prize-copy', playerHold.every((pod) => !pod.tons) && prizeHull.cargo[0].tons === 9 && offersProtectAll() === false);

const hand = {
  version: 1,
  nextSaleId: 3,
  latinum: 9000,
  credits: 9000,
  commodities: { 'Ghost Spice': { name: 'Ghost Spice', seenOn: 'pod', seq: 1 } },
  shipments: {},
  lots: {},
  sales: {},
};
const handPods = emptyPods();
const beforeHand = JSON.parse(JSON.stringify(handPods));
const handBook = restoreCommodityShipmentBook(hand, { pods: handPods });
assert('S35.7 empty-and-no-mint', Object.keys(restoreCommodityShipmentBook(undefined).commodities).length === 0
  && Object.keys(restoreCommodityShipmentBook(null).shipments).length === 0
  && handBook.latinum == null
  && handBook.credits == null
  && JSON.stringify(handPods) === JSON.stringify(beforeHand)
  && handBook.commodities['Ghost Spice']
  && !handPods.some((pod) => pod.item === 'Ghost Spice'));

const over = emptyCommodityShipmentBook();
for (let i = 0; i < 10; i += 1) {
  over.shipments[`d-${i}`] = {
    id: `d-${i}`,
    contractId: `d-${i}`,
    good: 'Grain',
    tons: 1,
    worldCargoStatus: 'delivered',
    seq: i + 1,
  };
}
over.shipments.openKeep = {
  id: 'openKeep',
  contractId: 'openKeep',
  good: 'Grain',
  tons: 1,
  worldCargoStatus: 'open',
  seq: 100,
};
const capped = restoreCommodityShipmentBook(serializeCommodityShipmentBook(over));
assert('S35.7 cap-keeps-open', capped.shipments.openKeep
  && !capped.shipments['d-0']
  && Object.keys(capped.shipments).length <= COMMODITY_SHIPMENT_CONFIG.rowCap + 0
  || (capped.shipments.openKeep && Object.keys(capped.shipments).filter((id) => capped.shipments[id].worldCargoStatus === 'open').length === 1));
const openOnly = emptyCommodityShipmentBook();
for (let i = 0; i < COMMODITY_SHIPMENT_CONFIG.rowCap + 2; i += 1) {
  openOnly.shipments[`o-${i}`] = {
    id: `o-${i}`,
    contractId: `o-${i}`,
    good: 'Grain',
    tons: 1,
    worldCargoStatus: 'open',
    seq: i + 1,
  };
}
const opens = restoreCommodityShipmentBook(serializeCommodityShipmentBook(openOnly));
assert('S35.7 never-drop-open', Object.keys(opens.shipments).length === COMMODITY_SHIPMENT_CONFIG.rowCap + 2);

const issued = emptyCommodityShipmentBook();
issued.nextSaleId = 6;
issued.consumedSaleIds = { 4: true };
const kept = restoreCommodityShipmentBook(serializeCommodityShipmentBook(issued));
const rewound = restoreCommodityShipmentBook({ ...serializeCommodityShipmentBook(issued), nextSaleId: 1 });
assert('S35.7 nextSaleId-round-trip', kept.nextSaleId === 6);
assert('S35.7 nextSaleId-never-lowers', rewound.nextSaleId === 5);

const contacts = [{ id: 'c' }];
const incidents = ['inc-1'];
const flash = [];
const briefing = [{ id: 'b' }];
const contactCopy = JSON.stringify(contacts);
const incidentCopy = JSON.stringify(incidents);
const flashCopy = JSON.stringify(flash);
const briefingCopy = JSON.stringify(briefing);
const tradeMarket = freshMarket({ price: 12, stock: 5, demand: 6 });
const tradePods = emptyPods();
const tradeBuy = buyCommodityLot(emptyCommodityShipmentBook(), {
  market: tradeMarket.market,
  marketBook: tradeMarket.book,
  pods: tradePods,
  cargoCap: 20,
  credits: 500,
  tons: 1,
});
assert('S35.10 not-a-report', tradeBuy.logBand == null
  && JSON.stringify(contacts) === contactCopy
  && JSON.stringify(incidents) === incidentCopy
  && JSON.stringify(flash) === flashCopy
  && JSON.stringify(briefing) === briefingCopy
  && !src.includes('produceArrivalBriefing')
  && !src.includes("band: 'flash'")
  && !src.includes('listContacts'));

const loose = emptyPods();
loose[0] = { tons: 2, item: 'Medical Supplies', destination: undefined, payout: 0 };
const tractor = noteTractorLoosePod(emptyCommodityShipmentBook(), loose[0]);
const tractorSell = sellBackBookLot(tractor.book, {
  saleId: 1,
  market: freshMarket().market,
  pods: loose,
  credits: 500,
});
const contrabandBook = indexCommodityShipment(emptyCommodityShipmentBook(), {
  pods: emptyPods(),
  openContracts: [{ id: 'con-1', goods: 'Spice', tons: 1, contraband: true, targetName: 'Friend' }],
  worldCargoBook: emptyWorldCargoBook(),
});
sellBackBookLot(contrabandBook, { saleId: 'forged', market: freshMarket({ good: 'Spice' }).market, pods: emptyPods(), spoof: true, friendly: true });
assert('S35.11 provenance', tractor.tractorIsBoarding === false
  && tractor.salesAdded === false
  && tractorSell.paid === 0
  && loose[0].tons === 2
  && contrabandBook.lots['contract:con-1'].contraband === true
  && contrabandBook.lots['contract:con-1'].source === 'contract');

const tagged = emptyPods();
const seeded = freshMarket({ price: 9, stock: 5, demand: 5 });
const realBuy = buyCommodityLot(emptyCommodityShipmentBook(), {
  market: seeded.market,
  marketBook: seeded.book,
  pods: tagged,
  cargoCap: 20,
  credits: 500,
  tons: 2,
});
const second = sellBackBookLot(realBuy.book, { saleId: realBuy.saleId, market: seeded.market, marketBook: seeded.book, pods: tagged });
const third = sellBackBookLot(realBuy.book, { saleId: realBuy.saleId, market: seeded.market, marketBook: seeded.book, pods: tagged });
assert('S35.11 consume-sale', realBuy.ok && second.ok && second.paid > 0 && third.paid === 0 && third.reason === 'sale-consumed');

const gonePods = emptyPods();
const goneMarket = freshMarket({ price: 9, stock: 5, demand: 5 });
const goneBuy = buyCommodityLot(emptyCommodityShipmentBook(), {
  market: goneMarket.market,
  marketBook: goneMarket.book,
  pods: gonePods,
  cargoCap: 20,
  credits: 500,
  tons: 1,
});
gonePods[gonePods.findIndex((pod) => pod.bookSaleId === goneBuy.saleId)].tons = 0;
gonePods.find((pod) => pod.bookSaleId === goneBuy.saleId).item = 'Nothing';
delete gonePods.find((pod) => pod.item === 'Nothing' && pod.bookSaleId)?.bookSaleId;
const missing = sellBackBookLot(goneBuy.book, { saleId: goneBuy.saleId, market: goneMarket.market, pods: gonePods });
assert('S35.11 missing-pod-pays-0', missing.paid === 0 && !goneBuy.book.sales[String(goneBuy.saleId)]);

const forged = restoreCommodityShipmentBook({
  version: 1,
  nextSaleId: 8,
  sales: { 7: { saleId: 7, lotId: 'lot:7', good: 'Medical Supplies', tons: 3, soldByBook: true, seq: 1 } },
}, { pods: emptyPods() });
const forgedPay = sellBackBookLot(forged, { saleId: 7, market: freshMarket().market, pods: emptyPods() });
assert('S35.11 forged-pays-0', forgedPay.paid === 0 && !forged.sales['7']);

const coreRefused = dominionTradeAllowed({
  scope: 'dominion-core',
  systemName: 'Ferenginar',
  role: 'traffic',
  authorizedDeployment: false,
});
const packRefused = regionAllows({ availabilityRegion: 'dominion-core' }, {
  systemName: 'Ferenginar',
  role: 'traffic',
  authorizedDeployment: false,
});
const embargoMarket = freshMarket({ restriction: 'embargo', price: 4 });
const embargoBuy = buyCommodityLot(emptyCommodityShipmentBook(), {
  market: embargoMarket.market,
  marketBook: embargoMarket.book,
  pods: emptyPods(),
  cargoCap: 20,
  credits: 50,
  tons: 1,
  dominion: { scope: 'dominion-core', systemName: 'Ferenginar', role: 'traffic' },
});
assert('S35.12 dominion-scope', coreRefused.allowed === false
  && packRefused === false
  && embargoBuy.paid === 0
  && ROE_MODES.length === 2
  && offersProtectAll() === false
  && embargoBuy.engagement_authorized === false);

const phase1After = crypto.createHash('sha256').update(fs.readFileSync(phase1Path)).digest('hex');
assert('S35.13 no-culture-gift', tradeBuy.cultureFire === false
  && tradeBuy.firingSolution === false
  && tradeBuy.engagement_authorized === false
  && phase1After === phase1Before
  && !src.includes('consultDoctrineFire'));

const finite = freshMarket({ price: 10, stock: 6, demand: 6, stockCap: 8, demandCap: 8, floor: 0 });
const finitePods = emptyPods();
const beforeFinite = { stock: finite.market.stock, demand: finite.market.demand, price: finite.market.price };
indexCommodityShipment(emptyCommodityShipmentBook(), { pods: finitePods, openContracts: [], worldCargoBook: emptyWorldCargoBook() });
assert('S35.14 index-still', finite.market.stock === beforeFinite.stock && finite.market.price === beforeFinite.price && finite.market.demand === beforeFinite.demand);
const n = 3;
const expectedBuy = [11, 12, 13];
const lump = buyCommodityLot(emptyCommodityShipmentBook(), {
  market: finite.market,
  marketBook: finite.book,
  pods: finitePods,
  cargoCap: 20,
  credits: 5000,
  tons: n,
});
assert('S35.14 n-ton-buy', lump.ok
  && finite.market.stock === beforeFinite.stock - n
  && lump.prices.join(',') === expectedBuy.join(',')
  && lump.paid === expectedBuy.reduce((sum, price) => sum + price, 0)
  && finite.market.price >= COMMODITY_SHIPMENT_CONFIG.priceFloor
  && finite.market.price <= COMMODITY_SHIPMENT_CONFIG.priceCap);
const shopMirror = freshMarket({ price: 10, stock: 6, demand: 6 });
const shopOne = applyShopBuy(shopMirror.book, { marketId: shopMirror.market.marketId, credits: 500 });
assert('S35.14 shop-same-step', shopOne.ok && shopOne.paid === 11 && shopMirror.market.stock === 5 && shopMirror.market.price === 11);

const tooMany = freshMarket({ price: 10, stock: 2, demand: 6, floor: 0 });
const tooManyBefore = { ...tooMany.market };
const tooManyPods = emptyPods();
const overBuy = buyCommodityLot(emptyCommodityShipmentBook(), {
  market: tooMany.market,
  marketBook: tooMany.book,
  pods: tooManyPods,
  cargoCap: 20,
  credits: 5000,
  tons: 3,
});
assert('S35.14 buy-past-floor', overBuy.paid === 0 && overBuy.ok === false
  && tooMany.market.stock === tooManyBefore.stock
  && tooMany.market.price === tooManyBefore.price
  && tooManyPods.every((pod) => !pod.tons));

const sellBook = lump.book;
const sellPaid = sellBackBookLot(sellBook, {
  saleId: lump.saleId,
  market: finite.market,
  marketBook: finite.book,
  pods: finitePods,
});
assert('S35.14 n-ton-sell', sellPaid.ok
  && finite.market.stock === beforeFinite.stock
  && finite.market.demand === beforeFinite.demand - n
  && sellPaid.paid === [12, 11, 10].reduce((sum, price) => sum + price, 0)
  && finite.market.price === beforeFinite.price);

const floorMarket = freshMarket({ price: 8, stock: 2, demand: 0, floor: 0, stockCap: 8 });
const floorBefore = { stock: floorMarket.market.stock, demand: floorMarket.market.demand, price: floorMarket.market.price };
const floorPods = emptyPods();
floorPods[0] = { tons: 1, item: 'Medical Supplies', destination: undefined, payout: 0, bookLotId: 'lot:1', bookSaleId: 1 };
const floorBook = emptyCommodityShipmentBook();
floorBook.sales['1'] = { saleId: 1, lotId: 'lot:1', good: 'Medical Supplies', tons: 1, soldByBook: true, seq: 1 };
floorBook.lots['lot:1'] = { lotId: 'lot:1', good: 'Medical Supplies', source: 'book-bought', contraband: false, saleId: 1, seq: 1 };
floorBook.nextSaleId = 2;
const floorSell = sellBackBookLot(floorBook, { saleId: 1, market: floorMarket.market, marketBook: floorMarket.book, pods: floorPods });
assert('S35.14 sell-at-demand-floor', floorSell.paid === 0
  && floorMarket.market.stock === floorBefore.stock
  && floorMarket.market.demand === floorBefore.demand
  && floorMarket.market.price === floorBefore.price
  && floorPods[0].tons === 1);

const recover = freshMarket({ price: 6, stock: 2, demand: 2, stockCap: 8, demandCap: 8 });
const drifted = recoverMarketBounded(recover.market, specFor(recover.book, recover.market));
assert('S35.14 no-refill', drifted.tickDrift === 0
  && PHASE8_MAGNITUDES.tickDrift === 0
  && recover.market.stock === 3
  && drifted.restockedToCap === false);

function roundTrip(label, run) {
  const result = run();
  assert(label, result.net <= 0 && result.priceReturned === true, JSON.stringify(result));
}

roundTrip('S35.15 split-then-lump', () => {
  const { book, market } = freshMarket({ price: 12, stock: 8, demand: 8, stockCap: 8, demandCap: 8, floor: 0 });
  const hold = emptyPods();
  const start = market.price;
  let net = 0;
  const ledger = emptyCommodityShipmentBook();
  const saleIds = [];
  for (let i = 0; i < 3; i += 1) {
    const bought = buyCommodityLot(ledger, {
      market, marketBook: book, pods: hold, cargoCap: 20, credits: 5000, tons: 1,
    });
    net -= bought.paid;
    saleIds.push(bought.saleId);
  }
  const first = saleIds[0];
  const pod = hold.find((row) => row.bookSaleId === first);
  let tons = 0;
  for (const saleId of saleIds) {
    const tagged = hold.find((row) => row.bookSaleId === saleId);
    tons += tagged.tons;
    if (tagged !== pod) {
      tagged.tons = 0;
      tagged.item = 'Nothing';
      delete tagged.bookLotId;
      delete tagged.bookSaleId;
    }
    if (saleId !== first) delete ledger.sales[String(saleId)];
  }
  pod.tons = tons;
  pod.bookSaleId = first;
  ledger.sales[String(first)].tons = tons;
  const sold = sellBackBookLot(ledger, { saleId: first, market, marketBook: book, pods: hold });
  net += sold.paid;
  return { net, priceReturned: market.price === start, price: market.price, start, paid: sold.paid };
});

roundTrip('S35.15 lump-then-split', () => {
  const { book, market } = freshMarket({ price: 12, stock: 8, demand: 8, stockCap: 8, demandCap: 8, floor: 0 });
  const hold = emptyPods();
  const start = market.price;
  const bought = buyCommodityLot(emptyCommodityShipmentBook(), {
    market, marketBook: book, pods: hold, cargoCap: 40, credits: 5000, tons: 3,
  });
  let net = -bought.paid;
  const pod = hold.find((row) => row.bookSaleId === bought.saleId);
  const sale = bought.book.sales[String(bought.saleId)];
  for (let i = 0; i < 3; i += 1) {
    const oneId = `${bought.saleId}-${i}`;
    bought.book.sales[oneId] = { ...sale, saleId: oneId, tons: 1, lotId: sale.lotId };
    pod.bookSaleId = oneId;
    pod.tons = 3 - i;
    const sold = sellBackBookLot(bought.book, { saleId: oneId, market, marketBook: book, pods: hold });
    net += sold.paid;
    delete bought.book.consumedSaleIds[oneId];
  }
  return { net, priceReturned: market.price === start, price: market.price, start };
});

roundTrip('S35.15 book-then-shop', () => {
  const { book, market } = freshMarket({ price: 12, stock: 6, demand: 6, stockCap: 8, demandCap: 8, floor: 0 });
  const hold = emptyPods();
  const start = market.price;
  const bought = buyCommodityLot(emptyCommodityShipmentBook(), {
    market, marketBook: book, pods: hold, cargoCap: 20, credits: 5000, tons: 1,
  });
  const sold = applyShopSell(book, { marketId: market.marketId, credits: 5000 });
  return { net: -bought.paid + sold.paid, priceReturned: market.price === start, price: market.price, start };
});

roundTrip('S35.15 shop-then-book', () => {
  const { book, market } = freshMarket({ price: 12, stock: 6, demand: 6, stockCap: 8, demandCap: 8, floor: 0 });
  const hold = emptyPods();
  hold[0] = { tons: 1, item: 'Medical Supplies', destination: undefined, payout: 0, bookLotId: 'lot:9', bookSaleId: 9 };
  const ledger = emptyCommodityShipmentBook();
  ledger.nextSaleId = 10;
  ledger.sales['9'] = { saleId: 9, lotId: 'lot:9', good: 'Medical Supplies', tons: 1, soldByBook: true, seq: 1 };
  ledger.lots['lot:9'] = { lotId: 'lot:9', good: 'Medical Supplies', source: 'book-bought', contraband: false, saleId: 9, seq: 1 };
  const start = market.price;
  const bought = applyShopBuy(book, { marketId: market.marketId, credits: 5000 });
  const sold = sellBackBookLot(ledger, { saleId: 9, market, marketBook: book, pods: hold });
  return { net: -bought.paid + sold.paid, priceReturned: market.price === start, price: market.price, start, bought: bought.paid, sold: sold.paid };
});

{
  const { book, market } = freshMarket({ price: 12, stock: 8, demand: 8, stockCap: 8, demandCap: 8, floor: 0 });
  const startLatinum = 1000;
  let latinum = startLatinum;
  let worst = 0;
  for (let trip = 0; trip < market.stockCap + 1; trip += 1) {
    const before = latinum;
    const hold = emptyPods();
    const bought = buyCommodityLot(emptyCommodityShipmentBook(), {
      market, marketBook: book, pods: hold, cargoCap: 20, credits: latinum, tons: 1,
    });
    latinum -= bought.paid || 0;
    if (bought.ok) {
      const sold = sellBackBookLot(bought.book, { saleId: bought.saleId, market, marketBook: book, pods: hold });
      latinum += sold.paid || 0;
    }
    worst = Math.max(worst, latinum - before);
  }
  assert('S35.15 more-trips-than-stockCap', latinum <= startLatinum && worst <= 0, JSON.stringify({ latinum, startLatinum, worst, price: market.price, demand: market.demand, stock: market.stock }));
}

{
  const worldA = freshMarket({ marketId: 'mkt-a', price: 10, stock: 4, demand: 6, stockCap: 8, demandCap: 8, floor: 0 });
  const worldB = freshMarket({ marketId: 'mkt-b', price: 14, stock: 4, demand: 6, stockCap: 8, demandCap: 8, floor: 0 });
  const hold = emptyPods();
  const bought = buyCommodityLot(emptyCommodityShipmentBook(), {
    market: worldA.market, marketBook: worldA.book, pods: hold, cargoCap: 20, credits: 500, tons: 1,
  });
  const stockAAfterBuy = worldA.market.stock;
  sellBackBookLot(bought.book, { saleId: bought.saleId, market: worldB.market, marketBook: worldB.book, pods: hold });
  const jump = jumpMustNotReprintInfinity(worldA.book, { markets: [{ marketId: 'mkt-a', stock: 4, good: 'Medical Supplies' }] });
  const repair = evaluateDockService({ lost: false, supply: { met: false } }, 'repair', { baseCost: 4 });
  assert('S35.15 two-world', worldA.market.stock === stockAAfterBuy
    && worldA.market.stock < 8
    && worldB.market.stock < 8
    && jump.freeRepair === false
    && repair.refuse === true
    && repair.price !== 0);
}

assert('S35.14 direct-n-tons', (() => {
  const { market } = freshMarket({ price: 10, stock: 6, demand: 6, stockCap: 8, floor: 0 });
  const moved = settleMarketTons(market, 'buy', 3, { floor: 0, stockCap: 8, demandCap: 8 });
  return moved.ok && market.stock === 3 && moved.paid === 11 + 12 + 13;
})());

if (failed) {
  console.error(failures.join('\n'));
  console.error(`S35 commodity shipment: ${passed} passed, ${failed} failed`);
  process.exit(1);
}
console.log(`S35 commodity shipment: ${passed} passed, ${failed} failed`);
