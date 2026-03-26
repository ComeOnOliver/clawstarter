'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, Bot, User, Loader2 } from 'lucide-react';

interface SearchResults {
  categories: { slug: string; label: string }[];
  agents: { id: string; name: string; isVerified: boolean }[];
  users: { id: string; name: string; username: string | null; image: string | null }[];
  projects: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    category: string;
    imageUrl: string | null;
    agentName: string;
  }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  technology: 'bg-blue-100 text-blue-700',
  games: 'bg-purple-100 text-purple-700',
  publishing: 'bg-amber-100 text-amber-700',
  music: 'bg-pink-100 text-pink-700',
  film: 'bg-red-100 text-red-700',
  comics: 'bg-orange-100 text-orange-700',
  art: 'bg-fuchsia-100 text-fuchsia-700',
  data: 'bg-emerald-100 text-emerald-700',
  'agent-tools': 'bg-cyan-100 text-cyan-700',
  journalism: 'bg-yellow-100 text-yellow-700',
  'open-source': 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-700',
};

export function SearchBar() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Debounced fetch
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/v1/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          setResults(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDropdown(false);
        setMobileOpen(false);
        inputRef.current?.blur();
        mobileInputRef.current?.blur();
      } else if (e.key === 'Enter' && query.length >= 2) {
        router.push(`/projects?q=${encodeURIComponent(query)}`);
        setShowDropdown(false);
        setMobileOpen(false);
      }
    },
    [query, router],
  );

  const closeAndNavigate = useCallback(() => {
    setShowDropdown(false);
    setMobileOpen(false);
    setQuery('');
  }, []);

  const hasResults =
    results &&
    (results.categories.length > 0 ||
      results.agents.length > 0 ||
      results.users.length > 0 ||
      results.projects.length > 0);

  const dropdown = (
    <div className="absolute left-0 right-0 top-full mt-2 rounded-xl bg-white shadow-lg border border-gray-200 overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
      {loading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && query.length >= 2 && !hasResults && (
        <div className="px-4 py-6 text-center text-sm text-gray-500">
          No results found for &ldquo;{query}&rdquo;
        </div>
      )}

      {!loading && hasResults && (
        <>
          {/* Categories */}
          {results!.categories.length > 0 && (
            <div className="px-4 pt-3 pb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {results!.categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/projects?category=${cat.slug}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={closeAndNavigate}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize transition-opacity hover:opacity-80 ${CATEGORY_COLORS[cat.slug] || CATEGORY_COLORS.other}`}
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Creators — agents + users */}
          {(results!.agents.length > 0 || results!.users.length > 0) && (
            <div className="border-t border-gray-100 px-4 pt-3 pb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Creators
              </p>
              <div className="space-y-1">
                {results!.agents.map((agent) => (
                  <Link
                    key={`agent-${agent.id}`}
                    href={`/projects?q=${encodeURIComponent(agent.name)}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={closeAndNavigate}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
                      <p className="text-xs text-gray-400">Agent</p>
                    </div>
                  </Link>
                ))}
                {results!.users.map((user) => (
                  <Link
                    key={`user-${user.id}`}
                    href={`/projects?q=${encodeURIComponent(user.name || user.username || '')}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={closeAndNavigate}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name || ''}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name || user.username}
                      </p>
                      {user.username && (
                        <p className="text-xs text-gray-400">@{user.username}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {results!.projects.length > 0 && (
            <div className="border-t border-gray-100 px-4 pt-3 pb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Projects
              </p>
              <div className="space-y-1">
                {results!.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.slug}?viewBy=human`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={closeAndNavigate}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {project.imageUrl ? (
                        <Image
                          src={project.imageUrl}
                          alt={project.name}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="text-sm">🤖</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                      <p className="text-xs text-gray-400 truncate">{project.tagline}</p>
                    </div>
                    <span
                      className={`hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${CATEGORY_COLORS[project.category] || CATEGORY_COLORS.other}`}
                    >
                      {project.category.replace('-', ' ')}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* See all results */}
          <div className="border-t border-gray-100">
            <Link
              href={`/projects?q=${encodeURIComponent(query)}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={closeAndNavigate}
              className="block px-4 py-3 text-center text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              See all results for &ldquo;{query}&rdquo;
            </Link>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Desktop input — always visible */}
      <div className="hidden md:block relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search projects, creators, categories..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-xl bg-gray-100 pl-10 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults(null);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
        {showDropdown && query.length >= 2 && dropdown}
      </div>

      {/* Mobile — icon toggle */}
      <button
        className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
        onClick={() => {
          setMobileOpen(!mobileOpen);
          if (!mobileOpen) {
            setTimeout(() => mobileInputRef.current?.focus(), 100);
          }
        }}
        aria-label="Search"
      >
        <Search className="h-5 w-5 text-gray-600" />
      </button>

      {/* Mobile fullscreen search overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={mobileInputRef}
                type="text"
                placeholder="Search projects, creators..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-xl bg-gray-100 pl-10 pr-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
              />
            </div>
            <button
              onClick={() => {
                setQuery('');
                setMobileOpen(false);
                setShowDropdown(false);
              }}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 font-medium text-sm"
            >
              Cancel
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
          {showDropdown && query.length >= 2 && (
            <div>
              {/* Reuse same dropdown content inline for mobile */}
              {loading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              )}
              {!loading && query.length >= 2 && !hasResults && (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  No results found for &ldquo;{query}&rdquo;
                </div>
              )}
              {!loading && hasResults && (
                <>
                  {results!.categories.length > 0 && (
                    <div className="px-4 pt-3 pb-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Categories</p>
                      <div className="flex flex-wrap gap-2">
                        {results!.categories.map((cat) => (
                          <Link key={cat.slug} href={`/projects?category=${cat.slug}`} onClick={closeAndNavigate}
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${CATEGORY_COLORS[cat.slug] || CATEGORY_COLORS.other}`}>
                            {cat.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {(results!.agents.length > 0 || results!.users.length > 0) && (
                    <div className="border-t border-gray-100 px-4 pt-3 pb-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Creators</p>
                      <div className="space-y-1">
                        {results!.agents.map((agent) => (
                          <Link key={`agent-${agent.id}`} href={`/projects?q=${encodeURIComponent(agent.name)}`} onClick={closeAndNavigate}
                            className="flex items-center gap-3 rounded-lg px-2 py-3 min-h-[44px] hover:bg-gray-50 transition-colors">
                            <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                              <Bot className="h-4 w-4 text-indigo-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
                              <p className="text-xs text-gray-400">Agent</p>
                            </div>
                          </Link>
                        ))}
                        {results!.users.map((user) => (
                          <Link key={`user-${user.id}`} href={`/projects?q=${encodeURIComponent(user.name || user.username || '')}`} onClick={closeAndNavigate}
                            className="flex items-center gap-3 rounded-lg px-2 py-3 min-h-[44px] hover:bg-gray-50 transition-colors">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {user.image ? (
                                <Image src={user.image} alt={user.name || ''} width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
                              ) : (
                                <User className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{user.name || user.username}</p>
                              {user.username && <p className="text-xs text-gray-400">@{user.username}</p>}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {results!.projects.length > 0 && (
                    <div className="border-t border-gray-100 px-4 pt-3 pb-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Projects</p>
                      <div className="space-y-1">
                        {results!.projects.map((project) => (
                          <Link key={project.id} href={`/projects/${project.id}`} onClick={closeAndNavigate}
                            className="flex items-center gap-3 rounded-lg px-2 py-3 min-h-[44px] hover:bg-gray-50 transition-colors">
                            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {project.imageUrl ? (
                                <Image src={project.imageUrl} alt={project.name} width={32} height={32} className="h-8 w-8 rounded-lg object-cover" />
                              ) : (
                                <span className="text-sm">🤖</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                              <p className="text-xs text-gray-400 truncate">{project.tagline}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="border-t border-gray-100">
                    <Link href={`/projects?q=${encodeURIComponent(query)}`} onClick={closeAndNavigate}
                      className="block px-4 py-3 text-center text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors">
                      See all results for &ldquo;{query}&rdquo;
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
