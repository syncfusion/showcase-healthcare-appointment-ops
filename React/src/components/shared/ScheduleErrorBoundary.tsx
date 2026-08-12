import React from 'react';
import { ErrorBanner } from '@components/shared/ErrorBanner';

export interface ScheduleErrorBoundaryProps {
  children: React.ReactNode;
  
  onRetry?: () => void;
}

interface ScheduleErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  
  retryKey: number;
}


export class ScheduleErrorBoundary extends React.Component<
  ScheduleErrorBoundaryProps,
  ScheduleErrorBoundaryState
> {
  state: ScheduleErrorBoundaryState = { hasError: false, errorMessage: '', retryKey: 0 };

  static getDerivedStateFromError(error: unknown): Partial<ScheduleErrorBoundaryState> {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    
    console.error('[ScheduleErrorBoundary] Schedule render error caught:', error, info?.componentStack);
  }

  handleRetry = () => {
    
    this.setState((prev) => ({ hasError: false, errorMessage: '', retryKey: prev.retryKey + 1 }));
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <ErrorBanner
            title="Schedule failed to render"
            message="The scheduler could not be displayed and is showing an empty planner. Click Retry to attempt loading it again."
            onRetry={this.handleRetry}
          />
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-sf-fg-tertiary)',
              fontSize: 14,
              background: 'var(--color-sf-bg-secondary)',
              borderTop: '1px solid var(--color-sf-border-secondary)',
            }}
          >
            Empty schedule — no events to display.
          </div>
        </div>
      );
    }

    
    
    return <div key={this.state.retryKey} style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>{this.props.children}</div>;
  }
}
