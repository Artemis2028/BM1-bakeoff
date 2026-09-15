/**
 * Prize identity — preserve hull instance, no silent refit (gate 6).
 *
 * Source of truth:
 * - docs/boarding/BM1-BOARDING-CAPTURE-PROPOSAL.md §8
 *
 * Capture takes command of that hull. It does not call applyShipDefaultWeapons,
 * resolveNewLiveShipId, rewrite concessions, gift a foreign fleet, or change
 * playerFaction / playerSide / Reman unlock.
 */

import { preserveNpcIdentityFields } from './phase1-authority.js';

export const PRIZE_ID_PREFIX = 'pz-';

export function nextPrizeCommandId(book) {
  const n = Math.max(1, Number(book?.nextPrizeId) || 1);
  if (book) book.nextPrizeId = n + 1;
  return `${PRIZE_ID_PREFIX}${n}`;
}

export function cloneSlots(slots) {
  if (!Array.isArray(slots)) return [];
  return slots.map((slot) => (slot == null ? null : slot));
}

export function emptySlotsStayEmpty(before, after) {
  const a = cloneSlots(before);
  const b = cloneSlots(after);
  if (!a.length && !b.length) return true;
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Build a prize row from a live hull. Does not destroy, refit, or rewrite
 * politics. commandId is new; sourceInstanceId stays the original security id.
 */
export function prizeRowFromHull(hull = {}, extras = {}) {
  const identity = preserveNpcIdentityFields(hull);
  const commandId = extras.commandId || nextPrizeCommandId(extras.book);
  const sourceInstanceId = hull.securityInstanceId || hull.sourceInstanceId || extras.sourceInstanceId || null;
  const slots = cloneSlots(hull.weaponSlots);
  const max = Number(hull.maxCombatHull) || 0;
  const combatHull = Number(hull.combatHull);
  return {
    id: commandId,
    sourceInstanceId,
    shipId: identity.shipId,
    name: identity.name,
    formerFaction: hull.formerFaction || identity.faction || null,
    faction: extras.commandFaction || extras.playerFaction || identity.faction,
    role: extras.role || 'playerEscort',
    assignment: extras.assignment || 'escort',
    weaponSlots: slots,
    sensorSuiteId: hull.sensorSuiteId || null,
    ewEquipmentId: hull.ewEquipmentId || null,
    cargo: hull.cargo != null ? hull.cargo : (Array.isArray(hull.cargoArray) ? hull.cargoArray : null),
    combatHull: Number.isFinite(combatHull) ? combatHull : null,
    maxCombatHull: max || null,
    hullRatio: max > 0 && Number.isFinite(combatHull) ? combatHull / max : null,
    capturedAtLocalMs: Math.max(0, Number(extras.localElapsedMs) || 0),
    captured: true,
    destroyed: false,
    scuttled: false,
    applyShipDefaultWeaponsCalled: false,
    resolveNewLiveShipIdCalled: false,
    playerFactionRewritten: false,
    remanUnlockGranted: false,
    concessionsRewritten: false,
    foreignFleetConscripted: false,
    engagement_authorized: undefined,
  };
}

export function capturePrizeHull(book, hull, extras = {}) {
  const store = book || emptyPrizeBook();
  if (hull?.destroyed || Number(hull?.combatHull) <= 0) {
    return { ok: false, reason: 'wreck', prize: null, captured: false, scuttled: false };
  }
  if (hull?.captured && extras.allowRecapture !== true) {
    return { ok: false, reason: 'already-captured', prize: null };
  }
  const prize = prizeRowFromHull(hull, { ...extras, book: store });
  store.prizes = store.prizes || {};
  store.prizes[prize.id] = prize;
  if (prize.sourceInstanceId) {
    store.prizesBySource = store.prizesBySource || {};
    store.prizesBySource[prize.sourceInstanceId] = prize.id;
  }
  return {
    ok: true,
    prize,
    captured: true,
    scuttled: false,
    destroyed: false,
    identity: {
      shipId: prize.shipId,
      weaponSlots: cloneSlots(prize.weaponSlots),
      emptySlotsStayEmpty: emptySlotsStayEmpty(hull.weaponSlots, prize.weaponSlots),
      name: prize.name,
      sourceInstanceId: prize.sourceInstanceId,
      commandId: prize.id,
      notAmbientNpcId: prize.id !== hull.id,
    },
    applyShipDefaultWeaponsCalled: false,
    concessions: extras.stations ? extras.stations.map((row) => ({ ...row })) : extras.stations,
    foreignHullsUntouched: true,
    playerFaction: extras.playerFaction,
    playerSide: extras.playerSide,
    reman53: extras.reman53,
    engagement_authorized: undefined,
    giftedFs: false,
  };
}

export function emptyPrizeBook() {
  return { nextPrizeId: 1, prizes: {}, prizesBySource: {} };
}

export function identitySnapshot(prize, extras = {}) {
  return {
    shipId: prize?.shipId ?? null,
    weaponSlots: cloneSlots(prize?.weaponSlots),
    emptySlotsStayEmpty: extras.beforeSlots
      ? emptySlotsStayEmpty(extras.beforeSlots, prize?.weaponSlots)
      : true,
    playerFaction: extras.playerFaction,
    playerSide: extras.playerSide,
    reman53: extras.reman53,
    concessionOwnerUnchanged: extras.concessionOwnerUnchanged !== false,
    foreignFleetNotConscripted: extras.foreignFleetNotConscripted !== false,
  };
}
