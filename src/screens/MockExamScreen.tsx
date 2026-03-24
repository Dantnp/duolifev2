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
import { RootStackParamList, Question } from '../types';
import { mockExams } from '../data/mockExams';
import { csvMockExams } from '../data/csvMockExams';
import { useTheme } from '../context/ThemeContext';
import { saveExamScore } from '../store/progress';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MockExam'>;
  route: RouteProp<RootStackParamList, 'MockExam'>;
};

const PASS_MARK = 18;
const TOTAL = 24;

const allExams = [...mockExams, ...csvMockExams];

export default function MockExamScreen({ navigation, route }: Props) {
  const exam = allExams.find(e => e.id === route.params.examId)!;
  const { colors } = useTheme();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSingle, setSelectedSingle] = useState<number | null>(null);
  const [selectedMultiple, setSelectedMultiple] = useState<Set<number>>(new Set());
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [phase, setPhase] = useState<'quiz' | 'results'>('quiz');

  const shakeAnim = useRef(new Animated.Value(0)).current;

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
    if (qType === 'multiple' && question.correctIndices) {
      return question.correctIndices.includes(index);
    }
    return index === question.correctIndex;
  }

  function checkAnswer(): boolean {
    if (qType === 'multiple' && question.correctIndices) {
      if (selectedMultiple.size !== question.correctIndices.length) return false;
      return question.correctIndices.every(i => selectedMultiple.has(i));
    }
    return selectedSingle === question.correctIndex;
  }

  // Single / Boolean: tap to select & auto-submit
  function handleSelectSingle(index: number) {
    if (answered) return;
    setSelectedSingle(index);
    setAnswered(true);
    if (index !== question.correctIndex) shake();
  }

  // Multiple: toggle selection
  function handleToggleMultiple(index: number) {
    if (answered) return;
    setSelectedMultiple(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        if (next.size < requiredSelections) {
          next.add(index);
        }
      }
      return next;
    });
  }

  // Multiple: confirm selection
  function handleConfirmMultiple() {
    if (answered || selectedMultiple.size !== requiredSelections) return;
    setAnswered(true);
    if (!checkAnswer()) shake();
  }

  function handleNext() {
    const correct = checkAnswer();
    const newResults = [...results, correct];

    if (currentIndex + 1 >= exam.questions.length) {
      setResults(newResults);
      const finalScore = newResults.filter(Boolean).length;
      saveExamScore(exam.id, finalScore, exam.questions.length);
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
    setCurrentIndex(0);
    setSelectedSingle(null);
    setSelectedMultiple(new Set());
    setAnswered(false);
    setResults([]);
    setPhase('quiz');
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
            <Text style={styles.resultsEmoji}>{passed ? '🎉' : '📖'}</Text>
            <Text style={[styles.resultsTitle, { color: colors.text }]}>
              {passed ? 'Well done!' : 'Keep practising'}
            </Text>
            <Text style={[styles.resultsSubtitle, { color: colors.subtext }]}>{exam.title}</Text>
          </View>

          <View style={[styles.scoreCircle, { borderColor: passed ? '#1a56db' : '#ff4b4b' }]}>
            <Text style={[styles.scoreNumber, { color: passed ? '#1a56db' : '#ff4b4b' }]}>
              {score}/{totalQ}
            </Text>
            <Text style={[styles.scorePercent, { color: colors.subtext }]}>{percentage}%</Text>
          </View>

          <View style={[styles.passBadge, { backgroundColor: passed ? '#eff6ff' : '#fff0f0' }]}>
            <Text style={[styles.passBadgeText, { color: passed ? '#1a56db' : '#ff4b4b' }]}>
              {passed ? '✓ PASSED' : '✗ NOT PASSED'}
            </Text>
            <Text style={[styles.passMarkText, { color: colors.subtext }]}>
              Pass mark: {PASS_MARK}/{TOTAL} (75%)
            </Text>
          </View>

          <View style={[styles.statsRow, { backgroundColor: colors.chipBg }]}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.text }]}>{score}</Text>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>Correct</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: '#ff4b4b' }]}>{totalQ - score}</Text>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>Wrong</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.text }]}>{totalQ}</Text>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>Total</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.retryBtn} onPress={handleRestart}>
            <Text style={styles.retryBtnText}>TRY AGAIN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: colors.borderCard }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backBtnText, { color: colors.subtext }]}>BACK TO PRACTICE</Text>
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
          let bgColor = isTrue ? '#f0fdf4' : '#fff5f5';
          let borderColor = isTrue ? '#bbf7d0' : '#fecaca';
          let bottomBorderColor = isTrue ? '#86efac' : '#fca5a5';
          let textColor = isTrue ? '#166534' : '#991b1b';

          if (answered) {
            if (isCorrectIndex(index)) {
              bgColor = '#eff6ff';
              borderColor = '#1a56db';
              bottomBorderColor = '#1439a8';
              textColor = '#1439a8';
            } else if (index === selectedSingle && !isCorrectIndex(index)) {
              bgColor = '#fff0f0';
              borderColor = '#ff4b4b';
              bottomBorderColor = '#cc3c3c';
              textColor = '#cc3c3c';
            } else {
              bgColor = colors.card;
              borderColor = colors.borderCard;
              bottomBorderColor = colors.border;
              textColor = colors.mutedText;
            }
          } else if (selectedSingle === index) {
            bgColor = '#f0faff';
            borderColor = '#1cb0f6';
            bottomBorderColor = '#1490cc';
          }

          return (
            <TouchableOpacity
              key={index}
              style={[styles.booleanBtn, { backgroundColor: bgColor, borderColor, borderBottomColor: bottomBorderColor }]}
              onPress={() => handleSelectSingle(index)}
              activeOpacity={answered ? 1 : 0.7}
            >
              <Text style={[styles.booleanIcon, { color: textColor }]}>
                {isTrue ? '✓' : '✗'}
              </Text>
              <Text style={[styles.booleanText, { color: textColor }]}>{option}</Text>
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
          <Text style={[styles.multiHintText, { color: colors.accentText }]}>
            Select {requiredSelections} answers ({selectedMultiple.size}/{requiredSelections})
          </Text>
        </View>
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => {
            const isSelected = selectedMultiple.has(index);
            let bgColor = colors.card;
            let borderColor = colors.borderCard;
            let bottomBorderColor = colors.border;
            let textColor = colors.bodyText;
            let checkColor = colors.mutedText;

            if (answered) {
              if (isCorrectIndex(index)) {
                bgColor = '#eff6ff';
                borderColor = '#1a56db';
                bottomBorderColor = '#1439a8';
                textColor = '#1439a8';
                checkColor = '#1a56db';
              } else if (isSelected && !isCorrectIndex(index)) {
                bgColor = '#fff0f0';
                borderColor = '#ff4b4b';
                bottomBorderColor = '#cc3c3c';
                textColor = '#cc3c3c';
                checkColor = '#ff4b4b';
              }
            } else if (isSelected) {
              bgColor = '#f0faff';
              borderColor = '#1cb0f6';
              bottomBorderColor = '#1490cc';
              checkColor = '#1cb0f6';
            }

            return (
              <TouchableOpacity
                key={index}
                style={[styles.optionBtn, { backgroundColor: bgColor, borderColor, borderBottomColor: bottomBorderColor }]}
                onPress={() => handleToggleMultiple(index)}
                activeOpacity={answered ? 1 : 0.7}
              >
                <View style={[styles.checkbox, { borderColor: checkColor, backgroundColor: isSelected ? checkColor : 'transparent' }]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
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
          let bgColor = colors.card;
          let borderColor = colors.borderCard;
          let bottomBorderColor = colors.border;
          let textColor = colors.bodyText;

          if (answered) {
            if (isCorrectIndex(index)) {
              bgColor = '#eff6ff';
              borderColor = '#1a56db';
              bottomBorderColor = '#1439a8';
              textColor = '#1439a8';
            } else if (index === selectedSingle && !isCorrectIndex(index)) {
              bgColor = '#fff0f0';
              borderColor = '#ff4b4b';
              bottomBorderColor = '#cc3c3c';
              textColor = '#cc3c3c';
            }
          } else if (selectedSingle === index) {
            bgColor = '#f0faff';
            borderColor = '#1cb0f6';
            bottomBorderColor = '#1490cc';
          }

          return (
            <TouchableOpacity
              key={index}
              style={[styles.optionBtn, { backgroundColor: bgColor, borderColor, borderBottomColor: bottomBorderColor }]}
              onPress={() => handleSelectSingle(index)}
              activeOpacity={answered ? 1 : 0.7}
            >
              <Text style={[styles.optionLetter, { backgroundColor: colors.inputBg, color: colors.bodyText }]}>
                {String.fromCharCode(65 + index)}
              </Text>
              <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // Should we show the Next/Confirm button at the bottom?
  const showNextBtn = answered;
  const showConfirmBtn = qType === 'multiple' && !answered && selectedMultiple.size === requiredSelections;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backArrow} onPress={() => navigation.goBack()}>
          <Text style={[styles.backArrowText, { color: colors.backIcon }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{exam.title}</Text>
        <Text style={[styles.headerCount, { color: colors.subtext }]}>
          {currentIndex + 1}/{exam.questions.length}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.quizScroll} bounces={false}>
        {/* Question */}
        <Animated.View
          style={[
            styles.questionCard,
            { backgroundColor: colors.cardAlt2, borderColor: colors.borderCard },
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          <View style={styles.questionHeaderRow}>
            <Text style={[styles.questionNumber, { color: colors.accentText }]}>Question {currentIndex + 1}</Text>
            {qType === 'boolean' && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>TRUE / FALSE</Text>
              </View>
            )}
            {qType === 'multiple' && (
              <View style={[styles.typeBadge, { backgroundColor: '#fef3c7' }]}>
                <Text style={[styles.typeBadgeText, { color: '#92400e' }]}>MULTI-SELECT</Text>
              </View>
            )}
          </View>
          <Text style={[styles.questionText, { color: colors.text }]}>{question.question}</Text>
        </Animated.View>

        {/* Options — render by type */}
        {qType === 'boolean' && renderBooleanOptions()}
        {qType === 'multiple' && renderMultipleOptions()}
        {qType === 'single' && renderSingleOptions()}

        {/* Feedback */}
        {answered && question.explanation && (
          <View style={[
            styles.feedbackBox,
            isCorrect
              ? { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }
              : { backgroundColor: '#fff0f0', borderColor: '#ffd0d0' },
            { borderWidth: 1 },
          ]}>
            <Text style={styles.feedbackIcon}>
              {isCorrect ? '✓' : '✗'}
            </Text>
            <Text style={[styles.feedbackText, { color: colors.bodyText }]}>{question.explanation}</Text>
          </View>
        )}
      </ScrollView>

      {/* Confirm button for multi-select (before answering) */}
      {showConfirmBtn && (
        <View style={[styles.nextContainer, { backgroundColor: colors.screenBg, borderTopColor: colors.border }]}>
          <TouchableOpacity style={[styles.nextBtn, { backgroundColor: '#f59e0b', borderBottomColor: '#d97706' }]} onPress={handleConfirmMultiple}>
            <Text style={styles.nextBtnText}>CONFIRM ANSWER</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Next button (after answering) */}
      {showNextBtn && (
        <View style={[styles.nextContainer, { backgroundColor: colors.screenBg, borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {currentIndex + 1 === exam.questions.length ? 'SEE RESULTS' : 'NEXT'}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backArrow: { padding: 4, marginRight: 8 },
  backArrowText: { fontSize: 22 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800' },
  headerCount: { fontSize: 14, fontWeight: '700' },

  progressTrack: { height: 6 },
  progressFill: { height: 6, backgroundColor: '#1a56db', borderRadius: 3 },

  quizScroll: { padding: 16, paddingBottom: 100 },
  questionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  questionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  typeBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#5b21b6',
    letterSpacing: 0.5,
  },
  questionText: { fontSize: 18, fontWeight: '700', lineHeight: 26 },

  // ─── Standard options ───
  optionsContainer: { gap: 10 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 2,
    padding: 14,
    borderBottomWidth: 4,
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 13,
    fontWeight: '800',
    marginRight: 12,
  },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600' },

  // ─── Boolean options ───
  booleanContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  booleanBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 2,
    borderBottomWidth: 4,
    paddingVertical: 24,
    gap: 8,
  },
  booleanIcon: {
    fontSize: 28,
    fontWeight: '900',
  },
  booleanText: {
    fontSize: 18,
    fontWeight: '800',
  },

  // ─── Multi-select ───
  multiHint: {
    marginBottom: 10,
    alignItems: 'center',
  },
  multiHintText: {
    fontSize: 12,
    fontWeight: '700',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },

  // ─── Feedback ───
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    gap: 10,
  },
  feedbackIcon: { fontSize: 16, fontWeight: '800', marginTop: 1 },
  feedbackText: { flex: 1, fontSize: 14, lineHeight: 20 },

  // ─── Bottom buttons ───
  nextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  nextBtn: {
    backgroundColor: '#1a56db',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#1439a8',
  },
  nextBtnText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  // ─── Results ───
  resultsScroll: { padding: 24, alignItems: 'center', paddingBottom: 40 },
  resultsHeader: { alignItems: 'center', marginBottom: 24 },
  resultsEmoji: { fontSize: 56, marginBottom: 12 },
  resultsTitle: { fontSize: 26, fontWeight: '800' },
  resultsSubtitle: { fontSize: 14, marginTop: 4, fontWeight: '600' },
  scoreCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  scoreNumber: { fontSize: 28, fontWeight: '900' },
  scorePercent: { fontSize: 15, fontWeight: '700' },
  passBadge: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  passBadgeText: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  passMarkText: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 28,
    alignItems: 'center',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  statDivider: { width: 1, height: 40 },
  retryBtn: {
    backgroundColor: '#1cb0f6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    borderBottomWidth: 4,
    borderBottomColor: '#1490cc',
    marginBottom: 12,
  },
  retryBtnText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  backBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
  },
  backBtnText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
});
