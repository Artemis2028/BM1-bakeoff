/**
 * S30 — away-team XP book (boarding soft residual).
 *
 * Source of truth:
 * - docs/away-team-xp/BM1-AWAY-TEAM-XP-PROPOSAL.md
 * - docs/away-team-xp/BM1-AWAY-TEAM-XP-ENGINE-DEPENDENCIES.md
 *
 * Written from those docs + landed boarding helpers only.
 * Does not crib BM1-remastered-work. AWAY_TEAM_XP_LOCKED_FROM_REMASTERED stays false.
 *
 * Subscribes to landed XOR resolve. Does not write hull%, XOR flags,
 * tractor-is-board, firingSolution, culture fire, or engagement_authorized.
 * Not a combat slot. Not utilityBook credentials. No locked XP table.
 *
 * Hard gates:
 * 1. Tracked book/API closes not_tracked_yet — named_mix, not slots / not utility.
 * 2. No boarding eligibility / XOR / tractor rewrite.
 * 3. Never gift firingSolution / culture fire / engagement_authorized.
 * 4. Do not reopen #33–#65.
 * 5. Named outs (Thaleron, P10 roster, combat retune, Flash locks, dockClear, ROE).
 * 6. Blind / remastered-lock false.
 * 7. Thin module + S30 probes; replay boarding / doctrine.
 * 8. Named mix + injectable magnitudes; no locked table.
 */

import { ROE_MODES } from './phase2-security.js';

export const AWAY_TEAM_XP_BOOK_VERSION = 1;
export const AWAY_TEAM_XP_LOCKED_FROM_REMASTERED = false;
export const AWAY_TEAM_XP_RULE = 'named_mix';
export const FORBIDDEN_AWAY_TEAM_XP_FIRE = 'engagement_authorized';

export const AWAY_TEAM_XP_EVENTS = Object.freeze({
  onCapture: 'award',
  onScuttle: 'award',
  onFail: 'retain',
  onUnrecovered: 'lose_pending',
});

/** TBD / playtest defaults — not remastered constants, not a Referee lock. */
export const AWAY_TEAM_XP_PLAYTEST_DEFAULTS = Object.freeze({
  captureAward: 10,
  scuttleAward: 5,
  failAward: 0,
  startingTotal: 0,
  loseCareerOnUnrecovered: false,
  pendingInTransit: false,
});

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function finiteOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function requireHelper(helper, name) {
  if (typeof helper !== 'function') {
    const error = new Error(`away-team-xp: ${name} missing`);
    error.missing = true;
    error.helper = name;
    throw error;
  }
}

export function requireAwayTeamXpHelpers() {
  requireHelper(emptyAwayTeamXpBook, 'emptyAwayTeamXpBook');
  requireHelper(awayTeamXpSnapshot, 'awayTeamXpSnapshot');
  requireHelper(applyAwayTeamXpOutcome, 'applyAwayTeamXpOutcome');
  requireHelper(resolveAwayTeamXpMagnitudes, 'resolveAwayTeamXpMagnitudes');
}

export function resolveAwayTeamXpMagnitudes(inject = null) {
  const src = asObject(inject) || {};
  return {
    captureAward: finiteOr(src.captureAward, AWAY_TEAM_XP_PLAYTEST_DEFAULTS.captureAward),
    scuttleAward: finiteOr(src.scuttleAward, AWAY_TEAM_XP_PLAYTEST_DEFAULTS.scuttleAward),
    failAward: finiteOr(src.failAward, AWAY_TEAM_XP_PLAYTEST_DEFAULTS.failAward),
    startingTotal: finiteOr(src.startingTotal, AWAY_TEAM_XP_PLAYTEST_DEFAULTS.startingTotal),
    loseCareerOnUnrecovered: src.loseCareerOnUnrecovered === true,
    pendingInTransit: src.pendingInTransit === true,
    playtest: true,
    tablePresent: false,
    lockedFromRemastered: AWAY_TEAM_XP_LOCKED_FROM_REMASTERED === true,
  };
}

export function injectAwayTeamXpMagnitudes(book, partial = {}) {
  requireHelper(resolveAwayTeamXpMagnitudes, 'resolveAwayTeamXpMagnitudes');
  const store = book && typeof book === 'object' ? book : emptyAwayTeamXpBook();
  store.inject = { ...(asObject(store.inject) || {}), ...(asObject(partial) || {}) };
  return resolveAwayTeamXpMagnitudes(store.inject);
}

export function emptyAwayTeamXpBook(extras = {}) {
  const inject = asObject(extras.inject) || asObject(extras.magnitudes) || null;
  const mag = resolveAwayTeamXpMagnitudes(inject);
  return {
    version: AWAY_TEAM_XP_BOOK_VERSION,
    tracked: true,
    rule: AWAY_TEAM_XP_RULE,
    events: { ...AWAY_TEAM_XP_EVENTS },
    total: finiteOr(extras.total, mag.startingTotal),
    pending: Math.max(0, finiteOr(extras.pending, 0)),
    lastAward: extras.lastAward && typeof extras.lastAward === 'object' ? { ...extras.lastAward } : null,
    tablePresent: false,
    magnitudesInjectable: true,
    AWAY_TEAM_XP_LOCKED_FROM_REMASTERED: false,
    inUtilityBook: false,
    inCombatSlots: false,
    inject,
  };
}

