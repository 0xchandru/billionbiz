import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { api } from '../api/services';

const SettingsPage: React.FC = () => {
  const [store, setStore] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [mode, setMode] = useState<'COMMERCE' | 'SERVICES' | 'BOTH'>('BOTH');
  const [homePage, setHomePage] = useState<'LANDING' | 'BOOKING'>('LANDING');
  const [prodCommerce, setProdCommerce] = useState(true);
  const [appointments, setAppointments] = useState(true);
  const [restaurantPos, setRestaurantPos] = useState(true);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const storeId = localStorage.getItem('billionbiz_store_id') || 'store-shoum-default';
      const res = await api.getStoreDetails(storeId);
      setStore(res.store);
      if (res.store) {
        setMode(res.store.storefront_mode || 'BOTH');
        setHomePage(res.store.home_page || 'LANDING');
        setProdCommerce(res.store.product_commerce_enabled);
        setAppointments(res.store.appointments_enabled);
        setRestaurantPos(res.store.restaurant_pos_enabled);
      }
    } catch (err) {
      console.error('Failed to load store settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveCapabilities = async () => {
    if (!store) return;
    try {
      setSaving(true);
      // 1. Update backend capabilities
      await api.updateCapabilities(store.id, {
        productCommerceEnabled: prodCommerce,
        appointmentsEnabled: appointments,
        restaurantPosEnabled: restaurantPos
      });

      // 2. Update storefront mode preset and home page
      await api.updateStorefrontMode(store.id, {
        mode,
        homePage
      });

      alert('Storefront capabilities and mode updated successfully!');
      await loadSettings();
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !store) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#697386' }}>
        Loading store configuration...
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1f36', margin: 0 }}>Store Settings & Capabilities</h1>
          <p style={{ color: '#697386', marginTop: '4px', fontSize: '14px' }}>
            Configure dynamic Storefront Mode, backend capabilities, and landing experiences.
          </p>
        </div>
        <button
          disabled={saving}
          onClick={handleSaveCapabilities}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            background: '#0066cc',
            color: '#fff',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <Save size={16} />
          <span>{saving ? 'Saving Changes...' : 'Save Configuration'}</span>
        </button>
      </div>

      {/* Storefront Mode Selector Card (T-041, REQ-MODE-001) */}
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e3e8ee', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#1a1f36' }}>
          Customer Storefront Mode
        </h3>
        <p style={{ color: '#697386', fontSize: '14px', marginBottom: '20px' }}>
          Select the merchant operating model. BillionBiz dynamically adapts navigation, entry points, checkout journeys, and dashboard modules.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {/* Mode Option: Commerce */}
          <div
            onClick={() => {
              setMode('COMMERCE');
              if (!prodCommerce) setProdCommerce(true);
            }}
            style={{
              padding: '16px',
              borderRadius: '8px',
              border: mode === 'COMMERCE' ? '2px solid #0066cc' : '1px solid #dcdfe4',
              background: mode === 'COMMERCE' ? '#edf2ff' : '#fff',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontWeight: '700', fontSize: '16px', color: '#1a1f36', marginBottom: '6px' }}>
              Commerce Mode
            </div>
            <p style={{ fontSize: '13px', color: '#697386', margin: 0 }}>
              Physical & digital product catalogue, cart, checkout, order fulfillment, and delivery tracking.
            </p>
          </div>

          {/* Mode Option: Services */}
          <div
            onClick={() => {
              setMode('SERVICES');
              if (!appointments) setAppointments(true);
              setHomePage('BOOKING');
            }}
            style={{
              padding: '16px',
              borderRadius: '8px',
              border: mode === 'SERVICES' ? '2px solid #0066cc' : '1px solid #dcdfe4',
              background: mode === 'SERVICES' ? '#edf2ff' : '#fff',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontWeight: '700', fontSize: '16px', color: '#1a1f36', marginBottom: '6px' }}>
              Services Mode
            </div>
            <p style={{ fontSize: '13px', color: '#697386', margin: 0 }}>
              Appointments, service booking, staff availability calendar, and deposit collection. Hides product cart.
            </p>
          </div>

          {/* Mode Option: Both */}
          <div
            onClick={() => {
              setMode('BOTH');
              if (!prodCommerce) setProdCommerce(true);
              if (!appointments) setAppointments(true);
            }}
            style={{
              padding: '16px',
              borderRadius: '8px',
              border: mode === 'BOTH' ? '2px solid #0066cc' : '1px solid #dcdfe4',
              background: mode === 'BOTH' ? '#edf2ff' : '#fff',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontWeight: '700', fontSize: '16px', color: '#1a1f36', marginBottom: '6px' }}>
              Both (Hybrid)
            </div>
            <p style={{ fontSize: '13px', color: '#697386', margin: 0 }}>
              Full unified commerce: Products + Appointments side by side with shared customers and reporting.
            </p>
          </div>
        </div>

        {/* Home Page Selector (Mandatory separation per Blueprint) */}
        <div style={{ borderTop: '1px solid #f0f2f5', paddingTop: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1a1f36', marginBottom: '6px' }}>
            Default Home Page Entry Experience
          </label>
          <div style={{ display: 'flex', gap: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="homepage"
                checked={homePage === 'LANDING'}
                onChange={() => setHomePage('LANDING')}
              />
              <span>Store Landing Page (Hero, Collections, Featured Content)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="homepage"
                checked={homePage === 'BOOKING'}
                onChange={() => setHomePage('BOOKING')}
              />
              <span>Direct Booking Funnel (Immediate Service & Calendar Selection)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Backend Capabilities Guard Card */}
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e3e8ee', padding: '24px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#1a1f36' }}>
          Backend Module Entitlements & Capabilities
        </h3>
        <p style={{ color: '#697386', fontSize: '14px', marginBottom: '20px' }}>
          Enforce server-side route guards, API access, and database transactions for each module.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8f9fa', borderRadius: '6px', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: '#1a1f36' }}>Product Commerce Engine</div>
              <div style={{ fontSize: '12px', color: '#697386' }}>SKU management, variant matrix, inventory balances, and order fulfillment.</div>
            </div>
            <input
              type="checkbox"
              checked={prodCommerce}
              onChange={(e) => setProdCommerce(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8f9fa', borderRadius: '6px', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: '#1a1f36' }}>Appointments & Scheduling Engine</div>
              <div style={{ fontSize: '12px', color: '#697386' }}>Staff shifts, resource allocations, booking holds, and calendar views.</div>
            </div>
            <input
              type="checkbox"
              checked={appointments}
              onChange={(e) => setAppointments(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8f9fa', borderRadius: '6px', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: '#1a1f36' }}>Restaurant POS Capability</div>
              <div style={{ fontSize: '12px', color: '#697386' }}>Table management, kitchen order tickets (KOT), and takeaway counter.</div>
            </div>
            <input
              type="checkbox"
              checked={restaurantPos}
              onChange={(e) => setRestaurantPos(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
