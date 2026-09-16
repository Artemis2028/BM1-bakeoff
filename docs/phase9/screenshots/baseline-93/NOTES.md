# Phase 9.3 baseline screenshots (main, before 9.3 engine)

Captured from the running game on bake-off `main` @ `7eb2387` **before** Phase 9.3 scan-poison / DF assist engine work. Viewport 1280×720 Chromium (Playwright). Compare later with `docs/phase9/screenshots/phase93/`.

DockClear polish is **out** of this lane. `clippedControls: []` is the process lock.

## Shots

| File | What |
| --- | --- |
| `01-flight-hud.png` | Flight HUD, stats strip, minimap, bottom dock |
| `02-ops-ew.png` | OPS / Power + Phase 9.2 EW controls (pre-9.3; no poison / DF rows) |
| `03-inventory.png` | Inventory / weapon slots + dedicated EW slot |
| `04-settings.png` | Settings + Security operator panel |
| `05-target.png` | Target / contact window |

## Overflow / clip (pre-9.3)

OPS:
```json
{
  "overflowX": false,
  "clippedControls": [],
  "dockClear": true,
  "ops": {
    "hidden": false,
    "overflowX": false,
    "overflowY": true,
    "scrollW": 701,
    "scrollH": 643,
    "clientW": 701,
    "clientH": 544,
    "panelW": 716,
    "panelH": 544,
    "top": 90,
    "bottom": 634,
    "left": 282,
    "right": 998,
    "text": "POWER (OPS)\nPOWER DISTRIBUTION (OPS) CONTROL\nEnergy 125/125 (100%) | Budget 20/20 | Drag a tank or use -/+\nRESERVE\n5\nENGINES\n5\nWEAPONS\n5\nSHIELDS\n5\nELECTRONIC WARFARE\nReserved ew · burn-through available · magnitudes injectable\nSLOT\nEmpty\nCompact\nTactical\nFleet\nJAMMER\nOff\nOn\nOFF\nLOBE\n0° / 50°\nIN-BEAM ≠ CLOAK\nECCM\nOff\nBoost\nSHARE\nOUT\nDETECTION ONLY\nTRANSPONDER\nOff\nTrue\nSpoof\nFOCUS SCAN\nScan\nIDLE\nHEA"
  },
  "dock": {
    "hidden": false,
    "overflowX": false,
    "overflowY": false,
    "scrollW": 378,
    "scrollH": 50,
    "clientW": 378,
    "clientH": 50,
    "panelW": 386,
    "panelH": 58,
    "top": 648,
    "bottom": 706,
    "left": 447,
    "right": 833,
    "text": "TGT\nTARGET\nHAIL\nHAIL\nMAP\nMAP\nCAR\nCARGO\nPWR\nPOWER\nCON\nCONTRACT\nSAV\nSAVE"
  }
}
```

Inventory:
```json
{
  "overflowX": false,
  "clippedControls": [],
  "dockClear": true,
  "inventory": {
    "hidden": false,
    "overflowX": false,
    "overflowY": false,
    "scrollW": 701,
    "scrollH": 541,
    "clientW": 701,
    "clientH": 541,
    "panelW": 716,
    "panelH": 541,
    "top": 90,
    "bottom": 631,
    "left": 282,
    "right": 998
  }
}
```

Settings:
```json
{
  "overflowX": false,
  "clippedControls": [],
  "dockClear": true,
  "settings": {
    "hidden": false,
    "overflowX": false,
    "overflowY": true,
    "scrollW": 701,
    "scrollH": 2174,
    "clientW": 701,
    "clientH": 544
  }
}
```

Target:
```json
{
  "overflowX": false,
  "clippedControls": [],
  "target": {
    "hidden": false,
    "overflowX": false,
    "overflowY": false,
    "scrollW": 316,
    "scrollH": 263,
    "clientW": 316,
    "clientH": 263,
    "panelW": 330,
    "panelH": 277,
    "top": 347,
    "bottom": 624,
    "left": 18,
    "right": 348
  }
}
```

- Contained `overflow-y: auto` is OK. Horizontal overflow is not.
- `clippedControls: []` on OPS / Inventory / Settings / Target.
- DockClear polish is **not** opened by this baseline.
