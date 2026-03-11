import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authAPI } from '../services/api';
import { Mail, Lock, KeyRound, CheckCircle, UserPlus, LogIn, FileText, Award, Users } from 'lucide-react';

const LoginPage = () => {
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [userName, setUserName] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [passwordSetupData, setPasswordSetupData] = useState({ 
    email: '', 
    newPassword: '', 
    confirmPassword: '' 
  });

  const handleMicrosoftLogin = async () => {
    try {
      const response = await authAPI.getMicrosoftAuthUrl();
      window.location.href = response.data.auth_url;
    } catch (err) {
      setError('Failed to initiate Microsoft login');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(loginData);
      login(response.data.access_token, response.data.user);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.detail === 'Password setup required') {
        setError('This account requires first-time setup. Please select "First Time User" option.');
      } else {
        setError(err.response?.data?.detail || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.checkPasswordSetup(passwordSetupData.email);
      if (!response.data.exists) {
        setError('Email not found. Please contact your administrator.');
      } else if (!response.data.requires_setup) {
        setError('This account already has a password. Please use "Returning User" login.');
      } else {
        setUserName(response.data.full_name || '');
        setEmailVerified(true);
      }
    } catch (err) {
      setError('Failed to verify email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSetup = async (e) => {
    e.preventDefault();
    setError('');

    if (passwordSetupData.newPassword !== passwordSetupData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordSetupData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.setupPassword(
        passwordSetupData.email, 
        passwordSetupData.newPassword
      );
      setSetupSuccess(true);
      setTimeout(() => {
        login(response.data.access_token, response.data.user);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Password setup failed');
    } finally {
      setLoading(false);
    }
  };

  const resetToLogin = () => {
    setIsFirstTime(false);
    setEmailVerified(false);
    setPasswordSetupData({ email: '', newPassword: '', confirmPassword: '' });
    setUserName('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:flex flex-col justify-center space-y-6">
          <div className="flex items-center">
            <img 
              src="/sentech-logo.png" 
              alt="Sentech Logo" 
              className="w-64 h-20 object-contain"
            />
          </div>
          <p className="text-lg text-slate-600">Bursary Management System</p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-slate-900">Track Applications</h3>
                <p className="text-sm text-slate-600">Monitor your bursary applications step-by-step</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-slate-900">BBBEE Compliance</h3>
                <p className="text-sm text-slate-600">Manage compliance and verification records</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-slate-900">Sponsor Management</h3>
                <p className="text-sm text-slate-600">Connect with sponsors and track contributions</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="w-full shadow-lg border-slate-200" data-testid="login-card">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-heading font-bold text-center">
              {isFirstTime 
                ? (emailVerified ? 'Set Up Your Password' : 'First Time Login')
                : 'Welcome Back'
              }
            </CardTitle>
            <CardDescription className="text-center">
              {isFirstTime 
                ? (emailVerified 
                    ? `Welcome ${userName}! Please create a password to continue.`
                    : 'Enter your email to set up your password'
                  )
                : 'Sign in to access your account'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4" data-testid="error-alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {setupSuccess && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Password set successfully! Logging you in...
                </AlertDescription>
              </Alert>
            )}

            {/* User Type Selection */}
            {!isFirstTime && !emailVerified && (
              <div className="space-y-4">
                {/* Two option buttons */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => setIsFirstTime(false)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      !isFirstTime 
                        ? 'border-primary bg-primary/5' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    data-testid="returning-user-btn"
                  >
                    <LogIn className={`w-6 h-6 mx-auto mb-2 ${!isFirstTime ? 'text-primary' : 'text-slate-400'}`} />
                    <p className={`text-sm font-medium ${!isFirstTime ? 'text-primary' : 'text-slate-600'}`}>
                      Returning User
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsFirstTime(true); setError(''); }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isFirstTime 
                        ? 'border-primary bg-primary/5' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    data-testid="first-time-user-btn"
                  >
                    <UserPlus className={`w-6 h-6 mx-auto mb-2 ${isFirstTime ? 'text-primary' : 'text-slate-400'}`} />
                    <p className={`text-sm font-medium ${isFirstTime ? 'text-primary' : 'text-slate-600'}`}>
                      First Time User
                    </p>
                  </button>
                </div>

                {/* Returning User Login Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your.email@sentech.co.za"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="pl-10"
                        required
                        data-testid="login-email-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="pl-10"
                        required
                        data-testid="login-password-input"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit-btn">
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">Or continue with</span>
                  </div>
                </div>

                <Button 
                  onClick={handleMicrosoftLogin}
                  variant="outline"
                  className="w-full gap-2" 
                  disabled={loading}
                  data-testid="microsoft-login-btn"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                    <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
                    <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
                    <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
                  </svg>
                  Sign in with Microsoft
                </Button>
              </div>
            )}

            {/* First Time User - Email Verification */}
            {isFirstTime && !emailVerified && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <KeyRound className="w-5 h-5 mt-0.5 text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-blue-900">First Time Setup</h4>
                      <p className="text-sm text-blue-800">
                        Enter your work email to set up your password for the first time.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleVerifyEmail} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="setup-email">Work Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="setup-email"
                        type="email"
                        placeholder="your.email@sentech.co.za"
                        value={passwordSetupData.email}
                        onChange={(e) => setPasswordSetupData({ ...passwordSetupData, email: e.target.value })}
                        className="pl-10"
                        required
                        data-testid="setup-email-input"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading} data-testid="verify-email-btn">
                    {loading ? 'Verifying...' : 'Continue'}
                  </Button>
                </form>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={resetToLogin}
                  data-testid="back-to-login-btn"
                >
                  Back to Login
                </Button>
              </div>
            )}

            {/* First Time User - Password Setup */}
            {isFirstTime && emailVerified && (
              <form onSubmit={handlePasswordSetup} className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 mt-0.5 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-green-900">Email Verified</h4>
                      <p className="text-sm text-green-800">
                        Create a secure password to complete your account setup.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verified-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="verified-email"
                      type="email"
                      value={passwordSetupData.email}
                      disabled
                      className="pl-10 bg-slate-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                      value={passwordSetupData.newPassword}
                      onChange={(e) => setPasswordSetupData({ ...passwordSetupData, newPassword: e.target.value })}
                      className="pl-10"
                      required
                      minLength={8}
                      data-testid="new-password-input"
                    />
                  </div>
                  <p className="text-xs text-slate-500">Minimum 8 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={passwordSetupData.confirmPassword}
                      onChange={(e) => setPasswordSetupData({ ...passwordSetupData, confirmPassword: e.target.value })}
                      className="pl-10"
                      required
                      data-testid="confirm-password-input"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading || setupSuccess} data-testid="setup-password-btn">
                  {loading ? 'Setting up...' : 'Set Password & Sign In'}
                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={resetToLogin}
                  data-testid="back-to-login-btn"
                >
                  Back to Login
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-xs text-slate-500">
              <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;