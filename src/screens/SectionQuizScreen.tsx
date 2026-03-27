import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { sectionDataMap as sectionData } from '../data/sectionDataMap';
import { markConceptComplete, getXP, XP_PER_CONCEPT, recordQuestionsAnswered } from '../store/progress';
import { QUIZ_PASS_RATE, getAllowedWrong } from '../constants/gameConfig';
import { sections as sectionsList } from '../data/sections';
import {
  useTheme, COLORS, ANSWER, SHADOW_CARD, SHADOW_CARD_SM, SHADOW_FEEDBACK,
  CARD, CTA, SP, ANIM, MEMORY_CARD, SHADOW_MEMORY, btnStyles,
} from '../context/ThemeContext';

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
  navigation: NativeStackNavigationProp<RootStackParamList, 'SectionQuiz'>;
  route: RouteProp<RootStackParamList, 'SectionQuiz'>;
};

type Phase = 'lesson' | 'quiz' | 'passed' | 'failed';
type AnswerState = 'unanswered' | 'correct' | 'wrong';

const SECTION_LEVEL_HINT: Record<number, string> = {
  1: 'Visitor',
  2: 'Resident',
  3: 'History Learner',
  4: 'Culture Aware',
  5: 'Civic Participant',
};

// ─── Render explanation text as scannable bullets ───
function renderBulletText(text: string, textStyle: any) {
  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(s => s.length > 2);

  if (sentences.length <= 1) {
    return <Text style={textStyle}>{text}</Text>;
  }

  return (
    <View style={bulletStyles.list}>
      {sentences.map((sentence, i) => (
        <View key={i} style={bulletStyles.row}>
          <Text style={[bulletStyles.dot, { color: COLORS.blue }]}>{'\u2022'}</Text>
          <Text style={textStyle}>{sentence.replace(/\.+$/, '')}</Text>
        </View>
      ))}
    </View>
  );
}

