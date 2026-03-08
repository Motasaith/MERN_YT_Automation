// Library Tab — Shows saved scripts, generated media, projects
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../src/components/Card';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';

const TABS = ['All', 'Scripts', 'Videos', 'Audio', 'Images'];

const MOCK_ITEMS = [
  { id: 1, title: 'Top 10 AI Tools 2024', type: 'script', status: 'Editing', date: 'Mar 8, 2026', icon: 'description' },
  { id: 2, title: 'Crypto Market Analysis', type: 'video', status: 'Complete', date: 'Mar 7, 2026', icon: 'movie' },
  { id: 3, title: 'AI Future Narration', type: 'audio', status: 'Ready', date: 'Mar 6, 2026', icon: 'mic' },
  { id: 4, title: 'Tech Thumbnail Pack', type: 'image', status: 'Ready', date: 'Mar 5, 2026', icon: 'image' },
  { id: 5, title: 'YouTube Shorts Script', type: 'script', status: 'Draft', date: 'Mar 4, 2026', icon: 'description' },
];

export default function LibraryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');

  const filtered = activeTab === 'All'
    ? MOCK_ITEMS
    : MOCK_ITEMS.filter((i) => i.type === activeTab.toLowerCase().replace('s', ''));

  const getStatusColor = (status) => {
    switch (status) {
      case 'Complete': case 'Ready': return COLORS.success;
      case 'Editing': return COLORS.warning;
      default: return COLORS.textMuted;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <TouchableOpacity style={styles.searchBtn}>
          <MaterialIcons name="search" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Tab Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Items */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.itemCard} onPress={() => {}}>
            <View style={styles.itemRow}>
              <View style={[styles.iconWrap, { backgroundColor: COLORS.primaryGlow }]}>
                <MaterialIcons name={item.icon} size={22} color={COLORS.primary} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDate}>{item.date}</Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusLabel}>{item.status}</Text>
              </View>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabScroll: { maxHeight: 50 },
  tabRow: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary },
  list: { padding: SPACING.lg },
  itemCard: { marginBottom: SPACING.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  itemDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  statusDot: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusLabel: { fontSize: 10, fontWeight: '700', color: '#fff' },
});
