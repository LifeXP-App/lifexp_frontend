"use client";

import { LockClosedIcon } from "@heroicons/react/24/solid";

interface PrivateProfileNoticeProps {
  username: string;
}

export default function PrivateProfileNotice({ username }: PrivateProfileNoticeProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-gray-100 dark:bg-dark-3 rounded-full p-6 mb-4">
        <LockClosedIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold dark:text-white mb-2">
        This Account is Private
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
        Follow @{username} to see their activities, stats, and experiences.
      </p>
    </div>
  );
}
