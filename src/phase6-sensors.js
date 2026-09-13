/**
 * Phase 6 — sensors, cloak, contact layers, purposeful system space.
 *
 * Source of truth:
 * - docs/phase6/BM1-PHASE6-SENSORS-CLOAK-SYSTEM-SPACE-PROPOSAL.md
 * - docs/phase6/BM1-PHASE6-ENGINE-DEPENDENCIES.md
 * - docs/revised-development-plan.md §4 / §8
 *
 * Written from docs/ only. Does not crib BM1-remastered-work.
 *
 * Hard gates: first-frame cloak; detection ≠ identification ≠ track ≠ firing
 * solution; hidden stays hidden (UI + AI, both sides); lost tracks drop exact
 * targeting; sensor variance (science can beat larger ordinary); active scans
 * useful + detectable; purposeful destinations not empty distance; arrival
 * varies, fleet spacing, exit retained.
 *
 * Soft: same-tick UI+AI drop on lost-track (S9.5). Cloak/unknown never inject
 * engagement_authorized or culture fire. Phase 3 unknown access stays stored
 * and unenforced from hidden identity.
 *
 * Phase 6.5 (docs/phase6/BM1-PHASE6.5-*.md) may feed capabilityMod / sensorMode
 * / detectabilityMod on the actor. Those move reach and the equipment axis only.
 * They do not invent identification, firingSolution, or engagement_authorized.
 * Gates 1–8 stay closed.
 */

export const CONTACT_BOOK_VERSION = 1;
export const MAX_CONTACTS_PER_OBSERVER = 32;
export const MAX_OBSERVERS = 24;
export const SYSTEM_CLAMP_W = 2600;
export const SYSTEM_CLAMP_H = 1800;

export const IDENTIFICATION_LEVELS = Object.freeze(['none', 'partial', 'known']);
export const TRACK_QUALITIES = Object.freeze(['none', 'area', 'coarse', 'firm']);
export const CONTACT_SOURCES = Object.freeze(['passive', 'active_scan', 'report', 'visual']);
export const DESTINATION_KINDS = Object.freeze([
  'lane',
  'belt',
  'relay',
  'wreck',
  'research',
  'restricted',
  'anomaly',
]);

/** Phase 3 unknown access stays stored, not silently enforced from hidden identity. */
export const UNKNOWN_ACCESS_ENFORCEMENT = false;

/**
 * Recommended clocks only — not locked balance constants. Probes assert
 * ordering and layer drops, not these numbers (proposal Q2).
 */
export const DEFAULT_DECAY_MS = Object.freeze({
  firmToCoarse: 8000,
  coarseToArea: 12000,
  areaToNone: 20000,
});
export const DEFAULT_SEARCH_DWELL_MS = 4000;
export const DEFAULT_SCAN_EMISSION_MS = 2500;
export const DEFAULT_AREA_RADIUS = 180;
export const DEFAULT_CLOAK_DURATION_MS = 12000;

const IDENT_SET = new Set(IDENTIFICATION_LEVELS);
const TRACK_SET = new Set(TRACK_QUALITIES);
const SOURCE_SET = new Set(CONTACT_SOURCES);
const KIND_SET = new Set(DESTINATION_KINDS);
const QUALITY_RANK = Object.freeze({ none: 0, area: 1, coarse: 2, firm: 3 });
const IDENT_RANK = Object.freeze({ none: 0, partial: 1, known: 2 });

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function clampNonNeg(value) {
  return Math.max(0, Number(value) || 0);
}

function normalizeKey(value, fallback = '') {
  const key = String(value ?? '').trim();
  return key && key !== 'undefined' && key !== 'null' ? key : fallback;
}

function sanitizeEnum(value, set, fallback) {
  return set.has(value) ? value : fallback;
}

function qualityAtMost(quality, cap) {
  return QUALITY_RANK[quality] <= QUALITY_RANK[cap];
}

function maxQuality(a, b) {
  return QUALITY_RANK[a] >= QUALITY_RANK[b] ? a : b;
}

function maxIdent(a, b) {
  return IDENT_RANK[a] >= IDENT_RANK[b] ? a : b;
}

export function shouldEnforceUnknownAccess() {
  return UNKNOWN_ACCESS_ENFORCEMENT === true;
}

export function observerKeyForPlayer() {
  return 'player';
}

export function observerKeyForNpc(instanceId) {
  const id = normalizeKey(instanceId);
  return id ? `npc:${id}` : '';
}

export function observerKeyForStation(stationId) {
  const id = normalizeKey(stationId);
  return id ? `station:${id}` : '';
}

export function subjectKeyForPlayer() {
  return 'player';
}

export function subjectKeyForNpc(instanceId) {
  const id = normalizeKey(instanceId);
  return id ? `npc:${id}` : '';
}

export function subjectKeyForStation(stationId) {
  const id = normalizeKey(stationId);
  return id ? `station:${id}` : '';
}

export function isNpcSubjectKey(subjectKey) {
  return String(subjectKey || '').startsWith('npc:');
}

export function instanceIdFromSubjectKey(subjectKey) {
  const key = String(subjectKey || '');
  if (key.startsWith('npc:')) return key.slice(4);
  if (key.startsWith('station:')) return key.slice(8);
  return key;
}

export function createCloakState({
  active = false,
  startedAtLocalMs = 0,
  durationLocalMs = DEFAULT_CLOAK_DURATION_MS,
} = {}) {
  return {
    active: Boolean(active),
    startedAtLocalMs: clampNonNeg(startedAtLocalMs),
    durationLocalMs: Math.max(1, Number(durationLocalMs) || DEFAULT_CLOAK_DURATION_MS),
  };
}

export function cloakRemainingLocalMs(cloak, localElapsedMs = 0) {
  if (!cloak?.active) return 0;
  const started = clampNonNeg(cloak.startedAtLocalMs);
  const duration = Math.max(1, Number(cloak.durationLocalMs) || DEFAULT_CLOAK_DURATION_MS);
  return Math.max(0, duration - (clampNonNeg(localElapsedMs) - started));
}

export function isCloakActive(cloak, localElapsedMs = 0) {
  return Boolean(cloak?.active && cloakRemainingLocalMs(cloak, localElapsedMs) > 0);
}

export function isHullCloaked(hull, localElapsedMs = 0) {
  if (!hull) return false;
  if (hull.cloak) return isCloakActive(hull.cloak, localElapsedMs);
  return false;
}

