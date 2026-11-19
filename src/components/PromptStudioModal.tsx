import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Smartphone,
  Code,
  FileText,
  CheckCircle2,
  BookmarkCheck,
  FolderCheck,
} from 'lucide-react';
import { MobilePromptConfig, MobileFramework, StorageStrategy, TranslationEngine, ChineseVariant } from '../types/scripture';
import { generateMobileAppPrompt } from '../utils/promptGenerator';
import { BIBLE_BOOKS } from '../data/bibleBooks';

interface PromptStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBookId: string;
  selectedChapter: number;
}

export const PromptStudioModal: React.FC<PromptStudioModalProps> = ({
  isOpen,
  onClose,
  selectedBookId,
  selectedChapter,
}) => {
  const [config, setConfig] = useState<MobilePromptConfig>({
    framework: 'flutter',
    storage: 'sqlite',
    translationEngine: 'google-translate',
    includeTTS: true,
    includeDiffHighlighter: true,
    includeOfflineMode: true,
    includeSearch: true,
    chineseVariant: 'traditional',
    selectedBookId,
    selectedChapter,
  });

  const [activeTab, setActiveTab] = useState<'prompt' | 'architecture' | 'saved'>('saved');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generatedPrompt = generateMobileAppPrompt({
    ...config,
    selectedBookId,
    selectedChapter,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedPrompt], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mobile-bible-prompt-${config.framework}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentBook = BIBLE_BOOKS.find((b) => b.id === selectedBookId) || BIBLE_BOOKS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs">
      <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-100/70 dark:bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-900 text-amber-100 dark:bg-amber-700 dark:text-stone-100 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>行動 App 專用提示詞工坊</span>
                <span className="text-xs font-sans font-normal text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                  Mobile Prompt Studio
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                為 Cursor、Claude、AI Studio 與 ChatGPT 生成三源四軌雙語聖經 App 的完整架構與實作提示詞
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Split: Configuration Sidebar + Output Area */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Controls Panel (Left, 4 cols) */}
          <div className="md:col-span-4 p-4 border-r border-stone-200 dark:border-stone-800 overflow-y-auto space-y-4 bg-white dark:bg-stone-950/40 text-xs">
            {/* Framework Selector */}
            <div>
              <label className="font-semibold text-stone-800 dark:text-stone-200 block mb-1.5">
                目標行動端框架 Target Framework
              </label>
              <select
                value={config.framework}
                onChange={(e) => setConfig({ ...config, framework: e.target.value as MobileFramework })}
                className="w-full p-2 bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 font-medium"
              >
                <option value="flutter">Flutter (Dart / iOS & Android)</option>
                <option value="react-native">React Native (Expo / TypeScript)</option>
                <option value="swift">Swift & SwiftUI (Native iOS)</option>
                <option value="kotlin">Kotlin & Jetpack Compose (Native Android)</option>
                <option value="universal-ai">Universal Spec (通用全棧規範)</option>
              </select>
            </div>

            {/* Storage Strategy */}
            <div>
              <label className="font-semibold text-stone-800 dark:text-stone-200 block mb-1.5">
                資料存儲策略 Data Storage
              </label>
              <select
                value={config.storage}
                onChange={(e) => setConfig({ ...config, storage: e.target.value as StorageStrategy })}
                className="w-full p-2 bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 font-medium"
              >
                <option value="sqlite">內置 SQLite 離線數據庫 (推薦)</option>
                <option value="firestore">Firebase Firestore 雲端即時同步</option>
                <option value="rest-api">後端 REST API 按需爬取與代理</option>
                <option value="offline-hybrid">混合模式 (預載重點 + 網絡緩存)</option>
              </select>
            </div>

            {/* Translation Engine */}
            <div>
              <label className="font-semibold text-stone-800 dark:text-stone-200 block mb-1.5">
                JST 翻譯管線 Translation Pipeline
              </label>
              <select
                value={config.translationEngine}
                onChange={(e) => setConfig({ ...config, translationEngine: e.target.value as TranslationEngine })}
                className="w-full p-2 bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 font-medium"
              >
                <option value="google-translate">Google Cloud Translation API v3</option>
                <option value="gemini-ai">Gemini 3.8 Flash 聖經神學潤飾</option>
                <option value="both">雙管線 (Google翻譯 + AI神學校正)</option>
              </select>
            </div>

            {/* Feature Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
              <label className="font-semibold text-stone-800 dark:text-stone-200 block mb-1">
                功能模組開關 Feature Modules
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={config.includeDiffHighlighter}
                  onChange={(e) => setConfig({ ...config, includeDiffHighlighter: e.target.checked })}
                  className="rounded-xs text-amber-800 focus:ring-amber-700"
                />
                <span>JST 與 KJV 差異對比高亮模組</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={config.includeTTS}
                  onChange={(e) => setConfig({ ...config, includeTTS: e.target.checked })}
                  className="rounded-xs text-amber-800 focus:ring-amber-700"
                />
                <span>雙語語音合成朗讀 (TTS)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={config.includeOfflineMode}
                  onChange={(e) => setConfig({ ...config, includeOfflineMode: e.target.checked })}
                  className="rounded-xs text-amber-800 focus:ring-amber-700"
                />
                <span>離線預載數據包 (Offline-First)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={config.includeSearch}
                  onChange={(e) => setConfig({ ...config, includeSearch: e.target.checked })}
                  className="rounded-xs text-amber-800 focus:ring-amber-700"
                />
                <span>雙語全文搜索與書籤導航</span>
              </label>
            </div>

            {/* Injected Chapter Context */}
            <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
              <span className="text-stone-500 block mb-1">當前提示詞範例經文：</span>
              <div className="p-2 bg-stone-100 dark:bg-stone-900 rounded-md font-mono text-[11px] text-stone-800 dark:text-stone-200">
                {currentBook.chineseTraditional} ({currentBook.name}) 第 {selectedChapter} 章
              </div>
            </div>

            {/* Quick Action Button in Sidebar */}
            <div className="pt-2">
              <button
                onClick={handleCopy}
                className="w-full py-2.5 px-3 bg-amber-900 hover:bg-amber-800 dark:bg-amber-700 dark:hover:bg-amber-600 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '已複製提示詞！' : '一鍵複製完整 Prompt'}</span>
              </button>
            </div>
          </div>

          {/* Prompt Preview & Architecture Area (Right, 8 cols) */}
          <div className="md:col-span-8 flex flex-col h-full bg-stone-100/50 dark:bg-stone-950/80 overflow-hidden">
            {/* View Mode Tabs */}
            <div className="px-4 py-2 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'saved'
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>已保存 Master Prompt (Saved)</span>
                </button>
                <button
                  onClick={() => setActiveTab('prompt')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'prompt'
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>客製化生成 (Customizer)</span>
                </button>
                <button
                  onClick={() => setActiveTab('architecture')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'architecture'
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>架構藍圖 Architecture</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="px-2.5 py-1 text-xs border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md text-stone-700 dark:text-stone-300 flex items-center gap-1 transition-colors"
                  title="下載 Markdown 檔案"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">下載 .md</span>
                </button>
              </div>
            </div>

            {/* Main Preview Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 font-mono text-xs leading-relaxed">
              {activeTab === 'saved' ? (
                <div className="space-y-4 font-sans text-stone-800 dark:text-stone-200">
                  {/* Saved Banner */}
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                        <FolderCheck className="w-4 h-4 text-emerald-600" />
                        <span>提示詞已成功保存至專案根目錄與系統 Artifact 庫</span>
                      </span>
                      <span className="text-[11px] bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 px-2 py-0.5 rounded-full font-mono">
                        Saved: /MOBILE_APP_PROMPT.md
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                      已將三源雙語（和合本 CUNP、教會 KSV、CenterPlace JST、谷歌翻譯）及聖經人物查經模組之完整行動端系統架構提示詞永久保存為獨立檔案，可隨時取用、複製或直接提供給 Cursor / Claude / AI Studio 進行開發。
                    </p>
                    <div className="pt-1 flex items-center gap-2 font-mono text-[11px] text-stone-500">
                      <span>檔案路徑：/MOBILE_APP_PROMPT.md</span>
                    </div>
                  </div>

                  {/* Complete Saved Master Prompt Preview */}
                  <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                      <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 font-serif">
                        已儲存的 Master Prompt 全文內容
                      </h4>
                      <button
                        onClick={handleCopy}
                        className="px-2.5 py-1 bg-amber-900 dark:bg-amber-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 shadow-xs"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? '已複製！' : '一鍵複製 Master Prompt'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-stone-950 text-stone-200 rounded-lg text-[11px] leading-relaxed overflow-x-auto max-h-[50vh] whitespace-pre-wrap select-all font-mono">
                      {generatedPrompt}
                    </pre>
                  </div>
                </div>
              ) : activeTab === 'prompt' ? (
                <pre className="whitespace-pre-wrap text-stone-800 dark:text-stone-200 select-all">
                  {generatedPrompt}
                </pre>
              ) : (
                <div className="space-y-4 font-sans text-stone-800 dark:text-stone-200">
                  <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-amber-900 dark:text-amber-400">
                      <CheckCircle2 className="w-4 h-4" />
                      四軌並行顯示次序規範（嚴格遵守用戶規格）
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-xs">
                      <li>
                        <strong className="text-red-700 dark:text-red-400">第一順位：中文聖經 (和合本 CUNP 神版)</strong>
                        <p className="ml-5 text-stone-500">來源: bible.com/bible/46/JHN.1.CUNP-神</p>
                      </li>
                      <li>
                        <strong className="text-blue-700 dark:text-blue-400">第二順位：KSV / KJV Bible (教會欽定版聖經)</strong>
                        <p className="ml-5 text-stone-500">來源: churchofjesuschrist.org/study/scriptures</p>
                      </li>
                      <li>
                        <strong className="text-amber-700 dark:text-amber-400">第三順位：JST Bible (約瑟·斯密靈感譯本)</strong>
                        <p className="ml-5 text-stone-500">來源: centerplace.org/hs/iv/default.htm</p>
                      </li>
                      <li>
                        <strong className="text-emerald-700 dark:text-emerald-400">第四順位：JST 聖經（谷歌翻譯中文版）</strong>
                        <p className="ml-5 text-stone-500">使用 Google Cloud Translation API v3 或 Gemini 翻譯</p>
                      </li>
                    </ol>
                  </div>

                  <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2">
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      SQLite 離線數據庫表結構 (Schema)
                    </h3>
                    <pre className="p-3 bg-stone-950 text-emerald-400 rounded-lg text-[11px] overflow-x-auto">
{`CREATE TABLE verses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id TEXT NOT NULL,          -- e.g. 'JHN'
  chapter_number INTEGER NOT NULL,-- e.g. 1
  verse_number INTEGER NOT NULL,  -- e.g. 1
  chinese_cunp TEXT NOT NULL,     -- 1. 和合本 (bible.com)
  kjv_text TEXT NOT NULL,         -- 2. KSV / KJV (churchofjesuschrist.org)
  jst_text TEXT NOT NULL,         -- 3. JST (centerplace.org)
  jst_chinese TEXT NOT NULL,      -- 4. JST 谷歌翻譯中文版
  is_diff_from_kjv BOOLEAN,       -- JST 是否與 KJV 存在修訂
  notes TEXT                      -- 教義解析備註
);
CREATE INDEX idx_book_chapter ON verses(book_id, chapter_number);`}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-950/60 flex items-center justify-between text-xs text-stone-500">
          <span>提示詞已針對目標框架自動最佳化，可直接貼入 AI 程式編輯器。</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-amber-900 text-white dark:bg-amber-700 rounded-lg font-semibold flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>複製提示詞</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
