#!/usr/bin/env node
/**
 * Offline S33 captains briefing / jump-intel archive.
 * Written from docs/briefing-archive/ only. Does not crib remastered-work.
 * S18.18 stays unamended.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROE_MODES, offersProtectAll } from '../src/phase2-security.js';
import { createContactRecord } from '../src/phase6-sensors.js';
import { emptyDominionBook } from '../src/phase10-dominion-book.js';
import { collectLeakedNames } from '../src/phase10-discovery.js';
import { PHASE10_ROSTER_LOCKED_FROM_REMASTERED } from '../src/phase10-roster.js';
import { BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED } from '../src/bajoran-solar-sailor.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED } from '../src/phase10-magnitudes.js';
import { UTILITY_LOCKED_FROM_REMASTERED } from '../src/utility-inventory.js';
import { LEDGER_LOCKED_FROM_REMASTERED } from '../src/weapon-source-ledger.js';
import { EMPTY_ARMABLE_LOCKED_FROM_REMASTERED } from '../src/empty-armable.js';
import { CONSTRUCTION_LOCKED_FROM_REMASTERED } from '../src/construction-visuals.js';
import { HTML_CATALOG_LOCKED_FROM_REMASTERED } from './build-html-catalogs.mjs';
import { ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED } from '../src/economy-difficulty.js';
import { STANDING_TIERS_LOCKED_FROM_REMASTERED } from '../src/standing-tiers.js';
import { DOCK_CLEAR_LOCKED_FROM_REMASTERED } from '../src/dock-clear.js';
import { ALERTS_ACTIVE_LOCKED_FROM_REMASTERED } from '../src/alerts-active.js';
import { AWAY_TEAM_XP_LOCKED_FROM_REMASTERED } from '../src/away-team-xp.js';
import {
  BRIEFING_ARCHIVE_CAP,
  BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED,
  BRIEFING_LINE_CAP,
  GHOST_BRIEFING_COPY,
  SPOOF_SUSPICION_COPY,
  applyBriefingArchiveInject,
  briefingArchiveSnapshot,
  emptyBriefingArchive,
  listBriefingFolders,
  listCampaignBriefings,
  produceArrivalBriefing,
  requireBriefingArchiveHelpers,
  restoreBriefingArchive,
  selectBriefing,
  serializeBriefingArchive,
} from '../src/briefing-archive.js';

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

const srcArchive = fs.readFileSync(path.join(root, 'src/briefing-archive.js'), 'utf8');
const srcMain = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
const srcDock = fs.readFileSync(path.join(root, 'src/dock-clear.js'), 'utf8');
const srcPhase10Test = fs.readFileSync(path.join(root, 'scripts/test-phase10-dominion.mjs'), 'utf8');
const srcProbe = fs.readFileSync(path.join(root, 'scripts/behavior-probe.mjs'), 'utf8');
const srcHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const srcCss = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

let helpersThrew = false;
try {
  requireBriefingArchiveHelpers();
} catch {
  helpersThrew = true;
}

assert('s33.startup-helpers', helpersThrew === false
  && BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED === false
  && BRIEFING_ARCHIVE_CAP === 24
  && BRIEFING_LINE_CAP === 12
  && typeof produceArrivalBriefing === 'function'
  && typeof selectBriefing === 'function');

const forbiddenCall = [
  'consultDoctrineFire',
  'injectKnowledge',
  'injectDiscovery',
  'grantAssignmentKnowledge',
  'snapshotContest',
  'interferenceLabel(',
  'protect-all',
  'performance.now',
  'git am',
];
assert('s33.module-does-not-call-authority', forbiddenCall.every((needle) => !srcArchive.includes(needle)));

function contact(input) {
  const row = createContactRecord({
    observerKey: 'player',
    detected: true,
    trackQuality: 'area',
    firingSolution: false,
    lastKnown: { x: 4817, y: 9023, radius: 40, atLocalMs: 0 },
    ...input,
  });
  row.sideId = input.sideId || 'dominion';
  row.trueHull = input.trueHull || 'Jem Hadar Attack Ship';
  return row;
}

function bookWith(rows) {
  const contacts = {};
  for (const row of rows) contacts[row.contactId] = row;
  return { observers: { player: { contacts } }, nextContactId: rows.length + 1 };
}

function sources(extra = {}) {
  const dominion = extra.dominionBook || emptyDominionBook();
  return {
    contactBook: extra.contactBook || { observers: { player: { contacts: {} } } },
    incidentLedger: extra.incidentLedger || { observerCopies: { player: { knownIncidentIds: [] } }, incidents: {} },
    objectiveBoard: extra.objectiveBoard || { assignments: {}, objectives: {} },
    dominionBook: dominion,
    discovery: extra.discovery || dominion.discovery || {},
    storedInterference: extra.storedInterference || null,
    systemIndex: extra.systemIndex ?? 0,
    systemName: extra.systemName ?? 'Earth',
    strategicJumps: extra.strategicJumps ?? 1,
    assignmentObserver: extra.assignmentObserver || { knownAssignmentIds: [] },
  };
}

function blob(row) {
  return JSON.stringify(row);
}

const ghost = contact({
  contactId: 'ctc-ghost',
  subjectKey: 'ghost:known',
  ghost: true,
  source: 'ew_ghost',
  transponderClaim: { mode: 'spoof', spoofedFaction: 'bajoran' },
});
const spoof = contact({
  contactId: 'ctc-spoof',
  subjectKey: 'npc:spoof',
  spoofExposed: false,
  transponderClaim: { mode: 'spoof', spoofedFaction: 'bajoran' },
});
const exposed = contact({
  contactId: 'ctc-exposed',
  subjectKey: 'npc:exposed',
  spoofExposed: true,
  transponderClaim: { mode: 'spoof', spoofedFaction: 'bajoran' },
});

const dominionNone = emptyDominionBook();
const noneBefore = JSON.stringify(dominionNone);
const producedNone = produceArrivalBriefing(emptyBriefingArchive(), sources({
  contactBook: bookWith([ghost, spoof]),
  dominionBook: dominionNone,
  systemName: 'Earth',
  strategicJumps: 3,
}));
const noneLines = producedNone.briefing.lines.join('\n');
assert('s33.1 ghost-and-unexposed-spoof', noneLines.includes(GHOST_BRIEFING_COPY)
  && noneLines.includes('Transponder claim: bajoran. Claim only — not a true side, not identity.')
  && !noneLines.includes('Jem Hadar')
  && !noneLines.includes('dominion')
  && !noneLines.includes('sideId')
  && !noneLines.includes('4817')
  && !noneLines.includes('9023')
  && !/\(-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\)/.test(noneLines)
  && !noneLines.includes('No campaign knowledge')
  && !noneLines.includes('Wider Dominion')
  && !noneLines.includes('Rumor only')
  && producedNone.briefing.campaignGroup == null
  && collectLeakedNames(producedNone.briefing.lines, dominionNone.discovery, 'player').length === 0
  && JSON.stringify(dominionNone) === noneBefore);

const exposedRun = produceArrivalBriefing(emptyBriefingArchive(), sources({
  contactBook: bookWith([exposed]),
}));
assert('s33.1 exposed-spoof-is-suspicion', exposedRun.briefing.lines.includes(SPOOF_SUSPICION_COPY)
  && !exposedRun.briefing.lines.join('\n').includes('bajoran')
  && !exposedRun.briefing.lines.join('\n').includes('Jem Hadar'));

const rumorBook = emptyDominionBook({
  observers: {
    player: { observerKey: 'player', layer: 'rumor', subject: 'wider_dominion' },
  },
});
const rumor = produceArrivalBriefing(emptyBriefingArchive(), sources({
  dominionBook: rumorBook,
  contactBook: bookWith([]),
}));
assert('s33.1 stored-rumor-is-sayable', rumor.briefing.lines.includes('Rumor only. Not a firing solution, not a map.')
  && rumor.briefing.campaignGroup === 'wider_dominion'
  && !rumor.briefing.lines.join('\n').includes('Dominica'));

const hidden = produceArrivalBriefing(emptyBriefingArchive(), sources({
  systemName: 'Dominica',
  incidentLedger: {
    observerCopies: { player: { knownIncidentIds: ['inc-leak', 'inc-ok'] } },
    incidents: {
      'inc-leak': { sayable: 'Patrol saw Dominica in the Gamma Quadrant.' },
      'inc-ok': { sayable: 'Patrol missed check-in. Standing unchanged.' },
    },
  },
}));
const hiddenBlob = blob(hidden.briefing);
assert('s33.1 hidden-names-stay-out', hidden.briefing.folderLabel === 'Undiscovered destination.'
  && hidden.briefing.lines.some((line) => line.startsWith('Arrival: Undiscovered destination.'))
  && hidden.briefing.lines.includes('Patrol missed check-in. Standing unchanged.')
  && !hiddenBlob.includes('Dominica')
  && !hiddenBlob.toLowerCase().includes('gamma quadrant')
  && collectLeakedNames([hidden.briefing.folderLabel, ...hidden.briefing.lines], {}, 'player').length === 0);

const labeled = produceArrivalBriefing(emptyBriefingArchive(), sources({
  storedInterference: { source: 'friendly', usedClaim: false, inventedFaction: false },
}));
const claimed = produceArrivalBriefing(emptyBriefingArchive(), sources({
  storedInterference: { source: 'friendly', usedClaim: true, inventedFaction: false },
}));
assert('s33.1 stored-label-only', labeled.briefing.lines.some((line) => line.includes('Stored interference label: friendly'))
  && !claimed.briefing.lines.some((line) => line.includes('Stored interference label')));

const knownAssignment = produceArrivalBriefing(emptyBriefingArchive(), sources({
  assignmentObserver: { knownAssignmentIds: ['asg-9'] },
  objectiveBoard: {
    assignments: { 'asg-9': { assignmentId: 'asg-9', role: 'freighter' } },
    objectives: {
      overdue: { assignmentId: 'asg-9', kind: 'asset_overdue' },
    },
  },
}));
const unknownAssignment = produceArrivalBriefing(emptyBriefingArchive(), sources({
  assignmentObserver: { knownAssignmentIds: [] },
  objectiveBoard: {
    assignments: { 'asg-9': { assignmentId: 'asg-9', role: 'freighter' } },
    objectives: { overdue: { assignmentId: 'asg-9', kind: 'asset_overdue', truth: { attackerId: 'secret-attacker', destroyed: true } } },
  },
}));
assert('s33.1 known-assignment-only', knownAssignment.briefing.campaignGroup === 'objectives'
  && knownAssignment.briefing.lines.some((line) => line.includes('missed check-in') && line.includes('No attacker identified'))
  && !unknownAssignment.briefing.lines.some((line) => line.includes('asg-9'))
  && !unknownAssignment.briefing.lines.join('\n').includes('secret-attacker'));

const coordBoard = produceArrivalBriefing(emptyBriefingArchive(), sources({
  assignmentObserver: { knownAssignmentIds: ['asg-c'] },
  objectiveBoard: {
    assignments: { 'asg-c': { assignmentId: 'asg-c', role: 'convoy' } },
    objectives: {
      convoy: { assignmentId: 'asg-c', kind: 'convoy', sayable: 'Convoy holds at (12, 40) near the lane.' },
    },
  },
}));
assert('s33.1 no-raw-coordinates', !coordBoard.briefing.lines.join('\n').includes('(12, 40)')
  && coordBoard.briefing.lines.some((line) => line.includes('Convoy holds at')));

function authorityOf(pack) {
  return {
    roe: ROE_MODES.slice(),
    protect: offersProtectAll({}) === true,
    standing: 'open',
    pursuit: false,
    firingSolution: pack.contactBook.observers.player.contacts['ctc-ghost']?.firingSolution === true,
    engagement: Object.prototype.hasOwnProperty.call(pack.contactBook.observers.player.contacts['ctc-ghost'] || {}, 'engagement_authorized'),
    credits: 1600,
    roster: JSON.stringify(pack.dominionBook.rosterPlayable),
    scope: pack.dominionBook.scope,
    discovery: JSON.stringify(pack.dominionBook.discovery),
  };
}

const authPack = sources({
  contactBook: bookWith([ghost]),
  dominionBook: emptyDominionBook(),
});
const authBefore = authorityOf(authPack);
const authBookBefore = JSON.stringify(authPack.contactBook);
const authProduced = produceArrivalBriefing(emptyBriefingArchive(), authPack);
const authSelected = selectBriefing(authProduced.book, authProduced.id);
const authAfter = authorityOf(authPack);
assert('s33.2 no-grant', JSON.stringify(authBefore) === JSON.stringify(authAfter)
  && JSON.stringify(authPack.contactBook) === authBookBefore
  && authBefore.roe.join(',') === 'return-fire,defend'
  && authBefore.protect === false
  && authBefore.firingSolution === false
  && authBefore.engagement === false
  && authProduced.briefing.grantsFire === false
  && authSelected.grantsFire === false
  && authSelected.writesRoe === false
  && authSelected.writesStanding === false
  && authSelected.writesPursuit === false
  && authSelected.writesCredits === false
  && authSelected.writesRosterPlayable === false
  && authSelected.writesDiscovery === false);

const giftBook = emptyDominionBook();
const giftCredits = 1600;
const giftDiscovery = JSON.stringify(giftBook.discovery);
const giftPlayable = JSON.stringify(giftBook.rosterPlayable);
produceArrivalBriefing(emptyBriefingArchive(), sources({ dominionBook: giftBook }));
assert('s33.3 no-gift', giftCredits === 1600
  && giftBook.scope === 'dominion-first'
  && JSON.stringify(giftBook.rosterPlayable) === giftPlayable
  && giftBook.rosterPlayable.independent === false
  && giftBook.rosterPlayable.ferengi === false
  && giftBook.rosterPlayable.vulcan === false
  && JSON.stringify(giftBook.discovery) === giftDiscovery
  && srcPhase10Test.includes("assert('s18.18 dominion-first'")
  && srcPhase10Test.includes("emptyDominionBook().scope === 'dominion-first'"));

const many = [];
for (let n = 1; n <= 13; n += 1) {
  const id = `ctc-${String(n).padStart(2, '0')}`;
  many.push(contact({
    contactId: id,
    subjectKey: `npc:${id}`,
    ghost: false,
    spoofExposed: false,
    trueHull: '',
    sideId: 'klingon',
    transponderClaim: { mode: 'spoof', spoofedFaction: `faction-${n}` },
  }));
}
const overflow = produceArrivalBriefing(emptyBriefingArchive(), sources({
  contactBook: bookWith(many),
  strategicJumps: 4,
}));
const overflowBlob = blob(overflow.briefing);
assert('s33.4 line-cap-omits-prose', overflow.briefing.lines.length === 12
  && overflow.briefing.omittedCount === 2
  && !overflowBlob.includes('Transponder claim: faction-13')
  && !overflowBlob.includes('Transponder claim: faction-12')
  && overflow.briefing.lines.some((line) => line.includes('faction-1')));

let capped = emptyBriefingArchive();
const filedIds = [];
for (let jump = 1; jump <= 25; jump += 1) {
  const filed = produceArrivalBriefing(capped, sources({
    systemIndex: jump % 3,
    systemName: `Lane ${jump % 3}`,
    strategicJumps: jump,
  }));
  capped = filed.book;
  filedIds.push(filed.id);
}
assert('s33.4 eviction-pins-selected', Object.keys(capped.briefings).length === 24
  && capped.selectedId === 'brf-25'
  && capped.briefings['brf-1'] == null
  && capped.briefings['brf-25'] != null
  && capped.cap === 24);

const stale = produceArrivalBriefing(capped, sources({
  systemIndex: 25 % 3,
  systemName: 'Lane 1',
  strategicJumps: 25,
}));
stale.book.briefings[stale.id].lines = ['stale'];
const nextBefore = stale.book.nextBriefingId;
const countBefore = Object.keys(stale.book.briefings).length;
const refreshed = produceArrivalBriefing(stale.book, sources({
  systemIndex: 25 % 3,
  systemName: 'Lane 1',
  strategicJumps: 25,
}));
assert('s33.4 dedupe-refreshes-in-place', refreshed.deduped === true
  && refreshed.id === 'brf-25'
  && refreshed.book.nextBriefingId === nextBefore
  && Object.keys(refreshed.book.briefings).length === countBefore
  && refreshed.briefing.lines[0] !== 'stale'
  && refreshed.briefing.lines[0].startsWith('Arrival:'));

const emptyRestore = restoreBriefingArchive(undefined);
const nullRestore = restoreBriefingArchive(null);
const textRestore = restoreBriefingArchive('old-save');
assert('s33.4 old-save-empty', Object.keys(emptyRestore.briefings).length === 0
  && emptyRestore.selectedId == null
  && Object.keys(nullRestore.briefings).length === 0
  && Object.keys(textRestore.briefings).length === 0
  && emptyRestore.cap === 24
  && emptyRestore.grantsFire === false);

const tamperedRows = {};
for (let n = 1; n <= 30; n += 1) {
  tamperedRows[`brf-${n}`] = {
    id: `brf-${n}`,
    folderLabel: 'Earth',
    producedAtStrategicJumps: n,
    systemIndex: n % 4,
    lines: [`Arrival note ${n}`],
    omittedCount: 0,
    grantsFire: true,
  };
}
tamperedRows['not-an-id'] = { id: 'briefing-alpha', lines: ['nope'], producedAtStrategicJumps: 0, systemIndex: 0 };
const coerced = restoreBriefingArchive({
  grantsFire: true,
  writesRoe: true,
  writesStanding: true,
  writesPursuit: true,
  writesCredits: true,
  writesRosterPlayable: true,
  writesDiscovery: true,
  cap: 100,
  lineCap: 40,
  selectedId: 'missing',
  briefings: tamperedRows,
});
assert('s33.4 restore-coerces-and-evicts', coerced.grantsFire === false
  && coerced.writesRoe === false
  && coerced.writesStanding === false
  && coerced.writesPursuit === false
  && coerced.writesCredits === false
  && coerced.writesRosterPlayable === false
  && coerced.writesDiscovery === false
  && coerced.cap === 24
  && coerced.lineCap === 12
  && coerced.selectedId == null
  && Object.keys(coerced.briefings).length === 24
  && coerced.briefings['not-an-id'] == null
  && coerced.briefings['brf-1'] == null
  && coerced.briefings['brf-30'] != null
  && coerced.briefings['brf-30'].grantsFire === false);

const lowered = applyBriefingArchiveInject(emptyBriefingArchive(), {
  cap: 2,
  lineCap: 3,
  grantsFire: true,
  writesRoe: true,
});
assert('s33.4 inject-lowers-only', lowered.cap === 2
  && lowered.lineCap === 3
  && lowered.grantsFire === false
  && lowered.writesRoe === false);
const raised = applyBriefingArchiveInject(lowered, { cap: 24, lineCap: 12, grantsFire: true });
assert('s33.4 inject-cannot-raise', raised.cap === 2 && raised.lineCap === 3 && raised.grantsFire === false);

let pinBook = emptyBriefingArchive();
for (let jump = 1; jump <= 3; jump += 1) {
  pinBook = produceArrivalBriefing(pinBook, sources({
    systemIndex: jump,
    systemName: `Pin ${jump}`,
    strategicJumps: 1,
  })).book;
}
pinBook = applyBriefingArchiveInject(pinBook, { cap: 2 });
assert('s33.4 same-jump-evicts-oldest-id', Object.keys(pinBook.briefings).length === 2
  && pinBook.briefings['brf-1'] == null
  && pinBook.selectedId === 'brf-3'
  && pinBook.briefings['brf-3'] != null);

const frozenFirst = produceArrivalBriefing(emptyBriefingArchive(), sources({
  contactBook: bookWith([ghost]),
  strategicJumps: 1,
  systemName: 'Earth',
}));
const frozenLines = frozenFirst.briefing.lines.slice();
const frozenSecond = produceArrivalBriefing(frozenFirst.book, sources({
  contactBook: bookWith([]),
  strategicJumps: 2,
  systemName: 'Vulcan',
}));
const reopened = selectBriefing(frozenSecond.book, frozenFirst.id);
assert('s33.4 frozen-snapshot', JSON.stringify(reopened.briefings[frozenFirst.id].lines) === JSON.stringify(frozenLines)
  && reopened.briefings[frozenFirst.id].lines.includes(GHOST_BRIEFING_COPY)
  && reopened.selectedId === frozenFirst.id
  && !reopened.briefings[frozenSecond.id].lines.includes(GHOST_BRIEFING_COPY));

let folders = emptyBriefingArchive();
const folderIds = [];
for (const row of [
  { systemIndex: 0, systemName: 'Earth', strategicJumps: 5 },
  { systemIndex: 2, systemName: 'Andoria', strategicJumps: 9 },
  { systemIndex: 1, systemName: 'Vulcan', strategicJumps: 4 },
]) {
  const filed = produceArrivalBriefing(folders, sources(row));
  folders = filed.book;
  folderIds.push(filed.id);
}
let order = listBriefingFolders(folders).map((folder) => folder.folderKey);
assert('s33.8 selected-folder-first', order[0] === 'system:1'
  && order[1] === 'system:2'
  && order[2] === 'system:0'
  && folders.briefings[folderIds[2]].campaignGroup == null);
folders = selectBriefing(folders, folderIds[0]);
order = listBriefingFolders(folders).map((folder) => folder.folderKey);
const campaign = listCampaignBriefings(folders, 'objectives');
assert('s33.8 campaign-is-not-a-second-row', order[0] === 'system:0'
  && new Set(Object.keys(folders.briefings)).size === 3
  && campaign.length === 0
  && listCampaignBriefings(rumor.book, 'wider_dominion').map((row) => row.id).join(',') === rumor.id);

const snap = briefingArchiveSnapshot(emptyBriefingArchive());
assert('s33.7 lock-and-snapshot', snap.lockedFromRemastered === false
  && snap.cap === 24
  && snap.lineCap === 12
  && snap.count === 0
  && snap.selectedId == null
  && snap.grantsFire === false
  && snap.writesRoe === false
  && snap.writesStanding === false
  && snap.writesPursuit === false
  && snap.writesCredits === false
  && snap.writesRosterPlayable === false
  && snap.writesDiscovery === false
  && snap.saveSlotCount === 3
  && snap.roeModes.join(',') === 'return-fire,defend'
  && snap.protectAllOffered === false
  && BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED === false
  && BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED === false
  && PHASE10_ROSTER_LOCKED_FROM_REMASTERED === false
  && MAGNITUDES_LOCKED_FROM_REMASTERED === false
  && UTILITY_LOCKED_FROM_REMASTERED === false
  && LEDGER_LOCKED_FROM_REMASTERED === false
  && EMPTY_ARMABLE_LOCKED_FROM_REMASTERED === false
  && CONSTRUCTION_LOCKED_FROM_REMASTERED === false
  && HTML_CATALOG_LOCKED_FROM_REMASTERED === false
  && ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED === false
  && STANDING_TIERS_LOCKED_FROM_REMASTERED === false
  && DOCK_CLEAR_LOCKED_FROM_REMASTERED === false
  && ALERTS_ACTIVE_LOCKED_FROM_REMASTERED === false
  && AWAY_TEAM_XP_LOCKED_FROM_REMASTERED === false);

const serialized = serializeBriefingArchive(frozenSecond.book);
assert('s33.4 serialize-roundtrip', serialized.briefings[frozenFirst.id].lines.includes(GHOST_BRIEFING_COPY)
  && serialized.grantsFire === false
  && !Object.prototype.hasOwnProperty.call(serialized, 'systemStates')
  && restoreBriefingArchive(serialized).briefings[frozenFirst.id].lines.includes(GHOST_BRIEFING_COPY));

assert('s33.6 wire', srcMain.includes("from './briefing-archive.js'")
  && srcMain.includes('briefingArchive: emptyBriefingArchive()')
  && srcMain.includes('briefingArchive: serializeBriefingArchive(ensureBriefingArchive())')
  && srcMain.includes('state.briefingArchive = restoreBriefingArchive(s.briefingArchive')
  && (srcMain.match(/state\.briefingArchive = emptyBriefingArchive\(\)/g) || []).length === 4
  && (srcMain.match(/briefingArchive: createBriefingArchiveProbeApi\(\)/g) || []).length === 2
  && srcMain.includes('const SAVE_SLOT_COUNT = 3')
  && srcMain.includes('return Number(slot) === 1 ? localStorage.getItem(LEGACY_SAVE_KEY) : null')
  && srcMain.includes('fileArrivalBriefing()')
  && srcHtml.includes('id="briefing-archive"')
  && srcCss.includes('.briefing-archive')
  && srcCss.includes('overflow-wrap: break-word')
  && !srcCss.slice(srcCss.indexOf('.briefing-archive {'), srcCss.indexOf('.phase10-readout .p10-k')).includes('ellipsis')
  && !srcCss.slice(srcCss.indexOf('.briefing-archive {'), srcCss.indexOf('.phase10-readout .p10-k')).includes('nowrap')
  && !srcDock.includes('briefing-archive')
  && !srcDock.includes('briefingArchive')
  && srcProbe.includes('S33.1 knowledge-only')
  && srcProbe.includes('S33.2 no-grant')
  && !srcArchive.includes('git am'));

const leakedRestore = restoreBriefingArchive({
  selectedId: 'brf-1',
  briefings: {
    'brf-1': {
      id: 'brf-1',
      folderLabel: 'Dominica',
      systemIndex: 4,
      producedAtStrategicJumps: 2,
      lines: ['Arrival: Dominica. Jump 2.', 'Patrol missed check-in.'],
      omittedCount: 0,
    },
  },
}, { discovery: {} });
assert('s33.1 restore-drops-leaks', leakedRestore.briefings['brf-1'].folderLabel === 'Undiscovered destination.'
  && !blob(leakedRestore).includes('Dominica')
  && leakedRestore.briefings['brf-1'].lines.includes('Patrol missed check-in.'));

console.log(`Briefing archive offline: ${passed} passed, ${failed} failed`);
if (failed) {
  console.error(failures.join('\n'));
  process.exit(1);
}
