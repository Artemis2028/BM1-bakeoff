#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applyPhase1Relations,
  attachActor,
  deriveLiveFireFacts,
  locationIdentity,
  runCase,
  selectedRole,
} from '../src/doctrine.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pack = JSON.parse(fs.readFileSync(path.join(root, 'docs/doctrine/bm1-faction-doctrine.v0.2.1.json'), 'utf8'));
const acceptance = JSON.parse(fs.readFileSync(path.join(root, 'docs/doctrine/doctrine-acceptance.json'), 'utf8'));

const engineRelations = {
  terran: { friendly: ['vulcan', 'andorian', 'bajoran'], hostile: ['dominion', 'cardassian', 'klingon', 'romulan', 'gorn', 'hirogen', 'suliban', 'borg'] },
  vulcan: { friendly: ['terran', 'andorian', 'bajoran'], hostile: ['dominion', 'cardassian', 'klingon', 'hirogen', 'borg'] },
  romulan: { friendly: ['klingon'], hostile: ['dominion', 'cardassian', 'terran', 'vulcan', 'andorian', 'borg'] },
  cardassian: { friendly: ['dominion'], hostile: ['terran', 'romulan', 'klingon', 'vulcan', 'andorian', 'bajoran', 'borg'] },
  klingon: { friendly: ['romulan'], hostile: ['dominion', 'cardassian', 'terran', 'vulcan', 'andorian', 'gorn', 'borg'] },
  dominion: { friendly: ['cardassian', 'breen'], hostile: ['terran', 'romulan', 'klingon', 'vulcan', 'ferengi', 'andorian', 'bajoran', 'hirogen', 'borg'] },
  breen: { friendly: ['dominion'], hostile: ['terran', 'romulan', 'klingon', 'vulcan', 'ferengi', 'andorian', 'borg'] },
  tholian: { friendly: [], hostile: ['dominion', 'cardassian', 'klingon', 'terran', 'pirate', 'gorn', 'suliban', 'borg'] },
  bajoran: { friendly: ['terran', 'vulcan', 'andorian'], hostile: ['dominion', 'cardassian', 'pirate', 'borg'] },
  ferengi: { friendly: [], hostile: ['dominion'] },
  andorian: { friendly: ['terran', 'vulcan'], hostile: ['dominion', 'cardassian', 'romulan', 'gorn', 'borg'] },
  gorn: { friendly: [], hostile: ['terran', 'andorian', 'klingon', 'borg'] },
  hirogen: { friendly: [], hostile: ['terran', 'dominion', 'vulcan', 'borg'] },
  suliban: { friendly: [], hostile: ['terran', 'tholian', 'borg'] },
  pirate: { friendly: [], hostile: ['terran', 'ferengi', 'vulcan', 'romulan', 'cardassian', 'klingon', 'dominion', 'tholian', 'andorian', 'gorn', 'hirogen', 'suliban'] },
  borg: { friendly: [], hostile: ['terran', 'ferengi', 'vulcan', 'romulan', 'cardassian', 'klingon', 'dominion', 'tholian', 'bajoran', 'breen', 'sona', 'delpin', 'tarellian', 'promelli', 'andorian', 'gorn', 'hirogen', 'suliban', 'neutral', 'pirate'] },
};

let failed = 0;
function check(id, actual, expected) {
  const ok = Object.is(actual, expected) || (typeof actual === typeof expected && JSON.stringify(actual) === JSON.stringify(expected));
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id}: ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`);
  if (!ok) failed += 1;
}

for (const testCase of acceptance.cases) {
  let actual;
  try {
    actual = runCase(pack, testCase);
  } catch (error) {
    actual = String(error.message || error);
  }
  check(testCase.id, actual, testCase.expected);
}

const applied = applyPhase1Relations(engineRelations, pack);
check('phase1-breen-drops-dominion-friendship', applied.breen.friendly.includes('dominion'), false);
check('phase1-dominion-drops-breen-friendship', applied.dominion.friendly.includes('breen'), false);
check('phase1-breen-not-made-hostile', applied.breen.hostile.includes('dominion'), false);
check('phase1-cardassian-dominion-untouched', applied.cardassian.friendly.includes('dominion'), true);
check('phase1-delpin-empty-friendly', applied.delpin.friendly.length, 0);
check('phase1-sona-empty-hostile', applied.sona.hostile.length, 0);
check('phase1-neutral-empty-lists', applied.neutral.friendly.length + applied.neutral.hostile.length, 0);

const escort = attachActor(pack, { role: 'playerEscort', faction: 'terran', fleetId: 'escort-1' }, { runtimeFaction: 'terran' });
check('adapter-preserves-native-playerEscort', escort.role, 'playerEscort');
check('adapter-maps-playerEscort-to-escort', escort.doctrineRole, 'escort');
check('adapter-keeps-fleetId', escort.fleetId, 'escort-1');

const occupier = attachActor(pack, { role: 'occupationFleet', faction: 'klingon' }, { runtimeFaction: 'klingon' });
check('adapter-occupationFleet-maps-to-occupier', occupier.doctrineRole, 'occupier');

check('rolemap-fleetAttack-is-raider', selectedRole(pack, pack.profiles.klingon, 'fleetAttack'), 'raider');
check('unsupported-vulcan-raider-denied', selectedRole(pack, pack.profiles.vulcan, 'raider'), 'deny_assignment');

const blender = locationIdentity(pack, {
  name: 'Blender',
  index: 29,
  governmentId: 13,
  controllerFaction: 'neutral',
});
check('identity-blender-locationId', blender.locationId, 'system:blender');
check('identity-blender-sovereign-unresolved', blender.sovereignId, null);
check('identity-blender-legacy-gov', blender.legacyGovernmentId, 13);
check('identity-blender-culture', blender.cultureId, 'blender_remnant');

const lysia = locationIdentity(pack, { name: 'Lysia', controllerFaction: 'neutral', governmentId: 10 });
check('identity-lysia-culture', lysia.cultureId, 'lysian');

const liveFacts = deriveLiveFireFacts({
  engagementObjectiveActive: true,
  attackOnSelf: true,
  pactBriefing: true,
  pactTask: true,
});
check('live-facts-include-self-defense', liveFacts.attack_on_self_verified, true);
check('live-facts-omit-pact-briefing', liveFacts.pact_briefing_received == null, true);
check('live-facts-omit-pact-task', liveFacts.pact_task_assigned == null, true);

console.log(`${acceptance.cases.length + 20 - failed}/${acceptance.cases.length + 20} doctrine runtime adapter checks passed.`);
process.exit(failed ? 1 : 0);
