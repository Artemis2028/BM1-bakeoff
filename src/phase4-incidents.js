/**
 * Phase 4 incident ledger, alerts, reports and allowlisted doctrine reactions.
 *
 * Source of truth:
 * - docs/phase4/BM1-PHASE4-INCIDENTS-ESCALATION-ALERTS-PROPOSAL.md
 * - docs/phase4/BM1-PHASE4-ENGINE-DEPENDENCIES.md
 *
 * Hard gates: refusal / expiry / inability are never aggression; kill standing
 * is charged once via punishmentToken; pack protect (and other non-allowlisted
 * responses) fold to record_only; append-only withdrawn/departed history does
 * not pulse FLASH.
 */

import { ALERT_MODES, normalizeAlertMode } from './phase2-security.js';

export const INCIDENT_LEDGER_VERSION = 1;
export const FLASH_HOLD_MS = 4000;
export const MAX_INCIDENTS_RETAINED = 48;
export const MAX_OPEN_INCIDENTS = 16;
export const MAX_REPORTS = 24;
export const MAX_FLASH_QUEUE = 12;
export const MAX_HISTORY_ROWS = 8;
export const INCIDENT_SEARCH_MS = 20000;

export const INCIDENT_KINDS = Object.freeze([
  'access_noncompliance',
  'access_inability',
  'access_notice',
  'destruction',
  'capture',
  'distress',
  'witnessed_aggression',
  'asset_overdue',
]);

export const ACCESS_FEED_KINDS = Object.freeze(['access_noncompliance', 'access_inability']);

export const FLASH_ELIGIBLE_KINDS = Object.freeze([
  'access_noncompliance',
  'access_inability',
  'destruction',
  'distress',
  'asset_overdue',
]);

export const ACTING_ALLOWLIST = Object.freeze([
  'record_only',
  'investigate',
  'rescue',
  'defer:investigate',
  'defer:rescue',
  'ignore_unknown',
]);

export const NON_ACTING_FOLD = Object.freeze([
  'protect',
  'conceal',
  'reroute',
  'negotiate',
]);

const KIND_SET = new Set(INCIDENT_KINDS);
const ALERT_SET = new Set(ALERT_MODES);
const SEVERITY_BY_KIND = {
  access_noncompliance: 'administrative',
  access_inability: 'inability',
  access_notice: 'administrative',
  destruction: 'combat',
  capture: 'administrative',
  distress: 'distress',
  witnessed_aggression: 'combat',
  asset_overdue: 'overdue',
};

function normalizeKey(value, fallback = '') {
  const key = String(value ?? '').trim().toLowerCase();
  return key && key !== 'undefined' && key !== 'null' ? key : fallback;
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function clampHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((row) => row && typeof row === 'object')
    .map((row) => ({
      atLocalMs: Math.max(0, Number(row.atLocalMs) || 0),
      type: String(row.type || 'note'),
      detail: String(row.detail || ''),
      flash: Boolean(row.flash),
    }))
    .slice(-MAX_HISTORY_ROWS);
}

export function createIncidentLedger(extras = {}) {
  return {
    version: INCIDENT_LEDGER_VERSION,
    nextIncidentId: Math.max(1, Number(extras.nextIncidentId) || 1),
    nextReportId: Math.max(1, Number(extras.nextReportId) || 1),
    incidents: extras.incidents && typeof extras.incidents === 'object' ? extras.incidents : {},
    reports: extras.reports && typeof extras.reports === 'object' ? extras.reports : {},
    observerCopies: extras.observerCopies && typeof extras.observerCopies === 'object' ? extras.observerCopies : {},
    alerts: {
      flashQueue: Array.isArray(extras.alerts?.flashQueue) ? extras.alerts.flashQueue.slice(-MAX_FLASH_QUEUE) : [],
      lastAcknowledgedId: extras.alerts?.lastAcknowledgedId ?? null,
      lastFlashId: extras.alerts?.lastFlashId ?? null,
      lastFlashAtLocalMs: Math.max(0, Number(extras.alerts?.lastFlashAtLocalMs) || 0),
    },
    punishmentTokens: extras.punishmentTokens && typeof extras.punishmentTokens === 'object'
      ? { ...extras.punishmentTokens }
      : {},
    strategicJumps: Math.max(0, Number(extras.strategicJumps) || 0),
  };
}

export function emptyIncidentLedger() {
  return createIncidentLedger();
}

export function listIncidents(ledger) {
  return Object.values(ledger?.incidents || {});
}

export function getIncident(ledger, incidentId) {
  if (!ledger || incidentId == null) return null;
  return ledger.incidents[String(incidentId)] || null;
}

export function listIncidentsForSystem(ledger, systemIndex) {
  return listIncidents(ledger).filter((row) => Number(row.systemIndex) === Number(systemIndex));
}

export function listIncidentsForVisitor(ledger, instanceId) {
  const id = String(instanceId || '');
  return listIncidents(ledger).filter((row) => String(row.actor?.instanceId || '') === id);
}

