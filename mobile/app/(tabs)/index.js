// Home Screen — Dashboard matching CreatorFlow design
import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
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

export default function HomeScreen() {
  const router = useRouter();

  const activeProjects = [
    { id: 1, title: '"Top 10 AI Tools 2024"', status: 'Editing', color: COLORS.warning },
    { id: 2, title: '"Crypto Market Secrets"', status: 'Drafting', color: COLORS.textMuted },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
          <StatBadge label="Total Reach" value="1.2M" change="+12%" color={COLORS.primary} />
          <StatBadge label="Engagement" value="8.4%" change="+2.5%" color={COLORS.info} />
        </View>
        <View style={styles.statsRow}>
          <StatBadge label="Active Projects" value="12" change="+4" color={COLORS.success} />
          <StatBadge label="Credits Left" value="850" change="Top up" color={COLORS.warning} />
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

        {/* Active Projects */}
        <SectionHeader title="Active Projects" actionText="See All" onAction={() => router.push('/library')} />
        {activeProjects.map((p) => (
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
