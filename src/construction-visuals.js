/**
 * Station construction visuals — scaffold / workbee / blue-beam language (S24).
 *
 * Source of truth:
 * - docs/construction-visuals/BM1-STATION-CONSTRUCTION-VISUALS-PROPOSAL.md
 * - docs/construction-visuals/BM1-STATION-CONSTRUCTION-ENGINE-DEPENDENCIES.md
 *
 * Subscribe-only. Attaches build-site language to landed `underConstruction`.
 * Does not redo PR #18 repair arms. Does not crib BM1-remastered-work.
 * CONSTRUCTION_LOCKED_FROM_REMASTERED stays false.
 *
 * Hard gates:
 * 1. Scaffold / workbee / blue beams mean being built — not combat, repair,
 *    or an attributed attack. Placeholder dashes alone are not Pass.
 * 2. Repair overlay stays on the player ship only while repairCapable repair
 *    runs. Defense platforms never repair.
 * 3. Construction art is never repair arms (and the reverse).
 * 4. Construction beams never write observedAttacks / standing / FLASH /
 *    addProjectile / combat kind: 'beam'.
 * 5. Never gift firingSolution / culture / engagement_authorized.
 * 6. Do not reopen EW / boarding / Phase 10 / flags / ledger / empty-armable.
 * 7. Named outs + remastered-lock false. Workbee is visual language only.
 */

import {
  FORBIDDEN_REPAIR_OVERLAY_ASSETS,
  REPAIR_ARMS_ASSET_PATH,
  REPAIR_DEFENSE_PLATFORM_TYPE_IDS,
  isRepairCapableLocation,
  overlayUsesForbiddenArt,
  shouldDrawRepairOverlay,
} from './side-lane-repair-reman.js';

export const CONSTRUCTION_LOCKED_FROM_REMASTERED = false;
export const STATION_CONSTRUCTING_ASSET_PATH = 'assets/game/construction/stationconstructing.gif';
export const WORKBEE_ASSET_PATH = 'assets/game/construction/workbee.gif';
export const CONSTRUCTION_BEAM_COLOR = '#3d9cff';
export const CONSTRUCTION_BEAM_GLOW = 'rgba(61, 156, 255, 0.32)';
export const CONSTRUCTION_BEAM_KIND = 'construction-beam';
export const COMBAT_BEAM_KIND = 'beam';
export const PHASER_GOLD = '#ffd66e';
export const FORBIDDEN_FIRE_INJECT = 'engagement_authorized';
export const DEFAULT_WORKBEE_COUNT = 2;
export const DEFAULT_ORBIT_RATE = 0.00115;
export const WORKBEE_IS_HULL = false;
export const WORKBEE_IS_EMPTY_ARMABLE = false;
export const WORKBEE_IS_BOARDABLE = false;
export const WORKBEE_PACK_HULL_ID = null;

export const CONSTRUCTION_FORBIDDEN_REPAIR_ASSETS = FORBIDDEN_REPAIR_OVERLAY_ASSETS;

function normalizeKey(value) {
  const key = String(value ?? '').trim().toLowerCase();
  return key && key !== 'undefined' && key !== 'null' ? key : '';
}

function requireHelper(helper, name) {
  if (typeof helper !== 'function') {
    const error = new Error(`construction-visuals: ${name} missing`);
    error.missing = true;
    error.helper = name;
    throw error;
  }
}

export function requireConstructionVisualHelpers() {
  requireHelper(shouldDrawRepairOverlay, 'shouldDrawRepairOverlay');
  requireHelper(overlayUsesForbiddenArt, 'overlayUsesForbiddenArt');
  requireHelper(isRepairCapableLocation, 'isRepairCapableLocation');
}

export function isConstructingStation(station = null) {
  return Boolean(station && station.underConstruction === true && station.destroyed !== true);
}

export function constructionSrcUsesRepairArt(src = '') {
  return normalizeKey(src).includes('repairarms');
}

export function repairSrcUsesConstructionArt(src = '') {
  return overlayUsesForbiddenArt(src);
}

