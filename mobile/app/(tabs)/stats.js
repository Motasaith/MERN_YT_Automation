// Stats Tab — Analytics dashboard
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Card from '../../src/components/Card';
import StatBadge from '../../src/components/StatBadge';
import SectionHeader from '../../src/components/SectionHeader';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';

const PLATFORM_STATS = [
  { platform: 'YouTube', icon: 'play-circle-filled', subs: '12.4K', views: '89K', color: '#FF0000' },
  { platform: 'TikTok', icon: 'music-note', subs: '8.2K', views: '245K', color: '#00F2EA' },
  { platform: 'Instagram', icon: 'photo-camera', subs: '5.1K', views: '34K', color: '#E4405F' },
];

const RECENT_ACTIVITY = [
  { id: 1, action: 'Script generated', detail: '"Top 10 AI Tools"', time: '2h ago', icon: 'description' },
  { id: 2, action: 'Video published', detail: '"Crypto Analysis"', time: '5h ago', icon: 'cloud-upload' },
  { id: 3, action: 'Thumbnail created', detail: '"Tech Review"', time: '1d ago', icon: 'image' },
  { id: 4, action: 'Post scheduled', detail: 'Instagram Reel', time: '1d ago', icon: 'schedule' },
];

export default function StatsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Analytics</Text>

        {/* Overview Stats */}
        <View style={styles.row}>
          <StatBadge label="Total Views" value="368K" change="+18%" color={COLORS.primary} />
          <StatBadge label="Subscribers" value="25.7K" change="+340" color={COLORS.success} />
        </View>
        <View style={styles.row}>
          <StatBadge label="Videos Created" value="47" color={COLORS.info} />
          <StatBadge label="Avg. CTR" value="6.2%" change="+0.8%" color={COLORS.warning} />
        </View>

        {/* Platform Breakdown */}
        <SectionHeader title="Platform Performance" />
        {PLATFORM_STATS.map((p) => (
          <Card key={p.platform} style={styles.platformCard}>
            <View style={styles.platformRow}>
              <View style={[styles.platformIcon, { backgroundColor: p.color + '22' }]}>
                <MaterialIcons name={p.icon} size={22} color={p.color} />
              </View>
              <View style={styles.platformInfo}>
                <Text style={styles.platformName}>{p.platform}</Text>
                <Text style={styles.platformSubs}>{p.subs} subscribers</Text>
              </View>
              <Text style={[styles.platformViews, { color: p.color }]}>{p.views} views</Text>
            </View>
          </Card>
        ))}

        {/* Recent Activity */}
        <SectionHeader title="Recent Activity" />
        {RECENT_ACTIVITY.map((a) => (
          <Card key={a.id} style={styles.activityCard}>
            <View style={styles.activityRow}>
              <View style={styles.activityIcon}>
                <MaterialIcons name={a.icon} size={18} color={COLORS.primary} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityAction}>{a.action}</Text>
                <Text style={styles.activityDetail}>{a.detail}</Text>
              </View>
              <Text style={styles.activityTime}>{a.time}</Text>
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
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginTop: SPACING.md, marginBottom: SPACING.sm },
  row: { flexDirection: 'row', marginTop: SPACING.sm },

  platformCard: { marginBottom: SPACING.sm },
  platformRow: { flexDirection: 'row', alignItems: 'center' },
  platformIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  platformInfo: { flex: 1 },
  platformName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  platformSubs: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  platformViews: { fontSize: 13, fontWeight: '700' },

  activityCard: { marginBottom: SPACING.xs },
  activityRow: { flexDirection: 'row', alignItems: 'center' },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  activityInfo: { flex: 1 },
  activityAction: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  activityDetail: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  activityTime: { fontSize: 11, color: COLORS.textMuted },
});
