import { supabase } from './supabase';
import type { Book } from '../types';

export async function getBooks(userId: string) {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Book[];
}

export async function getBook(id: string) {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Book;
}

export async function addBook(book: Omit<Book, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('books').insert(book).select().single();
  if (error) throw error;
  return data as Book;
}

export async function updateBook(id: string, updates: Partial<Book>) {
  const { data, error } = await supabase
    .from('books')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Book;
}

export async function deleteBook(id: string) {
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteAllBooks(userId: string) {
  const { error } = await supabase.from('books').delete().eq('user_id', userId);
  if (error) throw error;
}

const LANGUAGE_NAMES: Record<string, string> = {
  eng: 'English', spa: 'Spanish', fre: 'French', fra: 'French', ger: 'German', deu: 'German',
  ita: 'Italian', por: 'Portuguese', rus: 'Russian', chi: 'Chinese', zho: 'Chinese', jpn: 'Japanese',
  kor: 'Korean', ara: 'Arabic', hin: 'Hindi', tam: 'Tamil', tel: 'Telugu', ben: 'Bengali',
  mar: 'Marathi', guj: 'Gujarati', kan: 'Kannada', mal: 'Malayalam', pan: 'Punjabi', urd: 'Urdu',
};

function languageName(code: string) {
  return LANGUAGE_NAMES[code] ?? code.charAt(0).toUpperCase() + code.slice(1);
}

export async function searchBooksByISBN(isbn: string): Promise<Partial<Book> | null> {
  const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=details`);
  const json = await res.json();
  const entry = json[`ISBN:${isbn}`];
  if (!entry) return null;
  const details = entry.details;
  const languages = (details.languages ?? [])
    .map((l: { key: string }) => languageName(l.key.split('/').pop() ?? ''))
    .filter(Boolean);
  return {
    title: details.title,
    author: details.authors?.[0]?.name,
    isbn,
    cover_url: details.cover?.large ?? details.cover?.medium,
    published_year: details.publish_date ? parseInt(details.publish_date) : undefined,
    description: details.description?.value ?? details.description,
    language: languages.length ? languages.join(', ') : undefined,
    publisher: details.publishers?.length ? details.publishers.join(', ') : undefined,
  };
}
