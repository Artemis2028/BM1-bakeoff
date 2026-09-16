/**
 * Phase 9.3 — injectable playtest magnitude ledger (gate 7).
 *
 * Starting defaults from docs/phase9/BM1-PHASE9.3-SCAN-POISON-DF-ASSIST-PROPOSAL.md §7.
 * Not remastered watts. Override must change the snapshot.
 * MAGNITUDES_LOCKED_FROM_REMASTERED stays false.
 *
 * Source: docs/phase9/BM1-PHASE9.3-SCAN-POISON-DF-ASSIST-PROPOSAL.md §7
 *         docs/phase9/BM1-PHASE9.3-ENGINE-DEPENDENCIES.md
 */

import { EW_EQUIPMENT_CATALOG, MAGNITUDES_LOCKED_FROM_REMASTERED as SLOT_LOCK } from './phase91-ew-slot.js';
import { PHASE91_DEFAULTS } from './phase91-power.js';
import { EW_MAGNITUDES } from './phase9-ew.js';
import {
  MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE92_LOCK,
  PHASE92_DEFAULTS,
} from './phase92-magnitudes.js';

export const PHASE93_BOOK_VERSION = 1;
export const MAGNITUDES_LOCKED_FROM_REMASTERED = false;

/** TBD / playtest starting defaults — not locked remastered constants. */
export const PHASE93_DEFAULTS = Object.freeze({
  scanPoisonEwDraw: 1.1,
  scanPoisonDurationLocalMs: 7000,
  scanPoisonConfidenceFactor: 0.45,
  focusedScanStallExtraMs: 1200,
  scanProgressStallFactor: 1.8,
  eccmPoisonResist: 0.5,
  dfAssistEwDraw: 0.8,
  dfAssistDurationLocalMs: 6000,
  dfCueQualityLoud: 0.75,
  dfCueQualitySuppressed: 0.25,
  dfCueQualitySilent: 0,
  dfRange: 700,
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function clampNonNeg(value) {
  return Math.max(0, Number(value) || 0);
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function normalizeKey(value, fallback = '') {
  const key = String(value ?? '').trim();
  return key && key !== 'undefined' && key !== 'null' ? key : fallback;
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function resolvePhase93Defaults(injected = null) {
  if (!injected || typeof injected !== 'object') {
    return { ...PHASE93_DEFAULTS };
  }
  return {
    scanPoisonEwDraw: clampNonNeg(injected.scanPoisonEwDraw ?? PHASE93_DEFAULTS.scanPoisonEwDraw),
    scanPoisonDurationLocalMs: Math.max(1, clampNonNeg(
      injected.scanPoisonDurationLocalMs ?? injected.scanPoisonDuration ?? PHASE93_DEFAULTS.scanPoisonDurationLocalMs,
    )),
    scanPoisonConfidenceFactor: clamp01(
      injected.scanPoisonConfidenceFactor ?? PHASE93_DEFAULTS.scanPoisonConfidenceFactor,
    ),
    focusedScanStallExtraMs: clampNonNeg(
      injected.focusedScanStallExtraMs ?? PHASE93_DEFAULTS.focusedScanStallExtraMs,
    ),
    scanProgressStallFactor: Math.max(1, Number(injected.scanProgressStallFactor) || PHASE93_DEFAULTS.scanProgressStallFactor),
    eccmPoisonResist: clamp01(injected.eccmPoisonResist ?? PHASE93_DEFAULTS.eccmPoisonResist),
    dfAssistEwDraw: clampNonNeg(injected.dfAssistEwDraw ?? PHASE93_DEFAULTS.dfAssistEwDraw),
    dfAssistDurationLocalMs: Math.max(1, clampNonNeg(
      injected.dfAssistDurationLocalMs ?? injected.dfAssistDuration ?? PHASE93_DEFAULTS.dfAssistDurationLocalMs,
    )),
    dfCueQualityLoud: clamp01(injected.dfCueQualityLoud ?? PHASE93_DEFAULTS.dfCueQualityLoud),
    dfCueQualitySuppressed: clamp01(injected.dfCueQualitySuppressed ?? PHASE93_DEFAULTS.dfCueQualitySuppressed),
    dfCueQualitySilent: clamp01(injected.dfCueQualitySilent ?? PHASE93_DEFAULTS.dfCueQualitySilent),
    dfRange: clampNonNeg(injected.dfRange ?? PHASE93_DEFAULTS.dfRange),
  };
}

export function snapshotPhase93Magnitudes(injected = null) {
  const defaults = resolvePhase93Defaults(injected);
  return {
    ...defaults,
    compact: { ...EW_EQUIPMENT_CATALOG.compact, ...(injected?.compact || {}) },
    tactical: { ...EW_EQUIPMENT_CATALOG.tactical, ...(injected?.tactical || {}) },
    fleet: { ...EW_EQUIPMENT_CATALOG.fleet, ...(injected?.fleet || {}) },
    families: { ...EW_MAGNITUDES, ...(injected?.families || {}) },
    phase91: { ...PHASE91_DEFAULTS, ...(injected?.phase91 || {}) },
    phase92: { ...PHASE92_DEFAULTS, ...(injected?.phase92 || {}) },
    magnitudesLockedFromRemastered: MAGNITUDES_LOCKED_FROM_REMASTERED,
    slotLock: SLOT_LOCK,
    phase92Lock: PHASE92_LOCK,
    playtest: true,
    remasteredWattLock: false,
  };
}

export function emptyEw93Book() {
  return {
    version: PHASE93_BOOK_VERSION,
    actors: {},
    poisons: {},
    cues: {},
    lastPoison: null,
    lastCue: null,
    lastJournal: null,
    lastRefuseFire: null,
    magnitudes: null,
    defaults: null,
  };
}

export function createEw93Book(extras = {}) {
  return {
    ...emptyEw93Book(),
    actors: extras.actors && typeof extras.actors === 'object' ? extras.actors : {},
    poisons: extras.poisons && typeof extras.poisons === 'object' ? extras.poisons : {},
    cues: extras.cues && typeof extras.cues === 'object' ? extras.cues : {},
    lastPoison: extras.lastPoison || null,
    lastCue: extras.lastCue || null,
    lastJournal: extras.lastJournal || null,
    lastRefuseFire: extras.lastRefuseFire || null,
    magnitudes: extras.magnitudes || null,
    defaults: extras.defaults || null,
  };
}

function sanitizeActor(raw = {}, fallbackKey = '') {
  const actorKey = normalizeKey(raw.actorKey || fallbackKey);
  if (!actorKey) return null;
  return {
    actorKey,
    securityInstanceId: normalizeKey(raw.securityInstanceId || actorKey.replace(/^npc:/, '')),
    sideId: normalizeKey(raw.sideId),
    poisonOn: raw.poisonOn === true,
    dfOn: raw.dfOn === true,
    poisonUntilLocalMs: clampNonNeg(raw.poisonUntilLocalMs),
    dfUntilLocalMs: clampNonNeg(raw.dfUntilLocalMs),
    victimKey: normalizeKey(raw.victimKey),
    lastPoisonDraw: clampNonNeg(raw.lastPoisonDraw),
    lastDfDraw: clampNonNeg(raw.lastDfDraw),
    lastH: clamp01(raw.lastH ?? 1),
    lastStatus: normalizeKey(raw.lastStatus) || 'off',
    lastDfStatus: normalizeKey(raw.lastDfStatus) || 'off',
    startedAt: undefined,
  };
}

export function getPhase93Actor(book, actorKey) {
  const key = normalizeKey(actorKey);
  if (!book || !key) return null;
  if (!book.actors[key]) book.actors[key] = sanitizeActor({ actorKey: key }, key);
  return book.actors[key];
}

export function serializeEw93Book(book) {
  const out = emptyEw93Book();
  out.lastPoison = book?.lastPoison ? clone(book.lastPoison) : null;
  out.lastCue = book?.lastCue ? clone(book.lastCue) : null;
  out.lastJournal = book?.lastJournal || null;
  out.lastRefuseFire = book?.lastRefuseFire ? clone(book.lastRefuseFire) : null;
  out.magnitudes = book?.magnitudes ? clone(book.magnitudes) : null;
  out.defaults = book?.defaults ? clone(book.defaults) : null;
  for (const [key, raw] of Object.entries(book?.actors || {})) {
    const row = sanitizeActor(raw, key);
    if (row) out.actors[row.actorKey] = row;
  }
  for (const [key, raw] of Object.entries(book?.poisons || {})) {
    if (raw && typeof raw === 'object') out.poisons[normalizeKey(key)] = clone(raw);
  }
  for (const [key, raw] of Object.entries(book?.cues || {})) {
    if (raw && typeof raw === 'object') out.cues[normalizeKey(key)] = clone(raw);
  }
  return clone(out);
}

export function restoreEw93Book(raw) {
  if (!raw || typeof raw !== 'object') return emptyEw93Book();
  return serializeEw93Book(raw);
}

export { clone, clamp, clamp01, clampNonNeg, normalizeKey };
