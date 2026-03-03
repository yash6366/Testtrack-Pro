import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks';
import ThemeToggle from '@/components/ThemeToggle';

export default function SignupForm({ onSuccess }) {
  const navigate = useNavigate();
  const { signup, error: authError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('DEVELOPER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    // Signup
    const result = await signup(name, email, password, role);

    if (result.success) {
      setSignupSuccess(true);
      setTimeout(() => {
        navigate('/login?message=Please verify your email to login.');
      }, 3000);
    } else {
      setError(result.error || 'Signup failed');
    }

    setLoading(false);
  };

  if (signupSuccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="max-w-5xl w-full mx-auto px-6 pt-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[var(--surface-strong)] border border-[var(--border)] flex items-center justify-center font-bold">
              TT
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">TestTrack Pro</p>
              <h1 className="text-lg font-semibold">Account created</h1>
            </div>
          </Link>
          <ThemeToggle />
        </header>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="tt-card p-8 w-full max-w-lg text-center animate-fade-in">
            <div className="text-[var(--success)] text-4xl mb-4">✓</div>
            <h2 className="text-2xl font-semibold mb-4">Signup Successful</h2>
            <p className="text-[var(--muted)] mb-4">
              We've sent a verification email to <strong>{email}</strong>.
            </p>
            <p className="text-[var(--muted)] mb-6">
              Please check your inbox and click the verification link to activate your account.
            </p>
            <p className="text-xs text-[var(--muted)]">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="max-w-6xl w-full mx-auto px-6 pt-8">
        <nav className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[var(--surface-strong)] border border-[var(--border)] flex items-center justify-center font-bold">
              TT
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">TestTrack Pro</p>
              <h1 className="text-lg font-semibold">Create account</h1>
            </div>
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <div className="flex-1 flex items-center">
        <div className="max-w-6xl w-full mx-auto px-6 py-12 grid lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6 animate-fade-up">
            <span className="tt-pill">Launch ready</span>
            <h2 className="text-4xl font-semibold leading-tight">Bring QA into every release.</h2>
            <p className="text-[var(--muted)]">
              Keep traceability across test runs, bug discussions, and production checks.
            </p>
            <div className="tt-card-soft p-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Unified workspace</span>
                <span>Realtime updates</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Role-based dashboards</span>
                <span>Secure access</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Chat + context</span>
                <span>Launch confidence</span>
              </div>
            </div>
          </div>

          <div className="tt-card p-8 w-full max-w-md justify-self-center animate-fade-in">
            <h3 className="text-2xl font-semibold mb-6">Start your workspace</h3>

            {(error || authError) && (
              <div className="tt-card-soft border border-[var(--danger)] text-[var(--danger)] px-4 py-3 rounded-xl mb-4">
                {error || authError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="signup-name" className="block text-sm font-semibold mb-2">
                  Full Name
                </label>
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="tt-input"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-semibold mb-2">
                  Email Address
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="tt-input"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-semibold mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="tt-input pr-10"
                    placeholder="At least 6 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="signup-confirm-password" className="block text-sm font-semibold mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="tt-input pr-10"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="signup-role" className="block text-sm font-semibold mb-2">
                  Role
                </label>
                <select
                  id="signup-role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="tt-select"
                  required
                >
                  <option value="DEVELOPER">Developer</option>
                  <option value="TESTER">Tester</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="tt-btn tt-btn-primary w-full py-3 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Create account'}
              </button>
            </form>

            <p className="text-center text-sm text-[var(--muted)] mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-[var(--primary)] font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
