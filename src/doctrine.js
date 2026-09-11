/**
 * BM1 faction-doctrine runtime adapter.
 * Loads docs/doctrine v0.2.1 and evaluates its contracts. Does not invent a
 * second policy model. Physical combat math (range, tracking, kill credit)
 * stays with the engine/combat lane.
 */

export const DOCTRINE_PACK_SRC = 'docs/doctrine/bm1-faction-doctrine.v0.2.1.json';
export const DOCTRINE_EXPECTED_VERSION = '0.2.1-draft';
export const DOCTRINE_AUTHORING_STATUS = 'DESIGN_ONLY_NOT_LOADED_BY_GAME';

/** Native roles the pack's roleMap omitted; used only as fallback mapping. */
export const ENGINE_NATIVE_ROLE_EXTRAS = Object.freeze({
  occupationFleet: 'occupier',
});

const EMPTY_RELATIONS = Object.freeze({ friendly: [], hostile: [] });

let runtime = null;

export function getDoctrineRuntime() {
  return runtime;
}

export function isDoctrineLoaded() {
  return Boolean(runtime?.loaded && runtime.pack);
}

export function evaluatePredicate(rule, facts) {
  if (typeof rule === 'boolean') return rule;
  if (!rule || typeof rule !== 'object') throw new Error('Invalid predicate');
  if (Object.prototype.hasOwnProperty.call(rule, 'fact')) return facts[rule.fact] === true;
  if (Object.prototype.hasOwnProperty.call(rule, 'all')) return rule.all.every((entry) => evaluatePredicate(entry, facts));
  if (Object.prototype.hasOwnProperty.call(rule, 'any')) return rule.any.some((entry) => evaluatePredicate(entry, facts));
  throw new Error('Invalid predicate');
}

function asString(value) {
  return String(value || '').trim();
}

