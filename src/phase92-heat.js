/**
 * Phase 9.2 — jammer heat spend / emission tradeoff (gate 5).
 *
 * Extra reserved `ew` draw suppresses emission scale. Contest cᵢ stays the
 * paid jam strength. Off-budget / draw-0 suppress fails.
 *
 * Source: docs/phase9/BM1-PHASE9.2-EW-DEPTH-PROPOSAL.md §7.1
 */

import { EW_CONSUMER_NAME, reservedEwDraw } from './phase65-power.js';
import { decoyFamilyDraw } from './phase92-decoys.js';
import { getPhase92Actor, resolvePhase92Defaults } from './phase92-magnitudes.js';
import { combineEmissionScale, silentRunningDraw } from './phase92-silent.js';

function clampNonNeg(value) {
  return Math.max(0, Number(value) || 0);
}

function clamp01(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

export function commandHeatSuppress(book, actorKey, on, extras = {}) {
  const actor = getPhase92Actor(book, actorKey);
  const jammerOn = extras.jammerOn === true || extras.commanded === 'on';
  const jammerDraw = clampNonNeg(extras.jammerDraw);
  if (on && (!jammerOn || jammerDraw <= 0 || extras.H === 0)) {
    actor.heatSuppress = false;
    return {
      ok: false,
      reason: jammerDraw <= 0 ? 'draw-zero' : 'jammer-off',
      suppressOn: false,
      draw: 0,
      emissionScale: extras.heatEmissionUnsuppressed ?? 1,
      consumer: EW_CONSUMER_NAME,
    };
  }
  actor.heatSuppress = on === true;
  return { ok: true, suppressOn: actor.heatSuppress, consumer: EW_CONSUMER_NAME };
}

export function heatSuppressDraw(actorOrBook, actorKey, extras = {}) {
  const actor = actorOrBook?.actors
    ? getPhase92Actor(actorOrBook, actorKey)
    : actorOrBook;
  if (!actor || actor.heatSuppress !== true) {
    return { draw: 0, extraDraw: 0, emissionScale: extras.heatEmissionUnsuppressed ?? 1, suppressOn: false };
  }
  const defaults = resolvePhase92Defaults(extras.defaults || extras.magnitudes);
  const jammerOn = extras.jammerOn === true || extras.commanded === 'on';
  const jammerDraw = clampNonNeg(extras.jammerDraw);
  const H = extras.H == null ? 1 : clamp01(extras.H);
  const catalogDraw = clampNonNeg(extras.catalogDraw);
  if (!jammerOn || jammerDraw <= 0 || H <= 0) {
    return {
      draw: 0,
      extraDraw: 0,
      emissionScale: defaults.heatEmissionUnsuppressed,
      suppressOn: true,
      failed: true,
      offBudget: jammerOn && jammerDraw <= 0,
      consumer: EW_CONSUMER_NAME,
    };
  }
  const extra = catalogDraw * defaults.heatSuppressExtraEwFactor * H;
  return {
    draw: reservedEwDraw(extra),
    extraDraw: reservedEwDraw(extra),
    emissionScale: defaults.heatEmissionSuppressed,
    suppressOn: true,
    consumer: EW_CONSUMER_NAME,
    offBudget: false,
  };
}

export function heatSayable(suppressOn) {
  return suppressOn
    ? 'Jammer heat high. Paying ew to suppress emission.'
    : 'Jammer heat unsuppressed. Loud jam is cheaper and easier to DF.';
}

export function phase92ReservedDraw(ew92, actorKey, localElapsedMs = 0, extras = {}) {
  const heat = heatSuppressDraw(ew92, actorKey, extras);
  const silent = silentRunningDraw(ew92, actorKey, extras);
  const decoy = decoyFamilyDraw(ew92, actorKey, localElapsedMs, extras);
  const draw = reservedEwDraw(clampNonNeg(heat.draw) + clampNonNeg(silent.draw) + clampNonNeg(decoy.draw));
  const emissionScale = combineEmissionScale(heat.emissionScale ?? 1, silent.emissionScale ?? 1, silent.on === true);
  const actor = getPhase92Actor(ew92, actorKey);
  if (actor) {
    actor.lastDraw = draw;
    actor.lastEmissionScale = emissionScale;
    actor.lastH = extras.H == null ? actor.lastH : clamp01(extras.H);
  }
  const commandedOn = actor?.heatSuppress || actor?.silentRunning || actor?.decoyOn;
  return {
    draw,
    heat,
    silent,
    decoy,
    emissionScale,
    consumer: EW_CONSUMER_NAME,
    offBudget: commandedOn === true && draw === 0,
  };
}
