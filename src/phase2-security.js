/**
 * Phase 2 player security policies (ROE).
 *
 * Source of truth is the bake-off brief only:
 * - docs/revised-development-plan.md §3 “Player security policy”
 * - docs/BAKEOFF-STATUS.md (Phase 1 already on main; this slice adds ROE)
 *
 * Two automatic modes:
 *   return-fire — attributable attacks on the player's side observed in this
 *                 system, and a matching active raid against the holding.
 *                 Hostility or a war flag alone is insufficient.
 *   defend      — Phase 1 behavior: hostility toward the player and war with
 *                 the player's flag.
 *
 * Explicit escort attack orders override ROE for eligible foreign targets.
 * Player-owned installations and player-side ships are protected before any
 * order function mutates them.
 *
 * Policies belong to the player's side, survive flag changes, and merge by
 * dimension. Local overrides go inactive (but are retained) when a holding
 * is lost, then reactivate on reclaim. Outside holdings, standing orders are
 * the empire-default ROE.
 *
 * `access` and `alerts` are reserved data only. `protect-all` is deferred.
 */

export const ROE_MODES = Object.freeze(['return-fire', 'defend']);
export const DEFAULT_ROE = 'defend';
export const POLICY_DIMENSIONS = Object.freeze(['roe', 'access', 'alerts']);
export const ACCESS_CLASSES = Object.freeze(['warFlag', 'independent', 'unknown', 'other']);
export const ACCESS_VALUES = Object.freeze(['open', 'challenge', 'closed']);
export const ALERT_MODES = Object.freeze(['all', 'incidents', 'silent']);
export const ATTRIBUTABLE_ATTACK_MS = 45000;
export const MAX_OBSERVED_ATTACKS = 48;

export const RESERVED_ACCESS_DEFAULT = Object.freeze({
  warFlag: 'open',
  independent: 'open',
  unknown: 'challenge',
  other: 'open',
});

export const RESERVED_ALERTS_DEFAULT = 'all';

const PLAYER_SIDE_SHIP_ROLES = new Set(['playerEscort', 'playerFleet']);

function normalizeKey(value) {
  return String(value ?? '').trim().toLowerCase();
}

function cloneAccess(access = RESERVED_ACCESS_DEFAULT) {
  const next = {};
  for (const cls of ACCESS_CLASSES) {
    const raw = access?.[cls];
    next[cls] = ACCESS_VALUES.includes(raw) ? raw : RESERVED_ACCESS_DEFAULT[cls];
  }
  return next;
}

export function isRoeMode(value) {
  return ROE_MODES.includes(String(value || ''));
}

export function normalizeRoeMode(value, fallback = DEFAULT_ROE) {
  return isRoeMode(value) ? String(value) : fallback;
}

export function normalizeAlertMode(value) {
  return ALERT_MODES.includes(String(value || '')) ? String(value) : RESERVED_ALERTS_DEFAULT;
}

export function createEmpireDefaultPolicy(overrides = {}) {
  return {
    roe: normalizeRoeMode(overrides.roe, DEFAULT_ROE),
    access: cloneAccess(overrides.access),
    alerts: normalizeAlertMode(overrides.alerts),
  };
}

export function createPlayerSecurityState(ownerSide = 'neutral', extras = {}) {
  return {
    ownerSide: normalizeKey(ownerSide) || 'neutral',
    empireDefault: createEmpireDefaultPolicy(extras.empireDefault),
    holdings: normalizeHoldingMap(extras.holdings),
    observedAttacks: normalizeObservedAttacks(extras.observedAttacks),
  };
}

function normalizeHoldingMap(holdings = {}) {
  const next = {};
  if (!holdings || typeof holdings !== 'object') return next;
  for (const [rawKey, entry] of Object.entries(holdings)) {
    const key = String(Number(rawKey));
    if (!Number.isFinite(Number(rawKey)) || !entry || typeof entry !== 'object') continue;
    next[key] = normalizeHoldingOverride(entry);
  }
  return next;
}

export function normalizeHoldingOverride(entry = {}) {
  const next = {
    active: entry.active !== false,
  };
  if (entry.roe != null) next.roe = normalizeRoeMode(entry.roe);
  if (entry.access && typeof entry.access === 'object') next.access = cloneAccess(entry.access);
  if (entry.alerts != null) next.alerts = normalizeAlertMode(entry.alerts);
  return next;
}

function normalizeObservedAttacks(list = []) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      actorId: entry.actorId != null ? String(entry.actorId) : null,
      actorFaction: normalizeKey(entry.actorFaction) || null,
      attackId: entry.attackId != null ? String(entry.attackId) : null,
      systemIndex: Number(entry.systemIndex),
      at: Number(entry.at) || 0,
      victimKind: String(entry.victimKind || 'player'),
    }))
    .filter((entry) => Number.isFinite(entry.systemIndex))
    .slice(-MAX_OBSERVED_ATTACKS);
}

