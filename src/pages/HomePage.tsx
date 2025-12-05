import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authAPI, verificationAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import Logo from '../components/ui/Logo';

import { useNavigate, link} from rrrrr;eact-router-dom;
 
// Schema that accepts either email or registration number
const unifiedLoginSchema = z.object({
  identifier: z.string().min(1, 'Email or registration number is required'),
  password: z.string().optional(),
});

type UnifiedLoginFormData = z.infer<typeof unifiedLoginSchema>;

// Helper function to detect if input is a registration number or email
const isRegistrationNumber = (input: string): boolean => {
  if (input.includes('@')) {
    return false; // It's an email
  }
  return true; // If it doesn't have @, treat it as registration number
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVoter, setIsVoter] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UnifiedLoginFormData>({
    resolver: zodResolver(unifiedLoginSchema),
  });

  const identifier = watch('identifier');

  // Update isVoter state when identifier changes
  React.useEffect(() => {
    if (identifier && identifier.length > 0) {
      const voter = isRegistrationNumber(identifier);
      setIsVoter(voter);
    } else {
      setIsVoter(null);
    }
  }, [identifier]);

  const onSubmit = async (data: UnifiedLoginFormData) => {
    setError('');
    setLoading(true);

    try {
      const isRegNo = isRegistrationNumber(data.identifier);

      if (isRegNo) {
        // Voter flow: Request OTP
        try {
          await verificationAPI.requestOTP(data.identifier);
          // Store registration number and flag that OTP was sent
          sessionStorage.setItem('pendingRegNo', data.identifier);
          sessionStorage.setItem('otpAlreadySent', 'true');
          // Navigate to OTP verification page
          navigate('/verify', { 
            state: { 
              regNo: data.identifier,
              fromLogin: true,
              otpAlreadySent: true
            } 
          });
        } catch (err: any) {
          const errorMessage = err.response?.data?.error || 'Failed to send OTP. Please try again.';
          setError(errorMessage);
          setLoading(false);
        }
      } else {
        // Email/password login flow for Admin, Officer, Candidate
        if (!data.password) {
          setError('Password is required for email login');
          setLoading(false);
          return;
        }

        const response = await authAPI.login(data.identifier, data.password);

        // Check if account is deactivated (for officers)
        if (response.user.role === 'OFFICER' && response.user.status === 'INACTIVE') {
          setError('Your account has been deactivated. Please contact the administrator for assistance.');
          setLoading(false);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return;
        }

        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        const userName = response.user.name || response.user.email.split('@')[0];
        const welcomeEmoji = 
          response.user.role === 'ADMIN' ? '👑' : 
          response.user.role === 'OFFICER' ? '📋' : 
          '🎯';
        
        localStorage.setItem('welcomeMessage', JSON.stringify({
          message: `Welcome back, ${userName}! ${welcomeEmoji}`,
          timestamp: Date.now()
        }));

        // Navigate to appropriate dashboard based on role
        switch (response.user.role) {
          case 'ADMIN':
            navigate('/admin/dashboard', { replace: true });
            break;
          case 'OFFICER':
            navigate('/officer/dashboard', { replace: true });
            break;
          case 'CANDIDATE':
            navigate('/candidate/dashboard', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Login failed. Please try again.';
      if (errorMessage.includes('inactive') || errorMessage.includes('deactivated')) {
        setError('Your account has been deactivated. Please contact the administrator for assistance.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Professional Background Image with Parallax Effect */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1920&q=80')`,
            backgroundAttachment: 'fixed',
            backgroundPosition: 'center center',
          }}
        />
        {/* Professional Overlay - Subtle gradient for readability */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            background: 'linear-gradient(135deg, rgba(246, 248, 251, 0.82) 0%, rgba(246, 248, 251, 0.78) 50%, rgba(246, 248, 251, 0.82) 100%)',
          }}
        />
        {/* Additional subtle overlay for depth */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-transparent via-transparent to-[#F6F8FB]/15" />
      </div>
      
      {/* Content Layer */}
      <div className="relative z-10">
          {/* Hero Section with Professional Spacing */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24">
            <div className="text-center mb-12 sm:mb-16 md:mb-20 max-w-4xl mx-auto">
              {/* Professional Logo */}
              <div className="mb-6 sm:mb-8 animate-fade-in-up flex justify-center" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                <Logo size="lg" showText={false} className="animate-bounce-slow" />
              </div>
              
              {/* Animated Accent Line */}
              <div className="inline-block mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                <div className="h-1 sm:h-2 w-16 sm:w-24 bg-gradient-to-r from-purple-600 to-indigo-600 mx-auto rounded-full animate-scale-in" style={{ animationDelay: '0.3s', animationFillMode: 'both' }} />
              </div>
              
              {/* Animated Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-4 sm:mb-6 tracking-tight leading-tight animate-fade-in-up px-2" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
                Welcome to{' '}
                <span 
                  className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent inline-block"
                  style={{
                    backgroundSize: '200% 100%',
                    animation: 'gradient-shift 3s ease-in-out infinite',
                  }}
                >
                  E-LONDA
                </span>
                <span className="inline-block ml-2 sm:ml-3 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl animate-bounce-slow" style={{ animationDelay: '0.8s' }}>
                  🗳️
                </span>
              </h1>
              
              {/* Animated Subtitle */}
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed font-light max-w-2xl mx-auto animate-fade-in-up px-4" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
                Sign in below to access your account. Secure, transparent, and democratic voting system.
              </p>
            </div>

          {/* Unified Login Form */}
          <div className="flex justify-center mb-12 sm:mb-16 md:mb-20 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
            <Card className="w-full shadow-2xl border-2 border-indigo-200/50 bg-white/95 backdrop-blur-sm rounded-3xl transform transition-all duration-300 hover:shadow-indigo-500/20 hover:scale-[1.01]">
              <CardHeader className="space-y-3 text-center pb-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl animate-float hover:scale-110 transition-transform duration-300">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Sign In
                </CardTitle>
                <CardDescription className="text-base">
                  {isVoter === null 
                    ? 'Enter your registration number or email to continue'
                    : isVoter 
                    ? 'Enter your registration number to receive an OTP'
                    : 'Enter your email and password to sign in'}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {error && (
                    <div className="p-4 text-sm text-red-700 bg-red-50 border-2 border-red-200 rounded-xl">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="identifier" className="text-sm font-semibold text-gray-700">
                      {isVoter ? 'Registration Number' : isVoter === false ? 'Email' : 'Email or Registration Number'}
                    </Label>
                    <Input
                      id="identifier"
                      type="text"
                      placeholder={isVoter ? "M24B13/054" : isVoter === false ? "admin@organization.com" : "Enter email or registration number"}
                      {...register('identifier')}
                      className={`h-14 rounded-xl border-2 transition-all duration-300 focus:scale-[1.02] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 ${
                        errors.identifier ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    />
                    {errors.identifier && (
                      <p className="text-sm text-red-600">{errors.identifier.message}</p>
                    )}
                  </div>

                  {/* Show password field only for email login */}
                  {isVoter === false && (
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          {...register('password', { required: 'Password is required' })}
                          className={`h-14 rounded-xl pr-12 border-2 transition-all duration-300 focus:scale-[1.02] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 ${
                            errors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 hover:border-indigo-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md p-2"
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
                        <p className="text-sm text-red-600">{errors.password.message}</p>
                      )}
                    </div>
                  )}

                  {/* Info message for voters */}
                  {isVoter === true && (
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                      <p className="text-xs text-blue-800 leading-relaxed">
                        <strong>Note:</strong> After entering your registration number, you'll receive an OTP via SMS to verify your identity.
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-14 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold text-base shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl transform hover:scale-[1.02] active:scale-[0.98]"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isVoter ? 'Sending OTP...' : 'Signing in...'}
                      </span>
                    ) : (
                      isVoter ? 'Request OTP 🚀' : 'Sign In 🚀'
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center space-y-3">
                  {isVoter === false && (
                    <>
                      <Link
                        to="/forgot-password"
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold hover:underline transition-all duration-200 inline-block"
                      >
                        Forgot Password?
                      </Link>
                      <p className="text-sm text-gray-600">
                        New candidate?{' '}
                        <Link
                          to="/candidate/register"
                          className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline transition-all duration-200"
                        >
                          Register as Candidate
                        </Link>
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Professional "How It Works" Section */}
          <div className="mt-24 md:mt-32 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 p-10 md:p-16 max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How It Works
              </h2>
              <div className="h-1 w-20 bg-gradient-to-r from-purple-600 to-indigo-600 mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
              <div className="text-center group">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl font-bold">1</span>
                </div>
                <h3 className="font-bold text-xl mb-3">Voters</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enter your registration number, verify with OTP sent to your email, then cast your vote securely
                </p>
              </div>
              <div className="text-center group">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl font-bold">2</span>
                </div>
                <h3 className="font-bold text-xl mb-3">Candidates</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sign in with your email and password, submit nominations during the nomination period, and track approval status
                </p>
              </div>
              <div className="text-center group">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl font-bold">3</span>
                </div>
                <h3 className="font-bold text-xl mb-3">Officials</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sign in with your email and password. Administrators manage positions and voters. Officers review and approve candidate nominations
                </p>
              </div>
            </div>
          </div>

          {/* Professional Footer */}
          <div className="mt-20 text-center">
            <div className="inline-block mb-4">
              <div className="h-px w-32 bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-2">
              E-LONDA | Secure Digital Voting Platform
            </p>
            <p className="text-xs text-muted-foreground">
              Secure • Transparent • Democratic
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
