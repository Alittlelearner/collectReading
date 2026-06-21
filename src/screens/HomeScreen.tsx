import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBookmarks } from '../hooks/useBookmarks';
import { useFolders } from '../hooks/useFolders';
import { useResurface } from '../hooks/useResurface';
import { useTags } from '../hooks/useTags';
import BookmarkCard from '../components/BookmarkCard';
import ResurfaceCard from '../components/ResurfaceCard';
import SourceGrid from '../components/SourceGrid';
import TagCloud from '../components/TagCloud';
import AddFAB from '../components/AddFAB';
import EmptyState from '../components/EmptyState';
import { Bookmark, BookmarkFilter, Folder } from '../types';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';
import type { HomeScreenProps } from '../navigation/types';

type SidebarItem = {
  key: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  count: number | string;
  filters: BookmarkFilter;
};

type SidebarQuickFilter = {
  key: string;
  label: string;
  count: number;
  filters: BookmarkFilter;
};

type FolderContextMenuState = {
  visible: boolean;
  folder: Folder | null;
};

const isWeb = Platform.OS === 'web';

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenProps['navigation']>();
  const bookmarks = useBookmarks();
  const tags = useTags();
  const folders = useFolders();
  const resurface = useResurface();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSidebarKey, setActiveSidebarKey] = useState('all');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [folderMenu, setFolderMenu] = useState<FolderContextMenuState>({
    visible: false,
    folder: null,
  });

  const currentCandidate = resurface.candidates[resurface.currentIndex];
  const hasResurface = currentCandidate && !searchQuery && activeSidebarKey === 'all';
  const sourceGroups = bookmarks.getSourceGroups();
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
  const sidebarStats = bookmarks.sidebarStats;

  const sidebarItems = useMemo<SidebarItem[]>(
    () => [
      {
        key: 'unread',
        label: '未读',
        icon: 'radiobox-marked',
        count: sidebarStats.unreadCount || '空',
        filters: { scope: 'active', status: 'unread' },
      },
      {
        key: 'all',
        label: '全部收藏',
        icon: 'bookmark-multiple-outline',
        count: sidebarStats.allCount,
        filters: { scope: 'active' },
      },
      {
        key: 'starred',
        label: '星标',
        icon: 'star-outline',
        count: sidebarStats.starredCount,
        filters: { scope: 'all', starred: true },
      },
      {
        key: 'today',
        label: '今日',
        icon: 'white-balance-sunny',
        count: sidebarStats.todayCount,
        filters: { scope: 'active', createdAfter: startOfToday },
      },
      {
        key: 'notes',
        label: '标注',
        icon: 'sticker-text-outline',
        count: sidebarStats.noteCount,
        filters: { scope: 'all', hasNotes: true },
      },
    ],
    [sidebarStats, startOfToday],
  );

  const specialFolders = useMemo<SidebarItem[]>(
    () => [
      {
        key: 'untagged',
        label: '未分类',
        icon: 'folder-outline',
        count: sidebarStats.untaggedCount,
        filters: { scope: 'active', untagged: true },
      },
    ],
    [sidebarStats.untaggedCount],
  );

  const quickTags = useMemo<SidebarQuickFilter[]>(
    () =>
      tags.tags.map((tag) => ({
        key: `tag:${tag.id}`,
        label: tag.name,
        count: tag.bookmarkCount,
        filters: { scope: 'all', tagId: tag.id },
      })),
    [tags.tags],
  );

  const quickFolders = useMemo<SidebarQuickFilter[]>(
    () =>
      folders.folders.map((folder) => ({
        key: `folder:${folder.id}`,
        label: folder.name,
        count: folder.bookmarkCount,
        filters: { scope: 'all', folderId: folder.id },
      })),
    [folders.folders],
  );

  const handleSearch = useCallback(
    (text: string) => {
      setSearchQuery(text);
      bookmarks.setFilters({ searchQuery: text || undefined });
    },
    [bookmarks],
  );

  const applySidebarFilters = useCallback(
    (key: string, filters: BookmarkFilter) => {
      setActiveSidebarKey(key);
      bookmarks.replaceFilters({
        scope: filters.scope ?? 'active',
        status: filters.status,
        starred: filters.starred,
        hasNotes: filters.hasNotes,
        untagged: filters.untagged,
        createdAfter: filters.createdAfter,
        tagId: filters.tagId,
        folderId: filters.folderId,
        sourceType: filters.sourceType,
        searchQuery: searchQuery || undefined,
      });
      bookmarks.setView('timeline');
    },
    [bookmarks, searchQuery],
  );

  const beginFolderEdit = useCallback((folder: Folder) => {
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
    setFolderMenu({ visible: false, folder: null });
  }, []);

  const saveFolderEdit = useCallback(async () => {
    if (!editingFolderId) {
      return;
    }

    const nextName = editingFolderName.trim();
    if (!nextName) {
      setEditingFolderId(null);
      setEditingFolderName('');
      return;
    }

    await folders.updateFolder(editingFolderId, { name: nextName });
    setEditingFolderId(null);
    setEditingFolderName('');
  }, [editingFolderId, editingFolderName, folders]);

  const deleteFolder = useCallback(
    (folder: Folder) => {
      setFolderMenu({ visible: false, folder: null });
      Alert.alert('删除收藏夹', `确定删除“${folder.name}”吗？`, [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: () => folders.deleteFolder(folder.id) },
      ]);
    },
    [folders],
  );

  const openFolderMenu = useCallback((folder: Folder) => {
    setFolderMenu({ visible: true, folder });
  }, []);

  const timelineGroups = useMemo(() => {
    const groups: Record<string, Bookmark[]> = {};
    const today = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    const yesterday = today - 86400000;
    const weekAgo = today - 7 * 86400000;

    for (const bookmark of bookmarks.bookmarks) {
      const createdDay = new Date(new Date(bookmark.createdAt).setHours(0, 0, 0, 0)).getTime();
      let key = '更早';
      if (createdDay === today) key = '今天';
      else if (createdDay === yesterday) key = '昨天';
      else if (createdDay >= weekAgo) key = '本周';

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(bookmark);
    }

    return ['今天', '昨天', '本周', '更早']
      .filter((key) => groups[key]?.length)
      .map((key) => ({ title: key, data: groups[key] }));
  }, [bookmarks.bookmarks]);

  const renderBookmark = useCallback(
    ({ item }: { item: Bookmark }) => (
      <BookmarkCard
        bookmark={item}
        onPress={() => navigation.navigate('BookmarkDetail', { bookmarkId: item.id })}
        onToggleStar={() => bookmarks.toggleStar(item.id)}
      />
    ),
    [bookmarks, navigation],
  );

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>阅读馆藏</Text>
          <Text style={styles.headerTitle}>收藏</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerAction} onPress={() => navigation.navigate('StatsDashboard')}>
            <MaterialCommunityIcons name="chart-line" size={20} color={colors.primaryDark} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction} onPress={() => navigation.navigate('WikiHub')}>
            <MaterialCommunityIcons name="book-multiple-outline" size={20} color={colors.primaryDark} />
          </TouchableOpacity>
          {!isWeb ? (
            <TouchableOpacity style={styles.headerAction} onPress={() => navigation.navigate('AddBookmark')}>
              <MaterialCommunityIcons name="plus" size={20} color={colors.primaryDark} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {!isWeb ? (
        <View style={styles.heroCard}>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>把碎片内容收进一间像图书馆的书房</Text>
            <Text style={styles.heroSubtitle}>
              这里会按时间、来源、标签和收藏夹整理你的内容，也支持把重点内容转成实验性的 Wiki 结构。
            </Text>
          </View>
          <View style={styles.heroStamp}>
            <MaterialCommunityIcons name="library-shelves" size={28} color={colors.primary} />
          </View>
        </View>
      ) : null}

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索标题、作者、备注..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {isWeb ? <Text style={styles.searchShortcut}>Ctrl K</Text> : null}
      </View>

      {hasResurface ? (
        <ResurfaceCard
          bookmark={currentCandidate}
          onPress={() => navigation.navigate('BookmarkDetail', { bookmarkId: currentCandidate.id })}
          onSkip={() => resurface.skip()}
          onDone={() => resurface.done()}
        />
      ) : null}
    </>
  );

  const renderTimeline = () => {
    if (bookmarks.bookmarks.length === 0) {
      return (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderHeader()}
          <EmptyState
            icon="bookshelf"
            title="还没有内容"
            subtitle="点右侧添加，把第一条想读的内容收进你的阅读馆藏。"
          />
        </ScrollView>
      );
    }

    return (
      <SectionList
        sections={timelineGroups}
        keyExtractor={(item) => item.id}
        renderItem={renderBookmark}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
      />
    );
  };

  const renderSourceView = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {renderHeader()}
      {bookmarks.bookmarks.length === 0 ? (
        <EmptyState
          icon="bookshelf"
          title="还没有内容"
          subtitle="点右侧添加，把第一条想读的内容收进你的阅读馆藏。"
        />
      ) : (
        <View style={styles.panelBody}>
          <SourceGrid
            groups={sourceGroups}
            onPress={(sourceType) => navigation.navigate('SourceGroup', { sourceType })}
          />
        </View>
      )}
    </ScrollView>
  );

  const renderTagView = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {renderHeader()}
      {bookmarks.bookmarks.length === 0 ? (
        <EmptyState
          icon="bookshelf"
          title="还没有内容"
          subtitle="点右侧添加，把第一条想读的内容收进你的阅读馆藏。"
        />
      ) : (
        <View style={styles.panelBody}>
          <View style={styles.tagPanelHeader}>
            <Text style={styles.tagPanelTitle}>按标签翻找</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TagManage')}>
              <Text style={styles.tagPanelAction}>管理标签</Text>
            </TouchableOpacity>
          </View>
          <TagCloud
            tags={tags.tags}
            onPress={(tagId) => {
              applySidebarFilters(`tag:${tagId}`, { scope: 'all', tagId });
            }}
          />
        </View>
      )}
    </ScrollView>
  );

  const renderContent = () => {
    if (bookmarks.currentView === 'source') return renderSourceView();
    if (bookmarks.currentView === 'tag') return renderTagView();
    return renderTimeline();
  };

  const renderSidebarItem = (item: SidebarItem) => {
    const active = activeSidebarKey === item.key;
    return (
      <TouchableOpacity
        key={item.key}
        style={[styles.sidebarItem, active && styles.sidebarItemActive]}
        onPress={() => applySidebarFilters(item.key, item.filters)}
      >
        <View style={styles.sidebarItemLeft}>
          <MaterialCommunityIcons
            name={item.icon}
            size={18}
            color={active ? colors.primaryDark : colors.textSecondary}
          />
          <Text style={[styles.sidebarItemLabel, active && styles.sidebarItemLabelActive]}>{item.label}</Text>
        </View>
        <Text style={styles.sidebarItemCount}>{item.count}</Text>
      </TouchableOpacity>
    );
  };

  const renderFolderRow = (folder: SidebarQuickFilter) => {
    const active = activeSidebarKey === folder.key;
    const rawFolder = folders.folders.find((item) => item.id === folder.key.replace('folder:', ''));
    const isHovered = hoveredFolderId === rawFolder?.id;
    const isEditing = editingFolderId === rawFolder?.id;

    return (
      <View
        key={folder.key}
        {...(isWeb
          ? ({
              onPointerEnter: () => rawFolder && setHoveredFolderId(rawFolder.id),
              onPointerLeave: () =>
                rawFolder &&
                setHoveredFolderId((current) => (current === rawFolder.id ? null : current)),
            } as any)
          : {})}
      >
        <TouchableOpacity
          style={[styles.sidebarTagItem, active && styles.sidebarItemActive]}
          onPress={() => applySidebarFilters(folder.key, folder.filters)}
          onLongPress={() => rawFolder && openFolderMenu(rawFolder)}
          {...(isWeb
            ? ({
                onContextMenu: (event: any) => {
                  event.preventDefault?.();
                  if (rawFolder) {
                    openFolderMenu(rawFolder);
                  }
                },
              } as any)
            : {})}
          activeOpacity={0.9}
        >
          <View style={styles.folderRowMain}>
            <MaterialCommunityIcons name="folder-outline" size={17} color={colors.textSecondary} />
            {isEditing ? (
              <TextInput
                style={styles.folderInlineInput}
                value={editingFolderName}
                onChangeText={setEditingFolderName}
                onBlur={saveFolderEdit}
                onSubmitEditing={saveFolderEdit}
                autoFocus
              />
            ) : (
              <Text style={styles.sidebarItemLabel}>{folder.label}</Text>
            )}
          </View>

          <View style={styles.folderRowRight}>
            {isWeb && rawFolder && isHovered && !isEditing ? (
              <>
                <TouchableOpacity style={styles.folderIconBtn} onPress={() => beginFolderEdit(rawFolder)}>
                  <MaterialCommunityIcons name="pencil-outline" size={14} color={colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.folderIconBtn} onPress={() => openFolderMenu(rawFolder)}>
                  <MaterialCommunityIcons name="dots-horizontal" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              </>
            ) : null}
            <Text style={styles.sidebarItemCount}>{folder.count}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRailButton = (
    key: string,
    icon: keyof typeof MaterialCommunityIcons.glyphMap,
    onPress: () => void,
    active = false,
  ) => (
    <TouchableOpacity
      key={key}
      style={[styles.railButton, active && styles.railButtonActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={active ? colors.primaryDark : colors.textSecondary}
      />
    </TouchableOpacity>
  );

  const renderIconRail = () => (
    <View style={styles.iconRail}>
      <TouchableOpacity
        style={styles.profileAvatarBtn}
        onPress={() => navigation.navigate('ProfileMain')}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="account-circle-outline" size={24} color={colors.white} />
      </TouchableOpacity>

      <View style={styles.railGroup}>
        {renderRailButton('all', 'bookmark-multiple-outline', () =>
          applySidebarFilters('all', { scope: 'active' }), activeSidebarKey === 'all')}
        {renderRailButton('unread', 'radiobox-marked', () =>
          applySidebarFilters('unread', { scope: 'active', status: 'unread' }), activeSidebarKey === 'unread')}
        {renderRailButton('starred', 'star-outline', () =>
          applySidebarFilters('starred', { scope: 'all', starred: true }), activeSidebarKey === 'starred')}
        {renderRailButton('today', 'white-balance-sunny', () =>
          applySidebarFilters('today', { scope: 'active', createdAfter: startOfToday }), activeSidebarKey === 'today')}
        {renderRailButton('wiki', 'book-multiple-outline', () => navigation.navigate('WikiHub'))}
      </View>

      <View style={styles.railBottom}>
        {renderRailButton('add', 'plus', () => navigation.navigate('AddBookmark'))}
        {renderRailButton(
          'archive',
          'archive-outline',
          () => applySidebarFilters('archived', { scope: 'archived' }),
          activeSidebarKey === 'archived',
        )}
        {renderRailButton(
          'trash',
          'delete-outline',
          () => applySidebarFilters('deleted', { scope: 'deleted' }),
          activeSidebarKey === 'deleted',
        )}
        {renderRailButton(
          'collapse',
          sidebarCollapsed ? 'chevron-right' : 'chevron-left',
          () => setSidebarCollapsed((value) => !value),
        )}
      </View>
    </View>
  );

  if (!isWeb) {
    return (
      <SafeAreaView style={styles.container}>
        {renderContent()}
        <AddFAB onPress={() => navigation.navigate('AddBookmark')} />
      </SafeAreaView>
    );
  }

  const workspaceTitle =
    sidebarItems.find((item) => item.key === activeSidebarKey)?.label ||
    specialFolders.find((item) => item.key === activeSidebarKey)?.label ||
    quickFolders.find((item) => item.key === activeSidebarKey)?.label ||
    quickTags.find((item) => item.key === activeSidebarKey)?.label ||
    (activeSidebarKey === 'archived'
      ? '已归档'
      : activeSidebarKey === 'deleted'
        ? '最近删除'
        : '全部收藏');

  return (
    <SafeAreaView style={styles.webContainer}>
      <Modal transparent visible={folderMenu.visible} animationType="fade">
        <Pressable style={styles.menuBackdrop} onPress={() => setFolderMenu({ visible: false, folder: null })}>
          <View style={styles.contextMenu}>
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={() => folderMenu.folder && beginFolderEdit(folderMenu.folder)}
            >
              <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.contextMenuText}>重命名</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={() => folderMenu.folder && applySidebarFilters(`folder:${folderMenu.folder.id}`, { scope: 'all', folderId: folderMenu.folder.id })}
            >
              <MaterialCommunityIcons name="bookmark-multiple-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.contextMenuText}>查看内容</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={() => folderMenu.folder && deleteFolder(folderMenu.folder)}
            >
              <MaterialCommunityIcons name="delete-outline" size={16} color={colors.error} />
              <Text style={[styles.contextMenuText, { color: colors.error }]}>删除收藏夹</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <View style={styles.webShell}>
        {renderIconRail()}
        {!sidebarCollapsed ? (
        <View style={styles.sidebar}>
          <View style={styles.sidebarTop}>
            <View style={styles.workspaceRow}>
              <TouchableOpacity
                style={styles.workspaceAvatar}
                onPress={() => navigation.navigate('ProfileMain')}
                activeOpacity={0.85}
              >
                <Text style={styles.workspaceAvatarText}>藏</Text>
              </TouchableOpacity>
              <View style={styles.workspaceInfo}>
                <Text style={styles.workspaceName}>阅读馆藏</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.sidebarIconBtn}
              onPress={() => setSidebarCollapsed(true)}
            >
              <MaterialCommunityIcons name="chevron-left" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.sidebarSearchRow}>
            <View style={styles.sidebarSearchBox}>
              <MaterialCommunityIcons name="magnify" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.sidebarSearchInput}
                value={sidebarSearch}
                onChangeText={setSidebarSearch}
                placeholder="快速查找"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.sidebarSearchHint}>Ctrl K</Text>
            </View>
            <TouchableOpacity style={styles.sidebarAddBtn} onPress={() => navigation.navigate('AddBookmark')}>
              <MaterialCommunityIcons name="plus" size={18} color={colors.primaryDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.sidebarSection}>{sidebarItems.map(renderSidebarItem)}</View>

          <View style={styles.sidebarGroupHeader}>
            <Text style={styles.sidebarGroupTitle}>收藏夹</Text>
            <View style={styles.groupHeaderActions}>
              <TouchableOpacity style={styles.groupHeaderBtn} onPress={() => navigation.navigate('WikiHub')}>
                <MaterialCommunityIcons name="book-multiple-outline" size={16} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.groupHeaderManageBtn} onPress={() => navigation.navigate('FolderManage')}>
                <MaterialCommunityIcons name="pencil-outline" size={14} color={colors.primaryDark} />
                <Text style={styles.groupHeaderManageText}>管理</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sidebarSection}>{specialFolders.map(renderSidebarItem)}</View>
          <ScrollView style={styles.sidebarTagsWrap} showsVerticalScrollIndicator={false}>
            {quickFolders
              .filter((folder) => folder.label.toLowerCase().includes(sidebarSearch.toLowerCase()))
              .map(renderFolderRow)}
          </ScrollView>

          <View style={styles.sidebarGroupHeader}>
            <Text style={styles.sidebarGroupTitle}>标签</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TagManage')}>
              <MaterialCommunityIcons name="plus" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.sidebarTagsWrap} showsVerticalScrollIndicator={false}>
            {quickTags
              .filter((tag) => tag.label.toLowerCase().includes(sidebarSearch.toLowerCase()))
              .map((tag) => (
                <TouchableOpacity
                  key={tag.key}
                  style={[styles.sidebarTagItem, activeSidebarKey === tag.key && styles.sidebarItemActive]}
                  onPress={() => applySidebarFilters(tag.key, tag.filters)}
                >
                  <View style={styles.sidebarItemLeft}>
                    <MaterialCommunityIcons name="pound" size={17} color={colors.textSecondary} />
                    <Text style={styles.sidebarItemLabel}>{tag.label}</Text>
                  </View>
                  <Text style={styles.sidebarItemCount}>{tag.count}</Text>
                </TouchableOpacity>
              ))}
          </ScrollView>

          <View style={styles.sidebarFooter}>
            <TouchableOpacity
              style={[styles.sidebarFooterRow, activeSidebarKey === 'archived' && styles.sidebarItemActive]}
              onPress={() => applySidebarFilters('archived', { scope: 'archived' })}
            >
              <View style={styles.sidebarItemLeft}>
                <MaterialCommunityIcons name="archive-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.sidebarItemLabel}>已归档</Text>
              </View>
              <Text style={styles.sidebarItemCount}>{sidebarStats.archivedCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sidebarTrashBtn, activeSidebarKey === 'deleted' && styles.sidebarItemActive]}
              onPress={() => applySidebarFilters('deleted', { scope: 'deleted' })}
            >
              <MaterialCommunityIcons name="delete-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.sidebarTrashText}>最近删除</Text>
              <Text style={styles.sidebarItemCount}>{sidebarStats.deletedCount}</Text>
            </TouchableOpacity>
          </View>
        </View>
        ) : null}

        <View style={styles.workspace}>
          <View style={styles.workspaceHeader}>
            <Text style={styles.workspaceTitle}>{workspaceTitle}</Text>
            <Text style={styles.workspaceSubtitle}>
              保留你最近整理过的内容，方便随时回看、归档、继续阅读，也可以把它们编织成实验 Wiki。
            </Text>
          </View>
          <View style={styles.workspaceBody}>{renderContent()}</View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#f6f1e8',
  },
  webShell: {
    flex: 1,
    flexDirection: 'row',
  },
  iconRail: {
    width: 56,
    backgroundColor: '#efe6d8',
    borderRightWidth: 1,
    borderRightColor: '#dfd2c0',
    paddingTop: 18,
    paddingBottom: 18,
    alignItems: 'center',
  },
  profileAvatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  railGroup: {
    gap: 8,
    alignItems: 'center',
  },
  railBottom: {
    marginTop: 'auto',
    gap: 8,
    alignItems: 'center',
  },
  railButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railButtonActive: {
    backgroundColor: '#e2d5c3',
  },
  sidebar: {
    width: 292,
    backgroundColor: '#f9f6f0',
    borderRightWidth: 1,
    borderRightColor: '#e6ddd0',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
  },
  workspace: {
    flex: 1,
    backgroundColor: colors.background,
  },
  workspaceHeader: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8dfd1',
    backgroundColor: '#f8f3ea',
  },
  workspaceTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  workspaceSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
  workspaceBody: {
    flex: 1,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextMenu: {
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    shadowColor: colors.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  contextMenuText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  sidebarTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workspaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  workspaceAvatar: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#5b4332',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workspaceAvatarText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  workspaceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workspaceName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  sidebarIconBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarSearchRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
    marginBottom: 18,
  },
  sidebarSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede7dd',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  sidebarSearchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    marginLeft: 8,
  },
  sidebarSearchHint: {
    color: colors.textMuted,
    fontSize: 12,
  },
  sidebarAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarSection: {
    gap: 4,
  },
  sidebarItem: {
    height: 38,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  sidebarItemActive: {
    backgroundColor: '#ece3d2',
  },
  sidebarItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sidebarItemLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  sidebarItemLabelActive: {
    color: colors.primaryDark,
  },
  sidebarItemCount: {
    color: '#8c7d6d',
    fontSize: 13,
  },
  sidebarGroupHeader: {
    marginTop: 18,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupHeaderActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  groupHeaderBtn: {
    padding: 4,
  },
  groupHeaderManageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupHeaderManageText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  sidebarGroupTitle: {
    color: '#9a8b79',
    fontSize: 13,
    fontWeight: '700',
  },
  sidebarTagsWrap: {
    maxHeight: 180,
  },
  sidebarTagItem: {
    height: 36,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 2,
  },
  folderRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  folderRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  folderInlineInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.text,
    fontSize: 13,
  },
  folderIconBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarFooter: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#e5dbcc',
    paddingTop: 14,
    gap: 8,
  },
  sidebarFooterRow: {
    height: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  sidebarTrashBtn: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ded3c4',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  sidebarTrashText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 96,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerEyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 1,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 2,
  },
  headerAction: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  heroStamp: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  searchContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: spacing.md,
  },
  searchShortcut: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  listContent: {
    paddingBottom: 96,
  },
  panelBody: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  tagPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tagPanelTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  tagPanelAction: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
