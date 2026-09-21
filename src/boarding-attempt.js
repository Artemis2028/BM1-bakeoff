/**
 * Boarding attempt book — XOR writer + outcome inject (gate 2).
 *
 * Source of truth:
 * - docs/boarding/BM1-BOARDING-CAPTURE-PROPOSAL.md §4 / §10
 *
 * One attempt writes capture XOR scuttle XOR fail. Clocks are localElapsedMs.
 * Odds stay TBD / injectable. Away-team XP is a sibling subscribe (S30).
 */

import { MAGNITUDES_LOCKED_FROM_REMASTERED } from './boarding-eligibility.js';
import {
  applyAwayTeamXpOutcome,
  awayTeamXpSnapshot,
} from './away-team-xp.js';

export const BOARDING_BOOK_VERSION = 1;
export { MAGNITUDES_LOCKED_FROM_REMASTERED, awayTeamXpSnapshot };

export const BOARDING_OUTCOMES = Object.freeze(['capture', 'scuttle', 'fail']);

function mirrorAwayTeamXp(book, xpBook) {
  if (!book || typeof book !== 'object') return;
  book.awayTeamXp = awayTeamXpSnapshot(xpBook);
}

export function emptyBoardingBook(extras = {}) {
  return {
    version: BOARDING_BOOK_VERSION,
    nextAttemptId: Math.max(1, Number(extras.nextAttemptId) || 1),
    nextPrizeId: Math.max(1, Number(extras.nextPrizeId) || 1),
    attempts: extras.attempts && typeof extras.attempts === 'object' ? { ...extras.attempts } : {},
    prizes: extras.prizes && typeof extras.prizes === 'object' ? { ...extras.prizes } : {},
    prizesBySource: extras.prizesBySource && typeof extras.prizesBySource === 'object'
      ? { ...extras.prizesBySource }
      : {},
    captures: extras.captures && typeof extras.captures === 'object' ? { ...extras.captures } : {},
    lastRefuse: extras.lastRefuse || null,
    lastOutcome: extras.lastOutcome || null,
    inFlightId: extras.inFlightId || null,
    flagshipCommandId: extras.flagshipCommandId || 'player',
    npcBoardingImplemented: false,
    magnitudesLockedFromRemastered: false,
    successPercentLocked: false,
    awayTeamXp: awayTeamXpSnapshot(extras.xpBook),
  };
}

export function serializeBoardingBook(book, xpBook) {
  const state = emptyBoardingBook(book || {});
  const attempts = {};
  for (const [id, row] of Object.entries(state.attempts || {})) {
    attempts[id] = sanitizeAttempt(row);
  }
  return {
    version: BOARDING_BOOK_VERSION,
    nextAttemptId: state.nextAttemptId,
    nextPrizeId: state.nextPrizeId,
    attempts,
    prizes: { ...state.prizes },
    prizesBySource: { ...state.prizesBySource },
    captures: { ...state.captures },
    lastRefuse: state.lastRefuse,
    lastOutcome: state.lastOutcome,
    inFlightId: state.inFlightId,
    flagshipCommandId: state.flagshipCommandId,
    npcBoardingImplemented: false,
    magnitudesLockedFromRemastered: false,
    successPercentLocked: false,
    awayTeamXp: awayTeamXpSnapshot(xpBook),
  };
}

export function restoreBoardingBook(saved, xpBook) {
  if (!saved || typeof saved !== 'object') return emptyBoardingBook({ xpBook });
  const restored = emptyBoardingBook(saved);
  restored.attempts = {};
  for (const [id, row] of Object.entries(saved.attempts || {})) {
    const clean = sanitizeAttempt(row);
    if (clean?.attemptId) restored.attempts[id] = clean;
  }
  restored.awayTeamXp = awayTeamXpSnapshot(xpBook || saved.awayTeamXp);
  restored.npcBoardingImplemented = false;
  restored.magnitudesLockedFromRemastered = false;
  restored.successPercentLocked = false;
  return restored;
}

