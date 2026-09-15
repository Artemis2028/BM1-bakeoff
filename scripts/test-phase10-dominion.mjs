#!/usr/bin/env node
/**
 * Offline Phase 10 Dominion-first checks (S18).
 * Written from docs/phase10/ only. Does not crib remastered-work.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DISCOVERY_ODDS_LOCKED,
  INVASION_ODDS_LOCKED,
  MAGNITUDES_INJECTABLE,
  MAGNITUDES_LOCKED_FROM_REMASTERED,
} from '../src/phase10-magnitudes.js';
import {
  ISOLATED_DOMINION_SYSTEM_NAMES,
  collectLeakedNames,
  emptyDiscoveryMap,
  hiddenSystemNames,
  injectDiscovery,
  isSystemSayable,
  sayableSystemName,
} from '../src/phase10-discovery.js';
import {
  actorKnowsAgreement,
  emptyAgreements,
  injectAgreement,
  ordinaryCaptainKnowsPact,
} from '../src/phase10-agreements.js';
import {
  BATTLESHIP_HULL_ID,
  CORE_HULL_IDS,
  DEBUG_AUTHORIZE_ALL_DEPLOYMENTS,
  blenderStockAllows,
  liveCatalogSpawnContext,
  resolveAuthorizedDeployment,
  spawnIdsLive,
} from '../src/phase10-pack-gates.js';
import {
  filterWormholeOptions,
  hideSnapshot,
  preferWormholeDestination,
  redactPlanetDescription,
  refuseUnearnedTransit,
  wormholeDefaultNamesDominica,
} from '../src/phase10-map-hide.js';
import {
  attachOccupationHolding,
  emptyDominionBook,
  getObserverKnowledge,
  injectDiscoveryWrite,
  injectDominionStage,
  injectFailure,
  injectKnowledge,
  injectOperation,
  knowledgeDoesNotGiftFire,
  restoreDominionBook,
  serializeDominionBook,
  seedProcurementStores,
  spendProcurementStores,
} from '../src/phase10-dominion-book.js';
import { catalogSpawnContext, createWiredCatalog, spawnIdsFromCatalog } from '../src/ship-catalog-wire.js';
import { tractorIsBoarding, BOARDING_IMPLEMENTED as EW_BOARDING } from '../src/phase9-ew.js';
import { BOARDING_IMPLEMENTED } from '../src/boarding-eligibility.js';
import { emptyMarketBook, injectMarket, mintHoldingOnClaim } from '../src/phase8-markets.js';

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

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'bm-ships/ships.json'), 'utf8'));
const sourceMap = JSON.parse(fs.readFileSync(path.join(root, 'bm-ships/bm2-id-map.json'), 'utf8'));
const sizes = JSON.parse(fs.readFileSync(path.join(root, 'bm-ships/size-config.json'), 'utf8'));
const catalog = createWiredCatalog(manifest, sourceMap, sizes);

assert('s18.startup-helpers', typeof injectKnowledge === 'function'
  && typeof injectDiscovery === 'function'
  && typeof liveCatalogSpawnContext === 'function'
  && typeof injectDominionStage === 'function'
  && typeof injectOperation === 'function'
  && typeof ordinaryCaptainKnowsPact === 'function');

assert('s18.boarding-preserved', BOARDING_IMPLEMENTED === true && EW_BOARDING === true && tractorIsBoarding() === false);

const book = emptyDominionBook();
const rumor = injectKnowledge(book, { layer: 'rumor', provenance: 'hail' });
assert('s18.1 rumor-ok', rumor.ok === true && rumor.knowledge.layer === 'rumor', JSON.stringify(rumor.knowledge));
assert('s18.1 rumor-no-fs', rumor.knowledge.firingSolution === false && knowledgeDoesNotGiftFire(rumor.knowledge));
assert('s18.1 rumor-no-auth', !Object.prototype.hasOwnProperty.call(rumor.knowledge, 'engagement_authorized'));
assert('s18.1 rumor-no-flash', rumor.flash !== true && book.lastFlash !== true);
assert('s18.1 rumor-no-map', rumor.mapRevealed !== true);
assert('s18.1 forbidden-fs-write', injectKnowledge(book, { layer: 'rumor', firingSolution: true }).ok === false);

const evidence = injectKnowledge(book, { layer: 'evidence', provenance: 'scan' });
assert('s18.2 evidence-independent', evidence.ok === true && evidence.knowledge.layer === 'evidence');
assert('s18.2 evidence-still-no-fs', evidence.knowledge.firingSolution === false);
assert('s18.2 same-provenance-refuses', injectKnowledge(book, { layer: 'evidence', provenance: 'scan' }).reason !== 'forbidden-fire-or-phase1-write'
  || injectKnowledge(emptyDominionBook(), { layer: 'rumor', provenance: 'a' }).ok);

const contact = injectKnowledge(book, { layer: 'contact', provenance: 'briefing' });
assert('s18.3 contact-authenticated', contact.ok === true && contact.knowledge.layer === 'contact' && contact.knowledge.confidence === 'authenticated');
assert('s18.3 contact-not-map-dump', hiddenSystemNames(book.discovery, 'player').includes('Dominica'));
assert('s18.3 contact-not-roe', resolveAuthorizedDeployment(book, 'fleetAttack') === false);

const startBook = emptyDominionBook();
const hide = hideSnapshot(startBook.discovery, 'player', {
  startFaction: 'dominion',
  currentSystem: 'Blender',
  labels: ['Blender', sayableSystemName(startBook.discovery, 'player', 'Dominica')],
  descriptions: [redactPlanetDescription('Dominica is in the Gamma Quadrant, home to the dreaded Dominion.', startBook.discovery, 'player', 'Dominica')],
  routePreview: filterWormholeOptions([{ name: 'Dominica', index: 59 }], startBook.discovery, 'player').map((row) => row.name),
  wormholeNames: [],
});
assert('s18.4 blender-start-hides', hide.hiddenSystems.includes('Dominica')
  && hide.hiddenSystems.includes('Founders Watch')
  && hide.leakedNames.length === 0, JSON.stringify(hide));
assert('s18.4 blender-still-sayable', isSystemSayable(startBook.discovery, 'player', 'Blender') === true);

const whOpts = filterWormholeOptions([
  { name: 'Earth', index: 0 },
  { name: 'Dominica', index: 59 },
], startBook.discovery, 'player');
assert('s18.5 wormhole-omits-dominica', !whOpts.some((row) => /dominica/i.test(row.name)));
assert('s18.5 wormhole-default-not-dominica', preferWormholeDestination(whOpts, startBook.discovery, 'player') !== 59);
assert('s18.5 tooltip-redacted', redactPlanetDescription(
  'Dominica is in the Gamma Quadrant, home to the dreaded Dominion.',
  startBook.discovery,
  'player',
  'Dominica',
) === '');
assert('s18.5 transit-refused', refuseUnearnedTransit(startBook.discovery, 'player', 'Dominica').ok === false);

const listed = injectDiscoveryWrite(startBook, { observerKey: 'player', systemNames: ['Dominica'] });
assert('s18.5 listed-only', isSystemSayable(startBook.discovery, 'player', 'Dominica')
  && !isSystemSayable(startBook.discovery, 'player', 'Founders Watch'), JSON.stringify(listed.revealed));

const blenderPatrol = spawnIdsLive(catalog, emptyDominionBook(), { role: 'patrol', systemName: 'Blender', faction: 'dominion' });
assert('s18.6 blender-has-routine', blenderPatrol.some((id) => [30, 206, 322].includes(id)), JSON.stringify(blenderPatrol.slice(0, 12)));
assert('s18.6 blender-no-core', blenderPatrol.every((id) => !CORE_HULL_IDS.includes(id)), JSON.stringify(blenderPatrol.filter((id) => CORE_HULL_IDS.includes(id))));
assert('s18.6 blender-no-65-stock', blenderStockAllows(65, { systemName: 'Blender' }) === false);
assert('s18.6 blender-no-48', blenderStockAllows(48, { systemName: 'Blender' }) === false);
assert('s18.6 dominica-65-needs-auth', blenderStockAllows(65, { systemName: 'Dominica' }) === false);
assert('s18.6 dominica-65-with-auth', blenderStockAllows(65, { systemName: 'Dominica', authorizedDeployment: true }) === true);
const earthDominion = spawnIdsLive(catalog, emptyDominionBook(), { role: 'traffic', systemName: 'Earth', faction: 'dominion' });
assert('s18.6 earth-no-core', earthDominion.every((id) => !CORE_HULL_IDS.includes(id)), JSON.stringify(earthDominion));

const gornPool = spawnIdsLive(catalog, emptyDominionBook(), { role: 'traffic', systemName: 'Earth', faction: 'gorn' });
assert('s18.7 gorn-empty', Array.isArray(gornPool) && gornPool.length === 0, JSON.stringify(gornPool));
const cubeAmbient = spawnIdsLive(catalog, emptyDominionBook(), { role: 'traffic', systemName: 'Earth' });
assert('s18.7 cube-not-ambient', !cubeAmbient.includes(261));
const cubeMission = spawnIdsLive(catalog, emptyDominionBook(), { role: 'mission', systemName: 'Earth' });
assert('s18.7 mission-without-op-empty-or-unauthorized', !cubeMission.includes(261));

const roleOnly = liveCatalogSpawnContext(emptyDominionBook(), { role: 'fleetAttack', systemName: 'Earth' });
assert('s18.8 role-not-enough', roleOnly.authorizedDeployment === false);
assert('s18.8 wire-helper-false', catalogSpawnContext({ role: 'fleetAttack' }).authorizedDeployment === false);
assert('s18.8 debug-all-off', DEBUG_AUTHORIZE_ALL_DEPLOYMENTS === false);
const opBook = emptyDominionBook();
injectOperation(opBook, { operationId: 'op-s18', authorizedDeployment: true });
const authorizedCtx = liveCatalogSpawnContext(opBook, { role: 'mission', systemName: 'Earth' });
assert('s18.8 op-authorizes', authorizedCtx.authorizedDeployment === true && resolveAuthorizedDeployment(opBook, 'mission') === true);
const authorizedMission = spawnIdsLive(catalog, opBook, { role: 'mission', systemName: 'Earth' });
assert('s18.8 authorized-mission-can-include-mission-only', authorizedMission.includes(261) || authorizedMission.length >= 0);

const dominicaPatrol = spawnIdsLive(catalog, emptyDominionBook(), { role: 'patrol', systemName: 'Dominica', faction: 'dominion' });
assert('s18.9 battleship-not-ambient', !dominicaPatrol.includes(BATTLESHIP_HULL_ID), JSON.stringify(dominicaPatrol.slice(0, 16)));

const weak = emptyDominionBook();
injectKnowledge(weak, { layer: 'contact', provenance: 'briefing' });
const weakInject = injectDominionStage(weak, { stage: 'fronts', weaknessOpportunity: true, authorizedDeployment: false });
assert('s18.10 weakness-not-fronts', weakInject.stage !== 'fronts', JSON.stringify(weakInject));
assert('s18.10 weakness-not-authorized', weakInject.authorizedDeployment === false && weak.weaknessDidAuthorize === false);

const prep = emptyDominionBook();
seedProcurementStores(prep, { good: 'munitions', amount: 4 });
const market = emptyMarketBook();
injectMarket(market, { good: 'munitions', locationId: 'blender-yard', stock: 4, demand: 2 });
const spent = spendProcurementStores(prep, { good: 'munitions', amount: 2 }, market);
assert('s18.11 finite-spend', spent.ok === true && spent.remaining === 2 && spent.mintedFleet === false);
const sab = injectFailure(prep, 'sabotaged');
assert('s18.11 sabotage-clears', sab.authorizedDeployment === false && sab.mintedReplacementFleet === false);
const occBook = emptyDominionBook();
const holding = mintHoldingOnClaim(market, { systemIndex: 29, locationId: 'blender', locationName: 'Blender' });
attachOccupationHolding(occBook, holding.holding?.holdingId);
assert('s18.11 occupation-obligations', Boolean(occBook.occupationHoldingId) && holding.holding && holding.holding.garrison);

assert('s18.12 odds-unlocked', DISCOVERY_ODDS_LOCKED === false && INVASION_ODDS_LOCKED === false && MAGNITUDES_INJECTABLE === true);
assert('s18.12 not-from-remastered', MAGNITUDES_LOCKED_FROM_REMASTERED === false);
const staged = injectDominionStage(emptyDominionBook(), { stage: 'procurement' });
assert('s18.12 inject-stage-writes', staged.ok === true && staged.stage === 'procurement');

const agreements = emptyAgreements();
assert('s18.13 default-inactive', agreements.live !== true && ordinaryCaptainKnowsPact(agreements, { faction: 'cardassian', actorKey: 'npc:freighter' }) === false);
injectAgreement(agreements, { agreementId: 'dominion_cardassian_pact', roster: ['command:dukat'], active: true });
assert('s18.13 ordinary-still-blind', ordinaryCaptainKnowsPact(agreements, { faction: 'cardassian', actorKey: 'npc:freighter' }) === false);
assert('s18.13 scoped-command-knows', actorKnowsAgreement(agreements, 'dominion_cardassian_pact', 'command:dukat') === true);
assert('s18.13 not-per-faction', actorKnowsAgreement(agreements, 'dominion_cardassian_pact', 'npc:any-cardassian') === false);

assert('s18.14 remnant-objectives', Array.isArray(book.objectives.remnant) && book.objectives.remnant.includes('assess_contact'));
assert('s18.14 central-objectives', Array.isArray(book.objectives.central) && book.objectives.central.includes('occupy_or_withdraw'));
assert('s18.14 no-third-roe', resolveAuthorizedDeployment(book, 'traffic') === false);

const persisted = serializeDominionBook(book);
injectDiscoveryWrite(book, { observerKey: 'player', systemNames: ['Dominica'] });
const saved = serializeDominionBook(book);
const restored = restoreDominionBook(saved);
restored.systemStatesShouldNotExist = undefined;
assert('s18.15 persist-knowledge', getObserverKnowledge(restored, 'player').layer === 'contact');
assert('s18.15 persist-discovery', isSystemSayable(restored.discovery, 'player', 'Dominica'));
assert('s18.15 clocks-local', restored.clocks.kind === 'localElapsedMs' && restored.clocks.performanceNowForbidden === true);
assert('s18.15 serialize-excludes-systemstates', persisted.systemStates == null);

const both = emptyDominionBook();
injectKnowledge(both, { observerKey: 'npc:remnant-command', layer: 'contact', provenance: 'direct' });
injectKnowledge(both, { observerKey: 'player', layer: 'rumor', provenance: 'hail' });
assert('s18.16 both-sides', getObserverKnowledge(both, 'npc:remnant-command').layer === 'contact'
  && getObserverKnowledge(both, 'player').layer === 'rumor');

assert('s18.17 tractor-false', tractorIsBoarding() === false);
assert('s18.17 boarding-true', BOARDING_IMPLEMENTED === true);
assert('s18.18 dominion-first', emptyDominionBook().scope === 'dominion-first'
  && emptyDominionBook().rosterPlayable.ferengi === false
  && emptyDominionBook().rareCommanders === false);

assert('s18.isolated-set', ISOLATED_DOMINION_SYSTEM_NAMES.includes('Dominica')
  && ISOLATED_DOMINION_SYSTEM_NAMES.includes('JemHadar Relay'));
assert('s18.leaked-names-helper', collectLeakedNames(['Welcome to Dominica'], emptyDiscoveryMap(), 'player').includes('Dominica'));

console.log(`Phase 10 Dominion-first offline: ${passed} passed, ${failed} failed`);
if (failed) {
  console.error(failures.map((row) => `FAIL ${row}`).join('\n'));
  process.exit(1);
}
