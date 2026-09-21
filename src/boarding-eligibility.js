/**
 * Boarding eligibility — hull% refuse helper (gate 1).
 *
 * Source of truth:
 * - docs/boarding/BM1-BOARDING-CAPTURE-PROPOSAL.md
 * - docs/boarding/BM1-BOARDING-ENGINE-DEPENDENCIES.md
 *
 * Written from docs/ only. Does not crib BM1-remastered-work.
 *
 * Tractor hold is never a boarding start. Stations / wrecks / ghosts / decoys
 * are out. NPC ratio uses combatHull / maxCombatHull. Player percent uses
 * state.hull (0–100) and is not converted through NPC fields.
 *
 * Away-team XP live totals live on the sibling S30 book. This file only
 * re-exports the snapshot helper and must not change hull% / refuse reasons.
 */

import { awayTeamXpSnapshot as liveAwayTeamXpSnapshot } from './away-team-xp.js';

export const BOARDING_IMPLEMENTED = true;
export const NPC_BOARDING_IMPLEMENTED = false;
export const HULL_BOARDING_THRESHOLD = 0.10;
export const PLAYER_HULL_BOARDING_THRESHOLD = 10;
export const MAGNITUDES_LOCKED_FROM_REMASTERED = false;

/** Residual closed. Live totals live on state.awayTeamXpBook (S30). */
export const AWAY_TEAM_XP = Object.freeze({
  tracked: true,
  rule: 'named_mix',
  magnitudesInjectable: true,
  tablePresent: false,
});

export const BOARDING_API_NAMES = Object.freeze([
  'evaluateBoardingEligibility',
  'evaluateBoardingReach',
  'injectBoardingAttempt',
  'resolveBoardingAttempt',
  'capturePrizeHull',
  'makeCaptureToken',
  'hasCaptureForVictim',
  'markAssignmentCaptured',
  'transferCommand',
  'awayTeamXpSnapshot',
]);

export const REFUSE_REASONS = Object.freeze({
  HULL_ABOVE: 'hull-above-threshold',
  WRECK: 'wreck',
  DESTROYED: 'destroyed',
  STATION: 'station-not-boardable',
  GHOST: 'ghost-not-hull',
  DECOY: 'decoy-not-hull',
  OVERDUE: 'overdue-not-boardable',
  TRACTOR: 'tractor-is-not-board',
  NOT_DETECTED: 'not-detected',
  CLOAKED: 'cloaked-hidden',
  OUT_OF_RANGE: 'out-of-range',
  OTHER_SYSTEM: 'out-of-system',
  CHECKPOINT: 'checkpoint-does-not-authorize',
  RESIDUE: 'residue-only',
  REPORT: 'report-only',
  FOREIGN: 'foreign-not-captured',
});

export function boardingApiNames() {
  return BOARDING_IMPLEMENTED ? [...BOARDING_API_NAMES] : [];
}

export function awayTeamXpSnapshot(book) {
  return liveAwayTeamXpSnapshot(book);
}

export function hullRatio(target = {}) {
  const max = Number(target.maxCombatHull);
  const hull = Number(target.combatHull);
  if (!(max > 0)) return null;
  return hull / max;
}

export function playerHullRatio(hullPercent) {
  const pct = Number(hullPercent);
  if (!Number.isFinite(pct)) return null;
  return pct / 100;
}

export function isStationTarget(target = {}) {
  return Boolean(target.stationTypeId)
    || target.kind === 'station'
    || target.assetType === 'station'
    || target.role === 'station';
}

export function isGhostTarget(target = {}) {
  return target.ghost === true
    || target.source === 'ew_ghost'
    || target.kind === 'ew_ghost';
}

export function isDecoyTarget(target = {}) {
  return target.decoy === true
    || target.source === 'ew_decoy'
    || target.kind === 'ew_decoy';
}

export function boardingEligibleHull(target = {}) {
  const verdict = evaluateBoardingEligibility(target);
  return verdict.ok === true;
}

export function evaluateBoardingEligibility(target = {}, extras = {}) {
  if (extras.tractorHoldOnly === true && extras.boardingOrderIssued !== true) {
    return refuse(target, REFUSE_REASONS.TRACTOR, 'Tractor hold is not a capture.');
  }
  if (isGhostTarget(target) || extras.ghost === true) {
    return refuse(target, REFUSE_REASONS.GHOST, 'Ghosts are not prize hulls.');
  }
  if (isDecoyTarget(target) || extras.decoy === true) {
    return refuse(target, REFUSE_REASONS.DECOY, 'Decoys are not prize hulls.');
  }
  if (isStationTarget(target) || extras.station === true) {
    return refuse(target, REFUSE_REASONS.STATION, 'Stations are not boarding targets.');
  }
  if (extras.overdueOnly === true && !target.combatHull && !target.maxCombatHull) {
    return refuse(target, REFUSE_REASONS.OVERDUE, 'Overdue is not a boarding start.');
  }
  if (target.destroyed === true) {
    return refuse(target, REFUSE_REASONS.DESTROYED, 'Destroyed hulls cannot be boarded.');
  }

  if (extras.playerHull === true || target.playerFlagship === true) {
    const pct = Number(target.hull != null ? target.hull : extras.hull);
    const ratio = playerHullRatio(pct);
    if (!Number.isFinite(ratio) || pct <= 0) {
      return refuse(target, REFUSE_REASONS.WRECK, 'Wrecks cannot be boarded.', ratio);
    }
    if (pct > PLAYER_HULL_BOARDING_THRESHOLD) {
      return refuse(target, REFUSE_REASONS.HULL_ABOVE, 'Hull above 10%. Boarding refused.', ratio);
    }
    return accept(target, ratio);
  }

  const max = Number(target.maxCombatHull);
  const hull = Number(target.combatHull);
  const ratio = hullRatio(target);
  if (!(max > 0) || !(hull > 0) || ratio == null) {
    return refuse(target, REFUSE_REASONS.WRECK, 'Wrecks cannot be boarded.', ratio);
  }
  if (ratio > HULL_BOARDING_THRESHOLD) {
    return refuse(target, REFUSE_REASONS.HULL_ABOVE, 'Hull above 10%. Boarding refused.', ratio);
  }
  return accept(target, ratio);
}

function refuse(target, reason, sayable, ratio = hullRatio(target)) {
  return {
    ok: false,
    eligible: false,
    reason,
    ratio,
    sayable,
    captured: false,
    scuttled: false,
    tractorIsBoard: false,
    target,
  };
}

function accept(target, ratio) {
  return {
    ok: true,
    eligible: true,
    reason: null,
    ratio,
    sayable: 'Hull at or below 10%. Boarding available — tractor hold is not a capture.',
    captured: false,
    scuttled: false,
    tractorIsBoard: false,
    target,
  };
}
