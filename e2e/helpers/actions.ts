/**
 * Reusable actions for DuoLife E2E tests.
 *
 * RULES:
 *  1. No fixed driver.pause() — every wait targets a concrete element or state.
 *  2. All timeouts come from TIMEOUT constants in selectors.ts.
 *  3. Helpers that detect ambiguous state throw rather than silently pass.
 *  4. Answer helpers use deterministic fixture data — no brute-force.
 */
import {
  Sel,
  SECTION_SLUGS,
  SECTION_SLUG_LIST,
  FIRST_SECTION_CONCEPTS,
  TIMEOUT,
} from './selectors';
import {
  ConceptFixture,
  QuestionFixture,
  indexToLetter,
} from './fixtures';

// ─────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────

/** Wait for element to be visible, then tap it. */
export async function tapElement(selector: string, timeout = TIMEOUT.NAVIGATION) {
  const el = await $(selector);
  await el.waitForDisplayed({ timeout });
  await el.click();
}

/** Wait for element to exist in the tree (may be off-screen). */
export async function waitForElement(selector: string, timeout = TIMEOUT.NAVIGATION) {
  const el = await $(selector);
  await el.waitForExist({ timeout });
  return el;
}

/** Wait for element to be visible on screen. */
export async function waitForDisplayed(selector: string, timeout = TIMEOUT.NAVIGATION) {
  const el = await $(selector);
  await el.waitForDisplayed({ timeout });
  return el;
}

/** Wait until an element disappears from the screen. */
export async function waitForNotDisplayed(selector: string, timeout = TIMEOUT.NAVIGATION) {
  const el = await $(selector);
  await el.waitForDisplayed({ timeout, reverse: true });
}

/** Return true if element exists in the tree right now (no wait). */
export async function elementExists(selector: string): Promise<boolean> {
  const el = await $(selector);
  return el.isExisting();
}

/** Return true if element is visible on screen right now. */
export async function elementIsDisplayed(selector: string): Promise<boolean> {
  const el = await $(selector);
  if (!(await el.isExisting())) return false;
  return el.isDisplayed();
}

/** Return true if element is enabled (not disabled) right now. */
export async function elementIsEnabled(selector: string): Promise<boolean> {
  const el = await $(selector);
  if (!(await el.isExisting())) return false;
  return el.isEnabled();
}

/** Get the text content of an element. */
export async function getElementText(selector: string, timeout = TIMEOUT.SHORT): Promise<string> {
  const el = await $(selector);
  await el.waitForExist({ timeout });
  return el.getText();
}

/** Scroll down to reveal an element. */
export async function scrollToElement(selector: string, maxScrolls = 5) {
  for (let i = 0; i < maxScrolls; i++) {
    const el = await $(selector);
    if (await el.isDisplayed()) return el;
    await driver.execute('mobile: scrollGesture', {
      left: 100, top: 500, width: 200, height: 500,
      direction: 'down', percent: 0.75,
    });
    const elAfter = await $(selector);
    try { await elAfter.waitForDisplayed({ timeout: 800 }); return elAfter; } catch { /* scroll again */ }
  }
  throw new Error(`Element ${selector} not found after ${maxScrolls} scrolls`);
}

// ─────────────────────────────────────────────────
// State reset
// ─────────────────────────────────────────────────

/**
 * Reset to fresh-user state.
 * Terminates and relaunches the app so in-memory progress is wiped.
 */
export async function resetToFreshState() {
  await driver.terminateApp('com.duolife.app');
  await driver.activateApp('com.duolife.app');
  await waitForAppReady();
}

// ─────────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────────

const TAB_PROOF: Record<string, string> = {
  Home: Sel.homeStartButton,
  Learn: Sel.learnCard(SECTION_SLUGS.WHAT_IS_THE_UK),
  Practice: Sel.practiceScreenHeading,
  Progress: Sel.progressScreenTitle,
  Account: Sel.accountScreenTitle,
};

/** Navigate to a tab and wait for its proof element. */
export async function navigateToTab(tabName: 'Home' | 'Learn' | 'Practice' | 'Progress' | 'Account') {
  const tabLabel = await $(Sel.byText(tabName));
  await tabLabel.waitForDisplayed({ timeout: TIMEOUT.NAVIGATION });
  await tabLabel.click();
  const proof = TAB_PROOF[tabName];
  if (proof) {
    const el = await $(proof);
    await el.waitForDisplayed({ timeout: TIMEOUT.NAVIGATION });
  }
}

/** Wait for app to fully load after launch. */
export async function waitForAppReady(timeout = TIMEOUT.APP_READY) {
  const startBtn = await $(Sel.homeStartButton);
  await startBtn.waitForDisplayed({ timeout });
}

