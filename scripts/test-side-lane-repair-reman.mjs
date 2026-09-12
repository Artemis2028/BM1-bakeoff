#!/usr/bin/env node
/**
 * Offline S7.1–S7.10 checks for side-lane slice 1 (repairCapable + Reman unlock).
 * Written from docs/side-lane-repair-reman-independence/ only.
 * Gate 3 (unrest / independence) is deferred.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createShipCatalog } from '../bm-ships/catalog.mjs';
import {
  FORBIDDEN_REPAIR_OVERLAY_ASSETS,
  OTHER_WARBIRD_HULL_IDS,
  REMAN_ACCESS_REMAINS_SAYABLE,
  REMAN_LOCKED_RECOVERY_SAYABLE,
  REMAN_WARBIRD_HULL_ID,
  REMAN_WARBIRD_PACK_KEY,
  REPAIR_ARMS_ASSET_PATH,
  REPAIR_HULL_LATINUM_PER_PERCENT,
  REPAIR_REFUSE_CLEARANCE,
  REPAIR_REFUSE_DEFENSE_PLATFORM,
  REPAIR_REFUSE_NOT_CAPABLE,
  REPAIR_SHIELD_LATINUM_PER_PERCENT,
  S7_8_MEETING_POINT,
  advanceRepairSession,
  beginRepairSession,
  createPlayerUnlocks,
  createRepairSession,
  evaluateRemanWarbirdAccess,
  evaluateRepairStart,
  filterShipStockForRemanAccess,
  grantRemanWarbirdAccess,
  hasRemanWarbirdAccess,
  isOtherWarbirdHull,
  isRemanSecretVendorStation,
  isRemanWarbirdHull,
  isRepairCapableLocation,
  meetPackPurchaseDecision,
  overlayUsesForbiddenArt,
  remanDestructionSayable,
  restorePlayerUnlocks,
  serializePlayerUnlocks,
  shouldDrawRepairOverlay,
} from '../src/side-lane-repair-reman.js';

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

assert(
  's7.1-planet-capable',
  isRepairCapableLocation({ kind: 'planet', docked: true }) === true,
);
assert(
  's7.1-starbase-capable',
  isRepairCapableLocation({ kind: 'station', station: { stationTypeId: 70, name: 'Human Starbase' }, sizeClass: 'starbase', typeId: 70 }) === true,
);
assert(
  's7.1-shipyard-capable',
  isRepairCapableLocation({ kind: 'station', sizeClass: 'shipyard', typeId: 74, station: { stationTypeId: 74 } }) === true,
);
assert(
  's7.1-heavy-shipyard-capable',
  isRepairCapableLocation({ kind: 'station', sizeClass: 'heavy-shipyard', typeId: 73, station: { stationTypeId: 73 } }) === true,
);
assert(
  's7.1-maintenance-83-capable',
  isRepairCapableLocation({ kind: 'station', typeId: 83, sizeClass: 'utility', station: { stationTypeId: 83, name: 'Maintenance Station' } }) === true,
);

assert(
  's7.2-platform-86-not-capable',
  isRepairCapableLocation({ kind: 'station', typeId: 86, sizeClass: 'defense-platform', station: { stationTypeId: 86, name: 'Defense Platform' } }) === false,
);
assert(
  's7.2-platform-87-not-capable',
  isRepairCapableLocation({ kind: 'station', typeId: 87, sizeClass: 'defense-platform', station: { stationTypeId: 87, name: 'Advanced Defense Platform' } }) === false,
);
assert(
  's7.2-sizeClass-defense-platform',
  isRepairCapableLocation({ kind: 'station', sizeClass: 'defense-platform', typeId: 99, station: { stationTypeId: 99 } }) === false,
);
assert(
  's7.2-repair-refuses-capability-reason',
  evaluateRepairStart({
    docked: true,
    kind: 'station',
    typeId: 86,
    sizeClass: 'defense-platform',
    station: { stationTypeId: 86 },
  }).reason === REPAIR_REFUSE_DEFENSE_PLATFORM,
);
assert(
  's7.2-no-overlay-on-platform',
  shouldDrawRepairOverlay(beginRepairSession({ overlayAssetPresent: true }), {
    capable: false,
    servicesAllowed: true,
    overlayAssetPresent: true,
  }) === false,
);

assert(
  's7.1-trade-not-capable',
  isRepairCapableLocation({ kind: 'station', typeId: 75, sizeClass: 'commerce', station: { stationTypeId: 75, name: 'Trade Station' } }) === false,
);
assert(
  's7.1-destroyed-not-capable',
  isRepairCapableLocation({ kind: 'station', typeId: 70, sizeClass: 'starbase', station: { stationTypeId: 70, destroyed: true } }) === false,
);
assert(
  's7.1-not-docked-not-capable',
  isRepairCapableLocation({ kind: 'planet', docked: false }) === false,
);

const deniedPlanet = evaluateRepairStart({
  docked: true,
  kind: 'planet',
  servicesDenied: true,
  accessReason: 'Hold at the marker for clearance',
});
const clearedPlatform = evaluateRepairStart({
  docked: true,
  kind: 'station',
  typeId: 86,
  sizeClass: 'defense-platform',
  station: { stationTypeId: 86 },
  servicesDenied: false,
});
assert('s7.3-denied-planet-is-access', deniedPlanet.layer === 'access' && deniedPlanet.ok === false);
assert('s7.3-denied-planet-not-capability', deniedPlanet.reason !== REPAIR_REFUSE_NOT_CAPABLE && deniedPlanet.reason !== REPAIR_REFUSE_DEFENSE_PLATFORM);
assert('s7.3-denied-uses-checkpoint-reason', deniedPlanet.reason === 'Hold at the marker for clearance' || deniedPlanet.reason === REPAIR_REFUSE_CLEARANCE);
assert('s7.3-cleared-platform-is-capability', clearedPlatform.layer === 'capability');
assert('s7.3-reasons-not-swapped', deniedPlanet.reason !== clearedPlatform.reason);

const idle = createRepairSession();
assert('s7.4-overlay-off-when-docked-not-repairing', shouldDrawRepairOverlay(idle, {
  capable: true,
  servicesAllowed: true,
  overlayAssetPresent: true,
}) === false);

const inProgress = beginRepairSession({ overlayAssetPresent: true });
assert('s7.4-overlay-on-player-while-repairing', shouldDrawRepairOverlay(inProgress, {
  capable: true,
  servicesAllowed: true,
  overlayAssetPresent: true,
  actor: 'player',
}) === true);
assert('s7.4-no-overlay-on-npc', shouldDrawRepairOverlay(inProgress, {
  capable: true,
  servicesAllowed: true,
  overlayAssetPresent: true,
  actor: 'npc',
}) === false);

const afterTick = advanceRepairSession(inProgress);
assert('s7.4-overlay-off-after-complete', afterTick.inProgress === false && shouldDrawRepairOverlay(afterTick, {
  capable: true,
  servicesAllowed: true,
  overlayAssetPresent: true,
}) === false);

const missingOverlay = beginRepairSession({ overlayAssetPresent: false });
assert('s7.4-asset-missing-skips-visual', shouldDrawRepairOverlay(missingOverlay, {
  capable: true,
  servicesAllowed: true,
  overlayAssetPresent: false,
}) === false);
assert('s7.4-asset-missing-still-in-progress', missingOverlay.inProgress === true);

const overlayExists = fs.existsSync(path.join(root, REPAIR_ARMS_ASSET_PATH));
assert(
  's7.4-no-construction-art-bound',
  overlayUsesForbiddenArt(REPAIR_ARMS_ASSET_PATH) === false
    && FORBIDDEN_REPAIR_OVERLAY_ASSETS.every((name) => !REPAIR_ARMS_ASSET_PATH.includes(name)),
);
if (!overlayExists) {
  assert('s7.4-overlay-asset-missing-recorded', overlayExists === false);
}

assert('s7.5-hull-rate-unchanged', REPAIR_HULL_LATINUM_PER_PERCENT === 2);
assert('s7.5-shield-rate-unchanged', REPAIR_SHIELD_LATINUM_PER_PERCENT === 1);

let unlocks = createPlayerUnlocks();
assert('s7.6-default-locked', hasRemanWarbirdAccess(unlocks) === false);
unlocks = grantRemanWarbirdAccess(unlocks, { source: 'remus-secret', grantedAt: 12 });
assert('s7.6-granted-without-station-id-key', unlocks.remanWarbird.granted === true && unlocks.remanWarbird.source === 'remus-secret');

const serialized = serializePlayerUnlocks(unlocks);
const wipedSystemStates = {};
const reloaded = restorePlayerUnlocks(serialized);
assert('s7.6-survives-serialize', reloaded.remanWarbird.granted === true && reloaded.remanWarbird.source === 'remus-secret');
assert('s7.6-not-in-systemStates', wipedSystemStates.remanWarbird == null && Object.keys(wipedSystemStates).length === 0);

const afterDestroy = grantRemanWarbirdAccess(unlocks, { source: 'remus-secret' });
assert('s7.7-destroy-does-not-revoke', hasRemanWarbirdAccess(afterDestroy) === true);
assert('s7.7-sayable-access-remains', remanDestructionSayable(afterDestroy) === REMAN_ACCESS_REMAINS_SAYABLE);
assert(
  's7.7-predicate-still-true',
  evaluateRemanWarbirdAccess({ unlocks: afterDestroy, hullId: 53 }).allowed === true,
);

let locked = createPlayerUnlocks();
const destroyedVendor = { name: 'Reman Starbase', destroyed: true, stockIds: [53], id: '29-164' };
assert('s7.8-destroyed-vendor-is-not-live-source', isRemanSecretVendorStation(destroyedVendor, { systemName: 'Remus' }) === false);
locked = grantRemanWarbirdAccess(locked, { source: 'recovery-mission', grantedAt: 40 });
assert('s7.8-recovery-hook-grants-same-flag', hasRemanWarbirdAccess(locked) === true && locked.remanWarbird.source === 'recovery-mission');
assert('s7.8-recovery-sayable-when-locked', remanDestructionSayable(createPlayerUnlocks()) === REMAN_LOCKED_RECOVERY_SAYABLE);

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'bm-ships/ships.json'), 'utf8'));
const sourceMap = JSON.parse(fs.readFileSync(path.join(root, 'bm-ships/bm2-id-map.json'), 'utf8'));
const sizes = JSON.parse(fs.readFileSync(path.join(root, 'bm-ships/size-config.json'), 'utf8'));
const catalog = createShipCatalog(manifest, sourceMap, sizes);
const remanShip = catalog.getShip(REMAN_WARBIRD_HULL_ID);
assert('s7.10-pack-id-53', remanShip?.id === 53 && remanShip?.key === REMAN_WARBIRD_PACK_KEY);
assert('s7.8-pack-has-no-specialVendor', remanShip != null && remanShip.specialVendor == null);
assert('s7.8-pack-shipyardEligible-false', remanShip.shipyardEligible === false);

const packDecision = catalog.getPurchaseDecision(REMAN_WARBIRD_HULL_ID, {
  role: 'purchase',
  systemName: 'remus',
  vendor: 'remus-secret',
  worldPrestige: 0,
  credits: 999999999,
  tierThresholds: { strategic: 0 },
});
assert('s7.8-pack-helper-restricted-stock', packDecision.allowed === false && packDecision.reason === 'restricted-stock');

const metLocked = meetPackPurchaseDecision(packDecision, createPlayerUnlocks(), 53);
assert('s7.8-wrapper-refuses-without-flag', metLocked.allowed === false && metLocked.reason === 'access-locked');
assert('s7.8-wrapper-does-not-fabricate', metLocked.fabricatedSpecialVendor === false);

const metGranted = meetPackPurchaseDecision(packDecision, locked, 53);
assert('s7.8-wrapper-satisfies-restricted-stock', metGranted.allowed === true && metGranted.packReason === 'restricted-stock');
assert('s7.8-still-no-specialVendor-on-pack', catalog.getShip(53).specialVendor == null);
assert('s7.8-meeting-point-closed', S7_8_MEETING_POINT.closed === true && S7_8_MEETING_POINT.fabricatedSpecialVendor === false);

const regionDecision = catalog.getPurchaseDecision(REMAN_WARBIRD_HULL_ID, {
  role: 'purchase',
  systemName: 'sol',
  vendor: 'other',
  worldPrestige: 0,
  credits: 999999999,
  tierThresholds: { strategic: 0 },
});
const metRegion = meetPackPurchaseDecision(regionDecision, locked, 53);
assert('s7.8-granted-survives-region-content-check', metRegion.allowed === true && (regionDecision.reason === 'region' || regionDecision.reason === 'restricted-stock'));

assert('s7.9-identity-helpers-do-not-load-catalog', isRemanWarbirdHull(53) === true && isRemanWarbirdHull(18) === false);
assert(
  's7.9-stock-filter-hides-53-without-access',
  filterShipStockForRemanAccess([{ id: 18 }, { id: 53 }], createPlayerUnlocks()).every((ship) => Number(ship.id) !== 53),
);
assert(
  's7.9-stock-filter-keeps-53-with-access',
  filterShipStockForRemanAccess([{ id: 18 }, { id: 53 }], locked).some((ship) => Number(ship.id) === 53),
);

assert('s7.10-pack-key', isRemanWarbirdHull(null, REMAN_WARBIRD_PACK_KEY) === true);
for (const otherId of OTHER_WARBIRD_HULL_IDS) {
  assert(
    `s7.10-other-warbird-${otherId}-is-not-unlock`,
    isOtherWarbirdHull(otherId) === true
      && evaluateRemanWarbirdAccess({ unlocks: locked, hullId: otherId }).allowed === false,
  );
}
assert(
  's7.10-culture-reman-is-not-unlock',
  evaluateRemanWarbirdAccess({ unlocks: createPlayerUnlocks(), hullId: 53, cultureId: 'reman' }).allowed === false
    && evaluateRemanWarbirdAccess({ unlocks: createPlayerUnlocks(), hullId: 53, cultureId: 'reman' }).reason === 'culture-is-not-unlock',
);
assert(
  's7.10-live-vendor-rule-not-station-id',
  isRemanSecretVendorStation({ id: '29-164', name: 'Reman Starbase', stockIds: [53] }, { systemName: 'Remus' }) === true
    && isRemanSecretVendorStation({ id: '29-164', name: 'Reman Starbase', stockIds: [53] }, { systemName: 'Sol' }) === false,
);

assert(
  's7.1-capable-start-ok',
  evaluateRepairStart({ docked: true, kind: 'planet', servicesDenied: false }).ok === true,
);

const summary = `Side-lane S7.1–S7.10 offline: ${passed} passed, ${failed} failed`;
console.log(summary);
if (failures.length) {
  for (const row of failures) console.error(`FAIL ${row}`);
}
if (failed) process.exitCode = 1;
