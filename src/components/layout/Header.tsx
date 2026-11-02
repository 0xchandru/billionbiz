import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { 
  Menu, Bell, ChevronDown, 
  LogOut, Store, Shield
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useRealtime } from '../../hooks/useRealtime';
import { api } from '../../api/services';
import styles from './Header.module.css';

const Header: FC = () => {
  const { user, role, storeName, organizations, switchStore, logout } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isStoreSwitcherOpen, setIsStoreSwitcherOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef<HTMLDivElement>(null);
  const storeRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (storeRef.current && !storeRef.current.contains(e.target as Node)) {
        setIsStoreSwitcherOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // In-app notifications & Realtime live pulse
  const fetchNotifs = () => {
    api.getNotifications()
      .then((res) => {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const { isConnected } = useRealtime((event) => {
    if (event.type === 'notification.created') {
      fetchNotifs();
    }
  });

  const handleMarkRead = (id: string) => {
    api.markNotificationRead(id).then(() => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }).catch(() => {});
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.iconBtn} aria-label="Toggle menu">
          <Menu size={20} />
        </button>

        <div className={styles.logo}>
          <div className={styles.logoMark}>B</div>
          <span className={styles.logoText}>BillionBiz</span>
          <span className={styles.versionBadge} title="BillionBiz V2 Enterprise">
            V2
          </span>
        </div>

        {/* Store & Workspace Switcher */}
        <div ref={storeRef} style={{ position: 'relative', marginLeft: '1rem' }}>
          <button
            type="button"
            onClick={() => setIsStoreSwitcherOpen(!isStoreSwitcherOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#064652',
              cursor: 'pointer'
            }}
          >
            <Store size={15} color="#064652" />
            <span>{storeName || 'Primary Store'}</span>
            <ChevronDown size={14} color="#64748b" />
          </button>

          {isStoreSwitcherOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '0.4rem',
                width: '240px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                zIndex: 100,
                padding: '0.5rem 0'
              }}
            >
              <div style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Active Workspaces
              </div>
              {organizations && organizations.length > 0 ? (
                organizations.map((org: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      switchStore(org.store_id, org.organization_id);
                      setIsStoreSwitcherOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '0.5rem 0.85rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.85rem'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{org.store_name || org.organization_name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Role: {org.role || 'OWNER'}</span>
                  </button>
                ))
              ) : (
                <div style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem', color: '#64748b' }}>
                  {storeName || 'Default Store'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.right}>
        {/* Realtime Live Pulse Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.8rem',
            color: isConnected ? '#447515' : '#b45309',
            fontWeight: 600,
            padding: '0.2rem 0.6rem',
            backgroundColor: isConnected ? '#f0fdf4' : '#fffbeb',
            borderRadius: '9999px',
            border: `1px solid ${isConnected ? '#bbf7d0' : '#fde68a'}`
          }}
          title={isConnected ? 'Connected to BillionBiz Realtime WebSocket' : 'Connecting to Realtime stream...'}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#22c55e' : '#f59e0b'
            }}
          />
          <span>{isConnected ? 'Live Sync' : 'Connecting'}</span>
        </div>

        {/* Notifications Popover */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button 
            className={styles.notificationBtn} 
            aria-label="Notifications"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </button>

          {isNotificationsOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                width: '320px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                boxShadow: '0 12px 25px -5px rgba(0,0,0,0.12)',
                zIndex: 100,
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#064652' }}>Notifications</span>
                {unreadCount > 0 && (
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#e6fffa', color: '#064652', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No notifications yet. Honest zeros active.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkRead(n.id)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid #f8fafc',
                        backgroundColor: n.is_read ? '#ffffff' : '#f0fdfa',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{n.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>{n.body}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* User Profile & Secure Sign Out Dropdown */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <div 
            className={styles.profile} 
            tabIndex={0} 
            role="button" 
            aria-label="User profile"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#064652',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}
            >
              {user?.fullName?.charAt(0) || 'M'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
              <span className={styles.profileName}>{user?.fullName || 'Merchant Admin'}</span>
              <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                {role || 'OWNER'}
              </span>
            </div>
            <ChevronDown size={14} />
          </div>

          {isProfileOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                width: '230px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)',
                zIndex: 100,
                overflow: 'hidden',
                padding: '0.5rem 0'
              }}
            >
              <div style={{ padding: '0.65rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{user?.fullName || 'Merchant'}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || 'admin@chandraprakash.codes'}</div>
                <div style={{ display: 'inline-block', marginTop: '0.35rem', backgroundColor: '#e6fffa', color: '#064652', fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                  ROLE: {role || 'OWNER'}
                </div>
              </div>

              <a
                href="/settings"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1rem',
                  fontSize: '0.85rem',
                  color: '#334155',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Store size={15} /> Store Settings
              </a>

              <a
                href="/pos"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1rem',
                  fontSize: '0.85rem',
                  color: '#334155',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Shield size={15} /> Open Cashier POS
              </a>

              <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '0.3rem 0' }}></div>

              {/* Secure Sign Out Button */}
              <button
                type="button"
                onClick={() => logout()}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#dc2626',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <LogOut size={15} /> Sign out of workspace
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
