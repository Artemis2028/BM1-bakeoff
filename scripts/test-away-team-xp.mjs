#!/usr/bin/env node
/**
 * Offline away-team XP probes (S30 family).
 * Written from docs/away-team-xp/ only. Does not crib remastered-work.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tractorIsBoarding, BOARDING_IMPLEMENTED as EW_BOARDING } from '../src/phase9-ew.js';
import {
  BOARDING_IMPLEMENTED,
  HULL_BOARDING_THRESHOLD,
  evaluateBoardingEligibility,
} from '../src/boarding-eligibility.js';
import {
  MAGNITUDES_LOCKED_FROM_REMASTERED as BOARDING_LOCK,
  cancelInFlight,
  emptyBoardingBook,
  injectBoardingAttempt,
  issueBoardingAttempt,
  restoreBoardingBook,
  serializeBoardingBook,
} from '../src/boarding-attempt.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as SLOT_LOCK } from '../src/phase91-ew-slot.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE92_LOCK } from '../src/phase92-magnitudes.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE93_LOCK } from '../src/phase93-magnitudes.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE94_LOCK } from '../src/phase94-magnitudes.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE10_LOCK } from '../src/phase10-magnitudes.js';
import { UTILITY_LOCKED_FROM_REMASTERED, emptyUtilityBook } from '../src/utility-inventory.js';
import { LEDGER_LOCKED_FROM_REMASTERED } from '../src/weapon-source-ledger.js';
import { EMPTY_ARMABLE_LOCKED_FROM_REMASTERED } from '../src/empty-armable.js';
import { CONSTRUCTION_LOCKED_FROM_REMASTERED } from '../src/construction-visuals.js';
import { HTML_CATALOG_LOCKED_FROM_REMASTERED } from '../scripts/build-html-catalogs.mjs';
import { ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED } from '../src/economy-difficulty.js';
import { STANDING_TIERS_LOCKED_FROM_REMASTERED } from '../src/standing-tiers.js';
import { DOCK_CLEAR_LOCKED_FROM_REMASTERED } from '../src/dock-clear.js';
import { ALERTS_ACTIVE_LOCKED_FROM_REMASTERED } from '../src/alerts-active.js';
import { ROE_MODES } from '../src/phase2-security.js';
import { POWER_CONSUMERS } from '../src/phase65-power.js';
import {
  AWAY_TEAM_XP_LOCKED_FROM_REMASTERED,
  AWAY_TEAM_XP_EVENTS,
  AWAY_TEAM_XP_PLAYTEST_DEFAULTS,
  FORBIDDEN_AWAY_TEAM_XP_FIRE,
  applyAwayTeamXpOutcome,
  awayTeamXpChromeLine,
  awayTeamXpInjectMustNotGiftFire,
  awayTeamXpSnapshot,
  emptyAwayTeamXpBook,
  injectAwayTeamXpMagnitudes,
  injectAwayTeamXpPending,
  requireAwayTeamXpHelpers,
  restoreAwayTeamXpBook,
  serializeAwayTeamXpBook,
} from '../src/away-team-xp.js';

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

const srcMain = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
const srcXp = fs.readFileSync(path.join(root, 'src/away-team-xp.js'), 'utf8');
const srcAttempt = fs.readFileSync(path.join(root, 'src/boarding-attempt.js'), 'utf8');
const srcEligibility = fs.readFileSync(path.join(root, 'src/boarding-eligibility.js'), 'utf8');
const srcProbe = fs.readFileSync(path.join(root, 'scripts/behavior-probe.mjs'), 'utf8');
const srcDock = fs.readFileSync(path.join(root, 'src/dock-clear.js'), 'utf8');
const srcBoardingTest = fs.readFileSync(path.join(root, 'scripts/test-boarding-capture.mjs'), 'utf8');

assert('s30.startup-helpers', typeof emptyAwayTeamXpBook === 'function'
  && typeof awayTeamXpSnapshot === 'function'
  && typeof applyAwayTeamXpOutcome === 'function'
  && typeof injectAwayTeamXpMagnitudes === 'function'
  && typeof requireAwayTeamXpHelpers === 'function'
  && typeof awayTeamXpInjectMustNotGiftFire === 'function');

requireAwayTeamXpHelpers();
assert('s30.startup-require', true);

const emptySnap = awayTeamXpSnapshot();
assert('s30.1 tracked-named-mix', emptySnap.tracked === true
  && emptySnap.rule === 'named_mix'
  && emptySnap.tablePresent === false
  && emptySnap.magnitudesInjectable === true
  && emptySnap.inUtilityBook === false
  && emptySnap.inCombatSlots === false
  && emptySnap.total === 0
  && emptySnap.pending === 0
  && emptySnap.events.onCapture === 'award'
  && emptySnap.events.onScuttle === 'award'
  && emptySnap.events.onFail === 'retain'
  && emptySnap.events.onUnrecovered === 'lose_pending'
  && emptySnap.rule !== 'not_tracked_yet'
  && !Object.values(emptySnap).includes('not_tracked_yet'), JSON.stringify(emptySnap));

assert('s30.1 mix-locked', AWAY_TEAM_XP_EVENTS.onCapture === 'award'
  && AWAY_TEAM_XP_EVENTS.onScuttle === 'award'
  && AWAY_TEAM_XP_EVENTS.onFail === 'retain'
  && AWAY_TEAM_XP_EVENTS.onUnrecovered === 'lose_pending');

assert('s30.1 chrome-honest', awayTeamXpChromeLine().includes('tracked · named mix · total 0')
  && !awayTeamXpChromeLine().includes('Not tracked yet'));

assert('s30.1 not-in-slots-or-utility', srcXp.includes('inUtilityBook: false')
  && srcXp.includes('inCombatSlots: false')
  && !srcXp.includes('weaponSlots[')
  && !srcXp.includes('utilityBook.items'));

const capBook = emptyAwayTeamXpBook();
const boardingCap = emptyBoardingBook();
const cap = injectBoardingAttempt(boardingCap, {
  victimInstanceId: 'npc:s30-cap',
  hullRatioAtStart: 0.08,
  outcome: 'capture',
  xpBook: capBook,
}, 1000);
assert('s30.2 capture-award', cap.ok
  && cap.captured === true
  && cap.scuttled === false
  && cap.xorOk === true
  && capBook.total === AWAY_TEAM_XP_PLAYTEST_DEFAULTS.captureAward
  && cap.awayTeamXp.total === 10
  && cap.awayTeamXp.tracked === true
  && cap.applyKillStanding === false, JSON.stringify({ cap: cap.awayTeamXp, total: capBook.total }));

assert('s30.2 xor-still-capture-only', cap.captured === true && cap.scuttled !== true);

const scuttleBook = emptyAwayTeamXpBook();
const scu = injectBoardingAttempt(emptyBoardingBook(), {
  victimInstanceId: 'npc:s30-scu',
  outcome: 'scuttle',
  xpBook: scuttleBook,
}, 1000);
assert('s30.3 scuttle-award', scu.ok
  && scu.captured === false
  && scu.scuttled === true
  && scuttleBook.total === AWAY_TEAM_XP_PLAYTEST_DEFAULTS.scuttleAward
  && scu.awayTeamXp.total === 5, JSON.stringify(scu.awayTeamXp));

const failBook = emptyAwayTeamXpBook();
failBook.total = 10;
const fail = injectBoardingAttempt(emptyBoardingBook(), {
  victimInstanceId: 'npc:s30-fail',
  outcome: 'fail',
  xpBook: failBook,
}, 1000);
assert('s30.3 fail-retain', fail.ok
  && fail.captured === false
  && fail.scuttled === false
  && failBook.total === 10
  && fail.awayTeamXp.total === 10, JSON.stringify(fail.awayTeamXp));

const both = injectBoardingAttempt(emptyBoardingBook(), {
  victimInstanceId: 'npc:s30-xor',
  outcome: 'capture',
  captured: true,
  scuttled: true,
  xpBook: emptyAwayTeamXpBook(),
}, 0);
assert('s30.2 xor-violation-no-award', both.ok === false && both.reason === 'xor-violation');

const pendingBook = emptyAwayTeamXpBook();
pendingBook.total = 10;
injectAwayTeamXpPending(pendingBook, 7);
const travel = emptyBoardingBook();
issueBoardingAttempt(travel, { victimInstanceId: 'npc:s30-unrec', travelMs: 999 }, 0);
const unrecovered = cancelInFlight(travel, 5, { xpBook: pendingBook });
assert('s30.4 unrecovered-lose-pending', unrecovered.ok
  && unrecovered.captured === false
  && unrecovered.scuttled === false
  && pendingBook.total === 10
  && pendingBook.pending === 0
  && awayTeamXpSnapshot(pendingBook).loseCareerOnUnrecovered === false, JSON.stringify({
  total: pendingBook.total,
  pending: pendingBook.pending,
}));

const noPending = emptyAwayTeamXpBook();
noPending.total = 4;
applyAwayTeamXpOutcome(noPending, { unrecovered: true });
assert('s30.4 unrecovered-noop-pending', noPending.total === 4 && noPending.pending === 0);

const injectBook = emptyAwayTeamXpBook();
injectAwayTeamXpMagnitudes(injectBook, { captureAward: 3 });
const injected = injectBoardingAttempt(emptyBoardingBook(), {
  victimInstanceId: 'npc:s30-inject',
  outcome: 'capture',
  xpBook: injectBook,
}, 0);
assert('s30.5 inject-changes-snapshot', injectBook.total === 3
  && injected.awayTeamXp.captureAward === 3
  && injected.awayTeamXp.total === 3, JSON.stringify(injected.awayTeamXp));

const omitBook = emptyAwayTeamXpBook();
applyAwayTeamXpOutcome(omitBook, { outcome: 'capture' });
assert('s30.5 omit-inject-default', omitBook.total === 10
  && awayTeamXpSnapshot(omitBook).captureAward === 10);

assert('s30.5 remastered-lock-false', AWAY_TEAM_XP_LOCKED_FROM_REMASTERED === false
  && SLOT_LOCK === false
  && PHASE92_LOCK === false
  && PHASE93_LOCK === false
  && PHASE94_LOCK === false
  && BOARDING_LOCK === false
  && PHASE10_LOCK === false
  && UTILITY_LOCKED_FROM_REMASTERED === false
  && LEDGER_LOCKED_FROM_REMASTERED === false
  && EMPTY_ARMABLE_LOCKED_FROM_REMASTERED === false
  && CONSTRUCTION_LOCKED_FROM_REMASTERED === false
  && HTML_CATALOG_LOCKED_FROM_REMASTERED === false
  && ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED === false
  && STANDING_TIERS_LOCKED_FROM_REMASTERED === false
  && DOCK_CLEAR_LOCKED_FROM_REMASTERED === false
  && ALERTS_ACTIVE_LOCKED_FROM_REMASTERED === false);

const above = evaluateBoardingEligibility({
  combatHull: 110,
  maxCombatHull: 1000,
});
const xpBeforeRefuse = emptyAwayTeamXpBook();
xpBeforeRefuse.total = 10;
assert('s30.6 hull-11-refuses', above.ok === false && above.ratio > HULL_BOARDING_THRESHOLD);
assert('s30.6 xp-does-not-light-board', evaluateBoardingEligibility({
  combatHull: 110,
  maxCombatHull: 1000,
}).ok === false && xpBeforeRefuse.total === 10);
assert('s30.6 tractor-not-board', tractorIsBoarding() === false);
assert('s30.6 ghost-refuse', evaluateBoardingEligibility({
  combatHull: 50,
  maxCombatHull: 1000,
  ghost: true,
}).ok === false);

const fire = awayTeamXpInjectMustNotGiftFire({
  firingSolution: true,
  engagement_authorized: true,
  cultureFire: true,
});
const awarded = applyAwayTeamXpOutcome(emptyAwayTeamXpBook(), { outcome: 'capture' });
assert('s30.7 no-gifted-fire', fire.firingSolutionPresent === false
  && fire.engagementAuthorizedPresent === false
  && fire.cultureFire === false
  && fire.tractorIsBoard === false
  && fire.twoModeRoe.join(',') === 'return-fire,defend'
  && ROE_MODES.length === 2
  && awarded.engagement_authorized === undefined
  && awarded.firingSolution === undefined
  && awarded.applyKillStanding === false
  && !Object.prototype.hasOwnProperty.call(fire.row, 'firingSolution')
  && !Object.prototype.hasOwnProperty.call(fire.row, FORBIDDEN_AWAY_TEAM_XP_FIRE), JSON.stringify(fire));

const utility = emptyUtilityBook();
const slots = [null, null, null];
assert('s30.7 utility-and-slots-untouched', Array.isArray(utility.facility_pass)
  && utility.facility_pass.length === 0
  && JSON.stringify(slots) === '[null,null,null]');

const persist = emptyAwayTeamXpBook();
applyAwayTeamXpOutcome(persist, { outcome: 'capture' });
const savedXp = serializeAwayTeamXpBook(persist);
const restoredXp = restoreAwayTeamXpBook(savedXp);
assert('s30.8 persist-total', restoredXp.total === 10 && restoredXp.tracked === true && restoredXp.rule === 'named_mix');
const oldSave = restoreAwayTeamXpBook({ tracked: false, rule: 'not_tracked_yet' });
assert('s30.8 old-save-migrate', oldSave.total === 0 && oldSave.tracked === true && oldSave.rule === 'named_mix');
const resetBook = emptyAwayTeamXpBook();
assert('s30.8 reset-zero', resetBook.total === 0);
const boardingSaved = serializeBoardingBook(emptyBoardingBook(), persist);
const boardingRestored = restoreBoardingBook(boardingSaved, persist);
assert('s30.8 mirror-not-systemstates', boardingRestored.awayTeamXp.tracked === true
  && boardingRestored.awayTeamXp.rule === 'named_mix'
  && boardingRestored.awayTeamXp.total === 10
  && !Object.prototype.hasOwnProperty.call(boardingSaved, 'systemStates'));

assert('s30.8 landed-lanes-preserved', srcMain.includes('awayTeamXp: createAwayTeamXpProbeApi()')
  && srcMain.includes('awayTeamXpBook: serializeAwayTeamXpBook(')
  && srcMain.includes('state.awayTeamXpBook = restoreAwayTeamXpBook')
  && srcAttempt.includes('applyAwayTeamXpOutcome')
  && srcEligibility.includes("rule: 'named_mix'")
  && srcEligibility.includes('HULL_BOARDING_THRESHOLD = 0.10')
  && srcProbe.includes('S17.1 hull-above-refuses')
  && srcProbe.includes('S17.5 tractor-is-board-false')
  && srcBoardingTest.includes("xp.rule === 'named_mix'")
  && srcBoardingTest.includes('xp.tracked === true')
  && srcDock.includes('DOCK_CLEAR_LOCKED_FROM_REMASTERED = false')
  && !srcXp.includes('function evaluateBoardingEligibility')
  && !srcXp.includes('function tractorIsBoarding')
  && !srcXp.includes('function destroyNpcShip')
  && !srcXp.includes('git am')
  && !/from ['"][^'"]*remastered/i.test(srcXp)
  && BOARDING_IMPLEMENTED === true
  && EW_BOARDING === true
  && tractorIsBoarding() === false
  && POWER_CONSUMERS.includes('ew')
  && ROE_MODES.length === 2);

assert('s30.9 s17.4-amended-not-deleted', srcBoardingTest.includes('s17.4-xp-explicit')
  && srcBoardingTest.includes("rule === 'named_mix'")
  && !srcBoardingTest.includes("rule === 'not_tracked_yet'")
  && srcProbe.includes('S17.4 xp-tracked-named-mix'));

assert('s30.10 chrome-copy', srcMain.includes('awayTeamXpChromeLine')
  && !srcMain.includes('Not tracked yet')
  && awayTeamXpChromeLine(persist).includes('total 10'));

if (failed) {
  console.error(`Away-team XP offline probes: ${passed} passed, ${failed} failed`);
  for (const rowId of failures) console.error(`  FAIL ${rowId}`);
  process.exit(1);
}
console.log(`Away-team XP offline probes: ${passed} passed, ${failed} failed`);
