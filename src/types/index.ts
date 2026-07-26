export type Book = {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  cover_url?: string;
  description?: string;
  genre?: string;
  published_year?: number;
  status: 'owned' | 'wishlist' | 'reading' | 'finished';
  rating?: number;
  notes?: string;
  created_at: string;
  user_id: string;
};

export type User = {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Library: undefined;
  Search: undefined;
  Scan: undefined;
  Profile: undefined;
};

export type LibraryStackParamList = {
  BookList: undefined;
  BookDetail: { bookId: string };
  AddBook: { isbn?: string; prefill?: Partial<Book> };
  EditBook: { book: Book };
};

export type RootNavParamList = MainTabParamList & {
  Library: { screen: keyof LibraryStackParamList; params?: object };
};
