// Settings Tab — Account, server connection, preferences
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from '../../src/components/Card';
import GradientButton from '../../src/components/GradientButton';
import PremiumBadge from '../../src/components/PremiumBadge';
import { COLORS, SPACING, RADIUS, API_BASE_URL } from '../../src/constants/theme';
import { getCredits, checkHealth, getYouTubeStatus } from '../../src/services/api';

export default function SettingsScreen() {
  const [serverUrl, setServerUrl] = useState('http://192.168.1.100:5000');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [credits, setCredits] = useState(null);
  const [plan, setPlan] = useState('free');
  const [serverStatus, setServerStatus] = useState(null); // null=unknown, true=connected, false=failed
  const [testing, setTesting] = useState(false);
  const [ytConnected, setYtConnected] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const url = await AsyncStorage.getItem('serverUrl');
    if (url) setServerUrl(url);

    // Load credits
    try {
      const creditData = await getCredits();
      setCredits(creditData.credits);
      setPlan(creditData.plan || 'free');
    } catch (e) {}

    // Check YouTube status
    try {
      const ytData = await getYouTubeStatus();
      setYtConnected(ytData.authenticated || false);
    } catch (e) {}
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setServerStatus(null);
    await AsyncStorage.setItem('serverUrl', serverUrl);
    try {
      const res = await fetch(`${serverUrl}/api/health`, { timeout: 5000 });
      if (res.ok) {
        setServerStatus(true);
        Alert.alert('Connected', 'Server is reachable and running!');
      } else {
        setServerStatus(false);
        Alert.alert('Error', `Server returned status ${res.status}`);
      }
    } catch (err) {
      setServerStatus(false);
      Alert.alert('Connection Failed', `Could not reach ${serverUrl}\n\nMake sure the server is running and your phone is on the same network.`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        {/* Premium Section */}
        <Card glow style={styles.premiumCard}>
          <View style={styles.premiumRow}>
            <View>
              <Text style={styles.premiumTitle}>Upgrade to Pro</Text>
              <Text style={styles.premiumDesc}>Unlock AI video generation, unlimited scripts & more</Text>
            </View>
            <PremiumBadge />
          </View>
          <GradientButton
            title="View Plans"
            icon="star"
            onPress={() => Alert.alert('Premium', 'Coming soon!')}
            small
            style={{ marginTop: SPACING.md }}
          />
        </Card>

        {/* Credits */}
        <Card style={styles.sectionCard}>
          <View style={styles.creditRow}>
            <View>
              <Text style={styles.sectionTitle}>Credits Balance</Text>
              <Text style={styles.creditAmount}>{credits !== null ? `${credits} credits` : 'Loading...'}</Text>
              <Text style={styles.planLabel}>Plan: {plan.toUpperCase()}</Text>
            </View>
            <GradientButton title="Top Up" onPress={() => Alert.alert('Credits', 'Credit purchase coming soon!')} small outline />
          </View>
          <View style={styles.creditInfo}>
            <Text style={styles.creditDetail}>1 Script = 1 credit • 1 Voice = 2 credits • 1 AI Video = 10 credits</Text>
          </View>
        </Card>

        {/* Server Connection */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Server Connection</Text>
          <Text style={styles.sectionDesc}>Connect to your MERN backend server</Text>
          <TextInput
            style={styles.input}
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder="http://192.168.1.100:5000"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
          />
          {serverStatus !== null && (
            <View style={[styles.statusRow, { backgroundColor: serverStatus ? COLORS.success + '15' : COLORS.error + '15' }]}>
              <MaterialIcons name={serverStatus ? 'check-circle' : 'error'} size={16} color={serverStatus ? COLORS.success : COLORS.error} />
              <Text style={[styles.statusText, { color: serverStatus ? COLORS.success : COLORS.error }]}>
                {serverStatus ? 'Connected' : 'Connection failed'}
              </Text>
            </View>
          )}
          <GradientButton
            title="Save & Test Connection"
            onPress={handleTestConnection}
            loading={testing}
            small
            outline
            style={{ marginTop: SPACING.sm }}
          />
        </Card>

        {/* Preferences */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <SettingToggle label="Push Notifications" value={notifications} onToggle={setNotifications} icon="notifications" />
          <SettingToggle label="Dark Mode" value={darkMode} onToggle={setDarkMode} icon="dark-mode" />
          <SettingToggle label="Auto-Save Scripts" value={autoSave} onToggle={setAutoSave} icon="save" />
        </Card>

        {/* Account Actions */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={toggleStyles.row}>
            <MaterialIcons name="play-circle-filled" size={20} color="#FF0000" style={toggleStyles.icon} />
            <Text style={toggleStyles.label}>YouTube Connection</Text>
            <Text style={{ fontSize: 12, color: ytConnected ? COLORS.success : COLORS.textMuted, fontWeight: '600' }}>
              {ytConnected ? 'Connected' : 'Not Connected'}
            </Text>
          </View>
          <SettingLink label="Connected Platforms" icon="link" />
          <SettingLink label="Export Data" icon="download" />
          <SettingLink label="Privacy Policy" icon="privacy-tip" />
          <SettingLink label="Terms of Service" icon="gavel" />
        </Card>

        <TouchableOpacity style={styles.logoutBtn}>
          <MaterialIcons name="logout" size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>CreatorFlow v1.0.0</Text>
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingToggle({ label, value, onToggle, icon }) {
  return (
    <View style={toggleStyles.row}>
      <MaterialIcons name={icon} size={20} color={COLORS.textSecondary} style={toggleStyles.icon} />
      <Text style={toggleStyles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.border, true: COLORS.primary }}
        thumbColor={value ? '#fff' : COLORS.textMuted}
      />
    </View>
  );
}

function SettingLink({ label, icon, iconColor }) {
  return (
    <TouchableOpacity style={toggleStyles.row}>
      <MaterialIcons name={icon} size={20} color={iconColor || COLORS.textSecondary} style={toggleStyles.icon} />
      <Text style={toggleStyles.label}>{label}</Text>
      <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const toggleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  icon: { marginRight: 12 },
  label: { flex: 1, fontSize: 14, color: COLORS.text },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, paddingHorizontal: SPACING.lg },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginTop: SPACING.md, marginBottom: SPACING.md },

  premiumCard: { marginBottom: SPACING.md },
  premiumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  premiumTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  premiumDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, maxWidth: '70%' },

  sectionCard: { marginBottom: SPACING.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.sm },

  creditRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  creditAmount: { fontSize: 28, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
  planLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  creditInfo: { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  creditDetail: { fontSize: 12, color: COLORS.textMuted },

  input: {
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.sm,
  },

  statusRow: {
    flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: RADIUS.sm, marginTop: SPACING.sm,
  },
  statusText: { fontSize: 13, fontWeight: '600', marginLeft: 6 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.md,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: COLORS.error, marginLeft: 8 },
  version: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.md },
});
