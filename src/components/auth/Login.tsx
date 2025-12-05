import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authAPI } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '../ui/card';
import Logo from '../ui/Logo';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

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
      console.log('Attempting login to:', 'http://localhost:5000/api/auth/login');
      console.log('Login payload:', { email: data.email, password: '***' });
      
      const response = await authAPI.login(data.email, data.password);
      
      console.log('Login successful:', response);
      
      // Store token and user info
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Show welcome message
      const userName = response.user.name || response.user.email.split('@')[0];
      const welcomeEmoji = response.user.role === 'ADMIN' ? '👑' : response.user.role === 'OFFICER' ? '📋' : '🎯';
      
      // Store welcome message to show on dashboard
      localStorage.setItem('welcomeMessage', JSON.stringify({
        message: `Welcome back, ${userName}! ${welcomeEmoji}`,
        timestamp: Date.now()
      }));

      // Route based on role
      const role = response.user.role;
      switch (role) {
        case 'ADMIN':
          navigate('/admin/dashboard');
          break;
        case 'OFFICER':
          navigate('/officer/dashboard');
          break;
        case 'CANDIDATE':
          navigate('/candidate/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err: any) {
      console.error('Login error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        code: err.code,
        config: err.config
      });
      
      // Provide more detailed error messages
      let errorMessage = 'Login failed. Please try again.';
      
      if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      } else if (err.response?.status === 401) {
        errorMessage = err.response?.data?.error || 'Invalid email or password.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center px-4 sm:px-6 pt-6 sm:pt-8">
          <div className="flex justify-center">
            <Logo size="md" showText={true} />
          </div>
          <CardDescription className="text-sm sm:text-base">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@organization.com"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register('password')}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            <Button
              type="button"
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 sm:py-6 text-base sm:text-lg"
              onClick={() => navigate('/verify')}
            >
              Vote Now
            </Button>
            <div className="text-center text-sm">
              <p className="text-muted-foreground">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-primary hover:underline font-medium"
                >
                  Register as Candidate
                </button>
              </p>
              <p className="mt-2 text-muted-foreground">Secure Digital Voting Platform</p>
              <p className="mt-1 text-muted-foreground">VoteSphere © 2025</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
