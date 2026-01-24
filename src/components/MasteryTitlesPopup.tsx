// src/components/mastery/MasteryTitlesPopup.tsx
"use client";

import Image from "next/image";
import React from "react";
import { usePopup } from "@/src/context/PopupContext";

interface MasteryTitlesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue?: () => void;
}

export default function MasteryTitlesPopup({
  isOpen,
  onClose,
  onContinue,
}: MasteryTitlesPopupProps) {
  if (!isOpen) return null;

  const { closeMasteryPopup } = usePopup();

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60
                 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-[90%] max-w-[700px] bg-white dark:bg-dark-2 border border-gray-100 dark:border-gray-800
                   rounded-2xl shadow-xl p-8 text-center space-y-4
                   animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex items-center justify-center relative scale-75 md:scale-100">
          {/* Noir */}
          <div
            className="cursor-pointer text-center flex flex-col items-center justify-center p-4 rounded-2xl w-28
                       transition-transform duration-200 ease-out hover:scale-105 active:scale-95
                       animate-in fade-in slide-in-from-bottom-3 duration-300"
            style={{
              background: "linear-gradient(to left, #000000, #1d1f24)",
              marginRight: "-15px",
              width: "100px",
            }}
          >
            <div className="rounded-full h-12 w-12 border-[3px] border-[#713599] p-1 overflow-hidden">
              <Image
                src="/mastery/noir.png"
                alt="Noir"
                width={48}
                height={48}
                className="aspect-square rounded-full object-cover"
              />
            </div>
            <h2 className="mt-3 text-white font-semibold text-sm">Noir</h2>
            <p className="font-semibold text-xs mt-1 text-[#713599]">
              Prodigy I
            </p>
          </div>

          {/* Rei */}
          <div
            className="cursor-pointer text-center flex flex-col items-center justify-center px-4 py-6 rounded-2xl w-36
                       transition-transform duration-200 ease-out hover:scale-105 active:scale-95
                       animate-in fade-in slide-in-from-bottom-3 duration-300 delay-75"
            style={{
              background: "linear-gradient(to right, #282a34, #000000)",
              marginRight: "-30px",
            }}
          >
            <div className="rounded-full h-16 w-16 border-4 border-[#c49352] p-1 overflow-hidden">
              <Image
                src="/mastery/rei.png"
                alt="Rei"
                width={64}
                height={64}
                className="aspect-square rounded-full object-cover"
              />
            </div>
            <h2 className="mt-3 text-white font-semibold text-md">Rei</h2>
            <p className="font-semibold text-sm mt-1 text-[#c49352]">
              Protagonist I
            </p>
          </div>

          {/* Apollo */}
          <div
            className="cursor-pointer text-center z-40 flex flex-col items-center justify-center p-6 rounded-2xl w-48
                       transition-transform duration-200 ease-out hover:scale-105 active:scale-95
                       animate-in fade-in slide-in-from-bottom-3 duration-300 delay-100"
            style={{ backgroundColor: "#1a1b21" }}
          >
            <div className="rounded-full h-24 w-24 border-4 border-[#8D2E2E] p-1 overflow-hidden">
              <Image
                src="/mastery/apollo.png"
                alt="Apollo"
                width={96}
                height={96}
                className="aspect-square rounded-full object-cover"
              />
            </div>
            <h2 className="mt-4 text-white font-semibold text-lg">Apollo</h2>
            <p className="text-red-700 font-semibold text-md mt-1">Warrior I</p>
          </div>

          {/* Cody */}
          <div
            className="cursor-pointer z-30 text-center flex flex-col items-center justify-center px-4 py-6 rounded-2xl w-36
                       transition-transform duration-200 ease-out hover:scale-105 active:scale-95
                       animate-in fade-in slide-in-from-bottom-3 duration-300 delay-75"
            style={{
              background: "linear-gradient(to right, #000000, #282a34)",
              marginLeft: "-30px",
            }}
          >
            <div className="rounded-full h-16 w-16 border-4 border-[#31784E] p-1 overflow-hidden">
              <Image
                src="/mastery/cody.png"
                alt="Cody"
                width={64}
                height={64}
                className="aspect-square rounded-full object-cover"
              />
            </div>
            <h2 className="mt-3 text-white font-semibold text-md">Cody</h2>
            <p className="font-semibold text-sm mt-1 text-[#31784E]">
              Diplomat I
            </p>
          </div>

          {/* Feather */}
          <div
            className="cursor-pointer text-center flex flex-col items-center justify-center p-4 rounded-2xl w-28
                       transition-transform duration-200 ease-out hover:scale-105 active:scale-95
                       animate-in fade-in slide-in-from-bottom-3 duration-300"
            style={{
              background: "linear-gradient(to right, #000000, #1d1f24)",
              marginLeft: "-15px",
              width: "100px",
            }}
          >
            <div className="rounded-full h-12 w-12 border-[3px] border-[#4187A2] p-1 overflow-hidden">
              <Image
                src="/mastery/feather.png"
                alt="Feather"
                width={48}
                height={48}
                className="aspect-square rounded-full object-cover"
              />
            </div>
            <h2 className="mt-3 text-white font-semibold text-sm">Feather</h2>
            <p className="font-semibold text-xs mt-1 text-[#4187A2]">
              Alchemist I
            </p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
          Mastery Titles
        </h2>

        <p className="text-gray-600 dark:text-gray-400 text-md">
          Mastery Titles show what kind of growth beast you are. Once you hit
          10,000 XP, your top life aspect (the one you&apos;ve grinded the most XP
          in) becomes your mastery path, and you earn a special title to match
        </p>

        <button
          className="mt-8 px-8 py-2 bg-black dark:bg-white dark:text-black dark:hover:bg-gray-100 cursor-pointer float-right text-white rounded-xl hover:bg-gray-900 transition
                     active:scale-95"
          onClick={() => {
            closeMasteryPopup();
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
