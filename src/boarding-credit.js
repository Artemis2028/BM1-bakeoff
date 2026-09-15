/**
 * Prize credit — capture token family, not a kill cascade (gate 5).
 *
 * Source of truth:
 * - docs/boarding/BM1-BOARDING-CAPTURE-PROPOSAL.md §7
 *
 * Capture must not call applyKillStanding or pay destruction salvage.
 * Later prize destroy must not mint kill: for the original victimInstanceId.
 */

export const CAPTURE_TOKEN_FAMILY = 'capture';
export const KILL_TOKEN_FAMILY = 'kill';

export function makeCaptureToken({
  credit = 'none',
  systemIndex = 0,
  victimInstanceId = 'unknown',
  localElapsedMs = 0,
} = {}) {
  const bucket = Math.floor(Math.max(0, Number(localElapsedMs) || 0) / 1000);
  return `${CAPTURE_TOKEN_FAMILY}:${credit || 'none'}:${Number(systemIndex)}:${victimInstanceId || 'unknown'}:${bucket}`;
}

export function isCaptureToken(token) {
  return String(token || '').startsWith(`${CAPTURE_TOKEN_FAMILY}:`);
}

export function isKillToken(token) {
  return String(token || '').startsWith(`${KILL_TOKEN_FAMILY}:`);
}

export function tokenMentionsVictim(token, victimInstanceId) {
  const id = String(victimInstanceId || '');
  if (!id || !token) return false;
  return String(token).includes(`:${id}:`);
}

export function rememberCapture(book, ledger, {
  token,
  victimInstanceId,
  credit = 'player',
  atLocalMs = 0,
} = {}) {
  const store = book || emptyCaptureIndex();
  if (!store.captures || typeof store.captures !== 'object') store.captures = {};
  const id = String(victimInstanceId || '');
  const captureToken = token || makeCaptureToken({ credit, victimInstanceId: id, localElapsedMs: atLocalMs });
  store.captures[id] = {
    token: captureToken,
    credit,
    atLocalMs: Math.max(0, Number(atLocalMs) || 0),
    victimInstanceId: id,
  };
  if (ledger && captureToken) {
    if (!ledger.punishmentTokens || typeof ledger.punishmentTokens !== 'object') {
      ledger.punishmentTokens = {};
    }
    ledger.punishmentTokens[captureToken] = true;
  }
  return { ok: true, token: captureToken, standing: 'none', salvage: 0 };
}

export function emptyCaptureIndex() {
  return { captures: {} };
}

export function hasCaptureForVictim(book, ledger, victimInstanceId) {
  const id = String(victimInstanceId || '');
  if (!id) return false;
  if (book?.captures?.[id]) return true;
  const tokens = ledger?.punishmentTokens || {};
  return Object.keys(tokens).some((token) => isCaptureToken(token) && tokenMentionsVictim(token, id));
}

export function killTokenForOriginal(ledger, victimInstanceId) {
  const id = String(victimInstanceId || '');
  const tokens = Object.keys(ledger?.punishmentTokens || {});
  return tokens.find((token) => isKillToken(token) && tokenMentionsVictim(token, id)) || null;
}

export function shouldSkipOriginalKillStanding(book, ledger, npc = {}) {
  const victimInstance = npc.securityInstanceId || npc.sourceInstanceId || npc.victimInstanceId || '';
  return npc.captured === true
    || npc.prize === true
    || hasCaptureForVictim(book, ledger, victimInstance);
}

/**
 * Capture credit write. Never calls applyKillStanding.
 * Caller must not route this through destroyNpcShip.
 */
export function applyCaptureCredit(book, ledger, input = {}) {
  const victimInstanceId = String(input.victimInstanceId || '');
  const credit = input.credit || 'player';
  const token = makeCaptureToken({
    credit,
    systemIndex: input.systemIndex,
    victimInstanceId,
    localElapsedMs: input.localElapsedMs,
  });
  const stamped = rememberCapture(book, ledger, {
    token,
    victimInstanceId,
    credit,
    atLocalMs: input.localElapsedMs,
  });
  return {
    ok: true,
    token: stamped.token,
    family: CAPTURE_TOKEN_FAMILY,
    killToken: null,
    applyKillStanding: false,
    salvageLatinum: 0,
    flash: false,
    incidentKind: 'capture',
    standingDelta: 0,
  };
}

export function prizeLaterDestroyCredit(book, ledger, npc = {}) {
  if (!shouldSkipOriginalKillStanding(book, ledger, npc)) {
    return { skipOriginalKill: false, skipSalvageOfOriginal: false, mintKillForOriginal: true };
  }
  return {
    skipOriginalKill: true,
    skipSalvageOfOriginal: true,
    mintKillForOriginal: false,
    killTokenForOriginal: null,
    standingDelta: 0,
  };
}
