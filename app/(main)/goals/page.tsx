"use client";

import NewSessionPopup from "@/src/components/goals/NewSessionPopup";
import { ActivityType } from "@/src/lib/types/activityMeta";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { BoltIcon, UsersIcon } from "@heroicons/react/24/solid";
import FireIcon from "@heroicons/react/24/solid/FireIcon";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { FaBrain, FaHammer } from "react-icons/fa";
import { usePopup } from "@/src/context/PopupContext";
import { useEffect } from "react";
import { useAuth } from "@/src/context/AuthContext";



type AspectKey = "physique" | "energy" | "social" | "creativity" | "logic";

type GoalStatus = "ongoing" | "planned" | "completed";


type Goal = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  status: GoalStatus;

  // top-right label (ongoing shows "time spent", planned shows "Planned", completed shows XP pill)
  metaRight?: string;

  // completed extra info
  timeSummary?: string;
  xpReward?: number;

  aspectXP?: Record<AspectKey, number>;
};

type UserGoalsInfo = {
  username: string;
  fullname: string;
  profile_picture: string;
  mastery: string;
  masteryColor: string;
  masteryTextColor: string;
  lifelevel: number;
  posts: number;
  followers: number;
  following: number;
  totalXp: number;
  nextLevelXp: number;
  progressPercent: number;
  rank: number;
  streak: number;
  streak_active: boolean;
};


const mockGoals: Goal[] = [
  {
    id: "g1",
    emoji: "🎨",
    title: "Drawing Mandalorian",
    description:
      "Wanted to get back to drawing and make some really good art of one of my favorite characters, so here it...",
    status: "ongoing",
    metaRight: "5h 20m spent",
  },
  {
    id: "g2",
    emoji: "💪",
    title: "Gain 3lbs in 2 weeks through stre..",
    description:
      "Haven't been working out for sometime so I wanted to focus for the next 2 weeks, and try to gain atleast...",
    status: "planned",
    metaRight: "Planned",
  },
  {
    id: "g3",
    emoji: "🎶",
    title: "Practice for sem end music fest",
    description:
      "Wanted to get back to drawing and make some really good art of one of my favorite characters, so here it...",
    status: "completed",
    xpReward: 120,
    timeSummary: "12h 30m over 3 months",
    aspectXP: {
      physique: 24,
      energy: 24,
      social: 24,
      creativity: 24,
      logic: 24,
    },
  },
];

import { NudgesLikesSection } from "@/src/components/goals/NudgesLikesSection";


type InteractionType = "nudge" | "like";
type Interactions = {
  id: string;
  image: string;
  username: string;

  type: InteractionType; // ✅ moved here

  goalTitle?: string;
  activityName?: string;

  date: string;
  href: string;
  rounded?: boolean;
};

const interactions: Interactions[] = [
  {
    id: "1",
    image: "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1755709015/ysyanmka88fuxudiuqhg.jpg",
    username: "alex",
    type: "nudge",
    activityName: "drawing session",
    date: "2m ago",
    href: "/goal/1",
    rounded: true,
  },
  {
    id: "2",
    image: "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1755709015/ysyanmka88fuxudiuqhg.jpg",
    username: "maria",
    type: "like",
    goalTitle: "Drawing Mandalorian...",
    date: "10m ago",
    href: "/goal/1",
    rounded: true,
  },
];




function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold text-black dark:text-white mb-3">
      {children}
    </h2>
  );
}

