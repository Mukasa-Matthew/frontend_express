import { useEffect, useMemo, useState, type JSX } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  PieChart as PieChartIcon,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { API_CONFIG, getAuthHeaders } from '@/config/api';

interface TrendPoint {
  period: string;
  collected: number;
  expected: number;
  expenses: number;
}

interface HostelTotals {
  collected: number;
  expected: number;
  outstanding: number;
  expenses: number;
  net: number;
  current_collected: number;
  current_expected: number;
  current_outstanding: number;
}

interface CurrentSemesterSummary {
  semester_id: number;
  name: string;
  academic_year: string;
  collected: number;
  expected: number;
  outstanding: number;
}

interface CollectorSummary {
  name: string;
  email: string | null;
  collected: number;
}

interface OutstandingSummary {
  name: string;
  email: string | null;
  outstanding: number;
}

interface HostelFinancialSummary {
  totals: HostelTotals;
  current_semester: CurrentSemesterSummary | null;
  trend: TrendPoint[];
  top_collectors: CollectorSummary[];
  outstanding_students: OutstandingSummary[];
}

const TREND_COLORS = {
  collected: '#16a34a',
  expected: '#2563eb',
  expenses: '#f97316',
};

const PIE_COLORS = ['#16a34a', '#f97316', '#facc15'];

const formatCurrency = (value: number) =>
  `UGX ${Number(value || 0).toLocaleString('en-UG', { maximumFractionDigits: 0 })}`;

const monthsOptions = [
  { label: 'Last 3 months', value: 3 },
  { label: 'Last 6 months', value: 6 },
  { label: 'Last 12 months', value: 12 },
];

