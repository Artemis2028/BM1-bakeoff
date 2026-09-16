/**
 * Phase 9.3 — scan-poison on reserved `ew` (gates 1–3).
 *
 * Extra reserved-`ew` spend that stalls / degrades **live** Focused Scan,
 * contact confidence, and scan-progress. Residue-before-void. Corrupt ≠ wipe.
 * Book-only. Never a sixth consumer. Never a hull. Never a gifted lock.
 *
 * Source: docs/phase9/BM1-PHASE9.3-SCAN-POISON-DF-ASSIST-PROPOSAL.md §3
 *         docs/phase9/BM1-PHASE9.3-ENGINE-DEPENDENCIES.md
 */

import { EW_CONSUMER_NAME, POWER_CONSUMERS, reservedEwDraw } from './phase65-power.js';
import { applyLostTrackSameTick, findContact, listContacts } from './phase6-sensors.js';
import { degradeLiveLayers } from './phase9-ew.js';
import { applyResidueMark, isGhostLike } from './phase91-residue.js';
import {
  getPhase93Actor,
  resolvePhase93Defaults,
} from './phase93-magnitudes.js';

function clampNonNeg(value) {
  return Math.max(0, Number(value) || 0);
}

function clamp01(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

function normalizeKey(value, fallback = '') {
  const key = String(value ?? '').trim();
  return key && key !== 'undefined' && key !== 'null' ? key : fallback;
}

export const SCAN_POISON_CONTROL = 'scan_poison';

export function poisonIsCloakVoid() {
  return false;
}

export function poisonWipesReports() {
  return false;
}

export function poisonGiftsFiringSolution() {
  return false;
}

export function poisonSpawnsHull() {
  return false;
}

export function sixthPowerConsumer() {
  return POWER_CONSUMERS.length === 5 ? null : 'sixth';
}

export function poisonSayable() {
  return 'Scan poisoned. Live Focused Scan / confidence degraded — residue held. Delivered reports still in the journal. Not a cloak, not a firing solution.';
}

function poisonLive(actor, localElapsedMs = 0) {
  if (!actor || actor.poisonOn !== true) return false;
  const until = clampNonNeg(actor.poisonUntilLocalMs);
  if (until > 0 && clampNonNeg(localElapsedMs) >= until) return false;
  return true;
}

export function commandScanPoison(book, actorKey, on, localElapsedMs = 0, extras = {}) {
  const actor = getPhase93Actor(book, actorKey);
  const defaults = resolvePhase93Defaults(extras.defaults || extras.magnitudes || book?.defaults);
  const now = clampNonNeg(localElapsedMs);
  const S = extras.S == null ? 4 : Number(extras.S) || 0;
  const H = extras.H == null ? 1 : clamp01(extras.H);
  if (on) {
    if (S <= 0) {
      actor.poisonOn = false;
      actor.lastStatus = 'unavailable';
      return {
        ok: false,
        reason: 's-zero',
        on: false,
        draw: 0,
        consumer: EW_CONSUMER_NAME,
        status: 'unavailable',
      };
    }
    if (H <= 0 || extras.draw === 0) {
      actor.poisonOn = false;
      actor.lastStatus = 'power-limited';
      return {
        ok: false,
        reason: H <= 0 ? 'unfunded' : 'draw-zero',
        on: false,
        draw: 0,
        offBudget: extras.draw === 0,
        consumer: EW_CONSUMER_NAME,
        status: 'power-limited',
      };
    }
    actor.poisonOn = true;
    actor.poisonUntilLocalMs = now + (extras.durationLocalMs ?? defaults.scanPoisonDurationLocalMs);
    actor.sideId = extras.sideId || actor.sideId;
    actor.securityInstanceId = extras.securityInstanceId || actor.securityInstanceId;
    actor.victimKey = extras.victimKey ? normalizeKey(extras.victimKey) : actor.victimKey;
    actor.lastH = H;
    actor.lastStatus = H < 1 ? 'power-limited' : 'on';
    return {
      ok: true,
      on: true,
      status: actor.lastStatus,
      untilLocalMs: actor.poisonUntilLocalMs,
      consumer: EW_CONSUMER_NAME,
      hullSpawned: false,
      firingSolution: false,
      reportsDeleted: false,
    };
  }
  actor.poisonOn = false;
  actor.poisonUntilLocalMs = 0;
  actor.lastStatus = 'off';
  return { ok: true, on: false, status: 'off', consumer: EW_CONSUMER_NAME };
}

export function scanPoisonDraw(actorOrBook, actorKey, extras = {}) {
  const actor = actorOrBook?.actors
    ? getPhase93Actor(actorOrBook, actorKey)
    : actorOrBook;
  if (!actor || actor.poisonOn !== true) {
    return {
      draw: 0,
      extraDraw: 0,
      on: false,
      consumer: EW_CONSUMER_NAME,
      offBudget: false,
    };
  }
  const defaults = resolvePhase93Defaults(extras.defaults || extras.magnitudes);
  const H = extras.H == null ? (actor.lastH ?? 1) : clamp01(extras.H);
  const S = extras.S == null ? 4 : Number(extras.S) || 0;
  if (S <= 0 || H <= 0) {
    return {
      draw: 0,
      extraDraw: 0,
      on: true,
      failed: true,
      offBudget: true,
      status: S <= 0 ? 'unavailable' : 'power-limited',
      consumer: EW_CONSUMER_NAME,
    };
  }
  const extra = defaults.scanPoisonEwDraw * H;
  const draw = reservedEwDraw(extra);
  actor.lastPoisonDraw = draw;
  actor.lastH = H;
  return {
    draw,
    extraDraw: draw,
    on: true,
    status: H < 1 ? 'power-limited' : 'on',
    consumer: EW_CONSUMER_NAME,
    offBudget: false,
  };
}

function isBookOnlyRow(contact) {
  return Boolean(
    contact
    && (contact.ghost === true
      || contact.source === 'ew_ghost'
      || contact.decoy === true
      || contact.source === 'ew_decoy'
      || isGhostLike(contact)
      || String(contact.subjectKey || '').startsWith('ghost:')
      || String(contact.subjectKey || '').startsWith('decoy:')),
  );
}

function confidenceAfterPoison(contact, extras, defaults) {
  const prior = contact.scanConfidence == null ? 1 : clamp01(contact.scanConfidence);
  const factor = defaults.scanPoisonConfidenceFactor;
  const penalty = Math.max(0, 1 - factor);
  const eccmHelps = extras.eccm === 'boost' && (extras.S == null || extras.S > 0);
  const resist = eccmHelps ? defaults.eccmPoisonResist : 0;
  return clamp01(prior * (1 - penalty * (1 - resist)));
}

export function stallFocusedScan(ew92, observerKey, localElapsedMs = 0, extras = {}) {
  const key = normalizeKey(observerKey);
  const scan = ew92?.focusedScans?.[key];
  const defaults = resolvePhase93Defaults(extras.defaults || extras.magnitudes);
  if (!scan) {
    return { ok: false, reason: 'no-scan', firingSolution: false };
  }
  scan.poisoned = true;
  scan.untilLocalMs = clampNonNeg(scan.untilLocalMs) + defaults.focusedScanStallExtraMs;
  if (extras.failThisTick === true) {
    scan.status = 'poisoned';
    scan.catchFailedThisTick = true;
  } else if (scan.status === 'dwelling' || scan.status === 'result') {
    scan.status = scan.status === 'result' ? 'poisoned' : 'poisoned';
  }
  return {
    ok: true,
    scan,
    status: scan.status,
    firingSolution: false,
    catchFailedThisTick: scan.catchFailedThisTick === true,
    sensorsEmissionSkipped: false,
  };
}

function stallSearch(contact, defaults) {
  if (!contact.search || typeof contact.search !== 'object') return false;
  const search = contact.search;
  if (search.status === 'running' || search.status === 'pending') {
    search.dwellMs = Math.max(1, Math.round(clampNonNeg(search.dwellMs) * defaults.scanProgressStallFactor));
    search.poisoned = true;
    search.status = 'running';
    contact.firingSolution = false;
    return true;
  }
  return false;
}

function stallScanEmission(contact, localElapsedMs, defaults) {
  const emission = contact.scanEmission;
  if (!emission || typeof emission !== 'object') return false;
  const now = clampNonNeg(localElapsedMs);
  const remaining = Math.max(0, clampNonNeg(emission.expiresAtLocalMs) - now);
  emission.expiresAtLocalMs = now + Math.max(1, Math.round(remaining * defaults.scanProgressStallFactor));
  emission.poisoned = true;
  return true;
}

/**
 * Corrupt live Focused Scan / confidence / scan-progress on the victim
 * observer. Residue floor. Never wipe delivered reports. Never delete the row.
 */
export function applyScanPoison(ew93, contactBook, victimKey, localElapsedMs = 0, extras = {}) {
  const actor = getPhase93Actor(ew93, extras.actorKey || victimKey);
  const defaults = resolvePhase93Defaults(extras.defaults || extras.magnitudes || ew93?.defaults);
  const now = clampNonNeg(localElapsedMs);
  if (extras.inEnvelope === false) {
    return {
      ok: true,
      applied: false,
      reason: 'left-envelope',
      reportsDeleted: false,
      firingSolutionGifted: false,
      hullSpawned: false,
      rowDeleted: false,
    };
  }
  if (!poisonLive(actor, now) && extras.forceApply !== true) {
    return {
      ok: true,
      applied: false,
      reason: 'poison-off',
      reportsDeleted: false,
      firingSolutionGifted: false,
    };
  }
  const observerKey = normalizeKey(victimKey || extras.observerKey);
  const rows = [];
  const drops = [];
  for (const contact of listContacts(contactBook, observerKey)) {
    if (isBookOnlyRow(contact)) continue;
    if (extras.subjectKey && contact.subjectKey !== extras.subjectKey) continue;
    if (!contact.detected && contact.trackQuality === 'none' && !contact.residue) continue;
    const beforeFs = contact.firingSolution === true;
    const { droppedLock } = degradeLiveLayers(contact, extras.steps || 1);
    applyResidueMark(contact, {
      identification: contact.identification,
      trackQuality: contact.trackQuality === 'none' ? 'area' : contact.trackQuality,
    });
    contact.scanConfidence = confidenceAfterPoison(contact, extras, defaults);
    contact.scanPoisoned = true;
    contact.ghost = false;
    contact.detected = true;
    if (contact.firingSolution === true && extras.giftFs !== true) contact.firingSolution = false;
    if (beforeFs && contact.firingSolution !== true) {
      drops.push(applyLostTrackSameTick(contactBook, observerKey, contact.contactId, now));
    }
    const searchStalled = stallSearch(contact, defaults);
    stallScanEmission(contact, now, defaults);
    if (extras.failSearchThisTick === true && contact.search) {
      contact.search.status = 'failed';
      contact.firingSolution = false;
      contact.search.inventedCoordinates = false;
    }
    rows.push({
      contactId: contact.contactId,
      observerKey,
      subjectKey: contact.subjectKey,
      detected: contact.detected === true,
      identification: contact.identification,
      trackQuality: contact.trackQuality,
      firingSolution: contact.firingSolution === true,
      scanConfidence: contact.scanConfidence,
      scanProgress: {
        searchStatus: contact.search?.status || null,
        focusedScanStatus: extras.ew92?.focusedScans?.[observerKey]?.status || null,
        stallLocalMs: defaults.focusedScanStallExtraMs,
      },
      focusedScanPoisoned: extras.ew92?.focusedScans?.[observerKey]?.poisoned === true,
      residue: contact.residue === true,
      ghost: false,
      decoy: false,
      source: contact.source,
      searchStalled,
      reportConfidenceUntouched: true,
    });
  }
  if (extras.ew92 && extras.stallFocused !== false) {
    stallFocusedScan(extras.ew92, observerKey, now, {
      defaults,
      failThisTick: extras.failFocusedThisTick === true,
    });
  }
  const snapshot = {
    observerKey,
    actorKey: actor.actorKey,
    rows,
    drops,
    reportsDeleted: false,
    deliveredFlipped: false,
    knownIdsCleared: false,
    flashUnsending: false,
    deliveredConfidenceUnchanged: true,
    firingSolutionGifted: false,
    hullSpawned: false,
    ghostFlagged: false,
    engagement_authorized: undefined,
    residueHeld: true,
    rowPresent: rows.length > 0 || Boolean(findContact(contactBook, observerKey, extras.subjectKey)),
    sayable: poisonSayable(),
    startedAt: undefined,
  };
  if (ew93) {
    ew93.poisons[observerKey] = snapshot;
    ew93.lastPoison = snapshot;
    ew93.lastJournal = snapshot.sayable;
  }
  return { ok: true, applied: true, ...snapshot };
}

export function tickPoison(ew93, contactBook, localElapsedMs = 0, extras = {}) {
  const now = clampNonNeg(localElapsedMs);
  const applied = [];
  for (const actor of Object.values(ew93?.actors || {})) {
    if (actor.poisonOn === true && actor.poisonUntilLocalMs > 0 && now >= actor.poisonUntilLocalMs) {
      actor.poisonOn = false;
      actor.lastStatus = 'off';
      continue;
    }
    if (!poisonLive(actor, now)) continue;
    const victim = extras.victimFor?.[actor.actorKey]
      || actor.victimKey
      || extras.victimKey;
    if (!victim) continue;
    applied.push(applyScanPoison(ew93, contactBook, victim, now, {
      ...extras,
      actorKey: actor.actorKey,
    }));
  }
  return { ok: true, applied, reportsDeleted: false };
}
