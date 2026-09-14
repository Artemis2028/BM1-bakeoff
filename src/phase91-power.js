/**
 * Phase 9.1 — spend-to-suppress on reserved `ew` (gate 1).
 *
 * Draw = catalog × A × H. S=0 unavailable. Brown-out weakens. Spin-up /
 * cooldown use localElapsedMs. Magnitudes injectable / TBD.
 *
 * Source: docs/phase9/BM1-PHASE9.1-EW-ROBUSTNESS-PROPOSAL.md §3
 */

import { EW_CONSUMER_NAME, reservedEwDraw } from './phase65-power.js';
import {
  EW_SLOT_KIND,
  MAGNITUDES_LOCKED_FROM_REMASTERED,
  readFittedTier,
  resolveEwEquipment,
  serializeEwSlot,
} from './phase91-ew-slot.js';

export const PHASE91_BOOK_VERSION = 1;

/** Recommended clocks / mapping only — not locked constants. */
export const PHASE91_DEFAULTS = Object.freeze({
  spinUpLocalMs: 1000,
  cooldownLocalMs: 2000,
  selfCancel: 0.25,
  eccmBoost: 1.4,
  burnThroughB: 200,
  clearRatio: 0.05,
  sTable: Object.freeze({
    none: 0,
    '': 0,
    baseline: 4,
    'suite:baseline': 4,
    survey: 7,
    'suite:survey': 7,
    science: 10,
    'suite:science': 10,
  }),
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

export function resolvePhase91Defaults(injected = null) {
  if (!injected || typeof injected !== 'object') return { ...PHASE91_DEFAULTS, sTable: { ...PHASE91_DEFAULTS.sTable } };
  return {
    spinUpLocalMs: Math.max(1, clampNonNeg(injected.spinUpLocalMs ?? PHASE91_DEFAULTS.spinUpLocalMs)),
    cooldownLocalMs: Math.max(1, clampNonNeg(injected.cooldownLocalMs ?? PHASE91_DEFAULTS.cooldownLocalMs)),
    selfCancel: clamp01(injected.selfCancel ?? PHASE91_DEFAULTS.selfCancel),
    eccmBoost: Math.max(1, Number(injected.eccmBoost) || PHASE91_DEFAULTS.eccmBoost),
    burnThroughB: Math.max(0.0001, Number(injected.burnThroughB) || PHASE91_DEFAULTS.burnThroughB),
    clearRatio: clamp01(injected.clearRatio ?? PHASE91_DEFAULTS.clearRatio),
    sTable: { ...PHASE91_DEFAULTS.sTable, ...(injected.sTable || {}) },
  };
}

export function emptyEw91Book() {
  return {
    version: PHASE91_BOOK_VERSION,
    actors: {},
    emitters: {},
    seekers: {},
    lastContest: null,
    lastJournal: null,
    magnitudes: null,
    defaults: null,
    lastRefuseFire: null,
  };
}

export function createEw91Book(extras = {}) {
  return {
    version: PHASE91_BOOK_VERSION,
    actors: extras.actors && typeof extras.actors === 'object' ? extras.actors : {},
    emitters: extras.emitters && typeof extras.emitters === 'object' ? extras.emitters : {},
    seekers: extras.seekers && typeof extras.seekers === 'object' ? extras.seekers : {},
    lastContest: extras.lastContest || null,
    lastJournal: extras.lastJournal || null,
    magnitudes: extras.magnitudes || null,
    defaults: extras.defaults || null,
    lastRefuseFire: extras.lastRefuseFire || null,
  };
}

export function serializeEw91Book(book) {
  const out = emptyEw91Book();
  out.lastJournal = book?.lastJournal || null;
  out.lastRefuseFire = book?.lastRefuseFire || null;
  out.magnitudes = book?.magnitudes ? clone(book.magnitudes) : null;
  out.defaults = book?.defaults ? clone(book.defaults) : null;
  out.lastContest = book?.lastContest ? clone(book.lastContest) : null;
  for (const [key, raw] of Object.entries(book?.actors || {})) {
    const row = sanitizeActor(raw, key);
    if (row) out.actors[row.actorKey] = row;
  }
  for (const [key, raw] of Object.entries(book?.emitters || {})) {
    if (raw && typeof raw === 'object') out.emitters[normalizeKey(key)] = clone(raw);
  }
  for (const [key, raw] of Object.entries(book?.seekers || {})) {
    if (raw && typeof raw === 'object') out.seekers[normalizeKey(key)] = clone(raw);
  }
  return clone(out);
}

export function restoreEw91Book(raw) {
  if (!raw || typeof raw !== 'object') return emptyEw91Book();
  return serializeEw91Book(raw);
}

function sanitizeActor(raw = {}, fallbackKey = '') {
  const actorKey = normalizeKey(raw.actorKey || fallbackKey);
  if (!actorKey) return null;
  const fitted = readFittedTier(raw);
  const commanded = raw.commanded === 'on' ? 'on' : 'off';
  const eccm = raw.eccm === 'boost' ? 'boost' : 'off';
  return {
    actorKey,
    securityInstanceId: normalizeKey(raw.securityInstanceId || actorKey.replace(/^npc:/, '')),
    sideId: normalizeKey(raw.sideId),
    slotKind: EW_SLOT_KIND,
    ewEquipmentId: fitted,
    commanded,
    eccm,
    spinUpUntilLocalMs: clampNonNeg(raw.spinUpUntilLocalMs),
    cooldownUntilLocalMs: clampNonNeg(raw.cooldownUntilLocalMs),
    status: raw.status || 'off',
    S: raw.S == null ? null : clampNonNeg(raw.S),
    lastDraw: clampNonNeg(raw.lastDraw),
    lastStrength: clampNonNeg(raw.lastStrength),
    lastRadius: clampNonNeg(raw.lastRadius),
    lastA: clampNonNeg(raw.lastA),
    lastH: clamp01(raw.lastH ?? 1),
    lastF: clamp01(raw.lastF),
    transponderClaim: sanitizeClaimField(raw.transponderClaim),
    startedAt: undefined,
  };
}

function sanitizeClaimField(raw) {
  if (!raw || raw === 'true' || raw === true) return { mode: 'true', spoofedFaction: null };
  if (raw === 'off' || raw === false || raw === 'none' || raw === 'silent') {
    return { mode: 'off', spoofedFaction: null };
  }
  if (typeof raw === 'object') {
    const mode = normalizeKey(raw.mode);
    const faction = normalizeKey(raw.spoofedFaction || raw.faction);
    if (mode === 'off') return { mode: 'off', spoofedFaction: null };
    if (mode === 'true') return { mode: 'true', spoofedFaction: null };
    if (mode === 'spoof' && faction) return { mode: 'spoof', spoofedFaction: faction };
    if (faction) return { mode: 'spoof', spoofedFaction: faction };
  }
  const text = normalizeKey(raw);
  if (text === 'off') return { mode: 'off', spoofedFaction: null };
  if (text === 'true' || !text) return { mode: 'true', spoofedFaction: null };
  return { mode: 'spoof', spoofedFaction: text };
}

export function getActor(book, actorKey) {
  const key = normalizeKey(actorKey);
  if (!book || !key) return null;
  if (!book.actors[key]) {
    book.actors[key] = sanitizeActor({ actorKey: key, commanded: 'off', eccm: 'off' }, key);
  }
  return book.actors[key];
}

export function mapSensorsPoints(actor = {}, extras = {}) {
  if (actor.S != null && Number.isFinite(Number(actor.S))) return clampNonNeg(actor.S);
  if (extras.S != null && Number.isFinite(Number(extras.S))) return clampNonNeg(extras.S);
  const defaults = resolvePhase91Defaults(extras.defaults || extras.book?.defaults);
  const suite = normalizeKey(actor.suiteGrade || actor.sensorSuiteId || extras.sensorSuiteId || extras.suiteGrade);
  if (Object.prototype.hasOwnProperty.call(defaults.sTable, suite)) {
    return clampNonNeg(defaults.sTable[suite]);
  }
  if (actor.sensorScore != null) return clampNonNeg(actor.sensorScore);
  if (extras.funded === false) return 0;
  return clampNonNeg(defaults.sTable.baseline);
}

export function apertureFromS(S) {
  const s = clampNonNeg(S);
  if (s <= 0) return 0;
  return 0.5 + 0.1 * s;
}

export function healthFraction(input = {}) {
  if (input.H != null && Number.isFinite(Number(input.H))) return clamp01(input.H);
  if (input.ewStarved === true || input.brownoutDead === true) return 0;
  if (input.powerNorm != null) return clamp01(input.powerNorm);
  return 1;
}

export function jammerSpend(actorOrTarget = {}, extras = {}) {
  const S = mapSensorsPoints(actorOrTarget, extras);
  const A = apertureFromS(S);
  const H = healthFraction(extras);
  const fitted = extras.fitted || readFittedTier(actorOrTarget) || extras.tierId;
  const equipment = fitted ? resolveEwEquipment(fitted, extras) : null;
  const commandedOn = extras.commanded === 'on' || actorOrTarget.commanded === 'on';
  const available = Boolean(equipment) && S > 0 && H > 0;
  const catalogDraw = equipment ? clampNonNeg(equipment.draw) : 0;
  const catalogStrength = equipment ? clampNonNeg(equipment.strength) : 0;
  const catalogRadius = equipment ? clampNonNeg(equipment.radius) : 0;
  const spinning = extras.spinning === true;
  const cooling = extras.cooling === true;
  const f = !commandedOn || !available || cooling
    ? 0
    : (extras.f != null ? clamp01(extras.f) : 1);
  const draw = commandedOn && available && !cooling ? catalogDraw * A * H : 0;
  const strength = catalogStrength * A * f;
  const radius = catalogRadius * Math.sqrt(Math.max(0, A)) * Math.sqrt(Math.max(0, f));
  let status = 'off';
  if (!equipment) status = 'off';
  else if (S <= 0) status = 'unavailable';
  else if (cooling) status = 'cooldown';
  else if (commandedOn && H < 1 && H > 0) status = 'power-limited';
  else if (commandedOn && H <= 0) status = 'power-limited';
  else if (commandedOn && spinning) status = 'spin-up';
  else if (commandedOn) status = 'on';
  return {
    S,
    A,
    H,
    f,
    fitted: equipment ? equipment.tierId : null,
    available,
    commandedOn,
    catalogDraw,
    catalogStrength,
    catalogRadius,
    draw: reservedEwDraw(draw),
    strength,
    radius,
    status,
    spinning,
    cooling,
    consumer: EW_CONSUMER_NAME,
    offBudget: commandedOn && available && reservedEwDraw(draw) === 0,
    magnitudesLockedFromRemastered: MAGNITUDES_LOCKED_FROM_REMASTERED,
    eccmAvailable: S > 0,
  };
}

export function actorJammerDraw(book, actorKey, localElapsedMs = 0, extras = {}) {
  const actor = getActor(book, actorKey);
  if (!actor) return 0;
  const now = clampNonNeg(localElapsedMs);
  const spend = jammerSpend(actor, {
    ...extras,
    commanded: actor.commanded,
    fitted: actor.ewEquipmentId,
    spinning: actor.commanded === 'on' && now < actor.spinUpUntilLocalMs,
    cooling: now < actor.cooldownUntilLocalMs,
    magnitudes: extras.magnitudes || book.magnitudes,
    defaults: extras.defaults || book.defaults,
  });
  actor.lastDraw = spend.draw;
  actor.lastStrength = spend.strength;
  actor.lastRadius = spend.radius;
  actor.lastA = spend.A;
  actor.lastH = spend.H;
  actor.lastF = spend.f;
  actor.status = spend.status;
  actor.S = spend.S;
  return spend.draw;
}

export function commandJammer(book, actorKey, on, localElapsedMs = 0, extras = {}) {
  const actor = getActor(book, actorKey);
  const defaults = resolvePhase91Defaults(extras.defaults || book.defaults);
  const now = clampNonNeg(localElapsedMs);
  const spend = jammerSpend({ ...actor, ...extras, commanded: on ? 'on' : 'off' }, {
    ...extras,
    commanded: on ? 'on' : 'off',
    fitted: extras.fitted || actor.ewEquipmentId,
    cooling: now < actor.cooldownUntilLocalMs,
    magnitudes: extras.magnitudes || book.magnitudes,
    defaults,
  });
  if (on) {
    if (!spend.fitted) return { ok: false, reason: 'empty-slot', spend };
    if (spend.S <= 0) return { ok: false, reason: 's-zero', spend };
    if (now < actor.cooldownUntilLocalMs) return { ok: false, reason: 'cooldown', spend, status: 'cooldown' };
    if (spend.H <= 0) return { ok: false, reason: 'unfunded', spend, status: 'power-limited' };
    actor.commanded = 'on';
    actor.spinUpUntilLocalMs = now + defaults.spinUpLocalMs;
    actor.cooldownUntilLocalMs = 0;
    actor.status = 'spin-up';
    actor.sideId = extras.sideId || actor.sideId;
    actor.securityInstanceId = extras.securityInstanceId || actor.securityInstanceId;
    if (extras.fitted) actor.ewEquipmentId = extras.fitted;
    return { ok: true, actor, spend: { ...spend, status: 'spin-up', spinning: true } };
  }
  const wasOn = actor.commanded === 'on';
  actor.commanded = 'off';
  actor.spinUpUntilLocalMs = 0;
  if (wasOn) actor.cooldownUntilLocalMs = now + defaults.cooldownLocalMs;
  actor.status = wasOn ? 'cooldown' : 'off';
  return { ok: true, actor, spend: jammerSpend(actor, { ...extras, commanded: 'off', cooling: wasOn, defaults }) };
}

export function commandEccm(book, actorKey, boost, extras = {}) {
  const actor = getActor(book, actorKey);
  const S = mapSensorsPoints({ ...actor, ...extras }, extras);
  if (boost && S <= 0) return { ok: false, reason: 's-zero', eccm: 'off' };
  actor.eccm = boost ? 'boost' : 'off';
  return { ok: true, eccm: actor.eccm, S };
}

export function fieldIsLive(actor, localElapsedMs = 0) {
  const now = clampNonNeg(localElapsedMs);
  return actor?.commanded === 'on'
    && now >= clampNonNeg(actor.spinUpUntilLocalMs)
    && now >= clampNonNeg(actor.cooldownUntilLocalMs)
    && clampNonNeg(actor.lastDraw) > 0;
}

export function snapshotJammer(book, actorKey, localElapsedMs = 0, extras = {}) {
  const actor = getActor(book, actorKey);
  const spend = jammerSpend(actor, {
    ...extras,
    commanded: actor.commanded,
    fitted: actor.ewEquipmentId,
    spinning: actor.commanded === 'on' && localElapsedMs < actor.spinUpUntilLocalMs,
    cooling: localElapsedMs < actor.cooldownUntilLocalMs,
    magnitudes: extras.magnitudes || book.magnitudes,
    defaults: extras.defaults || book.defaults,
  });
  return {
    slot: serializeEwSlot(actor),
    ...spend,
    eccm: actor.eccm,
    status: spend.status,
    consumer: EW_CONSUMER_NAME,
    offBudget: spend.offBudget,
  };
}

export { clone, clamp01, clampNonNeg, normalizeKey };
