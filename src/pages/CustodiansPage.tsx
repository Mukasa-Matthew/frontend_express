import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { CredentialsDialog } from '@/components/CredentialsDialog';
import { Users, Plus, Mail, Phone, AlertCircle, Eye, Key } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Custodian {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: string;
  created_at: string;
}

export default function CustodiansPage() {
  const [custodians, setCustodians] = useState<Custodian[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustodian, setSelectedCustodian] = useState<Custodian | null>(null);
  const [credentials, setCredentials] = useState<{ username: string; password: string; loginUrl?: string } | null>(null);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: ''
  });

  useEffect(() => {
    fetchCustodians();
  }, []);

  const fetchCustodians = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`${API_CONFIG.ENDPOINTS.CUSTODIANS.LIST}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch custodians');
      }

      const data = await response.json();

      if (data.success) {
        setCustodians(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to load custodians');
      }
    } catch (err) {
      console.error('Error fetching custodians:', err);
      setError(err instanceof Error ? err.message : 'Failed to load custodians');
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (custodian: Custodian) => {
    setSelectedCustodian(custodian);
    setIsViewDialogOpen(true);
  };

  const handleViewCredentials = async (id: number) => {
    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.CUSTODIANS.VIEW_CREDENTIALS}/${id}/view-credentials?generate=true`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok && data.success && data.data?.credentials) {
        const creds = data.data.credentials;
        const custodian = custodians.find(c => c.id === id);
        // Log credentials to console for hostel admin
        console.log('═══════════════════════════════════════════════════════');
        console.log('🔐 CUSTODIAN CREDENTIALS (HOSTEL ADMIN VIEW)');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`Custodian: ${custodian?.name || data.data.custodian?.name || 'N/A'}`);
        console.log(`Email: ${custodian?.email || data.data.custodian?.email || 'N/A'}`);
        console.log('───────────────────────────────────────────────────────');
        console.log(`Username/Email: ${creds.username}`);
        console.log(`Password: ${creds.password}`);
        console.log(`Login URL: ${creds.loginUrl || 'N/A'}`);
        console.log('═══════════════════════════════════════════════════════');
        console.log('💡 These credentials are also displayed in the dialog');
        console.log('═══════════════════════════════════════════════════════');
        
        setCredentials(creds);
        setSelectedCustodian(custodian || null);
        setCredentialsDialogOpen(true);
      } else {
        alert(data.message || 'Failed to retrieve credentials');
      }
    } catch (err) {
      console.error('Error viewing credentials:', err);
      alert('Failed to retrieve credentials');
    }
  };

  const handleResendCredentials = async (id: number) => {
    if (!confirm('This will generate new credentials and send them via email. Continue?')) {
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.CUSTODIANS.RESEND_CREDENTIALS}/${id}/resend-credentials`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.data?.credentials) {
          const creds = data.data.credentials;
          const custodian = custodians.find(c => c.id === id);
          // Log credentials to console for hostel admin
          console.log('═══════════════════════════════════════════════════════');
          console.log('🔐 NEW CUSTODIAN CREDENTIALS (HOSTEL ADMIN VIEW)');
          console.log('═══════════════════════════════════════════════════════');
          console.log(`Custodian: ${custodian?.name || data.data.custodian?.name || 'N/A'}`);
          console.log(`Email: ${custodian?.email || data.data.custodian?.email || 'N/A'}`);
          console.log('───────────────────────────────────────────────────────');
          console.log(`Username/Email: ${creds.username}`);
          console.log(`Password: ${creds.password}`);
          console.log(`Login URL: ${creds.loginUrl || 'N/A'}`);
          console.log('═══════════════════════════════════════════════════════');
          console.log('💡 These credentials are also displayed in the dialog');
          console.log('═══════════════════════════════════════════════════════');
          
          // Show credentials in dialog
          setCredentials(creds);
          setSelectedCustodian(custodian || null);
          setCredentialsDialogOpen(true);
        } else {
          alert('Credentials sent successfully via email');
        }
      } else {
        alert(data.message || 'Failed to resend credentials');
      }
    } catch (err) {
      console.error('Error resending credentials:', err);
      alert('Failed to resend credentials');
    }
  };

  const handleAddCustodian = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.CUSTODIANS.CREATE, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAddDialogOpen(false);
        // Check if credentials are in the response
        if (data.data?.credentials) {
          const creds = data.data.credentials;
          // Log credentials to console for hostel admin
          console.log('═══════════════════════════════════════════════════════');
          console.log('🔐 CUSTODIAN CREDENTIALS (HOSTEL ADMIN VIEW)');
          console.log('═══════════════════════════════════════════════════════');
          console.log(`Custodian: ${data.data.custodian?.name || 'N/A'}`);
          console.log(`Email: ${data.data.custodian?.email || 'N/A'}`);
          console.log('───────────────────────────────────────────────────────');
          console.log(`Username/Email: ${creds.username}`);
          console.log(`Password: ${creds.password}`);
          console.log(`Login URL: ${creds.loginUrl || 'N/A'}`);
          console.log('═══════════════════════════════════════════════════════');
          console.log('💡 These are the ORIGINAL credentials sent to the custodian via email');
          console.log('═══════════════════════════════════════════════════════');
          
          setCredentials(creds);
          setSelectedCustodian({
            id: data.data.custodian?.id || 0,
            name: data.data.custodian?.name || formData.name,
            email: data.data.custodian?.email || formData.email,
            phone: formData.phone,
            location: formData.location,
            status: 'active',
            created_at: new Date().toISOString()
          });
          // Use setTimeout to ensure dialog renders after state updates
          setTimeout(() => {
            setCredentialsDialogOpen(true);
            console.log('🔓 Credentials dialog opened with ORIGINAL credentials');
          }, 100);
        } else {
          // If no credentials in response, log and show warning
          console.warn('⚠️ No credentials in response:', data);
          alert('Custodian created successfully, but credentials were not returned. Please use "View Credentials" to see them.');
        }
        setFormData({ name: '', email: '', phone: '', location: '' });
        fetchCustodians();
      } else {
        setError(data.message || 'Failed to add custodian');
      }
    } catch (err) {
      console.error('Error adding custodian:', err);
      setError('Failed to add custodian');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading && custodians.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading custodians...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Custodians</h1>
            <p className="text-gray-600 mt-2">Manage hostel custodians</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Custodian
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className="pt-6">
            {custodians.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No custodians found</p>
                <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Custodian
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {custodians.map((custodian) => (
                  <Card key={custodian.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Users className="h-6 w-6 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{custodian.name}</h3>
                            <Badge variant={getStatusColor(custodian.status)}>{custodian.status}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{custodian.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{custodian.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Location:</span>
                        <span className="text-gray-600">{custodian.location}</span>
                      </div>
                      <div className="flex gap-2 pt-4 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(custodian)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewCredentials(custodian.id)}
                          title="View credentials"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendCredentials(custodian.id)}
                          className="flex-1"
                        >
                          Resend
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Custodian Details</DialogTitle>
              <DialogDescription>
                Full information about {selectedCustodian?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedCustodian && (
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <p className="text-sm font-medium">{selectedCustodian.name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm font-medium">{selectedCustodian.email}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="text-sm font-medium">{selectedCustodian.phone}</p>
                </div>
                <div>
                  <Label>Location</Label>
                  <p className="text-sm font-medium">{selectedCustodian.location}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={getStatusColor(selectedCustodian.status)}>{selectedCustodian.status}</Badge>
                </div>
                <div>
                  <Label>Date Added</Label>
                  <p className="text-sm font-medium">
                    {new Date(selectedCustodian.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Custodian Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Custodian</DialogTitle>
              <DialogDescription>
                Create a new custodian account. Temporary login credentials will be sent via email.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCustodian} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., John Doe"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., john.doe@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g., +256 700 000 000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Block A, Room 101"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Custodian'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <CredentialsDialog
          open={credentialsDialogOpen}
          onOpenChange={setCredentialsDialogOpen}
          credentials={credentials}
          title="Custodian Login Credentials (Original)"
          description="These are the temporary credentials that were sent to the custodian via email. Please save them in case the email delivery fails."
          userName={selectedCustodian?.name}
          userEmail={selectedCustodian?.email}
        />
      </div>
    </Layout>
  );
}

