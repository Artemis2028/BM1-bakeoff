# Phase 9.2 baseline screenshots (main, before 9.2 engine)

Captured from the running game on bake-off `main` @ `cc9d338` before Phase 9.2 engine work. Viewport 1280×720 Chromium (Playwright).

## Shots

| File | What |
| --- | --- |
| `01-flight-hud.png` | Flight HUD, stats strip, minimap, bottom dock |
| `02-ops-ew.png` | OPS / Power + Phase 9.1 EW controls (pre-9.2) |
| `03-inventory.png` | Inventory / weapon slots + dedicated EW slot |
| `04-settings.png` | Settings + Security operator panel |
| `05-target.png` | Target / contact window |

## Overflow / clip (pre-9.2 residual)

OPS:
```json
{
  "overflowX": false,
  "clippedControls": [],
  "dockClear": false,
  "ops": {
    "hidden": false,
    "overflowX": false,
    "overflowY": true,
    "scrollW": 701,
    "scrollH": 595,
    "clientW": 701,
    "clientH": 588,
    "panelW": 716,
    "panelH": 588,
    "top": 68,
    "bottom": 656,
    "left": 282,
    "right": 998,
    "text": "POWER (OPS)\nPOWER DISTRIBUTION (OPS) CONTROL\nEnergy 125/125 (100%) | Budget 20/20 | Drag a tank or use -/+\nRESERVE\n5\nENGINES\n5\nWEAPONS\n5\nSHIELDS\n5\nELECTRONIC WARFARE\nReserved ew · burn-through available · magnitudes injectable\nSLOT\nEmpty\nCompact\nTactical\nFleet\nJAMMER\nOff\nOn\nOFF\nECCM\nOff\nBoost\nTRANSPONDER\nOff\nTrue\nSpoof\nRECEIVER\nCLEAR\nHoJ: anti-emitter · unmounted · new\nCLOSE"
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
  "dockClear": false,
  "inventory": {
    "hidden": false,
    "overflowX": false,
    "overflowY": true,
    "scrollW": 701,
    "scrollH": 597,
    "clientW": 701,
    "clientH": 588,
    "panelW": 716,
    "panelH": 588,
    "top": 68,
    "bottom": 656,
    "left": 282,
    "right": 998,
    "text": "INVENTORY\n2800\n0\n2/90\n0/85\nFLAGS\nFerengi\nRAISED\nSTATION PLANS\nNo station plans owned.\n1: Empty\n2: Empty\n3: Empty\nEW EQUIPMENT\nEW: Empty\nDedicated slot — not a weapon mount, not the sensor suite.\nCONTRACTS\nNo active contracts.\nCARGO PODS\n1: 0t Empty\n2: 0t Empty\n3: 0t Empty\n4: 0t Empty\n5: 0t Empty\n6: 0t Empty\n7: 0t Empty\n8: 0t Empty\n9: 0t Empty\n10: 0t Empty"
  }
}
```

Settings:
```json
{
  "overflowX": false,
  "clippedControls": [
    {
      "label": "open",
      "top": 648,
      "bottom": 680,
      "dockTop": 648
    },
    {
      "label": "challenge",
      "top": 648,
      "bottom": 680,
      "dockTop": 648
    },
    {
      "label": "open",
      "top": 690,
      "bottom": 722,
      "dockTop": 648
    },
    {
      "label": "challenge",
      "top": 690,
      "bottom": 722,
      "dockTop": 648
    }
  ],
  "dockClear": false,
  "settings": {
    "hidden": false,
    "overflowX": false,
    "overflowY": true,
    "scrollW": 701,
    "scrollH": 2072,
    "clientW": 701,
    "clientH": 588,
    "panelW": 716,
    "panelH": 588,
    "top": 68,
    "bottom": 656,
    "left": 282,
    "right": 998,
    "text": "SETTINGS\nMUTE GAME SOUNDS\nOFF\nSilences game audio when sound hooks are active.\nHIGH PERFORMANCE\nOFF\nReduces decorative rendering and expensive visual passes.\nREDUCED EFFECTS\nOFF\nSoftens explosions, nebula overlays, and transient visual effects.\nSECURITY\nStanding orders for your side (Ferengi). They survive flag changes. Challenge requests a movement and identity check. Closed requests withdrawal. "
  }
}
```

Target:
```json
{
  "overflowX": false,
  "clippedControls": [],
  "target": {
    "hidden": true,
    "overflowX": false,
    "overflowY": false,
    "scrollW": 0,
    "scrollH": 0,
    "clientW": 0,
    "clientH": 0,
    "panelW": 0,
    "panelH": 0,
    "top": 0,
    "bottom": 0,
    "left": 0,
    "right": 0,
    "text": ""
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

- Contained `overflow-y: auto` is OK. Horizontal overflow is not.
- Dock-clear residual on centered `.top-left-panel` vs `.bottom-dock` is the Phase 9.2 gate 7 residual to close.
