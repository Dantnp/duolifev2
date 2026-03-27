# DuoLife E2E Testing — Appium + UiAutomator2

## App Info

| Field            | Value                            |
|------------------|----------------------------------|
| Package name     | `com.duolife.app`                |
| Main activity    | `.MainActivity`                  |
| Framework        | React Native 0.81 + Expo SDK 54 |
| Test framework   | WebdriverIO 9 + Mocha           |
| Appium driver    | UiAutomator2                     |

---

## Prerequisites

1. **Node.js** 18+ installed
2. **Java JDK** 17+ (`JAVA_HOME` set)
3. **Android Studio** with:
   - Android SDK (API 34+)
   - Android Emulator
   - An AVD created (e.g. `Pixel_7_API_34`)
   - `ANDROID_HOME` / `ANDROID_SDK_ROOT` env vars set
   - Platform tools on `PATH` (for `adb`)
4. **Appium 2** installed globally

---

## Step-by-Step Setup

### 1. Install Appium 2 + UiAutomator2 driver

```bash
npm install -g appium
appium driver install uiautomator2
```

Verify:
```bash
appium --version       # should be 2.x
appium driver list     # should show uiautomator2 [installed]
```

### 2. Start the Android emulator

```bash
# List available AVDs
emulator -list-avds

# Start one (replace with your AVD name)
emulator -avd Pixel_7_API_34 &
```

Wait until the emulator fully boots:
```bash
adb wait-for-device
adb shell getprop sys.boot_completed  # should return "1"
```

### 3. Build the Android APK

**Option A: EAS Build (recommended for release APK)**
```bash
npx eas build --platform android --profile preview --local
```

**Option B: Expo prebuild + Gradle**
```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease && cd ..
```

**Option C: Expo dev build (for development)**
```bash
npx expo run:android
```

The APK will be at:
- Release: `android/app/build/outputs/apk/release/app-release.apk`
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`

### 4. Install E2E dependencies

```bash
cd e2e
npm install
cd ..
```

### 5. Start Appium server

```bash
appium
```

Leave this running in a separate terminal.

### 6. Run tests

```bash
cd e2e

# All tests
npm test

# Dev build
npm run test:dev

# Individual suites
npm run test:smoke
npm run test:feedback
npm run test:progression
npm run test:persistence
```

---

## WDIO Config

- **Release build**: `e2e/config/wdio.conf.ts` — points to release APK
- **Dev build**: `e2e/config/wdio.dev.conf.ts` — points to debug APK, longer wait for JS bundle

Update the `appium:app` path in the config if your APK is in a different location.

---

## Test Structure

```
e2e/
├── config/
│   ├── wdio.conf.ts              # Release build config
│   └── wdio.dev.conf.ts          # Dev build config
├── helpers/
│   ├── selectors.ts               # Semantic testID selectors
│   ├── actions.ts                 # Reusable flow helpers
│   └── fixtures.ts                # Deterministic answer data from question bank
├── tests/
│   ├── smoke.spec.ts              # App launch, navigation, basic flows
│   ├── quiz-feedback.spec.ts      # Answer feedback, state assertions, guardrails
│   ├── progression.spec.ts        # Completion, unlock logic, section gating
│   └── persistence.spec.ts        # In-session + cross-session state retention
├── package.json
└── tsconfig.json
```

### Flow helpers in `actions.ts`

| Helper                          | Purpose                                              |
|---------------------------------|------------------------------------------------------|
| `resetToFreshState()`           | Kill + relaunch app for deterministic clean state    |
| `goToLearn()`                   | Navigate to Learn tab, wait for cards                |
| `openFirstUnlockedSection()`    | Tap first unlocked section on Learn screen           |
| `openFirstAvailableConcept(ids)`| Tap first available concept on SectionMap            |
| `answerQuestion(letter)`        | Tap answer option, wait for feedback (no pause)      |
| `tapNext()`                     | Tap Next, wait for new question or results phase     |
| `startQuiz()`                   | Tap Start Quiz, wait for answer options              |
| `navigateToFirstQuiz(ids)`      | Full path: Learn → Section → Concept → Start Quiz   |
| `answerAllQuestionsCorrectly()` | Brute-force all questions correct                    |
| `goldenFlowFirstConcept()`      | Full end-to-end: fresh → learn → pass → unlock      |
| `waitForFeedback()`             | Wait for feedback-correct or feedback-wrong element  |
| `verifyLockedSection(slug)`     | Assert a section card shows as locked                |
| `verifyUnlockedSection(slug)`   | Assert a section card shows as unlocked              |
| `restartApp()`                  | Kill + relaunch the app                              |
| `navigateAwayAndBack(tab)`      | Leave tab and return to test in-session persistence  |

---

## Deterministic Test Fixtures

Tests use **fixture data** (`e2e/helpers/fixtures.ts`) that mirrors the exact
question data in `src/data/whatIsUK.ts`. This eliminates brute-force answer
discovery — every test knows the correct and wrong answer for each question.

### Fixture structure

```typescript
interface QuestionFixture {
  type: 'single' | 'multiple' | 'boolean';
  correctIndex: number;       // for single/boolean
  correctIndices?: number[];  // for multi-select
}

