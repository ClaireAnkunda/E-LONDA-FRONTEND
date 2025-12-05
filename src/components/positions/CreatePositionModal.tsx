import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { positionsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const createPositionSchema = z.object({
  name: z.string().min(1, 'Position name is required'),
  seats: z.string().refine((val) => {
    const num = parseInt(val);
    return !isNaN(num) && num > 0;
  }, 'Seats must be a positive number'),
  nominationOpens: z.string().min(1, 'Nomination opens date is required'),
  nominationCloses: z.string().min(1, 'Nomination closes date is required'),
  votingOpens: z.string().min(1, 'Voting opens date is required'),
  votingCloses: z.string().min(1, 'Voting closes date is required'),
}).refine((data) => {
  const nomOpens = new Date(data.nominationOpens);
  const nomCloses = new Date(data.nominationCloses);
  const voteOpens = new Date(data.votingOpens);
  const voteCloses = new Date(data.votingCloses);
  return nomCloses > nomOpens && voteCloses > voteOpens && voteOpens > nomCloses;
}, {
  message: 'Invalid date ranges. Nomination must close before voting opens.',
  path: ['nominationCloses'],
});

type CreatePositionFormData = z.infer<typeof createPositionSchema>;

interface CreatePositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePositionModal: React.FC<CreatePositionModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  // Security: Ensure only admin can create positions
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'ADMIN') {
      console.error('Unauthorized: Only admins can create positions');
      onClose();
    }
  }, [isOpen, onClose]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreatePositionFormData>({
    resolver: zodResolver(createPositionSchema),
  });

  const onSubmit = async (data: CreatePositionFormData) => {
    setLoading(true);
    try {
      await positionsAPI.create({
        ...data,
        seats: parseInt(data.seats),
      });
      toast.success('Position created successfully!');
      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create position';
      
      // Check if it's an authentication error
      if (err.response?.status === 401) {
        if (errorMessage.includes('Invalid or inactive user') || errorMessage.includes('Invalid token') || errorMessage.includes('Token expired')) {
          toast.error('Your session has expired. Please log out and log in again.');
          // Auto-redirect after a delay
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/admin/login';
          }, 2000);
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-[600px] max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Create Election Position</CardTitle>
          <CardDescription>
            Define a new position for the election with nomination and voting windows.
          </CardDescription>
        </CardHeader>
        <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Position Name *</Label>
            <Input
              id="name"
              placeholder="e.g., President, Secretary General"
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="seats">Number of Seats *</Label>
            <Input
              id="seats"
              type="number"
              min="1"
              placeholder="1"
              {...register('seats')}
              className={errors.seats ? 'border-red-500' : ''}
            />
            {errors.seats && (
              <p className="text-sm text-red-600">{errors.seats.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nominationOpens">Nomination Opens *</Label>
              <Input
                id="nominationOpens"
                type="datetime-local"
                {...register('nominationOpens')}
                className={errors.nominationOpens ? 'border-red-500' : ''}
              />
              {errors.nominationOpens && (
                <p className="text-sm text-red-600">{errors.nominationOpens.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nominationCloses">Nomination Closes *</Label>
              <Input
                id="nominationCloses"
                type="datetime-local"
                {...register('nominationCloses')}
                className={errors.nominationCloses ? 'border-red-500' : ''}
              />
              {errors.nominationCloses && (
                <p className="text-sm text-red-600">{errors.nominationCloses.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="votingOpens">Voting Opens *</Label>
              <Input
                id="votingOpens"
                type="datetime-local"
                {...register('votingOpens')}
                className={errors.votingOpens ? 'border-red-500' : ''}
              />
              {errors.votingOpens && (
                <p className="text-sm text-red-600">{errors.votingOpens.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="votingCloses">Voting Closes *</Label>
              <Input
                id="votingCloses"
                type="datetime-local"
                {...register('votingCloses')}
                className={errors.votingCloses ? 'border-red-500' : ''}
              />
              {errors.votingCloses && (
                <p className="text-sm text-red-600">{errors.votingCloses.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Position'}
            </Button>
          </div>
        </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePositionModal;