export function listOpenIncidents(ledger) {
  return listIncidents(ledger).filter((row) => row.status === 'open');
}

export function incidentIdempotencyKey({
  kind,
  systemIndex,
  actorInstanceId,
  encounterId = null,
  attackId = null,
  destructionKey = null,
  distressKey = null,
} = {}) {
  const fact = encounterId || attackId || destructionKey || distressKey || 'none';
  return `${kind}:${Number(systemIndex)}:${actorInstanceId || 'unknown'}:${fact}`;
}

export function findIncidentByKey(ledger, key) {
  if (!key) return null;
  return listIncidents(ledger).find((row) => row.idempotencyKey === key) || null;
}

function nextIncidentId(ledger) {
  const id = `inc-${ledger.nextIncidentId || 1}`;
  ledger.nextIncidentId = (ledger.nextIncidentId || 1) + 1;
  return id;
}

function nextReportId(ledger) {
  const id = `rep-${ledger.nextReportId || 1}`;
  ledger.nextReportId = (ledger.nextReportId || 1) + 1;
  return id;
}

export function makePunishmentToken({
  credit = 'none',
  systemIndex = 0,
  victimInstanceId = 'unknown',
  localElapsedMs = 0,
} = {}) {
  const bucket = Math.floor(Math.max(0, Number(localElapsedMs) || 0) / 1000);
  return `kill:${credit || 'none'}:${Number(systemIndex)}:${victimInstanceId || 'unknown'}:${bucket}`;
}

export function rememberPunishment(ledger, token) {
  if (!ledger || !token || token === 'none') return false;
  if (ledger.punishmentTokens[token]) return false;
  ledger.punishmentTokens[token] = true;
  return true;
}

export function punishmentAlreadyApplied(ledger, token) {
  if (!token || token === 'none') return false;
  return Boolean(ledger?.punishmentTokens?.[token]);
}

/**
 * Incident / report / doctrine paths must use this instead of raw standing
 * adjusters. The combat cascade charges first and then stamps the token.
 */
export function applyStandingOnce(ledger, token, applyFn) {
  if (punishmentAlreadyApplied(ledger, token)) {
    return { applied: false, reason: 'already-charged' };
  }
  if (typeof applyFn === 'function') applyFn();
  rememberPunishment(ledger, token);
  return { applied: true };
}

function pruneResolvedIncidents(ledger) {
  const resolved = listIncidents(ledger)
    .filter((row) => row.status !== 'open')
    .sort((a, b) => Number(a.clocks?.localElapsedMs || 0) - Number(b.clocks?.localElapsedMs || 0));
  const overflow = Math.max(0, listIncidents(ledger).length - MAX_INCIDENTS_RETAINED);
  if (overflow <= 0) return;
  let dropped = 0;
  for (const row of resolved) {
    if (dropped >= overflow) break;
    delete ledger.incidents[row.incidentId];
    dropped += 1;
  }
}

