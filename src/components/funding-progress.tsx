interface FundingProgressProps {
  funded: number;
  goal: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function FundingProgress({ funded, goal, size = 'md', showLabel = true }: FundingProgressProps) {
  const percentage = Math.min((funded / goal) * 100, 100);
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

  return (
    <div className="w-full">
      <div className={`w-full rounded-full bg-white/5 overflow-hidden ${heights[size]}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-blue animate-progress transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1.5 text-xs">
          <span className="text-gray-400">
            <span className="text-white font-medium">${funded.toLocaleString()}</span> raised
          </span>
          <span className="text-gray-500">${goal.toLocaleString()} goal</span>
        </div>
      )}
    </div>
  );
}
