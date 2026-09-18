/**
 * Flags / passes / utility inventory book (S21).
 *
 * Source of truth:
 * - docs/flags-passes/BM1-FLAGS-PASSES-UTILITY-INVENTORY-PROPOSAL.md
 * - docs/flags-passes/BM1-FLAGS-PASSES-ENGINE-DEPENDENCIES.md
 *
 * Written from those docs + data/game_items.json price knobs only.
 * Does not crib BM1-remastered-work. UTILITY_LOCKED_FROM_REMASTERED stays false.
 *
 * Hard gates:
 * 1. Credentials never write weaponSlots / weaponInventory / cargoArray / suite / ew_equipment.
 * 2. Book lives outside systemStates, beside the three combat slots.
 * 3. settings.factionFlags remain price knobs; live price is injectable (omit ⇒ documented 1000).
 * 4. Thaleron Test Facility pass is unverified — not shipped.
 * 5. Knowledge / inventory only — never gift firingSolution / culture fire / engagement_authorized.
 * 6. capacity null, activation 'unset' — do not invent stacks or hotkeys.
 * 7. Do not reopen EW / boarding / Phase 10. Tractor stays a slot device.
 */

export const UTILITY_BOOK_VERSION = 1;
export const UTILITY_LOCKED_FROM_REMASTERED = false;
export const UTILITY_KINDS = Object.freeze(['faction_flag', 'facility_pass']);
export const LIVE_FLAG_PRICE_DEFAULT = 1000;
export const LIVE_FLAG_PRICE_DEFAULT_SOURCE = 'documented-live-1000';
export const UTILITY_CAPACITY = null;
export const UTILITY_ACTIVATION = 'unset';
export const THALERON_TEST_FACILITY_PASS = Object.freeze({ shipped: false, verified: false });
export const PLAYER_FACING_CREDENTIAL_LINE = 'Credentials. Inventory — not a weapon slot, not a firing solution.';

