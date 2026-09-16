# BM1 Phase 9.3 proposal: engine dependencies

**Reviewed document:** `BM1-PHASE9.3-SCAN-POISON-DF-ASSIST-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `2ad94b7` on `main` (16 September 2026), after Phase 10 Dominion-first engine (PR #41). Line numbers below refer to this head and may drift.  
**Method:** read the landed Phase 9 `ewBook` / four families / weapons matrix, Phase 9.1 contest / residue / claim / slot / HoJ helpers, Phase 9.2 lobes / escort share / Focused Scan / heat / decoys / silent-running / magnitudes, Phase 6 contact book + `performActiveScan` / `resolveSearch` / `createScanEmission` / `shareFormationDetection`, Phase 6.5 reserved `ew` consumer + brown-out + suite slot, Phase 7 `fleetOrders`, Phase 4 `deliverReport` / FLASH / `knownIncidentIds`, Phase 1 `playerFaction` / `playerSide`, boarding `tractorIsBoarding`, Phase 10 `dominionBook`, and doctrine fire facts. No engine changes made. This is a dependency/risk checklist for a later writer, not a post-implementation review and not permission to implement before Tenth scopes the lane. **Keep #33, #35, and #37 Pass locked** — do not reopen Phase 9–9.2 gates or regress S14 / S15 / S16. **Do not reopen boarding #38 / #39 or Phase 10 #40 / #41.**

## Verdict in one paragraph

The 9.3 scan-poison + DF assist amend can be implemented without a rewrite, without a second contact book, without a sixth power consumer, and without touching delivered reports, Phase 9 ghosts-as-hulls, boarding prize identity, or Dominion knowledge layers. Prefer **thin new modules** (`src/phase93-*.js`) that subscribe to Phase 9.2 Focused Scan / heat / share, Phase 9.1 contest / residue / HoJ / claim, Phase 9 `ewBook`, Phase 6.5 / 6 / 4 helpers. Scan-poison is extra reserved-`ew` spend that **stalls or degrades live** Focused Scan / `scanConfidence` / `contact.search` / `scanEmission` clocks and may floor ID/firm/FS at **residue** — it must not flip `delivered`, splice `knownIncidentIds`, unsend FLASH, or delete the row. DF assist is extra reserved-`ew` spend that writes a **cue / annotation** (family / bearing / true-side label already allowed) on a **paid** in-lobe emission; it must not gift `firingSolution`, invent a polity from leftover N, rewrite the 9.1 claim layer, or set HoJ `perfectSilentTrack`. Magnitudes are a **playtest ledger** merged into existing resolve helpers. Screenshot / no-clip continues for the later engine PR; dockClear polish is **out**. The load-bearing risks are all integration mistakes: sixth consumer; poison-as-wipe; DF-as-FS; identity from noise; silent perfect-track; contact-delete; off-budget On; remastered watt lock; regressing #33/#35/#37; reopening boarding or Phase 10.

## What already exists (do not reinvent)

| Need | Engine fact at `2ad94b7` |
| --- | --- |
| Four info layers + book | `src/phase6-sensors.js`: `detected`, `identification`, `trackQuality`, `firingSolution`. Caps: 32 contacts / 24 observers. `CONTACT_SOURCES` includes `'ew_ghost'`, `'ew_residue'`, `'ew_decoy'`, `'escort_share'`. |
| Live scan-progress | `createContactRecord` (~270) already stores `scanEmission` and `search`. `createScanEmission` (~905) / `scanEmissionActive` (~915). `resolveSearch` (~851): running / pending / failed / exhausted / success; **must not** invent coordinates; success FS only if earned firm. |
| Focused Scan (9.2) | `src/phase92-spoof-catch.js` `runFocusedScan` (~85): dwell on `ew92.focusedScans`, bills **Sensors** via `focusedScanSensorsExtra` (~44), writes `performActiveScan` emission, catch marks observer row, **never** Phase 1. Poison should stall / fail this path, not replace it. |
| Active scan | `performActiveScan` (~919): detectable emission, may raise ident/track, `firingSolution` only if firm and not cloaked. `scanSelectedShip` (`main.js` ~14410) bills Sensors. |
| Flagship ↔ escort share | `shareFormationDetection` (~1055): detection + last-known, cap area, **`firingSolution: false`**. `src/phase92-escort-share.js` `shareEscortToFlagship` (~43): same caps **plus residue**. Poison counter = this path. **Still never FS.** |
| Report seed is area-only | `seedFromReport`: `detected: true`, `trackQuality: 'area'`, **`firingSolution: false`**. Poison may decay the **live** row; must not edit the Phase 4 report (including `.confidence` on `src/phase4-incidents.js` ~293 / ~619). |
| Same-tick lock drop | `applyLostTrackSameTick`. Poison / DF must use this drop path **without deleting the row**. |
| Ghost / decoy / residue rows | `EW_SOURCE = 'ew_ghost'` (`phase9-ew.js`); `ew_decoy` (`phase92-decoys.js`); `ew_residue` (`phase91-residue.js`). **Do not reuse those sources for poison or DF hulls.** |
| Live jam already residue-floored | `degradeLiveLayers` (~432) + `applyResidueMark`: quality floors at `area`; `applySensorJamming` (~458) returns `reportsDeleted: false`. Poison should **call or wrap** this floor, not reopen `detected: false` void. |
| Reserved EW consumer **on** | `src/phase65-power.js`: `POWER_CONSUMERS` (~30) is exactly five; `EW_EFFECTS_IMPLEMENTED = true`; `reservedEwDraw(activeDraw)`. 9.2 extra draw: `phase92ReservedDraw` (`phase92-heat.js` ~82). 9.3 extra draw **adds into that sum**, does not mint a sixth name. |
| Brown-out already kills EW | `applyBrownout`: order includes `ew`. Poison / DF **weaken via H**, not skip it. |
| 9.1 contest (lobed in 9.2) | `src/phase91-contest.js`: `collectPaidEmitters` (~73), `interferenceLabel` (~133), `snapshotContest` (~166). `src/phase92-lobes.js` masks `cᵢ`. **No DF identity in the label.** |
| 9.1 HoJ | `src/phase91-hoj.js`: emission-only / incarnation-lock / silence→coast; `perfectSilentTrack: false`; bills **weapons** not `ew`. Counters already include `decoy-emitters`. DF may cue; must not flip those flags. |
| 9.1 claim | `src/phase91-transponder.js`: `off` / `true` / `spoof`; `claimRewritesPhase1Identity() === false`. DF must not write this field as identity. |
| 9.2 heat already named DF | `heatSayable` (`phase92-heat.js` ~76): “Loud jam is cheaper and easier to DF.” 9.3 **implements that counter** as a billed cue, not new flavor-only copy. |
| Phase 9 effect book | `state.ewBook`; families `sensor_jamming`, `deceptive_contacts`, `fire_control`, `comms_disruption`. `tryDeliverReport` (~508) delays **new** sends; `erasedByJamming: false`. |
| Fire facts | `liveFireFactsFromEw` deletes `engagement_authorized`; `consultDoctrineFire` still deletes it. Poison / DF must not pass that extra. |
| Boarding landed (do not touch) | `BOARDING_IMPLEMENTED === true` (`boarding-eligibility.js` ~15); `tractorIsBoarding()` **false** (`phase9-ew.js` ~700). S17 `__BM1_PROBE__.boarding`. |
| Phase 10 landed (do not touch) | `state.dominionBook` (`phase10-dominion-book.js`). Stories = knowledge layers. S18 `__BM1_PROBE__.phase10`. |
| Probe surface | `__BM1_PROBE__.phase9` / `.phase91` / `.phase92` / `.boarding` / `.phase10`. S19 should add **`phase93`** rather than scrape private state or fork S14–S18. |
| Offline tests | `scripts/test-phase9-ew-weapons.mjs`, `test-phase91-ew-robustness.mjs`, `test-phase92-ew-depth.mjs`, `test-boarding-capture.mjs`, `test-phase10-dominion.mjs`. Keep green. Add `scripts/test-phase93-ew-poison-df.mjs`. |
| Magnitudes | `MAGNITUDES_LOCKED_FROM_REMASTERED === false` in `phase91-ew-slot.js` / `phase92-magnitudes.js` / boarding / phase10. 9.3 flag stays false. |
| Dock / panel | 9.2 dock-fit already landed. **dockClear polish is a non-goal** for this brief. Later engine still records no-clip for new 9.3 controls. |

## Hooks the writer will have to touch

Prefer thin new files rather than growing `phase9-ew.js` / `phase92-spoof-catch.js` into a second religion:

| Proposed module | Responsibility |
| --- | --- |
| `src/phase93-poison.js` | Scan-poison control: extra `ew` draw; stall / degrade live Focused Scan, `scanConfidence`, `contact.search`, `scanEmission` clocks; residue floor via `applyResidueMark` / `degradeLiveLayers`. Hard-fail report wipe / hull spawn / FS gift. |
| `src/phase93-df.js` | DF assist control: extra `ew` draw; cue / annotation of **paid** in-lobe emission (family / bearing / 9.1 true-side label). Hard-fail FS / identity invent / claim rewrite / `perfectSilentTrack`. |
| `src/phase93-magnitudes.js` | Playtest ledger (proposal §7) + `resolvePhase93Defaults(injected)`. Merge into 9/9.1/9.2 resolve helpers. `MAGNITUDES_LOCKED_FROM_REMASTERED` stays false. |
| `src/phase92-spoof-catch.js` | **Subscribe:** poison may stall `focusedScans[observerKey].untilLocalMs` or fail result this tick. Do not skip Sensors emission. Do not write Phase 1. |
| `src/phase92-heat.js` | **Subscribe:** `phase92ReservedDraw` (or a 9.3 wrapper) **adds** poison + DF draw. Heat emission scale still feeds DF cue quality. |
| `src/phase91-hoj.js` | **Subscribe:** optional cue heading while `emitterDraw > 0`. `silenceEmitter` still coasts. `perfectSilentTrack` stays false. |
| `src/phase91-contest.js` | **Subscribe:** DF labels read `interferenceLabel` true-side. Do not replace RSS / Q / B×√Q. Do not put spoofedFaction on the label. |
| `src/phase91-residue.js` | Poison floors here. Do not mark poison `ghost: true`. |
| `src/phase6-sensors.js` | Optional `scanConfidence` mark on `createContactRecord` (not a fifth religion). `resolveSearch` stall hook. `CONTACT_SOURCES` may add `'ew_scan_poison'` / `'ew_df_assist'` as **marks**, never as hulls. |
| `src/phase9-ew.js` | Subscribe: jam family still residue-floor + `reportsDeleted: false`. Do not replace four families. Do not add a sixth consumer. |
| `src/phase4-incidents.js` | **Do not rewrite.** Poison must not touch `deliverReport` rows or `.confidence`. |
| `src/main.js` | Thin: serialize 9.3 snapshot beside `ew92`; `__BM1_PROBE__.phase93`; controls (scan-poison, DF assist, poisoned Focused Scan state, cue readout). Focused Scan still bills Sensors; poison/DF bill `ew`. |
| `styles.css` | Only as needed for new 9.3 control readout. **Not** dockClear polish. |

Do **not** implement 9.3 inside `src/phase4-incidents.js`, `src/phase5-objectives.js`, `src/boarding-*.js`, or `src/phase10-*.js` as a sneak rewrite. Do **not** implement poison/DF inside `createNpcShip`. Do **not** `git am` remastered patches. Do **not** retune `game_items.json`.

| Existing path | Required integration |
| --- | --- |
| `reservedEwDraw` / `consumerDraws` / `applyBrownout` / `phase92ReservedDraw` | Poison On and/or DF On ⇒ extra `ew` draw **> 0**. Brown-out shrinks both. Off-budget **fails**. `POWER_CONSUMERS.length === 5`. |
| `runFocusedScan` / `focusedScanSensorsExtra` / `performActiveScan` | Poison stalls or fails **live** dwell/result. Emission still written if the scan still runs. Catch still ≠ identity. |
| `resolveSearch` / `createScanEmission` | Poison may keep pending / fail without invented coordinates. Success still cannot gift FS the observer did not earn. |
| `degradeLiveLayers` / `applyResidueMark` / `applySensorJamming` | Poison uses the residue floor. `reportsDeleted: false` stays. |
| `shareEscortToFlagship` / `shareFormationDetection` | Poison counter. Caps unchanged: detection / last-known / residue only. |
| `tryDeliverReport` / `deliverReport` / `observerKnowsIncident` / `pushFlash` | Unchanged contract for delivered rows. Poison is not a second unsend. Delivered `.confidence` untouched. |
| `launchHoj` / `silenceEmitter` | Cue optional while paid. Silence → coast. Observer FS not set. |
| `interferenceLabel` / `snapshotContest` / lobe mask | True-side only. DF must not invent a polity. Friendlies in-lobe still take N. Funded ⇒ `rfRadius > 0`. |
| `setTransponderClaim` / `applyForgettingLadder` | DF does not rewrite claim. Poison does not auto-catch identity. |
| `consultDoctrineFire` / `liveFireFactsFromEw` / `playerForceMayAutoEngage` | Pass layer facts only. Keep the delete. Poison / DF must not flip `mayAutoEngage`. |
| `loadGame` / `saveGame` / `resetRunState` | Serialize poison / DF / cue books beside `ew92`. Load still wipes `systemStates` first. Restore cloak → contact book → ew → 9.1 contest → 9.2 → 9.3 **before** first sensor/AI pass. No `performance.now()` deadlines. Key on `securityInstanceId`. |
| `__BM1_PROBE__` | Add `phase93.snapshot` / injectors (see probe plan). **Fail setup if missing.** Keep `phase9` / `phase91` / `phase92` / `boarding` / `phase10` intact for S14–S18 replay. |

Do **not** hook `loadShipCatalog` as a rewrite, independence mint, `meetPackPurchaseDecision`, Phase 8 stock reprint, boarding, Dominion pack gates, or Reman identity from DF/poison.

## Risks

### 1. Sixth consumer / off-budget poison or DF (gate 1)

A parallel “scan watts” that ignores `consumerDraws`, a sixth `POWER_CONSUMERS` entry, or effects-on-at-draw-0 fails spend-to-suppress and inverts S14.1 / S15.1 / S16.18. Billing poison on Sensors only so it “looks like Focused Scan” while rewriting contacts at `ew` draw 0 is the same fail.

**Gate:** S19.1, S19.7, S19.13.

### 2. Hull spawn / ghost-decoy confusion (gate 2)

`createNpcShip` for a poison contact or a DF “emitter,” `ghost: true` on a living poisoned subject, or `firingSolution` on an `ew_df_assist` row fails ghosts-book-only and decoys≠hulls.

**Gate:** S19.2, S19.12.

### 3. Corrupt becomes wipe (gate 3)

Any poison tick that deletes `reports[id]`, flips `delivered`, clears `knownIncidentIds`, un-pulses FLASH, rewrites delivered `.confidence`, or `delete observer.contacts[id]` fails Phase 9 gate 3 and 9.3 gate 3. Completing `resolveSearch` as a gifted firm lock is the opposite cheat.

**Gate:** S19.3, S19.4, S19.5, S19.14.

### 4. Gifted FS / culture / `engagement_authorized` from DF or poison (gate 4)

Writing observer `firingSolution` because a cue exists, `liveWeaponTrack` from a bearing annotation, `mayAutoEngage` true because “we classified their jammer” / “their scan is junk,” or culture fire from a family tag fails fire gates.

**Gate:** S19.7, S19.12.

### 5. Identity from noise / claim rewrite (gate 4)

Labeling leftover N as a polity, writing `spoofedFaction` from DF, or `state.playerFaction = classifiedFaction` fails 9.1 gate 6 and 9.3 gate 4. Silent omniscient DF (no paid emission, no `ew` draw) fails Phase 6 gate 6.

**Gate:** S19.8, S19.15.

### 6. Perfect silent track (gate 4 + 9.1 gate 5)

HoJ / DF that keeps homing after `silenceEmitter`, silent-running On, or cloak, or transfers incarnation onto ambient `npc.id` reuse, fails silence→coast.

**Gate:** S19.9, S19.10.

### 7. Cloak-void / Q=0 / ignore lobes (gate 5)

Poison that drives Q to 0 for E>0, deletes the residue row, treats out-of-lobe as invisibility, or zeros friendly `cᵢ` because DF labeled them “own” fails 9.1/9.2 contest locks.

**Gate:** S19.10, S19.13.

### 8. Donor share as telepathic lock (gate 3 counter + 9.2 gate 2)

Copying escort firm/FS onto a poisoned flagship “because otherwise they cannot see” fails detection-only share.

**Gate:** S19.6.

### 9. Remastered watts locked / override dead (gate 7)

Copying remastered EU/s into non-overridable constants, or a ledger that ignores `injectMagnitudes`, fails the blind bake-off rule even if gameplay “feels right.” Breaking S14–S18 because defaults changed fails the **soft** suite-green gate.

**Gate:** S19.11; soft: existing suites.

### 10. Book inside `systemStates` / keyed on `npc.id`

Same Phase 3/4/5/6/9/9.1/9.2/10 landmine. Load wipes the cache; ambient reuse transfers a poison, cue, or HoJ heading onto a newcomer.

**Gate:** S19.9, S19.15.

### 11. `performance.now()` poison / DF / stall clocks (process / plan §13)

Poison duration, DF dwell, Focused Scan stall, and search stall must use `localElapsedMs`.

**Gate:** S19.3, S19.4, S19.7; process lock.

### 12. Regress #33 / #35 / #37 or reopen boarding / Phase 10 (gate 6)

Contact-delete jam, ghost hulls, HoJ retune, claim-as-identity, `tractorIsBoarding` true, capture-as-`destroyNpcShip`, Dominion rumor-as-FS, pack-gate debug default, or S14–S18 red fails even if poison/DF are green.

**Gate:** S19.5, S19.10, S19.12, S19.13, S19.14.

### 13. dockClear polish sneaks in / screenshots skipped (gate 8)

Treating this brief as the dock-overlap UI lane fails the non-goal. Skipping no-clip for new 9.3 controls on the **later engine PR** fails the process lock. Retuning poison numbers to shrink the panel fails “not EW math.”

**Gate:** S19.16.

## Probe plan (S19)

Add `scripts/test-phase93-ew-poison-df.mjs` for offline poison-draw / live-layer-vs-report / DF-cue-no-FS / silence-coast / magnitude-override tests, and Chromium S19 cases on `__BM1_PROBE__.phase93`. **Replay S14–S18** via existing `phase9` / `phase91` / `phase92` / `boarding` / `phase10` injectors; do not break them.

**Minimum probe additions:**

```js
__BM1_PROBE__.phase93 = {
  snapshot: () => ({
    power: {
      consumers: /* POWER_CONSUMERS — still exactly the five */,
      ew: /* { name: 'ew', draw, effectsImplemented: true } */,
      offBudget: /* draw===0 && (poisonOn || dfOn) */
    },
    poison: {
      on: /* bool */,
      draw: /* extra ew */,
      focusedScanStatus: /* idle|dwelling|result|poisoned */,
      scanConfidence: /* live mark */,
      searchPending: /* bool */,
      residueHeld: true,
      rowPresent: true,
      firingSolution: false,
      npcCount: /* unchanged */,
      ghostFlagged: false
    },
    reports: {
      deliveredStill: true,
      erasedByJamming: false,
      knownIdsCleared: false,
      flashUnsending: false,
      deliveredConfidenceUnchanged: true
    },
    share: {
      escortToFlagship: /* { detected, trackQuality, firingSolution: false, residue } */,
      giftedFs: false
    },
    df: {
      on: /* bool */,
      draw: /* extra ew */,
      cue: /* { family, bearing, trueSideLabel, paidDraw } or null */,
      firingSolution: false,
      identityInvented: false,
      claim: /* off|true|{spoofedFaction} unchanged */,
      playerFaction: state.playerFaction,
      playerSide: state.playerSide,
      reman53: /* unlock unchanged */,
      perfectSilentTrack: false,
      engagementAuthorizedPresent: false
    },
    contest: {
      rfRadius: /* B * sqrt(Q) */,
      Q: /* E/(E+N) */,
      friendlyInLobeTookN: /* bool */
    },
    hoj: {
      coasting: /* after silence */,
      giftedFs: false,
      perfectSilentTrack: false
    },
    boarding: {
      tractorIsBoard: false,
      implemented: true
    },
    dominion: {
      rumorGiftedFs: false
    },
    magnitudesLockedFromRemastered: false,
    magnitudes: /* resolved ledger */,
    mayAutoEngage: /* sample unchanged */,
    log: state.log
  }),
  injectScanPoison: (opts) => { /* fail setup if poison helper missing */ },
  injectFocusedScan: (opts) => {},
  injectSearch: (opts) => {},
  injectDeliveredReport: (opts) => {},
  injectDfAssist: (opts) => {},
  injectPaidJammer: (opts) => {},
  injectSilence: (opts) => {},
  injectHojLaunch: (opts) => {},
  injectEscortShare: (opts) => {},
  injectMagnitudes: (opts) => {},
  snapshotDockFit: () => {},  /* engine PR; docs brief N/A */
  tick93: (localElapsedMs) => {},
  lastRefuseFire: () => {}
};
```

Run, in order: existing `test:phase1`, `test:phase3`–`test:phase9`, `test:phase91`, `test:phase92`, `test:boarding`, `test:phase10`, `test:catalog`, `test:doctrine`, side-lane tests, `probe` (S4–S18), then new S19. A path that wipes a report, gifts FS from a cue, writes `playerFaction` from DF, perfect-tracks silence, spawns a poison hull, bills poison at draw 0, or adds a sixth consumer is a blocker.

Suggested first Chromium set (fatal integrations):

1. **S19.1 / S19.2 / S19.13:** `ew` extra draw; five consumers; no hull; power replay.
2. **S19.3 / S19.4 / S19.5 / S19.6:** live Focused Scan/confidence/progress corrupt; residue held; reports survive; share ≠ FS.
3. **S19.7 / S19.8 / S19.9:** DF cue only; no identity from noise; HoJ silence→coast.
4. **S19.10 / S19.12 / S19.14:** contest + fire gates + boarding/Phase 10 preserve.
5. **S19.11 / S19.15 / S19.16:** override + no remastered lock; both sides; engine no-clip (N/A on this docs PR).

## Recommended implementation order (dependencies)

1. `resolvePhase93Defaults` + override hook (S19.11). **Zero** remastered lock. Soft: existing suites still green at §7 defaults.
2. Poison extra `ew` draw (S19.1). No live-layer rewrite yet. Off-budget On **fails**.
3. Live-layer corrupt with residue floor (S19.3–S19.4). Hard-fail if the living row disappears or `npcShips` grows. **Do not ship contact-delete poison.**
4. Report-survive asserts (S19.5) **before** deepening poison. Delivered `.confidence` unchanged.
5. Counters: ECCM resist + leave envelope + detection-only share (S19.6). Hard-fail if flagship FS becomes true from share.
6. DF extra `ew` draw + cue on paid in-lobe emission (S19.7–S19.8). Hard-fail if `playerFaction` changes or a polity is invented from unlabeled N.
7. HoJ cue + silence→coast (S19.9). Hard-fail if `perfectSilentTrack` is true.
8. Contest + preservation + both-sides (S19.10, S19.12–S19.15). Replay S14–S18.
9. Engine screenshots / no-clip for new controls (S19.16). **Not** dockClear polish.

Skip (3)’s “deeper poison” if residue still voids. Skip (7) if (6) gifts FS. Skip boarding, Dominion, catalog rewire, Reman, market restock, `git am`, dockClear polish, and weapon number retunes entirely.

## Out of scope for the writer of a later slice

`BM1-remastered-work` as source; `git am` remastered EW; remastered base `758665e`; claiming a Referee Pass; reopening Phase 9–9.2 gates / regressing #33 / #35 / #37; reopening boarding #38 / #39 or Phase 10 #40 / #41; rewriting `seedFromReport` to grant a lock; deleting `deliverReport` rows; unsending FLASH; rewriting delivered report confidence; retuning `game_items.json` numbers; a global shield-bypass helper; moving tractor off the device slot; auto-filling empty `weaponSlots`; stealing the suite slot; a sixth power consumer; fleet jammer net / telepathic FS share; a new directional decoy hull; dockClear polish; `unknown` access enforcement as a new religion; setting `hostile` / `attackId` / `destroyed` / `engagement_authorized` / `playerFaction` from poison or DF; a second contact book; persisting `performance.now()` 9.3 deadlines; Phase 8 restock; a second Reman id; strongest-three / % ceilings as locked constants; perfect-tracking silent hulls; treating dock-overlap as EW math.

## Sources

- Proposal: `docs/phase9/BM1-PHASE9.3-SCAN-POISON-DF-ASSIST-PROPOSAL.md`
- Phase 9.2 locked baseline: `docs/phase9/BM1-PHASE9.2-EW-DEPTH-PROPOSAL.md`; `docs/phase9/BM1-PHASE9.2-ENGINE-DEPENDENCIES.md`; `src/phase92-*.js`; PR #37 (`f9f077f`); S16
- Phase 9.1 locked baseline: `docs/phase9/BM1-PHASE9.1-EW-ROBUSTNESS-PROPOSAL.md`; `docs/phase9/BM1-PHASE9.1-ENGINE-DEPENDENCIES.md`; `src/phase91-*.js`; PR #35 (`d1837fe`); S15
- Phase 9 locked baseline: `docs/phase9/BM1-PHASE9-EW-WEAPONS-PROPOSAL.md`; `docs/phase9/BM1-PHASE9-ENGINE-DEPENDENCIES.md`; `src/phase9-ew.js`; `src/phase9-weapons-matrix.js`; PR #33 (`2b38a14`); S14
- Boarding locked: `docs/boarding/`; PR #38 / #39; S17
- Phase 10 locked: `docs/phase10/`; PR #40 / #41; S18
- Plan §4 / §11: `docs/revised-development-plan.md`
- Phase 6: `src/phase6-sensors.js` (`performActiveScan`, `resolveSearch`, `createScanEmission`, `shareFormationDetection`); `docs/phase6/`
- Phase 6.5: `src/phase65-power.js`; `docs/phase6/BM1-PHASE6.5-POWER-SENSORS-SUITES-PROPOSAL.md`
- Phase 7: `src/phase7-fleet.js`; `src/phase92-comms.js`
- Phase 4 reports / FLASH / allowlist: `src/phase4-incidents.js`; `docs/phase4/`
- Phase 5 board: `src/phase5-objectives.js`; `docs/phase5/`
- Phase 3 broadcast / access: `src/phase3-checkpoints.js` (`makeBroadcast`, `getVisitorAccessDecision`)
- Fire facts: `src/doctrine.js` (`deriveLiveFireFacts`); `src/main.js` (`consultDoctrineFire`, `playerFaction` / `playerSide`)
- Weapons data: `data/game_items.json` (do not retune)
- Probe: `src/main.js` `createPhase9ProbeApi` / `createPhase91ProbeApi` / `createPhase92ProbeApi`; `scripts/test-phase9-ew-weapons.mjs`; `scripts/test-phase91-ew-robustness.mjs`; `scripts/test-phase92-ew-depth.mjs`
- Remastered EW pack / DESIGN: background shapes only — not a patch, not a constant lock
- Phase 9.2 companion shape (this file’s template): `docs/phase9/BM1-PHASE9.2-ENGINE-DEPENDENCIES.md`
