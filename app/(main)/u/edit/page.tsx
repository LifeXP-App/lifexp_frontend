"use client";

import { useAuth } from "@/src/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
function EditProfileSkeleton() {
  return (
    <main className="flex h-screen w-full overflow-y-auto md:overflow-hidden">
      <div className="mx-auto w-full p-4 md:p-8 md:w-[80%]">
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

// Crops `file` down to the square region [cropX, cropY, cropSize] (in the
// image's natural pixel coordinates) and returns a new File with the same
// name/type. Purely a square crop — no circular masking is baked into the
// output; the circle is only a UI guide in the popup.
function cropImageToSquare(
  file: File,
  cropX: number,
  cropY: number,
  cropSize: number,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = cropSize;
      canvas.height = cropSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));

      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropSize,
        cropSize,
        0,
        0,
        cropSize,
        cropSize,
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Canvas is empty"));
          resolve(new File([blob], file.name, { type: file.type || "image/jpeg" }));
        },
        file.type || "image/jpeg",
        0.95,
      );
    };

    img.onerror = reject;
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

const CROP_STAGE_SIZE = 420;
const CROP_HANDLE_SIZE = 16;
const CROP_MIN_BOX = 80;

interface CropModalProps {
  imageUrl: string;
  onCancel: () => void;
  onSave: (cropX: number, cropY: number, cropSize: number) => void;
}