export function serializePlayerSecurity(policies) {
  const state = createPlayerSecurityState(policies?.ownerSide, policies);
  return {
    ownerSide: state.ownerSide,
    empireDefault: {
      roe: state.empireDefault.roe,
      access: cloneAccess(state.empireDefault.access),
      alerts: state.empireDefault.alerts,
    },
    holdings: Object.fromEntries(
      Object.entries(state.holdings).map(([key, entry]) => [key, { ...entry, access: entry.access ? cloneAccess(entry.access) : undefined }]),
    ),
    observedAttacks: [...state.observedAttacks],
  };
}

export function restorePlayerSecurity(saved, fallbackSide = 'neutral') {
  if (!saved || typeof saved !== 'object') {
    return createPlayerSecurityState(fallbackSide);
  }
  return createPlayerSecurityState(saved.ownerSide || fallbackSide, saved);
}

/**
 * Policies belong to the player's side. Changing the flown flag must not
 * re-key or discard them.
 */
export function retainPoliciesAcrossFlagChange(policies, nextFlag) {
  const next = serializePlayerSecurity(policies);
  next.lastFlownFlag = normalizeKey(nextFlag) || null;
  return next;
}

export function setEmpireDefaultDimension(policies, dimension, value) {
  if (!POLICY_DIMENSIONS.includes(dimension)) return serializePlayerSecurity(policies);
  const next = serializePlayerSecurity(policies);
  if (dimension === 'roe') next.empireDefault.roe = normalizeRoeMode(value);
  if (dimension === 'access') next.empireDefault.access = cloneAccess(value);
  if (dimension === 'alerts') next.empireDefault.alerts = normalizeAlertMode(value);
  return next;
}

export function setHoldingOverrideDimension(policies, systemIndex, dimension, value) {
  if (!POLICY_DIMENSIONS.includes(dimension)) return serializePlayerSecurity(policies);
  const next = serializePlayerSecurity(policies);
  const key = String(Number(systemIndex));
  const current = next.holdings[key] ? normalizeHoldingOverride(next.holdings[key]) : { active: true };
  if (dimension === 'roe') {
    if (value == null || value === '') delete current.roe;
    else current.roe = normalizeRoeMode(value);
  }
  if (dimension === 'access') {
    if (value == null) delete current.access;
    else current.access = cloneAccess(value);
  }
  if (dimension === 'alerts') {
    if (value == null || value === '') delete current.alerts;
    else current.alerts = normalizeAlertMode(value);
  }
  next.holdings[key] = current;
  return next;
}

export function clearHoldingOverride(policies, systemIndex) {
  const next = serializePlayerSecurity(policies);
  delete next.holdings[String(Number(systemIndex))];
  return next;
}

export function deactivateHoldingOverride(policies, systemIndex) {
  const next = serializePlayerSecurity(policies);
  const key = String(Number(systemIndex));
  if (!next.holdings[key]) return next;
  next.holdings[key] = { ...next.holdings[key], active: false };
  return next;
}

export function reactivateHoldingOverride(policies, systemIndex) {
  const next = serializePlayerSecurity(policies);
  const key = String(Number(systemIndex));
  if (!next.holdings[key]) return next;
  next.holdings[key] = { ...next.holdings[key], active: true };
  return next;
}

/**
 * Merge empire default with an optional local override by dimension.
 * A local ROE does not replace reserved access/alerts from the default.
 */
export function mergePoliciesByDimension(base, override = null) {
  const left = createEmpireDefaultPolicy(base);
  if (!override || typeof override !== 'object') {
    return { ...left, source: 'empire-default' };
  }
  return {
    roe: override.roe != null ? normalizeRoeMode(override.roe) : left.roe,
    access: override.access ? cloneAccess({ ...left.access, ...override.access }) : cloneAccess(left.access),
    alerts: override.alerts != null ? normalizeAlertMode(override.alerts) : left.alerts,
    source: 'holding-override',
  };
}

export function getHoldingOverride(policies, systemIndex) {
  return policies?.holdings?.[String(Number(systemIndex))] || null;
}

export function getEffectivePolicy(policies, systemIndex, playerHolds = false) {
  const base = createEmpireDefaultPolicy(policies?.empireDefault);
  if (!playerHolds) {
    return { ...base, source: 'empire-default', active: false, holding: false };
  }
  const override = getHoldingOverride(policies, systemIndex);
  if (!override || override.active === false) {
    return { ...base, source: 'empire-default', active: Boolean(override), holding: true };
  }
  return { ...mergePoliciesByDimension(base, override), active: true, holding: true };
}

export function getEffectiveRoe(policies, systemIndex, playerHolds = false) {
  return getEffectivePolicy(policies, systemIndex, playerHolds).roe;
}

