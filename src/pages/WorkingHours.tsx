import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
  Clock,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api/services';
import { TableSkeleton } from '../components/common/SkeletonLoader';

const DAYS_OF_WEEK = [
  { day: 1, name: 'Monday' },
  { day: 2, name: 'Tuesday' },
  { day: 3, name: 'Wednesday' },
  { day: 4, name: 'Thursday' },
  { day: 5, name: 'Friday' },
  { day: 6, name: 'Saturday' },
  { day: 0, name: 'Sunday' }
];

export const WorkingHoursPage: FC = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'breaks' | 'holidays'>('schedule');
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchHours = () => {
    setLoading(true);
    api.getWorkingHours()
      .then((res: any) => {
        const loadedShifts = res.workingHours || res.shifts || [];
        // Map 7 days
        const mapped = DAYS_OF_WEEK.map((d) => {
          const found = loadedShifts.find((s: any) => s.day_of_week === d.day);
          return {
            day_of_week: d.day,
            name: d.name,
            is_active: found ? found.is_active : d.day !== 0,
            start_time: found ? found.start_time : '09:00',
            end_time: found ? found.end_time : '19:00'
          };
        });
        setShifts(mapped);
      })
      .catch((err) => {
        console.error('Failed to load working hours', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHours();
  }, []);

  const handleToggleDay = (day: number) => {
    setShifts((prev) =>
      prev.map((s) => (s.day_of_week === day ? { ...s, is_active: !s.is_active } : s))
    );
  };

  const handleTimeChange = (day: number, field: 'start_time' | 'end_time', value: string) => {
    setShifts((prev) =>
      prev.map((s) => (s.day_of_week === day ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateWorkingHours(shifts);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to save working hours');
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
            <Clock size={26} color="#0d9488" />
            Working Hours & Shifts (IST)
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            Configure regular operating windows in Indian Standard Time (Asia/Kolkata, UTC+5:30).
          </p>
        </div>

        <button
          onClick={handleSave}
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
          {isSaving ? 'Saving Changes...' : 'Save Working Hours'}
        </button>
      </div>

      {saveSuccess && (
        <div style={{ padding: '12px 18px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#15803d', fontSize: '14px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} />
          Working hours updated and live on client appointment booking widget!
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('schedule')}
          style={{
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: activeTab === 'schedule' ? 600 : 500,
            color: activeTab === 'schedule' ? '#0d9488' : '#64748b',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'schedule' ? '2px solid #0d9488' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Weekly Schedule (IST)
        </button>
        <button
          onClick={() => setActiveTab('breaks')}
          style={{
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: activeTab === 'breaks' ? 600 : 500,
            color: activeTab === 'breaks' ? '#0d9488' : '#64748b',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'breaks' ? '2px solid #0d9488' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Break Windows
        </button>
        <button
          onClick={() => setActiveTab('holidays')}
          style={{
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: activeTab === 'holidays' ? 600 : 500,
            color: activeTab === 'holidays' ? '#0d9488' : '#64748b',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'holidays' ? '2px solid #0d9488' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Special Holidays
        </button>
      </div>

      {loading ? (
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <TableSkeleton rows={7} columns={3} />
        </div>
      ) : activeTab === 'schedule' ? (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {shifts.map((s) => (
              <div
                key={s.day_of_week}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  background: s.is_active ? '#f8fafc' : '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  opacity: s.is_active ? 1 : 0.65
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '180px' }}>
                  <input
                    type="checkbox"
                    checked={s.is_active}
                    onChange={() => handleToggleDay(s.day_of_week)}
                    style={{ accentColor: '#0d9488', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                    {s.name}
                  </span>
                </div>

                {s.is_active ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                    <input
                      type="time"
                      value={s.start_time.slice(0, 5)}
                      onChange={(e) => handleTimeChange(s.day_of_week, 'start_time', e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                    />
                    <span style={{ color: '#64748b' }}>to</span>
                    <input
                      type="time"
                      value={s.end_time.slice(0, 5)}
                      onChange={(e) => handleTimeChange(s.day_of_week, 'end_time', e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                    />
                    <span style={{ color: '#0d9488', fontSize: '12px', fontWeight: 600 }}>IST</span>
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                    Closed / Not Operating
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'breaks' ? (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '32px', textAlign: 'center', color: '#475569' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Mid-Day Lunch & Break Windows</h3>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '480px', margin: '0 auto 20px auto' }}>
            Prevent automated client bookings during lunch hours (e.g. 13:00 - 14:00 IST) across all practitioner schedules.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderRadius: '8px', background: '#f0fdfa', border: '1px solid #ccfbf1', color: '#0f766e', fontSize: '13px', fontWeight: 600 }}>
            <Clock size={16} />
            Default Staff Break: 13:00 - 14:00 IST (Active)
          </div>
        </div>
      ) : (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '32px', textAlign: 'center', color: '#475569' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>National & Festive Holidays</h3>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '480px', margin: '0 auto' }}>
            Store closures on Republic Day, Diwali, and custom merchant blackout dates automatically block slot holds.
          </p>
        </div>
      )}
    </div>
  );
};

export default WorkingHoursPage;
