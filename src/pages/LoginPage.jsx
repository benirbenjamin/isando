import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, Mail, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [tab, setTab] = useState('otp'); // 'otp' or 'password'
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter code
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtpInfo, setDevOtpInfo] = useState('');

  const { requestOtp, verifyOtp, loginWithPassword } = useAuth();
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await requestOtp(email);
      setStep(2);
      if (res.devCode) {
        setDevOtpInfo(`[DEV CODE]: ${res.devCode}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyOtp(email, otpCode);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginWithPassword(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-soft flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link to="/" className="inline-block mb-3">
          <img 
            src="/logo.png" 
            alt="Romantic T Solutions Ltd" 
            className="h-16 w-auto mx-auto object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://i.postimg.cc/G2zNf3Fq/LOGO.png';
            }}
          />
        </Link>
        <h1 className="text-2xl font-black text-brand-dark">Romantic T Solutions Ltd</h1>
        <p className="text-xs text-brand-muted mt-1">Management Platform & Workforce Portal</p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white border border-brand-border rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Auth Mode Tabs */}
        <div className="flex border-b border-gray-100 mb-6 font-bold text-xs">
          <button
            onClick={() => { setTab('otp'); setError(''); }}
            className={`flex-1 py-3 text-center border-b-2 transition ${tab === 'otp' ? 'border-brand-yellow text-brand-dark font-extrabold' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            ✉️ Email Verification Code (OTP)
          </button>
          <button
            onClick={() => { setTab('password'); setError(''); }}
            className={`flex-1 py-3 text-center border-b-2 transition ${tab === 'password' ? 'border-brand-yellow text-brand-dark font-extrabold' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            🔑 Password Sign In
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-brand-red p-3 rounded-2xl text-xs font-semibold mb-4">
            {error}
          </div>
        )}

        {/* TAB 1: OTP Email Login */}
        {tab === 'otp' && (
          <div>
            {step === 1 ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-extrabold text-brand-dark block mb-1">
                    Enter Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="admin@romantictsolutions.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-brand-soft border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark py-3 rounded-2xl font-black text-sm shadow transition flex items-center justify-center gap-2"
                >
                  {loading ? 'Sending Code...' : 'Send 6-Digit Code to Email'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="bg-brand-soft border border-brand-border p-3 rounded-xl text-xs text-brand-dark flex justify-between items-center">
                  <span>Sent to: <strong>{email}</strong></span>
                  <button type="button" onClick={() => setStep(1)} className="text-brand-red font-bold hover:underline">Change</button>
                </div>

                {devOtpInfo && (
                  <div className="bg-amber-100 text-amber-900 border border-amber-300 p-2.5 rounded-xl text-xs font-black text-center">
                    {devOtpInfo}
                  </div>
                )}

                <div>
                  <label className="text-xs font-extrabold text-brand-dark block mb-1">
                    Enter 6-Digit Verification Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-brand-soft border border-brand-border rounded-xl text-lg font-black tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-red hover:bg-brand-redDark text-white py-3 rounded-2xl font-black text-sm shadow transition flex items-center justify-center gap-2"
                >
                  {loading ? 'Verifying...' : 'Verify Code & Sign In'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: Password Sign In */}
        {tab === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="text-xs font-extrabold text-brand-dark block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="admin@romantictsolutions.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-brand-soft border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-brand-dark block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-brand-soft border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark py-3 rounded-2xl font-black text-sm shadow transition flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In with Password'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <Link to="/" className="text-xs font-bold text-gray-500 hover:text-brand-red">
            &larr; Return to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}
