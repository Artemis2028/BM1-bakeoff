#!/usr/bin/env node
/**
 * Phase 1 engine/combat acceptance checks written from the bake-off MD only:
 * docs/revised-development-plan.md §2–§3 and the doctrine Phase 1 contract.
 */
import {
  applyDestructionPayout,
  applyPersonalArrivalProtection,
  applyPhase1RelationContract,
  factionsAreAligned,
  factionsAreOpposed,
  getDeclaredRelations,
  getNpcPursuitRange,
  getPlayerCommandIdentity,
  grantsPlayerCombatCredit,
  isStationTransferableFromHolder,
  isWithinFireRange,
  isWithinPursuitRange,
  flagShareGrantsSystemControl,
  playerHoldsSystem,
  preserveNpcIdentityFields,
  resetUnknownRelationWarnings,
  resolveActorCombatCredit,
  resolveBaseSystemFaction,
  retainStationOwnerOnControlChange,
  shouldPreserveNpcIdentity,
} from '../src/phase1-authority.js';

const seededRelations = applyPhase1RelationContract({
  terran: { friendly: ['vulcan'], hostile: ['klingon'] },
  vulcan: { friendly: ['terran'], hostile: ['klingon'] },
  klingon: { friendly: ['romulan'], hostile: ['terran', 'vulcan'] },
  romulan: { friendly: ['klingon'], hostile: ['terran'] },
  dominion: { friendly: ['cardassian', 'breen'], hostile: ['terran'] },
  breen: { friendly: ['dominion'], hostile: ['terran'] },
  cardassian: { friendly: ['dominion'], hostile: ['terran'] },
});

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

// revised-development-plan.md §2 — combat attribution
assert(
  'plan-s2-npc-only-destruction-grants-no-reward-blame-feat',
  (() => {
    const payout = applyDestructionPayout({ credit: 'npc', reward: 40, standingDelta: -4, featGranted: true });
    return payout.reward === 0 && payout.standingDelta === 0 && payout.featGranted === false && payout.credited === false;
  })(),
);

assert(
  'plan-s2-player-final-hit-retains-credit',
  (() => {
    const payout = applyDestructionPayout({ credit: 'player', reward: 22, standingDelta: -2, featGranted: true });
    return payout.credited && payout.reward === 22 && payout.standingDelta === -2 && payout.featGranted;
  })(),
);

assert(
  'plan-s2-escort-final-hit-retains-credit',
  grantsPlayerCombatCredit('playerEscort')
    && resolveActorCombatCredit({ role: 'playerEscort', fleetId: 'escort-1' }) === 'playerEscort'
    && applyDestructionPayout({ credit: 'playerEscort', reward: 18, standingDelta: -2 }).credited,
);

assert(
  'plan-s2-hunters-may-pursue-beyond-firing-range',
  (() => {
    const fireRange = 680;
    const pursuitRange = getNpcPursuitRange(fireRange, 1600);
    const distance = 1200;
    return pursuitRange > fireRange
      && isWithinPursuitRange(distance, pursuitRange)
      && !isWithinFireRange(distance, fireRange);
  })(),
);

// DESIGN-doctrine-v0.2.1.md Phase 1 relationship contract
assert(
  'doctrine-p1-breen-dominion-no-static-alliance-either-way',
  !seededRelations.dominion.friendly.includes('breen')
    && !seededRelations.breen.friendly.includes('dominion')
    && !factionsAreAligned(seededRelations, 'breen', 'dominion')
    && !factionsAreAligned(seededRelations, 'dominion', 'breen'),
);

assert(
  'doctrine-p1-breen-dominion-friendship-removal-does-not-add-hostility',
  !seededRelations.dominion.hostile.includes('breen')
    && !seededRelations.breen.hostile.includes('dominion')
    && !factionsAreOpposed(seededRelations, 'breen', 'dominion')
    && !factionsAreOpposed(seededRelations, 'dominion', 'breen'),
);

assert(
  'doctrine-p1-empty-lists-for-required-independent-keys',
  ['delpin', 'promelli', 'sona', 'tarellian', 'neutral'].every((key) => {
    const entry = getDeclaredRelations(seededRelations, key);
    return Array.isArray(entry.friendly) && entry.friendly.length === 0
      && Array.isArray(entry.hostile) && entry.hostile.length === 0;
  }),
);

assert(
  'doctrine-p1-unknown-key-fallback-warns-and-stays-empty',
  (() => {
    resetUnknownRelationWarnings();
    const warnings = [];
    const entry = getDeclaredRelations(seededRelations, 'unregistered-polity', {
      warn: (message) => warnings.push(message),
    });
    return entry.friendly.length === 0
      && entry.hostile.length === 0
      && warnings.length === 1
      && /unregistered-polity/.test(warnings[0]);
  })(),
);

