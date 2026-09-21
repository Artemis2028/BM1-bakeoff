/**
 * S29 — alertsActive snapshot readout (effective holding / empire policy).
 *
 * Source of truth:
 * - docs/alerts-active/BM1-ALERTS-ACTIVE-SNAPSHOT-PROPOSAL.md
 * - docs/alerts-active/BM1-ALERTS-ACTIVE-ENGINE-DEPENDENCIES.md
 *
 * Written from those docs only. Does not crib BM1-remastered-work.
 * Subscribes to landed getEffectivePolicy / areAlertsActive.
 * ALERTS_ACTIVE_LOCKED_FROM_REMASTERED stays false.
 *
 * Hard gates:
 * 1. Top-level snapshot().alertsActive (+ named twins) follows effective
 *    policy, not raw playerSecurity, when a holding override is active.
 * 2. No ROE / Phase 2 rewrite — two modes stay; silent is display.
 * 3. Never gift firingSolution / culture fire / engagement_authorized.
 * 4. Do not reopen #33–#62 / Phase 4 hard gates.
 * 5. Named outs (away-team XP, P10 roster, Thaleron, combat retune,
 *    Flash locks, dockClear reopen). Do not restore S4-21 to false.
 * 6. Blind / remastered-lock false.
 * 7. Thin call-site + override-active probe; replay Phase 4 / doctrine.
 */

import {
  ROE_MODES,
  areAlertsActive,
  getEffectivePolicy,
  offersProtectAll,
} from './phase2-security.js';
import { tractorIsBoarding } from './phase9-ew.js';

export const ALERTS_ACTIVE_LOCKED_FROM_REMASTERED = false;
export const FORBIDDEN_ALERTS_ACTIVE_FIRE = 'engagement_authorized';

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function requireHelper(helper, name) {
  if (typeof helper !== 'function') {
    const error = new Error(`alerts-active: ${name} missing`);
    error.missing = true;
    error.helper = name;
    throw error;
  }
}

export function requireAlertsActiveHelpers() {
  requireHelper(getEffectivePolicy, 'getEffectivePolicy');
  requireHelper(areAlertsActive, 'areAlertsActive');
}

export function snapshotAlertsActive(policies, systemIndex, playerHolds = false) {
  requireAlertsActiveHelpers();
  return areAlertsActive(getEffectivePolicy(policies, systemIndex, playerHolds));
}

export function alertsActiveInjectMustNotGiftFire(inject = {}) {
  const row = asObject(inject) ? { ...inject } : {};
  delete row.firingSolution;
  delete row.engagement_authorized;
  delete row[FORBIDDEN_ALERTS_ACTIVE_FIRE];
  delete row.cultureFire;
  delete row.culture;
  return {
    row,
    firingSolutionPresent: false,
    engagementAuthorizedPresent: false,
    cultureFire: false,
    tractorIsBoard: tractorIsBoarding() === true,
    twoModeRoe: ROE_MODES.slice(),
    protectAll: false,
  };
}

export function snapshotAlertsActiveReadout(input = {}) {
  requireAlertsActiveHelpers();
  const policies = input.policies;
  const systemIndex = input.systemIndex;
  const playerHolds = input.playerHolds === true;
  const effective = getEffectivePolicy(policies, systemIndex, playerHolds);
  const alertsActive = areAlertsActive(effective);
  const incidentsAlertsActive = input.incidentsAlertsActive == null
    ? alertsActive
    : input.incidentsAlertsActive === true;
  const incidentsAlertsMode = input.incidentsAlertsMode == null
    ? effective.alerts
    : input.incidentsAlertsMode;
  const fire = alertsActiveInjectMustNotGiftFire(input.fireInject || {
    firingSolution: true,
    engagement_authorized: true,
    cultureFire: true,
  });
  return {
    ok: true,
    missing: false,
    lockedFromRemastered: ALERTS_ACTIVE_LOCKED_FROM_REMASTERED === true,
    alertsActive,
    effectiveAlerts: effective.alerts,
    incidentsAlertsActive,
    incidentsAlertsMode,
    empireDefaultAlerts: policies?.empireDefault?.alerts,
    matchesEffective: alertsActive === (effective.alerts !== 'silent'),
    twinsAgree: alertsActive === incidentsAlertsActive && incidentsAlertsMode === effective.alerts,
    source: effective.source,
    holding: effective.holding === true,
    overrideActive: effective.active === true,
    fire: {
      firingSolutionPresent: fire.firingSolutionPresent,
      engagementAuthorizedPresent: fire.engagementAuthorizedPresent,
      cultureFire: fire.cultureFire,
    },
    tractorIsBoard: fire.tractorIsBoard,
    twoModeRoe: fire.twoModeRoe,
    protectAll: offersProtectAll(policies) === true,
  };
}

export {
  ROE_MODES,
  areAlertsActive,
  getEffectivePolicy,
  offersProtectAll,
};
