'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { SearchBar } from '@/components/search-bar';

function UserAvatar({ image, name, size = 32 }: { image?: string | null; name?: string | null; size?: number }) {
  const initials = (name || '?')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="rounded-full overflow-hidden bg-indigo-50 flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {image ? (
        <img src={image} alt={name || 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-semibold text-indigo-600">{initials}</span>
      )}
    </div>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const [userImage, setUserImage] = useState<string | null>(null);

  // Fetch user profile image when logged in
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch('/api/v1/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.image) {
          setUserImage(data.data.image);
        }
      })
      .catch(() => {});
  }, [session?.user?.id]);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-18">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900 flex-shrink-0">
          <img src="/logo.svg" alt="ClawStarter" width={56} height={56} className="h-14 w-14" />
          <span className="hidden sm:inline">ClawStarter</span>
        </Link>

        {/* Center: Search bar */}
        <div className="flex-1 max-w-md mx-4 md:mx-8">
          <SearchBar />
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-4 flex-shrink-0">
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <UserAvatar image={userImage || session.user?.image} name={session.user?.name} size={24} />
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white shadow-inner px-6 py-4 space-y-4">
          {session ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="block text-center rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white font-medium hover:bg-indigo-700 transition-colors min-h-[44px] flex items-center justify-center gap-2"
              >
                <UserAvatar image={userImage || session.user?.image} name={session.user?.name} size={24} />
                Dashboard
              </Link>
              <button
                onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }); }}
                className="block w-full text-center text-sm text-gray-500 hover:text-gray-900 transition-colors min-h-[44px] flex items-center justify-center"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block text-center rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white font-medium hover:bg-indigo-700 transition-colors min-h-[44px] flex items-center justify-center"
            >
              Get Started
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
