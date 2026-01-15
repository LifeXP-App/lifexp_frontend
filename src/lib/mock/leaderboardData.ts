// src/lib/mock/leaderboardData.ts

export type LeaderboardPlayer = {
  username: string;
  fullname: string;
  xp: number;
  rank: number;
  profile_picture: string;
};

export type LeaderboardPagination = {
  current_page: number;
  total_pages: number;
  page_size: number;
  total_players: number;
};

export type RookieLeaderboardResponse = {
  success: boolean;
  players: LeaderboardPlayer[];
  pagination: LeaderboardPagination;
};

export const ROOKIE_PAGE_SIZE = 10;

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752396484/ie6rprusltt1m6lrwsuq.jpg";

export const mockRookiePlayers: LeaderboardPlayer[] = [
  {
    rank: 1,
    username: "danniesaurrr",
    fullname: "Dans",
    xp: 3576,
    profile_picture:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752338292/b86qwraynr4n0rtm5lfp.jpg",
  },
  {
    rank: 2,
    username: "jason",
    fullname: "Jason",
    xp: 2300,
    profile_picture:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752398740/d87vib7aizhnbj1ywctu.jpg",
  },
  {
    rank: 3,
    username: "galacticpigeon",
    fullname: "GalacticPigeon",
    xp: 1746,
    profile_picture:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/v1755709015/ysyanmka88fuxudiuqhg.jpg",
  },
  {
    rank: 4,
    username: "pat",
    fullname: "Patty",
    xp: 972,
    profile_picture:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752327292/lfco9m4hqq9yin7adl6e.jpg",
  },
  {
    rank: 5,
    username: "yucername",
    fullname: "Yuce",
    xp: 662,
    profile_picture:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752590069/spqnbbadhb9vzihfoa0q.jpg",
  },
  {
    rank: 6,
    username: "shuhei",
    fullname: "Shu",
    xp: 440,
    profile_picture:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752396484/ie6rprusltt1m6lrwsuq.jpg",
  },
  {
    rank: 7,
    username: "sebastiang",
    fullname: "Sebastian G",
    xp: 300,
    profile_picture:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752607452/rdpj6ojfe0uamk73elyc.jpg",
  },
  {
    rank: 8,
    username: "halofie",
    fullname: "Halofie",
    xp: 230,
    profile_picture:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752481555/jcawkvtmyew6zl5cvb1o.jpg",
  },
  {
    rank: 9,
    username: "pilotyt",
    fullname: "Pilot",
    xp: 210,
    profile_picture:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752416075/v4xkhnqoodnbtpvkplhw.jpg",
  },
  {
    rank: 10,
    username: "akhil",
    fullname: "akhil",
    xp: 180,
    profile_picture:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/v1753126923/sb4iz7uj8ar76lvog8k0.webp",
  },
];

// ✅ Returns paginated rookies (sorted high XP -> low XP)
// page is 1-indexed
export function getMockRookieLeaderboardPage({
  page = 1,
  pageSize = ROOKIE_PAGE_SIZE,
}: {
  page?: number;
  pageSize?: number;
}): RookieLeaderboardResponse {
  const sorted = [...mockRookiePlayers]
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
    players: sorted.slice(start, end),
    pagination: {
      current_page: safePage,
      total_pages: totalPages,
      page_size: pageSize,
      total_players: totalPlayers,
    },
  };
}

// ✅ Convenience export (optional but nice)
export const ROOKIE_TOTAL_PAGES = Math.max(
  1,
  Math.ceil(mockRookiePlayers.length / ROOKIE_PAGE_SIZE)
);

export const ROOKIE_LEADERBOARD_PLAYERS = mockRookiePlayers;