// ─────────────────────────────────────────────────
// Product flow helpers
// ─────────────────────────────────────────────────

/** Navigate to Learn tab and wait for first section card. */
export async function goToLearn() {
  await navigateToTab('Learn');
}

/** From Learn screen, tap the first unlocked section. Returns the slug. */
export async function openFirstUnlockedSection(): Promise<string> {
  for (const slug of SECTION_SLUG_LIST) {
    const selector = Sel.learnCard(slug);
    const el = await $(selector);
    if (await el.isExisting() && await el.isDisplayed()) {
      await el.click();
      await waitForDisplayed(Sel.conceptCard(FIRST_SECTION_CONCEPTS[0]), TIMEOUT.NAVIGATION);
      return slug;
    }
    try {
      const found = await scrollToElement(selector, 2);
      await found.click();
      await waitForDisplayed(Sel.conceptCard(FIRST_SECTION_CONCEPTS[0]), TIMEOUT.NAVIGATION);
      return slug;
    } catch { continue; }
  }
  throw new Error('No unlocked section card found');
}

/** From SectionMap, tap a concept. Waits for lesson screen. */
export async function openConcept(conceptId: string) {
  const selector = Sel.conceptCard(conceptId);
  const el = await $(selector);
  if (!(await el.isDisplayed())) {
    await scrollToElement(selector, 3);
  }
  await (await $(selector)).click();
  await waitForDisplayed(Sel.startQuizButton, TIMEOUT.NAVIGATION);
}

/** From lesson phase, tap Start Quiz and wait for answer options. */
export async function startQuiz() {
  await tapElement(Sel.startQuizButton);
  await waitForDisplayed(Sel.answerOptionA, TIMEOUT.NAVIGATION);
}

/**
 * Wait until either feedback-correct or feedback-wrong exists.
 * Returns which one appeared.
 */
export async function waitForFeedback(timeout = TIMEOUT.ANIMATION): Promise<'correct' | 'wrong'> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await elementExists(Sel.feedbackCorrect)) return 'correct';
    if (await elementExists(Sel.feedbackWrong)) return 'wrong';
    await new Promise(r => setTimeout(r, 150));
  }
  throw new Error(`No feedback indicator appeared within ${timeout}ms`);
}

/**
 * Wait for transition after tapping Next: either new question or results.
 * Returns 'question' if a new question loaded, 'results' if quiz ended.
 */
async function waitForQuestionOrResults(): Promise<'question' | 'results'> {
  const start = Date.now();
  while (Date.now() - start < TIMEOUT.NAVIGATION) {
    if (await elementExists(Sel.resultIconPassed)) return 'results';
    if (await elementExists(Sel.resultIconFailed)) return 'results';
    const optA = await $(Sel.answerOptionA);
    if (await optA.isExisting() && await optA.isEnabled()) return 'question';
    await new Promise(r => setTimeout(r, 150));
  }
  throw new Error('Neither new question nor results appeared after Next');
}

// ─────────────────────────────────────────────────
// Deterministic answer helpers (fixture-based)
// ─────────────────────────────────────────────────

/**
 * Answer a single question using fixture data.
 * Handles single-select, boolean (tap correct option),
 * and multi-select (tap each correct index, then confirm).
 */
export async function answerQuestionFromFixture(q: QuestionFixture) {
  if (q.type === 'multiple' && q.correctIndices) {
    // Multi-select: tap each correct option, then confirm
    for (const idx of q.correctIndices) {
      const sel = Sel.answerOption(indexToLetter(idx));
      await waitForDisplayed(sel);
      await (await $(sel)).click();
      // Brief wait for toggle animation
      await new Promise(r => setTimeout(r, 200));
    }
    // Confirm button should now be enabled
    await waitForDisplayed(Sel.confirmButton, TIMEOUT.ANIMATION);
    await (await $(Sel.confirmButton)).click();
    await waitForFeedback();
  } else {
    // Single-select or boolean: tap the correct option
    const sel = Sel.answerOption(indexToLetter(q.correctIndex));
    await waitForDisplayed(sel);
    await (await $(sel)).click();
    await waitForFeedback();
  }
}

/**
 * Answer a question with the WRONG answer using fixture data.
 */
