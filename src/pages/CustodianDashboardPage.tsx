import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Receipt, DollarSign, AlertCircle } from 'lucide-react';
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
}

export default function CustodianDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CustodianStats>({
    total_students: 0,
    total_expenses: 0,
    total_payments: 0,
    outstanding_balance: 0,
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
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        if (paymentsData.success && paymentsData.data) {
          totalPayments = Number(paymentsData.data.total_collected || 0) || 0;
          outstandingBalance = Number(paymentsData.data.total_outstanding || 0) || 0;
        }
      }

      setStats({
        total_students: studentsCount,
        total_expenses: totalExpenses,
        total_payments: totalPayments,
        outstanding_balance: outstandingBalance,
      });
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Custodian Dashboard</h1>
            {hostelName ? (
              <div className="flex items-center gap-2 mt-2">
                <p className="text-sm md:text-base text-gray-600">Custodian -</p>
                <p className="text-sm md:text-base font-semibold text-indigo-600">{hostelName}</p>
              </div>
            ) : (
              <p className="text-sm md:text-base text-gray-600 mt-2">Overview of your hostel operations</p>
            )}
          </div>
          <SemesterSelector 
            hostelId={user?.hostel_id || null}
            onSemesterChange={setSelectedSemesterId}
          />
        </div>

        {/* Welcome Message with Hostel Assignment */}
        <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <div className="flex flex-col gap-2">
              <div>
                <strong>{greeting.emoji} {greeting.text}, {displayName}!</strong> Welcome back to your dashboard.
              </div>
              {hostelName && (
                <div className="mt-2 pt-2 border-t border-green-200">
                  <p className="text-sm font-semibold text-green-800">
                    🏠 Assigned Hostel: <span className="text-green-700">{hostelName}</span>
                  </p>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
          {/* Payments Card */}
          <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-white sm:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold text-green-900">Total Collected</CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">
                UGX {stats.total_payments.toLocaleString()}
              </div>
              <p className="text-xs text-green-700/70 mt-1">Money received this semester</p>
            </CardContent>
          </Card>

          {/* Outstanding Balance Card */}
          <Card className="border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold text-amber-900">Outstanding Balance</CardTitle>
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-700">
                UGX {stats.outstanding_balance.toLocaleString()}
              </div>
              <p className="text-xs text-amber-700/70 mt-1">Amount still pending</p>
            </CardContent>
          </Card>

          {/* Expenses Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                UGX {stats.total_expenses.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Spend to date</p>
            </CardContent>
          </Card>

          {/* Students Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_students}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently assigned</p>
            </CardContent>
          </Card>
        </div>

        <SemesterPaymentsSection
          title="Collections by Semester"
          description="Monitor how much has been collected versus expected for each semester."
          data={paymentsData}
          loading={isPaymentsLoading}
          error={paymentsError}
        />
      </div>
    </Layout>
  );
}


