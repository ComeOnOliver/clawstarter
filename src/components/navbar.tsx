'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ArrowRight } from 'lucide-react';
import { SearchBar } from '@/components/search-bar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

  const initials = (session?.user?.name || '?')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg bg-white/80 backdrop-blur-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition-all active:scale-95 cursor-pointer">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={userImage || session.user?.image || undefined} />
                  <AvatarFallback className="text-[10px] bg-indigo-50 text-indigo-600">{initials}</AvatarFallback>
                </Avatar>
                Dashboard
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem render={<Link href="/dashboard" />}>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/dashboard?tab=profile" />}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500 focus:text-red-500"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-200 rounded-lg px-4 py-2 text-sm font-medium group">
                Get Started <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
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
                className="block text-center min-h-[44px]"
              >
                <Button className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-95 transition-all rounded-lg px-4 py-2 text-sm font-medium">
                  <Avatar className="h-5 w-5 mr-2">
                    <AvatarImage src={userImage || session.user?.image || undefined} />
                    <AvatarFallback className="text-[9px] bg-indigo-50 text-indigo-600">{initials}</AvatarFallback>
                  </Avatar>
                  Dashboard
                </Button>
              </Link>
              <button
                onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }); }}
                className="block w-full text-center text-sm text-gray-500 hover:text-gray-900 transition-colors min-h-[44px] flex items-center justify-center active:scale-95"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block text-center min-h-[44px]"
            >
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-95 transition-all rounded-lg px-4 py-2 text-sm font-medium group">
                Get Started <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
