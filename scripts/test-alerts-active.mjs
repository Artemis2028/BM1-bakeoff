#!/usr/bin/env node
/**
 * Offline alertsActive snapshot probes (S29 family).
 * Written from docs/alerts-active/ only. Does not crib remastered-work.
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
import { DOCK_CLEAR_LOCKED_FROM_REMASTERED } from '../src/dock-clear.js';
import { POWER_CONSUMERS } from '../src/phase65-power.js';
import {
  ROE_MODES,
  areAlertsActive,
  createPlayerSecurityState,
  deactivateHoldingOverride,
  getEffectivePolicy,
  offersProtectAll,
  setEmpireDefaultDimension,
  setHoldingOverrideDimension,
} from '../src/phase2-security.js';
import { openIncident, createIncidentLedger } from '../src/phase4-incidents.js';
import {
  ALERTS_ACTIVE_LOCKED_FROM_REMASTERED,
  FORBIDDEN_ALERTS_ACTIVE_FIRE,
  alertsActiveInjectMustNotGiftFire,
  requireAlertsActiveHelpers,
  snapshotAlertsActive,
  snapshotAlertsActiveReadout,
} from '../src/alerts-active.js';

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
const srcAlerts = fs.readFileSync(path.join(root, 'src/alerts-active.js'), 'utf8');
const srcPhase2 = fs.readFileSync(path.join(root, 'src/phase2-security.js'), 'utf8');
const srcPhase4 = fs.readFileSync(path.join(root, 'src/phase4-incidents.js'), 'utf8');
const srcProbe = fs.readFileSync(path.join(root, 'scripts/behavior-probe.mjs'), 'utf8');
const srcDock = fs.readFileSync(path.join(root, 'src/dock-clear.js'), 'utf8');
const srcRoe = srcPhase2;

assert('s29.startup-helpers', typeof snapshotAlertsActive === 'function'
  && typeof snapshotAlertsActiveReadout === 'function'
  && typeof requireAlertsActiveHelpers === 'function'
  && typeof alertsActiveInjectMustNotGiftFire === 'function'
  && typeof getEffectivePolicy === 'function'
  && typeof areAlertsActive === 'function');

requireAlertsActiveHelpers();
assert('s29.startup-require', true);

assert('s29.7 remastered-lock-false', ALERTS_ACTIVE_LOCKED_FROM_REMASTERED === false
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
  && HTML_CATALOG_LOCKED_FROM_REMASTERED === false
  && ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED === false
  && STANDING_TIERS_LOCKED_FROM_REMASTERED === false
  && DOCK_CLEAR_LOCKED_FROM_REMASTERED === false);

let empireAll = createPlayerSecurityState('ferengi');
empireAll = setEmpireDefaultDimension(empireAll, 'alerts', 'all');
empireAll = setHoldingOverrideDimension(empireAll, 0, 'alerts', 'silent');
const silentHeld = snapshotAlertsActive(empireAll, 0, true);
const silentEffective = getEffectivePolicy(empireAll, 0, true);
assert('s29.1 override-silent-vs-empire-all', silentHeld === false
  && silentEffective.alerts === 'silent'
  && areAlertsActive(silentEffective) === false
  && areAlertsActive(empireAll) === true
  && empireAll.empireDefault.alerts === 'all'
  && silentHeld === (silentEffective.alerts !== 'silent'), JSON.stringify({
  silentHeld,
  effective: silentEffective.alerts,
  raw: areAlertsActive(empireAll),
  empire: empireAll.empireDefault.alerts,
}));

let empireSilent = createPlayerSecurityState('ferengi');
empireSilent = setEmpireDefaultDimension(empireSilent, 'alerts', 'silent');
empireSilent = setHoldingOverrideDimension(empireSilent, 0, 'alerts', 'all');
const allHeld = snapshotAlertsActive(empireSilent, 0, true);
const allEffective = getEffectivePolicy(empireSilent, 0, true);
assert('s29.2 override-all-vs-empire-silent', allHeld === true
  && allEffective.alerts === 'all'
  && areAlertsActive(allEffective) === true
  && areAlertsActive(empireSilent) === false
  && empireSilent.empireDefault.alerts === 'silent'
  && allHeld === (allEffective.alerts !== 'silent'), JSON.stringify({
  allHeld,
  effective: allEffective.alerts,
  raw: areAlertsActive(empireSilent),
  empire: empireSilent.empireDefault.alerts,
}));

let incidentsHeld = createPlayerSecurityState('ferengi');
incidentsHeld = setEmpireDefaultDimension(incidentsHeld, 'alerts', 'silent');
incidentsHeld = setHoldingOverrideDimension(incidentsHeld, 0, 'alerts', 'incidents');
assert('s29.2 incidents-override-is-active', snapshotAlertsActive(incidentsHeld, 0, true) === true
  && getEffectivePolicy(incidentsHeld, 0, true).alerts === 'incidents');

const noOverride = createPlayerSecurityState('ferengi');
assert('s29.3 no-override-matches-empire', snapshotAlertsActive(noOverride, 0, true) === areAlertsActive(noOverride)
  && snapshotAlertsActive(noOverride, 0, false) === areAlertsActive(noOverride)
  && noOverride.empireDefault.alerts === 'all'
  && snapshotAlertsActive(noOverride, 0, true) === true);

const lost = deactivateHoldingOverride(empireAll, 0);
assert('s29.3 lost-holding-uses-empire-alerts', snapshotAlertsActive(lost, 0, false) === true
  && getEffectivePolicy(lost, 0, false).alerts === 'all'
  && lost.holdings['0']?.alerts === 'silent'
  && lost.holdings['0']?.active === false
  && areAlertsActive(lost) === true, JSON.stringify({
  held: snapshotAlertsActive(lost, 0, true),
  unheld: snapshotAlertsActive(lost, 0, false),
  retained: lost.holdings['0'],
}));

const twinSilent = snapshotAlertsActiveReadout({
  policies: empireAll,
  systemIndex: 0,
  playerHolds: true,
  incidentsAlertsActive: false,
  incidentsAlertsMode: 'silent',
});
const twinAll = snapshotAlertsActiveReadout({
  policies: empireSilent,
  systemIndex: 0,
  playerHolds: true,
  incidentsAlertsActive: true,
  incidentsAlertsMode: 'all',
});
assert('s29.4 twins-agree', twinSilent.twinsAgree === true
  && twinSilent.alertsActive === false
  && twinSilent.incidentsAlertsActive === false
  && twinSilent.incidentsAlertsMode === twinSilent.effectiveAlerts
  && twinAll.twinsAgree === true
  && twinAll.alertsActive === true
  && twinAll.incidentsAlertsMode === 'all'
  && twinSilent.matchesEffective === true
  && twinAll.matchesEffective === true, JSON.stringify({ twinSilent, twinAll }));

const fire = alertsActiveInjectMustNotGiftFire({
  firingSolution: true,
  engagement_authorized: true,
  cultureFire: true,
});
const ledger = createIncidentLedger();
const openedWhileSilent = openIncident(ledger, {
  kind: 'distress',
  systemIndex: 0,
  actor: { instanceId: 's29-silent', kind: 'npc' },
  links: { distressKey: 's29-silent' },
  clocks: { localElapsedMs: 1 },
});
assert('s29.5 no-fire-gift', fire.firingSolutionPresent === false
  && fire.engagementAuthorizedPresent === false
  && fire.cultureFire === false
  && fire.tractorIsBoard === false
  && fire.twoModeRoe.join(',') === 'return-fire,defend'
  && fire.protectAll === false
  && offersProtectAll(empireAll) === false
  && ROE_MODES.length === 2
  && !Object.prototype.hasOwnProperty.call(fire.row, 'firingSolution')
  && !Object.prototype.hasOwnProperty.call(fire.row, FORBIDDEN_ALERTS_ACTIVE_FIRE)
  && tractorIsBoarding() === false
  && openedWhileSilent.created === true
  && ledger.incidents[openedWhileSilent.incident.incidentId], JSON.stringify({
  fire,
  opened: openedWhileSilent.created,
}));

assert('s29.6 landed-lanes-preserved', srcMain.includes('alertsActive: snapshotAlertsActive(')
  && srcMain.includes('alertsActive: createAlertsActiveProbeApi()')
  && srcMain.includes('alertsActive: areAlertsActive(getEffectivePolicy(')
  && !/alertsActive:\s*areAlertsActive\(state\.playerSecurity\)/.test(srcMain)
  && srcProbe.includes('S4-21 alerts-mode-gates-notifications')
  && srcProbe.includes('s4.alertsActive === (s4.mergedAlerts !== \'silent\')')
  && srcProbe.includes('S6.5 alert-modes')
  && srcProbe.includes('S6.14 append-only-withdrawal-does-not-flash')
  && srcPhase2.includes("export const ROE_MODES = Object.freeze(['return-fire', 'defend'])")
  && srcPhase2.includes('export function getEffectivePolicy')
  && srcPhase2.includes('export function areAlertsActive')
  && srcPhase4.includes('export function pushFlash')
  && srcPhase4.includes('export function shouldPulseFlash')
  && srcDock.includes('DOCK_CLEAR_LOCKED_FROM_REMASTERED = false')
  && !srcAlerts.includes('function getEffectivePolicy')
  && !srcAlerts.includes('function areAlertsActive')
  && !srcAlerts.includes('function pushFlash')
  && !srcAlerts.includes('function tractorIsBoarding')
  && !srcAlerts.includes('ROE_MODES =')
  && !srcAlerts.includes('git am')
  && !/from ['"][^'"]*remastered/i.test(srcAlerts)
  && BOARDING_IMPLEMENTED === true
  && EW_BOARDING === true
  && tractorIsBoarding() === false
  && POWER_CONSUMERS.includes('ew')
  && srcRoe.includes("export const ROE_MODES = Object.freeze(['return-fire', 'defend'])"));

assert('s4-21-empire-default-offline', areAlertsActive(createPlayerSecurityState('ferengi')) === true);
const silentStore = setEmpireDefaultDimension(createPlayerSecurityState('ferengi'), 'alerts', 'silent');
assert('s4-21-silent-offline', areAlertsActive(silentStore) === false);
const incidentsStore = setEmpireDefaultDimension(createPlayerSecurityState('ferengi'), 'alerts', 'incidents');
assert('s4-21-incidents-offline', areAlertsActive(incidentsStore) === true);

if (failed) {
  console.error(`Alerts-active offline probes: ${passed} passed, ${failed} failed`);
  for (const rowId of failures) console.error(`  FAIL ${rowId}`);
  process.exit(1);
}
console.log(`Alerts-active offline probes: ${passed} passed, ${failed} failed`);
