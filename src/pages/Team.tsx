import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, X } from 'lucide-react';
import { api } from '../api/services';

const TeamPage: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Invite Form
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [roleCode, setRoleCode] = useState('CASHIER');
  const [pin, setPin] = useState('1234');
  const [submitting, setSubmitting] = useState(false);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const [memRes, rolRes] = await Promise.all([
        api.getTeamMembers(),
        api.getRoles()
      ]);
      setMembers(memRes.members || []);
      setRoles(rolRes.roles || []);
    } catch (err) {
      console.error('Failed to load team data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createTeamMember({
        displayName,
        email: email || undefined,
        roleCode,
        pin
      });
      setIsInviteOpen(false);
      setDisplayName('');
      setEmail('');
      setPin('1234');
      await loadTeam();
      alert('Team member added successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to add team member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1f36', margin: 0 }}>Team Management & Roles</h1>
          <p style={{ color: '#697386', marginTop: '4px', fontSize: '14px' }}>
            Manage staff profiles, permissions, cashier terminal PINs, and role assignments.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={loadTeam}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #dcdfe4',
              background: '#fff',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsInviteOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: '#0066cc',
              color: '#fff',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e3e8ee', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e3e8ee', color: '#4f566b' }}>
              <th style={{ padding: '12px 16px' }}>Staff Name</th>
              <th style={{ padding: '12px 16px' }}>Email / Login</th>
              <th style={{ padding: '12px 16px' }}>Assigned Role</th>
              <th style={{ padding: '12px 16px' }}>Store Scope</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#697386' }}>
                  Loading team profiles...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#697386' }}>
                  No team members added yet.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#1a1f36' }}>
                    {m.display_name}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#697386' }}>
                    {m.email || 'Counter Staff (PIN Auth)'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: m.role_code === 'OWNER' ? '#e6f7ec' : '#edf2ff',
                      color: m.role_code === 'OWNER' ? '#0d8a3e' : '#0066cc'
                    }}>
                      {m.role_name || m.role_code || 'Staff'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#4f566b' }}>
                    {m.store_name || 'All Locations'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: m.is_active ? '#e6f7ec' : '#fbeae9',
                      color: m.is_active ? '#0d8a3e' : '#d9381e'
                    }}>
                      {m.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isInviteOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <form onSubmit={handleInvite} style={{ background: '#fff', borderRadius: '8px', width: '450px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Add Team Member</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setIsInviteOpen(false)} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Full Display Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #dcdfe4' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Email Address (Optional for Cashiers)</label>
              <input
                type="email"
                placeholder="rahul@store.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #dcdfe4' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Select Role *</label>
              <select
                value={roleCode}
                onChange={(e) => setRoleCode(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #dcdfe4' }}
              >
                {roles.map(r => (
                  <option key={r.id} value={r.code}>{r.name} ({r.code})</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>POS Counter Terminal PIN (4-6 digits)</label>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #dcdfe4' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #dcdfe4', background: '#fff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#0066cc',
                  color: '#fff',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {submitting ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TeamPage;
