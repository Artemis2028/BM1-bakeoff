# Phase 9.2 after-implementation screenshots

Captured from the running game on `cursor/phase92-ew-depth-engine-4d73` after the 9.2 engine. Viewport 1280×720 Chromium (Playwright). Compare with `docs/phase9/screenshots/baseline-92/`.

## Shots

| File | What |
| --- | --- |
| `01-flight-hud.png` | Flight HUD, stats strip, minimap, bottom dock |
| `02-ops-ew.png` | OPS / Power + 9.2 lobe / share / focus / heat / decoy / silent |
| `03-inventory.png` | Inventory / weapon slots + dedicated EW slot |
| `04-settings.png` | Settings + Security operator panel |
| `05-target.png` | Target / contact window |
| `06-ops-ew-live.png` | Compact jammer On + heat paying + decoy + silent + ECCM Boost |
| `07-ops-ew-scrolled.png` | OPS scrolled to last EW rows (Silent / HoJ / sayable) above the dock |

## UI fit (gate 7)

OPS EW controls stay inside the panel. `clippedControls: []`. No horizontal overflow. Panel bottom is above the dock (`dockClear: true`). Contained `overflow-y: auto` is OK.

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

OPS live:
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
    "text": "POWER (OPS)\nPOWER DISTRIBUTION (OPS) CONTROL\nEnergy 125/125 (100%) | Budget 20/20 | Drag a tank or use -/+\nRESERVE\n5\nENGINES\n5\nWEAPONS\n5\nSHIELDS\n5\nELECTRONIC WARFARE\nReserved ew · burn-through available · magnitudes injectable\nSLOT\nEmpty\nCompact\nTactical\nFleet\nJAMMER\nOff\nOn\nSPIN-UP\nLOBE\n0° / 50°\nIN-BEAM ≠ CLOAK\nECCM\nOff\nBoost\nSHARE\nOUT\nDETECTION ONLY\nTRANSPONDER\nOff\nTrue\nSpoof\nFOCUS SCAN\nScan\nIDLE"
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

OPS scrolled:
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
    "text": "POWER (OPS)\nPOWER DISTRIBUTION (OPS) CONTROL\nEnergy 125/125 (100%) | Budget 20/20 | Drag a tank or use -/+\nRESERVE\n5\nENGINES\n5\nWEAPONS\n5\nSHIELDS\n5\nELECTRONIC WARFARE\nReserved ew · burn-through available · magnitudes injectable\nSLOT\nEmpty\nCompact\nTactical\nFleet\nJAMMER\nOff\nOn\nSPIN-UP\nLOBE\n0° / 50°\nIN-BEAM ≠ CLOAK\nECCM\nOff\nBoost\nSHARE\nOUT\nDETECTION ONLY\nTRANSPONDER\nOff\nTrue\nSpoof\nFOCUS SCAN\nScan\nIDLE"
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
    "right": 998,
    "text": "INVENTORY\n2800\n0\n2/90\n0/85\nFLAGS\nFerengi\nRAISED\nSTATION PLANS\nNo station plans owned.\n1: Empty\n2: Empty\n3: Empty\nEW EQUIPMENT\nEW: compact jammer\nDedicated slot — not a weapon mount, not the sensor suite.\nCONTRACTS\nNo active contracts.\nCARGO PODS\n1: 0t Empty\n2: 0t Empty\n3: 0t Empty\n4: 0t Empty\n5: 0t Empty\n6: 0t Empty\n7: 0t Empty\n8: 0t Empty\n9: 0t Empty\n10: 0t Empty"
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
    "scrollH": 2016,
    "clientW": 701,
    "clientH": 544,
    "panelW": 716,
    "panelH": 544,
    "top": 90,
    "bottom": 634,
    "left": 282,
    "right": 998,
    "text": "SETTINGS\nMUTE GAME SOUNDS\nOFF\nSilences game audio when sound hooks are active.\nHIGH PERFORMANCE\nOFF\nReduces decorative rendering and expensive visual passes.\nREDUCED EFFECTS\nOFF\nSoftens explosions, nebula overlays, and transient visual effects.\nSECURITY\nStanding orders for your side (Ferengi). They survive flag changes. Challenge requests a movement and identity check. Closed requests withdrawal. "
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
    "scrollH": 184,
    "clientW": 316,
    "clientH": 184,
    "panelW": 330,
    "panelH": 198,
    "top": 504,
    "bottom": 702,
    "left": 18,
    "right": 348,
    "text": "TARGET LOCKED\nIKS KAHLESS\nKlingon | neutral | 60\nVOR'CHA ATTACK CRUISER\nSHIELD\n100%\nHULL\n100%\nHAIL SHIP"
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

- Close is the top-right panel chrome, not under the dock.
- Last EW rows (decoy / silent / HoJ) are reachable by contained scroll and do not paint under the dock.