/**
 * Write cloak on the object before it is pushed to npcShips or a system-state
 * cache. Setting cloak on the next tick is a first-frame leak (gate 1).
 */
export function initHullCloak(hull, opts = {}, localElapsedMs = 0) {
  if (!hull || typeof hull !== 'object') return hull;
  hull.cloak = createCloakState({
    active: opts.active === true || opts.cloakActive === true || hull.cloak?.active === true,
    startedAtLocalMs: Number.isFinite(Number(opts.startedAtLocalMs))
      ? Number(opts.startedAtLocalMs)
      : localElapsedMs,
    durationLocalMs: Number.isFinite(Number(opts.durationLocalMs))
      ? Number(opts.durationLocalMs)
      : (hull.cloak?.durationLocalMs || DEFAULT_CLOAK_DURATION_MS),
  });
  return hull;
}

export function setCloakActive(cloakOrHull, active, localElapsedMs = 0, durationLocalMs = null) {
  const cloak = cloakOrHull?.cloak ? cloakOrHull.cloak : cloakOrHull;
  if (!cloak || typeof cloak !== 'object') return createCloakState({ active, startedAtLocalMs: localElapsedMs });
  cloak.active = Boolean(active);
  cloak.startedAtLocalMs = active ? clampNonNeg(localElapsedMs) : 0;
  if (durationLocalMs != null) cloak.durationLocalMs = Math.max(1, Number(durationLocalMs) || DEFAULT_CLOAK_DURATION_MS);
  if (cloakOrHull?.cloak) cloakOrHull.cloak = cloak;
  return cloak;
}

export function refreshCloakWhilePowered(cloak, localElapsedMs = 0) {
  if (!cloak?.active) return cloak;
  cloak.startedAtLocalMs = clampNonNeg(localElapsedMs);
  return cloak;
}

export function serializeCloak(cloak) {
  return {
    active: Boolean(cloak?.active),
    startedAtLocalMs: clampNonNeg(cloak?.startedAtLocalMs),
    durationLocalMs: Math.max(1, Number(cloak?.durationLocalMs) || DEFAULT_CLOAK_DURATION_MS),
  };
}

export function restoreCloak(raw) {
  return createCloakState(raw && typeof raw === 'object' ? raw : {});
}

export function createContactBook(extras = {}) {
  return {
    version: CONTACT_BOOK_VERSION,
    nextContactId: Math.max(1, Number(extras.nextContactId) || 1),
    observers: extras.observers && typeof extras.observers === 'object' ? extras.observers : {},
  };
}

export function emptyContactBook() {
  return createContactBook();
}

function takeContactId(book) {
  const n = book.nextContactId || 1;
  book.nextContactId = n + 1;
  return `ctc-${n}`;
}

export function getObserverEntry(book, observerKey) {
  const key = normalizeKey(observerKey);
  if (!book || !key) return null;
  if (!book.observers[key]) book.observers[key] = { contacts: {} };
  return book.observers[key];
}

export function listObserverKeys(book) {
  return Object.keys(book?.observers || {});
}

export function listContacts(book, observerKey) {
  const entry = book?.observers?.[normalizeKey(observerKey)];
  return Object.values(entry?.contacts || {});
}

export function findContact(book, observerKey, subjectKey) {
  const subject = normalizeKey(subjectKey);
  if (!subject) return null;
  return listContacts(book, observerKey).find((row) => row.subjectKey === subject) || null;
}

export function getContact(book, observerKey, contactId) {
  const entry = book?.observers?.[normalizeKey(observerKey)];
  return entry?.contacts?.[String(contactId || '')] || null;
}

function defaultLastKnown(atLocalMs = 0) {
  return { x: 0, y: 0, radius: DEFAULT_AREA_RADIUS, atLocalMs: clampNonNeg(atLocalMs) };
}

export function createContactRecord(input = {}, book = null) {
  const at = clampNonNeg(input.freshnessLocalMs ?? input.lastKnown?.atLocalMs ?? 0);
  const lastKnown = input.lastKnown && typeof input.lastKnown === 'object'
    ? {
      x: Number(input.lastKnown.x) || 0,
      y: Number(input.lastKnown.y) || 0,
      radius: Math.max(1, Number(input.lastKnown.radius) || DEFAULT_AREA_RADIUS),
      atLocalMs: clampNonNeg(input.lastKnown.atLocalMs ?? at),
    }
    : defaultLastKnown(at);
  const trackQuality = sanitizeEnum(input.trackQuality, TRACK_SET, 'none');
  const firingSolution = input.firingSolution === true && trackQuality === 'firm';
  return {
    contactId: input.contactId || (book ? takeContactId(book) : 'ctc-0'),
    observerKey: normalizeKey(input.observerKey),
    subjectKey: normalizeKey(input.subjectKey),
    detected: input.detected === true,
    identification: sanitizeEnum(input.identification, IDENT_SET, 'none'),
    trackQuality,
    firingSolution,
    cloakTruthKnown: input.cloakTruthKnown === true,
    lastKnown,
    freshnessLocalMs: clampNonNeg(input.freshnessLocalMs ?? lastKnown.atLocalMs),
    source: sanitizeEnum(input.source, SOURCE_SET, 'passive'),
    scanEmission: input.scanEmission && typeof input.scanEmission === 'object'
      ? clone(input.scanEmission)
      : null,
    search: input.search && typeof input.search === 'object' ? clone(input.search) : null,
  };
}

function enforceFiringSolution(contact) {
  if (!contact) return contact;
  if (contact.trackQuality !== 'firm' || contact.detected !== true) {
    contact.firingSolution = false;
  }
  return contact;
}

function pruneObserverContacts(entry) {
  const rows = Object.values(entry.contacts || {});
  if (rows.length <= MAX_CONTACTS_PER_OBSERVER) return;
  const staleFirst = [...rows].sort((a, b) => {
    const aLive = a.firingSolution === true ? 1 : 0;
    const bLive = b.firingSolution === true ? 1 : 0;
    if (aLive !== bLive) return aLive - bLive;
    const aFresh = a.trackQuality === 'none' || !a.detected ? 0 : QUALITY_RANK[a.trackQuality];
    const bFresh = b.trackQuality === 'none' || !b.detected ? 0 : QUALITY_RANK[b.trackQuality];
    if (aFresh !== bFresh) return aFresh - bFresh;
    return (a.freshnessLocalMs || 0) - (b.freshnessLocalMs || 0);
  });
  while (staleFirst.length > MAX_CONTACTS_PER_OBSERVER) {
    const drop = staleFirst.shift();
    if (drop.firingSolution === true && staleFirst.some((row) => row.firingSolution !== true)) {
      continue;
    }
    if (drop.firingSolution === true) break;
    delete entry.contacts[drop.contactId];
  }
}

