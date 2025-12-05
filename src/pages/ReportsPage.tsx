import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import ReportsDashboard from '../components/reports/ReportsDashboard';

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Election Reports</h2>
            <p className="text-sm text-gray-600">Comprehensive analytics and visualizations</p>
          </div>
          <Button
            onClick={() => navigate('/admin/dashboard')}
            variant="outline"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
      <ReportsDashboard />
    </div>
  );
};

export default ReportsPage;






