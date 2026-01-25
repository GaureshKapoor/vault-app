import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Inbox, Sparkles, BarChart3, User } from 'lucide-react-native';
import { View, Text } from 'react-native';
import { useSupabaseSession, useAuthGuard } from '../../shared';
import LandingScreen from '../screens/LandingScreen';
import AuthScreen from '../screens/AuthScreen';
import PricingScreen from '../screens/PricingScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import InboxScreen from '../screens/InboxScreen';
import HomeScreen from '../screens/HomeScreen';
import AIScreen from '../screens/AIScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DocsHubScreen from '../screens/DocsHubScreen';
import DocDetailScreen from '../screens/DocDetailScreen';
import GuideScreen from '../screens/GuideScreen';
import IdeaDetailScreen from '../screens/IdeaDetailScreen';
import NewIdeaScreen from '../screens/NewIdeaScreen';
import StartBuildingScreen from '../screens/StartBuildingScreen';

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
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="Home" color={color} /> }}
      />
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon name="Inbox" color={color} /> }}
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
  const { loading: guardLoading, allowed, needsPricing, needsOnboarding } = useAuthGuard();

  if (sessionLoading || guardLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#a78bfa' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Unauthenticated flow */}
      {!session && (
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
        </>
      )}

      {/* Authenticated but needs pricing selection */}
      {session && needsPricing && <Stack.Screen name="Pricing" component={PricingScreen} />}

      {/* Authenticated with subscription but needs onboarding */}
      {session && needsOnboarding && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}

      {/* Fully set up - show main app */}
      {session && allowed && <Stack.Screen name="MainShell" component={MainTabs} />}

      {/* Always available screens (for navigation from main app) */}
      <Stack.Screen name="DocsHub" component={DocsHubScreen} />
      <Stack.Screen name="DocDetail" component={DocDetailScreen} />
      <Stack.Screen name="Guide" component={GuideScreen} />
      <Stack.Screen name="IdeaDetail" component={IdeaDetailScreen} />
      <Stack.Screen name="NewIdea" component={NewIdeaScreen} />
      <Stack.Screen name="StartBuilding" component={StartBuildingScreen} />
    </Stack.Navigator>
  );
}
