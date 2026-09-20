/**
 * Empty-but-armable ships — persistence + physical fire gate (S23).
 *
 * Source of truth:
 * - docs/empty-armable/BM1-EMPTY-ARMABLE-SHIPS-PROPOSAL.md
 * - docs/empty-armable/BM1-EMPTY-ARMABLE-ENGINE-DEPENDENCIES.md
 *
 * Subscribe-only. Canonicalizes `[]` / `[null, null, null]` as three empty
 * slots, hard-fails Type X auto-fill, and closes the unarmed-NPC fallback.
 * Does not crib BM1-remastered-work. EMPTY_ARMABLE_LOCKED_FROM_REMASTERED
 * stays false.
 *
 * Hard gates:
 * 1. Three combat/device slots. No fourth hardpoint. No steal of suite / ew /
 *    cargo / utilityBook.
 * 2. Empty stays empty across save/load/scene/restore.
 * 3. Unarmed NPC cannot fire. Doctrine / ROE / hostility ≠ a shot.
 * 4. After legal install, fire uses that installed def only.
 * 5. Tractor id 25 stays a Device slot. tractorIsBoarding() stays false.
 * 6. Never gift firingSolution / culture / engagement_authorized.
 * 7. Do not reopen EW / boarding / Phase 10 / flags / ledger.
 * 8. Named outs + remastered-lock false.
 */

import {
  WEAPON_SLOT_COUNT,
  hullIsEmptyButArmable,
  packDefaultWeaponSlots,
  unarmedNpcCannotFire,
} from './ship-catalog-wire.js';

export const EMPTY_ARMABLE_LOCKED_FROM_REMASTERED = false;
export const EMPTY_ARMABLE_SLOT_COUNT = WEAPON_SLOT_COUNT || 3;
export const DEFAULT_WEAPON_ID_TYPE_X = 1;
export const TRACTOR_BEAM_ID = 25;
export const FORBIDDEN_FIRE_INJECT = 'engagement_authorized';
export const CANONICAL_EMPTY_SLOTS = Object.freeze([null, null, null]);
export const PACK_EMPTY_EXAMPLES = Object.freeze([348, 349, 350]);

export const UNARMED_WEAPON_DEF = Object.freeze({
  id: null,
  name: 'Unarmed',
  type: 'None',
  damage: 0,
  cooldown: 0,
  range: 0,
  price: 0,
  minMass: 0,
  speed: 0,
});

function requireHelper(helper, name) {
  if (typeof helper !== 'function') {
    const error = new Error(`empty-armable: ${name} missing`);
    error.missing = true;
    error.helper = name;
    throw error;
  }
}

export function requireEmptyArmableHelpers() {
  requireHelper(packDefaultWeaponSlots, 'packDefaultWeaponSlots');
  requireHelper(hullIsEmptyButArmable, 'hullIsEmptyButArmable');
  requireHelper(unarmedNpcCannotFire, 'unarmedNpcCannotFire');
}

export function canonicalizeWeaponSlots(slots) {
  const raw = Array.isArray(slots) ? slots : [];
  return [0, 1, 2].map((index) => {
    const value = raw[index];
    if (value == null || value === false || value === '') return null;
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
  });
}

export function slotsAreEmpty(slots) {
  return !canonicalizeWeaponSlots(slots).some(Boolean);
}

export function liveSlotsAreEmpty(slots) {
  if (slots == null) return true;
  return slotsAreEmpty(slots);
}

export function firstFilledSlot(slots) {
  return canonicalizeWeaponSlots(slots).find(Boolean) || null;
}

export function hullPackIsEmptyArmable(ship) {
  try {
    requireHelper(hullIsEmptyButArmable, 'hullIsEmptyButArmable');
  } catch (error) {
    throw error;
  }
  if (hullIsEmptyButArmable(ship)) return true;
  const pack = packDefaultWeaponSlots(ship);
  return Boolean(pack) && slotsAreEmpty(pack);
}

export function shouldRefuseAutofill(ship, liveSlots) {
  if (hullPackIsEmptyArmable(ship)) return true;
  if (liveSlots !== undefined && liveSlotsAreEmpty(liveSlots)) return true;
  return false;
}

export function refuseAutofillDefaultWeapon(reason = 'auto-fill') {
  const error = new Error(`empty-armable: Type X / DEFAULT_WEAPON_ID auto-fill is forbidden (${reason})`);
  error.autoFill = true;
  error.weaponId = DEFAULT_WEAPON_ID_TYPE_X;
  throw error;
}

export function assertNoTypeXAutofill(beforeSlots, afterSlots, { legalInstall = false } = {}) {
  if (legalInstall) return canonicalizeWeaponSlots(afterSlots);
  const beforeEmpty = slotsAreEmpty(beforeSlots);
  const after = canonicalizeWeaponSlots(afterSlots);
  if (beforeEmpty && after.some((id) => Number(id) === DEFAULT_WEAPON_ID_TYPE_X)) {
    refuseAutofillDefaultWeapon('empty-became-type-x');
  }
  if (beforeEmpty && !slotsAreEmpty(after)) {
    const error = new Error('empty-armable: empty slots must stay empty unless legally installed');
    error.autoFill = true;
    throw error;
  }
  return after;
}

export function mayEmitProjectile(slots, extras = {}) {
  const isCombat = typeof extras.isCombatWeapon === 'function' ? extras.isCombatWeapon : Boolean;
  return canonicalizeWeaponSlots(slots).some((id) => id && isCombat(id));
}

