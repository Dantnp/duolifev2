import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, SectionData } from '../types';
import { sections } from '../data/sections';
import { useTheme } from '../context/ThemeContext';
import {
  getCompletedCount,
  isSectionComplete,
  isConceptComplete,
  getXP,
  getExamStats,
  getTotalCompletedConcepts,
  getMockScoreHistory,
} from '../store/progress';
import { whatIsUKSection } from '../data/whatIsUK';
import { valuesAndPrinciplesSection } from '../data/valuesAndPrinciples';
import { historyOfUKSection } from '../data/historyOfUK';
import { modernSocietySection } from '../data/modernSociety';
import { governmentAndLawSection } from '../data/governmentAndLaw';

const sectionDataMap: Record<number, SectionData> = {
  1: whatIsUKSection,
  2: valuesAndPrinciplesSection,
  3: historyOfUKSection,
  4: modernSocietySection,
  5: governmentAndLawSection,
};

// ─── Level system (shared with HomeScreen) ───
const LEVELS = [
  { name: 'New Arrival', xp: 0, icon: '🌍' },
  { name: 'Visitor', xp: 400, icon: '🧳' },
  { name: 'Resident', xp: 1200, icon: '🏠' },
  { name: 'Community Member', xp: 2400, icon: '👥' },
  { name: 'Local Explorer', xp: 4000, icon: '🗺️' },
  { name: 'History Learner', xp: 6000, icon: '📜' },
  { name: 'Culture Aware', xp: 8200, icon: '🎭' },
  { name: 'UK Insider', xp: 10500, icon: '🏙️' },
  { name: 'Civic Participant', xp: 13000, icon: '🗳️' },
  { name: 'Institution Expert', xp: 15500, icon: '⚖️' },
  { name: 'Exam Ready', xp: 17200, icon: '✅' },
  { name: 'Citizen Master', xp: 18000, icon: '👑' },
];

const STREAK = 12; // placeholder — same as HomeScreen

function getCurrentLevel(xp: number) {
  let level = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) { level = i; break; }
  }
  return level;
}

// ─── Mastery labels ───
function getMasteryLabel(pct: number): { label: string; color: string } {
  if (pct === 0) return { label: 'Not started', color: '#9ca3af' };
  if (pct < 25) return { label: 'Getting started', color: '#f59e0b' };
  if (pct < 50) return { label: 'Building knowledge', color: '#f59e0b' };
  if (pct < 75) return { label: 'Confident', color: '#1a56db' };
  if (pct < 100) return { label: 'Exam ready', color: '#16a34a' };
  return { label: 'Exam ready', color: '#16a34a' };
}

// ─── Pass confidence ───
function getPassConfidence(studyPct: number, mockAvgPct: number): { label: string; color: string } {
  const combined = studyPct * 0.4 + mockAvgPct * 0.6;
  if (combined >= 75) return { label: 'High', color: '#16a34a' };
  if (combined >= 50) return { label: 'Medium', color: '#f59e0b' };
  if (combined >= 25) return { label: 'Low', color: '#ef4444' };
  return { label: 'Not enough data', color: '#9ca3af' };
}

// ─── Helpers ───
function getSectionProgress() {
  return sections.map(sec => {
    const data = sectionDataMap[sec.id];
    if (!data) return { ...sec, pct: 0, completedConcepts: 0, totalConcepts: 0, totalQuestions: 0, practisedQuestions: 0 };
    const conceptIds = data.concepts.map(c => c.id);
    const completedConcepts = getCompletedCount(sec.id, conceptIds);
    const totalConcepts = data.concepts.length;
    const pct = totalConcepts > 0 ? Math.round((completedConcepts / totalConcepts) * 100) : 0;
    const totalQuestions = data.concepts.reduce((sum, c) => sum + c.questions.length, 0);
    const practisedQuestions = data.concepts
      .filter(c => isConceptComplete(sec.id, c.id))
      .reduce((sum, c) => sum + c.questions.length, 0);
    return { ...sec, pct, completedConcepts, totalConcepts, totalQuestions, practisedQuestions };
  });
}

