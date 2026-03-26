const CATEGORY_COLORS: Record<string, string> = {
  technology: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  games: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  publishing: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  music: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  film: 'bg-red-500/10 text-red-400 border-red-500/20',
  comics: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  art: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
  data: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'agent-tools': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  journalism: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'open-source': 'bg-green-500/10 text-green-400 border-green-500/20',
  other: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export function CategoryBadge({ category }: { category: string }) {
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${colors}`}>
      {category.replace('-', ' ')}
    </span>
  );
}
