import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { sections } from '../data/sections';
import { useTheme, SHADOW_CARD, SHADOW_CARD_SM, SHADOW_CTA, COLORS, CARD, CTA } from '../context/ThemeContext';
import {
  getCompletedCount,
  isSectionComplete,
  isConceptComplete,
  getXP,
  getExamStats,
  getTotalCompletedConcepts,
  getMockScoreHistory,
  getStreak,
} from '../store/progress';
import { sectionDataMap } from '../data/sectionDataMap';
import { LEVELS, LEVEL_ICONS, getCurrentLevel, UNLOCK_SECTIONS_NEEDED, UNLOCK_QUESTIONS_NEEDED } from '../constants/gameConfig';

type IoniconsName = keyof typeof Ionicons.glyphMap;

const SECTION_ICONS: Record<number, IoniconsName> = {
  1: 'globe-outline',
  2: 'shield-checkmark-outline',
  3: 'time-outline',
  4: 'people-outline',
  5: 'business-outline',
};


type StatusInfo = { label: string; color: string; icon: IoniconsName };

function getSectionStatus(pct: number, isLocked: boolean): StatusInfo {
  if (isLocked) return { label: 'Locked', color: '#9ca3af', icon: 'lock-closed' };
  if (pct === 0) return { label: 'Not started', color: '#9ca3af', icon: 'ellipse-outline' };
  if (pct < 25) return { label: 'Started', color: COLORS.orange, icon: 'play-circle-outline' };
  if (pct < 50) return { label: 'In progress', color: COLORS.orange, icon: 'hourglass-outline' };
  if (pct < 75) return { label: 'Needs review', color: COLORS.blue, icon: 'refresh-outline' };
  if (pct < 100) return { label: 'Strong', color: COLORS.green, icon: 'checkmark-circle-outline' };
  return { label: 'Mastered', color: COLORS.green, icon: 'trophy-outline' };
}

function getReadinessScore(studyPct: number, mockAvgPct: number): number {
  return Math.round(studyPct * 0.4 + mockAvgPct * 0.6);
}

function getReadinessStatus(score: number, hasEnoughData: boolean): { label: string; color: string; icon: IoniconsName } {
  if (!hasEnoughData) return { label: 'Unlock your prediction', color: '#9ca3af', icon: 'analytics-outline' };
  if (score < 25) return { label: `You're ${score}% ready to pass`, color: COLORS.orange, icon: 'construct-outline' };
  if (score < 50) return { label: `You're ${score}% ready to pass`, color: COLORS.orange, icon: 'trending-up-outline' };
  if (score < 75) return { label: `You're ${score}% ready to pass`, color: COLORS.blue, icon: 'checkmark-done-outline' };
  return { label: `You're ${score}% ready to pass`, color: COLORS.green, icon: 'shield-checkmark-outline' };
}

function getSectionProgress() {
  return sections.map((sec, idx) => {
    const data = sectionDataMap[sec.id];
    if (!data) return { ...sec, pct: 0, completedConcepts: 0, totalConcepts: 0, totalQuestions: 0, practisedQuestions: 0, isLocked: idx > 0 };
    const conceptIds = data.concepts.map(c => c.id);
    const completedConcepts = getCompletedCount(sec.id, conceptIds);
    const totalConcepts = data.concepts.length;
    const pct = totalConcepts > 0 ? Math.round((completedConcepts / totalConcepts) * 100) : 0;
    const totalQuestions = data.concepts.reduce((sum, c) => sum + c.questions.length, 0);
    const practisedQuestions = data.concepts
      .filter(c => isConceptComplete(sec.id, c.id))
      .reduce((sum, c) => sum + c.questions.length, 0);

    const isLocked = idx > 0 && (() => {
      const prev = sections[idx - 1];
      const prevData = sectionDataMap[prev.id];
      return prevData ? !isSectionComplete(prev.id, prevData.concepts.map(c => c.id)) : true;
    })();

    return { ...sec, pct, completedConcepts, totalConcepts, totalQuestions, practisedQuestions, isLocked };
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

function getCompletedSectionCount(): number {
  let count = 0;
  for (const sec of sections) {
    const data = sectionDataMap[sec.id];
    if (!data) continue;
    if (isSectionComplete(sec.id, data.concepts.map(c => c.id))) count++;
  }
  return count;
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
        const estMinutes = Math.max(1, Math.round((remaining * 5 * 20) / 60));
        return { sectionId: sec.id, conceptIndex: ci, section: sec, conceptName: data.concepts[ci].name, remaining, estMinutes };
      }
    }
  }
  return null;
}

