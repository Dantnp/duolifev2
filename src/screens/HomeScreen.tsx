import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { sections } from '../data/sections';
import { sectionDataMap as allSectionData } from '../data/sectionDataMap';
import { isConceptComplete, isSectionComplete, getXP, getCompletedCount, getStreak } from '../store/progress';
import { useTheme, SHADOW_CARD, SHADOW_CARD_SM, SHADOW_CTA, COLORS, CARD, CTA } from '../context/ThemeContext';
import { SectionData } from '../types';

const TOTAL_CONCEPTS = Object.values(allSectionData).reduce(
  (sum, sd) => sum + sd.concepts.length, 0,
);


// ─── Level icons mapped to Ionicons ───
type IoniconsName = keyof typeof Ionicons.glyphMap;
const LEVEL_ICONS: IoniconsName[] = [
  'globe-outline',         // New Arrival
  'briefcase-outline',     // Visitor
  'home-outline',          // Resident
  'people-outline',        // Community Member
  'compass-outline',       // Local Explorer
  'time-outline',          // History Learner
  'color-palette-outline', // Culture Aware
  'business-outline',      // UK Insider
  'checkmark-circle-outline', // Civic Participant
  'shield-checkmark-outline', // Institution Expert
  'ribbon-outline',        // Exam Ready
  'trophy-outline',        // Citizen Master
];

