export type HighlightColor = 'none' | 'amber' | 'emerald' | 'sky' | 'rose';
export type ActiveHighlightColor = Exclude<HighlightColor, 'none'>;
export type AnnotationStream = 'cunp' | 'kjv' | 'jst' | 'jstChinese';

export interface TextHighlight {
  stream: AnnotationStream;
  quote: string;
  color: ActiveHighlightColor;
}

export interface VerseAnnotation {
  key: string; // e.g. "JHN_1_1"
  bookId: string;
  chapterNumber: number;
  verseNumber: number;
  highlightColor: HighlightColor;
  noteText: string;
  textHighlights: TextHighlight[];
  updatedAt: number;
}

export const HIGHLIGHT_COLOR_CONFIG: Record<
  ActiveHighlightColor,
  {
    label: string;
    englishLabel: string;
    swatchClass: string;
    cardClass: string;
    markClass: string;
  }
> = {
  amber: {
    label: '金黃啟示',
    englishLabel: 'Gold',
    swatchClass: 'bg-amber-400 border-amber-500',
    cardClass:
      'border-l-4 border-l-amber-500 bg-amber-50/45 dark:bg-amber-950/20',
    markClass:
      'bg-amber-200/90 dark:bg-amber-700/60 text-stone-950 dark:text-amber-50 rounded-xs px-0.5',
  },
  emerald: {
    label: '翠綠恩典',
    englishLabel: 'Green',
    swatchClass: 'bg-emerald-400 border-emerald-500',
    cardClass:
      'border-l-4 border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20',
    markClass:
      'bg-emerald-200/90 dark:bg-emerald-700/60 text-stone-950 dark:text-emerald-50 rounded-xs px-0.5',
  },
  sky: {
    label: '天藍聖約',
    englishLabel: 'Blue',
    swatchClass: 'bg-sky-400 border-sky-500',
    cardClass:
      'border-l-4 border-l-sky-500 bg-sky-50/45 dark:bg-sky-950/20',
    markClass:
      'bg-sky-200/90 dark:bg-sky-700/60 text-stone-950 dark:text-sky-50 rounded-xs px-0.5',
  },
  rose: {
    label: '玫瑰重點',
    englishLabel: 'Rose',
    swatchClass: 'bg-rose-400 border-rose-500',
    cardClass:
      'border-l-4 border-l-rose-500 bg-rose-50/40 dark:bg-rose-950/20',
    markClass:
      'bg-rose-200/90 dark:bg-rose-700/60 text-stone-950 dark:text-rose-50 rounded-xs px-0.5',
  },
};

const STORAGE_KEY_ANNOTATIONS = 'quad_scripture_annotations_v1';
const LEGACY_NOTES_STORAGE_KEY = 'quad_scripture_verse_notes_v1';

const VALID_HIGHLIGHT_COLORS = new Set<HighlightColor>([
  'none',
  'amber',
  'emerald',
  'sky',
  'rose',
]);
const VALID_ACTIVE_COLORS = new Set<ActiveHighlightColor>([
  'amber',
  'emerald',
  'sky',
  'rose',
]);
const VALID_STREAMS = new Set<AnnotationStream>([
  'cunp',
  'kjv',
  'jst',
  'jstChinese',
]);

export function buildAnnotationKey(
  bookId: string,
  chapterNumber: number,
  verseNumber: number
): string {
  const cleanBook = bookId
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10);
  const safeChapter = Math.max(1, Math.min(200, Math.floor(chapterNumber)));
  const safeVerse = Math.max(1, Math.min(200, Math.floor(verseNumber)));
  return `${cleanBook}_${safeChapter}_${safeVerse}`;
}

export function sanitizeTextHighlights(items: TextHighlight[]): TextHighlight[] {
  const deduped: TextHighlight[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    if (!item || !VALID_STREAMS.has(item.stream) || !VALID_ACTIVE_COLORS.has(item.color)) {
      continue;
    }
    const quote = (item.quote || '').trim().slice(0, 500);
    if (!quote) continue;
    const sig = `${item.stream}::${quote}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    deduped.push({ stream: item.stream, quote, color: item.color });
    if (deduped.length >= 20) break;
  }

  return deduped;
}

export function sanitizeAnnotation(input: VerseAnnotation): VerseAnnotation {
  const cleanBook = input.bookId
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10);
  const safeChapter = Math.max(1, Math.min(200, Math.floor(input.chapterNumber)));
  const safeVerse = Math.max(1, Math.min(200, Math.floor(input.verseNumber)));
  const color = VALID_HIGHLIGHT_COLORS.has(input.highlightColor)
    ? input.highlightColor
    : 'none';
  const noteText = (input.noteText || '').trim().slice(0, 5000);
  const textHighlights = sanitizeTextHighlights(input.textHighlights || []);

  return {
    key: buildAnnotationKey(cleanBook, safeChapter, safeVerse),
    bookId: cleanBook,
    chapterNumber: safeChapter,
    verseNumber: safeVerse,
    highlightColor: color,
    noteText,
    textHighlights,
    updatedAt: input.updatedAt || Date.now(),
  };
}

export function isAnnotationEmpty(annotation: VerseAnnotation): boolean {
  return (
    annotation.highlightColor === 'none' &&
    annotation.noteText.trim().length === 0 &&
    annotation.textHighlights.length === 0
  );
}

export function loadLocalAnnotations(): Record<string, VerseAnnotation> {
  const result: Record<string, VerseAnnotation> = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ANNOTATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        for (const [key, value] of Object.entries(parsed)) {
          if (value && typeof value === 'object') {
            const sanitized = sanitizeAnnotation(value as VerseAnnotation);
            if (!isAnnotationEmpty(sanitized)) {
              result[key] = sanitized;
            }
          }
        }
      }
    }

    // One-way merge of any legacy v1 notes created before highlights were added
    const legacyRaw = localStorage.getItem(LEGACY_NOTES_STORAGE_KEY);
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw);
      if (legacyParsed && typeof legacyParsed === 'object') {
        let migrated = false;
        for (const [legacyKey, entry] of Object.entries(legacyParsed)) {
          const item = entry as {
            bookId?: string;
            chapterNumber?: number;
            verseNumber?: number;
            text?: string;
            updatedAt?: number;
          };
          if (
            item &&
            item.bookId &&
            item.chapterNumber &&
            item.verseNumber &&
            item.text?.trim() &&
            !result[legacyKey]
          ) {
            const sanitized = sanitizeAnnotation({
              key: legacyKey,
              bookId: item.bookId,
              chapterNumber: item.chapterNumber,
              verseNumber: item.verseNumber,
              highlightColor: 'none',
              noteText: item.text,
              textHighlights: [],
              updatedAt: item.updatedAt || Date.now(),
            });
            if (!isAnnotationEmpty(sanitized)) {
              result[sanitized.key] = sanitized;
              migrated = true;
            }
          }
        }
        if (migrated) {
          localStorage.setItem(STORAGE_KEY_ANNOTATIONS, JSON.stringify(result));
        }
      }
    }
  } catch (err) {
    console.warn('Failed to load local annotations:', err);
  }
  return result;
}

export function saveLocalAnnotationsMap(map: Record<string, VerseAnnotation>): void {
  try {
    localStorage.setItem(STORAGE_KEY_ANNOTATIONS, JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to persist local annotations:', err);
  }
}
