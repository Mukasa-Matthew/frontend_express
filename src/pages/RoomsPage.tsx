import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { Bed, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Room {
  id: number;
  room_number: string;
  price: number;
  description?: string;
  self_contained: boolean;
  capacity?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    room_number: '',
    price: '',
    description: '',
    self_contained: false,
    capacity: '1',
    status: 'available'
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`${API_CONFIG.ENDPOINTS.ROOMS.LIST}?page=1&limit=100`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }

      const data = await response.json();

      if (data.success) {
        // Convert price strings to numbers for display
        const roomsWithNumericPrice = (data.data || []).map((room: any) => ({
          ...room,
          price: Number(room.price)
        }));
        setRooms(roomsWithNumericPrice);
      } else {
        throw new Error(data.message || 'Failed to load rooms');
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        room_number: room.room_number,
        price: room.price.toString(),
        description: room.description || '',
        self_contained: room.self_contained,
        capacity: room.capacity?.toString() || '1',
        status: room.status
      });
    } else {
      setEditingRoom(null);
      setFormData({
        room_number: '',
        price: '',
        description: '',
        self_contained: false,
        capacity: '1',
        status: 'available'
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
        room_number: formData.room_number,
        price: parseFloat(formData.price),
        description: formData.description || null,
        self_contained: formData.self_contained,
        capacity: parseInt(formData.capacity),
        ...(editingRoom && { status: formData.status })
      };

      const url = editingRoom 
        ? `${API_CONFIG.ENDPOINTS.ROOMS.UPDATE}/${editingRoom.id}`
        : API_CONFIG.ENDPOINTS.ROOMS.CREATE;
      
      const method = editingRoom ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsDialogOpen(false);
        fetchRooms();
      } else {
        setError(data.message || `Failed to ${editingRoom ? 'update' : 'create'} room`);
      }
    } catch (err) {
      console.error('Error submitting room:', err);
      setError(err instanceof Error ? err.message : 'Failed to save room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this room?')) {
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.ROOMS.DELETE}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok && data.success) {
        fetchRooms();
      } else {
        alert(data.message || 'Failed to delete room');
      }
    } catch (err) {
      console.error('Error deleting room:', err);
      alert('Failed to delete room');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'default';
      case 'occupied':
        return 'secondary';
      case 'maintenance':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading && rooms.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading rooms...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rooms</h1>
            <p className="text-gray-600 mt-2">Manage hostel rooms</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className="pt-6">
            {rooms.length === 0 ? (
              <div className="text-center py-12">
                <Bed className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No rooms found</p>
                <Button onClick={() => handleOpenDialog()} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Room
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Room Number</th>
                      <th className="text-left py-3 px-4 font-semibold">Price</th>
                      <th className="text-left py-3 px-4 font-semibold">Capacity</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Description</th>
                      <th className="text-right py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room) => (
                      <tr key={room.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{room.room_number}</td>
                        <td className="py-3 px-4">${room.price.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary">
                            {room.capacity || 1} {room.capacity === 1 ? 'person' : 'people'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={room.self_contained ? 'default' : 'outline'}>
                            {room.self_contained ? 'Self Contained' : 'Shared'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusColor(room.status)}>{room.status}</Badge>
                        </td>
                        <td className="py-3 px-4">{room.description || '-'}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(room)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(room.id)}
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
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
              <DialogDescription>
                {editingRoom 
                  ? 'Update the room details below'
                  : 'Fill in the details to add a new room'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="room_number">Room Number *</Label>
                  <Input
                    id="room_number"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    placeholder="e.g., 101"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price per Month *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    min="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional room description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity">Capacity (Occupants) *</Label>
                  <Select
                    value={formData.capacity}
                    onValueChange={(value) => setFormData({ ...formData, capacity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Single (1 person)</SelectItem>
                      <SelectItem value="2">Double (2 people)</SelectItem>
                      <SelectItem value="3">Triple (3 people)</SelectItem>
                      <SelectItem value="4">Quad (4 people)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="self_contained">Room Type</Label>
                  <Select
                    value={formData.self_contained ? 'yes' : 'no'}
                    onValueChange={(value) => setFormData({ ...formData, self_contained: value === 'yes' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">Shared</SelectItem>
                      <SelectItem value="yes">Self Contained</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {editingRoom && (
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
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {editingRoom ? 'Update Room' : 'Add Room'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

