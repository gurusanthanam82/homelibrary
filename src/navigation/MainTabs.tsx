import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import HomeStack from './HomeStack';
import LibraryStack from './LibraryStack';
import BuddiesStack from './BuddiesStack';
import ScanScreen from '../screens/ScanScreen';
import NotesScreen from '../screens/NotesScreen';
import ReadingTrackerBar from '../components/ReadingTrackerBar';
import type { MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function ScanTabIcon() {
  return (
    <View style={styles.scanBtn}>
      <Ionicons name="scan-outline" size={24} color={colors.white} />
    </View>
  );
}

export default function MainTabs() {
  return (
    <View style={{ flex: 1 }}>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.maroon,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, height: 66, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: 'home-outline',
            Library: 'library-outline',
            Buddies: 'people-outline',
            Notes: 'document-text-outline',
          };
          if (route.name === 'Scan') return <ScanTabIcon />;
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Library" component={LibraryStack} />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{ tabBarLabel: () => null, tabBarStyle: { display: 'none' } }}
      />
      <Tab.Screen name="Buddies" component={BuddiesStack} />
      <Tab.Screen name="Notes" component={NotesScreen} />
    </Tab.Navigator>
    <ReadingTrackerBar />
    </View>
  );
}

const styles = StyleSheet.create({
  scanBtn: {
    width: 50, height: 50, borderRadius: 18, backgroundColor: colors.maroon,
    alignItems: 'center', justifyContent: 'center', marginTop: -14,
    shadowColor: colors.coral, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6,
  },
});
