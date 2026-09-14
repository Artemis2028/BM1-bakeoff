#!/usr/bin/env node
/**
 * Offline Phase 9.2 EW depth checks (S16 family).
 * Written from docs/phase9/BM1-PHASE9.2-*.md only. Does not crib remastered-work.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONTACT_SOURCES,
  createContactBook,
  findContact,
  liveFireFactsFromContact,
  observerHasFiringSolution,
  observerKeyForNpc,
  observerKeyForPlayer,
  shareFormationDetection,
  upsertContact,
} from '../src/phase6-sensors.js';
import {
  EW_CONSUMER_NAME,
  POWER_CONSUMERS,
  applyBrownout,
  consumerDraws,
  reservedEwDraw,
} from '../src/phase65-power.js';
import {
  COMMS_FAILURES_IMPLEMENTED,
  createFleetOrderBoard,
  findOrderForShip,
  issueOrder,
} from '../src/phase7-fleet.js';
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
  startEffect,
  tryDeliverReport,
  upsertGhostContact,
  listGhostContacts,
  liveFireFactsFromEw,
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
import { setTransponderClaim, silentIsCloak } from '../src/phase91-transponder.js';
import { launchHoj, hojMatrixReady } from '../src/phase91-hoj.js';
import { BOARDING_IMPLEMENTED } from '../src/phase9-weapons-matrix.js';
import {
  MAGNITUDES_LOCKED_FROM_REMASTERED,
  emptyEw92Book,
  resolvePhase92Defaults,
  snapshotPhase92Magnitudes,
} from '../src/phase92-magnitudes.js';
import {
  angularDistanceDeg,
  applyLobeMask,
  bearingDeg,
  inLobe,
  lobesAreCloak,
} from '../src/phase92-lobes.js';
import { shareEscortToFlagship, shareGiftsFiringSolution } from '../src/phase92-escort-share.js';
import { catchAutoFires, catchRewritesPhase1Identity, runFocusedScan } from '../src/phase92-spoof-catch.js';
import {
  EW_COMMS_DELAY_IMPLEMENTED,
  commsDelayUnsendsReports,
  issueOrderWithEwComms,
} from '../src/phase92-comms.js';
import { commandHeatSuppress, heatSuppressDraw, phase92ReservedDraw } from '../src/phase92-heat.js';
import {
  decoyIsHull,
  isDecoyContact,
  listDecoyContacts,
  tryDestroyDecoy,
  upsertDecoyContact,
} from '../src/phase92-decoys.js';
import {
  commandSilentRunning,
  silentRunningDraw,
  silentRunningIsCloak,
} from '../src/phase92-silent.js';

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
const subject = 'npc:security-instance-9';

assert('s16.startup-smoke', typeof resolvePhase92Defaults === 'function'
  && typeof inLobe === 'function'
  && typeof shareEscortToFlagship === 'function'
  && typeof runFocusedScan === 'function'
  && typeof issueOrderWithEwComms === 'function'
  && typeof commandHeatSuppress === 'function'
  && typeof upsertDecoyContact === 'function'
  && typeof commandSilentRunning === 'function');

assert('s16.18-five-consumers', POWER_CONSUMERS.join(',') === 'propulsion,weapons,cloak,sensors,ew');
assert('s16.14-no-remastered-lock', MAGNITUDES_LOCKED_FROM_REMASTERED === false && SLOT_LOCK === false);
assert('s16.8-stub-p7-flag', COMMS_FAILURES_IMPLEMENTED === false && EW_COMMS_DELAY_IMPLEMENTED === true);

const defaults = resolvePhase92Defaults();
assert('s16.14-default-alpha', defaults.lobeHalfAngleDeg === 50);
assert('s16.14-default-share', defaults.shareRadius === 360);
const injected = resolvePhase92Defaults({ lobeHalfAngleDeg: 20, shareRadius: 99, compact: { draw: 9 } });
assert('s16.14-override-alpha', injected.lobeHalfAngleDeg === 20 && injected.shareRadius === 99);
const snapMag = snapshotPhase92Magnitudes({ lobeHalfAngleDeg: 20, compact: { draw: 9.25 } });
assert('s16.14-snapshot-inject', snapMag.lobeHalfAngleDeg === 20 && snapMag.compact.draw === 9.25);
assert('s16.14-snapshot-lock-false', snapMag.magnitudesLockedFromRemastered === false && snapMag.remasteredWattLock === false);

assert('s16.1-lobe-math', inLobe(0, 40, 50) === true && inLobe(0, 80, 50) === false);
assert('s16.1-angular', angularDistanceDeg(10, 350) === 20);
assert('s16.1-bearing-up', Math.abs(bearingDeg({ x: 0, y: 0 }, { x: 0, y: -10 })) < 1e-6);
assert('s16.1-not-cloak', lobesAreCloak() === false);

const fieldBook = emptyEw91Book();
installEwEquipment(fieldBook.actors[player] || (fieldBook.actors[player] = { actorKey: player }), 'compact');
const inBeam = injectJamField(fieldBook, [
  { actorKey: player, fitted: 'compact', sideId: 'ferengi', S: 4, securityInstanceId: 'player' },
], 2000, {
  receiver: { actorKey: 'npc:victim', sideId: 'klingon', S: 4 },
  E: 4,
  H: 1,
  S: 4,
  inLobeFor: { [player]: true },
});
assert('s16.1-in-lobe-c', inBeam.ok && inBeam.contest.contributions[0].c > 0 && inBeam.contest.N > 0);
const outBeam = snapshotContest(fieldBook, { actorKey: 'npc:victim', sideId: 'klingon', S: 4 }, 2000, {
  E: 4, H: 1, S: 4, inLobeFor: { [player]: false },
});
assert('s16.1-out-lobe-zero', outBeam.contributions[0].c === 0 && outBeam.contributions[0].cUnmasked > 0);
assert('s16.1-funded-radius', inBeam.contest.rfRadius > 0 && inBeam.contest.Q > 0);
const spend = jammerSpend({ ewEquipmentId: 'compact', commanded: 'on' }, { S: 5, H: 1, commanded: 'on', fitted: 'compact' });
assert('s16.1-ew-draw', spend.draw > 0 && spend.consumer === EW_CONSUMER_NAME);

const twoBook = emptyEw91Book();
installEwEquipment(twoBook.actors[player] || (twoBook.actors[player] = { actorKey: player }), 'compact');
const two = injectJamField(twoBook, [
  { actorKey: player, fitted: 'compact', sideId: 'ferengi', S: 4, securityInstanceId: 'player' },
  { actorKey: 'npc:ally', fitted: 'compact', sideId: 'ferengi', S: 4, securityInstanceId: 'vis-ally' },
  { actorKey: 'npc:far', fitted: 'compact', sideId: 'klingon', S: 4, securityInstanceId: 'vis-far' },
], 3000, {
  receiver: { actorKey: 'npc:victim', sideId: 'klingon', S: 4 },
  E: 4, H: 1, S: 4,
  inLobeFor: { [player]: true, 'npc:ally': true, 'npc:far': false },
});
const far = two.contest.contributions.find((row) => row.actorKey === 'npc:far');
const ally = two.contest.contributions.find((row) => row.actorKey === 'npc:ally');
assert('s16.1-out-zero-others-rss', far.c === 0 && ally.c > 0 && two.contest.N > 0);
assert('s16.2-friendly-took-n', ally.inLobe !== false && ally.c > 0);
const friendlyObs = snapshotContest(twoBook, { actorKey: 'npc:friend-obs', sideId: 'ferengi', S: 4 }, 3000, {
  E: 4, H: 1, S: 4,
  inLobeFor: { [player]: true, 'npc:ally': true, 'npc:far': false },
});
assert('s16.2-true-side-not-immune', friendlyObs.source === 'own' || friendlyObs.source === 'friendly' || friendlyObs.source === 'mixed');
assert('s16.2-not-void', friendlyObs.Q > 0 && friendlyObs.rfRadius > 0);
assert('s16.3-no-strongest-three', two.contest.strongestThree === false && two.contest.percentCeiling === false);

const contactBook = createContactBook();
upsertContact(contactBook, escort, {
  subjectKey: subject,
  detected: true,
  identification: 'known',
  trackQuality: 'firm',
  firingSolution: true,
  residue: false,
  lastKnown: { x: 40, y: 20, radius: 24, atLocalMs: 4000 },
  source: 'visual',
}, 4000);
applyResidueMark(findContact(contactBook, escort, subject), { lastKnown: { x: 40, y: 20, radius: 80, atLocalMs: 4000 } });
const shared = shareEscortToFlagship(contactBook, escort, player, 4000, {
  escort: true,
  inFormation: true,
  playerDist: 50,
  sameSystem: true,
  S: 4,
  book92: emptyEw92Book(),
  flagshipSuiteId: 'suite:baseline',
  flagshipSuiteIdAfter: 'suite:baseline',
});
const flagship = findContact(contactBook, player, subject);
assert('s16.4-share-detected', shared.ok && flagship?.detected === true);
assert('s16.4-share-area', flagship.trackQuality === 'area');
assert('s16.4-no-gifted-fs', flagship.firingSolution === false && shared.giftedFs === false && shareGiftsFiringSolution() === false);
assert('s16.4-no-auth', shared.engagement_authorized == null);
assert('s16.4-ident-not-copied', flagship.identification === 'none');
const outRange = shareEscortToFlagship(createContactBook(), escort, player, 4000, {
  escort: true, inFormation: false, playerDist: 900, sameSystem: true, S: 4,
});
assert('s16.5-out-of-envelope', outRange.ok === false && outRange.reason === 'out-of-envelope');
const otherSys = shareEscortToFlagship(contactBook, escort, player, 4000, {
  escort: true, inFormation: true, playerDist: 50, sameSystem: false, parkedOtherSystem: true, S: 4,
});
assert('s16.5-other-system', otherSys.ok === false);
assert('s16.5-no-second-suite', shared.snapshot.flagshipSuiteUnchanged === true);

const p6book = createContactBook();
upsertContact(p6book, player, {
  subjectKey: subject,
  detected: true,
  identification: 'partial',
  trackQuality: 'area',
  firingSolution: false,
  lastKnown: { x: 8, y: 8, radius: 80, atLocalMs: 10 },
  source: 'passive',
}, 10);
shareFormationDetection(p6book, player, escort, 10);
const escortRow = findContact(p6book, escort, subject);
assert('s16.6-flagship-to-escort', escortRow?.detected === true && escortRow.firingSolution === false);

const identity = { playerFaction: 'ferengi', playerSide: 'ferengi' };
const catchBook = createContactBook();
const ew92 = emptyEw92Book();
const catchResult = runFocusedScan(ew92, catchBook, { key: player }, { key: 'npc:spoof-blip' }, 5000, {
  completeNow: true,
  S: 4,
  identity,
  playerFaction: identity.playerFaction,
  playerSide: identity.playerSide,
  claim: { mode: 'spoof', spoofedFaction: 'klingon' },
  trueSide: 'ferengi',
  observed: { observedFaction: 'ferengi', visualClass: 'ferengi' },
  reman53: { id: 53 },
});
assert('s16.7-exposed', catchResult.spoofExposed === true && catchResult.emissionWritten === true);
assert('s16.7-no-rewrite', catchResult.playerFaction === 'ferengi' && catchResult.rewritten === false && catchRewritesPhase1Identity() === false);
assert('s16.7-no-autofire', catchResult.engagement_authorized == null && catchResult.attackId == null && catchAutoFires() === false);
assert('s16.7-no-fs', catchResult.firingSolution === false);
const sil = runFocusedScan(emptyEw92Book(), createContactBook(), { key: player }, { key: 'npc:sil' }, 6000, {
  completeNow: true, S: 4, identity, claim: { mode: 'spoof', spoofedFaction: 'klingon' },
  observed: { mismatch: true }, catchPath: 'silhouette', eccm: 'boost',
});
assert('s16.8-silhouette-eccm', sil.spoofExposed === true && sil.rewritten === false);
assert('s16.8-silent-not-cloak', silentIsCloak() === false && silentRunningIsCloak() === false);

const ledger = createIncidentLedger();
const opened = openIncident(ledger, {
  kind: 'distress',
  systemIndex: 0,
  clocks: { localElapsedMs: 100, strategicJumps: 0 },
  actor: { instanceId: 's16-actor', kind: 'npc' },
  links: { distressKey: 's16-d' },
});
const delivered = deliverReport(ledger, {
  incidentId: opened.incident.incidentId,
  senderKey: 'npc:sender',
  recipientKey: player,
  payload: { summary: 'already delivered' },
});
pushFlash(ledger, {
  incidentId: opened.incident.incidentId,
  kind: 'distress',
  summary: 'FLASH',
  atLocalMs: 100,
}, { localElapsedMs: 100 });
const flashBefore = ledger.alerts.lastFlashId;
const ewComms = emptyEwBook();
startEffect(ewComms, { family: 'comms_disruption', actorKey: player, victimKey: player }, 200);
const delayedDeliver = tryDeliverReport(ledger, {
  incidentId: opened.incident.incidentId,
  senderKey: player,
  recipientKey: 'authority:local',
  payload: { summary: 'new' },
}, ewComms, 200);
assert('s16.9-new-delayed', delayedDeliver.created === false && delayedDeliver.delayed === true && delayedDeliver.erasedByJamming === false);
assert('s16.9-delivered-stays', delivered.report.delivered !== false && observerKnowsIncident(ledger, player, opened.incident.incidentId));
assert('s16.9-flash-stays', ledger.alerts.lastFlashId === flashBefore);
assert('s16.9-no-unsend', commsDelayUnsendsReports() === false);

const fleet = createFleetOrderBoard();
issueOrder(fleet, { kind: 'hold_outside', assignedShipIds: ['escort-1'] }, {});
const prior = findOrderForShip(fleet, 'escort-1');
const delayedOrder = issueOrderWithEwComms(fleet, { kind: 'follow', assignedShipIds: ['escort-1'] }, {
  commsDisrupted: true,
  book92: emptyEw92Book(),
}, ewComms, 300);
const still = findOrderForShip(fleet, 'escort-1');
assert('s16.10-new-delayed', delayedOrder.delayed === true && delayedOrder.created === false);
assert('s16.10-hold-persists', still.kind === 'hold_outside' && still.status === 'standing' && still.orderId === prior.orderId);
assert('s16.10-no-culture', delayedOrder.cultureFire === false && delayedOrder.engagement_authorized == null);

const actor92 = emptyEw92Book();
installEwEquipment({ actorKey: player }, 'compact');
const jamOn = jammerSpend({ ewEquipmentId: 'compact', commanded: 'on' }, { S: 5, H: 1, commanded: 'on', fitted: 'compact' });
commandHeatSuppress(actor92, player, true, { jammerOn: true, jammerDraw: jamOn.draw, catalogDraw: jamOn.catalogDraw, H: 1 });
const heat = heatSuppressDraw(actor92, player, { jammerOn: true, jammerDraw: jamOn.draw, catalogDraw: jamOn.catalogDraw, H: 1 });
assert('s16.11-extra-draw', heat.draw > 0 && heat.emissionScale < 1 && heat.emissionScale === 0.25);
const heatFail = commandHeatSuppress(emptyEw92Book(), player, true, { jammerOn: true, jammerDraw: 0, catalogDraw: 1.2, H: 1 });
assert('s16.11-draw0-fails', heatFail.ok === false);
const brown = applyBrownout({ draws: { propulsion: 0, weapons: 0, cloak: 0, sensors: 0, ew: 20 }, generation: 4 });
assert('s16.11-brownout', brown.ewStarved === true || brown.draws.ew === 0);

const npcShips = [{ id: 1 }, { id: 2 }];
const decoyBook = createContactBook();
const decoy = upsertDecoyContact(decoyBook, player, { x: 10, y: 10 }, 7000, { ew92: emptyEw92Book(), actorKey: player });
assert('s16.12-book-row', decoy.ok && isDecoyContact(decoy.contact) && decoy.contact.source === 'ew_decoy');
assert('s16.12-not-hull', decoy.npcSpawned === false && decoyIsHull() === false && npcShips.length === 2);
assert('s16.12-no-fs', decoy.firingSolution === false && decoy.contact.firingSolution === false);
assert('s16.12-not-ghost', decoy.ghost === false && decoy.contact.ghost !== true);
assert('s16.12-destroy-noop', tryDestroyDecoy().destroyed === false && tryDestroyDecoy().standing === false);
assert('s16.12-source-legal', CONTACT_SOURCES.includes('ew_decoy') && CONTACT_SOURCES.includes('ew_ghost'));
const ghostBook = createContactBook();
upsertGhostContact(ghostBook, player, { x: 1, y: 1 }, 1, emptyEwBook());
assert('s16.12-ghosts-still-book', listGhostContacts(ghostBook).length === 1);

const silentBook = emptyEw92Book();
const silentOn = commandSilentRunning(silentBook, player, true, { H: 1 });
const silentDraw = silentRunningDraw(silentBook, player, { H: 1 });
assert('s16.13-draw', silentOn.ok && silentDraw.draw > 0 && silentDraw.emissionScale === 0.1);
assert('s16.13-not-cloak', silentOn.cloak === false && silentRunningIsCloak() === false);
const live = upsertContact(createContactBook(), player, {
  subjectKey: 'npc:vis-live',
  detected: true,
  identification: 'partial',
  trackQuality: 'area',
  firingSolution: false,
  residue: true,
  lastKnown: { x: 4, y: 4, radius: 80, atLocalMs: 8 },
  source: 'ew_residue',
}, 8);
assert('s16.13-residue-held', live.detected === true && live.residue === true);
const silentFail = commandSilentRunning(emptyEw92Book(), player, true, { H: 0 });
assert('s16.13-unfunded-fails', silentFail.ok === false);

const combined = phase92ReservedDraw(actor92, player, 8000, {
  jammerOn: true, jammerDraw: jamOn.draw, catalogDraw: jamOn.catalogDraw, H: 1,
});
assert('s16.11-combined-consumer', combined.consumer === EW_CONSUMER_NAME && combined.draw === reservedEwDraw(combined.draw));
const extraOnIdle = actorEwDraw(emptyEwBook(), player, 0, { phase92Draw: combined.draw });
assert('s16.18-ew-still-reserved', extraOnIdle === combined.draw);

assert('s16.17-no-auth-decoy', liveFireFactsFromContact(decoy.contact).engagement_authorized == null);
assert('s16.17-ew-facts', liveFireFactsFromEw(decoy.contact).engagement_authorized == null);
assert('s16.17-boarding-out', BOARDING_IMPLEMENTED === false);
assert('s16.20-hoj-ready', hojMatrixReady() === true);
const hoj = launchHoj(emptyEw91Book(), {
  actorKey: player,
  securityInstanceId: decoy.contact.subjectKey,
  emitterDraw: 1.3,
  emission: true,
}, 9000);
assert('s16.20-hoj-decoy-emission', hoj.ok && hoj.giftedFs === false && hoj.engagement_authorized == null);

const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
assert('s16.15-dock-var', css.includes('--bm1-dock-clear'));
assert('s16.15-dock-inset', css.includes('var(--bm1-dock-clear)') && css.includes('calc(100vh - 48px - var(--bm1-dock-clear) - 40px)'));

if (failed) {
  console.error(`Phase 9.2 offline probes: ${passed} passed, ${failed} failed`);
  for (const row of failures) console.error(`  FAIL ${row}`);
  process.exit(1);
}
console.log(`Phase 9.2 offline probes: ${passed} passed, ${failed} failed`);
