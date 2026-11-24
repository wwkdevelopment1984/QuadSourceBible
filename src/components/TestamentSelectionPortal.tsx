import React, { useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  History,
  Search,
  Check,
  RotateCcw,
  BookMarked,
  Layers,
  Highlighter,
} from 'lucide-react';
import { BibleBook, Testament, ChineseVariant } from '../types/scripture.ts';
import { BIBLE_BOOKS, getBookById } from '../data/bibleBooks.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { CloudSyncButton } from './CloudSyncButton.tsx';

interface LastReadPosition {
  bookId: string;
  chapter: number;
  timestamp: number;
}

interface TestamentSelectionPortalProps {
  onSelectBookChapter: (book: BibleBook, chapter: number) => void;
  chineseVariant: ChineseVariant;
  savedPosition: LastReadPosition | null;
  onReturnToReader?: () => void;
  canReturnToReader?: boolean;
  onOpenAnnotations?: () => void;
  annotationsCount?: number;
}

export const TestamentSelectionPortal: React.FC<TestamentSelectionPortalProps> = ({
  onSelectBookChapter,
  chineseVariant,
  savedPosition,
  onReturnToReader,
  canReturnToReader = false,
  onOpenAnnotations,
  annotationsCount = 0,
}) => {
  // Step 1: 'testament' (choose OT or NT)
  // Step 2: 'book' (choose book in chosen testament)
  // Step 3: 'chapter' (choose chapter in chosen book)
  const [step, setStep] = useState<'testament' | 'book' | 'chapter'>('testament');
  const [selectedTestament, setSelectedTestament] = useState<Testament | null>(null);
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const savedBook = savedPosition ? getBookById(savedPosition.bookId) : null;

  // OT & NT sub-categories
  const otCategories = [
    { id: 'ALL', name: '全部 (39)' },
    { id: 'LAW', name: '摩西五經 / 律法書 (5)' },
    { id: 'HIST', name: '歷史書 (12)' },
    { id: 'POETRY', name: '詩歌智慧書 (5)' },
    { id: 'PROPHECY', name: '先知書 (17)' },
  ];

  const ntCategories = [
    { id: 'ALL', name: '全部 (27)' },
    { id: 'GOSPEL', name: '四福音書 (4)' },
    { id: 'ACTS', name: '使徒行傳 / 歷史 (1)' },
    { id: 'PAUL', name: '保羅書信 (14)' },
    { id: 'GENERAL', name: '普通書信 (7)' },
    { id: 'REV', name: '啟示錄 (1)' },
  ];

  const getBookCategory = (book: BibleBook): string => {
    const idx = BIBLE_BOOKS.findIndex((b) => b.id === book.id);
    if (book.testament === 'OT') {
      if (idx >= 0 && idx < 5) return 'LAW';
      if (idx >= 5 && idx < 17) return 'HIST';
      if (idx >= 17 && idx < 22) return 'POETRY';
      return 'PROPHECY';
    } else {
      if (idx >= 39 && idx < 43) return 'GOSPEL';
      if (idx === 43) return 'ACTS';
      if (idx >= 44 && idx < 58) return 'PAUL';
      if (idx >= 58 && idx < 65) return 'GENERAL';
      return 'REV';
    }
  };

  const handleChooseTestament = (t: Testament) => {
    setSelectedTestament(t);
    setCategoryFilter('ALL');
    setSearchQuery('');
    setStep('book');
  };

  const handleChooseBook = (book: BibleBook) => {
    setSelectedBook(book);
    if (book.chaptersCount === 1) {
      onSelectBookChapter(book, 1);
    } else {
      setStep('chapter');
    }
  };

  const handleChooseChapter = (chapterNum: number) => {
    if (selectedBook) {
      onSelectBookChapter(selectedBook, chapterNum);
    }
  };

  const handleResumeLastRead = () => {
    if (savedBook && savedPosition) {
      onSelectBookChapter(savedBook, savedPosition.chapter);
    }
  };

  // Filter books by testament and search query
  const displayedBooks = BIBLE_BOOKS.filter((b) => {
    if (selectedTestament && b.testament !== selectedTestament) return false;
    if (categoryFilter !== 'ALL' && getBookCategory(b) !== categoryFilter) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      b.name.toLowerCase().includes(q) ||
      b.chineseTraditional.includes(q) ||
      b.chineseSimplified.includes(q) ||
      b.abbreviation.toLowerCase().includes(q) ||
      b.chineseAbbr.includes(q)
    );
  });

  const getDisplayName = (b: BibleBook) =>
    chineseVariant === 'traditional' ? b.chineseTraditional : b.chineseSimplified;

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-900 text-amber-100 dark:bg-amber-700 dark:text-stone-100 flex items-center justify-center font-serif font-bold text-base shadow-xs">
              聖
            </div>
            <div>
              <div className="font-serif font-bold text-base sm:text-lg leading-tight">
                雙語四部對照聖經
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400">
                Bible.com 和合本 · 教會 KJV · CenterPlace JST · 谷歌翻譯中文
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <CloudSyncButton />
            {onOpenAnnotations && (
              <button
                onClick={onOpenAnnotations}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-800 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-lg flex items-center gap-1.5 transition-colors border border-indigo-200 dark:border-indigo-800"
                title="檢視已標記螢光與筆記的經文"
              >
                <Highlighter className="w-3.5 h-3.5" />
                <span>我的標記</span>
                {annotationsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-indigo-700 text-white text-[10px] font-bold">
                    {annotationsCount}
                  </span>
                )}
              </button>
            )}
            <PWAInstallButton />
            {canReturnToReader && onReturnToReader && (
              <button
                onClick={onReturnToReader}
                className="px-3.5 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg flex items-center gap-1.5 transition-colors border border-stone-200 dark:border-stone-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>返回正在研讀的經文</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* Saved Position Banner (if available) */}
        {savedBook && savedPosition && (
          <div className="mb-8 p-4 rounded-2xl bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-900/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 flex items-center justify-center shrink-0">
                <History className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-900 dark:text-amber-400">
                  上次閱讀進度 · Last Read Position
                </div>
                <div className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
                  {getDisplayName(savedBook)} 第 {savedPosition.chapter} 章 ({savedBook.name} {savedPosition.chapter})
                </div>
              </div>
            </div>
            <button
              onClick={handleResumeLastRead}
              className="px-4 py-2 bg-amber-900 hover:bg-amber-800 dark:bg-amber-700 dark:hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors shrink-0"
            >
              <BookMarked className="w-4 h-4" />
              <span>直接繼續閱讀 (Resume)</span>
            </button>
          </div>
        )}

        {/* STEP 1: CHOOSE TESTAMENT (Old Testament vs New Testament) */}
        {step === 'testament' && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/70 px-3 py-1 rounded-full">
                第一步 · 選擇聖約 Step 1
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">
                請選擇您要研讀的聖經部分
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                選擇舊約聖經（律法書、先知書）或新約聖經（福音書、使徒書信），進入專屬卷目與章節。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* Old Testament Card */}
              <div
                onClick={() => handleChooseTestament('OT')}
                className="group relative cursor-pointer bg-white dark:bg-stone-900 hover:bg-amber-50/50 dark:hover:bg-stone-850 border-2 border-stone-200 dark:border-stone-800 hover:border-amber-700 dark:hover:border-amber-600 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 flex items-center justify-center font-serif font-bold text-xl shadow-xs">
                      舊
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      共 39 卷書
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-900 dark:group-hover:text-amber-400 transition-colors">
                      舊約聖經 (Old Testament)
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                      創世記 至 瑪拉基書 · Genesis to Malachi
                    </p>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    記載天地創造、神與亞伯拉罕立約、以色列歷史、大衛讚美詩篇及眾先知預言。
                  </p>

                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-wrap gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                    <span className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">摩西五經 (5)</span>
                    <span className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">歷史書 (12)</span>
                    <span className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">詩歌智慧書 (5)</span>
                    <span className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">先知書 (17)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300">
                    <div className="font-semibold flex items-center gap-1 mb-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>JST 靈感重修重點：</span>
                    </div>
                    <span>創世記第1章（摩西書創造）、以諾與錫安之城、麥基洗德聖職聖約。</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-400">
                  <span>進入選擇舊約卷目</span>
                  <div className="w-7 h-7 rounded-full bg-amber-900 text-white dark:bg-amber-700 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* New Testament Card */}
              <div
                onClick={() => handleChooseTestament('NT')}
                className="group relative cursor-pointer bg-white dark:bg-stone-900 hover:bg-amber-50/50 dark:hover:bg-stone-850 border-2 border-stone-200 dark:border-stone-800 hover:border-amber-700 dark:hover:border-amber-600 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 flex items-center justify-center font-serif font-bold text-xl shadow-xs">
                      新
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      共 27 卷書
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-900 dark:group-hover:text-amber-400 transition-colors">
                      新約聖經 (New Testament)
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                      馬太福音 至 啟示錄 · Matthew to Revelation
                    </p>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    記載耶穌基督降生、生平傳道、贖罪犧牲、復活救贖、早期教會行傳與使徒書信。
                  </p>

                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-wrap gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                    <span className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">四福音書 (4)</span>
                    <span className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">使徒行傳 (1)</span>
                    <span className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">保羅書信 (14)</span>
                    <span className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">普通書信 (7)</span>
                    <span className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">啟示錄 (1)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300">
                    <div className="font-semibold flex items-center gap-1 mb-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>JST 靈感重修重點：</span>
                    </div>
                    <span>約翰福音第1章（福音與子）、馬太福音第5章（八福聖約）、馬太福音24章、雅各書1:5。</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-400">
                  <span>進入選擇新約卷目</span>
                  <div className="w-7 h-7 rounded-full bg-amber-900 text-white dark:bg-amber-700 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CHOOSE BOOK (Filtered by Testament) */}
        {step === 'book' && selectedTestament && (
          <div className="space-y-6">
            {/* Header and Back to OT/NT button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep('testament')}
                  className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 transition-colors flex items-center gap-1 text-xs font-semibold"
                  title="返回選擇舊約 / 新約"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>重選新舊約</span>
                </button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <span>{selectedTestament === 'OT' ? '舊約聖經卷目' : '新約聖經卷目'}</span>
                    <span className="text-xs font-sans font-normal text-stone-500">
                      ({selectedTestament === 'OT' ? 'Old Testament, 39 Books' : 'New Testament, 27 Books'})
                    </span>
                  </h1>
                </div>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋卷名或英文 (Search book)..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-800 dark:focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Sub-Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs whitespace-nowrap">
              <span className="text-stone-400 font-semibold text-[11px] shrink-0 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                分類：
              </span>
              {(selectedTestament === 'OT' ? otCategories : ntCategories).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    categoryFilter === cat.id
                      ? 'bg-amber-900 text-white dark:bg-amber-700'
                      : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Book Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {displayedBooks.map((book) => {
                const isSpecial = ['GEN', 'JHN', 'MAT', 'JAS', 'PSA', 'DAN'].includes(book.id);
                return (
                  <button
                    key={book.id}
                    onClick={() => handleChooseBook(book)}
                    className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-700 dark:hover:border-amber-500 hover:shadow-xs transition-all text-left flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="w-6 h-6 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-serif font-bold text-xs flex items-center justify-center">
                          {book.chineseAbbr}
                        </span>
                        <span className="text-[10px] text-stone-400 font-medium">
                          {book.chaptersCount} 章
                        </span>
                      </div>
                      <div className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-900 dark:group-hover:text-amber-400 transition-colors">
                        {getDisplayName(book)}
                      </div>
                      <div className="text-[11px] text-stone-500 truncate">
                        {book.name}
                      </div>
                    </div>

                    {isSpecial && (
                      <div className="mt-2 text-[10px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-xs font-semibold flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                        <span>含完整章節對照</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: CHOOSE CHAPTER (Grid of chapters for chosen book) */}
        {step === 'chapter' && selectedBook && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep('book')}
                  className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 transition-colors flex items-center gap-1 text-xs font-semibold"
                  title="返回選擇卷目"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>重選卷目</span>
                </button>
                <div>
                  <div className="text-xs text-amber-900 dark:text-amber-400 font-semibold">
                    {selectedBook.testament === 'OT' ? '舊約聖經' : '新約聖經'} · 共 {selectedBook.chaptersCount} 章
                  </div>
                  <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
                    {getDisplayName(selectedBook)} ({selectedBook.name}) — 選擇章數
                  </h1>
                </div>
              </div>

              <button
                onClick={() => setStep('testament')}
                className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 underline self-start sm:self-auto"
              >
                回到新舊約首頁
              </button>
            </div>

            {/* Featured Chapter Notice */}
            {selectedBook.id === 'JHN' && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between">
                <span>約翰福音第 1 章：收錄全部 51 節完整四部並行聖經（CUNP、KJV、JST、谷歌翻譯）</span>
                <button
                  onClick={() => handleChooseChapter(1)}
                  className="px-3 py-1 bg-amber-900 text-white rounded-lg font-bold text-xs shrink-0"
                >
                  直接開啟第 1 章
                </button>
              </div>
            )}
            {selectedBook.id === 'GEN' && (
              <div className="space-y-2">
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>創世記第 1 章：收錄全部 31 節完整創造篇章與 JST 摩西書第二章啟示</span>
                  <button
                    onClick={() => handleChooseChapter(1)}
                    className="px-3 py-1 bg-amber-900 text-white rounded-lg font-bold text-xs shrink-0 self-start sm:self-auto"
                  >
                    開啟第 1 章
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>創世記第 14 章：24 節 KJV + <strong className="text-amber-800 dark:text-amber-200">16 節 JST 獨有增補經文 (第 25–40 節 麥基洗德聖職)</strong></span>
                  <button
                    onClick={() => handleChooseChapter(14)}
                    className="px-3 py-1 bg-amber-900 text-white rounded-lg font-bold text-xs shrink-0 self-start sm:self-auto"
                  >
                    開啟第 14 章
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>創世記第 50 章：26 節 KJV + <strong className="text-amber-800 dark:text-amber-200">12 節 JST 獨有增補經文 (第 27–38 節 約瑟預言精選先見)</strong></span>
                  <button
                    onClick={() => handleChooseChapter(50)}
                    className="px-3 py-1 bg-amber-900 text-white rounded-lg font-bold text-xs shrink-0 self-start sm:self-auto"
                  >
                    開啟第 50 章
                  </button>
                </div>
              </div>
            )}
            {selectedBook.id === 'MAT' && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between">
                <span>馬太福音第 5 章：收錄全部 48 節登山寶訓八福與聖約經文</span>
                <button
                  onClick={() => handleChooseChapter(5)}
                  className="px-3 py-1 bg-amber-900 text-white rounded-lg font-bold text-xs shrink-0"
                >
                  直接開啟第 5 章
                </button>
              </div>
            )}
            {selectedBook.id === 'JAS' && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between">
                <span>雅各書第 1 章：收錄全部 27 節經文（包含第 5 節求問智慧歷史引領）</span>
                <button
                  onClick={() => handleChooseChapter(1)}
                  className="px-3 py-1 bg-amber-900 text-white rounded-lg font-bold text-xs shrink-0"
                >
                  直接開啟第 1 章
                </button>
              </div>
            )}
            {selectedBook.id === 'PSA' && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between">
                <span>詩篇第 23 篇：收錄全部 6 節「耶和華是我的牧者」</span>
                <button
                  onClick={() => handleChooseChapter(23)}
                  className="px-3 py-1 bg-amber-900 text-white rounded-lg font-bold text-xs shrink-0"
                >
                  直接開啟第 23 篇
                </button>
              </div>
            )}

            {/* Chapters Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2.5">
              {Array.from({ length: selectedBook.chaptersCount }, (_, i) => i + 1).map((chapNum) => {
                return (
                  <button
                    key={chapNum}
                    onClick={() => handleChooseChapter(chapNum)}
                    className="h-12 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-800 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/40 text-stone-900 dark:text-stone-100 font-bold text-sm transition-all flex items-center justify-center shadow-2xs hover:scale-105"
                  >
                    {chapNum}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500 dark:text-stone-400 bg-white/50 dark:bg-stone-900/50">
        <div className="max-w-5xl mx-auto px-4 space-y-1">
          <p>
            雙語四部並行聖經對照庫 · 舊約 39 卷 · 新約 27 卷 · 隨時可於頂部點選返回重選新舊約
          </p>
          <p className="text-[11px] text-stone-400">
            四部並行：和合本 (CUNP 神版) → 教會 KJV → JST 靈感譯本 → 谷歌翻譯中文
          </p>
        </div>
      </footer>
    </div>
  );
};
