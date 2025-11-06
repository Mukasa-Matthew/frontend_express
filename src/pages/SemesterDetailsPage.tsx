import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { ArrowLeft, Users, TrendingUp, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

interface Semester {
  id: number;
  hostel_id: number;
  name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
}

interface SemesterStats {
  semester_id: number;
  semester_name: string;
  total_students: number;
  active_students: number;
  completed_students: number;
  total_revenue: number;
  total_payments: number;
  outstanding_balance: number;
  occupancy_rate: number;
}

interface SemesterEnrollment {
  id: number;
  semester_id: number;
  user_id: number;
  room_id: number | null;
  enrollment_date: string;
  enrollment_status: 'active' | 'completed' | 'dropped' | 'transferred';
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined user data
  user_name?: string;
  user_email?: string;
  room_number?: string;
}

export default function SemesterDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  useAuth();
  const [semester, setSemester] = useState<Semester | null>(null);
  const [stats, setStats] = useState<SemesterStats | null>(null);
  const [enrollments, setEnrollments] = useState<SemesterEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchSemester();
      fetchStats();
      fetchEnrollments();
    }
  }, [id]);

  const fetchSemester = async () => {
    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.SEMESTERS.GET}/${id}`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        setSemester(data.semester);
      } else {
        setError(data.message || 'Failed to fetch semester');
      }
    } catch (err) {
      console.error('Error fetching semester:', err);
      setError('Failed to fetch semester');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.SEMESTERS.STATS}/${id}/stats`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.SEMESTERS.ENROLLMENTS}/${id}/enrollments`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        setEnrollments(data.enrollments || []);
      }
    } catch (err) {
      console.error('Error fetching enrollments:', err);
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

  const getEnrollmentStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'dropped':
        return 'destructive';
      case 'transferred':
        return 'outline';
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (error && !semester) {
    return (
      <Layout>
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => navigate('/semesters')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Semesters
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/semesters')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Semesters
          </Button>
        </div>

        {semester && (
          <>
            {/* Semester Info */}
            <Card className="border-green-500 bg-green-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-green-900 text-2xl">{semester.name}</CardTitle>
                    <CardDescription className="text-gray-700 mt-1">
                      Academic Year: {semester.academic_year}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {semester.is_current && (
                      <Badge variant="default" className="bg-green-600">Current Semester</Badge>
                    )}
                    <Badge variant={getStatusColor(semester.status)}>{semester.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="text-lg font-semibold">{formatDate(semester.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">End Date</p>
                    <p className="text-lg font-semibold">{formatDate(semester.end_date)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Students</p>
                        <p className="text-3xl font-bold">{stats.total_students}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-4 text-sm">
                      <span className="text-green-600">{stats.active_students} active</span>
                      {' / '}
                      <span className="text-gray-600">{stats.completed_students} completed</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-3xl font-bold">{formatCurrency(stats.total_revenue)}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                      {stats.total_payments} payments
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Outstanding</p>
                        <p className="text-3xl font-bold">{formatCurrency(stats.outstanding_balance)}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Occupancy</p>
                        <p className="text-3xl font-bold">{stats.occupancy_rate.toFixed(1)}%</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Enrollments */}
            <Card>
              <CardHeader>
                <CardTitle>Student Enrollments</CardTitle>
                <CardDescription>List of students enrolled in this semester</CardDescription>
              </CardHeader>
              <CardContent>
                {enrollments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No enrollments found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Student Name</th>
                          <th className="text-left py-2 px-4">Email</th>
                          <th className="text-left py-2 px-4">Room</th>
                          <th className="text-left py-2 px-4">Enrollment Date</th>
                          <th className="text-left py-2 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrollments.map((enrollment) => (
                          <tr key={enrollment.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-4">{enrollment.user_name || 'N/A'}</td>
                            <td className="py-2 px-4">{enrollment.user_email || 'N/A'}</td>
                            <td className="py-2 px-4">
                              {enrollment.room_number ? (
                                <Badge variant="outline">{enrollment.room_number}</Badge>
                              ) : (
                                <span className="text-gray-400">Not assigned</span>
                              )}
                            </td>
                            <td className="py-2 px-4">{formatDate(enrollment.enrollment_date)}</td>
                            <td className="py-2 px-4">
                              <Badge variant={getEnrollmentStatusColor(enrollment.enrollment_status)}>
                                {enrollment.enrollment_status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}




