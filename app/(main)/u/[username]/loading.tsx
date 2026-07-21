// Mirrors app/(main)/u/[username]/page.tsx's own `if (isLoading)` skeleton
// return exactly.

export default function Loading() {
  return (
    <main
      className="w-full flex flex-col md:flex-row overflow-y-auto bg-gray-100 dark:bg-dark-1 animate-pulse"
      style={{ minHeight: "calc(100vh - 60px)" }}
    >
      <div className="w-full px-4 py-4 sm:px-6 md:px-8 lg:px-12 xl:px-24">
        {/* PROFILE HEADER SKELETON */}
        <div className="relative rounded-xl flex flex-col md:flex-row justify-between w-full mb-4 animate-pulse">
          <div className="pt-2 sm:p-2 mb-4 flex flex-col gap-2 w-full">
            <div className="flex flex-row items-center gap-4 sm:gap-8 w-full mb-4">
              {/* Avatar */}
              <div className="shrink-0">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gray-200 dark:bg-dark-3" />
              </div>

              {/* Name + stats */}
              <div className="flex flex-col w-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-32 rounded bg-gray-200 dark:bg-dark-3" />
                  <div className="h-4 w-24 rounded bg-gray-200 dark:bg-dark-3" />
                </div>

                <div className="h-3 w-40 rounded bg-gray-200 dark:bg-dark-3 mb-4" />

                <div className="mt-4 flex gap-6 sm:gap-8 text-sm">
                  <div className="text-center sm:text-left">
                    <div className="h-4 w-10 rounded bg-gray-200 dark:bg-dark-3 mx-auto sm:mx-0" />
                    <div className="h-3 w-12 rounded bg-gray-200 dark:bg-dark-3 mt-2 mx-auto sm:mx-0" />
                  </div>

                  <div className="text-center sm:text-left">
                    <div className="h-4 w-10 rounded bg-gray-200 dark:bg-dark-3 mx-auto sm:mx-0" />
                    <div className="h-3 w-16 rounded bg-gray-200 dark:bg-dark-3 mt-2 mx-auto sm:mx-0" />
                  </div>

                  <div className="text-center sm:text-left">
                    <div className="h-4 w-10 rounded bg-gray-200 dark:bg-dark-3 mx-auto sm:mx-0" />
                    <div className="h-3 w-16 rounded bg-gray-200 dark:bg-dark-3 mt-2 mx-auto sm:mx-0" />
                  </div>
                </div>
              </div>
            </div>

            {/* Title + bio */}
            <div className="h-4 w-3/5 rounded bg-gray-200 dark:bg-dark-3 mt-2" />
            <div className="h-3 w-4/5 rounded bg-gray-200 dark:bg-dark-3 mt-2" />
            <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-dark-3 mt-2" />

            {/* Ongoing goals skeleton pills */}
            <div className="mt-4">
              <div className="h-3 w-28 rounded bg-gray-200 dark:bg-dark-3 mb-3" />
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full bg-gray-200 dark:bg-dark-3 w-24 h-7"
                  />
                ))}
              </div>
            </div>

            {/* Buttons skeleton */}
            <span className="flex flex-col sm:flex-row md:gap-2 gap-4 items-center w-full mt-2 sm:mt-4">
              <div className="w-48 h-10 rounded-lg bg-gray-200 dark:bg-dark-3" />
              <div className="w-48 h-10 rounded-lg bg-gray-200 dark:bg-dark-3" />
            </span>
          </div>

          {/* Desktop chart skeleton */}
          <div className="hidden xl:flex w-full focus:outline-none justify-end p-4 sm:p-6 overflow-visible">
            <div className="w-full max-w-[360px] h-[320px] overflow-visible py-6">
              <div className="w-full h-full rounded-xl bg-gray-200 dark:bg-dark-3" />
            </div>
          </div>
        </div>

        {/* Mobile chart skeleton */}
        <div className="xl:hidden my-4 flex justify-center w-full animate-pulse">
          <div className="w-full bg-white dark:bg-dark-2 rounded-xl border-2 border-gray-200 dark:border-[var(--border)] p-6">
            <div className="mx-auto w-full max-w-[280px] h-72 rounded-xl bg-gray-200 dark:bg-dark-3" />
          </div>
        </div>

        {/* STREAK / LEVEL / XP skeleton cards */}
        <div className="my-4 flex flex-col sm:flex-row justify-between text-sm gap-4 animate-pulse">
          <div className="bg-white dark:bg-dark-2 border-2 rounded-xl border-gray-200 dark:border-gray-900 w-full p-4">
            <div className="h-3 w-24 rounded bg-gray-200 dark:bg-dark-3 mb-3" />
            <div className="h-5 w-16 rounded bg-gray-200 dark:bg-dark-3" />
          </div>

          <div className="bg-white dark:bg-dark-2 border-2 rounded-xl border-gray-200 dark:border-gray-900 w-full p-4">
            <div className="h-4 w-28 rounded bg-gray-200 dark:bg-dark-3 mb-3" />
            <div className="h-3 w-40 rounded bg-gray-200 dark:bg-dark-3" />
          </div>

          <div className="bg-gray-200 dark:bg-dark-2 border-2 rounded-xl border-gray-200 dark:border-gray-900 w-full p-4 animate-pulse">
            <div className="h-5 w-28 rounded bg-gray-300 dark:bg-dark-3 mb-3" />
            <div className="h-3 w-44 rounded bg-gray-300 dark:bg-dark-3" />
          </div>
        </div>

        {/* Weekly XP chart skeleton */}
        <div className="p-4 sm:p-6 my-4 bg-white dark:bg-dark-2 dark:border-gray-900 border-2 border-gray-200 rounded-2xl w-full animate-pulse">
          <div className="flex justify-between items-center mb-4">
            <span className="flex gap-3 items-center">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-dark-3" />
              <div className="h-4 w-40 rounded bg-gray-200 dark:bg-dark-3" />
            </span>
          </div>

          <div className="relative h-48 sm:h-64 rounded-xl bg-gray-200 dark:bg-dark-3" />
        </div>

        {/* Top Activities + Recent Sessions skeleton */}
        <div className="flex flex-col md:flex-row gap-4 animate-pulse">
          <div className="p-4 sm:p-6 my-2 bg-white border-2 border-gray-200 dark:bg-dark-2 dark:border-gray-900 rounded-2xl w-full">
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-dark-3 mb-6" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="h-4 w-4 rounded bg-gray-200 dark:bg-dark-3" />
                  <div className="h-10 w-10 rounded bg-gray-200 dark:bg-dark-3" />
                  <div className="h-4 w-40 rounded bg-gray-200 dark:bg-dark-3" />
                </div>
                <div className="h-4 w-14 rounded bg-gray-200 dark:bg-dark-3" />
              </div>
            ))}
          </div>

          <div className="p-4 sm:p-6 my-2 bg-white border-2 border-gray-200 dark:bg-dark-2 dark:border-gray-900 rounded-2xl w-full">
            <div className="h-4 w-36 rounded bg-gray-200 dark:bg-dark-3 mb-6" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-3 rounded-lg mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-gray-200 dark:bg-dark-3" />
                    <div>
                      <div className="h-4 w-44 rounded bg-gray-200 dark:bg-dark-3 mb-2" />
                      <div className="h-3 w-24 rounded bg-gray-200 dark:bg-dark-3" />
                    </div>
                  </div>
                  <div className="h-4 w-14 rounded bg-gray-200 dark:bg-dark-3" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements skeleton */}
        <div className="max-w-6xl mx-auto px-2 p-2 pb-12 my-4 rounded-sm w-full animate-pulse">
          <div className="h-5 w-36 rounded bg-gray-200 dark:bg-[var(--dark-2)] mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden"
              >
                <div className="h-36 bg-gray-200 dark:bg-[var(--dark-2)]" />
                <div className="p-4 bg-white dark:bg-[#151618] border border-gray-200 dark:border-[var(--border)] border-t-0 rounded-b-2xl">
                  <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-[var(--dark-2)] mb-3" />
                  <div className="h-3 w-full rounded bg-gray-200 dark:bg-[var(--dark-2)] mb-2" />
                  <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-[var(--dark-2)] mb-4" />
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1,2,3,4,5].map((j) => (
                      <div key={j} className="h-8 rounded-lg bg-gray-200 dark:bg-[var(--dark-2)]" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
