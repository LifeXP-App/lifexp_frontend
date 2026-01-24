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
    duration: "2:00:00",
    timestamp: "2h ago",
    category: "logic",
  },
  {
    id: "2",
    activity: "Gym workout",
    icon: "🏋️",
    duration: "2:13:00",
    timestamp: "5h ago",
    category: "physique",
  },
  {
    id: "3",
    activity: "Reading",
    icon: "📚",
    duration: "1:30:00",
    timestamp: "1d ago",
    category: "energy",
  },
  {
    id: "4",
    activity: "Team meeting",
    icon: "👥",
    duration: "00:12:00",
    timestamp: "1d ago",
    category: "social",
  },
  {
    id: "5",
    activity: "Design work",
    icon: "🎨",
    duration: "2:31:33",
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

export const mockExperiences = [
  {
    id: 1,
    title: "Practice for sem end music fest",
    description:
      "Locked in and refined the setlist. Clean transitions, tighter timing, better stage confidence.",
    xp: 120,
    image:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1/posts/user_7/ske_20251115103836",
    stats: {
      physique: 150,
      energy: 200,
      social: 100,
      creativity: 400,
      logic: 250,
    },
    timeText: "12h 30m over 3 months",
  },
  {
    id: 2,
    title: "Late night practice session",
    description:
      "Ran through the hard parts until muscle memory kicked in. Zero excuses, just reps.",
    xp: 90,
    image:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1/posts/user_7/ske_20251115103836",
    stats: {
      physique: 90,
      energy: 260,
      social: 60,
      creativity: 320,
      logic: 180,
    },
    timeText: "4h 10m this week",
  },
  {
    id: 3,
    title: "Rehearsal grind",
    description:
      "Full run-through. Fixed timing issues, improved pacing, and kept consistency high.",
    xp: 110,
    image:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1/posts/user_7/ske_20251115103836",
    stats: {
      physique: 120,
      energy: 180,
      social: 140,
      creativity: 280,
      logic: 220,
    },
    timeText: "6h 45m over 2 weeks",
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
