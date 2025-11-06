import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Download, DollarSign, Calendar, User, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SemesterSelector } from '@/components/SemesterSelector';

interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  currency: string;
  purpose: string;
  created_at: string;
  student_name: string;
  student_email: string;
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  useEffect(() => {
    if (user?.hostel_id) {
      fetchTransactions();
    }
  }, [user, selectedSemesterId, page, searchQuery]);

  const fetchTransactions = async () => {
    if (!user?.hostel_id) return;

    try {
      setIsLoading(true);
      setError('');
      
      const semesterParam = selectedSemesterId ? `&semester_id=${selectedSemesterId}` : '';
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      
      const response = await fetch(
        `${API_CONFIG.ENDPOINTS.PAYMENTS.LIST}?page=${page}&limit=${limit}${semesterParam}${searchParam}`,
        {
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      
      if (data.success) {
        // Convert amount to numbers for proper calculation
        const transactionsWithNumbers = (data.data || []).map((t: any) => ({
          ...t,
          amount: Number(t.amount) || 0
        }));
        setTransactions(transactionsWithNumbers);
        setTotal(data.total || data.data?.length || 0);
      } else {
        throw new Error(data.message || 'Failed to load transactions');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  if (isLoading)
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        </div>
      </Layout>
    );

  if (error)
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Layout>
    );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-sm md:text-base text-gray-600 mt-2">View all payment transactions</p>
          </div>
          <SemesterSelector 
            hostelId={user?.hostel_id || null}
            onSemesterChange={setSelectedSemesterId}
          />
        </div>

        {/* Summary Card */}
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl md:text-3xl font-bold text-green-600">
                  {transactions.length}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs md:text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl md:text-3xl font-bold text-green-600">
                  {transactions[0]?.currency || 'USD'} {totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by student name or email..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>

        {/* Transactions List */}
        <Card>
          <CardContent className="pt-4 md:pt-6">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-sm md:text-base text-gray-500">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Student</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Purpose</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">
                            {new Date(transaction.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{transaction.student_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {transaction.student_email}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{transaction.purpose}</Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-green-600">
                              {transaction.currency} {transaction.amount.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden grid grid-cols-1 gap-4">
                  {transactions.map((transaction) => (
                    <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                              <DollarSign className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{transaction.student_name}</h3>
                              <p className="text-xs text-gray-600">{transaction.student_email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Purpose:</span>
                            <Badge variant="outline">{transaction.purpose}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Date:</span>
                            <span className="font-medium">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Amount:</span>
                            <span className="text-xl font-bold text-green-600">
                              {transaction.currency} {transaction.amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {transactions.length} of {total} transactions
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={transactions.length < limit}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

