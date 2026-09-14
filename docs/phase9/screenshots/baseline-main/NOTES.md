# Phase 9.1 baseline screenshots (main, before engine)

Captured from the running game on bake-off `main` after PR #34 docs merge and Phase 9 engine PR #33. Viewport 1280×720 Chromium. **No 9.1 controls exist yet.**

## Shots

| File | What |
| --- | --- |
| `01-flight-hud.png` | Flight HUD, stats strip, minimap, bottom dock |
| `02-ops-power-panel.png` | OPS / Power Distribution panel |
| `02b-ops-panel-only.png` | OPS panel crop |
| `03-inventory-weapons.png` | Inventory / weapon slots (no EW slot) |
| `04-target-contact-window.png` | Target / contact window if a hull was selectable |
| `05-settings-security.png` | Settings + Security operator panel |

## Existing clip / overflow

```json
{
  "ops": {
    "overflowX": false,
    "overflowY": false,
    "scrollH": 328,
    "clientH": 328
  },
  "inventory": {
    "overflowX": false,
    "overflowY": false,
    "scrollH": 460,
    "clientH": 460
  },
  "target": {
    "hidden": true,
    "overflowX": false,
    "overflowY": false
  },
  "settings": {
    "overflowX": false,
    "overflowY": true,
    "scrollH": 2014,
    "clientH": 588
  }
}
```

- Inventory and Settings panels scroll internally (`overflow-y: auto`) when content exceeds `max-height`. That is **contained scroll**, not clip of controls out of the designated box.
- Target window: visible after selecting a live hull in hail range (`04-target-contact-window.png` / `04b-target-window-only.png`). No clip; box is 316×310. Contact book is this window, not a dedicated list.
- Settings / Security: contained vertical scroll (`scrollH` 2014 vs `clientH` 588). Bottom dock overlaps the lower edge of the centered panel — existing, not 9.1. No EW controls (regex `hasEw` was a false positive on other copy).
- **No EW panel** — jammer Off/On, spin-up, ECCM, interference labels, transponder claim, HoJ matrix row, and residue contact UI are absent on this baseline.

## Probe dump

```json
{
  "dedicatedEwPanel": false,
  "jammerControls": false,
  "eccmControls": false,
  "transponderControls": false,
  "hojMatrixUi": false,
  "residueContactUi": false,
  "opsOverflow": {
    "panelW": 716,
    "panelH": 328,
    "scrollW": 701,
    "scrollH": 328,
    "clientW": 701,
    "clientH": 328,
    "overflowX": false,
    "overflowY": false,
    "text": "×\nPOWER (OPS)\nPOWER DISTRIBUTION (OPS) CONTROL\nEnergy 125/125 (100%) | Budget 20/20 | Drag a tank or use -/+\nRESERVE\n5\nENGINES\n5\nWEAPONS\n5\nSHIELDS\n5\nCLOSE"
  },
  "inventoryOverflow": {
    "overflowX": false,
    "overflowY": false,
    "scrollH": 460,
    "clientH": 460,
    "hasEw": false,
    "text": "×\nINVENTORY\n2800\n0\n2/90\n0/85\nFLAGS\nFerengi\nRAISED\nSTATION PLANS\nNo station plans owned.\n1: Empty\n2: Empty\n3: Empty\nCONTRACTS\nNo active contracts.\nCARGO PODS\n1: 0t Empty\n2: 0t Empty\n3: 0t Empty\n4: 0t Empty\n5: 0t Empty\n6: 0t Empty\n7: 0t Empty\n8: 0t Empty\n9: 0t Empty\n10: 0t Empty"
  },
  "targetOverflow": {
    "hidden": true,
    "overflowX": false,
    "overflowY": false,
    "text": "",
    "html": ""
  },
  "settingsOverflow": {
    "overflowX": false,
    "overflowY": true,
    "scrollH": 2014,
    "clientH": 588,
    "hasEw": true,
    "text": "×\nSETTINGS\nMUTE GAME SOUNDS\nOFF\nSilences game audio when sound hooks are active.\nHIGH PERFORMANCE\nOFF\nReduces decorative rendering and expensive visual passes.\nREDUCED EFFECTS\nOFF\nSoftens explosions, nebula overlays, and transient visual effects.\nSECURITY\nStanding orders for your side (Ferengi). They survive flag changes. Challenge requests a movement and identity check. Closed requests withdrawal. Refusal alone does not authorize weapons; your rules of engagement still apply. Unknown access remains reserved until sensors exist. Alerts change what you are told, not what happened. Silent does not clear a refusal or a kill. Refusal and inability never authorize weapons.\nEMPIRE DEFAULT ROE\nRETURN FIRE\nDEFEND\nEngage hostiles toward you and anyone at war with the flag you fly.\nEMPIRE ALERTS\nALL\nINCIDENTS\nSILENT\nEMPIRE ACCESS\nWARFLAG\nOPEN\nCHALLENGE\nCLOSED\nINDEPENDENT\nOPEN\nCHALLENGE\nCLOSED\nUNKNOWN unavailable until sensors exist\nOPEN\nCHALLENGE\nCLOSED\nOTHER\nOPEN\nCHALLENGE\nCLOSED\nHOLDINGS\nORION\nusing empire default\nEMPIRE DEFAULT\nRETURN FIRE\nDEFEND\nEffective ROE: defend\nEMPIRE ALERTS\nALL\nINCIDENTS\nSILENT\nWARFLAG\nOPEN\nCHALLENGE\nCLOSED\nINDEPENDENT\nOPEN\nCHALLENGE\nCLOSED\nUNKNOWN unavailable unt"
  },
  "notes": [
    "No dedicated EW / jammer / ECCM / transponder controls exist on main.",
    "OPS is Power Distribution tanks only (RESERVE/ENGINES/WEAPONS/SHIELDS).",
    "Inventory shows weapon slots 1–3; no ew_equipment slot.",
    "Contact book is not a dedicated panel — contacts appear as the target window when a hull is selected.",
    "Settings/Security is the closest existing operator panel (ROE / holdings / incidents)."
  ]
}
```
