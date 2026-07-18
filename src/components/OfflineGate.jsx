import { CloudOff, RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

// Shown when there is no session, the device is offline, and someone WAS signed
// in on this device before. Supabase returns a null session when a stored token
// has expired and can't be refreshed — which is every offline boot after the
// token's lifetime. Without this the user is bounced to a sign-in form that
// cannot succeed without a connection, which reads as "I've been logged out and
// lost everything" rather than "there's no signal".
const OfflineGate = () => {
  const { isOnline } = useAppContext();

  return (
    <main
      className="container animate-fade-in"
      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div className="glass-card" style={{ maxWidth: '420px', textAlign: 'center', padding: '2.5rem 2rem' }}>
        <div
          style={{
            display: 'inline-flex',
            padding: '0.9rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--warning-bg)',
            color: 'var(--warning)',
            marginBottom: '1.25rem',
          }}
        >
          <CloudOff size={28} />
        </div>

        <h2 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>You&apos;re offline</h2>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Your session needs to be renewed, and that requires a connection.
          <strong style={{ color: 'var(--text-main)', fontWeight: 600 }}> Nothing has been deleted</strong> —
          your data is on this device and on the server, and it&apos;ll be here when you reconnect.
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          disabled={!isOnline}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            height: '2.75rem',
            padding: '0 1.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            backgroundColor: isOnline ? 'var(--primary)' : 'var(--bg-input)',
            color: isOnline ? '#ffffff' : 'var(--text-muted)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: isOnline ? 'pointer' : 'default',
          }}
        >
          <RefreshCw size={16} />
          {isOnline ? 'Reconnect' : 'Waiting for a connection…'}
        </button>
      </div>
    </main>
  );
};

export default OfflineGate;
