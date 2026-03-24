import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, SectionData } from '../types';
import { sections } from '../data/sections';
import { useTheme } from '../context/ThemeContext';
import { isSectionComplete, getCompletedCount, isConceptComplete, getBestScore } from '../store/progress';
import { whatIsUKSection } from '../data/whatIsUK';
import { valuesAndPrinciplesSection } from '../data/valuesAndPrinciples';
import { historyOfUKSection } from '../data/historyOfUK';
import { modernSocietySection } from '../data/modernSociety';
import { governmentAndLawSection } from '../data/governmentAndLaw';

const sectionDataMap: Record<number, SectionData> = {
  1: whatIsUKSection,
  2: valuesAndPrinciplesSection,
  3: historyOfUKSection,
  4: modernSocietySection,
  5: governmentAndLawSection,
};

const DIFFICULTY: Record<number, { label: string; tag: string; color: string }> = {
  1: { label: 'Beginner', tag: '\u{1F7E2}', color: '#22c55e' },
  2: { label: 'Intermediate', tag: '\u{1F7E1}', color: '#f59e0b' },
  3: { label: 'Intermediate', tag: '\u{1F7E1}', color: '#f59e0b' },
  4: { label: 'Advanced', tag: '\u{1F534}', color: '#ef4444' },
  5: { label: 'Advanced', tag: '\u{1F534}', color: '#ef4444' },
};

const UNLOCK_MESSAGES: Record<number, string> = {
  2: 'Prove your basics to unlock Values & Principles',
  3: 'Master values to explore UK History',
  4: 'Know the past to understand modern life',
  5: 'Understand society to tackle Government & Law',
};

function isSectionUnlocked(index: number): boolean {
  if (index === 0) return true;
  const prevSection = sections[index - 1];
  const prevData = sectionDataMap[prevSection.id];
  if (!prevData) return false;
  return isSectionComplete(prevSection.id, prevData.concepts.map(c => c.id));
}

function findContinuePoint(): { sectionIndex: number; conceptIndex: number } | null {
  for (let si = 0; si < sections.length; si++) {
    if (!isSectionUnlocked(si)) continue;
    const sec = sections[si];
    const data = sectionDataMap[sec.id];
    if (!data) continue;
    const conceptIds = data.concepts.map(c => c.id);
    if (isSectionComplete(sec.id, conceptIds)) continue;
    for (let ci = 0; ci < data.concepts.length; ci++) {
      if (!isConceptComplete(sec.id, data.concepts[ci].id)) {
        return { sectionIndex: si, conceptIndex: ci };
      }
    }
  }
  return null;
}

