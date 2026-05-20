import React from 'react';
import { LogOut, LayoutDashboard, History, PieChart, Settings } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../supabaseClient';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const { session } = useAppContext();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const NavLink = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
          textDecoration: 'none',
          fontWeight: isActive ? 600 : 400,
          transition: 'all 0.2s ease'
        }}
      >
        <Icon size={18} />
        <span style={{ display: 'none' }} className="sm:inline">{label}</span>
      </Link>
    );
  };

  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      padding: '1rem',
      backgroundColor: 'rgba(28, 31, 38, 0.8)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <style>{`
        @media (min-width: 640px) {
          .sm\\:inline { display: inline !important; }
        }
      `}</style>
      <div className="container flex items-center justify-between" style={{ padding: 0 }}>
        <div className="flex items-center gap-2">
          <img 
            src="/favicon.png" 
            alt="Trackify Logo" 
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: 'var(--radius-md)', 
              boxShadow: 'var(--shadow-glow)' 
            }} 
          />
          <h1 style={{ fontSize: '1.25rem', margin: 0, display: 'none' }} className="sm:inline">Trackify</h1>
        </div>
        
        {session && (
          <nav className="flex items-center gap-1" style={{ flex: 1, justifyContent: 'center' }}>
            <NavLink to="/" icon={LayoutDashboard} label="Dashboard" />
            <NavLink to="/history" icon={History} label="History" />
            <NavLink to="/analytics" icon={PieChart} label="Analytics" />
            <NavLink to="/settings" icon={Settings} label="Settings" />
          </nav>
        )}

        {session && (
          <div className="flex items-center gap-2">
            <button 
              onClick={handleLogout}
              style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
