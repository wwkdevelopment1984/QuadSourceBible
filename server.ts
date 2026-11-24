import http from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { BIBLE_BOOKS, getBookById, buildSourceUrls } from './src/data/bibleBooks.ts';
import { getPreloadedChapter } from './src/data/scriptureData.ts';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini client strictly with server environment variable and required header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: Get all Bible books metadata
app.get('/api/scriptures/books', (_req, res) => {
  res.json({ books: BIBLE_BOOKS });
});

import type { ChapterData, ParallelVerse, BibleBook } from './src/types/scripture.ts';

// Dynamic in-memory cache for chapters fetched from public scriptures
const DYNAMIC_CHAPTER_CACHE: Record<string, ChapterData> = {};

async function fetchChapterFromPublicSources(book: BibleBook, chapterNumber: number): Promise<ChapterData | null> {
  const cacheKey = `${book.id}_${chapterNumber}`;
  if (DYNAMIC_CHAPTER_CACHE[cacheKey]) {
    return DYNAMIC_CHAPTER_CACHE[cacheKey];
  }

  const bookIndex = BIBLE_BOOKS.findIndex((b) => b.id === book.id) + 1; // 1 to 66

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const [kjvRes, cuvRes] = await Promise.allSettled([
      fetch(`https://bible-api.com/${encodeURIComponent(book.name)}+${chapterNumber}?translation=kjv`, {
        signal: controller.signal,
      }),
      fetch(`https://bolls.life/get-chapter/CUV/${bookIndex}/${chapterNumber}/`, {
        signal: controller.signal,
      }),
    ]);

    clearTimeout(timeoutId);

    let kjvVerses: { verse: number; text: string }[] = [];
    if (kjvRes.status === 'fulfilled' && kjvRes.value.ok) {
      const kjvData = await kjvRes.value.json();
      if (Array.isArray(kjvData.verses)) {
        kjvVerses = kjvData.verses.map((v: any) => ({
          verse: v.verse,
          text: (v.text || '').replace(/\s+/g, ' ').trim(),
        }));
      }
    }

    let cuvVerses: { verse: number; text: string }[] = [];
    if (cuvRes.status === 'fulfilled' && cuvRes.value.ok) {
      const cuvData = await cuvRes.value.json();
      if (Array.isArray(cuvData)) {
        cuvVerses = cuvData.map((v: any) => {
          const rawText = (v.text || '').replace(/<[^>]*>/g, '');
          const cleaned = rawText.replace(/\s+/g, '').trim();
          return {
            verse: v.verse,
            text: cleaned,
          };
        });
      }
    }

    if (kjvVerses.length === 0 && cuvVerses.length === 0) {
      return null;
    }

    const maxVerses = Math.max(kjvVerses.length, cuvVerses.length);
    const verses: ParallelVerse[] = [];

    for (let i = 1; i <= maxVerses; i++) {
      const kjv = kjvVerses.find((v) => v.verse === i);
      const cuv = cuvVerses.find((v) => v.verse === i);

      const kText = kjv?.text || `${book.name} ${chapterNumber}:${i}`;
      const cText = cuv?.text || `${book.chineseTraditional} 第${chapterNumber}章 第${i}節`;

      verses.push({
        verseNumber: i,
        chineseCunp: cText,
        kjvText: kText,
        jstText: kText,
        jstChinese: '與和合本 (CUNP) 相同 (Same as CUNP Bible)',
        isDiffFromKjv: false,
      });
    }

    const chapterData: ChapterData = {
      bookId: book.id,
      chapterNumber,
      bookName: book.name,
      chineseBookName: book.chineseTraditional,
      totalVerses: verses.length,
      sourceUrls: buildSourceUrls(book, chapterNumber),
      verses,
    };

    DYNAMIC_CHAPTER_CACHE[cacheKey] = chapterData;
    return chapterData;
  } catch (err) {
    console.warn('Public scripture fetch failed:', err);
    return null;
  }
}

