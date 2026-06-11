# ManoApp — Production Roadmap & Go-Live Guide

_Last updated: 2026-06-11_

This is the working plan for taking ManoApp from "looks pro and is deployed" to
"charging customers and shipping a mobile companion." It captures what's done,
what's required to monetize for real, and the phased plan for the rest.

---

## ✅ Done

- **Dark-studio UI system** — `src/theme/tokens.ts` + a rebuilt `ThemeContext`
  re-skin the entire app (every MUI surface reads the theme). Removed peach
  gradients, rainbow buttons, the pig-icon roundness; flat surfaces, indigo
  accent, 8px radius, Inter type scale.
- **Redesigned auth screen** and **sidebar** (studio brand mark, plan badge).
- **Project view** rainbow button bar → uniform theme-driven tab strip.
- **Tiered subscriptions (mock-first):** `free / indie $9 / pro $29 / label $99`
  with per-plan features + limits (`src/config/plans.ts`). Pricing page, billing
  page, feature-gating (`FeatureGate`), live subscription state
  (`SubscriptionProvider`), and the Stripe Cloud Functions
  (checkout / portal / webhook / entitlements). Works end-to-end in **mock
  mode** with no Stripe keys.
- **Deployed:** https://manoapp-91840.web.app (Hosting + Firestore rules,
  including the SPA rewrite and server-write-only `subscriptions/` + `customers/`).

---

## 🔴 To actually charge customers — required, owner-only steps

These need _your_ accounts/cards and can't be done from code:

1. **Upgrade Firebase to the Blaze (pay-as-you-go) plan.** Cloud Functions v2
   require it. The billing callables (`createCheckoutSession`,
   `createBillingPortalSession`, `stripeWebhook`) are built and deploy-ready but
   **could not be deployed** on the current Spark (free) plan.
   → https://console.firebase.google.com/project/manoapp-91840/usage/details
   Then: `npx -y firebase-tools@latest deploy --only functions`

2. **Create a Stripe account** and add the products/prices for indie/pro/label
   (monthly + yearly). Copy the price IDs.

3. **Set the Functions env** (`functions/.env` or `firebase functions:config`),
   per `functions/.env.example`:
   - `STRIPE_MODE=live`
   - `STRIPE_SECRET_KEY=sk_live_…`
   - `STRIPE_WEBHOOK_SECRET=whsec_…`
   - `STRIPE_PRICE_INDIE_MONTHLY=price_…` (+ `_YEARLY`, and PRO/LABEL variants)
   The code auto-stays in mock mode until both `STRIPE_MODE=live` **and**
   `STRIPE_SECRET_KEY` are present — safe by default.

4. **Register the webhook** in Stripe → the deployed `stripeWebhook` URL, for
   events `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`.

Until then: the app is live, the free tier works, and the paid flow is fully
functional in mock mode (it grants the plan without charging) for demos.

---

## Distribution go-live (separate, also owner-only)

The Revelator distribution pipeline is built mock-first too. Going live needs a
signed Revelator partner agreement + `REVELATOR_CLIENT_ID/SECRET` and
`REVELATOR_MODE=live`. See the project memory / `functions/.env.example`.

---

## Next phases (engineering)

**Phase 1 — IA & nav.** Add **Catalog** (flat searchable library of all
songs/albums) and promote **Distribution** to a first-class route (today the
best-built subsystem is buried as a project panel). Rename user-facing
"Trips" → "Projects".

**Phase 2 — Consolidation (risky, needs tests first).** Split the three god
files before heavy further work: `SongDetailsPanel.tsx` (~1900 lines),
`MainContent.tsx` (~1490), `firebaseService.ts` (~1240). The firebaseService
refactor into a framework-agnostic core is also what unlocks mobile reuse.
Merge the 5+ overlapping export/publish panels into one Distribution flow
(keep the `ExportPanel` + orchestrator path).

**Phase 3 — Feature depth.** Release status dashboard, royalty/splits
surfacing, real charts in Analytics (replace the `LinearProgress` "charts" with
recharts/visx), bulk ops wiring, metadata-completeness gating on distribution,
notifications on submission status changes, a shared waveform player.

---

## Mobile companion (React Native + Expo)

Purpose: track albums and manage content from mobile on the same Firebase
backend. Companion/monitoring + light management, not the full editor.

- **Stack:** Expo (managed) + expo-router, Firebase JS SDK with RN persistence
  (or `@react-native-firebase`), Zustand + TanStack Query, a thin RN component
  layer + a tokens mirror of the dark-studio system. **Not** MUI (web-only).
- **Shared code:** publish a framework-agnostic `@manoapp/core` package —
  `src/types/*`, pure utils (formatters/validation/completeness), and Firestore
  query logic refactored to take a Firestore instance as a parameter. Mind the
  ESM/CJS boundary (the TS1479 lesson): dual-build or types-only + pure
  functions, `import type` across the package, and **don't** import
  `src/firebase/config.ts` (Vite-only `import.meta.env`).
- **Tabs:** Home (active releases / what-needs-attention) · Catalog · Distribution
  status · Notifications · Profile.
- **Build order:** (1) skeleton + auth + read-only catalog; (2) album/song detail,
  edit metadata/status/release date, artwork upload, shared player; (3)
  distribution status + FCM push on status changes; (4) offline (query
  persistence, upload queue, biometric unlock).
- **Do not** start the mobile app until `@manoapp/core` exists (Phase 2), or
  logic will fork.

---

## Sequencing principle

Phase 1 ships visible IA wins fast; do the risky Phase-2 decomposition behind
tests; mobile starts once the shared core exists. Monetization is unblocked the
moment Blaze + Stripe are set up (steps above) — no further code required.
