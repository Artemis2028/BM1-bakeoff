#!/usr/bin/env node
/**
 * Offline Phase 4 record / token / alert-gate / doctrine-fold checks.
 */
import { areAlertsActive, createPlayerSecurityState, setEmpireDefaultDimension } from '../src/phase2-security.js';
import {
  FLASH_HOLD_MS,
  appendIncidentEvent,
  applyStandingOnce,
  createIncidentLedger,
  evaluateIncidentReact,
  findIncidentByKey,
  foldDoctrineResponse,
  incidentEventType,
  incidentIdempotencyKey,
  incidentObjectiveIsFireCapable,
  createIncidentObjective,
  linkEncounterToIncident,
  makePunishmentToken,
  openIncident,
  punishmentAlreadyApplied,
  pushFlash,
  rememberPunishment,
  resolveAccessIncidentsForEpoch,
  restoreIncidentLedger,
  serializeIncidentLedger,
  shouldPulseFlash,
  shouldReplaceBanner,
  deliverReport,
} from '../src/phase4-incidents.js';

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

const ledger = createIncidentLedger();
const encounter = {
  encounterId: 'enc-4',
  systemIndex: 11,
  zoneId: 'authored:vulcan',
  authoritySide: 'vulcan',
  authorityEpoch: 1,
  visitorInstanceId: 'player',
  visitorKind: 'player',
  entryEpisode: 1,
  lifecycle: 'refused',
  outcome: 'noncompliant',
  issuedAtLocalMs: 90000,
  lastUpdateLocalMs: 120000,
};

const refusal = linkEncounterToIncident(ledger, encounter, {
  lifecycle: 'refused',
  localElapsedMs: 120000,
  locationId: 'system:vulcan',
  jurisdictionId: 'authority:vulcan',
  sayable: 'Vulcan checkpoint: Ferengi flagship refused identity check. Administrative record only — weapons unchanged.',
});
assert('s6.1-one-access-noncompliance', refusal.created === true && refusal.incident.kind === 'access_noncompliance');
assert('s6.1-not-aggression-fields', refusal.incident.links.attackId == null && refusal.incident.links.punishmentToken === 'none');
assert('s6.1-flash-on-open', refusal.flash === true && shouldPulseFlash('access_noncompliance') === true);

const replay = linkEncounterToIncident(ledger, encounter, { lifecycle: 'refused', localElapsedMs: 121000 });
assert('s6.3-once-per-encounter', replay.created === false && replay.incident.incidentId === refusal.incident.incidentId);

const withdraw = linkEncounterToIncident(ledger, { ...encounter, lifecycle: 'withdrawn', outcome: 'noncompliant' }, {
  lifecycle: 'withdrawn',
  localElapsedMs: 130000,
  keepNoncompliant: true,
});
assert('s6.14-same-incident', withdraw.incident.incidentId === refusal.incident.incidentId && withdraw.created === false);
assert('s6.14-no-second-flash', withdraw.flash === false && shouldPulseFlash('access_noncompliance', { appendOnly: true }) === false);
assert(
  's6.14-history-appended',
  withdraw.incident.history.some((row) => row.type === 'withdrawn') && withdraw.incident.kind !== 'access_notice',
);

const inabilityEncounter = { ...encounter, encounterId: 'enc-5', lifecycle: 'unable_to_comply', outcome: null };
const inability = linkEncounterToIncident(ledger, inabilityEncounter, {
  lifecycle: 'unable_to_comply',
  blockingReason: 'tractor',
  detail: 'tractor',
  localElapsedMs: 140000,
});
assert('s6.2-inability-kind', inability.created === true && inability.incident.kind === 'access_inability');
assert('s6.2-not-offense', inability.incident.truth.offense === 'none' && inability.incident.outcome !== 'noncompliant');
assert('s6.2-reason-in-record', /tractor/.test(inability.incident.truth.notes + (inability.incident.truth.blockingReason || '')));

