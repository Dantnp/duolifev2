import React, { useRef, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { useTheme, COLORS, SP, CTA, CARD, btnStyles } from '../context/ThemeContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Results'>;
  route: RouteProp<RootStackParamList, 'Results'>;
};

export default function ResultsScreen({ navigation, route }: Props) {
  const { score, total } = route.params;
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 75;
  const { colors } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 8 }),
    ]).start();
  }, []);

  function getGrade(): { label: string; icon: string; color: string; bgColor: string } {
    if (percentage === 100) return { label: 'Perfect!', icon: 'trophy', color: COLORS.gold, bgColor: COLORS.goldLight };
    if (percentage >= 75) return { label: 'Passed!', icon: 'checkmark-circle', color: COLORS.green, bgColor: COLORS.greenLight };
    if (percentage >= 50) return { label: 'Nearly there', icon: 'book-outline', color: COLORS.orange, bgColor: COLORS.orangeLight };
    return { label: 'Keep going', icon: 'reload', color: COLORS.red, bgColor: COLORS.redLight };
  }

  const grade = getGrade();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
      <Animated.View style={[styles.topSection, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.gradeIconWrap, { backgroundColor: grade.bgColor }]}>
          <Ionicons name={grade.icon as any} size={40} color={grade.color} />
        </View>
        <Text style={[styles.gradeLabel, { color: colors.text }]}>{grade.label}</Text>
        <Text style={[styles.passStatus, { color: passed ? COLORS.greenDark : colors.subtext }]}>
          {passed ? 'You would pass the test!' : 'Not quite there yet — keep practising'}
        </Text>
      </Animated.View>

      <View style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: colors.borderCard }]}>
        <View style={[styles.scoreCircle, { borderColor: grade.color }]}>
          <Text style={[styles.scorePercent, { color: grade.color }]}>{percentage}%</Text>
          <Text style={[styles.scoreDetails, { color: colors.subtext }]}>{score} / {total}</Text>
        </View>

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownNumber, { color: COLORS.greenDark }]}>{score}</Text>
            <Text style={[styles.breakdownLabel, { color: COLORS.green }]}>Correct</Text>
          </View>
          <View style={[styles.breakdownDivider, { backgroundColor: colors.border }]} />
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownNumber, { color: COLORS.redDark }]}>{total - score}</Text>
            <Text style={[styles.breakdownLabel, { color: COLORS.red }]}>Wrong</Text>
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
          style={[btnStyles.primary, styles.ctaShadow]}
          onPress={() => navigation.replace('Quiz', {})}
          activeOpacity={0.85}
        >
          <Text style={btnStyles.primaryText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={btnStyles.secondary}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.85}
        >
          <Text style={btnStyles.secondaryText}>Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SP.xl,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 28,
  },
  gradeIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SP.sm,
  },
  gradeLabel: { fontSize: 28, fontWeight: '800' },
  passStatus: { fontSize: 14, marginTop: 6, fontWeight: '500', textAlign: 'center' },
  scoreCard: {
    borderRadius: CARD.borderRadius,
    padding: SP.xl,
    width: '100%',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
  },
  scoreCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SP.lg,
  },
  scorePercent: { fontSize: 36, fontWeight: '800' },
  scoreDetails: { fontSize: 13, fontWeight: '500' },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  breakdownItem: { alignItems: 'center', flex: 1 },
  breakdownNumber: { fontSize: 22, fontWeight: '800' },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakdownDivider: { width: 1, height: 32 },
  buttons: { width: '100%', gap: SP.sm },
  ctaShadow: {
    shadowColor: COLORS.blueDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
});
