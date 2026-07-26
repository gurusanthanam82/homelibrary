import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buddyColors } from '../theme';
import { SAMPLE_BUDDIES, SAMPLE_NOTES, SAMPLE_PODCASTS, SAMPLE_PROFILE } from '../sampleData';
import type { Buddy, Note, Podcast, Ebook, Profile } from '../types';

const STORAGE_KEY = 'home-library:app-data:v2';

type AppData = {
  buddies: Buddy[];
  notes: Note[];
  podcasts: Podcast[];
  ebooks: Ebook[];
  profile: Profile;
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
  driveFolderUrl: '',
  driveFreq: 'Weekly',
  driveLastBackup: 'Never',
  emailBackupEmail: '',
  emailBackupFreq: 'Weekly',
  emailBackupLastSent: 'Never',
  emailBackupEnabled: false,
};

type AppDataContextType = {
  data: AppData;
  loaded: boolean;
  addBuddy: (name: string) => void;
  toggleBlockBuddy: (id: string) => void;
  toggleShelfSharing: (id: string) => void;
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addPodcast: (p: Omit<Podcast, 'id'>) => void;
  removePodcast: (id: string) => void;
  addEbook: (e: Omit<Ebook, 'id'>) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  setDriveFolderUrl: (url: string) => void;
  setDriveFreq: (freq: AppData['driveFreq']) => void;
  backupNow: () => void;
  setEmailBackupEmail: (email: string) => void;
  setEmailBackupFreq: (freq: AppData['emailBackupFreq']) => void;
  toggleEmailBackup: () => void;
  sendEmailBackupNow: () => void;
};

const AppDataContext = createContext<AppDataContextType | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(defaultData);
  const [loaded, setLoaded] = useState(false);

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

  const addEbook = (e: Omit<Ebook, 'id'>) => {
    persist({ ...data, ebooks: [{ ...e, id: `e${Date.now()}` }, ...data.ebooks] });
  };

  const updateProfile = (updates: Partial<Profile>) => {
    persist({ ...data, profile: { ...data.profile, ...updates } });
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

  return (
    <AppDataContext.Provider
      value={{
        data,
        loaded,
        addBuddy,
        toggleBlockBuddy,
        toggleShelfSharing,
        addNote,
        updateNote,
        deleteNote,
        addPodcast,
        removePodcast,
        addEbook,
        updateProfile,
        setDriveFolderUrl,
        setDriveFreq,
        backupNow,
        setEmailBackupEmail,
        setEmailBackupFreq,
        toggleEmailBackup,
        sendEmailBackupNow,
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
