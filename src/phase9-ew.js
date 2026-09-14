/**
 * Phase 9 — electronic warfare on Phase 6 contact layers + Phase 6.5 `ew`.
 *
 * Source of truth:
 * - docs/phase9/BM1-PHASE9-EW-WEAPONS-PROPOSAL.md
 * - docs/phase9/BM1-PHASE9-ENGINE-DEPENDENCIES.md
 *
 * Written from docs/ only. Does not crib BM1-remastered-work.
 *
 * Hard gates: reserved `ew` consumer on (draw > 0 while active); ghosts are
 * contact-book rows only; jamming never unsends delivered P4/P5 reports;
 * pursuit ≠ permission ≠ per-weapon gate; boarding stays out.
 */

import {
  applyLostTrackSameTick,
  createContactBook,
  findContact,
  getContact,
  listContacts,
  listObserverKeys,
  liveFireFactsFromContact,
  observerKeyForPlayer,
  performActiveScan,
  upsertContact,
} from './phase6-sensors.js';
import {
  EW_CONSUMER_NAME,
  EW_EFFECTS_IMPLEMENTED,
  POWER_CONSUMERS,
  reservedEwDraw,
} from './phase65-power.js';
import { deliverReport, observerKnowsIncident } from './phase4-incidents.js';
import { applyResidueMark, isGhostLike } from './phase91-residue.js';
import { actorJammerDraw, fieldIsLive } from './phase91-power.js';

export const EW_BOOK_VERSION = 1;
export const EW_FAMILIES = Object.freeze([
  'sensor_jamming',
  'deceptive_contacts',
  'fire_control',
  'comms_disruption',
]);
export const EW_SOURCE = 'ew_ghost';
export const FORBIDDEN_FIRE_INJECT = 'engagement_authorized';
export const BOARDING_IMPLEMENTED = false;
export const ATTRIBUTION_DEFAULT = 'record_only';
export const MAX_GHOSTS_PER_OBSERVER = 8;

/**
 * Injectable / TBD magnitudes. Probes assert draw > 0 and a bounded
 * localElapsedMs duration — not these wattages as locked balance.
 */
export const EW_MAGNITUDES = Object.freeze({
  sensor_jamming: { draw: 1.6, durationLocalMs: 8000, counter: 'burn-through / active-scan / break-los / own-ew' },
  deceptive_contacts: { draw: 1.4, durationLocalMs: 9000, counter: 'active-scan / closer-pass / science-suite' },
  fire_control: { draw: 1.8, durationLocalMs: 7000, counter: 're-acquire / leave-range / hard-kill-jammer' },
  comms_disruption: { draw: 1.5, durationLocalMs: 10000, counter: 'relay / second-sender / leave-volume' },
});

const FAMILY_SET = new Set(EW_FAMILIES);
const QUALITY_DOWN = Object.freeze({ firm: 'coarse', coarse: 'area', area: 'none', none: 'none' });
const IDENT_DOWN = Object.freeze({ known: 'partial', partial: 'none', none: 'none' });

function clampNonNeg(value) {
  return Math.max(0, Number(value) || 0);
}

