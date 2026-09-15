/**
 * Phase 10 Dominion-first — compact campaign book outside systemStates (gates 1, 3, 5).
 *
 * Knowledge layers (rumor → evidence → contact) never gift firingSolution,
 * culture fire, or engagement_authorized, and never rewrite Phase 1 identity.
 * Stage inject does not jump to fronts because opponent weakness is true.
 * authorizedDeployment only with a live named operation.
 */

import {
  DISCOVERY_ODDS_LOCKED,
  INVASION_ODDS_LOCKED,
  MAGNITUDES_INJECTABLE,
  MAGNITUDES_LOCKED_FROM_REMASTERED,
  magnitudesSnapshot,
} from './phase10-magnitudes.js';
import {
  emptyDiscoveryMap,
  hiddenSystemNames,
  injectDiscovery as writeDiscovery,
} from './phase10-discovery.js';
import {
  deactivateAllAgreements,
  emptyAgreements,
  restoreAgreements,
  serializeAgreements,
} from './phase10-agreements.js';
import { resolveAuthorizedDeployment } from './phase10-pack-gates.js';

export const DOMINION_BOOK_VERSION = 1;
export const PHASE10_ROSTER = 'dominion-first';
export const KNOWLEDGE_LAYERS = Object.freeze(['none', 'rumor', 'evidence', 'contact']);
export const CAMPAIGN_STAGES = Object.freeze([
  'none',
  'rumor',
  'evidence',
  'contact',
  'procurement',
  'access_prep',
  'fronts',
  'occupation',
  'withdraw',
  'abandoned',
]);
export const FAILURE_KINDS = Object.freeze(['exposed', 'delayed', 'sabotaged', 'abandoned']);
export const FORBIDDEN_FIRE_INJECT = 'engagement_authorized';

