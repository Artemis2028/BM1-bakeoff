#!/usr/bin/env node
/**
 * Offline S34 world cargo delivery.
 * Written from docs/world-cargo-delivery/ plus the room resolution:
 * a cloaked drop of an open contract, and any failed attempt, keeps the pods
 * aboard and leaves status open. Does not crib remastered-work.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROE_MODES, offersProtectAll } from '../src/phase2-security.js';
import { creditWorthwhileTrip, createMarketBook } from '../src/phase8-markets.js';
import { resolveTierSlack } from '../src/phase5-objectives.js';
import { collectLeakedNames } from '../src/phase10-discovery.js';
import { PHASE10_ROSTER_LOCKED_FROM_REMASTERED } from '../src/phase10-roster.js';
import { BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED } from '../src/bajoran-solar-sailor.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED } from '../src/phase10-magnitudes.js';
import { UTILITY_LOCKED_FROM_REMASTERED } from '../src/utility-inventory.js';
import { LEDGER_LOCKED_FROM_REMASTERED } from '../src/weapon-source-ledger.js';
import { EMPTY_ARMABLE_LOCKED_FROM_REMASTERED } from '../src/empty-armable.js';
import { CONSTRUCTION_LOCKED_FROM_REMASTERED } from '../src/construction-visuals.js';
import { HTML_CATALOG_LOCKED_FROM_REMASTERED } from './build-html-catalogs.mjs';
import { ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED } from '../src/economy-difficulty.js';
import { STANDING_TIERS_LOCKED_FROM_REMASTERED } from '../src/standing-tiers.js';
import { DOCK_CLEAR_LOCKED_FROM_REMASTERED } from '../src/dock-clear.js';
import { ALERTS_ACTIVE_LOCKED_FROM_REMASTERED } from '../src/alerts-active.js';
import { AWAY_TEAM_XP_LOCKED_FROM_REMASTERED } from '../src/away-team-xp.js';
import { BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED } from '../src/briefing-archive.js';
import {
  OPEN_CLOAK_FAIL_COPY,
  WORLD_CARGO_LOCKED_FROM_REMASTERED,
  bookOwnsContractId,
  completeWorldCargo,
  dropWorldCargo,
  emptyWorldCargoBook,
  enrollWorldCargoContract,
  evaluateWorldService,
  expireDueContracts,
  noteHailNotWorld,
  noteStationNotWorld,
  noteSuspicion,
  noteWarpNotWorld,
  requireWorldCargoHelpers,
  restoreWorldCargoBook,
  serializeWorldCargoBook,
} from '../src/world-cargo-delivery.js';

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

const src = fs.readFileSync(path.join(root, 'src/world-cargo-delivery.js'), 'utf8');
const srcMain = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
const srcHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const srcProbe = fs.readFileSync(path.join(root, 'scripts/behavior-probe.mjs'), 'utf8');

requireWorldCargoHelpers();

assert('s34.lock-false', WORLD_CARGO_LOCKED_FROM_REMASTERED === false);
assert('s34.locks-stay-false', [
  MAGNITUDES_LOCKED_FROM_REMASTERED,
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
  BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED,
  BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED,
].every((flag) => flag === false));
assert('s34.no-standing-call', !src.includes('adjustFactionStanding'));
assert('s34.no-authority-writes', !src.includes('injectDiscovery')
  && !src.includes('injectKnowledge')
  && !src.includes('grantAssignmentKnowledge')
  && !src.includes('protect-all')
  && !src.includes('asset_overdue')
  && !src.includes('performance.now')
  && !src.includes('compliance_verified')
  && !src.includes('access_clearance')
  && !src.includes('inspection_order_active'));
assert('s34.save-slots', srcMain.includes('const SAVE_SLOT_COUNT = 3'));
assert('s34.host', srcHtml.includes('id="world-cargo"')
  && srcHtml.includes('world-cargo-contracts')
  && srcHtml.includes('world-cargo-outcome'));
assert('s34.probe-wired', srcMain.includes('worldCargo: createWorldCargoProbeApi()')
  && srcProbe.includes('runWorldCargo'));
assert('s34.roe', ROE_MODES.length === 2
  && ROE_MODES.includes('return-fire')
  && ROE_MODES.includes('defend')
  && !ROE_MODES.includes('protect-all')
  && offersProtectAll() === false);
assert('s34.slack', resolveTierSlack('standard') === 2);

const facts = {
  inspection_order_active: true,
  compliance_verified: false,
  access_clearance: false,
};
const authority = {
  firingSolution: false,
  engagement_authorized: false,
  pursuit: false,
};
const discovery = { known: {} };

function pod(id, good, tons, targetIndex, payout) {
  return {
    tons,
    item: good,
    destination: 'World A',
    destinationIndex: targetIndex,
    contractId: id,
    payout,
  };
}

function ctx(extra = {}) {
  return {
    currentPlanet: 3,
    ship: { x: 10, y: 10 },
    planet: { x: 12, y: 10 },
    dockDistance: 126,
    docked: false,
    dockedPlanetIndex: null,
    dockedStationId: null,
    cloaked: false,
    silentRunning: true,
    pods: [],
    strategicJumps: 0,
    checkpointRefused: false,
    encounterFacts: facts,
    ...authority,
    ...extra,
  };
}

function bookWith(input) {
  const book = emptyWorldCargoBook();
  enrollWorldCargoContract(book, input);
  return book;
}

function applyTrip(result, standings, faction = 'ferengi') {
  if (!result?.requestTrip) return 0;
  let delta = 0;
  const market = result.market || createMarketBook();
  result.market = market;
  for (const trip of result.trips || []) {
    creditWorthwhileTrip(market, trip.token, () => {
      standings[faction] = (standings[faction] || 0) + 3;
      delta += 3;
    });
  }
  return delta;
}

const openInput = {
  id: 'open-a',
  mode: 'open',
  good: 'Grain',
  tons: 4,
  legalPayout: 40,
  covertReward: 99,
  originIndex: 1,
  targetIndex: 3,
  targetName: 'World A',
  contraband: true,
  acceptedAtStrategicJumps: 0,
};

const stationBook = bookWith(openInput);
const stationPods = [pod('open-a', 'Grain', 4, 3, 40)];
const stationed = noteStationNotWorld(stationBook, ctx({
  pods: stationPods,
  docked: true,
  dockedStationId: 'sta-1',
  stationId: 'sta-1',
  dockedPlanetIndex: null,
}));
assert('s34.1-station', stationed.reason === 'station-not-world'
  && stationed.latinumDelta === 0
  && stationed.standingDelta === 0
  && stationBook.contracts['open-a'].status === 'open'
  && stationPods[0].tons === 4
  && stationPods[0].contractId === 'open-a');

const hailed = noteHailNotWorld(stationBook, ctx({ pods: stationPods, stationId: 'hail-1' }));
assert('s34.1-hail', hailed.reason === 'hail-not-world'
  && hailed.latinumDelta === 0
  && stationBook.contracts['open-a'].status === 'open'
  && stationPods[0].tons === 4);

const outside = completeWorldCargo(stationBook, ctx({
  pods: stationPods,
  ship: { x: 500, y: 500 },
  docked: true,
  dockedPlanetIndex: 3,
}));
assert('s34.1-outside', outside.reason === 'outside-radius'
  && outside.latinumDelta === 0
  && stationBook.contracts['open-a'].status === 'open'
  && stationPods[0].tons === 4);

const warped = noteWarpNotWorld(stationBook, ctx({ pods: stationPods, currentPlanet: 3 }));
assert('s34.1-warp', warped.reason === 'warp-not-world'
  && warped.latinumDelta === 0
  && stationBook.contracts['open-a'].status === 'open'
  && stationPods[0].tons === 4
  && bookOwnsContractId(stationBook, 'open-a'));

const standings = { ferengi: 0 };
const delivered = completeWorldCargo(stationBook, ctx({
  pods: stationPods,
  docked: true,
  dockedPlanetIndex: 3,
}));
const standingDelta = applyTrip(delivered, standings);
assert('s34.1-world', delivered.result === 'delivered'
  && delivered.atWorld === true
  && delivered.latinumDelta === 40
  && delivered.legalPayoutDelta === 40
  && delivered.covertRewardDelta === 0
  && delivered.countedAsLegal === true
  && delivered.requestTrip === true
  && delivered.tripToken === 'world-cargo:open-a'
  && standingDelta === 3
  && standings.ferengi === 3
  && stationBook.contracts['open-a'].status === 'delivered'
  && stationBook.contracts['open-a'].mode === 'open'
  && stationBook.contracts['open-a'].covertReward === 0
  && stationBook.contracts['open-a'].completionToken === 'world-cargo:open-a'
  && stationPods[0].tons === 0
  && stationBook.contracts['open-a'].contraband === true
  && JSON.stringify(facts) === JSON.stringify({
    inspection_order_active: true,
    compliance_verified: false,
    access_clearance: false,
  }));

const again = completeWorldCargo(stationBook, ctx({
  pods: stationPods,
  docked: true,
  dockedPlanetIndex: 3,
  contractId: 'open-a',
}));
const againStanding = applyTrip(again, standings);
assert('s34.6-redock-session', again.latinumDelta === 0
  && again.requestTrip === false
  && againStanding === 0
  && standings.ferengi === 3);

const saved = serializeWorldCargoBook(stationBook);
const loaded = restoreWorldCargoBook(saved);
const reloadedPods = [pod('open-a', 'Grain', 4, 3, 40)];
const reloaded = completeWorldCargo(loaded, ctx({
  pods: reloadedPods,
  docked: true,
  dockedPlanetIndex: 3,
  contractId: 'open-a',
}));
assert('s34.6-reload', loaded.contracts['open-a'].completionToken === 'world-cargo:open-a'
  && reloaded.latinumDelta === 0
  && reloaded.requestTrip === false
  && reloadedPods[0].tons === 4);

const cloakBook = bookWith(openInput);
const cloakPods = [pod('open-a', 'Grain', 4, 3, 40)];
const cloakDrop = dropWorldCargo(cloakBook, ctx({
  pods: cloakPods,
  cloaked: true,
  silentRunning: false,
  contractId: 'open-a',
}));
assert('s34.2-open-cloak', cloakDrop.reason === 'cloak-not-legal'
  && cloakDrop.result === 'failed'
  && cloakDrop.latinumDelta === 0
  && cloakDrop.legalPayoutDelta === 0
  && cloakDrop.requestTrip === false
  && cloakDrop.countedAsLegal === false
  && cloakDrop.outcome === OPEN_CLOAK_FAIL_COPY
  && cloakBook.contracts['open-a'].status === 'open'
  && cloakBook.contracts['open-a'].mode === 'open'
  && cloakBook.contracts['open-a'].completionToken == null
  && cloakPods[0].tons === 4
  && cloakPods[0].contractId === 'open-a'
  && cloakBook.inspectionCleared === false
  && cloakBook.customsCleared === false);

const covertBook = bookWith({
  id: 'covert-a',
  mode: 'covert',
  good: 'Spices',
  tons: 3,
  legalPayout: 80,
  covertReward: 17,
  targetIndex: 3,
  targetName: 'World A',
  contraband: true,
  acceptedAtStrategicJumps: 0,
});
const covertPods = [pod('covert-a', 'Spices', 3, 3, 80)];
const covertFacts = { ...facts };
const covertDrop = dropWorldCargo(covertBook, ctx({
  pods: covertPods,
  cloaked: true,
  encounterFacts: covertFacts,
  contractId: 'covert-a',
}));
const covertStanding = { ferengi: 5 };
const covertMoved = applyTrip(covertDrop, covertStanding);
assert('s34.2-covert', covertDrop.result === 'delivered'
  && covertDrop.latinumDelta === 17
  && covertDrop.covertRewardDelta === 17
  && covertDrop.legalPayoutDelta === 0
  && covertDrop.countedAsLegal === false
  && covertDrop.requestTrip === false
  && covertMoved === 0
  && covertStanding.ferengi === 5
  && covertBook.contracts['covert-a'].status === 'delivered'
  && covertBook.contracts['covert-a'].mode === 'covert'
  && covertBook.contracts['covert-a'].legalPayout === 0
  && covertPods[0].tons === 0
  && covertBook.contracts['covert-a'].contraband === true
  && covertBook.inspectionCleared === false
  && String(covertDrop.outcome).includes('Inspection not cleared')
  && JSON.stringify(covertFacts) === JSON.stringify(facts));

const bareBook = bookWith({
  id: 'covert-b',
  mode: 'covert',
  good: 'Spices',
  tons: 2,
  covertReward: 9,
  targetIndex: 3,
  targetName: 'World A',
  contraband: true,
});
const barePods = [pod('covert-b', 'Spices', 2, 3, 9)];
const bare = dropWorldCargo(bareBook, ctx({
  pods: barePods,
  cloaked: false,
  silentRunning: true,
  contractId: 'covert-b',
}));
assert('s34.3-uncloaked', bare.reason === 'uncloaked-not-covert'
  && bare.latinumDelta === 0
  && bare.requestTrip === false
  && bareBook.contracts['covert-b'].status === 'open'
  && barePods[0].tons === 2
  && bareBook.contracts['covert-b'].contraband === true);

const suspicion = noteSuspicion(cloakBook, {
  contractId: 'open-a',
  firingSolution: false,
  engagement_authorized: false,
  pursuit: false,
});
assert('s34.4-suspicion', suspicion.suspicionOnly === true
  && suspicion.firingSolution === false
  && suspicion.engagement_authorized === false
  && suspicion.pursuit === false
  && suspicion.standingDelta === 0
  && cloakBook.suspicion.length === 1
  && cloakBook.suspicion[0].suspicionOnly === true
  && !String(cloakBook.suspicion[0].text).toLowerCase().includes('authorized')
  && ROE_MODES.join(',') === 'return-fire,defend'
  && offersProtectAll() === false);

const partialBook = bookWith(openInput);
const partialPods = [pod('open-a', 'Grain', 1, 3, 40)];
const partial = completeWorldCargo(partialBook, ctx({
  pods: partialPods,
  docked: true,
  dockedPlanetIndex: 3,
  contractId: 'open-a',
}));
assert('s34.10-partial', partial.result === 'partial'
  && partial.reason === 'short-tons'
  && partial.latinumDelta === 0
  && partial.requestTrip === false
  && partialBook.contracts['open-a'].status === 'open'
  && partialBook.contracts['open-a'].completionToken == null
  && partialPods[0].tons === 1);

const expireBook = bookWith({ ...openInput, id: 'exp-a', deadlineSlack: 2, acceptedAtStrategicJumps: 0 });
const expirePods = [pod('exp-a', 'Grain', 4, 3, 40)];
const notYet = expireDueContracts(expireBook, { strategicJumps: 2, pods: expirePods });
const stillBound = expirePods[0].contractId === 'exp-a' && expirePods[0].payout === 40;
const expired = expireDueContracts(expireBook, { strategicJumps: 3, pods: expirePods });
const expiredAgain = expireDueContracts(expireBook, { strategicJumps: 6, pods: expirePods });
assert('s34.10-expire', notYet.expired.length === 0
  && stillBound
  && expired.expired.length === 1
  && expired.latinumDelta === 0
  && expired.assetOverdue === false
  && expireBook.contracts['exp-a'].status === 'expired'
  && expirePods[0].tons === 4
  && expirePods[0].payout === 0
  && expirePods[0].contractId == null
  && expirePods[0].destination == null
  && expiredAgain.expired.length === 0);

const checkpointBook = bookWith(openInput);
const checkpointPods = [pod('open-a', 'Grain', 4, 3, 40)];
const refused = completeWorldCargo(checkpointBook, ctx({
  pods: checkpointPods,
  docked: false,
  checkpointRefused: true,
  contractId: 'open-a',
}));
assert('s34.checkpoint', refused.reason === 'checkpoint-refused'
  && refused.latinumDelta === 0
  && checkpointPods[0].tons === 4
  && checkpointBook.contracts['open-a'].status === 'open');

const empty = restoreWorldCargoBook(undefined);
assert('s34.6-empty', deliveriesPendingSafe(empty) === 0
  && Object.keys(empty.contracts).length === 0
  && empty.inspectionCleared === false
  && empty.customsCleared === false);
const ignored = restoreWorldCargoBook({
  openContracts: [{ id: 'legacy', status: 'open', legalPayout: 50, mode: 'open', tons: 2, good: 'Grain', targetIndex: 1 }],
});
assert('s34.6-no-rebuild', Object.keys(ignored.contracts).length === 0 && deliveriesPendingSafe(ignored) === 0);

const tampered = restoreWorldCargoBook({
  inspectionCleared: true,
  customsCleared: true,
  openContracts: [{ id: 'nope', mode: 'covert', legalPayout: 1, covertReward: 1 }],
  contracts: {
    openish: {
      id: 'openish',
      mode: 'covert',
      status: 'open',
      legalPayout: 80,
      covertReward: 0,
      good: 'Grain',
      tons: 1,
      targetIndex: 0,
      contraband: true,
    },
    bothOpen: {
      id: 'bothOpen',
      mode: 'open',
      status: 'open',
      legalPayout: 10,
      covertReward: 4,
      good: 'Grain',
      tons: 1,
      targetIndex: 0,
    },
    bothCovert: {
      id: 'bothCovert',
      mode: 'covert',
      status: 'delivered',
      legalPayout: 10,
      covertReward: 4,
      good: 'Grain',
      tons: 1,
      targetIndex: 0,
      completionToken: 'world-cargo:bothCovert',
    },
  },
});
assert('s34.tamper-open', tampered.inspectionCleared === false
  && tampered.customsCleared === false
  && tampered.contracts.openish.mode === 'open'
  && tampered.contracts.openish.legalPayout === 80
  && tampered.contracts.openish.covertReward === 0
  && tampered.contracts.openish.contraband === true
  && !tampered.contracts.nope);
assert('s34.tamper-both', tampered.contracts.bothOpen.mode === 'open'
  && tampered.contracts.bothOpen.legalPayout === 10
  && tampered.contracts.bothOpen.covertReward === 0
  && tampered.contracts.bothCovert.mode === 'covert'
  && tampered.contracts.bothCovert.legalPayout === 0
  && tampered.contracts.bothCovert.covertReward === 4);

const evaluated = evaluateWorldService(stationBook, ctx({
  contractId: 'open-a',
  action: 'planet-dock',
  docked: true,
  dockedPlanetIndex: 3,
  cloaked: false,
  pods: [pod('open-a', 'Grain', 4, 3, 40)],
}));
assert('s34.evaluate', evaluated.atWorld === false || stationBook.contracts['open-a'].status === 'delivered');

const fresh = bookWith(openInput);
const atWorld = evaluateWorldService(fresh, ctx({
  contractId: 'open-a',
  action: 'planet-dock',
  docked: true,
  dockedPlanetIndex: 3,
  cloaked: false,
  pods: [pod('open-a', 'Grain', 4, 3, 40)],
}));
assert('s34.evaluate-at-world', atWorld.atWorld === true);

const leaked = collectLeakedNames([OPEN_CLOAK_FAIL_COPY, delivered.outcome, covertDrop.outcome], discovery, 'player');
assert('s34.5-no-leak', leaked.length === 0);
assert('s34.5-own-reward', delivered.latinumDelta === 40 && covertDrop.latinumDelta === 17);

const secondCovert = dropWorldCargo(covertBook, ctx({
  pods: [pod('covert-a', 'Spices', 3, 3, 80)],
  cloaked: true,
  contractId: 'covert-a',
}));
assert('s34.5-once', secondCovert.latinumDelta === 0 && secondCovert.requestTrip === false);

assert('s34.skip-wired', srcMain.includes('bookOwnsContractId(ensureWorldCargoBook(), contract.id)')
  && srcMain.includes('bookOwnsContractId(ensureWorldCargoBook(), pod.contractId)'));

function deliveriesPendingSafe(book) {
  return Object.values(book.contracts).filter((row) => row.status === 'open').length;
}

if (failed) {
  console.error(failures.join('\n'));
  console.error(`world cargo offline: ${passed} passed, ${failed} failed`);
  process.exit(1);
}
console.log(`world cargo offline: ${passed} passed, ${failed} failed`);
