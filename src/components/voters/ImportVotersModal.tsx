import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { votersAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

interface ImportVotersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ImportVotersModal: React.FC<ImportVotersModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
    } else {
      // File was cleared/removed - delete all voters from database
      // This ensures that when CSV is deleted, the database is also cleared
      handleDeleteAllOnFileClear();
      setFile(null);
    }
  };

  const handleDeleteAllOnFileClear = async () => {
    try {
      const response = await votersAPI.deleteAll();
      const deletedCount = response.deletedCount || {};
      const votersDeleted = deletedCount.voters || 0;
      const positionsDeleted = deletedCount.positions || 0;
      const candidatesDeleted = deletedCount.candidates || 0;
      
      if (votersDeleted > 0 || positionsDeleted > 0 || candidatesDeleted > 0) {
        const parts = [];
        if (votersDeleted > 0) parts.push(`${votersDeleted} voter(s)`);
        if (positionsDeleted > 0) parts.push(`${positionsDeleted} position(s)`);
        if (candidatesDeleted > 0) parts.push(`${candidatesDeleted} candidate(s)`);
        
        toast.success(`CSV file removed. All voting data cleared: ${parts.join(', ')}. System ready for new voting cycle.`);
        onSuccess(); // Refresh dashboard stats
      }
    } catch (err: any) {
      console.error('Failed to delete voting data when CSV was cleared:', err);
      // Don't show error toast as this is automatic cleanup
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await votersAPI.importCSV(formData);
      const summary = response.summary || {};
      toast.success(
        `Voters imported successfully! ${summary.created || 0} created, ${summary.updated || 0} updated.`
      );
      setFile(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to import voters');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      const response = await votersAPI.deleteAll();
      const deletedCount = response.deletedCount || {};
      const votersDeleted = deletedCount.voters || 0;
      const positionsDeleted = deletedCount.positions || 0;
      const candidatesDeleted = deletedCount.candidates || 0;
      
      const parts = [];
      if (votersDeleted > 0) parts.push(`${votersDeleted} voter(s)`);
      if (positionsDeleted > 0) parts.push(`${positionsDeleted} position(s)`);
      if (candidatesDeleted > 0) parts.push(`${candidatesDeleted} candidate(s)`);
      
      toast.success(`All voting data deleted: ${parts.join(', ')}. System ready for new voting cycle.`);
      setShowDeleteConfirm(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete voting data');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-[500px]">
        <CardHeader>
          <CardTitle>Import Eligible Voters</CardTitle>
          <CardDescription>
            Upload a CSV file with voter information. The CSV must include: reg_no, name, email, phone, program. Both email and phone are required for OTP delivery.
          </CardDescription>
        </CardHeader>
        <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csvFile">CSV File *</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-sm font-semibold mb-2">CSV Format:</p>
            <pre className="text-xs text-muted-foreground">
{`reg_no,name,email,phone,program
S21B13/001,John Doe,john@organization.com,+256701234567,Computer Science
S21B13/002,Jane Smith,jane@organization.com,+256701234568,Information Systems`}
            </pre>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              ⚠️ <strong>Required:</strong> Both email and phone are mandatory. Phone numbers should be in international format (e.g., +256701234567) or local format (0701234567).
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <Button 
            type="button" 
            variant="destructive" 
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading || deleting}
          >
            {deleting ? 'Deleting...' : '🗑️ Delete All Voting Data'}
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading || deleting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !file || deleting}>
              {loading ? 'Importing...' : 'Import Voters'}
            </Button>
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">⚠️ Delete All Voting Data?</CardTitle>
              <CardDescription>
                <div className="space-y-2">
                  <p className="font-semibold text-red-700">This will permanently delete:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                    <li>All eligible voters</li>
                    <li>All positions</li>
                    <li>All candidates</li>
                    <li>All votes cast</li>
                    <li>All ballots issued</li>
                    <li>All OTP verifications</li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-3">
                    <strong>This action cannot be undone.</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    Use this to clear everything for a new voting cycle. You can then import a new CSV and create new positions.
                  </p>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteAll} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Yes, Delete Everything'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ImportVotersModal;

