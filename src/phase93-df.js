/**
 * Phase 9.3 — DF assist classification / cue on reserved `ew` (gate 4).
 *
 * Spend-to-classify **paid in-lobe** emissions. Cue / annotation only.
 * Never gifted FS, never identity from leftover N, never claim rewrite,
 * never perfectSilentTrack. HoJ silence→coast stays.
 *
 * Source: docs/phase9/BM1-PHASE9.3-SCAN-POISON-DF-ASSIST-PROPOSAL.md §4
 *         docs/phase9/BM1-PHASE9.3-ENGINE-DEPENDENCIES.md
 */

import { EW_CONSUMER_NAME, reservedEwDraw } from './phase65-power.js';
import { interferenceLabel } from './phase91-contest.js';
import { phase92ReservedDraw } from './phase92-heat.js';
import {
  getPhase93Actor,
  resolvePhase93Defaults,
} from './phase93-magnitudes.js';
import { scanPoisonDraw } from './phase93-poison.js';

function clampNonNeg(value) {
  return Math.max(0, Number(value) || 0);
}

function clamp01(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

function normalizeKey(value, fallback = '') {
  const key = String(value ?? '').trim();
  return key && key !== 'undefined' && key !== 'null' ? key : fallback;
}

export const DF_ASSIST_CONTROL = 'df_assist';

export function dfGiftsFiringSolution() {
  return false;
}

export function dfInventsIdentity() {
  return false;
}

export function dfRewritesClaim() {
  return false;
}

export function dfPerfectSilentTrack() {
  return false;
}

export function dfSayable() {
  return 'DF assist: paid jammer emission classified. Cue only — not a firing solution, not identity. Silence still coasts.';
}

function dfLive(actor, localElapsedMs = 0) {
  if (!actor || actor.dfOn !== true) return false;
  const until = clampNonNeg(actor.dfUntilLocalMs);
  if (until > 0 && clampNonNeg(localElapsedMs) >= until) return false;
  return true;
}

export function commandDfAssist(book, actorKey, on, localElapsedMs = 0, extras = {}) {
  const actor = getPhase93Actor(book, actorKey);
  const defaults = resolvePhase93Defaults(extras.defaults || extras.magnitudes || book?.defaults);
  const now = clampNonNeg(localElapsedMs);
  const S = extras.S == null ? 4 : Number(extras.S) || 0;
  const H = extras.H == null ? 1 : clamp01(extras.H);
  if (on) {
    if (S <= 0) {
      actor.dfOn = false;
      actor.lastDfStatus = 'unavailable';
      return {
        ok: false,
        reason: 's-zero',
        on: false,
        draw: 0,
        consumer: EW_CONSUMER_NAME,
        status: 'unavailable',
        firingSolution: false,
        identityInvented: false,
      };
    }
    if (H <= 0 || extras.draw === 0) {
      actor.dfOn = false;
      actor.lastDfStatus = 'power-limited';
      return {
        ok: false,
        reason: H <= 0 ? 'unfunded' : 'draw-zero',
        on: false,
        draw: 0,
        offBudget: extras.draw === 0,
        consumer: EW_CONSUMER_NAME,
        status: 'power-limited',
        firingSolution: false,
        identityInvented: false,
      };
    }
    actor.dfOn = true;
    actor.dfUntilLocalMs = now + (extras.durationLocalMs ?? defaults.dfAssistDurationLocalMs);
    actor.sideId = extras.sideId || actor.sideId;
    actor.securityInstanceId = extras.securityInstanceId || actor.securityInstanceId;
    actor.lastH = H;
    actor.lastDfStatus = H < 1 ? 'power-limited' : 'on';
    return {
      ok: true,
      on: true,
      status: actor.lastDfStatus,
      untilLocalMs: actor.dfUntilLocalMs,
      consumer: EW_CONSUMER_NAME,
      firingSolution: false,
      liveWeaponTrack: false,
      engagement_authorized: undefined,
      identityInvented: false,
      claimRewritten: false,
      perfectSilentTrack: false,
    };
  }
  actor.dfOn = false;
  actor.dfUntilLocalMs = 0;
  actor.lastDfStatus = 'off';
  return {
    ok: true,
    on: false,
    status: 'off',
    consumer: EW_CONSUMER_NAME,
    firingSolution: false,
    identityInvented: false,
  };
}

export function dfAssistDraw(actorOrBook, actorKey, extras = {}) {
  const actor = actorOrBook?.actors
    ? getPhase93Actor(actorOrBook, actorKey)
    : actorOrBook;
  if (!actor || actor.dfOn !== true) {
    return {
      draw: 0,
      extraDraw: 0,
      on: false,
      consumer: EW_CONSUMER_NAME,
      offBudget: false,
    };
  }
  const defaults = resolvePhase93Defaults(extras.defaults || extras.magnitudes);
  const H = extras.H == null ? (actor.lastH ?? 1) : clamp01(extras.H);
  const S = extras.S == null ? 4 : Number(extras.S) || 0;
  if (S <= 0 || H <= 0) {
    return {
      draw: 0,
      extraDraw: 0,
      on: true,
      failed: true,
      offBudget: true,
      status: S <= 0 ? 'unavailable' : 'power-limited',
      consumer: EW_CONSUMER_NAME,
    };
  }
  const extra = defaults.dfAssistEwDraw * H;
  const draw = reservedEwDraw(extra);
  actor.lastDfDraw = draw;
  actor.lastH = H;
  return {
    draw,
    extraDraw: draw,
    on: true,
    status: H < 1 ? 'power-limited' : 'on',
    consumer: EW_CONSUMER_NAME,
    offBudget: false,
  };
}

function cueQualityFor(extras, defaults) {
  if (extras.silent === true || extras.silentRunning === true || clampNonNeg(extras.paidDraw) <= 0) {
    return defaults.dfCueQualitySilent;
  }
  if (extras.heatSuppress === true || extras.heatSuppressed === true) {
    return defaults.dfCueQualitySuppressed;
  }
  return extras.heatScale != null && Number(extras.heatScale) < 1
    ? defaults.dfCueQualitySuppressed
    : defaults.dfCueQualityLoud;
}

function familyTag(row, extras) {
  if (row?.decoy === true || row?.family === 'ew_decoy' || extras.family === 'ew_decoy') return 'ew_decoy';
  if (row?.family === 'heat' || extras.family === 'heat') return 'heat';
  if (row?.family === 'unlabeled_paid' || extras.family === 'unlabeled_paid') return 'unlabeled_paid';
  if (row?.family) return row.family;
  return 'sensor_jamming';
}

/**
 * Classify a **paid** in-lobe emission. Cue only. Leftover unlabeled N stays
 * unlabeled noise — never a guessed polity.
 */
export function classifyPaidEmission(ew93, observer = {}, localElapsedMs = 0, extras = {}) {
  const observerKey = normalizeKey(observer.actorKey || observer.observerKey || extras.observerKey);
  const actor = getPhase93Actor(ew93, observerKey);
  const defaults = resolvePhase93Defaults(extras.defaults || extras.magnitudes || ew93?.defaults);
  const now = clampNonNeg(localElapsedMs);
  if (!dfLive(actor, now) && extras.forceClassify !== true) {
    return {
      ok: true,
      cue: null,
      status: actor?.dfOn ? 'no-emission' : 'off',
      firingSolution: false,
      liveWeaponTrack: false,
      engagement_authorized: undefined,
      identityInvented: false,
      claimRewritten: false,
      perfectSilentTrack: false,
    };
  }
  const contributions = Array.isArray(extras.contributions) ? extras.contributions : [];
  const paid = contributions.filter((row) => (
    row
    && row.paid !== false
    && clampNonNeg(row.paidDraw ?? row.draw ?? row.c) > 0
    && row.inLobe !== false
    && row.silent !== true
  ));
  if (!paid.length) {
    const unlabeled = extras.unlabeledNoise === true || extras.leftoverN === true;
    const empty = {
      ok: true,
      cue: null,
      status: 'no-emission',
      firingSolution: false,
      liveWeaponTrack: false,
      engagement_authorized: undefined,
      identityInvented: false,
      inventedPolity: false,
      claimRewritten: false,
      perfectSilentTrack: false,
      reason: unlabeled ? 'unlabeled-noise' : 'no-paid-emission',
      playerFaction: extras.playerFaction,
      playerSide: extras.playerSide,
    };
    if (ew93) {
      ew93.cues[observerKey] = empty;
      ew93.lastCue = empty;
    }
    return empty;
  }
  const range = extras.dfRange ?? defaults.dfRange;
  const inRange = paid.filter((row) => row.distance == null || clampNonNeg(row.distance) <= range);
  const pick = (inRange.length ? inRange : []).slice().sort((a, b) => (
    clampNonNeg(b.paidDraw ?? b.draw ?? b.c) - clampNonNeg(a.paidDraw ?? a.draw ?? a.c)
  ))[0];
  if (!pick) {
    return classifyPaidEmission(ew93, observer, now, { ...extras, contributions: [], unlabeledNoise: extras.unlabeledNoise });
  }
  const paidDraw = clampNonNeg(pick.paidDraw ?? pick.draw ?? pick.c);
  const labels = interferenceLabel(contributions, observer, extras);
  const trueSideLabel = extras.trueSideLabel
    || labels.source
    || 'unlabeled';
  const quality = cueQualityFor({
    ...extras,
    paidDraw,
    silent: pick.silent === true || extras.silent === true,
    heatSuppress: pick.heatSuppress === true || extras.heatSuppress === true,
    heatScale: pick.heatScale ?? extras.heatScale,
  }, defaults);
  const cue = quality <= 0 ? null : {
    family: familyTag(pick, extras),
    bearing: pick.bearing || extras.bearing || { x: 1, y: 0 },
    inLobe: pick.inLobe !== false,
    trueSideLabel,
    heatScale: pick.heatScale ?? extras.heatScale ?? (extras.heatSuppress ? 0.25 : 1),
    paidDraw,
    silent: false,
    quality,
    subjectKey: pick.subjectKey || pick.actorKey || extras.subjectKey,
    securityInstanceId: pick.securityInstanceId || extras.securityInstanceId,
  };
  const result = {
    ok: true,
    observerKey,
    subjectKey: cue?.subjectKey || pick.securityInstanceId || pick.actorKey,
    cue,
    status: cue ? 'cue-live' : 'no-emission',
    firingSolution: false,
    liveWeaponTrack: false,
    engagement_authorized: undefined,
    identityInvented: false,
    inventedPolity: false,
    claimRewritten: false,
    claim: extras.claim || extras.transponderClaim || null,
    playerFaction: extras.playerFaction,
    playerSide: extras.playerSide,
    reman53: extras.reman53,
    perfectSilentTrack: false,
    source: 'ew_df_assist',
    hullSpawned: false,
    sayable: cue ? dfSayable() : 'DF assist on. No paid in-lobe emission to classify.',
    usedClaim: labels.usedClaim === true,
    startedAt: undefined,
  };
  if (ew93) {
    ew93.cues[observerKey] = result;
    ew93.lastCue = result;
    ew93.lastJournal = result.sayable;
  }
  return result;
}

/**
 * Optional HoJ cue heading while emission is paid. Silence still coasts.
 * Never sets perfectSilentTrack. Never writes observer firingSolution.
 */
export function applyDfCueToSeeker(seeker, cue, extras = {}) {
  if (!seeker) {
    return {
      ok: false,
      perfectSilentTrack: false,
      giftedFs: false,
      engagement_authorized: undefined,
    };
  }
  seeker.perfectSilentTrack = false;
  seeker.giftedFs = false;
  seeker.liveWeaponTrack = false;
  const paid = extras.silent !== true
    && extras.cloaked !== true
    && extras.silentRunning !== true
    && clampNonNeg(extras.emitterDraw ?? cue?.paidDraw) > 0
    && cue
    && cue.silent !== true;
  if (!paid) {
    return {
      ok: true,
      seeker,
      perfectSilentTrack: false,
      cueQuality: 0,
      homing: false,
      giftedFs: false,
      engagement_authorized: undefined,
      observerFiringSolution: false,
    };
  }
  const quality = clamp01(cue.quality ?? extras.cueQuality ?? 0);
  if (cue.bearing && seeker.heading) {
    const hx = Number(seeker.heading.x) || 0;
    const hy = Number(seeker.heading.y) || 0;
    seeker.heading = {
      x: hx + (Number(cue.bearing.x) - hx) * quality,
      y: hy + (Number(cue.bearing.y) - hy) * quality,
    };
  } else if (cue.bearing) {
    seeker.heading = { x: Number(cue.bearing.x) || 0, y: Number(cue.bearing.y) || 0 };
  }
  seeker.dfCueQuality = quality;
  seeker.dfFamily = cue.family || null;
  return {
    ok: true,
    seeker,
    perfectSilentTrack: false,
    cueQuality: quality,
    homing: quality > 0,
    giftedFs: false,
    engagement_authorized: undefined,
    observerFiringSolution: false,
  };
}

export function phase93ReservedDraw(ew93, actorKey, localElapsedMs = 0, extras = {}) {
  const extra92 = extras.phase92Draw != null
    ? clampNonNeg(extras.phase92Draw)
    : (extras.ew92
      ? phase92ReservedDraw(extras.ew92, actorKey, localElapsedMs, extras).draw
      : 0);
  const poison = scanPoisonDraw(ew93, actorKey, extras);
  const df = dfAssistDraw(ew93, actorKey, extras);
  const extra93 = reservedEwDraw(clampNonNeg(poison.draw) + clampNonNeg(df.draw));
  const draw = reservedEwDraw(extra92 + extra93);
  const actor = getPhase93Actor(ew93, actorKey);
  if (actor) {
    actor.lastPoisonDraw = poison.draw;
    actor.lastDfDraw = df.draw;
    actor.lastH = extras.H == null ? actor.lastH : clamp01(extras.H);
  }
  const commandedOn = actor?.poisonOn === true || actor?.dfOn === true;
  const familyDrawZero = (actor?.poisonOn === true && poison.draw === 0)
    || (actor?.dfOn === true && df.draw === 0);
  return {
    draw,
    extra93,
    extra92,
    poison,
    df,
    consumer: EW_CONSUMER_NAME,
    offBudget: commandedOn === true && familyDrawZero,
  };
}

export function tickDf(ew93, localElapsedMs = 0, extras = {}) {
  const now = clampNonNeg(localElapsedMs);
  const classified = [];
  for (const actor of Object.values(ew93?.actors || {})) {
    if (actor.dfOn === true && actor.dfUntilLocalMs > 0 && now >= actor.dfUntilLocalMs) {
      actor.dfOn = false;
      actor.lastDfStatus = 'off';
      continue;
    }
    if (!dfLive(actor, now)) continue;
    classified.push(classifyPaidEmission(ew93, {
      actorKey: actor.actorKey,
      observerKey: actor.actorKey,
      sideId: actor.sideId,
    }, now, extras));
  }
  return { ok: true, classified };
}
