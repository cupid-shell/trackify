import { useAppContext } from '../context/AppContext';
import { Download, Sparkles, X, Info } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const AppUpdatePrompt = () => {
  const { updateAvailable, updateDismissed, dismissUpdate } = useAppContext();

  if (!Capacitor.isNativePlatform() || !updateAvailable || updateDismissed) return null;

  const versionStr = updateAvailable.version;
  const downloadUrl = updateAvailable.downloadUrl;
  const bodyText = updateAvailable.body || 
    "We have shipped critical visual alignment fixes, centered the Health Score, smoothed out carousel animations, fixed Light Mode coloring, and improved general spacing.";

  const handleUpdate = () => {
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="update-prompt-overlay animate-fade-in">
      <style>{`
        .update-prompt-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1.5rem;
        }

        .update-prompt-card {
          width: 100%;
          max-width: 440px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-lg);
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 25px rgba(var(--primary), 0.15);
          position: relative;
          overflow: hidden;
          background: rgba(15, 17, 21, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          animation: slideUpCenter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes slideUpCenter {
          from {
            transform: translateY(30px) scale(0.96);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        .update-prompt-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--primary), transparent);
        }

        .update-prompt-content {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .update-header-group {
          display: flex;
          gap: 0.85rem;
          align-items: flex-start;
        }

        .update-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background-color: var(--primary-glow);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 0 10px var(--primary-glow);
        }

        .update-title-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          flex: 1;
        }

        .update-badge {
          display: inline-flex;
          align-items: center;
          align-self: flex-start;
          gap: 0.25rem;
          background-color: var(--primary-glow);
          color: var(--primary);
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.15rem 0.4rem;
          border-radius: var(--radius-sm);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid rgba(var(--primary), 0.2);
        }

        .update-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-main);
          margin-top: 0.25rem;
        }

        .update-body {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.5;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: var(--radius-md);
          padding: 0.85rem 1rem;
          max-height: 120px;
          overflow-y: auto;
          scrollbar-width: thin;
        }

        .update-body::-webkit-scrollbar {
          width: 4px;
        }

        .update-body::-webkit-scrollbar-thumb {
          background-color: var(--border-color);
          border-radius: var(--radius-full);
        }

        .update-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .btn-update-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: var(--primary);
          color: #ffffff;
          border: none;
          padding: 0.65rem 1.25rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--shadow-glow);
        }

        .btn-update-primary:hover {
          background: var(--primary-hover);
          transform: translateY(-1.5px);
          box-shadow: 0 0 15px var(--primary-glow);
        }

        .btn-update-primary:active {
          transform: translateY(0);
        }

        .update-row-actions {
          display: flex;
          gap: 0.5rem;
          width: 100%;
        }

        .btn-update-secondary {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          background: var(--bg-input);
          color: var(--text-main);
          border: 1px solid var(--border-color);
          padding: 0.55rem 1rem;
          border-radius: var(--radius-md);
          font-weight: 500;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.25s;
        }

        .btn-update-secondary:hover {
          background: var(--bg-hover);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .btn-update-text {
          font-size: 0.72rem;
          color: var(--text-muted);
          background: transparent;
          border: none;
          cursor: pointer;
          align-self: center;
          padding: 0.25rem 0.5rem;
          transition: var(--transition);
          text-decoration: underline;
        }

        .btn-update-text:hover {
          color: var(--danger);
        }
      `}</style>

      <div className="update-prompt-card glass-card">
        <div className="update-prompt-content">
          <div className="update-header-group">
            <div className="update-icon-wrapper">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div className="update-title-wrap">
              <div className="update-badge">
                <Info size={10} />
                <span>New Update</span>
              </div>
              <h3 className="update-title">Trackify v{versionStr} is available!</h3>
            </div>
            <button 
              className="btn-update-secondary" 
              onClick={() => dismissUpdate(false)}
              style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', flexShrink: 0 }}
              title="Close"
            >
              <X size={14} />
            </button>
          </div>

          <div className="update-body">
            {bodyText}
          </div>

          <div className="update-actions">
            <button className="btn-update-primary" onClick={handleUpdate}>
              <Download size={16} />
              <span>Download & Install Now</span>
            </button>
            <div className="update-row-actions">
              <button className="btn-update-secondary" onClick={() => dismissUpdate(false)}>
                Remind Me Later
              </button>
              <button className="btn-update-text" onClick={() => dismissUpdate(true)}>
                Skip this version
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppUpdatePrompt;