export function serializeAwayTeamXpBook(book) {
  const store = restoreAwayTeamXpBook(book);
  return {
    version: AWAY_TEAM_XP_BOOK_VERSION,
    tracked: true,
    rule: AWAY_TEAM_XP_RULE,
    events: { ...AWAY_TEAM_XP_EVENTS },
    total: store.total,
    pending: store.pending,
    lastAward: store.lastAward ? { ...store.lastAward } : null,
    tablePresent: false,
    magnitudesInjectable: true,
    AWAY_TEAM_XP_LOCKED_FROM_REMASTERED: false,
    inUtilityBook: false,
    inCombatSlots: false,
    inject: store.inject ? { ...store.inject } : null,
  };
}

export function restoreAwayTeamXpBook(saved) {
  if (!saved || typeof saved !== 'object') return emptyAwayTeamXpBook();
  const book = emptyAwayTeamXpBook({
    total: saved.total,
    pending: saved.pending,
    lastAward: saved.lastAward,
    inject: saved.inject,
  });
  book.tracked = true;
  book.rule = AWAY_TEAM_XP_RULE;
  book.tablePresent = false;
  book.inUtilityBook = false;
  book.inCombatSlots = false;
  book.AWAY_TEAM_XP_LOCKED_FROM_REMASTERED = false;
  return book;
}

export function awayTeamXpSnapshot(book = null) {
  const store = book && typeof book === 'object' ? restoreAwayTeamXpBook(book) : emptyAwayTeamXpBook();
  const mag = resolveAwayTeamXpMagnitudes(store.inject);
  return {
    tracked: true,
    rule: AWAY_TEAM_XP_RULE,
    events: { ...AWAY_TEAM_XP_EVENTS },
    total: store.total,
    pending: store.pending,
    lastAward: store.lastAward ? { ...store.lastAward } : null,
    tablePresent: false,
    magnitudesInjectable: true,
    captureAward: mag.captureAward,
    scuttleAward: mag.scuttleAward,
    failAward: mag.failAward,
    startingTotal: mag.startingTotal,
    loseCareerOnUnrecovered: mag.loseCareerOnUnrecovered === true,
    pendingInTransit: mag.pendingInTransit === true,
    AWAY_TEAM_XP_LOCKED_FROM_REMASTERED: false,
    lockedFromRemastered: false,
    inUtilityBook: false,
    inCombatSlots: false,
  };
}

export function awayTeamXpChromeLine(book = null) {
  const snap = awayTeamXpSnapshot(book);
  return `Away-team XP: tracked · named mix · total ${Number(snap.total) || 0}`;
}

export function awayTeamXpInjectMustNotGiftFire(inject = {}) {
  const row = asObject(inject) ? { ...inject } : {};
  delete row.firingSolution;
  delete row.engagement_authorized;
  delete row[FORBIDDEN_AWAY_TEAM_XP_FIRE];
  delete row.cultureFire;
  delete row.culture;
  return {
    row,
    firingSolutionPresent: false,
    engagementAuthorizedPresent: false,
    cultureFire: false,
    tractorIsBoard: false,
    twoModeRoe: ROE_MODES.slice(),
  };
}

export function injectAwayTeamXpPending(book, amount = 0) {
  const store = book && typeof book === 'object' ? book : emptyAwayTeamXpBook();
  store.pending = Math.max(0, finiteOr(amount, 0));
  return store;
}

/**
 * Named mix: award on capture/scuttle, retain on fail, lose pending on unrecovered.
 * Never writes XOR / hull% / fire / utility / slots.
 * tractorIsBoarding stays the EW helper — this module does not import it.
 */
export function applyAwayTeamXpOutcome(book, input = {}) {
  const store = book && typeof book === 'object' ? book : emptyAwayTeamXpBook();
  store.tracked = true;
  store.rule = AWAY_TEAM_XP_RULE;
  store.tablePresent = false;
  store.inUtilityBook = false;
  store.inCombatSlots = false;
  store.events = { ...AWAY_TEAM_XP_EVENTS };
  if (input.captured === true && input.scuttled === true) {
    return {
      ok: false,
      reason: 'xor-violation',
      awarded: 0,
      total: store.total,
      pending: store.pending,
      book: store,
      applyKillStanding: false,
      firingSolution: undefined,
      engagement_authorized: undefined,
    };
  }
  const mag = resolveAwayTeamXpMagnitudes(store.inject);
  const attemptId = input.attemptId == null ? null : String(input.attemptId);
  let event = 'fail';
  let awarded = 0;
  if (input.unrecovered === true) {
    event = 'unrecovered';
    store.pending = 0;
    if (mag.loseCareerOnUnrecovered === true) store.total = mag.startingTotal;
  } else if (input.outcome === 'capture') {
    event = 'capture';
    awarded = mag.captureAward;
    store.total += awarded;
    store.pending = 0;
    store.lastAward = { delta: awarded, attemptId, event };
  } else if (input.outcome === 'scuttle') {
    event = 'scuttle';
    awarded = mag.scuttleAward;
    store.total += awarded;
    store.pending = 0;
    store.lastAward = { delta: awarded, attemptId, event };
  } else {
    event = 'fail';
    awarded = mag.failAward;
    if (awarded) {
      store.total += awarded;
      store.lastAward = { delta: awarded, attemptId, event };
    }
    store.pending = 0;
  }
  return {
    ok: true,
    event,
    awarded,
    total: store.total,
    pending: store.pending,
    lastAward: store.lastAward,
    book: store,
    applyKillStanding: false,
    firingSolution: undefined,
    engagement_authorized: undefined,
    snapshot: awayTeamXpSnapshot(store),
  };
}