const token = makePunishmentToken({
  credit: 'player',
  systemIndex: 3,
  victimInstanceId: 'vis-9',
  localElapsedMs: 5500,
});
assert('token-shape', token === 'kill:player:3:vis-9:5');
const killLedger = createIncidentLedger();
let standingWrites = 0;
rememberPunishment(killLedger, token);
const first = applyStandingOnce(killLedger, token, () => { standingWrites += 1; });
const second = applyStandingOnce(killLedger, token, () => { standingWrites += 1; });
assert('s6.4-second-path-refuses', first.applied === false && second.applied === false && standingWrites === 0 && punishmentAlreadyApplied(killLedger, token));

const destruction = openIncident(killLedger, {
  kind: 'destruction',
  systemIndex: 3,
  actor: { instanceId: 'player', kind: 'player', sideId: 'ferengi' },
  victim: { instanceId: 'vis-9', kind: 'npc', sideId: 'terran' },
  links: { destructionKey: 'vis-9', punishmentToken: token, punishmentApplied: 'kill-standing' },
  clocks: { localElapsedMs: 5500 },
});
assert('s6.4-token-on-incident', destruction.created && destruction.incident.links.punishmentToken === token);
const report = deliverReport(killLedger, {
  incidentId: destruction.incident.incidentId,
  senderKey: 'npc:patrol',
  recipientKey: 'authority:vulcan',
});
assert('s6.4-report-no-standing-api', report.created === true);
const afterReport = applyStandingOnce(killLedger, destruction.incident.links.punishmentToken, () => { standingWrites += 1; });
assert('s6.4-report-cannot-recharge', afterReport.applied === false && standingWrites === 0);

const protectFold = foldDoctrineResponse('protect');
assert('s6.13-protect-folds', protectFold.appliedResponse === 'record_only' && protectFold.acting === false && protectFold.packResponse === 'protect');
assert('s6.13-conceal-folds', foldDoctrineResponse('conceal').appliedResponse === 'record_only');
assert('s6.13-reroute-folds', foldDoctrineResponse('reroute').appliedResponse === 'record_only');
assert('s6.13-investigate-acts', foldDoctrineResponse('investigate').acting === true);
assert('s6.13-objective-not-weapons', incidentObjectiveIsFireCapable(createIncidentObjective({ kind: 'investigate', incidentId: 'inc-1' })) === false);

const reactProtect = evaluateIncidentReact(() => 'protect', {
  packProfileId: 'vulcan',
  role: 'patrol',
  incident: { kind: 'access_noncompliance' },
  known: true,
  facts: { own_asset_affected: true, can_respond: true, credible_report: true, event_actionable: true },
});
assert('s6.13-border-breach-event', reactProtect.eventType === 'border_breach');
assert('s6.13-applied-record-only', reactProtect.appliedResponse === 'record_only' && reactProtect.packResponse === 'protect');

const ignore = evaluateIncidentReact(() => 'investigate', {
  packProfileId: 'vulcan',
  role: 'patrol',
  incident: { kind: 'distress' },
  known: false,
});
assert('s6.7-ignorant-ignore', ignore.appliedResponse === 'ignore_unknown');

assert('event-type-inability-skipped', incidentEventType('access_inability') == null);
assert('event-type-destruction-unmatched', incidentEventType('destruction', {}) == null);
assert('event-type-destruction-asset', incidentEventType('destruction', { own_asset_affected: true }) === 'asset_attack');

const flashLedger = createIncidentLedger();
const flashed = pushFlash(flashLedger, { incidentId: refusal.incident.incidentId, kind: 'access_noncompliance', summary: 'FLASH refusal' }, { localElapsedMs: 10, alertsMode: 'all' });
assert('flash-displayed-on-open', flashed.displayed === true);
const secondFlash = pushFlash(flashLedger, { incidentId: refusal.incident.incidentId, kind: 'access_noncompliance', summary: 'FLASH again' }, { localElapsedMs: 11, alertsMode: 'all' });
assert('s6.14-hold-keeps-first-id-available', secondFlash.holdActive === true && flashLedger.alerts.lastFlashId === flashed.entry.flashId);

