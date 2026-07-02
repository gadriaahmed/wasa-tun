# Archived scripts

These scripts are from the original Intuit Wasabi project. They are **not used** by the
modernized fork workflow.

| Script | Former purpose |
|--------|----------------|
| `wasabi.sh` | Full bootstrap (Homebrew/apt), build, Docker via container.sh, RPM packaging |
| `container.sh` | Legacy Docker orchestration (Cassandra 2.1) |
| `fpm.sh` | RPM/DEB packaging via FPM |
| `jenkins.sh` | Intuit Jenkins CI/CD pipeline |

## Use instead

```bash
make dev          # build + docker compose up
./bin/dev.sh      # same
make build        # Maven assembly only
make stop         # docker compose down
```

See [`.github/CI.md`](../../.github/CI.md) and the **Quick start** section in the root README.
