import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BuddiesScreen from '../screens/BuddiesScreen';
import BuddyBooksScreen from '../screens/BuddyBooksScreen';
import type { BuddiesStackParamList } from '../types';

const Stack = createNativeStackNavigator<BuddiesStackParamList>();

export default function BuddiesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BuddiesList" component={BuddiesScreen} />
      <Stack.Screen name="BuddyBooks" component={BuddyBooksScreen} />
    </Stack.Navigator>
  );
}