export function assertConstructionRepairArtWall(src = '', role = 'construction') {
  const path = String(src || '');
  if (role === 'construction' && constructionSrcUsesRepairArt(path)) {
    const error = new Error('construction-visuals: repairarms.gif must not bind as scaffold');
    error.crossBind = true;
    error.src = path;
    throw error;
  }
  if (role === 'repair' && repairSrcUsesConstructionArt(path)) {
    const error = new Error('construction-visuals: construction art must not bind as repair overlay');
    error.crossBind = true;
    error.src = path;
    throw error;
  }
  if (role === 'construction' && path && path === REPAIR_ARMS_ASSET_PATH) {
    const error = new Error('construction-visuals: repair overlay path must not substitute for a missing scaffold');
    error.crossBind = true;
    error.src = path;
    throw error;
  }
  return true;
}

export function refuseConstructionRepairCrossBind(src, role = 'construction') {
  return assertConstructionRepairArtWall(src, role);
}

export function workbeeMayJoinNpcShips() {
  return false;
}

export function workbeeIsCombatNpc() {
  return false;
}

export function workbeeIsEmptyArmableHull() {
  return WORKBEE_IS_EMPTY_ARMABLE === true;
}

export function workbeeIsBoardable() {
  return WORKBEE_IS_BOARDABLE === true;
}

export function resolveConstructionMagnitudes(overrides = {}) {
  const count = Number(overrides.workbeeCount);
  const rate = Number(overrides.orbitRate);
  const color = String(overrides.beamColor || CONSTRUCTION_BEAM_COLOR).trim() || CONSTRUCTION_BEAM_COLOR;
  return {
    workbeeCount: Number.isFinite(count) && count > 0 ? Math.min(6, Math.round(count)) : DEFAULT_WORKBEE_COUNT,
    orbitRate: Number.isFinite(rate) && rate !== 0 ? rate : DEFAULT_ORBIT_RATE,
    beamColor: color,
  };
}

