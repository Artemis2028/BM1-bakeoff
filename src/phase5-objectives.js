/**
 * Phase 5 persistent objectives — convoy / distress + asset_overdue.
 *
 * Source of truth:
 * - docs/phase5/BM1-PHASE5-PERSISTENT-CONVOY-DISTRESS-PROPOSAL.md
 * - docs/phase5/BM1-PHASE5-ENGINE-DEPENDENCIES.md
 *
 * Hard gates: strategic clock only on completed warp/wormhole; stable IDs
 * outside systemStates; overdue ≠ destroyed ≠ attacker; actors from delivered
 * knowledge; reuse Phase 4 + side-lane civilians; no double standing;
 * reachable urgency without soft-reset; tiers tight < standard < soft.
 */

export const OBJECTIVE_BOARD_VERSION = 1;
export const ASSET_OVERDUE_IMPLEMENTED = true;
export const PHASE5_ASSET_OVERDUE = 'asset_overdue';

export const OBJECTIVE_KINDS = Object.freeze([
  'convoy_delivery',
  'distress_rescue',
  'asset_overdue',
]);

export const URGENCY_TIERS = Object.freeze(['tight', 'standard', 'soft']);
export const OBJECTIVE_STATUSES = Object.freeze(['open', 'closed']);
export const PLAYER_CHOICES = Object.freeze([
  'escort',
  'deliver',
  'investigate',
  'exploit',
  'ignore',
]);
export const SHORTAGE_GOODS = Object.freeze(['food', 'fuel', 'parts']);
export const SHORTAGE_STATUSES = Object.freeze(['open', 'filled', 'worsened', 'expired']);
export const ASSET_ROLES = Object.freeze([
  'freighter',
  'explorer',
  'refugee_transport',
  'construction_tender',
  'patrol',
  'convoy',
]);

/**
 * Injectable slack. Ordering is locked (tight < standard < soft). Exact
 * numbers are not bake-off balance constants.
 */
export const DEFAULT_TIER_SLACK = Object.freeze({
  tight: 1,
  standard: 2,
  soft: 4,
});

const KIND_SET = new Set(OBJECTIVE_KINDS);
const TIER_SET = new Set(URGENCY_TIERS);
const CHOICE_SET = new Set(PLAYER_CHOICES);
const GOOD_SET = new Set(SHORTAGE_GOODS);
const ROLE_SET = new Set(ASSET_ROLES);

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeKey(value, fallback = '') {
  const key = String(value ?? '').trim().toLowerCase();
  return key && key !== 'undefined' && key !== 'null' ? key : fallback;
}

function clampNonNeg(value) {
  return Math.max(0, Number(value) || 0);
}

export function resolveTierSlack(tier, injected = null) {
  const name = TIER_SET.has(tier) ? tier : 'standard';
  if (injected && Number.isFinite(Number(injected[name]))) {
    return Math.max(0, Number(injected[name]));
  }
  return DEFAULT_TIER_SLACK[name];
}

export function assertTierOrdering(slackByTier = null) {
  const tight = resolveTierSlack('tight', slackByTier);
  const standard = resolveTierSlack('standard', slackByTier);
  const soft = resolveTierSlack('soft', slackByTier);
  return tight < standard && standard < soft;
}

export function makeCloseToken(kind, assignmentId) {
  return `obj:${kind}:${assignmentId}`;
}

export function createObjectiveBoard(extras = {}) {
  return {
    version: OBJECTIVE_BOARD_VERSION,
    nextObjectiveId: Math.max(1, Number(extras.nextObjectiveId) || 1),
    nextConvoyId: Math.max(1, Number(extras.nextConvoyId) || 1),
    nextAssignmentId: Math.max(1, Number(extras.nextAssignmentId) || 1),
    nextShortageId: Math.max(1, Number(extras.nextShortageId) || 1),
    nextAssetId: Math.max(1, Number(extras.nextAssetId) || 1),
    objectives: extras.objectives && typeof extras.objectives === 'object' ? extras.objectives : {},
    convoys: extras.convoys && typeof extras.convoys === 'object' ? extras.convoys : {},
    shortages: extras.shortages && typeof extras.shortages === 'object' ? extras.shortages : {},
    assignments: extras.assignments && typeof extras.assignments === 'object' ? extras.assignments : {},
    closeTokens: extras.closeTokens && typeof extras.closeTokens === 'object' ? extras.closeTokens : {},
    lastJournal: extras.lastJournal || null,
  };
}

export function emptyObjectiveBoard() {
  return createObjectiveBoard();
}

function takeId(board, field, prefix) {
  const n = board[field] || 1;
  board[field] = n + 1;
  return `${prefix}-${n}`;
}

export function closeTokenAlreadyUsed(board, token) {
  return Boolean(board?.closeTokens?.[token]);
}

export function stampCloseToken(board, token, meta = {}) {
  if (!board || !token) return { ok: false, reason: 'invalid' };
  if (board.closeTokens[token]) return { ok: false, reason: 'already_closed', token };
  board.closeTokens[token] = {
    objectiveId: meta.objectiveId || null,
    reason: String(meta.reason || 'closed'),
    atStrategicJumps: clampNonNeg(meta.atStrategicJumps),
  };
  return { ok: true, token };
}

export function refuseReplacement(board, assignmentId, kind) {
  const token = makeCloseToken(kind, assignmentId);
  if (closeTokenAlreadyUsed(board, token)) {
    return { ok: false, reason: 'already_closed', token };
  }
  return { ok: true, token };
}

