#!/usr/bin/env node
/**
 * Offline Phase 5 board / token / urgency / overdue checks.
 * Written from docs/phase5/ only. Does not crib remastered-work.
 */
import { incrementStrategicJumps, createIncidentLedger } from '../src/phase4-incidents.js';
import {
  ASSET_OVERDUE_IMPLEMENTED,
  applyPlayerChoice,
  applyStrategicJumpToBoard,
  applyUrgencyClocks,
  assertTierOrdering,
  burnWindow,
  capacityJumpsFromShip,
  closeObjective,
  computeReachableUrgency,
  countCivilianRoles,
  createObjectiveBoard,
  evaluatePirateFromKnowledge,
  injectShortageAndConvoy,
  makeCloseToken,
  markAssignmentDestroyed,
  noteUnloadIsNotDisappearance,
  openOverdueForAssignment,
  recalcOpenUrgency,
  refuseReplacement,
  restoreObjectiveBoard,
  serializeObjectiveBoard,
  sayableOverdue,
  sayableUnload,
} from '../src/phase5-objectives.js';
import { ASSET_OVERDUE_IMPLEMENTED as SIDE_LANE_FLAG } from '../src/side-lane-unrest-independence.js';

let passed = 0;
let failed = 0;
const failures = [];

function assert(id, condition, detail = '') {
  if (condition) {
    passed += 1;
    return;
  }
  failed += 1;
  failures.push(`${id}${detail ? `: ${detail}` : ''}`);
}

assert('s8.flag-flipped-when-real', ASSET_OVERDUE_IMPLEMENTED === true && SIDE_LANE_FLAG === true);
assert('s8.tier-ordering-locked', assertTierOrdering() === true);
assert('s8.tier-injectable-order', assertTierOrdering({ tight: 0, standard: 3, soft: 9 }) === true);
assert('s8.tier-injectable-rejects-inverted', assertTierOrdering({ tight: 4, standard: 2, soft: 1 }) === false);

const ledger = createIncidentLedger();
assert('s8.1-clock-starts-zero', ledger.strategicJumps === 0);
incrementStrategicJumps(ledger);
assert('s8.1-increment-once', ledger.strategicJumps === 1);

const board = createObjectiveBoard();
const injected = injectShortageAndConvoy(board, {
  originSystemIndex: 1,
  destinationSystemIndex: 0,
  originName: 'Orion',
  destinationName: 'Sol',
  good: 'food',
  civilianId: 'contract:1',
  urgencyTier: 'tight',
}, {
  currentStrategicJumps: ledger.strategicJumps,
  plannedRouteJumps: 2,
  antimatter: 6,
  antimatterUse: 3,
});
assert('s8.15-inject-ok', injected.ok === true && injected.objective.objectiveId === 'obj-1');
assert('s8.3-stable-ids', injected.objective.objectiveId === 'obj-1' && injected.convoy.convoyId === 'cnv-1' && injected.assignment.assignmentId === 'asg-1');
assert('s8.3-not-npc-id', injected.assignment.assignmentId !== 'contract:1' && injected.assignment.assetId.startsWith('asset-'));
assert('s8.7-reachable-on-open', injected.objective.clocks.reachable === true && injected.objective.clocks.capacityJumps === 2);
assert('s8.8-tight-budget', injected.objective.clocks.tierBudget === injected.objective.clocks.plannedRouteJumps + 1);

const tick = applyStrategicJumpToBoard(board, incrementStrategicJumps(ledger));
assert('s8.1-burned-on-completed-jump', tick.newlyBurned.length === 0 && injected.objective.clocks.burnedJumps === 1);
assert('s8.1-remaining-dropped', injected.objective.clocks.remainingJumps === injected.objective.clocks.deadlineAtStrategicJumps - ledger.strategicJumps);

const serialized = serializeObjectiveBoard(board);
const wipedSystemStates = {};
const restored = restoreObjectiveBoard(serialized);
assert('s8.3-outside-systemStates', wipedSystemStates.objectives == null && restored.objectives[injected.objective.objectiveId]);
assert('s8.3-roundtrip-ids', restored.objectives['obj-1']?.assignmentId === 'asg-1');
assert('s8.12-load-same-remaining', restored.objectives['obj-1'].clocks.remainingJumps === injected.objective.clocks.remainingJumps);
assert('s8.12-load-same-burned', restored.objectives['obj-1'].clocks.burnedJumps === 1);

