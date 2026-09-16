/**
 * Phase 9.4 — central injectable playtest magnitude ledger (gates 1–3).
 *
 * Merges family / catalog / 9.1 clocks / 9.2 depth / 9.3 poison+DF resolve
 * helpers into one playtest book. Override must change the snapshot **and**
 * the live path those helpers claim. MAGNITUDES_LOCKED_FROM_REMASTERED stays
 * false. Starting defaults are TBD / playtest — not remastered watts.
 *
 * Source: docs/phase9/BM1-PHASE9.4-MAGNITUDES-PLAYTEST-PROPOSAL.md §3–§4
 *         docs/phase9/BM1-PHASE9.4-ENGINE-DEPENDENCIES.md
 */

import { EW_FAMILIES, EW_MAGNITUDES, resolveEwMagnitudes as resolveFamilyMagnitudes } from './phase9-ew.js';
import {
  EW_EQUIPMENT_CATALOG,
  MAGNITUDES_LOCKED_FROM_REMASTERED as SLOT_LOCK,
  resolveEwMagnitudes as resolveCatalogMagnitudes,
} from './phase91-ew-slot.js';
import { PHASE91_DEFAULTS, resolvePhase91Defaults } from './phase91-power.js';
import {
  MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE92_LOCK,
  PHASE92_DEFAULTS,
  resolvePhase92Defaults,
} from './phase92-magnitudes.js';
import {
  MAGNITUDES_LOCKED_FROM_REMASTERED as PHASE93_LOCK,
  PHASE93_DEFAULTS,
  resolvePhase93Defaults,
} from './phase93-magnitudes.js';

export const PHASE94_BOOK_VERSION = 1;
export const MAGNITUDES_LOCKED_FROM_REMASTERED = false;

export const PHASE94_PLAYTEST_LINE = 'Playtest ledger. Magnitudes injectable — not a remastered lock, not a firing solution.';

const PHASE91_FLAT_KEYS = Object.freeze([
  'spinUpLocalMs',
  'cooldownLocalMs',
  'selfCancel',
  'eccmBoost',
  'burnThroughB',
  'clearRatio',
  'sTable',
]);

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function pickKeys(src, keys) {
  const out = {};
  if (!src) return out;
  for (const key of keys) {
    if (src[key] != null) out[key] = src[key];
  }
  return out;
}

function familyInject(src) {
  const nested = asObject(src?.families) || {};
  const out = { ...nested };
  for (const family of EW_FAMILIES) {
    if (asObject(src?.[family])) out[family] = { ...out[family], ...src[family] };
  }
  return out;
}

function catalogInject(src) {
  const out = {};
  for (const tier of ['compact', 'tactical', 'fleet']) {
    if (asObject(src?.[tier])) out[tier] = src[tier];
  }
  return out;
}

/**
 * Central §3 ledger. Nested `phase91` / `phase92` / `phase93` / `families`
 * slices are accepted; top-level inject keys win.
 */
export function resolvePhase94Defaults(injected = null) {
  const src = asObject(injected) || {};
  const nested91 = asObject(src.phase91) || {};
  const nested92 = asObject(src.phase92) || {};
  const nested93 = asObject(src.phase93) || {};
  const phase91 = resolvePhase91Defaults({ ...nested91, ...pickKeys(src, PHASE91_FLAT_KEYS) });
  const phase92 = resolvePhase92Defaults({ ...nested92, ...src });
  const phase93 = resolvePhase93Defaults({ ...nested93, ...src });
  const families = resolveFamilyMagnitudes(familyInject(src));
  const catalog = resolveCatalogMagnitudes(catalogInject(src));
  return {
    compact: catalog.compact,
    tactical: catalog.tactical,
    fleet: catalog.fleet,
    families,
    sensor_jamming: families.sensor_jamming,
    deceptive_contacts: families.deceptive_contacts,
    fire_control: families.fire_control,
    comms_disruption: families.comms_disruption,
    ...phase91,
    ...phase92,
    ...phase93,
    phase91,
    phase92,
    phase93,
    playtest: true,
    remasteredWattLock: false,
    magnitudesLockedFromRemastered: MAGNITUDES_LOCKED_FROM_REMASTERED,
  };
}

export function snapshotPhase94Magnitudes(injected = null) {
  const defaults = resolvePhase94Defaults(injected);
  return {
    ...defaults,
    compact: { ...EW_EQUIPMENT_CATALOG.compact, ...(defaults.compact || {}) },
    tactical: { ...EW_EQUIPMENT_CATALOG.tactical, ...(defaults.tactical || {}) },
    fleet: { ...EW_EQUIPMENT_CATALOG.fleet, ...(defaults.fleet || {}) },
    families: { ...EW_MAGNITUDES, ...(defaults.families || {}) },
    phase91: { ...PHASE91_DEFAULTS, sTable: { ...PHASE91_DEFAULTS.sTable }, ...(defaults.phase91 || {}) },
    phase92: { ...PHASE92_DEFAULTS, ...(defaults.phase92 || {}) },
    phase93: { ...PHASE93_DEFAULTS, ...(defaults.phase93 || {}) },
    magnitudesLockedFromRemastered: MAGNITUDES_LOCKED_FROM_REMASTERED,
    slotLock: SLOT_LOCK,
    phase92Lock: PHASE92_LOCK,
    phase93Lock: PHASE93_LOCK,
    playtest: true,
    remasteredWattLock: false,
    playtestLine: PHASE94_PLAYTEST_LINE,
  };
}

/** Live helpers subscribe through this so one inject is not a pretty-print copy. */
export function resolveLiveLedger(injected = null, book = null) {
  return resolvePhase94Defaults(injected || book?.defaults || book?.magnitudes || null);
}

/**
 * Fan the same inject onto 9.1 / 9.2 / 9.3 / 9.4 books so existing live
 * callers that still read `ew92.defaults` / `ew93.defaults` / catalog
 * magnitudes stay on the central path. Aliases for S16.14 / S19.11.
 */
export function applyInjectedLedger(books = {}, injected = null) {
  const raw = asObject(injected) || {};
  const resolved = resolvePhase94Defaults(raw);
  const phase91 = resolvePhase91Defaults(raw);
  const phase92 = resolvePhase92Defaults(raw);
  const phase93 = resolvePhase93Defaults(raw);
  if (books.ew94) {
    books.ew94.magnitudes = clone(raw);
    books.ew94.defaults = clone(resolved);
  }
  if (books.ew91) {
    books.ew91.magnitudes = clone(raw);
    books.ew91.defaults = clone(phase91);
  }
  if (books.ew92) {
    books.ew92.magnitudes = clone(raw);
    books.ew92.defaults = clone(phase92);
  }
  if (books.ew93) {
    books.ew93.magnitudes = clone(raw);
    books.ew93.defaults = clone(phase93);
  }
  return resolved;
}

export function emptyEw94Book() {
  return {
    version: PHASE94_BOOK_VERSION,
    magnitudes: null,
    defaults: null,
  };
}

export function createEw94Book(extras = {}) {
  return {
    version: PHASE94_BOOK_VERSION,
    magnitudes: extras.magnitudes || null,
    defaults: extras.defaults || null,
  };
}

export function serializeEw94Book(book) {
  return {
    version: PHASE94_BOOK_VERSION,
    magnitudes: book?.magnitudes ? clone(book.magnitudes) : null,
    defaults: book?.defaults ? clone(book.defaults) : null,
  };
}

export function restoreEw94Book(raw) {
  if (!raw || typeof raw !== 'object') return emptyEw94Book();
  return serializeEw94Book(raw);
}

export { clone };
