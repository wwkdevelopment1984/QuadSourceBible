import React from 'react';
import { BookOpen, Sparkles, SlidersHorizontal, Info, Smartphone, Users, Library, Highlighter } from 'lucide-react';
import { BibleBook, ReaderTheme } from '../types/scripture';
import { PWAInstallButton } from './PWAInstallButton';
import { CloudSyncButton } from './CloudSyncButton';

interface HeaderProps {
  currentBook: BibleBook;
  currentChapter: number;
  onOpenTestamentPortal: () => void;
  onOpenBookSelector: () => void;
  onOpenPromptStudio: () => void;
  onOpenSettings: () => void;
  onOpenSources: () => void;
  onOpenPersonExplorer: () => void;
  onOpenAnnotations: () => void;
  annotationsCount?: number;
  theme: ReaderTheme;
  diffHighlight: boolean;
  onToggleDiffHighlight: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentBook,
  currentChapter,
  onOpenTestamentPortal,
  onOpenBookSelector,
  onOpenPromptStudio,
  onOpenSettings,
  onOpenSources,
  onOpenPersonExplorer,
  onOpenAnnotations,
  annotationsCount = 0,
  diffHighlight,
  onToggleDiffHighlight,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Single text element wordmark + Quick Testament Portal Link */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onOpenTestamentPortal}
            className="flex items-center gap-2 text-left group hover:opacity-85 transition-opacity"
            title="點擊返回新舊約選擇首頁 (Return to Testament Selector)"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-900 text-amber-100 dark:bg-amber-700 dark:text-stone-100 flex items-center justify-center font-serif font-bold text-sm shadow-xs">
              聖
            </div>
            <div>
              <div className="text-base font-bold font-serif tracking-tight text-stone-900 dark:text-stone-100 whitespace-nowrap">
                QuadScripture
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium whitespace-nowrap">
                雙語四部對照聖經
              </div>
            </div>
          </button>

          <button
            onClick={onOpenTestamentPortal}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-100/80 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors border border-amber-200/60 dark:border-amber-800/60"
            title="返回第一頁選擇舊約或新約"
          >
            <Library className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>選新舊約</span>
          </button>
        </div>

        {/* Zone 2: Navigation & Quick Active Selection */}
        <nav className="hidden md:flex items-center gap-3 lg:gap-4 text-sm font-medium text-stone-600 dark:text-stone-300 overflow-x-auto">
          <button
            onClick={onOpenBookSelector}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-900 dark:text-stone-100 font-semibold whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-4 h-4 text-amber-800 dark:text-amber-400" />
            <span>
              {currentBook.chineseTraditional} ({currentBook.name}) {currentChapter}章
            </span>
          </button>

          <button
            onClick={onToggleDiffHighlight}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 ${
              diffHighlight
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 font-semibold'
                : 'hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>JST差異標記</span>
          </button>

          <button
            onClick={onOpenAnnotations}
            className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 text-xs font-semibold text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-md border border-indigo-200/80 dark:border-indigo-900/50"
            title="檢視與搜尋所有經文螢光標記與筆記"
          >
            <Highlighter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>我的標記</span>
            {annotationsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-700 text-white text-[10px] font-bold">
                {annotationsCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenPersonExplorer}
            className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-md border border-amber-200/80 dark:border-amber-900/50"
            title="查閱摩西、約翰、亞伯拉罕、保羅等人物生平事蹟與相關經文"
          >
            <Users className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>人物查經</span>
          </button>

          <button
            onClick={onOpenSources}
            className="hidden xl:flex hover:text-stone-900 dark:hover:text-stone-100 transition-colors whitespace-nowrap shrink-0 items-center gap-1 text-xs"
          >
            <Info className="w-3.5 h-3.5" />
            <span>來源出處</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 text-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>閱讀設定</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action (Cloud Sync + PWA Install + Prompt Studio) */}
        <div className="flex items-center gap-2 shrink-0">
          <CloudSyncButton />
          <PWAInstallButton />
          <button
            onClick={onOpenPromptStudio}
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-amber-900 dark:bg-amber-700 hover:bg-amber-800 dark:hover:bg-amber-600 rounded-lg shadow-xs hover:shadow-sm transition-all whitespace-nowrap shrink-0"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>App提示詞</span>
          </button>
        </div>
      </div>
    </header>
  );
};
