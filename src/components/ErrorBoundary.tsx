import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || '應用程式發生預期外錯誤',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let friendlyMsg = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed?.error) {
          friendlyMsg = `雲端資料庫存取受限：${parsed.error}`;
        }
      } catch {
        // Non-JSON error message
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-6">
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-lg space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100">
              系統遇到暫時性問題
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 break-words leading-relaxed">
              {friendlyMsg}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-800 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重新載入頁面</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
