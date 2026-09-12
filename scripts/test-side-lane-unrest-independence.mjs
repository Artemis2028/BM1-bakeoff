#!/usr/bin/env node
/**
 * Offline S7.11–S7.23 checks for side-lane slice 2
 * (unrest / pressure + independence mint hooks).
 * Written from docs/side-lane-repair-reman-independence/ only.
 * Gates 1–2 (repairCapable, Reman) are not re-opened here.
 */
import {
  ASSET_OVERDUE_IMPLEMENTED,
  COMMERCE_FAILURE_CAUSES,
  CONTRACT_ROLE,
  CULTURE_CANNOT_GRANT_FIRE,
  FULL_CATALOG_WIRED,
  PHASE5_ASSET_OVERDUE,
  PLAYER_SECURITY_ROE_MODES,
  PRESSURE_SOURCES,
  RANDOM_FLIP_REFUSE,
  TEMPERAMENT_LABELS,
  TEMPERAMENT_PROFILE_MAP,
  accessIsPermissionNotCeasefire,
  advanceUnrestChain,
  applyRelationWrites,
  applyStationOwnershipPlan,
  authoredDefaultBirthTemperament,
  civiliansCoexist,
  countCivilianRoles,
  createTemperament,
  createUnrestIndependenceStore,
  cultureGrantsFirePermission,
  cultureIsNotEmpireOrUnlock,
  declareIndependence,
  failCivilianDelivery,
  flagShareGrantsSystemControl,
  injectCivilWarEvent,
  injectLoungeAndContract,
  injectUnrest,
  isUnrestEligible,
  mintBreakawaySideId,
  planStationOwnershipOnBreak,
  playerRoeModesUnchanged,
  raiseUnrestFromCommerceFailure,
  raiseUnrestFromPiratePresence,
  raiseUnrestFromRivalAgitation,
  raiseUnrestFromUnderdevelopment,
  raiseUnrestFromWarGoingBadly,
  relieveUnrest,
  rematchProfileId,
  restoreUnrestIndependence,
  serializeUnrestIndependence,
  snapshotIndependence,
  snapshotWorldUnrest,
  temperamentEquals,
  temperamentKey,
} from '../src/side-lane-unrest-independence.js';
import { playerHoldsSystem } from '../src/phase1-authority.js';

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

const parentRelations = {
  friendly: ['klingon', 'andorian'],
  hostile: ['terran', 'dominion'],
};

function mintFixture(store, extras = {}) {
  return declareIndependence(store, {
    systemIndex: extras.systemIndex ?? 11,
    parentSideId: extras.parentSideId || 'romulan',
    parentTemperament: extras.parentTemperament || { conflict: 'warlike', outsider: 'xenophobic' },
    parentProfileId: extras.parentProfileId || 'romulan',
    parentRelations: extras.parentRelations || parentRelations,
    worldCultureId: extras.worldCultureId ?? 'reman',
    flownFlag: extras.flownFlag || 'ferengi',
    origin: extras.origin || 'romulus',
    epoch: extras.epoch ?? 4,
    authoredInject: extras.authoredInject !== false,
    civilWar: extras.civilWar !== false,
    temperament: extras.temperament,
    profileId: extras.profileId,
    stations: extras.stations || [],
    controlledSystems: extras.controlledSystems || [],
    at: extras.at ?? 40,
  });
}

// --- S7.19 unrest threshold (named below/at; no invented number) ---
{
  const store = createUnrestIndependenceStore();
  const below = injectUnrest(store, 11, 'below');
  assert('s7.19-below-not-eligible', below.ok && below.unrest.eligible === false && below.unrest.level === 'below');
  const random = declareIndependence(store, {
    systemIndex: 11,
    parentSideId: 'romulan',
    authoredInject: false,
  });
  assert('s7.19-no-random-flip', random.ok === false && random.reason === RANDOM_FLIP_REFUSE);
  const at = injectUnrest(store, 11, 'at');
  assert('s7.19-at-is-eligible', at.ok && at.unrest.eligible === true && at.unrest.level === 'at');
  const minted = declareIndependence(store, {
    systemIndex: 11,
    parentSideId: 'romulan',
    parentTemperament: { conflict: 'warlike', outsider: 'xenophobic' },
    parentProfileId: 'romulan',
    parentRelations,
    worldCultureId: 'reman',
    flownFlag: 'ferengi',
    origin: 'romulus',
    epoch: 9,
    authoredInject: false,
    temperament: { conflict: 'peaceful', outsider: 'xenophilic' },
  });
  assert('s7.19-eligible-mints-new-side', minted.ok === true && minted.sideId !== 'romulan' && minted.sideId !== 'neutral');
  assert('s7.19-no-numeric-threshold-constant', !Object.values(store.worlds[11] || store.worlds['11'] || {}).includes(50));
  const above = injectUnrest(store, 12, 'above');
  assert('s7.19-above-is-eligible', above.unrest.eligible === true && above.unrest.level === 'above');
}

