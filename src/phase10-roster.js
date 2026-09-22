/**
 * S31 — Phase 10 full-roster sibling catalog.
 *
 * Source of truth:
 * - docs/phase10-roster/BM1-PHASE10-ROSTER-PROPOSAL.md §3
 * - docs/phase10-roster/BM1-PHASE10-ROSTER-ENGINE-DEPENDENCIES.md
 *
 * Written from those docs + landed doctrine / pack / dominionBook facts.
 * Does not crib BM1-remastered-work. PHASE10_ROSTER_LOCKED_FROM_REMASTERED stays false.
 *
 * Sibling of state.dominionBook. Does not write dominionBook.scope or
 * rosterPlayable. A catalog row is not a firing solution, not a map reveal,
 * not engagement_authorized, and not a third ROE.
 *
 * Hard gates:
 * 1. Named coverage / pack completeness without collapsing Phase 1 identity.
 * 2. Paths are not ROE injects. Two-mode ROE stays. No third mode.
 * 3. Never gift firingSolution / culture fire / engagement_authorized.
 * 4. Do not reopen #33–#67 (S18.18 unamended).
 * 5. Named outs stay out.
 * 6. Blind / remastered-lock false.
 * 7. Thin subscribe catalog + probes. No chrome readout.
 * 8. Discovery % / invasion odds injectable; no locked secret table.
 */

import { applyPhase1RelationContract, flagShareGrantsSystemControl } from './phase1-authority.js';
import { ROE_MODES, offersProtectAll } from './phase2-security.js';
import { foldDoctrineResponse } from './phase4-incidents.js';
import { emptyAgreements, ordinaryCaptainKnowsPact } from './phase10-agreements.js';
import { DISCOVERY_ODDS_LOCKED, INVASION_ODDS_LOCKED } from './phase10-magnitudes.js';
import { cultureGrantsFirePermission } from './side-lane-unrest-independence.js';

export const FACTION_ROSTER_BOOK_VERSION = 1;
export const PHASE10_ROSTER_LOCKED_FROM_REMASTERED = false;
export const ROSTER_KNOWLEDGE_CAP = 'none';

export const ROSTER_NAMED_IDS = Object.freeze([
  'neutral',
  'ferengi',
  'vulcan',
  'romulan',
  'cardassian',
  'terran',
  'klingon',
  'tholian',
  'breen',
  'bajoran',
  'andorian',
  'delpin',
  'sona',
  'tarellian',
  'promelli',
  'hirogen',
  'suliban',
]);

export const ROSTER_STUB_PROFILE_IDS = Object.freeze(['gorn', 'borg', 'pirate']);
export const ROSTER_POINTER_IDS = Object.freeze(['dominion_remnant', 'dominion_central']);

export const ROSTER_PROFILE_IDS = Object.freeze([
  ...ROSTER_NAMED_IDS,
  ...ROSTER_STUB_PROFILE_IDS,
  ...ROSTER_POINTER_IDS,
]);

export const ROSTER_PACK_FACTION_KEYS = Object.freeze([
  'andorian',
  'bajoran',
  'borg',
  'breen',
  'cardassian',
  'delpin',
  'dominion',
  'ferengi',
  'gorn',
  'hirogen',
  'klingon',
  'neutral',
  'promelli',
  'romulan',
  'sona',
  'suliban',
  'tarellian',
  'terran',
  'tholian',
  'vulcan',
]);

export const ROSTER_CULTURE_IDS = Object.freeze([
  'lysian',
  'flashian',
  'swiss',
  'dyson',
  'opusab',
  'teposian',
  'reman',
  'trill',
  'blender_remnant',
]);

/** Existing factionDefs starts. Catalog rows are not new start buttons. */
export const ROSTER_START_KEYS = Object.freeze([
  'neutral',
  'ferengi',
  'vulcan',
  'romulan',
  'cardassian',
  'terran',
  'klingon',
  'dominion',
  'tholian',
]);

export const FORBIDDEN_ROSTER_KEYS = Object.freeze(['rebel', 'thaleron']);

