import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, TextInput, Modal, Linking,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  colors, radii, genreColor, statusColors, statusLabels, ownershipColors,
  GENRES as BASE_GENRES, shelves as BASE_SHELVES,
} from '../theme';
import { getBook, deleteBook, updateBook } from '../services/books';
import { useAppData } from '../contexts/AppDataContext';
import type { Book, LibraryStackParamList } from '../types';

type Nav = NativeStackNavigationProp<LibraryStackParamList, 'BookDetail'>;
type Route = RouteProp<LibraryStackParamList, 'BookDetail'>;

const STATUSES: Book['status'][] = ['unread', 'reading', 'finished'];
const OWNERSHIP: Array<'owned' | 'loaned'> = ['owned', 'loaned'];

function fmtClock(sec: number) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(sec / 3600))}:${p(Math.floor((sec % 3600) / 60))}:${p(sec % 60)}`;
}

function fmtHM(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function splitList(v?: string) {
  return (v ?? '').split(',').map((s) => s.trim()).filter(Boolean);
}

export default function BookDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const {
    data, addCustomGenre, addCustomShelf, addEbook, removeEbook,
    monitor, startMonitor, pauseMonitor, resumeMonitor, stopMonitor,
    getChapters, addChapter, removeChapterAt, deleteChapters, toggleChapter, markAllChapters,
    addChapterPhoto, removeChapterPhoto,
  } = useAppData();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [fieldSheet, setFieldSheet] = useState<null | 'author' | 'language' | 'publisher'>(null);
  const [fieldDraft, setFieldDraft] = useState('');
  const [shelfSheetOpen, setShelfSheetOpen] = useState(false);
  const [customShelfDraft, setCustomShelfDraft] = useState('');
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterPage, setNewChapterPage] = useState('');
  const [tick, setTick] = useState(0);

  const GENRES = [...BASE_GENRES, ...data.customGenres];
  const SHELVES = [...BASE_SHELVES, ...data.customShelves];

  const isMonitoring = monitor.bookId === book?.id;
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fieldInputRef = useRef<TextInput>(null);

  useEffect(() => {
    getBook(route.params.bookId).then(setBook).finally(() => setLoading(false));
  }, [route.params.bookId]);

  useEffect(() => {
    if (isMonitoring && !monitor.paused) {
      tickRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    } else if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [isMonitoring, monitor.paused]);

  async function patch(updates: Partial<Book>) {
    if (!book) return;
    const updated = await updateBook(book.id, updates);
    setBook(updated);
  }

  async function captureCover(side: 'front' | 'back') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera permission needed', 'Enable camera access to take a cover photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      if (side === 'front') patch({ cover_url: result.assets[0].uri });
      else patch({ back_cover_url: result.assets[0].uri });
    }
  }

  function cycleGenre() {
    if (!book) return;
    const idx = GENRES.indexOf(book.genre ?? '');
    patch({ genre: GENRES[(idx + 1) % GENRES.length] });
  }

  function cycleStatus() {
    if (!book) return;
    const idx = STATUSES.indexOf(book.status);
    patch({ status: STATUSES[(idx + 1) % STATUSES.length] });
  }

  function cycleOwnership() {
    if (!book) return;
    const cur = book.ownership ?? 'owned';
    const idx = OWNERSHIP.indexOf(cur);
    patch({ ownership: OWNERSHIP[(idx + 1) % OWNERSHIP.length] });
  }

  function openFieldSheet(field: 'author' | 'language' | 'publisher') {
    setFieldDraft('');
    setFieldSheet(field);
  }

  function saveFieldValue() {
    if (!book || !fieldSheet || !fieldDraft.trim()) return;
    const current = fieldSheet === 'author' ? splitList(book.author) : splitList(book[fieldSheet]);
    if (current.includes(fieldDraft.trim())) { setFieldDraft(''); return; }
    const next = [...current, fieldDraft.trim()].join(', ');
    patch({ [fieldSheet]: next } as Partial<Book>);
    setFieldDraft('');
  }

  function selectShelf(name: string) {
    patch({ shelf: name });
    setShelfSheetOpen(false);
  }

  function saveCustomShelf() {
    if (!customShelfDraft.trim()) return;
    addCustomShelf(customShelfDraft.trim());
    selectShelf(customShelfDraft.trim());
    setCustomShelfDraft('');
  }

  async function uploadEbook() {
    if (!book) return;
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'application/epub+zip', '*/*'] });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const ext = (asset.name.split('.').pop() ?? 'pdf').toUpperCase();
    const format: 'PDF' | 'EPUB' | 'MOBI' = ext === 'EPUB' ? 'EPUB' : ext === 'MOBI' ? 'MOBI' : 'PDF';
    const sizeLabel = asset.size ? (asset.size < 1024 * 1024 ? `${Math.round(asset.size / 1024)} KB` : `${(asset.size / (1024 * 1024)).toFixed(1)} MB`) : '';
    addEbook({ name: asset.name, bookTitle: book.title, bookId: book.id, format, size: sizeLabel, color: book.cover_url ? '#7A2B45' : '#2f6f4e', content: '' });
  }

  function toggleReadingSession() {
    if (!book) return;
    if (isMonitoring) {
      const seconds = stopMonitor();
      patch({ seconds_read: (book.seconds_read ?? 0) + seconds });
    } else {
      startMonitor(book.id, book.title);
    }
  }

  function openChapters() {
    if (!book) return;
    setChaptersOpen(true);
  }

  function submitNewChapter() {
    if (!book || !newChapterTitle.trim() || !newChapterPage.trim()) return;
    const page = parseInt(newChapterPage, 10);
    if (isNaN(page)) return;
    addChapter(book.id, { title: newChapterTitle.trim(), page });
    setNewChapterTitle('');
    setNewChapterPage('');
  }

  function confirmDeleteChapters() {
    if (!book) return;
    Alert.alert('Delete chapters', 'Remove all scanned chapters for this book?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteChapters(book.id) },
    ]);
  }

  async function photoFromCamera() {
    if (!book) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera access needed', 'Enable camera access to photograph the index page.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) addChapterPhoto(book.id, result.assets[0].uri);
  }

  async function photoFromLibrary() {
    if (!book) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photo access needed', 'Enable photo library access to add an index page photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) addChapterPhoto(book.id, result.assets[0].uri);
  }

  function addChapterPhotoPrompt() {
    Alert.alert('Add a photo', 'Photograph the index or a chapter page', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take Photo', onPress: photoFromCamera },
      { text: 'Choose from Library', onPress: photoFromLibrary },
    ]);
  }

  function confirmDeleteChapterPhoto(index: number) {
    if (!book) return;
    Alert.alert('Remove photo', 'Remove this photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeChapterPhoto(book.id, index) },
    ]);
  }

  function handleDelete() {
    Alert.alert('Remove book', 'Are you sure you want to remove this from your library?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await deleteBook(book!.id); navigation.goBack(); } },
    ]);
  }

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: colors.bg }} size="large" color={colors.maroon} />;
  if (!book) return <Text style={{ padding: 24 }}>Book not found.</Text>;

  const authors = splitList(book.author);
  const languages = splitList(book.language);
  const publishers = splitList(book.publisher);
  const bookEbooks = data.ebooks.filter((e) => e.bookId === book.id);
  const chapters = getChapters(book.id);
  const chapterPhotos = data.chapterPhotos[book.id] ?? [];
  const chReadCount = chapters?.filter((c) => c.read).length ?? 0;
  const chPct = chapters?.length ? Math.round((chReadCount / chapters.length) * 100) : 0;
  const sessionLiveSeconds = isMonitoring ? monitor.accumSeconds + (monitor.paused || !monitor.startedAt ? 0 : Math.floor((Date.now() - monitor.startedAt) / 1000)) : 0;
  const sessionTotal = (book.seconds_read ?? 0) + sessionLiveSeconds;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: 20 }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <View style={styles.coverRow}>
          <View style={styles.coverCol}>
            <View style={styles.coverBoxDashed}>
              {book.cover_url ? <Image source={{ uri: book.cover_url }} style={styles.coverImg} /> : (
                <>
                  <Ionicons name="image-outline" size={28} color={colors.textFaint} />
                  <Text style={styles.coverPlaceholderText}>Front cover</Text>
                </>
              )}
            </View>
            <Text style={styles.coverLabel}>Front</Text>
            <TouchableOpacity style={styles.cameraBtn} onPress={() => captureCover('front')}>
              <Ionicons name="camera-outline" size={14} color={colors.white} />
              <Text style={styles.cameraBtnText}>Camera</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.coverCol}>
            <View style={styles.coverBoxDashed}>
              {book.back_cover_url ? <Image source={{ uri: book.back_cover_url }} style={styles.coverImg} /> : (
                <>
                  <Ionicons name="image-outline" size={28} color={colors.textFaint} />
                  <Text style={styles.coverPlaceholderText}>Back cover</Text>
                </>
              )}
            </View>
            <Text style={styles.coverLabel}>Back</Text>
            <TouchableOpacity style={styles.cameraBtn} onPress={() => captureCover('back')}>
              <Ionicons name="camera-outline" size={14} color={colors.white} />
              <Text style={styles.cameraBtnText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.title}>{book.title}</Text>
        <View style={styles.authorRow}>
          {authors.map((a) => (
            <View key={a} style={styles.authorChip}><Text style={styles.authorChipText}>{a}</Text></View>
          ))}
          <TouchableOpacity style={styles.addChip} onPress={() => openFieldSheet('author')}>
            <Text style={styles.addChipText}>+ Author</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.genrePill, { backgroundColor: genreColor(book.genre) }]} onPress={cycleGenre}>
          <Text style={styles.genrePillText}>{book.genre || 'Fiction'}</Text>
          <Ionicons name="swap-horizontal" size={12} color={colors.white} />
        </TouchableOpacity>

        {typeof book.progress === 'number' && (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${book.progress}%` }]} /></View>
            <Text style={styles.progressLabel}>{book.progress}% read</Text>
          </View>
        )}
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <View style={styles.infoCard}>
          <TouchableOpacity style={styles.infoRow} onPress={cycleStatus}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={styles.infoValRow}>
              <Text style={[styles.infoValue, { color: statusColors[book.status] }]}>{statusLabels[book.status]}</Text>
              <Ionicons name="swap-horizontal" size={12} color={statusColors[book.status]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoRow} onPress={cycleOwnership}>
            <Text style={styles.infoLabel}>Ownership</Text>
            <View style={styles.infoValRow}>
              <Text style={[styles.infoValue, { color: ownershipColors[book.ownership ?? 'owned'] }]}>{(book.ownership ?? 'owned') === 'owned' ? 'Owned' : 'Loaned'}</Text>
              <Ionicons name="swap-horizontal" size={12} color={ownershipColors[book.ownership ?? 'owned']} />
            </View>
          </TouchableOpacity>

          <View style={styles.infoRowWrap}>
            <Text style={styles.infoLabel}>Language</Text>
            <View style={styles.chipWrapEnd}>
              {languages.map((l) => <View key={l} style={styles.miniChip}><Text style={styles.miniChipText}>{l}</Text></View>)}
              <TouchableOpacity style={styles.plusChip} onPress={() => openFieldSheet('language')}><Text style={styles.plusChipText}>+</Text></TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoRowWrap}>
            <Text style={styles.infoLabel}>Publisher</Text>
            <View style={styles.chipWrapEnd}>
              {publishers.map((p) => <View key={p} style={styles.miniChip}><Text style={styles.miniChipText}>{p}</Text></View>)}
              <TouchableOpacity style={styles.plusChip} onPress={() => openFieldSheet('publisher')}><Text style={styles.plusChipText}>+</Text></TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.infoRow} onPress={() => setShelfSheetOpen(true)}>
            <Text style={styles.infoLabel}>Shelf</Text>
            <View style={styles.infoValRow}>
              <Text style={[styles.infoValue, { color: colors.maroon }]}>{book.shelf || 'Unassigned'}</Text>
              <Ionicons name="swap-horizontal" size={12} color={colors.maroon} />
            </View>
          </TouchableOpacity>

          {book.isbn ? (
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>ISBN</Text>
              <Text style={styles.infoValue}>{book.isbn}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.mediaCard}>
          <View style={styles.mediaSection}>
            <View style={styles.mediaHeader}>
              <Ionicons name="headset-outline" size={14} color={colors.maroon} />
              <Text style={styles.mediaHeaderText}>Audiobook (YouTube)</Text>
            </View>
            <TextInput
              style={styles.mediaInput}
              placeholder="Paste YouTube URL…"
              placeholderTextColor={colors.textFaint}
              value={book.audiobook_url ?? ''}
              onChangeText={(v) => setBook({ ...book, audiobook_url: v })}
              onEndEditing={() => patch({ audiobook_url: book.audiobook_url })}
            />
            {!!book.audiobook_url && (
              <TouchableOpacity style={styles.ytLink} onPress={() => Linking.openURL(book.audiobook_url!)}>
                <View style={styles.ytThumb}><Ionicons name="logo-youtube" size={20} color="#ff0000" /></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.ytTitle}>Play on YouTube</Text>
                  <Text style={styles.ytUrl} numberOfLines={1}>{book.audiobook_url}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
          <View style={[styles.mediaSection, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={styles.mediaHeaderRow}>
              <View style={styles.mediaHeader}>
                <Ionicons name="document-outline" size={14} color={colors.maroon} />
                <Text style={styles.mediaHeaderText}>E-Book Files</Text>
              </View>
              <TouchableOpacity style={styles.uploadChip} onPress={uploadEbook}>
                <Ionicons name="add" size={12} color={colors.maroon} />
                <Text style={styles.uploadChipText}>Upload</Text>
              </TouchableOpacity>
            </View>
            {bookEbooks.length === 0 ? (
              <Text style={styles.noFilesText}>No files yet — upload PDF or ePub</Text>
            ) : (
              bookEbooks.map((ef) => (
                <View key={ef.id} style={styles.ebookRow}>
                  <View style={styles.ebookIcon}><Text style={styles.ebookIconText}>{ef.format}</Text></View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.ebookName} numberOfLines={1}>{ef.name}</Text>
                    <Text style={styles.ebookMeta}>{ef.size}</Text>
                  </View>
                  <TouchableOpacity style={styles.ebookReadBtn} onPress={() => (navigation as any).navigate('Reader', { ebookId: ef.id })}>
                    <Text style={styles.ebookReadBtnText}>Read</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.ebookRemoveBtn} onPress={() => removeEbook(ef.id)}>
                    <Ionicons name="close" size={12} color={colors.maroon} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.sessionCard}>
          <View style={styles.sessionTop}>
            <View>
              <Text style={styles.sessionLabel}>Reading session</Text>
              <Text style={styles.sessionSub}>{fmtHM(sessionTotal)} on this book</Text>
            </View>
            <Text style={styles.sessionTimer}>{fmtClock(sessionLiveSeconds)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.sessionBtn, { backgroundColor: isMonitoring && !monitor.paused ? '#d6453f' : colors.maroon }]}
            onPress={() => {
              if (!isMonitoring) toggleReadingSession();
              else if (monitor.paused) resumeMonitor();
              else pauseMonitor();
            }}
          >
            <Ionicons name={isMonitoring && !monitor.paused ? 'pause' : 'play'} size={16} color={colors.white} />
            <Text style={styles.sessionBtnText}>{isMonitoring ? (monitor.paused ? 'Resume reading' : 'Pause reading') : 'Start reading'}</Text>
          </TouchableOpacity>
          {isMonitoring && (
            <TouchableOpacity style={styles.sessionStopBtn} onPress={toggleReadingSession}>
              <Text style={styles.sessionStopBtnText}>Stop & save</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.chaptersRow} onPress={openChapters}>
          <View style={styles.chaptersIcon}><Ionicons name="list-outline" size={17} color={colors.maroon} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.chaptersTitle}>Chapters</Text>
            <Text style={styles.chaptersSub}>{chapters ? `${chReadCount} of ${chapters.length} chapters read` : 'Not scanned yet'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
        </TouchableOpacity>

        {book.description ? (
          <View style={styles.descCard}>
            <Text style={styles.descLabel}>Description</Text>
            <Text style={styles.descText}>{book.description}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={16} color={colors.maroon} />
          <Text style={styles.deleteBtnText}>Remove from library</Text>
        </TouchableOpacity>
      </View>

      {/* Field editor (Author / Language / Publisher) */}
      <Modal
        visible={!!fieldSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setFieldSheet(null)}
        onShow={() => setTimeout(() => fieldInputRef.current?.focus(), 250)}
      >
        <View style={styles.modalScrim}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setFieldSheet(null)} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalSheet}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>Add {fieldSheet}</Text>
              <View style={styles.chipWrap}>
                {(fieldSheet === 'author' ? authors : fieldSheet === 'language' ? languages : publishers).map((v) => (
                  <View key={v} style={styles.miniChip}><Text style={styles.miniChipText}>{v}</Text></View>
                ))}
              </View>
              <View style={styles.row}>
                <TextInput
                  ref={fieldInputRef}
                  style={[styles.input, { flex: 1 }]}
                  placeholder={fieldSheet === 'language' ? 'e.g. Spanish' : fieldSheet === 'publisher' ? 'e.g. Penguin' : 'e.g. Co-author name'}
                  placeholderTextColor={colors.textFaint}
                  value={fieldDraft}
                  onChangeText={setFieldDraft}
                />
                <TouchableOpacity style={styles.addBtn} onPress={saveFieldValue}><Text style={styles.addBtnText}>Add</Text></TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Shelf picker */}
      <Modal
        visible={shelfSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setShelfSheetOpen(false)}
      >
        <View style={styles.modalScrim}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShelfSheetOpen(false)} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalSheet}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>Shelf location</Text>
              <Text style={styles.sheetSub}>Tap to assign or move this book</Text>
              {SHELVES.map((s) => (
                <TouchableOpacity key={s} style={[styles.locRow, s === book.shelf && styles.locRowActive]} onPress={() => selectShelf(s)}>
                  <View style={styles.locIcon}><Ionicons name="bookmark" size={15} color={colors.white} /></View>
                  <Text style={styles.locName}>{s}</Text>
                  {s === book.shelf && <Ionicons name="checkmark" size={18} color={colors.maroon} />}
                </TouchableOpacity>
              ))}
              <View style={styles.divider} />
              <Text style={styles.sheetLabel}>Add new location</Text>
              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="e.g. Garage, Office…" placeholderTextColor={colors.textFaint} value={customShelfDraft} onChangeText={setCustomShelfDraft} />
                <TouchableOpacity style={styles.addBtn} onPress={saveCustomShelf}><Text style={styles.addBtnText}>Add</Text></TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Chapters overlay */}
      <Modal visible={chaptersOpen} animationType="slide" onRequestClose={() => setChaptersOpen(false)}>
        <View style={styles.chaptersContainer}>
          <View style={styles.chaptersHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setChaptersOpen(false)}>
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.chaptersHeaderTitle}>Chapters</Text>
              <Text style={styles.chaptersHeaderSub}>{book.title}</Text>
            </View>
            {chapters && chapters.length > 0 ? (
              <TouchableOpacity style={styles.backBtn} onPress={confirmDeleteChapters}>
                <Ionicons name="trash-outline" size={18} color={colors.maroon} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 38 }} />
            )}
          </View>

          {(!chapters || chapters.length === 0) && (
            <View style={styles.scanIdle}>
              <View style={styles.scanIconBox}><Ionicons name="reader-outline" size={38} color={colors.maroon} /></View>
              <Text style={styles.scanTitle}>No chapters yet</Text>
              <Text style={styles.scanSub}>Add each chapter's title and page number from the table of contents</Text>
            </View>
          )}

          <View style={styles.photosSection}>
            <Text style={styles.photosLabel}>Index / chapter page photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {chapterPhotos.map((uri, i) => (
                <TouchableOpacity key={i} style={styles.photoThumbWrap} onPress={() => setViewingPhoto(uri)} onLongPress={() => confirmDeleteChapterPhoto(i)}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => confirmDeleteChapterPhoto(i)}>
                    <Ionicons name="close" size={11} color={colors.white} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.photoAddTile} onPress={addChapterPhotoPrompt}>
                <Ionicons name="camera-outline" size={22} color={colors.maroon} />
              </TouchableOpacity>
            </ScrollView>
          </View>

          <View style={styles.addChapterRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Chapter title"
              placeholderTextColor={colors.textFaint}
              value={newChapterTitle}
              onChangeText={setNewChapterTitle}
            />
            <TextInput
              style={[styles.input, { width: 72 }]}
              placeholder="Page"
              placeholderTextColor={colors.textFaint}
              value={newChapterPage}
              onChangeText={setNewChapterPage}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.addBtn} onPress={submitNewChapter}>
              <Ionicons name="add" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>

          {chapters && chapters.length > 0 && (
            <>
              <View style={{ paddingHorizontal: 18 }}>
                <View style={styles.chProgressRow}>
                  <Text style={styles.chProgressText}>{chReadCount} of {chapters.length} read</Text>
                  <Text style={styles.chProgressPct}>{chPct}%</Text>
                </View>
                <View style={styles.chProgressTrack}><View style={[styles.chProgressFill, { width: `${chPct}%` }]} /></View>
                <TouchableOpacity style={styles.selectAllRow} onPress={() => markAllChapters(book.id, chReadCount < chapters.length)}>
                  <View style={[styles.checkbox, chReadCount === chapters.length && styles.checkboxChecked]}>
                    {chReadCount === chapters.length && <Ionicons name="checkmark" size={13} color={colors.white} />}
                  </View>
                  <Text style={styles.selectAllText}>Select all chapters</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30 }}>
                {chapters.map((c, i) => (
                  <View key={i} style={styles.chRow}>
                    <TouchableOpacity style={styles.chRowMain} onPress={() => toggleChapter(book.id, i)}>
                      <View style={[styles.checkbox, c.read && styles.checkboxChecked]}>
                        {c.read && <Ionicons name="checkmark" size={13} color={colors.white} />}
                      </View>
                      <Text style={[styles.chTitle, c.read && { color: colors.textMuted }]} numberOfLines={1}>{c.title}</Text>
                      <Text style={styles.chPage}>p.{c.page}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chRemoveBtn} onPress={() => removeChapterAt(book.id, i)}>
                      <Ionicons name="close" size={14} color={colors.textFaint} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </Modal>

      <Modal visible={!!viewingPhoto} transparent animationType="fade" onRequestClose={() => setViewingPhoto(null)}>
        <TouchableOpacity style={styles.photoViewerScrim} activeOpacity={1} onPress={() => setViewingPhoto(null)}>
          {viewingPhoto ? <Image source={{ uri: viewingPhoto }} style={styles.photoViewerImg} resizeMode="contain" /> : null}
          <TouchableOpacity style={styles.photoViewerClose} onPress={() => setViewingPhoto(null)}>
            <Ionicons name="close" size={22} color={colors.white} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  backBtn: {
    width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  coverRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  coverCol: { alignItems: 'center', gap: 6 },
  coverBoxDashed: {
    width: 114, height: 160, borderRadius: 9, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', gap: 6,
  },
  coverImg: { width: '100%', height: '100%' },
  coverPlaceholderText: { fontSize: 11, color: colors.textFaint, fontWeight: '600' },
  coverLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 14 },
  cameraBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.dark, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radii.sm },
  cameraBtnText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3, marginTop: 14 },
  authorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  authorChip: { backgroundColor: colors.chipBg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  authorChipText: { fontSize: 13, fontWeight: '700', color: colors.textSoft },
  addChip: { backgroundColor: '#fff1ec', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20 },
  addChipText: { fontSize: 13, fontWeight: '700', color: colors.maroon },
  genrePill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  genrePillText: { fontSize: 12, fontWeight: '700', color: colors.white },
  progressWrap: { marginTop: 14 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.chipBg, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.maroon, borderRadius: 3 },
  progressLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700', marginTop: 5 },
  infoCard: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.xl, paddingHorizontal: 18, marginTop: 18 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  infoRowWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  infoValRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { color: colors.textMuted, fontWeight: '600', fontSize: 14, flexShrink: 0 },
  infoValue: { color: colors.text, fontWeight: '700', fontSize: 14 },
  chipWrapEnd: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'flex-end', flex: 1 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14, marginBottom: 4 },
  miniChip: { backgroundColor: colors.chipBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  miniChipText: { fontSize: 12, fontWeight: '700', color: colors.text },
  plusChip: { backgroundColor: '#fff1ec', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12 },
  plusChipText: { fontSize: 12, fontWeight: '700', color: colors.maroon },
  mediaCard: { marginTop: 16, backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.lg, overflow: 'hidden' },
  mediaSection: { padding: 13 },
  mediaHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  mediaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  mediaHeaderText: { fontSize: 11, fontWeight: '700', color: colors.maroon, textTransform: 'uppercase', letterSpacing: 0.5 },
  mediaInput: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.sm, padding: 9, fontSize: 13, color: colors.text, backgroundColor: colors.card },
  ytLink: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, backgroundColor: colors.card, borderRadius: radii.sm, overflow: 'hidden', borderWidth: 1.5, borderColor: colors.border },
  ytThumb: { width: 56, height: 40, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' },
  ytTitle: { fontSize: 12, fontWeight: '700', color: colors.text },
  ytUrl: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  uploadChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.pinkBg, borderWidth: 1, borderColor: colors.pinkBorder, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9 },
  uploadChipText: { fontSize: 12, fontWeight: '700', color: colors.maroon },
  noFilesText: { fontSize: 13, color: colors.textFaint, fontWeight: '600', textAlign: 'center', paddingVertical: 8 },
  ebookRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  ebookIcon: { width: 32, height: 38, borderRadius: 7, backgroundColor: colors.pinkBg, borderWidth: 1, borderColor: colors.pinkBorder, alignItems: 'center', justifyContent: 'center' },
  ebookIconText: { fontSize: 9, fontWeight: '700', color: colors.maroon },
  ebookName: { fontSize: 13, fontWeight: '700', color: colors.text },
  ebookMeta: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  ebookReadBtn: { backgroundColor: colors.pinkBg, borderWidth: 1, borderColor: colors.pinkBorder, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9 },
  ebookReadBtnText: { fontSize: 11, fontWeight: '700', color: colors.maroon },
  ebookRemoveBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#fff0ee', alignItems: 'center', justifyContent: 'center' },
  sessionCard: { marginTop: 8, backgroundColor: colors.dark, borderRadius: radii.xl, padding: 18 },
  sessionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sessionLabel: { fontSize: 12, color: colors.textFaint, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  sessionSub: { fontSize: 12, color: colors.coral, fontWeight: '700', marginTop: 3 },
  sessionTimer: { fontSize: 26, fontWeight: '700', color: colors.white, fontVariant: ['tabular-nums'] },
  sessionBtn: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: radii.md, padding: 14 },
  sessionBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  sessionStopBtn: { marginTop: 8, alignItems: 'center', padding: 8 },
  sessionStopBtnText: { color: colors.textFaint, fontWeight: '700', fontSize: 12 },
  chaptersRow: { marginTop: 8, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.lg, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  chaptersIcon: { width: 34, height: 34, borderRadius: radii.sm, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  chaptersTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  chaptersSub: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 1 },
  descCard: { marginTop: 14, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.xl, padding: 16 },
  descLabel: { fontSize: 11, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  descText: { fontSize: 14, color: colors.textSoft, lineHeight: 21 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, padding: 12 },
  deleteBtnText: { color: colors.maroon, fontSize: 14, fontWeight: '700' },
  modalScrim: { flex: 1, backgroundColor: 'rgba(27,23,20,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.bg, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, padding: 20, paddingBottom: 30, maxHeight: '85%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  sheetSub: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginTop: 4, marginBottom: 12 },
  sheetLabel: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, padding: 12, fontSize: 14, color: colors.text, backgroundColor: colors.card },
  addBtn: { backgroundColor: colors.maroon, paddingHorizontal: 18, borderRadius: radii.md, justifyContent: 'center' },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radii.md, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, marginBottom: 8 },
  locRowActive: { borderColor: colors.maroon, backgroundColor: colors.pinkBg },
  locIcon: { width: 32, height: 32, borderRadius: radii.sm, backgroundColor: colors.maroon, alignItems: 'center', justifyContent: 'center' },
  locName: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  chaptersContainer: { flex: 1, backgroundColor: colors.bg },
  chaptersHeader: { paddingTop: 50, paddingHorizontal: 18, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  chaptersHeaderTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  chaptersHeaderSub: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  scanIdle: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  scanIconBox: { width: 84, height: 84, borderRadius: 22, backgroundColor: colors.pinkBg, borderWidth: 1.5, borderColor: colors.pinkBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  scanTitle: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  scanSub: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginTop: 8, textAlign: 'center', maxWidth: 230 },
  addChapterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingBottom: 16 },
  photosSection: { paddingHorizontal: 18, paddingBottom: 16 },
  photosLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  photoThumbWrap: { width: 64, height: 64, borderRadius: radii.md, overflow: 'visible' },
  photoThumb: { width: 64, height: 64, borderRadius: radii.md, backgroundColor: colors.chipBg },
  photoRemoveBtn: {
    position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.maroon, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg,
  },
  photoAddTile: {
    width: 64, height: 64, borderRadius: radii.md, backgroundColor: colors.pinkBg,
    borderWidth: 1.5, borderColor: colors.pinkBorder, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
  },
  photoViewerScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  photoViewerImg: { width: '100%', height: '80%' },
  photoViewerClose: {
    position: 'absolute', top: 50, right: 20, width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  chProgressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  chProgressText: { fontSize: 13, fontWeight: '700', color: colors.text },
  chProgressPct: { fontSize: 13, fontWeight: '700', color: colors.maroon },
  chProgressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.chipBg, overflow: 'hidden', marginBottom: 12 },
  chProgressFill: { height: '100%', backgroundColor: colors.maroon },
  selectAllRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1.5, borderBottomColor: colors.border },
  selectAllText: { fontSize: 14, fontWeight: '700', color: colors.text },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.maroon, borderColor: colors.maroon },
  chRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  chRowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  chTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  chPage: { fontSize: 12, color: colors.textFaint, fontWeight: '600' },
  chRemoveBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
});
