# Ships-only patch — quick installation

This ZIP contains `BM1-BM2-SHIPS-ONLY.patch`, a binary Git patch adding a complete
`bm-ships/` content folder. It does not require Claude's patch or any particular
BM1 commit, and it does not wire itself into an unrelated game's engine.

At the separate project's root:

```sh
git apply --check /path/to/BM1-BM2-SHIPS-ONLY.patch
git apply /path/to/BM1-BM2-SHIPS-ONLY.patch
node bm-ships/validate.mjs
```

Read `bm-ships/README.md` before connecting the loader to gameplay. The pack
contains 212 records: 205 active baselines, two retired compatibility records
and five retained prototypes awaiting stats/price/size decisions. It includes
204 unique images and all 152 BM2 source mappings. Existing engine files,
worlds, stations, weapons, saves and security logic are untouched.

The five prototypes are the real Excalibur, Andorian Cargo Shuttle, unassigned
utility shuttle, Basic Shuttle and second-step Klingon Bird of Prey. Their art
is included; fabricated balance numbers are not. All descriptions that existed
in the source manifest are retained with provenance, except the corrected
independent-capital description taken from the reviewed source register.

The patch was tested on a clean repository. An existing `bm-ships/` directory
may conflict: review that conflict, do not force an overwrite.

For an unrelated engine, use namespaced `bm-ship:<id>` keys or explicit ID
remapping. No automatic save conversion is performed. In particular the old
incorrect Excalibur=60 saves need source-version-aware migration.