export default function ProgressScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const [tick, forceUpdate] = useState(0);

  useFocusEffect(useCallback(() => { forceUpdate(n => n + 1); }, []));

  const { XP, currentLevel, nextLevel, levelPct, studyPct, examStats, mockAvgScore, mockAvgTotal, mockAvgPct, sectionProgressData, totalConceptsDone, totalQuestionsDone, completedSections, streak } = useMemo(() => {
    const _XP = getXP();
    const _currentLevel = getCurrentLevel(_XP);
    const _nextLevel = _currentLevel < LEVELS.length - 1 ? LEVELS[_currentLevel + 1] : null;
    const _levelPct = _nextLevel
      ? Math.round(((_XP - LEVELS[_currentLevel].xp) / (_nextLevel.xp - LEVELS[_currentLevel].xp)) * 100)
      : 100;
    const _studyPct = getOverallStudyPct();
    const _examStats = getExamStats();
    const _mockAvgScore = _examStats.completed > 0 ? Math.round(_examStats.avgScore) : 0;
    const _mockAvgTotal = _examStats.completed > 0 ? Math.round(_examStats.avgTotal) : 24;
    const _mockAvgPct = _examStats.completed > 0 ? Math.round((_examStats.avgScore / _examStats.avgTotal) * 100) : 0;
    const _sectionProgressData = getSectionProgress();
    const _totalConceptsDone = getTotalCompletedConcepts();
    const _totalQuestionsDone = _sectionProgressData.reduce((sum, s) => sum + s.practisedQuestions, 0);
    const _completedSections = getCompletedSectionCount();
    const _streak = getStreak();
    return { XP: _XP, currentLevel: _currentLevel, nextLevel: _nextLevel, levelPct: _levelPct, studyPct: _studyPct, examStats: _examStats, mockAvgScore: _mockAvgScore, mockAvgTotal: _mockAvgTotal, mockAvgPct: _mockAvgPct, sectionProgressData: _sectionProgressData, totalConceptsDone: _totalConceptsDone, totalQuestionsDone: _totalQuestionsDone, completedSections: _completedSections, streak: _streak };
  }, [tick]);

  // Unlock logic for prediction
  const sectionsToUnlock = Math.max(0, UNLOCK_SECTIONS_NEEDED - completedSections);
  const questionsToUnlock = Math.max(0, UNLOCK_QUESTIONS_NEEDED - totalQuestionsDone);
  const hasEnoughData = sectionsToUnlock === 0 && questionsToUnlock === 0;
  const unlockProgress = hasEnoughData ? 100 : Math.round(
    ((Math.min(completedSections, UNLOCK_SECTIONS_NEEDED) / UNLOCK_SECTIONS_NEEDED) * 50) +
    ((Math.min(totalQuestionsDone, UNLOCK_QUESTIONS_NEEDED) / UNLOCK_QUESTIONS_NEEDED) * 50)
  );

  const readinessScore = getReadinessScore(studyPct, mockAvgPct);
  const readinessStatus = getReadinessStatus(readinessScore, hasEnoughData);

  const startedSections = sectionProgressData.filter(s => s.pct > 0);
  const strongest = startedSections.length > 0
    ? startedSections.reduce((a, b) => a.pct >= b.pct ? a : b)
    : null;

  const nextAction = findNextAction();

  // Sessions needed estimate
  const sessionsToUnlockPrediction = !hasEnoughData
    ? Math.max(1, Math.ceil((UNLOCK_QUESTIONS_NEEDED - totalQuestionsDone) / 8))
    : 0;

  // Dynamic readiness feedback
  const readinessFeedback = !hasEnoughData
    ? (unlockProgress > 0
      ? `~${sessionsToUnlockPrediction} more session${sessionsToUnlockPrediction > 1 ? 's' : ''} to unlock your prediction`
      : 'Answer questions to start building your prediction')
    : readinessScore >= 75
      ? 'Your results suggest you\'re ready — take a mock exam to confirm'
      : readinessScore >= 50
        ? 'Keep studying — you\'re building a strong base'
        : strongest
          ? `Focus on weaker areas to raise your score`
          : 'Complete more sections to improve accuracy';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text testID="progress-screen-title" style={[styles.headerTitle, { color: colors.text }]}>Progress</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════ 1. EXAM READINESS — HERO ══════ */}
        <View style={[styles.readinessCard, { backgroundColor: colors.card }, SHADOW_CARD]}>
          {/* Top: title + score ring */}
          <View style={styles.readinessTop}>
            <View style={styles.readinessMain}>
              <View style={styles.readinessTitleRow}>
                <Ionicons name={readinessStatus.icon} size={18} color={readinessStatus.color} />
                <Text style={[styles.readinessTitle, { color: colors.text }]}>Pass Probability</Text>
              </View>
              <Text style={[styles.readinessStatusLabel, { color: readinessStatus.color }]}>
                {readinessStatus.label}
              </Text>
            </View>
            {/* Score ring — larger, bolder */}
            <View style={[
              styles.scoreRing,
              { borderColor: hasEnoughData ? readinessStatus.color : colors.border },
            ]}>
              {hasEnoughData ? (
                <Text style={[styles.scoreRingValue, { color: readinessStatus.color }]}>
                  {readinessScore}
                  <Text style={styles.scoreRingUnit}>%</Text>
                </Text>
              ) : (
                <Ionicons name="lock-closed" size={18} color={colors.mutedText} />
              )}
            </View>
          </View>

          {/* Unlock progress bar (only when locked) */}
          {!hasEnoughData && (
            <View style={styles.unlockSection}>
              <View style={[styles.unlockBar, { backgroundColor: colors.border }]}>
                <View style={[styles.unlockBarFill, {
                  width: `${Math.max(unlockProgress, unlockProgress > 0 ? 3 : 0)}%`,
                  backgroundColor: COLORS.blue,
                }]} />
              </View>
              <Text style={[styles.unlockHint, { color: colors.subtext }]}>
                {sectionsToUnlock > 0 && questionsToUnlock > 0
                  ? `${sectionsToUnlock} section + ${questionsToUnlock} questions to unlock`
                  : sectionsToUnlock > 0
                    ? `${sectionsToUnlock} more section to unlock`
                    : `${questionsToUnlock} more questions to unlock`}
              </Text>
            </View>
          )}

          {/* Dynamic feedback message */}
          <View style={[styles.feedbackChip, { backgroundColor: hasEnoughData ? readinessStatus.color + '10' : colors.chipBg }]}>
            <Ionicons
              name={hasEnoughData ? 'sparkles' : 'information-circle-outline'}
              size={14}
              color={hasEnoughData ? readinessStatus.color : colors.subtext}
            />
            <Text style={[styles.feedbackText, { color: hasEnoughData ? readinessStatus.color : colors.bodyText }]}>
              {readinessFeedback}
            </Text>
          </View>

          {/* 3 supporting metrics */}
          <View style={[styles.metricsRow, { borderTopColor: colors.border }]}>
            <View style={styles.metricItem}>
              <Ionicons name="school-outline" size={15} color={COLORS.blue} />
              <Text style={[styles.metricValue, { color: colors.text }]}>{studyPct}%</Text>
              <Text style={[styles.metricLabel, { color: colors.subtext }]}>Study</Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
            <View style={styles.metricItem}>
              <Ionicons name="document-text-outline" size={15} color={COLORS.blue} />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {examStats.completed > 0 ? `${mockAvgScore}/${mockAvgTotal}` : '--'}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.subtext }]}>Mock avg</Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
            <View style={styles.metricItem}>
              <Ionicons name="star-outline" size={15} color={COLORS.blue} />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {strongest ? strongest.title.split(' ')[0] : '--'}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.subtext }]}>Strongest</Text>
            </View>
          </View>
        </View>

        {/* ══════ 2. JOURNEY + STATS — combined row ══════ */}
        <View style={styles.journeyStatsRow}>
          {/* Journey badge */}
          <View style={[styles.journeyCard, { backgroundColor: colors.card }, SHADOW_CARD_SM]}>
            <View style={styles.journeyBadge}>
              <Ionicons name={LEVEL_ICONS[currentLevel]} size={18} color="#fff" />
            </View>
            <Text style={[styles.journeyRank, { color: COLORS.blue }]}>Level: {LEVELS[currentLevel].name}</Text>
            <View style={[styles.journeyBar, { backgroundColor: colors.border }]}>
              <View style={[styles.journeyBarFill, { width: `${Math.max(levelPct, levelPct > 0 ? 4 : 0)}%` }]} />
            </View>
            {nextLevel ? (
              <Text style={[styles.journeyXP, { color: colors.mutedText }]}>
                {LEVELS[currentLevel + 1].xp - XP} XP to next
              </Text>
            ) : (
              <Text style={[styles.journeyXP, { color: COLORS.green }]}>Max level</Text>
            )}
            {/* Next level hint */}
            {nextLevel && (
              <View style={styles.nextLevelHint}>
                <Ionicons name={LEVEL_ICONS[currentLevel + 1]} size={11} color={colors.mutedText} />
                <Text style={[styles.nextLevelName, { color: colors.mutedText }]}>{nextLevel.name}</Text>
              </View>
            )}
          </View>

          {/* Stats column */}
          <View style={styles.statsColumn}>
            <View style={[styles.statCard, { backgroundColor: colors.card }, SHADOW_CARD_SM]}>
              <View style={[styles.statIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="flame" size={14} color={COLORS.orange} />
              </View>
              <View style={styles.statTextWrap}>
                <Text style={[styles.statValue, { color: colors.text }]}>{streak}</Text>
                <Text style={[styles.statLabel, { color: colors.subtext }]}>Day streak</Text>
              </View>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }, SHADOW_CARD_SM]}>
              <View style={[styles.statIconWrap, { backgroundColor: COLORS.blueLight }]}>
                <Ionicons name="help-circle" size={14} color={COLORS.blue} />
              </View>
              <View style={styles.statTextWrap}>
                <Text style={[styles.statValue, { color: colors.text }]}>{totalQuestionsDone}</Text>
                <Text style={[styles.statLabel, { color: colors.subtext }]}>Questions</Text>
              </View>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }, SHADOW_CARD_SM]}>
              <View style={[styles.statIconWrap, { backgroundColor: COLORS.greenLight }]}>
                <Ionicons name="bulb" size={14} color={COLORS.greenDark} />
              </View>
              <View style={styles.statTextWrap}>
                <Text style={[styles.statValue, { color: colors.text }]}>{totalConceptsDone}</Text>
                <Text style={[styles.statLabel, { color: colors.subtext }]}>Concepts</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ══════ 3. SECTION PROGRESS ══════ */}
        <View style={[styles.sectionsCard, { backgroundColor: colors.card }, SHADOW_CARD]}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Section Progress</Text>

          {sectionProgressData.map((sec, idx) => {
            const status = getSectionStatus(sec.pct, sec.isLocked);
            const sectionIcon = SECTION_ICONS[sec.id] || 'book-outline';
            const isLocked = sec.isLocked;

            return (
              <TouchableOpacity
                key={sec.id}
                style={[
                  styles.sectionRow,
                  isLocked && styles.sectionRowLocked,
                ]}
                onPress={() => navigation.navigate('SectionMap', { sectionId: sec.id })}
                activeOpacity={0.7}
                disabled={isLocked}
              >
                {/* Left accent stripe per section */}
                <View style={[styles.sectionAccent, { backgroundColor: isLocked ? 'transparent' : sec.color }]} />

                <View style={[
                  styles.sectionIcon,
                  { backgroundColor: isLocked ? colors.chipBg : sec.color + '14' },
                ]}>
                  <Ionicons
                    name={isLocked ? 'lock-closed' : sectionIcon}
                    size={17}
                    color={isLocked ? colors.mutedText : sec.color}
                  />
                </View>
                <View style={styles.sectionInfo}>
                  <View style={styles.sectionTopRow}>
                    <Text
                      style={[styles.sectionName, { color: isLocked ? colors.mutedText : colors.text }]}
                      numberOfLines={1}
                    >
                      {sec.title}
                    </Text>
                    <View style={[styles.statusChip, { backgroundColor: status.color + '14' }]}>
                      <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                      <Text style={[styles.statusChipText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>

                  {!isLocked && (
                    <>
                      <View style={styles.sectionBarRow}>
                        <View style={[styles.sectionBar, { backgroundColor: colors.border }]}>
                          <View style={[styles.sectionBarFill, {
                            width: `${Math.max(sec.pct, sec.pct > 0 ? 2 : 0)}%`,
                            backgroundColor: sec.color,
                          }]} />
                        </View>
                        <Text style={[styles.sectionPct, { color: colors.subtext }]}>{sec.pct}%</Text>
                      </View>
                      <Text style={[styles.sectionMeta, { color: colors.mutedText }]}>
                        {sec.completedConcepts}/{sec.totalConcepts} concepts · {sec.practisedQuestions}/{sec.totalQuestions} questions
                      </Text>
                    </>
                  )}

                  {isLocked && idx > 0 && (
                    <Text style={[styles.sectionLockedHint, { color: colors.mutedText }]}>
                      Complete {sections[idx - 1].title} to unlock
                    </Text>
                  )}
                </View>

                {!isLocked && (
                  <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ══════ 4. NEXT BEST ACTION CTA ══════ */}
        {nextAction && (
          <TouchableOpacity
            style={[styles.ctaCard, { backgroundColor: colors.card }, SHADOW_CARD]}
            onPress={() => navigation.navigate('SectionQuiz', { sectionId: nextAction.sectionId, conceptIndex: nextAction.conceptIndex })}
            activeOpacity={0.75}
          >
            <View style={styles.ctaHeader}>
              <Ionicons name="compass" size={15} color={COLORS.orange} />
              <Text style={[styles.ctaLabel, { color: COLORS.orange }]}>Your next best action</Text>
            </View>
            <Text style={[styles.ctaTitle, { color: colors.text }]}>
              {nextAction.conceptName}
            </Text>
            <Text style={[styles.ctaMeta, { color: colors.subtext }]}>
              {nextAction.remaining} concepts left · ~{nextAction.estMinutes} min to improve readiness
            </Text>
            <View style={[styles.ctaButton, SHADOW_CTA]}>
              <Text style={styles.ctaButtonText}>Continue to Improve Score</Text>
            </View>
          </TouchableOpacity>
        )}

        {!nextAction && studyPct === 100 && (
          <TouchableOpacity
            style={[styles.ctaCard, { backgroundColor: colors.card }, SHADOW_CARD]}
            onPress={() => navigation.navigate('MockExam', { examId: 1 })}
            activeOpacity={0.75}
          >
            <View style={styles.ctaHeader}>
              <Ionicons name="trophy" size={15} color={COLORS.gold} />
              <Text style={[styles.ctaLabel, { color: COLORS.gold }]}>All sections complete</Text>
            </View>
            <Text style={[styles.ctaTitle, { color: colors.text }]}>
              Ready for the real test?
            </Text>
            <Text style={[styles.ctaMeta, { color: colors.subtext }]}>
              Take a full mock exam to test your knowledge
            </Text>
            <View style={[styles.ctaButton, SHADOW_CTA]}>
              <Text style={styles.ctaButtonText}>Take Mock Exam</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 26, fontWeight: '900' },

  scrollContent: { padding: 14, gap: 12, paddingBottom: 16 },

  // ===== 1. EXAM READINESS — HERO =====
  readinessCard: {
    borderRadius: CARD.borderRadius + 2,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.blue,
  },
  readinessTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readinessMain: { flex: 1, marginRight: 12 },
  readinessTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  readinessTitle: { fontSize: 17, fontWeight: '900' },
  readinessStatusLabel: { fontSize: 14, fontWeight: '700', marginTop: 4, marginLeft: 25 },

  scoreRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreRingValue: { fontSize: 17, fontWeight: '900' },
  scoreRingUnit: { fontSize: 11, fontWeight: '700' },

  // Unlock progress
  unlockSection: { marginTop: 12 },
  unlockBar: { height: 5, borderRadius: 3, overflow: 'hidden' },
  unlockBarFill: { height: 5, borderRadius: 3 },
  unlockHint: { fontSize: 11, fontWeight: '600', marginTop: 5 },

  // Feedback chip
  feedbackChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  feedbackText: { fontSize: 12, fontWeight: '600', flex: 1, lineHeight: 16 },

  // Metrics
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metricItem: { flex: 1, alignItems: 'center', gap: 2 },
  metricValue: { fontSize: 14, fontWeight: '800' },
  metricLabel: { fontSize: 10, fontWeight: '600' },
  metricDivider: { width: StyleSheet.hairlineWidth, height: 26 },

  // ===== 2. JOURNEY + STATS =====
  journeyStatsRow: { flexDirection: 'row', gap: 10 },

  journeyCard: {
    flex: 1,
    borderRadius: CARD.borderRadius,
    padding: 12,
    alignItems: 'center',
  },
  journeyBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  journeyRank: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  journeyBar: { height: 5, borderRadius: 3, overflow: 'hidden', marginTop: 8, width: '100%' },
  journeyBarFill: { height: 5, borderRadius: 3, backgroundColor: COLORS.blue },
  journeyXP: { fontSize: 10, fontWeight: '600', marginTop: 4 },
  nextLevelHint: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4, opacity: 0.5 },
  nextLevelName: { fontSize: 9, fontWeight: '600' },

  statsColumn: { flex: 1, gap: 6 },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: CARD.borderRadius - 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  statIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextWrap: { flex: 1 },
  statValue: { fontSize: 15, fontWeight: '900' },
  statLabel: { fontSize: 9, fontWeight: '600' },

  // ===== 3. SECTION PROGRESS =====
  sectionsCard: {
    borderRadius: CARD.borderRadius,
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  sectionHeading: { fontSize: 16, fontWeight: '900', marginBottom: 4, paddingHorizontal: 8 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginHorizontal: 4,
    borderRadius: 10,
  },
  sectionRowLocked: {
    opacity: 0.55,
  },
  sectionAccent: {
    width: 3,
    height: '70%',
    borderRadius: 2,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionInfo: { flex: 1 },
  sectionTopRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  sectionName: { fontSize: 13, fontWeight: '800', flexShrink: 1 },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusChipText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.2 },
  sectionBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  sectionBar: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  sectionBarFill: { height: 4, borderRadius: 2 },
  sectionPct: { fontSize: 11, fontWeight: '700', minWidth: 26, textAlign: 'right' },
  sectionMeta: { fontSize: 10, fontWeight: '600', marginTop: 3 },
  sectionLockedHint: { fontSize: 10, fontWeight: '600', marginTop: 3, fontStyle: 'italic' },

  // ===== 4. CTA CARD =====
  ctaCard: {
    borderRadius: CARD.borderRadius + 2,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.orange,
  },
  ctaHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  ctaLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  ctaTitle: { fontSize: 16, fontWeight: '900', marginBottom: 3 },
  ctaMeta: { fontSize: 11, fontWeight: '600', marginBottom: 12 },
  ctaButton: {
    backgroundColor: COLORS.blue,
    borderRadius: CTA.borderRadius,
    height: CTA.height - 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: COLORS.blueDark,
  },
  ctaButtonText: { color: '#fff', fontSize: CTA.fontSize - 1, fontWeight: '700', letterSpacing: 0.3 },
});
