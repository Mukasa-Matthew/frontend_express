// API Configuration
// Get the API URL from environment variable, handle cases where it might have multiple values
const DEFAULT_PROD_API_URL = 'https://martomor.xyz';

let rawApiUrl = import.meta.env.VITE_API_URL;

const inferApiUrlFromWindow = (): string | null => {
  if (typeof window === 'undefined') return null;

  const { protocol, hostname, port } = window.location;
  const defaultBackendPort = import.meta.env.VITE_API_PORT || '5000';
  const isLoopbackHost = hostname === 'localhost' || hostname === '127.0.0.1';
  const hasExplicitPort = Boolean(port);

  // If frontend already sits on backend port, reuse it
  if (hasExplicitPort && port === defaultBackendPort) {
    return `${protocol}//${hostname}:${port}`;
  }

  // If frontend is on a typical SPA dev port (3000/5173/etc) or any other port,
  // reuse the same host but point to the backend port instead.
  if (hasExplicitPort) {
    return `${protocol}//${hostname}:${defaultBackendPort}`;
  }

  // For domains without a port (likely behind a proxy), keep the same origin.
  if (!isLoopbackHost) {
    return `${protocol}//${hostname}`;
  }

  // Loopback without explicit port – fall back to default backend port.
  return `${protocol}//${hostname}:${defaultBackendPort}`;
};

if (!rawApiUrl) {
  rawApiUrl = inferApiUrlFromWindow() || DEFAULT_PROD_API_URL;
}

// Prevent accidental use of localhost in hosted environments (Chrome blocks loopback from public origins)
if (typeof window !== 'undefined') {
  const hostIsPublic =
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  if (hostIsPublic && typeof rawApiUrl === 'string' && rawApiUrl.includes('localhost')) {
    const inferred = inferApiUrlFromWindow();
    if (inferred && !inferred.includes('localhost')) {
      console.warn(
        '⚠️  Overriding localhost API URL because app is served from a public host:',
        inferred
      );
      rawApiUrl = inferred;
    }
  }
}

// Handle cases where the URL might have commas, trailing commas, or extra whitespace
if (typeof rawApiUrl === 'string') {
  // If the URL contains a comma (multiple values), take only the first one
  if (rawApiUrl.includes(',')) {
    rawApiUrl = rawApiUrl.split(',')[0];
    console.warn('⚠️  Multiple API URLs detected in VITE_API_URL. Using first one:', rawApiUrl);
  }
  
  // Remove trailing commas, whitespace, and trailing slashes
  rawApiUrl = rawApiUrl.replace(/[,/]+$/, '').trim();
}