// Endpoint: Get verses for a specific book and chapter
app.get('/api/scriptures/chapter', async (req, res) => {
  const bookId = ((req.query.book as string) || 'JHN').toUpperCase();
  const chapterNumber = parseInt((req.query.chapter as string) || '1', 10);

  const book = getBookById(bookId);
  if (!book) {
    return res.status(404).json({ error: `Book '${bookId}' not found.` });
  }

  // 1. Check preloaded curated chapters first (100% full verses)
  const preloaded = getPreloadedChapter(bookId, chapterNumber);
  if (preloaded) {
    return res.json({ chapter: preloaded, isCached: true });
  }

  // 2. Check dynamic cache
  const cacheKey = `${bookId}_${chapterNumber}`;
  if (DYNAMIC_CHAPTER_CACHE[cacheKey]) {
    return res.json({ chapter: DYNAMIC_CHAPTER_CACHE[cacheKey], isCached: true });
  }

  // 3. Try Gemini AI if API key is provided
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5) {
    try {
      const prompt = `You are an expert biblical scholar and translator with deep knowledge of:
1. The Chinese Union Version with New Punctuation (CUNP 神版) from bible.com
2. The King James Version (KJV) from the Church of Jesus Christ of Latter-day Saints
3. The Joseph Smith Translation (JST / Holy Scriptures Inspired Version) from centerplace.org
4. Modern faithful Chinese translation of the JST text (via Google Translate style).

Generate complete parallel verses for:
Book: ${book.name} (${book.chineseTraditional})
Chapter: ${chapterNumber}
Verses: All consecutive verses of this chapter (or verses 1 to 30 if chapter is long)

Output strict JSON with this exact structure:
{
  "bookId": "${book.id}",
  "chapterNumber": ${chapterNumber},
  "bookName": "${book.name}",
  "chineseBookName": "${book.chineseTraditional}",
  "totalVerses": number,
  "verses": [
    {
      "verseNumber": 1,
      "chineseCunp": "Chinese CUNP text...",
      "kjvText": "English KJV text...",
      "jstText": "English JST / Inspired Version text...",
      "jstChinese": "If jstText matches kjvText, return '與和合本 (CUNP) 相同 (Same as CUNP Bible)'; otherwise provide faithful Chinese translation of the JST text...",
      "isDiffFromKjv": boolean,
      "notes": "brief note if JST differs"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsedData = JSON.parse(response.text || '{}');
      parsedData.sourceUrls = buildSourceUrls(book, chapterNumber);
      DYNAMIC_CHAPTER_CACHE[cacheKey] = parsedData;

      return res.json({ chapter: parsedData, isCached: false });
    } catch (error) {
      console.warn('Gemini chapter fetch error, falling back to public sources:', error);
    }
  }

  // 4. Fetch full real chapter from public scripture database (CUV Chinese + KJV English)
  const publicChapter = await fetchChapterFromPublicSources(book, chapterNumber);
  if (publicChapter && publicChapter.verses.length > 0) {
    return res.json({ chapter: publicChapter, isCached: false });
  }

  // 5. Resilient structured chapter fallback
  return res.json({
    chapter: {
      bookId: book.id,
      chapterNumber,
      bookName: book.name,
      chineseBookName: book.chineseTraditional,
      totalVerses: 1,
      sourceUrls: buildSourceUrls(book, chapterNumber),
      verses: [
        {
          verseNumber: 1,
          chineseCunp: `${book.chineseTraditional} 第${chapterNumber}章 第1節。請點擊上方來源網址查閱。`,
          kjvText: `${book.name} Chapter ${chapterNumber}, verse 1.`,
          jstText: `${book.name} Chapter ${chapterNumber}, verse 1.`,
          jstChinese: '與和合本 (CUNP) 相同 (Same as CUNP Bible)',
          isDiffFromKjv: false,
        },
      ],
    },
    isCached: false,
  });
});

// Endpoint: Translate custom JST text into Chinese (skips translation when identical to KJV)
app.post('/api/translate-jst', async (req, res) => {
  const { englishText, kjvText, targetLang } = req.body;
  if (!englishText) {
    return res.status(400).json({ error: 'englishText is required' });
  }

  if (kjvText && englishText.trim() === kjvText.trim()) {
    return res.json({ translation: '與和合本 (CUNP) 相同 (Same as CUNP Bible)' });
  }

  try {
    const prompt = `Translate the following biblical scripture passage from the Joseph Smith Translation (JST / Inspired Version) into fluent, dignified sacred Chinese (${targetLang === 'zh-CN' ? 'Simplified 简体中文' : 'Traditional 繁體中文'}). Maintain biblical reverence similar to the Chinese Union Version (和合本):

"${englishText}"

Output only the translated Chinese text without commentary.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ translatedText: (response.text || '').trim() });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Failed to translate passage' });
  }
});

