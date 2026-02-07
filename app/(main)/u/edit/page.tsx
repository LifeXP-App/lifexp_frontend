"use client";

import { useAuth } from "@/src/context/AuthContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
function EditProfileSkeleton() {
  return (
    <main className="flex h-screen w-full overflow-hidden">
      <div className="mx-auto w-full p-8" style={{ width: "80%" }}>
        {/* Header */}
        <div className="mb-8 animate-pulse">
          <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-800" />
        </div>

        {/* Profile picture section */}
        <div className="flex items-center gap-6 mb-8 animate-pulse">
          <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700" />

          <div className="flex flex-col gap-3">
            <div className="h-10 w-36 rounded-md bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700" />
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>

        {/* FORM FIELDS */}
        <div className="space-y-6 animate-pulse">
          {/* Username */}
          <div>
            <div className="h-4 w-24 mb-2 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 p-1">
              <div className="h-11 w-full rounded-md bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>

          {/* Display Name */}
          <div>
            <div className="h-4 w-32 mb-2 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 p-1">
              <div className="h-11 w-full rounded-md bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>

          {/* Title */}
          <div>
            <div className="h-4 w-16 mb-2 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 p-1">
              <div className="h-11 w-full rounded-md bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>

          {/* Bio */}
          <div>
            <div className="h-4 w-16 mb-2 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 p-1">
              <div className="h-24 w-full rounded-md bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-4 mt-8 animate-pulse">
          <div className="h-10 w-28 rounded-lg bg-gray-300 dark:bg-gray-700 border border-gray-400 dark:border-gray-600" />
          <div className="h-10 w-32 rounded-lg bg-gray-400 dark:bg-gray-600 border border-gray-500 dark:border-gray-500" />
        </div>
      </div>
    </main>
  );
}

