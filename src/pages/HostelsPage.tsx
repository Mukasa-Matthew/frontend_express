import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { Building2, Plus, Search, Eye, Trash2, AlertCircle, Clock, Key, Power, CalendarPlus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CredentialsDialog } from '@/components/CredentialsDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Hostel {
  id: number;
  name: string;
  address: string;
  status: string;
  total_rooms: number;
  available_rooms: number;
  students_count: number;
  admin: { name: string; email: string } | null;
  subscription: {
    id: number;
    plan_name: string;
    status: string;
    end_date: string;
    days_until_expiry: number | null;
  } | null;
  created_at: string;
}

export default function HostelsPage() {
  const navigate = useNavigate();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [credentials, setCredentials] = useState<{ username: string; password: string; loginUrl?: string } | null>(null);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState<{ id: number; name: string; admin?: { name: string; email: string } } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hostelToDelete, setHostelToDelete] = useState<Hostel | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Calculate subscription statistics
  const subscriptionStats = {
    total: hostels.filter(h => h.subscription).length,
    expiringSoon: hostels.filter(h => h.subscription && h.subscription.days_until_expiry !== null && h.subscription.days_until_expiry <= 30 && h.subscription.days_until_expiry >= 0).length,
    expired: hostels.filter(h => h.subscription && h.subscription.days_until_expiry !== null && h.subscription.days_until_expiry < 0).length,
    active: hostels.filter(h => h.subscription && h.subscription.status === 'active').length,
  };

  useEffect(() => {
    fetchHostels();
  }, [page, search]);

  const fetchHostels = async () => {
    try {
      setIsLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`${API_CONFIG.ENDPOINTS.HOSTELS.LIST}?${params}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch hostels');
      }

      const data = await response.json();

      if (data.success) {
        setHostels(data.data || []);
        setTotal(data.total || 0);
      } else {
        throw new Error(data.message || 'Failed to load hostels');
      }
    } catch (err) {
      console.error('Error fetching hostels:', err);
      setError(err instanceof Error ? err.message : 'Failed to load hostels');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeleteLoading(true);
      const response = await fetch(`${API_CONFIG.ENDPOINTS.HOSTELS.DELETE}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok && data.success) {
        fetchHostels();
        setDeleteDialogOpen(false);
        setHostelToDelete(null);
      } else {
        alert(data.message || 'Failed to delete hostel');
      }
    } catch (err) {
      console.error('Error deleting hostel:', err);
      alert('Failed to delete hostel');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStartDelete = (hostel: Hostel) => {
    setHostelToDelete(hostel);
    setDeleteDialogOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHostels();
  };

  const handleToggleStatus = async (hostel: Hostel) => {
    const nextStatus = hostel.status === 'active' ? 'inactive' : 'active';
    const confirmationMessage =
      nextStatus === 'inactive'
        ? 'Deactivating will immediately block admins and custodians from logging in. Continue?'
        : 'Activate this hostel account now?';

    if (!confirm(confirmationMessage)) {
      return;
    }

    try {
      setActionLoadingId(hostel.id);
      const response = await fetch(`${API_CONFIG.ENDPOINTS.HOSTELS.STATUS}/${hostel.id}/status`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.message || 'Failed to update hostel status');
        return;
      }
      fetchHostels();
    } catch (err) {
      console.error('Error updating hostel status:', err);
      alert('Failed to update hostel status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExtendSubscription = async (hostel: Hostel) => {
    if (!hostel.subscription) {
      alert('This hostel does not have an active subscription to extend.');
      return;
    }

    const input = prompt(
      'Enter new end date (YYYY-MM-DD) or number of extra days prefixed with + (e.g. +30):',
      ''
    );

    if (!input) {
      return;
    }

    const trimmed = input.trim();
    const payload: Record<string, any> = {};

    if (trimmed.startsWith('+')) {
      const days = parseInt(trimmed.replace('+', ''), 10);
      if (Number.isNaN(days) || days <= 0) {
        alert('Enter a positive number of days, e.g. +30');
        return;
      }
      payload.additional_days = days;
    } else {
      payload.new_end_date = trimmed;
    }

    try {
      setActionLoadingId(hostel.id);
      const response = await fetch(
        `${API_CONFIG.ENDPOINTS.HOSTELS.EXTEND_SUBSCRIPTION}/${hostel.id}/subscription/extend`,
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.message || 'Failed to extend subscription');
        return;
      }

      alert('Subscription extended successfully');
      fetchHostels();
    } catch (err) {
      console.error('Error extending subscription:', err);
      alert('Failed to extend subscription');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleViewCredentials = async (hostelId: number) => {
    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.HOSTELS.VIEW_CREDENTIALS}/${hostelId}/view-credentials?generate=true`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok && data.success && data.data?.credentials) {
        const creds = data.data.credentials;
        // Log credentials to console for super admin
        console.log('═══════════════════════════════════════════════════════');
        console.log('🔐 HOSTEL ADMIN CREDENTIALS (SUPER ADMIN VIEW)');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`Hostel: ${data.data.hostel.name}`);
        console.log(`Admin: ${data.data.admin.name}`);
        console.log(`Email: ${data.data.admin.email}`);
        console.log('───────────────────────────────────────────────────────');
        console.log(`Username/Email: ${creds.username}`);
        console.log(`Password: ${creds.password}`);
        console.log(`Login URL: ${creds.loginUrl || 'N/A'}`);
        console.log('═══════════════════════════════════════════════════════');
        console.log('💡 These credentials are also displayed in the dialog');
        console.log('═══════════════════════════════════════════════════════');
        
        setCredentials(creds);
        setSelectedHostel({
          id: data.data.hostel.id,
          name: data.data.hostel.name,
          admin: {
            name: data.data.admin.name,
            email: data.data.admin.email
          }
        });
        setCredentialsDialogOpen(true);
      } else {
        alert(data.message || 'Failed to retrieve credentials');
      }
    } catch (err) {
      console.error('Error viewing credentials:', err);
      alert('Failed to retrieve credentials');
    }
  };

  const handleResendCredentials = async (hostelId: number) => {
    if (!confirm('This will generate new credentials and send them via email. Continue?')) {
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.HOSTELS.RESEND_ADMIN_CREDENTIALS}/${hostelId}/resend-credentials`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.data?.credentials) {
          const creds = data.data.credentials;
          // Log credentials to console for super admin
          console.log('═══════════════════════════════════════════════════════');
          console.log('🔐 NEW HOSTEL ADMIN CREDENTIALS (SUPER ADMIN VIEW)');
          console.log('═══════════════════════════════════════════════════════');
          console.log(`Hostel: ${data.data.hostel.name}`);
          console.log(`Admin: ${data.data.admin.name}`);
          console.log(`Email: ${data.data.admin.email}`);
          console.log('───────────────────────────────────────────────────────');
          console.log(`Username/Email: ${creds.username}`);
          console.log(`Password: ${creds.password}`);
          console.log(`Login URL: ${creds.loginUrl || 'N/A'}`);
          console.log('═══════════════════════════════════════════════════════');
          console.log('💡 These credentials are also displayed in the dialog');
          console.log('═══════════════════════════════════════════════════════');
          
          // Show credentials in dialog
          setCredentials(creds);
          setSelectedHostel({
            id: data.data.hostel.id,
            name: data.data.hostel.name,
            admin: {
              name: data.data.admin.name,
              email: data.data.admin.email
            }
          });
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Hostels</h1>
            <p className="text-gray-600 mt-2">
              View and manage all hostels. Click "View" on any hostel to upload images, set location, and publish to the public website.
            </p>
          </div>
          <Button onClick={() => navigate('/hostels/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Hostel
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Subscription Summary */}
        {hostels.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Total Subscriptions</p>
                    <p className="text-2xl font-bold text-blue-600">{subscriptionStats.total}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">Active</p>
                    <p className="text-2xl font-bold text-green-600">{subscriptionStats.active}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-900">Expiring Soon</p>
                    <p className="text-2xl font-bold text-orange-600">{subscriptionStats.expiringSoon}</p>
                    <p className="text-xs text-orange-700">Within 30 days</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-900">Expired</p>
                    <p className="text-2xl font-bold text-red-600">{subscriptionStats.expired}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search hostels by name, address, or admin email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
          {search && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </form>

        {/* Hostels List */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading hostels...</p>
            </div>
          </div>
        ) : hostels.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hostels found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hostels.map((hostel) => (
              <Card key={hostel.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{hostel.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{hostel.address}</p>
                    </div>
                    <Badge variant={hostel.status === 'active' ? 'default' : 'secondary'}>
                      {hostel.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Rooms:</span>{' '}
                      <span className="font-medium">{hostel.total_rooms}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Available:</span>{' '}
                      <span className="font-medium text-green-600">{hostel.available_rooms}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Students:</span>{' '}
                      <span className="font-medium">{hostel.students_count || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Occupied:</span>{' '}
                      <span className="font-medium text-blue-600">
                        {hostel.total_rooms - hostel.available_rooms}
                      </span>
                    </div>
                  </div>

                  {hostel.admin && (
                    <div className="pt-2 border-t text-sm">
                      <span className="text-gray-600">Admin:</span>{' '}
                      <span className="font-medium">{hostel.admin.name}</span>
                      <br />
                      <span className="text-xs text-gray-500">{hostel.admin.email}</span>
                    </div>
                  )}

                  {hostel.subscription && (
                    <div className="pt-2 border-t text-sm">
                      <span className="text-gray-600">Plan:</span>{' '}
                      <Badge variant="outline" className="ml-1">
                        {hostel.subscription.plan_name}
                      </Badge>
                      <br />
                      <span className="text-xs text-gray-500">
                        Status: {hostel.subscription.status}
                      </span>
                      {hostel.subscription.days_until_expiry !== null && (
                        <div className="mt-2 flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          <span className={`font-semibold ${
                            hostel.subscription.days_until_expiry < 0 
                              ? 'text-red-600' 
                              : hostel.subscription.days_until_expiry <= 7 
                                ? 'text-orange-600' 
                                : hostel.subscription.days_until_expiry <= 30 
                                  ? 'text-yellow-600' 
                                  : 'text-green-600'
                          }`}>
                            {hostel.subscription.days_until_expiry < 0
                              ? `Expired ${Math.abs(hostel.subscription.days_until_expiry)} days ago`
                              : hostel.subscription.days_until_expiry === 0
                                ? 'Expires today'
                                : `${hostel.subscription.days_until_expiry} days left`
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/hostels/${hostel.id}`)}
                      title="View and manage hostel details, upload images, set location, and publish"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewCredentials(hostel.id)}
                      title="View admin credentials"
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendCredentials(hostel.id)}
                      title="Resend credentials via email"
                    >
                      Resend
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExtendSubscription(hostel)}
                      disabled={actionLoadingId === hostel.id}
                      title="Extend current subscription end date"
                    >
                      <CalendarPlus className="h-4 w-4 mr-1" />
                      Extend
                    </Button>
                    <Button
                      variant={hostel.status === 'active' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleStatus(hostel)}
                      disabled={actionLoadingId === hostel.id}
                      title={hostel.status === 'active' ? 'Deactivate hostel' : 'Activate hostel'}
                    >
                      <Power className="h-4 w-4 mr-1" />
                      {hostel.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartDelete(hostel)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} hostels
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <CredentialsDialog
        open={credentialsDialogOpen}
        onOpenChange={setCredentialsDialogOpen}
        credentials={credentials}
        title="Hostel Admin Credentials"
        description="Please save these credentials. You can copy them to share with the admin."
        userName={selectedHostel?.admin?.name}
        userEmail={selectedHostel?.admin?.email}
      />

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setHostelToDelete(null);
            setDeleteLoading(false);
          }
          setDeleteDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete hostel?</DialogTitle>
            <DialogDescription>
              This will permanently remove {hostelToDelete?.name ?? 'this hostel'} and every associated record (custodians, admins,
              subscriptions, bookings, payments, expenses, audit history). This action cannot be undone. Confirm to proceed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => hostelToDelete && handleDelete(hostelToDelete.id)}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting…' : 'Confirm delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

