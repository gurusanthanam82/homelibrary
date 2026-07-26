import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LibraryScreen from '../screens/LibraryScreen';
import BookDetailScreen from '../screens/BookDetailScreen';
import AddBookScreen from '../screens/AddBookScreen';
import PodcastsScreen from '../screens/PodcastsScreen';
import EbooksScreen from '../screens/EbooksScreen';
import ExportScreen from '../screens/ExportScreen';
import ReaderScreen from '../screens/ReaderScreen';
import type { LibraryStackParamList } from '../types';

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export default function LibraryStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LibraryList" component={LibraryScreen} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} />
      <Stack.Screen name="AddBook" component={AddBookScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="EditBook" component={AddBookScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Podcasts" component={PodcastsScreen} />
      <Stack.Screen name="Ebooks" component={EbooksScreen} />
      <Stack.Screen name="Export" component={ExportScreen} />
      <Stack.Screen name="Reader" component={ReaderScreen} options={{ presentation: 'fullScreenModal' }} />
    </Stack.Navigator>
  );
}
