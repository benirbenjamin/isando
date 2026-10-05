import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, Mail, ArrowRight, User, Lock, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [tab, setTab] = useState('signup'); // 'signup', 'otp', 'password'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = enter details/email, 2 = enter 6-digit OTP code
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signup, requestOtp, verifyOtp, loginWithPassword } = useAuth();
  const navigate = useNavigate();

  // Handle Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(fullName, email, phone);
      setStep(2); // Move to OTP verification screen
    } catch (err) {
      setError(err.message || 'Failed to process signup');
    } finally {
      setLoading(false);
    }
  };

  // Handle Request OTP for existing email
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await requestOtp(email);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP and Auto Login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyOtp(email, otpCode);
      navigate('/dashboard'); // Automatically log in and redirect
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Login Fallback
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
            onClick={() => { setTab('signup'); setStep(1); setError(''); }}
            className={`flex-1 py-3 text-center border-b-2 transition ${tab === 'signup' ? 'border-brand-yellow text-brand-dark font-extrabold' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            👤 Sign Up
          </button>
          <button
            onClick={() => { setTab('otp'); setStep(1); setError(''); }}
            className={`flex-1 py-3 text-center border-b-2 transition ${tab === 'otp' ? 'border-brand-yellow text-brand-dark font-extrabold' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            ✉️ OTP Login
          </button>
          <button
            onClick={() => { setTab('password'); setError(''); }}
            className={`flex-1 py-3 text-center border-b-2 transition ${tab === 'password' ? 'border-brand-yellow text-brand-dark font-extrabold' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            🔑 Password
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-brand-red p-3 rounded-2xl text-xs font-semibold mb-4">
            {error}
          </div>
        )}

        {/* STEP 2: VERIFY OTP CODE (COMMON FOR SIGNUP & OTP LOGIN) */}
        {step === 2 && (tab === 'signup' || tab === 'otp') ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="bg-brand-soft border border-brand-border p-3 rounded-xl text-xs text-brand-dark flex justify-between items-center">
              <span>Verification sent to: <strong>{email}</strong></span>
              <button type="button" onClick={() => setStep(1)} className="text-brand-red font-bold hover:underline">Edit Email</button>
            </div>

            <p className="text-xs text-gray-500">
              Please check your email inbox for the 6-digit verification code and enter it below.
            </p>

            <div>
              <label className="text-xs font-extrabold text-brand-dark block mb-1">
                Enter 6-Digit Code
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
              {loading ? 'Verifying...' : 'Verify Code & Sign In Automatically'}
            </button>
          </form>
        ) : (
          <>
            {/* TAB 1: SIGNUP */}
            {tab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="text-xs font-extrabold text-brand-dark block mb-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Jean Paul"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-brand-soft border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-brand-dark block mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="jean@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-brand-soft border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-brand-dark block mb-1">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      placeholder="0788123456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-brand-soft border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark py-3 rounded-2xl font-black text-sm shadow transition flex items-center justify-center gap-2"
                >
                  {loading ? 'Processing Signup...' : 'Create Account & Send Verification Code'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* TAB 2: EXISTING OTP LOGIN */}
            {tab === 'otp' && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-extrabold text-brand-dark block mb-1">
                    Registered Email Address
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
            )}

            {/* TAB 3: PASSWORD LOGIN FALLBACK */}
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
          </>
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
