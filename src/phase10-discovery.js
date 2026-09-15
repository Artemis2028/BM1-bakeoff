/**
 * Phase 10 Dominion-first — per-observer discovery hide (gate 2).
 *
 * Distant Dominion systems stay unsayable until a named discovery write.
 * Blender / remnant start does not auto-reveal. Contact knowledge is not a
 * map dump. Discovery lists systems; no galaxy dump.
 */

export const ISOLATED_DOMINION_SYSTEM_NAMES = Object.freeze([
  'Dominica',
  'Vortara',
  'New Bajor',
  'JemHadar Relay',
  'Karemma Exchange',
  'Founders Watch',
  'Dosi Gate',
  'T-Rogoran Annex',
]);

export const HIDDEN_FLAVOR_NEEDLES = Object.freeze([
  'gamma quadrant',
  'dreaded dominion',
]);

const HIDDEN_SET = new Set(ISOLATED_DOMINION_SYSTEM_NAMES.map((name) => normalizeName(name)));

export function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

export function isIsolatedDominionSystem(name) {
  return HIDDEN_SET.has(normalizeName(name));
}

export function emptyDiscoveryMap(saved = null) {
  const revealed = {};
  const source = saved && typeof saved === 'object' ? saved : {};
  for (const [observerKey, list] of Object.entries(source)) {
    revealed[String(observerKey)] = uniqueNames(list);
  }
  return revealed;
}

function uniqueNames(list) {
  const out = [];
  const seen = new Set();
  for (const raw of Array.isArray(list) ? list : []) {
    const name = String(raw || '').trim();
    if (!name) continue;
    const key = normalizeName(name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

export function revealedSystemsFor(discovery, observerKey = 'player') {
  return uniqueNames(discovery?.[String(observerKey)] || []);
}

export function observerHasSystem(discovery, observerKey, systemName) {
  const needle = normalizeName(systemName);
  if (!needle) return false;
  return revealedSystemsFor(discovery, observerKey).some((name) => normalizeName(name) === needle);
}

/**
 * Named discovery write. Lists systems only — no galaxy dump.
 * Starting faction / contact layer must not call this.
 */
export function injectDiscovery(discovery, { observerKey = 'player', systemNames = [] } = {}) {
  const store = discovery && typeof discovery === 'object' ? discovery : emptyDiscoveryMap();
  const key = String(observerKey || 'player');
  const listed = uniqueNames(systemNames).filter((name) => isIsolatedDominionSystem(name) || name);
  const current = revealedSystemsFor(store, key);
  const merged = uniqueNames([...current, ...listed]);
  store[key] = merged;
  return {
    ok: true,
    observerKey: key,
    listed: uniqueNames(systemNames),
    revealed: merged,
    galaxyDump: false,
    book: store,
  };
}

export function isSystemSayable(discovery, observerKey, systemName) {
  if (!isIsolatedDominionSystem(systemName)) return true;
  return observerHasSystem(discovery, observerKey, systemName);
}

export function sayableSystemName(discovery, observerKey, systemName, fallback = '') {
  if (isSystemSayable(discovery, observerKey, systemName)) return String(systemName || '');
  return fallback;
}

export function hiddenSystemNames(discovery, observerKey = 'player') {
  return ISOLATED_DOMINION_SYSTEM_NAMES.filter((name) => !observerHasSystem(discovery, observerKey, name));
}

export function collectLeakedNames(strings = [], discovery = {}, observerKey = 'player') {
  const blob = (Array.isArray(strings) ? strings : [strings])
    .map((value) => String(value || ''))
    .join('\n')
    .toLowerCase();
  const leaked = [];
  for (const name of hiddenSystemNames(discovery, observerKey)) {
    if (blob.includes(normalizeName(name))) leaked.push(name);
  }
  if (HIDDEN_FLAVOR_NEEDLES.some((needle) => blob.includes(needle))) {
    if (!leaked.includes('Gamma Quadrant')) leaked.push('Gamma Quadrant');
  }
  return leaked;
}

export function redactHiddenText(text, discovery, observerKey = 'player') {
  let out = String(text || '');
  for (const name of hiddenSystemNames(discovery, observerKey)) {
    const pattern = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    out = out.replace(pattern, '');
  }
  out = out.replace(/gamma quadrant/gi, '');
  out = out.replace(/home to the dreaded dominion\.?/gi, '');
  return out.replace(/\s{2,}/g, ' ').replace(/\s+([,.])/g, '$1').trim();
}

export function filterNameList(names, discovery, observerKey = 'player') {
  return (Array.isArray(names) ? names : []).filter((name) => isSystemSayable(discovery, observerKey, name));
}
