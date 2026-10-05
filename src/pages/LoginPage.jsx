import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { KeyRound, Mail, ArrowRight, User, Phone, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [step, setStep] = useState(1); // 1 = Enter Email / Sign up, 2 = Enter OTP code
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const { signup, requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  // Check for email invite link on URL mount (e.g. /login?email=xxx&autoOtp=true)
  useEffect(() => {
    const urlEmail = searchParams.get('email');
    const autoOtp = searchParams.get('autoOtp');

    if (urlEmail) {
      setEmail(urlEmail);
      if (autoOtp === 'true' || autoOtp === '1') {
        setInfoMessage(`Invitation link verified for ${urlEmail}. Sending your verification code...`);
        setLoading(true);
        requestOtp(urlEmail)
          .then(() => {
            setStep(2);
            setInfoMessage(`A 6-digit verification code was sent to ${urlEmail}. Please check your inbox.`);
          })
          .catch((err) => {
            setError(err.message || 'Failed to auto-send code. Please click Send Code below.');
          })
          .finally(() => setLoading(false));
      }
    }
  }, []);

  // Handle Existing User OTP Login Request
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      await requestOtp(email);
      setStep(2);
      setInfoMessage(`Verification code sent to ${email}`);
    } catch (err) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  // Handle New User Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      await signup(fullName, email, phone);
      setStep(2);
      setInfoMessage(`Account created successfully! Verification code sent to ${email}`);
    } catch (err) {
      setError(err.message || 'Failed to process signup');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Code Verification & Auto Login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyOtp(email, otpCode);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your 6-digit code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-soft flex flex-col items-center justify-center p-4 py-8">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link to="/" className="inline-block mb-3">
          <img 
            src="/logo.png" 
            alt="Isando - Romantic T Solutions Ltd" 
            className="h-16 w-auto mx-auto object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://i.postimg.cc/G2zNf3Fq/LOGO.png';
            }}
          />
        </Link>
        <h1 className="text-3xl font-black text-brand-dark tracking-tight">Isando</h1>
        <p className="text-xs font-bold text-brand-muted mt-1 uppercase tracking-wider">
          Romantic T Solutions Ltd — Management Platform
        </p>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-white border border-brand-border rounded-3xl p-6 sm:p-8 shadow-xl">
        
        {/* Status Alerts */}
        {infoMessage && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-2xl text-xs font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-yellow shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-brand-red p-3 rounded-2xl text-xs font-semibold mb-4">
            {error}
          </div>
        )}

        {/* STEP 2: ENTER 6-DIGIT OTP CODE */}
        {step === 2 ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center pb-2 border-b border-gray-100">
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6 text-brand-yellow" />
              </div>
              <h2 className="text-lg font-black text-brand-dark">Enter Verification Code</h2>
              <p className="text-xs text-gray-500 mt-1">
                Please check your inbox and <strong>Spam / Junk folder</strong> for your code.
              </p>
            </div>

            <div className="bg-brand-soft border border-brand-border p-3 rounded-xl text-xs text-brand-dark flex justify-between items-center">
              <span>Sent to: <strong className="text-brand-dark">{email}</strong></span>
              <button 
                type="button" 
                onClick={() => { setStep(1); setError(''); setInfoMessage(''); }} 
                className="text-brand-red font-extrabold hover:underline"
              >
                Change
              </button>
            </div>

            <div>
              <label className="text-xs font-extrabold text-brand-dark block mb-1">
                6-Digit Security Code *
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
                  className="w-full pl-10 pr-4 py-3 bg-brand-soft border border-brand-border rounded-xl text-xl font-black tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red hover:bg-brand-redDark text-white py-3.5 rounded-2xl font-black text-sm shadow transition flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying...' : 'Verify Code & Log In'}
            </button>

            <button
              type="button"
              onClick={handleRequestOtp}
              disabled={loading}
              className="w-full text-xs text-gray-500 font-bold hover:text-brand-dark py-2 text-center"
            >
              Didn't get code? Resend Code
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            
            {/* SECTION 1: LOG IN WITH EMAIL */}
            <form onSubmit={handleRequestOtp} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">
                  ✉️ Log In with Email
                </h2>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full">
                  Passwordless OTP
                </span>
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">
                  Registered Email Address *
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

            {/* DIVIDER */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-gray-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest absolute">
                or
              </span>
            </div>

            {/* SECTION 2: SIGN UP RIGHT UNDER LOGIN */}
            <form onSubmit={handleSignup} className="space-y-3 pt-1">
              <div>
                <h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">
                  👤 Create New Account (Sign Up)
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  New to Isando? Enter your name and email to sign up
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">
                  Full Name *
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
                <label className="text-xs font-bold text-gray-600 block mb-1">
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
                <label className="text-xs font-bold text-gray-600 block mb-1">
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
                className="w-full bg-brand-dark hover:bg-black text-white py-3 rounded-2xl font-black text-sm shadow transition flex items-center justify-center gap-2"
              >
                {loading ? 'Creating Account...' : 'Sign Up & Get Code'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <Link to="/" className="text-xs font-bold text-gray-500 hover:text-brand-red">
            &larr; Return to Isando Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