// --- S7.20 commerce failure raises unrest (pirate AND non-pirate) ---
{
  const store = createUnrestIndependenceStore();
  injectLoungeAndContract(store, 8);
  const pirate = failCivilianDelivery(store, 8, { cause: 'pirate' });
  assert('s7.20-pirate-commerce-raises', pirate.ok && pirate.raised && pirate.unrest.commerceFailed === true);
  const store2 = createUnrestIndependenceStore();
  injectUnrest(store2, 8, 'below');
  const blockade = raiseUnrestFromCommerceFailure(store2, 8, { cause: 'blockade' });
  assert('s7.20-non-pirate-blockade-raises', blockade.ok && blockade.raised && blockade.unrest.lastWrite.cause === 'blockade');
  const neglect = raiseUnrestFromCommerceFailure(createUnrestIndependenceStore(), 3, { cause: 'neglect' });
  const raid = raiseUnrestFromCommerceFailure(createUnrestIndependenceStore(), 3, { cause: 'playerRaid' });
  assert('s7.20-neglect-and-raid-are-causes', neglect.raised && raid.raised);
  assert(
    's7.20-piracy-is-not-only-cause',
    COMMERCE_FAILURE_CAUSES.includes('blockade')
      && COMMERCE_FAILURE_CAUSES.includes('neglect')
      && COMMERCE_FAILURE_CAUSES.includes('playerRaid')
      && COMMERCE_FAILURE_CAUSES.includes('pirate'),
  );
  assert('s7.20-not-phase5-asset-overdue', pirate.phase5AssetOverdue === false && ASSET_OVERDUE_IMPLEMENTED === false);
}

// --- S7.21 pirate presence raises unrest without owner rewrite ---
{
  const store = createUnrestIndependenceStore();
  const pirates = raiseUnrestFromPiratePresence(store, 5);
  assert('s7.21-pirate-presence-raises', pirates.ok && pirates.raised && pirates.unrest.piratePressure === true);
  assert('s7.21-no-owner-rewrite', pirates.ownersRewritten === false);
  assert('s7.21-no-culture-fire', pirates.cultureFireGranted === false && cultureGrantsFirePermission() === false);
}

// --- stackable pressure sources ---
{
  const store = createUnrestIndependenceStore();
  raiseUnrestFromWarGoingBadly(store, 2);
  raiseUnrestFromUnderdevelopment(store, 2);
  raiseUnrestFromRivalAgitation(store, 2, { agitator: 'klingon' });
  advanceUnrestChain(store, 2);
  const snap = snapshotWorldUnrest(store, 2);
  assert(
    's7.pressure-sources-stack',
    snap.stackedSources.includes('war_going_badly')
      && snap.stackedSources.includes('underdevelopment')
      && snap.stackedSources.includes('rival_agitation')
      && snap.stackedSources.includes('unrest_chain'),
  );
  assert(
    's7.pressure-source-list-matches-brief',
    PRESSURE_SOURCES.includes('war_going_badly')
      && PRESSURE_SOURCES.includes('commerce_starved')
      && PRESSURE_SOURCES.includes('underdevelopment')
      && PRESSURE_SOURCES.includes('unrest_chain')
      && PRESSURE_SOURCES.includes('rival_agitation')
      && PRESSURE_SOURCES.includes('pirate_presence'),
  );
}

