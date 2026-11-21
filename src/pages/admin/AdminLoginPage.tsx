import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../hooks/useRouter';
import { BrandLogo } from '../../components/BrandLogo';

export const AdminLoginPage: React.FC = () => {
  const { loginWithGoogle, login } = useAuth();
  const { navigate } = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleAdminLogin = async () => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const authorized = await loginWithGoogle();
      if (authorized) {
        navigate('/admin');
      } else {
        setErrorMsg(
          'Signed in with Google, but this account does not have authorized store admin privileges in Firestore.'
        );
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Google admin authentication failed.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/admin');
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Administrative authentication failed.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <BrandLogo size="lg" className="justify-center mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          MK Labs Store Control Center
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Restricted access for authorized MK Labs store administrators.
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-4 sm:py-8 sm:px-8 shadow-xs rounded-lg border border-slate-200">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="break-words">{errorMsg}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleAdminLogin}
            disabled={isSubmitting}
            className="w-full min-h-[44px] py-2.5 mb-5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 text-xs sm:text-sm font-semibold rounded-md transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            Sign in with Authorized Google Account
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-2 text-slate-400">
                or admin email &amp; password
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full min-h-[44px] pl-9 pr-3 py-2.5 rounded-md border border-slate-300 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full min-h-[44px] pl-9 pr-3 py-2.5 rounded-md border border-slate-300 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[44px] py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-md transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? 'Verifying Credentials...'
                : 'Authenticate as Administrator'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1 min-h-[40px] hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Website</span>
            </button>
            <span className="font-mono text-[11px] text-slate-400">
              Firebase Auth
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
