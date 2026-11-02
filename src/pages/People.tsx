import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  RefreshCw
} from 'lucide-react';
import { api } from '../api/services';

const formatCurrency = (minor: number) => {
  return '₹' + (minor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
};

export const PeoplePage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers({ search: search || undefined });
      setCustomers(res.customers || []);
    } catch (err) {
      console.error('[PeoplePage] Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#064652', margin: 0 }}>People & Customers</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Authoritative directory of registered customer accounts, order history, and booking clients.
          </p>
        </div>

        <button 
          onClick={loadCustomers}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search by customer name, email address, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
          />
        </div>
      </div>

      {/* Main Table / Empty State */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <div>Loading customer records...</div>
          </div>
        ) : customers.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <Users size={48} color="#94a3b8" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#064652' }}>No Customers Found</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b', maxWidth: '400px', marginInline: 'auto' }}>
              {search ? 'No customer profiles match your search criteria.' : 'When visitors place orders on your storefront or book services, their profile appears here automatically.'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px 20px' }}>Customer Name</th>
                <th style={{ padding: '12px 20px' }}>Contact Details</th>
                <th style={{ padding: '12px 20px' }}>Total Orders</th>
                <th style={{ padding: '12px 20px' }}>Lifetime Value</th>
                <th style={{ padding: '12px 20px' }}>First Seen</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr 
                  key={c.id}
                  style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                        {(c.first_name || c.email || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>
                          {c.first_name || c.last_name ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : 'Guest Customer'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>ID: {c.id.substring(0, 12)}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: '#475569' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '13px' }}>
                      {c.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={12} color="#94a3b8" />
                          <span>{c.email}</span>
                        </div>
                      )}
                      {c.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={12} color="#94a3b8" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: '600', color: '#0f172a' }}>
                    {c.total_orders || 0} orders
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: '600', color: '#5A9A20' }}>
                    {formatCurrency(c.total_spent_minor || 0)}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '13px' }}>
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Recent'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PeoplePage;
