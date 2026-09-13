/**
 * Phase 7 — fleet coordination and border encounters.
 *
 * Source of truth:
 * - docs/revised-development-plan.md §4 Phase 7
 * - docs/revised-development-plan.md §9 Fleet coordination and border encounters
 *
 * Written from those plan sections + room locks only. Does not crib
 * BM1-remastered-work.
 *
 * Exit condition: Orders persist; escorts can hold outside a boundary while
 * the flagship proceeds.
 *
 * Jump policy (first-slice default): ships assigned to the flagship
 * (follow / escort / regroup) travel with the jump. Ships holding elsewhere
 * (hold, hold-outside, defend-area, withdraw, focus-target) stay behind and
 * require recall (regroup) to travel. Rally follows only when its destination
 * system is the jump target.
 *
 * Soft / later (stubbed, not live):
 * - Communications failures delaying orders
 * - Tension from known force size / posture / incidents
 */

export const FLEET_ORDERS_VERSION = 1;
export const COMMS_FAILURES_IMPLEMENTED = false;
export const TENSION_POSTURE_IMPLEMENTED = false;
export const FORBIDDEN_FIRE_INJECT = 'engagement_authorized';

export const ORDER_KINDS = Object.freeze([
  'hold',
  'hold_outside',
  'rally',
  'follow',
  'escort',
  'defend_area',
  'focus_target',
  'regroup',
  'withdraw',
]);

export const ORDER_STATUSES = Object.freeze([
  'standing',
  'interrupted',
  'superseded',
  'complete',
  'recalled',
]);

export const INTERRUPT_KINDS = Object.freeze([
  'defense',
  'retreat',
  'new_order',
]);

export const FLEET_ROLES = Object.freeze([
  'screen',
  'scout',
  'support',
  'withdrawal_cover',
]);

export const JUMP_POLICIES = Object.freeze(['follow', 'stay']);

export const HOLD_OUTSIDE_MARGIN = 80;
export const MIN_ESCORT_STACK_DIST = 40;
export const ROLE_LATERAL_SPACING = 55;
export const DEFAULT_APPROACH_RADIUS = 420;

export const ROLE_RADIAL = Object.freeze({
  screen: 16,
  scout: 72,
  support: 0,
  withdrawal_cover: 36,
});