const LAYER_RANK = { none: 0, rumor: 1, evidence: 2, contact: 3 };
const LAYER_CONFIDENCE = {
  none: null,
  rumor: 'low',
  evidence: 'corroborated',
  contact: 'authenticated',
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sanitizeLayer(layer) {
  return KNOWLEDGE_LAYERS.includes(layer) ? layer : 'none';
}

function sanitizeStage(stage) {
  return CAMPAIGN_STAGES.includes(stage) ? stage : 'none';
}

function emptyObserverRow(observerKey = 'player', extras = {}) {
  return {
    observerKey: String(observerKey || 'player'),
    subject: 'wider_dominion',
    layer: sanitizeLayer(extras.layer),
    confidence: extras.confidence || LAYER_CONFIDENCE[sanitizeLayer(extras.layer)] || null,
    provenance: extras.provenance || null,
    firingSolution: false,
    mapRevealed: false,
    playerFactionUnchanged: true,
    lastKnown: extras.lastKnown && extras.lastKnown.x != null
      ? { x: Number(extras.lastKnown.x) || 0, y: Number(extras.lastKnown.y) || 0, radius: Number(extras.lastKnown.radius) || 0 }
      : null,
    clockLocalMs: Math.max(0, Number(extras.clockLocalMs) || 0),
    flash: false,
  };
}

export function emptyDominionBook(extras = {}) {
  return {
    version: DOMINION_BOOK_VERSION,
    scope: PHASE10_ROSTER,
    rosterPlayable: { independent: false, ferengi: false, vulcan: false },
    rareCommanders: false,
    observers: extras.observers && typeof extras.observers === 'object' ? { ...extras.observers } : {},
    discovery: emptyDiscoveryMap(extras.discovery),
    stage: sanitizeStage(extras.stage),
    weaknessOpportunity: extras.weaknessOpportunity === true,
    weaknessDidAuthorize: false,
    operations: extras.operations && typeof extras.operations === 'object' ? { ...extras.operations } : {},
    liveOperationId: extras.liveOperationId || null,
    debugAuthorizeAllDeployments: false,
    stores: extras.stores && typeof extras.stores === 'object' ? { ...extras.stores } : {},
    lastFailure: extras.lastFailure || null,
    profile: extras.profile === 'dominion_central' ? 'dominion_central' : 'dominion_remnant',
    objectives: extras.objectives && typeof extras.objectives === 'object'
      ? extras.objectives
      : {
        remnant: ['survive', 'secure_supplies', 'protect_blender', 'assess_contact'],
        central: ['reconnect', 'partners', 'conceal_prep', 'access', 'fronts', 'occupy_or_withdraw'],
      },
    agreements: emptyAgreements(extras.agreements),
    clocks: {
      kind: 'localElapsedMs',
      discoveryLocalMs: Math.max(0, Number(extras.clocks?.discoveryLocalMs) || 0),
      prepLocalMs: Math.max(0, Number(extras.clocks?.prepLocalMs) || 0),
      performanceNowForbidden: true,
    },
    lastIncidentKind: extras.lastIncidentKind || null,
    lastFlash: extras.lastFlash === true,
    occupationHoldingId: extras.occupationHoldingId || null,
    magnitudesLockedFromRemastered: MAGNITUDES_LOCKED_FROM_REMASTERED,
    discoveryOddsLocked: DISCOVERY_ODDS_LOCKED,
    invasionOddsLocked: INVASION_ODDS_LOCKED,
    magnitudesInjectable: MAGNITUDES_INJECTABLE,
  };
}

function stripForbidden(row) {
  const clean = { ...row };
  clean.firingSolution = false;
  delete clean.engagement_authorized;
  delete clean[FORBIDDEN_FIRE_INJECT];
  clean.mapRevealed = false;
  clean.playerFactionUnchanged = true;
  if (clean.playerFaction != null) delete clean.playerFaction;
  if (clean.playerSide != null) delete clean.playerSide;
  if (clean.reman53 != null) delete clean.reman53;
  return clean;
}

export function getObserverKnowledge(book, observerKey = 'player') {
  const store = book || emptyDominionBook();
  const key = String(observerKey || 'player');
  return store.observers[key] || emptyObserverRow(key);
}

export function injectKnowledge(book, {
  observerKey = 'player',
  layer = 'rumor',
  provenance = 'report',
  lastKnown = null,
  localElapsedMs = 0,
  firingSolution,
  engagement_authorized,
  playerFaction,
  playerSide,
} = {}) {
  const store = book || emptyDominionBook();
  if (firingSolution === true || engagement_authorized != null || playerFaction != null || playerSide != null) {
    return {
      ok: false,
      reason: 'forbidden-fire-or-phase1-write',
      firingSolution: false,
      engagement_authorized: undefined,
      book: store,
    };
  }
  const key = String(observerKey || 'player');
  const requested = sanitizeLayer(layer);
  const existing = getObserverKnowledge(store, key);
  const nextLayer = LAYER_RANK[requested] >= LAYER_RANK[existing.layer]
    ? requested
    : existing.layer;
  const row = stripForbidden(emptyObserverRow(key, {
    layer: nextLayer,
    provenance: provenance || existing.provenance,
    lastKnown: lastKnown && lastKnown.x != null ? lastKnown : existing.lastKnown,
    clockLocalMs: localElapsedMs,
  }));
  if (nextLayer === 'evidence' && existing.layer === 'rumor' && provenance && existing.provenance && provenance === existing.provenance) {
    return { ok: false, reason: 'evidence-not-independent', book: store, knowledge: existing };
  }
  store.observers[key] = row;
  if (store.stage === 'none' || LAYER_RANK[store.stage] < LAYER_RANK[nextLayer]) {
    if (nextLayer !== 'none' && (store.stage === 'none' || CAMPAIGN_STAGES.indexOf(store.stage) <= CAMPAIGN_STAGES.indexOf(nextLayer))) {
      if (['none', 'rumor', 'evidence', 'contact'].includes(store.stage)) {
        store.stage = nextLayer;
      }
    }
  }
  store.lastFlash = false;
  store.lastIncidentKind = null;
  return {
    ok: true,
    knowledge: row,
    firingSolution: false,
    engagement_authorized: undefined,
    flash: false,
    mapRevealed: false,
    sayable: sayableKnowledgeLine(row),
    book: store,
  };
}

export function sayableKnowledgeLine(row) {
  const layer = row?.layer || 'none';
  if (layer === 'rumor') return 'Rumor only. Not a firing solution, not a map.';
  if (layer === 'evidence') return 'Corroborating evidence. Still not engagement authorized.';
  if (layer === 'contact') {
    return 'Authenticated contact with wider Dominion. Distant region remains hidden until discovery.';
  }
  return 'No campaign knowledge.';
}

export function injectDominionStage(book, {
  stage = 'rumor',
  weaknessOpportunity = false,
  authorizedDeployment = false,
  operationId = null,
} = {}) {
  const store = book || emptyDominionBook();
  const next = sanitizeStage(stage);
  store.weaknessOpportunity = weaknessOpportunity === true;
  store.weaknessDidAuthorize = false;
  if (store.weaknessOpportunity === true && authorizedDeployment !== true) {
    if (next === 'fronts' && store.stage !== 'fronts') {
      store.stage = store.stage === 'none' ? 'rumor' : store.stage;
      return {
        ok: true,
        stage: store.stage,
        weaknessOpportunity: true,
        authorizedDeployment: false,
        weaknessDidAuthorize: false,
        sayable: 'Opponent weakness is opportunity — not an invasion order.',
        book: store,
      };
    }
  }
  store.stage = next;
  if (authorizedDeployment === true && operationId) {
    injectOperation(store, { operationId, authorizedDeployment: true });
  }
  if (next === 'abandoned') {
    clearAuthorization(store);
    store.lastFailure = 'abandoned';
  }
  return {
    ok: true,
    stage: store.stage,
    weaknessOpportunity: store.weaknessOpportunity,
    authorizedDeployment: resolveAuthorizedDeployment(store, 'fleetAttack'),
    weaknessDidAuthorize: false,
    sayable: store.weaknessOpportunity
      ? 'Opponent weakness is opportunity — not an invasion order.'
      : (resolveAuthorizedDeployment(store, 'fleetAttack')
        ? `Authorized operation ${store.liveOperationId}.`
        : 'No authorized deployment. Pack spawn stays remnant / local.'),
    book: store,
  };
}

export function injectOperation(book, { operationId, authorizedDeployment = false, kind = 'mission' } = {}) {
  const store = book || emptyDominionBook();
  const id = String(operationId || '').trim();
  if (!id) return { ok: false, reason: 'missing-operation-id', book: store };
  const live = authorizedDeployment === true;
  store.operations[id] = {
    operationId: id,
    kind: kind === 'fleetAttack' ? 'fleetAttack' : 'mission',
    live,
    authorizedDeployment: live,
    keyedOn: 'operationId',
  };
  store.liveOperationId = live ? id : (store.liveOperationId === id ? null : store.liveOperationId);
  if (!live && store.liveOperationId === id) store.liveOperationId = null;
  return { ok: true, operation: store.operations[id], book: store };
}

export function clearAuthorization(book) {
  const store = book || emptyDominionBook();
  for (const row of Object.values(store.operations || {})) {
    if (!row) continue;
    row.live = false;
    row.authorizedDeployment = false;
  }
  store.liveOperationId = null;
  store.weaknessDidAuthorize = false;
  return store;
}

export function injectDiscoveryWrite(book, input = {}) {
  const store = book || emptyDominionBook();
  const result = writeDiscovery(store.discovery, input);
  store.discovery = result.book;
  return { ...result, book: store, mapRevealedForListedOnly: true };
}

export function spendProcurementStores(book, { good = 'munitions', amount = 1 } = {}, marketBook = null) {
  const store = book || emptyDominionBook();
  const key = String(good || 'munitions');
  const spend = Math.max(0, Number(amount) || 0);
  const before = Math.max(0, Number(store.stores[key]) || 0);
  if (before < spend) {
    return { ok: false, reason: 'insufficient-stores', stores: { ...store.stores }, mintedFleet: false, book: store };
  }
  store.stores[key] = before - spend;
  let marketStock = null;
  if (marketBook && typeof marketBook === 'object') {
    const market = Object.values(marketBook.markets || {}).find((row) => String(row.good) === key)
      || Object.values(marketBook.markets || {})[0];
    if (market && Number.isFinite(Number(market.stock))) {
      const next = Math.max(0, Number(market.stock) - spend);
      market.stock = next;
      marketStock = next;
    }
  }
  return {
    ok: true,
    good: key,
    spent: spend,
    remaining: store.stores[key],
    marketStock,
    mintedFleet: false,
    sayable: 'Preparation consumes stores. This operation can be exposed, delayed, sabotaged, or abandoned.',
    book: store,
  };
}

export function seedProcurementStores(book, { good = 'munitions', amount = 4 } = {}) {
  const store = book || emptyDominionBook();
  const key = String(good || 'munitions');
  store.stores[key] = Math.max(0, Number(amount) || 0);
  return { ok: true, stores: { ...store.stores }, book: store };
}

export function injectFailure(book, kind = 'sabotaged') {
  const store = book || emptyDominionBook();
  const failure = FAILURE_KINDS.includes(kind) ? kind : 'sabotaged';
  store.lastFailure = failure;
  if (failure === 'sabotaged' || failure === 'abandoned' || failure === 'exposed') {
    if (failure !== 'exposed') clearAuthorization(store);
    if (failure === 'abandoned') store.stage = 'abandoned';
  }
  return {
    ok: true,
    failure,
    authorizedDeployment: resolveAuthorizedDeployment(store, 'fleetAttack'),
    mintedReplacementFleet: false,
    book: store,
  };
}

export function attachOccupationHolding(book, holdingId) {
  const store = book || emptyDominionBook();
  store.occupationHoldingId = holdingId || store.occupationHoldingId;
  store.stage = 'occupation';
  return { ok: true, occupationHoldingId: store.occupationHoldingId, freeIncome: false, book: store };
}

export function serializeDominionBook(book) {
  const state = emptyDominionBook(book || {});
  const observers = {};
  for (const [key, row] of Object.entries(state.observers || {})) {
    observers[key] = stripForbidden(emptyObserverRow(key, row));
  }
  return {
    version: DOMINION_BOOK_VERSION,
    scope: PHASE10_ROSTER,
    rosterPlayable: { independent: false, ferengi: false, vulcan: false },
    rareCommanders: false,
    observers,
    discovery: emptyDiscoveryMap(state.discovery),
    stage: state.stage,
    weaknessOpportunity: state.weaknessOpportunity === true,
    weaknessDidAuthorize: false,
    operations: clone(state.operations || {}),
    liveOperationId: state.liveOperationId,
    debugAuthorizeAllDeployments: false,
    stores: { ...state.stores },
    lastFailure: state.lastFailure,
    profile: state.profile,
    objectives: clone(state.objectives),
    agreements: serializeAgreements(state.agreements),
    clocks: { ...state.clocks, kind: 'localElapsedMs', performanceNowForbidden: true },
    lastIncidentKind: state.lastIncidentKind,
    lastFlash: false,
    occupationHoldingId: state.occupationHoldingId,
    magnitudesLockedFromRemastered: false,
    discoveryOddsLocked: false,
    invasionOddsLocked: false,
    magnitudesInjectable: true,
  };
}

export function restoreDominionBook(saved) {
  if (!saved || typeof saved !== 'object') return emptyDominionBook();
  const restored = emptyDominionBook({
    ...saved,
    discovery: emptyDiscoveryMap(saved.discovery),
    agreements: restoreAgreements(saved.agreements),
  });
  restored.observers = {};
  for (const [key, row] of Object.entries(saved.observers || {})) {
    restored.observers[key] = stripForbidden(emptyObserverRow(key, row));
  }
  restored.debugAuthorizeAllDeployments = false;
  restored.weaknessDidAuthorize = false;
  restored.rosterPlayable = { independent: false, ferengi: false, vulcan: false };
  restored.rareCommanders = false;
  restored.scope = PHASE10_ROSTER;
  restored.clocks.kind = 'localElapsedMs';
  restored.clocks.performanceNowForbidden = true;
  return restored;
}

export function knowledgeDoesNotGiftFire(row) {
  return row?.firingSolution !== true
    && !Object.prototype.hasOwnProperty.call(row || {}, 'engagement_authorized')
    && row?.[FORBIDDEN_FIRE_INJECT] == null;
}

export function snapshotDominionBook(book, extras = {}) {
  const store = book || emptyDominionBook();
  const observerKey = String(extras.observerKey || 'player');
  const knowledge = getObserverKnowledge(store, observerKey);
  const authorized = resolveAuthorizedDeployment(store, extras.role || 'fleetAttack');
  return {
    scope: PHASE10_ROSTER,
    rosterPlayable: { independent: false, ferengi: false, vulcan: false },
    rareCommanders: false,
    debugAuthorizeAllDeployments: false,
    ...magnitudesSnapshot(extras.magnitudes),
    fire: {
      firingSolutionGifted: knowledge.firingSolution === true,
      engagement_authorized: undefined,
      playerFactionUnchanged: true,
    },
    knowledge: {
      observerKey,
      layer: knowledge.layer,
      confidence: knowledge.confidence,
      mapRevealed: extras.mapRevealed === true,
      firingSolution: false,
      sayable: sayableKnowledgeLine(knowledge),
    },
    hide: {
      hiddenSystems: hiddenSystemNames(store.discovery, observerKey),
    },
    stage: {
      value: store.stage,
      weaknessOpportunity: store.weaknessOpportunity === true,
      weaknessDidAuthorize: false,
    },
    pack: {
      authorizedDeployment: authorized,
      liveOperationId: store.liveOperationId,
    },
    agreements: {
      live: store.agreements?.live === true,
      ordinaryCaptainKnowsPact: false,
    },
    stores: { ...store.stores },
    lastFailure: store.lastFailure,
    profile: store.profile,
    objectives: clone(store.objectives),
    clocks: { ...store.clocks },
  };
}

void deactivateAllAgreements;
