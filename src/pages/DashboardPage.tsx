import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { DashboardClock } from '@/components/DashboardClock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2,
  Users,
  GraduationCap,
  Bed,
  TrendingUp,
  AlertCircle,
  DollarSign,
  PiggyBank,
  CreditCard,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface PlatformStats {
  total_universities?: number;
  total_hostels: number;
  total_students: number;
  total_hostel_admins: number;
  total_university_admins?: number;
  total_rooms: number;
  available_rooms: number;
  occupied_rooms: number;
  overall_occupancy_rate: number;
}

interface GlobalPaymentHostel {
  hostel_id: number;
  hostel_name: string;
  totals: {
    collected: number;
    expected: number;
    outstanding: number;
  };
  current_semester: {
    semester_id: number;
    name: string;
    academic_year: string | null;
    collected: number;
    expected: number;
    outstanding: number;
  } | null;
}

interface GlobalPaymentsData {
  overall: {
    collected: number;
    expected: number;
    outstanding: number;
    current_collected: number;
    current_expected: number;
    current_outstanding: number;
  };
  hostels: GlobalPaymentHostel[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [globalPayments, setGlobalPayments] = useState<GlobalPaymentsData | null>(null);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlatformStats();
  }, []);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchGlobalPayments();
    } else {
      setGlobalPayments(null);
    }
  }, [user]);

  const fetchPlatformStats = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch(API_CONFIG.ENDPOINTS.ANALYTICS.PLATFORM_OVERVIEW, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch platform statistics');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Ensure numeric fields are properly converted
        const statsData = {
          ...data.data,
          total_hostels: Number(data.data.total_hostels) || 0,
          total_students: Number(data.data.total_students) || 0,
          total_universities: Number(data.data.total_universities) || 0,
          total_rooms: Number(data.data.total_rooms) || 0,
          available_rooms: Number(data.data.available_rooms) || 0,
          occupied_rooms: Number(data.data.occupied_rooms) || 0,
          overall_occupancy_rate: Number(data.data.overall_occupancy_rate) || 0,
          total_hostel_admins: Number(data.data.total_hostel_admins) || 0,
        };
        setStats(statsData);
      } else {
        throw new Error(data.message || 'Failed to load statistics');
      }
    } catch (err) {
      console.error('Error fetching platform stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

const fetchGlobalPayments = async () => {
    if (user?.role !== 'super_admin') {
      setGlobalPayments(null);
      return;
    }

    try {
      setIsGlobalLoading(true);
      setGlobalError(null);

      const response = await fetch(API_CONFIG.ENDPOINTS.PAYMENTS.GLOBAL_SUMMARY, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment summary');
      }

      const data = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.message || 'Unable to load payment summary');
      }

      const hostels: GlobalPaymentHostel[] = Array.isArray(data.data.hostels)
        ? data.data.hostels.map((hostel: any) => ({
            hostel_id: Number(hostel.hostel_id),
            hostel_name: hostel.hostel_name || 'Unnamed Hostel',
            totals: {
              collected: Number(hostel.totals?.collected ?? 0),
              expected: Number(hostel.totals?.expected ?? 0),
              outstanding: Number(hostel.totals?.outstanding ?? 0),
            },
            current_semester: hostel.current_semester
              ? {
                  semester_id: Number(hostel.current_semester.semester_id),
                  name: hostel.current_semester.name || 'Current Semester',
                  academic_year: hostel.current_semester.academic_year ?? null,
                  collected: Number(hostel.current_semester.collected ?? 0),
                  expected: Number(hostel.current_semester.expected ?? 0),
                  outstanding: Number(hostel.current_semester.outstanding ?? 0),
                }
              : null,
          }))
        : [];

      const overall = data.data.overall
        ? {
            collected: Number(data.data.overall.collected ?? 0),
            expected: Number(data.data.overall.expected ?? 0),
            outstanding: Number(data.data.overall.outstanding ?? 0),
            current_collected: Number(data.data.overall.current_collected ?? 0),
            current_expected: Number(data.data.overall.current_expected ?? 0),
            current_outstanding: Number(data.data.overall.current_outstanding ?? 0),
          }
        : {
            collected: 0,
            expected: 0,
            outstanding: 0,
            current_collected: 0,
            current_expected: 0,
            current_outstanding: 0,
          };

      setGlobalPayments({ overall, hostels });
    } catch (err) {
      console.error('Error fetching global payment summary:', err);
      setGlobalError(err instanceof Error ? err.message : 'Failed to load payment summary');
      setGlobalPayments(null);
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const topHostelChartData = useMemo(() => {
    const hostels = globalPayments?.hostels ?? [];
    return hostels
      .slice()
      .sort((a, b) => b.totals.collected - a.totals.collected)
      .slice(0, 6)
      .map((hostel) => ({
        hostel: hostel.hostel_name,
        collected: hostel.totals.collected,
      }));
  }, [globalPayments]);

  const topHostelList = useMemo(() => {
    const hostels = globalPayments?.hostels ?? [];
    const grandTotal = hostels.reduce((sum, h) => sum + h.totals.collected, 0);
    return hostels
      .slice()
      .sort((a, b) => b.totals.collected - a.totals.collected)
      .slice(0, 5)
      .map((hostel, index) => ({
        rank: index + 1,
        name: hostel.hostel_name,
        collected: hostel.totals.collected,
        share: grandTotal > 0 ? (hostel.totals.collected / grandTotal) * 100 : 0,
      }));
  }, [globalPayments]);

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

  // Helper function to get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', emoji: '🌅', icon: '☀️' };
    if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️', icon: '✨' };
    return { text: 'Good Evening', emoji: '🌙', icon: '⭐' };
  };

  const displayName = user?.username || user?.name || 'Admin';
  const greeting = getGreeting();

  const formatCurrency = (value: number) =>
    `UGX ${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  const totalCollected = globalPayments?.overall.collected ?? 0;
  const totalExpected = globalPayments?.overall.expected ?? 0;
  const totalOutstanding = globalPayments?.overall.outstanding ?? 0;
  const progressPercent =
    totalExpected > 0 ? Math.min(100, Math.max(0, (totalCollected / totalExpected) * 100)) : 0;

  return (
    <Layout>
      <div className="space-y-5 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Platform overview and statistics
            </p>
          </div>
          <DashboardClock className="self-start sm:self-end" />
        </div>

        {/* Welcome Message */}
        <Alert className="bg-primary/10 border-primary/20 text-primary shadow-sm backdrop-blur">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
          <AlertDescription className="text-inherit">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl flex-shrink-0">{greeting.emoji}</span>
              <div className="min-w-0 flex-1">
                <strong className="text-base sm:text-lg block">
                  {greeting.text}, {displayName}! {greeting.icon}
                </strong>
                <p className="text-xs sm:text-sm text-primary/80 mt-1">
                  👋 Welcome back to your dashboard! Here's what's happening today.
                </p>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {stats && (
          <div className="-mx-3 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 sm:mx-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5">
            {user?.role === 'super_admin' && (
              <>
                <Card className="min-w-[240px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent snap-start sm:min-w-0 xl:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold text-emerald-600 dark:text-emerald-300">
                      Total Collections
                    </CardTitle>
                    <DollarSign className="h-5 w-5 text-emerald-500 dark:text-emerald-300" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-300">
                      {formatCurrency(globalPayments?.overall.collected || 0)}
                    </div>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-200/70 mt-1">
                      All hostels combined
                    </p>
                  </CardContent>
                </Card>

                <Card className="min-w-[240px] border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent snap-start sm:min-w-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold text-sky-600 dark:text-sky-300">
                      Total Expected
                    </CardTitle>
                    <PiggyBank className="h-5 w-5 text-sky-500 dark:text-sky-300" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-sky-600 dark:text-sky-300">
                      {formatCurrency(globalPayments?.overall.expected || 0)}
                    </div>
                    <p className="text-xs text-sky-700/70 dark:text-sky-200/70 mt-1">Projected revenue</p>
                  </CardContent>
                </Card>

                <Card className="min-w-[240px] border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent snap-start sm:min-w-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold text-amber-600 dark:text-amber-300">
                      Outstanding
                    </CardTitle>
                    <CreditCard className="h-5 w-5 text-amber-500 dark:text-amber-300" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-600 dark:text-amber-300">
                      {formatCurrency(globalPayments?.overall.outstanding || 0)}
                    </div>
                    <p className="text-xs text-amber-700/70 dark:text-amber-200/70 mt-1">
                      Pending collections
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
            {/* Hostels Card */}
            <Card className="min-w-[220px] snap-start sm:min-w-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hostels</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_hostels || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Active hostels</p>
              </CardContent>
            </Card>

            {/* Students Card */}
            <Card className="min-w-[220px] snap-start sm:min-w-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_students || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Registered students</p>
              </CardContent>
            </Card>

            {/* Universities Card */}
            <Card className="min-w-[220px] snap-start sm:min-w-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Universities</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_universities || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Registered universities</p>
              </CardContent>
            </Card>

            {/* Total Rooms Card */}
            <Card className="min-w-[220px] snap-start sm:min-w-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
                <Bed className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_rooms || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">All hostels combined</p>
              </CardContent>
            </Card>

            {/* Available Rooms Card */}
            <Card className="min-w-[220px] snap-start sm:min-w-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
                <Bed className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.available_rooms || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Ready for occupancy</p>
              </CardContent>
            </Card>

            {/* Occupied Rooms Card */}
            <Card className="min-w-[220px] snap-start sm:min-w-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupied Rooms</CardTitle>
                <Bed className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.occupied_rooms || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Currently occupied</p>
              </CardContent>
            </Card>

            {/* Occupancy Rate Card */}
            <Card className="min-w-[220px] snap-start sm:min-w-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.overall_occupancy_rate != null 
                    ? Number(stats.overall_occupancy_rate).toFixed(1) 
                    : '0.0'}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Platform-wide</p>
              </CardContent>
            </Card>

            {/* Admins Card */}
            <Card className="min-w-[220px] snap-start sm:min-w-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hostel Admins</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_hostel_admins || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Active administrators</p>
              </CardContent>
            </Card>
          </div>
        )}

        {user?.role === 'super_admin' && (
          <div className="space-y-6">
            {globalError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{globalError}</AlertDescription>
              </Alert>
            ) : null}

            <Card className="border border-emerald-500/20 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Collections Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isGlobalLoading && !globalPayments ? (
                  <p className="text-sm text-muted-foreground">Loading financial snapshot...</p>
                ) : globalPayments ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Collected</p>
                        <p className="text-base font-semibold text-emerald-600 dark:text-emerald-300">
                          {formatCurrency(totalCollected)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Expected</p>
                        <p className="text-base font-semibold text-sky-600 dark:text-sky-300">
                          {formatCurrency(totalExpected)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Outstanding</p>
                        <p className="text-base font-semibold text-amber-600 dark:text-amber-300">
                          {formatCurrency(totalOutstanding)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Collection rate</span>
                        <span>{progressPercent.toFixed(1)}%</span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No collection data available yet.</p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-col gap-1">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Top Hostels by Collections
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Ranked by total amount received to date.
                  </p>
                </CardHeader>
                <CardContent className="h-72">
                  {topHostelChartData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topHostelChartData} margin={{ left: 0, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="hostel" tick={{ fontSize: 11 }} />
                        <YAxis
                          tickFormatter={(value: number) =>
                            value >= 1_000_000
                              ? `${(value / 1_000_000).toFixed(1)}M`
                              : `${(value / 1_000).toFixed(0)}k`
                          }
                        />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="collected" fill="#16a34a" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      {isGlobalLoading ? 'Loading collection insights...' : 'No collection data yet.'}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Leading Contributors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topHostelList.length ? (
                    topHostelList.map((hostel) => (
                      <div
                        key={hostel.rank}
                        className="rounded-lg border border-border bg-card/80 p-3 shadow-sm backdrop-blur"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                              #{hostel.rank}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {hostel.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {hostel.share.toFixed(1)}% of total collections
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                            {formatCurrency(hostel.collected)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {isGlobalLoading ? 'Loading leading contributors...' : 'No hostels to display yet.'}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {!stats && !isLoading && !error && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No data available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

