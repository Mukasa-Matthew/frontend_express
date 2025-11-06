import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { BarChart3, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface FinancialSummary {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  outstanding_balance: number;
  period_start?: string;
  period_end?: string;
}

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFinancialReports();
  }, []);

  const fetchFinancialReports = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch financial summary
      const summaryResponse = await fetch(`${API_CONFIG.ENDPOINTS.PAYMENTS.SUMMARY}`, {
        headers: getAuthHeaders()
      });

      const summaryData = await summaryResponse.json();

      // Fetch expenses summary
      const expensesResponse = await fetch(`${API_CONFIG.ENDPOINTS.EXPENSES.SUMMARY}`, {
        headers: getAuthHeaders()
      });

      const expensesData = await expensesResponse.json();

      if (summaryResponse.ok && summaryData.success && expensesResponse.ok && expensesData.success) {
        const totalPaid = Number(summaryData.data?.total_paid || 0);
        const totalOutstanding = Number(summaryData.data?.total_outstanding || 0);
        const totalExpenses = Number(expensesData.data?.total || 0);

        setSummary({
          total_revenue: totalPaid,
          total_expenses: totalExpenses,
          net_profit: totalPaid - totalExpenses,
          outstanding_balance: totalOutstanding
        });

        // Process expense categories if available
        if (expensesData.data?.categories) {
          setExpenseCategories(expensesData.data.categories);
        }
      } else {
        throw new Error(summaryData.message || expensesData.message || 'Failed to load financial reports');
      }
    } catch (err) {
      console.error('Error fetching financial reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to load financial reports');
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
            <p className="text-gray-600">Loading financial reports...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-2">Hostel financial overview and analytics</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Financial Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${summary.total_revenue.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-900">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">
                      ${summary.total_expenses.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${summary.net_profit >= 0 ? 'from-blue-50 to-blue-100' : 'from-orange-50 to-orange-100'}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${summary.net_profit >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                      Net Profit/Loss
                    </p>
                    <p className={`text-2xl font-bold ${summary.net_profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      ${summary.net_profit.toFixed(2)}
                    </p>
                  </div>
                  <BarChart3 className={`h-8 w-8 ${summary.net_profit >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Outstanding</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      ${summary.outstanding_balance.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Expense Breakdown */}
        {expenseCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenseCategories.map((category, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{category.category}</span>
                      <span className="font-semibold">${category.amount.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                <Calendar className="h-8 w-8 text-indigo-600 mb-2" />
                <h3 className="font-semibold">Monthly Report</h3>
                <p className="text-sm text-gray-600">Generate financial report for current month</p>
              </button>
              <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                <Calendar className="h-8 w-8 text-indigo-600 mb-2" />
                <h3 className="font-semibold">Quarterly Report</h3>
                <p className="text-sm text-gray-600">Generate financial report for current quarter</p>
              </button>
              <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                <Calendar className="h-8 w-8 text-indigo-600 mb-2" />
                <h3 className="font-semibold">Custom Period</h3>
                <p className="text-sm text-gray-600">Generate financial report for custom date range</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}




