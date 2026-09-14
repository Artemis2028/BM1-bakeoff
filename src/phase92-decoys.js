/**
 * Phase 9.2 — decoys as book-only emission lures (gate 5).
 *
 * source: ew_decoy. Not hulls, not ghosts, not a gifted firingSolution.
 *
 * Source: docs/phase9/BM1-PHASE9.2-EW-DEPTH-PROPOSAL.md §7.2
 */

import { findContact, listContacts, upsertContact } from './phase6-sensors.js';
import { EW_CONSUMER_NAME, reservedEwDraw } from './phase65-power.js';
import { getPhase92Actor, resolvePhase92Defaults } from './phase92-magnitudes.js';

export const EW_DECOY_SOURCE = 'ew_decoy';

function clampNonNeg(value) {
  return Math.max(0, Number(value) || 0);
}

function normalizeKey(value, fallback = '') {
  const key = String(value ?? '').trim();
  return key && key !== 'undefined' && key !== 'null' ? key : fallback;
}

export function isDecoyContact(contact) {
  return Boolean(
    contact
    && (contact.decoy === true
      || contact.source === EW_DECOY_SOURCE
      || String(contact.subjectKey || '').startsWith('decoy:')),
  );
}

export function listDecoyContacts(book, observerKey = null) {
  const keys = observerKey
    ? [normalizeKey(observerKey)]
    : Object.keys(book?.observers || {});
  const rows = [];
  for (const key of keys) {
    for (const contact of listContacts(book, key)) {
      if (isDecoyContact(contact)) rows.push(contact);
    }
  }
  return rows;
}

function takeDecoySerial(ew92) {
  const n = Object.keys(ew92?.decoys || {}).length + 1;
  return n;
}

export function upsertDecoyContact(contactBook, observerKey, input = {}, localElapsedMs = 0, extras = {}) {
  const observer = normalizeKey(observerKey);
  const defaults = resolvePhase92Defaults(extras.defaults || extras.magnitudes);
  const existing = listDecoyContacts(contactBook, observer);
  if (existing.length >= defaults.maxDecoysPerObserver && !input.subjectKey) {
    const drop = existing.sort((a, b) => (a.freshnessLocalMs || 0) - (b.freshnessLocalMs || 0))[0];
    if (drop?.contactId && contactBook?.observers?.[observer]?.contacts) {
      delete contactBook.observers[observer].contacts[drop.contactId];
    }
  }
  const serial = extras.serial || takeDecoySerial(extras.ew92);
  const subjectKey = normalizeKey(input.subjectKey, `decoy:ew-${serial}`);
  const until = clampNonNeg(localElapsedMs) + (input.durationLocalMs ?? defaults.decoyDurationLocalMs);
  const contact = upsertContact(contactBook, observer, {
    subjectKey,
    detected: true,
    identification: 'none',
    trackQuality: 'area',
    firingSolution: false,
    ghost: false,
    decoy: true,
    emission: true,
    residue: false,
    lastKnown: {
      x: Number(input.x) || Number(input.lastKnown?.x) || 0,
      y: Number(input.y) || Number(input.lastKnown?.y) || 0,
      radius: Number(input.lastKnown?.radius) || 180,
      atLocalMs: localElapsedMs,
    },
    freshnessLocalMs: localElapsedMs,
    source: EW_DECOY_SOURCE,
  }, localElapsedMs);
  if (contact) {
    contact.decoy = true;
    contact.ghost = false;
    contact.firingSolution = false;
    contact.source = EW_DECOY_SOURCE;
    contact.emission = true;
    contact.endsAtLocalMs = until;
  }
  if (extras.ew92) {
    extras.ew92.decoys[subjectKey] = {
      subjectKey,
      observerKey: observer,
      endsAtLocalMs: until,
      draw: defaults.decoyEwDraw,
      startedAt: undefined,
    };
    const actor = getPhase92Actor(extras.ew92, extras.actorKey || observer);
    actor.decoyOn = true;
  }
  return {
    ok: true,
    contact,
    npcSpawned: false,
    firingSolution: false,
    ghost: false,
    hull: false,
    salvage: false,
    standing: false,
    sayable: 'Decoy contact. Sensor record only — emission lure, no hull, no firing solution.',
  };
}

export function commandDecoy(ew92, contactBook, actorKey, on, localElapsedMs = 0, extras = {}) {
  const actor = getPhase92Actor(ew92, actorKey);
  const defaults = resolvePhase92Defaults(extras.defaults || extras.magnitudes);
  const H = extras.H == null ? 1 : Math.max(0, Number(extras.H) || 0);
  if (on && (H <= 0 || extras.draw === 0)) {
    actor.decoyOn = false;
    return { ok: false, reason: 'unfunded', decoyOn: false, draw: 0 };
  }
  if (!on) {
    actor.decoyOn = false;
    return { ok: true, decoyOn: false, draw: 0 };
  }
  actor.decoyOn = true;
  const injected = upsertDecoyContact(contactBook, extras.observerKey || actorKey, extras, localElapsedMs, {
    ew92,
    actorKey,
    defaults,
    serial: extras.serial,
  });
  return {
    ...injected,
    decoyOn: true,
    draw: reservedEwDraw(defaults.decoyEwDraw * H),
    consumer: EW_CONSUMER_NAME,
  };
}

export function decoyFamilyDraw(ew92, actorKey, localElapsedMs = 0, extras = {}) {
  const actor = getPhase92Actor(ew92, actorKey);
  if (!actor || actor.decoyOn !== true) return { draw: 0, decoyOn: false };
  const defaults = resolvePhase92Defaults(extras.defaults || extras.magnitudes);
  const H = extras.H == null ? 1 : Math.max(0, Number(extras.H) || 0);
  if (H <= 0) return { draw: 0, decoyOn: true, failed: true, offBudget: true };
  const live = Object.values(ew92?.decoys || {}).filter((row) => (
    normalizeKey(row.observerKey) === normalizeKey(extras.observerKey || actorKey)
    && clampNonNeg(localElapsedMs) < clampNonNeg(row.endsAtLocalMs)
  ));
  if (!live.length && extras.requireLive !== false) {
    return { draw: reservedEwDraw(defaults.decoyEwDraw * H), decoyOn: true, consumer: EW_CONSUMER_NAME };
  }
  return { draw: reservedEwDraw(defaults.decoyEwDraw * H), decoyOn: true, consumer: EW_CONSUMER_NAME };
}

export function expireDecoys(ew92, contactBook, localElapsedMs = 0) {
  const now = clampNonNeg(localElapsedMs);
  const dropped = [];
  for (const [key, row] of Object.entries(ew92?.decoys || {})) {
    if (now >= clampNonNeg(row.endsAtLocalMs)) {
      const contact = findContact(contactBook, row.observerKey, row.subjectKey);
      if (contact) contact.emission = false;
      delete ew92.decoys[key];
      dropped.push(key);
    }
  }
  return { dropped };
}

export function tryDestroyDecoy() {
  return { ok: false, destroyed: false, salvage: false, standing: false, hull: false };
}

export function decoyIsHull() {
  return false;
}
