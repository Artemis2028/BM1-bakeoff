/**
 * Boarding legal reach — detection / cloak / range / same-system (gate 7).
 *
 * Source of truth:
 * - docs/boarding/BM1-BOARDING-CAPTURE-PROPOSAL.md §9
 *
 * Firing solution is not required. Residue / report / cloak-hidden refuse.
 * Escort share may supply detection only if the flagship row is actually
 * detected. Tractor range is not boarding range.
 */

import { REFUSE_REASONS } from './boarding-eligibility.js';

export const BOARDING_RANGE_LOCKED = false;
/** Injectable playtest envelope — not a lock; not tractor range. */
export const BOARDING_RANGE_PLAYTEST_DEFAULT = 280;

export function boardingRangeEnvelope(injected = null) {
  const n = Number(injected);
  if (Number.isFinite(n) && n > 0) return n;
  return BOARDING_RANGE_PLAYTEST_DEFAULT;
}

export function inBoardingRange(distance, injectedRange = null) {
  const limit = boardingRangeEnvelope(injectedRange);
  return Number(distance) <= limit;
}

export function evaluateBoardingReach(input = {}) {
  if (input.ghost === true) {
    return fail(REFUSE_REASONS.GHOST, 'Ghosts are not prize hulls.');
  }
  if (input.decoy === true) {
    return fail(REFUSE_REASONS.DECOY, 'Decoys are not prize hulls.');
  }
  if (input.sameSystem === false || input.otherSystem === true) {
    return fail(REFUSE_REASONS.OTHER_SYSTEM, 'Cannot board through another system.');
  }
  if (input.checkpointEnforcement === true) {
    return fail(REFUSE_REASONS.CHECKPOINT, 'Checkpoint refusal is not a boarding warrant.');
  }
  if (input.cloakedHidden === true) {
    return fail(REFUSE_REASONS.CLOAKED, 'Target cloaked from you. Boarding refused.');
  }
  if (input.residueOnly === true && input.detected !== true) {
    return fail(REFUSE_REASONS.RESIDUE, 'Residue is not a boarding lock.');
  }
  if (input.reportOnly === true && input.detected !== true) {
    return fail(REFUSE_REASONS.REPORT, 'A report is not a live boarding lock.');
  }
  if (input.detected !== true) {
    return fail(REFUSE_REASONS.NOT_DETECTED, 'No detection. Cannot board a hull you have not found.');
  }
  if (input.inRange === false) {
    return fail(REFUSE_REASONS.OUT_OF_RANGE, 'Out of boarding range.');
  }
  if (input.inRange == null && Number.isFinite(Number(input.distance))) {
    if (!inBoardingRange(input.distance, input.boardingRange)) {
      return fail(REFUSE_REASONS.OUT_OF_RANGE, 'Out of boarding range.');
    }
  }
  return {
    ok: true,
    reason: null,
    sayable: 'Legal reach. Detection held. Firing solution not required.',
    detected: true,
    firingSolution: input.firingSolution === true,
    firingSolutionRequired: false,
    giftedFs: false,
    cloakedHidden: false,
    inRange: true,
    sameSystem: input.sameSystem !== false,
    tractorIsReach: false,
  };
}

function fail(reason, sayable) {
  return {
    ok: false,
    reason,
    sayable,
    detected: false,
    firingSolutionRequired: false,
    giftedFs: false,
    inRange: reason !== REFUSE_REASONS.OUT_OF_RANGE ? null : false,
    sameSystem: reason !== REFUSE_REASONS.OTHER_SYSTEM,
    tractorIsReach: false,
  };
}
