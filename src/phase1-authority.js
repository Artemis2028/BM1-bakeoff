/**
 * Phase 1 combat attribution and political-authority helpers.
 *
 * Source of truth is the bake-off brief:
 * - docs/revised-development-plan.md §2 (combat credit / pursuit vs range)
 *   and §3 (political identity, capture/reclaim/flag/arrival/restoration)
 * - docs/doctrine/DESIGN-doctrine-v0.2.1.md Phase 1 relationship contract
 * - docs/doctrine/bm1-faction-doctrine.v0.2.1.json phase1Integration
 *
 * This module does not load doctrine JSON. It only encodes the engine
 * behaviors those documents require.
 */

export const PHASE1_REQUIRED_EMPTY_RELATIONS = Object.freeze({
  delpin: { friendly: [], hostile: [] },
  promelli: { friendly: [], hostile: [] },
  sona: { friendly: [], hostile: [] },
  tarellian: { friendly: [], hostile: [] },
  neutral: { friendly: [], hostile: [] },
});

export const MISSING_RELATION_DEFAULT = Object.freeze({
  friendly: [],
  hostile: [],
});

export const PLAYER_COMBAT_CREDITS = Object.freeze(['player', 'playerEscort']);

const warnedUnknownRelationKeys = new Set();

function cloneRelationEntry(entry = MISSING_RELATION_DEFAULT) {
  return {
    friendly: [...(entry.friendly || [])],
    hostile: [...(entry.hostile || [])],
  };
}

function normalizeRelationList(list) {
  return [...new Set((Array.isArray(list) ? list : []).map((value) => String(value || '').toLowerCase()).filter(Boolean))];
}

export function normalizePolityKey(faction = 'neutral') {
  const key = String(faction ?? '').trim().toLowerCase();
  if (!key || key === 'undefined' || key === 'null') return 'neutral';
  return key;
}

/**
 * Phase 1: remove Breen–Dominion friendship both ways without adding hostility,
 * and add explicit empty lists for the required independent keys.
 */
export function applyPhase1RelationContract(relations = {}) {
  const next = {};
  for (const [key, entry] of Object.entries(relations || {})) {
    next[normalizePolityKey(key)] = {
      friendly: normalizeRelationList(entry?.friendly),
      hostile: normalizeRelationList(entry?.hostile),
    };
  }

  const stripFriend = (from, other) => {
    const entry = next[from] || { friendly: [], hostile: [] };
    next[from] = {
      friendly: entry.friendly.filter((faction) => faction !== other),
      hostile: [...entry.hostile],
    };
  };
  stripFriend('dominion', 'breen');
  stripFriend('breen', 'dominion');

  for (const [key, entry] of Object.entries(PHASE1_REQUIRED_EMPTY_RELATIONS)) {
    if (!next[key]) next[key] = cloneRelationEntry(entry);
  }
  return next;
}

export function getDeclaredRelations(relations, faction, options = {}) {
  const key = normalizePolityKey(faction);
  const warn = typeof options.warn === 'function' ? options.warn : null;
  if (Object.prototype.hasOwnProperty.call(relations || {}, key)) {
    return cloneRelationEntry(relations[key]);
  }
  if (warn && !warnedUnknownRelationKeys.has(key)) {
    warnedUnknownRelationKeys.add(key);
    warn(`Phase 1 relation fallback for unknown faction key "${key}": empty friendly/hostile lists (no alliance, immunity, or ceasefire).`);
  }
  return cloneRelationEntry(MISSING_RELATION_DEFAULT);
}

export function resetUnknownRelationWarnings() {
  warnedUnknownRelationKeys.clear();
}

/**
 * Shared neutral / unknown / empty-list independents are not a common command.
 * Same non-neutral polity key is the same organization.
 */
export function factionsAreAligned(relations, a, b, options = {}) {
  const left = normalizePolityKey(a);
  const right = normalizePolityKey(b);
  if (!left || !right) return false;
  if (left === 'neutral' || right === 'neutral') return false;
  if (left === 'unknown' || right === 'unknown') return false;
  if (left === right) return true;
  const leftRel = getDeclaredRelations(relations, left, options);
  const rightRel = getDeclaredRelations(relations, right, options);
  return leftRel.friendly.includes(right) || rightRel.friendly.includes(left);
}

/**
 * Empty lists are not immunity. Check reverse-direction hostility.
 */
export function factionsAreOpposed(relations, a, b, options = {}) {
  const left = normalizePolityKey(a);
  const right = normalizePolityKey(b);
  if (!left || !right || left === right) return false;
  if (left === 'neutral' || right === 'neutral') return false;
  if (left === 'borg' || right === 'borg') return true;
  if (left === 'pirate' || right === 'pirate') return true;
  const leftRel = getDeclaredRelations(relations, left, options);
  const rightRel = getDeclaredRelations(relations, right, options);
  return leftRel.hostile.includes(right) || rightRel.hostile.includes(left);
}

