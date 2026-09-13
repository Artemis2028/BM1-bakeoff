#!/usr/bin/env node
/**
 * Offline Phase 6.5 generation / draw / suite-payment / role-curve checks.
 * Written from docs/phase6/ Phase 6.5 briefs only. Does not crib remastered-work.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applyLostTrackSameTick,
  applyPassiveUpdate,
  contactPresentation,
  createContactBook,
  emptyContactBook,
  evaluatePassiveDetection,
  findContact,
  firstFrameVisibility,
  initHullCloak,
  noticeScanEmission,
  observerHasFiringSolution,
  observerKeyForNpc,
  observerKeyForPlayer,
  observerSeesSubject,
  performActiveScan,
  scienceOutperformsOrdinary,
  scienceVsOrdinaryFixture,
  seedFromReport,
  sensorCapability,
  shouldEnforceUnknownAccess,
  subjectKeyForNpc,
  upsertContact,
} from '../src/phase6-sensors.js';
import {
  ENGINE_DEFAULT_GENERATION,
  EW_CONSUMER_NAME,
  EXAMPLE_ALIAS_FROM,
  EXAMPLE_ALIAS_TO,
  LOAD_SHIP_CATALOG_REQUIRED,
  POWER_CONSUMERS,
  REMAN_WARBIRD_ID,
  REMAN_WARBIRD_KEY,
  applySuiteToSensorActor,
  atLeastOnePaymentWorse,
  compareGenerationEndurance,
  comparePassiveVsActive,
  consumerDraws,
  createPowerDraws,
  ewEffectsImplemented,
  findDominatedCurve,
  generationIsMassDerivedEnergy,
  installSensorSuite,
  isLoadShipCatalogRequired,
  listEwEffectApis,
  massDerivedMaxEnergy,
  performBudgetedActiveScan,
  powerNormFromBudget,
  reman53Identity,
  resolveGeneration,
  resolveHullAlias,
  resolveSuite,
  restorePhase65Runtime,
  roleCurveQuartet,
  scoutFreighterComparison,
  sensorDrawForMode,
  serializePhase65Runtime,
  snapshotPowerBudget,
  suiteEquipment,
  suiteWritesFirePermission,
} from '../src/phase65-power.js';

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

assert('s10.startup-smoke', typeof resolveGeneration === 'function' && typeof installSensorSuite === 'function');
assert('s10.catalog-wire-flag', isLoadShipCatalogRequired() === true && LOAD_SHIP_CATALOG_REQUIRED === true);
assert('s10.ew-not-implemented', ewEffectsImplemented() === false && listEwEffectApis().length === 0);
assert('s10.suite-not-fire-gate', suiteWritesFirePermission() === false);

const sameMass = { mass: 6, role: 'patrol', cargoCapacity: 40, topSpeed: 14, sensorSuiteId: 'suite:baseline' };
const low = { ...sameMass, basePowerGeneration: 7 };
const high = { ...sameMass, basePowerGeneration: 18 };
assert('s10.1-generation-not-mass-energy', resolveGeneration(low) !== massDerivedMaxEnergy(low.mass));
assert('s10.1-same-mass-same-tank', massDerivedMaxEnergy(low.mass) === massDerivedMaxEnergy(high.mass));
assert('s10.1-authored-differs', resolveGeneration(low) < resolveGeneration(high));
assert('s10.1-default-not-mass-formula', generationIsMassDerivedEnergy({ mass: 6 }) === false);
assert('s10.1-null-uses-engine-default', resolveGeneration({}) === ENGINE_DEFAULT_GENERATION);

const load = consumerDraws({
  suite: resolveSuite('suite:baseline'),
  sensorMode: 'active',
  cloakActive: true,
  moving: true,
});
const endurance = compareGenerationEndurance(7, 18, {
  draws: load,
  energy: 40,
  energyMax: 40,
  seconds: 12,
  mass: 6,
});
assert('s10.1-higher-gen-better', endurance.highBetter === true);
assert('s10.1-shared-consumers', POWER_CONSUMERS.join(',') === 'propulsion,weapons,cloak,sensors,ew');
assert('s10.1-ew-reserved-zero', load.ew === 0 && createPowerDraws().ew === 0);

const observer = {
  key: observerKeyForPlayer(),
  role: 'patrol',
  powerNorm: 1,
  hullRatio: 1,
  mass: 4,
  sensorSuiteId: 'suite:baseline',
};
const modes = comparePassiveVsActive(observer, { x: 40, y: 0 }, 40, 1000);
assert('s10.2-passive-draw-lt-active', modes.drawSplit === true && modes.passiveDraw < modes.activeDraw);
assert('s10.2-active-stronger', modes.activeStronger === true);
assert('s10.2-passive-no-emission', modes.passiveWritesEmission === false);

const book = emptyContactBook();
const player = observerKeyForPlayer();
const subjectOpen = subjectKeyForNpc('vis-open');
const otherKey = observerKeyForNpc('vis-other');
const scan = performBudgetedActiveScan(book, {
  ...observer,
  key: player,
  x: 0,
  y: 0,
}, { key: subjectOpen, x: 50, y: 10 }, 50, 2000);
assert('s10.2-active-useful-or-empty', scan.useful === true && (scan.raised === true || scan.empty === true));
assert('s10.2-active-writes-emission', scan.wroteEmission === true && Boolean(scan.emission));
const noticed = noticeScanEmission(book, { key: otherKey, role: 'patrol', powerNorm: 1, hullRatio: 1 }, observer, scan.emission, 2000, {
  detectsScanner: true,
});
assert('s10.2-second-observer-hears', noticed.noticed === true);
assert('s10.2-not-flash-offense', noticed.flash === false && noticed.firingAuthorized === false);

const reportBook = createContactBook();
const report = seedFromReport(reportBook, player, subjectKeyForNpc('vis-report'), { x: 300, y: 300 }, 3000);
assert('s10.3-report-not-fs', report.firingSolution === false);
const reportScan = performBudgetedActiveScan(reportBook, {
  ...observer,
  key: player,
  x: 0,
  y: 0,
}, { key: subjectKeyForNpc('vis-report'), cloaked: true, x: 400, y: 400 }, 400, 3000);
assert('s10.3-active-no-invent-fs', reportScan.firingSolution === false);
assert('s10.3-no-engagement-authorized', reportScan.engagement_authorized !== true);
const suiteInstall = installSensorSuite({ cargoCapacity: 80, topSpeed: 12, role: 'traffic' }, 'suite:science');
assert('s10.3-suite-no-layers', suiteInstall.layersWritten === false && suiteInstall.firingSolution === false);
assert('s10.3-suite-no-fire-or-flash', suiteInstall.engagement_authorized == null && suiteInstall.flash === false);

const haul = {
  role: 'traffic',
  name: 'Kingston Freighter',
  cargoCapacity: 90,
  topSpeed: 11,
  mass: 8,
  basePowerGeneration: 10,
  sensorSuiteId: 'suite:baseline',
  powerNorm: 1,
  hullRatio: 1,
  sensorAge: 0,
};
const beforeCap = applySuiteToSensorActor(haul, resolveSuite('suite:baseline'));
const afterFit = installSensorSuite({ ...haul }, 'suite:science');
const afterCap = applySuiteToSensorActor({ ...haul, sensorSuiteId: 'suite:science' }, resolveSuite('suite:science'));
assert('s10.4-equipment-axis-rises', afterCap.sensorEquipment === 'science' && beforeCap.sensorEquipment !== 'science');
assert('s10.4-capability-rises', afterCap.capabilityMod > (beforeCap.capabilityMod || 0));
assert('s10.4-score-rises', sensorCapability(afterCap).score > sensorCapability(beforeCap).score);
const baselinePay = installSensorSuite({ ...haul }, 'suite:baseline').payments;
assert('s10.4-paid-axis', atLeastOnePaymentWorse(baselinePay, afterFit.payments) === true);
assert('s10.4-at-least-one-payment', afterFit.payments.cargo < 90 || afterFit.payments.powerHeadroom < 1 || afterFit.payments.speed < 11 || afterFit.payments.quiet < 1);
assert('s10.4-not-weapon-slot', afterFit.occupiedWeaponSlot === false && afterFit.weaponSlotsUnchanged === true);

const trade = scoutFreighterComparison();
assert('s10.5-sensors-rise', trade.sensorRise === true && trade.equipmentAxisRose === true);
assert('s10.5-paid-vs-own-baseline', trade.paidVsSelf === true);
assert('s10.5-not-free-vs-scout', trade.notFreeVsScout === true);

const quartet = roleCurveQuartet();
const dominated = findDominatedCurve(quartet);
assert('s10.6-no-dominated-curve', dominated == null);
assert('s10.6-tank-wins-durability', quartet.tank.durability > quartet.haul.durability && quartet.tank.durability > quartet.scout.durability);
assert('s10.6-haul-wins-hold', quartet.haul.hold > quartet.tank.hold && quartet.haul.hold > quartet.scout.hold && quartet.haul.hold > quartet.gun.hold);
assert('s10.6-scout-wins-sensors', quartet.scout.sensorScore > quartet.tank.sensorScore && quartet.scout.sensorScore > quartet.haul.sensorScore);
assert('s10.6-gun-wins-weapons', quartet.gun.weaponsEndurance > quartet.tank.weaponsEndurance && quartet.gun.weaponsEndurance > quartet.haul.weaponsEndurance);

const snap = snapshotPowerBudget({
  ...haul,
  energy: 50,
  energyMax: 50,
}, { sensorMode: 'passive' });
assert('s10.7-ew-named-consumer', snap.ew.name === EW_CONSUMER_NAME && snap.draws.ew === 0);
assert('s10.7-ew-on-same-budget', snap.consumerNames.includes('ew') && snap.consumers.ew === 0);
assert('s10.7-no-effect-apis', listEwEffectApis().length === 0);

const localMs = 10_000;
const p6book = createContactBook();
const cloakedHull = initHullCloak({ id: 'slot-1', securityInstanceId: 'vis-99', x: 400, y: 200 }, { active: true }, localMs);
const first = firstFrameVisibility(p6book, player, subjectKeyForNpc('vis-99'));
assert('s10.8-first-frame-hidden', first.minimap === false && first.aiAcquisition === false && first.firingSolution === false);
const ordinary = { role: 'patrol', sensorEquipment: 'standard', powerNorm: 1, hullRatio: 1, mass: 12, key: player };
const miss = evaluatePassiveDetection(ordinary, cloakedHull, 180, localMs);
applyPassiveUpdate(p6book, player, subjectKeyForNpc('vis-99'), miss, cloakedHull, localMs);
assert('s10.8-hidden-both-sides-player', observerSeesSubject(p6book, player, subjectKeyForNpc('vis-99')) === false);
const fixture = scienceVsOrdinaryFixture();
assert('s10.8-science-beats-ordinary', scienceOutperformsOrdinary(fixture.science, fixture.ordinary) === true);
const reportContact = seedFromReport(p6book, player, subjectKeyForNpc('vis-rep'), { x: 10, y: 10 }, localMs);
assert('s10.8-report-not-lock', reportContact.firingSolution === false && contactPresentation(reportContact).liveLock === false);
const live = upsertContact(p6book, player, {
  subjectKey: subjectKeyForNpc('vis-lock'),
  detected: true,
  identification: 'known',
  trackQuality: 'firm',
  firingSolution: true,
  lastKnown: { x: 50, y: 60, radius: 20, atLocalMs: localMs },
}, localMs);
const dropped = applyLostTrackSameTick(p6book, player, live.contactId, localMs);
assert('s10.8-same-tick-drop', dropped.sameTick === true && dropped.firingSolution === false && observerHasFiringSolution(p6book, player, live.subjectKey) === false);
assert('s10.8-unknown-unenforced', shouldEnforceUnknownAccess() === false);
const emptyScan = performActiveScan(emptyContactBook(), ordinary, { key: subjectKeyForNpc('vis-99'), cloaked: true, x: 400, y: 400 }, 400, localMs);
assert('s10.8-honest-empty', emptyScan.empty === true && emptyScan.firingSolution === false);

const persisted = restorePhase65Runtime(serializePhase65Runtime({
  sensorSuiteId: 'suite:science',
  basePowerGeneration: 15,
  sensorMode: 'active',
  sensorAge: 2,
  startedAtLocalMs: 40,
}));
assert('s10.8-no-performance-now-deadline', persisted.startedAt == null && persisted.startedAtLocalMs === 40);

const pack = JSON.parse(fs.readFileSync(path.join(root, 'bm-ships/ships.json'), 'utf8'));
const rules = JSON.parse(fs.readFileSync(path.join(root, 'bm-ships/integration-rules.json'), 'utf8'));
const reman = pack.ships.find((row) => Number(row.id) === REMAN_WARBIRD_ID);
const remanId = reman53Identity();
assert('s10.9-reman-id', reman?.id === 53 && reman?.key === REMAN_WARBIRD_KEY && remanId.aliased === false);
assert('s10.9-reman-not-alias', pack.aliases?.['53'] == null && pack.aliases?.[53] == null);
assert('s10.9-alias-304-to-2', resolveHullAlias(EXAMPLE_ALIAS_FROM, pack.aliases) === EXAMPLE_ALIAS_TO);
assert('s10.9-rules-alias-304', resolveHullAlias(304, rules.hullAliases) === 2);
const aliasCount = Object.keys(pack.aliases || {}).length;
const rulesCount = Object.keys(rules.hullAliases || {}).length;
assert('s10.9-38-aliases', aliasCount === 38 && rulesCount === 38);
const active = pack.ships.filter((row) => row.rosterState === 'active');
assert('s10.9-no-173rd-from-alias', active.length === 172 && !active.some((row) => Number(row.id) === 304));
assert('s10.9-discarded-not-active', !active.some((row) => Number(row.id) === EXAMPLE_ALIAS_FROM));

assert('s10.10-catalog-required', isLoadShipCatalogRequired() === true);
assert('s10.10-no-invented-roster-fill', pack.ships.every((row) => row.basePowerGeneration == null && row.defaultSensorSuiteId == null));
assert('s10.10-probe-injects-not-yards', resolveGeneration({ basePowerGeneration: 22 }).toFixed(0) === '22');

const haulNormLow = powerNormFromBudget({
  energy: 40,
  energyMax: 40,
  generation: 7,
  draws: load,
});
const haulNormHigh = powerNormFromBudget({
  energy: 40,
  energyMax: 40,
  generation: 18,
  draws: load,
});
assert('s10.1-powernorm-follows-generation', haulNormHigh > haulNormLow);
assert('s10.2-draw-helpers', sensorDrawForMode(resolveSuite('suite:science'), 'passive') < sensorDrawForMode(resolveSuite('suite:science'), 'active'));
assert('s10.4-find-contact-untouched', findContact(reportBook, player, subjectKeyForNpc('vis-report'))?.identification === 'none');

if (failed) {
  console.error(`Phase 6.5 offline probes: ${passed} passed, ${failed} failed`);
  for (const row of failures) console.error(`  FAIL ${row}`);
  process.exit(1);
}
console.log(`Phase 6.5 offline probes: ${passed} passed, ${failed} failed`);