// --- S7.22 lounge and contract coexist ---
{
  const store = createUnrestIndependenceStore();
  const fixture = injectLoungeAndContract(store, 4);
  assert('s7.22-inject-ok', fixture.ok === true && fixture.coexist === true);
  assert('s7.22-lounge-role', fixture.lounge.purpose === 'lounge' && fixture.lounge.role === 'localTraffic');
  assert('s7.22-contract-role', fixture.contract.purpose === 'contract' && fixture.contract.role === CONTRACT_ROLE);
  const counts = countCivilianRoles([], store.civilians['4']);
  assert('s7.22-counts-coexist', civiliansCoexist(counts));
  assert('s7.22-not-all-freighter', fixture.forcedAllFreighter === false);
  assert('s7.22-not-scenery-only', fixture.sceneryOnly === false);
  const ambientPlusContract = countCivilianRoles([
    { id: 'a', role: 'traffic' },
    { id: 'b', role: 'localTraffic' },
    { id: 'c', role: CONTRACT_ROLE, civilianPurpose: 'contract' },
  ]);
  assert('s7.22-ambient-lounge-still-counts', ambientPlusContract.lounge === 2 && ambientPlusContract.contract === 1);
}

// --- S7.23 relief lowers unrest without ending a written war ---
{
  const store = createUnrestIndependenceStore();
  injectUnrest(store, 11, 'at');
  const minted = mintFixture(store, { authoredInject: false, systemIndex: 11 });
  raiseUnrestFromPiratePresence(store, 11);
  const relief = relieveUnrest(store, 11, { action: 'clearPirates', sideId: minted.sideId });
  assert('s7.23-relief-lowers', relief.ok && relief.lowered && relief.unrest.piratePressure === false);
  assert('s7.23-does-not-erase-civil-war', relief.civilWarErased === false && relief.civilWarStillActive === true);
  assert('s7.23-no-player-roe-on-npc', relief.playerRoeInstalled === false);
  assert('s7.23-no-concession-retitle', relief.concessionsRetitled === false);
  const polity = store.polities[minted.sideId];
  assert('s7.23-hostility-still-written', polity.civilWarActive === true && polity.relations.hostile.includes('romulan'));
}

// --- S7.11 mint a new side ---
{
  const store = createUnrestIndependenceStore();
  const minted = mintFixture(store);
  assert('s7.11-ok', minted.ok === true);
  assert('s7.11-not-parent', minted.sideId !== 'romulan' && minted.sideId !== minted.parentSideId);
  assert('s7.11-not-neutral', minted.sideId !== 'neutral');
  assert('s7.11-not-flag', minted.sideId !== 'ferengi');
  assert('s7.11-not-culture', minted.sideId !== 'reman');
  assert('s7.11-breakaway-prefix', String(minted.sideId).startsWith('breakaway:'));
  assert(
    's7.11-mint-helper-format',
    mintBreakawaySideId({ origin: 'Romulus', epoch: 1 }) === 'breakaway:romulus:1',
  );
}

// --- S7.12 foreign concessions unchanged ---
{
  const stations = [
    { id: 'gov-1', faction: 'romulan' },
    { id: 'concession-1', faction: 'ferengi', privateInstallation: true, ownerKind: 'private' },
    { id: 'player-yard', faction: 'ferengi', builtByPlayer: true },
  ];
  const store = createUnrestIndependenceStore();
  const minted = mintFixture(store, { stations });
  const concession = minted.stationPlan.find((row) => row.id === 'concession-1');
  const gov = minted.stationPlan.find((row) => row.id === 'gov-1');
  assert('s7.12-concession-retained', concession.retain === true && concession.nextFaction === 'ferengi');
  assert('s7.12-player-cannot-command-concession', concession.privateInstallation === true && concession.transfer === false);
  assert('s7.12-holder-asset-may-transfer', gov.transfer === true && gov.nextFaction === minted.sideId);
  applyStationOwnershipPlan(stations, minted.stationPlan);
  assert('s7.12-live-concession-unchanged', stations[1].faction === 'ferengi');
  assert('s7.12-not-all-stations-retitled', stations[1].faction !== minted.sideId);
}

