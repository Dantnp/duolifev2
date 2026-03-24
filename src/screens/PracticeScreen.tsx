import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { mockExams } from '../data/mockExams';
import { csvMockExams } from '../data/csvMockExams';
import { useTheme } from '../context/ThemeContext';
import { getExamScore, getExamStats } from '../store/progress';

const PASS_MARK = 18;
const TOTAL = 24;

const realExams = mockExams;       // "Real Test Simulation"
const trainingExams = csvMockExams; // "Training Exams"
const allExams = [...realExams, ...trainingExams];

type Props = {
  navigation: any;
};

export default function PracticeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [, forceUpdate] = useState(0);

  // Re-read scores every time the screen is focused
  useFocusEffect(useCallback(() => { forceUpdate(n => n + 1); }, []));

  const stats = getExamStats();

  // Find "continue" exam: most recently attempted that wasn't passed, or next unattempted
  const continueExam = (() => {
    // First: most recent attempt that wasn't passed
    let lastFailed: { exam: typeof allExams[0]; score: ReturnType<typeof getExamScore> } | null = null;
    for (const exam of allExams) {
      const s = getExamScore(exam.id);
      if (s && s.last < PASS_MARK) {
        if (!lastFailed || s.lastAttemptAt > lastFailed.score!.lastAttemptAt) {
          lastFailed = { exam, score: s };
        }
      }
    }
    if (lastFailed) return lastFailed;

    // Second: first unattempted exam
    for (const exam of allExams) {
      if (!getExamScore(exam.id)) return { exam, score: null };
    }
    return null;
  })();

  function getSequentialLabel(exam: typeof allExams[0]) {
    const realIdx = realExams.findIndex(e => e.id === exam.id);
    if (realIdx !== -1) return `Simulation ${realIdx + 1}`;
    const trainIdx = trainingExams.findIndex(e => e.id === exam.id);
    if (trainIdx !== -1) return `Test ${trainIdx + 1}`;
    return exam.title;
  }

  function getStatusInfo(examId: number) {
    const s = getExamScore(examId);
    if (!s) return { status: 'new' as const, label: 'Not started', color: '#999' };
    if (s.best >= PASS_MARK) return { status: 'passed' as const, label: 'Passed', color: '#16a34a' };
    return { status: 'retry' as const, label: 'Retry recommended', color: '#f59e0b' };
  }

  function renderExamCard(exam: typeof allExams[0], type: 'real' | 'training') {
    const score = getExamScore(exam.id);
    const statusInfo = getStatusInfo(exam.id);
    const isReal = type === 'real';
    const accentColor = isReal ? '#f59e0b' : '#1a56db';
    const accentBg = isReal ? '#fffbeb' : '#eff6ff';
    const label = getSequentialLabel(exam);

    return (
      <TouchableOpacity
        key={exam.id}
        style={[
          styles.examCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.borderCard,
            borderBottomColor: colors.border,
            borderLeftColor: accentColor,
            borderLeftWidth: 4,
          },
        ]}
        onPress={() => navigation.navigate('MockExam', { examId: exam.id })}
        activeOpacity={0.75}
      >
        <View style={styles.examCardTop}>
          <View style={[styles.examIcon, { backgroundColor: accentBg }]}>
            <Text style={styles.examIconText}>{isReal ? '\uD83C\uDFAF' : '\uD83D\uDCD8'}</Text>
          </View>
          <View style={styles.examCardBody}>
            <Text style={[styles.examTitle, { color: colors.text }]}>{label}</Text>
            <Text style={[styles.examDesc, { color: colors.mutedText }]}>{exam.description}</Text>
          </View>
          {statusInfo.status === 'passed' && (
            <View style={styles.passedBadge}>
              <Text style={styles.passedBadgeText}>{'\u2713'}</Text>
            </View>
          )}
          {statusInfo.status === 'new' && (
            <View style={[styles.statusDot, { backgroundColor: '#e0e0e0' }]} />
          )}
        </View>

        {/* Meta row */}
        <View style={styles.examMetaRow}>
          <View style={styles.examMetaChip}>
            <Text style={[styles.examMetaText, { color: colors.subtext }]}>
              {exam.questions.length} Q
            </Text>
          </View>
          <View style={styles.examMetaChip}>
            <Text style={[styles.examMetaText, { color: colors.subtext }]}>
              ~45 min
            </Text>
          </View>
          <View style={styles.examMetaChip}>
            <Text style={[styles.examMetaText, { color: colors.subtext }]}>
              Pass: 75%
            </Text>
          </View>
        </View>

        {/* Score row — only if attempted */}
        {score && (
          <View style={[styles.scoreRow, { backgroundColor: colors.chipBg }]}>
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreLabel, { color: colors.subtext }]}>Best</Text>
              <Text style={[styles.scoreValue, { color: score.best >= PASS_MARK ? '#16a34a' : colors.text }]}>
                {score.best}/{score.total} {score.best >= PASS_MARK ? '\uD83C\uDFC6' : ''}
              </Text>
            </View>
            <View style={[styles.scoreDivider, { backgroundColor: colors.border }]} />
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreLabel, { color: colors.subtext }]}>Last</Text>
              <Text style={[styles.scoreValue, { color: colors.text }]}>
                {score.last}/{score.total}
              </Text>
            </View>
            <View style={[styles.scoreDivider, { backgroundColor: colors.border }]} />
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreLabel, { color: colors.subtext }]}>Tries</Text>
              <Text style={[styles.scoreValue, { color: colors.text }]}>
                {score.attempts}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Practice</Text>
        <Text style={[styles.headerSubtitle, { color: colors.subtext }]}>
          Prepare for your Life in the UK test
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ===== PROGRESS HEADER ===== */}
        <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTarget}>{'\uD83C\uDFAF'}</Text>
            <Text style={[styles.progressTitle, { color: colors.text }]}>Your Progress</Text>
          </View>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={[styles.progressStatNum, { color: '#1a56db' }]}>
                {stats.completed}
              </Text>
              <Text style={[styles.progressStatLabel, { color: colors.subtext }]}>
                / {allExams.length} exams
              </Text>
            </View>
            <View style={[styles.progressDivider, { backgroundColor: colors.border }]} />
            <View style={styles.progressStat}>
              <Text style={[styles.progressStatNum, { color: '#1a56db' }]}>
                {stats.completed > 0 ? `${stats.avgScore.toFixed(1)}` : '—'}
              </Text>
              <Text style={[styles.progressStatLabel, { color: colors.subtext }]}>
                / {Math.round(stats.avgTotal)} avg score
              </Text>
            </View>
            <View style={[styles.progressDivider, { backgroundColor: colors.border }]} />
            <View style={styles.progressStat}>
              <Text style={[styles.progressStatNum, { color: '#1a56db' }]}>
                {stats.totalAttempts}
              </Text>
              <Text style={[styles.progressStatLabel, { color: colors.subtext }]}>
                attempts
              </Text>
            </View>
          </View>
          {/* Progress bar */}
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${allExams.length > 0 ? Math.round((stats.completed / allExams.length) * 100) : 0}%` },
              ]}
            />
          </View>
        </View>

        {/* ===== CONTINUE CARD ===== */}
        {continueExam && (
          <TouchableOpacity
            style={[styles.continueCard, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('MockExam', { examId: continueExam.exam.id })}
            activeOpacity={0.75}
          >
            <View style={styles.continueHeader}>
              <Text style={styles.continueIcon}>{'\uD83D\uDC49'}</Text>
              <Text style={[styles.continueLabel, { color: '#e07800' }]}>
                {continueExam.score ? 'Continue where you left off' : 'Recommended next'}
              </Text>
            </View>
            <Text style={[styles.continueTitle, { color: colors.text }]}>
              {getSequentialLabel(continueExam.exam)}
            </Text>
            {continueExam.score && (
              <Text style={[styles.continueScore, { color: colors.subtext }]}>
                Last score: {continueExam.score.last}/{continueExam.score.total}
                {continueExam.score.last < PASS_MARK ? ' · retry recommended' : ''}
              </Text>
            )}
            <View style={styles.continueBtn}>
              <Text style={styles.continueBtnText}>
                {continueExam.score ? 'RETAKE' : 'START'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ===== REAL TEST SIMULATION SECTION ===== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>{'\uD83C\uDFAF'}</Text>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Real Test Simulation</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.subtext }]}>
              Exam conditions · timed · scored
            </Text>
          </View>
        </View>
        {realExams.map(exam => renderExamCard(exam, 'real'))}

        {/* ===== TRAINING EXAMS SECTION ===== */}
        <View style={[styles.sectionHeader, { marginTop: 8 }]}>
          <Text style={styles.sectionIcon}>{'\uD83E\uDDEA'}</Text>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Training Exams</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.subtext }]}>
              Practice at your own pace · {trainingExams.length} tests available
            </Text>
          </View>
        </View>
        {trainingExams.map(exam => renderExamCard(exam, 'training'))}

        {/* ===== TIP BOX ===== */}
        <View style={[styles.tipBox, { backgroundColor: colors.cardAlt, borderColor: '#bfdbfe' }]}>
          <Text style={[styles.tipTitle, { color: colors.accentText }]}>
            {'\uD83D\uDCA1'} Exam tip
          </Text>
          <Text style={[styles.tipText, { color: colors.bodyText }]}>
            Read each question carefully. Some are True/False, some ask you to select TWO answers.
            Look for the question type badge. Aim for 75% (18/24) to pass.
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 26, fontWeight: '900' },
  headerSubtitle: { fontSize: 13, marginTop: 2, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 40 },

  // ===== PROGRESS CARD =====
  progressCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  progressTarget: { fontSize: 20 },
  progressTitle: { fontSize: 16, fontWeight: '900' },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  progressStat: { flex: 1, alignItems: 'center' },
  progressStatNum: { fontSize: 22, fontWeight: '900' },
  progressStatLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  progressDivider: { width: 1, height: 32 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 6, borderRadius: 3, backgroundColor: '#1a56db' },

  // ===== CONTINUE CARD =====
  continueCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderLeftWidth: 5,
    borderLeftColor: '#ff9600',
    shadowColor: '#ff9600',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  continueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  continueIcon: { fontSize: 16 },
  continueLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  continueTitle: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  continueScore: { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  continueBtn: {
    backgroundColor: '#ff9600',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#d97706',
  },
  continueBtnText: { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },

  // ===== SECTION HEADERS =====
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    marginTop: 14,
    paddingHorizontal: 2,
  },
  sectionIcon: { fontSize: 22 },
  sectionTitle: { fontSize: 16, fontWeight: '900' },
  sectionSubtitle: { fontSize: 12, fontWeight: '600', marginTop: 1 },

  // ===== EXAM CARD =====
  examCard: {
    borderRadius: 18,
    borderWidth: 2,
    borderBottomWidth: 4,
    padding: 16,
    marginBottom: 10,
  },
  examCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  examIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examIconText: { fontSize: 20 },
  examCardBody: { flex: 1 },
  examTitle: { fontSize: 15, fontWeight: '800' },
  examDesc: { fontSize: 12, marginTop: 2, fontWeight: '600' },
  passedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passedBadgeText: { fontSize: 14, fontWeight: '900', color: '#fff' },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Meta chips
  examMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  examMetaChip: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  examMetaText: { fontSize: 11, fontWeight: '700' },

  // Score row
  scoreRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  scoreItem: { flex: 1, alignItems: 'center' },
  scoreLabel: { fontSize: 10, fontWeight: '600' },
  scoreValue: { fontSize: 14, fontWeight: '900', marginTop: 2 },
  scoreDivider: { width: 1, height: 24 },

  // ===== TIP BOX =====
  tipBox: {
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
  },
  tipTitle: { fontSize: 13, fontWeight: '800', marginBottom: 6 },
  tipText: { fontSize: 13, lineHeight: 20 },
});
