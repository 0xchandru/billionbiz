import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Compass, Plus, Search, Trash2, ExternalLink, Link as LinkIcon, Check } from 'lucide-react';
import { api } from '../api/services';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';

export const StoreNavigation: FC = () => {
  const [activeTab, setActiveTab] = useState<'HEADER' | 'FOOTER' | 'DRAWER'>('HEADER');
  const [navigation, setNavigation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [label, setLabel] = useState('');
  const [path, setPath] = useState('');
  const [target, setTarget] = useState('_self');
  const [menuType, setMenuType] = useState<'HEADER' | 'FOOTER' | 'DRAWER'>('HEADER');

  const fetchNavigation = async () => {
    setLoading(true);
    try {
      const res = await api.getStoreNavigation();
      setNavigation(res.navigation || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load store navigation:', err);
      setError(err.message || 'Unable to load navigation menus');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNavigation();
  }, []);

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !path.trim()) return;

    setSubmitting(true);
    try {
      const newItem = {
        id: `nav-${Date.now()}`,
        label: label.trim(),
        path: path.trim(),
        target,
        menu_type: menuType,
        is_active: true
      };
      const updated = [...navigation, newItem];
      await api.updateStoreNavigation(updated);
      setNavigation(updated);
      setIsModalOpen(false);
      setLabel('');
      setPath('');
      setTarget('_self');
    } catch (err: any) {
      alert(err.message || 'Failed to add navigation menu item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm('Remove this menu link?')) return;
    try {
      const updated = navigation.filter((item) => item.id !== id);
      await api.updateStoreNavigation(updated);
      setNavigation(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to remove menu item');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const updated = navigation.map((item) =>
        item.id === id ? { ...item, is_active: !item.is_active } : item
      );
      await api.updateStoreNavigation(updated);
      setNavigation(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update menu item');
    }
  };

  const filteredLinks = navigation.filter((item) => {
    const itemMenuType = item.menu_type || 'HEADER';
    if (itemMenuType !== activeTab) return false;

    if (search) {
      const matches =
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.path.toLowerCase().includes(search.toLowerCase());
      if (!matches) return false;
    }

    return true;
  });

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto', color: '#f8fafc' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>
            <span>Online Store</span>
            <span>/</span>
            <span style={{ color: '#38bdf8' }}>Navigation</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>Navigation Menus & Links</h1>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Control header navigation bars, nested dropdown links, and footer links visible on your customer storefront.
          </p>
        </div>

        <button
          onClick={() => {
            setMenuType(activeTab);
            setIsModalOpen(true);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.15s ease'
          }}
        >
          <Plus size={16} />
          Add Menu Item
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Header Links</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', marginTop: '6px' }}>
            {navigation.filter(n => (n.menu_type || 'HEADER') === 'HEADER').length}
          </div>
        </div>
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Footer Links</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#38bdf8', marginTop: '6px' }}>
            {navigation.filter(n => n.menu_type === 'FOOTER').length}
          </div>
        </div>
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Mobile Drawer Links</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#a855f7', marginTop: '6px' }}>
            {navigation.filter(n => n.menu_type === 'DRAWER').length}
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'HEADER', label: 'Main Header Menu' },
            { id: 'FOOTER', label: 'Footer Links' },
            { id: 'DRAWER', label: 'Mobile Drawer Menu' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                backgroundColor: activeTab === tab.id ? '#334155' : 'transparent',
                color: activeTab === tab.id ? '#38bdf8' : '#94a3b8',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search links..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '8px 12px 8px 36px',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonLoader count={4} height={65} />
      ) : error ? (
        <div style={{ backgroundColor: '#ef444415', border: '1px solid #ef444450', borderRadius: '8px', padding: '16px', color: '#f87171' }}>
          {error}
        </div>
      ) : filteredLinks.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No Menu Items Found"
          description={
            search
              ? 'No links match your filter query.'
              : `You have not configured any menu items for the ${activeTab.toLowerCase()} menu.`
          }
          actionLabel="Add First Menu Link"
          onAction={() => {
            setMenuType(activeTab);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>MENU TITLE</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>DESTINATION PATH / URL</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>TARGET</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>VISIBILITY</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredLinks.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #33415550' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LinkIcon size={14} style={{ color: '#38bdf8' }} />
                      {item.label}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'monospace', color: '#cbd5e1' }}>
                    {item.path}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {item.target === '_blank' ? <ExternalLink size={12} /> : null}
                      {item.target === '_blank' ? 'New Tab' : 'Same Tab'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <button
                      onClick={() => handleToggleActive(item.id)}
                      style={{
                        backgroundColor: item.is_active ? '#4ade8020' : '#64748b20',
                        color: item.is_active ? '#4ade80' : '#94a3b8',
                        border: `1px solid ${item.is_active ? '#4ade8040' : '#64748b40'}`,
                        borderRadius: '12px',
                        padding: '3px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {item.is_active && <Check size={11} />}
                      {item.is_active ? 'Visible' : 'Hidden'}
                    </button>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDeleteLink(item.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '4px',
                        transition: 'color 0.15s'
                      }}
                      title="Delete Link"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Menu Link Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '16px',
              padding: '28px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
          >
            <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>Add Menu Item</h2>
            <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: '13px' }}>
              Add a navigation link to your customer-facing storefront menu.
            </p>

            <form onSubmit={handleAddLink}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Menu Destination Section
                </label>
                <select
                  value={menuType}
                  onChange={(e) => setMenuType(e.target.value as any)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  <option value="HEADER">Main Header Menu</option>
                  <option value="FOOTER">Footer Links</option>
                  <option value="DRAWER">Mobile Drawer Menu</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Link Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Seasonal Offers"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Destination URL / Path *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., /shop?category=sale or https://..."
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Open Target
                </label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  <option value="_self">Same Tab (_self)</option>
                  <option value="_blank">New Tab (_blank)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #334155',
                    color: '#94a3b8',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: '#0284c7',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? 'Saving...' : 'Add Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreNavigation;
