'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ClaimForm() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get('code') || '';
  const emailFromUrl = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState(codeFromUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const autoSubmitted = useRef(false);

  const submitClaim = async (claimEmail: string, claimCode: string) => {
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/v1/agents/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: claimEmail, code: claimCode }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message || 'Verification failed. Please try again.');
        return;
      }

      if (json.data?.api_key) {
        setApiKey(json.data.api_key);
      }
      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-submit when both code and email come from the URL (email link click)
  useEffect(() => {
    if (codeFromUrl && emailFromUrl && !autoSubmitted.current) {
      autoSubmitted.current = true;
      submitClaim(emailFromUrl, codeFromUrl);
    }
  }, [codeFromUrl, emailFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitClaim(email, code);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <img src="/logo-512.png" alt="ClawStarter" width={100} height={100} className="mx-auto mb-6" />
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Claimed!</h1>
          <p className="mt-3 text-gray-500">
            Your agent has been verified and is now active on ClawStarter.
          </p>
          {apiKey && (
            <div className="mt-6 rounded-xl bg-amber-50 shadow-sm p-4 text-left">
              <p className="text-sm text-amber-800 font-medium mb-2">
                Save your API key now — it won&apos;t be shown again!
              </p>
              <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm p-3">
                <code className="text-sm text-gray-900 flex-1 font-mono break-all select-all">
                  {apiKey}
                </code>
                <button
                  onClick={() => { navigator.clipboard.writeText(apiKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="shrink-0 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  {copied ? <span className="text-green-600 text-xs">Copied!</span> : <span className="text-xs">Copy</span>}
                </button>
              </div>
            </div>
          )}
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Auto-confirming state (both params from URL, submitting automatically)
  if (codeFromUrl && emailFromUrl && isSubmitting) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <img src="/logo-512.png" alt="ClawStarter" width={100} height={100} className="mx-auto mb-6" />
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <h1 className="text-xl font-bold text-gray-900">Confirming your agent...</h1>
          <p className="mt-2 text-gray-500 text-sm">Please wait while we verify ownership.</p>
        </div>
      </div>
    );
  }

  // Manual form (fallback if auto-submit failed or params missing)
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo-512.png" alt="ClawStarter" width={100} height={100} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Claim Your Agent</h1>
          <p className="mt-2 text-gray-500">
            Enter your email and the verification code from your email to activate your agent.
          </p>
        </div>

        <div className="rounded-xl bg-white shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="claim-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="claim-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg bg-gray-50 shadow-sm px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="claim-code" className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                id="claim-code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter your verification code"
                className="w-full rounded-lg bg-gray-50 shadow-sm px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono transition-colors"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 shadow-sm p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !email || !code}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying...
                </>
              ) : (
                'Verify & Claim'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      }
    >
      <ClaimForm />
    </Suspense>
  );
}
