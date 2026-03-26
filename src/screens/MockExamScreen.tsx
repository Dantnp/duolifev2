import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { mockExams } from '../data/mockExams';
import { csvMockExams } from '../data/csvMockExams';
import {
  useTheme, COLORS, ANSWER, SHADOW_CARD, SHADOW_FEEDBACK,
  CARD, CTA, SP, PROGRESS, btnStyles,
} from '../context/ThemeContext';
import { saveExamScore } from '../store/progress';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MockExam'>;
  route: RouteProp<RootStackParamList, 'MockExam'>;
};

const PASS_MARK = 2;
const TOTAL = 3;
const allExams = [...mockExams, ...csvMockExams].map(e => ({ ...e, questions: e.questions.slice(0, 3) }));

export default function MockExamScreen({ navigation, route }: Props) {
  const exam = allExams.find(e => e.id === route.params.examId);
  const { colors } = useTheme();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSingle, setSelectedSingle] = useState<number | null>(null);
  const [selectedMultiple, setSelectedMultiple] = useState<Set<number>>(new Set());
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [phase, setPhase] = useState<'quiz' | 'results'>('quiz');

  const shakeAnim = useRef(new Animated.Value(0)).current;

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

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
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

  function handleSelectSingle(index: number) {
    if (answered) return;
    setSelectedSingle(index);
    setAnswered(true);
    if (index !== question.correctIndex) shake();
  }

  function handleToggleMultiple(index: number) {
    if (answered) return;
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
    if (!checkAnswer()) shake();
  }

  function handleNext() {
    const correct = checkAnswer();
    const newResults = [...results, correct];
    if (currentIndex + 1 >= exam!.questions.length) {
      setResults(newResults);
      saveExamScore(exam!.id, newResults.filter(Boolean).length, exam!.questions.length);
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
  }

  // ─── Answer option colours (shared logic) ───
  function getAnsweredColors(index: number, isSelected: boolean) {
    if (!answered) {
      if (isSelected) return { bg: ANSWER.selected.bg, border: ANSWER.selected.border, bottomBorder: COLORS.blueDark, text: ANSWER.selected.text };
      return { bg: colors.card, border: colors.borderCard, bottomBorder: colors.border, text: colors.bodyText };
    }
    if (isCorrectIndex(index)) return { bg: ANSWER.correct.bg, border: ANSWER.correct.border, bottomBorder: COLORS.greenDark, text: ANSWER.correct.text };
    if (isSelected) return { bg: ANSWER.wrong.bg, border: ANSWER.wrong.border, bottomBorder: COLORS.redDark, text: ANSWER.wrong.text };
    return { bg: colors.card, border: colors.borderCard, bottomBorder: colors.border, text: colors.mutedText };
  }

  // ─── RESULTS PHASE ───
  if (phase === 'results') {
    const totalQ = exam.questions.length;
    const passed = score >= PASS_MARK;
    const percentage = Math.round((score / totalQ) * 100);
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
        <ScrollView contentContainerStyle={styles.resultsScroll}>
          <View style={styles.resultsHeader}>
            <View style={[styles.resultsIconWrap, { backgroundColor: passed ? COLORS.greenLight : COLORS.orangeLight }]}>
              <Ionicons name={passed ? 'checkmark-circle' : 'book-outline'} size={40} color={passed ? COLORS.green : COLORS.orange} />
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
            <Text style={[styles.passMarkText, { color: colors.subtext }]}>Pass mark: {PASS_MARK}/{totalQ} ({Math.round((PASS_MARK / totalQ) * 100)}%)</Text>
          </View>

          <View style={[styles.statsRow, { backgroundColor: colors.chipBg }]}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.text }]}>{score}</Text>
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

          {/* PRIMARY — blue, not the old cyan */}
          <TouchableOpacity style={[btnStyles.primary, styles.fullWidth, styles.ctaShadow]} onPress={handleRestart}>
            <Text style={btnStyles.primaryText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[btnStyles.secondary, styles.fullWidth, { marginTop: SP.sm }]} onPress={() => navigation.goBack()}>
            <Text style={btnStyles.secondaryText}>Back to Practice</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── QUIZ PHASE ───
  const progress = (currentIndex / exam.questions.length) * 100;
  const isCorrect = checkAnswer();

  function renderBooleanOptions() {
    return (
      <View style={styles.booleanContainer}>
        {question.options.map((option, index) => {
          const isTrue = option === 'True';
          const isSel = selectedSingle === index;
          const c = getAnsweredColors(index, isSel);
          return (
            <TouchableOpacity
              key={index}
              style={[styles.booleanBtn, { backgroundColor: c.bg, borderColor: c.border, borderBottomColor: c.bottomBorder }]}
              onPress={() => handleSelectSingle(index)}
              activeOpacity={answered ? 1 : 0.7}
            >
              <Text style={[styles.booleanIcon, { color: c.text }]}>{isTrue ? '✓' : '✗'}</Text>
              <Text style={[styles.booleanText, { color: c.text }]}>{option}</Text>
            </TouchableOpacity>
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
              <TouchableOpacity
                key={index}
                style={[styles.optionBtn, { backgroundColor: c.bg, borderColor: c.border, borderBottomColor: c.bottomBorder }]}
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
            <TouchableOpacity
              key={index}
              style={[styles.optionBtn, { backgroundColor: c.bg, borderColor: c.border, borderBottomColor: c.bottomBorder }]}
              onPress={() => handleSelectSingle(index)}
              activeOpacity={answered ? 1 : 0.7}
            >
              <Text style={[styles.optionLetter, { backgroundColor: colors.inputBg, color: c.text }]}>
                {String.fromCharCode(65 + index)}
              </Text>
              <Text style={[styles.optionText, { color: c.text }]}>{option}</Text>
              {answered && isCorrectIndex(index) && <View style={[styles.statusBadge, { backgroundColor: COLORS.green }]}><Ionicons name="checkmark" size={12} color="#fff" /></View>}
              {answered && isSel && !isCorrectIndex(index) && <View style={[styles.statusBadge, { backgroundColor: COLORS.red + '90' }]}><Ionicons name="close" size={12} color="#fff" /></View>}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  const showNextBtn = answered;
  const showConfirmBtn = qType === 'multiple' && !answered && selectedMultiple.size === requiredSelections;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backArrow} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.backIcon} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{exam.title}</Text>
        <Text style={[styles.headerCount, { color: colors.subtext }]}>{currentIndex + 1}/{exam.questions.length}</Text>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.quizScroll} bounces={false}>
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

        {answered && question.explanation && (
          <View style={[styles.feedbackBox, { backgroundColor: isCorrect ? ANSWER.correct.bg : ANSWER.wrong.bg }]}>
            <View style={[styles.feedbackIconBg, { backgroundColor: isCorrect ? COLORS.green : COLORS.red + '20' }]}>
              <Ionicons name={isCorrect ? 'checkmark' : 'close'} size={16} color={isCorrect ? '#fff' : COLORS.red} />
            </View>
            <Text style={[styles.feedbackText, { color: colors.bodyText }]}>{question.explanation}</Text>
          </View>
        )}
      </ScrollView>

      {showConfirmBtn && (
        <View style={[styles.nextContainer, { backgroundColor: colors.card }, SHADOW_FEEDBACK]}>
          <TouchableOpacity
            style={[btnStyles.primary, { backgroundColor: COLORS.orange, borderBottomColor: COLORS.orangeDark }]}
            onPress={handleConfirmMultiple}
          >
            <Text style={btnStyles.primaryText}>Confirm Answer</Text>
          </TouchableOpacity>
        </View>
      )}

      {showNextBtn && (
        <View style={[styles.nextContainer, { backgroundColor: colors.card }, SHADOW_FEEDBACK]}>
          <TouchableOpacity style={[btnStyles.primary, styles.ctaShadow]} onPress={handleNext}>
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
  backArrowText: { fontSize: 22 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600' },
  headerCount: { fontSize: 14, fontWeight: '600' },

  progressTrack: { height: PROGRESS.height },
  progressFill: { height: PROGRESS.height, backgroundColor: COLORS.blue, borderRadius: PROGRESS.borderRadius },

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
    flex: 1, alignItems: 'center', justifyContent: 'center',
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
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  feedbackText: { flex: 1, fontSize: 14, lineHeight: 20 },

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
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SP.sm,
  },
  resultsTitle: { fontSize: 26, fontWeight: '700' },
  resultsSubtitle: { fontSize: 14, marginTop: 4, fontWeight: '500' },
  scoreCircle: {
    width: 130, height: 130, borderRadius: 65, borderWidth: 6,
    alignItems: 'center', justifyContent: 'center', marginBottom: SP.lg,
  },
  scoreNumber: { fontSize: 28, fontWeight: '700' },
  scorePercent: { fontSize: 15, fontWeight: '600' },
  passBadge: {
    borderRadius: CTA.borderRadius, paddingVertical: SP.sm, paddingHorizontal: SP.xl,
    alignItems: 'center', marginBottom: SP.xl, width: '100%',
  },
  passBadgeText: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  passMarkText: { fontSize: 12, marginTop: 4, fontWeight: '500' },
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
