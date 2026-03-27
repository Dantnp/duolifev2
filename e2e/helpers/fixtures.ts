/**
 * Deterministic test data fixtures.
 *
 * These mirror the exact question data in src/data/whatIsUK.ts so that
 * tests know the correct answer for every question without brute-forcing.
 *
 * If question data changes, update these fixtures to match.
 */

export type AnswerType = 'single' | 'multiple' | 'boolean';

export interface QuestionFixture {
  type: AnswerType;
  /** Correct option index (0-based). Used for single/boolean. */
  correctIndex: number;
  /** All correct indices for multi-select questions. */
  correctIndices?: number[];
}

export interface ConceptFixture {
  conceptId: string;
  sectionSlug: string;
  /** Total concepts in this concept's parent section. */
  sectionConceptCount: number;
  questions: QuestionFixture[];
}

// ─── Index → letter mapping ───
const LETTERS: Array<'a' | 'b' | 'c' | 'd'> = ['a', 'b', 'c', 'd'];

/** Convert a 0-based index to an answer letter. */
export function indexToLetter(index: number): 'a' | 'b' | 'c' | 'd' {
  return LETTERS[index];
}

// ═══════════════════════════════════════════════════
// Section 1: "What is the UK" — concept fixtures
// Source: src/data/whatIsUK.ts
// ═══════════════════════════════════════════════════

export const GREAT_BRITAIN: ConceptFixture = {
  conceptId: 'great-britain',
  sectionSlug: 'what-is-the-uk',
  sectionConceptCount: 5,
  questions: [
    // q1001: "Which of these are part of Great Britain?" — multi-select [0,2,3]
    { type: 'multiple', correctIndex: 0, correctIndices: [0, 2, 3] },
    // q1002: "The UK includes Northern Ireland" — boolean, True (index 0)
    { type: 'boolean', correctIndex: 0 },
    // q1003: "Wales is not part of Great Britain" — boolean, False (index 1)
    { type: 'boolean', correctIndex: 1 },
  ],
};

export const CAPITALS: ConceptFixture = {
  conceptId: 'capitals',
  sectionSlug: 'what-is-the-uk',
  sectionConceptCount: 5,
  questions: [
    // q1004: capital of Wales → Cardiff (index 3)
    { type: 'single', correctIndex: 3 },
    // q1005: capital of Scotland → Edinburgh (index 2)
    { type: 'single', correctIndex: 2 },
    // q1006: capital of NI → Belfast (index 2)
    { type: 'single', correctIndex: 2 },
  ],
};

/**
 * The fixture used for the golden-path test.
 * Uses "capitals" (concept index 1) because it's all single-select,
 * making the deterministic flow straightforward.
 *
 * To reach "capitals", we must first complete "great-britain" (concept index 0).
 */
export const GOLDEN_PATH_CONCEPT = CAPITALS;
export const PREREQUISITE_CONCEPT = GREAT_BRITAIN;

/**
 * The first wrong answer index for a given question.
 * Returns the first option that is NOT the correct one.
 */
export function firstWrongIndex(q: QuestionFixture): number {
  for (let i = 0; i < 4; i++) {
    if (q.type === 'multiple' && q.correctIndices) {
      if (!q.correctIndices.includes(i)) return i;
    } else {
      if (i !== q.correctIndex) return i;
    }
  }
  return 0; // fallback
}
