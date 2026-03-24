// V1 — Dashboard-style home screen with readiness score, daily goal, and section cards
// To use: copy contents into HomeScreen.tsx

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { sections } from '../data/sections';
import { questions } from '../data/questions';
import { whatIsUKSection } from '../data/whatIsUK';
import { isConceptComplete } from '../store/progress';

const STREAK = 12;
const DAILY_DONE = 3;
const DAILY_GOAL = 10;
const READINESS = 62;
const HEARTS = 5;

const sectionDataMap: Record<number, typeof whatIsUKSection> = {
  1: whatIsUKSection,
};

function findNextConcept(): { sectionId: number; conceptIndex: number } | null {
  for (const section of sections) {
    const data = sectionDataMap[section.id];
    if (!data) continue;
    for (let i = 0; i < data.concepts.length; i++) {
      if (!isConceptComplete(data.id, data.concepts[i].id)) {
        const unlocked = i === 0 || isConceptComplete(data.id, data.concepts[i - 1].id);
        if (unlocked) return { sectionId: data.id, conceptIndex: i };
      }
    }
  }
  return null;
}

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dailyPercent = (DAILY_DONE / DAILY_GOAL) * 100;
  const [, forceUpdate] = useState(0);

  useFocusEffect(useCallback(() => { forceUpdate((n: number) => n + 1); }, []));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.flagBox}>
          <Text style={styles.flagEmoji}>🇬🇧</Text>
        </View>
        <View style={styles.topStats}>
          <View style={styles.statChip}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{STREAK}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statValue}>{DAILY_DONE}/{DAILY_GOAL}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statIcon}>❤️</Text>
            <Text style={styles.statValue}>{HEARTS}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Readiness card */}
        <View style={styles.readinessCard}>
          <View style={styles.readinessLeft}>
            <Text style={styles.readinessLabel}>Readiness Score</Text>
            <Text style={styles.readinessDesc}>
              Based on {questions.length} practice questions
            </Text>
            <View style={styles.goalRow}>
              <Text style={styles.goalLabel}>Daily goal</Text>
              <Text style={styles.goalCount}>{DAILY_DONE}/{DAILY_GOAL}</Text>
            </View>
            <View style={styles.goalBar}>
              <View style={[styles.goalFill, { width: `${dailyPercent}%` }]} />
            </View>
          </View>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{READINESS}%</Text>
            <Text style={styles.scoreTag}>Ready</Text>
          </View>
        </View>

        {/* Continue Study button */}
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => {
            const next = findNextConcept();
            if (next) {
              navigation.navigate('SectionQuiz', next);
            } else {
              navigation.navigate('SectionMap', { sectionId: 1 });
            }
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnIcon}>▶</Text>
          <Text style={styles.continueBtnText}>CONTINUE STUDY</Text>
        </TouchableOpacity>

        {/* Sections */}
        <Text style={styles.sectionHeader}>Sections</Text>

        <View style={styles.sectionsGrid}>
          {sections.map((section, index) => {
            const isLocked = index > 0 && sections[index - 1].completed === 0;
            return (
              <TouchableOpacity
                key={section.id}
                style={[styles.sectionCard, { borderColor: section.color }]}
                activeOpacity={0.8}
                onPress={() => !isLocked && navigation.navigate('SectionMap', { sectionId: section.id })}
              >
                {isLocked && <View style={styles.lockOverlay} />}
                <View style={[styles.sectionIconBg, { backgroundColor: section.color + '22' }]}>
                  <Text style={styles.sectionEmoji}>{section.emoji}</Text>
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionCount}>{section.totalQuestions} questions</Text>
                <View style={styles.sectionProgress}>
                  <View
                    style={[
                      styles.sectionProgressFill,
                      {
                        backgroundColor: section.color,
                        width: `${(section.completed / section.totalQuestions) * 100}%`,
                      },
                    ]}
                  />
                </View>
                {isLocked && <Text style={styles.lockIcon}>🔒</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  flagBox: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#f0f4f8', alignItems: 'center', justifyContent: 'center',
  },
  flagEmoji: { fontSize: 22 },
  topStats: { flexDirection: 'row', gap: 8 },
  statChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8f8f8', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, gap: 4,
  },
  statIcon: { fontSize: 16 },
  statValue: { fontSize: 14, fontWeight: '800', color: '#333' },
  scroll: { paddingHorizontal: 16, paddingTop: 20 },
  readinessCard: {
    backgroundColor: '#f8faff', borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16, borderWidth: 1.5, borderColor: '#e8f0ff',
  },
  readinessLeft: { flex: 1, marginRight: 16 },
  readinessLabel: { fontSize: 17, fontWeight: '800', color: '#222', marginBottom: 4 },
  readinessDesc: { fontSize: 12, color: '#999', marginBottom: 14 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  goalLabel: { fontSize: 12, fontWeight: '600', color: '#555' },
  goalCount: { fontSize: 12, fontWeight: '700', color: '#1cb0f6' },
  goalBar: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' },
  goalFill: { height: '100%', backgroundColor: '#1cb0f6', borderRadius: 4 },
  scoreCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#1a56db', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1a56db', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  scoreNumber: { fontSize: 20, fontWeight: '900', color: '#fff' },
  scoreTag: { fontSize: 10, fontWeight: '700', color: '#bfdbfe', marginTop: 1 },
  continueBtn: {
    backgroundColor: '#1a56db', borderRadius: 16, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginBottom: 28,
    shadowColor: '#1a56db', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
    borderBottomWidth: 4, borderBottomColor: '#1439a8',
  },
  continueBtnIcon: { fontSize: 18, color: '#fff' },
  continueBtnText: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  sectionHeader: { fontSize: 20, fontWeight: '800', color: '#222', marginBottom: 16 },
  sectionsGrid: { gap: 12 },
  sectionCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', borderWidth: 2, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, overflow: 'hidden',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 1, borderRadius: 14,
  },
  sectionIconBg: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sectionEmoji: { fontSize: 26 },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#222' },
  sectionCount: { fontSize: 12, color: '#aaa', position: 'absolute', bottom: 16, left: 80 },
  sectionProgress: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 4, backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 14, borderBottomRightRadius: 14,
  },
  sectionProgressFill: { height: '100%', borderBottomLeftRadius: 14 },
  lockIcon: { fontSize: 18, zIndex: 2 },
});
