import React, { useState, useEffect } from 'react';
import { CheckCircle, Search, RefreshCw, X } from 'lucide-react';
import { api } from '../api/services';

const formatCurrency = (minor: number) => {
  return '₹' + (minor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
};

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);
  const [carrier, setCarrier] = useState('Shiprocket Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders({
        search: search || undefined,
        status: statusFilter || undefined
      });
      setOrders(res.orders || []);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleFulfill = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      await api.fulfillOrder(selectedOrder.id, { carrier, trackingNumber });
      setIsFulfillModalOpen(false);
      setSelectedOrder(null);
      await loadOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to fulfill order');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1f36', margin: 0 }}>Orders Workbench</h1>
          <p style={{ color: '#697386', marginTop: '4px', fontSize: '14px' }}>
            Manage customer purchases, fulfillment, and shipment tracking.
          </p>
        </div>
        <button
          onClick={loadOrders}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #dcdfe4',
            background: '#fff',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#8792a2' }} />
          <input
            type="text"
            placeholder="Search by order number or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              borderRadius: '6px',
              border: '1px solid #dcdfe4',
              fontSize: '14px'
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '6px',
            border: '1px solid #dcdfe4',
            background: '#fff',
            fontSize: '14px'
          }}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e3e8ee', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e3e8ee', color: '#4f566b' }}>
              <th style={{ padding: '12px 16px' }}>Order Number</th>
              <th style={{ padding: '12px 16px' }}>Date</th>
              <th style={{ padding: '12px 16px' }}>Customer</th>
              <th style={{ padding: '12px 16px' }}>Payment</th>
              <th style={{ padding: '12px 16px' }}>Fulfillment</th>
              <th style={{ padding: '12px 16px' }}>Total</th>
              <th style={{ padding: '12px 16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#697386' }}>
                  Loading orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#697386' }}>
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0066cc' }}>{o.order_number}</td>
                  <td style={{ padding: '12px 16px', color: '#697386' }}>
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {o.first_name ? `${o.first_name} ${o.last_name || ''}` : 'Guest Customer'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: o.payment_status === 'CAPTURED' ? '#e6f7ec' : '#fff8e6',
                      color: o.payment_status === 'CAPTURED' ? '#0d8a3e' : '#b25e00'
                    }}>
                      {o.payment_status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: o.fulfillment_status === 'FULFILLED' ? '#e6f7ec' : '#f0f2f5',
                      color: o.fulfillment_status === 'FULFILLED' ? '#0d8a3e' : '#4f566b'
                    }}>
                      {o.fulfillment_status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                    {formatCurrency(o.total_minor)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {o.fulfillment_status !== 'FULFILLED' ? (
                      <button
                        onClick={() => {
                          setSelectedOrder(o);
                          setTrackingNumber(`SR-${Date.now().toString().slice(-8)}`);
                          setIsFulfillModalOpen(true);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: 'none',
                          background: '#0066cc',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Ship Order
                      </button>
                    ) : (
                      <span style={{ color: '#0d8a3e', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={14} /> Fulfilled
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFulfillModalOpen && selectedOrder && (
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
          <div style={{ background: '#fff', borderRadius: '8px', width: '450px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Fulfill Order {selectedOrder.order_number}</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setIsFulfillModalOpen(false)} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Shipping Carrier</label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #dcdfe4' }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Tracking / AWB Number</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #dcdfe4' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setIsFulfillModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #dcdfe4', background: '#fff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleFulfill}
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
                {actionLoading ? 'Creating Shipment...' : 'Confirm Shipment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
