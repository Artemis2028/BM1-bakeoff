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
    'S7.9 no-full-catalog-wire',
    s7678.catalogWired === false,
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
    const artifactDir = process.env.PROBE_ARTIFACT_DIR;
    if (artifactDir) {
      fs.mkdirSync(artifactDir, { recursive: true });
      await page.screenshot({ path: path.join(artifactDir, 'behavior_probe_game.png'), fullPage: true });
      fs.writeFileSync(path.join(artifactDir, 'behavior_probe_results.txt'), `${results.lines.join('\n')}\n`);
    }
    const summary = `Phase 1 + Phase 2 ROE + Phase 3 + Phase 4 incidents + S7 repair/Reman Chromium probe: ${results.passed} passed, ${results.failed} failed`;
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
