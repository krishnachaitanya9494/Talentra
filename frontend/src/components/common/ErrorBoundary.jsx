import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an unhandled rendering error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex-1 min-h-[350px] p-8 flex items-center justify-center">
          <div className="max-w-md w-full p-6 bg-white dark:bg-surface-darkCard rounded-2xl border border-red-200 dark:border-red-900/60 shadow-lg text-center space-y-4 animate-fadeIn">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-950 dark:text-slate-100">
                {this.props.title || 'Component Rendering Error'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {this.props.message ||
                  'An unexpected error occurred while rendering this section. You can try recovering below.'}
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 bg-red-50/60 dark:bg-red-950/30 rounded-lg text-left overflow-x-auto text-[11px] font-mono text-red-700 dark:text-red-300 border border-red-200/60 dark:border-red-900/40 max-h-32">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 dark:bg-brand-600 hover:bg-navy-950 dark:hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Component</span>
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-surface-darkBorder text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
