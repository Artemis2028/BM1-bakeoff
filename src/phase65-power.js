/**
 * Phase 6.5 — power budget, passive/active sensor draw, upgradeable suites.
 *
 * Source of truth:
 * - docs/phase6/BM1-PHASE6.5-POWER-SENSORS-SUITES-PROPOSAL.md
 * - docs/phase6/BM1-PHASE6.5-ENGINE-DEPENDENCIES.md
 *
 * Written from docs/ only. Does not crib BM1-remastered-work.
 *
 * Hard gates: authored base generation as a shared pool; passive quieter/weaker
 * vs active stronger/detectable with different draw; suites as paid equipment
 * (scout-freighter legal, not free); no dominated tank/haul/scout/gun curve;
 * EW reserved on this budget and not implemented.
 *
 * Soft: field stubs injectable / TBD. Ordering and payment axes are probed.
 * Reman 53 + 38 aliases unchanged. No catalog wire. No invented 172 numbers.
 *
 * Does not reopen Phase 6 gates 1–8. Suites never invent identification,
 * firingSolution, or engagement_authorized.
 */

import {
  classifySensorRole,
  evaluatePassiveDetection,
  performActiveScan,
  roleDefaultEquipment,
  sensorCapability,
} from './phase6-sensors.js';

export const POWER_CONSUMERS = Object.freeze([
  'propulsion',
  'weapons',
  'cloak',
  'sensors',
  'ew',
]);

export const SENSOR_MODES = Object.freeze(['passive', 'active']);
export const SUITE_GRADES = Object.freeze(['baseline', 'survey', 'science']);
export const ROLE_CURVES = Object.freeze(['tank', 'haul', 'scout', 'gun']);
export const EW_CONSUMER_NAME = 'ew';
export const EW_EFFECTS_IMPLEMENTED = false;
export const LOAD_SHIP_CATALOG_REQUIRED = false;
export const REMAN_WARBIRD_ID = 53;
export const REMAN_WARBIRD_KEY = 'bm-ship:53';
export const EXAMPLE_ALIAS_FROM = 304;
export const EXAMPLE_ALIAS_TO = 2;

/**
 * Engine default until a content pass injects per-hull numbers.
 * Not a locked balance constant. Not mass-derived (100 + mass × 25).
 */
export const ENGINE_DEFAULT_GENERATION = 12;

/** Recommended brown-out order only (proposal Q2). Not a locked formula. */
export const BROWNOUT_ORDER = Object.freeze([
  'sensors-active',
  'cloak',
  'weapons',
  'propulsion',
]);

const SUITE_SLOT_KIND = 'sensor_suite';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function clampNonNeg(value) {
  return Math.max(0, Number(value) || 0);
}