const NAMED_RUNTIME = Object.freeze({
  neutral: 'neutral',
  ferengi: 'ferengi',
  vulcan: 'vulcan',
  romulan: 'romulan',
  cardassian: 'cardassian',
  terran: 'terran',
  klingon: 'klingon',
  tholian: 'tholian',
  breen: 'breen',
  bajoran: 'bajoran',
  andorian: 'andorian',
  delpin: 'delpin',
  sona: 'sona',
  tarellian: 'tarellian',
  promelli: 'promelli',
  hirogen: 'hirogen',
  suliban: 'suliban',
});

const PROFILE_SET = new Set(ROSTER_PROFILE_IDS);
const PACK_SET = new Set(ROSTER_PACK_FACTION_KEYS);
const CULTURE_SET = new Set(ROSTER_CULTURE_IDS);
const NAMED_SET = new Set(ROSTER_NAMED_IDS);
const POINTER_SET = new Set(ROSTER_POINTER_IDS);
const STUB_PROFILE_SET = new Set(ROSTER_STUB_PROFILE_IDS);

const PACK_COVERAGE = Object.freeze({
  andorian: 'named',
  bajoran: 'named',
  borg: 'stub',
  breen: 'named',
  cardassian: 'named',
  delpin: 'named',
  dominion: 'subscribe-dominion-first',
  ferengi: 'named',
  gorn: 'stub',
  hirogen: 'named',
  klingon: 'named',
  neutral: 'named',
  promelli: 'named',
  romulan: 'named',
  sona: 'named',
  suliban: 'named',
  tarellian: 'named',
  terran: 'named',
  tholian: 'named',
  vulcan: 'named',
});

const SECRET_TABLE_KEYS = Object.freeze([
  'discoveryPercent',
  'invasionOdds',
  'invasionPercent',
  'noticePercent',
  'secretTable',
]);

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function hardFields() {
  return {
    grantsFire: false,
    firingSolution: false,
    mapRevealed: false,
    rewritesPlayerFaction: false,
    pactInherit: false,
    knowledgeCap: ROSTER_KNOWLEDGE_CAP,
    magnitudesLocked: false,
    alliance: false,
  };
}

function stampProfile(id) {
  let coverage = 'named';
  let runtimeKey = NAMED_RUNTIME[id] || null;
  if (STUB_PROFILE_SET.has(id)) {
    coverage = 'stub';
    runtimeKey = id === 'pirate' ? null : id;
  } else if (POINTER_SET.has(id)) {
    coverage = 'subscribe-dominion-first';
    runtimeKey = 'dominion';
  }
  const row = {
    id,
    kind: 'profile',
    coverage,
    runtimeKey,
    packFaction: PACK_SET.has(id) ? id : null,
    ...hardFields(),
  };
  if (id === 'neutral') row.alliance = false;
  return row;
}

function stampPack(id) {
  return {
    id,
    kind: 'pack',
    coverage: PACK_COVERAGE[id] || null,
    runtimeKey: id === 'dominion' ? 'dominion' : (NAMED_RUNTIME[id] || (STUB_PROFILE_SET.has(id) ? id : null)),
    packFaction: id,
    ...hardFields(),
  };
}

function stampCulture(id) {
  return {
    id,
    kind: 'culture',
    coverage: 'stub',
    runtimeKey: null,
    packFaction: null,
    ...hardFields(),
  };
}

function canonicalProfiles() {
  return ROSTER_PROFILE_IDS.map((id) => stampProfile(id));
}

function canonicalPacks() {
  return ROSTER_PACK_FACTION_KEYS.map((id) => stampPack(id));
}

function canonicalCultures() {
  return ROSTER_CULTURE_IDS.map((id) => stampCulture(id));
}

function rowClean(row) {
  if (!row || typeof row !== 'object') return false;
  return row.grantsFire === false
    && row.firingSolution === false
    && row.mapRevealed === false
    && row.rewritesPlayerFaction === false
    && row.pactInherit === false
    && row.knowledgeCap === ROSTER_KNOWLEDGE_CAP
    && row.magnitudesLocked === false
    && row.alliance !== true
    && !Object.prototype.hasOwnProperty.call(row, 'engagement_authorized');
}

