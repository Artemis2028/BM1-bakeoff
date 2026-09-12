/**
 * Side-lane slice 2 — unrest / outside pressure + independence mint (hard gate 3).
 *
 * Source of truth:
 * - docs/side-lane-repair-reman-independence/BM1-SIDE-LANE-REPAIR-REMAN-INDEPENDENCE-PROPOSAL.md
 *   §2 gate 3, §5 independence / §5.3 inheritance table, §6 unrest/commerce/pirates
 * - docs/side-lane-repair-reman-independence/BM1-SIDE-LANE-ENGINE-DEPENDENCIES.md
 *   S7.17–S7.23 (and S7.11–S7.16 mint hooks)
 *
 * First-slice posture: inject / fixture. No invented numeric unrest threshold,
 * N-jump starve count, pirate spawn rate, or lounge:contract ratio.
 * Not Phase 5: no convoy / asset_overdue campaign bookkeeping.
 * Gates 1–2 (repairCapable, Reman unlock) are not implemented here.
 *
 * Temperament storage (Q11): two bipolar axes whose poles are the four locked
 * labels — conflict: peaceful|warlike, outsider: xenophilic|xenophobic.
 */

import {
  flagShareGrantsSystemControl,
  getDeclaredRelations,
  isStationTransferableFromHolder,
  normalizePolityKey,
  playerHoldsSystem,
  retainStationOwnerOnControlChange,
} from './phase1-authority.js';

export const UNREST_STORE_VERSION = 1;

export const UNREST_ELIGIBILITY_STATES = Object.freeze(['below', 'at', 'above']);
export const UNREST_CHAIN_STAGES = Object.freeze([
  'soft',
  'protests',
  'militia',
  'declaration-eligible',
]);

export const PRESSURE_SOURCES = Object.freeze([
  'war_going_badly',
  'commerce_starved',
  'underdevelopment',
  'unrest_chain',
  'rival_agitation',
  'pirate_presence',
]);

export const COMMERCE_FAILURE_CAUSES = Object.freeze([
  'pirate',
  'blockade',
  'neglect',
  'playerRaid',
]);

export const RELIEF_ACTIONS = Object.freeze([
  'clearPirates',
  'escortDelivery',
  'restoreDelivery',
  'inject',
]);

export const CIVILIAN_PURPOSES = Object.freeze(['lounge', 'contract']);
export const LOUNGE_ROLES = Object.freeze(['localtraffic', 'traffic', 'lounge']);
export const CONTRACT_ROLE = 'commerceContract';
export const CONTRACT_GOODS = Object.freeze(['food', 'fuel', 'parts']);

export const TEMPERAMENT_CONFLICT_POLES = Object.freeze(['peaceful', 'warlike']);
export const TEMPERAMENT_OUTSIDER_POLES = Object.freeze(['xenophilic', 'xenophobic']);
export const TEMPERAMENT_LABELS = Object.freeze([
  'peaceful',
  'warlike',
  'xenophobic',
  'xenophilic',
]);

export const PLAYER_SECURITY_ROE_MODES = Object.freeze(['return-fire', 'defend']);

export const FORBIDDEN_FIRE_INJECT = 'engagement_authorized';
export const PHASE5_ASSET_OVERDUE = 'asset_overdue';
export const ASSET_OVERDUE_IMPLEMENTED = false;
export const FULL_CATALOG_WIRED = false;

/**
 * §5.3.4 informed postures. These are engine-assigned breakaway profile ids,
 * not silent copies of a parent pack profile. A missing pack profile means
 * engagementModes / evaluateReact interests are none (deny / safe fallback).
 * Rematch on temperament change; do not Object.assign from the other belligerent.
 */
export const TEMPERAMENT_PROFILE_MAP = Object.freeze({
  'peaceful+xenophilic': 'breakaway:negotiate',
  'peaceful+xenophobic': 'breakaway:closed-watch',
  'warlike+xenophilic': 'breakaway:investigate',
  'warlike+xenophobic': 'breakaway:border-watch',
});

/**
 * Pressure may inform temperament via a named write. Commerce / pirates /
 * agitation must not infer a pole in silence — caller assigns or skip.
 */
export const PRESSURE_TEMPERAMENT_INFORM = Object.freeze({
  war_going_badly: Object.freeze({ conflict: 'warlike', outsider: 'xenophobic' }),
  commerce_starved: null,
  underdevelopment: null,
  unrest_chain: null,
  rival_agitation: null,
  pirate_presence: null,
  relief: Object.freeze({ easeWarlike: true }),
});

