# braze-demo-core

Shared core for the Braze demo tools:

- **braze-userprofile-generator** (myCaboodleV3): bulk synthetic users
- **braze-profile-editor**: live single-profile editor

It holds everything about **what Braze accepts** and **what a localized identity looks like**, so both apps agree.

## What's inside

| Import | Module | What it gives you |
|---|---|---|
| `braze-demo-core` | `types` | `FieldSpec`, `DataType` (`string · number · boolean · date · array · object · object_array · json`), `AttrValue` |
| | `fields` | `keyProblem`, `jsonLiteralProblem`, `walkFields`, `byteSize`, `dataPoints`, `getPath` |
| | `rules` | `checkField`, `maxBytes`, Braze limits (100 KB objects, 500 array items, 255-char strings, depth 5) |
| | `rng` | `createRng(seed, stream)`: seeded, deterministic random streams |
| | `locales` | 13 locale packs: VN, SG, MY, ID, TH, PH, US, GB, AU, JP, KR, HK, TW (names, cities and time zones, mobile prefixes, country, language, currency) |
| | `identity` | `localizeIdentity()`, plus the pieces it uses: `pickName`, `pickCity`, `renderEmail`, `mobileNumber` |
| | `braze/endpoints` | Braze REST instances, `resolveEndpoint`, `isAllowedEndpoint` |
| | `braze/values` | `{"$time"}` helpers for dates inside objects |
| | `braze/ops` | `planAttributeUpdate(before, after, { identifier })`: smallest correct update for an edited profile (merge, array add/remove, `$add`/`$update`/`$remove`, or replace), plus `valueProblems` and `applyAttributeObjects` |
| | `braze/client` | `callBraze(connection, path, payload)`: browser call through the proxy with a per-session key |
| | `braze/proxy` | `createBrazeProxy({ allowedPaths })`: route handler that forwards to Braze with a per-request API key |
| `braze-demo-core/react` | `ui`, `JsonTree`, `ConnectionForm` | UI kit (Button, Input, Card, Modal, Tabs…), an expandable JSON tree, and the Braze connection form. React 19 is a peer dependency |

## Install

```bash
npm install github:auzaniridzwan-oss/braze-demo-core#v0.2.0
```

npm clones the tag and runs `prepare`, which builds `dist/`.

### Tailwind (React components)

The React components use Tailwind classes. Tell Tailwind 4 to scan the package, in your `globals.css`:

```css
@import "tailwindcss";
@source "../node_modules/braze-demo-core/dist";
```

### Next.js API proxy

```ts
// app/api/braze/route.ts
import { createBrazeProxy } from "braze-demo-core";

export const runtime = "nodejs";
export const POST = createBrazeProxy({ allowedPaths: ["/users/track", "/users/export/ids"] });
```

The browser sends `{ base, path, payload }` with the key in the `x-braze-api-key` header. The key is never stored. Set `ALLOW_MOCK_BRAZE=true` to allow `http://localhost` mock servers.

## Developing

```bash
npm install
npm test
npm run typecheck
npm run build
```

To try changes in an app before tagging, run `npm link` here and `npm link braze-demo-core` in the app, or point the app at `file:../braze-demo-core`.

## Releasing

1. Update `CHANGELOG.md` and the `version` in `package.json`.
2. Commit, then `git tag vX.Y.Z && git push --tags`.
3. Bump the tag in each app's `package.json`.

Any change to field rules, locale data or identity output is at least a minor version, because it changes what the apps generate.
