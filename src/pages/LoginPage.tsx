import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import Turnstile from '@/components/Turnstile';
import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed" 
           style={{
             backgroundImage: `url('https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3')`
           }}>
      </div>
      
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/[0.02] via-purple-900/[0.02] to-blue-900/[0.02]"></div>
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md space-y-6 sm:space-y-8">
        {/* Brand Header */}
        <div className="text-center animate-fade-in">
          <div className="mx-auto h-24 w-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600 flex items-center justify-center mb-6 shadow-2xl backdrop-blur-sm border-2 border-white/30 animate-bounce-gentle">
            <span className="text-4xl font-bold text-white">R</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white drop-shadow-lg">RooMio</h1>
          <p className="text-blue-100 mt-3 text-lg font-medium">Modern Hostel Management</p>
        </div>

        {/* Glass Morphism Login Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/30 rounded-3xl shadow-2xl p-8 animate-fade-in hover:bg-white/15 transition-all">
          <div className="space-y-1 pb-6 text-center">
            <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
            <p className="text-blue-100 mt-2">Sign in to your account to continue</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-white font-medium">Email or Username</Label>
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
              <Label htmlFor="password" className="text-white font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-white/20 border-white/30 text-white placeholder:text-blue-100/50 backdrop-blur-sm focus:bg-white/30 focus:border-white/50 transition-all"
              />
            </div>

            {isCaptchaEnabled && (
              <div className="space-y-2">
                <Label className="text-white font-medium">Security Verification</Label>
                <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
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
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 3s ease-in-out infinite;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}

