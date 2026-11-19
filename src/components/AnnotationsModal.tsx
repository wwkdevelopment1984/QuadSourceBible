import React, { useState, useMemo } from 'react';
import {
  X,
  Highlighter,
  NotebookPen,
  Search,
  Trash2,
  ArrowUpRight,
  Cloud,
  CheckCircle2,
  LogIn,
  LogOut,
  Loader2,
} from 'lucide-react';
import { useAnnotations } from '../contexts/AnnotationsContext';
import {
  ActiveHighlightColor,
  HIGHLIGHT_COLOR_CONFIG,
  VerseAnnotation,
} from '../utils/annotations';
import { getBookById } from '../data/bibleBooks';

interface AnnotationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateScripture: (bookId: string, chapter: number, verseNumber?: number) => void;
}

export const AnnotationsModal: React.FC<AnnotationsModalProps> = ({
  isOpen,
  onClose,
  onNavigateScripture,
}) => {
  const {
    user,
    isSigningIn,
    syncStatus,
    syncError,
    annotationsMap,
    signInWithGoogle,
    signOutUser,
    clearVerseAnnotation,
  } = useAnnotations();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'notes' | 'highlights'>('all');
  const [colorFilter, setColorFilter] = useState<ActiveHighlightColor | 'all'>('all');

  const sortedAnnotations = useMemo(() => {
    const entries = Object.values(annotationsMap) as VerseAnnotation[];
    return entries
      .filter((item) => {
        const hasHighlight =
          item.highlightColor !== 'none' || item.textHighlights.length > 0;
        const hasNote = item.noteText.trim().length > 0;

        if (filterType === 'notes' && !hasNote) return false;
        if (filterType === 'highlights' && !hasHighlight) return false;

        if (colorFilter !== 'all') {
          const matchesWhole = item.highlightColor === colorFilter;
          const matchesPhrase = item.textHighlights.some((h) => h.color === colorFilter);
          if (!matchesWhole && !matchesPhrase) return false;
        }

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const book = getBookById(item.bookId);
        const bookLabel = `${book?.name || ''} ${book?.chineseTraditional || ''} ${item.bookId} ${item.chapterNumber}:${item.verseNumber}`.toLowerCase();
        const phraseText = item.textHighlights.map((h) => h.quote).join(' ').toLowerCase();
        return (
          bookLabel.includes(q) ||
          item.noteText.toLowerCase().includes(q) ||
          phraseText.includes(q)
        );
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [annotationsMap, filterType, colorFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 bg-stone-50 dark:bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center">
              <Highlighter className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100">
                我的經文標記與筆記 (My Annotations)
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                共 {Object.keys(annotationsMap).length} 節已標記或寫下筆記的經文
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
            title="關閉視窗"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Cross-Device Sync Banner */}
        <div className="px-5 py-3 border-b border-stone-200 dark:border-stone-800 bg-indigo-50/70 dark:bg-indigo-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold">已啟用跨裝置雲端同步：</span>
                  <span>{user.email}</span>
                  <span className="ml-1.5 text-stone-500 dark:text-stone-400">
                    ({syncStatus === 'offline' ? '目前離線，連網後自動同步' : '電腦、手機、平板即時同步'})
                  </span>
                </div>
              </div>
              <button
                onClick={signOutUser}
                className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>登出帳號</span>
              </button>
            </>
          ) : (
            <>
              <div className="flex items-start sm:items-center gap-2 text-xs text-indigo-950 dark:text-indigo-200">
                <Cloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  目前僅儲存在本機瀏覽器。登入 Google 帳號後，您劃的重點與筆記會在電腦、手機與平板之間自動保留並同步。
                </span>
              </div>
              <button
                onClick={signInWithGoogle}
                disabled={isSigningIn}
                className="px-3.5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-60"
              >
                {isSigningIn ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogIn className="w-3.5 h-3.5" />
                )}
                <span>Google 登入同步</span>
              </button>
            </>
          )}
        </div>

        {syncError && (
          <div className="px-5 py-2.5 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/60 text-xs font-medium text-red-700 dark:text-red-300">
            {syncError}
          </div>
        )}

        {/* Search & Filter Controls */}
        <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋經卷、筆記內容或劃記字句..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', 'highlights', 'notes'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterType === t
                    ? 'bg-amber-900 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {t === 'all' ? '全部' : t === 'highlights' ? '螢光標記' : '個人筆記'}
              </button>
            ))}

            <div className="flex items-center gap-1 pl-1">
              <button
                onClick={() => setColorFilter('all')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium border ${
                  colorFilter === 'all'
                    ? 'border-stone-800 dark:border-stone-200 bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
                    : 'border-stone-200 dark:border-stone-700 text-stone-500'
                }`}
              >
                全色
              </button>
              {(['amber', 'emerald', 'sky', 'rose'] as ActiveHighlightColor[]).map((color) => (
                <button
                  key={color}
                  onClick={() => setColorFilter(colorFilter === color ? 'all' : color)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    HIGHLIGHT_COLOR_CONFIG[color].swatchClass
                  } ${colorFilter === color ? 'scale-115 ring-2 ring-stone-900 dark:ring-white' : 'opacity-80 hover:opacity-100'}`}
                  title={HIGHLIGHT_COLOR_CONFIG[color].label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Annotations List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {sortedAnnotations.length === 0 ? (
            <div className="py-14 text-center space-y-2 text-stone-500 dark:text-stone-400">
              <Highlighter className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-700" />
              <p className="text-sm font-medium">尚無符合條件的經文標記或筆記</p>
              <p className="text-xs">
                閱讀經文時，您可以直接選取字句劃上螢光顏色，或點擊「筆記」寫下心得。
              </p>
            </div>
          ) : (
            sortedAnnotations.map((entry) => {
              const book = getBookById(entry.bookId);
              const colorMeta =
                entry.highlightColor !== 'none'
                  ? HIGHLIGHT_COLOR_CONFIG[entry.highlightColor]
                  : null;

              return (
                <div
                  key={entry.key}
                  className={`rounded-xl border border-stone-200 dark:border-stone-800 p-4 space-y-2.5 bg-white dark:bg-stone-950/50 ${
                    colorMeta ? colorMeta.cardClass : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        onNavigateScripture(entry.bookId, entry.chapterNumber, entry.verseNumber);
                        onClose();
                      }}
                      className="text-sm font-bold font-serif text-amber-900 dark:text-amber-300 hover:underline flex items-center gap-1.5"
                    >
                      <span>
                        {book?.chineseTraditional || entry.bookId} ({book?.name || entry.bookId}){' '}
                        {entry.chapterNumber}:{entry.verseNumber}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-stone-400">
                        {new Date(entry.updatedAt).toLocaleString('zh-TW', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <button
                        onClick={() =>
                          clearVerseAnnotation(entry.bookId, entry.chapterNumber, entry.verseNumber)
                        }
                        className="p-1 text-stone-400 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors"
                        title="清除此節所有標記與筆記"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {entry.textHighlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {entry.textHighlights.map((h, i) => (
                        <span
                          key={`${h.stream}-${i}`}
                          className={`text-xs px-2 py-0.5 rounded-md ${
                            HIGHLIGHT_COLOR_CONFIG[h.color].markClass
                          }`}
                        >
                          「{h.quote}」
                        </span>
                      ))}
                    </div>
                  )}

                  {entry.noteText && (
                    <div className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50 rounded-lg px-3 py-2 flex items-start gap-2">
                      <NotebookPen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <p className="whitespace-pre-wrap leading-relaxed">{entry.noteText}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