const bulletStyles = StyleSheet.create({
  list: { gap: 6 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  dot: { fontSize: 16, lineHeight: 24, fontWeight: '900' },
});

export default function SectionQuizScreen({ navigation, route }: Props) {
  const { sectionId, conceptIndex } = route.params;
  const section = sectionData[sectionId];
  const { colors, isDark } = useTheme();
  const concept = section?.concepts?.[conceptIndex];

  // ─── State ───
  const [phase, setPhase] = useState<Phase>('lesson');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedMultiple, setSelectedMultiple] = useState<Set<number>>(new Set());
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  const [xpBefore] = useState(getXP());

  // ─── Animated values ───
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const progressBarAnim = useRef(new Animated.Value(0)).current;
  const maxOptions = Math.max(...(concept?.questions?.map(q => q.options.length) ?? [4]));
  const optionScales = useRef(Array.from({ length: maxOptions }, () => new Animated.Value(1))).current;
  const xpCountAnim = useRef(new Animated.Value(0)).current;
  const resultFadeAnim = useRef(new Animated.Value(0)).current;
  const resultScaleAnim = useRef(new Animated.Value(0.9)).current;
  const confirmOpacity = useRef(new Animated.Value(0)).current;
  const confirmScale = useRef(new Animated.Value(0.98)).current;
  const unlockCardAnim = useRef(new Animated.Value(0)).current;

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
  const qType = question?.type || 'single';
  const isMulti = qType === 'multiple';
  const requiredSelections = isMulti ? (question.correctIndices?.length ?? 2) : 1;

  function isCorrectIndex(index: number): boolean {
    if (isMulti && question.correctIndices) return question.correctIndices.includes(index);
    return index === question.correctIndex;
  }

  function checkMultiAnswer(): boolean {
    if (!question.correctIndices) return false;
    if (selectedMultiple.size !== question.correctIndices.length) return false;
    return question.correctIndices.every(i => selectedMultiple.has(i));
  }

  // ─── Reset option scales on question change ───
  useEffect(() => {
    optionScales.forEach(s => s.setValue(1));
    confirmOpacity.setValue(0);
    confirmScale.setValue(0.98);
  }, [questionIndex]);

  // ─── Animate progress bar smoothly ───
  useEffect(() => {
    if (phase === 'quiz') {
      Animated.timing(progressBarAnim, {
        toValue: (questionIndex + 1) / concept.questions.length,
        duration: ANIM.progressBar,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [questionIndex, phase]);

  // ─── Confirm button fade-in for multi-select ───
  useEffect(() => {
    if (isMulti && selectedMultiple.size === requiredSelections && answerState === 'unanswered') {
      Animated.parallel([
        Animated.timing(confirmOpacity, { toValue: 1, duration: ANIM.fadeIn, useNativeDriver: true }),
        Animated.spring(confirmScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
      ]).start();
      triggerHaptic('light');
    } else if (isMulti && answerState === 'unanswered') {
      confirmOpacity.setValue(0);
      confirmScale.setValue(0.98);
    }
  }, [selectedMultiple.size, answerState]);

  // ─── Result screen animations ───
  useEffect(() => {
    if (phase === 'passed' || phase === 'failed') {
      resultFadeAnim.setValue(0);
      resultScaleAnim.setValue(0.9);
      Animated.parallel([
        Animated.timing(resultFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(resultScaleAnim, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 6 }),
      ]).start();
    }
    if (phase === 'passed') {
      xpCountAnim.setValue(0);
      Animated.timing(xpCountAnim, { toValue: XP_PER_CONCEPT, duration: 800, useNativeDriver: false }).start();
      // Unlock card entrance (delayed)
      unlockCardAnim.setValue(0);
      Animated.sequence([
        Animated.delay(400),
        Animated.spring(unlockCardAnim, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 8 }),
      ]).start();
      triggerHaptic('success');
    }
    if (phase === 'failed') {
      triggerHaptic('error');
    }
  }, [phase]);

  // ─── Shake animation helper ───
  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: ANIM.shakeFrame, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: ANIM.shakeFrame, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: ANIM.shakeFrame, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: ANIM.shakeFrame, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: ANIM.shakeFrame, useNativeDriver: true }),
    ]).start();
  }

  function resetQuiz() {
    setQuestionIndex(0);
    setWrongCount(0);
    setSelectedIndex(null);
    setSelectedMultiple(new Set());
    setAnswerState('unanswered');
    setPhase('quiz');
    progressBarAnim.setValue(0);
  }

  function handleSelect(index: number) {
    if (answerState !== 'unanswered') return;

    // Premium scale animation: 1 → 1.03 over 150ms ease-out
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

    triggerHaptic('light');

    if (isMulti) {
      setSelectedMultiple(prev => {
        const next = new Set(prev);
        if (next.has(index)) next.delete(index);
        else if (next.size < requiredSelections) next.add(index);
        return next;
      });
      return;
    }

    // Single-select: judge immediately
    setSelectedIndex(index);
    if (index === question.correctIndex) {
      setAnswerState('correct');
      triggerHaptic('success');
    } else {
      setAnswerState('wrong');
      setWrongCount(w => w + 1);
      shake();
      triggerHaptic('error');
    }
    feedbackAnim.setValue(0);
    Animated.spring(feedbackAnim, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 4 }).start();
  }

  function handleConfirmMultiple() {
    if (answerState !== 'unanswered' || selectedMultiple.size !== requiredSelections) return;
    const correct = checkMultiAnswer();
    if (correct) {
      setAnswerState('correct');
      triggerHaptic('success');
    } else {
      setAnswerState('wrong');
      setWrongCount(w => w + 1);
      shake();
      triggerHaptic('error');
    }
    feedbackAnim.setValue(0);
    Animated.spring(feedbackAnim, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 4 }).start();
  }

  function handleNext() {
    const isLastQuestion = questionIndex + 1 >= concept.questions.length;
    if (!isLastQuestion) {
      setQuestionIndex(q => q + 1);
      setSelectedIndex(null);
      setSelectedMultiple(new Set());
      setAnswerState('unanswered');
    } else {
      recordQuestionsAnswered(concept.questions.length);
      if (wrongCount <= getAllowedWrong(concept.questions.length)) {
        markConceptComplete(sectionId, concept.id);
        setPhase('passed');
      } else {
        setPhase('failed');
      }
    }
  }

  const isSelected = (index: number) => isMulti ? selectedMultiple.has(index) : index === selectedIndex;
  const isWrongSelection = (index: number) => answerState === 'wrong' && isSelected(index) && !isCorrectIndex(index);

  function getOptionStyle(index: number) {
    if (answerState === 'unanswered') {
      const selected = isMulti ? selectedMultiple.has(index) : index === selectedIndex;
      if (selected) {
        return [styles.option, { backgroundColor: ANSWER.selected.bg, borderColor: COLORS.blue, borderWidth: 2.5 }, SHADOW_CARD_SM];
      }
      return [styles.option, { backgroundColor: colors.card, borderColor: colors.borderCard, borderWidth: 1.5 }];
    }
    if (isCorrectIndex(index)) {
      return [styles.option, { borderColor: ANSWER.correct.border, backgroundColor: ANSWER.correct.bg, borderWidth: 2.5 }, SHADOW_CARD_SM];
    }
    if (isWrongSelection(index)) {
      return [styles.option, { borderColor: ANSWER.wrong.border + '80', backgroundColor: ANSWER.wrong.bg, borderWidth: 1.5 }];
    }
    return [styles.option, { backgroundColor: colors.card, borderColor: colors.borderCard, opacity: 0.55 }];
  }

  function getOptionTextStyle(index: number) {
    if (answerState === 'unanswered') return [styles.optionText, { color: colors.bodyText }];
    if (isCorrectIndex(index)) return [styles.optionText, { color: ANSWER.correct.text, fontWeight: '700' as const }];
    if (isWrongSelection(index)) return [styles.optionText, { color: ANSWER.wrong.text }];
    return [styles.optionText, { color: colors.subtext }];
  }

  function getStatusIcon(index: number) {
    if (answerState === 'unanswered') return null;
    if (isCorrectIndex(index)) return (
      <View style={[styles.statusBadge, { backgroundColor: COLORS.green }]}>
        <Ionicons name="checkmark" size={12} color="#fff" />
      </View>
    );
    if (isWrongSelection(index)) return (
      <View style={[styles.statusBadge, { backgroundColor: COLORS.red + '90' }]}>
        <Ionicons name="close" size={12} color="#fff" />
      </View>
    );
    return null;
  }

  // ═══════════════════════════════════════════════════════════════
  // LESSON PHASE — Clean, scannable, with hero memory card
  // ═══════════════════════════════════════════════════════════════
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
          {/* Section badge */}
          <View style={[styles.sectionBadge, { backgroundColor: section.color + '18' }]}>
            <Ionicons name={section.icon as any} size={14} color={section.color} />
            <Text style={[styles.sectionBadgeText, { color: section.color }]}>{section.title}</Text>
          </View>

          {/* Concept title */}
          <Text style={[styles.conceptName, { color: colors.text }]}>{concept.name}</Text>

          {/* Explanation card — bullet points for scannability */}
          <View style={[styles.textCard, { backgroundColor: colors.card, borderColor: colors.borderCard }]}>
            <View style={styles.cardIconRow}>
              <View style={[styles.iconContainer, { backgroundColor: COLORS.blueLight }]}>
                <Ionicons name="book-outline" size={16} color={COLORS.blue} />
              </View>
              <Text style={[styles.cardLabel, { color: COLORS.blue }]}>KEY POINTS</Text>
            </View>
            {renderBulletText(concept.text, [styles.conceptText, { color: colors.bodyText }])}
          </View>

          {/* ═══ MEMORY CARD — THE HERO ELEMENT ═══ */}
          <View style={[
            styles.memoryCard,
            {
              backgroundColor: isDark ? MEMORY_CARD.bgDark : MEMORY_CARD.bg,
              borderColor: isDark ? MEMORY_CARD.accent + '40' : MEMORY_CARD.border,
            },
            SHADOW_MEMORY,
          ]}>
            <View style={[styles.memoryAccent, { backgroundColor: MEMORY_CARD.accent }]} />
            <View style={styles.memoryInner}>
              <View style={styles.cardIconRow}>
                <View style={[styles.memoryIconContainer, {
                  backgroundColor: isDark ? MEMORY_CARD.iconBgDark : MEMORY_CARD.iconBg,
                }]}>
                  <Text style={{ fontSize: 22 }}>🧠</Text>
                </View>
                <View>
                  <Text style={[styles.memoryLabel, {
                    color: isDark ? MEMORY_CARD.labelColorDark : MEMORY_CARD.labelColor,
                  }]}>REMEMBER THIS</Text>
                  <Text style={[styles.memorySubLabel, {
                    color: MEMORY_CARD.subLabelColor,
                  }]}>Key fact for the test</Text>
                </View>
              </View>
              <Text style={[styles.memoryText, {
                color: isDark ? MEMORY_CARD.textColorDark : MEMORY_CARD.textColor,
              }]}>
                "{concept.memoryTrigger}"
              </Text>
            </View>
          </View>

          {/* Quiz rules with progress indicator */}
          <View style={[styles.rulesBox, { backgroundColor: COLORS.blueLight, borderColor: COLORS.blue + '20' }]}>
            <View style={styles.rulesRow}>
              <View style={styles.rulesProgress}>
                <Text style={[styles.rulesProgressText, { color: COLORS.blue }]}>0/{concept.questions.length}</Text>
              </View>
              <Text style={[styles.rulesText, { color: COLORS.blue }]}>
                Get {Math.ceil(concept.questions.length * QUIZ_PASS_RATE)}/{concept.questions.length} correct to unlock the next concept
              </Text>
            </View>
          </View>

          {/* Unlock preview */}
          {conceptIndex + 1 < section.concepts.length ? (
            <View style={[styles.unlockPreview, { backgroundColor: colors.card, borderColor: colors.borderCard }]}>
              <Ionicons name="lock-closed" size={14} color={colors.mutedText} />
              <Text style={[styles.unlockPreviewText, { color: colors.subtext }]}>
                Complete to unlock: {section.concepts[conceptIndex + 1].name}
              </Text>
            </View>
          ) : (
            <View style={[styles.unlockPreview, { backgroundColor: COLORS.goldLight, borderColor: COLORS.gold + '30' }]}>
              <Ionicons name="trophy" size={14} color={COLORS.gold} />
              <Text style={[styles.unlockPreviewText, { color: COLORS.orangeDark }]}>
                Last concept — finish to complete "{section.title}"!
              </Text>
            </View>
          )}

          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            {section.concepts.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.stepDot,
                  { backgroundColor: i < conceptIndex ? COLORS.green : i === conceptIndex ? COLORS.blue : colors.borderCard },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.stepText, { color: colors.subtext }]}>
            Step {conceptIndex + 1} of {section.concepts.length}
          </Text>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.screenBg }]}>
          <TouchableOpacity testID="start-quiz-button" style={[btnStyles.primary, SHADOW_CTA_LOCAL]} onPress={() => setPhase('quiz')} activeOpacity={0.85}>
            <Text style={btnStyles.primaryText}>Start Quiz →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PASSED PHASE — Celebration + XP + unlock
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'passed') {
    const isLastConcept = conceptIndex + 1 >= section.concepts.length;
    const nextSectionIndex = sectionsList.findIndex(s => s.id === sectionId) + 1;
    const nextSection = nextSectionIndex < sectionsList.length ? sectionsList[nextSectionIndex] : null;
    const levelHint = SECTION_LEVEL_HINT[sectionId];

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
        <Animated.View style={[
          styles.resultContent,
          { opacity: resultFadeAnim, transform: [{ scale: resultScaleAnim }] },
        ]}>
          {/* Celebration icon */}
          <View testID="result-icon-passed" style={[styles.resultIconWrap, { backgroundColor: isLastConcept ? COLORS.goldLight : COLORS.greenLight }]}>
            <Ionicons name={isLastConcept ? 'trophy' : 'checkmark-circle'} size={44} color={isLastConcept ? COLORS.gold : COLORS.green} />
          </View>

          <Text style={[styles.resultTitle, { color: colors.text }]}>
            {isLastConcept ? '🎉 Section Complete!' : 'Perfect!'}
          </Text>
          <Text style={[styles.resultSubtitle, { color: colors.bodyText }]}>
            {isLastConcept
              ? `You mastered "${section.title}"`
              : `${concept.questions.length - wrongCount}/${concept.questions.length} correct — well done!`}
          </Text>

          {/* XP Reward — prominent chip */}
          <View style={[styles.xpReward, { backgroundColor: COLORS.goldLight }]}>
            <Ionicons name="star" size={18} color={COLORS.gold} />
            <Text style={[styles.xpRewardText, { color: COLORS.gold }]}>+{XP_PER_CONCEPT} XP earned</Text>
          </View>

          {/* Unlock card with entrance animation */}
          <Animated.View style={[
            styles.unlockCard,
            { backgroundColor: colors.card, borderColor: colors.borderCard },
            {
              opacity: unlockCardAnim,
              transform: [{
                scale: unlockCardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.85, 1],
                }),
              }],
            },
          ]}>
            <View style={[styles.unlockIcon, { backgroundColor: COLORS.blueLight }]}>
              <Ionicons name="lock-open" size={18} color={COLORS.blue} />
            </View>
            {isLastConcept && nextSection ? (
              <>
                <View style={[styles.newBadge, { backgroundColor: COLORS.blue }]}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
                <Text testID="unlock-label" style={[styles.unlockLabel, { color: colors.subtext }]}>New section unlocked</Text>
                <Text testID="unlock-section-name" style={[styles.unlockName, { color: colors.text }]}>{nextSection.title}</Text>
              </>
            ) : (
              <>
                <Text testID="unlock-label" style={[styles.unlockLabel, { color: colors.subtext }]}>Next concept unlocked</Text>
                <Text style={[styles.unlockName, { color: colors.text }]}>
                  {conceptIndex + 1 < section.concepts.length
                    ? section.concepts[conceptIndex + 1].name
                    : concept.name}
                </Text>
              </>
            )}
          </Animated.View>

          {/* Level progression hint */}
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
              testID="unlock-next-section-button"
              style={[btnStyles.primary, SHADOW_CTA_LOCAL]}
              onPress={() => navigation.replace('SectionMap', { sectionId: nextSection.id } as any)}
              activeOpacity={0.85}
            >
              <Text style={btnStyles.primaryText}>Go to {nextSection.title} →</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={btnStyles.secondary}
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

  // ═══════════════════════════════════════════════════════════════
  // FAILED PHASE — Encouraging, not punishing
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'failed') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
        <Animated.View style={[
          styles.resultContent,
          { opacity: resultFadeAnim, transform: [{ scale: resultScaleAnim }] },
        ]}>
          <View testID="result-icon-failed" style={[styles.resultIconWrap, { backgroundColor: COLORS.orangeLight }]}>
            <Ionicons name="reload" size={44} color={COLORS.orange} />
          </View>
          <Text style={[styles.resultTitle, { color: colors.text }]}>Almost there!</Text>
          <Text style={[styles.resultSubtitle, { color: colors.bodyText }]}>
            You missed {wrongCount} {wrongCount === 1 ? 'question' : 'questions'} — review and try again
          </Text>

          {/* Encouragement chip */}
          <View style={[styles.encourageChip, { backgroundColor: COLORS.blueLight }]}>
            <Ionicons name="sparkles" size={14} color={COLORS.blue} />
            <Text style={[styles.encourageText, { color: COLORS.blue }]}>
              Tip: Re-read the memory card before retrying
            </Text>
          </View>
        </Animated.View>

        <View style={[styles.footer, { backgroundColor: colors.screenBg }]}>
          <TouchableOpacity testID="retry-button" style={[btnStyles.primary, SHADOW_CTA_LOCAL]} onPress={resetQuiz} activeOpacity={0.85}>
            <Text style={btnStyles.primaryText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={btnStyles.secondary}
            onPress={() => { setQuestionIndex(0); setWrongCount(0); setSelectedIndex(null); setAnswerState('unanswered'); setPhase('lesson'); }}
            activeOpacity={0.85}
          >
            <Text style={btnStyles.secondaryText}>Review Lesson</Text>
          </TouchableOpacity>
          <Text style={[styles.reviewHint, { color: colors.mutedText }]}>
            Go back to the key points and memory card
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // QUIZ PHASE — Smooth, engaging, rewarding
  // ═══════════════════════════════════════════════════════════════
  const isLastQuestion = questionIndex + 1 >= concept.questions.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
      {/* ─── Header with animated progress ─── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.backIcon} />
        </TouchableOpacity>
        <View style={styles.quizProgressHeader}>
          <View testID="progress-bar" style={[styles.progressTrack, { backgroundColor: colors.borderCard }]}>
            <Animated.View style={[
              styles.progressFill,
              {
                width: progressBarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]} />
          </View>
          <Text testID="question-counter" style={[styles.questionCounter, { color: colors.subtext }]}>
            Question {questionIndex + 1} of {concept.questions.length}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ─── Concept chip + percent ─── */}
      <View style={styles.quizConceptChip}>
        <Text style={[styles.quizConceptChipText, { color: section.color }]}>{concept.name}</Text>
        <Text style={[styles.quizPercentText, { color: colors.subtext }]}>
          {Math.round(((questionIndex + 1) / concept.questions.length) * 100)}% through
        </Text>
      </View>

      {/* ─── Question card with shake ─── */}
      <Animated.View style={[
        styles.questionCard,
        { backgroundColor: colors.card, borderColor: colors.borderCard },
        { transform: [{ translateX: shakeAnim }] },
      ]}>
        <Text style={[styles.questionText, { color: colors.text }]}>{question.question}</Text>
        {isMulti && answerState === 'unanswered' && (
          <Text style={{ color: COLORS.blue, fontSize: 13, fontWeight: '600', marginTop: 6 }}>
            Select {requiredSelections} answers
          </Text>
        )}
      </Animated.View>

      {/* ─── Options with premium scale animation ─── */}
      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => (
          <Animated.View key={index} style={{ transform: [{ scale: optionScales[index] }] }}>
            <TouchableOpacity
              testID={`answer-option-${['a', 'b', 'c', 'd'][index]}`}
              style={getOptionStyle(index)}
              onPress={() => handleSelect(index)}
              activeOpacity={0.8}
              disabled={answerState !== 'unanswered'}
            >
              <View style={[
                styles.optionLetter,
                { backgroundColor: colors.inputBg },
                answerState !== 'unanswered' && isCorrectIndex(index) && { backgroundColor: COLORS.greenLight },
                isWrongSelection(index) && { backgroundColor: COLORS.redLight },
                answerState === 'unanswered' && isMulti && selectedMultiple.has(index) && { backgroundColor: COLORS.blue + '40' },
              ]}>
                <Text style={[
                  styles.optionLetterText,
                  { color: colors.bodyText },
                  answerState !== 'unanswered' && isCorrectIndex(index) && { color: COLORS.greenDark },
                  isWrongSelection(index) && { color: COLORS.redDark },
                  answerState === 'unanswered' && isMulti && selectedMultiple.has(index) && { color: COLORS.blue },
                ]}>{['A', 'B', 'C', 'D'][index]}</Text>
              </View>
              <Text style={getOptionTextStyle(index)}>{option}</Text>
              {getStatusIcon(index)}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* ─── Confirm button (multi-select) with fade-in ─── */}
      {isMulti && answerState === 'unanswered' && (
        <Animated.View style={{
          opacity: confirmOpacity,
          transform: [{ scale: confirmScale }],
          marginHorizontal: 20,
          marginTop: 8,
        }}>
          <TouchableOpacity
            testID="confirm-button"
            style={[
              selectedMultiple.size === requiredSelections ? btnStyles.primary : btnStyles.primaryDisabled,
              selectedMultiple.size === requiredSelections && SHADOW_CTA_LOCAL,
              selectedMultiple.size === requiredSelections && styles.confirmGlow,
            ]}
            onPress={handleConfirmMultiple}
            disabled={selectedMultiple.size !== requiredSelections}
            activeOpacity={0.85}
          >
            <Text style={selectedMultiple.size === requiredSelections ? btnStyles.primaryText : btnStyles.primaryDisabledText}>
              Confirm ({selectedMultiple.size}/{requiredSelections})
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ─── Feedback bar with smooth slide-up ─── */}
      {answerState !== 'unanswered' && (
        <Animated.View style={[
          styles.feedbackBar,
          { backgroundColor: answerState === 'correct' ? COLORS.greenLight : '#fff' },
          SHADOW_FEEDBACK,
          { transform: [{ translateY: feedbackAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }] },
          { opacity: feedbackAnim },
        ]}>
          <View testID={`feedback-${answerState}`} style={styles.feedbackTopRow}>
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
              <View style={{ flex: 1 }}>
                <Text style={[styles.feedbackTitle, {
                  color: answerState === 'correct' ? COLORS.greenDark : colors.text,
                }]}>
                  {answerState === 'correct' ? 'Correct!' : 'Almost there'}
                </Text>
                {answerState === 'wrong' && (
                  <Text style={[styles.feedbackAnswer, { color: colors.subtext }]}>
                    Correct: {isMulti && question.correctIndices
                      ? question.correctIndices.map(i => question.options[i]).join(', ')
                      : question.options[question.correctIndex]}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity testID="next-button" style={[btnStyles.primary, styles.nextBtn]} onPress={handleNext}>
              <Text style={btnStyles.primaryText}>{isLastQuestion ? 'Finish' : 'Next'}</Text>
            </TouchableOpacity>
          </View>
          {question.explanation && (
            <Text testID="feedback-explanation" style={[styles.feedbackExplanation, { color: colors.bodyText }]}>
              {question.explanation}
            </Text>
          )}
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ─── Local shadow for CTA ───
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
  sectionBadgeText: { fontSize: 13, fontWeight: '600' },
  conceptName: { fontSize: 26, fontWeight: '800', marginBottom: SP.lg, letterSpacing: -0.3 },

  // ─── Explanation card ───
  textCard: {
    borderRadius: CARD.borderRadius,
    padding: CARD.padding,
    marginBottom: SP.sm,
    borderWidth: 1,
    ...SHADOW_CARD_SM,
  },
  cardIconRow: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, marginBottom: SP.sm },
  iconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  conceptText: { fontSize: 15, lineHeight: 24, fontWeight: '400' },

  // ─── MEMORY CARD — The hero element ───
  memoryCard: {
    borderRadius: CARD.borderRadius,
    marginBottom: SP.md,
    borderWidth: 2,
    overflow: 'hidden' as const,
    flexDirection: 'row',
  },
  memoryAccent: {
    width: 6,
  },
  memoryInner: {
    flex: 1,
    padding: CARD.padding + 2,
  },
  memoryIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  memorySubLabel: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  memoryText: {
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
    lineHeight: 28,
    marginTop: 12,
  },

  // ─── Quiz rules ───
  rulesBox: { borderRadius: SP.sm, padding: SP.md, borderWidth: 1 },
  rulesRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rulesProgress: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.blue + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  rulesProgressText: { fontSize: 11, fontWeight: '800' },
  rulesText: { fontSize: 13, fontWeight: '600', lineHeight: 20, flex: 1 },

  unlockPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: SP.sm,
    borderWidth: 1,
    marginTop: 4,
  },
  unlockPreviewText: { fontSize: 12, fontWeight: '600', flex: 1 },

  stepIndicator: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: SP.md },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  stepText: { fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  footer: { paddingHorizontal: SP.lg, paddingBottom: SP.xl, paddingTop: SP.xs, gap: SP.sm },

  // ─── Results ───
  resultContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: SP.sm,
  },
  resultIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SP.sm,
  },
  resultTitle: { fontSize: 30, fontWeight: '900', letterSpacing: -0.3 },
  resultSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 24 },

  xpReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
  },
  xpRewardText: { fontSize: 17, fontWeight: '900' },

  unlockCard: {
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    width: '100%',
  },
  unlockIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  unlockLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  unlockName: { fontSize: 17, fontWeight: '800', marginTop: 2, textAlign: 'center' },
  newBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  newBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  // ─── Encourage chip (failed) ───
  encourageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
  },
  encourageText: { fontSize: 13, fontWeight: '600', flex: 1 },

  progressionHint: { fontSize: 12, fontWeight: '500', marginTop: 8 },
  reviewHint: { fontSize: 12, fontWeight: '500', textAlign: 'center', marginTop: -4 },

  // ─── Quiz header ───
  quizProgressHeader: { flex: 1, alignItems: 'center', gap: 4 },
  progressTrack: {
    width: '60%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.blue,
    borderRadius: 4,
  },
  questionCounter: { fontSize: 10, fontWeight: '600' },

  quizConceptChip: {
    paddingHorizontal: SP.lg,
    marginBottom: SP.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quizConceptChipText: { fontSize: 13, fontWeight: '700' },
  quizPercentText: { fontSize: 11, fontWeight: '600' },

  // ─── Question card ───
  questionCard: {
    borderRadius: CARD.borderRadius,
    padding: SP.lg,
    marginHorizontal: SP.md,
    marginBottom: SP.md,
    minHeight: 90,
    justifyContent: 'center',
    borderWidth: 1,
    ...SHADOW_CARD,
  },
  questionText: { fontSize: 17, fontWeight: '700', lineHeight: 26, textAlign: 'center' },

  // ─── Options ───
  optionsContainer: { paddingHorizontal: SP.md, gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: CTA.borderRadius,
    padding: SP.md,
    borderWidth: 2,
    gap: SP.sm,
  },
  optionLetter: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  optionLetterText: { fontSize: 13, fontWeight: '700' },
  optionText: { fontSize: 15, fontWeight: '600', flex: 1 },
  statusBadge: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },

  // ─── Confirm button glow ───
  confirmGlow: {
    shadowColor: COLORS.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },

  // ─── Feedback bar — pinned to bottom, covers safe area ───
  feedbackBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SP.md,
    paddingBottom: SP.xl + 16, // extra padding to cover safe area
    gap: SP.xs,
  },
  feedbackTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  feedbackLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  feedbackIconBg: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  feedbackTitle: { fontSize: 15, fontWeight: '800' },
  feedbackAnswer: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  feedbackXpRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  feedbackXpText: { fontSize: 13, fontWeight: '900' },
  feedbackExplanation: { fontSize: 12, fontWeight: '400', fontStyle: 'italic', paddingLeft: 40 },
  nextBtn: {
    height: 44,
    paddingHorizontal: SP.lg,
    borderBottomWidth: 3,
  },
});
