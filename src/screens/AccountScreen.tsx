import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Switch, TextInput, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, SHADOW_CARD, SHADOW_CARD_SM, SHADOW_CTA, COLORS, CARD, CTA } from '../context/ThemeContext';
import { sections } from '../data/sections';
import { getCompletedCount, isSectionComplete, getXP, getStreak } from '../store/progress';
import { sectionDataMap } from '../data/sectionDataMap';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  try { UIManager.setLayoutAnimationEnabledExperimental(true); } catch (e) { /* no-op in New Architecture */ }
}

const USERNAME = 'John Doe';
const EMAIL = 'john@example.com';
const PLAN = 'Free Explorer';
const JOINED = 'Member since Jan 2026';

const PLANS = [
  { name: 'Monthly', price: '£4.99', period: '/month', tag: null },
  { name: 'Yearly', price: '£29.99', period: '/year', tag: 'Best Value' },
];

function UpgradeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState(1);
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.card }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

        <Text style={[styles.sheetTitle, { color: colors.text }]}>Go Premium</Text>
        <Text style={[styles.sheetSubtitle, { color: colors.subtext }]}>Unlock everything and pass with confidence</Text>

        <View style={styles.features}>
          {[
            { icon: 'checkmark-circle' as const, text: 'All 5 sections unlocked' },
            { icon: 'checkmark-circle' as const, text: 'Unlimited practice quizzes' },
            { icon: 'checkmark-circle' as const, text: 'Detailed progress analytics' },
            { icon: 'checkmark-circle' as const, text: 'Offline access' },
          ].map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <Ionicons name={f.icon} size={18} color={COLORS.green} />
              <Text style={[styles.featureText, { color: colors.bodyText }]}>{f.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.planOptions}>
          {PLANS.map((plan, i) => (
            <TouchableOpacity
              key={plan.name}
              style={[
                styles.planOption,
                { borderColor: colors.borderCard },
                selected === i && styles.planOptionSelected,
              ]}
              onPress={() => setSelected(i)}
              activeOpacity={0.8}
            >
              {plan.tag && (
                <View style={styles.planTag}>
                  <Text style={styles.planTagText}>{plan.tag}</Text>
                </View>
              )}
              <Text style={[styles.planOptionName, { color: colors.subtext }, selected === i && styles.planOptionNameSelected]}>
                {plan.name}
              </Text>
              <Text style={[styles.planOptionPrice, { color: colors.text }]}>
                {plan.price}
              </Text>
              <Text style={[styles.planOptionPeriod, { color: colors.subtext }, selected === i && styles.planOptionPeriodSelected]}>
                {plan.period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.subscribeBtn, SHADOW_CTA]} activeOpacity={0.85}>
          <Text style={styles.subscribeBtnText}>Subscribe — {PLANS[selected].price}{PLANS[selected].period}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
          <Text style={[styles.cancelText, { color: colors.subtext }]}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

/* ── FAQ Data ── */
const FAQS = [
  { q: 'What is the Life in the UK test?', a: 'The Life in the UK test is a compulsory requirement for anyone seeking Indefinite Leave to Remain or British citizenship. It covers British values, history, traditions and everyday life.' },
  { q: 'How many questions are on the test?', a: 'The test consists of 24 multiple-choice questions. You need to answer at least 18 correctly (75%) to pass. You have 45 minutes to complete it.' },
  { q: 'How does this app help me prepare?', a: 'DuoLife breaks the official handbook into bite-sized sections with quizzes, mock exams, and progress tracking so you can study at your own pace and know when you\'re ready.' },
  { q: 'Is the content up to date?', a: 'Yes. Our content is aligned with the latest edition of the official "Life in the United Kingdom: A Guide for New Residents" handbook.' },
  { q: 'Can I study offline?', a: 'Premium users can download all content for offline study. Free users need an internet connection.' },
  { q: 'How do I reset my progress?', a: 'Go to Account > scroll down and you\'ll find options to manage your data. You can reset quiz scores and learning progress independently.' },
];

/* ── Help & Support Modal ── */
function HelpModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, isDark } = useTheme();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const toggleFaq = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleSend = () => {
    if (!message.trim()) {
      Alert.alert('Empty message', 'Please write a message before sending.');
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setMessage('');
      Alert.alert('Message sent!', 'We\'ll get back to you within 24 hours.');
    }, 1000);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.helpSheet, { backgroundColor: colors.card }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

        <View style={styles.helpHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Help & Support</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={22} color={colors.subtext} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.helpScroll}>
          <Text style={[styles.helpSectionTitle, { color: colors.subtext }]}>FREQUENTLY ASKED QUESTIONS</Text>

          <View style={[styles.faqContainer, { backgroundColor: isDark ? colors.chipBg : '#F5F6F8', borderColor: colors.borderCard }]}>
            {FAQS.map((faq, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => toggleFaq(i)}
                activeOpacity={0.7}
                style={[
                  styles.faqItem,
                  i < FAQS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.faqQuestion}>
                  <Text style={[styles.faqQuestionText, { color: colors.text }]}>{faq.q}</Text>
                  <Ionicons
                    name={expandedFaq === i ? 'remove' : 'add'}
                    size={18}
                    color={colors.subtext}
                  />
                </View>
                {expandedFaq === i && (
                  <Text style={[styles.faqAnswer, { color: colors.bodyText }]}>{faq.a}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.helpSectionTitle, { color: colors.subtext, marginTop: 24 }]}>CONTACT US</Text>

          <View style={[styles.contactBox, { backgroundColor: isDark ? colors.chipBg : '#F5F6F8', borderColor: colors.borderCard }]}>
            <Text style={[styles.contactLabel, { color: colors.bodyText }]}>
              Have a question or found a bug? Send us a message and we'll get back to you.
            </Text>
            <TextInput
              style={[
                styles.contactInput,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Describe your issue or question..."
              placeholderTextColor={colors.subtext}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity
              style={[styles.sendBtn, SHADOW_CTA, sending && { opacity: 0.6 }]}
              onPress={handleSend}
              disabled={sending}
              activeOpacity={0.85}
            >
              <Text style={styles.sendBtnText}>{sending ? 'Sending...' : 'Send Message'}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ── Ionicon row helper ── */
function IconBadge({ name, color, iconColor }: { name: keyof typeof Ionicons.glyphMap; color: string; iconColor: string }) {
  return (
    <View style={[styles.iconBadge, { backgroundColor: color }]}>
      <Ionicons name={name} size={16} color={iconColor} />
    </View>
  );
}

/* ── Section header — refined ── */
function SectionLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={[styles.sectionLabel, { color: colors.subtext }]}>{label}</Text>
  );
}

function getOverallPct(): number {
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

export default function AccountScreen() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { isDark, toggleDark, colors } = useTheme();
  const [, forceUpdate] = useState(0);

  useFocusEffect(useCallback(() => { forceUpdate(n => n + 1); }, []));

  const overallPct = getOverallPct();
  const xp = getXP();
  const streak = getStreak();

  const iconBg = isDark ? colors.chipBg : '#F0F2F5';
  const iconTint = isDark ? '#9CA3AF' : '#6B7280';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Account</Text>
        </View>

        {/* ══════ PROFILE CARD — compact with edit affordance ══════ */}
        <View style={[styles.profileCard, { backgroundColor: colors.card }, SHADOW_CARD_SM]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{USERNAME.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.username, { color: colors.text }]}>{USERNAME}</Text>
            <Text style={[styles.email, { color: colors.subtext }]}>{EMAIL}</Text>
            <Text style={[styles.joinDate, { color: colors.mutedText }]}>{JOINED}</Text>
          </View>
          <TouchableOpacity style={styles.editProfile} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
          </TouchableOpacity>
        </View>

        {/* ══════ PROGRESS SUMMARY — makes account feel part of the product ══════ */}
        <View style={[styles.progressSummary, { backgroundColor: colors.card }, SHADOW_CARD_SM]}>
          <View style={styles.progressSummaryRow}>
            <View style={styles.progressStat}>
              <Text style={[styles.progressStatValue, { color: COLORS.blue }]}>{overallPct}%</Text>
              <Text style={[styles.progressStatLabel, { color: colors.subtext }]}>Completed</Text>
            </View>
            <View style={[styles.progressDivider, { backgroundColor: colors.border }]} />
            <View style={styles.progressStat}>
              <Text style={[styles.progressStatValue, { color: COLORS.orange }]}>{streak}</Text>
              <Text style={[styles.progressStatLabel, { color: colors.subtext }]}>Day Streak</Text>
            </View>
            <View style={[styles.progressDivider, { backgroundColor: colors.border }]} />
            <View style={styles.progressStat}>
              <Text style={[styles.progressStatValue, { color: COLORS.gold }]}>{xp.toLocaleString()}</Text>
              <Text style={[styles.progressStatLabel, { color: colors.subtext }]}>XP Earned</Text>
            </View>
          </View>
        </View>

        {/* ══════ PLAN CARD — compact, integrated ══════ */}
        <TouchableOpacity
          style={[styles.planCard, { backgroundColor: colors.card }, SHADOW_CARD_SM]}
          onPress={() => setShowUpgrade(true)}
          activeOpacity={0.8}
        >
          <View style={styles.planLeft}>
            <View style={styles.planRow}>
              <Text style={[styles.planName, { color: colors.text }]}>{PLAN}</Text>
              <View style={[styles.planBadge, { backgroundColor: COLORS.blueLight }]}>
                <Text style={styles.planBadgeText}>Free</Text>
              </View>
            </View>
            <Text style={[styles.planValue, { color: colors.subtext }]}>
              Upgrade for full access and faster progress
            </Text>
          </View>
          <View style={[styles.upgradeBtn]}>
            <Ionicons name="arrow-up-circle" size={14} color="#fff" />
            <Text style={styles.upgradeBtnText}>Upgrade</Text>
          </View>
        </TouchableOpacity>

        {/* ══════ PREFERENCES ══════ */}
        <SectionLabel label="Preferences" colors={colors} />

        <View style={[styles.section, { backgroundColor: colors.card }, SHADOW_CARD_SM]}>
          {/* Dark Mode */}
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <IconBadge name={isDark ? 'moon' : 'sunny'} color={iconBg} iconColor={iconTint} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Appearance</Text>
              <Text style={[styles.rowSub, { color: colors.mutedText }]}>Light or dark theme</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleDark}
              trackColor={{ false: '#ddd', true: COLORS.blue }}
              thumbColor="#fff"
            />
          </View>

          {/* Notifications */}
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <IconBadge name={notificationsEnabled ? 'notifications' : 'notifications-off'} color={iconBg} iconColor={iconTint} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Notifications</Text>
              <Text style={[styles.rowSub, { color: colors.mutedText }]}>
                {notificationsEnabled ? 'Reminders and streak updates' : 'Turned off'}
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#ddd', true: COLORS.blue }}
              thumbColor="#fff"
            />
          </View>

          {/* Language */}
          <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} activeOpacity={0.7}>
            <IconBadge name="globe-outline" color={iconBg} iconColor={iconTint} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Language</Text>
              <Text style={[styles.rowSub, { color: colors.mutedText }]}>English</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
          </TouchableOpacity>
        </View>

        {/* ══════ SUPPORT & LEGAL ══════ */}
        <SectionLabel label="Support & Legal" colors={colors} />

        <View style={[styles.section, { backgroundColor: colors.card }, SHADOW_CARD_SM]}>
          <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} activeOpacity={0.7} onPress={() => setShowHelp(true)}>
            <IconBadge name="help-circle-outline" color={iconBg} iconColor={iconTint} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Help & Support</Text>
              <Text style={[styles.rowSub, { color: colors.mutedText }]}>FAQs and contact us</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} activeOpacity={0.7}>
            <IconBadge name="shield-checkmark-outline" color={iconBg} iconColor={iconTint} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} activeOpacity={0.7}>
            <IconBadge name="document-text-outline" color={iconBg} iconColor={iconTint} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
          </TouchableOpacity>
        </View>

        {/* ══════ ACCOUNT — logout as a standard row ══════ */}
        <SectionLabel label="Account" colors={colors} />

        <View style={[styles.section, { backgroundColor: colors.card }, SHADOW_CARD_SM]}>
          <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} activeOpacity={0.7}>
            <IconBadge name="card-outline" color={iconBg} iconColor={iconTint} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Manage Subscription</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} activeOpacity={0.7}>
            <IconBadge name="trash-outline" color={iconBg} iconColor={iconTint} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Delete Account</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} activeOpacity={0.7}>
            <IconBadge name="log-out-outline" color={iconBg} iconColor={isDark ? '#E07070' : '#D05050'} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: '#D05050' }]}>Log Out</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <UpgradeModal visible={showUpgrade} onClose={() => setShowUpgrade(false)} />
      <HelpModal visible={showHelp} onClose={() => setShowHelp(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },

  /* ── Header — tighter ── */
  header: { paddingTop: 12, paddingBottom: 6 },
  title: { fontSize: 22, fontWeight: '800' },

  /* ── Section labels — refined: smaller, less tracking ── */
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 16,
    marginBottom: 6,
    marginLeft: 4,
  },

  /* ── Profile card — compact ── */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: CARD.borderRadius,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: COLORS.blueDark,
  },
  avatarText: { fontSize: 19, fontWeight: '900', color: '#fff' },
  profileInfo: { flex: 1, gap: 1 },
  username: { fontSize: 15, fontWeight: '700' },
  email: { fontSize: 12, fontWeight: '500' },
  joinDate: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  editProfile: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Progress summary ── */
  progressSummary: {
    borderRadius: CARD.borderRadius,
    padding: 14,
    marginBottom: 8,
  },
  progressSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  progressStat: { alignItems: 'center', gap: 2 },
  progressStatValue: { fontSize: 18, fontWeight: '900' },
  progressStatLabel: { fontSize: 10, fontWeight: '600' },
  progressDivider: { width: StyleSheet.hairlineWidth, height: 28 },

  /* ── Plan card — compact, cleaner ── */
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: CARD.borderRadius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 0,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.blue,
  },
  planLeft: { flex: 1, gap: 3 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planName: { fontSize: 14, fontWeight: '700' },
  planBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  planBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.blue },
  planValue: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  upgradeBtn: {
    backgroundColor: COLORS.blue,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.blueDark,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upgradeBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  /* ── Settings section ── */
  section: {
    borderRadius: CARD.borderRadius,
    marginBottom: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  rowContent: { flex: 1, gap: 1 },
  rowLabel: { fontSize: 14, fontWeight: '600' },
  rowSub: { fontSize: 11, fontWeight: '500' },

  /* ── Icon badge — smaller, unified ── */
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Modal ── */
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  sheetSubtitle: { fontSize: 14, textAlign: 'center', marginTop: 4, marginBottom: 20 },

  features: { gap: 8, marginBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 14, fontWeight: '600' },

  planOptions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  planOption: {
    flex: 1,
    borderWidth: 2,
    borderRadius: CARD.borderRadius,
    padding: 14,
    alignItems: 'center',
    position: 'relative',
  },
  planOptionSelected: { borderColor: COLORS.blue, backgroundColor: COLORS.blueLight },
  planTag: {
    position: 'absolute',
    top: -10,
    backgroundColor: COLORS.orange,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  planTagText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  planOptionName: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  planOptionNameSelected: { color: COLORS.blue },
  planOptionPrice: { fontSize: 22, fontWeight: '900' },
  planOptionPeriod: { fontSize: 12 },
  planOptionPeriodSelected: { color: '#666' },

  subscribeBtn: {
    backgroundColor: COLORS.blue,
    borderRadius: CTA.borderRadius,
    height: CTA.height + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: COLORS.blueDark,
    marginBottom: 12,
  },
  subscribeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontSize: 14, fontWeight: '600' },

  /* ── Help & Support Modal ── */
  helpSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 0,
    maxHeight: '85%',
  },
  helpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  helpScroll: { flexGrow: 0 },
  helpSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 2,
  },
  faqContainer: {
    borderRadius: CARD.borderRadius,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqItem: {
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  faqQuestionText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  faqAnswer: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    marginTop: 8,
  },
  contactBox: {
    borderRadius: CARD.borderRadius,
    borderWidth: 1,
    padding: 14,
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 12,
  },
  contactInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 14,
  },
  sendBtn: {
    backgroundColor: COLORS.blue,
    borderRadius: CTA.borderRadius,
    height: CTA.height,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: COLORS.blueDark,
  },
  sendBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
