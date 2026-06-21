"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RootNavigator;
const jsx_runtime_1 = require("react/jsx-runtime");
const native_1 = require("@react-navigation/native");
const bottom_tabs_1 = require("@react-navigation/bottom-tabs");
const native_stack_1 = require("@react-navigation/native-stack");
const vector_icons_1 = require("@expo/vector-icons");
const colors_1 = require("../theme/colors");
const HomeScreen_1 = __importDefault(require("../screens/HomeScreen"));
const BookmarkDetailScreen_1 = __importDefault(require("../screens/BookmarkDetailScreen"));
const AddBookmarkScreen_1 = __importDefault(require("../screens/AddBookmarkScreen"));
const TagManageScreen_1 = __importDefault(require("../screens/TagManageScreen"));
const SourceGroupScreen_1 = __importDefault(require("../screens/SourceGroupScreen"));
const StatsDashboardScreen_1 = __importDefault(require("../screens/StatsDashboardScreen"));
const ProfileScreen_1 = __importDefault(require("../screens/ProfileScreen"));
const SettingsScreen_1 = __importDefault(require("../screens/SettingsScreen"));
const AchievementsScreen_1 = __importDefault(require("../screens/AchievementsScreen"));
const Tab = (0, bottom_tabs_1.createBottomTabNavigator)();
const HomeStack = (0, native_stack_1.createNativeStackNavigator)();
const ProfileStack = (0, native_stack_1.createNativeStackNavigator)();
function HomeStackNavigator() {
    return ((0, jsx_runtime_1.jsxs)(HomeStack.Navigator, { screenOptions: {
            headerStyle: { backgroundColor: colors_1.colors.surface },
            headerShadowVisible: false,
            headerTintColor: colors_1.colors.text,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: colors_1.colors.background },
        }, children: [(0, jsx_runtime_1.jsx)(HomeStack.Screen, { name: "HomeMain", component: HomeScreen_1.default, options: { headerShown: false } }), (0, jsx_runtime_1.jsx)(HomeStack.Screen, { name: "BookmarkDetail", component: BookmarkDetailScreen_1.default, options: { title: '馆藏详情' } }), (0, jsx_runtime_1.jsx)(HomeStack.Screen, { name: "AddBookmark", component: AddBookmarkScreen_1.default, options: { title: '添加收藏', presentation: 'modal' } }), (0, jsx_runtime_1.jsx)(HomeStack.Screen, { name: "TagManage", component: TagManageScreen_1.default, options: { title: '标签管理' } }), (0, jsx_runtime_1.jsx)(HomeStack.Screen, { name: "SourceGroup", component: SourceGroupScreen_1.default, options: { title: '来源分组' } }), (0, jsx_runtime_1.jsx)(HomeStack.Screen, { name: "StatsDashboard", component: StatsDashboardScreen_1.default, options: { title: '阅读统计' } })] }));
}
function ProfileStackNavigator() {
    return ((0, jsx_runtime_1.jsxs)(ProfileStack.Navigator, { screenOptions: {
            headerStyle: { backgroundColor: colors_1.colors.surface },
            headerShadowVisible: false,
            headerTintColor: colors_1.colors.text,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: colors_1.colors.background },
        }, children: [(0, jsx_runtime_1.jsx)(ProfileStack.Screen, { name: "ProfileMain", component: ProfileScreen_1.default, options: { headerShown: false } }), (0, jsx_runtime_1.jsx)(ProfileStack.Screen, { name: "Settings", component: SettingsScreen_1.default, options: { title: '设置' } }), (0, jsx_runtime_1.jsx)(ProfileStack.Screen, { name: "Achievements", component: AchievementsScreen_1.default, options: { title: '成就' } })] }));
}
function TabIcon({ routeName, focused }) {
    const icons = {
        HomeTab: focused ? 'bookshelf' : 'bookshelf',
        ProfileTab: focused ? 'account-circle' : 'account-circle-outline',
    };
    return (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: icons[routeName], size: 22, color: focused ? colors_1.colors.primary : colors_1.colors.textMuted });
}
function RootNavigator() {
    return ((0, jsx_runtime_1.jsx)(native_1.NavigationContainer, { children: (0, jsx_runtime_1.jsxs)(Tab.Navigator, { screenOptions: ({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused }) => ((0, jsx_runtime_1.jsx)(TabIcon, { routeName: route.name, focused: focused })),
                tabBarActiveTintColor: colors_1.colors.primary,
                tabBarInactiveTintColor: colors_1.colors.textMuted,
                tabBarStyle: {
                    backgroundColor: colors_1.colors.surface,
                    borderTopColor: colors_1.colors.border,
                    borderTopWidth: 1,
                    height: 64,
                    paddingTop: 6,
                    paddingBottom: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
            }), children: [(0, jsx_runtime_1.jsx)(Tab.Screen, { name: "HomeTab", component: HomeStackNavigator, options: { tabBarLabel: '馆藏' } }), (0, jsx_runtime_1.jsx)(Tab.Screen, { name: "ProfileTab", component: ProfileStackNavigator, options: { tabBarLabel: '我的书房' } })] }) }));
}
