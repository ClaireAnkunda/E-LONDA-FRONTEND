import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { candidatesAPI } from '../services/api';
import NominationForm from '../components/candidates/NominationForm';
import { toast } from 'react-hot-toast';
import { getFileUrl } from '../lib/imageUtils';

interface Nomination {
  id: string;
  position: {
    id: string;
    name: string;
    nominationOpens: string;
    nominationCloses: string;
  };
  name: string;
  program: string;
  manifestoUrl: string | null;
  photoUrl: string | null;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  reason: string | null;
  createdAt: string;
}

const CandidateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
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
  }, []);

  const fetchNominations = async () => {
    setLoading(true);
    try {
      const data = await candidatesAPI.getMyNominations();
      setNominations(data);
    } catch (error) {
      console.error('Failed to fetch nominations:', error);
      toast.error('Failed to load nominations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNominations();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('welcomeMessage');
    navigate('/login');
  };

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
          <div className="flex justify-between h-14 sm:h-16 items-center">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
              Candidate Dashboard
            </h1>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:inline truncate max-w-[120px]">
                {user.name || user.email}
              </span>
              <Button variant="outline" onClick={handleLogout} className="text-xs sm:text-sm px-2 sm:px-4">
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Out</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {welcomeMessage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-5 duration-500">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎯</span>
              <div>
                <h3 className="text-xl font-bold">{welcomeMessage}</h3>
                <p className="text-sm text-purple-100">Submit your nominations and track your campaign.</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>My Nominations</CardTitle>
                    <CardDescription>
                      Track the status of your submitted nominations
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ New Nomination'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading nominations...</p>
                ) : nominations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground mb-4">
                      No nominations submitted yet
                    </p>
                    <Button onClick={() => setShowForm(true)}>
                      Submit Your First Nomination
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {nominations.map((nomination) => (
                      <div
                        key={nomination.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex gap-4">
                          {/* Photo */}
                          <div className="flex-shrink-0">
                            {nomination.photoUrl ? (
                              <img
                                src={getFileUrl(nomination.photoUrl) || ''}
                                alt={nomination.name}
                                className="w-20 h-20 object-cover rounded-lg border shadow-sm"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nomination.name)}&background=6366f1&color=fff&size=128&bold=true`;
                                }}
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-lg border shadow-sm bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">
                                  {nomination.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Details */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">{nomination.position.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {nomination.name} • {nomination.program}
                                </p>
                              </div>
                              {getStatusBadge(nomination.status)}
                            </div>
                            
                            {/* Rejection Reason - Only show for rejected nominations */}
                            {nomination.status === 'REJECTED' && nomination.reason && (
                              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg">
                                <div className="flex items-start gap-2">
                                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
                                      Rejection Reason:
                                    </p>
                                    <p className="text-sm text-red-800 dark:text-red-300">
                                      {nomination.reason}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div className="mt-2 text-xs text-muted-foreground">
                              Submitted: {new Date(nomination.createdAt).toLocaleString()}
                            </div>
                            {nomination.manifestoUrl && (
                              <a
                                href={getFileUrl(nomination.manifestoUrl) || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                              >
                                View Manifesto
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            {showForm && (
              <NominationForm
                onSuccess={() => {
                  setShowForm(false);
                  fetchNominations();
                }}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CandidateDashboard;
