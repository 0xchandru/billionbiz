import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { 
  Globe, 
  Webhook, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  Plus, 
  ShieldCheck,
  Zap,
  Mail,
  CreditCard,
  Truck
} from 'lucide-react';

export const IntegrationsSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'domains' | 'webhooks' | 'connected'>('domains');
  const [customDomain, setCustomDomain] = useState('');
  const [domainConnected, setDomainConnected] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Webhooks
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhooksList, setWebhooksList] = useState<any[]>([]);

  const storeSlug = localStorage.getItem('billionbiz_store_slug') || 'chandru-store';
  const liveStoreUrl = `https://${storeSlug}.stores.chandraprakash.codes`;

  const handleConnectDomain = (e: FormEvent) => {
    e.preventDefault();
    if (!customDomain.trim()) return;
    setDomainConnected(true);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleAddWebhook = (e: FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return;
    setWebhooksList([
      ...webhooksList,
      { id: `wh-${Date.now()}`, url: webhookUrl, events: ['order.created', 'booking.created'], active: true }
    ]);
    setWebhookUrl('');
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Breadcrumb & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
            <span>Settings</span>
            <span>/</span>
            <span style={{ color: '#083e47', fontWeight: 600 }}>Integrations</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Integrations & Custom Domains
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>
            Manage custom web domains, SSL certificates, developer webhooks, API keys, and connected platform bridges.
          </p>
        </div>
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
          <span>Domain configuration saved! Provisioning automatic SSL certificate.</span>
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
          onClick={() => setActiveTab('domains')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: activeTab === 'domains' ? 700 : 500,
            color: activeTab === 'domains' ? '#083e47' : '#64748b',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'domains' ? '2.5px solid #083e47' : '2.5px solid transparent',
            cursor: 'pointer'
          }}
        >
          <Globe size={15} />
          <span>Custom Domains & DNS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('webhooks')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: activeTab === 'webhooks' ? 700 : 500,
            color: activeTab === 'webhooks' ? '#083e47' : '#64748b',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'webhooks' ? '2.5px solid #083e47' : '2.5px solid transparent',
            cursor: 'pointer'
          }}
        >
          <Webhook size={15} />
          <span>Webhooks & API Keys</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('connected')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: activeTab === 'connected' ? 700 : 500,
            color: activeTab === 'connected' ? '#083e47' : '#64748b',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'connected' ? '2.5px solid #083e47' : '2.5px solid transparent',
            cursor: 'pointer'
          }}
        >
          <Zap size={15} />
          <span>Connected Services</span>
        </button>
      </div>

      {/* TAB 1: DOMAINS */}
      {activeTab === 'domains' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
              Primary Storefront Subdomain
            </h3>
            <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '20px' }}>
              Your store is provisioned automatically with TLS 1.3 encryption and dedicated multi-tenant routing.
            </p>

            <div style={{ padding: '18px', border: '1px solid #bbf7d0', borderRadius: '10px', backgroundColor: '#f0fdf4', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: '700', color: '#15803d', fontSize: '14.5px' }}>Default Production URL</span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#15803d', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>Active & Live</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <a
                  href={liveStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '15px', fontWeight: '600', color: '#083e47', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>{liveStoreUrl}</span>
                  <ExternalLink size={14} />
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(liveStoreUrl)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '12.5px', cursor: 'pointer' }}
                >
                  <Copy size={13} />
                  <span>{copiedKey ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Connect Custom Domain */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                Connect Your Own Domain (e.g. store.yourbrand.com)
              </h4>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
                Point a <strong>CNAME</strong> record in your DNS provider (Cloudflare, GoDaddy, Namecheap) to <code>stores.chandraprakash.codes</code>.
              </p>

              <form onSubmit={handleConnectDomain} style={{ display: 'flex', gap: '10px', maxWidth: '560px' }}>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="shop.mybrand.com"
                  style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#083e47',
                    color: '#ffffff',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Connect Domain
                </button>
              </form>

              {domainConnected && (
                <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569' }}>
                  Target Domain: <strong>{customDomain}</strong> • CNAME: <code>stores.chandraprakash.codes</code> • SSL: <strong>Active (Let's Encrypt TLS)</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WEBHOOKS & API KEYS */}
      {activeTab === 'webhooks' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            Merchant Developer API & Webhooks
          </h3>
          <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '20px' }}>
            Receive real-time HTTP POST notifications in your custom backend when platform events occur.
          </p>

          <form onSubmit={handleAddWebhook} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://api.yourdomain.com/webhooks/billionbiz"
              style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
              required
            />
            <button
              type="submit"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#083e47',
                color: '#ffffff',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <Plus size={15} />
              <span>Add Webhook Endpoint</span>
            </button>
          </form>

          {webhooksList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', border: '1px dashed #cbd5e1', borderRadius: '10px', color: '#64748b', fontSize: '13.5px' }}>
              No custom webhooks configured yet. Add your HTTP callback URL above to receive order and booking notifications.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {webhooksList.map((wh) => (
                <div key={wh.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div>
                    <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '13.5px' }}>{wh.url}</span>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Events: {wh.events.join(', ')}</div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d' }}>Active</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONNECTED SERVICES */}
      {activeTab === 'connected' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            Connected Platform Bridges
          </h3>
          <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '20px' }}>
            Active external software bridges powering authentication, payment collection, and notification delivery.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={20} color="#2563eb" />
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14.5px', color: '#0f172a' }}>Google OAuth 2.0 Identity</div>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>Google Continue sign-in for seamless merchant and staff login.</div>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d' }}>Connected</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={20} color="#15803d" />
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14.5px', color: '#0f172a' }}>Resend Transactional Email Engine</div>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>Delivers order receipts, booking confirmations, and OTP codes.</div>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d' }}>Live & Active</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={20} color="#083e47" />
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14.5px', color: '#0f172a' }}>Razorpay Payment Gateway</div>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>Instant UPI, Cards, and Netbanking tender processing.</div>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d' }}>Configured</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#fefce8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={20} color="#ca8a04" />
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14.5px', color: '#0f172a' }}>Shiprocket Logistics Dispatch</div>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>Courier automation, label generation, and real-time tracking.</div>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d' }}>Ready</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsSettingsPage;