function pruneObservers(book) {
  const keys = listObserverKeys(book);
  if (keys.length <= MAX_OBSERVERS) return;
  const ranked = keys.map((key) => {
    const contacts = listContacts(book, key);
    const live = contacts.some((row) => row.firingSolution === true);
    const newest = Math.max(0, ...contacts.map((row) => row.freshnessLocalMs || 0));
    return { key, live, newest };
  }).sort((a, b) => {
    if (a.live !== b.live) return a.live ? 1 : -1;
    return a.newest - b.newest;
  });
  while (ranked.length > MAX_OBSERVERS) {
    const drop = ranked.shift();
    if (drop.live) break;
    delete book.observers[drop.key];
  }
}

export function upsertContact(book, observerKey, input = {}, localElapsedMs = 0) {
  const key = normalizeKey(observerKey);
  const subject = normalizeKey(input.subjectKey);
  if (!book || !key || !subject) return null;
  const entry = getObserverEntry(book, key);
  const existing = findContact(book, key, subject);
  const record = createContactRecord({
    ...existing,
    ...input,
    contactId: existing?.contactId || input.contactId,
    observerKey: key,
    subjectKey: subject,
    freshnessLocalMs: input.freshnessLocalMs ?? localElapsedMs,
  }, existing ? null : book);
  enforceFiringSolution(record);
  entry.contacts[record.contactId] = record;
  pruneObserverContacts(entry);
  pruneObservers(book);
  return record;
}

export function dropContact(book, observerKey, contactId) {
  const entry = book?.observers?.[normalizeKey(observerKey)];
  if (!entry?.contacts?.[contactId]) return false;
  delete entry.contacts[contactId];
  return true;
}

export function dropContactsForSubject(book, subjectKey) {
  const subject = normalizeKey(subjectKey);
  if (!book || !subject) return 0;
  let dropped = 0;
  for (const key of listObserverKeys(book)) {
    const entry = book.observers[key];
    for (const [id, row] of Object.entries(entry.contacts || {})) {
      if (row.subjectKey === subject) {
        delete entry.contacts[id];
        dropped += 1;
      }
    }
  }
  return dropped;
}

export function pruneMissingSubjects(book, livingSubjectKeys = []) {
  const living = new Set((livingSubjectKeys || []).map((key) => normalizeKey(key)).filter(Boolean));
  living.add(subjectKeyForPlayer());
  let dropped = 0;
  for (const key of listObserverKeys(book)) {
    const entry = book.observers[key];
    for (const [id, row] of Object.entries(entry.contacts || {})) {
      if (row.firingSolution === true) continue;
      if (row.source === 'report' && row.trackQuality === 'area') continue;
      if (!living.has(row.subjectKey)) {
        delete entry.contacts[id];
        dropped += 1;
      }
    }
  }
  return dropped;
}

function sanitizeContact(raw) {
  if (!raw || typeof raw !== 'object' || !raw.contactId || !raw.subjectKey) return null;
  return createContactRecord(raw);
}

export function serializeContactBook(book) {
  const out = createContactBook({ nextContactId: book?.nextContactId });
  for (const [key, entry] of Object.entries(book?.observers || {})) {
    const contacts = {};
    for (const [id, row] of Object.entries(entry?.contacts || {})) {
      const clean = sanitizeContact(row);
      if (clean) contacts[id] = clean;
    }
    out.observers[key] = { contacts };
  }
  return clone(out);
}

export function restoreContactBook(raw) {
  if (!raw || typeof raw !== 'object') return emptyContactBook();
  const book = createContactBook({ nextContactId: raw.nextContactId });
  for (const [key, entry] of Object.entries(raw.observers || {})) {
    const observerKey = normalizeKey(key);
    if (!observerKey) continue;
    const contacts = {};
    for (const row of Object.values(entry?.contacts || {})) {
      const clean = sanitizeContact({ ...row, observerKey });
      if (clean) contacts[clean.contactId] = clean;
    }
    book.observers[observerKey] = { contacts };
  }
  return book;
}

export function observerSeesSubject(book, observerKey, subjectKey) {
  const contact = findContact(book, observerKey, subjectKey);
  return Boolean(contact?.detected);
}

export function observerHasFiringSolution(book, observerKey, subjectKey) {
  const contact = findContact(book, observerKey, subjectKey);
  return Boolean(contact?.detected && contact.firingSolution === true && contact.trackQuality === 'firm');
}

export function observerIdentification(book, observerKey, subjectKey) {
  return findContact(book, observerKey, subjectKey)?.identification || 'none';
}

export function contactPresentation(contact) {
  const detected = contact?.detected === true;
  const identification = sanitizeEnum(contact?.identification, IDENT_SET, 'none');
  const trackQuality = sanitizeEnum(contact?.trackQuality, TRACK_SET, 'none');
  const firingSolution = contact?.firingSolution === true && trackQuality === 'firm' && detected;
  return {
    showOnMinimap: detected,
    unclassified: detected && identification === 'none',
    showName: detected && identification !== 'none',
    showFaction: detected && identification !== 'none',
    showAttitude: detected && identification === 'known',
    showHullArt: detected && identification !== 'none',
    liveLock: firingSolution,
    areaOnly: !firingSolution && (trackQuality === 'area' || trackQuality === 'none' || !detected),
    exactTargeting: firingSolution,
    lockCopy: firingSolution
      ? 'Target locked'
      : detected && trackQuality === 'area'
        ? 'Last known is an area, not a firing solution.'
        : detected
          ? 'Contact held. No firing solution.'
          : '',
    tooltipName: detected && identification !== 'none',
    selectable: detected,
  };
}

export function classifySensorRole(actor = {}) {
  const role = String(actor.role || actor.doctrineRole || actor.requestedRole || '').toLowerCase();
  const name = String(actor.name || actor.shipClass || actor.classLabel || '').toLowerCase();
  const visual = String(actor.visualClass || '').toLowerCase();
  if (role === 'science' || name.includes('science') || visual === 'science') return 'science';
  if (role === 'explorer' || name.includes('explorer') || name.includes('nova')) return 'explorer';
  if (role === 'patrol' || role === 'defender' || role === 'hunter') return 'patrol';
  if (role === 'playerescort' || role === 'playerfleet') return 'escort';
  if (role === 'traffic' || role === 'localtraffic' || role === 'commercecontract') return 'traffic';
  if (role === 'station' || actor.stationTypeId) return 'station';
  return 'ordinary';
}

