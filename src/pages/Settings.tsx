import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Save, 
  Settings as SettingsIcon, 
  MapPin, 
  CreditCard, 
  Truck, 
  Percent, 
  Globe, 
  Bell, 
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { api } from '../api/services';

type TabKey = 'general' | 'locations' | 'payments' | 'shipping' | 'taxes' | 'domains' | 'notifications' | 'security';

interface TabDefinition {
  id: TabKey;
  label: string;
  icon: any;
  description: string;
}

const SETTINGS_TABS: TabDefinition[] = [
  { id: 'general', label: 'General & Mode', icon: SettingsIcon, description: 'Storefront mode, capabilities, and primary operating profile.' },
  { id: 'locations', label: 'Locations & Warehouses', icon: MapPin, description: 'Physical store locations and fulfillment dispatch points.' },
  { id: 'payments', label: 'Payments & Razorpay', icon: CreditCard, description: 'Currencies, online gateway integrations, and payment tenders.' },
  { id: 'shipping', label: 'Shipping & Delivery', icon: Truck, description: 'Shipping rates, delivery rules, and logistics carrier options.' },
  { id: 'taxes', label: 'Taxes & GSTIN', icon: Percent, description: 'GST slabs, invoice tax calculation, and tax registration rules.' },
  { id: 'domains', label: 'Custom Domains', icon: Globe, description: 'Store subdomains, DNS CNAME verification, and SSL certificates.' },
  { id: 'notifications', label: 'Notifications & Emails', icon: Bell, description: 'Customer transaction emails, Resend OTP, and order updates.' },
  { id: 'security', label: 'Security & Staff Access', icon: ShieldCheck, description: 'Two-factor auth (MFA), staff PINs, and cashier controls.' },
];

