'use client';

import React, { useState, useEffect } from 'react';

interface ActivityType {
  name: string;
  emoji: string;
  color: string;
}

interface AvatarType {
  color: string;
}

import Image from 'next/image';
interface DayCompleteProps {
  day?: number;
  totalDuration?: string;
  xpEarned?: number;
  focusedDuration?: string;
  nudgeCount?: number;
  nudgeAvatars?: AvatarType[];
  daysLeft?: number;
  progressPercentage?: number;
  activity?: ActivityType;
  onDone?: () => void;
}

const DayCompleteWithProps: React.FC<DayCompleteProps> = ({
  day = 3,
  totalDuration = '1h 19m',
  xpEarned = 1233,
  focusedDuration = '59m',
  nudgeCount = 24,
  nudgeAvatars = [
    { color: '#c49352' },
    { color: '#171717' },
    { color: '#713599' }
  ],
  daysLeft = 3,
  progressPercentage = 60,
  activity = {
    name: 'Drawing',
    emoji: '🎨',
    color: '#4187a2'
  },
  onDone = () => console.log('Done clicked')
}) => {
  const [isAnimating, setIsAnimating] = useState(true);
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    const animationTimer = setTimeout(() => setIsAnimating(false), 1000);
    const progressTimer = setTimeout(() => setProgressWidth(progressPercentage), 300);
    
    return () => {
      clearTimeout(animationTimer);
      clearTimeout(progressTimer);
    };
  }, [progressPercentage]);

  return (
    <>
      <style jsx global>{`
      
        :root {
          --background: #f3f4f6;
          --foreground: #171717;
          --rookie-primary: #4168e2;
          --warrior-primary: #8d2e2e;
          --protagonist-primary: #c49352;
          --prodigy-primary: #713599;
          --alchemist-primary: #4187a2;
          --diplomat-primary: #31784e;
          --border: #e5e7eb;
          --muted: #9ca3af;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      <div 
        className="min-h-screen overflow-hidden w-full flex items-center justify-center" 
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div 
          className="w-full max-w-2xl  rounded-3xl overflow-hidden"
          style={{

            animation: isAnimating ? 'scaleIn 0.5s ease-out' : 'none'
          }}
        >
          {/* Header */}
          <div className="px-6 pt-8 pb-4 text-center">
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ 
                animation: isAnimating ? 'slideUp 0.6s ease-out 0.1s both' : 'none',
                color: 'var(--foreground)'
              }}
            >
              Day {day} Complete!
            </h1>
            <p 
              className="text-sm"
              style={{ 
                animation: isAnimating ? 'slideUp 0.6s ease-out 0.2s both' : 'none',
                color: 'var(--muted)'
              }}
            >
              Keep it up, we'll see you in the next session
            </p>
          </div>

          {/* Character Illustration */}
         <div className="px-6 pb-6">
            <Image
                src="https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1/posts/user_7/ske_20251115103836"
                alt="Character Illustration"
                width={1200}
                height={600}
                className="w-full h-[280px] rounded-2xl object-cover"
                style={{
                animation: isAnimating ? "slideUp 0.6s ease-out 0.3s both" : "none",
                }}
            />
            </div>


          {/* Activity Badge */}
          <div 
            className="px-6 pb-6 flex justify-center"
            style={{ 
              animation: isAnimating ? 'slideUp 0.6s ease-out 0.4s both' : 'none'
            }}
          >
            <div 
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white"
              style={{
                border: '1px solid var(--border)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <span className="text-2xl">{activity.emoji}</span>
              <span 
                className="font-semibold text-lg"
                style={{ color: activity.color }}
              >
                {activity.name}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div 
            className="px-6 pb-6 grid grid-cols-2 gap-4"
            style={{ 
              animation: isAnimating ? 'slideUp 0.6s ease-out 0.5s both' : 'none'
            }}
          >
            <StatItem value={totalDuration} label="Total Duration" />
            <StatItem value={xpEarned.toString()} label="Total XP Earned" />
            <StatItem value={focusedDuration} label="Focused Duration" />
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <div className="flex -space-x-2">
                  {nudgeAvatars.slice(0, 3).map((avatar, i) => (
                    <div 
                      key={i}
                      className="w-7 h-7 rounded-full border-2 border-white"
                      style={{ backgroundColor: avatar.color }}
                    />
                  ))}
                </div>
                <span className="text-xl font-medium ">+{nudgeCount}</span>
              </div>
              <div className="text-sm" style={{ color: 'var(--muted)' }}>Nudges</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div 
            className="px-6 pb-6"
            style={{ 
              animation: isAnimating ? 'slideUp 0.6s ease-out 0.6s both' : 'none'
            }}
          >
            <div 
              className="relative h-6 rounded-full overflow-hidden"
              style={{ backgroundColor: '#e5e7eb' }}
            >
              <div 
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  backgroundColor: activity.color,
                  width: `${progressWidth}%`
                }}
              />
            </div>
            <div className="text-center mt-3 text-sm" style={{ color: 'var(--muted)' }}>
              {daysLeft} days left
            </div>
          </div>

          {/* Done Button */}
          <div 
            className="px-6 pb-8"
            style={{ 
              animation: isAnimating ? 'slideUp 0.6s ease-out 0.7s both' : 'none'
            }}
          >
            <button
              className="w-full py-4 rounded-2xl font-semibold text-white text-lg transition-all active:scale-[0.98]"
              style={{ 
                backgroundColor: activity.color,
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {

                e.currentTarget.style.transform = 'scale(1.01)';
              }}
              onMouseLeave={(e) => {

                e.currentTarget.style.transform = 'scale(1)';
              }}
              onClick={onDone}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

interface StatItemProps {
  value: string;
  label: string;
}

const StatItem: React.FC<StatItemProps> = ({ value, label }) => (
  <div className="text-center">
    <div className="text-2xl font-bold mb-1">{value}</div>
    <div className="text-sm" style={{ color: 'var(--muted)' }}>{label}</div>
  </div>
);

export default DayCompleteWithProps;