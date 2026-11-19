import React, { useState } from 'react';
import { Download, Smartphone, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Suppress if already running in standalone installed PWA mode
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold shadow-xs transition-colors whitespace-nowrap shrink-0 ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-xs'
        }`}
        title="安裝此應用程式以便離線使用 (Install App for Offline Reading)"
      >
        <Download className="w-3.5 h-3.5" />
        <span>安裝離線版</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors whitespace-nowrap shrink-0"
          title="將此 App 加入 iPhone/iPad 主畫面以供離線閱讀"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>加入主畫面離線</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold font-serif text-stone-900 dark:text-stone-100">
                  安裝離線閱讀版 (iOS Safari)
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                <p className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <span>
                    點擊 Safari 瀏覽器底部或頂部的{' '}
                    <strong className="inline-flex items-center gap-1 text-stone-900 dark:text-white">
                      分享 <Share className="w-3.5 h-3.5" />
                    </strong>{' '}
                    按鈕。
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <span>
                    向下捲動選單並選擇 <strong>「加入主畫面 (Add to Home Screen)」</strong>。
                  </span>
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 pt-1">
                  安裝後即使在無網路環境下也能直接啟動並研讀已快取的四部對照經文。
                </p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-amber-900 py-2 text-xs font-semibold text-white hover:bg-amber-800 transition-colors"
              >
                明白了
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
