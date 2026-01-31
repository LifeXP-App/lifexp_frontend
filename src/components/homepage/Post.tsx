"use client";

import Link from "next/link";

import { ClockIcon } from "@heroicons/react/24/outline";
import { HeartIcon, ChatBubbleOvalLeftIcon, EllipsisVerticalIcon } from "@heroicons/react/24/solid";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { CommentSection } from "./CommentSection"; // ADD THIS

/* ---------------- HELPERS (ported 1:1) ---------------- */

function toggleDropdown(btn: HTMLElement) {
  const dropdown = btn.parentElement?.querySelector(".dropdown");
  dropdown?.classList.toggle("hidden");
}

function copyPostLink(uid: string) {
  navigator.clipboard.writeText(`${window.location.origin}/post/?v=${uid}`);
}

function reportPost(id: number) {
  console.log("report post", id);
}

function deletePost(id: number) {
  console.log("delete post", id);
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${g}, ${b}, ${alpha})`;
}

function linkify(text: string) {
  return text;
}

/* ---------------- TYPES ---------------- */

export type PostType = {
  id: number;
  uid: string;
  username: string;
  fullname: string;
  profile_picture: string;
  created_at: string;
  started_at:string;
  title?: string;
  content: string;
  post_image: string;
  duration: string;
  likes: number;
  masterytitle: string;
  primary: string;
  own_post: boolean;
  user_liked: boolean;
  xp_data: {
    physique: number;
    energy: number;
    social: number;
    creativity: number;
    logic: number;
  };
  tags?: string;
  justification?: string;
  likedbyprofiles?: [string, string][];
  session: {
    number : number;
    total_sessions: number;
    activity: {
      name: string;
      type : string;
      emoji: string;
    };
    duration:string;
    xp_gained: number;
    dateTime: string;
    session_post_image_url?: string;
  };
  // ADD THIS FOR COMMENTS
  comments?: Array<{
    id: number;
    username: string;
    fullname: string;
    profile_picture: string;
    created_at: string;
    comment: string;
  }>;
};

/* ---------------- COMPONENT ---------------- */

export function Post({ post }: { post: PostType }) {
  const dark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
    
    const getTimeAgo = (createdAt: string | Date): string => {
      const now = new Date();
      const createdAtDate = new Date(createdAt);
      const diffInMs = now.getTime() - createdAtDate.getTime();
      
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);
      const diffInWeeks = Math.floor(diffInDays / 7);
      const diffInMonths = Math.floor(diffInDays / 30);
      const diffInYears = Math.floor(diffInDays / 365);
      
      if (diffInMs < 60000) return "just now";
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays < 7) return `${diffInDays}d ago`;
      if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
      if (diffInMonths < 12) return `${diffInMonths}mo ago`;
      return createdAtDate.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    };
   
    const getDuration = (startedAt: string | Date, createdAt: string | Date): string => {
      const startDate = new Date(startedAt);
      const endDate = new Date(createdAt);
      
      // Calculate difference in milliseconds
      const diffInMs = endDate.getTime() - startDate.getTime();
      
      // Handle negative duration (if created_at is before started_at)
      if (diffInMs < 0) {
        return "0s";
      }
      
      // Calculate time units
      const diffInSeconds = Math.floor(diffInMs / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);
      
      // Get remainders
      const seconds = diffInSeconds % 60;
      const minutes = diffInMinutes % 60;
      const hours = diffInHours % 24;
      
      // Format based on magnitude
      if (diffInDays > 0) {
        if (hours > 0) {
          return `${diffInDays}d ${hours}h`;
        }
        return `${diffInDays}d`;
      } else if (diffInHours > 0) {
        if (minutes > 0) {
          return `${diffInHours}h ${minutes}m`;
        }
        return `${diffInHours}h`;
      } else if (diffInMinutes > 0) {
        if (seconds > 0) {
          return `${diffInMinutes}m ${seconds}s`;
        }
        return `${diffInMinutes}m`;
      } else {
        return `${diffInSeconds}s`;
      }
    };

    const [liked, setLiked] = useState(post.user_liked);
    const [likes, setLikes] = useState(post.likes);
    const [showComments, setShowComments] = useState(false); // ADD THIS

    useEffect(() => {
      if (liked) {
        setLikes(post.likes + 1);
      } else {
        setLikes(post.likes);
      }
    }, [liked, post.likes]);

    const handleLike = () => {
      setLiked(!liked);
    };


    return (
    <div
      id="post-card"
      className="mb-6 md:p-6 md:rounded-xl md:border-2 md:bg-white md:border-gray-200 md:dark:bg-dark-2 md:dark:border-gray-900 "
    >
      {/* HEADER */}
      


      {/* COMMENT SECTION MODAL - ADD THIS */}
            {showComments && (
              <CommentSection
                postId={post.id}
                comments={post.comments || []}
                onClose={() => setShowComments(false)}
              />
            )}




      <div className="flex px-2 md:px-0 items-center mb-4">
        <Link href={`/user/${post.username}`}>
          <div className="flex items-center cursor-pointer">
            <img
              src={post.profile_picture.replace(
                "/upload/",
                "/upload/f_auto,q_auto,w_800,c_fill/"
              )}
              className={`rounded-full w-10 h-10 object-cover aspect-square ${
                post.masterytitle === "Rookie"
                  ? ""
                  : "p-[1.5px] border-opacity-50 border-2"
              }`}
              style={
                post.masterytitle !== "Rookie"
                  ? { borderColor: post.primary }
                  : {}
              }
              alt="User"
            />

            <div className="ml-3">
              <span className="flex items-center gap-2">
                <p className="text-sm md:text-base font-semibold">
                  {post.fullname}
                </p>
                <p className="text-sm md:text-base font-regular text-gray-500">
                  @{post.username}
                </p>
              </span>

              <p className="text-sm text-gray-500">{post.created_at}</p>
            </div>
          </div>
        </Link>

        {/* DROPDOWN */}
        <div className="relative inline-block text-left ml-auto">
          <button
            onClick={(e) =>
              toggleDropdown(e.currentTarget as HTMLElement)
            }
            className="cursor-pointer hover:opacity-80 active:opacity-60 p-1 rounded-full"
          >
            <EllipsisVerticalIcon className="w-6 h-6"/>
          </button>

          <div className="dropdown  hidden absolute right-0 mt-2 w-44 border bg-white dark:border-gray-900 dark:bg-dark-2 overflow-hidden rounded-sm shadow-lg z-50" style={{ borderColor: "var(--border)" }}>


            <a
              href={`/post/?v=${post.uid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block cursor-pointer w-full text-left font-medium py-3 px-4 text-sm
                        hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors
                        dark:text-[#a5a5a6]"
            >
              Go to post
            </a>

            <button
              type="button"
              onClick={() => copyPostLink(post.uid)}
              className="w-full cursor-pointer text-left font-medium py-3 px-4 text-sm
                        hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors
                        dark:text-[#a5a5a6]"
            >
              Share post
            </button>

            {post.own_post ? (
              <button
                type="button"
                onClick={() => deletePost(post.id)}
                className="w-full cursor-pointer text-left font-medium py-3 px-4 text-sm text-red-600
                          hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors"
              >
                Delete Post
              </button>
            ) : (
              <button
                type="button"
                onClick={() => reportPost(post.id)}
                className="w-full cursor-pointer text-left font-medium py-3 px-4 text-sm
                          hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors
                          dark:text-[#a5a5a6]"
              >
                Report
              </button>
            )}
          </div>

          </div>

      </div>

      {/* IMAGE */}
      <a href={`/post/?v=${post.uid}`} className="block">
        <div className="w-full my-4">
          <img
            className="w-[100vw] max-w-none md:w-full cursor-pointer md:rounded-lg"
            style={{ aspectRatio: "1.91 / 1", objectFit: "cover" }}
            src={post.post_image.replace(
              "/upload/",
              "/upload/f_auto,q_auto,w_800,c_fill/"
            )}
          />
        </div>
      </a>

      {/* CONTENT */}
      <div className="px-2 md:px-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base md:text-lg font-bold dark:text-[#dfdfe0]">
          {post.title || ""}
        </h3>
          <span
            className="text-sm font-bold px-3 py-1 rounded-full"
            style={{
              backgroundColor: post.primary,
              color: "#fff",
            }}
          >

           {Object.values(post.xp_data).reduce((sum, val) => sum + val, 0)} XP

          </span>
        </div>

        

        <p className="post-content text-sm md:text-base text-gray-700 dark:text-[#dfdfe0]/80">
          {linkify(post.content)}
        </p>

        <div className="flex items-center mt-3 gap-1 text-sm font-medium text-gray-500 dark:text-gray-400">
          <ClockIcon className="w-5 h-5 inline-block mr-1" />
          <span>{post.duration} over {getDuration(post.started_at, post.created_at)}</span>
        </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg flex gap-4 bg-white dark:bg-dark-3 mt-4 p-2">
             {
              post.session.session_post_image_url && post.session.session_post_image_url.trim() !== "" ?
                <img
                  className="w-24 cursor-pointer md:rounded-lg"
                  style={{ aspectRatio: "1 / 1", objectFit: "cover" }}
                  src={post.session.session_post_image_url?.replace(
                    "/upload/",
                    "/upload/f_auto,q_auto,w_150,c_fill/"
                  )}
                />
                :
                <div className="w-24 h-24 shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-lg">
                  <span className="text-4xl">{post.session.activity.emoji}</span>
                </div>
            }
              



                <div className="flex flex-col gap-1 justify-center w-full">
                    <p className="text-sm md:text-lg font-semibold dark:text-[#dfdfe0]">
                  
                    Session {post.session.number} of {post.session.total_sessions}
                  </p>


               <p 
                  className={`text-sm font-bold`}
                  style={{ color: `var(--aspect-${post.session.activity.type.toLowerCase()})` }}
                >
                  {post.session.activity.name}
                </p>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {post.session.xp_gained} XP Earned •  {new Date(post.session.dateTime).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>

                <p className="text-sm md:text-xl font-bold flex mr-4 items-center text-black dark:text-[#dfdfe0]">
                  
                  {post.session.duration}
                  </p>



            </div>


          <div className="flex items-center mt-4 gap-6 justify-between">
            <div className="flex items-center gap-2"  onClick={handleLike}>
              <HeartIcon
                className={`w-8 h-8 cursor-pointer ${
                  liked ? "text-red-700 fill-red-700" : "text-gray-500 opacity-50 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              />
              <span className="text-md font-medium text-gray-500 dark:text-gray-400">
                {likes}
              </span>
            
            </div>


            {/* COMMENT BUTTON - ADD ONCLICK */}
            <div className="flex items-center gap-2" onClick={() => setShowComments(true)}>
              <ChatBubbleOvalLeftIcon className="w-8 h-8 text-gray-500 opacity-50 cursor-pointer hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer" />
              <span className="text-md font-medium text-gray-500 dark:text-gray-400">
                {post.comments?.length || 0}
              </span>
            </div>
          </div>





      </div>

      
    </div>
  );
}