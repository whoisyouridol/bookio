import { useState } from 'react';
import { Link } from 'react-router';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { getSalons } from '@/api/salons';
import { registerMaster, registerMasterWithGoogle, registerMasterWithFacebook } from '@/api/auth';
import { getErrorMessage } from '@/lib/error';
import type { SalonDto } from '@/types';

type Step = 'select-salon' | 'register' | 'success';

export default function MasterRegisterPage() {
  const [step, setStep] = useState<Step>('select-salon');
  const [selectedSalon, setSelectedSalon] = useState<SalonDto | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Email form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const { data: salons = [], isLoading: salonsLoading } = useQuery({
    queryKey: ['salons-public'],
    queryFn: getSalons,
  });

  const filtered = salons.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.address?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSuccess = () => setStep('success');

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSalon) return;
    setLoading(true);
    try {
      await registerMaster({ email, password, firstName, lastName, phone: phone || undefined, salonId: selectedSalon.id });
      handleSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential: string) => {
    if (!selectedSalon) return;
    setLoading(true);
    try {
      await registerMasterWithGoogle(credential, selectedSalon.id);
      handleSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const isHttps = window.location.protocol === 'https:';

  const handleFacebook = () => {
    if (!selectedSalon) return;
    const salonId = selectedSalon.id;
    window.FB?.login(
      res => {
        if (!res.authResponse?.accessToken) return;
        const token = res.authResponse.accessToken;
        setLoading(true);
        registerMasterWithFacebook(token, salonId)
          .then(() => handleSuccess())
          .catch(err => toast.error(getErrorMessage(err)))
          .finally(() => setLoading(false));
      },
      { scope: 'email,public_profile' }
    );
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Registration submitted!</h1>
          <p className="text-sm text-gray-500 mb-6">
            Your application to join <strong>{selectedSalon?.name}</strong> is pending review.
            An administrator will activate your account shortly.
          </p>
          <Link
            to="/login"
            className="block w-full bg-purple-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors text-center"
          >
            Back to Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Join as a Master</h1>
          <p className="text-sm text-gray-500">
            {step === 'select-salon' ? 'Choose the salon you work at' : `Registering for ${selectedSalon?.name}`}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-6">
          {(['select-salon', 'register'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? 'bg-purple-600 text-white'
                  : i < (['select-salon', 'register'] as Step[]).indexOf(step)
                    ? 'bg-purple-200 text-purple-700'
                    : 'bg-gray-100 text-gray-400'
              }`}>
                {i + 1}
              </div>
              {i < 1 && <div className="h-px bg-gray-200 w-8" />}
            </div>
          ))}
          <span className="text-xs text-gray-400 ml-1">
            {step === 'select-salon' ? 'Select salon' : 'Create account'}
          </span>
        </div>

        {/* Step 1: Salon selector */}
        {step === 'select-salon' && (
          <div className="space-y-3">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search salons..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Salon list */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {salonsLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                ))
              ) : filtered.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  {search ? 'No salons match your search' : 'No salons available'}
                </p>
              ) : (
                filtered.map(salon => (
                  <button
                    key={salon.id}
                    type="button"
                    onClick={() => setSelectedSalon(salon)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                      selectedSalon?.id === salon.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${selectedSalon?.id === salon.id ? 'text-purple-700' : 'text-gray-800'}`}>
                      {salon.name}
                    </p>
                    {salon.address && (
                      <p className="text-xs text-gray-400 mt-0.5">{salon.address}</p>
                    )}
                  </button>
                ))
              )}
            </div>

            <button
              type="button"
              disabled={!selectedSalon}
              onClick={() => setStep('register')}
              className="w-full mt-2 bg-purple-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-40 transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Registration */}
        {step === 'register' && (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-100 rounded-lg px-4 py-3">
              <p className="text-xs text-purple-700">
                Signing up for <strong>{selectedSalon?.name}</strong>. Your account will be reviewed before activation.
              </p>
            </div>

            {/* Email + password form */}
            <form onSubmit={handleEmailRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First name</label>
                  <input
                    required
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last name</label>
                  <input
                    required
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Min. 6 characters"
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone <span className="text-gray-400">(optional)</span></label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+1 234 567 8900"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Submitting…' : 'Create account'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Social */}
            <div className="space-y-2">
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={async credentialResponse => {
                    if (!credentialResponse.credential) return;
                    await handleGoogle(credentialResponse.credential);
                  }}
                  onError={() => toast.error('Google sign-in failed')}
                  width="368"
                  text="signup_with"
                  shape="rectangular"
                />
              </div>
              {isHttps ? (
                <button
                  onClick={handleFacebook}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continue with Facebook
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setStep('select-salon')}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors pt-1"
            >
              ← Back
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
