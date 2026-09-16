# Phase 9.3 after-implementation screenshots

Captured from the running game after the 9.3 scan-poison + DF assist engine. Viewport 1280×720 Chromium (Playwright). Compare with `docs/phase9/screenshots/baseline-93/`.

DockClear polish is **out**. Process lock: `clippedControls: []`; no horizontal overflow.

## Shots

| File | What |
| --- | --- |
| `01-flight-hud.png` | Flight HUD, stats strip, minimap, bottom dock |
| `02-ops-ew.png` | OPS / Power + 9.3 scan-poison / DF assist controls |
| `03-inventory.png` | Inventory / weapon slots + dedicated EW slot |
| `04-settings.png` | Settings + Security operator panel |
| `05-target.png` | Target / contact window |
| `06-ops-ew-live.png` | Poison On + DF On + poisoned Focused Scan + DF cue readout |
| `07-ops-ew-scrolled.png` | OPS scrolled to poison / DF / cue / sayable rows |

## UI fit (gate 8)

OPS EW controls including new 9.3 rows stay inside the panel. `clippedControls: []`. No horizontal overflow. Contained `overflow-y: auto` is OK. DockClear polish not opened.

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
    "scrollH": 706,
    "clientW": 701,
    "clientH": 544,
    "panelW": 716,
    "panelH": 544,
    "top": 90,
    "bottom": 634,
    "left": 282,
    "right": 998,
    "text": "POWER (OPS)\nPOWER DISTRIBUTION (OPS) CONTROL\nEnergy 125/125 (100%) | Budget 20/20 | Drag a tank or use -/+\nRESERVE\n5\nENGINES\n5\nWEAPONS\n5\nSHIELDS\n5\nELECTRONIC WARFARE\nReserved ew · burn-through available · magnitudes injectable\nSLOT\nEmpty\nCompact\nTactical\nFleet\nJAMMER\nOff\nOn\nOFF\nLOBE\n0° / 50°\nIN-BEAM ≠ CLOAK\nECCM\nOff\nBoost\nSHARE\nOUT\nDETECTION ONLY\nTRANSPONDER\nOff\nTrue\nSpoof\nFOCUS SCAN\nScan\nIDLE\nSCA"
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
    "scrollH": 723,
    "clientW": 701,
    "clientH": 544,
    "panelW": 716,
    "panelH": 544,
    "top": 90,
    "bottom": 634,
    "left": 282,
    "right": 998,
    "text": "POWER (OPS)\nPOWER DISTRIBUTION (OPS) CONTROL\nEnergy 125/125 (100%) | Budget 20/20 | Drag a tank or use -/+\nRESERVE\n5\nENGINES\n5\nWEAPONS\n5\nSHIELDS\n5\nELECTRONIC WARFARE\nReserved ew · burn-through available · magnitudes injectable\nSLOT\nEmpty\nCompact\nTactical\nFleet\nJAMMER\nOff\nOn\nPOWER-LIMITED\nLOBE\n0° / 50°\nIN-BEAM ≠ CLOAK\nECCM\nOff\nBoost\nSHARE\nOUT\nDETECTION ONLY\nTRANSPONDER\nOff\nTrue\nSpoof\nFOCUS SCAN\nSca"
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
    "scrollH": 723,
    "clientW": 701,
    "clientH": 544,
    "panelW": 716,
    "panelH": 544,
    "top": 90,
    "bottom": 634,
    "left": 282,
    "right": 998,
    "text": "POWER (OPS)\nPOWER DISTRIBUTION (OPS) CONTROL\nEnergy 125/125 (100%) | Budget 20/20 | Drag a tank or use -/+\nRESERVE\n5\nENGINES\n5\nWEAPONS\n5\nSHIELDS\n5\nELECTRONIC WARFARE\nReserved ew · burn-through available · magnitudes injectable\nSLOT\nEmpty\nCompact\nTactical\nFleet\nJAMMER\nOff\nOn\nPOWER-LIMITED\nLOBE\n0° / 50°\nIN-BEAM ≠ CLOAK\nECCM\nOff\nBoost\nSHARE\nOUT\nDETECTION ONLY\nTRANSPONDER\nOff\nTrue\nSpoof\nFOCUS SCAN\nSca"
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
    "scrollH": 2174,
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
    "scrollH": 263,
    "clientW": 316,
    "clientH": 263,
    "panelW": 330,
    "panelH": 277,
    "top": 347,
    "bottom": 624,
    "left": 18,
    "right": 348,
    "text": "TARGET LOCKED\nIKS KAHLESS\nKlingon | neutral | 60\nVOR'CHA ATTACK CRUISER\nSHIELD\n100%\nHULL\n100%\nHAIL SHIP\nBOARD REFUSED\nCAPTURE\nSCUTTLE\nFAIL\nHull above 10%. Boarding refused.\nTractor hold is not a capture. · hull-above-threshold\nAway-team XP: Not tracked yet · tracked: false"
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
- New 9.3 rows (scan-poison / DF assist / cue) are reachable by contained scroll and do not paint under the dock.
