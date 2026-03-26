'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ArrowRight, X, Menu, Compass } from 'lucide-react';
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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

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
          className="md:hidden min-h-[48px] min-w-[48px] flex items-center justify-center flex-shrink-0"
          aria-label="Toggle menu"
        >
          {open ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile full-screen overlay menu */}
      <div
        className={`md:hidden fixed inset-0 top-[72px] z-50 transition-all duration-300 ease-in-out ${
          open
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/20"
          onClick={() => setOpen(false)}
        />

        {/* Slide-in panel */}
        <div
          className={`absolute inset-y-0 right-0 w-full bg-white shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Close button at top */}
          <div className="flex justify-end px-6 pt-4">
            <button
              onClick={() => setOpen(false)}
              className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          {/* User info at top when logged in */}
          {session && (
            <div className="px-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={userImage || session.user?.image || undefined} />
                  <AvatarFallback className="text-sm bg-indigo-50 text-indigo-600">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900">{session.user?.name || 'User'}</p>
                  <p className="text-sm text-gray-500">{session.user?.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Menu items */}
          <div className="flex-1 px-6 py-4 space-y-2">
            {session ? (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 min-h-[48px] px-4 py-3 rounded-xl text-gray-900 font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <ArrowRight className="h-5 w-5 text-indigo-600" />
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 min-h-[48px] px-4 py-3 rounded-xl text-gray-900 font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <ArrowRight className="h-5 w-5 text-indigo-600" />
                Get Started
              </Link>
            )}

            <Link
              href="/projects"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 min-h-[48px] px-4 py-3 rounded-xl text-gray-900 font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <Compass className="h-5 w-5 text-indigo-600" />
              Explore
            </Link>
          </div>

          {/* Bottom: CTA or Logout */}
          <div className="px-6 pb-8 pt-4 border-t border-gray-100">
            {session ? (
              <button
                onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }); }}
                className="w-full min-h-[48px] flex items-center justify-center rounded-xl text-red-500 font-medium hover:bg-red-50 active:bg-red-100 transition-colors"
              >
                Log out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block"
              >
                <Button className="w-full min-h-[48px] bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-95 transition-all rounded-xl px-4 py-3 text-base font-medium group">
                  Get Started <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
