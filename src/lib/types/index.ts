export type MasteryTitle =
  | "Rookie"
  | "Warrior"
  | "Protagonist"
  | "Prodigy"
  | "Alchemist"
  | "Diplomat";

export type AspectType =
  | "physique"
  | "energy"
  | "logic"
  | "creativity"
  | "social";

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
  fullname: string;
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

export interface Activity {
  id: string;
  name: string;
  icon: string;
  duration: string;
  category: AspectType;
}

export interface Session {
  id: string;
  activity: string;
  icon: string;
  duration: string;
  timestamp: string;
  category: AspectType;
}

export interface Goal {
  id: string;
  name: string;
  category: AspectType;
}

export interface Experience {
  id: string;
  title: string;
  image: string;
  description?: string;
}
