# BM1 Phase 9.2 proposal: engine dependencies

**Reviewed document:** `BM1-PHASE9.2-EW-DEPTH-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `d1837fe` on `main` (14 September 2026), after Phase 9.1 robust-EW engine (PR #35). Line numbers below refer to this head and may drift.  
**Method:** read the landed Phase 9 `ewBook` / four families / weapons matrix, Phase 9.1 contest / residue / claim / slot / HoJ helpers, Phase 6 contact book + `shareFormationDetection` + `performActiveScan`, Phase 6.5 reserved `ew` consumer + brown-out + suite slot, Phase 7 `fleetOrders` + `COMMS_FAILURES_IMPLEMENTED` stub, Phase 3 `makeBroadcast`, Phase 1 `playerFaction` / `playerSide`, Phase 4 `deliverReport` / allowlist, doctrine fire facts, and centered-panel / bottom-dock CSS. No engine changes made. This is a dependency/risk checklist for a later writer, not a post-implementation review and not permission to implement before Tenth scopes the lane. **Keep #33 and #35 Pass locked** — do not reopen Phase 9 or 9.1 gates or regress S14 / S15.

## Verdict in one paragraph

The 9.2 depth amend can be implemented without a rewrite, without a second contact book, without a sixth power consumer, and without touching delivered reports or Phase 9 ghosts-as-hulls. Prefer **thin new modules** (`src/phase92-*.js`) that subscribe to Phase 9.1 contest / 9 `ewBook` / 6.5 / 6 / 7 helpers. Lobes are a **mask on `cᵢ` before RSS** (heading vs bearing vs injectable half-angle), not a new contest religion — friendlies in-lobe still take N; burn-through / residue / true-side stay. Escort ECCM share **extends** `shareFormationDetection` with escort→flagship copies capped at detection / last-known / residue (never FS, never `engagement_authorized`, never a gifted suite). Spoof catch is a **Focused Scan / silhouette / ECCM** path on the 9.1 claim field — write `spoofExposed` on the observer row, never `playerFaction`. Comms-delay **flips** Phase 7’s `COMMS_FAILURES_IMPLEMENTED` stub for **new** order sends and keeps `tryDeliverReport` delay-new-only. Heat is a jammer spend/emission tradeoff on reserved `ew`; decoys are `ew_decoy` book rows (not hulls, not ghosts, not FS); silent-running is an actor control that is not cloak-void. Magnitudes are a **playtest ledger** merged into existing resolve helpers. Dock-overlap is **CSS / panel inset**, not contest numbers. The load-bearing risks are all integration mistakes: isotropic leftover that ignores friendlies; gifted FS from share; identity rewrite from catch; unsend reports / supersede `hold_outside`; decoy hulls; silent-as-cloak; off-budget heat; remastered watt lock; dock-clip left as residual; regressing #33/#35.

## What already exists (do not reinvent)

| Need | Engine fact at `d1837fe` |
| --- | --- |
| Four info layers + book | `src/phase6-sensors.js`: `detected`, `identification`, `trackQuality`, `firingSolution`. Caps: 32 contacts / 24 observers. `CONTACT_SOURCES` includes `'ew_ghost'` (and 9.1 residue mark). |
| Flagship → escort share (detection / last-known only) | `shareFormationDetection` (~1031): copies `detected` + `lastKnown`, caps track at `area`, **`firingSolution: false`**. Called from `main.js` ~5852 when escort in formation (formation dist under 110 or player dist under 300). **No escort → flagship path yet.** |
| Active scan | `performActiveScan` (~895): detectable emission, may raise ident/track, `firingSolution` only if firm and not cloaked. `scanSelectedShip` (`main.js` ~13676) bills Sensors via `performBudgetedActiveScan`. **No Focused Scan / silhouette compare.** |
| Report seed is area-only | `seedFromReport`: `detected: true`, `trackQuality: 'area'`, **`firingSolution: false`**. |
| Same-tick lock drop | `applyLostTrackSameTick`. Residue / share / catch must use this drop path **without deleting the row**. |
| Ghost rows (Phase 9, keep) | `src/phase9-ew.js`: `EW_SOURCE = 'ew_ghost'`; upsert hard-fails `firingSolution`. **Do not reuse `ew_ghost` for decoys.** |
| Reserved EW consumer **on** | `src/phase65-power.js`: `POWER_CONSUMERS` includes `'ew'`; `EW_EFFECTS_IMPLEMENTED = true`; `reservedEwDraw(activeDraw)`. Five consumers only. |
| Brown-out already kills EW | `applyBrownout`: order includes `ew`. 9.2 heat / silent-running / decoys **weaken via H**, not skip it. |
| 9.1 spend / slot | `src/phase91-ew-slot.js`: `ew_equipment` empty default, Compact/Tactical/Fleet injectable catalog, `MAGNITUDES_LOCKED_FROM_REMASTERED = false`. `src/phase91-power.js`: A × H, S=0 unavailable, spin-up/cooldown `localElapsedMs`, `PHASE91_DEFAULTS`. |
| 9.1 contest (isotropic) | `src/phase91-contest.js`: `rssNoise`, `contestQuality`, `burnThroughRadius`, `rangeFalloff`, `collectPaidEmitters`, `interferenceLabel` (true-side), `snapshotContest`. **No heading / half-angle / in-lobe mask.** `paidContribution` does not know friendlies-as-immune (good — keep that). |
| 9.1 residue | `src/phase91-residue.js`: `applyResidueMark` keeps `detected: true`, `firingSolution: false`, `ghost: false`. |
| 9.1 claim | `src/phase91-transponder.js`: `off` / `true` / `spoof`; `claimRewritesPhase1Identity() === false`; forgetting ladder `record_only`; `silentIsCloak() === false`. **No spoofExposed / Focused Scan.** |
| 9.1 HoJ | `src/phase91-hoj.js` + `HOJ_MATRIX_ROW` in `src/phase9-weapons-matrix.js` (unmounted/proposed, counters include `decoy-emitters`). Emission-only / incarnation-lock / silence→coast. |
| Phase 9 effect book | `state.ewBook`; families `sensor_jamming`, `deceptive_contacts`, `fire_control`, `comms_disruption`. `tryDeliverReport` delays **new** sends; `erasedByJamming: false`. |
| Phase 7 comms stub | `src/phase7-fleet.js`: `COMMS_FAILURES_IMPLEMENTED = false`; `commsFailureNote()` — ships continue last received orders + local self-preservation. `ORDER_KINDS` includes `hold_outside`. Board on `state.fleetOrders`. |
| Fire facts | `liveFireFactsFromEw` deletes `engagement_authorized`; `consultDoctrineFire` still deletes it. Share / catch / decoy must not pass that extra. |
| Probe surface | `__BM1_PROBE__.phase9` and `.phase91`. S16 should add **`phase92`** rather than scrape private state or fork S14/S15. |
| Offline tests | `scripts/test-phase9-ew-weapons.mjs`, `scripts/test-phase91-ew-robustness.mjs`, `scripts/test-phase7-fleet.mjs`. Keep green. Add `scripts/test-phase92-ew-depth.mjs`. |
| Dock / panel | `styles.css` `.top-left-panel` (~1039): centered, `z-index: 71`, `max-height: min(680px, calc(100vh - 132px))`, content padding `54px 14px 72px`. `.bottom-dock` (~4186): `bottom: 14px`, `z-index: 30`. 9.1 notes residual overlap. |

## Hooks the writer will have to touch

Prefer thin new files rather than growing `phase91-contest.js` / `phase9-ew.js` into a second religion:

| Proposed module | Responsibility |
| --- | --- |
| `src/phase92-lobes.js` | Heading / bearing / half-angle test; mask `cᵢ` → `cᵢ_lobe`; snapshot in-lobe vs out. Subscribe to `collectPaidEmitters` / `paidContribution`. |
| `src/phase92-escort-share.js` | Escort → flagship copy: detection / last-known / residue only. Cap track at area. Hard-fail FS / `engagement_authorized`. Range / formation envelope injectable. Call or wrap `shareFormationDetection`. |
| `src/phase92-spoof-catch.js` | Focused Scan dwell (`localElapsedMs`), silhouette compare, `spoofExposed` on observer row. Read claim via `phase91-transponder`. Never write Phase 1 stores. Feed forgetting ladder. |
| `src/phase92-comms.js` | EW latency for **new** fleet-order send. Flip `COMMS_FAILURES_IMPLEMENTED` **only** as the EW-caused path (or a sibling flag). Do not wipe standing `hold_outside`. Subscribe to `tryDeliverReport`. |
| `src/phase92-heat.js` | Jammer emission scale vs extra `ew` suppress spend. Draw still through `actorJammerDraw` / `reservedEwDraw`. |
| `src/phase92-decoys.js` | `ew_decoy` upsert; hard-fail FS / hull spawn / salvage. Distinct from `ew_ghost`. Legal HoJ emission lure. |
| `src/phase92-silent.js` | Silent-running control: `ew` draw > 0 when On; emission scale down; not cloak; residue stays. |
| `src/phase92-magnitudes.js` | Playtest ledger (§8) + `resolvePhase92Defaults(injected)`. Merge into 9/9.1 resolve helpers. `MAGNITUDES_LOCKED_FROM_REMASTERED` stays false. |
| `src/phase91-contest.js` | **Subscribe:** apply lobe mask inside contribution collection. Do not replace RSS / Q / B×√Q / labels. |
| `src/phase6-sensors.js` | Optional: escort→flagship helper next to `shareFormationDetection`; optional `CONTACT_SOURCES` + `'ew_decoy'` / `'escort_share'`. `createContactRecord` must **not** treat decoy as ghost or as living FS. |
| `src/phase7-fleet.js` | New-order delay / fail when EW comms disruption is live. Keep `commsFailureNote` honest. Standing orders persist. |
| `src/phase9-ew.js` | Subscribe: comms family still delay-new-only; decoy family contract if named; do not replace four families. |
| `src/main.js` | Thin: serialize 9.2 snapshot beside `ew91`; `__BM1_PROBE__.phase92`; controls (lobe readout, focused scan, heat, decoy, silent-running, share status). Focused Scan bills Sensors. |
| `styles.css` | Dock-clear: panel max-height / bottom padding / reserved inset so `.bottom-dock` does not cover last controls at 1280×720. |

Do **not** implement 9.2 inside `src/phase4-incidents.js` or `src/phase5-objectives.js` as a sneak rewrite. Do **not** implement decoys inside `createNpcShip`. Do **not** `git am` remastered patches. Do **not** retune `game_items.json`.

| Existing path | Required integration |
| --- | --- |
| `collectPaidEmitters` / `paidContribution` / `snapshotContest` | Each paid `cᵢ` multiplied by in-lobe mask before RSS. Out-of-lobe emitter adds 0 for **that** receiver. Friendly in-lobe still included. Funded ⇒ `rfRadius > 0`. |
| `shareFormationDetection` / escort tick in `main.js` ~5845 | Keep flagship→escort. Add escort→flagship with the same caps + residue. Envelope = formation check **or** injectable `shareRadius` (playtest 360). |
| `performActiveScan` / `scanSelectedShip` / `performBudgetedActiveScan` | Focused Scan = dwell / mode on this path. Write emission. Compare claim vs silhouette / true-side. Do not dump flavor cargo as identity. |
| `setTransponderClaim` / `applyForgettingLadder` | Catch sets exposed / suspicion; still `rewritten: false`; still no `engagement_authorized`. |
| `tryDeliverReport` / `deliverReport` | Unchanged contract for delivered rows. New sends may delay. |
| `issueOrder` / `normalizeOrder` / `findOrderForShip` | New send may delay. Existing `hold_outside` status/kind unchanged. |
| `actorJammerDraw` / `consumerDraws` / `applyBrownout` | Heat suppress **adds** `ew` draw. Silent-running On ⇒ draw > 0. Decoy On ⇒ draw > 0. Off-budget **fails**. |
| `upsertGhostContact` / `applyResidueMark` | Do not mark decoys `ghost: true`. Do not void on silent-running. |
| `consultDoctrineFire` / `liveFireFactsFromEw` / `playerForceMayAutoEngage` | Pass layer facts only. Keep the delete. Share / catch / decoy / delayed order must not flip `mayAutoEngage`. |
| `loadGame` / `saveGame` / `resetRunState` | Serialize lobe heading/α, share book, catch marks, heat/silent/decoy state beside `ew91`. Load still wipes `systemStates` first. Restore cloak → contact book → ew → 9.1 contest → 9.2 lobe/share **before** first sensor/AI pass. No `performance.now()` deadlines. Key on `securityInstanceId`. |
| `__BM1_PROBE__` | Add `phase92.snapshot` / injectors (see probe plan). **Fail setup if missing.** Keep `phase9` / `phase91` intact for S14 / S15 replay. |
| `.top-left-panel` / `.bottom-dock` | Durable dock-clear at 1280×720. Overflow JSON + screenshots in engine PR. |

Do **not** hook `loadShipCatalog` as a rewrite, independence mint, `meetPackPurchaseDecision`, Phase 8 stock reprint, boarding, or Reman identity from spoof/catch.

## Risks

### 1. Lobe as cloak / friendlies immune / off-budget (gate 1)

Omitting the in-lobe mask (shipping isotropic and calling it done) fails the room scope. Zeroing friendly `cᵢ` because `sideId` matches fails “friendlies in-lobe still take it.” Skipping `ew` because the beam is narrow fails spend-to-suppress. Driving Q to 0 for E>0 fails 9.1 gate 2.

**Gate:** S16.1, S16.2, S16.3, S16.18.

### 2. Gifted FS / `engagement_authorized` from escort share (gate 2)

Copying escort firm/FS onto the flagship, or treating shared residue as `liveWeaponTrack`, fails Phase 6 Q3 and 9.2 gate 2. Sharing out of envelope (other system / not escort) is a telepathic net.

**Gate:** S16.4, S16.5, S16.6, S16.17.

### 3. Share as a second suite (gate 2)

Adding escort S/E onto the flagship aperture, billing flagship `ew` for escort Boost, or installing a hidden suite from share fails “no second sensor religion / no off-budget.”

**Gate:** S16.5, S16.18.

### 4. Catch rewrites Phase 1 / auto-fire (gate 3)

`state.playerFaction = spoofedFaction`, flipping `playerSide`, minting Reman, or `mayAutoEngage` true because Focused Scan exposed a blip fails 9.1 gate 6 and 9.2 gate 3. Silent omniscient catch (no Sensors emission) fails Phase 6 gate 6.

**Gate:** S16.7, S16.8, S16.17.

### 5. Unsend reports / supersede `hold_outside` (gate 4)

Any comms tick that deletes `reports[id]`, flips `delivered`, clears `knownIncidentIds`, un-pulses FLASH, or rewrites standing `hold_outside` → `follow` fails Phase 9 gate 3 and Phase 7 persistence.

**Gate:** S16.9, S16.10, S16.19.

### 6. Decoy hull / ghost confusion / gifted FS (gate 5)

`createNpcShip` for a decoy, `ghost: true` on a lure, or `firingSolution` on `ew_decoy` fails ghosts-book-only and decoys≠hulls. Salvage/standing/Phase 5 `destroyed` on a decoy is the same family as S14.5.

**Gate:** S16.12, S16.17, S16.20.

### 7. Silent-running as cloak-void (gate 5)

Merging silent-running into `isPlayerCloaked` / NPC cloak clocks, or deleting the contact when silent-running On, fails 9.1 residue-before-void and silent ≠ cloak.

**Gate:** S16.13, S16.3.

### 8. Heat / decoy / silent at draw 0 (gate 5 + 9.1 gate 1)

Effects-on-at-draw-0, a sixth `POWER_CONSUMERS` entry, or suppress that does not bill extra `ew` fails spend-to-suppress.

**Gate:** S16.11, S16.13, S16.18.

### 9. Remastered watts locked / override dead (gate 6)

Copying remastered EU/s into non-overridable constants, or a ledger that ignores `injectMagnitudes`, fails the blind bake-off rule even if gameplay “feels right.” Breaking S14/S15 because defaults changed fails the **soft** suite-green gate.

**Gate:** S16.14; soft: existing suites.

### 10. Dock-overlap left as residual (gate 7)

Moving Close up again without a durable inset, or skipping screenshots, fails the UI-fit gate. Retuning lobe numbers to shrink the panel fails “not EW math.”

**Gate:** S16.15.

### 11. Book inside `systemStates` / keyed on `npc.id`

Same Phase 3/4/5/6/9/9.1 landmine. Load wipes the cache; ambient reuse transfers a lobe aim, share, decoy, or catch onto a newcomer.

**Gate:** S16.16, S16.20 (incarnation-lock family).

### 12. `performance.now()` dwell / delay clocks (process / plan §13)

Focused Scan dwell, order delay, heat, decoy duration, silent-running, and lobe snapshots must use `localElapsedMs`.

**Gate:** S16.7, S16.10, S16.11; process lock.

### 13. Regress #33 / #35 (gate 8)

Contact-delete jam, ghost hulls, HoJ retune, claim-as-identity, boarding hook, universal bypass, or S14/S15 red fails even if lobes are green.

**Gate:** S16.3, S16.17, S16.18, S16.19, S16.20.

## Probe plan (S16)

Add `scripts/test-phase92-ew-depth.mjs` for offline lobe mask / share caps / catch-no-identity / comms-delay / heat draw / decoy-not-hull / silent-not-cloak / magnitude-override tests, and Chromium S16 cases on `__BM1_PROBE__.phase92`. **Replay S14 and S15** via existing `phase9` / `phase91` injectors; do not break them.

**Minimum probe additions:**

```js
__BM1_PROBE__.phase92 = {
  snapshot: () => ({
    power: {
      consumers: /* POWER_CONSUMERS — still exactly the five */,
      ew: /* { name: 'ew', draw, effectsImplemented: true } */,
      offBudget: /* draw===0 && (jammerOn || heatOn || silentOn || decoyOn) */
    },
    lobe: {
      halfAngleDeg: /* injectable */,
      heading: /* emitter facing */,
      inLobe: /* bool for sample receiver */,
      cMasked: /* 0 if out */,
      friendlyInLobeTookN: /* bool */,
      rfRadius: /* B * sqrt(Q) */,
      Q: /* E/(E+N) */
    },
    share: {
      escortToFlagship: /* { detected, trackQuality, firingSolution: false, residue } */,
      flagshipToEscort: /* existing path still area-only */,
      giftedFs: false,
      flagshipSuiteUnchanged: true,
      inEnvelope: /* formation || shareRadius */
    },
    catch: {
      claim: /* off|true|{spoofedFaction} */,
      spoofExposed: /* bool */,
      playerFaction: state.playerFaction,
      playerSide: state.playerSide,
      reman53: /* unlock unchanged */,
      emissionWritten: /* focused scan */,
      engagementAuthorizedPresent: false
    },
    comms: {
      newDeliverDelayed: /* bool */,
      erasedByJamming: false,
      deliveredStill: true,
      holdOutsideKind: /* still hold_outside */,
      cultureFire: false
    },
    heat: { suppressOn: /* bool */, draw: /* > jam-only when suppress */, emissionScale: /* */ },
    decoy: { rows: listDecoyContacts(), npcCount: /* */, firingSolutionAny: false, ghostFlagged: false },
    silent: { on: /* bool */, draw: /* > 0 */, cloak: false, residueHeld: true },
    magnitudesLockedFromRemastered: false,
    magnitudes: /* resolved ledger */,
    dock: { clippedControls: [], overflowX: false, dockClear: true },
    mayAutoEngage: /* sample unchanged */,
    log: state.log
  }),
  injectLobe: (opts) => { /* fail setup if lobe helper missing */ },
  injectEscortShare: (opts) => {},
  injectFocusedScan: (opts) => {},
  injectSpoofClaim: (opts) => {},
  injectCommsDisruption: (opts) => {},
  injectNewFleetOrder: (opts) => {},
  injectHeatSuppress: (opts) => {},
  injectDecoy: (opts) => {},
  injectSilentRunning: (opts) => {},
  injectMagnitudes: (opts) => {},
  snapshotDockFit: () => {},
  tick92: (localElapsedMs) => {},
  lastRefuseFire: () => {}
};
```

Run, in order: existing `test:phase1`, `test:phase3`, `test:phase4`, `test:phase5`, `test:phase6`, `test:phase65`, `test:phase7`, `test:phase8`, `test:phase9`, `test:phase91`, `test:catalog`, `test:doctrine`, side-lane tests, `probe` (S4–S15), then new S16. A path that gifts FS from share, writes `playerFaction` from catch, unsends a report, spawns a decoy hull, cloaks via silent-running, bills heat at draw 0, or clips EW controls under the dock is a blocker.

Suggested first Chromium set (fatal integrations):

1. **S16.1 / S16.2 / S16.3 / S16.18:** lobe mask; friendly-in-lobe; burn-through/residue/RSS replay; power five-consumer.
2. **S16.4 / S16.5 / S16.6 / S16.17:** escort share caps; no suite theft; flagship→escort preserved; no `engagement_authorized`.
3. **S16.7 / S16.8:** catch ≠ identity; silent ≠ cloak; no auto-fire.
4. **S16.9 / S16.10 / S16.19:** delivered P4/P5 survive; new order delayed; `hold_outside` persists.
5. **S16.11 / S16.12 / S16.13 / S16.20:** heat extra draw; decoy ≠ hull; silent ≠ cloak-void; HoJ vs decoy emission.
6. **S16.14 / S16.15 / S16.16:** override + no remastered lock; dock no-clip; both sides.

## Recommended implementation order (dependencies)

1. `resolvePhase92Defaults` + override hook (S16.14). **Zero** remastered lock. Soft: existing suites still green at §8 defaults.
2. Lobe mask on `collectPaidEmitters` (S16.1–S16.3). Assert friendlies in-lobe take N **before** deepening jam. Funded ⇒ radius > 0.
3. Escort → flagship share (S16.4–S16.6). Hard-fail if flagship `firingSolution` becomes true from share. Keep flagship→escort.
4. Spoof catch-path on Focused Scan (S16.7–S16.8). Hard-fail if `playerFaction` changes.
5. Comms-delay new order + replay `tryDeliverReport` (S16.9–S16.10). Hard-fail if `hold_outside` kind changes or `delivered` flips.
6. Heat suppress extra `ew` (S16.11). Then decoys book-only (S16.12). Then silent-running (S16.13). **Do not** ship decoy hulls. **Do not** merge silent into cloak.
7. Dock-overlap polish + 1280×720 screenshots (S16.15).
8. Preservation + both-sides + HoJ decoy counter (S16.16–S16.20). Replay S14 / S15.

Skip (6)’s decoys if (2) still voids contacts. Skip boarding, catalog rewire, Reman, market restock, `git am`, and weapon number retunes entirely. Do not call the UI lane done if (7) is red.

## Out of scope for the writer of a later slice

`BM1-remastered-work` as source; `git am` remastered EW; remastered base `758665e`; claiming a Referee Pass; reopening Phase 9 six gates / 9.1 seven gates / regressing #33 / #35; rewriting `seedFromReport` to grant a lock; deleting `deliverReport` rows; unsending FLASH; retuning `game_items.json` numbers; a global shield-bypass helper; moving tractor off the device slot; auto-filling empty `weaponSlots`; stealing the suite slot; a sixth power consumer; boarding / capture / command transfer (**parked**); Phase 10 Dominion; full ECCM mesh beyond escorts; deeper spoof UI art; `unknown` access enforcement as a new religion; setting `hostile` / `attackId` / `destroyed` / `engagement_authorized` / `playerFaction` from a lobe, share, catch, heat, decoy, silent-running, or delayed order; a second contact book; persisting `performance.now()` 9.2 deadlines; Phase 8 restock; a second Reman id; strongest-three / % ceilings as locked constants; treating dock-overlap as EW math.

## Sources

- Proposal: `docs/phase9/BM1-PHASE9.2-EW-DEPTH-PROPOSAL.md`
- Phase 9.1 locked baseline: `docs/phase9/BM1-PHASE9.1-EW-ROBUSTNESS-PROPOSAL.md`; `docs/phase9/BM1-PHASE9.1-ENGINE-DEPENDENCIES.md`; `src/phase91-*.js`; PR #35 (`d1837fe`); S15; `docs/phase9/screenshots/phase91/NOTES.md`
- Phase 9 locked baseline: `docs/phase9/BM1-PHASE9-EW-WEAPONS-PROPOSAL.md`; `docs/phase9/BM1-PHASE9-ENGINE-DEPENDENCIES.md`; `src/phase9-ew.js`; `src/phase9-weapons-matrix.js`; PR #33 (`2b38a14`); S14
- Plan §4 / §9 / §11: `docs/revised-development-plan.md`
- Phase 6: `src/phase6-sensors.js` (`shareFormationDetection`, `performActiveScan`); `docs/phase6/BM1-PHASE6-SENSORS-CLOAK-SYSTEM-SPACE-PROPOSAL.md`
- Phase 6.5: `src/phase65-power.js`; `docs/phase6/BM1-PHASE6.5-POWER-SENSORS-SUITES-PROPOSAL.md`
- Phase 7: `src/phase7-fleet.js` (`COMMS_FAILURES_IMPLEMENTED`, `commsFailureNote`, `hold_outside`)
- Phase 4 reports / FLASH / allowlist: `src/phase4-incidents.js`; `docs/phase4/`
- Phase 5 board: `src/phase5-objectives.js`; `docs/phase5/`
- Phase 3 broadcast / access: `src/phase3-checkpoints.js` (`makeBroadcast`, `getVisitorAccessDecision`)
- Fire facts: `src/doctrine.js` (`deriveLiveFireFacts`); `src/main.js` (`consultDoctrineFire`, `playerFaction` / `playerSide`)
- UI: `styles.css` `.top-left-panel` / `.bottom-dock`
- Weapons data: `data/game_items.json` (do not retune)
- Probe: `src/main.js` `createPhase9ProbeApi` / `createPhase91ProbeApi`; `scripts/test-phase9-ew-weapons.mjs`; `scripts/test-phase91-ew-robustness.mjs`
- Remastered EW pack / DESIGN: background shapes only — not a patch, not a constant lock
- Phase 9.1 companion shape (this file’s template): `docs/phase9/BM1-PHASE9.1-ENGINE-DEPENDENCIES.md`
