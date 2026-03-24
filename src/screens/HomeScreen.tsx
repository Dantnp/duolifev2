import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { whatIsUKSection } from '../data/whatIsUK';
import { valuesAndPrinciplesSection } from '../data/valuesAndPrinciples';
import { historyOfUKSection } from '../data/historyOfUK';
import { modernSocietySection } from '../data/modernSociety';
import { governmentAndLawSection } from '../data/governmentAndLaw';
import { sections } from '../data/sections';
import { isConceptComplete, isSectionComplete, getXP, getCompletedCount } from '../store/progress';
import { useTheme } from '../context/ThemeContext';
import { SectionData } from '../types';

const allSectionData: Record<number, SectionData> = {
  1: whatIsUKSection,
  2: valuesAndPrinciplesSection,
  3: historyOfUKSection,
  4: modernSocietySection,
  5: governmentAndLawSection,
};

const { width: SW } = Dimensions.get('window');

const STREAK = 12;

const LEVELS = [
  { name: 'New Arrival',        xp: 0,     icon: '🌍', subtitle: "You're just getting started on your UK journey", unlock: 'Start learning' },
  { name: 'Visitor',            xp: 400,   icon: '🧳', subtitle: 'Getting to know the basics', unlock: 'Complete Section 1' },
  { name: 'Resident',           xp: 1200,  icon: '🏠', subtitle: 'Building a foundation of knowledge', unlock: 'Unlock after Section 2' },
  { name: 'Community Member',   xp: 2400,  icon: '👥', subtitle: 'Understanding how people live together', unlock: 'Master values & principles' },
  { name: 'Local Explorer',     xp: 4000,  icon: '🗺️', subtitle: 'Discovering what makes the UK unique', unlock: 'Explore UK history' },
  { name: 'History Learner',    xp: 6000,  icon: '📜', subtitle: 'Connecting past to present', unlock: 'Dive deeper into history' },
  { name: 'Culture Aware',      xp: 8200,  icon: '🎭', subtitle: 'Appreciating traditions and culture', unlock: 'Study modern society' },
  { name: 'UK Insider',         xp: 10500, icon: '🏙️', subtitle: 'You really know your stuff', unlock: 'Learn about governance' },
  { name: 'Civic Participant',  xp: 13000, icon: '🗳️', subtitle: 'Ready to engage with civic life', unlock: 'Master government & law' },
  { name: 'Institution Expert', xp: 15500, icon: '⚖️', subtitle: 'Deep understanding of UK institutions', unlock: 'Complete all sections' },
  { name: 'Exam Ready',         xp: 17200, icon: '✅', subtitle: 'Prepared to pass with confidence', unlock: 'Practice mock exams' },
  { name: 'Citizen Master',     xp: 18000, icon: '👑', subtitle: 'You\'ve mastered it all', unlock: 'Achieve full mastery' },
];

function getCurrentLevel(xp: number) {
  let level = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) { level = i; break; }
  }
  return level;
}

function findCurrentProgress(allData: Record<number, SectionData>) {
  for (let si = 0; si < sections.length; si++) {
    const sec = sections[si];
    const data = allData[sec.id];
    if (!data) continue;

    const sectionUnlocked = si === 0 || (() => {
      const prev = sections[si - 1];
      const prevData = allData[prev.id];
      return prevData ? isSectionComplete(prev.id, prevData.concepts.map(c => c.id)) : false;
    })();

    if (!sectionUnlocked) continue;

    const concepts = data.concepts;
    for (let ci = 0; ci < concepts.length; ci++) {
      const unlocked = ci === 0 || isConceptComplete(sec.id, concepts[ci - 1].id);
      const done = isConceptComplete(sec.id, concepts[ci].id);
      if (unlocked && !done) {
        return { sectionIndex: si, conceptIndex: ci, section: sec, sectionData: data, concept: concepts[ci] };
      }
    }
  }
  const lastSec = sections[sections.length - 1];
  const lastData = allData[lastSec.id];
  return {
    sectionIndex: sections.length - 1,
    conceptIndex: lastData ? lastData.concepts.length - 1 : 0,
    section: lastSec,
    sectionData: lastData,
    concept: lastData?.concepts[lastData.concepts.length - 1],
    allComplete: true,
  };
}

