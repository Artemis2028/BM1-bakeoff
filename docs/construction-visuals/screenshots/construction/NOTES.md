# Construction visuals after-implementation screenshots

Captured from the running game after the S24 construction-visuals engine. Viewport 1280×720 Chromium (Playwright).

Scaffold / workbee / **blue**-beam language is programmatic because `stationconstructing.gif` is not in-tree (`assetMissing: true`). Placeholder gold/cyan dashes remain as HUD only.

**No Referee Pass claimed.** Repair overlay is unchanged. Construction beams are not Phase 4 evidence.

## Shots

| File | What |
| --- | --- |
| `01-baseline-no-site.png` | Flight view before a constructing station is injected |
| `02-construction-site-language.png` | Player-built site: scaffold frame, workbees, blue construction beams + remaining-days HUD |
| `03-construction-complete.png` | After `completeDueStationConstructions` — scaffold / workbee / blue-beam language stops |
| `04-constructing-defense-platform.png` | Constructing platform still shows build language and still cannot repair |

## Probe

```json
{
  "before": {
    "missing": false,
    "idle": {
      "ok": true,
      "missing": false,
      "constructionLockedFromRemastered": false,
      "underConstruction": false,
      "language": {
        "scaffold": false,
        "workbee": false,
        "blueBeam": false,
        "color": null
      },
      "drawn": {
        "scaffold": false,
        "workbee": false,
        "blueBeam": false,
        "color": null
      },
      "assetMissing": true,
      "usesRepairArmsArt": false,
      "placeholderOnly": true,
      "repair": {
        "overlayOnPlayerOnly": true,
        "overlayUsesConstructionArt": false,
        "defensePlatformRepair": false,
        "overlayOnStation": false,
        "overlayOnWorkbee": false
      },
      "evidence": {
        "observedAttacksDelta": 0,
        "flashQueued": false,
        "projectileAdded": false,
        "combatBeamEffectAdded": false,
        "stationFired": false
      },
      "fire": {
        "firingSolutionPresent": false,
        "engagementAuthorizedPresent": false
      },
      "site": {
        "dockRefused": false,
        "stationWeaponIds": []
      },
      "workbee": {
        "hull": false,
        "emptyArmable": false,
        "boardable": false,
        "packHullId": null,
        "inNpcShips": false
      }
    }
  },
  "built": {
    "id": "probe-construct-1789927132859",
    "snap": {
      "ok": true,
      "missing": false,
      "constructionLockedFromRemastered": false,
      "underConstruction": true,
      "language": {
        "scaffold": "programmatic",
        "workbee": "programmatic",
        "blueBeam": true,
        "color": "#3d9cff"
      },
      "drawn": {
        "scaffold": "programmatic",
        "workbee": "programmatic",
        "blueBeam": true,
        "color": "#3d9cff"
      },
      "assetMissing": true,
      "usesRepairArmsArt": false,
      "placeholderOnly": false,
      "repair": {
        "overlayOnPlayerOnly": true,
        "overlayUsesConstructionArt": false,
        "defensePlatformRepair": false,
        "overlayOnStation": false,
        "overlayOnWorkbee": false
      },
      "evidence": {
        "observedAttacksDelta": 0,
        "flashQueued": false,
        "projectileAdded": false,
        "combatBeamEffectAdded": false,
        "stationFired": false
      },
      "fire": {
        "firingSolutionPresent": false,
        "engagementAuthorizedPresent": false
      },
      "site": {
        "dockRefused": true,
        "stationWeaponIds": []
      },
      "workbee": {
        "hull": false,
        "emptyArmable": false,
        "boardable": false,
        "packHullId": null,
        "inNpcShips": false
      }
    },
    "language": {
      "scaffold": "programmatic",
      "workbee": "programmatic",
      "blueBeam": true,
      "color": "#3d9cff",
      "programmatic": true,
      "blue": true
    },
    "centered": {
      "ok": true,
      "id": "probe-construct-1789927132859",
      "x": 1314.2958887447057,
      "y": -533.1197364231091,
      "screenX": 640,
      "screenY": 360,
      "underConstruction": true
    }
  },
  "platform": {
    "id": "probe-construct-1789927133454",
    "snap": {
      "ok": true,
      "missing": false,
      "constructionLockedFromRemastered": false,
      "underConstruction": true,
      "language": {
        "scaffold": "programmatic",
        "workbee": "programmatic",
        "blueBeam": true,
        "color": "#3d9cff"
      },
      "drawn": {
        "scaffold": "programmatic",
        "workbee": "programmatic",
        "blueBeam": true,
        "color": "#3d9cff"
      },
      "assetMissing": true,
      "usesRepairArmsArt": false,
      "placeholderOnly": false,
      "repair": {
        "overlayOnPlayerOnly": true,
        "overlayUsesConstructionArt": false,
        "defensePlatformRepair": false,
        "overlayOnStation": false,
        "overlayOnWorkbee": false
      },
      "evidence": {
        "observedAttacksDelta": 0,
        "flashQueued": false,
        "projectileAdded": false,
        "combatBeamEffectAdded": false,
        "stationFired": false
      },
      "fire": {
        "firingSolutionPresent": false,
        "engagementAuthorizedPresent": false
      },
      "site": {
        "dockRefused": true,
        "stationWeaponIds": []
      },
      "workbee": {
        "hull": false,
        "emptyArmable": false,
        "boardable": false,
        "packHullId": null,
        "inNpcShips": false
      }
    },
    "centered": {
      "ok": true,
      "id": "probe-construct-1789927133454",
      "x": 366.1284328070243,
      "y": 1660.3348735884574,
      "screenX": 640,
      "screenY": 360,
      "underConstruction": true
    }
  },
  "completed": {
    "ok": true,
    "completed": 1,
    "underConstruction": false,
    "languageStopped": true,
    "snapshot": {
      "ok": true,
      "missing": false,
      "constructionLockedFromRemastered": false,
      "underConstruction": false,
      "language": {
        "scaffold": false,
        "workbee": false,
        "blueBeam": false,
        "color": null
      },
      "drawn": {
        "scaffold": "programmatic",
        "workbee": "programmatic",
        "blueBeam": true,
        "color": "#3d9cff"
      },
      "assetMissing": true,
      "usesRepairArmsArt": false,
      "placeholderOnly": true,
      "repair": {
        "overlayOnPlayerOnly": true,
        "overlayUsesConstructionArt": false,
        "defensePlatformRepair": false,
        "overlayOnStation": false,
        "overlayOnWorkbee": false
      },
      "evidence": {
        "observedAttacksDelta": 0,
        "flashQueued": false,
        "projectileAdded": false,
        "combatBeamEffectAdded": false,
        "stationFired": false
      },
      "fire": {
        "firingSolutionPresent": false,
        "engagementAuthorizedPresent": false
      },
      "site": {
        "dockRefused": false,
        "stationWeaponIds": [
          1
        ]
      },
      "workbee": {
        "hull": false,
        "emptyArmable": false,
        "boardable": false,
        "packHullId": null,
        "inNpcShips": false
      }
    },
    "centered": {
      "ok": true,
      "id": "probe-construct-1789927132859",
      "x": 216.12843280702432,
      "y": 1690.3348735884574,
      "screenX": 640,
      "screenY": 360,
      "underConstruction": false
    }
  }
}
```
