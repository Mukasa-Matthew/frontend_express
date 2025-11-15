import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { SemesterSelector } from '@/components/SemesterSelector';
import { Users, Search, Mail, Calendar, UserPlus, Edit, Trash2, Eye, Download, X, ShieldCheck, Phone, MapPin, GraduationCap, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

interface Student {
  id: number;
  name: string;
  email: string;
  created_at: string;
  total_amount?: number;
  amount_paid?: number;
  balance?: number;
  payment_count?: number;
  gender?: string;
  date_of_birth?: string;
  access_number?: string;
  phone?: string;
  whatsapp?: string;
  emergency_contact?: string;
  course?: string;
  room_number?: string;
}

interface SemesterSummary {
  id: number;
  name: string;
  academic_year: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  active_students: number;
  total_students: number;
}

export default function StudentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [semesterSummaries, setSemesterSummaries] = useState<SemesterSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [selectedSemesterLabel, setSelectedSemesterLabel] = useState('All semesters');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
  const [studentToView, setStudentToView] = useState<any>(null);
  const [verifyCodeDialogOpen, setVerifyCodeDialogOpen] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyError, setVerifyError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: '',
    date_of_birth: '',
    access_number: '',
    phone: '',
    whatsapp: '',
    emergency_contact: '',
    currency: 'UGX'
  });
  const limit = 20;

  useEffect(() => {
    if (user?.hostel_id) {
      fetchSemesterSummaries();
    }
  }, [user?.hostel_id]);

  useEffect(() => {
    if (user?.hostel_id) {
      fetchStudents();
    }
  }, [user, page, selectedSemesterId]);

  useEffect(() => {
    setPage(1);
  }, [selectedSemesterId]);

  const fetchSemesterSummaries = async () => {
    try {
      setSummaryLoading(true);
      setSummaryError('');

      const response = await fetch(API_CONFIG.ENDPOINTS.STUDENTS.SEMESTER_SUMMARY, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to load semester summary');
      }

      const data = await response.json();
      if (data.success) {
        // Map backend response to frontend format
        const summaries = Array.isArray(data.data) ? data.data.map((item: any) => ({
          id: item.id || item.semester_id,
          name: item.name || item.semester_name || 'Unnamed Semester',
          academic_year: item.academic_year,
          start_date: item.start_date,
          end_date: item.end_date,
          status: item.status || item.semester_status || 'active',
          active_students: item.active_enrollments || item.active_students || 0,
          total_students: item.total_enrollments || item.total_students || 0,
        })) : [];
        setSemesterSummaries(summaries);
      } else {
        throw new Error(data.message || 'Failed to load semester summary');
      }
    } catch (err) {
      console.error('Error fetching semester summary:', err);
      setSummaryError(err instanceof Error ? err.message : 'Failed to load semester summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      setError('');

      const semesterParam = selectedSemesterId ? `&semester_id=${selectedSemesterId}` : '';
      const response = await fetch(`${API_CONFIG.ENDPOINTS.STUDENTS.LIST}?page=${page}&limit=${limit}${semesterParam}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      if (data.success) {
        setStudents(data.data || []);
        // Use pagination from API response if available
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
        } else {
          // Fallback calculation
          setTotalPages(Math.ceil((data.data?.length || 0) / limit) || 1);
        }
      } else {
        throw new Error(data.message || 'Failed to load students');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) => {
      const nameMatch = student.name?.toLowerCase().includes(query);
      const emailMatch = student.email?.toLowerCase().includes(query);
      return nameMatch || emailMatch;
    });
  }, [students, searchQuery]);

  const hasSemesterFilter = selectedSemesterId !== null;

  const selectedSemesterSummary = useMemo(() => {
    if (!hasSemesterFilter) return null;
    return semesterSummaries.find((summary) => summary.id === selectedSemesterId) || null;
  }, [hasSemesterFilter, semesterSummaries, selectedSemesterId]);

  const totalActiveStudents = useMemo(
    () =>
      semesterSummaries.reduce(
        (sum, summary) => sum + Number(summary.active_students || 0),
        0
      ),
    [semesterSummaries]
  );

  const totalStudentsAcrossSemesters = useMemo(
    () =>
      semesterSummaries.reduce(
        (sum, summary) => sum + Number(summary.total_students || 0),
        0
      ),
    [semesterSummaries]
  );

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start && !end) return 'Dates TBD';
    const format = (value: string | null) => (value ? new Date(value).toLocaleDateString() : '—');
    return `${format(start)} – ${format(end)}`;
  };

  const handleSemesterChange = (
    semesterId: number | null,
    semester?: { name: string; academic_year?: string | null } | null
  ) => {
    setSelectedSemesterId(semesterId);
    if (semesterId === null || !semester) {
      setSelectedSemesterLabel('All semesters');
    } else {
      setSelectedSemesterLabel(`${semester.name} ${semester.academic_year ?? ''}`.trim());
    }
  };

  const handleSummaryCardClick = (summary: SemesterSummary) => {
    handleSemesterChange(summary.id, summary);
  };

  const handleResetSemesterFilter = () => {
    handleSemesterChange(null, null);
  };

  const handleExportCsv = () => {
    const headers = ['Name', 'Email', 'Registered On'];
    const rows = filteredStudents.map((student) => [
      `"${student.name.replace(/"/g, '""')}"`,
      `"${student.email.replace(/"/g, '""')}"`,
      new Date(student.created_at).toLocaleDateString(),
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const filenameBase = selectedSemesterLabel.toLowerCase().replace(/\s+/g, '_');
    const link = document.createElement('a');
    link.href = url;
    link.download = `students_${filenameBase || 'all'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const semesterStatusBadgeVariant = (status?: string | null) => {
    switch ((status || '').toLowerCase()) {
      case 'active':
        return 'default';
      case 'upcoming':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleEditClick = async (student: Student) => {
    try {
      // Fetch full student profile data
      const response = await fetch(`${API_CONFIG.ENDPOINTS.STUDENTS.LIST}/${student.id}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success && data.data) {
        const fullStudent = data.data;
        setEditingStudent(student);
        setFormData({
          name: fullStudent.name,
          email: fullStudent.email,
          gender: fullStudent.profile?.gender || '',
          date_of_birth: fullStudent.profile?.date_of_birth || '',
          access_number: fullStudent.profile?.access_number || '',
          phone: fullStudent.profile?.phone || '',
          whatsapp: fullStudent.profile?.whatsapp || '',
          emergency_contact: fullStudent.profile?.emergency_contact || '',
          currency: 'UGX'
        });
        setIsEditDialogOpen(true);
      }
    } catch (err) {
      console.error('Error loading student details:', err);
      setError('Failed to load student details');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      if (!editingStudent) {
        setError('Student registration is handled from the bookings page.');
        return;
      }

      const response = await fetch(`${API_CONFIG.ENDPOINTS.STUDENTS.UPDATE}/${editingStudent.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update student');
      }
      
      if (data.success) {
        setIsEditDialogOpen(false);
        setEditingStudent(null);
        setSuccess('Student updated successfully!');
        setFormData({
          name: '',
          email: '',
          gender: '',
          date_of_birth: '',
          access_number: '',
          phone: '',
          whatsapp: '',
          emergency_contact: '',
          currency: 'UGX'
        });
        fetchStudents();
      } else {
        throw new Error(data.message || 'Failed to update student');
      }
    } catch (err) {
      console.error('Error submitting student:', err);
      setError(err instanceof Error ? err.message : 'Failed to update student');
    }
  };

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    
    try {
      setError('');
      setSuccess('');
      
      const response = await fetch(`${API_CONFIG.ENDPOINTS.STUDENTS.DELETE}/${studentToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete student');
      }

      const data = await response.json();
      if (data.success) {
        setDeleteDialogOpen(false);
        setStudentToDelete(null);
        setSuccess('Student deleted successfully!');
        fetchStudents();
      } else {
        throw new Error(data.message || 'Failed to delete student');
      }
    } catch (err) {
      console.error('Error deleting student:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete student');
    }
  };

  const handleViewDetails = async (student: Student) => {
    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.STUDENTS.LIST}/${student.id}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success && data.data) {
        setStudentToView(data.data);
        setViewDetailsDialogOpen(true);
      }
    } catch (err) {
      console.error('Error loading student details:', err);
      setError('Failed to load student details');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim()) {
      setVerifyError('Please enter a verification code');
      return;
    }

    setVerifyLoading(true);
    setVerifyError('');
    setVerifyResult(null);

    try {
      const code = verifyCode.trim().toUpperCase();
      const response = await fetch(`${API_CONFIG.ENDPOINTS.BOOKINGS.VERIFY}/${code}`, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Verification code not found');
      }

      // If we have a booking, try to find the associated student
      if (data.data?.student_email) {
        // Search for student by email
        const studentResponse = await fetch(
          `${API_CONFIG.ENDPOINTS.STUDENTS.LIST}?search=${encodeURIComponent(data.data.student_email)}`,
          { headers: getAuthHeaders() }
        );
        const studentData = await studentResponse.json();
        if (studentData.success && studentData.data?.length > 0) {
          setVerifyResult({
            booking: data.data,
            student: studentData.data[0],
          });
        } else {
          setVerifyResult({ booking: data.data });
        }
      } else {
        setVerifyResult({ booking: data.data });
      }
    } catch (err) {
      console.error('Error verifying code:', err);
      setVerifyError(err instanceof Error ? err.message : 'Failed to verify code');
    } finally {
      setVerifyLoading(false);
    }
  };

  if (!user?.hostel_id) {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No hostel assigned to your account.</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Students</h1>
            <p className="text-sm md:text-base text-gray-600 mt-2">Manage and view all students in your hostel</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <SemesterSelector
              hostelId={user.hostel_id}
              selectedSemesterId={selectedSemesterId}
              includeAllOption
              onSemesterChange={handleSemesterChange}
            />
            <Button
              variant="outline"
              onClick={handleExportCsv}
              disabled={filteredStudents.length === 0}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            {/* Only custodians can create new bookings */}
            {user?.role === 'custodian' && (
              <Button
                onClick={() => {
                  navigate(`/custodian/bookings?create=1`);
                }}
                className="w-full sm:w-auto"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
            )}
          </div>
        </div>

        {/* Prominent Search Bar */}
        <Card className="border-2 border-primary/20 shadow-md">
          <CardContent className="pt-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search students by name, email, phone, or registration number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              {/* Only custodians can verify codes */}
              {user?.role === 'custodian' && (
                <Button
                  variant="outline"
                  onClick={() => setVerifyCodeDialogOpen(true)}
                  className="w-full sm:w-auto border-primary/30 hover:bg-primary/5"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Verify Code
                </Button>
              )}
              {searchQuery && (
                <p className="text-sm text-gray-600 flex items-center">
                  Found {filteredStudents.length} student{filteredStudents.length === 1 ? '' : 's'} matching "{searchQuery}"
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Enrolments by Semester</h2>
                <p className="text-sm text-gray-600">
                  Review every cohort in your hostel and tap a semester to drill into the student list.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={hasSemesterFilter ? 'default' : 'outline'} className="uppercase tracking-wide">
                  {selectedSemesterLabel}
                </Badge>
                {hasSemesterFilter && (
                  <Button variant="outline" size="sm" onClick={handleResetSemesterFilter}>
                    Clear filter
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">Active students</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{totalActiveStudents}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">Total enrolled</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{totalStudentsAcrossSemesters}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">Tracked semesters</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{semesterSummaries.length}</p>
              </div>
            </div>

            {summaryError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{summaryError}</AlertDescription>
              </Alert>
            )}

            {summaryLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
              </div>
            ) : semesterSummaries.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                No semester enrolments recorded yet. Once bookings are assigned to a semester, they will appear here.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {semesterSummaries.map((summary) => {
                  const isSelected = selectedSemesterId === summary.id;
                  return (
                    <button
                      type="button"
                      key={summary.id}
                      onClick={() => handleSummaryCardClick(summary)}
                      className={`group h-full rounded-xl border p-5 text-left transition ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{summary.name}</p>
                          <p className="text-xs text-slate-500">
                            {summary.academic_year ? `AY ${summary.academic_year}` : 'Academic year TBD'}
                          </p>
                        </div>
                        <Badge variant={semesterStatusBadgeVariant(summary.status)}>
                          {summary.status ?? 'unspecified'}
                        </Badge>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs uppercase text-slate-500">Active</p>
                          <p className="mt-1 text-lg font-semibold text-slate-900">{summary.active_students}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-slate-500">Total</p>
                          <p className="mt-1 text-lg font-semibold text-slate-900">{summary.total_students}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-xs text-slate-500">{formatDateRange(summary.start_date, summary.end_date)}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success Message */}
        {success && (
          <Alert className="border-green-500 bg-green-50 animate-fade-in">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-1">
          <p className="text-sm text-gray-600">
            Showing {filteredStudents.length} student{filteredStudents.length === 1 ? '' : 's'}{' '}
            {hasSemesterFilter ? `for ${selectedSemesterLabel}` : 'across all semesters'}.
          </p>
          {hasSemesterFilter && selectedSemesterSummary && (
            <p className="text-xs text-gray-500">
              Semester overview: {selectedSemesterSummary.active_students} active enrolments,{' '}
              {selectedSemesterSummary.total_students} total records.
            </p>
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

        {/* Error State */}
        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Students List */}
        {!isLoading && !error && (
          <>
            {filteredStudents.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
                    <p className="text-gray-600">
                      {searchQuery 
                        ? 'No students match your search criteria.' 
                        : 'No students are currently registered in this hostel.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredStudents.map((student) => (
                  <Card key={student.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 md:pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex items-start space-x-3 md:space-x-4">
                          <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Users className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-3">
                            <div>
                              <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">{student.name}</h3>
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs md:text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                                  <span className="truncate">{student.email}</span>
                                </span>
                                {student.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                                    <span className="truncate">{student.phone}</span>
                                  </span>
                                )}
                                {student.whatsapp && (
                                  <span className="flex items-center gap-1">
                                    <span className="truncate">WhatsApp: {student.whatsapp}</span>
                                  </span>
                                )}
                                {student.access_number && (
                                  <span className="flex items-center gap-1">
                                    <GraduationCap className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                                    <span className="truncate">{student.access_number}</span>
                                  </span>
                                )}
                                {student.course && (
                                  <span className="flex items-center gap-1">
                                    <span className="truncate">{student.course}</span>
                                  </span>
                                )}
                                {student.room_number && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                                    <span className="truncate">Room: {student.room_number}</span>
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                                  {new Date(student.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            
                            {(student.gender || student.date_of_birth || student.emergency_contact) && (
                              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                {student.gender && (
                                  <span>Gender: <span className="font-medium capitalize">{student.gender}</span></span>
                                )}
                                {student.date_of_birth && (
                                  <span>DOB: <span className="font-medium">{new Date(student.date_of_birth).toLocaleDateString()}</span></span>
                                )}
                                {student.emergency_contact && (
                                  <span>Emergency: <span className="font-medium">{student.emergency_contact}</span></span>
                                )}
                              </div>
                            )}

                            {(student.balance !== undefined || student.amount_paid !== undefined) && (
                              <div className="flex flex-wrap gap-2 text-xs">
                                {student.total_amount !== undefined && (
                                  <Badge variant="outline" className="text-xs">
                                    Total: {student.total_amount.toLocaleString()} UGX
                                  </Badge>
                                )}
                                {student.amount_paid !== undefined && (
                                  <Badge variant="outline" className="text-xs text-green-600">
                                    Paid: {student.amount_paid.toLocaleString()} UGX
                                  </Badge>
                                )}
                                {student.balance !== undefined && (
                                  <Badge variant={student.balance > 0 ? "destructive" : "default"} className="text-xs">
                                    Balance: {student.balance.toLocaleString()} UGX
                                  </Badge>
                                )}
                                {student.payment_count !== undefined && student.payment_count > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {student.payment_count} payment{student.payment_count > 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(student)}
                            className="flex-1 sm:flex-none"
                          >
                            <Eye className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditClick(student)}
                            className="flex-1 sm:flex-none"
                          >
                            <Edit className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          {/* Only show delete button for hostel_admin and super_admin */}
                          {(user?.role === 'hostel_admin' || user?.role === 'super_admin') && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteClick(student)}
                              className="flex-1 sm:flex-none"
                            >
                              <Trash2 className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Delete</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <Button 
              variant="outline" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {/* Edit Student Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingStudent(null);
            setFormData({
              name: '',
              email: '',
              gender: '',
              date_of_birth: '',
              access_number: '',
              phone: '',
              whatsapp: '',
              emergency_contact: '',
              currency: 'UGX'
            });
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
              <DialogDescription>Update student information. All fields marked with * are required.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="access_number">Registration Number</Label>
                  <Input
                    id="access_number"
                    value={formData.access_number}
                    onChange={(e) => setFormData({ ...formData, access_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="emergency_contact">Emergency Contact</Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingStudent(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!editingStudent}>
                  Update Student
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Student</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {studentToDelete?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="destructive"
                onClick={handleDeleteConfirm}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={viewDetailsDialogOpen} onOpenChange={setViewDetailsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Student Details</DialogTitle>
              <DialogDescription>
                Complete information for {studentToView?.name}
              </DialogDescription>
            </DialogHeader>
            {studentToView && (
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg mb-3">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Full Name</Label>
                      <p className="font-medium">{studentToView.name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Email</Label>
                      <p className="font-medium">{studentToView.email}</p>
                    </div>
                  </div>
                </div>
                {studentToView.profile && (
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-3">Profile Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {studentToView.profile.gender && (
                        <div>
                          <Label className="text-gray-600">Gender</Label>
                          <p className="font-medium capitalize">{studentToView.profile.gender}</p>
                        </div>
                      )}
                      {studentToView.profile.date_of_birth && (
                        <div>
                          <Label className="text-gray-600">Date of Birth</Label>
                          <p className="font-medium">{new Date(studentToView.profile.date_of_birth).toLocaleDateString()}</p>
                        </div>
                      )}
                      {studentToView.profile.access_number && (
                        <div>
                          <Label className="text-gray-600">Registration Number</Label>
                          <p className="font-medium">{studentToView.profile.access_number}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {studentToView.profile && (
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-3">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {studentToView.profile.phone && (
                        <div>
                          <Label className="text-gray-600">Phone</Label>
                          <p className="font-medium">{studentToView.profile.phone}</p>
                        </div>
                      )}
                      {studentToView.profile.whatsapp && (
                        <div>
                          <Label className="text-gray-600">WhatsApp</Label>
                          <p className="font-medium">{studentToView.profile.whatsapp}</p>
                        </div>
                      )}
                      {studentToView.profile.emergency_contact && (
                        <div className="md:col-span-2">
                          <Label className="text-gray-600">Emergency Contact</Label>
                          <p className="font-medium">{studentToView.profile.emergency_contact}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="pb-4">
                  <h3 className="font-semibold text-lg mb-3">Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Student ID</Label>
                      <p className="font-medium">{studentToView.id}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Date Registered</Label>
                      <p className="font-medium">{new Date(studentToView.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setViewDetailsDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Verify Code Dialog */}
        <Dialog open={verifyCodeDialogOpen} onOpenChange={(open) => {
          setVerifyCodeDialogOpen(open);
          if (!open) {
            setVerifyCode('');
            setVerifyResult(null);
            setVerifyError('');
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Verify Student by Code</DialogTitle>
              <DialogDescription>
                Enter a verification code to find and view student booking information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <Label htmlFor="verifyCode">Verification Code</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="verifyCode"
                    type="text"
                    placeholder="Enter verification code (e.g., ABC123)"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                    className="flex-1 font-mono text-lg tracking-wider"
                    autoFocus
                  />
                  <Button type="submit" disabled={!verifyCode.trim() || verifyLoading}>
                    {verifyLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Verify
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {verifyError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{verifyError}</AlertDescription>
                </Alert>
              )}

              {verifyResult && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-lg">Verification Result</h3>
                  
                  {verifyResult.booking && (
                    <div className="space-y-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Booking Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-blue-700 font-medium">Student Name</p>
                            <p className="text-blue-900">{verifyResult.booking.student_name}</p>
                          </div>
                          {verifyResult.booking.student_email && (
                            <div>
                              <p className="text-blue-700 font-medium">Email</p>
                              <p className="text-blue-900">{verifyResult.booking.student_email}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-blue-700 font-medium">Phone</p>
                            <p className="text-blue-900">{verifyResult.booking.student_phone}</p>
                          </div>
                          {verifyResult.booking.room_number && (
                            <div>
                              <p className="text-blue-700 font-medium">Room</p>
                              <p className="text-blue-900">{verifyResult.booking.room_number}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-blue-700 font-medium">Status</p>
                            <Badge variant="default">{verifyResult.booking.status}</Badge>
                          </div>
                          <div>
                            <p className="text-blue-700 font-medium">Payment Status</p>
                            <Badge variant={verifyResult.booking.payment_status === 'paid' ? 'default' : 'outline'}>
                              {verifyResult.booking.payment_status}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-blue-700 font-medium">Amount Paid</p>
                            <p className="text-blue-900 font-semibold">
                              {parseFloat(verifyResult.booking.amount_paid || '0').toLocaleString()} {verifyResult.booking.currency || 'UGX'}
                            </p>
                          </div>
                          <div>
                            <p className="text-blue-700 font-medium">Amount Due</p>
                            <p className="text-blue-900 font-semibold">
                              {parseFloat(verifyResult.booking.amount_due || '0').toLocaleString()} {verifyResult.booking.currency || 'UGX'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <p className="text-blue-700 font-medium text-sm">Verification Code</p>
                          <Badge variant="outline" className="font-mono text-lg mt-1">
                            {verifyResult.booking.verification_code}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {verifyResult.student && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2">Registered Student Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-green-700 font-medium">Name</p>
                          <p className="text-green-900">{verifyResult.student.name}</p>
                        </div>
                        <div>
                          <p className="text-green-700 font-medium">Email</p>
                          <p className="text-green-900">{verifyResult.student.email}</p>
                        </div>
                        {verifyResult.student.phone && (
                          <div>
                            <p className="text-green-700 font-medium">Phone</p>
                            <p className="text-green-900">{verifyResult.student.phone}</p>
                          </div>
                        )}
                        {verifyResult.student.access_number && (
                          <div>
                            <p className="text-green-700 font-medium">Registration Number</p>
                            <p className="text-green-900">{verifyResult.student.access_number}</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setVerifyCodeDialogOpen(false);
                            handleViewDetails(verifyResult.student);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Full Student Details
                        </Button>
                      </div>
                    </div>
                  )}

                  {verifyResult.booking && (
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        onClick={() => {
                          setVerifyCodeDialogOpen(false);
                          const role = user?.role === 'hostel_admin' ? 'hostel-admin' : 'custodian';
                          navigate(`/${role}/bookings?highlight=${verifyResult.booking.id}`);
                        }}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Booking Details
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

