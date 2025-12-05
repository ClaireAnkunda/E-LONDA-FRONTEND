import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { reportsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TurnoutData {
  totalVoters: number;
  verifiedVoters: number;
  votesCast: number;
  ballotsIssued: number;
  nonVoters: number;
  turnout: number;
  verificationRate: number;
  ballotUsageRate: number;
  nonVoterPercentage: number;
  breakdown: {
    voted: number;
    notVoted: number;
    verified: number;
    notVerified: number;
  };
}

interface CandidateResult {
  candidateId: string;
  name: string;
  program: string;
  votes: number;
  rank: number;
  votePercentage: number;
  overallPercentage: number;
  isWinner: boolean;
}

interface PositionResult {
  positionId: string;
  positionName: string;
  seats: number;
  totalVotes: number;
  candidates: CandidateResult[];
  winner: CandidateResult | null;
}

interface ResultsData {
  positions: PositionResult[];
  summary: {
    totalPositions: number;
    totalCandidates: number;
    totalVotesCast: number;
  };
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  teal: '#14b8a6',
  orange: '#f97316',
  pink: '#ec4899',
  amber: '#f59e0b',
};

const ReportsDashboard: React.FC = () => {
  const [turnoutData, setTurnoutData] = useState<TurnoutData | null>(null);
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [turnout, results] = await Promise.all([
        reportsAPI.getTurnout(),
        reportsAPI.getResults(),
      ]);
      setTurnoutData(turnout);
      setResultsData(results);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
      toast.error(err.response?.data?.error || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for charts
  const turnoutPieData = turnoutData
    ? [
        {
          name: 'Voted',
          value: turnoutData.votesCast,
          percentage: turnoutData.turnout,
          color: COLORS.success,
        },
        {
          name: 'Did Not Vote',
          value: turnoutData.nonVoters,
          percentage: turnoutData.nonVoterPercentage,
          color: COLORS.danger,
        },
      ]
    : [];

  const verificationPieData = turnoutData
    ? [
        {
          name: 'Verified',
          value: turnoutData.verifiedVoters,
          percentage: turnoutData.verificationRate,
          color: COLORS.success,
        },
        {
          name: 'Not Verified',
          value: turnoutData.breakdown.notVerified,
          percentage: 100 - turnoutData.verificationRate,
          color: COLORS.warning,
        },
      ]
    : [];

  const selectedPositionData = resultsData?.positions.find(
    (p) => p.positionId === selectedPosition || (!selectedPosition && p.positionId)
  );

  const candidateBarData = selectedPositionData
    ? selectedPositionData.candidates.map((candidate) => ({
        name: candidate.name.length > 15 
          ? candidate.name.substring(0, 15) + '...' 
          : candidate.name,
        fullName: candidate.name,
        votes: candidate.votes,
        percentage: candidate.votePercentage,
        rank: candidate.rank,
        isWinner: candidate.isWinner,
      }))
    : [];

  // Comparison chart - Top candidates across all positions
  const topCandidatesData = resultsData
    ? resultsData.positions
        .flatMap((position) =>
          position.candidates
            .filter((c) => c.rank === 1)
            .map((c) => ({
              position: position.positionName,
              candidate: c.name,
              votes: c.votes,
              percentage: c.votePercentage,
            }))
        )
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 10)
    : [];

  // Position comparison chart
  const positionComparisonData = resultsData
    ? resultsData.positions.map((position) => ({
        name: position.positionName.length > 12
          ? position.positionName.substring(0, 12) + '...'
          : position.positionName,
        fullName: position.positionName,
        totalVotes: position.totalVotes,
        candidates: position.candidates.length,
        winnerVotes: position.winner?.votes || 0,
        winnerPercentage: position.winner?.votePercentage || 0,
      }))
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-blue-200/50">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Election Reports Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive analytics and visualizations for decision-making
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={loadReports} variant="outline">
              Refresh Data
            </Button>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="hidden print:block"
            >
              Print Report
            </Button>
          </div>
        </div>

        {/* Turnout Section */}
        {turnoutData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Turnout Overview Cards */}
            <Card className="border-2 border-blue-200/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-blue-600">Voter Turnout</CardTitle>
                <CardDescription>Overall participation statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                    <span className="text-lg font-semibold text-gray-700">Turnout Rate</span>
                    <span className="text-3xl font-bold text-blue-600">
                      {turnoutData.turnout}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-xl">
                      <p className="text-sm text-gray-600">Votes Cast</p>
                      <p className="text-2xl font-bold text-green-600">
                        {turnoutData.votesCast.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-xl">
                      <p className="text-sm text-gray-600">Did Not Vote</p>
                      <p className="text-2xl font-bold text-red-600">
                        {turnoutData.nonVoters.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600">Total Eligible Voters</p>
                    <p className="text-2xl font-bold text-gray-700">
                      {turnoutData.totalVoters.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Turnout Pie Chart */}
            <Card className="border-2 border-green-200/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-green-600">Voting Participation</CardTitle>
                <CardDescription>Visual breakdown of voter participation</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={turnoutPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props) => {
                        const name = props.name ?? '';
                        const percent = props.percent ?? 0;
                        return `${name}: ${(percent * 100).toFixed(1)}%`;
                      }}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {turnoutPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Verification Status */}
            <Card className="border-2 border-purple-200/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-purple-600">Verification Status</CardTitle>
                <CardDescription>OTP verification statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={verificationPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props) => {
                        const name = props.name ?? '';
                        const percent = props.percent ?? 0;
                        return `${name}: ${(percent * 100).toFixed(1)}%`;
                      }}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {verificationPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">Verification Rate</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {turnoutData.verificationRate.toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Turnout Metrics */}
            <Card className="border-2 border-orange-200/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-orange-600">Additional Metrics</CardTitle>
                <CardDescription>Detailed performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Ballot Usage Rate</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {turnoutData.ballotUsageRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {turnoutData.votesCast} of {turnoutData.ballotsIssued} ballots used
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <p className="text-sm text-gray-600">Verified Voters</p>
                      <p className="text-xl font-bold text-blue-600">
                        {turnoutData.verifiedVoters.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-xl">
                      <p className="text-sm text-gray-600">Not Verified</p>
                      <p className="text-xl font-bold text-yellow-600">
                        {turnoutData.breakdown.notVerified.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Section */}
        {resultsData && (
          <div className="space-y-6">
            {/* Position Selection */}
            <Card className="border-2 border-indigo-200/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-indigo-600">Election Results</CardTitle>
                <CardDescription>
                  Select a position to view detailed candidate performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-6">
                  {resultsData.positions.map((position) => (
                    <Button
                      key={position.positionId}
                      variant={
                        selectedPosition === position.positionId ||
                        (!selectedPosition && position === resultsData.positions[0])
                          ? 'default'
                          : 'outline'
                      }
                      onClick={() => setSelectedPosition(position.positionId)}
                      className="transition-all duration-200"
                    >
                      {position.positionName}
                    </Button>
                  ))}
                </div>

                {selectedPositionData && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {selectedPositionData.positionName}
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Votes</p>
                          <p className="text-2xl font-bold text-indigo-600">
                            {selectedPositionData.totalVotes.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Candidates</p>
                          <p className="text-2xl font-bold text-indigo-600">
                            {selectedPositionData.candidates.length}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Seats Available</p>
                          <p className="text-2xl font-bold text-indigo-600">
                            {selectedPositionData.seats}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Candidate Performance Bar Chart */}
            {selectedPositionData && candidateBarData.length > 0 && (
              <Card className="border-2 border-teal-200/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-teal-600">
                    Candidate Performance - {selectedPositionData.positionName}
                  </CardTitle>
                  <CardDescription>
                    Vote distribution and percentages for each candidate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={candidateBarData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number, name: string, props: any) => {
                          if (name === 'votes') {
                            return [
                              `${value} votes (${props.payload.percentage.toFixed(1)}%)`,
                              'Votes',
                            ];
                          }
                          return value;
                        }}
                        labelFormatter={(label) => `Candidate: ${label}`}
                      />
                      <Legend />
                      <Bar
                        dataKey="votes"
                        fill={COLORS.primary}
                        name="Votes"
                        radius={[8, 8, 0, 0]}
                      >
                        {candidateBarData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.isWinner ? COLORS.success : COLORS.primary}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Candidate Rankings Table */}
                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-3 text-left">Rank</th>
                          <th className="border p-3 text-left">Candidate</th>
                          <th className="border p-3 text-left">Program</th>
                          <th className="border p-3 text-right">Votes</th>
                          <th className="border p-3 text-right">Percentage</th>
                          <th className="border p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPositionData.candidates.map((candidate) => (
                          <tr
                            key={candidate.candidateId}
                            className={
                              candidate.isWinner
                                ? 'bg-green-50 font-semibold'
                                : 'hover:bg-gray-50'
                            }
                          >
                            <td className="border p-3">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                                {candidate.rank}
                              </span>
                            </td>
                            <td className="border p-3">{candidate.name}</td>
                            <td className="border p-3 text-sm text-gray-600">
                              {candidate.program}
                            </td>
                            <td className="border p-3 text-right font-semibold">
                              {candidate.votes.toLocaleString()}
                            </td>
                            <td className="border p-3 text-right">
                              <span className="font-semibold text-indigo-600">
                                {candidate.votePercentage.toFixed(2)}%
                              </span>
                            </td>
                            <td className="border p-3 text-center">
                              {candidate.isWinner ? (
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                  Winner
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                                  Runner-up
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Position Comparison Chart */}
            {positionComparisonData.length > 0 && (
              <Card className="border-2 border-pink-200/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-pink-600">
                    Position Comparison
                  </CardTitle>
                  <CardDescription>
                    Compare total votes and engagement across all positions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={positionComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number, name: string, props: any) => {
                          if (name === 'totalVotes') {
                            return [
                              `${value.toLocaleString()} votes`,
                              'Total Votes',
                            ];
                          }
                          if (name === 'winnerVotes') {
                            return [
                              `${value.toLocaleString()} votes (${props.payload.winnerPercentage.toFixed(1)}%)`,
                              'Winner Votes',
                            ];
                          }
                          return value;
                        }}
                        labelFormatter={(label) => `Position: ${label}`}
                      />
                      <Legend />
                      <Bar
                        dataKey="totalVotes"
                        fill={COLORS.primary}
                        name="Total Votes"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="winnerVotes"
                        fill={COLORS.success}
                        name="Winner Votes"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Top Winners Chart */}
            {topCandidatesData.length > 0 && (
              <Card className="border-2 border-amber-200/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-amber-600">
                    Top Winners Across All Positions
                  </CardTitle>
                  <CardDescription>
                    Leading candidates from each position ranked by vote count
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={topCandidatesData}
                      layout="vertical"
                      margin={{ left: 100 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis
                        dataKey="candidate"
                        type="category"
                        width={100}
                      />
                      <Tooltip
                        formatter={(value: number, name: string, props: any) => {
                          if (name === 'votes') {
                            return [
                              `${value.toLocaleString()} votes (${props.payload.percentage.toFixed(1)}%)`,
                              'Votes',
                            ];
                          }
                          return value;
                        }}
                        labelFormatter={(label) => `Position: ${label}`}
                      />
                      <Legend />
                      <Bar
                        dataKey="votes"
                        fill={COLORS.warning}
                        name="Votes"
                        radius={[0, 8, 8, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-2 border-blue-200/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-600">Total Positions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-blue-600">
                    {resultsData.summary.totalPositions}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-200/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-green-600">Total Candidates</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-green-600">
                    {resultsData.summary.totalCandidates}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2 border-purple-200/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-purple-600">Total Votes Cast</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-purple-600">
                    {resultsData.summary.totalVotesCast.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsDashboard;

