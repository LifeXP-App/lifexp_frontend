"use client";

import RadarChart, { RadarDataPoint } from "@/src/components/RadarChart";
import getAccentColors, {
  hexToRgba as hexToRgbaUtil,
} from "@/src/components/UserAccent";
import XPChart from "@/src/components/XPChart";
import PrivateProfileNotice from "@/src/components/profile/PrivateProfileNotice";
import { ASPECT_COLORS } from "@/src/lib/constants/aspects";
import {
  mockActivities,
  mockExperiences,
  mockGoals,
  mockProfileStats,
  mockSessions,
  mockWeeklyXP,
} from "@/src/lib/mock/profileData";
import {
  mockOtherUserPrivate,
  mockOtherUserPrivateFollowing,
  mockOtherUserPublic,
  mockUser,
} from "@/src/lib/mock/userData";
import { AspectType, UserProfile } from "@/src/lib/types";
import { FireIcon, LockClosedIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaSquareWhatsapp, FaLinkedin } from "react-icons/fa6";

interface PageProps {
  params: Promise<{ username: string }>;
}

import Achievement from "@/src/components/profile/Achievement";
import DefaultUserProfilePicture from "@/src/components/profile/DefaultUserProfilePicture";

type UserPost = {
  id: number;
  uid: string;
  user_username: string;
  user_profile_picture: string;
  user_mastery_title: string;
  user_life_level: number;
  title: string;
  content: string;
  post_image_url: string;
  duration: string;
  duration_display: string;
  xp_distribution: {
    logic: number;
    energy: number;
    social: number;
    physique: number;
    creativity: number;
  };
  total_xp: number;
  tags: string;
  tags_list: string[];
  justification: string;
  likes_count: number;
  comments_count: number;
  liked_by: boolean;
  created_at: string;
  updated_at: string;
};



