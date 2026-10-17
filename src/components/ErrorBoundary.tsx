import React from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Page Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-rose-50 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {this.props.fallbackMessage || 'Something went wrong'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              This page encountered an error. Please try again.
            </p>
            <p className="text-xs text-slate-400 font-mono mb-4 bg-slate-50 p-2 rounded-lg break-all">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
