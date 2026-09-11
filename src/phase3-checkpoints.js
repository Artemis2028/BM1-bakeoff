/**
 * Phase 3 holding zones and compliance — pure rules and durable records.
 *
 * Geometry follows docs/phase3/BM1-PHASE3-ENGINE-REVIEW.md over the proposal's
 * station-centred map-box numbers. Authority is a political side, not a flag.
 * Access is a permission, not a ceasefire. Refusal never manufactures fire
 * evidence. The ledger lives outside systemStates.
 */

import {
  ACCESS_CLASSES,
  ACCESS_VALUES,
  createEmpireDefaultPolicy,
} from './phase2-security.js';

export const SIM_MS_PER_FRAME = 16.6667;
export const ZONE_RADIUS_MARGIN = 60;
export const ZONE_RADIUS_FLOOR = 300;
export const ZONE_RADIUS_CAP = 650;
export const HOLDING_RADIUS_FRACTION = 0.7;
export const HOLD_TOLERANCE = 60;
export const WITHDRAWAL_COMPLETE_MARGIN = 80;
export const REENTRY_HYSTERESIS_MARGIN = 140;
export const CHECKPOINT_HAIL_RANGE = 750;
export const IDENTITY_DWELL_MS = 5000;
export const MIN_TRAVEL_ALLOWANCE_MS = 45000;
export const RECENT_EVENT_CAP = 32;
export const ACTIVE_ORDER_CAP = 24;
export const PLAYER_INSTANCE_ID = 'player';

export const AUTHORED_VULCAN_ZONE_ID = 'authored:vulcan';
export const AUTHORED_VULCAN_SYSTEM_NAME = 'Vulcan';
export const AUTHORED_VULCAN_POLICY = Object.freeze({
  roe: 'defend',
  access: Object.freeze({
    warFlag: 'closed',
    independent: 'challenge',
    unknown: 'open',
    other: 'challenge',
  }),
  alerts: 'incidents',
});

export const ORDERABLE_ROLES = Object.freeze(['traffic', 'localTraffic']);
export const TERMINAL_LIFECYCLES = Object.freeze([
  'cleared',
  'withdrawn',
  'departed',
  'refused',
  'expired',
  'canceled',
  'waived',
  'authority_changed',
  'checkpoint_unavailable',
  'visitor_destroyed',
  'unable_to_comply',
  'interrupted',
  'contact_lost',
  'policy_relaxed',
  'zone_reconfigured',
  'not_addressed',
]);

const ACCESS_VALUE_SET = new Set(ACCESS_VALUES);
const ACCESS_CLASS_SET = new Set(ACCESS_CLASSES);

function normalizeKey(value, fallback = '') {
  const key = String(value ?? '').trim().toLowerCase();
  return key && key !== 'undefined' && key !== 'null' ? key : fallback;
}

function cloneAccess(access = {}) {
  const next = {};
  for (const cls of ACCESS_CLASSES) {
    next[cls] = ACCESS_VALUE_SET.has(access?.[cls]) ? access[cls] : (cls === 'unknown' ? 'challenge' : 'open');
  }
  return next;
}

export function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function polarFrom(center, point) {
  const dx = Number(point?.x) - Number(center?.x);
  const dy = Number(point?.y) - Number(center?.y);
  return {
    angle: Math.atan2(dy, dx),
    distance: Math.hypot(dx, dy) || 0,
  };
}

export function resolvePolar(center, polar) {
  const angle = Number(polar?.angle) || 0;
  const distance = Math.max(0, Number(polar?.distance) || 0);
  return {
    x: Number(center?.x) + Math.cos(angle) * distance,
    y: Number(center?.y) + Math.sin(angle) * distance,
  };
}

export function pointDistance(a, b) {
  return Math.hypot(Number(a?.x) - Number(b?.x), Number(a?.y) - Number(b?.y));
}

export function deriveZoneRadius(farthestPlanetAnchoredDistance) {
  const farthest = Math.max(0, Number(farthestPlanetAnchoredDistance) || 0);
  return clampNumber(farthest + ZONE_RADIUS_MARGIN, ZONE_RADIUS_FLOOR, ZONE_RADIUS_CAP);
}