export function roleDefaultEquipment(role) {
  if (role === 'science') return 'science';
  if (role === 'explorer') return 'survey';
  if (role === 'station') return 'standard';
  return 'standard';
}

/**
 * Capability is a function of all five locked axes, not hull size alone.
 * Mass/class is recorded so probes can prove a smaller science specialist
 * beats a larger ordinary hull.
 */
export function sensorCapability(actor = {}) {
  const role = classifySensorRole(actor);
  const equipment = actor.sensorEquipment || roleDefaultEquipment(role);
  const age = clampNonNeg(actor.sensorAge);
  const power = clamp(actor.powerNorm ?? 1, 0, 1);
  const damage = clamp(actor.hullRatio ?? 1, 0, 1);
  const size = Math.max(0.1, Number(actor.mass) || Number(actor.size) || 1);
  const suiteMod = Number.isFinite(Number(actor.capabilityMod)) ? Number(actor.capabilityMod) : 0;
  const mode = actor.sensorMode === 'active' ? 'active' : 'passive';
  const modeW = mode === 'active' ? 0.16 : 0;

  const roleW = {
    science: 1.15,
    explorer: 0.8,
    patrol: 0.42,
    escort: 0.5,
    traffic: 0.28,
    station: 0.55,
    ordinary: 0.4,
  }[role] || 0.4;
  const equipW = equipment === 'science' ? 0.45 : equipment === 'survey' ? 0.28 : 0.12;
  const ageW = Math.max(0, 0.25 - age * 0.002);
  const powerW = power * 0.35;
  const damageW = damage * 0.3;
  const score = roleW + equipW + ageW + powerW + damageW + suiteMod + modeW;
  const cloakPierce = role === 'science'
    && equipment === 'science'
    && power >= 0.45
    && damage >= 0.55;
  return {
    score,
    reach: 380 + score * 420,
    identifyReach: 240 + (roleW + equipW) * 280,
    firmReach: 200 + score * 180,
    cloakPierce,
    axes: { role, equipment, age, power, damage, size, mode, suiteMod },
  };
}

export function compareSensorOrdering(left, right) {
  return sensorCapability(left).score - sensorCapability(right).score;
}

export function scienceOutperformsOrdinary(scienceActor, ordinaryActor) {
  return compareSensorOrdering(scienceActor, ordinaryActor) > 0;
}

export function evaluatePassiveDetection(observer, subject, distance, localElapsedMs = 0, extras = {}) {
  const mode = extras.mode === 'active' || observer?.sensorMode === 'active' ? 'active' : 'passive';
  const cap = sensorCapability({ ...observer, sensorMode: mode });
  const cloaked = extras.cloaked === true || isHullCloaked(subject, localElapsedMs);
  const range = Number(distance);
  if (!Number.isFinite(range)) {
    return { detected: false, identification: 'none', trackQuality: 'none', firingSolution: false, source: 'passive' };
  }
  if (cloaked && !cap.cloakPierce) {
    return { detected: false, identification: 'none', trackQuality: 'none', firingSolution: false, source: 'passive', reason: 'cloak' };
  }
  const detectMod = Number.isFinite(Number(extras.detectabilityMod ?? subject?.detectabilityMod))
    ? Number(extras.detectabilityMod ?? subject?.detectabilityMod)
    : 0;
  const detectBoost = cloaked ? 1 : (1 + clamp(detectMod, -0.8, 1.5) * 0.28);
  const reach = (cloaked ? cap.reach * 0.58 : cap.reach) * detectBoost;
  if (range > reach) {
    return { detected: false, identification: 'none', trackQuality: 'none', firingSolution: false, source: 'passive', reason: 'range' };
  }
  const identifyReach = cloaked ? cap.identifyReach * 0.7 : cap.identifyReach;
  const identification = range <= identifyReach * 0.55
    ? (cloaked ? 'partial' : 'known')
    : range <= identifyReach
      ? (cloaked ? 'none' : 'partial')
      : 'none';
  const trackQuality = range <= cap.firmReach * (cloaked ? 0.7 : 1)
    ? 'firm'
    : range <= reach * 0.72
      ? 'coarse'
      : 'area';
  const firingSolution = trackQuality === 'firm' && !cloaked;
  return {
    detected: true,
    identification,
    trackQuality,
    firingSolution,
    source: 'passive',
    cloakTruthKnown: false,
  };
}

export function applyPassiveUpdate(book, observerKey, subjectKey, evalResult, lastKnown, localElapsedMs = 0) {
  if (!evalResult?.detected) return findContact(book, observerKey, subjectKey);
  return upsertContact(book, observerKey, {
    subjectKey,
    detected: true,
    identification: evalResult.identification,
    trackQuality: evalResult.trackQuality,
    firingSolution: evalResult.firingSolution === true,
    cloakTruthKnown: evalResult.cloakTruthKnown === true,
    lastKnown: {
      x: lastKnown?.x || 0,
      y: lastKnown?.y || 0,
      radius: evalResult.trackQuality === 'firm' ? 28 : evalResult.trackQuality === 'coarse' ? 90 : DEFAULT_AREA_RADIUS,
      atLocalMs: localElapsedMs,
    },
    freshnessLocalMs: localElapsedMs,
    source: evalResult.source || 'passive',
  }, localElapsedMs);
}

/**
 * A Phase 4/5 report seeds detection + last-known area only.
 * It never grants a firing solution (gate 2).
 */
export function seedFromReport(book, observerKey, subjectKey, lastKnown, localElapsedMs = 0) {
  const existing = findContact(book, observerKey, subjectKey);
  const identification = existing?.identification && existing.identification !== 'none'
    ? existing.identification
    : 'none';
  return upsertContact(book, observerKey, {
    subjectKey,
    detected: true,
    identification,
    trackQuality: 'area',
    firingSolution: false,
    cloakTruthKnown: false,
    lastKnown: {
      x: Number(lastKnown?.x) || 0,
      y: Number(lastKnown?.y) || 0,
      radius: Math.max(DEFAULT_AREA_RADIUS, Number(lastKnown?.radius) || DEFAULT_AREA_RADIUS),
      atLocalMs: localElapsedMs,
    },
    freshnessLocalMs: localElapsedMs,
    source: 'report',
  }, localElapsedMs);
}

