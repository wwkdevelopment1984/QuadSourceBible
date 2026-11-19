import React from 'react';
import { X, ExternalLink, Globe, BookOpen, Scroll, CheckCircle2 } from 'lucide-react';

interface SourcesInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SourcesInfoModal: React.FC<SourcesInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sources = [
    {
      num: '1',
      title: '中文聖經 (和合本 CUNP·神版)',
      englishTitle: 'Chinese Union Version with New Punctuation (CUNP)',
      url: 'https://www.bible.com/bible/46/JHN.1.CUNP-%E7%A5%9E',
      displayUrl: 'bible.com/bible/46/JHN.1.CUNP-神',
      icon: Globe,
      color: 'text-red-700 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900',
      description:
        '華語基督教歷史上最普及、權威之和合本新標點版，由 YouVersion / Bible.com 提供，精確呈現華人基督徒讀經的經典語體。',
    },
    {
      num: '2',
      title: 'KSV / KJV Bible (耶穌基督後期聖徒教會欽定版)',
      englishTitle: 'King James Version (LDS Scriptures Edition)',
      url: 'https://www.churchofjesuschrist.org/study/scriptures?lang=eng&platform=web',
      displayUrl: 'churchofjesuschrist.org/study/scriptures',
      icon: BookOpen,
      color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
      description:
        '耶穌基督後期聖徒教會官方英文聖經研究庫，包含標準英王欽定本 (KJV) 全文，並附帶經文交互索引與腳註參考。',
    },
    {
      num: '3',
      title: 'JST Bible (約瑟·斯密靈感譯本)',
      englishTitle: 'Joseph Smith Translation / Holy Scriptures Inspired Version',
      url: 'https://www.centerplace.org/hs/iv/default.htm',
      displayUrl: 'centerplace.org/hs/iv/default.htm',
      icon: Scroll,
      color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
      description:
        '先知約瑟·斯密於 1830–1833 年間受聖靈啟發對英王欽定本所作的重大靈感修訂與失傳真理復興（收錄於 CenterPlace 歷史文獻庫與教會附錄）。',
    },
    {
      num: '4',
      title: 'JST 聖經（谷歌翻譯中文版）',
      englishTitle: 'JST Bible (Google Translate into Chinese)',
      url: 'https://translate.google.com',
      displayUrl: 'Google Cloud Translation API v3 / Google Translate',
      icon: Globe,
      color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
      description:
        '以 Google Translate 神經機器翻譯與精準神學術語校正，將 JST 英文修訂經文忠實譯為繁簡中文，讓華語讀者一目了然看見約瑟斯密譯本的具體神學復興內容。',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>3大來源出處與翻譯規範</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            本應用嚴格依據用戶需求，聚合兩大語言（中文與英文）以及三大歷史聖經來源，並依以下固定次序依序展示每一節經文：
          </p>

          <div className="space-y-3">
            {sources.map((src) => {
              const Icon = src.icon;
              return (
                <div
                  key={src.num}
                  className="p-4 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border ${src.color}`}>
                        {src.num}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                          {src.title}
                        </h3>
                        <span className="text-[11px] text-stone-500 font-sans">{src.englishTitle}</span>
                      </div>
                    </div>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-amber-800 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>原網址</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
                    {src.description}
                  </p>

                  <div className="pl-9 pt-1">
                    <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500 truncate block">
                      {src.displayUrl}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>行動 App 實作提示：</strong>
              若在 Flutter 或 React Native 等行動端離線運行，可將三大來源經文整合至單一 SQLite
              資料庫檔案中預打包隨 App 發行，並在用戶開啟聯網時調用 Google Cloud Translation API 增量下載新章節。
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-lg text-xs font-semibold"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
