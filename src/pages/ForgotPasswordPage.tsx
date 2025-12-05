import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'react-hot-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError('');
    setLoading(true);

    try {
      await authAPI.forgotPassword(data.email);
      setOtpSent(true);
      toast.success('Password reset code sent to your email!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to send password reset code. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToOTP = () => {
    const email = getValues('email');
    navigate('/reset-password', { state: { email } });
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md shadow-xl border border-border/50 bg-surface rounded-2xl animate-in fade-in slide-in-from-bottom-4">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold">Forgot Password?</CardTitle>
          <CardDescription className="text-base">
            {otpSent
              ? 'Password reset code has been sent to your email. Enter the code to reset your password.'
              : 'Enter your email address and we\'ll send you a code to reset your password.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {otpSent ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm text-green-800">
                  <strong>✓ Code Sent!</strong>
                  <br />
                  Check your email for a 6-digit password reset code. The code expires in 5 minutes.
                </p>
              </div>
              <Button
                onClick={handleContinueToOTP}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-base shadow-md hover:shadow-lg transition-all duration-200 rounded-xl"
              >
                Continue to Enter Code
              </Button>
              <Button
                variant="outline"
                onClick={() => setOtpSent(false)}
                className="w-full h-12 rounded-xl"
              >
                Resend Code
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
          )}

          <div className="mt-6 text-center space-y-3">
            <Link
              to="/candidate/login"
              className="text-sm text-purple-600 hover:text-purple-700 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;




