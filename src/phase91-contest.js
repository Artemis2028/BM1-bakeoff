/**
 * Phase 9.1 — RSS contest + burn-through (gates 2, 4).
 *
 * N = √Σ(cᵢ²) over all paid emitters. Q = E/(E+N). RF radius = B × √Q.
 * Funded receiver ⇒ radius > 0. Labels from true side, never claim.
 *
 * Source: docs/phase9/BM1-PHASE9.1-EW-ROBUSTNESS-PROPOSAL.md §4
 */

import { EW_CONSUMER_NAME } from './phase65-power.js';
import {
  actorJammerDraw,
  fieldIsLive,
  getActor,
  jammerSpend,
  mapSensorsPoints,
  resolvePhase91Defaults,
} from './phase91-power.js';

function clampNonNeg(value) {
  return Math.max(0, Number(value) || 0);
}

function normalizeKey(value, fallback = '') {
  const key = String(value ?? '').trim();
  return key && key !== 'undefined' && key !== 'null' ? key : fallback;
}

export function rssNoise(contributions = []) {
  let sumSq = 0;
  for (const c of contributions) {
    const v = clampNonNeg(c);
    sumSq += v * v;
  }
  return Math.sqrt(sumSq);
}

export function contestQuality(E, N) {
  const energy = clampNonNeg(E);
  const noise = clampNonNeg(N);
  if (energy <= 0) return 0;
  return energy / (energy + noise);
}

export function burnThroughRadius(B, Q) {
  const b = Math.max(0, Number(B) || 0);
  const q = Math.max(0, Number(Q) || 0);
  return b * Math.sqrt(q);
}

export function rangeFalloff(c, distance, radius, extras = {}) {
  const base = clampNonNeg(c);
  if (extras.falloff === false || distance == null || radius == null) return base;
  const d = clampNonNeg(distance);
  const r = Math.max(0.0001, Number(radius) || 0);
  return base / (1 + (d / r) * (d / r));
}

function paidContribution(row, extras = {}) {
  if (!row || row.paid === false || clampNonNeg(row.draw) <= 0) return 0;
  let c = clampNonNeg(row.strength);
  if (row.own === true || extras.selfCancelFor === row.actorKey) {
    const factor = extras.selfCancel != null ? extras.selfCancel : 0.25;
    c *= factor;
  }
  if (row.distance != null && row.radius != null) {
    c = rangeFalloff(c, row.distance, row.radius, extras);
  }
  return c;
}

export function collectPaidEmitters(book, localElapsedMs = 0, extras = {}) {
  const rows = [];
  const observerKey = normalizeKey(extras.observerKey);
  const defaults = resolvePhase91Defaults(extras.defaults || book?.defaults);
  for (const actor of Object.values(book?.actors || {})) {
    const draw = actorJammerDraw(book, actor.actorKey, localElapsedMs, {
      H: extras.HFor?.[actor.actorKey] ?? extras.H ?? actor.lastH,
      S: extras.SFor?.[actor.actorKey] ?? actor.S,
      magnitudes: extras.magnitudes || book.magnitudes,
      defaults,
      powerNorm: extras.powerNormFor?.[actor.actorKey],
      ewStarved: extras.ewStarvedFor?.[actor.actorKey],
    });
    const live = fieldIsLive(actor, localElapsedMs) && draw > 0;
    const spend = jammerSpend(actor, {
      commanded: actor.commanded,
      fitted: actor.ewEquipmentId,
      spinning: localElapsedMs < actor.spinUpUntilLocalMs,
      cooling: localElapsedMs < actor.cooldownUntilLocalMs,
      H: extras.HFor?.[actor.actorKey] ?? extras.H ?? actor.lastH,
      S: extras.SFor?.[actor.actorKey] ?? actor.S,
      magnitudes: extras.magnitudes || book.magnitudes,
      defaults,
    });
    const own = actor.actorKey === observerKey;
    const paid = live && spend.strength > 0 && draw > 0;
    const row = {
      actorKey: actor.actorKey,
      securityInstanceId: actor.securityInstanceId,
      sideId: actor.sideId,
      draw,
      strength: spend.strength,
      radius: spend.radius,
      paid,
      own,
      claim: extras.claims?.[actor.actorKey] || null,
    };
    row.c = paidContribution(row, {
      selfCancel: defaults.selfCancel,
      selfCancelFor: observerKey,
      falloff: extras.falloff,
    });
    if (paid) rows.push(row);
    if (paid) {
      book.emitters[actor.actorKey] = {
        actorKey: actor.actorKey,
        securityInstanceId: actor.securityInstanceId,
        sideId: actor.sideId,
        draw,
        c: row.c,
        paid: true,
        atLocalMs: localElapsedMs,
      };
    } else if (book.emitters[actor.actorKey]) {
      delete book.emitters[actor.actorKey];
    }
  }
  return rows;
}

