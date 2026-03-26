import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { questions as defaultQuestions } from '../data/questions';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, COLORS, ANSWER, SHADOW_CARD, SHADOW_FEEDBACK, CARD, CTA, SP, PROGRESS, btnStyles } from '../context/ThemeContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Quiz'>;
  route: RouteProp<RootStackParamList, 'Quiz'>;
};

type AnswerState = 'unanswered' | 'correct' | 'wrong';

export default function QuizScreen({ navigation, route }: Props) {
  const questions = (route.params?.questions ?? defaultQuestions).slice(0, 3);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  const [score, setScore] = useState(0);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();

  const question = questions[currentIndex];
  const progress = (currentIndex + 1) / questions.length;

  function handleSelect(index: number) {
    if (answerState !== 'unanswered') return;
    setSelectedIndex(index);

    if (index === question.correctIndex) {
      setAnswerState('correct');
      setScore((s) => s + 1);
    } else {
      setAnswerState('wrong');
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
    // Slide up feedback bar
    feedbackAnim.setValue(0);
    Animated.spring(feedbackAnim, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 4 }).start();
  }

  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      navigation.replace('Results', { score, total: questions.length });
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
      setAnswerState('unanswered');
    }
  }

  function getOptionStyle(index: number) {
    if (answerState === 'unanswered') {
      return [styles.option, { backgroundColor: colors.card, borderColor: colors.borderCard }];
    }
    if (index === question.correctIndex) {
      return [styles.option, { borderColor: ANSWER.correct.border, backgroundColor: ANSWER.correct.bg }];
    }
    if (index === selectedIndex && answerState === 'wrong') {
      return [styles.option, { borderColor: ANSWER.wrong.border, backgroundColor: ANSWER.wrong.bg }];
    }
    return [styles.option, { backgroundColor: colors.card, borderColor: colors.borderCard, opacity: 0.5 }];
  }

  function getOptionTextStyle(index: number) {
    if (answerState === 'unanswered') return [styles.optionText, { color: colors.bodyText }];
    if (index === question.correctIndex) return [styles.optionText, { color: ANSWER.correct.text }];
    if (index === selectedIndex && answerState === 'wrong') return [styles.optionText, { color: ANSWER.wrong.text }];
    return [styles.optionText, { color: colors.subtext }];
  }

  function getStatusIcon(index: number) {
    if (answerState === 'unanswered') return null;
    if (index === question.correctIndex) return (
      <View style={styles.statusBadge}><Ionicons name="checkmark" size={12} color="#fff" /></View>
    );
    if (index === selectedIndex && answerState === 'wrong') return (
      <View style={[styles.statusBadge, styles.statusBadgeWrong]}><Ionicons name="close" size={12} color="#fff" /></View>
    );
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
      <View style={styles.header}>
        <Text style={[styles.questionCount, { color: colors.subtext }]}>
          {currentIndex + 1} / {questions.length}
        </Text>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <Animated.View style={[styles.questionCard, { backgroundColor: colors.card }, SHADOW_CARD, { transform: [{ translateX: shakeAnim }] }]}>
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
              <Text style={[styles.optionLetterText, { color: colors.bodyText }]}>
                {['A', 'B', 'C', 'D'][index]}
              </Text>
            </View>
            <Text style={getOptionTextStyle(index)}>{option}</Text>
            {getStatusIcon(index)}
          </TouchableOpacity>
        ))}
      </View>

      {answerState !== 'unanswered' && (
        <Animated.View style={[
          styles.feedbackBar,
          answerState === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong,
          SHADOW_FEEDBACK,
          { transform: [{ translateY: feedbackAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }] },
          { opacity: feedbackAnim },
        ]}>
          <View style={[styles.feedbackIconBg, { backgroundColor: answerState === 'correct' ? COLORS.green : COLORS.red + '20' }]}>
            <Ionicons name={answerState === 'correct' ? 'checkmark' : 'close'} size={16} color={answerState === 'correct' ? '#fff' : COLORS.red} />
          </View>
          <Text style={[styles.feedbackText, { color: colors.bodyText }]}>
            {answerState === 'correct' ? 'Correct!' : `Correct answer: ${question.options[question.correctIndex]}`}
          </Text>
          <TouchableOpacity style={[btnStyles.primary, styles.nextButton]} onPress={handleNext}>
            <Text style={btnStyles.primaryText}>
              {currentIndex + 1 >= questions.length ? 'FINISH' : 'NEXT'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SP.lg,
  },
  header: {
    paddingTop: SP.md,
    paddingBottom: SP.xs,
  },
  questionCount: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: SP.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressBar: {
    height: PROGRESS.height,
    borderRadius: PROGRESS.borderRadius,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.blue,
    borderRadius: PROGRESS.borderRadius,
  },
  questionCard: {
    borderRadius: CARD.borderRadius,
    padding: SP.xl,
    marginTop: SP.lg,
    marginBottom: SP.lg,
    minHeight: 120,
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    textAlign: 'center',
  },
  optionsContainer: {
    flex: 1,
    gap: SP.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: CTA.borderRadius,
    padding: SP.md,
    borderWidth: 2,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SP.sm,
  },
  optionLetterText: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: SP.xs,
  },
  statusBadgeWrong: {
    backgroundColor: COLORS.red + '90',
  },
  feedbackBar: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SP.md,
    marginTop: SP.md,
    marginBottom: SP.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.sm,
  },
  feedbackCorrect: {
    backgroundColor: '#FFFFFF',
  },
  feedbackWrong: {
    backgroundColor: '#FFFFFF',
  },
  feedbackIconBg: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  feedbackText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  nextButton: {
    height: 44,
    paddingHorizontal: SP.lg,
    borderBottomWidth: 3,
  },
});
