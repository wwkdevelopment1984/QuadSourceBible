import React from 'react';
import { X, Type, Sun, Moon, Sparkles, BookMarked, Eye } from 'lucide-react';
import { FontSize, ReaderTheme, ChineseVariant, ViewMode } from '../types/scripture';

interface ReaderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  theme: ReaderTheme;
  setTheme: (theme: ReaderTheme) => void;
  chineseVariant: ChineseVariant;
  setChineseVariant: (variant: ChineseVariant) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  diffHighlight: boolean;
  setDiffHighlight: (highlight: boolean) => void;
}

export const ReaderSettingsModal: React.FC<ReaderSettingsModalProps> = ({
  isOpen,
  onClose,
  fontSize,
  setFontSize,
  theme,
  setTheme,
  chineseVariant,
  setChineseVariant,
  viewMode,
  setViewMode,
  diffHighlight,
  setDiffHighlight,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <h2 className="text-base font-bold font-serif text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>閱讀偏好設定</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reading Themes */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5" />
            <span>閱讀主題色彩 Theme</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setTheme('parchment')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                theme === 'parchment'
                  ? 'border-amber-700 bg-white ring-2 ring-amber-700/20 text-stone-900'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-stone-50 border border-stone-200" />
              <span>羊皮紙白 Parchment</span>
            </button>

            <button
              onClick={() => setTheme('sepia')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                theme === 'sepia'
                  ? 'border-amber-800 bg-[#f7f3e8] ring-2 ring-amber-800/30 text-[#3e3328]'
                  : 'border-[#e4d8bd] bg-[#f7f3e8] text-[#3e3328] hover:border-amber-700'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-[#ede4ce] border border-[#d8cbb0]" />
              <span>暖羊皮褐 Sepia</span>
            </button>

            <button
              onClick={() => setTheme('night')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                theme === 'night'
                  ? 'border-amber-500 bg-stone-950 ring-2 ring-amber-500/30 text-stone-100'
                  : 'border-stone-700 bg-stone-950 text-stone-300 hover:border-stone-500'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-stone-900 border border-stone-700" />
              <span>深邃夜讀 Night</span>
            </button>
          </div>
        </div>

        {/* Font Size Adjuster */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5" />
            <span>經文字體大小 Font Size</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                { id: 'sm', label: '小 14px' },
                { id: 'base', label: '標準 16px' },
                { id: 'lg', label: '大 18px' },
                { id: 'xl', label: '特大 21px' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setFontSize(opt.id)}
                className={`py-2 px-1 text-xs rounded-lg border font-medium text-center transition-all ${
                  fontSize === opt.id
                    ? 'border-amber-700 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>排版布局 Layout</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                viewMode === 'cards'
                  ? 'border-amber-700 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold'
                  : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              階梯卡片 (手機預設)
            </button>
            <button
              onClick={() => setViewMode('columns')}
              className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                viewMode === 'columns'
                  ? 'border-amber-700 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold'
                  : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              四欄並排 (平板/桌面)
            </button>
          </div>
        </div>

        {/* Chinese Script Variant */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
            <span>中文文字選項 Chinese Script</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setChineseVariant('traditional')}
              className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                chineseVariant === 'traditional'
                  ? 'border-amber-700 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold'
                  : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              繁體中文 (Traditional)
            </button>
            <button
              onClick={() => setChineseVariant('simplified')}
              className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                chineseVariant === 'simplified'
                  ? 'border-amber-700 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold'
                  : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              简体中文 (Simplified)
            </button>
          </div>
        </div>

        {/* Diff Highlighter Toggle */}
        <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <div>
              <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                JST 經文差異標記
              </div>
              <div className="text-[11px] text-stone-500">高亮標示約瑟斯密靈感譯本的擴充修訂處</div>
            </div>
          </div>
          <button
            onClick={() => setDiffHighlight(!diffHighlight)}
            className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
              diffHighlight ? 'bg-amber-800' : 'bg-stone-300 dark:bg-stone-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                diffHighlight ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl font-semibold text-xs transition-colors"
        >
          完成設定
        </button>
      </div>
    </div>
  );
};
