/**
 * Weapon / device source ledger — subscribe-only audit (S22).
 *
 * Source of truth:
 * - docs/weapon-ledger/BM1-WEAPON-DEVICE-SOURCE-LEDGER-PROPOSAL.md
 * - docs/weapon-ledger/BM1-WEAPON-LEDGER-ENGINE-DEPENDENCIES.md
 *
 * Written from those docs + data/game_items.json + the landed Phase 9 matrix
 * helpers. Does not crib BM1-remastered-work. LEDGER_LOCKED_FROM_REMASTERED
 * stays false. FLASH_PRICES_ARE_LIVE_LOCKS and UNIVERSAL_SHIELD_BYPASS stay
 * false (subscribed from the matrix — not flipped).
 *
 * Hard gates:
 * 1. Audit, not retune. Combat-number writes hard-fail.
 * 2. Three disruptor identities (Canon 7 / Cannon 6 / Turret 12). Tractor id 25
 *    stays a Device slot — not cargo, not utilityBook, not boarding.
 * 3. Flash prices are source labels, not live locks. Plasma 7200 is current data.
 * 4. Bajoran Sail + Warp Core deferred utilities (bakeoffId null); Warp Core ≠
 *    cargo "Warp Cores"; neither is a credential.
 * 5. Inherited-not-in-Flash ids [2, 27, 28, 29, 30, 38, 39, 44, 45]; no invented
 *    Flash prices. HoJ stays provenance new.
 * 6. Provenance enum only. Never gift firingSolution / culture /
 *    engagement_authorized. No universal shield bypass.
 * 7. Do not reopen EW / boarding / Phase 10 / flags.
 */

import {
  BASELINE_COMBAT_NUMBERS,
  FLASH_PRICES_ARE_LIVE_LOCKS,
  HOJ_MATRIX_ROW,
  MATRIX_COLUMNS,
  TRACTOR_ID,
  UNIVERSAL_SHIELD_BYPASS,
  applyDefaultShieldAbsorb,
  buildWeaponsMatrix,
  combatNumbersUnchanged,
  disruptorIdentities,
  listDeferredFlashUtilities,
  listMatrixColumns,
  ordinaryBeamDoesNotInheritLoreBypass,
  proposedHojRow,
  tractorRow,
} from './phase9-weapons-matrix.js';

export const LEDGER_LOCKED_FROM_REMASTERED = false;
export const FORBIDDEN_FIRE_INJECT = 'engagement_authorized';
export const PROVENANCE_VALUES = Object.freeze([
  'BM1-flash',
  'retained-BM2',
  'bake-off-game-items',
  'new',
]);
export const INHERITED_NOT_IN_FLASH_IDS = Object.freeze([2, 27, 28, 29, 30, 38, 39, 44, 45]);
export const RETAINED_BM2_IDS = Object.freeze([2, 27, 28, 29]);
export const VACANT_CATALOG_IDS = Object.freeze([
  20, 21, 31, 32, 33, 34, 35, 36, 37, 40, 41, 42, 43,
]);
export const PLASMA_TORPEDO_ID = 17;
export const CANON_ID = 7;
export const CANNON_ID = 6;
export const TURRET_ID = 12;

export {
  BASELINE_COMBAT_NUMBERS,
  FLASH_PRICES_ARE_LIVE_LOCKS,
  MATRIX_COLUMNS,
  UNIVERSAL_SHIELD_BYPASS,
};

const UTILITY_BOOK_FORBIDDEN = Object.freeze([
  'tractor',
  'tractor beam',
  'bajoran sail',
  'warp core',
  'cloaking device',
  'cloak',
  'thaleron generator',
]);

function requireHelper(helper, name) {
  if (typeof helper !== 'function') {
    const error = new Error(`weapon-source-ledger: ${name} missing`);
    error.missing = true;
    error.helper = name;
    throw error;
  }
}

function requireMatrixHelpers() {
  requireHelper(buildWeaponsMatrix, 'buildWeaponsMatrix');
  requireHelper(listDeferredFlashUtilities, 'listDeferredFlashUtilities');
  requireHelper(disruptorIdentities, 'disruptorIdentities');
  requireHelper(tractorRow, 'tractorRow');
  requireHelper(combatNumbersUnchanged, 'combatNumbersUnchanged');
}

function normalizeName(value) {
  if (value && typeof value === 'object') {
    return String(value.id ?? value.name ?? value.flashName ?? value.kind ?? '').trim().toLowerCase();
  }
  return String(value ?? '').trim().toLowerCase();
}

function listUtilityBookIds(book) {
  const store = book && typeof book === 'object' ? book : {};
  const rows = [
    ...(Array.isArray(store.items) ? store.items : []),
    ...(Array.isArray(store.facility_pass) ? store.facility_pass : []),
    ...(Array.isArray(store.faction_flag) ? store.faction_flag : []),
  ];
  return rows.map(normalizeName).filter(Boolean);
}

