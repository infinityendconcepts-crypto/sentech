import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authAPI } from '../services/api';
import { Award, Mail, Lock, KeyRound, FileText, Users, ShieldCheck, RefreshCw } from 'lucide-react';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // OTP state
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpDevCode, setOtpDevCode] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);

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
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otpEmail.trim()) { setError('Please enter your email'); return; }
    setLoading(true);
    try {
      const res = await authAPI.requestOtp(otpEmail.trim().toLowerCase());
      setOtpSent(true);
      if (res.data.dev_note) setOtpDevCode(res.data.dev_note);
      // Start 60s countdown for resend
      setOtpCountdown(60);
      const timer = setInterval(() => {
        setOtpCountdown(c => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otpCode.trim()) { setError('Please enter the OTP code'); return; }
    setLoading(true);
    try {
      const res = await authAPI.verifyOtp(otpEmail.trim().toLowerCase(), otpCode.trim());
      login(res.data.access_token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.detail || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:flex flex-col justify-center space-y-6">
          <div className="flex items-center gap-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_877694de-c9d9-4133-bcb4-cd4bf6e19551/artifacts/576jxjw8_HeCFT4bk_400x400.jpg" 
              alt="Sentech Logo" 
              className="w-20 h-20 rounded-xl object-contain"
            />
            <div>
              <h1 className="text-4xl font-heading font-bold text-slate-900">Sentech</h1>
              <p className="text-lg text-slate-600">Bursary Management System</p>
            </div>
          </div>
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
            <CardTitle className="text-2xl font-heading font-bold text-center">Welcome</CardTitle>
            <CardDescription className="text-center">Sign in to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4" data-testid="error-alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email" data-testid="tab-email-password">
                  Email/Password
                </TabsTrigger>
                <TabsTrigger value="microsoft" data-testid="tab-microsoft">
                  Microsoft
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your.email@university.edu"
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
              </TabsContent>

              <TabsContent value="otp" className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleRequestOtp} className="space-y-4">
                    <div className="text-center pb-2">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm text-slate-600">Enter your email to receive a one-time login code</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="otp-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="otp-email"
                          type="email"
                          placeholder="your.email@university.edu"
                          value={otpEmail}
                          onChange={(e) => setOtpEmail(e.target.value)}
                          className="pl-10"
                          required
                          data-testid="otp-email-input"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading} data-testid="send-otp-btn">
                      {loading ? 'Sending...' : 'Send Login Code'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="text-center pb-2">
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Mail className="w-6 h-6 text-emerald-600" />
                      </div>
                      <p className="text-sm text-slate-700 font-medium">Code sent to {otpEmail}</p>
                      <p className="text-xs text-slate-500 mt-1">Check your inbox and enter the 6-digit code below</p>
                    </div>
                    {otpDevCode && (
                      <Alert className="bg-amber-50 border-amber-200">
                        <AlertDescription className="text-amber-800 text-sm">
                          <strong>Dev Mode:</strong> {otpDevCode}
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="otp-code">6-Digit Code</Label>
                      <Input
                        id="otp-code"
                        type="text"
                        placeholder="000000"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="text-center text-2xl tracking-[0.5em] font-mono"
                        maxLength={6}
                        required
                        autoFocus
                        data-testid="otp-code-input"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading || otpCode.length !== 6} data-testid="verify-otp-btn">
                      {loading ? 'Verifying...' : 'Verify & Sign In'}
                    </Button>
                    <div className="flex items-center justify-between text-sm">
                      <button type="button" className="text-slate-500 hover:text-slate-700" onClick={() => { setOtpSent(false); setOtpCode(''); setOtpDevCode(''); }}>
                        ← Change email
                      </button>
                      <button
                        type="button"
                        className={`flex items-center gap-1 ${otpCountdown > 0 ? 'text-slate-400' : 'text-primary hover:underline'}`}
                        disabled={otpCountdown > 0}
                        onClick={handleRequestOtp}
                      >
                        <RefreshCw className="w-3 h-3" />
                        {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Resend code'}
                      </button>
                    </div>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="microsoft" className="space-y-4">
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
                      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
                      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-slate-900">
                      Microsoft Entra ID Authentication
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Sign in with your Microsoft organizational account
                    </p>
                  </div>
                  <Button 
                    onClick={handleMicrosoftLogin}
                    className="w-full gap-2 bg-[#2F2F2F] hover:bg-[#1F1F1F]" 
                    disabled={loading}
                    data-testid="microsoft-login-btn"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
                      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
                      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
                    </svg>
                    {loading ? 'Connecting...' : 'Sign in with Microsoft'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

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