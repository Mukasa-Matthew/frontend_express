import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_CONFIG, getAuthHeaders, getAuthHeadersForUpload } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { CredentialsDialog } from '@/components/CredentialsDialog';
import { 
  Building2, Mail, Phone, MapPin, Users, Bed, Calendar, AlertCircle, ArrowLeft,
  Upload, X, Star, Image as ImageIcon, Globe, Map, Save, Loader2, Key
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Hostel {
  id: number;
  name: string;
  address: string;
  description?: string;
  status: string;
  total_rooms: number;
  available_rooms: number;
  contact_phone?: string;
  contact_email?: string;
  university_id?: number;
  university_name?: string;
  is_published?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
  admin?: {
    name: string;
    email: string;
  };
  subscription?: {
    id: number;
    plan_name: string;
    status: string;
    start_date: string;
    end_date: string;
    amount_paid?: number;
  };
}

interface HostelImage {
  id: number;
  image_url: string;
  caption?: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export default function HostelDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  
  const [hostel, setHostel] = useState<Hostel | null>(null);
  const [images, setImages] = useState<HostelImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  
  // Credentials state
  const [credentials, setCredentials] = useState<{ username: string; password: string; loginUrl?: string } | null>(null);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      fetchHostel();
      if (isSuperAdmin) {
        fetchImages();
      }
    }
  }, [id, isSuperAdmin]);

  useEffect(() => {
    if (hostel) {
      setLatitude(hostel.latitude?.toString() || '');
      setLongitude(hostel.longitude?.toString() || '');
      setIsPublished(hostel.is_published || false);
    }
  }, [hostel]);

  const fetchHostel = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`${API_CONFIG.ENDPOINTS.HOSTELS.GET}/${id}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch hostel details');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setHostel(data.data);
      } else {
        throw new Error(data.message || 'Hostel not found');
      }
    } catch (err) {
      console.error('Error fetching hostel:', err);
      setError(err instanceof Error ? err.message : 'Failed to load hostel details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchImages = async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.HOSTELS.IMAGES.LIST}/${id}/images`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setImages(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching images:', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      formData.append('is_primary', images.length === 0 ? 'true' : 'false');

      const response = await fetch(`${API_CONFIG.ENDPOINTS.HOSTELS.IMAGES.UPLOAD}/${id}/images`, {
        method: 'POST',
        headers: getAuthHeadersForUpload(),
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchImages();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        alert(data.message || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!id || !confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.HOSTELS.IMAGES.DELETE}/${id}/images/${imageId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchImages();
      } else {
        alert(data.message || 'Failed to delete image');
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('Failed to delete image');
    }
  };

  const handleSetPrimary = async (imageId: number) => {
    if (!id) return;

    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.HOSTELS.IMAGES.UPDATE}/${id}/images/${imageId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_primary: true })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchImages();
      } else {
        alert(data.message || 'Failed to set primary image');
      }
    } catch (err) {
      console.error('Error setting primary image:', err);
      alert('Failed to set primary image');
    }
  };

  const handleSaveLocationAndPublish = async () => {
    if (!id) return;

    try {
      setSaving(true);
      
      const updateData: any = {};
      if (latitude) updateData.latitude = parseFloat(latitude);
      if (longitude) updateData.longitude = parseFloat(longitude);
      updateData.is_published = isPublished;

      const response = await fetch(`${API_CONFIG.ENDPOINTS.HOSTELS.PUBLISH}/${id}/publish`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchHostel();
        alert('Hostel updated successfully');
      } else {
        alert(data.message || 'Failed to update hostel');
      }
    } catch (err) {
      console.error('Error updating hostel:', err);
      alert('Failed to update hostel');
    } finally {
      setSaving(false);
    }
  };

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_CONFIG.BASE_URL}${imageUrl}`;
  };

  const handleViewCredentials = async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.HOSTELS.VIEW_CREDENTIALS}/${id}/view-credentials?generate=true`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok && data.success && data.data?.credentials) {
        const creds = data.data.credentials;
        // Log credentials to console for super admin
        console.log('═══════════════════════════════════════════════════════');
        console.log('🔐 HOSTEL ADMIN CREDENTIALS (SUPER ADMIN VIEW)');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`Hostel: ${hostel?.name || data.data.hostel?.name || 'N/A'}`);
        console.log(`Admin: ${hostel?.admin?.name || data.data.admin?.name || 'N/A'}`);
        console.log(`Email: ${hostel?.admin?.email || data.data.admin?.email || 'N/A'}`);
        console.log('───────────────────────────────────────────────────────');
        console.log(`Username/Email: ${creds.username}`);
        console.log(`Password: ${creds.password}`);
        console.log(`Login URL: ${creds.loginUrl || 'N/A'}`);
        console.log('═══════════════════════════════════════════════════════');
        console.log('💡 These credentials are also displayed in the dialog');
        console.log('═══════════════════════════════════════════════════════');
        
        setCredentials(creds);
        setCredentialsDialogOpen(true);
      } else {
        alert(data.message || 'Failed to retrieve credentials');
      }
    } catch (err) {
      console.error('Error viewing credentials:', err);
      alert('Failed to retrieve credentials');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading hostel details...</p>
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
        <Button onClick={() => navigate('/hostels')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Hostels
        </Button>
      </Layout>
    );
  }

  if (!hostel) {
    return (
      <Layout>
        <Card>
          <CardContent className="py-8 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Hostel not found</p>
            <Button onClick={() => navigate('/hostels')} className="mt-4" variant="outline">
              Back to Hostels
            </Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const occupiedRooms = hostel.total_rooms - hostel.available_rooms;
  const occupancyRate = hostel.total_rooms > 0 
    ? ((occupiedRooms / hostel.total_rooms) * 100).toFixed(1) 
    : '0.0';

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <Button onClick={() => navigate('/hostels')} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hostels
          </Button>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{hostel.name}</h1>
            <Badge variant={hostel.status === 'active' ? 'default' : 'secondary'}>
              {hostel.status}
            </Badge>
            {hostel.is_published && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Globe className="h-3 w-3 mr-1" />
                Published
              </Badge>
            )}
          </div>
          <p className="text-gray-600 mt-2">
            {hostel.university_name && `${hostel.university_name} • `}
            Created on {new Date(hostel.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Rooms */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hostel.total_rooms}</div>
              <p className="text-xs text-muted-foreground mt-1">All rooms</p>
            </CardContent>
          </Card>

          {/* Available Rooms */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
              <Bed className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{hostel.available_rooms}</div>
              <p className="text-xs text-muted-foreground mt-1">Ready for occupancy</p>
            </CardContent>
          </Card>

          {/* Occupied Rooms */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupied Rooms</CardTitle>
              <Bed className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{occupiedRooms}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently occupied</p>
            </CardContent>
          </Card>

          {/* Occupancy Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{occupancyRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Current occupancy</p>
            </CardContent>
          </Card>
        </div>

        {/* Super Admin Management Section */}
        {isSuperAdmin && (
          <>
            {/* Image Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Hostel Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="image-upload" className="mb-2 block">
                    Upload Image
                  </Label>
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: JPG, PNG, WEBP (Max 10MB)
                  </p>
                </div>

                {images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 border">
                          <img
                            src={getImageUrl(image.image_url)}
                            alt={image.caption || 'Hostel image'}
                            className="w-full h-full object-cover"
                          />
                          {image.is_primary && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-yellow-500">
                                <Star className="h-3 w-3 mr-1" />
                                Primary
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 flex gap-2">
                          {!image.is_primary && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetPrimary(image.id)}
                              className="flex-1 text-xs"
                            >
                              <Star className="h-3 w-3 mr-1" />
                              Set Primary
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteImage(image.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        {image.caption && (
                          <p className="text-xs text-gray-500 mt-1 truncate">{image.caption}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No images uploaded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location & Publish Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Location & Website Publishing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      placeholder="e.g., 0.3476"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Get coordinates from Google Maps
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      placeholder="e.g., 32.5825"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <Label htmlFor="is_published" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span className="font-medium">Publish on public website</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      When published, this hostel will appear on the public website for students to browse
                    </p>
                  </Label>
                </div>

                <Button
                  onClick={handleSaveLocationAndPublish}
                  disabled={saving}
                  className="w-full md:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Location & Publish Settings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hostel Information */}
          <Card>
            <CardHeader>
              <CardTitle>Hostel Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Address</p>
                  <p className="text-sm text-gray-600">{hostel.address}</p>
                </div>
              </div>

              {hostel.latitude && hostel.longitude && (
                <div className="flex items-start gap-3">
                  <Map className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Location</p>
                    <p className="text-sm text-gray-600">
                      {hostel.latitude}, {hostel.longitude}
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${hostel.latitude},${hostel.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline mt-1 inline-block"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>
              )}

              {hostel.description && (
                <div className="pt-2">
                  <p className="text-sm font-medium text-gray-900 mb-1">Description</p>
                  <p className="text-sm text-gray-600">{hostel.description}</p>
                </div>
              )}

              {hostel.contact_phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Contact Phone</p>
                    <p className="text-sm text-gray-600">{hostel.contact_phone}</p>
                  </div>
                </div>
              )}

              {hostel.contact_email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Contact Email</p>
                    <p className="text-sm text-gray-600">{hostel.contact_email}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Information */}
          {hostel.admin && isSuperAdmin && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Admin Information</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewCredentials()}
                    title="View Admin Credentials"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    View Credentials
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Admin Name</p>
                    <p className="text-sm text-gray-600">{hostel.admin.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Admin Email</p>
                    <p className="text-sm text-gray-600">{hostel.admin.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscription Information */}
          {hostel.subscription && (
            <Card>
              <CardHeader>
                <CardTitle>Subscription Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Plan Name</p>
                  <p className="text-sm text-gray-600">{hostel.subscription.plan_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={hostel.subscription.status === 'active' ? 'default' : 'secondary'}>
                    {hostel.subscription.status}
                  </Badge>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Period</p>
                    <p className="text-sm text-gray-600">
                      {new Date(hostel.subscription.start_date).toLocaleDateString()} - {' '}
                      {new Date(hostel.subscription.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {hostel.subscription.amount_paid && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Amount Paid</p>
                    <p className="text-sm text-gray-600">
                      UGX {hostel.subscription.amount_paid.toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <CredentialsDialog
          open={credentialsDialogOpen}
          onOpenChange={setCredentialsDialogOpen}
          credentials={credentials}
          title={`Credentials for ${hostel.name} Admin`}
          description="These are the temporary login credentials. Please save them securely."
          userName={hostel.admin?.name}
          userEmail={hostel.admin?.email}
        />
      </div>
    </Layout>
  );
}
