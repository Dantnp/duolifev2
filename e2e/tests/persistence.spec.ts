/**
 * Persistence Tests — validate that progress state is retained.
 *
 * Uses deterministic fixture data for all answers.
 *
 * IMPORTANT: DuoLife currently uses an in-memory progress store.
 * - In-session tests: PASS (state survives tab navigation).
 * - Cross-session tests: document the gap (state lost on restart).
 *   When AsyncStorage/MMKV lands, flip the marked assertions.
 */
import { Sel, SECTION_SLUGS } from '../helpers/selectors';
import { GREAT_BRITAIN } from '../helpers/fixtures';
import {
  resetToFreshState,
  goToLearn,
  openFirstUnlockedSection,
  openConcept,
  startQuiz,
  answerAllFromFixture,
  navigateAwayAndBack,
  restartApp,
  getElementText,
  waitForDisplayed,
  verifyLockedSection,
} from '../helpers/actions';

describe('Persistence Tests', () => {
  // ─────────────────────────────────────────────────
  // In-session state retention
  // ─────────────────────────────────────────────────
  describe('In-session persistence', () => {
    before(async () => {
      // Complete one concept to create progress state
      await resetToFreshState();
      await goToLearn();
      await openFirstUnlockedSection();
      await openConcept(GREAT_BRITAIN.conceptId);
      await startQuiz();
      await answerAllFromFixture(GREAT_BRITAIN);
      await waitForDisplayed(Sel.resultIconPassed);
    });

    it('should retain progress count after navigating away and back', async () => {
      await navigateAwayAndBack('Learn');

      const countText = await getElementText(
        Sel.progressCount(SECTION_SLUGS.WHAT_IS_THE_UK)
      );
      // Must show 1/N, not 0/N (progress survived tab switch)
      expect(countText).toMatch(/^1\/\d+$/);
    });

    it('should keep section progress bar present after nav round-trip', async () => {
      const progressBar = await $(Sel.sectionProgressBar(SECTION_SLUGS.WHAT_IS_THE_UK));
      await expect(progressBar).toBeExisting();
    });

    it('should show completed concept in SectionMap after nav round-trip', async () => {
      await goToLearn();
      await openFirstUnlockedSection();

      const card = await $(Sel.conceptCard(GREAT_BRITAIN.conceptId));
      await expect(card).toBeExisting();
    });
  });

  // ─────────────────────────────────────────────────
  // Cross-session persistence (app restart)
  //
  // STATUS: IN-MEMORY STORE — progress is lost on restart.
  // When AsyncStorage/MMKV is added, flip marked assertions.
  // ─────────────────────────────────────────────────
  describe('Cross-session persistence (app restart)', () => {
    before(async () => {
      // Complete a concept, then restart
      await resetToFreshState();
      await goToLearn();
      await openFirstUnlockedSection();
      await openConcept(GREAT_BRITAIN.conceptId);
      await startQuiz();
      await answerAllFromFixture(GREAT_BRITAIN);
      await waitForDisplayed(Sel.resultIconPassed);

      await restartApp();
    });

    it('should restart without crashing', async () => {
      await expect(await $(Sel.homeStartButton)).toBeDisplayed();
    });

    it('should detect progress state after restart', async () => {
      await goToLearn();

      const countText = await getElementText(
        Sel.progressCount(SECTION_SLUGS.WHAT_IS_THE_UK)
      );

      // ┌─────────────────────────────────────────────────────────────┐
      // │ PERSISTENCE GAP                                            │
      // │                                                            │
      // │ CURRENT (in-memory): progress resets → count = "0/N"       │
      // │                                                            │
      // │ WHEN ASYNCSTORAGE/MMKV IS ADDED:                          │
      // │   expect(countText).toMatch(/^1\/\d+$/);                   │
      // │   // ^ progress survived restart                           │
      // └─────────────────────────────────────────────────────────────┘
      expect(countText).toMatch(/^0\/\d+$/);
    });

    it('should show section 2 as locked after restart (in-memory reset)', async () => {
      // ┌─────────────────────────────────────────────────────────────┐
      // │ PERSISTENCE GAP                                            │
      // │                                                            │
      // │ WHEN ASYNCSTORAGE/MMKV IS ADDED:                          │
      // │   expect(isLocked).toBe(true);                             │
      // │   // ^ still locked because only 1 of 5 concepts was done │
      // │   // (section unlock requires ALL concepts complete)       │
      // └─────────────────────────────────────────────────────────────┘
      const isLocked = await verifyLockedSection(SECTION_SLUGS.VALUES_AND_PRINCIPLES);
      expect(isLocked).toBe(true);
    });
  });
});
