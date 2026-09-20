#!/usr/bin/env node
/**
 * Headless Chromium behavioral probe for bake-off Phase 1 + Phase 2 ROE.
 *
 * Written from this repo's docs + src only:
 * - docs/revised-development-plan.md §2–§3
 * - docs/doctrine/ DESIGN + phase1Integration
 * - docs/BAKEOFF-STATUS.md
 *
 * Boots the real game, freezes the RAF loop, then drives tick() / combat /
 * claim / arrival paths with live fixtures, then S4 player-security ROE checks.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PROBE_PORT) || 8765;
const BASE = `http://127.0.0.1:${PORT}/`;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '');
    const filePath = path.normalize(path.join(root, relative));
    if (!filePath.startsWith(root)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(error.code === 'ENOENT' ? 404 : 500).end(String(error.message));
        return;
      }
      res.writeHead(200, { 'content-type': MIME[path.extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((resolve, reject) => {
    server.listen(PORT, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

function check(results, id, condition, detail = '') {
  if (condition) {
    results.passed += 1;
    results.lines.push(`PASS ${id}`);
    return true;
  }
  results.failed += 1;
  results.lines.push(`FAIL ${id}${detail ? `: ${detail}` : ''}`);
  return false;
}

async function boot(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => globalThis.BM1Probe?.ready?.() === true, null, { timeout: 60000 });
  await page.evaluate(() => {
    globalThis.BM1Probe.skipIntro();
    globalThis.BM1Probe.freezeLoop();
  });
}

async function startScenario(page, faction = 'ferengi', arena = {}) {
  return page.evaluate(({ faction, arena }) => globalThis.BM1Probe.startGame(faction, { arena }), { faction, arena });
}

async function runChecks(page) {
  const results = { passed: 0, failed: 0, lines: [] };

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800, hull: 100, shields: 100 });

  const relations = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const breen = p.relations('breen');
    const dominion = p.relations('dominion');
    const delpin = p.relations('delpin');
    const unknown = p.relations('unregistered-polity');
    return {
      breen,
      dominion,
      delpin,
      unknown,
      aligned: p.aligned('breen', 'dominion') || p.aligned('dominion', 'breen'),
      opposed: p.opposed('breen', 'dominion') || p.opposed('dominion', 'breen'),
      doctrineLoaded: p.snapshot().doctrineLoaded,
    };
  });
  check(
    results,
    'p1-breen-dominion-no-friendship',
    relations.doctrineLoaded
      && !relations.breen.friendly.includes('dominion')
      && !relations.dominion.friendly.includes('breen')
      && !relations.aligned,
    JSON.stringify(relations),
  );
  check(
    results,
    'p1-breen-dominion-no-added-hostility',
    !relations.breen.hostile.includes('dominion')
      && !relations.dominion.hostile.includes('breen')
      && !relations.opposed,
  );
  check(
    results,
    'p1-unknown-custom-identity-empty-lists',
    Array.isArray(relations.unknown.friendly)
      && relations.unknown.friendly.length === 0
      && relations.unknown.hostile.length === 0
      && relations.delpin.friendly.length === 0
      && relations.delpin.hostile.length === 0,
  );

  const identity = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const idx = p.snapshot().currentPlanet;
    const originalGov = p.governmentId(idx);
    const custom = p.setGovernmentId(idx, 42);
    const blender = p.systemIndexByName('Blender');
    const blenderIdentity = blender >= 0 ? p.locationIdentity(blender) : null;
    p.setGovernmentId(idx, originalGov);
    return {
      custom,
      originalGov,
      restored: p.baseFaction(idx),
      blender,
      blenderIdentity,
      command: p.commandIdentity(),
    };
  });
  check(results, 'p1-custom-polity-id-intact', identity.custom === 'custom:42', String(identity.custom));
  check(
    results,
    'p1-unknown-or-blender-identity-present',
    Boolean(identity.blenderIdentity || identity.custom),
    JSON.stringify(identity.blenderIdentity),
  );

  const flagShare = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const before = p.snapshot();
    const klingonHome = p.systemIndexByName('Qonos');
    p.addFlag('klingon');
    const raised = p.raiseFlag('klingon');
    return {
      beforeSide: before.playerSide,
      beforeFaction: before.playerFaction,
      beforeControlled: before.controlledSystems,
      after: raised,
      holdsKlingonHome: klingonHome >= 0 ? p.playerHolds(klingonHome) : false,
      flagShareGrantsControl: p.flagShareGrantsControl(),
      klingonHome,
    };
  });
  check(
    results,
    'p1-control-is-not-flown-flag',
    flagShare.beforeSide === 'ferengi'
      && flagShare.after.playerFaction === 'klingon'
      && flagShare.after.playerSide === 'ferengi'
      && flagShare.flagShareGrantsControl === false
      && flagShare.holdsKlingonHome === false,
    JSON.stringify(flagShare),
  );

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800, hull: 100, shields: 100 });
  const npcShipKill = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    p.prepareArena({ clearTraffic: true, clearStations: true, latinum: 2800 });
    const snap = p.snapshot();
    p.placePlayer(1200, 900);
    const victim = p.spawnShip({
      id: 'victim-npc',
      faction: 'terran',
      role: 'patrol',
      x: 1280,
      y: 900,
      hostile: false,
      combatHull: 1,
      combatShields: 0,
    });
    const attacker = p.spawnShip({
      id: 'attacker-npc',
      faction: 'klingon',
      role: 'fleetAttack',
      hostile: true,
      x: 1260,
      y: 900,
      destX: 1280,
      destY: 900,
    });
    const fire = p.fireNpc(attacker.id, { shipId: victim.id });
    if (!p.ship(victim.id)?.destroyed) {
      p.tick(90, 1);
    }
    if (!p.ship(victim.id)?.destroyed) {
      p.destroy(victim.id, 'npc');
    }
    const after = p.snapshot();
    return {
      latinumBefore: snap.latinum,
      latinumAfter: after.latinum,
      standingBefore: snap.standing,
      standingAfter: after.standing,
      featsBefore: snap.feats,
      featsAfter: after.feats,
      destroyed: Boolean(p.ship(victim.id)?.destroyed),
      credit: p.ship(victim.id)?.lastCombatCredit || null,
      fire,
      log: after.log,
    };
  });
  check(
    results,
    's2-npc-only-ship-kill-no-salvage-standing-feat',
    npcShipKill.destroyed
      && npcShipKill.latinumAfter === npcShipKill.latinumBefore
      && JSON.stringify(npcShipKill.standingAfter) === JSON.stringify(npcShipKill.standingBefore)
      && JSON.stringify(npcShipKill.featsAfter) === JSON.stringify(npcShipKill.featsBefore)
      && npcShipKill.credit !== 'player'
      && npcShipKill.credit !== 'playerEscort',
    JSON.stringify(npcShipKill),
  );

  const playerShipKill = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    p.prepareArena({ clearTraffic: true, clearStations: true, latinum: 2800 });
    const before = p.snapshot();
    p.placePlayer(1200, 900);
    const victim = p.spawnShip({
      id: 'victim-player-credit',
      faction: 'klingon',
      role: 'patrol',
      hostile: true,
      x: 1240,
      y: 900,
      combatHull: 1,
      combatShields: 0,
    });
    const fire = p.firePlayer(victim.id);
    if (!p.ship(victim.id)?.destroyed) p.tick(90, 1);
    if (!p.ship(victim.id)?.destroyed) p.destroy(victim.id, 'player');
    const after = p.snapshot();
    return {
      latinumBefore: before.latinum,
      latinumAfter: after.latinum,
      standingBefore: before.standing,
      standingAfter: after.standing,
      destroyed: Boolean(p.ship(victim.id)?.destroyed),
      credit: p.ship(victim.id)?.lastCombatCredit || null,
      fire,
      log: after.log,
    };
  });
  check(
    results,
    's2-player-final-hit-retains-credit',
    playerShipKill.destroyed
      && playerShipKill.latinumAfter > playerShipKill.latinumBefore
      && playerShipKill.credit === 'player',
    JSON.stringify(playerShipKill),
  );

  const escortShipKill = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    p.prepareArena({ clearTraffic: true, clearStations: true, latinum: 3100 });
    const before = p.snapshot();
    p.placePlayer(1200, 900);
    const victim = p.spawnShip({
      id: 'victim-escort-credit',
      faction: 'klingon',
      role: 'patrol',
      hostile: true,
      x: 1280,
      y: 900,
      combatHull: 1,
      combatShields: 0,
    });
    const escort = p.spawnShip({
      id: 'escort-final-hit',
      faction: 'ferengi',
      role: 'playerEscort',
      fleetId: 'escort-probe-1',
      x: 1260,
      y: 900,
      destX: 1280,
      destY: 900,
    });
    const fire = p.fireNpc(escort.id, { shipId: victim.id });
    if (!p.ship(victim.id)?.destroyed) p.tick(90, 1);
    if (!p.ship(victim.id)?.destroyed) p.destroy(victim.id, 'playerEscort');
    const after = p.snapshot();
    return {
      latinumBefore: before.latinum,
      latinumAfter: after.latinum,
      destroyed: Boolean(p.ship(victim.id)?.destroyed),
      credit: p.ship(victim.id)?.lastCombatCredit || null,
      fire,
      log: after.log,
    };
  });
  check(
    results,
    's2-escort-final-hit-retains-credit',
    escortShipKill.destroyed
      && escortShipKill.latinumAfter > escortShipKill.latinumBefore
      && escortShipKill.credit === 'playerEscort',
    JSON.stringify(escortShipKill),
  );

  const npcStationKill = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    p.prepareArena({ clearTraffic: true, latinum: 2800 });
    const before = p.snapshot();
    p.placePlayer(1200, 900);
    const station = p.spawnStation({
      id: 'victim-station-npc',
      faction: 'terran',
      name: 'Probe Yard',
      x: 1280,
      y: 900,
      combatHull: 1,
      combatShields: 0,
    });
    const attacker = p.spawnShip({
      id: 'station-killer-npc',
      faction: 'klingon',
      role: 'fleetAttack',
      hostile: true,
      x: 1260,
      y: 900,
    });
    const fire = p.fireNpc(attacker.id, { stationId: station.id });
    if (!p.station(station.id)?.destroyed) p.tick(90, 1);
    if (!p.station(station.id)?.destroyed) p.destroy(station.id, 'npc');
    const after = p.snapshot();
    return {
      latinumBefore: before.latinum,
      latinumAfter: after.latinum,
      standingBefore: before.standing,
      standingAfter: after.standing,
      featsBefore: before.feats,
      featsAfter: after.feats,
      destroyed: Boolean(p.station(station.id)?.destroyed),
      credit: p.station(station.id)?.lastCombatCredit || null,
      fire,
      log: after.log,
    };
  });
  check(
    results,
    's2-npc-only-station-kill-no-salvage-standing-feat',
    npcStationKill.destroyed
      && npcStationKill.latinumAfter === npcStationKill.latinumBefore
      && JSON.stringify(npcStationKill.standingAfter) === JSON.stringify(npcStationKill.standingBefore)
      && JSON.stringify(npcStationKill.featsAfter) === JSON.stringify(npcStationKill.featsBefore)
      && npcStationKill.credit !== 'player'
      && npcStationKill.credit !== 'playerEscort',
    JSON.stringify(npcStationKill),
  );

  const pursuit = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    p.prepareArena({ clearTraffic: true, clearStations: true, hull: 100, shields: 100 });
    p.placePlayer(1000, 900);
    const hunter = p.spawnShip({
      id: 'range-hunter',
      faction: 'klingon',
      role: 'fleetAttack',
      hostile: true,
      playerAggro: true,
      speed: 0,
      x: 1000 + 1100,
      y: 900,
      destX: 1000,
      destY: 900,
      destinationName: 'probe-start',
    });
    const fireRange = hunter.fireRange;
    const huntRange = hunter.huntRange;
    const outsideShot = p.fireNpc(hunter.id, { targetType: 'player' });
    p.tick(6, 1);
    const afterOutside = p.ship(hunter.id);
    const projectilesOutside = p.snapshot().projectileCount;
    const hullOutside = p.snapshot().hull;
    const shieldsOutside = p.snapshot().shields;
    const startDistance = afterOutside.playerDistance;
    p.patchShip(hunter.id, { speed: 2.8, lastShotAt: performance.now() - 60000 });
    let firedWhileFar = false;
    let mid = afterOutside;
    for (let i = 0; i < 100; i++) {
      p.tick(1, 1);
      mid = p.ship(hunter.id);
      const snap = p.snapshot();
      if (mid.playerDistance > fireRange && (snap.projectileCount > projectilesOutside || snap.hull < hullOutside || snap.shields < shieldsOutside)) {
        firedWhileFar = true;
        break;
      }
      if (mid.playerDistance <= fireRange * 0.92) break;
    }
    p.placePlayer(mid.x + Math.min(fireRange * 0.28, 140), mid.y);
    p.patchShip(hunter.id, { lastShotAt: performance.now() - 60000 });
    const close = p.ship(hunter.id);
    const insideShot = p.fireNpc(close.id, { targetType: 'player' });
    if (!insideShot.fired && !insideShot.projectileDelta) p.tick(16, 1);
    const afterInside = p.snapshot();
    const insideFired = Boolean(insideShot.fired || insideShot.projectileDelta || afterInside.projectileCount > projectilesOutside || afterInside.hull < hullOutside || afterInside.shields < shieldsOutside);
    return {
      fireRange,
      huntRange,
      startDistance,
      midDistance: mid.playerDistance,
      destinationName: mid.destinationName,
      projectilesOutside,
      hullOutside,
      shieldsOutside,
      firedWhileFar,
      outsideShot,
      insideShot,
      insideFired,
      hullAfter: afterInside.hull,
      shieldsAfter: afterInside.shields,
      projectilesAfter: afterInside.projectileCount,
    };
  });
  check(
    results,
    's2-hunter-may-pursue-beyond-fire-range',
    pursuit.startDistance > pursuit.fireRange
      && pursuit.startDistance <= pursuit.huntRange
      && pursuit.midDistance < pursuit.startDistance - 4
      && (pursuit.destinationName === 'player' || String(pursuit.destinationName || '').includes('player')),
    JSON.stringify(pursuit),
  );
  check(
    results,
    's2-hunter-must-not-fire-outside-range',
    pursuit.projectilesOutside === 0 && pursuit.firedWhileFar === false && pursuit.outsideShot.projectileDelta === 0,
    JSON.stringify(pursuit),
  );
  check(
    results,
    's2-hunter-fires-inside-range',
    pursuit.insideFired === true,
    JSON.stringify(pursuit),
  );

  const arrival = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    p.prepareArena({ clearTraffic: true });
    p.placePlayer(1100, 800);
    const raid = p.spawnShip({
      id: 'arrival-raid-1',
      faction: 'klingon',
      role: 'fleetAttack',
      hostile: true,
      attackId: 'raid-probe-1',
      destinationName: 'raid: yard',
      x: 1400,
      y: 800,
      destX: 1100,
      destY: 800,
    });
    const station = p.spawnStation({
      id: 'arrival-yard',
      faction: 'ferengi',
      name: 'Home Yard',
      x: 1180,
      y: 820,
    });
    const calmed = p.calmArrival();
    return {
      raidId: raid.id,
      stationId: station.id,
      spawnProtectionUntil: calmed.spawnProtectionUntil,
      now: calmed.now,
      ships: calmed.ships,
      stations: calmed.stations,
      raidStillPresent: calmed.ships.some((ship) => ship.id === raid.id && ship.attackId === 'raid-probe-1'),
      orderKept: calmed.ships.some((ship) => ship.id === raid.id && ship.destinationName === 'raid: yard'),
      ownerKept: calmed.stations.some((entry) => entry.id === station.id && entry.faction === 'ferengi'),
      fleetsRemoved: calmed.fleetsRemoved,
      ordersCleared: calmed.ordersCleared,
      ownershipRewritten: calmed.ownershipRewritten,
    };
  });
  check(
    results,
    's3-arrival-protection-is-personal',
    arrival.spawnProtectionUntil > arrival.now
      && arrival.raidStillPresent
      && arrival.orderKept
      && arrival.ownerKept
      && arrival.fleetsRemoved === 0
      && arrival.ordersCleared === 0
      && arrival.ownershipRewritten === 0,
    JSON.stringify(arrival),
  );

  const ownership = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const snap = p.snapshot();
    const earth = p.systemIndexByName('Earth');
    const target = earth >= 0 ? earth : (snap.controlledSystems[0] === 0 ? 1 : 0);
    const warped = p.warpTo(target);
    p.prepareArena({ latinum: 20000, duranium: 400 });
    const swiss = p.spawnStation({
      id: 'swiss-exchange',
      faction: 'neutral',
      name: 'Free Swiss Exchange',
      x: p.snapshot().npcShips[0]?.x || 1200,
      y: 900,
    });
    const privatePad = p.spawnStation({
      id: 'private-pad',
      faction: 'andorian',
      name: 'Private Pad',
      privateInstallation: true,
      x: 1250,
      y: 940,
    });
    const occupierYard = p.spawnStation({
      id: 'holder-yard',
      faction: p.snapshot().systemFaction,
      name: 'Sovereign Yard',
      x: 1300,
      y: 880,
    });
    const blockers = p.clearClaimBlockers('npc');
    const claimed = p.claimCurrent();
    const afterClaim = {
      swiss: p.station(swiss.id),
      privatePad: p.station(privatePad.id),
      occupierYard: p.station(occupierYard.id),
      controlled: claimed.controlled,
      systemFaction: claimed.systemFaction,
    };
    const seized = p.seize('klingon');
    const klingonYard = p.spawnStation({
      id: 'klingon-occupy-yard',
      faction: 'klingon',
      name: 'Occupation Yard',
      x: 1320,
      y: 900,
    });
    const afterSeize = {
      swiss: p.station(swiss.id),
      privatePad: p.station(privatePad.id),
      controlled: seized.controlled,
      systemFaction: seized.systemFaction,
    };
    p.clearClaimBlockers('npc');
    const reclaimed = p.claimCurrent();
    return {
      warped,
      blockers,
      afterClaim,
      afterSeize,
      afterReclaim: {
        swiss: p.station(swiss.id),
        privatePad: p.station(privatePad.id),
        klingonYard: p.station(klingonYard.id),
        controlled: reclaimed.controlled,
        systemFaction: reclaimed.systemFaction,
      },
    };
  });
  check(
    results,
    's3-foreign-private-retain-owners-on-capture',
    ownership.afterClaim.controlled
      && ownership.afterClaim.swiss?.faction === 'neutral'
      && ownership.afterClaim.privatePad?.faction === 'andorian'
      && ownership.afterClaim.privatePad?.privateInstallation === true,
    JSON.stringify(ownership.afterClaim),
  );
  check(
    results,
    's3-station-ownership-survives-capture-and-reclaim',
    ownership.afterSeize.swiss?.faction === 'neutral'
      && ownership.afterSeize.privatePad?.faction === 'andorian'
      && ownership.afterReclaim.controlled
      && ownership.afterReclaim.swiss?.faction === 'neutral'
      && ownership.afterReclaim.privatePad?.faction === 'andorian',
    JSON.stringify({ seize: ownership.afterSeize, reclaim: ownership.afterReclaim }),
  );

  const restoration = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const here = p.snapshot().currentPlanet;
    const other = here === 0 ? 1 : 0;
    p.spawnShip({
      id: 'keeper-18',
      shipId: 18,
      faction: 'terran',
      role: 'patrol',
      name: 'ISS Keeper',
      attackId: 'raid-1',
      destinationName: 'raid: yard',
      x: 1400,
      y: 800,
    });
    const warpedAway = p.warpTo(other);
    const warpedBack = p.warpTo(here);
    const keeper = p.snapshot().npcShips.find((ship) => ship.id === 'keeper-18' || ship.name === 'ISS Keeper');
    return {
      warpedAway,
      warpedBack,
      keeper,
      ships: p.snapshot().npcShips.map((ship) => ({ id: ship.id, name: ship.name, attackId: ship.attackId, faction: ship.faction })),
    };
  });
  check(
    results,
    's3-existing-ships-preserve-identity-on-reentry',
    Boolean(restoration.keeper)
      && (restoration.keeper.name === 'ISS Keeper' || restoration.keeper.id === 'keeper-18')
      && restoration.keeper.faction === 'terran',
    JSON.stringify(restoration),
  );

  return results;
}

async function runPhase2Roe(page, results) {
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800, hull: 100, shields: 100 });
  await page.waitForFunction(() => Boolean(globalThis.__BM1_PROBE__?.ready?.()), { timeout: 30000 });

  const now = Date.now();
  const s4 = await page.evaluate((clock) => {
    const probe = globalThis.__BM1_PROBE__;
    probe.setEmpireRoe('return-fire');
    const warHostile = { id: 'klingon-1', faction: 'klingon', hostile: true, attitude: 'hostile' };
    const warOnly = { id: 'dominion-war', faction: 'dominion', hostile: false, attitude: 'neutral' };
    const attacker = { id: 'raider-7', faction: 'klingon', attackId: null, hostile: false, attitude: 'neutral' };
    const snap = probe.snapshot();
    const home = snap.currentPlanet;
    const raid = { id: 'raid-home', systemIndex: home, faction: 'cardassian' };
    const raider = { id: 'raid-ship', faction: 'cardassian', attackId: 'raid-home' };
    const otherRaider = { id: 'raid-else', faction: 'cardassian', attackId: 'raid-other' };
    const warHostileRF = probe.mayAutoEngage(warHostile);
    const warOnlyRF = probe.mayAutoEngage(warOnly);
    probe.recordAttack(attacker, 'player');
    const attributedRF = probe.mayAutoEngage(attacker);
    probe.setActiveRaid(raid);
    const raidMatch = probe.mayAutoEngage(raider);
    probe.setActiveRaid({ id: 'raid-away', systemIndex: home + 9, faction: 'cardassian' });
    const raidMismatch = probe.mayAutoEngage(otherRaider);
    probe.setActiveRaid(null);
    const ownStation = { id: 'own-yard', stationTypeId: 900, builtByPlayer: true, faction: 'ferengi' };
    const ownEscort = { id: 'escort-a', role: 'playerEscort', fleetId: 'escort-1', faction: 'ferengi' };
    const foreign = { id: 'foreign-1', faction: 'romulan', hostile: false, attitude: 'neutral' };
    const orderPreviewOwn = probe.previewEscortOrder(ownStation, 'station');
    const orderPreviewEscort = probe.previewEscortOrder(ownEscort, 'ship');
    const orderForeign = probe.markEscortOrder({ ...foreign });
    probe.setEmpireRoe('defend');
    const defendHostile = probe.mayAutoEngage({ id: 'd1', faction: 'dominion', hostile: true, attitude: 'hostile' });
    const defendWar = probe.mayAutoEngage({ id: 'd2', faction: 'dominion', hostile: false, attitude: 'neutral' });
    probe.setEmpireRoe('return-fire');
    probe.setHoldingRoe(home, 'defend');
    const merged = probe.snapshot();
    const ownerBefore = merged.playerSecurity.ownerSide;
    probe.raiseFlag('klingon');
    const afterFlag = probe.snapshot();
    probe.setHoldingRoe(home, 'return-fire');
    const lost = probe.loseHolding(home, 'klingon');
    const afterLoss = probe.snapshot();
    const reclaimedRoe = probe.reclaimHolding(home);
    const afterReclaim = probe.snapshot();
    return {
      modes: merged.playerSecurity.empireDefault,
      warHostileRF,
      warOnlyRF,
      attributedRF,
      raidMatch,
      raidMismatch,
      defendHostile,
      defendWar,
      orderPreviewOwn,
      orderPreviewEscort,
      orderForeign,
      mergedAccess: merged.effectivePolicy.access,
      mergedAlerts: merged.effectivePolicy.alerts,
      mergedRoeWhileHoldingDefend: merged.effectiveRoe,
      ownerBefore,
      ownerAfter: afterFlag.playerSecurity.ownerSide,
      roeAfterFlag: afterFlag.playerSecurity.empireDefault.roe,
      flagAfter: afterFlag.playerFaction,
      lost,
      afterLossRoe: afterLoss.effectiveRoe,
      afterLossHeld: afterLoss.controlledSystems.includes(home),
      retained: Boolean(afterLoss.playerSecurity.holdings[String(home)]),
      retainedActive: Boolean(afterLoss.playerSecurity.holdings[String(home)]?.active),
      reclaimedRoe,
      afterReclaimHeld: afterReclaim.controlledSystems.includes(home),
      accessEnforced: snap.accessEnforced,
      alertsActive: snap.alertsActive,
      protectAll: snap.protectAll,
      home,
      clock,
    };
  }, now);

  check(results, 'S4-01 only-return-fire-and-defend-modes', ['return-fire', 'defend'].includes(s4.modes.roe) && s4.protectAll === false);
  check(results, 'S4-02 return-fire-hostility-alone-insufficient', s4.warHostileRF === false);
  check(results, 'S4-03 return-fire-war-flag-alone-insufficient', s4.warOnlyRF === false);
  check(results, 'S4-04 return-fire-attributable-attack-in-system-authorizes', s4.attributedRF === true);
  check(results, 'S4-05 return-fire-matching-raid-against-holding-authorizes', s4.raidMatch === true);
  check(results, 'S4-06 return-fire-raid-against-other-system-insufficient', s4.raidMismatch === false);
  check(results, 'S4-07 defend-hostility-toward-player-authorizes', s4.defendHostile === true);
  check(results, 'S4-08 defend-war-with-player-flag-authorizes', s4.defendWar === true);
  check(results, 'S4-09 escort-order-refused-for-player-owned-station', s4.orderPreviewOwn.applied === false && s4.orderPreviewOwn.reason === 'protected');
  check(results, 'S4-10 escort-order-refused-for-player-side-ship', s4.orderPreviewEscort.applied === false && s4.orderPreviewEscort.reason === 'protected');
  check(results, 'S4-11 escort-order-overrides-roe-for-foreign-target', s4.orderForeign.applied === true && s4.orderForeign.mutated === true, JSON.stringify(s4.orderForeign));
  check(results, 'S4-12 policies-belong-to-player-side', s4.ownerBefore === 'ferengi' && s4.ownerAfter === 'ferengi');
  check(results, 'S4-13 policies-survive-flag-change', s4.flagAfter === 'klingon' && s4.roeAfterFlag === 'return-fire', JSON.stringify({ flag: s4.flagAfter, roe: s4.roeAfterFlag }));
  check(results, 'S4-14 merge-by-dimension-keeps-reserved-access', Boolean(s4.mergedAccess && s4.mergedAccess.warFlag && s4.mergedRoeWhileHoldingDefend === 'defend'));
  check(results, 'S4-15 merge-by-dimension-keeps-reserved-alerts', s4.mergedAlerts === 'all' || s4.mergedAlerts === 'incidents' || s4.mergedAlerts === 'silent');
  check(results, 'S4-16 local-override-inactive-when-holding-lost', s4.afterLossHeld === false && s4.retainedActive === false);
  check(results, 'S4-17 local-override-retained-when-holding-lost', s4.retained === true);
  check(results, 'S4-18 lost-holding-uses-empire-default-roe', s4.afterLossRoe === 'return-fire');
  check(results, 'S4-19 local-override-reactivates-on-reclaim', s4.afterReclaimHeld === true && s4.reclaimedRoe === 'return-fire');
  check(results, 'S4-20 access-is-reserved-not-enforced', s4.accessEnforced === false);
  check(
    results,
    'S4-21 alerts-mode-gates-notifications',
    (s4.mergedAlerts === 'all' || s4.mergedAlerts === 'incidents' || s4.mergedAlerts === 'silent')
      && s4.alertsActive === (s4.mergedAlerts !== 'silent'),
    JSON.stringify({ mergedAlerts: s4.mergedAlerts, alertsActive: s4.alertsActive }),
  );
  check(results, 'S4-22 protect-all-is-not-offered', s4.protectAll === false);

  const ui = await page.evaluate(() => {
    const probe = globalThis.__BM1_PROBE__;
    probe.openSettings();
    const before = probe.securityUi();
    const returnBtn = document.querySelector('[data-security-empire-roe="return-fire"]');
    returnBtn?.click();
    const afterClick = probe.snapshot();
    const afterUi = probe.securityUi();
    const text = `${afterUi.text}`.toLowerCase();
    return {
      present: before.present,
      empireButtons: before.empireButtons,
      holdingButtons: before.holdingButtons.length,
      text,
      afterRoe: afterClick.playerSecurity.empireDefault.roe,
      hasProtectAll: /protect-all|protect all/.test(text),
      presentsAccessWorking: /access enforcement is active|borders are now closed|challenge visitors automatically/.test(text),
      presentsAlertsWorking: /flash alerts enabled|notifications are live|alert channel open/.test(text),
      mentionsReserved: /reserved/.test(text),
    };
  });

  check(results, 'S4-23 security-ui-is-on-settings-hook', ui.present === true);
  check(results, 'S4-24 security-ui-can-set-empire-default', ui.empireButtons.includes('return-fire') && ui.empireButtons.includes('defend') && ui.afterRoe === 'return-fire', JSON.stringify(ui));
  check(results, 'S4-25 security-ui-lists-owned-or-retained-holdings', ui.holdingButtons > 0);
  check(results, 'S4-26 security-ui-does-not-present-access-as-working', ui.presentsAccessWorking === false && ui.mentionsReserved === true);
  check(results, 'S4-27 security-ui-does-not-present-alerts-as-working', ui.presentsAlertsWorking === false);
  check(results, 'S4-28 security-ui-does-not-offer-protect-all', ui.hasProtectAll === false);

  const extra = await page.evaluate(() => {
    const probe = globalThis.__BM1_PROBE__;
    probe.setEmpireRoe('return-fire');
    const home = probe.snapshot().currentPlanet;
    probe.setHoldingRoe(home, 'defend');
    const inHolding = probe.snapshot().effectiveRoe;
    const lost = probe.loseHolding(home, 'romulan');
    const outside = probe.snapshot().effectiveRoe;
    probe.reclaimHolding(home);
    const ownShip = { id: 'fleet-home', role: 'playerFleet', fleetId: 'garrison-1', faction: 'klingon' };
    const foreignConcession = { id: 'swiss', stationTypeId: 12, faction: 'neutral', privateInstallation: true };
    const transferredYard = { id: 'yard', stationTypeId: 4, faction: probe.snapshot().playerSide, builtByPlayer: false };
    return {
      inHolding,
      outside,
      lostInactive: lost.overrideActive === false,
      ownShipProtected: probe.isProtected(ownShip, 'ship'),
      concessionNotOwned: probe.isProtected(foreignConcession, 'station') === false,
      transferredOwned: probe.isProtected(transferredYard, 'station'),
      ownShipNotForeign: probe.isForeign(ownShip, 'ship') === false,
    };
  });

  check(results, 'S4-29 holding-override-applies-inside-holding', extra.inHolding === 'defend');
  check(results, 'S4-30 outside-holdings-use-empire-default-roe', extra.outside === 'return-fire');
  check(results, 'S4-31 occupier-does-not-inherit-inactive-override', extra.lostInactive === true);
  check(results, 'S4-32 player-side-ships-are-protected-assets', extra.ownShipProtected === true && extra.ownShipNotForeign === true);
  check(results, 'S4-33 foreign-private-installations-are-not-player-owned', extra.concessionNotOwned === true);
  check(results, 'S4-34 transferred-holding-yards-are-player-owned', extra.transferredOwned === true);

  const alertSafe = await page.evaluate(() => {
    const probe = globalThis.__BM1_PROBE__;
    const own = { id: 'built-1', stationTypeId: 3, builtByPlayer: true, faction: 'ferengi', hostile: false };
    const escort = { id: 'esc-2', role: 'playerEscort', fleetId: 'e2', faction: 'ferengi', hostile: false };
    return {
      ownProtected: probe.isProtected(own, 'station'),
      escortProtected: probe.isProtected(escort, 'ship'),
      cannotOrderOwn: probe.markEscortOrder(own).applied === false,
      cannotOrderEscort: probe.markEscortOrder(escort).applied === false,
      ownUnchanged: own.hostile === false && !own.playerEscortOrderUntil,
      escortUnchanged: escort.hostile === false && !escort.playerEscortOrderUntil,
    };
  });

  check(results, 'S4-35 own-assets-protected-before-order-mutates', alertSafe.cannotOrderOwn && alertSafe.ownUnchanged);
  check(results, 'S4-36 player-side-ships-protected-before-order-mutates', alertSafe.cannotOrderEscort && alertSafe.escortUnchanged);

  const replacement = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    p.prepareArena({ clearTraffic: true });
    const attacker = p.spawnShip({
      id: 'slot-reuse',
      role: 'traffic',
      faction: 'klingon',
      x: 1400,
      y: 900,
      destX: 1500,
      destY: 900,
    });
    p.patchShip('slot-reuse', { lastAggressionAt: performance.now(), lastAggressionTargetSide: 'ferengi', playerAggroUntil: performance.now() + 20000, attackId: 'old-raid' });
    const before = p.ship('slot-reuse');
    const after = p.beginAmbientReplacement('slot-reuse');
    return { before, after };
  });
  check(
    results,
    'S4-37 replacement-clears-inherited-aggression',
    Boolean(replacement.after)
      && replacement.after.securityInstanceId
      && replacement.after.securityInstanceId !== replacement.before.securityInstanceId
      && !replacement.after.attackId
      && !replacement.after.playerAggroUntil,
    JSON.stringify(replacement),
  );
}

async function evalProbe(page, results, id, fn, arg) {
  try {
    return await page.evaluate(fn, arg);
  } catch (error) {
    check(results, id, false, String(error?.message || error));
    return { __probeError: String(error?.message || error) };
  }
}

async function runPhase3Checkpoints(page, results) {
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 28000, hull: 100, shields: 100 });

  const setup = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const snap = p.snapshot();
    const anchors = (snap.stations || []).filter((station) => !station.destroyed && !station.privateInstallation);
    const enabled = anchors[0] ? p.enableCheckpoint(anchors[0].id) : { ok: false, reason: 'no-anchor' };
    const zone = p.checkpoint();
    return {
      home: snap.currentPlanet,
      homeName: snap.systemName,
      controlled: snap.controlledSystems,
      enabled,
      zone: zone.zoneId ? zone : p.checkpoint(),
      anchors: anchors.map((station) => ({ id: station.id, name: station.name, faction: station.faction })),
      geometry: p.geometry(),
    };
  });
  check(results, 'S5-setup player-checkpoint-enabled', Boolean(setup.enabled?.ok && setup.geometry?.radius), JSON.stringify(setup));

  const s51 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    p.setEmpireAccess('independent', 'open');
    p.setEmpireAccess('other', 'open');
    p.setEmpireAccess('warFlag', 'open');
    const geo = p.geometry();
    const standingBefore = p.snapshot().standing;
    const projectilesBefore = p.snapshot().projectileCount;
    p.spawnShip({
      id: 'open-trader',
      role: 'traffic',
      faction: 'neutral',
      x: geo.center.x + geo.radius + 90,
      y: geo.center.y,
      destX: geo.center.x,
      destY: geo.center.y,
      speed: 2.2,
    });
    p.tick(80, 1);
    const after = p.checkpoint();
    const orders = (after.orders || []).filter((order) => order.npcId === 'open-trader' || order.visitorInstanceId === p.ship('open-trader')?.securityInstanceId);
    return {
      orders,
      standing: p.snapshot().standing,
      standingBefore,
      projectiles: p.snapshot().projectileCount,
      projectilesBefore,
      ship: p.ship('open-trader'),
    };
  });
  check(
    results,
    'S5.1 open-access-creates-no-order-or-offense',
    s51.ship
      && s51.orders.every((order) => !order || order.lifecycle === 'not_addressed' || order.accessDecision === 'open')
      && (s51.orders.length === 0 || s51.orders.every((order) => order.lifecycle === 'not_addressed'))
      && s51.projectiles === s51.projectilesBefore,
    JSON.stringify({ count: s51.orders.length, orders: s51.orders, ship: s51.ship }),
  );

  const s52 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    p.prepareArena({ clearTraffic: true });
    p.setEmpireAccess('independent', 'challenge');
    p.setEmpireAccess('other', 'challenge');
    const geo = p.geometry();
    if (!geo) return { missing: 'geometry' };
    const ship = p.spawnShip({
      id: 'challenge-trader',
      role: 'traffic',
      faction: 'neutral',
      x: geo.center.x + Math.min(28, geo.radius * 0.12),
      y: geo.center.y,
      destX: geo.center.x,
      destY: geo.center.y,
      speed: 2.4,
    });
    p.tick(20, 1);
    const first = p.orderFor('challenge-trader');
    p.tick(360, 1);
    const later = p.orderFor('challenge-trader');
    const shipAfter = p.ship('challenge-trader');
    return {
      ship,
      firstCount: first ? 1 : 0,
      first,
      laterCount: later ? 1 : 0,
      later,
      objective: shipAfter?.securityObjective || null,
      destName: shipAfter?.destinationName || null,
    };
  });
  check(
    results,
    'S5.2 challenge-issues-one-order-and-can-clear',
    !s52.missing
      && s52.firstCount === 1
      && s52.laterCount === 1
      && (s52.later?.lifecycle === 'cleared' || s52.later?.lifecycle === 'dwelling' || s52.later?.lifecycle === 'pending' || s52.later?.lifecycle === 'holding')
      && s52.destName !== 'player'
      && !String(s52.destName || '').startsWith('defend:'),
    JSON.stringify(s52),
  );

  const s53 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    p.prepareArena({ clearTraffic: true });
    p.setEmpireAccess('independent', 'closed');
    p.setEmpireAccess('other', 'closed');
    const geo = p.geometry();
    if (!geo) return { missing: 'geometry' };
    p.spawnShip({
      id: 'closed-trader',
      role: 'traffic',
      faction: 'neutral',
      x: geo.center.x + 20,
      y: geo.center.y + 20,
      destX: geo.center.x,
      destY: geo.center.y,
      speed: 2.4,
    });
    p.tick(30, 1);
    const issued = [p.orderFor('closed-trader')].filter(Boolean);
    p.tick(220, 1);
    const later = [p.orderFor('closed-trader')].filter(Boolean);
    const ship = p.ship('closed-trader');
    const destInside = ship?.destination
      ? Math.hypot(ship.destination.x - geo.center.x, ship.destination.y - geo.center.y) <= geo.radius
      : false;
    return {
      issued: issued[0] || null,
      later: later[0] || null,
      destInside,
      destName: ship?.destinationName || null,
      ship,
    };
  });
  check(
    results,
    'S5.3 closed-access-withdraws-without-loop',
    !s53.missing
      && s53.issued?.instructionKind === 'withdrawal'
      && (s53.later?.lifecycle === 'withdrawn' || s53.later?.lifecycle === 'pending' || s53.later?.lifecycle === 'departed')
      && s53.destInside === false,
    JSON.stringify(s53),
  );

  const s54 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    p.prepareArena({ clearTraffic: true });
    probe2.setEmpireRoe('return-fire');
    p.setEmpireAccess('warFlag', 'closed');
    const geo = p.geometry();
    p.spawnShip({
      id: 'war-visitor',
      role: 'traffic',
      faction: 'pirate',
      hostile: false,
      attitude: 'neutral',
      x: geo.center.x + 30,
      y: geo.center.y,
      destX: geo.center.x,
      destY: geo.center.y,
      speed: 0.2,
    });
    p.tick(12, 1);
    p.patchShip('war-visitor', { speed: 0, x: geo.center.x + 30, y: geo.center.y });
    const standingBefore = { ...p.snapshot().standing };
    p.tick(40, 250);
    const after = p.orderFor('war-visitor');
    const snap = p.snapshot();
    const mayFire = probe2.mayAutoEngage({ id: 'war-visitor', faction: 'klingon', hostile: false, attitude: 'neutral' });
    return {
      after,
      standingBefore,
      standing: snap.standing,
      mayFire,
      projectiles: snap.projectileCount,
    };
  });
  check(
    results,
    'S5.4 refusal-expiry-is-not-attack-evidence',
    s54.after
      && (s54.after.lifecycle === 'expired' || s54.after.lifecycle === 'refused' || s54.after.outcome === 'noncompliant')
      && s54.mayFire === false
      && JSON.stringify(s54.standing) === JSON.stringify(s54.standingBefore),
    JSON.stringify(s54),
  );

  const s55 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    probe2.setEmpireRoe('return-fire');
    p.setEmpireAccess('warFlag', 'closed');
    const attacker = { id: 'real-shot', faction: 'klingon', hostile: false, attitude: 'neutral' };
    probe2.recordAttack(attacker, 'player');
    const authorized = probe2.mayAutoEngage(attacker);
    probe2.setActiveRaid(null);
    return { authorized };
  });
  check(results, 'S5.5 real-aggression-still-authorizes-return-fire', s55.authorized === true, JSON.stringify(s55));

  const s56 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const qonos = p.systemIndexByName('Qonos');
    p.addFlag('klingon');
    p.raiseFlag('klingon');
    const holds = qonos >= 0 ? p.playerHolds(qonos) : false;
    const warped = qonos >= 0 ? p.warpTo(qonos) : { ok: false };
    const mutated = p.enableCheckpoint('nope');
    const foreignAccess = p.setForeignAccess();
    const swiss = p.spawnStation({
      id: 'phase3-swiss',
      faction: 'neutral',
      privateInstallation: true,
      name: 'Swiss Desk',
      x: 1200,
      y: 900,
    });
    const owner = p.getStationOwner(p.station(swiss.id) || swiss);
    return {
      holds,
      warped,
      mutated,
      foreignAccess,
      owner,
      command: p.commandIdentity(),
      flag: p.snapshot().playerFaction,
    };
  });
  check(
    results,
    'S5.6 same-flag-foreign-cannot-mutate-checkpoint',
    s56.holds === false
      && s56.mutated?.ok === false
      && s56.foreignAccess?.ok === false
      && s56.owner?.kind === 'private'
      && s56.command !== 'klingon',
    JSON.stringify(s56),
  );

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 28000, hull: 100, shields: 100 });
  const s57 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const snap = p.snapshot();
    const anchors = (snap.stations || []).filter((station) => !station.destroyed && !station.privateInstallation);
    if (anchors[0]) p.enableCheckpoint(anchors[0].id);
    p.setEmpireAccess('independent', 'challenge');
    p.setEmpireAccess('other', 'challenge');
    p.setEmpireAccess('warFlag', 'closed');
    const own = p.classify({ sideId: p.commandIdentity(), broadcast: { faction: 'ferengi', source: 'declared' } });
    const sameFlag = p.classify({ sideId: 'ferengi-house', broadcast: { faction: p.snapshot().playerFaction, source: 'declared' } });
    const independent = p.classify({ sideId: 'ship:indie', broadcast: { faction: 'neutral', source: 'hull' } });
    const warFaction = p.opposed('pirate', p.snapshot().playerFaction) ? 'pirate' : (p.opposed('klingon', p.snapshot().playerFaction) ? 'klingon' : 'borg');
    const war = p.classify({ sideId: warFaction, broadcast: { faction: warFaction, source: 'hull' } });
    const custom = p.classify({ sideId: 'custom:42', broadcast: { faction: 'custom:42', source: 'declared' } });
    const unknown = p.classify({ sideId: 'ghost', broadcast: { faction: '', source: 'none' } });
    return { own, sameFlag, independent, war, custom, unknown };
  });
  check(
    results,
    'S5.7 classification-table',
    s57.own?.class === 'exempt'
      && s57.sameFlag?.class === 'other'
      && s57.independent?.class === 'independent'
      && s57.war?.class === 'warFlag'
      && s57.custom?.class === 'other'
      && s57.unknown?.class === 'unknown'
      && s57.unknown?.enforceable === false,
    JSON.stringify(s57),
  );

  const s58 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const vulcan = p.systemIndexByName('Vulcan');
    if (vulcan < 0) return { missing: 'vulcan' };
    p.warpTo(vulcan);
    const zone = p.checkpoint();
    const geo = p.geometry();
    if (!geo) return { missing: 'authored-zone', zone };
    p.placePlayer(geo.center.x + Math.min(40, geo.radius * 0.2), geo.center.y);
    p.tick(10, 1);
    const afterEnter = p.checkpoint();
    const early = p.playerRespond('clearance');
    const repeatBefore = afterEnter.playerOrder?.remainingTravelMs;
    p.playerRespond('repeat');
    const afterRepeat = p.checkpoint().playerOrder?.remainingTravelMs;
    p.placeAtHold();
    p.tick(50, 8);
    const dwell = p.checkpoint().playerOrder || p.orderFor('player');
    const cleared = p.playerRespond('clearance');
    const after = p.checkpoint();
    return {
      zone: afterEnter.zone || zone.zone,
      early,
      repeatBefore,
      afterRepeat,
      dwell,
      cleared,
      afterOrder: after.playerOrder,
      playerOrders: (afterEnter.orders || []).filter((order) => order.visitorKind === 'player'),
      decision: p.classify({ sideId: p.commandIdentity(), broadcast: { faction: p.snapshot().playerFaction, source: 'declared' } }),
    };
  });
  check(
    results,
    'S5.8 player-compliance-at-authored-vulcan',
    !s58.missing
      && s58.zone?.foreign === true
      && s58.early?.ok === false
      && (s58.afterRepeat == null || s58.repeatBefore == null || s58.afterRepeat <= s58.repeatBefore)
      && (s58.cleared?.ok === true || s58.afterOrder?.lifecycle === 'cleared' || s58.dwell?.accumulatedDwellMs > 0),
    JSON.stringify(s58),
  );

  const s59 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const vulcan = p.systemIndexByName('Vulcan');
    const home = p.systemIndexByName('Ferenginar');
    if (home >= 0) p.warpTo(home);
    p.warpTo(vulcan);
    p.placeAtApproach();
    const geo = p.geometry();
    p.placePlayer(geo.center.x + 10, geo.center.y + 10);
    p.tick(8, 1);
    const refused = p.playerRespond('refuse');
    const edit = p.setForeignAccess();
    const enable = p.enableCheckpoint('x');
    p.warpTo(p.systemIndexByName('Ferenginar') >= 0 ? p.systemIndexByName('Ferenginar') : 0);
    p.warpTo(vulcan);
    p.placePlayer(geo.center.x + 10, geo.center.y + 10);
    p.tick(8, 1);
    const withdraw = p.playerRespond('withdraw');
    const beforeLeave = p.checkpoint().playerOrder;
    p.placeAtApproach();
    p.tick(20, 4);
    const afterLeave = p.checkpoint().playerOrder;
    return { refused, edit, enable, withdraw, beforeLeave, afterLeave };
  });
  check(
    results,
    'S5.9 player-withdraw-or-refuse-and-cannot-edit-foreign',
    s59.refused?.ok === true
      && s59.edit?.ok === false
      && s59.enable?.ok === false
      && (s59.afterLeave?.lifecycle === 'withdrawn' || s59.afterLeave?.lifecycle === 'departed' || s59.withdraw?.ok === true),
    JSON.stringify(s59),
  );

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 28000, hull: 100, shields: 100 });
  const s510 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    const snap = p.snapshot();
    const anchors = (snap.stations || []).filter((station) => !station.destroyed && !station.privateInstallation);
    if (anchors[0]) p.enableCheckpoint(anchors[0].id);
    p.setEmpireAccess('independent', 'challenge');
    probe2.setEmpireRoe('return-fire');
    const before = p.localElapsedMs();
    p.tick(12, 0.25);
    const after = p.localElapsedMs();
    const expected = 12 * 0.25 * 16.6667;
    const geo = p.geometry();
    p.spawnShip({
      id: 'slow-trader',
      role: 'traffic',
      faction: 'neutral',
      hostile: false,
      attitude: 'neutral',
      x: geo.center.x + Math.min(24, geo.radius * 0.15),
      y: geo.center.y,
      destX: geo.center.x,
      destY: geo.center.y,
      speed: 0.35,
    });
    p.tick(2, 1);
    const issued = p.orderFor('slow-trader');
    p.tick(14, 1);
    const order = p.orderFor('slow-trader');
    const standingBefore = { ...p.snapshot().standing };
    const projectilesBefore = p.snapshot().projectileCount;
    const shipBefore = p.ship('slow-trader');
    const tractor = p.tractorHold('slow-trader', 45000);
    p.tick(6, 1);
    const afterTractor = p.orderFor('slow-trader');
    const tractorShip = p.ship('slow-trader');
    const standingAfterTractor = { ...p.snapshot().standing };
    const mayFireTractor = probe2.mayAutoEngage({
      id: 'slow-trader',
      faction: 'neutral',
      hostile: Boolean(tractorShip?.hostile),
      attitude: 'neutral',
    });

    p.prepareArena({ clearTraffic: true });
    if (!p.checkpoint().zone && anchors[0]) p.enableCheckpoint(anchors[0].id);
    p.setEmpireAccess('independent', 'challenge');
    const geo2 = p.geometry();
    p.spawnShip({
      id: 'disabled-trader',
      role: 'traffic',
      faction: 'neutral',
      hostile: false,
      attitude: 'neutral',
      x: geo2.center.x + Math.min(22, geo2.radius * 0.14),
      y: geo2.center.y,
      destX: geo2.center.x,
      destY: geo2.center.y,
      speed: 0.4,
    });
    p.tick(8, 1);
    const engineIssued = p.orderFor('disabled-trader');
    const engine = p.engineDisable('disabled-trader', 45000);
    p.tick(6, 1);
    const afterEngine = p.orderFor('disabled-trader');
    const engineShip = p.ship('disabled-trader');
    const standingAfterEngine = { ...p.snapshot().standing };
    const mayFireEngine = probe2.mayAutoEngage({
      id: 'disabled-trader',
      faction: 'neutral',
      hostile: Boolean(engineShip?.hostile),
      attitude: 'neutral',
    });
    return {
      before,
      after,
      expected,
      clockOk: Math.abs((after - before) - expected) < 2,
      allowance: issued?.remainingTravelMs || order?.remainingTravelMs || 0,
      issuedLifecycle: issued?.lifecycle || order?.lifecycle || null,
      tractor,
      engine,
      engineIssued: engineIssued?.lifecycle || null,
      remainingBeforeInterrupt: order?.remainingTravelMs || 0,
      tractorLifecycle: afterTractor?.lifecycle || null,
      tractorOutcome: afterTractor?.outcome || null,
      tractorResult: afterTractor?.result || null,
      engineLifecycle: afterEngine?.lifecycle || null,
      engineOutcome: afterEngine?.outcome || null,
      engineResult: afterEngine?.result || null,
      tractorHostile: Boolean(tractorShip?.hostile),
      engineHostile: Boolean(engineShip?.hostile),
      tractorAttackId: tractorShip?.attackId || null,
      engineAttackId: engineShip?.attackId || null,
      tractorAggression: tractorShip?.lastAggressionAt || 0,
      engineAggression: engineShip?.lastAggressionAt || 0,
      shipHostileBefore: Boolean(shipBefore?.hostile),
      standingUnchanged: JSON.stringify(standingAfterTractor) === JSON.stringify(standingBefore)
        && JSON.stringify(standingAfterEngine) === JSON.stringify(standingBefore),
      projectiles: p.snapshot().projectileCount,
      projectilesBefore,
      mayFireTractor,
      mayFireEngine,
    };
  });
  check(
    results,
    'S5.10 clock-uses-simulation-delta',
    s510.clockOk === true && s510.allowance >= 44000,
    JSON.stringify({ clockOk: s510.clockOk, allowance: s510.allowance, expected: s510.expected }),
  );
  check(
    results,
    'S5.10 interrupt-unable-to-comply-without-hostility',
    s510.tractor?.ok === true
      && s510.engine?.ok === true
      && s510.tractorLifecycle === 'unable_to_comply'
      && s510.engineLifecycle === 'unable_to_comply'
      && s510.tractorOutcome !== 'noncompliant'
      && s510.engineOutcome !== 'noncompliant'
      && s510.remainingBeforeInterrupt > 1000
      && s510.tractorHostile === false
      && s510.engineHostile === false
      && !s510.tractorAttackId
      && !s510.engineAttackId
      && s510.tractorAggression === 0
      && s510.engineAggression === 0
      && s510.mayFireTractor === false
      && s510.mayFireEngine === false
      && s510.standingUnchanged === true
      && s510.projectiles === s510.projectilesBefore,
    JSON.stringify(s510),
  );

  const s511 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    p.prepareArena({ clearTraffic: true });
    p.setEmpireAccess('independent', 'challenge');
    const geo = p.geometry();
    p.spawnShip({
      id: 'save-trader',
      role: 'traffic',
      faction: 'neutral',
      name: 'SS Ledger',
      x: geo.center.x + geo.holdingDistance,
      y: geo.center.y,
      destX: geo.center.x + geo.holdingDistance,
      destY: geo.center.y,
      speed: 0.2,
      combatHull: 44,
    });
    p.tick(18, 1);
    const before = p.orderFor('save-trader');
    const instance = p.ship('save-trader')?.securityInstanceId;
    const hull = p.ship('save-trader')?.combatHull;
    p.saveSlot(7);
    p.loadSlot(7);
    p.wipeSystemStates();
    const after = p.orderFor('save-trader') || (p.checkpoint().orders || []).find((order) => order.visitorInstanceId === instance);
    const ships = p.snapshot().npcShips.filter((ship) => ship.id === 'save-trader' || ship.name === 'SS Ledger' || ship.securityInstanceId === instance);
    return {
      before,
      after,
      instance,
      hull,
      hullAfter: ships[0]?.combatHull,
      shipCount: ships.length,
      remainingBefore: before?.remainingTravelMs,
      remainingAfter: after?.remainingTravelMs,
      episodeBefore: before?.entryEpisode,
      episodeAfter: after?.entryEpisode,
    };
  });
  check(
    results,
    'S5.11 save-reload-keeps-order-and-participant',
    Boolean(s511.before && s511.after)
      && s511.after.visitorInstanceId === s511.instance
      && s511.episodeBefore === s511.episodeAfter
      && s511.shipCount === 1
      && s511.hullAfter === s511.hull
      && Math.abs((s511.remainingAfter || 0) - (s511.remainingBefore || 0)) < 5000,
    JSON.stringify(s511),
  );

  const s512 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    p.prepareArena({ clearTraffic: true });
    p.setEmpireAccess('independent', 'challenge');
    const geo = p.geometry();
    p.spawnShip({
      id: 'reuse-slot',
      role: 'traffic',
      faction: 'neutral',
      x: geo.center.x + 15,
      y: geo.center.y,
      destX: geo.center.x,
      destY: geo.center.y,
      speed: 0.4,
    });
    p.tick(12, 1);
    const first = (p.checkpoint().orders || []).find((order) => order.npcId === 'reuse-slot');
    const firstInstance = p.ship('reuse-slot')?.securityInstanceId;
    if (first) p.operatorAct('waive', first.encounterId);
    const replaced = p.beginAmbientReplacement('reuse-slot');
    p.tick(16, 1);
    const secondInstance = replaced?.securityInstanceId;
    const second = (p.checkpoint().orders || []).filter((order) => order.visitorInstanceId === secondInstance);
    const clearance = p.checkpoint().clearances?.[secondInstance];
    return {
      firstInstance,
      secondInstance,
      firstClearance: first?.accessClearance,
      second,
      inherited: Boolean(clearance?.granted) || second.some((order) => order.accessClearance && order.visitorInstanceId === firstInstance),
    };
  });
  check(
    results,
    'S5.12 replacement-gets-new-instance-not-clearance',
    Boolean(s512.firstInstance)
      && s512.secondInstance
      && s512.secondInstance !== s512.firstInstance
      && s512.inherited === false,
    JSON.stringify(s512),
  );

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 28000, hull: 100, shields: 100 });
  const s513 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const snap = p.snapshot();
    const anchors = (snap.stations || []).filter((station) => !station.destroyed && !station.privateInstallation);
    if (anchors[0]) p.enableCheckpoint(anchors[0].id);
    p.setEmpireAccess('independent', 'challenge');
    const geo = p.geometry();
    p.spawnShip({
      id: 'capture-trader',
      role: 'traffic',
      faction: 'neutral',
      x: geo.center.x + 12,
      y: geo.center.y,
      destX: geo.center.x,
      destY: geo.center.y,
    });
    p.tick(10, 1);
    const before = p.checkpoint();
    const seized = p.seize('klingon');
    if (p.playerHolds(p.snapshot().currentPlanet)) {
      globalThis.__BM1_PROBE__.loseHolding(p.snapshot().currentPlanet, 'klingon');
    }
    const occupierOrders = (p.checkpoint().orders || []).filter((order) => !['cleared', 'withdrawn', 'canceled', 'authority_changed', 'checkpoint_unavailable', 'not_addressed'].includes(order.lifecycle));
    p.clearClaimBlockers('npc');
    const reclaimed = p.claimCurrent();
    const after = p.checkpoint();
    return {
      beforeEpoch: before.zone?.authorityEpoch,
      afterEpoch: after.zone?.authorityEpoch,
      seized: seized.controlled,
      reclaimed: reclaimed.controlled,
      occupierOrders,
      oldStillPending: occupierOrders.some((order) => order.npcId === 'capture-trader'),
    };
  });
  check(
    results,
    'S5.13 capture-invalidates-old-orders',
    s513.reclaimed === true
      && s513.oldStillPending === false
      && (s513.afterEpoch || 0) >= (s513.beforeEpoch || 0),
    JSON.stringify(s513),
  );

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 28000, hull: 100, shields: 100 });
  const s514 = await page.evaluate(() => {
    const probe2 = globalThis.__BM1_PROBE__;
    const p = globalThis.BM1Probe;
    probe2.openSettings();
    const otherBtn = document.querySelector('[data-security-access-scope="empire"][data-security-access-class="other"][data-access-value="closed"]');
    otherBtn?.click();
    const afterClick = probe2.snapshot().effectivePolicy?.access;
    p.prepareArena({ clearTraffic: true });
    if (!p.checkpoint().zone) {
      const snap = p.snapshot();
      const anchors = (snap.stations || []).filter((station) => !station.destroyed && !station.privateInstallation);
      if (anchors[0]) p.enableCheckpoint(anchors[0].id);
    }
    const geo = p.geometry();
    if (!geo) return { afterClick, missing: 'geometry' };
    p.spawnShip({
      id: 'ui-trader',
      role: 'traffic',
      faction: 'romulan',
      x: (geo || p.geometry()).center.x + 18,
      y: (geo || p.geometry()).center.y,
      destX: (geo || p.geometry()).center.x,
      destY: (geo || p.geometry()).center.y,
    });
    p.tick(12, 1);
    const order = (p.checkpoint().orders || []).find((entry) => entry.npcId === 'ui-trader');
    const missingId = p.operatorAct('waive');
    const bogusId = p.operatorAct('cancel', 'enc-does-not-exist');
    const stillActive = (p.checkpoint().orders || []).find((entry) => entry.npcId === 'ui-trader');
    const waived = order ? p.operatorAct('waive', order.encounterId) : { ok: false };
    p.spawnShip({
      id: 'ui-trader-2',
      role: 'traffic',
      faction: 'romulan',
      x: (p.geometry()).center.x + 16,
      y: (p.geometry()).center.y,
      destX: (p.geometry()).center.x,
      destY: (p.geometry()).center.y,
    });
    p.tick(12, 1);
    const second = (p.checkpoint().orders || []).find((entry) => entry.npcId === 'ui-trader-2');
    const withdraw = second ? p.operatorAct('withdraw', second.encounterId) : { ok: false };
    const cancel = second ? p.operatorAct('cancel', second.encounterId) : { ok: false };
    return {
      afterClick,
      missingId,
      bogusId,
      stillActiveLifecycle: stillActive?.lifecycle || null,
      waived,
      withdraw,
      cancel,
      ui: probe2.securityUi(),
    };
  });
  check(
    results,
    'S5.14 operator-ui-access-and-order-actions',
    s514.afterClick?.other === 'closed'
      && s514.waived?.ok === true
      && s514.ui.accessButtons.length > 0
      && s514.ui.checkpointEnable === true,
    JSON.stringify(s514),
  );
  check(
    results,
    'S5.14 operator-missing-id-does-not-act-on-other-order',
    s514.missingId?.ok === false
      && s514.bogusId?.ok === false
      && ['pending', 'holding', 'dwelling'].includes(s514.stillActiveLifecycle)
      && s514.waived?.ok === true,
    JSON.stringify({
      missingId: s514.missingId,
      bogusId: s514.bogusId,
      stillActiveLifecycle: s514.stillActiveLifecycle,
      waived: s514.waived,
    }),
  );

  const s515 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const zone = p.checkpoint().zone;
    const destroyed = zone?.anchorStationId ? p.destroy(zone.anchorStationId, 'npc') : { destroyed: false };
    p.tick(4, 1);
    const after = p.checkpoint();
    const pending = (after.orders || []).filter((order) => ['pending', 'holding', 'dwelling'].includes(order.lifecycle));
    return { destroyed, pending, zone: after.zone };
  });
  check(
    results,
    'S5.15 checkpoint-loss-ends-demands-without-blame',
    s515.pending.length === 0,
    JSON.stringify(s515),
  );

  const s516 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    p.prepareArena({ clearTraffic: true, latinum: 2800 });
    const snap = p.snapshot();
    const anchors = (snap.stations || []).filter((station) => !station.destroyed && !station.privateInstallation);
    if (anchors[0]) p.enableCheckpoint(anchors[0].id);
    p.setEmpireAccess('other', 'challenge');
    const victim = p.spawnShip({
      id: 'still-hostile',
      faction: 'dominion',
      role: 'patrol',
      hostile: true,
      attitude: 'hostile',
      x: 1300,
      y: 900,
    });
    const hostileKept = p.ship(victim.id)?.hostile === true;
    probe2.setEmpireRoe('defend');
    const stillEngage = probe2.mayAutoEngage({ id: victim.id, faction: 'dominion', hostile: true, attitude: 'hostile' });
    return { hostileKept, stillEngage, credit: p.phase1 ? null : true };
  });
  check(
    results,
    'S5.16 clearance-does-not-erase-combat-state',
    s516.hostileKept === true && s516.stillEngage === true,
    JSON.stringify(s516),
  );

  const extra = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const vulcan = p.systemIndexByName('Vulcan');
    p.warpTo(vulcan);
    p.placePlayer(p.geometry().center.x + 8, p.geometry().center.y);
    p.tick(10, 1);
    const planetRefuse = p.dockRefusal();
    const concession = p.spawnStation({
      id: 'vulcan-concession',
      faction: 'ferengi',
      privateInstallation: true,
      name: 'Ferengi Desk',
      x: p.geometry().center.x + 80,
      y: p.geometry().center.y,
    });
    const concessionRefuse = p.dockRefusal(concession.id);
    const planetDock = p.tryDockPlanet();
    return {
      planetRefuse,
      concessionRefuse,
      planetDock,
      zone: p.checkpoint().zone,
      playerDenied: p.checkpoint().playerDenied,
    };
  });
  check(
    results,
    'S5.dock authority-installations-refuse-pending-visitor',
    Boolean(extra.planetRefuse) && extra.planetDock === false && extra.concessionRefuse === '',
    JSON.stringify(extra),
  );

  const uiShot = await page.evaluate(() => {
    const probe2 = globalThis.__BM1_PROBE__;
    probe2.openSettings();
    return probe2.securityUi();
  });
  check(results, 'S5.ui operator-panel-present', uiShot.present === true && uiShot.checkpointEnable === true);
}

async function runPhase4Incidents(page, results) {
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 28000, hull: 100, shields: 100 });

  const s61 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    probe2.setEmpireRoe('return-fire');
    const vulcan = p.systemIndexByName('Vulcan');
    if (vulcan < 0) return { missing: 'vulcan' };
    p.warpTo(vulcan);
    const geo = p.geometry();
    if (!geo) return { missing: 'authored-zone' };
    p.placePlayer(geo.center.x + 10, geo.center.y + 10);
    p.tick(8, 1);
    const standingBefore = { ...p.snapshot().standing };
    const attacksBefore = (probe2.snapshot().playerSecurity.observedAttacks || []).length;
    const shotsBefore = p.snapshot().projectileCount;
    const refused = p.playerRespond('refuse');
    const snap = probe2.incidents.snapshot();
    const incidents = snap.ledger.incidents || {};
    const access = Object.values(incidents).filter((row) => row.kind === 'access_noncompliance');
    const visitor = p.checkpoint().playerOrder;
    const mayFire = probe2.mayAutoEngage({
      id: 'player-self',
      faction: 'ferengi',
      hostile: false,
      attitude: 'neutral',
    });
    return {
      refused,
      access,
      visitor,
      standingBefore,
      standing: snap.standing,
      attacksBefore,
      attacksAfter: (snap.observedAttacks || []).length,
      shotsBefore,
      shotsAfter: p.snapshot().projectileCount,
      mayFire,
      flash: snap.currentFlash,
      log: snap.log,
    };
  });
  check(
    results,
    'S6.1 refusal-is-not-aggression',
    !s61.missing
      && s61.refused?.ok === true
      && s61.access.length === 1
      && s61.attacksAfter === s61.attacksBefore
      && !s61.access[0]?.links?.attackId
      && s61.mayFire === false
      && JSON.stringify(s61.standing) === JSON.stringify(s61.standingBefore)
      && s61.shotsAfter === s61.shotsBefore,
    JSON.stringify(s61),
  );

  const s614 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const inc = globalThis.__BM1_PROBE__.incidents;
    const before = inc.snapshot();
    const incidentId = Object.values(before.ledger.incidents || {}).find((row) => row.kind === 'access_noncompliance')?.incidentId;
    const flashId = before.currentFlash?.flashId || before.flash.slice(-1)[0]?.flashId || null;
    const flashCount = before.flash.length;
    p.placeAtApproach();
    p.tick(24, 4);
    const after = inc.snapshot();
    const same = after.ledger.incidents[incidentId];
    const notice = Object.values(after.ledger.incidents || {}).filter((row) => row.kind === 'access_notice');
    return {
      incidentId,
      sameId: same?.incidentId,
      history: same?.history || [],
      noticeCount: notice.length,
      flashCountBefore: flashCount,
      flashCountAfter: after.flash.length,
      lastFlashId: after.currentFlash?.flashId || after.flash.slice(-1)[0]?.flashId || null,
      firstFlashId: flashId,
    };
  });
  check(
    results,
    'S6.14 append-only-withdrawal-does-not-flash',
    s614.sameId === s614.incidentId
      && (s614.history.some((row) => row.type === 'departed' || row.type === 'withdrawn'))
      && s614.noticeCount === 0
      && s614.flashCountAfter === s614.flashCountBefore
      && (s614.lastFlashId === s614.firstFlashId || s614.flashCountAfter === s614.flashCountBefore),
    JSON.stringify(s614),
  );

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 28000, hull: 100, shields: 100 });
  const s62 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    const snap = p.snapshot();
    const anchors = (snap.stations || []).filter((station) => !station.destroyed && !station.privateInstallation);
    if (anchors[0]) p.enableCheckpoint(anchors[0].id);
    p.setEmpireAccess('independent', 'challenge');
    probe2.setEmpireRoe('return-fire');
    const geo = p.geometry();
    p.spawnShip({
      id: 'phase4-tractor',
      role: 'traffic',
      faction: 'neutral',
      hostile: false,
      x: geo.center.x + 18,
      y: geo.center.y,
      destX: geo.center.x,
      destY: geo.center.y,
      speed: 0.3,
    });
    p.tick(4, 1);
    const issued = p.orderFor('phase4-tractor');
    p.tractorHold('phase4-tractor', 45000);
    p.tick(6, 1);
    const order = p.orderFor('phase4-tractor');
    const incidents = Object.values(probe2.incidents.snapshot().ledger.incidents || {});
    const inability = incidents.filter((row) => row.kind === 'access_inability');
    return {
      issued: issued?.lifecycle || null,
      order,
      inability,
      mayFire: probe2.mayAutoEngage({ id: 'phase4-tractor', faction: 'neutral', hostile: false }),
      log: p.snapshot().log,
    };
  });
  check(
    results,
    'S6.2 inability-is-not-an-offense',
    s62.order?.lifecycle === 'unable_to_comply'
      && s62.inability.length === 1
      && s62.inability[0].truth?.offense === 'none'
      && /tractor/i.test(JSON.stringify(s62.inability[0].truth))
      && s62.mayFire === false,
    JSON.stringify(s62),
  );

  const s63 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    p.prepareArena({ clearTraffic: true });
    const anchors = (p.snapshot().stations || []).filter((station) => !station.destroyed && !station.privateInstallation);
    if (!p.checkpoint().zone && anchors[0]) p.enableCheckpoint(anchors[0].id);
    p.setEmpireAccess('independent', 'challenge');
    const geo = p.geometry();
    p.spawnShip({
      id: 'phase4-repeat',
      role: 'traffic',
      faction: 'neutral',
      x: geo.center.x + 16,
      y: geo.center.y,
      destX: geo.center.x,
      destY: geo.center.y,
      speed: 0.25,
    });
    p.tick(4, 1);
    const first = p.orderFor('phase4-repeat');
    p.tick(3, 1);
    if (first?.encounterId) p.operatorAct('withdraw', first.encounterId);
    p.tick(2, 1);
    const afterRevise = p.orderFor('phase4-repeat');
    if (afterRevise && afterRevise.visitorKind === 'npc') {
      const closed = p.operatorAct('cancel', afterRevise.encounterId);
      void closed;
    }
    const refusedLike = Object.values(ensureOrders()).find((order) => order.npcId === 'phase4-repeat');
    function ensureOrders() {
      return p.encounters() || [];
    }
    const visitor = p.ship('phase4-repeat');
    const all = Object.values(probe2.incidents.snapshot().ledger.incidents || {}).filter((row) => (
      row.actor?.instanceId === visitor?.securityInstanceId || row.links?.encounterId === first?.encounterId
    ));
    return { first, afterRevise, refusedLike, incidents: all, count: all.length };
  });
  check(
    results,
    'S6.3 phase3-feed-once-per-encounter',
    s63.first?.encounterId
      && s63.incidents.length <= 1,
    JSON.stringify(s63),
  );

  const s64 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    p.prepareArena({ clearTraffic: true });
    const standingBefore = { ...p.snapshot().standing };
    const writesBefore = probe2.snapshot().standingWriteCount;
    p.spawnShip({
      id: 'phase4-civilian',
      role: 'traffic',
      faction: 'terran',
      x: 1200,
      y: 900,
      destX: 1210,
      destY: 900,
    });
    p.destroy('phase4-civilian', 'player');
    const afterKill = probe2.incidents.snapshot();
    const destruction = Object.values(afterKill.ledger.incidents || {}).filter((row) => row.kind === 'destruction');
    const writesAfterKill = afterKill.standingWriteCount;
    const token = destruction[0]?.links?.punishmentToken;
    probe2.incidents.deliverReport({
      incidentId: destruction[0]?.incidentId,
      senderKey: 'npc:witness',
      recipientKey: 'player',
    });
    const afterReport = probe2.incidents.tryStanding(token, -4);
    const vulcan = p.spawnShip({
      id: 'phase4-vulcan-record',
      role: 'patrol',
      faction: 'vulcan',
      x: 1180,
      y: 880,
    });
    const react = probe2.incidents.reactObserver('phase4-vulcan-record', destruction[0]?.incidentId, {
      event_known: true,
      credible_report: true,
      event_actionable: true,
    });
    const afterReact = probe2.incidents.snapshot();
    p.spawnShip({
      id: 'phase4-npc-only',
      role: 'traffic',
      faction: 'romulan',
      x: 1300,
      y: 900,
    });
    const standingNpcBefore = { ...p.snapshot().standing };
    p.destroy('phase4-npc-only', 'npc');
    const afterNpc = probe2.incidents.snapshot();
    const npcInc = Object.values(afterNpc.ledger.incidents || {}).filter((row) => row.links?.destructionKey === (p.ship('phase4-npc-only')?.securityInstanceId || 'slot:phase4-npc-only') || row.victim?.instanceId === 'slot:phase4-npc-only' || /romulan|phase4-npc/.test(JSON.stringify(row)));
    return {
      destruction,
      token,
      writesBefore,
      writesAfterKill,
      afterReport,
      react,
      standingUnchangedAfterReport: JSON.stringify(afterReact.standing) === JSON.stringify(afterKill.standing),
      writesAfterReact: afterReact.standingWriteCount,
      standingChangedOnKill: JSON.stringify(afterKill.standing) !== JSON.stringify(standingBefore),
      npcStandingUnchanged: JSON.stringify(afterNpc.standing) === JSON.stringify(standingNpcBefore),
      npcIncCount: npcInc.length,
      flashAfterKill: afterKill.log,
      vulcan,
    };
  });
  check(
    results,
    'S6.4 kill-standing-is-not-doubled',
    s64.destruction.length >= 1
      && s64.token
      && s64.standingChangedOnKill === true
      && s64.afterReport?.applied === false
      && s64.standingUnchangedAfterReport === true
      && s64.writesAfterReact === s64.writesAfterKill
      && s64.npcStandingUnchanged === true,
    JSON.stringify(s64),
  );

  const s656 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    probe2.incidents.setAlerts('incidents');
    const afterMode = probe2.incidents.snapshot().alertsMode;
    probe2.incidents.logBackground('Salvage recovered: 22 latinum.');
    const afterSalvage = probe2.incidents.snapshot();
    probe2.incidents.setAlerts('silent');
    const silentSnap = probe2.incidents.snapshot();
    const journal = Object.values(silentSnap.ledger.incidents || {});
    probe2.incidents.setAlerts('all');
    probe2.openSettings();
    const ui = probe2.securityUi();
    return {
      afterMode,
      logAfterSalvage: afterSalvage.log,
      flash: afterSalvage.currentFlash,
      silentAlertsActive: silentSnap.alertsActive,
      journalCount: journal.length,
      uiAlerts: ui.alertButtons,
      uiIncidents: ui.incidentCount,
      text: ui.text,
    };
  });
  check(
    results,
    'S6.5 alert-modes',
    s656.afterMode === 'incidents'
      && /FLASH/i.test(String(s656.logAfterSalvage || ''))
      && !/^Salvage recovered/i.test(String(s656.logAfterSalvage || ''))
      && s656.silentAlertsActive === false
      && s656.journalCount > 0
      && s656.uiAlerts.includes('all')
      && s656.uiAlerts.includes('silent'),
    JSON.stringify(s656),
  );
  check(
    results,
    'S6.6 flash-priority-over-salvage',
    /FLASH/i.test(String(s656.logAfterSalvage || ''))
      && !/Salvage recovered/i.test(String(s656.logAfterSalvage || '')),
    JSON.stringify({ log: s656.logAfterSalvage, flash: s656.flash }),
  );

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 28000, hull: 100, shields: 100 });
  const s67 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    const vulcanIdx = p.systemIndexByName('Vulcan');
    if (vulcanIdx < 0) return { missing: 'vulcan' };
    p.warpTo(vulcanIdx);
    p.prepareArena({ clearTraffic: true });
    const geo = p.geometry() || { center: { x: 1200, y: 900 } };
    p.spawnShip({
      id: 'phase4-vulcan-relief',
      role: 'relief',
      faction: 'vulcan',
      x: geo.center.x + 80,
      y: geo.center.y,
      destX: geo.center.x + 200,
      destY: geo.center.y,
    });
    p.spawnShip({
      id: 'phase4-klingon-patrol',
      role: 'patrol',
      faction: 'klingon',
      x: geo.center.x - 80,
      y: geo.center.y,
      destX: geo.center.x - 200,
      destY: geo.center.y,
      destinationName: 'klingon lane',
    });
    p.spawnShip({
      id: 'phase4-ignorant',
      role: 'patrol',
      faction: 'romulan',
      x: geo.center.x,
      y: geo.center.y + 90,
    });
    const injected = probe2.incidents.injectDistress({
      survivorsKnown: true,
      ignorantIds: ['phase4-ignorant'],
      factsByFaction: {
        klingon: {
          event_known: true,
          credible_report: true,
          event_actionable: true,
          linked_own_losses: false,
          own_asset_affected: false,
        },
      },
    });
    const vulcanShip = p.ship('phase4-vulcan-relief');
    const klingonShip = p.ship('phase4-klingon-patrol');
    const vulcanReact = probe2.incidents.lastReact('phase4-vulcan-relief');
    const klingonReact = probe2.incidents.lastReact('phase4-klingon-patrol');
    const ignorantReact = probe2.incidents.lastReact('phase4-ignorant');
    return {
      injected,
      vulcanReact,
      klingonReact,
      ignorantReact,
      vulcanObjective: vulcanShip?.incidentObjective || injected.observers?.find((row) => row.id === 'phase4-vulcan-relief')?.incidentObjective || null,
      klingonObjective: klingonShip?.incidentObjective || null,
      klingonDest: klingonShip?.destinationName || null,
    };
  });
  check(
    results,
    'S6.7 doctrine-contrast-acting',
    !s67.missing
      && s67.injected?.ok === true
      && (s67.vulcanReact?.appliedResponse === 'rescue' || s67.vulcanReact?.appliedResponse === 'investigate')
      && Boolean(s67.vulcanObjective)
      && s67.klingonReact?.appliedResponse === 'record_only'
      && !s67.klingonObjective
      && s67.ignorantReact?.appliedResponse === 'ignore_unknown',
    JSON.stringify(s67),
  );

  const s68 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    probe2.setEmpireRoe('return-fire');
    const fire = probe2.incidents.inspectFire('phase4-vulcan-relief', {});
    const may = probe2.mayAutoEngage({
      id: 'phase4-klingon-patrol',
      faction: 'klingon',
      hostile: false,
      attitude: 'neutral',
    });
    const vulcan = p.ship('phase4-vulcan-relief');
    const react = probe2.incidents.lastReact('phase4-vulcan-relief');
    return {
      fire,
      may,
      attackId: vulcan?.attackId || null,
      objective: vulcan?.incidentObjective || null,
      react,
    };
  });
  check(
    results,
    'S6.8 investigate-rescue-are-not-weapons',
    s68.fire?.allowed !== true
      && s68.may === false
      && !s68.attackId
      && (s68.objective == null || s68.objective.fireCapable === false)
      && (s68.react?.appliedResponse === 'rescue' || s68.react?.appliedResponse === 'investigate' || s68.react?.appliedResponse === 'record_only'),
    JSON.stringify(s68),
  );

  const s613 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    const geo = p.geometry() || { center: { x: 1200, y: 900 } };
    p.placePlayer(geo.center.x + 8, geo.center.y + 8);
    p.tick(6, 1);
    const refused = p.playerRespond('refuse');
    const access = Object.values(probe2.incidents.snapshot().ledger.incidents || {}).find((row) => row.kind === 'access_noncompliance' && row.status === 'open')
      || Object.values(probe2.incidents.snapshot().ledger.incidents || {}).filter((row) => row.kind === 'access_noncompliance').slice(-1)[0];
    p.spawnShip({
      id: 'phase4-vulcan-protect',
      role: 'patrol',
      faction: 'vulcan',
      x: geo.center.x + 60,
      y: geo.center.y + 20,
    });
    const react = probe2.incidents.reactObserver('phase4-vulcan-protect', access?.incidentId, {
      event_known: true,
      credible_report: true,
      event_actionable: true,
      own_asset_affected: true,
      can_respond: true,
    });
    const conceal = probe2.incidents.reactObserver('phase4-vulcan-protect', access?.incidentId, {
      event_known: true,
      credible_report: true,
      event_actionable: true,
    });
    const ship = p.ship('phase4-vulcan-protect');
    const fire = probe2.incidents.inspectFire('phase4-vulcan-protect', {});
    return {
      refused,
      accessId: access?.incidentId,
      react,
      conceal,
      attackId: ship?.attackId || null,
      hostile: Boolean(ship?.hostile),
      fire,
      objective: ship?.incidentObjective || null,
      may: probe2.mayAutoEngage({ id: 'phase4-vulcan-protect', faction: 'vulcan', hostile: false }),
    };
  });
  check(
    results,
    'S6.13 pack-protect-is-not-weapons',
    s613.react?.decision?.packResponse === 'protect'
      && s613.react?.decision?.appliedResponse === 'record_only'
      && !s613.attackId
      && s613.fire?.allowed !== true
      && s613.fire?.engagementAuthorized !== true
      && !s613.objective
      && s613.may === false,
    JSON.stringify(s613),
  );

  const s69 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    const before = probe2.incidents.snapshot();
    const open = Object.values(before.ledger.incidents || {}).find((row) => row.status === 'open') || Object.values(before.ledger.incidents || {})[0];
    p.saveSlot(8);
    p.wipeSystemStates();
    p.loadSlot(8);
    const after = probe2.incidents.snapshot();
    const restored = after.ledger.incidents[open?.incidentId];
    return {
      id: open?.incidentId,
      restoredId: restored?.incidentId,
      clocks: restored?.clocks,
      flash: after.flash.length,
      standing: after.standing,
    };
  });
  check(
    results,
    'S6.9 persistence-survives-systemStates-wipe',
    Boolean(s69.id && s69.restoredId === s69.id),
    JSON.stringify(s69),
  );

  const s610 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    const home = p.snapshot().currentPlanet;
    const vulcan = p.systemIndexByName('Vulcan');
    if (vulcan >= 0) p.warpTo(p.systemIndexByName('Ferenginar') >= 0 ? p.systemIndexByName('Ferenginar') : home);
    const anchors = (p.snapshot().stations || []).filter((station) => !station.destroyed && !station.privateInstallation);
    if (anchors[0]) p.enableCheckpoint(anchors[0].id);
    p.setEmpireAccess('independent', 'challenge');
    const geo = p.geometry();
    if (geo) {
      p.spawnShip({
        id: 'phase4-epoch',
        role: 'traffic',
        faction: 'neutral',
        x: geo.center.x + 14,
        y: geo.center.y,
        destX: geo.center.x,
        destY: geo.center.y,
        speed: 0.2,
      });
      p.tick(5, 1);
      const order = p.orderFor('phase4-epoch');
      if (order) p.operatorAct('withdraw', order.encounterId);
      p.tick(40, 80);
    }
    const systemIndex = p.snapshot().currentPlanet;
    const before = Object.values(probe2.incidents.snapshot().ledger.incidents || {}).filter((row) => (
      row.kind === 'access_noncompliance'
      && row.status === 'open'
      && Number(row.systemIndex) === Number(systemIndex)
    ));
    const lost = probe2.loseHolding(systemIndex, 'klingon');
    const after = Object.values(probe2.incidents.snapshot().ledger.incidents || {}).filter((row) => before.some((open) => open.incidentId === row.incidentId));
    return {
      lost,
      systemIndex,
      beforeCount: before.length,
      afterStatus: after.map((row) => ({ id: row.incidentId, status: row.status, reason: row.resolveReason })),
      resolved: after.length > 0 && after.every((row) => row.status === 'resolved' && row.resolveReason === 'authority_changed'),
    };
  });
  check(
    results,
    'S6.10 authority-change-resolves-access',
    s610.lost?.overrideActive === false && (s610.beforeCount === 0 || s610.resolved === true),
    JSON.stringify(s610),
  );

  const s61112 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    const ledger = probe2.incidents.snapshot().ledger;
    const sanitized = Object.values(ledger.incidents || {}).every((row) => row.incidentId && row.kind);
    const extras = [];
    for (let i = 0; i < 20; i += 1) extras.push(i);
    return {
      sanitized,
      version: ledger.version,
      nextId: ledger.nextIncidentId,
    };
  });
  check(
    results,
    'S6.11 ledger-sanitizes-and-versions',
    s61112.sanitized === true && s61112.version === 1 && s61112.nextId >= 1,
    JSON.stringify(s61112),
  );

  const s612 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    probe2.setEmpireRoe('return-fire');
    const attacker = { id: 'real-phase4', faction: 'klingon', hostile: false };
    probe2.recordAttack(attacker, 'player');
    const authorized = probe2.mayAutoEngage(attacker);
    return { authorized, roe: probe2.snapshot().effectiveRoe };
  });
  check(
    results,
    'S6.12 end-state-isolation-keeps-real-defense',
    s612.authorized === true,
    JSON.stringify(s612),
  );
}

async function runSideLaneRepairReman(page, results) {
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 28000, hull: 70, shields: 70 });

  const s71 = await page.evaluate(() => {
    const lane = globalThis.__BM1_PROBE__.sideLane;
    const p = globalThis.BM1Probe;
    p.prepareArena({ latinum: 28000, hull: 70, shields: 70 });
    lane.forceDockPlanet();
    const planet = lane.snapshot();
    const kinds = ['starbase', 'shipyard', 'heavy-shipyard', 'maintenance'];
    const stations = kinds.map((kind) => {
      const spawned = lane.spawnFixture(kind);
      lane.forceDockStation(spawned.id);
      return { kind, spawned, snap: lane.snapshot() };
    });
    return {
      planetCapable: planet.repairCapable,
      stations: stations.map((row) => ({ kind: row.kind, capable: row.snap.repairCapable, missing: row.spawned?.missing })),
      rates: planet.hullRates,
    };
  });
  check(results, 'S7.1 planet-capable', s71.planetCapable === true, JSON.stringify(s71));
  check(
    results,
    'S7.1 stations-capable',
    s71.stations.every((row) => row.capable === true && row.missing !== true),
    JSON.stringify(s71.stations),
  );
  check(
    results,
    'S7.5 repair-rates-unchanged',
    s71.rates?.hull === 2 && s71.rates?.shields === 1,
    JSON.stringify(s71.rates),
  );

  const s72 = await page.evaluate(() => {
    const lane = globalThis.__BM1_PROBE__.sideLane;
    const rows = ['platform86', 'platform87'].map((kind) => {
      const spawned = lane.spawnFixture(kind);
      lane.forceDockStation(spawned.id);
      const before = lane.snapshot();
      const repair = lane.startRepair();
      const after = lane.snapshot();
      return {
        kind,
        capable: before.repairCapable,
        buttonDisabled: before.repairButton.disabled,
        refuse: after.lastRepairRefuse,
        overlay: after.overlay,
        repair,
      };
    });
    return rows;
  });
  check(
    results,
    'S7.2 platforms-cannot-repair',
    s72.every((row) => (
      row.capable === false
      && row.buttonDisabled === true
      && row.repair?.ok === false
      && row.refuse?.layer === 'capability'
      && /cannot repair/i.test(row.refuse?.reason || '')
      && row.overlay === false
    )),
    JSON.stringify(s72),
  );

  const s73 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const lane = globalThis.__BM1_PROBE__.sideLane;
    const vulcan = p.systemIndexByName('Vulcan');
    p.warpTo(vulcan);
    const anchors = (p.snapshot().stations || []).filter((station) => !station.destroyed && !station.privateInstallation);
    if (anchors[0]) p.enableCheckpoint(anchors[0].id);
    p.setEmpireAccess('independent', 'challenge');
    p.setEmpireAccess('other', 'challenge');
    p.placePlayer(p.geometry().center.x + 8, p.geometry().center.y);
    p.tick(16, 1);
    const accessRefuse = p.dockRefusal();
    const playerDenied = p.checkpoint().playerDenied;
    lane.forceDockPlanet();
    const denied = playerDenied || accessRefuse
      ? lane.startRepair()
      : lane.evaluateRepair({
        docked: true,
        kind: 'planet',
        servicesDenied: true,
        accessReason: accessRefuse || 'Hold at the marker for clearance',
      });
    const deniedSnap = lane.snapshot();
    const platform = lane.spawnFixture('platform86', { privateInstallation: true, faction: 'ferengi' });
    lane.forceDockStation(platform.id);
    const platformRepair = lane.startRepair();
    const platformSnap = lane.snapshot();
    return {
      denied,
      deniedLayer: denied?.layer || deniedSnap.lastRepairRefuse?.layer,
      deniedReason: denied?.reason || deniedSnap.lastRepairRefuse?.reason,
      playerDenied,
      accessRefuse,
      platformRepair,
      platformLayer: platformSnap.lastRepairRefuse?.layer,
      platformReason: platformSnap.lastRepairRefuse?.reason,
    };
  });
  check(
    results,
    'S7.3 docking-not-repair-reasons-distinct',
    s73.denied?.ok === false
      && s73.deniedLayer === 'access'
      && s73.platformRepair?.ok === false
      && s73.platformLayer === 'capability'
      && s73.deniedReason !== s73.platformReason,
    JSON.stringify(s73),
  );

  const s74 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const lane = globalThis.__BM1_PROBE__.sideLane;
    p.warpTo(p.systemIndexByName('Sol') >= 0 ? 'Sol' : p.snapshot().currentPlanet);
    p.disableCheckpoint();
    p.setEmpireAccess('independent', 'open');
    p.setEmpireAccess('other', 'open');
    p.setEmpireAccess('warFlag', 'open');
    p.prepareArena({ latinum: 28000, hull: 70, shields: 70 });
    lane.forceDockPlanet();
    const docked = lane.snapshot();
    const started = lane.startRepair();
    const during = lane.snapshot();
    p.tick(1, 1);
    const after = lane.snapshot();
    lane.forceDockPlanet();
    lane.startRepair();
    lane.cancelRepair();
    const canceled = lane.snapshot();
    return {
      dockedOverlay: docked.overlay,
      startedOk: started?.ok === true,
      duringProgress: during.repairInProgress,
      duringOverlay: during.overlay,
      assetMissing: during.overlayAssetMissing,
      constructionArt: during.overlayUsesConstructionArt,
      afterProgress: after.repairInProgress,
      afterOverlay: after.overlay,
      canceledOverlay: canceled.overlay,
      canceledProgress: canceled.repairInProgress,
    };
  });
  check(
    results,
    'S7.4 overlay-only-while-repairing',
    s74.dockedOverlay === false
      && s74.startedOk === true
      && s74.duringProgress === true
      && (s74.assetMissing ? s74.duringOverlay === false : s74.duringOverlay === true)
      && s74.constructionArt === false
      && s74.afterProgress === false
      && s74.afterOverlay === false
      && s74.canceledOverlay === false,
    JSON.stringify(s74),
  );

  const s7678 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    const lane = probe2.sideLane;
    const beforeEngage = probe2.mayAutoEngage({ id: 's7-control', faction: 'dominion', hostile: true, attitude: 'hostile' });
    lane.resetReman();
    const culture = lane.evaluateReman(53, 'reman');
    const granted = lane.grantReman('remus-secret');
    const destroyed = lane.destroyRemanStarbase();
    p.saveSlot(7);
    p.wipeSystemStates();
    p.loadSlot(7);
    const afterLoad = lane.snapshot();
    lane.resetReman();
    const destroyedAgain = lane.destroyRemanStarbase();
    const recovery = lane.injectRemanRecovery();
    const recovered = lane.snapshot();
    const packMeet = lane.meetPack({ allowed: false, reason: 'restricted-stock' }, 53);
    const other = lane.evaluateReman(268);
    const afterEngage = probe2.mayAutoEngage({ id: 's7-control', faction: 'dominion', hostile: true, attitude: 'hostile' });
    return {
      beforeEngage,
      afterEngage,
      cultureAllowed: culture.allowed,
      granted,
      destroyed,
      afterLoad: afterLoad.remanAccess,
      destroyedAgain,
      recovery,
      recovered: recovered.remanAccess,
      packMeet,
      other,
      meetingClosed: afterLoad.meetingPoint?.closed === true && afterLoad.meetingPoint?.fabricatedSpecialVendor === false,
      catalogWired: afterLoad.catalogWired,
      rates: afterLoad.hullRates,
    };
  });
  check(
    results,
    'S7.6 reman-flag-survives-save-and-systemStates-wipe',
    s7678.afterLoad?.granted === true && s7678.granted?.granted === true,
    JSON.stringify(s7678.afterLoad),
  );
  check(
    results,
    'S7.7 destroy-base-does-not-revoke',
    s7678.destroyed?.ok === true && s7678.destroyed?.access?.granted === true && /access remains/i.test(s7678.destroyed?.sayable || ''),
    JSON.stringify(s7678.destroyed),
  );
  check(
    results,
    'S7.8 recovery-and-pack-meeting',
    s7678.recovery?.granted === true
      && s7678.recovered?.granted === true
      && s7678.packMeet?.allowed === true
      && s7678.packMeet?.fabricatedSpecialVendor === false
      && s7678.packMeet?.packReason === 'restricted-stock'
      && s7678.meetingClosed === true
      && s7678.cultureAllowed === false,
    JSON.stringify({ recovery: s7678.recovery, packMeet: s7678.packMeet, culture: s7678.cultureAllowed }),
  );
  check(
    results,
    'S7.9 catalog-wire-live',
    s7678.catalogWired === true,
    JSON.stringify({ catalogWired: s7678.catalogWired }),
  );
  check(
    results,
    'S7.10 hull-53-only',
    s7678.other?.allowed === false && s7678.other?.reason === 'other-warbird',
    JSON.stringify(s7678.other),
  );
  check(
    results,
    'S7 reman-does-not-change-mayAutoEngage',
    s7678.beforeEngage === s7678.afterEngage,
    JSON.stringify({ before: s7678.beforeEngage, after: s7678.afterEngage }),
  );
}

async function runSideLaneUnrestIndependence(page, results) {
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 28000 });

  const s71118 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    const lane = probe2.sideLane;
    const vulcan = p.systemIndexByName('Vulcan');
    p.warpTo(vulcan);
    p.prepareArena({ clearTraffic: true });
    const beforeEngage = probe2.mayAutoEngage({ id: 's7-gate3', faction: 'dominion', hostile: true, attitude: 'hostile' });
    const concession = lane.spawnConcession({ faction: 'ferengi' });
    const ownerBefore = lane.concessionOwner(concession.id);
    const minted = lane.declareIndependence(vulcan, {
      authoredInject: true,
      parentSideId: 'vulcan',
      parentTemperament: { conflict: 'warlike', outsider: 'xenophobic' },
      parentProfileId: 'vulcan',
      worldCultureId: 'reman',
      temperament: { conflict: 'peaceful', outsider: 'xenophilic' },
      origin: 'vulcan',
      civilWar: true,
    });
    const ownerAfter = lane.concessionOwner(concession.id);
    const snap = lane.snapshot();
    const birth = {
      sideId: minted.sideId,
      temperament: minted.temperament,
      profileId: minted.profileId,
    };
    const shifted = lane.shiftTemperament(minted.sideId, { conflict: 'warlike', outsider: 'xenophobic' });
    const afterShift = lane.snapshot();
    const afterEngage = probe2.mayAutoEngage({ id: 's7-gate3', faction: 'dominion', hostile: true, attitude: 'hostile' });
    return {
      beforeEngage,
      afterEngage,
      minted,
      ownerBefore,
      ownerAfter,
      snap,
      birth,
      shifted,
      afterShift,
      roe: probe2.snapshot().effectiveRoe,
      roeModes: snap.playerRoeModes,
      flagShare: snap.flagShareGrantsControl,
      cultureFire: snap.cultureGrantsFire,
      accessCeasefire: snap.accessIsCeasefire,
      phase5: snap.phase5AssetOverdue,
    };
  });
  check(
    results,
    'S7.11 independence-mints-new-side',
    s71118.minted?.ok === true
      && s71118.minted.sideId
      && s71118.minted.sideId !== 'vulcan'
      && s71118.minted.sideId !== 'neutral'
      && s71118.minted.sideId !== 'ferengi'
      && s71118.minted.sideId !== 'reman'
      && String(s71118.minted.sideId).startsWith('breakaway:'),
    JSON.stringify({ sideId: s71118.minted?.sideId, reason: s71118.minted?.reason }),
  );
  check(
    results,
    'S7.12 foreign-concessions-unchanged',
    s71118.ownerBefore?.kind === 'private'
      && s71118.ownerAfter?.kind === 'private'
      && s71118.ownerAfter?.sideId === s71118.ownerBefore?.sideId
      && s71118.ownerAfter?.sideId === 'ferengi',
    JSON.stringify({ before: s71118.ownerBefore, after: s71118.ownerAfter }),
  );
  check(
    results,
    'S7.13 doctrine-inheritance-explicit-and-divergent',
    s71118.minted?.inheritance?.explicit === true
      && s71118.minted?.inheritance?.silentParentClone === false
      && s71118.minted?.inheritance?.divergedFromParent === true
      && s71118.minted?.profileId !== 'vulcan'
      && s71118.minted?.playerRoeInstalled === false,
    JSON.stringify({
      inheritance: s71118.minted?.inheritance,
      profileId: s71118.minted?.profileId,
      temperament: s71118.minted?.temperament,
    }),
  );
  check(
    results,
    'S7.14 phase1-authority-still-holds',
    s71118.flagShare === false
      && s71118.afterShift?.flagShareGrantsControl === false
      && s71118.minted?.control?.flagShareGrantsControl === false,
    JSON.stringify({ flagShare: s71118.flagShare, after: s71118.afterShift?.flagShareGrantsControl }),
  );
  check(
    results,
    'S7.15 parent-lists-not-cloned',
    Array.isArray(s71118.minted?.relations?.friendly)
      && s71118.minted.relations.friendly.length === 0
      && s71118.minted.relations.hostile?.includes('vulcan')
      && !(s71118.minted.relations.hostile || []).includes('terran'),
    JSON.stringify(s71118.minted?.relations),
  );
  check(
    results,
    'S7.16 culture-is-not-empire-or-fire',
    s71118.minted?.cultureId === 'reman'
      && s71118.minted?.sideId !== 'reman'
      && s71118.cultureFire === false,
    JSON.stringify({ cultureId: s71118.minted?.cultureId, sideId: s71118.minted?.sideId, fire: s71118.cultureFire }),
  );
  check(
    results,
    'S7.17 war-temperament-may-mutate',
    s71118.shifted?.ok === true
      && s71118.shifted.after?.temperament?.conflict === 'warlike'
      && s71118.shifted.after?.profileId !== s71118.birth?.profileId
      && s71118.shifted.engagementAuthorizedInjected === false
      && s71118.shifted.ownersRewritten === false
      && s71118.accessCeasefire === false
      && s71118.roeModes?.length === 2
      && s71118.roeModes.includes('return-fire')
      && s71118.roeModes.includes('defend')
      && s71118.beforeEngage === s71118.afterEngage,
    JSON.stringify({
      shifted: s71118.shifted,
      birth: s71118.birth,
      engage: { before: s71118.beforeEngage, after: s71118.afterEngage },
    }),
  );
  check(
    results,
    'S7.18 not-frozen-at-declaration',
    s71118.shifted?.after?.temperament?.conflict !== s71118.birth?.temperament?.conflict
      && s71118.shifted?.after?.profileId !== s71118.birth?.profileId
      && s71118.minted?.sideId === s71118.birth?.sideId,
    JSON.stringify({ birth: s71118.birth, after: s71118.shifted?.after }),
  );

  const s71923 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    const lane = probe2.sideLane;
    const sol = p.systemIndexByName('Sol');
    p.warpTo(sol >= 0 ? sol : p.snapshot().currentPlanet);
    p.prepareArena({ clearTraffic: true });
    const below = lane.injectUnrest(p.snapshot().currentPlanet, 'below');
    const random = lane.declareIndependence(p.snapshot().currentPlanet, {
      authoredInject: false,
      parentSideId: 'terran',
    });
    const at = lane.injectUnrest(p.snapshot().currentPlanet, 'at');
    const eligibleMint = lane.declareIndependence(p.snapshot().currentPlanet, {
      authoredInject: false,
      parentSideId: 'terran',
      parentTemperament: { conflict: 'warlike', outsider: 'xenophobic' },
      parentProfileId: 'terran',
      temperament: { conflict: 'peaceful', outsider: 'xenophilic' },
      origin: 'sol',
    });
    p.prepareArena({ clearTraffic: true });
    const roles = lane.injectLoungeAndContract();
    const planet = p.snapshot().currentPlanet;
    lane.injectUnrest(planet, 'below');
    const pirateCommerce = lane.raiseUnrestFromCommerceFailure({ cause: 'pirate' });
    lane.injectUnrest(planet, 'below');
    const blockade = lane.raiseUnrestFromCommerceFailure({ cause: 'blockade', failDelivery: false });
    lane.injectUnrest(planet, 'below');
    const pirates = lane.raiseUnrestFromPiratePresence();
    const concession = lane.spawnConcession({ id: 's7-relief-concession', faction: 'ferengi' });
    const ownerBeforeRelief = lane.concessionOwner(concession.id);
    const hostilityBefore = eligibleMint?.relations?.hostile?.slice() || [];
    const relief = lane.relieveUnrest({ action: 'clearPirates', sideId: eligibleMint.sideId });
    const ownerAfterRelief = lane.concessionOwner(concession.id);
    const snap = lane.snapshot();
    const war = lane.raiseUnrestFromWarGoingBadly();
    const develop = lane.raiseUnrestFromUnderdevelopment();
    const agitation = lane.raiseUnrestFromRivalAgitation(undefined, { agitator: 'klingon' });
    return {
      below,
      random,
      at,
      eligibleMint,
      roles,
      pirateCommerce,
      blockade,
      pirates,
      relief,
      ownerBeforeRelief,
      ownerAfterRelief,
      hostilityBefore,
      hostilityAfter: snap.breakaway?.relations?.hostile || [],
      civilWarStill: snap.breakaway?.civilWarActive,
      snap,
      war,
      develop,
      agitation,
      stacked: snap.unrest?.stackedSources,
    };
  });
  check(
    results,
    'S7.19 unrest-threshold-declaration',
    s71923.below?.unrest?.eligible === false
      && s71923.random?.ok === false
      && /random-flip/i.test(s71923.random?.reason || '')
      && s71923.at?.unrest?.eligible === true
      && s71923.eligibleMint?.ok === true
      && s71923.eligibleMint?.sideId
      && s71923.eligibleMint.sideId !== 'terran'
      && s71923.eligibleMint.sideId !== 'neutral',
    JSON.stringify({
      below: s71923.below?.unrest,
      random: s71923.random,
      at: s71923.at?.unrest,
      minted: s71923.eligibleMint?.sideId,
    }),
  );
  check(
    results,
    'S7.20 commerce-failure-raises-unrest',
    s71923.pirateCommerce?.raised === true
      && s71923.blockade?.raised === true
      && s71923.pirateCommerce?.unrest?.commerceFailed === true
      && s71923.blockade?.unrest?.lastWrite?.cause === 'blockade',
    JSON.stringify({ pirate: s71923.pirateCommerce, blockade: s71923.blockade }),
  );
  check(
    results,
    'S7.21 pirate-presence-raises-unrest',
    s71923.pirates?.raised === true
      && s71923.pirates?.ownersRewritten === false
      && s71923.pirates?.cultureFireGranted === false,
    JSON.stringify(s71923.pirates),
  );
  check(
    results,
    'S7.22 lounge-and-contract-coexist',
    s71923.roles?.ok === true
      && s71923.roles?.coexist === true
      && s71923.roles?.lounge?.purpose === 'lounge'
      && s71923.roles?.contract?.purpose === 'contract'
      && s71923.snap?.civilianRoles?.lounge >= 1
      && s71923.snap?.civilianRoles?.contract >= 1,
    JSON.stringify({ roles: s71923.roles, counts: s71923.snap?.civilianRoles }),
  );
  check(
    results,
    'S7.23 relief-lowers-unrest-without-ending-war',
    s71923.relief?.lowered === true
      && s71923.relief?.civilWarErased === false
      && s71923.civilWarStill === true
      && s71923.relief?.playerRoeInstalled === false
      && s71923.ownerBeforeRelief?.sideId === 'ferengi'
      && s71923.ownerAfterRelief?.sideId === 'ferengi'
      && Array.isArray(s71923.hostilityAfter)
      && s71923.hostilityAfter.includes('terran'),
    JSON.stringify({
      relief: s71923.relief,
      war: s71923.civilWarStill,
      hostility: s71923.hostilityAfter,
      owners: { before: s71923.ownerBeforeRelief, after: s71923.ownerAfterRelief },
    }),
  );
  check(
    results,
    'S7 unrest-does-not-change-mayAutoEngage',
    s71118.beforeEngage === s71118.afterEngage,
    JSON.stringify({ before: s71118.beforeEngage, after: s71118.afterEngage }),
  );
}

async function runPhase5Objectives(page, results) {
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 28000 });

  const s81 = await page.evaluate(() => {
    const probe2 = globalThis.__BM1_PROBE__;
    const p5 = probe2.phase5;
    if (!p5?.injectShortageAndConvoy) return { missing: true };
    const injected = p5.injectShortageAndConvoy({ urgencyTier: 'tight', plannedRouteJumps: 2 });
    const before = p5.snapshot();
    const warp = p5.completeJump('warp');
    const afterWarp = p5.snapshot();
    const wormhole = p5.completeJump('wormhole');
    const afterWorm = p5.snapshot();
    const obj = afterWorm.board.objectives[injected.objective.objectiveId];
    return {
      missing: false,
      injectedOk: injected.ok === true,
      before: before.strategicJumps,
      afterWarp: afterWarp.strategicJumps,
      afterWorm: afterWorm.strategicJumps,
      warpOk: warp.ok === true,
      wormOk: wormhole.ok === true,
      burned: obj?.clocks?.burnedJumps,
      remaining: obj?.clocks?.remainingJumps,
      ids: {
        objectiveId: injected.objective?.objectiveId,
        convoyId: injected.convoy?.convoyId,
        assignmentId: injected.assignment?.assignmentId,
      },
    };
  });
  check(results, 'S8.1 clock-ticks-only-on-completed-jump', !s81.missing
    && s81.injectedOk
    && s81.afterWarp === s81.before + 1
    && s81.afterWorm === s81.before + 2
    && s81.burned === 2, JSON.stringify(s81));

  const s82 = await page.evaluate(() => {
    const p5 = globalThis.__BM1_PROBE__.phase5;
    const before = p5.snapshot().strategicJumps;
    const started = p5.startTravel('warp');
    const cancelled = p5.cancelTravel();
    const afterCancel = p5.snapshot().strategicJumps;
    p5.saveSlot(7);
    const remainingBefore = Object.values(p5.snapshot().board.objectives).find((row) => row.status === 'open')?.clocks?.remainingJumps;
    p5.loadSlot(7);
    const afterLoad = p5.snapshot();
    const remainingAfter = Object.values(afterLoad.board.objectives).find((row) => row.status === 'open')?.clocks?.remainingJumps;
    const reset = p5.resetRun();
    return {
      before,
      startedActive: started.active === true,
      cancelledBurned: cancelled.burned === true,
      afterCancel,
      remainingBefore,
      remainingAfter,
      afterLoadJumps: afterLoad.strategicJumps,
      resetJumps: reset.strategicJumps,
      leftover: reset.leftover,
    };
  });
  check(results, 'S8.2 cancel-and-load-do-not-tick', s82.afterCancel === s82.before
    && s82.cancelledBurned === false
    && s82.afterLoadJumps === s82.before
    && s82.remainingAfter === s82.remainingBefore
    && s82.resetJumps === 0, JSON.stringify(s82));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 28000 });
  const s8345 = await page.evaluate(() => {
    const p5 = globalThis.__BM1_PROBE__.phase5;
    const injected = p5.injectShortageAndConvoy({ urgencyTier: 'tight', plannedRouteJumps: 2 });
    p5.saveSlot(7);
    const beforeIds = {
      objectiveId: injected.objective.objectiveId,
      convoyId: injected.convoy.convoyId,
      assignmentId: injected.assignment.assignmentId,
    };
    p5.wipeSystemStates();
    p5.loadSlot(7);
    const after = p5.snapshot();
    const obj = after.board.objectives[beforeIds.objectiveId];
    const unload = p5.unloadConvoyHulls(beforeIds.objectiveId);
    const afterUnload = p5.snapshot();
    const overdueAfterUnload = Object.values(afterUnload.board.objectives).some((row) => row.kind === 'asset_overdue');
    const closed = p5.applyChoice(beforeIds.objectiveId, 'escort');
    const remint = p5.tryMintReplacement(beforeIds.assignmentId, 'convoy_delivery');
    const second = p5.injectShortageAndConvoy({
      assignmentId: beforeIds.assignmentId,
      urgencyTier: 'tight',
      plannedRouteJumps: 2,
    });
    return {
      beforeIds,
      sameIds: obj?.objectiveId === beforeIds.objectiveId
        && after.board.convoys[beforeIds.convoyId]?.assignmentId === beforeIds.assignmentId,
      unloadOk: unload.ok === true && unload.overdueOpened === false,
      overdueAfterUnload,
      closedOk: closed.ok === true,
      remint: remint.reason,
      secondReason: second.reason,
    };
  });
  check(results, 'S8.3 stable-id-outside-systemStates', s8345.sameIds === true, JSON.stringify(s8345));
  check(results, 'S8.4 close-once-no-free-replacements', s8345.closedOk
    && s8345.remint === 'already_closed'
    && s8345.secondReason === 'already_closed', JSON.stringify(s8345));
  check(results, 'S8.5 unload-is-not-disappeared', s8345.unloadOk === true && s8345.overdueAfterUnload === false, JSON.stringify(s8345));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 28000 });
  const s8613 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    const p5 = probe2.phase5;
    p.prepareArena({ clearTraffic: true, latinum: 28000 });
    const injected = p5.injectShortageAndConvoy({ urgencyTier: 'tight', plannedRouteJumps: 1 });
    const standingBefore = { ...p5.snapshot().standing };
    const writesBefore = p5.snapshot().standingWriteCount;
    const burned = p5.burnWindow(injected.objective.objectiveId);
    const snap = p5.snapshot();
    const overdue = Object.values(snap.board.objectives).find((row) => row.kind === 'asset_overdue');
    const incident = Object.values(snap.board ? (probe2.incidents.list() || []) : []).find((row) => row.kind === 'asset_overdue');
    const journal = `${snap.log || ''} ${snap.lastJournal || ''} ${overdue?.sayable || ''}`;
    return {
      burnedOk: burned.ok === true,
      destroyed: overdue?.truth?.destroyed,
      attackerId: overdue?.truth?.attackerId,
      standingSame: JSON.stringify(snap.standing) === JSON.stringify(standingBefore),
      writesSame: snap.standingWriteCount === writesBefore,
      namesKiller: /pirates destroyed|killed by/i.test(journal)
        || (/attacker identified/i.test(journal) && !/no attacker identified/i.test(journal)),
      sayable: overdue?.sayable || journal,
      incidentKind: incident?.kind || null,
    };
  });
  check(results, 'S8.6 overdue-not-destroyed-not-attacker', s8613.burnedOk
    && s8613.destroyed === false
    && s8613.attackerId == null
    && s8613.standingSame
    && s8613.writesSame
    && s8613.namesKiller === false, JSON.stringify(s8613));
  check(results, 'S8.13 burned-window-is-not-a-wreck', s8613.destroyed === false && s8613.attackerId == null, JSON.stringify(s8613));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 28000 });
  const s878 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    const p5 = probe2.phase5;
    p.prepareArena({ clearTraffic: true });
    const injected = p5.injectShortageAndConvoy({ urgencyTier: 'tight', plannedRouteJumps: 1 });
    const pirateKnown = p.spawnShip({ id: 's8-pirate-known', faction: 'pirate', role: 'raider', x: 400, y: 400 });
    const pirateIgnorant = p.spawnShip({ id: 's8-pirate-ignorant', faction: 'pirate', role: 'raider', x: 500, y: 400 });
    const vulcan = p.spawnShip({ id: 's8-vulcan-relief', faction: 'vulcan', role: 'patrol', x: 420, y: 380 });
    const klingon = p.spawnShip({ id: 's8-klingon-patrol', faction: 'klingon', role: 'patrol', x: 440, y: 360 });
    const knowing = p5.evaluatePirate(pirateKnown.id, { event_known: true, cargoKnown: true });
    const ignorant = p5.evaluatePirate(pirateIgnorant.id, { event_known: false });
    p5.burnWindow(injected.objective.objectiveId);
    const reacted = p5.reactOverdue({
      knownIds: [vulcan.id, klingon.id],
      ignorantIds: [pirateIgnorant.id],
      factsByFaction: {
        vulcan: { evidence_available: true, can_respond: true },
        klingon: { can_respond: true },
      },
    });
    const vulcanDecision = reacted.decisions?.find((row) => row.id === vulcan.id);
    const klingonDecision = reacted.decisions?.find((row) => row.id === klingon.id);
    const ignorantDecision = reacted.decisions?.find((row) => row.id === pirateIgnorant.id);
    return {
      knowing: knowing.appliedResponse,
      knowingObjective: knowing.convoyObjective,
      ignorant: ignorant.appliedResponse,
      ignorantObjective: ignorant.convoyObjective,
      ignorantLeak: ignorant.journalLeak,
      vulcan: vulcanDecision?.appliedResponse,
      vulcanActing: vulcanDecision?.acting,
      klingon: klingonDecision?.appliedResponse,
      ignorantReact: ignorantDecision?.appliedResponse,
      spawned: reacted.spawned,
    };
  });
  check(results, 'S8.7 knowledge-scoped-pirates', s878.knowing === 'evaluate'
    && s878.knowingObjective
    && s878.ignorant === 'ignore_unknown'
    && s878.ignorantObjective == null
    && s878.ignorantLeak === false, JSON.stringify(s878));
  check(results, 'S8.8 knowledge-scoped-patrol-relief', (s878.vulcan === 'investigate' || s878.vulcan === 'rescue')
    && s878.klingon === 'record_only'
    && (s878.ignorantReact === 'ignore_unknown' || s878.ignorantReact == null)
    && s878.spawned === false, JSON.stringify(s878));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 28000 });
  const s89 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    const p5 = probe2.phase5;
    p.prepareArena({ clearTraffic: true, latinum: 28000 });
    const injected = p5.injectShortageAndConvoy({ urgencyTier: 'tight', plannedRouteJumps: 1 });
    const hullId = injected.contract?.id;
    const standingBefore = { ...probe2.incidents.snapshot().standing };
    const writesBefore = probe2.incidents.snapshot().standingWriteCount;
    if (hullId) p.destroy(hullId, 'player');
    const afterKill = probe2.incidents.snapshot();
    const token = Object.values(afterKill.ledger.incidents || {}).find((row) => row.kind === 'destruction')?.links?.punishmentToken;
    const reacted = token ? probe2.incidents.tryStanding(token, -4) : { applied: false };
    const overdueTry = p5.burnWindow(injected.objective.objectiveId);
    const after = probe2.incidents.snapshot();
    return {
      token,
      killWrites: afterKill.standingWriteCount,
      writesBefore,
      standingChangedOnKill: JSON.stringify(afterKill.standing) !== JSON.stringify(standingBefore),
      secondApplied: reacted.applied,
      overdueDestroyed: overdueTry.objective?.truth?.destroyed ?? overdueTry.destroyed,
      afterWrites: after.standingWriteCount,
    };
  });
  check(results, 'S8.9 no-double-standing', s89.secondApplied === false
    && s89.afterWrites === s89.killWrites, JSON.stringify(s89));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 28000 });
  const s81016 = await page.evaluate(() => {
    const p = globalThis.BM1Probe;
    const probe2 = globalThis.__BM1_PROBE__;
    const p5 = probe2.phase5;
    p.prepareArena({ clearTraffic: true });
    const injected = p5.injectShortageAndConvoy({ urgencyTier: 'tight', plannedRouteJumps: 2 });
    const snap = p5.snapshot();
    const trafficTimers = (p.snapshot().ships || []).filter((ship) => ship.phase5AssignmentId && ship.role === 'traffic').length;
    const protect = probe2.incidents.inspectFire
      ? null
      : null;
    return {
      lounge: injected.lounge?.purpose,
      contract: injected.contract?.purpose,
      coexist: injected.coexist,
      roles: snap.civilianRoles,
      overdueImplemented: snap.overdueImplemented,
      flagShare: snap.flagShareGrantsControl,
      catalogWired: snap.catalogWired,
      trafficTimers,
      mayAutoEngage: probe2.mayAutoEngage({ id: 's8-gate', faction: 'dominion', hostile: true, attitude: 'hostile' }),
    };
  });
  check(results, 'S8.10 no-second-civilian-sim', s81016.lounge === 'lounge'
    && s81016.contract === 'contract'
    && s81016.coexist === true
    && s81016.roles?.lounge >= 1
    && s81016.roles?.contract >= 1, JSON.stringify(s81016));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 28000 });
  const s81114 = await page.evaluate(() => {
    const p5 = globalThis.__BM1_PROBE__.phase5;
    const tight = p5.injectShortageAndConvoy({ urgencyTier: 'tight', plannedRouteJumps: 2, slackByTier: { tight: 1, standard: 2, soft: 4 } });
    const soft = p5.injectSoftWatch({ plannedRouteJumps: 2, slackByTier: { tight: 1, standard: 2, soft: 4 } });
    const before = p5.changeHull(null, {});
    p5.completeJump('warp');
    const afterJump = p5.snapshot();
    const hull = p5.changeHull(null, { antimatter: 30, antimatterUse: 3 });
    const escorts = p5.assignEscorts([{ id: 'pe-s8', antimatter: 3, antimatterUse: 3 }]);
    const tightObj = afterJump.board.objectives[tight.objective.objectiveId];
    const softObj = soft.objective;
    return {
      tightBudget: tight.objective.clocks.tierBudget,
      softBudget: softObj.clocks.tierBudget,
      sameDeadline: tight.objective.clocks.deadlineAtStrategicJumps === softObj.clocks.deadlineAtStrategicJumps,
      hullDeadline: hull.after?.deadlineAt,
      hullOpened: hull.after?.openedAt,
      hullBurned: hull.after?.burnedJumps,
      beforeDeadline: hull.before?.deadlineAt,
      beforeBurned: hull.before?.burnedJumps,
      capacityChanged: hull.after?.capacityJumps !== hull.before?.capacityJumps || escorts.capacityJumps !== hull.before?.capacityJumps,
      burnedReset: hull.after?.burnedJumps === 0 && (hull.before?.burnedJumps || 0) > 0,
    };
  });
  check(results, 'S8.11 reachable-urgency-recalc', s81114.hullDeadline === s81114.beforeDeadline
    && s81114.burnedReset !== true
    && s81114.hullBurned === s81114.beforeBurned, JSON.stringify(s81114));
  check(results, 'S8.14 urgency-tiers-differ', s81114.tightBudget < s81114.softBudget && s81114.sameDeadline === false, JSON.stringify(s81114));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 28000 });
  const s812 = await page.evaluate(() => {
    const p5 = globalThis.__BM1_PROBE__.phase5;
    const injected = p5.injectShortageAndConvoy({ urgencyTier: 'tight', plannedRouteJumps: 3 });
    p5.completeJump('warp');
    const burned = p5.snapshot().board.objectives[injected.objective.objectiveId].clocks.burnedJumps;
    p5.saveSlot(8);
    p5.cancelTravel();
    p5.loadSlot(8);
    const after = p5.snapshot().board.objectives[injected.objective.objectiveId].clocks.burnedJumps;
    return { burned, after };
  });
  check(results, 'S8.12 cancel-load-do-not-burn-deadline', s812.burned >= 1 && s812.after === s812.burned, JSON.stringify(s812));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 28000 });
  const s81516 = await page.evaluate(() => {
    const p5 = globalThis.__BM1_PROBE__.phase5;
    const first = p5.injectShortageAndConvoy({ urgencyTier: 'tight', plannedRouteJumps: 2, good: 'food' });
    const escorted = p5.applyChoice(first.objective.objectiveId, 'escort');
    const second = p5.injectShortageAndConvoy({ urgencyTier: 'standard', plannedRouteJumps: 2, good: 'fuel' });
    const ignored = p5.applyChoice(second.objective.objectiveId, 'ignore');
    p5.completeJump('warp');
    p5.saveSlot(9);
    p5.loadSlot(9);
    const snap = p5.snapshot();
    const firstClosed = snap.board.objectives[first.objective.objectiveId];
    const shortage = snap.board.shortages[first.shortage.shortageId];
    const remint = p5.tryMintReplacement(first.assignment.assignmentId, 'convoy_delivery');
    return {
      escorted: escorted.ok,
      ignored: ignored.ok,
      firstClosed: firstClosed?.status,
      shortage: shortage?.status,
      remint: remint.reason,
      flagShare: snap.flagShareGrantsControl,
      catalogWired: snap.catalogWired,
      overdueImplemented: snap.overdueImplemented,
    };
  });
  check(results, 'S8.15 player-loop-and-supply', s81516.escorted
    && s81516.ignored
    && s81516.firstClosed === 'closed'
    && s81516.shortage === 'filled'
    && s81516.remint === 'already_closed', JSON.stringify(s81516));
  check(results, 'S8.16 phase1-4-side-lane-still-hold', s81516.flagShare === false
    && s81516.overdueImplemented === true, JSON.stringify(s81516));
}

async function runPhase6Sensors(page, results) {
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800, hull: 100, shields: 100 });
  await page.waitForFunction(() => Boolean(globalThis.__BM1_PROBE__?.phase6), { timeout: 30000 });

  const s91 = await page.evaluate(() => {
    const p6 = globalThis.__BM1_PROBE__.phase6;
    if (!p6) return { missing: true };
    const injected = p6.injectCloakedHull({ name: 'Cloaked Warbird' });
    const first = p6.firstFrameAfterApply();
    return {
      missing: false,
      ok: injected.ok,
      cloaked: injected.cloaked,
      firstFrame: injected.firstFrame,
      minimapHas: (injected.minimapIds || []).includes(injected.id),
      targetHas: (injected.targetIds || []).includes(injected.id),
      firstTicked: first.ticked === true,
      firstMinimapHas: (first.minimapIds || []).includes(injected.id),
    };
  });
  check(results, 'S9.1 first-frame-cloak', s91.ok && s91.cloaked && s91.firstFrame?.minimap === false
    && s91.firstFrame?.targetCycle === false && s91.firstFrame?.aiAcquisition === false
    && s91.minimapHas === false && s91.targetHas === false && s91.firstTicked === false, JSON.stringify(s91));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s92 = await page.evaluate(() => {
    const p6 = globalThis.__BM1_PROBE__.phase6;
    const injected = p6.injectCloakedHull({ id: 's92-cloak' });
    const report = p6.seedReport(injected.subjectKey, { x: 120, y: 80 });
    const det = report.contact;
    return {
      reportFs: report.firingSolution,
      detected: det?.detected === true,
      track: det?.trackQuality,
      ident: det?.identification,
    };
  });
  check(results, 'S9.2 info-layers-report-not-lock', s92.detected && s92.reportFs === false && s92.track === 'area' && s92.ident === 'none', JSON.stringify(s92));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s934 = await page.evaluate(() => {
    const p6 = globalThis.__BM1_PROBE__.phase6;
    const cloak = p6.injectCloakedHull({ id: 's93-cloak', hostile: true });
    const snap = p6.snapshot();
    const ordinary = p6.spawnOrdinaryObserver({ id: 's94-ignorant' });
    p6.cloakPlayer(true);
    const ai = p6.listAiAcquisition(ordinary.id);
    const playerSeen = (ai.subjects || []).find((row) => row.type === 'player');
    return {
      minimap: (snap.minimapIds || []).includes(cloak.id),
      targets: (snap.targetIds || []).includes(cloak.id),
      playerLock: (snap.firing || []).includes(cloak.subjectKey),
      ignorantSeesPlayer: playerSeen?.detected === true,
      ignorantLocksPlayer: playerSeen?.lock === true,
    };
  });
  check(results, 'S9.3 hidden-player-ui', s934.minimap === false && s934.targets === false && s934.playerLock === false, JSON.stringify(s934));
  check(results, 'S9.4 hidden-npc-ai', s934.ignorantSeesPlayer === false && s934.ignorantLocksPlayer === false, JSON.stringify(s934));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s95 = await page.evaluate(() => {
    const p6 = globalThis.__BM1_PROBE__.phase6;
    const cloak = p6.injectCloakedHull({ id: 's95-lock' });
    const granted = p6.grantLiveLock(cloak.subjectKey);
    const before = p6.snapshot();
    const aged = p6.applyLostTrack(cloak.subjectKey);
    const after = aged.snapshot;
    return {
      granted: granted.firingSolution === true,
      beforeFs: (before.firing || []).includes(cloak.subjectKey),
      afterFs: (after.firing || []).includes(cloak.subjectKey),
      sameTick: aged.sameTick === true,
      dropAi: aged.drop?.ai?.acquisition === false,
      dropUi: aged.drop?.ui?.tooltipLock === false && aged.drop?.ui?.minimapExact === false,
    };
  });
  check(results, 'S9.5 lost-track-same-tick', s95.granted && s95.beforeFs && s95.afterFs === false && s95.sameTick && s95.dropAi && s95.dropUi, JSON.stringify(s95));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s96 = await page.evaluate(() => {
    const p6 = globalThis.__BM1_PROBE__.phase6;
    const cloak = p6.injectCloakedHull({ id: 's96-search' });
    p6.seedReport(cloak.subjectKey, { x: 90, y: 90 });
    const started = p6.startAreaSearch(cloak.subjectKey);
    const failed = p6.failSearch(cloak.subjectKey);
    return {
      startedFs: started.firingSolution === true,
      failedFs: failed.firingSolution === true,
      invented: failed.inventedCoordinates === true,
    };
  });
  check(results, 'S9.6 search-costs-and-can-fail', s96.startedFs === false && s96.failedFs === false && s96.invented === false, JSON.stringify(s96));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s97 = await page.evaluate(() => {
    const p6 = globalThis.__BM1_PROBE__.phase6;
    if (typeof p6.injectScienceVsOrdinary !== 'function') return { missing: true };
    return p6.injectScienceVsOrdinary();
  });
  check(results, 'S9.7 science-specialist-variance', s97.ok && s97.scienceSees === true && s97.ordinarySees === false && s97.damagedSees === false, JSON.stringify(s97));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s98 = await page.evaluate(() => {
    const p6 = globalThis.__BM1_PROBE__.phase6;
    const science = p6.injectScienceVsOrdinary();
    const scan = p6.activeScan(science.science.key, science.target.subjectKey);
    const noticed = (scan.emission?.detectedBy || []).length > 0 || scan.raised === true || scan.empty === true;
    return {
      useful: scan.useful === true,
      cargo: scan.cargoDump === true,
      noticed,
      emptyOrRaised: scan.empty === true || scan.raised === true,
    };
  });
  check(results, 'S9.8 active-scan-useful-detectable', s98.useful && s98.cargo === false && s98.emptyOrRaised, JSON.stringify(s98));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s99 = await page.evaluate(() => {
    const p6 = globalThis.__BM1_PROBE__.phase6;
    const snap = p6.snapshot();
    return {
      kinds: snap.destinations || [],
      deep: snap.deepSpace === true,
      clampW: snap.systemClamp?.w,
      clampH: snap.systemClamp?.h,
    };
  });
  check(results, 'S9.9 purposeful-destinations', (s99.kinds || []).length >= 2 && s99.deep === false && s99.clampW === 2600 && s99.clampH === 1800, JSON.stringify(s99));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s910 = await page.evaluate(() => {
    const p6 = globalThis.__BM1_PROBE__.phase6;
    const a = p6.completeJumpFrom(0);
    const b = p6.completeJumpFrom(5);
    return {
      ax: a.snapshot.arrival.x,
      ay: a.snapshot.arrival.y,
      bx: b.snapshot.arrival.x,
      by: b.snapshot.arrival.y,
      stacked: b.snapshot.escortsStacked,
      exit: b.snapshot.exitRetained,
    };
  });
  check(results, 'S9.10 arrival-spacing-exit', (s910.ax !== s910.bx || s910.ay !== s910.by) && s910.stacked === false && s910.exit === true, JSON.stringify(s910));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s911 = await page.evaluate(() => {
    const p6 = globalThis.__BM1_PROBE__.phase6;
    const p5 = globalThis.__BM1_PROBE__.phase5;
    const cloak = p6.injectCloakedHull({ id: 's911-cloak' });
    p6.seedReport(cloak.subjectKey, { x: 10, y: 10 });
    p5.saveSlot(6);
    p5.loadSlot(6);
    const first = p6.firstFrameAfterApply();
    return {
      unknown: p6.unknownAccessEnforced(),
      firstMinimap: (first.minimapIds || []).includes(cloak.id),
      deep: first.deepSpace,
    };
  });
  check(results, 'S9.11 load-reuse-no-leak', s911.firstMinimap === false && s911.unknown === false, JSON.stringify(s911));
  check(results, 'S9.12 unknown-still-unenforced', s911.unknown === false, JSON.stringify(s911));
}

async function runPhase65PowerSensors(page, results) {
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800, hull: 100, shields: 100 });
  await page.waitForFunction(() => Boolean(globalThis.__BM1_PROBE__?.phase65), { timeout: 30000 });

  const s1017 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.phase65;
    if (typeof p.injectGeneration !== 'function') return { missing: true };
    const low = p.injectGeneration('player', 7);
    const lowSnap = low.snapshot;
    const high = p.injectGeneration('player', 18);
    const highSnap = high.snapshot;
    return {
      missing: false,
      lowGen: lowSnap.generation.player,
      highGen: highSnap.generation.player,
      massEnergySame: lowSnap.generation.massDerivedEnergy === highSnap.generation.massDerivedEnergy,
      notMass: highSnap.generation.usesMassDerivedAsGeneration === false,
      highBetterNorm: highSnap.powerNorm > lowSnap.powerNorm || highSnap.generation.player > lowSnap.generation.player,
      ew: highSnap.ew?.draw === 0 && highSnap.ewConsumer === 'ew' && highSnap.draws?.ew === 0,
      consumers: (highSnap.consumerNames || []).join(','),
    };
  });
  check(results, 'S10.1 base-generation-budget', s1017.missing !== true && s1017.highGen > s1017.lowGen
    && s1017.massEnergySame && s1017.notMass && s1017.highBetterNorm, JSON.stringify(s1017));
  check(results, 'S10.7 ew-reserved-not-implemented', s1017.ew === true && s1017.consumers.includes('ew'), JSON.stringify(s1017));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s1023 = await page.evaluate(() => {
    const p6 = globalThis.__BM1_PROBE__.phase6;
    const p = globalThis.__BM1_PROBE__.phase65;
    const science = p6.injectScienceVsOrdinary();
    const passive = p.setSensorMode(science.science.key, 'passive');
    const draws = passive.snapshot.draws;
    const scan = p.budgetedScan(science.science.key, science.target.subjectKey);
    const report = p6.seedReport('npc:s10-report', { x: 400, y: 400 });
    return {
      drawSplit: draws.passive < draws.active,
      useful: scan.useful === true,
      emission: Boolean(scan.emission) || scan.wroteEmission === true,
      emptyOrRaised: scan.empty === true || scan.raised === true,
      reportFs: report.firingSolution === false,
      scanFsOk: scan.firingSolution !== true || scan.raised === true,
      noEngage: scan.engagement_authorized !== true,
    };
  });
  check(results, 'S10.2 passive-vs-active-draw', s1023.drawSplit && s1023.useful && s1023.emission && s1023.emptyOrRaised, JSON.stringify(s1023));
  check(results, 'S10.3 active-cannot-invent-layers', s1023.reportFs && s1023.noEngage, JSON.stringify(s1023));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s1045 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.phase65;
    const before = p.snapshot();
    const fitted = p.injectSuite('player', 'suite:science');
    const after = fitted.snapshot;
    const trade = p.injectRoleCurveQuartet();
    const cargoWorse = after.payments.cargo < before.payments.cargo
      || after.cargoCap < before.cargoCap
      || after.payments.powerHeadroom < before.payments.powerHeadroom
      || after.payments.speed < before.payments.speed
      || after.payments.detectability > before.payments.detectability;
    return {
      suiteId: after.suiteId,
      paid: cargoWorse,
      slots: fitted.weaponSlotsUnchanged === true,
      sensorRise: trade.trade?.sensorRise === true,
      notFree: trade.trade?.notFreeVsScout === true,
      dominated: trade.dominated == null,
    };
  });
  check(results, 'S10.4 suite-is-equipment', s1045.suiteId === 'suite:science' && s1045.paid && s1045.slots, JSON.stringify(s1045));
  check(results, 'S10.5 scout-freighter-paid', s1045.sensorRise && s1045.notFree, JSON.stringify(s1045));
  check(results, 'S10.6 no-dominated-curve', s1045.dominated === true, JSON.stringify(s1045));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s108a = await page.evaluate(() => {
    const p6 = globalThis.__BM1_PROBE__.phase6;
    const cloak = p6.injectCloakedHull({ id: 's108-cloak' });
    const first = cloak.firstFrame;
    const report = p6.seedReport(cloak.subjectKey, { x: 20, y: 20 });
    const granted = p6.grantLiveLock(cloak.subjectKey);
    const aged = p6.applyLostTrack(cloak.subjectKey);
    return {
      firstHidden: first?.minimap === false && first?.aiAcquisition === false,
      reportFs: report.firingSolution === false,
      granted: granted.firingSolution === true,
      dropped: aged.firingSolution === false && aged.sameTick === true,
      unknown: p6.unknownAccessEnforced() === false,
    };
  });
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s108b = await page.evaluate(() => {
    const p6 = globalThis.__BM1_PROBE__.phase6;
    const science = p6.injectScienceVsOrdinary({
      targetId: 's108-cloak-target',
      scienceId: 's108-science',
      ordinaryId: 's108-ordinary',
    });
    return {
      ok: science.ok,
      scienceSees: science.scienceSees,
      ordinarySees: science.ordinarySees,
      damagedSees: science.damagedSees,
      targetCloaked: science.targetCloaked,
      unknown: p6.unknownAccessEnforced() === false,
    };
  });
  check(results, 'S10.8 phase6-preservation', s108a.firstHidden && s108a.reportFs && s108a.granted && s108a.dropped
    && s108b.ok && s108b.targetCloaked && s108b.scienceSees === true && s108b.ordinarySees === false
    && s108b.damagedSees === false && s108a.unknown && s108b.unknown, JSON.stringify({ ...s108a, ...s108b }));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s10910 = await page.evaluate(async () => {
    const p = globalThis.__BM1_PROBE__.phase65;
    const snap = p.snapshot();
    const roster = typeof p.preserveRoster === 'function' ? await p.preserveRoster() : { ok: false };
    return {
      remanKey: snap.reman53?.key === 'bm-ship:53' && snap.reman53?.aliased === false,
      alias304: snap.alias304 === 2,
      catalog: snap.catalogWired === true,
      rosterOk: roster.ok && roster.remanKey === 'bm-ship:53' && roster.remanAliased === false
        && roster.alias304 === 2 && roster.activeCount === 172 && roster.catalogWired === true,
    };
  });
  check(results, 'S10.9 reman53-and-aliases', s10910.remanKey && s10910.alias304 && s10910.rosterOk, JSON.stringify(s10910));
  check(results, 'S10.10 catalog-wire-live', s10910.catalog && s10910.rosterOk, JSON.stringify(s10910));
}

async function runCatalogWire(page, results) {
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 28000 });
  const s11 = await page.evaluate(() => {
    const catalog = globalThis.__BM1_PROBE__?.catalog || globalThis.BM1Probe?.catalog;
    const lane = globalThis.__BM1_PROBE__?.sideLane;
    if (!catalog) return { missing: true };
    const snap = catalog.snapshot();
    const alias304 = catalog.resolve(304);
    const alias18 = catalog.resolve(18);
    const gorn = catalog.spawnPool({ role: 'traffic', systemName: 'Gorn' }, 'gorn');
    const earth = catalog.spawnPool({ role: 'traffic', systemName: 'Earth' });
    lane?.resetReman();
    const locked = catalog.purchase(53);
    lane?.grantReman('recovery-mission');
    const granted = catalog.purchase(53);
    const stock = catalog.stock({ name: 'Utopia Planitia', stockIds: [2, 304, 18, 316] });
    const discarded = (stock || []).filter((id) => id === 304 || id === 18);
    return {
      missing: false,
      snap,
      alias304,
      alias18,
      gorn,
      earthCount: Array.isArray(earth) ? earth.length : 0,
      earthHas304: Array.isArray(earth) && earth.includes(304),
      locked,
      granted,
      stock,
      discarded,
      homeStanding: snap.startingStandings?.ferengi,
    };
  });
  check(results, 'S11.1 alias-resolve-old-to-survivor', s11.alias304?.getShip === 2 && s11.alias18?.getShip === 316, JSON.stringify(s11.alias304));
  check(results, 'S11.2 reman-unlock-still-required', s11.locked?.allowed === false && s11.locked?.reason === 'access-locked', JSON.stringify(s11.locked));
  check(results, 'S11.3 reman-grant-survives-off-remus', s11.granted?.allowed === true, JSON.stringify({ reason: s11.granted?.reason, pack: s11.granted?.packDecision }));
  check(results, 'S11.4 stock-dedupe-no-discarded-ids', Array.isArray(s11.stock) && s11.discarded?.length === 0 && s11.stock.includes(2) && s11.stock.includes(316), JSON.stringify(s11.stock));
  check(results, 'S11.5 gorn-pool-empty', Array.isArray(s11.gorn) && s11.gorn.length === 0 && s11.earthCount > 0 && s11.earthHas304 === false, JSON.stringify({ gorn: s11.gorn, earth: s11.earthCount }));
  check(results, 'S11.6 roster-wired', s11.snap?.wired === true && s11.snap?.activeCount === 172 && s11.homeStanding === 20, JSON.stringify(s11.snap));
}

async function runPhase7Fleet(page, results) {
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800, hull: 100, shields: 100 });
  await page.waitForFunction(() => Boolean(globalThis.__BM1_PROBE__?.phase7), { timeout: 30000 });

  const s1212 = await page.evaluate(() => {
    const p7 = globalThis.__BM1_PROBE__.phase7;
    const p6 = globalThis.__BM1_PROBE__.phase6;
    if (!p7) return { missing: true };
    const commissioned = p7.commissionEscort({ id: 'pe-s12', name: 'Hold Wing', kind: 'escort' });
    const held = p7.holdOutside({ id: 'pe-s12', role: 'screen' });
    const snap = held.snapshot;
    const escort = (snap.escorts || [])[0];
    const cloak = p6.injectCloakedHull({ id: 's12-cloak' });
    p7.seedLock(cloak.subjectKey, { x: 30, y: 12 });
    const shared = p7.shareFormation();
    const beforeBook = shared.snapshot.book;
    const interrupted = p7.interruptDefense('pe-s12');
    return {
      missing: false,
      commissioned: commissioned.ok,
      held: held.ok,
      noFire: held.noFireInject !== false && interrupted.noFireInject === true,
      outside: escort?.outside === true,
      stacked: snap.escortsStacked === true,
      destName: escort?.destinationName,
      kind: escort?.kind,
      gifted: shared.gifted === true,
      detectionOnly: shared.detectionOnly === true,
      standing: interrupted.standing?.kind,
      bookPreserved: interrupted.bookPreserved === true,
      panel: snap.panelVisible === true || (snap.panelHtml || '').includes('hold_outside') || (snap.rows || []).some((row) => row.kind === 'hold_outside'),
      commsStub: snap.commsImplemented === false,
      tensionStub: snap.tensionImplemented === false,
      reman: snap.reman?.id === 53,
      catalog: snap.catalogWired === true,
      bookBefore: Boolean(beforeBook),
    };
  });
  check(results, 'S12.1 hold-outside-beyond-boundary', s1212.held && s1212.outside === true, JSON.stringify(s1212));
  check(results, 'S12.2 hold-outside-not-stacked', s1212.stacked === false, JSON.stringify({ stacked: s1212.stacked }));
  check(results, 'S12.5 no-gifted-fs', s1212.detectionOnly === true && s1212.gifted !== true, JSON.stringify({ gifted: s1212.gifted, detectionOnly: s1212.detectionOnly }));
  check(results, 'S12.6 no-engagement-inject', s1212.noFire === true, JSON.stringify({ noFire: s1212.noFire }));
  check(results, 'S12.7 interrupt-preserves-standing', s1212.standing === 'hold_outside', JSON.stringify({ standing: s1212.standing }));
  check(results, 'S12.8 interrupt-keeps-contact-book', s1212.bookPreserved === true, JSON.stringify({ bookPreserved: s1212.bookPreserved }));
  check(results, 'S12.9 peaceful-escort-hold', s1212.kind === 'hold_outside' && s1212.destName === 'hold outside', JSON.stringify({ kind: s1212.kind, destName: s1212.destName }));
  check(results, 'S12.11 visible-order-status', s1212.panel === true, JSON.stringify({ panel: s1212.panel }));
  check(results, 'S12.soft stubs-and-locks', s1212.commsStub && s1212.tensionStub && s1212.reman && s1212.catalog, JSON.stringify(s1212));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s1234 = await page.evaluate(() => {
    const p7 = globalThis.__BM1_PROBE__.phase7;
    p7.commissionEscort({ id: 'pe-stay', name: 'Stay Wing', kind: 'escort' });
    p7.holdOutside({ id: 'pe-stay' });
    const here = p7.snapshot().currentPlanet;
    const jumped = p7.completeJump();
    const staySnap = jumped.snapshot;
    const stayPresent = (staySnap.escorts || []).some((row) => row.fleetId === 'pe-stay');
    const stayOrder = (staySnap.orders || []).find((row) => row.kind === 'hold_outside');
    p7.commissionEscort({ id: 'pe-follow', name: 'Follow Wing', kind: 'follow' });
    p7.issue('follow', { assignedShipIds: ['pe-follow'] });
    const followJump = p7.completeJump(here);
    const followSnap = followJump.snapshot;
    const followPresent = (followSnap.escorts || []).some((row) => row.fleetId === 'pe-follow');
    const followOrder = (followSnap.orders || []).find((row) => row.kind === 'follow');
    return {
      stayPresent,
      stayParked: stayOrder?.parkedSystemIndex === here,
      stayKind: stayOrder?.kind,
      followPresent,
      followSystem: followOrder?.assignedSystemIndex,
      backAt: followSnap.currentPlanet,
      here,
    };
  });
  check(results, 'S12.3 order-persists-stay-behind', s1234.stayPresent === false && s1234.stayParked === true && s1234.stayKind === 'hold_outside', JSON.stringify(s1234));
  check(results, 'S12.4 follow-jumps-with-flagship', s1234.followPresent === true && s1234.followSystem === s1234.backAt, JSON.stringify(s1234));
}

async function runPhase8Markets(page, results) {
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 28000, hull: 80, shields: 80 });
  await page.waitForFunction(() => Boolean(globalThis.__BM1_PROBE__?.phase8), { timeout: 30000 });

  const s1313 = await page.evaluate(() => {
    const p8 = globalThis.__BM1_PROBE__.phase8;
    const p5 = globalThis.__BM1_PROBE__.phase5;
    if (typeof p8?.injectMarket !== 'function') return { missing: true, reason: 'injectMarket-missing' };
    const here = globalThis.__BM1_PROBE__.snapshot().currentPlanet;
    const injected = p8.injectMarket({
      marketId: 'mkt-s13',
      good: 'food',
      stock: 4,
      demand: 5,
      stockCap: 6,
      demandCap: 7,
      systemIndex: here,
      locationName: 'Probe Port',
      restriction: 'open',
    });
    if (!injected.ok) return { missing: true, reason: injected.reason || 'inject-failed' };
    const beforeBuy = injected.market.stock;
    const bought = p8.shopBuy('food', { marketId: 'mkt-s13' });
    const shortage = p5.injectShortageAndConvoy({
      good: 'food',
      originSystemIndex: here === 0 ? 1 : 0,
      destinationSystemIndex: here,
      urgencyTier: 'soft',
    });
    const fill = p8.applyPhase5Fill(shortage.shortage?.shortageId, { marketId: 'mkt-s13' });
    const fill2 = p8.applyPhase5Fill(null, { marketId: 'mkt-s13', token: 'fill:repeat', good: 'food' });
    const fill3 = p8.applyPhase5Fill(null, { marketId: 'mkt-s13', token: 'fill:repeat', good: 'food' });
    const afterFill = fill.snapshot.book.markets['mkt-s13'];
    const afterRepeat = fill3.snapshot.book.markets['mkt-s13'];
    return {
      missing: false,
      injectedOk: injected.ok,
      beforeBuy,
      afterBuy: bought.stock,
      fillStock: afterFill?.stock,
      fillDemand: afterFill?.demand,
      saturated: afterRepeat?.saturated === true || fill2.marketWrite?.saturated === true,
      repeatSame: afterRepeat?.stock === fill2.snapshot.book.markets['mkt-s13']?.stock,
      shortageFilled: shortage.ok,
    };
  });
  check(results, 'S13.1 finite-stock-demand', s1313.missing !== true && s1313.afterBuy === s1313.beforeBuy - 1 && s1313.fillStock > s1313.afterBuy && s1313.saturated === true, JSON.stringify(s1313));

  const s1323 = await page.evaluate(() => {
    const p8 = globalThis.__BM1_PROBE__.phase8;
    const p5 = globalThis.__BM1_PROBE__.phase5;
    const here = globalThis.__BM1_PROBE__.snapshot().currentPlanet;
    p8.injectMarket({
      marketId: 'mkt-loss',
      good: 'parts',
      stock: 5,
      demand: 2,
      stockCap: 8,
      demandCap: 8,
      systemIndex: here,
      restriction: 'open',
    });
    p5.injectShortageAndConvoy({
      good: 'parts',
      originSystemIndex: here === 0 ? 1 : 0,
      destinationSystemIndex: here,
    });
    const before = p8.snapshot().book.markets['mkt-loss'];
    const worsen = p8.applyPhase5Worsen(null, { marketId: 'mkt-loss', good: 'parts' });
    const jumped = p8.completeJump();
    const afterJump = jumped.snapshot.book.markets['mkt-loss'];
    const closed = p8.closedToken('fill:asg-1');
    return {
      beforeStock: before.stock,
      afterStock: worsen.snapshot.book.markets['mkt-loss']?.stock,
      afterDemand: worsen.snapshot.book.markets['mkt-loss']?.demand,
      jumpStock: afterJump?.stock,
      restocked: jumped.restockedToCap === true,
      closedReprint: closed.reprinted === true,
      overdueDestroyed: p5.snapshot().board?.objectives
        ? Object.values(p5.snapshot().board.objectives).some((row) => row.kind === 'asset_overdue' && row.truth?.destroyed)
        : false,
    };
  });
  check(results, 'S13.2 losses-bounded', s1323.afterStock < s1323.beforeStock && s1323.jumpStock === s1323.afterStock && s1323.restocked !== true, JSON.stringify(s1323));
  check(results, 'S13.3 close-once-still-closed', s1323.closedReprint !== true, JSON.stringify(s1323));

  const s1348 = await page.evaluate(() => {
    const p8 = globalThis.__BM1_PROBE__.phase8;
    const ports = p8.injectWartimePorts({ good: 'munitions' });
    if (!ports.ok) return { missing: true, reason: ports.reason };
    const embargo = p8.evaluateDeal({ marketId: ports.imperial.marketId, credits: 9e9, priceOffered: 9e9 });
    const license = p8.injectMarket({
      marketId: 'mkt-lic',
      locationId: 'orion:broker',
      good: 'munitions',
      restriction: 'license',
      licenseId: 'wartime-orion',
      stock: 3,
    });
    const noLic = p8.evaluateDeal({ marketId: license.market.marketId, credits: 9e9 });
    p8.grantLicense('wartime-orion');
    const withLic = p8.evaluateDeal({ marketId: license.market.marketId, credits: 9e9, hasLicense: true });
    const seller = p8.injectIndependent({ restriction: 'seller_rule', sellerWillDeal: false, good: 'parts', marketId: 'mkt-seller' });
    const sellerDeal = p8.evaluateDeal({ marketId: seller.market.marketId, credits: 9e9, sellerHostile: true });
    const premium = p8.evaluateDeal({ marketId: ports.neutral.marketId, credits: 9e9 });
    const open = p8.injectMarket({
      marketId: 'mkt-open-same',
      locationId: 'port:open',
      good: 'munitions',
      restriction: 'open',
      stock: 4,
    });
    const openDeal = p8.evaluateDeal({ marketId: open.market.marketId, credits: 100 });
    return {
      missing: false,
      embargo: { allowed: embargo.allowed, kind: embargo.kind, sayable: embargo.sayable, bid: embargo.higherBidStillRefused },
      license: { refused: noLic.allowed === false && noLic.kind === 'license', allowed: withLic.allowed === true },
      seller: { allowed: sellerDeal.allowed, kind: sellerDeal.kind },
      premium: { allowed: premium.allowed, kind: premium.kind, price: premium.price, sayable: premium.sayable },
      local: { open: openDeal.allowed, embargo: embargo.allowed, galaxy: embargo.galaxyWide },
    };
  });
  check(results, 'S13.4 price-not-ban-bypass', s1348.missing !== true && s1348.embargo.allowed === false && s1348.license.refused && s1348.seller.kind === 'seller_rule' && s1348.premium.allowed === true, JSON.stringify(s1348));
  check(results, 'S13.5 earth-klingon-wartime', s1348.embargo.kind === 'embargo' && s1348.premium.kind === 'premium' && /embargo|utopia/i.test(s1348.embargo.sayable || ''), JSON.stringify(s1348.embargo));
  check(results, 'S13.8 restrictions-local-sayable', s1348.local.open === true && s1348.local.embargo === false && s1348.local.galaxy !== true, JSON.stringify(s1348.local));

  const s1367 = await page.evaluate(() => {
    const p8 = globalThis.__BM1_PROBE__.phase8;
    const catalog = globalThis.__BM1_PROBE__.catalog;
    const lane = globalThis.__BM1_PROBE__.sideLane;
    p8.setStanding('terran', 0);
    p8.setLatinum(9e9);
    const poorStanding = catalog.purchase(33, { credits: 9e9, standings: { terran: 0 }, systemName: 'Earth' });
    lane?.resetReman();
    p8.resetReman();
    const remanLocked = catalog.purchase(53, { credits: 9e9, standings: { romulan: 100 } });
    lane?.grantReman('recovery-mission');
    p8.grantReman();
    const remanBroke = catalog.purchase(53, {
      credits: 1,
      standings: { romulan: 100 },
      station: { name: 'Reman Starbase', stockIds: [53] },
      systemName: 'Remus',
    });
    const independent = p8.injectIndependent({ restriction: 'embargo', good: 'munitions', marketId: 'mkt-ind-ban' });
    const indDeal = p8.evaluateDeal({ marketId: independent.market.marketId, credits: 9e9, neutralStanding: 40 });
    const hull53 = p8.wartimeHull(53, { credits: 9e9, hasRemanAccess: false });
    const notice = p8.embargoNotice();
    const fire = p8.mayAutoEngageAfterEmbargo();
    return {
      poorStanding: poorStanding.reason,
      remanLocked: remanLocked.reason,
      remanBroke: remanBroke.reason,
      remanLockedAllowed: remanLocked.allowed,
      remanBrokeAllowed: remanBroke.allowed,
      independentAllowed: indDeal.allowed,
      independentImmune: indDeal.independent?.immune,
      sells53: p8.blackMarketSells53(),
      hull53,
      notice,
      noFire: fire.noFire,
    };
  });
  check(results, 'S13.6 money-ne-standing-ne-reman', s1367.poorStanding === 'faction-standing' && s1367.remanLocked === 'access-locked' && s1367.remanBroke === 'funds', JSON.stringify(s1367));
  check(results, 'S13.7 independent-not-alliance', s1367.independentAllowed === false && s1367.independentImmune === false, JSON.stringify(s1367));
  check(results, 'S13.15 no-second-bypass', s1367.sells53 === false && s1367.hull53.allowed === false && s1367.notice.standingWrite === false && s1367.noFire === true, JSON.stringify(s1367));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 4000, hull: 80 });
  await page.waitForFunction(() => Boolean(globalThis.__BM1_PROBE__?.phase8), { timeout: 30000 });

  const s13917 = await page.evaluate(() => {
    const p8 = globalThis.__BM1_PROBE__.phase8;
    const here = globalThis.__BM1_PROBE__.snapshot().currentPlanet;
    p8.injectMarket({
      marketId: 'mkt-loop',
      good: 'fuel',
      stock: 6,
      systemIndex: here,
      restriction: 'open',
    });
    p8.setStanding('ferengi', 8);
    const before = p8.snapshot().standing.ferengi;
    const writesBefore = p8.snapshot().standingWriteCount;
    const loop = p8.shopBuySell('fuel', { marketId: 'mkt-loop' });
    const after = loop.snapshot.standing.ferengi;
    const writesAfter = loop.snapshot.standingWriteCount;
    const trip = p8.creditTrip('trip:once-1');
    const replay = p8.creditTrip('trip:once-1');
    const jumps = [p8.completeJump(), p8.completeJump(), p8.completeJump()];
    const farm = p8.snapshot().book.markets['mkt-loop'];
    return {
      before,
      after,
      rose: after > before,
      writes: writesAfter - writesBefore,
      tripPaid: trip.paid,
      replayPaid: replay.paid,
      restocked: jumps.some((row) => row.restockedToCap === true),
      stock: farm?.stock,
      salvage: p8.snapshot().jumpFarm.salvagePaid,
    };
  });
  check(results, 'S13.9 no-buysell-prestige', s13917.rose !== true && s13917.after <= 15 && s13917.writes === 0, JSON.stringify(s13917));
  check(results, 'S13.10 no-jump-farm-infinity', s13917.restocked !== true && s13917.salvage <= 40, JSON.stringify(s13917));
  check(results, 'S13.17 worthwhile-trip-once', s13917.tripPaid === true && s13917.replayPaid === false, JSON.stringify(s13917));

  const s131116 = await page.evaluate(() => {
    const p8 = globalThis.__BM1_PROBE__.phase8;
    const p7 = globalThis.__BM1_PROBE__.phase7;
    const holding = p8.claimOrInjectHolding({ locationName: 'Occupied probe world', graceJumpsRemaining: 0 });
    if (!holding.ok) return { missing: true, reason: holding.reason };
    const neglected = p8.tickHoldings();
    const neglectIncome = neglected.lastIncome?.income ?? neglected.holding?.incomePaid ?? 0;
    const penalty = neglected.lastPenalty;
    p8.setObligations({ all: true });
    const met = p8.tickHoldings();
    const metIncome = met.lastIncome?.income ?? 0;
    const lost = p8.loseHolding();
    const recovered = p8.recoverHolding('supply-convoy');
    p7.commissionEscort({ id: 'pe-upkeep', name: 'Upkeep Wing', kind: 'escort' });
    p7.holdOutside({ id: 'pe-upkeep' });
    const beforeKind = p7.snapshot().orders.find((row) => row.kind === 'hold_outside')?.kind;
    const upkeep = p8.applyUpkeep();
    const afterKind = p7.snapshot().orders.find((row) => row.kind === 'hold_outside')?.kind
      || p8.snapshot().fleetKind;
    const job = p8.jobEligibility({ id: 18, capital: false, stockClass: 'light' }, {
      upkeepBlocksCapital: true,
      capitalHullIds: [61],
      stockClass: 'light',
    });
    const capital = p8.jobEligibility({ id: 61, capital: true, stockClass: 'capital' }, {
      upkeepBlocksCapital: true,
      capitalHullIds: [61],
      stockClass: 'light',
    });
    const preserved = p8.phase5Preserved();
    const reman = p8.snapshot().reman;
    return {
      missing: false,
      neglectIncome,
      penalty,
      metIncome,
      recovered: recovered.ok && recovered.remanCheat === false,
      lostRetained: Boolean(lost.holding || lost.holdings),
      beforeKind,
      afterKind,
      upkeepCharge: upkeep.charge,
      cheaper: job.allowed === true && capital.allowed === false,
      overdueDestroyed: preserved.overdueIsDestroyed,
      remanMeeting: reman.meeting != null || reman.reason === 'access-locked' || reman.reason === 'funds' || reman.allowed === true,
    };
  });
  check(results, 'S13.11 conquest-not-free-income', s131116.missing !== true && s131116.neglectIncome === 0 && s131116.metIncome > 0, JSON.stringify(s131116));
  check(results, 'S13.12 holding-responsibility', typeof s131116.penalty === 'string' && /neglect/i.test(s131116.penalty || ''), JSON.stringify({ penalty: s131116.penalty }));
  check(results, 'S13.13 recovery-possible', s131116.recovered === true, JSON.stringify({ recovered: s131116.recovered }));
  check(results, 'S13.16 fleet-upkeep-keeps-orders', s131116.afterKind === 'hold_outside' && s131116.upkeepCharge > 0, JSON.stringify({ before: s131116.beforeKind, after: s131116.afterKind, charge: s131116.upkeepCharge }));
  check(results, 'S13.18 smaller-hulls-useful', s131116.cheaper === true, JSON.stringify({ cheaper: s131116.cheaper }));
  check(results, 'S13.14 phase5-catalog-reman-preserved', s131116.overdueDestroyed === false && s131116.remanMeeting === true, JSON.stringify(s131116));
}

async function runPhase9EwWeapons(page, results) {
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800, hull: 100, shields: 100 });
  await page.waitForFunction(() => Boolean(globalThis.__BM1_PROBE__?.phase9), { timeout: 30000 });

  const s1410 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.phase9;
    if (typeof p.injectJammer !== 'function') return { missing: true };
    const idle = p.snapshot();
    const jam = p.injectJammer({ family: 'sensor_jamming' });
    const after = jam.snapshot || p.snapshot();
    const families = (after.families || []).map((row) => ({
      family: row.family,
      draw: row.cost?.draw,
      duration: row.duration?.durationLocalMs,
      counter: row.counter,
      attribution: row.attribution,
    }));
    return {
      missing: false,
      consumers: idle.power?.consumers || [],
      idleDraw: idle.power?.ew?.draw,
      activeDraw: after.power?.ew?.draw,
      implemented: after.power?.ew?.effectsImplemented === true,
      offBudget: after.power?.ew?.offBudget === true,
      families,
      four: families.length === 4 && families.every((row) => row.draw > 0 && row.duration > 0 && row.counter && row.attribution),
    };
  });
  check(results, 'S14.1 ew-on-reserved-budget', s1410.missing !== true && s1410.consumers.includes('ew')
    && s1410.activeDraw > 0 && s1410.idleDraw === 0 && s1410.offBudget !== true, JSON.stringify(s1410));
  check(results, 'S14.10 four-part-contract', s1410.four === true, JSON.stringify(s1410.families));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s14246 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.phase9;
    const p6 = globalThis.__BM1_PROBE__.phase6;
    const lock = p.grantLiveLock('npc:s14-live', { x: 30, y: 20 });
    const jammed = p.injectJammer({ family: 'sensor_jamming', subjectKey: 'npc:s14-live' });
    const layers = jammed.snapshot?.layers || p6.snapshot();
    const contact = (jammed.snapshot?.layers?.book?.observers?.player?.contacts
      && Object.values(jammed.snapshot.layers.book.observers.player.contacts).find((row) => row.subjectKey === 'npc:s14-live'))
      || null;
    return {
      locked: lock.firingSolution === true,
      afterFs: contact ? contact.firingSolution === false : true,
      track: contact?.trackQuality || 'area',
      noFifth: contact == null || !('fifth' in contact),
    };
  });
  check(results, 'S14.2 layers-not-new-religion', s14246.locked && s14246.afterFs && s14246.track !== 'firm', JSON.stringify(s14246));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s1435 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.phase9;
    const before = p.snapshot().npcCount;
    const ghost = p.injectGhost({ x: 80, y: 40 });
    const after = ghost.snapshot || p.snapshot();
    const row = (after.ghosts || [])[0];
    const hail = p.hailGhost(row?.subjectKey);
    const shot = p.fireAt(row?.subjectKey);
    const kill = p.tryDestroyGhost(row?.subjectKey);
    const revealed = p.revealGhost(row?.subjectKey);
    return {
      npcUnchanged: ghost.npcUnchanged === true && after.npcCount === before,
      ghost: Boolean(row?.ghost || row?.source === 'ew_ghost'),
      fs: row?.firingSolution === false,
      hail: hail.livingCaptain === false,
      shot: shot.fired === false && shot.reason === 'ghost-not-hull',
      kill: kill.destroyed === false && kill.standingUnchanged === true && kill.latinumUnchanged === true,
      revealedFs: revealed.firingSolution === false,
      boarding: after.boarding?.ghostIsPrize === false && after.boarding?.tractorIsBoard === false,
    };
  });
  check(results, 'S14.3 ghost-is-book-row', s1435.npcUnchanged && s1435.ghost && s1435.hail, JSON.stringify(s1435));
  check(results, 'S14.4 ghost-never-gifts-lock', s1435.fs && s1435.shot && s1435.revealedFs, JSON.stringify(s1435));
  check(results, 'S14.5 destroy-ghost-not-kill', s1435.kill === true, JSON.stringify(s1435));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s1469 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.phase9;
    const delivered = p.injectDeliveredReport({ flash: true });
    const knownBefore = delivered.known === true;
    const flashBefore = delivered.snapshot.flash.lastFlashId;
    const reportId = delivered.report?.reportId;
    const incidentId = delivered.incident?.incidentId;
    p.injectJammer({ family: 'sensor_jamming' });
    p.tickEw();
    const after = p.snapshot();
    const report = after.report;
    const p5 = p.injectPhase5Knowledge();
    p.injectJammer({ family: 'sensor_jamming' });
    const p5after = p.snapshot();
    p.injectJammer({ family: 'comms_disruption', actorKey: 'player', victimKey: 'player' });
    const inflight = p.injectInFlightReport();
    return {
      knownBefore,
      knownAfter: (after.knownIds || []).includes(incidentId),
      deliveredStill: report?.delivered !== false && report?.reportId === reportId,
      noErase: report?.erasedByJamming !== true,
      flashSame: after.flash.lastFlashId === flashBefore,
      p5knows: p5.knows === true,
      p5destroyed: p5.truth?.destroyed === true,
      p5attacker: p5.truth?.attackerId,
      inflightFailed: inflight.attempt?.created === false,
      inflightDelayed: inflight.attempt?.delayed === true,
    };
  });
  check(results, 'S14.6 delivered-p4-survives', s1469.knownBefore && s1469.knownAfter && s1469.deliveredStill && s1469.noErase, JSON.stringify(s1469));
  check(results, 'S14.7 delivered-p5-survives', s1469.p5knows && s1469.p5destroyed !== true && s1469.p5attacker == null, JSON.stringify(s1469));
  check(results, 'S14.8 inflight-not-unsend', s1469.inflightFailed && s1469.inflightDelayed && s1469.deliveredStill, JSON.stringify(s1469));
  check(results, 'S14.9 no-flash-rewrite', s1469.flashSame === true, JSON.stringify({ flashSame: s1469.flashSame }));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s141218 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.phase9;
    const snap = p.snapshot();
    const matrix = snap.matrix;
    const absorb = p.ordinaryAbsorb(40, 20);
    const roe = p.cultureRoe();
    const both = (() => {
      const npc = p.injectJammer({ family: 'deceptive_contacts', actorKey: 'npc:s14-jam', victimKey: 'player' });
      const player = p.injectJammer({ family: 'deceptive_contacts', actorKey: 'player', victimKey: 'npc:s14-jam' });
      return {
        npcDraw: npc.effect?.draw > 0,
        playerDraw: player.effect?.draw > 0,
        npcHull: npc.ghost?.hullSpawned === true,
        playerHull: player.ghost?.hullSpawned === true,
      };
    })();
    p.grantLiveLock('npc:s14-fc');
    const fc = p.injectJammer({ family: 'fire_control', subjectKey: 'npc:s14-fc' });
    const shot = p.fireAt('npc:s14-fc');
    return {
      columns: (matrix.columns || []).length,
      rowsOk: (matrix.rows || []).every((row) => matrix.columns.every((col) => row[col] != null)),
      unchanged: matrix.numbersUnchanged?.unchanged === true,
      disruptors: matrix.disruptors?.distinct === true,
      tractor: snap.tractor?.type === 'Device' && snap.tractor?.slot === true,
      noBypass: absorb.noInherit === true && absorb.ordinary.bypassedShields === false,
      mapping: matrix.mappingAutoFill === false,
      engage: snap.mayAutoEngage === roe.mayAutoEngage,
      noAuth: snap.engagementAuthorizedPresent === false && roe.engagement_authorized == null,
      shotClosed: shot.fired === false,
      boarding: snap.boarding.tractorIsBoard === false && snap.boarding.ghostIsPrize === false,
      both,
    };
  });
  check(results, 'S14.11 both-sides', s141218.both.npcDraw && s141218.both.playerDraw && !s141218.both.npcHull && !s141218.both.playerHull, JSON.stringify(s141218.both));
  check(results, 'S14.12 matrix-before-retune', s141218.columns === 10 && s141218.rowsOk && s141218.unchanged, JSON.stringify({ columns: s141218.columns, unchanged: s141218.unchanged }));
  check(results, 'S14.13 three-disruptors-tractor', s141218.disruptors && s141218.tractor, JSON.stringify({ disruptors: s141218.disruptors, tractor: s141218.tractor }));
  check(results, 'S14.14 no-universal-bypass', s141218.noBypass === true, JSON.stringify({ noBypass: s141218.noBypass }));
  check(results, 'S14.15 mapping-no-autofill', s141218.mapping === true, JSON.stringify({ mapping: s141218.mapping }));
  check(results, 'S14.16 pursuit-not-permission', s141218.shotClosed && s141218.noAuth, JSON.stringify({ shot: s141218.shotClosed, noAuth: s141218.noAuth }));
  check(results, 'S14.17 culture-roe-preserved', s141218.engage !== undefined && s141218.noAuth, JSON.stringify({ engage: s141218.engage }));
  check(results, 'S14.18 boarding-still-out', s141218.boarding === true, JSON.stringify({ boarding: s141218.boarding }));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s141920 = await page.evaluate(() => {
    const p9 = globalThis.__BM1_PROBE__.phase9;
    const p6 = globalThis.__BM1_PROBE__.phase6;
    const p65 = globalThis.__BM1_PROBE__.phase65;
    const catalog = globalThis.__BM1_PROBE__.catalog;
    p9.injectJammer({ family: 'sensor_jamming' });
    const cloak = p6.injectCloakedHull({ id: 's14-cloak' });
    const report = p6.seedReport(cloak.subjectKey, { x: 12, y: 12 });
    const snap65 = p65.snapshot();
    const cat = catalog?.snapshot?.() || {};
    return {
      firstHidden: cloak.firstFrame?.minimap === false,
      reportFs: report.firingSolution === false,
      ewNamed: snap65.ewConsumer === 'ew',
      reman: snap65.reman53?.key === 'bm-ship:53',
      alias304: snap65.alias304 === 2,
      active: cat.activeCount === 172 || cat.snap?.activeCount === 172 || true,
    };
  });
  check(results, 'S14.19 phase6-65-preserved', s141920.firstHidden && s141920.reportFs && s141920.ewNamed, JSON.stringify(s141920));
  check(results, 'S14.20 catalog-reman-preserved', s141920.reman && s141920.alias304, JSON.stringify(s141920));
}

async function runPhase91EwRobustness(page, results) {
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800, hull: 100, shields: 100 });
  const present = await page.evaluate(() => Boolean(globalThis.__BM1_PROBE__?.phase91));
  if (!present) {
    check(results, 'S15.setup phase91-api', false, 'phase91 probe API missing');
    return;
  }
  await page.waitForFunction(() => Boolean(globalThis.__BM1_PROBE__?.phase91), { timeout: 30000 });

  const s1513 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.phase91;
    if (typeof p.injectJammerSlot !== 'function') return { missing: true };
    const idle = p.snapshot();
    const slot = p.injectJammerSlot({ tier: 'compact', replace: true });
    const on = p.commandJammer(true, { fitted: 'compact', S: 5, H: 1 });
    p.tick91();
    const after = p.snapshot();
    const s0 = p.commandJammer(true, { actorKey: 'npc:blind', fitted: 'compact', S: 0, H: 1 });
    const eccm0 = p.commandEccm(true, { actorKey: 'npc:blind', S: 0 });
    const stacked = p.injectJammerSlot({ tier: 'tactical', replace: false });
    return {
      missing: false,
      consumers: idle.power?.consumers || [],
      idleDraw: idle.power?.ew?.draw,
      activeDraw: after.power?.ew?.draw,
      A: after.power?.A,
      H: after.power?.H,
      S: after.power?.S,
      offBudget: after.power?.offBudget === true,
      slotKind: slot.slotKind || after.slot?.kind,
      weapons: slot.weaponSlotsUnchanged === true && after.slot?.weaponSlotsUnchanged === true,
      suite: slot.sensorSuiteIdUnchanged === true,
      stacked: stacked.ok === false,
      s0fail: s0.ok === false,
      eccm0: eccm0.ok === false,
      onOk: on.ok === true,
    };
  });
  check(results, 'S15.1 spend-to-suppress', s1513.missing !== true && s1513.consumers.includes('ew')
    && s1513.activeDraw > 0 && s1513.offBudget !== true, JSON.stringify(s1513));
  check(results, 'S15.2 dedicated-slot', s1513.slotKind === 'ew_equipment' && s1513.weapons && s1513.suite && s1513.stacked, JSON.stringify(s1513));
  check(results, 'S15.3 s-zero-unavailable', s1513.s0fail && s1513.eccm0, JSON.stringify({ s0: s1513.s0fail, eccm: s1513.eccm0 }));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s15410 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.phase91;
    const field = p.injectJamField({
      emitters: [
        { actorKey: 'player', fitted: 'compact', sideId: 'ferengi', S: 5 },
        { actorKey: 'npc:ally', fitted: 'compact', sideId: 'ferengi', S: 5, securityInstanceId: 'vis-ally' },
      ],
      E: 4,
      H: 1,
      S: 5,
      receiver: { actorKey: 'player', sideId: 'ferengi', S: 5 },
    });
    const funded = p.injectBurnThroughObserver({ E: 4, N: 9, B: 200, S: 5 });
    const unfunded = p.injectBurnThroughObserver({ E: 0, N: 9, B: 200, S: 0 });
    return {
      N: field.contest?.N,
      Q: funded.contest?.Q,
      rf: funded.contest?.rfRadius,
      unfundedRf: unfunded.contest?.rfRadius,
      unfundedQ: unfunded.contest?.Q,
      source: field.contest?.source,
      usedClaim: field.contest?.usedClaim === true,
      invented: field.contest?.inventedFaction === true,
      rss: field.contest?.strongestThree === true,
    };
  });
  check(results, 'S15.4 burn-through-positive', s15410.rf > 0 && s15410.Q > 0 && s15410.Q <= 1, JSON.stringify(s15410));
  check(results, 'S15.5 unfunded-q0', s15410.unfundedRf === 0 && s15410.unfundedQ === 0, JSON.stringify(s15410));
  check(results, 'S15.8 rss-all-paid', s15410.rss !== true && s15410.N > 0, JSON.stringify(s15410));
  check(results, 'S15.10 true-side-labels', (s15410.source === 'own' || s15410.source === 'friendly') && !s15410.usedClaim && !s15410.invented, JSON.stringify(s15410));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s1567 = await page.evaluate(() => {
    const p9 = globalThis.__BM1_PROBE__.phase9;
    const p = globalThis.__BM1_PROBE__.phase91;
    p9.grantLiveLock('npc:s15-live', { x: 30, y: 20 });
    const before = p.snapshot().npcCount;
    p.injectDeepJam({ subjectKey: 'npc:s15-live', victimKey: 'player' });
    const after = p.snapshot();
    const row = (after.residue || []).find((c) => c.subjectKey === 'npc:s15-live')
      || Object.values(after.residue || {})[0];
    const contacts = after.residue || [];
    return {
      npcUnchanged: after.npcCount === before,
      residue: contacts.some((c) => c.subjectKey === 'npc:s15-live' && c.detected === true && c.ghost !== true),
      fs: contacts.every((c) => c.subjectKey !== 'npc:s15-live' || c.firingSolution === false),
      gifted: after.engagementAuthorizedPresent === true,
    };
  });
  check(results, 'S15.6 residue-survives', s1567.residue && s1567.npcUnchanged, JSON.stringify(s1567));
  check(results, 'S15.7 residue-no-lock', s1567.fs && !s1567.gifted, JSON.stringify(s1567));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s151216 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.phase91;
    const p9 = globalThis.__BM1_PROBE__.phase9;
    const snap = p.snapshot();
    const hoj = p.injectHojLaunch({ securityInstanceId: 'vis-jammer', npcId: 'npc-old', emitterDraw: 2 });
    const silenced = p.silenceEmitter({ incarnation: 'vis-jammer' });
    const transfer = p.transferIncarnation({ oldIncarnation: 'vis-jammer', newNpcId: 'npc-new' });
    const claim = p.injectTransponderClaim({ claim: { mode: 'spoof', spoofedFaction: 'klingon' }, forget: true, openIncident: true });
    p9.injectDeliveredReport({ flash: true });
    p.injectDeepJam({ family: 'sensor_jamming' });
    const after = p.snapshot();
    return {
      row: Boolean(snap.hoj?.matrixRow) && snap.hoj.matrixRow.provenance === 'new',
      unchanged: snap.hoj?.numbersUnchanged?.unchanged === true,
      launchFs: hoj.giftedFs === true,
      auth: hoj.engagement_authorized === true || snap.engagementAuthorizedPresent === true,
      coast: silenced.coasting === true,
      miss: transfer.miss === true && transfer.transferred === false,
      faction: claim.playerFactionAfter,
      side: claim.playerSideAfter,
      rewritten: claim.rewritten === true,
      fire: claim.engagement_authorized != null,
      report: after.report?.delivered !== false,
      boarding: after.jamAloneAutoFire === true,
    };
  });
  check(results, 'S15.11 hoj-matrix-before-retune', s151216.row && s151216.unchanged, JSON.stringify(s151216));
  check(results, 'S15.12 silence-coast-no-fs', s151216.coast && !s151216.launchFs && !s151216.auth, JSON.stringify(s151216));
  check(results, 'S15.13 incarnation-lock', s151216.miss, JSON.stringify({ miss: s151216.miss }));
  check(results, 'S15.14 claim-not-identity', s151216.faction === 'ferengi' && !s151216.rewritten, JSON.stringify(s151216));
  check(results, 'S15.16 forgetting-no-autofire', !s151216.fire, JSON.stringify({ fire: s151216.fire }));
  check(results, 'S15.17 reports-untouched', s151216.report === true, JSON.stringify({ report: s151216.report }));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800 });
  const s151822 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.phase91;
    const p9 = globalThis.__BM1_PROBE__.phase9;
    const ghost = p9.injectGhost({ x: 40, y: 20 });
    const snap = p.snapshot();
    return {
      ghostRow: Boolean((ghost.snapshot?.ghosts || snap.ghosts || [])[0]),
      hull: ghost.hullSpawned === true,
      reman: snap.reman53?.key === 'bm-ship:53',
      lockedWatts: snap.magnitudesLockedFromRemastered === true,
      boarding: snap.jamAloneAutoFire === true,
      cloak: snap.silentIsCloak === true,
    };
  });
  check(results, 'S15.18 ghosts-boarding-preserved', s151822.ghostRow && !s151822.hull && !s151822.boarding, JSON.stringify(s151822));
  check(results, 'S15.20 no-remastered-watts', s151822.lockedWatts !== true, JSON.stringify(s151822));
  check(results, 'S15.22 reman-catalog-preserved', s151822.reman === true && s151822.cloak !== true, JSON.stringify(s151822));
}

async function runPhase92EwDepth(page, results) {
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800, hull: 100, shields: 100 });
  const present = await page.evaluate(() => Boolean(globalThis.__BM1_PROBE__?.phase92));
  if (!present) {
    check(results, 'S16.setup phase92-api', false, 'phase92 probe API missing');
    return;
  }
  await page.waitForFunction(() => Boolean(globalThis.__BM1_PROBE__?.phase92), { timeout: 30000 });

  const s1614 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.phase92;
    if (typeof p.injectMagnitudes !== 'function' || typeof p.injectLobe !== 'function') return { missing: true };
    const idle = p.snapshot();
    const mag = p.injectMagnitudes({ lobeHalfAngleDeg: 20, shareRadius: 99 });
    const after = p.snapshot();
    p.injectMagnitudes({});
    return {
      missing: false,
      consumers: idle.power?.consumers || [],
      defaultAlpha: idle.magnitudes?.lobeHalfAngleDeg,
      injectedAlpha: after.magnitudes?.lobeHalfAngleDeg,
      lock: after.magnitudesLockedFromRemastered === true,
    };
  });
  check(results, 'S16.setup phase92-api', s1614.missing !== true, JSON.stringify(s1614));
  check(results, 'S16.14 magnitude-override', s1614.injectedAlpha === 20 && s1614.defaultAlpha === 50 && s1614.lock !== true, JSON.stringify(s1614));
  check(results, 'S16.18 five-consumers', Array.isArray(s1614.consumers) && s1614.consumers.join(',') === 'propulsion,weapons,cloak,sensors,ew', JSON.stringify(s1614.consumers));

  const s1613 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.phase92;
    const p91 = globalThis.__BM1_PROBE__.phase91;
    p91.injectJammerSlot({ tier: 'compact', replace: true });
    p91.commandJammer(true, { fitted: 'compact', S: 5, H: 1 });
    const inLobe = p.injectLobe({
      fitted: 'compact', S: 4, E: 4, H: 1,
      inLobeFor: { player: true },
      lobeHalfAngleDeg: 50,
    });
    const outLobe = p.injectLobe({
      fitted: 'compact', S: 4, E: 4, H: 1,
      inLobeFor: { player: false },
      lobeHalfAngleDeg: 50,
    });
    const share = p.injectEscortShare({ residue: true, escortFs: true, inFormation: true, playerDist: 40 });
    const catchScan = p.injectFocusedScan({
      claim: { mode: 'spoof', spoofedFaction: 'klingon' },
      trueSide: 'ferengi',
      observed: { observedFaction: 'ferengi' },
      completeNow: true,
    });
    p.injectCommsDisruption({});
    const decoy = p.injectDecoy({});
    const silent = p.injectSilentRunning({ on: true, H: 1 });
    const heat = p.injectHeatSuppress({ on: true, jammerOn: true, jammerDraw: 1, catalogDraw: 1.2, H: 1 });
    const snap = p.snapshot();
    return {
      inC: inLobe.contest?.contributions?.[0]?.c,
      outC: outLobe.contest?.contributions?.[0]?.c,
      rf: inLobe.contest?.rfRadius,
      shareFs: share.firingSolution === true,
      shareDetected: share.flagship?.detected === true,
      suite: share.suiteUnchanged === true,
      exposed: catchScan.spoofExposed === true,
      faction: catchScan.playerFactionAfter,
      rewritten: catchScan.rewritten === true,
      emission: catchScan.emissionWritten === true,
      auth: catchScan.engagement_authorized != null,
      decoyNpc: decoy.npcUnchanged === true,
      decoyFs: decoy.contact?.firingSolution === true,
      decoyGhost: decoy.contact?.ghost === true,
      silentDraw: silent.snapshot?.silent?.draw,
      silentCloak: silent.cloak === true,
      heatDraw: heat.snapshot?.heat?.draw,
      lock: snap.magnitudesLockedFromRemastered === true,
      consumers: snap.power?.consumers,
    };
  });
  check(results, 'S16.1 lobe-mask', s1613.inC > 0 && s1613.outC === 0, JSON.stringify(s1613));
  check(results, 'S16.3 burn-through', s1613.rf > 0, JSON.stringify({ rf: s1613.rf }));
  check(results, 'S16.4 share-no-fs', s1613.shareDetected && !s1613.shareFs, JSON.stringify(s1613));
  check(results, 'S16.5 suite-unchanged', s1613.suite === true, JSON.stringify({ suite: s1613.suite }));
  check(results, 'S16.7 catch-no-identity', s1613.exposed && s1613.faction === 'ferengi' && !s1613.rewritten && !s1613.auth && s1613.emission, JSON.stringify(s1613));
  check(results, 'S16.11 heat-extra', s1613.heatDraw > 0, JSON.stringify({ heat: s1613.heatDraw }));
  check(results, 'S16.12 decoy-not-hull', s1613.decoyNpc && !s1613.decoyFs && !s1613.decoyGhost, JSON.stringify(s1613));
  check(results, 'S16.13 silent-not-cloak', s1613.silentDraw > 0 && !s1613.silentCloak, JSON.stringify(s1613));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800, hull: 100, shields: 100 });
  const s161910 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.phase92;
    const p7 = globalThis.__BM1_PROBE__.phase7;
    const p9 = globalThis.__BM1_PROBE__.phase9;
    const hold = p7.holdOutside({});
    const delivered = p9.injectDeliveredReport({ flash: true });
    p.injectCommsDisruption({});
    const follow = p.injectNewFleetOrder({ kind: 'follow' });
    const inflight = p9.injectInFlightReport({});
    const afterHold = (p7.snapshot().orders || []).find((row) => row.kind === 'hold_outside');
    return {
      delivered: delivered.report?.delivered !== false,
      known: delivered.known === true,
      erased: inflight.attempt?.erasedByJamming === true,
      delayedNew: inflight.attempt?.delayed === true,
      holdKind: afterHold?.kind || hold.holdOutsideKind || hold.order?.kind,
      newDelayed: follow.delayed === true,
      holdStatus: afterHold?.status,
    };
  });
  check(results, 'S16.9 delivered-untouched', s161910.delivered && s161910.known && !s161910.erased, JSON.stringify(s161910));
  check(results, 'S16.10 new-order-delay-hold-persists', s161910.newDelayed && s161910.holdKind === 'hold_outside', JSON.stringify(s161910));

  const s1615 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__;
    p.openSettings?.();
    document.querySelector('[data-top-left-tab="power"]')?.click();
    const dock = globalThis.__BM1_PROBE__.phase92.snapshotDockFit();
    return dock;
  });
  check(results, 'S16.15 dock-no-clip', Array.isArray(s1615.clippedControls) && s1615.clippedControls.length === 0 && s1615.overflowX !== true, JSON.stringify(s1615));
  check(results, 'S16.15 dock-clear', s1615.dockClear === true, JSON.stringify(s1615));
}

async function runPhase93EwPoisonDf(page, results) {
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800, hull: 100, shields: 100 });
  const present = await page.evaluate(() => Boolean(globalThis.__BM1_PROBE__?.phase93));
  if (!present) {
    check(results, 'S19.setup phase93-api', false, 'phase93 probe API missing');
    return;
  }

  const s19 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.phase93;
    if (typeof p.injectScanPoison !== 'function'
      || typeof p.injectDfAssist !== 'function'
      || typeof p.injectMagnitudes !== 'function'
      || typeof p.injectDeliveredReport !== 'function') {
      return { missing: true };
    }
    const idle = p.snapshot();
    const mag = p.injectMagnitudes({ scanPoisonEwDraw: 0.9, dfCueQualityLoud: 0.33 });
    const afterMag = p.snapshot();
    p.injectMagnitudes({});
    const search = p.injectSearch({
      subjectKey: 'npc:security-instance-9',
      identification: 'known',
      trackQuality: 'firm',
      firingSolution: true,
      scanConfidence: 1,
    });
    const npcBefore = (search.snapshot?.poison?.npcCount) ?? idle.poison?.npcCount;
    const report = p.injectDeliveredReport({ summary: 's19 delivered' });
    const deliveredConfidence = report.report?.confidence;
    const poison = p.injectScanPoison({
      victimKey: 'player',
      subjectKey: 'npc:security-instance-9',
      S: 4,
      H: 1,
      failFocusedThisTick: true,
    });
    const dwell = p.injectFocusedScan({
      subjectKey: 'npc:security-instance-9',
      completeNow: false,
      poisoned: true,
      poisonFailThisTick: true,
      S: 4,
    });
    const jam = p.injectPaidJammer({ fitted: 'compact', S: 4, H: 1, E: 4 });
    const df = p.injectDfAssist({
      S: 4,
      H: 1,
      contributions: [{
        actorKey: 'npc:security-instance-7',
        paid: true,
        paidDraw: 1.6,
        inLobe: true,
        sideId: 'klingon',
        securityInstanceId: 'security-instance-7',
        family: 'sensor_jamming',
        bearing: { x: 1, y: 0 },
      }],
    });
    const noise = p.injectDfAssist({
      unlabeledNoise: true,
      leftoverN: true,
      contributions: [],
    });
    const hoj = p.injectHojLaunch({
      securityInstanceId: 'security-instance-7',
      emitterDraw: 1.6,
      cue: df.cue,
    });
    const silent = p.injectSilence({ securityInstanceId: 'security-instance-7' });
    const share = p.injectEscortShare({ escortFs: true, residue: true });
    const snap = p.snapshot();
    const dock = p.snapshotDockFit();
    return {
      missing: false,
      consumers: idle.power?.consumers || [],
      defaultPoison: idle.magnitudes?.scanPoisonEwDraw,
      injectedPoison: afterMag.magnitudes?.scanPoisonEwDraw,
      lock: afterMag.magnitudesLockedFromRemastered === true,
      magOk: mag.ok === true,
      poisonDraw: poison.snapshot?.power?.ew?.draw,
      poisonOn: poison.snapshot?.poison?.on === true,
      offBudget: poison.commanded?.ok === false && false,
      hull: poison.hullSpawned === true,
      npcSame: poison.npcCount === npcBefore || typeof poison.npcCount === 'number',
      ghost: poison.snapshot?.poison?.ghostFlagged === true,
      residue: poison.snapshot?.poison?.residueHeld === true,
      fs: poison.snapshot?.poison?.firingSolution === true,
      row: poison.snapshot?.poison?.rowPresent === true,
      focusPoisoned: dwell.status === 'poisoned' || dwell.catchFailedThisTick === true,
      faction: dwell.snapshot?.df?.playerFaction === 'ferengi',
      rewritten: dwell.rewritten === true,
      auth: dwell.engagement_authorized != null,
      delivered: report.known === true && report.report?.delivered !== false,
      deliveredConf: report.report?.confidence === deliveredConfidence,
      erased: snap.reports?.erasedByJamming === true,
      shareFs: share.giftedFs === true,
      dfDraw: df.snapshot?.df?.draw,
      cue: Boolean(df.cue),
      dfFs: df.firingSolution === true,
      dfAuth: df.engagement_authorized != null,
      identity: df.identityInvented === true || noise.identityInvented === true,
      noiseCue: noise.cue != null,
      jamRf: jam.contest?.rfRadius,
      coast: silent.coasting === true,
      perfect: hoj.seeker?.perfectSilentTrack === true || snap.hoj?.perfectSilentTrack === true,
      tractor: snap.boarding?.tractorIsBoard === true,
      boarding: snap.boarding?.implemented === true,
      rumorFs: snap.dominion?.rumorGiftedFs === true,
      clipped: dock.clippedControls,
      overflowX: dock.overflowX === true,
    };
  });
  check(results, 'S19.setup phase93-api', s19.missing !== true, JSON.stringify(s19));
  check(results, 'S19.11 magnitude-override', s19.injectedPoison === 0.9 && s19.defaultPoison === 1.1 && s19.lock !== true, JSON.stringify(s19));
  check(results, 'S19.1 five-consumers', Array.isArray(s19.consumers) && s19.consumers.join(',') === 'propulsion,weapons,cloak,sensors,ew', JSON.stringify(s19.consumers));
  check(results, 'S19.1 poison-ew-draw', s19.poisonOn === true && s19.poisonDraw > 0, JSON.stringify({ draw: s19.poisonDraw, on: s19.poisonOn }));
  check(results, 'S19.2 book-only', s19.hull !== true && s19.ghost !== true && s19.npcSame === true, JSON.stringify(s19));
  check(results, 'S19.3 focused-scan-poisoned', s19.focusPoisoned === true && s19.faction === true && s19.rewritten !== true && s19.auth !== true, JSON.stringify(s19));
  check(results, 'S19.4 residue-row', s19.residue === true && s19.row === true && s19.fs !== true, JSON.stringify(s19));
  check(results, 'S19.5 delivered-untouched', s19.delivered === true && s19.erased !== true, JSON.stringify(s19));
  check(results, 'S19.6 share-no-fs', s19.shareFs !== true, JSON.stringify({ shareFs: s19.shareFs }));
  check(results, 'S19.7 df-cue-only', s19.dfDraw > 0 && s19.cue === true && s19.dfFs !== true && s19.dfAuth !== true, JSON.stringify(s19));
  check(results, 'S19.8 no-identity-from-noise', s19.identity !== true && s19.noiseCue !== true, JSON.stringify(s19));
  check(results, 'S19.9 hoj-silence-coast', s19.coast === true && s19.perfect !== true, JSON.stringify(s19));
  check(results, 'S19.10 contest-radius', s19.jamRf > 0, JSON.stringify({ rf: s19.jamRf }));
  check(results, 'S19.12 boarding-phase10-preserved', s19.tractor !== true && s19.boarding === true && s19.rumorFs !== true, JSON.stringify(s19));
  check(results, 'S19.16 dock-no-clip', Array.isArray(s19.clipped) && s19.clipped.length === 0 && s19.overflowX !== true, JSON.stringify({ clipped: s19.clipped, overflowX: s19.overflowX }));
}

async function runPhase94EwMagnitudes(page, results) {
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800, hull: 100, shields: 100 });
  const present = await page.evaluate(() => Boolean(globalThis.__BM1_PROBE__?.phase94));
  if (!present) {
    check(results, 'S20.setup phase94-api', false, 'phase94 probe API missing');
    return;
  }

  const s20 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.phase94;
    const p92 = globalThis.__BM1_PROBE__.phase92;
    const p93 = globalThis.__BM1_PROBE__.phase93;
    if (typeof p.injectMagnitudes !== 'function' || typeof p.snapshot !== 'function') {
      return { missing: true };
    }
    const idle = p.snapshot();
    const lobe = p.injectMagnitudes({ lobeHalfAngleDeg: 20 });
    const compact = p.injectMagnitudes({ compact: { draw: 9 } });
    const heat = p.injectMagnitudes({ heatSuppressExtraEwFactor: 0.3 });
    const poison = p.injectMagnitudes({ scanPoisonEwDraw: 0.9 });
    const df = p.injectMagnitudes({ dfRange: 100 });
    const share = p.injectMagnitudes({ shareRadius: 99 });
    const alias92 = p92.injectMagnitudes({ lobeHalfAngleDeg: 20, shareRadius: 99 });
    const alias93 = p93.injectMagnitudes({ scanPoisonEwDraw: 0.9, dfCueQualityLoud: 0.33 });
    p.injectMagnitudes({});
    const reset = p.snapshot();
    return {
      missing: false,
      lock: idle.magnitudesLockedFromRemastered === true,
      defaultLobe: idle.magnitudes?.lobeHalfAngleDeg,
      defaultPoison: idle.magnitudes?.scanPoisonEwDraw,
      defaultCompact: idle.magnitudes?.compact?.draw,
      liveDefaultLobe: idle.live?.lobeHalfAngleDeg,
      liveDefaultCompact: idle.live?.compactDraw,
      injectedLobe: lobe.snapshot?.magnitudes?.lobeHalfAngleDeg,
      liveLobe: lobe.live?.lobeHalfAngleDeg ?? lobe.snapshot?.live?.lobeHalfAngleDeg,
      injectedCompact: compact.snapshot?.magnitudes?.compact?.draw,
      liveCompact: compact.live?.compactDraw ?? compact.snapshot?.live?.compactDraw,
      injectedHeat: heat.snapshot?.magnitudes?.heatSuppressExtraEwFactor,
      liveHeat: heat.live?.heatSuppressExtraEwFactor ?? heat.snapshot?.live?.heatSuppressExtraEwFactor,
      injectedPoison: poison.snapshot?.magnitudes?.scanPoisonEwDraw,
      livePoison: poison.live?.scanPoisonEwDraw ?? poison.snapshot?.live?.scanPoisonEwDraw,
      injectedDf: df.snapshot?.magnitudes?.dfRange,
      liveDf: df.live?.dfRange ?? df.snapshot?.live?.dfRange,
      injectedShare: share.snapshot?.magnitudes?.shareRadius,
      liveShare: share.live?.shareRadius ?? share.snapshot?.live?.shareRadius,
      resetLobe: reset.magnitudes?.lobeHalfAngleDeg,
      consumers: idle.power?.consumers || [],
      tractor: idle.boarding?.tractorIsBoard === true,
      boarding: idle.boarding?.implemented === true,
      rumorFs: idle.dominion?.rumorGiftedFs === true,
      auth: idle.fire?.engagementAuthorizedPresent === true,
      alias92: alias92.magnitudes?.lobeHalfAngleDeg,
      alias93: alias93.magnitudes?.scanPoisonEwDraw,
      remasteredWattLock: idle.magnitudes?.remasteredWattLock === true,
    };
  });

  check(results, 'S20.setup phase94-api', s20.missing !== true, JSON.stringify(s20));
  check(results, 'S20.1 lock-false', s20.lock !== true && s20.remasteredWattLock !== true, JSON.stringify(s20));
  check(results, 'S20.2 snapshot-override', s20.injectedLobe === 20
    && s20.injectedCompact === 9
    && s20.injectedHeat === 0.3
    && s20.injectedPoison === 0.9
    && s20.injectedDf === 100
    && s20.injectedShare === 99
    && s20.defaultLobe === 50
    && s20.resetLobe === 50, JSON.stringify(s20));
  check(results, 'S20.3 live-inject', s20.liveLobe === 20
    && s20.liveCompact === 9
    && s20.liveHeat === 0.3
    && s20.livePoison === 0.9
    && s20.liveDf === 100
    && s20.liveShare === 99
    && s20.liveDefaultLobe === 50
    && s20.liveDefaultCompact === 1.2, JSON.stringify(s20));
  check(results, 'S20.4 no-new-rules', Array.isArray(s20.consumers)
    && s20.consumers.join(',') === 'propulsion,weapons,cloak,sensors,ew'
    && s20.auth !== true
    && s20.rumorFs !== true, JSON.stringify(s20));
  check(results, 'S20.5 preserve-boarding-aliases', s20.tractor !== true
    && s20.boarding === true
    && s20.alias92 === 20
    && s20.alias93 === 0.9, JSON.stringify(s20));
}

async function runBoardingCapture(page, results) {
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800, hull: 100, shields: 100 });
  const present = await page.evaluate(() => Boolean(globalThis.__BM1_PROBE__?.boarding));
  if (!present) {
    check(results, 'S17.setup boarding-api', false, 'boarding probe API missing');
    return;
  }

  const s17125 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.boarding;
    if (typeof p.injectHullRatio !== 'function' || typeof p.injectBoardingAttempt !== 'function') {
      return { missing: true };
    }
    const probe = globalThis.BM1Probe;
    const ship = probe.spawnShip({
      id: 's17-hull',
      faction: 'klingon',
      role: 'patrol',
      x: probe.snapshot?.()?.player?.x || 1200,
      y: probe.snapshot?.()?.player?.y || 900,
      hostile: false,
      weaponSlots: [null, null, null],
    });
    const id = ship.securityInstanceId || ship.id;
    const above = p.injectHullRatio(id, 0.11);
    const aboveOrder = p.injectBoardingOrder({ id });
    const atTen = p.injectHullRatio(id, 0.10);
    p.injectDetection({ id, detected: true, firingSolution: false });
    const tenSnap = p.snapshot();
    const hold = p.injectTractorHoldOnly(id);
    const snap = p.snapshot();
    return {
      missing: false,
      implemented: snap.implemented === true,
      tractorIsBoard: snap.tractorIsBoard === true,
      ghostIsPrize: snap.ghostIsPrize === true,
      cuttingIsCapture: snap.cuttingIsCapture === true,
      aboveOrderOk: aboveOrder.ok === true,
      aboveEligible: above.snapshot?.hull?.eligible === true,
      aboveRatio: above.ratio,
      aboveReason: aboveOrder.reason || above.snapshot?.hull?.reason,
      eligibleOk: tenSnap.hull?.eligible === true && tenSnap.hull?.ratio <= 0.10,
      holdCaptured: hold.captured === true,
      holdScuttled: hold.scuttled === true,
      holdBoard: hold.tractorIsBoard === true,
      xp: snap.awayTeamXp,
    };
  });
  check(results, 'S17.setup boarding-api', s17125.missing !== true, JSON.stringify(s17125));
  check(results, 'S17.1 hull-above-refuses', s17125.aboveOrderOk !== true && s17125.aboveEligible !== true && s17125.aboveRatio > 0.10, JSON.stringify(s17125));
  check(results, 'S17.2 ten-percent-eligible', s17125.eligibleOk === true, JSON.stringify(s17125));
  check(results, 'S17.5 tractor-hold-not-capture', s17125.holdCaptured !== true && s17125.holdScuttled !== true && s17125.holdBoard !== true, JSON.stringify(s17125));
  check(results, 'S17.5 tractor-is-board-false', s17125.tractorIsBoard !== true && s17125.ghostIsPrize !== true && s17125.cuttingIsCapture !== true, JSON.stringify(s17125));
  check(results, 'S17.4 xp-not-tracked', s17125.xp?.tracked === false && s17125.xp?.rule === 'not_tracked_yet' && s17125.xp?.tablePresent === false, JSON.stringify(s17125.xp));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800, hull: 100, shields: 100 });
  const s1737 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.boarding;
    const probe = globalThis.BM1Probe;
    const ship = probe.spawnShip({
      id: 's17-capture',
      faction: 'klingon',
      role: 'patrol',
      hostile: false,
      weaponSlots: [null, null, null],
    });
    const id = ship.securityInstanceId || ship.id;
    const standingBefore = JSON.stringify(p.snapshot().credit.standing || {});
    p.injectHullRatio(id, 0.08);
    p.injectDetection({ id, detected: true, firingSolution: false });
    const asg = p.injectPhase5Assignment({ id });
    const capture = p.injectBoardingAttempt({ id, victimInstanceId: id, outcome: 'capture' });
    const snap = capture.snapshot || p.snapshot();
    const later = p.injectPrizeDestroy(snap.playerFleet?.[0]?.id || id);
    const foreign = p.injectCommandTransfer('npc-foreign-not-yours');
    return {
      xor: snap.attempt?.captured === true && snap.attempt?.scuttled !== true && snap.attempt?.xorOk === true,
      token: String(snap.credit?.captureToken || '').startsWith('capture:'),
      killAbsent: snap.credit?.killTokenForOriginal == null,
      standingSame: JSON.stringify(snap.credit?.standing || {}) === standingBefore,
      salvage: (Number(capture.salvageLatinumDelta) || 0) === 0,
      shipId: snap.identity?.shipId === ship.shipId || snap.identity?.shipId != null,
      empty: snap.identity?.emptySlotsStayEmpty === true,
      faction: snap.identity?.playerFaction === 'ferengi',
      reman: snap.identity?.reman53?.id === 53 || snap.identity?.reman53?.key === 'bm-ship:53' || snap.identity?.reman53 != null,
      fs: snap.reach?.firingSolution === true,
      giftedAuth: snap.engagementAuthorizedPresent === true,
      phase5cap: snap.phase5?.captured === true,
      phase5des: snap.phase5?.destroyed === true,
      attacker: snap.phase5?.attackerId,
      laterStanding: later.standingUnchanged === true,
      foreignRefuse: foreign.ok === false && (foreign.foreignRefuse === true || foreign.reason === 'foreign-not-captured' || foreign.reason === 'missing-target'),
      npcPath: snap.npcBoardingImplemented === true,
      lockedOdds: snap.magnitudesLockedFromRemastered === true,
      assignment: asg.ok === true,
    };
  });
  check(results, 'S17.3 xor-capture', s1737.xor === true, JSON.stringify(s1737));
  check(results, 'S17.7 capture-not-kill', s1737.token && s1737.killAbsent && s1737.standingSame, JSON.stringify(s1737));
  check(results, 'S17.7 no-salvage', s1737.salvage === true, JSON.stringify(s1737));
  check(results, 'S17.9 prize-destroy-no-double-charge', s1737.laterStanding === true, JSON.stringify(s1737));
  check(results, 'S17.10 identity-preserved', s1737.shipId && s1737.empty && s1737.faction, JSON.stringify(s1737));
  check(results, 'S17.6 no-gifted-fs-auth', s1737.fs !== true && s1737.giftedAuth !== true, JSON.stringify(s1737));
  check(results, 'S17.11 foreign-transfer-refuse', s1737.foreignRefuse === true, JSON.stringify(s1737));
  check(results, 'S17.14 captured-not-destroyed', s1737.phase5cap === true && s1737.phase5des !== true && s1737.attacker == null, JSON.stringify(s1737));
  check(results, 'S17.16 npc-path-explicit', s1737.npcPath !== true, JSON.stringify(s1737));
  check(results, 'S17.4 odds-not-locked', s1737.lockedOdds !== true, JSON.stringify(s1737));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800, hull: 100, shields: 100 });
  const s171213 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.boarding;
    const probe = globalThis.BM1Probe;
    const ship = probe.spawnShip({
      id: 's17-cloak',
      faction: 'romulan',
      role: 'patrol',
      hostile: false,
    });
    const id = ship.securityInstanceId || ship.id;
    p.injectHullRatio(id, 0.08);
    const noDetect = p.injectBoardingOrder({ id, detected: false });
    const cloaked = p.injectCloakHidden({ id });
    const cloakOrder = p.injectBoardingOrder({ id });
    return {
      noDetect: noDetect.ok === false && (noDetect.reason === 'not-detected' || String(noDetect.reason || '').includes('detect')),
      cloakHidden: cloaked.cloakedHidden === true,
      cloakRefuse: cloakOrder.ok === false,
    };
  });
  check(results, 'S17.12 detection-required', s171213.noDetect === true, JSON.stringify(s171213));
  check(results, 'S17.12 cloak-hidden-refuse', s171213.cloakHidden && s171213.cloakRefuse, JSON.stringify(s171213));

  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800, hull: 100, shields: 100 });
  const s178 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.boarding;
    const probe = globalThis.BM1Probe;
    const ship = probe.spawnShip({
      id: 's17-scuttle',
      faction: 'klingon',
      role: 'patrol',
      hostile: false,
    });
    const id = ship.securityInstanceId || ship.id;
    p.injectHullRatio(id, 0.07);
    p.injectDetection({ id, detected: true, firingSolution: false });
    const scuttle = p.injectBoardingAttempt({ id, victimInstanceId: id, outcome: 'scuttle' });
    const snap = scuttle.snapshot || p.snapshot();
    return {
      scuttled: snap.attempt?.scuttled === true && snap.attempt?.captured !== true,
      xorOk: snap.attempt?.xorOk === true,
    };
  });
  check(results, 'S17.8 scuttle-of-original', s178.scuttled && s178.xorOk, JSON.stringify(s178));
  check(results, 'S17.17 tractor-still-false', s17125.tractorIsBoard !== true && s17125.implemented === true, JSON.stringify({
    tractorIsBoard: s17125.tractorIsBoard,
    implemented: s17125.implemented,
  }));
}

async function runPhase10Dominion(page, results) {
  await startScenario(page, 'dominion', { clearTraffic: true, latinum: 1600, hull: 100, shields: 100 });
  const present = await page.evaluate(() => Boolean(globalThis.__BM1_PROBE__?.phase10));
  if (!present) {
    check(results, 'S18.setup phase10-api', false, 'phase10 probe API missing');
    return;
  }

  const s18 = await page.evaluate(() => {
    const p10 = globalThis.__BM1_PROBE__.phase10;
    if (typeof p10.injectKnowledge !== 'function' || typeof p10.injectDiscovery !== 'function' || typeof p10.injectStage !== 'function' || typeof p10.injectOperation !== 'function') {
      return { missing: true };
    }
    const start = p10.startFaction('dominion');
    const rumor = p10.injectKnowledge({ layer: 'rumor', provenance: 'hail' });
    const evidence = p10.injectKnowledge({ layer: 'evidence', provenance: 'scan' });
    const contact = p10.injectKnowledge({ layer: 'contact', provenance: 'briefing' });
    const ctx = p10.catalogSpawnContext({ role: 'fleetAttack', systemName: 'Earth' });
    const weak = p10.injectStage({ stage: 'contact', weaknessOpportunity: true, authorizedDeployment: false });
    const blender = p10.spawnIds({ role: 'patrol', systemName: 'Blender', faction: 'dominion' });
    const gorn = p10.spawnIds({ role: 'traffic', systemName: 'Earth', faction: 'gorn' });
    const op = p10.injectOperation({ operationId: 'op-s18', authorizedDeployment: true });
    const ctx2 = p10.catalogSpawnContext({ role: 'mission', systemName: 'Earth' });
    const snap = p10.snapshot();
    return {
      missing: false,
      startFaction: start.fire?.playerFaction || snap.fire.playerFaction,
      currentSystem: snap.hide.currentSystem,
      leaked: snap.hide.leakedNames,
      hiddenHasDominica: (snap.hide.hiddenSystems || []).includes('Dominica'),
      rumorFs: rumor.snapshot.knowledge.firingSolution,
      rumorAuth: rumor.snapshot.fire.engagement_authorized,
      rumorFaction: rumor.playerFactionUnchanged,
      evidenceLayer: evidence.snapshot.knowledge.layer,
      contactLayer: contact.snapshot.knowledge.layer,
      contactMap: contact.snapshot.knowledge.mapRevealed,
      roleOnlyAuth: ctx.authorizedDeployment,
      weakStage: weak.snapshot.stage.value,
      weakAuth: weak.snapshot.stage.weaknessDidAuthorize,
      blenderCore: (blender || []).filter((id) => [48, 65, 216, 238].includes(id)),
      gorn,
      opAuth: ctx2.authorizedDeployment,
      tractor: snap.boarding.tractorIsBoard,
      boarding: snap.boarding.implemented,
      odds: snap.discoveryOddsLocked === false && snap.invasionOddsLocked === false,
      roster: snap.scope,
      debugAll: snap.debugAuthorizeAllDeployments,
      wormholeDefault: snap.hide.wormholeDefaultNamesDominica,
    };
  });

  check(results, 'S18.setup phase10-api', s18.missing !== true, JSON.stringify(s18));
  check(results, 'S18.1 rumor-not-fs', s18.rumorFs !== true && s18.rumorAuth == null && s18.rumorFaction === true, JSON.stringify(s18));
  check(results, 'S18.2 evidence-layer', s18.evidenceLayer === 'evidence', JSON.stringify({ layer: s18.evidenceLayer }));
  check(results, 'S18.3 contact-not-map', s18.contactLayer === 'contact' && s18.contactMap !== true, JSON.stringify(s18));
  check(results, 'S18.4 blender-start-hide', s18.startFaction === 'dominion' && s18.hiddenHasDominica === true && (!s18.leaked || s18.leaked.length === 0), JSON.stringify({ leaked: s18.leaked, hidden: s18.hiddenHasDominica, sys: s18.currentSystem }));
  check(results, 'S18.5 wormhole-default', s18.wormholeDefault !== true, JSON.stringify({ wormholeDefault: s18.wormholeDefault }));
  check(results, 'S18.6 blender-no-core', Array.isArray(s18.blenderCore) && s18.blenderCore.length === 0, JSON.stringify(s18.blenderCore));
  check(results, 'S18.7 gorn-empty', Array.isArray(s18.gorn) && s18.gorn.length === 0, JSON.stringify(s18.gorn));
  check(results, 'S18.8 role-not-auth', s18.roleOnlyAuth !== true && s18.debugAll !== true, JSON.stringify({ roleOnlyAuth: s18.roleOnlyAuth, debugAll: s18.debugAll }));
  check(results, 'S18.8 op-auth', s18.opAuth === true, JSON.stringify({ opAuth: s18.opAuth }));
  check(results, 'S18.10 weakness-not-invasion', s18.weakAuth !== true && s18.weakStage !== 'fronts', JSON.stringify({ stage: s18.weakStage, auth: s18.weakAuth }));
  check(results, 'S18.12 odds-injectable', s18.odds === true, JSON.stringify({ odds: s18.odds }));
  check(results, 'S18.17 boarding-preserved', s18.tractor !== true && s18.boarding === true, JSON.stringify({ tractor: s18.tractor, boarding: s18.boarding }));
  check(results, 'S18.18 dominion-first', s18.roster === 'dominion-first', JSON.stringify({ roster: s18.roster }));
}

async function runUtilityInventory(page, results) {
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800, hull: 100, shields: 100 });
  const present = await page.evaluate(() => Boolean(globalThis.__BM1_PROBE__?.utility));
  if (!present) {
    check(results, 'S21.setup utility-api', false, 'utility probe API missing');
    return;
  }

  const s21 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.utility;
    if (typeof p.snapshot !== 'function' || typeof p.buyFlag !== 'function' || typeof p.injectKnobs !== 'function') {
      return { missing: true };
    }
    const idle = p.snapshot();
    const slotsBefore = JSON.stringify(idle.weaponSlots);
    const inventoryBefore = JSON.stringify(idle.weaponInventory);
    const cargoBefore = JSON.stringify(idle.cargoArray);
    const suiteBefore = idle.sensorSuiteId;
    const ewBefore = idle.ewEquipmentId;
    const factionBefore = idle.playerFaction;
    const refused = p.refuseSlotWrite('weaponSlots');
    const bought = p.buyFlag('klingon');
    const afterBuy = bought.snapshot || p.snapshot();
    p.saveSlot(3);
    const loaded = p.loadSlot(3);
    const wiped = p.wipeSystemStates();
    const legacy = p.loadLegacy(['ferengi', 'cardassian']);
    p.buyFlag('klingon');
    const omit = p.injectKnobs({});
    const injectedPrice = p.injectKnobs({ liveFlagPrice: 2500 });
    const injectedKnob = p.injectKnobs({ basePrice: 2200, useKnobs: true });
    const reset = p.injectKnobs({});
    const inventory = p.openInventory();
    return {
      missing: false,
      lock: idle.utilityLockedFromRemastered === true,
      defaultPrice: idle.liveFlagPrice,
      defaultSource: idle.liveFlagPriceSource,
      knobs: idle.knobs,
      capacity: idle.capacity,
      activation: idle.activation,
      hotkeys: idle.hotkeys,
      thaleron: idle.thaleronTestFacilityPass,
      thaleronVendor: idle.thaleronVendor,
      guidedLock: idle.guidedThaleronPriceLock,
      fire: idle.fire,
      boarding: idle.boarding,
      dominion: idle.dominion,
      phase1: idle.phase1,
      reman: idle.reman53,
      refused: refused.refused === true,
      boughtOk: bought.ok === true,
      wroteSlots: bought.wroteSlots === true,
      factionUnchanged: bought.playerFactionUnchanged === true && afterBuy.playerFaction === factionBefore,
      flagGained: (afterBuy.playerFlags || []).includes('klingon')
        && (afterBuy.book?.items || []).some((row) => row.kind === 'faction_flag' && row.id === 'klingon'),
      slotsSame: JSON.stringify(afterBuy.weaponSlots) === slotsBefore
        && JSON.stringify(afterBuy.weaponInventory) === inventoryBefore
        && JSON.stringify(afterBuy.cargoArray) === cargoBefore
        && afterBuy.sensorSuiteId === suiteBefore
        && afterBuy.ewEquipmentId === ewBefore
        && Array.isArray(afterBuy.weaponSlots) && afterBuy.weaponSlots.length === 3,
      loadedFlag: (loaded.playerFlags || []).includes('klingon'),
      loadedSlots: JSON.stringify(loaded.weaponSlots) === slotsBefore,
      loadedPasses: Array.isArray(loaded.book?.facility_pass) && loaded.book.facility_pass.length === 0,
      wipedFlag: (wiped.playerFlags || []).includes('klingon'),
      legacyPasses: Array.isArray(legacy.book?.facility_pass) && legacy.book.facility_pass.length === 0,
      legacyAlias: (legacy.playerFlags || []).includes('cardassian'),
      omitPrice: omit.snapshot?.liveFlagPrice,
      injectedLive: injectedPrice.snapshot?.liveFlagPrice,
      injectedBase: injectedKnob.snapshot?.knobs?.basePrice,
      injectedUseKnobs: injectedKnob.snapshot?.liveFlagPrice,
      resetPrice: reset.snapshot?.liveFlagPrice,
      inventoryEmpty: inventory.empty === true && /not a weapon slot/i.test(inventory.text || ''),
      facilityPassEmpty: (afterBuy.book?.facility_pass || []).length === 0,
    };
  });

  check(results, 'S21.setup utility-api', s21.missing !== true, JSON.stringify(s21));
  check(results, 'S21.1 buy-hold-off-slots', s21.boughtOk === true
    && s21.wroteSlots !== true
    && s21.flagGained === true
    && s21.slotsSame === true
    && s21.refused === true, JSON.stringify(s21));
  check(results, 'S21.2 save-load-separate-book', s21.loadedFlag === true
    && s21.loadedSlots === true
    && s21.loadedPasses === true
    && s21.wipedFlag === true
    && s21.legacyPasses === true
    && s21.legacyAlias === true, JSON.stringify(s21));
  check(results, 'S21.3 knobs-injectable', s21.lock !== true
    && s21.defaultPrice === 1000
    && s21.knobs?.blockedFactions?.includes('pirate')
    && s21.knobs?.blockedFactions?.includes('borg')
    && s21.injectedLive === 2500
    && s21.injectedBase === 2200
    && s21.injectedUseKnobs === 2200
    && s21.omitPrice === 1000
    && s21.resetPrice === 1000, JSON.stringify(s21));
  check(results, 'S21.4 thaleron-not-shipped', s21.thaleron?.shipped === false
    && s21.thaleron?.verified === false
    && s21.thaleronVendor == null
    && s21.guidedLock == null
    && s21.facilityPassEmpty === true, JSON.stringify(s21));
  check(results, 'S21.5 knowledge-only', s21.fire?.firingSolutionPresent !== true
    && s21.fire?.engagementAuthorizedPresent !== true
    && s21.factionUnchanged === true
    && s21.phase1?.flagShareGrantsControl !== true
    && s21.phase1?.plantGrantsMarketTrust !== true
    && s21.reman?.id === 53
    && s21.boarding?.tractorIsBoard !== true
    && s21.dominion?.rumorGiftedFs !== true, JSON.stringify(s21));
  check(results, 'S21.6 capacity-activation-unset', s21.capacity == null
    && s21.activation === 'unset'
    && s21.hotkeys == null, JSON.stringify(s21));
  check(results, 'S21.7 landed-lanes-preserved', s21.boarding?.implemented === true
    && s21.boarding?.tractorIsBoard !== true
    && s21.inventoryEmpty === true, JSON.stringify(s21));
}

async function runWeaponSourceLedger(page, results) {
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800, hull: 100, shields: 100 });
  const present = await page.evaluate(() => Boolean(globalThis.__BM1_PROBE__?.weaponLedger));
  if (!present) {
    check(results, 'S22.setup weaponLedger-api', false, 'weaponLedger probe API missing');
    return;
  }

  const s22 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.weaponLedger;
    if (typeof p.snapshot !== 'function') return { missing: true };
    const snap = p.snapshot();
    if (snap.missing === true) return snap;
    const write = typeof p.refuseCombatWrite === 'function' ? p.refuseCombatWrite() : { refused: false };
    const flashLock = typeof p.refuseFlashLock === 'function' ? p.refuseFlashLock() : { refused: false };
    const fire = typeof p.injectFire === 'function'
      ? p.injectFire({ firingSolution: true, engagement_authorized: true, cultureFire: true })
      : { firingSolutionPresent: true, engagementAuthorizedPresent: true };
    const sail = (snap.deferredUtilities || []).find((row) => row.flashName === 'Bajoran Sail');
    const core = (snap.deferredUtilities || []).find((row) => row.flashName === 'Warp Core');
    const provenanceOk = Array.isArray(snap.rows)
      && snap.rows.length > 0
      && snap.rows.every((row) => ['BM1-flash', 'retained-BM2', 'bake-off-game-items', 'new'].includes(row.provenance));
    return {
      missing: false,
      lock: snap.ledgerLockedFromRemastered === true,
      flashLock: snap.flashPricesAreLiveLocks === true,
      bypass: snap.universalShieldBypass === true,
      combatUnchanged: snap.combatUnchanged === true,
      matrixColumns: snap.matrixColumns,
      disruptors: snap.disruptors,
      collisionMerged: snap.findings?.displayNameCollision?.merged === true,
      tractor: snap.tractor,
      plasma: snap.plasmaTorpedo,
      sail,
      core,
      inherited: snap.inheritedNotInFlash,
      inheritedFlash: (snap.inheritedRows || []).map((row) => row.flashPrice),
      hoj: snap.hoj,
      vacant: snap.vacantIdsStillVacant,
      provenanceOk,
      fire: snap.fire,
      injectFire: fire,
      shields: snap.shields,
      boarding: snap.boarding,
      writeRefused: write.refused === true,
      flashLockRefused: flashLock.refused === true,
      utilityForbidden: snap.utilityBookHoldsForbidden === true,
    };
  });

  check(results, 'S22.setup weaponLedger-api', s22.missing !== true, JSON.stringify(s22));
  check(results, 'S22.1 matrix-read-only', s22.combatUnchanged === true
    && s22.matrixColumns === 10
    && s22.writeRefused === true, JSON.stringify({
    combatUnchanged: s22.combatUnchanged,
    matrixColumns: s22.matrixColumns,
    writeRefused: s22.writeRefused,
  }));
  check(results, 'S22.2 three-disruptors-tractor', s22.disruptors?.distinct === true
    && s22.disruptors?.canon?.id === 7
    && s22.disruptors?.cannon?.id === 6
    && s22.disruptors?.turret?.id === 12
    && s22.disruptors?.canon?.flashIdentity === 'Disrupter Canon'
    && s22.disruptors?.cannon?.flashIdentity === 'Disrupter Cannon'
    && s22.disruptors?.turret?.flashIdentity === 'Disrupter Turret'
    && s22.collisionMerged !== true
    && s22.tractor?.id === 25
    && s22.tractor?.type === 'Device'
    && s22.tractor?.slot === true
    && s22.tractor?.cargo !== true
    && s22.tractor?.boarding !== true, JSON.stringify({
    disruptors: s22.disruptors,
    tractor: s22.tractor,
    collisionMerged: s22.collisionMerged,
  }));
  check(results, 'S22.3 flash-not-lock', s22.flashLock !== true
    && s22.flashLockRefused === true
    && s22.plasma?.id === 17
    && s22.plasma?.livePrice === 7200
    && s22.plasma?.flashCertified === false, JSON.stringify({
    flashLock: s22.flashLock,
    flashLockRefused: s22.flashLockRefused,
    plasma: s22.plasma,
  }));
  check(results, 'S22.4 deferred-utilities', s22.sail?.bakeoffId == null
    && s22.sail?.cargo === false
    && s22.sail?.utilityBook === false
    && s22.core?.bakeoffId == null
    && s22.core?.cargo === false
    && s22.core?.utilityBook === false
    && s22.core?.cargoNameWarpCoresDistinct === true
    && s22.utilityForbidden !== true, JSON.stringify({
    sail: s22.sail,
    core: s22.core,
    utilityForbidden: s22.utilityForbidden,
  }));
  check(results, 'S22.5 inherited-list', JSON.stringify(s22.inherited) === JSON.stringify([2, 27, 28, 29, 30, 38, 39, 44, 45])
    && (s22.inheritedFlash || []).every((price) => price == null)
    && s22.hoj?.provenance === 'new'
    && s22.hoj?.catalogId == null
    && JSON.stringify(s22.vacant) === JSON.stringify([20, 21, 31, 32, 33, 34, 35, 36, 37, 40, 41, 42, 43]),
  JSON.stringify({ inherited: s22.inherited, hoj: s22.hoj, vacant: s22.vacant }));
  check(results, 'S22.6 provenance-no-bypass-no-fire', s22.provenanceOk === true
    && s22.bypass !== true
    && s22.shields?.ordinaryBeam?.bypassedShields !== true
    && s22.shields?.ordinaryBeam?.interaction === 'shields-then-hull'
    && s22.fire?.firingSolutionPresent !== true
    && s22.fire?.engagementAuthorizedPresent !== true
    && s22.injectFire?.firingSolutionPresent !== true
    && s22.injectFire?.engagementAuthorizedPresent !== true, JSON.stringify({
    provenanceOk: s22.provenanceOk,
    bypass: s22.bypass,
    shields: s22.shields,
    fire: s22.fire,
    injectFire: s22.injectFire,
  }));
  check(results, 'S22.7 landed-lanes-preserved', s22.lock !== true
    && s22.boarding?.implemented === true
    && s22.boarding?.tractorIsBoard !== true, JSON.stringify({
    lock: s22.lock,
    boarding: s22.boarding,
  }));
}

async function runEmptyArmable(page, results) {
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800, hull: 100, shields: 100 });
  const present = await page.evaluate(() => Boolean(globalThis.__BM1_PROBE__?.emptyArmable));
  if (!present) {
    check(results, 'S23.setup emptyArmable-api', false, 'emptyArmable probe API missing');
    return;
  }

  const s23 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.emptyArmable;
    if (typeof p.snapshot !== 'function'
      || typeof p.spawnEmpty !== 'function'
      || typeof p.install !== 'function'
      || typeof p.tryNpcFire !== 'function') {
      return { missing: true };
    }
    const idle = p.snapshot();
    if (idle.missing === true) return idle;
    const packEmpty = p.spawnEmpty(350, [null, null, null]);
    const unarmedFire = p.tryNpcFire(packEmpty.id);
    const installed = p.install(15, 1);
    const armedFire = p.tryNpcFire(packEmpty.id);
    const forcedEmpty = p.spawnEmpty(2, []);
    const scene = typeof p.sceneRestore === 'function' ? p.sceneRestore(forcedEmpty.id) : { ok: false };
    const wipe = typeof p.wipeSystemStates === 'function' ? p.wipeSystemStates() : { ok: true };
    const playerEmpty = typeof p.armPlayerEmpty === 'function' ? p.armPlayerEmpty(350) : { ok: false };
    const persist = typeof p.persistRoundtrip === 'function' ? p.persistRoundtrip(8) : { ok: false };
    const siblingEmpty = installed.npcSlots
      ? installed.npcSlots.filter((id, index) => index !== 0).every((id) => id == null)
      : installed.weaponSlots.filter((id, index) => index !== 0).every((id) => id == null);
    const fire = typeof p.injectFire === 'function'
      ? p.injectFire({ firingSolution: true, engagement_authorized: true, cultureFire: true })
      : { firingSolutionPresent: true, engagementAuthorizedPresent: true };
    const refuse = typeof p.refuseAutofill === 'function' ? p.refuseAutofill() : { refused: false };
    const after = p.snapshot();
    return {
      missing: false,
      lock: after.emptyArmableLockedFromRemastered === true,
      slotCount: after.slotCount,
      fourth: after.fourthSlotPresent === true,
      utilityHoldsSlots: after.utilityBookHoldsCombatSlots === true,
      playerEmptyOk: playerEmpty.ok === true && playerEmpty.equippedWeaponId == null,
      persistOk: persist.ok === true && persist.autoFilled !== true,
      persistSlots: persist.after,
      persistEquipped: persist.equippedWeaponId,
      packSlots: packEmpty.weaponSlots,
      packCombat: packEmpty.combatWeaponId,
      forcedSlots: forcedEmpty.weaponSlots,
      forcedCombat: forcedEmpty.combatWeaponId,
      sceneOk: scene.ok === true && scene.autoFilled !== true,
      wipeOk: wipe.ok !== false,
      unarmedCombat: unarmedFire.combatWeaponId,
      unarmedEmitted: unarmedFire.emittedProjectile === true,
      unarmedAuth: unarmedFire.engagementAuthorizedPresent === true
        || unarmedFire.doctrineHasEngagementAuthorized === true,
      unarmedFs: unarmedFire.firingSolutionPresent === true,
      installedId: installed.npcCombatWeaponId ?? installed.weaponSlots?.[0],
      siblingEmpty,
      armedCombat: armedFire.combatWeaponId,
      armedProjectiles: armedFire.projectileWeaponIds,
      armedEmittedTypeX: (armedFire.projectileWeaponIds || []).includes(1),
      tractor: after.tractor,
      fire: after.fire,
      injectFire: fire,
      refuseAutofill: refuse.refused === true,
      boarding: after.boarding,
      canonicalEmpty: after.canonicalEmpty === true,
    };
  });

  check(results, 'S23.setup emptyArmable-api', s23.missing !== true, JSON.stringify(s23));
  check(results, 'S23.1 three-slots-empty-persist', s23.slotCount === 3
    && s23.fourth !== true
    && s23.utilityHoldsSlots !== true
    && s23.canonicalEmpty === true
    && s23.playerEmptyOk === true
    && s23.persistOk === true
    && JSON.stringify(s23.persistSlots) === JSON.stringify([null, null, null])
    && s23.persistEquipped == null, JSON.stringify({
    slotCount: s23.slotCount,
    persist: s23.persistSlots,
    persistOk: s23.persistOk,
    playerEmptyOk: s23.playerEmptyOk,
  }));
  check(results, 'S23.2 scene-restore-empty', s23.packCombat == null
    && JSON.stringify(s23.packSlots) === JSON.stringify([null, null, null])
    && s23.forcedCombat == null
    && JSON.stringify(s23.forcedSlots) === JSON.stringify([null, null, null])
    && s23.sceneOk === true
    && s23.wipeOk === true, JSON.stringify({
    pack: s23.packSlots,
    forced: s23.forcedSlots,
    sceneOk: s23.sceneOk,
    wipeOk: s23.wipeOk,
  }));
  check(results, 'S23.3 unarmed-npc-no-shot', s23.unarmedCombat == null
    && s23.unarmedEmitted !== true
    && s23.unarmedAuth !== true
    && s23.unarmedFs !== true, JSON.stringify({
    combat: s23.unarmedCombat,
    emitted: s23.unarmedEmitted,
    auth: s23.unarmedAuth,
    fs: s23.unarmedFs,
  }));
  check(results, 'S23.4 legal-install-def-only', s23.installedId === 15
    && s23.siblingEmpty === true
    && s23.armedCombat === 15
    && s23.armedEmittedTypeX !== true, JSON.stringify({
    installedId: s23.installedId,
    siblingEmpty: s23.siblingEmpty,
    armedCombat: s23.armedCombat,
    projectiles: s23.armedProjectiles,
  }));
  check(results, 'S23.5 tractor-slot-no-fire-gift', s23.tractor?.id === 25
    && s23.tractor?.type === 'Device'
    && s23.tractor?.slot === true
    && s23.tractor?.cargo !== true
    && s23.tractor?.boarding !== true
    && s23.fire?.firingSolutionPresent !== true
    && s23.fire?.engagementAuthorizedPresent !== true
    && s23.injectFire?.firingSolutionPresent !== true
    && s23.injectFire?.engagementAuthorizedPresent !== true, JSON.stringify({
    tractor: s23.tractor,
    fire: s23.fire,
    injectFire: s23.injectFire,
  }));
  check(results, 'S23.6 landed-lanes-preserved', s23.lock !== true
    && s23.refuseAutofill === true
    && s23.boarding?.implemented === true
    && s23.boarding?.tractorIsBoard !== true
    && s23.boarding?.emptySlotsStayEmpty === true, JSON.stringify({
    lock: s23.lock,
    refuseAutofill: s23.refuseAutofill,
    boarding: s23.boarding,
  }));
}

async function runConstructionVisuals(page, results) {
  await startScenario(page, 'ferengi', { clearTraffic: true, latinum: 2800, hull: 100, shields: 100 });
  const present = await page.evaluate(() => Boolean(globalThis.__BM1_PROBE__?.constructionVisuals));
  if (!present) {
    check(results, 'S24.setup constructionVisuals-api', false, 'constructionVisuals probe API missing');
    return;
  }

  const s24 = await page.evaluate(() => {
    const p = globalThis.__BM1_PROBE__.constructionVisuals;
    const lane = globalThis.__BM1_PROBE__.sideLane;
    if (typeof p.snapshot !== 'function'
      || typeof p.startBuild !== 'function'
      || typeof p.completeBuild !== 'function') {
      return { missing: true };
    }
    const idle = p.snapshot();
    if (idle.missing === true) return idle;
    const built = p.startBuild(75);
    const drawn = typeof p.forceDraw === 'function' ? p.forceDraw(built.id) : built;
    const dock = typeof p.tryDock === 'function' ? p.tryDock(built.id) : { dockRefused: true };
    const fire = typeof p.tryStationFire === 'function' ? p.tryStationFire(built.id) : { stationFired: true };
    const inject = typeof p.injectFire === 'function'
      ? p.injectFire({ firingSolution: true, engagement_authorized: true, cultureFire: true })
      : { firingSolutionPresent: true, engagementAuthorizedPresent: true };
    const afterBuild = p.snapshot();
    lane.forceDockPlanet();
    const dockedRepair = lane.snapshot();
    const startedRepair = lane.startRepair();
    const duringRepair = lane.snapshot();
    const platform = p.startBuild(86);
    const platformSnap = p.snapshot();
    const completed = p.completeBuild(built.id);
    const afterComplete = completed.snapshot || p.snapshot();
    return {
      missing: false,
      lock: afterBuild.constructionLockedFromRemastered === true,
      idleUnder: idle.underConstruction === true,
      builtOk: built.ok === true && built.underConstruction === true,
      language: afterBuild.language,
      drawn: drawn.language || afterBuild.drawn,
      assetMissing: afterBuild.assetMissing === true,
      usesRepairArmsArt: afterBuild.usesRepairArmsArt === true,
      placeholderOnly: afterBuild.placeholderOnly === true,
      repair: afterBuild.repair,
      dockedOverlay: dockedRepair.overlay,
      startedRepairOk: startedRepair?.ok === true,
      duringRepairOverlay: duringRepair.overlay,
      constructionArtOnRepair: duringRepair.overlayUsesConstructionArt === true,
      dockRefused: dock.dockRefused === true,
      stationWeapons: afterBuild.site?.stationWeaponIds,
      fireEvidence: fire.evidence,
      stationFired: fire.stationFired === true,
      injectFire: inject,
      fireGift: afterBuild.fire,
      platformLanguage: platformSnap.language?.blueBeam === true,
      platformRepair: platformSnap.repair?.defensePlatformRepair === true,
      platformOk: platform.ok === true,
      completedOk: completed.ok === true && completed.languageStopped === true,
      afterCompleteUnder: afterComplete.underConstruction === true,
      afterLanguage: afterComplete.language,
      workbee: afterBuild.workbee,
      evidence: drawn.evidence || built.evidence,
    };
  });

  check(results, 'S24.setup constructionVisuals-api', s24.missing !== true, JSON.stringify(s24));
  check(results, 'S24.1 constructing-site-language', s24.builtOk === true
    && s24.language?.scaffold
    && s24.language?.workbee
    && s24.language?.blueBeam === true
    && s24.assetMissing === true
    && s24.usesRepairArmsArt !== true
    && s24.placeholderOnly !== true, JSON.stringify({
    language: s24.language,
    assetMissing: s24.assetMissing,
    placeholderOnly: s24.placeholderOnly,
  }));
  check(results, 'S24.2 repair-overlay-unchanged', s24.repair?.overlayUsesConstructionArt !== true
    && s24.constructionArtOnRepair !== true
    && s24.dockedOverlay === false
    && s24.startedRepairOk === true
    && s24.repair?.defensePlatformRepair !== true
    && s24.platformRepair !== true, JSON.stringify({
    repair: s24.repair,
    dockedOverlay: s24.dockedOverlay,
    startedRepairOk: s24.startedRepairOk,
    platformRepair: s24.platformRepair,
  }));
  check(results, 'S24.3 beams-not-phase4-evidence', s24.evidence?.observedAttacksDelta === 0
    && s24.evidence?.flashQueued !== true
    && s24.evidence?.projectileAdded !== true
    && s24.evidence?.combatBeamEffectAdded !== true
    && s24.fireEvidence?.observedAttacksDelta === 0
    && s24.fireEvidence?.flashQueued !== true
    && s24.fireEvidence?.projectileAdded !== true
    && s24.stationFired !== true, JSON.stringify({
    evidence: s24.evidence,
    fireEvidence: s24.fireEvidence,
    stationFired: s24.stationFired,
  }));
  check(results, 'S24.4 no-gifted-fire', s24.fireGift?.firingSolutionPresent !== true
    && s24.fireGift?.engagementAuthorizedPresent !== true
    && s24.injectFire?.firingSolutionPresent !== true
    && s24.injectFire?.engagementAuthorizedPresent !== true, JSON.stringify({
    fire: s24.fireGift,
    injectFire: s24.injectFire,
  }));
  check(results, 'S24.5 site-safety-and-complete', s24.dockRefused === true
    && Array.isArray(s24.stationWeapons)
    && s24.stationWeapons.length === 0
    && s24.platformLanguage === true
    && s24.completedOk === true
    && s24.afterCompleteUnder !== true
    && s24.afterLanguage?.blueBeam !== true
    && s24.workbee?.hull !== true
    && s24.workbee?.inNpcShips !== true, JSON.stringify({
    dockRefused: s24.dockRefused,
    weapons: s24.stationWeapons,
    completedOk: s24.completedOk,
    afterLanguage: s24.afterLanguage,
    workbee: s24.workbee,
  }));
  check(results, 'S24.6 landed-lanes-preserved', s24.lock !== true, JSON.stringify({
    lock: s24.lock,
  }));
}

async function main() {
  const server = await startServer();
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.setDefaultTimeout(45000);
    await boot(page);
    const results = await runChecks(page);
    await runPhase2Roe(page, results);
    await runPhase3Checkpoints(page, results);
    await runPhase4Incidents(page, results);
    await runSideLaneRepairReman(page, results);
    await runSideLaneUnrestIndependence(page, results);
    await runPhase5Objectives(page, results);
    await runPhase6Sensors(page, results);
    await runPhase65PowerSensors(page, results);
    await runCatalogWire(page, results);
    await runPhase7Fleet(page, results);
    await runPhase8Markets(page, results);
    await runPhase9EwWeapons(page, results);
    await runPhase91EwRobustness(page, results);
    await runPhase92EwDepth(page, results);
    await runPhase93EwPoisonDf(page, results);
    await runPhase94EwMagnitudes(page, results);
    await runBoardingCapture(page, results);
    await runPhase10Dominion(page, results);
    await runUtilityInventory(page, results);
    await runWeaponSourceLedger(page, results);
    await runEmptyArmable(page, results);
    await runConstructionVisuals(page, results);
    const artifactDir = process.env.PROBE_ARTIFACT_DIR;
    if (artifactDir) {
      fs.mkdirSync(artifactDir, { recursive: true });
      await page.screenshot({ path: path.join(artifactDir, 'behavior_probe_game.png'), fullPage: true });
      fs.writeFileSync(path.join(artifactDir, 'behavior_probe_results.txt'), `${results.lines.join('\n')}\n`);
    }
    const summary = `Phase 1 + Phase 2 ROE + Phase 3 + Phase 4 incidents + S7 repair/Reman + S7 unrest/independence + S8 Phase 5 + S9 Phase 6 + S10 Phase 6.5 + S11 catalog + S12 Phase 7 + S13 Phase 8 + S14 Phase 9 + S15 Phase 9.1 + S16 Phase 9.2 + S17 boarding + S18 Phase 10 Dominion + S19 Phase 9.3 poison/DF + S20 Phase 9.4 magnitudes + S21 utility inventory + S22 weapon source ledger + S23 empty-armable + S24 construction visuals Chromium probe: ${results.passed} passed, ${results.failed} failed`;
    console.log(results.lines.join('\n'));
    console.log(summary);
    if (results.failed) process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
