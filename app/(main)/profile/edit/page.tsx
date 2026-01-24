"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  // ✅ initial values (what you started with)
  const initialForm = useMemo(
    () => ({
      username: "pat",
      fullname: "Patty",
      title: "🌟 Founder @LifeXP",
      bio: "moment.\n\n天上天下唯我独尊",
    }),
    []
  );

  const initialPreview = useMemo(
    () =>
      "https://res.cloudinary.com/dfohn9dcz/image/upload/v1752327292/lfco9m4hqq9yin7adl6e.jpg",
    []
  );

  const [profilePreview, setProfilePreview] = useState<string>(initialPreview);
  const [form, setForm] = useState(initialForm);

  // popup
  const [showDiscardPopup, setShowDiscardPopup] = useState(false);

  const isDirty = useMemo(() => {
    const formChanged =
      form.fullname !== initialForm.fullname ||
      form.title !== initialForm.title ||
      form.bio !== initialForm.bio;

    const photoChanged = profilePreview !== initialPreview;

    return formChanged || photoChanged;
  }, [form, profilePreview, initialForm, initialPreview]);

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
    setForm(initialForm);
    setProfilePreview(initialPreview);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
    router.back(); // or router.push(`/profile/${form.username}`)
  };

  const cancelDiscard = () => {
    setShowDiscardPopup(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Send to API route
    // const fd = new FormData();
    // fd.append("fullname", form.fullname);
    // fd.append("title", form.title);
    // fd.append("bio", form.bio);
    // if (fileInputRef.current?.files?.[0]) fd.append("profile_picture", fileInputRef.current.files[0]);
    // await fetch("/api/profile", { method: "POST", body: fd });

    router.push(`/profile/${form.username}`);
    console.log("Submitted:", form);
  };

  // ✅ optional: warning when closing tab with changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

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
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                className="w-full rounded-lg bg-white border border-gray-400 p-3 focus:outline-none focus:ring-1 focus:ring-[#4168e2] dark:border-[#2d2f32] dark:bg-[#1f2022] dark:text-white"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleDiscardClick}
                className="mt-4 cursor-pointer rounded-lg bg-red-700 px-8 py-2 font-medium text-white  active:opacity-80  "
              >
                Discard
              </button>

              <button
                type="submit"
                style={{ backgroundColor: "#4168e2" }}
                className="mt-4 rounded-lg font-medium active:opacity-80 cursor-pointer py-2 px-12 text-white"
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
