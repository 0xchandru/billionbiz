import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { CountryPhoneInput } from '../../components/auth/CountryPhoneInput';
import {
  Store,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  RefreshCw
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

  // Form states
  const [storeName, setStoreName] = useState('');
  const [rawIdentifier, setRawIdentifier] = useState('');
  const [formattedIdentifier, setFormattedIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [uiError, setUiError] = useState<string | null>(null);

  const targetIdentifier = (formattedIdentifier || rawIdentifier).trim();

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setUiError(null);
    clearError();

    if (!storeName.trim()) {
      setUiError('Please enter your store or business name.');
      return;
    }

    if (!targetIdentifier) {
      setUiError('Please enter your email or mobile number.');
      return;
    }

    if (!password || password.trim().length < 6) {
      setUiError('Password must be at least 6 characters.');
      return;
    }

    const res = await registerStreamlined({
      storeName: storeName.trim(),
      identifier: targetIdentifier,
      password: password.trim(),
      capabilityMode: 'BOTH'
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
      <div className="auth-card">
        {/* Header */}
        <div className="auth-card-header">
          <h1 className="auth-card-title">Create Your Store</h1>
          <p className="auth-card-desc">
            Start your online store and booking platform in minutes.
          </p>
        </div>

        {/* Error Alert */}
        {(uiError || storeError) && (
          <div className="auth-alert-error">
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
            <span>{uiError || storeError}</span>
          </div>
        )}

        <form onSubmit={handleRegister}>
          {/* Store Name Input */}
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
                placeholder="e.g. Acme Studio"
                className="auth-input"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Email or Phone Input (Country code only appears when typing numbers!) */}
          <div className="auth-form-group">
            <label className="auth-label">Email or Phone</label>
            <CountryPhoneInput
              value={rawIdentifier}
              onChange={(raw, _isMail, formatted) => {
                setRawIdentifier(raw);
                setFormattedIdentifier(formatted);
              }}
              placeholder="Email or mobile number"
              required
            />
          </div>

          {/* Password Input */}
          <div className="auth-form-group">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <div className="auth-input-icon">
                <Lock style={{ width: 18, height: 18 }} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (min 6 characters)"
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

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={isStoreLoading || !storeName.trim() || !targetIdentifier || password.length < 6}
            className="auth-btn-primary"
            style={{ marginTop: '1.25rem' }}
          >
            {isStoreLoading ? (
              <>
                <RefreshCw style={{ width: 16, height: 16 }} className="animate-spin" />
                Creating Store...
              </>
            ) : (
              <>
                Create Store & Start
                <ArrowRight style={{ width: 16, height: 16 }} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer: Sign in link */}
      <p className="auth-footer-link">
        Already have a store account?{' '}
        <Link to="/login">Sign In</Link>
      </p>
    </div>
  );
}
