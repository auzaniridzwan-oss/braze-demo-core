# Changelog

## 0.2.0 — 2026-11-18

- `braze/ops`: `planAttributeUpdate(before, after)` turns a profile edit into the smallest correct `/users/track` attribute objects: `_merge_objects` for nested edits, `add`/`remove` for arrays, `$add`/`$update`/`$remove` for arrays of objects with a stable id key, full replace otherwise (with the reason). Also `valueProblems`, `detectIdentifierKey`, `deepEqual`, and `applyAttributeObjects` (applies a plan locally, for mocks and tests).
- `braze/client`: `callBraze()` for browser calls through the proxy with a per-session key, `BrazeConnection`, `describeBrazeError`.
- React: `ConnectionForm` (instance, API key, workspace label, optional test button).

## 0.1.0 — 2026-11-18

Extracted from braze-userprofile-generator @ 23608f7.

- Field types, Braze key and size rules (`checkField`, `maxBytes`), field helpers.
- Seeded RNG.
- 13 locale packs, now with an ISO 4217 `currency`.
- `localizeIdentity()` and its pieces (`pickName`, `pickCity`, `renderEmail`, `mobileNumber`), pulled out of the generator's per-user code.
- Braze endpoints, `{"$time"}` helpers, `createBrazeProxy()`.
- React: UI kit and `JsonTree`.