const API_BASE_URL = rawApiUrl.trim();
console.log('🔧 API_BASE_URL:', API_BASE_URL);
console.log('🔧 VITE_API_URL env:', import.meta.env.VITE_API_URL);

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    AUTH: {
      LOGIN: `${API_BASE_URL}/api/auth/login`,
      LOGOUT: `${API_BASE_URL}/api/auth/logout`,
      PROFILE: `${API_BASE_URL}/api/auth/profile`,
      UPLOAD_PROFILE_PICTURE: `${API_BASE_URL}/api/auth/upload-profile-picture`,
      DELETE_PROFILE_PICTURE: `${API_BASE_URL}/api/auth/profile-picture`,
      CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
    },
    UNIVERSITIES: {
      LIST: `${API_BASE_URL}/api/universities`,
      GET: `${API_BASE_URL}/api/universities`,
      REGIONS_LIST: `${API_BASE_URL}/api/universities/regions/list`,
    },
    STUDENTS: {
      LIST: `${API_BASE_URL}/api/students`,
      CREATE: `${API_BASE_URL}/api/students`,
      UPDATE: `${API_BASE_URL}/api/students`,
      DELETE: `${API_BASE_URL}/api/students`,
      SEMESTER_SUMMARY: `${API_BASE_URL}/api/students/summary/semesters`,
      NOTIFY: `${API_BASE_URL}/api/students/notify`,
    },
    PAYMENTS: {
      LIST: `${API_BASE_URL}/api/payments`,
      CREATE: `${API_BASE_URL}/api/payments`,
      SUMMARY: `${API_BASE_URL}/api/payments/summary`,
      HOSTEL_SUMMARY: `${API_BASE_URL}/api/payments/summary/hostel`,
      SEMESTER_SUMMARY: `${API_BASE_URL}/api/payments/summary/semesters`,
      GLOBAL_SUMMARY: `${API_BASE_URL}/api/payments/summary/global`,
    },
    ROOMS: {
      LIST: `${API_BASE_URL}/api/rooms`,
      AVAILABLE: `${API_BASE_URL}/api/rooms/available`,
      CREATE: `${API_BASE_URL}/api/rooms`,
      UPDATE: `${API_BASE_URL}/api/rooms`,
      DELETE: `${API_BASE_URL}/api/rooms`,
    },
    EXPENSES: {
      LIST: `${API_BASE_URL}/api/expenses`,
      CREATE: `${API_BASE_URL}/api/expenses`,
      SUMMARY: `${API_BASE_URL}/api/expenses/summary`,
    },
    INVENTORY: {
      LIST: `${API_BASE_URL}/api/inventory`,
      CREATE: `${API_BASE_URL}/api/inventory`,
      UPDATE: `${API_BASE_URL}/api/inventory`,
      DELETE: `${API_BASE_URL}/api/inventory`,
    },
    HOSTELS: {
      LIST: `${API_BASE_URL}/api/hostels`,
      CREATE: `${API_BASE_URL}/api/hostels`,
      GET: `${API_BASE_URL}/api/hostels`,
      ADMIN_SUMMARY: `${API_BASE_URL}/api/hostels`,
      DELETE: `${API_BASE_URL}/api/hostels`,
      UPDATE: `${API_BASE_URL}/api/hostels`,
      RESEND_ADMIN_CREDENTIALS: `${API_BASE_URL}/api/hostels`,
      VIEW_CREDENTIALS: `${API_BASE_URL}/api/hostels`,
      STATUS: `${API_BASE_URL}/api/hostels`,
      EXTEND_SUBSCRIPTION: `${API_BASE_URL}/api/hostels`,
      IMAGES: {
        LIST: `${API_BASE_URL}/api/hostels`,
        UPLOAD: `${API_BASE_URL}/api/hostels`,
        DELETE: `${API_BASE_URL}/api/hostels`,
        UPDATE: `${API_BASE_URL}/api/hostels`,
      },
      PUBLISH: `${API_BASE_URL}/api/hostels`,
    },
    ANALYTICS: {
      PLATFORM_OVERVIEW: `${API_BASE_URL}/api/multi-tenant/platform/overview`,
      HOSTEL_OVERVIEW: `${API_BASE_URL}/api/multi-tenant/hostel`,
    },
    SUBSCRIPTION_PLANS: {
      LIST: `${API_BASE_URL}/api/subscription-plans`,
      GET: `${API_BASE_URL}/api/subscription-plans`,
      CREATE: `${API_BASE_URL}/api/subscription-plans`,
      UPDATE: `${API_BASE_URL}/api/subscription-plans`,
      DELETE: `${API_BASE_URL}/api/subscription-plans`,
      HOSTEL_SUBSCRIPTIONS: `${API_BASE_URL}/api/subscription-plans/hostel`,
                SUBSCRIBE_HOSTEL: `${API_BASE_URL}/api/subscription-plans/hostel`,
                RENEW_HOSTEL: `${API_BASE_URL}/api/subscription-plans/hostel`,
      EXPIRED: `${API_BASE_URL}/api/subscription-plans/expired/all`,
    },
    CUSTODIANS: {
      LIST: `${API_BASE_URL}/api/custodians`,
      CREATE: `${API_BASE_URL}/api/custodians`,
      UPDATE: `${API_BASE_URL}/api/custodians`,
      DELETE: `${API_BASE_URL}/api/custodians`,
      DELETE_BY_EMAIL: `${API_BASE_URL}/api/custodians/by-email`,
      RESEND_CREDENTIALS: `${API_BASE_URL}/api/custodians`,
      VIEW_CREDENTIALS: `${API_BASE_URL}/api/custodians`,
    },
    SEMESTERS: {
      // Global semester templates
      GLOBAL_LIST: `${API_BASE_URL}/api/semesters/global`,
      GLOBAL_CREATE: `${API_BASE_URL}/api/semesters/global`,
      GLOBAL_UPDATE: `${API_BASE_URL}/api/semesters/global`,
      GLOBAL_DELETE: `${API_BASE_URL}/api/semesters/global`,
      // Hostel semesters
      LIST_BY_HOSTEL: `${API_BASE_URL}/api/semesters/hostel`,
      CURRENT: `${API_BASE_URL}/api/semesters/hostel`,
      CREATE: `${API_BASE_URL}/api/semesters`,
      GET: `${API_BASE_URL}/api/semesters`,
      STATS: `${API_BASE_URL}/api/semesters`,
      SET_CURRENT: `${API_BASE_URL}/api/semesters`,
      UPDATE_STATUS: `${API_BASE_URL}/api/semesters`,
      DELETE: `${API_BASE_URL}/api/semesters`,
      ROLLOVER: `${API_BASE_URL}/api/semesters`,
      ENROLLMENTS: `${API_BASE_URL}/api/semesters`,
      ENROLL: `${API_BASE_URL}/api/semesters`,
      DROP: `${API_BASE_URL}/api/semesters/enrollments`,
      TRANSFER: `${API_BASE_URL}/api/semesters/enrollments`,
      HOSTEL_SEMESTER_MODE: `${API_BASE_URL}/api/semesters/hostel`,
    },
    BOOKINGS: {
      LIST: `${API_BASE_URL}/api/bookings`,
      CREATE: `${API_BASE_URL}/api/bookings`,
      DETAIL: `${API_BASE_URL}/api/bookings`,
      PAYMENTS: `${API_BASE_URL}/api/bookings`,
      VERIFY: `${API_BASE_URL}/api/bookings/verify`,
      CHECK_IN: `${API_BASE_URL}/api/bookings`,
    },
    AUDIT_LOGS: {
      LIST: `${API_BASE_URL}/api/audit-logs`,
    },
  },
};

// Helper function to get full URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to get auth headers
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('auth_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Helper function to get auth headers for file uploads
export const getAuthHeadersForUpload = (): HeadersInit => {
  const token = localStorage.getItem('auth_token');
  return {
    'Authorization': `Bearer ${token}`,
  };
};
