import React from 'react';
import { ErrorBanner } from '@components/shared/ErrorBanner';

export interface EditorErrorBoundaryProps {
  children: React.ReactNode;
  
  onRetry?: () => void;
}

interface EditorErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  
  retryKey: number;
}


export class EditorErrorBoundary extends React.Component<
  EditorErrorBoundaryProps,
  EditorErrorBoundaryState
> {
  state: EditorErrorBoundaryState = { hasError: false, errorMessage: '', retryKey: 0 };

  static getDerivedStateFromError(error: unknown): Partial<EditorErrorBoundaryState> {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    
    console.error('[EditorErrorBoundary] Document editor render error caught:', error, info?.componentStack);
  }

  handleRetry = () => {
    this.setState((prev) => ({ hasError: false, errorMessage: '', retryKey: prev.retryKey + 1 }));
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBanner
          title="Document editor failed to render"
          message="The care plan editor could not be displayed. Click Retry to attempt loading it again."
          onRetry={this.handleRetry}
        />
      );
    }

    
    
    return <div key={this.state.retryKey} style={{ height: '100%' }}>{this.props.children}</div>;
  }
}
