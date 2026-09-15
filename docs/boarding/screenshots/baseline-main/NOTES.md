# Boarding baseline screenshots (main, before engine)

Captured from the running game on bake-off `main` @ `14f0857` (boarding brief merged, engine not yet implemented). Viewport 1280×720 Chromium (Playwright). **No Board / capture / command-transfer chrome yet.** Tractor remains a device hold. Target window shows Hail Ship only.

## Shots

| File | What |
| --- | --- |
| `01-flight-hud.png` | Flight HUD, stats strip, minimap, bottom dock |
| `02-ops-ew.png` | OPS / Power + Phase 9.2 EW controls (pre-boarding) |
| `03-inventory.png` | Inventory / weapon slots + dedicated EW slot |
| `04-settings.png` | Settings + Security operator panel |
| `05-target.png` | Target / contact window — Hail only, no Board |

## Overflow / clip (pre-boarding)

OPS: `clippedControls: []`, `dockClear: true`, contained `overflow-y: auto`.
Inventory / Settings: `clippedControls: []`.
Target: Hail Ship only; `clippedControls: []`. Window `bottom` 702 overlaps dock `top` 648 (`dockClear: false` on the target host). Boarding chrome must not add clipped controls.

- No Board / outcome / command-transfer / away-team XP readout on this baseline.
- Tractor is unchanged (device id 25). Not labeled as Board.
