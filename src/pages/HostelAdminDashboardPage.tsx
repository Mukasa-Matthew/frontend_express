import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { DashboardClock } from '@/components/DashboardClock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Bed, TrendingUp, AlertCircle, AlertTriangle, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SemesterSelector } from '@/components/SemesterSelector';
import SemesterPaymentsSection, {
  SemesterPaymentsData,
  SemesterPaymentSummary,
} from '@/components/payments/SemesterPaymentsSection';

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
  const navigate = useNavigate();
  const [stats, setStats] = useState<HostelStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [financialOverview, setFinancialOverview] = useState<{ total_collected: number; total_outstanding: number }>({
    total_collected: 0,
    total_outstanding: 0,
  });
  const [isFinancialLoading, setIsFinancialLoading] = useState(true);
  const [paymentsData, setPaymentsData] = useState<SemesterPaymentsData>({
    current: null,
    history: [],
  });
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [publicDetails, setPublicDetails] = useState<{
    booking_fee: number | null;
    price_per_room: number | null;
    is_published: boolean;
  } | null>(null);
  const [isPublicDetailsLoading, setIsPublicDetailsLoading] = useState(true);
  const [publicDetailsError, setPublicDetailsError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.hostel_id) {
      fetchHostelStats();
      fetchFinancialOverview();
      fetchSemesterPaymentHistory();
      fetchPublicDetails();
    } else {
      setError('No hostel assigned');
      setIsLoading(false);
      setIsFinancialLoading(false);
      setIsPaymentsLoading(false);
      setIsPublicDetailsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.hostel_id) {
      fetchFinancialOverview();
    }
  }, [user?.hostel_id, selectedSemesterId]);

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

  const fetchPublicDetails = async () => {
    if (!user?.hostel_id) return;

    try {
      setIsPublicDetailsLoading(true);
      setPublicDetailsError(null);

      const response = await fetch(`${API_CONFIG.ENDPOINTS.HOSTELS.GET}/${user.hostel_id}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch hostel public details');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setPublicDetails({
          booking_fee: data.data.booking_fee ?? null,
          price_per_room: data.data.price_per_room ?? null,
          is_published: Boolean(data.data.is_published),
        });
      } else {
        throw new Error(data.message || 'Failed to load hostel public details');
      }
    } catch (err) {
      console.error('Error fetching hostel public details:', err);
      setPublicDetails(null);
      setPublicDetailsError(err instanceof Error ? err.message : 'Failed to load public details');
    } finally {
      setIsPublicDetailsLoading(false);
    }
  };

  const handleManagePublicDetails = () => {
    if (!user?.hostel_id) return;
    navigate(`/hostels/${user.hostel_id}#public-booking-fee`);
  };

  const formatCurrency = (value: number) =>
    `UGX ${Number(value || 0).toLocaleString('en-US', {
      maximumFractionDigits: 0,
    })}`;

  const fetchFinancialOverview = async () => {
    if (!user?.hostel_id) return;

    try {
      setIsFinancialLoading(true);
      const semesterQuery = selectedSemesterId ? `?semester_id=${selectedSemesterId}` : '';
      const response = await fetch(`${API_CONFIG.ENDPOINTS.PAYMENTS.SUMMARY}${semesterQuery}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment overview');
      }

      const data = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.message || 'Unable to load payment overview');
      }

      setFinancialOverview({
        total_collected: Number(data.data.total_collected ?? 0),
        total_outstanding: Number(data.data.total_outstanding ?? 0),
      });
    } catch (err) {
      console.error('Error fetching financial overview:', err);
      setFinancialOverview({
        total_collected: 0,
        total_outstanding: 0,
      });
    } finally {
      setIsFinancialLoading(false);
    }
  };

  const normalizeSummary = (summary: any): SemesterPaymentSummary => ({
    semester_id: summary?.semester_id ?? null,
    name: summary?.name ?? null,
    academic_year: summary?.academic_year ?? null,
    start_date: summary?.start_date ?? null,
    end_date: summary?.end_date ?? null,
    is_current: Boolean(summary?.is_current),
    total_collected: Number(summary?.total_collected ?? 0),
    total_expected: Number(summary?.total_expected ?? 0),
    outstanding: Number(summary?.outstanding ?? 0),
  });

  const fetchSemesterPaymentHistory = async () => {
    if (!user?.hostel_id) return;

    try {
      setIsPaymentsLoading(true);
      setPaymentsError(null);

      const response = await fetch(API_CONFIG.ENDPOINTS.PAYMENTS.SEMESTER_SUMMARY, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch semester payment history');
      }

      const data = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.message || 'Unable to load semester payment history');
      }

      const current = data.data.current ? normalizeSummary(data.data.current) : null;
      const history = Array.isArray(data.data.history)
        ? data.data.history.map(normalizeSummary)
        : [];

      setPaymentsData({
        current,
        history,
      });
    } catch (err) {
      console.error('Error fetching semester payments:', err);
      setPaymentsError(err instanceof Error ? err.message : 'Failed to load payment history');
      setPaymentsData({
        current: null,
        history: [],
      });
    } finally {
      setIsPaymentsLoading(false);
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
  const bookingFeeMissing =
    !isPublicDetailsLoading && (!publicDetails || publicDetails.booking_fee === null);

  return (
    <Layout>
      <div className="space-y-6 sm:space-y-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Hostel Dashboard</h1>
            {stats?.hostel_name ? (
              <div className="flex flex-wrap items-center gap-1.5 text-sm md:text-base text-muted-foreground">
                <span>Admin ·</span>
                <span className="font-semibold text-primary">{stats.hostel_name}</span>
                {stats.university_name && (
                  <span className="text-muted-foreground">({stats.university_name})</span>
                )}
              </div>
            ) : (
              <p className="text-sm md:text-base text-muted-foreground">
                Overview of your hostel operations
              </p>
            )}
          </div>
          <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:gap-4">
            {user?.hostel_id && (
              <SemesterSelector
                hostelId={user.hostel_id}
                onSemesterChange={setSelectedSemesterId}
              />
            )}
            <DashboardClock className="md:ml-auto" />
          </div>
        </div>

        {/* Welcome Message with Hostel Assignment */}
        <Alert className="bg-primary/10 border-primary/15 text-primary">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">
            <div className="flex flex-col gap-2">
              <div>
                <strong>
                  {greeting.emoji} {greeting.text}, {displayName}!
                </strong>{' '}
                Welcome back to your dashboard.
              </div>
              {stats?.hostel_name && (
                <div className="mt-2 pt-2 border-t border-primary/20">
                  <p className="text-sm font-semibold text-primary">
                    🏠 Assigned Hostel: <span className="text-primary/80">{stats.hostel_name}</span>
                    {stats.university_name && (
                      <span className="text-primary/70"> - {stats.university_name}</span>
                    )}
                  </p>
                </div>
              )}
            </div>
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

        <Card
          className={`${
            bookingFeeMissing
              ? 'border-red-200 bg-red-50 dark:border-red-400/40 dark:bg-red-950/40'
              : 'border-primary/20 bg-primary/5 dark:border-primary/25 dark:bg-primary/10'
          }`}
        >
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-primary">
                <CreditCard className="h-5 w-5" />
                Public Booking Fee
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Students see this amount before paying the public booking fee.
              </p>
            </div>
            <Button
              variant={bookingFeeMissing ? 'destructive' : 'outline'}
              onClick={handleManagePublicDetails}
              disabled={!user?.hostel_id}
            >
              Manage Booking Fee
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Current booking fee
              </p>
              {isPublicDetailsLoading ? (
                <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
              ) : (
                <>
                  <p className="mt-1 text-2xl font-semibold text-primary">
                    {publicDetails?.booking_fee !== null && publicDetails?.booking_fee !== undefined
                      ? formatCurrency(publicDetails.booking_fee)
                      : 'Not set'}
                  </p>
                  {bookingFeeMissing && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Set this so students know how much to pay upfront when booking.
                    </p>
                  )}
                </>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Price per semester
              </p>
              {isPublicDetailsLoading ? (
                <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
              ) : (
                <p className="mt-1 text-lg font-medium">
                  {publicDetails?.price_per_room !== null && publicDetails?.price_per_room !== undefined
                    ? formatCurrency(publicDetails.price_per_room)
                    : 'Not set'}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Public profile status
              </p>
              {isPublicDetailsLoading ? (
                <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
              ) : (
                <p
                  className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                    publicDetails?.is_published
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                  }`}
                >
                  {publicDetails?.is_published ? 'Visible to students' : 'Hidden from students'}
                </p>
              )}
              {publicDetailsError && !isPublicDetailsLoading && (
                <p className="mt-2 text-xs text-destructive">{publicDetailsError}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {stats && (
          <div className="-mx-3 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 md:mx-0 md:grid md:grid-cols-2 xl:grid-cols-4 md:gap-6">
            <Card className="min-w-[240px] border-2 border-green-100 bg-gradient-to-br from-green-50 to-white snap-start md:min-w-0 md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold text-green-900">Total Collected</CardTitle>
                <CreditCard className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700">
                  {formatCurrency(financialOverview.total_collected)}
                </div>
                <p className="text-xs text-green-700/70 mt-1">Money received for this hostel</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold text-amber-900">Outstanding</CardTitle>
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-700">
                  {formatCurrency(financialOverview.total_outstanding)}
                </div>
                <p className="text-xs text-amber-700/70 mt-1">Pending collections</p>
              </CardContent>
            </Card>

            {/* Students Card */}
            <Card className="min-w-[220px] snap-start md:min-w-0">
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
            <Card className="min-w-[220px] snap-start md:min-w-0">
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
            <Card className="min-w-[220px] snap-start md:min-w-0">
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
            <Card className="min-w-[220px] snap-start md:min-w-0">
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
            <Card className="min-w-[220px] snap-start md:min-w-0">
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
            <Card className="min-w-[220px] snap-start md:min-w-0">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isFinancialLoading
                  ? 'Loading...'
                  : formatCurrency(financialOverview.total_collected)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedSemesterId
                  ? 'Selected semester collections'
                  : 'Current semester collections'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {isFinancialLoading
                  ? 'Loading...'
                  : formatCurrency(financialOverview.total_outstanding)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Amount pending from students for this selection
              </p>
            </CardContent>
          </Card>
        </div>

        <SemesterPaymentsSection
          title="Semester Collections Detail"
          description="Detailed breakdown of expected, collected, and outstanding amounts by semester."
          data={paymentsData}
          loading={isPaymentsLoading}
          error={paymentsError}
        />

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

