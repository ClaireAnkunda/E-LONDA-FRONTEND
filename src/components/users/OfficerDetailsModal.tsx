import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { usersAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

interface Officer {
  id: string;
  name: string;
  email: string;
  staffId?: string;
  role: string;
  status?: string;
  createdAt?: string;
}

interface OfficerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  officer: Officer | null;
  onDeleted: () => void;
  onStatusChanged?: () => void;
}

const OfficerDetailsModal: React.FC<OfficerDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  officer,
  onDeleted,
  onStatusChanged
}) => {
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [currentOfficer, setCurrentOfficer] = useState<Officer | null>(officer);

  // Update current officer when prop changes
  useEffect(() => {
    setCurrentOfficer(officer);
  }, [officer]);

  if (!isOpen || !currentOfficer) return null;

  const isActive = currentOfficer.status === 'ACTIVE';

  const handleActivate = async () => {
    setTogglingStatus(true);
    try {
      await usersAPI.activate(currentOfficer.id);
      toast.success('Officer activated successfully');
      setCurrentOfficer({ ...currentOfficer, status: 'ACTIVE' });
      if (onStatusChanged) {
        onStatusChanged();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to activate officer';
      toast.error(errorMessage);
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm(`Are you sure you want to deactivate "${currentOfficer.name}"? They will not be able to access the system until reactivated.`)) {
      return;
    }
    
    setTogglingStatus(true);
    try {
      await usersAPI.deactivate(currentOfficer.id);
      toast.success('Officer deactivated successfully');
      setCurrentOfficer({ ...currentOfficer, status: 'INACTIVE' });
      if (onStatusChanged) {
        onStatusChanged();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to deactivate officer';
      toast.error(errorMessage);
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await usersAPI.delete(currentOfficer.id);
      toast.success('Officer deleted successfully');
      setShowDeleteConfirm(false);
      onDeleted();
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to delete officer';
      // If officer not found, it might have already been deleted - refresh list
      if (errorMessage.includes('not found') || err.response?.status === 404) {
        toast.success('Officer already removed. Refreshing list...');
        onDeleted();
        onClose();
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                {currentOfficer.name.charAt(0).toUpperCase()}
              </div>
              Officer Details
            </CardTitle>
            <CardDescription>View and manage returning officer information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">Full Name</p>
                  <p className="text-base text-gray-900 font-medium">{currentOfficer.name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">Email Address</p>
                  <p className="text-base text-gray-900">{currentOfficer.email}</p>
                </div>
                {currentOfficer.staffId && (
                  <div>
                    <p className="text-sm font-semibold text-gray-500 mb-1">Staff ID</p>
                    <p className="text-base text-gray-900">{currentOfficer.staffId}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">Role</p>
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                    {currentOfficer.role}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    currentOfficer.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {currentOfficer.status || 'ACTIVE'}
                  </span>
                </div>
                {currentOfficer.createdAt && (
                  <div>
                    <p className="text-sm font-semibold text-gray-500 mb-1">Account Created</p>
                    <p className="text-base text-gray-900">{formatDate(currentOfficer.createdAt)}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-2">
                {isActive ? (
                  <Button
                    variant="outline"
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                    onClick={handleDeactivate}
                    disabled={togglingStatus || deleting}
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    {togglingStatus ? 'Deactivating...' : 'Deactivate Account'}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-green-300 text-green-700 hover:bg-green-50"
                    onClick={handleActivate}
                    disabled={togglingStatus || deleting}
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {togglingStatus ? 'Activating...' : 'Activate Account'}
                  </Button>
                )}
              </div>

              <div className="pt-2 border-t border-gray-200">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting || togglingStatus}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Officer Account
                </Button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onClose} disabled={deleting || togglingStatus}>
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">⚠️ Delete Officer Account?</CardTitle>
              <CardDescription>
                <div className="space-y-2">
                  <p className="font-semibold text-red-700">This will permanently delete:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                    <li>Officer: <strong>{currentOfficer.name}</strong></li>
                    <li>Email: <strong>{currentOfficer.email}</strong></li>
                    <li>All associated account data</li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-3">
                    <strong>This action cannot be undone.</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    The officer will no longer be able to access the system.
                  </p>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Yes, Delete Account'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default OfficerDetailsModal;