// Square, resizable crop selector with a circular cutout guide (dark outside
// the circle, transparent inside) — same idea as a standard profile-picture
// cropper. Only the square region is actually cropped on Save; the circle is
// a visual guide only (see cropImageToSquare).
function CropModal({ imageUrl, onCancel, onSave }: CropModalProps) {
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  // Displayed (stage-space) box — square, top-left + size. null until the
  // image has loaded and an initial centered box has been derived from it.
  const [box, setBox] = useState<{ x: number; y: number; size: number } | null>(null);
  // Tracks which `display` the current `box` was initialized for, so a
  // newly-loaded image (display identity changes) re-centers the box.
  // Plain state (not a ref) so it can be read/adjusted during render, per
  // React's "adjusting state when a prop changes" pattern.
  const [boxInitializedFor, setBoxInitializedFor] = useState<unknown>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<
    | { mode: "move"; startX: number; startY: number; boxX: number; boxY: number; boxSize: number }
    | { mode: "resize"; startX: number; startY: number; boxX: number; boxY: number; boxSize: number }
    | null
  >(null);

  // Displayed image dimensions within the fixed-size stage (letterboxed to
  // fit, same as object-contain).
  const display = useMemo(() => {
    if (!natural) return null;
    const scale = Math.min(
      CROP_STAGE_SIZE / natural.width,
      CROP_STAGE_SIZE / natural.height,
    );
    const width = natural.width * scale;
    const height = natural.height * scale;
    return {
      width,
      height,
      offsetX: (CROP_STAGE_SIZE - width) / 2,
      offsetY: (CROP_STAGE_SIZE - height) / 2,
      scale,
    };
  }, [natural]);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      setNatural({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Re-center the box whenever a new `display` becomes available (image
  // just loaded, or a different image was passed in) — adjusted directly
  // during render rather than in an effect, per React's guidance for
  // resetting derived state when an input changes.
  if (display && boxInitializedFor !== display) {
    const size = Math.min(display.width, display.height);
    setBoxInitializedFor(display);
    setBox({
      x: display.offsetX + (display.width - size) / 2,
      y: display.offsetY + (display.height - size) / 2,
      size,
    });
  }

  const clampBox = useCallback(
    (next: { x: number; y: number; size: number }) => {
      if (!display) return next;
      const size = Math.max(CROP_MIN_BOX, Math.min(next.size, display.width, display.height));
      const x = Math.min(
        Math.max(next.x, display.offsetX),
        display.offsetX + display.width - size,
      );
      const y = Math.min(
        Math.max(next.y, display.offsetY),
        display.offsetY + display.height - size,
      );
      return { x, y, size };
    },
    [display],
  );

  // startX/startY hold the pointer's position (in stage coordinates) at the
  // moment the drag began — handlePointerMove compares the current pointer
  // position against that to get a delta, then applies it to the box's
  // position/size as it was at drag start (boxX/boxY/boxSize).
  // Stable via useCallback so the exact function instance registered by
  // addEventListener is the same one passed to removeEventListener, even
  // though setBox below triggers re-renders mid-drag.
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current;
      const stage = stageRef.current;
      if (!drag || !stage) return;
      const rect = stage.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;
      const dx = pointerX - drag.startX;
      const dy = pointerY - drag.startY;

      if (drag.mode === "move") {
        setBox(clampBox({ x: drag.boxX + dx, y: drag.boxY + dy, size: drag.boxSize }));
      } else {
        // Resize from the bottom-right handle — keep it a square by taking
        // the larger of the two deltas.
        const delta = Math.max(dx, dy);
        setBox(clampBox({ x: drag.boxX, y: drag.boxY, size: drag.boxSize + delta }));
      }
    },
    [clampBox],
  );

  // Registered with { once: true } below, so it never needs to remove its
  // own pointerup listener (avoids a self-referencing useCallback).
  const stopDragging = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener("pointermove", handlePointerMove);
  }, [handlePointerMove]);

  const startMove = (e: React.PointerEvent) => {
    const stage = stageRef.current;
    if (!stage || !box) return;
    const rect = stage.getBoundingClientRect();
    dragRef.current = {
      mode: "move",
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      boxX: box.x,
      boxY: box.y,
      boxSize: box.size,
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging, { once: true });
  };

  const startResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    const stage = stageRef.current;
    if (!stage || !box) return;
    const rect = stage.getBoundingClientRect();
    dragRef.current = {
      mode: "resize",
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      boxX: box.x,
      boxY: box.y,
      boxSize: box.size,
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging, { once: true });
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
    };
  }, [handlePointerMove, stopDragging]);

  const handleSave = () => {
    if (!display || !natural || !box) return;
    const cropX = (box.x - display.offsetX) / display.scale;
    const cropY = (box.y - display.offsetY) / display.scale;
    const cropSize = box.size / display.scale;
    onSave(
      Math.max(0, Math.round(cropX)),
      Math.max(0, Math.round(cropY)),
      Math.round(Math.min(cropSize, natural.width - cropX, natural.height - cropY)),
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-[#161719] dark:border dark:border-[#2d2f32]">
        <h3 className="text-lg font-semibold dark:text-[var(--foreground)]">
          Crop photo
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-[var(--foreground)]/50">
          Drag to reposition, drag the corner handle to resize.
        </p>

        <div
          ref={stageRef}
          className="relative mt-4 select-none overflow-hidden rounded-lg bg-gray-100 dark:bg-[#1f2022]"
          style={{ width: CROP_STAGE_SIZE, height: CROP_STAGE_SIZE, margin: "0 auto" }}
        >
          {display && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageUrl}
              alt="Crop preview"
              className="pointer-events-none absolute"
              style={{
                left: display.offsetX,
                top: display.offsetY,
                width: display.width,
                height: display.height,
              }}
            />
          )}

          {display && box && box.size > 0 && (
            <>
              {/* Dark overlay outside the square, with a transparent circular
                  cutout inside the square — outside-square area and the
                  square-minus-circle corners are both dark. */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: "rgba(0,0,0,0.6)",
                  WebkitMaskImage: `radial-gradient(circle at ${box.x + box.size / 2}px ${
                    box.y + box.size / 2
                  }px, transparent ${box.size / 2}px, black ${box.size / 2}px)`,
                  maskImage: `radial-gradient(circle at ${box.x + box.size / 2}px ${
                    box.y + box.size / 2
                  }px, transparent ${box.size / 2}px, black ${box.size / 2}px)`,
                }}
              />

              {/* Draggable square outline */}
              <div
                onPointerDown={startMove}
                className="absolute cursor-move border-2 border-white/90"
                style={{
                  left: box.x,
                  top: box.y,
                  width: box.size,
                  height: box.size,
                }}
              >
                <div
                  onPointerDown={startResize}
                  className="absolute cursor-nwse-resize rounded-full border-2 border-white bg-[#4168e2]"
                  style={{
                    right: -CROP_HANDLE_SIZE / 2,
                    bottom: -CROP_HANDLE_SIZE / 2,
                    width: CROP_HANDLE_SIZE,
                    height: CROP_HANDLE_SIZE,
                  }}
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg cursor-pointer border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-[#2d2f32] dark:bg-[#1f2022] dark:text-[var(--foreground)]/80 dark:hover:bg-[#26282b]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            style={{ backgroundColor: "#4168e2" }}
            className="rounded-lg cursor-pointer px-4 py-2 text-sm font-medium text-white hover:opacity-95"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditProfilePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const { me, session, loading: authLoading, refreshMe } = useAuth();
  const queryClient = useQueryClient();
  const sessionRef = useRef(session);

  /* ---------------- STATE ---------------- */

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
  const username = me?.username;

  // popup
  const [showDiscardPopup, setShowDiscardPopup] = useState(false);

  // Newly-selected file awaiting crop confirmation — the crop popup is shown
  // whenever this is set, and cleared on both Cancel and Save.
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);
  const [pendingCropUrl, setPendingCropUrl] = useState<string>("");

  /* ---------------- LOAD PROFILE ---------------- */

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Cached via React Query (own key — /api/users/[id] returns a differently
  // shaped payload than the /u/[username] page's ["profile-users", ...]
  // entry, so it can't share that cache) so re-entering edit shows the
  // last-known profile instantly instead of a skeleton every time.
  const { data: profileData, isLoading: loading } = useQuery({
    queryKey: ["edit-profile", username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`, {
        headers: sessionRef.current?.access_token
          ? { Authorization: `Bearer ${sessionRef.current.access_token}` }
          : undefined,
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch profile");

      return res.json();
    },
    enabled: !authLoading && !!userId,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (!profileData) return;

    const baseForm = {
      username: profileData.username,
      fullname: profileData.fullname || "",
      title: profileData.title || "",
      bio: profileData.bio || "",
    };

    setInitialForm(baseForm);
    setForm(baseForm);

    const pic = profileData.profile_picture || "/default_pfp.png";
    setInitialPreview(pic);
    setProfilePreview(pic);
  }, [profileData]);


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

  // Opens the crop popup instead of processing the file immediately — the
  // existing resize pipeline (resizeImage) still runs afterward, unchanged,
  // on whatever the crop step produces (see handleCropSave).
  setPendingCropFile(file);
  setPendingCropUrl(URL.createObjectURL(file));
};

  const handleCropCancel = () => {
    if (pendingCropUrl) URL.revokeObjectURL(pendingCropUrl);
    setPendingCropFile(null);
    setPendingCropUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropSave = async (cropX: number, cropY: number, cropSize: number) => {
    const file = pendingCropFile;
    const url = pendingCropUrl;
    setPendingCropFile(null);
    setPendingCropUrl("");
    if (!file) return;

    try {
      const croppedFile = await cropImageToSquare(file, cropX, cropY, cropSize);
      const resizedFile = await resizeImage(croppedFile, 512, 0.85);
      setProfileFile(resizedFile);

      const previewUrl = URL.createObjectURL(resizedFile);
      setProfilePreview(previewUrl);
    } catch (err) {
      console.error("Failed to process image:", err);
      setSaveError("Could not process that image. Try a different file.");
    } finally {
      if (url) URL.revokeObjectURL(url);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
        queryKey: ["edit-profile", me.username],
      });
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
      <main className="flex h-screen w-full overflow-y-auto md:overflow-hidden">
        <div className="mx-auto w-full p-4 md:p-8 md:w-[80%]">
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

      {/* Crop Popup */}
      {pendingCropUrl && (
        <CropModal
          imageUrl={pendingCropUrl}
          onCancel={handleCropCancel}
          onSave={handleCropSave}
        />
      )}

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
