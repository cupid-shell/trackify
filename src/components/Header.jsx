import React from 'react';
import { Wallet, Settings, LogOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../supabaseClient';

const Header = () => {
  const { session } = useAppContext();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      padding: '1.5rem',
      backgroundColor: 'rgba(28, 31, 38, 0.8)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div className="container flex items-center justify-between" style={{ padding: 0 }}>
        <div className="flex items-center gap-2">
          <div style={{
            background: 'var(--primary)',
            padding: '0.5rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Wallet size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Trackify</h1>
        </div>
        
        {session && (
          <div className="flex items-center gap-4">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {session.user.email}
            </span>
            <button 
              onClick={handleLogout}
              style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-muted)'
              }}
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
