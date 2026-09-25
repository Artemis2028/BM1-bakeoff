/**
 * S34 — world cargo delivery.
 *
 * Source of truth:
 * - docs/world-cargo-delivery/BM1-WORLD-CARGO-DELIVERY-PROPOSAL.md §3
 * - docs/world-cargo-delivery/BM1-WORLD-CARGO-DELIVERY-ENGINE-DEPENDENCIES.md
 *
 * Sibling book beside marketBook / briefingArchive. Reads hold, radius, and
 * cloak facts supplied by the caller. Writes only this book and the pods a
 * full delivery or expiry releases. Does not crib BM1-remastered-work.
 * WORLD_CARGO_LOCKED_FROM_REMASTERED stays false.
 *
 * A cloaked drop of an open contract is a failed attempt: pods stay aboard,
 * status stays open, latinum stays 0, and the once-token is not written.
 * Covert standing is never written here. Open standing is requested only as
 * a creditWorthwhileTrip token the caller may apply.
 */

import { resolveTierSlack } from './phase5-objectives.js';
import { offersProtectAll, ROE_MODES } from './phase2-security.js';

export const WORLD_CARGO_VERSION = 1;
export const WORLD_CARGO_LOCKED_FROM_REMASTERED = false;
export const OPEN_CLOAK_FAIL_COPY = 'Not a legal delivery. Inspection not cleared. Cargo still aboard.';
export const STATION_NOT_WORLD_COPY = 'Freight is due at the destination world, not at this station.';
export const HAIL_NOT_WORLD_COPY = 'Freight is due at the destination world, not at this hail.';

const OUTCOME_CAP = 6;

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function roundNonNeg(value) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function sameId(a, b) {
  return String(a ?? '') === String(b ?? '');
}

function distanceBetween(ship, planet) {
  const x = Number(ship?.x);
  const y = Number(ship?.y);
  const px = Number(planet?.x);
  const py = Number(planet?.y);
  if (![x, y, px, py].every(Number.isFinite)) return Infinity;
  return Math.hypot(x - px, y - py);
}

function stationSet(value) {
  return value != null && value !== '';
}

function pushOutcome(book, line) {
  const text = String(line || '').trim();
  if (!text) return;
  if (!Array.isArray(book.outcomeLog)) book.outcomeLog = [];
  book.outcomeLog.push(text);
  if (book.outcomeLog.length > OUTCOME_CAP) {
    book.outcomeLog.splice(0, book.outcomeLog.length - OUTCOME_CAP);
  }
  book.lastOutcome = text;
}

function forceCleared(book) {
  book.version = WORLD_CARGO_VERSION;
  book.inspectionCleared = false;
  book.customsCleared = false;
  book.lockedFromRemastered = false;
}

export function emptyWorldCargoBook() {
  return {
    version: WORLD_CARGO_VERSION,
    inspectionCleared: false,
    customsCleared: false,
    lockedFromRemastered: false,
    contracts: {},
    suspicion: [],
    outcomeLog: [],
    lastOutcome: '',
  };
}

export function deliveriesPending(book) {
  const contracts = asObject(book?.contracts) || {};
  return Object.values(contracts).filter((row) => row && row.status === 'open').length;
}

export function bookOwnsContractId(book, id) {
  if (!id) return false;
  const contracts = asObject(book?.contracts);
  return Boolean(contracts && contracts[String(id)]);
}

