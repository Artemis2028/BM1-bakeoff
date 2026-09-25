/**
 * S33 — captains briefing / jump-intel archive.
 *
 * Source of truth:
 * - docs/briefing-archive/BM1-BRIEFING-ARCHIVE-PROPOSAL.md §3
 * - docs/briefing-archive/BM1-BRIEFING-ARCHIVE-ENGINE-DEPENDENCIES.md
 *
 * Sibling book beside contactBook / dominionBook. Reads observer `player`
 * and writes only this archive. Does not crib BM1-remastered-work.
 * BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED stays false. Caps 24 and 12 are
 * this brief's bake-off choices. An inject may lower them and must not raise them.
 *
 * Does not run a scan, spend EW, mint knowledge, write discovery, grant an
 * assignment, or consult doctrine fire. Does not grant fire, ROE, standing,
 * pursuit, credits, rosterPlayable, or a hidden Dominion reveal.
 */

import { getIncident, observerKnowsIncident } from './phase4-incidents.js';
import { getAssignment, observerKnowsAssignment, sayableOverdue } from './phase5-objectives.js';
import { contactPresentation, listContacts } from './phase6-sensors.js';
import { offersProtectAll, ROE_MODES } from './phase2-security.js';
import { getObserverKnowledge, sayableKnowledgeLine } from './phase10-dominion-book.js';
import { collectLeakedNames, sayableSystemName } from './phase10-discovery.js';

export const BRIEFING_ARCHIVE_VERSION = 1;
export const BRIEFING_ARCHIVE_CAP = 24;
export const BRIEFING_LINE_CAP = 12;
export const BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED = false;
export const BRIEFING_UNSAYABLE_SYSTEM = 'Undiscovered destination.';
export const GHOST_BRIEFING_COPY = 'Ghost contact. Sensor record only — no hull, no firing solution.';
export const SPOOF_SUSPICION_COPY = 'Focused Scan: transponder claim does not match silhouette. Suspicion only — not a firing solution, not identity.';

