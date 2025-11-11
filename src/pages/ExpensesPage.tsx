import { useState, useEffect, type JSX } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { SemesterSelector } from '@/components/SemesterSelector';
import { Receipt, Plus, Search, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Expense {
  id: number;
  name: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  spent_at: string;
  created_at: string;
}

export default function ExpensesPage(): JSX.Element {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'UGX',
    category: '',
    description: ''
  });
  const [hostels, setHostels] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedHostelId, setSelectedHostelId] = useState<string>('');

  const effectiveHostelId = isSuperAdmin
    ? selectedHostelId
      ? Number(selectedHostelId)
      : null
    : user?.hostel_id ?? null;

  useEffect(() => {
    if (isSuperAdmin) {
      fetchHostels();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (isSuperAdmin && hostels.length > 0 && !selectedHostelId) {
      setSelectedHostelId(String(hostels[0].id));
    }
  }, [isSuperAdmin, hostels, selectedHostelId]);

  useEffect(() => {
    if (effectiveHostelId) {
      fetchExpenses();
    }
  }, [effectiveHostelId, selectedSemesterId]);

  useEffect(() => {
    setSelectedSemesterId(null);
  }, [effectiveHostelId]);

  const fetchHostels = async () => {
    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.HOSTELS.LIST}?page=1&limit=200`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.success) {
        setHostels(
          (data.data || []).map((hostel: any) => ({
            id: hostel.id,
            name: hostel.name,
          })),
        );
      }
    } catch (err) {
      console.error('Error fetching hostels:', err);
    }
  };

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      setError('');
      setWarning(null);

      if (!effectiveHostelId) {
        setExpenses([]);
        setIsLoading(false);
        return;
      }

      const buildUrl = (includeSemester: boolean) => {
        const semesterParam =
          includeSemester && selectedSemesterId ? `&semester_id=${selectedSemesterId}` : '';
        const params = new URLSearchParams({ page: '1', limit: '100' });
        if (semesterParam) params.set('semester_id', String(selectedSemesterId));
        if (isSuperAdmin && effectiveHostelId) {
          params.set('hostel_id', String(effectiveHostelId));
        }
        return `${API_CONFIG.ENDPOINTS.EXPENSES.LIST}?${params.toString()}`;
      };

      const runFetch = async (includeSemester: boolean) => {
        const response = await fetch(buildUrl(includeSemester), {
          headers: getAuthHeaders(),
        });
        return response;
      };

      let response = await runFetch(Boolean(selectedSemesterId));
      if (!response.ok && response.status === 400 && selectedSemesterId) {
        let body: any = null;
        try {
          body = await response.json();
        } catch {
          body = null;
        }
        const message = body?.message || '';
        if (message.includes('Semester filtering is not supported')) {
          setWarning(
            'Semester-specific expense filtering is not available yet. Showing all recorded expenses.'
          );
          response = await runFetch(false);
        } else {
          throw new Error(message || 'Failed to fetch expenses');
        }
      }

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || 'Failed to fetch expenses');
      }

      const data = await response.json();
      if (data.success) {
        setExpenses(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to load expenses');
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuperAdmin) {
      setError('Switch to a hostel or custodian account to record expenses.');
      return;
    }
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.EXPENSES.CREATE, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create expense');
      }

      const data = await response.json();
      if (data.success) {
        setIsDialogOpen(false);
        setFormData({ amount: '', currency: 'UGX', category: '', description: '' });
        fetchExpenses();
      } else {
        throw new Error(data.message || 'Failed to create expense');
      }
    } catch (err) {
      console.error('Error creating expense:', err);
      setError(err instanceof Error ? err.message : 'Failed to create expense');
    }
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAmount = filteredExpenses.reduce(
    (sum, expense) => sum + (typeof expense.amount === 'number' ? expense.amount : Number(expense.amount) || 0),
    0
  );

  if (!effectiveHostelId) {
    return (
      <Layout>
        <div className="space-y-4">
          {isSuperAdmin ? (
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Select a hostel to review expenses.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No hostel assigned to your account.</AlertDescription>
            </Alert>
          )}
          {isSuperAdmin && hostels.length > 0 && (
            <div className="max-w-sm">
              <Label htmlFor="hostel-select">Hostel</Label>
              <Select value={selectedHostelId} onValueChange={setSelectedHostelId}>
                <SelectTrigger id="hostel-select">
                  <SelectValue placeholder="Choose hostel" />
                </SelectTrigger>
                <SelectContent>
                  {hostels.map((hostel) => (
                    <SelectItem key={hostel.id} value={String(hostel.id)}>
                      {hostel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Expenses</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">Track and manage hostel expenses</p>
            {isSuperAdmin && (
              <div className="max-w-sm">
                <Label htmlFor="hostel-switcher">Hostel</Label>
                <Select value={selectedHostelId} onValueChange={setSelectedHostelId}>
                  <SelectTrigger id="hostel-switcher">
                    <SelectValue placeholder="Choose hostel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hostels.map((hostel) => (
                      <SelectItem key={hostel.id} value={String(hostel.id)}>
                        {hostel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {effectiveHostelId && (
            <SemesterSelector 
              hostelId={effectiveHostelId}
              onSemesterChange={setSelectedSemesterId}
            />
          )}
        </div>

        {/* Summary Card */}
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl md:text-3xl font-bold text-red-600">
                  UGX {totalAmount.toLocaleString()}
                </p>
              </div>
              <Receipt className="h-10 w-10 md:h-12 md:w-12 text-red-600" />
            </div>
          </CardContent>
        </Card>

        {/* Search and Add */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Card className="flex-1">
            <CardContent className="pt-4 md:pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
          {!isSuperAdmin ? (
            <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          ) : (
            <div className="text-xs text-gray-500">
              Super admins can review expenses. Create and edit from a hostel or custodian account.
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Warning / Error State */}
        {warning && !isLoading && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">{warning}</AlertDescription>
          </Alert>
        )}
        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Expenses List */}
        {!isLoading && !error && (
          <>
            {filteredExpenses.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No expenses found</h3>
                    <p className="text-gray-600">
                      {searchQuery 
                        ? 'No expenses match your search criteria.' 
                        : 'No expenses have been recorded yet.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredExpenses.map((expense) => (
                  <Card key={expense.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 md:pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                              <DollarSign className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base md:text-lg text-gray-900 truncate">{expense.category || 'Uncategorized'}</h3>
                              <p className="text-xs md:text-sm text-gray-600 truncate">{expense.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs md:text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                              {new Date(expense.spent_at || expense.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-lg md:text-xl font-bold text-red-600">
                            {expense.currency} {expense.amount?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Create Expense Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>
                Record a new expense for your hostel.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
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
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Maintenance, Utilities"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <Button type="submit" className="w-full">Create Expense</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

