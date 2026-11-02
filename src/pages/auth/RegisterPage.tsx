import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Store, Mail, Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [capabilityMode, setCapabilityMode] = useState<'BOTH' | 'PRODUCTS' | 'SERVICES'>('BOTH');

  // Slug derivation for preview
  const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'your-brand';

  // Password Strength Calculation
  const hasMinLength = password.length >= 8;
  const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const strengthScore = [hasMinLength, hasUpperLower, hasNumber, hasSpecial].filter(Boolean).length;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    if (!fullName || !email || !password || !storeName) return;

    const res = await register({
      fullName,
      email,
      password,
      storeName,
      capabilityMode
    });

    if (res.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: '2.5rem 1.5rem',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Brand Header */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', marginBottom: '2rem' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: '#064652',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '1.3rem',
            boxShadow: '0 4px 10px rgba(6, 70, 82, 0.25)'
          }}
        >
          B
        </div>
        <div>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#064652', letterSpacing: '-0.02em' }}>
            Billion<span style={{ color: '#447515' }}>Biz</span>
          </span>
          <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
            START FREE • PROVISION STORE
          </span>
        </div>
      </Link>

      {/* Main Registration Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
          padding: '2.5rem 2.25rem'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#064652' }}>Create your free store</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Instant setup. No credit card required. Free forever starter plan.
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Your Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Morgan"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.4rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Work Email */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Work Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@morganretail.com"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.4rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Store Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Store or Business Name
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Morgan Artisan Bakery"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.4rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <Store size={18} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            {/* Live Subdomain Preview */}
            <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#64748b' }}>
              Storefront URL: <span style={{ fontFamily: 'monospace', color: '#064652', fontWeight: 600 }}>{slug}.stores.chandraprakash.codes</span>
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Secure Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.4rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            {/* Strength Meter Bar */}
            {password.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '4px', height: '4px', marginBottom: '0.4rem' }}>
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      style={{
                        flex: 1,
                        borderRadius: '2px',
                        backgroundColor:
                          step <= strengthScore
                            ? strengthScore <= 2
                              ? '#f59e0b'
                              : '#10b981'
                            : '#e2e8f0'
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', fontSize: '0.75rem', color: '#64748b' }}>
                  <span style={{ color: hasMinLength ? '#447515' : '#94a3b8' }}>✓ 8+ chars</span>
                  <span style={{ color: hasUpperLower ? '#447515' : '#94a3b8' }}>✓ Upper & lower</span>
                  <span style={{ color: hasNumber ? '#447515' : '#94a3b8' }}>✓ Number</span>
                  <span style={{ color: hasSpecial ? '#447515' : '#94a3b8' }}>✓ Symbol</span>
                </div>
              </div>
            )}
          </div>

          {/* Capability Mode Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
              What do you want to offer?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
              {[
                { id: 'BOTH', title: 'Hybrid (Both)', desc: 'Products & Bookings' },
                { id: 'PRODUCTS', title: 'Products Only', desc: 'Retail / Commerce' },
                { id: 'SERVICES', title: 'Services Only', desc: 'Appointments & Shifts' }
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setCapabilityMode(opt.id as any)}
                  style={{
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: capabilityMode === opt.id ? '2px solid #064652' : '1px solid #cbd5e1',
                    backgroundColor: capabilityMode === opt.id ? '#f0fdfa' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#064652' }}>{opt.title}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '0.85rem',
              backgroundColor: '#064652',
              color: '#ffffff',
              padding: '0.9rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 10px rgba(6, 70, 82, 0.25)',
              opacity: isLoading ? 0.75 : 1
            }}
          >
            {isLoading ? 'Provisioning your store...' : 'Create store and launch'} <ArrowRight size={18} />
          </button>
        </form>

        {/* Security badge */}
        <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <ShieldCheck size={16} color="#447515" /> Protected by PostgreSQL tenant isolation & SHA-256 tokens
        </div>
      </div>

      {/* Switch to login */}
      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#64748b' }}>
        Already have a BillionBiz account?{' '}
        <Link to="/login" style={{ color: '#064652', fontWeight: 700, textDecoration: 'none' }}>
          Sign in
        </Link>
      </div>
    </div>
  );
}
