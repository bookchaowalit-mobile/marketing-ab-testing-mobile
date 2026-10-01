# Ab Testing — Mobile

React Native mobile app (Expo) for **Ab Testing**.

Part of [Chaowalit Greepoke](https://bookchaowalit.com)'s 101 Portfolio Projects.

## Tech Stack

- **Framework:** Expo SDK 53 + Expo Router
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based)
- **UI:** React Native + Ionicons

## Features

- **Significance calculator** (home tab): enter visitors and conversions for
  variant A (control) and B, get conversion rates, relative lift, z-score,
  two-sided p-value and a verdict at 95% confidence (pooled two-proportion
  z-test). Input is validated (whole numbers, conversions ≤ visitors).
- Everything runs on-device; no backend or network calls.

## Getting Started

```bash
npm ci
npx expo start
```

## Validation

```bash
npm run validate   # expo lint + tsc --noEmit + vitest
npx expo export --platform android --output-dir dist   # bundle smoke check
```

Pure logic lives in `lib/` and is unit-tested with Vitest (`lib/*.test.ts`).
CI (`.github/workflows/build.yml`) runs all of the above and fails on errors;
the EAS preview build is owner-triggered (`workflow_dispatch`) and needs the
`EXPO_TOKEN` secret plus the committed `eas.json`.

## Build

```bash
# Android
npx eas build --platform android --profile preview

# iOS
npx eas build --platform ios --profile preview
```

## Related

- **Frontend:** [bookchaowalit-website/ab-testing-frontend](https://github.com/bookchaowalit-website/ab-testing-frontend)
- **Portfolio:** [bookchaowalit.com](https://bookchaowalit.com)

## License

MIT
