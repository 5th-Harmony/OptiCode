import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import Logo from './Logo';

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onLoginSuccess,
  onOpenLegal
}) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agreedToTerms) return;
    onLoginSuccess({
      username: username || 'dev_architect_99',
      email: email || 'alex.dev@opticode.io',
      isLoggedIn: true
    });
  };

  const handleDemoLogin = () => {
    onLoginSuccess({
      username: 'dev_architect_99',
      email: 'alex.dev@opticode.io',
      isLoggedIn: true
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content auth-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} title="Close">
          <X size={18} />
        </button>

        <div className="auth-header">
          <Logo size={42} className="auth-logo-center" />
          <h2>{isSignUp ? 'Create OptiCode Account' : 'Sign In to OptiCode'}</h2>
          <p>{isSignUp ? 'Access AI-powered code optimization & insights' : 'Welcome back, developer!'}</p>
        </div>

        {/* Demo Fast Login Button */}
        <button className="btn-demo-login" onClick={handleDemoLogin}>
          <span>Demo Login as dev_architect_99</span>
        </button>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <div className="form-group">
              <label>Username</label>
              <div className="input-with-icon">
                <User size={15} className="field-icon" />
                <input
                  type="text"
                  placeholder="e.g. dev_architect_99"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail size={15} className="field-icon" />
              <input
                type="email"
                placeholder="alex.dev@opticode.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={15} className="field-icon" />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Legal Compliance Terms Checkbox */}
          <div className="legal-checkbox-group">
            <label className="checkbox-label" onClick={() => setAgreedToTerms(!agreedToTerms)}>
              {agreedToTerms ? (
                <CheckSquare size={16} className="checkbox-icon checked" />
              ) : (
                <Square size={16} className="checkbox-icon" />
              )}
              <span className="checkbox-text">
                I agree to the{' '}
                <span 
                  className="legal-link" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLegal('terms');
                  }}
                >
                  Terms of Use
                </span>{' '}
                and{' '}
                <span 
                  className="legal-link" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLegal('privacy');
                  }}
                >
                  Privacy Policy
                </span>
              </span>
            </label>
          </div>

          <button 
            type="submit" 
            className="btn-primary full-width"
            disabled={!agreedToTerms}
          >
            <ShieldCheck size={16} />
            <span>{isSignUp ? 'Register Account & Open Dashboard' : 'Sign In'}</span>
          </button>
        </form>

        <div className="auth-footer-toggle">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button type="button" onClick={() => setIsSignUp(false)} className="link-btn">
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button type="button" onClick={() => setIsSignUp(true)} className="link-btn">
                Register Now
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
