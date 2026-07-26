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

export async function searchBooksByISBN(isbn: string): Promise<Partial<Book> | null> {
  const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=details`);
  const json = await res.json();
  const entry = json[`ISBN:${isbn}`];
  if (!entry) return null;
  const details = entry.details;
  return {
    title: details.title,
    author: details.authors?.[0]?.name,
    isbn,
    cover_url: details.cover?.large ?? details.cover?.medium,
    published_year: details.publish_date ? parseInt(details.publish_date) : undefined,
    description: details.description?.value ?? details.description,
  };
}
