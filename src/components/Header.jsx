import { useState, useEffect, useRef } from 'react';
import { LogOut, LayoutDashboard, History, PieChart, Settings, Bell, Trash2, Coins, Sun, Moon, Menu, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../supabaseClient';
import { Link, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

const NavLink = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      viewTransition
      className={`nav-link ${isActive ? 'active' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        borderRadius: 'var(--radius-md)',
        textDecoration: 'none',
        flexShrink: 0
      }}
    >
      <Icon size={16} style={{ flexShrink: 0 }} />
      <span style={{ display: 'none' }} className="sm:inline">{label}</span>
    </Link>
  );
};

const DrawerNavLink = ({ to, icon: Icon, label, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`drawer-nav-link ${isActive ? 'active' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-md)',
        textDecoration: 'none',
        color: isActive ? 'var(--primary)' : 'var(--text-muted)',
        backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent',
        border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
        fontWeight: isActive ? 600 : 500,
        fontSize: '0.9rem',
        transition: 'var(--transition)'
      }}
    >
      <Icon size={18} style={{ flexShrink: 0 }} />
      <span>{label}</span>
    </Link>
  );
};

const Header = () => {
  const { session, notifications, markAllNotificationsRead, clearNotifications, themeMode, toggleThemeMode } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isAndroid = Capacitor.isNativePlatform();
  const location = useLocation();

  // Close drawer on navigation
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

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

  return (
    <>
      <header className="site-header" style={{
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-header)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 200,
      }}>
      <style>{`
        .site-header {
          padding: 0.75rem 0.5rem;
        }
        .nav-link {
          padding: 0.5rem 0.75rem;
          color: var(--text-muted);
          font-family: 'Hubot Sans Variable', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          font-stretch: 100%;
          border: 1px solid transparent;
          transition: var(--transition);
        }
        .nav-link.active {
          view-transition-name: active-tab-pill;
          background-color: var(--bg-hover);
          border-color: var(--border-color);
          color: var(--primary);
          font-stretch: 105%;
          font-weight: 600;
          box-shadow: inset 0 0 10px rgba(88, 166, 255, 0.05);
        }
        .nav-link:hover {
          color: var(--primary-hover);
          font-stretch: 112%;
          background-color: rgba(255, 255, 255, 0.02);
          border-color: rgba(255, 255, 255, 0.05);
        }
        @media (min-width: 640px) {
          .site-header {
            padding: 0.875rem 1.5rem !important;
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
        .site-nav {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;     /* Firefox */
        }
        .site-nav::-webkit-scrollbar {
          display: none;             /* Chrome, Safari and Opera */
        }

        /* Drawer Overlay */
        .drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .drawer-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        /* Drawer Card */
        .drawer-card {
          position: fixed;
          top: 0;
          left: 0;
          width: 280px;
          height: 100%;
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid var(--border-color);
          z-index: 1001;
          display: flex;
          flex-direction: column;
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: var(--shadow-lg);
        }
        .drawer-card.open {
          transform: translateX(0);
        }

        /* Menu Button */
        .menu-btn {
          width: 36px;
          height: 36px;
          padding: 0;
          border-radius: var(--radius-full);
          background-color: var(--bg-input);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
          cursor: pointer;
          transition: var(--transition);
        }
        .menu-btn:hover {
          color: var(--primary);
          background-color: var(--bg-hover);
        }

        .drawer-header {
          padding: 1.25rem 1rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .drawer-nav {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .drawer-footer {
          padding: 1.25rem 1rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.01);
        }

        .drawer-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .profile-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--primary);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          box-shadow: var(--shadow-glow);
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          overflow: hidden;
        }

        .profile-email {
          font-size: 0.8rem;
          color: var(--text-main);
          font-weight: 600;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }

        .profile-subtitle {
          font-size: 0.68rem;
          color: var(--text-muted);
        }

        .drawer-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: space-between;
          align-items: center;
        }

        .drawer-action-btn {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          background: var(--bg-input);
          color: var(--text-muted);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
        }
        .drawer-action-btn:hover {
          color: var(--primary);
          background: var(--bg-hover);
          border-color: var(--primary);
        }
        
        .drawer-nav-link:hover {
          color: var(--primary-hover) !important;
          background-color: var(--bg-hover) !important;
          border-color: rgba(255, 255, 255, 0.05) !important;
        }
      `}</style>
      <div className="container flex items-center justify-between" style={{ padding: 0 }}>
        <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
          {isAndroid && session && (
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="menu-btn"
              title="Menu"
              style={{ marginRight: '0.25rem' }}
            >
              <Menu size={20} />
            </button>
          )}
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
          {!isAndroid && <h1 style={{ fontSize: '1.25rem', margin: 0, display: 'none' }} className="sm:inline">Trackify</h1>}
          {isAndroid && (
            <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginLeft: '0.5rem' }}>
              {location.pathname === '/' && 'Dashboard'}
              {location.pathname === '/history' && 'History'}
              {location.pathname === '/analytics' && 'Analytics'}
              {location.pathname === '/ledger' && 'Ledger'}
              {location.pathname === '/settings' && 'Settings'}
            </span>
          )}
        </div>
        
        {session && !isAndroid && (
          <nav className="site-nav flex items-center gap-0.5" style={{ flex: 1, justifyContent: 'center', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
            <div className="relative-container" ref={dropdownRef}>
              <button 
                onClick={() => {
                  setIsOpen(!isOpen);
                  if (!isOpen && unreadCount > 0) {
                    markAllNotificationsRead();
                  }
                }}
                className="relative-container"
                style={{
                  width: '36px',
                  height: '36px',
                  padding: 0,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-input)',
                  color: unreadCount > 0 ? 'var(--primary)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
                  backgroundColor: 'var(--bg-card)',
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

            {!isAndroid && (
              <button 
                onClick={toggleThemeMode}
                style={{
                  width: '36px',
                  height: '36px',
                  padding: 0,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid transparent',
                  transition: 'var(--transition)'
                }}
                title={themeMode === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
              >
                {themeMode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
            )}

            {!isAndroid && (
              <button 
                onClick={handleLogout}
                style={{
                  width: '36px',
                  height: '36px',
                  padding: 0,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      </header>

      {/* Collapsible Left Navigation Drawer (Android App Only) */}
      {isAndroid && session && (
        <>
          {/* Backdrop Overlay */}
          <div 
            className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`} 
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Card */}
          <div className={`drawer-card ${isDrawerOpen ? 'open' : ''}`}>
            <div className="drawer-header">
              <div className="flex items-center gap-2">
                <img 
                  src="/favicon.png" 
                  alt="Trackify Logo" 
                  style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-md)' }} 
                />
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>Trackify</span>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="drawer-action-btn"
                style={{ width: '28px', height: '28px' }}
              >
                <X size={14} />
              </button>
            </div>

            <nav className="drawer-nav">
              <DrawerNavLink to="/" icon={LayoutDashboard} label="Dashboard" onClick={() => setIsDrawerOpen(false)} />
              <DrawerNavLink to="/history" icon={History} label="History" onClick={() => setIsDrawerOpen(false)} />
              <DrawerNavLink to="/analytics" icon={PieChart} label="Analytics" onClick={() => setIsDrawerOpen(false)} />
              <DrawerNavLink to="/ledger" icon={Coins} label="Ledger" onClick={() => setIsDrawerOpen(false)} />
            </nav>

            <div className="drawer-footer">
              <div className="drawer-profile">
                <div className="profile-avatar">
                  {session.user?.email ? session.user.email[0].toUpperCase() : 'U'}
                </div>
                <div className="profile-info">
                  <span className="profile-email">{session.user?.email}</span>
                  <span className="profile-subtitle">Signed In</span>
                </div>
              </div>
              
              <div className="drawer-actions">
                <Link 
                  to="/settings" 
                  onClick={() => setIsDrawerOpen(false)}
                  className="drawer-action-btn"
                  title="Settings"
                >
                  <Settings size={16} />
                </Link>
                <button 
                  onClick={toggleThemeMode}
                  className="drawer-action-btn"
                  title={themeMode === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
                >
                  {themeMode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </button>
                <button 
                  onClick={handleLogout}
                  className="drawer-action-btn"
                  title="Sign Out"
                  style={{ color: 'var(--danger)' }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header;
