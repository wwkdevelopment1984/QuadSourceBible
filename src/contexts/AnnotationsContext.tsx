import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  OperationType,
  handleFirestoreError,
} from '../firebase';
import {
  ActiveHighlightColor,
  AnnotationStream,
  HighlightColor,
  TextHighlight,
  VerseAnnotation,
  buildAnnotationKey,
  isAnnotationEmpty,
  loadLocalAnnotations,
  sanitizeAnnotation,
  saveLocalAnnotationsMap,
} from '../utils/annotations';

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'offline' | 'error';

interface AnnotationsContextValue {
  user: User | null;
  authReady: boolean;
  isSigningIn: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  annotationsMap: Record<string, VerseAnnotation>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  getAnnotation: (bookId: string, chapterNumber: number, verseNumber: number) => VerseAnnotation | null;
  setVerseHighlightColor: (
    bookId: string,
    chapterNumber: number,
    verseNumber: number,
    color: HighlightColor
  ) => Promise<void>;
  addTextHighlight: (
    bookId: string,
    chapterNumber: number,
    verseNumber: number,
    highlight: TextHighlight
  ) => Promise<void>;
  removeTextHighlight: (
    bookId: string,
    chapterNumber: number,
    verseNumber: number,
    stream: AnnotationStream,
    quote: string
  ) => Promise<void>;
  saveVerseNote: (
    bookId: string,
    chapterNumber: number,
    verseNumber: number,
    noteText: string
  ) => Promise<void>;
  clearVerseAnnotation: (
    bookId: string,
    chapterNumber: number,
    verseNumber: number
  ) => Promise<void>;
  getChapterAnnotatedVerses: (
    bookId: string,
    chapterNumber: number
  ) => Map<number, VerseAnnotation>;
}

const AnnotationsContext = createContext<AnnotationsContextValue | null>(null);