const COMBAT_STORE_KEYS = Object.freeze([
  'weaponSlots',
  'weaponInventory',
  'cargoArray',
  'sensorSuiteId',
  'ewEquipmentId',
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeId(value) {
  return String(value ?? '').trim().toLowerCase();
}

function uniqueIds(list) {
  const seen = new Set();
  const out = [];
  for (const raw of Array.isArray(list) ? list : []) {
    const id = normalizeId(raw);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function factionFlagItems(playerFlags = []) {
  return uniqueIds(playerFlags).map((id) => ({ kind: 'faction_flag', id }));
}

function emptyThaleron() {
  return { shipped: false, verified: false };
}

export function emptyUtilityBook(extras = {}) {
  return {
    version: UTILITY_BOOK_VERSION,
    facility_pass: [],
    capacity: null,
    activation: UTILITY_ACTIVATION,
    utilityLockedFromRemastered: false,
    thaleronTestFacilityPass: emptyThaleron(),
    priceInject: extras.priceInject && typeof extras.priceInject === 'object'
      ? { ...extras.priceInject }
      : null,
    hotkeys: null,
  };
}

export function aliasFactionFlags(playerFlags = []) {
  return factionFlagItems(playerFlags);
}

export function listFacilityPasses(book) {
  void book;
  return [];
}

export function deriveUtilityItems(playerFlags = [], book = null) {
  void book;
  return [...factionFlagItems(playerFlags), ...listFacilityPasses(book)];
}

export function syncUtilityBookAlias(state) {
  if (!state || typeof state !== 'object') return emptyUtilityBook();
  const book = state.utilityBook && typeof state.utilityBook === 'object'
    ? state.utilityBook
    : emptyUtilityBook();
  book.version = UTILITY_BOOK_VERSION;
  book.facility_pass = [];
  book.capacity = null;
  book.activation = UTILITY_ACTIVATION;
  book.utilityLockedFromRemastered = false;
  book.thaleronTestFacilityPass = emptyThaleron();
  book.hotkeys = null;
  state.utilityBook = book;
  return book;
}

export function serializeUtilityBook(book, playerFlags = []) {
  const store = book && typeof book === 'object' ? book : emptyUtilityBook();
  return {
    version: UTILITY_BOOK_VERSION,
    items: deriveUtilityItems(playerFlags, store),
    facility_pass: [],
    capacity: null,
    activation: UTILITY_ACTIVATION,
    utilityLockedFromRemastered: false,
    thaleronTestFacilityPass: emptyThaleron(),
    hotkeys: null,
  };
}

function stripUnverifiedPasses(rows) {
  void rows;
  return [];
}

export function restoreUtilityBook(saved, playerFlags = []) {
  const fromFlags = uniqueIds(playerFlags);
  const fromBook = uniqueIds(
    (saved && typeof saved === 'object' && Array.isArray(saved.items) ? saved.items : [])
      .filter((row) => row && row.kind === 'faction_flag')
      .map((row) => row.id),
  );
  const mergedFlags = uniqueIds([...fromFlags, ...fromBook]);
  const book = emptyUtilityBook();
  book.facility_pass = stripUnverifiedPasses(saved?.facility_pass || saved?.items);
  book.capacity = null;
  book.activation = UTILITY_ACTIVATION;
  book.utilityLockedFromRemastered = false;
  book.thaleronTestFacilityPass = emptyThaleron();
  book.hotkeys = null;
  if (saved && typeof saved === 'object' && saved.priceInject && typeof saved.priceInject === 'object') {
    book.priceInject = { ...saved.priceInject };
  }
  return { book, playerFlags: mergedFlags };
}

export function copyCombatStores(state = {}) {
  return {
    weaponSlots: Array.isArray(state.weaponSlots) ? [...state.weaponSlots] : [],
    weaponInventory: Array.isArray(state.weaponInventory) ? [...state.weaponInventory] : [],
    cargoArray: clone(Array.isArray(state.cargoArray) ? state.cargoArray : []),
    sensorSuiteId: state.sensorSuiteId ?? null,
    ewEquipmentId: state.ewEquipmentId ?? null,
  };
}

export function combatStoresEqual(before, after) {
  return JSON.stringify(copyCombatStores(before)) === JSON.stringify(copyCombatStores(after));
}

export function assertNoCombatStoreMutation(before, after) {
  const left = copyCombatStores(before);
  const right = copyCombatStores(after);
  for (const key of COMBAT_STORE_KEYS) {
    if (JSON.stringify(left[key]) !== JSON.stringify(right[key])) {
      throw new Error(`utility-inventory: credential must not mutate ${key}`);
    }
  }
  return true;
}

export function writeCredentialIntoCombatStore(storeName, _row) {
  const name = String(storeName || '');
  if (COMBAT_STORE_KEYS.includes(name) || name === 'ew_equipment' || name === 'suite') {
    throw new Error(`utility-inventory: credentials must not write ${name}`);
  }
  throw new Error(`utility-inventory: unknown combat store ${name}`);
}

function looksLikeCredential(value) {
  if (value && typeof value === 'object') {
    return value.kind === 'faction_flag' || value.kind === 'facility_pass';
  }
  const id = normalizeId(value);
  return id === 'facility_pass' || id === 'thaleron-test-facility-pass' || id === 'asteroidpass';
}

export function combatStoresContainCredential(state = {}) {
  const bags = [
    ...(Array.isArray(state.weaponSlots) ? state.weaponSlots : []),
    ...(Array.isArray(state.weaponInventory) ? state.weaponInventory : []),
    ...(Array.isArray(state.cargoArray) ? state.cargoArray : []),
    state.sensorSuiteId,
    state.ewEquipmentId,
  ];
  return bags.some((row) => looksLikeCredential(row) || looksLikeCredential(row?.item) || looksLikeCredential(row?.id));
}

export function grantFactionFlagCredential(state, faction, extras = {}) {
  if (extras.intoSlots === true || extras.weaponSlots === true || extras.weaponInventory === true) {
    return { ok: false, reason: 'credential-must-not-write-combat-slot', wroteSlots: false };
  }
  if (!state || typeof state !== 'object') {
    return { ok: false, reason: 'missing-state', wroteSlots: false };
  }
  const before = copyCombatStores(state);
  const key = normalizeId(faction);
  if (!key) return { ok: false, reason: 'missing-faction', wroteSlots: false };
  if (!Array.isArray(state.playerFlags)) state.playerFlags = [];
  if (!state.playerFlags.map(normalizeId).includes(key)) state.playerFlags.push(key);
  syncUtilityBookAlias(state);
  assertNoCombatStoreMutation(before, state);
  if (combatStoresContainCredential(state)) {
    throw new Error('utility-inventory: credential landed in a combat/device store');
  }
  return {
    ok: true,
    faction: key,
    wroteSlots: false,
    playerFlags: [...state.playerFlags],
    items: deriveUtilityItems(state.playerFlags, state.utilityBook),
  };
}

export function resolveLiveFlagPrice(knobs = {}, inject = null) {
  if (inject && Number.isFinite(Number(inject.liveFlagPrice))) {
    return Math.max(0, Math.round(Number(inject.liveFlagPrice)));
  }
  if (inject && inject.useKnobs === true) {
    const base = Number(inject.basePrice ?? knobs.basePrice);
    if (Number.isFinite(base) && base >= 0) return Math.round(base);
  }
  return LIVE_FLAG_PRICE_DEFAULT;
}

export function liveFlagPriceSource(inject = null) {
  if (inject && Number.isFinite(Number(inject.liveFlagPrice))) return 'inject-liveFlagPrice';
  if (inject && inject.useKnobs === true) return 'inject-useKnobs-basePrice';
  return LIVE_FLAG_PRICE_DEFAULT_SOURCE;
}

export function applyPriceInject(book, opts = null) {
  const store = book && typeof book === 'object' ? book : emptyUtilityBook();
  if (!opts || typeof opts !== 'object' || Object.keys(opts).length === 0) {
    store.priceInject = null;
    return store;
  }
  const next = {};
  if (Object.prototype.hasOwnProperty.call(opts, 'liveFlagPrice') && Number.isFinite(Number(opts.liveFlagPrice))) {
    next.liveFlagPrice = Number(opts.liveFlagPrice);
  }
  if (Object.prototype.hasOwnProperty.call(opts, 'basePrice')) next.basePrice = opts.basePrice;
  if (Object.prototype.hasOwnProperty.call(opts, 'marketMultiplier')) next.marketMultiplier = opts.marketMultiplier;
  if (Object.prototype.hasOwnProperty.call(opts, 'blockedFactions')) next.blockedFactions = opts.blockedFactions;
  if (Object.prototype.hasOwnProperty.call(opts, 'useKnobs')) next.useKnobs = opts.useKnobs === true;
  store.priceInject = next;
  return store;
}

export function resolveFlagKnobs(settings = {}, inject = null) {
  const blocked = Array.isArray(inject?.blockedFactions)
    ? [...inject.blockedFactions]
    : [...(settings.blockedFactions || [])];
  return {
    basePrice: Number.isFinite(Number(inject?.basePrice))
      ? Number(inject.basePrice)
      : Number(settings.basePrice),
    marketMultiplier: Number.isFinite(Number(inject?.marketMultiplier))
      ? Number(inject.marketMultiplier)
      : Number(settings.marketMultiplier),
    blockedFactions: blocked,
  };
}

export function knowledgeDoesNotGiftFire() {
  return {
    firingSolutionPresent: false,
    engagementAuthorizedPresent: false,
    cultureFire: false,
  };
}

export function snapshotUtilityBook(book, extras = {}) {
  const store = book && typeof book === 'object' ? book : emptyUtilityBook();
  const playerFlags = uniqueIds(extras.playerFlags || []);
  const knobs = resolveFlagKnobs(extras.knobs || {}, store.priceInject);
  const inject = store.priceInject;
  const fire = knowledgeDoesNotGiftFire();
  return {
    utilityLockedFromRemastered: UTILITY_LOCKED_FROM_REMASTERED === true,
    book: {
      version: UTILITY_BOOK_VERSION,
      items: deriveUtilityItems(playerFlags, store),
      facility_pass: [],
      capacity: null,
      activation: UTILITY_ACTIVATION,
      utilityLockedFromRemastered: false,
    },
    playerFlags,
    weaponSlots: Array.isArray(extras.weaponSlots) ? [...extras.weaponSlots] : [],
    weaponInventory: Array.isArray(extras.weaponInventory) ? [...extras.weaponInventory] : [],
    cargoArray: clone(Array.isArray(extras.cargoArray) ? extras.cargoArray : []),
    sensorSuiteId: extras.sensorSuiteId ?? null,
    ewEquipmentId: extras.ewEquipmentId ?? null,
    thaleronTestFacilityPass: emptyThaleron(),
    thaleronItemId: null,
    thaleronVendor: null,
    thaleronMapPin: null,
    thaleronQuest: null,
    guidedThaleronPriceLock: null,
    asteroidPassShipped: false,
    capacity: null,
    activation: UTILITY_ACTIVATION,
    hotkeys: null,
    knobs,
    liveFlagPrice: resolveLiveFlagPrice(knobs, inject),
    liveFlagPriceSource: liveFlagPriceSource(inject),
    liveFlagPriceDefault: LIVE_FLAG_PRICE_DEFAULT,
    fire,
    boarding: {
      tractorIsBoard: extras.tractorIsBoard === true,
      implemented: extras.boardingImplemented !== false,
    },
    dominion: { rumorGiftedFs: extras.rumorGiftedFs === true },
    phase1: {
      flagShareGrantsControl: extras.flagShareGrantsControl === true,
      plantGrantsMarketTrust: extras.plantGrantsMarketTrust === true,
    },
    reman53: extras.reman53 || { id: 53, key: 'bm-ship:53' },
    playerFaction: extras.playerFaction || null,
    sayable: PLAYER_FACING_CREDENTIAL_LINE,
  };
}