function restoreOneContract(row, key) {
  const source = asObject(row);
  if (!source) return null;
  const id = String(source.id || key || '').trim();
  if (!id) return null;
  let legalPayout = roundNonNeg(source.legalPayout);
  let covertReward = roundNonNeg(source.covertReward);
  let mode = source.mode === 'covert' || source.mode === 'open' ? source.mode : null;
  if (legalPayout > 0 && covertReward > 0) {
    if (mode === 'covert') legalPayout = 0;
    else {
      mode = 'open';
      covertReward = 0;
    }
  } else if (legalPayout > 0) {
    mode = 'open';
    covertReward = 0;
  } else if (covertReward > 0) {
    mode = 'covert';
    legalPayout = 0;
  } else if (mode !== 'open' && mode !== 'covert') {
    mode = 'open';
  }
  const status = source.status === 'delivered' || source.status === 'expired' ? source.status : 'open';
  let completionToken = null;
  if (source.completionToken === `world-cargo:${id}`) completionToken = `world-cargo:${id}`;
  if (status === 'delivered' && !completionToken) completionToken = `world-cargo:${id}`;
  return {
    id,
    mode,
    status,
    good: String(source.good || source.goods || ''),
    tons: roundNonNeg(source.tons),
    legalPayout,
    covertReward,
    originIndex: Number.isFinite(Number(source.originIndex)) ? Number(source.originIndex) : null,
    targetIndex: Number.isFinite(Number(source.targetIndex)) ? Number(source.targetIndex) : null,
    targetName: String(source.targetName || ''),
    contraband: source.contraband === true,
    acceptedAtStrategicJumps: roundNonNeg(source.acceptedAtStrategicJumps) || 0,
    deadlineSlack: Number.isFinite(Number(source.deadlineSlack))
      ? Math.max(0, Number(source.deadlineSlack))
      : resolveTierSlack('standard'),
    completionToken,
    deliveredAtStrategicJumps: Number.isFinite(Number(source.deliveredAtStrategicJumps))
      ? Number(source.deliveredAtStrategicJumps)
      : null,
    deliveredCloaked: status === 'delivered' && mode === 'covert' && source.deliveredCloaked === true,
    lastAttempt: asObject(source.lastAttempt),
  };
}

export function restoreWorldCargoBook(raw) {
  if (!asObject(raw)) return emptyWorldCargoBook();
  const book = emptyWorldCargoBook();
  const contracts = asObject(raw.contracts) || {};
  for (const [key, row] of Object.entries(contracts)) {
    const restored = restoreOneContract(row, key);
    if (restored) book.contracts[restored.id] = restored;
  }
  book.suspicion = Array.isArray(raw.suspicion)
    ? raw.suspicion.filter((note) => asObject(note)).map((note, index) => ({
      id: String(note.id || `sus-${index + 1}`),
      contractId: note.contractId ? String(note.contractId) : null,
      text: String(note.text || 'Patrol suspicion only.'),
      suspicionOnly: true,
    }))
    : [];
  book.outcomeLog = Array.isArray(raw.outcomeLog)
    ? raw.outcomeLog.map((line) => String(line || '')).filter(Boolean).slice(-OUTCOME_CAP)
    : [];
  book.lastOutcome = typeof raw.lastOutcome === 'string' ? raw.lastOutcome : (book.outcomeLog[book.outcomeLog.length - 1] || '');
  forceCleared(book);
  return book;
}

export function serializeWorldCargoBook(book) {
  return restoreWorldCargoBook(book || emptyWorldCargoBook());
}

export function enrollWorldCargoContract(book, input = {}) {
  const store = book && book.contracts ? book : emptyWorldCargoBook();
  forceCleared(store);
  const id = String(input.id || '').trim();
  if (!id) return { ok: false, reason: 'missing-id', book: store };
  if (store.contracts[id]) {
    return { ok: true, enrolled: false, contract: store.contracts[id], book: store, retagged: false };
  }
  const mode = input.mode === 'covert' ? 'covert' : 'open';
  const legalPayout = mode === 'open' ? roundNonNeg(input.legalPayout) : 0;
  const covertReward = mode === 'covert' ? roundNonNeg(input.covertReward) : 0;
  const contract = {
    id,
    mode,
    status: 'open',
    good: String(input.good || input.goods || ''),
    tons: roundNonNeg(input.tons),
    legalPayout,
    covertReward,
    originIndex: Number.isFinite(Number(input.originIndex)) ? Number(input.originIndex) : null,
    targetIndex: Number.isFinite(Number(input.targetIndex)) ? Number(input.targetIndex) : null,
    targetName: String(input.targetName || ''),
    contraband: input.contraband === true,
    acceptedAtStrategicJumps: Number.isFinite(Number(input.acceptedAtStrategicJumps))
      ? Math.max(0, Math.round(Number(input.acceptedAtStrategicJumps)))
      : 0,
    deadlineSlack: Number.isFinite(Number(input.deadlineSlack))
      ? Math.max(0, Number(input.deadlineSlack))
      : resolveTierSlack('standard'),
    completionToken: null,
    deliveredAtStrategicJumps: null,
    deliveredCloaked: null,
    lastAttempt: null,
  };
  store.contracts[id] = contract;
  return { ok: true, enrolled: true, contract, book: store, retagged: false };
}