function GoalCard({
  goal,
  primaryCta,
  secondaryCta,
  showAchievementCta,
}: {
  goal: Goal;
  primaryCta?: { label: string; onClick: () => void };
  secondaryCta?: { label: string; onClick: () => void };
  showAchievementCta?: { label: string; onClick: () => void };
}) {
  const isCompleted = goal.status === "completed";

  return (
    <div className="w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-2  p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className=" w-full flex items-start gap-3">
          <div className="text-xl leading-none mt-1">{goal.emoji}</div>

          <div className="w-full">
            <div className="flex w-full items-center justify-between ">
              <p className="font-semibold text-lg text-black dark:text-white truncate">
                {goal.title}
              </p>

              {isCompleted && typeof goal.xpReward === "number" && (
                <span
                  style={{
                    backgroundColor: "var(--rookie-primary)",
                  }}
                  className="ml-2 shrink-0 rounded-full  px-3 py-1 text-xs font-semibold text-white"
                >
                  {goal.xpReward}XP
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right meta */}
        {!isCompleted && goal.metaRight && (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic whitespace-nowrap mt-1">
            {goal.metaRight}
          </p>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 line-clamp-2">
        {goal.description}
      </p>
      {/* Completed extra row */}
      {isCompleted && goal.timeSummary && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center justify-center">
            {/* clock icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4 text-gray-400 dark:text-gray-500"
            >
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm.75 5.25a.75.75 0 0 0-1.5 0v4.25c0 .2.08.39.22.53l2.5 2.5a.75.75 0 1 0 1.06-1.06l-2.28-2.28V7.5Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <span>{goal.timeSummary}</span>
        </div>
      )}

      {/* Aspect chips */}
      {isCompleted && goal.aspectXP && (
        <div className="mt-4 grid grid-cols-5 gap-2">
          <AspectChip
            icon={<BiDumbbell className="w-4 h-4" />}
            value={goal.aspectXP.physique}
            tint="physique"
          />
          <AspectChip
            icon={<BoltIcon className="w-4 h-4" />}
            value={goal.aspectXP.energy}
            tint="energy"
          />
          <AspectChip
            icon={<UsersIcon className="w-4 h-4" />}
            value={goal.aspectXP.social}
            tint="social"
          />
          <AspectChip
            icon={<FaBrain className="w-4 h-4" />}
            value={goal.aspectXP.creativity}
            tint="creativity"
          />
          <AspectChip
            icon={<FaHammer className="w-4 h-4" />}
            value={goal.aspectXP.logic}
            tint="logic"
          />
        </div>
      )}

      {/* Buttons */}
      <div className="mt-6  flex gap-3">
        {primaryCta && (
          <button
            onClick={primaryCta.onClick}
            style={{
              backgroundColor: "var(--rookie-primary)",
            }}
            className="flex-1 rounded-xl cursor-pointer text-white font-semibold py-3 hover:bg-blue-700 dark:hover:bg-blue-600 transition"
          >
            {primaryCta.label}
          </button>
        )}

        {secondaryCta && (
          <button
            onClick={secondaryCta.onClick}
            className="flex-1 rounded-xl cursor-pointer bg-gray-700 dark:bg-gray-600 text-white font-semibold py-3 hover:bg-gray-800 dark:hover:bg-gray-700 transition"
          >
            {secondaryCta.label}
          </button>
        )}

        {showAchievementCta && (
          <button
            onClick={showAchievementCta.onClick}
            className="w-full rounded-xl bg-gray-700 dark:bg-gray-600 text-white font-semibold py-3 hover:bg-gray-800 dark:hover:bg-gray-700 transition"
          >
            {showAchievementCta.label}
          </button>
        )}
      </div>
    </div>
  );
}
function GoalCardSkeleton() {
  return (
    <div className="w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-2 p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 w-full">
          {/* emoji placeholder */}
          <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-800 mt-1" />


            <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />

        </div>

        {/* meta right */}
        <div className="h-2 w-16 rounded bg-gray-200 dark:bg-gray-800 mt-1" />
      </div>

      {/* description */}
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-800" />

      </div>

      {/* buttons */}
      <div className="mt-6 flex gap-3">
        <div className="h-10 w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
        <div className="h-10 w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>
  );
}

function GoalsSectionSkeleton({
  count = 2,
}: {

  count?: number;
}) {
  return (
    <div className="mt-6">

      <div className="space-y-6">
        {Array.from({ length: count }).map((_, i) => (
          <GoalCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function AspectChip({
  icon,
  value,
  tint,
}: {
  icon: React.ReactNode;
  value: number;
  tint: "physique" | "energy" | "social" | "creativity" | "logic";
}) {
  const tintMap: Record<typeof tint, string> = {
    physique: "bg-[#8d2e2e]/30 text-[#8d2e2e]",
    energy: "bg-[#c49352]/30 text-[#c49352]",
    social: "bg-[#31784e]/30 text-[#31784e]",
    creativity: "bg-[#4187a2]/30 text-[#4187a2]",
    logic: "bg-[#713599]/30 text-[#713599]",
  };

  return (
    <div
      className={`flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-sm font-semibold ${tintMap[tint]}`}
    >
      <span>{icon}</span>
      <span>{value}</span>
    </div>
  );
}

import NewGoalModal from "@/src/components/goals/NewGoalModal";
import { BiDumbbell } from "react-icons/bi";

interface Activity {
  id: string;
  name: string;
  type: ActivityType;
}

function RightSidebarInfoSkeleton() {
  return (
    <aside className="w-2xl hidden md:block">
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



export default function GoalsPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSessionPopupOpen, setIsSessionPopupOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);



  const { me, loading: authLoading } = useAuth();

  const [posts, setPosts] = useState<any[]>([]);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [postsLoading, setPostsLoading] = useState(false);

    useEffect(() => {
    if (authLoading || !me?.username) return;

    const fetchPosts = async () => {
      try {
        setPostsLoading(true);

        const res = await fetch(`/api/posts/u/${me.username}`, {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to fetch posts");

        const data = await res.json();
        setPosts(data.results || []);
        setNextPage(data.next || null);
      } catch (e) {
        console.error(e);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchPosts();
  }, [me, authLoading]);

  const plannedPosts = posts.filter((p) => p.status === "planned");
  const ongoingPosts = posts.filter((p) => p.status === "ongoing");
  const completedPosts = posts.filter((p) => p.status === "completed");

  const [sidebarInfo, setSidebarInfo] = useState<UserGoalsInfo | null>(null);
    const [sidebarLoading, setSidebarLoading] = useState(false);

    useEffect(() => {
      if (!me?.username) return;

      const fetchSidebarInfo = async () => {
        try {
          setSidebarLoading(true);

          const res = await fetch(
            `/api/v1/goals/info/${me.username}/`,
            { cache: "no-store" }
          );

          if (!res.ok) throw new Error("Failed to fetch sidebar info");

          const data = await res.json();
          setSidebarInfo(data);
        } catch (e) {
          console.error(e);
        } finally {
          setSidebarLoading(false);
        }
      };

      fetchSidebarInfo();
    }, [me?.username]);



  const handleCreateGoal = (goal: {
    title: string;
    description: string;
    finishBy: string;
  }) => {
    console.log("New goal created:", goal);
    // Add your logic here to save the goal
    setIsModalOpen(false);
  };

  const handleOpenSessionPopup = (goalId: string) => {
    setSelectedGoalId(goalId);
    setIsSessionPopupOpen(true);
  };

  const handleSelectActivity = (activity: Activity) => {
    setIsSessionPopupOpen(false);
    if (selectedGoalId) {
      router.push(
        `/goals/${selectedGoalId}/session/new?activity=${activity.id}`,
      );
    }
  };

  const handleNewActivity = () => {
    setIsSessionPopupOpen(false);
    if (selectedGoalId) {
      // Navigate to goal page which has the full activity modal
      router.push(`/goals/${selectedGoalId}`);
    }                                 
  };




  return (
    <main className="h-screen w-full bg-gray-100 dark:bg-dark-1 overflow-hidden">
      <div className="mx-auto w-full  px-4 py-6">
        <div className="flex w-full gap-6">
          {/* LEFT MAIN CONTENT */}
          <div className="w-full h-screen overflow-scroll noscrollbar py-4 px-6 md:px-12">
            {/* Title */}
            <h1 className="text-xl font-bold text-black dark:text-white mb-4">
              Goals
            </h1>

            {/* Create new goal */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full rounded-2xl cursor-pointer bg-gray-200 dark:bg-dark-2 text-black dark:text-white font-semibold py-4 flex items-center justify-start gap-3 px-5 hover:bg-gray-300 dark:hover:bg-dark-3 transition"
            >
              <span className="text-lg cursor-pointer leading-none">＋</span>
              <span>Create New Goal</span>
            </button>

            {/* Ongoing */}
            <div className="mt-6">
              {(ongoingPosts.length > 0 || postsLoading)  && (
                <>
                  <SectionTitle>Ongoing ({ongoingPosts.length})</SectionTitle>
                </>
              )}
             {postsLoading ? (
              <>
                <GoalsSectionSkeleton count={2} />
              </>
            ) : (

              <div className="space-y-4">
                
                {ongoingPosts.map((post) => (
                  <GoalCard
                    key={post.id}
                    goal={{
                      id: post.id,
                      emoji: post.emoji || "🎯",
                      title: post.title,
                      description: post.content,
                      status: "ongoing",
                      metaRight: post.duration_display
                        ? `${post.duration_display} spent`
                        : undefined,
                    }}
                    primaryCta={{
                      label: "New Session",
                      onClick: () => router.push(`/posts/${post.uid}`),
                    }}
                    secondaryCta={{
                      label: "View",
                      onClick: () => router.push(`/posts/${post.uid}`),
                    }}
                  />
                ))}
              </div>
            )}
            </div>

            {/* Planned */}
            <div className="mt-6">
              {(plannedPosts.length > 0 || postsLoading) && (
                <>
                  <SectionTitle>Planned ({plannedPosts.length})</SectionTitle>
                </>
              )}
              
          {postsLoading ? (
                      <>
                        <GoalsSectionSkeleton  count={2} />
                      </>
                    ) : (
              <div className="space-y-4">
                {plannedPosts.map((post) => (
                      <GoalCard
                        key={post.id}
                        goal={{
                          id: post.id,
                          emoji: post.emoji || "🎯",
                          title: post.title,
                          description: post.content,
                          status: "planned",
                          metaRight: "Planned",
                        }}
                        primaryCta={{
                          label: "Start",
                          onClick: () => router.push(`/posts/${post.uid}`),
                        }}
                        secondaryCta={{
                          label: "Discard",
                          onClick: () => router.push(`/posts/${post.uid}`),
                        }}
                      />
                    ))}
              </div>
                    )}
            </div>

            {/* Completed */}
            <div className="mt-6">
              {(completedPosts.length > 0 || postsLoading) && (
                <>
                  <SectionTitle>Completed ({completedPosts.length})</SectionTitle>
                </>
              )}
              {postsLoading ? (
                      <>
                        <GoalsSectionSkeleton  count={2} />
                      </>
                    ) : (
              <div className="space-y-4">
                {completedPosts.map((post) => (
                  <GoalCard
                    key={post.id}
                    goal={{
                      id: post.id,
                      emoji: post.emoji || "🎯",
                      title: post.title,
                      description: post.content,
                      status: "completed",
                      xpReward: post.total_xp,
                      timeSummary: post.duration_display
                        ? post.duration_display
                        : undefined,
                      aspectXP: post.xp_distribution,
                    }}
                    showAchievementCta={{
                      label: "View Achievement",
                      onClick: () => router.push(`/posts/${post.uid}`),
                    }}
                  />
                ))}
              </div>
              )}
            </div>

            <div className="h-8" />
          </div>

          {/* RIGHT SIDEBAR (DESKTOP ONLY) */}
          {sidebarLoading || !sidebarInfo ? (
                <RightSidebarInfoSkeleton />
              ) : (
                <RightSidebar user={sidebarInfo} />
              )}

        </div>
      </div>

      {/* New Goal Modal */}
      <NewGoalModal
        isOpen={isModalOpen}
        isEdit={false}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateGoal}
      />

      {/* New Session Popup */}
      <NewSessionPopup
        isOpen={isSessionPopupOpen}
        onClose={() => setIsSessionPopupOpen(false)}
        onSelectActivity={handleSelectActivity}
        onNewActivity={handleNewActivity}
      />
    </main>
  );
}

/* ===========================
   RIGHT SIDEBAR (APPENDED)
   =========================== */

function RightSidebar({ user }: { user: UserGoalsInfo }) {
  const { openMasteryPopup } = usePopup();
  return (
    <aside className="w-2xl hidden md:block">
      {/* PROFILE CARD */}
      <div className="bg-white dark:bg-dark-2 p-6 mb-4 rounded-xl border-2 border-gray-200 dark:border-gray-800">
        <div className="text-center flex flex-col items-center">
          <div className="flex flex-col items-center">
            <img
              src={user.profile_picture}
              className="h-24 w-24 object-cover aspect-square p-[1.5px] rounded-full"
              loading="lazy"
              alt="Profile"
            />
            <h3 className="font-semibold mt-2 dark:text-white">
              {user.fullname}
            </h3>
          </div>

          <span className="flex gap-1 justify-center items-center cursor-pointer mt-1">
            <button type="button" className="flex cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                 onClick={openMasteryPopup} 
                className="w-4 h-4 text-gray-400 dark:text-gray-500"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm9.75-5.25a.75.75 0 0 0-.75.75v.75a.75.75 0 0 0 1.5 0V7.5a.75.75 0 0 0-.75-.75Zm0 4.5a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0V12a.75.75 0 0 0-.75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <button
              className="text-sm font-bold"
              onClick={openMasteryPopup} 
              style={{ color: user.masteryTextColor }}
            >
              {user.mastery}
            </button>
            <span className="w-4" />
          </span>
        </div>

        {/* STATS */}
        <div className="mt-4 flex justify-between text-sm">
          <Stat label="Life Level" value={user.lifelevel} />
          <Stat label="Ongoing" value={user.posts} />
          <Stat label="Planned" value={user.followers} />
          <Stat label="Completed" value={user.following} />
        </div>

        {/* XP + STREAK */}
        <div className="mt-4 flex justify-between text-sm gap-4">
          <div className="bg-gray-100 dark:bg-dark-3 w-full flex flex-col rounded-md items-center justify-between p-4">
            <p
              className="text-lg font-bold"
              style={{ color: user.masteryTextColor }}
            >
              {user.totalXp} XP
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Overall ranked <b>#{user.rank}</b>
            </p>
          </div>

          <div className="bg-gray-100 dark:bg-dark-3 w-full flex flex-col rounded-md items-center justify-between p-4">
            <p className="text-sm dark:text-gray-300">Streak Count</p>

            <p className="text-lg font-extrabold text-gray-400 dark:text-gray-500 flex gap-1 items-center">
              <FireIcon
                className={`w-6 h-6 inline-block ml-1 ${
                  user.streak_active
                    ? "text-yellow-500 animate-pulse"
                    : "text-gray-400 dark:text-gray-600"
                }`}
              />
              {user.streak}
            </p>
          </div>
        </div>
      </div>
      <NudgesLikesSection
          interactions={interactions}
        />
    </aside>
  );
}

/* ---------------- SMALL HELPER ---------------- */

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="font-semibold dark:text-white">{value}</p>
      <p className="text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
