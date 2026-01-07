"use client";

import { useEffect, useState } from "react";
import { Post } from "@/src/components/homepage/Post";
import { UserStatus } from "@/src/components/homepage/UserStatus";
import { RightSidebarInfo } from "@/src/components/homepage/RightSidebarInfo";
import { RightSidebarNotifications } from "@/src/components/homepage/RightSidebarNotifications";
import { DiscoverUsers } from "@/src/components/homepage/DiscoverUsers";
/* ---------- MOCK DJANGO DATA ---------- */

const player = {
  username: "patty",
  fullname: "Patrick Schwarz",
  lifelevel: 12,
  streak_count: 5,
  streak_active: true,
  masterytitle: "Prodigy",
  primary_accent_color: "#713599",
  profile_picture:
    "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_80,h_80,c_thumb/v1752327292/lfco9m4hqq9yin7adl6e.jpg",
};


const sidebarUser = {

  username: "patty",
  fullname: "Patty",
  profile_picture: player.profile_picture,
  mastery: "Rookie",
  masteryColor: "#4168e2",
  lifelevel: 4,
  posts: 9,
  followers: 11,
  following: 45,
  totalXp: 972,
  nextLevelXp: 1250,
  progressPercent: 77.76,
  rank: 4,
  streak: 0,
};

const notifications = [
  {
    id: "1",
    image:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/v1/posts/user_4/Fix_20251104092005",
    text: "<strong>yucey</strong> liked your post",
    date: "Nov 04, 2025",
    href: "/post/?v=5dad1c16af24482fbbd935",
    rounded: false,
  },
];

const suggestedUsers = [
  {
    username: "yunz",
    fullname: "Yunz",
    profile_picture:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/Screenshot_2025-03-25_at_10.40.01_PM_vugdxk",
    lifelevel: 1,
  },
  {
    username: "yunz2",
    fullname: "Yunz",
    profile_picture:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/Screenshot_2025-03-25_at_10.40.01_PM_vugdxk",
    lifelevel: 1,
  },
  {
    username: "yunz3",
    fullname: "Yunz",
    profile_picture:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/Screenshot_2025-03-25_at_10.40.01_PM_vugdxk",
    lifelevel: 1,
  },
  {
    username: "yun4",
    fullname: "Yunz",
    profile_picture:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/Screenshot_2025-03-25_at_10.40.01_PM_vugdxk",
    lifelevel: 1,
  },
];

/* ---------- POSTS ---------- */

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
      number : 1,
      total_sessions: 5,
      session_post_image_url:"https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1/posts/user_7/Tir_20250821103509",
      activity: {
        name: "Drawing",
        type : "creativity",
        emoji: "🎨"
      },
      duration: "2:30:21",
      xp_gained: 100,
      dateTime: "2025-01-07T10:30:00Z",
    },
    comments: [
      {
        id:1,
        username: "yucey",
        fullname: "Yucey",
        profile_picture:
          "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_80,h_80,c_thumb/v1752327292/lfco9m4hqq9yin7adl6e.jpg",
        created_at: "2025-01-07T11:00:00Z",
          comment: "Awesome sketch! Keep it up!",
        
      },
      {
        id:2,
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
      number : 1,
      total_sessions: 5,
      session_post_image_url:"https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1/posts/user_7/Tir_20250821103509",
      activity: {
        name: "Drawing",
        type : "creativity",
        emoji: "🎨"
      },
      duration: "2:30:21",
      xp_gained: 100,
      dateTime: "2025-01-07T10:30:00Z",
    },
    comments: [
      {
        id:1,
        username: "yucey",
        fullname: "Yucey",
        profile_picture:
          "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_80,h_80,c_thumb/v1752327292/lfco9m4hqq9yin7adl6e.jpg",
        created_at: "2025-01-07T11:00:00Z",
          comment: "Awesome sketch! Keep it up!",
        
      },
      {
        id:2,
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

/* ---------- HOME ---------- */

export default function Home() {
  const [posts, setPosts] = useState<typeof postsData>([]);

  useEffect(() => {
    setPosts(postsData);
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
          <UserStatus player={player} />

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
        <RightSidebarInfo user={sidebarUser} />
        <RightSidebarNotifications
          notifications={notifications}
          unreadCount={1}

        />
        <DiscoverUsers suggestedUsers={suggestedUsers} />
      </div>
    </div>
  );
}
