/**
 * Phase 9.2 — escort → flagship ECCM share (gate 2).
 *
 * Detection / last-known / residue only. Never gifted firingSolution,
 * never engagement_authorized, never a second suite.
 *
 * Source: docs/phase9/BM1-PHASE9.2-EW-DEPTH-PROPOSAL.md §4
 */

import { findContact, listContacts, upsertContact } from './phase6-sensors.js';
import { isResidueContact } from './phase91-residue.js';
import { resolvePhase92Defaults } from './phase92-magnitudes.js';

function normalizeKey(value, fallback = '') {
  const key = String(value ?? '').trim();
  return key && key !== 'undefined' && key !== 'null' ? key : fallback;
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

const QUALITY_RANK = Object.freeze({ none: 0, area: 1, coarse: 2, firm: 3 });

export function inShareEnvelope(input = {}, extras = {}) {
  const defaults = resolvePhase92Defaults(extras.defaults || extras.magnitudes);
  if (input.sameSystem === false || extras.sameSystem === false) return false;
  if (input.parkedOtherSystem === true) return false;
  const shareRadius = extras.shareRadius ?? defaults.shareRadius;
  const formationDist = extras.formationDist ?? defaults.formationDist;
  const playerDistLimit = extras.playerDist ?? defaults.playerDist;
  const inFormation = input.inFormation === true
    || (Number.isFinite(Number(input.formationPointDist)) && Number(input.formationPointDist) < formationDist)
    || (Number.isFinite(Number(input.playerDist)) && Number(input.playerDist) < playerDistLimit);
  const inRadius = Number.isFinite(Number(input.playerDist)) && Number(input.playerDist) <= shareRadius;
  return inFormation || inRadius;
}

/**
 * Copy escort detection / last-known / residue onto the flagship book.
 * Caps track at area. Hard-fails firingSolution / engagement_authorized.
 */
export function shareEscortToFlagship(book, escortKey, playerKey, localElapsedMs = 0, extras = {}) {
  const fromKey = normalizeKey(escortKey);
  const toKey = normalizeKey(playerKey);
  if (!book || !fromKey || !toKey || fromKey === toKey) {
    return { ok: false, copied: [], giftedFs: false, engagement_authorized: undefined };
  }
  if (extras.escort === false) {
    return { ok: false, reason: 'not-escort', copied: [], giftedFs: false };
  }
  if (!inShareEnvelope(extras, extras)) {
    return { ok: false, reason: 'out-of-envelope', copied: [], giftedFs: false, inEnvelope: false };
  }
  if (extras.S === 0 && extras.allowUnfundedShare !== true) {
    const held = listContacts(book, fromKey).some((row) => row.detected === true || isResidueContact(row));
    if (!held) return { ok: false, reason: 'escort-unfunded', copied: [], giftedFs: false };
  }
  const copied = [];
  for (const contact of listContacts(book, fromKey)) {
    if (!contact.detected && !isResidueContact(contact)) continue;
    if (contact.ghost === true || contact.source === 'ew_ghost') continue;
    if (contact.decoy === true || contact.source === 'ew_decoy') continue;
    const existing = findContact(book, toKey, contact.subjectKey);
    if (existing?.firingSolution === true) continue;
    const residue = isResidueContact(contact) || contact.residue === true;
    const next = upsertContact(book, toKey, {
      subjectKey: contact.subjectKey,
      detected: true,
      identification: existing?.identification || 'none',
      trackQuality: existing && QUALITY_RANK[existing.trackQuality] > QUALITY_RANK.area
        ? existing.trackQuality
        : 'area',
      firingSolution: false,
      residue: residue || existing?.residue === true,
      emission: residue ? (contact.emission !== false) : existing?.emission === true,
      lastKnown: clone(contact.lastKnown),
      freshnessLocalMs: localElapsedMs,
      source: existing?.source && existing.source !== 'escort_share' ? existing.source : 'escort_share',
      sharedFrom: fromKey,
      giftedLock: false,
    }, localElapsedMs);
    if (next) {
      next.firingSolution = false;
      next.giftedLock = false;
      copied.push(next);
    }
  }
  const snapshot = {
    fromObserverKey: fromKey,
    toObserverKey: toKey,
    copied: copied.length,
    detected: copied.some((row) => row.detected === true),
    trackQuality: 'area',
    firingSolution: false,
    residue: copied.some((row) => row.residue === true || isResidueContact(row)),
    giftedLock: false,
    giftedFs: false,
    engagement_authorized: undefined,
    source: 'escort_share',
    inEnvelope: true,
    flagshipSuiteUnchanged: extras.flagshipSuiteId == null || extras.flagshipSuiteId === extras.flagshipSuiteIdAfter,
  };
  if (extras.book92) extras.book92.lastShare = snapshot;
  return {
    ok: true,
    copied,
    snapshot,
    giftedFs: false,
    engagement_authorized: undefined,
    liveWeaponTrack: false,
  };
}

export function shareGiftsFiringSolution() {
  return false;
}