export function buildZoneGeometry({
  planet,
  farthestPlanetAnchoredDistance,
  hailRange = CHECKPOINT_HAIL_RANGE,
} = {}) {
  const radius = deriveZoneRadius(farthestPlanetAnchoredDistance);
  return {
    center: { x: Number(planet?.x) || 0, y: Number(planet?.y) || 0 },
    radius,
    holdingDistance: radius * HOLDING_RADIUS_FRACTION,
    holdTolerance: HOLD_TOLERANCE,
    withdrawalCompleteDistance: radius + WITHDRAWAL_COMPLETE_MARGIN,
    reentryHysteresisDistance: radius + REENTRY_HYSTERESIS_MARGIN,
    hailRange: Math.max(Number(hailRange) || CHECKPOINT_HAIL_RANGE, radius + 80),
  };
}

export function holdingPolarFromApproach(geometry, visitorPoint) {
  const polar = polarFrom(geometry.center, visitorPoint);
  return {
    angle: polar.angle,
    distance: geometry.holdingDistance,
  };
}

export function withdrawalPolarFromApproach(geometry, visitorPoint, star = null) {
  const polar = polarFrom(geometry.center, visitorPoint);
  let angle = polar.angle;
  if (star && pointDistance(geometry.center, star) > 1) {
    const fromStar = polarFrom(star, geometry.center);
    const awayFromStar = polarFrom(geometry.center, visitorPoint).angle;
    const starAngle = Math.atan2(geometry.center.y - star.y, geometry.center.x - star.x);
    const candidates = [angle, awayFromStar, starAngle, starAngle + Math.PI, polar.angle + Math.PI];
    let best = candidates[0];
    let bestScore = -Infinity;
    for (const candidate of candidates) {
      const point = resolvePolar(geometry.center, {
        angle: candidate,
        distance: geometry.withdrawalCompleteDistance + 40,
      });
      const fromStarDist = pointDistance(point, star);
      if (fromStarDist > bestScore) {
        bestScore = fromStarDist;
        best = candidate;
      }
    }
    angle = best;
  }
  return {
    angle,
    distance: geometry.withdrawalCompleteDistance + 40,
  };
}

export function estimateTravelMs(distance, speedPerFrame) {
  const speed = Math.max(0.05, Number(speedPerFrame) || 0.05);
  const frames = Math.max(0, Number(distance) || 0) / speed;
  return frames * SIM_MS_PER_FRAME + 4000;
}

export function computeAllowanceMs(distance, speedPerFrame, dwellMs = 0) {
  return Math.max(MIN_TRAVEL_ALLOWANCE_MS, 2 * estimateTravelMs(distance, speedPerFrame) + Number(dwellMs || 0));
}

export function advanceLocalElapsed(localElapsedMs, frameScale) {
  return Math.max(0, Number(localElapsedMs) || 0) + Math.max(0, Number(frameScale) || 0) * SIM_MS_PER_FRAME;
}

export function nextSecurityInstanceId(zonesState) {
  const next = Math.max(1, Number(zonesState?.nextVisitorInstance) || 1);
  return {
    id: `vis-${next}`,
    nextVisitorInstance: next + 1,
  };
}

export function createSecurityZonesState(extras = {}) {
  return {
    version: 1,
    nextVisitorInstance: Math.max(1, Number(extras.nextVisitorInstance) || 1),
    systems: extras.systems && typeof extras.systems === 'object' ? extras.systems : {},
  };
}

export function createSecurityEncountersState(extras = {}) {
  return {
    version: 1,
    nextEncounterId: Math.max(1, Number(extras.nextEncounterId) || 1),
    systems: extras.systems && typeof extras.systems === 'object' ? extras.systems : {},
  };
}

