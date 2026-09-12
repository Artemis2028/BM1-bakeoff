/**
 * Side-lane slice 1 — repairCapable + Reman Warbird durable unlock.
 *
 * Source of truth:
 * - docs/side-lane-repair-reman-independence/BM1-SIDE-LANE-REPAIR-REMAN-INDEPENDENCE-PROPOSAL.md
 *   §2 gates 1–2, §3 repair, §4 Reman
 * - docs/side-lane-repair-reman-independence/BM1-SIDE-LANE-ENGINE-DEPENDENCIES.md
 *
 * This module does not implement unrest / independence / civil war (gate 3).
 * It does not wire the 212-hull catalog into traffic or markets.
 * It does not invent repair cost knobs (existing 2L/% hull, 1L/% shields).
 *
 * S7.8 meeting point (closes the soft placeholder):
 * Pack `getPurchaseDecision` refuses hull 53 with `restricted-stock` because
 * `ships.json` has `shipyardEligible: false` and **no** `specialVendor`.
 * The engine must not fabricate that pack field. The durable
 * `playerUnlocks.remanWarbird.granted` flag is the engine-side substitute for
 * the missing vendor exception, applied only to pack id 53 / `bm-ship:53`.
 * `regionAllows('secret-remus')` stays a content-availability check for the
 * authored `remus-secret` grant source, not the unlock key. Culture `reman`
 * is never consulted. Other Warbird hulls never satisfy this rule.
 */

export const PLAYER_UNLOCKS_VERSION = 1;

export const REPAIR_HULL_LATINUM_PER_PERCENT = 2;
export const REPAIR_SHIELD_LATINUM_PER_PERCENT = 1;

export const REPAIR_ARMS_ASSET_PATH = 'assets/game/repair/repairarms.gif';
export const FORBIDDEN_REPAIR_OVERLAY_ASSETS = Object.freeze([
  'stationconstructing.gif',
  'workbee',
]);

export const REPAIR_REFUSE_NOT_DOCKED = 'You must dock at a planet first (fly to planet and click it).';
export const REPAIR_REFUSE_NOT_CAPABLE = 'This facility cannot repair ships.';
export const REPAIR_REFUSE_DEFENSE_PLATFORM = 'Defense platform: this facility cannot repair ships.';
export const REPAIR_REFUSE_CLEARANCE = 'Clearance required';

export const REPAIR_CAPABLE_SIZE_CLASSES = Object.freeze(['starbase', 'shipyard', 'heavy-shipyard']);
export const REPAIR_MAINTENANCE_TYPE_ID = 83;
export const REPAIR_DEFENSE_PLATFORM_TYPE_IDS = Object.freeze([86, 87]);
export const REPAIR_DEFENSE_PLATFORM_SIZE_CLASS = 'defense-platform';

export const REMAN_WARBIRD_HULL_ID = 53;
export const REMAN_WARBIRD_PACK_KEY = 'bm-ship:53';
export const REMAN_VENDOR_RULE = 'remus-secret';
export const REMAN_SECRET_SYSTEM_NAME = 'remus';
export const REMAN_STARBASE_NAME = 'reman starbase';

export const OTHER_WARBIRD_HULL_IDS = Object.freeze([
  246, // Classic Warbird
  268, // Independent Warbird
  279, // Romulan Warbird
  320, // D'deridex Warbird
  321, // Norexan Warbird
]);

export const REMAN_GRANT_SOURCES = Object.freeze([
  'remus-secret',
  'recovery-mission',
  'alternate',
  'probe-inject',
]);

export const REMAN_ACCESS_REMAINS_SAYABLE = 'Reman Warbird access is an unlock. This station is destroyed; your access remains.';
export const REMAN_LOCKED_RECOVERY_SAYABLE = 'Reman Warbird locked. The Remus yard is gone — recovery is a mission / alternate unlock, not a deleted ship.';
export const REMAN_LOCKED_SAYABLE = 'Reman Warbird locked. Access is an unlock, not a live Remus starbase instance.';

export const S7_8_MEETING_POINT = Object.freeze({
  closed: true,
  hullId: REMAN_WARBIRD_HULL_ID,
  packKey: REMAN_WARBIRD_PACK_KEY,
  packHelper: 'getPurchaseDecision',
  packRefusalWithoutFabrication: 'restricted-stock',
  missingPackField: 'specialVendor',
  engineSubstitute: 'playerUnlocks.remanWarbird.granted',
  fabricatedSpecialVendor: false,
  cultureIsUnlock: false,
  regionAllowsIsUnlock: false,
  note: 'Durable flag satisfies pack restricted-stock for hull 53 only. Do not write specialVendor onto ships.json. regionAllows(secret-remus) is content availability for remus-secret, not the key.',
});

