import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { SemesterSelector } from '@/components/SemesterSelector';
import { Users, Search, Mail, Calendar, UserPlus, Bed, Edit, Trash2, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Student {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface Room {
  id: number;
  room_number: string;
  price: number;
}

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
  const [studentToView, setStudentToView] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: '',
    date_of_birth: '',
    access_number: '',
    phone: '',
    whatsapp: '',
    emergency_contact: '',
    room_id: '',
    initial_payment_amount: '',
    currency: 'UGX'
  });
  const limit = 20;

  useEffect(() => {
    if (user?.hostel_id) {
      fetchStudents();
      fetchAvailableRooms();
    }
  }, [user, page, selectedSemesterId]);

  const fetchAvailableRooms = async () => {
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.ROOMS.AVAILABLE, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRooms(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
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
        // Simple pagination calculation - adjust based on your API response
        setTotalPages(Math.ceil((data.data?.length || 0) / limit) || 1);
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

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          room_id: '',
          initial_payment_amount: '',
          currency: 'UGX'
        });
        setIsDialogOpen(true);
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

      // Validate required fields only for new student creation
      if (!editingStudent) {
        if (!formData.room_id) {
          setError('Please select a room for the student');
          return;
        }
        if (!formData.initial_payment_amount || parseFloat(formData.initial_payment_amount) <= 0) {
          setError('Please enter a booking fee amount');
          return;
        }
      }

      const url = editingStudent 
        ? `${API_CONFIG.ENDPOINTS.STUDENTS.UPDATE}/${editingStudent.id}`
        : API_CONFIG.ENDPOINTS.STUDENTS.CREATE;
      const method = editingStudent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || (editingStudent ? 'Failed to update student' : 'Failed to create student'));
      }
      
      if (data.success) {
        setIsDialogOpen(false);
        setEditingStudent(null);
        setSuccess(editingStudent ? 'Student updated successfully!' : 'Student registered successfully!');
        setFormData({
          name: '',
          email: '',
          gender: '',
          date_of_birth: '',
          access_number: '',
          phone: '',
          whatsapp: '',
          emergency_contact: '',
          room_id: '',
          initial_payment_amount: '',
          currency: 'UGX'
        });
        fetchStudents();
        fetchAvailableRooms(); // Refresh available rooms
      } else {
        throw new Error(data.message || (editingStudent ? 'Failed to update student' : 'Failed to create student'));
      }
    } catch (err) {
      console.error('Error submitting student:', err);
      setError(err instanceof Error ? err.message : (editingStudent ? 'Failed to update student' : 'Failed to create student'));
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
              onSemesterChange={setSelectedSemesterId}
            />
            <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
              <UserPlus className="h-4 w-4 mr-2" />
              Register Student
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <Alert className="border-green-500 bg-green-50 animate-fade-in">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search students by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

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
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">{student.name}</h3>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-xs md:text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                                <span className="truncate">{student.email}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                                {new Date(student.created_at).toLocaleDateString()}
                              </span>
                            </div>
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
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteClick(student)}
                            className="flex-1 sm:flex-none"
                          >
                            <Trash2 className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
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

        {/* Register Student Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
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
              room_id: '',
              initial_payment_amount: '',
              currency: 'UGX'
            });
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStudent ? 'Edit Student' : 'Register New Student'}</DialogTitle>
              <DialogDescription>
                {editingStudent 
                  ? 'Update student information. All fields marked with * are required.'
                  : 'Register a new student for this hostel. All fields marked with * are required.'}
              </DialogDescription>
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

              {!editingStudent && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Bed className="h-4 w-4" />
                    Room Assignment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="room_id">Select Room *</Label>
                      <Select
                        value={formData.room_id}
                        onValueChange={(value) => setFormData({ ...formData, room_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a room" />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms.length === 0 ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              No available rooms
                            </div>
                          ) : (
                            rooms.map((room) => (
                              <SelectItem key={room.id} value={room.id.toString()}>
                                {room.room_number} - UGX {room.price.toLocaleString()}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
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
                          <SelectItem value="UGX">UGX</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {formData.room_id && (
                    <div className="mt-3">
                      <Label htmlFor="initial_payment_amount">Booking Fee *</Label>
                      <Input
                        id="initial_payment_amount"
                        type="number"
                        step="0.01"
                        value={formData.initial_payment_amount}
                        onChange={(e) => setFormData({ ...formData, initial_payment_amount: e.target.value })}
                        placeholder="Enter booking fee"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Every student must pay a booking fee before the next semester
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingStudent ? 'Update Student' : 'Register Student'}</Button>
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
      </div>
    </Layout>
  );
}