function bookForked(store) {
  return Boolean(store && (store.stage || store.discovery || store.agreements || store.authorizedDeployment));
}

function secretTablePresent(store) {
  if (!store || typeof store !== 'object') return false;
  for (const key of SECRET_TABLE_KEYS) {
    if (store[key] != null) return true;
  }
  return false;
}

function friendlyHas(list, other) {
  return Array.isArray(list) && list.includes(other);
}

function breenDominionStripped(context) {
  const sample = applyPhase1RelationContract({
    dominion: { friendly: ['breen', 'cardassian'], hostile: [] },
    breen: { friendly: ['dominion'], hostile: [] },
  });
  const sampleOk = !friendlyHas(sample.dominion?.friendly, 'breen')
    && !friendlyHas(sample.breen?.friendly, 'dominion');
  const liveDominion = context.dominionFriendly;
  const liveBreen = context.breenFriendly;
  const liveOk = (liveDominion == null || !friendlyHas(liveDominion, 'breen'))
    && (liveBreen == null || !friendlyHas(liveBreen, 'dominion'));
  return sampleOk && liveOk;
}

function ordinaryPact(context) {
  const agreements = context.agreements || emptyAgreements();
  return ordinaryCaptainKnowsPact(agreements, { faction: 'breen', actorKey: 'ordinary-captain', command: false })
    || ordinaryCaptainKnowsPact(agreements, { faction: 'cardassian', actorKey: 'ordinary-captain', command: false });
}

export function classifyRosterKey(id) {
  const key = String(id || '');
  if (!key || FORBIDDEN_ROSTER_KEYS.includes(key)) return null;
  if (PROFILE_SET.has(key)) {
    if (POINTER_SET.has(key)) return 'subscribe-dominion-first';
    if (STUB_PROFILE_SET.has(key)) return 'stub';
    if (NAMED_SET.has(key)) return 'named';
  }
  if (PACK_SET.has(key)) return PACK_COVERAGE[key] || null;
  if (CULTURE_SET.has(key)) return 'stub';
  return null;
}

export function requirePhase10RosterHelpers() {
  const helpers = [
    ['emptyFactionRosterBook', emptyFactionRosterBook],
    ['serializeFactionRosterBook', serializeFactionRosterBook],
    ['restoreFactionRosterBook', restoreFactionRosterBook],
    ['factionRosterSnapshot', factionRosterSnapshot],
    ['applyRosterUnlock', applyRosterUnlock],
    ['rosterUnlockMustNotGiftFire', rosterUnlockMustNotGiftFire],
    ['classifyRosterKey', classifyRosterKey],
  ];
  for (const [name, helper] of helpers) {
    if (typeof helper !== 'function') {
      const error = new Error(`phase10-roster: ${name} missing`);
      error.missing = true;
      error.helper = name;
      throw error;
    }
  }
}

export function emptyFactionRosterBook() {
  return {
    version: FACTION_ROSTER_BOOK_VERSION,
    PHASE10_ROSTER_LOCKED_FROM_REMASTERED: false,
    knowledgeCap: ROSTER_KNOWLEDGE_CAP,
    rareCommanders: false,
    separateRebelPolity: false,
    grantsFire: false,
    firingSolution: false,
    pactInherit: false,
    discoveryOddsLocked: false,
    invasionOddsLocked: false,
    secretTablePresent: false,
    magnitudesLocked: false,
    profiles: canonicalProfiles(),
    packFactions: canonicalPacks(),
    cultures: canonicalCultures(),
    npcBindings: {},
  };
}

export function serializeFactionRosterBook(book) {
  const store = restoreFactionRosterBook(book);
  return {
    version: FACTION_ROSTER_BOOK_VERSION,
    PHASE10_ROSTER_LOCKED_FROM_REMASTERED: false,
    knowledgeCap: store.knowledgeCap,
    rareCommanders: false,
    separateRebelPolity: false,
    grantsFire: false,
    firingSolution: false,
    pactInherit: false,
    discoveryOddsLocked: false,
    invasionOddsLocked: false,
    secretTablePresent: false,
    magnitudesLocked: false,
    profiles: store.profiles.map((row) => ({ ...row })),
    packFactions: store.packFactions.map((row) => ({ ...row })),
    cultures: store.cultures.map((row) => ({ ...row })),
    npcBindings: {},
  };
}

