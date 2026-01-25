"use client";

import { useEffect, useMemo, useState } from "react";
import { Post } from "@/src/components/homepage/Post";
import { UserStatus } from "@/src/components/homepage/UserStatus";
import { RightSidebarInfo } from "@/src/components/homepage/RightSidebarInfo";
import { RightSidebarNotifications } from "@/src/components/homepage/RightSidebarNotifications";
import { DiscoverUsers } from "@/src/components/homepage/DiscoverUsers";
import { useAuth } from "@/src/context/AuthContext";

/* ---------- MOCK DATA (keep your existing stuff) ---------- */


/* ---------- POSTS ---------- */
type SuggestedUser = {
  username: string;
  fullname: string;
  profile_picture: string;
  lifelevel: number;
};
const postsData = [
  {
    id: 1,
    uid: "danniesaurr",
    username: "danniesaurr",
    fullname: "Dannie",
    profile_picture:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_80,h_80,c_thumb/v1755709015/ysyanmka88fuxudiuqhg.jpg",
    created_at: "2025-01-07T10:30:00Z",
    started_at: "2025-01-07T08:00:00Z",
    title: "Drawing my character",
    content: "Did a focused character sketching session.",
    post_image:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1/posts/user_7/Pre_20250820170609",
    duration: "45 min",
    likes: 12,
    masterytitle: "Rookie",
    primary: "#4069e3",
    own_post: false,
    user_liked: false,
    xp_data: {
      physique: 0,
      energy: 20,
      social: 0,
      creativity: 50,
      logic: 20,
    },
    session: {
      number: 1,
      total_sessions: 5,
      session_post_image_url:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1/posts/user_7/Tir_20250821103509",
      activity: {
        name: "Drawing",
        type: "creativity",
        emoji: "🎨",
      },
      duration: "2:30:21",
      xp_gained: 100,
      dateTime: "2025-01-07T10:30:00Z",
    },
    comments: [
      {
        id: 1,
        username: "yucey",
        fullname: "Yucey",
        profile_picture:
          "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_80,h_80,c_thumb/v1752327292/lfco9m4hqq9yin7adl6e.jpg",
        created_at: "2025-01-07T11:00:00Z",
        comment: "Awesome sketch! Keep it up!",
      },
      {
        id: 2,
        username: "patty",
        fullname: "Patrick Schwarz",
        profile_picture:
          "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_80,h_80,c_thumb/v1752327292/lfco9m4hqq9yin7adl6e.jpg",
        created_at: "2025-01-07T11:15:00Z",
        comment: "Love the details in the character design.",
      },
    ],
  },
  {
    id: 2,
    uid: "danniesaurr",
    username: "danniesaurr",
    fullname: "Dannie",
    profile_picture:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_80,h_80,c_thumb/v1755709015/ysyanmka88fuxudiuqhg.jpg",
    created_at: "2025-01-07T10:30:00Z",
    started_at: "2025-01-07T08:00:00Z",
    title: "Drawing my character",
    content: "Did a focused character sketching session.",
    post_image:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1/posts/user_7/Pre_20250820170609",
    duration: "45 min",
    likes: 12,
    masterytitle: "Rookie",
    primary: "#4069e3",
    own_post: false,
    user_liked: false,
    xp_data: {
      physique: 0,
      energy: 20,
      social: 0,
      creativity: 50,
      logic: 20,
    },
    session: {
      number: 1,
      total_sessions: 5,
      session_post_image_url:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1/posts/user_7/Tir_20250821103509",
      activity: {
        name: "Drawing",
        type: "creativity",
        emoji: "🎨",
      },
      duration: "2:30:21",
      xp_gained: 100,
      dateTime: "2025-01-07T10:30:00Z",
    },
    comments: [
      {
        id: 1,
        username: "yucey",
        fullname: "Yucey",
        profile_picture:
          "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_80,h_80,c_thumb/v1752327292/lfco9m4hqq9yin7adl6e.jpg",
        created_at: "2025-01-07T11:00:00Z",
        comment: "Awesome sketch! Keep it up!",
      },
      {
        id: 2,
        username: "patty",
        fullname: "Patrick Schwarz",
        profile_picture:
          "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_80,h_80,c_thumb/v1752327292/lfco9m4hqq9yin7adl6e.jpg",
        created_at: "2025-01-07T11:15:00Z",
        comment: "Love the details in the character design.",
      },
    ],
  },
];

