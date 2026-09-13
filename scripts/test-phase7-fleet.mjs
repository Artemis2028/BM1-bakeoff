#!/usr/bin/env node
/**
 * Offline Phase 7 fleet-order / hold-outside / persistence checks.
 * Written from docs/revised-development-plan.md §4 Phase 7 + §9 only.
 * Does not crib remastered-work.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createContactBook,
  observerKeyForNpc,
  observerKeyForPlayer,
  shareFormationDetection,
  subjectKeyForNpc,
  upsertContact,
  serializeContactBook,
  findContact,
} from '../src/phase6-sensors.js';
import { reman53Identity, EXAMPLE_ALIAS_FROM, EXAMPLE_ALIAS_TO, resolveHullAlias } from '../src/phase65-power.js';
import {
  COMMS_FAILURES_IMPLEMENTED,
  FORBIDDEN_FIRE_INJECT,
  MIN_ESCORT_STACK_DIST,
  TENSION_POSTURE_IMPLEMENTED,
  applyJumpToFleetOrders,
  commsFailureNote,
  createFleetOrderBoard,
  defaultJumpPolicyForKind,
  describeOrderStatus,
  destinationForPeacefulEscort,
  emptyFleetOrderBoard,
  escortSpawnsInSystem,
  escortsStackedOnDrop,
  fallbackApproachGeometry,
  findOrderForShip,
  formationShareMustNotGiftFiringSolution,
  interruptOrder,
  interruptPreservesContactBook,
  issueOrder,
  listVisibleOrderMarkers,
  orderResultForbidsFireInject,
  panelRows,
  placeHoldOutside,
  restoreFleetOrders,
  resumeStanding,
  serializeFleetOrders,
  shipFollowsJump,
  tensionFromKnownForce,
  usesFormationSlot,
} from '../src/phase7-fleet.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

assert('s12.flag-comms-stub', COMMS_FAILURES_IMPLEMENTED === false && commsFailureNote().stub === true);
assert('s12.flag-tension-stub', TENSION_POSTURE_IMPLEMENTED === false && tensionFromKnownForce().implemented === false);
assert('s12.jump-default-follow', defaultJumpPolicyForKind('follow') === 'follow' && defaultJumpPolicyForKind('escort') === 'follow');
assert('s12.jump-default-stay', defaultJumpPolicyForKind('hold_outside') === 'stay' && defaultJumpPolicyForKind('hold') === 'stay');

const geometry = {
  center: { x: 400, y: 300 },
  radius: 360,
  holdingDistance: 252,
};
const drop = { x: 400 + Math.cos(0) * 360, y: 300 };
const approach = { x: 400 + Math.cos(0) * 500, y: 300 };
const placed = placeHoldOutside(geometry, approach, [
  { id: 'e1', role: 'screen' },
  { id: 'e2', role: 'scout' },
  { id: 'e3', role: 'support' },
], drop);
assert('s12.1-hold-outside-beyond-boundary', placed.allOutside === true && placed.points.every((row) => (
  Math.hypot(row.x - geometry.center.x, row.y - geometry.center.y) >= geometry.radius
)));
assert('s12.2-hold-outside-not-stacked-on-drop', placed.noneStacked === true && escortsStackedOnDrop(drop, placed.points, MIN_ESCORT_STACK_DIST) === false);

const rolesDistinct = new Set(placed.points.map((row) => `${Math.round(row.x)}:${Math.round(row.y)}`));
assert('s12.5-roles-affect-offset', rolesDistinct.size === 3 && placed.points[1].role === 'scout');

const fallback = fallbackApproachGeometry({ x: 100, y: 80 }, 300);
const systemApproach = placeHoldOutside(fallback, { x: 100 + 400, y: 80 }, [{ id: 'e4', role: 'withdrawal_cover' }], { x: 100, y: 80 });
assert('s12.1b-system-approach-outside', systemApproach.allOutside === true && systemApproach.noneStacked === true);

const board = createFleetOrderBoard();
const issued = issueOrder(board, {
  kind: 'hold_outside',
  assignedShipIds: ['esc-a', 'esc-b'],
  assignedSystemIndex: 2,
  boundaryId: 'zone:vulcan',
  role: 'screen',
  destination: { x: placed.points[0].x, y: placed.points[0].y, name: 'hold outside checkpoint', systemIndex: 2 },
}, { atStrategicJumps: 3 });
assert('s12.issue-ok', issued.ok === true && issued.order.orderId === 'ford-1');
assert('s12.6-no-engagement-inject', orderResultForbidsFireInject(issued) && issued[FORBIDDEN_FIRE_INJECT] == null);
assert('s12.follow-false-for-hold', shipFollowsJump(issued.order, 5) === false);

applyJumpToFleetOrders(board, 2, 5, { atStrategicJumps: 4 });
assert('s12.3-order-persists-across-jump-stay', findOrderForShip(board, 'esc-a')?.kind === 'hold_outside'
  && findOrderForShip(board, 'esc-a')?.parkedSystemIndex === 2
  && escortSpawnsInSystem(board, 'esc-a', 5) === false
  && escortSpawnsInSystem(board, 'esc-a', 2) === true);

const restored = restoreFleetOrders(serializeFleetOrders(board));
assert('s12.3b-serialize-roundtrip', restoreFleetOrders(serializeFleetOrders(restored)).orders['ford-1']?.kind === 'hold_outside'
  && restored.shipIndex['esc-a'] === 'ford-1'
  && restored.orders['ford-1'].history.some((row) => row.type === 'jump'));

const followBoard = emptyFleetOrderBoard();
issueOrder(followBoard, {
  kind: 'escort',
  assignedShipIds: ['wing-1'],
  assignedSystemIndex: 0,
  destination: { name: 'flagship', systemIndex: 0 },
});
applyJumpToFleetOrders(followBoard, 0, 7, { atStrategicJumps: 1 });
assert('s12.4-follow-jumps-with-flagship', shipFollowsJump(findOrderForShip(followBoard, 'wing-1'), 7) === true
  && findOrderForShip(followBoard, 'wing-1')?.assignedSystemIndex === 7
  && escortSpawnsInSystem(followBoard, 'wing-1', 7) === true);

const book = createContactBook();
const player = observerKeyForPlayer();
const escortKey = observerKeyForNpc('escort-1');
const subject = subjectKeyForNpc('raid-9');
upsertContact(book, player, {
  subjectKey: subject,
  detected: true,
  identification: 'known',
  trackQuality: 'firm',
  firingSolution: true,
  lastKnown: { x: 12, y: 8, radius: 20, atLocalMs: 100 },
  freshnessLocalMs: 100,
  source: 'visual',
}, 100);
const shared = shareFormationDetection(book, player, escortKey, 100);
const escortContact = findContact(book, escortKey, subject);
assert('s12.5-no-gifted-fs', formationShareMustNotGiftFiringSolution(shared)
  && escortContact?.detected === true
  && escortContact?.firingSolution === false
  && escortContact?.trackQuality === 'area');

const beforeBook = serializeContactBook(book);
const interrupted = interruptOrder(board, 'ford-1', 'defense', {
  atStrategicJumps: 4,
  contacts: book,
  reason: 'immediate-defense',
});
assert('s12.7-interrupt-preserves-standing', interrupted.ok
  && interrupted.order.status === 'interrupted'
  && interrupted.order.standing?.kind === 'hold_outside'
  && interrupted.order.kind === 'hold_outside');
assert('s12.8-interrupt-does-not-wipe-contact-book', interrupted.contactBookMutated === false
  && interrupted.contacts === book
  && interruptPreservesContactBook(beforeBook, serializeContactBook(book))
  && findContact(book, player, subject)?.firingSolution === true);

const resumed = resumeStanding(board, 'ford-1', { atStrategicJumps: 4 });
assert('s12.7b-resume-standing', resumed.resumed === true && resumed.order.status === 'standing' && resumed.order.kind === 'hold_outside');

const retreat = interruptOrder(board, 'ford-1', 'retreat', { atStrategicJumps: 5, contacts: book });
assert('s12.7c-retreat-interrupt', retreat.ok && retreat.order.status === 'interrupted' && retreat.order.standing?.kind === 'hold_outside');

const next = issueOrder(board, {
  kind: 'follow',
  assignedShipIds: ['esc-a'],
  assignedSystemIndex: 2,
  destination: { name: 'flagship' },
}, { atStrategicJumps: 6, contacts: book });
assert('s12.7d-new-order-records-supersede', next.ok
  && next.superseded.includes('ford-1')
  && findOrderForShip(board, 'esc-a')?.kind === 'follow'
  && board.orders['ford-1'].status === 'superseded'
  && interruptPreservesContactBook(beforeBook, serializeContactBook(book)));

const holdOrder = {
  kind: 'hold_outside',
  status: 'standing',
  destination: { x: 10, y: 20, name: 'rendezvous' },
};
const formation = { x: 400, y: 300 };
const peaceful = destinationForPeacefulEscort(holdOrder, formation, holdOrder.destination);
assert('s12.9-peaceful-escort-holds-rendezvous', peaceful.x === 10 && peaceful.y === 20 && usesFormationSlot(holdOrder) === false);
const followDest = destinationForPeacefulEscort({ kind: 'follow', status: 'standing' }, formation, { x: 1, y: 1 });
assert('s12.9b-follow-still-uses-formation', followDest.x === formation.x && followDest.y === formation.y);

const markers = listVisibleOrderMarkers(followBoard, 7);
assert('s12.11-visible-order-status', markers.length >= 0 && describeOrderStatus(findOrderForShip(followBoard, 'wing-1')).includes('escort'));
const rows = panelRows(followBoard, { shipIds: ['wing-1'], names: { 'wing-1': 'Wing One' } });
assert('s12.11b-panel-rows', rows[0].name === 'Wing One' && rows[0].kind === 'escort' && rows[0].jumpPolicy === 'follow');

const rallyBoard = emptyFleetOrderBoard();
issueOrder(rallyBoard, {
  kind: 'rally',
  assignedShipIds: ['r1'],
  assignedSystemIndex: 1,
  destination: { name: 'Sol approach', systemIndex: 4 },
});
assert('s12.4b-rally-follows-matching-dest', shipFollowsJump(findOrderForShip(rallyBoard, 'r1'), 4) === true);
assert('s12.4c-rally-stays-otherwise', shipFollowsJump(findOrderForShip(rallyBoard, 'r1'), 8) === false);

const pack = JSON.parse(fs.readFileSync(path.join(root, 'bm-ships/ships.json'), 'utf8'));
const reman = reman53Identity();
assert('s12.preserve-reman53', reman.id === 53 && reman.aliased === false && pack.ships.some((row) => Number(row.id) === 53));
assert('s12.preserve-alias-304', resolveHullAlias(EXAMPLE_ALIAS_FROM, pack.aliases) === EXAMPLE_ALIAS_TO);
assert('s12.preserve-no-fire-key', FORBIDDEN_FIRE_INJECT === 'engagement_authorized');

if (failed) {
  console.error(`Phase 7 fleet tests: ${passed} passed, ${failed} failed`);
  for (const row of failures) console.error(`  FAIL ${row}`);
  process.exitCode = 1;
} else {
  console.log(`Phase 7 fleet tests: ${passed} passed, ${failed} failed`);
}
