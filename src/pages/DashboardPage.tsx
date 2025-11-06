import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Users, GraduationCap, Bed, TrendingUp, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PlatformStats {
  total_universities?: number;
  total_hostels: number;
  total_students: number;
  total_hostel_admins: number;
  total_university_admins?: number;
  total_rooms: number;
  available_rooms: number;
  occupied_rooms: number;
  overall_occupancy_rate: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlatformStats();
  }, []);

  const fetchPlatformStats = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch(API_CONFIG.ENDPOINTS.ANALYTICS.PLATFORM_OVERVIEW, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch platform statistics');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Ensure numeric fields are properly converted
        const statsData = {
          ...data.data,
          total_hostels: Number(data.data.total_hostels) || 0,
          total_students: Number(data.data.total_students) || 0,
          total_universities: Number(data.data.total_universities) || 0,
          total_rooms: Number(data.data.total_rooms) || 0,
          available_rooms: Number(data.data.available_rooms) || 0,
          occupied_rooms: Number(data.data.occupied_rooms) || 0,
          overall_occupancy_rate: Number(data.data.overall_occupancy_rate) || 0,
          total_hostel_admins: Number(data.data.total_hostel_admins) || 0,
        };
        setStats(statsData);
      } else {
        throw new Error(data.message || 'Failed to load statistics');
      }
    } catch (err) {
      console.error('Error fetching platform stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  // Helper function to get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', emoji: '🌅', icon: '☀️' };
    if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️', icon: '✨' };
    return { text: 'Good Evening', emoji: '🌙', icon: '⭐' };
  };

  const displayName = user?.username || user?.name || 'Admin';
  const greeting = getGreeting();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Platform overview and statistics</p>
        </div>

        {/* Welcome Message */}
        <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{greeting.emoji}</span>
              <div>
                <strong className="text-lg">
                  {greeting.text}, {displayName}! {greeting.icon}
                </strong>
                <p className="text-sm text-blue-700 mt-1">
                  👋 Welcome back to your dashboard! Here's what's happening today.
                </p>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Hostels Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hostels</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_hostels || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Active hostels</p>
              </CardContent>
            </Card>

            {/* Students Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_students || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Registered students</p>
              </CardContent>
            </Card>

            {/* Universities Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Universities</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_universities || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Registered universities</p>
              </CardContent>
            </Card>

            {/* Total Rooms Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
                <Bed className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_rooms || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">All hostels combined</p>
              </CardContent>
            </Card>

            {/* Available Rooms Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
                <Bed className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.available_rooms || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Ready for occupancy</p>
              </CardContent>
            </Card>

            {/* Occupied Rooms Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupied Rooms</CardTitle>
                <Bed className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.occupied_rooms || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Currently occupied</p>
              </CardContent>
            </Card>

            {/* Occupancy Rate Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.overall_occupancy_rate != null 
                    ? Number(stats.overall_occupancy_rate).toFixed(1) 
                    : '0.0'}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Platform-wide</p>
              </CardContent>
            </Card>

            {/* Admins Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hostel Admins</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_hostel_admins || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Active administrators</p>
              </CardContent>
            </Card>
          </div>
        )}

        {!stats && !isLoading && !error && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No data available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

