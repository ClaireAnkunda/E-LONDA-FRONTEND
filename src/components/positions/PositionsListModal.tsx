import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { positionsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../lib/utils';

interface Position {
  id: string;
  name: string;
  seats: number;
  nominationOpens: string;
  nominationCloses: string;
  votingOpens: string;
  votingCloses: string;
  _count?: {
    candidates: number;
    votes: number;
  };
}

interface PositionsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPositionDeleted?: () => void;
  onSuccess?: () => void;
}

const PositionsListModal: React.FC<PositionsListModalProps> = ({ isOpen, onClose, onPositionDeleted, onSuccess }) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [extending, setExtending] = useState<string | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [nominationHours, setNominationHours] = useState<string>('');
  const [votingHours, setVotingHours] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchPositions();
    }
  }, [isOpen]);

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const data = await positionsAPI.getAll();
      setPositions(data);
    } catch (err: any) {
      toast.error('Failed to load positions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone if there are candidates or votes.`)) {
      return;
    }

    setDeleting(id);
    try {
      await positionsAPI.delete(id);
      toast.success('Position deleted successfully');
      fetchPositions();
      if (onPositionDeleted) {
        onPositionDeleted();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete position');
    } finally {
      setDeleting(null);
    }
  };

  const openExtendModal = (position: Position) => {
    setSelectedPosition(position);
    setNominationHours('');
    setVotingHours('');
    setShowExtendModal(true);
  };

  const closeExtendModal = () => {
    setShowExtendModal(false);
    setSelectedPosition(null);
    setNominationHours('');
    setVotingHours('');
  };

  const handleExtendTime = async () => {
    if (!selectedPosition) return;

    if (!nominationHours && !votingHours) {
      toast.error('Please enter at least one extension value');
      return;
    }

    setExtending(selectedPosition.id);
    try {
      await positionsAPI.extendTime(selectedPosition.id, {
        extendNominationHours: nominationHours ? parseFloat(nominationHours) : undefined,
        extendVotingHours: votingHours ? parseFloat(votingHours) : undefined,
      });
              toast.success('Time windows extended successfully');
              closeExtendModal();
              fetchPositions();
              if (onSuccess) {
                onSuccess();
              }
              if (onPositionDeleted) {
                onPositionDeleted();
              }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to extend time windows');
    } finally {
      setExtending(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>All Positions ({positions.length})</CardTitle>
          <CardDescription>
            View and manage all election positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading positions...</p>
          ) : positions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No positions created yet</p>
          ) : (
            <div className="space-y-4">
              {positions.map((position) => (
                <div
                  key={position.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{position.name}</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-2">
                        <div>
                          <strong>Seats:</strong> {position.seats}
                        </div>
                        <div>
                          <strong>Candidates:</strong> {position._count?.candidates || 0}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                          <strong>Nomination:</strong>{' '}
                          {formatDate(position.nominationOpens)} -{' '}
                          {formatDate(position.nominationCloses)}
                        </p>
                        <p>
                          <strong>Voting:</strong>{' '}
                          {formatDate(position.votingOpens)} -{' '}
                          {formatDate(position.votingCloses)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => openExtendModal(position)}
                        disabled={extending === position.id || deleting === position.id}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {extending === position.id ? 'Extending...' : '⏰ Extend Time'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(position.id, position.name)}
                        disabled={deleting === position.id || extending === position.id || (position._count?.candidates || 0) > 0 || (position._count?.votes || 0) > 0}
                      >
                        {deleting === position.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                  {(position._count?.candidates || 0) > 0 && (
                    <p className="text-xs text-slate-600 mt-2">
                      ⚠️ Cannot delete: Has {position._count?.candidates} candidate(s)
                    </p>
                  )}
                  {(position._count?.votes || 0) > 0 && (
                    <p className="text-xs text-slate-600 mt-2">
                      ⚠️ Cannot delete: Has {position._count?.votes} vote(s)
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Extend Time Modal */}
      {showExtendModal && selectedPosition && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Extend Time Windows</CardTitle>
              <CardDescription>
                Extend the nomination or voting period for "{selectedPosition.name}".
                <br />
                Enter the number of hours to extend each window.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nominationHours">Extend Nomination Period (hours)</Label>
                  <Input
                    id="nominationHours"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="e.g., 24 (for 1 day)"
                    value={nominationHours}
                    onChange={(e) => setNominationHours(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Current closes: {formatDate(selectedPosition.nominationCloses)}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="votingHours">Extend Voting Period (hours)</Label>
                  <Input
                    id="votingHours"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="e.g., 48 (for 2 days)"
                    value={votingHours}
                    onChange={(e) => setVotingHours(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Current closes: {formatDate(selectedPosition.votingCloses)}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={closeExtendModal} disabled={extending !== null}>
                  Cancel
                </Button>
                <Button onClick={handleExtendTime} disabled={extending !== null || (!nominationHours && !votingHours)}>
                  {extending ? 'Extending...' : 'Extend Time'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PositionsListModal;

