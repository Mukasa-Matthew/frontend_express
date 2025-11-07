import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { ProfilePictureUpload } from '@/components/ProfilePictureUpload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2, Lock, Eye, EyeOff } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditable, setIsEditable] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    console.log('ProfilePage - User from context:', user);
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      // Username might not be in user object, fetch from API
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.AUTH.PROFILE, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setName(data.user.name || '');
          setEmail(data.user.email || '');
          setUsername(data.user.username || '');
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const response = await fetch(API_CONFIG.ENDPOINTS.AUTH.PROFILE, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name,
          email: user?.role === 'super_admin' ? email : undefined, // Only super admin can change email
          username,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        updateUser({
          name: data.user.name,
          email: data.user.email,
          ...(data.user.username && { username: data.user.username }),
        });
        setSuccess('Profile updated successfully');
        setIsEditable(false);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setIsChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      // Validate passwords
      if (!currentPassword || !newPassword || !confirmPassword) {
        setPasswordError('Please fill in all fields');
        setIsChangingPassword(false);
        return;
      }

      if (newPassword.length < 8) {
        setPasswordError('New password must be at least 8 characters long');
        setIsChangingPassword(false);
        return;
      }

      if (newPassword === currentPassword) {
        setPasswordError('New password must be different from current password');
        setIsChangingPassword(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordError('New passwords do not match');
        setIsChangingPassword(false);
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
        setPasswordSuccess('✅ Password changed successfully! A confirmation email has been sent to your registered email address. Your password has been updated and you can now use your new password to log in.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Keep the form visible for a moment to show success, then hide after 3 seconds
        setTimeout(() => {
          setShowPasswordChange(false);
          setPasswordSuccess('');
        }, 5000);
      } else {
        setPasswordError(data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Change password error:', err);
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account information</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Picture */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfilePictureUpload
                onUploadSuccess={() => {
                  // Success is already handled by ProfilePictureUpload component
                }}
                onUploadError={(error) => setError(error)}
              />
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Personal Information</CardTitle>
              {!isEditable && (
                <Button variant="outline" size="sm" onClick={() => setIsEditable(true)}>
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditable}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditable || user?.role !== 'super_admin'}
                  className={user?.role !== 'super_admin' ? 'bg-gray-50' : ''}
                />
                {user?.role !== 'super_admin' && (
                  <p className="text-xs text-gray-500">
                    Only super admin can change email address
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username (Optional)</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!isEditable}
                  placeholder="Enter username"
                />
              </div>

              {isEditable && (
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditable(false);
                      setError('');
                      setSuccess('');
                      fetchProfile();
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Role</span>
              <span className="text-sm font-medium capitalize">{user?.role || 'N/A'}</span>
            </div>
            {user?.hostel_id && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Hostel ID</span>
                <span className="text-sm font-medium">{user.hostel_id}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            {!showPasswordChange && (
              <Button variant="outline" size="sm" onClick={() => setShowPasswordChange(true)}>
                Change Password
              </Button>
            )}
          </CardHeader>
          {showPasswordChange && (
            <CardContent className="space-y-4">
              {passwordError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}

              {passwordSuccess && (
                <div className="relative overflow-hidden rounded-xl border-2 border-green-400 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 shadow-2xl animate-scale-in">
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

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password *</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      disabled={isChangingPassword}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                      aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                      disabled={isChangingPassword}
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
                      disabled={isChangingPassword}
                      minLength={8}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      disabled={isChangingPassword}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Must be at least 8 characters long</p>
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
                      disabled={isChangingPassword}
                      minLength={8}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      disabled={isChangingPassword}
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
                    onClick={handlePasswordChange}
                    disabled={isChangingPassword}
                    className="flex-1"
                  >
                    {isChangingPassword ? (
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
                    onClick={() => {
                      setShowPasswordChange(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordError('');
                      setPasswordSuccess('');
                    }}
                    disabled={isChangingPassword}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </Layout>
  );
}




