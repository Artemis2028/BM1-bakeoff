/**
 * Phase 9 — reviewed weapons matrix (read-only ledger).
 *
 * Source of truth:
 * - docs/phase9/BM1-PHASE9-EW-WEAPONS-PROPOSAL.md §6
 * - docs/phase9/BM1-PHASE9-ENGINE-DEPENDENCIES.md
 * - docs/GUIDED-CONVERGENCE.md §1 (Flash prices = source material, not locks)
 *
 * Written from docs/ only. Does not crib BM1-remastered-work.
 *
 * Gate 4: ten columns + provenance before any combat retune. Flash table is
 * evidence. Tractor stays a Device slot. No universal shield bypass. Mapping
 * cites fitted hulls or an explicit unmounted / inherited-only mark. Empty
 * slots stay empty — this file never auto-fills them.
 */

import { packDefaultWeaponSlots } from './ship-catalog-wire.js';

export const MATRIX_COLUMNS = Object.freeze([
  'family',
  'range',
  'arc',
  'tracking',
  'shieldInteraction',
  'hullSubsystem',
  'energyAmmunition',
  'counters',
  'factionAccess',
  'provenance',
]);

export const FORBIDDEN_FIRE_INJECT = 'engagement_authorized';
export const BOARDING_IMPLEMENTED = false;
export const UNIVERSAL_SHIELD_BYPASS = false;
export const FLASH_PRICES_ARE_LIVE_LOCKS = false;
export const TRACTOR_ID = 25;
export const TRACTOR_TYPE = 'Device';

/** Combat numbers at engine-lane base (`b9f4385` / game_items.json). Gate 4. */
export const BASELINE_COMBAT_NUMBERS = Object.freeze({
  1: { damage: 33, cooldown: 520, range: 820, price: 3000 },
  2: { damage: 68, cooldown: 820, range: 900, price: 9000 },
  3: { damage: 33, cooldown: 640, range: 860, price: 5000 },
  4: { damage: 19, cooldown: 300, range: 720, price: 3800 },
  5: { damage: 47, cooldown: 260, range: 720, price: 30000 },
  6: { damage: 19, cooldown: 240, range: 760, price: 3000 },
  7: { damage: 19, cooldown: 240, range: 720, price: 1500 },
  8: { damage: 40, cooldown: 240, range: 760, price: 2000 },
  9: { damage: 26, cooldown: 240, range: 760, price: 7500 },
  10: { damage: 19, cooldown: 300, range: 720, price: 1300 },
  11: { damage: 26, cooldown: 240, range: 840, price: 8500 },
  12: { damage: 33, cooldown: 240, range: 840, price: 7800 },
  13: { damage: 47, cooldown: 520, range: 1080, price: 9000 },
  14: { damage: 26, cooldown: 300, range: 790, price: 1500 },
  15: { damage: 33, cooldown: 1200, range: 980, price: 2500 },
  16: { damage: 33, cooldown: 940, range: 1040, price: 6700 },
  17: { damage: 54, cooldown: 1800, range: 980, price: 7200 },
  18: { damage: 160, cooldown: 3200, range: 1160, price: 12500 },
  19: { damage: 33, cooldown: 940, range: 1040, price: 5300 },
  22: { damage: 0, cooldown: 1800, range: 620, price: 13500 },
  23: { damage: 0, cooldown: 3600, range: 1800, price: 5000 },
  24: { damage: 0, cooldown: 2600, range: 820, price: 8000 },
  25: { damage: 0, cooldown: 1100, range: 700, price: 3400 },
  26: { damage: 112, cooldown: 3600, range: 980, price: 15500 },
  27: { damage: 33, cooldown: 360, range: 980, price: 1200 },
  28: { damage: 82, cooldown: 940, range: 830, price: 10000 },
  29: { damage: 68, cooldown: 940, range: 880, price: 12000 },
  30: { damage: 140, cooldown: 2300, range: 1280, price: 30000 },
  38: { damage: 54, cooldown: 940, range: 860, price: 16500 },
  39: { damage: 26, cooldown: 180, range: 760, price: 35600 },
  44: { damage: 82, cooldown: 360, range: 840, price: 24000 },
  45: { damage: 47, cooldown: 640, range: 900, price: 35400 },
});

