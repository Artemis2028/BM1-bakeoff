#!/usr/bin/env node
/**
 * Headless Chromium behavioral probe for bake-off Phase 1.
 *
 * Written from this repo's docs + src only:
 * - docs/revised-development-plan.md §2–§3
 * - docs/doctrine/ DESIGN + phase1Integration
 * - docs/BAKEOFF-STATUS.md
 *
 * Boots the real game, freezes the RAF loop, then drives tick() / combat /
 * claim / arrival paths with live fixtures.
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
    const startDistance = afterOutside.playerDistance;
    p.patchShip(hunter.id, { speed: 2.8, lastShotAt: 0 });
    let firedWhileFar = false;
    let mid = afterOutside;
    for (let i = 0; i < 100; i++) {
      p.tick(1, 1);
      mid = p.ship(hunter.id);
      const snap = p.snapshot();
      if (mid.playerDistance > fireRange && (snap.projectileCount > projectilesOutside || snap.hull < hullOutside)) {
        firedWhileFar = true;
        break;
      }
      if (mid.playerDistance <= fireRange * 0.92) break;
    }
    p.placePlayer(mid.x + Math.min(fireRange * 0.28, 140), mid.y);
    p.patchShip(hunter.id, { lastShotAt: 0 });
    const close = p.ship(hunter.id);
    const insideShot = p.fireNpc(close.id, { targetType: 'player' });
    if (!insideShot.fired && !insideShot.projectileDelta) p.tick(16, 1);
    const afterInside = p.snapshot();
    const insideFired = Boolean(insideShot.fired || insideShot.projectileDelta || afterInside.projectileCount > projectilesOutside || afterInside.hull < hullOutside);
    return {
      fireRange,
      huntRange,
      startDistance,
      midDistance: mid.playerDistance,
      destinationName: mid.destinationName,
      projectilesOutside,
      hullOutside,
      firedWhileFar,
      outsideShot,
      insideShot,
      insideFired,
      hullAfter: afterInside.hull,
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

async function main() {
  const server = await startServer();
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-dev-shm-usage'],
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.setDefaultTimeout(45000);
    await boot(page);
    const results = await runChecks(page);
    const artifactDir = process.env.PROBE_ARTIFACT_DIR;
    if (artifactDir) {
      fs.mkdirSync(artifactDir, { recursive: true });
      await page.screenshot({ path: path.join(artifactDir, 'behavior_probe_game.png'), fullPage: true });
      fs.writeFileSync(path.join(artifactDir, 'behavior_probe_results.txt'), `${results.lines.join('\n')}\n`);
    }
    const summary = `Phase 1 Chromium probe: ${results.passed} passed, ${results.failed} failed`;
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
