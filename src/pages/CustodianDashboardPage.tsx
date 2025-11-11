import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { DashboardClock } from '@/components/DashboardClock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  Receipt,
  DollarSign,
  AlertCircle,
  Wallet,
  Smartphone,
  PieChart,
  TrendingUp,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SemesterSelector } from '@/components/SemesterSelector';
import SemesterPaymentsSection, {
  SemesterPaymentsData,
  SemesterPaymentSummary,
} from '@/components/payments/SemesterPaymentsSection';

interface CustodianStats {
  total_students: number;
  total_expenses: number;
  total_payments: number;
  outstanding_balance: number;
  total_expected: number;
  net_balance: number;
}

interface PaymentMethodBreakdownItem {
  method: string;
  label: string;
  ledger_total: number;
  booking_total: number;
  total: number;
}

interface PaymentChannelsSummary {
  items: PaymentMethodBreakdownItem[];
  combinedTotal: number;
  ledgerTotal: number;
  bookingTotal: number;
}

export default function CustodianDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CustodianStats>({
    total_students: 0,
    total_expenses: 0,
    total_payments: 0,
    outstanding_balance: 0,
    total_expected: 0,
    net_balance: 0,
  });
  const [hostelName, setHostelName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [paymentsData, setPaymentsData] = useState<SemesterPaymentsData>({
    current: null,
    history: [],
  });
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [paymentChannels, setPaymentChannels] = useState<PaymentChannelsSummary>({
    items: [],
    combinedTotal: 0,
    ledgerTotal: 0,
    bookingTotal: 0,
  });

  useEffect(() => {
    if (user && !isLoading) {
      fetchHostelInfo();
    }
  }, [user, isLoading]);

  useEffect(() => {
    fetchStats();
  }, [user, selectedSemesterId]);

  useEffect(() => {
    if (user) {
      fetchSemesterPaymentHistory();
    }
  }, [user]);

  const fetchHostelInfo = async () => {
    if (!user?.id || user.role !== 'custodian') {
      return;
    }
    
    try {
      // Try to get hostel info from the custodian's my-hostel endpoint
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/custodians/my-hostel`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('My-hostel endpoint response:', data);
        if (data.success && data.data?.hostel_name) {
          console.log('Setting hostel name from my-hostel endpoint:', data.data.hostel_name);
          setHostelName(data.data.hostel_name);
          return;
        }
      } else {
        const errorText = await response.text();
        console.error('My-hostel endpoint failed:', response.status, errorText);
      }
      
      // Fallback: try to get hostel_id from user context or profile
      let hostelId = user.hostel_id;
      
      if (!hostelId) {
        try {
          const profileResponse = await fetch(API_CONFIG.ENDPOINTS.AUTH.PROFILE, {
            headers: getAuthHeaders()
          });
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.success && profileData.user?.hostel_id) {
              hostelId = profileData.user.hostel_id;
            }
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
        }
      }
      
      // If we have hostel_id, fetch hostel details
      if (hostelId) {
        const hostelResponse = await fetch(`${API_CONFIG.ENDPOINTS.HOSTELS.GET}/${hostelId}`, {
          headers: getAuthHeaders()
        });
        
        if (hostelResponse.ok) {
          const hostelData = await hostelResponse.json();
          if (hostelData.success && hostelData.hostel?.name) {
            setHostelName(hostelData.hostel.name);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching hostel info:', err);
    }
  };

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Build query params with optional semester filtering
      const semesterParam = selectedSemesterId ? `?semester_id=${selectedSemesterId}` : '';
      
      // Fetch students count
      const studentsResponse = await fetch(`${API_CONFIG.ENDPOINTS.STUDENTS.LIST}${semesterParam}`, {
        headers: getAuthHeaders()
      });
      let studentsCount = 0;
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        if (studentsData.success && Array.isArray(studentsData.data)) {
          studentsCount = studentsData.data.length;
        }
      }

      // Fetch expenses summary
      const expensesResponse = await fetch(`${API_CONFIG.ENDPOINTS.EXPENSES.SUMMARY}${semesterParam}`, {
        headers: getAuthHeaders()
      });
      let totalExpenses = 0;
      if (expensesResponse.ok) {
        const expensesData = await expensesResponse.json();
        if (expensesData.success && expensesData.data?.total) {
          totalExpenses = Number(expensesData.data.total) || 0;
        }
      }

      // Fetch payments summary
      const paymentsResponse = await fetch(`${API_CONFIG.ENDPOINTS.PAYMENTS.SUMMARY}${semesterParam}`, {
        headers: getAuthHeaders()
      });
      let totalPayments = 0;
      let outstandingBalance = 0;
      let paymentMethodsSummary: PaymentChannelsSummary = {
        items: [],
        combinedTotal: 0,
        ledgerTotal: 0,
        bookingTotal: 0,
      };
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        if (paymentsData.success && paymentsData.data) {
          totalPayments = Number(paymentsData.data.total_collected ?? 0) || 0;
          outstandingBalance = Number(paymentsData.data.total_outstanding ?? 0) || 0;
          const paymentMethodPayload = paymentsData.data.payment_methods;
          if (paymentMethodPayload) {
            const rawItems: PaymentMethodBreakdownItem[] = Array.isArray(paymentMethodPayload.items)
              ? paymentMethodPayload.items.map((item: any) => ({
                  method: item?.method ?? 'unspecified',
                  label:
                    item?.label ??
                    (item?.method
                      ? String(item.method).replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
                      : 'Unspecified'),
                  ledger_total: Number(item?.ledger_total ?? 0) || 0,
                  booking_total: Number(item?.booking_total ?? 0) || 0,
                  total: Number(item?.total ?? 0) || 0,
                }))
              : [];
            const ledgerTotal =
              Number(paymentMethodPayload.ledger_total ?? 0) ||
              rawItems.reduce((sum, item) => sum + item.ledger_total, 0);
            const bookingTotal =
              Number(paymentMethodPayload.booking_total ?? 0) ||
              rawItems.reduce((sum, item) => sum + item.booking_total, 0);
            const combinedTotal =
              Number(paymentMethodPayload.combined_total ?? 0) ||
              rawItems.reduce((sum, item) => sum + item.total, 0);
            paymentMethodsSummary = {
              items: rawItems,
              combinedTotal,
              ledgerTotal,
              bookingTotal,
            };
          }
        }
      }

      const rawExpected = totalPayments + outstandingBalance;
      const totalExpected = Number.isFinite(rawExpected) ? Math.max(rawExpected, 0) : 0;
      const netBalance = totalPayments - totalExpenses;

      setStats({
        total_students: studentsCount,
        total_expenses: totalExpenses,
        total_payments: totalPayments,
        outstanding_balance: outstandingBalance,
        total_expected: totalExpected,
        net_balance: netBalance,
      });
      setPaymentChannels(paymentMethodsSummary);
    } catch (err) {
      console.error('Error fetching custodian stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
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
    try {
      setIsPaymentsLoading(true);
      setPaymentsError(null);

      const response = await fetch(API_CONFIG.ENDPOINTS.PAYMENTS.SEMESTER_SUMMARY, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to load semester payment history');
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
      console.error('Error fetching semester payment history:', err);
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

  // Helper function to get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', emoji: '🌅' };
    if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️' };
    return { text: 'Good Evening', emoji: '🌙' };
  };

  const displayName = user?.username || user?.name || 'User';
  const greeting = getGreeting();
  const formatCurrency = (value: number) =>
    `UGX ${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  const getOutstandingMeta = (value: number) => {
    if (value > 0) {
      return {
        badge: 'Action needed',
        tone: 'text-amber-600',
        helper: 'Collect this balance to reach the expected total.',
      };
    }
    if (value < 0) {
      return {
        badge: 'Over collected',
        tone: 'text-emerald-600',
        helper:
          'Collections are higher than expected. Confirm if room prices or receipts need updating.',
      };
    }
    return {
      badge: 'On target',
      tone: 'text-emerald-600',
      helper: 'Collections and expectations are perfectly aligned.',
    };
  };

  const getMethodAccent = (method: string) => {
    switch (method) {
      case 'cash':
        return '#047857'; // emerald-600
      case 'mobile_money':
        return '#4338ca'; // indigo-600
      case 'bank_transfer':
        return '#1d4ed8'; // blue-600
      case 'card':
        return '#7c3aed'; // violet-600
      default:
        return '#6b7280'; // gray-500
    }
  };

  const outstandingMeta = getOutstandingMeta(stats.outstanding_balance);
  const expectedRaw = stats.total_payments + stats.outstanding_balance;
  const expectedLooksOff = expectedRaw < 0;
  const displayedExpected = stats.total_expected;
  const combinedChannelTotal =
    paymentChannels.combinedTotal ||
    paymentChannels.items.reduce((sum, item) => sum + item.total, 0);
  const cashCollected =
    paymentChannels.items.find((item) => item.method === 'cash')?.total ?? 0;
  const mobileCollected =
    paymentChannels.items.find((item) => item.method === 'mobile_money')?.total ?? 0;
  const otherCollected = Math.max(combinedChannelTotal - (cashCollected + mobileCollected), 0);
  const channelDelta = stats.total_payments - combinedChannelTotal;
  const channelsAligned = Math.abs(channelDelta) < 1;
  const netToneClass =
    stats.net_balance > 0
      ? 'text-emerald-600'
      : stats.net_balance < 0
      ? 'text-rose-600'
      : 'text-slate-600';
  const netBadgeText = stats.net_balance >= 0 ? 'Surplus' : 'Deficit';

  return (
    <Layout>
      <div className="space-y-6 sm:space-y-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Custodian Dashboard</h1>
            {hostelName ? (
              <div className="flex flex-wrap items-center gap-1.5 text-sm md:text-base text-muted-foreground">
                <span>Custodian ·</span>
                <span className="font-semibold text-primary">{hostelName}</span>
              </div>
            ) : (
              <p className="text-sm md:text-base text-muted-foreground">
                Overview of your hostel operations
              </p>
            )}
          </div>
          <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:gap-4">
            <SemesterSelector
              hostelId={user?.hostel_id || null}
              onSemesterChange={setSelectedSemesterId}
            />
            <DashboardClock className="md:ml-auto" />
          </div>
        </div>

        {/* Welcome Message with Hostel Assignment */}
        <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-500">
          <AlertCircle className="h-4 w-4 text-emerald-500" />
          <AlertDescription className="text-emerald-600 dark:text-emerald-300">
            <div className="flex flex-col gap-2">
              <div>
                <strong>
                  {greeting.emoji} {greeting.text}, {displayName}!
                </strong>{' '}
                Welcome back to your dashboard.
              </div>
              {hostelName && (
                <div className="mt-2 pt-2 border-t border-emerald-500/20">
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                    🏠 Assigned Hostel: <span className="text-emerald-500/80">{hostelName}</span>
                  </p>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>

        <div className="-mx-3 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 sm:mx-0 sm:grid sm:grid-cols-2 xl:grid-cols-3 sm:gap-5 md:gap-6">
          <Card className="min-w-[240px] border border-emerald-500/20 bg-card/90 backdrop-blur-sm snap-start sm:min-w-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold text-emerald-600 dark:text-emerald-300">
                Total Collections
              </CardTitle>
              <DollarSign className="h-5 w-5 text-emerald-500 dark:text-emerald-300" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-300">
                {formatCurrency(stats.total_payments)}
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p>Cash: {formatCurrency(cashCollected)}</p>
                <p>Mobile: {formatCurrency(mobileCollected)}</p>
                {otherCollected > 0 ? <p>Other: {formatCurrency(otherCollected)}</p> : null}
                {!channelsAligned && (
                  <p className="text-amber-600">
                    Reconcile difference: {formatCurrency(channelDelta)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-[220px] border border-slate-200 bg-card/90 backdrop-blur-sm snap-start sm:min-w-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold text-slate-700 dark:text-slate-200">
                Cash Collections
              </CardTitle>
              <Wallet className="h-5 w-5 text-emerald-500 dark:text-emerald-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(cashCollected)}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Desk payments receipted by custodians.
              </p>
            </CardContent>
          </Card>

          <Card className="min-w-[220px] border border-slate-200 bg-card/90 backdrop-blur-sm snap-start sm:min-w-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold text-slate-700 dark:text-slate-200">
                Mobile Money
              </CardTitle>
              <Smartphone className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(mobileCollected)}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                STK requests and online bookings paid by mobile.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Card className="border border-emerald-500/15 bg-card/90 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Financial Snapshot
                </CardTitle>
                <span className="text-xs font-medium text-muted-foreground">
                  Expected = Collected + Outstanding
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Clear totals for {selectedSemesterId ? 'the selected semester filter' : 'your current semester'}.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-background/80 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Wallet className="h-4 w-4 text-primary" />
                    Total Expected
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-foreground">
                    {formatCurrency(displayedExpected)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Target based on assigned rooms and bookings.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-background/80 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    Collected
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-emerald-600">
                    {formatCurrency(stats.total_payments)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Money received for the same scope.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-background/80 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Outstanding Position
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {outstandingMeta.badge}
                    </span>
                  </div>
                  <div className={`mt-2 text-2xl font-semibold ${outstandingMeta.tone}`}>
                    {formatCurrency(stats.outstanding_balance)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{outstandingMeta.helper}</p>
                </div>
              </div>
              {expectedLooksOff ? (
                <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Expected totals appear negative. Double-check outstanding balances or update room prices if required.
                </div>
              ) : null}
              <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                Totals combine hostel ledger entries with booking receipts for the same semester filter, so everyone can reconcile easily.
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="border border-slate-200 bg-card/90">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-foreground">Spend & Net</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Expenses compared against total collections.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-background/90 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Receipt className="h-4 w-4 text-rose-500" />
                    Total Expenses
                  </div>
                  <div className="mt-2 text-xl font-semibold text-rose-600">
                    {formatCurrency(stats.total_expenses)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Spend logged through expense records and inventory.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-background/90 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      Net Position
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        stats.net_balance >= 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {netBadgeText}
                    </span>
                  </div>
                  <div className={`mt-2 text-xl font-semibold ${netToneClass}`}>
                    {formatCurrency(stats.net_balance)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stats.net_balance >= 0
                      ? 'Positive means collections exceed spend to date.'
                      : 'Negative means expenses are higher than collections.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 bg-card/90">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Students on Record
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-slate-200 bg-background/90 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Users className="h-4 w-4 text-indigo-500" />
                    Active Students
                  </div>
                  <div className="mt-2 text-2xl font-bold text-foreground">{stats.total_students}</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Students currently assigned to rooms for the chosen filter.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border border-indigo-100 bg-card/90">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground">
                Payment Channel Breakdown
              </CardTitle>
              <PieChart className="h-5 w-5 text-indigo-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              Track how collections split between cash, mobile money, and other methods.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentChannels.items.length ? (
              <>
                {paymentChannels.items.map((channel) => {
                  const share =
                    combinedChannelTotal > 0
                      ? Math.round((channel.total / combinedChannelTotal) * 100)
                      : 0;
                  return (
                    <div
                      key={channel.method}
                      className="rounded-lg border border-indigo-100 bg-background/90 p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-foreground">{channel.label}</div>
                        <span className="text-xs font-medium text-muted-foreground">
                          {share > 0 ? `${share}% of recorded receipts` : '—'}
                        </span>
                      </div>
                      <div className="mt-1 text-xl font-semibold text-foreground">
                        {formatCurrency(channel.total)}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>Ledger: {formatCurrency(channel.ledger_total)}</span>
                        <span>Bookings: {formatCurrency(channel.booking_total)}</span>
                      </div>
                      <div className="mt-3 h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${Math.min(share, 100)}%`,
                            backgroundColor: getMethodAccent(channel.method),
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  Total recorded through channels: {formatCurrency(combinedChannelTotal)} (ledger{' '}
                  {formatCurrency(paymentChannels.ledgerTotal)}, bookings{' '}
                  {formatCurrency(paymentChannels.bookingTotal)}).
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No payment channel information has been captured yet. Record payments to populate this view.
              </p>
            )}
          </CardContent>
        </Card>

        <SemesterPaymentsSection
          title="Collections by Semester"
          description="See expected versus collected amounts per semester and spot gaps quickly."
          data={paymentsData}
          loading={isPaymentsLoading}
          error={paymentsError}
        />
      </div>
    </Layout>
  );
}


