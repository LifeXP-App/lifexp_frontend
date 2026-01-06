"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Post } from "@/src/components/homepage/Post";
import type { PostType } from "@/src/components/homepage/Post";

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
        <div className="mb-8 pl-2 md:pl-0 flex gap-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link href={`/user/${player.username}`}>
            <div className="bg-white dark:bg-dark-2 border-2 border-gray-200 dark:border-gray-900 flex p-3 rounded-xl gap-3 min-w-[200px] max-w-[250px] items-center cursor-pointer flex-shrink-0">
              <Image
                src={player.profile_picture}
                width={56}
                height={56}
                alt="User"
                className="border-opacity-50 p-[1.5px] rounded-full h-14 w-14 aspect-square object-cover"
                unoptimized
              />
              <div className="flex flex-col justify-between">
                <h1 className="text-md font-semibold">
                  {player.fullname}
                </h1>
                <p className="text-xs font-medium text-black/40 dark:text-white/40">
                  Life Level {player.lifelevel}
                </p>
                <div className="flex items-center">
                  <p className="font-semibold text-xs ml-1">
                    {player.streak_count}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

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
