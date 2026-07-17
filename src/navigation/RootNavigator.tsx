import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeStackParamList } from './types';
import { colors } from '../theme/colors';

import HomeScreen from '../screens/HomeScreen';
import BookmarkDetailScreen from '../screens/BookmarkDetailScreen';
import AddBookmarkScreen from '../screens/AddBookmarkScreen';
import TagManageScreen from '../screens/TagManageScreen';
import FolderManageScreen from '../screens/FolderManageScreen';
import SourceGroupScreen from '../screens/SourceGroupScreen';
import StatsDashboardScreen from '../screens/StatsDashboardScreen';
import WikiHubScreen from '../screens/WikiHubScreen';
import WikiDetailScreen from '../screens/WikiDetailScreen';
import LibraryScreen from '../screens/LibraryScreen';
import LibraryItemDetailScreen from '../screens/LibraryItemDetailScreen';
import MarkdownNotesScreen from '../screens/MarkdownNotesScreen';
import MarkdownNoteDetailScreen from '../screens/MarkdownNoteDetailScreen';
import MarkdownNoteEditorScreen from '../screens/MarkdownNoteEditorScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AchievementsScreen from '../screens/AchievementsScreen';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="BookmarkDetail" component={BookmarkDetailScreen} options={{ title: '收藏详情' }} />
      <HomeStack.Screen
        name="AddBookmark"
        component={AddBookmarkScreen}
        options={{ title: '新增收藏', presentation: 'modal' }}
      />
      <HomeStack.Screen name="TagManage" component={TagManageScreen} options={{ title: '标签管理' }} />
      <HomeStack.Screen name="FolderManage" component={FolderManageScreen} options={{ title: '收藏夹管理' }} />
      <HomeStack.Screen name="SourceGroup" component={SourceGroupScreen} options={{ title: '来源分组' }} />
      <HomeStack.Screen name="StatsDashboard" component={StatsDashboardScreen} options={{ title: '阅读统计' }} />
      <HomeStack.Screen name="WikiHub" component={WikiHubScreen} options={{ title: '实验 Wiki' }} />
      <HomeStack.Screen name="WikiDetail" component={WikiDetailScreen} options={{ title: 'Wiki 详情' }} />
      <HomeStack.Screen name="Library" component={LibraryScreen} options={{ title: 'Bookshelf' }} />
      <HomeStack.Screen name="LibraryItemDetail" component={LibraryItemDetailScreen} options={{ title: 'Book Detail' }} />
      <HomeStack.Screen name="MarkdownNotes" component={MarkdownNotesScreen} options={{ title: 'Markdown Notes' }} />
      <HomeStack.Screen name="MarkdownNoteDetail" component={MarkdownNoteDetailScreen} options={{ title: 'Note Detail' }} />
      <HomeStack.Screen name="MarkdownNoteEditor" component={MarkdownNoteEditorScreen} options={{ title: 'Write Note' }} />
      <HomeStack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="Settings" component={SettingsScreen} options={{ title: '设置' }} />
      <HomeStack.Screen name="Achievements" component={AchievementsScreen} options={{ title: '成就' }} />
    </HomeStack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <HomeStackNavigator />
    </NavigationContainer>
  );
}
