import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Receipt, DollarSign, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SemesterSelector } from '@/components/SemesterSelector';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);

  useEffect(() => {
    fetchStats();
  }, [user, selectedSemesterId]);

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
            <p className="text-sm md:text-base text-gray-600 mt-2">Overview of your hostel operations</p>
          </div>
          <SemesterSelector 
            hostelId={user?.hostel_id || null}
            onSemesterChange={setSelectedSemesterId}
          />
        </div>

        {/* Welcome Message */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>{greeting.emoji} {greeting.text}, {displayName}!</strong> Welcome back to your dashboard.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Students Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_students}</div>
              <p className="text-xs text-muted-foreground mt-1">Total students</p>
            </CardContent>
          </Card>

          {/* Expenses Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                UGX {stats.total_expenses.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All expenses</p>
            </CardContent>
          </Card>

          {/* Payments Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                UGX {stats.total_payments.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Received payments</p>
            </CardContent>
          </Card>

          {/* Outstanding Balance Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                UGX {stats.outstanding_balance.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Pending payments</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}