function getTotalProgress(): number {
  let total = 0;
  let done = 0;
  for (const sec of sections) {
    const data = sectionDataMap[sec.id];
    if (!data) continue;
    total += data.concepts.length;
    done += getCompletedCount(sec.id, data.concepts.map(c => c.id));
  }
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

export default function LearnScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const [, forceUpdate] = useState(0);

  useFocusEffect(
    useCallback(() => {
      forceUpdate(n => n + 1);
    }, [])
  );

  const totalPct = getTotalProgress();
  const continuePoint = findContinuePoint();
  const continueSection = continuePoint ? sections[continuePoint.sectionIndex] : null;
  const continueSectionData = continueSection ? sectionDataMap[continueSection.id] : null;
  const continueConcept = continueSectionData && continuePoint
    ? continueSectionData.concepts[continuePoint.conceptIndex]
    : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
      {/* ===== HEADER WITH JOURNEY PROGRESS ===== */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Your Journey</Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]}>
              {totalPct === 0
                ? 'Start your path to citizenship'
                : totalPct === 100
                  ? 'You\'ve completed all sections!'
                  : `You're ${totalPct}% ready for the test`}
            </Text>
          </View>
        </View>

        {/* Overall progress bar — loud + meaningful */}
        <View style={styles.overallProgressWrap}>
          <View style={styles.overallBarRow}>
            <View style={[styles.overallBar, { backgroundColor: colors.border }]}>
              <View style={[styles.overallBarFill, { width: `${Math.max(totalPct, totalPct > 0 ? 3 : 0)}%` }]} />
            </View>
            <Text style={styles.overallPct}>{totalPct}%</Text>
          </View>
          {continueSection && (
            <Text style={[styles.currentFocus, { color: '#1a56db' }]}>
              Current focus: {continueSection.emoji} {continueSection.title}
            </Text>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {/* ===== CONTINUE WHERE YOU LEFT OFF ===== */}
        {continuePoint && continueConcept && continueSection && (
          <TouchableOpacity
            style={[styles.continueCard, { backgroundColor: '#eef4ff' }]}
            onPress={() => navigation.navigate('SectionQuiz', {
              sectionId: continueSection.id,
              conceptIndex: continuePoint.conceptIndex,
            })}
            activeOpacity={0.75}
          >
            <View style={styles.continueHeader}>
              <Text style={styles.continueIcon}>▶️</Text>
              <Text style={[styles.continueLabel, { color: '#6b7280' }]}>Continue where you left off</Text>
            </View>
            <Text style={[styles.continueSectionName, { color: '#6b7280' }]}>
              {continueSection.emoji} {continueSection.title}
            </Text>
            <Text style={[styles.continueName, { color: '#111' }]}>
              {continueConcept.name}
            </Text>
            <Text style={[styles.continueTime, { color: '#6b7280' }]}>
              ⚡ Takes ~2 minutes
            </Text>
            <View style={styles.continueCta}>
              <Text style={styles.continueCtaText}>Continue</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ===== SECTION CARDS ===== */}
        {sections.map((section, index) => {
          const unlocked = isSectionUnlocked(index);
          const data = sectionDataMap[section.id];
          const conceptIds = data ? data.concepts.map(c => c.id) : [];
          const completedCount = data ? getCompletedCount(section.id, conceptIds) : 0;
          const totalConcepts = data ? data.concepts.length : 0;
          const sectionPct = totalConcepts > 0 ? Math.round((completedCount / totalConcepts) * 100) : 0;
          const bestScore = getBestScore(section.id);
          const difficulty = DIFFICULTY[section.id] || DIFFICULTY[1];
          const isComplete = totalConcepts > 0 && completedCount === totalConcepts;
          const isCurrent = continuePoint?.sectionIndex === index;

          return (
            <TouchableOpacity
              key={section.id}
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
                isCurrent && { borderColor: section.color, borderWidth: 2.5 },
                !unlocked && styles.cardLocked,
              ]}
              onPress={() => unlocked && navigation.navigate('SectionMap', { sectionId: section.id })}
              activeOpacity={unlocked ? 0.8 : 1}
            >
              {/* Top row: icon + info + difficulty */}
              <View style={styles.cardRow}>
                <View style={[styles.iconBg, { backgroundColor: section.color + '22' }]}>
                  <Text style={styles.emoji}>{section.emoji}</Text>
                </View>
                <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.name, { color: colors.text }]}>{section.title}</Text>
                    {isCurrent && (
                      <View style={[styles.recommendedBadge, { backgroundColor: section.color + '20' }]}>
                        <Text style={[styles.recommendedText, { color: section.color }]}>Recommended</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={[styles.diffTag, { color: difficulty.color }]}>
                      {difficulty.tag} {difficulty.label}
                    </Text>
                    <Text style={[styles.metaDot, { color: colors.subtext }]}> · </Text>
                    <Text style={[styles.meta, { color: colors.subtext }]}>
                      {totalConcepts} concepts · {section.totalQuestions} questions
                    </Text>
                  </View>
                </View>
              </View>

              {/* Progress section (only if unlocked) */}
              {unlocked && totalConcepts > 0 && (
                <View style={styles.progressSection}>
                  <View style={styles.progressBarRow}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${Math.max(sectionPct, sectionPct > 0 ? 3 : 0)}%`, backgroundColor: section.color },
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressPct, { color: section.color }]}>{sectionPct}%</Text>
                  </View>
                  <View style={styles.progressStats}>
                    <Text style={[styles.progressText, { color: colors.bodyText }]}>
                      {isComplete
                        ? '✅ All concepts completed'
                        : completedCount === 0
                          ? 'Start your first concept'
                          : `${completedCount} of ${totalConcepts} concepts completed`}
                    </Text>
                    {bestScore >= 0 ? (
                      <Text style={[styles.bestScore, { color: '#f59e0b' }]}>
                        ⭐ Best: {bestScore}%
                      </Text>
                    ) : !isComplete ? (
                      <Text style={[styles.inlineArrow, { color: section.color }]}>
                        {completedCount === 0 ? 'Start' : 'Continue'} →
                      </Text>
                    ) : null}
                  </View>
                </View>
              )}

              {/* Lock message (actionable) */}
              {!unlocked && (
                <View style={styles.lockRow}>
                  <Text style={styles.lockIcon}>🔒</Text>
                  <Text style={[styles.lockText, { color: colors.mutedText }]}>
                    {index > 0
                      ? `Complete '${sections[index - 1].title}' to unlock`
                      : 'Complete previous section to unlock'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { fontSize: 14, marginTop: 4, fontWeight: '600' },
  overallProgressWrap: { marginTop: 14 },
  overallBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  overallBar: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  overallBarFill: { height: 10, borderRadius: 5, backgroundColor: '#1a56db' },
  overallPct: { fontSize: 16, fontWeight: '900', color: '#1a56db', minWidth: 38 },
  currentFocus: { fontSize: 12, fontWeight: '800', marginTop: 6 },

  // List
  list: { padding: 16, gap: 12, paddingBottom: 24 },

  // Continue card — PRIMARY ACTION, visually dominant
  continueCard: {
    borderRadius: 18,
    padding: 18,
    borderLeftWidth: 5,
    borderLeftColor: '#1a56db',
    shadowColor: '#1a56db',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  continueHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  continueIcon: { fontSize: 14 },
  continueLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  continueSectionName: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  continueName: { fontSize: 17, fontWeight: '900', marginBottom: 4 },
  continueTime: { fontSize: 12, fontWeight: '700', marginBottom: 12 },
  continueCta: {
    backgroundColor: '#1a56db',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#1439a8',
  },
  continueCtaText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 0.3 },

  // Section cards
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLocked: { opacity: 0.5 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: 15, fontWeight: '800' },
  recommendedBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  recommendedText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' },
  diffTag: { fontSize: 12, fontWeight: '700' },
  metaDot: { fontSize: 12 },
  meta: { fontSize: 12 },

  // Progress
  progressSection: { marginTop: 12 },
  progressBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 6, borderRadius: 3 },
  progressPct: { fontSize: 12, fontWeight: '900', minWidth: 30 },
  progressStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  progressText: { fontSize: 12, fontWeight: '700' },
  bestScore: { fontSize: 12, fontWeight: '700' },

  // Inline arrow (subtle section-level CTA)
  inlineArrow: { fontSize: 12, fontWeight: '800' },

  // Lock
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  lockIcon: { fontSize: 13 },
  lockText: { fontSize: 12, fontWeight: '600', fontStyle: 'italic', flex: 1 },
});
