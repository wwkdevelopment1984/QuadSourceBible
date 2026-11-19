import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  Smartphone,
  ExternalLink,
  Loader2,
  Bookmark,
  Search,
  Library,
  RotateCcw,
  CheckCircle2,
  HardDriveDownload,
  PlusCircle,
  Filter,
  Highlighter,
  Columns2,
} from 'lucide-react';
import {
  BibleBook,
  ChapterData,
  ReaderTheme,
  FontSize,
  ChineseVariant,
  ViewMode,
} from './types/scripture';
import { BIBLE_BOOKS, getBookById } from './data/bibleBooks';
import {
  getChapterOffline,
  saveChapterOffline,
  getOfflineCachedCount,
} from './utils/offlineCache';
import { loadChapterWithCache } from './utils/chapterLoader';
import { HIGHLIGHT_COLOR_CONFIG } from './utils/annotations';
import { useAnnotations } from './contexts/AnnotationsContext';
import { Header } from './components/Header';
import { VerseCard } from './components/VerseCard';
import { StudyPane, StudyPaneConfig } from './components/StudyPane';
import { BookChapterModal } from './components/BookChapterModal';
import { PromptStudioModal } from './components/PromptStudioModal';
import { ReaderSettingsModal } from './components/ReaderSettingsModal';
import { SourcesInfoModal } from './components/SourcesInfoModal';
import { BiblicalPersonModal } from './components/BiblicalPersonModal';
import { AnnotationsModal } from './components/AnnotationsModal';
import { CloudSyncButton } from './components/CloudSyncButton';
import { MobileBottomNav } from './components/MobileBottomNav';
import { TestamentSelectionPortal } from './components/TestamentSelectionPortal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { FloatingStudyControls } from './components/FloatingStudyControls';

const STORAGE_KEY_LAST_READ = 'quad_scripture_last_read';
const STORAGE_KEY_INITIAL_COMPLETED = 'quad_scripture_initial_completed';
const STORAGE_KEY_STUDY_PANES = 'quad_scripture_study_panes_v1';

interface SavedPosition {
  bookId: string;
  chapter: number;
  timestamp: number;
}

interface SavedStudyLayout {
  count: 1 | 2 | 3 | 4;
  slots: StudyPaneConfig[];
}

function getDefaultExtraSlots(primaryBookId: string, primaryChapter: number): StudyPaneConfig[] {
  const candidates: StudyPaneConfig[] = [
    { bookId: 'GEN', chapter: 1 },
    { bookId: 'MAT', chapter: 5 },
    { bookId: 'GEN', chapter: 14 },
    { bookId: 'JAS', chapter: 1 },
    { bookId: 'JHN', chapter: 1 },
  ];
  const extras = candidates.filter(
    (c) => !(c.bookId === primaryBookId && c.chapter === primaryChapter)
  );
  return [
    { bookId: primaryBookId, chapter: primaryChapter },
    extras[0] || { bookId: 'GEN', chapter: 1 },
    extras[1] || { bookId: 'MAT', chapter: 5 },
    extras[2] || { bookId: 'GEN', chapter: 14 },
  ];
}

