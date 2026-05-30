import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  SectionList,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBookmarks } from '../hooks/useBookmarks';
import { useResurface } from '../hooks/useResurface';
import { useTags } from '../hooks/useTags';
import BookmarkCard from '../components/BookmarkCard';
import ResurfaceCard from '../components/ResurfaceCard';
import ViewTabBar from '../components/ViewTabBar';
import SourceGrid from '../components/SourceGrid';
import TagCloud from '../components/TagCloud';
import AddFAB from '../components/AddFAB';
import EmptyState from '../components/EmptyState';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import type { HomeScreenProps } from '../navigation/types';

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenProps['navigation']>();
  const bookmarks = useBookmarks();
  const resurface = useResurface();
  const tags = useTags();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    bookmarks.setFilters({ searchQuery: text || undefined });
  }, []);

  const currentCandidate = resurface.candidates[resurface.currentIndex];
  const hasResurface = currentCandidate && !searchQuery;

  const sourceGroups = bookmarks.getSourceGroups();

  const timelineGroups = (() => {
    const groups: Record<string, typeof bookmarks.bookmarks> = {};
    const now = Date.now();
    const today = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    const yesterday = today - 86400000;
    const weekAgo = today - 7 * 86400000;

    for (const b of bookmarks.bookmarks) {
      const createdDay = new Date(new Date(b.createdAt).setHours(0, 0, 0, 0)).getTime();
      let key: string;
      if (createdDay === today) key = '今天';
      else if (createdDay === yesterday) key = '昨天';
      else if (createdDay >= weekAgo) key = '本周';
      else key = '更早';
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    }

    const order = ['今天', '昨天', '本周', '更早'];
    return order
      .filter((k) => groups[k]?.length)
      .map((k) => ({ title: k, data: groups[k] }));
  })();

  const renderBookmark = useCallback(
    ({ item }: { item: (typeof bookmarks.bookmarks)[0] }) => (
      <BookmarkCard
        bookmark={item}
        onPress={() => navigation.navigate('BookmarkDetail', { bookmarkId: item.id })}
      />
    ),
    [],
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <Text style={styles.sectionHeader}>{section.title}</Text>
  );

  const renderContent = () => {
    if (bookmarks.bookmarks.length === 0) {
      return (
        <EmptyState
          icon="📚"
          title="还没有收藏"
          subtitle="点击右下角按钮添加第一条收藏"
        />
      );
    }

    if (bookmarks.currentView === 'source') {
      return (
        <View style={{ paddingTop: spacing.lg }}>
          <SourceGrid
            groups={sourceGroups}
            onPress={(sourceType) => {
              bookmarks.setFilters({ sourceType: sourceType as any });
            }}
          />
        </View>
      );
    }

    if (bookmarks.currentView === 'tag') {
      return (
        <View style={{ paddingTop: spacing.lg }}>
          <TagCloud
            tags={tags.tags}
            onPress={(tagId) => {
              bookmarks.setFilters({ tagId });
            }}
          />
        </View>
      );
    }

    return (
      <SectionList
        sections={timelineGroups}
        keyExtractor={(item) => item.id}
        renderItem={renderBookmark}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>收藏</Text>
        <TouchableOpacity onPress={() => navigation.navigate('StatsDashboard')}>
          <Text style={styles.statsBtn}>📊</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索收藏..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {hasResurface && (
        <ResurfaceCard
          bookmark={currentCandidate}
          onPress={() =>
            navigation.navigate('BookmarkDetail', { bookmarkId: currentCandidate.id })
          }
          onSkip={() => resurface.skip()}
          onDone={() => resurface.done()}
        />
      )}

      <ViewTabBar current={bookmarks.currentView} onChange={bookmarks.setView} />

      {renderContent()}

      <AddFAB onPress={() => navigation.navigate('AddBookmark')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  statsBtn: {
    fontSize: 22,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  sectionHeader: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  listContent: {
    paddingBottom: 80,
  },
});
