/**
 * Tab navigator layout — bottom navigation for authenticated users.
 *
 * 5 tabs: Inicio, Torneos, Grupos, Ranking, Perfil.
 * Uses branded SVG icons from @/components/brand/icons.
 * Active indicator: small green dot below focused icon.
 */

import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StackActions } from '@react-navigation/native';

import { GlobeIcon, GroupIcon, TrophyIcon } from '@/components/brand/icons';
import { COLORS } from '@/theme/colors';

/** Small dot rendered below the active tab icon. */
function ActiveDot() {
  return (
    <View
      className="mt-1 h-1 w-1 rounded-full bg-primary"
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenListeners={({ navigation }) => ({
        tabPress: (e) => {
          if (navigation.isFocused()) {
            navigation.dispatch(StackActions.popToTop());
          }
        },
      })}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary.DEFAULT,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <GlobeIcon size={24} color={color} />
              {focused && <ActiveDot />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tournaments"
        options={{
          title: 'Torneos',
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <TrophyIcon size={24} color={color} />
              {focused && <ActiveDot />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Grupos',
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <GroupIcon size={24} color={color} />
              {focused && <ActiveDot />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <Ionicons
                name={focused ? 'stats-chart' : 'stats-chart-outline'}
                size={24}
                color={color}
              />
              {focused && <ActiveDot />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={24}
                color={color}
              />
              {focused && <ActiveDot />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
