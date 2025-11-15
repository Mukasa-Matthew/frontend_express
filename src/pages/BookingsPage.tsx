import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Banknote,
  CheckCircle2,
  CircleSlash,
  ClipboardCopy,
  DollarSign,
  Loader2,
  Plus,
  QrCode,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface Booking {
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
  room_capacity?: number | null;
  currency: string;
  booking_fee: number;
  amount_due: number;
  amount_paid: number;
  payment_status: string;
  status: string;
  verification_code: string | null;
  verification_issued_at: string | null;
  created_at: string;
  latest_payment_method?: string | null;
  latest_payment_amount?: number | null;
  latest_payment_status?: string | null;
  latest_payment_reference?: string | null;
  latest_payment_recorded_at?: string | null;
  payment_phone?: string | null;
}

interface SemesterOption {
  id: number;
  name: string;
  academic_year?: string | null;
  start_date: string;
  end_date: string;
  status: string;
}

interface RoomOption {
  id: number;
  room_number: string;
  capacity: number;
  available_spaces: number;
  price?: number | null;
}

interface BookingDetailResponse {
  booking: Booking;
  payments: Array<{
    id: number;
    amount: number;
    method: string;
    status: string;
    reference: string | null;
    notes: string | null;
    recorded_by_user_id: number | null;
    recorded_by_name?: string | null;
    recorded_by_email?: string | null;
    recorded_at: string;
  }>;
}

interface HostelOption {
  id: number;
  name: string;
}

type BadgeVariant = 'secondary' | 'default' | 'destructive' | 'outline';

const statusBadgeVariant = (status: string): BadgeVariant => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'secondary';
    case 'booked':
      return 'default';
    case 'checked_in':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
};

const paymentStatusBadgeVariant = (status: string): BadgeVariant => {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'default';
    case 'partial':
      return 'secondary';
    case 'pending':
    default:
      return 'outline';
  }
};