/**
 * Reserved: access values exist as data and must not drive enforcement yet.
 */
export function isAccessEnforced(_policies) {
  return false;
}

/**
 * Reserved: alert modes exist as data and must not drive notifications yet.
 */
export function areAlertsActive(_policies) {
  return false;
}

export function offersProtectAll(_policies) {
  return false;
}

export function isPlayerSideShip(actor = {}, context = {}) {
  if (!actor || actor.destroyed) return false;
  if (PLAYER_SIDE_SHIP_ROLES.has(actor.role)) return true;
  if (actor.owner === 'player' || actor.source === 'player') return true;
  const fleetIds = context.playerFleetIds;
  if (actor.fleetId && fleetIds && (fleetIds.has?.(actor.fleetId) || fleetIds.includes?.(actor.fleetId))) {
    return true;
  }
  return false;
}

export function isPlayerOwnedInstallation(station = {}, context = {}) {
  if (!station || station.destroyed) return false;
  if (station.builtByPlayer) return true;
  if (station.owner === 'player' || station.ownerKind === 'player') return true;
  if (station.privateInstallation || station.ownerKind === 'private') return false;
  if (station.eligibleForTransfer === false && !station.builtByPlayer) return false;
  const faction = normalizeKey(station.faction);
  const playerSide = normalizeKey(context.playerSide);
  const playerFaction = normalizeKey(context.playerFaction);
  if (context.playerHoldsSystem && faction && (faction === playerSide || faction === playerFaction)) {
    return true;
  }
  return false;
}

export function isProtectedPlayerAsset(target = {}, context = {}) {
  if (!target || target.destroyed) return false;
  if (target.stationTypeId || target.ownerKind === 'station' || context.targetType === 'station') {
    return isPlayerOwnedInstallation(target, context);
  }
  return isPlayerSideShip(target, context);
}

export function isEligibleForeignTarget(target = {}, context = {}) {
  if (!target || target.destroyed) return false;
  return !isProtectedPlayerAsset(target, context);
}

export function recordObservedAttack(policies, event = {}) {
  const next = serializePlayerSecurity(policies);
  const entry = {
    actorId: event.actorId != null ? String(event.actorId) : null,
    actorFaction: normalizeKey(event.actorFaction) || null,
    attackId: event.attackId != null ? String(event.attackId) : null,
    systemIndex: Number(event.systemIndex),
    at: Number(event.at) || 0,
    victimKind: String(event.victimKind || 'player'),
  };
  if (!Number.isFinite(entry.systemIndex) || (!entry.actorId && !entry.actorFaction && !entry.attackId)) {
    return next;
  }
  next.observedAttacks = [...next.observedAttacks, entry].slice(-MAX_OBSERVED_ATTACKS);
  return next;
}

export function pruneObservedAttacks(policies, now = 0, windowMs = ATTRIBUTABLE_ATTACK_MS) {
  const next = serializePlayerSecurity(policies);
  next.observedAttacks = next.observedAttacks.filter((entry) => Number(entry.at) + windowMs > Number(now));
  return next;
}

export function hasAttributedAttackOnPlayerSide(target = {}, context = {}) {
  const now = Number(context.now) || 0;
  const systemIndex = Number(context.systemIndex);
  const attacks = Array.isArray(context.observedAttacks)
    ? context.observedAttacks
    : (context.policies?.observedAttacks || []);
  const targetId = target.id != null ? String(target.id) : null;
  const targetAttackId = target.attackId != null ? String(target.attackId) : null;
  return attacks.some((event) => {
    if (Number(event.systemIndex) !== systemIndex) return false;
    if (Number(event.at) + ATTRIBUTABLE_ATTACK_MS <= now) return false;
    if (targetId && event.actorId && String(event.actorId) === targetId) return true;
    if (targetAttackId && event.attackId && String(event.attackId) === targetAttackId) return true;
    return false;
  }) || Boolean(
    targetId
    && context.lastAttributedAttackerId
    && String(context.lastAttributedAttackerId) === targetId
    && Number(context.lastAttributedAttackerUntil || 0) > now
    && Number(context.lastAttributedAttackerSystem) === systemIndex,
  );
}

export function hasMatchingActiveRaid(target = {}, context = {}) {
  const raid = context.activeRaid;
  if (!raid || !context.playerHoldsSystem) return false;
  if (Number(raid.systemIndex) !== Number(context.systemIndex)) return false;
  const raidId = raid.id != null ? String(raid.id) : null;
  const raidFaction = normalizeKey(raid.faction);
  if (raidId && target.attackId != null && String(target.attackId) === raidId) return true;
  if (raidFaction && normalizeKey(target.faction) === raidFaction) return true;
  return false;
}