export async function answerQuestionWrong(q: QuestionFixture) {
  // Find the first wrong option
  const wrongIdx = q.type === 'multiple' && q.correctIndices
    ? [0, 1, 2, 3].find(i => !q.correctIndices!.includes(i)) ?? 1
    : q.correctIndex === 0 ? 1 : 0;

  if (q.type === 'multiple' && q.correctIndices) {
    // For multi-select: select wrong combination then confirm
    const wrongSet = [wrongIdx];
    // Fill up to required count with more wrong options
    for (let i = 0; i < 4 && wrongSet.length < q.correctIndices.length; i++) {
      if (!q.correctIndices.includes(i) && !wrongSet.includes(i)) wrongSet.push(i);
    }
    // If not enough wrong options, include one correct to get the count but still be wrong
    if (wrongSet.length < q.correctIndices.length) {
      for (let i = 0; i < 4 && wrongSet.length < q.correctIndices.length; i++) {
        if (!wrongSet.includes(i)) wrongSet.push(i);
      }
    }
    for (const idx of wrongSet) {
      const sel = Sel.answerOption(indexToLetter(idx));
      await waitForDisplayed(sel);
      await (await $(sel)).click();
      await new Promise(r => setTimeout(r, 200));
    }
    await waitForDisplayed(Sel.confirmButton, TIMEOUT.ANIMATION);
    await (await $(Sel.confirmButton)).click();
    await waitForFeedback();
  } else {
    const sel = Sel.answerOption(indexToLetter(wrongIdx));
    await waitForDisplayed(sel);
    await (await $(sel)).click();
    await waitForFeedback();
  }
}

/**
 * Answer ALL questions in a concept correctly using fixture data.
 * Taps Next after each question. Returns the count answered.
 */
export async function answerAllFromFixture(fixture: ConceptFixture): Promise<number> {
  for (let i = 0; i < fixture.questions.length; i++) {
    await answerQuestionFromFixture(fixture.questions[i]);

    const nextBtn = await $(Sel.nextButton);
    if (!(await nextBtn.isExisting())) break;
    await nextBtn.click();

    if (i < fixture.questions.length - 1) {
      // More questions — wait for next question to load
      const outcome = await waitForQuestionOrResults();
      if (outcome === 'results') return i + 1;
    } else {
      // Last question — wait for results
      const start = Date.now();
      while (Date.now() - start < TIMEOUT.NAVIGATION) {
        if (await elementExists(Sel.resultIconPassed) || await elementExists(Sel.resultIconFailed)) break;
        await new Promise(r => setTimeout(r, 150));
      }
    }
  }
  return fixture.questions.length;
}

/**
 * Navigate full path: Learn → Section → specific concept → Start Quiz.
 */
export async function navigateToConceptQuiz(conceptId: string) {
  await goToLearn();
  await openFirstUnlockedSection();
  await openConcept(conceptId);
  await startQuiz();
}

/**
 * Complete a concept's quiz and return to the SectionMap.
 * Handles the passed-phase navigation (Next Concept / Back).
 */
export async function completeConceptAndReturn(fixture: ConceptFixture) {
  await answerAllFromFixture(fixture);

  // Wait for passed result
  await waitForDisplayed(Sel.resultIconPassed, TIMEOUT.NAVIGATION);

  // Navigate back — tap "Next Concept" or "Back to Concepts"
  const nextConceptBtn = await $(Sel.byContainsText('Next Concept'));
  if (await nextConceptBtn.isExisting()) {
    await nextConceptBtn.click();
  } else {
    const backBtn = await $(Sel.byContainsText('Back to'));
    if (await backBtn.isExisting()) await backBtn.click();
  }
  // Wait for SectionMap to reload
  await waitForDisplayed(Sel.conceptCard(fixture.conceptId), TIMEOUT.NAVIGATION);
}

// ─────────────────────────────────────────────────
// Verification helpers
// ─────────────────────────────────────────────────

/** Verify a section is locked on the Learn screen. */
export async function verifyLockedSection(slug: string): Promise<boolean> {
  try {
    await scrollToElement(Sel.lockedSectionCard(slug), 3);
    return true;
  } catch { return false; }
}

/** Verify a section is unlocked on the Learn screen. */
export async function verifyUnlockedSection(slug: string): Promise<boolean> {
  try {
    const card = await $(Sel.learnCard(slug));
    if (await card.isDisplayed()) return true;
    await scrollToElement(Sel.learnCard(slug), 3);
    return true;
  } catch { return false; }
}

/** Restart the app session. Progress is lost (in-memory store). */
export async function restartApp() {
  await driver.terminateApp('com.duolife.app');
  await driver.activateApp('com.duolife.app');
  await waitForAppReady();
}

/** Navigate to Account tab and back to verify in-session state retention. */
export async function navigateAwayAndBack(returnTo: 'Home' | 'Learn' | 'Practice' | 'Progress') {
  await navigateToTab('Account');
  await navigateToTab(returnTo);
}