const beforeRecalc = {
  deadlineAt: restored.objectives['obj-1'].clocks.deadlineAtStrategicJumps,
  openedAt: restored.objectives['obj-1'].clocks.openedAtStrategicJumps,
  burned: restored.objectives['obj-1'].clocks.burnedJumps,
};
const recalc = recalcOpenUrgency(restored, {
  plannedRouteJumps: 2,
  antimatter: 30,
  antimatterUse: 3,
  currentStrategicJumps: ledger.strategicJumps,
});
assert('s8.11-capacity-recalc', recalc.snapshots[0].after.capacityJumps === 10);
assert('s8.11-no-soft-reset-deadline', recalc.snapshots[0].after.deadlineAt === beforeRecalc.deadlineAt);
assert('s8.11-no-soft-reset-opened', recalc.snapshots[0].after.openedAt === beforeRecalc.openedAt);
assert('s8.11-no-burned-reset', recalc.snapshots[0].after.burnedJumps === beforeRecalc.burned && recalc.snapshots[0].burnedReset === false);
assert('s8.11-remaining-not-past-deadline', recalc.snapshots[0].after.remainingJumps <= beforeRecalc.deadlineAt - ledger.strategicJumps);

const unload = noteUnloadIsNotDisappearance(restored, 'obj-1');
assert('s8.5-unload-not-overdue', unload.ok && unload.overdueOpened === false && unload.assignmentOpen === true);
assert('s8.5-unload-sayable', /not evidence the convoy disappeared/i.test(unload.sayable) && /not evidence/i.test(sayableUnload()));

const ignore = applyPlayerChoice(restored, 'obj-1', 'ignore');
assert('s8.15-ignore-valid', ignore.ok && ignore.choice === 'ignore');

const burned = burnWindow(restored, 'obj-1', { currentStrategicJumps: restored.objectives['obj-1'].clocks.deadlineAtStrategicJumps });
assert('s8.6-overdue-opens-once', burned.ok && burned.objective.kind === 'asset_overdue');
assert('s8.6-not-destroyed', burned.objective.truth.destroyed === false && burned.destroyed === false);
assert('s8.6-no-attacker', burned.objective.truth.attackerId === null && burned.attackerId === null);
assert('s8.6-no-standing-path', burned.standingPath === false);
assert('s8.6-sayable', /not confirmed destroyed/i.test(sayableOverdue(restored.assignments['asg-1'])));
assert('s8.13-burned-not-wreck', burned.objective.truth.destroyed === false);

const secondOverdue = openOverdueForAssignment(restored, 'asg-1');
assert('s8.4-second-overdue-refused', secondOverdue.ok === false && secondOverdue.reason === 'already_closed');
assert('s8.4-delivery-closed', restored.objectives['obj-1'].status === 'closed');
assert('s8.4-no-free-replacement', refuseReplacement(restored, 'asg-1', 'convoy_delivery').reason === 'already_closed');
assert('s8.4-no-second-convoy', injectShortageAndConvoy(restored, {
  assignmentId: 'asg-1',
  originSystemIndex: 1,
  destinationSystemIndex: 0,
  originName: 'Orion',
  destinationName: 'Sol',
}, { currentStrategicJumps: 4, plannedRouteJumps: 2, antimatter: 6, antimatterUse: 3 }).reason === 'already_closed');

const ignorant = evaluatePirateFromKnowledge({ event_known: false });
assert('s8.7-ignorant-pirate', ignorant.appliedResponse === 'ignore_unknown' && ignorant.convoyObjective == null && ignorant.journalLeak === false);
const knowing = evaluatePirateFromKnowledge({ event_known: true, cargoKnown: true, escortPresent: false, patrolPresent: false });
assert('s8.7-knowing-pirate', knowing.appliedResponse === 'evaluate' && knowing.convoyObjective != null);

const standingBoard = createObjectiveBoard();
const killLoop = injectShortageAndConvoy(standingBoard, {
  originSystemIndex: 0,
  destinationSystemIndex: 1,
  originName: 'Sol',
  destinationName: 'Orion',
  good: 'fuel',
}, { currentStrategicJumps: 0, plannedRouteJumps: 1, antimatter: 6, antimatterUse: 3 });
const killed = markAssignmentDestroyed(standingBoard, killLoop.assignment.assignmentId, {
  credit: 'player',
  punishmentToken: 'kill:player:0:asset-1:1',
});
assert('s8.9-destroyed-only-from-credit', killed.ok && killed.destroyed === true && killed.attackerId === 'player');
assert('s8.9-token-stamped', standingBoard.objectives[killLoop.objective.objectiveId].links.punishmentToken === 'kill:player:0:asset-1:1');

