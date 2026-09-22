#!/usr/bin/env node
/**
 * Offline Phase 10 full-roster probes (S31 family).
 * Written from docs/phase10-roster/ only. Does not crib remastered-work.
 * S18.18 stays unamended. Screenshot / no-clip N/A (no roster chrome).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createShipCatalog } from '../bm-ships/catalog.mjs';
import { ROE_MODES } from '../src/phase2-security.js';
import { emptyDominionBook, PHASE10_ROSTER } from '../src/phase10-dominion-book.js';
import { DISCOVERY_ODDS_LOCKED, INVASION_ODDS_LOCKED } from '../src/phase10-magnitudes.js';
import { tractorIsBoarding } from '../src/phase9-ew.js';
import { AWAY_TEAM_XP_LOCKED_FROM_REMASTERED, awayTeamXpSnapshot } from '../src/away-team-xp.js';
import { ALERTS_ACTIVE_LOCKED_FROM_REMASTERED } from '../src/alerts-active.js';
import { DOCK_CLEAR_LOCKED_FROM_REMASTERED } from '../src/dock-clear.js';
import { STANDING_TIERS_LOCKED_FROM_REMASTERED } from '../src/standing-tiers.js';
import { ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED } from '../src/economy-difficulty.js';
import { CONSTRUCTION_LOCKED_FROM_REMASTERED } from '../src/construction-visuals.js';
import { EMPTY_ARMABLE_LOCKED_FROM_REMASTERED } from '../src/empty-armable.js';
import { LEDGER_LOCKED_FROM_REMASTERED } from '../src/weapon-source-ledger.js';
import { UTILITY_LOCKED_FROM_REMASTERED } from '../src/utility-inventory.js';
import { HTML_CATALOG_LOCKED_FROM_REMASTERED } from './build-html-catalogs.mjs';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE94_LOCK } from '../src/phase94-magnitudes.js';
import {
  FACTION_ROSTER_BOOK_VERSION,
  FORBIDDEN_ROSTER_KEYS,
  PHASE10_ROSTER_LOCKED_FROM_REMASTERED,
  ROSTER_CULTURE_IDS,
  ROSTER_NAMED_IDS,
  ROSTER_PACK_FACTION_KEYS,
  ROSTER_POINTER_IDS,
  ROSTER_PROFILE_IDS,
  ROSTER_START_KEYS,
  ROSTER_STUB_PROFILE_IDS,
  applyRosterUnlock,
  classifyRosterKey,
  emptyFactionRosterBook,
  factionRosterSnapshot,
  requirePhase10RosterHelpers,
  restoreFactionRosterBook,
  rosterUnlockMustNotGiftFire,
  serializeFactionRosterBook,
} from '../src/phase10-roster.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let passed = 0;
let failed = 0;
const failures = [];

function assert(id, condition, detail = '') {
  if (condition) {
    passed += 1;
    return;
  }
  failed += 1;
  failures.push(`${id}${detail ? `: ${detail}` : ''}`);
}

function sameSet(left, right) {
  if (left.length !== right.length) return false;
  const bag = new Set(right);
  return left.every((id) => bag.has(id));
}

const srcRoster = fs.readFileSync(path.join(root, 'src/phase10-roster.js'), 'utf8');
const srcMain = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
const srcDominion = fs.readFileSync(path.join(root, 'src/phase10-dominion-book.js'), 'utf8');
const srcPhase10Test = fs.readFileSync(path.join(root, 'scripts/test-phase10-dominion.mjs'), 'utf8');
const srcProbe = fs.readFileSync(path.join(root, 'scripts/behavior-probe.mjs'), 'utf8');
const srcCatalog = fs.readFileSync(path.join(root, 'bm-ships/catalog.mjs'), 'utf8');
const doctrine = JSON.parse(fs.readFileSync(path.join(root, 'docs/doctrine/bm1-faction-doctrine.v0.2.1.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'bm-ships/ships.json'), 'utf8'));

assert('s31.startup-helpers', typeof emptyFactionRosterBook === 'function'
  && typeof factionRosterSnapshot === 'function'
  && typeof applyRosterUnlock === 'function'
  && typeof classifyRosterKey === 'function'
  && typeof requirePhase10RosterHelpers === 'function');
requirePhase10RosterHelpers();
assert('s31.startup-require', true);

assert('s31.8 lock-constant', PHASE10_ROSTER_LOCKED_FROM_REMASTERED === false
  && FACTION_ROSTER_BOOK_VERSION === 1
  && DISCOVERY_ODDS_LOCKED === false
  && INVASION_ODDS_LOCKED === false);

const doctrineProfiles = Object.keys(doctrine.profiles);
const doctrineCultures = Object.keys(doctrine.cultures);
assert('s31.1 profile-set', doctrineProfiles.length === 22
  && sameSet(doctrineProfiles, ROSTER_PROFILE_IDS)
  && new Set(ROSTER_PROFILE_IDS).size === 22, JSON.stringify(doctrineProfiles));
assert('s31.1 culture-set', doctrineCultures.length === 9
  && sameSet(doctrineCultures, ROSTER_CULTURE_IDS), JSON.stringify(doctrineCultures));

const livePack = [...new Set(manifest.ships.filter((ship) => ship.rosterState === 'active').map((ship) => ship.faction))].sort();
assert('s31.1 pack-set', livePack.length === 20
  && sameSet(livePack, [...ROSTER_PACK_FACTION_KEYS].sort()), JSON.stringify(livePack));
assert('s31.1 no-pirate-pack', !livePack.includes('pirate'));
assert('s31.1 named-seventeen', ROSTER_NAMED_IDS.length === 17
  && ROSTER_STUB_PROFILE_IDS.length === 3
  && ROSTER_POINTER_IDS.length === 2
  && ROSTER_START_KEYS.length === 9);

for (const id of ROSTER_NAMED_IDS) assert(`s31.1 named-${id}`, classifyRosterKey(id) === 'named');
for (const id of ROSTER_STUB_PROFILE_IDS) assert(`s31.1 stub-${id}`, classifyRosterKey(id) === 'stub');
for (const id of ROSTER_POINTER_IDS) assert(`s31.1 pointer-${id}`, classifyRosterKey(id) === 'subscribe-dominion-first');
for (const id of ROSTER_CULTURE_IDS) assert(`s31.1 culture-${id}`, classifyRosterKey(id) === 'stub');
assert('s31.1 pack-dominion-pointer', classifyRosterKey('dominion') === 'subscribe-dominion-first');
for (const id of FORBIDDEN_ROSTER_KEYS) assert(`s31.1 forbidden-${id}`, classifyRosterKey(id) == null);
assert('s31.1 unknown-fail-closed', classifyRosterKey('qonos') == null && classifyRosterKey('qonos') !== 'named');

const catalog = createShipCatalog(manifest, { sourceToRemaster: {} }, { classScales: {} });
const gornPool = catalog.spawnPool({ role: 'traffic', systemName: 'Earth', authorizedDeployment: false }, 'gorn').map((ship) => ship.id);
const borgAmbient = catalog.spawnPool({ role: 'traffic', systemName: 'Earth', authorizedDeployment: false }, 'borg').map((ship) => ship.id);
const pirateHulls = catalog.spawnPool({ role: 'traffic', systemName: 'Earth' }, 'pirate').map((ship) => ship.id);
const pirateFactionHulls = manifest.ships.filter((ship) => ship.rosterState === 'active' && ship.faction === 'pirate').length;

const dominion = emptyDominionBook();
const snap = factionRosterSnapshot(emptyFactionRosterBook(), {
  dominionBook: dominion,
  gornPool,
  borgAmbientIds: borgAmbient,
  pirateHulls,
  pirateFactionHulls,
  playerFaction: 'ferengi',
  playerSide: 'ferengi',
  reman53: { id: 53, key: 'bm-ship:53' },
  dominionFriendly: [],
  breenFriendly: [],
  mayAutoEngage: false,
  protectAll: false,
  dominicaSayable: false,
  startKeys: ROSTER_START_KEYS,
  terranLabel: 'Terran Rebel',
});

assert('s31.1 counts', snap.profileCount === 22
  && snap.packFactionCount === 20
  && snap.cultureCount === 9
  && snap.inventedKeys.length === 0
  && snap.namedIds.length === 17
  && snap.neutralAlliance === false
  && snap.namedClean === true
  && snap.rowsClean === true, JSON.stringify({
  profiles: snap.profileCount,
  packs: snap.packFactionCount,
  cultures: snap.cultureCount,
  invented: snap.inventedKeys,
  named: snap.namedIds,
}));
assert('s31.1 neutral-not-alliance', snap.neutralAlliance === false && classifyRosterKey('neutral') === 'named');

assert('s31.2 no-fire', snap.grantsFire === false
  && snap.firingSolution === false
  && snap.engagementAuthorizedPresent === false
  && !Object.prototype.hasOwnProperty.call(snap, 'engagement_authorized')
  && snap.rewritesPlayerFaction === false
  && snap.knowledgeCap === 'none'
  && snap.cultureGrantsFire === false
  && snap.flagShareGrantsControl === false
  && snap.playerFaction === 'ferengi'
  && snap.reman53?.id === 53, JSON.stringify({
  grantsFire: snap.grantsFire,
  cap: snap.knowledgeCap,
  reman: snap.reman53,
}));

const gifted = applyRosterUnlock(emptyFactionRosterBook(), {
  npcId: 'ambient-1',
  profileId: 'ferengi',
  firingSolution: true,
  engagement_authorized: true,
  cultureFire: true,
  mapRevealed: true,
  playerFaction: 'klingon',
  knowledgeCap: 'contact',
  discoveryPercent: 12,
  authorizedDeployment: true,
});
assert('s31.2 unlock-strips', gifted.npcBound === false
  && gifted.rowStolen === false
  && gifted.grantsFire === false
  && gifted.engagementAuthorizedPresent === false
  && gifted.mapRevealed === false
  && gifted.rewritesPlayerFaction === false
  && gifted.knowledgeCap === 'none'
  && gifted.book.stage == null
  && gifted.book.authorizedDeployment == null
  && Object.keys(gifted.book.npcBindings || {}).length === 0);
const stripped = rosterUnlockMustNotGiftFire({
  firingSolution: true,
  engagement_authorized: true,
  cultureFire: true,
});
assert('s31.2 strip-helper', stripped.firingSolutionPresent === false
  && stripped.engagementAuthorizedPresent === false
  && stripped.cultureFire === false
  && stripped.row.engagement_authorized == null
  && stripped.row.firingSolution == null);

assert('s31.3 stubs', snap.stubs.gornPoolEmpty === true
  && snap.stubs.borgAmbient === false
  && snap.stubs.pirateMinted === false
  && snap.rareCommanders === false
  && gornPool.length === 0
  && borgAmbient.length === 0
  && pirateHulls.length === 0
  && pirateFactionHulls === 0, JSON.stringify(snap.stubs));

assert('s31.4 dominion-unamended', PHASE10_ROSTER === 'dominion-first'
  && dominion.scope === 'dominion-first'
  && dominion.rosterPlayable.independent === false
  && dominion.rosterPlayable.ferengi === false
  && dominion.rosterPlayable.vulcan === false
  && dominion.rareCommanders === false
  && snap.dominion.scope === 'dominion-first'
  && snap.dominion.rosterPlayableFerengi === false
  && snap.dominion.rosterPlayableIndependent === false
  && snap.dominion.rosterPlayableVulcan === false
  && snap.dominion.bookForked === false
  && snap.dominion.rareCommanders === false);
assert('s31.4 dominion-source', srcDominion.includes("export const PHASE10_ROSTER = 'dominion-first'")
  && srcDominion.includes('ferengi: false')
  && !srcDominion.includes('phase10-roster')
  && !srcDominion.includes('ferengi: true'));
assert('s31.4 s18.18-unamended', srcPhase10Test.includes("emptyDominionBook().scope === 'dominion-first'")
  && srcPhase10Test.includes('rosterPlayable.ferengi === false')
  && srcProbe.includes("s18.roster === 'dominion-first'"));
assert('s31.4 catalog-untouched', !srcCatalog.includes('phase10-roster'));

assert('s31.5 roe', Array.isArray(snap.roeModes)
  && snap.roeModes.length === 2
  && snap.roeModes.join(',') === ROE_MODES.join(',')
  && snap.protectAll === false
  && snap.protectApplied === 'record_only'
  && snap.mayAutoEngageFromRoster === false
  && !srcRoster.includes('protect-all'));

assert('s31.6 map-not-roster', snap.mapRevealed === false && snap.dominicaSayable === false);

assert('s31.7 compartment', snap.pactInherit === false
  && snap.ordinaryCaptainKnowsPact === false
  && snap.breenDominionStripped === true
  && classifyRosterKey('breen') === 'named'
  && classifyRosterKey('cardassian') === 'named');

const poisoned = serializeFactionRosterBook(emptyFactionRosterBook());
poisoned.stage = 'fronts';
poisoned.discovery = { Dominica: true };
poisoned.agreements = { live: true };
poisoned.authorizedDeployment = 'op-s31';
poisoned.npcBindings = { 'ambient-1': 'ferengi' };
poisoned.profiles = [{ id: 'rebel', coverage: 'named', grantsFire: true, engagement_authorized: true }];
poisoned.discoveryPercent = 12;
poisoned.PHASE10_ROSTER_LOCKED_FROM_REMASTERED = true;
poisoned.rareCommanders = true;
poisoned.separateRebelPolity = true;
const restored = restoreFactionRosterBook(poisoned);
const restoredSnap = factionRosterSnapshot(restored, {
  dominionBook: emptyDominionBook(),
  gornPool,
  borgAmbientIds: borgAmbient,
  pirateHulls,
});
assert('s31.8 restored-lock', restored.PHASE10_ROSTER_LOCKED_FROM_REMASTERED === false
  && restoredSnap.lockedFromRemastered === false
  && restoredSnap.discoveryOddsLocked === false
  && restoredSnap.invasionOddsLocked === false
  && restoredSnap.secretTablePresent === false
  && restored.discoveryPercent == null
  && restored.stage == null
  && restored.discovery == null
  && restored.agreements == null
  && restored.authorizedDeployment == null
  && restored.rareCommanders === false
  && restored.separateRebelPolity === false
  && Object.keys(restored.npcBindings).length === 0
  && !restored.profiles.some((row) => row.id === 'rebel')
  && !Object.prototype.hasOwnProperty.call(restoredSnap, 'engagement_authorized'));

const siblingLocks = [
  PHASE94_LOCK,
  UTILITY_LOCKED_FROM_REMASTERED,
  LEDGER_LOCKED_FROM_REMASTERED,
  EMPTY_ARMABLE_LOCKED_FROM_REMASTERED,
  CONSTRUCTION_LOCKED_FROM_REMASTERED,
  HTML_CATALOG_LOCKED_FROM_REMASTERED,
  ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED,
  STANDING_TIERS_LOCKED_FROM_REMASTERED,
  DOCK_CLEAR_LOCKED_FROM_REMASTERED,
  ALERTS_ACTIVE_LOCKED_FROM_REMASTERED,
  AWAY_TEAM_XP_LOCKED_FROM_REMASTERED,
  PHASE10_ROSTER_LOCKED_FROM_REMASTERED,
];
assert('s31.8 sibling-locks', siblingLocks.every((flag) => flag === false), JSON.stringify(siblingLocks));

const lockFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|mjs|md)$/.test(entry.name)) lockFiles.push(full);
  }
}
walk(path.join(root, 'src'));
walk(path.join(root, 'scripts'));
const flipped = [];
for (const file of lockFiles) {
  const text = fs.readFileSync(file, 'utf8');
  if (/export const [A-Z0-9_]*LOCKED_FROM_REMASTERED = true/.test(text)) flipped.push(path.relative(root, file));
}
assert('s31.8 no-flipped-lock', flipped.length === 0, flipped.join(','));

const roundTrip = serializeFactionRosterBook(restored);
assert('s31.9 sibling-shape', roundTrip.version === 1
  && roundTrip.profiles.length === 22
  && roundTrip.packFactions.length === 20
  && roundTrip.cultures.length === 9
  && roundTrip.npcBindings && Object.keys(roundTrip.npcBindings).length === 0
  && roundTrip.stage == null
  && srcMain.includes('factionRosterBook: serializeFactionRosterBook(ensureFactionRosterBook())')
  && srcMain.includes('state.factionRosterBook = restoreFactionRosterBook(s.factionRosterBook)')
  && srcMain.includes('phase10Roster: createPhase10RosterProbeApi()'));

assert('s31.10 landed-subscribers', awayTeamXpSnapshot().tracked === true
  && awayTeamXpSnapshot().rule === 'named_mix'
  && awayTeamXpSnapshot().tablePresent === false
  && tractorIsBoarding() === false
  && srcRoster.includes("from './phase2-security.js'")
  && !srcRoster.includes('injectKnowledge')
  && !srcRoster.includes('injectDiscovery')
  && !srcRoster.includes('resolveAuthorizedDeployment'));

assert('s31.11 shots-na', !srcMain.includes('data-phase10-roster')
  && !srcRoster.includes('rosterChrome')
  && !srcRoster.includes('Path catalogued'));

assert('s31.identity-starts', srcMain.includes("label: 'Terran Rebel'")
  && srcMain.includes('factionRosterBook: emptyFactionRosterBook()')
  && !srcMain.includes("faction: 'rebel'")
  && !srcRoster.includes("id: 'rebel'")
  && !srcRoster.includes("id: 'thaleron'"));

console.log(`Phase 10 roster offline: ${passed} passed, ${failed} failed`);
if (failed) {
  console.error(failures.map((row) => `FAIL ${row}`).join('\n'));
  process.exit(1);
}
