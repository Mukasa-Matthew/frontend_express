import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Users, Send, Search, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SemesterSelector } from '@/components/SemesterSelector';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface Student {
  id: number;
  name: string;
  email: string;
}

export default function MessagingPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [messageType, setMessageType] = useState<'single' | 'broadcast'>('broadcast');
  const [messageData, setMessageData] = useState({
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.hostel_id) {
      fetchStudents();
    }
  }, [user, selectedSemesterId]);

  const fetchStudents = async () => {
    if (!user?.hostel_id) return;

    try {
      setIsLoading(true);
      setError('');
      
      const semesterParam = selectedSemesterId ? `?semester_id=${selectedSemesterId}` : '';
      const response = await fetch(`${API_CONFIG.ENDPOINTS.STUDENTS.LIST}${semesterParam}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setStudents(data.data || []);
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

  const handleOpenDialog = (student?: Student) => {
    if (student) {
      setSelectedStudent(student);
      setMessageType('single');
    } else {
      setSelectedStudent(null);
      setMessageType('broadcast');
    }
    setMessageData({ subject: '', message: '' });
    setIsDialogOpen(true);
  };

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');

      const payload: any = {
        subject: messageData.subject,
        message: messageData.message
      };

      // Add semester_id if selected
      if (selectedSemesterId) {
        payload.semester_id = selectedSemesterId;
      }

      // Add user_id if sending to single student
      if (messageType === 'single' && selectedStudent) {
        payload.user_id = selectedStudent.id;
      }

      const response = await fetch(API_CONFIG.ENDPOINTS.STUDENTS.NOTIFY, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        setIsDialogOpen(false);
        setMessageData({ subject: '', message: '' });
        setSelectedStudent(null);
        const recipientCount = data.data?.sent || 0;
        setSuccess(
          messageType === 'single'
            ? `Email sent successfully to ${selectedStudent?.name}!`
            : `Broadcast email sent successfully to ${recipientCount} student${recipientCount !== 1 ? 's' : ''}!`
        );
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      } else {
        throw new Error(data.message || 'Failed to send email');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Messaging</h1>
            <p className="text-sm md:text-base text-gray-600 mt-2">Send emails to students</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <SemesterSelector 
              hostelId={user?.hostel_id || null}
              onSemesterChange={setSelectedSemesterId}
            />
            <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
              <Mail className="h-4 w-4 mr-2" />
              Compose Email
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <Alert className="border-green-500 bg-green-50 animate-fade-in">
            <Mail className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-blue-900">Total Students</p>
                  <p className="text-xl md:text-2xl font-bold text-blue-600">
                    {students.length}
                  </p>
                  {selectedSemesterId && (
                    <p className="text-xs text-blue-700 mt-1">in selected semester</p>
                  )}
                </div>
                <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-green-900">Quick Broadcast</p>
                  <p className="text-xs md:text-sm text-green-700 mt-1">
                    Send to all students at once
                  </p>
                </div>
                <Mail className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-purple-900">Individual Email</p>
                  <p className="text-xs md:text-sm text-purple-700 mt-1">
                    Send to a specific student
                  </p>
                </div>
                <Send className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle>Students Directory</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 md:pt-6">
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search students by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No students found</p>
                {selectedSemesterId && (
                  <p className="text-xs md:text-sm text-gray-400 mt-2">
                    There are no students enrolled in the selected semester
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Student</th>
                        <th className="text-left py-3 px-4 font-semibold">Email</th>
                        <th className="text-right py-3 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{student.name}</td>
                          <td className="py-3 px-4">{student.email}</td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDialog(student)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Email
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden grid grid-cols-1 gap-4">
                  {filteredStudents.map((student) => (
                    <Card key={student.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{student.name}</h3>
                              <p className="text-xs text-gray-600">{student.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(student)}
                            className="w-full"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Send Email
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compose Email Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {messageType === 'single' ? `Email to ${selectedStudent?.name}` : 'Broadcast Email'}
              </DialogTitle>
              <DialogDescription>
                {messageType === 'single'
                  ? `Send an email to ${selectedStudent?.name}`
                  : `Send a broadcast email to all students in the ${selectedSemesterId ? 'selected semester' : 'current hostel'}`
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitMessage} className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={messageData.subject}
                  onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })}
                  placeholder="Enter email subject"
                  required
                />
              </div>
              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={messageData.message}
                  onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
                  placeholder="Type your message here..."
                  rows={8}
                  required
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Be professional and clear in your communication
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Recipient(s)</p>
                    <p className="text-sm text-blue-700">
                      {messageType === 'single'
                        ? `This email will be sent to ${selectedStudent?.name} (${selectedStudent?.email})`
                        : `This broadcast email will be sent to ${students.length} student${students.length !== 1 ? 's' : ''} in the ${selectedSemesterId ? 'selected semester' : 'current hostel'}`
                      }
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}


