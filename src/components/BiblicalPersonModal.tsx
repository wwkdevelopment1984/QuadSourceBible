import React, { useState } from 'react';
import {
  X,
  Search,
  BookOpen,
  Volume2,
  Sparkles,
  Calendar,
  ExternalLink,
  Loader2,
  UserCheck,
  ArrowRight,
  Info,
} from 'lucide-react';
import { BiblicalPerson, ScriptureReference } from '../types/scripture';
import { PRELOADED_PERSONS } from '../data/biblicalPersons';

interface BiblicalPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateScripture: (bookId: string, chapter: number) => void;
}

export const BiblicalPersonModal: React.FC<BiblicalPersonModalProps> = ({
  isOpen,
  onClose,
  onNavigateScripture,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [activePerson, setActivePerson] = useState<BiblicalPerson>(PRELOADED_PERSONS[0]); // Defaults to Moses
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [langTab, setLangTab] = useState<'zh' | 'en'>('zh');

  if (!isOpen) return null;

  const popularFigures = [
    { zh: '摩西', en: 'Moses' },
    { zh: '約翰', en: 'John' },
    { zh: '耶穌基督', en: 'Jesus Christ' },
    { zh: '亞伯拉罕', en: 'Abraham' },
    { zh: '以諾', en: 'Enoch' },
    { zh: '保羅', en: 'Paul' },
    { zh: '彼得', en: 'Peter' },
    { zh: '大衛', en: 'David' },
    { zh: '以利亞', en: 'Elijah' },
    { zh: '約瑟', en: 'Joseph' },
  ];

  const handleSearch = async (nameQuery?: string) => {
    const q = (nameQuery || searchInput).trim();
    if (!q) return;

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/biblical-person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        throw new Error('查無該人物資料');
      }

      const data = await res.json();
      if (data.person) {
        setActivePerson(data.person);
        if (nameQuery) setSearchInput(nameQuery);
      } else {
        setErrorMsg('未能找到該人物的詳細記載，請嘗試其他聖經人物姓名。');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('查詢聖經人物時發生錯誤，請檢查網路連線後重試。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langTab === 'zh' ? 'zh-TW' : 'en-US';
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleScriptureClick = (ref: ScriptureReference) => {
    onNavigateScripture(ref.bookId, ref.chapter);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs">
      <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-100/70 dark:bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-900 text-amber-100 dark:bg-amber-700 dark:text-stone-100 flex items-center justify-center font-serif font-bold text-base shadow-xs">
              人
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>聖經人物故事與經文索引</span>
                <span className="text-xs font-sans font-normal text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                  Biblical Figures Explorer
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                輸入中英文名字查閱生平背景、重大事蹟與 JST / 聖經重要經文出處
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

        {/* Search Bar & Quick Tags */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/40 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="輸入聖經人物名字（如: 摩西, Moses, 耶穌, Abraham, 保羅, Paul, 大衛, David）..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-700 dark:focus:ring-amber-500 text-stone-900 dark:text-stone-100"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchInput.trim()}
              className="px-4 py-2 bg-amber-900 hover:bg-amber-800 dark:bg-amber-700 dark:hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>搜尋人物</span>
            </button>
          </form>

          {/* Quick Clickable Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs whitespace-nowrap pt-1">
            <span className="text-stone-400 font-semibold text-[11px] shrink-0">常見人物：</span>
            {popularFigures.map((fig) => (
              <button
                key={fig.en}
                onClick={() => handleSearch(fig.zh)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                  activePerson.englishName.toLowerCase() === fig.en.toLowerCase() ||
                  activePerson.chineseName === fig.zh
                    ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-bold'
                    : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-stone-700'
                }`}
              >
                {fig.zh} ({fig.en})
              </button>
            ))}
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-lg text-xs">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Scrollable Person Profile Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-stone-500">
              <Loader2 className="w-8 h-8 animate-spin text-amber-800 dark:text-amber-400" />
              <span className="text-sm font-serif">正在查考聖經人物生平背景與相關經文...</span>
              <span className="text-xs text-stone-400">
                調用聖經和合本、欽定本及約瑟斯密靈感譯本記錄
              </span>
            </div>
          ) : (
            <>
              {/* Profile Hero Card */}
              <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800/80">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-300 flex items-center justify-center font-serif text-xl font-bold shadow-xs">
                      {activePerson.chineseName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
                          {activePerson.chineseName}
                        </h3>
                        <span className="text-base text-stone-500 font-sans font-medium">
                          ({activePerson.englishName})
                        </span>
                      </div>
                      {activePerson.nameMeaning && (
                        <p className="text-xs text-amber-800 dark:text-amber-400 mt-0.5">
                          原名意義：{activePerson.nameMeaning}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Language Switch */}
                    <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-800 rounded-lg text-xs font-medium">
                      <button
                        onClick={() => setLangTab('zh')}
                        className={`px-2.5 py-1 rounded-md transition-colors ${
                          langTab === 'zh'
                            ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs font-bold'
                            : 'text-stone-500'
                        }`}
                      >
                        中文
                      </button>
                      <button
                        onClick={() => setLangTab('en')}
                        className={`px-2.5 py-1 rounded-md transition-colors ${
                          langTab === 'en'
                            ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs font-bold'
                            : 'text-stone-500'
                        }`}
                      >
                        English
                      </button>
                    </div>

                    {/* TTS Button */}
                    <button
                      onClick={() =>
                        handleSpeak(
                          langTab === 'zh'
                            ? activePerson.backgroundStory
                            : activePerson.backgroundStoryEn || activePerson.backgroundStory
                        )
                      }
                      className={`p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${
                        isSpeaking ? 'text-amber-800 dark:text-amber-400 bg-amber-50' : 'text-stone-600 dark:text-stone-300'
                      }`}
                      title="朗讀生平背景"
                    >
                      <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Role and Era */}
                <div className="pt-3 pb-3 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                  <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span className="font-semibold text-stone-700 dark:text-stone-300">
                    歷史定位與時代：
                  </span>
                  <span>{activePerson.roleAndEra}</span>
                </div>

                {/* Background Story Narrative */}
                <div className="pt-1">
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400" />
                    <span>生平與背景事蹟 Summary & Background</span>
                  </h4>
                  <p className="font-serif text-sm sm:text-base leading-relaxed text-stone-800 dark:text-stone-200">
                    {langTab === 'zh'
                      ? activePerson.backgroundStory
                      : activePerson.backgroundStoryEn || activePerson.backgroundStory}
                  </p>
                </div>
              </div>

              {/* Major Events Timeline (重大事蹟紀年) */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold font-serif text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-800 dark:text-amber-400" />
                  <span>生平重大事件紀要 Major Life Events</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activePerson.majorEvents.map((event, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-white dark:bg-stone-950 border border-stone-200/90 dark:border-stone-800 space-y-1.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-[11px] font-mono flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <span>{event.chineseTitle}</span>
                        </span>
                        <span className="text-[11px] font-mono text-amber-800 dark:text-amber-400">
                          {event.reference}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-6.5">
                        {event.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* JST Theological Insights (JST 靈感譯本專屬啟示) */}
              {activePerson.jstInsights && (
                <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2">
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>約瑟·斯密靈感譯本 (JST) 之重要復興與啟示</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-serif">
                    {activePerson.jstInsights}
                  </p>
                </div>
              )}

              {/* Related Major Scripture References (相關重要經文索引) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold font-serif text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-800 dark:text-amber-400" />
                    <span>相關主要經文出處 Related Major Scriptures</span>
                  </h4>
                  <span className="text-xs text-stone-500">點擊即可在四部對照閱讀器中開啟</span>
                </div>

                <div className="space-y-2.5">
                  {activePerson.scriptureReferences.map((ref, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-amber-400 dark:hover:border-amber-700 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-stone-900 dark:text-stone-100 font-serif">
                            {ref.chineseBookName} ({ref.bookName}) 第 {ref.chapter} 章
                            {ref.verseRange ? ` : ${ref.verseRange}` : ''}
                          </span>
                          {ref.hasJstDifference && (
                            <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded-xs flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              JST 復興
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-600 dark:text-stone-300">
                          {ref.description}
                        </p>
                      </div>

                      <button
                        onClick={() => handleScriptureClick(ref)}
                        className="px-3.5 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-amber-900 hover:text-white dark:hover:bg-amber-700 dark:hover:text-white text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shrink-0 group"
                      >
                        <span>在閱讀器開啟</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-950/60 flex items-center justify-between text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-stone-400" />
            支援任意聖經新舊約人物之中英文搜尋與經文快速跳轉
          </span>
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
