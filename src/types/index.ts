export type Book = {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  cover_url?: string;
  back_cover_url?: string;
  description?: string;
  genre?: string;
  published_year?: number;
  status: 'unread' | 'reading' | 'finished';
  progress?: number;
  ownership?: 'owned' | 'loaned';
  audiobook_url?: string;
  seconds_read?: number;
  rating?: number;
  notes?: string;
  shelf?: string;
  language?: string;
  publisher?: string;
  created_at: string;
  user_id: string;
};

export type Chapter = { title: string; page: number; read: boolean };

export type SharedBook = { title: string; author: string; color: string };

export type Buddy = {
  id: string;
  name: string;
  color: string;
  shared: number;
  hoursLabel: string;
  hasSharedShelf: boolean;
  blocked: boolean;
  sharedBooks: SharedBook[];
};

export type Note = {
  id: string;
  text: string;
  color: string;
  book: string;
  page?: number;
  chapter?: string;
  urls: string[];
  sharedBuddyIds: string[];
  createdAt: string;
};

export type Podcast = {
  id: string;
  title: string;
  channel: string;
  genre: string;
  topic: string;
  interviewer: string;
  interviewee: string;
  url: string;
};

export type Ebook = {
  id: string;
  name: string;
  bookTitle: string;
  bookId?: string;
  format: 'PDF' | 'EPUB' | 'MOBI';
  size: string;
  color: string;
  content: string;
};

export type AppNotification = {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export type Profile = {
  name: string;
  email: string;
  phone: string;
  location: string;
  favGenre: string;
  goal: string;
  bio: string;
  since: string;
  photoUrl?: string;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Profile: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Library: undefined;
  Scan: undefined;
  Buddies: undefined;
  Notes: undefined;
};

export type LibraryStackParamList = {
  LibraryList: { shelf?: string; filter?: string } | undefined;
  BookDetail: { bookId: string };
  AddBook: { isbn?: string; prefill?: Partial<Book> };
  EditBook: { book: Book };
  Podcasts: undefined;
  Ebooks: undefined;
  Export: undefined;
  BuddyBooks: undefined;
  Reader: { ebookId: string };
};

export type HomeStackParamList = {
  HomeMain: undefined;
  BookDetail: { bookId: string };
  AddBook: { isbn?: string; prefill?: Partial<Book> };
};

export type BuddiesStackParamList = {
  BuddiesList: undefined;
  BuddyBooks: undefined;
};

export type NotesStackParamList = {
  NotesList: undefined;
};
