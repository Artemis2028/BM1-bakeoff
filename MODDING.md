# Broken Mirror 2 Modding Layout

The live game assets are now kept under:

```text
assets/game/
```

Folder guide:

```text
assets/game/ships/          one current PNG per ship id
assets/game/stations/       one current PNG per station id
assets/game/pods/           escape pod sprites
assets/game/planet-models/  reusable planet surface models
assets/game/asteroids/      asteroid variants 1-12
assets/game/backgrounds/    starfield, nebula, and warp backgrounds
assets/game/effects/        explosions and station debris
assets/game/factions/       faction emblems
assets/game/sprites/        sun, wormhole, and generic world sprites
assets/game/ui-icons/       resource icons
assets/game/weapons/        combat weapon sprites
```

Main data files:

```text
data/starship_manifest.json
data/station_manifest.json
data/pod_manifest.json
data/planet_manifest.json
data/planetData.json
data/stationData.json
data/ship_size_config.json
```

Build folders such as `dist/` and `dist-chrome-extension/` are generated output. Recreate them with:

```bash
python3 scripts/build_release.py
```

For quick validation after edits:

```bash
node --check src/main.js
python3 -m json.tool data/starship_manifest.json >/dev/null
python3 -m json.tool data/station_manifest.json >/dev/null
python3 -m json.tool data/planet_manifest.json >/dev/null
```
