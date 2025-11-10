import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { Building2, GraduationCap, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PlatformStats {
  total_universities?: number;
  total_hostels: number;
  total_students: number;
  total_hostel_admins: number;
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

const PIE_COLORS = [
  '#16a34a',
  '#2563eb',
  '#f59e0b',
  '#7c3aed',
  '#0ea5e9',
  '#ef4444',
  '#14b8a6',
  '#f97316',
];

const OCCUPANCY_COLORS = ['#2563eb', '#e5e7eb'];

const formatCurrency = (value: number) =>
  `UGX ${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

export default function AnalyticsPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [globalPayments, setGlobalPayments] = useState<GlobalPaymentsData | null>(null);
  const [isFinancialLoading, setIsFinancialLoading] = useState(true);
  const [financialError, setFinancialError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchFinancials();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(API_CONFIG.ENDPOINTS.ANALYTICS.PLATFORM_OVERVIEW, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics overview');
      }

      const data = await response.json();

      if (data.success && data.data) {
        const statsData: PlatformStats = {
          total_universities: Number(data.data.total_universities) || 0,
          total_hostels: Number(data.data.total_hostels) || 0,
          total_students: Number(data.data.total_students) || 0,
          total_hostel_admins: Number(data.data.total_hostel_admins) || 0,
          total_rooms: Number(data.data.total_rooms) || 0,
          available_rooms: Number(data.data.available_rooms) || 0,
          occupied_rooms: Number(data.data.occupied_rooms) || 0,
          overall_occupancy_rate: Number(data.data.overall_occupancy_rate) || 0,
        };
        setStats(statsData);
      } else {
        throw new Error(data.message || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics overview:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFinancials = async () => {
    try {
      setIsFinancialLoading(true);
      setFinancialError(null);

      const response = await fetch(API_CONFIG.ENDPOINTS.PAYMENTS.GLOBAL_SUMMARY, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch collections summary');
      }

      const data = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.message || 'Unable to load collections summary');
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
      console.error('Error fetching collections summary:', err);
      setFinancialError(err instanceof Error ? err.message : 'Failed to load collections summary');
      setGlobalPayments(null);
    } finally {
      setIsFinancialLoading(false);
    }
  };

  const totalCollected = globalPayments?.overall.collected ?? 0;

  const collectionShareData = useMemo(() => {
    const hostels = globalPayments?.hostels ?? [];
    if (!hostels.length) return [];
    return hostels
      .slice()
      .sort((a, b) => b.totals.collected - a.totals.collected)
      .map((hostel) => ({
        name: hostel.hostel_name,
        value: hostel.totals.collected,
      }));
  }, [globalPayments]);

  const hasCollectionData = useMemo(
    () => collectionShareData.some((entry) => entry.value > 0),
    [collectionShareData],
  );

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

  const occupancyData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Occupied Rooms', value: stats.occupied_rooms },
      { name: 'Available Rooms', value: stats.available_rooms },
    ];
  }, [stats]);

  const capacityComparisonData = useMemo(() => {
    if (!stats) return [];
    return [
      { category: 'Students', value: stats.total_students },
      { category: 'Rooms', value: stats.total_rooms },
      { category: 'Occupied', value: stats.occupied_rooms },
      { category: 'Available', value: stats.available_rooms },
    ];
  }, [stats]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
            <p className="text-gray-600">Loading analytics...</p>
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">
            Platform-wide intelligence across occupancy, finance, and growth metrics.
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <Card className="border-l-4 border-indigo-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-indigo-900">
                  Universities
                </CardTitle>
                <GraduationCap className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-900">
                  {stats.total_universities || 0}
                </div>
                <p className="text-xs text-indigo-600 mt-1">Active partner institutions</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-emerald-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-900">
                  Total Collections
                </CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-900">
                  {formatCurrency(totalCollected)}
                </div>
                <p className="text-xs text-emerald-600 mt-1">
                  Across every hostel wallet
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-slate-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-900">
                  Total Hostels
                </CardTitle>
                <Building2 className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stats.total_hostels}</div>
                <p className="text-xs text-slate-500 mt-1">Active on the platform</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-900">
                  Occupancy Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">
                  {stats.overall_occupancy_rate != null
                    ? Number(stats.overall_occupancy_rate).toFixed(1)
                    : '0.0'}
                  %
                </div>
                <p className="text-xs text-blue-600 mt-1">Platform-wide utilisation</p>
              </CardContent>
            </Card>
          </div>
        )}

        {(financialError || isFinancialLoading) && (
          <Alert variant={financialError ? 'destructive' : 'default'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {financialError
                ? financialError
                : 'Refreshing live collections data...'}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Collections Contribution by Hostel
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {collectionShareData.length && hasCollectionData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={collectionShareData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {collectionShareData.map((_, index) => (
                        <Cell
                          key={`slice-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  {isFinancialLoading
                    ? 'Loading collection insights...'
                    : collectionShareData.length
                      ? 'Collections exist, but every hostel is still at UGX 0. Record payments to unlock contribution insights.'
                      : 'No collection data yet.'}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Occupancy Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {occupancyData.length ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={occupancyData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {occupancyData.map((entry, index) => (
                          <Cell
                            key={`occupancy-${entry.name}`}
                            fill={OCCUPANCY_COLORS[index % OCCUPANCY_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                  No occupancy data yet.
                </div>
              )}
              {stats && (
                <div className="mt-6 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Occupied rooms</span>
                    <span className="font-semibold text-slate-900">
                      {stats.occupied_rooms.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Available rooms</span>
                    <span className="font-semibold text-slate-900">
                      {stats.available_rooms.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total rooms</span>
                    <span className="font-semibold text-slate-900">
                      {stats.total_rooms.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Top Performing Hostels
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {topHostelChartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topHostelChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="hostel" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="collected" fill="#16a34a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  {isFinancialLoading ? 'Loading financial data...' : 'No collection data yet.'}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Capacity vs Demand
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {capacityComparisonData.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={capacityComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => value.toLocaleString()} />
                    <Tooltip formatter={(value: number) => value.toLocaleString()} />
                    <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No capacity data available.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {!!topHostelList.length && hasCollectionData && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Top 5 Hostel Contributors
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {topHostelList.map((hostel) => (
                <div
                  key={hostel.rank}
                  className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      #{hostel.rank}
                    </span>
                    <span className="text-xs rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-600">
                      {hostel.share.toFixed(1)}%
                    </span>
                  </div>
                  <h4 className="mt-2 text-base font-semibold text-gray-900">
                    {hostel.name}
                  </h4>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {formatCurrency(hostel.collected)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Share of total platform collections
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}





