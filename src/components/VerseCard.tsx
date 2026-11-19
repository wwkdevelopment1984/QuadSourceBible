import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  HelpCircle,
  Loader2,
  PlusCircle,
  NotebookPen,
  Trash2,
  Save,
  Edit3,
  Highlighter,
  Cloud,
  HardDrive,
  X,
} from 'lucide-react';
import { ParallelVerse, ChapterSourceUrls, FontSize, ViewMode } from '../types/scripture';
import { useAnnotations } from '../contexts/AnnotationsContext';
import {
  ActiveHighlightColor,
  AnnotationStream,
  HIGHLIGHT_COLOR_CONFIG,
  HighlightColor,
  TextHighlight,
} from '../utils/annotations';

interface VerseCardProps {
  verse: ParallelVerse;
  bookId?: string;
  bookName: string;
  chineseBookName: string;
  chapterNumber: number;
  sourceUrls: ChapterSourceUrls;
  fontSize: FontSize;
  diffHighlight: boolean;
  viewMode: ViewMode;
  anchorId?: string;
  onAnalyzeDiff?: (verse: ParallelVerse) => Promise<string>;
}

const HIGHLIGHT_COLORS: ActiveHighlightColor[] = ['amber', 'emerald', 'sky', 'rose'];

export const VerseCard: React.FC<VerseCardProps> = ({
  verse,
  bookId,
  bookName,
  chineseBookName,
  chapterNumber,
  sourceUrls,
  fontSize,
  diffHighlight,
  viewMode,
  anchorId,
}) => {
  const noteBookId = (bookId || bookName).trim().toUpperCase();
  const {
    user,
    syncStatus,
    signInWithGoogle,
    getAnnotation,
    setVerseHighlightColor,
    addTextHighlight,
    removeTextHighlight,
    saveVerseNote,
  } = useAnnotations();

  const annotation = getAnnotation(noteBookId, chapterNumber, verse.verseNumber);
  const savedNoteText = annotation?.noteText || '';
  const highlightColor: HighlightColor = annotation?.highlightColor || 'none';
  const textHighlights = annotation?.textHighlights || [];

  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState<string>(savedNoteText);
  const [justSavedNote, setJustSavedNote] = useState(false);

  const [showHighlighterBar, setShowHighlighterBar] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<{
    stream: AnnotationStream;
    quote: string;
  } | null>(null);

  const streamRefs = {
    cunp: useRef<HTMLDivElement>(null),
    kjv: useRef<HTMLDivElement>(null),
    jst: useRef<HTMLDivElement>(null),
    jstChinese: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    setNoteDraft(savedNoteText);
    setIsEditingNote(false);
    setJustSavedNote(false);
    setPendingSelection(null);
    setShowHighlighterBar(false);
  }, [noteBookId, chapterNumber, verse.verseNumber]);

  // Keep draft synced with incoming remote snapshot when not actively typing
  useEffect(() => {
    if (!isEditingNote) {
      setNoteDraft(savedNoteText);
    }
  }, [savedNoteText, isEditingNote]);

  const handleOpenNoteEditor = () => {
    if (isEditingNote) {
      setIsEditingNote(false);
      setNoteDraft(savedNoteText);
      return;
    }
    setNoteDraft(savedNoteText);
    setIsEditingNote(true);
  };

  const handleSaveNote = async () => {
    await saveVerseNote(noteBookId, chapterNumber, verse.verseNumber, noteDraft);
    setIsEditingNote(false);
    if (noteDraft.trim()) {
      setJustSavedNote(true);
      setTimeout(() => setJustSavedNote(false), 2200);
    }
  };

  const handleDeleteNote = async () => {
    await saveVerseNote(noteBookId, chapterNumber, verse.verseNumber, '');
    setNoteDraft('');
    setIsEditingNote(false);
    setJustSavedNote(false);
  };

  const handleCaptureSelection = (stream: AnnotationStream) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }
    const rawQuote = selection.toString().trim();
    if (!rawQuote || rawQuote.length < 1 || rawQuote.length > 500) {
      return;
    }
    const containerEl = streamRefs[stream].current;
    if (containerEl && selection.anchorNode && !containerEl.contains(selection.anchorNode)) {
      return;
    }
    setPendingSelection({ stream, quote: rawQuote });
  };

  const handleApplyPhraseHighlight = async (color: ActiveHighlightColor) => {
    if (!pendingSelection) return;
    await addTextHighlight(noteBookId, chapterNumber, verse.verseNumber, {
      stream: pendingSelection.stream,
      quote: pendingSelection.quote,
      color,
    });
    window.getSelection()?.removeAllRanges();
    setPendingSelection(null);
  };

  const handleApplyVerseColor = async (color: HighlightColor) => {
    if (pendingSelection && color !== 'none') {
      await handleApplyPhraseHighlight(color);
      return;
    }
    const nextColor = highlightColor === color ? 'none' : color;
    await setVerseHighlightColor(noteBookId, chapterNumber, verse.verseNumber, nextColor);
  };

  const normalizeForCompare = (text: string) =>
    text
      .replace(/\s+/g, ' ')
      .replace(/[“”"‘’']/g, '')
      .trim();

  const hasCunp = Boolean(verse.chineseCunp && verse.chineseCunp.trim().length > 0);
  const hasKjv = Boolean(verse.kjvText && verse.kjvText.trim().length > 0);
  const isJstOnly = verse.alignmentType === 'jst-only' || (!hasCunp && !hasKjv);
  const isJstStandalone = !hasCunp && !hasKjv;
  const isJstExpanded = verse.alignmentType === 'jst-expanded';
  const isJstSameAsKjv = Boolean(
    hasKjv &&
      hasCunp &&
      !verse.isDiffFromKjv &&
      normalizeForCompare(verse.jstText) === normalizeForCompare(verse.kjvText!)
  );

  // Text-to-speech helper
  const handleSpeak = (text: string, lang: 'zh-CN' | 'zh-TW' | 'en-US', streamId: string) => {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();

    if (isSpeaking === streamId) {
      setIsSpeaking(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);

    setIsSpeaking(streamId);
    window.speechSynthesis.speak(utterance);
  };

  // Copy streams (+ optional highlights & personal note) to clipboard
  const handleCopy = () => {
    const personalNoteBlock = savedNoteText
      ? `\n\n[個人筆記 Personal Note]:\n${savedNoteText}`
      : '';
    const stream4CopyText = isJstSameAsKjv
      ? '與和合本 (CUNP) 相同 (Same as CUNP Bible — JST matches KJV)'
      : verse.jstChinese;
    const textToCopy = isJstStandalone
      ? `【${chineseBookName} / ${bookName} ${chapterNumber}:${verse.verseNumber} · JST 獨立增補經文】
JST Bible (CenterPlace Inspired Version):
${verse.jstText}

JST 聖經 (谷歌翻譯中文版 Google Translate):
${verse.jstChinese}
(來源: centerplace.org)${personalNoteBlock}`
      : `【${chineseBookName} / ${bookName} ${chapterNumber}:${verse.verseNumber}】
1. 中文聖經 (和合本 CUNP):
${verse.chineseCunp}

2. KSV / KJV Bible (Church of Jesus Christ):
${verse.kjvText}

3. JST Bible (CenterPlace Inspired Version):
${verse.jstText}

4. JST 聖經 (谷歌翻譯中文版):
${stream4CopyText}
(來源: bible.com | churchofjesuschrist.org | centerplace.org)${personalNoteBlock}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // AI / Local comparison analysis
  const handleAnalyze = async () => {
    if (analysisText) {
      setShowAnalysis(!showAnalysis);
      return;
    }

    setIsAnalyzing(true);
    setShowAnalysis(true);
    try {
      const response = await fetch('/api/compare-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookName,
          chapter: chapterNumber,
          verseNumber: verse.verseNumber,
          kjvText: verse.kjvText || '(None in KJV — Additional JST-only verse)',
          jstText: verse.jstText,
        }),
      });
      const data = await response.json();
      setAnalysisText(
        data.analysis ||
          verse.notes ||
          '約瑟·斯密靈感譯本 (JST) 在此處恢復或增補了聖經古卷遺失的重要教義與聖約細節。'
      );
    } catch {
      setAnalysisText(
        verse.notes ||
          (isJstOnly
            ? `此節為 JST 靈感譯本獨有的增補經文（KJV 及和合本未收錄此節），旨在補充先知在古代領受的完整預言與聖職教義。`
            : `此處 JST 對照欽定本 (KJV) 作了教義闡明或歷史還原。`)
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      case 'xl':
        return 'text-xl';
      default:
        return 'text-base';
    }
  };

  const fontClass = getFontSizeClass();

  // Render inline user phrase highlights on top of plain text
  const renderHighlightedContent = (
    text: string,
    stream: AnnotationStream,
    fallbackDiffClass?: string
  ) => {
    const streamHighlights = textHighlights.filter((h) => h.stream === stream);
    if (streamHighlights.length === 0) {
      if (fallbackDiffClass) {
        return <mark className={fallbackDiffClass}>{text}</mark>;
      }
      return text;
    }

    // Build ordered non-overlapping segments for matched quotes
    const matches: { start: number; end: number; highlight: TextHighlight }[] = [];
    for (const h of streamHighlights) {
      const idx = text.indexOf(h.quote);
      if (idx !== -1) {
        matches.push({ start: idx, end: idx + h.quote.length, highlight: h });
      }
    }

    if (matches.length === 0) {
      if (fallbackDiffClass) {
        return <mark className={fallbackDiffClass}>{text}</mark>;
      }
      return text;
    }

    matches.sort((a, b) => a.start - b.start || b.end - a.end);

    const nodes: React.ReactNode[] = [];
    let cursor = 0;

    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      if (m.start < cursor) continue;
      if (m.start > cursor) {
        const plain = text.slice(cursor, m.start);
        nodes.push(
          fallbackDiffClass ? (
            <mark key={`plain-${i}`} className={fallbackDiffClass}>
              {plain}
            </mark>
          ) : (
            <React.Fragment key={`plain-${i}`}>{plain}</React.Fragment>
          )
        );
      }

      const matchedText = text.slice(m.start, m.end);
      nodes.push(
        <mark
          key={`hl-${i}`}
          className={`${HIGHLIGHT_COLOR_CONFIG[m.highlight.color].markClass} cursor-pointer transition-opacity hover:opacity-80`}
          title="點擊可移除此段螢光標記"
          onClick={(e) => {
            e.stopPropagation();
            removeTextHighlight(
              noteBookId,
              chapterNumber,
              verse.verseNumber,
              stream,
              m.highlight.quote
            );
          }}
        >
          {matchedText}
        </mark>
      );
      cursor = m.end;
    }

    if (cursor < text.length) {
      const tail = text.slice(cursor);
      nodes.push(
        fallbackDiffClass ? (
          <mark key="plain-tail" className={fallbackDiffClass}>
            {tail}
          </mark>
        ) : (
          <React.Fragment key="plain-tail">{tail}</React.Fragment>
        )
      );
    }

    return <>{nodes}</>;
  };

  const renderJstText = (text: string) => {
    const diffClass =
      diffHighlight && (verse.isDiffFromKjv || isJstOnly)
        ? 'bg-amber-200/70 dark:bg-amber-900/50 text-stone-900 dark:text-stone-100 rounded-xs px-1 py-0.5'
        : undefined;
    return renderHighlightedContent(text, 'jst', diffClass);
  };

  const renderJstChinese = (text: string) => {
    const diffClass =
      diffHighlight && (verse.isDiffFromKjv || isJstOnly)
        ? 'bg-amber-100/80 dark:bg-amber-950/70 text-amber-950 dark:text-amber-100 rounded-xs px-1 py-0.5 font-medium'
        : undefined;
    return renderHighlightedContent(text, 'jstChinese', diffClass);
  };

  const renderSelectionPopup = (stream: AnnotationStream) => {
    if (!pendingSelection || pendingSelection.stream !== stream) return null;
    return (
      <div className="mt-2 p-2 rounded-xl bg-white dark:bg-stone-950 border border-amber-300 dark:border-amber-700 shadow-md flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in duration-150">
        <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-200 max-w-full">
          <Highlighter className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
          <span className="truncate max-w-[200px] sm:max-w-[280px] font-medium">
            劃記「{pendingSelection.quote}」
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handleApplyPhraseHighlight(c)}
              className={`w-5 h-5 rounded-full border-2 ${HIGHLIGHT_COLOR_CONFIG[c].swatchClass} hover:scale-110 transition-transform`}
              title={`標記為${HIGHLIGHT_COLOR_CONFIG[c].label}`}
            />
          ))}
          <button
            type="button"
            onClick={() => setPendingSelection(null)}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            title="取消選取"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const renderPhraseHighlightChips = (stream: AnnotationStream) => {
    const list = textHighlights.filter((h) => h.stream === stream);
    if (list.length === 0) return null;
    return (
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {list.map((h, i) => (
          <button
            key={`${h.stream}-${i}`}
            type="button"
            onClick={() =>
              removeTextHighlight(
                noteBookId,
                chapterNumber,
                verse.verseNumber,
                stream,
                h.quote
              )
            }
            className={`text-[10px] px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 ${
              HIGHLIGHT_COLOR_CONFIG[h.color].markClass
            } hover:opacity-80`}
            title="點擊移除此螢光劃線"
          >
            <span className="max-w-[140px] truncate">{h.quote}</span>
            <X className="w-2.5 h-2.5 shrink-0" />
          </button>
        ))}
      </div>
    );
  };

  const hasAnyHighlight = highlightColor !== 'none' || textHighlights.length > 0;
  const activeCardTint =
    highlightColor !== 'none'
      ? HIGHLIGHT_COLOR_CONFIG[highlightColor].cardClass
      : isJstOnly
      ? 'bg-amber-50/40 dark:bg-amber-950/15 border-amber-300/90 dark:border-amber-800/80 hover:border-amber-500'
      : 'bg-white dark:bg-stone-900/90 border-stone-200/90 dark:border-stone-800 hover:border-amber-300 dark:hover:border-amber-700/60';

  return (
    <article
      id={anchorId || `verse-${verse.verseNumber}`}
      className={`border rounded-2xl p-4 sm:p-5 shadow-xs transition-all duration-200 group ${activeCardTint}`}
    >
      {/* Top Bar for Verse Number & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-stone-100 dark:border-stone-800/80">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`w-8 h-8 rounded-full font-bold font-mono text-sm flex items-center justify-center border ${
              isJstOnly
                ? 'bg-amber-800 text-white border-amber-700 dark:bg-amber-600 dark:border-amber-500'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-stone-200 dark:border-stone-700'
            }`}
          >
            {verse.verseNumber}
          </span>
          <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">
            {chineseBookName} {chapterNumber}:{verse.verseNumber}
          </span>

          {isJstOnly && (
            <span className="text-[11px] font-bold text-white bg-amber-800 dark:bg-amber-700 rounded-md px-2 py-0.5 flex items-center gap-1 shadow-2xs">
              <PlusCircle className="w-3 h-3" />
              <span>JST 獨立經文 · Standalone (KJV / 和合本無此節)</span>
            </span>
          )}

          {isJstExpanded && !isJstOnly && (
            <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 rounded-md px-2 py-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>JST 段落展開修訂</span>
            </span>
          )}

          {!isJstOnly && !isJstExpanded && verse.isDiffFromKjv && (
            <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/80 rounded-md px-2 py-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>JST有重要修訂</span>
            </span>
          )}

          {verse.kjvVerseRef && (
            <span className="text-[11px] text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/80 px-2 py-0.5 rounded-md">
              {verse.kjvVerseRef}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-stone-400">
          {(verse.isDiffFromKjv || isJstOnly || verse.notes) && (
            <button
              onClick={handleAnalyze}
              className="px-2 py-1 text-xs rounded-md text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/60 flex items-center gap-1 transition-colors"
              title="查看 JST 與 KJV 經文差異教義解析"
            >
              {isAnalyzing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <HelpCircle className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">差異釋義</span>
            </button>
          )}

          {/* Highlighter Toggle Button */}
          <button
            onClick={() => setShowHighlighterBar(!showHighlighterBar)}
            className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 transition-colors ${
              showHighlighterBar || hasAnyHighlight
                ? 'bg-amber-100/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-800 font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
            title="標記整節重點色，或在下方選取字句劃記螢光筆"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {hasAnyHighlight ? '已標記' : '螢光標記'}
            </span>
          </button>

          {/* Note Toggle Button */}
          <button
            onClick={handleOpenNoteEditor}
            className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 transition-colors ${
              isEditingNote || savedNoteText
                ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
            title="撰寫經文心得筆記（支援登入後跨裝置同步）"
          >
            <NotebookPen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{savedNoteText ? '已記筆記' : '筆記'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            title="複製對照經文"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Verse Highlighter Palette Bar */}
      {showHighlighterBar && (
        <div className="mb-3.5 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
            <Highlighter className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span className="font-medium">
              整節螢光底色（或直接反白選取下方任何字句單獨劃線）：
            </span>
          </div>
          <div className="flex items-center gap-2">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleApplyVerseColor(color)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                  highlightColor === color
                    ? 'border-stone-900 dark:border-white bg-white dark:bg-stone-800 shadow-xs scale-105'
                    : 'border-stone-200 dark:border-stone-700 bg-white/70 dark:bg-stone-900 hover:border-stone-400'
                }`}
              >
                <span
                  className={`w-3 h-3 rounded-full border ${HIGHLIGHT_COLOR_CONFIG[color].swatchClass}`}
                />
                <span>{HIGHLIGHT_COLOR_CONFIG[color].label}</span>
              </button>
            ))}
            {highlightColor !== 'none' && (
              <button
                type="button"
                onClick={() => handleApplyVerseColor('none')}
                className="px-2 py-1 rounded-lg text-[11px] font-medium text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                清除整節色
              </button>
            )}
          </div>
        </div>
      )}

      {/* AI / Curated Analysis Box (if opened) */}
      {showAnalysis && (
        <div className="mb-4 p-3.5 rounded-xl bg-amber-50/90 dark:bg-stone-950/80 border border-amber-200 dark:border-amber-900/60 text-xs sm:text-sm text-stone-800 dark:text-stone-200 animate-in fade-in duration-150">
          <div className="flex items-center justify-between font-semibold text-amber-900 dark:text-amber-300 mb-1.5">
            <span className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-amber-600" />
              JST 經文修訂教義解析
            </span>
            <button
              onClick={() => setShowAnalysis(false)}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs"
            >
              收起
            </button>
          </div>
          {isAnalyzing ? (
            <div className="flex items-center gap-2 py-2 text-stone-500">
              <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
              <span>正在分析約瑟斯密譯本與欽定本教義差異...</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">{analysisText}</p>
          )}
        </div>
      )}

      {/* Parallel Streams: 4 columns/streams when KJV & CUNP exist; JST Standalone (2 streams) when KJV & CUNP do not exist */}
      <div
        className={
          viewMode === 'columns'
            ? `grid grid-cols-1 ${isJstStandalone ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-4`
            : 'space-y-3.5 divide-y divide-stone-100 dark:divide-stone-800/60'
        }
      >
        {/* STREAM 1: Chinese Bible (和合本 CUNP 神版 - bible.com) */}
        {hasCunp && (
          <div
            ref={streamRefs.cunp}
            onMouseUp={() => handleCaptureSelection('cunp')}
            onTouchEnd={() => setTimeout(() => handleCaptureSelection('cunp'), 120)}
            className={viewMode === 'columns' ? 'p-3 rounded-xl bg-stone-50 dark:bg-stone-950/50' : 'pt-1'}
          >
            <div className="flex items-center justify-between text-xs mb-1.5 text-stone-500 dark:text-stone-400">
              <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                1. 中文聖經（和合本 CUNP·神版）
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSpeak(verse.chineseCunp!, 'zh-TW', `zh-cunp-${verse.verseNumber}`)}
                  className="hover:text-stone-800 dark:hover:text-stone-200 p-0.5"
                  title="朗讀中文經文"
                >
                  <Volume2
                    className={`w-3.5 h-3.5 ${
                      isSpeaking === `zh-cunp-${verse.verseNumber}`
                        ? 'text-amber-700 dark:text-amber-400 animate-pulse'
                        : ''
                    }`}
                  />
                </button>
                <a
                  href={sourceUrls.bibleComChinese}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-amber-800 dark:hover:text-amber-400 flex items-center gap-0.5"
                  title="至 bible.com 查閱原版"
                >
                  <span className="hidden sm:inline">bible.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <p className={`font-chinese text-stone-900 dark:text-stone-100 leading-relaxed select-text ${fontClass}`}>
              {renderHighlightedContent(verse.chineseCunp!, 'cunp')}
            </p>
            {renderSelectionPopup('cunp')}
            {renderPhraseHighlightChips('cunp')}
          </div>
        )}

        {/* STREAM 2: KSV / KJV Bible (Church of Jesus Christ) */}
        {hasKjv && (
          <div
            ref={streamRefs.kjv}
            onMouseUp={() => handleCaptureSelection('kjv')}
            onTouchEnd={() => setTimeout(() => handleCaptureSelection('kjv'), 120)}
            className={
              viewMode === 'columns'
                ? 'p-3 rounded-xl bg-stone-50 dark:bg-stone-950/50'
                : hasCunp
                ? 'pt-3.5'
                : 'pt-1'
            }
          >
            <div className="flex items-center justify-between text-xs mb-1.5 text-stone-500 dark:text-stone-400">
              <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                2. KSV / KJV Bible（教會欽定版聖經）
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSpeak(verse.kjvText!, 'en-US', `en-kjv-${verse.verseNumber}`)}
                  className="hover:text-stone-800 dark:hover:text-stone-200 p-0.5"
                  title="Read English KJV verse"
                >
                  <Volume2
                    className={`w-3.5 h-3.5 ${
                      isSpeaking === `en-kjv-${verse.verseNumber}`
                        ? 'text-amber-700 dark:text-amber-400 animate-pulse'
                        : ''
                    }`}
                  />
                </button>
                <a
                  href={sourceUrls.churchKjv}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-amber-800 dark:hover:text-amber-400 flex items-center gap-0.5"
                  title="Open Church of Jesus Christ scriptures"
                >
                  <span className="hidden sm:inline">Church</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <p className={`font-scripture text-stone-800 dark:text-stone-200 leading-relaxed italic select-text ${fontClass}`}>
              "{renderHighlightedContent(verse.kjvText!, 'kjv')}"
            </p>
            {renderSelectionPopup('kjv')}
            {renderPhraseHighlightChips('kjv')}
          </div>
        )}

        {/* STREAM 3: JST Bible (CenterPlace Inspired Version) */}
        <div
          ref={streamRefs.jst}
          onMouseUp={() => handleCaptureSelection('jst')}
          onTouchEnd={() => setTimeout(() => handleCaptureSelection('jst'), 120)}
          className={
            viewMode === 'columns'
              ? 'p-3 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30'
              : hasCunp || hasKjv
              ? 'pt-3.5'
              : 'pt-1'
          }
        >
          <div className="flex items-center justify-between text-xs mb-1.5 text-amber-900 dark:text-amber-400">
            <span className="font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              {isJstStandalone
                ? '1. JST Bible（約瑟·斯密靈感譯本 · Standalone）'
                : '3. JST Bible（約瑟·斯密靈感譯本）'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSpeak(verse.jstText, 'en-US', `en-jst-${verse.verseNumber}`)}
                className="hover:text-stone-800 dark:hover:text-stone-200 p-0.5"
                title="Read English JST verse"
              >
                <Volume2
                  className={`w-3.5 h-3.5 ${
                    isSpeaking === `en-jst-${verse.verseNumber}`
                      ? 'text-amber-700 dark:text-amber-400 animate-pulse'
                      : ''
                  }`}
                />
              </button>
              <a
                href={sourceUrls.centerplaceJst}
                target="_blank"
                rel="noreferrer"
                className="hover:underline flex items-center gap-0.5"
                title="Open centerplace.org Inspired Version"
              >
                <span className="hidden sm:inline">centerplace.org</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <p
            className={`font-scripture text-stone-900 dark:text-stone-100 leading-relaxed select-text ${fontClass} ${
              verse.isDiffFromKjv || isJstOnly ? 'font-medium' : ''
            }`}
          >
            {renderJstText(verse.jstText)}
          </p>
          {renderSelectionPopup('jst')}
          {renderPhraseHighlightChips('jst')}
        </div>

        {/* STREAM 4: JST Bible (Google Translate into Chinese) */}
        <div
          ref={streamRefs.jstChinese}
          onMouseUp={() => !isJstSameAsKjv && handleCaptureSelection('jstChinese')}
          onTouchEnd={() =>
            !isJstSameAsKjv && setTimeout(() => handleCaptureSelection('jstChinese'), 120)
          }
          className={
            viewMode === 'columns'
              ? isJstSameAsKjv
                ? 'p-3 rounded-xl bg-stone-50/70 dark:bg-stone-900/40 border border-stone-200/70 dark:border-stone-800'
                : 'p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30'
              : 'pt-3.5'
          }
        >
          <div className="flex items-center justify-between text-xs mb-1.5 text-emerald-900 dark:text-emerald-400">
            <span className="font-semibold flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${isJstSameAsKjv ? 'bg-stone-400' : 'bg-emerald-600'}`}
              />
              {isJstStandalone
                ? '2. JST 聖經（谷歌翻譯中文版 Google Translate）'
                : '4. JST 聖經（谷歌翻譯中文版 Google Translate）'}
            </span>
            <div className="flex items-center gap-2">
              {!isJstSameAsKjv && (
                <button
                  onClick={() =>
                    handleSpeak(verse.jstChinese, 'zh-TW', `zh-jst-${verse.verseNumber}`)
                  }
                  className="hover:text-stone-800 dark:hover:text-stone-200 p-0.5"
                  title="朗讀 JST 中文翻譯經文"
                >
                  <Volume2
                    className={`w-3.5 h-3.5 ${
                      isSpeaking === `zh-jst-${verse.verseNumber}`
                        ? 'text-emerald-700 dark:text-emerald-400 animate-pulse'
                        : ''
                    }`}
                  />
                </button>
              )}
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-xs ${
                  isJstSameAsKjv
                    ? 'text-stone-600 dark:text-stone-400 bg-stone-200/70 dark:bg-stone-800'
                    : 'text-emerald-700/80 dark:text-emerald-400/80 bg-emerald-100/70 dark:bg-emerald-950/80'
                }`}
              >
                {isJstSameAsKjv ? 'Same as CUNP' : 'Google Translate'}
              </span>
            </div>
          </div>
          {isJstSameAsKjv ? (
            <p className="text-xs sm:text-sm italic text-stone-500 dark:text-stone-400 bg-stone-100/70 dark:bg-stone-800/50 rounded-lg px-3 py-2 border border-dashed border-stone-200 dark:border-stone-700">
              與和合本 (CUNP) 相同 · Same as CUNP Bible（此節 JST 與 KJV 原文一致，無須另行翻譯）
            </p>
          ) : (
            <>
              <p
                className={`font-chinese text-stone-900 dark:text-stone-100 leading-relaxed select-text ${fontClass}`}
              >
                {renderJstChinese(verse.jstChinese)}
              </p>
              {renderSelectionPopup('jstChinese')}
              {renderPhraseHighlightChips('jstChinese')}
            </>
          )}
        </div>
      </div>

      {/* Personal Reflection / Study Note Section (Synced across devices when signed in) */}
      {(isEditingNote || savedNoteText) && (
        <div className="mt-4 pt-3.5 border-t border-stone-100 dark:border-stone-800/80">
          {isEditingNote ? (
            <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/70 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  <NotebookPen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>
                    {chineseBookName} {chapterNumber}:{verse.verseNumber} 個人筆記與心得
                  </span>
                </div>
                {user ? (
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    <Cloud className="w-2.5 h-2.5" />
                    {syncStatus === 'offline'
                      ? '離線暫存 · 連網自動跨裝置同步'
                      : '已啟用跨裝置雲端同步'}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    className="text-[10px] text-indigo-700 dark:text-indigo-300 flex items-center gap-1 bg-white/80 dark:bg-stone-900/80 px-2 py-0.5 rounded-md border border-indigo-200/70 dark:border-indigo-800 hover:underline"
                  >
                    <HardDrive className="w-2.5 h-2.5" />
                    目前僅存本機 · 點此登入 Google 跨裝置同步
                  </button>
                )}
              </div>

              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                maxLength={5000}
                rows={3}
                placeholder="記錄您對此節經文的靈修啟發、比較心得或交叉引註..."
                className="w-full rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-stone-900 px-3 py-2 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 leading-relaxed"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  {savedNoteText && (
                    <button
                      type="button"
                      onClick={handleDeleteNote}
                      className="px-2.5 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>刪除筆記</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingNote(false);
                      setNoteDraft(savedNoteText);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{noteDraft.trim() ? '儲存筆記' : '清除筆記'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : savedNoteText ? (
            <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/25 border border-indigo-200/80 dark:border-indigo-900/60">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <NotebookPen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    我的經文筆記 (My Note)
                  </span>
                  {user ? (
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <Cloud className="w-2.5 h-2.5" />
                      已雲端同步
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={signInWithGoogle}
                      className="text-[10px] text-indigo-700/80 dark:text-indigo-300/80 flex items-center gap-1 hover:underline"
                    >
                      <HardDrive className="w-2.5 h-2.5" />
                      本機儲存 · 登入可跨裝置
                    </button>
                  )}
                  {justSavedNote && (
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded-xs">
                      已儲存
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  {annotation?.updatedAt && (
                    <span className="text-[10px] text-stone-400 hidden sm:inline">
                      更新於{' '}
                      {new Date(annotation.updatedAt).toLocaleString('zh-TW', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenNoteEditor}
                    className="px-2 py-1 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/50 rounded-md flex items-center gap-1 transition-colors"
                    title="編輯個人筆記"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>編輯</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteNote}
                    className="p-1 text-stone-400 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors"
                    title="刪除筆記"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 whitespace-pre-wrap leading-relaxed">
                {savedNoteText}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </article>
  );
};
