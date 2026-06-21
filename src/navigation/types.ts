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
export type ProfileScreenProps = NativeStackScreenProps<HomeStackParamList, 'ProfileMain'>;
export type SettingsScreenProps = NativeStackScreenProps<HomeStackParamList, 'Settings'>;