export function createSystemEncounterLedger(extras = {}) {
  return {
    localElapsedMs: Math.max(0, Number(extras.localElapsedMs) || 0),
    visitors: extras.visitors && typeof extras.visitors === 'object' ? extras.visitors : {},
    orders: extras.orders && typeof extras.orders === 'object' ? extras.orders : {},
    participants: extras.participants && typeof extras.participants === 'object' ? extras.participants : {},
    recentEvents: Array.isArray(extras.recentEvents) ? extras.recentEvents.slice(-RECENT_EVENT_CAP) : [],
    clearances: extras.clearances && typeof extras.clearances === 'object' ? extras.clearances : {},
  };
}

export function createPlayerCheckpointConfig(extras = {}) {
  return {
    enabled: Boolean(extras.enabled),
    zoneId: extras.zoneId || null,
    anchorStationId: extras.anchorStationId != null ? String(extras.anchorStationId) : null,
    purpose: extras.purpose || 'border-identity',
    authorityEpoch: Math.max(0, Number(extras.authorityEpoch) || 0),
    lastAuthoritySide: extras.lastAuthoritySide || null,
  };
}

export function authoredVulcanDefinition(systemIndex) {
  return {
    zoneId: AUTHORED_VULCAN_ZONE_ID,
    systemIndex: Number(systemIndex),
    foreign: true,
    enabled: true,
    purpose: 'border-identity',
    policy: {
      roe: AUTHORED_VULCAN_POLICY.roe,
      access: cloneAccess(AUTHORED_VULCAN_POLICY.access),
      alerts: AUTHORED_VULCAN_POLICY.alerts,
    },
  };
}

export function playerZoneId(systemIndex) {
  return `player:${Number(systemIndex)}`;
}

export function isOrderableRole(role) {
  return ORDERABLE_ROLES.includes(String(role || ''));
}

export function isTerminalLifecycle(lifecycle) {
  return TERMINAL_LIFECYCLES.includes(String(lifecycle || ''));
}

export function inspectionOrderActive(order) {
  if (!order || isTerminalLifecycle(order.lifecycle)) return false;
  return order.instructionKind === 'challenge' || order.instructionKind === 'withdrawal';
}

export function complianceVerified(order) {
  return Boolean(order?.complianceVerified) && (order.lifecycle === 'cleared' || order.lifecycle === 'withdrawn');
}

/**
 * Phase 3 broadcast: hull-derived for NPCs, declared for the player/custom.
 * A hull-derived `neutral` classifies as independent. `unknown` is only
 * `source: 'none'`, which no current spawner produces.
 */
export function makeBroadcast({ faction, source } = {}) {
  const src = source === 'declared' || source === 'none' || source === 'hull' ? source : 'hull';
  return {
    faction: normalizeKey(faction, src === 'none' ? '' : 'neutral'),
    source: src,
  };
}

export function getVisitorAccessDecision(zone, contact = {}, helpers = {}) {
  const authoritySide = normalizeKey(zone?.authoritySide);
  const authorityFlag = normalizeKey(zone?.authorityFlag || authoritySide);
  const visitorSide = normalizeKey(contact.sideId);
  const broadcast = makeBroadcast(contact.broadcast || {});
  const access = cloneAccess(zone?.policy?.access || zone?.access);
  const factionsOpposed = typeof helpers.factionsOpposed === 'function'
    ? helpers.factionsOpposed
    : () => false;

  if (authoritySide && visitorSide && visitorSide === authoritySide) {
    return {
      class: 'exempt',
      decision: 'open',
      enforceable: false,
      reason: 'own-side',
    };
  }
  if (broadcast.source === 'none') {
    return {
      class: 'unknown',
      decision: access.unknown,
      enforceable: false,
      reason: 'unidentified-broadcast',
    };
  }

  let cls = 'other';
  if (broadcast.faction && factionsOpposed(broadcast.faction, authorityFlag)) {
    cls = 'warFlag';
  } else if (broadcast.faction === 'neutral' || broadcast.faction === 'independent') {
    cls = 'independent';
  } else {
    cls = 'other';
  }

  const decision = access[cls] || 'open';
  const enforceable = cls !== 'unknown' && (decision === 'challenge' || decision === 'closed');
  return {
    class: cls,
    decision,
    enforceable,
    reason: cls,
  };
}

