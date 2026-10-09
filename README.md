# Diyetbot

A personal nutrition & training planner. It's a mobile-first PWA with a Turkish UI. It has a single user and no backend: all data stays in the browser's IndexedDB.

Screens (bottom tab bar):
- **Bugün**: what's left of today's kcal/protein budget, today's menu with "eaten" ticks and items eaten off-menu. It also opens three helpers:
  - *Bunu yiyebilir miyim?* Pick one or more foods and portions to get a verdict (fits / careful / smaller portion / over budget), diet-rule warnings, tips and better alternatives.
  - *Dışarıda yiyorum*: best picks, tips and things to avoid for 9 venue types (kebapçı, dönerci, esnaf lokantası, pide, fast food, pizza, balıkçı, kahvaltı, kafe). It also lists **chain restaurant menus** ranked for the user, using values the chains publish themselves (see `src/engine/chains.ts` for the sources).
  - *Paketli ürün ekle* (inside "Bunu yiyebilir miyim?") lets you add packaged products in three ways: scan the barcode (Android app, Google code scanner), search by name, or type the values from the label. The first two use [Open Food Facts](https://world.openfoodfacts.org) and need internet. Saved products stay on the device and show up in search.
  - *Tatlı krizi*: step-by-step craving plan, light sweet options that fit the remaining budget and the diet, and prevention tips.
- **Menü**: a weekly menu built from a Turkish dish database. It fits the kcal target, diet, animal-food preference, disliked ingredients and cooking time. You can swap any meal for an alternative, like dishes (they show up more often) or hide them for good, and rebuild the week.
- **Plan**: targets, diet recommendation, meal rules and the training week. A link opens **Kanıt** (the studies behind the rules + disclaimer).
- **Takip**: weigh-ins, trend chart and the weekly adjustment.
- **Profil**: the questionnaire (including *Damak zevki* / dislikes), backup and restore.

## Stack

Vue 3 + TypeScript + Vite · Pinia · vite-plugin-pwa · IndexedDB via `idb` · hand-rolled SVG chart · Vitest.

## Run

Requires Node 20+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (engine, DB, LLM seam)
npm run typecheck
```

## Build

```bash
npm run build      # type-checks, then outputs static files to dist/
npm run preview    # serve dist/ locally (service worker active)
```

## Deploy (static hosting)

`dist/` is a plain static site. Upload it to any static host. The service worker and the install prompt need **HTTPS**; `localhost` is the only exception.

- **Netlify / Vercel / Cloudflare Pages**: build command `npm run build`, output directory `dist`.
- **GitHub Pages** (served from a sub-path): build with the base path set, then publish `dist/`:
  ```bash
  BASE_PATH=/Diyetbot/ npm run build
  ```
- **Any web server** (nginx, Caddy, S3 + CloudFront): copy `dist/` as-is. Navigation uses `#hash` URLs, so no rewrite rules are needed.

## Android app (APK)

The same web app is wrapped as a native Android app with [Capacitor](https://capacitorjs.com) (`android/`, `capacitor.config.ts`). The service worker is disabled for this build because the files are bundled inside the app. In the app, the JSON export opens the Android share sheet so you can save the file to Drive or Files.

Requirements: Java 21 and the Android SDK (`ANDROID_HOME`).

```bash
npm run build:android                 # web build + copy into android/
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

**Signing.** The release signing key is **not** in the repo. Point these env vars at a private keystore (alias `diyetbot`):

```bash
export DIYETBOT_KEYSTORE=/path/to/diyetbot.keystore
export DIYETBOT_KEYSTORE_PASSWORD=...
```

Without them, the APK is signed with the local debug key. Android only installs an update over the existing app when **both APKs are signed with the same key**. If the key changes, the old app has to be uninstalled first, which deletes its data. So take a JSON backup before installing a build signed with a different key. Set `VERSION_CODE` to a higher number for each new build.

## Data & backup

Profile, weigh-ins, accepted adjustments, the chosen diet, menu feedback, the weekly menu and the food diary are stored in IndexedDB (database `diyetbot`, schema v2). Use **Profil → Yedekleme** to export or import a JSON backup. Importing **replaces** all current data, and the file is validated before anything is written.

## Architecture

```
src/
  engine/          Pure TS: every calculation and decision. No Vue/DOM imports.
    types.ts       Domain types (Profile, Plan, WeighIn, …)
    energy.ts      BMR (Mifflin-St Jeor), TDEE, goal targets, deficit cap, floor, BMI, WHtR
    macros.ts      Reference weight, protein/fat/carbs per diet, fiber, water
    safety.ts      Hard stops + warnings (evaluated first)
    diets.ts       Diet scoring with Turkish reasons, 16:8 IF overlay
    meals.ts       Protein per meal, filtered protein sources, plate rules, hunger tips
    training.ts    Split generator, gym/home exercise swaps, cardio/steps/sleep
    tracking.ts    7-day rolling average, weekly analysis, adjustment cooldown
    foods.ts       Turkish dish/food database (approximate macros per portion; kcal derived from macros)
    foodRules.ts   Animal-food, dislike and diet compatibility (keto/low-carb carb caps, DASH salt, plant)
    menu.ts        Weekly menu generator (seeded, deterministic), alternatives, swaps, totals
    check.ts       "Can I eat this?" verdict + alternatives
    eatingOut.ts   Venue guides filtered by preferences and remaining budget
    cravings.ts    Sweet-craving plan
    diary.ts       Daily eaten log totals
    chains.ts      Chain restaurant menu items with published nutrition (source per chain)
    packaged.ts    Label → food conversion, Open Food Facts product parsing, label validation
  off/             Open Food Facts client (network)
  native/          Barcode scanning (Capacitor ML Kit plugin, Android only)
    plan.ts        buildPlan(): orchestrates everything into one Plan object
    defaults.ts    Default profile
    __tests__/     Vitest suites
  llm/             Optional LLM seam (OpenAI-compatible, e.g. a LiteLLM proxy). Not wired into the UI.
  db/              IndexedDB repository + backup validation
  stores/app.ts    Pinia store: loads/persists data and exposes engine output
  views/           Profil, Plan, Takip, Kanıt screens (render engine output only)
  components/      Callout, segmented control, score bar, stat box, weight chart, backup panel
  content/         Turkish labels and the evidence texts
  styles/main.css  Design tokens (light/dark via prefers-color-scheme) + base styles
```

The UI only renders what `buildPlan()` / `analyzeWeek()` return; the views contain no calculation logic.

### Engine notes and interpretations

- Kcal targets are rounded to the nearest 5. The floor is `max(1500 m / 1200 f, BMR × 0.95)`, and clamping adds a "slower progress" note.
- A safety stop returns a `Plan` with only `safety` filled in, so no kcal or macro values exist to render.
- The plant protein reduction (`max(1.6, value − 0.2)`) applies when the chosen diet is plant-based **or** the user is vegetarian/vegan.
- Protein and the fat minimum use the reference weight. Water uses actual weight.
- Low-carb: carbs are `min(130, (kcal − protein − min fat) / 4)`, and fat takes the remainder. Keto: carbs are 30 g, and fat takes the remainder.
- Diet ties keep the order Mediterranean → HP → DASH → Low-carb → Plant → Keto. Safety-excluded diets (keto with diabetes meds) are sorted last and can't be selected.
- In Plan, you can tap another diet to override the recommendation. Macros and meal rules are recalculated for it.
- Weekly analysis needs ≥ 14 calendar days between the first and last weigh-in, with data in both 7-day windows. Recomp uses the maintain rule (|rate| < 0.2 kg/wk is OK). For maintain/recomp, the correction is 100 kcal when |rate| < 0.4 kg/wk and 150 kcal otherwise.
- Accepted adjustments are stored as a history. The kcal target is `computed target + sum(accepted kcal deltas)`, never below the floor, so it stays valid when your weight changes. An adjustment can be undone ("Geri al"). After you accept one, new suggestions are held back for 7 days so the same two-week window doesn't trigger the same advice twice.

## LLM seam

`src/llm/` contains a small OpenAI-compatible client (`chatCompletion`) and `explainPlan()`. `explainPlan()` passes the finished engine output to the model as read-only facts, with a system prompt that forbids computing or changing numbers or safety decisions. It returns nothing when a safety stop applies. To use it, pass an `LlmConfig` (`baseUrl`, for example `https://your-litellm/v1`, plus `apiKey` and `model`) and render the returned text **next to** the engine numbers, never instead of them. Note that an API key in a static client is visible to anyone with access to the app.

## Disclaimer

This app does not diagnose and does not replace a dietitian. If lab results, medication or a chronic disease are involved, consult a healthcare professional.
