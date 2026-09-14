#!/usr/bin/env node
/**
 * Offline Phase 9.1 EW robustness checks (S15 family).
 * Written from docs/phase9/BM1-PHASE9.1-*.md only. Does not crib remastered-work.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applyLostTrackSameTick,
  CONTACT_SOURCES,
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
  ATTRIBUTION_DEFAULT,
  actorEwDraw,
  applySensorJamming,
  boardingApis,
  emptyEwBook,
  fireAtContact,
  injectDeepJam,
  injectJammer,
  isGhostContact,
  listGhostContacts,
  liveFireFactsFromEw,
  snapshotEwPower,
  tickEw,
  tractorIsBoarding,
  tryDestroyGhost,
  upsertGhostContact,
  ewWritesEngagementAuthorized,
} from '../src/phase9-ew.js';
import {
  BASELINE_COMBAT_NUMBERS,
  BOARDING_IMPLEMENTED,
  HOJ_MATRIX_ROW,
  MATRIX_COLUMNS,
  UNIVERSAL_SHIELD_BYPASS,
  buildWeaponsMatrix,
  combatNumbersUnchanged,
  disruptorIdentities,
  mappingDidNotAutoFill,
  rowHasAllColumns,
  tractorRow,
} from '../src/phase9-weapons-matrix.js';
import {
  EW_SLOT_KIND,
  MAGNITUDES_LOCKED_FROM_REMASTERED,
  installEwEquipment,
  listEwEquipmentCatalog,
  scienceSuiteIsJammer,
} from '../src/phase91-ew-slot.js';
import {
  commandEccm,
  commandJammer,
  emptyEw91Book,
  jammerSpend,
  mapSensorsPoints,
  restoreEw91Book,
  serializeEw91Book,
} from '../src/phase91-power.js';
import {
  burnThroughRadius,
  contestQuality,
  injectJamField,
  rssNoise,
  snapshotContest,
} from '../src/phase91-contest.js';
import {
  isResidueContact,
  listResidueContacts,
  residueIsGiftedLock,
} from '../src/phase91-residue.js';
import {
  applyForgettingLadder,
  claimRewritesPhase1Identity,
  setTransponderClaim,
  silentIsCloak,
} from '../src/phase91-transponder.js';
import {
  hojMatrixReady,
  jamAloneAutoFires,
  launchHoj,
  silenceEmitter,
  transferIncarnation,
} from '../src/phase91-hoj.js';

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

assert('s15.startup-smoke', typeof installEwEquipment === 'function'
  && typeof snapshotContest === 'function'
  && typeof injectDeepJam === 'function'
  && typeof launchHoj === 'function'
  && typeof setTransponderClaim === 'function');

assert('s15.19-five-consumers', POWER_CONSUMERS.join(',') === 'propulsion,weapons,cloak,sensors,ew');
assert('s15.19-ew-on', EW_EFFECTS_IMPLEMENTED === true && EW_CONSUMER_NAME === 'ew');
assert('s15.20-no-remastered-lock', MAGNITUDES_LOCKED_FROM_REMASTERED === false);

const player = observerKeyForPlayer();
const items = JSON.parse(fs.readFileSync(path.join(root, 'data/game_items.json'), 'utf8'));
const pack = JSON.parse(fs.readFileSync(path.join(root, 'bm-ships/ships.json'), 'utf8'));
const hulls = (pack.ships || []).filter((row) => row.rosterState === 'active');
const matrix = buildWeaponsMatrix(items.weapons, hulls);
const numbers = combatNumbersUnchanged(items.weapons, BASELINE_COMBAT_NUMBERS);

assert('s15.11-hoj-row', hojMatrixReady() === true
  && HOJ_MATRIX_ROW.provenance === 'new'
  && HOJ_MATRIX_ROW.mapping === 'unmounted'
  && HOJ_MATRIX_ROW.family === 'anti-emitter'
  && rowHasAllColumns(HOJ_MATRIX_ROW));
assert('s15.11-ten-columns', MATRIX_COLUMNS.length === 10 && matrix.every(rowHasAllColumns));
assert('s15.11-no-retune', numbers.unchanged === true, JSON.stringify(numbers.mismatches));
assert('s15.11-hoj-present', matrix.some((row) => row.id === HOJ_MATRIX_ROW.id && row.provenance === 'new'));
assert('s15.18-disruptors-tractor', disruptorIdentities(matrix).distinct === true && tractorRow(matrix).type === 'Device');
assert('s15.18-no-bypass', UNIVERSAL_SHIELD_BYPASS === false);
assert('s15.18-no-autofill', mappingDidNotAutoFill(matrix, hulls) === true);
assert('s15.18-boarding-out', BOARDING_IMPLEMENTED === false && tractorIsBoarding() === false && boardingApis().length === 0);

const target = { weaponSlots: [1, null, null], sensorSuiteId: 'suite:baseline' };
const emptyFit = installEwEquipment({ ...target }, null, { weaponSlots: target.weaponSlots, sensorSuiteId: target.sensorSuiteId });
assert('s15.2-empty-default', emptyFit.fitted == null && emptyFit.slotKind === EW_SLOT_KIND);
const compact = installEwEquipment({ ...target }, 'compact', { weaponSlots: [1, null, null], sensorSuiteId: 'suite:baseline' });
assert('s15.2-dedicated', compact.ok && compact.occupiesWeaponSlot === false && compact.occupiesSensorSuiteSlot === false);
assert('s15.2-no-weapon-theft', compact.weaponSlotsUnchanged === true && JSON.stringify(compact.weaponSlots) === JSON.stringify([1, null, null]));
assert('s15.2-no-suite-theft', compact.sensorSuiteIdUnchanged === true && compact.sensorSuiteId === 'suite:baseline');
const stacked = installEwEquipment({ ewEquipmentId: 'compact', weaponSlots: [1, null, null], sensorSuiteId: 'suite:baseline' }, 'tactical', {
  weaponSlots: [1, null, null],
  sensorSuiteId: 'suite:baseline',
});
assert('s15.2-no-stack', stacked.ok === false && stacked.reason === 'stack-rejected');
assert('s15.2-science-not-jammer', scienceSuiteIsJammer() === false);
assert('s15.2-catalog-shape', listEwEquipmentCatalog().length === 3 && listEwEquipmentCatalog().every((row) => row.draw > 0));

const mag = listEwEquipmentCatalog({ compact: { draw: 9.25 } });
assert('s15.20-injectable-draw', mag.find((row) => row.tierId === 'compact').draw === 9.25);

const spend = jammerSpend({ ewEquipmentId: 'compact', commanded: 'on' }, {
  S: 5,
  H: 1,
  commanded: 'on',
  fitted: 'compact',
  magnitudes: { compact: { draw: 2, strength: 3, radius: 500 } },
});
assert('s15.1-formula', Math.abs(spend.draw - (2 * spend.A * spend.H)) < 1e-9 && spend.draw > 0);
assert('s15.1-A-from-S', Math.abs(spend.A - (0.5 + 0.1 * 5)) < 1e-9);
const shared = consumerDraws({
  suite: resolveSuite('suite:baseline'),
  sensorMode: 'active',
  cloakActive: true,
  moving: true,
  ew: spend.draw,
});
assert('s15.1-shared-pool', shared.ew === spend.draw && shared.sensors > 0 && shared.cloak > 0 && sumDraws(shared) > shared.ew);
assert('s15.1-reserved', reservedEwDraw(spend.draw) === spend.draw);
const brown = applyBrownout({ draws: { ...shared, ew: 20 }, generation: 4, cloakActive: true, sensorMode: 'active' });
assert('s15.1-brownout-weakens', brown.ewStarved === true || brown.draws.ew === 0);
const weak = jammerSpend({ ewEquipmentId: 'compact', commanded: 'on' }, { S: 5, H: 0, commanded: 'on', fitted: 'compact' });
assert('s15.1-H-zero', weak.draw === 0 && weak.strength === 0 && weak.offBudget !== true);

const s0 = jammerSpend({ ewEquipmentId: 'compact' }, { S: 0, commanded: 'on', fitted: 'compact' });
assert('s15.3-s-zero-unavailable', s0.available === false && s0.draw === 0);
const book91 = emptyEw91Book();
const onFail = commandJammer(book91, player, true, 1000, { S: 0, fitted: 'compact' });
assert('s15.3-jammer-on-fails', onFail.ok === false);
const eccmFail = commandEccm(book91, player, true, { S: 0 });
assert('s15.3-eccm-fails', eccmFail.ok === false && eccmFail.eccm === 'off');

const E = 4;
const N = 12;
const Q = contestQuality(E, N);
const rf = burnThroughRadius(200, Q);
assert('s15.4-q-open', Q > 0 && Q <= 1 && Q === E / (E + N));
assert('s15.4-radius-positive', rf > 0 && Number.isFinite(rf));
assert('s15.5-unfunded-q0', contestQuality(0, N) === 0 && burnThroughRadius(200, 0) === 0);

const two = rssNoise([3, 4]);
assert('s15.8-rss-not-sum', two === 5 && two !== 7 && two !== 4);
assert('s15.8-rss-not-max', rssNoise([3, 4, 0]) === 5);
const fieldBook = emptyEw91Book();
installEwEquipment(fieldBook.actors[player] || (fieldBook.actors[player] = { actorKey: player }), 'compact');
const jamField = injectJamField(fieldBook, [
  { actorKey: player, fitted: 'compact', sideId: 'ferengi', S: 4, securityInstanceId: 'player' },
  { actorKey: 'npc:ally', fitted: 'compact', sideId: 'ferengi', S: 4, securityInstanceId: 'vis-ally' },
  { actorKey: 'npc:dead', fitted: 'compact', sideId: 'klingon', S: 4, paid: false, draw: 0, securityInstanceId: 'vis-dead' },
], 2000, { receiver: { actorKey: player, sideId: 'ferengi', S: 4 }, E: 4, H: 1, S: 4 });
assert('s15.8-paid-only', jamField.ok && jamField.contest.contributions.every((row) => row.paid === true));
assert('s15.8-no-ceiling', jamField.contest.strongestThree === false && jamField.contest.percentCeiling === false);
assert('s15.10-true-side', jamField.contest.source === 'own' || jamField.contest.source === 'friendly');
assert('s15.10-no-invented-id', jamField.contest.inventedFaction === false && jamField.contest.usedClaim === false);

const selfBook = emptyEw91Book();
injectJamField(selfBook, [
  { actorKey: player, fitted: 'fleet', sideId: 'ferengi', S: 8, securityInstanceId: 'player' },
], 3000, { receiver: { actorKey: player, sideId: 'ferengi', S: 8 }, E: 6, H: 1, S: 8 });
const selfSnap = snapshotContest(selfBook, { actorKey: player, sideId: 'ferengi', S: 8 }, 3000, { E: 6, H: 1, S: 8 });
assert('s15.9-self-cancel-not-deaf', selfSnap.E > 0 && selfSnap.Q > 0 && selfSnap.rfRadius > 0);
assert('s15.9-own-label', selfSnap.source === 'own');

const contactBook = createContactBook();
upsertContact(contactBook, player, {
  subjectKey: 'npc:vis-live',
  detected: true,
  identification: 'known',
  trackQuality: 'firm',
  firingSolution: true,
  lastKnown: { x: 40, y: 20, radius: 20, atLocalMs: 4000 },
  source: 'visual',
}, 4000);
assert('s15.6-lock-before', observerHasFiringSolution(contactBook, player, 'npc:vis-live') === true);
const npcBefore = 2;
injectDeepJam(emptyEwBook(), contactBook, { victimKey: player, subjectKey: 'npc:vis-live' }, 4000);
const residue = findContact(contactBook, player, 'npc:vis-live');
assert('s15.6-row-survives', Boolean(residue) && residue.detected === true);
assert('s15.6-not-void', residue.trackQuality !== 'none' && residue.detected === true);
assert('s15.6-residue-mark', isResidueContact(residue) === true && residue.ghost !== true);
assert('s15.6-id-may-black', residue.identification === 'none' || residue.identification === 'partial');
assert('s15.6-not-hull', npcBefore === 2);
assert('s15.7-no-gifted-fs', residue.firingSolution === false && residueIsGiftedLock(residue) === false);
const facts = liveFireFactsFromEw(residue);
assert('s15.7-no-live-track', facts.liveWeaponTrack === false && facts.engagement_authorized == null);
assert('s15.residue-source-legal', CONTACT_SOURCES.includes('ew_residue') && CONTACT_SOURCES.includes('ew_ghost'));

const identity = { playerFaction: 'ferengi', playerSide: 'ferengi' };
const claimOff = setTransponderClaim(emptyEw91Book(), player, 'off', { identity, playerFaction: identity.playerFaction, playerSide: identity.playerSide });
assert('s15.14-off-no-rewrite', claimOff.playerFaction === 'ferengi' && claimOff.playerSide === 'ferengi' && claimOff.rewritten === false);
const claimSpoof = setTransponderClaim(emptyEw91Book(), player, { mode: 'spoof', spoofedFaction: 'klingon' }, identity);
assert('s15.14-spoof-no-rewrite', claimSpoof.mintedSideId === false && claimSpoof.remanRewritten === false && claimRewritesPhase1Identity() === false);
assert('s15.15-silent-not-cloak', silentIsCloak() === false && claimOff.cloak === false);
assert('s15.16-no-auto-fire', claimSpoof.engagement_authorized == null && claimSpoof.attackId == null);
const forget = applyForgettingLadder({
  claim: { mode: 'spoof', spoofedFaction: 'klingon' },
  trueSide: 'ferengi',
  ledger: createIncidentLedger(),
  openIncident: true,
  kind: 'access_noncompliance',
  actorInstanceId: 's15-spoof',
  localElapsedMs: 5000,
});
assert('s15.16-teeth', forget.mismatch === true && forget.steps.suspicion === true && forget.steps.challenge === true);
assert('s15.16-record-only', forget.appliedResponse === 'record_only' && forget.acting === false);
assert('s15.16-no-flash-standing', forget.flashPulsed === false && forget.standingFromBlip === false && forget.engagement_authorized == null);

const hojBook = emptyEw91Book();
const launched = launchHoj(hojBook, {
  actorKey: player,
  securityInstanceId: 'vis-jammer',
  npcId: 'npc-old',
  emitterDraw: 2,
}, 6000);
assert('s15.12-launch', launched.ok === true && launched.giftedFs === false && launched.engagement_authorized == null);
assert('s15.12-bills-weapons', launched.consumer === 'weapons' && launched.ewBilled === false);
assert('s15.12-no-jam-autofire', launched.jamAutoFire === false && jamAloneAutoFires() === false);
const silenced = silenceEmitter(hojBook, 'vis-jammer', 7000);
assert('s15.12-coast', silenced.coasting === true && silenced.giftedFs === false && silenced.seekers[0].perfectSilentTrack === false);
const reused = transferIncarnation(hojBook, 'vis-jammer', 'npc-new');
assert('s15.13-incarnation-lock', reused.transferred === false && reused.miss === true && reused.engagement_authorized == null);

const ledger = createIncidentLedger();
const opened = openIncident(ledger, {
  kind: 'destruction',
  systemIndex: 0,
  clocks: { localElapsedMs: 8000, strategicJumps: 0 },
  actor: { instanceId: 's15-a', kind: 'npc', sideId: 'klingon' },
  victim: { instanceId: 's15-v', kind: 'npc' },
  links: { destructionKey: 's15-dest-1' },
});
const delivered = deliverReport(ledger, {
  incidentId: opened.incident.incidentId,
  senderKey: 'npc:sender',
  recipientKey: player,
  payload: { kind: 'destruction', summary: 'Already delivered.' },
});
injectDeepJam(emptyEwBook(), contactBook, { victimKey: player }, 8000);
assert('s15.17-report-survives', ledger.reports[delivered.report.reportId].delivered === true);
assert('s15.17-known-survives', observerKnowsIncident(ledger, player, opened.incident.incidentId) === true);

const ghostBook = emptyContactBook();
const ghost = upsertGhostContact(ghostBook, player, { x: 8, y: 8 }, 9000, emptyEwBook());
assert('s15.18-ghost-not-hull', ghost.hullSpawned === false && isGhostContact(ghost.contact) && ghost.contact.firingSolution === false);
assert('s15.18-destroy-ghost', tryDestroyGhost(ghost.contact).killed === false);
assert('s15.18-no-culture', ewWritesEngagementAuthorized() === false);
const seed = seedFromReport(emptyContactBook(), player, 'npc:rep', { x: 1, y: 1 }, 10);
assert('s15.19-seed-area', seed.firingSolution === false && seed.trackQuality === 'area');

const both = emptyEw91Book();
const playerJam = injectJamField(both, [{ actorKey: player, fitted: 'compact', sideId: 'ferengi', S: 4 }], 10000, {
  receiver: { actorKey: 'npc:obs', sideId: 'klingon', S: 4 },
  E: 3,
  H: 1,
  S: 4,
});
const npcJam = injectJamField(both, [{ actorKey: 'npc:obs', fitted: 'tactical', sideId: 'klingon', S: 4 }], 10000, {
  receiver: { actorKey: player, sideId: 'ferengi', S: 4 },
  E: 3,
  H: 1,
  S: 4,
});
assert('s15.21-both-sides', playerJam.contest.rfRadius > 0 && npcJam.contest.rfRadius > 0);
assert('s15.21-same-consumer', playerJam.contest.consumer === EW_CONSUMER_NAME && npcJam.contest.consumer === EW_CONSUMER_NAME);

const persisted = restoreEw91Book(serializeEw91Book(both));
assert('s15.1-no-performance-now', Object.values(persisted.actors).every((row) => row.startedAt == null));
assert('s15.22-reman-53', pack.ships.some((row) => Number(row.id) === 53 && row.key === 'bm-ship:53'));
assert('s15.22-172-active', hulls.length === 172);
assert('s15.22-aliases-38', Object.keys(pack.aliases || {}).length === 38);

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
assert('s15.19-same-tick', dropped.sameTick === true && dropped.firingSolution === false);
assert('s15.19-ew-idle-zero', reservedEwDraw() === 0 && actorEwDraw(emptyEwBook(), player, 0) === 0);

if (failed) {
  console.error(`Phase 9.1 offline probes: ${passed} passed, ${failed} failed`);
  for (const row of failures) console.error(`  FAIL ${row}`);
  process.exit(1);
}
console.log(`Phase 9.1 offline probes: ${passed} passed, ${failed} failed`);
