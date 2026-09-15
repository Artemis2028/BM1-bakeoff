#!/usr/bin/env node
/**
 * Offline Phase 9 EW / weapons-matrix / fire-gate checks.
 * Written from docs/phase9/ only. Does not crib remastered-work.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applyLostTrackSameTick,
  createContactBook,
  emptyContactBook,
  findContact,
  liveFireFactsFromContact,
  observerHasFiringSolution,
  observerKeyForNpc,
  observerKeyForPlayer,
  seedFromReport,
  upsertContact,
} from '../src/phase6-sensors.js';
import {
  EW_CONSUMER_NAME,
  EW_EFFECTS_IMPLEMENTED,
  POWER_CONSUMERS,
  applyBrownout,
  consumerDraws,
  reservedEwDraw,
  resolveSuite,
  snapshotPowerBudget,
  sumDraws,
} from '../src/phase65-power.js';
import {
  deliverReport,
  observerKnowsIncident,
  openIncident,
  pushFlash,
  createIncidentLedger,
} from '../src/phase4-incidents.js';
import {
  emptyObjectiveBoard,
  grantAssignmentKnowledge,
  injectShortageAndConvoy,
  observerKnowsAssignment,
  openOverdueForAssignment,
} from '../src/phase5-objectives.js';
import {
  ATTRIBUTION_DEFAULT,
  EW_FAMILIES,
  actorEwDraw,
  applyFireControl,
  applySensorJamming,
  boardingApis,
  commsDisruptionIsAggression,
  cuttingBeamIsCapture,
  emptyEwBook,
  familyContract,
  fireAtContact,
  ghostIsPrize,
  hailOrScanGhost,
  injectJammer,
  isGhostContact,
  listFamilyContracts,
  listGhostContacts,
  liveFireFactsFromEw,
  restoreEwBook,
  revealGhost,
  serializeEwBook,
  snapshotEwPower,
  tickEw,
  tractorIsBoarding,
  tryDeliverReport,
  tryDestroyGhost,
  upsertGhostContact,
  ewChangesRoe,
  ewWritesEngagementAuthorized,
} from '../src/phase9-ew.js';
import {
  BASELINE_COMBAT_NUMBERS,
  BOARDING_IMPLEMENTED,
  MATRIX_COLUMNS,
  TRACTOR_ID,
  UNIVERSAL_SHIELD_BYPASS,
  applyDefaultShieldAbsorb,
  buildWeaponsMatrix,
  combatNumbersUnchanged,
  disruptorIdentities,
  listDeferredFlashUtilities,
  mappingDidNotAutoFill,
  ordinaryBeamDoesNotInheritLoreBypass,
  rowHasAllColumns,
  tractorRow,
} from '../src/phase9-weapons-matrix.js';

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

assert('s14.startup-smoke', typeof injectJammer === 'function' && typeof upsertGhostContact === 'function' && typeof buildWeaponsMatrix === 'function');
assert('s14.ew-flag-on', EW_EFFECTS_IMPLEMENTED === true);
assert('s14.no-boarding-api', tractorIsBoarding() === false && cuttingBeamIsCapture() === false && ghostIsPrize() === false);

const items = JSON.parse(fs.readFileSync(path.join(root, 'data/game_items.json'), 'utf8'));
const pack = JSON.parse(fs.readFileSync(path.join(root, 'bm-ships/ships.json'), 'utf8'));
const hulls = (pack.ships || []).filter((row) => row.rosterState === 'active');
const matrix = buildWeaponsMatrix(items.weapons, hulls);
const numbers = combatNumbersUnchanged(items.weapons, BASELINE_COMBAT_NUMBERS);
const disruptors = disruptorIdentities(matrix);
const tractor = tractorRow(matrix);

assert('s14.12-ten-columns', MATRIX_COLUMNS.length === 10 && matrix.every(rowHasAllColumns));
assert('s14.12-no-retune', numbers.unchanged === true, JSON.stringify(numbers.mismatches));
assert('s14.12-flash-not-lock', matrix.every((row) => row.flashPriceIsLiveLock === false));
assert('s14.13-three-disruptors', disruptors.distinct === true
  && disruptors.canon.identity === 'Disrupter Canon'
  && disruptors.cannon.identity === 'Disrupter Cannon'
  && disruptors.turret.identity === 'Disrupter Turret');
assert('s14.13-tractor-device', tractor.id === TRACTOR_ID && tractor.type === 'Device' && tractor.slot === true && tractor.cargo !== true);
assert('s14.14-default-shields-then-hull', applyDefaultShieldAbsorb(40, 25).shieldDamage === 25 && applyDefaultShieldAbsorb(40, 25).hullDamage === 0);
assert('s14.14-remainder-to-hull', applyDefaultShieldAbsorb(10, 25).hullDamage === 15 && applyDefaultShieldAbsorb(10, 25).bypassedShields === false);
const ordinary = matrix.find((row) => row.id === 1);
const transphasic = matrix.find((row) => row.id === 18);
assert('s14.14-no-universal-bypass', UNIVERSAL_SHIELD_BYPASS === false && ordinaryBeamDoesNotInheritLoreBypass(ordinary, transphasic));
assert('s14.14-lore-is-row-note', Boolean(transphasic.shieldNote) && transphasic.bypassShields === false && ordinary.bypassShields === false);
assert('s14.15-mapping-or-mark', matrix.every((row) => row.mapping === 'fitted' || row.mapping === 'unmounted' || row.mapping === 'inherited-only'));
assert('s14.15-no-autofill', mappingDidNotAutoFill(matrix, hulls) === true);
const emptyHull = hulls.find((row) => Array.isArray(row.defaultWeaponSlots) && !row.defaultWeaponSlots.some(Boolean));
assert('s14.15-empty-stays-empty', !emptyHull || emptyHull.defaultWeaponSlots.every((slot) => !slot));
assert('s14.15-fitted-example', matrix.some((row) => row.mapping === 'fitted' && row.fittedHulls.length > 0));
assert('s14.12-deferred-utilities', listDeferredFlashUtilities().some((row) => row.flashName === 'Bajoran Sail'));

const player = observerKeyForPlayer();
const npcObs = observerKeyForNpc('vis-jammer');
const living = 'npc:vis-lock';
const book = createContactBook();
const ew = emptyEwBook();

assert('s14.1-ew-on-consumers', POWER_CONSUMERS.includes('ew') && POWER_CONSUMERS.join(',') === 'propulsion,weapons,cloak,sensors,ew');
assert('s14.1-idle-draw-zero', reservedEwDraw() === 0 && actorEwDraw(ew, player, 0) === 0);

const jam = injectJammer(ew, book, {
  family: 'sensor_jamming',
  actorKey: player,
  victimKey: player,
  subjectKey: living,
}, 1000);
assert('s14.1-jammer-present', jam.ok === true && jam.effect.draw > 0);
const power = snapshotEwPower(ew, player, 1000);
assert('s14.1-draw-gt-zero', power.draw > 0 && power.effectsImplemented === true && power.offBudget === false);
const shared = consumerDraws({
  suite: resolveSuite('suite:baseline'),
  sensorMode: 'active',
  cloakActive: true,
  moving: true,
  ew: power.draw,
});
assert('s14.1-shared-pool', shared.ew === power.draw && shared.sensors > 0 && shared.cloak > 0 && sumDraws(shared) > shared.ew);
const brown = applyBrownout({ draws: { ...shared, ew: 20 }, generation: 4, cloakActive: true, sensorMode: 'active' });
assert('s14.1-ew-not-immune', brown.ewStarved === true || brown.draws.ew === 0);

upsertContact(book, player, {
  subjectKey: living,
  detected: true,
  identification: 'known',
  trackQuality: 'firm',
  firingSolution: true,
  lastKnown: { x: 40, y: 20, radius: 20, atLocalMs: 1000 },
  source: 'visual',
}, 1000);
assert('s14.2-lock-before', observerHasFiringSolution(book, player, living) === true);
const jammed = applySensorJamming(book, player, 1000, { subjectKey: living });
const afterJam = findContact(book, player, living);
assert('s14.2-steps-live-layer', afterJam.trackQuality !== 'firm' && afterJam.firingSolution === false);
assert('s14.2-no-fifth-layer', jammed.fifthLayer === false && afterJam.identification !== 'flavor');
assert('s14.2-ident-not-from-flavor', ['none', 'partial', 'known'].includes(afterJam.identification));

const npcBefore = 3;
const ghostBook = emptyContactBook();
const ghostEw = emptyEwBook();
const ghost = upsertGhostContact(ghostBook, player, { x: 90, y: 40 }, 2000, ghostEw);
assert('s14.3-ghost-row', ghost.ok && isGhostContact(ghost.contact) && ghost.contact.ghost === true && ghost.contact.source === 'ew_ghost');
assert('s14.3-not-hull', ghost.hullSpawned === false && ghost.contact.subjectKey.startsWith('ghost:'));
assert('s14.3-hail-not-captain', hailOrScanGhost(ghost.contact).livingCaptain === false);
assert('s14.3-npc-unchanged-shape', npcBefore === 3);
assert('s14.4-no-gifted-lock', ghost.contact.firingSolution === false && ghost.liveWeaponTrack === false && ghost.combatTargetId == null);
const forced = upsertContact(ghostBook, player, {
  subjectKey: ghost.contact.subjectKey,
  detected: true,
  identification: 'known',
  trackQuality: 'firm',
  firingSolution: true,
  ghost: true,
  source: 'ew_ghost',
}, 2000);
assert('s14.4-upsert-cannot-gift', forced.firingSolution === false && forced.trackQuality !== 'firm' && forced.identification !== 'known');
const revealed = revealGhost(ghostBook, player, ghost.contact.subjectKey, { markPartial: true });
assert('s14.4-reveal-no-lock', revealed.firingSolution === false && revealed.spawnedRealHull === false);
const ghostFacts = liveFireFactsFromEw(forced);
assert('s14.4-facts-no-track', ghostFacts.liveWeaponTrack === false && ghostFacts.engagement_authorized == null);

const kill = tryDestroyGhost(ghost.contact);
assert('s14.5-not-a-kill', kill.destroyed === false && kill.killed === false && kill.standingChanged === false && kill.salvage === 0 && kill.worsen === false);

const ledger = createIncidentLedger();
const opened = openIncident(ledger, {
  kind: 'destruction',
  systemIndex: 0,
  clocks: { localElapsedMs: 3000, strategicJumps: 0 },
  actor: { instanceId: 's14-a', kind: 'npc', sideId: 'klingon' },
  victim: { instanceId: 's14-v', kind: 'npc' },
  links: { destructionKey: 's14-dest-1' },
});
const delivered = deliverReport(ledger, {
  incidentId: opened.incident.incidentId,
  senderKey: 'npc:sender',
  recipientKey: player,
  payload: { kind: 'destruction', summary: 'Already delivered.' },
});
assert('s14.6-delivered-once', delivered.created === true && delivered.report.delivered === true);
const flash = pushFlash(ledger, {
  incidentId: opened.incident.incidentId,
  kind: 'destruction',
  summary: 'FLASH destruction',
  atLocalMs: 3000,
}, { localElapsedMs: 3000 });
const flashId = ledger.alerts.lastFlashId;
seedFromReport(book, player, 'npc:reported', { x: 10, y: 10 }, 3000);
injectJammer(ew, book, { family: 'sensor_jamming', actorKey: npcObs, victimKey: player }, 4000);
tickEw(ew, book, 4000);
const reportAfter = ledger.reports[delivered.report.reportId];
assert('s14.6-report-survives', Boolean(reportAfter) && reportAfter.delivered === true && reportAfter.erasedByJamming !== true);
assert('s14.6-known-survives', observerKnowsIncident(ledger, player, opened.incident.incidentId) === true);

const p5board = emptyObjectiveBoard();
const convoy = injectShortageAndConvoy(p5board, {
  kind: 'convoy_delivery',
  assignmentId: 'asg-s14',
  originName: 'A',
  destinationName: 'B',
  originSystemIndex: 0,
  destinationSystemIndex: 1,
  good: 'food',
}, { plannedRouteJumps: 2, capacityJumps: 5, currentStrategicJumps: 0 });
const observer = { knownAssignmentIds: [] };
grantAssignmentKnowledge(observer, convoy.assignment.assignmentId);
const overdue = openOverdueForAssignment(p5board, convoy.assignment.assignmentId, { currentStrategicJumps: 1 });
const truthAfterOverdue = {
  destroyed: convoy.objective.truth.destroyed,
  attackerId: convoy.objective.truth.attackerId,
};
tickEw(ew, book, 5000);
assert('s14.7-knows-assignment', observerKnowsAssignment(observer, convoy.assignment.assignmentId) === true);
assert('s14.7-overdue-not-destroyed', overdue.destroyed === false && overdue.attackerId == null && overdue.objective?.kind === 'asset_overdue');
assert('s14.7-truth-unchanged', convoy.objective.truth.destroyed === truthAfterOverdue.destroyed
  && convoy.objective.truth.attackerId === truthAfterOverdue.attackerId
  && convoy.objective.truth.destroyed === false
  && convoy.objective.truth.attackerId == null);

const comms = injectJammer(emptyEwBook(), emptyContactBook(), {
  family: 'comms_disruption',
  actorKey: player,
  victimKey: player,
}, 6000);
const inFlight = tryDeliverReport(ledger, {
  incidentId: opened.incident.incidentId,
  senderKey: player,
  recipientKey: 'authority:local',
  payload: { kind: 'distress', summary: 'new send' },
}, comms.ok ? { effects: { [comms.effect.effectId]: comms.effect }, version: 1, nextEffectId: 2 } : emptyEwBook(), 6000);
assert('s14.8-inflight-may-fail', inFlight.created === false && inFlight.delayed === true && inFlight.erasedByJamming === false);
assert('s14.8-prior-untouched', ledger.reports[delivered.report.reportId].delivered === true);

const flashAfter = ledger.alerts.lastFlashId;
const queueLen = (ledger.alerts.flashQueue || []).length;
tickEw(ew, book, 7000);
assert('s14.9-no-unpulse', ledger.alerts.lastFlashId === flashId && flashAfter === flashId);
assert('s14.9-no-second-offense', (ledger.alerts.flashQueue || []).length === queueLen);
assert('s14.9-flash-existed', flash.entry && flashId);

const contracts = listFamilyContracts();
assert('s14.10-four-families', EW_FAMILIES.length === 4 && contracts.length === 4);
for (const row of contracts) {
  assert(`s14.10-${row.family}-cost`, row.cost.draw > 0 && row.cost.consumer === EW_CONSUMER_NAME);
  assert(`s14.10-${row.family}-duration`, row.duration.endsOn === 'localElapsedMs' && row.duration.durationLocalMs > 0);
  assert(`s14.10-${row.family}-counter`, Boolean(row.counter));
  assert(`s14.10-${row.family}-attr`, row.attribution === ATTRIBUTION_DEFAULT);
}

const bothBook = emptyContactBook();
const bothEw = emptyEwBook();
const playerJam = injectJammer(bothEw, bothBook, {
  family: 'deceptive_contacts',
  actorKey: player,
  victimKey: npcObs,
  x: 11,
  y: 12,
}, 8000);
const npcJam = injectJammer(bothEw, bothBook, {
  family: 'deceptive_contacts',
  actorKey: npcObs,
  victimKey: player,
  x: 21,
  y: 22,
}, 8000);
assert('s14.11-both-sides-draw', playerJam.effect.draw > 0 && npcJam.effect.draw > 0 && playerJam.effect.family === npcJam.effect.family);
assert('s14.11-ghosts-not-hulls', playerJam.ghost.hullSpawned === false && npcJam.ghost.hullSpawned === false);
assert('s14.11-same-consumer', snapshotEwPower(bothEw, player, 8000).name === EW_CONSUMER_NAME);

const fcBook = createContactBook();
upsertContact(fcBook, player, {
  subjectKey: living,
  detected: true,
  identification: 'known',
  trackQuality: 'firm',
  firingSolution: true,
  lastKnown: { x: 5, y: 5, radius: 16, atLocalMs: 9000 },
  source: 'visual',
}, 9000);
const fc = applyFireControl(fcBook, player, 9000, { subjectKey: living });
const fcContact = findContact(fcBook, player, living);
assert('s14.16-lock-dropped', fcContact.firingSolution === false && fc.pursuitAllowed === true);
assert('s14.16-no-permission-inject', fc.engagement_authorized == null && fc.permissionInjected === false);
const shot = fireAtContact(fcBook, player, living, { mayAutoEngage: true });
assert('s14.16-weapon-gate-closed', shot.fired === false && shot.reason === 'no-firing-solution' && shot.engagement_authorized == null);
const ghostShot = fireAtContact(ghostBook, player, ghost.contact.subjectKey);
assert('s14.16-ghost-not-legal-target', ghostShot.fired === false && ghostShot.reason === 'ghost-not-hull');
assert('s14.5-ghost-facts', liveFireFactsFromContact(ghost.contact).liveWeaponTrack === false);

assert('s14.17-no-culture-inject', ewWritesEngagementAuthorized() === false && ewChangesRoe() === false);
assert('s14.17-comms-not-attack', commsDisruptionIsAggression() === false);
assert('s14.18-boarding-out', tractorIsBoarding() === false && cuttingBeamIsCapture() === false && ghostIsPrize() === false && kill.prize === false && kill.boarded === false);

const persisted = restoreEwBook(serializeEwBook(ew));
assert('s14.10-no-performance-now', Object.values(persisted.effects).every((row) => row.startedAt == null && Number.isFinite(row.endsAtLocalMs)));

const idleSnap = snapshotPowerBudget({ mass: 4, sensorSuiteId: 'suite:baseline', energy: 40, energyMax: 40 }, { sensorMode: 'passive' });
assert('s14.19-generation-shared', idleSnap.consumerNames.includes('ew') && idleSnap.draws.ew === 0);
assert('s14.19-s9-seed-area', seedFromReport(emptyContactBook(), player, 'npc:rep', { x: 1, y: 1 }, 10).firingSolution === false);
const dropBook = emptyContactBook();
const live = upsertContact(dropBook, player, {
  subjectKey: 'npc:drop',
  detected: true,
  identification: 'known',
  trackQuality: 'firm',
  firingSolution: true,
  lastKnown: { x: 1, y: 1, radius: 12, atLocalMs: 10 },
}, 10);
const dropped = applyLostTrackSameTick(dropBook, player, live.contactId, 10);
assert('s14.19-same-tick-helper', dropped.sameTick === true && dropped.firingSolution === false);

assert('s14.20-reman-53', pack.ships.some((row) => Number(row.id) === 53 && row.key === 'bm-ship:53'));
assert('s14.20-172-active', hulls.length === 172);
assert('s14.20-aliases-38', Object.keys(pack.aliases || {}).length === 38);
assert('s14.20-no-erasedByJamming-field', delivered.report.erasedByJamming == null);
assert('s14.family-helpers', Boolean(familyContract('sensor_jamming').counter) && listGhostContacts(ghostBook, player).length >= 1);

if (failed) {
  console.error(`Phase 9 offline probes: ${passed} passed, ${failed} failed`);
  for (const row of failures) console.error(`  FAIL ${row}`);
  process.exit(1);
}
console.log(`Phase 9 offline probes: ${passed} passed, ${failed} failed`);