export function openIncident(ledger, input = {}) {
  const store = ledger || createIncidentLedger();
  const kind = KIND_SET.has(input.kind) ? input.kind : null;
  if (!kind) return { incident: null, created: false, reason: 'invalid_kind' };
  if (kind === 'access_notice') {
    return { incident: null, created: false, reason: 'access_notice_reserved' };
  }

  const key = input.idempotencyKey || incidentIdempotencyKey({
    kind,
    systemIndex: input.systemIndex,
    actorInstanceId: input.actor?.instanceId,
    encounterId: input.links?.encounterId,
    attackId: input.links?.attackId,
    destructionKey: input.links?.destructionKey,
    distressKey: input.links?.distressKey,
  });
  const existing = findIncidentByKey(store, key);
  if (existing) return { incident: existing, created: false, reason: 'duplicate' };

  if (listOpenIncidents(store).length >= MAX_OPEN_INCIDENTS) {
    return { incident: null, created: false, reason: 'ledger_full' };
  }

  const incident = {
    incidentId: nextIncidentId(store),
    version: 1,
    kind,
    severity: input.severity || SEVERITY_BY_KIND[kind] || 'administrative',
    status: 'open',
    systemIndex: Number(input.systemIndex),
    locationId: input.locationId || null,
    jurisdictionId: input.jurisdictionId || null,
    authoritySide: normalizeKey(input.authoritySide) || null,
    authorityEpoch: Math.max(0, Number(input.authorityEpoch) || 0),
    actor: {
      instanceId: input.actor?.instanceId != null ? String(input.actor.instanceId) : null,
      kind: input.actor?.kind || 'npc',
      sideId: input.actor?.sideId || null,
      broadcast: input.actor?.broadcast ? { ...input.actor.broadcast } : null,
      role: input.actor?.role ?? null,
    },
    victim: {
      instanceId: input.victim?.instanceId != null ? String(input.victim.instanceId) : null,
      kind: input.victim?.kind || (kind.startsWith('access_') ? 'authority' : 'npc'),
      sideId: input.victim?.sideId || null,
    },
    action: input.action || kind,
    clocks: {
      localElapsedMs: Math.max(0, Number(input.clocks?.localElapsedMs) || 0),
      strategicJumps: Math.max(0, Number(input.clocks?.strategicJumps) || 0),
      issuedAtLocalMs: Math.max(0, Number(input.clocks?.issuedAtLocalMs) || 0),
    },
    outcome: input.outcome || null,
    links: {
      encounterId: input.links?.encounterId || null,
      zoneId: input.links?.zoneId || null,
      entryEpisode: input.links?.entryEpisode != null ? Number(input.links.entryEpisode) : null,
      attackId: input.links?.attackId || null,
      destructionKey: input.links?.destructionKey || null,
      distressKey: input.links?.distressKey || null,
      overdueKey: input.links?.overdueKey || null,
      assignmentId: input.links?.assignmentId || null,
      objectiveId: input.links?.objectiveId || null,
      punishmentToken: ACCESS_FEED_KINDS.includes(kind) ? 'none' : (input.links?.punishmentToken || null),
      punishmentApplied: input.links?.punishmentApplied || (ACCESS_FEED_KINDS.includes(kind) ? 'none' : null),
    },
    truth: {
      identified: input.truth?.identified !== false,
      attributed: input.truth?.attributed !== false,
      confidence: Number.isFinite(Number(input.truth?.confidence)) ? Number(input.truth.confidence) : 1,
      notes: String(input.truth?.notes || ''),
      blockingReason: input.truth?.blockingReason || null,
      offense: kind === 'access_noncompliance' ? 'administrative' : (kind === 'access_inability' ? 'none' : (input.truth?.offense || null)),
    },
    history: clampHistory(input.history || [{
      atLocalMs: Number(input.clocks?.localElapsedMs) || 0,
      type: 'opened',
      detail: input.historyDetail || kind,
      flash: FLASH_ELIGIBLE_KINDS.includes(kind),
    }]),
    idempotencyKey: key,
    lastKnown: input.lastKnown && typeof input.lastKnown === 'object'
      ? { x: Number(input.lastKnown.x) || 0, y: Number(input.lastKnown.y) || 0 }
      : null,
    sayable: input.sayable || defaultIncidentLine({ kind, ...input }),
  };

  if (incident.links.punishmentToken && incident.links.punishmentToken !== 'none') {
    rememberPunishment(store, incident.links.punishmentToken);
  }

  store.incidents[incident.incidentId] = incident;
  pruneResolvedIncidents(store);
  return { incident, created: true, reason: 'opened' };
}

export function appendIncidentEvent(ledger, incidentId, event = {}) {
  const incident = getIncident(ledger, incidentId);
  if (!incident) return null;
  const row = {
    atLocalMs: Math.max(0, Number(event.atLocalMs) || 0),
    type: String(event.type || 'note'),
    detail: String(event.detail || ''),
    flash: false,
  };
  incident.history = clampHistory([...(incident.history || []), row]);
  return incident;
}

export function resolveIncident(ledger, incidentId, reason = 'closed') {
  const incident = getIncident(ledger, incidentId);
  if (!incident) return null;
  incident.status = reason === 'superseded' ? 'superseded' : 'resolved';
  incident.resolveReason = String(reason || 'closed');
  appendIncidentEvent(ledger, incidentId, {
    atLocalMs: incident.clocks?.localElapsedMs || 0,
    type: 'resolved',
    detail: reason,
  });
  pruneResolvedIncidents(ledger);
  return incident;
}

export function encounterFeedsAccessIncident(lifecycle) {
  return lifecycle === 'refused' || lifecycle === 'expired' || lifecycle === 'unable_to_comply';
}

export function encounterAppendsAccessHistory(lifecycle) {
  return lifecycle === 'withdrawn' || lifecycle === 'departed';
}

export function encounterResolvesAccessJurisdiction(lifecycle) {
  return lifecycle === 'authority_changed' || lifecycle === 'contact_lost' || lifecycle === 'checkpoint_unavailable';
}

