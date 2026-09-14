/**
 * Phase 9.2 — comms-delay hook for new fleet-order send (gate 4).
 *
 * EW may delay or fail a **new** order. Standing hold_outside persists.
 * Delivered reports / FLASH stay. Phase 7 stub flag remains false (S12).
 *
 * Source: docs/phase9/BM1-PHASE9.2-EW-DEPTH-PROPOSAL.md §6
 */

import { commsFailureNote, findOrderForShip, issueOrder } from './phase7-fleet.js';
import { commsDisrupted, tryDeliverReport } from './phase9-ew.js';
import { resolvePhase92Defaults } from './phase92-magnitudes.js';

function normalizeKey(value, fallback = '') {
  const key = String(value ?? '').trim();
  return key && key !== 'undefined' && key !== 'null' ? key : fallback;
}

function clampNonNeg(value) {
  return Math.max(0, Number(value) || 0);
}

/** Sibling of Phase 7's COMMS_FAILURES_IMPLEMENTED — EW-caused path only. */
export const EW_COMMS_DELAY_IMPLEMENTED = true;

export function ewCommsFailureNote() {
  const base = commsFailureNote();
  return {
    ...base,
    ewPathImplemented: EW_COMMS_DELAY_IMPLEMENTED,
    note: 'EW may delay a new order send. Ships continue last received orders plus local self-preservation. Delivered FLASH/reports stay.',
  };
}

export function shouldDelayNewOrder(ewBook, input = {}, extras = {}, localElapsedMs = 0) {
  if (extras.commsDisrupted === true) return true;
  if (!ewBook) return false;
  const sender = normalizeKey(extras.senderKey || input.senderKey);
  const recipient = normalizeKey(extras.recipientKey || (Array.isArray(input.assignedShipIds) ? input.assignedShipIds[0] : ''));
  return commsDisrupted(ewBook, sender, localElapsedMs) || (recipient ? commsDisrupted(ewBook, recipient, localElapsedMs) : false);
}

/**
 * New send only. Existing hold_outside kind/status is not rewritten when
 * the send is delayed.
 */
export function issueOrderWithEwComms(board, input = {}, extras = {}, ewBook = null, localElapsedMs = 0) {
  const delay = shouldDelayNewOrder(ewBook, input, extras, localElapsedMs);
  const assigned = Array.isArray(input.assignedShipIds) ? input.assignedShipIds.map((id) => normalizeKey(id)).filter(Boolean) : [];
  const prior = assigned.map((shipId) => findOrderForShip(board, shipId)).filter(Boolean);
  const holdOutsideKind = prior.find((row) => row.kind === 'hold_outside')?.kind || (input.kind === 'hold_outside' ? 'hold_outside' : prior[0]?.kind || null);
  if (delay) {
    const defaults = resolvePhase92Defaults(extras.defaults || extras.magnitudes);
    const until = clampNonNeg(localElapsedMs) + (extras.delayMs ?? defaults.newFleetOrderDelayMs);
    const result = {
      ok: false,
      created: false,
      delayed: true,
      reason: 'comms-disrupted',
      untilLocalMs: until,
      engagement_authorized: undefined,
      cultureFire: false,
      holdOutsideKind,
      standingUnchanged: true,
      facts: { engagement_authorized: undefined },
      erasedByJamming: false,
      sayable: 'Comms disrupted. New order delayed. Hold-outside still held. The FLASH you already have is still in the journal.',
    };
    if (extras.book92) {
      extras.book92.lastComms = result;
      extras.book92.delayedOrders[`order-${until}`] = {
        kind: input.kind,
        assignedShipIds: assigned,
        untilLocalMs: until,
        startedAt: undefined,
      };
    }
    return result;
  }
  const issued = issueOrder(board, input, extras);
  return {
    ...issued,
    created: true,
    delayed: false,
    erasedByJamming: false,
    cultureFire: false,
    holdOutsideKind: issued.order?.kind === 'hold_outside' ? 'hold_outside' : holdOutsideKind,
  };
}

export function tryDeliverReport92(ledger, input = {}, ewBook = null, localElapsedMs = 0) {
  return tryDeliverReport(ledger, input, ewBook, localElapsedMs);
}

export function commsDelayUnsendsReports() {
  return false;
}