function sanitizeAttempt(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const outcome = BOARDING_OUTCOMES.includes(raw.outcome) ? raw.outcome : (raw.outcome == null ? null : null);
  let captured = raw.captured === true;
  let scuttled = raw.scuttled === true;
  if (captured && scuttled) {
    captured = false;
    scuttled = false;
  }
  return {
    attemptId: String(raw.attemptId),
    actorInstanceId: String(raw.actorInstanceId || 'player'),
    victimInstanceId: String(raw.victimInstanceId || ''),
    hullRatioAtStart: Number.isFinite(Number(raw.hullRatioAtStart)) ? Number(raw.hullRatioAtStart) : null,
    outcome,
    captured,
    scuttled,
    firedAtLocalMs: Math.max(0, Number(raw.firedAtLocalMs) || 0),
    resolvedAtLocalMs: raw.resolvedAtLocalMs == null ? null : Math.max(0, Number(raw.resolvedAtLocalMs) || 0),
    travelMs: Math.max(0, Number(raw.travelMs) || 0),
    status: raw.status === 'resolved' || raw.status === 'failed' || raw.status === 'cancelled'
      ? raw.status
      : (outcome ? 'resolved' : 'in-transit'),
  };
}

export function nextAttemptId(book) {
  const n = Math.max(1, Number(book?.nextAttemptId) || 1);
  if (book) book.nextAttemptId = n + 1;
  return `brd-${n}`;
}

export function listAttempts(book) {
  return Object.values(book?.attempts || {});
}

export function getAttempt(book, attemptId) {
  if (!book || attemptId == null) return null;
  return book.attempts[String(attemptId)] || null;
}

export function issueBoardingAttempt(book, input = {}, localElapsedMs = 0) {
  const store = book || emptyBoardingBook();
  const attemptId = input.attemptId || nextAttemptId(store);
  const travelMs = Math.max(0, Number(input.travelMs) || 0);
  const attempt = {
    attemptId,
    actorInstanceId: String(input.actorInstanceId || 'player'),
    victimInstanceId: String(input.victimInstanceId || ''),
    hullRatioAtStart: Number.isFinite(Number(input.hullRatioAtStart)) ? Number(input.hullRatioAtStart) : null,
    outcome: null,
    captured: false,
    scuttled: false,
    firedAtLocalMs: Math.max(0, Number(localElapsedMs) || 0),
    resolvedAtLocalMs: null,
    travelMs,
    status: 'in-transit',
  };
  store.attempts[attemptId] = attempt;
  store.inFlightId = attemptId;
  return { ok: true, attempt, book: store };
}

export function xorFlags(outcome) {
  if (outcome === 'capture') return { captured: true, scuttled: false, destroyed: false };
  if (outcome === 'scuttle') return { captured: false, scuttled: true, destroyed: true };
  return { captured: false, scuttled: false, destroyed: false };
}

export function xorOk(captured, scuttled) {
  return !(captured === true && scuttled === true);
}

/**
 * Resolve one attempt. Hard-fails if both flags would stamp true.
 * Named inject is the first-slice resolver (odds TBD).
 */
export function resolveBoardingAttempt(book, attemptId, outcome, extras = {}) {
  const store = book || emptyBoardingBook();
  const attempt = getAttempt(store, attemptId);
  if (!attempt) return { ok: false, reason: 'missing-attempt' };
  if (extras.captured === true && extras.scuttled === true) {
    return {
      ok: false,
      reason: 'xor-violation',
      captured: false,
      scuttled: false,
      xorOk: false,
      attempt,
    };
  }
  if (outcome && !BOARDING_OUTCOMES.includes(outcome)) {
    return { ok: false, reason: 'invalid-outcome', attempt };
  }
  const flags = xorFlags(outcome || 'fail');
  if (!xorOk(flags.captured, flags.scuttled)) {
    return { ok: false, reason: 'xor-violation', captured: false, scuttled: false, xorOk: false, attempt };
  }
  attempt.outcome = outcome || 'fail';
  attempt.captured = flags.captured;
  attempt.scuttled = flags.scuttled;
  attempt.resolvedAtLocalMs = Math.max(0, Number(extras.localElapsedMs) || 0);
  attempt.status = attempt.outcome === 'fail' ? 'failed' : 'resolved';
  store.lastOutcome = attempt.outcome;
  if (store.inFlightId === attempt.attemptId) store.inFlightId = null;
  let xp = awayTeamXpSnapshot(extras.xpBook);
  if (extras.xpBook) {
    applyAwayTeamXpOutcome(extras.xpBook, {
      outcome: attempt.outcome,
      unrecovered: extras.unrecovered === true,
      attemptId: attempt.attemptId,
      captured: attempt.captured,
      scuttled: attempt.scuttled,
    });
    xp = awayTeamXpSnapshot(extras.xpBook);
    mirrorAwayTeamXp(store, extras.xpBook);
  } else {
    store.awayTeamXp = xp;
  }
  return {
    ok: true,
    attempt,
    outcome: attempt.outcome,
    captured: attempt.captured,
    scuttled: attempt.scuttled,
    xorOk: true,
    sayable: sayableOutcome(attempt.outcome),
    applyKillStanding: false,
    awayTeamXp: xp,
  };
}