function normalizeKey(value) {
  const key = String(value ?? '').trim().toLowerCase();
  return key && key !== 'undefined' && key !== 'null' ? key : '';
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function isRemanWarbirdHull(hullId, packKey = '') {
  return Number(hullId) === REMAN_WARBIRD_HULL_ID
    || normalizeKey(packKey) === REMAN_WARBIRD_PACK_KEY;
}

export function isOtherWarbirdHull(hullId) {
  return OTHER_WARBIRD_HULL_IDS.includes(Number(hullId));
}

export function cultureIsNotRemanUnlock(cultureId) {
  return normalizeKey(cultureId) === 'reman';
}

/**
 * Location capability bit. Docking, Phase 3 clearance, and menu HTML are
 * independent. Do not fold visitorDeniedServices into this predicate.
 *
 * Name matching is a last-resort fallback only when type id and sizeClass
 * are both missing. "starbase" in a flavor string is never enough if the
 * type is a defense platform (platforms are checked first).
 */
export function isRepairCapableLocation({
  kind = null,
  station = null,
  sizeClass = '',
  typeId = null,
  docked = true,
} = {}) {
  if (docked === false) return false;
  if (normalizeKey(kind) === 'planet') return true;
  if (normalizeKey(kind) !== 'station') return false;
  if (station?.destroyed || station?.underConstruction || station?.incomplete) return false;
  if (!station && typeId == null && !sizeClass) return false;

  const resolvedType = Number(typeId ?? station?.stationTypeId ?? station?.typeId);
  const resolvedClass = normalizeKey(sizeClass || station?.sizeClass);

  if (
    REPAIR_DEFENSE_PLATFORM_TYPE_IDS.includes(resolvedType)
    || resolvedClass === REPAIR_DEFENSE_PLATFORM_SIZE_CLASS
  ) {
    return false;
  }
  if (REPAIR_CAPABLE_SIZE_CLASSES.includes(resolvedClass)) return true;
  if (resolvedType === REPAIR_MAINTENANCE_TYPE_ID) return true;

  const typeMissing = !Number.isFinite(resolvedType) || resolvedType <= 0;
  const classMissing = !resolvedClass;
  if (typeMissing && classMissing) {
    const name = normalizeKey(station?.name);
    if (name === 'maintenance station') return true;
  }
  return false;
}

export function repairCapabilityReason(location = {}) {
  const resolvedType = Number(location.typeId ?? location.station?.stationTypeId ?? location.station?.typeId);
  const resolvedClass = normalizeKey(location.sizeClass || location.station?.sizeClass);
  if (
    REPAIR_DEFENSE_PLATFORM_TYPE_IDS.includes(resolvedType)
    || resolvedClass === REPAIR_DEFENSE_PLATFORM_SIZE_CLASS
  ) {
    return REPAIR_REFUSE_DEFENSE_PLATFORM;
  }
  return REPAIR_REFUSE_NOT_CAPABLE;
}

/**
 * Two independent layers: capability vs Phase 3 access.
 * Reasons must not be swapped (S7.3).
 */
export function evaluateRepairStart({
  docked = false,
  kind = null,
  station = null,
  sizeClass = '',
  typeId = null,
  servicesDenied = false,
  accessReason = '',
} = {}) {
  if (!docked) {
    return { ok: false, layer: 'dock', reason: REPAIR_REFUSE_NOT_DOCKED };
  }
  const location = { kind, station, sizeClass, typeId, docked: true };
  if (!isRepairCapableLocation(location)) {
    return { ok: false, layer: 'capability', reason: repairCapabilityReason(location) };
  }
  if (servicesDenied) {
    const reason = String(accessReason || '').trim() || REPAIR_REFUSE_CLEARANCE;
    return { ok: false, layer: 'access', reason };
  }
  return { ok: true, layer: null, reason: '' };
}

export function createRepairSession() {
  return {
    inProgress: false,
    overlayActive: false,
    ticksRemaining: 0,
    actor: null,
  };
}

export function beginRepairSession({ overlayAssetPresent = false, actor = 'player' } = {}) {
  return {
    inProgress: true,
    overlayActive: Boolean(overlayAssetPresent) && actor === 'player',
    ticksRemaining: 1,
    actor: actor === 'player' ? 'player' : null,
  };
}

export function advanceRepairSession(session) {
  if (!session?.inProgress) return createRepairSession();
  const remaining = Number(session.ticksRemaining) - 1;
  if (!(remaining > 0)) return createRepairSession();
  return { ...session, ticksRemaining: remaining };
}

export function clearRepairSession() {
  return createRepairSession();
}

export function shouldDrawRepairOverlay(session, {
  capable = false,
  servicesAllowed = true,
  overlayAssetPresent = false,
  actor = 'player',
} = {}) {
  return Boolean(
    session?.inProgress
    && session.overlayActive
    && capable
    && servicesAllowed
    && overlayAssetPresent
    && actor === 'player'
    && session.actor === 'player'
  );
}

export function overlayUsesForbiddenArt(src = '') {
  const path = normalizeKey(src);
  return FORBIDDEN_REPAIR_OVERLAY_ASSETS.some((name) => path.includes(name));
}

export function createPlayerUnlocks() {
  return {
    version: PLAYER_UNLOCKS_VERSION,
    remanWarbird: {
      granted: false,
      source: null,
      grantedAt: null,
    },
  };
}

export function normalizePlayerUnlocks(raw) {
  const base = createPlayerUnlocks();
  const incoming = raw && typeof raw === 'object' ? raw : {};
  const reman = incoming.remanWarbird && typeof incoming.remanWarbird === 'object'
    ? incoming.remanWarbird
    : {};
  const source = REMAN_GRANT_SOURCES.includes(reman.source) ? reman.source : (reman.source ? String(reman.source) : null);
  return {
    version: PLAYER_UNLOCKS_VERSION,
    remanWarbird: {
      granted: reman.granted === true,
      source: reman.granted === true ? (source || 'alternate') : null,
      grantedAt: reman.granted === true && reman.grantedAt != null ? reman.grantedAt : null,
    },
  };
}

export function serializePlayerUnlocks(unlocks) {
  return clone(normalizePlayerUnlocks(unlocks));
}

export function restorePlayerUnlocks(saved) {
  return normalizePlayerUnlocks(saved);
}

export function hasRemanWarbirdAccess(unlocks, extras = {}) {
  if (cultureIsNotRemanUnlock(extras.cultureId) && extras.cultureId != null && extras.onlyCulture) {
    return false;
  }
  return normalizePlayerUnlocks(unlocks).remanWarbird.granted === true;
}

export function grantRemanWarbirdAccess(unlocks, { source = 'alternate', grantedAt = null } = {}) {
  const next = normalizePlayerUnlocks(unlocks);
  if (next.remanWarbird.granted) return next;
  const resolvedSource = REMAN_GRANT_SOURCES.includes(source) ? source : 'alternate';
  next.remanWarbird = {
    granted: true,
    source: resolvedSource,
    grantedAt: grantedAt,
  };
  return next;
}

/**
 * Authored remus-secret vendor identity. This is a rule name, not station.id.
 * Live Reman Starbase may grant once; it is not the stored key.
 */
export function isRemanSecretVendorStation(station, { systemName = '' } = {}) {
  if (!station || station.destroyed) return false;
  const system = normalizeKey(systemName);
  const name = normalizeKey(station.name);
  const stock = station.stockIds || station.stock?.shipIds || [];
  const stocks53 = (Array.isArray(stock) ? stock : []).some((id) => Number(id) === REMAN_WARBIRD_HULL_ID);
  return system === REMAN_SECRET_SYSTEM_NAME && (name === REMAN_STARBASE_NAME || stocks53);
}

export function remanDestructionSayable(unlocks) {
  return hasRemanWarbirdAccess(unlocks) ? REMAN_ACCESS_REMAINS_SAYABLE : REMAN_LOCKED_RECOVERY_SAYABLE;
}

export function describePackMeeting(catalogDecision = null) {
  if (!catalogDecision) {
    return {
      usedGetPurchaseDecision: false,
      fabricatedSpecialVendor: false,
      note: S7_8_MEETING_POINT.note,
    };
  }
  return {
    usedGetPurchaseDecision: true,
    packAllowed: catalogDecision.allowed === true,
    packReason: catalogDecision.reason || null,
    engineOverridesRestrictedStock: catalogDecision.reason === 'restricted-stock',
    fabricatedSpecialVendor: false,
    note: S7_8_MEETING_POINT.note,
  };
}

export function evaluateRemanWarbirdAccess({
  unlocks,
  hullId,
  packKey = '',
  catalogDecision = null,
  cultureId = null,
} = {}) {
  if (cultureIsNotRemanUnlock(cultureId) && !isRemanWarbirdHull(hullId, packKey)) {
    return {
      allowed: false,
      reason: 'culture-is-not-unlock',
      sayable: REMAN_LOCKED_SAYABLE,
      packMeeting: describePackMeeting(catalogDecision),
    };
  }
  if (!isRemanWarbirdHull(hullId, packKey)) {
    return {
      allowed: false,
      reason: isOtherWarbirdHull(hullId) ? 'other-warbird' : 'not-reman-warbird',
      sayable: REMAN_LOCKED_SAYABLE,
      packMeeting: describePackMeeting(catalogDecision),
    };
  }
  if (cultureIsNotRemanUnlock(cultureId) && !hasRemanWarbirdAccess(unlocks)) {
    return {
      allowed: false,
      reason: 'culture-is-not-unlock',
      sayable: REMAN_LOCKED_SAYABLE,
      packMeeting: describePackMeeting(catalogDecision),
    };
  }
  if (!hasRemanWarbirdAccess(unlocks)) {
    return {
      allowed: false,
      reason: 'access-locked',
      sayable: REMAN_LOCKED_SAYABLE,
      packMeeting: describePackMeeting(catalogDecision),
    };
  }
  return {
    allowed: true,
    reason: 'unlock-granted',
    sayable: REMAN_ACCESS_REMAINS_SAYABLE,
    packMeeting: describePackMeeting(catalogDecision),
  };
}

/**
 * Wrap pack getPurchaseDecision without editing ships.json.
 *
 * restricted-stock → durable flag may satisfy (missing specialVendor).
 * prestige-threshold-unconfigured → knobs deferred; not an access fail.
 * region → content check for remus-secret yard; granted access survives
 * off-Remus / destroyed yard (recovery / alternate).
 * funds / unavailable / balance-pending remain pack refusals when a catalog
 * decision is supplied for a live buy.
 */
export function meetPackPurchaseDecision(catalogDecision, unlocks, hullId, packKey = '') {
  if (!isRemanWarbirdHull(hullId, packKey)) {
    return catalogDecision || { allowed: false, reason: 'not-reman-warbird', fabricatedSpecialVendor: false };
  }
  if (!hasRemanWarbirdAccess(unlocks)) {
    return {
      allowed: false,
      reason: 'access-locked',
      packReason: catalogDecision?.reason || null,
      fabricatedSpecialVendor: false,
      meeting: S7_8_MEETING_POINT,
    };
  }
  if (!catalogDecision) {
    return {
      allowed: true,
      reason: 'unlock-granted',
      fabricatedSpecialVendor: false,
      meeting: S7_8_MEETING_POINT,
    };
  }
  if (catalogDecision.allowed) {
    return { ...catalogDecision, engineUnlock: true, fabricatedSpecialVendor: false, meeting: S7_8_MEETING_POINT };
  }
  if (catalogDecision.reason === 'restricted-stock') {
    return {
      allowed: true,
      reason: 'unlock-satisfies-restricted-stock',
      packReason: 'restricted-stock',
      fabricatedSpecialVendor: false,
      meeting: S7_8_MEETING_POINT,
    };
  }
  if (catalogDecision.reason === 'prestige-threshold-unconfigured') {
    return {
      allowed: true,
      reason: 'unlock-prestige-knobs-deferred',
      packReason: catalogDecision.reason,
      fabricatedSpecialVendor: false,
      meeting: S7_8_MEETING_POINT,
    };
  }
  if (catalogDecision.reason === 'region') {
    return {
      allowed: true,
      reason: 'unlock-survives-region',
      packReason: 'region',
      fabricatedSpecialVendor: false,
      meeting: S7_8_MEETING_POINT,
    };
  }
  return { ...catalogDecision, engineUnlock: true, fabricatedSpecialVendor: false, meeting: S7_8_MEETING_POINT };
}

export function filterShipStockForRemanAccess(ships, unlocks) {
  const list = Array.isArray(ships) ? ships : [];
  if (hasRemanWarbirdAccess(unlocks)) return list;
  return list.filter((ship) => !isRemanWarbirdHull(ship?.id ?? ship));
}
