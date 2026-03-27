/**
 * Smoke Tests — verify the app launches and core navigation works.
 * Fast gate: if smoke fails, nothing else matters.
 *
 * Stateless, deterministic, no fixture dependencies.
 */
import { Sel, SECTION_SLUGS } from '../helpers/selectors';
import {
  resetToFreshState,
  navigateToTab,
  goToLearn,
  openFirstUnlockedSection,
  openConcept,
  startQuiz,
  scrollToElement,
} from '../helpers/actions';

describe('Smoke Tests', () => {
  before(async () => {
    await resetToFreshState();
  });

  it('should launch and display the home screen', async () => {
    await expect(await $(Sel.homeStartButton)).toBeDisplayed();
    await expect(await $(Sel.progressBar)).toBeExisting();
  });

  it('should navigate to Learn tab', async () => {
    await navigateToTab('Learn');
    await expect(await $(Sel.learnCard(SECTION_SLUGS.WHAT_IS_THE_UK))).toBeDisplayed();
  });

  it('should navigate to Practice tab', async () => {
    await navigateToTab('Practice');
    await expect(await $(Sel.practiceScreenHeading)).toBeDisplayed();
  });

  it('should navigate to Progress tab', async () => {
    await navigateToTab('Progress');
    await expect(await $(Sel.progressScreenTitle)).toBeDisplayed();
  });

  it('should navigate to Account tab', async () => {
    await navigateToTab('Account');
    await expect(await $(Sel.accountScreenTitle)).toBeDisplayed();
  });

  it('should navigate back to Home tab', async () => {
    await navigateToTab('Home');
    await expect(await $(Sel.homeStartButton)).toBeDisplayed();
  });

  it('should open a section and show concept cards', async () => {
    await goToLearn();
    await openFirstUnlockedSection();
    await expect(await $(Sel.conceptCard('great-britain'))).toBeDisplayed();
  });

  it('should show Start Quiz button in lesson phase', async () => {
    await goToLearn();
    await openFirstUnlockedSection();
    await openConcept('great-britain');
    await expect(await $(Sel.startQuizButton)).toBeDisplayed();
  });

  it('should start quiz and show answer options with counter', async () => {
    await goToLearn();
    await openFirstUnlockedSection();
    await openConcept('great-britain');
    await startQuiz();

    await expect(await $(Sel.answerOptionA)).toBeDisplayed();
    await expect(await $(Sel.answerOptionB)).toBeDisplayed();

    const counter = await $(Sel.questionCounter);
    await expect(counter).toBeDisplayed();
    const text = await counter.getText();
    expect(text).toMatch(/Question 1 of \d+/);
  });

  it('should show locked sections with unlock messages', async () => {
    await goToLearn();
    const lockedCard = await scrollToElement(
      Sel.lockedSectionCard(SECTION_SLUGS.VALUES_AND_PRINCIPLES), 3
    );
    await expect(lockedCard).toBeDisplayed();

    const unlockMsg = await $(Sel.unlockMessage(SECTION_SLUGS.VALUES_AND_PRINCIPLES));
    await expect(unlockMsg).toBeExisting();
  });
});
