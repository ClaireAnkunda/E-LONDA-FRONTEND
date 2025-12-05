import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import UnifiedLoginPage from './pages/UnifiedLoginPage';
import CandidateLoginPage from './pages/CandidateLoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import CandidateDashboard from './pages/CandidateDashboard';
import RegisterCandidate from './components/candidates/RegisterCandidate';
import VerificationPage from './pages/VerificationPage';
import VotingPage from './pages/VotingPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ReportsPage from './pages/ReportsPage';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Home/Splash Page */}
        <Route path="/" element={<HomePage />} />
        
        {/* Unified Login Page - All users use this */}
        <Route path="/login" element={<UnifiedLoginPage />} />
        
        {/* Legacy Login Pages - Redirect to unified login for backward compatibility */}
        <Route path="/candidate/login" element={<Navigate to="/login" replace />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        
        {/* Registration */}
        <Route path="/candidate/register" element={<RegisterCandidate />} />
        
        {/* Password Reset */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Public voter routes */}
        <Route path="/verify" element={<VerificationPage />} />
        <Route path="/vote" element={<VotingPage />} />
        
        {/* Protected Dashboard Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/officer/dashboard"
          element={
            <ProtectedRoute requiredRole="OFFICER">
              <OfficerDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/candidate/dashboard"
          element={
            <ProtectedRoute requiredRole="CANDIDATE">
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Fallback to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