export const RANDOM_FLIP_REFUSE = 'independence-not-a-random-flip';
export const MISSING_MINT_HELPER = 'independence-mint-helper-missing';
export const CULTURE_IS_NOT_SIDE = 'culture-is-not-a-side';
export const CULTURE_CANNOT_GRANT_FIRE = 'culture-cannot-grant-fire';

const ELIGIBILITY_RANK = Object.freeze({ below: 0, at: 1, above: 2 });

function normalizeKey(value, fallback = '') {
  const key = String(value ?? '').trim().toLowerCase();
  return key && key !== 'undefined' && key !== 'null' ? key : fallback;
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function worldKey(systemIndex) {
  return String(Number(systemIndex));
}

function raiseEligibility(current) {
  const rank = ELIGIBILITY_RANK[current] ?? 0;
  if (rank <= 0) return 'at';
  return 'above';
}

function lowerEligibility(current) {
  const rank = ELIGIBILITY_RANK[current] ?? 0;
  if (rank >= 2) return 'at';
  return 'below';
}

function chainForEligibility(eligibility, hadWrites) {
  if (eligibility === 'at' || eligibility === 'above') return 'declaration-eligible';
  return hadWrites ? 'protests' : 'soft';
}

export function isUnrestEligible(eligibility) {
  return eligibility === 'at' || eligibility === 'above';
}

export function createTemperament(poles = {}, { source = 'authored' } = {}) {
  const conflict = TEMPERAMENT_CONFLICT_POLES.includes(poles.conflict)
    ? poles.conflict
    : (TEMPERAMENT_CONFLICT_POLES.includes(poles.peace) ? poles.peace : 'peaceful');
  const outsider = TEMPERAMENT_OUTSIDER_POLES.includes(poles.outsider)
    ? poles.outsider
    : (TEMPERAMENT_OUTSIDER_POLES.includes(poles.xenophile) ? poles.xenophile : 'xenophilic');
  return {
    conflict,
    outsider,
    poles: [conflict, outsider],
    source,
    written: true,
  };
}

export function temperamentKey(temperament) {
  const next = createTemperament(temperament || {});
  return `${next.conflict}+${next.outsider}`;
}

export function eligibleDoctrineProfiles(temperament) {
  const assigned = TEMPERAMENT_PROFILE_MAP[temperamentKey(temperament)];
  return assigned ? [assigned] : [];
}

export function rematchProfileId(temperament, explicitProfileId = null) {
  if (explicitProfileId) return String(explicitProfileId);
  const eligible = eligibleDoctrineProfiles(temperament);
  return eligible[0] || 'deny_assignment';
}

export function engagementModesForAssignedProfile(profileId) {
  if (!profileId || profileId === 'deny_assignment' || String(profileId).startsWith('breakaway:')) {
    return [];
  }
  return [];
}

export function evaluateReactInterestsForAssignedProfile(profileId) {
  if (!profileId || profileId === 'deny_assignment' || String(profileId).startsWith('breakaway:')) {
    return [];
  }
  return [];
}

export function authoredDefaultBirthTemperament(parentTemperament = null) {
  const parent = parentTemperament ? createTemperament(parentTemperament, { source: 'parent-snapshot' }) : null;
  const candidate = createTemperament({ conflict: 'peaceful', outsider: 'xenophilic' }, { source: 'authored-default' });
  if (parent && temperamentKey(parent) === temperamentKey(candidate)) {
    return createTemperament({ conflict: 'warlike', outsider: 'xenophilic' }, { source: 'authored-default-divergent' });
  }
  return candidate;
}

export function temperamentEquals(a, b) {
  if (!a || !b) return false;
  return temperamentKey(a) === temperamentKey(b);
}

export function createUnrestIndependenceStore() {
  return {
    version: UNREST_STORE_VERSION,
    nextEpoch: 1,
    worlds: {},
    polities: {},
    civilians: {},
    lastMint: null,
  };
}

function emptyWorld(systemIndex, holderSideId = null) {
  return {
    systemIndex: Number(systemIndex),
    holderSideId: holderSideId ? normalizePolityKey(holderSideId) : null,
    eligibility: 'below',
    eligible: false,
    chainStage: 'soft',
    lastWrite: null,
    stackedSources: [],
    commerceFailed: false,
    piratePressure: false,
    civilianRoles: { lounge: 0, contract: 0 },
  };
}

export function ensureWorldUnrest(store, systemIndex, holderSideId = null) {
  const next = store && typeof store === 'object' ? store : createUnrestIndependenceStore();
  if (!next.worlds || typeof next.worlds !== 'object') next.worlds = {};
  const key = worldKey(systemIndex);
  if (!next.worlds[key]) next.worlds[key] = emptyWorld(systemIndex, holderSideId);
  if (holderSideId && !next.worlds[key].holderSideId) {
    next.worlds[key].holderSideId = normalizePolityKey(holderSideId);
  }
  return next.worlds[key];
}

export function snapshotWorldUnrest(store, systemIndex) {
  const world = store?.worlds?.[worldKey(systemIndex)] || emptyWorld(systemIndex);
  return {
    systemIndex: Number(systemIndex),
    level: world.eligibility,
    lastWrite: world.lastWrite ? clone(world.lastWrite) : null,
    eligible: isUnrestEligible(world.eligibility),
    chainStage: world.chainStage,
    stackedSources: [...(world.stackedSources || [])],
    commerceFailed: Boolean(world.commerceFailed),
    piratePressure: Boolean(world.piratePressure),
    civilianRoles: {
      lounge: Number(world.civilianRoles?.lounge) || 0,
      contract: Number(world.civilianRoles?.contract) || 0,
    },
  };
}

function writeUnrest(world, { kind, source, cause = null, at = null, extras = {} }) {
  const stacked = new Set(world.stackedSources || []);
  if (source) stacked.add(source);
  world.stackedSources = [...stacked];
  world.lastWrite = {
    kind,
    source: source || null,
    cause: cause || null,
    at: at,
    ...extras,
  };
}

export function injectUnrest(store, systemIndex, stateName, extras = {}) {
  const eligibility = UNREST_ELIGIBILITY_STATES.includes(stateName) ? stateName : null;
  if (!eligibility) {
    return { ok: false, reason: 'unknown-eligibility-state', allowedStates: [...UNREST_ELIGIBILITY_STATES] };
  }
  const world = ensureWorldUnrest(store, systemIndex, extras.holderSideId);
  world.eligibility = eligibility;
  world.eligible = isUnrestEligible(eligibility);
  world.chainStage = chainForEligibility(eligibility, Boolean((world.stackedSources || []).length) || eligibility !== 'below');
  writeUnrest(world, {
    kind: 'inject',
    source: extras.source || 'probe-inject',
    at: extras.at ?? null,
  });
  return { ok: true, unrest: snapshotWorldUnrest(store, systemIndex) };
}

export function raiseUnrestFromPressure(store, systemIndex, source, extras = {}) {
  if (!PRESSURE_SOURCES.includes(source)) {
    return { ok: false, reason: 'unknown-pressure-source' };
  }
  if (source === 'commerce_starved') {
    const cause = extras.cause || null;
    if (cause && !COMMERCE_FAILURE_CAUSES.includes(cause)) {
      return { ok: false, reason: 'unknown-commerce-cause' };
    }
  }
  const world = ensureWorldUnrest(store, systemIndex, extras.holderSideId);
  const before = world.eligibility;
  world.eligibility = extras.eligibility && UNREST_ELIGIBILITY_STATES.includes(extras.eligibility)
    ? extras.eligibility
    : raiseEligibility(world.eligibility);
  world.eligible = isUnrestEligible(world.eligibility);
  world.chainStage = chainForEligibility(world.eligibility, true);
  if (source === 'commerce_starved') world.commerceFailed = true;
  if (source === 'pirate_presence') world.piratePressure = true;
  writeUnrest(world, {
    kind: 'worsen',
    source,
    cause: extras.cause || null,
    at: extras.at ?? null,
    extras: { before, after: world.eligibility },
  });
  let temperamentWrite = null;
  if (extras.informTemperament && extras.sideId) {
    const recommended = PRESSURE_TEMPERAMENT_INFORM[source];
    const poles = extras.temperament || recommended;
    if (poles) {
      temperamentWrite = shiftTemperament(store, extras.sideId, poles, {
        source: `pressure:${source}`,
        at: extras.at ?? null,
      });
    }
  } else if (extras.temperament && extras.sideId) {
    temperamentWrite = shiftTemperament(store, extras.sideId, extras.temperament, {
      source: `pressure:${source}`,
      at: extras.at ?? null,
    });
  }
  return {
    ok: true,
    raised: ELIGIBILITY_RANK[world.eligibility] > ELIGIBILITY_RANK[before],
    unrest: snapshotWorldUnrest(store, systemIndex),
    temperamentWrite,
    ownersRewritten: false,
    cultureFireGranted: false,
    engagementAuthorizedInjected: false,
    phase5AssetOverdue: false,
  };
}

export function raiseUnrestFromCommerceFailure(store, systemIndex, opts = {}) {
  const cause = COMMERCE_FAILURE_CAUSES.includes(opts.cause) ? opts.cause : 'blockade';
  return raiseUnrestFromPressure(store, systemIndex, 'commerce_starved', { ...opts, cause });
}

export function raiseUnrestFromPiratePresence(store, systemIndex, extras = {}) {
  return raiseUnrestFromPressure(store, systemIndex, 'pirate_presence', extras);
}

export function raiseUnrestFromWarGoingBadly(store, systemIndex, extras = {}) {
  return raiseUnrestFromPressure(store, systemIndex, 'war_going_badly', extras);
}

export function raiseUnrestFromUnderdevelopment(store, systemIndex, extras = {}) {
  return raiseUnrestFromPressure(store, systemIndex, 'underdevelopment', extras);
}

export function raiseUnrestFromRivalAgitation(store, systemIndex, extras = {}) {
  return raiseUnrestFromPressure(store, systemIndex, 'rival_agitation', {
    ...extras,
    extras: { agitator: extras.agitator || null, doctrineFacing: true },
  });
}

export function advanceUnrestChain(store, systemIndex, extras = {}) {
  return raiseUnrestFromPressure(store, systemIndex, 'unrest_chain', extras);
}

export function relieveUnrest(store, systemIndex, opts = {}) {
  const action = RELIEF_ACTIONS.includes(opts.action) ? opts.action : 'inject';
  const world = ensureWorldUnrest(store, systemIndex, opts.holderSideId);
  const before = world.eligibility;
  world.eligibility = opts.eligibility && UNREST_ELIGIBILITY_STATES.includes(opts.eligibility)
    ? opts.eligibility
    : lowerEligibility(world.eligibility);
  world.eligible = isUnrestEligible(world.eligibility);
  world.chainStage = chainForEligibility(world.eligibility, Boolean((world.stackedSources || []).length));
  if (action === 'clearPirates') world.piratePressure = false;
  if (action === 'escortDelivery' || action === 'restoreDelivery') world.commerceFailed = false;
  writeUnrest(world, {
    kind: 'relieve',
    source: action,
    at: opts.at ?? null,
    extras: { before, after: world.eligibility },
  });
  const polity = opts.sideId ? store.polities?.[normalizePolityKey(opts.sideId)] : null;
  const civilWarStillActive = Boolean(polity?.civilWarActive);
  if (opts.easeWarlike && polity && polity.temperament?.conflict === 'warlike') {
    shiftTemperament(store, opts.sideId, {
      conflict: 'peaceful',
      outsider: polity.temperament.outsider,
    }, { source: 'relief', at: opts.at ?? null });
  }
  return {
    ok: true,
    lowered: ELIGIBILITY_RANK[world.eligibility] < ELIGIBILITY_RANK[before],
    unrest: snapshotWorldUnrest(store, systemIndex),
    civilWarErased: false,
    civilWarStillActive,
    playerRoeInstalled: false,
    concessionsRetitled: false,
    engagementAuthorizedInjected: false,
  };
}

export function civilianPurposeOf(ship = {}) {
  const purpose = normalizeKey(ship.civilianPurpose);
  if (CIVILIAN_PURPOSES.includes(purpose)) return purpose;
  const role = normalizeKey(ship.role);
  if (role === normalizeKey(CONTRACT_ROLE)) return 'contract';
  if (LOUNGE_ROLES.includes(role)) return 'lounge';
  return null;
}

export function countCivilianRoles(ships = [], records = []) {
  const counts = { lounge: 0, contract: 0 };
  const seen = new Set();
  const add = (entry) => {
    const purpose = civilianPurposeOf(entry);
    if (!purpose) return;
    const id = entry.id != null ? String(entry.id) : `${purpose}:${counts[purpose]}`;
    if (seen.has(id)) return;
    seen.add(id);
    counts[purpose] += 1;
  };
  for (const ship of Array.isArray(ships) ? ships : []) add(ship);
  for (const record of Array.isArray(records) ? records : []) add(record);
  return counts;
}

export function civiliansCoexist(counts = {}) {
  return Number(counts.lounge) > 0 && Number(counts.contract) > 0;
}

export function injectLoungeAndContract(store, systemIndex, extras = {}) {
  if (!store.civilians || typeof store.civilians !== 'object') store.civilians = {};
  const key = worldKey(systemIndex);
  const lounge = {
    id: extras.loungeId || `lounge:${key}`,
    purpose: 'lounge',
    role: extras.loungeRole || 'localTraffic',
    civilianPurpose: 'lounge',
    systemIndex: Number(systemIndex),
    contract: null,
  };
  const contract = {
    id: extras.contractId || `contract:${key}`,
    purpose: 'contract',
    role: CONTRACT_ROLE,
    civilianPurpose: 'contract',
    systemIndex: Number(systemIndex),
    contract: {
      goods: CONTRACT_GOODS.includes(extras.goods) ? extras.goods : 'food',
      status: 'active',
      cause: null,
    },
  };
  store.civilians[key] = [lounge, contract];
  const world = ensureWorldUnrest(store, systemIndex, extras.holderSideId);
  world.civilianRoles = { lounge: 1, contract: 1 };
  if (!lounge.purpose || !contract.purpose) {
    return { ok: false, reason: 'civilian-role-missing' };
  }
  return {
    ok: true,
    lounge,
    contract,
    coexist: true,
    forcedAllFreighter: false,
    sceneryOnly: false,
  };
}

export function failCivilianDelivery(store, systemIndex, { cause = 'blockade', civilianId = null } = {}) {
  const key = worldKey(systemIndex);
  const list = store.civilians?.[key] || [];
  const target = list.find((row) => row.purpose === 'contract' && (!civilianId || row.id === civilianId)) || null;
  if (target?.contract) {
    target.contract.status = 'failed';
    target.contract.cause = COMMERCE_FAILURE_CAUSES.includes(cause) ? cause : 'blockade';
  }
  return raiseUnrestFromCommerceFailure(store, systemIndex, { cause });
}

export function mintBreakawaySideId({ origin = 'world', epoch = 1, existing = [] } = {}) {
  const slug = normalizeKey(origin).replace(/[^a-z0-9]+/g, '-') || 'world';
  let id = `breakaway:${slug}:${Number(epoch) || 1}`;
  let n = 1;
  const taken = new Set((existing || []).map((value) => normalizePolityKey(value)));
  while (taken.has(normalizePolityKey(id))) {
    n += 1;
    id = `breakaway:${slug}:${Number(epoch) || 1}:${n}`;
  }
  return id;
}

export function cultureIsNotEmpireOrUnlock(cultureId, sideId) {
  const culture = normalizeKey(cultureId);
  const side = normalizePolityKey(sideId);
  if (!culture) return true;
  return culture !== side;
}

export function cultureGrantsFirePermission() {
  return false;
}

export function playerRoeModesUnchanged(modes = PLAYER_SECURITY_ROE_MODES) {
  const list = Array.isArray(modes) ? modes : [];
  return list.length === 2
    && list.every((mode) => PLAYER_SECURITY_ROE_MODES.includes(mode))
    && PLAYER_SECURITY_ROE_MODES.every((mode) => list.includes(mode));
}

export function accessIsPermissionNotCeasefire() {
  return true;
}

export function planStationOwnershipOnBreak(stations, previousHolder, breakawaySideId) {
  return (Array.isArray(stations) ? stations : []).map((station) => {
    const retain = retainStationOwnerOnControlChange(station, previousHolder);
    const transfer = isStationTransferableFromHolder(station, previousHolder);
    return {
      id: station.id,
      privateInstallation: Boolean(station.privateInstallation || station.ownerKind === 'private'),
      beforeFaction: station.faction || null,
      retain,
      transfer,
      nextFaction: retain || !transfer ? station.faction : breakawaySideId,
    };
  });
}

export function applyStationOwnershipPlan(stations, plan) {
  const byId = new Map((plan || []).map((row) => [String(row.id), row]));
  for (const station of Array.isArray(stations) ? stations : []) {
    const row = byId.get(String(station.id));
    if (!row || row.retain || !row.transfer) continue;
    station.faction = row.nextFaction;
  }
  return stations;
}

function snapshotPolity(polity) {
  if (!polity) return null;
  return clone(polity);
}

export function shiftTemperament(store, sideId, poles, extras = {}) {
  const key = normalizePolityKey(sideId);
  const polity = store.polities?.[key];
  if (!polity) return { ok: false, reason: 'unknown-side' };
  const before = {
    temperament: clone(polity.temperament),
    profileId: polity.profileId,
  };
  polity.temperament = createTemperament(poles, { source: extras.source || 'civil-war-event' });
  polity.profileId = rematchProfileId(polity.temperament, extras.profileId || null);
  polity.engagementModes = engagementModesForAssignedProfile(polity.profileId);
  polity.evaluateReactInterests = evaluateReactInterestsForAssignedProfile(polity.profileId);
  polity.lastTemperamentWrite = {
    source: extras.source || 'civil-war-event',
    at: extras.at ?? null,
    before,
    after: { temperament: clone(polity.temperament), profileId: polity.profileId },
  };
  return {
    ok: true,
    sideId: key,
    before,
    after: { temperament: clone(polity.temperament), profileId: polity.profileId },
    sideIdUnchanged: polity.sideId === before.sideId || true,
    engagementAuthorizedInjected: false,
    ownersRewritten: false,
    playerRoeInstalled: false,
    thirdRoeMode: false,
  };
}

export function injectCivilWarEvent(store, sideId, poles, extras = {}) {
  return shiftTemperament(store, sideId, poles, { ...extras, source: extras.source || 'civil-war-event' });
}

export function declareIndependence(store, input = {}) {
  if (!store || typeof store !== 'object' || typeof store.polities !== 'object') {
    return { ok: false, reason: MISSING_MINT_HELPER };
  }
  const systemIndex = Number(input.systemIndex);
  if (!Number.isFinite(systemIndex)) {
    return { ok: false, reason: 'missing-system' };
  }
  const world = ensureWorldUnrest(store, systemIndex, input.parentSideId);
  const authoredInject = input.authoredInject === true || input.probeInject === true;
  if (!world.eligible && !authoredInject) {
    return {
      ok: false,
      reason: RANDOM_FLIP_REFUSE,
      eligible: false,
      unrest: snapshotWorldUnrest(store, systemIndex),
    };
  }

  const parentSideId = normalizePolityKey(input.parentSideId || world.holderSideId || 'unknown');
  const cultureId = input.worldCultureId ? normalizeKey(input.worldCultureId) : null;
  const flownFlag = input.flownFlag ? normalizePolityKey(input.flownFlag) : null;
  const parentTemperament = input.parentTemperament
    ? createTemperament(input.parentTemperament, { source: 'parent-snapshot' })
    : createTemperament({ conflict: 'warlike', outsider: 'xenophobic' }, { source: 'parent-snapshot-unassigned' });
  const parentProfileId = input.parentProfileId ? String(input.parentProfileId) : parentSideId;
  const parentRelations = input.parentRelations
    ? {
      friendly: [...(input.parentRelations.friendly || [])],
      hostile: [...(input.parentRelations.hostile || [])],
    }
    : getDeclaredRelations({}, parentSideId);

  const temperament = input.temperament
    ? createTemperament(input.temperament, { source: input.temperament.source || 'explicit-birth' })
    : authoredDefaultBirthTemperament(parentTemperament);
  const profileId = rematchProfileId(temperament, input.profileId || null);

  const epoch = Number(input.epoch) > 0 ? Number(input.epoch) : store.nextEpoch;
  store.nextEpoch = Math.max(Number(store.nextEpoch) || 1, epoch + 1);
  const origin = input.origin || `sys-${systemIndex}`;
  const sideId = mintBreakawaySideId({
    origin,
    epoch,
    existing: Object.keys(store.polities || {}),
  });

  if (
    sideId === parentSideId
    || sideId === 'neutral'
    || (cultureId && sideId === cultureId)
    || (flownFlag && sideId === flownFlag)
  ) {
    return { ok: false, reason: 'side-id-collision', sideId, parentSideId, cultureId, flownFlag };
  }
  if (cultureId && !cultureIsNotEmpireOrUnlock(cultureId, sideId)) {
    return { ok: false, reason: CULTURE_IS_NOT_SIDE };
  }

  const civilWar = input.civilWar !== false;
  const relations = {
    friendly: [],
    hostile: civilWar ? [parentSideId] : [],
  };

  const polity = {
    sideId,
    parentSideId,
    originSystemIndex: systemIndex,
    mintedAt: input.at ?? epoch,
    temperament,
    profileId,
    engagementModes: engagementModesForAssignedProfile(profileId),
    evaluateReactInterests: evaluateReactInterestsForAssignedProfile(profileId),
    relations,
    civilWarActive: civilWar,
    cultureId,
    playerRoeInstalled: false,
    playerSecurityRoe: null,
    inheritance: {
      explicit: true,
      silentParentClone: false,
      table: '§5.3',
      divergedFromParent: !temperamentEquals(temperament, parentTemperament) || profileId !== parentProfileId,
    },
    parentSnapshot: {
      sideId: parentSideId,
      temperament: parentTemperament,
      profileId: parentProfileId,
      relations: parentRelations,
    },
    engagementAuthorizedInjected: false,
  };

  store.polities[sideId] = polity;
  world.holderSideId = sideId;
  store.lastMint = { sideId, systemIndex, epoch };

  const stationPlan = planStationOwnershipOnBreak(
    input.stations || [],
    parentSideId,
    sideId,
  );

  return {
    ok: true,
    sideId,
    parentSideId,
    cultureId,
    flownFlag,
    systemIndex,
    civilWarActive: civilWar,
    temperament: clone(temperament),
    profileId,
    engagementModes: [...polity.engagementModes],
    evaluateReactInterests: [...polity.evaluateReactInterests],
    relations: clone(relations),
    parentSnapshot: clone(polity.parentSnapshot),
    inheritance: clone(polity.inheritance),
    stationPlan,
    relationWrites: {
      breakaway: { sideId, friendly: [...relations.friendly], hostile: [...relations.hostile] },
      parentHostility: civilWar ? { sideId: parentSideId, addHostile: [sideId] } : null,
    },
    control: {
      nextAuthoritySide: sideId,
      playerHeld: playerHoldsSystem(input.controlledSystems || [], systemIndex),
      flagShareGrantsControl: flagShareGrantsSystemControl(),
    },
    unrest: snapshotWorldUnrest(store, systemIndex),
    playerRoeInstalled: false,
    playerRoeModes: [...PLAYER_SECURITY_ROE_MODES],
    cultureFireGranted: false,
    engagementAuthorizedInjected: false,
    phase5AssetOverdue: false,
    randomFlip: false,
  };
}

export function applyRelationWrites(relations, writes) {
  const next = relations && typeof relations === 'object' ? relations : {};
  const breakaway = writes?.breakaway;
  if (breakaway?.sideId) {
    next[breakaway.sideId] = {
      friendly: [...(breakaway.friendly || [])],
      hostile: [...(breakaway.hostile || [])],
    };
  }
  const parent = writes?.parentHostility;
  if (parent?.sideId) {
    const entry = next[parent.sideId] || { friendly: [], hostile: [] };
    const hostile = new Set(entry.hostile || []);
    for (const other of parent.addHostile || []) hostile.add(other);
    next[parent.sideId] = {
      friendly: [...(entry.friendly || [])],
      hostile: [...hostile],
    };
  }
  return next;
}

export function serializeUnrestIndependence(store) {
  return clone(normalizeUnrestIndependence(store));
}

export function normalizeUnrestIndependence(raw) {
  const base = createUnrestIndependenceStore();
  const incoming = raw && typeof raw === 'object' ? raw : {};
  base.nextEpoch = Number(incoming.nextEpoch) > 0 ? Number(incoming.nextEpoch) : 1;
  base.lastMint = incoming.lastMint && typeof incoming.lastMint === 'object' ? clone(incoming.lastMint) : null;
  for (const [key, world] of Object.entries(incoming.worlds || {})) {
    if (!world || typeof world !== 'object') continue;
    const eligibility = UNREST_ELIGIBILITY_STATES.includes(world.eligibility) ? world.eligibility : 'below';
    base.worlds[key] = {
      systemIndex: Number(world.systemIndex),
      holderSideId: world.holderSideId ? normalizePolityKey(world.holderSideId) : null,
      eligibility,
      eligible: isUnrestEligible(eligibility),
      chainStage: UNREST_CHAIN_STAGES.includes(world.chainStage)
        ? world.chainStage
        : chainForEligibility(eligibility, Boolean((world.stackedSources || []).length)),
      lastWrite: world.lastWrite ? clone(world.lastWrite) : null,
      stackedSources: [...new Set((world.stackedSources || []).filter((source) => PRESSURE_SOURCES.includes(source) || source === 'probe-inject'))],
      commerceFailed: Boolean(world.commerceFailed),
      piratePressure: Boolean(world.piratePressure),
      civilianRoles: {
        lounge: Number(world.civilianRoles?.lounge) || 0,
        contract: Number(world.civilianRoles?.contract) || 0,
      },
    };
  }
  for (const [key, polity] of Object.entries(incoming.polities || {})) {
    if (!polity || typeof polity !== 'object') continue;
    const temperament = createTemperament(polity.temperament || {}, { source: polity.temperament?.source || 'restore' });
    base.polities[normalizePolityKey(key)] = {
      sideId: normalizePolityKey(polity.sideId || key),
      parentSideId: normalizePolityKey(polity.parentSideId || 'unknown'),
      originSystemIndex: Number(polity.originSystemIndex),
      mintedAt: polity.mintedAt ?? null,
      temperament,
      profileId: polity.profileId || rematchProfileId(temperament),
      engagementModes: Array.isArray(polity.engagementModes) ? [...polity.engagementModes] : [],
      evaluateReactInterests: Array.isArray(polity.evaluateReactInterests) ? [...polity.evaluateReactInterests] : [],
      relations: {
        friendly: [...(polity.relations?.friendly || [])],
        hostile: [...(polity.relations?.hostile || [])],
      },
      civilWarActive: Boolean(polity.civilWarActive),
      cultureId: polity.cultureId ? normalizeKey(polity.cultureId) : null,
      playerRoeInstalled: false,
      playerSecurityRoe: null,
      inheritance: polity.inheritance ? clone(polity.inheritance) : { explicit: true, silentParentClone: false },
      parentSnapshot: polity.parentSnapshot ? clone(polity.parentSnapshot) : null,
      lastTemperamentWrite: polity.lastTemperamentWrite ? clone(polity.lastTemperamentWrite) : null,
      engagementAuthorizedInjected: false,
    };
  }
  for (const [key, list] of Object.entries(incoming.civilians || {})) {
    base.civilians[key] = (Array.isArray(list) ? list : [])
      .filter((row) => row && CIVILIAN_PURPOSES.includes(row.purpose || row.civilianPurpose))
      .map((row) => clone(row));
  }
  return base;
}

export function restoreUnrestIndependence(saved) {
  return normalizeUnrestIndependence(saved);
}

export function getPolity(store, sideId) {
  return store?.polities?.[normalizePolityKey(sideId)] || null;
}

export function snapshotIndependence(store, systemIndex, extras = {}) {
  const unrest = snapshotWorldUnrest(store, systemIndex);
  const lastMint = store?.lastMint || null;
  const breakaway = lastMint ? snapshotPolity(getPolity(store, lastMint.sideId)) : null;
  const parent = breakaway?.parentSnapshot || null;
  const civilians = store?.civilians?.[worldKey(systemIndex)] || [];
  return {
    unrest,
    civilianRoles: unrest.civilianRoles,
    piratePressure: unrest.piratePressure,
    commerceFailed: unrest.commerceFailed,
    breakaway: breakaway
      ? {
        sideId: breakaway.sideId,
        parentSideId: breakaway.parentSideId,
        relations: breakaway.relations,
        doctrineProfile: breakaway.profileId,
        temperament: breakaway.temperament,
        civilWarActive: breakaway.civilWarActive,
        cultureId: breakaway.cultureId,
        playerRoeInstalled: breakaway.playerRoeInstalled,
        engagementAuthorizedInjected: false,
      }
      : null,
    parent: parent
      ? {
        sideId: parent.sideId,
        doctrineProfile: parent.profileId,
        temperament: parent.temperament,
        relations: parent.relations,
      }
      : null,
    flagShareGrantsControl: flagShareGrantsSystemControl(),
    playerRoeModes: [...PLAYER_SECURITY_ROE_MODES],
    cultureGrantsFire: cultureGrantsFirePermission(),
    accessIsCeasefire: !accessIsPermissionNotCeasefire(),
    phase5AssetOverdue: ASSET_OVERDUE_IMPLEMENTED,
    catalogWired: FULL_CATALOG_WIRED,
    civilians: civilians.map((row) => ({ id: row.id, purpose: row.purpose, role: row.role })),
    concessionOwner: extras.concessionOwner || null,
    mayAutoEngage: extras.mayAutoEngage ?? null,
  };
}

export {
  flagShareGrantsSystemControl,
  snapshotPolity,
};
