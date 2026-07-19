# @citrusworx/nectarine

Compiler and adapter utilities for CitrusWorx data and query tooling.

## Install

```bash
npm install @citrusworx/nectarine
```

## Usage

```ts
import { loadNectarineConfig } from "@citrusworx/nectarine";

const config = loadNectarineConfig("./nectarine.config.yaml");

// Vendor env key names come from YAML; values come from process.env
const creds = config.resolveCredentials(); // null if PG_*/MS_*/MG_* incomplete
const product = config.getResource("product"); // schema + queries + api objects
const coursesApp = config.getAppBySubdomain("courses");
```

Subpath exports are also available:

- `@citrusworx/nectarine/config`
- `@citrusworx/nectarine/compiler`
- `@citrusworx/nectarine/adapters/mg`
- `@citrusworx/nectarine/adapters/ms`
- `@citrusworx/nectarine/adapters/pg`
- `@citrusworx/nectarine/util`

## Development

```bash
yarn workspace @citrusworx/nectarine build
yarn workspace @citrusworx/nectarine test
```
