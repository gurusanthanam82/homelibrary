import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buddyColors } from '../theme';
import { SAMPLE_BUDDIES, SAMPLE_NOTES, SAMPLE_PODCASTS, SAMPLE_PROFILE } from '../sampleData';
import type { Buddy, Note, Podcast, Ebook, Profile, Chapter, AppNotification } from '../types';

const STORAGE_KEY = 'home-library:app-data:v3';

type Monitor = { bookId: string | null; title: string; startedAt: number | null; paused: boolean; accumSeconds: number };

type AppData = {
  buddies: Buddy[];
  notes: Note[];
  podcasts: Podcast[];
  ebooks: Ebook[];
  profile: Profile;
  customGenres: string[];
  customShelves: string[];
  chapters: Record<string, Chapter[]>;
  chapterPhotos: Record<string, string[]>;
  notifications: AppNotification[];
  driveFolderUrl: string;
  driveFreq: 'Daily' | 'Weekly' | 'Monthly';
  driveLastBackup: string;
  emailBackupEmail: string;
  emailBackupFreq: 'Daily' | 'Weekly' | 'Monthly';
  emailBackupLastSent: string;
  emailBackupEnabled: boolean;
};

const defaultData: AppData = {
  buddies: SAMPLE_BUDDIES,
  notes: SAMPLE_NOTES.map((n, i) => ({ ...n, id: `n-sample-${i}`, createdAt: new Date().toISOString() })),
  podcasts: SAMPLE_PODCASTS.map((p, i) => ({ ...p, id: `p-sample-${i}` })),
  ebooks: [],
  profile: SAMPLE_PROFILE,
  customGenres: [],
  customShelves: [],
  chapters: {},
  chapterPhotos: {},
  notifications: [],
  driveFolderUrl: '',
  driveFreq: 'Weekly',
  driveLastBackup: 'Never',
  emailBackupEmail: '',
  emailBackupFreq: 'Weekly',
  emailBackupLastSent: 'Never',
  emailBackupEnabled: false,
};

const blankData: AppData = {
  buddies: [],
  notes: [],
  podcasts: [],
  ebooks: [],
  profile: { name: '', email: '', phone: '', location: '', favGenre: '', goal: '', bio: '', since: new Date().getFullYear().toString() },
  customGenres: [],
  customShelves: [],
  chapters: {},
  chapterPhotos: {},
  notifications: [],
  driveFolderUrl: '',
  driveFreq: 'Weekly',
  driveLastBackup: 'Never',
  emailBackupEmail: '',
  emailBackupFreq: 'Weekly',
  emailBackupLastSent: 'Never',
  emailBackupEnabled: false,
};

const idleMonitor: Monitor = { bookId: null, title: '', startedAt: null, paused: false, accumSeconds: 0 };

