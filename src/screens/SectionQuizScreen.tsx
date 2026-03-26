import React, { useState, useRef, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { sectionDataMap as sectionData } from '../data/sectionDataMap';
import { markConceptComplete, getXP, XP_PER_CONCEPT } from '../store/progress';
import { sections as sectionsList } from '../data/sections';
import {
  useTheme, COLORS, ANSWER, SHADOW_CARD, SHADOW_CARD_SM, SHADOW_FEEDBACK,
  CARD, CTA, SP, btnStyles,
} from '../context/ThemeContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SectionQuiz'>;
  route: RouteProp<RootStackParamList, 'SectionQuiz'>;
};

type Phase = 'lesson' | 'quiz' | 'passed' | 'failed';
type AnswerState = 'unanswered' | 'correct' | 'wrong';


// Level hints for progression
const SECTION_LEVEL_HINT: Record<number, string> = {
  1: 'Visitor',
  2: 'Resident',
  3: 'History Learner',
  4: 'Culture Aware',
  5: 'Civic Participant',
};

export default function SectionQuizScreen({ navigation, route }: Props) {
  const { sectionId, conceptIndex } = route.params;
  const section = sectionData[sectionId];
  const { colors } = useTheme();
  const concept = section?.concepts?.[conceptIndex];

  const [phase, setPhase] = useState<Phase>('lesson');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  const [xpBefore] = useState(getXP());

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const maxOptions = Math.max(...(concept?.questions?.map(q => q.options.length) ?? [4]));
  const optionScales = useRef(Array.from({ length: maxOptions }, () => new Animated.Value(1))).current;
  const xpCountAnim = useRef(new Animated.Value(0)).current;
  const resultFadeAnim = useRef(new Animated.Value(0)).current;

  if (!section || !concept) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.text, fontSize: 16 }}>Content not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: COLORS.blue, fontSize: 15, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const question = concept.questions[questionIndex];

  // Reset option scales when question changes
  useEffect(() => {
    optionScales.forEach(s => s.setValue(1));
  }, [questionIndex]);

  // Animate result screen entry
  useEffect(() => {
    if (phase === 'passed' || phase === 'failed') {
      resultFadeAnim.setValue(0);
      Animated.timing(resultFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
    if (phase === 'passed') {
      xpCountAnim.setValue(0);
      Animated.timing(xpCountAnim, {
        toValue: XP_PER_CONCEPT,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }
  }, [phase]);

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

    // Bounce animation on the selected option
    Animated.sequence([
      Animated.timing(optionScales[index], { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(optionScales[index], { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 12 }),
    ]).start();

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
    feedbackAnim.setValue(0);
    Animated.spring(feedbackAnim, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 4 }).start();
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

  function getOptionStyle(index: number) {
    if (answerState === 'unanswered') {
      return [styles.option, { backgroundColor: colors.card, borderColor: colors.borderCard }];
    }
    if (index === question.correctIndex) {
      return [styles.option, { borderColor: ANSWER.correct.border, backgroundColor: ANSWER.correct.bg, borderWidth: 2.5 }];
    }
    if (index === selectedIndex && answerState === 'wrong') {
      return [styles.option, { borderColor: ANSWER.wrong.border + '80', backgroundColor: ANSWER.wrong.bg, borderWidth: 1.5 }];
    }
    return [styles.option, { backgroundColor: colors.card, borderColor: colors.borderCard, opacity: 0.4 }];
  }

  function getOptionTextStyle(index: number) {
    if (answerState === 'unanswered') return [styles.optionText, { color: colors.bodyText }];
    if (index === question.correctIndex) return [styles.optionText, { color: ANSWER.correct.text, fontWeight: '700' as const }];
    if (index === selectedIndex && answerState === 'wrong') return [styles.optionText, { color: ANSWER.wrong.text }];
    return [styles.optionText, { color: colors.subtext }];
  }

  function getStatusIcon(index: number) {
    if (answerState === 'unanswered') return null;
    if (index === question.correctIndex) return (
      <View style={[styles.statusBadge, { backgroundColor: COLORS.green }]}>
        <Ionicons name="checkmark" size={12} color="#fff" />
      </View>
    );
    if (index === selectedIndex && answerState === 'wrong') return (
      <View style={[styles.statusBadge, { backgroundColor: COLORS.red + '90' }]}>
        <Ionicons name="close" size={12} color="#fff" />
      </View>
    );
    return null;
  }

  // ─── Lesson phase ───
  if (phase === 'lesson') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.backIcon} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Learn</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.lessonScroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.sectionBadge, { backgroundColor: section.color + '18' }]}>
            <Ionicons name={section.icon as any} size={14} color={section.color} />
            <Text style={[styles.sectionBadgeText, { color: section.color }]}>{section.title}</Text>
          </View>

          <Text style={[styles.conceptName, { color: colors.text }]}>{concept.name}</Text>

          {/* Explanation — calmer card */}
          <View style={[styles.textCard, { backgroundColor: colors.card, borderColor: colors.borderCard }]}>
            <View style={styles.cardIconRow}>
              <View style={[styles.iconContainer, { backgroundColor: COLORS.blueLight }]}>
                <Ionicons name="book-outline" size={16} color={COLORS.blue} />
              </View>
              <Text style={[styles.cardLabel, { color: COLORS.blue }]}>EXPLANATION</Text>
            </View>
            <Text style={[styles.conceptText, { color: colors.bodyText }]}>{concept.text}</Text>
          </View>

          {/* Memory trigger — more visual emphasis */}
          <View style={[styles.memoryCard, { backgroundColor: COLORS.orangeLight, borderColor: COLORS.orange + '30' }]}>
            <View style={styles.cardIconRow}>
              <View style={[styles.iconContainer, { backgroundColor: '#fff' }]}>
                <Ionicons name="bulb-outline" size={16} color={COLORS.orange} />
              </View>
              <Text style={[styles.cardLabel, { color: COLORS.orangeDark }]}>MEMORY TRIGGER</Text>
            </View>
            <Text style={[styles.memoryText, { color: colors.text }]}>"{concept.memoryTrigger}"</Text>
          </View>

          {/* Progress-based quiz prompt */}
          <View style={[styles.rulesBox, { backgroundColor: COLORS.blueLight, borderColor: COLORS.blue + '20' }]}>
            <View style={styles.rulesRow}>
              <View style={styles.rulesProgress}>
                <Text style={[styles.rulesProgressText, { color: COLORS.blue }]}>0/{concept.questions.length}</Text>
              </View>
              <Text style={[styles.rulesText, { color: COLORS.blue }]}>
                Answer all {concept.questions.length} questions correctly to unlock the next concept
              </Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.screenBg }]}>
          <TouchableOpacity style={[btnStyles.primary, SHADOW_CTA_LOCAL]} onPress={() => setPhase('quiz')} activeOpacity={0.85}>
            <Text style={btnStyles.primaryText}>Start Quiz →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Passed phase ───
  if (phase === 'passed') {
    const isLastConcept = conceptIndex + 1 >= section.concepts.length;
    const nextSectionIndex = sectionsList.findIndex(s => s.id === sectionId) + 1;
    const nextSection = nextSectionIndex < sectionsList.length ? sectionsList[nextSectionIndex] : null;
    const levelHint = SECTION_LEVEL_HINT[sectionId];

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
        <Animated.View style={[styles.resultContent, { opacity: resultFadeAnim }]}>
          <View style={[styles.resultIconWrap, { backgroundColor: isLastConcept ? COLORS.goldLight : COLORS.greenLight }]}>
            <Ionicons name={isLastConcept ? 'trophy' : 'checkmark-circle'} size={40} color={isLastConcept ? COLORS.gold : COLORS.green} />
          </View>
          <Text style={[styles.resultTitle, { color: colors.text }]}>
            {isLastConcept ? 'Congrats!' : 'Perfect!'}
          </Text>
          <Text style={[styles.resultSubtitle, { color: colors.bodyText }]}>
            {isLastConcept
              ? `You completed "${section.title}"!`
              : `All ${concept.questions.length} questions correct`}
          </Text>

          {/* XP Reward */}
          <View style={[styles.xpReward, { backgroundColor: COLORS.goldLight }]}>
            <Ionicons name="star" size={16} color={COLORS.gold} />
            <Text style={[styles.xpRewardText, { color: COLORS.gold }]}>+{XP_PER_CONCEPT} XP earned</Text>
          </View>

          {/* Unlock moment */}
          <View style={[styles.unlockCard, { backgroundColor: colors.card, borderColor: colors.borderCard }]}>
            <View style={[styles.unlockIcon, { backgroundColor: COLORS.blueLight }]}>
              <Ionicons name="lock-open" size={18} color={COLORS.blue} />
            </View>
            {isLastConcept && nextSection ? (
              <>
                <Text style={[styles.unlockLabel, { color: colors.subtext }]}>New section unlocked</Text>
                <Text style={[styles.unlockName, { color: colors.text }]}>{nextSection.title}</Text>
              </>
            ) : (
              <>
                <Text style={[styles.unlockLabel, { color: colors.subtext }]}>Concept unlocked</Text>
                <Text style={[styles.unlockName, { color: colors.text }]}>{concept.name}</Text>
              </>
            )}
          </View>

          {/* Progression hint */}
          {levelHint && (
            <Text style={[styles.progressionHint, { color: colors.mutedText }]}>
              You're one step closer to {levelHint}
            </Text>
          )}
        </Animated.View>

        <View style={[styles.footer, { backgroundColor: colors.screenBg }]}>
          {!isLastConcept && (
            <TouchableOpacity
              style={[btnStyles.primary, SHADOW_CTA_LOCAL]}
              onPress={() => navigation.replace('SectionQuiz', { sectionId, conceptIndex: conceptIndex + 1 })}
              activeOpacity={0.85}
            >
              <Text style={btnStyles.primaryText}>Next Concept →</Text>
            </TouchableOpacity>
          )}
          {isLastConcept && nextSection && (
            <TouchableOpacity
              style={[btnStyles.primary, SHADOW_CTA_LOCAL]}
              onPress={() => navigation.replace('SectionMap', { sectionId: nextSection.id } as any)}
              activeOpacity={0.85}
            >
              <Text style={btnStyles.primaryText}>Go to {nextSection.title} →</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[btnStyles.secondary]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={btnStyles.secondaryText}>
              {isLastConcept ? 'Back to Sections' : 'Back to Concepts'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Failed phase ───
  if (phase === 'failed') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
        <Animated.View style={[styles.resultContent, { opacity: resultFadeAnim }]}>
          <View style={[styles.resultIconWrap, { backgroundColor: COLORS.orangeLight }]}>
            <Ionicons name="reload" size={40} color={COLORS.orange} />
          </View>
          <Text style={[styles.resultTitle, { color: colors.text }]}>Almost there!</Text>
          <Text style={[styles.resultSubtitle, { color: colors.bodyText }]}>
            You missed {wrongCount} {wrongCount === 1 ? 'question' : 'questions'} — try again to unlock the next concept
          </Text>
        </Animated.View>
        <View style={[styles.footer, { backgroundColor: colors.screenBg }]}>
          <TouchableOpacity style={[btnStyles.primary, SHADOW_CTA_LOCAL]} onPress={resetQuiz} activeOpacity={0.85}>
            <Text style={btnStyles.primaryText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={btnStyles.secondary}
            onPress={() => { setQuestionIndex(0); setWrongCount(0); setSelectedIndex(null); setAnswerState('unanswered'); setPhase('lesson'); }}
            activeOpacity={0.85}
          >
            <Text style={btnStyles.secondaryText}>Review Lesson</Text>
          </TouchableOpacity>
          <Text style={[styles.reviewHint, { color: colors.mutedText }]}>Refresh the key points before retrying</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Quiz phase ───
  const isLastQuestion = questionIndex + 1 >= concept.questions.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.backIcon} />
        </TouchableOpacity>
        <View style={styles.quizProgressHeader}>
          <View style={styles.dotsRow}>
            {concept.questions.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: colors.borderCard },
                  i < questionIndex && { backgroundColor: COLORS.blue },
                  i === questionIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
          <Text style={[styles.questionCounter, { color: colors.subtext }]}>
            Question {questionIndex + 1} of {concept.questions.length}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.quizConceptChip}>
        <Text style={[styles.quizConceptChipText, { color: section.color }]}>{concept.name}</Text>
      </View>

      <Animated.View style={[styles.questionCard, { backgroundColor: colors.card, borderColor: colors.borderCard }, { transform: [{ translateX: shakeAnim }] }]}>
        <Text style={[styles.questionText, { color: colors.text }]}>{question.question}</Text>
      </Animated.View>

      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => (
          <Animated.View key={index} style={{ transform: [{ scale: optionScales[index] }] }}>
            <TouchableOpacity
              style={getOptionStyle(index)}
              onPress={() => handleSelect(index)}
              activeOpacity={0.8}
              disabled={answerState !== 'unanswered'}
            >
              <View style={[
                styles.optionLetter,
                { backgroundColor: colors.inputBg },
                answerState !== 'unanswered' && index === question.correctIndex && { backgroundColor: COLORS.greenLight },
                answerState === 'wrong' && index === selectedIndex && { backgroundColor: COLORS.redLight },
              ]}>
                <Text style={[
                  styles.optionLetterText,
                  { color: colors.bodyText },
                  answerState !== 'unanswered' && index === question.correctIndex && { color: COLORS.greenDark },
                  answerState === 'wrong' && index === selectedIndex && { color: COLORS.redDark },
                ]}>{['A', 'B', 'C', 'D'][index]}</Text>
              </View>
              <Text style={getOptionTextStyle(index)}>{option}</Text>
              {getStatusIcon(index)}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {answerState !== 'unanswered' && (
        <Animated.View style={[
          styles.feedbackBar,
          { backgroundColor: answerState === 'correct' ? COLORS.greenLight : '#fff' },
          SHADOW_FEEDBACK,
          { transform: [{ translateY: feedbackAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }] },
          { opacity: feedbackAnim },
        ]}>
          <View style={styles.feedbackLeft}>
            <View style={[
              styles.feedbackIconBg,
              { backgroundColor: answerState === 'correct' ? COLORS.green : COLORS.red + '20' },
            ]}>
              <Ionicons
                name={answerState === 'correct' ? 'checkmark' : 'close'}
                size={16}
                color={answerState === 'correct' ? '#fff' : COLORS.red}
              />
            </View>
            <View>
              <Text style={[styles.feedbackTitle, {
                color: answerState === 'correct' ? COLORS.greenDark : colors.text,
              }]}>
                {answerState === 'correct' ? 'Nice — correct!' : 'Not quite'}
              </Text>
              {answerState === 'wrong' && (
                <Text style={[styles.feedbackAnswer, { color: colors.subtext }]}>
                  Correct answer: {question.options[question.correctIndex]}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity style={[btnStyles.primary, styles.nextBtn]} onPress={handleNext}>
            <Text style={btnStyles.primaryText}>{isLastQuestion ? 'Finish' : 'Next'}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// Local shadow for CTA (can't import as computed const in StyleSheet)
const SHADOW_CTA_LOCAL = {
  shadowColor: COLORS.blueDark,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 6,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SP.md,
    paddingVertical: SP.sm,
    gap: 10,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },

  lessonScroll: { paddingHorizontal: SP.lg, paddingTop: SP.md },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: SP.sm,
    paddingVertical: 6,
    gap: 6,
    marginBottom: SP.md,
  },
  sectionBadgeEmoji: { fontSize: 16 },
  sectionBadgeText: { fontSize: 13, fontWeight: '600' },
  conceptName: { fontSize: 26, fontWeight: '800', marginBottom: SP.lg },

  // Lesson cards — calmer, border instead of shadow
  textCard: {
    borderRadius: CARD.borderRadius,
    padding: CARD.padding,
    marginBottom: SP.sm,
    borderWidth: 1,
  },
  memoryCard: {
    borderRadius: CARD.borderRadius,
    padding: CARD.padding,
    marginBottom: SP.sm,
    borderWidth: 1,
  },
  cardIconRow: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, marginBottom: SP.sm },
  iconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardIcon: { fontSize: 16 },
  cardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  conceptText: { fontSize: 15, lineHeight: 24, fontWeight: '400' },
  memoryText: { fontSize: 20, fontWeight: '800', fontStyle: 'italic', lineHeight: 28 },

  // Rules box with progress indicator
  rulesBox: {
    borderRadius: SP.sm,
    padding: SP.md,
    borderWidth: 1,
  },
  rulesRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rulesProgress: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.blue + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  rulesProgressText: { fontSize: 11, fontWeight: '800' },
  rulesText: { fontSize: 13, fontWeight: '600', lineHeight: 20, flex: 1 },
  footer: { paddingHorizontal: SP.lg, paddingBottom: SP.xl, paddingTop: SP.xs, gap: SP.sm },

  // Result screens
  resultContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: SP.sm,
  },
  resultIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SP.sm,
  },
  resultTitle: { fontSize: 28, fontWeight: '800' },
  resultSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 24 },

  // XP reward chip
  xpReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 4,
  },
  xpRewardText: { fontSize: 15, fontWeight: '800' },

  // Unlock card
  unlockCard: {
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    width: '100%',
  },
  unlockIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  unlockLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  unlockName: { fontSize: 17, fontWeight: '800', marginTop: 2, textAlign: 'center' },

  // Progression hint
  progressionHint: { fontSize: 12, fontWeight: '500', marginTop: 8 },

  // Review hint (failed screen)
  reviewHint: { fontSize: 12, fontWeight: '500', textAlign: 'center', marginTop: -4 },

  // Quiz header
  quizProgressHeader: { flex: 1, alignItems: 'center' },
  dotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.xs },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotActive: { backgroundColor: COLORS.blue, width: 24, borderRadius: 5 },
  questionCounter: { fontSize: 10, fontWeight: '600', marginTop: 3 },

  quizConceptChip: {
    paddingHorizontal: SP.lg,
    marginBottom: SP.sm,
  },
  quizConceptChipText: { fontSize: 13, fontWeight: '700' },

  // Question card — calmer
  questionCard: {
    borderRadius: CARD.borderRadius,
    padding: SP.lg,
    marginHorizontal: SP.md,
    marginBottom: SP.md,
    minHeight: 90,
    justifyContent: 'center',
    borderWidth: 1,
  },
  questionText: { fontSize: 17, fontWeight: '700', lineHeight: 26, textAlign: 'center' },

  optionsContainer: { paddingHorizontal: SP.md, flex: 1, gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: CTA.borderRadius,
    padding: SP.md,
    borderWidth: 2,
    gap: SP.sm,
  },
  optionLetter: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: { fontSize: 13, fontWeight: '700' },
  optionText: { fontSize: 15, fontWeight: '600', flex: 1 },
  statusBadge: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },

  // Feedback bar
  feedbackBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SP.md,
    marginTop: SP.sm,
  },
  feedbackLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  feedbackIconBg: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  feedbackTitle: { fontSize: 14, fontWeight: '700' },
  feedbackAnswer: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  nextBtn: {
    height: 44,
    paddingHorizontal: SP.lg,
    borderBottomWidth: 3,
  },
});
