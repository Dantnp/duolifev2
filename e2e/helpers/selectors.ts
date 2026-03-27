/**
 * Robust selectors for DuoLife app elements.
 *
 * React Native `testID` maps to Android content-description (accessibility ID).
 * Use `$('~testID')` for Appium accessibility-ID selectors — this is more stable
 * than XPath or text-based matching.
 *
 * Naming convention:
 *   - Semantic slugs for known entities: `learn-card-what-is-the-uk`
 *   - Concept IDs from data: `concept-card-great-britain`
 *   - Generic IDs only for truly dynamic content: `answer-option-a`
 */

// ─── Standard timeouts (ms) ───
export const TIMEOUT: Record<string, number> = {
  /** App launch / cold start. */
  APP_READY: 30_000,
  /** Waiting for a screen element after navigation. */
  NAVIGATION: 10_000,
  /** Waiting for feedback animation to complete. */
  ANIMATION: 5_000,
  /** Quick existence check. */
  SHORT: 3_000,
};

// ─── Section slugs (mirrors sections.ts) ───
export const SECTION_SLUGS = {
  WHAT_IS_THE_UK: 'what-is-the-uk',
  VALUES_AND_PRINCIPLES: 'values-and-principles',
  HISTORY_OF_THE_UK: 'history-of-the-uk',
  MODERN_SOCIETY: 'modern-society',
  GOVERNMENT_AND_LAW: 'government-and-law',
} as const;

// Ordered list matching section index
export const SECTION_SLUG_LIST = [
  SECTION_SLUGS.WHAT_IS_THE_UK,
  SECTION_SLUGS.VALUES_AND_PRINCIPLES,
  SECTION_SLUGS.HISTORY_OF_THE_UK,
  SECTION_SLUGS.MODERN_SOCIETY,
  SECTION_SLUGS.GOVERNMENT_AND_LAW,
] as const;

// ─── First section's concept IDs (What is the UK) ───
export const FIRST_SECTION_CONCEPTS = [
  'great-britain',
  'capitals',
  'overseas-territories',
  'uk-geography',
  'uk-currency',
] as const;

export const Sel = {
  // ═══════════════════════════════════════════════
  // Screen markers — one per tab for tab-nav assertions
  // ═══════════════════════════════════════════════
  homeStartButton: '~home-start-button',
  practiceScreenHeading: '~practice-screen-heading',
  progressScreenTitle: '~progress-screen-title',
  accountScreenTitle: '~account-screen-title',

  // ═══════════════════════════════════════════════
  // Home Screen
  // ═══════════════════════════════════════════════
  progressBar: '~progress-bar',

  // ═══════════════════════════════════════════════
  // Learn Screen — semantic section selectors
  // ═══════════════════════════════════════════════
  continueButton: '~continue-button',

  /** Unlocked section card by slug, e.g. `learn-card-what-is-the-uk` */
  learnCard: (slug: string) => `~learn-card-${slug}`,
  /** Locked section card by slug */
  lockedSectionCard: (slug: string) => `~locked-section-card-${slug}`,
  /** Unlock message text by slug */
  unlockMessage: (slug: string) => `~unlock-message-${slug}`,
  /** Per-section progress bar by slug */
  sectionProgressBar: (slug: string) => `~progress-bar-${slug}`,
  /** Per-section progress count text, e.g. "2/5" */
  progressCount: (slug: string) => `~progress-count-${slug}`,

  // ═══════════════════════════════════════════════
  // Section Map Screen — semantic concept selectors
  // ═══════════════════════════════════════════════
  /** Concept card by concept ID, e.g. `concept-card-great-britain` */
  conceptCard: (conceptId: string) => `~concept-card-${conceptId}`,
  /** SectionMap overall progress text, e.g. "2/5 completed" */
  sectionMapProgress: '~section-map-progress',

  // ═══════════════════════════════════════════════
  // Quiz / SectionQuiz / MockExam — shared IDs
  // ═══════════════════════════════════════════════
  startQuizButton: '~start-quiz-button',
  questionCounter: '~question-counter',

  answerOptionA: '~answer-option-a',
  answerOptionB: '~answer-option-b',
  answerOptionC: '~answer-option-c',
  answerOptionD: '~answer-option-d',
  answerOption: (letter: 'a' | 'b' | 'c' | 'd') => `~answer-option-${letter}`,

  confirmButton: '~confirm-button',
  nextButton: '~next-button',

  // ═══════════════════════════════════════════════
  // Feedback state
  // ═══════════════════════════════════════════════
  feedbackCorrect: '~feedback-correct',
  feedbackWrong: '~feedback-wrong',
  feedbackExplanation: '~feedback-explanation',
  feedbackTitle: '~feedback-title',

  // ═══════════════════════════════════════════════
  // Results / Unlock
  // ═══════════════════════════════════════════════
  resultIconPassed: '~result-icon-passed',
  resultIconFailed: '~result-icon-failed',
  retryButton: '~retry-button',
  unlockNextSectionButton: '~unlock-next-section-button',
  unlockLabel: '~unlock-label',
  unlockSectionName: '~unlock-section-name',

  // ═══════════════════════════════════════════════
  // Fallback: text-based selectors (less stable)
  // ═══════════════════════════════════════════════
  byText: (text: string) => `//*[@text="${text}"]`,
  byContainsText: (text: string) => `//*[contains(@text, "${text}")]`,
} as const;