export default function ReportsPage(): JSX.Element {
  const [summary, setSummary] = useState<HostelFinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [months, setMonths] = useState<number>(6);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    fetchFinancialSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months]);

  const fetchFinancialSummary = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(
        `${API_CONFIG.ENDPOINTS.PAYMENTS.HOSTEL_SUMMARY}?months=${months}`,
        { headers: getAuthHeaders() }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to load financial summary');
      }

      setSummary(data.data as HostelFinancialSummary);
    } catch (fetchError) {
      console.error('Error loading hostel financial summary:', fetchError);
      setError(
        fetchError instanceof Error ? fetchError.message : 'Failed to load financial summary'
      );
      setSummary(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleMonthsChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number(event.target.value);
    if (!Number.isNaN(value)) {
      setMonths(value);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFinancialSummary();
  };

  const trendChartData = useMemo(() => {
    if (!summary?.trend?.length) return [];
    return summary.trend.map((item) => ({
      ...item,
      collected: Number(item.collected || 0),
      expected: Number(item.expected || 0),
      expenses: Number(item.expenses || 0),
    }));
  }, [summary]);

  const pieChartData = useMemo(() => {
    if (!summary?.totals) return [];
    const { collected, expenses, outstanding } = summary.totals;
    return [
      { name: 'Collected', value: Math.max(collected, 0) },
      { name: 'Expenses', value: Math.max(expenses, 0) },
      { name: 'Outstanding', value: Math.max(outstanding, 0) },
    ];
  }, [summary]);

  const barChartData = useMemo(() => {
    if (!summary?.top_collectors?.length) return [];
    return summary.top_collectors.map((collector) => ({
      name: collector.name || 'Student',
      collected: Number(collector.collected || 0),
    }));
  }, [summary]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hostel Financial Insights</h1>
            <p className="text-gray-600 mt-2">
              Monitor collections, spending, and outstanding balances for your hostel.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={months}
              onChange={handleMonthsChange}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {monthsOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-indigo-600' : 'text-gray-600'}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[320px]">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-600 text-sm">Generating financial insights...</p>
            </div>
          </div>
        ) : summary ? (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-green-800/80 tracking-wide">
                        Total Collected
                      </p>
                      <p className="text-2xl font-bold text-green-700 mt-2">
                        {formatCurrency(summary.totals.collected)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-xs text-green-700/70 mt-3">
                    Money received from students across all periods.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-blue-800/80 tracking-wide">
                        Expected Revenue
                      </p>
                      <p className="text-2xl font-bold text-blue-700 mt-2">
                        {formatCurrency(summary.totals.expected)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-xs text-blue-700/70 mt-3">
                    Target based on room prices and assignments.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-amber-800/80 tracking-wide">
                        Outstanding
                      </p>
                      <p className="text-2xl font-bold text-amber-700 mt-2">
                        {formatCurrency(summary.totals.outstanding)}
                      </p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-amber-600" />
                  </div>
                  <p className="text-xs text-amber-700/70 mt-3">
                    Remaining amount to collect from current tenants.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-rose-100 bg-gradient-to-br from-rose-50 to-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-rose-800/80 tracking-wide">
                        Total Expenses
                      </p>
                      <p className="text-2xl font-bold text-rose-700 mt-2">
                        {formatCurrency(summary.totals.expenses)}
                      </p>
                    </div>
                    <PieChartIcon className="h-8 w-8 text-rose-500" />
                  </div>
                  <p className="text-xs text-rose-700/70 mt-3">
                    Verified operating expenses recorded by custodians.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-emerald-800/80 tracking-wide">
                        Net Position
                      </p>
                      <p className="text-2xl font-bold text-emerald-700 mt-2">
                        {formatCurrency(summary.totals.net)}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-emerald-500" />
                  </div>
                  <p className="text-xs text-emerald-700/70 mt-3">
                    Collections minus expenses across the selected period.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Current semester snapshot */}
            {summary.current_semester && (
              <Card className="border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white">
                <CardHeader className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-indigo-900">
                      Current Semester Performance
                    </CardTitle>
                    <p className="text-sm text-indigo-700/80 mt-1">
                      {summary.current_semester.name} • {summary.current_semester.academic_year}
                    </p>
                  </div>
                  <div className="flex gap-6 mt-4 lg:mt-0">
                    <div>
                      <p className="text-xs uppercase text-slate-500 tracking-wide">Collected</p>
                      <p className="text-base font-semibold text-slate-900">
                        {formatCurrency(summary.current_semester.collected)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-500 tracking-wide">Expected</p>
                      <p className="text-base font-semibold text-slate-900">
                        {formatCurrency(summary.current_semester.expected)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-500 tracking-wide">Outstanding</p>
                      <p className="text-base font-semibold text-amber-600">
                        {formatCurrency(summary.current_semester.outstanding)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}

            {/* Trend + Pie charts */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
              <Card className="xl:col-span-3">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    Collections vs Expected vs Expenses
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Monthly comparison of what was collected against expected revenue and spending.
                  </p>
                </CardHeader>
                <CardContent className="h-[360px]">
                  {trendChartData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={trendChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="period" />
                        <YAxis tickFormatter={(value) => value.toLocaleString()} />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            formatCurrency(value),
                            name.charAt(0).toUpperCase() + name.slice(1),
                          ]}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="expected"
                          stroke={TREND_COLORS.expected}
                          fill={`${TREND_COLORS.expected}33`}
                          strokeWidth={2}
                          name="Expected"
                        />
                        <Area
                          type="monotone"
                          dataKey="collected"
                          stroke={TREND_COLORS.collected}
                          fill={`${TREND_COLORS.collected}33`}
                          strokeWidth={2}
                          name="Collected"
                        />
                        <Bar
                          dataKey="expenses"
                          barSize={32}
                          fill={TREND_COLORS.expenses}
                          name="Expenses"
                          radius={[4, 4, 0, 0]}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                      Not enough data to plot a trend yet.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Collections Distribution</CardTitle>
                  <p className="text-sm text-gray-600">
                    How collected revenue compares to expenses and outstanding amounts.
                  </p>
                </CardHeader>
                <CardContent className="h-[360px]">
                  {pieChartData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={4}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`slice-${entry.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                      No financial activity recorded yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top collectors & outstanding */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Top Paying Students</CardTitle>
                  <p className="text-sm text-gray-600">
                    Students who have contributed the most within the selected period.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {barChartData.length ? (
                    <div className="space-y-3">
                      {barChartData.map((row, index) => (
                        <div
                          key={row.name + index}
                          className="rounded-md border border-gray-100 px-4 py-3 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{row.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Contribution rank #{index + 1}
                              </p>
                            </div>
                            <span className="text-sm font-bold text-green-700">
                              {formatCurrency(row.collected)}
                            </span>
                          </div>
                          <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-green-500 transition-all"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (row.collected / (barChartData[0]?.collected || 1)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-16 text-sm text-gray-500">
                      No student payment records yet.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Outstanding Balances</CardTitle>
                  <p className="text-sm text-gray-600">
                    Focus on students that need follow-up to clear their balances.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {summary.outstanding_students?.length ? (
                    summary.outstanding_students.map((student, index) => (
                      <div
                        key={student.email ?? `${student.name}-${index}`}
                        className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-amber-900">{student.name}</p>
                          {student.email && (
                            <p className="text-xs text-amber-700 mt-0.5">{student.email}</p>
                          )}
                        </div>
                        <span className="text-sm font-bold text-amber-700">
                          {formatCurrency(student.outstanding)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center py-16 text-sm text-gray-500">
                      No outstanding students—great job!
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 text-sm">
                We could not find any financial data for this hostel yet. Once collections and
                expenses are recorded, insights will appear here automatically.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

