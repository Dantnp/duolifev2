// V2 — Map-style home screen with winding path of concept nodes
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
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { whatIsUKSection } from '../data/whatIsUK';
import { isConceptComplete } from '../store/progress';

const { width: SW } = Dimensions.get('window');

const STREAK = 12;
const XP = 340;
const NODE_R = 32;
const V_GAP = 130;
const TOP_PAD = 50;
const BOT_PAD = 80;

// X positions (fraction of screen width) — creates the winding effect
const XF = [0.50, 0.73, 0.83, 0.65, 0.40, 0.22, 0.17, 0.38, 0.62, 0.50];

// Decorative trees scattered around
const TREES = [
  { x: 0.07, yf: 0.04 }, { x: 0.87, yf: 0.09 }, { x: 0.04, yf: 0.20 },
  { x: 0.90, yf: 0.29 }, { x: 0.06, yf: 0.41 }, { x: 0.88, yf: 0.51 },
  { x: 0.05, yf: 0.63 }, { x: 0.91, yf: 0.71 }, { x: 0.08, yf: 0.83 },
  { x: 0.87, yf: 0.90 },
];

function PathLine({
  x1, y1, x2, y2, done,
}: { x1: number; y1: number; x2: number; y2: number; done: boolean }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return (
    <View
      style={{
        position: 'absolute',
        width: len,
        height: 12,
        backgroundColor: done ? '#1a56db' : '#bfdbfe',
        borderRadius: 6,
        left: (x1 + x2) / 2 - len / 2,
        top: (y1 + y2) / 2 - 6,
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [, forceUpdate] = useState(0);
  useFocusEffect(useCallback(() => { forceUpdate((n: number) => n + 1); }, []));

  const concepts = whatIsUKSection.concepts;
  const sid = whatIsUKSection.id;

  let curIdx = concepts.findIndex((c, i) => {
    const unlocked = i === 0 || isConceptComplete(sid, concepts[i - 1].id);
    return unlocked && !isConceptComplete(sid, c.id);
  });
  if (curIdx === -1) curIdx = concepts.length - 1;

  const totalH = TOP_PAD + (concepts.length - 1) * V_GAP + NODE_R * 2 + BOT_PAD;
  const nx = (i: number) => XF[i] * SW;
  const ny = (i: number) => TOP_PAD + i * V_GAP;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.topBar}>
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>J</Text>
          </View>
          <Text style={styles.topName}>John Durrant</Text>
        </View>
        <View style={styles.chips}>
          <View style={styles.chip}>
            <Text style={styles.chipIcon}>🔥</Text>
            <Text style={styles.chipVal}>{STREAK}</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipIcon}>⭐</Text>
            <Text style={styles.chipVal}>{XP}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionPill}>
        <Text style={styles.sectionPillText}>🌍 What is the UK</Text>
      </View>

      <ScrollView
        style={styles.map}
        contentContainerStyle={{ height: totalH }}
        showsVerticalScrollIndicator={false}
      >
        {TREES.map((t, i) => (
          <Text
            key={i}
            style={{ position: 'absolute', left: t.x * SW, top: t.yf * totalH, fontSize: 26, opacity: 0.5 }}
          >
            🌳
          </Text>
        ))}

        {concepts.map((_, i) => {
          if (i === 0) return null;
          const done = isConceptComplete(sid, concepts[i - 1].id);
          return (
            <PathLine
              key={`line-${i}`}
              x1={nx(i - 1)} y1={ny(i - 1) + NODE_R}
              x2={nx(i)} y2={ny(i) + NODE_R}
              done={done}
            />
          );
        })}

        {concepts.map((concept, i) => {
          const done = isConceptComplete(sid, concept.id);
          const unlocked = i === 0 || isConceptComplete(sid, concepts[i - 1].id);
          const isCur = i === curIdx;
          const onRight = nx(i) > SW * 0.5;
          const cx = nx(i);
          const cy = ny(i);

          return (
            <React.Fragment key={concept.id}>
              <Text
                style={{
                  position: 'absolute',
                  width: 95,
                  left: onRight ? cx - NODE_R - 102 : cx + NODE_R + 8,
                  top: cy + NODE_R - 14,
                  fontSize: 11,
                  fontWeight: '700',
                  color: '#444',
                  textAlign: onRight ? 'right' : 'left',
                }}
                numberOfLines={2}
              >
                {concept.name}
              </Text>

              {isCur && !done && (
                <View style={{
                  position: 'absolute',
                  width: NODE_R * 2 + 20,
                  height: NODE_R * 2 + 20,
                  borderRadius: NODE_R + 10,
                  backgroundColor: 'rgba(255,150,0,0.18)',
                  left: cx - NODE_R - 10,
                  top: cy - 10,
                }} />
              )}

              <TouchableOpacity
                style={[
                  styles.node,
                  {
                    left: cx - NODE_R,
                    top: cy,
                    backgroundColor: done ? '#1a56db' : isCur ? '#ff9600' : unlocked ? '#fff' : '#f0f0f0',
                    borderColor: done ? '#1439a8' : isCur ? '#e07800' : unlocked ? '#1a56db' : '#ddd',
                    borderWidth: isCur ? 4 : 3,
                  },
                ]}
                onPress={() => unlocked && navigation.navigate('SectionQuiz', { sectionId: sid, conceptIndex: i })}
                activeOpacity={unlocked ? 0.8 : 1}
              >
                {done
                  ? <Text style={styles.nodeCheck}>✓</Text>
                  : isCur
                    ? <Text style={styles.nodeCurText}>▶</Text>
                    : !unlocked
                      ? <Text style={styles.nodeLock}>🔒</Text>
                      : <Text style={styles.nodeNum}>{i + 1}</Text>
                }
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </ScrollView>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => navigation.navigate('SectionQuiz', { sectionId: sid, conceptIndex: curIdx })}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnIcon}>▶</Text>
          <Text style={styles.continueBtnTxt}>CONTINUE STUDY</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#1a56db', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#1439a8',
  },
  avatarTxt: { fontSize: 16, fontWeight: '900', color: '#fff' },
  topName: { fontSize: 15, fontWeight: '800', color: '#222' },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#f8f8f8', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  chipIcon: { fontSize: 14 },
  chipVal: { fontSize: 14, fontWeight: '800', color: '#333' },
  sectionPill: {
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
    backgroundColor: '#eff6ff', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 6,
    borderWidth: 1, borderColor: '#bfdbfe',
  },
  sectionPillText: { fontSize: 13, fontWeight: '800', color: '#1439a8' },
  map: { flex: 1, backgroundColor: '#f0f6ff' },
  node: {
    position: 'absolute', width: NODE_R * 2, height: NODE_R * 2, borderRadius: NODE_R,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 5, elevation: 4,
  },
  nodeCheck: { fontSize: 24, fontWeight: '900', color: '#fff' },
  nodeCurText: { fontSize: 22, color: '#fff', fontWeight: '900' },
  nodeLock: { fontSize: 18 },
  nodeNum: { fontSize: 17, fontWeight: '900', color: '#1a56db' },
  bottom: {
    backgroundColor: '#fff', padding: 16, paddingBottom: 8,
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
  },
  continueBtn: {
    backgroundColor: '#1a56db', borderRadius: 16, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderBottomWidth: 4, borderBottomColor: '#1439a8',
    shadowColor: '#1a56db', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  continueBtnIcon: { fontSize: 18, color: '#fff' },
  continueBtnTxt: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 1 },
});
