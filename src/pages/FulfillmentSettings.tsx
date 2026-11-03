import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { 
  Truck, 
  Package, 
  CheckCircle2, 
  Save, 
  Building2
} from 'lucide-react';

export const FulfillmentSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'shipping' | 'dispatch' | 'carriers'>('shipping');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Shipping Rates States
  const [standardRate, setStandardRate] = useState('50');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('999');
  const [expressRate, setExpressRate] = useState('150');
  const [enableLocalPickup, setEnableLocalPickup] = useState(true);

  // Dispatch States
  const [primaryWarehouse, setPrimaryWarehouse] = useState('wh-main');
  const [allowBackorder, setAllowBackorder] = useState(false);
  const [autoDeductStock, setAutoDeductStock] = useState(true);

  // Carrier Integration
  const [labelFormat, setLabelFormat] = useState('4x6');
  const [autoGenerateAWB, setAutoGenerateAWB] = useState(true);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Breadcrumb & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
            <span>Settings</span>
            <span>/</span>
            <span style={{ color: '#083e47', fontWeight: 600 }}>Fulfillment</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Fulfillment & Shipping Settings
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>
            Configure delivery fee tiers, free shipping thresholds, dispatch warehouses, and logistics carrier APIs.
          </p>
        </div>

        <button
          onClick={handleSave}
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
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <Save size={16} />
          <span>Save Fulfillment Settings</span>
        </button>
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
          border: '1px solid #bbf7d0',
          marginBottom: '20px'
        }}>
          <CheckCircle2 size={18} />
          <span>Fulfillment settings updated successfully!</span>
        </div>
      )}

      {/* Local Page Sub-tabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '24px'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('shipping')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: activeTab === 'shipping' ? 700 : 500,
            color: activeTab === 'shipping' ? '#083e47' : '#64748b',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'shipping' ? '2.5px solid #083e47' : '2.5px solid transparent',
            cursor: 'pointer'
          }}
        >
          <Truck size={15} />
          <span>Shipping Zones & Rates</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dispatch')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: activeTab === 'dispatch' ? 700 : 500,
            color: activeTab === 'dispatch' ? '#083e47' : '#64748b',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'dispatch' ? '2.5px solid #083e47' : '2.5px solid transparent',
            cursor: 'pointer'
          }}
        >
          <Building2 size={15} />
          <span>Warehouses & Stock Deduction</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('carriers')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: activeTab === 'carriers' ? 700 : 500,
            color: activeTab === 'carriers' ? '#083e47' : '#64748b',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'carriers' ? '2.5px solid #083e47' : '2.5px solid transparent',
            cursor: 'pointer'
          }}
        >
          <Package size={15} />
          <span>Logistics Carrier Integration</span>
        </button>
      </div>

      {/* TAB 1: SHIPPING RATES */}
      {activeTab === 'shipping' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
              Standard Delivery Rates (Pan-India)
            </h3>
            <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '20px' }}>
              Shipping calculation rules applied to customer cart totals at storefront checkout.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Standard Delivery Fee (₹)
                </label>
                <input
                  type="number"
                  value={standardRate}
                  onChange={(e) => setStandardRate(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Free Shipping Minimum Cart Value (₹)
                </label>
                <input
                  type="number"
                  value={freeShippingThreshold}
                  onChange={(e) => setFreeShippingThreshold(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                />
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                  Orders equal or above this threshold receive complimentary free delivery.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Express Next-Day Shipping Fee (₹)
                </label>
                <input
                  type="number"
                  value={expressRate}
                  onChange={(e) => setExpressRate(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', backgroundColor: '#f8fafc', borderRadius: '8px', cursor: 'pointer', border: '1px solid #e2e8f0' }}>
              <input
                type="checkbox"
                checked={enableLocalPickup}
                onChange={(e) => setEnableLocalPickup(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <div style={{ fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Allow In-Store Customer Pickup (Click & Collect)</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Customers can choose to pick up orders directly from registered physical locations without shipping charges.</div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* TAB 2: WAREHOUSES & DISPATCH */}
      {activeTab === 'dispatch' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            Warehouse Allocation & Stock Deduction
          </h3>
          <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '20px' }}>
            Define which physical location stocks are automatically decremented when online orders are confirmed.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Primary Dispatch Facility
              </label>
              <select
                value={primaryWarehouse}
                onChange={(e) => setPrimaryWarehouse(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
              >
                <option value="wh-main">Main Fulfillment Hub (Bengaluru)</option>
                <option value="wh-north">North Hub (Delhi NCR)</option>
                <option value="wh-west">West Hub (Mumbai)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', backgroundColor: '#f8fafc', borderRadius: '8px', cursor: 'pointer', border: '1px solid #e2e8f0' }}>
              <input
                type="checkbox"
                checked={autoDeductStock}
                onChange={(e) => setAutoDeductStock(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <div style={{ fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Real-time stock deduction upon order payment</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Immediately decrement available variant count to prevent overselling.</div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', backgroundColor: '#f8fafc', borderRadius: '8px', cursor: 'pointer', border: '1px solid #e2e8f0' }}>
              <input
                type="checkbox"
                checked={allowBackorder}
                onChange={(e) => setAllowBackorder(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <div style={{ fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Allow backorders when item is out of stock</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Continue accepting orders with explicit pre-order estimated delivery notice.</div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* TAB 3: CARRIERS */}
      {activeTab === 'carriers' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                Shiprocket & Courier Logistics Integration
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '13.5px' }}>
                Automate courier booking, AWB tracking generation, and thermal shipping labels.
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
              <span>Configure Shiprocket Keys</span>
            </a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Shipping Label Print Format
              </label>
              <select
                value={labelFormat}
                onChange={(e) => setLabelFormat(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
              >
                <option value="4x6">Thermal Label (4 x 6 inches) - Standard</option>
                <option value="A4">A4 Sheet (4 labels per page)</option>
              </select>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', backgroundColor: '#f8fafc', borderRadius: '8px', cursor: 'pointer', border: '1px solid #e2e8f0' }}>
            <input
              type="checkbox"
              checked={autoGenerateAWB}
              onChange={(e) => setAutoGenerateAWB(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <div>
              <div style={{ fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Auto-request AWB tracking on order fulfillment approval</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Automatically connects to carrier API to generate tracking code and manifest upon dispatch.</div>
            </div>
          </label>
        </div>
      )}
    </div>
  );
};

export default FulfillmentSettingsPage;
