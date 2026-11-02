import React, { useState } from 'react';
import { CreditCard, Truck, CheckCircle } from 'lucide-react';
import { api } from '../api/services';

const ExtensionsPage: React.FC = () => {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const testRazorpayConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await api.createRazorpayOrder({
        amountMinor: 10000,
        currency: 'INR',
        purpose: 'SANDBOX_VERIFICATION'
      });
      setTestResult(`Success: Generated Sandbox Order ${res.razorpayOrderId} with Key ${res.keyId}`);
    } catch (err: any) {
      setTestResult(`Error: ${err.message || 'Verification failed'}`);
    } finally {
      setTesting(false);
    }
  };

  const testShiprocketConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await api.createShiprocketShipment({
        orderId: 'ord-bbz-1001',
        weightGrams: 750
      });
      setTestResult(`Success: Generated Shiprocket AWB ${res.awbNumber} with tracking URL: ${res.trackingUrl}`);
    } catch (err: any) {
      setTestResult(`Error: ${err.message || 'Shiprocket test failed'}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1f36', margin: 0 }}>Extensions & Provider Integrations</h1>
        <p style={{ color: '#697386', marginTop: '4px', fontSize: '14px' }}>
          Production gateway adapters with HMAC signature verification, webhook deduplication, and sandbox testing.
        </p>
      </div>

      {testResult && (
        <div style={{
          padding: '14px 16px',
          borderRadius: '6px',
          background: testResult.startsWith('Success') ? '#e6f7ec' : '#fbeae9',
          color: testResult.startsWith('Success') ? '#0d8a3e' : '#d9381e',
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={18} />
          <span>{testResult}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Razorpay Gateway Card */}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e3e8ee', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#0c2340', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Razorpay Payments</h3>
                <span style={{ fontSize: '12px', color: '#0d8a3e', fontWeight: '600' }}>● Sandbox Active</span>
              </div>
            </div>
            <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#e6f7ec', color: '#0d8a3e', fontSize: '12px', fontWeight: '600' }}>
              Connected
            </span>
          </div>

          <p style={{ fontSize: '13px', color: '#697386', lineHeight: '1.5', marginBottom: '16px' }}>
            Enables UPI, Netbanking, Debit/Credit cards for online store purchases and appointment deposits with raw HMAC signature verification.
          </p>

          <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#4f566b', marginBottom: '20px' }}>
            <div style={{ marginBottom: '4px' }}><strong>Environment:</strong> Test Sandbox</div>
            <div style={{ marginBottom: '4px' }}><strong>Key ID:</strong> rzp_test_billionbiz_sandbox</div>
            <div><strong>Webhook Status:</strong> Inbox Deduplication Active</div>
          </div>

          <button
            disabled={testing}
            onClick={testRazorpayConnection}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #0066cc',
              background: '#fff',
              color: '#0066cc',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {testing ? 'Testing...' : 'Test Razorpay Order'}
          </button>
        </div>

        {/* Shiprocket Gateway Card */}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e3e8ee', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#733dd9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Shiprocket Logistics</h3>
                <span style={{ fontSize: '12px', color: '#0d8a3e', fontWeight: '600' }}>● Adapter Active</span>
              </div>
            </div>
            <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#e6f7ec', color: '#0d8a3e', fontSize: '12px', fontWeight: '600' }}>
              Connected
            </span>
          </div>

          <p style={{ fontSize: '13px', color: '#697386', lineHeight: '1.5', marginBottom: '16px' }}>
            Automated courier serviceability, automated AWB generation, parcel dimensions calculation, pickup scheduling, and live tracking.
          </p>

          <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#4f566b', marginBottom: '20px' }}>
            <div style={{ marginBottom: '4px' }}><strong>Carrier Network:</strong> Bluedart, Delhivery, DTDC, Ekart</div>
            <div style={{ marginBottom: '4px' }}><strong>Warehouse Code:</strong> BLR-WH-01 (Bengaluru)</div>
            <div><strong>Label Printing:</strong> PDF Manifest Enabled</div>
          </div>

          <button
            disabled={testing}
            onClick={testShiprocketConnection}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #733dd9',
              background: '#fff',
              color: '#733dd9',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {testing ? 'Testing...' : 'Test Shipment & AWB Generation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtensionsPage;
