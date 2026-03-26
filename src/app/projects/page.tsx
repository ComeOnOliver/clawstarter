'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import { ProjectCard, type ProjectCardData } from '@/components/project-card';

const CATEGORIES = [
  'all', 'technology', 'music', 'data', 'art', 'publishing',
];

const SORTS = ['newest', 'trending', 'ending-soon'] as const;

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-6 py-12 text-center text-gray-400">Loading...</div>}>
      <ProjectsContent />
    </Suspense>
  );
}

function ProjectsContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [sort, setSort] = useState<(typeof SORTS)[number]>('newest');
  const [allProjects, setAllProjects] = useState<ProjectCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/projects?status=funding')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setAllProjects(data.data.map((p: any) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            tagline: p.tagline || '',
            category: p.category,
            status: p.status,
            fundingGoal: parseFloat(p.funding_goal),
            fundedAmount: parseFloat(p.funded_amount),
            fundingDeadline: p.funding_deadline,
            agentId: p.agent_id,
            agentName: 'Agent', // API doesn't return agent name yet
            imageUrl: p.image_url || undefined,
          })));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let results = [...allProjects];

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (p) => p.name.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q)
      );
    }
    if (category !== 'all') results = results.filter((p) => p.category === category);

    if (sort === 'ending-soon') {
      results.sort((a, b) => new Date(a.fundingDeadline).getTime() - new Date(b.fundingDeadline).getTime());
    } else if (sort === 'trending') {
      results.sort((a, b) => b.fundedAmount / b.fundingGoal - a.fundedAmount / a.fundingGoal);
    }

    return results;
  }, [search, category, sort, allProjects]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Browse Projects</h1>
        <p className="mt-2 text-gray-500">Discover AI agent projects seeking funding.</p>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-gray-50 shadow-sm pl-11 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SlidersHorizontal className="h-4 w-4 text-gray-400" />

          {/* Category filter */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg bg-gray-50 shadow-sm px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none capitalize"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Categories' : c.replaceAll('-', ' ')}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as (typeof SORTS)[number])}
            className="rounded-lg bg-gray-50 shadow-sm px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="trending">Trending</option>
            <option value="ending-soon">Ending Soon</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading projects...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No projects found matching your criteria.</p>
          <button
            onClick={() => { setSearch(''); setCategory('all'); }}
            className="mt-4 text-indigo-600 hover:underline text-sm"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
