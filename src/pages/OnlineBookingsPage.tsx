import { useEffect, useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Calendar, 
  Search, 
  Mail, 
  Phone, 
  User, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  Loader2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

interface OnlineBooking {
  id: number;
  hostel_id: number;
  semester_id: number | null;
  semester_name?: string | null;
  student_name: string;
  student_email: string | null;
  student_phone: string;
  whatsapp: string | null;
  gender: string | null;
  registration_number: string | null;
  course: string | null;
  emergency_contact: string | null;
  preferred_check_in: string | null;
  stay_duration: string | null;
  room_id: number | null;
  room_number?: string | null;
  currency: string;
  booking_fee: number;
  amount_due: number;
  amount_paid: number;
  payment_status: string;
  status: string;
  verification_code: string | null;
  created_at: string;
  confirmed_at: string | null;
  source: string;
}

export default function OnlineBookingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<OnlineBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<OnlineBooking | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    if (user?.hostel_id || (user as any)?.role === 'custodian') {
      fetchBookings();
    }
  }, [user, page, statusFilter, paymentStatusFilter]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (paymentStatusFilter !== 'all') params.set('payment_status', paymentStatusFilter);
      if (user?.hostel_id) {
        params.set('hostel_id', String(user.hostel_id));
      }

      const response = await fetch(
        `${API_CONFIG.ENDPOINTS.BOOKINGS.LIST}?${params.toString()}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch online bookings');
      }

      const data = await response.json();
      if (data.success) {
        // Filter to only show online bookings (source = 'online')
        const onlineBookings = (data.data || []).filter((b: any) => 
          b.source === 'online' || !b.source // Include bookings without source field (legacy)
        );
        setBookings(onlineBookings);
        setTotalPages(data.totalPages || 1);
      } else {
        throw new Error(data.message || 'Failed to load bookings');
      }
    } catch (err) {
      console.error('Error fetching online bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load online bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return bookings;
    return bookings.filter((booking) => {
      const nameMatch = booking.student_name?.toLowerCase().includes(query);
      const emailMatch = booking.student_email?.toLowerCase().includes(query);
      const phoneMatch = booking.student_phone?.toLowerCase().includes(query);
      const regMatch = booking.registration_number?.toLowerCase().includes(query);
      return nameMatch || emailMatch || phoneMatch || regMatch;
    });
  }, [bookings, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'booked':
        return <Badge variant="default"><CheckCircle2 className="h-3 w-3 mr-1" />Booked</Badge>;
      case 'checked_in':
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Checked In</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      case 'no_show':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300"><AlertCircle className="h-3 w-3 mr-1" />No-Show</Badge>;
      case 'expired':
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge variant="default" className="bg-green-600">Paid</Badge>;
      case 'partial':
        return <Badge variant="secondary">Partial</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewDetails = (booking: OnlineBooking) => {
    setSelectedBooking(booking);
    setDetailsDialogOpen(true);
  };

  const handleCheckIn = (bookingId: number) => {
    const role = user?.role === 'hostel_admin' ? 'hostel-admin' : 'custodian';
    navigate(`/${role}/bookings?checkin=${bookingId}`);
  };

  const handleAddPayment = (bookingId: number) => {
    const role = user?.role === 'hostel_admin' ? 'hostel-admin' : 'custodian';
    navigate(`/${role}/bookings?payment=${bookingId}`);
  };

  const handleMarkNoShow = async (bookingId: number) => {
    if (!confirm('Mark this booking as no-show? This will release the room space and cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.BOOKINGS.CHECK_IN}/${bookingId}/mark-no-show`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Booking marked as no-show. Room space has been released.');
        fetchBookings(); // Refresh the list
      } else {
        alert(data.message || 'Failed to mark booking as no-show');
      }
    } catch (err) {
      console.error('Error marking booking as no-show:', err);
      alert('Failed to mark booking as no-show');
    }
  };

  if (!user?.hostel_id && (user as any)?.role !== 'custodian') {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No hostel assigned to your account.</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const bookedCount = bookings.filter(b => b.status === 'booked').length;
  const checkedInCount = bookings.filter(b => b.status === 'checked_in').length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Online Bookings</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-2">
              Track and manage students who booked online for follow-up and accountability
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Bookings</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Confirmed Bookings</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{bookedCount}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Checked In</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{checkedInCount}</p>
                </div>
                <User className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, email, phone, or registration number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border rounded-md bg-background text-foreground"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="booked">Booked</option>
                <option value="checked_in">Checked In</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
              <select
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border rounded-md bg-background text-foreground"
              >
                <option value="all">All Payment Status</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bookings List */}
        {!isLoading && !error && (
          <>
            {filteredBookings.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No online bookings found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? 'No bookings match your search criteria.' 
                        : 'No students have booked online yet.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredBookings.map((booking) => (
                  <Card key={booking.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 md:pt-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-base md:text-lg font-semibold text-foreground">
                                {booking.student_name}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {getStatusBadge(booking.status)}
                                {getPaymentStatusBadge(booking.payment_status)}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            {booking.student_email && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{booking.student_email}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4 flex-shrink-0" />
                              <span>{booking.student_phone}</span>
                            </div>
                            {booking.registration_number && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-4 w-4 flex-shrink-0" />
                                <span>{booking.registration_number}</span>
                              </div>
                            )}
                            {booking.room_number && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <span>Room: {booking.room_number}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Booking Fee: </span>
                              <span className="font-medium">{booking.booking_fee.toLocaleString()} {booking.currency}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Amount Due: </span>
                              <span className="font-medium">{booking.amount_due.toLocaleString()} {booking.currency}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Amount Paid: </span>
                              <span className="font-medium text-green-600">{booking.amount_paid.toLocaleString()} {booking.currency}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Booked: </span>
                              <span className="font-medium">{formatDate(booking.created_at)}</span>
                            </div>
                          </div>

                          {booking.verification_code && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Verification Code: </span>
                              <Badge variant="outline" className="font-mono">{booking.verification_code}</Badge>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 lg:flex-col">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(booking)}
                            className="w-full lg:w-auto"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {/* Only custodians can check in and add payments */}
                          {user?.role === 'custodian' && booking.status !== 'checked_in' && booking.status !== 'cancelled' && booking.status !== 'no_show' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleCheckIn(booking.id)}
                                className="w-full lg:w-auto"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Check In
                              </Button>
                              {booking.payment_status !== 'paid' && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleAddPayment(booking.id)}
                                  className="w-full lg:w-auto"
                                >
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Add Payment
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkNoShow(booking.id)}
                                className="w-full lg:w-auto border-orange-500 text-orange-600 hover:bg-orange-50"
                              >
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Mark No-Show
                              </Button>
                            </>
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
            <span className="text-sm text-muted-foreground">
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

        {/* Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>
                Complete information for {selectedBooking?.student_name}
              </DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg mb-3">Student Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{selectedBooking.student_name}</p>
                    </div>
                    {selectedBooking.student_email && (
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedBooking.student_email}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedBooking.student_phone}</p>
                    </div>
                    {selectedBooking.whatsapp && (
                      <div>
                        <p className="text-sm text-muted-foreground">WhatsApp</p>
                        <p className="font-medium">{selectedBooking.whatsapp}</p>
                      </div>
                    )}
                    {selectedBooking.registration_number && (
                      <div>
                        <p className="text-sm text-muted-foreground">Registration Number</p>
                        <p className="font-medium">{selectedBooking.registration_number}</p>
                      </div>
                    )}
                    {selectedBooking.course && (
                      <div>
                        <p className="text-sm text-muted-foreground">Course</p>
                        <p className="font-medium">{selectedBooking.course}</p>
                      </div>
                    )}
                    {selectedBooking.gender && (
                      <div>
                        <p className="text-sm text-muted-foreground">Gender</p>
                        <p className="font-medium capitalize">{selectedBooking.gender}</p>
                      </div>
                    )}
                    {selectedBooking.emergency_contact && (
                      <div>
                        <p className="text-sm text-muted-foreground">Emergency Contact</p>
                        <p className="font-medium">{selectedBooking.emergency_contact}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg mb-3">Booking Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Status</p>
                      <div className="mt-1">{getPaymentStatusBadge(selectedBooking.payment_status)}</div>
                    </div>
                    {selectedBooking.room_number && (
                      <div>
                        <p className="text-sm text-muted-foreground">Room</p>
                        <p className="font-medium">{selectedBooking.room_number}</p>
                      </div>
                    )}
                    {selectedBooking.semester_name && (
                      <div>
                        <p className="text-sm text-muted-foreground">Semester</p>
                        <p className="font-medium">{selectedBooking.semester_name}</p>
                      </div>
                    )}
                    {selectedBooking.preferred_check_in && (
                      <div>
                        <p className="text-sm text-muted-foreground">Preferred Check-in</p>
                        <p className="font-medium">{formatDateTime(selectedBooking.preferred_check_in)}</p>
                      </div>
                    )}
                    {selectedBooking.stay_duration && (
                      <div>
                        <p className="text-sm text-muted-foreground">Stay Duration</p>
                        <p className="font-medium">{selectedBooking.stay_duration}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg mb-3">Financial Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Booking Fee</p>
                      <p className="font-medium">{selectedBooking.booking_fee.toLocaleString()} {selectedBooking.currency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount Due</p>
                      <p className="font-medium">{selectedBooking.amount_due.toLocaleString()} {selectedBooking.currency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount Paid</p>
                      <p className="font-medium text-green-600">{selectedBooking.amount_paid.toLocaleString()} {selectedBooking.currency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className={`font-medium ${selectedBooking.amount_due - selectedBooking.amount_paid > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {(selectedBooking.amount_due - selectedBooking.amount_paid).toLocaleString()} {selectedBooking.currency}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Timeline</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Booking Created</p>
                      <p className="font-medium">{formatDateTime(selectedBooking.created_at)}</p>
                    </div>
                    {selectedBooking.confirmed_at && (
                      <div>
                        <p className="text-sm text-muted-foreground">Confirmed At</p>
                        <p className="font-medium">{formatDateTime(selectedBooking.confirmed_at)}</p>
                      </div>
                    )}
                    {selectedBooking.verification_code && (
                      <div>
                        <p className="text-sm text-muted-foreground">Verification Code</p>
                        <Badge variant="outline" className="font-mono mt-1">{selectedBooking.verification_code}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

