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

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const CandidateLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(data.email, data.password);
      
      if (response.user.role !== 'CANDIDATE') {
        setError('This login is for candidates only. Please use the appropriate login page.');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      const userName = response.user.name || response.user.email.split('@')[0];
      
      localStorage.setItem('welcomeMessage', JSON.stringify({
        message: `Welcome back, ${userName}! 🎯`,
        timestamp: Date.now()
      }));

      navigate('/candidate/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="flex items-center justify-center min-h-screen py-12 px-4 relative z-10">
        <Card className="w-full max-w-md shadow-2xl border-2 border-purple-200/50 bg-white/95 backdrop-blur-sm rounded-3xl animate-bounce-in transform transition-all duration-300 hover:shadow-purple-500/20 hover:scale-[1.02]">
          <CardHeader className="space-y-3 text-center pb-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 text-white shadow-xl animate-float hover:scale-110 transition-transform duration-300 cursor-pointer">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              Candidate Login
            </CardTitle>
            <CardDescription className="text-base animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
              Sign in to your candidate account to manage nominations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="p-4 text-sm text-red-700 bg-red-50 border-2 border-red-200 rounded-xl animate-slide-in-right animate-wiggle">
                  {error}
                </div>
              )}

              <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="candidate@organization.com"
                  {...register('email')}
                  className={`h-14 rounded-xl border-2 transition-all duration-300 focus:scale-[1.02] focus:border-purple-500 focus:ring-4 focus:ring-purple-200 ${
                    errors.email ? 'border-red-500 focus:ring-red-200 animate-wiggle' : 'border-gray-200 hover:border-purple-300'
                  }`}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-red-600 animate-slide-in-right">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...register('password')}
                    className={`h-14 rounded-xl pr-12 border-2 transition-all duration-300 focus:scale-[1.02] focus:border-purple-500 focus:ring-4 focus:ring-purple-200 ${
                      errors.password ? 'border-red-500 focus:ring-red-200 animate-wiggle' : 'border-gray-200 hover:border-purple-300'
                    }`}
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-md p-2 hover:scale-110 active:scale-95"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-red-600 animate-slide-in-right">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-800 text-white font-bold text-base shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl transform hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: '0.6s', animationFillMode: 'both' }}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In 🚀'
                )}
              </Button>
            </form>

            <div className="mt-8 text-center space-y-4 animate-fade-in-up" style={{ animationDelay: '0.7s', animationFillMode: 'both' }}>
              <Link
                to="/forgot-password"
                className="text-sm text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-all duration-200 inline-block hover:scale-105"
              >
                Forgot Password?
              </Link>
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/candidate/register"
                  className="text-purple-600 hover:text-purple-700 font-bold hover:underline transition-all duration-200 inline-block hover:scale-105"
                >
                  Register as Candidate
                </Link>
              </p>
              <Link
                to="/"
                className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-2 hover:underline transition-all duration-200 hover:scale-105 group"
              >
                <svg className="h-4 w-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CandidateLoginPage;
