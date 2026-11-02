import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { 
  Search, Globe, HelpCircle, Bell, ChevronDown, 
  LogOut, Store, Shield
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/services';
import styles from './Header.module.css';

const Header: FC = () => {
  const { user, role, logout } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeVersion, setActiveVersion] = useState<'v1' | 'v2'>('v2');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch In-app notifications
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

  // Keyboard shortcut Ctrl/Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMarkRead = (id: string) => {
    api.markNotificationRead(id).then(() => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }).catch(() => {});
  };

  const displayName = user?.fullName || 'Chandru';
  const roleDisplay = role === 'OWNER' ? 'Super Admin' : (role || 'Super Admin');
  const userInitial = displayName.charAt(0).toUpperCase() || 'C';

  return (
    <header className={styles.header}>
      {/* LEFT: BillionBiz Brand Logo */}
      <div className={styles.left}>
        <a href="/dashboard" className={styles.logoLink}>
          <div className={styles.logoMark}>
            {/* Store Awning & 'b' Brand Icon matching attached design */}
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Lower Stem & Outer 'b' Bowl */}
              <path d="M6 4V24" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
              {/* Awning Yellow Canopy Arch */}
              <path d="M6 14C6 10.5 9 8 14 8C19 8 22 10.5 22 14L21 16C21 17 19.5 17.5 18 17C16.5 16.5 15.5 17.5 14 17.5C12.5 17.5 11.5 16.5 10 17C8.5 17.5 7 17 7 16L6 14Z" fill="#eab308" />
              {/* Bottom Green Curve */}
              <path d="M6 18C8 21.5 11 23 15 23C19.5 23 22 20.5 22 17.5" stroke="#74c043" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          </div>
          <span className={styles.logoText}>
            <span className={styles.logoBillion}>billion</span>
            <span className={styles.logoBiz}>biz</span>
          </span>
        </a>
      </div>

      {/* CENTER: Rounded Quick Find Search Pill with ⌘K Badge */}
      <div className={styles.center}>
        <div className={styles.searchBar} onClick={() => searchInputRef.current?.focus()}>
          <Search size={15} className={styles.searchIcon} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Quick find..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <kbd className={styles.kbdBadge}>⌘K</kbd>
        </div>
      </div>

      {/* RIGHT: Topbar Controls matching attached design */}
      <div className={styles.right}>
        {/* Divider */}
        <div className={styles.divider} />

        {/* Version Switcher Pill (v1 / v2) */}
        <div className={styles.versionPill} role="group" aria-label="Version switcher">
          <button
            type="button"
            className={`${styles.vBtn} ${activeVersion === 'v1' ? styles.vActive : ''}`}
            onClick={() => setActiveVersion('v1')}
          >
            v1
          </button>
          <button
            type="button"
            className={`${styles.vBtn} ${activeVersion === 'v2' ? styles.vActive : ''}`}
            onClick={() => setActiveVersion('v2')}
          >
            v2
          </button>
        </div>

        {/* Language Selector */}
        <button type="button" className={styles.langBtn} title="Language selector">
          <Globe size={16} className={styles.iconWhite} />
          <span className={styles.langText}>EN</span>
          <ChevronDown size={13} className={styles.iconMuted} />
        </button>

        {/* Help Button */}
        <button
          type="button"
          className={styles.iconBtn}
          title="Help & Documentation"
          onClick={() => window.open('https://billionbiz.codes', '_blank')}
          aria-label="Help"
        >
          <HelpCircle size={18} className={styles.iconWhite} />
        </button>

        {/* Notifications Popover Button */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button 
            type="button"
            className={styles.iconBtn} 
            aria-label="Notifications"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          >
            <Bell size={18} className={styles.iconWhite} />
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </button>

          {isNotificationsOpen && (
            <div className={styles.notificationsMenu}>
              <div className={styles.notifHeader}>
                <span className={styles.notifTitle}>Notifications</span>
                {unreadCount > 0 && (
                  <span className={styles.notifBadge}>
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

        {/* Divider */}
        <div className={styles.divider} />

        {/* User Profile Pill matching attached image */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <div 
            className={styles.profileBtn} 
            tabIndex={0} 
            role="button" 
            aria-label="User profile"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className={styles.avatarCircle}>
              {userInitial}
            </div>
            <div className={styles.userTextCol}>
              <div className={styles.userNameRow}>
                <span className={styles.userName}>{displayName}</span>
                <ChevronDown size={13} className={styles.iconMuted} />
              </div>
              <span className={styles.userRole}>{roleDisplay}</span>
            </div>
          </div>

          {isProfileOpen && (
            <div className={styles.profileMenu}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>{displayName}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || 'admin@chandraprakash.codes'}</div>
                <div style={{ display: 'inline-block', marginTop: '0.35rem', backgroundColor: '#e6fffa', color: '#083e47', fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                  ROLE: {roleDisplay}
                </div>
              </div>

              <a
                href="/settings"
                className={styles.menuItem}
              >
                <Store size={15} /> Store Settings
              </a>

              <a
                href="/pos"
                className={styles.menuItem}
              >
                <Shield size={15} /> Open Cashier POS
              </a>

              <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '0.3rem 0' }}></div>

              {/* Secure Sign Out Button */}
              <button
                type="button"
                onClick={() => logout()}
                className={styles.signOutBtn}
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
