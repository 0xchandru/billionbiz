import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/services';
import { CountryPhoneInput } from '../../components/auth/CountryPhoneInput';
import {
  Store,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ShoppingBag,
  Calendar,
  Layers,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  Sparkles
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

  // Wizard Phases: 1 = Contact Input, 1.5 = OTP Verification, 2 = Store Details, 3 = Password Setup
  const [phase, setPhase] = useState<1 | 1.5 | 2 | 3>(1);

  // Form State
  const [rawIdentifier, setRawIdentifier] = useState('');
  const [isEmail, setIsEmail] = useState(true);
  const [formattedIdentifier, setFormattedIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [storeName, setStoreName] = useState('');
  const [capabilityMode, setCapabilityMode] = useState<'COMMERCE' | 'SERVICES' | 'BOTH'>('BOTH');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devOtpNotification, setDevOtpNotification] = useState<string | null>(null);

  // Derived slug preview
  const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'your-business';

  // Password strength calculation
  const hasMinLength = password.length >= 6;
  const hasNumberOrSymbol = /[0-9!@#$%^&*]/.test(password);
  const isStrong = hasMinLength && hasNumberOrSymbol;

  // Countdown timer for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setUiError(null);
    clearError();

    const target = formattedIdentifier || rawIdentifier;
    if (!target || target.trim().length === 0) {
      setUiError('Please enter your email or mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.sendOtp({
        identifier: target,
        type: 'REGISTER'
      });

      if (res.devOtpPreview) {
        setDevOtpNotification(`[Dev Mode] Verification code: ${res.devOtpPreview}`);
        setOtpCode(res.devOtpPreview);
      }

      setResendCooldown(45);
      setPhase(1.5);
    } catch (err: any) {
      setUiError(err.message || 'Failed to send verification code. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setUiError(null);

    const target = formattedIdentifier || rawIdentifier;
    if (!otpCode || otpCode.trim().length < 4) {
      setUiError('Please enter the verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.verifyOtp({
        identifier: target,
        code: otpCode.trim(),
        type: 'REGISTER'
      });

      // Proceed to Step 2: Store / Business Name & Type
      setPhase(2);
    } catch (err: any) {
      setUiError(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStoreDetailsSubmit = (e: FormEvent) => {
    e.preventDefault();
    setUiError(null);

    if (!storeName.trim()) {
      setUiError('Please enter a name for your business or store.');
      return;
    }

    // Proceed to Step 3: Password setup (optional)
    setPhase(3);
  };

  const handleCompleteRegistration = async (skipPassword = false) => {
    setUiError(null);
    clearError();

    const target = formattedIdentifier || rawIdentifier;
    const chosenPassword = skipPassword ? undefined : password.trim();

    const res = await registerStreamlined({
      identifier: target,
      storeName: storeName.trim(),
      capabilityMode,
      password: chosenPassword
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

      {/* Main Card */}
      <div className="auth-card">
        {/* Step Indicator */}
        <div className="auth-steps">
          <div className="auth-step-item">
            <div
              className={`auth-step-badge ${
                phase === 1 || phase === 1.5 ? 'active' : 'completed'
              }`}
            >
              {phase > 1.5 ? '✓' : '1'}
            </div>
            <span className="auth-step-label">Identity</span>
          </div>
          <div className="auth-step-line" />
          <div className="auth-step-item">
            <div
              className={`auth-step-badge ${
                phase === 2 ? 'active' : phase > 2 ? 'completed' : ''
              }`}
            >
              {phase > 2 ? '✓' : '2'}
            </div>
            <span className="auth-step-label">Store</span>
          </div>
          <div className="auth-step-line" />
          <div className="auth-step-item">
            <div className={`auth-step-badge ${phase === 3 ? 'active' : ''}`}>
              3
            </div>
            <span className="auth-step-label">Security</span>
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

        {/* PHASE 1: SINGLE INPUT BOX (EMAIL OR MOBILE) */}
        {phase === 1 && (
          <div>
            <div className="auth-card-header">
              <h1 className="auth-card-title">Get Started with BillionBiz</h1>
              <p className="auth-card-desc">
                Enter your email or mobile number to register your store. We'll send an instant verification code.
              </p>
            </div>

            <form onSubmit={handleSendOtp}>
              <div className="auth-form-group">
                <label className="auth-label">Email or Mobile Number</label>
                <CountryPhoneInput
                  value={rawIdentifier}
                  onChange={(raw, isMail, formatted) => {
                    setRawIdentifier(raw);
                    setIsEmail(isMail);
                    setFormattedIdentifier(formatted);
                  }}
                  placeholder="name@business.com or +91 98765 43210"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !rawIdentifier.trim()}
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

            {/* Social Divider */}
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">Or continue with</span>
            </div>

            {/* Continue with Google */}
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

        {/* PHASE 1.5: 6-DIGIT OTP VERIFICATION */}
        {phase === 1.5 && (
          <div>
            <div className="auth-card-header">
              <h1 className="auth-card-title">Verify Your Code</h1>
              <p className="auth-card-desc">
                We sent a 6-digit code to{' '}
                <strong style={{ color: '#0f172a' }}>{formattedIdentifier || rawIdentifier}</strong>.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp}>
              <div className="auth-form-group">
                <label className="auth-label">Enter 6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="auth-otp-input"
                  autoFocus
                />
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setPhase(1)}
                  style={{ color: '#64748b', textDecoration: 'underline' }}
                >
                  Change {isEmail ? 'email' : 'phone'}
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={handleSendOtp}
                  style={{ color: '#2563eb', fontWeight: 600, cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer' }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PHASE 2: STORE / BUSINESS NAME & STOREFRONT TYPE */}
        {phase === 2 && (
          <div>
            <div className="auth-card-header">
              <h1 className="auth-card-title">Name Your Store</h1>
              <p className="auth-card-desc">
                Choose a business name and select what your store will offer.
              </p>
            </div>

            <form onSubmit={handleStoreDetailsSubmit}>
              <div className="auth-form-group">
                <label className="auth-label">Store or Business Name</label>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <Store style={{ width: 18, height: 18 }} />
                  </div>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Shoum Boutique or Shoum Salon"
                    className="auth-input"
                    autoFocus
                  />
                </div>
                {/* Live Slug Preview */}
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.35rem', display: 'flex', gap: '0.35rem' }}>
                  <span>Storefront URL:</span>
                  <span style={{ color: '#2563eb', fontFamily: 'monospace', fontWeight: 600 }}>
                    https://{slug}.stores.chandraprakash.codes
                  </span>
                </div>
              </div>

              {/* Storefront Type Selection */}
              <div className="auth-form-group">
                <label className="auth-label">What will you sell or offer?</label>
                <div className="storefront-type-grid">
                  {/* Option 1: Products */}
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
                        <ShoppingBag style={{ width: 14, height: 14, color: '#2563eb' }} />
                        <span>Products & Retail Commerce</span>
                      </div>
                      <p className="storefront-type-desc">
                        Physical & digital goods, inventory, shopping cart & shipping.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Appointments */}
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
                        <Calendar style={{ width: 14, height: 14, color: '#2563eb' }} />
                        <span>Appointments & Services</span>
                      </div>
                      <p className="storefront-type-desc">
                        Booking slots, staff scheduling, service menus & client calendar.
                      </p>
                    </div>
                  </label>

                  {/* Option 3: Both Unified */}
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
                        <Layers style={{ width: 14, height: 14, color: '#2563eb' }} />
                        <span>Both (Unified Store)</span>
                        <span style={{ fontSize: '0.65rem', backgroundColor: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                          RECOMMENDED
                        </span>
                      </div>
                      <p className="storefront-type-desc">
                        Sell products and book appointments in a single unified storefront.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={!storeName.trim()}
                className="auth-btn-primary"
              >
                <span>Continue to Security</span>
                <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            </form>
          </div>
        )}

        {/* PHASE 3: OPTIONAL PASSWORD SETUP & INSTANT LAUNCH */}
        {phase === 3 && (
          <div>
            <div className="auth-card-header">
              <h1 className="auth-card-title">Set Password (Optional)</h1>
              <p className="auth-card-desc">
                Set a password to log in directly, or skip this step and log in via SMS/Email OTP anytime.
              </p>
            </div>

            <div>
              <div className="auth-form-group">
                <label className="auth-label">Account Password</label>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <Lock style={{ width: 18, height: 18 }} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters (optional)"
                    className="auth-input"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ paddingRight: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                  >
                    {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                  </button>
                </div>

                {password.length > 0 && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1, height: 4, backgroundColor: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: isStrong ? '100%' : '50%',
                          backgroundColor: isStrong ? '#10b981' : '#f59e0b',
                          transition: 'all 0.2s ease'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {isStrong ? 'Strong' : 'Min 6 chars'}
                    </span>
                  </div>
                )}
              </div>

              {/* Complete with Password */}
              <button
                type="button"
                disabled={isStoreLoading}
                onClick={() => handleCompleteRegistration(false)}
                className="auth-btn-primary"
              >
                {isStoreLoading ? (
                  <>
                    <RefreshCw style={{ width: 16, height: 16 }} className="animate-spin" />
                    Provisioning Store...
                  </>
                ) : (
                  <>
                    <CheckCircle2 style={{ width: 16, height: 16 }} />
                    Complete Registration & Launch Store
                  </>
                )}
              </button>

              {/* Skip Password Button */}
              <button
                type="button"
                disabled={isStoreLoading}
                onClick={() => handleCompleteRegistration(true)}
                className="auth-btn-secondary"
              >
                Skip Password — I'll Log In via OTP
              </button>
            </div>
          </div>
        )}

        {/* Security Assurance */}
        <div className="auth-security-footer">
          <ShieldCheck style={{ width: 16, height: 16, color: '#10b981' }} />
          <span>Encrypted with TLS 1.3 & Multi-Tenant Data Isolation</span>
        </div>
      </div>

      {/* Footer: Already have an account */}
      <p className="auth-footer-link">
        Already have a store account?{' '}
        <Link to="/login">Sign In</Link>
      </p>
    </div>
  );
}