const KIND_SET = new Set(ORDER_KINDS);
const STATUS_SET = new Set(ORDER_STATUSES);
const INTERRUPT_SET = new Set(INTERRUPT_KINDS);
const ROLE_SET = new Set(FLEET_ROLES);
const JUMP_SET = new Set(JUMP_POLICIES);

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeKey(value, fallback = '') {
  const key = String(value ?? '').trim();
  return key && key !== 'undefined' && key !== 'null' ? key : fallback;
}

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function optionalIndex(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function pointOf(input, fallback = { x: 0, y: 0 }) {
  if (!input || typeof input !== 'object') return { x: fallback.x, y: fallback.y };
  return { x: asNumber(input.x, fallback.x), y: asNumber(input.y, fallback.y) };
}

function distance(a, b) {
  return Math.hypot(asNumber(a?.x) - asNumber(b?.x), asNumber(a?.y) - asNumber(b?.y));
}

export function defaultJumpPolicyForKind(kind) {
  if (kind === 'follow' || kind === 'escort' || kind === 'regroup') return 'follow';
  return 'stay';
}

export function usesFormationSlot(order) {
  const kind = order?.kind;
  return !order || kind === 'follow' || kind === 'escort' || kind === 'regroup';
}

export function createFleetOrderBoard(extras = {}) {
  return {
    version: FLEET_ORDERS_VERSION,
    nextOrderId: Math.max(1, asNumber(extras.nextOrderId, 1)),
    orders: extras.orders && typeof extras.orders === 'object' ? extras.orders : {},
    shipIndex: extras.shipIndex && typeof extras.shipIndex === 'object' ? extras.shipIndex : {},
    lastJournal: extras.lastJournal || null,
    commsFailures: COMMS_FAILURES_IMPLEMENTED,
    tensionPosture: TENSION_POSTURE_IMPLEMENTED,
  };
}

export function emptyFleetOrderBoard() {
  return createFleetOrderBoard();
}

export function serializeFleetOrders(board) {
  return clone(board || emptyFleetOrderBoard());
}

export function restoreFleetOrders(raw) {
  if (!raw || typeof raw !== 'object') return emptyFleetOrderBoard();
  const board = createFleetOrderBoard({
    nextOrderId: raw.nextOrderId,
    orders: {},
    shipIndex: {},
    lastJournal: raw.lastJournal || null,
  });
  for (const [id, row] of Object.entries(raw.orders || {})) {
    if (!row || typeof row !== 'object') continue;
    board.orders[id] = normalizeOrder({ ...row, orderId: row.orderId || id });
  }
  for (const [shipId, orderId] of Object.entries(raw.shipIndex || {})) {
    if (board.orders[orderId]) board.shipIndex[shipId] = orderId;
  }
  board.nextOrderId = Math.max(
    board.nextOrderId,
    Object.keys(board.orders).reduce((max, id) => {
      const n = Number(String(id).replace(/\D/g, ''));
      return Number.isFinite(n) ? Math.max(max, n + 1) : max;
    }, 1),
  );
  return board;
}

function takeOrderId(board) {
  const n = board.nextOrderId || 1;
  board.nextOrderId = n + 1;
  return `ford-${n}`;
}

function normalizeRole(role, fallback = 'support') {
  const key = String(role || '').trim().toLowerCase();
  return ROLE_SET.has(key) ? key : fallback;
}

function normalizeKind(kind, fallback = 'follow') {
  const key = String(kind || '').trim().toLowerCase();
  return KIND_SET.has(key) ? key : fallback;
}

function normalizeOrder(input = {}) {
  const kind = normalizeKind(input.kind, 'follow');
  const jumpPolicy = JUMP_SET.has(input.jumpPolicy)
    ? input.jumpPolicy
    : defaultJumpPolicyForKind(kind);
  const status = STATUS_SET.has(input.status) ? input.status : 'standing';
  const assignedShipIds = Array.isArray(input.assignedShipIds)
    ? input.assignedShipIds.map((id) => normalizeKey(id)).filter(Boolean)
    : [];
  return {
    orderId: normalizeKey(input.orderId, 'ford-0'),
    kind,
    status,
    assignedShipIds,
    role: normalizeRole(input.role, 'support'),
    jumpPolicy,
    assignedSystemIndex: optionalIndex(input.assignedSystemIndex),
    parkedSystemIndex: optionalIndex(input.parkedSystemIndex),
    boundaryId: normalizeKey(input.boundaryId, ''),
    destination: input.destination && typeof input.destination === 'object'
      ? {
        x: asNumber(input.destination.x, 0),
        y: asNumber(input.destination.y, 0),
        name: normalizeKey(input.destination.name, kind),
        systemIndex: optionalIndex(input.destination.systemIndex),
        targetId: normalizeKey(input.destination.targetId, ''),
      }
      : null,
    standing: input.standing && typeof input.standing === 'object' ? clone(input.standing) : null,
    interrupt: input.interrupt && typeof input.interrupt === 'object'
      ? {
        kind: INTERRUPT_SET.has(input.interrupt.kind) ? input.interrupt.kind : 'defense',
        atStrategicJumps: asNumber(input.interrupt.atStrategicJumps, 0),
        reason: normalizeKey(input.interrupt.reason, input.interrupt.kind || 'defense'),
        previousOrderId: normalizeKey(input.interrupt.previousOrderId, ''),
      }
      : null,
    history: Array.isArray(input.history) ? input.history.map((row) => clone(row)) : [],
    createdAtStrategicJumps: asNumber(input.createdAtStrategicJumps, 0),
    label: normalizeKey(input.label, kind),
  };
}

function appendHistory(order, type, detail, at = 0) {
  order.history = Array.isArray(order.history) ? order.history : [];
  order.history.push({
    type,
    detail: detail || type,
    atStrategicJumps: asNumber(at, 0),
  });
  if (order.history.length > 24) order.history.splice(0, order.history.length - 24);
}

function standingSnapshot(order) {
  return {
    kind: order.kind,
    role: order.role,
    jumpPolicy: order.jumpPolicy,
    assignedSystemIndex: order.assignedSystemIndex,
    parkedSystemIndex: order.parkedSystemIndex,
    boundaryId: order.boundaryId,
    destination: clone(order.destination),
    label: order.label,
  };
}

function emptyFireFacts() {
  return {
    engagement_authorized: undefined,
    liveWeaponTrack: false,
    cultureFire: false,
  };
}

export function findOrder(board, orderId) {
  return board?.orders?.[normalizeKey(orderId)] || null;
}

export function findOrderForShip(board, shipId) {
  const id = board?.shipIndex?.[normalizeKey(shipId)];
  return id ? findOrder(board, id) : null;
}

export function listStandingOrders(board) {
  return Object.values(board?.orders || {}).filter((row) => (
    row.status === 'standing' || row.status === 'interrupted'
  ));
}

/**
 * New orders record supersede of the previous standing assignment.
 * They never inject engagement_authorized or culture fire, and they never
 * receive or mutate a Phase 6 contact book.
 */
export function issueOrder(board, input = {}, extras = {}) {
  const store = board || emptyFleetOrderBoard();
  const kind = normalizeKind(input.kind, 'follow');
  const assignedShipIds = Array.isArray(input.assignedShipIds)
    ? input.assignedShipIds.map((id) => normalizeKey(id)).filter(Boolean)
    : [];
  const at = asNumber(extras.atStrategicJumps, 0);
  const superseded = [];
  for (const shipId of assignedShipIds) {
    const prior = findOrderForShip(store, shipId);
    if (!prior || prior.status === 'superseded' || prior.status === 'complete') continue;
    prior.status = 'superseded';
    appendHistory(prior, 'superseded', kind, at);
    superseded.push(prior.orderId);
  }
  const order = normalizeOrder({
    orderId: takeOrderId(store),
    kind,
    status: 'standing',
    assignedShipIds,
    role: input.role,
    jumpPolicy: input.jumpPolicy || defaultJumpPolicyForKind(kind),
    assignedSystemIndex: input.assignedSystemIndex,
    parkedSystemIndex: null,
    boundaryId: input.boundaryId,
    destination: input.destination,
    standing: null,
    createdAtStrategicJumps: at,
    label: input.label || kind,
  });
  order.standing = standingSnapshot(order);
  if (superseded.length) {
    appendHistory(order, 'supersedes', superseded.join(','), at);
  }
  store.orders[order.orderId] = order;
  for (const shipId of assignedShipIds) store.shipIndex[shipId] = order.orderId;
  store.lastJournal = {
    type: 'issue',
    orderId: order.orderId,
    kind,
    superseded,
    atStrategicJumps: at,
  };
  return {
    ok: true,
    order,
    superseded,
    facts: emptyFireFacts(),
    engagement_authorized: undefined,
    contactBookMutated: false,
    contacts: extras.contacts ?? null,
  };
}

/**
 * Immediate defense, retreat, or a recorded new-order interrupt. Standing
 * destination / kind / jump policy stay on the order. Contact books are
 * passed through untouched.
 */
export function interruptOrder(board, orderId, interruptKind, extras = {}) {
  const order = findOrder(board, orderId);
  const kind = INTERRUPT_SET.has(interruptKind) ? interruptKind : 'defense';
  if (!order) {
    return {
      ok: false,
      reason: 'missing-order',
      facts: emptyFireFacts(),
      engagement_authorized: undefined,
      contactBookMutated: false,
      contacts: extras.contacts ?? null,
    };
  }
  if (!order.standing) order.standing = standingSnapshot(order);
  const at = asNumber(extras.atStrategicJumps, 0);
  if (kind === 'new_order') {
    order.status = 'superseded';
    appendHistory(order, 'superseded', extras.reason || 'new_order', at);
  } else {
    order.status = 'interrupted';
    order.interrupt = {
      kind,
      atStrategicJumps: at,
      reason: normalizeKey(extras.reason, kind),
      previousOrderId: order.orderId,
    };
    appendHistory(order, 'interrupt', kind, at);
  }
  if (board) {
    board.lastJournal = {
      type: 'interrupt',
      orderId: order.orderId,
      kind,
      atStrategicJumps: at,
    };
  }
  return {
    ok: true,
    order,
    facts: emptyFireFacts(),
    engagement_authorized: undefined,
    contactBookMutated: false,
    contacts: extras.contacts ?? null,
  };
}

export function resumeStanding(board, orderId, extras = {}) {
  const order = findOrder(board, orderId);
  if (!order) return { ok: false, reason: 'missing-order', contacts: extras.contacts ?? null };
  if (order.status !== 'interrupted' || !order.standing) {
    return { ok: true, order, resumed: false, contacts: extras.contacts ?? null };
  }
  const snap = order.standing;
  order.kind = snap.kind;
  order.role = snap.role;
  order.jumpPolicy = snap.jumpPolicy;
  order.assignedSystemIndex = snap.assignedSystemIndex;
  order.parkedSystemIndex = snap.parkedSystemIndex;
  order.boundaryId = snap.boundaryId;
  order.destination = clone(snap.destination);
  order.label = snap.label;
  order.status = 'standing';
  order.interrupt = null;
  appendHistory(order, 'resume', snap.kind, extras.atStrategicJumps);
  return {
    ok: true,
    order,
    resumed: true,
    facts: emptyFireFacts(),
    engagement_authorized: undefined,
    contactBookMutated: false,
    contacts: extras.contacts ?? null,
  };
}

export function shipFollowsJump(order, jumpTargetSystemIndex) {
  if (!order) return true;
  if (order.status === 'superseded' || order.status === 'complete') return true;
  const policy = JUMP_SET.has(order.jumpPolicy)
    ? order.jumpPolicy
    : defaultJumpPolicyForKind(order.kind);
  if (policy === 'follow') return true;
  if (
    order.kind === 'rally'
    && Number.isFinite(Number(order.destination?.systemIndex))
    && Number(order.destination.systemIndex) === Number(jumpTargetSystemIndex)
  ) {
    return true;
  }
  return false;
}

export function applyJumpToFleetOrders(board, fromIndex, toIndex, extras = {}) {
  const store = board || emptyFleetOrderBoard();
  const from = Number(fromIndex);
  const to = Number(toIndex);
  for (const order of listStandingOrders(store)) {
    if (shipFollowsJump(order, to)) {
      order.assignedSystemIndex = to;
      order.parkedSystemIndex = null;
      if (order.standing) {
        order.standing.assignedSystemIndex = to;
        order.standing.parkedSystemIndex = null;
      }
    } else if (order.parkedSystemIndex == null) {
      const parked = Number.isFinite(Number(order.assignedSystemIndex))
        ? Number(order.assignedSystemIndex)
        : from;
      order.parkedSystemIndex = parked;
      order.assignedSystemIndex = parked;
      if (order.standing) {
        order.standing.parkedSystemIndex = parked;
        order.standing.assignedSystemIndex = parked;
      }
    }
    appendHistory(order, 'jump', shipFollowsJump(order, to) ? 'follow' : 'stay', extras.atStrategicJumps);
  }
  store.lastJournal = {
    type: 'jump',
    fromIndex: from,
    toIndex: to,
    atStrategicJumps: asNumber(extras.atStrategicJumps, 0),
  };
  return store;
}

export function escortSpawnsInSystem(board, shipId, systemIndex) {
  const order = findOrderForShip(board, shipId);
  const index = Number(systemIndex);
  if (!order) return true;
  if (order.status === 'superseded' || order.status === 'complete') return true;
  if (shipFollowsJump(order, index) && order.parkedSystemIndex == null) return true;
  if (Number(order.assignedSystemIndex) === index) return true;
  if (Number(order.parkedSystemIndex) === index) return true;
  return false;
}

export function fallbackApproachGeometry(center, radius = DEFAULT_APPROACH_RADIUS) {
  const r = Math.max(120, asNumber(radius, DEFAULT_APPROACH_RADIUS));
  return {
    center: pointOf(center),
    radius: r,
    holdingDistance: r * 0.7,
    withdrawalCompleteDistance: r + 80,
  };
}

export function approachBearing(geometry, approachPoint) {
  const center = geometry?.center || { x: 0, y: 0 };
  const approach = pointOf(approachPoint, center);
  const angle = Math.atan2(approach.y - center.y, approach.x - center.x);
  return Number.isFinite(angle) ? angle : 0;
}

export function applyRoleOffset(base, role, index, count, bearing) {
  const named = normalizeRole(role, 'support');
  const radial = asNumber(ROLE_RADIAL[named], 0);
  const mid = (Math.max(1, count) - 1) / 2;
  const lateral = (asNumber(index, 0) - mid) * ROLE_LATERAL_SPACING;
  const perp = bearing + Math.PI / 2;
  return {
    x: base.x + Math.cos(bearing) * radial + Math.cos(perp) * lateral,
    y: base.y + Math.sin(bearing) * radial + Math.sin(perp) * lateral,
    role: named,
    radial,
    lateral,
  };
}

function pushOutsideBoundary(point, geometry, minDist) {
  const center = geometry?.center || { x: 0, y: 0 };
  const radius = asNumber(geometry?.radius, DEFAULT_APPROACH_RADIUS);
  const need = Math.max(radius + 1, asNumber(minDist, radius + 1));
  const d = distance(point, center);
  if (d >= need) return point;
  const bearing = d < 0.001 ? 0 : Math.atan2(point.y - center.y, point.x - center.x);
  return {
    x: center.x + Math.cos(bearing) * need,
    y: center.y + Math.sin(bearing) * need,
  };
}

function pushOffFlagship(point, flagshipDrop, minDist = MIN_ESCORT_STACK_DIST) {
  const drop = pointOf(flagshipDrop, point);
  const d = distance(point, drop);
  if (d >= minDist) return point;
  const bearing = d < 0.001
    ? 0
    : Math.atan2(point.y - drop.y, point.x - drop.x);
  const push = minDist + 8;
  return {
    x: drop.x + Math.cos(bearing) * push,
    y: drop.y + Math.sin(bearing) * push,
  };
}

/**
 * Escorts hold outside the legal boundary while the flagship proceeds.
 * Points stay outside radius and never stack on the flagship drop.
 */
export function placeHoldOutside(geometry, approachPoint, escorts = [], flagshipDrop = null, extras = {}) {
  const geo = geometry?.center
    ? geometry
    : fallbackApproachGeometry(approachPoint);
  const bearing = Number.isFinite(Number(extras.bearing))
    ? Number(extras.bearing)
    : approachBearing(geo, approachPoint || flagshipDrop);
  const holdDistance = asNumber(geo.radius, DEFAULT_APPROACH_RADIUS) + HOLD_OUTSIDE_MARGIN;
  const drop = pointOf(flagshipDrop || approachPoint, geo.center);
  const rows = Array.isArray(escorts) && escorts.length
    ? escorts
    : [{ id: 'escort-0', role: extras.role || 'support' }];
  const placed = rows.map((escort, index) => {
    const ring = {
      x: geo.center.x + Math.cos(bearing) * holdDistance,
      y: geo.center.y + Math.sin(bearing) * holdDistance,
    };
    let point = applyRoleOffset(ring, escort.role || extras.role, index, rows.length, bearing);
    point = pushOutsideBoundary(point, geo, geo.radius + HOLD_OUTSIDE_MARGIN * 0.5);
    point = pushOffFlagship(point, drop, extras.minStackDist || MIN_ESCORT_STACK_DIST);
    point = pushOutsideBoundary(point, geo, geo.radius + 1);
    return {
      id: normalizeKey(escort.id, `escort-${index}`),
      index,
      role: normalizeRole(escort.role || extras.role, 'support'),
      x: point.x,
      y: point.y,
      outside: distance(point, geo.center) >= asNumber(geo.radius, DEFAULT_APPROACH_RADIUS),
      stackedOnDrop: distance(point, drop) < (extras.minStackDist || MIN_ESCORT_STACK_DIST),
    };
  });
  return {
    bearing,
    holdDistance,
    points: placed,
    allOutside: placed.every((row) => row.outside),
    noneStacked: placed.every((row) => row.stackedOnDrop === false),
  };
}

export function escortsStackedOnDrop(drop, escorts, minDist = MIN_ESCORT_STACK_DIST) {
  return (escorts || []).some((escort) => distance(escort, drop) < minDist);
}

export function destinationForPeacefulEscort(order, formationPoint, resolvedPoint) {
  if (order?.status === 'interrupted' && (order.interrupt?.kind === 'defense' || order.interrupt?.kind === 'retreat')) {
    return null;
  }
  if (usesFormationSlot(order)) return pointOf(formationPoint);
  return pointOf(resolvedPoint || order?.destination, formationPoint);
}

export function resolveOrderPoint(order, context = {}) {
  if (!order) return pointOf(context.formation);
  if (order.kind === 'hold_outside') {
    const placed = placeHoldOutside(
      context.geometry,
      context.approachPoint || context.flagshipDrop,
      [{ id: context.shipId || 'escort', role: context.role || order.role }],
      context.flagshipDrop,
      { bearing: context.bearing, role: context.role || order.role },
    );
    return pointOf(placed.points[0], order.destination);
  }
  if (order.destination) return pointOf(order.destination);
  if (usesFormationSlot(order)) return pointOf(context.formation);
  return pointOf(context.formation);
}

export function listVisibleOrderMarkers(board, systemIndex) {
  const index = Number(systemIndex);
  return listStandingOrders(board)
    .filter((order) => {
      if (!order.destination) return false;
      if (Number.isFinite(Number(order.assignedSystemIndex))) {
        return Number(order.assignedSystemIndex) === index;
      }
      return true;
    })
    .map((order) => ({
      orderId: order.orderId,
      kind: order.kind,
      status: order.status,
      role: order.role,
      jumpPolicy: order.jumpPolicy,
      x: asNumber(order.destination?.x, 0),
      y: asNumber(order.destination?.y, 0),
      name: order.destination?.name || order.label || order.kind,
      label: describeOrderStatus(order),
    }));
}

export function describeOrderStatus(order) {
  if (!order) return 'no order';
  const dest = order.destination?.name || order.label || order.kind;
  const jump = order.jumpPolicy === 'stay' ? 'stay behind' : 'follows jump';
  if (order.status === 'interrupted') {
    return `${order.kind} · interrupted (${order.interrupt?.kind || 'defense'}) · ${dest}`;
  }
  return `${order.kind} · ${order.status} · ${dest} · ${jump}`;
}

export function describeRole(role) {
  const named = normalizeRole(role, 'support');
  if (named === 'screen') return 'screen ahead of the charge';
  if (named === 'scout') return 'scout farther out';
  if (named === 'withdrawal_cover') return 'cover the withdrawal bearing';
  return 'support near the hold';
}

export function formationShareMustNotGiftFiringSolution(shared = []) {
  return (shared || []).every((row) => row?.firingSolution !== true);
}

export function orderResultForbidsFireInject(result = {}) {
  return result.engagement_authorized == null
    && result.facts?.engagement_authorized == null
    && result[FORBIDDEN_FIRE_INJECT] == null;
}

export function interruptPreservesContactBook(before, after) {
  if (before == null && after == null) return true;
  if (before === after) return true;
  try {
    return JSON.stringify(before) === JSON.stringify(after);
  } catch {
    return false;
  }
}

export function commsDelayMs() {
  return 0;
}

export function commsFailureNote() {
  return {
    implemented: COMMS_FAILURES_IMPLEMENTED,
    stub: true,
    note: 'Communications failures that delay orders are deferred. Ships continue last received orders plus local self-preservation.',
  };
}

export function tensionFromKnownForce() {
  return {
    implemented: TENSION_POSTURE_IMPLEMENTED,
    stub: true,
    reason: 'deferred-phase7-soft',
    note: 'Tension from known force size, posture and incidents is deferred. No invented scores.',
  };
}

export function panelRows(board, extras = {}) {
  const names = extras.names && typeof extras.names === 'object' ? extras.names : {};
  const shipIds = Array.isArray(extras.shipIds)
    ? extras.shipIds
    : Object.keys(board?.shipIndex || {});
  return shipIds.map((shipId) => {
    const order = findOrderForShip(board, shipId);
    return {
      shipId,
      name: names[shipId] || shipId,
      kind: order?.kind || 'follow',
      status: order?.status || 'standing',
      role: order?.role || 'support',
      jumpPolicy: order?.jumpPolicy || 'follow',
      destination: order?.destination?.name || (usesFormationSlot(order) ? 'flagship' : 'hold'),
      label: describeOrderStatus(order || { kind: 'follow', status: 'standing', jumpPolicy: 'follow', label: 'flagship' }),
      parked: order?.parkedSystemIndex != null && Number.isFinite(Number(order.parkedSystemIndex)),
    };
  });
}
