/**
 * Ship-to-ship command transfer among owned / captured hulls.
 *
 * Source of truth:
 * - docs/boarding/BM1-BOARDING-CAPTURE-PROPOSAL.md §12
 *
 * Separate from boarding. Does not require ≤10% hull. Does not gift a foreign
 * fleet, rewrite ROE, inject engagement_authorized, or call resolveNewLiveShipId.
 */

export const COMMAND_TRANSFER_SAME_SYSTEM_ONLY = true;

export function hullIsPlayerOwned(hull = {}, extras = {}) {
  if (!hull || hull.destroyed === true) return false;
  if (hull.flagship === true || hull.id === extras.flagshipCommandId) return true;
  if (hull.captured === true) return true;
  if (hull.assignment === 'escort' || hull.assignment === 'fleet' || hull.assignment === 'prize') return true;
  if (hull.role === 'playerEscort' || hull.role === 'playerFleet') return true;
  if (hull.fleetId && extras.ownedIds instanceof Set && extras.ownedIds.has(hull.fleetId)) return true;
  if (extras.ownedIds instanceof Set && extras.ownedIds.has(hull.id)) return true;
  return false;
}

export function evaluateCommandTransfer({
  flagship = null,
  target = null,
  sameSystem = true,
  ownedIds = null,
} = {}) {
  if (!target) {
    return { ok: false, reason: 'missing-target', sayable: 'No hull selected for command transfer.' };
  }
  if (target.destroyed === true) {
    return { ok: false, reason: 'wreck', sayable: 'Cannot take command of a wreck.' };
  }
  if (target.ghost === true || target.decoy === true || target.stationTypeId) {
    return { ok: false, reason: 'not-a-hull', sayable: 'Cannot take command of a foreign hull you have not captured.' };
  }
  if (sameSystem === false) {
    return { ok: false, reason: 'out-of-system', sayable: 'Command transfer is same-system only.' };
  }
  const owned = hullIsPlayerOwned(target, { flagshipCommandId: flagship?.id, ownedIds });
  if (!owned && target.captured !== true) {
    return {
      ok: false,
      reason: 'foreign-not-captured',
      sayable: 'Cannot take command of a foreign hull you have not captured.',
      foreignRefuse: true,
    };
  }
  if (flagship && (target.id === flagship.id || target.flagship === true)) {
    return { ok: true, noop: true, sayable: 'Already in command of that hull.' };
  }
  return {
    ok: true,
    reason: null,
    sayable: `Command transferred to ${target.name || target.id}. Former flagship remains yours.`,
    requireBoarding: false,
    requireHullThreshold: false,
    tractorIsTransfer: false,
    engagement_authorized: undefined,
    playerFactionUnchanged: true,
  };
}

/**
 * Pure swap of two hull snapshots. Caller applies to state.playership / playerFleet.
 * Preserves both identities. Never fills empty slots.
 */
export function transferCommand(flagship, target, extras = {}) {
  const verdict = evaluateCommandTransfer({
    flagship,
    target,
    sameSystem: extras.sameSystem !== false,
    ownedIds: extras.ownedIds || null,
  });
  if (!verdict.ok) return { ...verdict, previous: flagship, next: null };
  if (verdict.noop) {
    return {
      ...verdict,
      previous: flagship,
      next: flagship,
      previousStillOwned: true,
      applyShipDefaultWeaponsCalled: false,
      resolveNewLiveShipIdCalled: false,
    };
  }
  const previous = {
    ...flagship,
    flagship: false,
    assignment: flagship?.assignment || 'escort',
    role: flagship?.role || 'playerEscort',
    weaponSlots: Array.isArray(flagship?.weaponSlots) ? flagship.weaponSlots.slice() : flagship?.weaponSlots,
  };
  const next = {
    ...target,
    flagship: true,
    weaponSlots: Array.isArray(target?.weaponSlots) ? target.weaponSlots.slice() : target?.weaponSlots,
  };
  return {
    ok: true,
    previous,
    next,
    previousStillOwned: true,
    flagshipInstanceId: next.id,
    shipIdPreserved: next.shipId === target.shipId,
    slotsPreserved: JSON.stringify(next.weaponSlots) === JSON.stringify(target.weaponSlots),
    applyShipDefaultWeaponsCalled: false,
    resolveNewLiveShipIdCalled: false,
    playerFactionUnchanged: true,
    playerSideUnchanged: true,
    remanUnlockUnchanged: true,
    holdOutsidePreserved: extras.holdOutsidePreserved !== false,
    engagement_authorized: undefined,
    mayAutoEngageUnchanged: true,
    sayable: verdict.sayable,
  };
}

export function listTransferEligible(hulls = [], extras = {}) {
  return (Array.isArray(hulls) ? hulls : []).filter((hull) => {
    if (!hull || hull.destroyed) return false;
    if (extras.sameSystem === false) return false;
    return hullIsPlayerOwned(hull, extras);
  });
}
