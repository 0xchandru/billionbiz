import React, { useState, useEffect } from 'react';
import { CheckCircle, Plus, RefreshCw, X } from 'lucide-react';
import { api } from '../api/services';

const formatCurrency = (minor: number) => {
  return '₹' + (minor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
};

const AppointmentsPage: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Booking form state
  const [selectedOffering, setSelectedOffering] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [intakeNotes, setIntakeNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bkgRes, offRes] = await Promise.all([
        api.getBookings(),
        api.getOfferings()
      ]);
      setBookings(bkgRes.bookings || []);
      setOfferings(offRes.offerings || []);
      if (offRes.offerings?.length > 0 && !selectedOffering) {
        setSelectedOffering(offRes.offerings[0].id);
      }
    } catch (err) {
      console.error('Failed to load appointments data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadAvailability = async () => {
    if (!selectedOffering || !selectedDate) return;
    try {
      const res = await api.getAvailability(selectedOffering, selectedDate);
      setAvailableSlots(res.slots?.filter((s: any) => s.isAvailable) || []);
      setSelectedSlot(null);
    } catch (err) {
      console.error('Failed to load availability', err);
    }
  };

  useEffect(() => {
    if (isBookModalOpen && selectedOffering && selectedDate) {
      loadAvailability();
    }
  }, [selectedOffering, selectedDate, isBookModalOpen]);

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      alert('Please select an available time slot');
      return;
    }

    try {
      setSubmitting(true);
      const offeringObj = offerings.find(o => o.id === selectedOffering);
      const resourceId = offeringObj?.resource_ids?.[0] || 'res-stylist-shoum-01';

      // 1. Hold slot
      const hold = await api.holdSlot({
        offeringId: selectedOffering,
        resourceId,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime
      });

      // 2. Confirm booking
      await api.createBooking({
        offeringId: selectedOffering,
        resourceId,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        holdToken: hold.holdToken,
        customerDetails: {
          firstName: clientName,
          email: clientEmail,
          phone: clientPhone
        },
        intakeNotes
      });

      setIsBookModalOpen(false);
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setIntakeNotes('');
      await loadData();
      alert('Appointment booked successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to complete booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1f36', margin: 0 }}>Appointments & Scheduling</h1>
          <p style={{ color: '#697386', marginTop: '4px', fontSize: '14px' }}>
            Manage service offerings, staff capacity, client bookings, and deposits.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={loadData}
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
            onClick={() => setIsBookModalOpen(true)}
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
            <span>New Booking</span>
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e3e8ee', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e3e8ee', color: '#4f566b' }}>
              <th style={{ padding: '12px 16px' }}>Booking #</th>
              <th style={{ padding: '12px 16px' }}>Date & Time</th>
              <th style={{ padding: '12px 16px' }}>Service Offering</th>
              <th style={{ padding: '12px 16px' }}>Assigned Resource</th>
              <th style={{ padding: '12px 16px' }}>Client</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Balance Due</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#697386' }}>
                  Loading appointments...
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#697386' }}>
                  No active bookings scheduled. Click "New Booking" to reserve a client slot.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0066cc' }}>{b.booking_number}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '500' }}>{new Date(b.start_time).toLocaleDateString()}</div>
                    <div style={{ fontSize: '12px', color: '#697386' }}>
                      {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                    {b.offering_name}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#4f566b' }}>
                    {b.resource_name}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div>{b.first_name ? `${b.first_name} ${b.last_name || ''}` : 'Walk-in Client'}</div>
                    <div style={{ fontSize: '12px', color: '#8792a2' }}>{b.phone || b.email || ''}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: b.status === 'COMPLETED' ? '#e6f7ec' : '#edf2ff',
                      color: b.status === 'COMPLETED' ? '#0d8a3e' : '#3366ff'
                    }}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                    {b.balance_due_minor > 0 ? (
                      <span style={{ color: '#d9381e' }}>{formatCurrency(b.balance_due_minor)}</span>
                    ) : (
                      <span style={{ color: '#0d8a3e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={14} /> Settled
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isBookModalOpen && (
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
          <form onSubmit={handleConfirmBooking} style={{ background: '#fff', borderRadius: '8px', width: '520px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Schedule New Appointment</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setIsBookModalOpen(false)} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Select Service *</label>
              <select
                value={selectedOffering}
                onChange={(e) => setSelectedOffering(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #dcdfe4' }}
              >
                {offerings.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.duration_minutes} min) — {formatCurrency(o.price_minor)}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Appointment Date *</label>
              <input
                type="date"
                required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #dcdfe4' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Available Slots</label>
              {availableSlots.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#8792a2', padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                  No open slots found for this date.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', maxHeight: '140px', overflowY: 'auto' }}>
                  {availableSlots.map((slot, idx) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;
                    const timeLabel = new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          padding: '8px',
                          borderRadius: '4px',
                          border: isSelected ? '2px solid #0066cc' : '1px solid #dcdfe4',
                          background: isSelected ? '#edf2ff' : '#fff',
                          color: isSelected ? '#0066cc' : '#1a1f36',
                          fontWeight: isSelected ? '600' : '400',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {timeLabel}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #dcdfe4' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Client Phone</label>
                <input
                  type="tel"
                  placeholder="+919876543210"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #dcdfe4' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Client Email</label>
              <input
                type="email"
                placeholder="client@example.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #dcdfe4' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Intake Notes / Instructions</label>
              <textarea
                rows={2}
                placeholder="Specific styling or requirements..."
                value={intakeNotes}
                onChange={(e) => setIntakeNotes(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #dcdfe4' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsBookModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #dcdfe4', background: '#fff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedSlot}
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
                {submitting ? 'Confirming...' : 'Confirm Appointment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
