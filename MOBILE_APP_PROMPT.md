# MASTER PROMPT: Production-Grade Dual-Language Quad-Source Mobile Bible App
**Target AI Tools**: Cursor, Claude 3.7 / 3.5 Sonnet, Google AI Studio, ChatGPT (GPT-4o), Lovable, v0
**Target Frameworks**: Flutter (Dart) | React Native (Expo + TypeScript) | Swift (SwiftUI) | Kotlin (Jetpack Compose)

---

## 1. Project Overview & Core Mission

You are an expert mobile software architect and senior mobile engineer.
Your task is to build a complete, production-ready, offline-first mobile application that presents parallel Bible scriptures from **3 historical sources across two languages** in a strict comparative sequence, along with a **Biblical Figure Explorer (人物生平事蹟查經)**.

### The 3 Primary Sources & Google Translate Integration

1. **Chinese Bible**:
   - URL: `https://www.bible.com/bible/46/JHN.1.CUNP-%E7%A5%9Eble`
   - Translation: Chinese Union Version with New Punctuation (CUNP - 神版, 和合本).
   - Platform: YouVersion / Bible.com.

2. **KSV / KJV Bible (King James Version - LDS Edition)**:
   - URL: `https://www.churchofjesuschrist.org/study/scriptures?lang=eng&platform=web`
   - Translation: Official English King James Bible published by The Church of Jesus Christ of Latter-day Saints.

3. **JST Bible (Joseph Smith Translation / Holy Scriptures Inspired Version)**:
   - URL: `https://www.centerplace.org/hs/iv/default.htm`
   - Translation: The Inspired Version revisions produced by the Prophet Joseph Smith (1830–1833), preserved by CenterPlace / Community of Christ and LDS JST Appendices.

4. **JST Bible (Google Translate into Chinese)**:
   - Translation Method: Google Cloud Translation API v3 (or Google Translate engine).
   - Purpose: Translates the English JST text into dignified, faithful Chinese, allowing Chinese-speaking students to see the specific restorations and expansions made in the JST.

---

## 2. Strict Verse Presentation Order (Non-Negotiable)

For every verse displayed in any book and chapter, the user interface **MUST** render the content in this exact sequential order:

```
+--------------------------------------------------------------------------+
| Verse Number [ N ]                                                       |
+--------------------------------------------------------------------------+
| 1. 中文聖經 (和合本 CUNP·神版)                                            |
|    來源: bible.com (CUNP-神版)                                            |
|    Text: 太初有道，道與神同在，道就是神。                                   |
+--------------------------------------------------------------------------+
| 2. KSV / KJV Bible (Church of Jesus Christ Scriptures)                   |
|    來源: churchofjesuschrist.org                                          |
|    Text: In the beginning was the Word, and the Word was with God, and  |
|          the Word was God.                                               |
+--------------------------------------------------------------------------+
| 3. JST Bible (CenterPlace Inspired Version)                              |
|    來源: centerplace.org/hs/iv/default.htm                                |
|    Text: In the beginning was the gospel preached through the Son. And   |
|          the gospel was the word, and the word was with the Son...       |
|    [Badge: JST 修訂高亮]                                                  |
+--------------------------------------------------------------------------+
| 4. JST 聖經（谷歌翻譯中文版 Google Translate）                             |
|    來源: Google Cloud Translation API v3                                  |
|    Text: 太初藉著兒子傳揚福音。福音就是那話語，話語與兒子同在...             |
+--------------------------------------------------------------------------+
```

### Alignment & Translation Rules
1. **Matched Verses (Exist in CUNP, KJV, and JST)**: Render all **4 streams together** in the exact order above (4 columns on wide tablet/desktop; stacked 4 sections on mobile).
2. **JST-Only Additional Verses (Do Not Exist in KJV & CUNP, e.g., Gen 50:27–38, Gen 14:25–40)**: Switch automatically to **JST Standalone Mode** — omit Streams 1 & 2 completely and render **only Stream 3 (JST English)** + **Stream 4 (JST Google Translated Chinese)** (2 columns on desktop/tablet).
3. **Skip Redundant Translation**: If a JST verse is identical to the KJV verse, do **not** call Google Translate; simply indicate **"Same as CUNP Bible / 與和合本 (CUNP) 相同"**.

