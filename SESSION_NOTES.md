# Session Notes — Home Library App

## What this is
Expo + React Native app for cataloguing a home book library. Auth, book
CRUD, OpenLibrary search/ISBN lookup, and barcode scanning, backed by
Supabase.

## Repo
https://github.com/gurusanthanam82/homelibrary

## Stack
- Expo SDK **54** (downgraded from 57 — see "Expo Go compatibility" below)
- React Native 0.81.5, React 19.1+
- React Navigation (native-stack + bottom-tabs)
- Supabase (auth + Postgres `books` table)
- OpenLibrary API for search and ISBN lookup (no key needed)
- `expo-camera`'s built-in barcode scanning (not `expo-barcode-scanner`,
  which is unused/removed — deprecated package)

## Supabase project
- Project ref: `hbruuwsacsajsnbubfuq`
- URL: `https://hbruuwsacsajsnbubfuq.supabase.co`
- Anon/public key: safe to embed client-side, see `.env.example`
- `books` table + RLS policy already created via SQL editor (see chat
  history for the exact CREATE TABLE / policy statements if it needs
  to be recreated)
- `.env` (gitignored) needs `EXPO_PUBLIC_SUPABASE_URL` and
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` set to the above before running

## Expo Go compatibility
The project was originally scaffolded on Expo SDK 57, but the Expo Go
app on the App Store only supported SDK 54 at the time, causing
"Project is incompatible with this version of Expo Go" on device.
Fixed by pinning `expo@54.0.36` and aligning all `expo-*`,
`react-native-*`, `react`, and `react-native` versions to what
`node_modules/expo/bundledNativeModules.json` specifies for that SDK
(see commit `c253f3e`). If bumping the Expo SDK version again in the
future, always check the target device's actual Expo Go "Supported
SDK" version first (visible in the Expo Go app's Settings tab) and
match it rather than assuming latest is fine.

## Getting it running locally
```
git clone https://github.com/gurusanthanam82/homelibrary.git
cd homelibrary
npm install
# create .env with the Supabase values above
npx expo start        # or: npx expo start --tunnel
```
Scan the QR with the iPhone Camera app → "Open in Expo Go".

## Known blocker as of last session (unresolved)
Running the dev server from the user's Windows PC (a company-issued
laptop, email domain `agilcommerc...`) and scanning with an iPhone on
the same network:

- **LAN mode** (`npx expo start`, no flags): iPhone gets
  `Unknown error: The request timed out` against the PC's real Wi-Fi
  IP, every time.
- Ruled out: wrong network adapter/IP (confirmed PC's real Wi-Fi IP
  matches what Expo advertised, same subnet as phone), Windows
  Firewall (fully disabled for Private profile as a test — no change),
  network profile type (confirmed Private), third-party antivirus
  (none installed).
- Also tried: connecting the PC to the **iPhone's own Personal
  Hotspot** instead of the home router, to rule out router-level
  AP/Client isolation. Still timed out identically even though the
  phone itself was the network host — this rules out the home router
  as the cause too.
- **Working hypothesis:** something beyond user-controllable Windows
  Firewall is blocking inbound connections on this PC — likely
  corporate IT-managed endpoint security/EDR software, since it's a
  work laptop. LAN mode may simply not be viable here without IT
  involvement.
- **Tunnel mode** (`npx expo start --tunnel`, uses ngrok, only needs
  *outbound* access): got further — once actually got a QR code that
  loaded (that's when the SDK 54 mismatch was discovered/fixed). One
  retry attempt failed with `CommandError: failed to start tunnel /
  remote gone away` (looked like a transient ngrok-side issue, not a
  local block). **Next step when resuming: retry `npx expo start
  --tunnel` again** — this is the most promising path since it avoids
  the inbound-blocking problem entirely. If it keeps failing, check
  https://status.ngrok.com/ for outages, or consider an EAS
  Update/hosted build as an alternative (not yet attempted).

## Environment notes
- This Claude session ran in a network-restricted cloud sandbox that
  blocks `ngrok.com`, `expo.dev`/`exp.host`, and `api.github.com`
  (all return 403), but allows `github.com` git push/pull and
  `registry.npmjs.org`. That's why all dev-server/tunnel testing had
  to be delegated to the user's own PC — this sandbox can never
  itself serve Expo Go over LAN or tunnel.
