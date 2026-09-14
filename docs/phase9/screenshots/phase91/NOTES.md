# Phase 9.1 after-implementation screenshots

Captured from the running game on `cursor/phase91-ew-robustness-engine-8db5` after the 9.1 engine. Viewport 1280×720 Chromium (Playwright). Compare with `docs/phase9/screenshots/baseline-main/`.

## Shots

| File | What |
| --- | --- |
| `01-ops-ew-jammer-off.png` | OPS + EW: empty/compact slot, jammer Off, receiver Clear, HoJ unmounted/new |
| `02-ops-ew-slot-compact.png` | Compact jammer fitted in dedicated slot |
| `03-ops-ew-jammer-spinup.png` | Jammer On + **SPIN-UP** (log: reserved ew billed) |
| `04-ops-ew-eccm-transponder.png` | ECCM Boost + transponder Spoof (claim only) |
| `05-ops-interference-hoj.png` | Receiver **INTERFERENCE** + true-side **FRIENDLY**; HoJ row |
| `06-inventory-ew-slot.png` | Inventory **EW: compact jammer** outside weapon slots 1–3 |
| `07-flight-hud-ew-live.png` | Flight HUD with 9.1 live (residue log / target) |
| `08-residue-target-window.png` | Target window residue: LAST KNOWN, unidentified, burn-through copy |

## UI fit

OPS EW controls (slot, jammer Off/On + status, ECCM, transponder, receiver Clear/Interference + true-side source, HoJ unmounted row, Close) are **inside the panel**. `clippedControls: []`. No horizontal overflow.

```json
{
  "ops": { "overflowX": false, "overflowY": true, "scrollH": 595, "clientH": 588 },
  "inventory": { "overflowX": false, "overflowY": true, "scrollH": 597, "clientH": 588 },
  "target": { "overflowX": false, "overflowY": false }
}
```

- ~7px vertical overflow on OPS is **contained scroll** (`overflow-y: auto` + extra bottom padding so Close clears the dock). All 9.1 buttons remain visible without clipping.
- Inventory EW line fits; weapon slots 1–3 unchanged.
- Target residue note wraps; full sayable is in the contact record. Bottom dock can overlap the lower edge of centered panels — **pre-existing** (same as baseline Settings), not introduced by 9.1 controls.

## Residual clip (call out)

- Bottom dock still overlaps the lower edge of the centered top-left panel (baseline Settings already had this). 9.1 Close/HoJ were moved up so they are not under the dock.
- Target-window residue copy wraps in a 330px box; last line can sit near the dock. Not a 9.1 control clip.
- `SPIN-UP` / `FRIENDLY` status sit in the right-hand grid column (readable, not clipped).