export function linkEncounterToIncident(ledger, encounter, extras = {}) {
  if (!ledger || !encounter) return { incident: null, created: false, reason: 'missing', flash: false };
  const lifecycle = extras.lifecycle || encounter.lifecycle;
  const localElapsedMs = extras.localElapsedMs != null ? extras.localElapsedMs : encounter.lastUpdateLocalMs;

  if (lifecycle === 'visitor_destroyed') {
    return { incident: null, created: false, reason: 'visitor_destroyed', flash: false };
  }

  const existingForEncounter = listIncidents(ledger).find((row) => (
    ACCESS_FEED_KINDS.includes(row.kind)
    && row.links?.encounterId === encounter.encounterId
  ));

  if (encounterAppendsAccessHistory(lifecycle)) {
    const prior = existingForEncounter || listIncidentsForVisitor(ledger, encounter.visitorInstanceId).find((row) => (
      row.kind === 'access_noncompliance'
      && Number(row.systemIndex) === Number(encounter.systemIndex)
      && Number(row.links?.entryEpisode) === Number(encounter.entryEpisode)
      && row.status === 'open'
    ));
    if (prior && (encounter.outcome === 'noncompliant' || prior.kind === 'access_noncompliance' || extras.keepNoncompliant)) {
      appendIncidentEvent(ledger, prior.incidentId, {
        atLocalMs: localElapsedMs,
        type: lifecycle,
        detail: extras.detail || lifecycle,
      });
      return {
        incident: prior,
        created: false,
        reason: 'append-only',
        flash: false,
        appended: true,
      };
    }
    return { incident: null, created: false, reason: 'no-prior-noncompliance', flash: false };
  }

  if (encounterResolvesAccessJurisdiction(lifecycle)) {
    const openAccess = listIncidents(ledger).filter((row) => (
      ACCESS_FEED_KINDS.includes(row.kind)
      && row.status === 'open'
      && Number(row.systemIndex) === Number(encounter.systemIndex)
      && (row.links?.encounterId === encounter.encounterId || row.actor?.instanceId === encounter.visitorInstanceId)
    ));
    for (const row of openAccess) {
      resolveIncident(ledger, row.incidentId, lifecycle === 'authority_changed' ? 'authority_changed' : 'jurisdiction_lost');
    }
    return { incident: openAccess[0] || null, created: false, reason: lifecycle, flash: false };
  }

  if (!encounterFeedsAccessIncident(lifecycle)) {
    return { incident: null, created: false, reason: 'no-incident', flash: false };
  }

  const kind = lifecycle === 'unable_to_comply' ? 'access_inability' : 'access_noncompliance';
  const opened = openIncident(ledger, {
    kind,
    systemIndex: encounter.systemIndex,
    locationId: extras.locationId,
    jurisdictionId: extras.jurisdictionId,
    authoritySide: encounter.authoritySide,
    authorityEpoch: encounter.authorityEpoch,
    actor: extras.actor || {
      instanceId: encounter.visitorInstanceId,
      kind: encounter.visitorKind || 'npc',
      sideId: extras.actorSideId || null,
      broadcast: extras.broadcast || null,
      role: extras.role || null,
    },
    victim: {
      instanceId: null,
      kind: 'authority',
      sideId: encounter.authoritySide,
    },
    action: lifecycle === 'unable_to_comply' ? 'unable_to_comply' : 'refused_challenge',
    clocks: {
      localElapsedMs,
      strategicJumps: extras.strategicJumps || 0,
      issuedAtLocalMs: encounter.issuedAtLocalMs,
    },
    outcome: kind === 'access_noncompliance' ? 'noncompliant' : lifecycle,
    links: {
      encounterId: encounter.encounterId,
      zoneId: encounter.zoneId,
      entryEpisode: encounter.entryEpisode,
      punishmentToken: 'none',
      punishmentApplied: 'none',
    },
    truth: {
      notes: extras.detail || (kind === 'access_inability' ? `Unable to comply: ${extras.blockingReason || 'blocked'}.` : 'Visitor refused or expired an issued challenge.'),
      blockingReason: extras.blockingReason || extras.detail || null,
      offense: kind === 'access_inability' ? 'none' : 'administrative',
    },
    sayable: extras.sayable,
  });

  return { ...opened, flash: Boolean(opened.created && FLASH_ELIGIBLE_KINDS.includes(kind)) };
}

export function defaultIncidentLine(input = {}) {
  const authority = input.authorityLabel || input.authoritySide || 'Checkpoint';
  if (input.kind === 'access_inability') {
    const block = input.truth?.blockingReason || input.blockingReason || 'blocked';
    return `Unable to comply: ${block}. No offense recorded.`;
  }
  if (input.kind === 'access_noncompliance') {
    return `${authority} checkpoint: visitor refused identity check. Administrative record only — weapons unchanged.`;
  }
  if (input.kind === 'destruction') {
    return 'Destruction attributed. Standing already applied by combat rules.';
  }
  if (input.kind === 'distress') {
    return 'Distress observed. Rescue may proceed if survivors are known.';
  }
  if (input.kind === 'asset_overdue') {
    return 'Freighter assignment missed check-in. Overdue — not confirmed destroyed. No attacker identified. Standing unchanged.';
  }
  if (input.kind === 'witnessed_aggression') {
    return 'Attributed attack recorded. Weapons remain on existing ROE.';
  }
  return 'Incident recorded.';
}

export function shouldPulseFlash(kind, { appendOnly = false, actingStart = false } = {}) {
  if (appendOnly) return false;
  if (actingStart) return true;
  return FLASH_ELIGIBLE_KINDS.includes(kind);
}

