# BM1 bake-off status

Repo: https://github.com/Artemis2028/BM1-bakeoff  
Updated: 11 September 2026  
Head: `f684e0b` on `main`

Sibling of `BM1-remastered-work` for a **blind** Cloud Agent bake-off. Implement from `docs/` only. Do **not** crib the guided stack on `Artemis2028/BM1-remastered-work` PR #1 (answer key for scoring).

## Briefs

| Path | Role |
| --- | --- |
| `docs/revised-development-plan.md` | Goals / roadmap checkpoint |
| `docs/doctrine/` | Faction doctrine v0.2.1 pack + offline validator |
| This file | What landed here and how it was gated |

## Merged

| PR | Lane | Merge |
| --- | --- | --- |
| [#2](https://github.com/Artemis2028/BM1-bakeoff/pull/2) | Engine / combat (Phase 1 attribution, pursuit≠fire, political authority) | `4c399da` |
| [#1](https://github.com/Artemis2028/BM1-bakeoff/pull/1) | Doctrine runtime wiring (loader + authority/spawn/identity hooks) | `f684e0b` (rebased onto engine) |

## Post-merge gates (on `main` @ `f684e0b`)

```sh
npm run test:phase1    # 17/17
npm run test:doctrine  # validate-doctrine 59/59 + runtime adapter 79/79
```

No Playwright `behavior-probe` / Chromium suite on this repo yet.

## Roles

- **Number Four** — engine/combat (done for Phase 1 slice)
- **Number 2** — doctrine wiring (done for v0.2.1 loader slice)
- **Number Three** — probe / merge gate
- **Referee** — MD fidelity scoring (docs only; peek at guided PR only when scoring)

## Next (optional)

1. Referee fidelity score vs `docs/revised-development-plan.md` + `docs/doctrine/`.
2. Combined Chromium behavioral probe (parity with guided stack’s Playwright suite).
3. Later phases (ROE / holding zones / etc.) only when Tenth scopes them — still bake-off-only unless directed otherwise.
