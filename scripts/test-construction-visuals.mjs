#!/usr/bin/env node
/**
 * Offline station construction visuals probes (S24 family).
 * Written from docs/construction-visuals/ only. Does not crib remastered-work.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tractorIsBoarding, BOARDING_IMPLEMENTED as EW_BOARDING } from '../src/phase9-ew.js';
import { BOARDING_IMPLEMENTED } from '../src/boarding-eligibility.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as SLOT_LOCK } from '../src/phase91-ew-slot.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE92_LOCK } from '../src/phase92-magnitudes.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE93_LOCK } from '../src/phase93-magnitudes.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE94_LOCK } from '../src/phase94-magnitudes.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as BOARDING_LOCK } from '../src/boarding-eligibility.js';
import { MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE10_LOCK } from '../src/phase10-magnitudes.js';
import { UTILITY_LOCKED_FROM_REMASTERED } from '../src/utility-inventory.js';
import { LEDGER_LOCKED_FROM_REMASTERED } from '../src/weapon-source-ledger.js';
import { EMPTY_ARMABLE_LOCKED_FROM_REMASTERED } from '../src/empty-armable.js';
import { POWER_CONSUMERS } from '../src/phase65-power.js';
import { FLASH_ELIGIBLE_KINDS, shouldPulseFlash } from '../src/phase4-incidents.js';
import {
  FORBIDDEN_REPAIR_OVERLAY_ASSETS,
  REPAIR_ARMS_ASSET_PATH,
  beginRepairSession,
  isRepairCapableLocation,
  overlayUsesForbiddenArt,
  shouldDrawRepairOverlay,
} from '../src/side-lane-repair-reman.js';
import {
  COMBAT_BEAM_KIND,
  CONSTRUCTION_BEAM_COLOR,
  CONSTRUCTION_BEAM_KIND,
  CONSTRUCTION_LOCKED_FROM_REMASTERED,
  DEFAULT_WORKBEE_COUNT,
  PHASER_GOLD,
  STATION_CONSTRUCTING_ASSET_PATH,
  WORKBEE_IS_BOARDABLE,
  WORKBEE_IS_EMPTY_ARMABLE,
  WORKBEE_IS_HULL,
  WORKBEE_PACK_HULL_ID,
  addConstructionEffect,
  assertConstructionRepairArtWall,
  constructionAssetMissing,
  constructionInjectMustNotGiftFire,
  constructionMustNotWriteEvidence,
  constructionSrcUsesRepairArt,
  describeConstructionLanguage,
  drawConstructionSiteLanguage,
  isConstructingStation,
  listWorkbeeEffects,
  refuseConstructionRepairCrossBind,
  requireConstructionVisualHelpers,
  resolveConstructionMagnitudes,
  snapshotConstructionVisuals,
  workbeeIsBoardable,
  workbeeIsCombatNpc,
  workbeeIsEmptyArmableHull,
  workbeeMayJoinNpcShips,
} from '../src/construction-visuals.js';

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

const srcMain = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
const srcConstruction = fs.readFileSync(path.join(root, 'src/construction-visuals.js'), 'utf8');
const srcRepair = fs.readFileSync(path.join(root, 'src/side-lane-repair-reman.js'), 'utf8');

assert('s24.startup-helpers', typeof isConstructingStation === 'function'
  && typeof drawConstructionSiteLanguage === 'function'
  && typeof snapshotConstructionVisuals === 'function'
  && typeof shouldDrawRepairOverlay === 'function'
  && typeof overlayUsesForbiddenArt === 'function');

let helpersOk = true;
try {
  requireConstructionVisualHelpers();
} catch {
  helpersOk = false;
}
assert('s24.startup-subscribe', helpersOk === true);

const constructing = { id: 'site-1', underConstruction: true, stationTypeId: 75, name: 'Yard' };
const complete = { id: 'site-1', underConstruction: false, stationTypeId: 75 };
const language = describeConstructionLanguage(constructing);
assert('s24.1 constructing-language', isConstructingStation(constructing) === true
  && isConstructingStation(complete) === false
  && language.scaffold === 'programmatic'
  && language.workbee === 'programmatic'
  && language.blueBeam === true
  && language.color === CONSTRUCTION_BEAM_COLOR
  && language.color !== PHASER_GOLD
  && language.color !== REPAIR_ARMS_ASSET_PATH, JSON.stringify(language));

const missingGif = !fs.existsSync(path.join(root, STATION_CONSTRUCTING_ASSET_PATH));
const missingRepairDir = !fs.existsSync(path.join(root, 'assets/game/repair'));
assert('s24.1 asset-missing-honest', missingGif === true
  && constructionAssetMissing({ present: false, src: STATION_CONSTRUCTING_ASSET_PATH }) === true
  && constructionSrcUsesRepairArt(STATION_CONSTRUCTING_ASSET_PATH) === false
  && missingRepairDir === true);

const bees = listWorkbeeEffects(constructing, 1200, { radius: 40 });
assert('s24.1 workbee-effects', bees.length === DEFAULT_WORKBEE_COUNT
  && bees.every((bee) => bee.hull === false && bee.kind === CONSTRUCTION_BEAM_KIND)
  && workbeeMayJoinNpcShips() === false
  && workbeeIsCombatNpc() === false
  && WORKBEE_IS_HULL === false
  && WORKBEE_PACK_HULL_ID == null);

const ops = [];
const fakeCtx = {
  save() { ops.push('save'); },
  restore() { ops.push('restore'); },
  translate() { ops.push('translate'); },
  rotate() { ops.push('rotate'); },
  beginPath() { ops.push('beginPath'); },
  moveTo() { ops.push('moveTo'); },
  lineTo() { ops.push('lineTo'); },
  closePath() { ops.push('closePath'); },
  stroke() { ops.push('stroke'); },
  fill() { ops.push('fill'); },
  arc() { ops.push('arc'); },
  ellipse() { ops.push('ellipse'); },
  fillRect() { ops.push('fillRect'); },
  drawImage() { ops.push('drawImage'); },
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 1,
  lineCap: 'butt',
};
const drew = drawConstructionSiteLanguage(fakeCtx, {
  station: constructing,
  x: 100,
  y: 80,
  radius: 40,
  now: 1600,
  scaffoldAsset: { present: false, src: STATION_CONSTRUCTING_ASSET_PATH, missing: true },
});
assert('s24.1 programmatic-draw', drew.drew === true
  && drew.language.scaffold === 'programmatic'
  && drew.language.workbee === 'programmatic'
  && drew.language.blueBeam === true
  && drew.usesRepairArmsArt === false
  && drew.combatBeamPresent !== true
  && drew.effectKinds.every((kind) => kind === CONSTRUCTION_BEAM_KIND)
  && ops.includes('stroke')
  && !ops.includes('addProjectile'), JSON.stringify(drew));

const idle = snapshotConstructionVisuals({
  station: constructing,
  scaffoldAsset: { present: false, src: STATION_CONSTRUCTING_ASSET_PATH },
  stationWeaponIds: [],
  npcShipIds: ['npc-1'],
});
assert('s24.1 snapshot-build-site', idle.ok === true
  && idle.missing !== true
  && idle.underConstruction === true
  && idle.language.scaffold === 'programmatic'
  && idle.language.workbee === 'programmatic'
  && idle.language.blueBeam === true
  && idle.assetMissing === true
  && idle.usesRepairArmsArt === false
  && idle.placeholderOnly === false, JSON.stringify(idle));

const playerOverlay = shouldDrawRepairOverlay(beginRepairSession({ overlayAssetPresent: true }), {
  capable: true,
  servicesAllowed: true,
  overlayAssetPresent: true,
  actor: 'player',
});
const npcOverlay = shouldDrawRepairOverlay(beginRepairSession({ overlayAssetPresent: true, actor: 'npc' }), {
  capable: true,
  servicesAllowed: true,
  overlayAssetPresent: true,
  actor: 'npc',
});
assert('s24.2 repair-overlay-player-only', playerOverlay === true
  && npcOverlay === false
  && overlayUsesForbiddenArt('assets/game/construction/stationconstructing.gif') === true
  && overlayUsesForbiddenArt('workbee-sprite') === true
  && overlayUsesForbiddenArt(REPAIR_ARMS_ASSET_PATH) === false
  && FORBIDDEN_REPAIR_OVERLAY_ASSETS.includes('stationconstructing.gif')
  && FORBIDDEN_REPAIR_OVERLAY_ASSETS.includes('workbee'));

const platform = {
  id: 'plat-1',
  underConstruction: true,
  stationTypeId: 86,
  sizeClass: 'defense-platform',
};
assert('s24.2 platform-never-repair', isRepairCapableLocation({
  kind: 'station',
  station: platform,
  typeId: 86,
  sizeClass: 'defense-platform',
  docked: true,
}) === false);

let repairCross = false;
try {
  refuseConstructionRepairCrossBind(REPAIR_ARMS_ASSET_PATH, 'construction');
} catch (error) {
  repairCross = error.crossBind === true;
}
let constructCross = false;
try {
  assertConstructionRepairArtWall('assets/game/stationconstructing.gif', 'repair');
} catch (error) {
  constructCross = error.crossBind === true;
}
assert('s24.2 art-wall', repairCross === true
  && constructCross === true
  && constructionSrcUsesRepairArt(REPAIR_ARMS_ASSET_PATH) === true);

const evidence = constructionMustNotWriteEvidence();
assert('s24.3 no-phase4-write', evidence.observedAttacks === false
  && evidence.flash === false
  && evidence.addProjectile === false
  && evidence.combatBeamKind === false
  && evidence.fireStationWeapon === false
  && !FLASH_ELIGIBLE_KINDS.includes('construction')
  && shouldPulseFlash('construction') === false);

let combatRefused = false;
try {
  addConstructionEffect([], { kind: COMBAT_BEAM_KIND, color: PHASER_GOLD });
} catch (error) {
  combatRefused = error.combatBeam === true;
}
assert('s24.3 no-combat-beam-kind', combatRefused === true
  && CONSTRUCTION_BEAM_KIND !== COMBAT_BEAM_KIND);

const gifted = constructionInjectMustNotGiftFire({
  firingSolution: true,
  engagement_authorized: true,
  cultureFire: true,
});
assert('s24.4 no-fire-gift', gifted.firingSolutionPresent === false
  && gifted.engagementAuthorizedPresent === false
  && gifted.cultureFire === false
  && !Object.prototype.hasOwnProperty.call(gifted.row, 'firingSolution')
  && !Object.prototype.hasOwnProperty.call(gifted.row, 'engagement_authorized')
  && idle.fire.firingSolutionPresent === false
  && idle.fire.engagementAuthorizedPresent === false);

const done = snapshotConstructionVisuals({
  station: complete,
  scaffoldAsset: { present: false, src: STATION_CONSTRUCTING_ASSET_PATH },
  dockRefused: false,
  stationWeaponIds: [1],
});
assert('s24.5 complete-stops-language', done.underConstruction === false
  && done.language.scaffold === false
  && done.language.workbee === false
  && done.language.blueBeam === false
  && idle.site.dockRefused === true
  && Array.isArray(idle.site.stationWeaponIds)
  && idle.site.stationWeaponIds.length === 0);

const platSnap = snapshotConstructionVisuals({
  station: platform,
  scaffoldAsset: { present: false, src: STATION_CONSTRUCTING_ASSET_PATH },
  stationWeaponIds: [],
});
assert('s24.5 platform-build-not-repair', platSnap.underConstruction === true
  && platSnap.language.blueBeam === true
  && platSnap.repair.defensePlatformRepair === false);

assert('s24.6 lock-false', CONSTRUCTION_LOCKED_FROM_REMASTERED === false
  && idle.constructionLockedFromRemastered === false
  && EMPTY_ARMABLE_LOCKED_FROM_REMASTERED === false
  && SLOT_LOCK === false
  && PHASE92_LOCK === false
  && PHASE93_LOCK === false
  && PHASE94_LOCK === false
  && BOARDING_LOCK === false
  && PHASE10_LOCK === false
  && UTILITY_LOCKED_FROM_REMASTERED === false
  && LEDGER_LOCKED_FROM_REMASTERED === false);
assert('s24.6 workbee-not-hull', workbeeIsEmptyArmableHull() === false
  && workbeeIsBoardable() === false
  && WORKBEE_IS_EMPTY_ARMABLE === false
  && WORKBEE_IS_BOARDABLE === false
  && idle.workbee.inNpcShips !== true
  && tractorIsBoarding() === false
  && BOARDING_IMPLEMENTED === true
  && EW_BOARDING === true);
assert('s24.6 five-consumers', POWER_CONSUMERS.join(',') === 'propulsion,weapons,cloak,sensors,ew');
assert('s24.6 no-remastered-import', !/from ['"][^'"]*remastered/i.test(srcConstruction + srcMain)
  && !srcConstruction.includes('git am')
  && !srcMain.includes('git am')
  && srcMain.includes('constructionVisuals: createConstructionVisualsProbeApi()'));
assert('s24.6 no-reopen', !srcConstruction.includes('Thaleron Test Facility')
  && !srcConstruction.includes('dockClear')
  && !srcConstruction.includes('game_items.json')
  && !srcConstruction.includes('rebuildSystemStations')
  && srcRepair.includes('FORBIDDEN_REPAIR_OVERLAY_ASSETS')
  && srcMain.includes('drawConstructionSiteLanguage')
  && resolveConstructionMagnitudes({ workbeeCount: 3 }).workbeeCount === 3);

if (failed) {
  console.error(`Construction visuals offline probes: ${passed} passed, ${failed} failed`);
  for (const rowId of failures) console.error(`  FAIL ${rowId}`);
  process.exit(1);
}
console.log(`Construction visuals offline probes: ${passed} passed, ${failed} failed`);
