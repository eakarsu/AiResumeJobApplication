import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    const verify = async () => {
      try {
        const res = await authAPI.verifyEmail(token);
        setStatus('success');
        setMessage(res.data.message);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Verifying your email...</h1>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Email Verified!</h1>
            <p className="text-gray-500 mb-6">{message}</p>
            <Link to="/" className="btn-primary px-6 py-2 inline-block">
              Go to Dashboard
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-500 mb-6">{message}</p>
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
