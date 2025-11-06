import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { Box, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  purchase_price: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: '',
    category: '',
    purchase_price: '',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`${API_CONFIG.ENDPOINTS.INVENTORY.LIST}?page=1&limit=100`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }

      const data = await response.json();

      if (data.success) {
        setItems(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to load inventory');
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        quantity: item.quantity.toString(),
        unit: item.unit || '',
        category: item.category || '',
        purchase_price: item.purchase_price ? item.purchase_price.toString() : '',
        status: item.status,
        notes: item.notes || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        quantity: '',
        unit: '',
        category: '',
        purchase_price: '',
        status: 'active',
        notes: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name,
        quantity: parseInt(formData.quantity),
        unit: formData.unit || null,
        category: formData.category || null,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        status: formData.status,
        notes: formData.notes || null
      };

      const url = editingItem 
        ? `${API_CONFIG.ENDPOINTS.INVENTORY.UPDATE}/${editingItem.id}`
        : API_CONFIG.ENDPOINTS.INVENTORY.CREATE;
      
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsDialogOpen(false);
        fetchInventory();
      } else {
        setError(data.message || `Failed to ${editingItem ? 'update' : 'create'} inventory item`);
      }
    } catch (err) {
      console.error('Error submitting inventory item:', err);
      setError(err instanceof Error ? err.message : 'Failed to save inventory item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.INVENTORY.DELETE}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok && data.success) {
        fetchInventory();
      } else {
        alert(data.message || 'Failed to delete inventory item');
      }
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      alert('Failed to delete inventory item');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'low_stock':
        return 'secondary';
      case 'out_of_stock':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading inventory...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Inventory</h1>
            <p className="text-sm md:text-base text-gray-600 mt-2">Manage hostel inventory items</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className="pt-4 md:pt-6">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <Box className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-sm md:text-base text-gray-500">No inventory items found</p>
                <Button onClick={() => handleOpenDialog()} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            ) : (
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Category</th>
                      <th className="text-left py-3 px-4 font-semibold">Quantity</th>
                      <th className="text-left py-3 px-4 font-semibold">Unit</th>
                      <th className="text-left py-3 px-4 font-semibold">Price</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-right py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{item.name}</td>
                        <td className="py-3 px-4">{item.category || '-'}</td>
                        <td className="py-3 px-4">{item.quantity}</td>
                        <td className="py-3 px-4">{item.unit || '-'}</td>
                        <td className="py-3 px-4">
                          {item.purchase_price ? `$${Number(item.purchase_price).toFixed(2)}` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusColor(item.status)}>{item.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(item)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Mobile Card View */}
            {items.length > 0 && (
              <div className="md:hidden grid grid-cols-1 gap-4">
                {items.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Box className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                            <p className="text-xs text-gray-600">{item.category || 'No category'}</p>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(item.status)}>{item.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Quantity:</span>
                          <span className="ml-1 font-semibold">{item.quantity}</span>
                          <span className="ml-1 text-gray-500">{item.unit || ''}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Price:</span>
                          <span className="ml-1 font-semibold">
                            {item.purchase_price ? `$${Number(item.purchase_price).toFixed(2)}` : '-'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(item)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="flex-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}</DialogTitle>
              <DialogDescription>
                {editingItem 
                  ? 'Update the inventory item details below'
                  : 'Fill in the details to add a new inventory item'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Toilet Paper"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Cleaning Supplies"
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g., Rolls"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="purchase_price">Purchase Price</Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    min="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}