export function decayTrackQuality(quality, ageMs, thresholds = DEFAULT_DECAY_MS) {
  const firmToCoarse = Number(thresholds.firmToCoarse) || DEFAULT_DECAY_MS.firmToCoarse;
  const coarseToArea = Number(thresholds.coarseToArea) || DEFAULT_DECAY_MS.coarseToArea;
  const areaToNone = Number(thresholds.areaToNone) || DEFAULT_DECAY_MS.areaToNone;
  if (quality === 'firm' && ageMs >= firmToCoarse) return 'coarse';
  if ((quality === 'firm' || quality === 'coarse') && ageMs >= firmToCoarse + coarseToArea) return 'area';
  if (quality !== 'none' && ageMs >= firmToCoarse + coarseToArea + areaToNone) return 'none';
  if (quality === 'coarse' && ageMs >= coarseToArea) return 'area';
  if (quality === 'area' && ageMs >= areaToNone) return 'none';
  return quality;
}

export function growAreaRadius(radius, ageMs) {
  return Math.min(720, Math.max(DEFAULT_AREA_RADIUS, (Number(radius) || DEFAULT_AREA_RADIUS) + ageMs * 0.012));
}

function lostTrackDrop(contact, extra = {}) {
  return {
    observerKey: contact.observerKey,
    subjectKey: contact.subjectKey,
    contactId: contact.contactId,
    firingSolution: false,
    exactTargeting: false,
    liveWeaponTrack: false,
    dropExactTargeting: true,
    dropLiveWeaponTrack: true,
    dropAutoAim: true,
    dropTrackingHome: true,
    dropAiAcquisition: true,
    ui: {
      tooltipLock: false,
      minimapExact: false,
      selectionLock: false,
    },
    ai: { acquisition: false },
    lastKnown: clone(contact.lastKnown),
    sameTick: true,
    ...extra,
  };
}

export function decayContact(contact, localElapsedMs = 0, thresholds = DEFAULT_DECAY_MS) {
  if (!contact) return { contact: null, dropped: null };
  const age = Math.max(0, clampNonNeg(localElapsedMs) - clampNonNeg(contact.freshnessLocalMs));
  const nextQuality = decayTrackQuality(contact.trackQuality, age, thresholds);
  const hadLock = contact.firingSolution === true;
  contact.trackQuality = nextQuality;
  if (nextQuality === 'none') contact.detected = contact.source === 'report';
  if (nextQuality === 'area' || nextQuality === 'none') {
    contact.lastKnown = {
      ...contact.lastKnown,
      radius: growAreaRadius(contact.lastKnown?.radius, age),
      atLocalMs: contact.lastKnown?.atLocalMs ?? contact.freshnessLocalMs,
    };
  }
  enforceFiringSolution(contact);
  const dropped = hadLock && contact.firingSolution !== true
    ? lostTrackDrop(contact)
    : null;
  return { contact, dropped };
}

export function decayObserverTracks(book, observerKey, localElapsedMs = 0, thresholds = DEFAULT_DECAY_MS) {
  const drops = [];
  for (const contact of listContacts(book, observerKey)) {
    const result = decayContact(contact, localElapsedMs, thresholds);
    if (result.dropped) drops.push(result.dropped);
  }
  return drops;
}

export function decayAllTracks(book, localElapsedMs = 0, thresholds = DEFAULT_DECAY_MS) {
  const drops = [];
  for (const key of listObserverKeys(book)) {
    drops.push(...decayObserverTracks(book, key, localElapsedMs, thresholds));
  }
  return drops;
}

/**
 * Same-tick lost-track drop (S9.5 / soft gate). UI tooltip/minimap/selection
 * and AI acquisition lose exact lock together — spelled like S9.1 first-frame.
 */
export function applyLostTrackSameTick(book, observerKey, contactId, localElapsedMs = 0, consumers = {}) {
  const contact = getContact(book, observerKey, contactId) || findContact(book, observerKey, contactId);
  if (!contact) return { ok: false, reason: 'missing-contact', sameTick: true };
  contact.trackQuality = qualityAtMost(contact.trackQuality, 'area') ? contact.trackQuality : 'area';
  if (contact.trackQuality === 'firm') contact.trackQuality = 'area';
  contact.firingSolution = false;
  contact.lastKnown = {
    x: Number(contact.lastKnown?.x) || 0,
    y: Number(contact.lastKnown?.y) || 0,
    radius: growAreaRadius(contact.lastKnown?.radius, 1),
    atLocalMs: contact.lastKnown?.atLocalMs ?? localElapsedMs,
  };
  const drop = lostTrackDrop(contact);
  consumers.dropExactTargeting?.(drop);
  consumers.dropTrackingHome?.(drop);
  consumers.dropAiAcquisition?.(drop);
  consumers.dropUiLock?.(drop);
  return { ok: true, contact, drop, sameTick: true, firingSolution: false };
}

export function ageTrack(book, observerKey, contactId, localElapsedMs, extraAgeMs = 60000, thresholds = DEFAULT_DECAY_MS) {
  const contact = getContact(book, observerKey, contactId) || findContact(book, observerKey, contactId);
  if (!contact) return { ok: false, reason: 'missing-contact' };
  contact.freshnessLocalMs = clampNonNeg(localElapsedMs) - Math.max(0, Number(extraAgeMs) || 0);
  const { dropped } = decayContact(contact, localElapsedMs, thresholds);
  if (!dropped && contact.firingSolution === true) {
    return applyLostTrackSameTick(book, observerKey, contact.contactId, localElapsedMs);
  }
  return {
    ok: true,
    contact,
    drop: dropped || lostTrackDrop(contact),
    firingSolution: contact.firingSolution === true,
    sameTick: true,
  };
}

export function startSearch(book, observerKey, contactId, localElapsedMs = 0, dwellMs = DEFAULT_SEARCH_DWELL_MS) {
  const contact = getContact(book, observerKey, contactId) || findContact(book, observerKey, contactId);
  if (!contact) return { ok: false, reason: 'missing-contact' };
  contact.search = {
    startedAtLocalMs: clampNonNeg(localElapsedMs),
    dwellMs: Math.max(1, Number(dwellMs) || DEFAULT_SEARCH_DWELL_MS),
    status: 'running',
  };
  contact.firingSolution = false;
  return { ok: true, contact, firingSolution: false, pending: true };
}

