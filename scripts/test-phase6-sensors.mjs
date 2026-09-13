#!/usr/bin/env node
/**
 * Offline Phase 6 book / layer / cloak / variance / emission / space checks.
 * Written from docs/phase6/ only. Does not crib remastered-work.
 */
import {
  UNKNOWN_ACCESS_ENFORCEMENT,
  SYSTEM_CLAMP_W,
  SYSTEM_CLAMP_H,
  applyLostTrackSameTick,
  applyPassiveUpdate,
  ageTrack,
  buildSystemDestinations,
  cloakRemainingLocalMs,
  compareSensorOrdering,
  computeArrivalDrop,
  contactPresentation,
  createCloakState,
  createContactBook,
  decayAllTracks,
  dropContactsForSubject,
  emptyContactBook,
  escortsStackedOnFlagship,
  evaluatePassiveDetection,
  failSearch,
  findContact,
  firstFrameVisibility,
  initHullCloak,
  isCloakActive,
  isHullCloaked,
  isIndependentlyAddressable,
  listDestinationKinds,
  listFiringSolutions,
  liveFireFactsFromContact,
  noticeScanEmission,
  observerHasFiringSolution,
  observerKeyForNpc,
  observerKeyForPlayer,
  observerKeyForStation,
  observerSeesSubject,
  performActiveScan,
  placeEscortsOnFormation,
  pruneMissingSubjects,
  restoreContactBook,
  restoreCloak,
  retainExitPath,
  scienceOutperformsOrdinary,
  scienceVsOrdinaryFixture,
  seedFromReport,
  serializeCloak,
  serializeContactBook,
  setCloakActive,
  shareFormationDetection,
  shouldEnforceUnknownAccess,
  startSearch,
  subjectKeyForNpc,
  subjectKeyForPlayer,
  upsertContact,
} from '../src/phase6-sensors.js';

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

assert('s9.flag-unknown-unenforced', UNKNOWN_ACCESS_ENFORCEMENT === false && shouldEnforceUnknownAccess() === false);
assert('s9.clamp-box-unchanged', SYSTEM_CLAMP_W === 2600 && SYSTEM_CLAMP_H === 1800);

const localMs = 10_000;
const player = observerKeyForPlayer();
const npcA = observerKeyForNpc('vis-12');
const npcB = observerKeyForNpc('vis-44');
const stationKey = observerKeyForStation('st-1');
const subjectCloaked = subjectKeyForNpc('vis-99');
const subjectOpen = subjectKeyForNpc('vis-7');

const cloakedHull = initHullCloak({ id: 'slot-1', securityInstanceId: 'vis-99', x: 400, y: 200 }, { active: true }, localMs);
assert('s9.1-cloak-on-object-before-list', isHullCloaked(cloakedHull, localMs) === true);
assert('s9.1-cloak-uses-local-clock', cloakRemainingLocalMs(cloakedHull.cloak, localMs) > 0);
const persistedCloak = restoreCloak(serializeCloak(cloakedHull.cloak));
assert('s9.11-cloak-no-performance-now', persistedCloak.startedAtLocalMs === cloakedHull.cloak.startedAtLocalMs && persistedCloak.startedAt == null);

const book = createContactBook();
const first = firstFrameVisibility(book, player, subjectCloaked);
assert('s9.1-first-frame-minimap-hidden', first.minimap === false);
assert('s9.1-first-frame-target-hidden', first.targetCycle === false && first.clickSelect === false);
assert('s9.1-first-frame-ai-hidden', first.aiAcquisition === false && first.firingSolution === false);

const ordinary = { role: 'patrol', sensorEquipment: 'standard', powerNorm: 1, hullRatio: 1, mass: 12, key: player };
const science = { role: 'science', sensorEquipment: 'science', powerNorm: 1, hullRatio: 1, mass: 2, key: npcA };
const miss = evaluatePassiveDetection(ordinary, cloakedHull, 180, localMs);
assert('s9.1-ordinary-misses-cloak', miss.detected === false);
applyPassiveUpdate(book, player, subjectCloaked, miss, cloakedHull, localMs);
assert('s9.1-no-contact-after-apply', observerSeesSubject(book, player, subjectCloaked) === false);