// Endpoint: Analyze doctrinal differences between KJV and JST
app.post('/api/compare-analysis', async (req, res) => {
  const { bookName, chapter, verseNumber, kjvText, jstText } = req.body;

  try {
    const prompt = `You are a biblical scholar specializing in the Joseph Smith Translation (JST) and the King James Version (KJV).
Analyze the doctrinal significance of the textual differences in:
Passage: ${bookName} ${chapter}:${verseNumber}

KJV Text: "${kjvText}"
JST Text: "${jstText}"

Provide a concise, illuminating breakdown (max 150 words) covering:
1. What specific phrases were restored, changed, or clarified.
2. The doctrinal or theological significance for readers.
Include both English and Chinese summaries.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ analysis: response.text });
  } catch (error) {
    console.error('Comparison analysis error:', error);
    res.status(500).json({ error: 'Unable to analyze differences' });
  }
});

// Endpoint: Search biblical person background, major events, and scripture references
app.post('/api/biblical-person', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Query name is required' });
  }

  const trimmed = query.trim();

  // 1. Check preloaded records first
  const { findPreloadedPerson } = await import('./src/data/biblicalPersons.ts');
  const cached = findPreloadedPerson(trimmed);
  if (cached) {
    return res.json({ person: cached, isGenerated: false });
  }

  // 2. Dynamically generate comprehensive biblical biography via Gemini
  try {
    const prompt = `You are an expert biblical historian and theologian familiar with the King James Version, the Chinese Union Version (和合本), and the Joseph Smith Translation (JST / Inspired Version).
Provide a rich, faithful biblical biographical profile for the person named: "${trimmed}" (could be in English or Chinese).

Return strict JSON with this exact schema:
{
  "englishName": "English Name (e.g. David)",
  "chineseName": "Traditional Chinese Name (e.g. 大衛)",
  "nameMeaning": "Meaning of the name in Hebrew/Greek",
  "roleAndEra": "Historical role, title, and estimated era",
  "backgroundStory": "Comprehensive, reverent summary of background story and life in Traditional Chinese (approx 100-150 words)",
  "backgroundStoryEn": "Summary in English (approx 60-90 words)",
  "majorEvents": [
    {
      "title": "English title of major milestone",
      "chineseTitle": "Chinese title of major milestone",
      "description": "Brief description of the event in Chinese",
      "reference": "Scripture citation, e.g. 撒母耳記上 (1 Sam) 17"
    }
  ],
  "jstInsights": "Key doctrinal restorations, clarifications or mentions regarding this person in the Joseph Smith Translation (JST) or LDS scriptures",
  "scriptureReferences": [
    {
      "bookId": "Standard 3-letter Bible book code in caps (e.g. GEN, EXO, 1SA, 2SA, PSA, MAT, JHN, ROM, HEB)",
      "bookName": "English book name (e.g. 1 Samuel)",
      "chineseBookName": "Chinese book name (e.g. 撒母耳記上)",
      "chapter": 17,
      "verseRange": "32-50",
      "description": "Brief description of this scripture reference in Chinese",
      "hasJstDifference": false
    }
  ]
}
Include 4 to 6 major events and 3 to 5 scripture references.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ person: parsed, isGenerated: true });
  } catch (error) {
    console.error('Biblical person search error:', error);
    // Resilient fallback profile
    return res.json({
      person: {
        englishName: trimmed,
        chineseName: trimmed,
        nameMeaning: '聖經人物名 (Biblical Figure)',
        roleAndEra: '聖經新舊約重要人物',
        backgroundStory: `【${trimmed}】是聖經中記載的重要人物。在四部對照閱讀器中，您可以深入查閱該人物在舊約、新約及約瑟·斯密靈感譯本 (JST) 中的相關章節與復興教義。`,
        backgroundStoryEn: `${trimmed} is an important biblical figure recorded in holy scriptures. You can explore parallel verses across Chinese Bible, KJV, JST, and translated JST.`,
        majorEvents: [
          {
            title: 'Biblical Testimony and Calling',
            chineseTitle: '聖經見證與神聖召喚',
            description: `在聖經經文中忠信見證神的作為與應許。`,
            reference: '聖經經卷',
          },
        ],
        jstInsights:
          '約瑟·斯密靈感譯本 (JST) 對諸多聖經人物的生平、聖職權柄與福音見證作了深刻的靈感還原。',
        scriptureReferences: [
          {
            bookId: 'GEN',
            bookName: 'Genesis',
            chineseBookName: '創世記',
            chapter: 1,
            verseRange: '1-5',
            description: '在四部對照閱讀器中查閱經文',
            hasJstDifference: true,
          },
        ],
      },
      isGenerated: false,
    });
  }
});

// Serve frontend in dev and production
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
