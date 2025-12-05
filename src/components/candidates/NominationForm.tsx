import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { candidatesAPI, positionsAPI, authAPI } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../lib/utils';

const nominationSchema = z.object({
  positionId: z.string().min(1, 'Please select a position'),
  manifesto: z.instanceof(FileList).refine(
    (files) => files.length > 0,
    'Manifesto PDF is required'
  ).refine(
    (files) => files[0]?.type === 'application/pdf',
    'Manifesto must be a PDF file'
  ),
  photo: z.instanceof(FileList).refine(
    (files) => files.length > 0,
    'Photo is required'
  ).refine(
    (files) => files[0]?.type.startsWith('image/'),
    'Photo must be an image file'
  ),
});

type NominationFormData = z.infer<typeof nominationSchema>;

interface Position {
  id: string;
  name: string;
  nominationOpens: string;
  nominationCloses: string;
  votingOpens?: string;
  votingCloses?: string;
}

interface NominationFormProps {
  onSuccess?: () => void;
}

const NominationForm: React.FC<NominationFormProps> = ({ onSuccess }) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPositions, setLoadingPositions] = useState(true);
  const [userInfo, setUserInfo] = useState<{ name: string; program: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<NominationFormData>({
    resolver: zodResolver(nominationSchema),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user info, open positions, and all positions in parallel
        // We fetch all positions to show information about closed nominations
        const [userResponse, openPositions, allPos] = await Promise.all([
          authAPI.getCurrentUser(),
          positionsAPI.getOpenPositions(),
          positionsAPI.getAll().catch(() => []), // Get all positions for reference
        ]);

        // Set user info
        if (userResponse.user) {
          setUserInfo({
            name: userResponse.user.name,
            program: userResponse.user.program,
          });
        }

        // Set open positions (for submitting nominations)
        setPositions(openPositions);
        // Set all positions (to show closed positions info)
        setAllPositions(allPos);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load information');
      } finally {
        setLoadingPositions(false);
      }
    };

    fetchData();
  }, []);

  const onSubmit = async (data: NominationFormData) => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('positionId', data.positionId);
      formData.append('manifesto', data.manifesto[0]);
      formData.append('photo', data.photo[0]);

      await candidatesAPI.submitNomination(formData);
      toast.success('Nomination submitted successfully!');
      reset();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to submit nomination';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedPositionId = watch('positionId');
  const selectedPosition = positions.find((p) => p.id === selectedPositionId);

  if (loadingPositions) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading positions...</p>
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0) {
    // Check if there are any positions that have closed
    const now = new Date();
    const closedPositions = allPositions.filter((pos) => {
      const closesDate = new Date(pos.nominationCloses);
      return closesDate < now;
    });
    
    const upcomingPositions = allPositions.filter((pos) => {
      const opensDate = new Date(pos.nominationOpens);
      return opensDate > now;
    });

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">⏰</span>
            Nomination Period Closed
          </CardTitle>
          <CardDescription>
            No positions are currently accepting nominations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {closedPositions.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                Recently Closed Nominations
              </h4>
              <div className="space-y-2">
                {closedPositions.slice(0, 3).map((pos) => (
                  <div key={pos.id} className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      {pos.name}
                    </p>
                    <p className="text-amber-700 dark:text-amber-300">
                      Closed: {formatDate(pos.nominationCloses)}
                    </p>
                    {pos.votingOpens && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Voting opens: {formatDate(pos.votingOpens)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {upcomingPositions.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Upcoming Nominations
              </h4>
              <div className="space-y-2">
                {upcomingPositions.slice(0, 3).map((pos) => (
                  <div key={pos.id} className="text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                      {pos.name}
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                      Opens: {formatDate(pos.nominationOpens)}
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                      Closes: {formatDate(pos.nominationCloses)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              What's Next?
            </h4>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
              <li>Check the status of your existing nominations in "My Nominations"</li>
              <li>Wait for the returning officer to review your submissions</li>
              <li>Once approved, you'll be eligible for voting</li>
              {upcomingPositions.length === 0 && closedPositions.length === 0 && (
                <li>New positions may be added by the administrator</li>
              )}
            </ul>
          </div>

          {allPositions.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-4">
              No election positions have been created yet. Please check back later.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit New Nomination</CardTitle>
        <CardDescription>
          Your name and program will be automatically used from your account. Just select a position and upload your documents.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Display user info */}
          {userInfo && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Your Information (from your account):
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Name:</span>
                  <p className="text-blue-900 dark:text-blue-100">{userInfo.name}</p>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Program:</span>
                  <p className="text-blue-900 dark:text-blue-100">{userInfo.program}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="positionId">Position *</Label>
            <select
              id="positionId"
              {...register('positionId')}
              className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.positionId ? 'border-red-500' : ''
              }`}
            >
              <option value="">Select a position</option>
              {positions.map((position) => (
                <option key={position.id} value={position.id}>
                  {position.name}
                </option>
              ))}
            </select>
            {errors.positionId && (
              <p className="text-sm text-red-600">{errors.positionId.message}</p>
            )}
            {selectedPosition && (
              <p className="text-xs text-muted-foreground">
                Nomination closes: {formatDate(selectedPosition.nominationCloses)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="manifesto">Manifesto (PDF) *</Label>
            <Input
              id="manifesto"
              type="file"
              accept="application/pdf"
              {...register('manifesto')}
              className={errors.manifesto ? 'border-red-500' : ''}
            />
            {errors.manifesto && (
              <p className="text-sm text-red-600">{errors.manifesto.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Upload your manifesto as a PDF file (max 10MB)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo">Photo *</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              {...register('photo')}
              className={errors.photo ? 'border-red-500' : ''}
            />
            {errors.photo && (
              <p className="text-sm text-red-600">{errors.photo.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Upload your photo (max 10MB)
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Nomination'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default NominationForm;




