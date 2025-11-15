import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuditLog {
  id: number;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  changes: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    available_actions: string[];
    available_entity_types: string[];
  };
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    action: '',
    entity_type: '',
    user_id: '',
    start_date: '',
    end_date: '',
    search: '',
  });
  const [availableFilters, setAvailableFilters] = useState({
    actions: [] as string[],
    entity_types: [] as string[],
  });

  useEffect(() => {
    if (!user) {
      return; // Wait for user to load
    }
    if (user?.role !== 'super_admin') {
      navigate('/dashboard');
      return;
    }
    fetchAuditLogs();
  }, [user, pagination.page, filters, navigate]);

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      
      if (filters.action) params.append('action', filters.action);
      if (filters.entity_type) params.append('entity_type', filters.entity_type);
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`${API_CONFIG.ENDPOINTS.AUDIT_LOGS.LIST}?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to fetch audit logs';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data: { success: boolean; data?: AuditLogsResponse; message?: string } = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch audit logs');
      }
      
      if (!data.data) {
        throw new Error('Invalid response from server: missing data');
      }

      setLogs(data.data.logs || []);
      setPagination(data.data.pagination || {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
      });
      setAvailableFilters({
        actions: data.data.filters?.available_actions || [],
        entity_types: data.data.filters?.available_entity_types || [],
      });
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audit logs';
      setError(errorMessage);
      setLogs([]);
      setPagination({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };

  const handleClearFilters = () => {
    setFilters({
      action: '',
      entity_type: '',
      user_id: '',
      start_date: '',
      end_date: '',
      search: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('delete') || action.includes('remove')) return 'destructive';
    if (action.includes('create') || action.includes('add')) return 'default';
    if (action.includes('update') || action.includes('edit')) return 'secondary';
    return 'outline';
  };

  // Show loading state while checking user role
  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-500 mt-2">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (user?.role !== 'super_admin') {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Only super administrators can view audit logs.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-600 mt-1">View all system activity and changes across the platform</p>
          </div>
          <Button onClick={fetchAuditLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search actions, types, or changes..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="action">Action</Label>
                <Select 
                  value={filters.action || 'all'} 
                  onValueChange={(value) => handleFilterChange('action', value === 'all' ? '' : value)}
                >
                  <SelectTrigger id="action">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    {availableFilters.actions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="entity_type">Entity Type</Label>
                <Select 
                  value={filters.entity_type || 'all'} 
                  onValueChange={(value) => handleFilterChange('entity_type', value === 'all' ? '' : value)}
                >
                  <SelectTrigger id="entity_type">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {availableFilters.entity_types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="user_id">User ID</Label>
                <Input
                  id="user_id"
                  type="number"
                  placeholder="Filter by user ID"
                  value={filters.user_id}
                  onChange={(e) => handleFilterChange('user_id', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={handleClearFilters} variant="outline" size="sm">
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Activity Logs ({pagination.total} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="text-gray-500 mt-2">Loading audit logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400" />
                <p className="text-gray-500 mt-2">No audit logs found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Time</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">User</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Action</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Entity</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Details</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-sm text-gray-600">
                            {formatDate(log.created_at)}
                          </td>
                          <td className="p-3 text-sm">
                            {log.user_id ? (
                              <div>
                                <div className="font-medium">{log.user_name || 'Unknown'}</div>
                                <div className="text-xs text-gray-500">{log.user_email}</div>
                                {log.user_role && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {log.user_role}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">System</span>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge variant={getActionBadgeVariant(log.action)}>
                              {log.action.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">
                            {log.entity_type ? (
                              <div>
                                <div className="font-medium capitalize">{log.entity_type}</div>
                                {log.entity_id && (
                                  <div className="text-xs text-gray-500">ID: {log.entity_id}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-3 text-sm">
                            {log.changes ? (
                              <details className="cursor-pointer">
                                <summary className="text-blue-600 hover:text-blue-800">
                                  View Details
                                </summary>
                                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-w-md">
                                  {JSON.stringify(log.changes, null, 2)}
                                </pre>
                              </details>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-3 text-sm text-gray-600">
                            {log.ip_address || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} logs
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1 || isLoading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page >= pagination.totalPages || isLoading}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

