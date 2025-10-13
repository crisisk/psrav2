'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleTryAgain = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="mb-6">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
          </div>

          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Something went wrong
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-2 max-w-md">
            We're sorry, but something unexpected happened. Please try again or contact support if the problem persists.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-2xl">
              <p className="text-sm font-mono text-left text-red-700 dark:text-red-400 whitespace-pre-wrap">
                {this.state.error.message}
              </p>
              {this.state.error.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                    Stack trace
                  </summary>
                  <pre className="text-xs mt-2 text-left text-red-600 dark:text-red-400 overflow-auto max-h-64">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={this.handleTryAgain}
              className="flex items-center gap-2 px-6 py-2.5 bg-sevensa-teal text-white rounded-lg hover:bg-sevensa-teal-600 transition-colors font-medium"
            >
              <RefreshCw className="h-5 w-5" />
              Try Again
            </button>

            <button
              onClick={this.handleReload}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-base transition-colors font-medium"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
