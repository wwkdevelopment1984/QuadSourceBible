import React, { useState, useEffect } from 'react';
import { X, Search, ChevronRight, Bookmark, Columns2, Check } from 'lucide-react';
import { BibleBook, Testament, ChineseVariant } from '../types/scripture';
import { BIBLE_BOOKS, getBookById } from '../data/bibleBooks';

export interface ModalStudySlot {
  bookId: string;
  chapter: number;
}

interface BookChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBook: BibleBook;
  selectedChapter: number;
  onSelect: (book: BibleBook, chapter: number) => void;
  chineseVariant: ChineseVariant;
  // Multi-book study props
  studyCount?: 1 | 2 | 3 | 4;
  onChangeStudyCount?: (count: 1 | 2 | 3 | 4) => void;
  studySlots?: ModalStudySlot[];
  activeSlotIndex?: number;
  onChangeActiveSlot?: (index: number) => void;
  onSelectForSlot?: (slotIndex: number, book: BibleBook, chapter: number) => void;
  closeOnPick?: boolean;
}

export const BookChapterModal: React.FC<BookChapterModalProps> = ({
  isOpen,
  onClose,
  selectedBook,
  selectedChapter,
  onSelect,
  chineseVariant,
  studyCount = 1,
  onChangeStudyCount,
  studySlots,
  activeSlotIndex = 0,
  onChangeActiveSlot,
  onSelectForSlot,
  closeOnPick = true,
}) => {
  const [activeTestament, setActiveTestament] = useState<Testament | 'ALL'>('NT');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewStep, setViewStep] = useState<'book' | 'chapter'>('book');
  const [tempBook, setTempBook] = useState<BibleBook>(selectedBook);
  const [localSlotIndex, setLocalSlotIndex] = useState<number>(activeSlotIndex);

  useEffect(() => {
    if (isOpen) {
      setLocalSlotIndex(activeSlotIndex);
      setViewStep('book');
      const slot = studySlots?.[activeSlotIndex];
      const slotBook = slot ? getBookById(slot.bookId) : null;
      setTempBook(slotBook || selectedBook);
    }
  }, [isOpen, activeSlotIndex, studySlots, selectedBook]);

  if (!isOpen) return null;

  const currentSlotIndex = onChangeActiveSlot ? activeSlotIndex : localSlotIndex;
  const currentSlot = studySlots?.[currentSlotIndex];
  const currentSlotBook = (currentSlot && getBookById(currentSlot.bookId)) || selectedBook;
  const currentSlotChapter = currentSlot ? currentSlot.chapter : selectedChapter;

  const handleSlotTabClick = (idx: number) => {
    setLocalSlotIndex(idx);
    onChangeActiveSlot?.(idx);
    setViewStep('book');
    const target = studySlots?.[idx];
    const targetBook = target ? getBookById(target.bookId) : null;
    if (targetBook) setTempBook(targetBook);
  };

  const applySelection = (book: BibleBook, chap: number) => {
    if (studyCount > 1 && onSelectForSlot) {
      onSelectForSlot(currentSlotIndex, book, chap);
      if (closeOnPick) {
        onClose();
        setViewStep('book');
      } else {
        // Stay open so user can configure the next slot seamlessly
        setViewStep('book');
        if (currentSlotIndex + 1 < studyCount) {
          handleSlotTabClick(currentSlotIndex + 1);
        }
      }
    } else {
      onSelect(book, chap);
      onClose();
      setViewStep('book');
    }
  };

  const filteredBooks = BIBLE_BOOKS.filter((book) => {
    const matchesTestament = activeTestament === 'ALL' || book.testament === activeTestament;
    if (!matchesTestament) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      book.name.toLowerCase().includes(q) ||
      book.chineseTraditional.includes(q) ||
      book.chineseSimplified.includes(q) ||
      book.abbreviation.toLowerCase().includes(q) ||
      book.chineseAbbr.includes(q)
    );
  });

  const handleBookClick = (book: BibleBook) => {
    setTempBook(book);
    if (book.chaptersCount === 1) {
      applySelection(book, 1);
    } else {
      setViewStep('chapter');
    }
  };

  const handleChapterClick = (chap: number) => {
    applySelection(tempBook, chap);
  };

  const featuredPassages = [
    { id: 'JHN', chap: 1, label: 'John 1 / 約翰福音 1 (51節)' },
    { id: 'GEN', chap: 50, label: 'Gen 50 / 創世記 50 (+12 JST)' },
    { id: 'GEN', chap: 14, label: 'Gen 14 / 創世記 14 (+16 JST)' },
    { id: 'GEN', chap: 1, label: 'Gen 1 / 創世記 1 (創造)' },
    { id: 'MAT', chap: 5, label: 'Matt 5 / 馬太福音 5 (八福)' },
    { id: 'JAS', chap: 1, label: 'James 1 / 雅各書 1 (27節)' },
  ];

  const getBookLabel = (b: BibleBook) =>
    chineseVariant === 'traditional' ? b.chineseTraditional : b.chineseSimplified;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100 flex items-center gap-2">
              {viewStep === 'book' ? (
                <>
                  <span>
                    {studyCount > 1
                      ? `選擇第 ${currentSlotIndex + 1} 窗格經卷`
                      : '選擇聖經卷目'}
                  </span>
                  <span className="text-xs font-sans text-stone-500 font-normal">
                    Select Book & Chapter
                  </span>
                </>
              ) : (
                <button
                  onClick={() => setViewStep('book')}
                  className="flex items-center gap-1 text-amber-900 dark:text-amber-400 hover:underline"
                >
                  <span>{getBookLabel(tempBook)}</span>
                  <span className="text-xs font-sans font-normal text-stone-500">
                    ({tempBook.name})
                  </span>
                  <ChevronRight className="w-4 h-4" />
                  <span>選擇章節</span>
                </button>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-Book Count & Slot Selector Bar */}
        {onChangeStudyCount && (
          <div className="px-4 py-3 bg-white dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
                <Columns2 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>同時研讀卷數 (Multi-Book Study)：</span>
              </div>
              <div className="flex items-center gap-1 p-0.5 bg-stone-200/70 dark:bg-stone-800 rounded-lg text-xs font-medium">
                {([1, 2, 3, 4] as const).map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => onChangeStudyCount(cnt)}
                    className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap tabular-nums ${
                      studyCount === cnt
                        ? 'bg-amber-900 text-white dark:bg-amber-700 font-semibold shadow-2xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    {cnt} 卷
                  </button>
                ))}
              </div>
            </div>

            {studyCount > 1 && studySlots && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {studySlots.slice(0, studyCount).map((slot, idx) => {
                  const slotBook = getBookById(slot.bookId);
                  const isActive = idx === currentSlotIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSlotTabClick(idx)}
                      className={`px-2.5 py-2 rounded-xl border text-left transition-all ${
                        isActive
                          ? 'border-amber-700 bg-amber-50 dark:bg-amber-950/50 text-amber-950 dark:text-amber-200 ring-1 ring-amber-600/50'
                          : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-amber-400'
                      }`}
                    >
                      <div className="text-[10px] font-semibold text-stone-500 dark:text-stone-400">
                        窗格 {idx + 1}
                      </div>
                      <div className="text-xs font-bold font-serif truncate">
                        {slotBook ? getBookLabel(slotBook) : slot.bookId} {slot.chapter}章
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Quick Featured Passages Bar */}
        <div className="px-4 py-2 bg-amber-50/70 dark:bg-stone-950/60 border-b border-amber-100 dark:border-stone-800/80 flex items-center gap-2 overflow-x-auto text-xs whitespace-nowrap">
          <span className="text-amber-900 dark:text-amber-300 font-semibold flex items-center gap-1 shrink-0">
            <Bookmark className="w-3.5 h-3.5" />
            重點對照章節:
          </span>
          {featuredPassages.map((feat) => {
            const b = BIBLE_BOOKS.find((x) => x.id === feat.id);
            if (!b) return null;
            const isCurrent = currentSlotBook.id === feat.id && currentSlotChapter === feat.chap;
            return (
              <button
                key={`${feat.id}-${feat.chap}`}
                onClick={() => applySelection(b, feat.chap)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  isCurrent
                    ? 'bg-amber-900 text-white dark:bg-amber-700'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-amber-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700'
                }`}
              >
                {feat.label}
              </button>
            );
          })}
        </div>

        {viewStep === 'book' ? (
          <>
            {/* Search and Testament Tabs */}
            <div className="p-4 space-y-3 border-b border-stone-200 dark:border-stone-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋卷名 (如: 約翰, 創世記, John, Gen, 羅馬書)..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-700 dark:focus:ring-amber-500 text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Segmented Testament control */}
              <div className="flex items-center gap-1 p-1 bg-stone-200/70 dark:bg-stone-800/70 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setActiveTestament('NT')}
                  className={`flex-1 py-1.5 rounded-md transition-colors ${
                    activeTestament === 'NT'
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  新約聖經 New Testament (27)
                </button>
                <button
                  onClick={() => setActiveTestament('OT')}
                  className={`flex-1 py-1.5 rounded-md transition-colors ${
                    activeTestament === 'OT'
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  舊約聖經 Old Testament (39)
                </button>
                <button
                  onClick={() => setActiveTestament('ALL')}
                  className={`py-1.5 px-3 rounded-md transition-colors ${
                    activeTestament === 'ALL'
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  全部 All (66)
                </button>
              </div>
            </div>

            {/* Books Grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredBooks.map((book) => {
                const isSelected = currentSlotBook.id === book.id;
                const chineseName = getBookLabel(book);

                return (
                  <button
                    key={book.id}
                    onClick={() => handleBookClick(book)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all group ${
                      isSelected
                        ? 'border-amber-700 bg-amber-50/70 dark:bg-amber-950/40 text-stone-900 dark:text-stone-100 font-semibold'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 hover:border-amber-400 dark:hover:border-amber-700 text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    <div>
                      <div className="font-serif text-sm font-semibold flex items-center gap-1.5">
                        <span>{chineseName}</span>
                      </div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                        {book.name} · {book.chaptersCount}章
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors shrink-0" />
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          /* Chapter Selection Grid */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-stone-600 dark:text-stone-400">
                點擊章數立即載入{studyCount > 1 ? `至窗格 ${currentSlotIndex + 1}` : '四部並行經文'}（共 {tempBook.chaptersCount} 章）：
              </div>
              <button
                onClick={() => setViewStep('book')}
                className="text-xs text-amber-900 dark:text-amber-400 hover:underline font-medium"
              >
                ← 返回卷名列表
              </button>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2.5">
              {Array.from({ length: tempBook.chaptersCount }, (_, i) => i + 1).map((chapNum) => {
                const isSelected = currentSlotBook.id === tempBook.id && currentSlotChapter === chapNum;
                return (
                  <button
                    key={chapNum}
                    onClick={() => handleChapterClick(chapNum)}
                    className={`h-11 sm:h-12 rounded-xl text-sm font-semibold transition-all flex items-center justify-center ${
                      isSelected
                        ? 'bg-amber-900 dark:bg-amber-700 text-white shadow-md shadow-amber-950/20 ring-2 ring-amber-600'
                        : 'bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                    }`}
                  >
                    {chapNum}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-950/50 flex items-center justify-between gap-2 text-xs text-stone-500">
          <span>支援 1–4 卷聖經同時並排對讀及各自標記筆記</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-amber-900 dark:bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{studyCount > 1 ? `開始並排研讀 (${studyCount} 卷)` : '完成'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

