// Stats Tab — Analytics dashboard with real data
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Card from '../../src/components/Card';
import StatBadge from '../../src/components/StatBadge';
import SectionHeader from '../../src/components/SectionHeader';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { getVideos, getCredits, getYouTubeStatus, getScheduledPosts } from '../../src/services/api';

export default function StatsScreen() {
  const [videoCount, setVideoCount] = useState('--');
  const [credits, setCredits] = useState('--');
  const [ytConnected, setYtConnected] = useState(false);
  const [scheduledCount, setScheduledCount] = useState('--');
  const [files, setFiles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const [vidData, creditData, ytData, schedData] = await Promise.all([
        getVideos().catch(() => ({ videos: [] })),
        getCredits().catch(() => ({ credits: '--' })),
        getYouTubeStatus().catch(() => ({ authenticated: false })),
        getScheduledPosts().catch(() => ({ posts: [] })),
      ]);
      const vids = vidData.videos || [];
      setFiles(vids);
      setVideoCount(String(vids.length));
      setCredits(String(creditData.credits));
      setYtConnected(ytData.authenticated || false);
      setScheduledCount(String((schedData.posts || []).length));
    } catch (e) {}
    setRefreshing(false);
  };

  const ext = (name) => (name || '').split('.').pop().toLowerCase();
  const audioCount = files.filter((f) => ext(f.filename) === 'mp3').length;
  const imageCount = files.filter((f) => ['png','jpg','jpeg','webp'].includes(ext(f.filename))).length;
  const videoFileCount = files.filter((f) => ['mp4','mkv','avi','mov'].includes(ext(f.filename))).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} tintColor={COLORS.primary} />}>
        <Text style={styles.title}>Analytics</Text>

        {/* Overview Stats */}
        <View style={styles.row}>
          <StatBadge label="Total Files" value={videoCount} color={COLORS.primary} />
          <StatBadge label="Credits Left" value={credits} color={COLORS.warning} />
        </View>
        <View style={styles.row}>
          <StatBadge label="Scheduled" value={scheduledCount} color={COLORS.info} />
          <StatBadge label="YouTube" value={ytConnected ? 'Connected' : 'Offline'} color={ytConnected ? COLORS.success : COLORS.textMuted} />
        </View>

        {/* File Breakdown */}
        <SectionHeader title="File Breakdown" />
        {[
          { label: 'Videos', icon: 'movie', count: videoFileCount, color: COLORS.primary },
          { label: 'Audio', icon: 'audiotrack', count: audioCount, color: '#00F2EA' },
          { label: 'Images', icon: 'image', count: imageCount, color: '#E4405F' },
        ].map((item) => (
          <Card key={item.label} style={styles.platformCard}>
            <View style={styles.platformRow}>
              <View style={[styles.platformIcon, { backgroundColor: item.color + '22' }]}>
                <MaterialIcons name={item.icon} size={22} color={item.color} />
              </View>
              <View style={styles.platformInfo}>
                <Text style={styles.platformName}>{item.label}</Text>
                <Text style={styles.platformSubs}>{item.count} file{item.count !== 1 ? 's' : ''}</Text>
              </View>
              <Text style={[styles.platformViews, { color: item.color }]}>{item.count}</Text>
            </View>
          </Card>
        ))}

        {/* Recent Files */}
        <SectionHeader title="Recent Files" />
        {files.length === 0 ? (
          <Card style={styles.activityCard}>
            <Text style={{ color: COLORS.textMuted, textAlign: 'center' }}>No files generated yet</Text>
          </Card>
        ) : files.slice(0, 6).map((f, i) => (
          <Card key={f.filename} style={styles.activityCard}>
            <View style={styles.activityRow}>
              <View style={styles.activityIcon}>
                <MaterialIcons name={['mp4','mkv','avi','mov'].includes(ext(f.filename)) ? 'movie' : ext(f.filename) === 'mp3' ? 'audiotrack' : 'image'} size={18} color={COLORS.primary} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityAction} numberOfLines={1}>{f.filename}</Text>
                <Text style={styles.activityDetail}>{f.size ? `${(f.size / 1024).toFixed(0)} KB` : 'File'}</Text>
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
