import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { 
  Globe, 
  Scale, 
  SlidersHorizontal, 
  CheckCircle2, 
  Save
} from 'lucide-react';

export const PreferencesSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'localization' | 'standards' | 'admin'>('localization');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Localization States
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [timeFormat, setTimeFormat] = useState('12h');
  const [currencySymbol, setCurrencySymbol] = useState('INR');

  // Standards States
  const [weightUnit, setWeightUnit] = useState('kg');
  const [dimensionUnit, setDimensionUnit] = useState('cm');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');

  // Admin Experience
  const [defaultPageSize, setDefaultPageSize] = useState('10');
  const [posBeepSound, setPosBeepSound] = useState(true);

  const handleSavePreferences = (e: FormEvent) => {
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
            <span style={{ color: '#083e47', fontWeight: 600 }}>Preferences</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Platform Preferences
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>
            Configure localization defaults, units of measurement, inventory alert thresholds, and dashboard experience.
          </p>
        </div>

        <button
          onClick={handleSavePreferences}
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
          <span>Save Preferences</span>
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
          <span>Preferences updated successfully!</span>
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
          onClick={() => setActiveTab('localization')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: activeTab === 'localization' ? 700 : 500,
            color: activeTab === 'localization' ? '#083e47' : '#64748b',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'localization' ? '2.5px solid #083e47' : '2.5px solid transparent',
            cursor: 'pointer'
          }}
        >
          <Globe size={15} />
          <span>Regional & Localization</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('standards')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: activeTab === 'standards' ? 700 : 500,
            color: activeTab === 'standards' ? '#083e47' : '#64748b',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'standards' ? '2.5px solid #083e47' : '2.5px solid transparent',
            cursor: 'pointer'
          }}
        >
          <Scale size={15} />
          <span>Measurement Standards</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: activeTab === 'admin' ? 700 : 500,
            color: activeTab === 'admin' ? '#083e47' : '#64748b',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'admin' ? '2.5px solid #083e47' : '2.5px solid transparent',
            cursor: 'pointer'
          }}
        >
          <SlidersHorizontal size={15} />
          <span>Admin Experience</span>
        </button>
      </div>

      {/* TAB 1: LOCALIZATION */}
      {activeTab === 'localization' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            Regional Standards & Formatting
          </h3>
          <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '20px' }}>
            Control how dates, currencies, and timestamps appear across all merchant portals and generated reports.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Primary Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
              >
                <option value="Asia/Kolkata">India Standard Time (IST) - GMT+05:30</option>
                <option value="UTC">Coordinated Universal Time (UTC)</option>
                <option value="America/New_York">Eastern Time (ET) - GMT-05:00</option>
                <option value="Europe/London">Greenwich Mean Time (GMT) - GMT+00:00</option>
                <option value="Asia/Dubai">Gulf Standard Time (GST) - GMT+04:00</option>
                <option value="Asia/Singapore">Singapore Standard Time (SGT) - GMT+08:00</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Primary Currency Display
              </label>
              <select
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
              >
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Date Format
              </label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 03/11/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 11/03/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Time Display Format
              </label>
              <select
                value={timeFormat}
                onChange={(e) => setTimeFormat(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
              >
                <option value="12h">12-Hour format (e.g. 02:30 PM)</option>
                <option value="24h">24-Hour format (e.g. 14:30)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STANDARDS */}
      {activeTab === 'standards' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            Catalogue & Inventory Standards
          </h3>
          <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '20px' }}>
            Define physical unit metrics used by shipping calculations, parcel packaging, and low-stock alerts.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Default Weight Unit
              </label>
              <select
                value={weightUnit}
                onChange={(e) => setWeightUnit(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="lb">Pound (lb)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Default Dimension Unit
              </label>
              <select
                value={dimensionUnit}
                onChange={(e) => setDimensionUnit(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
              >
                <option value="cm">Centimeter (cm)</option>
                <option value="in">Inch (in)</option>
                <option value="m">Meter (m)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Global Low Stock Threshold (units)
              </label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                placeholder="5"
              />
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                Alert triggered when inventory drops below this quantity.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ADMIN EXPERIENCE */}
      {activeTab === 'admin' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            Merchant Administration Experience
          </h3>
          <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '20px' }}>
            Customize dashboard layout density, table pagination sizes, and audio feedback.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14.5px', color: '#0f172a' }}>Default Table Page Size</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Number of records shown per page across orders, products, and customers.</div>
              </div>
              <select
                value={defaultPageSize}
                onChange={(e) => setDefaultPageSize(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
              >
                <option value="10">10 records per page</option>
                <option value="25">25 records per page</option>
                <option value="50">50 records per page</option>
                <option value="100">100 records per page</option>
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14.5px', color: '#0f172a' }}>POS Barcode Scanner Audio Beep</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Play an audible confirmation beep when an item is scanned into the POS cart.</div>
              </div>
              <input
                type="checkbox"
                checked={posBeepSound}
                onChange={(e) => setPosBeepSound(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreferencesSettingsPage;
