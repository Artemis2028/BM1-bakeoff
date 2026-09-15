/**
 * Phase 10 Dominion-first — map / wormhole / tooltip chrome filters (gate 2).
 *
 * Omit sayable names, route-preview strings, wormhole destination chrome, and
 * planet-description tooltips until a named discovery write. Blender remains
 * labeled. Start-as-Dominion does not skip the hide.
 */

import {
  collectLeakedNames,
  hiddenSystemNames,
  isIsolatedDominionSystem,
  isSystemSayable,
  redactHiddenText,
  sayableSystemName,
} from './phase10-discovery.js';

export const UNDISCOVERED_LABEL = '';
export const UNDISCOVERED_WORMHOLE_REASON = 'Undiscovered destination.';

export function labelForSystem(discovery, observerKey, systemName) {
  return sayableSystemName(discovery, observerKey, systemName, UNDISCOVERED_LABEL);
}

export function shouldDrawSystemLabel(discovery, observerKey, systemName) {
  return isSystemSayable(discovery, observerKey, systemName);
}

export function filterRoutePreview(parts, discovery, observerKey) {
  return (Array.isArray(parts) ? parts : [])
    .map((name) => labelForSystem(discovery, observerKey, name))
    .filter(Boolean);
}

export function redactPlanetDescription(description, discovery, observerKey, systemName) {
  if (!isIsolatedDominionSystem(systemName) || isSystemSayable(discovery, observerKey, systemName)) {
    if (isIsolatedDominionSystem(systemName) && isSystemSayable(discovery, observerKey, systemName)) {
      return String(description || '');
    }
    if (!isIsolatedDominionSystem(systemName)) {
      return redactHiddenText(String(description || ''), discovery, observerKey);
    }
  }
  return '';
}

export function filterWormholeOptions(options, discovery, observerKey) {
  return (Array.isArray(options) ? options : []).filter((option) => {
    const name = option?.trueName || option?.name;
    return isSystemSayable(discovery, observerKey, name);
  });
}

export function wormholeDefaultNamesDominica(options, discovery, observerKey) {
  if (!isSystemSayable(discovery, observerKey, 'Dominica')) return false;
  return (Array.isArray(options) ? options : []).some((option) => (
    String(option?.trueName || option?.name || '').toLowerCase() === 'dominica'
  ));
}

export function preferWormholeDestination(options, discovery, observerKey, preferredName = 'Dominica') {
  const list = Array.isArray(options) ? options : [];
  if (!isSystemSayable(discovery, observerKey, preferredName)) {
    return list.find((option) => !option.disabled && !isIsolatedDominionSystem(option.trueName || option.name))?.index
      ?? list.find((option) => !option.disabled)?.index
      ?? null;
  }
  const preferred = list.find((option) => {
    const name = option.trueName || option.name;
    return String(name).toLowerCase() === String(preferredName).toLowerCase() && !option.disabled;
  });
  return preferred?.index ?? list.find((option) => !option.disabled)?.index ?? null;
}

export function refuseUnearnedTransit(discovery, observerKey, destinationName) {
  if (!isIsolatedDominionSystem(destinationName)) return { ok: true };
  if (isSystemSayable(discovery, observerKey, destinationName)) return { ok: true };
  return {
    ok: false,
    reason: 'undiscovered-destination',
    sayable: 'You have not discovered this destination.',
    aggression: false,
  };
}

export function hideSnapshot(discovery, observerKey, extras = {}) {
  const labels = extras.labels || [];
  const descriptions = extras.descriptions || [];
  const routes = extras.routePreview || [];
  const wormholeNames = extras.wormholeNames || [];
  const leakedNames = collectLeakedNames(
    [...labels, ...descriptions, ...routes, ...wormholeNames],
    discovery,
    observerKey,
  );
  return {
    startFaction: extras.startFaction || null,
    currentSystem: extras.currentSystem || null,
    hiddenSystems: hiddenSystemNames(discovery, observerKey),
    leakedNames,
    wormholeDefaultNamesDominica: extras.wormholeDefaultNamesDominica === true,
    mapRevealed: leakedNames.length === 0 ? Boolean(extras.mapRevealed) : extras.mapRevealed === true,
  };
}

export { collectLeakedNames, redactHiddenText, isIsolatedDominionSystem };
