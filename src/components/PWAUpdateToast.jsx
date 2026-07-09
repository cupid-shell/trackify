import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, ShieldAlert } from 'lucide-react';

const PWAUpdateToast = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('SW Registration Error: ', error);
    }
  });

  if (!needRefresh) return null;

  return (
    <div className="pwa-toast-container">
      <style>{`
        .pwa-toast-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          animation: slideUpPWA 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          max-width: 400px;
          width: calc(100% - 48px);
        }

        @keyframes slideUpPWA {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .pwa-toast-card {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          padding: 1.15rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 18px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4), 0 0 20px var(--primary-glow);
          background: rgba(13, 25, 21, 0.85);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }

        body.light-theme .pwa-toast-card {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(11, 26, 19, 0.08);
          border-top: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 12px 28px rgba(11, 26, 19, 0.08), 0 0 20px rgba(16, 185, 129, 0.06);
        }

        .pwa-icon-wrapper {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.15);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(16, 185, 129, 0.25);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
        }

        body.light-theme .pwa-icon-wrapper {
          background: rgba(16, 185, 129, 0.15);
          color: var(--success);
          border-color: rgba(16, 185, 129, 0.25);
        }

        .pwa-dismiss-btn {
          padding: 0.5rem 0.85rem;
          font-size: 0.75rem;
          font-weight: 500;
          background: rgba(255, 255, 255, 0.02);
          color: var(--text-muted);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          transition: var(--transition);
        }

        body.light-theme .pwa-dismiss-btn {
          background: rgba(0, 0, 0, 0.02);
        }

        .pwa-dismiss-btn:hover {
          background: var(--bg-hover);
          color: var(--text-main);
          border-color: var(--primary);
        }

        .pwa-reload-btn {
          padding: 0.5rem 1.15rem;
          font-size: 0.75rem;
          font-weight: 600;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          box-shadow: 0 4px 12px var(--primary-glow);
          transition: var(--transition);
        }

        .pwa-reload-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px var(--primary-glow);
          filter: brightness(1.05);
        }

        .pwa-reload-btn:hover svg {
          animation: spinSlow 2s linear infinite;
        }

        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div className="pwa-toast-card">
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div className="pwa-icon-wrapper">
            <ShieldAlert size={18} />
          </div>
          <div className="flex-col" style={{ gap: '0.15rem', flex: 1 }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Update Available
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              A new version of Trackify is ready. Reload to apply updates and get the latest features.
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
          <button
            onClick={() => setNeedRefresh(false)}
            className="pwa-dismiss-btn"
          >
            <X size={12} />
            Dismiss
          </button>
          
          <button
            onClick={() => updateServiceWorker(true)}
            className="pwa-reload-btn"
          >
            <RefreshCw size={12} />
            Reload Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAUpdateToast;
