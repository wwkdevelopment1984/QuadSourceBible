import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import { BibleBook, ChineseVariant } from '../types/scripture';

interface FloatingStudyControlsProps {
  currentBook: BibleBook;
  currentChapter: number;
  chineseVariant: ChineseVariant;
  studyCount: 1 | 2 | 3 | 4;
  onScrollTopAndSelectBook: () => void;
  onScrollTopOnly: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
}

export const FloatingStudyControls: React.FC<FloatingStudyControlsProps> = ({
  currentBook,
  currentChapter,
  chineseVariant,
  studyCount,
  onScrollTopAndSelectBook,
  onScrollTopOnly,
  onPrevChapter,
  onNextChapter,
}) => {
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    origX: number;
    origY: number;
  } | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setOffset({ x: 0, y: 0 });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      origX: offset.x,
      origY: offset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;
    const maxLeft = -(window.innerWidth - 280);
    const maxUp = -(window.innerHeight - 180);
    setOffset({
      x: Math.max(maxLeft, Math.min(12, dragStartRef.current.origX + dx)),
      y: Math.max(maxUp, Math.min(12, dragStartRef.current.origY + dy)),
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const bookLabel =
    chineseVariant === 'traditional'
      ? currentBook.chineseAbbr || currentBook.chineseTraditional
      : currentBook.chineseAbbr || currentBook.chineseSimplified;

  return (
    <aside
      aria-label="浮動快速導覽與章節切換"
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
      }}
      className="fixed bottom-18 md:bottom-6 right-3 sm:right-5 z-[35] flex flex-col items-end gap-2 select-none"
    >
      {/* Floating Control 1: Move Up to Top & Select Different Book */}
      <div className="flex items-center gap-1 rounded-full bg-amber-900/95 dark:bg-amber-700/95 text-white shadow-lg border border-amber-700/80 dark:border-amber-500/70 backdrop-blur-md p-1">
        <button
          type="button"
          onClick={onScrollTopOnly}
          className="h-9 w-9 rounded-full hover:bg-amber-800 dark:hover:bg-amber-600 flex items-center justify-center transition-colors"
          title="回到頁面最頂部"
          aria-label="回到頁面最頂部"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onScrollTopAndSelectBook}
          className="h-9 px-3 rounded-full hover:bg-amber-800 dark:hover:bg-amber-600 flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
          title="回到頂部並選擇其他書卷閱讀"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{studyCount > 1 ? '回頂部選書 (多卷)' : '回頂部選書卷'}</span>
        </button>
      </div>

      {/* Floating Control 2: Move Back 1 Chapter / Forward 1 Chapter (Draggable Anywhere) */}
      <div className="flex items-center gap-0.5 rounded-full bg-white/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 shadow-lg border border-stone-200 dark:border-stone-700 backdrop-blur-md p-1">
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="h-9 px-1.5 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-grab active:cursor-grabbing touch-none"
          title="按住拖曳移動此浮動按鈕至螢幕任何位置"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        <button
          type="button"
          onClick={onPrevChapter}
          className="h-9 px-2.5 sm:px-3 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-95 flex items-center gap-1 text-xs font-semibold whitespace-nowrap shrink-0 transition-all"
          title="退回上一章 (Back 1 Chapter)"
        >
          <ChevronLeft className="w-4 h-4 text-amber-800 dark:text-amber-400" />
          <span>上一章</span>
        </button>

        <span className="px-2 text-[11px] font-bold font-serif text-stone-600 dark:text-stone-300 tabular-nums whitespace-nowrap border-x border-stone-200 dark:border-stone-700">
          {bookLabel} {currentChapter}
        </span>

        <button
          type="button"
          onClick={onNextChapter}
          className="h-9 px-2.5 sm:px-3 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-95 flex items-center gap-1 text-xs font-semibold whitespace-nowrap shrink-0 transition-all"
          title="前進下一章 (Forward 1 Chapter)"
        >
          <span>下一章</span>
          <ChevronRight className="w-4 h-4 text-amber-800 dark:text-amber-400" />
        </button>
      </div>
    </aside>
  );
};
