import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { candidatesAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { getFileUrl } from '../lib/imageUtils';

interface Nomination {
  id: string;
  position: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    email: string;
    name: string;
    regNo: string | null;
    program: string | null;
  };
  name: string;
  program: string;
  manifestoUrl: string | null;
  photoUrl: string | null;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  reason: string | null;
  createdAt: string;
}

const OfficerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({});
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null);

  useEffect(() => {
    // Check if account is deactivated
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.status === 'INACTIVE') {
        // ProtectedRoute should handle this, but double-check here
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/admin/login');
        toast.error('Your account has been deactivated. Please contact the administrator.');
        return;
      }
    }

    // Check for welcome message from login
    const welcomeData = localStorage.getItem('welcomeMessage');
    if (welcomeData) {
      try {
        const welcome = JSON.parse(welcomeData);
        // Show welcome message if it's recent (within last 30 seconds)
        if (Date.now() - welcome.timestamp < 30000) {
          setWelcomeMessage(welcome.message);
          // Auto-remove after 10 seconds
          setTimeout(() => {
            setWelcomeMessage(null);
            localStorage.removeItem('welcomeMessage');
          }, 10000);
        } else {
          localStorage.removeItem('welcomeMessage');
        }
      } catch (e) {
        localStorage.removeItem('welcomeMessage');
      }
    }

    // Fetch nominations
    fetchNominations();
  }, []);

  const fetchNominations = async () => {
    setLoading(true);
    try {
      const data = await candidatesAPI.getAll();
      console.log('Fetched nominations with photos:', data.map((n: Nomination) => ({
        name: n.name,
        photoUrl: n.photoUrl,
        hasPhoto: !!n.photoUrl,
        fullPhotoUrl: getFileUrl(n.photoUrl)
      })));
      setNominations(data);
    } catch (err: any) {
      console.error('Failed to fetch nominations:', err);
      toast.error('Failed to load nominations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this nomination?')) {
      return;
    }

    setProcessing(id);
    try {
      await candidatesAPI.approve(id);
      toast.success('Nomination approved successfully');
      fetchNominations();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to approve nomination');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = rejectReason[id]?.trim();
    if (!reason) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    if (!confirm('Are you sure you want to reject this nomination?')) {
      return;
    }

    setProcessing(id);
    try {
      await candidatesAPI.reject(id, reason);
      toast.success('Nomination rejected successfully');
      setRejectReason({ ...rejectReason, [id]: '' });
      setShowRejectForm(null);
      fetchNominations();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reject nomination');
    } finally {
      setProcessing(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('welcomeMessage');
    navigate('/login');
  };

  const pendingNominations = nominations.filter((n) => n.status === 'SUBMITTED');
  const approvedNominations = nominations.filter((n) => n.status === 'APPROVED');
  const rejectedNominations = nominations.filter((n) => n.status === 'REJECTED');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            ✓ Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            ✗ Rejected
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">
            ⏳ Pending
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Returning Officer Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {user.name || user.email}
              </span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {welcomeMessage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-5 duration-500">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📋</span>
              <div>
                <h3 className="text-xl font-bold">{welcomeMessage}</h3>
                <p className="text-sm text-green-100">Review and manage candidate nominations.</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWelcomeMessage(null)}
              className="text-white hover:bg-white/20"
            >
              ✕
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pendingNominations.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{approvedNominations.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{rejectedNominations.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Nominations</CardTitle>
            <CardDescription>
              Review and approve or reject candidate nominations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading nominations...</p>
            ) : pendingNominations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No pending nominations</p>
            ) : (
              <div className="space-y-6">
                {pendingNominations.map((nomination) => (
                  <div
                    key={nomination.id}
                    className="p-6 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex gap-6">
                      {/* Photo - Always show actual uploaded image */}
                      <div className="flex-shrink-0 relative">
                        {nomination.photoUrl ? (
                          <>
                            <img
                              src={getFileUrl(nomination.photoUrl) || ''}
                              alt={`${nomination.name} photo`}
                              className="w-40 h-40 object-cover rounded-lg border-2 border-gray-300 shadow-lg"
                              onError={(e) => {
                                // Log error for debugging
                                console.error('Failed to load candidate photo:', {
                                  photoUrl: nomination.photoUrl,
                                  fullUrl: getFileUrl(nomination.photoUrl),
                                  candidate: nomination.name
                                });
                                // Hide image and show placeholder
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const placeholder = target.nextElementSibling as HTMLElement;
                                if (placeholder) {
                                  placeholder.style.display = 'flex';
                                }
                              }}
                              onLoad={(e) => {
                                // Image loaded successfully - hide placeholder
                                const target = e.target as HTMLImageElement;
                                console.log('✅ Candidate photo loaded:', nomination.name, nomination.photoUrl);
                                const placeholder = target.nextElementSibling as HTMLElement;
                                if (placeholder) {
                                  placeholder.style.display = 'none';
                                }
                              }}
                            />
                            {/* Placeholder - hidden by default, shown only on error */}
                            <div 
                              className="photo-placeholder w-40 h-40 rounded-lg border-2 border-gray-300 shadow-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center hidden"
                            >
                              <span className="text-5xl font-bold text-white">
                                {nomination.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)}
                              </span>
                            </div>
                          </>
                        ) : (
                          // Placeholder when no photoUrl at all
                          <div className="w-40 h-40 rounded-lg border-2 border-gray-300 shadow-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                            <span className="text-5xl font-bold text-white">
                              {nomination.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold mb-1">{nomination.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {nomination.position.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {nomination.program}
                            </p>
                            {nomination.user.regNo && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Reg No: {nomination.user.regNo}
                              </p>
                            )}
                          </div>
                          {getStatusBadge(nomination.status)}
                        </div>

                        {/* Manifesto */}
                        {nomination.manifestoUrl && (
                          <div className="mb-4">
                            <a
                              href={getFileUrl(nomination.manifestoUrl) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                              📄 View Manifesto PDF
                            </a>
                          </div>
                        )}

                        {/* Actions */}
                        {nomination.status === 'SUBMITTED' && (
                          <div className="flex gap-2 mt-4">
                            <Button
                              onClick={() => handleApprove(nomination.id)}
                              disabled={processing === nomination.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {processing === nomination.id ? 'Processing...' : '✓ Approve'}
                            </Button>
                            {showRejectForm !== nomination.id ? (
                              <Button
                                variant="destructive"
                                onClick={() => setShowRejectForm(nomination.id)}
                                disabled={processing === nomination.id}
                              >
                                ✗ Reject
                              </Button>
                            ) : (
                              <div className="flex-1 space-y-2">
                                <textarea
                                  placeholder="Enter rejection reason (required)..."
                                  value={rejectReason[nomination.id] || ''}
                                  onChange={(e) =>
                                    setRejectReason({
                                      ...rejectReason,
                                      [nomination.id]: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                  rows={3}
                                  required
                                />
                                <div className="flex gap-2">
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleReject(nomination.id)}
                                    disabled={processing === nomination.id || !rejectReason[nomination.id]?.trim()}
                                  >
                                    {processing === nomination.id ? 'Processing...' : 'Submit Rejection'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setShowRejectForm(null);
                                      setRejectReason({ ...rejectReason, [nomination.id]: '' });
                                    }}
                                    disabled={processing === nomination.id}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approved Nominations */}
        {approvedNominations.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Approved Nominations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {approvedNominations.map((nomination) => (
                  <div
                    key={nomination.id}
                    className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{nomination.name}</h4>
                        <p className="text-sm text-muted-foreground">{nomination.position.name}</p>
                      </div>
                      {getStatusBadge(nomination.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejected Nominations */}
        {rejectedNominations.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Rejected Nominations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rejectedNominations.map((nomination) => (
                  <div
                    key={nomination.id}
                    className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/20"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{nomination.name}</h4>
                        <p className="text-sm text-muted-foreground">{nomination.position.name}</p>
                        {nomination.reason && (
                          <p className="text-sm text-red-600 mt-1">
                            <strong>Reason:</strong> {nomination.reason}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(nomination.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default OfficerDashboard;
