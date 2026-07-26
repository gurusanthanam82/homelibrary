import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootNavParamList } from '../types';

type Nav = NativeStackNavigationProp<RootNavParamList>;

type OLBook = {
  key: string;
  title: string;
  author_name?: string[];
  isbn?: string[];
  cover_i?: number;
  first_publish_year?: number;
};

export default function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OLBook[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,isbn,cover_i,first_publish_year`
      );
      const json = await res.json();
      setResults(json.docs ?? []);
    } finally {
      setLoading(false);
    }
  }

  function handleAdd(item: OLBook) {
    (navigation as any).navigate('Library', {
      screen: 'AddBook',
      params: {
        isbn: item.isbn?.[0],
        prefill: {
          title: item.title,
          author: item.author_name?.[0],
          isbn: item.isbn?.[0],
          cover_url: item.cover_i
            ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
            : undefined,
          published_year: item.first_publish_year,
        },
      },
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Search books, authors…"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {loading && <ActivityIndicator size="small" color="#4f46e5" />}
      </View>

      <FlatList
        data={results}
        keyExtractor={item => item.key}
        renderItem={({ item }) => (
          <View style={styles.result}>
            {item.cover_i ? (
              <Image
                source={{ uri: `https://covers.openlibrary.org/b/id/${item.cover_i}-S.jpg` }}
                style={styles.cover}
              />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Ionicons name="book-outline" size={20} color="#ccc" />
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.author} numberOfLines={1}>{item.author_name?.[0] ?? 'Unknown author'}</Text>
              {item.first_publish_year ? (
                <Text style={styles.year}>{item.first_publish_year}</Text>
              ) : null}
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(item)}>
              <Ionicons name="add-circle" size={28} color="#4f46e5" />
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading && query ? (
            <Text style={styles.emptyText}>No results. Try a different search.</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', margin: 12, borderRadius: 12,
    paddingHorizontal: 14, borderWidth: 1, borderColor: '#e5e7eb',
  },
  searchIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15 },
  list: { padding: 12 },
  result: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 2, elevation: 2,
  },
  cover: { width: 44, height: 60, borderRadius: 4 },
  coverPlaceholder: {
    width: 44, height: 60, borderRadius: 4,
    backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, marginHorizontal: 12 },
  title: { fontSize: 14, fontWeight: '600', color: '#111' },
  author: { fontSize: 13, color: '#666', marginTop: 2 },
  year: { fontSize: 12, color: '#aaa', marginTop: 2 },
  addBtn: { padding: 4 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },
});
