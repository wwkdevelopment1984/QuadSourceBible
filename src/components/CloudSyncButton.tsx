import React from 'react';
import { Cloud, CloudOff, Loader2, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import { useAnnotations } from '../contexts/AnnotationsContext';

interface CloudSyncButtonProps {
  compact?: boolean;
}

export const CloudSyncButton: React.FC<CloudSyncButtonProps> = ({ compact = false }) => {
  const {
    user,
    authReady,
    isSigningIn,
    syncStatus,
    syncError,
    signInWithGoogle,
    signOutUser,
  } = useAnnotations();

  if (!authReady) {
    return null;
  }

  if (user) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <div
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            syncStatus === 'error'
              ? 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
              : syncStatus === 'offline'
              ? 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
              : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
          }`}
          title={syncError || `已登入 ${user.email}，標記與筆記跨裝置同步中`}
        >
          {syncStatus === 'syncing' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : syncStatus === 'offline' ? (
            <CloudOff className="w-3.5 h-3.5" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          <span className="hidden xl:inline max-w-[140px] truncate">
            {user.displayName || user.email}
          </span>
          <span className="xl:hidden">
            {syncStatus === 'offline' ? '離線待同步' : '已雲端同步'}
          </span>
        </div>

        {!compact && (
          <button
            onClick={signOutUser}
            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title={`登出 (${user.email})`}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={signInWithGoogle}
      disabled={isSigningIn}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
      title="使用 Google 帳號登入，將螢光標記與筆記同步到電腦、手機與平板"
    >
      {isSigningIn ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : compact ? (
        <Cloud className="w-3.5 h-3.5" />
      ) : (
        <LogIn className="w-3.5 h-3.5" />
      )}
      <span>{compact ? '同步登入' : '登入跨裝置同步'}</span>
    </button>
  );
};
