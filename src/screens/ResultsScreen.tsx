import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Results'>;
  route: RouteProp<RootStackParamList, 'Results'>;
};

export default function ResultsScreen({ navigation, route }: Props) {
  const { score, total } = route.params;
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 75;
  const { colors } = useTheme();

  function getGrade() {
    if (percentage === 100) return { label: 'Perfect!', emoji: '🏆', color: '#ffd700' };
    if (percentage >= 75) return { label: 'Passed!', emoji: '🎉', color: '#1a56db' };
    if (percentage >= 50) return { label: 'Nearly there', emoji: '📚', color: '#ff9f1a' };
    return { label: 'Keep practising', emoji: '💪', color: '#ff4b4b' };
  }

  const grade = getGrade();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.altBg }]}>


      <View style={styles.topSection}>
        <Text style={styles.gradeEmoji}>{grade.emoji}</Text>
        <Text style={[styles.gradeLabel, { color: colors.text }]}>{grade.label}</Text>
        <Text style={[styles.passStatus, { color: colors.subtext }]}>
          {passed ? 'You would pass!' : 'You would not pass yet'}
        </Text>
      </View>

      <View style={[styles.scoreCard, { backgroundColor: colors.card }]}>
        <View style={[styles.scoreCircle, { borderColor: grade.color }]}>
          <Text style={[styles.scorePercent, { color: grade.color }]}>{percentage}%</Text>
          <Text style={[styles.scoreDetails, { color: colors.subtext }]}>{score} / {total}</Text>
        </View>

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownNumber, { color: colors.text }]}>{score}</Text>
            <Text style={[styles.breakdownLabel, { color: colors.accentText }]}>Correct</Text>
          </View>
          <View style={[styles.breakdownDivider, { backgroundColor: colors.border }]} />
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownNumber, { color: colors.text }]}>{total - score}</Text>
            <Text style={[styles.breakdownLabel, { color: '#ff4b4b' }]}>Wrong</Text>
          </View>
          <View style={[styles.breakdownDivider, { backgroundColor: colors.border }]} />
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownNumber, { color: colors.text }]}>75%</Text>
            <Text style={[styles.breakdownLabel, { color: colors.subtext }]}>Pass mark</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.replace('Quiz', {})}
          activeOpacity={0.85}
        >
          <Text style={styles.retryButtonText}>TRY AGAIN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.homeButton, { backgroundColor: colors.card, borderColor: colors.borderCard }]}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.85}
        >
          <Text style={[styles.homeButtonText, { color: colors.bodyText }]}>HOME</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
  },
  gradeEmoji: { fontSize: 72, marginBottom: 12 },
  gradeLabel: { fontSize: 32, fontWeight: '800' },
  passStatus: { fontSize: 16, marginTop: 6 },
  scoreCard: {
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 32,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  scorePercent: { fontSize: 40, fontWeight: '900' },
  scoreDetails: { fontSize: 14, fontWeight: '600' },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  breakdownItem: { alignItems: 'center', flex: 1 },
  breakdownNumber: { fontSize: 24, fontWeight: '800' },
  breakdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakdownDivider: { width: 1, height: 36 },
  buttons: { width: '100%', gap: 12 },
  retryButton: {
    backgroundColor: '#1cb0f6',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#1cb0f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  retryButtonText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  homeButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
  },
  homeButtonText: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
});
