import React, { useState, useEffect, useRef } from 'react';
import { LogOut, LayoutDashboard, History, PieChart, Settings, Bell, Trash2, Coins } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../supabaseClient';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const { session, notifications, markAllNotificationsRead, clearNotifications } = useAppContext();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const NavLink = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        className="nav-link"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
          textDecoration: 'none',
          fontWeight: isActive ? 600 : 400,
          transition: 'all 0.2s ease',
          flexShrink: 0
        }}
      >
        <Icon size={18} style={{ flexShrink: 0 }} />
        <span style={{ display: 'none' }} className="sm:inline">{label}</span>
      </Link>
    );
  };

  return (
    <header className="site-header" style={{
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'rgba(28, 31, 38, 0.8)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 200, // Make sure dropdown sits above other panels
    }}>
      <style>{`
        .site-header {
          padding: 0.75rem 0.5rem;
        }
        .nav-link {
          padding: 0.5rem 0.5rem;
        }
        @media (min-width: 640px) {
          .site-header {
            padding: 1rem !important;
          }
          .nav-link {
            padding: 0.5rem 1rem !important;
          }
          .sm\\:inline { display: inline !important; }
        }
        .hover-action:hover {
          color: var(--primary) !important;
          background-color: var(--bg-hover) !important;
        }
      `}</style>
      <div className="container flex items-center justify-between" style={{ padding: 0 }}>
        <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
          <img 
            src="/favicon.png" 
            alt="Trackify Logo" 
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: 'var(--radius-md)', 
              boxShadow: 'var(--shadow-glow)',
              flexShrink: 0
            }} 
          />
          <h1 style={{ fontSize: '1.25rem', margin: 0, display: 'none' }} className="sm:inline">Trackify</h1>
        </div>
        
        {session && (
          <nav className="flex items-center gap-0.5" style={{ flex: 1, justifyContent: 'center', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <NavLink to="/" icon={LayoutDashboard} label="Dashboard" />
            <NavLink to="/history" icon={History} label="History" />
            <NavLink to="/analytics" icon={PieChart} label="Analytics" />
            <NavLink to="/ledger" icon={Coins} label="Ledger" />
            <NavLink to="/settings" icon={Settings} label="Settings" />
          </nav>
        )}

        {session && (
          <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
            {/* Notification Bell Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button 
                onClick={() => {
                  setIsOpen(!isOpen);
                  if (!isOpen && unreadCount > 0) {
                    markAllNotificationsRead();
                  }
                }}
                style={{
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-input)',
                  color: unreadCount > 0 ? 'var(--primary)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  border: unreadCount > 0 ? '1px solid var(--primary)' : '1px solid transparent',
                  boxShadow: unreadCount > 0 ? 'var(--shadow-glow)' : 'none'
                }}
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: 'var(--danger)',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    borderRadius: 'var(--radius-full)',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 5px rgba(239, 68, 68, 0.8)'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {isOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 10px)',
                  width: '320px',
                  backgroundColor: 'rgba(28, 31, 38, 0.95)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 210,
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '400px'
                }}>
                  {/* Header */}
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Notifications</span>
                    <button 
                      onClick={() => {
                        clearNotifications();
                        setIsOpen(false);
                      }}
                      style={{
                        color: 'var(--text-muted)',
                        padding: '0.25rem',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Clear all"
                      className="hover-action"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Body */}
                  <div style={{
                    overflowY: 'auto',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {!notifications || notifications.length === 0 ? (
                      <div style={{
                        padding: '2rem 1rem',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '0.875rem'
                      }}>
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id}
                          style={{
                            padding: '0.75rem 1rem',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                            backgroundColor: n.read ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                            display: 'flex',
                            gap: '0.75rem',
                            alignItems: 'start'
                          }}
                        >
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: n.type === 'success' ? 'var(--success)' : n.type === 'warning' ? 'var(--warning)' : 'var(--primary)',
                            marginTop: '6px',
                            flexShrink: 0
                          }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', flex: 1 }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{n.title}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.25' }}>{n.message}</span>
                            <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              {new Date(n.date).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
