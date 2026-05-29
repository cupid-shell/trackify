import { useAppContext } from '../context/AppContext';
import { Download, Sparkles, X } from 'lucide-react';
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
          background: radial-gradient(circle at center, rgba(13, 25, 21, 0.6) 0%, rgba(7, 12, 10, 0.92) 100%);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1.5rem;
        }

        .update-prompt-card {
          width: 100%;
          max-width: 440px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.8), 0 0 30px var(--primary-glow);
          position: relative;
          overflow: hidden;
          background: var(--bg-card);
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
          padding: 2.25rem 2rem 2rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .update-header-group {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding-right: 1.5rem;
        }

        .update-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          background-color: var(--primary-glow);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(88, 166, 255, 0.15);
          box-shadow: 0 0 15px var(--primary-glow);
        }

        .update-title-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          flex: 1;
        }

        .update-badge {
          display: inline-flex;
          align-items: center;
          align-self: flex-start;
          gap: 0.35rem;
          background-color: var(--success-bg);
          color: var(--success);
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.25rem 0.65rem;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--success);
          animation: dotPulse 1.6s infinite ease-in-out;
        }

        @keyframes dotPulse {
          0% { transform: scale(0.85); opacity: 0.6; }
          50% { transform: scale(1.25); opacity: 1; box-shadow: 0 0 6px var(--success); }
          100% { transform: scale(0.85); opacity: 0.6; }
        }

        .update-title {
          font-family: 'Hubot Sans Variable', sans-serif;
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--text-main);
          margin-top: 0.15rem;
          line-height: 1.25;
        }

        .btn-close-update {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-muted);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
          padding: 0;
          flex-shrink: 0;
          z-index: 10;
        }

        .btn-close-update:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-main);
          transform: rotate(90deg);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .update-body {
          font-size: 0.875rem;
          color: var(--text-muted);
          line-height: 1.6;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1rem 1.25rem;
          max-height: 150px;
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
          gap: 0.85rem;
          margin-top: 0.25rem;
        }

        .btn-update-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          color: #ffffff;
          border: none;
          padding: 0.85rem 1.5rem;
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 15px var(--primary-glow);
          letter-spacing: 0.02em;
        }

        .btn-update-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px var(--primary-glow);
          filter: brightness(1.05);
        }

        .btn-update-primary:active {
          transform: translateY(0);
        }

        .update-row-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          width: 100%;
        }

        .btn-update-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.02);
          color: var(--text-main);
          border: 1px solid var(--border-color);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-update-secondary:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .btn-update-text {
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          color: var(--text-muted);
          border: 1px solid transparent;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          font-weight: 500;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-update-text:hover {
          color: var(--danger);
          background: var(--danger-bg);
          border-color: rgba(244, 63, 94, 0.1);
        }
      `}</style>

      <div className="update-prompt-card">
        <button 
          className="btn-close-update" 
          onClick={() => dismissUpdate(false)}
          title="Close"
        >
          <X size={14} />
        </button>

        <div className="update-prompt-content">
          <div className="update-header-group">
            <div className="update-icon-wrapper">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div className="update-title-wrap">
              <div className="update-badge">
                <span className="pulse-dot"></span>
                <span>New Update</span>
              </div>
              <h3 className="update-title">
                Trackify <span style={{ color: 'var(--primary)' }}>v{versionStr}</span> is available!
              </h3>
            </div>
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
