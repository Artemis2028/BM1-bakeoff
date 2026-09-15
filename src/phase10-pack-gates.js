/**
 * Phase 10 Dominion-first — live pack spawn / purchase gates (gate 4).
 *
 * authorizedDeployment is a real operation on dominionBook, not
 * role === 'fleetAttack' || role === 'mission'. Empty legal pools stay empty.
 * No ambient core / Battleship. Reserved Gorn stays empty. No any-hull refill.
 */

import { catalogSpawnContext, spawnIdsFromCatalog, stockIdsFromCatalog } from './ship-catalog-wire.js';

export const DEBUG_AUTHORIZE_ALL_DEPLOYMENTS = false;
export const CORE_HULL_IDS = Object.freeze([48, 65, 216, 238]);
export const BATTLESHIP_HULL_ID = 65;
export const BLENDER_ROUTINE_IDS = Object.freeze([30, 206, 322]);
export const GORN_FACTION = 'gorn';

export function isCoreHull(id) {
  return CORE_HULL_IDS.includes(Number(id));
}

export function isBattleshipHull(id) {
  return Number(id) === BATTLESHIP_HULL_ID;
}

export function liveOperations(book) {
  return Object.values(book?.operations || {}).filter((row) => row && row.live === true && row.authorizedDeployment === true);
}

export function hasLiveAuthorizedOperation(book, operationId = null) {
  if (book?.debugAuthorizeAllDeployments === true) return false;
  const ops = liveOperations(book);
  if (!ops.length) return false;
  if (operationId == null || operationId === '') return true;
  return ops.some((row) => String(row.operationId) === String(operationId));
}

/**
 * Role fleetAttack/mission is necessary, not sufficient.
 */
export function resolveAuthorizedDeployment(book, role = 'traffic', operationId = null) {
  const legalRole = role === 'fleetAttack' || role === 'mission';
  if (!legalRole) return false;
  if (DEBUG_AUTHORIZE_ALL_DEPLOYMENTS) return false;
  if (book?.debugAuthorizeAllDeployments === true) return false;
  return hasLiveAuthorizedOperation(book, operationId);
}

export function liveCatalogSpawnContext(book, {
  role = 'traffic',
  systemName = '',
  region = '',
  operationId = null,
  extras = {},
} = {}) {
  return catalogSpawnContext({
    role,
    systemName,
    region,
    authorizedDeployment: resolveAuthorizedDeployment(book, role, operationId),
    extras,
  });
}

export function spawnIdsLive(catalog, book, {
  role = 'traffic',
  systemName = '',
  region = '',
  faction = null,
  operationId = null,
} = {}) {
  if (!catalog) return [];
  const context = liveCatalogSpawnContext(book, { role, systemName, region, operationId });
  if (String(faction || '').toLowerCase() === GORN_FACTION) {
    return [];
  }
  return spawnIdsFromCatalog(catalog, context, faction);
}

export function stockIdsLive(catalog, book, {
  systemName = '',
  region = '',
  faction = null,
  unlocks = null,
  operationId = null,
} = {}) {
  if (!catalog) return [];
  const context = liveCatalogSpawnContext(book, {
    role: 'purchase',
    systemName,
    region,
    operationId,
  });
  return stockIdsFromCatalog(catalog, context, { faction, unlocks });
}

/**
 * Empty legal faction pool stays empty. Never refill from any-hull,
 * reserved Gorn, or core/Battleship leftovers.
 */
export function pickLiveFactionHull(catalog, book, faction, role, context = {}) {
  const ids = spawnIdsLive(catalog, book, {
    role,
    faction,
    systemName: context.systemName || '',
    region: context.region || '',
    operationId: context.operationId || null,
  });
  return ids;
}

export function refuseAmbientCore(ids = [], { systemName = '', authorizedDeployment = false } = {}) {
  const name = String(systemName || '').trim().toLowerCase();
  const allowCore = name === 'dominica' || authorizedDeployment === true;
  return (ids || []).filter((id) => {
    if (isBattleshipHull(id) && authorizedDeployment !== true) return false;
    if (isCoreHull(id) && !allowCore) return false;
    return true;
  });
}

export function blenderStockAllows(id, { systemName = '', authorizedDeployment = false } = {}) {
  const hull = Number(id);
  const blender = String(systemName || '').trim().toLowerCase() === 'blender';
  if (blender) {
    if (isCoreHull(hull) || isBattleshipHull(hull)) return false;
    return true;
  }
  if (isBattleshipHull(hull)) return authorizedDeployment === true;
  return true;
}

export function packSnapshot(book, extras = {}) {
  const ids = Array.isArray(extras.blenderSpawnIds) ? extras.blenderSpawnIds : [];
  const earthIds = Array.isArray(extras.earthSpawnIds) ? extras.earthSpawnIds : [];
  const gornPool = Array.isArray(extras.gornPool) ? extras.gornPool : [];
  const authorized = resolveAuthorizedDeployment(book, extras.role || 'fleetAttack', extras.operationId);
  return {
    blenderCoreHulls: ids.filter((id) => isCoreHull(id)),
    blenderRoutineIds: ids.filter((id) => BLENDER_ROUTINE_IDS.includes(Number(id))),
    battleshipAmbient: ids.includes(BATTLESHIP_HULL_ID) || earthIds.includes(BATTLESHIP_HULL_ID),
    earthCoreHulls: earthIds.filter((id) => isCoreHull(id)),
    gornPool,
    authorizedDeployment: authorized,
    liveOperationId: book?.liveOperationId || null,
    debugAuthorizeAllDeployments: false,
    emptyGornStaysEmpty: gornPool.length === 0,
  };
}
