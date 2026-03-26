// Simple in-memory progress store
// Key: `${sectionId}-${conceptId}` → true if completed

const completed: Record<string, boolean> = {};
let totalXP = 0;

export const XP_PER_CONCEPT = 120;

export function addXP(amount: number) {
  totalXP += amount;
}

export function getXP(): number {
  return totalXP;
}

export function markConceptComplete(sectionId: number, conceptId: string) {
  const key = `${sectionId}-${conceptId}`;
  if (!completed[key]) {
    completed[key] = true;
    addXP(XP_PER_CONCEPT);
    recordActivity();
  }
}

export function isConceptComplete(sectionId: number, conceptId: string): boolean {
  return !!completed[`${sectionId}-${conceptId}`];
}

export function getCompletedCount(sectionId: number, conceptIds: string[]): number {
  return conceptIds.filter(id => isConceptComplete(sectionId, id)).length;
}

export function isSectionComplete(sectionId: number, conceptIds: string[]): boolean {
  return conceptIds.length > 0 && conceptIds.every(id => isConceptComplete(sectionId, id));
}

// Best score per section (percentage 0-100), -1 if never attempted
const bestScores: Record<number, number> = {};

export function setBestScore(sectionId: number, pct: number) {
  if (!bestScores[sectionId] || pct > bestScores[sectionId]) {
    bestScores[sectionId] = pct;
  }
}

export function getBestScore(sectionId: number): number {
  return bestScores[sectionId] ?? -1;
}

// ─── Exam score tracking ───
interface ExamScore {
  best: number;       // best raw score (e.g. 20 out of 24)
  last: number;       // most recent raw score
  total: number;      // total questions in exam
  attempts: number;   // number of attempts
  lastAttemptAt: number; // timestamp of last attempt
}

const examScores: Record<number, ExamScore> = {};

export function saveExamScore(examId: number, score: number, total: number) {
  const existing = examScores[examId];
  if (existing) {
    existing.last = score;
    existing.best = Math.max(existing.best, score);
    existing.attempts += 1;
    existing.lastAttemptAt = Date.now();
  } else {
    examScores[examId] = {
      best: score,
      last: score,
      total,
      attempts: 1,
      lastAttemptAt: Date.now(),
    };
  }
  recordActivity();
}

export function getExamScore(examId: number): ExamScore | null {
  return examScores[examId] ?? null;
}

export function getAllExamScores(): Record<number, ExamScore> {
  return examScores;
}

export function getExamStats() {
  const entries = Object.values(examScores);
  const completed = entries.length;
  const totalAttempts = entries.reduce((sum, e) => sum + e.attempts, 0);
  const avgScore = entries.length > 0
    ? entries.reduce((sum, e) => sum + e.best, 0) / entries.length
    : 0;
  const avgTotal = entries.length > 0
    ? entries.reduce((sum, e) => sum + e.total, 0) / entries.length
    : 24;
  const bestScore = entries.length > 0
    ? Math.max(...entries.map(e => e.best))
    : 0;
  const avgPct = entries.length > 0
    ? Math.round(entries.reduce((sum, e) => sum + (e.best / e.total) * 100, 0) / entries.length)
    : 0;
  return { completed, totalAttempts, avgScore, avgTotal, bestScore, avgPct };
}

export function getTotalCompletedConcepts(): number {
  return Object.keys(completed).filter(k => completed[k]).length;
}

export function getTotalQuestionsAnswered(): number {
  // Each completed concept means all its questions were answered correctly
  return getTotalCompletedConcepts() * 5; // approximate avg questions per concept
}

export function getMockScoreHistory(): number[] {
  return Object.values(examScores)
    .sort((a, b) => a.lastAttemptAt - b.lastAttemptAt)
    .map(e => e.last);
}

// ─── Streak tracking ───
// Tracks consecutive days the user completed at least one activity.
// An "activity" = completing a concept or finishing a mock exam.

let streakCount = 0;
let lastActivityDate: string | null = null; // 'YYYY-MM-DD'

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function recordActivity() {
  const today = todayStr();
  if (lastActivityDate === today) return; // already recorded today

  if (lastActivityDate === yesterdayStr()) {
    // consecutive day
    streakCount += 1;
  } else if (lastActivityDate === null) {
    // first ever activity
    streakCount = 1;
  } else {
    // streak broken — reset to 1
    streakCount = 1;
  }
  lastActivityDate = today;
}

export function getStreak(): number {
  // If the user hasn't done anything today or yesterday, streak is broken
  if (lastActivityDate === null) return 0;
  const today = todayStr();
  if (lastActivityDate === today || lastActivityDate === yesterdayStr()) return streakCount;
  return 0; // streak expired
}
