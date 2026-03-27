/**
 * Progression Tests — validate completion states, unlock logic,
 * section gating, and the deterministic golden-path flow.
 *
 * Uses fixture data for all answers — no brute-force.
 */
import { Sel, SECTION_SLUGS, TIMEOUT } from '../helpers/selectors';
import { GREAT_BRITAIN } from '../helpers/fixtures';
import {
  resetToFreshState,
  goToLearn,
  openFirstUnlockedSection,
  openConcept,
  startQuiz,
  answerAllFromFixture,
  answerQuestionFromFixture,
  answerQuestionWrong,
  navigateToConceptQuiz,
  elementExists,
  getElementText,
  waitForDisplayed,
  scrollToElement,
  verifyLockedSection,
  verifyUnlockedSection,
} from '../helpers/actions';

describe('Progression & Completion Tests', () => {
  // ─────────────────────────────────────────────────
  // Section lock enforcement
  // ─────────────────────────────────────────────────
  describe('Section lock enforcement', () => {
    before(async () => {
      await resetToFreshState();
    });

    it('should show sections 2-5 as locked on fresh app', async () => {
      await goToLearn();
      for (const slug of [
        SECTION_SLUGS.VALUES_AND_PRINCIPLES,
        SECTION_SLUGS.HISTORY_OF_THE_UK,
        SECTION_SLUGS.MODERN_SOCIETY,
        SECTION_SLUGS.GOVERNMENT_AND_LAW,
      ]) {
        expect(await verifyLockedSection(slug)).toBe(true);
      }
    });

    it('should show first section as unlocked', async () => {
      expect(await verifyUnlockedSection(SECTION_SLUGS.WHAT_IS_THE_UK)).toBe(true);
    });

    it('locked section should NOT navigate when tapped', async () => {
      await goToLearn();
      const lockedCard = await scrollToElement(
        Sel.lockedSectionCard(SECTION_SLUGS.VALUES_AND_PRINCIPLES), 3
      );
      await lockedCard.click();
      // Still on Learn screen — first section card must be visible
      await expect(await $(Sel.learnCard(SECTION_SLUGS.WHAT_IS_THE_UK))).toBeDisplayed();
    });

    it('unlock message should name the prerequisite section', async () => {
      await goToLearn();
      const msgEl = await scrollToElement(
        Sel.unlockMessage(SECTION_SLUGS.VALUES_AND_PRINCIPLES), 3
      );
      const text = await msgEl.getText();
      expect(text).toContain('What is the UK');
    });
  });

  // ─────────────────────────────────────────────────
  // Failed quiz does not unlock
  // ─────────────────────────────────────────────────
  describe('Failed quiz does not unlock', () => {
    it('should show failed result and retry button when wrong answers given', async () => {
      await resetToFreshState();
      await navigateToConceptQuiz(GREAT_BRITAIN.conceptId);

      // Answer first question wrong (deterministic)
      await answerQuestionWrong(GREAT_BRITAIN.questions[0]);
      await (await $(Sel.nextButton)).click();
      await waitForDisplayed(Sel.answerOptionA, TIMEOUT.NAVIGATION);

      // Answer remaining questions correctly — but one wrong = fail
      for (let i = 1; i < GREAT_BRITAIN.questions.length; i++) {
        await answerQuestionFromFixture(GREAT_BRITAIN.questions[i]);
        const nextBtn = await $(Sel.nextButton);
        if (await nextBtn.isExisting()) await nextBtn.click();
        // Wait for transition
        const start = Date.now();
        while (Date.now() - start < TIMEOUT.NAVIGATION) {
          if (await elementExists(Sel.resultIconFailed) || await elementExists(Sel.resultIconPassed)) break;
          const opt = await $(Sel.answerOptionA);
          if (await opt.isExisting() && await opt.isEnabled()) break;
          await new Promise(r => setTimeout(r, 150));
        }
      }

      // Should be failed (one wrong answer)
      await expect(await $(Sel.resultIconFailed)).toBeDisplayed();
      await expect(await $(Sel.retryButton)).toBeExisting();
      expect(await elementExists(Sel.unlockNextSectionButton)).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────
  // Concept completion
  // ─────────────────────────────────────────────────
  describe('Concept completion', () => {
    it('should show passed result after all correct answers', async () => {
      await resetToFreshState();
      await navigateToConceptQuiz(GREAT_BRITAIN.conceptId);
      await answerAllFromFixture(GREAT_BRITAIN);

      await expect(await $(Sel.resultIconPassed)).toBeDisplayed();
    });

    it('should show unlock label after passing', async () => {
      // Continuing from previous test's passed state
      await expect(await $(Sel.unlockLabel)).toBeExisting();
    });

    it('unlock-next-section-button should NOT appear on first concept', async () => {
      // First concept unlocks the next concept, not the next section
      expect(await elementExists(Sel.unlockNextSectionButton)).toBe(false);
    });

    it('section 2 should still be locked after completing one concept', async () => {
      await goToLearn();
      expect(await verifyLockedSection(SECTION_SLUGS.VALUES_AND_PRINCIPLES)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────
  // Progress value assertions
  // ─────────────────────────────────────────────────
  describe('Progress value changes', () => {
    it('should show 0/N progress count on fresh app', async () => {
      await resetToFreshState();
      await goToLearn();

      const countText = await getElementText(
        Sel.progressCount(SECTION_SLUGS.WHAT_IS_THE_UK)
      );
      expect(countText).toMatch(/^0\/\d+$/);
    });

    it('should show 1/N progress count after completing one concept', async () => {
      // Complete great-britain
      await openFirstUnlockedSection();
      await openConcept(GREAT_BRITAIN.conceptId);
      await startQuiz();
      await answerAllFromFixture(GREAT_BRITAIN);
      await waitForDisplayed(Sel.resultIconPassed, TIMEOUT.NAVIGATION);

      // Go back to Learn
      await goToLearn();

      const countText = await getElementText(
        Sel.progressCount(SECTION_SLUGS.WHAT_IS_THE_UK)
      );
      expect(countText).toMatch(/^1\/\d+$/);
    });

    it('should show updated SectionMap progress after completion', async () => {
      await openFirstUnlockedSection();

      const mapProgress = await getElementText(Sel.sectionMapProgress);
      expect(mapProgress).toMatch(/^1\/\d+ completed$/);
    });
  });

  // ─────────────────────────────────────────────────
  // Golden Path — deterministic end-to-end flow
  // ─────────────────────────────────────────────────
  describe('Golden path: fresh → learn → pass → unlock → verify progress', () => {
    it('should complete full path with known-correct answers', async () => {
      await resetToFreshState();

      // 1. Read initial progress
      await goToLearn();
      const beforeCount = await getElementText(
        Sel.progressCount(SECTION_SLUGS.WHAT_IS_THE_UK)
      );
      expect(beforeCount).toMatch(/^0\/\d+$/);

      // 2. Navigate to first concept
      await openFirstUnlockedSection();
      await openConcept(GREAT_BRITAIN.conceptId);
      await startQuiz();

      // 3. Answer all questions correctly (deterministic)
      const answered = await answerAllFromFixture(GREAT_BRITAIN);
      expect(answered).toBe(GREAT_BRITAIN.questions.length);

      // 4. Verify passed state
      await expect(await $(Sel.resultIconPassed)).toBeDisplayed();

      // 5. Verify unlock label
      const unlockLabel = await $(Sel.unlockLabel);
      await expect(unlockLabel).toBeExisting();
      const unlockText = await unlockLabel.getText();
      expect(unlockText.toLowerCase()).toContain('unlocked');

      // 6. Return to Learn and verify updated progress
      await goToLearn();
      const afterCount = await getElementText(
        Sel.progressCount(SECTION_SLUGS.WHAT_IS_THE_UK)
      );
      expect(afterCount).toMatch(/^1\/\d+$/);

      // 7. Verify second section is still locked (only 1 of 5 concepts done)
      expect(await verifyLockedSection(SECTION_SLUGS.VALUES_AND_PRINCIPLES)).toBe(true);
    });
  });
});