export function pushFlash(ledger, notice = {}, { localElapsedMs = 0, alertsMode = 'all' } = {}) {
  const store = ledger || createIncidentLedger();
  if (!store.alerts) store.alerts = { flashQueue: [], lastAcknowledgedId: null, lastFlashId: null, lastFlashAtLocalMs: 0 };
  const entry = {
    flashId: notice.flashId || `flash-${store.alerts.flashQueue.length + 1}-${store.nextIncidentId || 1}`,
    incidentId: notice.incidentId || null,
    kind: notice.kind || null,
    summary: String(notice.summary || notice.sayable || 'FLASH'),
    atLocalMs: Math.max(0, Number(notice.atLocalMs != null ? notice.atLocalMs : localElapsedMs) || 0),
    acknowledged: false,
    priority: 1,
  };
  const previousId = store.alerts.lastFlashId;
  const previousAt = Number(store.alerts.lastFlashAtLocalMs) || 0;
  const holdActive = previousId && !store.alerts.flashQueue.find((row) => row.flashId === previousId && row.acknowledged)
    && (entry.atLocalMs - previousAt) < FLASH_HOLD_MS;
  const silent = normalizeAlertMode(alertsMode) === 'silent';
  store.alerts.flashQueue = [...store.alerts.flashQueue, entry].slice(-MAX_FLASH_QUEUE);
  if (!silent && !holdActive) {
    store.alerts.lastFlashId = entry.flashId;
    store.alerts.lastFlashAtLocalMs = entry.atLocalMs;
  }
  return {
    entry,
    displayed: !silent && !holdActive,
    holdActive: Boolean(holdActive && !silent),
    silent,
    previousFlashId: previousId,
  };
}

export function currentFlash(ledger) {
  const queue = ledger?.alerts?.flashQueue || [];
  const lastId = ledger?.alerts?.lastFlashId;
  const current = queue.find((row) => row.flashId === lastId) || queue.filter((row) => !row.acknowledged).slice(-1)[0] || null;
  if (!current || current.acknowledged) return null;
  return current;
}

export function acknowledgeFlash(ledger, flashId = null, localElapsedMs = 0) {
  const current = flashId
    ? (ledger?.alerts?.flashQueue || []).find((row) => row.flashId === flashId)
    : currentFlash(ledger);
  if (!current) return null;
  current.acknowledged = true;
  ledger.alerts.lastAcknowledgedId = current.flashId;
  if (ledger.alerts.lastFlashId === current.flashId) {
    ledger.alerts.lastFlashId = null;
  }
  current.acknowledgedAtLocalMs = localElapsedMs;
  return current;
}

export function flashHoldActive(ledger, localElapsedMs, holdMs = FLASH_HOLD_MS) {
  const current = currentFlash(ledger);
  if (!current) return false;
  return (Number(localElapsedMs) - Number(current.atLocalMs || 0)) < holdMs;
}

export function classifyLogBand(message, opts = {}) {
  if (opts.band) return opts.band;
  if (opts.flash || opts.incidentClass) return 'flash';
  const text = String(message || '');
  if (text.startsWith('FLASH')) return 'flash';
  if (/salvage recovered/i.test(text) || /jump-complete|market|latinum\./i.test(text)) return 'background';
  return 'operational';
}

/**
 * Banner gate. Background/operational logs must not eat an unacked FLASH.
 * `incidents` keeps FLASH until acknowledge. `all` allows replace after hold.
 * `silent` never shows incident-class notices.
 */
export function shouldReplaceBanner({
  band,
  alertsMode,
  hasUnackedFlash,
  holdActive,
} = {}) {
  const mode = normalizeAlertMode(alertsMode);
  if (band === 'flash') return mode !== 'silent';
  if (!hasUnackedFlash) return true;
  if (mode === 'silent') return true;
  if (mode === 'incidents') return false;
  if (holdActive) return false;
  return true;
}

export function effectiveAlertsMode(policy) {
  return normalizeAlertMode(policy?.alerts ?? policy?.empireDefault?.alerts);
}

export function areIncidentAlertsActive(policy) {
  return effectiveAlertsMode(policy) !== 'silent';
}

export function showsBackgroundLogs(policy) {
  return effectiveAlertsMode(policy) === 'all';
}

export function incrementStrategicJumps(ledger) {
  if (!ledger) return 0;
  ledger.strategicJumps = (Number(ledger.strategicJumps) || 0) + 1;
  return ledger.strategicJumps;
}