export function resolveSearch(book, observerKey, contactId, localElapsedMs = 0, extras = {}) {
  const contact = getContact(book, observerKey, contactId) || findContact(book, observerKey, contactId);
  if (!contact) return { ok: false, reason: 'missing-contact' };
  const search = contact.search;
  if (!search || search.status !== 'running') {
    return { ok: false, reason: 'no-search', firingSolution: contact.firingSolution === true };
  }
  const elapsed = clampNonNeg(localElapsedMs) - clampNonNeg(search.startedAtLocalMs);
  if (extras.fail === true) {
    search.status = 'failed';
    contact.firingSolution = false;
    return {
      ok: true,
      failed: true,
      firingSolution: false,
      inventedCoordinates: false,
      attackerId: null,
      contact,
      sayable: 'Search failed after the dwell. Contact remains overdue-area only.',
    };
  }
  if (elapsed < search.dwellMs && extras.forceComplete !== true) {
    contact.firingSolution = false;
    return { ok: true, pending: true, firingSolution: false, contact };
  }
  const earned = extras.sensorsEarn || null;
  if (!earned?.detected) {
    search.status = 'exhausted';
    contact.trackQuality = contact.trackQuality === 'none' ? 'none' : 'area';
    contact.firingSolution = false;
    return {
      ok: true,
      failed: true,
      clockExhausted: true,
      firingSolution: false,
      inventedCoordinates: false,
      contact,
    };
  }
  search.status = 'success';
  contact.detected = true;
  contact.identification = maxIdent(contact.identification, earned.identification || 'none');
  contact.trackQuality = maxQuality(contact.trackQuality === 'none' ? 'area' : contact.trackQuality, earned.trackQuality || 'area');
  contact.firingSolution = earned.firingSolution === true && contact.trackQuality === 'firm';
  contact.freshnessLocalMs = localElapsedMs;
  contact.source = earned.source || 'passive';
  enforceFiringSolution(contact);
  return { ok: true, success: true, contact, firingSolution: contact.firingSolution === true };
}

export function failSearch(book, observerKey, contactId, localElapsedMs = 0) {
  return resolveSearch(book, observerKey, contactId, localElapsedMs, { fail: true });
}

export function createScanEmission(scannerKey, localElapsedMs = 0, extras = {}) {
  return {
    scannerKey: normalizeKey(scannerKey),
    atLocalMs: clampNonNeg(localElapsedMs),
    expiresAtLocalMs: clampNonNeg(localElapsedMs) + Math.max(1, Number(extras.durationMs) || DEFAULT_SCAN_EMISSION_MS),
    subjectKey: extras.subjectKey ? normalizeKey(extras.subjectKey) : null,
    detectedBy: [],
  };
}

export function scanEmissionActive(emission, localElapsedMs = 0) {
  return Boolean(emission && clampNonNeg(localElapsedMs) < clampNonNeg(emission.expiresAtLocalMs));
}

export function performActiveScan(book, observer, subject, distance, localElapsedMs = 0) {
  const observerKey = normalizeKey(observer?.key || observer?.observerKey);
  const subjectKey = normalizeKey(subject?.key || subject?.subjectKey);
  const emission = createScanEmission(observerKey, localElapsedMs, { subjectKey });
  const activeObserver = observer && typeof observer === 'object'
    ? { ...observer, sensorMode: 'active' }
    : observer;
  if (observer && typeof observer === 'object') observer.scanEmission = emission;
  if (observerKey) {
    const entry = getObserverEntry(book, observerKey);
    if (entry) entry.scanEmission = emission;
  }
  const cloaked = subject?.cloaked === true || isHullCloaked(subject, localElapsedMs);
  const cap = sensorCapability(activeObserver);
  if (cloaked && !cap.cloakPierce) {
    return {
      useful: true,
      empty: true,
      raised: false,
      emission,
      identification: findContact(book, observerKey, subjectKey)?.identification || 'none',
      trackQuality: findContact(book, observerKey, subjectKey)?.trackQuality || 'none',
      firingSolution: false,
      cargoDump: false,
      sayable: 'Scan found nothing. Cloaked contact (if any) stayed hidden.',
    };
  }
  const passive = evaluatePassiveDetection(activeObserver, subject, distance, localElapsedMs, { cloaked, mode: 'active' });
  const existing = findContact(book, observerKey, subjectKey);
  let identification = existing?.identification || 'none';
  let trackQuality = existing?.trackQuality || 'none';
  if (passive.detected) {
    identification = maxIdent(identification, identification === 'none' ? 'partial' : maxIdent(identification, passive.identification));
    if (identification === 'none') identification = 'partial';
    else if (identification === 'partial' && passive.identification === 'known') identification = 'known';
    trackQuality = maxQuality(trackQuality === 'none' ? 'area' : trackQuality, maxQuality(passive.trackQuality, 'coarse'));
  } else if (Number(distance) <= cap.reach * 1.15) {
    identification = maxIdent(identification, 'partial');
    trackQuality = maxQuality(trackQuality === 'none' ? 'area' : trackQuality, 'coarse');
  } else {
    return {
      useful: true,
      empty: true,
      raised: false,
      emission,
      identification,
      trackQuality,
      firingSolution: false,
      cargoDump: false,
      sayable: 'Scan found nothing. Cloaked contact (if any) stayed hidden.',
    };
  }
  const firingSolution = trackQuality === 'firm' && !cloaked;
  const contact = upsertContact(book, observerKey, {
    subjectKey,
    detected: true,
    identification,
    trackQuality,
    firingSolution,
    cloakTruthKnown: false,
    lastKnown: {
      x: Number(subject?.x) || existing?.lastKnown?.x || 0,
      y: Number(subject?.y) || existing?.lastKnown?.y || 0,
      radius: trackQuality === 'firm' ? 24 : trackQuality === 'coarse' ? 70 : DEFAULT_AREA_RADIUS,
      atLocalMs: localElapsedMs,
    },
    freshnessLocalMs: localElapsedMs,
    source: 'active_scan',
    scanEmission: emission,
  }, localElapsedMs);
  return {
    useful: true,
    empty: false,
    raised: true,
    emission,
    contact,
    identification,
    trackQuality,
    firingSolution: contact.firingSolution === true,
    cargoDump: false,
    sayable: `Active scan: identification raised to ${identification}. Emission detectable.`,
  };
}

