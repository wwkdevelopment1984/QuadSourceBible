import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-18 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-800 border border-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-200 shrink-0" />
      <span>離線模式 Offline Mode — 正在使用本機離線經文快取</span>
    </div>
  );
};
