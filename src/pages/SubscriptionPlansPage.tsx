import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { CreditCard, Plus, Edit, Trash2, AlertCircle, DollarSign, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  duration_months: number;
  price_per_month: number;
  total_price: number;
  is_active: boolean;
  created_at: string;
}

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_months: '',
    price_per_month: '',
    is_active: true,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(API_CONFIG.ENDPOINTS.SUBSCRIPTION_PLANS.LIST, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription plans');
      }

      const data = await response.json();

      if (data.success) {
        setPlans(data.plans || []);
      } else {
        throw new Error(data.message || 'Failed to load subscription plans');
      }
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.SUBSCRIPTION_PLANS.CREATE, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          duration_months: parseInt(formData.duration_months),
          price_per_month: parseFloat(formData.price_per_month),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowCreateForm(false);
        setFormData({ name: '', description: '', duration_months: '', price_per_month: '', is_active: true });
        fetchPlans();
      } else {
        setError(data.message || 'Failed to create subscription plan');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subscription plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      duration_months: plan.duration_months.toString(),
      price_per_month: plan.price_per_month.toString(),
      is_active: plan.is_active,
    });
    setShowCreateForm(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.SUBSCRIPTION_PLANS.UPDATE}/${editingPlan.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          duration_months: parseInt(formData.duration_months),
          price_per_month: parseFloat(formData.price_per_month),
          is_active: formData.is_active,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEditingPlan(null);
        setFormData({ name: '', description: '', duration_months: '', price_per_month: '', is_active: true });
        fetchPlans();
      } else {
        setError(data.message || 'Failed to update subscription plan');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subscription plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subscription plan? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.SUBSCRIPTION_PLANS.DELETE}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok && data.success) {
        fetchPlans();
      } else {
        setError(data.message || 'Failed to delete subscription plan');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subscription plan');
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingPlan(null);
    setFormData({ name: '', description: '', duration_months: '', price_per_month: '', is_active: true });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
            <p className="text-gray-600 mt-2">Manage subscription plans for hostels</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4 mr-2" />
            {showCreateForm ? 'Cancel' : 'Create Plan'}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Create/Edit Form */}
        {(showCreateForm || editingPlan) && (
          <Card>
            <CardHeader>
              <CardTitle>{editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingPlan ? handleUpdate : handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Basic Plan"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Plan description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration_months">Duration (Months) *</Label>
                    <Input
                      id="duration_months"
                      type="number"
                      required
                      min="1"
                      value={formData.duration_months}
                      onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price_per_month">Price Per Month (UGX) *</Label>
                    <Input
                      id="price_per_month"
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price_per_month}
                      onChange={(e) => setFormData({ ...formData, price_per_month: e.target.value })}
                    />
                  </div>
                </div>

                {formData.duration_months && formData.price_per_month && (
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <p className="text-sm font-medium text-indigo-900">
                      Total Price: UGX{' '}
                      {(parseInt(formData.duration_months || '0') * parseFloat(formData.price_per_month || '0')).toLocaleString()}
                    </p>
                  </div>
                )}

                {editingPlan && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label htmlFor="is_active">Plan Status</Label>
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.is_active ? 'Active - Plan is available for selection' : 'Inactive - Plan is hidden'}
                      </p>
                    </div>
                    <select
                      id="is_active"
                      value={formData.is_active ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (editingPlan ? 'Updating...' : 'Creating...') : (editingPlan ? 'Update Plan' : 'Create Plan')}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Plans List */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading subscription plans...</p>
            </div>
          </div>
        ) : plans.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No subscription plans found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                    </div>
                    <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {plan.duration_months} month{plan.duration_months !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      UGX {plan.price_per_month.toLocaleString()} / month
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-lg font-bold text-indigo-600">
                      UGX {plan.total_price.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Total price</p>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(plan)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(plan.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

