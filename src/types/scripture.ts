export type Testament = 'OT' | 'NT';

export interface BibleBook {
  id: string; // e.g. "JHN", "GEN", "MAT"
  name: string; // e.g. "John"
  chineseTraditional: string; // e.g. "約翰福音"
  chineseSimplified: string; // e.g. "约翰福音"
  abbreviation: string; // e.g. "Jn"
  chineseAbbr: string; // e.g. "約"
  testament: Testament;
  chaptersCount: number;
  churchSlug: string; // e.g. "nt/john"
  centerplaceSlug: string; // e.g. "john"
  bibleComCode: string; // e.g. "JHN"
}

export type VerseAlignmentType = 'matched' | 'jst-expanded' | 'jst-only';

export interface ParallelVerse {
  verseNumber: number;
  // Alignment classification when JST expands or adds verses beyond KJV/CUNP
  alignmentType?: VerseAlignmentType;
  // Optional reference note showing KJV mapping (e.g. "Maps to KJV Gen 50:24" or "JST Addition (+)")
  kjvVerseRef?: string;
  // 1. Chinese Bible from bible.com (CUNP 神版) — null when verse is JST-only addition
  chineseCunp: string | null;
  // 2. KSV / KJV Bible from churchofjesuschrist.org — null when verse is JST-only addition
  kjvText: string | null;
  // 3. JST Bible from centerplace.org (Inspired Version)
  jstText: string;
  // 4. JST Bible translated into Chinese (via Google Translate)
  jstChinese: string;
  // Metadata for comparative analysis
  isDiffFromKjv: boolean;
  notes?: string;
}

export interface ChapterSourceUrls {
  churchKjv: string;
  centerplaceJst: string;
  bibleComChinese: string;
}

export interface ChapterData {
  bookId: string;
  chapterNumber: number;
  bookName: string;
  chineseBookName: string;
  totalVerses: number;
  kjvVerseCount?: number;
  jstVerseCount?: number;
  verses: ParallelVerse[];
  sourceUrls: ChapterSourceUrls;
}

export type MobileFramework = 'flutter' | 'react-native' | 'swift' | 'kotlin' | 'universal-ai';
export type StorageStrategy = 'sqlite' | 'firestore' | 'rest-api' | 'offline-hybrid';
export type TranslationEngine = 'google-translate' | 'gemini-ai' | 'both';
export type ReaderTheme = 'parchment' | 'sepia' | 'night';
export type FontSize = 'sm' | 'base' | 'lg' | 'xl';
export type ChineseVariant = 'traditional' | 'simplified';
export type ViewMode = 'cards' | 'columns' | 'compact';

export interface MobilePromptConfig {
  framework: MobileFramework;
  storage: StorageStrategy;
  translationEngine: TranslationEngine;
  includeTTS: boolean;
  includeDiffHighlighter: boolean;
  includeOfflineMode: boolean;
  includeSearch: boolean;
  chineseVariant: ChineseVariant;
  selectedBookId: string;
  selectedChapter: number;
}

export interface ScriptureReference {
  bookId: string;
  bookName: string;
  chineseBookName: string;
  chapter: number;
  verseRange?: string;
  description: string;
  hasJstDifference?: boolean;
}

export interface MajorEvent {
  title: string;
  chineseTitle: string;
  description: string;
  reference: string;
}

export interface BiblicalPerson {
  englishName: string;
  chineseName: string;
  nameMeaning?: string;
  roleAndEra: string;
  backgroundStory: string;
  backgroundStoryEn?: string;
  majorEvents: MajorEvent[];
  jstInsights?: string;
  scriptureReferences: ScriptureReference[];
}
