import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Trackify Runtime Error Boundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error} 
          onReload={this.handleReload} 
          onReset={this.handleReset} 
        />
      );
    }
    return this.props.children;
  }
}

const ErrorFallback = ({ error, onReload, onReset }) => {
  return (
    <div className="eb-overlay">
      <style>{`
        .eb-overlay {
          position: fixed;
          inset: 0;
          z-index: 10100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: var(--bg-main);
          color: var(--text-main);
          font-family: inherit;
        }
        .eb-card {
          width: 100%;
          max-width: 460px;
          padding: 2.25rem;
          border-radius: 24px;
          background: rgba(13, 25, 21, 0.85);
          border: 1px solid rgba(244, 63, 94, 0.1);
          border-top: 1px solid rgba(244, 63, 94, 0.25);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(244, 63, 94, 0.05);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        body.light-theme .eb-card {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(244, 63, 94, 0.15);
          border-top: 1px solid rgba(244, 63, 94, 0.4);
          box-shadow: 0 15px 35px rgba(244, 63, 94, 0.05);
        }
        .eb-icon-wrapper {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          box-shadow: 0 8px 20px rgba(244, 63, 94, 0.1);
        }
        .eb-title {
          font-size: 1.35rem;
          font-weight: 800;
          margin: 0 0 0.5rem 0;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }
        .eb-msg {
          font-size: 0.875rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin: 0 0 1.5rem 0;
          max-width: 340px;
        }
        .eb-details {
          width: 100%;
          text-align: left;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 1rem;
          margin-bottom: 2rem;
          max-height: 140px;
          overflow-y: auto;
        }
        .eb-details-title {
          font-size: 0.7rem;
          text-transform: uppercase;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
          letter-spacing: 0.05em;
        }
        .eb-code {
          font-family: monospace;
          font-size: 0.75rem;
          color: var(--danger);
          margin: 0;
          white-space: pre-wrap;
          word-break: break-all;
        }
        .eb-footer {
          display: flex;
          width: 100%;
          gap: 1rem;
        }
        .eb-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 14px;
          cursor: pointer;
          transition: var(--transition);
        }
        .eb-btn-reload {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          color: white;
          border: none;
          box-shadow: 0 4px 12px var(--primary-glow);
        }
        .eb-btn-reload:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px var(--primary-glow);
        }
        .eb-btn-reset {
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          color: var(--text-main);
        }
        .eb-btn-reset:hover {
          background: var(--bg-hover);
        }
      `}</style>
      <div className="eb-card">
        <div className="eb-icon-wrapper">
          <AlertTriangle size={32} style={{ color: 'var(--danger)' }} />
        </div>
        <h2 className="eb-title">Something went wrong</h2>
        <p className="eb-msg">
          Trackify encountered an unexpected rendering crash. You can try reloading this page or resetting the navigation cache.
        </p>

        {error && (
          <div className="eb-details">
            <div className="eb-details-title">Error Details</div>
            <pre className="eb-code">{error.toString()}</pre>
          </div>
        )}

        <div className="eb-footer">
          <button className="eb-btn eb-btn-reset" onClick={onReset}>
            <Home size={16} />
            Go Home
          </button>
          <button className="eb-btn eb-btn-reload" onClick={onReload}>
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;
