import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/services';
import { CountryPhoneInput } from '../../components/auth/CountryPhoneInput';
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
  MessageSquare
} from 'lucide-react';

type LoginView = 'PASSWORD' | 'OTP_REQUEST' | 'OTP_VERIFY';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUnified, isAuthenticated, isLoading: isAuthLoading, error: authError, clearError } = useAuthStore();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Current view: PASSWORD (default), OTP_REQUEST (single input), OTP_VERIFY (enter code)
  const [view, setView] = useState<LoginView>('PASSWORD');

  // Input states — shared across views so entering in phase 1 autofills phase 2!
  const [rawIdentifier, setRawIdentifier] = useState('');
  const [formattedIdentifier, setFormattedIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devOtpNotification, setDevOtpNotification] = useState<string | null>(null);

  // OTP cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const targetIdentifier = (formattedIdentifier || rawIdentifier).trim();

  // 1. Password-based Login Submit
  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    setUiError(null);
    clearError();

    if (!targetIdentifier) {
      setUiError('Please enter your email or mobile number.');
      return;
    }
    if (!password) {
      setUiError('Please enter your password.');
      return;
    }

    const res = await loginUnified(targetIdentifier, { password });
    if (res.success) {
      navigate(res.destination || from, { replace: true });
    } else if (res.error) {
      setUiError(res.error);
    }
  };

  // 2. Transition from Password view to OTP view (retains entered identifier!)
  const handleOpenOtpView = () => {
    setUiError(null);
    clearError();
    setView('OTP_REQUEST');
  };

  // 3. Request OTP code
  const handleSendOtp = async (e?: FormEvent) => {
    if (e) e.preventDefault();
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
        type: 'LOGIN'
      });

      if (res.devOtpPreview) {
        setDevOtpNotification(`[Dev Mode] Verification code: ${res.devOtpPreview}`);
        setOtpCode(res.devOtpPreview);
      }

      setResendCooldown(45);
      setView('OTP_VERIFY');
    } catch (err: any) {
      setUiError(err.message || 'Failed to send OTP code. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Verify OTP and login
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setUiError(null);
    clearError();

    if (!otpCode || otpCode.trim().length < 4) {
      setUiError('Please enter the 6-digit verification code.');
      return;
    }

    const res = await loginUnified(targetIdentifier, { otp: otpCode.trim() });
    if (res.success) {
      navigate(res.destination || from, { replace: true });
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
          <span className="auth-brand-subtitle">Merchant Portal</span>
        </div>
      </Link>

      {/* Main Login Card */}
      <div className="auth-card">
        {/* Error Alert */}
        {(uiError || authError) && (
          <div className="auth-alert-error">
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
            <span>{uiError || authError}</span>
          </div>
        )}

        {/* Dev OTP Preview */}
        {devOtpNotification && (
          <div className="auth-alert-info">
            <Sparkles style={{ width: 16, height: 16, flexShrink: 0, color: '#2563eb' }} />
            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{devOtpNotification}</span>
          </div>
        )}

        {/* VIEW 1: MINIMAL SIGN IN (EMAIL/PHONE + PASSWORD) */}
        {view === 'PASSWORD' && (
          <div>
            <div className="auth-card-header">
              <h1 className="auth-card-title">Sign In</h1>
              <p className="auth-card-desc">
                Enter your details to access your merchant account.
              </p>
            </div>

            <form onSubmit={handlePasswordLogin}>
              {/* Email or Phone Input */}
              <div className="auth-form-group">
                <label className="auth-label">Email or Phone</label>
                <CountryPhoneInput
                  value={rawIdentifier}
                  onChange={(raw, _isMail, formatted) => {
                    setRawIdentifier(raw);
                    setFormattedIdentifier(formatted);
                  }}
                  placeholder="Email or mobile number"
                  autoFocus
                />
              </div>

              {/* Password Input */}
              <div className="auth-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="auth-label" style={{ marginBottom: 0 }}>Password</label>
                  <Link
                    to="/forgot-password"
                    style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 500 }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <Lock style={{ width: 18, height: 18 }} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="auth-input"
                    autoComplete="current-password"
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

              {/* Primary Sign In Button */}
              <button
                type="submit"
                disabled={isAuthLoading || !targetIdentifier || !password}
                className="auth-btn-primary"
              >
                {isAuthLoading ? (
                  <>
                    <RefreshCw style={{ width: 16, height: 16 }} className="animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight style={{ width: 16, height: 16 }} />
                  </>
                )}
              </button>

              {/* Sign in with OTP Button below */}
              <button
                type="button"
                onClick={handleOpenOtpView}
                className="auth-btn-secondary"
                style={{ marginTop: '0.75rem' }}
              >
                <MessageSquare style={{ width: 16, height: 16, color: '#2563eb' }} />
                <span>Sign in with OTP</span>
              </button>
            </form>
          </div>
        )}

        {/* VIEW 2: OTP REQUEST (ONLY ONE INPUT ASKING EMAIL/PHONE — AUTOFILLS FROM VIEW 1) */}
        {view === 'OTP_REQUEST' && (
          <div>
            <button
              type="button"
              onClick={() => {
                setView('PASSWORD');
                setUiError(null);
              }}
              className="auth-back-btn"
            >
              <ArrowLeft style={{ width: 14, height: 14 }} />
              <span>Back to password sign in</span>
            </button>

            <div className="auth-card-header" style={{ marginTop: '0.5rem' }}>
              <h1 className="auth-card-title">Sign in with OTP</h1>
              <p className="auth-card-desc">
                Enter your email or phone number to receive a verification code.
              </p>
            </div>

            <form onSubmit={handleSendOtp}>
              {/* Only One Input Field */}
              <div className="auth-form-group">
                <label className="auth-label">Email or Phone</label>
                <CountryPhoneInput
                  value={rawIdentifier}
                  onChange={(raw, _isMail, formatted) => {
                    setRawIdentifier(raw);
                    setFormattedIdentifier(formatted);
                  }}
                  placeholder="Email or mobile number"
                  autoFocus
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
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP
                    <ArrowRight style={{ width: 16, height: 16 }} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* VIEW 3: OTP VERIFICATION (ENTER 6-DIGIT CODE) */}
        {view === 'OTP_VERIFY' && (
          <div>
            <button
              type="button"
              onClick={() => {
                setView('OTP_REQUEST');
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
                Enter the 6-digit code sent to <strong style={{ color: '#0f172a' }}>{targetIdentifier}</strong>.
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
                    onClick={() => handleSendOtp()}
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
                disabled={isAuthLoading || otpCode.length < 4}
                className="auth-btn-primary"
              >
                {isAuthLoading ? (
                  <>
                    <RefreshCw style={{ width: 16, height: 16 }} className="animate-spin" />
                    Verifying & Signing In...
                  </>
                ) : (
                  <>
                    Verify & Sign In
                    <ArrowRight style={{ width: 16, height: 16 }} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer: Register Link */}
      <p className="auth-footer-link">
        Don't have a store yet?{' '}
        <Link to="/register">Create Store</Link>
      </p>
    </div>
  );
}