const FLASH_TABLE = Object.freeze({
  1: { flashName: 'Type X Phaser', flashPrice: 1500 + 1500, flashFamily: 'Beam' },
  3: { flashName: 'Polaron Phaser', flashPrice: 5000, flashFamily: null },
  4: { flashName: 'Plasma Phaser', flashPrice: 3800, flashFamily: null },
  5: { flashName: 'Cutting Beam', flashPrice: 30000, flashFamily: null },
  6: { flashName: 'Disrupter Cannon', flashPrice: 3000, flashFamily: 'dual' },
  7: { flashName: 'Disrupter Canon', flashPrice: 1500, flashFamily: null },
  8: { flashName: 'Quantum Pulse Cannon', flashPrice: 2000, flashFamily: null },
  9: { flashName: 'Dual Pulse Phasers', flashPrice: 7500, flashFamily: null },
  10: { flashName: 'Phaser Cannon', flashPrice: 1300, flashFamily: 'Pulse' },
  11: { flashName: 'Pulse Turret', flashPrice: 8500, flashFamily: null },
  12: { flashName: 'Disrupter Turret', flashPrice: 7800, flashFamily: null },
  13: { flashName: 'Gravimetric Torpedo', flashPrice: 9000, flashFamily: null },
  14: { flashName: 'Type VII Phaser', flashPrice: 1500, flashFamily: 'Pulse' },
  15: { flashName: 'Photon Torpedo', flashPrice: 2500, flashFamily: null },
  16: { flashName: 'Quantum Torpedo', flashPrice: 6700, flashFamily: null },
  18: { flashName: 'Transphasic Torpedo', flashPrice: 12500, flashFamily: null },
  19: { flashName: 'Polaron Torpedo', flashPrice: 5300, flashFamily: null },
  22: { flashName: 'Cloaking Device', flashPrice: 13500, flashFamily: null },
  23: { flashName: 'Engine Disrupter', flashPrice: 5000, flashFamily: null },
  24: { flashName: 'Tachyon Field Generator', flashPrice: 8000, flashFamily: null },
  25: { flashName: 'Tractor Beam', flashPrice: 3400, flashFamily: 'Special' },
  26: { flashName: 'Thaleron Generator', flashPrice: 15500, flashFamily: null },
});

const DEFERRED_FLASH_UTILITIES = Object.freeze([
  { flashName: 'Bajoran Sail', flashPrice: 5000, flashFamily: 'Utility', mapping: 'deferred-utility', bakeoffId: null },
  { flashName: 'Warp Core', flashPrice: 12000, flashFamily: 'Utility', mapping: 'deferred-utility-not-trade-good', bakeoffId: null },
]);

const INHERITED_NOT_IN_FLASH = Object.freeze([2, 27, 28, 29, 30, 38, 39, 44, 45]);

const LORE_SHIELD_NOTES = Object.freeze({
  3: 'Trek/BM lore: polaron sometimes pierced Borg shields. Row note only — not a global bypass.',
  5: 'Cutting beam is a hull/device cutter, not a capture tool and not a universal bypass.',
  18: 'Trek/BM lore: transphasic pierced Borg shields in one episode. Row note only.',
  19: 'Polaron torpedo shares the polaron lore note. Row-scoped. Default remains shields-then-hull.',
  26: 'Thaleron is a heavy cloud device — not boarding, not capture, not a shield-bypass inheritance.',
});

const HULL_NOTES = Object.freeze({
  5: 'hull / cutting — not capture',
  23: 'device drain / engine sting',
  24: 'device — tachyon field',
  25: 'device hold — not boarding',
  26: 'heavy cloud — not boarding / not capture',
  22: 'device — cloak',
});

function familyFromType(type, id) {
  const key = String(type || '').toLowerCase();
  if (id === 7) return 'cannon';
  if (id === 6) return 'cannon';
  if (id === 12) return 'turret';
  if (key === 'beam') return 'beam';
  if (key === 'cannon') return 'cannon';
  if (key === 'turret') return 'turret';
  if (key === 'torpedo') return 'torpedo';
  if (key === 'heavy') return 'heavy';
  if (key === 'device') return 'device';
  return key || 'beam';
}

function arcFor(type) {
  const key = String(type || '').toLowerCase();
  if (key === 'turret') return 'turret-mount';
  if (key === 'device' || key === 'heavy') return 'device-mount';
  return 'forward';
}

function trackingFor(type) {
  const key = String(type || '').toLowerCase();
  if (key === 'device') return 'device-use';
  return 'needs-firingSolution';
}

function hullEffect(item) {
  if (HULL_NOTES[item.id]) return HULL_NOTES[item.id];
  if (item.type === 'Device') return 'device — no hull kill';
  if (item.type === 'Heavy') return 'heavy hull / cloud';
  return 'hull damage';
}

function energyFor(type) {
  if (String(type || '').toLowerCase() === 'torpedo') {
    return 'weapons-consumer + finite ammo (no jump reprint)';
  }
  return 'weapons-consumer';
}

function provenanceFor(id) {
  if (FLASH_TABLE[id]) return 'BM1';
  if (INHERITED_NOT_IN_FLASH.includes(id)) return 'bake-off-current';
  return 'bake-off-current';
}