function utilityBookHoldsForbidden(book) {
  const ids = listUtilityBookIds(book);
  return ids.some((id) => UTILITY_BOOK_FORBIDDEN.includes(id));
}

function flashPriceFor(row) {
  if (!row) return null;
  if (row.id === PLASMA_TORPEDO_ID) return null;
  return row.flashPrice == null ? null : row.flashPrice;
}

export function provenanceForLedgerRow(id) {
  if (id === 'hoj-anti-emitter' || id == null) return 'new';
  const numeric = Number(id);
  if (RETAINED_BM2_IDS.includes(numeric)) return 'retained-BM2';
  if (INHERITED_NOT_IN_FLASH_IDS.includes(numeric)) return 'bake-off-game-items';
  if (numeric === PLASMA_TORPEDO_ID) return 'BM1-flash';
  return 'BM1-flash';
}

export function writeCombatNumbers(_target, _id, _fields) {
  throw new Error('weapon-source-ledger: combat-number writes are forbidden (audit, not retune)');
}

export function lockFlashPrices() {
  throw new Error('weapon-source-ledger: Flash prices are source material, not live locks');
}

export function ledgerInjectMustNotGiftFire(target = {}) {
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

export function classifyDeferredUtilities(tradeGoods = [], utilityBook = null, deferred = null) {
  const goods = (Array.isArray(tradeGoods) ? tradeGoods : []).map((row) => String(row ?? '').trim());
  const bookIds = listUtilityBookIds(utilityBook);
  const source = Array.isArray(deferred) && deferred.length
    ? deferred
    : listDeferredFlashUtilities();
  const sail = source.find((row) => row.flashName === 'Bajoran Sail') || {
    flashName: 'Bajoran Sail',
    bakeoffId: null,
  };
  const core = source.find((row) => row.flashName === 'Warp Core') || {
    flashName: 'Warp Core',
    bakeoffId: null,
  };
  const sailInCargo = goods.some((name) => /^bajoran sail$/i.test(name));
  const warpCoreSingular = goods.some((name) => /^warp core$/i.test(name));
  const warpCoresPlural = goods.some((name) => /^warp cores$/i.test(name));
  const sailInBook = bookIds.includes('bajoran sail') || bookIds.includes('bajoran-sail');
  const coreInBook = bookIds.includes('warp core') || bookIds.includes('warp-core');
  return [
    {
      flashName: 'Bajoran Sail',
      bakeoffId: sail.bakeoffId ?? null,
      cargo: sailInCargo,
      utilityBook: sailInBook,
      classification: 'deferred-utility',
    },
    {
      flashName: 'Warp Core',
      bakeoffId: core.bakeoffId ?? null,
      cargo: warpCoreSingular,
      cargoNameWarpCoresDistinct: warpCoresPlural && !warpCoreSingular,
      utilityBook: coreInBook,
      classification: 'deferred-utility-not-trade-good',
    },
  ];
}

function displayNameCollisionFinding(items = []) {
  const cannon = items.find((row) => Number(row.id) === CANNON_ID);
  const canon = items.find((row) => Number(row.id) === CANON_ID);
  const liveName = cannon?.name || canon?.name || 'Disruptor Cannon';
  return {
    ids: [CANNON_ID, CANON_ID],
    liveName,
    collision: Boolean(cannon && canon && cannon.name === canon.name),
    merged: false,
    finding: 'display-name-collision-not-a-merge',
  };
}

function vacantIdsFrom(items = []) {
  const present = new Set((Array.isArray(items) ? items : []).map((row) => Number(row.id)));
  return VACANT_CATALOG_IDS.filter((id) => !present.has(id));
}

function inheritedRowsFrom(matrixRows = []) {
  return INHERITED_NOT_IN_FLASH_IDS.map((id) => {
    const row = matrixRows.find((item) => Number(item.id) === id) || null;
    return {
      id,
      name: row?.name || null,
      flashPrice: null,
      flashCertified: false,
      provenance: provenanceForLedgerRow(id),
    };
  });
}

function auditRows(items = [], matrixRows = []) {
  const byId = new Map((matrixRows || []).map((row) => [Number(row.id), row]));
  const catalog = (Array.isArray(items) ? items : []).map((item) => {
    const matrix = byId.get(Number(item.id));
    const id = Number(item.id);
    return {
      id,
      name: item.name,
      livePrice: item.price,
      flashPrice: flashPriceFor(matrix),
      flashCertified: false,
      flashPriceIsLiveLock: false,
      provenance: provenanceForLedgerRow(id),
      liveNumbersProvenance: 'bake-off-game-items',
    };
  });
  catalog.push({
    id: 'hoj-anti-emitter',
    name: HOJ_MATRIX_ROW.name,
    catalogId: HOJ_MATRIX_ROW.catalogId,
    flashPrice: null,
    flashCertified: false,
    flashPriceIsLiveLock: false,
    provenance: 'new',
    liveNumbersProvenance: 'new',
  });
  return catalog;
}

export function snapshotWeaponLedger(extras = {}) {
  try {
    requireMatrixHelpers();
  } catch (error) {
    return {
      ok: false,
      missing: true,
      reason: error.helper ? `${error.helper}-missing` : String(error.message || error),
    };
  }

  const items = Array.isArray(extras.items) ? extras.items : [];
  const hulls = Array.isArray(extras.hulls) ? extras.hulls : [];
  const matrixRows = buildWeaponsMatrix(items, hulls);
  const numbers = combatNumbersUnchanged(items, BASELINE_COMBAT_NUMBERS);
  const disruptors = disruptorIdentities(matrixRows);
  const tractor = tractorRow(matrixRows);
  const deferredSource = listDeferredFlashUtilities();
  const deferred = classifyDeferredUtilities(extras.tradeGoods, extras.utilityBook, deferredSource);
  const ordinary = matrixRows.find((row) => Number(row.id) === 1);
  const lore = matrixRows.find((row) => Number(row.id) === 18);
  const absorb = applyDefaultShieldAbsorb(40, 20);
  const plasma = items.find((row) => Number(row.id) === PLASMA_TORPEDO_ID)
    || matrixRows.find((row) => Number(row.id) === PLASMA_TORPEDO_ID);
  const fire = ledgerInjectMustNotGiftFire(extras.fireInject || {});
  const rows = auditRows(items, matrixRows);
  const hoj = proposedHojRow();

  return {
    ledgerLockedFromRemastered: LEDGER_LOCKED_FROM_REMASTERED === true,
    flashPricesAreLiveLocks: FLASH_PRICES_ARE_LIVE_LOCKS === true,
    universalShieldBypass: UNIVERSAL_SHIELD_BYPASS === true,
    combatUnchanged: numbers.unchanged === true,
    combatMismatches: numbers.mismatches,
    matrixColumns: listMatrixColumns().length || MATRIX_COLUMNS.length,
    disruptors: {
      canon: {
        id: CANON_ID,
        flashIdentity: disruptors.canon?.identity || 'Disrupter Canon',
      },
      cannon: {
        id: CANNON_ID,
        flashIdentity: disruptors.cannon?.identity || 'Disrupter Cannon',
      },
      turret: {
        id: TURRET_ID,
        flashIdentity: disruptors.turret?.identity || 'Disrupter Turret',
      },
      distinct: disruptors.distinct === true,
    },
    tractor: {
      id: TRACTOR_ID,
      type: tractor.type || 'Device',
      slot: tractor.slot === true,
      cargo: tractor.cargo === true,
      boarding: extras.tractorIsBoard === true || tractor.boarding === true,
    },
    plasmaTorpedo: {
      id: PLASMA_TORPEDO_ID,
      livePrice: Number(plasma?.price ?? plasma?.livePrice ?? 7200),
      flashCertified: false,
      flashPrice: null,
      identityProvenance: 'BM1-flash',
      liveNumbersProvenance: 'bake-off-game-items',
      label: 'Flash name / bake-off price',
    },
    deferredUtilities: deferred,
    inheritedNotInFlash: INHERITED_NOT_IN_FLASH_IDS.slice(),
    inheritedRows: inheritedRowsFrom(matrixRows),
    hoj: {
      provenance: hoj.provenance || 'new',
      catalogId: hoj.catalogId ?? null,
    },
    vacantIdsStillVacant: vacantIdsFrom(items),
    findings: {
      displayNameCollision: displayNameCollisionFinding(items),
    },
    rows,
    fire: {
      firingSolutionPresent: fire.firingSolutionPresent === true,
      engagementAuthorizedPresent: fire.engagementAuthorizedPresent === true,
    },
    shields: {
      universalShieldBypass: UNIVERSAL_SHIELD_BYPASS === true,
      ordinaryBeam: {
        interaction: absorb.interaction,
        bypassedShields: absorb.bypassedShields === true,
        shieldDamage: absorb.shieldDamage,
        hullDamage: absorb.hullDamage,
      },
      loreDoesNotInherit: ordinary && lore
        ? ordinaryBeamDoesNotInheritLoreBypass(ordinary, lore)
        : UNIVERSAL_SHIELD_BYPASS === false,
    },
    boarding: {
      tractorIsBoard: extras.tractorIsBoard === true,
      implemented: extras.boardingImplemented !== false,
    },
    utilityBookHoldsForbidden: utilityBookHoldsForbidden(extras.utilityBook),
  };
}