const escortBoard = createObjectiveBoard();
const escortLoop = injectShortageAndConvoy(escortBoard, {
  originSystemIndex: 0,
  destinationSystemIndex: 1,
  originName: 'Sol',
  destinationName: 'Orion',
  good: 'food',
}, { currentStrategicJumps: 0, plannedRouteJumps: 2, antimatter: 6, antimatterUse: 3 });
const escorted = applyPlayerChoice(escortBoard, escortLoop.objective.objectiveId, 'escort');
assert('s8.15-escort-closes', escorted.ok && escorted.objective.status === 'closed' && escorted.shortage.status === 'filled');
assert('s8.15-escort-unrest-named', escorted.unrestWrite?.action === 'escortDelivery');

const deliverBoard = createObjectiveBoard();
const deliverLoop = injectShortageAndConvoy(deliverBoard, {
  originSystemIndex: 0,
  destinationSystemIndex: 1,
  originName: 'Sol',
  destinationName: 'Orion',
}, { currentStrategicJumps: 0, plannedRouteJumps: 2, antimatter: 6, antimatterUse: 3 });
const independent = applyPlayerChoice(deliverBoard, deliverLoop.objective.objectiveId, 'deliver');
assert('s8.15-independent-fills-shortage', independent.ok && independent.shortage.status === 'filled' && independent.hullMayOverdue === true);
assert('s8.15-independent-hull-still-open', deliverLoop.objective.status === 'open');

const tight = computeReachableUrgency({
  plannedRouteJumps: 2,
  capacityJumps: 5,
  openedAtStrategicJumps: 0,
  currentStrategicJumps: 0,
  urgencyTier: 'tight',
});
const standard = computeReachableUrgency({
  plannedRouteJumps: 2,
  capacityJumps: 5,
  openedAtStrategicJumps: 0,
  currentStrategicJumps: 0,
  urgencyTier: 'standard',
});
const soft = computeReachableUrgency({
  plannedRouteJumps: 2,
  capacityJumps: 5,
  openedAtStrategicJumps: 0,
  currentStrategicJumps: 0,
  urgencyTier: 'soft',
});
assert('s8.14-tight-lt-standard-lt-soft', tight.tierBudget < standard.tierBudget && standard.tierBudget < soft.tierBudget);
assert('s8.14-not-one-global-timer', tight.deadlineAtStrategicJumps !== soft.deadlineAtStrategicJumps);

const mean = capacityJumpsFromShip({
  antimatter: 6,
  antimatterUse: 3,
  escorts: [
    { antimatter: 9, antimatterUse: 3 },
    { antimatter: 3, antimatterUse: 3 },
  ],
});
assert('s8.11-escort-mean', mean === 2);

const civilians = countCivilianRoles([
  { id: 'lounge-1', civilianPurpose: 'lounge', role: 'localTraffic' },
  { id: 'contract-1', civilianPurpose: 'contract', role: 'commerceContract' },
  { id: 'traffic-2', role: 'traffic' },
]);
assert('s8.10-coexist-counts', civilians.lounge >= 1 && civilians.contract >= 1);

const dirty = restoreObjectiveBoard({
  version: 1,
  objectives: {
    'obj-bad': { objectiveId: 'obj-bad', kind: 'not-a-kind' },
    'obj-ok': {
      objectiveId: 'obj-ok',
      kind: 'convoy_delivery',
      assignmentId: 'asg-9',
      urgencyTier: 'tight',
    },
  },
});
assert('s8.sanitize-drops-invalid', !dirty.objectives['obj-bad'] && dirty.objectives['obj-ok']);

const empty = restoreObjectiveBoard(null);
assert('s8.legacy-empty-board', empty.nextObjectiveId === 1 && Object.keys(empty.objectives).length === 0);

const closeOnce = closeObjective(createObjectiveBoard(), 'missing');
assert('s8.missing-close', closeOnce.ok === false);

const clocks = applyUrgencyClocks({
  clocks: {
    openedAtStrategicJumps: 4,
    deadlineAtStrategicJumps: 8,
    burnedJumps: 2,
    remainingJumps: 2,
    plannedRouteJumps: 2,
    capacityJumps: 2,
    reachable: true,
  },
}, computeReachableUrgency({
  plannedRouteJumps: 3,
  capacityJumps: 1,
  openedAtStrategicJumps: 4,
  currentStrategicJumps: 6,
  urgencyTier: 'tight',
}), { initialize: false, currentStrategicJumps: 6 });
assert('s8.11-recalc-keeps-absolute-deadline', clocks.clocks.deadlineAtStrategicJumps === 8 && clocks.clocks.burnedJumps === 2);

const summary = `Phase 5 objective unit checks: ${passed} passed, ${failed} failed`;
console.log(summary);
if (failures.length) console.log(failures.join('\n'));
if (failed) process.exitCode = 1;