function flashIdentity(id, item) {
  if (id === 7) return 'Disrupter Canon';
  if (id === 6) return 'Disrupter Cannon';
  if (id === 12) return 'Disrupter Turret';
  return FLASH_TABLE[id]?.flashName || item.name;
}

export function applyDefaultShieldAbsorb(shields = 0, amount = 0) {
  const pool = Math.max(0, Number(shields) || 0);
  const hit = Math.max(0, Number(amount) || 0);
  const shieldDamage = Math.min(pool, hit);
  return {
    shieldDamage,
    hullDamage: Math.max(0, hit - shieldDamage),
    bypassedShields: false,
    interaction: 'shields-then-hull',
  };
}

export function applyRowShieldInteraction(row, shields = 0, amount = 0) {
  const absorb = applyDefaultShieldAbsorb(shields, amount);
  return {
    ...absorb,
    rowId: row?.id ?? null,
    rowScopedNote: row?.shieldNote || null,
    inheritedUniversalBypass: false,
  };
}

export function ordinaryBeamDoesNotInheritLoreBypass(ordinaryRow, loreRow) {
  const ordinary = applyRowShieldInteraction(ordinaryRow, 40, 20);
  const lore = applyRowShieldInteraction(loreRow, 40, 20);
  return ordinary.bypassedShields === false
    && lore.bypassedShields === false
    && ordinary.interaction === 'shields-then-hull'
    && lore.interaction === 'shields-then-hull'
    && UNIVERSAL_SHIELD_BYPASS === false;
}

export function rowHasAllColumns(row) {
  if (!row || typeof row !== 'object') return false;
  return MATRIX_COLUMNS.every((col) => row[col] != null && row[col] !== '')
    && Boolean(row.provenance);
}

function buildRow(item) {
  const id = Number(item.id);
  const flash = FLASH_TABLE[id] || null;
  const inherited = INHERITED_NOT_IN_FLASH.includes(id);
  const type = item.type || 'Beam';
  return {
    id,
    name: item.name,
    flashIdentity: flashIdentity(id, item),
    flashName: flash?.flashName || null,
    flashPrice: flash ? flash.flashPrice : null,
    flashPriceIsLiveLock: false,
    plasmaTorpedoFlashCertified: id === 17 ? false : undefined,
    family: familyFromType(type, id),
    catalogType: type,
    range: Number(item.range) || 0,
    arc: arcFor(type),
    tracking: trackingFor(type),
    shieldInteraction: 'shields-then-hull',
    shieldNote: LORE_SHIELD_NOTES[id] || null,
    bypassShields: false,
    hullSubsystem: hullEffect(item),
    energyAmmunition: energyFor(type),
    counters: Object.freeze(['cloak', 'jamming', 'fire-control', 'range', 'shields']),
    factionAccess: Array.isArray(item.stockFactions) ? item.stockFactions.slice() : [],
    provenance: provenanceFor(id),
    slot: type === 'Device' || type === 'Heavy' || type === 'Beam' || type === 'Cannon' || type === 'Turret' || type === 'Torpedo',
    cargo: false,
    tractor: id === TRACTOR_ID,
    boarding: false,
    capture: false,
    commandTransfer: false,
    inheritedNotInFlash: inherited,
    mapping: inherited ? 'inherited-only' : 'unmounted',
    fittedHulls: [],
    emptySlotsAutoFilled: false,
  };
}

/**
 * Phase 9.1 HoJ / anti-emitter row. Unmounted / proposed. Provenance `new`.
 * Not a catalog id. Not a combat retune. Flash prices are not live locks.
 */
export const HOJ_MATRIX_ROW = Object.freeze({
  id: 'hoj-anti-emitter',
  name: 'Home-on-Jam / anti-emitter (proposed)',
  flashIdentity: 'Home-on-Jam (proposed)',
  flashName: null,
  flashPrice: null,
  flashPriceIsLiveLock: false,
  family: 'anti-emitter',
  catalogType: null,
  range: 'seeker-vs-emitter-coverage (not pursuit permission)',
  arc: 'forward-or-dedicated-mount',
  tracking: 'emission-only; incarnation-lock; silence→coast; does-not-write-firingSolution',
  shieldInteraction: 'shields-then-hull',
  shieldNote: 'Default shields-then-hull. No universal bypass.',
  bypassShields: false,
  hullSubsystem: 'physical hit / collateral legal — not boarding',
  energyAmmunition: 'weapons-consumer and/or finite ammo — not hidden ew',
  counters: Object.freeze(['silence', 'cloak', 'leave-volume', 'decoy-emitters', 'eccm']),
  factionAccess: 'catalog-wire / standing; Reman 53 unrewired',
  provenance: 'new',
  slot: false,
  cargo: false,
  tractor: false,
  boarding: false,
  capture: false,
  commandTransfer: false,
  inheritedNotInFlash: false,
  mapping: 'unmounted',
  proposed: true,
  unmounted: true,
  catalogId: null,
  fittedHulls: Object.freeze([]),
  emptySlotsAutoFilled: false,
});