export function noticeScanEmission(book, otherObserver, scanner, emission, localElapsedMs = 0, extras = {}) {
  const otherKey = normalizeKey(otherObserver?.key || otherObserver?.observerKey);
  const scannerKey = normalizeKey(scanner?.key || scanner?.observerKey || emission?.scannerKey);
  if (!otherKey || !scannerKey || otherKey === scannerKey) {
    return { noticed: false };
  }
  if (!scanEmissionActive(emission, localElapsedMs)) return { noticed: false, expired: true };
  const seesScanner = extras.detectsScanner === true
    || observerSeesSubject(book, otherKey, scannerKey)
    || extras.detectsEmission === true;
  const cap = sensorCapability(otherObserver);
  const emissionDistance = Number(extras.emissionDistance);
  const hearsEmission = extras.detectsEmission === true
    || (Number.isFinite(emissionDistance) && emissionDistance <= cap.reach * 1.1);
  if (!seesScanner && !hearsEmission) return { noticed: false };
  if (emission.detectedBy && !emission.detectedBy.includes(otherKey)) emission.detectedBy.push(otherKey);
  const scannerContact = findContact(book, otherKey, scannerKey);
  if (!scannerContact?.detected) {
    upsertContact(book, otherKey, {
      subjectKey: scannerKey,
      detected: true,
      identification: scannerContact?.identification || 'none',
      trackQuality: scannerContact?.trackQuality || 'area',
      firingSolution: false,
      lastKnown: {
        x: Number(scanner?.x) || 0,
        y: Number(scanner?.y) || 0,
        radius: DEFAULT_AREA_RADIUS,
        atLocalMs: localElapsedMs,
      },
      freshnessLocalMs: localElapsedMs,
      source: 'passive',
    }, localElapsedMs);
  }
  const otherEntry = getObserverEntry(book, otherKey);
  if (otherEntry) otherEntry.noticedEmissions = [...(otherEntry.noticedEmissions || []), {
    scannerKey,
    atLocalMs: localElapsedMs,
  }];
  return {
    noticed: true,
    firingAuthorized: false,
    flash: false,
    revealedFriends: false,
    sayable: 'Scan detected by the science ship. They know they were painted.',
  };
}

/**
 * Escorts may share the flagship book only while in formation, and only as
 * detection / last-known — never a gifted firing solution (proposal Q3).
 */
export function shareFormationDetection(book, playerKey, escortKey, localElapsedMs = 0) {
  if (!book || playerKey === escortKey) return [];
  const copied = [];
  for (const contact of listContacts(book, playerKey)) {
    if (!contact.detected) continue;
    const existing = findContact(book, escortKey, contact.subjectKey);
    if (existing?.firingSolution === true) continue;
    const next = upsertContact(book, escortKey, {
      subjectKey: contact.subjectKey,
      detected: true,
      identification: existing?.identification || 'none',
      trackQuality: existing && QUALITY_RANK[existing.trackQuality] > QUALITY_RANK.area
        ? existing.trackQuality
        : 'area',
      firingSolution: false,
      lastKnown: clone(contact.lastKnown),
      freshnessLocalMs: localElapsedMs,
      source: existing?.source || 'passive',
    }, localElapsedMs);
    copied.push(next);
  }
  return copied;
}

export function hiddenIdentityDoesNotAuthorize(facts = {}) {
  if (facts.fromHiddenIdentity === true) return facts.engagement_authorized !== true;
  return true;
}

export function liveFireFactsFromContact(contact, extras = {}) {
  const detected = contact?.detected === true;
  const identified = contact?.identification && contact.identification !== 'none';
  const firing = contact?.firingSolution === true && contact.trackQuality === 'firm';
  return {
    contactDetected: detected,
    identityKnown: identified === true,
    liveWeaponTrack: firing,
    engagement_authorized: extras.engagementAuthorized === true ? true : undefined,
    fromHiddenIdentity: false,
  };
}

export function buildSystemDestinations(input = {}) {
  const star = input.star || { x: SYSTEM_CLAMP_W * 0.5, y: SYSTEM_CLAMP_H * 0.5 };
  const planet = input.planet || { x: SYSTEM_CLAMP_W * 0.5, y: SYSTEM_CLAMP_H * 0.42 };
  const stations = Array.isArray(input.stations) ? input.stations : [];
  const asteroids = Array.isArray(input.asteroids) ? input.asteroids : [];
  const wormhole = input.wormhole || null;
  const seed = Number(input.seed) || 1;
  const laneAngle = Math.atan2(planet.y - star.y, planet.x - star.x);
  const point = (x, y) => ({
    x: clamp(x, 130, SYSTEM_CLAMP_W - 130),
    y: clamp(y, 130, SYSTEM_CLAMP_H - 130),
  });
  const dests = [
    {
      kind: 'lane',
      id: `dest-lane-${seed}-1`,
      name: 'planet transfer lane',
      ...point(planet.x + Math.cos(laneAngle + Math.PI / 2) * 430, planet.y + Math.sin(laneAngle + Math.PI / 2) * 430),
      independentAddress: false,
      locationId: null,
    },
    {
      kind: 'lane',
      id: `dest-lane-${seed}-2`,
      name: 'outer orbital lane',
      ...point(planet.x + Math.cos(laneAngle + Math.PI) * 640, planet.y + Math.sin(laneAngle + Math.PI) * 640),
      independentAddress: false,
      locationId: null,
    },
    {
      kind: 'relay',
      id: `dest-relay-${seed}`,
      name: 'nav relay',
      ...point(
        (stations[0]?.x ?? planet.x) + 160,
        (stations[0]?.y ?? planet.y) - 140,
      ),
      independentAddress: false,
      locationId: null,
    },
    {
      kind: 'wreck',
      id: `dest-wreck-${seed}`,
      name: 'in-system wreck',
      ...point(star.x + Math.cos(laneAngle + 2.1) * 780, star.y + Math.sin(laneAngle + 2.1) * 780),
      stub: true,
      independentAddress: false,
      locationId: null,
    },
    {
      kind: 'research',
      id: `dest-research-${seed}`,
      name: 'research site',
      ...point(star.x + Math.cos(laneAngle - 1.4) * 620, star.y + Math.sin(laneAngle - 1.4) * 620),
      stub: true,
      independentAddress: false,
      locationId: null,
    },
    {
      kind: 'restricted',
      id: `dest-restricted-${seed}`,
      name: 'restricted facility',
      ...point(planet.x + Math.cos(laneAngle + 0.7) * 360, planet.y + Math.sin(laneAngle + 0.7) * 360),
      stub: true,
      independentAddress: false,
      locationId: null,
      issuesPhase3Order: false,
    },
    {
      kind: 'anomaly',
      id: `dest-anomaly-${seed}`,
      name: input.hasNebula ? 'nebula anomaly' : 'sensor anomaly',
      ...point(star.x + Math.cos(laneAngle + 3.4) * 900, star.y + Math.sin(laneAngle + 3.4) * 900),
      stub: true,
      independentAddress: false,
      locationId: null,
    },
  ];
  if (asteroids.length || input.hasAsteroids) {
    const cx = asteroids.length
      ? asteroids.reduce((sum, row) => sum + Number(row.x || 0), 0) / asteroids.length
      : star.x + 520;
    const cy = asteroids.length
      ? asteroids.reduce((sum, row) => sum + Number(row.y || 0), 0) / asteroids.length
      : star.y + 180;
    dests.push({
      kind: 'belt',
      id: `dest-belt-${seed}`,
      name: 'asteroid belt',
      ...point(cx, cy),
      independentAddress: false,
      locationId: null,
    });
  }
  if (wormhole) {
    dests.push({
      kind: 'lane',
      id: `dest-wormhole-${seed}`,
      name: 'wormhole approach lane',
      ...point(wormhole.x + 180, wormhole.y + 120),
      independentAddress: false,
      locationId: null,
    });
  }
  return dests.filter((row) => KIND_SET.has(row.kind));
}