export function accessDecisionForInstruction(decision) {
  if (decision === 'closed') return 'withdrawal';
  if (decision === 'challenge') return 'challenge';
  return null;
}

export function isStricterAccess(previous, next) {
  const rank = { open: 0, challenge: 1, closed: 2 };
  return (rank[next] ?? 0) > (rank[previous] ?? 0);
}

export function relevantAccessChanged(previousAccess, nextAccess, visitorClass) {
  if (!visitorClass || visitorClass === 'exempt' || visitorClass === 'unknown') return false;
  const prev = previousAccess?.[visitorClass];
  const next = nextAccess?.[visitorClass];
  return prev !== next;
}

export function createEncounterRecord({
  encounterId,
  zoneId,
  systemIndex,
  authoritySide,
  authorityFlag,
  authorityEpoch,
  visitorInstanceId,
  visitorKind,
  npcId = null,
  entryEpisode,
  instructionKind,
  reason,
  holdPolar,
  exitPolar,
  remainingTravelMs,
  policyRevision,
  accessClass,
  accessDecision,
  localElapsedMs,
} = {}) {
  return {
    encounterId,
    zoneId,
    systemIndex: Number(systemIndex),
    authoritySide,
    authorityFlag,
    authorityEpoch: Number(authorityEpoch) || 0,
    visitorInstanceId,
    visitorKind: visitorKind || 'npc',
    npcId: npcId != null ? String(npcId) : null,
    entryEpisode: Number(entryEpisode) || 1,
    instructionKind,
    lifecycle: 'pending',
    reason: reason || instructionKind,
    holdPolar: holdPolar ? { ...holdPolar } : null,
    exitPolar: exitPolar ? { ...exitPolar } : null,
    remainingTravelMs: Math.max(0, Number(remainingTravelMs) || 0),
    accumulatedDwellMs: 0,
    result: null,
    outcome: null,
    policyRevision: Number(policyRevision) || 1,
    revision: 1,
    accessClass: accessClass || null,
    accessDecision: accessDecision || null,
    issuedAtLocalMs: Number(localElapsedMs) || 0,
    lastUpdateLocalMs: Number(localElapsedMs) || 0,
    complianceVerified: false,
    complianceScope: null,
    accessClearance: false,
    clearanceProvenance: null,
    waived: false,
  };
}

export function deriveEncounterFacts(order) {
  return {
    inspection_order_active: inspectionOrderActive(order),
    compliance_verified: complianceVerified(order),
    access_clearance: Boolean(order?.accessClearance),
  };
}

export function closeEncounter(order, lifecycle, extras = {}) {
  if (!order) return null;
  const next = { ...order, ...extras };
  next.lifecycle = lifecycle;
  next.result = extras.result != null ? extras.result : lifecycle;
  next.lastUpdateLocalMs = extras.localElapsedMs != null ? extras.localElapsedMs : order.lastUpdateLocalMs;
  if (lifecycle === 'cleared') {
    next.complianceVerified = true;
    next.complianceScope = extras.complianceScope || 'movement_identity';
    next.accessClearance = true;
    next.clearanceProvenance = extras.clearanceProvenance || 'check';
    next.outcome = next.outcome || null;
  } else if (lifecycle === 'withdrawn') {
    next.complianceScope = extras.complianceScope || 'withdrawal';
    if (extras.complianceVerified) {
      next.complianceVerified = true;
      next.accessClearance = false;
    }
    if (!next.outcome) next.outcome = extras.keepNoncompliant ? 'noncompliant' : null;
  } else if (lifecycle === 'waived') {
    next.accessClearance = true;
    next.waived = true;
    next.complianceVerified = false;
    next.clearanceProvenance = 'waiver';
  } else if (lifecycle === 'refused' || lifecycle === 'expired') {
    next.outcome = 'noncompliant';
    next.accessClearance = false;
    next.complianceVerified = false;
  } else if (lifecycle === 'policy_relaxed' || lifecycle === 'canceled' || lifecycle === 'zone_reconfigured') {
    next.accessClearance = Boolean(extras.accessClearance);
  }
  return next;
}

