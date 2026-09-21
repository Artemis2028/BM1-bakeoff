/**
 * S28 — dockClear / UI-fit polish (layout / honest overflow only).
 *
 * Source of truth:
 * - docs/dock-clear/BM1-DOCK-CLEAR-UI-FIT-PROPOSAL.md
 * - docs/dock-clear/BM1-DOCK-CLEAR-ENGINE-DEPENDENCIES.md
 *
 * Written from those docs only. Does not crib BM1-remastered-work.
 * Subscribes to landed `--bm1-dock-clear` / snapshotDockFit.
 * DOCK_CLEAR_LOCKED_FROM_REMASTERED stays false.
 *
 * Hard gates:
 * 1. Fit only — visible target / map / related dock chrome at 1280×720.
 * 2. No gameplay rewrite.
 * 3. Never gift firingSolution / culture fire / engagement_authorized.
 * 4. Do not reopen #33–#59 / GUIDED §6.
 * 5. Named outs (Thaleron facility, combat retune, Flash locks, roster,
 *    away-team XP, alertsActive policy).
 * 6. Blind / remastered-lock false.
 * 7. Engine PR attaches baseline + after + overflow JSON.
 */

import { ROE_MODES } from './phase2-security.js';
import { tractorIsBoarding } from './phase9-ew.js';
import { STANDING_TIERS_LOCKED_FROM_REMASTERED } from './standing-tiers.js';

export const DOCK_CLEAR_LOCKED_FROM_REMASTERED = false;
export const DOCK_CLEAR_TOKEN = '--bm1-dock-clear';
export const DOCK_CLEAR_DEFAULT_PX = 88;
export const PROCESS_VIEWPORT = Object.freeze({ w: 1280, h: 720 });
export const FORBIDDEN_DOCK_CLEAR_FIRE = 'engagement_authorized';

export const HIDDEN_PHASE10_NEEDLES = Object.freeze([
  'Dominica',
  'Founders Watch',
  'JemHadar Relay',
  'Karemma Exchange',
  'Dosi Gate',
  'T-Rogoran Annex',
  'Gamma Quadrant',
]);

const REACHABLE_TARGET_CONTROLS = Object.freeze(['Hail', 'Board', 'Capture', 'Scuttle']);

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function requireHelper(helper, name) {
  if (typeof helper !== 'function') {
    const error = new Error(`dock-clear: ${name} missing`);
    error.missing = true;
    error.helper = name;
    throw error;
  }
}

export function requireDockClearHelpers(snapshotDockFit) {
  requireHelper(snapshotDockFit, 'snapshotDockFit');
}

export function parseCssPx(value, fallback = DOCK_CLEAR_DEFAULT_PX) {
  const n = Number.parseFloat(String(value ?? '').trim());
  return Number.isFinite(n) ? n : fallback;
}

export function readDockClearPx(styleValue, fallback = DOCK_CLEAR_DEFAULT_PX) {
  return parseCssPx(styleValue, fallback);
}

export function boxIsVisible(box) {
  const row = asObject(box);
  if (!row) return false;
  if (row.hidden === true) return false;
  const width = Number(row.panelW ?? row.width ?? (row.right - row.left));
  const height = Number(row.panelH ?? row.height ?? (row.bottom - row.top));
  if (Number.isFinite(width) && width <= 0) return false;
  if (Number.isFinite(height) && height <= 0) return false;
  return true;
}

export function boxClearsDock(box, dock, epsilon = 1) {
  if (!boxIsVisible(box)) return false;
  const dockBox = asObject(dock);
  if (!dockBox || dockBox.hidden === true) return false;
  const bottom = Number(box.bottom);
  const top = Number(dockBox.top);
  if (!Number.isFinite(bottom) || !Number.isFinite(top)) return false;
  return bottom <= top + epsilon;
}

export function rectsOverlap(a, b) {
  const left = asObject(a);
  const right = asObject(b);
  if (!left || !right) return false;
  return left.left < right.right
    && left.right > right.left
    && left.top < right.bottom
    && left.bottom > right.top;
}

export function labelFitsHost(label, host, epsilon = 1) {
  const box = asObject(label);
  const frame = asObject(host);
  if (!box || !frame) return false;
  return Number(box.left) >= Number(frame.left) - epsilon
    && Number(box.right) <= Number(frame.right) + epsilon
    && Number(box.top) >= Number(frame.top) - epsilon
    && Number(box.bottom) <= Number(frame.bottom) + epsilon;
}

export function findLeakedNames(text, needles = HIDDEN_PHASE10_NEEDLES) {
  const body = String(text || '');
  return needles.filter((name) => body.includes(name));
}

export function predictedSingleHoverDockWidth(input = {}) {
  const buttons = Math.max(1, Number(input.buttonCount) || 7);
  const idle = Number(input.idleButtonMax) || 46;
  const expanded = Number(input.expandedButtonMax) || 150;
  const gap = Number(input.gap) || 6;
  const paddingX = Number(input.paddingX) || 20;
  const borderX = Number(input.borderX) || 8;
  return paddingX + borderX + expanded + (buttons - 1) * idle + (buttons - 1) * gap;
}

