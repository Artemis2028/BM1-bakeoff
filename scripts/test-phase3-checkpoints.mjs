#!/usr/bin/env node
/**
 * Offline Phase 3 rule checks (geometry, classification, clock, ledger).
 */
import {
  AUTHORED_VULCAN_POLICY,
  SIM_MS_PER_FRAME,
  advanceLocalElapsed,
  buildZoneGeometry,
  computeAllowanceMs,
  deriveZoneRadius,
  getVisitorAccessDecision,
  holdingPolarFromApproach,
  makeBroadcast,
  resolvePolar,
  restoreSecurityEncounters,
  serializeSecurityEncounters,
  updateVisitorBoundary,
  createVisitorBoundaryState,
  visitorDeniedServices,
  closeEncounter,
  createEncounterRecord,
} from '../src/phase3-checkpoints.js';

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

assert(
  'radius-floor-cap',
  deriveZoneRadius(100) === 300 && deriveZoneRadius(700) === 650 && deriveZoneRadius(345) === 405,
);

const geometry = buildZoneGeometry({ planet: { x: 309, y: 1605 }, farthestPlanetAnchoredDistance: 345 });
assert('vulcan-like-radius', geometry.radius === 405);
assert('holding-is-70-percent', Math.abs(geometry.holdingDistance - 405 * 0.7) < 0.01);
assert('withdrawal-complete', geometry.withdrawalCompleteDistance === 485);
assert('reentry-hysteresis', geometry.reentryHysteresisDistance === 545);

const hold = holdingPolarFromApproach(geometry, { x: 309 + 400, y: 1605 });
const resolved = resolvePolar(geometry.center, hold);
assert(
  'polar-markers-resolve-from-centre',
  Math.abs(pointDist(resolved, geometry.center) - geometry.holdingDistance) < 0.001,
);

function pointDist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

const clock = advanceLocalElapsed(0, 0.25);
assert('clock-from-frame-scale', Math.abs(clock - 0.25 * SIM_MS_PER_FRAME) < 1e-9);
assert('allowance-floor-45s', computeAllowanceMs(10, 2) >= 45000);

const zone = {
  authoritySide: 'ferengi',
  authorityFlag: 'ferengi',
  policy: { access: { warFlag: 'closed', independent: 'challenge', unknown: 'open', other: 'challenge' } },
};
const opposed = (a, b) => (a === 'klingon' && b === 'ferengi') || (a === 'ferengi' && b === 'klingon');
assert('own-side-exempt', getVisitorAccessDecision(zone, { sideId: 'ferengi', broadcast: makeBroadcast({ faction: 'klingon', source: 'declared' }) }, { factionsOpposed: opposed }).class === 'exempt');
assert('independent-from-neutral-hull', getVisitorAccessDecision(zone, { sideId: 'ship:1', broadcast: makeBroadcast({ faction: 'neutral', source: 'hull' }) }, { factionsOpposed: opposed }).class === 'independent');
assert('war-flag', getVisitorAccessDecision(zone, { sideId: 'klingon', broadcast: makeBroadcast({ faction: 'klingon', source: 'hull' }) }, { factionsOpposed: opposed }).class === 'warFlag');
assert('custom-other', getVisitorAccessDecision(zone, { sideId: 'custom:42', broadcast: makeBroadcast({ faction: 'custom:42', source: 'declared' }) }, { factionsOpposed: opposed }).class === 'other');
assert('unknown-not-enforced', getVisitorAccessDecision(zone, { sideId: 'ghost', broadcast: makeBroadcast({ faction: '', source: 'none' }) }, { factionsOpposed: opposed }).enforceable === false);
assert('authored-vulcan-war-closed', AUTHORED_VULCAN_POLICY.access.warFlag === 'closed');

const visitor = createVisitorBoundaryState({ instanceId: 'vis-1', fullyOutside: true });
const first = updateVisitorBoundary(visitor, 10, geometry);
assert('already-inside-qualifies', first.alreadyInsideQualifies === true && first.newEpisode === true);
const jitter = updateVisitorBoundary(first.visitor, 12, geometry);
assert('jitter-is-not-new-episode', jitter.newEpisode === false);
const outside = updateVisitorBoundary(jitter.visitor, geometry.reentryHysteresisDistance + 10, geometry);
const reenter = updateVisitorBoundary(outside.visitor, 10, geometry);
assert('separated-reentry-is-new-episode', reenter.newEpisode === true);

const pending = createEncounterRecord({
  encounterId: 'enc-1',
  zoneId: 'player:0',
  systemIndex: 0,
  authoritySide: 'ferengi',
  visitorInstanceId: 'vis-1',
  instructionKind: 'challenge',
  remainingTravelMs: 45000,
  localElapsedMs: 0,
});
assert('pending-denies-services', visitorDeniedServices(pending) === true);
const cleared = closeEncounter(pending, 'cleared');
assert('cleared-allows-services', visitorDeniedServices(cleared) === false && cleared.complianceVerified === true);

const restored = restoreSecurityEncounters(serializeSecurityEncounters({
  version: 1,
  nextEncounterId: 3,
  systems: { 0: { localElapsedMs: 12, orders: { 'enc-1': cleared }, visitors: {}, participants: {}, recentEvents: [], clearances: {} } },
}));
assert('ledger-roundtrip', restored.systems['0'].orders['enc-1'].lifecycle === 'cleared');

const summary = `Phase 3 checkpoint unit checks: ${passed} passed, ${failed} failed`;
console.log(summary);
if (failures.length) console.log(failures.join('\n'));
if (failed) process.exitCode = 1;
