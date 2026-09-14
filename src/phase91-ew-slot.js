/**
 * Phase 9.1 — dedicated `ew_equipment` slot (gate 1).
 *
 * Source of truth: docs/phase9/BM1-PHASE9.1-EW-ROBUSTNESS-PROPOSAL.md §3.3
 * Written from docs/ only. Does not crib remastered-work.
 *
 * Empty by default, one jammer, no stack. Does not steal a weapon mount or
 * the sensor suite slot. Magnitudes are injectable / TBD — not a watt lock.
 */

export const EW_SLOT_KIND = 'ew_equipment';
export const EW_SLOT_TIERS = Object.freeze(['compact', 'tactical', 'fleet']);
export const EW_MAX_FITTED = 1;
export const MAGNITUDES_LOCKED_FROM_REMASTERED = false;

/**
 * Shape-only catalog. Draws / strength / radius / prices are TBD placeholders
 * so probes can assert spend-to-suppress and RSS, not a remastered EU/s lock.
 */
export const EW_EQUIPMENT_CATALOG = Object.freeze({
  compact: {
    tierId: 'compact',
    name: 'Compact jammer',
    standingGate: 0,
    draw: 1.2,
    strength: 2,
    radius: 400,
    price: null,
  },
  tactical: {
    tierId: 'tactical',
    name: 'Tactical jammer',
    standingGate: 20,
    draw: 2,
    strength: 3.5,
    radius: 700,
    price: null,
  },
  fleet: {
    tierId: 'fleet',
    name: 'Fleet jammer',
    standingGate: 50,
    draw: 3.2,
    strength: 5,
    radius: 1100,
    price: null,
  },
});

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

export function resolveEwMagnitudes(injected = null) {
  const next = {};
  for (const tier of EW_SLOT_TIERS) {
    next[tier] = { ...EW_EQUIPMENT_CATALOG[tier] };
    if (injected?.[tier] && typeof injected[tier] === 'object') {
      next[tier] = { ...next[tier], ...injected[tier], tierId: tier };
    }
  }
  return next;
}

export function resolveEwEquipment(tierId, extras = {}) {
  const key = normalizeKey(tierId).replace(/^ew:/, '');
  if (!EW_SLOT_TIERS.includes(key)) return null;
  const catalog = resolveEwMagnitudes(extras.magnitudes);
  return {
    ...catalog[key],
    slotKind: EW_SLOT_KIND,
    occupiesWeaponSlot: false,
    occupiesSensorSuiteSlot: false,
    maxFitted: EW_MAX_FITTED,
    magnitudesLockedFromRemastered: MAGNITUDES_LOCKED_FROM_REMASTERED,
  };
}

export function listEwEquipmentCatalog(injected = null) {
  return EW_SLOT_TIERS.map((tier) => resolveEwEquipment(tier, { magnitudes: injected }));
}

export function emptyEwSlot() {
  return {
    slotKind: EW_SLOT_KIND,
    fitted: null,
    occupiesWeaponSlot: false,
    occupiesSensorSuiteSlot: false,
    stacked: false,
    maxFitted: EW_MAX_FITTED,
    default: null,
  };
}

export function readFittedTier(target = {}) {
  const raw = target.ewEquipmentId || target.ewSlot || target.fitted || null;
  const key = normalizeKey(raw).replace(/^ew:/, '');
  return EW_SLOT_TIERS.includes(key) ? key : null;
}

/**
 * Fit one jammer into the dedicated slot. Rejects a second SKU, weapon-slot
 * theft, and suite overwrite.
 */
export function installEwEquipment(target, tierId, extras = {}) {
  if (!target || typeof target !== 'object') return { ok: false, reason: 'missing-target' };
  const weaponSlots = Array.isArray(extras.weaponSlots)
    ? extras.weaponSlots.slice()
    : (Array.isArray(target.weaponSlots) ? target.weaponSlots.slice() : extras.weaponSlots);
  const beforeSlots = Array.isArray(weaponSlots) ? weaponSlots.slice() : null;
  const beforeSuite = target.sensorSuiteId ?? extras.sensorSuiteId ?? null;
  const existing = readFittedTier(target);
  const wantEmpty = tierId == null || tierId === '' || tierId === 'empty' || tierId === 'none';
  if (wantEmpty) {
    target.ewEquipmentId = null;
    return {
      ok: true,
      fitted: null,
      slotKind: EW_SLOT_KIND,
      weaponSlotsUnchanged: true,
      sensorSuiteIdUnchanged: true,
      occupiesWeaponSlot: false,
      occupiesSensorSuiteSlot: false,
      stacked: false,
      weaponSlots: beforeSlots,
      sensorSuiteId: target.sensorSuiteId ?? beforeSuite,
    };
  }
  const row = resolveEwEquipment(tierId, extras);
  if (!row) return { ok: false, reason: 'unknown-tier' };
  if (existing && existing !== row.tierId && extras.replace !== true) {
    return {
      ok: false,
      reason: 'stack-rejected',
      stacked: true,
      fitted: existing,
      slotKind: EW_SLOT_KIND,
      weaponSlotsUnchanged: true,
      sensorSuiteIdUnchanged: true,
      occupiesWeaponSlot: false,
      occupiesSensorSuiteSlot: false,
    };
  }
  if (extras.intoWeaponSlot === true || extras.occupiesWeaponSlot === true) {
    return { ok: false, reason: 'weapon-slot-forbidden' };
  }
  if (extras.replaceSuite === true) {
    return { ok: false, reason: 'suite-slot-forbidden' };
  }
  target.ewEquipmentId = row.tierId;
  const afterSlots = Array.isArray(target.weaponSlots) ? target.weaponSlots.slice() : beforeSlots;
  const slotsUnchanged = JSON.stringify(beforeSlots) === JSON.stringify(afterSlots)
    || beforeSlots == null;
  const suiteUnchanged = (target.sensorSuiteId ?? beforeSuite) === beforeSuite;
  return {
    ok: true,
    fitted: row.tierId,
    equipment: row,
    slotKind: EW_SLOT_KIND,
    weaponSlotsUnchanged: slotsUnchanged,
    sensorSuiteIdUnchanged: suiteUnchanged,
    occupiesWeaponSlot: false,
    occupiesSensorSuiteSlot: false,
    stacked: false,
    weaponSlots: afterSlots,
    sensorSuiteId: target.sensorSuiteId ?? beforeSuite,
    draw: clampNonNeg(row.draw),
    strength: clampNonNeg(row.strength),
    radius: clampNonNeg(row.radius),
    magnitudesLockedFromRemastered: MAGNITUDES_LOCKED_FROM_REMASTERED,
  };
}

export function scienceSuiteIsJammer() {
  return false;
}

export function serializeEwSlot(raw = {}) {
  return {
    slotKind: EW_SLOT_KIND,
    fitted: readFittedTier(raw),
    occupiesWeaponSlot: false,
    occupiesSensorSuiteSlot: false,
    stacked: false,
  };
}

export { clone };
