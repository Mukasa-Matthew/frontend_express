import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import { API_CONFIG } from '@/config/api';
import { Link } from 'react-router-dom';

export default function ResetPasswordPage() {
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Get token from sessionStorage
    const token = sessionStorage.getItem('reset_token');
    if (!token) {
      // If no token, redirect to forgot password
      navigate('/forgot-password');
    } else {
      setResetToken(token);
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verifiedToken: resetToken, otp, newPassword: password }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Clear token from sessionStorage
        sessionStorage.removeItem('reset_token');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
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
          {/* Glass Morphism Success Card */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/30 rounded-3xl shadow-2xl p-8 animate-fade-in">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 backdrop-blur-sm border border-green-400/30">
                <CheckCircle className="h-10 w-10 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Password Reset Successful!</h2>
              <p className="text-blue-100">Your password has been changed successfully</p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-green-500/20 border border-green-400/30 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-100">
                    You will be redirected to the login page in a few seconds...
                  </p>
                </div>
              </div>

              <Button 
                onClick={() => navigate('/login')} 
                className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Go to Login
              </Button>
            </div>
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
          <div className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600 flex items-center justify-center mb-6 shadow-2xl backdrop-blur-sm border-2 border-white/30">
            <Lock className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg">Reset Password</h1>
          <p className="text-blue-100 mt-3 text-lg font-medium">Enter your OTP and new password</p>
        </div>

        {/* Glass Morphism Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/30 rounded-3xl shadow-2xl p-8 animate-fade-in hover:bg-white/15 transition-all">
          <div className="space-y-6">
            {error && (
              <div className="bg-red-500/90 border border-red-400/50 text-white px-4 py-3 rounded-lg backdrop-blur-sm">
                <AlertDescription>{error}</AlertDescription>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-white font-medium">OTP Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  disabled={isLoading}
                  className="text-center text-2xl tracking-widest h-12 bg-white/20 border-white/30 text-white placeholder:text-blue-100/50 backdrop-blur-sm focus:bg-white/30 focus:border-white/50 transition-all"
                />
                <p className="text-xs text-blue-100/70">
                  Check your email for the 6-digit OTP code
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pr-10 h-12 bg-white/20 border-white/30 text-white placeholder:text-blue-100/50 backdrop-blur-sm focus:bg-white/30 focus:border-white/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-blue-100/70">
                  Must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white font-medium">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pr-10 h-12 bg-white/20 border-white/30 text-white placeholder:text-blue-100/50 backdrop-blur-sm focus:bg-white/30 focus:border-white/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-indigo-500 via-purple-600 to-blue-600 hover:from-indigo-600 hover:via-purple-700 hover:to-blue-700 text-white font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105" 
                disabled={isLoading}
              >
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </Button>

              <div className="text-center">
                <Link to="/login" className="text-sm text-blue-100 hover:text-white flex items-center justify-center gap-2 transition-colors font-medium hover:underline">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            </form>
          </div>
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




