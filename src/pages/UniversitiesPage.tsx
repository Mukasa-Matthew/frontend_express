import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { GraduationCap, Plus, Search, Edit, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface University {
  id: number;
  name: string;
  code: string;
  region_id?: number;
  region_name?: string;
  image_url?: string | null;
  status: string;
  created_at: string;
}

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    region_id: '',
    image_url: '',
  });

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(API_CONFIG.ENDPOINTS.UNIVERSITIES.LIST, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch universities');
      }

      const data = await response.json();

      if (data.success) {
        setUniversities(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to load universities');
      }
    } catch (err) {
      console.error('Error fetching universities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load universities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.UNIVERSITIES.LIST, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          ...(formData.region_id && { region_id: parseInt(formData.region_id) }),
          image_url: formData.image_url.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowCreateForm(false);
        setFormData({ name: '', code: '', region_id: '', image_url: '' });
        fetchUniversities();
      } else {
        setError(data.message || 'Failed to create university');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create university');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (university: University) => {
    setEditingId(university.id);
    setFormData({
      name: university.name,
      code: university.code,
      region_id: university.region_id?.toString() || '',
      image_url: university.image_url || '',
    });
    setShowCreateForm(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.UNIVERSITIES.GET}/${editingId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          ...(formData.region_id && { region_id: parseInt(formData.region_id) }),
          image_url:
            formData.image_url.trim() === ''
              ? null
              : formData.image_url.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEditingId(null);
        setFormData({ name: '', code: '', region_id: '', image_url: '' });
        fetchUniversities();
      } else {
        setError(data.message || 'Failed to update university');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update university');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this university?')) {
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.UNIVERSITIES.GET}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        fetchUniversities();
      } else {
        setError(data.message || 'Failed to delete university');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete university');
    }
  };

  const filteredUniversities = universities.filter(
    (uni) =>
      uni.name.toLowerCase().includes(search.toLowerCase()) ||
      uni.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Universities</h1>
            <p className="text-gray-600 mt-2">Manage universities on the platform</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4 mr-2" />
            {showCreateForm ? 'Cancel' : 'Add University'}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Create/Edit Form */}
        {(showCreateForm || editingId !== null) && (
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Edit University' : 'Create New University'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">University Name *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">University Code *</Label>
                    <Input
                      id="code"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., MAK"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="image_url">University Image URL</Label>
                    <Input
                      id="image_url"
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/university-cover.jpg"
                    />
                    <p className="text-xs text-gray-500">
                      Provide a public URL to an image that showcases the university. It will appear on
                      the student portal.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update University' : 'Create University')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingId(null);
                      setFormData({ name: '', code: '', region_id: '', image_url: '' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search universities by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Universities List */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading universities...</p>
            </div>
          </div>
        ) : filteredUniversities.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No universities found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUniversities.map((university) => (
              <Card key={university.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {university.image_url && (
                        <div className="mb-3 overflow-hidden rounded-md border border-gray-200">
                          <img
                            src={university.image_url}
                            alt={university.name}
                            className="h-32 w-full object-cover"
                          />
                        </div>
                      )}
                      <CardTitle className="text-lg">{university.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Code: {university.code}</p>
                    </div>
                    <Badge variant={university.status === 'active' ? 'default' : 'secondary'}>
                      {university.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {university.region_name && (
                    <div className="mb-3 text-sm text-gray-600">
                      Region: {university.region_name}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mb-3">
                    Created: {new Date(university.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(university)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(university.id)}
                      className="flex-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredUniversities.length > 0 && (
          <p className="text-sm text-gray-600 text-center">
            Showing {filteredUniversities.length} of {universities.length} universities
          </p>
        )}
      </div>
    </Layout>
  );
}




