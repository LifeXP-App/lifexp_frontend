"use client";
import Link from "next/link";

type SuggestedUser = {
  username: string;
  fullname: string;
  profile_picture: string;
  lifelevel: number;
};

type DiscoverUsersProps = {
    suggestedUsers: SuggestedUser[];
};

export function DiscoverUsers({ suggestedUsers }: DiscoverUsersProps) {
    return (
        <>
        
          {/* DISCOVER USERS */}
      <div className="bg-white p-6 rounded-xl border-2 border-gray-200 dark:bg-dark-2 dark:border-gray-900">
        <p className="text-md  font-semibold mb-4 dark:text-white">Discover players</p>

        <div className="flex flex-col gap-3">
          {suggestedUsers.map((u) => (
            <div
              key={u.username}
              className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-dark-2"
            >
              <Link href={`/user/${u.username}`} className="flex gap-2">
                <img
                  src={u.profile_picture}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div className="flex flex-col">
                  <p className="text-sm dark:text-white">{u.fullname}</p>
                  <p className="text-xs text-black/40 dark:text-white/40">
                    Life Level {u.lifelevel}
                  </p>
                </div>
              </Link>

              <button
                className="px-6 py-1 text-sm rounded-lg font-medium cursor-pointer active:opacity-80 text-white"
                style={{ backgroundColor: "#4168e2" }}
              >
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>
      </>
      );
}