# BM1 Phase 9.4 proposal: engine dependencies

**Reviewed document:** `BM1-PHASE9.4-MAGNITUDES-PLAYTEST-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `b67f454` on `main` (16 September 2026), after Phase 9.3 scan-poison + DF assist engine (PR #43). Line numbers below refer to this head and may drift.  
**Method:** read the landed Phase 9 family magnitudes, Phase 9.1 catalog / `PHASE91_DEFAULTS`, Phase 9.2 / 9.3 magnitude helpers and probe `injectMagnitudes` paths, plus boarding / Phase 10 remastered-lock flags. No engine changes made. This is a dependency/risk checklist for a later writer, not a post-implementation review and not permission to implement before Tenth scopes the lane. **Keep #33, #35, #37, #42, and #43 locked.** **Do not reopen boarding #38 / #39 or Phase 10 #40 / #41.** Do not reopen P9–9.3 behavioral gates.

## Verdict in one paragraph

The 9.4 magnitudes-playtest amend can be implemented without a rewrite, without a new EW family, and without touching fire gates, delivered reports, boarding prize identity, or Dominion knowledge layers. Prefer **one thin new module** (`src/phase94-magnitudes.js`) that **merges** existing `resolveEwMagnitudes` / `resolvePhase91Defaults` / `resolvePhase92Defaults` / `resolvePhase93Defaults` into a **central playtest ledger**. Starting defaults stay the §3 TBD/soft numbers already on `main`. `MAGNITUDES_LOCKED_FROM_REMASTERED` stays **false**. The load-bearing work is making **one inject path live**: today `phase93.injectMagnitudes` only runs `resolvePhase93Defaults` (poison/DF keys), while lobes / catalog / heat live on other books — a snapshot pretty-print that the jammer ignores would fail gate 3. Screenshot / no-clip is **only** if a later engine ships an optional ledger readout; dockClear polish is **out**.

## What already exists (do not reinvent)

| Need | Engine fact at `b67f454` |
| --- | --- |
| Family draws | `src/phase9-ew.js` `EW_MAGNITUDES` + `resolveEwMagnitudes(injected)` (jam 1.6 / ghost 1.4 / FC 1.8 / comms 1.5). |
| Catalog tiers | `src/phase91-ew-slot.js` `EW_EQUIPMENT_CATALOG` + **another** `resolveEwMagnitudes(injected)` (compact 1.2/2/400, tactical 2/3.5/700, fleet 3.2/5/1100, `price: null`). `MAGNITUDES_LOCKED_FROM_REMASTERED === false`. |
| 9.1 clocks | `src/phase91-power.js` `PHASE91_DEFAULTS` + `resolvePhase91Defaults` (spin-up 1000, cooldown 2000, self-cancel 0.25, ECCM 1.4, B 200, clearRatio 0.05). |
| 9.2 ledger | `src/phase92-magnitudes.js` `PHASE92_DEFAULTS` + `resolvePhase92Defaults` + `snapshotPhase92Magnitudes`. Lobe 50°, share 360, heat 0.6×, decoy 1.3/8000, silent 0.5. Probe: `__BM1_PROBE__.phase92.injectMagnitudes` writes `ew92.defaults`. |
| 9.3 ledger | `src/phase93-magnitudes.js` `PHASE93_DEFAULTS` + `resolvePhase93Defaults` (poison/DF only) + `snapshotPhase93Magnitudes` (also **copies** compact/families/phase91/phase92 onto the object). Probe: `__BM1_PROBE__.phase93.injectMagnitudes` writes `ew93.defaults` via **poison/DF resolve only**. |
| Live consumers | Lobes (`phase92-lobes.js`), heat (`phase92-heat.js`), share (`phase92-escort-share.js`), poison (`phase93-poison.js`), DF (`phase93-df.js`) each call **their** resolve helper. Catalog draw uses `resolveEwEquipment`. |
| Lock flags | Same `=== false` in `phase91-ew-slot.js`, `phase92-magnitudes.js`, `phase93-magnitudes.js`, `boarding-eligibility.js`, `phase10-magnitudes.js`. |
| Soft suites | `scripts/test-phase9-ew-weapons.mjs` / `test-phase91-ew-robustness.mjs` / `test-phase92-ew-depth.mjs` / `test-phase93-ew-poison-df.mjs` already assert override + lock false (S16.14 / S19.11). Keep green. |
| Probe surface | `__BM1_PROBE__.phase9` / `.phase91` / `.phase92` / `.phase93` / `.boarding` / `.phase10`. S20 should add **`phase94`** rather than fork S14–S19. |

**Gap this brief closes:** there is no **central** inject whose snapshot keys for draws / radii / strength / heat / poison+DF / lobe α / share range are the **same values** the live helpers read.

## Hooks the writer will have to touch

Prefer a thin new file rather than growing `phase93-magnitudes.js` into a second religion:

| Proposed module | Responsibility |
| --- | --- |
| `src/phase94-magnitudes.js` | Central §3 ledger. `resolvePhase94Defaults(injected)` merges 9 / 9.1 / 9.2 / 9.3. `snapshotPhase94Magnitudes`. `MAGNITUDES_LOCKED_FROM_REMASTERED` stays false. |
| Existing `resolvePhase9*` helpers | **Subscribe:** accept the merged injected object (or a slice). Do not replace contest / poison / DF **behavior**. |
| `src/main.js` | Thin: `__BM1_PROBE__.phase94` with `snapshot` + `injectMagnitudes`. Keep `phase92` / `phase93` injectors as aliases so S16.14 / S19.11 stay green. Optional OPS readout of a few ledger keys — **not** dockClear polish. |
| Offline test | Add `scripts/test-phase94-ew-magnitudes.mjs` (override + lock false + live-path). Do **not** rewrite S14–S19 files except to keep aliases. |

Do **not** implement 9.4 inside `src/phase4-incidents.js`, `src/boarding-*.js`, `src/phase10-*.js`, or `createNpcShip`. Do **not** `git am` remastered patches. Do **not** retune `game_items.json`. Do **not** add EW families.

| Existing path | Required integration |
| --- | --- |
| `resolveEwMagnitudes` (both modules) | Injected compact/tactical/fleet **and** family rows flow from the central ledger. |
| `resolvePhase91Defaults` / `92` / `93` | Called with the merged inject (or equivalent slices). Poison/DF/lobe/heat still the same **shapes**. |
| `collectPaidEmitters` / `phase92ReservedDraw` / poison extra `ew` / DF extra `ew` | Live draw/radius/α/cost **read** resolved ledger values after inject. |
| `__BM1_PROBE__.phase94.injectMagnitudes` | Fail setup if helper missing. After inject, `snapshot().magnitudes` **and** a live helper read match. |
| `MAGNITUDES_LOCKED_FROM_REMASTERED` | Stays false everywhere it already exists. Fail if flipped true. |
| `loadGame` / `saveGame` | Serialize the merged magnitudes beside `ew93` if persisted. No `performance.now()` deadlines. |

## Risks

### 1. Pretty snapshot, dead inject (gate 3)

`snapshotPhase93Magnitudes` already **copies** compact/phase92 onto an object while `resolvePhase93Defaults` ignores those keys, and live lobes still read `ew92.defaults`. Shipping another copy-object without wiring live helpers fails “override must change the snapshot” as a **playtest path**.

**Gate:** S20.2, S20.3.

### 2. Remastered watts locked / `git am` (gates 1–2)

Copying remastered EU/s into non-overridable constants, flipping the lock flag, or applying a remastered patch fails the blind bake-off rule even if suites stay green.

**Gate:** S20.1.

### 3. Number change becomes a new rule (gate 4)

Using a ledger PR to gift FS, wipe reports, spawn hulls, add a sixth consumer, rewrite claim/Phase 1, or perfect-track silence fails preservation. Soft numbers ≠ new fire/identity rules.

**Gate:** S20.4, S20.5.

### 4. Split injectors break S16.14 / S19.11 (gate 4 + soft 6)

Deleting `phase92.injectMagnitudes` / `phase93.injectMagnitudes` without aliases makes locked suites red. Breaking defaults at §3 numbers fails the **soft** suite-green gate.

**Gate:** S20.5, S20.6.

### 5. Boarding / Phase 10 sneak (gate 5)

Touching `tractorIsBoarding`, capture XOR, Dominion pack gates, or rumor-as-FS fails even if the ledger is green.

**Gate:** S20.5.

### 6. dockClear polish / skipped no-clip on a new readout (soft gate 6)

Treating this brief as the dock-overlap UI lane fails the non-goal. If a later engine **does** ship a ledger readout, skipping no-clip fails the process lock. Retuning watts to shrink the panel fails “not EW math.”

**Gate:** S20.6.

## Probe plan (S20)

Add `scripts/test-phase94-ew-magnitudes.mjs` for offline merge / override / lock-false tests, and Chromium S20 on `__BM1_PROBE__.phase94`. **Replay S14–S19** via existing injectors; do not break them.

**Minimum probe additions:**

```js
__BM1_PROBE__.phase94 = {
  snapshot: () => ({
    magnitudesLockedFromRemastered: false,
    magnitudes: /* full §3 ledger as resolved */,
    live: {
      lobeHalfAngleDeg: /* from lobe helper, not a disconnected copy */,
      compactDraw: /* from equipment resolve */,
      heatSuppressExtraEwFactor: /* from heat helper */,
      scanPoisonEwDraw: /* from poison helper */,
      dfRange: /* from DF helper */,
      shareRadius: /* from share helper */
    },
    power: { consumers: /* still exactly the five */ },
    boarding: { tractorIsBoard: false, implemented: true },
    dominion: { rumorGiftedFs: false },
    fire: { engagementAuthorizedPresent: false }
  }),
  injectMagnitudes: (opts) => { /* fail setup if resolvePhase94Defaults missing */ },
};
```

Suggested first Chromium set:

1. **S20.1 / S20.2 / S20.3:** lock false; inject changes snapshot **and** live helper.
2. **S20.4 / S20.5:** preservation replay; no boarding / Dominion hook.
3. **S20.6:** suite-green at defaults (soft); readout no-clip **N/A** on this docs PR.

## Recommended implementation order (dependencies)

1. `resolvePhase94Defaults` + snapshot (S20.1). **Zero** remastered lock. Soft: existing suites still green at §3 defaults.
2. `injectMagnitudes` changes snapshot keys (S20.2).
3. Live helpers read the merged ledger (S20.3). Hard-fail if lobes still ignore a lobe inject that the snapshot shows.
4. Preservation + aliases for `phase92` / `phase93` inject (S20.4–S20.5).
5. Optional UI readout + no-clip (S20.6) **only if** scoped. **Not** dockClear polish.

Skip new families, `git am`, `game_items.json` retune, boarding, Dominion, and “final” watt certification entirely.

## Out of scope for the writer of a later slice

New EW families; dockClear polish; weapon / `game_items.json` combat retune; “final” balance certification; `BM1-remastered-work` as source; `git am` remastered EW; remastered base `758665e`; claiming a Referee Pass; reopening P9–9.3 gates / regressing #33 / #35 / #37 / #42 / #43; reopening boarding #38 / #39 or Phase 10 #40 / #41; a sixth power consumer; gifted FS / `engagement_authorized` from a watt; wiping delivered reports; ghost/decoy hulls; flipping `tractorIsBoarding`; treating dock-overlap as EW math.

## Sources

- Proposal: `docs/phase9/BM1-PHASE9.4-MAGNITUDES-PLAYTEST-PROPOSAL.md`
- Phase 9.3 locked: `docs/phase9/BM1-PHASE9.3-SCAN-POISON-DF-ASSIST-PROPOSAL.md`; `src/phase93-magnitudes.js`; PR #42 / #43; S19
- Phase 9.2 locked: `src/phase92-magnitudes.js`; PR #37; S16
- Phase 9.1 locked: `src/phase91-power.js`; `src/phase91-ew-slot.js`; PR #35; S15
- Phase 9 locked: `src/phase9-ew.js`; PR #33; S14
- Boarding locked: `docs/boarding/`; PR #38 / #39; S17
- Phase 10 locked: `docs/phase10/`; PR #40 / #41; S18
- Probe: `src/main.js` `createPhase92ProbeApi` / `createPhase93ProbeApi` (`injectMagnitudes`)
- Remastered EW pack / DESIGN: background shapes only — not a patch, not a constant lock
- Companion shape: `docs/phase9/BM1-PHASE9.3-ENGINE-DEPENDENCIES.md`
