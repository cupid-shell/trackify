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
          background: rgba(4, 7, 6, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1.5rem;
        }

        body.light-theme .update-prompt-overlay {
          background: rgba(226, 242, 233, 0.7);
        }

        /* Premium glassmorphic card */
        .update-prompt-card {
          width: 100%;
          max-width: 420px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(139, 92, 246, 0.15);
          position: relative;
          overflow: hidden;
          background: rgba(13, 25, 21, 0.75);
          backdrop-filter: blur(32px) saturate(190%);
          -webkit-backdrop-filter: blur(32px) saturate(190%);
          animation: slideUpCenter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
        }

        body.light-theme .update-prompt-card {
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(11, 26, 19, 0.08);
          border-top: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 20px 40px rgba(11, 26, 19, 0.12), 0 0 30px rgba(139, 92, 246, 0.1);
        }

        /* Top background glow sphere */
        .update-prompt-glow {
          position: absolute;
          top: -120px;
          left: 50%;
          transform: translateX(-50%);
          width: 240px;
          height: 240px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, rgba(139, 92, 246, 0) 70%);
          pointer-events: none;
          z-index: 0;
        }

        body.light-theme .update-prompt-glow {
          background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0) 70%);
        }

        @keyframes slideUpCenter {
          from {
            transform: translateY(40px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        .update-prompt-content {
          padding: 2.75rem 2.25rem 2.25rem 2.25rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
          position: relative;
          z-index: 1;
        }

        /* Dual-circle glowing icon badge */
        .update-icon-container {
          position: relative;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .update-icon-glow {
          position: absolute;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          border: 1px dashed rgba(139, 92, 246, 0.4);
          animation: spinDashed 12s linear infinite;
        }

        body.light-theme .update-icon-glow {
          border-color: rgba(16, 185, 129, 0.4);
        }

        @keyframes spinDashed {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .update-icon-inner {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.05) 100%);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(139, 92, 246, 0.3);
          box-shadow: 0 8px 20px rgba(139, 92, 246, 0.15);
        }

        body.light-theme .update-icon-inner {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%);
          color: var(--success);
          border-color: rgba(16, 185, 129, 0.3);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.1);
        }

        .update-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background-color: var(--success-bg);
          color: var(--success);
          font-family: 'Hubot Sans Variable', monospace;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border: 1px solid rgba(16, 185, 129, 0.18);
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--success);
          animation: dotPulse 1.6s infinite ease-in-out;
        }

        @keyframes dotPulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 1; box-shadow: 0 0 8px var(--success); }
          100% { transform: scale(0.8); opacity: 0.5; }
        }

        .update-title {
          font-family: 'Hubot Sans Variable', sans-serif;
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-main);
          line-height: 1.35;
          text-align: center;
          margin-top: 0.25rem;
        }

        /* Minimalist close button */
        .btn-close-update {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          width: 32px;
          min-width: 32px;
          max-width: 32px;
          height: 32px;
          min-height: 32px;
          max-height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.02);
          color: var(--text-muted);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          padding: 0;
          z-index: 10;
        }

        body.light-theme .btn-close-update {
          background: rgba(0, 0, 0, 0.02);
        }

        .btn-close-update:hover {
          background: var(--bg-hover);
          color: var(--text-main);
          transform: rotate(90deg) scale(1.05);
          border-color: var(--primary);
          box-shadow: 0 0 10px var(--primary-glow);
        }

        /* Release notes container */
        .update-body-wrapper {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .update-body-header {
          font-family: 'Hubot Sans Variable', sans-serif;
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .update-body {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.6;
          background: rgba(0, 0, 0, 0.15);
          border: 1px solid var(--border-color);
          border-left: 3px solid var(--primary);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          max-height: 140px;
          overflow-y: auto;
          scrollbar-width: thin;
          text-align: left;
          width: 100%;
        }

        body.light-theme .update-body {
          background: rgba(0, 0, 0, 0.02);
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
          margin-top: 0.5rem;
          width: 100%;
        }

        /* Glowing primary gradient button */
        .btn-update-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          color: #ffffff;
          border: none;
          padding: 0.95rem 1.5rem;
          border-radius: 14px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 6px 20px var(--primary-glow);
          letter-spacing: 0.02em;
          width: 100%;
        }

        .btn-update-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px var(--primary-glow);
          filter: brightness(1.05);
        }

        .btn-update-primary:hover svg {
          animation: bounceArrow 0.8s infinite ease-in-out;
        }

        @keyframes bounceArrow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(2px); }
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

        /* Glassmorphic secondary button */
        .btn-update-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.02);
          color: var(--text-main);
          border: 1px solid var(--border-color);
          padding: 0.8rem 1rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        body.light-theme .btn-update-secondary {
          background: rgba(0, 0, 0, 0.02);
        }

        .btn-update-secondary:hover {
          background: var(--bg-hover);
          border-color: var(--primary);
          color: var(--primary);
        }

        .btn-update-text {
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          color: var(--text-muted);
          border: 1px solid transparent;
          padding: 0.8rem 1rem;
          border-radius: 12px;
          font-weight: 500;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .btn-update-text:hover {
          color: var(--danger);
          background: var(--danger-bg);
          border-color: rgba(244, 63, 94, 0.1);
        }
      `}</style>

      <div className="update-prompt-card">
        <div className="update-prompt-glow" />
        
        <button 
          className="btn-close-update" 
          onClick={() => dismissUpdate(false)}
          title="Close"
        >
          <X size={14} />
        </button>

        <div className="update-prompt-content">
          <div className="update-icon-container">
            <div className="update-icon-glow" />
            <div className="update-icon-inner">
              <Sparkles size={22} className="animate-pulse" />
            </div>
          </div>

          <div className="update-badge">
            <span className="pulse-dot"></span>
            <span>New Update</span>
          </div>

          <h3 className="update-title">
            Trackify <span style={{ color: 'var(--primary)' }}>v{versionStr}</span> is available!
          </h3>

          <div className="update-body-wrapper">
            <div className="update-body-header">What's New</div>
            <div className="update-body">
              {bodyText}
            </div>
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
