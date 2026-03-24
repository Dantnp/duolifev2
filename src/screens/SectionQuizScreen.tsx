import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { whatIsUKSection } from '../data/whatIsUK';
import { valuesAndPrinciplesSection } from '../data/valuesAndPrinciples';
import { historyOfUKSection } from '../data/historyOfUK';
import { modernSocietySection } from '../data/modernSociety';
import { governmentAndLawSection } from '../data/governmentAndLaw';
import { markConceptComplete } from '../store/progress';
import { sections as sectionsList } from '../data/sections';
import { useTheme } from '../context/ThemeContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SectionQuiz'>;
  route: RouteProp<RootStackParamList, 'SectionQuiz'>;
};

type Phase = 'lesson' | 'quiz' | 'passed' | 'failed';
type AnswerState = 'unanswered' | 'correct' | 'wrong';

const sectionData: Record<number, typeof whatIsUKSection> = {
  1: whatIsUKSection,
  2: valuesAndPrinciplesSection,
  3: historyOfUKSection,
  4: modernSocietySection,
  5: governmentAndLawSection,
};

export default function SectionQuizScreen({ navigation, route }: Props) {
  const { sectionId, conceptIndex } = route.params;
  const section = sectionData[sectionId];
  const concept = section.concepts[conceptIndex];
  const { colors } = useTheme();

  const [phase, setPhase] = useState<Phase>('lesson');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const question = concept.questions[questionIndex];

  function resetQuiz() {
    setQuestionIndex(0);
    setWrongCount(0);
    setSelectedIndex(null);
    setAnswerState('unanswered');
    setPhase('quiz');
  }

  function handleSelect(index: number) {
    if (answerState !== 'unanswered') return;
    setSelectedIndex(index);

    if (index === question.correctIndex) {
      setAnswerState('correct');
    } else {
      setAnswerState('wrong');
      setWrongCount(w => w + 1);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }

  function handleNext() {
    const isLastQuestion = questionIndex + 1 >= concept.questions.length;

    if (!isLastQuestion) {
      setQuestionIndex(q => q + 1);
      setSelectedIndex(null);
      setAnswerState('unanswered');
    } else {
      if (wrongCount === 0 && answerState === 'correct') {
        markConceptComplete(sectionId, concept.id);
        setPhase('passed');
      } else {
        setPhase('failed');
      }
    }
  }

  // ─── Lesson phase ────────────────────────────────────────────────────────
  if (phase === 'lesson') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>

        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={[styles.backIcon, { color: colors.backIcon }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Learn</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.lessonScroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.sectionBadge, { backgroundColor: section.color + '22' }]}>
            <Text style={styles.sectionBadgeEmoji}>{section.emoji}</Text>
            <Text style={[styles.sectionBadgeText, { color: section.color }]}>{section.title}</Text>
          </View>

          <Text style={[styles.conceptName, { color: colors.text }]}>{concept.name}</Text>

          <View style={[styles.textCard, { backgroundColor: colors.cardAlt, borderColor: '#e0eeff' }]}>
            <View style={styles.cardIconRow}>
              <Text style={styles.cardIcon}>📖</Text>
              <Text style={styles.cardLabel}>EXPLANATION</Text>
            </View>
            <Text style={[styles.conceptText, { color: colors.bodyText }]}>{concept.text}</Text>
          </View>

          <View style={[styles.memoryCard, { backgroundColor: colors.cardAlt2, borderColor: '#ffe8a0' }]}>
            <View style={styles.cardIconRow}>
              <Text style={styles.cardIcon}>💡</Text>
              <Text style={[styles.cardLabel, { color: '#FF9600' }]}>MEMORY TRIGGER</Text>
            </View>
            <Text style={[styles.memoryText, { color: colors.bodyText }]}>"{concept.memoryTrigger}"</Text>
          </View>

          <View style={[styles.rulesBox, { backgroundColor: colors.cardAlt, borderColor: '#bfdbfe' }]}>
            <Text style={[styles.rulesText, { color: colors.accentText }]}>
              ✅ Answer all {concept.questions.length} questions correctly to unlock the next concept
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.screenBg }]}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setPhase('quiz')} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>START QUESTIONS</Text>
            <Text style={styles.primaryBtnArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Passed phase ────────────────────────────────────────────────────────
  if (phase === 'passed') {
    const isLastConcept = conceptIndex + 1 >= section.concepts.length;
    const nextSectionIndex = sectionsList.findIndex(s => s.id === sectionId) + 1;
    const nextSection = nextSectionIndex < sectionsList.length ? sectionsList[nextSectionIndex] : null;

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>

        <View style={styles.resultContent}>
          <Text style={styles.resultEmoji}>{isLastConcept ? '🏆' : '🎉'}</Text>
          <Text style={[styles.resultTitle, { color: colors.text }]}>
            {isLastConcept ? 'Congrats!' : 'Perfect!'}
          </Text>
          <Text style={[styles.resultSubtitle, { color: colors.bodyText }]}>
            {isLastConcept
              ? `You completed "${section.title}"!`
              : `All ${concept.questions.length} questions correct!`}
          </Text>
          {isLastConcept && nextSection ? (
            <Text style={[styles.resultConcept, { color: '#1a56db' }]}>
              🔓 You've unlocked "{nextSection.title}"!
            </Text>
          ) : (
            <Text style={[styles.resultConcept, { color: colors.accentText }]}>{concept.name} unlocked ✓</Text>
          )}
        </View>
        <View style={[styles.footer, { backgroundColor: colors.screenBg }]}>
          {!isLastConcept && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() =>
                navigation.replace('SectionQuiz', {
                  sectionId,
                  conceptIndex: conceptIndex + 1,
                })
              }
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>NEXT CONCEPT</Text>
              <Text style={styles.primaryBtnArrow}>→</Text>
            </TouchableOpacity>
          )}
          {isLastConcept && nextSection && (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: nextSection.color, borderBottomColor: nextSection.color + 'aa' }]}
              onPress={() => navigation.replace('SectionMap', { sectionId: nextSection.id } as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>GO TO {nextSection.title.toUpperCase()}</Text>
              <Text style={styles.primaryBtnArrow}>→</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.borderCard }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.bodyText }]}>
              {isLastConcept ? 'BACK TO SECTIONS' : 'BACK TO CONCEPTS'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Failed phase ────────────────────────────────────────────────────────
  if (phase === 'failed') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>

        <View style={styles.resultContent}>
          <Text style={styles.resultEmoji}>💪</Text>
          <Text style={[styles.resultTitle, { color: colors.text }]}>Not quite!</Text>
          <Text style={[styles.resultSubtitle, { color: colors.bodyText }]}>
            You need all {concept.questions.length} correct to proceed.
          </Text>
          <Text style={[styles.resultConcept, { color: colors.subtext }]}>Review the lesson and try again.</Text>
        </View>
        <View style={[styles.footer, { backgroundColor: colors.screenBg }]}>
          <TouchableOpacity style={styles.primaryBtn} onPress={resetQuiz} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>TRY AGAIN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.borderCard }]}
            onPress={() => {
              setQuestionIndex(0);
              setWrongCount(0);
              setSelectedIndex(null);
              setAnswerState('unanswered');
              setPhase('lesson');
            }}
            activeOpacity={0.85}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.bodyText }]}>REVIEW LESSON</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Quiz phase ──────────────────────────────────────────────────────────
  const isLastQuestion = questionIndex + 1 >= concept.questions.length;

  function getOptionStyle(index: number) {
    if (answerState === 'unanswered') return [styles.option, { backgroundColor: colors.card, borderColor: colors.borderCard }];
    if (index === question.correctIndex) return [styles.option, styles.optionCorrect];
    if (index === selectedIndex && answerState === 'wrong') return [styles.option, styles.optionWrong];
    return [styles.option, { backgroundColor: colors.card, borderColor: colors.borderCard, opacity: 0.5 }];
  }

  function getOptionTextStyle(index: number) {
    if (answerState === 'unanswered') return [styles.optionText, { color: colors.bodyText }];
    if (index === question.correctIndex) return [styles.optionText, styles.optionTextCorrect];
    if (index === selectedIndex && answerState === 'wrong') return [styles.optionText, styles.optionTextWrong];
    return [styles.optionText, { color: colors.subtext }];
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: colors.backIcon }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.quizProgress}>
          {concept.questions.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: colors.borderCard },
                i < questionIndex && styles.dotDone,
                i === questionIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.quizConceptChip}>
        <Text style={[styles.quizConceptChipText, { color: section.color }]}>{concept.name}</Text>
        <Text style={[styles.quizConceptChipSub, { color: colors.subtext }]}>Q{questionIndex + 1} / {concept.questions.length}</Text>
      </View>

      <Animated.View style={[styles.questionCard, { backgroundColor: colors.cardAlt, borderColor: '#e0eeff' }, { transform: [{ translateX: shakeAnim }] }]}>
        <Text style={[styles.questionText, { color: colors.text }]}>{question.question}</Text>
      </Animated.View>

      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={getOptionStyle(index)}
            onPress={() => handleSelect(index)}
            activeOpacity={0.8}
            disabled={answerState !== 'unanswered'}
          >
            <View style={[styles.optionLetter, { backgroundColor: colors.inputBg }]}>
              <Text style={[styles.optionLetterText, { color: colors.bodyText }]}>{['A', 'B', 'C', 'D'][index]}</Text>
            </View>
            <Text style={getOptionTextStyle(index)}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {answerState !== 'unanswered' && (
        <View style={[styles.feedbackBar, answerState === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <View style={styles.feedbackLeft}>
            <Text style={styles.feedbackIcon}>{answerState === 'correct' ? '🎉' : '❌'}</Text>
            <Text style={styles.feedbackText}>
              {answerState === 'correct'
                ? 'Correct!'
                : `Answer: ${question.options[question.correctIndex]}`}
            </Text>
          </View>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>{isLastQuestion ? 'FINISH' : 'NEXT'}</Text>
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
    gap: 10,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800' },

  lessonScroll: { paddingHorizontal: 20, paddingTop: 16 },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 16,
  },
  sectionBadgeEmoji: { fontSize: 16 },
  sectionBadgeText: { fontSize: 13, fontWeight: '700' },
  conceptName: { fontSize: 26, fontWeight: '900', marginBottom: 24 },
  textCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.5,
  },
  memoryCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  cardIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardIcon: { fontSize: 18 },
  cardLabel: { fontSize: 10, fontWeight: '800', color: '#1cb0f6', letterSpacing: 1.2 },
  conceptText: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
  memoryText: { fontSize: 20, fontWeight: '800', fontStyle: 'italic' },
  rulesBox: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
  },
  rulesText: { fontSize: 13, fontWeight: '600', lineHeight: 20 },
  footer: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8, gap: 10 },
  primaryBtn: {
    backgroundColor: '#1a56db',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderBottomWidth: 4,
    borderBottomColor: '#1439a8',
    elevation: 4,
  },
  primaryBtnText: { fontSize: 17, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  primaryBtnArrow: { fontSize: 20, color: '#fff' },
  secondaryBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  resultContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  resultEmoji: { fontSize: 80, marginBottom: 8 },
  resultTitle: { fontSize: 36, fontWeight: '900' },
  resultSubtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  resultConcept: { fontSize: 14, fontWeight: '700', textAlign: 'center' },

  quizProgress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotDone: { backgroundColor: '#1a56db' },
  dotActive: { backgroundColor: '#1cb0f6', width: 24, borderRadius: 5 },
  quizConceptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  quizConceptChipText: { fontSize: 13, fontWeight: '800' },
  quizConceptChipSub: { fontSize: 12, fontWeight: '600' },
  questionCard: {
    borderRadius: 18,
    padding: 22,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    minHeight: 100,
    justifyContent: 'center',
  },
  questionText: { fontSize: 19, fontWeight: '700', lineHeight: 28, textAlign: 'center' },
  optionsContainer: { paddingHorizontal: 16, flex: 1, gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    gap: 12,
  },
  optionCorrect: { borderColor: '#1a56db', backgroundColor: '#eff6ff' },
  optionWrong: { borderColor: '#ff4b4b', backgroundColor: '#fff0f0' },
  optionLetter: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: { fontSize: 13, fontWeight: '800' },
  optionText: { fontSize: 15, fontWeight: '600', flex: 1 },
  optionTextCorrect: { color: '#1a56db' },
  optionTextWrong: { color: '#ff4b4b' },
  feedbackBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  feedbackCorrect: { backgroundColor: '#dbeafe' },
  feedbackWrong: { backgroundColor: '#ffd7d7' },
  feedbackLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  feedbackIcon: { fontSize: 20 },
  feedbackText: { fontSize: 13, fontWeight: '600', color: '#333', flex: 1 },
  nextBtn: {
    backgroundColor: '#1cb0f6',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  nextBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
