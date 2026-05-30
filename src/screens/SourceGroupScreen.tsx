import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useBookmarks } from '../hooks/useBookmarks';
import BookmarkCard from '../components/BookmarkCard';
import EmptyState from '../components/EmptyState';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import type { SourceGroupScreenProps } from '../navigation/types';

export default function SourceGroupScreen() {
  const route = useRoute<SourceGroupScreenProps['route']>();
  const navigation = useNavigation<SourceGroupScreenProps['navigation']>();
  const bookmarks = useBookmarks();
  const sourceType = route.params?.sourceType;

  const filtered = useMemo(
    () => bookmarks.bookmarks.filter((b) => b.sourceType === sourceType),
    [bookmarks.bookmarks, sourceType],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookmarkCard
            bookmark={item}
            onPress={() =>
              navigation.navigate('BookmarkDetail', { bookmarkId: item.id })
            }
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState icon="📂" title="该来源暂无收藏" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingVertical: spacing.lg },
});
