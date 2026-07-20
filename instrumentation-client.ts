import posthog from "posthog-js";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  defaults: "2026-01-30",
  capture_exceptions: true,
  debug: process.env.NODE_ENV === "development",
  // Neither feature is used anywhere in the app; both default to enabled,
  // so leaving them unset was silently allowing the recorder/surveys
  // scripts to load and run for every visitor.
  disable_session_recording: true,
  disable_surveys: true,
});
