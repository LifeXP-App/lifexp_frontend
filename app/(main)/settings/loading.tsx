import Link from "next/link";

// Mirrors app/(main)/settings/page.tsx's own cold-load state exactly: the
// page shell always renders (it isn't itself gated behind a loading check),
// only the three account/notifications/appearance selects swap to
// SkeletonValue while `form` is still null.

function SkeletonValue() {
  return (
    <div className="h-10 w-32 rounded bg-gray-200 border border-gray-300 dark:border-[var(--border)] dark:bg-dark-2 animate-pulse" />
  );
}

export default function Loading() {
  return (
    <main className="flex overflow-y-auto w-full">
      <div className="w-full md:w-[calc(100%-420px)] flex-1 overflow-y-auto py-8 px-6 md:px-12">
        <h2 className="text-2xl font-medium text-left text-black dark:text-[var(--foreground)] mb-6">
          Settings
        </h2>

        {/* Account type */}
        <div className="flex justify-between w-full mb-4">
          <h2 className="text-l md:text-xl font-medium text-left text-black dark:text-[var(--foreground)] mb-2">
            Account Type
          </h2>

          <SkeletonValue />
        </div>

        {/* Notifications */}
        <div className="flex justify-between w-full mb-4">
          <h2 className="text-l md:text-xl font-medium text-left text-black dark:text-[var(--foreground)] mb-2">
            Notifications
          </h2>

          <SkeletonValue />
        </div>

        {/* Appearance */}
        <div className="flex justify-between w-full mb-8">
          <h2 className="text-l md:text-xl font-medium text-left text-black dark:text-[var(--foreground)] mb-2">
            Appearance
          </h2>

          <SkeletonValue />
        </div>
      </div>

      {/* Desktop right panel */}
      <aside className="w-[420px] p-6 hidden md:block overflow-y-auto">
        <div className="bg-white dark:bg-dark-2 p-6 mb-4 rounded-xl border-2 border-gray-200 dark:border-[var(--border)] flex flex-col gap-4">
          <h2 className="text-xl font-medium text-left text-black dark:text-[var(--foreground)] mb-2">
            Account
          </h2>

          <Link
            href="/u/edit"
            className="cursor-pointer active:opacity-80 text-l font-semibold text-left text-gray-800 dark:text-[var(--foreground)] hover:text-gray-600 dark:hover:text-[var(--muted)]"
          >
            Edit Profile
          </Link>

          <button
            disabled
            className="cursor-pointer active:opacity-80 text-l font-semibold text-left text-gray-800 dark:text-[var(--foreground)] hover:text-gray-600 dark:hover:text-[var(--muted)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Change Password
          </button>

          <button
            className="cursor-pointer active:opacity-80 text-l font-semibold text-left text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
          >
            Delete Account
          </button>
        </div>

        <div className="bg-white dark:bg-dark-2 p-6 mb-4 rounded-xl border-2 border-gray-200 dark:border-[var(--border)] flex flex-col gap-4">
          <a
            target="__blank"
            href="https://www.gamilife.com/community"
            className="cursor-pointer active:opacity-80 text-l font-semibold text-left text-gray-800 dark:text-[var(--foreground)] hover:text-gray-600 dark:hover:text-[var(--muted)]"
          >
            Send Review
          </a>

          <button
            className="cursor-pointer active:opacity-80 text-l font-semibold text-left text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
          >
            Log out
          </button>
        </div>
      </aside>
    </main>
  );
}