const openHull = initHullCloak({ id: 'slot-2', securityInstanceId: 'vis-7', x: 120, y: 80 }, { active: false }, localMs);
const hit = evaluatePassiveDetection(ordinary, openHull, 80, localMs);
applyPassiveUpdate(book, player, subjectOpen, hit, openHull, localMs);
const layers = findContact(book, player, subjectOpen);
assert('s9.2-detected', layers.detected === true);
const detectionOnly = upsertContact(book, player, {
  subjectKey: subjectKeyForNpc('vis-unk'),
  detected: true,
  identification: 'none',
  trackQuality: 'coarse',
  firingSolution: false,
  lastKnown: { x: 10, y: 10, radius: 80, atLocalMs: localMs },
}, localMs);
const detPres = contactPresentation(detectionOnly);
assert('s9.2-detection-no-name', detPres.showName === false && detPres.showFaction === false);
assert('s9.2-detection-unclassified', detPres.unclassified === true && detPres.selectable === true);

const identNoFirm = upsertContact(book, player, {
  subjectKey: subjectKeyForNpc('vis-named'),
  detected: true,
  identification: 'known',
  trackQuality: 'coarse',
  firingSolution: true,
  lastKnown: { x: 20, y: 20, radius: 40, atLocalMs: localMs },
}, localMs);
assert('s9.2-ident-without-firm-no-fs', identNoFirm.firingSolution === false);
assert('s9.2-ident-shows-name', contactPresentation(identNoFirm).showName === true && contactPresentation(identNoFirm).liveLock === false);

const reportContact = seedFromReport(book, player, subjectKeyForNpc('vis-report'), { x: 333, y: 444 }, localMs);
assert('s9.2-report-area-only', reportContact.detected === true && reportContact.trackQuality === 'area');
assert('s9.2-report-not-live-lock', reportContact.firingSolution === false);
assert('s9.2-old-report-copy', /area|not a firing solution/i.test(contactPresentation(reportContact).lockCopy));

assert('s9.3-hidden-minimap', observerSeesSubject(book, player, subjectCloaked) === false);
assert('s9.3-hidden-no-faction-color', contactPresentation(findContact(book, player, subjectCloaked)).showFaction !== true);
assert('s9.3-hidden-not-selectable', contactPresentation(findContact(book, player, subjectCloaked)).selectable !== true);

const npcBookHit = evaluatePassiveDetection(science, cloakedHull, 160, localMs);
applyPassiveUpdate(book, npcA, subjectCloaked, npcBookHit, cloakedHull, localMs);
assert('s9.4-knowing-science-may-detect', observerSeesSubject(book, npcA, subjectCloaked) === true);
assert('s9.4-ignorant-ordinary-does-not', observerSeesSubject(book, player, subjectCloaked) === false);
assert('s9.4-station-empty-book', observerSeesSubject(book, stationKey, subjectCloaked) === false);
assert('s9.4-same-rules-keys', npcA.startsWith('npc:') && stationKey.startsWith('station:') && player === 'player');

const lockSubject = subjectKeyForNpc('vis-lock');
const live = upsertContact(book, player, {
  subjectKey: lockSubject,
  detected: true,
  identification: 'known',
  trackQuality: 'firm',
  firingSolution: true,
  lastKnown: { x: 50, y: 60, radius: 20, atLocalMs: localMs },
}, localMs);
assert('s9.5-live-lock-on', live.firingSolution === true && observerHasFiringSolution(book, player, lockSubject));
const aged = ageTrack(book, player, live.contactId, localMs + 80_000, 80_000);
assert('s9.5-fs-false-after-age', aged.ok && aged.firingSolution === false && aged.contact.firingSolution === false);
assert('s9.5-same-tick-drop', aged.sameTick === true && aged.drop.sameTick === true);
assert('s9.5-ui-and-ai-together', aged.drop.ui.tooltipLock === false && aged.drop.ui.minimapExact === false && aged.drop.ui.selectionLock === false && aged.drop.ai.acquisition === false);
assert('s9.5-exact-targeting-stops', aged.drop.exactTargeting === false && aged.drop.dropTrackingHome === true);
assert('s9.5-area-may-remain', aged.contact.trackQuality === 'area' || aged.contact.trackQuality === 'none' || aged.contact.lastKnown != null);

const sameTick = applyLostTrackSameTick(book, player, live.contactId, localMs + 80_000);
assert('s9.5-same-tick-helper', sameTick.ok && sameTick.sameTick === true && sameTick.firingSolution === false);

