# Upstream Sync Notes

This fork keeps local Web UI changes in a small, explicit boundary so upstream
Repomix updates are easier to merge.

## Local-Only Boundary

The local Web UI implementation lives under:

- `website/client/local-webui/`

This directory owns the local deployment Try It experience, including:

- API client helpers for local deployments
- local path browsing and validation helpers
- Try It state persistence
- local Web UI composables
- local Web UI types
- local Web UI Home/Try It components

Prefer adding local Web UI code here instead of spreading it across upstream
paths such as `website/client/components`, `website/client/composables`,
`website/client/utils`, or `website/client/types`.

## Upstream Touch Points

The intended upstream-facing touch points are:

- `website/client/components/Home.vue`
  - Imports upstream `Hero`.
  - Imports local `TryIt` from `website/client/local-webui/components/Home/TryIt.vue`.
- `website/client/tsconfig.json`
  - Includes `local-webui/**/*.ts` and `local-webui/**/*.vue`.
- `tests/website/**`
  - Local Web UI tests import from `website/client/local-webui`.

Keep this list short. If a future change needs another upstream touch point,
add it here with the reason.

## Sync Workflow

When pulling changes from upstream `yamadashy/repomix`:

1. Merge or rebase upstream changes first.
2. Resolve conflicts in upstream files before touching `website/client/local-webui`.
3. Check the touch points above.
4. If upstream changed `website/client/components/Home.vue`, preserve the local
   `TryIt` import unless upstream intentionally replaces the Home layout.
5. Run:

```bash
npm --prefix website/client run lint-tsc
npm test -- tests/website/localPathInput.test.ts tests/website/localPathBrowserNavigation.test.ts tests/website/cliCommand.test.ts tests/website/client/apiBaseUrl.test.ts tests/website/client/localPathBrowser.test.ts tests/website/client/validation.test.ts tests/website/client/tryItPersistence.test.ts tests/website/client/usePackRequest.test.ts
npm --prefix website/client run docs:build
```

## Rule Of Thumb

If a change is specific to local Docker/local path/local deployment behavior,
put it in `website/client/local-webui`. If a change is generally useful to
Repomix upstream, keep it small and consider contributing it upstream instead.
