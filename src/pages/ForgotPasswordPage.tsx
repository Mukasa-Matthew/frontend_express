import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDescription } from '@/components/ui/alert';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { API_CONFIG } from '@/config/api';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setResetToken(data.token);
      } else {
        setError(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    // Store token in sessionStorage for the reset password page
    if (resetToken) {
      sessionStorage.setItem('reset_token', resetToken);
      navigate('/reset-password');
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
              <h2 className="text-3xl font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-blue-100">We've sent a 6-digit OTP code to your email address</p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-green-500/20 border border-green-400/30 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-100 font-medium">OTP Sent Successfully!</p>
                    <p className="text-xs text-green-100/80 mt-1">
                      An OTP code has been sent to <strong>{email}</strong>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-500/20 border border-blue-400/30 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-blue-100 font-semibold mb-2">
                  Next steps:
                </p>
                <ol className="list-decimal list-inside text-xs text-blue-100/90 space-y-1">
                  <li>Check your email inbox</li>
                  <li>Enter the 6-digit OTP code</li>
                  <li>Create your new password</li>
                </ol>
              </div>

              <Button 
                onClick={handleContinue} 
                className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Continue to Reset Password
              </Button>
              
              <div className="text-center">
                <Link to="/login" className="text-sm text-blue-100 hover:text-white flex items-center justify-center gap-2 transition-colors font-medium hover:underline">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </div>
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
            <Mail className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg">Forgot Password?</h1>
          <p className="text-blue-100 mt-3 text-lg font-medium">We'll help you reset it</p>
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
                <Label htmlFor="email" className="text-white font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 bg-white/20 border-white/30 text-white placeholder:text-blue-100/50 backdrop-blur-sm focus:bg-white/30 focus:border-white/50 transition-all"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-indigo-500 via-purple-600 to-blue-600 hover:from-indigo-600 hover:via-purple-700 hover:to-blue-700 text-white font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105" 
                disabled={isLoading}
              >
                {isLoading ? 'Sending OTP...' : 'Send OTP Code'}
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




