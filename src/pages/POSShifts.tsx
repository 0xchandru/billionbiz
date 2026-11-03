import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Store, Search, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../api/services';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';

export const POSShifts: FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'closed' | 'discrepancy'>('all');
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await api.getPOSShifts();
      setShifts(res.shifts || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load POS shifts:', err);
      setError(err.message || 'Unable to load POS shifts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const formatCurrency = (minor: number | string | undefined) => {
    const val = typeof minor === 'number' ? minor : parseInt(minor as string || '0', 10);
    return `₹${(val / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const filteredShifts = shifts.filter((s) => {
    const matchesSearch =
      (s.counter_name && s.counter_name.toLowerCase().includes(search.toLowerCase())) ||
      (s.counter_code && s.counter_code.toLowerCase().includes(search.toLowerCase())) ||
      (s.opened_by_name && s.opened_by_name.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeTab === 'open') return s.status === 'OPEN';
    if (activeTab === 'closed') return s.status === 'CLOSED';
    if (activeTab === 'discrepancy') return s.variance_minor && parseInt(s.variance_minor, 10) !== 0;
    return true;
  });

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto', color: '#0f172a' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>
            <span>POS & Counters</span>
            <span>/</span>
            <span style={{ color: '#083e47', fontWeight: 600 }}>Shifts & Floats</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#0f172a' }}>Register Shifts & Cash Floats</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
            Auditable cash drawer sessions, opening float disbursements, and end-of-shift Z-Report reconciliations.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Shifts Logged</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>{shifts.length}</div>
        </div>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Open Registers</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0284c7', marginTop: '6px' }}>
            {shifts.filter(s => s.status === 'OPEN').length}
          </div>
        </div>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reconciled & Closed</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a', marginTop: '6px' }}>
            {shifts.filter(s => s.status === 'CLOSED').length}
          </div>
        </div>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cash Discrepancies</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#d97706', marginTop: '6px' }}>
            {shifts.filter(s => s.variance_minor && parseInt(s.variance_minor, 10) !== 0).length}
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'all', label: 'All Shift Sessions' },
            { id: 'open', label: 'Active Open' },
            { id: 'closed', label: 'Closed Z-Reports' },
            { id: 'discrepancy', label: 'Discrepancy Audit' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                backgroundColor: activeTab === tab.id ? '#083e47' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#64748b',
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
            placeholder="Search register or cashier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '8px 12px 8px 36px',
              color: '#0f172a',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonLoader count={4} height={70} />
      ) : error ? (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px', color: '#b91c1c' }}>
          {error}
        </div>
      ) : filteredShifts.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No Register Sessions Logged"
          description={
            search
              ? 'No shifts match your search query.'
              : 'When your cashiers open and close POS registers, their shifts, opening floats, and cash drawer reconciliations will be logged here.'
          }
        />
      ) : (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>REGISTER</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>OPENING FLOAT</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>EXPECTED CASH</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>CLOSING COUNT</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>VARIANCE</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>CASHIER</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>OPENED AT</th>
              </tr>
            </thead>
            <tbody>
              {filteredShifts.map((s) => {
                const variance = s.variance_minor ? parseInt(s.variance_minor, 10) : 0;
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{s.counter_name || 'Counter'}</div>
                      <div style={{ fontSize: '12px', color: '#083e47', fontFamily: 'monospace' }}>{s.counter_code}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: s.status === 'OPEN' ? '#0284c7' : '#16a34a'
                        }}
                      >
                        {s.status === 'OPEN' ? <Clock size={13} /> : <CheckCircle size={13} />}
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#334155' }}>
                      {formatCurrency(s.opening_float_minor)}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#334155' }}>
                      {s.expected_cash_minor !== null ? formatCurrency(s.expected_cash_minor) : '—'}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#0f172a', fontWeight: 600 }}>
                      {s.closing_cash_minor !== null ? formatCurrency(s.closing_cash_minor) : 'Active'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {s.status === 'CLOSED' ? (
                        variance === 0 ? (
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>₹0.00 (Balanced)</span>
                        ) : variance > 0 ? (
                          <span style={{ color: '#0284c7', fontWeight: 600 }}>+{formatCurrency(variance)} (Overage)</span>
                        ) : (
                          <span style={{ color: '#dc2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={13} />
                            {formatCurrency(variance)} (Shortage)
                          </span>
                        )
                      ) : (
                        <span style={{ color: '#64748b' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#334155' }}>
                      {s.opened_by_name || 'Cashier'}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '12px' }}>
                      {new Date(s.opened_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default POSShifts;
