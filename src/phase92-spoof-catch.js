/**
 * Phase 9.2 — spoof catch-path (gate 3).
 *
 * Focused Scan / silhouette / ECCM may expose a spoof on the observer row.
 * Never rewrites Phase 1 identity. Never auto-fires.
 *
 * Source: docs/phase9/BM1-PHASE9.2-EW-DEPTH-PROPOSAL.md §5
 */

import { findContact, performActiveScan, upsertContact } from './phase6-sensors.js';
import {
  applyForgettingLadder,
  claimRewritesPhase1Identity,
  mismatchVsTrueSide,
  sanitizeTransponderClaim,
} from './phase91-transponder.js';
import { getPhase92Actor, resolvePhase92Defaults } from './phase92-magnitudes.js';

function clampNonNeg(value) {
  return Math.max(0, Number(value) || 0);
}

function normalizeKey(value, fallback = '') {
  const key = String(value ?? '').trim();
  return key && key !== 'undefined' && key !== 'null' ? key : fallback;
}

export function catchRewritesPhase1Identity() {
  return claimRewritesPhase1Identity();
}

export function silhouetteMismatch(claim, observed = {}) {
  const row = sanitizeTransponderClaim(claim);
  if (row.mode !== 'spoof') return false;
  const claimed = normalizeKey(row.spoofedFaction);
  const visual = normalizeKey(observed.visualClass || observed.hullShape || observed.observedClass);
  const faction = normalizeKey(observed.observedFaction || observed.trueSide || observed.faction);
  if (faction && claimed && faction !== claimed) return true;
  if (visual && claimed && visual !== claimed) return true;
  if (observed.mismatch === true) return true;
  return false;
}

export function focusedScanSensorsExtra(book, actorKey, localElapsedMs = 0, extras = {}) {
  const defaults = resolvePhase92Defaults(extras.defaults || book?.defaults || extras.magnitudes);
  const actor = book ? getPhase92Actor(book, actorKey) : null;
  const scan = book?.focusedScans?.[normalizeKey(actorKey)];
  const dwelling = Boolean(
    scan
    && clampNonNeg(localElapsedMs) < clampNonNeg(scan.untilLocalMs)
    && scan.status === 'dwelling',
  );
  if (!dwelling && actor?.focusedScanUntilLocalMs && localElapsedMs < actor.focusedScanUntilLocalMs) {
    return defaults.focusedScanExtraSensorsDraw;
  }
  return dwelling ? defaults.focusedScanExtraSensorsDraw : 0;
}

function writeCatchOnContact(contactBook, observerKey, subjectKey, extras, localElapsedMs) {
  const existing = findContact(contactBook, observerKey, subjectKey) || {};
  const contact = upsertContact(contactBook, observerKey, {
    ...existing,
    subjectKey,
    detected: existing.detected === true || extras.detected !== false,
    spoofExposed: extras.spoofExposed === true,
    catchPath: extras.catchPath || 'focused_scan',
    suspicion: extras.suspicion === true || extras.spoofExposed === true,
    firingSolution: existing.firingSolution === true ? existing.firingSolution : false,
    transponderClaim: extras.claim || existing.transponderClaim,
    freshnessLocalMs: localElapsedMs,
  }, localElapsedMs);
  if (contact) {
    contact.spoofExposed = extras.spoofExposed === true;
    contact.catchPath = extras.catchPath || 'focused_scan';
    contact.suspicion = extras.suspicion === true || extras.spoofExposed === true;
    if (extras.forceNoFs === true) contact.firingSolution = false;
  }
  return contact;
}

/**
 * Start or complete a Focused Scan dwell. Bills Sensors (not ew). Writes
 * a detectable emission. Catch marks the claim, never identity.
 */
