import React from "react";

type DefaultUserProfilePictureProps = {
  username: string;
  accent: {
    gradStart: string;
    gradEnd: string;
  };
  size?: number; // optional
};

export default function DefaultUserProfilePicture({
  username,
  accent,
  size = 80,
}: DefaultUserProfilePictureProps) {
  return (
    <div
      className="rounded-full flex items-center justify-center"
      style={{
        width: size,
        height: size,
        backgroundImage: `linear-gradient(135deg, ${accent.gradStart}, ${accent.gradEnd})`,
      }}
    >
      <span className="text-white text-2xl font-bold">
        {username?.[0]?.toUpperCase() ?? "U"}
      </span>
    </div>
  );
}
