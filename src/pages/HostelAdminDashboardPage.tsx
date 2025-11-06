import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Bed, TrendingUp, AlertCircle, AlertTriangle, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SemesterSelector } from '@/components/SemesterSelector';

interface HostelStats {
  hostel_name: string;
  address: string;
  university_name: string;
  total_students: number;
  total_rooms: number;
  available_rooms: number;
  occupied_rooms: number;
  occupancy_rate: number;
  status: string;
  subscription_status?: string;
  subscription_end_date?: string;
  plan_name?: string;
  days_until_expiry?: number;
}

export default function HostelAdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<HostelStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.hostel_id) {
      fetchHostelStats();
    } else {
      setError('No hostel assigned');
      setIsLoading(false);
    }
  }, [user]);

  const fetchHostelStats = async () => {
    if (!user?.hostel_id) return;

    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/multi-tenant/hostel/${user.hostel_id}/overview`,
        {
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch hostel statistics');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const statsData = {
          ...data.data,
          total_students: Number(data.data.total_students) || 0,
          total_rooms: Number(data.data.total_rooms) || 0,
          available_rooms: Number(data.data.available_rooms) || 0,
          occupied_rooms: Number(data.data.occupied_rooms) || 0,
          occupancy_rate: Number(data.data.occupancy_rate) || 0,
          days_until_expiry: data.data.days_until_expiry !== null ? Math.ceil(Number(data.data.days_until_expiry)) : null,
        };
        setStats(statsData);
      } else {
        throw new Error(data.message || 'Failed to load statistics');
      }
    } catch (err) {
      console.error('Error fetching hostel stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  // Calculate subscription warning level
  const getSubscriptionWarningLevel = () => {
    if (!stats?.days_until_expiry || stats.days_until_expiry < 0) {
      return 'expired';
    }
    if (stats.days_until_expiry <= 7) {
      return 'critical';
    }
    if (stats.days_until_expiry <= 30) {
      return 'warning';
    }
    return null;
  };

  const warningLevel = getSubscriptionWarningLevel();

  // Helper function to get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', emoji: '🌅' };
    if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️' };
    return { text: 'Good Evening', emoji: '🌙' };
  };

  const displayName = user?.username || user?.name || 'Admin';
  const greeting = getGreeting();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hostel Dashboard</h1>
            {stats && (
              <p className="text-gray-600 mt-2">
                {stats.hostel_name}
                {stats.university_name && ` - ${stats.university_name}`}
              </p>
            )}
          </div>
          {user?.hostel_id && <SemesterSelector hostelId={user.hostel_id} />}
        </div>

        {/* Welcome Message */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>{greeting.emoji} {greeting.text}, {displayName}!</strong> Welcome back to your dashboard.
          </AlertDescription>
        </Alert>

        {/* Subscription Status Alert */}
        {stats && warningLevel && (
          <Alert 
            variant={warningLevel === 'expired' || warningLevel === 'critical' ? 'destructive' : 'default'}
            className={warningLevel === 'warning' ? 'border-yellow-500 bg-yellow-50' : ''}
          >
            {warningLevel === 'expired' ? (
              <>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-semibold">
                  ⚠️ Subscription Expired! Your account access has been restricted. Please contact Super Admin to renew immediately.
                </AlertDescription>
              </>
            ) : warningLevel === 'critical' ? (
              <>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="font-semibold">
                  ⏰ Subscription Expiring Soon! Only <strong>{Math.ceil(stats.days_until_expiry || 0)} day{stats.days_until_expiry === 1 ? '' : 's'}</strong> remaining. Please contact Super Admin to renew.
                </AlertDescription>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  ⏰ Subscription Expiring in <strong>{Math.ceil(stats.days_until_expiry || 0)} days</strong>. Please contact Super Admin to renew.
                </AlertDescription>
              </>
            )}
          </Alert>
        )}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Students Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_students}</div>
                <p className="text-xs text-muted-foreground mt-1">Registered students</p>
              </CardContent>
            </Card>

            {/* Total Rooms Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
                <Bed className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_rooms}</div>
                <p className="text-xs text-muted-foreground mt-1">All rooms</p>
              </CardContent>
            </Card>

            {/* Available Rooms Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
                <Bed className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.available_rooms}</div>
                <p className="text-xs text-muted-foreground mt-1">Ready for occupancy</p>
              </CardContent>
            </Card>

            {/* Occupied Rooms Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupied Rooms</CardTitle>
                <Bed className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.occupied_rooms}</div>
                <p className="text-xs text-muted-foreground mt-1">Currently occupied</p>
              </CardContent>
            </Card>

            {/* Occupancy Rate Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.occupancy_rate != null 
                    ? Number(stats.occupancy_rate).toFixed(1) 
                    : '0.0'}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Current occupancy</p>
              </CardContent>
            </Card>

            {/* Subscription Status Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscription</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.plan_name || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.days_until_expiry !== null && stats.days_until_expiry !== undefined && stats.days_until_expiry >= 0 
                    ? `${Math.ceil(stats.days_until_expiry)} days left`
                    : stats.days_until_expiry !== null && stats.days_until_expiry !== undefined
                      ? 'Expired'
                      : 'No subscription'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {!stats && !isLoading && !error && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No data available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