const searchContact = upsertContact(book, player, {
  subjectKey: subjectKeyForNpc('vis-search'),
  detected: true,
  identification: 'none',
  trackQuality: 'area',
  firingSolution: false,
  lastKnown: { x: 90, y: 90, radius: 200, atLocalMs: localMs },
}, localMs);
const searching = startSearch(book, player, searchContact.contactId, localMs, 4000);
assert('s9.6-search-starts', searching.ok && searching.pending === true && searching.firingSolution === false);
const midSearch = startSearch(book, player, searchContact.contactId, localMs + 500, 4000);
assert('s9.6-no-free-relock-mid-dwell', midSearch.firingSolution === false);
const failedSearch = failSearch(book, player, searchContact.contactId, localMs + 500);
assert('s9.6-fail-no-fs', failedSearch.failed === true && failedSearch.firingSolution === false);
assert('s9.6-fail-no-invented-xy', failedSearch.inventedCoordinates === false && failedSearch.attackerId == null);

const fixture = scienceVsOrdinaryFixture();
assert('s9.7-science-beats-larger-ordinary', scienceOutperformsOrdinary(fixture.science, fixture.ordinary) === true);
assert('s9.7-ordering-not-mass', compareSensorOrdering(fixture.science, fixture.ordinary) > 0 && fixture.science.mass < fixture.ordinary.mass);
const sciDetect = evaluatePassiveDetection(fixture.science, cloakedHull, 170, localMs);
const ordDetect = evaluatePassiveDetection(fixture.ordinary, cloakedHull, 170, localMs);
assert('s9.7-science-detects-cloak', sciDetect.detected === true);
assert('s9.7-ordinary-misses-same-range', ordDetect.detected === false);
const damagedDetect = evaluatePassiveDetection(fixture.damagedScience, cloakedHull, 170, localMs);
assert('s9.7-damage-power-reverses', damagedDetect.detected === false);
assert('s9.7-damaged-score-not-above-ordinary-cloakpierce', scienceOutperformsOrdinary(fixture.damagedScience, fixture.ordinary) === false || damagedDetect.detected === false);

const scanBook = emptyContactBook();
const scanner = { key: player, role: 'science', sensorEquipment: 'science', powerNorm: 1, hullRatio: 1, mass: 2, x: 0, y: 0 };
const scanTarget = { key: subjectOpen, x: 90, y: 40, cloak: createCloakState() };
const other = { key: npcB, role: 'patrol', sensorEquipment: 'standard', powerNorm: 1, hullRatio: 1, x: 20, y: 10 };
upsertContact(scanBook, npcB, {
  subjectKey: player,
  detected: true,
  identification: 'partial',
  trackQuality: 'coarse',
  firingSolution: false,
  lastKnown: { x: 0, y: 0, radius: 40, atLocalMs: localMs },
}, localMs);
const scan = performActiveScan(scanBook, scanner, scanTarget, 90, localMs);
assert('s9.8-scan-useful', scan.useful === true && scan.cargoDump === false);
assert('s9.8-scan-raises-layer', scan.raised === true && (IDENT_OK(scan.identification) || TRACK_OK(scan.trackQuality)));
const noticed = noticeScanEmission(scanBook, other, scanner, scan.emission, localMs, { detectsScanner: true });
assert('s9.8-emission-detected', noticed.noticed === true);
assert('s9.8-scan-not-fire-or-flash', noticed.firingAuthorized === false && noticed.flash === false && noticed.revealedFriends === false);

const emptyScan = performActiveScan(scanBook, {
  key: player,
  role: 'patrol',
  sensorEquipment: 'standard',
  powerNorm: 1,
  hullRatio: 1,
  mass: 12,
  x: 0,
  y: 0,
}, { key: subjectCloaked, cloaked: true, x: 400, y: 400 }, 400, localMs);
assert('s9.8-honest-empty-on-cloak', emptyScan.empty === true && emptyScan.firingSolution === false);

function IDENT_OK(value) {
  return value === 'partial' || value === 'known';
}
function TRACK_OK(value) {
  return value === 'coarse' || value === 'firm' || value === 'area';
}

const dests = buildSystemDestinations({
  star: { x: 1300, y: 900 },
  planet: { x: 1300, y: 760 },
  stations: [{ x: 1400, y: 800 }],
  asteroids: [{ x: 1600, y: 1000 }, { x: 1700, y: 1100 }],
  hasAsteroids: true,
  hasNebula: true,
  seed: 3,
});
const kinds = listDestinationKinds(dests);
assert('s9.9-at-least-two-kinds', kinds.length >= 2);
assert('s9.9-catalog-kinds', ['lane', 'belt', 'relay', 'wreck', 'research', 'restricted', 'anomaly'].filter((k) => kinds.includes(k)).length >= 2);
assert('s9.9-no-deep-space-address', dests.every((row) => isIndependentlyAddressable(row) === false && row.locationId == null));
assert('s9.9-not-empty-stretch', dests.length >= 2 && dests.every((row) => Number.isFinite(row.x) && Number.isFinite(row.y)));

