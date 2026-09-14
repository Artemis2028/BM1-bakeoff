/**
 * Phase 9.2 — silent-running (gate 5).
 *
 * Spend-to-suppress emission scale on reserved `ew`. Not cloak-void.
 * Residue-before-void and burn-through still apply.
 *
 * Source: docs/phase9/BM1-PHASE9.2-EW-DEPTH-PROPOSAL.md §7.3
 */

import { EW_CONSUMER_NAME, reservedEwDraw } from './phase65-power.js';
import { silentIsCloak as claimSilentIsCloak } from './phase91-transponder.js';
import { getPhase92Actor, resolvePhase92Defaults } from './phase92-magnitudes.js';

function clamp01(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

export function silentRunningIsCloak() {
  return false;
}

export function commandSilentRunning(book, actorKey, on, extras = {}) {
  const actor = getPhase92Actor(book, actorKey);
  const H = extras.H == null ? 1 : clamp01(extras.H);
  if (on && (H <= 0 || extras.draw === 0 && extras.allowUnfunded !== true)) {
    if (H <= 0 || extras.failUnfunded === true || extras.draw === 0) {
      actor.silentRunning = false;
      return {
        ok: false,
        reason: 'unfunded',
        on: false,
        cloak: false,
        draw: 0,
        consumer: EW_CONSUMER_NAME,
      };
    }
  }
  actor.silentRunning = on === true;
  return {
    ok: true,
    on: actor.silentRunning,
    cloak: false,
    isPlayerCloaked: false,
    consumer: EW_CONSUMER_NAME,
  };
}

export function silentRunningDraw(actorOrBook, actorKey, extras = {}) {
  const actor = actorOrBook?.actors
    ? getPhase92Actor(actorOrBook, actorKey)
    : actorOrBook;
  if (!actor || actor.silentRunning !== true) {
    return { draw: 0, on: false, emissionScale: 1, cloak: false };
  }
  const defaults = resolvePhase92Defaults(extras.defaults || extras.magnitudes);
  const H = extras.H == null ? 1 : clamp01(extras.H);
  if (H <= 0) {
    return {
      draw: 0,
      on: true,
      failed: true,
      offBudget: true,
      emissionScale: defaults.silentRunningEmissionScale,
      cloak: false,
      consumer: EW_CONSUMER_NAME,
    };
  }
  return {
    draw: reservedEwDraw(defaults.silentRunningEwDraw * H),
    on: true,
    emissionScale: defaults.silentRunningEmissionScale,
    cloak: false,
    residueHeld: true,
    consumer: EW_CONSUMER_NAME,
    offBudget: false,
  };
}

export function combineEmissionScale(heatScale = 1, silentScale = 1, silentOn = false) {
  const heat = Math.max(0, Number(heatScale) || 0);
  if (!silentOn) return heat;
  return heat * Math.max(0, Number(silentScale) || 0);
}

export function silentSayable() {
  return 'Silent-running. Residue held. Not a cloak.';
}

export { claimSilentIsCloak };
