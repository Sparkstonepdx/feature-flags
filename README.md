# @sparkstone/feature-flags

A tiny, framework‑agnostic TypeScript library for **feature flags**, with support for simple boolean “allow” flags and integer range checks (exact value, min, max). Bundled with [microbundle](https://github.com/developit/microbundle) to ship ESM, CJS, and UMD, plus type definitions.

## Install

```bash
npm i @sparkstone/feature-flags
# or
pnpm add @sparkstone/feature-flags
# or
yarn add @sparkstone/feature-flags
```

## Quick start

The package exports a small API under the `featureFlags` namespace, plus the `FeatureFlag` type for authoring flags.

```ts
import { featureFlags, FeatureFlag } from "@sparkstone/feature-flags";

// 1) Define your flags (could come from a file, API, or env)
const flags: FeatureFlag[] = [
  { name: "newDashboard", tier: "beta", type: "allow", value: true },
  { name: "maxUploads",  tier: "",      type: "int:max", value: 10 },
  { name: "minAge",      tier: "eu",    type: "int:min", value: 16 },
  { name: "build",       tier: "qa",    type: "int",     value: 1234 },
];

// 2) Load them into the in‑memory store
featureFlags.load(flags);

// 3) Check boolean "allow" flags
if (featureFlags.isAllowed("newDashboard", "beta")) {
  // show experimental UI
}

// 4) Check integer constraints / ranges
const uploadsToday = 7;
if (featureFlags.isInRange("maxUploads", "", uploadsToday)) {
  // within allowed cap
}

// 5) Read back a flag (typed) or iterate them all
const buildFlag = featureFlags.get("build", "qa"); // -> { type: "int", value: 1234, ... }
for (const [key, flag] of featureFlags.getAll()) {
  // key = "name.tier", value = FeatureFlag
}
```

> **Tiers**: Every flag has a `tier` string (can be empty). Internally the key is `\"\" + name + "." + tier`, so `name`+`tier` pairs must be unique. Use tiers to segment by environment (e.g., `dev`, `qa`, `prod`), cohort (`beta`, `control`), region (`eu`, `us`), plan (`free`, `pro`), etc.

## API

All functions live on the `featureFlags` namespace.

### `load(flags: FeatureFlag[]): void`
Bulk‑loads an array of flags into the internal map (replaces existing entries with the same `name` + `tier`).

### `clear(): void`
Empties the internal map.

### `get(flagName: string, tier = ""): FeatureFlag | undefined`
Returns a single flag by `name` + `tier` or `undefined` if not found. Logs a warning if missing.

### `getAll(): Map<string, FeatureFlag>`
Returns the underlying `Map`, where the key is `"{name}.{tier}"` and the value is the `FeatureFlag` object.

### `isAllowed(flagName: string, tier: string): boolean`
Looks up a flag and returns `true` iff it exists **and** has `type: "allow"` with a truthy `value`. If the flag exists but is not of `type: "allow"`, a warning is logged and the result is `false`.

### `isInRange(flagName: string, tier = "", value: number): boolean`
Looks up a flag and, when it is an integer‑type flag, compares the provided `value`:

- `{ type: "int", value: N }` → `value === N`
- `{ type: "int:max", value: N }` → `value <= N` (if `value` is `null`, treated as unbounded and returns `true`)
- `{ type: "int:min", value: N }` → `value >= N` (if `value` is `null`, treated as unbounded and returns `true`)

If the flag exists but is not an integer‑type, a warning is logged and the result is `false`.

## Types

```ts
type Tier = string; // free‑form segment (env, cohort, region, plan, etc.)

interface FeatureFlagBase {
  name: string;
  tier: Tier;       // may be ""
}

type FeatureFlag =
  | { type: "allow";   value: boolean }
  | { type: "int";     value: number }
  | { type: "int:min"; value: number } // lower bound (inclusive)
  | { type: "int:max"; value: number } // upper bound (inclusive);
```

> The library uses an internal `Map<string, FeatureFlag>` to store flags. The key format is `"{name}.{tier}"`.

## Browser / UMD usage

A UMD build is published under `dist/main.umd.js` for drop‑in usage without a bundler.

```html
<script src="https://unpkg.com/@sparkstone/feature-flags/dist/main.umd.js"></script>
<script>
  const { featureFlags } = window.SparkstoneFeatureFlags;
  featureFlags.load([{ name: "newDashboard", tier: "beta", type: "allow", value: true }]);
  console.log(featureFlags.isAllowed("newDashboard", "beta"));
</script>
```

## Node / ESM / CJS

The package exposes multiple entry points via `package.json` `exports` for modern bundlers and Node.

- **ESM**: default export path → `dist/main.modern.js`
- **CJS**: `require` path → `dist/main.cjs`
- **Types**: `dist/main.d.ts`

Microbundle also outputs `dist/main.module.js` and `dist/main.umd.js` for wider tooling compatibility.

## Building locally

```bash
pnpm i
pnpm run dev    # watch & rebuild on changes
pnpm run build  # create ESM, CJS, UMD + .d.ts in dist/
```

## Patterns & tips

- Keep `name` stable across tiers; use `tier` to target a segment.
- Co‑locate flag declarations near the boundary where they’re sourced (e.g., bootstrap file, config module, API payload).
- Prefer **boolean** flags for on/off behavior and **int** flags for thresholds/limits; you can always layer your own higher‑level helpers on top of `isAllowed` / `isInRange`.
- If you need dynamic/remote flags, load them at startup and re‑`load` on refresh (you may wrap the module with your own cache or reactive layer).

## License

ISC © Sparkstone LLC