export function runFocusedScan(ew92, contactBook, observer, subject, localElapsedMs = 0, extras = {}) {
  const observerKey = normalizeKey(observer?.key || observer?.observerKey || extras.observerKey);
  const subjectKey = normalizeKey(subject?.key || subject?.subjectKey || extras.subjectKey);
  const defaults = resolvePhase92Defaults(extras.defaults || ew92?.defaults || extras.magnitudes);
  const now = clampNonNeg(localElapsedMs);
  const identity = extras.identity && typeof extras.identity === 'object' ? extras.identity : {
    playerFaction: extras.playerFaction,
    playerSide: extras.playerSide,
  };
  const beforeFaction = identity.playerFaction;
  const beforeSide = identity.playerSide;
  if (!observerKey || !subjectKey) {
    return { ok: false, reason: 'missing-keys', rewritten: false, engagement_authorized: undefined };
  }
  if (extras.S === 0) {
    return { ok: false, reason: 's-zero', rewritten: false, engagement_authorized: undefined };
  }

  let scan = ew92?.focusedScans?.[observerKey];
  const startNew = extras.restart === true || !scan || scan.subjectKey !== subjectKey || scan.status === 'result';
  if (startNew) {
    const emission = extras.skipEmission === true
      ? null
      : performActiveScan(contactBook, observer || { key: observerKey, observerKey }, subject || { key: subjectKey, subjectKey }, extras.distance ?? 80, now);
    scan = {
      observerKey,
      subjectKey,
      startedAtLocalMs: now,
      untilLocalMs: now + (extras.dwellMs ?? defaults.focusedScanDwellMs),
      status: extras.completeNow === true ? 'result' : 'dwelling',
      emissionWritten: Boolean(emission?.emission),
      sensorsConsumer: true,
      ewBilled: false,
      firingSolution: false,
    };
    if (ew92) {
      ew92.focusedScans[observerKey] = scan;
      const actor = getPhase92Actor(ew92, observerKey);
      actor.focusedScanUntilLocalMs = scan.untilLocalMs;
    }
    if (extras.completeNow !== true && now < scan.untilLocalMs) {
      return {
        ok: true,
        dwelling: true,
        status: 'dwelling',
        emissionWritten: scan.emissionWritten,
        spoofExposed: false,
        firingSolution: false,
        engagement_authorized: undefined,
        playerFaction: beforeFaction,
        playerSide: beforeSide,
        rewritten: false,
        reman53: extras.reman53,
        sayable: 'Focused Scan dwelling. Emission detectable.',
      };
    }
  }

  const complete = extras.completeNow === true || now >= clampNonNeg(scan.untilLocalMs);
  if (!complete) {
    return {
      ok: true,
      dwelling: true,
      status: 'dwelling',
      emissionWritten: scan.emissionWritten === true,
      spoofExposed: false,
      firingSolution: false,
      engagement_authorized: undefined,
      playerFaction: beforeFaction,
      playerSide: beforeSide,
      rewritten: false,
    };
  }

  const claim = extras.claim || extras.transponderClaim || findContact(contactBook, observerKey, subjectKey)?.transponderClaim;
  const row = sanitizeTransponderClaim(claim);
  const trueSide = normalizeKey(extras.trueSide || extras.observedFaction || extras.observed?.trueSide);
  const mismatch = mismatchVsTrueSide(row, trueSide)
    || silhouetteMismatch(row, extras.observed || extras)
    || (row.mode === 'spoof' && extras.mismatch !== false);
  const eccmHelps = extras.eccm === 'boost' && (extras.S == null || extras.S > 0);
  const catchPath = extras.catchPath
    || (extras.observed && silhouetteMismatch(row, extras.observed) ? 'silhouette' : (eccmHelps ? 'eccm' : 'focused_scan'));
  const spoofExposed = row.mode === 'spoof' && (mismatch || eccmHelps || extras.spoofExposed === true);

  if (scan) {
    scan.status = 'result';
    scan.spoofExposed = spoofExposed;
    scan.catchPath = catchPath;
    scan.untilLocalMs = now;
  }

  const contact = writeCatchOnContact(contactBook, observerKey, subjectKey, {
    spoofExposed,
    catchPath,
    suspicion: spoofExposed,
    claim: row,
    forceNoFs: extras.giftFs !== true,
  }, now);

  const forgetting = extras.forget === true
    ? applyForgettingLadder({
      claim: row,
      trueSide,
      ledger: extras.ledger,
      openIncident: extras.openIncident === true,
      kind: extras.kind || 'access_noncompliance',
      localElapsedMs: now,
      actorInstanceId: extras.actorInstanceId,
    })
    : null;

  const result = {
    ok: true,
    dwelling: false,
    status: 'result',
    emissionWritten: scan?.emissionWritten === true,
    spoofExposed,
    catchPath,
    suspicion: spoofExposed,
    claim: row.mode === 'spoof' ? { mode: 'spoof', spoofedFaction: row.spoofedFaction } : row.mode,
    firingSolution: contact?.firingSolution === true,
    engagement_authorized: undefined,
    attackId: null,
    mayAutoEngage: extras.mayAutoEngage ?? null,
    playerFaction: beforeFaction,
    playerSide: beforeSide,
    rewritten: false,
    remanRewritten: false,
    reman53: extras.reman53,
    contact,
    forgetting,
    sayable: spoofExposed
      ? 'Focused Scan: transponder claim does not match silhouette. Suspicion only — not a firing solution, not identity.'
      : 'Focused Scan: claim matches what the observer earned.',
  };
  if (ew92) ew92.lastCatch = result;
  return result;
}

export function catchAutoFires() {
  return false;
}
