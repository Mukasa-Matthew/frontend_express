import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { Calendar, Plus, Trash2, AlertCircle, BookOpen, Building2, Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

interface GlobalSemester {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface Semester {
  id: number;
  hostel_id: number;
  global_semester_id: number | null;
  name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
}

export default function SemesterManagementPage() {
  const navigate = useNavigate();
  const { hostelId } = useParams<{ hostelId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  
  // Hostel-related state
  const [hostels, setHostels] = useState<any[]>([]);
  const [selectedHostelId, setSelectedHostelId] = useState<number | null>(null);
  
  // Global semester templates state (Super Admin only)
  const [globalSemesters, setGlobalSemesters] = useState<GlobalSemester[]>([]);
  const [isGlobalDialogOpen, setIsGlobalDialogOpen] = useState(false);
  const [globalFormData, setGlobalFormData] = useState({
    name: '',
    description: ''
  });
  
  // Hostel semesters state
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [currentSemester, setCurrentSemester] = useState<Semester | null>(null);
  const [isHostelDialogOpen, setIsHostelDialogOpen] = useState(false);
  const [hostelFormData, setHostelFormData] = useState({
    global_semester_id: '',
    name: '',
    academic_year: '',
    start_date: '',
    end_date: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'global' | 'hostel'>('global');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSemesters, setFilteredSemesters] = useState<Semester[]>([]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchHostels();
      fetchGlobalSemesters();
    } else {
      // For hostel admin/custodian, use their hostel_id from auth context
      if (user?.hostel_id) {
        setSelectedHostelId(user.hostel_id);
      }
    }
    
    if (hostelId) {
      setSelectedHostelId(parseInt(hostelId));
    }
  }, [hostelId, isSuperAdmin, user]);

  useEffect(() => {
    if (selectedHostelId) {
      setActiveTab('hostel');
      fetchSemesters();
      fetchCurrentSemester();
    }
  }, [selectedHostelId]);

  useEffect(() => {
    // For hostel admins/custodians, allow them to view global semesters for reference
    if (!isSuperAdmin && selectedHostelId) {
      fetchGlobalSemesters();
    }
  }, [isSuperAdmin, selectedHostelId]);

  // Filter semesters based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSemesters(semesters);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredSemesters(
        semesters.filter(
          semester =>
            semester.name.toLowerCase().includes(query) ||
            semester.academic_year.toLowerCase().includes(query) ||
            semester.status.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, semesters]);

  const fetchHostels = async () => {
    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.HOSTELS.LIST}?page=1&limit=100`, {
        headers: getAuthHeaders()
      });
      
      // Handle 401 Unauthorized - token is invalid
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        navigate('/login');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setHostels(data.data || []);
        if (data.data.length > 0 && !selectedHostelId) {
          setSelectedHostelId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching hostels:', err);
    }
  };

  const fetchGlobalSemesters = async () => {
    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.SEMESTERS.GLOBAL_LIST}`, {
        headers: getAuthHeaders()
      });
      
      // Handle 401 Unauthorized - token is invalid
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        navigate('/login');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setGlobalSemesters(data.globalSemesters || []);
      }
    } catch (err) {
      console.error('Error fetching global semesters:', err);
    }
  };

  const fetchSemesters = async () => {
    if (!selectedHostelId) return;

    try {
      setIsLoading(true);
      setError('');
      const response = await fetch(`${API_CONFIG.ENDPOINTS.SEMESTERS.LIST_BY_HOSTEL}/${selectedHostelId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        // Handle 401 Unauthorized - token is invalid
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          navigate('/login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setSemesters(data.semesters || []);
      } else {
        setError(data.message || 'Failed to fetch semesters');
      }
    } catch (err) {
      console.error('Error fetching semesters:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch semesters');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentSemester = async () => {
    if (!selectedHostelId) return;

    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.SEMESTERS.CURRENT}/${selectedHostelId}/current`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        // Handle 401 Unauthorized - token is invalid
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          navigate('/login');
          return;
        }
        // Current semester might not exist, which is okay
        if (response.status === 404) {
          setCurrentSemester(null);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setCurrentSemester(data.semester || null);
      }
    } catch (err) {
      console.error('Error fetching current semester:', err);
      // Don't show error for current semester fetch failures, as it's okay if none exists
    }
  };

  const handleCreateGlobalSemester = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.SEMESTERS.GLOBAL_CREATE}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(globalFormData)
      });

      const data = await response.json();
      if (data.success) {
        setIsGlobalDialogOpen(false);
        setGlobalFormData({ name: '', description: '' });
        fetchGlobalSemesters();
      } else {
        setError(data.message || 'Failed to create global semester');
      }
    } catch (err) {
      console.error('Error creating global semester:', err);
      setError('Failed to create global semester');
    }
  };

  const handleTemplateChange = (value: string) => {
    const selectedTemplate = globalSemesters.find(g => g.id.toString() === value);
    if (selectedTemplate) {
      // Auto-fill name from template for all users
      setHostelFormData({ 
        ...hostelFormData, 
        global_semester_id: value,
        name: selectedTemplate.name
      });
    } else {
      // If template is cleared, also clear the name for non-super-admin users
      if (!isSuperAdmin) {
        setHostelFormData({ 
          ...hostelFormData, 
          global_semester_id: '',
          name: ''
        });
      } else {
        setHostelFormData({ 
          ...hostelFormData, 
          global_semester_id: ''
        });
      }
    }
  };

  const handleCreateHostelSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHostelId) return;

    // For non-super-admin users, template selection is required
    if (!isSuperAdmin && !hostelFormData.global_semester_id) {
      setError('Please select a semester template');
      return;
    }

    // Validate that name is set (should be auto-filled from template for non-super-admin)
    if (!hostelFormData.name) {
      setError('Semester name is required');
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.SEMESTERS.CREATE}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          global_semester_id: hostelFormData.global_semester_id || null,
          name: hostelFormData.name,
          academic_year: hostelFormData.academic_year,
          start_date: hostelFormData.start_date,
          end_date: hostelFormData.end_date
        })
      });

      const data = await response.json();
      if (data.success) {
        setIsHostelDialogOpen(false);
        setHostelFormData({ global_semester_id: '', name: '', academic_year: '', start_date: '', end_date: '' });
        setError('');
        fetchSemesters();
        fetchCurrentSemester();
      } else {
        setError(data.message || 'Failed to create semester');
      }
    } catch (err) {
      console.error('Error creating semester:', err);
      setError('Failed to create semester');
    }
  };

  const handleSetAsCurrent = async (semesterId: number) => {
    if (!confirm('Set this semester as current? This will unset any other current semester.')) {
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.SEMESTERS.SET_CURRENT}/${semesterId}/set-current`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        fetchSemesters();
        fetchCurrentSemester();
      } else {
        setError(data.message || 'Failed to set current semester');
      }
    } catch (err) {
      console.error('Error setting current semester:', err);
      setError('Failed to set current semester');
    }
  };

  const handleDeleteGlobalSemester = async (id: number) => {
    if (!confirm('Are you sure you want to delete this global semester template?')) {
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.SEMESTERS.GLOBAL_DELETE}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        fetchGlobalSemesters();
      } else {
        setError(data.message || 'Failed to delete global semester');
      }
    } catch (err) {
      console.error('Error deleting global semester:', err);
      setError('Failed to delete global semester');
    }
  };

  const handleDeleteSemester = async (semesterId: number) => {
    if (!confirm('Are you sure you want to delete this semester? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.SEMESTERS.DELETE}/${semesterId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        fetchSemesters();
        fetchCurrentSemester();
      } else {
        setError(data.message || 'Failed to delete semester');
      }
    } catch (err) {
      console.error('Error deleting semester:', err);
      setError('Failed to delete semester');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'upcoming':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Semester Management</h1>
            <p className="text-gray-600 mt-2">
              {isSuperAdmin 
                ? 'Create semester templates that custodians will use to create actual semesters' 
                : 'Create semesters for your hostel by selecting a template and filling in the academic year and dates'}
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs for Super Admin */}
        {isSuperAdmin && (
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('global')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'global'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="h-5 w-5 inline mr-2" />
                Global Semesters
              </button>
              <button
                onClick={() => setActiveTab('hostel')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'hostel'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building2 className="h-5 w-5 inline mr-2" />
                Hostel Semesters
              </button>
            </nav>
          </div>
        )}

        {/* Global Semester Templates Tab */}
        {isSuperAdmin && activeTab === 'global' && (
          <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Semester Templates</CardTitle>
                        <CardDescription>
                          Create reusable semester templates (e.g., "Semester 1", "Fall Semester"). 
                          These templates will be available for custodians to create actual semesters with academic years and dates.
                        </CardDescription>
                      </div>
                <Dialog open={isGlobalDialogOpen} onOpenChange={setIsGlobalDialogOpen}>
                  <Button onClick={() => setIsGlobalDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Semester Template</DialogTitle>
                      <DialogDescription>
                        Create a reusable semester template (e.g., "Semester 1", "Fall Semester", "Spring Semester"). 
                        Custodians will use these templates to create actual semesters with academic years and dates.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateGlobalSemester} className="space-y-4">
                      <div>
                        <Label htmlFor="global_name">Semester Name</Label>
                        <Input
                          id="global_name"
                          value={globalFormData.name}
                          onChange={(e) => setGlobalFormData({ ...globalFormData, name: e.target.value })}
                          placeholder="e.g., Semester 1, Fall Semester"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="global_description">Description (Optional)</Label>
                        <Input
                          id="global_description"
                          value={globalFormData.description}
                          onChange={(e) => setGlobalFormData({ ...globalFormData, description: e.target.value })}
                          placeholder="Brief description of this semester"
                        />
                      </div>
                      <Button type="submit" className="w-full">Create Template</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {globalSemesters.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No global semester templates found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {globalSemesters.map((global) => (
                    <Card key={global.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold">{global.name}</h3>
                            {global.description && (
                              <p className="text-sm text-gray-600 mt-1">{global.description}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGlobalSemester(global.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Hostel Semesters Tab */}
        {(activeTab === 'hostel' || !isSuperAdmin) && (
          <>
            {/* Hostel Selector - Only for Super Admin */}
            {isSuperAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>View Hostel Semesters</CardTitle>
                  <CardDescription>
                    View semesters created by custodians. To create semesters, custodians select a template 
                    and fill in the academic year and dates. You only manage templates.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <select
                    value={selectedHostelId || ''}
                    onChange={(e) => setSelectedHostelId(parseInt(e.target.value))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select a hostel to view semesters...</option>
                    {hostels.map((hostel) => (
                      <option key={hostel.id} value={hostel.id}>
                        {hostel.name}
                      </option>
                    ))}
                  </select>
                </CardContent>
              </Card>
            )}

            {/* Loading state */}
            {authLoading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No hostel assigned message for non-super-admin users */}
            {!authLoading && !isSuperAdmin && !selectedHostelId && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Hostel Assigned</h3>
                    <p className="text-gray-600">
                      Your account is not currently assigned to a hostel. Please contact your administrator to be assigned to a hostel.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Select hostel message for super admin */}
            {!authLoading && isSuperAdmin && !selectedHostelId && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Hostel</h3>
                    <p className="text-gray-600">
                      Please select a hostel from the dropdown above to manage its semesters.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedHostelId && (
              <>
                {/* Current Semester */}
                {currentSemester && (
                  <Card className="border-green-500 bg-green-50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-green-900">Current Semester</CardTitle>
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Semester Name</p>
                          <p className="text-lg font-semibold">{currentSemester.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Academic Year</p>
                          <p className="text-lg font-semibold">{currentSemester.academic_year}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Start Date</p>
                          <p className="text-lg font-semibold">{formatDate(currentSemester.start_date)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">End Date</p>
                          <p className="text-lg font-semibold">{formatDate(currentSemester.end_date)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* All Semesters */}
                <Card>
                  <CardHeader>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>All Semesters</CardTitle>
                          <CardDescription>
                            {isSuperAdmin 
                              ? 'View semesters created by custodians for this hostel' 
                              : 'Manage semester schedules for your hostel. Create new semesters by selecting a template and providing the academic year and dates.'}
                          </CardDescription>
                        </div>
                        {/* Only show create button for custodians (hostel_admin should not create semesters) */}
                        {!isSuperAdmin && user?.role === 'custodian' && (
                        <Dialog 
                          open={isHostelDialogOpen} 
                          onOpenChange={(open) => {
                            setIsHostelDialogOpen(open);
                            if (!open) {
                              // Reset form when dialog closes
                              setHostelFormData({ global_semester_id: '', name: '', academic_year: '', start_date: '', end_date: '' });
                              setError('');
                            }
                          }}
                        >
                          <Button onClick={() => {
                            setIsHostelDialogOpen(true);
                            // Ensure global semesters are loaded
                            if (globalSemesters.length === 0) {
                              fetchGlobalSemesters();
                            }
                          }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Semester
                          </Button>
                          <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create Semester</DialogTitle>
                            <DialogDescription>
                              {isSuperAdmin 
                                ? 'You manage semester templates only. Custodians create the actual semesters with academic years and dates.'
                                : 'Select a semester template, then provide a custom name, academic year, start date, and end date for this semester.'}
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleCreateHostelSemester} className="space-y-4">
                            {/* Template Selection - Required for custodians/hostel admins */}
                            {globalSemesters.length > 0 ? (
                              <div>
                                <Label htmlFor="global_semester">
                                  Semester Template <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                  value={hostelFormData.global_semester_id}
                                  onValueChange={handleTemplateChange}
                                  required
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a template..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {globalSemesters.map((global) => (
                                      <SelectItem key={global.id} value={global.id.toString()}>
                                        {global.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <p className="text-sm text-gray-500 mt-1">
                                  Select a template created by your administrator
                                </p>
                              </div>
                            ) : (
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  No semester templates available. Please contact your administrator to create templates.
                                </AlertDescription>
                              </Alert>
                            )}
                            
                            {/* Semester Name - Editable for custodians with auto-fill suggestion */}
                            <div>
                              <Label htmlFor="name">Semester Name</Label>
                              <Input
                                id="name"
                                value={hostelFormData.name}
                                onChange={(e) => setHostelFormData({ ...hostelFormData, name: e.target.value })}
                                placeholder="e.g., Semester 1 - Fall 2024"
                                required
                              />
                              {hostelFormData.global_semester_id && (
                                <p className="text-sm text-gray-500 mt-1">
                                  Suggestion: {globalSemesters.find(g => g.id.toString() === hostelFormData.global_semester_id)?.name}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="academic_year">Academic Year</Label>
                              <Input
                                id="academic_year"
                                value={hostelFormData.academic_year}
                                onChange={(e) => setHostelFormData({ ...hostelFormData, academic_year: e.target.value })}
                                placeholder="e.g., 2024/2025"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="start_date">Start Date</Label>
                              <Input
                                id="start_date"
                                type="date"
                                value={hostelFormData.start_date}
                                onChange={(e) => setHostelFormData({ ...hostelFormData, start_date: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="end_date">End Date</Label>
                              <Input
                                id="end_date"
                                type="date"
                                value={hostelFormData.end_date}
                                onChange={(e) => setHostelFormData({ ...hostelFormData, end_date: e.target.value })}
                                required
                              />
                            </div>
                            <Button type="submit" className="w-full">Create Semester</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                      )}
                      </div>
                      {/* Search functionality for all users */}
                      <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Search semesters by name, academic year, or status..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : filteredSemesters.length === 0 && searchQuery ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">No semesters match your search</p>
                        <Button variant="outline" onClick={() => setSearchQuery('')}>
                          Clear Search
                        </Button>
                      </div>
                    ) : filteredSemesters.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No semesters found</p>
                    ) : (
                      <div className="space-y-4">
                        {filteredSemesters.map((semester) => (
                          <Card key={semester.id} className={semester.is_current ? 'border-green-500' : ''}>
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold">{semester.name}</h3>
                                    {semester.is_current && (
                                      <Badge variant="default" className="bg-green-600">Current</Badge>
                                    )}
                                    <Badge variant={getStatusColor(semester.status)}>{semester.status}</Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{semester.academic_year}</p>
                                  <div className="flex gap-4 mt-2 text-sm">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      {formatDate(semester.start_date)} - {formatDate(semester.end_date)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/semesters/details/${semester.id}`)}
                                  >
                                    View Details
                                  </Button>
                                  {!semester.is_current && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSetAsCurrent(semester.id)}
                                    >
                                      Set as Current
                                    </Button>
                                  )}
                                  {(isSuperAdmin || user?.role === 'hostel_admin' || user?.role === 'custodian') && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteSemester(semester.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
