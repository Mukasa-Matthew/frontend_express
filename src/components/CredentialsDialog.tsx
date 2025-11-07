import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';

interface Credentials {
  username: string;
  password: string;
  loginUrl?: string;
}

interface CredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentials: Credentials | null;
  title?: string;
  description?: string;
  userName?: string;
  userEmail?: string | null;
}

export function CredentialsDialog({
  open,
  onOpenChange,
  credentials,
  title = 'Login Credentials',
  description = 'Please save these credentials. You can copy them to share with the user.',
  userName,
  userEmail,
}: CredentialsDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(true); // Show password by default for super admin

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Debug logging - also log full credentials when dialog opens for super admin
  React.useEffect(() => {
    if (open && credentials) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔐 CREDENTIALS DIALOG OPENED (SUPER ADMIN VIEW)');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`Username/Email: ${credentials.username}`);
      console.log(`Password: ${credentials.password || 'MISSING'}`);
      console.log(`Login URL: ${credentials.loginUrl || 'N/A'}`);
      if (userName) console.log(`Name: ${userName}`);
      if (userEmail) console.log(`Email: ${userEmail}`);
      console.log('═══════════════════════════════════════════════════════');
      console.log('💡 Password is visible in the dialog below');
      console.log('═══════════════════════════════════════════════════════');
    }
  }, [open, credentials, userName, userEmail]);

  if (!credentials) {
    console.warn('⚠️ CredentialsDialog: No credentials provided');
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {(userName || userEmail) && (
            <div className="space-y-2">
              {userName && (
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-muted-foreground">{userName}</p>
                </div>
              )}
              {userEmail && (
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{userEmail}</p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username / Email</Label>
              <div className="flex gap-2">
                <Input
                  id="username"
                  value={credentials.username}
                  readOnly
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(credentials.username, 'username')}
                >
                  {copiedField === 'username' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    readOnly
                    className="font-mono pr-10 bg-blue-50 border-blue-200"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(credentials.password, 'password')}
                  title="Copy password"
                >
                  {copiedField === 'password' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Password is visible by default. Click the eye icon to hide it.
              </p>
            </div>

            {credentials.loginUrl && (
              <div className="space-y-2">
                <Label htmlFor="loginUrl">Login URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="loginUrl"
                    value={credentials.loginUrl}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(credentials.loginUrl!, 'loginUrl')}
                  >
                    {copiedField === 'loginUrl' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="text-sm text-green-800">
                <strong>✅ Original Credentials:</strong> These are the exact temporary credentials that were generated and sent to the admin via email. 
                Please save them securely. The original password cannot be retrieved again once you close this dialog.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
          <Button
            onClick={() => {
              const text = `Username: ${credentials.username}\nPassword: ${credentials.password}${credentials.loginUrl ? `\nLogin URL: ${credentials.loginUrl}` : ''}`;
              handleCopy(text, 'all');
            }}
            variant="default"
          >
            {copiedField === 'all' ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied All
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy All
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

