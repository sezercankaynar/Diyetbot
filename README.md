# Diyetbot

A personal nutrition & training planner. It's a mobile-first PWA with a Turkish UI. It has a single user and no backend: all data stays in the browser's IndexedDB.

Screens (bottom tab bar: **Bugün · Menü · Spor · İlerleme · Ben**):
- **Bugün**: what's left of today's kcal/protein/carb/fat budget, water glasses, 1–3 daily habits, an end-of-day review, today's menu with "eaten" ticks and items eaten off-menu. It also opens these helpers:
  - *Bunu yiyebilir miyim?* Pick one or more foods and portions to get a verdict (fits / careful / smaller portion / over budget), diet-rule warnings, tips and better alternatives.
  - *Dışarıda yiyorum*: best picks, tips and things to avoid for 9 venue types (kebapçı, dönerci, esnaf lokantası, pide, fast food, pizza, balıkçı, kahvaltı, kafe). It also lists **chain restaurant menus** ranked for the user, using values the chains publish themselves (see `src/engine/chains.ts` for the sources).
  - *Paketli ürün ekle* (inside "Bunu yiyebilir miyim?") lets you add packaged products in three ways: scan the barcode (Android app, Google code scanner), search by name, or type the values from the label. The first two use [Open Food Facts](https://world.openfoodfacts.org) and need internet. Saved products stay on the device and show up in search.
  - *Tatlı krizi*: step-by-step craving plan, light sweet options that fit the remaining budget and the diet, and prevention tips.
- **Yediklerin** (Bugün): after ticking a meal, open it to correct each part (− / + in household steps, ✕ = didn't eat it); the day's totals follow.
- **Alışveriş listesi** (Menü): the menu's dishes broken into raw/dry ingredients (`src/engine/shopping.ts`; cooked pilav → dry bulgur by energy), grouped by aisle, from today or for the whole week, with ticks and sharing.
- **Tarif**: menu dishes with a recipe open their ingredient list (the one the kcal comes from, scalable to 2/4/6 portions) and a short low-oil method (`src/content/recipes.ts`).
- **Aynı tencereden iki gün** (Profil → Öğün düzeni): a pot dish (sulu yemek, baklagil) cooked at dinner comes back the next day.
- **Mevsim**: out-of-season fruit and vegetable dishes are left out of a week's menu (`inSeason` in `plateParts.ts`; e.g. no strawberries, okra or çoban salata in winter, no leek or spinach in summer).
- **Ramazan** (Profil → Öğün düzeni): sahur, iftar (opens with soup and a date; the main meal) and a light snack after iftar.
- **Özel gün** (Menü): mark a day for an invitation or wedding: that evening is free (≈1000 kcal counted), the day's other meals and the other days get a bit lighter (≤150 kcal/day) so the week stays on target.
- **Adımlar (Health Connect)** (Spor, Android 8+): read-only daily steps for the last 7 days via `@capgo/capacitor-health`; once allowed it syncs when the app opens. Only `READ_STEPS` is requested (the plugin's other health permissions are removed in the manifest); the privacy page Health Connect requires is `public/privacypolicy.html`.
- **Tartılma hatırlatıcısı** (İlerleme): weekly repeating notifications on chosen weekdays and time.
- **Haftalık özet** (İlerleme; on Mondays also on Bugün): the 7 days before today in numbers (days logged, avg kcal/protein, days near target, water, steps, workouts, change of the weight average) with wins and 1–2 focus points (`src/engine/review.ts`).
- **Kilo durunca** (İlerleme): when losing weight and the 7-day average hasn't moved for ≥ 2 weeks, an explanation of normal fluctuation and what to check first (logging, hidden calories, steps, sleep) before cutting calories.
- **Yedek hatırlatması** (Bugün): after a week of use without a backup, or 30 days since the last one.
- **Su hatırlatıcısı** (Bugün → Su): Android notifications every 1–3 hours between chosen times (`src/engine/water.ts`, `src/native/waterNotifications.ts`, Capacitor Local Notifications, inexact alarms). The notification's *İçtim* button adds a glass; once the day's target is reached, that day's remaining reminders are cancelled. A week of reminders is kept scheduled ahead (renewed when the app opens). In the app (and on the web) a nudge appears when the day falls behind an even spread or it's been a while since the last glass.
- **Menü**: a weekly menu written like a Turkish dietitian's list (`src/engine/planner.ts`, `src/engine/plateParts.ts`). Every meal is a plate in household amounts: breakfast = eggs/menemen/omlet + white cheese + olives + söğüş + wholegrain bread (or milky oats with fruit and walnuts); lunch/dinner = main dish (+ soup on some days) + bulgur/pirinç pilavı or bread + yoghurt/cacık/ayran (not with fish) + salad (+ optional fruit); snacks = fruit + walnuts/almonds, yoghurt or kefir + fruit, bread + cheese, etc. The week follows TÜBER frequencies: fish twice (dinner), dry legumes 2–3 times, sulu sebze yemekleri ≥ 30 % of main meals, little red meat, no main dish twice. All values are computed from the ingredient table. Plate titles are built from what's actually on the plate. Soup is offered on one main meal a day and added only when the day's kcal and macros call for it. Main dishes of the previous (or replaced) week are used less, so weeks don't repeat. Each day is then tuned within allowed steps (bread slices, pilav spoons, yoghurt, portion size) so it lands just under the kcal target (never over), with protein, carbs and fat as close as the food allows and each meal near its share of the day. Meal styles (light/normal/hearty), chosen meals, likes/dislikes and cooking time shape it. Swap any meal for an alternative plate, like dishes or hide them for good, and rebuild the week. Vegan and keto profiles use the older single-dish generator.
- **Spor**: weekly schedule (strength / cardio / active rest / rest), today's workout with how-to guides per exercise (steps, cues, rest, easier/harder versions), a step tracker with a 7-day chart, cardio types, warm-up and evidence (`src/content/exercises.ts`).
- **Ben**: *Planım* (targets, diet style, plate rules, IF, calculation details), *Profil* (questionnaire in collapsible sections, including meal pattern and meal times) and *Kanıtlar* (all studies + disclaimer).
- **Öğün dışı yediklerin** (Bugün): *＋ Ekle* logs anything eaten outside meals (chips, popcorn, nuts, sweets…) with the same search, portion choice and ingredient builder; it counts toward today's totals. Snacks (popcorn, potato/tortilla chips, pretzels, crackers, seeds, nuts, dried fruit) are in the dish library, built from USDA SR Legacy per-100 g values, and findable by common names (*popcorn*, *chips*, *çiğdem*).
- **＋ on every menu meal** (Menü): search any dish, chain item or saved product by name (`src/engine/foodSearch.ts`: Turkish-insensitive and suffix-tolerant, so *tavuklu pilav* finds *Tavuklu bulgur pilavı*) and put it into that meal with its ready-made values. You pick the portion (½ to 3). To keep the day inside its targets the day's other meals are made smaller, never the ones already ticked as eaten. What the user ate is never blocked: if the day still goes over, it's added anyway with a note on how much it's over. For today, *Bunu yedim* also logs it as eaten. If the dish isn't listed, *Yemek ekle* builds it from ingredients and grams (household measures offered); kcal and macros are computed from the ingredient table, and the dish is saved for later searches. Search also covers ~85 everyday dishes in `src/engine/dishLibrary.ts` (pilavlar, çorbalar, sulu yemekler, börek, köfte …), each a standard one-portion recipe whose values are computed from the same ingredient table; generated menus don't use them.
- **Tatlı krizi** now includes 25 lighter sweet recipes (`src/content/sweetRecipes.ts`) with filters.
- **Takip**: weigh-ins, trend chart and the weekly adjustment, plus a dietitian-style **weekly check-in**. The check-in records waist, neck and hip (body fat by the U.S. Navy method), hunger, energy, sleep, adherence and difficulties. It returns rule-based feedback (wins, up to 3 focus points, tips) and keeps a history with a waist trend.
- **Profil**: theme (system / light / dark, stored per device in localStorage), the questionnaire (including *Damak zevki* likes/dislikes and which meals you eat), backup and restore.

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
    menu.ts        Menu types, totals, swaps, placement of the user's dishes; delegates the week to planner.ts
    planner.ts     Dietitian-style week: TÜBER rotation of main-dish kinds, plates, tuning of amounts to the targets
    plateParts.ts  Plate parts in household units (dilim, yemek kaşığı, su bardağı …), main dishes by kind, templates
    dishLibrary.ts Everyday dishes as one-portion recipes; values computed from ingredients.ts
    check.ts       "Can I eat this?" verdict + alternatives
    eatingOut.ts   Venue guides filtered by preferences and remaining budget
    cravings.ts    Sweet-craving plan
    diary.ts       Daily eaten log totals
    foodList.ts    Built-in dish/food data (foods.ts adds lookup over dishes + chains + saved products)
    chains.ts      Chain menus. Each chain has a source. Published values are used as-is; macros that don't
                   add up to the kcal are dropped (kcal-only). Per-100 g/ml values get an assumed serving.
                   Brands without published values map to generic recipes and are marked `estimated`.
    coach.ts       Weekly check-in feedback, Navy body fat, habits, water, steps, end-of-day review
    timing.ts      Meal time windows and timing tips
    homeRecipe.ts  Home recipes from ingredients or values
    ingredients.ts Ingredient nutrition per 100 g with sources
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
- Protein is 1.6 g/kg reference weight when losing weight (where the lean-mass benefit plateaus, Morton 2018, and what home cooking reaches), 1.8 for recomposition. Protein and the fat minimum use the reference weight. Water uses actual weight.
- Low-carb: carbs are `min(130, (kcal − protein − min fat) / 4)`, and fat takes the remainder. Keto: carbs are 30 g, and fat takes the remainder.
- Diet ties keep the order Mediterranean → HP → DASH → Low-carb → Plant → Keto. Safety-excluded diets (keto with diabetes meds) are sorted last and can't be selected.
- In Plan, you can tap another diet to override the recommendation. Macros and meal rules are recalculated for it.
- Weekly analysis needs ≥ 14 calendar days between the first and last weigh-in, with data in both 7-day windows. Recomp uses the maintain rule (|rate| < 0.2 kg/wk is OK). For maintain/recomp, the correction is 100 kcal when |rate| < 0.4 kg/wk and 150 kcal otherwise.
- Accepted adjustments are stored as a history. The kcal target is `computed target + sum(accepted kcal deltas)`, never below the floor, so it stays valid when your weight changes. An adjustment can be undone ("Geri al"). After you accept one, new suggestions are held back for 7 days so the same two-week window doesn't trigger the same advice twice.

## LLM seam

`src/llm/` contains a small OpenAI-compatible client (`chatCompletion`) and `explainPlan()`. `explainPlan()` passes the finished engine output to the model as read-only facts, with a system prompt that forbids computing or changing numbers or safety decisions. It returns nothing when a safety stop applies. To use it, pass an `LlmConfig` (`baseUrl`, for example `https://your-litellm/v1`, plus `apiKey` and `model`) and render the returned text **next to** the engine numbers, never instead of them. Note that an API key in a static client is visible to anyone with access to the app.

## Disclaimer

This app does not diagnose and does not replace a dietitian. If lab results, medication or a chronic disease are involved, consult a healthcare professional.
