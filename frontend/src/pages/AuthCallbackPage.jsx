import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const userId = searchParams.get('user');
      const error = searchParams.get('error');

      if (error) {
        navigate('/login?error=' + error);
        return;
      }

      if (token && userId) {
        try {
          // Get user details
          const response = await authAPI.getMe();
          login(token, response.data);
        } catch (err) {
          console.error('Failed to get user details:', err);
          navigate('/login?error=auth_failed');
        }
      } else {
        navigate('/login?error=invalid_callback');
      }
    };

    handleCallback();
  }, [searchParams, login, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg text-slate-600">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