/* ---------- TYPES ---------- */
type UserApiResponse = {
  id: number;
  fullname: string;
  username: string;
  title: string;
  bio: string;
  avatar: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  totalXP: number;
  xp_to_next_life_level: number;
  xp_to_next_master_level: number;
  nextLevelXP: number;
  lifeLevel: number;
  masteryTitle: string;
  masteryLevel: number;
  visibility: "public" | "private";
  isFollowing: boolean;
  aspects: any;
};

/* ---------- SKELETONS ---------- */

function UserStatusSkeleton() {
  return (
    <div className="mb-8 pl-2 md:pl-0 flex gap-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
      <div className="bg-white dark:bg-dark-2 border-2 border-gray-200 dark:border-gray-900 flex p-3 rounded-xl gap-3 min-w-[200px] max-w-[250px] items-center flex-shrink-0 animate-pulse">
        <div className="p-[1.5px] rounded-full h-14 w-14 aspect-square bg-gray-200 dark:bg-gray-800" />

        <div className="flex flex-col justify-between w-full">
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800 mb-2" />
          <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-800 mb-2" />

          <div className="flex items-center gap-2">
            <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

function RightSidebarInfoSkeleton() {
  return (
    <aside className="w-full hidden md:block">
      {/* PROFILE CARD */}
      <div className="bg-white p-6 mb-4 rounded-xl border-2 border-gray-200 dark:bg-dark-2 dark:border-gray-900 animate-pulse">
        <div className="text-center flex flex-col items-center">
          {/* avatar */}
          <div className="h-24 w-24 aspect-square p-[1.5px] rounded-full bg-gray-200 dark:bg-gray-800 mb-3" />

          {/* fullname */}
          <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-800 mb-3" />

          {/* mastery row */}
          <span className="flex gap-2 justify-center items-center">
            <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-800" />
            <span className="w-4" />
          </span>
        </div>

        {/* STATS */}
        <div className="mt-4 flex justify-between text-sm">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <div className="h-4 w-6 mx-auto rounded bg-gray-200 dark:bg-gray-800 mb-2" />
              <div className="h-3 w-14 mx-auto rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          ))}
        </div>

        {/* XP BAR */}
        <div className="w-full relative rounded-full h-4 my-4 ml-1 overflow-hidden bg-gray-200 dark:bg-gray-800">
          <div className="h-6 w-[55%] bg-gray-300 dark:bg-gray-700" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-20 rounded bg-gray-300/80 dark:bg-gray-700/70" />
          </div>
        </div>

        {/* XP + STREAK */}
        <div className="mt-4 flex justify-between text-sm gap-4">
          <div className="bg-gray-100 w-full flex flex-col rounded-md items-center justify-between p-4 dark:bg-gray-900 dark:bg-opacity-50">
            <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-800 mb-2" />
            <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-800" />
          </div>

          <div className="bg-gray-100 w-full hidden md:flex flex-col rounded-md items-center justify-between p-4 dark:bg-gray-900 dark:bg-opacity-50">
            <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-800 mb-2" />
            <div className="flex gap-2 items-center">
              <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-5 w-8 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        </div>
      </div>

      {/* NEXT LEVEL TAB CARD */}
      <div
        id="next-level-tab"
        className="bg-white p-6 mb-4 rounded-xl border-2 border-gray-200 dark:bg-dark-2 dark:border-gray-900 animate-pulse"
      >
        <div className="flex justify-between mb-6">
          <div className="h-4 w-44 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-800" />
        </div>

        <div className="w-full flex gap-1 items-center">
          <div className="w-full rounded-full h-2.5 ml-1 bg-gray-200 dark:bg-gray-800 overflow-hidden">
            <div className="h-2.5 w-[12%] rounded-full bg-gray-300 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    </aside>
  );
}

function RightSidebarNotificationsSkeleton() {
  return (
    <div className="bg-white w-full p-6 mb-4 rounded-xl border-2 border-gray-200 dark:bg-dark-2 dark:border-gray-900 animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-800" />
      </div>

      <div className="max-h-80 overflow-y-auto">
        <ul className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <li key={i}>
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-md bg-gray-200 dark:bg-gray-800" />
                <div className="flex flex-col w-full">
                  <div className="h-3 w-40 rounded bg-gray-200 dark:bg-gray-800 mb-2" />
                  <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DiscoverUsersSkeleton() {
  return (
    <div className="bg-white dark:bg-dark-3 p-6 mb-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="h-4 w-44 rounded bg-gray-200 dark:bg-gray-800 mb-4" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="flex-1">
              <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-800 mb-2" />
              <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- HOME ---------- */

export default function Home() {
  const [posts, setPosts] = useState<typeof postsData>([]);
  const { me, loading } = useAuth();

  const [userData, setUserData] = useState<UserApiResponse | null>(null);
  const [userLoading, setUserLoading] = useState(false);

  type ApiNotification = {
    id: number | string;
    recipient: number;
    sender: any;
    notification_type: string;
    message: string;
    related_object_id: number | null;
    created_at: string;
    is_read: boolean;
    link: string | null;
    post_uid: string | null;
    image?: string | null;
  };

  const [notificationsData, setNotificationsData] = useState<
    {
      id: string;
      image: string;
      sender: string;
      text: string;
      date: string;
      href: string;
      rounded?: boolean;
    }[]
  >([]);

  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      setNotificationsLoading(true);

      try {
        const res = await fetch("/api/notifications", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          setNotificationsData([]);
          setUnreadCount(0);
          return;
        }

        const raw = await res.json();

        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.notifications)
          ? raw.notifications
          : Array.isArray(raw?.results)
          ? raw.results
          : [];

        const mapped = list.map((n: ApiNotification) => ({
          id: String(n.id),
          image: n.image || "",
          text: n.message || "",
          sender: n.sender?.username || " ",
          date: new Date(n.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }),
          href: n.link || "/",
          rounded: n.notification_type === "follow",
        }));

        console.log("Fetched notifications:", mapped);
        setNotificationsData(mapped);
        setUnreadCount(list.filter((n: ApiNotification) => !n.is_read).length);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
        setNotificationsData([]);
        setUnreadCount(0);
      } finally {
        setNotificationsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Posts (your existing behavior)
  useEffect(() => {
    setPosts(postsData);
  }, []);

  // ✅ Fetch user profile ONCE when we have username
  useEffect(() => {
    const fetchUser = async () => {
      if (!me?.username) return;

      setUserLoading(true);

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!baseUrl) return;

        const res = await fetch(`${baseUrl}/api/v1/users/${me.username}/`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!res.ok) {
          setUserData(null);
          return;
        }

        const data = await res.json();
        setUserData(data);
      } catch (err) {
        console.error("Failed to fetch homepage user:", err);
        setUserData(null);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, [me?.username]);

  const showUserSkeleton = loading || userLoading || !me?.username || !userData;

  // ✅ only build once data exists
  const player = useMemo(() => {
    if (!userData) return null;

    return {
      username: userData.username,
      fullname: userData.fullname,
      lifelevel: userData.lifeLevel,
      streak_count: 0,
      streak_active: false,
      masterytitle: userData.masteryTitle,
      primary_accent_color: "#4168e2",
      profile_picture:
        userData.avatar ||
        "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_80,h_80,c_thumb/v1752327292/lfco9m4hqq9yin7adl6e.jpg",
    };
  }, [userData]);

  // ✅ FIXED: include nextLevelXp + correct required field names
  const sidebarUser = useMemo(() => {
    if (!userData || !player) return null;

    const nextLevelXp =
      typeof userData.nextLevelXP === "number"
        ? userData.nextLevelXP
        : typeof userData.xp_to_next_life_level === "number"
        ? userData.xp_to_next_life_level
        : 0;

    const progressPercent =
      nextLevelXp > 0 ? Math.min(100, (userData.totalXP / nextLevelXp) * 100) : 0;

    return {
      username: userData.username,
      fullname: userData.fullname,
      profile_picture: userData.avatar || player.profile_picture,
      mastery: userData.masteryTitle,
      masteryColor: "#4168e2",
      lifelevel: userData.lifeLevel,
      posts: userData.posts_count,
      followers: userData.followers_count,
      following: userData.following_count,
      totalXp: userData.totalXP,
      xpToNextLifeLevel: userData.xp_to_next_life_level,
      xpToNextMasteryLevel: userData.xp_to_next_master_level,
      nextLevelXp: nextLevelXp,
      progressPercent: progressPercent,
      rank: 0,
      streak: 0,
      streak_active: false,
    };
  }, [userData, player]);


  type DiscoverUserApi = {
  id: number;
  username: string;
  fullname: string;
  bio: string;
  mastery_title: string;
  life_level: number;
  master_level: number;
  totalxp: number;
  primary_color: string;
  secondary_color: string;
  post_count: number;
  follower_count: number;
  is_following: boolean;
};

const [discoverUsers, setDiscoverUsers] = useState<SuggestedUser[]>([]);
const [discoverLoading, setDiscoverLoading] = useState(false);

useEffect(() => {
  const fetchDiscoverUsers = async () => {
    setDiscoverLoading(true);

    try {
      const res = await fetch("/api/discover/users", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        setDiscoverUsers([]);
        return;
      }

      const data = await res.json();

      const list = Array.isArray(data?.users) ? data.users : [];

      const mapped = list.map((u: any) => ({
        username: u.username,
        fullname: u.fullname,
        profile_picture:
          u.profile_picture ||
          "https://res.cloudinary.com/dfohn9dcz/image/upload/Screenshot_2025-03-25_at_10.40.01_PM_vugdxk",
        lifelevel: u.life_level,
      }));

      setDiscoverUsers(mapped);
    } catch (err) {
      console.error("Failed to fetch discover users:", err);
      setDiscoverUsers([]);
    } finally {
      setDiscoverLoading(false);
    }
  };

  fetchDiscoverUsers();
}, []);


  return (
    <div className="flex w-full">
      {/* CENTER FEED */}
      <main className="flex-1 md:w-[90%] lg:w-[60%] mx-auto md:px-5 overflow-hidden">
        <div
          id="content"
          className="flex-1 min-h-[100vh] pb-16 md:pb-6 py-2 md:py-6 md:px-4 sm:px-6 overflow-y-auto scrollbar-hide h-screen"
        >
          {/* TOP BAR */}
          {showUserSkeleton ? (
            <UserStatusSkeleton />
          ) : (
            player && <UserStatus player={player} />
          )}

          {/* POSTS */}
          <div
            id="posts-container"
            className="overflow-hidden scrollbar-hide transition-opacity duration-300"
          >
            {posts.map((post) => (
              <Post key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR */}
      <div className="hidden xl:flex flex-col w-[400px] p-6 scrollbar-hide overflow-y-auto h-screen">
  

            {sidebarUser ? <RightSidebarInfo user={sidebarUser} /> : <RightSidebarInfoSkeleton />}
           
           
            {notificationsLoading ? (
              <RightSidebarNotificationsSkeleton />
            ) : (
              <RightSidebarNotifications
                notifications={notificationsData}
                unreadCount={unreadCount}
              />
            )}


            {discoverLoading ? (
              <DiscoverUsersSkeleton />
            ) : (
              <DiscoverUsers suggestedUsers={discoverUsers} />
            )}

         
      </div>
    </div>
  );
}
