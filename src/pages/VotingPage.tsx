import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { votesAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { getFileUrl } from '../lib/imageUtils';

interface Position {
  id: string;
  name: string;
  seats: number;
  votingOpens: string;
  votingCloses: string;
}

interface Candidate {
  id: string;
  name: string;
  program: string;
  photoUrl: string | null;
  status: string;
  position: {
    id: string;
    name: string;
  };
}

interface BallotData {
  positions: Position[];
  candidates: Candidate[];
}

const VotingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [ballotToken, setBallotToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ballotData, setBallotData] = useState<BallotData | null>(null);
  const [votes, setVotes] = useState<{ [positionId: string]: string }>({});
  const positionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    // Get ballot token from location state or localStorage
    const token = location.state?.ballotToken || localStorage.getItem('ballotToken');
    
    if (!token) {
      toast.error('No ballot token found. Please verify your identity first.');
      navigate('/verify');
      return;
    }

    setBallotToken(token);
    loadBallot(token);
  }, [location, navigate]);

  const loadBallot = async (token: string) => {
    setLoading(true);
    try {
      // Get ballot data (positions and candidates)
      const ballotResponse = await votesAPI.getBallot(token);
      
      console.log('Ballot response:', {
        positionsCount: ballotResponse.positions?.length || 0,
        candidatesCount: ballotResponse.candidates?.length || 0,
        positions: ballotResponse.positions?.map((p: any) => ({
          name: p.name,
          votingOpens: p.votingOpens,
          votingCloses: p.votingCloses,
        })),
      });

      setBallotData({
        positions: ballotResponse.positions || [],
        candidates: ballotResponse.candidates || [],
      });
      
      // Show warning if positions exist but no candidates
      if (ballotResponse.positions?.length > 0 && ballotResponse.candidates?.length === 0) {
        toast.error('No approved candidates available for voting yet.', { duration: 5000 });
      }
    } catch (err: any) {
      console.error('Failed to load ballot:', err);
      if (err.response?.status === 401 || err.response?.status === 400) {
        toast.error('Invalid or expired ballot token. Please verify again.');
        localStorage.removeItem('ballotToken');
        navigate('/verify');
      } else {
        toast.error('Failed to load ballot');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVoteChange = (positionId: string, candidateId: string) => {
    // Toggle: if clicking the same candidate, deselect them
    if (votes[positionId] === candidateId) {
      const newVotes = { ...votes };
      delete newVotes[positionId];
      setVotes(newVotes);
      return;
    }
    
    // Otherwise, select the candidate
    setVotes({
      ...votes,
      [positionId]: candidateId,
    });
    
    // Smooth scroll to next unvoted position
    setTimeout(() => {
      const currentIndex = ballotData?.positions.findIndex(p => p.id === positionId) ?? -1;
      const nextPosition = ballotData?.positions[currentIndex + 1];
      if (nextPosition && !votes[nextPosition.id] && positionRefs.current[nextPosition.id]) {
        positionRefs.current[nextPosition.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const calculateProgress = () => {
    if (!ballotData || ballotData.positions.length === 0) return 0;
    return (Object.keys(votes).length / ballotData.positions.length) * 100;
  };

  const handleSubmit = async () => {
    // Validate all positions have votes
    if (!ballotData) return;

    const missingPositions = ballotData.positions.filter(
      (pos) => !votes[pos.id]
    );

    if (missingPositions.length > 0) {
      toast.error(`Please vote for: ${missingPositions.map((p) => p.name).join(', ')}`);
      return;
    }

    if (!confirm('Are you sure you want to submit your votes? This action cannot be undone.')) {
      return;
    }

    setSubmitting(true);
    try {
      const voteData = Object.entries(votes).map(([positionId, candidateId]) => ({
        positionId,
        candidateId,
      }));

      await votesAPI.castVote(ballotToken, voteData);
      toast.success('Vote cast successfully! Thank you for voting.');
      localStorage.removeItem('ballotToken');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/verify', { state: { message: 'Your vote has been recorded. Thank you!' } });
      }, 2000);
    } catch (err: any) {
      if (err.response?.status === 400) {
        const errorData = err.response?.data;
        if (errorData?.error?.includes('already used')) {
          toast.error('This ballot has already been used. You can only vote once.');
          localStorage.removeItem('ballotToken');
          navigate('/verify');
        } else if (errorData?.error?.includes('not open for voting')) {
          const closedPositions = errorData.closedPositions || [];
          if (closedPositions.length > 0) {
            toast.error(
              `Voting window closed for: ${closedPositions.map((p: any) => p.name).join(', ')}. Contact administrator to extend voting time.`,
              { duration: 8000 }
            );
          } else {
            toast.error(errorData.error + '. ' + (errorData.hint || ''), { duration: 8000 });
          }
        } else {
          toast.error(errorData?.error || 'Failed to cast vote', { duration: 5000 });
        }
      } else {
        toast.error(err.response?.data?.error || 'Failed to cast vote');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Loading your ballot...</p>
              <p className="text-sm text-muted-foreground text-center">Please wait while we prepare your voting interface</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ballotData || ballotData.positions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              No Active Elections
            </CardTitle>
            <CardDescription className="mt-4 text-base">
              There are no positions currently open for voting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Possible reasons:</p>
              <ul className="list-disc list-inside text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>Voting window has not opened yet - check with the administrator</li>
                <li>Voting window has closed - voting period may have ended</li>
                <li>No positions have been created by the administrator</li>
                <li>No approved candidates - candidates may still be pending approval</li>
                <li>Time zone mismatch - contact administrator if voting should be open</li>
              </ul>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-3 italic">
                If you believe voting should be open, please contact the election administrator.
              </p>
            </div>
            <Button 
              onClick={() => navigate('/verify')} 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 text-base"
            >
              Back to Verification
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = calculateProgress();
  const votedCount = Object.keys(votes).length;
  const totalPositions = ballotData.positions.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Section */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Cast Your Vote
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
                Select your preferred candidates for each position
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Progress</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {votedCount}/{totalPositions}
                </p>
              </div>
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 relative">
                <svg className="transform -rotate-90 w-full h-full">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 0.45}`}
                    strokeDashoffset={`${2 * Math.PI * 0.45 * (1 - progress / 100)}`}
                    className="text-blue-600 transition-all duration-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm sm:text-base md:text-lg font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          {ballotData.positions.map((position, index) => {
            const positionCandidates = ballotData.candidates.filter(
              (c) => c.position.id === position.id
            );
            const isVoted = !!votes[position.id];

            return (
              <div
                key={position.id}
                ref={(el) => {
                  positionRefs.current[position.id] = el;
                }}
                className="scroll-mt-24"
              >
                <Card className={`shadow-xl border-2 transition-all duration-300 hover:shadow-2xl ${
                  isVoted 
                    ? 'border-green-500 dark:border-green-600 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}>
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                            {index + 1}
                          </div>
                          <CardTitle className="text-2xl font-bold text-white">
                            {position.name}
                          </CardTitle>
                        </div>
                        <CardDescription className="text-white/90 mt-2">
                          Select {position.seats} candidate{position.seats > 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                      {isVoted && (
                        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="font-semibold text-white">Selected</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {positionCandidates.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                          No approved candidates for this position
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {positionCandidates.map((candidate) => {
                          const isSelected = votes[position.id] === candidate.id;
                          
                          return (
                            <div
                              key={candidate.id}
                              className={`relative group cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                                isSelected
                                  ? 'scale-105'
                                  : ''
                              }`}
                              onClick={() => handleVoteChange(position.id, candidate.id)}
                            >
                              <div className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                                isSelected
                                  ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-lg ring-4 ring-blue-200 dark:ring-blue-800'
                                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                              }`}>
                                {/* Selected Indicator */}
                                {isSelected && (
                                  <div className="absolute top-2 right-2 z-10">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="p-6">
                                  {/* Candidate Photo */}
                                  <div className="flex justify-center mb-4">
                                    <div className={`relative ${
                                      isSelected 
                                        ? 'ring-4 ring-blue-400 dark:ring-blue-500' 
                                        : 'ring-2 ring-gray-200 dark:ring-gray-700'
                                    } rounded-full transition-all duration-300`}>
                                      {candidate.photoUrl ? (
                                        <>
                                          <img
                                            src={getFileUrl(candidate.photoUrl) || ''}
                                            alt={`${candidate.name} photo`}
                                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-full"
                                            onError={(e) => {
                                              console.error('Failed to load candidate photo:', {
                                                photoUrl: candidate.photoUrl,
                                                fullUrl: getFileUrl(candidate.photoUrl),
                                                candidate: candidate.name
                                              });
                                              // Hide image and show placeholder
                                              const target = e.target as HTMLImageElement;
                                              target.style.display = 'none';
                                              const placeholder = target.nextElementSibling as HTMLElement;
                                              if (placeholder) placeholder.style.display = 'flex';
                                            }}
                                            onLoad={(e) => {
                                              // Image loaded successfully - hide placeholder
                                              const target = e.target as HTMLImageElement;
                                              console.log('✅ Voter: Candidate photo loaded:', candidate.name);
                                              const placeholder = target.nextElementSibling as HTMLElement;
                                              if (placeholder) placeholder.style.display = 'none';
                                            }}
                                          />
                                          {/* Placeholder - shown only if image fails to load */}
                                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold hidden">
                                            {candidate.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)}
                                          </div>
                                        </>
                                      ) : (
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                                          {candidate.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Candidate Info */}
                                  <div className="text-center">
                                    <h3 className={`font-bold text-lg mb-1 transition-colors ${
                                      isSelected 
                                        ? 'text-blue-700 dark:text-blue-300' 
                                        : 'text-gray-900 dark:text-gray-100'
                                    }`}>
                                      {candidate.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                      {candidate.program}
                                    </p>
                                  </div>
                                  
                                  {/* Vote Button */}
                                  <div className={`w-full py-2 rounded-lg text-center font-semibold text-sm transition-all ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30'
                                  }`}>
                                    {isSelected ? '✓ Selected (Click to Remove)' : 'Click to Vote'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Sticky Submit Section */}
        <div className="sticky bottom-0 mt-8 sm:mt-12 mb-4 sm:mb-8 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-2 border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {votedCount === totalPositions 
                  ? '✓ All positions completed!' 
                  : `${totalPositions - votedCount} position${totalPositions - votedCount > 1 ? 's' : ''} remaining`
                }
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => navigate('/verify')}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-4 sm:py-6 text-sm sm:text-base font-semibold border-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || votedCount !== totalPositions}
                className={`flex-1 sm:flex-none px-4 sm:px-8 py-4 sm:py-6 text-sm sm:text-base font-bold transition-all duration-300 ${
                  votedCount === totalPositions
                    ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Submit Vote
                  </span>
                )}
              </Button>
            </div>
          </div>
          
          {/* Warning Message */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-400">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="font-medium">
                You can only vote once. Please review your selections carefully before submitting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingPage;

