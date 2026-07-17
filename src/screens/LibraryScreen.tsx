import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLibrary } from '../hooks/useLibrary';
import { LibraryItem } from '../types';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';
import {
  chooseWebLibraryRootDirectory,
  getWebLibraryRootDirectoryName,
  hasWebLibraryRootDirectory,
  isWebDirectoryPickerAvailable,
} from '../services/libraryFileService';

function formatFileSize(size: number): string {
  if (!size) return 'Unknown size';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function getStatusLabel(status: LibraryItem['status']): string {
  if (status === 'finished') return 'Finished';
  if (status === 'reading') return 'Reading';
  return 'Unread';
}

export default function LibraryScreen() {
  const navigation = useNavigation<any>();
  const library = useLibrary();
  const [query, setQuery] = useState('');
  const [importing, setImporting] = useState(false);
  const [webDirectoryName, setWebDirectoryName] = useState<string | null>(
    getWebLibraryRootDirectoryName(),
  );

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return library.items;
    return library.items.filter((item) =>
      [item.title, item.fileName, item.fileExt, item.author || '']
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    );
  }, [library.items, query]);

  useFocusEffect(
    useCallback(() => {
      library.refresh();
    }, [library.refresh]),
  );

  const importFiles = async () => {
    if (Platform.OS === 'web') {
      if (!isWebDirectoryPickerAvailable()) {
        Alert.alert(
          'Browser not supported',
          'Saving files to a local folder requires a Chromium-based browser with directory access support.',
        );
        return;
      }

      if (!hasWebLibraryRootDirectory()) {
        Alert.alert('Choose a save folder first', 'Please choose the folder where bookshelf files should be stored, then import the PDF again.');
        return;
      }
    }

    setImporting(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
        base64: Platform.OS === 'web',
      });

      if (result.canceled || !result.assets?.length) {
        console.info('[Library] Import canceled or empty result');
        return;
      }

      console.info('[Library] Picked files', result.assets.map((asset) => ({
        name: asset.name,
        mimeType: asset.mimeType,
        size: asset.size,
      })));
      const imported = await library.importAssets(result.assets);
      if (imported.length === 0) {
        Alert.alert('No supported files', 'Please choose pdf, epub, txt, md, doc, docx, mobi, azw3, html, or htm files.');
        return;
      }
      Alert.alert('Import complete', `${imported.length} file(s) added to the bookshelf.`);
    } catch (err: any) {
      console.error('[Library] Import failed', err);
      if (err?.message === 'WEB_LIBRARY_DIRECTORY_REQUIRED') {
        Alert.alert('Choose a save folder first', 'Please choose a bookshelf save folder before importing files.');
        return;
      }
      Alert.alert('Import failed', err.message || 'Please try again later.');
    } finally {
      setImporting(false);
    }
  };

  const chooseWebDirectory = async () => {
    try {
      const directoryName = await chooseWebLibraryRootDirectory();
      setWebDirectoryName(directoryName);
      Alert.alert(
        'Folder selected',
        `Files will be saved under ${directoryName}/collection_read_library/books/.`,
      );
    } catch (err: any) {
      console.error('[Library] Choose directory failed', err);
      Alert.alert('Cannot choose folder', err.message || 'Please try again in a Chromium-based browser.');
    }
  };

  const renderItem = ({ item }: { item: LibraryItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('LibraryItemDetail', { libraryItemId: item.id })}
      activeOpacity={0.86}
    >
      <View style={styles.fileIcon}>
        <MaterialCommunityIcons name="file-document-outline" size={26} color={colors.primaryDark} />
        <Text style={styles.fileExt}>{item.fileExt.toUpperCase()}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>{item.fileName}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.meta}>{formatFileSize(item.fileSize)}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Local Library</Text>
          <Text style={styles.headerTitle}>Bookshelf</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={importFiles} disabled={importing}>
          <MaterialCommunityIcons name="tray-arrow-down" size={20} color={colors.white} />
          <Text style={styles.headerButtonText}>{importing ? 'Importing' : 'Import'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search title, author, file type..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <View style={styles.quickActions}>
        {Platform.OS === 'web' ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={chooseWebDirectory}>
            <MaterialCommunityIcons name="folder-open-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.secondaryButtonText}>
              {webDirectoryName ? `Save to ${webDirectoryName}` : 'Choose Save Folder'}
            </Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('MarkdownNotes')}>
          <MaterialCommunityIcons name="notebook-edit-outline" size={18} color={colors.primaryDark} />
          <Text style={styles.secondaryButtonText}>Open Notes</Text>
        </TouchableOpacity>
      </View>

      {library.loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="bookshelf" size={44} color={colors.primaryLight} />
              <Text style={styles.emptyTitle}>No local books yet</Text>
              <Text style={styles.emptyText}>Import files and they will be copied into the project library folder.</Text>
            </View>
          }
        />
      )}
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
    padding: spacing.lg,
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  searchBox: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },
  list: {
    padding: spacing.lg,
    paddingBottom: 96,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  fileIcon: {
    width: 68,
    height: 82,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  fileExt: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '900',
  },
  cardBody: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 25,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  cardFooter: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusBadge: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  loading: {
    marginTop: spacing.xxl,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 72,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
});
