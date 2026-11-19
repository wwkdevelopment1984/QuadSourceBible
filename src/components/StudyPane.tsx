import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Loader2,
  Maximize2,
  X,
} from 'lucide-react';
import {
  BibleBook,
  ChapterData,
  ChineseVariant,
  FontSize,
} from '../types/scripture';
import { BIBLE_BOOKS } from '../data/bibleBooks';
import { loadChapterWithCache } from '../utils/chapterLoader';
import { HIGHLIGHT_COLOR_CONFIG } from '../utils/annotations';
import { useAnnotations } from '../contexts/AnnotationsContext';
import { VerseCard } from './VerseCard';

export interface StudyPaneConfig {
  bookId: string;
  chapter: number;
}

interface StudyPaneProps {
  paneIndex: number;
  totalPanes: number;
  book: BibleBook;
  chapter: number;
  fontSize: FontSize;
  chineseVariant: ChineseVariant;
  diffHighlight: boolean;
  onChangeBookChapter: (book: BibleBook, chapter: number) => void;
  onOpenBookPicker: () => void;
  onPromoteToSingle: () => void;
  onClosePane: () => void;
  onCacheUpdated: () => void;
}

export const StudyPane: React.FC<StudyPaneProps> = ({
  paneIndex,
  totalPanes,
  book,
  chapter,
  fontSize,
  chineseVariant,
  diffHighlight,
  onChangeBookChapter,
  onOpenBookPicker,
  onPromoteToSingle,
  onClosePane,
  onCacheUpdated,
}) => {
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fromOffline, setFromOffline] = useState<boolean>(false);
  const [verseFilter, setVerseFilter] = useState<'all' | 'jst-only-or-diff' | 'has-annotation'>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { getChapterAnnotatedVerses } = useAnnotations();
  const chapterAnnotations = getChapterAnnotatedVerses(book.id, chapter);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setVerseFilter('all');

    loadChapterWithCache(book, chapter, onCacheUpdated).then((res) => {
      if (cancelled) return;
      setChapterData(res.chapter);
      setFromOffline(res.fromOffline);
      setIsLoading(false);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [book, chapter, onCacheUpdated]);

  const handlePrevChapter = () => {
    if (chapter > 1) {
      onChangeBookChapter(book, chapter - 1);
    } else {
      const idx = BIBLE_BOOKS.findIndex((b) => b.id === book.id);
      if (idx > 0) {
        const prevBook = BIBLE_BOOKS[idx - 1];
        onChangeBookChapter(prevBook, prevBook.chaptersCount);
      }
    }
  };

  const handleNextChapter = () => {
    if (chapter < book.chaptersCount) {
      onChangeBookChapter(book, chapter + 1);
    } else {
      const idx = BIBLE_BOOKS.findIndex((b) => b.id === book.id);
      if (idx < BIBLE_BOOKS.length - 1) {
        const nextBook = BIBLE_BOOKS[idx + 1];
        onChangeBookChapter(nextBook, 1);
      }
    }
  };

  const scrollToVerseInPane = (verseNum: number) => {
    const el = document.getElementById(`pane-${paneIndex}-verse-${verseNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const bookDisplayName =
    chineseVariant === 'traditional' ? book.chineseTraditional : book.chineseSimplified;

  const diffCount = chapterData?.verses.filter((v) => v.isDiffFromKjv).length || 0;
  const displayedVerses =
    chapterData?.verses.filter((v) => {
      if (verseFilter === 'all') return true;
      if (verseFilter === 'has-annotation') return chapterAnnotations.has(v.verseNumber);
      return v.isDiffFromKjv || v.alignmentType === 'jst-only' || v.alignmentType === 'jst-expanded';
    }) || [];

  return (
    <section
      aria-label={`研讀窗格 ${paneIndex + 1}: ${bookDisplayName} 第 ${chapter} 章`}
      className="flex flex-col bg-stone-50/70 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs"
    >
      {/* Pane Header */}
      <div className="px-3.5 py-3 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-amber-900 text-amber-50 dark:bg-amber-700 text-xs font-bold font-mono tabular-nums flex items-center justify-center shrink-0">
              {paneIndex + 1}
            </span>
            <div className="min-w-0">
              <button
                onClick={onOpenBookPicker}
                className="text-left group flex items-center gap-1.5 min-w-0"
                title="點擊更換此窗格的經卷與章數"
              >
                <span className="font-serif font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-400 truncate">
                  {bookDisplayName} {chapter}章
                </span>
                <BookOpen className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
              </button>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 truncate">
                <span className="truncate">{book.name} {chapter}</span>
                {chapterData && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums shrink-0">{chapterData.verses.length}節</span>
                  </>
                )}
                {fromOffline && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-700 dark:text-emerald-400 shrink-0">離線就緒</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handlePrevChapter}
              className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
              title="上一章"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenBookPicker}
              className="px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              title="更換此窗格卷目或章數"
            >
              換卷/章
            </button>
            <button
              onClick={handleNextChapter}
              className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
              title="下一章"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onPromoteToSingle}
              className="p-1.5 rounded-lg text-stone-500 hover:text-amber-900 dark:hover:text-amber-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="放大為單卷專注模式"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            {totalPanes > 1 && (
              <button
                onClick={onClosePane}
                className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                title="關閉此研讀窗格"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Segmented Filter + Compact Verse Jump Row */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-100 dark:border-stone-800/80">
          <div className="flex items-center gap-1 p-0.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-[11px] font-medium shrink-0">
            <button
              onClick={() => setVerseFilter('all')}
              className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
                verseFilter === 'all'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              全部
            </button>
            {diffCount > 0 && (
              <button
                onClick={() =>
                  setVerseFilter((prev) => (prev === 'jst-only-or-diff' ? 'all' : 'jst-only-or-diff'))
                }
                className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
                  verseFilter === 'jst-only-or-diff'
                    ? 'bg-amber-800 text-white font-semibold'
                    : 'text-amber-800 dark:text-amber-300'
                }`}
              >
                JST ({diffCount})
              </button>
            )}
            {chapterAnnotations.size > 0 && (
              <button
                onClick={() =>
                  setVerseFilter((prev) => (prev === 'has-annotation' ? 'all' : 'has-annotation'))
                }
                className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
                  verseFilter === 'has-annotation'
                    ? 'bg-indigo-700 text-white font-semibold'
                    : 'text-indigo-700 dark:text-indigo-300'
                }`}
              >
                標記 ({chapterAnnotations.size})
              </button>
            )}
          </div>

          {chapterData && chapterData.verses.length > 3 && (
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 text-[11px]">
              {chapterData.verses.map((v) => {
                const verseAnn = chapterAnnotations.get(v.verseNumber);
                const colorMeta =
                  verseAnn && verseAnn.highlightColor !== 'none'
                    ? HIGHLIGHT_COLOR_CONFIG[verseAnn.highlightColor]
                    : null;
                return (
                  <button
                    key={v.verseNumber}
                    type="button"
                    onClick={() => scrollToVerseInPane(v.verseNumber)}
                    className={`relative min-w-6 h-6 px-1 rounded-md font-mono tabular-nums font-semibold shrink-0 border transition-colors ${
                      v.isDiffFromKjv
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-amber-500'
                    } ${verseAnn ? 'ring-1 ring-indigo-500' : ''}`}
                    title={`跳至第 ${v.verseNumber} 節`}
                  >
                    {colorMeta && (
                      <span
                        className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${colorMeta.swatchClass}`}
                      />
                    )}
                    {v.verseNumber}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Independent Scrollable Verses Viewport */}
      <div
        ref={scrollContainerRef}
        className={`p-3 space-y-3 ${
          totalPanes >= 2 ? 'lg:h-[calc(100vh-230px)] lg:overflow-y-auto' : ''
        }`}
      >
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-stone-500">
            <Loader2 className="w-6 h-6 animate-spin text-amber-800 dark:text-amber-400" />
            <span className="text-xs font-serif">載入 {bookDisplayName} {chapter}章...</span>
          </div>
        ) : displayedVerses.length > 0 && chapterData ? (
          displayedVerses.map((verse) => (
            <VerseCard
              key={`${book.id}-${chapter}-${verse.verseNumber}`}
              verse={verse}
              bookId={chapterData.bookId}
              bookName={chapterData.bookName}
              chineseBookName={chapterData.chineseBookName}
              chapterNumber={chapterData.chapterNumber}
              sourceUrls={chapterData.sourceUrls}
              fontSize={fontSize}
              diffHighlight={diffHighlight}
              viewMode="cards"
              anchorId={`pane-${paneIndex}-verse-${verse.verseNumber}`}
            />
          ))
        ) : (
          <div className="py-12 text-center text-xs text-stone-500 space-y-2">
            <p>目前篩選條件下無經文。</p>
            <button
              onClick={() => setVerseFilter('all')}
              className="px-3 py-1.5 bg-amber-900 text-white rounded-lg text-xs font-semibold"
            >
              顯示本章全部經文
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