export function deliverReport(ledger, input = {}) {
  const store = ledger || createIncidentLedger();
  const incidentId = input.incidentId;
  const senderKey = String(input.senderKey || '');
  const recipientKey = String(input.recipientKey || '');
  if (!incidentId || !senderKey || !recipientKey) {
    return { report: null, created: false, reason: 'invalid' };
  }
  const dupe = Object.values(store.reports || {}).find((row) => (
    row.incidentId === incidentId && row.senderKey === senderKey && row.recipientKey === recipientKey
  ));
  if (dupe) return { report: dupe, created: false, reason: 'duplicate' };
  if (Object.keys(store.reports).length >= MAX_REPORTS) {
    const oldest = Object.values(store.reports).sort((a, b) => Number(a.freshnessLocalMs) - Number(b.freshnessLocalMs))[0];
    if (oldest) delete store.reports[oldest.reportId];
  }
  const report = {
    reportId: nextReportId(store),
    incidentId,
    senderKey,
    recipientKey,
    provenance: input.provenance || 'direct_observation',
    identification: input.identification || 'known',
    attribution: input.attribution || 'attributed',
    confidence: Number.isFinite(Number(input.confidence)) ? Number(input.confidence) : 1,
    freshnessLocalMs: Math.max(0, Number(input.freshnessLocalMs) || 0),
    payload: {
      kind: input.payload?.kind || getIncident(store, incidentId)?.kind || null,
      summary: input.payload?.summary || getIncident(store, incidentId)?.sayable || '',
      locationId: input.payload?.locationId || getIncident(store, incidentId)?.locationId || null,
      lastKnown: input.payload?.lastKnown || getIncident(store, incidentId)?.lastKnown || null,
    },
    delivered: input.delivered !== false,
  };
  store.reports[report.reportId] = report;
  const observerKey = recipientKey;
  if (!store.observerCopies[observerKey]) {
    store.observerCopies[observerKey] = { knownIncidentIds: [], lastEvaluated: {} };
  }
  const copy = store.observerCopies[observerKey];
  if (!copy.knownIncidentIds.includes(incidentId)) copy.knownIncidentIds.push(incidentId);
  return { report, created: true, reason: 'delivered' };
}

export function observerKnowsIncident(ledger, observerKey, incidentId) {
  return Boolean(ledger?.observerCopies?.[observerKey]?.knownIncidentIds?.includes(incidentId));
}

export function grantObserverCopy(ledger, observerKey, incidentId, extras = {}) {
  if (!ledger || !observerKey || !incidentId) return null;
  if (!ledger.observerCopies[observerKey]) {
    ledger.observerCopies[observerKey] = { knownIncidentIds: [], lastEvaluated: {} };
  }
  const copy = ledger.observerCopies[observerKey];
  if (!copy.knownIncidentIds.includes(incidentId)) copy.knownIncidentIds.push(incidentId);
  if (extras.decision) copy.lastEvaluated[incidentId] = extras.decision;
  return copy;
}

export function lastObserverDecision(ledger, observerKey, incidentId = null) {
  const copy = ledger?.observerCopies?.[observerKey];
  if (!copy) return null;
  if (incidentId) return copy.lastEvaluated?.[incidentId] || null;
  const keys = Object.keys(copy.lastEvaluated || {});
  return keys.length ? copy.lastEvaluated[keys[keys.length - 1]] : null;
}

export function incidentEventType(kind, facts = {}) {
  if (kind === 'access_noncompliance') return 'border_breach';
  if (kind === 'access_inability') return null;
  if (kind === 'distress') return 'distress';
  if (kind === 'asset_overdue') return 'asset_overdue';
  if (kind === 'destruction') return facts.asset_attacked || facts.own_asset_affected ? 'asset_attack' : null;
  if (kind === 'witnessed_aggression') return 'asset_attack';
  return null;
}

export function foldDoctrineResponse(packResponse) {
  const raw = String(packResponse || '');
  if (!raw || raw === 'inactive') {
    return { packResponse: raw || null, appliedResponse: 'record_only', acting: false };
  }
  if (raw === 'ignore_unknown') {
    return { packResponse: raw, appliedResponse: 'ignore_unknown', acting: false };
  }
  if (raw.startsWith('defer:')) {
    return { packResponse: raw, appliedResponse: raw, acting: false };
  }
  if (ACTING_ALLOWLIST.includes(raw)) {
    return {
      packResponse: raw,
      appliedResponse: raw,
      acting: raw === 'investigate' || raw === 'rescue',
    };
  }
  return { packResponse: raw, appliedResponse: 'record_only', acting: false };
}

export function observerFactsFromCopy(known, extras = {}) {
  if (!known) return { event_known: false };
  const facts = { event_known: true };
  const optional = [
    'credible_report',
    'event_actionable',
    'own_asset_affected',
    'protected_party_affected',
    'linked_own_losses',
    'survivors_known',
    'can_respond',
    'can_investigate',
    'can_rescue',
    'evidence_available',
    'usable_search_area',
    'mission_investigate_active',
    'mission_rescue_active',
    'asset_attacked',
  ];
  for (const key of optional) {
    if (extras[key] === true) facts[key] = true;
  }
  return facts;
}

export function evaluateIncidentReact(evaluateReact, {
  packProfileId,
  role,
  incident,
  known,
  facts = {},
  cultureId = null,
} = {}) {
  if (!known) {
    const folded = foldDoctrineResponse('ignore_unknown');
    return { ...folded, eventType: null, facts: { event_known: false } };
  }
  const eventType = incidentEventType(incident?.kind, facts);
  if (!eventType || typeof evaluateReact !== 'function') {
    const folded = foldDoctrineResponse('record_only');
    return { ...folded, eventType, facts: observerFactsFromCopy(true, facts) };
  }
  const reactFacts = observerFactsFromCopy(true, facts);
  const packResponse = evaluateReact(packProfileId, role, eventType, reactFacts, cultureId);
  const folded = foldDoctrineResponse(packResponse);
  return { ...folded, eventType, facts: reactFacts };
}