---

## 3. Core Feature Specifications

### A. First Run Testament Selection & Reading Position Persistence
- **First Launch Experience (首頁選約)**:
  - When the app is opened for the first time, present a prominent **Testament Selection Portal** allowing the user to select **Old Testament (舊約聖經, 39 books)** or **New Testament (新約聖經, 27 books)**.
  - Step 2: Show the books belonging to that testament, with category groupings (摩西五經, 歷史書, 詩歌智慧書, 先知書 vs 四福音書, 教會歷史, 保羅書信, 普通書信, 啟示錄) and quick search.
  - Step 3: Select chapter (1 to N grid), opening the 4-stream comparative reader.
- **Persistent Reading Position (自動記錄與恢復閱讀進度)**:
  - Save the last read book and chapter automatically to offline storage (`SharedPreferences` / `NSUserDefaults` / `MMKV` / SQLite).
  - Next time the app opens, **automatically restore and display the exact position where the user was reading**, accompanied by a toast or banner ("已恢復上次閱讀進度").
- **Return to Testament Selection (隨時返回首頁選新舊約)**:
  - Provide a permanent action button in the top navigation bar, chapter header, and bottom navigation ("選新舊約 / OT·NT Portal").
  - Tapping this allows the user to immediately go back to the first page to choose between Old and New Testament or select any other book.
- **Book & Chapter In-Reader Navigation**:
  - Supports all **66 Books of the Holy Bible** (Old Testament 39, New Testament 27).
  - Dual-language labels: e.g., "John / 約翰福音", "Genesis / 創世記", "Romans / 羅馬書".
  - Quick book switcher bottom sheet/modal and horizontal verse jump carousel (1 to N).

### B. Biblical Figure Explorer (中英文人物生平與經文索引)
- Users can input any biblical person's name in **English or Chinese** (e.g., `Moses` / `摩西`, `John` / `約翰`, `Jesus Christ` / `耶穌基督`, `Abraham` / `亞伯拉罕`, `Enoch` / `以諾`, `Paul` / `保羅`, `Peter` / `彼得`, `David` / `大衛`, `Solomon` / `所羅門`, `Elijah` / `以利亞`, `Joseph` / `約瑟`, `Adam` / `亞當`).
- Displays:
  1. **Original Name Meaning**: Hebrew/Greek etymology (e.g., Moses: "從水中拉出來" / Drawn out of water).
  2. **Role & Epoch**: Historical title, biblical era, and calling.
  3. **Background Story Summary**: Reverent narrative of their life in Traditional/Simplified Chinese and English.
  4. **Major Events Timeline**: Chronological milestone cards detailing key life events with exact scripture citations.
  5. **JST Theological Insights**: Restorations and clarifications from the Joseph Smith Translation regarding this person.
  6. **Related Major Scriptures**: Interactive scripture list with **"在閱讀器開啟 (Open in Reader)"** buttons that immediately jump to that chapter in the 4-stream comparative reader.
  7. **Audio TTS**: Speech synthesis button to listen to the biography read aloud.

### C. JST Difference Highlighter
- Visual indicator badge on verses where JST differs from KJV.
- Amber/yellow text highlighting over words and phrases added, modified, or restored in the JST and its Chinese translation.
- "差異釋義" (Doctrinal Analysis) action button on revised verses explaining the theological significance.

### D. Audio Pronunciation (Text-to-Speech)
- Dual-language audio playback:
  - Mandarin Chinese TTS for Stream 1 (CUNP) and Stream 4 (JST Chinese).
  - English TTS for Stream 2 (KJV) and Stream 3 (JST).

