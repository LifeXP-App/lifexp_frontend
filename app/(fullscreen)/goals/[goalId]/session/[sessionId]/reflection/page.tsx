"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from "next/navigation";
import confetti from "canvas-confetti";
import { Link } from 'lucide-react';

interface ReflectionResponse {
  id: string
  uid: string
  day: number
  completion_picture: string | null
  total_duration_seconds: number | null
  focused_duration_seconds: number | null
  xp_total: number
  nudges: any[]
  nudge_users: {
    id: number
    username: string
    fullname: string
    profile_picture: string
  }[]
  days_left: number
  progress_bar: number
  activity: {
    id: string
    name: string
    emoji: string
    type: string
  }
}

const DayCompletePage = () => {

  const params = useParams();
  const uid = params?.sessionId as string;

  const goalId = params?.goalId as string;

  const [reflection, setReflection] = useState<ReflectionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [progressWidth, setProgressWidth] = useState(0);

  
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectColors: Record<string,string> = {
    physique: "#8d2e2e",
    energy: "#c49352",
    logic: "#713599",
    creativity: "#4187a2",
    social: "#31784e"
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0m"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const uploadImage = async (file: File) => {
  try {

    const formData = new FormData()
    formData.append("image", file)

        if (!file.type.startsWith("image/")) {
      alert("Only images allowed")
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      alert("Image must be under 100MB")
      return
    }

    await fetch(`/api/sessions/${uid}/image`, {
    method: "POST",
    body: formData,
  })
} catch (err) {
    console.error("Failed to upload image", err)
    alert("Failed to upload image")
}
  }


  useEffect(() => {

    if (!uid) return

    const fetchReflection = async () => {
      try {

        const res = await fetch(`/api/sessions/${uid}/reflection`, {
          credentials: "include"
        })

        const data = await res.json()

        setReflection(data)
        if (reflection?.completion_picture) {
          setImagePreview(reflection.completion_picture)
        }

      } catch (err) {
        console.error("Failed to fetch reflection", err)
      } finally {
        setLoading(false)
      }
    }

    fetchReflection()

  }, [uid])

  useEffect(() => {
    if (!reflection) return
    setTimeout(() => {
      setProgressWidth(reflection.progress_bar)
    }, 300)
  }, [reflection])

  const handlePickImage = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {

  const file = e.target.files?.[0]
  if (!file) return

  const url = URL.createObjectURL(file)

  setImagePreview(url)

  uploadImage(file)
}


  useEffect(() => {

  if (!reflection) return;

  const duration = 2500;
  const end = Date.now() + duration;

  const frame = () => {

    confetti({
      particleCount: 2,
      angle: 60,
      spread: 70,
      origin: { x: 0 },
    });

    confetti({
      particleCount: 2,
      angle: 120,
      spread: 70,
      origin: { x: 1 },
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();

}, [reflection]);

  /* ---------------- LOADING SCREEN ---------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">

        <div className="text-center  flex flex-col items-center justify-center space-y-4">

          <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />

          <p className="text-gray-600 text-sm">
            Loading session summary...
          </p>

        </div>

      </div>
    )
  }

  if (!reflection) return null

  const activity = {
    name: reflection.activity.name,
    emoji: reflection.activity.emoji,
    color: aspectColors[reflection.activity.type] || "#4187a2"
  }

  const totalDuration = formatDuration(reflection.total_duration_seconds)
  const focusedDuration = formatDuration(reflection.focused_duration_seconds)



  return (
    <>
      <div 
        className="min-h-screen overflow-hidden w-full flex items-center justify-center"
        style={{ backgroundColor: '#f3f4f6' }}
      >

        <div className="w-full max-w-2xl rounded-3xl overflow-hidden">

          {/* Header */}

          <div className="px-6 pt-8 pb-4 text-center">

            <h1 className="text-3xl font-bold mb-2">
              Day {reflection.day} Complete!
            </h1>

            <p className="text-sm text-gray-500">
              Keep it up, we'll see you in the next session
            </p>

          </div>

          {/* IMAGE PICKER */}

          <div className="px-6 pb-6">

            <div
              onClick={() => {
                if (!imagePreview) handlePickImage();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {

                e.preventDefault()
                e.stopPropagation()

                const file = e.dataTransfer.files?.[0]
                if (!file) return

                const url = URL.createObjectURL(file)

                setImagePreview(url)

                uploadImage(file)

              }}
              style={{ borderColor: 'var(--border)' }}
              className="relative w-full h-[280px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white transition-all hover:scale-[1.01] active:scale-[0.99]"
            >

              {imagePreview ? (

                <>
                  <img
                    src={imagePreview}
                    className="w-full h-full object-cover"
                  />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                    }}
                    className="absolute cursor-pointer top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                  >
                    ✕
                  </button>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                    Click to replace
                  </div>

                </>

              ) : (

                <>
                  <div className="text-5xl mb-3">📸</div>

                  <p className="font-semibold text-lg mb-1">
                    Show us what you built
                  </p>

                  <p className="text-sm mb-4 text-center px-6 text-gray-500">
                    Drag & drop your session output here  
                    or upload a snapshot of what you created.
                  </p>

                  <div className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-200">
                    Browse Image
                  </div>

                  <p className="text-xs mt-3 text-gray-500">
                    PNG or JPG
                  </p>
                </>

              )}

            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

          </div>

          {/* Activity */}
          {/* text non selectable */}

          <div className="px-6 pb-6 flex justify-center cursor-pointer transition">

            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border"
              style={{ borderColor: "var(--border)" }}

            >

              <span className="text-2xl">
                {activity.emoji}
              </span>

              <span
                className="font-semibold text-lg"
                style={{ color: activity.color }}
              >
                {activity.name}
              </span>

            </div>

          </div>

          {/* Stats */}

          <div className="px-6 pb-6 grid grid-cols-2 gap-4">

            <StatItem value={totalDuration} label="Total Duration" />

            <StatItem value={reflection.xp_total.toString()} label="Total XP Earned" />

            <StatItem value={focusedDuration} label="Focused Duration" />

            {/* NUDGES WITH PROFILE PICTURES */}

            <div className="text-center">

              <div className="flex items-center justify-center gap-1 mb-1">

                <div className="flex -space-x-2">

                  {reflection.nudge_users.map(user => (
                    <a href={`/u/${user.username}`} key={user.id} className="relative">
                    <img
                      key={user.id}
                      src={user.profile_picture}
                      alt={user.username}
                      className="w-7 h-7 rounded-full border-2 border-white object-cover"
                    />
                    </a>

                  ))}

                </div>
                  {reflection.nudge_users.length > 4 && (
                    <span className="text-sm text-gray-500">
                      +{reflection.nudge_users.length - 4}
                    </span>
                  )}
               

              </div>

              <div className="text-sm text-gray-500">
                Nudges
              </div>

            </div>

          </div>

          {/* Progress */}

          <div className="px-6 pb-6">

            <div className="relative h-6 rounded-full overflow-hidden bg-gray-200">

              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
                style={{
                  backgroundColor: activity.color,
                  width: `${progressWidth}%`
                }}
              />

            </div>

            <div className="text-center mt-3 text-sm text-gray-500">
              {reflection.days_left} days left
            </div>

          </div>

          {/* Done Button */}

          <div className="px-6 pb-8">

                <a href={`/goals/${goalId}`} >
            <button
              className="w-full py-4 cursor-pointer rounded-2xl font-semibold text-white text-lg active:opacity-75"
              style={{ backgroundColor: activity.color }}
            >
              Done
            </button>
                </a>

          </div>

        </div>
      </div>
    </>
  )
}

interface StatItemProps {
  value: string
  label: string
}

const StatItem: React.FC<StatItemProps> = ({ value, label }) => (

  <div className="text-center">

    <div className="text-2xl font-bold mb-1">
      {value}
    </div>

    <div className="text-sm text-gray-500">
      {label}
    </div>

  </div>

)

export default DayCompletePage