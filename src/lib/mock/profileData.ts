import { Activity, Experience, Goal, Session } from "../types";

export const mockActivities: Activity[] = [
  {
    id: "1",
    name: "Coding",
    icon: "💻",
    duration: "10h",
    category: "logic",
  },
  {
    id: "2",
    name: "Chess",
    icon: "🗡️",
    duration: "1h",
    category: "logic",
  },
  {
    id: "3",
    name: "Studying",
    icon: "💪",
    duration: "6h",
    category: "energy",
  },
  {
    id: "4",
    name: "App designing",
    icon: "📱",
    duration: "2h",
    category: "creativity",
  },
  {
    id: "5",
    name: "Software architecting",
    icon: "🔧",
    duration: "2h",
    category: "logic",
  },
];

export const mockSessions: Session[] = [
  {
    id: "1",
    activity: "Coding",
    icon: "💻",
    duration: "2h",
    timestamp: "2h ago",
    category: "logic",
  },
  {
    id: "2",
    activity: "Gym workout",
    icon: "🏋️",
    duration: "1h",
    timestamp: "5h ago",
    category: "physique",
  },
  {
    id: "3",
    activity: "Reading",
    icon: "📚",
    duration: "45min",
    timestamp: "1d ago",
    category: "energy",
  },
  {
    id: "4",
    activity: "Team meeting",
    icon: "👥",
    duration: "30min",
    timestamp: "1d ago",
    category: "social",
  },
  {
    id: "5",
    activity: "Design work",
    icon: "🎨",
    duration: "3h",
    timestamp: "2d ago",
    category: "creativity",
  },
];

export const mockGoals: Goal[] = [
  {
    id: "1",
    emoji: "📘",
    name: "Master React",
    category: "logic",
  },
  {
    id: "2",
    emoji: "🏃",
    name: "Run Marathon",
    category: "physique",
  },
  {
    id: "3",
    emoji: "🎨",
    name: "Drawing",
    category: "creativity",
  },

];

export const mockExperiences: Experience[] = [
  {
    id: "1",
    title: "Joined LifeXP",
    image:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/v1/posts/user_4/Dra_20250718123716",
    description: "on the path to become an Alchemist",
  },
  {
    id: "2",
    title: "First Code Accepted",
    image:
 "https://res.cloudinary.com/dfohn9dcz/image/upload/v1/posts/user_4/Dra_20250718123716",
    description: "LeetCode submission accepted",
  },
  {
    id: "3",
    title: "Brain Training",
    image:
 "https://res.cloudinary.com/dfohn9dcz/image/upload/v1/posts/user_4/Dra_20250718123716",
    description: "Logic aspect milestone",
  },
  {
    id: "4",
    title: "Research Paper",
    image:
 "https://res.cloudinary.com/dfohn9dcz/image/upload/v1/posts/user_4/Dra_20250718123716",
    description: "Published academic research",
  },
  {
    id: "5",
    title: "Unsupervised Learning",
    image:
 "https://res.cloudinary.com/dfohn9dcz/image/upload/v1/posts/user_4/Dra_20250718123716",
    description: "Completed ML course",
  },
  {
    id: "6",
    title: "Code Challenge",
    image:
       "https://res.cloudinary.com/dfohn9dcz/image/upload/v1/posts/user_4/Dra_20250718123716",
    description: "Won coding competition",
  },
];

export const mockProfileStats = {
  posts: 8,
  followers: 6,
  following: 5,
  bio: "Founder @LifeXP",
  tagline: "eat sleep code 💻",
  streakCount: 0,
  memberSince: "July 12, 2025",
  lifeLevel: 6,
  currentXP: 2300,
  xpToMastery: 10000,
};

export const mockWeeklyXP = [
  { date: "Jan 1", xp: 0 },
  { date: "Jan 2", xp: 20 },
  { date: "Jan 3", xp: 0 },
  { date: "Jan 4", xp: 0 },
  { date: "Jan 5", xp: 10 },
  { date: "Jan 6", xp: 0 },
  { date: "Today", xp: 30 },
];
