import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/services';
import { CountryPhoneInput } from '../../components/auth/CountryPhoneInput';
import { getPortalUrl } from '../../utils/subdomain';
import {
  Store,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ShoppingBag,
  Calendar,
  Layers,
  CheckCircle2,
  Check,
  ShieldCheck
} from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { registerStreamlined, isAuthenticated, isLoading: isStoreLoading, error: storeError, clearError } = useAuthStore();

  // If already authenticated, redirect straight to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Phase: 1 = Contact Input, 2 = OTP Verification, 3 = Store Details, 4 = Plan Purchasing
  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1);

  // Phase 1 State (Contact)
  const [rawIdentifier, setRawIdentifier] = useState('');
  const [formattedIdentifier, setFormattedIdentifier] = useState('');

  // Phase 2 State (OTP)
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devOtpNotification, setDevOtpNotification] = useState<string | null>(null);

  // Phase 3 State (Store Details)
  const [capabilityMode, setCapabilityMode] = useState<'BOTH' | 'COMMERCE' | 'SERVICES'>('BOTH');
  const [storeName, setStoreName] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phase 4 State (Plan Purchasing in INR ₹)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'growth' | 'enterprise'>('growth');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);

  const targetIdentifier = (formattedIdentifier || rawIdentifier).trim();

  // Auto-generate slug as user types storeName if not manually overridden
  const derivedSlug = (customSlug || storeName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'your-store';

  // OTP resend timer countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Phase 1 -> Send OTP
  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setUiError(null);
    clearError();

    if (!targetIdentifier) {
      setUiError('Please enter your email or mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.sendOtp({
        identifier: targetIdentifier,
        type: 'REGISTER'
      });

      if (res.devOtpPreview) {
        setDevOtpNotification(`[Dev Mode] Verification code: ${res.devOtpPreview}`);
        setOtpCode(res.devOtpPreview);
      }

      setResendCooldown(45);
      setPhase(2);
    } catch (err: any) {
      setUiError(err.message || 'Failed to send verification code. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Phase 2 -> Verify OTP
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setUiError(null);

    if (!otpCode || otpCode.trim().length < 4) {
      setUiError('Please enter the verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.verifyOtp({
        identifier: targetIdentifier,
        code: otpCode.trim(),
        type: 'REGISTER'
      });

      // Verification successful -> advance to Phase 3 (Store Details)
      setPhase(3);
    } catch (err: any) {
      setUiError(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Phase 3 -> Store Details Submit
  const handleStoreDetailsSubmit = (e: FormEvent) => {
    e.preventDefault();
    setUiError(null);

    if (!storeName.trim()) {
      setUiError('Please enter your store or business name.');
      return;
    }

    if (!password || password.trim().length < 6) {
      setUiError('Please create a password of at least 6 characters.');
      return;
    }

    // Advance to Phase 4 (Plan Purchasing in INR ₹)
    setPhase(4);
  };

  // Phase 4 -> Complete Plan Purchasing & Launch Store
  const handleCompleteRegistration = async () => {
    setUiError(null);
    clearError();

    const res = await registerStreamlined({
      storeName: storeName.trim(),
      identifier: targetIdentifier,
      capabilityMode,
      password: password.trim()
    });

    if (res.success) {
      navigate('/dashboard', { replace: true });
    } else if (res.error) {
      setUiError(res.error);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Brand Header */}
      <Link to="/" className="auth-brand">
        <div className="auth-brand-logo">
          <Store style={{ width: 22, height: 22 }} />
        </div>
        <div className="auth-brand-text">
          <span className="auth-brand-title">BillionBiz</span>
          <span className="auth-brand-subtitle">Store Registration</span>
        </div>
      </Link>

      {/* Main Register Card */}
      <div className="auth-card" style={{ maxWidth: phase === 4 ? '520px' : '460px', transition: 'max-width 0.2s ease' }}>
        {/* Step Progress Indicators */}
        <div className="auth-steps">
          <div className="auth-step-item">
            <div className={`auth-step-badge ${phase === 1 ? 'active' : phase > 1 ? 'completed' : ''}`}>
              {phase > 1 ? '✓' : '1'}
            </div>
            <span className="auth-step-label">Contact</span>
          </div>
          <div className="auth-step-line" />
          <div className="auth-step-item">
            <div className={`auth-step-badge ${phase === 2 ? 'active' : phase > 2 ? 'completed' : ''}`}>
              {phase > 2 ? '✓' : '2'}
            </div>
            <span className="auth-step-label">Verify</span>
          </div>
          <div className="auth-step-line" />
          <div className="auth-step-item">
            <div className={`auth-step-badge ${phase === 3 ? 'active' : phase > 3 ? 'completed' : ''}`}>
              {phase > 3 ? '✓' : '3'}
            </div>
            <span className="auth-step-label">Store</span>
          </div>
          <div className="auth-step-line" />
          <div className="auth-step-item">
            <div className={`auth-step-badge ${phase === 4 ? 'active' : ''}`}>
              4
            </div>
            <span className="auth-step-label">Plan</span>
          </div>
        </div>

        {/* Error Alert */}
        {(uiError || storeError) && (
          <div className="auth-alert-error">
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
            <span>{uiError || storeError}</span>
          </div>
        )}

        {/* Dev OTP Preview */}
        {devOtpNotification && (
          <div className="auth-alert-info">
            <Sparkles style={{ width: 16, height: 16, flexShrink: 0, color: '#2563eb' }} />
            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{devOtpNotification}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* PHASE 1: CONTACT INPUT (MOBILE / EMAIL)                  */}
        {/* ======================================================== */}
        {phase === 1 && (
          <div>
            <div className="auth-card-header">
              <h1 className="auth-card-title">Create Your Store</h1>
              <p className="auth-card-desc">
                Enter your mobile number or email address to get started.
              </p>
            </div>

            <form onSubmit={handleSendOtp}>
              <div className="auth-form-group">
                <label className="auth-label">Mobile Number or Email</label>
                <CountryPhoneInput
                  value={rawIdentifier}
                  onChange={(raw, _isMail, formatted) => {
                    setRawIdentifier(raw);
                    setFormattedIdentifier(formatted);
                  }}
                  placeholder="name@business.com or mobile number"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !targetIdentifier}
                className="auth-btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw style={{ width: 16, height: 16 }} className="animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    Send Verification Code
                    <ArrowRight style={{ width: 16, height: 16 }} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">Or</span>
            </div>

            {/* Google Signup Button */}
            <button
              type="button"
              onClick={() => {
                setUiError('Google Sign-In ready. In production, configure Google Client ID.');
              }}
              className="auth-google-btn"
            >
              <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* PHASE 2: ONLY ASK THE OTP                                */}
        {/* ======================================================== */}
        {phase === 2 && (
          <div>
            <button
              type="button"
              onClick={() => {
                setPhase(1);
                setOtpCode('');
                setUiError(null);
              }}
              className="auth-back-btn"
            >
              <ArrowLeft style={{ width: 14, height: 14 }} />
              <span>Change email or phone</span>
            </button>

            <div className="auth-card-header" style={{ marginTop: '0.5rem' }}>
              <h1 className="auth-card-title">Enter Verification Code</h1>
              <p className="auth-card-desc">
                We sent a 6-digit verification code to{' '}
                <strong style={{ color: '#0f172a' }}>{targetIdentifier}</strong>.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp}>
              <div className="auth-form-group">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="auth-otp-input"
                  autoFocus
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginTop: '0.5rem', color: '#64748b' }}>
                  <span>Code valid for 10 mins</span>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isSubmitting}
                    onClick={handleSendOtp}
                    style={{
                      color: resendCooldown > 0 ? '#94a3b8' : '#2563eb',
                      fontWeight: 600,
                      border: 'none',
                      background: 'none',
                      cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otpCode.length < 4}
                className="auth-btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw style={{ width: 16, height: 16 }} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & Continue
                    <ArrowRight style={{ width: 16, height: 16 }} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* PHASE 3: MUST-NEEDED STORE DETAILS                       */}
        {/* ======================================================== */}
        {phase === 3 && (
          <div>
            <button
              type="button"
              onClick={() => setPhase(2)}
              className="auth-back-btn"
            >
              <ArrowLeft style={{ width: 14, height: 14 }} />
              <span>Back to verification</span>
            </button>

            <div className="auth-card-header" style={{ marginTop: '0.5rem' }}>
              <h1 className="auth-card-title">Set Up Your Store</h1>
              <p className="auth-card-desc">
                Choose what your business offers, name your store, and set a password.
              </p>
            </div>

            <form onSubmit={handleStoreDetailsSubmit}>
              {/* 1. Store Type (Appointments / Products / Both) */}
              <div className="auth-form-group">
                <label className="auth-label">What does your store offer?</label>
                <div className="storefront-type-grid">
                  {/* Both (Unified) */}
                  <label
                    className={`storefront-type-card ${capabilityMode === 'BOTH' ? 'selected' : ''}`}
                    onClick={() => setCapabilityMode('BOTH')}
                  >
                    <input
                      type="radio"
                      name="capability"
                      checked={capabilityMode === 'BOTH'}
                      onChange={() => setCapabilityMode('BOTH')}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <div className="storefront-type-title">
                        <Layers style={{ width: 14, height: 14, color: '#064652' }} />
                        <span>Both (Products & Appointments)</span>
                        <span style={{ fontSize: '0.65rem', backgroundColor: '#ccfbf1', color: '#0f766e', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                          RECOMMENDED
                        </span>
                      </div>
                      <p className="storefront-type-desc">
                        Sell physical or digital goods and schedule appointments in a unified store.
                      </p>
                    </div>
                  </label>

                  {/* Products Only */}
                  <label
                    className={`storefront-type-card ${capabilityMode === 'COMMERCE' ? 'selected' : ''}`}
                    onClick={() => setCapabilityMode('COMMERCE')}
                  >
                    <input
                      type="radio"
                      name="capability"
                      checked={capabilityMode === 'COMMERCE'}
                      onChange={() => setCapabilityMode('COMMERCE')}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <div className="storefront-type-title">
                        <ShoppingBag style={{ width: 14, height: 14, color: '#064652' }} />
                        <span>Products & Retail Only</span>
                      </div>
                      <p className="storefront-type-desc">
                        Catalog, shopping cart, inventory management, and shipping orders.
                      </p>
                    </div>
                  </label>

                  {/* Appointments Only */}
                  <label
                    className={`storefront-type-card ${capabilityMode === 'SERVICES' ? 'selected' : ''}`}
                    onClick={() => setCapabilityMode('SERVICES')}
                  >
                    <input
                      type="radio"
                      name="capability"
                      checked={capabilityMode === 'SERVICES'}
                      onChange={() => setCapabilityMode('SERVICES')}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <div className="storefront-type-title">
                        <Calendar style={{ width: 14, height: 14, color: '#064652' }} />
                        <span>Appointments & Services Only</span>
                      </div>
                      <p className="storefront-type-desc">
                        Online client booking, staff schedules, calendars, and service menus.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 2. Store Name */}
              <div className="auth-form-group">
                <label className="auth-label">Store / Business Name</label>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <Store style={{ width: 18, height: 18 }} />
                  </div>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Acme Studio"
                    className="auth-input"
                    required
                  />
                </div>
              </div>

              {/* 3. Domain / Slug */}
              <div className="auth-form-group">
                <label className="auth-label">Storefront Web Address</label>
                <div className="auth-input-wrapper" style={{ padding: '0 0.75rem', backgroundColor: '#f8fafc' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>https://</span>
                  <input
                    type="text"
                    value={customSlug || derivedSlug}
                    onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="store-name"
                    className="auth-input"
                    style={{ paddingLeft: '0.25rem', paddingRight: '0.25rem', fontFamily: 'monospace', fontWeight: 600, color: '#064652' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>.stores.chandraprakash.codes</span>
                </div>
              </div>

              {/* 4. Password */}
              <div className="auth-form-group">
                <label className="auth-label">Create Password</label>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <Lock style={{ width: 18, height: 18 }} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="auth-input"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ paddingRight: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                  >
                    {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!storeName.trim() || password.length < 6}
                className="auth-btn-primary"
                style={{ marginTop: '1.25rem' }}
              >
                <span>Continue to Select Plan</span>
                <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* PHASE 4: PLAN PURCHASING IN INR (₹)                      */}
        {/* ======================================================== */}
        {phase === 4 && (
          <div>
            <button
              type="button"
              onClick={() => setPhase(3)}
              className="auth-back-btn"
            >
              <ArrowLeft style={{ width: 14, height: 14 }} />
              <span>Back to store details</span>
            </button>

            <div className="auth-card-header" style={{ marginTop: '0.5rem' }}>
              <h1 className="auth-card-title">Select Your Plan</h1>
              <p className="auth-card-desc">
                All plans include a <strong>14-day free trial</strong>. You can change or cancel anytime.
              </p>
            </div>

            {/* Monthly / Annual Toggle */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '0.75rem 0 1.25rem 0' }}>
              <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: billingCycle === 'monthly' ? '#ffffff' : 'transparent',
                    color: billingCycle === 'monthly' ? '#0f172a' : '#64748b',
                    boxShadow: billingCycle === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: billingCycle === 'annual' ? '#ffffff' : 'transparent',
                    color: billingCycle === 'annual' ? '#0f172a' : '#64748b',
                    boxShadow: billingCycle === 'annual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>Annual</span>
                  <span style={{ fontSize: '0.65rem', backgroundColor: '#dcfce7', color: '#166534', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                    SAVE 20%
                  </span>
                </button>
              </div>
            </div>

            {/* Plan Cards in INR (₹) */}
            <div className="auth-plan-grid">
              {/* Plan 1: Starter */}
              <div
                className={`auth-plan-card ${selectedPlan === 'starter' ? 'selected' : ''}`}
                onClick={() => setSelectedPlan('starter')}
              >
                <div className="auth-plan-header">
                  <div className="auth-plan-name">
                    <CheckCircle2 style={{ width: 16, height: 16, color: selectedPlan === 'starter' ? '#064652' : '#94a3b8' }} />
                    <span>Starter Plan</span>
                  </div>
                  <div className="auth-plan-price">
                    {billingCycle === 'monthly' ? '₹999' : '₹799'}
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>/mo</span>
                  </div>
                </div>
                <p className="auth-plan-desc">
                  Ideal for solo creators and new businesses. Includes Online Store, 1 Cashier POS Station, and standard email dispatch.
                </p>
              </div>

              {/* Plan 2: Growth (Recommended) */}
              <div
                className={`auth-plan-card ${selectedPlan === 'growth' ? 'selected' : ''}`}
                onClick={() => setSelectedPlan('growth')}
              >
                <div style={{ position: 'absolute', top: '-10px', right: '16px', backgroundColor: '#064652', color: '#ffffff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '99px', letterSpacing: '0.04em' }}>
                  POPULAR
                </div>
                <div className="auth-plan-header">
                  <div className="auth-plan-name">
                    <CheckCircle2 style={{ width: 16, height: 16, color: selectedPlan === 'growth' ? '#064652' : '#94a3b8' }} />
                    <span>Growth Plan</span>
                  </div>
                  <div className="auth-plan-price">
                    {billingCycle === 'monthly' ? '₹2,499' : '₹1,999'}
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>/mo</span>
                  </div>
                </div>
                <p className="auth-plan-desc">
                  Unlimited products & appointments, 3 POS counters, custom domain integration, Razorpay, Shiprocket & real-time inventory.
                </p>
              </div>

              {/* Plan 3: Enterprise */}
              <div
                className={`auth-plan-card ${selectedPlan === 'enterprise' ? 'selected' : ''}`}
                onClick={() => setSelectedPlan('enterprise')}
              >
                <div className="auth-plan-header">
                  <div className="auth-plan-name">
                    <CheckCircle2 style={{ width: 16, height: 16, color: selectedPlan === 'enterprise' ? '#064652' : '#94a3b8' }} />
                    <span>Enterprise Plan</span>
                  </div>
                  <div className="auth-plan-price">
                    {billingCycle === 'monthly' ? '₹7,999' : '₹6,499'}
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>/mo</span>
                  </div>
                </div>
                <p className="auth-plan-desc">
                  Multi-location retail outlets, unlimited cashier counters, priority account manager, and high-volume order APIs.
                </p>
              </div>
            </div>

            {/* Plan Guarantee Note */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <ShieldCheck style={{ width: 16, height: 16, color: '#10b981', flexShrink: 0 }} />
              <span>14-day free trial. You won't be charged today. Change or cancel anytime.</span>
            </div>

            {/* Launch Button */}
            <button
              type="button"
              disabled={isStoreLoading}
              onClick={handleCompleteRegistration}
              className="auth-btn-primary"
              style={{ marginTop: '1rem' }}
            >
              {isStoreLoading ? (
                <>
                  <RefreshCw style={{ width: 16, height: 16 }} className="animate-spin" />
                  <span>Provisioning Your Store...</span>
                </>
              ) : (
                <>
                  <Check style={{ width: 16, height: 16 }} />
                  <span>Activate Free Trial & Launch Store</span>
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </>
              )}
            </button>
          </div>
        )}

        {/* Security Footer */}
        <div className="auth-security-footer">
          <ShieldCheck style={{ width: 15, height: 15, color: '#10b981' }} />
          <span>Encrypted with TLS 1.3 & Multi-Tenant Data Isolation</span>
        </div>
      </div>

      {/* Footer Link: Sign In */}
      <p className="auth-footer-link">
        Already have a store account?{' '}
        <a href={getPortalUrl('admin', '/login')}>Sign In</a>
      </p>
    </div>
  );
}