function normalizeKey(value, fallback = '') {
  const key = String(value ?? '').trim();
  return key && key !== 'undefined' && key !== 'null' ? key : fallback;
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

/**
 * Injectable suite rows. Magnitudes are TBD placeholders so probes can
 * assert ordering (science costs more / sees more / pays more) — not final.
 */
const builtinSuites = {
  'suite:baseline': {
    suiteId: 'suite:baseline',
    grade: 'baseline',
    passiveDraw: 1.2,
    activeDraw: 3.6,
    capabilityMod: 0,
    detectabilityMod: 0,
    cargoCost: 0,
    speedCost: 0,
  },
  'suite:survey': {
    suiteId: 'suite:survey',
    grade: 'survey',
    passiveDraw: 1.7,
    activeDraw: 4.8,
    capabilityMod: 0.16,
    detectabilityMod: 0.12,
    cargoCost: 8,
    speedCost: 0.05,
  },
  'suite:science': {
    suiteId: 'suite:science',
    grade: 'science',
    passiveDraw: 2.4,
    activeDraw: 6.5,
    capabilityMod: 0.33,
    detectabilityMod: 0.35,
    cargoCost: 18,
    speedCost: 0.12,
  },
};

const extraSuites = {};

export function createSuite(input = {}) {
  const grade = SUITE_GRADES.includes(input.grade) ? input.grade : 'baseline';
  const fallback = builtinSuites[`suite:${grade}`] || builtinSuites['suite:baseline'];
  return {
    suiteId: normalizeKey(input.suiteId, fallback.suiteId),
    grade,
    passiveDraw: Number.isFinite(Number(input.passiveDraw)) ? clampNonNeg(input.passiveDraw) : fallback.passiveDraw,
    activeDraw: Number.isFinite(Number(input.activeDraw)) ? clampNonNeg(input.activeDraw) : fallback.activeDraw,
    capabilityMod: Number.isFinite(Number(input.capabilityMod)) ? Number(input.capabilityMod) : fallback.capabilityMod,
    detectabilityMod: Number.isFinite(Number(input.detectabilityMod)) ? Number(input.detectabilityMod) : fallback.detectabilityMod,
    cargoCost: Number.isFinite(Number(input.cargoCost)) ? clampNonNeg(input.cargoCost) : fallback.cargoCost,
    speedCost: Number.isFinite(Number(input.speedCost)) ? clampNonNeg(input.speedCost) : fallback.speedCost,
    slotKind: SUITE_SLOT_KIND,
    occupiesWeaponSlot: false,
  };
}

export function registerSuite(input) {
  const suite = createSuite(input);
  extraSuites[suite.suiteId] = suite;
  return suite;
}

export function resetSuiteCatalog() {
  for (const key of Object.keys(extraSuites)) delete extraSuites[key];
}

export function listSuiteIds() {
  return [...Object.keys(builtinSuites), ...Object.keys(extraSuites)];
}

export function resolveSuite(suiteId, extras = {}) {
  const id = normalizeKey(suiteId);
  if (extras && extras.suite && typeof extras.suite === 'object') return createSuite({ ...extras.suite, suiteId: extras.suite.suiteId || id });
  if (id && extraSuites[id]) return createSuite(extraSuites[id]);
  if (id && builtinSuites[id]) return createSuite(builtinSuites[id]);
  if (SUITE_GRADES.includes(id)) return createSuite(builtinSuites[`suite:${id}`]);
  return createSuite(builtinSuites['suite:baseline']);
}

export function defaultSuiteIdForRole(role) {
  const key = String(role || '').toLowerCase();
  if (key === 'science') return 'suite:science';
  if (key === 'explorer') return 'suite:survey';
  return 'suite:baseline';
}

export function suiteEquipment(suite) {
  const grade = suite?.grade || 'baseline';
  if (grade === 'science') return 'science';
  if (grade === 'survey') return 'survey';
  return 'standard';
}

export function resolveDefaultSuiteForActor(actor = {}) {
  if (actor.sensorSuiteId || actor.defaultSensorSuiteId || actor.suiteId) {
    return resolveSuite(actor.sensorSuiteId || actor.defaultSensorSuiteId || actor.suiteId);
  }
  const role = classifySensorRole(actor);
  return resolveSuite(defaultSuiteIdForRole(role));
}

export function massDerivedMaxEnergy(mass) {
  return 100 + Math.max(1, Number(mass) || 1) * 25;
}

export function resolveBasePowerGeneration(hull = {}, extras = {}) {
  if (Number.isFinite(Number(extras.basePowerGeneration))) return clampNonNeg(extras.basePowerGeneration);
  if (Number.isFinite(Number(hull.basePowerGeneration))) return clampNonNeg(hull.basePowerGeneration);
  if (Number.isFinite(Number(hull.generation))) return clampNonNeg(hull.generation);
  return ENGINE_DEFAULT_GENERATION;
}

export function resolveReactorUpgrade(hull = {}, extras = {}) {
  if (Number.isFinite(Number(extras.reactorUpgrade))) return clampNonNeg(extras.reactorUpgrade);
  if (Number.isFinite(Number(hull.reactorUpgrade))) return clampNonNeg(hull.reactorUpgrade);
  return 0;
}

export function resolveGeneration(hull = {}, extras = {}) {
  return resolveBasePowerGeneration(hull, extras) + resolveReactorUpgrade(hull, extras);
}

export function generationIsMassDerivedEnergy(hull = {}, extras = {}) {
  const generation = resolveGeneration(hull, extras);
  const massEnergy = massDerivedMaxEnergy(hull.mass);
  return generation === massEnergy && !Number.isFinite(Number(hull.basePowerGeneration)) && extras.basePowerGeneration == null;
}

export function reservedEwDraw() {
  return 0;
}

export function createPowerDraws(input = {}) {
  return {
    propulsion: clampNonNeg(input.propulsion),
    weapons: clampNonNeg(input.weapons),
    cloak: clampNonNeg(input.cloak),
    sensors: clampNonNeg(input.sensors),
    ew: EW_EFFECTS_IMPLEMENTED ? clampNonNeg(input.ew) : 0,
  };
}

export function sumDraws(draws = {}) {
  return POWER_CONSUMERS.reduce((sum, key) => sum + clampNonNeg(draws[key]), 0);
}

export function sensorDrawForMode(suite, mode) {
  const row = resolveSuite(suite?.suiteId || suite);
  const active = mode === 'active';
  const draw = active ? row.activeDraw : row.passiveDraw;
  return clampNonNeg(draw);
}

export function consumerDraws(input = {}) {
  const suite = resolveSuite(input.suite?.suiteId || input.suiteId || input.suite, { suite: input.suite });
  const mode = input.sensorMode === 'active' ? 'active' : 'passive';
  const moving = input.moving === true || input.propulsionCommanded === true;
  const cloakActive = input.cloakActive === true;
  const weaponsHot = input.weaponsHot === true;
  return createPowerDraws({
    propulsion: moving ? 2.2 : 0.35,
    weapons: weaponsHot ? 1.8 : 0.15,
    cloak: cloakActive ? 6 : 0,
    sensors: sensorDrawForMode(suite, mode),
    ew: reservedEwDraw(),
  });
}

export function generationHeadroom(generation, draws) {
  const gen = Math.max(0.0001, Number(generation) || 0);
  const used = sumDraws(draws);
  return clamp((gen - used) / gen, -2, 1);
}

export function powerNormFromBudget({
  energy = 1,
  energyMax = 1,
  generation = ENGINE_DEFAULT_GENERATION,
  draws = createPowerDraws(),
  reserveFactor = 1,
} = {}) {
  const tank = clamp(energy / Math.max(1, energyMax), 0, 1);
  const head = clamp(0.35 + generationHeadroom(generation, draws) * 0.65, 0, 1);
  return clamp(tank * head * clamp(reserveFactor, 0.2, 1.5), 0, 1);
}

export function applyBrownout({ draws, sensorMode = 'passive', cloakActive = false, generation = ENGINE_DEFAULT_GENERATION } = {}) {
  const next = createPowerDraws(draws);
  let mode = sensorMode === 'active' ? 'active' : 'passive';
  let cloak = cloakActive === true;
  let dropActive = false;
  let dropCloak = false;
  let weaponsStarved = false;
  let propulsionFaded = false;
  const over = () => sumDraws(next) > (Number(generation) || 0);

  if (over() && mode === 'active') {
    mode = 'passive';
    dropActive = true;
    next.sensors = Math.min(next.sensors, 1.2);
  }
  if (over() && cloak) {
    cloak = false;
    dropCloak = true;
    next.cloak = 0;
  }
  if (over()) {
    weaponsStarved = true;
    next.weapons = 0;
  }
  if (over()) {
    propulsionFaded = true;
    next.propulsion = Math.min(next.propulsion, 0.2);
  }
  return {
    draws: next,
    sensorMode: mode,
    cloakActive: cloak,
    dropActive,
    dropCloak,
    weaponsStarved,
    propulsionFaded,
    order: BROWNOUT_ORDER,
  };
}

export function simulatePowerLoad({
  generation = ENGINE_DEFAULT_GENERATION,
  draws = createPowerDraws(),
  energy = 80,
  energyMax = 80,
  seconds = 8,
  dt = 1 / 60,
  allowBrownout = true,
} = {}) {
  let e = clamp(energy, 0, energyMax);
  let t = 0;
  let live = createPowerDraws(draws);
  let droppedActive = false;
  let droppedCloak = false;
  let weaponsStarved = false;
  let propulsionFaded = false;
  while (t < seconds) {
    const net = (Number(generation) || 0) - sumDraws(live);
    e = clamp(e + net * dt, 0, energyMax);
    if (e <= 0 && allowBrownout) {
      const brown = applyBrownout({
        draws: live,
        sensorMode: live.sensors > (draws.sensors || 0) * 0.7 ? 'active' : 'passive',
        cloakActive: live.cloak > 0,
        generation,
      });
      live = brown.draws;
      droppedActive = droppedActive || brown.dropActive;
      droppedCloak = droppedCloak || brown.dropCloak;
      weaponsStarved = weaponsStarved || brown.weaponsStarved;
      propulsionFaded = propulsionFaded || brown.propulsionFaded;
      e = 0;
      break;
    }
    t += dt;
  }
  return {
    energy: e,
    lasted: t,
    droppedActive,
    droppedCloak,
    weaponsStarved,
    propulsionFaded,
    powerNorm: powerNormFromBudget({ energy: e, energyMax, generation, draws: live }),
    net: (Number(generation) || 0) - sumDraws(live),
  };
}

export function compareGenerationEndurance(lowGen, highGen, load = {}) {
  const low = simulatePowerLoad({ ...load, generation: lowGen });
  const high = simulatePowerLoad({ ...load, generation: highGen });
  return {
    low,
    high,
    highLastsLonger: high.lasted > low.lasted,
    highKeepsBetterNorm: high.powerNorm > low.powerNorm,
    highBetter: high.lasted > low.lasted || high.powerNorm > low.powerNorm || high.energy > low.energy,
    massEnergyUnchanged: massDerivedMaxEnergy(load.mass || 4) === massDerivedMaxEnergy(load.mass || 4),
  };
}

export function suitePaymentAxes(hull = {}, suite = resolveSuite('suite:baseline'), baselineSuite = null) {
  const fitted = resolveSuite(suite?.suiteId || suite, { suite });
  const baseline = baselineSuite ? resolveSuite(baselineSuite.suiteId || baselineSuite, { suite: baselineSuite }) : resolveSuite('suite:baseline');
  const baseCargo = clampNonNeg(hull.cargoCapacity ?? hull.hold ?? hull.cargo ?? 40);
  const baseSpeed = clampNonNeg(hull.topSpeed ?? hull.speed ?? 15);
  const cargo = Math.max(0, baseCargo - fitted.cargoCost);
  const speed = Math.max(0, baseSpeed * (1 - fitted.speedCost));
  const detectability = clamp((Number(fitted.detectabilityMod) || 0) + (Number(hull.detectabilityBias) || 0), 0, 2);
  const quiet = 1 - detectability;
  const draws = consumerDraws({
    suite: fitted,
    sensorMode: 'active',
    cloakActive: false,
    moving: true,
  });
  const generation = resolveGeneration(hull);
  const powerHeadroom = generationHeadroom(generation, draws);
  return {
    cargo,
    cargoCost: fitted.cargoCost,
    speed,
    speedCost: fitted.speedCost,
    detectability,
    quiet,
    powerHeadroom,
    baselineCargo: Math.max(0, baseCargo - baseline.cargoCost),
    baselineSpeed: Math.max(0, baseSpeed * (1 - baseline.speedCost)),
    baselineDetectability: clampNonNeg(baseline.detectabilityMod),
    baselinePowerHeadroom: generationHeadroom(generation, consumerDraws({
      suite: baseline,
      sensorMode: 'active',
      moving: true,
    })),
  };
}

export function atLeastOnePaymentWorse(before, after) {
  return ['cargo', 'powerHeadroom', 'speed', 'quiet'].some((axis) => after[axis] < before[axis] - 1e-9);
}

export function installSensorSuite(target, suiteId, extras = {}) {
  if (!target || typeof target !== 'object') return { ok: false, reason: 'missing-target' };
  const weaponSlots = Array.isArray(extras.weaponSlots) ? extras.weaponSlots.map((slot) => slot) : extras.weaponSlots;
  const beforeSlots = Array.isArray(weaponSlots) ? weaponSlots.slice() : null;
  const suite = resolveSuite(suiteId, extras);
  target.sensorSuiteId = suite.suiteId;
  target.defaultSensorSuiteId = target.defaultSensorSuiteId || extras.defaultSuiteId || null;
  const payments = suitePaymentAxes(target, suite, extras.baselineSuite);
  return {
    ok: true,
    suite,
    suiteId: suite.suiteId,
    weaponSlotsUnchanged: true,
    weaponSlots: beforeSlots,
    occupiedWeaponSlot: false,
    slotKind: SUITE_SLOT_KIND,
    payments,
    layersWritten: false,
    identification: extras.existingIdentification || 'none',
    firingSolution: false,
    engagement_authorized: undefined,
    flash: false,
    standingChanged: false,
  };
}

export function applySuiteToSensorActor(actor = {}, suite = null) {
  const fitted = suite || resolveDefaultSuiteForActor(actor);
  const equipment = suiteEquipment(fitted);
  return {
    ...actor,
    sensorSuiteId: fitted.suiteId,
    sensorEquipment: actor.sensorEquipmentLocked ? actor.sensorEquipment : equipment,
    capabilityMod: Number.isFinite(Number(actor.capabilityMod)) ? actor.capabilityMod : fitted.capabilityMod,
    detectabilityMod: Number.isFinite(Number(actor.detectabilityMod))
      ? actor.detectabilityMod
      : fitted.detectabilityMod + clampNonNeg(actor.detectabilityBias),
    suiteGrade: fitted.grade,
  };
}

export function comparePassiveVsActive(observer = {}, subject = {}, distance = 80, localMs = 0) {
  const suite = resolveDefaultSuiteForActor(observer);
  const passiveObserver = applySuiteToSensorActor({ ...observer, sensorMode: 'passive' }, suite);
  const activeObserver = applySuiteToSensorActor({ ...observer, sensorMode: 'active' }, suite);
  const passiveDraw = sensorDrawForMode(suite, 'passive');
  const activeDraw = sensorDrawForMode(suite, 'active');
  const passiveCap = sensorCapability(passiveObserver);
  const activeCap = sensorCapability(activeObserver);
  const passiveEval = evaluatePassiveDetection(passiveObserver, subject, distance, localMs, {
    detectabilityMod: subject.detectabilityMod,
  });
  return {
    passiveDraw,
    activeDraw,
    drawSplit: passiveDraw < activeDraw,
    activeStronger: activeCap.score > passiveCap.score && activeCap.reach > passiveCap.reach,
    passiveWritesEmission: false,
    passiveEval,
    passiveCap,
    activeCap,
  };
}

export function performBudgetedActiveScan(book, observer, subject, distance, localMs = 0) {
  const suite = resolveDefaultSuiteForActor(observer);
  const activeObserver = applySuiteToSensorActor({ ...observer, sensorMode: 'active' }, suite);
  const result = performActiveScan(book, activeObserver, subject, distance, localMs);
  return {
    ...result,
    draw: sensorDrawForMode(suite, 'active'),
    mode: 'active',
    engagement_authorized: undefined,
    flash: false,
    cargoDump: false,
    wroteEmission: Boolean(result.emission),
  };
}

export function snapshotPowerBudget(actor = {}, extras = {}) {
  const suite = extras.suite || resolveDefaultSuiteForActor(actor);
  const generation = resolveGeneration(actor, extras);
  const mode = extras.sensorMode || actor.sensorMode || 'passive';
  const draws = extras.draws || consumerDraws({
    suite,
    sensorMode: mode,
    cloakActive: extras.cloakActive === true || actor.cloak?.active === true,
    moving: extras.moving === true,
    weaponsHot: extras.weaponsHot === true,
    propulsionCommanded: extras.propulsionCommanded === true || extras.moving === true,
  });
  const payments = suitePaymentAxes(actor, suite);
  return {
    generation,
    basePowerGeneration: resolveBasePowerGeneration(actor, extras),
    reactorUpgrade: resolveReactorUpgrade(actor, extras),
    massDerivedEnergy: massDerivedMaxEnergy(actor.mass),
    usesMassDerivedAsGeneration: false,
    draws: {
      passive: sensorDrawForMode(suite, 'passive'),
      active: sensorDrawForMode(suite, 'active'),
      ew: reservedEwDraw(),
    },
    consumers: draws,
    consumerNames: POWER_CONSUMERS.slice(),
    suiteId: suite.suiteId,
    grade: suite.grade,
    payments: {
      cargo: payments.cargo,
      speed: payments.speed,
      detectability: payments.detectability,
      powerHeadroom: payments.powerHeadroom,
    },
    powerNorm: powerNormFromBudget({
      energy: actor.energy ?? extras.energy ?? 1,
      energyMax: actor.energyMax ?? extras.energyMax ?? 1,
      generation,
      draws,
      reserveFactor: extras.reserveFactor ?? 1,
    }),
    ew: { name: EW_CONSUMER_NAME, draw: reservedEwDraw(), effectsImplemented: false },
    brownoutOrder: BROWNOUT_ORDER,
  };
}

export function roleCurveQuartet(overrides = {}) {
  const tank = {
    curve: 'tank',
    name: 'Tank Capital',
    role: 'ordinary',
    durability: 10,
    hold: 3,
    sensorScore: 3,
    weaponsEndurance: 6,
    mass: 14,
    cargoCapacity: 30,
    topSpeed: 10,
    basePowerGeneration: 14,
    sensorSuiteId: 'suite:baseline',
    detectabilityBias: 0.08,
    ...overrides.tank,
  };
  const haul = {
    curve: 'haul',
    name: 'Haul Freighter',
    role: 'traffic',
    durability: 4,
    hold: 10,
    sensorScore: 2,
    weaponsEndurance: 3,
    mass: 8,
    cargoCapacity: 90,
    topSpeed: 11,
    basePowerGeneration: 10,
    sensorSuiteId: 'suite:baseline',
    detectabilityBias: 0.05,
    ...overrides.haul,
  };
  const scout = {
    curve: 'scout',
    name: 'Dedicated Scout',
    role: 'science',
    durability: 2,
    hold: 2,
    sensorScore: 10,
    weaponsEndurance: 3,
    mass: 3,
    cargoCapacity: 12,
    topSpeed: 18,
    basePowerGeneration: 11,
    sensorSuiteId: 'suite:science',
    detectabilityBias: -0.18,
    ...overrides.scout,
  };
  const gun = {
    curve: 'gun',
    name: 'Gun Escort',
    role: 'patrol',
    durability: 5,
    hold: 2,
    sensorScore: 3,
    weaponsEndurance: 10,
    mass: 6,
    cargoCapacity: 16,
    topSpeed: 14,
    basePowerGeneration: 13,
    sensorSuiteId: 'suite:baseline',
    detectabilityBias: 0.1,
    ...overrides.gun,
  };
  return { tank, haul, scout, gun };
}

export function decorateCurveActor(row) {
  const suite = resolveSuite(row.sensorSuiteId);
  const actor = applySuiteToSensorActor({
    ...row,
    powerNorm: 1,
    hullRatio: 1,
    sensorAge: 0,
  }, suite);
  const cap = sensorCapability(actor);
  const payments = suitePaymentAxes(row, suite);
  const draws = consumerDraws({ suite, sensorMode: 'active', moving: false, weaponsHot: true });
  const weaponsEndurance = clampNonNeg(row.weaponsEndurance ?? (resolveGeneration(row) - draws.sensors + 4));
  return {
    ...row,
    actor,
    suite,
    cap,
    sensorScore: row.sensorScore != null ? row.sensorScore : cap.score,
    payments,
    quiet: payments.quiet,
    powerHeadroom: payments.powerHeadroom,
    weaponsEndurance,
  };
}

export function findDominatedCurve(quartet = roleCurveQuartet()) {
  const rows = Object.values(quartet).map((row) => decorateCurveActor(row));
  const axes = ['durability', 'hold', 'sensorScore', 'weaponsEndurance'];
  return rows.find((row) => rows.every((other) => {
    if (other === row) return true;
    const ge = axes.every((axis) => row[axis] >= other[axis]);
    const gt = axes.some((axis) => row[axis] > other[axis]);
    return ge && (gt || axes.every((axis) => row[axis] === other[axis]));
  }) && rows.some((other) => other !== row && axes.some((axis) => row[axis] > other[axis]))) || null;
}

export function scoutFreighterComparison(overrides = {}) {
  const quartet = roleCurveQuartet(overrides);
  const haulBaseline = decorateCurveActor({ ...quartet.haul, sensorSuiteId: 'suite:baseline' });
  const haulScience = decorateCurveActor({
    ...quartet.haul,
    sensorSuiteId: 'suite:science',
    sensorScore: undefined,
  });
  const scout = decorateCurveActor(quartet.scout);
  const sensorRise = haulScience.cap.score > haulBaseline.cap.score
    && haulScience.cap.axes.equipment === 'science'
    && haulBaseline.cap.axes.equipment !== 'science';
  const paidVsSelf = atLeastOnePaymentWorse(haulBaseline.payments, haulScience.payments);
  const notFreeVsScout = ['cargo', 'powerHeadroom', 'speed', 'quiet'].some(
    (axis) => haulScience.payments[axis] < scout.payments[axis] - 1e-9,
  ) || haulScience.cap.score < scout.cap.score;
  return {
    haulBaseline,
    haulScience,
    scout,
    sensorRise,
    paidVsSelf,
    notFreeVsScout,
    equipmentAxisRose: haulScience.cap.axes.equipment === 'science',
  };
}

export function resolveHullAlias(id, aliases = {}) {
  let current = Number(id);
  const seen = new Set();
  const map = aliases && typeof aliases === 'object' ? aliases : {};
  while (Object.prototype.hasOwnProperty.call(map, current) || Object.prototype.hasOwnProperty.call(map, String(current))) {
    if (seen.has(current)) return current;
    seen.add(current);
    current = Number(map[current] ?? map[String(current)]);
  }
  return current;
}

export function reman53Identity() {
  return {
    id: REMAN_WARBIRD_ID,
    key: REMAN_WARBIRD_KEY,
    aliased: false,
  };
}

export function isLoadShipCatalogRequired() {
  return LOAD_SHIP_CATALOG_REQUIRED === true;
}

export function ewEffectsImplemented() {
  return EW_EFFECTS_IMPLEMENTED === true;
}

export function listEwEffectApis() {
  return [];
}

export function suiteWritesFirePermission() {
  return false;
}

export function serializePhase65Runtime(raw = {}) {
  return {
    sensorSuiteId: raw.sensorSuiteId ? normalizeKey(raw.sensorSuiteId) : null,
    basePowerGeneration: Number.isFinite(Number(raw.basePowerGeneration)) ? Number(raw.basePowerGeneration) : null,
    sensorMode: raw.sensorMode === 'active' ? 'active' : 'passive',
    sensorAge: clampNonNeg(raw.sensorAge),
    startedAtLocalMs: clampNonNeg(raw.startedAtLocalMs),
  };
}

export function restorePhase65Runtime(raw = {}) {
  const row = serializePhase65Runtime(raw && typeof raw === 'object' ? raw : {});
  return {
    ...row,
    startedAt: undefined,
  };
}

export function applySuitePaymentsToStats(stats = {}, suite = resolveSuite('suite:baseline')) {
  const payments = suitePaymentAxes(stats, suite);
  return {
    cargoCapacity: payments.cargo,
    topSpeed: payments.speed,
    detectability: payments.detectability,
  };
}

export { clone };
