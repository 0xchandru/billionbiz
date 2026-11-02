import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Lock, 
  MessageSquare, 
  Mail, 
  PackageCheck 
} from 'lucide-react';
import { api } from '../api/services';

interface ProviderConnection {
  id: string;
  provider_key: string;
  environment: 'TEST' | 'LIVE';
  status: string;
  account_identifier?: string;
  last_verified_at?: string;
  last_error_code?: string;
}

export const ExtensionsPage: React.FC = () => {
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal setup state
  const [activeModal, setActiveModal] = useState<'razorpay' | 'shiprocket' | null>(null);
  const [envMode, setEnvMode] = useState<'TEST' | 'LIVE'>('TEST');
  const [saving, setSaving] = useState(false);

  // Form fields
  const [rzpKeyId, setRzpKeyId] = useState('');
  const [rzpKeySecret, setRzpKeySecret] = useState('');
  const [rzpWebhookSecret, setRzpWebhookSecret] = useState('');

  const [srEmail, setSrEmail] = useState('');
  const [srPassword, setSrPassword] = useState('');

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const res = await api.getIntegrationConnections();
      setConnections(res.connections || []);
    } catch (err: any) {
      console.error('[Extensions] Failed to load connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const getConn = (provider: string, env: 'TEST' | 'LIVE') => {
    return connections.find(c => c.provider_key.toLowerCase() === provider.toLowerCase() && c.environment === env);
  };

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    try {
      setSaving(true);
      setTestResult(null);

      let credentials: any = {};
      if (activeModal === 'razorpay') {
        credentials = {
          keyId: rzpKeyId.trim(),
          keySecret: rzpKeySecret.trim(),
          webhookSecret: rzpWebhookSecret.trim() || undefined
        };
      } else if (activeModal === 'shiprocket') {
        credentials = {
          email: srEmail.trim(),
          password: srPassword.trim()
        };
      }

      await api.saveIntegrationConnection({
        providerKey: activeModal,
        environment: envMode,
        credentials
      });

      setTestResult({
        type: 'success',
        message: `Successfully saved and encrypted ${activeModal.toUpperCase()} credentials in database vault.`
      });

      // Clear modal fields
      setRzpKeyId('');
      setRzpKeySecret('');
      setRzpWebhookSecret('');
      setSrEmail('');
      setSrPassword('');
      setActiveModal(null);

      await loadConnections();
    } catch (err: any) {
      setTestResult({
        type: 'error',
        message: err.message || 'Failed to save encrypted connection.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (provider: string, env: 'TEST' | 'LIVE') => {
    try {
      setTestingProvider(`${provider}-${env}`);
      setTestResult(null);

      const res = await api.testIntegrationConnection(provider, { environment: env });
      setTestResult({
        type: 'success',
        message: `${res.message} (Account: ${res.accountIdentifier || 'Active'})`
      });
      await loadConnections();
    } catch (err: any) {
      setTestResult({
        type: 'error',
        message: err.message || `Failed to verify ${provider} connection.`
      });
    } finally {
      setTestingProvider(null);
    }
  };

  const handleDisconnect = async (provider: string, env: 'TEST' | 'LIVE') => {
    if (!window.confirm(`Are you sure you want to disconnect ${provider.toUpperCase()} (${env})? This will wipe the encrypted credentials from the vault.`)) {
      return;
    }

    try {
      setLoading(true);
      await api.disconnectIntegrationConnection(provider, { environment: env });
      setTestResult({
        type: 'success',
        message: `Successfully disconnected and purged ${provider.toUpperCase()} credentials.`
      });
      await loadConnections();
    } catch (err: any) {
      setTestResult({
        type: 'error',
        message: err.message || 'Failed to disconnect integration.'
      });
    } finally {
      setLoading(false);
    }
  };

  const rzpConn = getConn('razorpay', 'TEST') || getConn('razorpay', 'LIVE');
  const srConn = getConn('shiprocket', 'TEST') || getConn('shiprocket', 'LIVE');

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#064652', margin: 0 }}>Extensions & Provider Vault</h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>
            Connect and manage your own store credentials. Secrets are stored in tenant-scoped encrypted database records with AES-256-GCM.
          </p>
        </div>

        <button 
          onClick={loadConnections}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Alert Banner */}
      {testResult && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          background: testResult.type === 'success' ? '#e6f7ec' : '#fbeae9',
          color: testResult.type === 'success' ? '#0d8a3e' : '#d9381e',
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: `1px solid ${testResult.type === 'success' ? '#b7eb8f' : '#ffa39e'}`
        }}>
          {testResult.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Primary Available Providers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '36px' }}>
        {/* Razorpay Gateway Card */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#064652', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Razorpay Payments</h3>
                <span style={{ fontSize: '12px', color: rzpConn?.status === 'ACTIVE' ? '#0d8a3e' : '#64748b', fontWeight: '600' }}>
                  ● {rzpConn?.status === 'ACTIVE' ? `Connected (${rzpConn.environment})` : 'Not Connected'}
                </span>
              </div>
            </div>
            <span style={{
              padding: '4px 8px',
              borderRadius: '6px',
              background: rzpConn?.status === 'ACTIVE' ? '#e6f7ec' : '#f1f5f9',
              color: rzpConn?.status === 'ACTIVE' ? '#0d8a3e' : '#64748b',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {rzpConn?.status === 'ACTIVE' ? 'Active' : 'Setup Required'}
            </span>
          </div>

          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', marginBottom: '16px' }}>
            Enables UPI, Netbanking, Credit/Debit cards for online store purchases and booking deposits with raw HMAC signature verification.
          </p>

          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#475569', marginBottom: '20px', border: '1px solid #f1f5f9' }}>
            <div style={{ marginBottom: '4px' }}><strong>Environment:</strong> {rzpConn?.environment || 'Test Sandbox'}</div>
            <div style={{ marginBottom: '4px' }}><strong>Key ID:</strong> {rzpConn?.account_identifier || 'None Configured'}</div>
            <div><strong>Encryption:</strong> AES-256-GCM Tenant Vault</div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setActiveModal('razorpay');
                setEnvMode('TEST');
              }}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: '6px',
                background: '#064652',
                color: '#fff',
                border: 'none',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {rzpConn ? 'Reconfigure Credentials' : 'Connect Account'}
            </button>

            {rzpConn?.status === 'ACTIVE' && (
              <>
                <button
                  disabled={testingProvider === `razorpay-${rzpConn.environment}`}
                  onClick={() => handleTestConnection('razorpay', rzpConn.environment)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '6px',
                    background: '#fff',
                    color: '#064652',
                    border: '1px solid #cbd5e1',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {testingProvider === `razorpay-${rzpConn.environment}` ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  onClick={() => handleDisconnect('razorpay', rzpConn.environment)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '6px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>

        {/* Shiprocket Logistics Card */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#5A9A20', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Shiprocket Logistics</h3>
                <span style={{ fontSize: '12px', color: srConn?.status === 'ACTIVE' ? '#0d8a3e' : '#64748b', fontWeight: '600' }}>
                  ● {srConn?.status === 'ACTIVE' ? `Connected (${srConn.environment})` : 'Not Connected'}
                </span>
              </div>
            </div>
            <span style={{
              padding: '4px 8px',
              borderRadius: '6px',
              background: srConn?.status === 'ACTIVE' ? '#e6f7ec' : '#f1f5f9',
              color: srConn?.status === 'ACTIVE' ? '#0d8a3e' : '#64748b',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {srConn?.status === 'ACTIVE' ? 'Active' : 'Setup Required'}
            </span>
          </div>

          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', marginBottom: '16px' }}>
            Automate order parcel packaging, generate shipping labels, assign AWB numbers, and provide live customer tracking.
          </p>

          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#475569', marginBottom: '20px', border: '1px solid #f1f5f9' }}>
            <div style={{ marginBottom: '4px' }}><strong>Environment:</strong> {srConn?.environment || 'Test Sandbox'}</div>
            <div style={{ marginBottom: '4px' }}><strong>Account:</strong> {srConn?.account_identifier || 'None Configured'}</div>
            <div><strong>Encryption:</strong> AES-256-GCM Tenant Vault</div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setActiveModal('shiprocket');
                setEnvMode('TEST');
              }}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: '6px',
                background: '#5A9A20',
                color: '#fff',
                border: 'none',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {srConn ? 'Reconfigure Credentials' : 'Connect Account'}
            </button>

            {srConn?.status === 'ACTIVE' && (
              <>
                <button
                  disabled={testingProvider === `shiprocket-${srConn.environment}`}
                  onClick={() => handleTestConnection('shiprocket', srConn.environment)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '6px',
                    background: '#fff',
                    color: '#064652',
                    border: '1px solid #cbd5e1',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {testingProvider === `shiprocket-${srConn.environment}` ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  onClick={() => handleDisconnect('shiprocket', srConn.environment)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '6px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Coming Soon Integrations Marketplace */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#064652', marginBottom: '16px' }}>Upcoming Provider Connectors</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '18px', opacity: 0.85 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#25D366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={20} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>
                Coming Soon
              </span>
            </div>
            <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700' }}>WhatsApp Business</h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Automated order status alerts, booking reminders, and customer support.</p>
          </div>

          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '18px', opacity: 0.85 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ea580c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PackageCheck size={20} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>
                Coming Soon
              </span>
            </div>
            <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700' }}>Delhivery Logistics</h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>B2C and B2B domestic freight with reverse pickup logistics.</p>
          </div>

          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '18px', opacity: 0.85 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={20} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>
                Coming Soon
              </span>
            </div>
            <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700' }}>Email Marketing</h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Promotional newsletters and broadcast campaigns (transactional email is built-in).</p>
          </div>
        </div>
      </div>

      {/* Credential Setup Modal */}
      {activeModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', maxWidth: '500px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} color="#064652" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#064652' }}>
                  Connect {activeModal === 'razorpay' ? 'Razorpay Payments' : 'Shiprocket Logistics'}
                </h3>
              </div>
              <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveConnection}>
              {/* Environment Selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Environment</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setEnvMode('TEST')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: envMode === 'TEST' ? '#064652' : '#cbd5e1',
                      backgroundColor: envMode === 'TEST' ? '#e6fffa' : '#fff',
                      color: envMode === 'TEST' ? '#064652' : '#64748b',
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Test Sandbox
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnvMode('LIVE')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: envMode === 'LIVE' ? '#064652' : '#cbd5e1',
                      backgroundColor: envMode === 'LIVE' ? '#e6fffa' : '#fff',
                      color: envMode === 'LIVE' ? '#064652' : '#64748b',
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Live Production
                  </button>
                </div>
              </div>

              {activeModal === 'razorpay' ? (
                <>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Key ID</label>
                    <input
                      type="text"
                      required
                      placeholder="rzp_test_..."
                      value={rzpKeyId}
                      onChange={(e) => setRzpKeyId(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Key Secret (Write-Only)</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter Razorpay Secret Key"
                      value={rzpKeySecret}
                      onChange={(e) => setRzpKeySecret(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Webhook Secret (Optional)</label>
                    <input
                      type="password"
                      placeholder="Enter Webhook Signing Secret"
                      value={rzpWebhookSecret}
                      onChange={(e) => setRzpWebhookSecret(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Shiprocket Email</label>
                    <input
                      type="email"
                      required
                      placeholder="name@business.com"
                      value={srEmail}
                      onChange={(e) => setSrEmail(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Password or API Token (Write-Only)</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter account password or auth token"
                      value={srPassword}
                      onChange={(e) => setSrPassword(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#064652', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {saving ? 'Encrypting & Saving...' : 'Save Encrypted Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtensionsPage;
