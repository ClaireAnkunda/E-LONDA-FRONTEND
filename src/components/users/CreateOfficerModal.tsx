import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usersAPI } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const officerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  staffId: z.string().optional(),
});

type OfficerFormData = z.infer<typeof officerSchema>;

interface CreateOfficerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateOfficerModal: React.FC<CreateOfficerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<OfficerFormData>({
    resolver: zodResolver(officerSchema),
  });

  const onSubmit = async (data: OfficerFormData) => {
    setError('');
    setLoading(true);

    try {
      await usersAPI.create({
        ...data,
        role: 'OFFICER',
      });

      // Store credentials to show
      setCreatedCredentials({
        email: data.email,
        password: data.password,
      });

      // Reset form
      reset();
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create officer');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCreatedCredentials(null);
    setError('');
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Returning Officer</CardTitle>
          <CardDescription>
            Create a new returning officer account with login credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          {createdCredentials ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✅ Officer Created Successfully!</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> {createdCredentials.email}</p>
                  <p><strong>Password:</strong> {createdCredentials.password}</p>
                </div>
                <p className="text-xs text-green-600 mt-3">
                  ⚠️ Please save these credentials. The officer can now log in with these details.
                </p>
              </div>
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...register('name')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="officer@organization.com"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  {...register('password')}
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="staffId">Staff ID (Optional)</Label>
                <Input
                  id="staffId"
                  placeholder="STAFF/2020/001"
                  {...register('staffId')}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Officer'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateOfficerModal;





