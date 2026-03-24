import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const USERNAME = 'John Doe';
const EMAIL = 'john@example.com';
const PLAN = 'Free';

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
        <Text style={[styles.sheetSubtitle, { color: colors.subtext }]}>Unlock all sections and unlimited practice</Text>

        <View style={styles.features}>
          {[
            '✅  All 5 sections unlocked',
            '✅  Unlimited practice quizzes',
            '✅  Detailed progress analytics',
            '✅  Offline access',
          ].map((f) => (
            <Text key={f} style={[styles.featureText, { color: colors.bodyText }]}>{f}</Text>
          ))}
        </View>

        <View style={styles.planOptions}>
          {PLANS.map((plan, i) => (
            <TouchableOpacity
              key={plan.name}
              style={[
                styles.planOption,
                { borderColor: colors.border },
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

        <TouchableOpacity style={styles.subscribeBtn} activeOpacity={0.85}>
          <Text style={styles.subscribeBtnText}>Subscribe — {PLANS[selected].price}{PLANS[selected].period}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
          <Text style={[styles.cancelText, { color: colors.subtext }]}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

/* ── Icon badge helper ── */
function IconBadge({ icon, color }: { icon: string; color: string }) {
  return (
    <View style={[styles.iconBadge, { backgroundColor: color }]}>
      <Text style={styles.iconBadgeText}>{icon}</Text>
    </View>
  );
}

/* ── Section header ── */
function SectionLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={[styles.sectionLabel, { color: colors.subtext }]}>{label}</Text>
  );
}

export default function AccountScreen() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { isDark, toggleDark, colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Account</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>Manage your profile and preferences</Text>
        </View>

        {/* ══════ PROFILE SECTION ══════ */}
        <SectionLabel label="PROFILE" colors={colors} />

        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{USERNAME.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.username, { color: colors.text }]}>{USERNAME}</Text>
            <Text style={[styles.email, { color: colors.subtext }]}>{EMAIL}</Text>
          </View>
          <View style={[styles.planBadge, { backgroundColor: isDark ? '#1e2a4a' : '#eff6ff' }]}>
            <Text style={styles.planBadgeText}>Free</Text>
          </View>
        </View>

        {/* Plan / upgrade card */}
        <View style={[styles.planCard, { backgroundColor: colors.card }]}>
          <View style={styles.planLeft}>
            <Text style={[styles.planLabel, { color: colors.subtext }]}>Current Plan</Text>
            <Text style={[styles.planName, { color: colors.text }]}>{PLAN} Plan</Text>
            <Text style={[styles.planValue, { color: colors.mutedText }]}>
              Unlock full mock exams and faster progress
            </Text>
          </View>
          <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.8} onPress={() => setShowUpgrade(true)}>
            <Text style={styles.upgradeBtnIcon}>⭐</Text>
            <Text style={styles.upgradeBtnText}>Upgrade</Text>
          </TouchableOpacity>
        </View>

        {/* ══════ PREFERENCES SECTION ══════ */}
        <SectionLabel label="PREFERENCES" colors={colors} />

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          {/* Dark Mode */}
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <IconBadge icon={isDark ? '🌙' : '☀️'} color={isDark ? '#1e2a4a' : '#fff8e1'} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Dark Mode</Text>
              <Text style={[styles.rowSub, { color: colors.subtext }]}>Switch between light and dark theme</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleDark}
              trackColor={{ false: '#ddd', true: '#1a56db' }}
              thumbColor="#fff"
              style={styles.switchSize}
            />
          </View>

          {/* Notifications */}
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <IconBadge icon={notificationsEnabled ? '🔔' : '🔕'} color={isDark ? '#2a1e1e' : '#fff3e0'} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Notifications</Text>
              <Text style={[styles.rowSub, { color: colors.subtext }]}>
                {notificationsEnabled ? 'Practice reminders and streak alerts' : 'Notifications are turned off'}
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#ddd', true: '#1a56db' }}
              thumbColor="#fff"
              style={styles.switchSize}
            />
          </View>

          {/* Language */}
          <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} activeOpacity={0.7}>
            <IconBadge icon="🌐" color={isDark ? '#1e2a2a' : '#e8f5e9'} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Language</Text>
              <Text style={[styles.rowSub, { color: colors.subtext }]}>English</Text>
            </View>
            <Text style={[styles.rowChevron, { color: colors.border }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ══════ SUPPORT & LEGAL SECTION ══════ */}
        <SectionLabel label="SUPPORT & LEGAL" colors={colors} />

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} activeOpacity={0.7}>
            <IconBadge icon="💬" color={isDark ? '#1e2a4a' : '#e3f2fd'} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Help & Support</Text>
              <Text style={[styles.rowSub, { color: colors.subtext }]}>FAQs, contact us, report a problem</Text>
            </View>
            <Text style={[styles.rowChevron, { color: colors.border }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} activeOpacity={0.7}>
            <IconBadge icon="🔒" color={isDark ? '#2a1e2a' : '#fce4ec'} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Privacy Policy</Text>
            </View>
            <Text style={[styles.rowChevron, { color: colors.border }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} activeOpacity={0.7}>
            <IconBadge icon="📄" color={isDark ? '#2a2a1e' : '#f3e5f5'} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Terms of Service</Text>
            </View>
            <Text style={[styles.rowChevron, { color: colors.border }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ══════ ACCOUNT ACTIONS ══════ */}
        <SectionLabel label="ACCOUNT" colors={colors} />

        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.card }]} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

      <UpgradeModal visible={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },

  /* ── Header ── */
  header: { paddingTop: 12, paddingBottom: 4, gap: 2 },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 2 },

  /* ── Section labels ── */
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,
  },

  /* ── Profile card ── */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1a56db',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#1439a8',
  },
  avatarText: { fontSize: 22, fontWeight: '900', color: '#fff' },
  profileInfo: { flex: 1, gap: 2 },
  username: { fontSize: 17, fontWeight: '800' },
  email: { fontSize: 13, fontWeight: '500' },
  planBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  planBadgeText: { fontSize: 11, fontWeight: '800', color: '#1a56db' },

  /* ── Plan card ── */
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  planLeft: { flex: 1, gap: 2 },
  planLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  planName: { fontSize: 16, fontWeight: '800', marginTop: 1 },
  planValue: { fontSize: 12, fontWeight: '500', marginTop: 4, lineHeight: 16 },
  upgradeBtn: {
    backgroundColor: '#1a56db',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 3,
    borderBottomColor: '#1439a8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  upgradeBtnIcon: { fontSize: 13 },
  upgradeBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },

  /* ── Settings section ── */
  section: {
    borderRadius: 16,
    marginBottom: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    gap: 12,
  },
  rowContent: { flex: 1, gap: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 12, fontWeight: '500' },
  rowChevron: { fontSize: 18, fontWeight: '300' },

  /* ── Icon badge ── */
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeText: { fontSize: 17 },

  /* ── Switch ── */
  switchSize: { transform: [{ scaleX: 1.05 }, { scaleY: 1.05 }] },

  /* ── Logout ── */
  logoutBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,75,75,0.25)',
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#e05555' },

  /* ── Modal ── */
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
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
  featureText: { fontSize: 14, fontWeight: '600' },

  planOptions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  planOption: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    position: 'relative',
  },
  planOptionSelected: { borderColor: '#1a56db', backgroundColor: '#eff6ff' },
  planTag: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#ff9600',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  planTagText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  planOptionName: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  planOptionNameSelected: { color: '#1a56db' },
  planOptionPrice: { fontSize: 22, fontWeight: '900' },
  planOptionPeriod: { fontSize: 12 },
  planOptionPeriodSelected: { color: '#666' },

  subscribeBtn: {
    backgroundColor: '#1a56db',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#1439a8',
    marginBottom: 12,
  },
  subscribeBtnText: { fontSize: 16, fontWeight: '900', color: '#fff' },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontSize: 14, fontWeight: '600' },
});