const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTabParam = (searchParams.get('tab') || 'general') as TabKey;
  
  const [activeTab, setActiveTab] = useState<TabKey>(
    SETTINGS_TABS.some(t => t.id === currentTabParam) ? currentTabParam : 'general'
  );

  const [store, setStore] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // General Form States
  const [mode, setMode] = useState<'COMMERCE' | 'SERVICES' | 'BOTH'>('BOTH');
  const [homePage, setHomePage] = useState<'LANDING' | 'BOOKING'>('LANDING');
  const [prodCommerce, setProdCommerce] = useState(true);
  const [appointments, setAppointments] = useState(true);
  const [restaurantPos, setRestaurantPos] = useState(true);

  // Sync state with URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab') as TabKey;
    if (tab && SETTINGS_TABS.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const switchTab = (tabId: TabKey) => {
    setActiveTab(tabId);
    setSearchParams(tabId === 'general' ? {} : { tab: tabId });
  };

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

  const handleSaveGeneral = async () => {
    if (!store) return;
    try {
      setSaving(true);
      setSavedSuccess(false);

      await api.updateCapabilities(store.id, {
        productCommerceEnabled: prodCommerce,
        appointmentsEnabled: appointments,
        restaurantPosEnabled: restaurantPos
      });

      await api.updateStorefrontMode(store.id, {
        mode,
        homePage
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
      await loadSettings();
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !store) {
    return (
      <div style={{ padding: '64px', textAlign: 'center', color: '#64748b' }}>
        Loading store configuration...
      </div>
    );
  }

  const storeSlug = store?.slug || 'chandru-store';
  const liveStoreUrl = `https://${storeSlug}.stores.chandraprakash.codes`;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Store Configuration & Settings
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>
            Manage operating mode, fulfillment warehouses, payment providers, custom domains, and staff permissions.
          </p>
        </div>

        {activeTab === 'general' && (
          <button
            disabled={saving}
            onClick={handleSaveGeneral}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              background: '#083e47',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        )}
      </div>

      {savedSuccess && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          background: '#f0fdf4',
          color: '#15803d',
          fontSize: '13.5px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid #bbf7d0'
        }}>
          <CheckCircle2 size={18} />
          <span>Configuration saved successfully! Changes are applied across your storefront and administrative dashboard.</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        borderBottom: '1px solid #e2e8f0',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px 8px 0 0',
                fontSize: '13.5px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#083e47' : '#64748b',
                backgroundColor: isActive ? '#ffffff' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2.5px solid #083e47' : '2.5px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} color={isActive ? '#083e47' : '#94a3b8'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREAS */}

      {/* 1. GENERAL TAB */}
      {activeTab === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Operating Mode Selector */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
              Customer Storefront Mode
            </h3>
            <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '20px' }}>
              Select the primary operating model. BillionBiz dynamically adapts customer navigation, cart, checkout, and inventory workflows.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div
                onClick={() => {
                  setMode('COMMERCE');
                  if (!prodCommerce) setProdCommerce(true);
                }}
                style={{
                  padding: '18px',
                  borderRadius: '10px',
                  border: mode === 'COMMERCE' ? '2px solid #083e47' : '1px solid #cbd5e1',
                  background: mode === 'COMMERCE' ? '#f0fdfa' : '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a', marginBottom: '6px' }}>
                  Commerce Store
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                  Physical & digital product catalogue, shopping cart, checkout, delivery dispatch, and order fulfillment.
                </p>
              </div>

              <div
                onClick={() => {
                  setMode('SERVICES');
                  if (!appointments) setAppointments(true);
                  setHomePage('BOOKING');
                }}
                style={{
                  padding: '18px',
                  borderRadius: '10px',
                  border: mode === 'SERVICES' ? '2px solid #083e47' : '1px solid #cbd5e1',
                  background: mode === 'SERVICES' ? '#f0fdfa' : '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a', marginBottom: '6px' }}>
                  Services & Appointments
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                  Appointment scheduling, calendar booking, staff availability, and reservation deposits. Hides product cart.
                </p>
              </div>

              <div
                onClick={() => {
                  setMode('BOTH');
                  if (!prodCommerce) setProdCommerce(true);
                  if (!appointments) setAppointments(true);
                }}
                style={{
                  padding: '18px',
                  borderRadius: '10px',
                  border: mode === 'BOTH' ? '2px solid #083e47' : '1px solid #cbd5e1',
                  background: mode === 'BOTH' ? '#f0fdfa' : '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a', marginBottom: '6px' }}>
                  Unified Hybrid (Both)
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                  Full unified commerce: sell products and book services side by side with shared customers and reporting.
                </p>
              </div>
            </div>

            {/* Default Landing Experience */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
                Default Homepage Entry Experience
              </label>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="homepage"
                    checked={homePage === 'LANDING'}
                    onChange={() => setHomePage('LANDING')}
                  />
                  <span>Store Landing Page (Hero banner, Collections, Featured Products)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="homepage"
                    checked={homePage === 'BOOKING'}
                    onChange={() => setHomePage('BOOKING')}
                  />
                  <span>Direct Booking Funnel (Instant calendar and service selection)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Module Capabilities Guard */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
              Active Module Entitlements
            </h3>
            <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '16px' }}>
              Control server-side permissions and dashboard access for individual business engines.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>Product Commerce Engine</div>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>Inventory variants, automated stock tracking, and orders.</div>
                </div>
                <input
                  type="checkbox"
                  checked={prodCommerce}
                  onChange={(e) => setProdCommerce(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>Appointments & Booking Engine</div>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>Staff scheduling, customer booking calendar, and service slots.</div>
                </div>
                <input
                  type="checkbox"
                  checked={appointments}
                  onChange={(e) => setAppointments(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>Cashier POS & Counters</div>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>Physical retail checkout terminal, cash drawers, and barcode scanner.</div>
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
      )}

      {/* 2. LOCATIONS TAB */}
      {activeTab === 'locations' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            Store Locations & Fulfillment Warehouses
          </h3>
          <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '20px' }}>
            Configure retail outlet addresses and stock deduction warehouses for automated shipping.
          </p>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '16px', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '14.5px' }}>Primary Store Location</span>
              <span style={{ fontSize: '11.5px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: '700' }}>Active Primary</span>
            </div>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#475569' }}>Registered Business Address • India</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Warehouse: Main Warehouse (DEF-WH) • Default Stock Sync</p>
          </div>
        </div>
      )}

      {/* 3. PAYMENTS TAB */}
      {activeTab === 'payments' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                Payment Gateways & Tenders
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '13.5px' }}>
                All store transactions and pricing are processed in <strong>Indian Rupee (INR ₹)</strong>.
              </p>
            </div>
            <a
              href="/extensions"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: '#083e47',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              <CreditCard size={14} />
              <span>Configure Gateways</span>
            </a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>Razorpay Payment Gateway</span>
                <div style={{ fontSize: '12.5px', color: '#64748b' }}>Instant UPI, Credit/Debit cards, Netbanking, and PayLater.</div>
              </div>
              <a href="/extensions" style={{ color: '#083e47', fontWeight: '600', fontSize: '13px', textDecoration: 'none' }}>
                Manage in Extensions →
              </a>
            </div>

            <div style={{ padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>Cash on Delivery (COD)</span>
                <div style={{ fontSize: '12.5px', color: '#64748b' }}>Accept cash upon parcel delivery at customer doorstep.</div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#15803d', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>Enabled</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. SHIPPING TAB */}
      {activeTab === 'shipping' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                Shipping Zones & Logistics
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '13.5px' }}>
                Automate courier dispatch, generate AWB numbers, and calculate delivery fees.
              </p>
            </div>
            <a
              href="/extensions"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: '#5a9a20',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              <Truck size={14} />
              <span>Configure Shiprocket</span>
            </a>
          </div>

          <div style={{ padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
            <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>Standard Pan-India Shipping</span>
            <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>Free delivery on orders above ₹999. Flat ₹50 shipping on small orders.</div>
          </div>
        </div>
      )}

      {/* 5. TAXES TAB */}
      {activeTab === 'taxes' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            Taxes & Goods and Services Tax (GST)
          </h3>
          <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '20px' }}>
            Configure GSTIN registration and tax inclusive/exclusive price calculation on checkout invoices.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>
                Merchant GSTIN (Optional)
              </label>
              <input
                type="text"
                placeholder="22AAAAA0000A1Z5"
                defaultValue={store?.gstin || ''}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>
                Default Tax Rate (%)
              </label>
              <select style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}>
                <option value="18">Standard GST (18%)</option>
                <option value="12">Essential Goods (12%)</option>
                <option value="5">Concessional Goods (5%)</option>
                <option value="0">Zero-rated / Exempt (0%)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 6. DOMAINS TAB */}
      {activeTab === 'domains' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            Storefront Domains & Web Address
          </h3>
          <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '20px' }}>
            Your customer storefront is automatically provisioned and secured with free SSL certificates.
          </p>

          {/* Primary Auto Subdomain Card */}
          <div style={{ padding: '16px', border: '1px solid #bbf7d0', borderRadius: '10px', backgroundColor: '#f0fdf4', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontWeight: '700', color: '#15803d', fontSize: '14.5px' }}>Primary Live Subdomain</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#15803d', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>Active & Live</span>
            </div>
            <a
              href={liveStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '15px', fontWeight: '600', color: '#083e47', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>{liveStoreUrl}</span>
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Connect Custom Domain Guide */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14.5px', fontWeight: '700', color: '#0f172a' }}>Connect Custom Domain (e.g. yourbrand.com)</h4>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px 0' }}>
              Add a CNAME record in your DNS provider (Cloudflare, GoDaddy, Namecheap) pointing to <code>stores.chandraprakash.codes</code>.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="store.yourdomain.com"
                style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
              />
              <button
                type="button"
                style={{ padding: '9px 16px', borderRadius: '8px', backgroundColor: '#083e47', color: '#ffffff', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
              >
                Connect Domain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            Notifications & Transactional Email
          </h3>
          <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '20px' }}>
            Production email delivery is powered live via <strong>Resend</strong> from <code>noreply@chandraprakash.codes</code>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '14px', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>Customer Order Receipts & Tracking</span>
                <div style={{ fontSize: '12.5px', color: '#64748b' }}>Dispatched automatically whenever a customer places an order.</div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#15803d', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>Active</span>
            </div>

            <div style={{ padding: '14px', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>Merchant Daily Summary</span>
                <div style={{ fontSize: '12.5px', color: '#64748b' }}>Daily overview of sales volume, pending fulfillments, and revenue.</div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#15803d', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>Active</span>
            </div>
          </div>
        </div>
      )}

      {/* 8. SECURITY TAB */}
      {activeTab === 'security' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            Security, MFA & Cashier Access
          </h3>
          <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '20px' }}>
            Protect your workspace with two-factor authentication, staff role isolation, and PIN codes.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>Cashier Terminal Quick PIN</span>
                <div style={{ fontSize: '12.5px', color: '#64748b' }}>Fast 4-digit PIN access for counter staff on POS terminals.</div>
              </div>
              <button
                type="button"
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}
              >
                Change PIN
              </button>
            </div>

            <div style={{ padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>Two-Factor Authentication (TOTP)</span>
                <div style={{ fontSize: '12.5px', color: '#64748b' }}>Require Google Authenticator code on merchant login.</div>
              </div>
              <button
                type="button"
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #083e47', backgroundColor: '#083e47', color: '#ffffff', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}
              >
                Enable 2FA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
