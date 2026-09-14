/**
 * Phase 9.1 — transponder claim layer only (gate 6).
 *
 * Claim is off / true / spoofedFaction. Never rewrites Phase 1 identity,
 * Reman, or ROE side. Silent ≠ cloak. Forgetting has teeth; no auto-fire.
 *
 * Source: docs/phase9/BM1-PHASE9.1-EW-ROBUSTNESS-PROPOSAL.md §7
 */

import { makeBroadcast } from './phase3-checkpoints.js';
import { INCIDENT_KINDS, foldDoctrineResponse, openIncident } from './phase4-incidents.js';
import { getActor } from './phase91-power.js';

export const TRANSPONDER_MODES = Object.freeze(['off', 'true', 'spoof']);
export const UNKNOWN_ACCESS_ENFORCEMENT_FROM_91 = false;
export const IDENTITY_STORES_UNTOUCHABLE = Object.freeze([
  'playerFaction',
  'playerSide',
  'playerUnlocks',
]);

function normalizeKey(value, fallback = '') {
  const key = String(value ?? '').trim();
  return key && key !== 'undefined' && key !== 'null' ? key : fallback;
}

export function sanitizeTransponderClaim(raw) {
  if (raw == null || raw === 'true' || raw === true) {
    return { mode: 'true', spoofedFaction: null };
  }
  if (raw === 'off' || raw === false || raw === 'none' || raw === 'silent') {
    return { mode: 'off', spoofedFaction: null };
  }
  if (typeof raw === 'object') {
    const faction = normalizeKey(raw.spoofedFaction || raw.faction);
    if (raw.mode === 'off') return { mode: 'off', spoofedFaction: null };
    if (raw.mode === 'true') return { mode: 'true', spoofedFaction: null };
    if (faction) return { mode: 'spoof', spoofedFaction: faction };
  }
  const text = normalizeKey(raw);
  if (text === 'off') return { mode: 'off', spoofedFaction: null };
  if (text === 'true') return { mode: 'true', spoofedFaction: null };
  if (text) return { mode: 'spoof', spoofedFaction: text };
  return { mode: 'true', spoofedFaction: null };
}

export function claimEnum(claim) {
  const row = sanitizeTransponderClaim(claim);
  if (row.mode === 'off') return 'off';
  if (row.mode === 'true') return 'true';
  return { spoofedFaction: row.spoofedFaction };
}

export function claimAsBroadcast(claim, actualFaction) {
  const row = sanitizeTransponderClaim(claim);
  if (row.mode === 'off') return makeBroadcast({ faction: '', source: 'none' });
  if (row.mode === 'true') return makeBroadcast({ faction: actualFaction, source: 'declared' });
  return makeBroadcast({ faction: row.spoofedFaction, source: 'declared' });
}

export function setTransponderClaim(book, actorKey, claim, extras = {}) {
  const actor = getActor(book, actorKey);
  const next = sanitizeTransponderClaim(claim);
  actor.transponderClaim = next;
  const identity = extras.identity && typeof extras.identity === 'object' ? extras.identity : null;
  const beforeFaction = identity ? identity.playerFaction : extras.playerFaction;
  const beforeSide = identity ? identity.playerSide : extras.playerSide;
  if (identity) {
    // Claim is a book field only — never write Phase 1 stores.
  }
  return {
    ok: true,
    claim: claimEnum(next),
    mode: next.mode,
    spoofedFaction: next.spoofedFaction,
    playerFaction: beforeFaction,
    playerSide: beforeSide,
    rewritten: false,
    mintedSideId: false,
    remanRewritten: false,
    cloak: false,
    engagement_authorized: undefined,
    attackId: null,
    mayAutoEngage: extras.mayAutoEngage ?? null,
  };
}

export function silentIsCloak() {
  return false;
}

export function mismatchVsTrueSide(claim, trueSide) {
  const row = sanitizeTransponderClaim(claim);
  if (row.mode === 'true') return false;
  if (row.mode === 'off') return true;
  return normalizeKey(row.spoofedFaction) !== normalizeKey(trueSide);
}

/**
 * Forgetting ladder. Magnitudes injectable. Default record_only.
 * Never auto-fire, never standing-from-blip-alone, never second FLASH.
 */
export function applyForgettingLadder(input = {}) {
  const claim = sanitizeTransponderClaim(input.claim);
  const trueSide = normalizeKey(input.trueSide);
  const mismatch = mismatchVsTrueSide(claim, trueSide);
  const steps = {
    suspicion: mismatch,
    challenge: mismatch && input.challenge !== false,
    accessDenial: mismatch && input.deny !== false,
    incident: false,
  };
  const folded = foldDoctrineResponse(input.doctrineResponse || 'record_only');
  let incident = null;
  if (mismatch && input.openIncident === true && input.ledger) {
    const requested = INCIDENT_KINDS.includes(input.kind) ? input.kind : 'access_noncompliance';
    const kind = requested === 'access_notice' ? 'access_noncompliance' : requested;
    incident = openIncident(input.ledger, {
      kind,
      systemIndex: input.systemIndex ?? 0,
      clocks: { localElapsedMs: input.localElapsedMs || 0, strategicJumps: 0 },
      actor: {
        instanceId: input.actorInstanceId || 'claim-actor',
        kind: 'npc',
        sideId: trueSide || null,
        broadcast: claimAsBroadcast(claim, trueSide),
      },
      links: { encounterId: input.encounterId || `claim-${input.actorInstanceId || 'actor'}` },
    });
    steps.incident = Boolean(incident?.incident);
  }
  return {
    mismatch,
    steps,
    appliedResponse: folded.appliedResponse,
    acting: folded.acting,
    engagement_authorized: undefined,
    attackId: null,
    standingFromBlip: false,
    flashPulsed: false,
    unknownEnforcementActivated: UNKNOWN_ACCESS_ENFORCEMENT_FROM_91,
    incident: incident?.incident || null,
    access_notice_reserved: input.kind === 'access_notice',
  };
}

export function claimRewritesPhase1Identity() {
  return false;
}