export default function EditProfilePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const { me, loading: authLoading } = useAuth();

  /* ---------------- STATE ---------------- */

  const [loading, setLoading] = useState(true);

  const [initialForm, setInitialForm] = useState<{
    username: string;
    fullname: string;
    title: string;
    bio: string;
  } | null>(null);

  const [form, setForm] = useState({
    username: "",
    fullname: "",
    title: "",
    bio: "",
  });

  const [initialPreview, setInitialPreview] = useState("");
  const [profilePreview, setProfilePreview] = useState("");

  // popup
  const [showDiscardPopup, setShowDiscardPopup] = useState(false);

  /* ---------------- LOAD PROFILE ---------------- */

  useEffect(() => {
    if (authLoading) return;
    if (!me) return;

    const loadProfile = async () => {
      try {
        const res = await fetch(`/api/users/${me.id}`, {
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = await res.json();

        const baseForm = {
          username: data.username,
          fullname: data.fullname || "",
          title: data.title || "",
          bio: data.bio || "",
        };

        setInitialForm(baseForm);
        setForm(baseForm);

        const pic = data.profile_picture || "/default_pfp.png";
        setInitialPreview(pic);
        setProfilePreview(pic);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [authLoading, me]);

  /* ---------------- DIRTY CHECK ---------------- */

  const isDirty = useMemo(() => {
    if (!initialForm) return false;

    const formChanged =
      form.fullname !== initialForm.fullname ||
      form.title !== initialForm.title ||
      form.bio !== initialForm.bio;

    const photoChanged = profilePreview !== initialPreview;

    return formChanged || photoChanged;
  }, [form, profilePreview, initialForm, initialPreview]);

  /* ---------------- IMAGE HANDLERS ---------------- */

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setProfilePreview(url);
  };

  const removeProfile = () => {
    setProfilePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetToInitial = () => {
    if (!initialForm) return;
    setForm(initialForm);
    setProfilePreview(initialPreview);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ---------------- DISCARD ---------------- */

  const handleDiscardClick = () => {
    if (!isDirty) {
      router.back();
      return;
    }
    setShowDiscardPopup(true);
  };

  const confirmDiscard = () => {
    setShowDiscardPopup(false);
    resetToInitial();
    router.back();
  };

  const cancelDiscard = () => {
    setShowDiscardPopup(false);
  };

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me) return;

    const res = await fetch(`/api/users/${me.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullname: form.fullname,
        title: form.title,
        bio: form.bio,
      }),
    });

    if (!res.ok) return;

    const updated = await res.json();
    router.push(`/u/${me.username}`);
  };

  /* ---------------- UNLOAD WARNING ---------------- */

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  /* ---------------- GUARD ---------------- */

  if (authLoading || loading || !initialForm) {
    return <EditProfileSkeleton />;
  }

  /* ---------------- UI (UNCHANGED) ---------------- */

  return (
    <>
      <main className="flex h-screen w-full overflow-hidden">
        <div className="mx-auto w-full p-8" style={{ width: "80%" }}>
          <h2 className="mb-6 text-2xl font-semibold">Edit Profile</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Upload */}
            <div className="flex items-center space-x-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-gray-400 dark:border-gray-600">
                {profilePreview ? (
                  <Image
                    src={profilePreview}
                    alt="Profile Picture"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <Image
                    src="/default_pfp.png"
                    alt="Profile Picture"
                    fill
                    className="object-cover"
                  />
                )}
              </div>

              <div className="flex flex-col">
                <label
                  style={{ backgroundColor: "#4168e2" }}
                  className="cursor-pointer rounded-md py-2 px-4 text-white"
                >
                  Change Photo
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                <span
                  onClick={removeProfile}
                  className="mt-1 cursor-pointer px-4 text-sm text-red-600"
                >
                  Remove Photo
                </span>
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-gray-600 dark:text-white/40">
                Username
              </label>
              <input
                type="text"
                value={form.username}
                disabled
                className="w-full rounded-lg bg-gray-200 p-3 text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4168e2] dark:border-[#2d2f32] dark:bg-[#1f2022] dark:text-white/20"
              />
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-gray-600 dark:text-white/40">
                Display Name
              </label>
              <input
                type="text"
                value={form.fullname}
                onChange={(e) =>
                  setForm((p) => ({ ...p, fullname: e.target.value }))
                }
                className="w-full rounded-lg border bg-white border-gray-400 p-3 focus:outline-none focus:ring-1 focus:ring-[#4168e2] dark:border-[#2d2f32] dark:bg-[#1f2022] dark:text-white"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-gray-600 dark:text-white/40">
                Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                className="w-full rounded-lg border bg-white border-gray-400 p-3 focus:outline-none focus:ring-1 focus:ring-[#4168e2] dark:border-[#2d2f32] dark:bg-[#1f2022] dark:text-white"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-gray-600 dark:text-white/40">
                Bio
              </label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => {
                  const value = e.target.value;

                  // limit to 3 lines
                  const lines = value.split("\n");
                  if (lines.length > 3) return;

                  setForm((p) => ({ ...p, bio: value }));
                }}
                className="w-full rounded-lg bg-white border border-gray-400 p-3 focus:outline-none focus:ring-1 focus:ring-[#4168e2] dark:border-[#2d2f32] dark:bg-[#1f2022] dark:text-white"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleDiscardClick}
                disabled={!isDirty}
                className="mt-4 cursor-pointer rounded-lg bg-red-700 px-8 py-2 font-medium text-white active:opacity-80 disabled:opacity-50 disabled:hidden disabled:cursor-not-allowed"
              >
                Discard
              </button>

              <button
                type="submit"
                disabled={!isDirty}
                style={{ backgroundColor: "#4168e2" }}
                className="mt-4 rounded-lg font-medium active:opacity-80 cursor-pointer py-2 px-12 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Discard Popup */}
      {showDiscardPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-[#161719] dark:border dark:border-[#2d2f32]">
            <h3 className="text-lg font-semibold dark:text-white">
              Discard changes?
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-white/50">
              You have unsaved edits. If you discard, your changes will be lost.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={cancelDiscard}
                className="rounded-lg cursor-pointer border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-[#2d2f32] dark:bg-[#1f2022] dark:text-white/80 dark:hover:bg-[#26282b]"
              >
                Cancel
              </button>

              <button
                onClick={confirmDiscard}
                className="rounded-lg cursor-pointer bg-red-700 px-4 py-2 text-sm font-medium text-white hover:opacity-95"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
