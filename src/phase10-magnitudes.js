/**
 * Phase 10 Dominion-first — injectable clocks / odds (gate 5 soft).
 *
 * Source of truth:
 * - docs/phase10/BM1-PHASE10-DOMINION-FIRST-PROPOSAL.md §7 / §11 S18.12
 * - docs/phase10/BM1-PHASE10-ENGINE-DEPENDENCIES.md
 *
 * Shape is locked. Numbers are TBD / injectable. Do not invent locked
 * discovery percentages or invasion odds.
 */

export const MAGNITUDES_LOCKED_FROM_REMASTERED = false;
export const DISCOVERY_ODDS_LOCKED = false;
export const INVASION_ODDS_LOCKED = false;
export const MAGNITUDES_INJECTABLE = true;

/**
 * Playtest defaults only. Tests assert the flags, not these numbers as balance.
 * Clocks use localElapsedMs / completed strategic jumps as declared.
 */
export const PHASE10_MAGNITUDES = Object.freeze({
  rumorToEvidenceJumps: null,
  evidenceToContactJumps: null,
  discoveryOdds: null,
  invasionOdds: null,
  procurementStoreFloor: 0,
  procurementSpend: 1,
  occupationIncomeWhenMet: 0,
});

export function resolvePhase10Magnitudes(injected = null) {
  return {
    ...PHASE10_MAGNITUDES,
    ...(injected && typeof injected === 'object' ? injected : {}),
  };
}

export function magnitudesSnapshot(injected = null) {
  return {
    discoveryOddsLocked: DISCOVERY_ODDS_LOCKED,
    invasionOddsLocked: INVASION_ODDS_LOCKED,
    magnitudesInjectable: MAGNITUDES_INJECTABLE,
    magnitudesLockedFromRemastered: MAGNITUDES_LOCKED_FROM_REMASTERED,
    magnitudes: resolvePhase10Magnitudes(injected),
    clockKind: 'localElapsedMs',
  };
}
