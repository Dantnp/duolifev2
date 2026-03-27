import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
// Lazy-loaded to avoid parsing 3600+ lines on screen mount
let _mockExamsV2: typeof import('../data/mockExamsV2')['mockExamsV2'] | null = null;
function getMockExams() {
  if (!_mockExamsV2) _mockExamsV2 = require('../data/mockExamsV2').mockExamsV2;
  return _mockExamsV2!;
}
import {
  useTheme, COLORS, ANSWER, SHADOW_CARD, SHADOW_CARD_SM, SHADOW_FEEDBACK,
  CARD, CTA, SP, PROGRESS, ANIM, btnStyles,
} from '../context/ThemeContext';
import { EXAM_PASS_RATE, XP_PER_EXAM_PASS, getPassMark } from '../constants/gameConfig';
import { saveExamScore, recordQuestionsAnswered } from '../store/progress';

// ─── Haptic feedback (graceful fallback) ───
let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch {}

function triggerHaptic(type: 'light' | 'medium' | 'success' | 'error' = 'light') {
  try {
    if (!Haptics) return;
    if (type === 'success') { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); return; }
    if (type === 'error') { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    Haptics.impactAsync(type === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MockExam'>;
  route: RouteProp<RootStackParamList, 'MockExam'>;
};

export default function MockExamScreen({ navigation, route }: Props) {
  const allExams = getMockExams();
  const exam = allExams.find(e => e.id === route.params.examId);
  const { colors } = useTheme();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSingle, setSelectedSingle] = useState<number | null>(null);
  const [selectedMultiple, setSelectedMultiple] = useState<Set<number>>(new Set());
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [phase, setPhase] = useState<'quiz' | 'results'>('quiz');

  // ─── Animations ───
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressBarAnim = useRef(new Animated.Value(0)).current;
  const feedbackSlide = useRef(new Animated.Value(0)).current;
  const resultFade = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0.9)).current;
  const maxOpts = Math.max(...(exam?.questions?.map(q => q.options.length) ?? [4]));
  const optionScales = useRef(Array.from({ length: maxOpts }, () => new Animated.Value(1))).current;
  const confirmOpacity = useRef(new Animated.Value(0)).current;
  const confirmScale = useRef(new Animated.Value(0.98)).current;

  if (!exam) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.text, fontSize: 16 }}>Exam not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: COLORS.blue, fontSize: 15, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const question = exam.questions[currentIndex];
  const qType = question.type || 'single';
  const score = results.filter(Boolean).length;
  const requiredSelections = qType === 'multiple' ? (question.correctIndices?.length ?? 2) : 1;

  // ─── Animated progress bar ───
  useEffect(() => {
    Animated.timing(progressBarAnim, {
      toValue: (currentIndex + (answered ? 1 : 0)) / exam.questions.length,
      duration: ANIM.progressBar,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [currentIndex, answered]);

  // ─── Reset scales on question change ───
  useEffect(() => {
    optionScales.forEach(s => s.setValue(1));
    confirmOpacity.setValue(0);
    confirmScale.setValue(0.98);
    feedbackSlide.setValue(0);
  }, [currentIndex]);

  // ─── Confirm button fade-in for multi-select ───
  useEffect(() => {
    if (qType === 'multiple' && selectedMultiple.size === requiredSelections && !answered) {
      Animated.parallel([
        Animated.timing(confirmOpacity, { toValue: 1, duration: ANIM.fadeIn, useNativeDriver: true }),
        Animated.spring(confirmScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
      ]).start();
      triggerHaptic('light');
    }
  }, [selectedMultiple.size, answered]);

  // ─── Results phase animation ───
  useEffect(() => {
    if (phase === 'results') {
      resultFade.setValue(0);
      resultScale.setValue(0.9);
      Animated.parallel([
        Animated.timing(resultFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(resultScale, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 6 }),
      ]).start();
    }
  }, [phase]);

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: ANIM.shakeFrame, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: ANIM.shakeFrame, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: ANIM.shakeFrame, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: ANIM.shakeFrame, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: ANIM.shakeFrame, useNativeDriver: true }),
    ]).start();
  }

  function showFeedback() {
    feedbackSlide.setValue(0);
    Animated.spring(feedbackSlide, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 4 }).start();
  }

  function isCorrectIndex(index: number): boolean {
    if (qType === 'multiple' && question.correctIndices) return question.correctIndices.includes(index);
    return index === question.correctIndex;
  }

  function checkAnswer(): boolean {
    if (qType === 'multiple' && question.correctIndices) {
      if (selectedMultiple.size !== question.correctIndices.length) return false;
      return question.correctIndices.every(i => selectedMultiple.has(i));
    }
    return selectedSingle === question.correctIndex;
  }

  function animateOption(index: number) {
    Animated.sequence([
      Animated.timing(optionScales[index], {
        toValue: ANIM.scaleSelect,
        duration: ANIM.tapFeedback,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(optionScales[index], {
        toValue: 1,
        duration: 100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }

  function handleSelectSingle(index: number) {
    if (answered) return;
    animateOption(index);
    triggerHaptic('light');
    setSelectedSingle(index);
    setAnswered(true);
    if (index !== question.correctIndex) {
      shake();
      triggerHaptic('error');
    } else {
      triggerHaptic('success');
    }
    showFeedback();
  }

  function handleToggleMultiple(index: number) {
    if (answered) return;
    animateOption(index);
    triggerHaptic('light');
    setSelectedMultiple(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else if (next.size < requiredSelections) next.add(index);
      return next;
    });
  }

  function handleConfirmMultiple() {
    if (answered || selectedMultiple.size !== requiredSelections) return;
    setAnswered(true);
    if (!checkAnswer()) {
      shake();
      triggerHaptic('error');
    } else {
      triggerHaptic('success');
    }
    showFeedback();
  }

  function handleNext() {
    const correct = checkAnswer();
    const newResults = [...results, correct];
    if (currentIndex + 1 >= exam!.questions.length) {
      setResults(newResults);
      saveExamScore(exam!.id, newResults.filter(Boolean).length, exam!.questions.length);
      recordQuestionsAnswered(exam!.questions.length);
      setPhase('results');
    } else {
      setResults(newResults);
      setCurrentIndex(currentIndex + 1);
      setSelectedSingle(null);
      setSelectedMultiple(new Set());
      setAnswered(false);
    }
  }

  function handleRestart() {
    setCurrentIndex(0); setSelectedSingle(null); setSelectedMultiple(new Set());
    setAnswered(false); setResults([]); setPhase('quiz');
    progressBarAnim.setValue(0);
  }

  function getAnsweredColors(index: number, isSelected: boolean) {
    if (!answered) {
      if (isSelected) return { bg: ANSWER.selected.bg, border: ANSWER.selected.border, bottomBorder: COLORS.blueDark, text: ANSWER.selected.text, shadow: SHADOW_CARD_SM };
      return { bg: colors.card, border: colors.borderCard, bottomBorder: colors.border, text: colors.bodyText, shadow: {} };
    }
    if (isCorrectIndex(index)) return { bg: ANSWER.correct.bg, border: ANSWER.correct.border, bottomBorder: COLORS.greenDark, text: ANSWER.correct.text, shadow: SHADOW_CARD_SM };
    if (isSelected) return { bg: ANSWER.wrong.bg, border: ANSWER.wrong.border, bottomBorder: COLORS.redDark, text: ANSWER.wrong.text, shadow: {} };
    return { bg: colors.card, border: colors.borderCard, bottomBorder: colors.border, text: colors.mutedText, shadow: {} };
  }

  // ═══════════════════════════════════════════════════════════════
  // RESULTS PHASE
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'results') {
    const totalQ = exam.questions.length;
    const passed = score >= getPassMark(totalQ);
    const percentage = Math.round((score / totalQ) * 100);
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
        <Animated.ScrollView
          contentContainerStyle={styles.resultsScroll}
          style={{ opacity: resultFade, transform: [{ scale: resultScale }] }}
        >
          <View style={styles.resultsHeader}>
            <View style={[styles.resultsIconWrap, { backgroundColor: passed ? COLORS.greenLight : COLORS.orangeLight }]}>
              <Ionicons name={passed ? 'checkmark-circle' : 'book-outline'} size={44} color={passed ? COLORS.green : COLORS.orange} />
            </View>
            <Text style={[styles.resultsTitle, { color: colors.text }]}>
              {passed ? 'Well done!' : 'Keep practising'}
            </Text>
            <Text style={[styles.resultsSubtitle, { color: colors.subtext }]}>{exam.title}</Text>
          </View>

          <View style={[styles.scoreCircle, { borderColor: passed ? COLORS.blue : COLORS.red }]}>
            <Text style={[styles.scoreNumber, { color: passed ? COLORS.blue : COLORS.red }]}>{score}/{totalQ}</Text>
            <Text style={[styles.scorePercent, { color: colors.subtext }]}>{percentage}%</Text>
          </View>

          <View style={[styles.passBadge, { backgroundColor: passed ? COLORS.blueLight : COLORS.redLight }]}>
            <Text style={[styles.passBadgeText, { color: passed ? COLORS.blue : COLORS.red }]}>
              {passed ? '✓ PASSED' : '✗ NOT PASSED'}
            </Text>
            <Text style={[styles.passMarkText, { color: colors.subtext }]}>Pass mark: {getPassMark(totalQ)}/{totalQ} ({Math.round(EXAM_PASS_RATE * 100)}%)</Text>
          </View>

          {/* XP reward for passing */}
          {passed && (
            <View style={[styles.xpChip, { backgroundColor: COLORS.goldLight }]}>
              <Ionicons name="star" size={16} color={COLORS.gold} />
              <Text style={[styles.xpChipText, { color: COLORS.gold }]}>+{XP_PER_EXAM_PASS} XP earned</Text>
            </View>
          )}

          <View style={[styles.statsRow, { backgroundColor: colors.chipBg }]}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: COLORS.green }]}>{score}</Text>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>Correct</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: COLORS.red }]}>{totalQ - score}</Text>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>Wrong</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.text }]}>{totalQ}</Text>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>Total</Text>
            </View>
          </View>

          <TouchableOpacity style={[btnStyles.primary, styles.fullWidth, styles.ctaShadow]} onPress={handleRestart}>
            <Text style={btnStyles.primaryText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[btnStyles.secondary, styles.fullWidth, { marginTop: SP.sm }]} onPress={() => navigation.goBack()}>
            <Text style={btnStyles.secondaryText}>Back to Practice</Text>
          </TouchableOpacity>
        </Animated.ScrollView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // QUIZ PHASE
  // ═══════════════════════════════════════════════════════════════
  const isCorrect = checkAnswer();

  function renderBooleanOptions() {
    return (
      <View style={styles.booleanContainer}>
        {question.options.map((option, index) => {
          const isTrue = option === 'True';
          const isSel = selectedSingle === index;
          const c = getAnsweredColors(index, isSel);
          return (
            <Animated.View key={index} style={{ flex: 1, transform: [{ scale: optionScales[index] }] }}>
              <TouchableOpacity
                style={[styles.booleanBtn, { backgroundColor: c.bg, borderColor: c.border, borderBottomColor: c.bottomBorder }, c.shadow]}
                onPress={() => handleSelectSingle(index)}
                activeOpacity={answered ? 1 : 0.7}
              >
                <Text style={[styles.booleanIcon, { color: c.text }]}>{isTrue ? '✓' : '✗'}</Text>
                <Text style={[styles.booleanText, { color: c.text }]}>{option}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  }

  function renderMultipleOptions() {
    return (
      <>
        <View style={styles.multiHint}>
          <Text style={[styles.multiHintText, { color: COLORS.blue }]}>
            Select {requiredSelections} answers ({selectedMultiple.size}/{requiredSelections})
          </Text>
        </View>
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => {
            const isSel = selectedMultiple.has(index);
            const c = getAnsweredColors(index, isSel);
            return (
              <Animated.View key={index} style={{ transform: [{ scale: optionScales[index] }] }}>
                <TouchableOpacity
                  style={[styles.optionBtn, { backgroundColor: c.bg, borderColor: c.border, borderBottomColor: c.bottomBorder }, c.shadow]}
                  onPress={() => handleToggleMultiple(index)}
                  activeOpacity={answered ? 1 : 0.7}
                >
                  <View style={[styles.checkbox, { borderColor: c.border, backgroundColor: isSel ? c.border : 'transparent' }]}>
                    {isSel && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.optionText, { color: c.text }]}>{option}</Text>
                  {answered && isCorrectIndex(index) && <View style={[styles.statusBadge, { backgroundColor: COLORS.green }]}><Ionicons name="checkmark" size={12} color="#fff" /></View>}
                  {answered && isSel && !isCorrectIndex(index) && <View style={[styles.statusBadge, { backgroundColor: COLORS.red + '90' }]}><Ionicons name="close" size={12} color="#fff" /></View>}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </>
    );
  }

  function renderSingleOptions() {
    return (
      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => {
          const isSel = selectedSingle === index;
          const c = getAnsweredColors(index, isSel);
          return (
            <Animated.View key={index} style={{ transform: [{ scale: optionScales[index] }] }}>
              <TouchableOpacity
                testID={`answer-option-${['a', 'b', 'c', 'd'][index]}`}
                style={[styles.optionBtn, { backgroundColor: c.bg, borderColor: c.border, borderBottomColor: c.bottomBorder }, c.shadow]}
                onPress={() => handleSelectSingle(index)}
                activeOpacity={answered ? 1 : 0.7}
              >
                <Text style={[styles.optionLetter, { backgroundColor: colors.inputBg, color: c.text }]}>
                  {String.fromCharCode(65 + index)}
                </Text>
                <Text style={[styles.optionText, { color: c.text }]}>{option}</Text>
                {answered && isCorrectIndex(index) && <View testID={`feedback-correct-${index}`} style={[styles.statusBadge, { backgroundColor: COLORS.green }]}><Ionicons name="checkmark" size={12} color="#fff" /></View>}
                {answered && isSel && !isCorrectIndex(index) && <View testID={`feedback-wrong-${index}`} style={[styles.statusBadge, { backgroundColor: COLORS.red + '90' }]}><Ionicons name="close" size={12} color="#fff" /></View>}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  }

  const showNextBtn = answered;
  const showConfirmBtn = qType === 'multiple' && !answered && selectedMultiple.size === requiredSelections;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
      {/* ─── Header ─── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backArrow} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.backIcon} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{exam.title}</Text>
        <Text testID="question-counter" style={[styles.headerCount, { color: colors.subtext }]}>{currentIndex + 1}/{exam.questions.length}</Text>
      </View>

      {/* ─── Animated progress bar ─── */}
      <View testID="progress-bar" style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.progressFill, {
          width: progressBarAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
        }]} />
      </View>
      <View style={styles.progressMeta}>
        <View style={styles.progressDots}>
          {exam.questions.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                { backgroundColor: i < currentIndex ? (results[i] ? COLORS.green : COLORS.red) : i === currentIndex ? COLORS.blue : colors.borderCard },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.quizScroll} bounces={false}>
        {/* ─── Question card with shake ─── */}
        <Animated.View style={[styles.questionCard, { backgroundColor: colors.card }, SHADOW_CARD, { transform: [{ translateX: shakeAnim }] }]}>
          <View style={styles.questionHeaderRow}>
            <Text style={[styles.questionNumber, { color: COLORS.blue }]}>Question {currentIndex + 1}</Text>
            {qType === 'boolean' && (
              <View style={[styles.typeBadge, { backgroundColor: COLORS.blueLight }]}>
                <Text style={[styles.typeBadgeText, { color: COLORS.blue }]}>TRUE / FALSE</Text>
              </View>
            )}
            {qType === 'multiple' && (
              <View style={[styles.typeBadge, { backgroundColor: COLORS.orangeLight }]}>
                <Text style={[styles.typeBadgeText, { color: COLORS.orangeDark }]}>MULTI-SELECT</Text>
              </View>
            )}
          </View>
          <Text style={[styles.questionText, { color: colors.text }]}>{question.question}</Text>
        </Animated.View>

        {qType === 'boolean' && renderBooleanOptions()}
        {qType === 'multiple' && renderMultipleOptions()}
        {qType === 'single' && renderSingleOptions()}

        {/* ─── Feedback with slide animation ─── */}
        {answered && (
          <Animated.View style={[
            styles.feedbackBox,
            { backgroundColor: isCorrect ? ANSWER.correct.bg : ANSWER.wrong.bg },
            {
              opacity: feedbackSlide,
              transform: [{ translateY: feedbackSlide.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}>
            <View testID={isCorrect ? 'feedback-correct' : 'feedback-wrong'} style={[styles.feedbackIconBg, { backgroundColor: isCorrect ? COLORS.green : COLORS.red + '20' }]}>
              <Ionicons name={isCorrect ? 'checkmark' : 'close'} size={16} color={isCorrect ? '#fff' : COLORS.red} />
            </View>
            <View style={{ flex: 1 }}>
              <Text testID="feedback-title" style={[styles.feedbackTitle, { color: isCorrect ? COLORS.greenDark : COLORS.redDark }]}>
                {isCorrect ? 'Correct!' : 'Not quite right'}
              </Text>
              {question.explanation && (
                <Text testID="feedback-explanation" style={[styles.feedbackExplanation, { color: colors.bodyText }]}>{question.explanation}</Text>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* ─── Confirm button with fade-in ─── */}
      {showConfirmBtn && (
        <Animated.View style={[
          styles.nextContainer, { backgroundColor: colors.card }, SHADOW_FEEDBACK,
          { opacity: confirmOpacity, transform: [{ scale: confirmScale }] },
        ]}>
          <TouchableOpacity
            testID="confirm-button"
            style={[btnStyles.primary, { backgroundColor: COLORS.orange, borderBottomColor: COLORS.orangeDark }]}
            onPress={handleConfirmMultiple}
          >
            <Text style={btnStyles.primaryText}>Confirm Answer</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {showNextBtn && (
        <View style={[styles.nextContainer, { backgroundColor: colors.card }, SHADOW_FEEDBACK]}>
          <TouchableOpacity testID="next-button" style={[btnStyles.primary, styles.ctaShadow]} onPress={handleNext}>
            <Text style={btnStyles.primaryText}>
              {currentIndex + 1 === exam.questions.length ? 'See Results' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SP.md,
    paddingVertical: SP.sm,
    borderBottomWidth: 1,
  },
  backArrow: { padding: 4, marginRight: SP.xs },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600' },
  headerCount: { fontSize: 14, fontWeight: '600' },

  progressTrack: { height: PROGRESS.height },
  progressFill: { height: PROGRESS.height, backgroundColor: COLORS.blue, borderRadius: PROGRESS.borderRadius },
  progressMeta: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 6 },
  progressDots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  progressDot: { width: 8, height: 8, borderRadius: 4 },

  quizScroll: { padding: SP.md, paddingBottom: 100 },
  questionCard: {
    borderRadius: CARD.borderRadius,
    padding: SP.lg,
    marginBottom: SP.md,
  },
  questionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SP.xs,
  },
  questionNumber: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  typeBadge: { paddingHorizontal: SP.xs, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  questionText: { fontSize: 18, fontWeight: '700', lineHeight: 26 },

  optionsContainer: { gap: SP.sm },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: CTA.borderRadius,
    borderWidth: 2,
    padding: SP.md,
    borderBottomWidth: CTA.depthWidth,
  },
  optionLetter: {
    width: 28, height: 28, borderRadius: 14,
    textAlign: 'center', lineHeight: 28,
    fontSize: 13, fontWeight: '700', marginRight: SP.sm,
  },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600' },
  statusBadge: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: SP.xs,
  },

  booleanContainer: { flexDirection: 'row', gap: SP.sm },
  booleanBtn: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: CARD.borderRadius, borderWidth: 2, borderBottomWidth: CTA.depthWidth,
    paddingVertical: SP.xl, gap: SP.xs,
  },
  booleanIcon: { fontSize: 28, fontWeight: '700' },
  booleanText: { fontSize: 18, fontWeight: '600' },

  multiHint: { marginBottom: SP.sm, alignItems: 'center' },
  multiHintText: { fontSize: 12, fontWeight: '600' },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    marginRight: SP.sm,
  },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },

  feedbackBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderRadius: CTA.borderRadius, padding: SP.md,
    marginTop: SP.md, gap: SP.sm,
  },
  feedbackIconBg: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  feedbackTitle: { fontSize: 15, fontWeight: '800' },
  feedbackXpRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  feedbackXpText: { fontSize: 13, fontWeight: '900', color: COLORS.gold },
  feedbackExplanation: { fontSize: 13, lineHeight: 20, marginTop: 4 },

  nextContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: SP.md, borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },

  ctaShadow: {
    shadowColor: COLORS.blueDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },

  // Results
  resultsScroll: { padding: SP.xl, alignItems: 'center', paddingBottom: 40 },
  resultsHeader: { alignItems: 'center', marginBottom: SP.xl },
  resultsIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SP.sm,
  },
  resultsTitle: { fontSize: 28, fontWeight: '900' },
  resultsSubtitle: { fontSize: 14, marginTop: 4, fontWeight: '500' },
  scoreCircle: {
    width: 130, height: 130, borderRadius: 65, borderWidth: 6,
    alignItems: 'center', justifyContent: 'center', marginBottom: SP.lg,
  },
  scoreNumber: { fontSize: 28, fontWeight: '700' },
  scorePercent: { fontSize: 15, fontWeight: '600' },
  passBadge: {
    borderRadius: CTA.borderRadius, paddingVertical: SP.sm, paddingHorizontal: SP.xl,
    alignItems: 'center', marginBottom: SP.md, width: '100%',
  },
  passBadgeText: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  passMarkText: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  xpChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    marginBottom: SP.md,
  },
  xpChipText: { fontSize: 15, fontWeight: '900' },
  statsRow: {
    flexDirection: 'row', borderRadius: CARD.borderRadius, padding: SP.lg,
    width: '100%', marginBottom: SP.xl + 4, alignItems: 'center',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 40 },
  fullWidth: { width: '100%' },
});