export function grantsPlayerCombatCredit(credit) {
  return PLAYER_COMBAT_CREDITS.includes(String(credit || ''));
}

export function resolveActorCombatCredit(actor = {}) {
  if (actor.credit) return actor.credit;
  if (actor.role === 'playerEscort' && actor.fleetId) return 'playerEscort';
  if (actor.owner === 'player' || actor.source === 'player') return 'player';
  if (actor.owner === 'station' || actor.source === 'station') return 'station';
  return 'npc';
}

export function applyDestructionPayout({ credit, reward = 0, standingDelta = 0, featGranted = false }) {
  if (!grantsPlayerCombatCredit(credit)) {
    return { reward: 0, standingDelta: 0, featGranted: false, credited: false };
  }
  return {
    reward: Math.max(0, Number(reward) || 0),
    standingDelta: Number(standingDelta) || 0,
    featGranted: Boolean(featGranted),
    credited: true,
  };
}

export function isWithinFireRange(distance, weaponRange) {
  return Number(distance) <= Number(weaponRange);
}

export function isWithinPursuitRange(distance, pursuitRange) {
  return Number(distance) <= Number(pursuitRange);
}

export function getNpcPursuitRange(weaponRange, baselinePursuitRange) {
  const fire = Math.max(0, Number(weaponRange) || 0);
  const pursue = Math.max(0, Number(baselinePursuitRange) || 0);
  return Math.max(pursue, fire);
}

export function getPlayerCommandIdentity(playerSide, playerFaction) {
  const side = normalizePolityKey(playerSide);
  if (side && side !== 'neutral' && side !== 'unknown') return side;
  return normalizePolityKey(playerFaction);
}

/**
 * Sharing a flag grants access, not control of that government's worlds.
 */
export function playerHoldsSystem(controlledSystems, systemIndex) {
  return (Array.isArray(controlledSystems) ? controlledSystems : [])
    .some((index) => Number(index) === Number(systemIndex));
}

export function isStationTransferableFromHolder(station, previousHolder) {
  if (!station || station.destroyed) return false;
  if (station.builtByPlayer) return false;
  if (station.privateInstallation || station.ownerKind === 'private') return false;
  if (station.eligibleForTransfer === false) return false;
  if (station.eligibleForTransfer === true) return true;
  const owner = normalizePolityKey(station.faction || previousHolder || 'neutral');
  const holder = normalizePolityKey(previousHolder || 'neutral');
  if (!holder || holder === 'neutral' || holder === 'unknown') {
    return !station.faction || owner === holder;
  }
  return owner === holder;
}

export function retainStationOwnerOnControlChange(station, previousHolder) {
  return !isStationTransferableFromHolder(station, previousHolder);
}

export function shouldPreserveNpcIdentity(ship = {}) {
  if (!ship || typeof ship !== 'object') return false;
  if (ship.destroyed) return true;
  const shipId = Number(ship.shipId);
  const faction = String(ship.faction || '').trim();
  const name = String(ship.name || '').trim();
  const commanded = Boolean(ship.fleetId || ship.role === 'playerEscort' || ship.role === 'playerFleet');
  return commanded || (Number.isFinite(shipId) && shipId > 0 && (Boolean(faction) || Boolean(name)));
}

export function preserveNpcIdentityFields(ship = {}) {
  return {
    shipId: ship.shipId,
    name: ship.name,
    faction: ship.faction,
    role: ship.role,
    fleetId: ship.fleetId,
    attackId: ship.attackId,
    destination: ship.destination,
    destinationName: ship.destinationName,
  };
}

/**
 * Arrival protection is personal. It must not delete hostile fleets,
 * erase orders, or rewrite ownership.
 */
export function applyPersonalArrivalProtection(scene = {}, now = 0, durationMs = 20000) {
  const ships = Array.isArray(scene.ships) ? scene.ships.map((ship) => ({ ...ship })) : [];
  const stations = Array.isArray(scene.stations) ? scene.stations.map((station) => ({ ...station })) : [];
  return {
    spawnProtectionUntil: Number(now) + Number(durationMs),
    ships,
    stations,
    fleetsRemoved: 0,
    ordersCleared: 0,
    ownershipRewritten: 0,
  };
}

export function resolveBaseSystemFaction({ governmentId, mappedFactions = {}, nameFallback = '' } = {}) {
  const gov = Number(governmentId);
  if (Number.isFinite(gov) && Object.prototype.hasOwnProperty.call(mappedFactions, gov)) {
    return mappedFactions[gov];
  }
  if (Number.isFinite(gov) && !Object.prototype.hasOwnProperty.call(mappedFactions, gov)) {
    return `custom:${gov}`;
  }
  const fallback = String(nameFallback || '').trim();
  return fallback || 'unknown';
}

export function flagShareGrantsSystemControl() {
  return false;
}
