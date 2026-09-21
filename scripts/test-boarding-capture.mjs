#!/usr/bin/env node
/**
 * Offline boarding / capture / command-transfer checks (S17).
 * Written from docs/boarding/ only. Does not crib remastered-work.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BOARDING_IMPLEMENTED,
  HULL_BOARDING_THRESHOLD,
  NPC_BOARDING_IMPLEMENTED,
  REFUSE_REASONS,
  boardingApiNames,
  boardingEligibleHull,
  evaluateBoardingEligibility,
  hullRatio,
} from '../src/boarding-eligibility.js';
import {
  BOARDING_RANGE_LOCKED,
  evaluateBoardingReach,
} from '../src/boarding-reach.js';
import {
  MAGNITUDES_LOCKED_FROM_REMASTERED,
  awayTeamXpSnapshot,
  cancelInFlight,
  emptyBoardingBook,
  injectBoardingAttempt,
  issueBoardingAttempt,
  restoreBoardingBook,
  serializeBoardingBook,
  snapshotAttempt,
  tickBoarding,
  xorOk,
} from '../src/boarding-attempt.js';
import {
  applyCaptureCredit,
  hasCaptureForVictim,
  killTokenForOriginal,
  makeCaptureToken,
  prizeLaterDestroyCredit,
  rememberCapture,
  shouldSkipOriginalKillStanding,
} from '../src/boarding-credit.js';
import {
  capturePrizeHull,
  cloneSlots,
  prizeRowFromHull,
} from '../src/boarding-identity.js';
import {
  evaluateCommandTransfer,
  transferCommand,
} from '../src/command-transfer.js';
import {
  tractorIsBoarding,
  cuttingBeamIsCapture,
  ghostIsPrize,
  boardingApis,
  BOARDING_IMPLEMENTED as EW_BOARDING,
} from '../src/phase9-ew.js';
import { BOARDING_IMPLEMENTED as MATRIX_BOARDING, TRACTOR_ID } from '../src/phase9-weapons-matrix.js';
import {
  createIncidentLedger,
  FLASH_ELIGIBLE_KINDS,
  INCIDENT_KINDS,
  makePunishmentToken,
  openIncident,
  rememberPunishment,
} from '../src/phase4-incidents.js';
import {
  injectShortageAndConvoy,
  markAssignmentCaptured,
  markAssignmentDestroyed,
  emptyObjectiveBoard,
} from '../src/phase5-objectives.js';

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

function hullAt(ratio, extras = {}) {
  const max = 1000;
  return {
    id: extras.id || 'npc-slot-9',
    securityInstanceId: extras.securityInstanceId || 'npc:security-instance-9',
    shipId: extras.shipId ?? 41,
    name: extras.name || 'IKS Probe',
    faction: extras.faction || 'klingon',
    combatHull: Math.round(max * ratio),
    maxCombatHull: max,
    weaponSlots: extras.weaponSlots || [null, null, null],
    destroyed: extras.destroyed === true,
    stationTypeId: extras.stationTypeId,
    ghost: extras.ghost === true,
    decoy: extras.decoy === true,
    source: extras.source,
    role: extras.role,
  };
}

assert('s17.startup-helpers', typeof evaluateBoardingEligibility === 'function'
  && typeof injectBoardingAttempt === 'function'
  && typeof makeCaptureToken === 'function'
  && typeof capturePrizeHull === 'function'
  && typeof transferCommand === 'function'
  && typeof awayTeamXpSnapshot === 'function'
  && typeof markAssignmentCaptured === 'function');

assert('s17.implemented-flag', BOARDING_IMPLEMENTED === true && EW_BOARDING === true && MATRIX_BOARDING === true);
assert('s17.apis-listed', boardingApiNames().length > 0 && boardingApis().length > 0);
assert('s17.16-npc-path-explicit', NPC_BOARDING_IMPLEMENTED === false);

const above = evaluateBoardingEligibility(hullAt(0.11));
assert('s17.1-hull-above-refuses', above.ok === false && above.reason === REFUSE_REASONS.HULL_ABOVE && above.ratio > 0.10);
assert('s17.1-no-round-11', hullRatio(hullAt(0.11)) > HULL_BOARDING_THRESHOLD);

const atTen = evaluateBoardingEligibility(hullAt(0.10));
const below = evaluateBoardingEligibility(hullAt(0.08));
const wreck = evaluateBoardingEligibility(hullAt(0, { destroyed: false, combatHull: 0 }));
const dead = evaluateBoardingEligibility({ ...hullAt(0.05), destroyed: true, combatHull: 50 });
assert('s17.2-at-10-ok', atTen.ok === true && atTen.ratio === 0.10);
assert('s17.2-below-ok', below.ok === true && below.ratio <= 0.10);
assert('s17.2-11-still-refuses', evaluateBoardingEligibility(hullAt(0.11)).ok === false);
assert('s17.2-wreck-refuses', wreck.ok === false && (wreck.reason === REFUSE_REASONS.WRECK || wreck.reason === REFUSE_REASONS.DESTROYED));
assert('s17.2-destroyed-refuses', dead.ok === false);
assert('s17.2-station-out', evaluateBoardingEligibility({ ...hullAt(0.05), stationTypeId: 'outpost' }).reason === REFUSE_REASONS.STATION);
assert('s17.2-eligible-helper', boardingEligibleHull(hullAt(0.10)) === true && boardingEligibleHull(hullAt(0.11)) === false);

const book = emptyBoardingBook();
const cap = injectBoardingAttempt(book, {
  victimInstanceId: 'npc:security-instance-9',
  hullRatioAtStart: 0.08,
  outcome: 'capture',
}, 1000);
assert('s17.3-capture-xor', cap.ok && cap.captured === true && cap.scuttled === false && cap.xorOk === true && cap.attempt.destroyed !== true);
const scuttleBook = emptyBoardingBook();
const scu = injectBoardingAttempt(scuttleBook, {
  victimInstanceId: 'npc:security-instance-8',
  outcome: 'scuttle',
}, 1000);
assert('s17.3-scuttle-xor', scu.ok && scu.captured === false && scu.scuttled === true);
const failBook = emptyBoardingBook();
const fail = injectBoardingAttempt(failBook, {
  victimInstanceId: 'npc:security-instance-7',
  outcome: 'fail',
}, 1000);
assert('s17.3-fail-neither', fail.ok && fail.captured === false && fail.scuttled === false);
const both = injectBoardingAttempt(emptyBoardingBook(), {
  victimInstanceId: 'npc:x',
  outcome: 'capture',
  captured: true,
  scuttled: true,
}, 0);
assert('s17.3-both-flags-fail', both.ok === false && both.reason === 'xor-violation' && xorOk(true, true) === false);

const xp = awayTeamXpSnapshot();
assert('s17.4-xp-explicit', xp.tracked === true && xp.rule === 'named_mix' && xp.tablePresent === false && xp.magnitudesInjectable === true);
assert('s17.4-no-locked-odds', MAGNITUDES_LOCKED_FROM_REMASTERED === false && emptyBoardingBook().successPercentLocked === false);
assert('s17.4-range-not-locked', BOARDING_RANGE_LOCKED === false);

assert('s17.5-tractor-not-board', tractorIsBoarding() === false && cuttingBeamIsCapture() === false && ghostIsPrize() === false);
assert('s17.5-ghost-not-eligible', evaluateBoardingEligibility({ ...hullAt(0.05), ghost: true }).reason === REFUSE_REASONS.GHOST);
assert('s17.5-decoy-not-eligible', evaluateBoardingEligibility({ ...hullAt(0.05), decoy: true, source: 'ew_decoy' }).reason === REFUSE_REASONS.DECOY);
const tractorOnly = evaluateBoardingEligibility(hullAt(0.05), { tractorHoldOnly: true, boardingOrderIssued: false });
assert('s17.5-hold-without-order', tractorOnly.ok === false && tractorOnly.reason === REFUSE_REASONS.TRACTOR);
assert('s17.5-tractor-id', TRACTOR_ID === 25);

const noDetect = evaluateBoardingReach({ detected: false, sameSystem: true, inRange: true });
const cloak = evaluateBoardingReach({ detected: true, cloakedHidden: true, sameSystem: true, inRange: true });
const report = evaluateBoardingReach({ detected: false, reportOnly: true, sameSystem: true, inRange: true });
const residue = evaluateBoardingReach({ detected: false, residueOnly: true, sameSystem: true, inRange: true });
const otherSys = evaluateBoardingReach({ detected: true, sameSystem: false, inRange: true });
const fsFalse = evaluateBoardingReach({ detected: true, firingSolution: false, sameSystem: true, inRange: true });
const checkpoint = evaluateBoardingReach({ detected: true, sameSystem: true, inRange: true, checkpointEnforcement: true });
assert('s17.12-no-detection', noDetect.ok === false && noDetect.reason === REFUSE_REASONS.NOT_DETECTED);
assert('s17.12-cloak-hidden', cloak.ok === false && cloak.reason === REFUSE_REASONS.CLOAKED);
assert('s17.12-report-only', report.ok === false);
assert('s17.12-residue-only', residue.ok === false);
assert('s17.12-out-of-system', otherSys.ok === false);
assert('s17.12-fs-not-required', fsFalse.ok === true && fsFalse.firingSolutionRequired === false && fsFalse.giftedFs === false);
assert('s17.13-checkpoint-not-warrant', checkpoint.ok === false && checkpoint.reason === REFUSE_REASONS.CHECKPOINT);

const emptySlots = [null, null, null];
const live = hullAt(0.08, { weaponSlots: emptySlots, shipId: 41, name: 'IKS Probe' });
const identityBook = emptyBoardingBook();
const prize = capturePrizeHull(identityBook, live, {
  playerFaction: 'ferengi',
  playerSide: 'ferengi',
  reman53: { unlocked: false },
  stations: [{ id: 'st-1', faction: 'klingon' }],
  localElapsedMs: 2000,
});
assert('s17.10-capture-live', prize.ok && prize.captured && prize.scuttled === false && prize.destroyed === false);
assert('s17.10-shipid', prize.prize.shipId === 41 && prize.identity.shipId === 41);
assert('s17.10-empty-slots', JSON.stringify(prize.prize.weaponSlots) === JSON.stringify(emptySlots) && prize.identity.emptySlotsStayEmpty === true);
assert('s17.10-no-default-weapons', prize.applyShipDefaultWeaponsCalled === false);
assert('s17.10-name', prize.prize.name === 'IKS Probe');
assert('s17.10-damage', prize.prize.hullRatio === 0.08);
assert('s17.10-not-ambient-id', prize.identity.notAmbientNpcId === true && String(prize.prize.id).startsWith('pz-'));
assert('s17.10-concessions', prize.concessions[0].faction === 'klingon');
assert('s17.10-no-conscript', prize.foreignHullsUntouched === true);
assert('s17.6-no-auth', prize.engagement_authorized == null && prize.giftedFs === false);

const ledger = createIncidentLedger();
const credit = applyCaptureCredit(identityBook, ledger, {
  victimInstanceId: live.securityInstanceId,
  credit: 'player',
  systemIndex: 0,
  localElapsedMs: 2000,
});
assert('s17.7-capture-token', credit.ok && credit.family === 'capture' && credit.token.startsWith('capture:'));
assert('s17.7-no-kill-standing', credit.applyKillStanding === false && credit.standingDelta === 0);
assert('s17.7-no-salvage', credit.salvageLatinum === 0);
assert('s17.7-no-flash', credit.flash === false);
assert('s17.7-kill-absent', killTokenForOriginal(ledger, live.securityInstanceId) == null);
assert('s17.7-has-capture', hasCaptureForVictim(identityBook, ledger, live.securityInstanceId) === true);
assert('s17.6-capture-kind', INCIDENT_KINDS.includes('capture') && !FLASH_ELIGIBLE_KINDS.includes('capture'));

const opened = openIncident(ledger, {
  kind: 'capture',
  systemIndex: 0,
  actor: { instanceId: 'player', kind: 'player' },
  victim: { instanceId: live.securityInstanceId, kind: 'npc' },
  action: 'captured',
  links: { punishmentToken: credit.token },
  sayable: 'Prize taken. Not a kill.',
});
assert('s17.7-capture-incident', opened.created === true && opened.incident.kind === 'capture');

const scuttleLedger = createIncidentLedger();
const killTok = makePunishmentToken({
  credit: 'player',
  systemIndex: 0,
  victimInstanceId: 'npc:original-scuttle',
  localElapsedMs: 3000,
});
rememberPunishment(scuttleLedger, killTok);
openIncident(scuttleLedger, {
  kind: 'destruction',
  systemIndex: 0,
  actor: { instanceId: 'player', kind: 'player' },
  victim: { instanceId: 'npc:original-scuttle', kind: 'npc' },
  action: 'destroyed',
  links: { destructionKey: 'npc:original-scuttle', punishmentToken: killTok },
});
assert('s17.8-scuttle-kill-once', killTokenForOriginal(scuttleLedger, 'npc:original-scuttle') === killTok);
assert('s17.8-no-capture-on-scuttle', hasCaptureForVictim(emptyBoardingBook(), scuttleLedger, 'npc:original-scuttle') === false);

const prizeNpc = { securityInstanceId: live.securityInstanceId, captured: true, faction: 'klingon' };
const later = prizeLaterDestroyCredit(identityBook, ledger, prizeNpc);
assert('s17.9-skip-original-kill', later.skipOriginalKill === true && later.mintKillForOriginal === false && later.standingDelta === 0);
assert('s17.9-should-skip', shouldSkipOriginalKillStanding(identityBook, ledger, prizeNpc) === true);

const flagship = {
  id: 'player',
  shipId: 18,
  name: 'Probe Ship',
  weaponSlots: [1, null, null],
  hull: 100,
  flagship: true,
  assignment: 'flagship',
};
const ownedPrize = {
  id: prize.prize.id,
  shipId: 41,
  name: 'IKS Probe',
  weaponSlots: emptySlots,
  captured: true,
  assignment: 'escort',
  destroyed: false,
};
const xfer = transferCommand(flagship, ownedPrize, { sameSystem: true, ownedIds: new Set([ownedPrize.id]) });
assert('s17.11-transfer-ok', xfer.ok && xfer.next.shipId === 41 && xfer.previousStillOwned === true);
assert('s17.11-slots', JSON.stringify(xfer.next.weaponSlots) === JSON.stringify(emptySlots));
assert('s17.11-old-owned', xfer.previous.shipId === 18 && xfer.previous.flagship === false);
assert('s17.11-no-refit', xfer.applyShipDefaultWeaponsCalled === false && xfer.resolveNewLiveShipIdCalled === false);
assert('s17.11-no-roe', xfer.engagement_authorized == null && xfer.playerFactionUnchanged === true);
const foreign = evaluateCommandTransfer({
  flagship,
  target: { id: 'npc-foreign', shipId: 9, captured: false, faction: 'klingon' },
  sameSystem: true,
  ownedIds: new Set(),
});
assert('s17.11-foreign-refuse', foreign.ok === false && foreign.foreignRefuse === true);

const holdOrder = { kind: 'hold_outside', status: 'standing', parkedSystemIndex: 0 };
assert('s17.11-hold-outside-shape', holdOrder.kind === 'hold_outside' && xfer.holdOutsidePreserved === true);

const p5 = emptyObjectiveBoard();
const injected = injectShortageAndConvoy(p5, {
  assignmentId: 'asg-prize',
  originSystemIndex: 0,
  destinationSystemIndex: 1,
  good: 'duranium',
}, { currentStrategicJumps: 0, plannedRouteJumps: 2, capacityJumps: 8 });
assert('s17.14-setup', injected.ok === true);
const capturedClose = markAssignmentCaptured(p5, 'asg-prize');
const obj = Object.values(p5.objectives)[0];
assert('s17.14-captured-not-destroyed', capturedClose.ok && capturedClose.destroyed === false && capturedClose.attackerId == null);
assert('s17.14-truth', obj.truth.captured === true && obj.truth.destroyed === false && obj.truth.attackerId == null);
const laterDestroy = markAssignmentDestroyed(p5, 'asg-prize', { credit: 'player', attackerId: 'player' });
const objAfter = Object.values(p5.objectives)[0];
assert('s17.14-no-reopen-destroyed', objAfter.truth.destroyed !== true && objAfter.truth.captured === true);

const scuttleBoard = emptyObjectiveBoard();
injectShortageAndConvoy(scuttleBoard, {
  assignmentId: 'asg-scuttle',
  originSystemIndex: 0,
  destinationSystemIndex: 1,
  good: 'latinum',
}, { currentStrategicJumps: 0, plannedRouteJumps: 1, capacityJumps: 8 });
const scuttleClose = markAssignmentDestroyed(scuttleBoard, 'asg-scuttle', { credit: 'player' });
assert('s17.14-scuttle-destroyed', scuttleClose.destroyed === true);

const persistBook = emptyBoardingBook();
injectBoardingAttempt(persistBook, { victimInstanceId: 'npc:persist', outcome: 'capture' }, 4000);
persistBook.prizes['pz-1'] = prizeRowFromHull(hullAt(0.05, { securityInstanceId: 'npc:persist' }), { commandId: 'pz-1', localElapsedMs: 4000 });
const saved = serializeBoardingBook(persistBook);
assert('s17.15-no-performance-now', Object.values(saved.attempts).every((row) => row.startedAt == null && Number.isFinite(row.firedAtLocalMs)));
const wiped = { systemStates: {} };
const restored = restoreBoardingBook(saved);
assert('s17.15-reload', restored.attempts['brd-1']?.attemptId === Object.values(saved.attempts)[0].attemptId);
assert('s17.15-prize-survives-systemstates', wiped.systemStates && restored.prizes['pz-1']?.sourceInstanceId === 'npc:persist');
assert('s17.15-xp-on-restore', restored.awayTeamXp.tracked === true && restored.awayTeamXp.rule === 'named_mix' && restored.awayTeamXp.tablePresent === false);

const travel = emptyBoardingBook();
issueBoardingAttempt(travel, { victimInstanceId: 'npc:tick', travelMs: 50 }, 10);
const early = tickBoarding(travel, 20);
assert('s17.15-tick-waits', early.results.length === 0 && travel.attempts['brd-1']?.status === 'in-transit');
const laterTick = tickBoarding(travel, 70, { outcome: 'fail' });
assert('s17.15-tick-local-ms', laterTick.results[0]?.outcome === 'fail' && laterTick.results[0]?.captured === false);

const cancelBook = emptyBoardingBook();
issueBoardingAttempt(cancelBook, { victimInstanceId: 'npc:cancel', travelMs: 999 }, 0);
const cancelled = cancelInFlight(cancelBook, 5);
assert('s17.15-cancel-fail', cancelled.ok && cancelled.captured === false && cancelled.scuttled === false);

assert('s17.17-tractor-still-false', tractorIsBoarding() === false);
assert('s17.17-ew-boarding-flag', EW_BOARDING === true && tractorIsBoarding() === false);

const items = JSON.parse(fs.readFileSync(path.join(root, 'data/game_items.json'), 'utf8'));
const tractor = (items.weapons || []).find((row) => Number(row.id) === 25);
assert('s17.17-tractor-device', tractor && tractor.type === 'Device');

const snap = snapshotAttempt(book);
assert('s17.3-snapshot-xor', snap.xorOk === true && !(snap.captured && snap.scuttled));

if (failed) {
  console.error(`Boarding offline probes: ${passed} passed, ${failed} failed`);
  for (const row of failures) console.error(`  - ${row}`);
  process.exit(1);
}
console.log(`Boarding offline probes: ${passed} passed`);
