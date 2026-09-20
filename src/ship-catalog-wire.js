/**
 * Catalog wire — bake-off engine meeting point for `bm-ships/`.
 *
 * `bm-ships/ships.json` is authoritative for hull identity, stats, and art
 * envelopes. This module does not crib remastered-work engine code.
 *
 * Rules:
 * - Alias old → survivor before spawn, stock, purchase, and contact ids.
 * - Never resurrect discarded IDs as extra sale/traffic hulls.
 * - getShip (alias only) stays distinct from resolveNewShipId (new refs).
 * - Empty legal spawn pools stay empty (no Gorn / unknown-region fallback).
 * - Reman 53 goes through meetPackPurchaseDecision; Remus is a vendor note.
 * - Standing tiers + pack region gates apply. Money ≠ standing ≠ Reman flag.
 */

import { createShipCatalog } from '../bm-ships/catalog.mjs';
import {
  filterShipStockForRemanAccess,
  hasRemanWarbirdAccess,
  isRemanWarbirdHull,
  meetPackPurchaseDecision,
} from './side-lane-repair-reman.js';

export const CATALOG_WIRED = true;
export const CATALOG_WIRE_VERSION = 1;
export const HOME_FACTION_STANDING = 20;
export const OPEN_FACTION_STANDING = 0;

export const PURCHASE_TIER_STANDING = Object.freeze({
  open: 0,
  trusted: 15,
  respected: 30,
  military: 50,
  strategic: 75,
  excalibur: 100,
  concord: 100,
});

export const PASO_PROJECT_X_VENDOR = 'paso-project-x';
export const PASO_PROJECT_X_HULLS = Object.freeze([49, 347]);
export const REMUS_SECRET_VENDOR = 'remus-secret';
export const INDEPENDENT_ENDGAME_VENDOR = 'independent-endgame';
export const WEAPON_SLOT_COUNT = 3;

const ALIAS_CYCLE = 'Hull alias cycle';

function normalizeKey(value) {
  const key = String(value ?? '').trim().toLowerCase();
  return key && key !== 'undefined' && key !== 'null' ? key : '';
}