// --- S7.13 explicit doctrine/ROE inheritance; divergence expected ---
{
  const store = createUnrestIndependenceStore();
  const minted = mintFixture(store, {
    temperament: { conflict: 'peaceful', outsider: 'xenophilic' },
  });
  assert('s7.13-temperament-explicit', minted.temperament.written === true);
  assert('s7.13-temperament-labels', TEMPERAMENT_LABELS.every((label) => (
    minted.temperament.poles.includes(label) || ['warlike', 'xenophobic'].includes(label)
  )));
  assert('s7.13-diverges-from-parent', minted.inheritance.divergedFromParent === true);
  assert('s7.13-not-silent-clone', minted.inheritance.silentParentClone === false && minted.inheritance.explicit === true);
  assert('s7.13-profile-not-parent', minted.profileId !== 'romulan' && minted.profileId === TEMPERAMENT_PROFILE_MAP['peaceful+xenophilic']);
  assert('s7.13-no-player-roe-on-npc', minted.playerRoeInstalled === false && minted.playerSecurityRoe == null);
  assert('s7.13-engagement-from-assigned-only', Array.isArray(minted.engagementModes) && minted.engagementModes.length === 0);
  assert(
    's7.13-default-birth-diverges-when-unassigned',
    !temperamentEquals(
      authoredDefaultBirthTemperament({ conflict: 'peaceful', outsider: 'xenophilic' }),
      createTemperament({ conflict: 'peaceful', outsider: 'xenophilic' }),
    ),
  );
}

// --- S7.14 Phase 1 authority still holds ---
{
  const store = createUnrestIndependenceStore();
  const minted = mintFixture(store, { controlledSystems: [0] });
  assert('s7.14-flag-share-false', minted.control.flagShareGrantsControl === false && flagShareGrantsSystemControl() === false);
  assert('s7.14-player-hold-is-political', playerHoldsSystem([0], 0) === true && playerHoldsSystem([0], 11) === false);
  assert('s7.14-authority-is-new-side', minted.control.nextAuthoritySide === minted.sideId);
  const shifted = injectCivilWarEvent(store, minted.sideId, { conflict: 'warlike', outsider: 'xenophobic' });
  assert('s7.14-after-shift-flag-share-still-false', shifted.ok && flagShareGrantsSystemControl() === false);
}

// --- S7.15 parent lists are not cloned ---
{
  const store = createUnrestIndependenceStore();
  const minted = mintFixture(store);
  assert('s7.15-breakaway-no-parent-friends', minted.relations.friendly.length === 0);
  assert('s7.15-only-explicit-war-hostile', minted.relations.hostile.length === 1 && minted.relations.hostile[0] === 'romulan');
  assert('s7.15-parent-friends-not-copied', !minted.relations.friendly.includes('klingon') && !minted.relations.friendly.includes('andorian'));
  assert('s7.15-parent-other-enemies-not-copied', !minted.relations.hostile.includes('terran') && !minted.relations.hostile.includes('dominion'));
  const relations = applyRelationWrites({
    romulan: { friendly: ['klingon'], hostile: ['terran'] },
  }, minted.relationWrites);
  assert('s7.15-parent-gains-only-breakaway-hostile', relations.romulan.hostile.includes(minted.sideId) && relations.romulan.friendly.includes('klingon'));
  assert('s7.15-breakaway-empty-plus-war', relations[minted.sideId].friendly.length === 0 && relations[minted.sideId].hostile.includes('romulan'));
}

// --- S7.16 culture is not an empire / unlock / fire grant ---
{
  const store = createUnrestIndependenceStore();
  const minted = mintFixture(store, { worldCultureId: 'reman' });
  assert('s7.16-culture-retained-not-side', minted.cultureId === 'reman' && minted.sideId !== 'reman');
  assert('s7.16-culture-not-empire', cultureIsNotEmpireOrUnlock('reman', minted.sideId) === true);
  injectCivilWarEvent(store, minted.sideId, { conflict: 'warlike', outsider: 'xenophobic' });
  assert('s7.16-xenophobic-still-no-culture-fire', cultureGrantsFirePermission() === false);
  assert('s7.16-token', CULTURE_CANNOT_GRANT_FIRE === 'culture-cannot-grant-fire');
}