export function createIncidentObjective({
  kind,
  incidentId,
  target = null,
  startedAtLocalMs = 0,
  searchMs = INCIDENT_SEARCH_MS,
  displayName = null,
} = {}) {
  const acting = kind === 'investigate' || kind === 'rescue';
  return {
    kind,
    incidentId,
    target: target ? { x: Number(target.x) || 0, y: Number(target.y) || 0 } : null,
    startedAtLocalMs: Math.max(0, Number(startedAtLocalMs) || 0),
    searchUntilLocalMs: Math.max(0, Number(startedAtLocalMs) || 0) + Math.max(1000, Number(searchMs) || INCIDENT_SEARCH_MS),
    displayName: displayName || (kind === 'rescue' ? 'rescue survivors' : 'investigate last-known'),
    fireCapable: false,
    engagementObjectiveActive: false,
    warOrderActive: false,
    attackId: null,
    acting,
  };
}

export function incidentObjectiveIsFireCapable(objective) {
  return Boolean(objective?.fireCapable || objective?.kind === 'protect' || objective?.kind === 'intercept');
}

export function incidentObjectiveExpired(objective, localElapsedMs) {
  if (!objective) return true;
  return Number(localElapsedMs) >= Number(objective.searchUntilLocalMs || 0);
}

function sanitizeActor(raw) {
  if (!raw || typeof raw !== 'object') return { instanceId: null, kind: 'npc', sideId: null, broadcast: null, role: null };
  return {
    instanceId: raw.instanceId != null ? String(raw.instanceId) : null,
    kind: raw.kind === 'player' || raw.kind === 'authority' ? raw.kind : 'npc',
    sideId: raw.sideId != null ? String(raw.sideId) : null,
    broadcast: raw.broadcast && typeof raw.broadcast === 'object'
      ? { faction: normalizeKey(raw.broadcast.faction), source: raw.broadcast.source || 'hull' }
      : null,
    role: raw.role != null ? String(raw.role) : null,
  };
}

function sanitizeIncident(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const kind = KIND_SET.has(raw.kind) ? raw.kind : null;
  if (!kind || !raw.incidentId) return null;
  const actor = sanitizeActor(raw.actor);
  return {
    incidentId: String(raw.incidentId),
    version: 1,
    kind,
    severity: raw.severity || SEVERITY_BY_KIND[kind],
    status: raw.status === 'resolved' || raw.status === 'superseded' ? raw.status : 'open',
    systemIndex: Number(raw.systemIndex),
    locationId: raw.locationId != null ? String(raw.locationId) : null,
    jurisdictionId: raw.jurisdictionId != null ? String(raw.jurisdictionId) : null,
    authoritySide: normalizeKey(raw.authoritySide) || null,
    authorityEpoch: Math.max(0, Number(raw.authorityEpoch) || 0),
    actor,
    victim: sanitizeActor(raw.victim),
    action: raw.action != null ? String(raw.action) : kind,
    clocks: {
      localElapsedMs: Math.max(0, Number(raw.clocks?.localElapsedMs) || 0),
      strategicJumps: Math.max(0, Number(raw.clocks?.strategicJumps) || 0),
      issuedAtLocalMs: Math.max(0, Number(raw.clocks?.issuedAtLocalMs) || 0),
    },
    outcome: raw.outcome != null ? String(raw.outcome) : null,
    links: {
      encounterId: raw.links?.encounterId != null ? String(raw.links.encounterId) : null,
      zoneId: raw.links?.zoneId != null ? String(raw.links.zoneId) : null,
      entryEpisode: raw.links?.entryEpisode != null ? Number(raw.links.entryEpisode) : null,
      attackId: raw.links?.attackId != null ? String(raw.links.attackId) : null,
      destructionKey: raw.links?.destructionKey != null ? String(raw.links.destructionKey) : null,
      distressKey: raw.links?.distressKey != null ? String(raw.links.distressKey) : null,
      overdueKey: raw.links?.overdueKey != null ? String(raw.links.overdueKey) : null,
      assignmentId: raw.links?.assignmentId != null ? String(raw.links.assignmentId) : null,
      objectiveId: raw.links?.objectiveId != null ? String(raw.links.objectiveId) : null,
      punishmentToken: raw.links?.punishmentToken != null ? String(raw.links.punishmentToken) : (ACCESS_FEED_KINDS.includes(kind) ? 'none' : null),
      punishmentApplied: raw.links?.punishmentApplied != null ? String(raw.links.punishmentApplied) : null,
    },
    truth: {
      identified: raw.truth?.identified !== false,
      attributed: raw.truth?.attributed !== false,
      confidence: Number.isFinite(Number(raw.truth?.confidence)) ? Number(raw.truth.confidence) : 1,
      notes: String(raw.truth?.notes || ''),
      blockingReason: raw.truth?.blockingReason || null,
      offense: raw.truth?.offense || (kind === 'access_inability' ? 'none' : null),
    },
    history: clampHistory(raw.history),
    idempotencyKey: raw.idempotencyKey != null ? String(raw.idempotencyKey) : incidentIdempotencyKey({
      kind,
      systemIndex: raw.systemIndex,
      actorInstanceId: actor.instanceId,
      encounterId: raw.links?.encounterId,
      attackId: raw.links?.attackId,
      destructionKey: raw.links?.destructionKey,
      distressKey: raw.links?.distressKey,
    }),
    lastKnown: raw.lastKnown && typeof raw.lastKnown === 'object'
      ? { x: Number(raw.lastKnown.x) || 0, y: Number(raw.lastKnown.y) || 0 }
      : null,
    sayable: raw.sayable != null ? String(raw.sayable) : defaultIncidentLine({ kind, authoritySide: raw.authoritySide, truth: raw.truth }),
    resolveReason: raw.resolveReason != null ? String(raw.resolveReason) : null,
  };
}

