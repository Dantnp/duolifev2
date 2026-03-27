import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { sectionDataMap } from '../data/sectionDataMap';
import { isConceptComplete, getCompletedCount } from '../store/progress';
import { Ionicons } from '@expo/vector-icons';
import {
  useTheme, COLORS, SHADOW_CARD_SM, SHADOW_CARD, CARD, SP, PROGRESS, ANIM,
} from '../context/ThemeContext';

// ─── Haptic feedback ───
let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch {}
function triggerHaptic() {
  try { Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SectionMap'>;
  route: RouteProp<RootStackParamList, 'SectionMap'>;
};

export default function SectionMapScreen({ navigation, route }: Props) {
  const section = sectionDataMap[route.params.sectionId];
  const [, forceUpdate] = useState(0);
  const { colors } = useTheme();

  // Animated progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    forceUpdate(n => n + 1);
    if (section) {
      const completed = getCompletedCount(section.id, section.concepts.map(c => c.id));
      const pct = section.concepts.length > 0 ? completed / section.concepts.length : 0;
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: pct,
        duration: 500,
        delay: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, []));

  if (!section) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
        <Text style={[styles.empty, { color: colors.subtext }]}>Coming soon!</Text>
      </SafeAreaView>
    );
  }

  const completedCount = getCompletedCount(section.id, section.concepts.map(c => c.id));
  const isAllComplete = completedCount === section.concepts.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.backIcon} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.headerIconWrap, { backgroundColor: section.color + '18' }]}>
            <Ionicons name={section.icon as any} size={18} color={section.color} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{section.title}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Animated progress bar */}
      <View style={styles.progressContainer}>
        <View testID="progress-bar" style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: isAllComplete ? COLORS.green : section.color,
              },
            ]}
          />
        </View>
        <View style={styles.progressLabelRow}>
          <Text testID="section-map-progress" style={[styles.progressLabel, { color: colors.subtext }]}>
            {completedCount}/{section.concepts.length} completed
          </Text>
          {isAllComplete && (
            <View style={[styles.completeBadge, { backgroundColor: COLORS.greenLight }]}>
              <Ionicons name="checkmark-circle" size={10} color={COLORS.greenDark} />
              <Text style={[styles.completeBadgeText, { color: COLORS.greenDark }]}>All done</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {section.concepts.map((concept, index) => {
          const done = isConceptComplete(section.id, concept.id);
          const unlocked = index === 0 || isConceptComplete(section.id, section.concepts[index - 1].id);
          const isCurrent = unlocked && !done;

          return (
            <TouchableOpacity
              key={concept.id}
              testID={`concept-card-${concept.id}`}
              style={[
                styles.conceptCard,
                { backgroundColor: colors.card },
                done && { borderLeftWidth: 4, borderLeftColor: COLORS.green },
                isCurrent && { borderLeftWidth: 4, borderLeftColor: section.color },
                !unlocked && styles.conceptCardLocked,
                unlocked && SHADOW_CARD_SM,
              ]}
              onPress={() => {
                if (unlocked) {
                  triggerHaptic();
                  navigation.navigate('SectionQuiz', { sectionId: section.id, conceptIndex: index });
                }
              }}
              activeOpacity={unlocked ? 0.75 : 1}
            >
              {/* Badge */}
              <View style={[
                styles.badge,
                done
                  ? { backgroundColor: COLORS.green }
                  : unlocked
                  ? { backgroundColor: section.color }
                  : { backgroundColor: colors.borderCard },
              ]}>
                {done ? (
                  <Ionicons name="checkmark" size={18} color="#fff" />
                ) : unlocked ? (
                  <Text style={styles.badgeText}>{index + 1}</Text>
                ) : (
                  <Ionicons name="lock-closed" size={14} color="#fff" />
                )}
              </View>

              <View style={styles.conceptInfo}>
                <Text style={[styles.conceptName, { color: colors.text }, !unlocked && { color: colors.subtext }]}>
                  {concept.name}
                </Text>
                <Text style={[styles.conceptMeta, { color: colors.subtext }, !unlocked && { color: colors.border }]}>
                  {done ? 'Completed' : isCurrent ? `${concept.questions.length} questions · Ready` : `${concept.questions.length} questions`}
                </Text>
              </View>

              {isCurrent && (
                <View style={[styles.goButton, { backgroundColor: section.color }]}>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </View>
              )}
              {done && !isCurrent && (
                <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
              )}
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { textAlign: 'center', marginTop: 100, fontSize: 18 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SP.md,
    paddingVertical: SP.md,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SP.xs,
  },
  headerIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  progressContainer: {
    paddingHorizontal: SP.lg,
    paddingVertical: SP.sm,
    gap: 6,
  },
  progressTrack: {
    height: PROGRESS.height,
    borderRadius: PROGRESS.borderRadius,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: PROGRESS.borderRadius },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: { fontSize: 12, fontWeight: '500' },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  completeBadgeText: { fontSize: 10, fontWeight: '700' },
  scroll: { paddingHorizontal: SP.md, paddingTop: SP.xs },
  conceptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: CARD.borderRadius,
    padding: CARD.padding,
    marginBottom: SP.sm,
    gap: SP.md,
  },
  conceptCardLocked: { opacity: 0.5 },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  conceptInfo: { flex: 1 },
  conceptName: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  conceptMeta: { fontSize: 13, fontWeight: '500' },
  goButton: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
});
