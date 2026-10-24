# HonestBox app (iPhone and Android)

A native app built with Expo (SDK 57, React Native) and Expo Router. It talks to the HonestBox server through
`/api/v1` (see `../lib/api.ts`), and stores the sign-in token in the iOS Keychain or Android Keystore.

## Screens

- Welcome, sign in, sign up (age, state and referral code)
- **Boxes:** the five boxes with odds and house edge; box page with the wheel, the full odds table (highest value first) and a confirm step before opening
- **The reveal:** a roulette wheel with every watch in the box as a slice drawn to its real odds; tap Spin and the pointer stops exactly at your provably fair roll (haptics; respects Reduce Motion)
- **Your pull:** today's value and change since pulled, sell back (credit or cash), lock in today's value, keep floating, ship (with the $15 fee under $250), verify the pull
- **Drops:** this week's pieces, 10-minute hold, buy with shipping address
- **Vault:** every pull with its status, value movement and lock badge
- **Account:** credit, test credit (test mode only), two-level referral code with share and copy, credit history, sign out
- The Honest Ledger and provably fair settings

## Run it on your phone (development)

```bash
cd mobile
npm install
npx expo start          # scan the QR code with the Expo Go app
```

By default the app uses the live server at https://honestbox.onrender.com. To point it at a server on your
computer instead: `EXPO_PUBLIC_API_URL=http://<your-computer-ip>:3000 npx expo start`.

## Checks

```bash
npx tsc --noEmit                      # types
npx expo export --platform ios        # full iOS bundle
npx expo export --platform android    # full Android bundle
```

## Publish to the App Store and Google Play

Builds run in Expo's cloud (EAS), so no Mac or Xcode is needed. Accounts must be in HonestBox LLC's name:

1. **Apple Developer Program** (US$99 a year) and **Google Play Console** (US$25 once), both as an organization, which needs a D-U-N-S number.
2. An **Expo account**, then from this folder: `npx eas-cli@latest login`, then `npx eas-cli@latest init`.
3. `npx eas-cli@latest build --platform all --profile production`
4. Create the app in App Store Connect, put its app ID in `eas.json` (`ascAppId`), then `npx eas-cli@latest submit --platform all`.

**Before submitting:** Apple and Google treat paid mystery boxes with real-money prizes as gambling-adjacent. Expect
questions about licensing, geo-restriction, the free entry method and age checks. The gaming attorney's opinion
should come first, and the store listings must disclose the odds (the app already shows them on every box).