export function visitorHasBlockingOrder(order) {
  if (!order || isTerminalLifecycle(order.lifecycle)) return false;
  return order.lifecycle === 'pending' || order.lifecycle === 'holding' || order.lifecycle === 'dwelling';
}

export function visitorIsNoncompliant(order) {
  return order?.outcome === 'noncompliant';
}

export function visitorDeniedServices(order) {
  if (!order) return false;
  if (order.accessClearance && !visitorHasBlockingOrder(order)) return false;
  if (visitorHasBlockingOrder(order)) return true;
  if (visitorIsNoncompliant(order)) return true;
  return false;
}

export function createVisitorBoundaryState(extras = {}) {
  return {
    instanceId: extras.instanceId,
    npcId: extras.npcId != null ? String(extras.npcId) : null,
    visitorKind: extras.visitorKind || 'npc',
    inside: Boolean(extras.inside),
    fullyOutside: extras.fullyOutside !== false,
    lastDistance: Number(extras.lastDistance) || 0,
    entryEpisode: Math.max(0, Number(extras.entryEpisode) || 0),
    observed: Boolean(extras.observed),
    lastInside: Boolean(extras.inside),
    withdrawnSeparated: Boolean(extras.withdrawnSeparated),
  };
}

export function updateVisitorBoundary(visitor, distance, geometry, { sceneJustLoaded = false } = {}) {
  const next = { ...visitor };
  const inside = distance <= geometry.radius;
  const fullyOutside = distance > geometry.reentryHysteresisDistance;
  const wasInside = Boolean(visitor.inside);
  const wasObserved = Boolean(visitor.observed);
  let newEpisode = false;
  let alreadyInsideQualifies = false;

  if (sceneJustLoaded) {
    next.inside = inside;
    next.fullyOutside = fullyOutside;
    next.lastDistance = distance;
    next.observed = true;
    next.lastInside = inside;
    return { visitor: next, newEpisode: false, alreadyInsideQualifies: false };
  }

  if (!wasObserved && inside) {
    alreadyInsideQualifies = true;
    next.entryEpisode = (Number(next.entryEpisode) || 0) + 1;
    newEpisode = true;
  } else if (!wasInside && inside && (visitor.fullyOutside || visitor.withdrawnSeparated || !wasObserved)) {
    next.entryEpisode = (Number(next.entryEpisode) || 0) + 1;
    newEpisode = true;
    next.withdrawnSeparated = false;
  }

  next.inside = inside;
  next.fullyOutside = fullyOutside;
  next.lastDistance = distance;
  next.observed = true;
  next.lastInside = inside;
  if (fullyOutside) next.withdrawnSeparated = true;
  return { visitor: next, newEpisode, alreadyInsideQualifies };
}

export function createLedgerEvent(systemIndex, order, type, localElapsedMs, detail = '') {
  return {
    at: Number(localElapsedMs) || 0,
    systemIndex: Number(systemIndex),
    encounterId: order?.encounterId || null,
    visitorInstanceId: order?.visitorInstanceId || null,
    type,
    lifecycle: order?.lifecycle || null,
    detail: String(detail || ''),
  };
}

export function pushLedgerEvent(ledger, event) {
  const recentEvents = [...(ledger.recentEvents || []), event].slice(-RECENT_EVENT_CAP);
  return { ...ledger, recentEvents };
}

export function activeOrders(ledger) {
  return Object.values(ledger?.orders || {}).filter((order) => !isTerminalLifecycle(order.lifecycle));
}

export function findActiveOrderForVisitor(ledger, instanceId) {
  return activeOrders(ledger).find((order) => order.visitorInstanceId === instanceId) || null;
}

export function findLatestOrderForVisitor(ledger, instanceId) {
  const orders = Object.values(ledger?.orders || {}).filter((order) => order.visitorInstanceId === instanceId);
  if (!orders.length) return null;
  return orders.reduce((best, order) => (
    Number(order.lastUpdateLocalMs) >= Number(best.lastUpdateLocalMs) ? order : best
  ));
}

