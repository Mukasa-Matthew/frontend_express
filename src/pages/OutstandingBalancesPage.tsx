import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, AlertCircle, TrendingUp, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SemesterSelector } from '@/components/SemesterSelector';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OutstandingBalance {
  user_id: number;
  student_name: string;
  student_email: string;
  room_number: string | null;
  expected: number | null;
  paid: number;
  balance: number | null;
  status: string;
}

interface SummaryStats {
  total_outstanding: number;
  total_students: number;
  average_balance: number;
  oldest_debt_days: number;
}

export default function OutstandingBalancesPage() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<OutstandingBalance[]>([]);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<OutstandingBalance | null>(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    currency: 'UGX',
    purpose: 'payment'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.hostel_id) {
      fetchOutstandingBalances();
    }
  }, [user, selectedSemesterId]);

  const fetchOutstandingBalances = async () => {
    if (!user?.hostel_id) return;
    
    try {
      setIsLoading(true);
      setError('');

      const semesterParam = selectedSemesterId ? `?semester_id=${selectedSemesterId}` : '';
      const response = await fetch(`${API_CONFIG.ENDPOINTS.PAYMENTS.SUMMARY}${semesterParam}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch outstanding balances');
      }

      const data = await response.json();

      if (data.success) {
        // Map API data to OutstandingBalance format
        const outstandingBalances = (data.data?.students || [])
          .filter((s: any) => s.balance && s.balance > 0)
          .map((s: any) => ({
            user_id: s.user_id,
            student_name: s.name,
            student_email: s.email,
            room_number: s.room_number,
            expected: s.expected,
            paid: s.paid,
            balance: s.balance,
            status: s.status
          }));
        
        setBalances(outstandingBalances);
        
        // Calculate stats from the data
        const totalOutstanding = Number(data.data?.total_outstanding || 0);
        const totalStudents = outstandingBalances.length;
        const averageBalance = totalStudents > 0 ? totalOutstanding / totalStudents : 0;

        setStats({
          total_outstanding: totalOutstanding,
          total_students: totalStudents,
          average_balance: averageBalance,
          oldest_debt_days: 0 // Would need more data to calculate this
        });
      } else {
        throw new Error(data.message || 'Failed to load outstanding balances');
      }
    } catch (err) {
      console.error('Error fetching outstanding balances:', err);
      setError(err instanceof Error ? err.message : 'Failed to load outstanding balances');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordPayment = (balance: OutstandingBalance) => {
    setSelectedStudent(balance);
    setPaymentData({
      amount: '',
      currency: 'UGX',
      purpose: 'payment'
    });
    setIsPaymentDialogOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      setIsSubmitting(true);
      setError('');

      const response = await fetch(API_CONFIG.ENDPOINTS.PAYMENTS.CREATE, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_id: selectedStudent.user_id,
          amount: paymentData.amount,
          currency: paymentData.currency,
          purpose: paymentData.purpose
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsPaymentDialogOpen(false);
        setSelectedStudent(null);
        setPaymentData({ amount: '', currency: 'UGX', purpose: 'payment' });
        // Refresh the outstanding balances
        await fetchOutstandingBalances();
        
        // Show success message
        alert(`Payment of ${paymentData.currency} ${parseFloat(paymentData.amount).toLocaleString()} recorded successfully! A receipt has been sent to ${selectedStudent.student_email}.`);
      } else {
        throw new Error(data.message || 'Failed to record payment');
      }
    } catch (err) {
      console.error('Error recording payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading outstanding balances...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Outstanding Balances</h1>
            <p className="text-sm md:text-base text-gray-600 mt-2">Track student payment obligations</p>
          </div>
          <SemesterSelector 
            hostelId={user?.hostel_id || null}
            onSemesterChange={setSelectedSemesterId}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <Card className="bg-gradient-to-br from-red-50 to-red-100">
              <CardContent className="pt-4 md:pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-red-900">Total Outstanding</p>
                    <p className="text-xl md:text-2xl font-bold text-red-600">
                      UGX {stats.total_outstanding.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="pt-4 md:pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-orange-900">Students with Debt</p>
                    <p className="text-xl md:text-2xl font-bold text-orange-600">{stats.total_students}</p>
                  </div>
                  <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
              <CardContent className="pt-4 md:pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-yellow-900">Average Balance</p>
                    <p className="text-xl md:text-2xl font-bold text-yellow-600">
                      UGX {stats.average_balance.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed List */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 md:pt-6">
            {balances.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-sm md:text-base text-gray-500">No outstanding balances found</p>
                <p className="text-xs md:text-sm text-gray-400 mt-2">All students are up to date with payments</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Student</th>
                        <th className="text-left py-3 px-4 font-semibold">Email</th>
                        <th className="text-left py-3 px-4 font-semibold">Room</th>
                        <th className="text-left py-3 px-4 font-semibold">Expected</th>
                        <th className="text-left py-3 px-4 font-semibold">Paid</th>
                        <th className="text-left py-3 px-4 font-semibold">Balance</th>
                        <th className="text-left py-3 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {balances.map((balance, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{balance.student_name}</td>
                          <td className="py-3 px-4">{balance.student_email}</td>
                          <td className="py-3 px-4">{balance.room_number || '-'}</td>
                          <td className="py-3 px-4">UGX {balance.expected?.toLocaleString() || '-'}</td>
                          <td className="py-3 px-4">UGX {balance.paid.toLocaleString()}</td>
                          <td className="py-3 px-4 font-semibold text-red-600">
                            UGX {balance.balance?.toLocaleString() || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <Button size="sm" variant="outline" onClick={() => handleRecordPayment(balance)}>
                              <Plus className="h-4 w-4 mr-1" />
                              Pay
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile Card View */}
                <div className="md:hidden grid grid-cols-1 gap-4">
                  {balances.map((balance, idx) => (
                    <Card key={idx} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                              <DollarSign className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{balance.student_name}</h3>
                              <p className="text-xs text-gray-600 truncate">{balance.student_email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Room:</span>
                            <span className="ml-1 font-semibold">{balance.room_number || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Expected:</span>
                            <span className="ml-1 font-semibold">UGX {balance.expected?.toLocaleString() || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Paid:</span>
                            <span className="ml-1 font-semibold">UGX {balance.paid.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <span className="ml-1 font-semibold capitalize">{balance.status}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-gray-600">Balance:</span>
                            <span className="text-xl font-bold text-red-600">
                              UGX {balance.balance?.toLocaleString() || '-'}
                            </span>
                          </div>
                          <Button size="sm" variant="outline" className="w-full" onClick={() => handleRecordPayment(balance)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Record Payment
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Record Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a payment for {selectedStudent?.student_name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  required
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={paymentData.currency}
                  onValueChange={(value) => setPaymentData({ ...paymentData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UGX">UGX - Ugandan Shilling</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="purpose">Purpose</Label>
                <Input
                  id="purpose"
                  value={paymentData.purpose}
                  onChange={(e) => setPaymentData({ ...paymentData, purpose: e.target.value })}
                  placeholder="e.g., Monthly rent payment"
                />
              </div>
              {selectedStudent && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Outstanding Balance:</p>
                  <p className="text-lg font-bold text-red-600">
                    {paymentData.currency} {selectedStudent.balance?.toLocaleString()}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsPaymentDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Recording...' : 'Record Payment'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}


