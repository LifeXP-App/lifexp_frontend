"use client";

import Link from "next/link";

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

type NudgesLikesSectionProps = {
  interactions: Interactions[];
};

export function NudgesLikesSection({
  interactions,
}: NudgesLikesSectionProps) {
  return (
    <>
      {/* NOTIFICATIONS */}
      <div className="bg-white w-full p-6 mb-4 rounded-xl border-2 border-gray-200 dark:bg-dark-2 dark:border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <p className="text-md font-semibold dark:text-white">Recent Interactions</p>

          
        </div>

        <div className="max-h-80 overflow-y-auto">
          <ul className="flex flex-col gap-3">
            {interactions.map((i) => (
              <Link key={i.id} href={i.href}>
                <li className="cursor-pointer">
                  <div className="flex gap-4">
                    <div className="relative w-12 h-12 flex-shrink-0">
                        <img
                            src={i.image}
                            className={`h-12 w-12 object-cover aspect-square ${
                            i.rounded ? "rounded-full" : "rounded-md"
                            }`}
                            loading="lazy"
                            alt="profile"
                        />

                        {/* Emoji badge bottom-left */}
                        <div
                            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[16px] bg-white border"
                            style={{ borderColor: "var(--border)" }}
                        >
                            {i.type === "nudge" ? "👋" : "❤️"}
                        </div>
                        </div>


                    <div className="flex flex-col">
                      <p className="text-base dark:text-white">
                        <span className="font-semibold">{i.username}</span>{" "}
                        {i.type === "nudge" ? (
                          <>
                            nudged you during your{" "}
                            <span className="font-semibold">
                              {i.activityName ?? "session"}
                            </span>{" "}
                            
                          </>
                        ) : (
                          <>
                            liked your goal{" "}
                            <span className="font-semibold">
                              {i.goalTitle ?? ""}
                            </span>{" "}
                            
                          </>
                        )}
                      </p>

                      <p className="text-gray-500 text-xs">{i.date}</p>
                    </div>
                  </div>
                </li>
              </Link>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
