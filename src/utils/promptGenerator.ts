import { MobilePromptConfig } from '../types/scripture';
import { getBookById } from '../data/bibleBooks';

export function generateMobileAppPrompt(config: MobilePromptConfig): string {
  const currentBook = getBookById(config.selectedBookId) || {
    name: 'John',
    chineseTraditional: '約翰福音',
    id: 'JHN',
    chaptersCount: 21,
  };

  const frameworkSpecs: Record<string, { name: string; techStack: string; dataLayer: string; uiLib: string }> = {
    flutter: {
      name: 'Flutter (Dart)',
      techStack: 'Flutter 3.x, Dart 3.x, Riverpod / Bloc, Dio, sqflite or Hive',
      dataLayer: 'Local SQLite database bundled with offline assets, paired with Dio HTTP client and Google Cloud Translation API client.',
      uiLib: 'Material 3 design with custom scripture typography and smooth sliver app bars.',
    },
    'react-native': {
      name: 'React Native (Expo + TypeScript)',
      techStack: 'React Native 0.76+, Expo SDK 52+, TypeScript, expo-sqlite, Zustand / TanStack Query',
      dataLayer: 'expo-sqlite for zero-latency offline verse lookup, with Axios for on-demand chapter fetching and Google Translate REST API.',
      uiLib: 'NativeWind / Tailwind CSS with react-native-reanimated for smooth verse card folding.',
    },
    swift: {
      name: 'Swift & SwiftUI (Native iOS)',
      techStack: 'Swift 6, SwiftUI, SwiftData / GRDB.swift, URLSession, AVFoundation (TTS)',
      dataLayer: 'Bundled SQLite via SwiftData / GRDB.swift, background Translation framework / Google Cloud Translation API.',
      uiLib: 'Human Interface Guidelines with SF Pro, New York Serif font, NavigationSplitView, and dynamic type support.',
    },
    kotlin: {
      name: 'Kotlin & Jetpack Compose (Native Android)',
      techStack: 'Kotlin 2.x, Jetpack Compose, Room Database, Ktor / Retrofit, Coroutines & Flow',
      dataLayer: 'Android Room SQLite pre-populated database with pre-compiled verses and Google Cloud Translation v3 API.',
      uiLib: 'Material Design 3 with dynamic theming, Glance widgets, and TalkBack accessibility.',
    },
    'universal-ai': {
      name: 'Universal Full-Stack Mobile Specification',
      techStack: 'Cross-platform Mobile Framework (Flutter / React Native / Native Swift & Kotlin)',
      dataLayer: 'Offline-first SQLite or embedded key-value store with cloud synchronization.',
      uiLib: 'Responsive mobile-first card interface with dark/sepia reading themes.',
    },
  };

  const selectedFw = frameworkSpecs[config.framework] || frameworkSpecs['flutter'];

  return `# SYSTEM PROMPT: Production-Grade Dual-Language Quad-Source Mobile Bible App

You are an expert mobile software engineer specializing in **${selectedFw.name}**.
Your task is to build a complete, production-ready, offline-capable mobile application that presents parallel Bible scriptures from **3 historical sources across two languages** in an exact comparative sequence.

---

## 1. Core Sources & Exact Display Sequence

For every verse displayed in any book and chapter, the user interface **MUST** render the content in this strict sequential order:

1. **First: Chinese Bible (和合本 CUNP - 神版)**
   - Primary Source: \`https://www.bible.com/bible/46/JHN.1.CUNP-%E7%A5%9Eble\` (YouVersion / Bible.com Chinese Union Version with New Punctuation - Shen edition).
   - Display: Primary Chinese scripture text with refined Chinese serif typography (Noto Serif SC/TC).

2. **Second: KSV / KJV Bible (King James Version - LDS Edition)**
   - Primary Source: \`https://www.churchofjesuschrist.org/study/scriptures?lang=eng&platform=web\` (The Church of Jesus Christ of Latter-day Saints English scripture database).
   - Display: Classical English King James text with verse numbering.

3. **Third: JST Bible (Joseph Smith Translation / Holy Scriptures Inspired Version)**
   - Primary Source: \`https://www.centerplace.org/hs/iv/default.htm\` (CenterPlace / RLDS / Community of Christ Inspired Version & LDS JST Appendices).
   - Display: The inspired revisions and expanded prophetic text of Joseph Smith.

4. **Fourth: JST Bible (Google Translate into Chinese)**
   - Translation Method: Translated from the English JST text into fluent modern Chinese using Google Cloud Translation API (or Google Translate engine).
   - Display: Faithful Chinese rendering of the Joseph Smith Translation, allowing Chinese-speaking students to see the specific restorations made in the JST.

---

## 2. Technical Stack & Architecture

- **Platform Target**: ${config.framework === 'swift' ? 'iOS (iPhone & iPad)' : config.framework === 'kotlin' ? 'Android (Phones & Foldables)' : 'Cross-Platform Mobile (iOS & Android)'}
- **Primary Framework**: ${selectedFw.name}
- **Tech Stack**: ${selectedFw.techStack}
- **Storage Strategy**: ${config.storage.toUpperCase()} (${selectedFw.dataLayer})
- **Translation Engine**: ${config.translationEngine === 'google-translate' ? 'Google Cloud Translation API v3' : config.translationEngine === 'gemini-ai' ? 'Gemini 3.8 Flash LLM with theological glossing' : 'Hybrid Google Translate + Gemini refinement'}
- **Offline Capability**: ${config.includeOfflineMode ? 'Full offline access with pre-bundled SQLite database for key comparison books (Genesis, Matthew, John, Romans, James) and persistent cache for downloaded chapters.' : 'On-demand network fetching with local caching.'}
- **Text-to-Speech (TTS)**: ${config.includeTTS ? 'Dual-language audio playback (Mandarin Chinese + English voice synthesis).' : 'Disabled.'}
- **Differences Highlighter**: ${config.includeDiffHighlighter ? 'Visual inline diffing between KJV and JST (highlighting additions and text variations).' : 'Clean reading mode without diff markings.'}

---

## 3. User Navigation & UX Requirements

1. **Book & Chapter Selector**:
   - Quick two-tab switch: **Old Testament (舊約聖經, 39 books)** and **New Testament (新約聖經, 27 books)**.
   - Dual-language labels: e.g. "John / 約翰福音", "Genesis / 創世記".
   - Chapter grid modal / bottom drawer allowing rapid single-tap selection (e.g., currently viewing **${currentBook.name} (${currentBook.chineseTraditional}) Chapter ${config.selectedChapter}**).
   - Fast verse jump bar to jump directly to any verse number.

2. **Verse Presentation Layout**:
   - **Stacked Card Mode (Mobile default)**: Each verse number has an outer container displaying the 4 parallel streams as distinct, beautifully styled sub-sections:
     - 🀄 [Chinese CUNP]: High-legibility Chinese serif font.
     - 📖 [Church KSV/KJV]: Deep charcoal serif typography.
     - 📜 [CenterPlace JST]: Distinctive warm accent with indicator badge if different from KJV.
     - 🌐 [JST Google Translate]: Clear translated Chinese with matching verse reference.
   - **Columnar Grid Mode (Tablet / Landscape)**: Side-by-side 4-column synchronized scrolling.

3. **Reader Customization**:
   - Font scale adjustment (Small 14px, Normal 16px, Large 18px, Reading 21px).
   - 3 Curated Color Themes:
     - *Parchment White*: Clean neutral paper background (#FAFAF9) with dark stone text.
     - *Sepia Warm*: Traditional scripture study tone (#F7F3E8 / #3E3328).
     - *Night Slate*: Eye-comfort OLED dark mode (#0F172A / #F1F5F9).
   - Chinese script preference: **${config.chineseVariant === 'traditional' ? 'Traditional Chinese (繁體中文)' : 'Simplified Chinese (简体中文)'}**.

---

## 4. Data Ingestion & API Scraping Schema

Implement an ingestion pipeline or backend proxy that manages these three external endpoints:

\`\`\`json
{
  "bookId": "${currentBook.id}",
  "chapter": ${config.selectedChapter},
  "sources": {
    "churchKjv": "https://www.churchofjesuschrist.org/study/scriptures/${currentBook.id.toLowerCase()}/${config.selectedChapter}?lang=eng",
    "centerplaceJst": "https://www.centerplace.org/hs/iv/default.htm",
    "bibleComChinese": "https://www.bible.com/bible/46/${currentBook.id}.${config.selectedChapter}.CUNP-%E7%A5%9E"
  },
  "schema": [
    {
      "verse": 1,
      "alignmentType": "matched | jst-expanded | jst-only",
      "kjvVerseRef": "1 or '24–26' or null (when jst-only)",
      "chineseCunp": "String | null (from bible.com CUNP; null if jst-only addition)",
      "kjvText": "String | null (from churchofjesuschrist.org; null if jst-only addition)",
      "jstText": "String (from centerplace.org)",
      "jstChinese": "String (via Google Cloud Translation API of jstText)",
      "isDiffFromKjv": true
    }
  ]
}
\`\`\`

### Handling JST Additional Verses (e.g., Genesis 50:27–38 & Genesis 14:25–40)
- **Verse Numbering Driven by JST Superset**: When JST contains more verses than KJV (e.g., Gen 50 has 38 verses in JST vs. 26 in KJV; Gen 14 has 40 vs. 24), render one aligned card per JST verse (\`1..max(KJV, JST)\`).
- **\`matched\`**: Both KJV/Chinese CUNP and JST exist 1:1.
- **\`jst-expanded\`**: KJV verse exists, while JST expands the passage significantly (display KJV ref badge + diff highlight).
- **\`jst-only\` (JST Standalone Mode)**: Verse exists exclusively in the Joseph Smith Translation (\`chineseCunp = null\`, \`kjvText = null\`). When both KJV and CUNP do not exist, omit Streams 1 & 2 completely and render **JST Standalone** showing only **JST English (CenterPlace)** and **JST Google Translate Chinese** (using a 2-column grid in landscape/tablet mode or clean 2-section card on mobile).

---

## 5. Google Translate Service Integration

\`\`\`typescript
// Google Cloud Translation API Service Helper
import { v2 as Translate } from '@google-cloud/translate';

export class JstTranslationService {
  private client: any;

  constructor(apiKey: string) {
    this.client = new Translate({ key: apiKey });
  }

  async translateJstVerse(
    englishJst: string,
    englishKjv: string | null,
    targetLang: 'zh-TW' | 'zh-CN'
  ): Promise<string> {
    // No need to translate when JST matches KJV; indicate same as CUNP Bible
    if (englishKjv && englishJst.trim() === englishKjv.trim()) {
      return '與和合本 (CUNP) 相同 (Same as CUNP Bible)';
    }

    try {
      const [translation] = await this.client.translate(englishJst, {
        from: 'en',
        to: targetLang === 'zh-TW' ? 'zh-TW' : 'zh-CN',
        format: 'text',
      });
      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      return englishJst; // Fallback
    }
  }
}
\`\`\`

---

## 6. Implementation Deliverables

Please output:
1. Complete project file structure with clean separation of domain entities, repositories, and UI screens (cross-platform mobile + offline PWA support for Windows, Mac, Linux, phone, and tablet).
2. The SQLite / IndexedDB offline database schema & migrations for verses, biblical figures, and local-only personal verse notes (\`user_verse_notes\`).
3. First-page Old/New Testament Selection Portal, persistent reading position resume, and Book & Chapter Picker widget/screen with responsive thumb navigation.
4. The Parallel Verse Reader screen implementing the exact 4-stream order:
   **(1) Chinese CUNP -> (2) KSV Bible -> (3) JST Bible -> (4) JST Google Translate**, automatic **JST Standalone mode** when KJV/CUNP do not exist, and **"Same as CUNP Bible"** notice when JST matches KJV.
5. Inline local-only Personal Verse Notes editor inside each Verse Card, Biblical Person Explorer (English/Chinese search), and Settings sheet for Theme, Font Size, View Mode, Chinese Variant, and Offline Book Cache Management.
`;
}
