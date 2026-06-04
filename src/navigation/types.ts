import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

export type HomeStackParamList = {
  HomeMain: undefined;
  BookmarkDetail: { bookmarkId: string };
  AddBookmark: { url?: string } | undefined;
  TagManage: undefined;
  SourceGroup: { sourceType: string } | undefined;
  StatsDashboard: undefined;
  TestAddBookmark: undefined;
  SimpleTest: undefined;
  MultiUrlTest: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Achievements: undefined;
};

export type RootTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type HomeScreenProps = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'HomeMain'>,
  BottomTabScreenProps<RootTabParamList>
>;

export type BookmarkDetailScreenProps = NativeStackScreenProps<HomeStackParamList, 'BookmarkDetail'>;
export type AddBookmarkScreenProps = NativeStackScreenProps<HomeStackParamList, 'AddBookmark'>;
export type TagManageScreenProps = NativeStackScreenProps<HomeStackParamList, 'TagManage'>;
export type SourceGroupScreenProps = NativeStackScreenProps<HomeStackParamList, 'SourceGroup'>;
export type StatsDashboardScreenProps = NativeStackScreenProps<HomeStackParamList, 'StatsDashboard'>;
export type ProfileScreenProps = NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>;
export type SettingsScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;