export function restoreFactionRosterBook(saved) {
  const book = emptyFactionRosterBook();
  const source = asObject(saved);
  if (!source) return book;
  book.knowledgeCap = ROSTER_KNOWLEDGE_CAP;
  book.rareCommanders = false;
  book.separateRebelPolity = false;
  book.grantsFire = false;
  book.firingSolution = false;
  book.pactInherit = false;
  book.discoveryOddsLocked = false;
  book.invasionOddsLocked = false;
  book.secretTablePresent = false;
  book.magnitudesLocked = false;
  book.PHASE10_ROSTER_LOCKED_FROM_REMASTERED = false;
  book.npcBindings = {};
  book.profiles = canonicalProfiles();
  book.packFactions = canonicalPacks();
  book.cultures = canonicalCultures();
  return book;
}

export function rosterUnlockMustNotGiftFire(inject = {}) {
  const row = asObject(inject) ? { ...inject } : {};
  delete row.firingSolution;
  delete row.engagement_authorized;
  delete row.cultureFire;
  delete row.culture;
  delete row.mapRevealed;
  delete row.playerFaction;
  delete row.playerSide;
  delete row.reman53;
  delete row.npcId;
  delete row.knowledgeCap;
  delete row.authorizedDeployment;
  for (const key of SECRET_TABLE_KEYS) delete row[key];
  return {
    row,
    firingSolutionPresent: false,
    engagementAuthorizedPresent: false,
    cultureFire: false,
    mapRevealed: false,
    rewritesPlayerFaction: false,
    knowledgeCap: ROSTER_KNOWLEDGE_CAP,
    pactInherit: false,
    grantsFire: false,
    npcBound: false,
  };
}

/**
 * Naming a path does not bind an npc, reveal a map, or change identity.
 * Ambient id reuse cannot steal a catalog row onto a newcomer.
 */
export function applyRosterUnlock(book, inject = {}) {
  const cleaned = rosterUnlockMustNotGiftFire(inject);
  const fresh = restoreFactionRosterBook(book);
  if (book && typeof book === 'object') {
    for (const key of Object.keys(book)) delete book[key];
    Object.assign(book, fresh);
  }
  return {
    ok: true,
    book: book && typeof book === 'object' ? book : fresh,
    npcBound: false,
    rowStolen: false,
    mapRevealed: false,
    rewritesPlayerFaction: false,
    grantsFire: false,
    firingSolution: false,
    engagementAuthorizedPresent: false,
    knowledgeCap: ROSTER_KNOWLEDGE_CAP,
    pactInherit: false,
    cleaned,
  };
}

