import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type HomeStackParamList = {
  HomeMain: undefined;
  BookmarkDetail: { bookmarkId: string };
  AddBookmark: { url?: string } | undefined;
  TagManage: undefined;
  FolderManage: undefined;
  SourceGroup: { sourceType: string } | undefined;
  StatsDashboard: undefined;
  WikiHub: undefined;
  WikiDetail: { wikiId: string };
  Library: undefined;
  LibraryItemDetail: { libraryItemId: string };
  MarkdownNotes: undefined;
  MarkdownNoteDetail: { noteId: string };
  MarkdownNoteEditor: { noteId: string };
  ProfileMain: undefined;
  Settings: undefined;
  Achievements: undefined;
};

export type HomeScreenProps = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;

export type BookmarkDetailScreenProps = NativeStackScreenProps<HomeStackParamList, 'BookmarkDetail'>;
export type AddBookmarkScreenProps = NativeStackScreenProps<HomeStackParamList, 'AddBookmark'>;
export type TagManageScreenProps = NativeStackScreenProps<HomeStackParamList, 'TagManage'>;
export type FolderManageScreenProps = NativeStackScreenProps<HomeStackParamList, 'FolderManage'>;
export type SourceGroupScreenProps = NativeStackScreenProps<HomeStackParamList, 'SourceGroup'>;
export type StatsDashboardScreenProps = NativeStackScreenProps<HomeStackParamList, 'StatsDashboard'>;
export type WikiHubScreenProps = NativeStackScreenProps<HomeStackParamList, 'WikiHub'>;
export type WikiDetailScreenProps = NativeStackScreenProps<HomeStackParamList, 'WikiDetail'>;
export type LibraryScreenProps = NativeStackScreenProps<HomeStackParamList, 'Library'>;
export type LibraryItemDetailScreenProps = NativeStackScreenProps<HomeStackParamList, 'LibraryItemDetail'>;
export type MarkdownNotesScreenProps = NativeStackScreenProps<HomeStackParamList, 'MarkdownNotes'>;
export type MarkdownNoteDetailScreenProps = NativeStackScreenProps<HomeStackParamList, 'MarkdownNoteDetail'>;
export type MarkdownNoteEditorScreenProps = NativeStackScreenProps<HomeStackParamList, 'MarkdownNoteEditor'>;
export type ProfileScreenProps = NativeStackScreenProps<HomeStackParamList, 'ProfileMain'>;
export type SettingsScreenProps = NativeStackScreenProps<HomeStackParamList, 'Settings'>;
