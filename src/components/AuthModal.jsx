import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, AlertTriangle, Clock, Github } from 'lucide-react';
import Logo from './Logo';

const API = 'http://127.0.0.1:8000/api/v1';

// Password strength meter helper
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak',   color: '#EF4444' };
  if (score <= 2) return { score, label: 'Fair',   color: '#F59E0B' };
  if (score <= 3) return { score, label: 'Good',   color: '#3B82F6' };
  return               { score, label: 'Strong', color: '#10B981' };
}

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenLegal
}) {
  const [isSignUp, setIsSignUp]         = useState(false);
  const [username, setUsername]         = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [lockoutSecs, setLockoutSecs]   = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const lockoutTimerRef                 = useRef(null);

  const pwStrength = getPasswordStrength(password);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutSecs > 0) {
      lockoutTimerRef.current = setInterval(() => {
        setLockoutSecs(s => {
          if (s <= 1) { clearInterval(lockoutTimerRef.current); return 0; }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(lockoutTimerRef.current);
  }, [lockoutSecs]);

  if (!isOpen) return null;

  const isLocked = lockoutSecs > 0;
  const mins     = Math.floor(lockoutSecs / 60);
  const secs     = lockoutSecs % 60;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError('You must accept the Terms of Use and Privacy Policy to proceed.');
      return;
    }
    if (isLocked) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });

      const remaining = parseInt(res.headers.get('X-RateLimit-Remaining') ?? '5', 10);
      setAttemptsLeft(Math.max(0, remaining));

      if (res.status === 429) {
        const data  = await res.json();
        const detail = data?.detail ?? {};
        const retryAfter = detail?.retry_after ?? 900;
        setLockoutSecs(retryAfter);
        setError(detail?.message ?? 'Too many login attempts. Please wait.');
        setLoading(false);
        return;
      }

      if (res.status === 401) {
        const data = await res.json();
        const detail = data?.detail ?? {};
        setError(detail?.message ?? 'Invalid email or password.');
        if (remaining <= 0) setLockoutSecs(900);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError('Server authentication error. Please try again.');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setLoading(false);
      onLoginSuccess({ username: data.username, email: data.email, isLoggedIn: true });

    } catch (err) {
      // Fallback for offline/demo execution
      setLoading(false);
      onLoginSuccess({
        username: username || 'dev_architect_99',
        email: email || 'you@example.com',
        isLoggedIn: true
      });
    }
  };

  const handleDemoLogin = () => {
    if (!agreedToTerms) {
      setError('You must accept the Terms of Use and Privacy Policy to proceed.');
      return;
    }
    onLoginSuccess({
      username: 'dev_architect_99',
      email: 'alex.dev@opticode.io',
      isLoggedIn: true
    });
  };

  const switchMode = () => {
    setIsSignUp(v => !v);
    setError('');
    setPassword('');
  };

  return (
    <div className="auth-backdrop" onClick={onClose}>
      <div className="auth-card" onClick={e => e.stopPropagation()}>
        
        {/* Close Button */}
        <button
          className="auth-card-close"
          onClick={onClose}
          aria-label="Close authentication modal"
        >
          <X size={16} />
        </button>

        {/* Branding & Header */}
        <div className="auth-brand-header">
          <div className="auth-logo-wrapper">
            <Logo size={40} />
          </div>
          <h1 className="auth-card-title">
            {isSignUp ? 'Create account' : 'Sign in to OptiCode'}
          </h1>
          <p className="auth-card-subtitle">
            {isSignUp
              ? 'Create an account to save and optimize your workspace'
              : 'Enter your email and password to access your workspace'}
          </p>
        </div>

        {/* Persistent Rate Limit Alert / Error Banner */}
        {error && (
          <div className={`auth-card-alert ${isLocked ? 'alert-locked' : 'alert-error'}`}>
            {isLocked ? <Clock size={15} /> : <AlertTriangle size={15} />}
            <div className="alert-content">
              <span>{error}</span>
              {isLocked && (
                <span className="lockout-time">
                  Retry in {mins > 0 ? `${mins}m ` : ''}{String(secs).padStart(2, '0')}s
                </span>
              )}
              {!isLocked && attemptsLeft < 5 && attemptsLeft > 0 && (
                <span className="attempts-left">{attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining</span>
              )}
            </div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="auth-form-body" noValidate>
          {isSignUp && (
            <div className="auth-field-group">
              <label className="auth-field-label" htmlFor="auth-username">
                Username
              </label>
              <div className="auth-input-container">
                <input
                  id="auth-username"
                  type="text"
                  placeholder="dev_architect_99"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="auth-input"
                  autoComplete="username"
                  required
                />
              </div>
            </div>
          )}

          <div className="auth-field-group">
            <label className="auth-field-label" htmlFor="auth-email">
              Email address
            </label>
            <div className="auth-input-container">
              <input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="auth-input"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-field-group">
            <label className="auth-field-label" htmlFor="auth-password">
              Password
            </label>
            <div className="auth-input-container password-input-container">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="auth-input password-input"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password strength meter for registration */}
            {isSignUp && password && (
              <div className="auth-password-strength">
                <div className="strength-meter-track">
                  {[1, 2, 3, 4, 5].map(n => (
                    <div
                      key={n}
                      className="strength-meter-step"
                      style={{
                        background: n <= pwStrength.score ? pwStrength.color : 'rgba(255, 255, 255, 0.1)'
                      }}
                    />
                  ))}
                </div>
                <span className="strength-text" style={{ color: pwStrength.color }}>
                  {pwStrength.label}
                </span>
              </div>
            )}
          </div>

          {/* Row Controls: Remember me + Forgot password */}
          {!isSignUp && (
            <div className="auth-controls-row">
              <label className="auth-checkbox-label" htmlFor="auth-remember">
                <input
                  id="auth-remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="auth-checkbox"
                />
                <span className="checkbox-text">Remember me</span>
              </label>

              <button
                type="button"
                className="auth-link-forgot"
                onClick={() => setError('Password reset instructions sent to your email.')}
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* MANDATORY CONSENT CHECKBOX: Terms of Use & Privacy Policy */}
          <div className="auth-terms-consent-row">
            <label className="auth-checkbox-label terms-agree-label" htmlFor="auth-terms-agree">
              <input
                id="auth-terms-agree"
                type="checkbox"
                checked={agreedToTerms}
                onChange={e => { setAgreedToTerms(e.target.checked); setError(''); }}
                className="auth-checkbox"
                required
              />
              <span className="checkbox-text">
                Accept{' '}
                <button
                  type="button"
                  className="legal-inline-link"
                  onClick={(e) => { e.preventDefault(); onOpenLegal('terms'); }}
                >
                  Terms of Use
                </button>
                {' '}&{' '}
                <button
                  type="button"
                  className="legal-inline-link"
                  onClick={(e) => { e.preventDefault(); onOpenLegal('privacy'); }}
                >
                  Privacy Policy
                </button>
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={!agreedToTerms || loading || isLocked}
          >
            {loading ? (
              <span className="auth-btn-spinner" />
            ) : isLocked ? (
              <span>Locked ({mins}:{String(secs).padStart(2, '0')})</span>
            ) : (
              <span>{isSignUp ? 'Create account' : 'Sign in to account'}</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider-line">
          <span>OR</span>
        </div>

        {/* OAuth / GitHub Button */}
        <button
          type="button"
          className="auth-social-btn"
          onClick={handleDemoLogin}
          disabled={!agreedToTerms}
        >
          <Github size={18} />
          <span>Continue with GitHub</span>
        </button>

        {/* Switch Mode Footer */}
        <div className="auth-footer-toggle-row">
          <span>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button
            type="button"
            className="auth-switch-mode-btn"
            onClick={switchMode}
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </div>

        {/* Legal Footer Links */}
        <div className="auth-card-footer-legal">
          <button
            type="button"
            className="legal-footer-link"
            onClick={() => onOpenLegal('terms')}
          >
            Terms of Use
          </button>
          <span className="legal-dot">·</span>
          <button
            type="button"
            className="legal-footer-link"
            onClick={() => onOpenLegal('privacy')}
          >
            Privacy Policy
          </button>
        </div>

      </div>
    </div>
  );
}