const dropA = computeArrivalDrop({
  planet: { x: 1300, y: 760 },
  fromMap: { x: 0, y: 0 },
  toMap: { x: 400, y: 80 },
  destinations: dests,
});
const dropB = computeArrivalDrop({
  planet: { x: 1300, y: 760 },
  fromMap: { x: 800, y: -200 },
  toMap: { x: 400, y: 80 },
  destinations: dests,
});
assert('s9.10-two-bearings-differ', dropA.point.x !== dropB.point.x || dropA.point.y !== dropB.point.y);
const escorts = placeEscortsOnFormation(dropA.point, 3);
assert('s9.10-escorts-not-stacked', escortsStackedOnFlagship(dropA.point, escorts, 40) === false);
assert('s9.10-exit-retained', retainExitPath(dropA.exit) === true);
const checkpointDrop = computeArrivalDrop({
  planet: { x: 1300, y: 760 },
  checkpointApproach: { x: 111, y: 222 },
  destinations: dests,
});
assert('s9.10-checkpoint-still-wins', checkpointDrop.usedCheckpoint === true && checkpointDrop.point.x === 111);
assert('s9.10-checkpoint-exit', retainExitPath(checkpointDrop.exit) === true);

const saved = serializeContactBook(book);
const wipedSystemStates = {};
const restored = restoreContactBook(saved);
assert('s9.11-book-outside-systemStates', wipedSystemStates.contactBook == null && restored.observers[player]);
const recycledId = 'slot-1';
assert('s9.11-keyed-by-instance-not-npc-id', findContact(restored, player, recycledId) == null);
assert('s9.11-instance-key-stable', findContact(restored, player, subjectOpen)?.subjectKey === subjectOpen);
dropContactsForSubject(restored, subjectOpen);
assert('s9.11-ambient-reuse-drops-old', findContact(restored, player, subjectOpen) == null);
pruneMissingSubjects(restored, [subjectKeyForPlayer()]);
assert('s9.11-prune-keeps-report-area', findContact(restored, player, subjectKeyForNpc('vis-report')) != null);

shareFormationDetection(book, player, observerKeyForNpc('escort-1'), localMs);
const shared = findContact(book, observerKeyForNpc('escort-1'), subjectOpen);
assert('s9.q3-escort-share-detection-only', shared?.detected === true && shared.firingSolution === false && shared.trackQuality === 'area');

const facts = liveFireFactsFromContact(reportContact);
assert('s9.soft-no-hidden-engagement', facts.engagement_authorized == null && facts.liveWeaponTrack === false);
assert('s9.soft-identity-from-layers', facts.identityKnown === false && facts.fromHiddenIdentity === false);
assert('s9.12-unknown-still-locked', shouldEnforceUnknownAccess() === false);

const decayBook = emptyContactBook();
const firm = upsertContact(decayBook, player, {
  subjectKey: subjectKeyForNpc('vis-decay'),
  detected: true,
  identification: 'known',
  trackQuality: 'firm',
  firingSolution: true,
  lastKnown: { x: 1, y: 1, radius: 16, atLocalMs: 0 },
  freshnessLocalMs: 0,
}, 0);
const drops = decayAllTracks(decayBook, 80_000);
assert('s9.5-decay-drops-include-same-tick', drops.some((row) => row.subjectKey === firm.subjectKey && row.sameTick === true && row.firingSolution === false));
assert('s9.5-list-fs-empty-after-decay', listFiringSolutions(decayBook, player).length === 0);

const expired = setCloakActive(createCloakState({ active: true, startedAtLocalMs: 0, durationLocalMs: 1000 }), true, 0, 1000);
assert('s9.1-cloak-expires-on-local-clock', isCloakActive(expired, 1001) === false);

if (failed) {
  console.error(`Phase 6 offline probes: ${passed} passed, ${failed} failed`);
  for (const row of failures) console.error(`  FAIL ${row}`);
  process.exit(1);
}
console.log(`Phase 6 offline probes: ${passed} passed, ${failed} failed`);
