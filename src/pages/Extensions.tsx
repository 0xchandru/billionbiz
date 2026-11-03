import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Lock, 
  MessageSquare, 
  Mail, 
  PackageCheck,
  Search,
  Download,
  Settings,
  Trash2,
  Share2,
  ShieldCheck,
  Smartphone
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

interface ExtensionDefinition {
  id: string;
  name: string;
  category: 'payments' | 'shipping' | 'messaging' | 'marketing' | 'channels';
  categoryLabel: string;
  description: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  isInstallable: boolean;
}

const EXTENSIONS_CATALOG: ExtensionDefinition[] = [
  {
    id: 'razorpay',
    name: 'Razorpay Payments',
    category: 'payments',
    categoryLabel: 'Payments',
    description: 'Accept UPI, Cards, Netbanking, and Wallets with automated instant reconciliation.',
    icon: CreditCard,
    iconBg: '#083e47',
    iconColor: '#ffffff',
    isInstallable: true
  },
  {
    id: 'shiprocket',
    name: 'Shiprocket Logistics',
    category: 'shipping',
    categoryLabel: 'Shipping',
    description: 'Automate order courier dispatch, print shipping labels, and track deliveries across India.',
    icon: Truck,
    iconBg: '#5a9a20',
    iconColor: '#ffffff',
    isInstallable: true
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    category: 'messaging',
    categoryLabel: 'Messaging',
    description: 'Automated order status alerts, booking reminders, and customer support via official WhatsApp API.',
    icon: MessageSquare,
    iconBg: '#25D366',
    iconColor: '#ffffff',
    isInstallable: false
  },
  {
    id: 'delhivery',
    name: 'Delhivery Freight',
    category: 'shipping',
    categoryLabel: 'Shipping',
    description: 'Direct door-to-door courier logistics with express surface shipping and cash-on-delivery remittance.',
    icon: PackageCheck,
    iconBg: '#ea580c',
    iconColor: '#ffffff',
    isInstallable: false
  },
  {
    id: 'email-marketing',
    name: 'Email Campaigns',
    category: 'marketing',
    categoryLabel: 'Marketing',
    description: 'Automated abandoned checkout recoveries, newsletters, and promotional blast broadcasts.',
    icon: Mail,
    iconBg: '#0284c7',
    iconColor: '#ffffff',
    isInstallable: false
  },
  {
    id: 'instagram-shop',
    name: 'Instagram & Meta Shop',
    category: 'channels',
    categoryLabel: 'Channels',
    description: 'Sync your products seamlessly with Instagram Shop and Facebook product catalogue feeds.',
    icon: Share2,
    iconBg: '#e1306c',
    iconColor: '#ffffff',
    isInstallable: false
  },
  {
    id: 'cod-shield',
    name: 'COD Fraud Shield',
    category: 'payments',
    categoryLabel: 'Risk Protection',
    description: 'AI-based fake order detection with automated customer OTP confirmations before dispatch.',
    icon: ShieldCheck,
    iconBg: '#4f46e5',
    iconColor: '#ffffff',
    isInstallable: false
  },
  {
    id: 'sms-gateway',
    name: 'Twilio SMS Gateway',
    category: 'messaging',
    categoryLabel: 'Communications',
    description: 'Transactional SMS notifications, delivery updates, and OTP dispatch for customers.',
    icon: Smartphone,
    iconBg: '#f43f5e',
    iconColor: '#ffffff',
    isInstallable: false
  }
];

interface ExtensionsPageProps {
  defaultTab?: 'all' | 'installed' | 'marketplace';
}

