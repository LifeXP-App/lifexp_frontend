"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { usePathname, useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { ACTIVITY_META, type ActivityType } from "@/src/lib/types/activityMeta";

const TOUR_VERSION = "v2";
const MOBILE_BREAKPOINT = 768;
const SPOTLIGHT_GAP = 8;
/** Below this, the anchor is scrolled too far off screen to be worth ringing. */
const MIN_SPOTLIGHT_HEIGHT = 32;
/** Anchors on the session screen mount after Convex resolves, so keep re-checking. */
const TARGET_POLL_MS = 400;
/** A walkthrough parked mid-flight this long ago is stale; start clean instead. */
const PROGRESS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const ASPECT_ORDER: ActivityType[] = [
  "physique",
  "energy",
  "logic",
  "creativity",
  "social",
];

/**
 * A chapter is a place in the app. The walkthrough parks itself between
 * chapters and picks up again when the user actually walks into the next one,
 * so it never has to fake a goal or a session to explain them.
 */
type Chapter = "home" | "goals" | "session" | "reflection";

const CHAPTER_LABELS: Record<Chapter, string> = {
  home: "Your feed",
  goals: "Goals",
  session: "Sessions",
  reflection: "Reflection",
};

type SpotlightRect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

type DialogPosition = {
  top: number;
  left: number;
};

type TourStep = {
  id: string;
  chapter: Chapter;
  title: string;
  description: string;
  /** First selector that resolves wins, so a step can fall back to a second anchor. */
  desktopTargets?: string[];
  mobileTargets?: string[];
  /** Stay hidden until the anchor exists — used where the page loads its data first. */
  requireTarget?: boolean;
  maxSpotlightHeight?: number;
  /** The session screen is always black, so its cards ignore the app theme. */
  onDark?: boolean;
  primaryLabel?: string;
  /** Small tinted line under the copy. */
  note?: string;
  /** For notes that only make sense next to the mobile anchor. */
  noteMobileOnly?: boolean;
  visual?: "aspects";
  navigateTo?: string;
  /** Advancing past this step means the user has seen the core walkthrough. */
  completesCore?: boolean;
};

function matchesChapter(chapter: Chapter, pathname: string) {
  switch (chapter) {
    case "home":
      return pathname === "/";
    case "goals":
      return pathname === "/goals";
    case "session":
      return /^\/goals\/[^/]+\/session\/[^/]+$/.test(pathname);
    case "reflection":
      return /^\/goals\/[^/]+\/session\/[^/]+\/reflection$/.test(pathname);
  }
}

function getCompletionKey(userId: number) {
  return `lifexp:onboarding:${TOUR_VERSION}:${userId}`;
}

function getProgressKey(userId: number) {
  return `lifexp:onboarding:${TOUR_VERSION}:${userId}:progress`;
}

function readProgress(userId: number): string | null {
  try {
    const raw = window.localStorage.getItem(getProgressKey(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { stepId?: string; updatedAt?: number };
    if (!parsed.stepId || typeof parsed.updatedAt !== "number") return null;

    if (Date.now() - parsed.updatedAt > PROGRESS_TTL_MS) {
      window.localStorage.removeItem(getProgressKey(userId));
      return null;
    }

    return parsed.stepId;
  } catch {
    return null;
  }
}

function writeProgress(userId: number, stepId: string) {
  try {
    window.localStorage.setItem(
      getProgressKey(userId),
      JSON.stringify({ stepId, updatedAt: Date.now() }),
    );
  } catch {
    // Private-mode storage failures should not break the walkthrough.
  }
}

function clearProgress(userId: number) {
  try {
    window.localStorage.removeItem(getProgressKey(userId));
  } catch {
    // Ignore — see writeProgress.
  }
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    ),
  );
}

function resolveTarget(selectors: string[] | undefined) {
  if (!selectors) return null;
  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) return element;
  }
  return null;
}