export function countActiveOrders(ledger) {
  return activeOrders(ledger).length;
}

export function pruneResolvedOrders(ledger) {
  const orders = { ...(ledger.orders || {}) };
  const resolved = Object.values(orders)
    .filter((order) => isTerminalLifecycle(order.lifecycle))
    .sort((a, b) => Number(a.lastUpdateLocalMs) - Number(b.lastUpdateLocalMs));
  const overflow = Math.max(0, resolved.length - RECENT_EVENT_CAP);
  for (let i = 0; i < overflow; i += 1) {
    delete orders[resolved[i].encounterId];
  }
  return { ...ledger, orders };
}

export function serializeSecurityZones(zones) {
  const state = createSecurityZonesState(zones);
  return {
    version: 1,
    nextVisitorInstance: state.nextVisitorInstance,
    systems: JSON.parse(JSON.stringify(state.systems || {})),
  };
}

export function serializeSecurityEncounters(encounters) {
  const state = createSecurityEncountersState(encounters);
  return {
    version: 1,
    nextEncounterId: state.nextEncounterId,
    systems: JSON.parse(JSON.stringify(state.systems || {})),
  };
}

function sanitizePolar(polar) {
  if (!polar || typeof polar !== 'object') return null;
  const angle = Number(polar.angle);
  const distance = Number(polar.distance);
  if (!Number.isFinite(angle) || !Number.isFinite(distance)) return null;
  return { angle, distance: Math.max(0, distance) };
}

function sanitizeOrder(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const instructionKind = raw.instructionKind === 'withdrawal' ? 'withdrawal' : 'challenge';
  const lifecycle = String(raw.lifecycle || 'pending');
  return {
    encounterId: String(raw.encounterId || ''),
    zoneId: String(raw.zoneId || ''),
    systemIndex: Number(raw.systemIndex),
    authoritySide: normalizeKey(raw.authoritySide),
    authorityFlag: normalizeKey(raw.authorityFlag),
    authorityEpoch: Math.max(0, Number(raw.authorityEpoch) || 0),
    visitorInstanceId: String(raw.visitorInstanceId || ''),
    visitorKind: raw.visitorKind === 'player' ? 'player' : 'npc',
    npcId: raw.npcId != null ? String(raw.npcId) : null,
    entryEpisode: Math.max(0, Number(raw.entryEpisode) || 0),
    instructionKind,
    lifecycle,
    reason: String(raw.reason || instructionKind),
    holdPolar: sanitizePolar(raw.holdPolar),
    exitPolar: sanitizePolar(raw.exitPolar),
    remainingTravelMs: Math.max(0, Number(raw.remainingTravelMs) || 0),
    accumulatedDwellMs: Math.max(0, Number(raw.accumulatedDwellMs) || 0),
    result: raw.result != null ? String(raw.result) : null,
    outcome: raw.outcome != null ? String(raw.outcome) : null,
    policyRevision: Math.max(1, Number(raw.policyRevision) || 1),
    revision: Math.max(1, Number(raw.revision) || 1),
    accessClass: ACCESS_CLASS_SET.has(raw.accessClass) || raw.accessClass === 'exempt' ? raw.accessClass : null,
    accessDecision: ACCESS_VALUE_SET.has(raw.accessDecision) ? raw.accessDecision : null,
    issuedAtLocalMs: Math.max(0, Number(raw.issuedAtLocalMs) || 0),
    lastUpdateLocalMs: Math.max(0, Number(raw.lastUpdateLocalMs) || 0),
    complianceVerified: Boolean(raw.complianceVerified),
    complianceScope: raw.complianceScope || null,
    accessClearance: Boolean(raw.accessClearance),
    clearanceProvenance: raw.clearanceProvenance || null,
    waived: Boolean(raw.waived),
  };
}

function sanitizeVisitor(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return createVisitorBoundaryState(raw);
}

