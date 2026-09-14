/**
 * Phase 9.1 — residue-before-void (gate 3).
 *
 * Deep jam may drop ID / firm / firingSolution. The living row stays as
 * detected + area + emission. Never delete-the-contact. Residue is not a ghost.
 *
 * Source: docs/phase9/BM1-PHASE9.1-EW-ROBUSTNESS-PROPOSAL.md §5
 */

export const EW_RESIDUE_SOURCE = 'ew_residue';

function normalizeKey(value, fallback = '') {
  const key = String(value ?? '').trim();
  return key && key !== 'undefined' && key !== 'null' ? key : fallback;
}

export function isGhostLike(contact) {
  return Boolean(
    contact
    && (contact.ghost === true
      || contact.source === 'ew_ghost'
      || String(contact.subjectKey || '').startsWith('ghost:')),
  );
}

export function isResidueContact(contact) {
  return Boolean(
    contact
    && !isGhostLike(contact)
    && (contact.residue === true || contact.source === EW_RESIDUE_SOURCE),
  );
}

export function residueCopy() {
  return 'Interference. Burn-through available — not a cloak.';
}

/**
 * Mark a living contact as residue. Never voids detected. Never sets ghost.
 * Never grants firingSolution.
 */
export function applyResidueMark(contact, extras = {}) {
  if (!contact || isGhostLike(contact)) return { contact, residue: false, ghost: true };
  contact.residue = true;
  contact.ghost = false;
  contact.detected = true;
  contact.emission = extras.emission !== false;
  contact.identification = extras.identification || 'none';
  contact.trackQuality = extras.trackQuality || 'area';
  contact.firingSolution = false;
  if (extras.source === EW_RESIDUE_SOURCE || contact.source === EW_RESIDUE_SOURCE) {
    contact.source = EW_RESIDUE_SOURCE;
  }
  if (extras.lastKnown) contact.lastKnown = extras.lastKnown;
  return {
    contact,
    residue: true,
    ghost: false,
    firingSolution: false,
    detected: true,
    voided: false,
    sayable: residueCopy(),
  };
}

export function listResidueContacts(book, observerKey = null) {
  const keys = observerKey
    ? [normalizeKey(observerKey)]
    : Object.keys(book?.observers || {});
  const rows = [];
  for (const key of keys) {
    const contacts = Object.values(book?.observers?.[key]?.contacts || {});
    for (const contact of contacts) {
      if (isResidueContact(contact)) rows.push(contact);
    }
  }
  return rows;
}

export function residueIsGiftedLock(contact) {
  return isResidueContact(contact) && contact.firingSolution === true;
}