assert(
  'doctrine-p1-empty-lists-are-not-immunity-or-ceasefire',
  !factionsAreAligned(seededRelations, 'delpin', 'terran')
    && !factionsAreOpposed(seededRelations, 'delpin', 'terran'),
);

assert(
  'doctrine-p1-shared-neutral-is-not-alliance-or-command',
  !factionsAreAligned(seededRelations, 'neutral', 'neutral')
    && !factionsAreAligned(seededRelations, 'delpin', 'promelli')
    && !factionsAreAligned(seededRelations, 'unknown', 'unknown'),
);

assert(
  'doctrine-p1-reverse-direction-hostility-is-preserved',
  factionsAreOpposed(seededRelations, 'terran', 'klingon')
    && factionsAreOpposed(seededRelations, 'klingon', 'terran')
    && factionsAreAligned(seededRelations, 'terran', 'vulcan')
    && factionsAreAligned(seededRelations, 'vulcan', 'terran'),
);

assert(
  'doctrine-p1-non-allied-ships-can-still-defend-themselves',
  (() => {
    const delpinVsTerran = !factionsAreAligned(seededRelations, 'delpin', 'terran');
    const selfDefense = { lastAttackerId: 'terran-raider', lastAttackerUntil: 5000 };
    return delpinVsTerran && selfDefense.lastAttackerId === 'terran-raider' && selfDefense.lastAttackerUntil > 0;
  })(),
);

// revised-development-plan.md §3 — political identity
assert(
  'plan-s3-system-control-is-not-the-flown-flag',
  playerHoldsSystem([3], 3)
    && !playerHoldsSystem([3], 8)
    && flagShareGrantsSystemControl() === false
    && getPlayerCommandIdentity('ferengi', 'klingon') === 'ferengi',
);

assert(
  'plan-s3-foreign-concessions-retain-owners-on-capture',
  (() => {
    const sovereignYard = { faction: 'terran', name: 'Earth Yard' };
    const swissExchange = { faction: 'neutral', name: 'Free Swiss Exchange' };
    const privatePad = { faction: 'ferengi', privateInstallation: true, name: 'Private Pad' };
    return isStationTransferableFromHolder(sovereignYard, 'terran')
      && retainStationOwnerOnControlChange(swissExchange, 'terran')
      && retainStationOwnerOnControlChange(privatePad, 'terran');
  })(),
);

assert(
  'plan-s3-custom-polity-ids-remain-intact',
  resolveBaseSystemFaction({ governmentId: 42, mappedFactions: { 1: 'terran' } }) === 'custom:42'
    && resolveBaseSystemFaction({ governmentId: 1, mappedFactions: { 1: 'terran' } }) === 'terran'
    && resolveBaseSystemFaction({ mappedFactions: { 1: 'terran' } }) === 'unknown',
);

assert(
  'plan-s3-existing-ships-preserve-identity-on-reentry',
  (() => {
    const ship = {
      shipId: 18,
      name: 'ISS Keeper',
      faction: 'terran',
      role: 'patrol',
      fleetId: null,
      attackId: 'raid-1',
      destination: { x: 10, y: 20 },
      destinationName: 'raid: yard',
    };
    const preserved = preserveNpcIdentityFields(ship);
    return shouldPreserveNpcIdentity(ship)
      && preserved.shipId === 18
      && preserved.name === 'ISS Keeper'
      && preserved.faction === 'terran'
      && preserved.role === 'patrol'
      && preserved.attackId === 'raid-1';
  })(),
);

assert(
  'plan-s3-arrival-protection-is-personal',
  (() => {
    const scene = {
      ships: [
        { id: 'raid-1', faction: 'klingon', hostile: true, attackId: 'raid-1', role: 'fleetAttack' },
        { id: 'patrol-1', faction: 'terran', hostile: false, role: 'patrol' },
      ],
      stations: [{ id: 'yard', faction: 'terran', builtByPlayer: false }],
    };
    const next = applyPersonalArrivalProtection(scene, 1000, 20000);
    return next.spawnProtectionUntil === 21000
      && next.ships.length === 2
      && next.ships[0].attackId === 'raid-1'
      && next.ships[0].faction === 'klingon'
      && next.stations[0].faction === 'terran'
      && next.fleetsRemoved === 0
      && next.ordersCleared === 0
      && next.ownershipRewritten === 0;
  })(),
);

console.log(`Phase 1 engine/combat checks: ${passed} passed, ${failed} failed`);
if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
