// Mirrors app/(main)/u/edit/page.tsx's own EditProfileSkeleton exactly.

export default function Loading() {
  return (
    <main className="flex h-screen w-full overflow-hidden">
      <div className="mx-auto w-full p-8" style={{ width: "80%" }}>
        {/* Header */}
        <div className="mb-8 animate-pulse">
          <div className="h-6 w-40 rounded bg-gray-200 dark:bg-[var(--dark-2)]" />
        </div>

        {/* Profile picture section */}
        <div className="flex items-center gap-6 mb-8 animate-pulse">
          <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-[var(--dark-2)] border-2 border-gray-300 dark:border-[var(--border)]" />

          <div className="flex flex-col gap-3">
            <div className="h-10 w-36 rounded-md bg-gray-200 dark:bg-[var(--dark-2)] border border-gray-300 dark:border-[var(--border)]" />
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-[var(--dark-2)]" />
          </div>
        </div>

        {/* FORM FIELDS */}
        <div className="space-y-6 animate-pulse">
          {/* Username */}
          <div>
            <div className="h-4 w-24 mb-2 rounded bg-gray-200 dark:bg-[var(--dark-2)]" />
            <div className="rounded-lg border border-gray-300 dark:border-[var(--border)] bg-gray-100 dark:bg-[var(--dark-1)] p-1">
              <div className="h-11 w-full rounded-md bg-gray-200 dark:bg-[var(--dark-2)]" />
            </div>
          </div>

          {/* Display Name */}
          <div>
            <div className="h-4 w-32 mb-2 rounded bg-gray-200 dark:bg-[var(--dark-2)]" />
            <div className="rounded-lg border border-gray-300 dark:border-[var(--border)] bg-gray-100 dark:bg-[var(--dark-1)] p-1">
              <div className="h-11 w-full rounded-md bg-gray-200 dark:bg-[var(--dark-2)]" />
            </div>
          </div>

          {/* Title */}
          <div>
            <div className="h-4 w-16 mb-2 rounded bg-gray-200 dark:bg-[var(--dark-2)]" />
            <div className="rounded-lg border border-gray-300 dark:border-[var(--border)] bg-gray-100 dark:bg-[var(--dark-1)] p-1">
              <div className="h-11 w-full rounded-md bg-gray-200 dark:bg-[var(--dark-2)]" />
            </div>
          </div>

          {/* Bio */}
          <div>
            <div className="h-4 w-16 mb-2 rounded bg-gray-200 dark:bg-[var(--dark-2)]" />
            <div className="rounded-lg border border-gray-300 dark:border-[var(--border)] bg-gray-100 dark:bg-[var(--dark-1)] p-1">
              <div className="h-24 w-full rounded-md bg-gray-200 dark:bg-[var(--dark-2)]" />
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-4 mt-8 animate-pulse">
          <div className="h-10 w-28 rounded-lg bg-gray-300 dark:bg-[var(--dark-3)] border border-gray-400 dark:border-[var(--border)]" />
          <div className="h-10 w-32 rounded-lg bg-gray-400 dark:bg-[var(--dark-3)] border border-gray-500 dark:border-[var(--border)]" />
        </div>
      </div>
    </main>
  );
}
