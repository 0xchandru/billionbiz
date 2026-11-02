import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Home, 
  ShoppingCart, 
  Calendar, 
  Package, 
  Users, 
  Wallet, 
  Palette,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import styles from './Sidebar.module.css';

interface SubItem {
  id: string;
  label: string;
  path: string;
  searchParam?: string;
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
      { id: 'taxes', label: 'Taxes', path: '/settings?tab=taxes', searchParam: 'tab=taxes' },
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
      { id: 'domains', label: 'Domains', path: '/settings?tab=domains', searchParam: 'tab=domains' },
      { id: 'preferences', label: 'Preferences', path: '/settings' },
    ]
  }
];

const Sidebar: FC = () => {
  const location = useLocation();

  // Accordion state: Orders is expanded by default matching Image 2
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    orders: true,
    appointments: false,
    catalogue: false,
    people: false,
    finance: false,
    'online-store': false,
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
    } else if (currentPath.startsWith('/editor') || currentPath.startsWith('/pages')) {
      setOpenSections(prev => ({ ...prev, 'online-store': true }));
    }
  }, [location.pathname]);

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

    // Default top item of path when no specific searchParam
    if (item.path.includes('?')) {
      return false;
    }
    return currentPath === item.path && (!currentSearch || currentSearch === '?');
  };

  return (
    <aside className={styles.sidebar}>
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

        {/* 2. Dropdown Accordion Sections */}
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
    </aside>
  );
};

export default Sidebar;