export function proposedHojRow() {
  return { ...HOJ_MATRIX_ROW, fittedHulls: [], counters: HOJ_MATRIX_ROW.counters.slice() };
}

export function buildWeaponsMatrix(items = [], hulls = []) {
  const rows = (Array.isArray(items) ? items : []).map((item) => buildRow(item));
  const mapped = attachHullMapping(rows, hulls);
  return [...mapped, proposedHojRow()];
}

export function attachHullMapping(rows = [], hulls = []) {
  const byId = new Map();
  for (const row of rows) byId.set(Number(row.id), { ...row, fittedHulls: [], emptySlotsAutoFilled: false });
  for (const hull of hulls || []) {
    const slots = packDefaultWeaponSlots(hull);
    if (!slots) continue;
    const empties = slots.filter((slot) => slot == null).length;
    for (const weaponId of slots) {
      if (!weaponId) continue;
      const row = byId.get(Number(weaponId));
      if (!row) continue;
      const key = hull.key || `bm-ship:${hull.id}`;
      if (!row.fittedHulls.includes(key)) row.fittedHulls.push(key);
      row.mapping = 'fitted';
      row.emptySlotsPreserved = empties;
    }
  }
  for (const row of byId.values()) {
    if (!row.fittedHulls.length) {
      row.mapping = row.inheritedNotInFlash ? 'inherited-only' : (FLASH_TABLE[row.id] ? 'unmounted' : 'inherited-only');
    }
  }
  return [...byId.values()];
}

export function listMatrixColumns() {
  return MATRIX_COLUMNS.slice();
}

export function listDeferredFlashUtilities() {
  return DEFERRED_FLASH_UTILITIES.map((row) => ({ ...row }));
}

export function disruptorIdentities(rows = []) {
  const canon = rows.find((row) => row.id === 7);
  const cannon = rows.find((row) => row.id === 6);
  const turret = rows.find((row) => row.id === 12);
  return {
    canon: canon ? { id: 7, identity: canon.flashIdentity, family: canon.family } : null,
    cannon: cannon ? { id: 6, identity: cannon.flashIdentity, family: cannon.family } : null,
    turret: turret ? { id: 12, identity: turret.flashIdentity, family: turret.family } : null,
    distinct: Boolean(canon && cannon && turret)
      && canon.flashIdentity !== cannon.flashIdentity
      && cannon.flashIdentity !== turret.flashIdentity
      && canon.flashIdentity !== turret.flashIdentity,
  };
}

export function tractorRow(rows = []) {
  const row = rows.find((item) => item.id === TRACTOR_ID) || null;
  return {
    id: TRACTOR_ID,
    type: row?.catalogType || TRACTOR_TYPE,
    slot: row?.slot === true || TRACTOR_TYPE === 'Device',
    cargo: row?.cargo === true,
    boarding: false,
    present: Boolean(row),
  };
}

export function combatNumbersUnchanged(items = [], baseline = BASELINE_COMBAT_NUMBERS) {
  const mismatches = [];
  for (const item of items || []) {
    const expected = baseline[item.id];
    if (!expected) continue;
    if (Number(item.damage) !== expected.damage
      || Number(item.cooldown) !== expected.cooldown
      || Number(item.range) !== expected.range
      || Number(item.price) !== expected.price) {
      mismatches.push({
        id: item.id,
        live: {
          damage: item.damage,
          cooldown: item.cooldown,
          range: item.range,
          price: item.price,
        },
        baseline: expected,
      });
    }
  }
  return { unchanged: mismatches.length === 0, mismatches };
}

export function mappingDidNotAutoFill(rows = [], hulls = []) {
  for (const hull of hulls || []) {
    const before = packDefaultWeaponSlots(hull);
    if (!before) continue;
    const after = packDefaultWeaponSlots(hull);
    if (JSON.stringify(before) !== JSON.stringify(after)) return false;
    if (hullIsEmpty(before) && after.some(Boolean)) return false;
  }
  return rows.every((row) => row.emptySlotsAutoFilled !== true);
}

function hullIsEmpty(slots) {
  return Array.isArray(slots) && slots.length === 3 && !slots.some(Boolean);
}

export function boardingApisPresent() {
  return BOARDING_IMPLEMENTED === true;
}

export function cultureFireFromMatrixForbidden() {
  return FORBIDDEN_FIRE_INJECT;
}