export function interferenceLabel(contributions, observer = {}, extras = {}) {
  const observerKey = normalizeKey(observer.actorKey || observer.observerKey);
  const observerSide = normalizeKey(observer.sideId || observer.playerSide);
  const own = contributions.filter((row) => row.own || row.actorKey === observerKey);
  const friendly = contributions.filter((row) => (
    !row.own && row.actorKey !== observerKey
    && observerSide
    && normalizeKey(row.sideId) === observerSide
  ));
  const foreign = contributions.filter((row) => (
    !row.own && row.actorKey !== observerKey
    && (!observerSide || normalizeKey(row.sideId) !== observerSide)
  ));
  const ownN = rssNoise(own.map((row) => row.c));
  const friendlyN = rssNoise(friendly.map((row) => row.c));
  const foreignN = rssNoise(foreign.map((row) => row.c));
  const ownish = ownN + friendlyN;
  const material = extras.material ?? 1e-9;
  let source = 'unlabeled';
  if (ownish > material && foreignN > material) source = 'mixed';
  else if (ownN >= friendlyN && ownN > material) source = 'own';
  else if (friendlyN > material) source = 'friendly';
  else if (foreignN > material) source = 'unlabeled';
  return {
    source,
    inventedFaction: false,
    usedClaim: false,
    ownN,
    friendlyN,
    foreignN,
  };
}

export function snapshotContest(book, receiver = {}, localElapsedMs = 0, extras = {}) {
  const defaults = resolvePhase91Defaults(extras.defaults || book?.defaults);
  const contributions = extras.contributions || collectPaidEmitters(book, localElapsedMs, {
    ...extras,
    observerKey: receiver.actorKey || receiver.observerKey,
    defaults,
  });
  const N = extras.N != null ? clampNonNeg(extras.N) : rssNoise(contributions.map((row) => row.c));
  const S = mapSensorsPoints(receiver, extras);
  let E = extras.E != null ? clampNonNeg(extras.E) : (S > 0 ? apertureFromReceiver(receiver, extras) : 0);
  if (extras.ewStarved === true || extras.H === 0) E = 0;
  if (receiver.eccm === 'boost' || extras.eccm === 'boost') {
    if (S > 0 && E > 0) E *= defaults.eccmBoost;
  }
  const Q = contestQuality(E, N);
  const B = extras.B != null ? Number(extras.B) : defaults.burnThroughB;
  const rfRadius = burnThroughRadius(B, Q);
  const ratio = E > 0 ? N / E : (N > 0 ? Infinity : 0);
  const receiverState = E <= 0 ? 'unfunded' : (ratio <= defaults.clearRatio ? 'clear' : 'interference');
  const source = interferenceLabel(contributions, receiver, extras);
  const snapshot = {
    contributions: contributions.map((row) => ({
      actorKey: row.actorKey,
      securityInstanceId: row.securityInstanceId,
      sideId: row.sideId,
      c: row.c,
      draw: row.draw,
      paid: row.paid === true,
    })),
    N,
    E,
    Q,
    B,
    rfRadius,
    label: receiverState === 'clear' ? 'clear' : 'interference',
    receiverState,
    source: source.source,
    inventedFaction: false,
    usedClaim: false,
    funded: E > 0,
    alwaysAvailable: E > 0 && Number.isFinite(N) && rfRadius > 0,
    cloakVoid: false,
    consumer: EW_CONSUMER_NAME,
    strongestThree: false,
    percentCeiling: false,
  };
  if (book) book.lastContest = snapshot;
  return snapshot;
}

function apertureFromReceiver(receiver = {}, extras = {}) {
  if (extras.E != null) return clampNonNeg(extras.E);
  const S = mapSensorsPoints(receiver, extras);
  if (S <= 0) return 0;
  const A = 0.5 + 0.1 * S;
  const H = extras.H != null ? extras.H : 1;
  return A * Math.max(0, H);
}

export function injectJamField(book, emitters = [], localElapsedMs = 0, extras = {}) {
  if (!book || typeof collectPaidEmitters !== 'function') {
    return { ok: false, reason: 'contest-helper-missing' };
  }
  const rows = Array.isArray(emitters) ? emitters : [emitters];
  for (const spec of rows) {
    const actor = getActor(book, spec.actorKey);
    actor.ewEquipmentId = spec.fitted || spec.tierId || actor.ewEquipmentId || 'compact';
    actor.commanded = 'on';
    actor.sideId = spec.sideId || actor.sideId;
    actor.securityInstanceId = spec.securityInstanceId || actor.securityInstanceId;
    actor.spinUpUntilLocalMs = spec.spinning ? (localElapsedMs + 1000) : 0;
    actor.cooldownUntilLocalMs = 0;
    if (spec.S != null) actor.S = spec.S;
    if (spec.draw === 0 || spec.paid === false) {
      actor.commanded = 'off';
    }
  }
  const contest = snapshotContest(book, extras.receiver || { actorKey: extras.observerKey, sideId: extras.sideId, S: extras.S, E: extras.E }, localElapsedMs, extras);
  return { ok: true, contest };
}

export { apertureFromReceiver };