// --- S7.17 war-driven temperament may mutate doctrine/ROE ---
{
  const store = createUnrestIndependenceStore();
  const minted = mintFixture(store, { temperament: { conflict: 'peaceful', outsider: 'xenophilic' } });
  const birthProfile = minted.profileId;
  const shifted = injectCivilWarEvent(store, minted.sideId, { conflict: 'warlike', outsider: 'xenophobic' });
  assert('s7.17-temperament-changed', shifted.ok && temperamentKey(shifted.after.temperament) === 'warlike+xenophobic');
  assert('s7.17-profile-rematched', shifted.after.profileId === TEMPERAMENT_PROFILE_MAP['warlike+xenophobic']);
  assert('s7.17-profile-follows-map', rematchProfileId(shifted.after.temperament) !== birthProfile);
  assert('s7.17-no-engagement-authorized', shifted.engagementAuthorizedInjected === false);
  assert('s7.17-no-owner-rewrite', shifted.ownersRewritten === false);
  assert('s7.17-no-player-roe', shifted.playerRoeInstalled === false && playerRoeModesUnchanged(PLAYER_SECURITY_ROE_MODES));
  assert('s7.17-no-third-roe-mode', shifted.thirdRoeMode === false);
  assert('s7.17-access-not-ceasefire', accessIsPermissionNotCeasefire() === true);
  const warPressure = raiseUnrestFromWarGoingBadly(store, 11, {
    informTemperament: true,
    sideId: minted.sideId,
  });
  assert('s7.17-war-pressure-may-inform', warPressure.ok && warPressure.temperamentWrite?.ok === true);
}

// --- S7.18 not frozen at declaration ---
{
  const store = createUnrestIndependenceStore();
  const minted = mintFixture(store, { temperament: { conflict: 'peaceful', outsider: 'xenophilic' } });
  const snapshot = { temperament: temperamentKey(minted.temperament), profileId: minted.profileId, sideId: minted.sideId };
  const shifted = injectCivilWarEvent(store, minted.sideId, { conflict: 'warlike', outsider: 'xenophilic' });
  assert('s7.18-temperament-may-differ-from-birth', temperamentKey(shifted.after.temperament) !== snapshot.temperament);
  assert('s7.18-profile-may-differ-from-birth', shifted.after.profileId !== snapshot.profileId);
  assert('s7.18-same-side-id', store.polities[snapshot.sideId].sideId === snapshot.sideId);
}

// --- persistence outside systemStates ---
{
  const store = createUnrestIndependenceStore();
  injectUnrest(store, 7, 'at');
  injectLoungeAndContract(store, 7);
  mintFixture(store, { systemIndex: 7, authoredInject: false, origin: 'vulcan' });
  const serialized = serializeUnrestIndependence(store);
  const wipedSystemStates = {};
  const restored = restoreUnrestIndependence(serialized);
  assert('s7.persist-unrest-outside-systemStates', wipedSystemStates.unrest == null && Object.keys(wipedSystemStates).length === 0);
  assert('s7.persist-eligibility', snapshotWorldUnrest(restored, 7).eligible === true);
  assert('s7.persist-polity', Object.keys(restored.polities).length === 1);
  assert('s7.persist-civilians', restored.civilians['7']?.length === 2);
}

// --- process locks ---
{
  assert('s7.lock-no-phase5', ASSET_OVERDUE_IMPLEMENTED === false && PHASE5_ASSET_OVERDUE === 'asset_overdue');
  assert('s7.lock-no-catalog-wire', FULL_CATALOG_WIRED === false);
  assert('s7.lock-two-player-roe-modes', playerRoeModesUnchanged(['return-fire', 'defend']));
  const snap = snapshotIndependence(createUnrestIndependenceStore(), 0);
  assert('s7.lock-snapshot-shape', snap.unrest.level === 'below' && snap.flagShareGrantsControl === false);
}

const summary = `Side-lane S7.11–S7.23 offline: ${passed} passed, ${failed} failed`;
console.log(summary);
if (failures.length) {
  for (const row of failures) console.error(`FAIL ${row}`);
}
if (failed) process.exitCode = 1;
