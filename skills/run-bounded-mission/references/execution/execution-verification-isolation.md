# Local Verification Isolation

Disposable recovery and verification state is never candidate custody. Main and every execution/review
lane create it under one exact owned `mktemp -d` root and install cleanup for `EXIT`, `HUP`, `INT`, and
`TERM` before materializing any disposable bytes or launching children. Before each local Rust/Cargo
build-capable invocation, including first runs, reruns, and recovery, bind an explicit absolute
`CARGO_TARGET_DIR` inside that root and set `CARGO_INCREMENTAL=0` in the launched process. Missing,
empty, relative, inherited-but-unverified, shared/worktree-local, or escaping targets freeze launch;
never let Cargo choose its default `target`. Check the effective command, wrapper, Cargo configuration,
and resolved path: overrides (including `--target-dir`) and symlinks cannot redirect writes outside the
bound root. A stricter current repository check authority still applies; an incompatible required target
freezes the invocation rather than silently weakening either gate. Before a long compile, measure disk
availability and pass the repository disk-budget gate when one exists; failed or unavailable measurement
freezes compile. On success, failure, or interruption, wait for or terminate owned children before removing
only the owned disposable root, verify its absence, and measure disk again. Failed cleanup retains exact
path/process custody and blocks completion; a retry must pass the same launch gate.
