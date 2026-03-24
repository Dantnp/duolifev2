import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { whatIsUKSection } from '../data/whatIsUK';
import { valuesAndPrinciplesSection } from '../data/valuesAndPrinciples';
import { historyOfUKSection } from '../data/historyOfUK';
import { modernSocietySection } from '../data/modernSociety';
import { governmentAndLawSection } from '../data/governmentAndLaw';
import { isConceptComplete, getCompletedCount } from '../store/progress';
import { useTheme } from '../context/ThemeContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SectionMap'>;
  route: RouteProp<RootStackParamList, 'SectionMap'>;
};

const sectionMap_data: Record<number, typeof whatIsUKSection> = {
  1: whatIsUKSection,
  2: valuesAndPrinciplesSection,
  3: historyOfUKSection,
  4: modernSocietySection,
  5: governmentAndLawSection,
};

export default function SectionMapScreen({ navigation, route }: Props) {
  const section = sectionMap_data[route.params.sectionId];
  const [, forceUpdate] = useState(0);
  const { colors } = useTheme();

  useFocusEffect(
    useCallback(() => {
      forceUpdate(n => n + 1);
    }, [])
  );

  if (!section) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
        <Text style={[styles.empty, { color: colors.subtext }]}>Coming soon!</Text>
      </SafeAreaView>
    );
  }

  const completedCount = getCompletedCount(
    section.id,
    section.concepts.map(c => c.id)
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>


      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: colors.backIcon }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>{section.emoji}</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{section.title}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(completedCount / section.concepts.length) * 100}%`,
                backgroundColor: section.color,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressLabel, { color: colors.subtext }]}>
          {completedCount}/{section.concepts.length} completed
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {section.concepts.map((concept, index) => {
          const done = isConceptComplete(section.id, concept.id);
          const unlocked = index === 0 || isConceptComplete(section.id, section.concepts[index - 1].id);

          return (
            <TouchableOpacity
              key={concept.id}
              style={[
                styles.conceptCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                done && { borderColor: '#1a56db33', backgroundColor: colors.cardAlt },
                !unlocked && styles.conceptCardLocked,
              ]}
              onPress={() => {
                if (unlocked) {
                  navigation.navigate('SectionQuiz', {
                    sectionId: section.id,
                    conceptIndex: index,
                  });
                }
              }}
              activeOpacity={unlocked ? 0.75 : 1}
            >
              <View style={[
                styles.badge,
                done
                  ? { backgroundColor: '#1a56db' }
                  : unlocked
                  ? { backgroundColor: section.color }
                  : { backgroundColor: colors.borderCard },
              ]}>
                {done ? (
                  <Text style={styles.badgeText}>✓</Text>
                ) : unlocked ? (
                  <Text style={styles.badgeText}>{index + 1}</Text>
                ) : (
                  <Text style={styles.badgeText}>🔒</Text>
                )}
              </View>

              <View style={styles.conceptInfo}>
                <Text style={[styles.conceptName, { color: colors.text }, !unlocked && { color: colors.subtext }]}>
                  {concept.name}
                </Text>
                <Text style={[styles.conceptMeta, { color: colors.subtext }, !unlocked && { color: colors.border }]}>
                  {done ? '✅ Completed' : `${concept.questions.length} questions • all correct to pass`}
                </Text>
              </View>

              {unlocked && !done && (
                <Text style={[styles.chevron, { color: section.color }]}>›</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24 },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerEmoji: { fontSize: 22 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabel: { fontSize: 12, fontWeight: '600', textAlign: 'right' },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  conceptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  conceptCardLocked: { opacity: 0.5 },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  conceptInfo: { flex: 1 },
  conceptName: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  conceptMeta: { fontSize: 12, fontWeight: '500' },
  chevron: { fontSize: 24, fontWeight: '300' },
});
