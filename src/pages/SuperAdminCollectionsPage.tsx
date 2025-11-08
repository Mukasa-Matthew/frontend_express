import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

const formatCurrency = (value: number) =>
  `UGX ${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

export default function SuperAdminCollectionsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<GlobalPaymentsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchGlobalPayments();
    }
  }, [user]);

  const fetchGlobalPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);

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

      setPayments({ overall, hostels });
    } catch (err) {
      console.error('Error fetching collections summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load collections summary');
      setPayments(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== 'super_admin') {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto py-24 text-center">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You do not have permission to view this page.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Collections Overview</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Track how much money has been collected across all hostels and drill into current
              semester performance.
            </p>
          </div>
          <Button variant="outline" onClick={fetchGlobalPayments} disabled={isLoading}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-white sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-900">Total Collected</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">
                {formatCurrency(payments?.overall.collected || 0)}
              </div>
              <p className="text-xs text-green-700/70 mt-1">Across every hostel</p>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden border border-slate-100 shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Collections by Hostel
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                See how much each hostel has contributed to the platform total.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {payments?.hostels.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {[...payments.hostels]
                  .sort((a, b) => b.totals.collected - a.totals.collected)
                  .map((hostel, index) => {
                    const totalCollected = payments.overall.collected || 1;
                    const share = Math.min(
                      100,
                      Math.max(0, (hostel.totals.collected / totalCollected) * 100)
                    );
                    const rankColors = [
                      'from-emerald-500/20 via-emerald-500/10 to-transparent',
                      'from-blue-500/20 via-blue-500/10 to-transparent',
                      'from-amber-500/20 via-amber-500/10 to-transparent',
                    ];
                    const ribbonColor = rankColors[index] ?? 'from-slate-500/15 via-slate-500/5 to-transparent';

                    return (
                      <div
                        key={hostel.hostel_id}
                        className="relative overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md"
                      >
                        <div
                          className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${ribbonColor}`}
                        />
                        <div className="flex items-start justify-between px-4 pt-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                              #{index + 1}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {hostel.hostel_name}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {share.toFixed(1)}% of platform collections
                              </p>
                            </div>
                          </div>
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                            {hostel.totals.collected > 0 ? 'Active' : 'Pending'}
                          </span>
                        </div>
                        <div className="px-4 pt-4 pb-5">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Total Collected
                          </p>
                          <p className="mt-1 text-2xl font-bold text-slate-900">
                            {formatCurrency(hostel.totals.collected)}
                          </p>
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>Contribution</span>
                              <span>{share.toFixed(1)}%</span>
                            </div>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300"
                                style={{ width: `${share}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {isLoading ? 'Loading collections...' : 'No collection data available yet.'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

