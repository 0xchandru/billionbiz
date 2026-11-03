import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Briefcase, Search, Users, UserCheck } from 'lucide-react';
import { api } from '../api/services';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';

export const Responsibilities: FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'appointments' | 'cashier' | 'fulfillment' | 'management'>('all');
  const [responsibilities, setResponsibilities] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [respRes, membersRes] = await Promise.all([
        api.getResponsibilities(),
        api.getTeamMembers()
      ]);
      setResponsibilities(respRes.responsibilities || []);
      setTeamMembers(membersRes.members || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load operational responsibilities:', err);
      setError(err.message || 'Unable to load operational responsibilities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getAssignedMembers = (respId: string) => {
    return teamMembers.filter((m) => {
      let resps = m.responsibilities;
      if (typeof resps === 'string') {
        try { resps = JSON.parse(resps); } catch { resps = []; }
      }
      return Array.isArray(resps) && resps.includes(respId);
    });
  };

  const filteredResponsibilities = responsibilities.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === 'appointments') return r.id === 'APPOINTMENT_STAFF';
    if (activeTab === 'cashier') return r.id === 'CASHIER';
    if (activeTab === 'fulfillment') return r.id === 'FULFILLMENT_STAFF';
    if (activeTab === 'management') return r.id === 'MANAGER' || r.id === 'ADMIN_STAFF';
    return true;
  });

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto', color: '#f8fafc' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>
            <span>Team</span>
            <span>/</span>
            <span style={{ color: '#38bdf8' }}>Responsibilities</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>Operational Responsibilities</h1>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Multi-responsibility mapping across your workforce. Staff members can hold both Cashier and Appointment specialist responsibilities simultaneously.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Profiles Defined</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', marginTop: '6px' }}>{responsibilities.length}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Active Personnel</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#38bdf8', marginTop: '6px' }}>
            {teamMembers.filter(m => m.is_active).length}
          </div>
        </div>
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Multi-Functional Staff</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#4ade80', marginTop: '6px' }}>
            {teamMembers.filter(m => {
              let resps = m.responsibilities;
              if (typeof resps === 'string') {
                try { resps = JSON.parse(resps); } catch { resps = []; }
              }
              return Array.isArray(resps) && resps.length > 1;
            }).length}
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'all', label: 'All Operational Profiles' },
            { id: 'appointments', label: 'Appointment Specialists' },
            { id: 'cashier', label: 'Counter Cashiers' },
            { id: 'fulfillment', label: 'Fulfillment Operators' },
            { id: 'management', label: 'Store Management' },
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
            placeholder="Search responsibility..."
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
        <SkeletonLoader count={4} height={90} />
      ) : error ? (
        <div style={{ backgroundColor: '#ef444415', border: '1px solid #ef444450', borderRadius: '8px', padding: '16px', color: '#f87171' }}>
          {error}
        </div>
      ) : filteredResponsibilities.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No Operational Responsibilities Found"
          description={search ? 'No profiles match your search term.' : 'No profiles found.'}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
          {filteredResponsibilities.map((resp) => {
            const assigned = getAssignedMembers(resp.id);
            return (
              <div
                key={resp.id}
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: '#0284c720',
                          color: '#38bdf8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <UserCheck size={18} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>{resp.name}</h3>
                        <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{resp.id}</span>
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: assigned.length > 0 ? '#4ade8015' : '#64748b20',
                        color: assigned.length > 0 ? '#4ade80' : '#94a3b8',
                        border: `1px solid ${assigned.length > 0 ? '#4ade8030' : '#64748b30'}`
                      }}
                    >
                      {assigned.length} ASSIGNED
                    </span>
                  </div>

                  <p style={{ margin: '12px 0 16px', color: '#94a3b8', fontSize: '13px', lineHeight: 1.5 }}>
                    {resp.description}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #33415550', paddingTop: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} style={{ color: '#38bdf8' }} />
                    Active Qualified Personnel ({assigned.length})
                  </div>

                  {assigned.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                      No staff members currently assigned to this operational responsibility.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {assigned.map((staff) => (
                        <span
                          key={staff.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            color: '#e2e8f0'
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ade80' }} />
                          {staff.display_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Responsibilities;
