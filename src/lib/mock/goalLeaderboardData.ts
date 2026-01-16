// src/lib/mock/goalLeaderboardData.ts
// Mastery Title Leaderboards - based on the 5 life aspects

export type MasteryLeaderboardPlayer = {
  username: string;
  fullname: string;
  xp: number;
  rank: number;
  profile_picture: string;
};

export type MasteryType = "warrior" | "protagonist" | "prodigy" | "alchemist" | "diplomat";

export type MasteryInfo = {
  id: MasteryType;
  emoji: string;
  name: string;
  aspect: string;
  color: string;
  playerCount: number;
};

export type MasteryLeaderboardPagination = {
  current_page: number;
  total_pages: number;
  page_size: number;
  total_players: number;
};

export type MasteryLeaderboardResponse = {
  success: boolean;
  mastery: MasteryInfo;
  players: MasteryLeaderboardPlayer[];
  pagination: MasteryLeaderboardPagination;
};

export const MASTERY_PAGE_SIZE = 10;

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752396484/ie6rprusltt1m6lrwsuq.jpg";

// Available mastery types for the leaderboard
export const MASTERY_TYPES: MasteryInfo[] = [
  {
    id: "warrior",
    emoji: "🛡️",
    name: "Warrior",
    aspect: "Physique",
    color: "#8d2e2e",
    playerCount: 234,
  },
  {
    id: "protagonist",
    emoji: "🌞",
    name: "Protagonist",
    aspect: "Energy",
    color: "#c49352",
    playerCount: 189,
  },
  {
    id: "prodigy",
    emoji: "🧩",
    name: "Prodigy",
    aspect: "Logic",
    color: "#713599",
    playerCount: 312,
  },
  {
    id: "alchemist",
    emoji: "🎭",
    name: "Alchemist",
    aspect: "Creativity",
    color: "#4187a2",
    playerCount: 156,
  },
  {
    id: "diplomat",
    emoji: "🕊️",
    name: "Diplomat",
    aspect: "Social",
    color: "#31784e",
    playerCount: 201,
  },
];

// Mock players for different mastery types
const mockMasteryPlayers: Record<MasteryType, MasteryLeaderboardPlayer[]> = {
  alchemist: [
    {
      rank: 1,
      username: "mando",
      fullname: "Mando",
      xp: 79,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752338292/b86qwraynr4n0rtm5lfp.jpg",
    },
    {
      rank: 2,
      username: "mando2",
      fullname: "Mando",
      xp: 79,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752338292/b86qwraynr4n0rtm5lfp.jpg",
    },
    {
      rank: 3,
      username: "mando3",
      fullname: "Mando",
      xp: 79,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752338292/b86qwraynr4n0rtm5lfp.jpg",
    },
    {
      rank: 4,
      username: "mando4",
      fullname: "Mando",
      xp: 79,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752338292/b86qwraynr4n0rtm5lfp.jpg",
    },
    {
      rank: 5,
      username: "mando5",
      fullname: "Mando",
      xp: 79,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752338292/b86qwraynr4n0rtm5lfp.jpg",
    },
    {
      rank: 6,
      username: "mando6",
      fullname: "Mando",
      xp: 79,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752338292/b86qwraynr4n0rtm5lfp.jpg",
    },
    {
      rank: 7,
      username: "mando7",
      fullname: "Mando",
      xp: 79,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752338292/b86qwraynr4n0rtm5lfp.jpg",
    },
    {
      rank: 8,
      username: "jasonlee",
      fullname: "Jason Lee Borgov",
      xp: 69,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752398740/d87vib7aizhnbj1ywctu.jpg",
    },
    {
      rank: 9,
      username: "mando9",
      fullname: "Mando",
      xp: 79,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752338292/b86qwraynr4n0rtm5lfp.jpg",
    },
    {
      rank: 10,
      username: "mando10",
      fullname: "Mando",
      xp: 79,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752338292/b86qwraynr4n0rtm5lfp.jpg",
    },
  ],
  warrior: [
    {
      rank: 1,
      username: "fitguy",
      fullname: "Fitness Frank",
      xp: 520,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752590069/spqnbbadhb9vzihfoa0q.jpg",
    },
    {
      rank: 2,
      username: "gymrat",
      fullname: "Gym Rat Gary",
      xp: 445,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752396484/ie6rprusltt1m6lrwsuq.jpg",
    },
    {
      rank: 3,
      username: "lifter",
      fullname: "Lisa Lifter",
      xp: 380,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752607452/rdpj6ojfe0uamk73elyc.jpg",
    },
    {
      rank: 4,
      username: "runner",
      fullname: "Running Rick",
      xp: 320,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752481555/jcawkvtmyew6zl5cvb1o.jpg",
    },
    {
      rank: 5,
      username: "athlete",
      fullname: "Athletic Amy",
      xp: 290,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752416075/v4xkhnqoodnbtpvkplhw.jpg",
    },
  ],
  protagonist: [
    {
      rank: 1,
      username: "energizer",
      fullname: "Energy Emma",
      xp: 680,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752338292/b86qwraynr4n0rtm5lfp.jpg",
    },
    {
      rank: 2,
      username: "motivated",
      fullname: "Motivated Mike",
      xp: 590,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752398740/d87vib7aizhnbj1ywctu.jpg",
    },
    {
      rank: 3,
      username: "driven",
      fullname: "Driven Dan",
      xp: 485,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1755709015/ysyanmka88fuxudiuqhg.jpg",
    },
  ],
  prodigy: [
    {
      rank: 1,
      username: "coder1",
      fullname: "Code Master",
      xp: 1250,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1753126923/sb4iz7uj8ar76lvog8k0.webp",
    },
    {
      rank: 2,
      username: "thinker",
      fullname: "Thinking Tom",
      xp: 980,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752338292/b86qwraynr4n0rtm5lfp.jpg",
    },
    {
      rank: 3,
      username: "analyst",
      fullname: "Analytical Anna",
      xp: 756,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752398740/d87vib7aizhnbj1ywctu.jpg",
    },
    {
      rank: 4,
      username: "strategist",
      fullname: "Strategic Steve",
      xp: 620,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752590069/spqnbbadhb9vzihfoa0q.jpg",
    },
  ],
  diplomat: [
    {
      rank: 1,
      username: "socialstar",
      fullname: "Social Sarah",
      xp: 890,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752481555/jcawkvtmyew6zl5cvb1o.jpg",
    },
    {
      rank: 2,
      username: "connector",
      fullname: "Connecting Carl",
      xp: 756,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752416075/v4xkhnqoodnbtpvkplhw.jpg",
    },
    {
      rank: 3,
      username: "networker",
      fullname: "Networking Nancy",
      xp: 645,
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752607452/rdpj6ojfe0uamk73elyc.jpg",
    },
  ],
};