function normalizeKey(value, fallback = '') {
  const key = String(value ?? '').trim();
  return key && key !== 'undefined' && key !== 'null' ? key : fallback;
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function resolveEwMagnitudes(injected = null) {
  if (!injected || typeof injected !== 'object') return { ...EW_MAGNITUDES };
  const next = { ...EW_MAGNITUDES };
  for (const family of EW_FAMILIES) {
    if (injected[family] && typeof injected[family] === 'object') {
      next[family] = { ...next[family], ...injected[family] };
    }
  }
  return next;
}

export function familyContract(family, injected = null) {
  const key = FAMILY_SET.has(family) ? family : null;
  if (!key) return null;
  const mag = resolveEwMagnitudes(injected)[key];
  return {
    family: key,
    cost: { consumer: EW_CONSUMER_NAME, draw: Math.max(0.0001, clampNonNeg(mag.draw)) },
    duration: { endsOn: 'localElapsedMs', durationLocalMs: Math.max(1, clampNonNeg(mag.durationLocalMs)) },
    counter: mag.counter,
    attribution: ATTRIBUTION_DEFAULT,
  };
}

export function listFamilyContracts(injected = null) {
  return EW_FAMILIES.map((family) => familyContract(family, injected));
}

export function emptyEwBook() {
  return {
    version: EW_BOOK_VERSION,
    nextEffectId: 1,
    nextGhostSerial: 1,
    effects: {},
    lastRefuseFire: null,
    lastJournal: null,
    lastAttribution: null,
  };
}

export function createEwBook(extras = {}) {
  return {
    version: EW_BOOK_VERSION,
    nextEffectId: Math.max(1, Number(extras.nextEffectId) || 1),
    nextGhostSerial: Math.max(1, Number(extras.nextGhostSerial) || 1),
    effects: extras.effects && typeof extras.effects === 'object' ? extras.effects : {},
    lastRefuseFire: extras.lastRefuseFire || null,
    lastJournal: extras.lastJournal || null,
    lastAttribution: extras.lastAttribution || null,
  };
}

function takeEffectId(book) {
  const n = book.nextEffectId || 1;
  book.nextEffectId = n + 1;
  return `ew-${n}`;
}

function takeGhostSerial(book) {
  const n = book.nextGhostSerial || 1;
  book.nextGhostSerial = n + 1;
  return n;
}

export function sanitizeEffect(raw = {}) {
  const family = FAMILY_SET.has(raw.family) ? raw.family : null;
  if (!family) return null;
  const contract = familyContract(family);
  return {
    effectId: normalizeKey(raw.effectId, 'ew-0'),
    family,
    actorKey: normalizeKey(raw.actorKey),
    victimKey: normalizeKey(raw.victimKey),
    draw: Math.max(0.0001, clampNonNeg(raw.draw || contract.cost.draw)),
    startedAtLocalMs: clampNonNeg(raw.startedAtLocalMs),
    endsAtLocalMs: Math.max(clampNonNeg(raw.startedAtLocalMs) + 1, clampNonNeg(raw.endsAtLocalMs)),
    counter: raw.counter || contract.counter,
    attribution: raw.attribution || ATTRIBUTION_DEFAULT,
    subjectKey: raw.subjectKey ? normalizeKey(raw.subjectKey) : null,
    contactId: raw.contactId || null,
    ghostSubjectKey: raw.ghostSubjectKey ? normalizeKey(raw.ghostSubjectKey) : null,
    standingChanged: false,
    flashPulsed: false,
    erasedByJamming: false,
    engagement_authorized: undefined,
    startedAt: undefined,
  };
}

export function serializeEwBook(book) {
  const out = emptyEwBook();
  out.nextEffectId = book?.nextEffectId || 1;
  out.nextGhostSerial = book?.nextGhostSerial || 1;
  out.lastJournal = book?.lastJournal || null;
  out.lastRefuseFire = book?.lastRefuseFire || null;
  out.lastAttribution = book?.lastAttribution || null;
  for (const [id, raw] of Object.entries(book?.effects || {})) {
    const clean = sanitizeEffect({ ...raw, effectId: raw.effectId || id });
    if (clean) out.effects[clean.effectId] = clean;
  }
  return clone(out);
}

export function restoreEwBook(raw) {
  if (!raw || typeof raw !== 'object') return emptyEwBook();
  return serializeEwBook(raw);
}

export function listEffects(book) {
  return Object.values(book?.effects || {});
}

export function activeEffects(book, localElapsedMs = 0) {
  const now = clampNonNeg(localElapsedMs);
  return listEffects(book).filter((row) => now < clampNonNeg(row.endsAtLocalMs));
}

export function effectsForActor(book, actorKey, localElapsedMs = 0) {
  const key = normalizeKey(actorKey);
  return activeEffects(book, localElapsedMs).filter((row) => row.actorKey === key);
}

export function effectsOnVictim(book, victimKey, localElapsedMs = 0, family = null) {
  const key = normalizeKey(victimKey);
  return activeEffects(book, localElapsedMs).filter((row) => (
    row.victimKey === key && (family == null || row.family === family)
  ));
}

export function actorEwDraw(book, actorKey, localElapsedMs = 0, extras = {}) {
  const rows = effectsForActor(book, actorKey, localElapsedMs);
  const effectDraw = rows.reduce((sum, row) => sum + clampNonNeg(row.draw), 0);
  let jammerDraw = 0;
  if (extras.jammerDraw != null) jammerDraw = clampNonNeg(extras.jammerDraw);
  else if (extras.ew91) jammerDraw = actorJammerDraw(extras.ew91, actorKey, localElapsedMs, extras);
  const jamEffect = rows.find((row) => row.family === 'sensor_jamming');
  if (jamEffect && jammerDraw > 0) {
    return reservedEwDraw(effectDraw - jamEffect.draw + Math.max(jamEffect.draw, jammerDraw));
  }
  return reservedEwDraw(effectDraw + jammerDraw);
}

export function snapshotEwPower(book, actorKey, localElapsedMs = 0) {
  const draw = actorEwDraw(book, actorKey, localElapsedMs);
  return {
    name: EW_CONSUMER_NAME,
    draw,
    effectsImplemented: EW_EFFECTS_IMPLEMENTED === true,
    consumers: POWER_CONSUMERS.slice(),
    offBudget: draw === 0 && effectsForActor(book, actorKey, localElapsedMs).length > 0,
  };
}

export function familySayable(family) {
  if (family === 'sensor_jamming') {
    return 'Jamming: your track on the warbird fell from firm to area. The FLASH about the earlier destruction is still in the journal.';
  }
  if (family === 'deceptive_contacts') {
    return 'Ghost contact. Sensor record only — no hull, no firing solution.';
  }
  if (family === 'fire_control') {
    return 'Fire-control interference. You may still pursue. You may not take the shot.';
  }
  if (family === 'comms_disruption') {
    return 'Comms disrupted. The overdue report you already hold is still held.';
  }
  return '';
}

export function startEffect(book, input = {}, localElapsedMs = 0) {
  if (!book || typeof book !== 'object' || !book.effects) {
    return { ok: false, reason: 'ew-helper-missing' };
  }
  const family = FAMILY_SET.has(input.family) ? input.family : null;
  if (!family) return { ok: false, reason: 'unknown-family' };
  const contract = familyContract(family, input.magnitudes);
  const started = clampNonNeg(input.startedAtLocalMs ?? localElapsedMs);
  const duration = Math.max(1, clampNonNeg(input.durationLocalMs ?? contract.duration.durationLocalMs));
  const effect = sanitizeEffect({
    effectId: input.effectId || takeEffectId(book),
    family,
    actorKey: input.actorKey || observerKeyForPlayer(),
    victimKey: input.victimKey || observerKeyForPlayer(),
    draw: input.draw ?? contract.cost.draw,
    startedAtLocalMs: started,
    endsAtLocalMs: input.endsAtLocalMs ?? (started + duration),
    counter: input.counter || contract.counter,
    attribution: input.attribution || ATTRIBUTION_DEFAULT,
    subjectKey: input.subjectKey || null,
  });
  book.effects[effect.effectId] = effect;
  book.lastJournal = familySayable(family);
  book.lastAttribution = {
    effectId: effect.effectId,
    family,
    kind: ATTRIBUTION_DEFAULT,
    standingChanged: false,
    attackId: null,
    flash: false,
  };
  return { ok: true, effect, contract, sayable: book.lastJournal };
}

export function cancelEffect(book, effectId) {
  if (!book?.effects?.[effectId]) return { ok: false, reason: 'missing-effect' };
  delete book.effects[effectId];
  return { ok: true };
}

export function cancelActorEffects(book, actorKey) {
  const key = normalizeKey(actorKey);
  let cancelled = 0;
  for (const row of listEffects(book)) {
    if (row.actorKey === key) {
      delete book.effects[row.effectId];
      cancelled += 1;
    }
  }
  return { ok: true, cancelled };
}

export function expireEffects(book, localElapsedMs = 0, { actorsLeftSystem = false } = {}) {
  const now = clampNonNeg(localElapsedMs);
  let expired = 0;
  for (const row of listEffects(book)) {
    if (actorsLeftSystem || now >= clampNonNeg(row.endsAtLocalMs)) {
      delete book.effects[row.effectId];
      expired += 1;
    }
  }
  return { expired, reportsUnsent: false };
}

export function isGhostContact(contact) {
  return Boolean(contact && (contact.ghost === true || contact.source === EW_SOURCE));
}

export function ghostSubjectKey(serial) {
  return `ghost:ew-${serial}`;
}

export function isGhostSubjectKey(subjectKey) {
  return String(subjectKey || '').startsWith('ghost:');
}

export function upsertGhostContact(book, observerKey, input = {}, localElapsedMs = 0, ewBook = null) {
  if (!book || typeof upsertContact !== 'function') {
    return { ok: false, reason: 'ghost-helper-missing' };
  }
  const serial = input.serial || (ewBook ? takeGhostSerial(ewBook) : 1);
  const subjectKey = input.subjectKey && isGhostSubjectKey(input.subjectKey)
    ? normalizeKey(input.subjectKey)
    : ghostSubjectKey(serial);
  const record = upsertContact(book, observerKey, {
    subjectKey,
    detected: true,
    identification: input.identification === 'partial' ? 'partial' : 'none',
    trackQuality: 'area',
    firingSolution: false,
    ghost: true,
    source: EW_SOURCE,
    lastKnown: {
      x: Number(input.x ?? input.lastKnown?.x) || 0,
      y: Number(input.y ?? input.lastKnown?.y) || 0,
      radius: Math.max(80, Number(input.radius ?? input.lastKnown?.radius) || 180),
      atLocalMs: localElapsedMs,
    },
    freshnessLocalMs: localElapsedMs,
  }, localElapsedMs);
  if (record) {
    record.ghost = true;
    record.source = EW_SOURCE;
    record.firingSolution = false;
    if (record.trackQuality === 'firm' || record.trackQuality === 'coarse') record.trackQuality = 'area';
    if (record.identification === 'known') record.identification = 'none';
  }
  return {
    ok: Boolean(record),
    contact: record,
    hullSpawned: false,
    firingSolution: false,
    liveWeaponTrack: false,
    combatTargetId: null,
    sayable: familySayable('deceptive_contacts'),
  };
}

export function listGhostContacts(book, observerKey = null) {
  const keys = observerKey ? [normalizeKey(observerKey)] : listObserverKeys(book);
  const rows = [];
  for (const key of keys) {
    for (const contact of listContacts(book, key)) {
      if (isGhostContact(contact) || isGhostSubjectKey(contact.subjectKey)) rows.push(contact);
    }
  }
  return rows;
}

export function revealGhost(book, observerKey, subjectKey, extras = {}) {
  const contact = findContact(book, observerKey, subjectKey);
  if (!contact || !isGhostContact(contact)) return { ok: false, reason: 'not-ghost' };
  contact.ghost = true;
  contact.source = EW_SOURCE;
  contact.identification = extras.markPartial === true ? 'partial' : contact.identification;
  if (contact.identification === 'known') contact.identification = 'partial';
  contact.firingSolution = false;
  contact.trackQuality = contact.trackQuality === 'firm' ? 'area' : (contact.trackQuality || 'area');
  return {
    ok: true,
    contact,
    revealed: true,
    firingSolution: false,
    liveWeaponTrack: false,
    spawnedRealHull: false,
  };
}

export function hailOrScanGhost(contact) {
  if (!isGhostContact(contact)) {
    return { livingCaptain: true, ghost: false };
  }
  return {
    livingCaptain: false,
    ghost: true,
    hull: false,
    shields: false,
    slots: false,
    firingSolution: false,
    sayable: familySayable('deceptive_contacts'),
  };
}

export function tryDestroyGhost(contact, extras = {}) {
  if (!isGhostContact(contact) && !isGhostSubjectKey(extras.subjectKey)) {
    return { ok: false, reason: 'not-ghost' };
  }
  return {
    ok: true,
    destroyed: false,
    killed: false,
    standingChanged: false,
    salvage: 0,
    latinum: 0,
    worsen: false,
    attackerId: null,
    punishmentToken: null,
    prize: false,
    boarded: false,
  };
}

export function degradeLiveLayers(contact, steps = 1) {
  if (!contact || isGhostLike(contact) || isGhostContact(contact)) return { contact, droppedLock: false };
  const hadLock = contact.firingSolution === true && contact.trackQuality === 'firm';
  let quality = contact.trackQuality || 'none';
  let ident = contact.identification || 'none';
  let floored = false;
  for (let i = 0; i < Math.max(1, Number(steps) || 1); i += 1) {
    const nextQ = QUALITY_DOWN[quality] || 'none';
    if (quality === 'area' || nextQ === 'none') {
      quality = 'area';
      ident = IDENT_DOWN[ident] || 'none';
      floored = true;
      break;
    }
    quality = nextQ;
    ident = IDENT_DOWN[ident] || 'none';
  }
  contact.trackQuality = quality;
  contact.identification = ident;
  if (quality !== 'firm') contact.firingSolution = false;
  if (floored || quality === 'area') {
    applyResidueMark(contact, { identification: ident, trackQuality: quality });
  }
  return { contact, droppedLock: hadLock && contact.firingSolution !== true };
}

export function applySensorJamming(book, victimKey, localElapsedMs = 0, extras = {}) {
  const drops = [];
  for (const contact of listContacts(book, victimKey)) {
    if (isGhostContact(contact)) continue;
    if (extras.subjectKey && contact.subjectKey !== extras.subjectKey) continue;
    if (!contact.detected && contact.trackQuality === 'none' && !contact.residue) continue;
    const { droppedLock } = degradeLiveLayers(contact, extras.steps || 1);
    if (droppedLock) {
      const drop = applyLostTrackSameTick(book, victimKey, contact.contactId, localElapsedMs);
      drops.push(drop);
    }
  }
  return {
    ok: true,
    drops,
    reportsDeleted: false,
    deliveredFlipped: false,
    knownIdsCleared: false,
    fifthLayer: false,
    sayable: familySayable('sensor_jamming'),
  };
}

export function applyFireControl(book, victimKey, localElapsedMs = 0, extras = {}) {
  const drops = [];
  for (const contact of listContacts(book, victimKey)) {
    if (isGhostContact(contact)) continue;
    if (extras.subjectKey && contact.subjectKey !== extras.subjectKey) continue;
    const hadLock = contact.firingSolution === true;
    contact.firingSolution = false;
    if (contact.trackQuality === 'firm') contact.trackQuality = 'coarse';
    if (hadLock) {
      drops.push(applyLostTrackSameTick(book, victimKey, contact.contactId, localElapsedMs));
    }
  }
  return {
    ok: true,
    drops,
    pursuitAllowed: true,
    permissionInjected: false,
    engagement_authorized: undefined,
    sayable: familySayable('fire_control'),
  };
}

export function commsDisrupted(ewBook, observerKey, localElapsedMs = 0) {
  return effectsOnVictim(ewBook, observerKey, localElapsedMs, 'comms_disruption').length > 0
    || effectsForActor(ewBook, observerKey, localElapsedMs).some((row) => row.family === 'comms_disruption');
}

export function tryDeliverReport(ledger, input = {}, ewBook = null, localElapsedMs = 0) {
  const sender = normalizeKey(input.senderKey);
  const recipient = normalizeKey(input.recipientKey);
  if (ewBook && (commsDisrupted(ewBook, sender, localElapsedMs) || commsDisrupted(ewBook, recipient, localElapsedMs))) {
    return {
      report: null,
      created: false,
      delayed: true,
      reason: 'comms-disrupted',
      erasedByJamming: false,
      deliveredFlipped: false,
    };
  }
  return { ...deliverReport(ledger, input), delayed: false, erasedByJamming: false };
}

export function deliveredReportSurvives(ledger, reportId, observerKey, incidentId) {
  const report = ledger?.reports?.[reportId];
  return {
    present: Boolean(report),
    delivered: report?.delivered !== false,
    known: observerKnowsIncident(ledger, observerKey, incidentId),
    erasedByJamming: report?.erasedByJamming === true,
  };
}

export function applyActiveEw(ewBook, contactBook, localElapsedMs = 0, extras = {}) {
  expireEffects(ewBook, localElapsedMs, { actorsLeftSystem: extras.actorsLeftSystem === true });
  const applied = [];
  for (const effect of activeEffects(ewBook, localElapsedMs)) {
    if (effect.family === 'sensor_jamming') {
      applied.push({ effectId: effect.effectId, ...applySensorJamming(contactBook, effect.victimKey, localElapsedMs, effect) });
    } else if (effect.family === 'fire_control') {
      applied.push({ effectId: effect.effectId, ...applyFireControl(contactBook, effect.victimKey, localElapsedMs, effect) });
    } else if (effect.family === 'deceptive_contacts' && effect.ghostSubjectKey) {
      const existing = findContact(contactBook, effect.victimKey, effect.ghostSubjectKey);
      if (!existing) {
        const ghost = upsertGhostContact(contactBook, effect.victimKey, {
          subjectKey: effect.ghostSubjectKey,
        }, localElapsedMs, ewBook);
        applied.push({ effectId: effect.effectId, ghost: ghost.ok });
      }
    }
  }
  return {
    ok: true,
    applied,
    flashPulsed: false,
    standingChanged: false,
    reportsUnsent: false,
    engagement_authorized: undefined,
  };
}

export function tickEw(ewBook, contactBook, localElapsedMs = 0, extras = {}) {
  return applyActiveEw(ewBook, contactBook, localElapsedMs, extras);
}

export function syncPhase91Jammers(ew91, ewBook, localElapsedMs = 0, extras = {}) {
  if (!ew91 || !ewBook) return { ok: false, reason: 'ew-helper-missing' };
  const synced = [];
  for (const actor of Object.values(ew91.actors || {})) {
    if (!actor.ewEquipmentId) continue;
    const draw = actorJammerDraw(ew91, actor.actorKey, localElapsedMs, extras);
    const live = fieldIsLive(actor, localElapsedMs) && draw > 0;
    const existing = effectsForActor(ewBook, actor.actorKey, localElapsedMs)
      .find((row) => row.family === 'sensor_jamming');
    if (live) {
      if (existing) {
        existing.draw = draw;
        existing.endsAtLocalMs = Math.max(existing.endsAtLocalMs, localElapsedMs + 8000);
      } else {
        startEffect(ewBook, {
          family: 'sensor_jamming',
          actorKey: actor.actorKey,
          victimKey: extras.victimKey || actor.actorKey,
          draw,
        }, localElapsedMs);
      }
      synced.push({ actorKey: actor.actorKey, draw });
    } else if (existing && actor.commanded !== 'on') {
      cancelEffect(ewBook, existing.effectId);
    } else if (existing && draw <= 0) {
      cancelEffect(ewBook, existing.effectId);
    }
  }
  return { ok: true, synced };
}

export function injectDeepJam(ewBook, contactBook, opts = {}, localElapsedMs = 0) {
  const jam = injectJammer(ewBook, contactBook, { ...opts, family: 'sensor_jamming' }, localElapsedMs);
  if (contactBook) {
    applySensorJamming(contactBook, opts.victimKey || observerKeyForPlayer(), localElapsedMs, {
      subjectKey: opts.subjectKey,
      steps: opts.steps || 4,
    });
  }
  return jam;
}

export function injectJammer(ewBook, contactBook, opts = {}, localElapsedMs = 0) {
  if (!ewBook || typeof startEffect !== 'function') return { ok: false, reason: 'ew-helper-missing' };
  const family = FAMILY_SET.has(opts.family) ? opts.family : 'sensor_jamming';
  const started = startEffect(ewBook, {
    family,
    actorKey: opts.actorKey || observerKeyForPlayer(),
    victimKey: opts.victimKey || observerKeyForPlayer(),
    subjectKey: opts.subjectKey,
    draw: opts.draw,
    durationLocalMs: opts.durationLocalMs,
    magnitudes: opts.magnitudes,
  }, localElapsedMs);
  if (!started.ok) return started;
  if (family === 'deceptive_contacts') {
    const ghost = upsertGhostContact(contactBook, started.effect.victimKey, {
      x: opts.x,
      y: opts.y,
      lastKnown: opts.lastKnown,
    }, localElapsedMs, ewBook);
    started.effect.ghostSubjectKey = ghost.contact?.subjectKey || null;
    started.effect.contactId = ghost.contact?.contactId || null;
    started.ghost = ghost;
  } else if (contactBook) {
    tickEw(ewBook, contactBook, localElapsedMs);
  }
  return started;
}

export function fireAtContact(book, observerKey, subjectKey, extras = {}) {
  const contact = findContact(book, observerKey, subjectKey) || getContact(book, observerKey, extras.contactId);
  const facts = liveFireFactsFromEw(contact);
  const refuse = {
    fired: false,
    engagement_authorized: undefined,
    liveWeaponTrack: facts.liveWeaponTrack === true,
    firingSolution: contact?.firingSolution === true,
    mayAutoEngage: extras.mayAutoEngage ?? null,
  };
  if (!contact) {
    return { ...refuse, reason: 'missing-contact' };
  }
  if (isGhostContact(contact)) {
    return {
      ...refuse,
      reason: 'ghost-not-hull',
      firingSolution: false,
      liveWeaponTrack: false,
      combatTargetId: null,
    };
  }
  if (contact.firingSolution !== true || contact.trackQuality !== 'firm') {
    return { ...refuse, reason: 'no-firing-solution' };
  }
  if (extras.weaponReady === false || extras.weaponUsable === false || extras.insideEquippedRange === false) {
    return { ...refuse, reason: 'weapon-gate' };
  }
  return {
    fired: true,
    reason: 'ready',
    firingSolution: true,
    liveWeaponTrack: true,
    engagement_authorized: undefined,
  };
}

export function liveFireFactsFromEw(contact, extras = {}) {
  const facts = liveFireFactsFromContact(contact, extras);
  delete facts.engagement_authorized;
  if (isGhostContact(contact) || contact?.residue === true || contact?.source === 'ew_residue') {
    facts.liveWeaponTrack = false;
    facts.fromGhost = isGhostContact(contact);
    facts.fromResidue = contact?.residue === true || contact?.source === 'ew_residue';
  }
  return facts;
}

export function ewWritesEngagementAuthorized() {
  return false;
}

export function ewChangesRoe() {
  return false;
}

export function ewOpensCultureFire() {
  return false;
}

export function commsDisruptionIsAggression() {
  return false;
}

export function tractorIsBoarding() {
  return false;
}

export function cuttingBeamIsCapture() {
  return false;
}

export function ghostIsPrize() {
  return false;
}

export function boardingApis() {
  return [];
}

export function scienceSuiteMayMarkGhost(suiteGrade) {
  return suiteGrade === 'science' || suiteGrade === 'survey';
}

export function pruneGhostsBeforeLocks(book, observerKey) {
  const ghosts = listGhostContacts(book, observerKey);
  if (ghosts.length <= MAX_GHOSTS_PER_OBSERVER) return 0;
  const stale = [...ghosts].sort((a, b) => (a.freshnessLocalMs || 0) - (b.freshnessLocalMs || 0));
  let dropped = 0;
  while (stale.length > MAX_GHOSTS_PER_OBSERVER) {
    const row = stale.shift();
    const entry = book?.observers?.[normalizeKey(observerKey)];
    if (entry?.contacts?.[row.contactId]) {
      delete entry.contacts[row.contactId];
      dropped += 1;
    }
  }
  return dropped;
}

export function bothSidesSameRules(playerJam, npcJam) {
  return playerJam?.effect?.family === npcJam?.effect?.family
    && playerJam?.effect?.draw > 0
    && npcJam?.effect?.draw > 0
    && (playerJam.ghost?.hullSpawned ?? false) === false
    && (npcJam.ghost?.hullSpawned ?? false) === false;
}

export function createEmptyContactBookForTests() {
  return createContactBook();
}