export function OnboardingTour() {
  const { me } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const bootstrappedUserRef = useRef<number | null>(null);
  const coreCompletedRef = useRef(false);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [dialogPosition, setDialogPosition] = useState<DialogPosition | null>(
    null,
  );

  const userId = me?.id ?? null;
  const firstName =
    me?.fullname?.trim().split(/\s+/)[0] || me?.username || "there";

  const steps = useMemo<TourStep[]>(
    () => [
      {
        id: "welcome",
        chapter: "home",
        title: `Welcome, ${firstName}`,
        description:
          "LifeXP turns focused effort into XP across five parts of your life.",
        visual: "aspects",
      },
      {
        id: "goals-nav",
        chapter: "home",
        title: "Goals are where it starts",
        description:
          "A goal gives your effort a direction. Every session you log lands under one.",
        desktopTargets: ['[data-onboarding="nav-goals"]'],
        mobileTargets: ['[data-onboarding="mobile-menu"]'],
        note: "On mobile, Goals lives inside the menu highlighted above.",
        noteMobileOnly: true,
      },
      {
        id: "daily-pulse",
        chapter: "home",
        title: "Keep your circle close",
        description:
          "See who is active, who is building a streak, and what friends are working on.",
        desktopTargets: ['[data-onboarding="daily-pulse"]'],
        mobileTargets: ['[data-onboarding="daily-pulse"]'],
        maxSpotlightHeight: 108,
      },
      {
        id: "feed",
        chapter: "home",
        title: "Learn from the work",
        description:
          "The feed shows completed goals, live sessions, XP gains, and the effort behind them.",
        desktopTargets: ['[data-onboarding="feed"]'],
        mobileTargets: ['[data-onboarding="feed"]'],
        maxSpotlightHeight: 260,
        primaryLabel: "Take me to Goals",
        navigateTo: "/goals",
      },
      {
        id: "goals-create",
        chapter: "goals",
        title: "Create your first goal",
        description:
          "Give it a title, an emoji, and a target. It takes about ten seconds.",
        desktopTargets: ['[data-onboarding="goals-create"]'],
        mobileTargets: ['[data-onboarding="goals-create"]'],
      },
      {
        id: "goals-session",
        chapter: "goals",
        title: "Sessions earn the XP",
        description:
          "Pick an activity and a timer starts. Focused minutes turn into XP for the aspects that activity trains.",
        desktopTargets: [
          '[data-onboarding="goal-session-cta"]',
          '[data-onboarding="goals-empty-session"]',
        ],
        mobileTargets: [
          '[data-onboarding="goal-session-cta"]',
          '[data-onboarding="goals-empty-session"]',
        ],
        note: "No goal yet? Empty Session logs focused time on its own.",
      },
      {
        id: "goals-ready",
        chapter: "goals",
        title: "Start one when you are ready",
        description:
          "The moment you are inside a session, I will point out the timer, your live XP, and how to wrap up.",
        primaryLabel: "Got it",
        completesCore: true,
      },
      {
        id: "session-timer",
        chapter: "session",
        title: "This is the session",
        description:
          "The clock runs while you focus. Space pauses it, and the two buttons above nudge it by a minute.",
        desktopTargets: ['[data-onboarding="session-timer"]'],
        mobileTargets: ['[data-onboarding="session-timer"]'],
        requireTarget: true,
        onDark: true,
      },
      {
        id: "session-xp",
        chapter: "session",
        title: "XP builds as you go",
        description:
          "This is what the session has earned so far. Tap it to see the split across aspects.",
        desktopTargets: ['[data-onboarding="session-xp"]'],
        mobileTargets: ['[data-onboarding="session-xp"]'],
        requireTarget: true,
        onDark: true,
      },
      {
        id: "session-controls",
        chapter: "session",
        title: "Finish, pause, or discard",
        description:
          "Finish saves the session and opens your reflection. Discard throws the time away.",
        desktopTargets: ['[data-onboarding="session-controls"]'],
        mobileTargets: ['[data-onboarding="session-controls"]'],
        requireTarget: true,
        onDark: true,
        primaryLabel: "Got it",
      },
      {
        id: "reflection-share",
        chapter: "reflection",
        title: "Close the loop",
        description:
          "Add a snapshot of what you did. Your image, XP, and focused time become a post your friends can nudge.",
        desktopTargets: ['[data-onboarding="reflection-share"]'],
        mobileTargets: ['[data-onboarding="reflection-share"]'],
        requireTarget: true,
        maxSpotlightHeight: 280,
        primaryLabel: "Finish",
      },
    ],
    [firstName],
  );

  const stepIndex = activeStepId
    ? steps.findIndex((candidate) => candidate.id === activeStepId)
    : -1;
  const step = stepIndex >= 0 ? steps[stepIndex] : null;
  const onRoute = step ? matchesChapter(step.chapter, pathname) : false;
  const chapterSteps = step
    ? steps.filter((candidate) => candidate.chapter === step.chapter)
    : [];
  const chapterIndex = step
    ? chapterSteps.findIndex((candidate) => candidate.id === step.id)
    : -1;
  const isLastStep = stepIndex >= 0 && stepIndex === steps.length - 1;
  const hasSpotlightTargets = Boolean(
    step?.desktopTargets || step?.mobileTargets,
  );
  const isVisible = Boolean(
    step && onRoute && (!step.requireTarget || spotlight),
  );

  const removeReplayQuery = useCallback(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("tour")) return;
    url.searchParams.delete("tour");
    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, []);

  const goToStep = useCallback(
    (stepId: string | null) => {
      setActiveStepId(stepId);
      if (!userId) return;
      if (stepId) writeProgress(userId, stepId);
      else clearProgress(userId);
    },
    [userId],
  );

  const openTour = useCallback(
    (source: "automatic" | "replay") => {
      previouslyFocusedRef.current =
        document.activeElement as HTMLElement | null;

      // A replay from a session or goals page should start with that chapter.
      const entryStep =
        steps.find((candidate) => matchesChapter(candidate.chapter, pathname)) ??
        steps[0];

      goToStep(entryStep.id);
      posthog.capture("onboarding_tour_started", {
        source,
        version: TOUR_VERSION,
        step_id: entryStep.id,
      });
      if (source === "replay") removeReplayQuery();
    },
    [goToStep, pathname, removeReplayQuery, steps],
  );

  /** Marks the walkthrough as seen without ending it, so home stops auto-starting it. */
  const markCoreComplete = useCallback(() => {
    if (!userId || coreCompletedRef.current) return;
    coreCompletedRef.current = true;

    window.localStorage.setItem(getCompletionKey(userId), "complete");

    const saveServerCompletion = async () => {
      const response = await fetch("/api/users/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_complete: true }),
      });

      if (response.ok) return;

      await fetch("/api/users/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intro_complete: true }),
      });
    };

    void saveServerCompletion().catch((error) => {
      console.error("Failed to save onboarding status:", error);
    });
  }, [userId]);

  const closeTour = useCallback(
    (outcome?: "completed" | "skipped") => {
      if (outcome) {
        markCoreComplete();
        posthog.capture(`onboarding_tour_${outcome}`, {
          version: TOUR_VERSION,
          step_id: step?.id,
          chapter: step?.chapter,
        });
      }

      goToStep(null);
      setSpotlight(null);
      setDialogPosition(null);
      window.setTimeout(() => previouslyFocusedRef.current?.focus(), 0);
    },
    [goToStep, markCoreComplete, step?.chapter, step?.id],
  );

  // ── Start the walkthrough, or pick it back up where the user parked it ──
  // The ref keeps this to one attempt per user. Deferred work runs in a
  // microtask with no cleanup on purpose: under Strict Mode the first pass's
  // cleanup would otherwise cancel the only opening the second pass allows.
  useEffect(() => {
    if (!userId || activeStepId) return;
    if (bootstrappedUserRef.current === userId) return;

    const replayRequested =
      new URLSearchParams(window.location.search).get("tour") === "1";

    if (replayRequested) {
      bootstrappedUserRef.current = userId;
      void Promise.resolve().then(() => openTour("replay"));
      return;
    }

    const parkedStepId = readProgress(userId);
    if (parkedStepId) {
      bootstrappedUserRef.current = userId;
      if (steps.some((candidate) => candidate.id === parkedStepId)) {
        previouslyFocusedRef.current =
          document.activeElement as HTMLElement | null;
        void Promise.resolve().then(() => setActiveStepId(parkedStepId));
        return;
      }
      clearProgress(userId);
    }

    // Only the feed auto-starts a fresh walkthrough.
    if (pathname !== "/") return;
    bootstrappedUserRef.current = userId;

    if (window.localStorage.getItem(getCompletionKey(userId)) === "complete") {
      coreCompletedRef.current = true;
      return;
    }

    const checkServerCompletion = async () => {
      try {
        const response = await fetch("/api/users/settings", {
          method: "GET",
          cache: "no-store",
        });

        if (response.ok) {
          const settings = (await response.json()) as {
            onboarding_complete?: boolean;
            intro_complete?: boolean;
          };
          const complete =
            settings.onboarding_complete ?? settings.intro_complete ?? false;

          if (complete) {
            window.localStorage.setItem(getCompletionKey(userId), "complete");
            coreCompletedRef.current = true;
            return;
          }
        }
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
      }

      openTour("automatic");
    };

    void checkServerCompletion();
  }, [activeStepId, openTour, pathname, steps, userId]);

  // ── Follow the user: walking into a later chapter advances the walkthrough ──
  useEffect(() => {
    if (!step || onRoute) return;

    const nextIndex = steps.findIndex(
      (candidate, index) =>
        index > stepIndex && matchesChapter(candidate.chapter, pathname),
    );
    if (nextIndex < 0) return;

    const followTimer = window.setTimeout(() => {
      goToStep(steps[nextIndex].id);
      posthog.capture("onboarding_tour_chapter_entered", {
        version: TOUR_VERSION,
        step_id: steps[nextIndex].id,
        chapter: steps[nextIndex].chapter,
      });
    }, 0);

    return () => window.clearTimeout(followTimer);
  }, [goToStep, onRoute, pathname, step, stepIndex, steps]);

  // ── Bring the anchor into view when a step becomes active ──
  useEffect(() => {
    if (!step || !onRoute || !hasSpotlightTargets) return;

    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    const target = resolveTarget(
      isMobile ? step.mobileTargets : step.desktopTargets,
    );
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const bandHeight = Math.min(
      rect.height,
      step.maxSpotlightHeight ?? rect.height,
    );

    // Only the highlighted band has to be on screen, not the whole element —
    // anchors like the feed wrapper are taller than the viewport.
    if (rect.top >= 0 && rect.top + bandHeight <= window.innerHeight) return;

    target.scrollIntoView({
      behavior: "smooth",
      // Centering something taller than the viewport scrolls its top out of sight.
      block: bandHeight >= window.innerHeight * 0.6 ? "start" : "center",
    });
  }, [hasSpotlightTargets, onRoute, step]);

  // ── Track the anchor and place the card beside it ──
  useEffect(() => {
    const clearPlacement = () => {
      setSpotlight(null);
      setDialogPosition(null);
    };

    if (!step || !onRoute) {
      clearPlacement();
      return;
    }

    const updateSpotlight = () => {
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      const target = resolveTarget(
        isMobile ? step.mobileTargets : step.desktopTargets,
      );

      if (!target) {
        setSpotlight(null);
        setDialogPosition(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        setSpotlight(null);
        setDialogPosition(null);
        return;
      }

      // Track the visible band of the target. Measuring from rect.top alone
      // collapses the ring to nothing once a tall anchor scrolls past the top.
      const bandTop = Math.max(rect.top, 0);
      const bandBottom = Math.min(
        rect.bottom,
        window.innerHeight,
        bandTop + (step.maxSpotlightHeight ?? rect.height),
      );

      if (bandBottom - bandTop < MIN_SPOTLIGHT_HEIGHT) {
        setSpotlight(null);
        setDialogPosition(null);
        return;
      }

      const top = Math.max(SPOTLIGHT_GAP, bandTop - SPOTLIGHT_GAP);
      const left = Math.max(SPOTLIGHT_GAP, rect.left - SPOTLIGHT_GAP);
      const right = Math.min(
        window.innerWidth - SPOTLIGHT_GAP,
        rect.right + SPOTLIGHT_GAP,
      );
      const bottom = Math.min(
        window.innerHeight - SPOTLIGHT_GAP,
        bandBottom + SPOTLIGHT_GAP,
      );

      const nextSpotlight = {
        top,
        left,
        right,
        bottom,
        width: Math.max(0, right - left),
        height: Math.max(0, bottom - top),
      };
      setSpotlight(nextSpotlight);

      if (isMobile) {
        setDialogPosition(null);
        return;
      }

      const viewportPadding = 24;
      const targetGap = 18;
      const dialogWidth = dialogRef.current?.offsetWidth || 370;
      const dialogHeight = dialogRef.current?.offsetHeight || 340;
      const maximumTop = Math.max(
        viewportPadding,
        window.innerHeight - dialogHeight - viewportPadding,
      );
      const centeredTop = Math.min(
        maximumTop,
        Math.max(
          viewportPadding,
          nextSpotlight.top + nextSpotlight.height / 2 - dialogHeight / 2,
        ),
      );

      if (
        window.innerWidth - nextSpotlight.right >=
        dialogWidth + targetGap + viewportPadding
      ) {
        setDialogPosition({
          top: centeredTop,
          left: nextSpotlight.right + targetGap,
        });
        return;
      }

      if (nextSpotlight.left >= dialogWidth + targetGap + viewportPadding) {
        setDialogPosition({
          top: centeredTop,
          left: nextSpotlight.left - dialogWidth - targetGap,
        });
        return;
      }

      const centeredLeft = Math.min(
        window.innerWidth - dialogWidth - viewportPadding,
        Math.max(
          viewportPadding,
          nextSpotlight.left + nextSpotlight.width / 2 - dialogWidth / 2,
        ),
      );

      if (
        window.innerHeight - nextSpotlight.bottom >=
        dialogHeight + targetGap + viewportPadding
      ) {
        setDialogPosition({
          top: nextSpotlight.bottom + targetGap,
          left: centeredLeft,
        });
        return;
      }

      setDialogPosition({
        top: Math.max(
          viewportPadding,
          nextSpotlight.top - dialogHeight - targetGap,
        ),
        left: centeredLeft,
      });
    };

    updateSpotlight();
    window.addEventListener("resize", updateSpotlight);
    // Pages scroll inside their own containers, so listen in the capture phase.
    window.addEventListener("scroll", updateSpotlight, true);
    // Anchors can mount late (Convex) or move (live timer, feed images).
    const poll = window.setInterval(updateSpotlight, TARGET_POLL_MS);

    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    const target = resolveTarget(
      isMobile ? step.mobileTargets : step.desktopTargets,
    );
    const resizeObserver = new ResizeObserver(updateSpotlight);
    if (target) resizeObserver.observe(target);
    if (dialogRef.current) resizeObserver.observe(dialogRef.current);

    return () => {
      window.removeEventListener("resize", updateSpotlight);
      window.removeEventListener("scroll", updateSpotlight, true);
      window.clearInterval(poll);
      resizeObserver.disconnect();
    };
  }, [onRoute, step]);

  // ── Focus trap. Capture phase, because the session screen binds Space/Escape too ──
  useEffect(() => {
    if (!isVisible) return;

    const dialog = dialogRef.current;
    dialog?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeTour();
        return;
      }

      // Space would pause the live session behind the card.
      if (event.code === "Space" && dialog?.contains(document.activeElement)) {
        event.stopPropagation();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;

      const elements = getFocusableElements(dialog);
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [activeStepId, closeTour, isVisible]);

  if (!step || !isVisible) return null;

  const handlePrimaryAction = () => {
    const nextStep = steps[stepIndex + 1];

    if (!nextStep) {
      closeTour("completed");
      return;
    }

    if (step.completesCore) markCoreComplete();

    goToStep(nextStep.id);
    posthog.capture("onboarding_tour_step_viewed", {
      version: TOUR_VERSION,
      step_id: nextStep.id,
      chapter: nextStep.chapter,
      step_number: stepIndex + 2,
    });

    if (step.navigateTo) router.push(step.navigateTo);
  };

  const handleBack = () => {
    if (chapterIndex <= 0) return;
    goToStep(chapterSteps[chapterIndex - 1].id);
  };

  const onDark = Boolean(step.onDark);
  const overlayColor = onDark ? "rgba(0, 0, 0, 0.68)" : "rgba(9, 10, 15, 0.74)";
  const accent = "var(--rookie-primary)";
  const accentSoft = "rgba(var(--rookie-primary-rgb), 0.12)";
  // The session screen is black regardless of theme, so its ring is always white.
  const ringBorder = onDark
    ? "border-white"
    : "border-[var(--rookie-primary)] dark:border-white";
  const cardSurface = onDark
    ? "border-white/10 bg-[#14141a] text-[#f5f5f6]"
    : "border-gray-200 bg-white text-gray-950 dark:border-white/10 dark:bg-[#19191f] dark:text-[#f5f5f6]";
  const mutedText = onDark
    ? "text-gray-400"
    : "text-gray-600 dark:text-gray-300";
  const trackColor = onDark ? "bg-white/12" : "bg-gray-200 dark:bg-white/10";
  const closeButton = onDark
    ? "text-gray-400 hover:bg-white/8 hover:text-white"
    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/8 dark:hover:text-white";
  const quietButton = onDark
    ? "text-gray-400 hover:text-white"
    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white";
  const backButton = onDark
    ? "border-white/15 text-gray-200 hover:bg-white/6"
    : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/6";

  return (
    <>
      {spotlight ? (
        <div aria-hidden="true">
          <div
            className="fixed inset-x-0 top-0 z-[80]"
            style={{ height: spotlight.top, backgroundColor: overlayColor }}
          />
          <div
            className="fixed left-0 z-[80]"
            style={{
              top: spotlight.top,
              width: spotlight.left,
              height: spotlight.height,
              backgroundColor: overlayColor,
            }}
          />
          <div
            className="fixed right-0 z-[80]"
            style={{
              top: spotlight.top,
              left: spotlight.right,
              height: spotlight.height,
              backgroundColor: overlayColor,
            }}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-[80]"
            style={{ top: spotlight.bottom, backgroundColor: overlayColor }}
          />
          <div
            className={`tour-ring pointer-events-none fixed z-[81] rounded-2xl border-2 ${ringBorder}`}
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
            }}
          />
          {/* Keeps the highlighted control from being clicked mid-explanation. */}
          <div
            aria-hidden="true"
            className="fixed z-[82]"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
            }}
          />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[80]"
          style={{ backgroundColor: overlayColor }}
        />
      )}

      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
        style={
          dialogPosition
            ? {
                top: dialogPosition.top,
                left: dialogPosition.left,
                right: "auto",
                bottom: "auto",
                // Tailwind v4 centering utilities use the CSS `translate` property,
                // so `transform: none` alone would not cancel them.
                transform: "none",
                translate: "none",
              }
            : undefined
        }
        className={`tour-card fixed bottom-[max(5rem,calc(4.25rem+env(safe-area-inset-bottom)))] left-3 right-3 z-[90] max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl border p-5 shadow-[0_24px_80px_rgba(8,12,30,0.32)] outline-none md:bottom-[max(0.75rem,env(safe-area-inset-bottom))] md:max-h-[calc(100dvh-3rem)] md:w-[370px] md:p-6 ${cardSurface} ${
          dialogPosition
            ? ""
            : "md:left-1/2 md:right-auto md:top-1/2 md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <p
            className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: accent }}
          >
            {CHAPTER_LABELS[step.chapter]}
            {chapterSteps.length > 1 && (
              <span className={onDark ? "text-gray-500" : "text-gray-400"}>
                {" · "}
                {chapterIndex + 1} of {chapterSteps.length}
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={() => closeTour()}
            className={`-mr-2 -mt-2 inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-[color,background-color,transform] duration-150 active:scale-[0.97] ${closeButton}`}
            aria-label="Close tutorial for now"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className={`mt-3 h-1 overflow-hidden rounded-full ${trackColor}`}>
          <div
            className="h-full rounded-full transition-transform duration-200 motion-reduce:transition-none"
            style={{
              backgroundColor: accent,
              transform: `scaleX(${(chapterIndex + 1) / chapterSteps.length})`,
              transformOrigin: "left",
            }}
          />
        </div>

        <h2
          id="onboarding-title"
          className="mt-5 text-2xl font-semibold tracking-[-0.025em]"
        >
          {step.title}
        </h2>
        <p
          id="onboarding-description"
          className={`mt-2 text-sm leading-6 ${mutedText}`}
        >
          {step.description}
        </p>

        {step.visual === "aspects" && (
          <div
            className="mt-5 grid grid-cols-5 gap-2"
            aria-label="The five life aspects"
          >
            {ASPECT_ORDER.map((aspect) => {
              const meta = ACTIVITY_META[aspect];
              return (
                <div key={aspect} className="min-w-0 text-center">
                  <div
                    className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `rgba(${meta.cssColorVarRgb}, 0.16)`,
                      color: meta.cssColorVar,
                    }}
                    aria-hidden="true"
                  >
                    {meta.icon}
                  </div>
                  <span
                    className={`mt-1.5 block truncate text-[10px] font-medium ${
                      onDark ? "text-gray-400" : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {step.note && (
          <p
            className={`mt-4 rounded-xl px-3 py-2.5 text-xs font-medium leading-5 ${
              step.noteMobileOnly ? "md:hidden" : ""
            }`}
            style={{ backgroundColor: accentSoft, color: accent }}
          >
            {step.note}
          </p>
        )}

        <div className="mt-6 flex items-center gap-3">
          {chapterIndex > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className={`inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-[background-color,transform] duration-150 active:scale-[0.97] ${backButton}`}
            >
              <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => closeTour("skipped")}
              className={`h-11 cursor-pointer rounded-xl px-2 text-sm font-semibold transition-[color,transform] duration-150 active:scale-[0.97] ${quietButton}`}
            >
              Skip tour
            </button>
          )}

          <button
            type="button"
            onClick={handlePrimaryAction}
            className="ml-auto inline-flex h-11 min-w-28 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 text-sm font-semibold text-white transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ backgroundColor: accent, outlineColor: accent }}
          >
            {step.primaryLabel ?? (isLastStep ? "Finish" : "Continue")}
            {!step.primaryLabel && !isLastStep && (
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