function slugLocationName(name) {
  const slug = asString(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || 'unknown';
}

function uniqueStrings(list) {
  return [...new Set((Array.isArray(list) ? list : []).map((item) => asString(item)).filter(Boolean))];
}

export function selectedRole(pack, profile, role) {
  if (!pack || !profile) return 'deny_assignment';
  const requested = asString(role);
  if (requested && profile.rolePolicies && Object.prototype.hasOwnProperty.call(profile.rolePolicies, requested)) {
    return requested;
  }
  if (requested && pack.roleTemplates && Object.prototype.hasOwnProperty.call(pack.roleTemplates, requested)) {
    return 'deny_assignment';
  }
  const mapped = pack.runtimeAdapter?.roleMap?.[requested]
    || ENGINE_NATIVE_ROLE_EXTRAS[requested]
    || profile.unknownRole;
  return mapped && profile.rolePolicies && Object.prototype.hasOwnProperty.call(profile.rolePolicies, mapped)
    ? mapped
    : 'deny_assignment';
}

export function rolePolicy(pack, profile, role) {
  const resolved = selectedRole(pack, profile, role);
  if (resolved === 'deny_assignment') return null;
  return profile?.rolePolicies?.[resolved] || null;
}

export function resolveProfileId(pack, runtimeFaction, flags = {}) {
  const faction = asString(runtimeFaction);
  if (!pack?.profiles) return null;
  if (faction === 'dominion') {
    const central = flags.centralAuthority && flags.scenarioActivated && flags.ordersReceived;
    return central ? 'dominion_central' : pack.runtimeAdapter?.dominionDefaultProfile || 'dominion_remnant';
  }
  const candidates = Object.entries(pack.profiles)
    .filter(([, profile]) => profile.runtimeFaction === faction)
    .map(([id]) => id);
  return candidates.length === 1 ? candidates[0] : (candidates[0] || null);
}

function profileEnabled(profile, flags = {}) {
  if (!profile) return false;
  if (profile.activation === 'disabled') return false;
  if (profile.activation === 'scenario_activation' && flags.scenarioActivated !== true) return false;
  return true;
}

export function canGenerate(pack, profileId, generator, flags = {}) {
  const profile = pack?.profiles?.[profileId];
  if (!profileEnabled(profile, flags)) return false;
  if (flags.rosterEnabled !== true) return false;
  if (profile.generators?.[generator] !== 'requires_assignment_and_budget') return false;
  return flags.assignmentExists === true && flags.budgetExists === true;
}

function structural(value, schema, root, at = '$') {
  const errors = [];
  if (!schema || typeof schema !== 'object') return errors;
  if (schema.$ref) {
    let ref = root;
    for (const key of schema.$ref.replace(/^#\//, '').split('/')) ref = ref?.[key];
    return structural(value, ref, root, at);
  }
  if (schema.oneOf) {
    const matches = schema.oneOf.filter((entry) => structural(value, entry, root, at).length === 0).length;
    return matches === 1 ? [] : [`${at}: expected exactly one schema alternative, got ${matches}`];
  }
  const types = {
    object: (v) => v !== null && typeof v === 'object' && !Array.isArray(v),
    array: (v) => Array.isArray(v),
    string: (v) => typeof v === 'string',
    boolean: (v) => typeof v === 'boolean',
    integer: (v) => Number.isInteger(v) && typeof v !== 'boolean',
    number: (v) => typeof v === 'number' && Number.isFinite(v),
    null: (v) => v === null,
  };
  if (schema.type && !types[schema.type]?.(value)) return [`${at}: expected ${schema.type}`];
  if (Object.prototype.hasOwnProperty.call(schema, 'const')
    && (typeof value !== typeof schema.const || value !== schema.const)) {
    errors.push(`${at}: expected ${JSON.stringify(schema.const)}`);
  }
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${at}: invalid enum value ${JSON.stringify(value)}`);
  if (Object.prototype.hasOwnProperty.call(schema, 'minimum') && value < schema.minimum) {
    errors.push(`${at}: below minimum ${schema.minimum}`);
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const properties = schema.properties || {};
    for (const key of schema.required || []) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) errors.push(`${at}: missing ${key}`);
    }
    for (const [key, item] of Object.entries(value)) {
      if (Object.prototype.hasOwnProperty.call(properties, key)) {
        errors.push(...structural(item, properties[key], root, `${at}.${key}`));
      } else if (schema.additionalProperties === false) {
        errors.push(`${at}: unknown field ${key}`);
      } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        errors.push(...structural(item, schema.additionalProperties, root, `${at}.${key}`));
      }
    }
  }
  if (Array.isArray(value)) {
    if (value.length < (schema.minItems || 0)) errors.push(`${at}: too few entries`);
    if (schema.uniqueItems) {
      const encoded = new Set(value.map((item) => JSON.stringify(item)));
      if (encoded.size !== value.length) errors.push(`${at}: duplicate entries`);
    }
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...structural(item, schema.items, root, `${at}[${index}]`));
      });
    }
  }
  if (typeof value === 'string' && value.length < (schema.minLength || 0)) errors.push(`${at}: empty string`);
  return errors;
}

export function eventErrors(pack, event) {
  const contract = pack?.eventContracts?.[event?.eventType];
  if (!contract) return ['Unknown typed event contract'];
  const schema = contract.payloadSchema;
  const errors = structural(event, schema, schema, 'event');
  if (errors.length) return errors;
  if (event.eventType === 'asset_overdue') {
    const cargo = event.cargo || {};
    if ((cargo.knowledge === 'unknown') !== (cargo.manifest == null)) {
      errors.push('Unknown cargo must remain null; known cargo must have a manifest.');
    }
    const last = event.lastKnown || {};
    if (last.position != null && (last.locationId == null || last.observedAt == null)) {
      errors.push('A last-known position requires a location and observation timestamp.');
    }
    const milestone = event.missedMilestone || {};
    const detected = event.detectedAt || {};
    const due = milestone.dueAt || {};
    if (detected.clock !== due.clock) {
      errors.push('Overdue detection and deadline must use the same clock.');
    } else if (detected.value <= due.value + milestone.grace) {
      errors.push('Milestone is not overdue beyond its grace period.');
    }
  }
  return errors;
}

export function evaluateEnd(pack, objectiveId, facts = {}) {
  const objective = pack?.objectiveTemplates?.[objectiveId];
  if (!objective) return 'open';
  if (evaluatePredicate(objective.abortWhen, facts)) return 'aborted';
  if (evaluatePredicate(objective.successWhen, facts)) return 'completed';
  return 'open';
}

export function evaluateReact(pack, profileId, role, eventType, facts = {}, cultureId = null, flags = {}) {
  const profile = pack?.profiles?.[profileId];
  if (!profileEnabled(profile, flags)) return 'inactive';
  if (!facts.event_known) return 'ignore_unknown';
  const resolvedRole = selectedRole(pack, profile, role);
  const rules = [...(profile.interestRules || [])];
  if (cultureId && pack.cultures?.[cultureId]) rules.push(...pack.cultures[cultureId].interestRules);
  for (const rule of rules) {
    if (!rule.eventTypes?.includes(eventType) || !evaluatePredicate(rule.when, facts)) continue;
    const response = pack.responseCatalog[rule.response];
    if (!response.eligibleRoles.includes(resolvedRole) || !evaluatePredicate(response.requires, facts)) {
      return `defer:${rule.response}`;
    }
    return rule.response;
  }
  return profile.unmatchedKnownEvent;
}

function withEngagementAuthorization(pack, profile, role, facts) {
  const next = { ...facts };
  if (role === 'deny_assignment') {
    next.engagement_authorized = false;
    return { role, policy: null, facts: next };
  }
  const policy = profile.rolePolicies[role];
  next.engagement_authorized = Boolean(
    policy.engagementModes.some((mode) => evaluatePredicate(pack.engagementModes[mode], next))
    && next.engagement_objective_active === true
  );
  return { role, policy, facts: next };
}

export function evaluateFire(pack, profileId, role, facts = {}, flags = {}) {
  const profile = pack?.profiles?.[profileId];
  if (!profileEnabled(profile, flags)) return false;
  const resolved = selectedRole(pack, profile, role);
  if (resolved === 'deny_assignment') return false;
  const authorized = withEngagementAuthorization(pack, profile, resolved, facts);
  return authorized.facts.engagement_authorized && evaluatePredicate(pack.globalRules.fireRequires, authorized.facts);
}

export function evaluateIntent(pack, profileId, role, facts = {}, flags = {}) {
  const profile = pack?.profiles?.[profileId];
  if (!profileEnabled(profile, flags)) return 'inactive';
  const resolved = selectedRole(pack, profile, role);
  if (resolved === 'deny_assignment') return 'deny_assignment';
  const authorized = withEngagementAuthorization(pack, profile, resolved, facts);
  const template = pack.roleTemplates[authorized.policy.template];
  for (const entry of template.intentPriority) {
    if (evaluatePredicate(entry.when, authorized.facts) && evaluatePredicate(pack.actions[entry.action], authorized.facts)) {
      return entry.action;
    }
  }
  throw new Error('Missing fallback');
}

export function inspectFire(pack, profileId, role, facts = {}, flags = {}) {
  const profile = pack?.profiles?.[profileId];
  const resolved = selectedRole(pack, profile, role);
  if (!profileEnabled(profile, flags)) {
    return { allowed: false, engagementAuthorized: false, role: resolved, reason: 'inactive' };
  }
  if (resolved === 'deny_assignment') {
    return { allowed: false, engagementAuthorized: false, role: resolved, reason: 'deny_assignment' };
  }
  const authorized = withEngagementAuthorization(pack, profile, resolved, facts);
  const physical = evaluatePredicate(pack.globalRules.fireRequires, authorized.facts);
  return {
    allowed: authorized.facts.engagement_authorized && physical,
    engagementAuthorized: authorized.facts.engagement_authorized === true,
    physicalOk: physical,
    role: resolved,
    profileId,
    reason: authorized.facts.engagement_authorized ? (physical ? 'authorized' : 'physical_gate') : 'engagement_not_authorized',
  };
}

export function runCase(pack, testCase) {
  const facts = { ...(testCase.facts || {}) };
  const knownFacts = new Set(Object.keys(pack.facts || {}));
  for (const key of Object.keys(facts)) {
    if (!knownFacts.has(key)) throw new Error(`${testCase.id}: unknown input facts`);
  }
  if (Object.values(facts).some((value) => typeof value !== 'boolean')) throw new Error('Facts must be Boolean');
  if (Object.prototype.hasOwnProperty.call(facts, 'engagement_authorized')) {
    throw new Error('Cannot inject policy-derived authority');
  }
  const op = testCase.operation;
  if (op === 'validate_event') return eventErrors(pack, testCase.event).length === 0;
  if (testCase.event) {
    const errors = eventErrors(pack, testCase.event);
    if (errors.length) throw new Error(`${testCase.id}: ${errors.join('; ')}`);
    if (testCase.event.eventType !== testCase.eventType) throw new Error('Event type and fixture disagree');
  }
  if (op === 'end') return evaluateEnd(pack, testCase.objective, facts);
  if (op === 'resolve_profile') {
    return resolveProfileId(pack, testCase.runtimeFaction, testCase);
  }
  const profile = pack.profiles[testCase.profile];
  const enabled = profileEnabled(profile, testCase);
  if (op === 'generate') {
    return canGenerate(pack, testCase.profile, testCase.generator, testCase);
  }
  if (!enabled) return op === 'react' || op === 'intent' ? 'inactive' : false;
  if (op === 'react') {
    return evaluateReact(pack, testCase.profile, testCase.role, testCase.eventType, facts, testCase.culture, testCase);
  }
  if (op === 'fire') return evaluateFire(pack, testCase.profile, testCase.role, facts, testCase);
  if (op === 'intent') return evaluateIntent(pack, testCase.profile, testCase.role, facts, testCase);
  throw new Error(`Unknown operation ${op}`);
}

export function applyPhase1Relations(baseRelations, pack) {
  const applied = {};
  const source = baseRelations && typeof baseRelations === 'object' ? baseRelations : {};
  for (const [faction, relation] of Object.entries(source)) {
    applied[faction] = {
      friendly: uniqueStrings(relation?.friendly),
      hostile: uniqueStrings(relation?.hostile),
    };
  }
  const required = pack?.phase1Integration?.requiredRelationEntries || {};
  for (const [faction, relation] of Object.entries(required)) {
    if (!applied[faction]) {
      applied[faction] = {
        friendly: uniqueStrings(relation.friendly),
        hostile: uniqueStrings(relation.hostile),
      };
    }
  }
  const breen = applied.breen || (applied.breen = { friendly: [], hostile: [] });
  const dominion = applied.dominion || (applied.dominion = { friendly: [], hostile: [] });
  breen.friendly = breen.friendly.filter((faction) => faction !== 'dominion');
  dominion.friendly = dominion.friendly.filter((faction) => faction !== 'breen');
  return applied;
}

export function getRelationsFor(faction, appliedRelations, pack, warn) {
  const key = asString(faction);
  if (appliedRelations?.[key]) return appliedRelations[key];
  if (typeof warn === 'function') warn(key);
  return pack?.phase1Integration?.missingRelationDefault || EMPTY_RELATIONS;
}

export function matchCultureId(pack, locationName) {
  const name = asString(locationName).toLowerCase();
  if (!name || !pack?.cultures) return null;
  for (const [id, culture] of Object.entries(pack.cultures)) {
    if ((culture.locationNames || []).some((entry) => asString(entry).toLowerCase() === name)) return id;
  }
  return null;
}

export function locationIdentity(pack, planet = {}) {
  const name = asString(planet.name);
  const index = Number.isFinite(Number(planet.index)) ? Number(planet.index) : null;
  const locationId = name ? `system:${slugLocationName(name)}` : (index != null ? `system:${index}` : null);
  const example = (pack?.identityContract?.examples || []).find((entry) => entry.locationId === locationId);
  if (example) {
    return {
      ...example,
      controllerId: planet.controllerId || example.controllerId,
      map: planet.map || example.map || null,
    };
  }
  const cultureId = matchCultureId(pack, name);
  const controllerFaction = asString(planet.controllerFaction || planet.faction);
  const controllerProfile = controllerFaction ? resolveProfileId(pack, controllerFaction, planet.dominionFlags || {}) : null;
  const unknown = pack?.identityContract?.unknownAuthority ?? null;
  return {
    locationId,
    kind: 'system',
    cultureId,
    sovereignId: controllerProfile && controllerFaction !== 'neutral' ? controllerProfile : unknown,
    controllerId: controllerProfile || unknown,
    jurisdictionId: controllerProfile ? `authority:${controllerProfile}` : unknown,
    legacyGovernmentId: Number.isFinite(Number(planet.legacyGovernmentId ?? planet.governmentId))
      ? Number(planet.legacyGovernmentId ?? planet.governmentId)
      : unknown,
    map: planet.map || null,
  };
}

export function attachActor(pack, actor = {}, extras = {}) {
  const runtimeFaction = asString(extras.runtimeFaction || actor.faction || 'neutral');
  const nativeRole = extras.preserveNativeRole === false ? null : (actor.role || extras.nativeRole || 'traffic');
  const profileId = extras.profileId || resolveProfileId(pack, runtimeFaction, extras.dominionFlags || {});
  const profile = pack?.profiles?.[profileId];
  const doctrineRole = extras.doctrineRole || selectedRole(pack, profile, extras.requestedRole || nativeRole || actor.role);
  const identity = extras.identity || null;
  const policy = rolePolicy(pack, profile, extras.requestedRole || nativeRole || actor.role);
  actor.doctrineProfile = profileId;
  actor.doctrineRole = doctrineRole;
  actor.doctrineNativeRole = nativeRole;
  actor.doctrineEngagementModes = policy?.engagementModes ? [...policy.engagementModes] : [];
  actor.doctrineDefaultObjective = policy ? pack.roleTemplates?.[policy.template]?.defaultObjective || null : null;
  if (identity?.locationId) actor.locationId = identity.locationId;
  if (identity && Object.prototype.hasOwnProperty.call(identity, 'jurisdictionId')) {
    actor.jurisdictionId = identity.jurisdictionId;
  }
  if (identity && Object.prototype.hasOwnProperty.call(identity, 'cultureId') && extras.assignCulture) {
    actor.cultureId = identity.cultureId;
  }
  return actor;
}

export function allowsRoutineGenerator(pack, runtimeFaction, generator, flags = {}) {
  const profileId = resolveProfileId(pack, runtimeFaction, flags);
  if (!profileId) return true;
  const profile = pack.profiles[profileId];
  if (profile.status === 'dormant' || profile.activation === 'disabled') return false;
  if (profile.activation === 'scenario_activation' && flags.scenarioActivated !== true) return false;
  const mode = profile.generators?.[generator];
  if (mode === 'disabled') return false;
  if (mode === 'authored_event_only') return flags.authoredEvent === true;
  if (mode === 'requires_assignment_and_budget') {
    if (flags.requireBudget === false) return true;
    return flags.assignmentExists === true && flags.budgetExists === true;
  }
  return false;
}

/**
 * Live fire facts for the current actor only. Pact briefing/task facts are
 * never supplied here (phase1Integration.futurePactGate). Physical range /
 * tracking / cooldown values are passed in by the engine; this adapter does
 * not compute them.
 */
export function deriveLiveFireFacts(input = {}) {
  const facts = {};
  const mark = (key, value) => {
    if (value === true) facts[key] = true;
  };
  mark('engagement_objective_active', input.engagementObjectiveActive === true);
  mark('live_weapon_track', input.liveWeaponTrack === true);
  mark('weapon_usable', input.weaponUsable === true);
  mark('weapon_ready', input.weaponReady === true);
  mark('inside_equipped_range', input.insideEquippedRange === true);
  mark('target_actionable', input.targetActionable === true);
  mark('identity_known', input.identityKnown === true);
  mark('attack_on_self_verified', input.attackOnSelf === true);
  mark('attack_on_protected_verified', input.attackOnProtected === true);
  mark('defense_obligation_active', input.defenseObligation === true);
  mark('war_target_verified', input.warTarget === true);
  mark('war_order_active', input.warOrder === true);
  mark('predation_order_active', input.predationOrder === true);
  mark('predation_attack_phase', input.predationAttackPhase === true);
  mark('credible_cargo_intel', input.credibleCargoIntel === true);
  mark('valuable_target_known', input.valuableTarget === true);
  mark('hunt_order_active', input.huntOrder === true);
  mark('worthy_hunt_known', input.worthyHunt === true);
  mark('contact_detected', input.contactDetected === true);
  mark('local_danger', input.localDanger === true);
  return facts;
}

function smokeCheck(pack, appliedRelations) {
  const cases = [
    {
      id: 'runtime-dominion-defaults-to-remnant',
      ok: resolveProfileId(pack, 'dominion') === 'dominion_remnant',
    },
    {
      id: 'runtime-gorn-traffic-disabled',
      ok: canGenerate(pack, 'gorn', 'traffic', {
        rosterEnabled: true,
        assignmentExists: true,
        budgetExists: true,
      }) === false,
    },
    {
      id: 'runtime-breen-dominion-not-friendly',
      ok: !(appliedRelations.breen?.friendly || []).includes('dominion')
        && !(appliedRelations.dominion?.friendly || []).includes('breen')
        && !(appliedRelations.breen?.hostile || []).includes('dominion')
        && !(appliedRelations.dominion?.hostile || []).includes('breen'),
    },
    {
      id: 'runtime-delpin-empty-lists',
      ok: Array.isArray(appliedRelations.delpin?.friendly)
        && appliedRelations.delpin.friendly.length === 0
        && Array.isArray(appliedRelations.delpin?.hostile)
        && appliedRelations.delpin.hostile.length === 0,
    },
    {
      id: 'runtime-playerEscort-maps-to-escort',
      ok: selectedRole(pack, pack.profiles.terran, 'playerEscort') === 'escort',
    },
    {
      id: 'runtime-treaties-disabled',
      ok: pack.phase1Integration?.enableScenarioTreaties === false,
    },
  ];
  return {
    passed: cases.filter((entry) => entry.ok).length,
    total: cases.length,
    failed: cases.filter((entry) => !entry.ok).map((entry) => entry.id),
  };
}

export async function loadFactionDoctrine({
  fetchJson,
  src = DOCTRINE_PACK_SRC,
  baseRelations = {},
  warn = () => {},
} = {}) {
  const pack = await fetchJson(src);
  if (!pack || pack.schema !== 'bm1-faction-doctrine') {
    runtime = { loaded: false, pack: null, warnings: ['Doctrine pack missing or unrecognized.'] };
    return runtime;
  }
  const appliedRelations = applyPhase1Relations(baseRelations, pack);
  const warned = new Set();
  const warnings = [];
  if (pack.status === DOCTRINE_AUTHORING_STATUS) {
    warnings.push('Authoring status remains DESIGN_ONLY_NOT_LOADED_BY_GAME (schema const); runtime still loads this pack.');
  }
  if (pack.phase1Integration?.enableScenarioTreaties) {
    warnings.push('phase1Integration.enableScenarioTreaties is true; treaties stay unused until a later relationship phase.');
  }
  const getRelations = (faction) => getRelationsFor(faction, appliedRelations, pack, (key) => {
    if (warned.has(key)) return;
    warned.add(key);
    const message = `Doctrine relation fallback for unknown faction key "${key}": empty lists (no alliance, immunity, or ceasefire).`;
    warnings.push(message);
    warn(message);
  });
  runtime = {
    loaded: true,
    pack,
    version: pack.version,
    src,
    appliedRelations,
    warnings,
    smoke: smokeCheck(pack, appliedRelations),
    treatiesEnabled: pack.phase1Integration?.enableScenarioTreaties === true,
    getRelations,
    resolveProfileId: (faction, flags) => resolveProfileId(pack, faction, flags),
    selectedRole: (profileId, role) => selectedRole(pack, pack.profiles[profileId], role),
    allowsRoutineGenerator: (faction, generator, flags) => allowsRoutineGenerator(pack, faction, generator, flags),
    canGenerate: (profileId, generator, flags) => canGenerate(pack, profileId, generator, flags),
    attachActor: (actor, extras) => attachActor(pack, actor, extras),
    locationIdentity: (planet) => locationIdentity(pack, planet),
    inspectFire: (profileId, role, facts, flags) => inspectFire(pack, profileId, role, facts, flags),
    evaluateIntent: (profileId, role, facts, flags) => evaluateIntent(pack, profileId, role, facts, flags),
    evaluateReact: (profileId, role, eventType, facts, cultureId, flags) => (
      evaluateReact(pack, profileId, role, eventType, facts, cultureId, flags)
    ),
    evaluateEnd: (objectiveId, facts) => evaluateEnd(pack, objectiveId, facts),
    huntObjective: pack.objectiveTemplates?.hunt || null,
    searchObjective: pack.objectiveTemplates?.search || null,
  };
  return runtime;
}

export function resetDoctrineRuntime() {
  runtime = null;
}
