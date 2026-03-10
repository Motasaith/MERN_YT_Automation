// Home Screen — Dashboard matching CreatorFlow design
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import StatBadge from '../../src/components/StatBadge';
import ToolCard from '../../src/components/ToolCard';
import SectionHeader from '../../src/components/SectionHeader';
import WorkflowStep from '../../src/components/WorkflowStep';
import Card from '../../src/components/Card';
import { COLORS, SPACING, RADIUS, TOOLS, WORKFLOW_STEPS } from '../../src/constants/theme';
import { getCredits, getVideos, getYouTubeStatus } from '../../src/services/api';

export default function HomeScreen() {
  const router = useRouter();
  const [credits, setCredits] = useState('--');
  const [videoCount, setVideoCount] = useState('--');
  const [ytConnected, setYtConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recentFiles, setRecentFiles] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [creditData, videoData, ytData] = await Promise.all([
        getCredits().catch(() => ({ credits: '--' })),
        getVideos().catch(() => ({ videos: [] })),
        getYouTubeStatus().catch(() => ({ authenticated: false })),
      ]);
      setCredits(String(creditData.credits));
      const vids = videoData.videos || [];
      setVideoCount(String(vids.length));
      setYtConnected(ytData.authenticated || false);
      setRecentFiles(vids.slice(0, 3).map((v) => ({
        id: v.filename,
        title: v.filename?.replace(/\.[^.]+$/, '').replace(/_/g, ' ') || 'Untitled',
        status: 'Ready',
        color: COLORS.success,
      })));
    } catch (e) {}
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDashboard(); }} tintColor={COLORS.primary} />}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient colors={COLORS.gradient} style={styles.logo}>
              <MaterialIcons name="auto-awesome" size={20} color="#fff" />
            </LinearGradient>
            <Text style={styles.appName}>CreatorFlow</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIcon}>
              <MaterialIcons name="search" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <MaterialIcons name="notifications-none" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatar}>
              <MaterialIcons name="person" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatBadge label="Files" value={videoCount} change="output" color={COLORS.primary} />
          <StatBadge label="Credits" value={credits} change="remaining" color={COLORS.warning} />
        </View>
        <View style={styles.statsRow}>
          <StatBadge label="YouTube" value={ytConnected ? 'Connected' : 'Offline'} change={ytConnected ? '✓' : '—'} color={ytConnected ? COLORS.success : COLORS.textMuted} />
          <StatBadge label="Server" value="Local" change="5000" color={COLORS.info} />
        </View>

        {/* Creative Ecosystem */}
        <SectionHeader title="Creative Ecosystem" actionText="View All Tools" onAction={() => {}} />
        {TOOLS.map((tool) => (
          <ToolCard
            key={tool.id}
            name={tool.name}
            desc={tool.desc}
            icon={tool.icon}
            onPress={() => router.push(tool.route)}
          />
        ))}

        {/* Content Workflow */}
        <SectionHeader title="Your Content Workflow" />
        <Card style={styles.workflowCard}>
          {WORKFLOW_STEPS.map((step, i) => (
            <WorkflowStep
              key={step.id}
              label={step.label}
              sublabel={step.sublabel}
              icon={step.icon}
              color={step.color}
              isLast={i === WORKFLOW_STEPS.length - 1}
            />
          ))}
        </Card>

        {/* Recent Files */}
        <SectionHeader title="Recent Files" actionText="See All" onAction={() => router.push('/(tabs)/library')} />
        {recentFiles.length === 0 ? (
          <Card style={styles.projectCard}>
            <Text style={{ color: COLORS.textMuted, textAlign: 'center' }}>No files yet — generate your first content!</Text>
          </Card>
        ) : recentFiles.map((p) => (
          <Card key={p.id} style={styles.projectCard} onPress={() => {}}>
            <View style={styles.projectRow}>
              <View style={[styles.projectThumb, { backgroundColor: p.color + '33' }]}>
                <MaterialIcons name="movie" size={20} color={p.color} />
              </View>
              <View style={styles.projectInfo}>
                <Text style={styles.projectTitle}>{p.title}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: p.color + '22', borderColor: p.color }]}>
                <Text style={[styles.statusText, { color: p.color }]}>{p.status}</Text>
              </View>
            </View>
          </Card>
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, paddingHorizontal: SPACING.lg },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  appName: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },

  // Workflow
  workflowCard: {
    paddingVertical: SPACING.lg,
  },

  // Projects
  projectCard: { marginBottom: SPACING.sm },
  projectRow: { flexDirection: 'row', alignItems: 'center' },
  projectThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  projectInfo: { flex: 1 },
  projectTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
});