export const AnnotationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [annotationsMap, setAnnotationsMap] = useState<Record<string, VerseAnnotation>>(() =>
    loadLocalAnnotations()
  );

  // Track keys already uploaded during login migration so we only merge once per login
  const mergedForUidRef = useRef<string | null>(null);
  const remoteKeysRef = useRef<Set<string>>(new Set());

  // Keep localStorage mirrored whenever annotationsMap updates
  useEffect(() => {
    saveLocalAnnotationsMap(annotationsMap);
  }, [annotationsMap]);

  // Observe Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) {
        mergedForUidRef.current = null;
        remoteKeysRef.current = new Set();
        setSyncStatus('local');
        setSyncError(null);
        setAnnotationsMap(loadLocalAnnotations());
      }
    });
    return () => unsub();
  }, []);

  // Track browser online/offline transitions
  useEffect(() => {
    const handleOnline = () => {
      if (user) setSyncStatus('synced');
    };
    const handleOffline = () => {
      if (user) setSyncStatus('offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const persistAnnotationToFirestore = useCallback(
    async (uid: string, next: VerseAnnotation, existsRemotely: boolean) => {
      const sanitized = sanitizeAnnotation(next);
      const collectionPath = `users/${uid}/annotations`;
      const docRef = doc(db, collectionPath, sanitized.key);

      if (isAnnotationEmpty(sanitized)) {
        if (!existsRemotely) return;
        try {
          await deleteDoc(docRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `${collectionPath}/${sanitized.key}`);
        }
        return;
      }

      if (existsRemotely) {
        try {
          await updateDoc(docRef, {
            highlightColor: sanitized.highlightColor,
            noteText: sanitized.noteText,
            textHighlights: sanitized.textHighlights,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `${collectionPath}/${sanitized.key}`);
        }
      } else {
        try {
          await setDoc(docRef, {
            ownerId: uid,
            bookId: sanitized.bookId,
            chapterNumber: sanitized.chapterNumber,
            verseNumber: sanitized.verseNumber,
            highlightColor: sanitized.highlightColor,
            noteText: sanitized.noteText,
            textHighlights: sanitized.textHighlights,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `${collectionPath}/${sanitized.key}`);
        }
      }
    },
    []
  );

  // Attach real-time Firestore listener ONLY when authReady && user is authenticated
  useEffect(() => {
    if (!authReady || !user) return;

    setSyncStatus(navigator.onLine ? 'syncing' : 'offline');
    const collectionPath = `users/${user.uid}/annotations`;
    const q = query(collection(db, collectionPath), where('ownerId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const nextRemoteMap: Record<string, VerseAnnotation> = {};
        const nextRemoteKeys = new Set<string>();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const updatedAtTs = data.updatedAt as Timestamp | undefined;
          const sanitized = sanitizeAnnotation({
            key: docSnap.id,
            bookId: String(data.bookId || ''),
            chapterNumber: Number(data.chapterNumber || 1),
            verseNumber: Number(data.verseNumber || 1),
            highlightColor: (data.highlightColor as HighlightColor) || 'none',
            noteText: String(data.noteText || ''),
            textHighlights: Array.isArray(data.textHighlights) ? data.textHighlights : [],
            updatedAt: updatedAtTs?.toMillis ? updatedAtTs.toMillis() : Date.now(),
          });
          if (!isAnnotationEmpty(sanitized)) {
            nextRemoteMap[sanitized.key] = sanitized;
            nextRemoteKeys.add(sanitized.key);
          }
        });

        remoteKeysRef.current = nextRemoteKeys;

        // On first snapshot after sign-in, merge any pre-existing local annotations that aren't in Firestore yet
        if (mergedForUidRef.current !== user.uid) {
          mergedForUidRef.current = user.uid;
          const localMap = loadLocalAnnotations();
          const pendingUploads: VerseAnnotation[] = [];

          for (const [k, localEntry] of Object.entries(localMap)) {
            if (!nextRemoteMap[k] && !isAnnotationEmpty(localEntry)) {
              nextRemoteMap[k] = localEntry;
              pendingUploads.push(localEntry);
            }
          }

          if (pendingUploads.length > 0 && navigator.onLine) {
            for (const entry of pendingUploads) {
              try {
                await persistAnnotationToFirestore(user.uid, entry, false);
                remoteKeysRef.current.add(entry.key);
              } catch (err) {
                console.warn('Merge local annotation error:', err);
              }
            }
          }
        }

        setAnnotationsMap(nextRemoteMap);
        setSyncStatus(navigator.onLine ? 'synced' : 'offline');
        setSyncError(null);
      },
      (error) => {
        setSyncStatus('error');
        setSyncError('雲端同步權限或網路連線異常');
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      }
    );

    return () => unsubscribe();
  }, [authReady, user, persistAnnotationToFirestore]);

  const signInWithGoogle = async () => {
    setIsSigningIn(true);
    setSyncError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      const msg = err instanceof Error ? err.message : '登入失敗';
      if (code === 'auth/popup-closed-by-user' || msg.includes('popup-closed-by-user')) {
        // User intentionally dismissed sign-in
      } else if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
        setSyncError('瀏覽器阻擋了 Google 登入彈出視窗，請允許彈出視窗後再試一次');
      } else if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        setSyncError('此網址尚未加入 Firebase 授權網域（請使用開發測試網址或 localhost 開啟）');
      } else {
        setSyncError('Google 登入未完成，請確認網路連線與彈出視窗設定後再試');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  const getAnnotation = useCallback(
    (bookId: string, chapterNumber: number, verseNumber: number): VerseAnnotation | null => {
      const key = buildAnnotationKey(bookId, chapterNumber, verseNumber);
      return annotationsMap[key] || null;
    },
    [annotationsMap]
  );

  const mutateAnnotation = useCallback(
    async (
      bookId: string,
      chapterNumber: number,
      verseNumber: number,
      updater: (current: VerseAnnotation) => VerseAnnotation
    ) => {
      const key = buildAnnotationKey(bookId, chapterNumber, verseNumber);
      const current: VerseAnnotation = annotationsMap[key] || {
        key,
        bookId: bookId.trim().toUpperCase(),
        chapterNumber,
        verseNumber,
        highlightColor: 'none',
        noteText: '',
        textHighlights: [],
        updatedAt: Date.now(),
      };

      const next = sanitizeAnnotation({
        ...updater(current),
        key,
        bookId: current.bookId,
        chapterNumber,
        verseNumber,
        updatedAt: Date.now(),
      });

      const empty = isAnnotationEmpty(next);
      setAnnotationsMap((prev) => {
        const copy = { ...prev };
        if (empty) {
          delete copy[key];
        } else {
          copy[key] = next;
        }
        return copy;
      });

      if (user) {
        const existedRemotely = remoteKeysRef.current.has(key);
        if (empty) {
          remoteKeysRef.current.delete(key);
        } else {
          remoteKeysRef.current.add(key);
        }
        setSyncStatus(navigator.onLine ? 'syncing' : 'offline');
        await persistAnnotationToFirestore(user.uid, next, existedRemotely);
        setSyncStatus(navigator.onLine ? 'synced' : 'offline');
      }
    },
    [annotationsMap, user, persistAnnotationToFirestore]
  );

  const setVerseHighlightColor = useCallback(
    async (
      bookId: string,
      chapterNumber: number,
      verseNumber: number,
      color: HighlightColor
    ) => {
      await mutateAnnotation(bookId, chapterNumber, verseNumber, (curr) => ({
        ...curr,
        highlightColor: color,
      }));
    },
    [mutateAnnotation]
  );

  const addTextHighlight = useCallback(
    async (
      bookId: string,
      chapterNumber: number,
      verseNumber: number,
      highlight: TextHighlight
    ) => {
      await mutateAnnotation(bookId, chapterNumber, verseNumber, (curr) => {
        const filtered = curr.textHighlights.filter(
          (h) => !(h.stream === highlight.stream && h.quote === highlight.quote.trim())
        );
        return {
          ...curr,
          textHighlights: [
            ...filtered,
            {
              stream: highlight.stream,
              quote: highlight.quote.trim().slice(0, 500),
              color: highlight.color as ActiveHighlightColor,
            },
          ],
        };
      });
    },
    [mutateAnnotation]
  );

  const removeTextHighlight = useCallback(
    async (
      bookId: string,
      chapterNumber: number,
      verseNumber: number,
      stream: AnnotationStream,
      quote: string
    ) => {
      await mutateAnnotation(bookId, chapterNumber, verseNumber, (curr) => ({
        ...curr,
        textHighlights: curr.textHighlights.filter(
          (h) => !(h.stream === stream && h.quote === quote)
        ),
      }));
    },
    [mutateAnnotation]
  );

  const saveVerseNote = useCallback(
    async (
      bookId: string,
      chapterNumber: number,
      verseNumber: number,
      noteText: string
    ) => {
      await mutateAnnotation(bookId, chapterNumber, verseNumber, (curr) => ({
        ...curr,
        noteText,
      }));
    },
    [mutateAnnotation]
  );

  const clearVerseAnnotation = useCallback(
    async (bookId: string, chapterNumber: number, verseNumber: number) => {
      await mutateAnnotation(bookId, chapterNumber, verseNumber, (curr) => ({
        ...curr,
        highlightColor: 'none',
        noteText: '',
        textHighlights: [],
      }));
    },
    [mutateAnnotation]
  );

  const getChapterAnnotatedVerses = useCallback(
    (bookId: string, chapterNumber: number): Map<number, VerseAnnotation> => {
      const cleanBook = bookId.trim().toUpperCase();
      const map = new Map<number, VerseAnnotation>();
      for (const entry of Object.values(annotationsMap)) {
        if (entry.bookId === cleanBook && entry.chapterNumber === chapterNumber) {
          map.set(entry.verseNumber, entry);
        }
      }
      return map;
    },
    [annotationsMap]
  );

  return (
    <AnnotationsContext.Provider
      value={{
        user,
        authReady,
        isSigningIn,
        syncStatus,
        syncError,
        annotationsMap,
        signInWithGoogle,
        signOutUser,
        getAnnotation,
        setVerseHighlightColor,
        addTextHighlight,
        removeTextHighlight,
        saveVerseNote,
        clearVerseAnnotation,
        getChapterAnnotatedVerses,
      }}
    >
      {children}
    </AnnotationsContext.Provider>
  );
};

export function useAnnotations() {
  const ctx = useContext(AnnotationsContext);
  if (!ctx) {
    throw new Error('useAnnotations must be used within an AnnotationsProvider');
  }
  return ctx;
}
