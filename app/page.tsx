"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Post } from "@/src/components/homepage/Post";
import { UserStatus } from "@/src/components/homepage/UserStatus";

/* ---------- DJANGO CONTEXT REPLACEMENT ---------- */

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

const postsData = [
  {
    id: 1,
    uid: "abc123",
    username: "alice",
    fullname: "Alice Rivera",
    profile_picture:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_80,h_80,c_thumb/v1755709015/ysyanmka88fuxudiuqhg.jpg",
    created_at: "2h ago",
    title: "Drawing my character",
    content: "Did a focused character sketching session.",
    post_image: "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1/posts/user_7/Pre_20250820170609",
    duration: "45 min",
    likes: 12,
    comment_count: 3,
    masterytitle: "Rookie",
    primary: "#713599",
    own_post: false,
    user_liked: false,
    xp_data: {
      physique: 0,
      energy: 20,
      social: 0,
      creativity: 50,
      logic: 20,
    },
  },
];

/* ---------- HOME ---------- */

export default function Home() {
  const [posts, setPosts] = useState<typeof postsData>([]);

  useEffect(() => {
    // Django already renders with data → we mimic that
    setPosts(postsData);
  }, []);

  return (
    <main className="w-full  md:w-[90%] lg:w-[60%] mx-auto md:px-5 overflow-hidden">
      <div
        id="content"
        className="flex-1 min-h-[100vh] pb-16 md:pb-6 py-2 md:py-6 md:px-4 sm:px-6 overflow-y-auto scrollbar-hide h-screen"
      >
        {/* TOP BAR */}
        <UserStatus player={player} />

        {/* POSTS */}
        <div
          id="posts-container"
          className="overflow-hidden transition-opacity duration-300"
        >
          {posts.map((post) => (

             <Post key={post.id} post={post} />

       
          ))}
        </div>
      </div>
    </main>
  );
}
