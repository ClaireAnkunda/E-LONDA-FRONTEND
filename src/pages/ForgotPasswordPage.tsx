import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
// Assuming the path to your API service is correct
import { authAPI } from '../services/api';
// Assuming these UI components are from a standard library like Shadcn UI
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'react-hot-toast';

// --- Schema and Types ---
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// --- Constants ---
const BACK_TO_LOGIN_PATH = '/candidate/login';
const RESET_PASSWORD_PATH = '/reset-password';

// --- Components ---

/**
 * Renders the form for submitting the email address.
 */
const EmailForm: React.FC<{
  onSubmit: (data: ForgotPasswordFormData) => void;
  loading: boolean;
  error: string;
  register: any;
  errors: any;
}> = ({ onSubmit, loading, error, register, errors }) => (
  <form onSubmit={onSubmit} className="space-y-5">
    {error && (
      <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
        {error}
      </div>
    )}

    <div className="space-y-2">
      <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
      <Input
        id="email"
        type="email"
        placeholder="candidate@organization.com"
        {...register('email')}
        className={`h-12 rounded-xl ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
        aria-invalid={errors.email ? 'true' : 'false'}
        aria-describedby={errors.email ? 'email-error' : undefined}
      />
      {errors.email && (
        <p id="email-error" className="text-sm text-red-600">{errors.email.message}</p>
      )}
    </div>

    <Button
      type="submit"
      className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-base shadow-md hover:shadow-lg transition-all duration-200 rounded-xl"
      disabled={loading}
    >
      {loading ? 'Sending Code...' : 'Send Reset Code'}
    </Button>
  </form>
);

/**
 * Renders the confirmation and navigation steps after OTP is sent.
 */
const OtpConfirmation: React.FC<{
  onContinue: () => void;
  onResend: () => void;
}> = ({ onContinue, onResend }) => (
  <div className="space-y-4">
    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
      <p className="text-sm text-green-800">
        <strong>✓ Code Sent!</strong>
        <br />
        Check your email for a 6-digit password reset code. The code expires in 5 minutes.
      </p>
    </div>
    <Button
      onClick={onContinue}
      className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-base shadow-md hover:shadow-lg transition-all duration-200 rounded-xl"
    >
      Continue to Enter Code
    </Button>
    <Button
      variant="outline"
      onClick={onResend}
      className="w-full h-12 rounded-xl"
    >
      Resend Code (New Attempt)
    </Button>
  </div>
);


// --- Main Component ---
const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  // Use a state to control the view: 'form' or 'confirmation'
  const [viewState, setViewState] = useState<'form' | 'confirmation'>('form');

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  // Handler for submitting the email to get the reset code
  const handleSendResetCode = async (data: ForgotPasswordFormData) => {
    setError('');
    setLoading(true);

    try {
      // 1. Call the API to send the OTP
      await authAPI.forgotPassword(data.email);

      // 2. On success, switch the view
      setViewState('confirmation');
      toast.success('Password reset code sent to your email!');
    } catch (err: any) {
      // 3. On error, display the message and keep the view on the form
      const errorMessage = err.response?.data?.error || 'Failed to send password reset code. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      setViewState('form'); // Ensure we stay on the form if API fails
    } finally {
      setLoading(false);
    }
  };

  // Handler for continuing to the Reset Password page
  const handleContinueToOTP = () => {
    const email = getValues('email');
    // Navigate and pass the submitted email address as state
    navigate(RESET_PASSWORD_PATH, { state: { email } });
  };

  // Handler for resending the code/restarting the flow
  const handleResendCode = () => {
    setViewState('form');
    setError('');
  };
  
  // Dynamic content based on the current viewState
  const cardTitle = 'Forgot Password?';
  const cardDescription = viewState === 'confirmation'
    ? 'Password reset code has been sent to your email. Enter the code to reset your password.'
    : "Enter your email address and we'll send you a code to reset your password.";


  return (
    <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md shadow-xl border border-border/50 bg-surface rounded-2xl animate-in fade-in slide-in-from-bottom-4">
        <CardHeader className="space-y-3 text-center pb-6">
          {/* Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="
