"use client";

import { useAuth } from "@/src/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
function EditProfileSkeleton() {
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

function resizeImage(file: File, maxDimension = 512, quality = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      let { width, height } = img;

      if (width > height && width > maxDimension) {
        height = Math.round(height * (maxDimension / width));
        width = maxDimension;
      } else if (height > maxDimension) {
        width = Math.round(width * (maxDimension / height));
        height = maxDimension;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Canvas is empty"));
          resolve(
            new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
              type: "image/jpeg",
            })
          );
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = reject;
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function EditProfilePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const { me, session, loading: authLoading, refreshMe } = useAuth();
  const queryClient = useQueryClient();
  const sessionRef = useRef(session);

  /* ---------------- STATE ---------------- */

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

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
  const userId = me?.id;

  // popup
  const [showDiscardPopup, setShowDiscardPopup] = useState(false);

  /* ---------------- LOAD PROFILE ---------------- */

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) return;

    const loadProfile = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`, {
          headers: sessionRef.current?.access_token
            ? { Authorization: `Bearer ${sessionRef.current.access_token}` }
            : undefined,
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
  }, [authLoading, userId]);


  const [profileFile, setProfileFile] = useState<File | null>(null);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const resizedFile = await resizeImage(file, 512, 0.85);
    setProfileFile(resizedFile);

    const url = URL.createObjectURL(resizedFile);
    setProfilePreview(url);
  } catch (err) {
    console.error("Failed to resize image:", err);
    setSaveError("Could not process that image. Try a different file.");
  }
};

  const removeProfile = () => {
    setProfilePreview("");
    setProfileFile(null);
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
    if (!me || saving) return;

    setSaving(true);
    setSaveError("");

    const formData = new FormData();

    formData.append("fullname", form.fullname);
    formData.append("title", form.title);
    formData.append("bio", form.bio);

    if (profileFile) {
      formData.append("profile_picture", profileFile);
    }

    // if user removed photo
    if (!profilePreview) {
      formData.append("profile_picture", "");
    }

    try {
      const res = await fetch(`/api/users/${me.id}`, {
        method: "PATCH",
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
        body: formData,
      });

      if (!res.ok) {
        console.error("Failed to save profile:", await res.text());
        setSaveError("Could not save your profile. Please try again.");
        return;
      }

      // AuthContext's own `me` (Sidebar/Navigation avatar) and every cached
      // view of this profile (own profile page, home widget, goals sidebar)
      // all need to drop their now-stale copy.
      await refreshMe();
      queryClient.invalidateQueries({
        queryKey: ["profile-users", me.username, me.username],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-profile-widget", me.username],
      });
      queryClient.invalidateQueries({
        queryKey: ["goals", "sidebar", me.username],
      });
      router.push(`/u/${me.username}`);
    } catch (err) {
      console.error("Profile save failed:", err);
      setSaveError("Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
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
              <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-gray-400 dark:border-[var(--border)]">
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
              <label className="block text-gray-600 dark:text-[var(--foreground)]/40">
                Username
              </label>
              <input
                type="text"
                value={form.username}
                disabled
                className="w-full rounded-lg bg-gray-200 p-3 text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4168e2] dark:border-[#2d2f32] dark:bg-[#1f2022] dark:text-[var(--foreground)]/20"
              />
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-gray-600 dark:text-[var(--foreground)]/40">
                Display Name
              </label>
              <input
                type="text"
                value={form.fullname}
                onChange={(e) =>
                  setForm((p) => ({ ...p, fullname: e.target.value }))
                }
                className="w-full rounded-lg border bg-white border-gray-400 p-3 focus:outline-none focus:ring-1 focus:ring-[#4168e2] dark:border-[#2d2f32] dark:bg-[#1f2022] dark:text-[var(--foreground)]"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-gray-600 dark:text-[var(--foreground)]/40">
                Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                className="w-full rounded-lg border bg-white border-gray-400 p-3 focus:outline-none focus:ring-1 focus:ring-[#4168e2] dark:border-[#2d2f32] dark:bg-[#1f2022] dark:text-[var(--foreground)]"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-gray-600 dark:text-[var(--foreground)]/40">
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
                className="w-full rounded-lg bg-white border border-gray-400 p-3 focus:outline-none focus:ring-1 focus:ring-[#4168e2] dark:border-[#2d2f32] dark:bg-[#1f2022] dark:text-[var(--foreground)]"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3">
              {saveError && (
                <p className="mr-auto text-sm text-red-600">{saveError}</p>
              )}

              <button
                type="button"
                onClick={handleDiscardClick}
                disabled={!isDirty || saving}
                className="mt-4 cursor-pointer rounded-lg bg-red-700 px-8 py-2 font-medium text-white active:opacity-80 disabled:opacity-50 disabled:hidden disabled:cursor-not-allowed"
              >
                Discard
              </button>

              <button
                type="submit"
                disabled={!isDirty || saving}
                style={{ backgroundColor: "#4168e2" }}
                className="mt-4 rounded-lg font-medium active:opacity-80 cursor-pointer py-2 px-12 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Discard Popup */}
      {showDiscardPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-[#161719] dark:border dark:border-[#2d2f32]">
            <h3 className="text-lg font-semibold dark:text-[var(--foreground)]">
              Discard changes?
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-[var(--foreground)]/50">
              You have unsaved edits. If you discard, your changes will be lost.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={cancelDiscard}
                className="rounded-lg cursor-pointer border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-[#2d2f32] dark:bg-[#1f2022] dark:text-[var(--foreground)]/80 dark:hover:bg-[#26282b]"
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