function sanitizeReport(raw) {
  if (!raw || typeof raw !== 'object' || !raw.reportId) return null;
  return {
    reportId: String(raw.reportId),
    incidentId: String(raw.incidentId || ''),
    senderKey: String(raw.senderKey || ''),
    recipientKey: String(raw.recipientKey || ''),
    provenance: raw.provenance || 'direct_observation',
    identification: raw.identification || 'known',
    attribution: raw.attribution || 'attributed',
    confidence: Number.isFinite(Number(raw.confidence)) ? Number(raw.confidence) : 1,
    freshnessLocalMs: Math.max(0, Number(raw.freshnessLocalMs) || 0),
    payload: raw.payload && typeof raw.payload === 'object' ? { ...raw.payload } : {},
    delivered: raw.delivered !== false,
  };
}

export function serializeIncidentLedger(ledger) {
  const state = createIncidentLedger(ledger);
  return {
    version: INCIDENT_LEDGER_VERSION,
    nextIncidentId: state.nextIncidentId,
    nextReportId: state.nextReportId,
    incidents: clone(state.incidents || {}),
    reports: clone(state.reports || {}),
    observerCopies: clone(state.observerCopies || {}),
    alerts: clone(state.alerts || { flashQueue: [], lastAcknowledgedId: null }),
    punishmentTokens: { ...(state.punishmentTokens || {}) },
    strategicJumps: state.strategicJumps,
  };
}

export function restoreIncidentLedger(saved) {
  if (!saved || typeof saved !== 'object') return createIncidentLedger();
  const incidents = {};
  for (const [id, raw] of Object.entries(saved.incidents || {})) {
    const clean = sanitizeIncident(raw);
    if (clean?.incidentId) incidents[id] = clean;
  }
  const reports = {};
  for (const [id, raw] of Object.entries(saved.reports || {})) {
    const clean = sanitizeReport(raw);
    if (clean?.reportId) reports[id] = clean;
  }
  const observerCopies = {};
  for (const [key, raw] of Object.entries(saved.observerCopies || {})) {
    if (!raw || typeof raw !== 'object') continue;
    observerCopies[String(key)] = {
      knownIncidentIds: Array.isArray(raw.knownIncidentIds) ? raw.knownIncidentIds.map(String) : [],
      lastEvaluated: raw.lastEvaluated && typeof raw.lastEvaluated === 'object' ? { ...raw.lastEvaluated } : {},
    };
  }
  const flashQueue = Array.isArray(saved.alerts?.flashQueue)
    ? saved.alerts.flashQueue.filter((row) => row && typeof row === 'object').map((row) => ({
      flashId: String(row.flashId || ''),
      incidentId: row.incidentId != null ? String(row.incidentId) : null,
      kind: row.kind || null,
      summary: String(row.summary || ''),
      atLocalMs: Math.max(0, Number(row.atLocalMs) || 0),
      acknowledged: Boolean(row.acknowledged),
      priority: 1,
    })).filter((row) => row.flashId).slice(-MAX_FLASH_QUEUE)
    : [];
  return createIncidentLedger({
    nextIncidentId: saved.nextIncidentId,
    nextReportId: saved.nextReportId,
    incidents,
    reports,
    observerCopies,
    alerts: {
      flashQueue,
      lastAcknowledgedId: saved.alerts?.lastAcknowledgedId ?? null,
      lastFlashId: saved.alerts?.lastFlashId ?? null,
      lastFlashAtLocalMs: saved.alerts?.lastFlashAtLocalMs ?? 0,
    },
    punishmentTokens: saved.punishmentTokens,
    strategicJumps: saved.strategicJumps,
  });
}

export function resolveAccessIncidentsForEpoch(ledger, systemIndex, reason = 'authority_changed') {
  const rows = listIncidents(ledger).filter((row) => (
    ACCESS_FEED_KINDS.includes(row.kind)
    && row.status === 'open'
    && Number(row.systemIndex) === Number(systemIndex)
  ));
  for (const row of rows) resolveIncident(ledger, row.incidentId, reason);
  return rows;
}

export { ALERT_SET, clone };