### E. Reader Customization & Themes
- Font size adjustments (14px, 16px, 18px, 21px).
- 3 Curated Color Themes:
  - *Parchment White*: Clean neutral paper background (#FAFAF9) with dark stone text.
  - *Sepia Warm*: Traditional scripture study tone (#F7F3E8 / #3E3328).
  - *Night Slate*: Eye-comfort OLED dark mode (#0F172A / #F1F5F9).
- Chinese Script preference: Traditional Chinese (繁體中文) or Simplified Chinese (简体中文).

### F. Offline-First & Cross-Platform Capability
- Runs seamlessly across **Windows, Mac, Linux, phones, and tablets** (installable PWA on desktop/mobile + native builds).
- Full **offline execution**: Service Worker asset precaching + bundled key chapters + **IndexedDB / SQLite** persistence for all opened chapters and a **"Download Entire Book Offline (離線下載本書)"** button, paired with a live offline status indicator.

### G. Local-Only Personal Verse Notes (本機靈修筆記)
- Every verse card includes an inline **"筆記 / Personal Note"** editor and saved-note viewer persisted strictly in **local-only storage (`localStorage` / local SQLite, never uploaded)**.
- Displays last-updated timestamp, quick Edit/Delete actions, includes saved notes when copying verses, highlights annotated verses in the chapter jump bar, and provides a **"Show Noted Verses Only"** chapter filter.

---

## 4. Mobile Architecture & Database Schema

### SQLite Offline Schema

```sql
-- Books Table
CREATE TABLE bible_books (
  id TEXT PRIMARY KEY,               -- e.g. 'JHN'
  name_en TEXT NOT NULL,             -- e.g. 'John'
  name_zh_tw TEXT NOT NULL,          -- e.g. '約翰福音'
  name_zh_cn TEXT NOT NULL,          -- e.g. '约翰福音'
  testament TEXT NOT NULL,           -- 'OT' or 'NT'
  chapters_count INTEGER NOT NULL,
  church_slug TEXT NOT NULL,
  bible_com_code TEXT NOT NULL
);

-- Parallel Verses Table (Accommodates JST-Only Additional Verses)
CREATE TABLE parallel_verses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id TEXT NOT NULL REFERENCES bible_books(id),
  chapter_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  alignment_type TEXT NOT NULL DEFAULT 'matched', -- 'matched' | 'jst_expanded' | 'jst_only'
  kjv_verse_ref TEXT,                             -- e.g. 'Maps to KJV 50:24' or 'JST Addition (+)'
  chinese_cunp TEXT,                              -- Stream 1: bible.com CUNP (NULL when jst_only)
  kjv_text TEXT,                                  -- Stream 2: churchofjesuschrist.org (NULL when jst_only)
  jst_text TEXT NOT NULL,                         -- Stream 3: centerplace.org (Always populated)
  jst_chinese TEXT NOT NULL,                      -- Stream 4: Google Translated Chinese (Always populated)
  is_diff_from_kjv BOOLEAN DEFAULT 0,
  notes TEXT
);

CREATE INDEX idx_verses_lookup ON parallel_verses(book_id, chapter_number, verse_number);

-- Handling Additional JST Verses (e.g., Genesis 50:27-38, Genesis 14:25-40):
-- 1. Keep Stream 1 & Stream 2 nullable so JST-only verses do NOT duplicate or misalign KJV verses.
-- 2. When a verse exists in KJV, CUNP, and JST, render all 4 streams together. When a verse does NOT
--    exist in KJV and CUNP (jst_only), omit Streams 1 & 2 and render JST Standalone (JST English +
--    JST Google Translate Chinese only, with a "+ JST Standalone" badge).
-- 3. When a JST verse is identical to the KJV text, skip translation and simply indicate
--    "Same as CUNP Bible / 與和合本 (CUNP) 相同".
-- 4. Support chapter-level verse count metadata (kjv_verse_count vs jst_verse_count) and a filter
--    pill ("Show JST Revisions & Additions Only").

-- Biblical Figures Table
CREATE TABLE biblical_persons (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  name_meaning TEXT,
  role_and_era TEXT,
  background_story_zh TEXT NOT NULL,
  background_story_en TEXT,
  jst_insights TEXT
);

-- Person Major Events Table
CREATE TABLE person_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id TEXT NOT NULL REFERENCES biblical_persons(id),
  order_index INTEGER NOT NULL,
  title_en TEXT NOT NULL,
  title_zh TEXT NOT NULL,
  description_zh TEXT NOT NULL,
  reference TEXT NOT NULL
);

-- Person Scripture References Table
CREATE TABLE person_scriptures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id TEXT NOT NULL REFERENCES biblical_persons(id),
  book_id TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_range TEXT,
  description TEXT NOT NULL,
  has_jst_diff BOOLEAN DEFAULT 0
);
-- Local-Only Personal Verse Notes Table (Never synced externally unless explicitly exported by user)
CREATE TABLE user_verse_notes (
  note_key TEXT PRIMARY KEY,           -- e.g. 'JHN_1_5'
  book_id TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  note_text TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
```

---

## 5. Google Translate Service Implementation

```typescript
// Google Cloud Translation API Service (Node.js / Mobile Backend Proxy)
import { v2 as Translate } from '@google-cloud/translate';

export class JstTranslationPipeline {
  private translateClient: any;

  constructor(apiKey: string) {
    this.translateClient = new Translate({ key: apiKey });
  }

  async translateJstVerse(
    englishJstText: string,
    englishKjvText: string | null,
    targetLanguage: 'zh-TW' | 'zh-CN' = 'zh-TW'
  ): Promise<string> {
    // Skip redundant translation when JST is identical to KJV
    if (englishKjvText && englishJstText.trim() === englishKjvText.trim()) {
      return '與和合本 (CUNP) 相同 (Same as CUNP Bible)';
    }

    try {
      const [translation] = await this.translateClient.translate(englishJstText, {
        from: 'en',
        to: targetLanguage,
        format: 'text',
      });
      return translation;
    } catch (error) {
      console.error('Google Translation error:', error);
      return englishJstText; // Fallback
    }
  }
}
```

---

## 6. Framework-Specific Implementation Instructions

### For Flutter (Dart)
- Use `sqflite` for local verse querying, `flutter_riverpod` for state management, and `flutter_tts` for dual-language speech.
- Use `google_fonts` with Noto Serif TC and Source Serif 4.
- Implement `SliverAppBar` with sticky chapter indicators and custom `Card` widgets rendering the 4 streams.

### For React Native (Expo)
- Use `expo-sqlite` for offline verses, `zustand` for state management, and `expo-speech` for TTS.
- Implement NativeWind (Tailwind CSS) with custom theme context (`parchment`, `sepia`, `night`).
- Use `FlashList` for high-performance virtualized scrolling of chapter verses.

### For Swift (SwiftUI - iOS)
- Use SwiftData or `GRDB.swift` for SQLite persistence.
- Implement `AVSpeechSynthesizer` supporting `zh-TW` and `en-US` voices.
- Use native `NavigationSplitView` and `.fontDesign(.serif)`.

### For Kotlin (Jetpack Compose - Android)
- Use Room Database with pre-packaged database assets.
- Implement `TextToSpeech` with Locale.TRADITIONAL_CHINESE and Locale.US.
- Use Material 3 `ElevatedCard` with custom typography styles.

---

## 7. Deliverables Checklist
1. Clean project directory structure following standard architecture (Domain, Data, UI).
2. Pre-populated offline database containing complete key chapters (John 1, Genesis 1, Genesis 14, Genesis 50, Matthew 5, James 1, Psalm 23, Daniel 3) plus on-demand full-chapter caching and biblical figures.
3. First-page Testament Selection Portal (OT vs NT), persistent reading position resume, and Book & Chapter picker modal with search.
4. Parallel Verse Card component with exact 4-stream layout **(1) Chinese CUNP -> (2) KSV Bible -> (3) JST Bible -> (4) JST Google Translate**, automatic **JST Standalone mode** when KJV/CUNP do not exist, and **"Same as CUNP Bible"** notice when JST matches KJV.
5. Local-only per-verse personal notes editor (`localStorage` / local SQLite) with chapter jump indicators and note filtering.
6. Biblical Person Search & Explorer modal (English & Chinese) with background summary, event timeline, and direct scripture navigation.
7. Offline support (PWA Service Worker + IndexedDB / SQLite book download + offline status indicator) across Windows, Mac, Linux, phones, and tablets.
8. Settings modal for themes, font size, view mode (cards vs columns), and Chinese variant toggling.
