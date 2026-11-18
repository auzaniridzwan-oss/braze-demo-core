# Changelog

## 0.1.0 — 2026-11-18

Extracted from braze-userprofile-generator @ 23608f7.

- Field types, Braze key and size rules (`checkField`, `maxBytes`), field helpers.
- Seeded RNG.
- 13 locale packs, now with an ISO 4217 `currency`.
- `localizeIdentity()` and its pieces (`pickName`, `pickCity`, `renderEmail`, `mobileNumber`), pulled out of the generator's per-user code.
- Braze endpoints, `{"$time"}` helpers, `createBrazeProxy()`.
- React: UI kit and `JsonTree`.