export default function ProfilePage({ params }: PageProps) {
  const { username } = use(params);
  const router = useRouter();
  
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const [showShare, setShowShare] = useState(false);

  // current window's link
  const profileUrl = window.location.origin + `/u/${username}`;

  

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      
      try {
        // Fetch both users directly from Django backend
        // Using fetch on client side may hit CORS, but if CORS is configured on backend, this will work
        const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`;
        
        const [profileResponse, currentResponse] = await Promise.all([
          fetch(`${apiUrl}/users/${username}/`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }),
          fetch(`${apiUrl}/users/pat/`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            cache: "no-store",
          })
        ]);

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfileUser(profileData as UserProfile);
          setIsFollowing(profileData.isFollowing ?? false);
        } else {
          setProfileUser(null);
        }

        if (currentResponse.ok) {
          const currentData = await currentResponse.json();
          setCurrentUser(currentData as UserProfile);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setProfileUser(null);
        setCurrentUser(null);
      }
      
      setIsLoading(false);
    };

    fetchUsers();
  }, [username]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!username) return;
      
      setPostsLoading(true);
      
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`;
        const response = await fetch(`${apiUrl}/users/${username}/posts/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();
          setUserPosts(data.results || []);
        } else {
          setUserPosts([]);
        }
      } catch (err) {
        console.error("Failed to fetch user posts:", err);
        setUserPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchUserPosts();
  }, [username]);

  const stats = mockProfileStats;

  

  if (isLoading) {
  return (
    <main
      className="w-full flex flex-col md:flex-row overflow-y-auto"
      style={{ minHeight: "calc(100vh - 60px)" }}
    >
      <div className="w-full px-4 py-4 sm:px-6 md:px-8 lg:px-12 xl:px-24">
        {/* PROFILE HEADER SKELETON */}
        <div className="relative rounded-xl flex flex-col md:flex-row justify-between w-full mb-4 animate-pulse">
          <div className="pt-2 sm:p-2 mb-4 flex flex-col gap-2 w-full">
            <div className="flex flex-row items-center gap-4 sm:gap-8 w-full mb-4">
              {/* Avatar */}
              <div className="shrink-0">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gray-200 dark:bg-gray-800" />
              </div>

              {/* Name + stats */}
              <div className="flex flex-col w-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                </div>

                <div className="h-3 w-40 rounded bg-gray-200 dark:bg-gray-800 mb-4" />

                <div className="mt-4 flex gap-6 sm:gap-8 text-sm">
                  <div className="text-center sm:text-left">
                    <div className="h-4 w-10 rounded bg-gray-200 dark:bg-gray-800 mx-auto sm:mx-0" />
                    <div className="h-3 w-12 rounded bg-gray-200 dark:bg-gray-800 mt-2 mx-auto sm:mx-0" />
                  </div>

                  <div className="text-center sm:text-left">
                    <div className="h-4 w-10 rounded bg-gray-200 dark:bg-gray-800 mx-auto sm:mx-0" />
                    <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-800 mt-2 mx-auto sm:mx-0" />
                  </div>

                  <div className="text-center sm:text-left">
                    <div className="h-4 w-10 rounded bg-gray-200 dark:bg-gray-800 mx-auto sm:mx-0" />
                    <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-800 mt-2 mx-auto sm:mx-0" />
                  </div>
                </div>
              </div>
            </div>

            {/* Title + bio */}
            <div className="h-4 w-3/5 rounded bg-gray-200 dark:bg-gray-800 mt-2" />
            <div className="h-3 w-4/5 rounded bg-gray-200 dark:bg-gray-800 mt-2" />
            <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-800 mt-2" />

            {/* Ongoing goals skeleton pills */}
            <div className="mt-4">
              <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-800 mb-3" />
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full bg-gray-200 dark:bg-gray-800 w-24 h-7"
                  />
                ))}
              </div>
            </div>

            {/* Buttons skeleton */}
            <span className="flex flex-col sm:flex-row md:gap-2 gap-4 items-center w-full mt-2 sm:mt-4">
              <div className="w-48 h-10 rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div className="w-48 h-10 rounded-lg bg-gray-200 dark:bg-gray-800" />
            </span>
          </div>

          {/* Desktop chart skeleton */}
          <div className="hidden xl:flex w-full focus:outline-none justify-end p-4 sm:p-6 overflow-visible">
            <div className="w-full max-w-[360px] h-[320px] overflow-visible py-6">
              <div className="w-full h-full rounded-xl bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        </div>

        {/* Mobile chart skeleton */}
        <div className="xl:hidden my-4 flex justify-center w-full animate-pulse">
          <div className="w-full bg-white dark:bg-dark-2 rounded-xl border-2 border-gray-200 dark:border-gray-900 p-6">
            <div className="mx-auto w-full max-w-[280px] h-72 rounded-xl bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>

        {/* STREAK / LEVEL / XP skeleton cards */}
        <div className="my-4 flex flex-col sm:flex-row justify-between text-sm gap-4 animate-pulse">
          <div className="bg-white dark:bg-dark-2 border-2 rounded-xl border-gray-200 dark:border-gray-900 w-full p-4">
            <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-800 mb-3" />
            <div className="h-5 w-16 rounded bg-gray-200 dark:bg-gray-800" />
          </div>

          <div className="bg-white dark:bg-dark-2 border-2 rounded-xl border-gray-200 dark:border-gray-900 w-full p-4">
            <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-800 mb-3" />
            <div className="h-3 w-40 rounded bg-gray-200 dark:bg-gray-800" />
          </div>

          <div className="bg-gray-200 dark:bg-dark-2 border-2 rounded-xl border-gray-200 dark:border-gray-900 w-full p-4 animate-pulse">
            <div className="h-5 w-28 rounded bg-gray-300 dark:bg-gray-800 mb-3" />
            <div className="h-3 w-44 rounded bg-gray-300 dark:bg-gray-800" />
          </div>
        </div>

        {/* Weekly XP chart skeleton */}
        <div className="p-4 sm:p-6 my-4 bg-white dark:bg-dark-2 dark:border-gray-900 border-2 border-gray-200 rounded-2xl w-full animate-pulse">
          <div className="flex justify-between items-center mb-4">
            <span className="flex gap-3 items-center">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-800" />
            </span>
          </div>

          <div className="relative h-48 sm:h-64 rounded-xl bg-gray-200 dark:bg-gray-800" />
        </div>

        {/* Top Activities + Recent Sessions skeleton */}
        <div className="flex flex-col md:flex-row gap-4 animate-pulse">
          <div className="p-4 sm:p-6 my-2 bg-white border-2 border-gray-200 dark:bg-dark-2 dark:border-gray-900 rounded-2xl w-full">
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800 mb-6" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="h-4 w-14 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
            ))}
          </div>

          <div className="p-4 sm:p-6 my-2 bg-white border-2 border-gray-200 dark:bg-dark-2 dark:border-gray-900 rounded-2xl w-full">
            <div className="h-4 w-36 rounded bg-gray-200 dark:bg-gray-800 mb-6" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-3 rounded-lg mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-800" />
                    <div>
                      <div className="h-4 w-44 rounded bg-gray-200 dark:bg-gray-800 mb-2" />
                      <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-800" />
                    </div>
                  </div>
                  <div className="h-4 w-14 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements skeleton */}
        <div className="max-w-6xl mx-auto px-2 p-2 pb-12 my-4 rounded-sm w-full animate-pulse">
          <div className="h-5 w-36 rounded bg-gray-200 dark:bg-gray-800 mb-8" />
          <div className="flex flex-col gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full h-28 rounded-2xl bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}


  if (!profileUser) {
    return (
      <main className="w-full flex flex-col items-center justify-center" style={{ minHeight: "calc(100vh - 60px)" }}>
        <h1 className="text-2xl font-bold dark:text-white mb-4">User not found</h1>
        <p className="text-gray-500 dark:text-gray-400">@{username} doesn&apos;t exist</p>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="w-full flex flex-col items-center justify-center" style={{ minHeight: "calc(100vh - 60px)" }}>
        <h1 className="text-2xl font-bold dark:text-white mb-4">Error loading user data</h1>
        <p className="text-gray-500 dark:text-gray-400">Please try again</p>
      </main>
    );
  }

  // Check if profile content should be visible
  const canViewContent =
    profileUser.visibility === "public" || isFollowing;

  // Calculate radar chart points with comparison data
  const radarData: RadarDataPoint[] = [
    {
      aspect: "Physique",
      value: currentUser.aspects.physique.currentXP,
      comparisonValue: profileUser.aspects.physique.currentXP,
      fullMark: Math.max(
        currentUser.aspects.physique.currentXP,
        profileUser.aspects.physique.currentXP,
        1200
      ),
    },
    {
      aspect: "Energy",
      value: currentUser.aspects.energy.currentXP,
      comparisonValue: profileUser.aspects.energy.currentXP,
      fullMark: Math.max(
        currentUser.aspects.energy.currentXP,
        profileUser.aspects.energy.currentXP,
        1200
      ),
    },
    {
      aspect: "Logic",
      value: currentUser.aspects.logic.currentXP,
      comparisonValue: profileUser.aspects.logic.currentXP,
      fullMark: Math.max(
        currentUser.aspects.logic.currentXP,
        profileUser.aspects.logic.currentXP,
        1200
      ),
    },
    {
      aspect: "Creativity",
      value: currentUser.aspects.creativity.currentXP,
      comparisonValue: profileUser.aspects.creativity.currentXP,
      fullMark: Math.max(
        currentUser.aspects.creativity.currentXP,
        profileUser.aspects.creativity.currentXP,
        1200
      ),
    },
    {
      aspect: "Social",
      value: currentUser.aspects.social.currentXP,
      comparisonValue: profileUser.aspects.social.currentXP,
      fullMark: Math.max(
        currentUser.aspects.social.currentXP,
        profileUser.aspects.social.currentXP,
        1200
      ),
    },
  ];

  // Calculate total XP for the week
  const totalWeeklyXP = mockWeeklyXP.reduce((sum, day) => sum + day.xp, 0);

  const accent = getAccentColors(profileUser.masteryTitle);
  const hexToRgba = hexToRgbaUtil;

  const getAspectColor = (category: AspectType) => {
    return ASPECT_COLORS[category].primary;
  };

  const handleFollow = () => {
    setIsFollowing(true);
  };

  const handleUnfollow = () => {
    setIsFollowing(false);
  };

  // Helper function to get time ago text
  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const intervals = [
      { label: "year", seconds: 31536000 },
      { label: "month", seconds: 2592000 },
      { label: "week", seconds: 604800 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "minute", seconds: 60 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
      }
    }

    return "just now";
  };




      


  return (
    <main className="w-full flex flex-col md:flex-row overflow-y-auto" style={{ minHeight: "calc(100vh - 60px)" }}>
      

      {showShare && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 ">
    <div className="w-full max-w-md rounded-2xl bg-white dark:bg-dark-2 border-2 border-gray-200 dark:border-gray-900 p-6 relative">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold dark:text-white">
          Share Profile
        </h3>
        <button
          onClick={() => setShowShare(false)}
          className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      {/* Profile link box */}
      <div className="mb-4 text-gray-600 dark:text-gray-400 flex gap-2 w-full">
        <div className="flex items-center gap-2 w-full bg-gray-100 dark:bg-dark-3 border border-gray-200 dark:border-gray-800 rounded-lg p-2 ">
                <p id="profile-url" className="text-md active:opacity-75 m-2 truncate text-gray-700 dark:text-gray-300 flex-1">
                  {profileUrl}
                </p>
                
                 <button
                  onClick={() => {
                    navigator.clipboard.writeText(profileUrl);
                    const button = document.querySelector('#copy-button');
                    if (button) {
                      button.textContent = "Copied!";
                      // disable button
                      button.setAttribute('disabled', 'true');
                      setTimeout(() => {
                        button.textContent = "Copy";
                        button.removeAttribute('disabled');
                      }, 2000);
                    }
                   
                  }}
                  id="copy-button"
                  className="text-sm font-medium  py-1 disabled:opacity-50 w-18 h-full rounded-full cursor-pointer active:opacity-75 text-white"
                  style={{ backgroundColor: accent.primary }}
                >
                  Copy
                </button>

              </div>
             
      </div>
      

      {/* Social buttons */}
      <div className="grid grid-cols-3 gap-3">
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
            profileUrl
          )}`}
          target="_blank"
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-dark-3 transition"
        >
          <span className="text-xl">𝕏</span>
          <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">
            X
          </span>
        </a>

        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            profileUrl
          )}`}
          target="_blank"
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-dark-3 transition"
        >
          <FaLinkedin className="w-8 h-8 fill-blue-500" />
          <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">
            LinkedIn
          </span>
        </a>

        <a
          href={`https://wa.me/?text=${encodeURIComponent(profileUrl)}`}
          target="_blank"
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-dark-3 transition"
        >
          <FaSquareWhatsapp className="w-8 h-8 fill-green-700" />
          <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">
            WhatsApp
          </span>
        </a>
      </div>
    </div>
  </div>
)}

      
      
      
      <div className="w-full px-4 py-4 sm:px-6 md:px-8 lg:px-12 xl:px-24">
        {/* PROFILE HEADER */}
        <div className="relative rounded-xl flex flex-col md:flex-row justify-between w-full mb-4">
          <div className="pt-2 sm:p-2 mb-4 flex flex-col gap-2 w-full">
            <div className="flex flex-row items-center gap-4 sm:gap-8 w-full mb-4">
              <div className="shrink-0">
                {profileUser.avatar ? (
                  <Image
                    src={profileUser.avatar}
                    width={96}
                    height={96}
                    alt={profileUser.username}
                    className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover"
                  />
                ) : (
                  <DefaultUserProfilePicture username={profileUser.username} accent={{gradStart: accent.gradStart, gradEnd: accent.gradEnd}} />
                )}
              </div>
              <div className="flex flex-col w-full">
                <span className="flex items-center gap-2 mb-1">
                  <p className="text-base font-bold dark:text-white">{profileUser.fullname}</p>
                  <p className="text-base font-medium text-gray-500 dark:text-gray-400">
                    @{profileUser.username}
                  </p>
                  {profileUser.visibility === "private" && (
                    <LockClosedIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  )}
                </span>
                <span className="flex items-center cursor-pointer">
                  <p
                    className="text-sm font-bold"
                    style={{ color: accent.text }}
                  >
                    {profileUser.masteryTitle}
                  </p>
                  <button
                    type="button"
                    className="mastery-info flex float-right cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4 ms-2 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors"
                      aria-hidden="true"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="sr-only">Show Info</span>
                  </button>
                </span>
                <div className="mt-4 flex gap-6 sm:gap-8 text-sm">
                  <div className="text-center sm:text-left">
                    <p className="font-semibold dark:text-white">{profileUser.posts_count}</p>
                    <p className="text-gray-500 dark:text-gray-400">Posts</p>
                  </div>
                  <div className="text-center sm:text-left cursor-pointer">
                    <p className="font-semibold dark:text-white">{profileUser.followers_count}</p>
                    <p className="text-gray-500 dark:text-gray-400">Followers</p>
                  </div>
                  <div className="text-center sm:text-left cursor-pointer">
                    <p className="font-semibold dark:text-white">{profileUser.following_count}</p>
                    <p className="text-gray-500 dark:text-gray-400">Following</p>
                  </div>
                </div>
              </div>
            </div>

            {canViewContent && (
              <>
                <p className="text-gray-800 dark:text-gray-300 font-semibold">
                  {profileUser.title}
                </p>

                <p className="text-gray-500 dark:text-gray-400  whitespace-pre-wrap">{profileUser.bio}</p>
                {/* Ongoing Goals */}
                <div className="mt-2">
                  <h3 className="font-bold text-sm mb-3 dark:text-white">Ongoing Goals</h3>
                  <div className="flex gap-2 flex-wrap">
                    {mockGoals.map((goal) => (
                      <span
                        key={goal.id}
                        className="px-3 py-1.5 rounded-full text-xs font-medium flex gap-2 items-center"
                        style={{
                          backgroundColor: hexToRgba(
                            getAspectColor(goal.category),
                            0.15
                          ),
                          border: `1px solid ${getAspectColor(goal.category)}`,
                          color: getAspectColor(goal.category),
                        }}
                      >
                        <p className="text-md">{goal.emoji}</p>
                        {goal.name}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            <span className="flex flex-col sm:flex-row md:gap-2 gap-4 items-center w-full mt-2 sm:mt-4">
              {isFollowing ? (
                <button
                  onClick={handleUnfollow}
                  className="cursor-pointer font-medium py-2 font-medium rounded-lg cursor-pointer text-center  w-48  text-white bg-gray-700"
                >
                  Unfollow
                </button>
              ) : currentUser?.username === profileUser.username ? (
                <button
                  onClick={()=> router.push('/u/edit')}
                  className="w-full font-medium active:opacity-80 sm:w-auto p-2 rounded-lg cursor-pointer px-12 text-white"
                  style={{ backgroundColor: accent.primary }}
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={handleFollow}
                  className="cursor-pointer  font-medium py-2 font-medium rounded-lg cursor-pointer text-center w-48 text-white"
                  style={{ backgroundColor: accent.primary }}
                >
                  Follow
                </button>
              )}

              <button
                onClick={() => setShowShare(true)}
                className="cursor-pointer font-medium bg-black/70 hover:bg-black text-white text-center py-2 rounded-lg w-48 dark:hover:bg-gray-100 dark:bg-white dark:text-black"
              >
                Share
              </button>
            </span>
          </div>

          {/* Desktop Chart - Comparison Mode */}
          {canViewContent && (
            <div className="hidden xl:flex w-full focus:outline-none justify-end p-4 sm:p-6 overflow-visible">
              <div className="w-full max-w-[360px] h-[320px] overflow-visible py-6">
                <RadarChart
                  data={radarData}
                  masteryTitle={profileUser.masteryTitle}
                  username={profileUser.username}
                  comparisonMode={currentUser.username !== profileUser.username}
                  comparisonUsername={profileUser.username}
                />
              </div>
            </div>
          )}
        </div>

        {/* Private Profile Notice */}
        {!canViewContent && (
          <PrivateProfileNotice username={profileUser.username} />
        )}

        {/* Profile Content - Only visible for public profiles or if following */}
        {canViewContent && (
          <>
            {/* Mobile Chart - Comparison Mode */}
            <div className="xl:hidden my-4 flex justify-center w-full">
              <div className="w-full bg-white dark:bg-dark-2 rounded-xl border-2 border-gray-200 dark:border-gray-900 p-6">
                <div className="mx-auto w-full max-w-[280px] h-72">
                  <RadarChart
                    data={radarData}
                    masteryTitle={profileUser.masteryTitle}
                    username={profileUser.username}
                    comparisonMode={true}
                    comparisonUsername={profileUser.username}
                  />
                </div>
              </div>
            </div>

            {/* STREAK, LIFE LEVEL, XP CARDS */}
            <div className="my-4 flex flex-col sm:flex-row justify-between text-sm gap-4">
              {/* Streak count */}
              <div className="bg-white dark:bg-dark-2 border-2 rounded-xl border-gray-200 dark:border-gray-900 w-full flex flex-col rounded-md items-center justify-between p-4">
                <p className="text-sm dark:text-gray-300">Streak Count</p>
                <div className="flex gap-2 items-center">
                  <FireIcon className="size-6 text-gray-400 dark:text-gray-500" fill="#BBBBBB" />
                  <p className="text-lg font-bold text-gray-400 dark:text-gray-600">
                    {stats.streakCount}
                  </p>
                </div>
              </div>

              {/* life level */}
              <div className="bg-white dark:bg-dark-2 border-2 rounded-xl border-gray-200 dark:border-gray-900 w-full flex flex-col rounded-md items-center justify-between p-4">
                <span className="flex items-center justify-center gap-1">
                  <p className="text-gray-600 dark:text-white text-base sm:text-lg font-bold">
                    Life Level {profileUser.lifeLevel}
                  </p>
                </span>
                <span className="flex items-center justify-center gap-1">
                  <p style={{ fontSize: "11px" }} className="text-gray-500 dark:text-gray-400">
                    Member since {stats.memberSince}
                  </p>
                </span>
              </div>

              {/* XP */}
              <div className="bg-gray-200 dark:bg-dark-2 border-2 rounded-xl border-gray-200 dark:border-gray-900 w-full flex flex-col rounded-md items-center justify-between p-4">
                <span className="flex items-center justify-center gap-1">
                  <p
                    style={{ color: accent.text }}
                    className="text-lg font-bold"
                  >
                    {profileUser.totalXP.toLocaleString()} XP
                  </p>
                </span>
                <span className="flex items-center justify-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="#AAA"
                    className="h-4 w-4 dark:fill-gray-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p style={{ fontSize: "11px" }} className="text-gray-400 dark:text-gray-500">
                    Mastery unlocks at {stats.xpToMastery.toLocaleString()}
                  </p>
                </span>
              </div>
            </div>

            {/* WEEKLY XP CHART */}
            <div className="p-4 sm:p-6 my-4 bg-white dark:bg-dark-2 dark:border-gray-900 border-2 border-gray-200 rounded-2xl w-full">
              <div className="flex justify-between items-center mb-4">
                <span className="flex gap-3 items-center">
                  {profileUser.avatar ? (
                    <Image
                      src={profileUser.avatar}
                      width={32}
                      height={32}
                      alt={profileUser.username}
                      className="h-8 w-8 aspect-square rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${accent.gradStart}, ${accent.gradEnd})`,
                      }}
                    >
                      <span className="text-white text-sm font-bold">
                        {profileUser.username[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <h2 className="opacity-50 dark:opacity-70 text-lg sm:text-xl font-regular dark:text-gray-300">
                    {totalWeeklyXP.toLocaleString()} XP this week
                  </h2>
                </span>
              </div>

              <div className="relative h-48 sm:h-64">
                <XPChart
                  data={mockWeeklyXP}
                  username={profileUser.username}
                  totalXP={totalWeeklyXP}
                  accentColor={accent.primary}
                  gradientStart={accent.gradStart}
                  gradientEnd={accent.gradEnd}
                />
              </div>
            </div>

            {/* TOP ACTIVITIES & RECENT SESSIONS */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="p-4 sm:p-6 my-2 bg-white border-2 border-gray-200 dark:bg-dark-2 dark:border-gray-900 rounded-2xl w-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold dark:text-white">Top Activities</h2>
                  <span className="text-gray-500 dark:text-gray-400 text-sm"></span>
                </div>

                {mockActivities.map((activity, index) => (
                  <div key={activity.id} className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-4">
                        <span className="text-gray-400 dark:text-gray-500 font-semibold w-5">
                          {index + 1}
                        </span>
                        <div className="flex items-center space-x-2 sm:space-x-4">
                          <p className="text-2xl">{activity.icon}</p>
                          <span className="font-medium text-sm sm:text-base truncate dark:text-gray-200">
                            {activity.name}
                          </span>
                        </div>
                      </div>
                      <span className="font-semibold text-sm sm:text-md dark:text-gray-300">
                        {activity.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Sessions */}
              <div className="p-4 sm:p-6 my-2 bg-white border-2 border-gray-200 dark:bg-dark-2 dark:border-gray-900 rounded-2xl w-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold dark:text-white">Recent Sessions</h2>
                  <span className="text-gray-500 dark:text-gray-400 text-sm"></span>
                </div>

                {mockSessions.map((session) => (
                  <div key={session.id} className="p-3 hover:bg-gray-100 dark:hover:bg-dark-3 rounded-lg transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-4">
                        <div className="flex items-center space-x-2 sm:space-x-4">
                          <p className="text-2xl">{session.icon}</p>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm sm:text-base truncate dark:text-gray-200">
                              {session.activity}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {session.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 font-semibold text-sm">
                        {session.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* EXPERIENCES */}
            <div className="max-w-6xl mx-auto px-2 p-2 pb-12 my-4 rounded-sm w-full">
              <div className="flex flex-col gap-8">
                <h2 className="text-lg sm:text-xl font-semibold col-span-3 dark:text-white">
                  Achievements
                </h2>

                {postsLoading ? (
                  <div className="flex flex-col gap-6 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-full h-28 rounded-2xl bg-gray-200 dark:bg-gray-800" />
                    ))}
                  </div>
                ) : userPosts.length > 0 ? (
                  userPosts.map((post) => (
                    <div key={post.id} className="relative pb-4">
                      <Achievement
                        emoji={post.tags_list[0]?.charAt(0) || "🎯"}
                        title={post.title}
                        description={post.content}
                        xp={post.total_xp}
                        coverImage={post.post_image_url}
                        timeText={getTimeAgo(post.created_at)}
                        accent={{ primary: accent.primary, secondary: accent.secondary }}
                        stats={{
                          physique:post.xp_distribution.physique,
                          energy:post.xp_distribution.energy,
                          logic:post.xp_distribution.logic,
                          creativity:post.xp_distribution.creativity,
                          social:post.xp_distribution.social,
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No posts yet</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}