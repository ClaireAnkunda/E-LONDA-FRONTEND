import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

const AccountDeactivated: React.FC = () => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-red-200/50 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">Account Deactivated</CardTitle>
          <CardDescription className="text-base">
            Your returning officer account has been deactivated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800 font-medium mb-2">
              ⚠️ Your account is currently inactive
            </p>
            <p className="text-sm text-red-700">
              You no longer have access to the system. If you believe this is an error, please contact the administrator for assistance.
            </p>
          </div>
          
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-900 mb-1">Contact Administrator:</p>
            <p className="text-sm text-blue-800">
              Please reach out to the system administrator to reactivate your account.
            </p>
          </div>

          <Button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold h-12"
          >
            Return to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountDeactivated;







