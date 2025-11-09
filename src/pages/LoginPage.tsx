import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDescription } from '@/components/ui/alert';
import Turnstile from '@/components/Turnstile';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'super_admin') {
        navigate('/dashboard');
      } else if (user.role === 'hostel_admin') {
        navigate('/hostel-admin/dashboard');
      } else if ((user as any).role === 'custodian') {
        navigate('/custodian/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // @ts-ignore enhance login to accept captcha when backend requires it
      await login(identifier, password, captchaToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
  const isCaptchaEnabled = !!siteKey && import.meta.env.VITE_DISABLE_TURNSTILE !== 'true';

  return (
    <div className="min-h-screen flex items-center justify-center relative py-8 px-4 sm:py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3')`,
        }}
      />

      {/* Dark overlay for consistency */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/[0.02] via-purple-900/[0.02] to-blue-900/[0.02]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <div className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600 flex items-center justify-center mb-6 shadow-2xl backdrop-blur-sm border-2 border-white/30">
            <span className="text-4xl font-bold text-white">R</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg">RooMio</h1>
          <p className="text-blue-100 mt-3 text-lg font-medium">Modern Hostel Management</p>
        </div>

        {/* Glass Morphism Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/30 rounded-3xl shadow-2xl p-8 animate-fade-in hover:bg-white/15 transition-all">
          <div className="space-y-2 text-center text-white">
            <h2 className="text-3xl font-bold">Welcome Back</h2>
            <p className="text-blue-100">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-white font-medium">
                Email or Username
              </Label>
              <Input
                id="identifier"
                type="text"
                placeholder="admin@example.com or adminuser"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="h-12 bg-white/20 border-white/30 text-white placeholder:text-blue-100/50 backdrop-blur-sm focus:bg-white/30 focus:border-white/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-white/20 border-white/30 text-white placeholder:text-blue-100/50 backdrop-blur-sm focus:bg-white/30 focus:border-white/50 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {isCaptchaEnabled && (
              <div className="space-y-2">
                <Label className="text-white font-medium">Security Verification</Label>
                <div className="bg-white/15 border border-white/30 rounded-xl p-2 backdrop-blur-sm">
                  <Turnstile siteKey={siteKey} onVerify={setCaptchaToken} />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/90 border border-red-400/50 text-white px-4 py-3 rounded-lg backdrop-blur-sm">
                <AlertDescription>{error}</AlertDescription>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-indigo-500 via-purple-600 to-blue-600 hover:from-indigo-600 hover:via-purple-700 hover:to-blue-700 text-white font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              disabled={isLoading || (isCaptchaEnabled && !captchaToken)}
            >
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Sign In
            </Button>

            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-100 hover:text-white flex items-center justify-center gap-2 transition-colors font-medium hover:underline"
              >
                <HelpCircle className="h-4 w-4" />
                Forgot your password?
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
      `}</style>
    </div>
  );
}

