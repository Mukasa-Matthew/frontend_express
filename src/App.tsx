import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { SWRegister } from '@/components/SWRegister';
import '@/styles/globals.css';

// Import available pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import ProfilePage from '@/pages/ProfilePage';
import HostelsPage from '@/pages/HostelsPage';
import CreateHostelPage from '@/pages/CreateHostelPage';
import HostelDetailsPage from '@/pages/HostelDetailsPage';
import UniversitiesPage from '@/pages/UniversitiesPage';
import SubscriptionPlansPage from '@/pages/SubscriptionPlansPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import HostelAdminDashboardPage from '@/pages/HostelAdminDashboardPage';
import CustodianDashboardPage from '@/pages/CustodianDashboardPage';
import SemesterManagementPage from '@/pages/SemesterManagementPage';
import SemesterDetailsPage from '@/pages/SemesterDetailsPage';
import InventoryPage from '@/pages/InventoryPage';
import RoomsPage from '@/pages/RoomsPage';
import CustodiansPage from '@/pages/CustodiansPage';
import OutstandingBalancesPage from '@/pages/OutstandingBalancesPage';
import ReportsPage from '@/pages/ReportsPage';
import StudentsPage from '@/pages/StudentsPage';
import ExpensesPage from '@/pages/ExpensesPage';
import TransactionsPage from '@/pages/TransactionsPage';
import MessagingPage from '@/pages/MessagingPage';
import ChangePasswordPage from '@/pages/ChangePasswordPage';
import SuperAdminCollectionsPage from '@/pages/SuperAdminCollectionsPage';
import BookingsPage from '@/pages/BookingsPage';

// Placeholder component for pages that aren't migrated yet
const PlaceholderPage = ({ pageName }: { pageName: string }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">{pageName}</h1>
      <p className="text-gray-600">This page is being migrated from Next.js</p>
    </div>
  </div>
);

function App() {
  return (
    <>
      <SWRegister />
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Migrated routes - Super Admin */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/hostels" element={<HostelsPage />} />
          <Route path="/hostels/create" element={<CreateHostelPage />} />
          <Route path="/hostels/:id" element={<HostelDetailsPage />} />
          <Route path="/universities" element={<UniversitiesPage />} />
          <Route path="/subscription-plans" element={<SubscriptionPlansPage />} />
          <Route path="/collections" element={<SuperAdminCollectionsPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/semesters" element={<SemesterManagementPage />} />
          <Route path="/semesters/:hostelId?" element={<SemesterManagementPage />} />
          <Route path="/semesters/details/:id" element={<SemesterDetailsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          
          {/* Hostel Admin Routes */}
          <Route path="/hostel-admin/dashboard" element={<HostelAdminDashboardPage />} />
          <Route path="/hostel-admin/custodians" element={<CustodiansPage />} />
          <Route path="/hostel-admin/rooms" element={<RoomsPage />} />
          <Route path="/hostel-admin/inventory" element={<InventoryPage />} />
          <Route path="/hostel-admin/outstanding" element={<OutstandingBalancesPage />} />
          <Route path="/hostel-admin/reports" element={<ReportsPage />} />
          <Route path="/hostel-admin/bookings" element={<BookingsPage />} />
          <Route path="/hostel-admin/change-password" element={<ChangePasswordPage />} />
          
          {/* Super Admin Routes */}
          <Route path="/change-password" element={<ChangePasswordPage />} />
          
          {/* Custodian Routes */}
          <Route path="/custodian/dashboard" element={<CustodianDashboardPage />} />
          <Route path="/custodian/students" element={<StudentsPage />} />
          <Route path="/custodian/students/:id" element={<PlaceholderPage pageName="Student Details" />} />
          <Route path="/custodian/inventory" element={<InventoryPage />} />
          <Route path="/custodian/expenses" element={<ExpensesPage />} />
          <Route path="/custodian/outstanding" element={<OutstandingBalancesPage />} />
          <Route path="/custodian/transactions" element={<TransactionsPage />} />
          <Route path="/custodian/bookings" element={<BookingsPage />} />
          <Route path="/custodian/messaging" element={<MessagingPage />} />
          <Route path="/custodian/change-password" element={<ChangePasswordPage />} />
        </Routes>
      </AuthProvider>
    </>
  );
}

export default App;

