import AsyncStorage from '@react-native-async-storage/async-storage';
import { XP_PER_CONCEPT, XP_PER_EXAM_PASS } from '../constants/gameConfig';

export { XP_PER_CONCEPT } from '../constants/gameConfig';

// ══════════════════════════════════════════════════════════════════════════════
// In-memory state — hydrated from AsyncStorage on app start, persisted on mutation
// ══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEYS = {
  completed: '@duo_completed',
  totalXP: '@duo_xp',
  bestScores: '@duo_best_scores',
  examScores: '@duo_exam_scores',
  streak: '@duo_streak',
  questionsAnswered: '@duo_questions_answered',
} as const;

let completed: Record<string, boolean> = {};
let totalXP = 0;
let questionsAnswered = 0;

// ─── XP ───

export function addXP(amount: number) {
  totalXP += amount;
  persist();
}

export function getXP(): number {
  return totalXP;
}

// ─── Questions answered (actual count, not estimated) ───

export function recordQuestionsAnswered(count: number) {
  questionsAnswered += count;
  persist();
}

export function getTotalQuestionsAnswered(): number {
  return questionsAnswered;
}

// ─── Concept completion ───

export function markConceptComplete(sectionId: number, conceptId: string) {
  const key = `${sectionId}-${conceptId}`;
  if (!completed[key]) {
    completed[key] = true;
    totalXP += XP_PER_CONCEPT;
    recordActivity();
    persist();
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

// ─── Best score per section ───

const bestScores: Record<number, number> = {};

export function setBestScore(sectionId: number, pct: number) {
  if (!bestScores[sectionId] || pct > bestScores[sectionId]) {
    bestScores[sectionId] = pct;
    persist();
  }
}

export function getBestScore(sectionId: number): number {
  return bestScores[sectionId] ?? -1;
}

// ─── Exam score tracking ───

interface ExamScore {
  best: number;
  last: number;
  total: number;
  attempts: number;
  lastAttemptAt: number;
}

const examScores: Record<number, ExamScore> = {};

export function saveExamScore(examId: number, score: number, total: number) {
  const existing = examScores[examId];
  const passed = score >= Math.ceil(total * 0.75);

  if (existing) {
    const wasPassedBefore = existing.best >= Math.ceil(existing.total * 0.75);
    existing.last = score;
    existing.best = Math.max(existing.best, score);
    existing.attempts += 1;
    existing.lastAttemptAt = Date.now();
    // Award XP only on first pass
    if (passed && !wasPassedBefore) {
      totalXP += XP_PER_EXAM_PASS;
    }
  } else {
    examScores[examId] = {
      best: score,
      last: score,
      total,
      attempts: 1,
      lastAttemptAt: Date.now(),
    };
    if (passed) {
      totalXP += XP_PER_EXAM_PASS;
    }
  }
  recordActivity();
  persist();
}

export function getExamScore(examId: number): ExamScore | null {
  return examScores[examId] ?? null;
}

export function getAllExamScores(): Record<number, ExamScore> {
  return examScores;
}

export function getExamStats() {
  const entries = Object.values(examScores);
  const completedCount = entries.length;
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
  return { completed: completedCount, totalAttempts, avgScore, avgTotal, bestScore, avgPct };
}

export function getTotalCompletedConcepts(): number {
  return Object.keys(completed).filter(k => completed[k]).length;
}

export function getMockScoreHistory(): number[] {
  return Object.values(examScores)
    .sort((a, b) => a.lastAttemptAt - b.lastAttemptAt)
    .map(e => e.last);
}

// ─── Streak tracking ───

let streakCount = 0;
let lastActivityDate: string | null = null;

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
  if (lastActivityDate === today) return;

  if (lastActivityDate === yesterdayStr()) {
    streakCount += 1;
  } else if (lastActivityDate === null) {
    streakCount = 1;
  } else {
    streakCount = 1;
  }
  lastActivityDate = today;
  // persist is called by the caller (markConceptComplete / saveExamScore)
}

export function getStreak(): number {
  if (lastActivityDate === null) return 0;
  const today = todayStr();
  if (lastActivityDate === today || lastActivityDate === yesterdayStr()) return streakCount;
  return 0;
}

// ─── Overall progress helpers ───

export function getOverallPct(): number {
  // This is a convenience — screens can also compute this from section data
  return 0; // Screens compute this from section data directly
}

// ══════════════════════════════════════════════════════════════════════════════
// PERSISTENCE — AsyncStorage load / save
// ══════════════════════════════════════════════════════════════════════════════

let _loaded = false;

export async function loadProgress(): Promise<void> {
  if (_loaded) return;
  try {
    const [completedRaw, xpRaw, qaRaw, bsRaw, esRaw, streakRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.completed),
      AsyncStorage.getItem(STORAGE_KEYS.totalXP),
      AsyncStorage.getItem(STORAGE_KEYS.questionsAnswered),
      AsyncStorage.getItem(STORAGE_KEYS.bestScores),
      AsyncStorage.getItem(STORAGE_KEYS.examScores),
      AsyncStorage.getItem(STORAGE_KEYS.streak),
    ]);

    if (completedRaw) Object.assign(completed, JSON.parse(completedRaw));
    if (xpRaw) totalXP = Number(xpRaw) || 0;
    if (qaRaw) questionsAnswered = Number(qaRaw) || 0;
    if (bsRaw) Object.assign(bestScores, JSON.parse(bsRaw));
    if (esRaw) Object.assign(examScores, JSON.parse(esRaw));
    if (streakRaw) {
      const s = JSON.parse(streakRaw);
      streakCount = s.streakCount ?? 0;
      lastActivityDate = s.lastActivityDate ?? null;
    }
  } catch {
    // First run or corrupted data — start fresh
  }
  _loaded = true;
}

export function isLoaded(): boolean {
  return _loaded;
}

let _persistTimer: ReturnType<typeof setTimeout> | null = null;

function persist() {
  // Debounce writes to avoid thrashing storage on rapid mutations
  if (_persistTimer) clearTimeout(_persistTimer);
  _persistTimer = setTimeout(async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.completed, JSON.stringify(completed)),
        AsyncStorage.setItem(STORAGE_KEYS.totalXP, String(totalXP)),
        AsyncStorage.setItem(STORAGE_KEYS.questionsAnswered, String(questionsAnswered)),
        AsyncStorage.setItem(STORAGE_KEYS.bestScores, JSON.stringify(bestScores)),
        AsyncStorage.setItem(STORAGE_KEYS.examScores, JSON.stringify(examScores)),
        AsyncStorage.setItem(STORAGE_KEYS.streak, JSON.stringify({ streakCount, lastActivityDate })),
      ]);
    } catch {
      // Storage write failed — data safe in memory for this session
    }
  }, 300);
}

// ─── Theme persistence (kept here to share the AsyncStorage setup) ───

const THEME_KEY = '@duo_theme';

export async function loadThemePreference(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export async function saveThemePreference(mode: string): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_KEY, mode);
  } catch {}
}
