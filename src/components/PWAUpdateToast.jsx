import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, ShieldAlert } from 'lucide-react';

const PWAUpdateToast = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.error('SW Registration Error: ', error);
    }
  });

  if (!needRefresh) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      maxWidth: '400px',
      width: 'calc(100% - 48px)',
    }}>
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div 
        className="glass-card" 
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          padding: '1rem',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(139, 92, 246, 0.25)',
          background: 'rgba(15, 17, 21, 0.9)',
          backdropFilter: 'blur(12px)',
          margin: 0
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            color: '#a78bfa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
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
            style={{
              padding: '0.4rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              transition: 'var(--transition)'
            }}
            onMouseOver={e => e.currentTarget.style.color = 'var(--text-main)'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <X size={12} />
            Dismiss
          </button>
          
          <button
            onClick={() => updateServiceWorker(true)}
            style={{
              padding: '0.4rem 1rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: 'var(--shadow-glow)',
              transition: 'var(--transition)'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--primary)'}
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
