/**
 * Phase 9.2 — injectable playtest magnitude ledger (gate 6).
 *
 * Starting defaults from docs/phase9/BM1-PHASE9.2-EW-DEPTH-PROPOSAL.md §8.
 * Not remastered watts. Override must change the snapshot.
 *
 * Source: docs/phase9/BM1-PHASE9.2-EW-DEPTH-PROPOSAL.md §8
 *         docs/phase9/BM1-PHASE9.2-ENGINE-DEPENDENCIES.md
 */

import { EW_EQUIPMENT_CATALOG, MAGNITUDES_LOCKED_FROM_REMASTERED as SLOT_LOCK } from './phase91-ew-slot.js';
import { PHASE91_DEFAULTS } from './phase91-power.js';
import { EW_MAGNITUDES } from './phase9-ew.js';

export const PHASE92_BOOK_VERSION = 1;
export const MAGNITUDES_LOCKED_FROM_REMASTERED = false;

/** TBD / playtest starting defaults — not locked remastered constants. */
export const PHASE92_DEFAULTS = Object.freeze({
  lobeHalfAngleDeg: 50,
  sidelobeFactor: 0,
  shareRadius: 360,
  formationDist: 110,
  playerDist: 300,
  focusedScanDwellMs: 1500,
  focusedScanExtraSensorsDraw: 0.4,
  heatSuppressExtraEwFactor: 0.6,
  heatEmissionUnsuppressed: 1.0,
  heatEmissionSuppressed: 0.25,
  silentRunningEwDraw: 0.5,
  silentRunningEmissionScale: 0.1,
  decoyEwDraw: 1.3,
  decoyDurationLocalMs: 8000,
  maxDecoysPerObserver: 4,
  newFleetOrderDelayMs: 2000,
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

export function resolvePhase92Defaults(injected = null) {
  if (!injected || typeof injected !== 'object') {
    return { ...PHASE92_DEFAULTS };
  }
  const half = injected.lobeHalfAngleDeg ?? injected.lobeAlpha ?? PHASE92_DEFAULTS.lobeHalfAngleDeg;
  return {
    lobeHalfAngleDeg: clamp(half, 0, 180),
    sidelobeFactor: clamp01(injected.sidelobeFactor ?? PHASE92_DEFAULTS.sidelobeFactor),
    shareRadius: clampNonNeg(injected.shareRadius ?? PHASE92_DEFAULTS.shareRadius),
    formationDist: clampNonNeg(injected.formationDist ?? PHASE92_DEFAULTS.formationDist),
    playerDist: clampNonNeg(injected.playerDist ?? PHASE92_DEFAULTS.playerDist),
    focusedScanDwellMs: Math.max(1, clampNonNeg(injected.focusedScanDwellMs ?? PHASE92_DEFAULTS.focusedScanDwellMs)),
    focusedScanExtraSensorsDraw: clampNonNeg(injected.focusedScanExtraSensorsDraw ?? PHASE92_DEFAULTS.focusedScanExtraSensorsDraw),
    heatSuppressExtraEwFactor: clampNonNeg(injected.heatSuppressExtraEwFactor ?? PHASE92_DEFAULTS.heatSuppressExtraEwFactor),
    heatEmissionUnsuppressed: clampNonNeg(injected.heatEmissionUnsuppressed ?? PHASE92_DEFAULTS.heatEmissionUnsuppressed),
    heatEmissionSuppressed: clampNonNeg(injected.heatEmissionSuppressed ?? PHASE92_DEFAULTS.heatEmissionSuppressed),
    silentRunningEwDraw: clampNonNeg(injected.silentRunningEwDraw ?? PHASE92_DEFAULTS.silentRunningEwDraw),
    silentRunningEmissionScale: clamp01(injected.silentRunningEmissionScale ?? PHASE92_DEFAULTS.silentRunningEmissionScale),
    decoyEwDraw: clampNonNeg(injected.decoyEwDraw ?? PHASE92_DEFAULTS.decoyEwDraw),
    decoyDurationLocalMs: Math.max(1, clampNonNeg(injected.decoyDurationLocalMs ?? PHASE92_DEFAULTS.decoyDurationLocalMs)),
    maxDecoysPerObserver: Math.max(1, Math.round(clampNonNeg(injected.maxDecoysPerObserver ?? PHASE92_DEFAULTS.maxDecoysPerObserver))),
    newFleetOrderDelayMs: Math.max(1, clampNonNeg(injected.newFleetOrderDelayMs ?? PHASE92_DEFAULTS.newFleetOrderDelayMs)),
  };
}

export function snapshotPhase92Magnitudes(injected = null) {
  const defaults = resolvePhase92Defaults(injected);
  return {
    ...defaults,
    compact: { ...EW_EQUIPMENT_CATALOG.compact, ...(injected?.compact || {}) },
    tactical: { ...EW_EQUIPMENT_CATALOG.tactical, ...(injected?.tactical || {}) },
    fleet: { ...EW_EQUIPMENT_CATALOG.fleet, ...(injected?.fleet || {}) },
    families: { ...EW_MAGNITUDES, ...(injected?.families || {}) },
    phase91: { ...PHASE91_DEFAULTS, ...(injected?.phase91 || {}) },
    magnitudesLockedFromRemastered: MAGNITUDES_LOCKED_FROM_REMASTERED,
    slotLock: SLOT_LOCK,
    playtest: true,
    remasteredWattLock: false,
  };
}

export function emptyEw92Book() {
  return {
    version: PHASE92_BOOK_VERSION,
    actors: {},
    decoys: {},
    focusedScans: {},
    delayedOrders: {},
    lastCatch: null,
    lastShare: null,
    lastComms: null,
    lastJournal: null,
    magnitudes: null,
    defaults: null,
  };
}

export function createEw92Book(extras = {}) {
  return {
    ...emptyEw92Book(),
    actors: extras.actors && typeof extras.actors === 'object' ? extras.actors : {},
    decoys: extras.decoys && typeof extras.decoys === 'object' ? extras.decoys : {},
    focusedScans: extras.focusedScans && typeof extras.focusedScans === 'object' ? extras.focusedScans : {},
    delayedOrders: extras.delayedOrders && typeof extras.delayedOrders === 'object' ? extras.delayedOrders : {},
    lastCatch: extras.lastCatch || null,
    lastShare: extras.lastShare || null,
    lastComms: extras.lastComms || null,
    lastJournal: extras.lastJournal || null,
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
    heading: Number.isFinite(Number(raw.heading)) ? Number(raw.heading) : 0,
    lobeHalfAngleDeg: raw.lobeHalfAngleDeg == null ? null : clamp(raw.lobeHalfAngleDeg, 0, 180),
    heatSuppress: raw.heatSuppress === true,
    silentRunning: raw.silentRunning === true,
    decoyOn: raw.decoyOn === true,
    focusedScanUntilLocalMs: clampNonNeg(raw.focusedScanUntilLocalMs),
    lastDraw: clampNonNeg(raw.lastDraw),
    lastEmissionScale: clampNonNeg(raw.lastEmissionScale ?? 1),
    lastH: clamp01(raw.lastH ?? 1),
    startedAt: undefined,
  };
}

export function getPhase92Actor(book, actorKey) {
  const key = normalizeKey(actorKey);
  if (!book || !key) return null;
  if (!book.actors[key]) book.actors[key] = sanitizeActor({ actorKey: key }, key);
  return book.actors[key];
}

export function serializeEw92Book(book) {
  const out = emptyEw92Book();
  out.lastCatch = book?.lastCatch ? clone(book.lastCatch) : null;
  out.lastShare = book?.lastShare ? clone(book.lastShare) : null;
  out.lastComms = book?.lastComms ? clone(book.lastComms) : null;
  out.lastJournal = book?.lastJournal ? clone(book.lastJournal) : null;
  out.magnitudes = book?.magnitudes ? clone(book.magnitudes) : null;
  out.defaults = book?.defaults ? clone(book.defaults) : null;
  for (const [key, raw] of Object.entries(book?.actors || {})) {
    const row = sanitizeActor(raw, key);
    if (row) out.actors[row.actorKey] = row;
  }
  for (const [key, raw] of Object.entries(book?.decoys || {})) {
    if (raw && typeof raw === 'object') out.decoys[normalizeKey(key)] = clone(raw);
  }
  for (const [key, raw] of Object.entries(book?.focusedScans || {})) {
    if (raw && typeof raw === 'object') out.focusedScans[normalizeKey(key)] = clone(raw);
  }
  for (const [key, raw] of Object.entries(book?.delayedOrders || {})) {
    if (raw && typeof raw === 'object') out.delayedOrders[normalizeKey(key)] = clone(raw);
  }
  return clone(out);
}

export function restoreEw92Book(raw) {
  if (!raw || typeof raw !== 'object') return emptyEw92Book();
  return serializeEw92Book(raw);
}

export { clone, clamp, clamp01, clampNonNeg, normalizeKey };
