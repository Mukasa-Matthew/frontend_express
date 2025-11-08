import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate passwords
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      if (newPassword.length < 8) {
        setError('New password must be at least 8 characters long');
        setIsLoading(false);
        return;
      }

      if (newPassword === currentPassword) {
        setError('New password must be different from current password');
        setIsLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('New passwords do not match');
        setIsLoading(false);
        return;
      }

      // Call the API
      const response = await fetch(API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('✅ Password changed successfully! We just emailed you a confirmation.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Redirect after a short delay so the user can read the success message
        setTimeout(() => {
          navigate('/profile');
        }, 2500);
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Change password error:', err);
      setError(err instanceof Error ? err.message : 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Change Password</h1>
          <p className="text-gray-600 mt-2">Update your account password for better security</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Password Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <div className="mb-6 relative overflow-hidden rounded-xl border-2 border-green-400 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 shadow-2xl animate-scale-in">
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-emerald-400/20 to-teal-400/20 animate-gradient"></div>
                
                {/* Sparkle effects */}
                <div className="absolute top-4 right-4 text-2xl animate-sparkle">✨</div>
                <div className="absolute top-8 right-12 text-xl animate-sparkle" style={{ animationDelay: '0.5s' }}>⭐</div>
                <div className="absolute top-12 right-20 text-lg animate-sparkle" style={{ animationDelay: '1s' }}>💫</div>
                
                {/* Main content */}
                <div className="relative p-8">
                  <div className="flex items-start gap-6">
                    {/* Icon with enhanced animation */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                        <div className="relative rounded-full bg-gradient-to-br from-green-500 to-emerald-600 p-4 shadow-2xl animate-float">
                          <CheckCircle2 className="h-10 w-10 text-white" />
                        </div>
                        {/* Rotating ring */}
                        <div className="absolute inset-0 rounded-full border-4 border-green-300/50 animate-spin" style={{ animationDuration: '3s' }}></div>
                      </div>
                    </div>
                    
                    {/* Text content */}
                    <div className="flex-1 pt-2">
                      <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-700 via-emerald-700 to-teal-700 mb-3 flex items-center gap-3 animate-scale-in">
                        <span className="text-3xl animate-bounce">🎉</span>
                        <span>Password Changed Successfully!</span>
                        <span className="text-xl animate-pulse">🎊</span>
                      </h3>
                      
                      <p className="text-green-800 font-semibold mb-4 leading-relaxed text-lg">
                        <span className="inline-block animate-bounce mr-2">✅</span>
                        Your password has been updated successfully and is now secure!
                      </p>
                      
                      {/* Info box with enhanced styling */}
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 mb-4 border-2 border-green-200 shadow-lg">
                        <p className="text-base text-green-900 font-bold mb-3 flex items-center gap-2">
                          <span className="text-lg">📋</span>
                          What happens next:
                        </p>
                        <ul className="text-sm text-green-800 space-y-2 list-none">
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 font-bold mt-0.5">✓</span>
                            <span>A confirmation email has been sent to your registered email address</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 font-bold mt-0.5">✓</span>
                            <span>You can now log in using your new password</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 font-bold mt-0.5">✓</span>
                            <span>Your old password is no longer valid</span>
                          </li>
                        </ul>
                      </div>
                      
                      {/* Security reminder */}
                      <div className="flex items-center gap-3 text-sm text-green-700 bg-gradient-to-r from-white/60 to-green-50/60 backdrop-blur-sm rounded-lg px-4 py-3 border border-green-200 shadow-md">
                        <div className="rounded-full bg-green-100 p-2">
                          <Lock className="h-5 w-5 text-green-600" />
                        </div>
                        <span className="font-semibold">Remember to use your new password for your next login</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Animated progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-500 animate-shimmer"></div>
                
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl blur-2xl opacity-20 animate-pulse -z-10"></div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password *</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                    disabled={isLoading}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password *</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    required
                    disabled={isLoading}
                    minLength={8}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    disabled={isLoading}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    required
                    disabled={isLoading}
                    minLength={8}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Security Notice</p>
                    <p className="text-sm text-blue-700 mt-1">
                      After changing your password, you will receive a confirmation email at your registered email address. 
                      If you did not make this change, please contact support immediately.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/profile')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">Password Best Practices</h3>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>Use a unique password that you don't use elsewhere</li>
                  <li>Include a mix of uppercase, lowercase, numbers, and special characters</li>
                  <li>Avoid using personal information like your name or birthday</li>
                  <li>Don't share your password with anyone</li>
                  <li>Consider using a password manager to generate and store secure passwords</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}


