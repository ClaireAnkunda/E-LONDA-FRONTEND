import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Hook for programmatic navigation (e.g., after successful login)
import { useForm } from 'react-hook-form'; // Core hook for form management
import { zodResolver } from '@hookform/resolvers/zod'; // Integrates React Hook Form with Zod for schema validation
import * as z from 'zod'; // Zod library for defining schema and validation rules
import { authAPI } from '../../services/api'; // API service containing the 'login' function
// UI Components imported from a hypothetical 'ui' library (likely shadcn/ui)
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '../ui/card';
import Logo from '../ui/Logo';

// ----------------------------------------------------
// 🔐 1. SCHEMA DEFINITION (Zod)
// ----------------------------------------------------

/**
 * Defines the validation rules for the login form fields.
 * Zod ensures that input meets these criteria *before* submission (client-side validation).
 */
const loginSchema = z.object({
  // Email must be a string and conform to a standard email format
  email: z.string().email('Invalid email address'),
  // Password must be a string and have a minimum length of 6 characters
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * Infers the TypeScript type from the Zod schema. 
 * This provides strong typing for the form data object (data).
 */
type LoginFormData = z.infer<typeof loginSchema>;

// ----------------------------------------------------
// 💻 2. LOGIN COMPONENT
// ----------------------------------------------------

const Login: React.FC = () => {
  // Hook to handle routing (redirecting the user after login)
  const navigate = useNavigate();
  // State to store and display any error messages (e.g., "Invalid password")
  const [error, setError] = useState<string>('');
  // State to manage the loading/disabled state of the submit button
  const [loading, setLoading] = useState(false);

  // Initialize React Hook Form with Zod resolver for validation
  const {
    register, // Function to register inputs with the form state
    handleSubmit, // Function that wraps the onSubmit handler for form submission
    formState: { errors }, // Object containing validation errors
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    // Define default values if necessary (not strictly needed for login)
    defaultValues: {
      email: '',
      password: '',
    },
  });

  /**
   * 🚀 3. SUBMISSION HANDLER
   * This function is called only if client-side validation (Zod) passes.
   * @param {LoginFormData} data - The validated form data (email and password).
   */
  const onSubmit = async (data: LoginFormData) => {
    // Clear previous errors and start loading state
    setError('');
    setLoading(true);

    try {
      // Log interaction details (excluding sensitive password)
      console.log('Attempting login to:', 'http://localhost:5000/api/auth/login');
      console.log('Login payload:', { email: data.email, password: '***' });
      
      // CALL API: Execute the actual login request to the backend
      const response = await authAPI.login(data.email, data.password);
      
      console.log('Login successful:', response);
      
      // Store essential data in local storage for session management
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // --- Welcome Message Preparation ---
      const userName = response.user.name || response.user.email.split('@')[0];
      // Determine a role-specific emoji for a personalized welcome
      const welcomeEmoji = response.user.role === 'ADMIN' ? '👑' : response.user.role === 'OFFICER' ? '📋' : '🎯';
      
      // Store a temporary welcome message to be shown on the target dashboard page
      localStorage.setItem('welcomeMessage', JSON.stringify({
        message: `Welcome back, ${userName}! ${welcomeEmoji}`,
        timestamp: Date.now()
      }));

      // --- Role-Based Redirection ---
      // Navigate the user to the correct dashboard based on their role
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
          // Fallback if the role is unrecognized or null
          navigate('/');
      }
    } catch (err: any) {
      // --- Error Handling ---
      // Log detailed error for debugging purposes
      console.error('Login error details:', {
        message: err.message,
        response: err.response?.data, // Server response data (e.g., specific error message)
        status: err.response?.status, // HTTP status code (e.g., 401, 500)
        code: err.code, // Network error code (e.g., ECONNREFUSED)
      });
      
      // Construct a user-friendly error message based on the response
      let errorMessage = 'Login failed. Please try again.';
      
      if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        // Specific message for network/server connection issues
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      } else if (err.response?.status === 401) {
        // Handle unauthorized errors (Invalid credentials)
        errorMessage = err.response?.data?.error || 'Invalid email or password.';
      } else if (err.response?.status === 500) {
        // Handle generic server errors
        errorMessage = 'Server error. Please try again later.';
      } else if (err.response?.data?.error) {
        // Use the specific error message provided by the backend
        errorMessage = err.response.data.error;
      } else if (err.message) {
        // Fallback to the generic error message
        errorMessage = err.message;
      }
      
      // Set the error state to display the message to the user
      setError(errorMessage);
    } finally {
      // 🛑 FINAL STEP: Always stop loading state, regardless of success or failure
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // 🎨 4. COMPONENT RENDER (JSX)
  // ----------------------------------------------------

  return (
    // Centered container for the entire form, using a gradient background
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      {/* The main card container, providing structure and a shadow effect */}
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center px-4 sm:px-6 pt-6 sm:pt-8">
          {/* Component to display the application logo */}
          <div className="flex justify-center">
            <Logo size="md" showText={true} />
          </div>
          {/* Subheading for the login form */}
          <CardDescription className="text-sm sm:text-base">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          {/* The main login form, managed by React Hook Form's handleSubmit */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Conditional display for the global error message (network, server, invalid credentials) */}
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {/* Email Input Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@organization.com"
                // Register the input with the 'email' key
                {...register('email')}
                // Apply a red border style if there is a validation error for email
                className={errors.email ? 'border-red-500' : ''}
              />
              {/* Display the Zod/React Hook Form validation error message for email */}
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Input Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                // Register the input with the 'password' key
                {...register('password')}
                // Apply a red border style if there is a validation error for password
                className={errors.password ? 'border-red-500' : ''}
              />
              {/* Display the Zod/React Hook Form validation error message for password */}
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              // Disable the button while the login request is in progress
              disabled={loading}
            >
              {/* Change button text based on the loading state */}
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Auxiliary Links and Footer */}
          <div className="mt-6 space-y-3">
            {/* Primary call-to-action for the general public (voters) */}
            <Button
              type="button"
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 sm:py-6 text-base sm:text-lg"
              onClick={() => navigate('/verify')} // Navigates voters to the verification/voting path
            >
              Vote Now
            </Button>
            <div className="text-center text-sm">
              <p className="text-muted-foreground">
                Don't have an account?{' '}
                {/* Link for candidates to register */}
                <button
                  onClick={() => navigate('/register')}
                  className="text-primary hover:underline font-medium"
                >
                  Register as Candidate
                </button>
              </p>
              {/* Application branding/footer info */}
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
