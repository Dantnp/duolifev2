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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, SectionData } from '../types';
import { sections } from '../data/sections';
import {
  useTheme, SHADOW_CARD, SHADOW_CARD_SM, COLORS, ANIM,
} from '../context/ThemeContext';
import { isSectionComplete, getCompletedCount, isConceptComplete, XP_PER_CONCEPT } from '../store/progress';
import { sectionDataMap } from '../data/sectionDataMap';

// ─── Haptic feedback ───
let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch {}
function triggerHaptic() {
  try { Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
}

const DIFFICULTY: Record<number, { label: string; color: string }> = {
  1: { label: 'Beginner', color: '#22c55e' },
  2: { label: 'Intermediate', color: '#f59e0b' },
  3: { label: 'Intermediate', color: '#f59e0b' },
  4: { label: 'Advanced', color: '#ef4444' },
  5: { label: 'Advanced', color: '#ef4444' },
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

function getTotalProgress(): { pct: number; done: number; total: number } {
  let total = 0;
  let done = 0;
  for (const sec of sections) {
    const data = sectionDataMap[sec.id];
    if (!data) continue;
    total += data.concepts.length;
    done += getCompletedCount(sec.id, data.concepts.map(c => c.id));
  }
  return { pct: total > 0 ? Math.round((done / total) * 100) : 0, done, total };
}

function getSectionEstMinutes(data: SectionData): number {
  const totalQ = data.concepts.reduce((sum, c) => sum + (c.questions?.length ?? 0), 0);
  return Math.max(1, Math.round((totalQ * 20) / 60));
}

export default function LearnScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const [, forceUpdate] = useState(0);

  // ─── Animated progress bars per section ───
  const sectionBarAnims = useRef(sections.map(() => new Animated.Value(0))).current;
  const totalBarAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      forceUpdate(n => n + 1);

      // Animate total progress
      const { pct } = getTotalProgress();
      totalBarAnim.setValue(0);
      Animated.timing(totalBarAnim, {
        toValue: pct / 100,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      // Animate each section progress bar
      sections.forEach((sec, i) => {
        const data = sectionDataMap[sec.id];
        if (!data) return;
        const conceptIds = data.concepts.map(c => c.id);
        const completed = getCompletedCount(sec.id, conceptIds);
        const pctVal = data.concepts.length > 0 ? completed / data.concepts.length : 0;
        sectionBarAnims[i].setValue(0);
        Animated.timing(sectionBarAnims[i], {
          toValue: pctVal,
          duration: ANIM.progressBar + i * 80, // staggered
          delay: 100 + i * 50,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
      });
    }, [])
  );

  const { pct: totalPct, done: totalDone, total: totalConcepts } = getTotalProgress();
  const continuePoint = findContinuePoint();
  const continueSection = continuePoint ? sections[continuePoint.sectionIndex] : null;
  const continueSectionData = continueSection ? sectionDataMap[continueSection.id] : null;
  const continueConcept = continueSectionData && continuePoint
    ? continueSectionData.concepts[continuePoint.conceptIndex]
    : null;

  const completedSections = sections.filter((sec) => {
    const data = sectionDataMap[sec.id];
    if (!data) return false;
    return isSectionComplete(sec.id, data.concepts.map(c => c.id));
  }).length;

  const goToCurrentLesson = () => {
    if (continuePoint && continueSection) {
      triggerHaptic();
      navigation.navigate('SectionQuiz', {
        sectionId: continueSection.id,
        conceptIndex: continuePoint.conceptIndex,
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
      {/* ═══════ HEADER ═══════ */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Learn</Text>
          <Text style={[styles.headerSub, { color: colors.subtext }]}>
            {totalDone}/{totalConcepts} concepts · {completedSections}/{sections.length} sections
          </Text>
        </View>
        <View style={[styles.headerPill, { backgroundColor: totalPct > 0 ? COLORS.blueLight : colors.chipBg }]}>
          <Text style={[styles.headerPillText, { color: totalPct > 0 ? COLORS.blue : colors.subtext }]}>
            {totalPct}%
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════ RESUME CHIP ═══════ */}
        {continuePoint && continueConcept && continueSection && (
          <TouchableOpacity
            testID="continue-button"
            style={[styles.resumeChip, { backgroundColor: COLORS.blueLight, borderColor: COLORS.blue + '30' }]}
            onPress={goToCurrentLesson}
            activeOpacity={0.8}
          >
            <View style={styles.resumeLeft}>
              <View style={styles.resumePlayIcon}>
                <Ionicons name="play" size={12} color="#fff" />
              </View>
              <View style={styles.resumeTextWrap}>
                <Text style={[styles.resumeLabel, { color: COLORS.blue }]}>Resume</Text>
                <Text style={[styles.resumeName, { color: COLORS.blueDark }]} numberOfLines={1}>
                  {continueConcept.name}
                </Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={16} color={COLORS.blue} />
          </TouchableOpacity>
        )}

        {/* ═══════ ALL SECTIONS ═══════ */}
        <Text style={[styles.sectionHeading, { color: colors.text }]}>All Sections</Text>

        {sections.map((section, index) => {
          const unlocked = isSectionUnlocked(index);
          const data = sectionDataMap[section.id];
          const conceptIds = data ? data.concepts.map(c => c.id) : [];
          const completedCount = data ? getCompletedCount(section.id, conceptIds) : 0;
          const totalConceptsInSection = data ? data.concepts.length : 0;
          const sectionPct = totalConceptsInSection > 0 ? Math.round((completedCount / totalConceptsInSection) * 100) : 0;
          const difficulty = DIFFICULTY[section.id] || DIFFICULTY[1];
          const isComplete = totalConceptsInSection > 0 && completedCount === totalConceptsInSection;
          const isCurrent = continuePoint?.sectionIndex === index;
          const sectionXP = totalConceptsInSection * XP_PER_CONCEPT;
          const sectionTime = data ? getSectionEstMinutes(data) : 0;

          const firstLockedIndex = sections.findIndex((_, i) => !isSectionUnlocked(i));
          const isFirstLocked = !unlocked && index === firstLockedIndex;

          return (
            <TouchableOpacity
              key={section.id}
              testID={unlocked ? `learn-card-${section.slug}` : `locked-section-card-${section.slug}`}
              style={[
                styles.sectionCard,
                { backgroundColor: colors.card, borderColor: colors.borderCard },
                unlocked && SHADOW_CARD_SM,
                isCurrent && { borderColor: COLORS.blue + '50', borderWidth: 1.5 },
                isComplete && { borderColor: COLORS.green + '50', borderWidth: 1.5 },
                !unlocked && (isFirstLocked ? styles.cardLockedNext : styles.cardLockedFar),
              ]}
              onPress={() => {
                if (unlocked) {
                  triggerHaptic();
                  navigation.navigate('SectionMap', { sectionId: section.id });
                }
              }}
              activeOpacity={unlocked ? 0.8 : 1}
            >
              <View style={styles.cardRow}>
                <View style={[styles.iconBg, { backgroundColor: unlocked ? section.color + '18' : COLORS.iconBg }]}>
                  <Ionicons name={section.icon as any} size={21} color={unlocked ? section.color : colors.mutedText} />
                </View>
                <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.cardTitle, { color: unlocked ? colors.text : colors.subtext }]}>
                      {section.title}
                    </Text>
                    {isComplete && (
                      <View style={[styles.badge, { backgroundColor: COLORS.greenLight }]}>
                        <Ionicons name="checkmark-circle" size={10} color={COLORS.greenDark} style={{ marginRight: 2 }} />
                        <Text style={[styles.badgeText, { color: COLORS.greenDark }]}>Complete</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.metaRow}>
                    <View style={[styles.diffDot, { backgroundColor: unlocked ? difficulty.color : colors.mutedText }]} />
                    <Text style={[styles.diffTag, { color: unlocked ? difficulty.color : colors.mutedText }]}>
                      {difficulty.label}
                    </Text>
                    <Text style={[styles.metaDot, { color: colors.subtext }]}> · </Text>
                    <Text style={[styles.meta, { color: unlocked ? colors.subtext : colors.mutedText }]}>
                      {totalConceptsInSection} topics · ~{sectionTime} min
                    </Text>
                  </View>
                </View>
                {unlocked && <Ionicons name="chevron-forward" size={16} color={colors.subtext} />}
                {!unlocked && <Ionicons name="lock-closed" size={14} color={colors.mutedText} />}
              </View>

              {/* Animated progress bar */}
              {unlocked && totalConceptsInSection > 0 && (
                <View style={styles.progressSection}>
                  <View style={styles.progressBarRow}>
                    <View testID={`progress-bar-${section.slug}`} style={[styles.progressBar, { backgroundColor: colors.border }]}>
                      <Animated.View style={[styles.progressBarFill, {
                        width: sectionBarAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                        backgroundColor: isComplete ? COLORS.green : section.color,
                      }]} />
                    </View>
                    <Text testID={`progress-count-${section.slug}`} style={[styles.progressPct, { color: isComplete ? COLORS.greenDark : section.color }]}>
                      {completedCount}/{totalConceptsInSection}
                    </Text>
                  </View>
                  {sectionPct === 0 && (
                    <Text style={[styles.inlineArrow, { color: section.color }]}>Begin →</Text>
                  )}
                </View>
              )}

              {/* Lock message — teasing, not dead */}
              {!unlocked && (
                <View style={styles.lockRow}>
                  <View style={styles.lockInfo}>
                    <Ionicons name="lock-closed" size={12} color={colors.mutedText} style={{ marginRight: 4 }} />
                    <Text testID={`unlock-message-${section.slug}`} style={[styles.lockText, { color: colors.subtext }]}>
                      Complete {sections[index - 1]?.title} to unlock
                    </Text>
                  </View>
                  <View style={styles.lockPreview}>
                    <Ionicons name="layers-outline" size={12} color={colors.mutedText} />
                    <Text style={[styles.lockPreviewText, { color: colors.mutedText }]}>
                      {totalConceptsInSection} topics · {sectionXP} XP inside
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* ═══════ QUICK ACTIONS ═══════ */}
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Tools</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.borderCard }, SHADOW_CARD_SM]}
            onPress={goToCurrentLesson}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: COLORS.blueLight }]}>
              <Ionicons name="flash" size={14} color={COLORS.blue} />
            </View>
            <Text style={[styles.quickLabel, { color: colors.text }]}>Quick Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.borderCard }, SHADOW_CARD_SM]}
            onPress={() => {
              if (continueSection && continueSectionData) {
                const completed = getCompletedCount(continueSection.id, continueSectionData.concepts.map(c => c.id));
                if (completed > 0) {
                  navigation.navigate('SectionQuiz', { sectionId: continueSection.id, conceptIndex: 0 });
                }
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: COLORS.greenLight }]}>
              <Ionicons name="refresh" size={14} color={COLORS.green} />
            </View>
            <Text style={[styles.quickLabel, { color: colors.text }]}>Review</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.borderCard }, SHADOW_CARD_SM]}
            onPress={() => navigation.navigate('MockExam' as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: COLORS.goldLight }]}>
              <Ionicons name="document-text" size={14} color={COLORS.gold} />
            </View>
            <Text style={[styles.quickLabel, { color: colors.text }]}>Mock Exam</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flex: 1 },
  scrollContainer: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 24, gap: 10 },

  // ═══════ HEADER ═══════
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 26, fontWeight: '900' },
  headerSub: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  headerPill: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerPillText: { fontSize: 13, fontWeight: '800' },

  // ═══════ RESUME CHIP ═══════
  resumeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  resumeLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  resumePlayIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.blue,
    alignItems: 'center', justifyContent: 'center',
  },
  resumeTextWrap: { flex: 1 },
  resumeLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  resumeName: { fontSize: 13, fontWeight: '700', marginTop: 1 },

  // ═══════ SECTION HEADING ═══════
  sectionHeading: { fontSize: 15, fontWeight: '900', letterSpacing: 0.2, marginTop: 4 },

  // ═══════ SECTION CARDS — elevated with depth ═══════
  sectionCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  cardLockedNext: { opacity: 0.75 },
  cardLockedFar: { opacity: 0.55 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBg: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  badge: { flexDirection: 'row', alignItems: 'center', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, flexWrap: 'wrap' },
  diffDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  diffTag: { fontSize: 11, fontWeight: '700' },
  metaDot: { fontSize: 11 },
  meta: { fontSize: 11 },

  // Progress
  progressSection: { marginTop: 8, paddingLeft: 52 },
  progressBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 5, borderRadius: 3 },
  progressPct: { fontSize: 11, fontWeight: '800', minWidth: 24 },
  inlineArrow: { fontSize: 12, fontWeight: '800', marginTop: 4 },

  // Lock — teasing style
  lockRow: { marginTop: 8, paddingLeft: 52, gap: 4 },
  lockInfo: { flexDirection: 'row', alignItems: 'center' },
  lockText: { fontSize: 11, fontWeight: '600' },
  lockPreview: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  lockPreviewText: { fontSize: 10, fontWeight: '500' },

  // ═══════ QUICK ACTIONS — elevated cards ═══════
  quickRow: { flexDirection: 'row', gap: 7 },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 4,
    borderWidth: 1,
  },
  quickIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontSize: 11, fontWeight: '700' },
});
