import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
// Lazy-loaded to avoid parsing 3600+ lines on tab mount
let _mockExamsV2: typeof import('../data/mockExamsV2')['mockExamsV2'] | null = null;
function getMockExams() {
  if (!_mockExamsV2) _mockExamsV2 = require('../data/mockExamsV2').mockExamsV2;
  return _mockExamsV2!;
}
import { useTheme, SHADOW_CARD, SHADOW_CARD_SM, SHADOW_CTA, COLORS, CTA, ANIM } from '../context/ThemeContext';
import { getExamScore, getExamStats } from '../store/progress';
import { EXAM_PASS_RATE, XP_PER_EXAM_PASS, getPassMark } from '../constants/gameConfig';

// ─── Haptic feedback ───
let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch {}
function triggerHaptic() {
  try { Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
}

type Props = {
  navigation: any;
};

function usePressScale() {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  return { scale, onPressIn, onPressOut };
}

export default function PracticeScreen({ navigation }: Props) {
  const allExams = getMockExams();
  const { colors } = useTheme();
  const [, forceUpdate] = useState(0);

  const heroBarAnim = useRef(new Animated.Value(0)).current;
  const ctaBounce = useRef(new Animated.Value(0)).current;
  const ctaPress = usePressScale();

  useFocusEffect(useCallback(() => {
    forceUpdate(n => n + 1);

    const pct = allExams.length > 0 ? getExamStats().completed / allExams.length : 0;
    heroBarAnim.setValue(0);
    const barAnim = Animated.timing(heroBarAnim, {
      toValue: pct,
      duration: 900,
      useNativeDriver: false,
    });
    barAnim.start();

    ctaBounce.setValue(-6);
    const bounceAnim = Animated.spring(ctaBounce, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 10 });
    bounceAnim.start();

    return () => {
      barAnim.stop();
      bounceAnim.stop();
    };
  }, []));

  const stats = getExamStats();
  const completionPct = allExams.length > 0 ? Math.round((stats.completed / allExams.length) * 100) : 0;

  // Find "continue" exam
  const continueExam = (() => {
    let lastFailed: { exam: typeof allExams[0]; score: ReturnType<typeof getExamScore> } | null = null;
    for (const exam of allExams) {
      const s = getExamScore(exam.id);
      if (s && s.last < getPassMark(s.total)) {
        if (!lastFailed || s.lastAttemptAt > lastFailed.score!.lastAttemptAt) {
          lastFailed = { exam, score: s };
        }
      }
    }
    if (lastFailed) return lastFailed;
    for (const exam of allExams) {
      if (!getExamScore(exam.id)) return { exam, score: null };
    }
    return null;
  })();

  function getSequentialLabel(exam: typeof allExams[0]) {
    const idx = allExams.findIndex(e => e.id === exam.id);
    if (idx !== -1) return `Mock Exam ${idx + 1}`;
    return exam.title;
  }

  function getStatusChip(examId: number) {
    const s = getExamScore(examId);
    const isRecommended = continueExam?.exam.id === examId;
    if (!s) {
      if (isRecommended) return { label: 'Current', bg: COLORS.orangeLight, color: COLORS.orangeDark };
      return { label: 'Not started', bg: colors.chipBg, color: colors.mutedText };
    }
    if (s.best >= getPassMark(s.total)) return { label: 'Passed', bg: COLORS.greenLight, color: COLORS.greenDark };
    if (s.last < getPassMark(s.total) && s.attempts > 0) return { label: 'Retry', bg: COLORS.redLight, color: COLORS.redDark };
    return { label: 'In progress', bg: COLORS.blueLight, color: COLORS.blue };
  }

  function renderExamCard(exam: typeof allExams[0], type: 'real' | 'training') {
    const score = getExamScore(exam.id);
    const chip = getStatusChip(exam.id);
    const isReal = type === 'real';
    const label = getSequentialLabel(exam);

    return (
      <TouchableOpacity
        key={exam.id}
        style={[styles.examCard, { backgroundColor: colors.card }, SHADOW_CARD_SM]}
        onPress={() => navigation.navigate('MockExam', { examId: exam.id })}
        activeOpacity={0.85}
      >
        <View style={styles.examCardTop}>
          <View style={[styles.examIcon, { backgroundColor: isReal ? COLORS.orangeLight : COLORS.blueLight }]}>
            <Ionicons name={isReal ? 'document-text-outline' : 'book-outline'} size={18} color={isReal ? COLORS.orange : COLORS.blue} />
          </View>
          <View style={styles.examCardBody}>
            <Text style={[styles.examTitle, { color: colors.text }]}>{label}</Text>
            {score ? (
              <Text style={[styles.examMeta, { color: colors.subtext }]}>
                Best: {score.best}/{score.total} · {score.attempts} {score.attempts === 1 ? 'attempt' : 'attempts'}
              </Text>
            ) : (
              <Text style={[styles.examMeta, { color: colors.mutedText }]}>
                {exam.questions.length} Q · Pass 75% · ~30 min
              </Text>
            )}
          </View>
          <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
            <Text style={[styles.statusChipText, { color: chip.color }]}>{chip.label}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const heroTitle = completionPct === 0
    ? 'Ready to test yourself'
    : completionPct === 100
      ? 'All simulations complete!'
      : `${completionPct}% exam ready`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════ 1. HERO — Blue gradient (same as Home) ═══════ */}
        <LinearGradient
          colors={['#1A44A8', '#2556C8', '#3068D8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroBlock, SHADOW_CARD]}
        >
          <Text style={styles.heroLabel}>Practice mode</Text>
          <Text style={styles.heroHeadline}>{heroTitle}</Text>
          <Text style={styles.heroSubline}>
            {stats.completed}/{allExams.length} simulations · {stats.totalAttempts} attempts
          </Text>

          <View style={styles.heroBarTrack}>
            <Animated.View style={[styles.heroBarFill, {
              width: heroBarAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }]} />
          </View>

          <View style={styles.heroMeta}>
            <View style={styles.heroStatRow}>
              <Text style={styles.heroStatLabel}>Best</Text>
              <Text style={styles.heroStatValue}>
                {stats.completed > 0 ? `${stats.bestScore}/${Math.round(stats.avgTotal)}` : '—'}
              </Text>
            </View>
            <View style={styles.heroStatRow}>
              <Text style={styles.heroStatLabel}>Average</Text>
              <Text style={styles.heroStatValue}>
                {stats.completed > 0 ? `${stats.avgPct}%` : '—'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ═══════ 2. CONTINUE CTA — Same as Home ═══════ */}
        {continueExam && (
          <Animated.View style={{ transform: [{ scale: ctaPress.scale }, { translateY: ctaBounce }] }}>
            <TouchableOpacity
              style={[styles.ctaCard, { backgroundColor: colors.card }, SHADOW_CARD]}
              onPress={() => navigation.navigate('MockExam', { examId: continueExam.exam.id })}
              onPressIn={ctaPress.onPressIn}
              onPressOut={ctaPress.onPressOut}
              activeOpacity={0.9}
            >
              <Text style={[styles.ctaLabel, { color: colors.subtext }]}>
                {continueExam.score ? 'CONTINUE YOUR PRACTICE' : 'CONTINUE YOUR PRACTICE'}
              </Text>
              <Text style={[styles.ctaTitle, { color: colors.text }]}>
                {getSequentialLabel(continueExam.exam)}
              </Text>

              {continueExam.score && (
                <Text style={[styles.ctaContext, { color: colors.subtext }]}>
                  Last score: {continueExam.score.last}/{continueExam.score.total}
                  {continueExam.score.last < getPassMark(continueExam.score.total) ? ' · retry recommended' : ''}
                </Text>
              )}

              <View style={styles.ctaChips}>
                <View style={[styles.chip, { backgroundColor: COLORS.goldLight }]}>
                  <Ionicons name="star" size={11} color={COLORS.gold} style={{ marginRight: 3 }} />
                  <Text style={[styles.chipText, { color: COLORS.gold }]}>+{XP_PER_EXAM_PASS} XP</Text>
                </View>
                <View style={[styles.chip, { backgroundColor: colors.chipBg }]}>
                  <Ionicons name="time-outline" size={11} color={colors.bodyText} style={{ marginRight: 3 }} />
                  <Text style={[styles.chipText, { color: colors.bodyText }]}>~30 min</Text>
                </View>
              </View>

              <View style={[styles.ctaButton, SHADOW_CTA]}>
                <Text style={styles.ctaButtonText}>
                  {continueExam.score ? 'Retake Simulation' : 'Start Simulation'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ═══════ 3. MOTIVATION ROW — Same style as Home streak ═══════ */}
        <LinearGradient
          colors={['#EBF0FF', '#DDE6FF', '#D0DBFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.motivationRow, SHADOW_CARD_SM]}
        >
          <View style={styles.motivationIconWrap}>
            <Ionicons name="trophy" size={16} color={COLORS.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.motivationTitle}>
              {stats.completed > 0
                ? `${stats.completed} simulation${stats.completed > 1 ? 's' : ''} completed`
                : 'Start your first simulation'}
            </Text>
            <Text style={styles.motivationSub}>
              {stats.completed > 0
                ? 'Keep going — consistency improves your score'
                : "You're likely ready after 5–6 attempts"}
            </Text>
          </View>
          <View style={styles.motivationBadge}>
            <Ionicons name="trending-up" size={13} color={COLORS.blue} />
          </View>
        </LinearGradient>

        {/* ═══════ 4. MOCK EXAMS ═══════ */}
        <Text testID="practice-screen-heading" style={[styles.sectionHeading, { color: colors.text }]}>Mock Exams</Text>
        <Text style={[styles.sectionSub, { color: colors.subtext }]}>Practice specific topics at your own pace</Text>
        {allExams.map(exam => renderExamCard(exam, 'training'))}

        {/* ═══════ 6. TIP — Matches Home style ═══════ */}
        <View style={[styles.tipCard, { backgroundColor: colors.card }, SHADOW_CARD_SM]}>
          <View style={styles.tipRow}>
            <View style={[styles.tipIconWrap, { backgroundColor: COLORS.blueLight }]}>
              <Ionicons name="bulb" size={14} color={COLORS.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.tipTitle, { color: colors.text }]}>Exam tip</Text>
              <Text style={[styles.tipText, { color: colors.subtext }]}>
                Read each question carefully. Some are True/False, some ask you to select TWO answers. Aim for 75% to pass.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flex: 1 },
  scrollContainer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24, gap: 10 },

  // ═══════ HERO (gradient — same as Home) ═══════
  heroBlock: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  heroLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginBottom: 1 },
  heroHeadline: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 2 },
  heroSubline: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: 8 },
  heroBarTrack: { height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.18)', marginBottom: 8 },
  heroBarFill: { height: 5, borderRadius: 3, backgroundColor: '#fff' },
  heroMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroStatRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroStatLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  heroStatValue: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // ═══════ CTA CARD (same as Home) ═══════
  ctaCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  ctaLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 },
  ctaTitle: { fontSize: 19, fontWeight: '900', marginBottom: 4 },
  ctaContext: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  ctaChips: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 11, fontWeight: '700' },
  ctaButton: {
    backgroundColor: COLORS.orange,
    borderRadius: CTA.borderRadius,
    height: CTA.height - 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: COLORS.orangeDark,
  },
  ctaButtonText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  // ═══════ MOTIVATION ROW (like Home streak) ═══════
  motivationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 11,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 9,
  },
  motivationIconWrap: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(30, 77, 183, 0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  motivationTitle: { fontSize: 13, fontWeight: '900', color: COLORS.blueDark },
  motivationSub: { fontSize: 10, fontWeight: '600', color: COLORS.blue, marginTop: 1 },
  motivationBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(30, 77, 183, 0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ═══════ SECTION HEADING (same as Home) ═══════
  sectionHeading: { fontSize: 15, fontWeight: '900', letterSpacing: 0.2, marginTop: 2 },
  sectionSub: { fontSize: 11, fontWeight: '500', marginTop: -6 },

  // ═══════ EXAM CARDS (shadow-based, no border) ═══════
  examCard: {
    borderRadius: 14,
    padding: 14,
  },
  examCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  examIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examCardBody: { flex: 1 },
  examTitle: { fontSize: 15, fontWeight: '800' },
  examMeta: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  // Status chip
  statusChip: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  statusChipText: { fontSize: 10, fontWeight: '700' },

  // ═══════ TIP CARD (shadow-based, like Home cards) ═══════
  tipCard: {
    borderRadius: 14,
    padding: 14,
  },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  tipTitle: { fontSize: 13, fontWeight: '800', marginBottom: 3 },
  tipText: { fontSize: 12, lineHeight: 18 },
});
