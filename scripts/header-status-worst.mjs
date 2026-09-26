/**
 * Longest player-facing header status.
 *
 * The new-game line is "<captain> aboard <ship>. <Faction> selected."
 * Captain length is the start-screen field maximum (32). Ship is the longest
 * roster name, capped the same way sanitizeShipName caps a typed name (36).
 * Faction is the longest faction label. Other real status templates are
 * compared by length; the longer string is the worst case.
 *
 * The removed FLA action-hint line is not a template here.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const HEADER_CAPTAIN_LIMIT = 32;
export const HEADER_SHIP_LIMIT = 36;
/** Longest captain the start screen will keep. */
export const HEADER_CAPTAIN_NAME = 'Maximilian Bartholomew Clarkeson';
/** Typed ship name at the start-screen maxlength and sanitizeShipName cap. */
export const HEADER_TYPED_SHIP_NAME = 'Concord Starfarer of New Switzerland';

if (HEADER_CAPTAIN_NAME.length !== HEADER_CAPTAIN_LIMIT) {
  throw new Error(`captain worst case is ${HEADER_CAPTAIN_NAME.length}, expected ${HEADER_CAPTAIN_LIMIT}`);
}
if (HEADER_TYPED_SHIP_NAME.length !== HEADER_SHIP_LIMIT) {
  throw new Error(`typed ship worst case is ${HEADER_TYPED_SHIP_NAME.length}, expected ${HEADER_SHIP_LIMIT}`);
}

function capName(value, limit, fallback) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return (text || fallback).slice(0, limit);
}

function longestFactionLabel() {
  const main = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
  const start = main.indexOf('const factionDefs = {');
  const end = main.indexOf('\nfunction loadGameOptions');
  const block = start >= 0 && end > start ? main.slice(start, end) : '';
  const labels = [...block.matchAll(/label: '([^']*)'/g)].map((match) => match[1]);
  return labels.reduce((best, label) => (label.length > best.length ? label : best), '');
}

function longestShipName() {
  const files = ['bm-ships/ships.json', 'data/starship_manifest.json'];
  let best = '';
  for (const relative of files) {
    const data = JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
    for (const ship of data.ships || []) {
      const name = capName(ship.name, HEADER_SHIP_LIMIT, '');
      if (name.length > best.length) best = name;
    }
  }
  return best;
}

function longestPlanetName() {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'data/mapnames.json'), 'utf8'));
  return (data.names || []).reduce((best, name) => {
    const text = String(name || '').trim();
    return text.length > best.length ? text : best;
  }, '');
}

function longestStationName() {
  const files = ['data/stationData.json', 'data/station_manifest.json'];
  let best = '';
  for (const relative of files) {
    const data = JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
    for (const station of data.stations || []) {
      const name = String(station.name || '').trim();
      if (name.length > best.length) best = name;
    }
  }
  return best;
}

function aboardSelected(captain, ship, label) {
  return `${captain} aboard ${ship}. ${label} selected.`;
}

export function longestHeaderStatusMessage() {
  const captain = capName(HEADER_CAPTAIN_NAME, HEADER_CAPTAIN_LIMIT, 'Captain');
  const ship = longestShipName() || 'Ship';
  const label = longestFactionLabel() || 'Independent Captain';
  const planet = longestPlanetName() || 'Ferenginar';
  const station = longestStationName() || 'Station';
  const candidates = [
    aboardSelected(captain, ship, label),
    `${captain} aboard ${ship}. Game loaded from slot 3.`,
    `Docked at ${planet}. Planet services open.`,
    `Docked at ${station}. Station defenses are active.`,
    'Undocked. Fly to a planet and click it to dock again.',
  ];
  return candidates.reduce((best, row) => (row.length > best.length ? row : best), '');
}

/** 32-character captain and a typed 36-character ship, normal mixed case. */
export function typedShipHeaderStatusMessage() {
  const label = longestFactionLabel() || 'Independent Captain';
  return aboardSelected(HEADER_CAPTAIN_NAME, HEADER_TYPED_SHIP_NAME, label);
}

/**
 * Captain and the typed 36-character ship, both plain capitals.
 * The faction label stays the usual mixed-case label.
 * This is not the W/M wide-capitals stress line.
 */
export function realAllCapsFactionShipMessage() {
  const label = longestFactionLabel() || 'Independent Captain';
  return aboardSelected(
    HEADER_CAPTAIN_NAME.toUpperCase(),
    HEADER_TYPED_SHIP_NAME.toUpperCase(),
    label,
  );
}

/**
 * All-caps form of the W/M-heavy real captain name used on #76
 * (Maximilian Bartholomew Clarkeson: the W and M glyphs are real letters,
 * not a synthetic run of W's and M's), with the longest real roster ship,
 * both plain capitals. Faction label stays the usual mixed-case label.
 */
export function realWmHeavyAllCapsMessage() {
  const label = longestFactionLabel() || 'Independent Captain';
  const ship = longestShipName() || 'Ship';
  return aboardSelected(HEADER_CAPTAIN_NAME.toUpperCase(), ship.toUpperCase(), label);
}

/** Same lengths in wide capitals: 32 W's and 36 M's, plus the longest faction label. */
export function wideCapsHeaderStatusMessage() {
  const label = longestFactionLabel() || 'Independent Captain';
  return aboardSelected('W'.repeat(HEADER_CAPTAIN_LIMIT), 'M'.repeat(HEADER_SHIP_LIMIT), label);
}
