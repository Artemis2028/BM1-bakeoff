# DockClear baseline screenshots (main, before S28 layout)

Captured from bake-off `main` @ `3bdc18a` (dock-clear brief merged, engine not yet applied). Viewport 1280×720 Chromium (Playwright).

**No Referee Pass claimed.** Operator-panel S16.15 is the regression check. Target / map / related dock chrome are the residual.

## Shots

| File | What |
| --- | --- |
| `01-ops.png` | OPS / Power operator panel |
| `02-inventory.png` | Inventory operator panel |
| `03-settings.png` | Settings operator panel |
| `04-target.png` | Target window (operator panel closed) |
| `05-starchart.png` | Interstellar map / star-chart chrome |
| `06-dock-hover.png` | Bottom-dock hover-expand |

## UI fit

OPS:
```json
{
  "overflowX": false,
  "clippedControls": [],
  "dockClear": true,
  "targetDockClear": false,
  "mapDockClear": false,
  "knowledgeDockClear": true,
  "leakedNames": [],
  "mapOpen": false,
  "token": "88px",
  "panel": {
    "hidden": false,
    "overflowX": false,
    "overflowY": true,
    "scrollW": 716,
    "scrollH": 544,
    "clientW": 716,
    "clientH": 540,
    "panelW": 720,
    "panelH": 544,
    "top": 88,
    "bottom": 632,
    "left": 280,
    "right": 1000,
    "text": "×\nPOWER (OPS)\nPOWER DISTRIBUTION (OPS) CONTROL\nEnergy 125/125 (100%) | Budget 20/20 | Drag a tank or use -/+\nRESERVE\n5\nENGINES\n5\nWEAPONS\n5\nSHIELDS\n5\nELECTRONIC WARFARE\nReserved ew · burn-through available · magnitudes injectable\nSLOT\nEmpty\nCompact\nTactical\nFleet\nJAMMER\nOff\nOn\nOFF\nLOBE\n0° / 50°\nIN-BEAM ≠ CLOAK\nECCM\nOff\nBoost\nSHARE\nOUT\nDETECTION ONLY\nTRANSPONDER\nOff\nTrue\nSpoof\nFOCUS SCAN\nScan\nIDLE\nSCAN-POISON\nOff\nOn\nOFF\nDF ASSIST\nOff\nOn\nOFF\nHEAT\nOff\nPaying\n1\nDECOYS\nOff\nOn\n0\nSILENT\nOff\nOn\nRECEIVER\nCLEAR\nHoJ: anti-emitter · unmounted · new\nDF cue: none — classification only when a paid in-lobe emission is heard\nInterference. Burn-through available — not a cloak. Scan poisoned / DF cue as marked. Residue held.\nCLOSE"
  },
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
  "map": {
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
    "text": "\n      ×\n    "
  },
  "mapClose": {
    "hidden": false,
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
    "text": "×"
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
  },
  "reachable": []
}
```

Inventory:
```json
{
  "overflowX": false,
  "clippedControls": [],
  "dockClear": true,
  "targetDockClear": false,
  "mapDockClear": false,
  "knowledgeDockClear": true,
  "leakedNames": [],
  "mapOpen": false,
  "token": "88px",
  "panel": {
    "hidden": false,
    "overflowX": false,
    "overflowY": true,
    "scrollW": 716,
    "scrollH": 544,
    "clientW": 716,
    "clientH": 540,
    "panelW": 720,
    "panelH": 544,
    "top": 88,
    "bottom": 632,
    "left": 280,
    "right": 1000,
    "text": "×\nINVENTORY\n2800\n0\n2/90\n0/85\nFLAGS\nFerengi\nRAISED\nPASSES\nNo facility passes owned.\nCredentials. Inventory — not a weapon slot, not a firing solution.\nSTATION PLANS\nNo station plans owned.\nUnarmed — three empty hardpoints.\n1: Empty\n2: Empty\n3: Empty\nEW EQUIPMENT\nEW: Empty\nDedicated slot — not a weapon mount, not the sensor suite.\nCONTRACTS\nNo active contracts.\nCARGO PODS\n1: 0t Empty\n2: 0t Empty\n3: 0t Empty\n4: 0t Empty\n5: 0t Empty\n6: 0t Empty\n7: 0t Empty\n8: 0t Empty\n9: 0t Empty\n10: 0t Empty"
  },
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
  "map": {
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
    "text": "\n      ×\n    "
  },
  "mapClose": {
    "hidden": false,
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
    "text": "×"
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
  },
  "reachable": []
}
```