function podMatches(pod, contract) {
  if (!pod || !contract) return false;
  if (roundNonNeg(pod.tons) <= 0) return false;
  if (!pod.contractId || !sameId(pod.contractId, contract.id)) return false;
  if (String(pod.item || '') !== String(contract.good || '')) return false;
  const dest = Number(pod.destinationIndex);
  return Number.isFinite(dest) && dest === Number(contract.targetIndex);
}

function matchingTons(pods, contract) {
  const list = Array.isArray(pods) ? pods : [];
  return list.reduce((sum, pod) => sum + (podMatches(pod, contract) ? roundNonNeg(pod.tons) : 0), 0);
}

function clearDeliveredPod(pod) {
  pod.tons = 0;
  pod.item = 'Nothing';
  pod.destination = undefined;
  pod.payout = 0;
  delete pod.destinationIndex;
  delete pod.contractId;
  delete pod.targetIndex;
  delete pod.targetName;
}

function releasePodLoose(pod) {
  pod.destination = undefined;
  pod.payout = 0;
  delete pod.destinationIndex;
  delete pod.contractId;
  delete pod.targetIndex;
  delete pod.targetName;
}

function atWorldBody(contract, input) {
  if (Number(input.currentPlanet) !== Number(contract.targetIndex)) return false;
  if (stationSet(input.dockedStationId)) return false;
  const radius = Number(input.dockDistance);
  if (!Number.isFinite(radius)) return false;
  return distanceBetween(input.ship, input.planet) <= radius;
}

function baseResult(book, contract, input, patch) {
  forceCleared(book);
  return {
    ok: false,
    atWorld: false,
    status: contract?.status || 'open',
    mode: contract?.mode || null,
    reason: null,
    result: 'failed',
    latinumDelta: 0,
    legalPayoutDelta: 0,
    covertRewardDelta: 0,
    countedAsLegal: false,
    standingDelta: 0,
    requestTrip: false,
    tripToken: null,
    trips: [],
    targetIndex: contract?.targetIndex ?? null,
    inspectionCleared: false,
    customsCleared: false,
    contraband: contract?.contraband === true,
    encounterFacts: input?.encounterFacts ?? null,
    suspicionOnly: true,
    firingSolution: input?.firingSolution,
    engagement_authorized: input?.engagement_authorized,
    pursuit: input?.pursuit,
    completionToken: contract?.completionToken || null,
    deliveriesPending: deliveriesPending(book),
    outcome: book.lastOutcome || '',
    podsMoved: false,
    roeModes: ROE_MODES.slice(),
    offersProtectAll: offersProtectAll() === true,
    bookInsideSystemStates: false,
    ...patch,
  };
}

function remember(contract, resultName, reason) {
  contract.lastAttempt = { result: resultName, reason, stationId: contract.lastAttempt?.stationId ?? null };
}

function fail(book, contract, input, reason, outcome, resultName = 'failed') {
  remember(contract, resultName, reason);
  if (input?.stationId != null) contract.lastAttempt.stationId = input.stationId;
  pushOutcome(book, outcome);
  return baseResult(book, contract, input, {
    atWorld: false,
    status: contract.status,
    reason,
    result: resultName,
    outcome: book.lastOutcome,
    completionToken: contract.completionToken,
  });
}

function selectContracts(book, input, action) {
  const contracts = Object.values(book.contracts || {});
  if (input?.contractId) return contracts.filter((row) => sameId(row.id, input.contractId));
  if (action === 'planet-dock' || action === 'drop' || action === 'warp') {
    return contracts.filter((row) => row.status === 'open' && Number(row.targetIndex) === Number(input?.currentPlanet));
  }
  return contracts.filter((row) => row.status === 'open');
}

