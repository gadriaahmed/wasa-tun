# Frozen legacy UI (AngularJS 1.3)

The legacy admin UI is **frozen**. Normal builds copy the pre-built `dist/` tree into the
Wasabi artifact — they do **not** run Grunt, Bower, or Compass.

## One-time rebuild (only if you change `app/` sources)

Requires Node **16** (see `.nvmrc`). Grunt 0.4 fails on Node 17+.

```bash
cd modules/ui && nvm use && cd ../..
./bin/build-legacy-ui.sh
# or: make build-legacy-ui
```

Commit `modules/ui/dist/` after a successful build so CI and other developers do not need
the legacy toolchain.

## Do not

- Add `npm install` / `grunt build` back into `bin/build.sh`
- Upgrade AngularJS in place without a deliberate migration plan

New UI work belongs in [`modules/ui-react/`](../ui-react/).
