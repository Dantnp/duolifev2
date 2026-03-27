/**
 * Quiz Feedback Tests — validate answer feedback, state transitions,
 * and negative guardrails using deterministic fixture data.
 *
 * Every test is fully independent: resets state and navigates fresh.
 */
import { Sel, TIMEOUT } from '../helpers/selectors';
import { GREAT_BRITAIN } from '../helpers/fixtures';
import {
  resetToFreshState,
  navigateToConceptQuiz,
  answerQuestionFromFixture,
  answerQuestionWrong,
  elementExists,
  elementIsEnabled,
  getElementText,
  waitForDisplayed,
} from '../helpers/actions';

const CONCEPT = GREAT_BRITAIN;
const Q0 = CONCEPT.questions[0]; // first question (multi-select)
const Q1 = CONCEPT.questions[1]; // second question (boolean)

describe('Quiz Feedback & State Assertions', () => {
  // ─────────────────────────────────────────────────
  // Pre-answer state
  // ─────────────────────────────────────────────────
  describe('Pre-answer state', () => {
    it('should NOT show next/feedback before answering', async () => {
      await resetToFreshState();
      await navigateToConceptQuiz(CONCEPT.conceptId);

      expect(await elementExists(Sel.nextButton)).toBe(false);
      expect(await elementExists(Sel.feedbackCorrect)).toBe(false);
      expect(await elementExists(Sel.feedbackWrong)).toBe(false);
    });

    it('should show all answer options as enabled', async () => {
      await resetToFreshState();
      await navigateToConceptQuiz(CONCEPT.conceptId);

      expect(await elementIsEnabled(Sel.answerOptionA)).toBe(true);
      expect(await elementIsEnabled(Sel.answerOptionB)).toBe(true);
    });

    it('should NOT show result icons during active quiz', async () => {
      await resetToFreshState();
      await navigateToConceptQuiz(CONCEPT.conceptId);

      expect(await elementExists(Sel.resultIconPassed)).toBe(false);
      expect(await elementExists(Sel.resultIconFailed)).toBe(false);
      expect(await elementExists(Sel.unlockNextSectionButton)).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────
  // Correct answer feedback (deterministic)
  // ─────────────────────────────────────────────────
  describe('Correct answer feedback', () => {
    it('should show feedback-correct after answering correctly', async () => {
      await resetToFreshState();
      await navigateToConceptQuiz(CONCEPT.conceptId);

      await answerQuestionFromFixture(Q0);

      expect(await elementExists(Sel.feedbackCorrect)).toBe(true);
      expect(await elementExists(Sel.feedbackWrong)).toBe(false);
    });

    it('should show Next button after correct answer', async () => {
      await resetToFreshState();
      await navigateToConceptQuiz(CONCEPT.conceptId);
      await answerQuestionFromFixture(Q0);

      const nextBtn = await waitForDisplayed(Sel.nextButton, TIMEOUT.ANIMATION);
      await expect(nextBtn).toBeDisplayed();
    });

    it('should show explanation text when question has one', async () => {
      await resetToFreshState();
      await navigateToConceptQuiz(CONCEPT.conceptId);
      await answerQuestionFromFixture(Q0);

      const explanation = await $(Sel.feedbackExplanation);
      if (await explanation.isExisting()) {
        const text = await explanation.getText();
        expect(text.length).toBeGreaterThan(0);
      }
      // Questions without explanations are valid — no failure needed
    });
  });

  // ─────────────────────────────────────────────────
  // Wrong answer feedback (deterministic)
  // ─────────────────────────────────────────────────
  describe('Wrong answer feedback', () => {
    it('should show feedback-wrong after answering incorrectly', async () => {
      await resetToFreshState();
      await navigateToConceptQuiz(CONCEPT.conceptId);

      await answerQuestionWrong(Q0);

      expect(await elementExists(Sel.feedbackWrong)).toBe(true);
      expect(await elementExists(Sel.feedbackCorrect)).toBe(false);
    });

    it('should disable answer options after wrong selection', async () => {
      await resetToFreshState();
      await navigateToConceptQuiz(CONCEPT.conceptId);

      // Answer second question (boolean, single-select) wrongly
      // First, answer Q0 correctly and advance
      await answerQuestionFromFixture(Q0);
      await (await $(Sel.nextButton)).click();
      await waitForDisplayed(Sel.answerOptionA, TIMEOUT.NAVIGATION);

      // Now answer Q1 wrong
      await answerQuestionWrong(Q1);

      // All options should now be disabled
      expect(await elementIsEnabled(Sel.answerOptionA)).toBe(false);
      expect(await elementIsEnabled(Sel.answerOptionB)).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────
  // Question counter progression
  // ─────────────────────────────────────────────────
  describe('Question counter progression', () => {
    it('should show "Question 1" initially and "Question 2" after advancing', async () => {
      await resetToFreshState();
      await navigateToConceptQuiz(CONCEPT.conceptId);

      const counter1 = await getElementText(Sel.questionCounter);
      expect(counter1).toMatch(/Question 1 of \d+/);

      // Answer Q0 correctly and advance
      await answerQuestionFromFixture(Q0);
      await (await $(Sel.nextButton)).click();

      // Wait for new question to load
      await waitForDisplayed(Sel.answerOptionA, TIMEOUT.NAVIGATION);

      const counter2 = await getElementText(Sel.questionCounter);
      expect(counter2).toMatch(/Question 2 of \d+/);
    });
  });
});
