import React, { useState, useEffect } from 'react';
import {
  User,
  ShoppingBag,
  AlertCircle,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useRouter } from '../hooks/useRouter';
import { StoreApi } from '../services/api';
import { isSafeExternalHttpsUrl } from '../services/orderValidation';
import {
  StoreOrderRecord,
  DigitalProduct,
  formatProductPrice,
} from '../types/store';

export const AccountPage: React.FC = () => {
  const {
    user,
    firebaseUser,
    loginWithGoogle,
    login,
    register,
    resendVerificationEmail,
    logout,
    isAdmin,
  } = useAuth();
  const { convertPrice } = useCurrency();
  const { navigate } = useRouter();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [myOrders, setMyOrders] = useState<StoreOrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [publishedProducts, setPublishedProducts] = useState<DigitalProduct[]>(
    []
  );
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState('');
  const [verificationError, setVerificationError] = useState('');

  useEffect(() => {
    if (user) {
      setOrdersLoading(true);
      StoreApi.getMyOrders(user.id)
        .then(setMyOrders)
        .catch(() => setMyOrders([]))
        .finally(() => setOrdersLoading(false));

      StoreApi.getProducts({ limit: 6 })
        .then((res) => setPublishedProducts(res.products))
        .catch(() => setPublishedProducts([]));
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Google sign-in failed.'
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
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, fullName, password);
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Authentication error.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-14 sm:pt-36 sm:pb-24">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white p-5 sm:p-8 rounded-lg border border-slate-200 shadow-xs">
            <div className="text-center mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-3">
                <User className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                {mode === 'login'
                  ? 'Sign in to Your Account'
                  : 'Create Customer Account'}
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                {mode === 'login'
                  ? 'Sign in with Firebase Authentication to track your MK Labs orders.'
                  : 'Create an MK Labs customer account.'}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full min-h-[44px] py-2.5 px-4 mb-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Continue with Google</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-white px-2 text-slate-400">
                  or with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Alex Mercer"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-md border border-slate-300 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-md border border-slate-300 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-md border border-slate-300 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px] py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting
                  ? 'Authenticating...'
                  : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
              {mode === 'login' ? (
                <span>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMsg('');
                    }}
                    className="text-blue-600 font-semibold hover:underline cursor-pointer py-1"
                  >
                    Register free
                  </button>
                </span>
              ) : (
                <span>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                    }}
                    className="text-blue-600 font-semibold hover:underline cursor-pointer py-1"
                  >
                    Sign in
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-14 sm:pt-28 sm:pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 sm:space-y-8">
        {/* Customer Header */}
        <div className="bg-white p-4 sm:p-8 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
              {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                  {user.fullName}
                </h1>
                <span className="text-[10px] uppercase font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 break-all">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="min-h-[44px] sm:min-h-0 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors cursor-pointer text-center"
              >
                Go to Admin Dashboard
              </button>
            )}
            <button
              onClick={() => void logout()}
              className="min-h-[44px] sm:min-h-0 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors cursor-pointer text-center"
            >
              Sign Out
            </button>
          </div>
        </div>

        {firebaseUser && !firebaseUser.emailVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-start gap-2.5 min-w-0">
              <Mail className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <strong className="font-semibold block">
                  Verify Your Email Address
                </strong>
                <span className="break-words">
                  Please verify your email via the link sent to{' '}
                  <strong className="break-all">{user.email}</strong> to sync your customer profile and speed up order support.
                </span>
                {verificationNotice && (
                  <span className="mt-1 flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    {verificationNotice}
                  </span>
                )}
                {verificationError && (
                  <span className="mt-1 block text-red-700 font-semibold">
                    {verificationError}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={verificationBusy}
              onClick={async () => {
                setVerificationBusy(true);
                setVerificationError('');
                setVerificationNotice('');
                try {
                  await resendVerificationEmail();
                  setVerificationNotice(
                    'Verification email sent! Please check your inbox and spam folder.'
                  );
                } catch (err) {
                  setVerificationError(
                    err instanceof Error
                      ? err.message
                      : 'Unable to send verification email right now.'
                  );
                } finally {
                  setVerificationBusy(false);
                }
              }}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-md bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 font-semibold shrink-0 cursor-pointer disabled:opacity-50"
            >
              {verificationBusy ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>
        )}

        {/* Customer Orders & Email PDF Delivery Status */}
        <div className="bg-white p-4 sm:p-8 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5 sm:mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                My Orders &amp; Delivery Status
              </h2>
              <p className="text-xs text-slate-500">
                Track payment verification and manual email PDF delivery for orders placed while signed in.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {myOrders.length} {myOrders.length === 1 ? 'order' : 'orders'}
            </span>
          </div>

          {ordersLoading ? (
            <div className="py-10 flex items-center justify-center gap-2 text-xs text-slate-500">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading your orders...</span>
            </div>
          ) : myOrders.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg px-4">
              <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-600">
                No orders found for your signed-in account yet.
              </p>
              <button
                onClick={() => navigate('/store')}
                className="mt-3 min-h-[40px] px-4 py-2 rounded-md text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Explore Digital Store →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden">
              {myOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="font-mono font-bold text-slate-900 break-all">
                        {ord.id}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          ord.paymentStatus === 'Paid' ||
                          ord.paymentStatus === 'Verified'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : ord.paymentStatus === 'Payment Link Sent'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : ord.paymentStatus === 'Submitted'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : ord.paymentStatus === 'Rejected'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        Payment: {ord.paymentStatus}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          ord.deliveryStatus === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        Delivery: {ord.deliveryStatus}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900 break-words">
                      {ord.productName} (Qty {ord.quantity}) ·{' '}
                      <span className="tabular-nums">
                        {formatProductPrice(ord.totalAmount, ord.currency)}
                      </span>
                      {(() => {
                        const converted = convertPrice(
                          ord.totalAmount,
                          ord.currency
                        );
                        return converted.isConverted ? (
                          <span className="ml-1.5 text-[11px] font-normal text-slate-500 tabular-nums">
                            (Est. {converted.formatted})
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </span>
                      <span className="break-all">· PDF Delivery Email: {ord.customerEmail}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 shrink-0">
                    {ord.paymentMethod === 'payoneer' &&
                      ord.paymentStatus === 'Payment Link Sent' &&
                      ord.paymentRequestLink &&
                      isSafeExternalHttpsUrl(ord.paymentRequestLink) && (
                        <a
                          href={ord.paymentRequestLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                        >
                          <span>Pay with Payoneer</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                    <button
                      type="button"
                      onClick={() => navigate(`/store/order/${ord.id}`)}
                      className="min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      <span>View Order / Payment Info</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Published Store Products */}
        {publishedProducts.length > 0 && (
          <div className="bg-white p-4 sm:p-8 rounded-lg border border-slate-200 shadow-xs">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Latest Store Releases
              </h2>
              <p className="text-xs text-slate-500">
                Published digital products from MK Labs.
              </p>
            </div>

            <div className="grid grid-cols-1 min-[375px]:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {publishedProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => navigate(`/store/product/${prod.slug}`)}
                  className="p-3.5 sm:p-4 rounded-md border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                      {prod.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {prod.shortDescription}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 text-right">
                    <span className="text-xs font-semibold text-blue-600">
                      View Details →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
