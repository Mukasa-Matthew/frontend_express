import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { API_CONFIG } from '@/config/api';
import { ThemeToggle } from '@/components/ThemeToggle';
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

  const userInitials = useMemo(() => {
    const name = user?.name?.trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
      }
      const first = parts[0]?.charAt(0) ?? '';
      const last = parts[parts.length - 1]?.charAt(0) ?? '';
      const initials = `${first}${last}`.toUpperCase();
      if (initials.trim().length) {
        return initials;
      }
    }

    const username = (user as any)?.username as string | undefined;
    if (username?.trim()) {
      return username.trim().slice(0, 2).toUpperCase();
    }

    if (user?.email?.trim()) {
      return user.email.trim().charAt(0).toUpperCase();
    }

    return 'MM';
  }, [user]);

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
        className="fixed top-4 left-4 z-50 p-2.5 rounded-xl shadow-lg border border-border bg-card text-foreground md:hidden hover:bg-accent hover:text-accent-foreground active:scale-95 transition-all duration-200"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 w-64 sm:w-72 h-screen bg-card border-r border-border flex flex-col shadow-xl z-50 transition-transform duration-300 ease-in-out backdrop-blur supports-backdrop:backdrop-blur-sm',
          isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0',
          className
        )}
      >
        {/* Logo/Header */}
        <div className="p-4 sm:p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary/80 via-primary to-primary/80 flex items-center justify-center flex-shrink-0 text-primary-foreground shadow-md">
              <span className="text-lg sm:text-xl font-bold">R</span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold truncate text-foreground">RooMio</h2>
              {getRoleLabel() && (
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{getRoleLabel()}</p>
              )}
            </div>
            <ThemeToggle className="hidden md:inline-flex" />
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
                'w-full justify-start text-left h-10 sm:h-11 hover:bg-accent/70 hover:text-accent-foreground text-muted-foreground transition-all duration-200 rounded-lg',
                isActive && 'bg-primary/10 text-primary font-semibold border-l-2 border-primary'
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
      <div className="p-3 sm:p-4 border-t border-border flex-shrink-0 bg-muted/30">
        <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ring-2 ring-border/60">
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
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/25 flex items-center justify-center">
                <span className="text-xs sm:text-sm font-bold text-primary">
                  {userInitials}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || 'admin@example.com'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mb-2 md:hidden">
          <span className="text-xs font-medium text-muted-foreground">Appearance</span>
          <ThemeToggle />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-border hover:bg-accent/60 text-foreground text-xs sm:text-sm h-9 sm:h-10"
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