function sanitizeParticipant(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    instanceId: String(raw.instanceId || ''),
    slotId: raw.slotId != null ? String(raw.slotId) : null,
    visitorKind: raw.visitorKind === 'player' ? 'player' : 'npc',
    shipId: Number.isFinite(Number(raw.shipId)) ? Number(raw.shipId) : null,
    name: raw.name != null ? String(raw.name) : null,
    faction: normalizeKey(raw.faction, 'neutral'),
    role: raw.role != null ? String(raw.role) : 'traffic',
    sideId: raw.sideId != null ? String(raw.sideId) : null,
    x: Number(raw.x) || 0,
    y: Number(raw.y) || 0,
    heading: Number(raw.heading) || 0,
    destination: raw.destination && typeof raw.destination === 'object'
      ? { x: Number(raw.destination.x) || 0, y: Number(raw.destination.y) || 0 }
      : null,
    destinationName: raw.destinationName != null ? String(raw.destinationName) : null,
    securityObjective: raw.securityObjective && typeof raw.securityObjective === 'object'
      ? { ...raw.securityObjective }
      : null,
    combatHull: Number.isFinite(Number(raw.combatHull)) ? Number(raw.combatHull) : null,
    maxCombatHull: Number.isFinite(Number(raw.maxCombatHull)) ? Number(raw.maxCombatHull) : null,
    combatShields: Number.isFinite(Number(raw.combatShields)) ? Number(raw.combatShields) : null,
    maxCombatShields: Number.isFinite(Number(raw.maxCombatShields)) ? Number(raw.maxCombatShields) : null,
    remainingWaitMs: Math.max(0, Number(raw.remainingWaitMs) || 0),
    remainingAmbientWarpMs: Math.max(0, Number(raw.remainingAmbientWarpMs) || 0),
    speed: Number.isFinite(Number(raw.speed)) ? Number(raw.speed) : null,
    turnRate: Number.isFinite(Number(raw.turnRate)) ? Number(raw.turnRate) : null,
    seed: Number.isFinite(Number(raw.seed)) ? Number(raw.seed) : null,
    leg: Number.isFinite(Number(raw.leg)) ? Number(raw.leg) : 0,
    identityLocked: true,
  };
}

export function restoreSecurityZones(saved) {
  if (!saved || typeof saved !== 'object') return createSecurityZonesState();
  const systems = {};
  for (const [key, entry] of Object.entries(saved.systems || {})) {
    if (!entry || typeof entry !== 'object') continue;
    systems[String(Number(key))] = {
      playerConfiguration: createPlayerCheckpointConfig(entry.playerConfiguration || {}),
      authorityEpoch: Math.max(0, Number(entry.authorityEpoch) || 0),
      lastAuthoritySide: entry.lastAuthoritySide || null,
    };
  }
  return createSecurityZonesState({
    nextVisitorInstance: saved.nextVisitorInstance,
    systems,
  });
}

export function restoreSecurityEncounters(saved) {
  if (!saved || typeof saved !== 'object') return createSecurityEncountersState();
  const systems = {};
  for (const [key, raw] of Object.entries(saved.systems || {})) {
    if (!raw || typeof raw !== 'object') continue;
    const visitors = {};
    for (const [id, visitor] of Object.entries(raw.visitors || {})) {
      const clean = sanitizeVisitor(visitor);
      if (clean?.instanceId) visitors[id] = clean;
    }
    const orders = {};
    for (const [id, order] of Object.entries(raw.orders || {})) {
      const clean = sanitizeOrder(order);
      if (clean?.encounterId) orders[id] = clean;
    }
    const participants = {};
    for (const [id, participant] of Object.entries(raw.participants || {})) {
      const clean = sanitizeParticipant(participant);
      if (clean?.instanceId) participants[id] = clean;
    }
    const clearances = {};
    for (const [id, clearance] of Object.entries(raw.clearances || {})) {
      if (!clearance || typeof clearance !== 'object') continue;
      clearances[id] = {
        instanceId: String(clearance.instanceId || id),
        encounterId: clearance.encounterId != null ? String(clearance.encounterId) : null,
        authorityEpoch: Number(clearance.authorityEpoch) || 0,
        granted: Boolean(clearance.granted),
        provenance: clearance.provenance || null,
        visitEpisode: Number(clearance.visitEpisode) || 0,
      };
    }
    systems[String(Number(key))] = createSystemEncounterLedger({
      localElapsedMs: raw.localElapsedMs,
      visitors,
      orders,
      participants,
      recentEvents: Array.isArray(raw.recentEvents) ? raw.recentEvents.slice(-RECENT_EVENT_CAP) : [],
      clearances,
    });
  }
  return createSecurityEncountersState({
    nextEncounterId: saved.nextEncounterId,
    systems,
  });
}