function serviceOne(book, contract, input, action) {
  const factsBefore = input?.encounterFacts;
  const cloaked = input?.cloaked === true;
  if (contract.status === 'delivered' || contract.completionToken) {
    return fail(book, contract, input, 'already-delivered', 'Already delivered. Paid 0.');
  }
  if (contract.status === 'expired') {
    return fail(book, contract, input, 'already-expired', 'Contract already expired. Paid 0.');
  }
  if (action === 'station') {
    return fail(book, contract, input, 'station-not-world', STATION_NOT_WORLD_COPY);
  }
  if (action === 'hail') {
    return fail(book, contract, input, 'hail-not-world', HAIL_NOT_WORLD_COPY);
  }
  if (action === 'warp') {
    return fail(book, contract, input, 'warp-not-world', 'Warp arrival is not delivery at the world. Paid 0.');
  }
  if (stationSet(input?.dockedStationId)) {
    return fail(book, contract, input, 'station-not-world', STATION_NOT_WORLD_COPY);
  }
  if (Number(input?.currentPlanet) !== Number(contract.targetIndex)) {
    return fail(book, contract, input, 'wrong-world', 'Freight is due at the destination world. Paid 0. Cargo still aboard.');
  }
  if (action === 'planet-dock' && input?.checkpointRefused === true) {
    return fail(book, contract, input, 'checkpoint-refused', 'Checkpoint refused the dock. Paid 0. Cargo still aboard.');
  }
  const radius = Number(input?.dockDistance);
  const near = Number.isFinite(radius) && distanceBetween(input?.ship, input?.planet) <= radius;
  if (!near) {
    return fail(book, contract, input, 'outside-radius', 'Outside the world service radius. Paid 0. Cargo still aboard.');
  }
  if (contract.mode === 'open' && cloaked) {
    return fail(book, contract, input, 'cloak-not-legal', OPEN_CLOAK_FAIL_COPY);
  }
  if (contract.mode === 'covert' && !cloaked) {
    return fail(book, contract, input, 'uncloaked-not-covert', 'Not a covert drop. Uncloaked. Inspection not cleared. Cargo still aboard.');
  }
  if (contract.mode === 'open' && action !== 'planet-dock') {
    return fail(book, contract, input, 'not-world-service', 'Not a legal delivery. Cargo still aboard. Paid 0.');
  }
  if (contract.mode === 'covert' && action !== 'drop') {
    return fail(book, contract, input, 'dock-not-covert', 'A covert contract needs a cloaked drop. Paid 0. Cargo still aboard.');
  }
  if (action === 'planet-dock') {
    if (input?.docked !== true || Number(input?.dockedPlanetIndex) !== Number(contract.targetIndex)) {
      return fail(book, contract, input, 'not-docked', 'Planet dock at the destination world is required. Paid 0. Cargo still aboard.');
    }
  }
  if (action === 'drop' && input?.docked === true) {
    return fail(book, contract, input, 'docked-not-drop', 'A covert drop is not a dock. Paid 0. Cargo still aboard.');
  }
  const tons = matchingTons(input?.pods, contract);
  if (tons <= 0) {
    const wrong = (input?.pods || []).some((pod) => pod?.contractId && sameId(pod.contractId, contract.id));
    return fail(book, contract, input, wrong ? 'wrong-good' : 'empty-hold', 'No matching cargo aboard. Paid 0.');
  }
  if (tons < roundNonNeg(contract.tons)) {
    return fail(book, contract, input, 'short-tons', 'Short of the contract tonnage. Cargo still aboard. Paid 0.', 'partial');
  }
  const pods = Array.isArray(input?.pods) ? input.pods : [];
  for (const pod of pods) {
    if (podMatches(pod, contract)) clearDeliveredPod(pod);
  }
  const legal = contract.mode === 'open' ? roundNonNeg(contract.legalPayout) : 0;
  const covert = contract.mode === 'covert' ? roundNonNeg(contract.covertReward) : 0;
  contract.status = 'delivered';
  contract.completionToken = `world-cargo:${contract.id}`;
  contract.deliveredAtStrategicJumps = Number.isFinite(Number(input?.strategicJumps))
    ? Number(input.strategicJumps)
    : null;
  contract.deliveredCloaked = contract.mode === 'covert';
  contract.lastAttempt = { result: 'delivered', reason: contract.mode === 'covert' ? 'covert-drop' : 'open-dock', stationId: null };
  const name = contract.targetName || 'the destination world';
  const outcome = contract.mode === 'open'
    ? `Legal delivery complete. Delivered at ${name}. Paid ${legal} latinum.`
    : `Covert drop at ${name}. Paid ${covert} latinum. Not a legal delivery. Inspection not cleared.`;
  pushOutcome(book, outcome);
  const trip = contract.mode === 'open'
    ? { token: contract.completionToken, targetIndex: contract.targetIndex }
    : null;
  if (factsBefore && input) input.encounterFacts = factsBefore;
  return baseResult(book, contract, input, {
    ok: true,
    atWorld: true,
    status: 'delivered',
    reason: contract.lastAttempt.reason,
    result: 'delivered',
    latinumDelta: legal + covert,
    legalPayoutDelta: legal,
    covertRewardDelta: covert,
    countedAsLegal: contract.mode === 'open',
    requestTrip: Boolean(trip),
    tripToken: trip ? trip.token : null,
    trips: trip ? [trip] : [],
    completionToken: contract.completionToken,
    outcome,
    podsMoved: true,
    contraband: contract.contraband === true,
  });
}

