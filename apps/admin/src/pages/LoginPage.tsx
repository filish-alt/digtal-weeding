import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import { useTheme } from '../context/ThemeContext';
import { Heart, Lock, Mail, User, AlertCircle, Sparkles, Crown, Sun, Moon, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, signup } = useAuth();
  const { loginPlatform } = usePlatformAuth();
  const { theme, toggleTheme } = useTheme();

  // Mode: 'signin' | 'signup' | 'platform'
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'platform'>('signin');

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (authMode === 'signup') {
        const res = await signup(email, name, password);
        setSuccessMessage(
          res.message || 'Registration submitted! Your account is awaiting platform admin approval before you can sign in.',
        );
        setAuthMode('signin');
        setPassword('');
      } else if (authMode === 'platform') {
        await loginPlatform(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Floating theme toggle button */}
      <button
        className="login-theme-toggle"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
      </button>

      {/* Ambient background glow circles */}
      <div className="login-ambient-orb orb-1" />
      <div className="login-ambient-orb orb-2" />
      <div className="login-ambient-orb orb-3" />
      <div className="login-ambient-orb orb-4" />

      <div className="login-card-container">
        {/* Top Badge */}
        <div className="wedding-badge">
          {authMode === 'platform' ? (
            <>
              <Crown size={14} className="sparkle-icon" />
              <span>Platform Superadmin Portal</span>
              <Crown size={14} className="sparkle-icon" />
            </>
          ) : (
            <>
              <Sparkles size={14} className="sparkle-icon" />
              <span>Digital Wedding Portal</span>
              <Sparkles size={14} className="sparkle-icon" />
            </>
          )}
        </div>

        <div className="login-card">
          <div className="login-header">
            <div className="heart-icon-wrapper">
              <div className="heart-icon-glow" />
              {authMode === 'platform' ? (
                <Crown size={32} style={{ position: 'relative', zIndex: 1, color: '#d97706' }} />
              ) : (
                <Heart size={32} className="heart-icon-svg" />
              )}
            </div>

            <h1 className="login-title">
              {authMode === 'signup' && 'Begin Your Celebration'}
              {authMode === 'signin' && 'Welcome to Your Wedding Portal'}
              {authMode === 'platform' && 'Platform Admin Sign In'}
            </h1>
            <p className="login-subtitle">
              {authMode === 'signup' && 'Create a couple account to craft invitations and manage your guests seamlessly'}
              {authMode === 'signin' && 'Sign in to manage RSVPs, guests, digital invitations & live entry'}
              {authMode === 'platform' && 'Superadmin access to approve couples, view signups & issue door staff PINs'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="login-tab-switcher">
            <button
              type="button"
              className={`login-tab-btn ${authMode === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('signin');
                setError(null);
                setSuccessMessage(null);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`login-tab-btn ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('signup');
                setError(null);
                setSuccessMessage(null);
              }}
            >
              Register
            </button>
            <button
              type="button"
              className={`login-tab-btn ${authMode === 'platform' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('platform');
                setError(null);
                setSuccessMessage(null);
                if (email === '' || email.includes('wedding.com')) {
                  setEmail('admin@platform.com');
                  setPassword('admin123456');
                }
              }}
            >
              Superadmin
            </button>
          </div>

          {successMessage && (
            <div
              style={{
                background: 'var(--success-light)',
                border: '1px solid var(--success)',
                color: 'var(--success)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                fontWeight: 700,
                marginBottom: '18px',
                lineHeight: 1.5,
              }}
            >
              🎉 {successMessage}
            </div>
          )}

          {error && (
            <div className="login-error-alert">
              <AlertCircle size={18} className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {authMode === 'signup' && (
              <div className="login-input-group">
                <label className="login-label">Couple / Event Name</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jessica & Alexander"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="login-input"
                  />
                </div>
              </div>
            )}

            <div className="login-input-group">
              <label className="login-label">
                {authMode === 'platform' ? 'Administrator Email' : 'Account Email'}
              </label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  required
                  placeholder={authMode === 'platform' ? 'admin@platform.com' : 'you@example.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                />
              </div>
            </div>

            <div className="login-input-group">
              <label className="login-label">Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                />
              </div>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? (
                <div className="btn-loading-text">
                  <div className="spinner" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  {authMode === 'signup' && <span>Submit Registration</span>}
                  {authMode === 'signin' && <span>Sign In to Dashboard</span>}
                  {authMode === 'platform' && <span>Access Platform Control</span>}
                </>
              )}
            </button>
          </form>

          {authMode === 'platform' && (
            <div
              style={{
                marginTop: '18px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--section-bg)',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
              }}
            >
              Default Superadmin: <code>admin@platform.com</code> | <code>admin123456</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
