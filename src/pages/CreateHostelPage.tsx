import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { CredentialsDialog } from '@/components/CredentialsDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

interface University {
  id: number;
  name: string;
  code: string;
}

interface SubscriptionPlan {
  id: number;
  name: string;
  total_price: number;
  duration_months: number;
}

export default function CreateHostelPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [credentials, setCredentials] = useState<{ username: string; password: string; loginUrl?: string } | null>(null);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState<{ name: string; email: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact_phone: '',
    contact_email: '',
    university_id: '',
    admin_name: '',
    admin_email: '',
    admin_phone: '',
    admin_address: '',
    total_rooms: '',
    available_rooms: '',
    plan_id: '',
  });

  useEffect(() => {
    fetchUniversities();
    fetchSubscriptionPlans();
  }, []);

  const fetchUniversities = async () => {
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.UNIVERSITIES.LIST, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setUniversities(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching universities:', err);
    }
  };

  const fetchSubscriptionPlans = async () => {
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.SUBSCRIPTION_PLANS.LIST, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        // Backend returns { success: true, plans: [...] }
        if (data.success && Array.isArray(data.plans)) {
          setSubscriptionPlans(data.plans);
        } else if (data.success && Array.isArray(data.data)) {
          // Fallback for different response structure
          setSubscriptionPlans(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!formData.plan_id) {
        setError('Please select a subscription plan');
        setIsLoading(false);
        return;
      }

      const payload: any = {
        name: formData.name,
        address: formData.address,
        contact_phone: formData.contact_phone || undefined,
        contact_email: formData.contact_email || undefined,
        university_id: formData.university_id ? parseInt(formData.university_id) : undefined,
        admin_name: formData.admin_name,
        admin_email: formData.admin_email,
        admin_phone: formData.admin_phone,
        admin_address: formData.admin_address,
        total_rooms: parseInt(formData.total_rooms) || 0,
        available_rooms: parseInt(formData.available_rooms) || 0,
        subscription_plan_id: parseInt(formData.plan_id),
      };

      const response = await fetch(API_CONFIG.ENDPOINTS.HOSTELS.CREATE, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      // Debug logging
      console.log('📋 Hostel creation response:', data);
      console.log('🔐 Credentials in response:', data.data?.credentials);

      if (response.ok && data.success) {
        // Always show credentials if they're in the response
        if (data.data?.credentials) {
          const creds = data.data.credentials;
          console.log('✅ Credentials found, showing dialog');
          console.log('═══════════════════════════════════════════════════════');
          console.log('🔐 HOSTEL ADMIN CREDENTIALS (SUPER ADMIN VIEW)');
          console.log('═══════════════════════════════════════════════════════');
          console.log(`Hostel: ${data.data.hostel?.name || 'N/A'}`);
          console.log(`Admin: ${data.data.admin?.name || formData.admin_name}`);
          console.log(`Email: ${data.data.admin?.email || formData.admin_email}`);
          console.log('───────────────────────────────────────────────────────');
          console.log(`Username/Email: ${creds.username}`);
          console.log(`Password: ${creds.password}`);
          console.log(`Login URL: ${creds.loginUrl || 'N/A'}`);
          console.log('═══════════════════════════════════════════════════════');
          console.log('💡 These are the ORIGINAL credentials sent to the admin via email');
          console.log('═══════════════════════════════════════════════════════');
          
          setCredentials(creds);
          setCreatedAdmin({
            name: data.data.admin?.name || formData.admin_name,
            email: data.data.admin?.email || formData.admin_email
          });
          // Show credentials dialog immediately - ensure it's not blocked
          setIsLoading(false);
          // Use setTimeout to ensure dialog renders after state updates
          setTimeout(() => {
            setCredentialsDialogOpen(true);
            console.log('🔓 Credentials dialog opened with ORIGINAL credentials');
          }, 100);
        } else {
          // If no credentials in response, log and show error
          console.error('❌ No credentials in response:', data);
          setError('Hostel created but credentials were not returned. Please use "View Credentials" on the hostels page.');
          // Still navigate after a delay
          setTimeout(() => navigate('/hostels'), 3000);
        }
      } else {
        setError(data.message || 'Failed to create hostel');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create hostel');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Hostel</h1>
          <p className="text-gray-600 mt-2">Add a new hostel to the platform</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hostel Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Hostel Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="university_id">University {universities.length > 0 && '*'}</Label>
                <Select
                  value={formData.university_id}
                  onValueChange={(value) => setFormData({ ...formData, university_id: value })}
                  disabled={universities.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={universities.length === 0 ? "No universities available" : "Select university"} />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No universities available
                      </div>
                    ) : (
                      universities.map((university) => (
                        <SelectItem key={university.id} value={university.id.toString()}>
                          {university.name} ({university.code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_rooms">Total Rooms *</Label>
                  <Input
                    id="total_rooms"
                    type="number"
                    required
                    min="0"
                    value={formData.total_rooms}
                    onChange={(e) => setFormData({ ...formData, total_rooms: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="available_rooms">Available Rooms *</Label>
                  <Input
                    id="available_rooms"
                    type="number"
                    required
                    min="0"
                    value={formData.available_rooms}
                    onChange={(e) => setFormData({ ...formData, available_rooms: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin_name">Admin Name *</Label>
                  <Input
                    id="admin_name"
                    required
                    value={formData.admin_name}
                    onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_email">Admin Email *</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    required
                    value={formData.admin_email}
                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                    placeholder="admin@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Temporary credentials will be sent to this email
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin_phone">Admin Phone *</Label>
                  <Input
                    id="admin_phone"
                    type="tel"
                    required
                    value={formData.admin_phone}
                    onChange={(e) => setFormData({ ...formData, admin_phone: e.target.value })}
                    placeholder="+256 700 000 000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_address">Admin Address *</Label>
                  <Input
                    id="admin_address"
                    required
                    value={formData.admin_address}
                    onChange={(e) => setFormData({ ...formData, admin_address: e.target.value })}
                    placeholder="Physical address"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan *</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="plan_id">Select Subscription Plan *</Label>
                {subscriptionPlans.length === 0 ? (
                  <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-800">
                      No subscription plans available. Please create a subscription plan first.
                    </p>
                  </div>
                ) : (
                  <Select
                    value={formData.plan_id}
                    onValueChange={(value) => setFormData({ ...formData, plan_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subscription plan (required)" />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptionPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id.toString()}>
                          {plan.name} - UGX {plan.total_price.toLocaleString()} ({plan.duration_months} months)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  The admin will receive temporary login credentials via email
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Hostel
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/hostels')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>

      <CredentialsDialog
        open={credentialsDialogOpen}
        onOpenChange={(open) => {
          setCredentialsDialogOpen(open);
          if (!open && credentials) {
            // After closing dialog, navigate to hostels page
            navigate('/hostels');
          }
        }}
        credentials={credentials}
        title="Hostel Admin Credentials (Original)"
        description="These are the ORIGINAL temporary credentials generated and sent to the admin via email. Save them securely - they cannot be retrieved again."
        userName={createdAdmin?.name}
        userEmail={createdAdmin?.email}
      />
    </Layout>
  );
}

