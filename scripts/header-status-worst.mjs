/**
 * Longest header status the game can show: forced max-length captain and ship
 * names (sanitizePlayerName / sanitizeShipName caps) combined with the longest
 * aboard-status template, including a loaded FLA hint when one exists.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const HEADER_CAPTAIN_LIMIT = 32;
export const HEADER_SHIP_LIMIT = 36;

function longestFactionLabel() {
  const main = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
  const start = main.indexOf('const factionDefs = {');
  const end = main.indexOf('\nfunction loadGameOptions');
  const block = start >= 0 && end > start ? main.slice(start, end) : '';
  const labels = [...block.matchAll(/label: '([^']*)'/g)].map((match) => match[1]);
  return labels.reduce((best, label) => (label.length > best.length ? label : best), '');
}

function longestFlaHint() {
  const hints = JSON.parse(fs.readFileSync(path.join(root, 'data/fla_actions_index.json'), 'utf8'));
  let best = '';
  for (const symbol of hints.symbols || []) {
    for (const match of symbol.matches || []) {
      if (!String(match).includes('_root.playership ==')) continue;
      const hint = `${symbol.symbol}: ${String(match).slice(0, 120)}`;
      if (hint.length > best.length) best = hint;
    }
  }
  return best;
}

export function longestHeaderStatusMessage() {
  const captain = 'W'.repeat(HEADER_CAPTAIN_LIMIT);
  const ship = 'W'.repeat(HEADER_SHIP_LIMIT);
  const label = longestFactionLabel() || 'Tholian Web Captain';
  const hint = longestFlaHint();
  const candidates = [
    `${captain} aboard ${ship}. ${label} selected.`,
    `${captain} aboard ${ship}. Game loaded from slot 3.`,
  ];
  if (hint) candidates.push(`${captain} aboard ${ship}. FLA action hint -> ${hint}`);
  return candidates.reduce((best, row) => (row.length > best.length ? row : best), '');
}