export function injectBoardingAttempt(book, input = {}, localElapsedMs = 0) {
  if (input.captured === true && input.scuttled === true) {
    return { ok: false, reason: 'xor-violation', captured: false, scuttled: false, xorOk: false };
  }
  const issued = issueBoardingAttempt(book, input, localElapsedMs);
  const resolved = resolveBoardingAttempt(issued.book, issued.attempt.attemptId, input.outcome || 'fail', {
    localElapsedMs: Number(localElapsedMs) + Number(input.travelMs || 0),
    captured: input.captured,
    scuttled: input.scuttled,
    xpBook: input.xpBook,
    unrecovered: input.unrecovered === true,
  });
  return resolved;
}

export function tickBoarding(book, localElapsedMs = 0, extras = {}) {
  const store = book || emptyBoardingBook();
  const now = Math.max(0, Number(localElapsedMs) || 0);
  const results = [];
  for (const attempt of listAttempts(store)) {
    if (attempt.status !== 'in-transit') continue;
    if (now < attempt.firedAtLocalMs + attempt.travelMs) continue;
    const outcome = extras.outcome
      || extras.outcomes?.[attempt.attemptId]
      || 'fail';
    results.push(resolveBoardingAttempt(store, attempt.attemptId, outcome, {
      localElapsedMs: now,
      xpBook: extras.xpBook,
      unrecovered: extras.unrecovered === true,
    }));
  }
  return { ok: true, results, book: store };
}

export function cancelInFlight(book, localElapsedMs = 0, extras = {}) {
  const store = book || emptyBoardingBook();
  const attempt = store.inFlightId ? getAttempt(store, store.inFlightId) : null;
  if (!attempt || attempt.status !== 'in-transit') {
    return { ok: false, reason: 'no-inflight' };
  }
  attempt.outcome = 'fail';
  attempt.captured = false;
  attempt.scuttled = false;
  attempt.status = 'cancelled';
  attempt.resolvedAtLocalMs = Math.max(0, Number(localElapsedMs) || 0);
  store.inFlightId = null;
  let xp = awayTeamXpSnapshot(extras.xpBook);
  if (extras.xpBook) {
    applyAwayTeamXpOutcome(extras.xpBook, {
      unrecovered: true,
      attemptId: attempt.attemptId,
      captured: false,
      scuttled: false,
    });
    xp = awayTeamXpSnapshot(extras.xpBook);
    mirrorAwayTeamXp(store, extras.xpBook);
  }
  return { ok: true, attempt, captured: false, scuttled: false, awayTeamXp: xp };
}

export function sayableOutcome(outcome) {
  if (outcome === 'capture') return 'Away team reports: prize taken. Hull captured — not destroyed.';
  if (outcome === 'scuttle') return 'Away team reports: scuttled. Hull destroyed by the attempt.';
  return 'Away team failed. Hull remains theirs. Not a kill token.';
}

export function snapshotAttempt(book) {
  const attempt = book?.inFlightId
    ? getAttempt(book, book.inFlightId)
    : listAttempts(book).slice(-1)[0] || null;
  return {
    attemptId: attempt?.attemptId || null,
    outcome: attempt?.outcome || null,
    captured: attempt?.captured === true,
    scuttled: attempt?.scuttled === true,
    xorOk: xorOk(attempt?.captured === true, attempt?.scuttled === true),
  };
}
