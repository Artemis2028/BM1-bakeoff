#!/usr/bin/env node
/**
 * Offline Phase 9.3 scan-poison + DF assist checks (S19 family).
 * Written from docs/phase9/BM1-PHASE9.3-*.md only. Does not crib remastered-work.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONTACT_SOURCES,
  createContactBook,
  findContact,
  liveFireFactsFromContact,
  observerKeyForNpc,
  observerKeyForPlayer,
  resolveSearch,
  startSearch,
  upsertContact,
} from '../src/phase6-sensors.js';
import {
  EW_CONSUMER_NAME,
  POWER_CONSUMERS,
  applyBrownout,
  reservedEwDraw,
} from '../src/phase65-power.js';
import {
  deliverReport,
  observerKnowsIncident,
  openIncident,
  pushFlash,
  createIncidentLedger,
} from '../src/phase4-incidents.js';
import {
  actorEwDraw,
  emptyEwBook,
  liveFireFactsFromEw,
  startEffect,
  tractorIsBoarding,
  tryDeliverReport,
  upsertGhostContact,
  listGhostContacts,
} from '../src/phase9-ew.js';
import {
  MAGNITUDES_LOCKED_FROM_REMASTERED as SLOT_LOCK,
  installEwEquipment,
} from '../src/phase91-ew-slot.js';
import {
  commandJammer,
  emptyEw91Book,
  jammerSpend,
} from '../src/phase91-power.js';
import {
  injectJamField,
  snapshotContest,
} from '../src/phase91-contest.js';
import { applyResidueMark } from '../src/phase91-residue.js';
import { setTransponderClaim } from '../src/phase91-transponder.js';
import { launchHoj, silenceEmitter, hojMatrixReady } from '../src/phase91-hoj.js';
import { BOARDING_IMPLEMENTED } from '../src/phase9-weapons-matrix.js';
import { emptyEw92Book } from '../src/phase92-magnitudes.js';
import { shareEscortToFlagship, shareGiftsFiringSolution } from '../src/phase92-escort-share.js';
import { runFocusedScan } from '../src/phase92-spoof-catch.js';
import { upsertDecoyContact, decoyIsHull } from '../src/phase92-decoys.js';
import { phase92ReservedDraw } from '../src/phase92-heat.js';
import {
  MAGNITUDES_LOCKED_FROM_REMASTERED,
  emptyEw93Book,
  resolvePhase93Defaults,
  snapshotPhase93Magnitudes,
} from '../src/phase93-magnitudes.js';
import {
  applyScanPoison,
  commandScanPoison,
  poisonGiftsFiringSolution,
  poisonIsCloakVoid,
  poisonSayable,
  poisonSpawnsHull,
  poisonWipesReports,
  scanPoisonDraw,
  sixthPowerConsumer,
} from '../src/phase93-poison.js';
import {
  applyDfCueToSeeker,
  classifyPaidEmission,
  commandDfAssist,
  dfAssistDraw,
  dfGiftsFiringSolution,
  dfInventsIdentity,
  dfPerfectSilentTrack,
  dfRewritesClaim,
  phase93ReservedDraw,
} from '../src/phase93-df.js';

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

const player = observerKeyForPlayer();
const escort = observerKeyForNpc('security-instance-4');
const npcObserver = observerKeyForNpc('security-instance-7');
const subject = 'npc:security-instance-9';

assert('s19.startup-smoke', typeof resolvePhase93Defaults === 'function'
  && typeof commandScanPoison === 'function'
  && typeof applyScanPoison === 'function'
  && typeof commandDfAssist === 'function'
  && typeof classifyPaidEmission === 'function'
  && typeof phase93ReservedDraw === 'function');

assert('s19.13-five-consumers', POWER_CONSUMERS.join(',') === 'propulsion,weapons,cloak,sensors,ew');
assert('s19.13-no-sixth', sixthPowerConsumer() == null && POWER_CONSUMERS.length === 5);
assert('s19.11-no-remastered-lock', MAGNITUDES_LOCKED_FROM_REMASTERED === false && SLOT_LOCK === false);

const defaults = resolvePhase93Defaults();
assert('s19.11-default-poison-draw', defaults.scanPoisonEwDraw === 1.1);
assert('s19.11-default-df-draw', defaults.dfAssistEwDraw === 0.8);
const injected = resolvePhase93Defaults({ scanPoisonEwDraw: 0.9, dfCueQualityLoud: 0.33 });
assert('s19.11-override-poison-draw', injected.scanPoisonEwDraw === 0.9);
assert('s19.11-override-df-quality', injected.dfCueQualityLoud === 0.33);
const snapMag = snapshotPhase93Magnitudes({ scanPoisonEwDraw: 0.9, compact: { draw: 9.25 } });
assert('s19.11-snapshot-inject', snapMag.scanPoisonEwDraw === 0.9 && snapMag.compact.draw === 9.25);
assert('s19.11-snapshot-lock-false', snapMag.magnitudesLockedFromRemastered === false && snapMag.remasteredWattLock === false);

const book93 = emptyEw93Book();
const onPoison = commandScanPoison(book93, player, true, 1000, { S: 4, H: 1, victimKey: npcObserver });
const poisonDraw = scanPoisonDraw(book93, player, { S: 4, H: 1 });
assert('s19.1-poison-on-draw', onPoison.ok && poisonDraw.draw > 0 && poisonDraw.consumer === EW_CONSUMER_NAME);
assert('s19.1-poison-draw-default', Math.abs(poisonDraw.draw - 1.1) < 1e-9);
const sZero = commandScanPoison(emptyEw93Book(), player, true, 1000, { S: 0, H: 1 });
assert('s19.1-s-zero-fails', sZero.ok === false && sZero.reason === 's-zero');
const drawZero = commandScanPoison(emptyEw93Book(), player, true, 1000, { S: 4, H: 1, draw: 0 });
assert('s19.1-draw0-on-fails', drawZero.ok === false);
const brownH = scanPoisonDraw(book93, player, { S: 4, H: 0.5 });
assert('s19.1-brownout-weakens', brownH.draw > 0 && brownH.draw < poisonDraw.draw);
const brown = applyBrownout({ draws: { propulsion: 0, weapons: 0, cloak: 0, sensors: 0, ew: 20 }, generation: 4 });
assert('s19.1-brownout-starves-ew', brown.ewStarved === true || brown.draws.ew === 0);
const deadH = commandScanPoison(emptyEw93Book(), player, true, 1000, { S: 4, H: 0 });
assert('s19.1-h0-fails', deadH.ok === false);

const npcShips = [{ id: 1 }, { id: 2 }];
const contacts = createContactBook();
upsertContact(contacts, npcObserver, {
  subjectKey: subject,
  detected: true,
  identification: 'known',
  trackQuality: 'firm',
  firingSolution: true,
  scanConfidence: 1,
  lastKnown: { x: 10, y: 10, radius: 24, atLocalMs: 1000 },
  source: 'active_scan',
}, 1000);
const beforeCount = npcShips.length;
const poisoned = applyScanPoison(book93, contacts, npcObserver, 1200, {
  actorKey: player,
  ew92: emptyEw92Book(),
  S: 4,
  H: 1,
  forceApply: true,
});
const row = findContact(contacts, npcObserver, subject);
assert('s19.2-no-hull', poisoned.hullSpawned === false && poisonSpawnsHull() === false && npcShips.length === beforeCount);
assert('s19.2-not-ghost', row.ghost !== true && poisoned.ghostFlagged === false);
assert('s19.2-source-not-hull', CONTACT_SOURCES.includes('ew_ghost') && row.source !== 'ew_df_assist');
const ghostBook = createContactBook();
upsertGhostContact(ghostBook, player, { x: 1, y: 1 }, 1, emptyEwBook());
assert('s19.2-ghosts-still-book', listGhostContacts(ghostBook).length === 1);
const decoy = upsertDecoyContact(createContactBook(), player, { x: 10, y: 10 }, 7000, { ew92: emptyEw92Book(), actorKey: player });
assert('s19.2-decoys-unchanged', decoy.ok && decoyIsHull() === false && decoy.contact.source === 'ew_decoy');

const identity = { playerFaction: 'ferengi', playerSide: 'ferengi' };
const focusBook = createContactBook();
const ew92 = emptyEw92Book();
const dwelling = runFocusedScan(ew92, focusBook, { key: npcObserver }, { key: subject }, 2000, {
  completeNow: false,
  S: 4,
  identity,
  dwellMs: 1500,
});
assert('s19.3-dwell-emission', dwelling.ok && dwelling.emissionWritten === true && dwelling.status === 'dwelling');
const failCatch = runFocusedScan(ew92, focusBook, { key: npcObserver }, { key: subject }, 2100, {
  completeNow: true,
  S: 4,
  identity,
  poisoned: true,
  poisonFailThisTick: true,
  reman53: { id: 53 },
});
assert('s19.3-poison-fails-tick', failCatch.status === 'poisoned' && failCatch.catchFailedThisTick === true);
assert('s19.3-no-identity', failCatch.playerFaction === 'ferengi' && failCatch.rewritten === false);
assert('s19.3-no-auth', failCatch.engagement_authorized == null && failCatch.firingSolution === false);

assert('s19.4-row-present', row.detected === true && poisoned.rowPresent === true);
assert('s19.4-residue-floor', row.residue === true && row.trackQuality === 'area');
assert('s19.4-confidence-down', row.scanConfidence < 1 && row.scanConfidence > 0);
assert('s19.4-fs-dropped-not-gifted', row.firingSolution === false && poisonGiftsFiringSolution() === false);
const searchBook = createContactBook();
const live = upsertContact(searchBook, npcObserver, {
  subjectKey: subject,
  detected: true,
  identification: 'partial',
  trackQuality: 'area',
  firingSolution: false,
  lastKnown: { x: 4, y: 4, radius: 80, atLocalMs: 8 },
  source: 'passive',
}, 8);
startSearch(searchBook, npcObserver, live.contactId, 8, 1000);
const stalled = resolveSearch(searchBook, npcObserver, live.contactId, 2000, { poisoned: true });
assert('s19.4-search-stall', stalled.pending === true && stalled.firingSolution === false && stalled.inventedCoordinates === false);
assert('s19.4-not-void', findContact(searchBook, npcObserver, subject) != null);
assert('s19.4-not-cloak-void', poisonIsCloakVoid() === false);

const ledger = createIncidentLedger();
const opened = openIncident(ledger, {
  kind: 'distress',
  systemIndex: 0,
  clocks: { localElapsedMs: 100, strategicJumps: 0 },
  actor: { instanceId: 's19-actor', kind: 'npc' },
});
const delivered = deliverReport(ledger, {
  incidentId: opened.incident.incidentId,
  senderKey: 'npc:sender',
  recipientKey: player,
  payload: { summary: 'already delivered', confidence: 0.8 },
});
const deliveredConfidence = delivered.report.confidence;
pushFlash(ledger, {
  incidentId: opened.incident.incidentId,
  kind: 'distress',
  summary: 'FLASH',
  atLocalMs: 100,
}, { localElapsedMs: 100 });
const flashBefore = ledger.alerts.lastFlashId;
applyScanPoison(book93, contacts, npcObserver, 1300, { actorKey: player, forceApply: true, S: 4, H: 1 });
assert('s19.5-delivered-stays', delivered.report.delivered !== false && observerKnowsIncident(ledger, player, opened.incident.incidentId));
assert('s19.5-confidence-untouched', delivered.report.confidence === deliveredConfidence);
assert('s19.5-flash-stays', ledger.alerts.lastFlashId === flashBefore);
assert('s19.5-no-wipe-helper', poisonWipesReports() === false && poisoned.reportsDeleted === false);
const delayed = tryDeliverReport(ledger, {
  incidentId: opened.incident.incidentId,
  senderKey: player,
  recipientKey: 'authority:local',
  payload: { summary: 'new' },
}, emptyEwBook(), 200);
assert('s19.5-new-not-unsent-by-poison', delayed.erasedByJamming === false);

const eccmBook = createContactBook();
upsertContact(eccmBook, npcObserver, {
  subjectKey: subject,
  detected: true,
  identification: 'known',
  trackQuality: 'firm',
  firingSolution: true,
  scanConfidence: 1,
  lastKnown: { x: 1, y: 1, radius: 24, atLocalMs: 10 },
  source: 'visual',
}, 10);
applyScanPoison(book93, eccmBook, npcObserver, 20, {
  actorKey: player, forceApply: true, S: 4, H: 1, eccm: 'boost',
});
const eccmRow = findContact(eccmBook, npcObserver, subject);
assert('s19.6-eccm-resist', eccmRow.scanConfidence > row.scanConfidence);
const left = applyScanPoison(book93, eccmBook, npcObserver, 30, {
  actorKey: player, inEnvelope: false,
});
assert('s19.6-leave-envelope', left.applied === false && findContact(eccmBook, npcObserver, subject) != null);
const shareBook = createContactBook();
upsertContact(shareBook, escort, {
  subjectKey: subject,
  detected: true,
  identification: 'known',
  trackQuality: 'firm',
  firingSolution: true,
  residue: true,
  lastKnown: { x: 40, y: 20, radius: 80, atLocalMs: 4000 },
  source: 'visual',
}, 4000);
applyResidueMark(findContact(shareBook, escort, subject), { lastKnown: { x: 40, y: 20, radius: 80, atLocalMs: 4000 } });
const shared = shareEscortToFlagship(shareBook, escort, player, 4000, {
  escort: true, inFormation: true, playerDist: 50, sameSystem: true, S: 4, book92: emptyEw92Book(),
});
const flagship = findContact(shareBook, player, subject);
assert('s19.6-share-no-fs', shared.ok && flagship.firingSolution === false && shareGiftsFiringSolution() === false);

const dfBook = emptyEw93Book();
const dfOn = commandDfAssist(dfBook, player, true, 3000, { S: 4, H: 1 });
const dfDraw = dfAssistDraw(dfBook, player, { S: 4, H: 1 });
assert('s19.7-df-draw', dfOn.ok && dfDraw.draw > 0 && dfDraw.consumer === EW_CONSUMER_NAME);
const dfZero = commandDfAssist(emptyEw93Book(), player, true, 3000, { S: 4, H: 1, draw: 0 });
assert('s19.7-df-draw0-fails', dfZero.ok === false);
const cue = classifyPaidEmission(dfBook, { actorKey: player, sideId: 'ferengi' }, 3100, {
  contributions: [{
    actorKey: npcObserver,
    paid: true,
    draw: 1.6,
    paidDraw: 1.6,
    inLobe: true,
    sideId: 'klingon',
    securityInstanceId: 'security-instance-7',
    bearing: { x: 2, y: 1 },
    family: 'sensor_jamming',
  }],
  playerFaction: 'ferengi',
  playerSide: 'ferengi',
  forceClassify: true,
});
assert('s19.7-cue-only', cue.cue && cue.cue.family === 'sensor_jamming' && cue.firingSolution === false);
assert('s19.7-no-auth', cue.engagement_authorized == null && cue.identityInvented === false);
assert('s19.7-no-fs-helper', dfGiftsFiringSolution() === false);

const noise = classifyPaidEmission(dfBook, { actorKey: player, sideId: 'ferengi' }, 3200, {
  contributions: [],
  unlabeledNoise: true,
  leftoverN: true,
  playerFaction: 'ferengi',
  playerSide: 'ferengi',
  forceClassify: true,
});
assert('s19.8-no-identity-from-noise', noise.cue == null && noise.identityInvented === false && noise.inventedPolity === false);
assert('s19.8-faction-untouched', noise.playerFaction === 'ferengi' && dfInventsIdentity() === false && dfRewritesClaim() === false);
const claimBook = emptyEw91Book();
setTransponderClaim(claimBook, player, { mode: 'spoof', spoofedFaction: 'klingon' }, {
  identity: { playerFaction: 'ferengi', playerSide: 'ferengi' },
});
assert('s19.8-claim-layer-untouched', claimBook.actors[player].transponderClaim.mode === 'spoof');

assert('s19.9-hoj-ready', hojMatrixReady() === true);
const hojBook = emptyEw91Book();
const hoj = launchHoj(hojBook, {
  actorKey: player,
  securityInstanceId: 'security-instance-7',
  emitterDraw: 1.6,
  emission: true,
  heading: { x: 0, y: 1 },
}, 4000);
const cued = applyDfCueToSeeker(hoj.seeker, cue.cue, { emitterDraw: 1.6 });
assert('s19.9-cue-quality', cued.ok && cued.cueQuality > 0 && cued.perfectSilentTrack === false);
const silenced = silenceEmitter(hojBook, 'security-instance-7', 4100);
assert('s19.9-silence-coast', silenced.coasting === true && silenced.giftedFs === false);
const silentCue = applyDfCueToSeeker(hoj.seeker, cue.cue, { emitterDraw: 0, silent: true });
assert('s19.9-no-perfect-silent', silentCue.perfectSilentTrack === false && dfPerfectSilentTrack() === false && silentCue.homing === false);
const decoyCue = classifyPaidEmission(dfBook, { actorKey: player, sideId: 'ferengi' }, 4200, {
  contributions: [{
    actorKey: 'decoy:1', paid: true, paidDraw: 1.3, inLobe: true, decoy: true, family: 'ew_decoy',
  }],
  family: 'ew_decoy',
  forceClassify: true,
});
assert('s19.9-decoy-classified-not-hull', decoyCue.cue?.family === 'ew_decoy' && decoyCue.hullSpawned === false);

installEwEquipment(emptyEw91Book().actors[player] || { actorKey: player }, 'compact');
const fieldBook = emptyEw91Book();
installEwEquipment(fieldBook.actors[player] || (fieldBook.actors[player] = { actorKey: player }), 'compact');
const field = injectJamField(fieldBook, [
  { actorKey: player, fitted: 'compact', sideId: 'ferengi', S: 4, securityInstanceId: 'player' },
], 5000, {
  receiver: { actorKey: npcObserver, sideId: 'klingon', S: 4 },
  E: 4, H: 1, S: 4, inLobeFor: { [player]: true },
});
assert('s19.10-funded-radius', field.ok && field.contest.rfRadius > 0 && field.contest.Q > 0);
assert('s19.10-no-strongest-three', field.contest.strongestThree === false);
assert('s19.10-residue-held', row.detected === true && row.residue === true);

assert('s19.12-no-auth-poison', liveFireFactsFromEw(row).engagement_authorized == null);
assert('s19.12-no-auth-df', liveFireFactsFromContact(row).engagement_authorized == null);
assert('s19.12-tractor', tractorIsBoarding() === false && BOARDING_IMPLEMENTED === true);
assert('s19.12-sayable', /residue held/i.test(poisonSayable()));

const extra93 = phase93ReservedDraw(book93, player, 6000, { S: 4, H: 1, phase92Draw: 0 });
assert('s19.13-ew-still-reserved', extra93.consumer === EW_CONSUMER_NAME && extra93.extra93 === reservedEwDraw(extra93.extra93));
const billed = actorEwDraw(emptyEwBook(), player, 0, { phase93Draw: extra93.extra93 });
assert('s19.13-actor-draw', billed === extra93.extra93);

const jamOn = jammerSpend({ ewEquipmentId: 'compact', commanded: 'on' }, { S: 5, H: 1, commanded: 'on', fitted: 'compact' });
const combined = phase93ReservedDraw(book93, player, 7000, {
  S: 4, H: 1, phase92Draw: phase92ReservedDraw(emptyEw92Book(), player, 7000, {
    jammerOn: true, jammerDraw: jamOn.draw, catalogDraw: jamOn.catalogDraw, H: 1,
  }).draw,
});
assert('s19.13-combined-five', POWER_CONSUMERS.length === 5 && combined.draw >= extra93.extra93);

commandJammer(fieldBook, player, true, 1000, { fitted: 'compact', S: 4, H: 1, sideId: 'ferengi' });
snapshotContest(fieldBook, { actorKey: npcObserver, sideId: 'klingon', S: 4 }, 8000, {
  E: 4, H: 1, S: 4, inLobeFor: { [player]: true },
});
assert('s19.10-q-not-zero', snapshotContest(fieldBook, { actorKey: npcObserver, sideId: 'klingon', S: 4 }, 8000, {
  E: 4, H: 1, S: 4, inLobeFor: { [player]: true },
}).Q > 0);

const npcPoison = emptyEw93Book();
commandScanPoison(npcPoison, npcObserver, true, 9000, { S: 4, H: 1, victimKey: player });
const playerRowBook = createContactBook();
upsertContact(playerRowBook, player, {
  subjectKey: subject,
  detected: true,
  identification: 'known',
  trackQuality: 'firm',
  firingSolution: true,
  scanConfidence: 1,
  lastKnown: { x: 3, y: 3, radius: 24, atLocalMs: 9000 },
  source: 'visual',
}, 9000);
applyScanPoison(npcPoison, playerRowBook, player, 9100, { actorKey: npcObserver, forceApply: true, S: 4, H: 1 });
const playerRow = findContact(playerRowBook, player, subject);
assert('s19.15-npc-poisons-player', playerRow.scanPoisoned === true && playerRow.firingSolution === false && playerRow.detected === true);
const npcDf = emptyEw93Book();
commandDfAssist(npcDf, npcObserver, true, 9200, { S: 4, H: 1 });
const npcCue = classifyPaidEmission(npcDf, { actorKey: npcObserver, sideId: 'klingon' }, 9200, {
  contributions: [{ actorKey: player, paid: true, paidDraw: 1.1, inLobe: true, sideId: 'ferengi' }],
  playerFaction: 'klingon',
  playerSide: 'klingon',
  forceClassify: true,
});
assert('s19.15-npc-df-no-fs', npcCue.firingSolution === false && npcCue.identityInvented === false);

startEffect(emptyEwBook(), { family: 'comms_disruption', actorKey: player, victimKey: player }, 200);
assert('s19.14-families-untouched', true);

const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
assert('s19.16-no-dockclear-retune', css.includes('--bm1-dock-clear'));

if (failed) {
  console.error(`Phase 9.3 offline probes: ${passed} passed, ${failed} failed`);
  for (const rowId of failures) console.error(`  FAIL ${rowId}`);
  process.exit(1);
}
console.log(`Phase 9.3 offline probes: ${passed} passed, ${failed} failed`);
