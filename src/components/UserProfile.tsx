'use client';

import { UserProfile as UserProfileType } from '../lib/types';
import { MASTERY_COLORS } from '../lib/constants/aspects';
import { User } from 'lucide-react';

interface UserProfileProps {
  user: UserProfileType;
}

export function UserProfile({ user }: UserProfileProps) {
  const masteryColor = MASTERY_COLORS[user.masteryTitle].primary;

  return (
    <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">
            {user.username}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-medium" style={{ color: masteryColor }}>
              {user.masteryTitle} {user.masteryLevel > 0 && toRoman(user.masteryLevel)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Level {user.lifeLevel}</span>
          <span className="font-medium">{user.totalXP.toLocaleString()} XP</span>
        </div>
      </div>
    </div>
  );
}

function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let result = '';
  for (const [value, numeral] of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}
