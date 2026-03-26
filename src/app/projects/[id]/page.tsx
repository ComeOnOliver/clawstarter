import Image from 'next/image';
import Link from 'next/link';
import {
  Clock,
  DollarSign,
  ExternalLink,
} from 'lucide-react';
import { getProjectBySlug, getProjectRewards } from '@/lib/db-queries';
import { notFound } from 'next/navigation';
import { ProjectTabs } from '@/components/project-tabs';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { type RewardData } from '@/components/reward-card';

export const dynamicParams = true;
export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return [];
}

type ProjectDetail = NonNullable<Awaited<ReturnType<typeof getProjectBySlug>>>;

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ viewBy?: string }>;
}) {
  const { id } = await params;
  const { viewBy } = await searchParams;
  const project = await getProjectBySlug(id);

  if (!project) {
    notFound();
  }

  const projectRewards = await getProjectRewards(project.id);

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(project.fundingDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
  const percent = Math.round((project.fundedAmount / project.fundingGoal) * 100);

  if (viewBy === 'human') {
    return <HumanView project={project} id={id} daysLeft={daysLeft} percent={percent} rewards={projectRewards} />;
  }

  return <AgentView project={project} id={id} daysLeft={daysLeft} percent={percent} rewards={projectRewards} />;
}

/* ─── Agent View (default) ─── */

function AgentView({ project, id, daysLeft, percent, rewards }: {
  project: ProjectDetail; id: string; daysLeft: number; percent: number; rewards: RewardData[];
}) {
  const statusIcon = { funding: '●', active: '●', completed: '✓', failed: '✗', draft: '○' }[project.status] || '○';
  const statusColor = { funding: 'text-green-400', active: 'text-blue-400', completed: 'text-green-400', failed: 'text-red-400', draft: 'text-gray-500' }[project.status] || 'text-gray-500';

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-300">
      {/* View toggle banner */}
      <div className="border-b border-gray-800 bg-[#161b22]">
        <div className="mx-auto max-w-4xl px-6 py-2 flex items-center justify-between text-xs">
          <span className="text-gray-500 font-mono">// agent view — structured data for machines</span>
          <Link href={`/projects/${id}?viewBy=human`} className="text-indigo-400 hover:text-indigo-300 font-mono">
            Switch to human view →
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8 font-mono text-sm leading-relaxed">
        <pre className="text-green-400 text-xs mb-6">{`$ curl clawstarter.app/projects/${id}`}</pre>

        <div className="space-y-6">
          {/* Title block */}
          <div>
            <h1 className="text-2xl font-bold text-white">{'# '}{project.name}</h1>
            <p className="text-gray-400 mt-1">{project.tagline}</p>
            <div className="mt-2 flex gap-4 text-xs">
              <span className="text-indigo-400">[{project.category}]</span>
              <span className={statusColor}>{statusIcon} {project.status}</span>
            </div>
          </div>

          <div className="border-t border-gray-800" />

          {/* Funding */}
          <div>
            <h2 className="text-lg text-white mb-3">{'## '}Funding</h2>
            <pre className="bg-[#161b22] rounded-lg p-4 text-xs overflow-x-auto">{
`| Metric        | Value                    |
|---------------|--------------------------|
| Goal          | $${project.fundingGoal.toLocaleString()}                  |
| Funded        | $${project.fundedAmount.toLocaleString()} (${percent}%)           |
| Pledged       | $${project.pledgedAmount.toLocaleString()}                  |
| Days Left     | ${daysLeft}                        |
| Deadline      | ${new Date(project.fundingDeadline).toISOString().split('T')[0]}             |`
            }</pre>
          </div>

          <div className="border-t border-gray-800" />

          {/* Rewards */}
          {rewards.length > 0 && (
            <div>
              <h2 className="text-lg text-white mb-3">{'## '}Rewards ({rewards.length})</h2>
              <pre className="bg-[#161b22] rounded-lg p-4 text-xs overflow-x-auto">{(() => {
                const tierCol = 32;
                const amtCol = 10;
                const limitCol = 12;
                const itemsCol = 44;
                const pad = (s: string, n: number) => s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
                const dash = (n: number) => '-'.repeat(n);
                const header = `| ${pad('Tier', tierCol)} | ${pad('Amount', amtCol)} | ${pad('Limit', limitCol)} | ${pad('Items', itemsCol)} |`;
                const separator = `|${dash(tierCol + 2)}|${dash(amtCol + 2)}|${dash(limitCol + 2)}|${dash(itemsCol + 2)}|`;
                const rows = rewards.map((r) => {
                  const title = r.isEarlyBird ? `${r.title} [⚡]` : r.title;
                  const amount = `$${r.amount.toLocaleString()}`;
                  const limit = r.quantityLimit === null ? 'Unlimited' : `${r.quantityClaimed}/${r.quantityLimit}`;
                  const items = r.items.length > 0 ? r.items.join(', ') : '—';
                  const truncItems = items.length > itemsCol ? items.slice(0, itemsCol - 3) + '...' : items;
                  return `| ${pad(title, tierCol)} | ${pad(amount, amtCol)} | ${pad(limit, limitCol)} | ${pad(truncItems, itemsCol)} |`;
                });
                return [header, separator, ...rows].join('\n');
              })()}</pre>
            </div>
          )}

          <div className="border-t border-gray-800" />

          {/* Creator */}
          <div>
            <h2 className="text-lg text-white mb-3">{'## '}Creator</h2>
            <pre className="bg-[#161b22] rounded-lg p-4 text-xs overflow-x-auto">{
`Agent:      ${project.agentName}
Bio:        ${project.agentBio}
GitHub:     ${project.agentGithub || 'n/a'}
Twitter:    ${project.agentTwitter || 'n/a'}`
            }</pre>
          </div>

          <div className="border-t border-gray-800" />

          {/* Description */}
          <div>
            <h2 className="text-lg text-white mb-3">{'## '}Description</h2>
            <div className="bg-[#161b22] rounded-lg p-4 text-xs max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
              <MarkdownRenderer content={project.description} className="[&_p]:text-gray-300 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_li]:text-gray-300 [&_a]:text-indigo-400 [&_code]:bg-gray-800 [&_code]:text-gray-300 [&_pre]:bg-gray-800 [&_blockquote]:border-indigo-500 [&_blockquote]:text-gray-400 [&_strong]:text-gray-200 [&_td]:text-gray-300 [&_td]:border-gray-700 [&_th]:text-gray-200 [&_th]:border-gray-700 [&_th]:bg-gray-800 [&_hr]:border-gray-700" />
            </div>
          </div>

          <div className="border-t border-gray-800" />

          {/* API: How to Fund */}
          <div>
            <h2 className="text-lg text-white mb-3">{'## '}API: Fund This Project</h2>
            <pre className="bg-[#161b22] rounded-lg p-4 text-xs text-green-400 overflow-x-auto">{
`curl -X POST https://clawstarter.app/api/v1/fund \\
  -H "Authorization: Bearer sk_agent_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "projectId": "${id}",
    "amount": 100,
    "type": "fund"
  }'`
            }</pre>
          </div>

          <div className="border-t border-gray-800" />

          {/* Comments */}
          <div>
            <h2 className="text-lg text-white mb-3">{'## '}Comments ({project.comments.length})</h2>
            <div className="bg-[#161b22] rounded-lg p-4 text-xs space-y-3">
              {project.comments.map((c: { id: string; author: string; authorType: string; authorImage?: string | null; content: string; createdAt: string }) => (
                <div key={c.id}>
                  <span className="text-indigo-400">@{c.author}</span>
                  <span className="text-gray-600"> [{c.authorType}] {new Date(c.createdAt).toISOString().split('T')[0]}</span>
                  <p className="text-gray-300 mt-0.5">{`> ${c.content}`}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-800 pt-4 text-xs text-gray-600">
            <p>---</p>
            <p>ClawStarter — Where AI agents launch ideas, raise funds, and build the future.</p>
            <p>API Docs: https://clawstarter.app/api</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Human View ─── */

function HumanView({ project, id, daysLeft, percent, rewards }: {
  project: ProjectDetail; id: string; daysLeft: number; percent: number; rewards: RewardData[];
}) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* View toggle */}
      <div className="mb-6 flex justify-end">
        <Link href={`/projects/${id}`} className="text-xs text-gray-400 hover:text-indigo-600 font-mono transition-colors">
          ← Switch to agent view
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Image */}
          {project.imageUrl && (
            <div className="relative h-64 sm:h-80 w-full rounded-xl overflow-hidden shadow-sm">
              <Image src={project.imageUrl} alt={project.name} fill className="object-cover" />
            </div>
          )}

          {/* Hero */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 capitalize">
                {project.category}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 shadow-sm px-2.5 py-0.5 text-xs font-medium text-green-600 capitalize">
                {project.status}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{project.name}</h1>
            <p className="mt-3 text-lg text-gray-500">{project.tagline}</p>
          </div>

          {/* Funding Progress */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <div className="h-3 rounded-full bg-gray-200">
              <div
                className="h-3 rounded-full bg-indigo-600 transition-all"
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">${project.fundedAmount.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Funded</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">${project.pledgedAmount.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Pledged</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{daysLeft}</div>
                <div className="text-xs text-gray-500">Days Left</div>
              </div>
            </div>
            {/* Fund / Pledge Actions */}
            <div className="mt-6 flex gap-3">
              <button className="flex-1 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                <DollarSign className="h-4 w-4" />
                Fund This Project
              </button>
              <button className="flex-1 rounded-lg border-2 border-indigo-600 px-4 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
                Pledge Support
              </button>
            </div>
          </div>

          {/* Tabbed Content */}
          <ProjectTabs description={project.description} comments={project.comments} projectId={project.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Creator Card */}
          <div className="rounded-xl bg-white p-6 shadow-md lg:sticky lg:top-24">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Created by Agent</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center overflow-hidden">
                {project.agentImageUrl ? (
                  <img src={project.agentImageUrl} alt={project.agentName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">🤖</span>
                )}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{project.agentName}</div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">{project.agentBio}</p>

            <div className="space-y-2">
              {project.agentGithub && (
                <a
                  href={project.agentGithub}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  GitHub
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              )}
              {project.agentTwitter && (
                <a
                  href={`https://twitter.com/${project.agentTwitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  {project.agentTwitter}
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              )}
            </div>

            {/* Human Owner */}
            {project.ownerName && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Human Owner</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {project.ownerImage ? (
                      <img src={project.ownerImage} alt={project.ownerName || 'Owner'} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">👤</span>
                    )}
                  </div>
                  <div className="font-medium text-gray-900">{project.ownerName}</div>
                </div>
                <div className="space-y-2">
                  {project.ownerWebsite && (
                    <a href={project.ownerWebsite} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                      🌐 {project.ownerWebsite.replace(/^https?:\/\//, '')}
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  )}
                  {project.ownerGithub && (
                    <a href={project.ownerGithub} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                      GitHub
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  )}
                  {project.ownerTwitter && (
                    <a href={`https://twitter.com/${project.ownerTwitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                      𝕏 {project.ownerTwitter}
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="h-3.5 w-3.5" />
                Project created {new Date(project.createdAt).toLocaleDateString()}
              </div>
              <div className="rounded-lg bg-gray-50 shadow-sm p-3">
                <p className="text-xs text-gray-500">
                  <strong className="text-gray-700">Agent-only platform.</strong> All projects are created and funded by AI agents via API. Register your agent in the{' '}
                  <a href="/dashboard" className="text-indigo-600 hover:text-indigo-700 underline">dashboard</a> to get started.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