const formatCurrency = (amount: number, currency = 'UGX') => {
  try {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toLocaleString()}`;
  }
};

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return '—';
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const paymentMethodOptions: Array<{
  value: 'cash' | 'mobile_money' | 'none';
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    value: 'cash',
    label: 'Cash at desk',
    description: 'Log payments collected immediately from the student.',
    icon: Banknote,
  },
  {
    value: 'mobile_money',
    label: 'Mobile money request',
    description: 'Send an STK push and track confirmation in RooMio.',
    icon: Smartphone,
  },
  {
    value: 'none',
    label: 'No upfront payment',
    description: 'Confirm the booking without recording money right now.',
    icon: CircleSlash,
  },
];

const BookingsPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const userHostelId = (user as any)?.hostel_id ?? null;
  const isSuperAdmin = user?.role === 'super_admin';

  const [hostels, setHostels] = useState<HostelOption[]>([]);
  const [selectedHostelId, setSelectedHostelId] = useState<string>('');

  const effectiveHostelId = isSuperAdmin
    ? (selectedHostelId ? Number(selectedHostelId) : null)
    : userHostelId;
  const canManageBookings = Boolean(effectiveHostelId);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [semesterFilter, setSemesterFilter] = useState<string>('');

  const [semesters, setSemesters] = useState<SemesterOption[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [currentDetail, setCurrentDetail] = useState<BookingDetailResponse | null>(null);

  const [createError, setCreateError] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
    gender: '',
    dateOfBirth: '',
    registrationNumber: '',
    course: '',
    emergencyContact: '',
    preferredCheckIn: '',
    semesterId: '',
    roomId: '',
    currency: 'UGX',
    notes: '',
    initialPaymentAmount: '',
    paymentMethod: 'cash' as 'cash' | 'mobile_money' | 'none',
    paymentPhone: '',
    paymentReference: '',
    paymentNotes: '',
    autoSendMobileRequest: true,
  });

  const [paymentError, setPaymentError] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'cash',
    reference: '',
    notes: '',
    phone: '',
  });
  const [mobileRequestLoading, setMobileRequestLoading] = useState(false);
  const [mobileRequestError, setMobileRequestError] = useState('');
  const [mobileRequestMessage, setMobileRequestMessage] = useState('');

  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<(Booking & { hostel_name?: string | null }) | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');

  const selectedPaymentMethod = paymentMethodOptions.find(
    (option) => option.value === createForm.paymentMethod,
  );

  const selectedRoom = useMemo(
    () => rooms.find((room) => String(room.id) === String(createForm.roomId || '')),
    [rooms, createForm.roomId],
  );
  const selectedRoomPrice =
    selectedRoom && selectedRoom.price !== undefined && selectedRoom.price !== null
      ? Number(selectedRoom.price)
      : null;
  const initialPaymentValue =
    createForm.initialPaymentAmount && !Number.isNaN(Number.parseFloat(createForm.initialPaymentAmount))
      ? Number.parseFloat(createForm.initialPaymentAmount)
      : 0;
  const effectiveInitialPayment =
    createForm.paymentMethod === 'none' ? 0 : Math.max(initialPaymentValue, 0);
  const projectedOutstanding =
    selectedRoomPrice !== null
      ? Math.max(selectedRoomPrice - effectiveInitialPayment, 0)
      : null;

  const paymentAmountLabel =
    createForm.paymentMethod === 'mobile_money'
      ? 'Amount to request via mobile money'
      : 'Cash amount received';

  const paymentReferenceLabel =
    createForm.paymentMethod === 'mobile_money'
      ? 'Mobile money reference (optional)'
      : 'Receipt reference (optional)';

  const paymentAmountHelper =
    createForm.paymentMethod === 'mobile_money'
      ? 'This is the total that will be requested from the student via STK.'
      : 'Record exactly how much cash you collected at the desk.';

  const paymentReferenceHelper =
    createForm.paymentMethod === 'mobile_money'
      ? 'Add the transaction code once the mobile money payment is confirmed.'
      : 'Add a receipt or voucher number for your own reconciliation.';

  const fetchBookings = useCallback(async () => {
    if (!canManageBookings || !effectiveHostelId) return;
    try {
      setIsLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (statusFilter) params.set('status', statusFilter);
      if (paymentStatusFilter) params.set('payment_status', paymentStatusFilter);
      if (semesterFilter) params.set('semester_id', semesterFilter);
      if (search.trim().length) params.set('search', search.trim());
      if (effectiveHostelId) {
        params.set('hostel_id', String(effectiveHostelId));
      }

      const response = await fetch(
        `${API_CONFIG.ENDPOINTS.BOOKINGS.LIST}?${params.toString()}`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to load bookings');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to load bookings');
      }

      setBookings(
        (data.data || []).map((booking: any) => ({
          ...booking,
          booking_fee: Number(booking.booking_fee ?? 0),
          amount_due: Number(booking.amount_due ?? 0),
          amount_paid: Number(booking.amount_paid ?? 0),
          latest_payment_amount:
            booking.latest_payment_amount !== undefined && booking.latest_payment_amount !== null
              ? Number(booking.latest_payment_amount)
              : null,
        })),
      );
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, [canManageBookings, effectiveHostelId, page, limit, statusFilter, paymentStatusFilter, semesterFilter, search]);

  const fetchSemesters = useCallback(async () => {
    if (!effectiveHostelId) return;
    try {
      const response = await fetch(
        `${API_CONFIG.ENDPOINTS.SEMESTERS.LIST_BY_HOSTEL}/${effectiveHostelId}`,
        {
          headers: getAuthHeaders(),
        },
      );
      if (!response.ok) return;
      const json = await response.json();
      if (json.success) {
        const semestersData =
          json.semesters ||
          json.data?.semesters ||
          (Array.isArray(json.data) ? json.data : []);
        setSemesters(Array.isArray(semestersData) ? semestersData : []);
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
    }
  }, [effectiveHostelId, createForm.semesterId]);

  const fetchRooms = useCallback(async () => {
    if (!effectiveHostelId) return;
    try {
      const params = new URLSearchParams({ hostel_id: String(effectiveHostelId) });
      if (createForm.semesterId) {
        params.set('semester_id', String(createForm.semesterId));
      }
      const response = await fetch(`${API_CONFIG.ENDPOINTS.ROOMS.AVAILABLE}?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) return;
      const json = await response.json();
      if (json.success) {
        setRooms(
          (json.data || []).map((room: any) => ({
            id: room.id,
            room_number: room.room_number,
            capacity: Number(room.capacity ?? 1),
            available_spaces: Number(room.available_spaces ?? Math.max(0, Number(room.capacity ?? 1))),
            price: room.price !== undefined && room.price !== null ? Number(room.price) : null,
          })),
        );
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  }, [effectiveHostelId]);

  useEffect(() => {
    if (canManageBookings) {
      fetchBookings();
    }
  }, [canManageBookings, fetchBookings]);

  useEffect(() => {
    if (isSuperAdmin && hostels.length > 0 && !selectedHostelId) {
      setSelectedHostelId(String(hostels[0].id));
    }
  }, [isSuperAdmin, hostels, selectedHostelId]);

  useEffect(() => {
    if (effectiveHostelId) {
      fetchSemesters();
      fetchRooms();
    }
  }, [effectiveHostelId, fetchSemesters, fetchRooms]);

  useEffect(() => {
    if (createDialogOpen) {
      fetchSemesters();
      fetchRooms();
    }
  }, [createDialogOpen, fetchSemesters, fetchRooms]);

  useEffect(() => {
    if (createDialogOpen && semesters.length > 0 && !createForm.semesterId) {
      setCreateForm((prev) => ({
        ...prev,
        semesterId: String(semesters[0].id),
      }));
    }
  }, [createDialogOpen, semesters, createForm.semesterId]);

  useEffect(() => {
    if (createDialogOpen && rooms.length > 0 && !createForm.roomId) {
      setCreateForm((prev) => ({
        ...prev,
        roomId: String(rooms[0].id),
      }));
    }
  }, [createDialogOpen, rooms, createForm.roomId]);

  const fetchHostels = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.HOSTELS.LIST}?page=1&limit=100`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) return;
      const json = await response.json();
      if (json.success) {
        const options = (json.data || []).map((hostel: any) => ({
          id: hostel.id,
          name: hostel.name,
        }));
        setHostels(options);
        if (!selectedHostelId && options.length === 1) {
          setSelectedHostelId(String(options[0].id));
        }
      }
    } catch (error) {
      console.error('Error fetching hostels for super admin:', error);
    }
  }, [isSuperAdmin, selectedHostelId]);

  useEffect(() => {
    fetchHostels();
  }, [fetchHostels]);

  const openCreateDialog = useCallback(
    (shouldUpdateQuery: boolean) => {
      setCreateForm({
        fullName: '',
        email: '',
        phone: '',
        whatsapp: '',
        gender: '',
        dateOfBirth: '',
        registrationNumber: '',
        course: '',
        emergencyContact: '',
        preferredCheckIn: '',
        semesterId: '',
        roomId: '',
        currency: 'UGX',
        notes: '',
        initialPaymentAmount: '',
        paymentMethod: 'cash',
        paymentPhone: '',
        paymentReference: '',
        paymentNotes: '',
        autoSendMobileRequest: true,
      });
      setCreateError('');
      setCreateSubmitting(false);
      setCreateDialogOpen(true);

      if (shouldUpdateQuery) {
        const params = new URLSearchParams(searchParams);
        params.set('create', '1');
        setSearchParams(params, { replace: true });
      }
    },
    [searchParams, setSearchParams],
  );

  const handleOpenCreate = () => {
    openCreateDialog(true);
  };

  useEffect(() => {
    if (searchParams.get('create') === '1' && !createDialogOpen) {
      openCreateDialog(false);
    }
  }, [searchParams, openCreateDialog, createDialogOpen]);

  useEffect(() => {
    if (!createDialogOpen && searchParams.get('create')) {
      const params = new URLSearchParams(searchParams);
      params.delete('create');
      setSearchParams(params, { replace: true });
    }
  }, [createDialogOpen, searchParams, setSearchParams]);

  const handleCreateDialogChange = (open: boolean) => {
    setCreateDialogOpen(open);
    if (!open) {
      setCreateForm({
        fullName: '',
        email: '',
        phone: '',
        whatsapp: '',
        gender: '',
        dateOfBirth: '',
        registrationNumber: '',
        course: '',
        emergencyContact: '',
        preferredCheckIn: '',
        semesterId: '',
        roomId: '',
        currency: 'UGX',
        notes: '',
        initialPaymentAmount: '',
        paymentMethod: 'cash',
        paymentPhone: '',
        paymentReference: '',
        paymentNotes: '',
        autoSendMobileRequest: true,
      });
      setCreateError('');
      setCreateSubmitting(false);
      const params = new URLSearchParams(searchParams);
      if (params.has('create')) {
        params.delete('create');
        setSearchParams(params, { replace: true });
      }
    } else {
      const params = new URLSearchParams(searchParams);
      params.set('create', '1');
      setSearchParams(params, { replace: true });
    }
  };

  const handleCreateBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageBookings || !effectiveHostelId) return;

    if (!createForm.semesterId || !createForm.roomId) {
      setCreateError('Please select a semester and room.');
      return;
    }

    if (!createForm.fullName.trim() || !createForm.email.trim() || !createForm.phone.trim()) {
      setCreateError('Full name, email, and primary phone are required.');
      return;
    }

    const paymentMethod = createForm.paymentMethod;
    const paymentAmountValue = createForm.initialPaymentAmount
      ? parseFloat(createForm.initialPaymentAmount)
      : 0;
    if (paymentMethod !== 'none') {
      if (
        !createForm.initialPaymentAmount ||
        Number.isNaN(paymentAmountValue) ||
        paymentAmountValue <= 0
      ) {
        setCreateError('Enter a valid initial payment amount.');
        return;
      }
      if (paymentMethod === 'mobile_money') {
        const phoneForPayment = createForm.paymentPhone.trim() || createForm.phone.trim();
        if (!phoneForPayment) {
          setCreateError('Enter a phone number to send the mobile money request.');
          return;
        }
      }
    }

    const paymentPhoneValue = createForm.paymentPhone.trim() || createForm.phone.trim();

    setCreateSubmitting(true);
    setCreateError('');
    try {
      const payload = {
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim(),
        whatsapp: createForm.whatsapp.trim() || undefined,
        gender: createForm.gender || undefined,
        dateOfBirth: createForm.dateOfBirth || undefined,
        registrationNumber: createForm.registrationNumber.trim() || undefined,
        course: createForm.course.trim() || undefined,
        emergencyContact: createForm.emergencyContact.trim() || undefined,
        preferredCheckIn: createForm.preferredCheckIn || undefined,
        notes: createForm.notes.trim() || undefined,
        semesterId: Number(createForm.semesterId),
        roomId: Number(createForm.roomId),
        currency: createForm.currency.trim() || 'UGX',
        hostelId: effectiveHostelId,
        amountDue: selectedRoomPrice ?? undefined,
        initialPaymentAmount:
          paymentMethod !== 'none' ? createForm.initialPaymentAmount.trim() : undefined,
        paymentMethod: paymentMethod !== 'none' ? paymentMethod : undefined,
        paymentPhone: paymentMethod === 'mobile_money' ? paymentPhoneValue : undefined,
        paymentReference:
          paymentMethod !== 'none' ? createForm.paymentReference.trim() || undefined : undefined,
        paymentNotes:
          paymentMethod !== 'none' ? createForm.paymentNotes.trim() || undefined : undefined,
      };

      const response = await fetch(API_CONFIG.ENDPOINTS.BOOKINGS.CREATE, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Failed to create booking');
      }

      const createdBooking = json.data?.booking as Booking | undefined;
      const mobileMoneyMeta = json.data?.mobileMoney;

      setCreateDialogOpen(false);

      if (
        paymentMethod === 'mobile_money' &&
        mobileMoneyMeta?.requiresInitiation &&
        createdBooking
      ) {
        const phoneForRequest = mobileMoneyMeta.phone || paymentPhoneValue;
        setSelectedBooking(createdBooking);
        setPaymentForm({
          amount: createForm.initialPaymentAmount,
          method: 'mobile_money',
          reference: '',
          notes: createForm.paymentNotes,
          phone: phoneForRequest,
        });
        setMobileRequestError('');
        setMobileRequestMessage('');
        setPaymentDialogOpen(true);
        if (createForm.autoSendMobileRequest && paymentAmountValue > 0) {
          try {
            await initiateMobilePayment(
              createdBooking.id,
              paymentAmountValue,
              phoneForRequest,
              createForm.paymentNotes.trim() || undefined,
            );
          } catch (mobileErr) {
            console.error('Mobile money initiation error:', mobileErr);
          }
        }
      }

      fetchBookings();
    } catch (err) {
      console.error('Create booking error:', err);
      setCreateError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleOpenVerifyDialog = () => {
    setVerifyDialogOpen(true);
    setVerifyCode('');
    setVerifyResult(null);
    setVerifyError(null);
    setCheckInMessage('');
  };

  const handleVerifyLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!verifyCode.trim()) {
      setVerifyError('Enter the verification code from the email.');
      return;
    }
    if (!effectiveHostelId) {
      setVerifyError('Select a hostel first to verify codes.');
      return;
    }

    const code = verifyCode.trim().toUpperCase();
    setVerifyLoading(true);
    setVerifyError(null);
    setVerifyResult(null);
    setCheckInMessage('');

    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.BOOKINGS.VERIFY}/${code}`, {
        headers: getAuthHeaders(),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Verification code not found.');
      }

      const bookingId = Number(json.data?.id);
      if (!bookingId) {
        throw new Error('Verification code response missing booking id.');
      }

      // Fetch full booking detail to reuse existing flows
      const detailResponse = await fetch(
        `${API_CONFIG.ENDPOINTS.BOOKINGS.DETAIL}/${bookingId}?hostel_id=${effectiveHostelId}`,
        {
          headers: getAuthHeaders(),
        },
      );
      const detailJson = await detailResponse.json();
      if (!detailResponse.ok || !detailJson.success) {
        throw new Error(detailJson.message || 'Failed to load booking details for this code.');
      }

      const bookingRecord: Booking = detailJson.data?.booking ?? json.data;
      setVerifyResult({
        ...bookingRecord,
        hostel_name: json.data?.hostel_name ?? null,
      });
      setCurrentDetail(detailJson.data ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify code.';
      setVerifyError(message);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleVerifyRecordPayment = (booking: Booking) => {
    openPaymentDialog(booking);
    setVerifyDialogOpen(false);
  };

  const handleVerifyCheckIn = async () => {
    if (!verifyResult || !effectiveHostelId) return;
    setCheckInLoading(true);
    setVerifyError(null);
    setCheckInMessage('');
    try {
      const primaryUrl = `${API_CONFIG.ENDPOINTS.BOOKINGS.CHECK_IN}/${verifyResult.id}/check-in?hostel_id=${effectiveHostelId}`;
      let response = await fetch(primaryUrl, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      let json: any;
      try {
        json = await response.json();
      } catch {
        json = null;
      }

      if (!response.ok && response.status === 404) {
        const fallbackUrl = `${API_CONFIG.ENDPOINTS.BOOKINGS.CHECK_IN}/check-in`;
        response = await fetch(fallbackUrl, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            booking_id: verifyResult.id,
            hostel_id: effectiveHostelId,
          }),
        });
        json = await response.json();
      }

      if (!response.ok || !json?.success) {
        throw new Error((json && json.message) || 'Failed to check in booking.');
      }
      const updatedBooking: Booking = json.data
        ? { ...verifyResult, ...json.data }
        : verifyResult;
      setVerifyResult(updatedBooking);
      setCheckInMessage('Student marked as checked in. You can now assign a room if not already done.');
      fetchBookings();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check in booking.';
      setVerifyError(message);
    } finally {
      setCheckInLoading(false);
    }
  };

  const initiateMobilePayment = useCallback(
    async (bookingId: number, amount: number, phone: string, notes?: string) => {
      setMobileRequestError('');
      setMobileRequestMessage('');
      setMobileRequestLoading(true);
      try {
        const response = await fetch(
          `${API_CONFIG.ENDPOINTS.BOOKINGS.PAYMENTS}/${bookingId}/payments/mobile-initiate?hostel_id=${effectiveHostelId ?? ''}`,
          {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              amount,
              phoneNumber: phone,
              notes,
            }),
          },
        );
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.message || 'Failed to initiate mobile money payment');
        }

        setMobileRequestMessage(json.message || 'Mobile money request sent.');

        if (json.data?.booking) {
          setSelectedBooking(json.data.booking);
          const updatedPayments = json.data.payment
            ? [json.data.payment, ...(currentDetail?.payments ?? [])]
            : currentDetail?.payments ?? [];
          setCurrentDetail({
            booking: json.data.booking,
            payments: updatedPayments,
          });
        }

        fetchBookings();
        return json;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to initiate mobile money payment';
        setMobileRequestError(message);
        throw error;
      } finally {
        setMobileRequestLoading(false);
      }
    },
    [currentDetail, effectiveHostelId, fetchBookings],
  );

  const openPaymentDialog = async (booking: Booking) => {
    setSelectedBooking(booking);
    setPaymentForm({
      amount: booking.amount_due > booking.amount_paid
        ? String(Math.max(0, booking.amount_due - booking.amount_paid))
        : '',
      method: 'cash',
      reference: '',
      notes: '',
      phone: booking.payment_phone || booking.student_phone || '',
    });
    setPaymentError('');
    setMobileRequestError('');
    setMobileRequestMessage('');
    setPaymentDialogOpen(true);

    try {
    const response = await fetch(
      `${API_CONFIG.ENDPOINTS.BOOKINGS.DETAIL}/${booking.id}?hostel_id=${effectiveHostelId ?? ''}`,
      {
        headers: getAuthHeaders(),
      },
    );
      if (!response.ok) return;
      const json = await response.json();
      if (json.success) {
        setCurrentDetail(json.data);
      }
    } catch (error) {
      console.error('Error loading booking detail:', error);
    }
  };

  const handleRecordPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedBooking) return;

    const amountValue = parseFloat(paymentForm.amount);
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      setPaymentError('Enter a valid payment amount.');
      return;
    }

    setPaymentSubmitting(true);
    setPaymentError('');
    setMobileRequestError('');
    setMobileRequestMessage('');
    try {
      const response = await fetch(
        `${API_CONFIG.ENDPOINTS.BOOKINGS.PAYMENTS}/${selectedBooking.id}/payments?hostel_id=${effectiveHostelId ?? ''}`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            amount: amountValue,
            method: paymentForm.method,
            reference: paymentForm.reference.trim() || undefined,
            notes: paymentForm.notes.trim() || undefined,
          }),
        },
      );
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Failed to record payment');
      }

      setPaymentDialogOpen(false);
      setSelectedBooking(null);
      setCurrentDetail(null);
      fetchBookings();
    } catch (err) {
      console.error('Record payment error:', err);
      setPaymentError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleInitiateMobilePaymentClick = async () => {
    if (!selectedBooking) return;

    const amountValue = parseFloat(paymentForm.amount);
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      setMobileRequestError('Enter a valid payment amount before sending the request.');
      return;
    }

    const phoneValue =
      paymentForm.phone.trim() ||
      selectedBooking.payment_phone ||
      selectedBooking.student_phone ||
      '';
    if (!phoneValue) {
      setMobileRequestError('Provide a phone number to send the mobile money request.');
      return;
    }

    try {
      await initiateMobilePayment(
        selectedBooking.id,
        amountValue,
        phoneValue,
        paymentForm.notes.trim() || undefined,
      );
    } catch {
      // errors displayed via state
    }
  };

  const handleCopyVerification = async (code: string | null | undefined) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      alert('Verification code copied to clipboard');
    } catch (error) {
      console.error('Failed to copy verification code:', error);
    }
  };

  const primaryCurrency = bookings[0]?.currency || 'UGX';

  const summary = useMemo(() => {
    if (!bookings.length) {
      return { total: 0, paid: 0, partial: 0, pending: 0 };
    }
    return bookings.reduce(
      (acc, booking) => {
        acc.total += 1;
        const balance = Math.max(0, booking.amount_due - booking.amount_paid);
        if (booking.payment_status === 'paid' || balance === 0) {
          acc.paid += 1;
        } else if (booking.payment_status === 'partial') {
          acc.partial += 1;
        } else {
          acc.pending += 1;
        }
        return acc;
      },
      { total: 0, paid: 0, partial: 0, pending: 0 },
    );
  }, [bookings]);

  const paymentChannelStats = useMemo(() => {
    return bookings.reduce(
      (acc, booking) => {
        const method = (booking.latest_payment_method || '').toLowerCase();
        const amount = Number(booking.latest_payment_amount ?? 0);
        if (method === 'mobile_money') {
          acc.mobile.count += 1;
          acc.mobile.amount += amount;
        } else if (method === 'cash') {
          acc.cash.count += 1;
          acc.cash.amount += amount;
        }
        return acc;
      },
      {
        cash: { count: 0, amount: 0 },
        mobile: { count: 0, amount: 0 },
      },
    );
  }, [bookings]);

  const verifyOutstanding = verifyResult
    ? Math.max(
        0,
        Number(verifyResult.amount_due ?? 0) - Number(verifyResult.amount_paid ?? 0),
      )
    : null;
  const verifyCanCheckIn =
    !!verifyResult &&
    (verifyOutstanding ?? 0) <= 0 &&
    (verifyResult.status || '').toLowerCase() !== 'checked_in';

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (isSuperAdmin && hostels.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-xl w-full">
            <CardContent className="p-8 text-center space-y-4">
              <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground">No hostels available</h2>
              <p className="text-sm text-muted-foreground">
                Add a hostel first, then return to manage bookings.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!canManageBookings) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-xl w-full">
            <CardContent className="p-8 text-center space-y-4">
              <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground">Bookings dashboard unavailable</h2>
              {isSuperAdmin ? (
                <p className="text-sm text-muted-foreground">
                  Select a hostel from the toolbar above to view bookings, or create a hostel first.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Assign a hostel to your account to manage bookings, or switch to a hostel admin/custodian
                  profile.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Bookings</h1>
            <p className="text-sm text-slate-500">
              Track student bookings, payments, and verification codes in real-time.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            {isSuperAdmin && (
              <Select value={selectedHostelId || undefined} onValueChange={setSelectedHostelId}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select hostel" />
                </SelectTrigger>
                <SelectContent>
                  {hostels.length === 0 ? (
                    <SelectItem value="__no_hostels__" disabled>
                      No hostels found
                    </SelectItem>
                  ) : (
                    hostels.map((hostelOption) => (
                      <SelectItem key={hostelOption.id} value={String(hostelOption.id)}>
                        {hostelOption.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            {/* Only custodians can verify codes and create bookings */}
            {user?.role === 'custodian' && (
              <>
                <Button variant="secondary" onClick={handleOpenVerifyDialog} disabled={!canManageBookings}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Verify code
                </Button>
                <Button onClick={handleOpenCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Booking
                </Button>
              </>
            )}
            <Button variant="outline" onClick={fetchBookings}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <Card>
            <CardContent className="p-4 space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">Total bookings</p>
              <p className="text-2xl font-semibold text-slate-900">{summary.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">Paid</p>
              <p className="text-2xl font-semibold text-emerald-600">{summary.paid}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">Partial</p>
              <p className="text-2xl font-semibold text-amber-600">{summary.partial}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">Awaiting payment</p>
              <p className="text-2xl font-semibold text-rose-600">{summary.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">Cash payments</p>
              <p className="text-xl font-semibold text-slate-900">
                {paymentChannelStats.cash.count} •{' '}
                {formatCurrency(paymentChannelStats.cash.amount || 0, primaryCurrency)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">Mobile money</p>
              <p className="text-xl font-semibold text-sky-600">
                {paymentChannelStats.mobile.count} •{' '}
                {formatCurrency(paymentChannelStats.mobile.amount || 0, primaryCurrency)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-5">
              <Input
                placeholder="Search by name, phone, or email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="md:col-span-2"
              />
              <Select
                value={statusFilter || '__all_statuses__'}
                onValueChange={(value) => setStatusFilter(value === '__all_statuses__' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all_statuses__">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={paymentStatusFilter || '__all_payments__'}
                onValueChange={(value) => setPaymentStatusFilter(value === '__all_payments__' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all_payments__">All payments</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={semesterFilter || '__all_semesters__'}
                onValueChange={(value) => setSemesterFilter(value === '__all_semesters__' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all_semesters__">All semesters</SelectItem>
                  {semesters.map((semester) => (
                    <SelectItem key={semester.id} value={String(semester.id)}>
                      {semester.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      Semester / Room
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      Amounts
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Payment channel
                </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      Verification
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                        Loading bookings…
                      </td>
                    </tr>
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        No bookings found yet.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((booking) => {
                      const balance = Math.max(0, booking.amount_due - booking.amount_paid);
                      return (
                        <tr key={booking.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-slate-900">{booking.student_name}</p>
                              <p className="text-xs text-slate-500">{booking.student_phone}</p>
                              {booking.student_email && (
                                <p className="text-xs text-slate-500">{booking.student_email}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1 text-sm text-slate-600">
                              <p>{booking.semester_name || '—'}</p>
                              <p className="text-xs text-slate-500">
                                Room {booking.room_number || 'TBD'}
                                {booking.room_capacity ? ` · capacity ${booking.room_capacity}` : ''}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            <div className="space-y-1">
                              <p>
                                Due:{' '}
                                <span className="font-semibold">
                                  {formatCurrency(booking.amount_due, booking.currency)}
                                </span>
                              </p>
                              <p>
                                Paid:{' '}
                                <span className="font-semibold text-emerald-600">
                                  {formatCurrency(booking.amount_paid, booking.currency)}
                                </span>
                              </p>
                              {balance > 0 && (
                                <p className="text-xs text-amber-600">
                                  Balance {formatCurrency(balance, booking.currency)}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 space-y-2">
                            <Badge variant={statusBadgeVariant(booking.status)}>{booking.status}</Badge>
                            <Badge variant={paymentStatusBadgeVariant(booking.payment_status)}>
                              {booking.payment_status}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 space-y-1">
                            {booking.latest_payment_method ? (
                              <>
                                <Badge
                                  variant={
                                    booking.latest_payment_method === 'mobile_money' ? 'default' : 'secondary'
                                  }
                                >
                                  {booking.latest_payment_method.replace('_', ' ')}
                                </Badge>
                                {booking.latest_payment_amount !== null && booking.latest_payment_amount !== undefined && (
                                  <p className="text-xs text-slate-500">
                                    {formatCurrency(Number(booking.latest_payment_amount || 0), booking.currency)}
                                  </p>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-slate-400">No payments yet</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            <div className="space-y-2">
                              {booking.verification_code ? (
                                <>
                                  <code className="block rounded bg-slate-100 px-2 py-1 text-xs">
                                    {booking.verification_code}
                                  </code>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyVerification(booking.verification_code)}
                                >
                                    <ClipboardCopy className="h-3 w-3 mr-1" />
                                    Copy
                                  </Button>
                                </>
                              ) : (
                                <span className="text-xs text-slate-400">No code yet</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right space-x-2">
                            {/* Only custodians can record payments */}
                            {user?.role === 'custodian' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openPaymentDialog(booking)}
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Record payment
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-slate-500">
                <p>
                  Page {page} of {totalPages}
                </p>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Verify Booking Code</DialogTitle>
            <DialogDescription>
              Enter the verification code shared with the student to review their booking, take
              pending payments, and complete check-in.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVerifyLookup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verify-code">Verification code</Label>
              <Input
                id="verify-code"
                value={verifyCode}
                onChange={(event) => setVerifyCode(event.target.value.toUpperCase())}
                placeholder="E.g. 3F9A2C"
                disabled={verifyLoading}
                className="uppercase tracking-widest"
                autoFocus
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={verifyLoading}>
                {verifyLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4 mr-2" />
                )}
                Verify code
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setVerifyCode('');
                  setVerifyResult(null);
                  setVerifyError(null);
                  setCheckInMessage('');
                }}
                disabled={verifyLoading}
              >
                Clear
              </Button>
            </div>
            {verifyError && (
              <Alert variant="destructive">
                <AlertDescription>{verifyError}</AlertDescription>
              </Alert>
            )}
            {verifyResult && (
              <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{verifyResult.student_name}</p>
                  {verifyResult.student_email && (
                    <p className="text-xs text-slate-500">{verifyResult.student_email}</p>
                  )}
                  <p className="text-xs text-slate-500">{verifyResult.student_phone}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Total due</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatCurrency(Number(verifyResult.amount_due || 0), verifyResult.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Paid so far</p>
                    <p className="text-lg font-semibold text-emerald-600">
                      {formatCurrency(Number(verifyResult.amount_paid || 0), verifyResult.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Outstanding</p>
                    <p
                      className={`text-lg font-semibold ${
                        verifyOutstanding && verifyOutstanding > 0
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {formatCurrency(verifyOutstanding ?? 0, verifyResult.currency)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <Badge variant={statusBadgeVariant(verifyResult.status)}>
                    {verifyResult.status}
                  </Badge>
                  <Badge variant={paymentStatusBadgeVariant(verifyResult.payment_status)}>
                    {verifyResult.payment_status}
                  </Badge>
                  {verifyResult.room_number && <span>Room {verifyResult.room_number}</span>}
                </div>
                {checkInMessage && (
                  <Alert>
                    <AlertDescription>{checkInMessage}</AlertDescription>
                  </Alert>
                )}
                {/* Only custodians can record payments and check in bookings */}
                {user?.role === 'custodian' && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleVerifyRecordPayment(verifyResult)}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Record payment
                    </Button>
                    <Button
                      type="button"
                      onClick={handleVerifyCheckIn}
                      disabled={!verifyCanCheckIn || checkInLoading}
                    >
                      {checkInLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Mark as checked in
                    </Button>
                  </div>
                )}
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={createDialogOpen} onOpenChange={handleCreateDialogChange}>
        <DialogContent className="max-w-3xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Booking</DialogTitle>
            <DialogDescription>
              Register a student booking and reserve a room for the selected semester.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBooking} className="space-y-4">
            {createError && (
              <Alert variant="destructive">
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="booking-fullName">Full name *</Label>
                <Input
                  id="booking-fullName"
                  value={createForm.fullName}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, fullName: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-email">Email *</Label>
                <Input
                  id="booking-email"
                  type="email"
                  value={createForm.email}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="booking-phone">Primary phone *</Label>
                <Input
                  id="booking-phone"
                  value={createForm.phone}
                  onChange={(event) =>
                    setCreateForm((prev) => {
                      const value = event.target.value;
                      const shouldSyncPaymentPhone =
                        prev.paymentMethod === 'mobile_money' &&
                        (!prev.paymentPhone || prev.paymentPhone === prev.phone);
                      return {
                        ...prev,
                        phone: value,
                        paymentPhone: shouldSyncPaymentPhone ? value : prev.paymentPhone,
                      };
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-whatsapp">WhatsApp</Label>
                <Input
                  id="booking-whatsapp"
                  value={createForm.whatsapp}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, whatsapp: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={createForm.gender || 'not_specified'}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      gender: value === 'not_specified' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Not specified</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {selectedPaymentMethod && (
                  <p className="text-xs text-slate-500">
                    {selectedPaymentMethod.description}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-dob">Date of birth</Label>
                <Input
                  id="booking-dob"
                  type="date"
                  value={createForm.dateOfBirth}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="booking-registration">Registration number</Label>
                <Input
                  id="booking-registration"
                  value={createForm.registrationNumber}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      registrationNumber: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-course">Course / faculty</Label>
                <Input
                  id="booking-course"
                  value={createForm.course}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, course: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="booking-emergency">Emergency contact</Label>
                <Input
                  id="booking-emergency"
                  value={createForm.emergencyContact}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      emergencyContact: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-preferredCheckIn">Preferred check-in</Label>
                <Input
                  id="booking-preferredCheckIn"
                  type="date"
                  value={createForm.preferredCheckIn}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      preferredCheckIn: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2 sm:max-w-xs">
              <Label htmlFor="booking-currency">Currency</Label>
              <Input
                id="booking-currency"
                value={createForm.currency}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    currency: event.target.value.toUpperCase(),
                  }))
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Semester *</Label>
                <Select
                  value={createForm.semesterId || undefined}
                  onValueChange={(value) => setCreateForm((prev) => ({ ...prev, semesterId: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                  {semesters.length === 0 && (
                    <SelectItem value="__no_semesters__" disabled>
                        No active semesters
                      </SelectItem>
                    )}
                    {semesters.map((semester) => (
                      <SelectItem key={semester.id} value={String(semester.id)}>
                        {semester.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Room *</Label>
                <Select
                  value={createForm.roomId || undefined}
                  onValueChange={(value) => setCreateForm((prev) => ({ ...prev, roomId: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                  {rooms.length === 0 && (
                      <SelectItem value="__no_rooms__" disabled>
                        No rooms available
                      </SelectItem>
                    )}
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={String(room.id)}>
                        <span className="flex flex-col text-left">
                          <span className="text-sm font-medium text-slate-900">
                            Room {room.room_number} · {room.available_spaces} slot(s) open
                          </span>
                          <span className="text-xs text-slate-500">
                            {room.price !== undefined && room.price !== null
                              ? formatCurrency(Number(room.price), createForm.currency)
                              : 'Price not set'}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRoom && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <div className="flex flex-col gap-1">
                      <span>
                        Room price:{' '}
                        <span className="font-semibold text-slate-900">
                          {selectedRoomPrice !== null
                            ? formatCurrency(selectedRoomPrice, createForm.currency)
                            : 'Not set'}
                        </span>
                      </span>
                      <span>
                        Capacity:{' '}
                        <span className="font-medium text-slate-900">
                          {selectedRoom.capacity} student(s)
                        </span>
                      </span>
                      <span>
                        Available spaces:{' '}
                        <span className="font-medium text-slate-900">
                          {Math.max(selectedRoom.available_spaces, 0)}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-900">Payment Details</h3>
                <p className="text-xs text-slate-500">
                  Capture how the upfront payment is handled before confirming the booking.
                </p>
              </div>

              <div className="mt-6 space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="booking-payment-method">Payment method</Label>
                    <Select
                      value={createForm.paymentMethod}
                      onValueChange={(value) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          paymentMethod: value as 'cash' | 'mobile_money' | 'none',
                          paymentPhone:
                            value === 'mobile_money'
                              ? prev.paymentPhone || prev.phone
                              : prev.paymentPhone,
                          initialPaymentAmount: value === 'none' ? '' : prev.initialPaymentAmount,
                        }))
                      }
                    >
                      <SelectTrigger className="h-12 w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md">
                        <div className="flex w-full items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            {selectedPaymentMethod ? (
                              <selectedPaymentMethod.icon className="h-4 w-4" />
                            ) : (
                              <Banknote className="h-4 w-4" />
                            )}
                          </span>
                          <span className="flex flex-col gap-1">
                            <span className="text-sm font-semibold tracking-tight text-slate-900">
                              {selectedPaymentMethod
                                ? selectedPaymentMethod.label
                                : 'Select payment method'}
                            </span>
                            <span className="text-xs text-slate-500 leading-relaxed">
                              {selectedPaymentMethod
                                ? selectedPaymentMethod.description
                                : 'Choose how you will record this payment.'}
                            </span>
                          </span>
                        </div>
                        <SelectValue className="hidden" placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethodOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <span className="flex w-full items-start gap-3">
                                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                                  <Icon className="h-4 w-4" />
                                </span>
                                <span className="flex flex-col text-left">
                                  <span className="text-sm font-medium text-slate-900">
                                    {option.label}
                                  </span>
                                  <span className="text-xs text-slate-500">{option.description}</span>
                                </span>
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-slate-500">
                      Decide whether you are logging cash, sending an STK request, or skipping upfront payment.
                    </p>
                  </div>

                  {createForm.paymentMethod !== 'none' && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="booking-initial-amount">{paymentAmountLabel}</Label>
                      <Input
                        id="booking-initial-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={createForm.initialPaymentAmount}
                        onChange={(event) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            initialPaymentAmount: event.target.value,
                          }))
                        }
                        placeholder="e.g. 150000"
                        className="h-12"
                      />
                      <p className="mt-1 text-xs text-slate-500">{paymentAmountHelper}</p>
                    </div>
                  )}

                  {createForm.paymentMethod !== 'none' && (
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <Label htmlFor="booking-payment-reference">{paymentReferenceLabel}</Label>
                      <Input
                        id="booking-payment-reference"
                        value={createForm.paymentReference}
                        onChange={(event) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            paymentReference: event.target.value,
                          }))
                        }
                        placeholder="Receipt number or MM reference"
                        className="h-12"
                      />
                      <p className="mt-1 text-xs text-slate-500">{paymentReferenceHelper}</p>
                    </div>
                  )}
                </div>

                {createForm.paymentMethod === 'mobile_money' && (
                  <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="booking-payment-phone">Mobile money phone</Label>
                        <Input
                          id="booking-payment-phone"
                          value={createForm.paymentPhone}
                          onChange={(event) =>
                            setCreateForm((prev) => ({
                              ...prev,
                              paymentPhone: event.target.value,
                            }))
                          }
                          placeholder="e.g. 0772XXXXXX"
                          className="h-12"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          This number receives the STK prompt. Double-check the digits before sending.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="booking-payment-notes">Payment notes</Label>
                        <Input
                          id="booking-payment-notes"
                          value={createForm.paymentNotes}
                          onChange={(event) =>
                            setCreateForm((prev) => ({
                              ...prev,
                              paymentNotes: event.target.value,
                            }))
                          }
                          placeholder="Optional note for the custodian"
                          className="h-12"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          Add context for the custodian or finance team about this request.
                        </p>
                      </div>
                    </div>
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={createForm.autoSendMobileRequest}
                        onChange={(event) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            autoSendMobileRequest: event.target.checked,
                          }))
                        }
                      />
                      <span>Send the STK push immediately when this booking is saved.</span>
                    </label>
                  </div>
                )}

                {selectedRoomPrice !== null && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <div className="flex flex-col gap-1">
                      <span>
                        Room price:{' '}
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(selectedRoomPrice, createForm.currency)}
                        </span>
                      </span>
                      <span>
                        Initial payment this entry:{' '}
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(effectiveInitialPayment, createForm.currency)}
                        </span>
                      </span>
                      <span>
                        Outstanding after saving:{' '}
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(projectedOutstanding ?? 0, createForm.currency)}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking-notes">Notes</Label>
              <Textarea
                id="booking-notes"
                rows={3}
                value={createForm.notes}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setCreateDialogOpen(false)} disabled={createSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={createSubmitting}>
                {createSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create booking
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              Log cash or mobile money received from the student. Online payments appear automatically.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{selectedBooking.student_name}</p>
                    <p className="text-xs text-slate-500">{selectedBooking.student_phone}</p>
                  </div>
                  <div className="text-xs text-slate-500">
                    Created {formatDate(selectedBooking.created_at)}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm text-slate-600">
                  <div>
                    <p className="text-xs uppercase text-slate-400">Due</p>
                    <p className="font-semibold">
                      {formatCurrency(selectedBooking.amount_due, selectedBooking.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-400">Paid</p>
                    <p className="font-semibold text-emerald-600">
                      {formatCurrency(selectedBooking.amount_paid, selectedBooking.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-400">Balance</p>
                    <p className="font-semibold text-amber-600">
                      {formatCurrency(
                        Math.max(0, selectedBooking.amount_due - selectedBooking.amount_paid),
                        selectedBooking.currency,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {currentDetail && currentDetail.payments.length > 0 && (
                <Card>
                  <CardContent className="p-3 space-y-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Recent payments</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {currentDetail.payments.map((payment) => (
                        <div key={payment.id} className="rounded border border-slate-200 px-3 py-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">
                              {formatCurrency(payment.amount, selectedBooking.currency)} · {payment.method}
                            </span>
                            <span className="text-slate-400">
                              {formatDate(payment.recorded_at)}
                            </span>
                          </div>
                          {payment.reference && <p>Ref: {payment.reference}</p>}
                          {payment.recorded_by_name && (
                            <p className="text-slate-500">By {payment.recorded_by_name}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {paymentError && (
                <Alert variant="destructive">
                  <AlertDescription>{paymentError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="payment-amount">Amount</Label>
                    <Input
                      id="payment-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(event) =>
                        setPaymentForm((prev) => ({ ...prev, amount: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Method</Label>
                    <Select
                      value={paymentForm.method}
                      onValueChange={(value) => {
                        setMobileRequestError('');
                        setMobileRequestMessage('');
                        setPaymentForm((prev) => ({
                          ...prev,
                          method: value,
                          phone:
                            value === 'mobile_money'
                              ? prev.phone ||
                                selectedBooking?.payment_phone ||
                                selectedBooking?.student_phone ||
                                ''
                              : prev.phone,
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mobile_money">Mobile money</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="payment-reference">Reference</Label>
                    <Input
                      id="payment-reference"
                      value={paymentForm.reference}
                      onChange={(event) =>
                        setPaymentForm((prev) => ({ ...prev, reference: event.target.value }))
                      }
                      placeholder="Mobile money code or receipt number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment-notes">Notes</Label>
                    <Input
                      id="payment-notes"
                      value={paymentForm.notes}
                      onChange={(event) =>
                        setPaymentForm((prev) => ({ ...prev, notes: event.target.value }))
                      }
                    />
                  </div>
                </div>

                {paymentForm.method === 'mobile_money' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="payment-phone">Mobile money phone</Label>
                      <Input
                        id="payment-phone"
                        value={paymentForm.phone}
                        onChange={(event) =>
                          setPaymentForm((prev) => ({ ...prev, phone: event.target.value }))
                        }
                        placeholder="e.g. 0772XXXXXX"
                      />
                    </div>
                    <div className="space-y-2 rounded-lg border border-sky-100 bg-sky-50/60 p-3">
                      <p className="text-xs text-slate-600">
                        Send an STK push to request the student to approve the payment from their phone.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleInitiateMobilePaymentClick}
                          disabled={mobileRequestLoading}
                        >
                          {mobileRequestLoading ? 'Sending…' : 'Send mobile money request'}
                        </Button>
                        {mobileRequestMessage && (
                          <span className="text-xs text-emerald-600">{mobileRequestMessage}</span>
                        )}
                        {mobileRequestError && (
                          <span className="text-xs text-rose-600">{mobileRequestError}</span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPaymentDialogOpen(false)}
                    disabled={paymentSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={paymentSubmitting}>
                    {paymentSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save payment
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default BookingsPage;


