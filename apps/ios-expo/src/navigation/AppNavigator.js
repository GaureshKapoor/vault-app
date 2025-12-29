import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Inbox, Sparkles, BarChart3, User } from 'lucide-react-native';
import { View, Text } from 'react-native';
import { useSupabaseSession, useAuthGuard } from '../../../shared';
import InboxScreen from '../screens/InboxScreen';
import HomeScreen from '../screens/HomeScreen';
import AIScreen from '../screens/AIScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DocsHubScreen from '../screens/DocsHubScreen';
import DocDetailScreen from '../screens/DocDetailScreen';
import GuideScreen from '../screens/GuideScreen';
import AuthScreen from '../screens/AuthFlowScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import IdeaDetailScreen from '../screens/IdeaDetailScreen';
import NewIdeaScreen from '../screens/NewIdeaScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const iconMap = {
  Inbox,
  Home,
  Sparkles,
  BarChart3,
  User,
};

function TabIcon({ name, color }) {
  const Icon = iconMap[name] || View;
  return <Icon size={20} color={color} />;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111113',
          borderTopColor: '#27272a',
        },
        tabBarActiveTintColor: '#a78bfa',
        tabBarInactiveTintColor: '#71717a',
      }}
    >
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="Inbox" color={color} /> }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="Home" color={color} /> }}
      />
      <Tab.Screen
        name="AI"
        component={AIScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="Sparkles" color={color} /> }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="BarChart3" color={color} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="User" color={color} /> }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { session, loading: sessionLoading } = useSupabaseSession();
  const { loading: guardLoading, allowed } = useAuthGuard();

  if (sessionLoading || guardLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#a78bfa' }}>Loading...</Text>
      </View>
    );
  }

  const needsOnboarding = !!session && !allowed;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!session && <Stack.Screen name="Auth" component={AuthScreen} />}
      {session && needsOnboarding && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
      {session && allowed && <Stack.Screen name="MainShell" component={MainTabs} />}
      <Stack.Screen name="DocsHub" component={DocsHubScreen} />
      <Stack.Screen name="DocDetail" component={DocDetailScreen} />
      <Stack.Screen name="Guide" component={GuideScreen} />
      <Stack.Screen name="IdeaDetail" component={IdeaDetailScreen} />
      <Stack.Screen name="NewIdea" component={NewIdeaScreen} />
    </Stack.Navigator>
  );
}
