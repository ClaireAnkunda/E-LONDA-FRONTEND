import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { votesAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { getFileUrl } from '../lib/imageUtils';

// --- Interface Definitions for Data Structure ---

/**
 * Defines the structure for a political position/role being voted on.
 */
interface Position {
  id: string;
  name: string;
  seats: number; // Number of candidates a voter can select for this position (currently only supports 1)
  votingOpens: string;
  votingCloses: string;
}

/**
 * Defines the structure for a candidate running for a position.
 */
interface Candidate {
  id: string;
  name: string;
  program: string; // Candidate's campaign program/slogan
  photoUrl: string | null;
  status: string; // e.g., 'APPROVED', 'PENDING'
  position: {
    id: string;
    name: string;
  };
}

/**
 * Defines the structure for the entire ballot data fetched from the API.
 */
interface BallotData {
  positions: Position[];
  candidates: Candidate[];
}

// --- React Component: VotingPage ---

const VotingPage: React.FC = () => {
  // --- Hooks and State Initialization ---

  // Navigation and location hooks
  const navigate = useNavigate();
  const location = useLocation();

  // State for the secure ballot token (required for fetching data and submitting votes)
  const [ballotToken, setBallotToken] = useState<string>('');
  // State to manage the loading status of the initial ballot data
  const [loading, setLoading] = useState(true);
  // State to prevent multiple submissions while casting a vote
  const [submitting, setSubmitting] = useState(false);
  // State to hold the fetched election data
  const [ballotData, setBallotData] = useState<BallotData | null>(null);
  // State to store the user's selected votes: { [positionId]: candidateId }
  const [votes, setVotes] = useState<{ [positionId: string]: string }>({});
  // Ref to store references to each position's container for smooth scrolling
  const positionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // --- useEffect for Initial Load and Token Verification ---
  useEffect(() => {
    // Attempt to retrieve the ballot token from the router state or localStorage
    const token = location.state?.ballotToken || localStorage.getItem('ballotToken');

    if (!token) {
      // If no token is found, redirect the user to the verification page
      toast.error('No ballot token found. Please verify your identity first.');
      navigate('/verify');
      return;
    }

    // Set the token and initiate the ballot data load
    setBallotToken(token);
    loadBallot(token);
  }, [location, navigate]); // Dependencies ensure this runs on mount or if location/navigate change

  // --- API Call: Load Ballot Data ---
  const loadBallot = async (token: string) => {
    setLoading(true);
    try {
      // Fetch ballot data (positions and approved candidates) using the token
      const ballotResponse = await votesAPI.getBallot(token);

      // Log the response data for debugging purposes (includes position/candidate counts)
      console.log('Ballot response:', {
        positionsCount: ballotResponse.positions?.length || 0,
        candidatesCount: ballotResponse.candidates?.length || 0,
        positions: ballotResponse.positions?.map((p: any) => ({
          name: p.name,
          votingOpens: p.votingOpens,
          votingCloses: p.votingCloses,
        })),
      });

      // Update state with the fetched data
      setBallotData({
        positions: ballotResponse.positions || [],
        candidates: ballotResponse.candidates || [],
      });

      // Show a warning if positions exist but there are no candidates to vote for
      if (ballotResponse.positions?.length > 0 && ballotResponse.candidates?.length === 0) {
        toast.error('No approved candidates available for voting yet.', { duration: 5000 });
      }
    } catch (err: any) {
      console.error('Failed to load ballot:', err);
      // Handle token expiration or invalidity (401/400 status)
      if (err.response?.status === 401 || err.response?.status === 400) {
        toast.error('Invalid or expired ballot token. Please verify again.');
        localStorage.removeItem('ballotToken');
        navigate('/verify