assert(
  's6.5-incidents-keeps-flash',
  shouldReplaceBanner({ band: 'background', alertsMode: 'incidents', hasUnackedFlash: true, holdActive: false }) === false,
);
assert(
  's6.5-all-hold-keeps-flash',
  shouldReplaceBanner({ band: 'background', alertsMode: 'all', hasUnackedFlash: true, holdActive: true }) === false,
);
assert(
  's6.5-silent-no-flash-banner',
  shouldReplaceBanner({ band: 'flash', alertsMode: 'silent', hasUnackedFlash: false, holdActive: false }) === false,
);
assert('flash-hold-constant', FLASH_HOLD_MS === 4000);

const policies = createPlayerSecurityState('ferengi');
assert('s4-21-default-all-is-active', areAlertsActive(policies) === true);
const silent = setEmpireDefaultDimension(policies, 'alerts', 'silent');
assert('s4-21-silent-is-inactive', areAlertsActive(silent) === false);
const incidentsMode = setEmpireDefaultDimension(policies, 'alerts', 'incidents');
assert('s4-21-incidents-is-active', areAlertsActive(incidentsMode) === true);

const capLedger = createIncidentLedger();
for (let i = 0; i < 16; i += 1) {
  openIncident(capLedger, {
    kind: 'distress',
    systemIndex: 0,
    actor: { instanceId: `vis-${i}`, kind: 'npc' },
    links: { distressKey: `d-${i}` },
    clocks: { localElapsedMs: i },
  });
}
const full = openIncident(capLedger, {
  kind: 'distress',
  systemIndex: 0,
  actor: { instanceId: 'vis-overflow', kind: 'npc' },
  links: { distressKey: 'overflow' },
  clocks: { localElapsedMs: 99 },
});
assert('s6.11-ledger-full-refuses', full.created === false && full.reason === 'ledger_full');

const restored = restoreIncidentLedger(serializeIncidentLedger(ledger));
assert('s6.9-roundtrip-id', restored.incidents[refusal.incident.incidentId].incidentId === refusal.incident.incidentId);
assert('s6.9-roundtrip-history', restored.incidents[refusal.incident.incidentId].history.some((row) => row.type === 'withdrawn'));

const dirty = restoreIncidentLedger({
  version: 1,
  nextIncidentId: 9,
  incidents: {
    'inc-bad': { incidentId: 'inc-bad', kind: 'not-a-kind', actor: { instanceId: 12 } },
    'inc-ok': {
      incidentId: 'inc-ok',
      kind: 'access_noncompliance',
      systemIndex: 1,
      actor: { instanceId: 'player', kind: 'player' },
      links: { encounterId: 'enc-x' },
    },
  },
});
assert('s6.11-sanitize-drops-invalid', !dirty.incidents['inc-bad'] && dirty.incidents['inc-ok']);

const epochLedger = createIncidentLedger();
openIncident(epochLedger, {
  kind: 'access_noncompliance',
  systemIndex: 4,
  actor: { instanceId: 'player', kind: 'player' },
  links: { encounterId: 'enc-old' },
});
const resolved = resolveAccessIncidentsForEpoch(epochLedger, 4, 'authority_changed');
assert('s6.10-authority-resolves', resolved.length === 1 && epochLedger.incidents[resolved[0].incidentId].status === 'resolved');

appendIncidentEvent(ledger, refusal.incident.incidentId, { atLocalMs: 200, type: 'note', detail: 'operator journal' });
assert('history-bounded-or-present', getHistoryLen(ledger, refusal.incident.incidentId) >= 2);

function getHistoryLen(store, id) {
  return (store.incidents[id]?.history || []).length;
}

assert('idempotency-helper', findIncidentByKey(ledger, incidentIdempotencyKey({
  kind: 'access_noncompliance',
  systemIndex: 11,
  actorInstanceId: 'player',
  encounterId: 'enc-4',
}))?.incidentId === refusal.incident.incidentId);

const empty = restoreIncidentLedger(null);
assert('s6.11-legacy-empty', empty.nextIncidentId === 1 && Object.keys(empty.incidents).length === 0);

const summary = `Phase 4 incident unit checks: ${passed} passed, ${failed} failed`;
console.log(summary);
if (failures.length) console.log(failures.join('\n'));
if (failed) process.exitCode = 1;
