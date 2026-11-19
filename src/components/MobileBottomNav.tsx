import React from 'react';
import { BookOpen, Sparkles, Smartphone, Users, Library, Highlighter } from 'lucide-react';
import { BibleBook } from '../types/scripture.ts';

interface MobileBottomNavProps {
  currentBook: BibleBook;
  currentChapter: number;
  onOpenTestamentPortal: () => void;
  onOpenBookSelector: () => void;
  onOpenPromptStudio: () => void;
  onOpenSettings: () => void;
  onOpenPersonExplorer: () => void;
  onOpenAnnotations: () => void;
  annotationsCount?: number;
  diffHighlight: boolean;
  onToggleDiffHighlight: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentBook,
  currentChapter,
  onOpenTestamentPortal,
  onOpenBookSelector,
  onOpenPromptStudio,
  onOpenPersonExplorer,
  onOpenAnnotations,
  annotationsCount = 0,
  diffHighlight,
  onToggleDiffHighlight,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 pb-safe">
      <div className="grid grid-cols-6 items-center h-15 px-1">
        {/* Tab 1: Testament Portal (OT / NT) */}
        <button
          onClick={onOpenTestamentPortal}
          className="flex flex-col items-center justify-center py-1 text-stone-700 dark:text-stone-300 hover:text-amber-900 dark:hover:text-amber-400 active:scale-95 transition-transform"
          title="返回選擇舊約或新約首頁"
        >
          <Library className="w-4 h-4 text-amber-800 dark:text-amber-400" />
          <span className="text-[10px] font-semibold tracking-tight mt-1">
            新舊約
          </span>
        </button>

        {/* Tab 2: Book & Chapter Picker */}
        <button
          onClick={onOpenBookSelector}
          className="flex flex-col items-center justify-center py-1 text-stone-700 dark:text-stone-300 hover:text-amber-900 dark:hover:text-amber-400 active:scale-95 transition-transform"
        >
          <BookOpen className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          <span className="text-[10px] font-semibold tracking-tight mt-1 truncate max-w-[52px]">
            {currentBook.chineseAbbr || currentBook.chineseTraditional} {currentChapter}
          </span>
        </button>

        {/* Tab 3: My Annotations */}
        <button
          onClick={onOpenAnnotations}
          className="relative flex flex-col items-center justify-center py-1 text-indigo-800 dark:text-indigo-300 active:scale-95 transition-transform"
        >
          <Highlighter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          {annotationsCount > 0 && (
            <span className="absolute top-0.5 right-2 min-w-4 h-4 px-1 rounded-full bg-indigo-700 text-white text-[9px] font-bold flex items-center justify-center">
              {annotationsCount > 99 ? '99+' : annotationsCount}
            </span>
          )}
          <span className="text-[10px] font-semibold tracking-tight mt-1">標記筆記</span>
        </button>

        {/* Tab 4: Biblical Persons */}
        <button
          onClick={onOpenPersonExplorer}
          className="flex flex-col items-center justify-center py-1 text-amber-900 dark:text-amber-300 active:scale-95 transition-transform"
        >
          <Users className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          <span className="text-[10px] font-semibold tracking-tight mt-1">人物</span>
        </button>

        {/* Tab 5: Diff Highlighter Toggle */}
        <button
          onClick={onToggleDiffHighlight}
          className={`flex flex-col items-center justify-center py-1 active:scale-95 transition-transform ${
            diffHighlight
              ? 'text-amber-900 dark:text-amber-300 font-bold'
              : 'text-stone-600 dark:text-stone-400'
          }`}
        >
          <Sparkles className={`w-4 h-4 ${diffHighlight ? 'text-amber-600' : ''}`} />
          <span className="text-[10px] font-semibold tracking-tight mt-1">
            {diffHighlight ? 'JST亮顯' : 'JST差異'}
          </span>
        </button>

        {/* Tab 6: Prompt Studio */}
        <button
          onClick={onOpenPromptStudio}
          className="flex flex-col items-center justify-center py-1 text-amber-900 dark:text-amber-400 hover:text-amber-800 active:scale-95 transition-transform font-bold"
        >
          <div className="w-5.5 h-5.5 rounded-md bg-amber-900 text-white dark:bg-amber-700 flex items-center justify-center shadow-xs">
            <Smartphone className="w-3 h-3" />
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-0.5">Prompt</span>
        </button>
      </div>
    </nav>
  );
};
