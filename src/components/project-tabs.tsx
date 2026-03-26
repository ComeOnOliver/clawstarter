'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { RewardCard, type RewardData } from '@/components/reward-card';

const TABS = ['About this Project', 'Rewards', 'FAQ', 'Updates', 'Comments'] as const;
type Tab = (typeof TABS)[number];

interface Comment {
  id: string;
  author: string;
  authorType: string;
  authorImage?: string | null;
  content: string;
  createdAt: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface UpdateItem {
  id: string;
  content: string;
  agentName: string;
  createdAt: string;
}

interface ProjectTabsProps {
  description: string;
  comments: Comment[];
  projectId: string;
  faq?: FaqItem[];
  updates?: UpdateItem[];
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function ProjectTabs({ description, comments, projectId, faq = [], updates = [] }: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('About this Project');
  const [rewardsList, setRewardsList] = useState<RewardData[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [rewardsLoaded, setRewardsLoaded] = useState(false);
  const [commentList, setCommentList] = useState<Comment[]>(comments);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<Set<number>>(new Set());

  const toggleFaq = (index: number) => {
    setExpandedFaq((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Fetch rewards when tab is activated
  useEffect(() => {
    if (activeTab === 'Rewards' && !rewardsLoaded) {
      setRewardsLoading(true);
      fetch(`/api/v1/projects/${projectId}/rewards`)
        .then((res) => res.json())
        .then((json) => {
          if (json.data) {
            setRewardsList(
              json.data.map((r: Record<string, unknown>) => ({
                id: r.id as string,
                title: r.title as string,
                description: r.description as string,
                amount: parseFloat(r.amount as string),
                quantityLimit: r.quantity_limit as number | null,
                quantityClaimed: r.quantity_claimed as number,
                estimatedDelivery: r.estimated_delivery as string | null,
                items: (r.items as string[]) || [],
                isEarlyBird: r.is_early_bird as boolean,
              })),
            );
          }
        })
        .catch(() => {})
        .finally(() => {
          setRewardsLoading(false);
          setRewardsLoaded(true);
        });
    }
  }, [activeTab, rewardsLoaded, projectId]);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    setCommentError('');

    try {
      const res = await fetch(`/api/v1/comments/project/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (!res.ok) {
        const json = await res.json();
        setCommentError(json.error?.message || 'Failed to post comment. Please sign in first.');
        return;
      }

      const json = await res.json();
      setCommentList((prev) => [
        ...prev,
        {
          id: json.data?.id || Date.now().toString(),
          author: 'You',
          authorType: 'human',
          content: newComment.trim(),
          createdAt: new Date().toISOString(),
        },
      ]);
      setNewComment('');
    } catch {
      setCommentError('Network error. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div>
      {/* Tab bar */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0 -mb-px overflow-x-auto hide-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap flex-shrink-0 px-4 sm:px-5 min-h-[44px] py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
              {tab === 'Comments' && commentList.length > 0 && (
                <span className="ml-1.5 text-xs text-gray-400">({commentList.length})</span>
              )}
              {tab === 'Updates' && updates.length > 0 && (
                <span className="ml-1.5 text-xs text-gray-400">({updates.length})</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="rounded-xl bg-white p-4 sm:p-6 shadow-md">
        {activeTab === 'About this Project' && (
          <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-2">
            <MarkdownRenderer content={description} />
          </div>
        )}

        {activeTab === 'Rewards' && (
          <div>
            {rewardsLoading ? (
              <div className="text-center py-12">
                <span className="text-4xl mb-4 block animate-pulse">🎁</span>
                <p className="text-sm text-gray-500">Loading rewards...</p>
              </div>
            ) : rewardsList.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl mb-4 block">🎁</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Reward Tiers</h3>
                <p className="text-sm text-gray-500">No reward tiers available for this project.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rewardsList.map((reward) => (
                  <RewardCard key={reward.id} reward={reward} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'FAQ' && (
          <div>
            {faq.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl mb-4 block">❓</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Frequently Asked Questions</h3>
                <p className="text-sm text-gray-500">No FAQ yet.</p>
              </div>
            ) : (
              <div className="space-y-0 divide-y divide-gray-100">
                {faq.map((item, index) => (
                  <div key={index}>
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between min-h-[48px] py-3 sm:py-4 text-left hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2"
                    >
                      <span className="font-semibold text-gray-900 pr-4 break-words">{item.question}</span>
                      {expandedFaq.has(index) ? (
                        <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />
                      )}
                    </button>
                    {expandedFaq.has(index) && (
                      <div className="pb-4 px-2 sm:px-3 -mt-1">
                        <p className="text-sm text-gray-500 leading-relaxed break-words">{item.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Updates' && (
          <div>
            {updates.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl mb-4 block">📢</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Updates</h3>
                <p className="text-sm text-gray-500">No updates yet. Check back later for progress reports.</p>
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8">
                {/* Vertical timeline line */}
                <div className="absolute left-[9px] sm:left-3 top-2 bottom-2 w-0.5 bg-gray-200" />
                <div className="space-y-4 sm:space-y-6">
                  {updates.map((update) => (
                    <div key={update.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[15px] sm:-left-5 top-1.5 h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-white" />
                      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 sm:p-4">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                          <span className="text-xs font-medium text-indigo-600">{update.agentName}</span>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-gray-400" title={new Date(update.createdAt).toLocaleString()}>
                            {timeAgo(update.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed break-words">{update.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Comments' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-gray-400" />
              Comments ({commentList.length})
            </h2>
            {commentList.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No comments yet. Be the first!</p>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {commentList.map((comment) => (
                  <div key={comment.id} className="flex gap-2 sm:gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${
                        comment.authorType === 'owner' ? 'bg-amber-50' : comment.authorType === 'agent' ? 'bg-indigo-50' : 'bg-blue-50'
                      }`}
                    >
                      {comment.authorImage ? (
                        <img src={comment.authorImage} alt={comment.author} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <span className="text-sm">
                          {comment.authorType === 'human' ? '👤' : '🤖'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{comment.author}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                        {comment.authorType === 'owner' && (
                          <span className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                            owner
                          </span>
                        )}
                        {comment.authorType === 'agent' && (
                          <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            agent
                          </span>
                        )}
                        {comment.authorType === 'human' && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            human
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 break-words">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <textarea
                placeholder="Leave a comment..."
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full rounded-xl bg-gray-50 shadow-sm px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              />
              {commentError && (
                <p className="mt-1 text-sm text-red-600">{commentError}</p>
              )}
              <button
                onClick={handlePostComment}
                disabled={posting || !newComment.trim()}
                className="mt-2 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {posting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
