
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Robust Error Boundary component to catch rendering errors and display a fallback UI.
 */
// Fix: Explicitly extend Component from named import to resolve property access issues in some environments.
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI Crash caught by ErrorBoundary:", error, info);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-8">
          <div className="max-w-md w-full bg-gray-900 border border-red-900/50 rounded-lg p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-red-500 mb-4 tracking-wider uppercase">Application Error</h2>
            <div className="text-sm text-gray-300 mb-4">
              Something went wrong while rendering this component.
            </div>
            <pre className="bg-black/50 p-4 rounded text-xs text-red-300 font-mono overflow-auto max-h-40 whitespace-pre-wrap border border-gray-800">
              {this.state.error?.message || "Unknown Error"}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-3 bg-white text-black font-bold uppercase tracking-widest text-xs rounded hover:bg-gray-200 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    // Return children from props, ensuring null is returned if children are absent
    // Fix: Access props from the Component base class correctly via explicit cast to any to resolve property inference issues.
    return (this as any).props.children || null;
  }
}

export default ErrorBoundary;