function runAction(book, input, action) {
  const store = book && storeHas(book) ? book : emptyWorldCargoBook();
  forceCleared(store);
  const rows = selectContracts(store, input, action).map((contract) => serviceOne(store, contract, input || {}, action));
  if (!rows.length) {
    return baseResult(store, null, input, { reason: 'no-contract', result: 'failed', outcome: store.lastOutcome || '' });
  }
  const last = rows[rows.length - 1];
  const trips = rows.flatMap((row) => row.trips || []);
  return {
    ...last,
    rows,
    latinumDelta: rows.reduce((sum, row) => sum + row.latinumDelta, 0),
    legalPayoutDelta: rows.reduce((sum, row) => sum + row.legalPayoutDelta, 0),
    covertRewardDelta: rows.reduce((sum, row) => sum + row.covertRewardDelta, 0),
    requestTrip: trips.length > 0,
    trips,
    tripToken: trips[0]?.token || null,
    countedAsLegal: rows.some((row) => row.countedAsLegal),
    standingDelta: 0,
    inspectionCleared: false,
    customsCleared: false,
    deliveriesPending: deliveriesPending(store),
    podsMoved: rows.some((row) => row.podsMoved),
  };
}

function storeHas(book) {
  return Boolean(book && book.contracts && book.version === WORLD_CARGO_VERSION);
}

export function evaluateWorldService(book, input = {}) {
  const store = storeHas(book) ? book : emptyWorldCargoBook();
  const contract = input.contractId ? store.contracts[String(input.contractId)] : null;
  if (!contract) return baseResult(store, null, input, { reason: 'no-contract', atWorld: false });
  const cloaked = input.cloaked === true;
  const body = atWorldBody(contract, input);
  const actionMatches = contract.mode === 'covert'
    ? input.action === 'drop' && cloaked && input.docked !== true
    : input.action === 'planet-dock' && !cloaked && input.docked === true && Number(input.dockedPlanetIndex) === Number(contract.targetIndex);
  const tons = matchingTons(input.pods, contract);
  const full = tons >= roundNonNeg(contract.tons) && roundNonNeg(contract.tons) > 0;
  return baseResult(store, contract, input, {
    atWorld: body && actionMatches && full && input.checkpointRefused !== true,
    reason: body ? 'at-world-body' : 'not-at-world',
    result: 'evaluate',
  });
}

export function completeWorldCargo(book, input = {}) {
  return runAction(book, input, 'planet-dock');
}

export function dropWorldCargo(book, input = {}) {
  return runAction(book, input, 'drop');
}

export function noteStationNotWorld(book, input = {}) {
  return runAction(book, input, 'station');
}

export function noteHailNotWorld(book, input = {}) {
  return runAction(book, input, 'hail');
}

export function noteWarpNotWorld(book, input = {}) {
  return runAction(book, input, 'warp');
}

