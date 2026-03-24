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
import { useTheme } from '../context/ThemeContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Quiz'>;
  route: RouteProp<RootStackParamList, 'Quiz'>;
};

type AnswerState = 'unanswered' | 'correct' | 'wrong';

export default function QuizScreen({ navigation, route }: Props) {
  const questions = route.params?.questions ?? defaultQuestions;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  const [score, setScore] = useState(0);
  const shakeAnim = useRef(new Animated.Value(0)).current;
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.altBg }]}>


      <View style={styles.header}>
        <Text style={[styles.questionCount, { color: colors.subtext }]}>
          {currentIndex + 1} / {questions.length}
        </Text>
        <View style={[styles.progressBar, { backgroundColor: colors.borderCard }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <Animated.View style={[styles.questionCard, { backgroundColor: colors.card, transform: [{ translateX: shakeAnim }] }]}>
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
          </TouchableOpacity>
        ))}
      </View>

      {answerState !== 'unanswered' && (
        <View style={[styles.feedbackBar, answerState === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <Text style={styles.feedbackIcon}>
            {answerState === 'correct' ? '🎉' : '❌'}
          </Text>
          <Text style={styles.feedbackText}>
            {answerState === 'correct' ? 'Correct!' : `Correct answer: ${question.options[question.correctIndex]}`}
          </Text>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentIndex + 1 >= questions.length ? 'FINISH' : 'NEXT'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  questionCount: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1cb0f6',
    borderRadius: 5,
  },
  questionCard: {
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
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
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  optionCorrect: {
    borderColor: '#1a56db',
    backgroundColor: '#eff6ff',
  },
  optionWrong: {
    borderColor: '#ff4b4b',
    backgroundColor: '#fff0f0',
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLetterText: {
    fontSize: 14,
    fontWeight: '800',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  optionTextCorrect: {
    color: '#1a56db',
  },
  optionTextWrong: {
    color: '#ff4b4b',
  },
  feedbackBar: {
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  feedbackCorrect: {
    backgroundColor: '#dbeafe',
  },
  feedbackWrong: {
    backgroundColor: '#ffd7d7',
  },
  feedbackIcon: {
    fontSize: 22,
  },
  feedbackText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  nextButton: {
    backgroundColor: '#1cb0f6',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
