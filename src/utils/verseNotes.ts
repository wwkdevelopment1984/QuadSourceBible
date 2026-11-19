import {
  buildAnnotationKey,
  loadLocalAnnotations,
  saveLocalAnnotationsMap,
  VerseAnnotation,
} from './annotations';

export interface VerseNoteEntry {
  key: string;
  bookId: string;
  chapterNumber: number;
  verseNumber: number;
  text: string;
  updatedAt: number;
}

export const VERSE_NOTES_UPDATED_EVENT = 'quad-verse-notes-updated';

export function buildVerseNoteKey(
  bookId: string,
  chapterNumber: number,
  verseNumber: number
): string {
  return buildAnnotationKey(bookId, chapterNumber, verseNumber);
}

export function getVerseNote(
  bookId: string,
  chapterNumber: number,
  verseNumber: number
): VerseNoteEntry | null {
  const key = buildAnnotationKey(bookId, chapterNumber, verseNumber);
  const all = loadLocalAnnotations();
  const item = all[key];
  if (!item || !item.noteText.trim()) return null;
  return {
    key: item.key,
    bookId: item.bookId,
    chapterNumber: item.chapterNumber,
    verseNumber: item.verseNumber,
    text: item.noteText,
    updatedAt: item.updatedAt,
  };
}

export function saveVerseNote(
  bookId: string,
  chapterNumber: number,
  verseNumber: number,
  text: string
): VerseNoteEntry | null {
  const key = buildAnnotationKey(bookId, chapterNumber, verseNumber);
  const all = loadLocalAnnotations();
  const existing: VerseAnnotation = all[key] || {
    key,
    bookId: bookId.trim().toUpperCase(),
    chapterNumber,
    verseNumber,
    highlightColor: 'none',
    noteText: '',
    textHighlights: [],
    updatedAt: Date.now(),
  };

  const trimmed = text.trim().slice(0, 5000);
  const updated: VerseAnnotation = {
    ...existing,
    noteText: trimmed,
    updatedAt: Date.now(),
  };

  if (updated.highlightColor === 'none' && !updated.noteText && updated.textHighlights.length === 0) {
    delete all[key];
  } else {
    all[key] = updated;
  }

  saveLocalAnnotationsMap(all);
  window.dispatchEvent(new CustomEvent(VERSE_NOTES_UPDATED_EVENT));

  if (!trimmed) return null;
  return {
    key: updated.key,
    bookId: updated.bookId,
    chapterNumber: updated.chapterNumber,
    verseNumber: updated.verseNumber,
    text: updated.noteText,
    updatedAt: updated.updatedAt,
  };
}