export default function App() {
  // Read saved reading position from localStorage
  const getSavedPosition = (): SavedPosition | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LAST_READ);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore JSON error
    }
    return null;
  };

  const isInitialCompleted = (): boolean => {
    try {
      return localStorage.getItem(STORAGE_KEY_INITIAL_COMPLETED) === 'true';
    } catch {
      return false;
    }
  };

  const saved = getSavedPosition();
  const initialDone = isInitialCompleted();

  // If user has a saved position and completed initial setup, resume directly;
  // otherwise, start at the Testament Selection screen.
  const [isPortalOpen, setIsPortalOpen] = useState<boolean>(!initialDone && !saved);
  const [resumedNotice, setResumedNotice] = useState<boolean>(Boolean(saved && initialDone));

  // Default to saved book & chapter, or John (JHN) Chapter 1
  const defaultBook = (saved && getBookById(saved.bookId)) || getBookById('JHN') || BIBLE_BOOKS[42];
  const defaultChap = saved ? saved.chapter : 1;

  const getInitialStudyLayout = (): SavedStudyLayout => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STUDY_PANES);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SavedStudyLayout>;
        const cnt = parsed.count;
        if ((cnt === 1 || cnt === 2 || cnt === 3 || cnt === 4) && Array.isArray(parsed.slots) && parsed.slots.length >= 4) {
          return {
            count: cnt,
            slots: parsed.slots.slice(0, 4).map((s, idx) => ({
              bookId: getBookById(s?.bookId) ? s.bookId : idx === 0 ? defaultBook.id : 'GEN',
              chapter: Number(s?.chapter) > 0 ? Number(s.chapter) : 1,
            })),
          };
        }
      }
    } catch {
      // ignore malformed layout
    }
    return {
      count: 1,
      slots: getDefaultExtraSlots(defaultBook.id, defaultChap),
    };
  };

  const initialLayout = getInitialStudyLayout();
  const [studyCount, setStudyCount] = useState<1 | 2 | 3 | 4>(initialLayout.count);
  const [studySlots, setStudySlots] = useState<StudyPaneConfig[]>(initialLayout.slots);
  const [activeModalSlotIndex, setActiveModalSlotIndex] = useState<number>(0);
  const [modalCloseOnPick, setModalCloseOnPick] = useState<boolean>(true);
  const [mobileFocusPane, setMobileFocusPane] = useState<'all' | number>('all');

  const [selectedBook, setSelectedBook] = useState<BibleBook>(
    getBookById(initialLayout.slots[0]?.bookId) || defaultBook
  );
  const [selectedChapter, setSelectedChapter] = useState<number>(
    initialLayout.slots[0]?.chapter || defaultChap
  );
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadedFromOffline, setLoadedFromOffline] = useState<boolean>(false);
  const [cachedCount, setCachedCount] = useState<number>(8);
  const [isDownloadingBook, setIsDownloadingBook] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');
  const [verseFilter, setVerseFilter] = useState<'all' | 'jst-only-or-diff' | 'has-annotation'>('all');
  const { annotationsMap, getChapterAnnotatedVerses } = useAnnotations();
  const chapterAnnotations = getChapterAnnotatedVerses(selectedBook.id, selectedChapter);
  const annotationsCount = Object.keys(annotationsMap).length;
  const [pendingScrollVerse, setPendingScrollVerse] = useState<number | null>(null);

  // Reader Settings
  const [theme, setTheme] = useState<ReaderTheme>('parchment');
  const [fontSize, setFontSize] = useState<FontSize>('base');
  const [chineseVariant, setChineseVariant] = useState<ChineseVariant>('traditional');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [diffHighlight, setDiffHighlight] = useState<boolean>(true);

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState<boolean>(false);
  const [isPromptStudioOpen, setIsPromptStudioOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState<boolean>(false);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState<boolean>(false);
  const [isAnnotationsModalOpen, setIsAnnotationsModalOpen] = useState<boolean>(false);

  // Sync slot 0 and persist study layout whenever studyCount or studySlots change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_STUDY_PANES,
        JSON.stringify({ count: studyCount, slots: studySlots })
      );
    } catch {
      // ignore quota error
    }
  }, [studyCount, studySlots]);

  const updateSlot0 = useCallback((bookId: string, chapter: number) => {
    setStudySlots((prev) => {
      const next = [...prev];
      next[0] = { bookId, chapter };
      return next;
    });
  }, []);

  const handleOpenBookModalForPane = (slotIndex: number, closeAfterPick: boolean) => {
    setActiveModalSlotIndex(slotIndex);
    setModalCloseOnPick(closeAfterPick);
    setIsBookModalOpen(true);
  };

  const handleChangeStudyCount = (cnt: 1 | 2 | 3 | 4) => {
    setStudyCount(cnt);
    setMobileFocusPane('all');
    if (cnt > 1) {
      setStudySlots((prev) => {
        const next = [...prev];
        next[0] = { bookId: selectedBook.id, chapter: selectedChapter };
        return next;
      });
    }
  };

  const handleSelectForSlot = (slotIndex: number, book: BibleBook, chapter: number) => {
    setStudySlots((prev) => {
      const next = [...prev];
      next[slotIndex] = { bookId: book.id, chapter };
      return next;
    });
    if (slotIndex === 0) {
      setVerseFilter('all');
      setSelectedBook(book);
      setSelectedChapter(chapter);
      persistPosition(book.id, chapter);
    }
  };

  const handlePromotePaneToSingle = (slotIndex: number) => {
    const slot = studySlots[slotIndex];
    const targetBook = (slot && getBookById(slot.bookId)) || selectedBook;
    const targetChap = slot ? slot.chapter : selectedChapter;
    setSelectedBook(targetBook);
    setSelectedChapter(targetChap);
    updateSlot0(targetBook.id, targetChap);
    persistPosition(targetBook.id, targetChap);
    setStudyCount(1);
    setMobileFocusPane('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClosePane = (slotIndex: number) => {
    if (studyCount <= 1) return;
    const remaining = studySlots.filter((_, idx) => idx !== slotIndex);
    while (remaining.length < 4) {
      remaining.push({ bookId: 'GEN', chapter: 1 });
    }
    const nextPrimaryBook = getBookById(remaining[0].bookId) || selectedBook;
    setStudySlots(remaining);
    setSelectedBook(nextPrimaryBook);
    setSelectedChapter(remaining[0].chapter);
    persistPosition(nextPrimaryBook.id, remaining[0].chapter);
    setStudyCount((studyCount - 1) as 1 | 2 | 3 | 4);
    setMobileFocusPane('all');
  };

  const applyStudyPreset = (slotsToApply: StudyPaneConfig[]) => {
    const cnt = Math.min(4, Math.max(1, slotsToApply.length)) as 1 | 2 | 3 | 4;
    const padded = [...slotsToApply];
    while (padded.length < 4) {
      padded.push(studySlots[padded.length] || { bookId: 'JAS', chapter: 1 });
    }
    const primaryBook = getBookById(padded[0].bookId) || selectedBook;
    setStudySlots(padded);
    setStudyCount(cnt);
    setSelectedBook(primaryBook);
    setSelectedChapter(padded[0].chapter);
    persistPosition(primaryBook.id, padded[0].chapter);
    setMobileFocusPane('all');
  };

  const refreshCachedCount = useCallback(async () => {
    const count = await getOfflineCachedCount();
    setCachedCount(count);
  }, []);

  useEffect(() => {
    refreshCachedCount();
  }, [refreshCachedCount]);

  // Save position to localStorage whenever user navigates
  const persistPosition = useCallback((bookId: string, chapter: number) => {
    try {
      localStorage.setItem(STORAGE_KEY_INITIAL_COMPLETED, 'true');
      localStorage.setItem(
        STORAGE_KEY_LAST_READ,
        JSON.stringify({ bookId, chapter, timestamp: Date.now() })
      );
    } catch (err) {
      console.warn('Failed to save reading position to localStorage:', err);
    }
  }, []);

  // Handle selection from the First Page Testament Selection Portal
  const handleSelectBookChapterFromPortal = (book: BibleBook, chapter: number) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    updateSlot0(book.id, chapter);
    setVerseFilter('all');
    setIsPortalOpen(false);
    setResumedNotice(false);
    persistPosition(book.id, chapter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Return to first page (OT vs NT selection portal)
  const handleOpenTestamentPortal = () => {
    setIsPortalOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateScripture = (bookId: string, chapter: number, verseNumber?: number) => {
    const targetBook = getBookById(bookId);
    if (targetBook) {
      setSelectedBook(targetBook);
      setSelectedChapter(chapter);
      updateSlot0(targetBook.id, chapter);
      setVerseFilter('all');
      setIsPortalOpen(false);
      setResumedNotice(false);
      if (studyCount > 1) {
        setStudyCount(1);
      }
      persistPosition(targetBook.id, chapter);
      if (verseNumber) {
        setPendingScrollVerse(verseNumber);
      } else {
        setPendingScrollVerse(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-sepia');

    if (theme === 'night') {
      root.classList.add('dark');
    } else if (theme === 'sepia') {
      root.classList.add('theme-sepia');
    }
  }, [theme]);

  // Load Chapter Data (Bundled Offline -> IndexedDB Offline -> Network + Cache)
  const loadChapter = useCallback(
    async (book: BibleBook, chapterNum: number) => {
      setIsLoading(true);
      setLoadedFromOffline(false);
      try {
        const res = await loadChapterWithCache(book, chapterNum, refreshCachedCount);
        setChapterData(res.chapter);
        setLoadedFromOffline(res.fromOffline);
      } finally {
        setIsLoading(false);
      }
    },
    [refreshCachedCount]
  );

  useEffect(() => {
    loadChapter(selectedBook, selectedChapter);
  }, [selectedBook, selectedChapter, loadChapter]);

  // Smoothly scroll to a specific verse after navigating from AnnotationsModal
  useEffect(() => {
    if (
      pendingScrollVerse !== null &&
      !isLoading &&
      !isPortalOpen &&
      chapterData &&
      chapterData.bookId === selectedBook.id &&
      chapterData.chapterNumber === selectedChapter
    ) {
      const timer = window.setTimeout(() => {
        const el = document.getElementById(`verse-${pendingScrollVerse}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setPendingScrollVerse(null);
      }, 120);
      return () => window.clearTimeout(timer);
    }
  }, [pendingScrollVerse, isLoading, isPortalOpen, chapterData, selectedBook.id, selectedChapter]);

  // Download all chapters of current book for offline reading
  const handleDownloadBookOffline = async () => {
    if (isDownloadingBook || !navigator.onLine) return;
    setIsDownloadingBook(true);
    const total = selectedBook.chaptersCount;
    try {
      for (let c = 1; c <= total; c++) {
        setDownloadProgress(`${c}/${total}`);
        const existing = await getChapterOffline(selectedBook.id, c);
        if (existing && existing.verses.length > 1) continue;
        const res = await fetch(`/api/scriptures/chapter?book=${selectedBook.id}&chapter=${c}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.chapter?.verses?.length > 0) {
            await saveChapterOffline(selectedBook.id, c, data.chapter);
          }
        }
      }
      await refreshCachedCount();
      setLoadedFromOffline(true);
    } catch (e) {
      console.warn('Download book offline error:', e);
    } finally {
      setIsDownloadingBook(false);
      setDownloadProgress('');
    }
  };

  // Navigation handlers
  const handlePrevChapter = () => {
    setVerseFilter('all');
    if (selectedChapter > 1) {
      const nextChap = selectedChapter - 1;
      setSelectedChapter(nextChap);
      updateSlot0(selectedBook.id, nextChap);
      persistPosition(selectedBook.id, nextChap);
    } else {
      const currentIndex = BIBLE_BOOKS.findIndex((b) => b.id === selectedBook.id);
      if (currentIndex > 0) {
        const prevBook = BIBLE_BOOKS[currentIndex - 1];
        setSelectedBook(prevBook);
        setSelectedChapter(prevBook.chaptersCount);
        updateSlot0(prevBook.id, prevBook.chaptersCount);
        persistPosition(prevBook.id, prevBook.chaptersCount);
      }
    }
  };

  const handleNextChapter = () => {
    setVerseFilter('all');
    if (selectedChapter < selectedBook.chaptersCount) {
      const nextChap = selectedChapter + 1;
      setSelectedChapter(nextChap);
      updateSlot0(selectedBook.id, nextChap);
      persistPosition(selectedBook.id, nextChap);
    } else {
      const currentIndex = BIBLE_BOOKS.findIndex((b) => b.id === selectedBook.id);
      if (currentIndex < BIBLE_BOOKS.length - 1) {
        const nextBook = BIBLE_BOOKS[currentIndex + 1];
        setSelectedBook(nextBook);
        setSelectedChapter(1);
        updateSlot0(nextBook.id, 1);
        persistPosition(nextBook.id, 1);
      }
    }
  };

  const handleSelectBookChapter = (book: BibleBook, chapter: number) => {
    setVerseFilter('all');
    setSelectedBook(book);
    setSelectedChapter(chapter);
    updateSlot0(book.id, chapter);
    persistPosition(book.id, chapter);
  };

  const currentBookName =
    chineseVariant === 'traditional'
      ? selectedBook.chineseTraditional
      : selectedBook.chineseSimplified;

  const diffCount = chapterData?.verses.filter((v) => v.isDiffFromKjv).length || 0;
  const jstOnlyCount =
    chapterData?.verses.filter((v) => v.alignmentType === 'jst-only' || (!v.chineseCunp && !v.kjvText)).length || 0;
  const kjvBaseCount = chapterData?.kjvVerseCount || (chapterData ? chapterData.verses.length - jstOnlyCount : 0);

  const displayedVerses =
    chapterData?.verses.filter((v) => {
      if (verseFilter === 'all') return true;
      if (verseFilter === 'has-annotation') return chapterAnnotations.has(v.verseNumber);
      return v.isDiffFromKjv || v.alignmentType === 'jst-only' || v.alignmentType === 'jst-expanded';
    }) || [];

  // If Testament Selection Portal is active (First Page)
  if (isPortalOpen) {
    return (
      <>
        <TestamentSelectionPortal
          onSelectBookChapter={handleSelectBookChapterFromPortal}
          chineseVariant={chineseVariant}
          savedPosition={getSavedPosition()}
          onReturnToReader={() => setIsPortalOpen(false)}
          canReturnToReader={Boolean(saved || initialDone)}
          onOpenAnnotations={() => setIsAnnotationsModalOpen(true)}
          annotationsCount={annotationsCount}
        />
        <AnnotationsModal
          isOpen={isAnnotationsModalOpen}
          onClose={() => setIsAnnotationsModalOpen(false)}
          onNavigateScripture={handleNavigateScripture}
        />
        <OfflineIndicator />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors pb-24 md:pb-12">
      {/* Top Navigation */}
      <Header
        currentBook={selectedBook}
        currentChapter={selectedChapter}
        onOpenTestamentPortal={handleOpenTestamentPortal}
        onOpenBookSelector={() => handleOpenBookModalForPane(0, studyCount === 1)}
        onOpenPromptStudio={() => setIsPromptStudioOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSources={() => setIsSourcesOpen(true)}
        onOpenPersonExplorer={() => setIsPersonModalOpen(true)}
        onOpenAnnotations={() => setIsAnnotationsModalOpen(true)}
        annotationsCount={annotationsCount}
        theme={theme}
        diffHighlight={diffHighlight}
        onToggleDiffHighlight={() => setDiffHighlight(!diffHighlight)}
      />

      {/* Main Content Area */}
      <main
        className={`flex-1 mx-auto w-full px-4 sm:px-6 pt-5 ${
          studyCount >= 3 ? 'max-w-[1680px]' : 'max-w-7xl'
        }`}
      >
        {/* Multi-Book Simultaneous Study Selector Bar (1, 2, 3, or 4 Books) */}
        <section
          aria-label="同時研讀卷數選擇列"
          className="mb-4 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 whitespace-nowrap shrink-0">
              <Columns2 className="w-4 h-4 text-amber-800 dark:text-amber-400" />
              <span>同時顯示書卷數：</span>
            </div>

            <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg text-xs font-medium">
              {([1, 2, 3, 4] as const).map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => handleChangeStudyCount(cnt)}
                  className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                    studyCount === cnt
                      ? 'bg-amber-900 text-white dark:bg-amber-700 font-semibold shadow-2xs'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  {cnt} 卷
                </button>
              ))}
            </div>

            {studyCount > 1 && (
              <button
                type="button"
                onClick={() => handleOpenBookModalForPane(0, false)}
                className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                挑選並設定各卷書目
              </button>
            )}
          </div>

          {/* Quick Cross-Reference Study Presets when 2+ books or quick launch */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs whitespace-nowrap">
            <span className="text-stone-400 text-[11px] font-medium shrink-0">交叉對讀推薦：</span>
            <button
              type="button"
              onClick={() =>
                applyStudyPreset([
                  { bookId: 'GEN', chapter: 1 },
                  { bookId: 'JHN', chapter: 1 },
                ])
              }
              className="px-2.5 py-1 rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/70 hover:border-amber-500 text-stone-700 dark:text-stone-200 font-medium transition-colors shrink-0"
            >
              2卷：創世記1 + 約翰1
            </button>
            <button
              type="button"
              onClick={() =>
                applyStudyPreset([
                  { bookId: 'GEN', chapter: 1 },
                  { bookId: 'JHN', chapter: 1 },
                  { bookId: 'MAT', chapter: 5 },
                ])
              }
              className="px-2.5 py-1 rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/70 hover:border-amber-500 text-stone-700 dark:text-stone-200 font-medium transition-colors shrink-0"
            >
              3卷：創1 + 約1 + 太5
            </button>
            <button
              type="button"
              onClick={() =>
                applyStudyPreset([
                  { bookId: 'GEN', chapter: 14 },
                  { bookId: 'GEN', chapter: 50 },
                  { bookId: 'MAT', chapter: 5 },
                  { bookId: 'JAS', chapter: 1 },
                ])
              }
              className="px-2.5 py-1 rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/70 hover:border-amber-500 text-stone-700 dark:text-stone-200 font-medium transition-colors shrink-0"
            >
              4卷：創14 + 創50 + 太5 + 雅1
            </button>
          </div>
        </section>
        {/* Resumed Progress Toast / Notice */}
        {resumedNotice && (
          <aside
            aria-label="閱讀進度恢復提示"
            className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                歡迎回來！已為您自動恢復上次閱讀位置：
                <strong className="ml-1 font-serif">
                  {currentBookName} 第 {selectedChapter} 章
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleOpenTestamentPortal}
                className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-stone-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-stone-700 rounded-lg border border-amber-200 dark:border-stone-700 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>返回選新舊約</span>
              </button>
              <button
                onClick={() => setResumedNotice(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-0.5"
                title="關閉提示"
              >
                ✕
              </button>
            </div>
          </aside>
        )}

        {studyCount > 1 ? (
          /* MULTI-BOOK STUDY MODE (2, 3, or 4 Books Side-by-Side) */
          <div className="space-y-4">
            {/* Mobile / Tablet Pane Switcher */}
            <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setMobileFocusPane('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 border transition-colors ${
                  mobileFocusPane === 'all'
                    ? 'bg-amber-900 text-white border-amber-900'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                全部顯示 ({studyCount})
              </button>
              {studySlots.slice(0, studyCount).map((slot, idx) => {
                const slotBook = getBookById(slot.bookId) || selectedBook;
                const label =
                  chineseVariant === 'traditional'
                    ? slotBook.chineseTraditional
                    : slotBook.chineseSimplified;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMobileFocusPane(idx)}
                    className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 border transition-colors whitespace-nowrap ${
                      mobileFocusPane === idx
                        ? 'bg-amber-900 text-white border-amber-900'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {idx + 1}. {label} {slot.chapter}
                  </button>
                );
              })}
            </div>

            <div
              className={`grid gap-4 items-start ${
                studyCount === 2
                  ? 'grid-cols-1 md:grid-cols-2'
                  : studyCount === 3
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-4'
              }`}
            >
              {studySlots.slice(0, studyCount).map((slot, idx) => {
                if (mobileFocusPane !== 'all' && mobileFocusPane !== idx) {
                  return null;
                }
                const paneBook = getBookById(slot.bookId) || selectedBook;
                return (
                  <StudyPane
                    key={`pane-${idx}`}
                    paneIndex={idx}
                    totalPanes={studyCount}
                    book={paneBook}
                    chapter={slot.chapter}
                    fontSize={fontSize}
                    chineseVariant={chineseVariant}
                    diffHighlight={diffHighlight}
                    onChangeBookChapter={(nextBook, nextChap) =>
                      handleSelectForSlot(idx, nextBook, nextChap)
                    }
                    onOpenBookPicker={() => handleOpenBookModalForPane(idx, true)}
                    onPromoteToSingle={() => handlePromotePaneToSingle(idx)}
                    onClosePane={() => handleClosePane(idx)}
                    onCacheUpdated={refreshCachedCount}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          /* SINGLE BOOK STUDY MODE (Original Full Focus View) */
          <>
            {/* Chapter Header Banner */}
            <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xs mb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-400 mb-1 flex-wrap">
                    <span>{selectedBook.testament === 'NT' ? '新約聖經 New Testament' : '舊約聖經 Old Testament'}</span>
                    <span>·</span>
                    <span>全書共 {selectedBook.chaptersCount} 章</span>
                    {chapterData && (
                      <>
                        <span>·</span>
                        {jstOnlyCount > 0 ? (
                          <span className="text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 border border-amber-300/70 dark:border-amber-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <PlusCircle className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                            KJV/和合本 {kjvBaseCount} 節 · JST 共 {chapterData.verses.length} 節 (含 +{jstOnlyCount} 節 JST 獨有增補)
                          </span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-bold">
                            本章全 {chapterData.verses.length} 節完整並行展示
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 dark:text-stone-100 flex items-center gap-3">
                    <span>
                      {currentBookName} 第 {selectedChapter} 章
                    </span>
                    <span className="text-sm font-sans font-normal text-stone-500">
                      {selectedBook.name} {selectedChapter}
                    </span>
                  </h1>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>每節經文依序展示：</span>
                    <span className="text-red-700 dark:text-red-400 font-medium">① 中文和合本 (bible.com)</span>
                    <span>→</span>
                    <span className="text-blue-700 dark:text-blue-400 font-medium">② KSV / KJV (教會聖經庫)</span>
                    <span>→</span>
                    <span className="text-amber-700 dark:text-amber-400 font-medium">③ JST 靈感譯本 (centerplace.org)</span>
                    <span>→</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">④ JST 谷歌翻譯中文</span>
                  </p>
                </div>

                {/* Quick Actions & Navigation Bar */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={handleOpenTestamentPortal}
                    className="px-3 py-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    title="返回第一頁選擇舊約或新約"
                  >
                    <Library className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                    <span>返回選新舊約</span>
                  </button>

                  <button
                    onClick={handlePrevChapter}
                    className="p-2 sm:px-3 sm:py-2 border border-stone-200 dark:border-stone-700 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors flex items-center gap-1 text-xs font-semibold"
                    title="上一章 Previous Chapter"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">上一章</span>
                  </button>

                  <button
                    onClick={() => handleOpenBookModalForPane(0, true)}
                    className="px-3.5 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400" />
                    <span>換卷 / 選章</span>
                  </button>

                  <button
                    onClick={handleNextChapter}
                    className="p-2 sm:px-3 sm:py-2 border border-stone-200 dark:border-stone-700 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors flex items-center gap-1 text-xs font-semibold"
                    title="下一章 Next Chapter"
                  >
                    <span className="hidden sm:inline">下一章</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Source Links Strip & Offline Cache / Difference Count Indicator */}
              <div className="mt-4 pt-3.5 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="text-stone-400 font-medium">官方來源網址：</span>
                  <a
                    href={
                      chapterData?.sourceUrls.bibleComChinese ||
                      `https://www.bible.com/bible/46/${selectedBook.bibleComCode}.${selectedChapter}.CUNP-%E7%A5%9E`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-stone-600 dark:text-stone-300 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 hover:underline"
                  >
                    <span>Bible.com 和合本 (CUNP)</span>
                    <ExternalLink className="w-3 h-3 text-stone-400" />
                  </a>
                  <span className="text-stone-300 dark:text-stone-700">·</span>
                  <a
                    href={
                      chapterData?.sourceUrls.churchKjv ||
                      `https://www.churchofjesuschrist.org/study/scriptures/${selectedBook.churchSlug}/${selectedChapter}?lang=eng`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-stone-600 dark:text-stone-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 hover:underline"
                  >
                    <span>教會 KSV 聖經庫</span>
                    <ExternalLink className="w-3 h-3 text-stone-400" />
                  </a>
                  <span className="text-stone-300 dark:text-stone-700">·</span>
                  <a
                    href={chapterData?.sourceUrls.centerplaceJst || 'https://www.centerplace.org/hs/iv/default.htm'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 hover:underline"
                  >
                    <span>CenterPlace JST 靈感本</span>
                    <ExternalLink className="w-3 h-3 text-stone-400" />
                  </a>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="sm:hidden">
                    <CloudSyncButton compact />
                  </div>

                  <button
                    onClick={() => setIsAnnotationsModalOpen(true)}
                    className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="查看跨裝置標記與筆記總覽"
                  >
                    <Highlighter className="w-3 h-3" />
                    <span>我的標記總覽 ({annotationsCount})</span>
                  </button>

                  {/* Offline Status & Book Cache Action */}
                  <button
                    onClick={handleDownloadBookOffline}
                    disabled={isDownloadingBook}
                    className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60"
                    title="點擊下載整卷經文至本機 IndexedDB，完全離線亦可隨時閱讀"
                  >
                    {isDownloadingBook ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>儲存全卷離線中 {downloadProgress}</span>
                      </>
                    ) : (
                      <>
                        <HardDriveDownload className="w-3 h-3" />
                        <span>
                          {loadedFromOffline ? '本章已可離線閱讀' : '離線下載本書'} (書庫共 {cachedCount} 章)
                        </span>
                      </>
                    )}
                  </button>

                  {chapterAnnotations.size > 0 && (
                    <button
                      onClick={() =>
                        setVerseFilter((prev) => (prev === 'has-annotation' ? 'all' : 'has-annotation'))
                      }
                      className={`border rounded-md px-2.5 py-1 text-xs font-semibold flex items-center gap-1 transition-colors ${
                        verseFilter === 'has-annotation'
                          ? 'bg-indigo-700 text-white border-indigo-700'
                          : 'text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-100'
                      }`}
                      title="篩選僅顯示含有螢光標記或個人筆記的經文"
                    >
                      <Highlighter className="w-3 h-3" />
                      <span>
                        {verseFilter === 'has-annotation'
                          ? `僅顯示標記/筆記 (${chapterAnnotations.size}節) · 點此顯示全部`
                          : `本章含 ${chapterAnnotations.size} 節標記/筆記`}
                      </span>
                    </button>
                  )}

                  {diffCount > 0 && (
                    <button
                      onClick={() =>
                        setVerseFilter((prev) => (prev === 'jst-only-or-diff' ? 'all' : 'jst-only-or-diff'))
                      }
                      className={`border rounded-md px-2.5 py-1 text-xs font-semibold flex items-center gap-1 transition-colors ${
                        verseFilter === 'jst-only-or-diff'
                          ? 'bg-amber-800 text-white border-amber-800'
                          : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100'
                      }`}
                      title="點擊篩選僅顯示 JST 修訂與獨有增補經文"
                    >
                      <Filter className="w-3 h-3" />
                      <span>
                        {verseFilter === 'jst-only-or-diff'
                          ? `僅顯示 JST 修訂/增補 (${diffCount}節) · 點此顯示全部`
                          : `含 ${diffCount} 節 JST 修訂${jstOnlyCount > 0 ? ` (+${jstOnlyCount} 獨有節)` : ''}`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* JST Extra Verses Explanation Callout (shown when chapter has JST-only additions) */}
            {jstOnlyCount > 0 && (
              <section className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/70 text-xs text-amber-950 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-amber-800 dark:text-amber-400" />
                    <span>
                      本章包含 {jstOnlyCount} 節「JST 靈感譯本獨有增補經文」(KJV 與和合本共 {kjvBaseCount} 節，JST 延伸至第 {chapterData?.verses.length} 節)
                    </span>
                  </div>
                  <p className="text-amber-900/85 dark:text-amber-300/90 leading-relaxed">
                    凡與 KJV 及和合本共同存在的節次，會四欄並列顯示；若為 KJV 與和合本未收錄的 JST 獨有增補節次，系統將自動切換為「JST 獨立雙語版 (Standalone)」，僅呈現 JST 英文原文與 JST 谷歌翻譯中文版。
                  </p>
                </div>
                <button
                  onClick={() =>
                    setVerseFilter((prev) => (prev === 'all' ? 'jst-only-or-diff' : 'all'))
                  }
                  className="px-3 py-1.5 bg-amber-900 hover:bg-amber-800 text-white rounded-xl font-bold text-xs shrink-0 transition-colors"
                >
                  {verseFilter === 'all' ? '只看 JST 增補與修訂節' : '顯示全章全部經文'}
                </button>
              </section>
            )}

            {/* Biblical Person Search & Exploration Banner */}
            <section className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-amber-50/90 dark:bg-stone-900 border border-amber-200/90 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-900 text-amber-100 dark:bg-amber-700 dark:text-stone-100 flex items-center justify-center shrink-0 shadow-xs font-serif font-bold text-sm">
                  人
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                      聖經人物故事與經文索引 (Biblical Figures Explorer)
                    </span>
                    <span className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.2 rounded-xs font-medium">
                      中英文雙語查經
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                    輸入中英文姓名（如: 摩西 Moses, 約翰 John, 亞伯拉罕 Abraham, 保羅 Paul）即查生平事蹟、重大事件與重要經文
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPersonModalOpen(true)}
                className="px-3.5 py-2 bg-amber-900 hover:bg-amber-800 dark:bg-amber-700 dark:hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span>查閱人物生平與經文</span>
              </button>
            </section>

            {/* Callout Banner: Mobile App Prompt Generator */}
            <section className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-900 via-amber-800 to-stone-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-700 text-white flex items-center justify-center">
                    <Smartphone className="w-3.5 h-3.5" />
                  </span>
                  <h2 className="font-bold text-sm sm:text-base">
                    已準備好為行動 App 開發生成完整提示詞 (System Prompt)
                  </h2>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed max-w-2xl">
                  依據您所指定的 3 大來源（教會 KSV、CenterPlace JST、Bible.com 中文）與兩大語言次序，隨時生成
                  Flutter、React Native、Swift 或 Kotlin 行動端 App 的完整代碼提示詞與離線資料庫規範。
                </p>
              </div>
              <button
                onClick={() => setIsPromptStudioOpen(true)}
                className="px-4 py-2.5 bg-white text-amber-900 hover:bg-amber-50 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-800" />
                <span>開啟行動端 Prompt 工坊</span>
              </button>
            </section>

            {/* Verse Jump Carousel */}
            {chapterData && chapterData.verses.length > 3 && (
              <div className="mb-4 flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
                <span className="text-stone-400 font-semibold shrink-0 flex items-center gap-1 text-[11px]">
                  <Bookmark className="w-3 h-3" />
                  跳至節數：
                </span>
                {chapterData.verses.map((v) => {
                  const isJstAddition = v.alignmentType === 'jst-only' || (!v.chineseCunp && !v.kjvText);
                  const verseAnn = chapterAnnotations.get(v.verseNumber);
                  const hasAnnotation = Boolean(verseAnn);
                  const colorMeta =
                    verseAnn && verseAnn.highlightColor !== 'none'
                      ? HIGHLIGHT_COLOR_CONFIG[verseAnn.highlightColor]
                      : null;
                  return (
                    <a
                      key={v.verseNumber}
                      href={`#verse-${v.verseNumber}`}
                      title={
                        hasAnnotation
                          ? `第 ${v.verseNumber} 節 (已標記/筆記)`
                          : isJstAddition
                          ? `第 ${v.verseNumber} 節 (JST 獨有增補)`
                          : `跳至第 ${v.verseNumber} 節`
                      }
                      className={`relative min-w-7 h-7 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center shrink-0 border transition-all ${
                        isJstAddition
                          ? 'bg-amber-800 border-amber-700 text-white'
                          : v.isDiffFromKjv
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-amber-500'
                      } ${hasAnnotation ? 'ring-2 ring-indigo-500/70 dark:ring-indigo-400/70' : ''}`}
                    >
                      {colorMeta && (
                        <span
                          className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white dark:border-stone-900 ${colorMeta.swatchClass}`}
                        />
                      )}
                      {v.verseNumber}
                      {isJstAddition ? '+' : ''}
                    </a>
                  );
                })}
              </div>
            )}

            {/* Verses Container */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-500">
                <Loader2 className="w-8 h-8 animate-spin text-amber-800 dark:text-amber-400" />
                <span className="text-sm font-serif">載入四部並行聖經經文中...</span>
                <span className="text-xs text-stone-400">
                  整合 Bible.com 和合本、教會 KSV、CenterPlace JST 與中文翻譯
                </span>
              </div>
            ) : displayedVerses.length > 0 ? (
              <div className="space-y-4">
                {displayedVerses.map((verse) => (
                  <VerseCard
                    key={verse.verseNumber}
                    verse={verse}
                    bookId={chapterData!.bookId}
                    bookName={chapterData!.bookName}
                    chineseBookName={chapterData!.chineseBookName}
                    chapterNumber={chapterData!.chapterNumber}
                    sourceUrls={chapterData!.sourceUrls}
                    fontSize={fontSize}
                    diffHighlight={diffHighlight}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-stone-500 space-y-2">
                <p>未找到符合篩選條件的經文數據。</p>
                <button
                  onClick={() => {
                    setVerseFilter('all');
                    loadChapter(selectedBook, selectedChapter);
                  }}
                  className="px-4 py-2 bg-amber-900 text-white rounded-lg text-xs font-semibold"
                >
                  顯示全部經文
                </button>
              </div>
            )}

            {/* Bottom Chapter Switcher */}
            {chapterData && chapterData.verses.length > 0 && (
              <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <button
                  onClick={handlePrevChapter}
                  className="px-4 py-2.5 border border-stone-300 dark:border-stone-700 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>上一章</span>
                </button>

                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline"
                >
                  回到頂部 ↑
                </button>

                <button
                  onClick={handleNextChapter}
                  className="px-4 py-2.5 bg-amber-900 hover:bg-amber-800 dark:bg-amber-700 dark:hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>下一章</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500 dark:text-stone-400">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p>
            雙語四部並行聖經對照庫 · 聚合 Bible.com (CUNP) · Church of Jesus Christ (KSV) · CenterPlace (JST) · Google Translate
          </p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500">
            支援 PWA 離線安裝閱讀與 IndexedDB 經文快取 · 旨在便利華語聖經研讀者深入了解約瑟·斯密靈感譯本。
          </p>
        </div>
      </footer>

      {/* Offline Connectivity Banner */}
      <OfflineIndicator />

      {/* Floating Scroll-to-Top / Book Picker & Prev/Next Chapter Controls */}
      <FloatingStudyControls
        currentBook={selectedBook}
        currentChapter={selectedChapter}
        chineseVariant={chineseVariant}
        studyCount={studyCount}
        onScrollTopOnly={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onScrollTopAndSelectBook={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          handleOpenBookModalForPane(0, studyCount === 1);
        }}
        onPrevChapter={() => {
          handlePrevChapter();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNextChapter={() => {
          handleNextChapter();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentBook={selectedBook}
        currentChapter={selectedChapter}
        onOpenTestamentPortal={handleOpenTestamentPortal}
        onOpenBookSelector={() => handleOpenBookModalForPane(0, studyCount === 1)}
        onOpenPromptStudio={() => setIsPromptStudioOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPersonExplorer={() => setIsPersonModalOpen(true)}
        onOpenAnnotations={() => setIsAnnotationsModalOpen(true)}
        annotationsCount={annotationsCount}
        diffHighlight={diffHighlight}
        onToggleDiffHighlight={() => setDiffHighlight(!diffHighlight)}
      />

      {/* Modals */}
      <BookChapterModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        selectedBook={selectedBook}
        selectedChapter={selectedChapter}
        onSelect={handleSelectBookChapter}
        chineseVariant={chineseVariant}
        studyCount={studyCount}
        onChangeStudyCount={handleChangeStudyCount}
        studySlots={studySlots}
        activeSlotIndex={activeModalSlotIndex}
        onChangeActiveSlot={setActiveModalSlotIndex}
        onSelectForSlot={handleSelectForSlot}
        closeOnPick={modalCloseOnPick}
      />

      <PromptStudioModal
        isOpen={isPromptStudioOpen}
        onClose={() => setIsPromptStudioOpen(false)}
        selectedBookId={selectedBook.id}
        selectedChapter={selectedChapter}
      />

      <ReaderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
        chineseVariant={chineseVariant}
        setChineseVariant={setChineseVariant}
        viewMode={viewMode}
        setViewMode={setViewMode}
        diffHighlight={diffHighlight}
        setDiffHighlight={setDiffHighlight}
      />

      <SourcesInfoModal
        isOpen={isSourcesOpen}
        onClose={() => setIsSourcesOpen(false)}
      />

      <BiblicalPersonModal
        isOpen={isPersonModalOpen}
        onClose={() => setIsPersonModalOpen(false)}
        onNavigateScripture={handleNavigateScripture}
      />

      <AnnotationsModal
        isOpen={isAnnotationsModalOpen}
        onClose={() => setIsAnnotationsModalOpen(false)}
        onNavigateScripture={handleNavigateScripture}
      />
    </div>
  );
}
