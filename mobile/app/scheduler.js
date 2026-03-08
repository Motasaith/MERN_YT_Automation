// Social Scheduler — Multi-platform auto-posting tool
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientButton from '../src/components/GradientButton';
import Card from '../src/components/Card';
import { COLORS, SPACING, RADIUS } from '../src/constants/theme';

const PLATFORMS = [
  { id: 'youtube', name: 'YouTube', icon: 'play-circle-filled', color: '#FF0000' },
  { id: 'tiktok', name: 'TikTok', icon: 'music-note', color: '#00F2EA' },
  { id: 'instagram', name: 'Instagram', icon: 'photo-camera', color: '#E4405F' },
  { id: 'twitter', name: 'X / Twitter', icon: 'tag', color: '#1DA1F2' },
];

const SCHEDULED_POSTS = [
  { id: 1, title: 'AI Tools Review', platform: 'YouTube', date: 'Mar 10, 3:00 PM', status: 'Scheduled' },
  { id: 2, title: 'Quick Crypto Tip', platform: 'TikTok', date: 'Mar 11, 12:00 PM', status: 'Scheduled' },
  { id: 3, title: 'Behind the Scenes', platform: 'Instagram', date: 'Mar 11, 6:00 PM', status: 'Draft' },
];

export default function SchedulerScreen() {
  const router = useRouter();
  const [selectedPlatforms, setSelectedPlatforms] = useState(['youtube']);
  const [caption, setCaption] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');

  const togglePlatform = (id) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSchedule = () => {
    if (!caption.trim()) {
      Alert.alert('Required', 'Enter a caption for your post');
      return;
    }
    Alert.alert('Scheduled!', `Post scheduled to ${selectedPlatforms.join(', ')}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Social Scheduler</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Platform Selection */}
        <Text style={styles.sectionTitle}>Select Platforms</Text>
        <View style={styles.platformGrid}>
          {PLATFORMS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.platformBtn,
                selectedPlatforms.includes(p.id) && { borderColor: p.color, backgroundColor: p.color + '15' },
              ]}
              onPress={() => togglePlatform(p.id)}
            >
              <MaterialIcons
                name={p.icon}
                size={24}
                color={selectedPlatforms.includes(p.id) ? p.color : COLORS.textMuted}
              />
              <Text style={[
                styles.platformLabel,
                selectedPlatforms.includes(p.id) && { color: p.color },
              ]}>{p.name}</Text>
              {selectedPlatforms.includes(p.id) && (
                <MaterialIcons name="check-circle" size={16} color={p.color} style={styles.checkIcon} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Caption */}
        <Text style={styles.sectionTitle}>Caption</Text>
        <TextInput
          style={styles.captionInput}
          placeholder="Write your post caption..."
          placeholderTextColor={COLORS.textMuted}
          value={caption}
          onChangeText={setCaption}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Schedule Date */}
        <Text style={styles.sectionTitle}>Schedule Date & Time</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Mar 12, 2026 at 3:00 PM"
          placeholderTextColor={COLORS.textMuted}
          value={scheduleDate}
          onChangeText={setScheduleDate}
        />

        <GradientButton
          title="Schedule Post"
          icon="schedule-send"
          onPress={handleSchedule}
          style={{ marginTop: SPACING.xl }}
        />

        {/* Upcoming Posts */}
        <Text style={styles.sectionTitle}>Upcoming Posts</Text>
        {SCHEDULED_POSTS.map((post) => (
          <Card key={post.id} style={styles.postCard}>
            <View style={styles.postRow}>
              <View style={styles.postInfo}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <View style={styles.postMeta}>
                  <Text style={styles.postPlatform}>{post.platform}</Text>
                  <Text style={styles.postDate}> • {post.date}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, post.status === 'Scheduled'
                ? { backgroundColor: COLORS.success + '22', borderColor: COLORS.success }
                : { backgroundColor: COLORS.textMuted + '22', borderColor: COLORS.textMuted }
              ]}>
                <Text style={[styles.statusText, { color: post.status === 'Scheduled' ? COLORS.success : COLORS.textMuted }]}>
                  {post.status}
                </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  scroll: { flex: 1, paddingHorizontal: SPACING.lg },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: SPACING.xl, marginBottom: SPACING.md },

  platformGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  platformBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  platformLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginLeft: 10, flex: 1 },
  checkIcon: { marginLeft: 'auto' },

  captionInput: {
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    paddingTop: SPACING.lg,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  postCard: { marginBottom: SPACING.sm },
  postRow: { flexDirection: 'row', alignItems: 'center' },
  postInfo: { flex: 1 },
  postTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  postMeta: { flexDirection: 'row', marginTop: 4 },
  postPlatform: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  postDate: { fontSize: 12, color: COLORS.textMuted },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
});
