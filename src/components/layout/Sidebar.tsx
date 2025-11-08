import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { API_CONFIG } from '@/config/api';
import { 
  LayoutDashboard, 
  Building2, 
  Plus,
  BarChart3,
  GraduationCap,
  LogOut,
  Menu,
  X,
  User,
  CreditCard,
  Calendar,
  Mail,
  DollarSign
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      // The logout function in AuthContext will handle the redirect
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getNavigationItems = () => {
    if (user?.role === 'super_admin') {
      return [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Create Hostel', href: '/hostels/create', icon: Plus },
        { name: 'Manage Hostels', href: '/hostels', icon: Building2 },
        { name: 'Collections', href: '/collections', icon: DollarSign },
        { name: 'Subscription Plans', href: '/subscription-plans', icon: CreditCard },
        { name: 'Semesters', href: '/semesters', icon: Calendar },
        { name: 'Universities', href: '/universities', icon: GraduationCap },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
        { name: 'Profile', href: '/profile', icon: User },
      ];
    }

    if (user?.role === 'hostel_admin') {
      return [
        { name: 'Dashboard', href: '/hostel-admin/dashboard', icon: LayoutDashboard },
        { name: 'Semesters', href: '/semesters', icon: Calendar },
        { name: 'Inventory', href: '/hostel-admin/inventory', icon: Building2 },
        { name: 'Rooms', href: '/hostel-admin/rooms', icon: Building2 },
        { name: 'Custodians', href: '/hostel-admin/custodians', icon: Building2 },
        { name: 'Outstanding Balances', href: '/hostel-admin/outstanding', icon: BarChart3 },
        { name: 'Financial Reports', href: '/hostel-admin/reports', icon: BarChart3 },
        { name: 'Profile', href: '/profile', icon: User },
      ];
    }

    if ((user as any)?.role === 'custodian') {
      return [
        { name: 'Dashboard', href: '/custodian/dashboard', icon: LayoutDashboard },
        { name: 'Semesters', href: '/semesters', icon: Calendar },
        { name: 'Students', href: '/custodian/students', icon: GraduationCap },
        { name: 'Inventory', href: '/custodian/inventory', icon: Building2 },
        { name: 'Expenses', href: '/custodian/expenses', icon: BarChart3 },
        { name: 'Transactions', href: '/custodian/transactions', icon: BarChart3 },
        { name: 'Outstanding Balances', href: '/custodian/outstanding', icon: BarChart3 },
        { name: 'Messaging', href: '/custodian/messaging', icon: Mail },
        { name: 'Profile', href: '/profile', icon: User },
      ];
    }

    return [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Profile', href: '/profile', icon: User },
    ];
  };

  const navigationItems = getNavigationItems();

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'super_admin':
        return 'Super Admin';
      case 'hostel_admin':
        return 'Hostel Admin';
      case 'tenant':
        return 'Tenant';
      case 'user':
        return 'User';
      default:
        return '';
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-lg border border-slate-200 md:hidden hover:bg-slate-50 active:scale-95 transition-all duration-200"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-5 w-5 text-slate-700" /> : <Menu className="h-5 w-5 text-slate-700" />}
      </button>

      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 w-64 sm:w-72 h-screen bg-white border-r border-slate-200 flex flex-col shadow-xl z-50 transition-transform duration-300 ease-in-out",
        isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
        className
      )}>
        {/* Logo/Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
              <span className="text-lg sm:text-xl font-bold text-white">R</span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold brand-text truncate">RooMio</h2>
              {getRoleLabel() && (
                <p className="text-xs sm:text-sm text-slate-600 truncate">{getRoleLabel()}</p>
              )}
            </div>
          </div>
        </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto overscroll-contain">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Button
              key={item.name}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left h-10 sm:h-11 hover:bg-slate-100 hover:text-slate-900 text-slate-700 transition-all duration-200 rounded-lg",
                isActive && "bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-600"
              )}
              asChild
            >
              <Link to={item.href} className="flex items-center space-x-3 px-3" onClick={() => setIsOpen(false)}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base truncate">{item.name}</span>
              </Link>
            </Button>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-3 sm:p-4 border-t border-slate-200 flex-shrink-0 bg-slate-50/50">
        <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ring-2 ring-slate-200">
            {user?.profile_picture ? (
              <img
                src={`${API_CONFIG.BASE_URL}${user.profile_picture}?t=${new Date().getTime()}`}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                <span className="text-xs sm:text-sm font-bold text-indigo-700">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'MM'}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user?.email || 'admin@example.com'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm h-9 sm:h-10"
          onClick={handleLogout}
        >
          <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
          <span className="truncate">Logout</span>
        </Button>
      </div>
    </aside>
    </>
  );
};
