import type { ChapterData } from '../types/scripture.ts';
import { JOHN_CHAPTER_1 } from './chapters/john1.ts';
import { GENESIS_CHAPTER_1 } from './chapters/genesis1.ts';
import { GENESIS_CHAPTER_14 } from './chapters/genesis14.ts';
import { GENESIS_CHAPTER_50 } from './chapters/genesis50.ts';
import { JAMES_CHAPTER_1 } from './chapters/james1.ts';
import { MATTHEW_CHAPTER_5 } from './chapters/matthew5.ts';
import { PSALM_CHAPTER_23 } from './chapters/psalm23.ts';
import { DANIEL_CHAPTER_3 } from './chapters/daniel3.ts';

export const PRELOADED_CHAPTERS: Record<string, ChapterData> = {
  // Complete John 1: ALL 51 verses with all 4 streams & JST restorations
  'JHN_1': JOHN_CHAPTER_1,
  // Complete Genesis 1: ALL 31 verses with all 4 streams & Moses 2 JST
  'GEN_1': GENESIS_CHAPTER_1,
  // Complete Genesis 14: 24 KJV verses + 16 JST-only additional verses (vv. 25–40 Melchizedek Priesthood)
  'GEN_14': GENESIS_CHAPTER_14,
  // Complete Genesis 50: 26 KJV verses + 12 JST-only additional verses (vv. 27–38 Choice Seer Prophecy)
  'GEN_50': GENESIS_CHAPTER_50,
  // Complete James 1: ALL 27 verses with all 4 streams (inc. James 1:5 First Vision link)
  'JAS_1': JAMES_CHAPTER_1,
  // Complete Matthew 5: ALL 48 verses with all 4 streams (Sermon on the Mount Beatitudes & JST covenants)
  'MAT_5': MATTHEW_CHAPTER_5,
  // Complete Psalm 23: ALL 6 verses
  'PSA_23': PSALM_CHAPTER_23,
  // Complete Daniel 3: ALL 30 verses (Shadrach, Meshach, Abednego, and the Son of God in the fiery furnace)
  'DAN_3': DANIEL_CHAPTER_3,
};

export function getPreloadedChapter(bookId: string, chapter: number): ChapterData | null {
  const key = `${bookId.toUpperCase()}_${chapter}`;
  return PRELOADED_CHAPTERS[key] || null;
}