export function listDestinationKinds(destinations = []) {
  return [...new Set((destinations || []).map((row) => row.kind).filter((kind) => KIND_SET.has(kind)))];
}

export function isIndependentlyAddressable(destination) {
  return Boolean(destination?.independentAddress || (destination?.locationId && destination?.deepSpace === true));
}

export function inboundBearing(fromPoint, toPoint) {
  const from = fromPoint || { x: 0, y: 0 };
  const to = toPoint || { x: 1, y: 0 };
  return Math.atan2((to.y || 0) - (from.y || 0), (to.x || 0) - (from.x || 0));
}

export function computeArrivalDrop(input = {}) {
  if (input.checkpointApproach && input.checkpointApproach.x != null) {
    return {
      point: { x: Number(input.checkpointApproach.x), y: Number(input.checkpointApproach.y) },
      reason: 'checkpoint',
      exit: { warp: true, wormhole: Boolean(input.wormhole), checkpointWithdraw: true },
      usedCheckpoint: true,
    };
  }
  const planet = input.planet || { x: SYSTEM_CLAMP_W * 0.5, y: SYSTEM_CLAMP_H * 0.42 };
  const fromMap = input.fromMap || { x: 0, y: 0 };
  const toMap = input.toMap || { x: planet.x, y: planet.y };
  const bearing = Number.isFinite(Number(input.bearing))
    ? Number(input.bearing)
    : inboundBearing(fromMap, toMap);
  const destinations = Array.isArray(input.destinations) ? input.destinations : [];
  const approachSide = destinations
    .map((dest) => ({
      dest,
      alignment: Math.cos(bearing) * (dest.x - planet.x) + Math.sin(bearing) * (dest.y - planet.y),
    }))
    .filter((row) => row.alignment < 0)
    .sort((a, b) => a.alignment - b.alignment)[0]?.dest;
  const nebulaNudge = input.hasNebula ? 40 : 0;
  const trafficNudge = Math.min(80, Number(input.trafficDensity) || 0);
  const point = {
    x: planet.x + Math.cos(bearing + Math.PI) * (260 + nebulaNudge) + (approachSide ? (approachSide.x - planet.x) * 0.18 : 0),
    y: planet.y + Math.sin(bearing + Math.PI) * (200 + nebulaNudge * 0.6) + (approachSide ? (approachSide.y - planet.y) * 0.18 : 0) + trafficNudge * 0.2,
  };
  return {
    point,
    reason: approachSide ? `route+${approachSide.kind}` : 'route-bearing',
    bearing,
    exit: {
      warp: true,
      warpHeading: bearing + Math.PI,
      wormhole: Boolean(input.wormhole),
      checkpointWithdraw: false,
    },
    usedCheckpoint: false,
    approachKind: approachSide?.kind || null,
  };
}

export function placeEscortsOnFormation(playerPoint, count, formationFn) {
  const placed = [];
  for (let i = 0; i < count; i += 1) {
    const point = typeof formationFn === 'function'
      ? formationFn(i)
      : {
        x: playerPoint.x + Math.cos(Math.PI * 0.72 + i) * (155 + i * 18),
        y: playerPoint.y + Math.sin(Math.PI * 0.72 + i) * (155 + i * 18),
      };
    placed.push({ index: i, x: point.x, y: point.y });
  }
  return placed;
}

export function escortsStackedOnFlagship(playerPoint, escorts, minDist = 40) {
  return (escorts || []).some((escort) => (
    Math.hypot((escort.x || 0) - (playerPoint.x || 0), (escort.y || 0) - (playerPoint.y || 0)) < minDist
  ));
}

export function retainExitPath(exit = {}) {
  return Boolean(exit.warp || exit.wormhole || exit.checkpointWithdraw);
}

export function firstFrameVisibility(book, observerKey, subjectKey) {
  const seen = observerSeesSubject(book, observerKey, subjectKey);
  const lock = observerHasFiringSolution(book, observerKey, subjectKey);
  const contact = findContact(book, observerKey, subjectKey);
  const presentation = contactPresentation(contact);
  return {
    minimap: seen,
    targetCycle: seen,
    clickSelect: seen,
    aiAcquisition: seen,
    firingSolution: lock,
    nameLeaked: presentation.showName,
    factionLeaked: presentation.showFaction,
  };
}

export function listDetectedSubjectKeys(book, observerKey) {
  return listContacts(book, observerKey)
    .filter((row) => row.detected)
    .map((row) => row.subjectKey);
}

export function listFiringSolutions(book, observerKey) {
  return listContacts(book, observerKey)
    .filter((row) => row.firingSolution === true && row.trackQuality === 'firm')
    .map((row) => row.subjectKey);
}

export function scienceVsOrdinaryFixture(overrides = {}) {
  const science = {
    role: 'science',
    sensorEquipment: 'science',
    sensorAge: 0,
    powerNorm: 1,
    hullRatio: 1,
    mass: 2,
    name: 'Science Specialist',
    ...overrides.science,
  };
  const ordinary = {
    role: 'patrol',
    sensorEquipment: 'standard',
    sensorAge: 8,
    powerNorm: 1,
    hullRatio: 1,
    mass: 12,
    name: 'Ordinary Battleship',
    ...overrides.ordinary,
  };
  const damagedScience = {
    ...science,
    powerNorm: 0.12,
    hullRatio: 0.2,
    ...overrides.damagedScience,
  };
  return { science, ordinary, damagedScience };
}