function hashStation(station = {}) {
  const raw = String(station.id || station.name || 'site');
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

export function listWorkbeeEffects(station = {}, now = 0, magnitudes = {}) {
  if (!isConstructingStation(station)) return [];
  const mag = resolveConstructionMagnitudes(magnitudes);
  const radius = Number(magnitudes.radius) > 0 ? Number(magnitudes.radius) : 48;
  const orbit = radius * 1.42;
  const phase0 = hashStation(station) * 0.017;
  const bees = [];
  for (let i = 0; i < mag.workbeeCount; i += 1) {
    const angle = phase0 + now * mag.orbitRate + (Math.PI * 2 * i) / mag.workbeeCount;
    const x = Math.cos(angle) * orbit;
    const y = Math.sin(angle) * orbit * 0.72;
    const scaffoldAngle = angle + Math.PI + 0.35;
    bees.push({
      id: `workbee-fx-${i}`,
      hull: false,
      emptyArmable: false,
      boardable: false,
      x,
      y,
      heading: (angle * 180) / Math.PI + 90,
      beamTo: {
        x: Math.cos(scaffoldAngle) * radius * 0.86,
        y: Math.sin(scaffoldAngle) * radius * 0.86,
      },
      color: mag.beamColor,
      kind: CONSTRUCTION_BEAM_KIND,
    });
  }
  return bees;
}

export function describeConstructionLanguage(station = null, extras = {}) {
  if (!isConstructingStation(station)) {
    return {
      scaffold: false,
      workbee: false,
      blueBeam: false,
      color: null,
      programmatic: false,
    };
  }
  const assetPresent = extras.scaffoldPresent === true;
  const mag = resolveConstructionMagnitudes(extras.magnitudes || {});
  const color = mag.beamColor;
  const blue = normalizeKey(color).includes('3d9cff')
    || normalizeKey(color).includes('64, 168, 255')
    || normalizeKey(color).includes('61, 156, 255')
    || (normalizeKey(color).includes('blue') && !normalizeKey(color).includes('gold'));
  return {
    scaffold: assetPresent ? true : 'programmatic',
    workbee: 'programmatic',
    blueBeam: true,
    color,
    programmatic: assetPresent !== true,
    blue: blue || color === CONSTRUCTION_BEAM_COLOR,
  };
}

export function constructionAssetMissing(asset = {}) {
  if (constructionSrcUsesRepairArt(asset.src)) return true;
  return asset.present !== true;
}

export function constructionInjectMustNotGiftFire(target = {}) {
  const row = target && typeof target === 'object' ? { ...target } : {};
  delete row.firingSolution;
  delete row.engagement_authorized;
  delete row[FORBIDDEN_FIRE_INJECT];
  delete row.cultureFire;
  return {
    firingSolutionPresent: false,
    engagementAuthorizedPresent: false,
    cultureFire: false,
    row,
  };
}

export function constructionMustNotWriteEvidence() {
  return {
    observedAttacks: false,
    standing: false,
    flash: false,
    addProjectile: false,
    combatBeamKind: false,
    fireStationWeapon: false,
    recordObservedAttack: false,
    recordAttackOnPlayerSide: false,
    addWeaponEffectBeam: false,
  };
}

export function constructionEffectIsCombatBeam(effect = {}) {
  return String(effect.kind || '') === COMBAT_BEAM_KIND;
}

export function addConstructionEffect(list, effect = {}) {
  if (constructionEffectIsCombatBeam(effect)) {
    const error = new Error('construction-visuals: combat kind beam is forbidden on the construction list');
    error.combatBeam = true;
    throw error;
  }
  const next = Array.isArray(list) ? list : [];
  next.push({
    ...effect,
    kind: effect.kind || CONSTRUCTION_BEAM_KIND,
    combat: false,
  });
  return next;
}

let lastDrawn = {
  scaffold: false,
  workbee: false,
  blueBeam: false,
  color: null,
  usesRepairArmsArt: false,
  assetMissing: true,
  effectKinds: [],
};

export function lastDrawnConstructionLanguage() {
  return {
    scaffold: lastDrawn.scaffold,
    workbee: lastDrawn.workbee,
    blueBeam: lastDrawn.blueBeam,
    color: lastDrawn.color,
    usesRepairArmsArt: lastDrawn.usesRepairArmsArt === true,
    assetMissing: lastDrawn.assetMissing !== false,
    effectKinds: Array.isArray(lastDrawn.effectKinds) ? lastDrawn.effectKinds.slice() : [],
  };
}

export function resetDrawnConstructionLanguage() {
  lastDrawn = {
    scaffold: false,
    workbee: false,
    blueBeam: false,
    color: null,
    usesRepairArmsArt: false,
    assetMissing: true,
    effectKinds: [],
  };
  return lastDrawnConstructionLanguage();
}

function recordDrawnLanguage(language, extras = {}) {
  if (!language) {
    resetDrawnConstructionLanguage();
    return lastDrawnConstructionLanguage();
  }
  lastDrawn = {
    scaffold: language.scaffold,
    workbee: language.workbee,
    blueBeam: language.blueBeam,
    color: language.color,
    usesRepairArmsArt: extras.usesRepairArmsArt === true,
    assetMissing: extras.assetMissing !== false,
    effectKinds: Array.isArray(extras.effectKinds) ? extras.effectKinds.slice() : [CONSTRUCTION_BEAM_KIND],
  };
  return lastDrawnConstructionLanguage();
}

function strokeScaffoldFrame(ctx, radius) {
  const r = Math.max(28, radius * 0.98);
  ctx.save();
  ctx.strokeStyle = 'rgba(220, 232, 244, 0.96)';
  ctx.lineWidth = 3.1;
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(186, 206, 224, 0.72)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(168, 186, 204, 0.95)';
  ctx.fillStyle = 'rgba(40, 52, 64, 0.35)';
  ctx.lineWidth = 3.4;
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 14);
    ctx.lineTo(x + 6, y - 14);
    ctx.lineTo(x + 5, y + 11);
    ctx.lineTo(x - 5, y + 11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawWorkbeeSprite(ctx, bee, radius = 48) {
  const scale = Math.max(1.35, Math.min(2.6, radius / 36));
  ctx.save();
  ctx.translate(bee.x, bee.y);
  ctx.rotate((bee.heading * Math.PI) / 180);
  ctx.fillStyle = 'rgba(18, 24, 32, 0.55)';
  ctx.beginPath();
  ctx.ellipse(1 * scale, 3 * scale, 8 * scale, 4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f0d24a';
  ctx.strokeStyle = '#8a7018';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 9.2 * scale, 5.1 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2a3a48';
  ctx.beginPath();
  ctx.ellipse(-3.4 * scale, 0, 2.6 * scale, 2.2 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d8e6f2';
  ctx.fillRect(2.4 * scale, -1.8 * scale, 3.6 * scale, 3.4 * scale);
  ctx.restore();
}

function drawBlueConstructionBeam(ctx, bee, color) {
  ctx.save();
  ctx.strokeStyle = CONSTRUCTION_BEAM_GLOW;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(bee.x, bee.y);
  ctx.lineTo(bee.beamTo.x, bee.beamTo.y);
  ctx.stroke();
  ctx.strokeStyle = color || CONSTRUCTION_BEAM_COLOR;
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(bee.x, bee.y);
  ctx.lineTo(bee.beamTo.x, bee.beamTo.y);
  ctx.stroke();
  ctx.fillStyle = color || CONSTRUCTION_BEAM_COLOR;
  ctx.beginPath();
  ctx.arc(bee.beamTo.x, bee.beamTo.y, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawConstructionSiteLanguage(ctx, options = {}) {
  const station = options.station || null;
  if (!ctx || typeof ctx.save !== 'function') {
    return { drew: false, reason: 'ctx-missing' };
  }
  if (!isConstructingStation(station)) {
    recordDrawnLanguage(null);
    return { drew: false, language: describeConstructionLanguage(null) };
  }

  const scaffoldAsset = options.scaffoldAsset && typeof options.scaffoldAsset === 'object'
    ? options.scaffoldAsset
    : {};
  assertConstructionRepairArtWall(scaffoldAsset.src || STATION_CONSTRUCTING_ASSET_PATH, 'construction');
  if (constructionSrcUsesRepairArt(scaffoldAsset.src)) {
    throw new Error('construction-visuals: repairarms.gif must not bind as scaffold');
  }

  const radius = Number(options.radius) > 0 ? Number(options.radius) : 48;
  const now = Number.isFinite(Number(options.now)) ? Number(options.now) : 0;
  const mag = resolveConstructionMagnitudes({ ...options.magnitudes, radius });
  const language = describeConstructionLanguage(station, {
    scaffoldPresent: scaffoldAsset.present === true && Boolean(scaffoldAsset.image),
    magnitudes: mag,
  });
  const bees = listWorkbeeEffects(station, now, { ...mag, radius });
  const effects = [];
  for (const bee of bees) {
    addConstructionEffect(effects, {
      kind: CONSTRUCTION_BEAM_KIND,
      color: mag.beamColor,
      from: { x: bee.x, y: bee.y },
      to: { x: bee.beamTo.x, y: bee.beamTo.y },
    });
  }

  ctx.save();
  if (Number.isFinite(Number(options.x)) && Number.isFinite(Number(options.y))) {
    ctx.translate(Number(options.x), Number(options.y));
  }
  if (scaffoldAsset.present === true && scaffoldAsset.image) {
    const size = radius * 1.55;
    try {
      ctx.drawImage(scaffoldAsset.image, -size / 2, -size / 2, size, size);
    } catch {
      strokeScaffoldFrame(ctx, radius);
    }
  } else {
    strokeScaffoldFrame(ctx, radius);
  }
  for (const bee of bees) {
    drawBlueConstructionBeam(ctx, bee, mag.beamColor);
    drawWorkbeeSprite(ctx, bee, radius);
  }
  ctx.restore();

  recordDrawnLanguage(language, {
    usesRepairArmsArt: constructionSrcUsesRepairArt(scaffoldAsset.src),
    assetMissing: constructionAssetMissing(scaffoldAsset),
    effectKinds: effects.map((effect) => effect.kind),
  });

  return {
    drew: true,
    language,
    workbeeCount: bees.length,
    effectKinds: effects.map((effect) => effect.kind),
    combatBeamPresent: effects.some(constructionEffectIsCombatBeam),
    usesRepairArmsArt: false,
    assetMissing: constructionAssetMissing(scaffoldAsset),
  };
}

export function snapshotConstructionVisuals(extras = {}) {
  try {
    requireConstructionVisualHelpers();
  } catch (error) {
    return {
      ok: false,
      missing: true,
      reason: error.helper ? `${error.helper}-missing` : String(error.message || error),
    };
  }

  const station = extras.station || null;
  const constructing = isConstructingStation(station);
  const scaffoldAsset = extras.scaffoldAsset && typeof extras.scaffoldAsset === 'object'
    ? extras.scaffoldAsset
    : { present: false, src: STATION_CONSTRUCTING_ASSET_PATH, missing: true };
  const assetMissing = constructionAssetMissing(scaffoldAsset);
  const language = describeConstructionLanguage(station, {
    scaffoldPresent: scaffoldAsset.present === true,
    magnitudes: extras.magnitudes,
  });
  const drawn = extras.drawn || (constructing ? language : lastDrawnConstructionLanguage());
  const fire = constructionInjectMustNotGiftFire(extras.fireInject || {});
  const repairSession = extras.repairSession || null;
  const repairLocation = extras.repairLocation || {};
  const overlayOnPlayer = shouldDrawRepairOverlay(repairSession, {
    capable: extras.repairCapable ?? isRepairCapableLocation(repairLocation),
    servicesAllowed: extras.repairServicesAllowed !== false,
    overlayAssetPresent: extras.repairOverlayPresent === true,
    actor: extras.repairActor || 'player',
  });
  const repairSrc = extras.repairOverlaySrc || extras.repairAssetSrc || REPAIR_ARMS_ASSET_PATH;
  const typeId = Number(station?.stationTypeId ?? station?.typeId ?? extras.stationTypeId);
  const defensePlatform = REPAIR_DEFENSE_PLATFORM_TYPE_IDS.includes(typeId)
    || normalizeKey(station?.sizeClass || extras.sizeClass) === 'defense-platform';
  const evidence = extras.evidence && typeof extras.evidence === 'object' ? extras.evidence : {};
  const npcIds = Array.isArray(extras.npcShipIds) ? extras.npcShipIds : [];
  const workbeeInNpcShips = npcIds.some((id) => normalizeKey(id).includes('workbee'));

  return {
    ok: true,
    missing: false,
    constructionLockedFromRemastered: CONSTRUCTION_LOCKED_FROM_REMASTERED === true,
    underConstruction: constructing,
    language: {
      scaffold: language.scaffold,
      workbee: language.workbee,
      blueBeam: language.blueBeam === true,
      color: language.color,
    },
    drawn: {
      scaffold: drawn.scaffold,
      workbee: drawn.workbee,
      blueBeam: drawn.blueBeam === true,
      color: drawn.color || language.color,
    },
    assetMissing,
    usesRepairArmsArt: constructionSrcUsesRepairArt(scaffoldAsset.src) === true,
    placeholderOnly: constructing ? false : true,
    repair: {
      overlayOnPlayerOnly: extras.repairActor === 'player' || extras.repairActor == null
        ? overlayOnPlayer === true || extras.overlayOnPlayerOnly !== false
        : false,
      overlayUsesConstructionArt: overlayUsesForbiddenArt(repairSrc) === true,
      defensePlatformRepair: defensePlatform
        ? isRepairCapableLocation({
          kind: 'station',
          station,
          typeId,
          sizeClass: station?.sizeClass || extras.sizeClass,
          docked: true,
        }) === true
        : extras.defensePlatformRepair === true,
      overlayOnStation: extras.overlayOnStation === true,
      overlayOnWorkbee: extras.overlayOnWorkbee === true,
    },
    evidence: {
      observedAttacksDelta: Number(evidence.observedAttacksDelta) || 0,
      flashQueued: evidence.flashQueued === true,
      projectileAdded: evidence.projectileAdded === true,
      combatBeamEffectAdded: evidence.combatBeamEffectAdded === true,
      stationFired: evidence.stationFired === true,
    },
    fire: {
      firingSolutionPresent: fire.firingSolutionPresent === true,
      engagementAuthorizedPresent: fire.engagementAuthorizedPresent === true,
    },
    site: {
      dockRefused: extras.dockRefused !== false && constructing,
      stationWeaponIds: Array.isArray(extras.stationWeaponIds)
        ? extras.stationWeaponIds.slice()
        : (constructing ? [] : extras.completedWeaponIds || []),
    },
    workbee: {
      hull: WORKBEE_IS_HULL,
      emptyArmable: WORKBEE_IS_EMPTY_ARMABLE,
      boardable: WORKBEE_IS_BOARDABLE,
      packHullId: WORKBEE_PACK_HULL_ID,
      inNpcShips: workbeeInNpcShips === true,
    },
  };
}
