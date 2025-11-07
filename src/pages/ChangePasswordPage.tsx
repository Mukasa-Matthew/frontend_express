import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
        setSuccess('✅ Password changed successfully! A confirmation email has been sent to your registered email address. You will be redirected to your profile page shortly.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Redirect after 5 seconds to give user time to see the success message
        setTimeout(() => {
          navigate('/profile');
        }, 5000);
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
              <div className="mb-6 relative overflow-hidden rounded-lg border-2 border-green-400 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 shadow-lg animate-in fade-in-50 slide-in-from-top-5 duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 animate-pulse"></div>
                <div className="relative p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="rounded-full bg-green-500 p-3 shadow-lg animate-bounce">
                        <CheckCircle2 className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="text-xl font-bold text-green-900 mb-2 flex items-center gap-2">
                        <span className="animate-pulse">🎉</span>
                        Password Changed Successfully!
                      </h3>
                      <p className="text-green-800 font-medium mb-3 leading-relaxed">
                        ✅ Your password has been updated successfully!
                      </p>
                      <div className="bg-white/60 rounded-lg p-4 mb-3 border border-green-200">
                        <p className="text-sm text-green-900 font-semibold mb-2">What happens next:</p>
                        <ul className="text-sm text-green-800 space-y-1.5 list-disc list-inside">
                          <li>A confirmation email has been sent to your registered email address</li>
                          <li>You can now log in using your new password</li>
                          <li>Your old password is no longer valid</li>
                        </ul>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-green-700 bg-white/40 rounded-md px-3 py-2">
                        <Lock className="h-4 w-4" />
                        <span className="font-medium">Remember to use your new password for your next login</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 animate-shimmer"></div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password *</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                  disabled={isLoading}
                  minLength={8}
                />
                <p className="text-xs text-gray-500">
                  Must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  disabled={isLoading}
                  minLength={8}
                />
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


