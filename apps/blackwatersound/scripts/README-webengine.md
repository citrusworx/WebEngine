# WebEngine load-only bridge

Blackwater Sound ships a `kiwi.config.toml` + `webengine.config.json5` at the app root so `@citrusworx/webengine` can load and health-check the project **without** replacing the Docker stack.

```powershell
# from monorepo root (after yarn workspace @citrusworx/webengine build)
node --input-type=module -e "import { runKernelLifecycle } from '@citrusworx/webengine'; const r = await runKernelLifecycle('apps/blackwatersound'); console.log(r.healthSummary);"
```

Or run `scripts/webengine-smoke.ts` once the package is linked for Node resolution.