export function factionRosterSnapshot(book = null, context = {}) {
  const store = restoreFactionRosterBook(book);
  const ctx = asObject(context) || {};
  const profiles = store.profiles;
  const packs = store.packFactions;
  const cultures = store.cultures;
  const named = profiles.filter((row) => row.coverage === 'named');
  const invented = [];
  for (const row of [...profiles, ...packs, ...cultures]) {
    if (classifyRosterKey(row.id) == null) invented.push(row.id);
    if (row.runtimeKey === 'rebel' || row.id === 'rebel' || row.id === 'thaleron') invented.push(row.id);
  }
  const dominion = asObject(ctx.dominionBook);
  const gornPool = ctx.gornPool;
  const borgAmbientIds = ctx.borgAmbientIds;
  const pirateHulls = ctx.pirateHulls;
  const protectFold = foldDoctrineResponse('protect');
  const campaignDiscoveryLocked = dominion ? dominion.discoveryOddsLocked === true : false;
  const campaignInvasionLocked = dominion ? dominion.invasionOddsLocked === true : false;
  const snap = {
    ok: true,
    missing: false,
    lockedFromRemastered: PHASE10_ROSTER_LOCKED_FROM_REMASTERED === true,
    profileCount: profiles.length,
    packFactionCount: packs.length,
    cultureCount: cultures.length,
    profileIds: profiles.map((row) => row.id),
    packFactionKeys: packs.map((row) => row.id),
    cultureIds: cultures.map((row) => row.id),
    namedIds: named.map((row) => row.id),
    stubProfileIds: profiles.filter((row) => row.coverage === 'stub').map((row) => row.id),
    pointerIds: profiles.filter((row) => row.coverage === 'subscribe-dominion-first').map((row) => row.id),
    inventedKeys: invented.filter((id, index, list) => list.indexOf(id) === index),
    namedClean: named.length === ROSTER_NAMED_IDS.length && named.every(rowClean),
    rowsClean: [...profiles, ...packs, ...cultures].every(rowClean),
    neutralAlliance: named.some((row) => row.id === 'neutral' && row.alliance === true),
    rareCommanders: store.rareCommanders === true || dominion?.rareCommanders === true,
    separateRebelPolity: store.separateRebelPolity === true || invented.includes('rebel'),
    grantsFire: store.grantsFire === true || profiles.some((row) => row.grantsFire === true) || cultures.some((row) => row.grantsFire === true),
    firingSolution: store.firingSolution === true || profiles.some((row) => row.firingSolution === true),
    knowledgeCap: store.knowledgeCap === ROSTER_KNOWLEDGE_CAP && named.every((row) => row.knowledgeCap === ROSTER_KNOWLEDGE_CAP)
      ? ROSTER_KNOWLEDGE_CAP
      : (store.knowledgeCap || 'raised'),
    pactInherit: store.pactInherit === true || profiles.some((row) => row.pactInherit === true),
    discoveryOddsLocked: campaignDiscoveryLocked || DISCOVERY_ODDS_LOCKED === true || store.discoveryOddsLocked === true,
    invasionOddsLocked: campaignInvasionLocked || INVASION_ODDS_LOCKED === true || store.invasionOddsLocked === true,
    secretTablePresent: secretTablePresent(store) || secretTablePresent(ctx.inject),
    flagShareGrantsControl: flagShareGrantsSystemControl() === true,
    cultureGrantsFire: cultureGrantsFirePermission() === true,
    rewritesPlayerFaction: false,
    mapRevealed: profiles.some((row) => row.mapRevealed === true),
    npcBindings: {},
    rowStolen: false,
    roeModes: ROE_MODES.slice(),
    protectAll: ctx.protectAll === true || offersProtectAll(null) === true,
    protectApplied: protectFold.appliedResponse,
    mayAutoEngageFromRoster: false,
    mayAutoEngage: ctx.mayAutoEngage === true,
    breenDominionStripped: breenDominionStripped(ctx),
    ordinaryCaptainKnowsPact: ordinaryPact(ctx) === true,
    playerFaction: ctx.playerFaction ?? null,
    playerSide: ctx.playerSide ?? null,
    reman53: ctx.reman53 && typeof ctx.reman53 === 'object' ? { id: ctx.reman53.id, key: ctx.reman53.key } : null,
    dominicaSayable: ctx.dominicaSayable === true,
    startKeys: Array.isArray(ctx.startKeys) ? ctx.startKeys.slice() : ROSTER_START_KEYS.slice(),
    terranLabel: ctx.terranLabel || null,
    dominion: {
      scope: dominion && typeof dominion.scope === 'string' ? dominion.scope : null,
      rosterPlayableFerengi: dominion?.rosterPlayable?.ferengi === true,
      rosterPlayableIndependent: dominion?.rosterPlayable?.independent === true,
      rosterPlayableVulcan: dominion?.rosterPlayable?.vulcan === true,
      rareCommanders: dominion?.rareCommanders === true,
      bookForked: bookForked(store),
    },
    stubs: {
      gornPoolEmpty: Array.isArray(gornPool) && gornPool.length === 0,
      borgAmbient: Array.isArray(borgAmbientIds) && borgAmbientIds.length > 0,
      pirateMinted: (Array.isArray(pirateHulls) && pirateHulls.length > 0) || Number(ctx.pirateFactionHulls) > 0,
    },
    engagementAuthorizedPresent: false,
  };
  delete snap.engagement_authorized;
  return snap;
}
