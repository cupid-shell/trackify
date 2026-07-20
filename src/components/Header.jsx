import { useState, useEffect, useRef } from 'react';
import { LogOut, LayoutDashboard, History, PieChart, Settings, Bell, Trash2, Coins, Sun, Moon, Menu, X, CloudOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatRelativeTime } from '../utils/date';
import { supabase } from '../supabaseClient';
import { Link, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

// Seeded at module load, outside render: Date.now() is impure and the React
// Compiler rejects calling it during render. A ticking state value also makes
// "synced 5m ago" actually count up instead of freezing at first paint.
const bootNow = Date.now();

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
  const {
    session, notifications, markAllNotificationsRead, clearNotifications, themeMode, toggleThemeMode,
    isOnline, syncState, pendingSyncCount, failedSyncCount,
  } = useAppContext();

  const [nowTs, setNowTs] = useState(bootNow);
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Worst-first: a failed entry needs attention more than a pending one, and
  // being offline explains both. Null when there is nothing worth saying.
  const syncChip = (() => {
    if (failedSyncCount > 0) {
      return {
        color: 'var(--danger)',
        bg: 'var(--danger-bg)',
        icon: <AlertTriangle size={12} />,
        label: `${failedSyncCount} didn’t sync`,
        title: 'Some entries could not be saved. Open History to retry or discard them.',
      };
    }
    if (!isOnline) {
      return {
        color: 'var(--warning)',
        bg: 'var(--warning-bg)',
        icon: <CloudOff size={12} />,
        label: pendingSyncCount > 0 ? `Offline · ${pendingSyncCount} pending` : 'Offline',
        title: syncState?.lastSyncedAt
          ? `Showing data last synced ${formatRelativeTime(syncState.lastSyncedAt, nowTs)}.`
          : 'You are offline. Changes are saved on this device.',
      };
    }
    if (pendingSyncCount > 0) {
      return {
        color: 'var(--warning)',
        bg: 'var(--warning-bg)',
        icon: <RefreshCw size={12} />,
        label: `Syncing ${pendingSyncCount}`,
        title: 'Entries saved on this device are being sent to the server.',
      };
    }
    return null;
  })();
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isAndroid = Capacitor.isNativePlatform();
  const location = useLocation();

  // Close drawer on navigation
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
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
          font-weight: 600;
        }
        .nav-link:hover {
          color: var(--primary-hover);
          background-color: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.06);
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

        /* --- Premium Notification Dropdown --- */
        .notif-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 10px);
          width: 320px;
          background-color: var(--bg-card);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid var(--border-color);
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg), 0 0 20px rgba(0, 0, 0, 0.2);
          z-index: 210;
          display: flex;
          flex-direction: column;
          max-height: 400px;
          animation: slideDownFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          overflow: hidden;
        }

        body.light-theme .notif-dropdown {
          border-top: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: var(--shadow-lg), 0 10px 25px rgba(11, 26, 19, 0.05);
        }

        @keyframes slideDownFade {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .notif-header {
          padding: 0.85rem 1.15rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .notif-title {
          font-family: 'Hubot Sans Variable', sans-serif;
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-main);
        }

        .notif-clear-btn {
          color: var(--text-muted);
          padding: 0.35rem;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: 1px solid transparent;
          cursor: pointer;
          transition: var(--transition);
        }

        .notif-clear-btn:hover {
          color: var(--danger) !important;
          background-color: var(--danger-bg) !important;
          border-color: rgba(244, 63, 94, 0.15);
        }

        .notif-list {
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          scrollbar-width: thin;
        }

        .notif-list::-webkit-scrollbar {
          width: 5px;
        }

        .notif-list::-webkit-scrollbar-thumb {
          background-color: var(--border-color);
          border-radius: var(--radius-full);
        }

        .notif-item {
          padding: 0.85rem 1.15rem;
          border-bottom: 1px solid var(--border-color);
          background-color: transparent;
          display: flex;
          gap: 0.85rem;
          align-items: start;
          transition: var(--transition);
          cursor: default;
        }

        .notif-item.unread {
          background-color: rgba(16, 185, 129, 0.04);
        }

        body.light-theme .notif-item.unread {
          background-color: rgba(16, 185, 129, 0.05);
        }

        .notif-item:hover {
          background-color: var(--bg-hover);
        }

        .notif-dot {
          width: 8px;
          height: 8px;
          border-radius: var(--radius-full);
          margin-top: 6px;
          flex-shrink: 0;
        }

        .notif-dot.success { background-color: var(--success); }
        .notif-dot.warning { background-color: var(--warning); }
        .notif-dot.info { background-color: var(--primary); }
        /* Budget exhaustion is the only 'danger' alert; without this its dot
           renders with no background at all. */
        .notif-dot.danger { background-color: var(--danger); }

        .notif-content {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          flex: 1;
        }

        .notif-item-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-main);
        }

        .notif-item-message {
          font-size: 0.75rem;
          color: var(--text-muted);
          line-height: 1.35;
        }

        .notif-item-date {
          font-size: 0.65rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }

        .notif-empty {
          padding: 2.5rem 1.5rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.875rem;
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
            src="/logo-mint.svg" 
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
            {/* Sync status. Deliberately renders nothing on the happy path —
                a permanent "all good" badge is chrome, not information. */}
            {syncChip && (
              <span
                className="sync-chip"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.25rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  border: `1px solid ${syncChip.color}`,
                  background: syncChip.bg,
                  color: syncChip.color,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
                title={syncChip.title}
              >
                {syncChip.icon}
                <span className="sync-chip-label">{syncChip.label}</span>
              </span>
            )}
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
                aria-label="Notifications"
                aria-haspopup="true"
                aria-expanded={isOpen}
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
                <div className="notif-dropdown animate-fade-in">
                  {/* Header */}
                  <div className="notif-header">
                    <span className="notif-title">Notifications</span>
                    <button 
                      onClick={() => {
                        clearNotifications();
                        setIsOpen(false);
                      }}
                      className="notif-clear-btn"
                      title="Clear all"
                      aria-label="Clear all notifications"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="notif-list">
                    {!notifications || notifications.length === 0 ? (
                      <div className="notif-empty">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id}
                          className={`notif-item ${n.read ? 'read' : 'unread'}`}
                        >
                          <div className={`notif-dot ${n.type || 'info'}`} />
                          <div className="notif-content">
                            <span className="notif-item-title">{n.title}</span>
                            <span className="notif-item-message">{n.message}</span>
                            <span className="notif-item-date">
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
                  src="/logo-mint.svg" 
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
