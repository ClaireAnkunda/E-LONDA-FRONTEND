import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { reportsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

interface ExportReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExportReportsModal: React.FC<ExportReportsModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (type: string, format: 'csv' | 'pdf') => {
    setLoading(`${type}-${format}`);
    try {
      const blob = await reportsAPI.export(`${type}-${format}`);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`${type} report exported successfully!`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to export ${type} report`);
    } finally {
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-[600px]">
        <CardHeader>
          <CardTitle className="text-2xl">Reports & Analytics</CardTitle>
          <CardDescription>
            View comprehensive reports with charts and analytics, or export data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* View Reports Dashboard Button */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
              <h3 className="font-semibold text-lg mb-2 text-blue-700">Visual Reports Dashboard</h3>
              <p className="text-sm text-gray-600 mb-4">
                View interactive charts, graphs, and detailed analytics with percentages and comparisons
              </p>
            <Button
              onClick={() => {
                onClose();
                // Use setTimeout to ensure modal closes before navigation
                setTimeout(() => {
                  navigate('/admin/reports');
                }, 100);
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
            >
              View Reports Dashboard
            </Button>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-4">Export Reports</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Turnout Report</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleExport('turnout', 'csv')}
                      disabled={loading === 'turnout-csv'}
                    >
                      {loading === 'turnout-csv' ? 'Exporting...' : 'Export CSV'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleExport('turnout', 'pdf')}
                      disabled={loading === 'turnout-pdf'}
                    >
                      {loading === 'turnout-pdf' ? 'Exporting...' : 'Export PDF'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Results Report</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleExport('results', 'csv')}
                      disabled={loading === 'results-csv'}
                    >
                      {loading === 'results-csv' ? 'Exporting...' : 'Export CSV'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleExport('results', 'pdf')}
                      disabled={loading === 'results-pdf'}
                    >
                      {loading === 'results-pdf' ? 'Exporting...' : 'Export PDF'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Audit Log</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleExport('audit', 'csv')}
                      disabled={loading === 'audit-csv'}
                    >
                      {loading === 'audit-csv' ? 'Exporting...' : 'Export CSV'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportReportsModal;