const LEVELS = [
  { name: 'New Arrival',        xp: 0,     subtitle: 'Just getting started on your journey', unlock: 'Start learning' },
  { name: 'Visitor',            xp: 400,   subtitle: 'Getting to know the basics', unlock: 'Complete Section 1' },
  { name: 'Resident',           xp: 1200,  subtitle: 'Building a foundation of knowledge', unlock: 'Unlock after Section 2' },
  { name: 'Community Member',   xp: 2400,  subtitle: 'Understanding how people live together', unlock: 'Master values & principles' },
  { name: 'Local Explorer',     xp: 4000,  subtitle: 'Discovering what makes the UK unique', unlock: 'Explore UK history' },
  { name: 'History Learner',    xp: 6000,  subtitle: 'Connecting past to present', unlock: 'Dive deeper into history' },
  { name: 'Culture Aware',      xp: 8200,  subtitle: 'Appreciating traditions and culture', unlock: 'Study modern society' },
  { name: 'UK Insider',         xp: 10500, subtitle: 'You really know your stuff', unlock: 'Learn about governance' },
  { name: 'Civic Participant',  xp: 13000, subtitle: 'Ready to engage with civic life', unlock: 'Master government & law' },
  { name: 'Institution Expert', xp: 15500, subtitle: 'Deep understanding of UK institutions', unlock: 'Complete all sections' },
  { name: 'Exam Ready',         xp: 17200, subtitle: 'Prepared to pass with confidence', unlock: 'Practice mock exams' },
  { name: 'Citizen Master',     xp: 18000, subtitle: "You've mastered it all", unlock: 'Achieve full mastery' },
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
  const lastData = allSectionData[lastSec.id];
  return {
    sectionIndex: sections.length - 1,
    conceptIndex: lastData ? lastData.concepts.length - 1 : 0,
    section: lastSec,
    sectionData: lastData,
    concept: lastData?.concepts[lastData.concepts.length - 1],
    allComplete: true,
  };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

import { XP_PER_CONCEPT } from '../store/progress';

function usePressScale() {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  return { scale, onPressIn, onPressOut };
}

function getGlobalCompleted() {
  let count = 0;
  for (const sec of sections) {
    const data = allSectionData[sec.id];
    if (!data) continue;
    count += getCompletedCount(sec.id, data.concepts.map(c => c.id));
  }
  return count;
}

// ─── Level badge component ───
function LevelBadge({ index, size, color }: { index: number; size: number; color: string }) {
  return <Ionicons name={LEVEL_ICONS[index] || 'ellipse-outline'} size={size} color={color} />;
}

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [, forceUpdate] = useState(0);
  const { colors } = useTheme();
  const [showLevels, setShowLevels] = useState(false);
  const XP = getXP();
  const currentLevel = getCurrentLevel(XP);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const heroBarAnim = useRef(new Animated.Value(0)).current;
  const ctaBounce = useRef(new Animated.Value(0)).current;

  const heroPress = usePressScale();

  useEffect(() => {
    if (showLevels && currentLevel < LEVELS.length - 1) {
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: (XP - LEVELS[currentLevel].xp) / (LEVELS[currentLevel + 1].xp - LEVELS[currentLevel].xp),
        duration: 800,
        useNativeDriver: false,
      }).start();
    }
  }, [showLevels, currentLevel, XP]);

  useFocusEffect(useCallback(() => {
    forceUpdate((n: number) => n + 1);

    const globalPct = TOTAL_CONCEPTS > 0 ? getGlobalCompleted() / TOTAL_CONCEPTS : 0;
    heroBarAnim.setValue(0);
    Animated.timing(heroBarAnim, {
      toValue: globalPct,
      duration: 900,
      useNativeDriver: false,
    }).start();

    ctaBounce.setValue(-6);
    Animated.spring(ctaBounce, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 10 }).start();
  }, []));

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

  const globalCompleted = getGlobalCompleted();
  const streak = getStreak();
  const overallPct = TOTAL_CONCEPTS > 0 ? Math.round((globalCompleted / TOTAL_CONCEPTS) * 100) : 0;

  const estMinutes = Math.max(1, Math.round((questionsInConcept * 20) / 60));

  const goToCurrentLesson = () => {
    if (!isAllComplete && currentConcept) {
      navigation.navigate('SectionQuiz', { sectionId: currentSection.id, conceptIndex: progress.conceptIndex });
    }
  };

  const levelPct = currentLevel < LEVELS.length - 1
    ? Math.round(((XP - LEVELS[currentLevel].xp) / (LEVELS[currentLevel + 1].xp - LEVELS[currentLevel].xp)) * 100)
    : 100;

  const heroTitle = overallPct === 0
    ? "You're just getting started"
    : `You're ${overallPct}% ready to pass`;
  const heroSubline = 'Life in the UK Test';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════ 1. HERO — Gradient card ═══════ */}
        <LinearGradient
          colors={['#1A44A8', '#2556C8', '#3068D8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroBlock, SHADOW_CARD]}
        >
          <Text style={styles.heroGreeting}>{getGreeting()}, Dimitris</Text>
          <Text style={styles.heroHeadline}>
            {heroTitle}
            {'\n'}
            <Text style={styles.heroSubline}>{heroSubline}</Text>
          </Text>

          <View style={styles.heroBarTrack}>
            <Animated.View style={[styles.heroBarFill, {
              width: heroBarAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }]} />
          </View>

          <View style={styles.heroMeta}>
            <View style={styles.heroRankRow}>
              <View style={styles.heroRankBadge}>
                <LevelBadge index={currentLevel} size={14} color="#fff" />
              </View>
              <Text style={styles.heroRankText}>{LEVELS[currentLevel].name}</Text>
            </View>
            {currentLevel < LEVELS.length - 1 && (
              <TouchableOpacity onPress={() => setShowLevels(true)} activeOpacity={0.7} style={styles.heroNextBtn}>
                <Text style={styles.heroNextText}>Next: {LEVELS[currentLevel + 1].name}</Text>
                <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* ═══════ 2. CONTINUE LEARNING — Primary CTA ═══════ */}
        {!isAllComplete && currentConcept && (
          <Animated.View style={{ transform: [{ scale: heroPress.scale }, { translateY: ctaBounce }] }}>
            <TouchableOpacity
              style={[styles.ctaCard, { backgroundColor: colors.card }, SHADOW_CARD]}
              onPress={goToCurrentLesson}
              onPressIn={heroPress.onPressIn}
              onPressOut={heroPress.onPressOut}
              activeOpacity={0.9}
            >
              <Text style={[styles.ctaLabel, { color: colors.subtext }]}>YOUR NEXT BEST ACTION</Text>
              <Text style={[styles.ctaTitle, { color: colors.text }]}>{currentConcept.name}</Text>

              <View style={styles.ctaChips}>
                <View style={[styles.chip, { backgroundColor: COLORS.goldLight }]}>
                  <Ionicons name="star" size={11} color={COLORS.gold} style={{ marginRight: 3 }} />
                  <Text style={[styles.chipText, { color: COLORS.gold }]}>+{XP_PER_CONCEPT} XP</Text>
                </View>
                <View style={[styles.chip, { backgroundColor: colors.chipBg }]}>
                  <Ionicons name="time-outline" size={11} color={colors.bodyText} style={{ marginRight: 3 }} />
                  <Text style={[styles.chipText, { color: colors.bodyText }]}>~{estMinutes} min</Text>
                </View>
              </View>

              <View style={[styles.ctaButton, SHADOW_CTA]}>
                <Text style={styles.ctaButtonText}>{globalCompleted > 0 ? 'Continue Learning' : 'Start Learning'}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {isAllComplete && (
          <TouchableOpacity
            style={[styles.ctaCard, { backgroundColor: colors.card }, SHADOW_CARD]}
            onPress={() => navigation.navigate('MockExam' as any)}
            activeOpacity={0.85}
          >
            <Text style={[styles.ctaLabel, { color: colors.subtext }]}>ALL LESSONS COMPLETE</Text>
            <Text style={[styles.ctaTitle, { color: colors.text }]}>Ready for the real thing</Text>
            <View style={[styles.ctaButton, SHADOW_CTA]}>
              <Text style={styles.ctaButtonText}>Take Mock Exam</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ═══════ 3. STREAK — Warm compact row ═══════ */}
        <LinearGradient
          colors={['#FFF7EB', '#FFECD2', '#FFE0B8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.streakRow, SHADOW_CARD_SM]}
        >
          <View style={styles.streakIconWrap}>
            <Ionicons name="flame" size={16} color="#e07800" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakTitle}>{streak} day streak</Text>
            <Text style={styles.streakSub}>Keep it going!</Text>
          </View>
          <View style={styles.streakBadge}>
            <Ionicons name="trending-up" size={13} color="#b45309" />
          </View>
        </LinearGradient>

        {/* ═══════ 4. JOURNEY PREVIEW ═══════ */}
        <View style={styles.journeySection}>
          <Text style={[styles.journeyTitle, { color: colors.text }]}>Your Journey</Text>

          {/* Current rank */}
          <TouchableOpacity
            style={[styles.jCurrent, { backgroundColor: colors.card }, SHADOW_CARD_SM]}
            onPress={() => setShowLevels(true)}
            activeOpacity={0.85}
          >
            <View style={styles.jCurrentBadge}>
              <LevelBadge index={currentLevel} size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.jCurrentName, { color: colors.text }]}>{LEVELS[currentLevel].name}</Text>
              {currentLevel < LEVELS.length - 1 && (
                <View style={[styles.jMiniBar, { backgroundColor: colors.border, marginTop: 5 }]}>
                  <View style={[styles.jMiniBarFill, { width: `${levelPct}%` }]} />
                </View>
              )}
              <Text style={[styles.jXpLabel, { color: colors.subtext }]}>
                {currentLevel < LEVELS.length - 1
                  ? `${XP} / ${LEVELS[currentLevel + 1].xp.toLocaleString()} XP`
                  : 'Max level'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
          </TouchableOpacity>

          {/* Connector + Next rank */}
          {currentLevel < LEVELS.length - 1 && (
            <>
              <View style={styles.jConnector}>
                <View style={[styles.jConnectorActive, { backgroundColor: COLORS.blue }]} />
                <View style={[styles.jConnectorFade, { backgroundColor: colors.border }]} />
              </View>
              <View style={[styles.jNextRow, { borderColor: COLORS.orange, backgroundColor: COLORS.orangeLight }]}>
                <View style={[styles.jSmallBadge, { backgroundColor: '#fff', borderColor: COLORS.orange }]}>
                  <LevelBadge index={currentLevel + 1} size={14} color={COLORS.orange} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jNextName}>{LEVELS[currentLevel + 1].name}</Text>
                  <Text style={styles.jNextSub}>{LEVELS[currentLevel + 1].unlock}</Text>
                </View>
              </View>
            </>
          )}

          {/* One locked peek */}
          {currentLevel + 2 < LEVELS.length && (
            <>
              <View style={styles.jConnectorShort}>
                <View style={[styles.jConnectorLine, { backgroundColor: colors.border }]} />
              </View>
              <View style={styles.jLockedRow}>
                <View style={[styles.jSmallBadge, { backgroundColor: '#f0f0f0', borderColor: '#ddd' }]}>
                  <Ionicons name="lock-closed" size={11} color="#bbb" />
                </View>
                <Text style={[styles.jLockedName, { color: colors.mutedText }]}>{LEVELS[currentLevel + 2].name}</Text>
              </View>
            </>
          )}

          {/* View all */}
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => setShowLevels(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.viewAllText, { color: COLORS.blue }]}>View full journey</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.blue} />
          </TouchableOpacity>
        </View>

        {/* ═══════ 5. QUICK ACTIONS — Secondary shortcuts ═══════ */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.card }, SHADOW_CARD_SM]}
            onPress={goToCurrentLesson}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: COLORS.blueLight }]}>
              <Ionicons name="flash" size={14} color={COLORS.blue} />
            </View>
            <Text style={[styles.quickLabel, { color: colors.text }]}>Quick Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.card }, SHADOW_CARD_SM]}
            onPress={() => {
              if (currentSectionData && completedInSection > 0) {
                navigation.navigate('SectionQuiz', { sectionId: currentSection.id, conceptIndex: 0 });
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
            style={[styles.quickBtn, { backgroundColor: colors.card }, SHADOW_CARD_SM]}
            onPress={() => (navigation as any).navigate('ProgressTab')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: COLORS.goldLight }]}>
              <Ionicons name="stats-chart" size={14} color={COLORS.gold} />
            </View>
            <Text style={[styles.quickLabel, { color: colors.text }]}>Progress</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ═══════ LEVELS MODAL ═══════ */}
      <Modal visible={showLevels} transparent animationType="slide" onRequestClose={() => setShowLevels(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowLevels(false)}>
          <View
            style={[styles.modalSheet, { backgroundColor: colors.card }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Your Journey</Text>

            {/* Current level hero */}
            <View style={[styles.mHeroCard, { backgroundColor: colors.chipBg }]}>
              <View style={styles.mHeroBadge}>
                <LevelBadge index={currentLevel} size={24} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.mHeroName, { color: colors.text }]}>{LEVELS[currentLevel].name}</Text>
                <Text style={[styles.mHeroSub, { color: colors.subtext }]}>{LEVELS[currentLevel].subtitle}</Text>
                {currentLevel < LEVELS.length - 1 ? (
                  <>
                    <View style={[styles.mHeroBar, { backgroundColor: colors.border, marginTop: 8 }]}>
                      <Animated.View style={[styles.mHeroBarFill, {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      }]} />
                    </View>
                    <Text style={[styles.mHeroProgress, { color: colors.subtext }]}>
                      {XP} / {LEVELS[currentLevel + 1].xp.toLocaleString()} XP
                    </Text>
                    <Text style={[styles.mHeroMilestone, { color: COLORS.blue }]}>
                      Next: {LEVELS[currentLevel + 1].name}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.mHeroProgress, { color: COLORS.gold, fontWeight: '800' }]}>
                    Max level reached!
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.mCta, SHADOW_CTA]}
              onPress={() => setShowLevels(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.mCtaText}>{globalCompleted > 0 ? 'Continue Learning' : 'Start Learning'}</Text>
            </TouchableOpacity>

            <ScrollView style={styles.mList} showsVerticalScrollIndicator={false}>
              {LEVELS.filter((_, i) => i !== currentLevel).map((level, levelIdx, filtered) => {
                const origIdx = LEVELS.indexOf(level);
                const isReached = XP >= level.xp;
                const isNext = origIdx === currentLevel + 1;
                const isLocked = !isReached && !isNext;
                const showConnector = levelIdx > 0;
                const prevItem = levelIdx > 0 ? filtered[levelIdx - 1] : null;
                const prevReached = prevItem ? XP >= prevItem.xp : false;
                const connectorColor = prevReached && isReached ? COLORS.blue
                  : prevReached ? '#bfdbfe' : colors.border;

                return (
                  <View key={origIdx}>
                    {showConnector && (
                      <View style={styles.mConnWrap}>
                        <View style={[styles.mConn, { backgroundColor: connectorColor }]} />
                      </View>
                    )}
                    <View style={[
                      styles.mRow,
                      isNext && styles.mRowNext,
                      isLocked && styles.mRowLocked,
                    ]}>
                      <View style={[
                        styles.mBadge,
                        isReached && styles.mBadgeReached,
                        isNext && styles.mBadgeNext,
                        isLocked && styles.mBadgeLocked,
                      ]}>
                        {isLocked ? (
                          <Ionicons name="lock-closed" size={13} color="#bbb" />
                        ) : (
                          <LevelBadge index={origIdx} size={17} color={isNext ? COLORS.orange : isReached ? COLORS.blue : '#888'} />
                        )}
                      </View>
                      <View style={styles.mInfo}>
                        <Text style={[
                          styles.mName,
                          { color: isLocked ? colors.subtext : isNext ? '#e07800' : colors.text },
                          isNext && { fontWeight: '800' },
                        ]}>
                          {level.name}
                        </Text>
                        {isNext ? (
                          <Text style={[styles.mXp, { color: COLORS.orange }]}>
                            {level.unlock}  ·  Earn {level.xp.toLocaleString()} XP
                          </Text>
                        ) : isLocked ? (
                          <Text style={[styles.mXp, { color: colors.subtext }]}>
                            {level.xp.toLocaleString()} XP  ·  {level.unlock}
                          </Text>
                        ) : (
                          <Text style={[styles.mXp, { color: COLORS.blue }]}>
                            {level.xp.toLocaleString()} XP
                          </Text>
                        )}
                      </View>
                      {isReached && (
                        <View style={styles.mCheck}>
                          <Ionicons name="checkmark" size={14} color="#fff" />
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
  scrollContent: { flex: 1 },
  scrollContainer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20, gap: 10 },

  // ═══════ HERO (gradient) ═══════
  heroBlock: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  heroGreeting: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginBottom: 1 },
  heroHeadline: { fontSize: 18, fontWeight: '900', lineHeight: 22, color: '#fff', marginBottom: 8 },
  heroSubline: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  heroBarTrack: { height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.18)', marginBottom: 8 },
  heroBarFill: { height: 5, borderRadius: 3, backgroundColor: '#fff' },
  heroMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroRankRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroRankBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroRankText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  heroNextBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  heroNextText: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },

  // ═══════ CTA CARD ═══════
  ctaCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  ctaLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 },
  ctaTitle: { fontSize: 19, fontWeight: '900', marginBottom: 8 },
  ctaChips: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 11, fontWeight: '700' },
  ctaButton: {
    backgroundColor: COLORS.blue,
    borderRadius: CTA.borderRadius,
    height: CTA.height - 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: COLORS.blueDark,
  },
  ctaButtonText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  // ═══════ STREAK ═══════
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 11,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 9,
  },
  streakIconWrap: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(224, 120, 0, 0.18)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  streakTitle: { fontSize: 13, fontWeight: '900', color: '#9a3412' },
  streakSub: { fontSize: 10, fontWeight: '600', color: '#b45309', marginTop: 1 },
  streakBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(180, 83, 9, 0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ═══════ QUICK ACTIONS ═══════
  quickRow: { flexDirection: 'row', gap: 7 },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 4,
  },
  quickIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontSize: 11, fontWeight: '700' },

  // ═══════ JOURNEY PREVIEW ═══════
  journeySection: { gap: 0, marginTop: -2 },
  journeyTitle: { fontSize: 15, fontWeight: '900', color: COLORS.blue, marginBottom: 6, letterSpacing: 0.2 },

  jCurrent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  jCurrentBadge: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.blue, alignItems: 'center', justifyContent: 'center',
  },
  jCurrentName: { fontSize: 14, fontWeight: '800' },
  jMiniBar: { height: 3, borderRadius: 2, overflow: 'hidden' },
  jMiniBarFill: { height: 3, borderRadius: 2, backgroundColor: COLORS.blue },
  jXpLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },

  // Active connector (current → next) — blue top fading to grey
  jConnector: { height: 10, paddingLeft: 27, justifyContent: 'center' },
  jConnectorActive: { width: 3, height: 5, borderRadius: 1.5, position: 'absolute', left: 27, top: 0 },
  jConnectorFade: { width: 3, height: 5, borderRadius: 1.5, position: 'absolute', left: 27, bottom: 0, opacity: 0.4 },
  jConnectorLine: { width: 2, height: 6, borderRadius: 1 },
  jConnectorShort: { height: 6, paddingLeft: 27, justifyContent: 'center' },

  jNextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1.5,
  },
  jSmallBadge: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  jNextName: { fontSize: 13, fontWeight: '700', color: '#e07800' },
  jNextSub: { fontSize: 10, fontWeight: '600', color: '#c06800' },

  jLockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    opacity: 0.35,
  },
  jLockedName: { fontSize: 12, fontWeight: '600' },

  viewAllBtn: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.blueLight,
  },
  viewAllText: { fontSize: 12, fontWeight: '700' },

  // ═══════ MODAL ═══════
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#d0d0d0', alignSelf: 'center', marginBottom: 10,
  },
  modalTitle: { fontSize: 19, fontWeight: '900', textAlign: 'center', marginBottom: 10 },

  mHeroCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, padding: 10, marginBottom: 10,
    borderWidth: 2, borderColor: COLORS.blue,
  },
  mHeroBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.blue, alignItems: 'center', justifyContent: 'center',
  },
  mHeroName: { fontSize: 15, fontWeight: '900' },
  mHeroSub: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  mHeroBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  mHeroBarFill: { height: 4, borderRadius: 2, backgroundColor: COLORS.blue },
  mHeroProgress: { fontSize: 10, fontWeight: '600', marginTop: 3 },
  mHeroMilestone: { fontSize: 10, fontWeight: '800', marginTop: 1 },
  mCta: {
    backgroundColor: COLORS.blue,
    borderRadius: CTA.borderRadius,
    height: CTA.height - 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.blueDark,
  },
  mCtaText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.4 },
  mList: { flexGrow: 0 },
  mConnWrap: { paddingLeft: 24, height: 14, justifyContent: 'center' },
  mConn: { width: 2, height: 14, borderRadius: 1 },
  mRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 7, paddingHorizontal: 10,
    borderRadius: 10, gap: 9,
  },
  mRowNext: { borderWidth: 1.5, borderColor: COLORS.orange, backgroundColor: COLORS.orangeLight },
  mRowLocked: { opacity: 0.4 },
  mBadge: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#ddd', backgroundColor: '#f5f5f5',
  },
  mBadgeReached: { backgroundColor: COLORS.blueLight, borderColor: COLORS.blue },
  mBadgeNext: { backgroundColor: COLORS.orangeLight, borderColor: COLORS.orange },
  mBadgeLocked: { backgroundColor: '#eee', borderColor: '#ccc' },
  mInfo: { flex: 1, gap: 0 },
  mName: { fontSize: 13, fontWeight: '700' },
  mXp: { fontSize: 10, fontWeight: '600' },
  mCheck: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.blue, alignItems: 'center', justifyContent: 'center',
  },
});
