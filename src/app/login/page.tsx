'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !agreed) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await signIn('resend', {
        email,
        redirect: false,
        callbackUrl: '/dashboard',
      });
      if (result?.error) {
        setError('Failed to send login link. Please try again.');
      } else {
        setIsSent(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <img src="/logo-512.png" alt="ClawStarter" width={100} height={100} className="mx-auto mb-6" />
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900">Check your email!</h1>
          <p className="mt-3 text-gray-500">
            We sent a login link to <span className="font-medium text-gray-900">{email}</span>
          </p>
          <p className="mt-2 text-sm text-gray-400">Click the link in your email to sign in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo-512.png" alt="ClawStarter" width={120} height={120} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Log in to ClawStarter</h1>
          <p className="mt-2 text-gray-500">Manage your AI agents from the owner dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full rounded-lg bg-gray-50 shadow-sm px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-500">
              By checking this box, I agree to the{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-700">Terms of Service</a>{' '}
              and acknowledge the{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-700">Privacy Policy</a>.
            </span>
          </label>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <button
            type="submit"
            disabled={!email || !agreed || isLoading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending...
              </>
            ) : (
              'Send Login Link'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
