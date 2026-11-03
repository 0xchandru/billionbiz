import { useState, useEffect } from 'react';
import type { FC, FormEvent } from 'react';
import {
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api/services';
import { TableSkeleton } from '../components/common/SkeletonLoader';

export const BookingSettingsPage: FC = () => {
  const [activeTab, setActiveTab] = useState<'policies' | 'reminders' | 'deposits'>('policies');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [confirmationMode, setConfirmationMode] = useState('AUTOMATIC');
  const [minNoticeHours, setMinNoticeHours] = useState(2);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(60);
  const [slotInterval, setSlotInterval] = useState(30);
  const [bufferMinutes, setBufferMinutes] = useState(10);
  const [cancellationPolicy, setCancellationPolicy] = useState('24 hours advance notice required for full refund.');
  const [reschedulingPolicy, setReschedulingPolicy] = useState('Permitted up to 12 hours prior to scheduled start.');
  const [depositRequired, setDepositRequired] = useState(false);

  const fetchSettings = () => {
    setLoading(true);
    api.getBookingSettings()
      .then((res) => {
        const s = res.settings;
        if (s) {
          setConfirmationMode(s.confirmation_mode || 'AUTOMATIC');
          setMinNoticeHours(s.min_notice_hours || 2);
          setMaxAdvanceDays(s.max_advance_days || 60);
          setSlotInterval(s.slot_interval_minutes || 30);
          setBufferMinutes(s.buffer_minutes || 10);
          setCancellationPolicy(s.cancellation_policy || '24 hours advance notice required for full refund.');
          setReschedulingPolicy(s.rescheduling_policy || 'Permitted up to 12 hours prior to scheduled start.');
          setDepositRequired(Boolean(s.deposit_required));
        }
      })
      .catch((err) => {
        console.error('Failed to load booking settings', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateBookingSettings({
        confirmationMode,
        minNoticeHours,
        maxAdvanceDays,
        slotIntervalMinutes: slotInterval,
        bufferMinutes,
        cancellationPolicy,
        reschedulingPolicy,
        depositRequired
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to save booking settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={26} color="#0d9488" />
            Booking Policies & Rules
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            Configure client lead times, automatic confirmation rules, and cancellation terms.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          style={{
            backgroundColor: '#0d9488',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(13, 148, 136, 0.25)'
          }}
        >
          {isSaving ? 'Saving...' : 'Save Policies'}
        </button>
      </div>

      {saveSuccess && (
        <div style={{ padding: '12px 18px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#15803d', fontSize: '14px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} />
          Booking settings saved and applied to customer calendar!
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('policies')}
          style={{
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: activeTab === 'policies' ? 600 : 500,
            color: activeTab === 'policies' ? '#0d9488' : '#64748b',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'policies' ? '2px solid #0d9488' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Scheduling Policies
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          style={{
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: activeTab === 'reminders' ? 600 : 500,
            color: activeTab === 'reminders' ? '#0d9488' : '#64748b',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'reminders' ? '2px solid #0d9488' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Confirmation & Reminders
        </button>
        <button
          onClick={() => setActiveTab('deposits')}
          style={{
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: activeTab === 'deposits' ? 600 : 500,
            color: activeTab === 'deposits' ? '#0d9488' : '#64748b',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'deposits' ? '2px solid #0d9488' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Deposit & Payment Rules
        </button>
      </div>

      {loading ? (
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <TableSkeleton rows={4} columns={2} />
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {activeTab === 'policies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Confirmation Mode
                  </label>
                  <select
                    value={confirmationMode}
                    onChange={(e) => setConfirmationMode(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: '#fff' }}
                  >
                    <option value="AUTOMATIC">Automatic Instant Confirmation</option>
                    <option value="MANUAL">Manual Review by Staff</option>
                  </select>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Automatic instantly holds the slot and sends the calendar invitation.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Slot Interval
                  </label>
                  <select
                    value={slotInterval}
                    onChange={(e) => setSlotInterval(parseInt(e.target.value, 10))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: '#fff' }}
                  >
                    <option value="15">Every 15 minutes</option>
                    <option value="30">Every 30 minutes</option>
                    <option value="45">Every 45 minutes</option>
                    <option value="60">Every 60 minutes</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Minimum Notice Required (Hours)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minNoticeHours}
                    onChange={(e) => setMinNoticeHours(parseInt(e.target.value, 10) || 0)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Clients cannot book appointments starting sooner than this.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Maximum Advance Booking (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxAdvanceDays}
                    onChange={(e) => setMaxAdvanceDays(parseInt(e.target.value, 10) || 60)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Cancellation Policy
                </label>
                <textarea
                  rows={2}
                  value={cancellationPolicy}
                  onChange={(e) => setCancellationPolicy(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Rescheduling Policy
                </label>
                <textarea
                  rows={2}
                  value={reschedulingPolicy}
                  onChange={(e) => setReschedulingPolicy(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            </div>
          )}

          {activeTab === 'reminders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Email & SMS Reminders</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Automated appointment notifications dispatched 24 hours and 2 hours before scheduled slot to minimize no-shows.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'deposits' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={depositRequired}
                  onChange={(e) => setDepositRequired(e.target.checked)}
                  style={{ accentColor: '#0d9488', width: '18px', height: '18px' }}
                />
                <span>Enforce Advance Deposit on All Online Service Bookings</span>
              </label>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Clients must tender the required deposit via UPI, cards, or Razorpay to finalize reservation hold tokens.
              </p>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default BookingSettingsPage;