export function resolveCombatWeaponId(slots, extras = {}) {
  const isCombat = typeof extras.isCombatWeapon === 'function' ? extras.isCombatWeapon : Boolean;
  const ship = extras.ship;
  const canonical = canonicalizeWeaponSlots(slots);
  if (typeof extras.unarmedNpcCannotFire === 'function') {
    if (extras.unarmedNpcCannotFire(ship, canonical, isCombat)) return null;
  } else if (unarmedNpcCannotFire(ship, canonical, isCombat)) {
    return null;
  }
  const fromSlots = canonical.find((id) => id && isCombat(id));
  if (fromSlots) return fromSlots;
  if (hullPackIsEmptyArmable(ship) || slotsAreEmpty(canonical)) return null;
  if (!mayEmitProjectile(canonical, { isCombatWeapon: isCombat })) return null;
  return null;
}

export function emptyArmableInjectMustNotGiftFire(target = {}) {
  const row = target && typeof target === 'object' ? { ...target } : {};
  delete row.firingSolution;
  delete row.engagement_authorized;
  delete row[FORBIDDEN_FIRE_INJECT];
  delete row.cultureFire;
  return {
    firingSolutionPresent: false,
    engagementAuthorizedPresent: false,
    cultureFire: false,
    row,
  };
}

export function utilityBookHoldsCombatSlots(book) {
  const store = book && typeof book === 'object' ? book : {};
  const rows = [
    ...(Array.isArray(store.items) ? store.items : []),
    ...(Array.isArray(store.facility_pass) ? store.facility_pass : []),
    ...(Array.isArray(store.faction_flag) ? store.faction_flag : []),
    ...(Array.isArray(store.weaponSlots) ? store.weaponSlots : []),
  ];
  return rows.some((row) => {
    if (row == null) return false;
    if (typeof row === 'object') {
      const id = Number(row.id ?? row.weaponId);
      if (Number.isInteger(id) && id > 0 && id !== TRACTOR_BEAM_ID) return true;
      const name = String(row.id ?? row.name ?? row.kind ?? '').trim().toLowerCase();
      return name === 'weapon-slot' || name === 'hardpoint' || name === 'empty-slot';
    }
    const name = String(row).trim().toLowerCase();
    return name === 'weapon-slot' || name === 'hardpoint' || name === 'empty-slot';
  });
}

export function tractorHomeSnapshot(extras = {}) {
  return {
    id: TRACTOR_BEAM_ID,
    type: extras.type || 'Device',
    slot: extras.slot !== false,
    cargo: extras.cargo === true,
    boarding: extras.boarding === true,
    utilityBook: extras.utilityBook === true,
  };
}

export function snapshotEmptyArmable(extras = {}) {
  try {
    requireEmptyArmableHelpers();
  } catch (error) {
    return {
      ok: false,
      missing: true,
      reason: error.helper ? `${error.helper}-missing` : String(error.message || error),
    };
  }

  const slots = canonicalizeWeaponSlots(extras.weaponSlots);
  const empty = slotsAreEmpty(slots);
  const fire = emptyArmableInjectMustNotGiftFire(extras.fireInject || {});
  const npcSlots = canonicalizeWeaponSlots(extras.npcSlots ?? extras.npc?.weaponSlots ?? (empty ? slots : CANONICAL_EMPTY_SLOTS));
  const combatWeaponId = extras.npcCombatWeaponId !== undefined
    ? extras.npcCombatWeaponId
    : resolveCombatWeaponId(npcSlots, {
      ship: extras.npcShip || extras.ship,
      isCombatWeapon: extras.isCombatWeapon,
    });
  const incomingEmpty = slotsAreEmpty(extras.incomingSlots ?? extras.weaponSlots);
  const outgoingEmpty = slotsAreEmpty(extras.outgoingSlots ?? extras.weaponSlots);
  const autoFilled = incomingEmpty && !outgoingEmpty;

  return {
    ok: true,
    missing: false,
    emptyArmableLockedFromRemastered: EMPTY_ARMABLE_LOCKED_FROM_REMASTERED === true,
    slotCount: EMPTY_ARMABLE_SLOT_COUNT,
    weaponSlots: slots.slice(),
    equippedWeaponId: empty ? null : (extras.equippedWeaponId ?? firstFilledSlot(slots)),
    canonicalEmpty: slotsAreEmpty([]) && slotsAreEmpty(CANONICAL_EMPTY_SLOTS),
    autoFilledDefaultWeapon: autoFilled === true,
    npc: {
      shipId: extras.npcShipId ?? extras.npc?.shipId ?? PACK_EMPTY_EXAMPLES[2],
      weaponSlots: npcSlots.slice(),
      combatWeaponId: combatWeaponId ?? null,
      emittedProjectile: extras.emittedProjectile === true,
    },
    tractor: tractorHomeSnapshot({
      type: extras.tractorType,
      slot: extras.tractorSlot,
      cargo: extras.tractorCargo,
      boarding: extras.tractorIsBoard,
      utilityBook: extras.tractorInUtilityBook,
    }),
    fire: {
      firingSolutionPresent: fire.firingSolutionPresent === true,
      engagementAuthorizedPresent: fire.engagementAuthorizedPresent === true,
    },
    boarding: {
      tractorIsBoard: extras.tractorIsBoard === true,
      implemented: extras.boardingImplemented !== false,
      emptySlotsStayEmpty: extras.emptySlotsStayEmpty !== false,
    },
    utilityBookHoldsCombatSlots: utilityBookHoldsCombatSlots(extras.utilityBook),
    fourthSlotPresent: Array.isArray(extras.weaponSlots) && extras.weaponSlots.length > EMPTY_ARMABLE_SLOT_COUNT,
  };
}