Settings:
```json
{
  "overflowX": false,
  "clippedControls": [],
  "dockClear": true,
  "targetDockClear": false,
  "mapDockClear": false,
  "knowledgeDockClear": true,
  "leakedNames": [],
  "mapOpen": false,
  "token": "88px",
  "panel": {
    "hidden": false,
    "overflowX": false,
    "overflowY": true,
    "scrollW": 716,
    "scrollH": 544,
    "clientW": 716,
    "clientH": 540,
    "panelW": 720,
    "panelH": 544,
    "top": 88,
    "bottom": 632,
    "left": 280,
    "right": 1000,
    "text": "×\nSETTINGS\nMUTE GAME SOUNDS\nOFF\nSilences game audio when sound hooks are active.\nHIGH PERFORMANCE\nOFF\nReduces decorative rendering and expensive visual passes.\nREDUCED EFFECTS\nOFF\nSoftens explosions, nebula overlays, and transient visual effects.\nSECURITY\nStanding orders for your side (Ferengi). They survive flag changes. Challenge requests a movement and identity check. Closed requests withdrawal. Refusal alone does not authorize weapons; your rules of engagement still apply. Unknown access remains reserved until sensors exist. Alerts change what you are told, not what happened. Silent does not clear a refusal or a kill. Refusal and inability never authorize weapons.\nEMPIRE DEFAULT ROE\nRETURN FIRE\nDEFEND\nEngage hostiles toward you and anyone at war with the flag you fly.\nEMPIRE ALERTS\nALL"
  },
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
  "map": {
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
    "text": "\n      ×\n    "
  },
  "mapClose": {
    "hidden": false,
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
    "text": "×"
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
  },
  "reachable": []
}
```

Target:
```json
{
  "overflowX": false,
  "clippedControls": [],
  "dockClear": false,
  "targetDockClear": true,
  "mapDockClear": false,
  "knowledgeDockClear": true,
  "leakedNames": [],
  "mapOpen": false,
  "token": "88px",
  "panel": {
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
  "target": {
    "hidden": false,
    "overflowX": false,
    "overflowY": false,
    "scrollW": 316,
    "scrollH": 161,
    "clientW": 316,
    "clientH": 161,
    "panelW": 330,
    "panelH": 175,
    "top": 449,
    "bottom": 624,
    "left": 18,
    "right": 348,
    "text": "CONTACT\nUNIDENTIFIED CONTACT\nNo identification\nUnclassified | 784\nUNKNOWN\nContact held. No firing solution.\nAway-team XP: Not tracked yet"
  },
  "map": {
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
    "text": "\n      ×\n    "
  },
  "mapClose": {
    "hidden": false,
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
    "text": "×"
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
  },
  "reachable": []
}
```

Star chart:
```json
{
  "overflowX": false,
  "clippedControls": [],
  "dockClear": false,
  "targetDockClear": true,
  "mapDockClear": false,
  "knowledgeDockClear": true,
  "leakedNames": [],
  "mapOpen": true,
  "token": "88px",
  "panel": {
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
    "text": "TARGET LOCKED\nIKS SWORD OF HONOR\nKlingon | neutral | 60\nVOR'CHA ATTACK CRUISER\nSHIELD\n100%\nHULL\n100%\nHAIL SHIP\nBOARD REFUSED\nCAPTURE\nSCUTTLE\nFAIL\nHull above 10%. Boarding refused.\nTractor hold is not a capture. · hull-above-threshold\nAway-team XP: Not tracked yet · tracked: false"
  },
  "map": {
    "hidden": false,
    "overflowX": false,
    "overflowY": false,
    "scrollW": 1280,
    "scrollH": 720,
    "clientW": 1280,
    "clientH": 720,
    "panelW": 1280,
    "panelH": 720,
    "top": 0,
    "bottom": 720,
    "left": 0,
    "right": 1280,
    "text": "×"
  },
  "mapClose": {
    "hidden": false,
    "overflowX": false,
    "overflowY": false,
    "scrollW": 26,
    "scrollH": 26,
    "clientW": 26,
    "clientH": 26,
    "panelW": 26,
    "panelH": 26,
    "top": 75,
    "bottom": 101,
    "left": 1140,
    "right": 1166,
    "text": "×"
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
  },
  "reachable": [
    "Hail Ship",
    "Board refused",
    "Capture",
    "Scuttle",
    "Fail"
  ]
}
```

Dock hover:
```json
{
  "overflowX": false,
  "clippedControls": [],
  "dockClear": false,
  "targetDockClear": true,
  "mapDockClear": false,
  "knowledgeDockClear": true,
  "leakedNames": [],
  "mapOpen": false,
  "token": "88px",
  "panel": {
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
    "text": "TARGET LOCKED\nIKS SWORD OF HONOR\nKlingon | neutral | 60\nVOR'CHA ATTACK CRUISER\nSHIELD\n100%\nHULL\n100%\nHAIL SHIP\nBOARD REFUSED\nCAPTURE\nSCUTTLE\nFAIL\nHull above 10%. Boarding refused.\nTractor hold is not a capture. · hull-above-threshold\nAway-team XP: Not tracked yet · tracked: false"
  },
  "map": {
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
    "text": "\n      ×\n    "
  },
  "mapClose": {
    "hidden": false,
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
    "text": "×"
  },
  "dock": {
    "hidden": false,
    "overflowX": false,
    "overflowY": false,
    "scrollW": 552,
    "scrollH": 50,
    "clientW": 552,
    "clientH": 50,
    "panelW": 560,
    "panelH": 58,
    "top": 648,
    "bottom": 706,
    "left": 360,
    "right": 920,
    "text": "TGT\nTARGET\nHAIL\nHAIL\nMAP\nMAP\nCAR\nCARGO\nPWR\nPOWER\nCON\nCONTRACT\nSAV\nSAVE"
  },
  "reachable": [
    "Hail Ship",
    "Board refused",
    "Capture",
    "Scuttle",
    "Fail"
  ]
}
```
