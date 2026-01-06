'use client';

import { LifeAspect } from '../lib/types';
import { ASPECT_COLORS } from '../lib/constants/aspects';

interface AspectProgressBarProps {
  aspect: LifeAspect;
}

export function AspectProgressBar({ aspect }: AspectProgressBarProps) {
  const percentage = Math.min((aspect.currentXP / aspect.xpToNextLevel) * 100, 100);
  const color = ASPECT_COLORS[aspect.id].primary;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium flex items-center gap-1.5">
          <span>{aspect.icon}</span>
          <span>{aspect.name}</span>
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          Lv {aspect.level}
        </span>
      </div>

      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500 ease-out rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{aspect.currentXP.toLocaleString()} / {aspect.xpToNextLevel.toLocaleString()} XP</span>
        <span>{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
}
