#!/usr/bin/env node
/**
 * Offline dockClear / UI-fit probes (S28 family).
 * Written from docs/dock-clear/ only. Does not crib remastered-work.
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
import { CONSTRUCTION_LOCKED_FROM_REMASTERED } from '../src/construction-visuals.js';
import { HTML_CATALOG_LOCKED_FROM_REMASTERED } from '../scripts/build-html-catalogs.mjs';
import { ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED } from '../src/economy-difficulty.js';
import { STANDING_TIERS_LOCKED_FROM_REMASTERED } from '../src/standing-tiers.js';
import { POWER_CONSUMERS } from '../src/phase65-power.js';
import { ROE_MODES } from '../src/phase2-security.js';
import { HOME_FACTION_STANDING, PURCHASE_TIER_STANDING } from '../src/ship-catalog-wire.js';
import {
  DOCK_CLEAR_DEFAULT_PX,
  DOCK_CLEAR_LOCKED_FROM_REMASTERED,
  DOCK_CLEAR_TOKEN,
  PROCESS_VIEWPORT,
  boxClearsDock,
  dockClearInjectMustNotGiftFire,
  dockHoverFitsViewport,
  findLeakedNames,
  predictedSingleHoverDockWidth,
  readDockClearPx,
  requireDockClearHelpers,
  snapshotDockClear,
  snapshotVisibleDockFit,
} from '../src/dock-clear.js';

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
const srcDock = fs.readFileSync(path.join(root, 'src/dock-clear.js'), 'utf8');
const srcStanding = fs.readFileSync(path.join(root, 'src/standing-tiers.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const capture = fs.readFileSync(path.join(root, 'scripts/capture-dock-clear-screens.mjs'), 'utf8');

assert('s28.startup-helpers', typeof snapshotVisibleDockFit === 'function'
  && typeof snapshotDockClear === 'function'
  && typeof requireDockClearHelpers === 'function'
  && typeof readDockClearPx === 'function'
  && typeof boxClearsDock === 'function');

let helpersOk = true;
try {
  requireDockClearHelpers(snapshotVisibleDockFit);
} catch {
  helpersOk = false;
}
assert('s28.startup-subscribe', helpersOk === true);

let missingThrew = false;
try {
  requireDockClearHelpers(null);
} catch (error) {
  missingThrew = error.missing === true && error.helper === 'snapshotDockFit';
}
assert('s28.setup-fail-if-snapshot-missing', missingThrew === true);

assert('s28.7 lock-false', DOCK_CLEAR_LOCKED_FROM_REMASTERED === false
  && STANDING_TIERS_LOCKED_FROM_REMASTERED === false
  && ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED === false
  && SLOT_LOCK === false
  && PHASE92_LOCK === false
  && PHASE93_LOCK === false
  && PHASE94_LOCK === false
  && BOARDING_LOCK === false
  && PHASE10_LOCK === false
  && UTILITY_LOCKED_FROM_REMASTERED === false
  && LEDGER_LOCKED_FROM_REMASTERED === false
  && EMPTY_ARMABLE_LOCKED_FROM_REMASTERED === false
  && CONSTRUCTION_LOCKED_FROM_REMASTERED === false
  && HTML_CATALOG_LOCKED_FROM_REMASTERED === false);

assert('s28.1 token-present', css.includes(`${DOCK_CLEAR_TOKEN}: ${DOCK_CLEAR_DEFAULT_PX}px`)
  && css.includes('var(--bm1-dock-clear)')
  && css.includes('calc(100vh - 48px - var(--bm1-dock-clear) - 40px)')
  && css.includes('bottom: calc(var(--bm1-dock-clear) + 8px)')
  && readDockClearPx('88px') === 88);

assert('s28.1 operator-formula-preserved', srcMain.includes('snapshotDockFit')
  && srcMain.includes('dockClear: createDockClearProbeApi()')
  && srcMain.includes('createDockClearProbeApi'));

const hiddenOperator = snapshotVisibleDockFit({
  operator: { hidden: true, bottom: 0, top: 0, left: 0, right: 0, panelW: 0, panelH: 0 },
  target: { hidden: false, bottom: 624, top: 400, left: 18, right: 348, panelW: 330, panelH: 224, overflowX: false },
  dock: { hidden: false, top: 648, bottom: 706, left: 447, right: 833 },
  mapOpen: false,
  viewport: PROCESS_VIEWPORT,
  clippedControls: [],
});
assert('s28.1 hidden-operator-does-not-auto-pass', hiddenOperator.dockClear === false
  && hiddenOperator.targetDockClear === true
  && hiddenOperator.mapDockClear === false, JSON.stringify(hiddenOperator));

const opsOpen = snapshotVisibleDockFit({
  operator: { hidden: false, bottom: 632, top: 88, left: 280, right: 1000, panelW: 720, panelH: 544, overflowX: false },
  target: { hidden: true, bottom: 0, panelW: 0, panelH: 0 },
  dock: { hidden: false, top: 648, bottom: 706, left: 447, right: 833 },
  mapOpen: false,
  viewport: PROCESS_VIEWPORT,
  clippedControls: [],
});
assert('s28.1 operator-green-shape', opsOpen.dockClear === true
  && opsOpen.targetDockClear === false
  && opsOpen.clippedControls.length === 0
  && opsOpen.overflowX === false, JSON.stringify(opsOpen));

const mapOpen = snapshotVisibleDockFit({
  operator: { hidden: true, bottom: 0, panelW: 0, panelH: 0 },
  target: { hidden: true, bottom: 0, panelW: 0, panelH: 0 },
  map: { hidden: false, bottom: 630, top: 61, left: 102, right: 1178, panelW: 1076, panelH: 569 },
  dock: { hidden: false, top: 648, bottom: 706, left: 447, right: 833 },
  mapOpen: true,
  closeClearsDock: true,
  leakedNames: [],
  labeledSystems: [{ name: 'Ferenginar', inChartBox: true }],
  viewport: PROCESS_VIEWPORT,
  clippedControls: [],
});
assert('s28.3 map-visible-box', mapOpen.mapDockClear === true
  && mapOpen.dockClear === false
  && mapOpen.leakedNames.length === 0
  && mapOpen.labeledSystemsInBox === true, JSON.stringify(mapOpen));

const leaked = findLeakedNames('Visit Dominica and the Gamma Quadrant');
assert('s28.3 no-leak-helper', leaked.includes('Dominica') && leaked.includes('Gamma Quadrant'));
assert('s28.3 blender-start-empty', findLeakedNames('Ferenginar Choirok').length === 0);

const hover = dockHoverFitsViewport({ viewportW: 1280, buttonCount: 7, centerX: 640 });
assert('s28.4 hover-fits-viewport', hover.overflowX === false
  && predictedSingleHoverDockWidth({ buttonCount: 7 }) < 1280, JSON.stringify(hover));

const fire = dockClearInjectMustNotGiftFire({
  firingSolution: true,
  engagement_authorized: true,
  cultureFire: true,
});
assert('s28.5 no-fire-gift', fire.firingSolutionPresent === false
  && fire.engagementAuthorizedPresent === false
  && fire.cultureFire === false
  && fire.tractorIsBoard === false
  && fire.twoModeRoe.join(',') === ROE_MODES.join(',')
  && fire.standingLockFalse === true
  && tractorIsBoarding() === false
  && ROE_MODES.length === 2);

const snap = snapshotDockClear({
  operator: { hidden: false, bottom: 632, top: 88, left: 280, right: 1000, panelW: 720, panelH: 544 },
  dock: { hidden: false, top: 648, left: 447, right: 833 },
  viewport: PROCESS_VIEWPORT,
  fireInject: { firingSolution: true, engagement_authorized: true },
});
assert('s28.5 snapshot-shape', snap.ok === true
  && snap.missing !== true
  && snap.lockedFromRemastered === false
  && snap.operator.dockClear === true
  && snap.fire.firingSolutionPresent === false
  && snap.fire.engagementAuthorizedPresent === false
  && snap.tractorIsBoard === false);

assert('s28.6 landed-lanes-preserved', BOARDING_IMPLEMENTED === true
  && EW_BOARDING === true
  && tractorIsBoarding() === false
  && POWER_CONSUMERS.join(',') === 'propulsion,weapons,cloak,sensors,ew'
  && HOME_FACTION_STANDING === 20
  && PURCHASE_TIER_STANDING.military === 50
  && srcMain.includes('standingTiers: createStandingTiersProbeApi()')
  && srcMain.includes('phase10: createPhase10ProbeApi()')
  && srcMain.includes('boarding: createBoardingProbeApi()'));

assert('s28.6 no-reopen', !srcDock.includes('Thaleron Test Facility')
  && !srcDock.includes('game_items.json')
  && !srcDock.includes('git am')
  && !srcDock.includes('PURCHASE_TIER_STANDING')
  && !srcDock.includes('areAlertsActive')
  && !srcDock.includes('function consultDoctrineFire')
  && !srcDock.includes('function tractorIsBoarding')
  && !/from ['"][^'"]*remastered/i.test(srcDock)
  && srcStanding.includes('STANDING_TIERS_LOCKED_FROM_REMASTERED')
  && !srcDock.includes('function evaluateWiredPurchase'));

assert('s28.2 hail-board-copy-untouched', srcMain.includes('data-board-action="board"')
  && srcMain.includes('data-board-action="capture"')
  && srcMain.includes('data-board-action="scuttle"')
  && srcMain.includes('data-hail-action="hail"')
  && srcMain.includes('awayTeamXpChromeLine')
  && !srcMain.includes('Not tracked yet')
  && !srcDock.includes('hull-above-threshold'));

assert('s28.8 capture-script', capture.includes('targetDockClear')
  && capture.includes('mapDockClear')
  && capture.includes('1280')
  && capture.includes('720')
  && capture.includes('--mode'));

const baselineDir = path.join(root, 'docs/dock-clear/screenshots/baseline');
const afterDir = path.join(root, 'docs/dock-clear/screenshots/after');
assert('s28.8 baseline-attached', fs.existsSync(path.join(baselineDir, 'NOTES.md'))
  && fs.existsSync(path.join(baselineDir, '04-target-overflow.json'))
  && fs.existsSync(path.join(baselineDir, '05-starchart-overflow.json'))
  && fs.existsSync(path.join(baselineDir, '01-ops.png')));
assert('s28.8 after-attached', fs.existsSync(path.join(afterDir, 'NOTES.md'))
  && fs.existsSync(path.join(afterDir, '04-target-overflow.json'))
  && fs.existsSync(path.join(afterDir, '05-starchart-overflow.json'))
  && fs.existsSync(path.join(afterDir, '01-ops.png')));

if (failed) {
  console.error(`Dock-clear offline probes: ${passed} passed, ${failed} failed`);
  for (const rowId of failures) console.error(`  FAIL ${rowId}`);
  process.exit(1);
}
console.log(`Dock-clear offline probes: ${passed} passed, ${failed} failed`);
