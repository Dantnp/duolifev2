import { Ionicons } from '@expo/vector-icons';

// ══════════════════════════════════════════════════════════════════════════════
// SINGLE SOURCE OF TRUTH — game configuration
// ══════════════════════════════════════════════════════════════════════════════

// ─── XP Awards ───
export const XP_PER_CONCEPT = 120;
export const XP_PER_EXAM_PASS = 100;

// ─── Pass thresholds ───
/** Fraction of questions that must be correct to pass a concept quiz */
export const QUIZ_PASS_RATE = 0.80;
/** Fraction of questions that must be correct to pass a mock exam (matches real UK test) */
export const EXAM_PASS_RATE = 0.75;

// ─── Prediction unlock thresholds ───
export const UNLOCK_SECTIONS_NEEDED = 1;
export const UNLOCK_QUESTIONS_NEEDED = 20;

// ─── Level system ───
// Max achievable XP: 63 concepts × 120 = 7,560 + 15 exams × 100 = 1,500 → 9,060
// Thresholds scaled so all 12 levels are reachable.
export interface Level {
  name: string;
  xp: number;
  subtitle: string;
  unlock: string;
}

export const LEVELS: Level[] = [
  { name: 'New Arrival',        xp: 0,    subtitle: 'Just getting started on your journey',        unlock: 'Start learning' },
  { name: 'Visitor',            xp: 200,  subtitle: 'Getting to know the basics',                  unlock: 'Complete Section 1' },
  { name: 'Resident',           xp: 600,  subtitle: 'Building a foundation of knowledge',          unlock: 'Unlock after Section 2' },
  { name: 'Community Member',   xp: 1200, subtitle: 'Understanding how people live together',      unlock: 'Master values & principles' },
  { name: 'Local Explorer',     xp: 2000, subtitle: 'Discovering what makes the UK unique',        unlock: 'Explore UK history' },
  { name: 'History Learner',    xp: 3000, subtitle: 'Connecting past to present',                  unlock: 'Dive deeper into history' },
  { name: 'Culture Aware',      xp: 4100, subtitle: 'Appreciating traditions and culture',         unlock: 'Study modern society' },
  { name: 'UK Insider',         xp: 5200, subtitle: 'You really know your stuff',                  unlock: 'Learn about governance' },
  { name: 'Civic Participant',  xp: 6400, subtitle: 'Ready to engage with civic life',             unlock: 'Master government & law' },
  { name: 'Institution Expert', xp: 7400, subtitle: 'Deep understanding of UK institutions',       unlock: 'Complete all sections' },
  { name: 'Exam Ready',         xp: 8200, subtitle: 'Prepared to pass with confidence',            unlock: 'Practice mock exams' },
  { name: 'Citizen Master',     xp: 9000, subtitle: "You've mastered it all",                      unlock: 'Achieve full mastery' },
];

type IoniconsName = keyof typeof Ionicons.glyphMap;

export const LEVEL_ICONS: IoniconsName[] = [
  'globe-outline',              // New Arrival
  'briefcase-outline',          // Visitor
  'home-outline',               // Resident
  'people-outline',             // Community Member
  'compass-outline',            // Local Explorer
  'time-outline',               // History Learner
  'color-palette-outline',      // Culture Aware
  'business-outline',           // UK Insider
  'checkmark-circle-outline',   // Civic Participant
  'shield-checkmark-outline',   // Institution Expert
  'ribbon-outline',             // Exam Ready
  'trophy-outline',             // Citizen Master
];

export function getCurrentLevel(xp: number): number {
  let level = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) { level = i; break; }
  }
  return level;
}

/** Returns the maximum number of wrong answers allowed for a given question count */
export function getAllowedWrong(totalQuestions: number): number {
  return Math.floor(totalQuestions * (1 - QUIZ_PASS_RATE));
}

/** Returns the pass mark (minimum correct) for a given total */
export function getPassMark(total: number, rate: number = EXAM_PASS_RATE): number {
  return Math.ceil(total * rate);
}
