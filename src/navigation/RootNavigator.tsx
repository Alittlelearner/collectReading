import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import { RootTabParamList, HomeStackParamList, ProfileStackParamList } from './types';
import { colors } from '../theme/colors';

import HomeScreen from '../screens/HomeScreen';
import BookmarkDetailScreen from '../screens/BookmarkDetailScreen';
import AddBookmarkScreen from '../screens/AddBookmarkScreen';
import TagManageScreen from '../screens/TagManageScreen';
import SourceGroupScreen from '../screens/SourceGroupScreen';
import StatsDashboardScreen from '../screens/StatsDashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import TestAddBookmarkScreen from '../screens/TestAddBookmarkScreen';
import SimpleTestScreen from '../screens/SimpleTestScreen';
import MultiUrlTestScreen from '../screens/MultiUrlTestScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="BookmarkDetail"
        component={BookmarkDetailScreen}
        options={{ title: '详情' }}
      />
      <HomeStack.Screen
        name="AddBookmark"
        component={AddBookmarkScreen}
        options={{ title: '添加收藏', presentation: 'modal' }}
      />
      <HomeStack.Screen
        name="TagManage"
        component={TagManageScreen}
        options={{ title: '标签管理' }}
      />
      <HomeStack.Screen
        name="SourceGroup"
        component={SourceGroupScreen}
        options={{ title: '按来源' }}
      />
      <HomeStack.Screen
        name="StatsDashboard"
        component={StatsDashboardScreen}
        options={{ title: '统计' }}
      />
      <HomeStack.Screen
        name="TestAddBookmark"
        component={TestAddBookmarkScreen}
        options={{ title: '测试添加收藏' }}
      />
      <HomeStack.Screen
        name="SimpleTest"
        component={SimpleTestScreen}
        options={{ title: '简单存储测试' }}
      />
      <HomeStack.Screen
        name="MultiUrlTest"
        component={MultiUrlTestScreen}
        options={{ title: '多URL测试' }}
      />
    </HomeStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: '设置' }}
      />
      <ProfileStack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{ title: '成就徽章' }}
      />
    </ProfileStack.Navigator>
  );
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    HomeTab: '📚',
    ProfileTab: '👤',
  };
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {icons[label] || '📌'}
    </Text>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.surfaceLight,
            borderTopWidth: 0,
            paddingBottom: 4,
            height: 56,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
        })}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStackNavigator}
          options={{ tabBarLabel: '收藏' }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileStackNavigator}
          options={{ tabBarLabel: '我的' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
