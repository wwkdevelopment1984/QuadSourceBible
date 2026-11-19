import { BibleBook, ChapterData } from '../types/scripture';
import { getPreloadedChapter } from '../data/scriptureData';
import { getChapterOffline, saveChapterOffline } from './offlineCache';

export interface LoadedChapterResult {
  chapter: ChapterData;
  fromOffline: boolean;
}

/**
 * Loads a chapter using the 3-tier pipeline:
 * 1. Bundled curated chapters (instant offline)
 * 2. IndexedDB offline cache (plus silent background refresh when online)
 * 3. Server API (/api/scriptures/chapter) with IndexedDB caching & offline placeholder fallback
 */
export async function loadChapterWithCache(
  book: BibleBook,
  chapterNum: number,
  onCacheUpdated?: () => void
): Promise<LoadedChapterResult> {
  // 1. Check bundled curated chapters first
  const preloaded = getPreloadedChapter(book.id, chapterNum);
  if (preloaded) {
    return { chapter: preloaded, fromOffline: true };
  }

  // 2. Check IndexedDB offline cache
  const offlineCached = await getChapterOffline(book.id, chapterNum);
  if (offlineCached && offlineCached.verses && offlineCached.verses.length > 0) {
    if (navigator.onLine) {
      fetch(`/api/scriptures/chapter?book=${book.id}&chapter=${chapterNum}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.chapter?.verses?.length > 1) {
            saveChapterOffline(book.id, chapterNum, data.chapter);
            onCacheUpdated?.();
          }
        })
        .catch(() => {});
    }
    return { chapter: offlineCached, fromOffline: true };
  }

  // 3. Fetch from server endpoint & store in IndexedDB offline cache
  try {
    const res = await fetch(`/api/scriptures/chapter?book=${book.id}&chapter=${chapterNum}`);
    if (!res.ok) throw new Error('Failed to load chapter');
    const data = await res.json();
    if (data.chapter?.verses?.length > 0) {
      await saveChapterOffline(book.id, chapterNum, data.chapter);
      onCacheUpdated?.();
    }
    return { chapter: data.chapter, fromOffline: false };
  } catch (err) {
    console.warn('Offline or backend fetch failed:', err);
    return {
      fromOffline: false,
      chapter: {
        bookId: book.id,
        chapterNumber: chapterNum,
        bookName: book.name,
        chineseBookName: book.chineseTraditional,
        totalVerses: 1,
        sourceUrls: {
          churchKjv: `https://www.churchofjesuschrist.org/study/scriptures/${book.churchSlug}/${chapterNum}?lang=eng`,
          centerplaceJst: 'https://www.centerplace.org/hs/iv/default.htm',
          bibleComChinese: `https://www.bible.com/bible/46/${book.bibleComCode}.${chapterNum}.CUNP-%E7%A5%9E`,
        },
        verses: [
          {
            verseNumber: 1,
            chineseCunp: `${book.chineseTraditional} 第${chapterNum}章 尚未下載至本機離線書庫。請連網後開啟此章或點擊「離線下載本書」即可永久離線瀏覽。`,
            kjvText: `${book.name} Chapter ${chapterNum} is not yet saved in your offline cache. Connect to the internet once to save it for offline study.`,
            jstText: `${book.name} Chapter ${chapterNum} — Offline cache pending.`,
            jstChinese: `${book.chineseTraditional} 第${chapterNum}章（待連網快取）。`,
            isDiffFromKjv: false,
          },
        ],
      },
    };
  }
}