export function defendAllowsAutoEngage(target = {}, context = {}) {
  if (!target || target.destroyed) return false;
  const faction = String(target.faction || '').trim().toLowerCase();
  const playerFaction = String(context.playerFaction || '').trim().toLowerCase();
  const playerSide = String(context.playerSide || '').trim().toLowerCase();
  const aligned = typeof context.factionsAligned === 'function'
    ? (context.factionsAligned(target.faction, context.playerFaction)
      || context.factionsAligned(target.faction, context.playerSide))
    : false;
  if (faction && (faction === playerFaction || faction === playerSide || aligned)) return false;
  if (target.hostile || target.attitude === 'hostile') return true;
  if (Number(target.playerAggroUntil || 0) > Number(context.now || 0)) return true;
  if (target.attackId) return true;
  const opposed = typeof context.factionsOpposed === 'function'
    ? context.factionsOpposed(target.faction, context.playerFaction)
    : false;
  if (opposed) return true;
  if (typeof context.isSystemAttacker === 'function' && context.isSystemAttacker(target)) return true;
  return false;
}

export function returnFireAllowsAutoEngage(target = {}, context = {}) {
  if (!target || target.destroyed) return false;
  if (hasMatchingActiveRaid(target, context)) return true;
  if (hasAttributedAttackOnPlayerSide(target, context)) return true;
  return false;
}

export function hasExplicitEscortAttackOrder(target = {}, now = 0) {
  return Boolean(target && Number(target.playerEscortOrderUntil || 0) > Number(now));
}

/**
 * Automatic engagement gate for player forces.
 * Explicit escort orders override ROE only for eligible foreign targets.
 */
export function playerForceMayAutoEngage(target = {}, context = {}) {
  if (!target || target.destroyed) return false;
  if (isProtectedPlayerAsset(target, context)) return false;
  const now = Number(context.now) || 0;
  if (hasExplicitEscortAttackOrder(target, now) && isEligibleForeignTarget(target, context)) {
    return true;
  }
  const roe = context.roe || getEffectiveRoe(
    context.policies,
    context.systemIndex,
    Boolean(context.playerHoldsSystem),
  );
  if (roe === 'return-fire') return returnFireAllowsAutoEngage(target, context);
  if (roe === 'defend') return defendAllowsAutoEngage(target, context);
  return false;
}

/**
 * Protect own assets before the order function mutates them.
 * Returns { applied, reason, target } without mutating on refusal.
 */
export function previewEscortAttackOrder(target = {}, context = {}) {
  if (!target || target.destroyed) {
    return { applied: false, reason: 'missing', target: null };
  }
  if (isProtectedPlayerAsset(target, context)) {
    return { applied: false, reason: 'protected', target };
  }
  if (!isEligibleForeignTarget(target, context)) {
    return { applied: false, reason: 'ineligible', target };
  }
  return { applied: true, reason: 'ok', target };
}

export function applyEscortAttackOrder(target = {}, now = 0, context = {}) {
  const preview = previewEscortAttackOrder(target, context);
  if (!preview.applied) return { ...preview, mutated: false };
  const next = target;
  next.playerEscortOrderUntil = Number(now) + Number(context.orderMs || 20000);
  next.attitude = 'hostile';
  next.hostile = true;
  if (!next.stationTypeId) {
    next.playerAggroUntil = Number(now) + Number(context.aggroMs || 20000);
  }
  return { applied: true, reason: 'ok', target: next, mutated: true };
}

export function describeRoeMode(mode) {
  if (mode === 'return-fire') {
    return 'Engage only after an attributable attack on your side in this system, or a matching raid against this holding.';
  }
  if (mode === 'defend') {
    return 'Engage hostiles toward you and anyone at war with the flag you fly.';
  }
  return '';
}

export function listSecurityHoldings(policies, controlledIndexes = [], planetNames = []) {
  const indexes = new Set(
    (Array.isArray(controlledIndexes) ? controlledIndexes : [])
      .map((index) => Number(index))
      .filter(Number.isFinite),
  );
  for (const key of Object.keys(policies?.holdings || {})) {
    const numeric = Number(key);
    if (Number.isFinite(numeric)) indexes.add(numeric);
  }
  return [...indexes]
    .sort((a, b) => a - b)
    .map((systemIndex) => {
      const override = getHoldingOverride(policies, systemIndex);
      const held = (Array.isArray(controlledIndexes) ? controlledIndexes : [])
        .some((index) => Number(index) === Number(systemIndex));
      return {
        systemIndex,
        name: planetNames[systemIndex] || `System ${systemIndex + 1}`,
        held,
        overrideActive: Boolean(override?.active && held),
        retainedInactive: Boolean(override && (!held || override.active === false)),
        overrideRoe: override?.roe || null,
        effectiveRoe: getEffectiveRoe(policies, systemIndex, held),
      };
    });
}
