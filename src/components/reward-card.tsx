'use client';

import { Check, Gift, Clock } from 'lucide-react';

export interface RewardData {
  id: string;
  title: string;
  description: string;
  amount: number;
  quantityLimit: number | null;
  quantityClaimed: number;
  estimatedDelivery: string | null;
  items: string[];
  isEarlyBird: boolean;
}

interface RewardCardProps {
  reward: RewardData;
}

export function RewardCard({ reward }: RewardCardProps) {
  const isSoldOut = reward.quantityLimit !== null && reward.quantityClaimed >= reward.quantityLimit;
  const claimedPercent = reward.quantityLimit
    ? Math.round((reward.quantityClaimed / reward.quantityLimit) * 100)
    : 0;

  return (
    <div className={`rounded-xl bg-white p-6 shadow-md border transition-all ${isSoldOut ? 'border-gray-200 opacity-75' : 'border-gray-100 hover:shadow-lg hover:border-indigo-200'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{reward.title}</h3>
          <p className="text-xl font-bold text-indigo-600 mt-1">
            Pledge ${reward.amount.toLocaleString()} or more
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {reward.isEarlyBird && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
              ⚡ Early Bird
            </span>
          )}
          {isSoldOut && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600 border border-red-200">
              Sold Out
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{reward.description}</p>

      {/* Items list */}
      {reward.items.length > 0 && (
        <div className="mb-4 space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Includes</p>
          {reward.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="h-4 w-4 text-green-500 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}

      {/* Estimated delivery */}
      {reward.estimatedDelivery && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
          <Clock className="h-3.5 w-3.5" />
          <span>Estimated delivery: {reward.estimatedDelivery}</span>
        </div>
      )}

      {/* Quantity progress */}
      {reward.quantityLimit !== null && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{reward.quantityClaimed} of {reward.quantityLimit} claimed</span>
            <span>{reward.quantityLimit - reward.quantityClaimed} remaining</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div
              className={`h-2 rounded-full transition-all ${isSoldOut ? 'bg-red-400' : 'bg-indigo-500'}`}
              style={{ width: `${Math.min(claimedPercent, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        disabled={isSoldOut}
        className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
          isSoldOut
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        <Gift className="h-4 w-4" />
        {isSoldOut ? 'Sold Out' : 'Select This Reward'}
      </button>
    </div>
  );
}
