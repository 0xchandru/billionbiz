import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  Home, 
  ShoppingCart, 
  Calendar, 
  Package, 
  Users, 
  Wallet, 
  Store,
  Palette,
  Zap,
  Settings as SettingsIcon,
  ChevronDown,
  ChevronUp,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import styles from './Sidebar.module.css';

interface SubItem {
  id: string;
  label: string;
  path: string;
  searchParam?: string;
  isExternal?: boolean;
}

interface NavSection {
  id: string;
  label: string;
  icon: any;
  items: SubItem[];
}

const navSections: NavSection[] = [
  {
    id: 'orders',
    label: 'Orders',
    icon: ShoppingCart,
    items: [
      { id: 'all-orders', label: 'All orders', path: '/orders' },
      { id: 'new-invoice', label: 'New Invoice', path: '/orders?tab=invoices&action=new', searchParam: 'action=new' },
      { id: 'abandoned-carts', label: 'Abandoned carts', path: '/orders?tab=abandoned', searchParam: 'tab=abandoned' },
      { id: 'refunds', label: 'Refunds', path: '/orders?tab=refunds', searchParam: 'tab=refunds' },
      { id: 'shipments', label: 'Shipments', path: '/orders?tab=shipments', searchParam: 'tab=shipments' },
      { id: 'quotes', label: 'Quotes', path: '/orders?tab=quotes', searchParam: 'tab=quotes' },
      { id: 'returns', label: 'Returns', path: '/orders?tab=returns', searchParam: 'tab=returns' },
    ]
  },
  {
    id: 'appointments',
    label: 'Appointments',
    icon: Calendar,
    items: [
      { id: 'all-appointments', label: 'All appointments', path: '/appointments' },
      { id: 'calendar', label: 'Calendar', path: '/appointments?tab=calendar', searchParam: 'tab=calendar' },
      { id: 'services', label: 'Services', path: '/appointments?tab=services', searchParam: 'tab=services' },
      { id: 'staff-schedules', label: 'Staff schedules', path: '/appointments?tab=schedules', searchParam: 'tab=schedules' },
    ]
  },
  {
    id: 'catalogue',
    label: 'Catalogue',
    icon: Package,
    items: [
      { id: 'products', label: 'Products', path: '/products' },
      { id: 'categories', label: 'Categories', path: '/products?tab=categories', searchParam: 'tab=categories' },
      { id: 'inventory', label: 'Inventory', path: '/products?tab=inventory', searchParam: 'tab=inventory' },
      { id: 'price-lists', label: 'Price lists', path: '/products?tab=pricelists', searchParam: 'tab=pricelists' },
    ]
  },
  {
    id: 'people',
    label: 'People',
    icon: Users,
    items: [
      { id: 'customers', label: 'Customers', path: '/people' },
      { id: 'staff-team', label: 'Staff & Team', path: '/team' },
      { id: 'roles-permissions', label: 'Roles & Permissions', path: '/team?tab=roles', searchParam: 'tab=roles' },
    ]
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: Wallet,
    items: [
      { id: 'transactions', label: 'Transactions', path: '/finance' },
      { id: 'payouts', label: 'Payouts', path: '/finance?tab=payouts', searchParam: 'tab=payouts' },
      { id: 'invoices', label: 'Invoices', path: '/orders?tab=invoices', searchParam: 'tab=invoices' },
      { id: 'finance-taxes', label: 'Taxes', path: '/settings?tab=taxes', searchParam: 'tab=taxes' },
    ]
  },
  {
    id: 'pos',
    label: 'POS & Counters',
    icon: Store,
    items: [
      { id: 'pos-counters', label: 'POS Registers', path: '/pos-counters' },
      { id: 'open-pos', label: 'Open Cashier Terminal', path: '/pos' },
      { id: 'pos-shifts', label: 'Cash Shifts & Floats', path: '/pos-counters?tab=shifts', searchParam: 'tab=shifts' },
    ]
  },
  {
    id: 'online-store',
    label: 'Online store',
    icon: Palette,
    items: [
      { id: 'store-editor', label: 'Store Editor', path: '/editor' },
      { id: 'pages', label: 'Pages', path: '/pages' },
      { id: 'themes', label: 'Themes', path: '/editor?tab=theme', searchParam: 'tab=theme' },
      { id: 'navigation', label: 'Navigation', path: '/editor?tab=navigation', searchParam: 'tab=navigation' },
      { id: 'store-domains', label: 'Domains', path: '/settings?tab=domains', searchParam: 'tab=domains' },
      { id: 'store-preferences', label: 'Preferences', path: '/settings' },
    ]
  },
  {
    id: 'extensions',
    label: 'Extensions',
    icon: Zap,
    items: [
      { id: 'all-extensions', label: 'All Extensions', path: '/extensions' },
      { id: 'payment-gateways', label: 'Payment Gateways', path: '/extensions?category=payments', searchParam: 'category=payments' },
      { id: 'shipping-couriers', label: 'Shipping Couriers', path: '/extensions?category=shipping', searchParam: 'category=shipping' },
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: SettingsIcon,
    items: [
      { id: 'set-general', label: 'General & Mode', path: '/settings?tab=general', searchParam: 'tab=general' },
      { id: 'set-locations', label: 'Locations & Warehouses', path: '/settings?tab=locations', searchParam: 'tab=locations' },
      { id: 'set-payments', label: 'Payments & Razorpay', path: '/settings?tab=payments', searchParam: 'tab=payments' },
      { id: 'set-shipping', label: 'Shipping & Delivery', path: '/settings?tab=shipping', searchParam: 'tab=shipping' },
      { id: 'set-taxes', label: 'Taxes & GSTIN', path: '/settings?tab=taxes', searchParam: 'tab=taxes' },
      { id: 'set-domains', label: 'Custom Domains', path: '/settings?tab=domains', searchParam: 'tab=domains' },
      { id: 'set-notifications', label: 'Notifications & Emails', path: '/settings?tab=notifications', searchParam: 'tab=notifications' },
      { id: 'set-security', label: 'Security & Staff Access', path: '/settings?tab=security', searchParam: 'tab=security' },
    ]
  }
];

const Sidebar: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, storeName, logout } = useAuthStore();

  // Accordion state: Orders is expanded by default matching visual sample
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    orders: true,
    appointments: false,
    catalogue: false,
    people: false,
    finance: false,
    pos: false,
    'online-store': false,
    extensions: false,
    settings: false,
  });

  // Automatically expand accordion if the user navigates directly into one of its routes
  useEffect(() => {
    const currentPath = location.pathname;

    if (currentPath.startsWith('/orders')) {
      setOpenSections(prev => ({ ...prev, orders: true }));
    } else if (currentPath.startsWith('/appointments')) {
      setOpenSections(prev => ({ ...prev, appointments: true }));
    } else if (currentPath.startsWith('/products')) {
      setOpenSections(prev => ({ ...prev, catalogue: true }));
    } else if (currentPath.startsWith('/people') || currentPath.startsWith('/team')) {
      setOpenSections(prev => ({ ...prev, people: true }));
    } else if (currentPath.startsWith('/finance')) {
      setOpenSections(prev => ({ ...prev, finance: true }));
    } else if (currentPath.startsWith('/pos-counters') || currentPath.startsWith('/pos')) {
      setOpenSections(prev => ({ ...prev, pos: true }));
    } else if (currentPath.startsWith('/editor') || currentPath.startsWith('/pages')) {
      setOpenSections(prev => ({ ...prev, 'online-store': true }));
    } else if (currentPath.startsWith('/extensions')) {
      setOpenSections(prev => ({ ...prev, extensions: true }));
    } else if (currentPath.startsWith('/settings')) {
      setOpenSections(prev => ({ ...prev, settings: true }));
    }
  }, [location.pathname, location.search]);

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const isHomeActive = location.pathname === '/dashboard' || location.pathname === '/';

  const isSubItemActive = (item: SubItem) => {
    const currentPath = location.pathname;
    const currentSearch = location.search;

    if (item.searchParam) {
      return currentPath === item.path.split('?')[0] && currentSearch.includes(item.searchParam);
    }

    if (item.path.includes('?')) {
      return false;
    }
    return currentPath === item.path && (!currentSearch || currentSearch === '?');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={styles.sidebar}>
      {/* Scrollable Navigation Items */}
      <nav className={styles.navContainer}>
        {/* 1. Home Direct Link */}
        <div className={styles.sectionHeaderWrap}>
          <Link 
            to="/dashboard" 
            className={`${styles.itemBtn} ${isHomeActive ? styles.itemActiveDirect : ''}`}
          >
            <div className={styles.itemLeft}>
              <Home size={19} className={styles.itemIcon} />
              <span className={styles.itemLabel}>Home</span>
            </div>
          </Link>
        </div>

        {/* 2. All Dropdown Accordion Sections */}
        {navSections.map((section) => {
          const isOpen = Boolean(openSections[section.id]);
          const Icon = section.icon;

          return (
            <div key={section.id} className={styles.sectionGroup}>
              {/* Accordion Header Row */}
              <button
                type="button"
                className={styles.dropdownBtn}
                onClick={() => toggleSection(section.id)}
                aria-expanded={isOpen}
              >
                <div className={styles.itemLeft}>
                  <Icon size={19} className={styles.itemIcon} />
                  <span className={styles.itemLabel}>{section.label}</span>
                </div>
                {isOpen ? (
                  <ChevronUp size={16} className={styles.chevronIcon} />
                ) : (
                  <ChevronDown size={16} className={styles.chevronIcon} />
                )}
              </button>

              {/* Sub-items List with thin left guide line */}
              {isOpen && (
                <div className={styles.subList}>
                  {section.items.map((sub) => {
                    const active = isSubItemActive(sub);
                    return (
                      <Link
                        key={sub.id}
                        to={sub.path}
                        className={`${styles.subItem} ${active ? styles.subItemActive : ''}`}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* DOCKED BOTTOM FOOTER: Store Info & Direct Logout Feature */}
      <div className={styles.bottomFooter}>
        <div className={styles.storePill}>
          <div className={styles.storePillLeft}>
            <span className={styles.storeNameText}>{storeName || 'Primary Store'}</span>
            <span className={styles.merchantEmail}>{user?.email || 'admin@chandraprakash.codes'}</span>
          </div>
        </div>

        {/* Direct Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className={styles.logoutBtn}
          title="Sign out of BillionBiz Merchant Admin"
        >
          <LogOut size={16} className={styles.logoutIcon} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