export function noteSuspicion(book, input = {}) {
  const store = storeHas(book) ? book : emptyWorldCargoBook();
  forceCleared(store);
  const note = {
    id: `sus-${store.suspicion.length + 1}`,
    contractId: input.contractId ? String(input.contractId) : null,
    text: String(input.text || input.note || 'Patrol notes the drop. Suspicion only.'),
    suspicionOnly: true,
  };
  store.suspicion.push(note);
  pushOutcome(store, note.text);
  return baseResult(store, store.contracts[note.contractId] || null, input, {
    reason: 'suspicion-only',
    result: 'note',
    suspicionOnly: true,
    outcome: note.text,
    firingSolution: input.firingSolution,
    engagement_authorized: input.engagement_authorized,
    pursuit: input.pursuit,
  });
}

export function expireDueContracts(book, input = {}) {
  const store = storeHas(book) ? book : emptyWorldCargoBook();
  forceCleared(store);
  const jumps = Number(input.strategicJumps);
  const expired = [];
  if (!Number.isFinite(jumps)) {
    return { expired, latinumDelta: 0, standingDelta: 0, deliveriesPending: deliveriesPending(store) };
  }
  for (const contract of Object.values(store.contracts)) {
    if (!contract || contract.status !== 'open') continue;
    const due = Number(contract.acceptedAtStrategicJumps) + Number(contract.deadlineSlack);
    if (!(jumps > due)) continue;
    contract.status = 'expired';
    contract.lastAttempt = { result: 'expired', reason: 'deadline', stationId: null };
    const pods = Array.isArray(input.pods) ? input.pods : [];
    for (const pod of pods) {
      if (!pod?.contractId || !sameId(pod.contractId, contract.id)) continue;
      if (String(pod.item || '') !== String(contract.good || '')) continue;
      releasePodLoose(pod);
    }
    pushOutcome(store, `Contract expired. Cargo released as loose freight. Paid 0.`);
    expired.push(contract.id);
  }
  return {
    expired,
    latinumDelta: 0,
    standingDelta: 0,
    assetOverdue: false,
    deliveriesPending: deliveriesPending(store),
    inspectionCleared: false,
    customsCleared: false,
  };
}

export function worldCargoSnapshot(book, extras = {}) {
  const store = restoreWorldCargoBook(book || emptyWorldCargoBook());
  const ids = Object.keys(store.contracts);
  const focus = extras.contractId ? store.contracts[String(extras.contractId)] : store.contracts[ids[ids.length - 1]] || null;
  return {
    version: store.version,
    lockedFromRemastered: false,
    inspectionCleared: false,
    customsCleared: false,
    deliveriesPending: deliveriesPending(store),
    contractCount: ids.length,
    status: focus?.status || null,
    mode: focus?.mode || null,
    contraband: focus?.contraband === true,
    completionToken: focus?.completionToken || null,
    legalPayout: focus?.legalPayout || 0,
    covertReward: focus?.covertReward || 0,
    lastOutcome: store.lastOutcome || '',
    suspicionOnly: store.suspicion.every((note) => note.suspicionOnly === true),
    suspicionCount: store.suspicion.length,
    roeModes: ROE_MODES.slice(),
    offersProtectAll: offersProtectAll() === true,
    bookInsideSystemStates: false,
    saveSlotCount: extras.saveSlotCount ?? null,
    firingSolution: extras.firingSolution,
    engagement_authorized: extras.engagement_authorized,
    pursuit: extras.pursuit,
  };
}

export function requireWorldCargoHelpers() {
  const helpers = [
    emptyWorldCargoBook,
    serializeWorldCargoBook,
    restoreWorldCargoBook,
    enrollWorldCargoContract,
    evaluateWorldService,
    completeWorldCargo,
    dropWorldCargo,
    noteStationNotWorld,
    noteSuspicion,
    expireDueContracts,
    worldCargoSnapshot,
  ];
  for (const helper of helpers) {
    if (typeof helper !== 'function') {
      const error = new Error('world-cargo helper missing');
      error.missing = true;
      throw error;
    }
  }
  if (WORLD_CARGO_LOCKED_FROM_REMASTERED !== false) {
    throw new Error('world cargo remastered lock must stay false');
  }
}
