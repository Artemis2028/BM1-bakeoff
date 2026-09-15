/**
 * Phase 10 Dominion-first — compartmented covert knowledge (gate 6).
 *
 * Breen/Cardassian pacts stay inactive by default. Ordinary captains do not
 * inherit secret campaign knowledge. Knowledge is per named roster, not per
 * runtimeFaction. Starting Breen / Cardassian / remnant does not auto-brief.
 */

export const AGREEMENTS_LIVE_DEFAULT = false;
export const PACT_IDS = Object.freeze(['dominion_breen_pact', 'dominion_cardassian_pact']);

export function emptyAgreements(saved = null) {
  const source = saved && typeof saved === 'object' ? saved : {};
  return {
    live: source.live === true,
    agreementsLive: source.agreementsLive === true || source.live === true,
    byId: source.byId && typeof source.byId === 'object' ? { ...source.byId } : {},
    ordinaryCaptainKnowsPact: false,
    playerStartAutoBrief: false,
  };
}

export function serializeAgreements(agreements) {
  const state = emptyAgreements(agreements);
  return {
    live: state.live === true,
    agreementsLive: state.agreementsLive === true,
    byId: { ...state.byId },
    ordinaryCaptainKnowsPact: false,
    playerStartAutoBrief: false,
  };
}

export function restoreAgreements(saved) {
  return emptyAgreements(saved);
}

function rosterOf(agreement) {
  return new Set((agreement?.roster || []).map((id) => String(id)));
}

export function actorKnowsAgreement(agreements, agreementId, actorKey) {
  const store = agreements || emptyAgreements();
  if (store.live !== true && store.agreementsLive !== true) return false;
  const row = store.byId?.[String(agreementId)];
  if (!row || row.active !== true) return false;
  return rosterOf(row).has(String(actorKey));
}

export function ordinaryCaptainKnowsPact(agreements, { faction = '', actorKey = '', command = false } = {}) {
  const store = agreements || emptyAgreements();
  if (command === true) {
    return PACT_IDS.some((id) => actorKnowsAgreement(store, id, actorKey));
  }
  const factionKey = String(faction || '').toLowerCase();
  if (factionKey === 'breen' || factionKey === 'cardassian' || factionKey === 'dominion') {
    return actorKnowsAgreement(store, 'dominion_breen_pact', actorKey)
      || actorKnowsAgreement(store, 'dominion_cardassian_pact', actorKey);
  }
  return false;
}

/**
 * Scoped inject. Roster is named participants, never runtimeFaction.
 */
export function injectAgreement(agreements, {
  agreementId,
  roster = [],
  active = true,
  facts = [],
} = {}) {
  const store = agreements || emptyAgreements();
  const id = String(agreementId || '').trim();
  if (!id) return { ok: false, reason: 'missing-agreement-id', book: store };
  const named = [...new Set((Array.isArray(roster) ? roster : []).map((row) => String(row)).filter(Boolean))];
  store.byId[id] = {
    agreementId: id,
    roster: named,
    active: active === true,
    facts: Array.isArray(facts) ? [...facts] : [],
    runtimeFactionWide: false,
  };
  store.live = named.length > 0 && active === true ? true : store.live;
  store.agreementsLive = store.live;
  store.ordinaryCaptainKnowsPact = false;
  store.playerStartAutoBrief = false;
  return { ok: true, agreement: store.byId[id], book: store };
}

export function deactivateAllAgreements(agreements) {
  const store = agreements || emptyAgreements();
  store.live = false;
  store.agreementsLive = false;
  for (const row of Object.values(store.byId || {})) {
    if (row) row.active = false;
  }
  store.ordinaryCaptainKnowsPact = false;
  return store;
}

export function agreementsSnapshot(agreements, extras = {}) {
  const store = agreements || emptyAgreements();
  const actorKey = String(extras.actorKey || '');
  const faction = String(extras.faction || '');
  return {
    live: store.live === true,
    agreementsLive: store.agreementsLive === true,
    ordinaryCaptainKnowsPact: ordinaryCaptainKnowsPact(store, {
      faction,
      actorKey,
      command: extras.command === true,
    }),
    playerStartAutoBrief: false,
    scopedKnows: actorKey ? PACT_IDS.filter((id) => actorKnowsAgreement(store, id, actorKey)) : [],
    sayable: 'Ordinary captains do not inherit secret campaign knowledge. No static Breen–Dominion alliance. Any pact is a scoped agreement.',
  };
}
