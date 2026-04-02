import React, { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-darkBg text-white gap-4">
          <AlertTriangle size={48} className="text-alertRed" />
          <h2 className="text-xl font-bold text-alertRed">3D Scene Error</h2>
          <p className="text-gray-400 text-sm max-w-xs text-center">{this.state.errorMessage}</p>
          <button
            onClick={() => this.setState({ hasError: false, errorMessage: '' })}
            className="mt-2 px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-sm"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
