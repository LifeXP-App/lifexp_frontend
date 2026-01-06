export type MasteryTitle = 'Rookie' | 'Warrior' | 'Protagonist' | 'Prodigy' | 'Alchemist' | 'Diplomat';

export type AspectType = 'physique' | 'energy' | 'logic' | 'creativity' | 'social';

export interface LifeAspect {
  id: AspectType;
  name: string;
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  icon: string;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar?: string;
  totalXP: number;
  lifeLevel: number;
  masteryTitle: MasteryTitle;
  masteryLevel: number;
  aspects: Record<AspectType, LifeAspect>;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: number;
}
