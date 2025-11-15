import React, { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Booking {
  id: number;
  student_name: string;
  student_email: string | null;
  student_phone: string;
  room_number: string | null;
  booking_fee: number;
  amount_due: number;
  payment_status: string;
  status: string;
  created_at: string;
  verification_code: string | null;
  source?: string; // 'online' or 'on_site'
}

export const BookingNotifications: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Check if user should see notifications (hostel_admin or custodian)
  const shouldShowNotifications = user?.role === 'hostel_admin' || (user as any)?.role === 'custodian';

  const fetchPendingBookings = useCallback(async () => {
    if (!shouldShowNotifications) return;

    // Get hostel_id - for custodians, it might be in user.hostel_id or we need to fetch it
    let hostelId = user?.hostel_id;
    
    // If no hostel_id and user is custodian, try to fetch it
    if (!hostelId && (user as any)?.role === 'custodian') {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/custodians/my-hostel`, {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.hostel_id) {
            hostelId = data.data.hostel_id;
          }
        }
      } catch (error) {
        console.error('Error fetching custodian hostel:', error);
      }
    }

    if (!hostelId) return;

    try {
      setIsLoading(true);
      // Fetch all bookings (we'll filter on frontend to show pending and recent online bookings)
      const response = await fetch(
        `${API_CONFIG.ENDPOINTS.BOOKINGS.LIST}?limit=50&hostel_id=${hostelId}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      if (data.success) {
        // Get all bookings from the response
        const allBookings = data.data || [];
        
        // Filter to show:
        // 1. All pending bookings (status = 'pending') - both online and on-site
        // 2. Recent online bookings (within last 7 days) regardless of status
        const relevantBookings = allBookings.filter((booking: Booking) => {
          // Show all pending bookings
          if (booking.status === 'pending') return true;
          
          // Show recent online bookings (within last 7 days)
          if (booking.source === 'online') {
            const bookingDate = new Date(booking.created_at);
            const daysAgo = (Date.now() - bookingDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysAgo <= 7;
          }
          
          return false;
        });
        
        // Sort by created_at (newest first) and limit to 10 most recent
        const sortedBookings = relevantBookings
          .sort((a: Booking, b: Booking) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10);
        
        setPendingBookings(sortedBookings);
        setPendingCount(sortedBookings.length);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [shouldShowNotifications, user]);

  useEffect(() => {
    if (shouldShowNotifications) {
      fetchPendingBookings();
      // Refresh every 30 seconds
      const interval = setInterval(fetchPendingBookings, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchPendingBookings, shouldShowNotifications]);

  const handleBookingClick = (bookingId: number) => {
    setIsOpen(false);
    // Navigate to bookings page with the specific booking
    const role = user?.role === 'hostel_admin' ? 'hostel-admin' : 'custodian';
    navigate(`/${role}/bookings?highlight=${bookingId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (!shouldShowNotifications) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-lg hover:bg-accent"
        >
          <Bell className="h-5 w-5" />
          {pendingCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-600"
            >
              {pendingCount > 9 ? '9+' : pendingCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">Booking Notifications</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {pendingCount === 0
              ? 'No pending bookings'
              : `${pendingCount} pending booking${pendingCount > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : pendingBookings.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No pending bookings at this time
            </div>
          ) : (
            <div className="divide-y">
              {pendingBookings.map((booking) => (
                <button
                  key={booking.id}
                  onClick={() => handleBookingClick(booking.id)}
                  className="w-full text-left p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {booking.student_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {booking.student_phone}
                      </p>
                      {booking.room_number && (
                        <p className="text-xs text-muted-foreground">
                          Room: {booking.room_number}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {booking.source === 'online' && (
                          <Badge variant="secondary" className="text-xs">
                            Online
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            booking.payment_status === 'paid'
                              ? 'border-green-500 text-green-700'
                              : 'border-yellow-500 text-yellow-700'
                          )}
                        >
                          {booking.payment_status === 'paid' ? 'Paid' : 'Pending Payment'}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            booking.status === 'pending'
                              ? 'border-orange-500 text-orange-700'
                              : booking.status === 'confirmed'
                              ? 'border-blue-500 text-blue-700'
                              : 'border-gray-500 text-gray-700'
                          )}
                        >
                          {booking.status === 'pending' ? 'Pending' : booking.status === 'confirmed' ? 'Confirmed' : booking.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(booking.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {pendingBookings.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                setIsOpen(false);
                const role = user?.role === 'hostel_admin' ? 'hostel-admin' : 'custodian';
                navigate(`/${role}/bookings`);
              }}
            >
              View All Bookings
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

