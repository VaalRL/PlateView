import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** What to show instead of the children once they threw */
  fallback: (error: Error) => React.ReactNode;
  /** Clears the error when it changes, e.g. the route */
  resetKey?: unknown;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches an error thrown while rendering its children, so it costs that
 * part of the page rather than unmounting the whole app to a white screen.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    return this.state.error ? this.props.fallback(this.state.error) : this.props.children;
  }
}
