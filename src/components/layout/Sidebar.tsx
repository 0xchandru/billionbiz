import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Inbox, 
  ShoppingBag, 
  Users, 
  Palette, 
  Settings,
  HelpCircle,
  ExternalLink,
  Calendar,
  Zap,
  Store
} from 'lucide-react';
import { api } from '../../api/services';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const [storeMode, setStoreMode] = useState<string>('BOTH');

  useEffect(() => {
    const storeId = localStorage.getItem('billionbiz_store_id') || 'store-shoum-default';
    api.getStoreDetails(storeId)
      .then(res => {
        if (res.store?.storefront_mode) {
          setStoreMode(res.store.storefront_mode);
        }
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard', visible: true },
    { icon: FileText, label: 'Pages', path: '/pages', visible: true },
    { icon: Palette, label: 'Theme / Styles', path: '/editor/theme', visible: true },
    { icon: Inbox, label: 'Orders', path: '/orders', visible: storeMode !== 'SERVICES' },
    { icon: ShoppingBag, label: 'Products', path: '/products', visible: storeMode !== 'SERVICES' },
    { icon: Calendar, label: 'Appointments', path: '/appointments', visible: storeMode !== 'COMMERCE' },
    { icon: Store, label: 'Counter POS', path: '/pos', visible: true },
    { icon: Users, label: 'Team & Roles', path: '/team', visible: true },
    { icon: Zap, label: 'Extensions', path: '/extensions', visible: true },
    { icon: Settings, label: 'Settings', path: '/settings', visible: true },
  ];

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {navItems.filter(item => item.visible).map((item) => (
            <li key={item.label}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => 
                  isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
                }
              >
                <item.icon size={20} className={styles.icon} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className={styles.footer}>
        <a href="#" className={styles.helpLink}>
          <div className={styles.helpLeft}>
            <HelpCircle size={20} />
            <span>Help & Support</span>
          </div>
          <ExternalLink size={16} className={styles.externalIcon} />
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
