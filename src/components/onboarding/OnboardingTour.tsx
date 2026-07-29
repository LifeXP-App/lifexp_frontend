"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  FlagIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { usePathname, useRouter } from "next/navigation";
import posthog from "posthog-js";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/src/context/AuthContext";

const TOUR_VERSION = "v1";
const MOBILE_BREAKPOINT = 768;
const SPOTLIGHT_GAP = 8;

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
  title: string;
  description: string;
  desktopTarget?: string;
  mobileTarget?: string;
  maxSpotlightHeight?: number;
};

const ASPECTS = [
  { short: "P", label: "Physique", color: "var(--aspect-physique)" },
  { short: "E", label: "Energy", color: "var(--aspect-energy)" },
  { short: "L", label: "Logic", color: "var(--aspect-logic)" },
  { short: "C", label: "Creativity", color: "var(--aspect-creativity)" },
  { short: "S", label: "Social", color: "var(--aspect-social)" },
];

function getCompletionKey(userId: number) {
  return `lifexp:onboarding:${TOUR_VERSION}:${userId}`;
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export function OnboardingTour() {
  const { me } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const checkedUserRef = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [dialogPosition, setDialogPosition] = useState<DialogPosition | null>(
    null,
  );

  const firstName = me?.fullname?.trim().split(/\s+/)[0] || me?.username || "there";

  const steps = useMemo<TourStep[]>(
    () => [
      {
        id: "welcome",
        title: `Welcome, ${firstName}`,
        description:
          "LifeXP turns focused effort into progress across five parts of your life.",
      },
      {
        id: "goals",
        title: "Start with a goal",
        description:
          "Give your effort a direction, then log focused sessions against it.",
        desktopTarget: '[data-onboarding="nav-goals"]',
        mobileTarget: '[data-onboarding="mobile-menu"]',
      },
      {
        id: "daily-pulse",
        title: "Keep your circle close",
        description:
          "See who is active, who is building a streak, and what friends are working on.",
        desktopTarget: '[data-onboarding="daily-pulse"]',
        mobileTarget: '[data-onboarding="daily-pulse"]',
        maxSpotlightHeight: 108,
      },
      {
        id: "feed",
        title: "Learn from the work",
        description:
          "The feed shows completed goals, live sessions, XP gains, and the effort behind them.",
        desktopTarget: '[data-onboarding="feed"]',
        mobileTarget: '[data-onboarding="feed"]',
        maxSpotlightHeight: 260,
      },
      {
        id: "ready",
        title: "Ready for your first XP?",
        description:
          "Create a goal, start a focused session, and LifeXP will track the progress.",
      },
    ],
    [firstName],
  );

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const removeReplayQuery = useCallback(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("tour")) return;
    url.searchParams.delete("tour");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const openTour = useCallback(
    (source: "automatic" | "replay") => {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      setCurrentStep(0);
      setIsOpen(true);
      posthog.capture("onboarding_tour_started", { source, version: TOUR_VERSION });
      if (source === "replay") removeReplayQuery();
    },
    [removeReplayQuery],
  );

  useEffect(() => {
    if (pathname !== "/" || !me?.id || isOpen) return;

    const replayRequested =
      new URLSearchParams(window.location.search).get("tour") === "1";

    if (replayRequested) {
      const replayTimer = window.setTimeout(() => openTour("replay"), 0);
      return () => window.clearTimeout(replayTimer);
    }

    if (checkedUserRef.current === me.id) return;
    checkedUserRef.current = me.id;

    const completionKey = getCompletionKey(me.id);
    if (window.localStorage.getItem(completionKey) === "complete") return;

    let cancelled = false;

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
            window.localStorage.setItem(completionKey, "complete");
            return;
          }
        }
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
      }

      if (!cancelled) openTour("automatic");
    };

    void checkServerCompletion();

    return () => {
      cancelled = true;
    };
  }, [isOpen, me?.id, openTour, pathname]);

  const persistCompletion = useCallback(
    (outcome: "completed" | "skipped") => {
      if (!me?.id) return;

      window.localStorage.setItem(getCompletionKey(me.id), "complete");
      posthog.capture(`onboarding_tour_${outcome}`, {
        version: TOUR_VERSION,
        step_id: step.id,
      });

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
    },
    [me, step.id],
  );

  const closeTour = useCallback(
    (outcome?: "completed" | "skipped") => {
      if (outcome) persistCompletion(outcome);
      setIsOpen(false);
      setSpotlight(null);
      setDialogPosition(null);
      window.setTimeout(() => previouslyFocusedRef.current?.focus(), 0);
    },
    [persistCompletion],
  );

  const handlePrimaryAction = () => {
    if (isLastStep) {
      persistCompletion("completed");
      setIsOpen(false);
      setSpotlight(null);
      setDialogPosition(null);
      router.push("/goals?new=1");
      return;
    }

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    posthog.capture("onboarding_tour_step_viewed", {
      version: TOUR_VERSION,
      step_id: steps[nextStep].id,
      step_number: nextStep + 1,
    });
  };

  const handleBack = () => {
    setCurrentStep((current) => Math.max(0, current - 1));
  };

  useEffect(() => {
    if (!isOpen) return;

    const updateSpotlight = () => {
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      const selector = isMobile ? step.mobileTarget : step.desktopTarget;

      if (!selector) {
        setSpotlight(null);
        setDialogPosition(null);
        return;
      }

      const target = document.querySelector<HTMLElement>(selector);
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

      const visibleHeight = Math.min(
        rect.height,
        step.maxSpotlightHeight ?? rect.height,
      );
      const top = Math.max(SPOTLIGHT_GAP, rect.top - SPOTLIGHT_GAP);
      const left = Math.max(SPOTLIGHT_GAP, rect.left - SPOTLIGHT_GAP);
      const right = Math.min(
        window.innerWidth - SPOTLIGHT_GAP,
        rect.right + SPOTLIGHT_GAP,
      );
      const bottom = Math.min(
        window.innerHeight - SPOTLIGHT_GAP,
        rect.top + visibleHeight + SPOTLIGHT_GAP,
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
          nextSpotlight.top +
            nextSpotlight.height / 2 -
            dialogHeight / 2,
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

      if (
        nextSpotlight.left >=
        dialogWidth + targetGap + viewportPadding
      ) {
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
          nextSpotlight.left +
            nextSpotlight.width / 2 -
            dialogWidth / 2,
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

    const targetSelector =
      window.innerWidth < MOBILE_BREAKPOINT
        ? step.mobileTarget
        : step.desktopTarget;
    const target = targetSelector
      ? document.querySelector<HTMLElement>(targetSelector)
      : null;
    const resizeObserver = target ? new ResizeObserver(updateSpotlight) : null;
    if (target && resizeObserver) resizeObserver.observe(target);
    if (dialogRef.current && resizeObserver) {
      resizeObserver.observe(dialogRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateSpotlight);
      resizeObserver?.disconnect();
    };
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    dialog?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeTour();
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

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeTour, currentStep, isOpen]);

  if (!isOpen) return null;

  const overlayColor = "rgba(9, 10, 15, 0.74)";

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
            className="pointer-events-none fixed z-[81] rounded-2xl border-2 border-[#7e9bff] shadow-[0_0_0_1px_rgba(255,255,255,0.35),0_12px_36px_rgba(24,45,108,0.35)]"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
            }}
          />
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
          className="fixed inset-0 z-[80] bg-[rgba(9,10,15,0.74)]"
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
        className={`tour-card fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 z-[90] max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 text-gray-950 shadow-[0_24px_80px_rgba(8,12,30,0.32)] outline-none dark:border-white/10 dark:bg-[#19191f] dark:text-[#f5f5f6] md:max-h-[calc(100dvh-3rem)] md:w-[370px] md:p-6 ${
          dialogPosition
            ? ""
            : "md:left-1/2 md:right-auto md:top-1/2 md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4168e2]/12 text-[#4168e2] dark:bg-[#7190f4]/15 dark:text-[#9db2ff]"
            aria-hidden="true"
          >
            {isLastStep ? (
              <FlagIcon className="h-5 w-5" />
            ) : (
              <SparklesIcon className="h-5 w-5" />
            )}
          </div>
          <button
            type="button"
            onClick={() => closeTour()}
            className="-mr-2 -mt-2 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-gray-500 transition-[color,background-color,transform] duration-150 hover:bg-gray-100 hover:text-gray-800 active:scale-[0.97] dark:text-gray-400 dark:hover:bg-white/8 dark:hover:text-white"
            aria-label="Close tutorial for now"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-[#4168e2] dark:text-[#9db2ff]">
            {currentStep + 1} of {steps.length}
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-[#4168e2] transition-transform duration-200 motion-reduce:transition-none"
              style={{
                transform: `scaleX(${(currentStep + 1) / steps.length})`,
                transformOrigin: "left",
              }}
            />
          </div>
        </div>

        <h2
          id="onboarding-title"
          className="mt-5 text-2xl font-semibold tracking-[-0.025em]"
        >
          {step.title}
        </h2>
        <p
          id="onboarding-description"
          className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300"
        >
          {step.description}
        </p>

        {step.id === "welcome" && (
          <div className="mt-5 grid grid-cols-5 gap-2" aria-label="Life aspects">
            {ASPECTS.map((aspect) => (
              <div key={aspect.label} className="min-w-0 text-center">
                <div
                  className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white"
                  style={{ backgroundColor: aspect.color }}
                  aria-hidden="true"
                >
                  {aspect.short}
                </div>
                <span className="mt-1.5 block truncate text-[10px] font-medium text-gray-500 dark:text-gray-400">
                  {aspect.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {step.id === "goals" && (
          <p className="mt-4 rounded-xl bg-[#4168e2]/8 px-3 py-2.5 text-xs font-medium leading-5 text-[#3154bd] dark:bg-[#7190f4]/10 dark:text-[#bdcaff] md:hidden">
            On mobile, Goals is inside the menu highlighted above.
          </p>
        )}

        {isLastStep && (
          <div className="mt-5 space-y-3">
            {["Choose a goal", "Focus in a session", "Watch your XP grow"].map(
              (item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-medium">
                  <CheckCircleIcon
                    className="h-5 w-5 shrink-0 text-[#4168e2] dark:text-[#9db2ff]"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </div>
              ),
            )}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700 transition-[background-color,transform] duration-150 hover:bg-gray-50 active:scale-[0.97] dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/6"
            >
              <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={() => closeTour("skipped")}
              className="h-11 cursor-pointer rounded-xl px-2 text-sm font-semibold text-gray-500 transition-[color,transform] duration-150 hover:text-gray-800 active:scale-[0.97] dark:text-gray-400 dark:hover:text-white"
            >
              Skip tour
            </button>
          )}

          <button
            type="button"
            onClick={handlePrimaryAction}
            className="ml-auto inline-flex h-11 min-w-28 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#4168e2] px-5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[#3459c7] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4168e2]"
          >
            {isLastStep ? "Create a goal" : "Continue"}
            {!isLastStep && (
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {isLastStep && (
          <button
            type="button"
            onClick={() => closeTour("completed")}
            className="mt-3 h-10 w-full cursor-pointer rounded-xl text-sm font-medium text-gray-500 transition-[color,transform] duration-150 hover:text-gray-800 active:scale-[0.98] dark:text-gray-400 dark:hover:text-white"
          >
            I will explore first
          </button>
        )}
      </div>
    </>
  );
}