function getOverallStudyPct(): number {
  let total = 0;
  let done = 0;
  for (const sec of sections) {
    const data = sectionDataMap[sec.id];
    if (!data) continue;
    total += data.concepts.length;
    done += getCompletedCount(sec.id, data.concepts.map(c => c.id));
  }
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function findNextAction(): { sectionId: number; conceptIndex: number; section: typeof sections[0]; conceptName: string; remaining: number; estMinutes: number } | null {
  for (let si = 0; si < sections.length; si++) {
    const sec = sections[si];
    const data = sectionDataMap[sec.id];
    if (!data) continue;

    const unlocked = si === 0 || (() => {
      const prev = sections[si - 1];
      const prevData = sectionDataMap[prev.id];
      return prevData ? isSectionComplete(prev.id, prevData.concepts.map(c => c.id)) : false;
    })();
    if (!unlocked) continue;

    for (let ci = 0; ci < data.concepts.length; ci++) {
      const prev = ci === 0 || isConceptComplete(sec.id, data.concepts[ci - 1].id);
      const done = isConceptComplete(sec.id, data.concepts[ci].id);
      if (prev && !done) {
        const remaining = data.concepts.length - getCompletedCount(sec.id, data.concepts.map(c => c.id));
        const estMinutes = Math.max(1, Math.round((remaining * 5 * 20) / 60)); // ~5 questions * 20 sec
        return { sectionId: sec.id, conceptIndex: ci, section: sec, conceptName: data.concepts[ci].name, remaining, estMinutes };
      }
    }
  }
  return null;
}

export default function ProgressScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const [, forceUpdate] = useState(0);

  useFocusEffect(useCallback(() => { forceUpdate(n => n + 1); }, []));

  const XP = getXP();
  const currentLevel = getCurrentLevel(XP);
  const nextLevel = currentLevel < LEVELS.length - 1 ? LEVELS[currentLevel + 1] : null;
  const levelPct = nextLevel
    ? Math.round(((XP - LEVELS[currentLevel].xp) / (nextLevel.xp - LEVELS[currentLevel].xp)) * 100)
    : 100;

  const studyPct = getOverallStudyPct();
  const examStats = getExamStats();
  const mockAvgScore = examStats.completed > 0 ? Math.round(examStats.avgScore) : 0;
  const mockAvgTotal = examStats.completed > 0 ? Math.round(examStats.avgTotal) : 24;
  const mockAvgPct = examStats.completed > 0 ? Math.round((examStats.avgScore / examStats.avgTotal) * 100) : 0;
  const passConfidence = getPassConfidence(studyPct, mockAvgPct);

  const sectionProgress = getSectionProgress();
  const totalConceptsDone = getTotalCompletedConcepts();
  const mockHistory = getMockScoreHistory();

  // Find strongest & weakest sections (that have been started)
  const startedSections = sectionProgress.filter(s => s.pct > 0);
  const strongest = startedSections.length > 0
    ? startedSections.reduce((a, b) => a.pct >= b.pct ? a : b)
    : null;
  const weakest = startedSections.length > 1
    ? startedSections.reduce((a, b) => a.pct <= b.pct ? a : b)
    : startedSections.length === 1 ? startedSections[0] : null;

  // Readiness message
  const readinessMessage = studyPct === 0
    ? 'Start learning to build your readiness'
    : studyPct < 50
      ? weakest ? `Focus on ${weakest.title} to improve your confidence` : 'Keep going — you\'re building momentum'
      : studyPct < 80
        ? weakest ? `You're close to test-ready. Focus on ${weakest.title} to improve pass confidence.` : 'You\'re making great progress'
        : 'You\'re nearly exam ready. Keep practising!';

  const nextAction = findNextAction();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
      {/* ===== HEADER ===== */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Progress</Text>
        <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>See how close you are to passing</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════════════════════════════════════
            1. HERO JOURNEY CARD
        ═══════════════════════════════════════════ */}
        <View style={[styles.heroCard, { backgroundColor: colors.card }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeIcon}>{LEVELS[currentLevel].icon}</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={[styles.heroRank, { color: '#1a56db' }]}>{LEVELS[currentLevel].name}</Text>
              <Text style={[styles.heroCompletePct, { color: colors.text }]}>
                {studyPct}% complete
              </Text>
            </View>
            {/* Circular-ish progress indicator */}
            <View style={styles.heroRingWrap}>
              <View style={[styles.heroRingBg, { borderColor: colors.border }]}>
                <Text style={[styles.heroRingText, { color: studyPct >= 75 ? '#16a34a' : '#1a56db' }]}>
                  {studyPct}%
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.heroMessage, { color: colors.bodyText }]}>
            {studyPct === 0
              ? 'Start your journey to become a UK citizen'
              : studyPct === 100
                ? 'You\'ve completed all the study material!'
                : `You're ${studyPct}% ready for the Life in the UK Test`}
          </Text>

          {nextLevel && (
            <View style={styles.heroLevelProgress}>
              <View style={[styles.heroBar, { backgroundColor: colors.border }]}>
                <View style={[styles.heroBarFill, { width: `${Math.max(levelPct, levelPct > 0 ? 3 : 0)}%` }]} />
              </View>
              <Text style={[styles.heroNextText, { color: colors.subtext }]}>
                {nextLevel.icon} {LEVELS[currentLevel + 1].xp - XP} XP to unlock {nextLevel.name}
              </Text>
            </View>
          )}
        </View>

        {/* ═══════════════════════════════════════════
            2. EXAM READINESS CARD
        ═══════════════════════════════════════════ */}
        <View style={[styles.readinessCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Exam Readiness</Text>

          <View style={styles.readinessGrid}>
            <View style={styles.readinessItem}>
              <Text style={[styles.readinessValue, { color: '#1a56db' }]}>{studyPct}%</Text>
              <Text style={[styles.readinessLabel, { color: colors.subtext }]}>Study completion</Text>
            </View>
            <View style={[styles.readinessDivider, { backgroundColor: colors.border }]} />
            <View style={styles.readinessItem}>
              <Text style={[styles.readinessValue, { color: '#1a56db' }]}>
                {examStats.completed > 0 ? `${mockAvgScore}/${mockAvgTotal}` : '—'}
              </Text>
              <Text style={[styles.readinessLabel, { color: colors.subtext }]}>Mock average</Text>
            </View>
            <View style={[styles.readinessDivider, { backgroundColor: colors.border }]} />
            <View style={styles.readinessItem}>
              <Text style={[styles.readinessValue, { color: passConfidence.color }]}>
                {passConfidence.label}
              </Text>
              <Text style={[styles.readinessLabel, { color: colors.subtext }]}>Pass confidence</Text>
            </View>
          </View>

          <View style={[styles.readinessMessageBox, { backgroundColor: colors.chipBg }]}>
            <Text style={[styles.readinessMessageText, { color: colors.bodyText }]}>
              {readinessMessage}
            </Text>
          </View>
        </View>

        {/* ═══════════════════════════════════════════
            3. QUICK STATS ROW
        ═══════════════════════════════════════════ */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{STREAK}</Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>Day streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={styles.statEmoji}>📝</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {sectionProgress.reduce((sum, s) => sum + s.practisedQuestions, 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>Questions</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={styles.statEmoji}>💡</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{totalConceptsDone}</Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>Concepts</Text>
          </View>
        </View>

        {/* ═══════════════════════════════════════════
            4. SECTION PROGRESS LIST
        ═══════════════════════════════════════════ */}
        <View style={[styles.sectionsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Section Progress</Text>

          {sectionProgress.map((sec, idx) => {
            const mastery = getMasteryLabel(sec.pct);
            return (
              <TouchableOpacity
                key={sec.id}
                style={[
                  styles.sectionRow,
                  idx < sectionProgress.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
                onPress={() => navigation.navigate('SectionMap', { sectionId: sec.id })}
                activeOpacity={0.7}
              >
                <View style={[styles.sectionIcon, { backgroundColor: sec.color + '18' }]}>
                  <Text style={styles.sectionEmoji}>{sec.emoji}</Text>
                </View>
                <View style={styles.sectionInfo}>
                  <View style={styles.sectionNameRow}>
                    <Text style={[styles.sectionName, { color: colors.text }]} numberOfLines={1}>
                      {sec.title}
                    </Text>
                    <View style={[styles.masteryBadge, { backgroundColor: mastery.color + '18' }]}>
                      <Text style={[styles.masteryText, { color: mastery.color }]}>{mastery.label}</Text>
                    </View>
                  </View>
                  <View style={styles.sectionBarRow}>
                    <View style={[styles.sectionBar, { backgroundColor: colors.border }]}>
                      <View style={[styles.sectionBarFill, { width: `${Math.max(sec.pct, sec.pct > 0 ? 3 : 0)}%`, backgroundColor: sec.color }]} />
                    </View>
                    <Text style={[styles.sectionPct, { color: sec.color }]}>{sec.pct}%</Text>
                  </View>
                  <Text style={[styles.sectionMeta, { color: colors.subtext }]}>
                    {sec.practisedQuestions} of {sec.totalQuestions} questions practised
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ═══════════════════════════════════════════
            5. STRENGTHS & WEAKNESSES
        ═══════════════════════════════════════════ */}
        <View style={[styles.insightsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Insights</Text>

          <View style={styles.insightsList}>
            {strongest && (
              <View style={styles.insightRow}>
                <View style={[styles.insightDot, { backgroundColor: '#16a34a' }]} />
                <Text style={[styles.insightLabel, { color: colors.subtext }]}>Strongest</Text>
                <Text style={[styles.insightValue, { color: colors.text }]}>{strongest.emoji} {strongest.title}</Text>
              </View>
            )}
            {weakest && weakest.id !== strongest?.id && (
              <View style={styles.insightRow}>
                <View style={[styles.insightDot, { backgroundColor: '#ef4444' }]} />
                <Text style={[styles.insightLabel, { color: colors.subtext }]}>Weakest</Text>
                <Text style={[styles.insightValue, { color: colors.text }]}>{weakest.emoji} {weakest.title}</Text>
              </View>
            )}
            {mockHistory.length >= 2 && (
              <View style={styles.insightRow}>
                <View style={[styles.insightDot, { backgroundColor: '#1a56db' }]} />
                <Text style={[styles.insightLabel, { color: colors.subtext }]}>Mock scores</Text>
                <Text style={[styles.insightValue, { color: colors.text }]}>
                  {mockHistory.slice(-3).join(' → ')}
                </Text>
              </View>
            )}
            {examStats.completed > 0 && (
              <View style={styles.insightRow}>
                <View style={[styles.insightDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={[styles.insightLabel, { color: colors.subtext }]}>Exams taken</Text>
                <Text style={[styles.insightValue, { color: colors.text }]}>{examStats.totalAttempts} attempts</Text>
              </View>
            )}
          </View>

          {/* Empty state */}
          {!strongest && (
            <View style={[styles.insightsEmpty, { backgroundColor: colors.chipBg }]}>
              <Text style={[styles.insightsEmptyText, { color: colors.subtext }]}>
                Complete a few sections to see your strengths and weaknesses
              </Text>
            </View>
          )}
        </View>

        {/* ═══════════════════════════════════════════
            6. NEXT BEST ACTION CTA
        ═══════════════════════════════════════════ */}
        {nextAction && (
          <TouchableOpacity
            style={[styles.ctaCard, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('SectionQuiz', { sectionId: nextAction.sectionId, conceptIndex: nextAction.conceptIndex })}
            activeOpacity={0.75}
          >
            <View style={styles.ctaHeader}>
              <Text style={styles.ctaIcon}>🎯</Text>
              <Text style={[styles.ctaLabel, { color: colors.subtext }]}>Recommended next step</Text>
            </View>
            <Text style={[styles.ctaTitle, { color: colors.text }]}>
              {nextAction.section.emoji} {nextAction.conceptName}
            </Text>
            <Text style={[styles.ctaMeta, { color: colors.subtext }]}>
              {nextAction.remaining} concepts remaining · ~{nextAction.estMinutes} min
            </Text>
            <View style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Continue Learning</Text>
            </View>
          </TouchableOpacity>
        )}

        {!nextAction && studyPct === 100 && (
          <TouchableOpacity
            style={[styles.ctaCard, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('MockExam', { examId: 1 })}
            activeOpacity={0.75}
          >
            <View style={styles.ctaHeader}>
              <Text style={styles.ctaIcon}>🏆</Text>
              <Text style={[styles.ctaLabel, { color: colors.subtext }]}>All sections complete</Text>
            </View>
            <Text style={[styles.ctaTitle, { color: colors.text }]}>
              Ready for the real test?
            </Text>
            <Text style={[styles.ctaMeta, { color: colors.subtext }]}>
              Take a full mock exam to test your knowledge
            </Text>
            <View style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Take Mock Exam</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ===== HEADER =====
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 28, fontWeight: '900' },
  headerSubtitle: { fontSize: 14, marginTop: 4, fontWeight: '600' },

  scrollContent: { padding: 16, gap: 16, paddingBottom: 24 },

  // ===== 1. HERO JOURNEY CARD =====
  heroCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 5,
    borderLeftColor: '#1a56db',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1a56db',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1a56db',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  heroBadgeIcon: { fontSize: 26 },
  heroInfo: { flex: 1 },
  heroRank: { fontSize: 16, fontWeight: '900' },
  heroCompletePct: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  heroRingWrap: { alignItems: 'center', justifyContent: 'center' },
  heroRingBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRingText: { fontSize: 16, fontWeight: '900' },
  heroMessage: { fontSize: 14, fontWeight: '600', marginTop: 14, lineHeight: 20 },
  heroLevelProgress: { marginTop: 14 },
  heroBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  heroBarFill: { height: 6, borderRadius: 3, backgroundColor: '#1a56db' },
  heroNextText: { fontSize: 11, fontWeight: '600', marginTop: 6 },

  // ===== 2. EXAM READINESS =====
  readinessCard: {
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  readinessGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  readinessItem: { flex: 1, alignItems: 'center' },
  readinessValue: { fontSize: 18, fontWeight: '900' },
  readinessLabel: { fontSize: 11, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  readinessDivider: { width: 1, height: 36 },
  readinessMessageBox: {
    marginTop: 14,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  readinessMessageText: { fontSize: 13, fontWeight: '600', lineHeight: 18 },

  // ===== 3. QUICK STATS =====
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statEmoji: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  // ===== 4. SECTION PROGRESS =====
  sectionsCard: {
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: { fontSize: 17, fontWeight: '900', marginBottom: 4 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionEmoji: { fontSize: 20 },
  sectionInfo: { flex: 1 },
  sectionNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  sectionName: { fontSize: 14, fontWeight: '800', flexShrink: 1 },
  masteryBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  masteryText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  sectionBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  sectionBar: { flex: 1, height: 5, borderRadius: 2.5, overflow: 'hidden' },
  sectionBarFill: { height: 5, borderRadius: 2.5 },
  sectionPct: { fontSize: 12, fontWeight: '900', minWidth: 30 },
  sectionMeta: { fontSize: 11, fontWeight: '600', marginTop: 4 },

  // ===== 5. INSIGHTS =====
  insightsCard: {
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  insightsList: { marginTop: 10, gap: 12 },
  insightRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  insightDot: { width: 8, height: 8, borderRadius: 4 },
  insightLabel: { fontSize: 12, fontWeight: '700', width: 80 },
  insightValue: { flex: 1, fontSize: 13, fontWeight: '800' },
  insightsEmpty: { marginTop: 10, borderRadius: 10, padding: 16, alignItems: 'center' },
  insightsEmptyText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },

  // ===== 6. CTA CARD =====
  ctaCard: {
    borderRadius: 20,
    padding: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#ff9600',
    shadowColor: '#ff9600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  ctaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  ctaIcon: { fontSize: 18 },
  ctaLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  ctaTitle: { fontSize: 17, fontWeight: '900', marginBottom: 4 },
  ctaMeta: { fontSize: 12, fontWeight: '600', marginBottom: 14 },
  ctaButton: {
    backgroundColor: '#1a56db',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#1439a8',
  },
  ctaButtonText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.3 },
});
