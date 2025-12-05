import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import CreateOfficerModal from '../components/users/CreateOfficerModal';
import OfficerDetailsModal from '../components/users/OfficerDetailsModal';
import CreatePositionModal from '../components/positions/CreatePositionModal';
import PositionsListModal from '../components/positions/PositionsListModal';
import CandidatesListModal from '../components/candidates/CandidatesListModal';
import ImportVotersModal from '../components/voters/ImportVotersModal';
import VotersListModal from '../components/voters/VotersListModal';
import AuditLogModal from '../components/audit/AuditLogModal';
import ExportReportsModal from '../components/reports/ExportReportsModal';
import { usersAPI, positionsAPI, candidatesAPI, votersAPI, reportsAPI } from '../services/api';
import Logo from '../components/ui/Logo';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [isCreateOfficerOpen, setIsCreateOfficerOpen] = useState(false);
  const [isOfficerDetailsOpen, setIsOfficerDetailsOpen] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState<any | null>(null);
  const [isCreatePositionOpen, setIsCreatePositionOpen] = useState(false);
  const [isPositionsListOpen, setIsPositionsListOpen] = useState(false);
  const [isCandidatesListOpen, setIsCandidatesListOpen] = useState(false);
  const [isImportVotersOpen, setIsImportVotersOpen] = useState(false);
  const [isVotersListOpen, setIsVotersListOpen] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [isExportReportsOpen, setIsExportReportsOpen] = useState(false);
  const [officers, setOfficers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    positions: 0,
    candidates: 0,
    voters: 0,
    votes: 0,
  });
  const [loading, setLoading] = useState(false);

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
    
    // Load data
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load officers
      const allUsers = await usersAPI.getAll();
      const officersList = allUsers.filter((u: any) => u.role === 'OFFICER');
      setOfficers(officersList);

      // Load stats - always fetch fresh from backend, no caching
      const [positions, candidates, votersResponse, turnoutData] = await Promise.all([
        positionsAPI.getAll().catch(() => []),
        candidatesAPI.getAll().catch(() => []),
        votersAPI.getAll().catch(() => ({ voters: [], pagination: { total: 0 } })),
        reportsAPI.getTurnout().catch(() => ({ votesCast: 0 })),
      ]);

      // Set stats from backend response only - no fallback values
      setStats({
        positions: Array.isArray(positions) ? positions.length : 0,
        candidates: Array.isArray(candidates) ? candidates.length : 0,
        voters: votersResponse?.pagination?.total ?? (Array.isArray(votersResponse?.voters) ? votersResponse.voters.length : 0),
        votes: turnoutData?.votesCast ?? 0,
      });
      
      console.log('Dashboard stats loaded from backend:', {
        positions: positions.length,
        candidates: candidates.length,
        voters: votersResponse?.pagination?.total || votersResponse?.voters?.length || 0,
        votes: turnoutData?.votesCast || 0,
      });
    } catch (err) {
      console.error('Failed to load data:', err);
      // On error, reset to zero
      setStats({
        positions: 0,
        candidates: 0,
        voters: 0,
        votes: 0,
      });
      setOfficers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('welcomeMessage');
    navigate('/login');
  };

  const handleOfficerClick = (officer: any) => {
    setSelectedOfficer(officer);
    setIsOfficerDetailsOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Modern Navbar */}
      <nav className="relative z-10 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20 items-center">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Logo size="sm" showText={false} />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent truncate">
                  E-LONDA Admin
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Manage your voting system</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <Button
                variant="outline"
                onClick={loadData}
                disabled={loading}
                className="border-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 p-2 sm:px-4"
                title="Refresh Dashboard"
              >
                <svg className={`h-4 w-4 sm:h-5 sm:w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline ml-2">Refresh</span>
              </Button>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">{user.name || user.email}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="border-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200 text-xs sm:text-sm px-2 sm:px-4"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Out</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {welcomeMessage && (
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl sm:rounded-2xl shadow-2xl flex items-center justify-between animate-bounce-in transform hover:scale-[1.01] transition-transform duration-300">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm flex-shrink-0">
                <span className="text-2xl sm:text-4xl animate-bounce-slow">👑</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-2xl font-bold mb-1 truncate">{welcomeMessage}</h3>
                <p className="text-xs sm:text-sm text-blue-100 hidden sm:block">You're all set! Start managing your voting system.</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWelcomeMessage(null)}
              className="text-white hover:bg-white/20 rounded-full h-8 w-8 p-0 flex-shrink-0"
            >
              ✕
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="cursor-pointer border-2 border-blue-200/50 bg-white/90 backdrop-blur-sm hover:border-blue-400 hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in-up" 
            style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
            onClick={() => setIsPositionsListOpen(true)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-600">Total Positions</CardTitle>
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600 mb-1">{loading ? '...' : stats.positions}</p>
              <p className="text-xs text-gray-500">Click to manage</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer border-2 border-purple-200/50 bg-white/90 backdrop-blur-sm hover:border-purple-400 hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in-up" 
            style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
            onClick={() => setIsCandidatesListOpen(true)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-600">Total Candidates</CardTitle>
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-purple-600 mb-1">{loading ? '...' : stats.candidates}</p>
              <p className="text-xs text-gray-500">Click to manage</p>
            </CardContent>
          </Card>

          <Card 
            className="border-2 border-green-200/50 bg-white/90 backdrop-blur-sm hover:border-green-400 hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in-up cursor-pointer" 
            style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
            onClick={() => setIsVotersListOpen(true)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-600">Eligible Voters</CardTitle>
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600 mb-1">{loading ? '...' : stats.voters.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Click to view list</p>
            </CardContent>
          </Card>

          <Card 
            className="border-2 border-orange-200/50 bg-white/90 backdrop-blur-sm hover:border-orange-400 hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in-up" 
            style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-600">Votes Cast</CardTitle>
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-orange-600 mb-1">{loading ? '...' : stats.votes}</p>
              <p className="text-xs text-gray-500">Total votes</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-2 border-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-purple-900/20 backdrop-blur-xl shadow-2xl animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    Quick Actions
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">Streamline your election management</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Create Officer */}
                <button
                  onClick={() => setIsCreateOfficerOpen(true)}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-transparent dark:from-blue-500/20 dark:via-blue-400/10 border border-blue-200/50 dark:border-blue-700/50 p-6 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
                  <div className="relative flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Create Officer
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Add new election officer</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                {/* Create Position */}
                <button
                  onClick={() => setIsCreatePositionOpen(true)}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent dark:from-purple-500/20 dark:via-purple-400/10 border border-purple-200/50 dark:border-purple-700/50 p-6 hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300"></div>
                  <div className="relative flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        Create Position
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Add new election position</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                {/* Manage Positions */}
                <button
                  onClick={() => setIsPositionsListOpen(true)}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-400/5 to-transparent dark:from-emerald-500/20 dark:via-emerald-400/10 border border-emerald-200/50 dark:border-emerald-700/50 p-6 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/10 group-hover:to-teal-500/10 transition-all duration-300"></div>
                  <div className="relative flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        Manage Positions
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Extend voting times</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                {/* Import Voters */}
                <button
                  onClick={() => setIsImportVotersOpen(true)}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500/10 via-teal-400/5 to-transparent dark:from-teal-500/20 dark:via-teal-400/10 border border-teal-200/50 dark:border-teal-700/50 p-6 hover:border-teal-400 dark:hover:border-teal-500 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/20 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 to-cyan-500/0 group-hover:from-teal-500/10 group-hover:to-cyan-500/10 transition-all duration-300"></div>
                  <div className="relative flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        Import Voters
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Upload CSV file</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                {/* Audit Log */}
                <button
                  onClick={() => setIsAuditLogOpen(true)}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-400/5 to-transparent dark:from-indigo-500/20 dark:via-indigo-400/10 border border-indigo-200/50 dark:border-indigo-700/50 p-6 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-blue-500/0 group-hover:from-indigo-500/10 group-hover:to-blue-500/10 transition-all duration-300"></div>
                  <div className="relative flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        Audit Log
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">View activity history</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                {/* Reports */}
                <button
                  onClick={() => setIsExportReportsOpen(true)}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 via-cyan-400/5 to-transparent dark:from-cyan-500/20 dark:via-cyan-400/10 border border-cyan-200/50 dark:border-cyan-700/50 p-6 hover:border-cyan-400 dark:hover:border-cyan-500 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-teal-500/0 group-hover:from-cyan-500/10 group-hover:to-teal-500/10 transition-all duration-300"></div>
                  <div className="relative flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 dark:from-cyan-600 dark:to-cyan-700 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        Reports
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Export & analytics</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Returning Officers */}
          <Card className="border-2 border-gray-200/50 bg-white/90 backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">👥</span>
                Returning Officers
                <span className="ml-auto text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {officers.length}
                </span>
              </CardTitle>
              <CardDescription>Manage election officers</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : officers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">👤</div>
                  <p className="text-sm text-gray-500 mb-4">No officers created yet</p>
                  <Button 
                    size="sm"
                    onClick={() => setIsCreateOfficerOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Create First Officer
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {officers.map((officer, index) => (
                    <div 
                      key={officer.id} 
                      className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 animate-fade-in-up cursor-pointer"
                      style={{ animationDelay: `${0.7 + index * 0.1}s`, animationFillMode: 'both' }}
                      onClick={() => handleOfficerClick(officer)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {officer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{officer.name}</p>
                          <p className="text-xs text-gray-500 truncate">{officer.email}</p>
                          {officer.staffId && (
                            <p className="text-xs text-gray-400 mt-1">ID: {officer.staffId}</p>
                          )}
                        </div>
                        <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <CreateOfficerModal
        isOpen={isCreateOfficerOpen}
        onClose={() => setIsCreateOfficerOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />
      <OfficerDetailsModal
        isOpen={isOfficerDetailsOpen}
        onClose={() => {
          setIsOfficerDetailsOpen(false);
          setSelectedOfficer(null);
        }}
        officer={selectedOfficer}
        onDeleted={() => {
          loadData();
        }}
        onStatusChanged={() => {
          loadData();
        }}
      />
      <CreatePositionModal
        isOpen={isCreatePositionOpen}
        onClose={() => setIsCreatePositionOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />
      <PositionsListModal
        isOpen={isPositionsListOpen}
        onClose={() => setIsPositionsListOpen(false)}
        onPositionDeleted={() => {
          loadData();
        }}
        onSuccess={loadData}
      />
      <CandidatesListModal
        isOpen={isCandidatesListOpen}
        onClose={() => setIsCandidatesListOpen(false)}
        onCandidateDeleted={() => {
          loadData();
        }}
        onSuccess={loadData}
      />
      <ImportVotersModal
        isOpen={isImportVotersOpen}
        onClose={() => setIsImportVotersOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />
      <VotersListModal
        isOpen={isVotersListOpen}
        onClose={() => setIsVotersListOpen(false)}
      />
      <AuditLogModal
        isOpen={isAuditLogOpen}
        onClose={() => setIsAuditLogOpen(false)}
      />
      <ExportReportsModal
        isOpen={isExportReportsOpen}
        onClose={() => setIsExportReportsOpen(false)}
      />
    </div>
  );
};

export default AdminDashboard;
