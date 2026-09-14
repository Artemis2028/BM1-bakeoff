/**
 * Phase 9.1 — Home-on-Jam seeker (gate 5).
 *
 * Emission-only, incarnation-lock, silence→coast. Private seeker knowledge.
 * Does not write hull firingSolution or engagement_authorized. Bills weapons,
 * not `ew`. Matrix row must exist first (see phase9-weapons-matrix.js).
 *
 * Source: docs/phase9/BM1-PHASE9.1-EW-ROBUSTNESS-PROPOSAL.md §6
 */

import { EW_CONSUMER_NAME } from './phase65-power.js';
import { HOJ_MATRIX_ROW, listMatrixColumns } from './phase9-weapons-matrix.js';

export const HOJ_BILLS_CONSUMER = 'weapons';
export const HOJ_GIFTS_FS = false;

function clampNonNeg(value) {
  return Math.max(0, Number(value) || 0);
}

function normalizeKey(value, fallback = '') {
  const key = String(value ?? '').trim();
  return key && key !== 'undefined' && key !== 'null' ? key : fallback;
}

export function hojMatrixReady() {
  const row = HOJ_MATRIX_ROW;
  const columns = listMatrixColumns();
  return Boolean(row)
    && row.provenance === 'new'
    && columns.every((col) => row[col] != null && row[col] !== '');
}

export function launchHoj(book, input = {}, localElapsedMs = 0) {
  if (!hojMatrixReady()) return { ok: false, reason: 'matrix-row-missing' };
  const incarnation = normalizeKey(input.securityInstanceId || input.incarnation);
  const emission = input.emission !== false && clampNonNeg(input.emitterDraw) > 0;
  if (!incarnation) return { ok: false, reason: 'no-incarnation' };
  if (!emission) {
    return {
      ok: false,
      reason: 'no-paid-emission',
      giftedFs: false,
      engagement_authorized: undefined,
    };
  }
  const seekerId = normalizeKey(input.seekerId, `hoj-${Object.keys(book?.seekers || {}).length + 1}`);
  const seeker = {
    seekerId,
    actorKey: normalizeKey(input.actorKey),
    incarnation,
    npcIdAtLaunch: input.npcId || null,
    emission: true,
    coasting: false,
    heading: input.heading || { x: 1, y: 0 },
    launchedAtLocalMs: clampNonNeg(localElapsedMs),
    billedConsumer: HOJ_BILLS_CONSUMER,
    notEw: true,
    giftedFs: false,
    liveWeaponTrack: false,
    engagement_authorized: undefined,
    perfectSilentTrack: false,
    startedAt: undefined,
  };
  if (book) book.seekers[seekerId] = seeker;
  return {
    ok: true,
    seeker,
    matrixRow: HOJ_MATRIX_ROW,
    giftedFs: false,
    engagement_authorized: undefined,
    mayAutoEngage: input.mayAutoEngage ?? null,
    jamAutoFire: false,
    consumer: HOJ_BILLS_CONSUMER,
    ewBilled: false,
    ewConsumer: EW_CONSUMER_NAME,
  };
}

export function silenceEmitter(book, incarnation, localElapsedMs = 0) {
  const key = normalizeKey(incarnation);
  const rows = Object.values(book?.seekers || {}).filter((row) => row.incarnation === key);
  for (const seeker of rows) {
    seeker.emission = false;
    seeker.coasting = true;
    seeker.perfectSilentTrack = false;
    seeker.silencedAtLocalMs = clampNonNeg(localElapsedMs);
  }
  return {
    ok: true,
    seekers: rows,
    coasting: rows.every((row) => row.coasting === true),
    giftedFs: false,
    engagement_authorized: undefined,
  };
}

export function transferIncarnation(book, oldIncarnation, newNpcId) {
  const key = normalizeKey(oldIncarnation);
  const rows = Object.values(book?.seekers || {}).filter((row) => row.incarnation === key);
  for (const seeker of rows) {
    seeker.coasting = true;
    seeker.emission = false;
    seeker.transferred = false;
    seeker.miss = seeker.npcIdAtLaunch != null && newNpcId != null && seeker.npcIdAtLaunch !== newNpcId;
    seeker.perfectSilentTrack = false;
  }
  return {
    ok: true,
    transferred: false,
    miss: true,
    giftedFs: false,
    engagement_authorized: undefined,
  };
}

export function hojGiftsFiringSolution() {
  return HOJ_GIFTS_FS;
}

export function hojWritesEngagementAuthorized() {
  return false;
}

export function jamAloneAutoFires() {
  return false;
}

export function snapshotHoj(book) {
  const seekers = Object.values(book?.seekers || {});
  return {
    matrixRow: HOJ_MATRIX_ROW,
    ready: hojMatrixReady(),
    seekers,
    giftedFs: seekers.some((row) => row.giftedFs === true),
    engagementAuthorizedPresent: seekers.some((row) => row.engagement_authorized === true),
    coasting: seekers.filter((row) => row.coasting === true),
  };
}
