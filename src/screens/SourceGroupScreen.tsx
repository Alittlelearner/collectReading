import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useBookmarks } from '../hooks/useBookmarks';
import BookmarkCard from '../components/BookmarkCard';
import EmptyState from '../components/EmptyState';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import type { SourceGroupScreenProps } from '../navigation/types';
import { getSourceLabel } from '../utils/sourceMeta';

export default function SourceGroupScreen() {
  const route = useRoute<SourceGroupScreenProps['route']>();
  const navigation = useNavigation<SourceGroupScreenProps['navigation']>();
  const bookmarks = useBookmarks();
  const sourceType = route.params?.sourceType;

  const filtered = useMemo(
    () => bookmarks.bookmarks.filter((bookmark) => bookmark.sourceType === sourceType),
    [bookmarks.bookmarks, sourceType],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{getSourceLabel((sourceType as any) || 'other')}</Text>
        <Text style={styles.headerSubtitle}>这里收着同一来源的所有内容。</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookmarkCard
            bookmark={item}
            onPress={() => navigation.navigate('BookmarkDetail', { bookmarkId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState icon="bookshelf" title="该来源下还没有收藏" subtitle="返回收藏页，再收一点进来。" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  list: { paddingVertical: spacing.sm, paddingBottom: spacing.xl },
});