export const ExtensionsPage: React.FC<ExtensionsPageProps> = ({ defaultTab = 'all' }) => {
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'installed' | 'marketplace'>(defaultTab);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Credential configuration modal
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

  const getConn = (provider: string) => {
    return connections.find(c => c.provider_key.toLowerCase() === provider.toLowerCase());
  };

  const handleInstall = async (providerKey: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [providerKey]: true }));
      setTestResult(null);
      await api.installExtension(providerKey);
      setTestResult({
        type: 'success',
        message: `${providerKey.toUpperCase()} installed successfully! Please click "Configure" to enter your credentials.`
      });
      await loadConnections();
      // Automatically prompt configure modal
      if (providerKey === 'razorpay' || providerKey === 'shiprocket') {
        setActiveModal(providerKey);
        setEnvMode('TEST');
      }
    } catch (err: any) {
      setTestResult({
        type: 'error',
        message: err.message || `Failed to install ${providerKey}.`
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [providerKey]: false }));
    }
  };

  const handleToggle = async (providerKey: string, currentStatus: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [providerKey]: true }));
      setTestResult(null);
      const willEnable = currentStatus !== 'ACTIVE';
      await api.toggleIntegrationConnection(providerKey, willEnable);
      setTestResult({
        type: 'success',
        message: `${providerKey.toUpperCase()} is now ${willEnable ? 'Enabled' : 'Disabled'}.`
      });
      await loadConnections();
    } catch (err: any) {
      setTestResult({
        type: 'error',
        message: err.message || `Failed to update ${providerKey} status.`
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [providerKey]: false }));
    }
  };

  const handleUninstall = async (providerKey: string) => {
    if (!window.confirm(`Are you sure you want to uninstall ${providerKey.toUpperCase()}? This will wipe stored credentials.`)) {
      return;
    }
    try {
      setActionLoading(prev => ({ ...prev, [providerKey]: true }));
      setTestResult(null);
      await api.uninstallExtension(providerKey);
      setTestResult({
        type: 'success',
        message: `${providerKey.toUpperCase()} has been uninstalled.`
      });
      await loadConnections();
    } catch (err: any) {
      setTestResult({
        type: 'error',
        message: err.message || `Failed to uninstall ${providerKey}.`
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [providerKey]: false }));
    }
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
        message: `Credentials for ${activeModal.toUpperCase()} (${envMode}) securely encrypted in database vault.`
      });

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

  // Filter extensions based on search query, category, and activeTab
  const filteredExtensions = EXTENSIONS_CATALOG.filter(ext => {
    const matchesSearch = ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ext.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === 'all' || ext.category === activeCategory;
    const isConn = connections.some(c => c.provider_key === ext.id && (c.status === 'CONNECTED' || c.status === 'ACTIVE'));
    const matchesTab = activeTab === 'all' || 
                       (activeTab === 'installed' && isConn) || 
                       (activeTab === 'marketplace' && !isConn);
    return matchesSearch && matchesCat && matchesTab;
  });

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>
            <span>Plugins</span>
            <span>/</span>
            <span style={{ color: '#083e47', fontWeight: 600 }}>
              {activeTab === 'marketplace' ? 'App Store' : 'Installed Plugins'}
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            {activeTab === 'marketplace' ? 'Plugin Marketplace & App Store' : 'Installed Plugins & Extensions'}
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>
            {activeTab === 'marketplace'
              ? 'Discover, install, and connect third-party business extensions, payment gateways, and shipping partners.'
              : 'Manage your active third-party connections, payment gateway credentials, and logistics bridges.'}
          </p>
        </div>

        <button 
          onClick={loadConnections}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: '#334155',
            fontSize: '13.5px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Alert Banner */}
      {testResult && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          background: testResult.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: testResult.type === 'success' ? '#15803d' : '#b91c1c',
          fontSize: '13.5px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: `1px solid ${testResult.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {testResult.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{testResult.message}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setTestResult(null)} 
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search and Category Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', width: '320px', height: '38px' }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search extensions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13.5px', color: '#0f172a' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Extensions' },
            { id: 'payments', label: 'Payments' },
            { id: 'shipping', label: 'Shipping & Couriers' },
            { id: 'messaging', label: 'Messaging' },
            { id: 'marketing', label: 'Marketing' },
            { id: 'channels', label: 'Channels' },
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: activeCategory === cat.id ? 700 : 500,
                border: activeCategory === cat.id ? '1px solid #083e47' : '1px solid #e2e8f0',
                backgroundColor: activeCategory === cat.id ? '#083e47' : '#ffffff',
                color: activeCategory === cat.id ? '#ffffff' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* UNIFORM COMPACT CARDS GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
        gap: '20px'
      }}>
        {filteredExtensions.map((ext) => {
          const Icon = ext.icon;
          const conn = getConn(ext.id);
          const isInstalled = Boolean(conn && conn.status !== 'DISCONNECTED');
          const isEnabled = conn?.status === 'ACTIVE';
          const isLoading = Boolean(actionLoading[ext.id]);

          return (
            <div
              key={ext.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              {/* Card Header */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: ext.iconBg,
                      color: ext.iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: '700', color: '#0f172a' }}>
                        {ext.name}
                      </h3>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
                        {ext.categoryLabel}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {ext.isInstallable ? (
                    isInstalled ? (
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        backgroundColor: isEnabled ? '#dcfce7' : '#fef3c7',
                        color: isEnabled ? '#15803d' : '#b45309',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isEnabled ? '#16a34a' : '#d97706' }} />
                        {isEnabled ? 'Active' : 'Disabled'}
                      </span>
                    ) : (
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: '600',
                        backgroundColor: '#f1f5f9',
                        color: '#64748b'
                      }}>
                        Ready to Install
                      </span>
                    )
                  ) : (
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      backgroundColor: '#f1f5f9',
                      color: '#94a3b8'
                    }}>
                      Coming Soon
                    </span>
                  )}
                </div>

                {/* Card Description */}
                <p style={{
                  fontSize: '13px',
                  color: '#64748b',
                  lineHeight: '1.45',
                  minHeight: '38px',
                  margin: '0 0 16px 0'
                }}>
                  {ext.description}
                </p>

                {/* Installed Status Metadata */}
                {ext.isInstallable && isInstalled && (
                  <div style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '12px',
                    color: '#475569',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>
                      <strong>Mode:</strong> {conn?.environment || 'Test'}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px', whiteSpace: 'nowrap' }}>
                      {conn?.account_identifier || 'Credentials Saved'}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Action Footer */}
              <div style={{ paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                {ext.isInstallable ? (
                  !isInstalled ? (
                    /* 1. NOT INSTALLED: Show Install Button */
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleInstall(ext.id)}
                      style={{
                        width: '100%',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: '#083e47',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#062f36')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#083e47')}
                    >
                      <Download size={14} />
                      <span>{isLoading ? 'Installing...' : 'Install Extension'}</span>
                    </button>
                  ) : (
                    /* 2. INSTALLED: Show Enable/Disable Toggle + Configure Button */
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      {/* Enable/Disable Toggle Switch Button */}
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleToggle(ext.id, conn?.status || 'DISABLED')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: isEnabled ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                          backgroundColor: isEnabled ? '#f0fdf4' : '#f8fafc',
                          color: isEnabled ? '#15803d' : '#64748b',
                          fontSize: '12.5px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                        title={isEnabled ? 'Click to disable extension' : 'Click to enable extension'}
                      >
                        {/* iOS-like pill switch */}
                        <div style={{
                          width: '32px',
                          height: '18px',
                          borderRadius: '9999px',
                          backgroundColor: isEnabled ? '#16a34a' : '#cbd5e1',
                          position: 'relative',
                          transition: 'background-color 0.2s ease'
                        }}>
                          <div style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            backgroundColor: '#ffffff',
                            position: 'absolute',
                            top: '2px',
                            left: isEnabled ? '16px' : '2px',
                            transition: 'left 0.2s ease',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                          }} />
                        </div>
                        <span>{isEnabled ? 'Enabled' : 'Disabled'}</span>
                      </button>

                      {/* Configure Button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveModal(ext.id as any);
                            setEnvMode(conn?.environment || 'TEST');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '7px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#083e47',
                            fontSize: '12.5px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                          title="Configure credentials and environment"
                        >
                          <Settings size={13} />
                          <span>Configure</span>
                        </button>

                        {/* Uninstall Button */}
                        <button
                          type="button"
                          onClick={() => handleUninstall(ext.id)}
                          style={{
                            padding: '7px 8px',
                            borderRadius: '8px',
                            border: '1px solid #fee2e2',
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            cursor: 'pointer'
                          }}
                          title="Uninstall extension"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  /* 3. COMING SOON: Disabled standard button */
                  <button
                    type="button"
                    disabled
                    style={{
                      width: '100%',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#f8fafc',
                      color: '#94a3b8',
                      border: '1px solid #e2e8f0',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'not-allowed',
                      textAlign: 'center'
                    }}
                  >
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Credential Setup Modal */}
      {activeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            maxWidth: '520px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#e6fffa', color: '#083e47', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
                    Configure {activeModal === 'razorpay' ? 'Razorpay Payments' : 'Shiprocket Logistics'}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Secrets are encrypted using AES-256-GCM in your tenant vault.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Environment Toggle (Test vs Live) */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Operational Environment
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEnvMode('TEST')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: envMode === 'TEST' ? '2px solid #083e47' : '1px solid #cbd5e1',
                    backgroundColor: envMode === 'TEST' ? '#f0fdfa' : '#ffffff',
                    color: envMode === 'TEST' ? '#083e47' : '#64748b',
                    fontSize: '13px',
                    fontWeight: 600,
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
                    borderRadius: '8px',
                    border: envMode === 'LIVE' ? '2px solid #083e47' : '1px solid #cbd5e1',
                    backgroundColor: envMode === 'LIVE' ? '#f0fdfa' : '#ffffff',
                    color: envMode === 'LIVE' ? '#083e47' : '#64748b',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Live Production
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveConnection}>
              {activeModal === 'razorpay' ? (
                <>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>
                      Key ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="rzp_test_..."
                      value={rzpKeyId}
                      onChange={(e) => setRzpKeyId(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>
                      Key Secret *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••••••"
                      value={rzpKeySecret}
                      onChange={(e) => setRzpKeySecret(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>
                      Webhook Secret (Optional)
                    </label>
                    <input
                      type="password"
                      placeholder="For payment capture webhook verification"
                      value={rzpWebhookSecret}
                      onChange={(e) => setRzpWebhookSecret(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>
                      Shiprocket Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="shipping@yourstore.com"
                      value={srEmail}
                      onChange={(e) => setSrEmail(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>
                      Shiprocket Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••••••"
                      value={srPassword}
                      onChange={(e) => setSrPassword(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  style={{
                    flex: 1,
                    padding: '9px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '9px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#083e47',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? 'Encrypting & Saving...' : 'Save & Encrypt'}
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