export function incrementAuthorityEpoch(zones, systemIndex, newAuthoritySide) {
  const key = String(Number(systemIndex));
  const current = zones.systems[key] || { playerConfiguration: createPlayerCheckpointConfig(), authorityEpoch: 0 };
  const nextEpoch = (Number(current.authorityEpoch) || 0) + 1;
  return {
    ...zones,
    systems: {
      ...zones.systems,
      [key]: {
        ...current,
        authorityEpoch: nextEpoch,
        lastAuthoritySide: newAuthoritySide || current.lastAuthoritySide,
        playerConfiguration: {
          ...(current.playerConfiguration || createPlayerCheckpointConfig()),
          authorityEpoch: nextEpoch,
          lastAuthoritySide: newAuthoritySide || current.lastAuthoritySide,
        },
      },
    },
  };
}

export function setPlayerCheckpointConfig(zones, systemIndex, config) {
  const key = String(Number(systemIndex));
  const current = zones.systems[key] || { playerConfiguration: createPlayerCheckpointConfig(), authorityEpoch: 0 };
  return {
    ...zones,
    systems: {
      ...zones.systems,
      [key]: {
        ...current,
        playerConfiguration: createPlayerCheckpointConfig({
          ...(current.playerConfiguration || {}),
          ...config,
        }),
      },
    },
  };
}

export function mergeAccessClass(access, cls, value) {
  const next = cloneAccess(access);
  if (!ACCESS_CLASS_SET.has(cls)) return next;
  if (!ACCESS_VALUE_SET.has(value)) return next;
  next[cls] = value;
  return next;
}

export function defaultOpenAccess() {
  return cloneAccess({
    warFlag: 'open',
    independent: 'open',
    unknown: 'open',
    other: 'open',
  });
}

export function describeInstruction(order, authorityLabel = 'Checkpoint') {
  if (!order) return '';
  if (order.instructionKind === 'withdrawal') {
    return `${authorityLabel} requests withdrawal from the restricted area.`;
  }
  return `${authorityLabel} requests you hold at the marked point for an identity check.`;
}

export function remainingSeconds(order) {
  return Math.max(0, Math.ceil((Number(order?.remainingTravelMs) || 0) / 1000));
}

export function checkpointDockReason(order) {
  if (!order) return '';
  if (order.instructionKind === 'withdrawal' || order.accessDecision === 'closed') {
    return 'Withdraw from the restricted area';
  }
  return 'Hold at the marker for clearance';
}

export function createSecurityObjective({ kind, encounterId, polar, displayName }) {
  return {
    kind,
    encounterId,
    polar: polar ? { ...polar } : null,
    displayName: displayName || (kind === 'hold' ? 'checkpoint hold' : kind === 'withdraw' ? 'checkpoint exit' : 'checkpoint approach'),
  };
}

export function effectivePolicyAccess(policy) {
  return cloneAccess(policy?.access || createEmpireDefaultPolicy().access);
}

export function visitorServiceState(ledger, instanceId) {
  const order = findLatestOrderForVisitor(ledger, instanceId);
  return {
    order,
    pending: visitorHasBlockingOrder(order),
    noncompliant: visitorIsNoncompliant(order),
    denied: visitorDeniedServices(order),
    cleared: Boolean(order?.accessClearance && !visitorHasBlockingOrder(order)),
  };
}