const XP_PER_CONCEPT = 120;

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [, forceUpdate] = useState(0);
  const { colors } = useTheme();
  const [showLevels, setShowLevels] = useState(false);
  const XP = getXP();
  const currentLevel = getCurrentLevel(XP);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showLevels && currentLevel < LEVELS.length - 1) {
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: (XP - LEVELS[currentLevel].xp) / (LEVELS[currentLevel + 1].xp - LEVELS[currentLevel].xp),
        duration: 800,
        useNativeDriver: false,
      }).start();
    }
  }, [showLevels]);

  useFocusEffect(useCallback(() => { forceUpdate((n: number) => n + 1); }, []));

  const progress = findCurrentProgress(allSectionData);
  const isAllComplete = !!(progress as any).allComplete;
  const currentConcept = progress.concept;
  const currentSection = progress.section;
  const currentSectionData = progress.sectionData;
  const questionsInConcept = currentConcept?.questions?.length ?? 0;

  const sectionConcepts = currentSectionData?.concepts ?? [];
  const completedInSection = currentSectionData
    ? getCompletedCount(currentSection.id, sectionConcepts.map(c => c.id))
    : 0;
  const sectionProgressPct = sectionConcepts.length > 0
    ? Math.round((completedInSection / sectionConcepts.length) * 100)
    : 0;


  // XP display: at 0 XP, show the reward they can earn NOW (aligned with hero card)
  const xpChipText = XP > 0 ? `${XP} XP` : `Earn ${XP_PER_CONCEPT} XP`;

  // Level progress percentage
  const levelProgressPct = currentLevel < LEVELS.length - 1
    ? Math.round(((XP - LEVELS[currentLevel].xp) / (LEVELS[currentLevel + 1].xp - LEVELS[currentLevel].xp)) * 100)
    : 100;

  // Estimated time (~20 sec per question)
  const estMinutes = Math.max(1, Math.round((questionsInConcept * 20) / 60));

  const goToCurrentLesson = () => {
    if (!isAllComplete && currentConcept) {
      navigation.navigate('SectionQuiz', { sectionId: currentSection.id, conceptIndex: progress.conceptIndex });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
      {/* ===== TOP STATUS BAR ===== */}
      <View style={[styles.statusBar, { backgroundColor: colors.screenBg, borderBottomColor: colors.border }]}>
        <View style={[styles.statusChip, { backgroundColor: colors.chipBg }]}>
          <Text style={styles.statusIcon}>🔥</Text>
          <Text style={[styles.statusVal, { color: colors.bodyText }]}>{STREAK}</Text>
          <Text style={[styles.statusLabel, { color: colors.subtext }]}>streak</Text>
        </View>

        <TouchableOpacity
          style={[styles.statusChip, { backgroundColor: colors.chipBg }]}
          onPress={() => setShowLevels(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.statusIcon}>⭐</Text>
          <Text style={[styles.statusVal, { color: colors.bodyText }]}>{xpChipText}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusChip, { backgroundColor: colors.chipBg }]}
          onPress={() => setShowLevels(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.statusIcon}>🏆</Text>
          <Text style={[styles.statusVal, { color: colors.bodyText }]} numberOfLines={1}>
            {LEVELS[currentLevel].name}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ===== SCROLLABLE CONTENT ===== */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== IDENTITY CARD ===== */}
        <TouchableOpacity
          style={[styles.identityCard, { backgroundColor: colors.card }]}
          onPress={() => setShowLevels(true)}
          activeOpacity={0.85}
        >
          <View style={styles.identityRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>J</Text>
            </View>
            <View style={styles.identityInfo}>
              <Text style={[styles.identityName, { color: colors.text }]}>John Durrant</Text>
              <View style={styles.identityLevelRow}>
                <Text style={styles.identityLevelIcon}>{LEVELS[currentLevel].icon}</Text>
                <Text style={[styles.identityLevel, { color: '#1a56db' }]}>{LEVELS[currentLevel].name}</Text>
              </View>
            </View>
            {currentLevel < LEVELS.length - 1 && (
              <View style={styles.identityPctBadge}>
                <Text style={styles.identityPctText}>{levelProgressPct}%</Text>
              </View>
            )}
          </View>
          {currentLevel < LEVELS.length - 1 && (
            <View style={styles.identityProgress}>
              <View style={[styles.identityBar, { backgroundColor: colors.border }]}>
                <View style={[styles.identityBarFill, { width: `${levelProgressPct}%` }]} />
              </View>
              <Text style={[styles.identityXpText, { color: colors.subtext }]}>
                Next: {LEVELS[currentLevel + 1].icon} {LEVELS[currentLevel + 1].name} ({LEVELS[currentLevel + 1].xp - XP} XP)
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ===== HERO — NEXT ACTION CARD (primary CTA) ===== */}
        {!isAllComplete && currentConcept && (
          <TouchableOpacity
            style={[styles.heroAction, { backgroundColor: colors.card }]}
            onPress={goToCurrentLesson}
            activeOpacity={0.75}
          >
            <View style={styles.heroActionHeader}>
              <Text style={styles.heroActionTarget}>🎯</Text>
              <Text style={[styles.heroActionTitle, { color: colors.text }]}>Continue your journey</Text>
            </View>

            <Text style={[styles.heroActionConceptName, { color: colors.text }]}>
              ▶ {XP === 0 ? 'Start' : 'Continue'}: {currentConcept.name}
            </Text>

            {/* Reward grid */}
            <View style={styles.heroActionGrid}>
              <View style={styles.heroActionGridItem}>
                <Text style={styles.heroActionGridIcon}>📘</Text>
                <Text style={[styles.heroActionGridText, { color: colors.bodyText }]}>{questionsInConcept} questions</Text>
              </View>
              <View style={styles.heroActionGridItem}>
                <Text style={styles.heroActionGridIcon}>⭐</Text>
                <Text style={[styles.heroActionGridText, { color: colors.bodyText }]}>+{XP_PER_CONCEPT} XP</Text>
              </View>
              <View style={styles.heroActionGridItem}>
                <Text style={styles.heroActionGridIcon}>⏱</Text>
                <Text style={[styles.heroActionGridText, { color: colors.bodyText }]}>~{estMinutes} min</Text>
              </View>
              <View style={styles.heroActionGridItem}>
                <Text style={styles.heroActionGridIcon}>🔓</Text>
                <Text style={[styles.heroActionGridText, { color: colors.bodyText }]}>Unlock next topic</Text>
              </View>
            </View>

            {/* Streak urgency — loss aversion */}
            <View style={styles.heroStreakRow}>
              <Text style={styles.heroStreakText}>🔥 Don't lose your {STREAK}-day streak</Text>
            </View>
          </TouchableOpacity>
        )}

        {isAllComplete && (
          <TouchableOpacity
            style={[styles.heroAction, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Home' as any)}
            activeOpacity={0.75}
          >
            <View style={styles.heroActionHeader}>
              <Text style={styles.heroActionTarget}>🎉</Text>
              <Text style={[styles.heroActionTitle, { color: colors.text }]}>All lessons complete!</Text>
            </View>
            <Text style={[styles.heroActionConceptName, { color: colors.subtext, fontSize: 14, fontWeight: '600' }]}>
              You've mastered all the material. Tap to take a mock exam.
            </Text>
          </TouchableOpacity>
        )}


        {/* ===== QUICK ACTIONS ===== */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={[styles.quickAction, styles.quickActionPrimary, { backgroundColor: colors.card }]}
            onPress={goToCurrentLesson}
            activeOpacity={0.8}
          >
            <Text style={styles.quickActionIcon}>🧠</Text>
            <Text style={[styles.quickActionLabel, { color: colors.text }]}>Quick Quiz</Text>
            <Text style={[styles.quickActionSub, { color: colors.subtext }]}>30 sec</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.card, opacity: completedInSection > 0 ? 1 : 0.45 }]}
            onPress={() => {
              if (currentSectionData && completedInSection > 0) {
                navigation.navigate('SectionQuiz', { sectionId: currentSection.id, conceptIndex: 0 });
              }
            }}
            activeOpacity={completedInSection > 0 ? 0.8 : 1}
          >
            <Text style={styles.quickActionIcon}>🔁</Text>
            <Text style={[styles.quickActionLabel, { color: colors.text }]}>Review</Text>
            <Text style={[styles.quickActionSub, { color: colors.subtext }]}>Past lessons</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.card, opacity: sectionProgressPct > 0 ? 1 : 0.45 }]}
            onPress={() => setShowLevels(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.quickActionIcon}>📊</Text>
            <Text style={[styles.quickActionLabel, { color: colors.text }]}>Progress</Text>
            <Text style={[styles.quickActionSub, { color: colors.subtext }]}>{sectionProgressPct > 0 ? `${sectionProgressPct}%` : '—'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* NO bottom CTA — hero card IS the CTA */}

      {/* ===== LEVELS MODAL ===== */}
      <Modal visible={showLevels} transparent animationType="slide" onRequestClose={() => setShowLevels(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowLevels(false)}>
          <View
            style={[styles.modalSheet, { backgroundColor: colors.screenBg }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Your Journey</Text>

            <View style={[styles.modalHeroCard, { backgroundColor: colors.chipBg }]}>
              <View style={styles.modalHeroBadge}>
                <Text style={styles.modalHeroIcon}>{LEVELS[currentLevel].icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalHeroName, { color: colors.text }]}>{LEVELS[currentLevel].name}</Text>
                <Text style={[styles.modalHeroSubtitle, { color: colors.subtext }]}>{LEVELS[currentLevel].subtitle}</Text>
                {currentLevel < LEVELS.length - 1 ? (
                  <>
                    <View style={[styles.modalHeroBar, { backgroundColor: colors.border, marginTop: 12 }]}>
                      <Animated.View style={[styles.modalHeroBarFill, {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      }]} />
                    </View>
                    <Text style={[styles.modalHeroProgress, { color: colors.subtext, marginTop: 8 }]}>
                      {XP} / {LEVELS[currentLevel + 1].xp.toLocaleString()} XP
                    </Text>
                    <Text style={[styles.modalHeroMilestone, { color: '#1a56db', marginTop: 6 }]}>
                      Next: {LEVELS[currentLevel + 1].icon} {LEVELS[currentLevel + 1].name}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.modalHeroProgress, { color: '#ff9600', fontWeight: '800' }]}>
                    Max level reached!
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCta}
              onPress={() => setShowLevels(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalCtaText}>
                {XP === 0 ? 'Begin First Lesson' : 'Continue Learning'}
              </Text>
            </TouchableOpacity>

            <ScrollView style={styles.levelsList} showsVerticalScrollIndicator={false}>
              {LEVELS.filter((_, i) => i !== currentLevel).map((level, idx, filtered) => {
                const origIdx = LEVELS.indexOf(level);
                const isReached = XP >= level.xp;
                const isNext = origIdx === currentLevel + 1;
                const isLocked = !isReached && !isNext;
                const showConnector = idx > 0;
                const prevItem = idx > 0 ? filtered[idx - 1] : null;
                const prevReached = prevItem ? XP >= prevItem.xp : false;
                const connectorColor = prevReached && isReached ? '#1a56db'
                  : prevReached ? '#bfdbfe' : colors.border;

                return (
                  <View key={origIdx}>
                    {showConnector && (
                      <View style={styles.connectorWrap}>
                        <View style={[styles.connector, { backgroundColor: connectorColor }]} />
                      </View>
                    )}
                    <View style={[
                      styles.levelRow,
                      isNext && styles.levelRowNext,
                      isLocked && styles.levelRowLocked,
                    ]}>
                      <View style={[
                        styles.levelBadge,
                        isReached && styles.levelBadgeReached,
                        isNext && styles.levelBadgeNext,
                        isLocked && styles.levelBadgeLocked,
                      ]}>
                        {isLocked ? (
                          <Text style={styles.levelLockIcon}>🔒</Text>
                        ) : (
                          <Text style={styles.levelBadgeIcon}>{level.icon}</Text>
                        )}
                      </View>
                      <View style={styles.levelInfo}>
                        <Text style={[
                          styles.levelName,
                          { color: isLocked ? colors.subtext : isNext ? '#e07800' : colors.text },
                          isNext && { fontWeight: '800' },
                        ]}>
                          {level.name}
                        </Text>
                        {isNext ? (
                          <Text style={[styles.levelXpText, { color: '#ff9600' }]}>
                            {level.unlock}  ·  Earn {level.xp.toLocaleString()} XP
                          </Text>
                        ) : isLocked ? (
                          <Text style={[styles.levelXpText, { color: colors.subtext }]}>
                            {level.xp.toLocaleString()} XP  ·  {level.unlock}
                          </Text>
                        ) : (
                          <Text style={[styles.levelXpText, { color: '#1a56db' }]}>
                            {level.xp.toLocaleString()} XP
                          </Text>
                        )}
                      </View>
                      {isReached && (
                        <View style={styles.checkCircle}>
                          <Text style={styles.checkText}>✓</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ===== STATUS BAR =====
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 6,
  },
  statusChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  statusIcon: { fontSize: 14 },
  statusVal: { fontSize: 14, fontWeight: '900' },
  statusLabel: { fontSize: 11, fontWeight: '600' },

  // ===== SCROLL =====
  scrollContent: { flex: 1 },
  scrollContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 16 },

  // ===== IDENTITY CARD =====
  identityCard: {
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#1a56db',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#1439a8',
  },
  avatarTxt: { fontSize: 20, fontWeight: '900', color: '#fff' },
  identityInfo: { flex: 1 },
  identityName: { fontSize: 18, fontWeight: '900' },
  identityLevelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  identityLevelIcon: { fontSize: 14 },
  identityLevel: { fontSize: 13, fontWeight: '800' },
  identityPctBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  identityPctText: { fontSize: 13, fontWeight: '900', color: '#1a56db' },
  identityProgress: { marginTop: 12 },
  identityBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  identityBarFill: { height: 6, borderRadius: 3, backgroundColor: '#1a56db' },
  identityXpText: { fontSize: 11, fontWeight: '600', marginTop: 4 },

  // ===== HERO NEXT ACTION (PRIMARY CTA) =====
  heroAction: {
    borderRadius: 20,
    padding: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#ff9600',
    shadowColor: '#ff9600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  heroActionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  heroActionTarget: { fontSize: 20 },
  heroActionTitle: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroActionConceptName: { fontSize: 18, fontWeight: '900', marginBottom: 14 },
  heroActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  heroActionGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroActionGridIcon: { fontSize: 13 },
  heroActionGridText: { fontSize: 12, fontWeight: '700' },
  heroStreakRow: {
    backgroundColor: 'rgba(255,150,0,0.08)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  heroStreakText: { fontSize: 13, fontWeight: '800', color: '#e07800', textAlign: 'center' },

  // ===== QUICK ACTIONS =====
  quickActionsRow: { flexDirection: 'row', gap: 10 },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionPrimary: {
    borderWidth: 1.5,
    borderColor: '#1a56db',
  },
  quickActionIcon: { fontSize: 24, marginBottom: 6 },
  quickActionLabel: { fontSize: 12, fontWeight: '800' },
  quickActionSub: { fontSize: 10, fontWeight: '600', marginTop: 2 },

  // ===== MODAL =====
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40, height: 5, borderRadius: 3,
    backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 14,
  },
  modalTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 12 },

  modalHeroCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, padding: 16, marginBottom: 18,
    borderWidth: 2.5, borderColor: '#1a56db',
    shadowColor: '#1a56db', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  modalHeroBadge: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#1a56db', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1a56db', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  modalHeroIcon: { fontSize: 28 },
  modalHeroName: { fontSize: 18, fontWeight: '900' },
  modalHeroSubtitle: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  modalHeroBar: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 8 },
  modalHeroBarFill: { height: 8, borderRadius: 4, backgroundColor: '#1a56db' },
  modalHeroProgress: { fontSize: 12, fontWeight: '600', marginTop: 5 },
  modalHeroMilestone: { fontSize: 12, fontWeight: '800', marginTop: 3 },
  modalCta: {
    backgroundColor: '#1a56db', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginBottom: 18,
    borderBottomWidth: 3, borderBottomColor: '#1439a8',
  },
  modalCtaText: { fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },

  levelsList: { flexGrow: 0 },
  connectorWrap: { paddingLeft: 31, height: 28, justifyContent: 'center' },
  connector: { width: 3, height: 28, borderRadius: 1.5 },
  levelRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11, paddingHorizontal: 12,
    borderRadius: 14, gap: 12,
  },
  levelRowNext: { borderWidth: 2, borderColor: '#ff9600', backgroundColor: 'rgba(255,150,0,0.08)' },
  levelRowLocked: { opacity: 0.55 },
  levelBadge: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#ddd', backgroundColor: '#f5f5f5',
  },
  levelBadgeReached: { backgroundColor: '#e8f0fe', borderColor: '#1a56db' },
  levelBadgeNext: {
    backgroundColor: '#fff3e0', borderColor: '#ff9600',
    shadowColor: '#ff9600', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  levelBadgeLocked: { backgroundColor: '#eee', borderColor: '#ccc' },
  levelBadgeIcon: { fontSize: 20 },
  levelLockIcon: { fontSize: 13, opacity: 0.6 },
  levelInfo: { flex: 1, gap: 2 },
  levelName: { fontSize: 14, fontWeight: '700' },
  levelXpText: { fontSize: 12, fontWeight: '600' },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#1a56db', alignItems: 'center', justifyContent: 'center',
  },
  checkText: { fontSize: 13, fontWeight: '900', color: '#fff' },
});
