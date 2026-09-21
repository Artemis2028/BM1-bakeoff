# Away-team XP S30 chrome screenshots

Captured from the running game after the S30 engine. Viewport 1280×720 Chromium (Playwright). Boarding combat chrome (Board / Capture / Scuttle / Fail, hull% refuse, tractor note) is unchanged. Only the XP sayable line is honest.

**No Referee Pass claimed.** `tractorIsBoarding()` remains false. DockClear CSS untouched. `clippedControls: []`. `targetDockClear: true`.

Compare residual copy on `main` @ `73b2963` (`docs/boarding/screenshots/boarding/`) which still said `Away-team XP: Not tracked yet · tracked: false`.

## Shots

| File | What |
| --- | --- |
| `01-flight-hud.png` | Flight HUD (unchanged lane) |
| `02-ops-ew.png` | OPS / Power + EW (unchanged lane) |
| `03-inventory.png` | Inventory / weapon slots (XP not in slots) |
| `04-settings.png` | Settings (unchanged lane) |
| `05-target-full-hull.png` | Target at full hull — Board refused; XP `tracked · named mix · total 0` |
| `06-target-boardable.png` | ≤10% hull — Board available; XP `tracked · named mix · total 0` |
| `07-command-transfer.png` | After capture inject — transfer line `tracked · named mix · total 10` |

## Chrome honesty (from overflow JSON)

Target (full hull): `Away-team XP: tracked · named mix · total 0`  
Target (boardable): `Away-team XP: tracked · named mix · total 0`  
Command transfer: `COMMAND TRANSFER · Away-team XP: tracked · named mix · total 10`