export function dockHoverFitsViewport(input = {}) {
  const viewportW = Number(input.viewportW) || PROCESS_VIEWPORT.w;
  const width = predictedSingleHoverDockWidth(input);
  const centerX = Number(input.centerX);
  const left = Number.isFinite(centerX) ? centerX - width / 2 : (viewportW - width) / 2;
  const right = left + width;
  return {
    width,
    left,
    right,
    overflowX: left < -1 || right > viewportW + 1,
  };
}

export function dockClearInjectMustNotGiftFire(inject = {}) {
  const row = asObject(inject) ? { ...inject } : {};
  delete row.firingSolution;
  delete row.engagement_authorized;
  delete row[FORBIDDEN_DOCK_CLEAR_FIRE];
  delete row.cultureFire;
  delete row.culture;
  return {
    row,
    firingSolutionPresent: false,
    engagementAuthorizedPresent: false,
    cultureFire: false,
    tractorIsBoard: tractorIsBoarding() === true,
    twoModeRoe: ROE_MODES.slice(),
    standingLockFalse: STANDING_TIERS_LOCKED_FROM_REMASTERED === false,
  };
}

export function snapshotVisibleDockFit(input = {}) {
  const operator = asObject(input.operator) || null;
  const target = asObject(input.target) || null;
  const map = asObject(input.map) || null;
  const knowledge = asObject(input.knowledge) || null;
  const dock = asObject(input.dock) || null;
  const mapOpen = input.mapOpen === true;
  const closeClears = input.closeClearsDock !== false;
  const labels = Array.isArray(input.labeledSystems) ? input.labeledSystems : [];
  const leakedNames = Array.isArray(input.leakedNames)
    ? input.leakedNames.slice()
    : findLeakedNames(input.bodyText);
  const clippedControls = Array.isArray(input.clippedControls) ? input.clippedControls.slice() : [];
  const hover = dockHoverFitsViewport({
    viewportW: input.viewport?.w || PROCESS_VIEWPORT.w,
    buttonCount: input.dockButtonCount,
    centerX: dock && Number.isFinite(Number(dock.left)) && Number.isFinite(Number(dock.right))
      ? (Number(dock.left) + Number(dock.right)) / 2
      : undefined,
  });
  const operatorVisible = boxIsVisible(operator);
  const targetVisible = boxIsVisible(target);
  const mapVisible = mapOpen && boxIsVisible(map);
  const overflowX = Boolean(operatorVisible && operator.overflowX)
    || Boolean(targetVisible && target.overflowX)
    || Boolean(mapVisible && map.overflowX);
  return {
    clippedControls,
    overflowX,
    dockClear: Boolean(operatorVisible && boxClearsDock(operator, dock)),
    targetDockClear: Boolean(targetVisible && boxClearsDock(target, dock)),
    mapDockClear: Boolean(mapVisible && boxClearsDock(map, dock) && closeClears),
    knowledgeDockClear: Boolean(
      !knowledge
      || knowledge.hidden === true
      || boxClearsDock(knowledge, dock),
    ),
    mapOpen,
    leakedNames,
    labeledSystemsInBox: labels.every((row) => row?.inChartBox !== false),
    labeledSystems: labels,
    reachableControls: Array.isArray(input.reachableControls)
      ? input.reachableControls.slice()
      : REACHABLE_TARGET_CONTROLS.slice(),
    dockHover: {
      overflowX: hover.overflowX,
      width: hover.width,
      coversVisibleBox: Boolean(input.dockHoverCoversVisibleBox),
    },
    panelBottom: operatorVisible ? Math.round(Number(operator.bottom)) : null,
    targetBottom: targetVisible ? Math.round(Number(target.bottom)) : null,
    mapBottom: mapVisible ? Math.round(Number(map.bottom)) : null,
    dockTop: dock && dock.hidden !== true ? Math.round(Number(dock.top)) : null,
    token: DOCK_CLEAR_TOKEN,
    lockedFromRemastered: DOCK_CLEAR_LOCKED_FROM_REMASTERED === true,
  };
}

export function snapshotDockClear(input = {}) {
  const fit = snapshotVisibleDockFit(input);
  const fire = dockClearInjectMustNotGiftFire(input.fireInject || {
    firingSolution: true,
    engagement_authorized: true,
    cultureFire: true,
  });
  const viewport = asObject(input.viewport) || PROCESS_VIEWPORT;
  return {
    ok: true,
    missing: false,
    lockedFromRemastered: DOCK_CLEAR_LOCKED_FROM_REMASTERED === true,
    viewport: { w: Number(viewport.w) || PROCESS_VIEWPORT.w, h: Number(viewport.h) || PROCESS_VIEWPORT.h },
    clippedControls: fit.clippedControls,
    overflowX: fit.overflowX,
    operator: { dockClear: fit.dockClear },
    target: { dockClear: fit.targetDockClear },
    map: {
      dockClear: fit.mapDockClear,
      leakedNames: fit.leakedNames,
      open: fit.mapOpen,
      labeledSystemsInBox: fit.labeledSystemsInBox,
    },
    knowledge: { dockClear: fit.knowledgeDockClear },
    fire: {
      firingSolutionPresent: fire.firingSolutionPresent,
      engagementAuthorizedPresent: fire.engagementAuthorizedPresent,
      cultureFire: fire.cultureFire,
    },
    tractorIsBoard: fire.tractorIsBoard,
    twoModeRoe: fire.twoModeRoe,
    standingLockFalse: fire.standingLockFalse,
    fit,
  };
}
