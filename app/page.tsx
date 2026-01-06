"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

/* ---------------- MOCK DATA ---------------- */

const player = {
  username: "patty",
  fullname: "Patrick Schwarz",
  lifelevel: 12,
  streak_count: 5,
  streak_active: true,
  masterytitle: "Prodigy",
  primary_accent_color: "#713599",
  profile_picture: "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_80,h_80,c_thumb/v1752327292/lfco9m4hqq9yin7adl6e.jpg",
};

const postsData = [
  {
    id: 1,
    uid: "abc123",
    username: "alice",
    fullname: "Alice Rivera",
    profile_picture: "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1755709015/ysyanmka88fuxudiuqhg.jpg",
    created_at: "2h ago",
    title: "Drawing my character",
    content:
      "Did a focused character sketching session. Line quality and proportions are improving.",
    post_image: "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1/posts/user_7/Pre_20250820170609",
    duration: "45 min",
    likes: 12,
    comment_count: 3,
    xp_data: {
      physique: 0,
      energy: 20,
      social: 0,
      creativity: 50,
      logic: 20,
    },
  },
];

/* ---------------- HOME ---------------- */

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    // simulate API load
    setTimeout(() => setPosts(postsData), 500);
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
            <div className="bg-white dark:bg-dark-2 border-2 border-gray-200 dark:border-gray-900 dark:bg-gray-900 flex p-3 rounded-xl gap-3 min-w-[200px] max-w-[250px] items-center cursor-pointer flex-shrink-0">
              <Image
                src={player.profile_picture}
                width={56}
                height={56}
                alt="User"
                className="border-opacity-50 p-[1.5px] rounded-full h-14 w-14 aspect-square object-cover"
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
        <div id="posts-container" className="overflow-hidden transition-opacity duration-300">
          {posts.map((post) => (
            <div className="mb-6 md:p-6 md:rounded-xl md:border-2 md:bg-white dark:bg-gray-900 md:border-gray-200 dark:border-gray-900">
  {/* HEADER */}
  <div className="flex px-2 md:px-0 items-center mb-8">
    <div className="flex items-center cursor-pointer">
      <img
        src={post.profile_picture}
        className="rounded-full w-10 h-10 object-cover aspect-square"
        alt="User"
      />
      <div className="ml-3">
        <span className="flex items-center gap-2">
          <p className="text-sm md:text-base font-semibold text-black dark:text-white">
            {post.fullname}
          </p>
          <p className="text-sm md:text-base text-gray-500 dark:text-[#a5a5a6]">
            @{post.username}
          </p>
        </span>
        <p className="text-sm text-gray-500 dark:text-[#a5a5a6]">
          {post.created_at}
        </p>
      </div>
    </div>
  </div>

  {/* IMAGE */}
  <div className="w-full my-4">
    <img
      src={post.post_image}
      className="w-[100vw] max-w-none md:w-full cursor-pointer md:rounded-lg"
      style={{ aspectRatio: "4 / 3", objectFit: "cover" }}
      alt="Post"
    />
  </div>

  {/* CONTENT */}
  <div className="px-2 md:px-0">
    {post.title && (
      <h3 className="text-base md:text-lg font-semibold text-black dark:text-white">
        {post.title}
      </h3>
    )}

    <p className="post-content text-sm md:text-base text-gray-700 dark:text-[#dfdfe0]/80">
      {post.content}
    </p>

    {/* META */}
    <div className="flex text-sm text-gray-500 dark:text-[#a5a5a6] space-x-4 mb-3 mt-4">
      <div className="flex items-center gap-1">
        ⏱ {post.duration}
      </div>
    </div>

    {/* XP TAGS */}
    <div className="flex gap-2 flex-wrap">
      {Object.entries(post.xp_data).map(
        ([key, val]: any) =>
          val > 0 && (
            <span
              key={key}
              className="border-2 border-gray-600 dark:border-[#5b6161] 
                         text-gray-600 dark:text-[#dfdfe0] 
                         text-xs px-2 rounded-lg"
            >
              {key}: {val}
            </span>
          )
      )}
    </div>

    {/* ACTIONS */}
    <div className="flex justify-between items-center h-[50px] mt-4 px-2.5">
      <div className="flex gap-1 items-center text-black/50 dark:text-white/50">
        ❤️ {post.likes}
      </div>
      <div className="flex gap-1 items-center cursor-pointer text-black/50 dark:text-white/50">
        💬 {post.comment_count}
      </div>
    </div>
  </div>
</div>

            
          ))}
        </div>
      </div>
    </main>
  );
}
