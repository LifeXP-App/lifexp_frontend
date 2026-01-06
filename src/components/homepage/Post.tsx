"use client";

import Link from "next/link";

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
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
  title?: string;
  content: string;
  post_image: string;
  duration: string;
  likes: number;
  comment_count: number;
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
};

/* ---------------- COMPONENT ---------------- */

export function Post({ post }: { post: PostType }) {
  const dark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  return (
    <div
      id="post-card"
      className="mb-6 md:p-6 md:rounded-xl md:border-2 md:bg-white md:border-gray-200 md:dark:bg-dark-2 md:dark:border-gray-900 md:dark:bg-dark-2"
    >
      {/* HEADER */}
      <div className="flex px-2 md:px-0 items-center mb-8">
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
            className="hover:bg-gray-200 dark:hover:bg-gray-800 p-1 rounded-full"
          >
            ⋮
          </button>

          <div className="dropdown border-1 border-gray-300 overflow-hidden hidden absolute right-0 mt-2 w-40 bg-white dark:border-gray-900 dark:bg-dark-2 rounded-md shadow-lg z-50">
            <a
              href={`/post/?v=${post.uid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-sm flex items-center gap-2 dark:text-[#a5a5a6] px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              Go to post
            </a>

            <button
              onClick={() => copyPostLink(post.uid)}
              className="w-full text-sm flex items-center gap-2 dark:text-[#a5a5a6] px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              Share post
            </button>

            {post.own_post ? (
              <button
                onClick={() => deletePost(post.id)}
                className="w-full text-sm flex items-center gap-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                <span className="text-red-600">Delete Post</span>
              </button>
            ) : (
              <button
                onClick={() => reportPost(post.id)}
                className="w-full text-sm flex items-center gap-2 dark:text-[#a5a5a6] px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-900"
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
            style={{ aspectRatio: "4 / 3", objectFit: "cover" }}
            src={post.post_image.replace(
              "/upload/",
              "/upload/f_auto,q_auto,w_800,c_fill/"
            )}
          />
        </div>
      </a>

      {/* CONTENT */}
      <div className="px-2 md:px-0">
        <h3 className="text-base md:text-lg font-bold dark:text-[#dfdfe0]">
          {post.title || ""}
        </h3>

        <p className="post-content text-sm md:text-base text-gray-700 dark:text-[#dfdfe0]/80">
          {linkify(post.content)}
        </p>
      </div>
    </div>
  );
}