type AppDataContextType = {
  data: AppData;
  loaded: boolean;
  addBuddy: (name: string) => void;
  toggleBlockBuddy: (id: string) => void;
  toggleShelfSharing: (id: string) => void;
  setAllShelfSharing: (enabled: boolean) => void;
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addPodcast: (p: Omit<Podcast, 'id'>) => void;
  removePodcast: (id: string) => void;
  updatePodcast: (id: string, updates: Partial<Podcast>) => void;
  addEbook: (e: Omit<Ebook, 'id'>) => void;
  removeEbook: (id: string) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  addCustomGenre: (name: string) => void;
  addCustomShelf: (name: string) => void;
  setDriveFolderUrl: (url: string) => void;
  setDriveFreq: (freq: AppData['driveFreq']) => void;
  backupNow: () => void;
  setEmailBackupEmail: (email: string) => void;
  setEmailBackupFreq: (freq: AppData['emailBackupFreq']) => void;
  toggleEmailBackup: () => void;
  sendEmailBackupNow: () => void;
  monitor: Monitor;
  startMonitor: (bookId: string, title: string) => void;
  pauseMonitor: () => void;
  resumeMonitor: () => void;
  stopMonitor: () => number;
  getChapters: (bookId: string) => Chapter[] | undefined;
  addChapter: (bookId: string, chapter: { title: string; page: number }) => void;
  removeChapterAt: (bookId: string, index: number) => void;
  addChapterPhoto: (bookId: string, uri: string) => void;
  removeChapterPhoto: (bookId: string, index: number) => void;
  addNotification: (message: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteChapters: (bookId: string) => void;
  toggleChapter: (bookId: string, index: number) => void;
  markAllChapters: (bookId: string, read: boolean) => void;
  resetAllData: () => void;
};

const AppDataContext = createContext<AppDataContextType | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(defaultData);
  const [loaded, setLoaded] = useState(false);
  const [monitor, setMonitor] = useState<Monitor>(idleMonitor);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setData({ ...defaultData, ...JSON.parse(raw) });
        } catch {
          // ignore corrupt storage
        }
      }
      setLoaded(true);
    });
  }, []);

  const persist = useCallback((next: AppData) => {
    setData(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const resetAllData = useCallback(() => {
    setMonitor(idleMonitor);
    persist(blankData);
  }, [persist]);

  const addBuddy = (name: string) => {
    const buddy: Buddy = {
      id: `b${Date.now()}`,
      name,
      color: buddyColors[data.buddies.length % buddyColors.length],
      shared: 0,
      hoursLabel: '0h 0m',
      hasSharedShelf: false,
      blocked: false,
      sharedBooks: [],
    };
    persist({ ...data, buddies: [...data.buddies, buddy] });
  };

  const toggleBlockBuddy = (id: string) => {
    persist({
      ...data,
      buddies: data.buddies.map((b) => (b.id === id ? { ...b, blocked: !b.blocked } : b)),
    });
  };

  const toggleShelfSharing = (id: string) => {
    persist({
      ...data,
      buddies: data.buddies.map((b) => (b.id === id ? { ...b, hasSharedShelf: !b.hasSharedShelf } : b)),
    });
  };

  const setAllShelfSharing = (enabled: boolean) => {
    persist({
      ...data,
      buddies: data.buddies.map((b) => (b.blocked ? b : { ...b, hasSharedShelf: enabled })),
    });
  };

  const addNote = (note: Omit<Note, 'id' | 'createdAt'>) => {
    const full: Note = { ...note, id: `n${Date.now()}`, createdAt: new Date().toISOString() };
    persist({ ...data, notes: [full, ...data.notes] });
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    persist({ ...data, notes: data.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)) });
  };

  const deleteNote = (id: string) => {
    persist({ ...data, notes: data.notes.filter((n) => n.id !== id) });
  };

  const addPodcast = (p: Omit<Podcast, 'id'>) => {
    persist({ ...data, podcasts: [{ ...p, id: `p${Date.now()}` }, ...data.podcasts] });
  };

  const removePodcast = (id: string) => {
    persist({ ...data, podcasts: data.podcasts.filter((p) => p.id !== id) });
  };

  const updatePodcast = (id: string, updates: Partial<Podcast>) => {
    persist({ ...data, podcasts: data.podcasts.map((p) => (p.id === id ? { ...p, ...updates } : p)) });
  };

  const addEbook = (e: Omit<Ebook, 'id'>) => {
    persist({ ...data, ebooks: [{ ...e, id: `e${Date.now()}` }, ...data.ebooks] });
  };

  const removeEbook = (id: string) => {
    persist({ ...data, ebooks: data.ebooks.filter((e) => e.id !== id) });
  };

  const updateProfile = (updates: Partial<Profile>) => {
    persist({ ...data, profile: { ...data.profile, ...updates } });
  };

  const addCustomGenre = (name: string) => {
    if (!name.trim() || data.customGenres.includes(name.trim())) return;
    persist({ ...data, customGenres: [...data.customGenres, name.trim()] });
  };

  const addCustomShelf = (name: string) => {
    if (!name.trim() || data.customShelves.includes(name.trim())) return;
    persist({ ...data, customShelves: [...data.customShelves, name.trim()] });
  };

  const setDriveFolderUrl = (url: string) => persist({ ...data, driveFolderUrl: url });
  const setDriveFreq = (freq: AppData['driveFreq']) => persist({ ...data, driveFreq: freq });
  const backupNow = () =>
    persist({ ...data, driveLastBackup: new Date().toLocaleString() });

  const setEmailBackupEmail = (email: string) => persist({ ...data, emailBackupEmail: email });
  const setEmailBackupFreq = (freq: AppData['emailBackupFreq']) =>
    persist({ ...data, emailBackupFreq: freq });
  const toggleEmailBackup = () =>
    persist({ ...data, emailBackupEnabled: !data.emailBackupEnabled });
  const sendEmailBackupNow = () =>
    persist({ ...data, emailBackupLastSent: new Date().toLocaleString() });

  const startMonitor = (bookId: string, title: string) => {
    setMonitor((m) => (m.bookId === bookId ? m : { bookId, title, startedAt: Date.now(), paused: false, accumSeconds: 0 }));
  };

  const pauseMonitor = () => {
    setMonitor((m) => {
      if (!m.bookId || m.paused || !m.startedAt) return m;
      return { ...m, paused: true, accumSeconds: m.accumSeconds + Math.floor((Date.now() - m.startedAt) / 1000), startedAt: null };
    });
  };

  const resumeMonitor = () => {
    setMonitor((m) => (m.bookId && m.paused ? { ...m, paused: false, startedAt: Date.now() } : m));
  };

  const stopMonitor = (): number => {
    let total = 0;
    setMonitor((m) => {
      total = m.accumSeconds + (m.startedAt ? Math.floor((Date.now() - m.startedAt) / 1000) : 0);
      return idleMonitor;
    });
    return total;
  };

  const getChapters = (bookId: string) => data.chapters[bookId];

  const addChapter = (bookId: string, chapter: { title: string; page: number }) => {
    const list = data.chapters[bookId] ?? [];
    const next = [...list, { ...chapter, read: false }].sort((a, b) => a.page - b.page);
    persist({ ...data, chapters: { ...data.chapters, [bookId]: next } });
  };

  const removeChapterAt = (bookId: string, index: number) => {
    const list = data.chapters[bookId];
    if (!list) return;
    persist({ ...data, chapters: { ...data.chapters, [bookId]: list.filter((_, i) => i !== index) } });
  };

  const addChapterPhoto = (bookId: string, uri: string) => {
    const list = data.chapterPhotos[bookId] ?? [];
    persist({ ...data, chapterPhotos: { ...data.chapterPhotos, [bookId]: [...list, uri] } });
  };

  const removeChapterPhoto = (bookId: string, index: number) => {
    const list = data.chapterPhotos[bookId];
    if (!list) return;
    persist({ ...data, chapterPhotos: { ...data.chapterPhotos, [bookId]: list.filter((_, i) => i !== index) } });
  };

  const addNotification = (message: string) => {
    const notification: AppNotification = { id: `notif${Date.now()}`, message, createdAt: new Date().toISOString(), read: false };
    persist({ ...data, notifications: [notification, ...data.notifications] });
  };

  const markNotificationRead = (id: string) => {
    persist({ ...data, notifications: data.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) });
  };

  const markAllNotificationsRead = () => {
    persist({ ...data, notifications: data.notifications.map((n) => ({ ...n, read: true })) });
  };

  const deleteChapters = (bookId: string) => {
    const next = { ...data.chapters };
    delete next[bookId];
    persist({ ...data, chapters: next });
  };

  const toggleChapter = (bookId: string, index: number) => {
    const list = data.chapters[bookId];
    if (!list) return;
    const next = list.map((c, i) => (i === index ? { ...c, read: !c.read } : c));
    persist({ ...data, chapters: { ...data.chapters, [bookId]: next } });
  };

  const markAllChapters = (bookId: string, read: boolean) => {
    const list = data.chapters[bookId];
    if (!list) return;
    persist({ ...data, chapters: { ...data.chapters, [bookId]: list.map((c) => ({ ...c, read })) } });
  };

  return (
    <AppDataContext.Provider
      value={{
        data,
        loaded,
        addBuddy,
        toggleBlockBuddy,
        toggleShelfSharing,
        setAllShelfSharing,
        addNote,
        updateNote,
        deleteNote,
        addPodcast,
        removePodcast,
        updatePodcast,
        addEbook,
        removeEbook,
        updateProfile,
        addCustomGenre,
        addCustomShelf,
        setDriveFolderUrl,
        setDriveFreq,
        backupNow,
        setEmailBackupEmail,
        setEmailBackupFreq,
        toggleEmailBackup,
        sendEmailBackupNow,
        monitor,
        startMonitor,
        pauseMonitor,
        resumeMonitor,
        stopMonitor,
        getChapters,
        addChapter,
        removeChapterAt,
        addChapterPhoto,
        removeChapterPhoto,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        deleteChapters,
        toggleChapter,
        markAllChapters,
        resetAllData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
