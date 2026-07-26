import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BookListScreen from '../screens/BookListScreen';
import BookDetailScreen from '../screens/BookDetailScreen';
import AddBookScreen from '../screens/AddBookScreen';
import type { LibraryStackParamList } from '../types';

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export default function LibraryStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: '#4f46e5',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="BookList" component={BookListScreen} options={{ title: 'My Library' }} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="AddBook" component={AddBookScreen} options={{ title: 'Add Book' }} />
      <Stack.Screen name="EditBook" component={AddBookScreen} options={{ title: 'Edit Book' }} />
    </Stack.Navigator>
  );
}