interface ConceptFixture {
  conceptId: string;
  sectionSlug: string;
  sectionConceptCount: number;
  questions: QuestionFixture[];
}
```

### Available fixtures

| Name             | Concept ID       | Questions | Types                    |
|------------------|------------------|-----------|--------------------------|
| `GREAT_BRITAIN`  | `great-britain`  | 3         | multiple, boolean, boolean |
| `CAPITALS`       | `capitals`       | 3         | single, single, single   |

### Keeping fixtures in sync

If question data in `src/data/whatIsUK.ts` changes (reordered options, new
questions, changed correct indices), update the corresponding fixture in
`e2e/helpers/fixtures.ts` to match. A fixture mismatch will cause deterministic
tests to fail with `feedback-wrong` where `feedback-correct` was expected —
the failure message makes the root cause obvious.

---

## Stable Test-ID Contract

The following testIDs are **contractually stable** for E2E tests. Do not rename
or remove them during UI refactors without updating `e2e/helpers/selectors.ts`
and all affected specs.

### Tier 1 — Core (breaking these fails the entire suite)

| testID                     | Stability | Notes                                 |
|----------------------------|-----------|---------------------------------------|
| `home-start-button`        | Stable    | Primary CTA on home screen            |
| `practice-screen-heading`  | Stable    | Screen marker for Practice tab        |
| `progress-screen-title`    | Stable    | Screen marker for Progress tab        |
| `account-screen-title`     | Stable    | Screen marker for Account tab         |
| `progress-bar`             | Stable    | Quiz/section progress track           |
| `continue-button`          | Stable    | Resume chip on Learn screen           |
| `start-quiz-button`        | Stable    | Lesson → quiz transition button       |
| `answer-option-a/b/c/d`   | Stable    | Answer options (letter suffix is fixed)|
| `confirm-button`           | Stable    | Multi-select confirm                  |
| `next-button`              | Stable    | Advance to next question / finish     |
| `question-counter`         | Stable    | "Question N of M" text                |
| `section-map-progress`     | Stable    | "X/Y completed" in SectionMap         |

### Tier 2 — Feedback & Results (breaking these fails feedback/progression tests)

| testID                       | Stability | Notes                                 |
|------------------------------|-----------|---------------------------------------|
| `feedback-correct`           | Stable    | Correct answer indicator              |
| `feedback-wrong`             | Stable    | Wrong answer indicator                |
| `feedback-explanation`       | Stable    | Explanation text after answer         |
| `result-icon-passed`         | Stable    | Passed quiz celebration               |
| `result-icon-failed`         | Stable    | Failed quiz indicator                 |
| `retry-button`               | Stable    | "Try Again" on failed result          |
| `unlock-next-section-button` | Stable    | Navigate to next section after unlock |
| `unlock-label`               | Stable    | "Next concept/section unlocked" text  |

### Tier 3 — Semantic section/concept IDs (pattern-stable)

These follow patterns tied to data. The **pattern** is stable; individual values
change only when section/concept slugs change in the data layer.

| Pattern                              | Example                                  |
|--------------------------------------|------------------------------------------|
| `learn-card-{section.slug}`          | `learn-card-what-is-the-uk`              |
| `locked-section-card-{section.slug}` | `locked-section-card-government-and-law` |
| `unlock-message-{section.slug}`      | `unlock-message-values-and-principles`   |
| `progress-bar-{section.slug}`        | `progress-bar-history-of-the-uk`         |
| `concept-card-{concept.id}`          | `concept-card-great-britain`             |
| `progress-count-{section.slug}`     | `progress-count-what-is-the-uk`          |

### Rules for contributors

1. **Never rename a Tier 1 or Tier 2 testID** without a corresponding update to
   `e2e/helpers/selectors.ts`.
2. **Tier 3 IDs** change automatically if the underlying data slug changes —
   update `SECTION_SLUGS` in `selectors.ts` when that happens.
3. **Adding new testIDs** is always safe — add the selector to `selectors.ts`
   and write a test for it.
4. **Run `cd e2e && npm test`** before merging any PR that touches screen
   components or navigation.

---

## CI Reliability Rules

These rules ensure the suite stays stable, deterministic, and product-critical.

### No fixed pauses

Every helper in `actions.ts` waits for a concrete element or state transition
instead of calling `driver.pause()`. All timeouts are defined in `TIMEOUT`
constants in `selectors.ts`:

| Constant            | Value   | Use case                     |
|---------------------|---------|------------------------------|
| `TIMEOUT.APP_READY` | 30 000  | App launch / cold start      |
| `TIMEOUT.NAVIGATION`| 10 000  | Screen element after nav     |
| `TIMEOUT.ANIMATION` |  5 000  | Feedback animation complete  |
| `TIMEOUT.SHORT`     |  3 000  | Quick existence check        |

### Deterministic state

- Every spec that assumes fresh/locked state calls `resetToFreshState()` in its
  `before()` hook. This kills and relaunches the app, wiping in-memory state.
- Tests never depend on side-effects from other spec files or prior runs.

### No silent pass on ambiguous state

- If a test cannot determine the expected state (e.g. brute-force answer order
  doesn't match question data), it **logs a warning** with context rather than
  silently passing.
- Prefer `console.warn('SKIP: ...')` with a reason over swallowing the assertion.

### Assertion hygiene

- `expect(x).toBe(true/false)` for boolean checks — never `if (x) { ... }` alone.
- `.withContext('reason')` on assertions where failure cause isn't obvious.
- `.toBeDisplayed()` for visible elements, `.toBeExisting()` for off-screen.

---

## Persistence Note

**Status: tracked delivery item.**

The app currently uses an **in-memory progress store** (`src/store/progress.ts`).
All progress is lost on app restart. Integrating AsyncStorage or MMKV should be
prioritised as it blocks:

- Cross-session tests in `persistence.spec.ts` (currently document the gap).
- The golden-flow test from fully validating end-to-end unlock persistence.

### How to convert when persistence is added

1. In `persistence.spec.ts`, find the block marked:
   ```
   // PERSISTENCE GAP
   ```
2. Flip `expect(isSection2Locked).toBe(true)` → `.toBe(false)`.
3. The in-session tests require no changes — they already pass.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Could not find a connected Android device` | Start emulator: `emulator -avd <name>` |
| `UiAutomator2 server launch timeout` | Increase `uiautomator2ServerLaunchTimeout` in config |
| `App not installed` | Verify APK path in config matches actual build output |
| `Element not found` | Check `adb shell uiautomator dump` for element tree |
| Expo dev build slow to load | Increase `appWaitDuration` in dev config |