const PLAYER = 'player';
const LABEL_SOURCES = new Set(['own', 'friendly', 'mixed', 'unlabeled']);
const DOMINION_LAYERS = new Set(['rumor', 'evidence', 'contact']);
const WRITE_FLAGS = Object.freeze([
  'grantsFire',
  'writesRoe',
  'writesStanding',
  'writesPursuit',
  'writesCredits',
  'writesRosterPlayable',
  'writesDiscovery',
]);

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function clampNonNeg(value) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function stableStringify(value) {
  if (value == null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function effectiveCap(store) {
  const n = Math.floor(Number(store?.cap));
  if (!Number.isFinite(n)) return BRIEFING_ARCHIVE_CAP;
  return Math.min(BRIEFING_ARCHIVE_CAP, Math.max(0, n));
}

function effectiveLineCap(store) {
  const n = Math.floor(Number(store?.lineCap));
  if (!Number.isFinite(n)) return BRIEFING_LINE_CAP;
  return Math.min(BRIEFING_LINE_CAP, Math.max(0, n));
}

function clampCaps(store) {
  store.cap = effectiveCap(store);
  store.lineCap = effectiveLineCap(store);
}

function coerceFlags(store) {
  store.version = BRIEFING_ARCHIVE_VERSION;
  store.lockedFromRemastered = false;
  for (const flag of WRITE_FLAGS) store[flag] = false;
  for (const row of Object.values(store.briefings || {})) {
    if (row && typeof row === 'object') row.grantsFire = false;
  }
}

export function emptyBriefingArchive() {
  return {
    version: BRIEFING_ARCHIVE_VERSION,
    cap: BRIEFING_ARCHIVE_CAP,
    lineCap: BRIEFING_LINE_CAP,
    nextBriefingId: 1,
    selectedId: null,
    lockedFromRemastered: false,
    grantsFire: false,
    writesRoe: false,
    writesStanding: false,
    writesPursuit: false,
    writesCredits: false,
    writesRosterPlayable: false,
    writesDiscovery: false,
    briefings: {},
  };
}

function hasRawCoordinates(text) {
  const line = String(text || '');
  if (/\b[xy]\s*[:=]\s*-?\d+(?:\.\d+)?/i.test(line)) return true;
  if (/\(-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\)/.test(line)) return true;
  return false;
}

function stripCoordinates(text) {
  return String(text || '')
    .replace(/\b[xy]\s*[:=]\s*-?\d+(?:\.\d+)?/gi, '')
    .replace(/\(-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function lineRejected(text, discovery) {
  const line = String(text || '').trim();
  if (!line) return true;
  if (hasRawCoordinates(line)) return true;
  if (collectLeakedNames([line], discovery || {}, PLAYER).length) return true;
  return false;
}

function claimOf(contact) {
  const raw = contact?.transponderClaim;
  if (!raw || typeof raw !== 'object') return null;
  if (raw.mode === 'spoof' || raw.spoofedFaction) {
    return {
      mode: 'spoof',
      spoofedFaction: raw.spoofedFaction ? String(raw.spoofedFaction) : '',
    };
  }
  return null;
}

function contactLine(contact) {
  const presentation = contactPresentation(contact);
  if (presentation.ghost) return GHOST_BRIEFING_COPY;
  const claim = claimOf(contact);
  if (claim && contact?.spoofExposed === true) return SPOOF_SUSPICION_COPY;
  if (claim && contact?.spoofExposed !== true) {
    const faction = claim.spoofedFaction || 'unspecified';
    return `Transponder claim: ${faction}. Claim only — not a true side, not identity.`;
  }
  if (presentation.residue) return presentation.lockCopy;
  return presentation.lockCopy || '';
}

function contactWorthFiling(contact) {
  if (!contact) return false;
  if (contact.ghost === true || contact.source === 'ew_ghost' || String(contact.subjectKey || '').startsWith('ghost:')) return true;
  if (contact.decoy === true || contact.source === 'ew_decoy') return true;
  if (contact.residue === true || contact.source === 'ew_residue') return true;
  if (contact.detected === true) return true;
  if (claimOf(contact)) return true;
  return false;
}

function storedInterferenceLine(stored) {
  const source = stored?.source;
  if (!LABEL_SOURCES.has(source)) return null;
  if (stored.usedClaim === true || stored.inventedFaction === true) return null;
  return `Stored interference label: ${source}. usedClaim false. inventedFaction false.`;
}

function incidentLine(incident) {
  const text = stripCoordinates(incident?.sayable || '');
  return text || 'Incident recorded.';
}

function assignmentLine(assignment, board) {
  const id = assignment?.assignmentId;
  const related = Object.values(board?.objectives || {}).filter((row) => row?.assignmentId === id);
  const overdue = related.find((row) => row.kind === 'asset_overdue');
  if (overdue) return stripCoordinates(sayableOverdue(assignment));
  const convoy = related.find((row) => row.sayable && row.kind !== 'asset_overdue');
  if (convoy?.sayable) return stripCoordinates(convoy.sayable);
  return `Assignment ${id} is known. Overdue is not destroyed. No attacker identified.`;
}

function compareOldest(a, b) {
  const jump = (Number(a.producedAtStrategicJumps) || 0) - (Number(b.producedAtStrategicJumps) || 0);
  if (jump) return jump;
  return String(a.id).localeCompare(String(b.id));
}

function compareNewest(a, b) {
  const jump = (Number(b.producedAtStrategicJumps) || 0) - (Number(a.producedAtStrategicJumps) || 0);
  if (jump) return jump;
  return String(b.id).localeCompare(String(a.id));
}

function evictToCap(store) {
  const cap = effectiveCap(store);
  const rows = () => Object.values(store.briefings || {});
  while (rows().length > cap) {
    const victims = rows().filter((row) => row.id !== store.selectedId);
    if (!victims.length) break;
    victims.sort(compareOldest);
    delete store.briefings[victims[0].id];
  }
}

function trimLines(row, lineCap) {
  const lines = Array.isArray(row.lines) ? row.lines.map((line) => String(line)) : [];
  if (lines.length > lineCap) {
    const extra = lines.length - lineCap;
    row.lines = lines.slice(0, lineCap);
    row.omittedCount = clampNonNeg(row.omittedCount) + extra;
  } else {
    row.lines = lines;
    row.omittedCount = clampNonNeg(row.omittedCount);
  }
}

function buildPerception(sources = {}) {
  const discovery = sources.discovery || sources.dominionBook?.discovery || {};
  const systemIndex = clampNonNeg(sources.systemIndex);
  const strategicJumps = clampNonNeg(sources.strategicJumps);
  const systemName = sources.systemName == null ? '' : String(sources.systemName);
  const folderLabel = sayableSystemName(discovery, PLAYER, systemName, BRIEFING_UNSAYABLE_SYSTEM)
    || BRIEFING_UNSAYABLE_SYSTEM;
  const interference = storedInterferenceLine(sources.storedInterference);
  const contacts = listContacts(sources.contactBook, PLAYER)
    .filter(contactWorthFiling)
    .sort((a, b) => String(a.contactId).localeCompare(String(b.contactId)));
  const contactFacts = contacts.map((contact) => {
    const presentation = contactPresentation(contact);
    const claim = claimOf(contact);
    return {
      contactId: String(contact.contactId),
      ghost: presentation.ghost === true,
      decoy: contact.decoy === true || contact.source === 'ew_decoy',
      residue: presentation.residue === true,
      spoofExposed: contact.spoofExposed === true,
      claimFaction: claim && contact.spoofExposed !== true ? (claim.spoofedFaction || '') : null,
      liveLock: presentation.liveLock === true,
      line: contactLine(contact),
    };
  });
  const ledger = sources.incidentLedger;
  const incidentIds = [...(ledger?.observerCopies?.[PLAYER]?.knownIncidentIds || [])]
    .map(String)
    .filter((id) => observerKnowsIncident(ledger, PLAYER, id))
    .sort((a, b) => a.localeCompare(b));
  const incidentFacts = incidentIds.map((id) => ({
    id,
    line: incidentLine(getIncident(ledger, id)),
  }));
  const observer = sources.assignmentObserver || { knownAssignmentIds: [] };
  const assignmentRows = Object.values(sources.objectiveBoard?.assignments || {})
    .filter((row) => row?.assignmentId && observerKnowsAssignment(observer, row.assignmentId))
    .sort((a, b) => String(a.assignmentId).localeCompare(String(b.assignmentId)));
  const assignmentFacts = assignmentRows.map((row) => ({
    id: String(row.assignmentId),
    line: assignmentLine(getAssignment(sources.objectiveBoard, row.assignmentId) || row, sources.objectiveBoard),
  }));
  const knowledge = getObserverKnowledge(sources.dominionBook, PLAYER);
  const layer = knowledge?.layer || 'none';
  const dominionLine = DOMINION_LAYERS.has(layer) ? sayableKnowledgeLine(knowledge) : null;
  const candidates = [];
  const push = (text) => {
    const line = stripCoordinates(text);
    if (lineRejected(line, discovery)) return;
    candidates.push(line);
  };
  push(`Arrival: ${folderLabel}. Jump ${strategicJumps}.`);
  if (interference) push(interference);
  for (const fact of contactFacts) push(fact.line);
  for (const fact of incidentFacts) push(fact.line);
  for (const fact of assignmentFacts) push(fact.line);
  if (dominionLine) push(dominionLine);
  const keptAssignmentIds = assignmentFacts
    .filter((fact) => !lineRejected(fact.line, discovery))
    .map((fact) => fact.id);
  let campaignGroup = null;
  if (DOMINION_LAYERS.has(layer)) campaignGroup = 'wider_dominion';
  else if (keptAssignmentIds.length) campaignGroup = 'objectives';
  const perception = {
    folderLabel,
    interference: interference ? sources.storedInterference.source : null,
    contacts: contactFacts.map((fact) => ({
      contactId: fact.contactId,
      ghost: fact.ghost,
      decoy: fact.decoy,
      residue: fact.residue,
      spoofExposed: fact.spoofExposed,
      claimFaction: fact.claimFaction,
      liveLock: fact.liveLock,
    })),
    incidentIds: incidentFacts.filter((fact) => !lineRejected(fact.line, discovery)).map((fact) => fact.id),
    assignmentIds: keptAssignmentIds,
    dominionLayer: layer,
  };
  return {
    systemIndex,
    strategicJumps,
    folderLabel,
    campaignGroup,
    candidates,
    perception,
    digest: stableStringify(perception),
  };
}

function pinSelected(store, id) {
  store.selectedId = store.briefings[id] ? id : null;
}

export function produceArrivalBriefing(book, sources = {}) {
  const store = asObject(book) || emptyBriefingArchive();
  if (!store.briefings || typeof store.briefings !== 'object' || Array.isArray(store.briefings)) {
    store.briefings = {};
  }
  clampCaps(store);
  coerceFlags(store);
  const built = buildPerception(sources);
  const dedupeKey = `${PLAYER}|${built.systemIndex}|${built.strategicJumps}|${built.digest}`;
  const lineCap = effectiveLineCap(store);
  const lines = built.candidates.slice(0, lineCap);
  const omittedCount = Math.max(0, built.candidates.length - lines.length);
  const existing = Object.values(store.briefings).find((row) => row.dedupeKey === dedupeKey);
  if (existing) {
    existing.lines = lines;
    existing.omittedCount = omittedCount;
    existing.perception = built.perception;
    existing.folderLabel = built.folderLabel;
    existing.campaignGroup = built.campaignGroup;
    existing.grantsFire = false;
    pinSelected(store, existing.id);
    coerceFlags(store);
    return { book: store, briefing: existing, deduped: true, id: existing.id };
  }
  const id = `brf-${clampNonNeg(store.nextBriefingId) || 1}`;
  store.nextBriefingId = (clampNonNeg(store.nextBriefingId) || 1) + 1;
  const row = {
    id,
    folderKey: `system:${built.systemIndex}`,
    folderKind: 'system',
    folderLabel: built.folderLabel,
    campaignGroup: built.campaignGroup,
    producedAtStrategicJumps: built.strategicJumps,
    systemIndex: built.systemIndex,
    dedupeKey,
    lines,
    omittedCount,
    perception: built.perception,
    grantsFire: false,
  };
  store.briefings[id] = row;
  pinSelected(store, id);
  evictToCap(store);
  coerceFlags(store);
  return { book: store, briefing: store.briefings[id] || row, deduped: false, id };
}

export function selectBriefing(book, id) {
  const store = asObject(book) || emptyBriefingArchive();
  if (!store.briefings || typeof store.briefings !== 'object') store.briefings = {};
  const key = id == null || id === '' ? null : String(id);
  store.selectedId = key && store.briefings[key] ? key : null;
  coerceFlags(store);
  return store;
}

export function listBriefingFolders(book) {
  const store = asObject(book) || emptyBriefingArchive();
  const groups = new Map();
  for (const row of Object.values(store.briefings || {})) {
    if (!row?.folderKey) continue;
    if (!groups.has(row.folderKey)) groups.set(row.folderKey, []);
    groups.get(row.folderKey).push(row);
  }
  const selected = store.briefings?.[store.selectedId];
  const selectedKey = selected?.folderKey || null;
  const folders = [...groups.entries()].map(([folderKey, rows]) => {
    const ordered = rows.slice().sort(compareNewest);
    const maxJump = Math.max(0, ...ordered.map((row) => Number(row.producedAtStrategicJumps) || 0));
    return {
      folderKey,
      folderLabel: ordered[0]?.folderLabel || BRIEFING_UNSAYABLE_SYSTEM,
      maxJump,
      rows: ordered,
    };
  });
  folders.sort((a, b) => {
    if (a.folderKey === selectedKey && b.folderKey !== selectedKey) return -1;
    if (b.folderKey === selectedKey && a.folderKey !== selectedKey) return 1;
    if (a.maxJump !== b.maxJump) return b.maxJump - a.maxJump;
    return String(a.folderKey).localeCompare(String(b.folderKey));
  });
  return folders;
}

export function listCampaignBriefings(book, group) {
  const store = asObject(book) || emptyBriefingArchive();
  return Object.values(store.briefings || {})
    .filter((row) => row.campaignGroup === group)
    .sort(compareNewest);
}

function cleanBriefing(raw, discovery, lineCap) {
  const row = asObject(raw);
  if (!row) return null;
  const id = String(row.id || '');
  if (!/^brf-\d+$/.test(id)) return null;
  const systemIndex = clampNonNeg(row.systemIndex);
  const cleaned = {
    id,
    folderKey: `system:${systemIndex}`,
    folderKind: 'system',
    folderLabel: String(row.folderLabel || BRIEFING_UNSAYABLE_SYSTEM),
    campaignGroup: row.campaignGroup === 'wider_dominion' || row.campaignGroup === 'objectives'
      ? row.campaignGroup
      : null,
    producedAtStrategicJumps: clampNonNeg(row.producedAtStrategicJumps),
    systemIndex,
    dedupeKey: String(row.dedupeKey || `${PLAYER}|restored|${id}`),
    lines: Array.isArray(row.lines) ? row.lines.map((line) => String(line)) : [],
    omittedCount: clampNonNeg(row.omittedCount),
    perception: asObject(row.perception) || {},
    grantsFire: false,
  };
  trimLines(cleaned, lineCap);
  const kept = [];
  for (const line of cleaned.lines) {
    if (lineRejected(line, discovery)) continue;
    kept.push(line);
  }
  cleaned.lines = kept;
  if (lineRejected(cleaned.folderLabel, discovery)) cleaned.folderLabel = BRIEFING_UNSAYABLE_SYSTEM;
  return cleaned;
}

export function restoreBriefingArchive(raw, context = {}) {
  const source = asObject(raw);
  if (!source) return emptyBriefingArchive();
  const store = emptyBriefingArchive();
  if (source.cap != null) store.cap = source.cap;
  if (source.lineCap != null) store.lineCap = source.lineCap;
  clampCaps(store);
  const discovery = context.discovery || {};
  const lineCap = effectiveLineCap(store);
  const briefings = {};
  const incoming = asObject(source.briefings) || {};
  for (const row of Object.values(incoming)) {
    const cleaned = cleanBriefing(row, discovery, lineCap);
    if (cleaned) briefings[cleaned.id] = cleaned;
  }
  store.briefings = briefings;
  let next = Math.max(1, clampNonNeg(source.nextBriefingId) || 1);
  for (const id of Object.keys(briefings)) {
    const match = /^brf-(\d+)$/.exec(id);
    if (match) next = Math.max(next, Number(match[1]) + 1);
  }
  store.nextBriefingId = next;
  const requested = source.selectedId == null ? null : String(source.selectedId);
  store.selectedId = requested && briefings[requested] ? requested : null;
  evictToCap(store);
  if (store.selectedId && !store.briefings[store.selectedId]) store.selectedId = null;
  coerceFlags(store);
  return store;
}

export function serializeBriefingArchive(book) {
  const store = asObject(book) || emptyBriefingArchive();
  clampCaps(store);
  coerceFlags(store);
  const briefings = {};
  for (const row of Object.values(store.briefings || {})) {
    if (!row?.id) continue;
    briefings[row.id] = {
      id: row.id,
      folderKey: row.folderKey,
      folderKind: 'system',
      folderLabel: row.folderLabel,
      campaignGroup: row.campaignGroup ?? null,
      producedAtStrategicJumps: clampNonNeg(row.producedAtStrategicJumps),
      systemIndex: clampNonNeg(row.systemIndex),
      dedupeKey: row.dedupeKey,
      lines: Array.isArray(row.lines) ? row.lines.slice() : [],
      omittedCount: clampNonNeg(row.omittedCount),
      perception: asObject(row.perception) ? JSON.parse(JSON.stringify(row.perception)) : {},
      grantsFire: false,
    };
  }
  return {
    version: BRIEFING_ARCHIVE_VERSION,
    cap: store.cap,
    lineCap: store.lineCap,
    nextBriefingId: Math.max(1, clampNonNeg(store.nextBriefingId) || 1),
    selectedId: store.selectedId && briefings[store.selectedId] ? store.selectedId : null,
    lockedFromRemastered: false,
    grantsFire: false,
    writesRoe: false,
    writesStanding: false,
    writesPursuit: false,
    writesCredits: false,
    writesRosterPlayable: false,
    writesDiscovery: false,
    briefings,
  };
}

export function applyBriefingArchiveInject(book, payload = {}) {
  const store = asObject(book) || emptyBriefingArchive();
  if (!store.briefings) store.briefings = {};
  const input = asObject(payload) || {};
  if (input.cap != null) {
    const requested = Math.floor(Number(input.cap));
    const current = effectiveCap(store);
    if (Number.isFinite(requested) && requested >= 0 && requested <= current) {
      store.cap = requested;
    }
  }
  if (input.lineCap != null) {
    const requested = Math.floor(Number(input.lineCap));
    const current = effectiveLineCap(store);
    if (Number.isFinite(requested) && requested >= 0 && requested <= current) {
      store.lineCap = requested;
    }
  }
  clampCaps(store);
  const lineCap = effectiveLineCap(store);
  for (const row of Object.values(store.briefings)) trimLines(row, lineCap);
  evictToCap(store);
  if (store.selectedId && !store.briefings[store.selectedId]) store.selectedId = null;
  coerceFlags(store);
  return store;
}

export function briefingArchiveSnapshot(book) {
  const store = asObject(book) || emptyBriefingArchive();
  const folders = listBriefingFolders(store);
  const rows = Object.values(store.briefings || {});
  return {
    lockedFromRemastered: BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED === true,
    cap: effectiveCap(store),
    lineCap: effectiveLineCap(store),
    count: rows.length,
    selectedId: store.selectedId && store.briefings?.[store.selectedId] ? store.selectedId : null,
    grantsFire: false,
    writesRoe: false,
    writesStanding: false,
    writesPursuit: false,
    writesCredits: false,
    writesRosterPlayable: false,
    writesDiscovery: false,
    saveSlotCount: 3,
    roeModes: ROE_MODES.slice(),
    protectAllOffered: offersProtectAll({}) === true,
    folders: folders.map((folder) => ({
      folderKey: folder.folderKey,
      folderLabel: folder.folderLabel,
      ids: folder.rows.map((row) => row.id),
    })),
    briefings: rows.map((row) => ({
      id: row.id,
      folderKey: row.folderKey,
      folderLabel: row.folderLabel,
      campaignGroup: row.campaignGroup ?? null,
      dedupeKey: row.dedupeKey,
      lineCount: Array.isArray(row.lines) ? row.lines.length : 0,
      omittedCount: clampNonNeg(row.omittedCount),
      producedAtStrategicJumps: clampNonNeg(row.producedAtStrategicJumps),
      lines: Array.isArray(row.lines) ? row.lines.slice() : [],
      grantsFire: false,
    })),
  };
}

export function requireBriefingArchiveHelpers() {
  const helpers = [
    emptyBriefingArchive,
    serializeBriefingArchive,
    restoreBriefingArchive,
    produceArrivalBriefing,
    selectBriefing,
    listBriefingFolders,
    applyBriefingArchiveInject,
    briefingArchiveSnapshot,
  ];
  for (const helper of helpers) {
    if (typeof helper !== 'function') {
      const error = new Error('briefing-archive helper missing');
      error.missing = true;
      throw error;
    }
  }
}