export function listObjectives(board) {
  return Object.values(board?.objectives || {});
}

export function listOpenObjectives(board) {
  return listObjectives(board).filter((row) => row.status === 'open');
}

export function getObjective(board, objectiveId) {
  if (!board || objectiveId == null) return null;
  return board.objectives[String(objectiveId)] || null;
}

export function getAssignment(board, assignmentId) {
  if (!board || assignmentId == null) return null;
  return board.assignments[String(assignmentId)] || null;
}

export function getConvoy(board, convoyId) {
  if (!board || convoyId == null) return null;
  return board.convoys[String(convoyId)] || null;
}

export function getShortage(board, shortageId) {
  if (!board || shortageId == null) return null;
  return board.shortages[String(shortageId)] || null;
}

export function plannedRouteJumpsFromPlot(plot = {}, { wormhole = false } = {}) {
  if (wormhole) return 1;
  const antimatter = Number(plot?.antimatter);
  if (Number.isFinite(antimatter) && antimatter >= 0) return Math.max(0, Math.ceil(antimatter));
  return Math.max(0, Number(plot?.plannedRouteJumps) || 0);
}

export function capacityJumpsFromShip({
  antimatter = 0,
  antimatterUse = 1,
  escorts = null,
} = {}) {
  const burn = Math.max(1, Number(antimatterUse) || 1);
  const assigned = Array.isArray(escorts) ? escorts.filter(Boolean) : [];
  if (assigned.length) {
    const values = assigned.map((escort) => {
      const am = Number(escort.antimatter);
      const escortBurn = Math.max(1, Number(escort.antimatterUse) || burn);
      return Math.floor((Number.isFinite(am) ? am : Number(antimatter) || 0) / escortBurn);
    });
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
  return Math.floor(Math.max(0, Number(antimatter) || 0) / burn);
}

export function computeReachableUrgency({
  plannedRouteJumps = 0,
  capacityJumps = 0,
  canPlot = true,
  openedAtStrategicJumps = 0,
  currentStrategicJumps = 0,
  urgencyTier = 'standard',
  slackByTier = null,
} = {}) {
  const route = Math.max(0, Number(plannedRouteJumps) || 0);
  const capacity = Number(capacityJumps) || 0;
  const slack = resolveTierSlack(urgencyTier, slackByTier);
  const tierBudget = route + slack;
  const openedAt = clampNonNeg(openedAtStrategicJumps);
  const current = clampNonNeg(currentStrategicJumps);
  const deadlineAt = openedAt + tierBudget;
  return {
    plannedRouteJumps: route,
    capacityJumps: capacity,
    reachable: canPlot !== false && capacity >= route,
    urgencyTier: TIER_SET.has(urgencyTier) ? urgencyTier : 'standard',
    slack,
    tierBudget,
    openedAtStrategicJumps: openedAt,
    deadlineAtStrategicJumps: deadlineAt,
    remainingJumps: Math.max(0, deadlineAt - current),
    burnedJumps: Math.max(0, current - openedAt),
    currentStrategicJumps: current,
  };
}

export function applyUrgencyClocks(objective, computed, { initialize = false, currentStrategicJumps = null } = {}) {
  if (!objective?.clocks) return objective;
  const current = currentStrategicJumps != null
    ? clampNonNeg(currentStrategicJumps)
    : clampNonNeg(computed.currentStrategicJumps);
  objective.clocks.plannedRouteJumps = computed.plannedRouteJumps;
  objective.clocks.capacityJumps = computed.capacityJumps;
  objective.clocks.reachable = computed.reachable;
  objective.clocks.tierBudget = computed.tierBudget;
  if (initialize) {
    objective.clocks.openedAtStrategicJumps = computed.openedAtStrategicJumps;
    objective.clocks.deadlineAtStrategicJumps = computed.deadlineAtStrategicJumps;
    objective.clocks.burnedJumps = computed.burnedJumps;
    objective.clocks.remainingJumps = computed.remainingJumps;
  } else {
    const openedAt = clampNonNeg(objective.clocks.openedAtStrategicJumps);
    const deadlineAt = clampNonNeg(objective.clocks.deadlineAtStrategicJumps);
    objective.clocks.burnedJumps = Math.max(0, current - openedAt);
    objective.clocks.remainingJumps = Math.max(0, deadlineAt - current);
  }
  return objective;
}

function appendHistory(objective, type, detail, atStrategicJumps = 0) {
  if (!objective) return;
  objective.history = [...(objective.history || []), {
    type: String(type || 'note'),
    detail: String(detail || ''),
    atStrategicJumps: clampNonNeg(atStrategicJumps),
  }].slice(-12);
}

function createShortageRecord(board, input = {}) {
  const shortageId = input.shortageId || takeId(board, 'nextShortageId', 'sh');
  return {
    shortageId,
    systemIndex: Number(input.systemIndex),
    locationName: String(input.locationName || `system:${input.systemIndex}`),
    good: GOOD_SET.has(input.good) ? input.good : 'food',
    status: SHORTAGE_STATUSES.includes(input.status) ? input.status : 'open',
    finite: input.finite !== false,
    amount: Math.max(1, Number(input.amount) || 1),
  };
}

function createAssignmentRecord(board, input = {}) {
  const assignmentId = input.assignmentId || takeId(board, 'nextAssignmentId', 'asg');
  const assetId = input.assetId || takeId(board, 'nextAssetId', 'asset');
  return {
    assignmentId,
    assetId,
    kind: input.kind || 'delivery',
    originSystemIndex: Number(input.originSystemIndex),
    destinationSystemIndex: Number(input.destinationSystemIndex),
    originName: String(input.originName || `system:${input.originSystemIndex}`),
    destinationName: String(input.destinationName || `system:${input.destinationSystemIndex}`),
    good: GOOD_SET.has(input.good) ? input.good : 'food',
    role: ROLE_SET.has(input.role) ? input.role : 'freighter',
    civilianId: input.civilianId != null ? String(input.civilianId) : null,
    dueMilestone: input.dueMilestone || 'arrival',
  };
}

export function injectShortage(board, input = {}) {
  const store = board || createObjectiveBoard();
  if (!store.shortages) store.shortages = {};
  const shortage = createShortageRecord(store, input);
  store.shortages[shortage.shortageId] = shortage;
  return { ok: true, shortage, board: store };
}

export function injectShortageAndConvoy(board, input = {}, urgency = {}) {
  const store = board || createObjectiveBoard();
  if (typeof store.nextObjectiveId !== 'number') {
    return { ok: false, reason: 'board-helper-missing' };
  }
  const kind = KIND_SET.has(input.kind) ? input.kind : 'convoy_delivery';
  const assignmentId = input.assignmentId || takeId(store, 'nextAssignmentId', 'asg');
  const deliveryToken = makeCloseToken(kind, assignmentId);
  if (closeTokenAlreadyUsed(store, deliveryToken)) {
    return { ok: false, reason: 'already_closed', token: deliveryToken };
  }
  const shortage = input.shortageId && store.shortages[input.shortageId]
    ? store.shortages[input.shortageId]
    : createShortageRecord(store, {
      systemIndex: input.destinationSystemIndex,
      locationName: input.destinationName,
      good: input.good,
      shortageId: input.shortageId,
    });
  store.shortages[shortage.shortageId] = shortage;

  const assignment = createAssignmentRecord(store, {
    ...input,
    assignmentId,
    good: shortage.good,
  });
  store.assignments[assignment.assignmentId] = assignment;

  const convoyId = input.convoyId || takeId(store, 'nextConvoyId', 'cnv');
  const objectiveId = input.objectiveId || takeId(store, 'nextObjectiveId', 'obj');
  const current = clampNonNeg(urgency.currentStrategicJumps);
  const computed = computeReachableUrgency({
    plannedRouteJumps: urgency.plannedRouteJumps != null
      ? urgency.plannedRouteJumps
      : plannedRouteJumpsFromPlot(urgency.plot, { wormhole: urgency.wormhole === true }),
    capacityJumps: urgency.capacityJumps != null
      ? urgency.capacityJumps
      : capacityJumpsFromShip(urgency),
    canPlot: urgency.canPlot !== false,
    openedAtStrategicJumps: current,
    currentStrategicJumps: current,
    urgencyTier: input.urgencyTier || urgency.urgencyTier || 'tight',
    slackByTier: urgency.slackByTier || null,
  });

  const convoy = {
    convoyId,
    assignmentId: assignment.assignmentId,
    objectiveId,
    originSystemIndex: assignment.originSystemIndex,
    destinationSystemIndex: assignment.destinationSystemIndex,
    originName: assignment.originName,
    destinationName: assignment.destinationName,
    good: assignment.good,
    cargo: input.cargo && typeof input.cargo === 'object'
      ? { known: input.cargo.known !== false, empty: input.cargo.empty === true, good: input.cargo.good || assignment.good }
      : { known: true, empty: false, good: assignment.good },
    hulls: Array.isArray(input.hulls) ? input.hulls.map((hull) => ({
      assetId: hull.assetId || assignment.assetId,
      securityInstanceId: hull.securityInstanceId || null,
      npcId: hull.npcId != null ? String(hull.npcId) : null,
    })) : [{
      assetId: assignment.assetId,
      securityInstanceId: input.securityInstanceId || null,
      npcId: input.civilianId != null ? String(input.civilianId) : null,
    }],
    civilianId: assignment.civilianId,
  };
  store.convoys[convoyId] = convoy;

  const objective = {
    objectiveId,
    version: 1,
    kind,
    urgencyTier: computed.urgencyTier,
    status: 'open',
    convoyId,
    assignmentId: assignment.assignmentId,
    shortageId: shortage.shortageId,
    assetId: assignment.assetId,
    closeToken: null,
    assignedEscortIds: Array.isArray(input.assignedEscortIds) ? input.assignedEscortIds.map(String) : [],
    clocks: {
      openedAtStrategicJumps: computed.openedAtStrategicJumps,
      deadlineAtStrategicJumps: computed.deadlineAtStrategicJumps,
      burnedJumps: computed.burnedJumps,
      remainingJumps: computed.remainingJumps,
      plannedRouteJumps: computed.plannedRouteJumps,
      capacityJumps: computed.capacityJumps,
      reachable: computed.reachable,
      tierBudget: computed.tierBudget,
    },
    truth: {
      delivered: false,
      destroyed: false,
      attackerId: null,
      survivorsKnown: input.survivorsKnown === true,
      shortageFilled: false,
    },
    links: {
      incidentId: null,
      punishmentToken: null,
      overdueObjectiveId: null,
    },
    history: [],
    sayable: sayableConvoy(convoy, shortage, computed),
  };
  appendHistory(objective, 'opened', `${kind} ${assignment.assignmentId}`, current);
  store.objectives[objectiveId] = objective;
  store.lastJournal = objective.sayable;
  return {
    ok: true,
    board: store,
    objective,
    convoy,
    assignment,
    shortage,
  };
}

export function sayableConvoy(convoy, shortage, clocks = {}) {
  const good = convoy?.good || shortage?.good || 'cargo';
  const from = convoy?.originName || 'origin';
  const to = convoy?.destinationName || shortage?.locationName || 'destination';
  const remain = clocks.remainingJumps;
  const reach = clocks.reachable === false ? 'Current antimatter cannot make the plotted route.' : 'Current antimatter can make the plotted route.';
  const remainText = Number.isFinite(Number(remain)) ? ` ${remain} jumps remain.` : '';
  return `Cargo ${good} is going from ${from} to ${to} for this shortage.${remainText} ${reach}`.trim();
}

export function sayableOverdue(assignment, extras = {}) {
  const id = assignment?.assignmentId || extras.assignmentId || 'assignment';
  const role = assignment?.role || extras.role || 'Freighter';
  const label = role === 'freighter' || role === 'convoy' ? 'Freighter' : String(role).replace(/_/g, ' ');
  return `${label} assignment ${id} missed check-in. Overdue — not confirmed destroyed. No attacker identified. Standing unchanged.`;
}

export function sayableUrgency(objective) {
  if (!objective) return 'No open objective.';
  const tier = objective.urgencyTier || 'standard';
  const remain = Number(objective.clocks?.remainingJumps);
  const reach = objective.clocks?.reachable !== false;
  if (remain <= 0) {
    return 'Window burned. Assignment overdue — not destroyed, no attacker identified.';
  }
  const label = tier === 'tight' ? 'Tight' : tier === 'soft' ? 'Soft overdue watch' : 'Standard';
  return `${label}: ${remain} jumps remain on this ${objective.kind === 'asset_overdue' ? 'overdue watch' : 'convoy'}. ${
    reach ? 'Current antimatter can make the plotted route.' : 'Current antimatter cannot make the plotted route.'
  }`;
}

export function sayableUnload() {
  return 'Unloading the scene is not evidence the convoy disappeared.';
}

export function applyStrategicJumpToBoard(board, currentStrategicJumps) {
  const store = board || createObjectiveBoard();
  const current = clampNonNeg(currentStrategicJumps);
  const newlyBurned = [];
  for (const objective of listOpenObjectives(store)) {
    const openedAt = clampNonNeg(objective.clocks?.openedAtStrategicJumps);
    const deadlineAt = clampNonNeg(objective.clocks?.deadlineAtStrategicJumps);
    objective.clocks.burnedJumps = Math.max(0, current - openedAt);
    objective.clocks.remainingJumps = Math.max(0, deadlineAt - current);
    if (objective.clocks.remainingJumps === 0 && objective.kind === 'convoy_delivery' && !objective.truth?.delivered) {
      newlyBurned.push(objective);
    }
  }
  return { board: store, newlyBurned, currentStrategicJumps: current };
}

export function recalcOpenUrgency(board, contextForObjective) {
  const store = board || createObjectiveBoard();
  const snapshots = [];
  for (const objective of listOpenObjectives(store)) {
    const before = {
      openedAt: objective.clocks.openedAtStrategicJumps,
      deadlineAt: objective.clocks.deadlineAtStrategicJumps,
      burnedJumps: objective.clocks.burnedJumps,
    };
    const ctx = typeof contextForObjective === 'function' ? contextForObjective(objective) : (contextForObjective || {});
    const computed = computeReachableUrgency({
      plannedRouteJumps: ctx.plannedRouteJumps != null ? ctx.plannedRouteJumps : objective.clocks.plannedRouteJumps,
      capacityJumps: ctx.capacityJumps != null ? ctx.capacityJumps : capacityJumpsFromShip(ctx),
      canPlot: ctx.canPlot !== false,
      openedAtStrategicJumps: objective.clocks.openedAtStrategicJumps,
      currentStrategicJumps: ctx.currentStrategicJumps != null ? ctx.currentStrategicJumps : (
        objective.clocks.openedAtStrategicJumps + objective.clocks.burnedJumps
      ),
      urgencyTier: objective.urgencyTier,
      slackByTier: ctx.slackByTier || null,
    });
    applyUrgencyClocks(objective, computed, {
      initialize: false,
      currentStrategicJumps: computed.currentStrategicJumps,
    });
    snapshots.push({
      objectiveId: objective.objectiveId,
      before,
      after: {
        openedAt: objective.clocks.openedAtStrategicJumps,
        deadlineAt: objective.clocks.deadlineAtStrategicJumps,
        burnedJumps: objective.clocks.burnedJumps,
        capacityJumps: objective.clocks.capacityJumps,
        reachable: objective.clocks.reachable,
        remainingJumps: objective.clocks.remainingJumps,
      },
      deadlineMovedLater: objective.clocks.deadlineAtStrategicJumps > before.deadlineAt,
      burnedReset: objective.clocks.burnedJumps < before.burnedJumps,
    });
  }
  return { board: store, snapshots };
}

export function closeObjective(board, objectiveId, reason = 'closed', extras = {}) {
  const store = board || createObjectiveBoard();
  const objective = getObjective(store, objectiveId);
  if (!objective) return { ok: false, reason: 'missing' };
  const kind = extras.tokenKind || objective.kind;
  const token = extras.closeToken || makeCloseToken(kind, objective.assignmentId);
  const stamped = stampCloseToken(store, token, {
    objectiveId: objective.objectiveId,
    reason,
    atStrategicJumps: extras.atStrategicJumps || 0,
  });
  if (!stamped.ok && stamped.reason === 'already_closed') {
    objective.status = 'closed';
    objective.closeToken = token;
    return { ok: false, reason: 'already_closed', token, objective };
  }
  objective.status = 'closed';
  objective.closeToken = token;
  objective.resolveReason = String(reason);
  appendHistory(objective, 'closed', reason, extras.atStrategicJumps || 0);
  return { ok: true, token, objective };
}

export function openOverdueForAssignment(board, assignmentId, extras = {}) {
  const store = board || createObjectiveBoard();
  const assignment = getAssignment(store, assignmentId);
  if (!assignment && !extras.assignment) {
    return { ok: false, reason: 'no_assignment' };
  }
  const asg = assignment || extras.assignment;
  const sourceDestroyed = extras.sourceObjective?.truth?.destroyed === true
    || listObjectives(store).some((row) => row.assignmentId === asg.assignmentId && row.truth?.destroyed === true);
  if (sourceDestroyed) {
    return { ok: false, reason: 'already_destroyed' };
  }
  const overdueToken = makeCloseToken('asset_overdue', asg.assignmentId);
  if (closeTokenAlreadyUsed(store, overdueToken)) {
    return { ok: false, reason: 'already_closed', token: overdueToken };
  }
  const source = extras.sourceObjective || listObjectives(store).find((row) => (
    row.assignmentId === asg.assignmentId && row.kind === 'convoy_delivery'
  ));
  if (source && source.status === 'open') {
    closeObjective(store, source.objectiveId, extras.closeDeliveryReason || 'expired-as-overdue', {
      atStrategicJumps: extras.atStrategicJumps || 0,
      tokenKind: source.kind,
    });
  }
  const current = clampNonNeg(extras.currentStrategicJumps);
  const computed = computeReachableUrgency({
    plannedRouteJumps: extras.plannedRouteJumps != null
      ? extras.plannedRouteJumps
      : (source?.clocks?.plannedRouteJumps || 1),
    capacityJumps: extras.capacityJumps != null
      ? extras.capacityJumps
      : (source?.clocks?.capacityJumps || 0),
    canPlot: extras.canPlot !== false,
    openedAtStrategicJumps: current,
    currentStrategicJumps: current,
    urgencyTier: extras.urgencyTier || 'standard',
    slackByTier: extras.slackByTier || null,
  });
  const objectiveId = takeId(store, 'nextObjectiveId', 'obj');
  const deadlineAt = source?.clocks?.deadlineAtStrategicJumps ?? computed.deadlineAtStrategicJumps;
  const objective = {
    objectiveId,
    version: 1,
    kind: 'asset_overdue',
    urgencyTier: computed.urgencyTier,
    status: 'open',
    convoyId: source?.convoyId || extras.convoyId || null,
    assignmentId: asg.assignmentId,
    shortageId: source?.shortageId || extras.shortageId || null,
    assetId: asg.assetId,
    closeToken: null,
    assignedEscortIds: [...(source?.assignedEscortIds || [])],
    clocks: {
      openedAtStrategicJumps: current,
      deadlineAtStrategicJumps: current + computed.tierBudget,
      burnedJumps: 0,
      remainingJumps: computed.tierBudget,
      plannedRouteJumps: computed.plannedRouteJumps,
      capacityJumps: computed.capacityJumps,
      reachable: computed.reachable,
      tierBudget: computed.tierBudget,
    },
    truth: {
      delivered: false,
      destroyed: false,
      attackerId: null,
      survivorsKnown: extras.survivorsKnown === true || Boolean(source?.truth?.survivorsKnown),
      shortageFilled: Boolean(source?.truth?.shortageFilled),
    },
    links: {
      incidentId: extras.incidentId || null,
      punishmentToken: null,
      sourceObjectiveId: source?.objectiveId || null,
    },
    missedMilestone: {
      milestoneId: `ms:${asg.assignmentId}:${asg.dueMilestone || 'arrival'}`,
      kind: asg.dueMilestone || 'arrival',
      dueAtStrategicJumps: deadlineAt,
      graceJumps: clampNonNeg(extras.graceJumps),
      detectedAtStrategicJumps: Math.max(current, deadlineAt),
    },
    history: [],
    sayable: sayableOverdue(asg, extras),
  };
  appendHistory(objective, 'opened', 'asset_overdue', current);
  store.objectives[objectiveId] = objective;
  stampCloseToken(store, overdueToken, {
    objectiveId,
    reason: 'opened-overdue',
    atStrategicJumps: current,
  });
  if (source) source.links.overdueObjectiveId = objectiveId;
  store.lastJournal = objective.sayable;
  return {
    ok: true,
    objective,
    token: overdueToken,
    destroyed: false,
    attackerId: null,
    standingPath: false,
  };
}

export function burnWindow(board, objectiveId, extras = {}) {
  const store = board || createObjectiveBoard();
  const objective = getObjective(store, objectiveId);
  if (!objective) return { ok: false, reason: 'missing' };
  const deadlineAt = clampNonNeg(objective.clocks.deadlineAtStrategicJumps);
  const openedAt = clampNonNeg(objective.clocks.openedAtStrategicJumps);
  const current = extras.currentStrategicJumps != null ? clampNonNeg(extras.currentStrategicJumps) : deadlineAt;
  objective.clocks.remainingJumps = 0;
  objective.clocks.burnedJumps = Math.max(0, current - openedAt);
  if (objective.kind === 'convoy_delivery') {
    return openOverdueForAssignment(store, objective.assignmentId, {
      ...extras,
      sourceObjective: objective,
      currentStrategicJumps: current,
    });
  }
  return { ok: true, objective, destroyed: false, attackerId: null };
}

export function applyPlayerChoice(board, objectiveId, choice, extras = {}) {
  const store = board || createObjectiveBoard();
  const objective = getObjective(store, objectiveId);
  if (!objective) return { ok: false, reason: 'missing' };
  if (!CHOICE_SET.has(choice)) return { ok: false, reason: 'invalid_choice' };
  const shortage = getShortage(store, objective.shortageId);
  const assignment = getAssignment(store, objective.assignmentId);
  const at = clampNonNeg(extras.atStrategicJumps);
  const unrestWrite = null;
  if (choice === 'escort') {
    if (shortage) shortage.status = 'filled';
    objective.truth.delivered = true;
    objective.truth.shortageFilled = true;
    closeObjective(store, objective.objectiveId, 'escort-delivered', { atStrategicJumps: at });
    appendHistory(objective, 'choice', 'escort', at);
    store.lastJournal = `Escort delivered ${assignment?.good || 'cargo'} to ${assignment?.destinationName || 'destination'}. Shortage eased.`;
    return {
      ok: true,
      choice,
      objective,
      unrestWrite: { kind: 'relieve', action: 'escortDelivery', systemIndex: shortage?.systemIndex },
      shortage,
    };
  }
  if (choice === 'deliver') {
    if (shortage) shortage.status = 'filled';
    objective.truth.shortageFilled = true;
    appendHistory(objective, 'choice', 'deliver-independent', at);
    store.lastJournal = `Independent delivery filled the ${shortage?.good || 'cargo'} shortage. Original hulls were not on the drop.`;
    return {
      ok: true,
      choice,
      objective,
      shortageStillClosed: true,
      hullMayOverdue: objective.status === 'open',
      unrestWrite: { kind: 'relieve', action: 'restoreDelivery', systemIndex: shortage?.systemIndex },
      shortage,
    };
  }
  if (choice === 'investigate') {
    appendHistory(objective, 'choice', 'investigate', at);
    store.lastJournal = 'Investigation recorded. No attacker identified.';
    return {
      ok: true,
      choice,
      objective,
      openIncident: true,
      inventedAttacker: false,
    };
  }
  if (choice === 'exploit') {
    if (shortage && shortage.status !== 'filled') shortage.status = 'worsened';
    appendHistory(objective, 'choice', 'exploit', at);
    store.lastJournal = 'Supply moved to the exploiter. Standing only via existing combat credit.';
    return {
      ok: true,
      choice,
      objective,
      unrestWrite: { kind: 'commerceFailure', cause: 'playerRaid', systemIndex: shortage?.systemIndex },
      standingViaCombatOnly: true,
    };
  }
  appendHistory(objective, 'choice', 'ignore', at);
  store.lastJournal = 'Assignment ignored. Clock may burn. No invented killer.';
  return {
    ok: true,
    choice,
    objective,
    unrestWrite,
  };
}

export function markAssignmentDestroyed(board, assignmentId, extras = {}) {
  const store = board || createObjectiveBoard();
  const rows = listObjectives(store).filter((row) => row.assignmentId === assignmentId);
  if (!rows.length) return { ok: false, reason: 'missing' };
  const credit = extras.credit || null;
  const attackerId = extras.attackerId || (credit === 'player' || credit === 'playerEscort' ? credit : null);
  for (const objective of rows) {
    objective.truth.destroyed = true;
    objective.truth.attackerId = attackerId;
    if (extras.punishmentToken) objective.links.punishmentToken = extras.punishmentToken;
    appendHistory(objective, 'destroyed', extras.sayable || 'credited destruction', extras.atStrategicJumps || 0);
    if (objective.status === 'open') {
      closeObjective(store, objective.objectiveId, 'lost-as-destroyed', {
        atStrategicJumps: extras.atStrategicJumps || 0,
        tokenKind: objective.kind,
      });
    }
  }
  return { ok: true, attackerId, destroyed: true };
}

export function noteUnloadIsNotDisappearance(board, objectiveId) {
  const objective = getObjective(board, objectiveId);
  if (!objective) return { ok: false, reason: 'missing' };
  appendHistory(objective, 'unload', sayableUnload(), objective.clocks?.burnedJumps || 0);
  return {
    ok: true,
    objective,
    overdueOpened: false,
    assignmentOpen: objective.status === 'open',
    sayable: sayableUnload(),
  };
}

export function evaluatePirateFromKnowledge({
  event_known = false,
  cargoKnown = false,
  escortPresent = false,
  patrolPresent = false,
} = {}) {
  if (!event_known) {
    return {
      appliedResponse: 'ignore_unknown',
      convoyObjective: null,
      journalLeak: false,
      mayRaid: false,
    };
  }
  const value = cargoKnown ? 1 : 0.4;
  const risk = (escortPresent ? 0.5 : 0) + (patrolPresent ? 0.4 : 0);
  return {
    appliedResponse: 'evaluate',
    convoyObjective: risk >= 0.8 ? 'shadow' : 'raid',
    journalLeak: false,
    mayRaid: risk < 0.9,
    value,
    risk,
  };
}

export function observerKnowsAssignment(observer, assignmentId) {
  if (!observer || !assignmentId) return false;
  const known = observer.knownAssignmentIds || observer.knownAssignments || [];
  return known.map(String).includes(String(assignmentId));
}

export function grantAssignmentKnowledge(observer, assignmentId) {
  if (!observer || !assignmentId) return false;
  if (!Array.isArray(observer.knownAssignmentIds)) observer.knownAssignmentIds = [];
  const id = String(assignmentId);
  if (!observer.knownAssignmentIds.includes(id)) observer.knownAssignmentIds.push(id);
  return true;
}

export function detectAssignmentInSystem(observer, convoyHulls = [], currentPlanet = null) {
  if (!observer) return false;
  const present = (Array.isArray(convoyHulls) ? convoyHulls : []).some((hull) => {
    if (!hull || hull.destroyed) return false;
    if (hull.npcId != null && String(hull.npcId) === String(observer.id)) return false;
    const sameSystem = hull.systemIndex == null || Number(hull.systemIndex) === Number(currentPlanet);
    return sameSystem;
  });
  return present;
}

function sanitizeShortage(raw) {
  if (!raw || typeof raw !== 'object' || !raw.shortageId) return null;
  return {
    shortageId: String(raw.shortageId),
    systemIndex: Number(raw.systemIndex),
    locationName: String(raw.locationName || ''),
    good: GOOD_SET.has(raw.good) ? raw.good : 'food',
    status: SHORTAGE_STATUSES.includes(raw.status) ? raw.status : 'open',
    finite: raw.finite !== false,
    amount: Math.max(1, Number(raw.amount) || 1),
  };
}

function sanitizeAssignment(raw) {
  if (!raw || typeof raw !== 'object' || !raw.assignmentId) return null;
  return {
    assignmentId: String(raw.assignmentId),
    assetId: String(raw.assetId || raw.assignmentId),
    kind: String(raw.kind || 'delivery'),
    originSystemIndex: Number(raw.originSystemIndex),
    destinationSystemIndex: Number(raw.destinationSystemIndex),
    originName: String(raw.originName || ''),
    destinationName: String(raw.destinationName || ''),
    good: GOOD_SET.has(raw.good) ? raw.good : 'food',
    role: ROLE_SET.has(raw.role) ? raw.role : 'freighter',
    civilianId: raw.civilianId != null ? String(raw.civilianId) : null,
    dueMilestone: String(raw.dueMilestone || 'arrival'),
  };
}

function sanitizeConvoy(raw) {
  if (!raw || typeof raw !== 'object' || !raw.convoyId) return null;
  return {
    convoyId: String(raw.convoyId),
    assignmentId: String(raw.assignmentId || ''),
    objectiveId: raw.objectiveId != null ? String(raw.objectiveId) : null,
    originSystemIndex: Number(raw.originSystemIndex),
    destinationSystemIndex: Number(raw.destinationSystemIndex),
    originName: String(raw.originName || ''),
    destinationName: String(raw.destinationName || ''),
    good: GOOD_SET.has(raw.good) ? raw.good : 'food',
    cargo: raw.cargo && typeof raw.cargo === 'object'
      ? { known: raw.cargo.known !== false, empty: raw.cargo.empty === true, good: raw.cargo.good || raw.good || 'food' }
      : { known: true, empty: false, good: raw.good || 'food' },
    hulls: Array.isArray(raw.hulls) ? raw.hulls.map((hull) => ({
      assetId: hull?.assetId != null ? String(hull.assetId) : null,
      securityInstanceId: hull?.securityInstanceId != null ? String(hull.securityInstanceId) : null,
      npcId: hull?.npcId != null ? String(hull.npcId) : null,
    })) : [],
    civilianId: raw.civilianId != null ? String(raw.civilianId) : null,
  };
}

function sanitizeObjective(raw) {
  if (!raw || typeof raw !== 'object' || !raw.objectiveId) return null;
  const kind = KIND_SET.has(raw.kind) ? raw.kind : null;
  if (!kind) return null;
  return {
    objectiveId: String(raw.objectiveId),
    version: 1,
    kind,
    urgencyTier: TIER_SET.has(raw.urgencyTier) ? raw.urgencyTier : 'standard',
    status: raw.status === 'closed' ? 'closed' : 'open',
    convoyId: raw.convoyId != null ? String(raw.convoyId) : null,
    assignmentId: raw.assignmentId != null ? String(raw.assignmentId) : null,
    shortageId: raw.shortageId != null ? String(raw.shortageId) : null,
    assetId: raw.assetId != null ? String(raw.assetId) : null,
    closeToken: raw.closeToken != null ? String(raw.closeToken) : null,
    assignedEscortIds: Array.isArray(raw.assignedEscortIds) ? raw.assignedEscortIds.map(String) : [],
    clocks: {
      openedAtStrategicJumps: clampNonNeg(raw.clocks?.openedAtStrategicJumps),
      deadlineAtStrategicJumps: clampNonNeg(raw.clocks?.deadlineAtStrategicJumps),
      burnedJumps: clampNonNeg(raw.clocks?.burnedJumps),
      remainingJumps: clampNonNeg(raw.clocks?.remainingJumps),
      plannedRouteJumps: clampNonNeg(raw.clocks?.plannedRouteJumps),
      capacityJumps: Number.isFinite(Number(raw.clocks?.capacityJumps)) ? Number(raw.clocks.capacityJumps) : 0,
      reachable: raw.clocks?.reachable !== false,
      tierBudget: clampNonNeg(raw.clocks?.tierBudget),
    },
    truth: {
      delivered: Boolean(raw.truth?.delivered),
      destroyed: Boolean(raw.truth?.destroyed),
      attackerId: raw.truth?.attackerId != null ? String(raw.truth.attackerId) : null,
      survivorsKnown: Boolean(raw.truth?.survivorsKnown),
      shortageFilled: Boolean(raw.truth?.shortageFilled),
    },
    links: {
      incidentId: raw.links?.incidentId != null ? String(raw.links.incidentId) : null,
      punishmentToken: raw.links?.punishmentToken != null ? String(raw.links.punishmentToken) : null,
      overdueObjectiveId: raw.links?.overdueObjectiveId != null ? String(raw.links.overdueObjectiveId) : null,
      sourceObjectiveId: raw.links?.sourceObjectiveId != null ? String(raw.links.sourceObjectiveId) : null,
    },
    missedMilestone: raw.missedMilestone && typeof raw.missedMilestone === 'object'
      ? {
        milestoneId: String(raw.missedMilestone.milestoneId || ''),
        kind: String(raw.missedMilestone.kind || 'arrival'),
        dueAtStrategicJumps: clampNonNeg(raw.missedMilestone.dueAtStrategicJumps),
        graceJumps: clampNonNeg(raw.missedMilestone.graceJumps),
        detectedAtStrategicJumps: clampNonNeg(raw.missedMilestone.detectedAtStrategicJumps),
      }
      : null,
    history: Array.isArray(raw.history)
      ? raw.history.filter((row) => row && typeof row === 'object').map((row) => ({
        type: String(row.type || 'note'),
        detail: String(row.detail || ''),
        atStrategicJumps: clampNonNeg(row.atStrategicJumps),
      })).slice(-12)
      : [],
    sayable: raw.sayable != null ? String(raw.sayable) : '',
    resolveReason: raw.resolveReason != null ? String(raw.resolveReason) : null,
  };
}

export function serializeObjectiveBoard(board) {
  const state = createObjectiveBoard(board);
  return {
    version: OBJECTIVE_BOARD_VERSION,
    nextObjectiveId: state.nextObjectiveId,
    nextConvoyId: state.nextConvoyId,
    nextAssignmentId: state.nextAssignmentId,
    nextShortageId: state.nextShortageId,
    nextAssetId: state.nextAssetId,
    objectives: clone(state.objectives || {}),
    convoys: clone(state.convoys || {}),
    shortages: clone(state.shortages || {}),
    assignments: clone(state.assignments || {}),
    closeTokens: clone(state.closeTokens || {}),
    lastJournal: state.lastJournal || null,
  };
}

export function restoreObjectiveBoard(saved) {
  if (!saved || typeof saved !== 'object') return createObjectiveBoard();
  const objectives = {};
  for (const [id, raw] of Object.entries(saved.objectives || {})) {
    const clean = sanitizeObjective(raw);
    if (clean?.objectiveId) objectives[id] = clean;
  }
  const convoys = {};
  for (const [id, raw] of Object.entries(saved.convoys || {})) {
    const clean = sanitizeConvoy(raw);
    if (clean?.convoyId) convoys[id] = clean;
  }
  const shortages = {};
  for (const [id, raw] of Object.entries(saved.shortages || {})) {
    const clean = sanitizeShortage(raw);
    if (clean?.shortageId) shortages[id] = clean;
  }
  const assignments = {};
  for (const [id, raw] of Object.entries(saved.assignments || {})) {
    const clean = sanitizeAssignment(raw);
    if (clean?.assignmentId) assignments[id] = clean;
  }
  const closeTokens = {};
  for (const [token, raw] of Object.entries(saved.closeTokens || {})) {
    if (!raw || typeof raw !== 'object') continue;
    closeTokens[String(token)] = {
      objectiveId: raw.objectiveId != null ? String(raw.objectiveId) : null,
      reason: String(raw.reason || 'closed'),
      atStrategicJumps: clampNonNeg(raw.atStrategicJumps),
    };
  }
  return createObjectiveBoard({
    nextObjectiveId: saved.nextObjectiveId,
    nextConvoyId: saved.nextConvoyId,
    nextAssignmentId: saved.nextAssignmentId,
    nextShortageId: saved.nextShortageId,
    nextAssetId: saved.nextAssetId,
    objectives,
    convoys,
    shortages,
    assignments,
    closeTokens,
    lastJournal: saved.lastJournal != null ? String(saved.lastJournal) : null,
  });
}

export function countCivilianRoles(ships = [], records = []) {
  const counts = { lounge: 0, contract: 0 };
  const seen = new Set();
  const add = (entry) => {
    const purpose = normalizeKey(entry?.civilianPurpose || entry?.purpose);
    const role = normalizeKey(entry?.role);
    const resolved = purpose === 'lounge' || purpose === 'contract'
      ? purpose
      : (role === 'commercecontract' ? 'contract' : (['localtraffic', 'traffic', 'lounge'].includes(role) ? 'lounge' : null));
    if (!resolved) return;
    const id = entry?.id != null ? String(entry.id) : `${resolved}:${counts[resolved]}`;
    if (seen.has(id)) return;
    seen.add(id);
    counts[resolved] += 1;
  };
  for (const ship of Array.isArray(ships) ? ships : []) add(ship);
  for (const record of Array.isArray(records) ? records : []) add(record);
  return counts;
}

export { clone, normalizeKey };
