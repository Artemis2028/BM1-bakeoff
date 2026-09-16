/**
 * Phase 9.2 — directional lobes on the landed 9.1 contest (gate 1).
 *
 * Masks each paid cᵢ by in-lobe before RSS. Out-of-lobe is zero contribution
 * from that emitter, not cloak. Friendlies in-lobe still take N.
 *
 * Source: docs/phase9/BM1-PHASE9.2-EW-DEPTH-PROPOSAL.md §3
 */

import { resolvePhase94Defaults } from './phase94-magnitudes.js';

function clampNonNeg(value) {
  return Math.max(0, Number(value) || 0);
}

function rssNoise(contributions = []) {
  let sumSq = 0;
  for (const c of contributions) {
    const v = clampNonNeg(c);
    sumSq += v * v;
  }
  return Math.sqrt(sumSq);
}

function normalizeKey(value, fallback = '') {
  const key = String(value ?? '').trim();
  return key && key !== 'undefined' && key !== 'null' ? key : fallback;
}

function lobeDefaults(extras = {}, book = null) {
  return resolvePhase94Defaults(extras.defaults || extras.magnitudes || book?.defaults);
}

/** Smallest angular distance in degrees, in [0, 180]. */
export function angularDistanceDeg(a, b) {
  const left = Number(a) || 0;
  const right = Number(b) || 0;
  let diff = Math.abs(left - right) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

/**
 * Bearing from `from` to `to` in hull-facing degrees (0 = up, 90 = right),
 * matching `state.ship.rotation` / NPC `rotation`.
 */
export function bearingDeg(from = {}, to = {}) {
  const dx = (Number(to.x) || 0) - (Number(from.x) || 0);
  const dy = (Number(to.y) || 0) - (Number(from.y) || 0);
  return (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
}

export function inLobe(headingDeg, receiverBearingDeg, halfAngleDeg) {
  const alpha = Number(halfAngleDeg);
  if (!Number.isFinite(alpha)) return true;
  if (alpha >= 180) return true;
  if (alpha <= 0) return angularDistanceDeg(headingDeg, receiverBearingDeg) <= 0;
  return angularDistanceDeg(headingDeg, receiverBearingDeg) <= alpha;
}

export function lobeMask(c, inLobeFlag, sidelobeFactor = 0) {
  const base = clampNonNeg(c);
  if (inLobeFlag) return base;
  return base * clampNonNeg(sidelobeFactor);
}

function resolveGeometry(row = {}, extras = {}) {
  const actorKey = normalizeKey(row.actorKey);
  if (extras.inLobeFor && Object.prototype.hasOwnProperty.call(extras.inLobeFor, actorKey)) {
    return { inLobe: extras.inLobeFor[actorKey] === true, heading: extras.headingFor?.[actorKey] ?? row.heading ?? 0 };
  }
  if (row.inLobe === true || row.inLobe === false) {
    return { inLobe: row.inLobe === true, heading: row.heading ?? extras.headingFor?.[actorKey] ?? 0 };
  }
  const emitterPos = extras.positionFor?.[actorKey] || row.position || extras.emitterPosition;
  const receiverPos = extras.receiverPosition || extras.receiver?.position;
  const heading = extras.headingFor?.[actorKey] ?? row.heading ?? extras.heading ?? 0;
  const defaults = lobeDefaults(extras);
  const half = extras.halfAngleDeg ?? extras.lobeHalfAngleDeg ?? defaults.lobeHalfAngleDeg;
  if (emitterPos && receiverPos && extras.lobe !== false) {
    const beta = bearingDeg(emitterPos, receiverPos);
    return { inLobe: inLobe(heading, beta, half), heading, bearing: beta, halfAngleDeg: half };
  }
  // No geometry: isotropic fallback so 9.1 suites stay green (α unused).
  return { inLobe: true, heading, halfAngleDeg: half, isotropicFallback: true };
}

export function applyLobeToContribution(row, extras = {}) {
  const defaults = lobeDefaults(extras);
  const geo = resolveGeometry(row, { ...extras, defaults });
  const sidelobe = extras.sidelobeFactor ?? defaults.sidelobeFactor;
  const cUnmasked = clampNonNeg(row.c);
  const cMasked = lobeMask(cUnmasked, geo.inLobe, sidelobe);
  return {
    ...row,
    heading: geo.heading,
    bearing: geo.bearing,
    halfAngleDeg: geo.halfAngleDeg ?? extras.halfAngleDeg ?? defaults.lobeHalfAngleDeg,
    inLobe: geo.inLobe,
    isotropicFallback: geo.isotropicFallback === true,
    cUnmasked,
    c: cMasked,
    cMasked,
    sidelobeFactor: sidelobe,
  };
}

export function applyLobeMask(contributions = [], extras = {}) {
  return contributions.map((row) => applyLobeToContribution(row, extras));
}

export function snapshotLobe(contributions = [], extras = {}) {
  const masked = applyLobeMask(contributions, extras);
  const inLobeRows = masked.filter((row) => row.inLobe && row.paid !== false);
  const N = rssNoise(masked.map((row) => row.c));
  const friendlyInLobe = masked.filter((row) => (
    row.inLobe
    && !row.own
    && extras.observerSide
    && normalizeKey(row.sideId) === normalizeKey(extras.observerSide)
  ));
  return {
    halfAngleDeg: extras.halfAngleDeg ?? lobeDefaults(extras).lobeHalfAngleDeg,
    heading: extras.heading ?? masked[0]?.heading ?? 0,
    contributions: masked,
    N,
    inLobeCount: inLobeRows.length,
    friendlyInLobeTookN: friendlyInLobe.some((row) => row.c > 0),
    cloakVoid: false,
    offBudget: extras.offBudget === true,
  };
}

export function lobesAreCloak() {
  return false;
}

/** Live α from the lobe helper — not a disconnected snapshot copy. */
export function lobeLiveMagnitudes(extras = {}, book = null) {
  const defaults = lobeDefaults(extras, book);
  return {
    lobeHalfAngleDeg: defaults.lobeHalfAngleDeg,
    sidelobeFactor: defaults.sidelobeFactor,
  };
}