function uniqueNumbers(ids = []) {
  const seen = new Set();
  const out = [];
  for (const raw of ids) {
    const id = Number(raw);
    if (!Number.isInteger(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function resolveAliasId(id, aliases = {}) {
  let current = Number(id);
  if (!Number.isFinite(current)) return id;
  const seen = new Set();
  const map = aliases && typeof aliases === 'object' ? aliases : {};
  while (Object.prototype.hasOwnProperty.call(map, current) || Object.prototype.hasOwnProperty.call(map, String(current))) {
    if (seen.has(current)) throw new Error(ALIAS_CYCLE);
    seen.add(current);
    current = Number(map[current] ?? map[String(current)]);
  }
  return current;
}

export function engineImagePath(image = '') {
  const src = String(image || '').trim();
  if (!src) return '';
  if (/^(bm-ships\/|assets\/game\/|https?:)/i.test(src)) return src;
  return `bm-ships/${src.replace(/^\.\//, '')}`;
}

export function toEngineShipRecord(ship) {
  if (!ship || typeof ship !== 'object') return null;
  return {
    ...ship,
    assetType: ship.assetType || 'ship',
    image: engineImagePath(ship.image),
    key: ship.key || `bm-ship:${ship.id}`,
  };
}

export function packDefaultWeaponSlots(ship) {
  const raw = Array.isArray(ship?.defaultWeaponSlots) ? ship.defaultWeaponSlots : null;
  if (!raw) return null;
  const slots = [0, 1, 2].map((index) => {
    const value = raw[index];
    if (value == null || value === false || value === '') return null;
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
  });
  return slots;
}

export function hullIsEmptyButArmable(ship) {
  const slots = packDefaultWeaponSlots(ship);
  return Boolean(slots) && !slots.some(Boolean);
}

export function hullHasCombatHardpoint(ship, slots = packDefaultWeaponSlots(ship), isCombatWeapon = Boolean) {
  const list = Array.isArray(slots) ? slots : packDefaultWeaponSlots(ship) || [];
  return list.some((weaponId) => weaponId && isCombatWeapon(weaponId));
}

export function unarmedNpcCannotFire(ship, slots = packDefaultWeaponSlots(ship), isCombatWeapon = Boolean) {
  if (ship?.armedByDefault === false) return true;
  // Live `[]` means three empty — not “unknown, fill a Phaser.”
  if (Array.isArray(slots) && !slots.some((weaponId) => weaponId && isCombatWeapon(weaponId))) return true;
  return false;
}

export function createStartingStandings(homeFaction, extras = {}) {
  const standings = { ...(extras.standings || {}) };
  const home = normalizeKey(homeFaction);
  if (home) standings[home] = Number.isFinite(Number(standings[home]))
    ? Math.max(Number(standings[home]), HOME_FACTION_STANDING)
    : HOME_FACTION_STANDING;
  return standings;
}

export function resolvePackVendor(station = null, { systemName = '' } = {}) {
  const name = normalizeKey(station?.name);
  const system = normalizeKey(systemName);
  const stock = [
    ...(Array.isArray(station?.stockIds) ? station.stockIds : []),
    ...(Array.isArray(station?.stock?.shipIds) ? station.stock.shipIds : []),
  ].map(Number);
  if (name === 'x-base' || name.includes('project x') || name === 'paso project x') {
    return { vendor: PASO_PROJECT_X_VENDOR, systemName: 'paso' };
  }
  if (name === 'reman starbase' || stock.includes(53)) {
    return { vendor: REMUS_SECRET_VENDOR, systemName: system || 'remus' };
  }
  if (name === 'free swiss reserve exchange' || name.includes('reserve exchange')) {
    return { vendor: INDEPENDENT_ENDGAME_VENDOR, systemName: system };
  }
  return { vendor: name || null, systemName: system };
}

export function catalogPurchaseContext({
  credits = 0,
  standings = {},
  station = null,
  systemName = '',
  vendor = '',
  region = '',
  authorizedDeployment = false,
  extras = {},
} = {}) {
  const resolved = resolvePackVendor(station, { systemName });
  return {
    role: 'purchase',
    credits,
    standings,
    vendor: vendor || resolved.vendor,
    systemName: resolved.systemName || normalizeKey(systemName),
    region: region || extras.region || '',
    authorizedDeployment: authorizedDeployment === true,
    tierThresholds: extras.tierThresholds || PURCHASE_TIER_STANDING,
    ...extras,
  };
}

export function catalogSpawnContext({
  role = 'traffic',
  systemName = '',
  region = '',
  authorizedDeployment = false,
  extras = {},
} = {}) {
  const legalRole = ['traffic', 'patrol', 'localTraffic', 'fleetAttack', 'mission'].includes(role)
    ? role
    : 'traffic';
  return {
    role: legalRole,
    systemName: normalizeKey(systemName),
    region,
    authorizedDeployment: authorizedDeployment === true
      && (legalRole === 'fleetAttack' || legalRole === 'mission'),
    ...extras,
  };
}

export function dedupeHullIds(ids, catalog) {
  const resolved = [];
  const seen = new Set();
  for (const raw of ids) {
    const id = Number(raw);
    if (!Number.isInteger(id)) continue;
    const survivor = catalog ? catalog.resolveNewShipId(id) ?? catalog.getShip(id)?.id : resolveAliasId(id, catalog?.aliases);
    if (!Number.isInteger(survivor) || seen.has(survivor)) continue;
    seen.add(survivor);
    resolved.push(survivor);
  }
  return resolved;
}

export function stockIdsFromCatalog(catalog, context = {}, { faction = null, unlocks = null } = {}) {
  if (!catalog) return [];
  const ids = catalog.ships
    .filter((ship) => ship.rosterState === 'active')
    .filter((ship) => faction == null || ship.faction === faction)
    .filter((ship) => catalog.eligibleForStock(ship.id, context))
    .map((ship) => ship.id);
  const unique = dedupeHullIds(ids, catalog);
  const ships = unique.map((id) => catalog.getShip(id)).filter(Boolean);
  return filterShipStockForRemanAccess(ships, unlocks).map((ship) => ship.id);
}

export function includeRemanWhenUnlocked(ids, catalog, unlocks, context = {}) {
  const list = uniqueNumbers(ids);
  if (!catalog) return list;
  const reman = catalog.getShip(53);
  if (!reman || reman.rosterState !== 'active') return list;
  if (hasRemanWarbirdAccess(unlocks)) {
    if (!list.includes(53)) list.push(53);
    return list;
  }
  if (catalog.eligibleForStock(53, context) && !list.includes(53)) list.push(53);
  return list;
}

export function authoredStockIds(stockIds, catalog, context, unlocks) {
  const resolved = dedupeHullIds(stockIds || [], catalog);
  const kept = resolved.filter((id) => {
    if (!catalog) return true;
    if (isRemanWarbirdHull(id)) return true;
    return catalog.eligibleForStock(id, context);
  });
  return includeRemanWhenUnlocked(kept, catalog, unlocks, context);
}

export function spawnIdsFromCatalog(catalog, context = {}, faction = null) {
  if (!catalog) return [];
  const pool = catalog.spawnPool(context, faction);
  return dedupeHullIds(pool.map((ship) => ship.id), catalog);
}

export function evaluateWiredPurchase(catalog, hullId, unlocks, context = {}) {
  const requested = Number(hullId);
  const survivor = catalog ? (catalog.resolveNewShipId(requested) ?? catalog.getShip(requested)?.id) : requested;
  const ship = catalog?.getShip(survivor) || null;
  if (!ship || ship.rosterState === 'retired') {
    return {
      allowed: false,
      reason: 'unavailable',
      hullId: survivor ?? requested,
      ship: null,
      packDecision: null,
      meeting: null,
    };
  }
  const packDecision = catalog.getPurchaseDecision(survivor, context);
  const meeting = isRemanWarbirdHull(survivor, ship.key)
    ? meetPackPurchaseDecision(packDecision, unlocks, survivor, ship.key)
    : packDecision;
  return {
    allowed: meeting?.allowed === true,
    reason: meeting?.reason || packDecision?.reason || 'unavailable',
    hullId: survivor,
    ship,
    packDecision,
    meeting,
    price: meeting?.price ?? packDecision?.price ?? ship.cost,
    requiredStanding: meeting?.requiredStanding ?? packDecision?.requiredStanding,
    requiredFaction: meeting?.requiredFaction ?? packDecision?.requiredFaction,
    currentStanding: meeting?.currentStanding ?? packDecision?.currentStanding,
  };
}

export function discardedAliasIds(aliases = {}) {
  return Object.keys(aliases).map(Number).filter((id) => Number.isInteger(id));
}

export function assertNoDiscardedInList(ids, aliases = {}) {
  const discarded = new Set(discardedAliasIds(aliases));
  return uniqueNumbers(ids).filter((id) => discarded.has(id));
}

export function attachCatalog(state, catalog) {
  if (!state || typeof state !== 'object') return catalog;
  state.shipCatalog = catalog;
  state.catalogWired = CATALOG_WIRED;
  return catalog;
}

export function createWiredCatalog(manifest, sourceMap, sizeConfig) {
  return createShipCatalog(manifest, sourceMap, sizeConfig);
}

export function compatibilityManifestFromPack(source) {
  const manifest = source && typeof source === 'object' ? source : {};
  return {
    generatedFrom: 'bm-ships/ships.json — run node scripts/sync-ship-roster.mjs; do not edit hulls here',
    version: manifest.version,
    aliases: manifest.aliases || {},
    ships: (manifest.ships || []).map((ship) => ({
      ...ship,
      image: engineImagePath(ship.image),
    })),
  };
}
