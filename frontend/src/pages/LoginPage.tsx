import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, Eye, EyeOff, Copy, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getApiErrorMessage, loginUser } from '../api/client';
import { Toast } from '../components/ui/Toast';
import { isValidEmail } from '../utils/validation';

const ADMIN_LOGIN_EMAIL = import.meta.env.VITE_ADMIN_LOGIN_EMAIL ?? 'admin@uptimemonitor.dev';
const ADMIN_LOGIN_PASSWORD = import.meta.env.VITE_ADMIN_LOGIN_PASSWORD ?? 'Admin@2026';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim();
    if (!isValidEmail(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    await signIn(normalizedEmail, password);
  };

  const signIn = async (username: string, secret: string) => {
    setLoading(true);
    try {
      const data = await loginUser({ username, password: secret });
      login(data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to login'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSignIn = () => {
    setError(null);
    setEmail(ADMIN_LOGIN_EMAIL);
    setPassword(ADMIN_LOGIN_PASSWORD);
    void signIn(ADMIN_LOGIN_EMAIL, ADMIN_LOGIN_PASSWORD);
  };

  const copyValue = async (field: 'email' | 'password', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      // Clipboard can be unavailable (e.g. insecure context); values stay visible.
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-hero">
          <div className="auth-logo">
            <div className="auth-logo-circle">U</div>
            <span className="auth-logo-text">Uptime Monitor</span>
          </div>
          
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your account to continue monitoring your services.</p>
          
          <div className="auth-trust-badge">
            <div className="auth-trust-icon">
              <ShieldCheck size={20} />
            </div>
            <div className="auth-trust-text">
              <strong>Your monitoring. Your data.</strong>
              Secure, reliable, and built for uptime.
            </div>
          </div>
        </div>
        
        <div className="auth-form-wrapper">
          <form onSubmit={handleSubmit}>
            <div className="auth-input-group">
              <label className="auth-label">Email address</label>
              <div className="auth-input-wrapper">
                <Mail size={16} className="auth-icon" />
                <input 
                  type="email" 
                  className="auth-input" 
                  placeholder="you@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={error === 'Enter a valid email address.'}
                  required 
                />
              </div>
            </div>
            
            <div className="auth-input-group">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrapper">
                <Lock size={16} className="auth-icon" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="auth-input" 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <div className="auth-form-options">
              <label className="auth-checkbox-label">
                <input type="checkbox" className="auth-checkbox" />
                Remember me
              </label>
              <span className="auth-link">Forgot password?</span>
            </div>
            
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          
          <div className="auth-footer">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </div>

          <div className="auth-admin-card">
            <div className="auth-admin-card-header">
              <ShieldCheck size={16} />
              Admin access
            </div>
            <p className="auth-admin-card-subtitle">
              Explore the full admin console with live monitors.
            </p>
            {([
              ['email', 'Email', ADMIN_LOGIN_EMAIL],
              ['password', 'Password', ADMIN_LOGIN_PASSWORD],
            ] as const).map(([field, label, value]) => (
              <div className="auth-admin-row" key={field}>
                <span className="auth-admin-row-label">{label}</span>
                <span className="auth-admin-row-value">
                  <span>{value}</span>
                  <button
                    type="button"
                    className="auth-admin-copy"
                    onClick={() => copyValue(field, value)}
                    aria-label={`Copy admin ${label.toLowerCase()}`}
                  >
                    {copiedField === field ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </span>
              </div>
            ))}
            <button
              type="button"
              className="auth-admin-button"
              onClick={handleAdminSignIn}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in as Admin'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </div>
      {error && <Toast message={error} onDismiss={() => setError(null)} />}
    </div>
  );
}
