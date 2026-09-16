#!/usr/bin/env node
/**
 * Offline Phase 9.4 EW magnitudes playtest ledger (S20 family).
 * Written from docs/phase9/BM1-PHASE9.4-*.md only. Does not crib remastered-work.
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
  upsertContact,
} from '../src/phase6-sensors.js';
import { EW_CONSUMER_NAME, POWER_CONSUMERS } from '../src/phase65-power.js';
import {
  deliverReport,
  observerKnowsIncident,
  openIncident,
  pushFlash,
  createIncidentLedger,
} from '../src/phase4-incidents.js';
import {
  emptyEwBook,
  liveFireFactsFromEw,
  tractorIsBoarding,
  upsertGhostContact,
  listGhostContacts,
} from '../src/phase9-ew.js';
import {
  MAGNITUDES_LOCKED_FROM_REMASTERED as SLOT_LOCK,
  resolveEwEquipment,
} from '../src/phase91-ew-slot.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as BOARDING_LOCK } from '../src/boarding-eligibility.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE10_LOCK } from '../src/phase10-magnitudes.js';
import {
  MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE92_LOCK,
  emptyEw92Book,
  resolvePhase92Defaults,
} from '../src/phase92-magnitudes.js';
import {
  inLobe,
  snapshotLobe,
} from '../src/phase92-lobes.js';
import { inShareEnvelope, shareGiftsFiringSolution, shareLiveMagnitudes } from '../src/phase92-escort-share.js';
import { commandHeatSuppress, heatLiveMagnitudes, heatSuppressDraw } from '../src/phase92-heat.js';
import { decoyIsHull, upsertDecoyContact } from '../src/phase92-decoys.js';
import {
  MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE93_LOCK,
  emptyEw93Book,
  resolvePhase93Defaults,
} from '../src/phase93-magnitudes.js';
import {
  applyScanPoison,
  commandScanPoison,
  poisonGiftsFiringSolution,
  poisonLiveMagnitudes,
  poisonSpawnsHull,
  poisonWipesReports,
  scanPoisonDraw,
  sixthPowerConsumer,
} from '../src/phase93-poison.js';
import {
  classifyPaidEmission,
  commandDfAssist,
  dfGiftsFiringSolution,
  dfLiveMagnitudes,
} from '../src/phase93-df.js';
import {
  MAGNITUDES_LOCKED_FROM_REMASTERED,
  applyInjectedLedger,
  emptyEw94Book,
  resolvePhase94Defaults,
  snapshotPhase94Magnitudes,
} from '../src/phase94-magnitudes.js';
import { emptyEw91Book } from '../src/phase91-power.js';

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
const npcObserver = observerKeyForNpc('security-instance-7');
const subject = 'npc:security-instance-9';

assert('s20.startup-smoke', typeof resolvePhase94Defaults === 'function'
  && typeof snapshotPhase94Magnitudes === 'function'
  && typeof applyInjectedLedger === 'function');

assert('s20.1-lock-false-94', MAGNITUDES_LOCKED_FROM_REMASTERED === false);
assert('s20.1-lock-false-slot', SLOT_LOCK === false);
assert('s20.1-lock-false-92', PHASE92_LOCK === false);
assert('s20.1-lock-false-93', PHASE93_LOCK === false);
assert('s20.1-lock-false-boarding', BOARDING_LOCK === false);
assert('s20.1-lock-false-phase10', PHASE10_LOCK === false);

const defaults = resolvePhase94Defaults();
assert('s20.1-default-compact', defaults.compact.draw === 1.2 && defaults.compact.strength === 2 && defaults.compact.radius === 400);
assert('s20.1-default-tactical', defaults.tactical.draw === 2 && defaults.tactical.radius === 700);
assert('s20.1-default-fleet', defaults.fleet.draw === 3.2 && defaults.fleet.radius === 1100);
assert('s20.1-prices-null', defaults.compact.price == null && defaults.tactical.price == null && defaults.fleet.price == null);
assert('s20.1-default-jam', defaults.sensor_jamming.draw === 1.6 && defaults.sensor_jamming.durationLocalMs === 8000);
assert('s20.1-default-ghost', defaults.deceptive_contacts.draw === 1.4);
assert('s20.1-default-fc', defaults.fire_control.draw === 1.8);
assert('s20.1-default-comms', defaults.comms_disruption.draw === 1.5 && defaults.comms_disruption.durationLocalMs === 10000);
assert('s20.1-default-spin', defaults.spinUpLocalMs === 1000 && defaults.cooldownLocalMs === 2000);
assert('s20.1-default-self-cancel', defaults.selfCancel === 0.25);
assert('s20.1-default-eccm', defaults.eccmBoost === 1.4);
assert('s20.1-default-B', defaults.burnThroughB === 200);
assert('s20.1-default-clear', defaults.clearRatio === 0.05);
assert('s20.1-default-lobe', defaults.lobeHalfAngleDeg === 50);
assert('s20.1-default-sidelobe', defaults.sidelobeFactor === 0);
assert('s20.1-default-share', defaults.shareRadius === 360);
assert('s20.1-default-formation', defaults.formationDist === 110 && defaults.playerDist === 300);
assert('s20.1-default-heat', defaults.heatSuppressExtraEwFactor === 0.6
  && defaults.heatEmissionUnsuppressed === 1
  && defaults.heatEmissionSuppressed === 0.25);
assert('s20.1-default-silent', defaults.silentRunningEwDraw === 0.5 && defaults.silentRunningEmissionScale === 0.1);
assert('s20.1-default-decoy', defaults.decoyEwDraw === 1.3 && defaults.decoyDurationLocalMs === 8000 && defaults.maxDecoysPerObserver === 4);
assert('s20.1-default-poison', defaults.scanPoisonEwDraw === 1.1 && defaults.scanPoisonDurationLocalMs === 7000);
assert('s20.1-default-df', defaults.dfAssistEwDraw === 0.8 && defaults.dfRange === 700);
assert('s20.1-default-df-quality', defaults.dfCueQualityLoud === 0.75
  && defaults.dfCueQualitySuppressed === 0.25
  && defaults.dfCueQualitySilent === 0);
assert('s20.1-snapshot-lock-false', snapshotPhase94Magnitudes().magnitudesLockedFromRemastered === false
  && snapshotPhase94Magnitudes().remasteredWattLock === false
  && snapshotPhase94Magnitudes().playtest === true);

const omit = resolvePhase94Defaults();
assert('s20.2-omit-lobe', omit.lobeHalfAngleDeg === 50);
assert('s20.2-omit-poison', omit.scanPoisonEwDraw === 1.1);
assert('s20.2-omit-compact', omit.compact.draw === 1.2);

const lobeInject = resolvePhase94Defaults({ lobeHalfAngleDeg: 20 });
assert('s20.2-inject-lobe', lobeInject.lobeHalfAngleDeg === 20);
const poisonInject = resolvePhase94Defaults({ scanPoisonEwDraw: 0.9 });
assert('s20.2-inject-poison', poisonInject.scanPoisonEwDraw === 0.9);
const compactInject = resolvePhase94Defaults({ compact: { draw: 9 } });
assert('s20.2-inject-compact', compactInject.compact.draw === 9);
const heatInject = resolvePhase94Defaults({ heatSuppressExtraEwFactor: 0.3 });
assert('s20.2-inject-heat', heatInject.heatSuppressExtraEwFactor === 0.3);
const dfInject = resolvePhase94Defaults({ dfRange: 100 });
assert('s20.2-inject-df-range', dfInject.dfRange === 100);
const shareInject = resolvePhase94Defaults({ shareRadius: 99 });
assert('s20.2-inject-share', shareInject.shareRadius === 99);
const snapMag = snapshotPhase94Magnitudes({
  lobeHalfAngleDeg: 20,
  scanPoisonEwDraw: 0.9,
  compact: { draw: 9.25 },
  heatSuppressExtraEwFactor: 0.3,
  dfRange: 100,
  shareRadius: 99,
});
assert('s20.2-snapshot-all-classes', snapMag.lobeHalfAngleDeg === 20
  && snapMag.scanPoisonEwDraw === 0.9
  && snapMag.compact.draw === 9.25
  && snapMag.heatSuppressExtraEwFactor === 0.3
  && snapMag.dfRange === 100
  && snapMag.shareRadius === 99);

const liveOpts = {
  lobeHalfAngleDeg: 20,
  scanPoisonEwDraw: 0.9,
  compact: { draw: 9 },
  heatSuppressExtraEwFactor: 0.3,
  dfRange: 100,
  shareRadius: 99,
};
assert('s20.3-live-lobe', snapshotLobe([], { defaults: liveOpts, magnitudes: liveOpts }).halfAngleDeg === 20);
assert('s20.3-live-lobe-mask', inLobe(0, 40, 20) === false && inLobe(0, 40, 50) === true);
assert('s20.3-live-compact', resolveEwEquipment('compact', { magnitudes: liveOpts, defaults: liveOpts }).draw === 9);
assert('s20.3-live-heat', heatLiveMagnitudes({ defaults: liveOpts, magnitudes: liveOpts }).heatSuppressExtraEwFactor === 0.3);
assert('s20.3-live-poison', poisonLiveMagnitudes({ defaults: liveOpts, magnitudes: liveOpts }).scanPoisonEwDraw === 0.9);
assert('s20.3-live-df', dfLiveMagnitudes({ defaults: liveOpts, magnitudes: liveOpts }).dfRange === 100);
assert('s20.3-live-share', shareLiveMagnitudes({ defaults: liveOpts, magnitudes: liveOpts }).shareRadius === 99);

const heatBook = emptyEw92Book();
commandHeatSuppress(heatBook, player, true, { jammerOn: true, jammerDraw: 1, H: 1 });
const heatDraw = heatSuppressDraw(heatBook, player, {
  jammerOn: true, jammerDraw: 1, catalogDraw: 2, H: 1, defaults: liveOpts, magnitudes: liveOpts,
});
assert('s20.3-live-heat-draw', Math.abs(heatDraw.draw - 0.6) < 1e-9 && heatDraw.heatSuppressExtraEwFactor === 0.3);

const poisonBook = emptyEw93Book();
commandScanPoison(poisonBook, player, true, 1000, { S: 4, H: 1, defaults: liveOpts, magnitudes: liveOpts });
const poisonDraw = scanPoisonDraw(poisonBook, player, { S: 4, H: 1, defaults: liveOpts, magnitudes: liveOpts });
assert('s20.3-live-poison-draw', Math.abs(poisonDraw.draw - 0.9) < 1e-9);

const dfBook = emptyEw93Book();
commandDfAssist(dfBook, player, true, 3000, { S: 4, H: 1, defaults: liveOpts, magnitudes: liveOpts });
const inRange = classifyPaidEmission(dfBook, { actorKey: player, sideId: 'ferengi' }, 3100, {
  contributions: [{
    actorKey: npcObserver, paid: true, paidDraw: 1.6, inLobe: true, distance: 50, family: 'sensor_jamming',
  }],
  forceClassify: true,
  defaults: liveOpts,
  magnitudes: liveOpts,
});
const outRange = classifyPaidEmission(dfBook, { actorKey: player, sideId: 'ferengi' }, 3200, {
  contributions: [{
    actorKey: npcObserver, paid: true, paidDraw: 1.6, inLobe: true, distance: 400, family: 'sensor_jamming',
  }],
  forceClassify: true,
  defaults: liveOpts,
  magnitudes: liveOpts,
});
assert('s20.3-live-df-range-path', inRange.cue != null && outRange.cue == null);

assert('s20.3-live-share-envelope', inShareEnvelope({ playerDist: 150, sameSystem: true }, { defaults: liveOpts, playerDist: 0, formationDist: 0 }) === false);
assert('s20.3-live-share-default-in', inShareEnvelope({ playerDist: 150, sameSystem: true }, { playerDist: 0, formationDist: 0 }) === true);

const books = {
  ew91: emptyEw91Book(),
  ew92: emptyEw92Book(),
  ew93: emptyEw93Book(),
  ew94: emptyEw94Book(),
};
applyInjectedLedger(books, liveOpts);
assert('s20.3-fanout-92', books.ew92.defaults.lobeHalfAngleDeg === 20 && books.ew92.defaults.shareRadius === 99);
assert('s20.3-fanout-93', books.ew93.defaults.scanPoisonEwDraw === 0.9 && books.ew93.defaults.dfRange === 100);
assert('s20.3-fanout-91', books.ew91.magnitudes.compact.draw === 9);
assert('s20.3-fanout-94', books.ew94.defaults.lobeHalfAngleDeg === 20 && books.ew94.defaults.compact.draw === 9);

assert('s20.5-alias-92', resolvePhase92Defaults({ lobeHalfAngleDeg: 20 }).lobeHalfAngleDeg === 20);
assert('s20.5-alias-93', resolvePhase93Defaults({ scanPoisonEwDraw: 0.9 }).scanPoisonEwDraw === 0.9);

assert('s20.4-five-consumers', POWER_CONSUMERS.join(',') === 'propulsion,weapons,cloak,sensors,ew');
assert('s20.4-no-sixth', sixthPowerConsumer() == null && POWER_CONSUMERS.length === 5);
assert('s20.4-tractor', tractorIsBoarding() === false);
assert('s20.4-no-share-fs', shareGiftsFiringSolution() === false);
assert('s20.4-no-poison-fs', poisonGiftsFiringSolution() === false);
assert('s20.4-no-df-fs', dfGiftsFiringSolution() === false);
assert('s20.4-no-wipe', poisonWipesReports() === false);
assert('s20.4-no-hull', poisonSpawnsHull() === false && decoyIsHull() === false);

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
const poisoned = applyScanPoison(poisonBook, contacts, npcObserver, 1200, {
  actorKey: player,
  ew92: emptyEw92Book(),
  S: 4,
  H: 1,
  forceApply: true,
  defaults: liveOpts,
  magnitudes: liveOpts,
});
const row = findContact(contacts, npcObserver, subject);
assert('s20.4-poison-no-hull', poisoned.hullSpawned === false && npcShips.length === beforeCount);
assert('s20.4-row-stays', row.detected === true && row.ghost !== true);
assert('s20.4-fs-not-gifted', row.firingSolution === false);
assert('s20.4-no-auth', liveFireFactsFromEw(row).engagement_authorized == null
  && liveFireFactsFromContact(row).engagement_authorized == null);
assert('s20.4-source-not-df-hull', CONTACT_SOURCES.includes('ew_ghost') && row.source !== 'ew_df_assist');

const ghostBook = createContactBook();
upsertGhostContact(ghostBook, player, { x: 1, y: 1 }, 1, emptyEwBook());
assert('s20.4-ghosts-book', listGhostContacts(ghostBook).length === 1);
const decoy = upsertDecoyContact(createContactBook(), player, { x: 10, y: 10 }, 7000, {
  ew92: emptyEw92Book(), actorKey: player, defaults: liveOpts,
});
assert('s20.4-decoy-not-hull', decoy.ok && decoyIsHull() === false);

const ledger = createIncidentLedger();
const opened = openIncident(ledger, {
  kind: 'distress',
  systemIndex: 0,
  clocks: { localElapsedMs: 100, strategicJumps: 0 },
  actor: { instanceId: 's20-actor', kind: 'npc' },
});
const delivered = deliverReport(ledger, {
  incidentId: opened.incident.incidentId,
  senderKey: 'npc:sender',
  recipientKey: player,
  payload: { summary: 'already delivered', confidence: 0.8 },
});
pushFlash(ledger, {
  incidentId: opened.incident.incidentId,
  kind: 'distress',
  summary: 'FLASH',
  atLocalMs: 100,
}, { localElapsedMs: 100 });
const flashBefore = ledger.alerts.lastFlashId;
applyScanPoison(poisonBook, contacts, npcObserver, 1300, {
  actorKey: player, forceApply: true, S: 4, H: 1, defaults: liveOpts,
});
assert('s20.4-delivered-stays', delivered.report.delivered !== false && observerKnowsIncident(ledger, player, opened.incident.incidentId));
assert('s20.4-flash-stays', ledger.alerts.lastFlashId === flashBefore);

const cue = classifyPaidEmission(dfBook, { actorKey: player, sideId: 'ferengi' }, 3300, {
  contributions: [{
    actorKey: npcObserver, paid: true, paidDraw: 1.6, inLobe: true, distance: 10, family: 'sensor_jamming',
  }],
  forceClassify: true,
  playerFaction: 'ferengi',
  playerSide: 'ferengi',
  defaults: liveOpts,
});
assert('s20.4-df-not-fs', cue.firingSolution === false && cue.engagement_authorized == null && cue.identityInvented === false);

assert('s20.5-ew-consumer', EW_CONSUMER_NAME === 'ew');
assert('s20.6-no-dockclear-retune', fs.readFileSync(path.join(root, 'styles.css'), 'utf8').includes('--bm1-dock-clear'));

if (failed) {
  console.error(`Phase 9.4 offline probes: ${passed} passed, ${failed} failed`);
  for (const rowId of failures) console.error(`  FAIL ${rowId}`);
  process.exit(1);
}
console.log(`Phase 9.4 offline probes: ${passed} passed, ${failed} failed`);