// Get mastery by ID
export function getMasteryById(masteryId: string): MasteryInfo | undefined {
  return MASTERY_TYPES.find((m) => m.id === masteryId);
}

// Get players for a specific mastery type with pagination and search
export function getMasteryLeaderboard({
  masteryId,
  page = 1,
  pageSize = MASTERY_PAGE_SIZE,
  search = "",
}: {
  masteryId: string;
  page?: number;
  pageSize?: number;
  search?: string;
}): MasteryLeaderboardResponse {
  const mastery = getMasteryById(masteryId);

  if (!mastery) {
    return {
      success: false,
      mastery: { id: "warrior", emoji: "", name: "Unknown", aspect: "", color: "#000", playerCount: 0 },
      players: [],
      pagination: {
        current_page: 1,
        total_pages: 1,
        page_size: pageSize,
        total_players: 0,
      },
    };
  }

  let players = mockMasteryPlayers[mastery.id] || [];

  // Apply search filter
  if (search.trim()) {
    const searchLower = search.toLowerCase();
    players = players.filter(
      (p) =>
        p.fullname.toLowerCase().includes(searchLower) ||
        p.username.toLowerCase().includes(searchLower)
    );
  }

  // Sort by XP and reassign ranks
  const sorted = [...players]
    .sort((a, b) => b.xp - a.xp)
    .map((p, i) => ({
      ...p,
      rank: i + 1,
      profile_picture: p.profile_picture || DEFAULT_AVATAR,
    }));

  const totalPlayers = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalPlayers / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;

  return {
    success: true,
    mastery,
    players: sorted.slice(start, end),
    pagination: {
      current_page: safePage,
      total_pages: totalPages,
      page_size: pageSize,
      total_players: totalPlayers,
    },
  };
}

// Get total pages for a mastery type
export function getMasteryTotalPages(masteryId: string): number {
  const mastery = getMasteryById(masteryId);
  if (!mastery) return 1;
  const players = mockMasteryPlayers[mastery.id] || [];
  return Math.max(1, Math.ceil(players.length / MASTERY_PAGE_SIZE));
}

// Legacy exports for backwards compatibility
export type GoalLeaderboardPlayer = MasteryLeaderboardPlayer;
export type GoalInfo = MasteryInfo;
export type GoalLeaderboardResponse = MasteryLeaderboardResponse;
export const AVAILABLE_GOALS = MASTERY_TYPES;
export const GOAL_PAGE_SIZE = MASTERY_PAGE_SIZE;
export const getGoalById = getMasteryById;
export const getGoalLeaderboard = getMasteryLeaderboard;
