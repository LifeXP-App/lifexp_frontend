"use client";

import Image from "next/image";

interface MasteryTitleInfoProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue?: () => void;
}

// Ported 1:1 from LifeXP/main/templates/main/layout.html's
// #mastery-info-popup (and its swing-in-* Animista keyframes defined in the
// same template's <style> block) — content, colors, and layout are
// unchanged, only the Django `{% if %}`/`classList.toggle('hidden')`
// mechanics became React props.
export default function MasteryTitleInfo({
  isOpen,
  onClose,
  onContinue,
}: MasteryTitleInfoProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={onClose}
    >
      <style jsx>{`
        .swing-in-right-fwd {
          animation: swing-in-right-fwd 750ms cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        .swing-in-left-fwd {
          animation: swing-in-left-fwd 750ms cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        .swing-in-right-fwd-wait {
          animation: swing-in-right-fwd-wait 750ms cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        .swing-in-left-fwd-wait {
          animation: swing-in-left-fwd-wait 750ms cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }

        @keyframes swing-in-right-fwd {
          0% {
            transform: rotateY(-100deg);
            transform-origin: right;
            opacity: 1;
          }
          100% {
            transform: rotateY(0);
            transform-origin: right;
            opacity: 1;
          }
        }

        @keyframes swing-in-right-fwd-wait {
          0% {
            transform: rotateY(-100deg);
            transform-origin: right;
            opacity: 0;
          }
          50% {
            transform: rotateY(-100deg);
            transform-origin: right;
            opacity: 1;
          }
          100% {
            transform: rotateY(0);
            transform-origin: right;
            opacity: 1;
          }
        }

        @keyframes swing-in-left-fwd {
          0% {
            transform: rotateY(100deg);
            transform-origin: left;
            opacity: 1;
          }
          100% {
            transform: rotateY(0);
            transform-origin: left;
            opacity: 1;
          }
        }

        @keyframes swing-in-left-fwd-wait {
          0% {
            transform: rotateY(100deg);
            transform-origin: left;
            opacity: 0;
          }
          50% {
            transform: rotateY(100deg);
            transform-origin: left;
            opacity: 1;
          }
          100% {
            transform: rotateY(0);
            transform-origin: left;
            opacity: 1;
          }
        }
      `}</style>

      <div
        style={{ width: "90%", maxWidth: "700px" }}
        className="bg-white dark:bg-dark-2 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-8 text-center space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex items-center justify-center relative scale-70 md:scale-100">
          {/* Noir */}
          <div
            style={{
              background: "linear-gradient(to left, #000000, #1d1f24)",
              marginRight: "-15px",
              width: "100px",
            }}
            className="swing-in-right-fwd-wait opacity-0 cursor-pointer hover:scale-105 transition text-center flex flex-col items-center justify-center p-4 rounded-2xl w-28"
          >
            <div
              style={{ borderWidth: "3px" }}
              className="rounded-full h-12 w-12 border-[#713599] p-1 overflow-hidden"
            >
              <Image
                src="/mastery/graybells.png"
                alt="Graybells"
                width={48}
                height={48}
                className="aspect-square rounded-full object-cover"
              />
            </div>
            <h2 className="mt-3 text-white font-semibold text-sm">Graybells</h2>
            <p style={{ color: "#713599" }} className="font-semibold text-xs mt-1">
              Prodigy I
            </p>
          </div>

          {/* Rei */}
          <div
            style={{
              background: "linear-gradient(to right, #282a34, #000000)",
              marginRight: "-30px",
            }}
            className="swing-in-right-fwd cursor-pointer opacity-0 hover:scale-105 transition text-center flex flex-col items-center justify-center px-4 py-6 rounded-2xl w-36"
          >
            <div className="rounded-full h-16 w-16 border-4 border-[#c49352] p-1 overflow-hidden">
              <Image
                src="/mastery/mcboy.png"
                alt="McBoy"
                width={64}
                height={64}
                className="aspect-square rounded-full object-cover"
              />
            </div>
            <h2 className="mt-3 text-white font-semibold text-md">McBoy</h2>
            <p style={{ color: "#c49352" }} className="font-semibold text-sm mt-1">
              Protagonist I
            </p>
          </div>

          {/* Apollo */}
          <div
            style={{ backgroundColor: "#1a1b21" }}
            className="cursor-pointer hover:scale-105 transition text-center z-40 flex flex-col items-center justify-center p-6 rounded-2xl w-48"
          >
            <div className="rounded-full h-24 w-24 border-4 border-[#8D2E2E] p-1 overflow-hidden">
              <Image
                src="/mastery/crimson.png"
                alt="Crimson"
                width={96}
                height={96}
                className="aspect-square rounded-full object-cover"
              />
            </div>
            <h2 className="mt-4 text-white font-semibold text-lg">Crimson</h2>
            <p className="text-red-700 font-semibold text-md mt-1">Warrior I</p>
          </div>

          {/* Cody */}
          <div
            style={{
              background: "linear-gradient(to right, #000000, #282a34)",
              marginLeft: "-30px",
            }}
            className="swing-in-left-fwd cursor-pointer z-30 opacity-0 hover:scale-105 transition text-center flex flex-col items-center justify-center px-4 py-6 rounded-2xl w-36"
          >
            <div className="rounded-full h-16 w-16 border-4 border-[#31784E] p-1 overflow-hidden">
              <Image
                src="/mastery/curvelow.png"
                alt="Curvelow"
                width={64}
                height={64}
                className="aspect-square rounded-full object-cover"
              />
            </div>
            <h2 className="mt-3 text-white font-semibold text-md">Curvelow</h2>
            <p style={{ color: "#31784E" }} className="font-semibold text-sm mt-1">
              Diplomat I
            </p>
          </div>

          {/* Feather */}
          <div
            style={{
              background: "linear-gradient(to right, #000000, #1d1f24)",
              marginLeft: "-15px",
              width: "100px",
            }}
            className="swing-in-left-fwd-wait cursor-pointer opacity-0 hover:scale-105 transition text-center flex flex-col items-center justify-center p-4 rounded-2xl w-28"
          >
            <div
              style={{ borderWidth: "3px" }}
              className="rounded-full h-12 w-12 border-[#4187A2] p-1 overflow-hidden"
            >
              <Image
                src="/mastery/picasso.png"
                alt="Picasso"
                width={48}
                height={48}
                className="aspect-square rounded-full object-cover"
              />
            </div>
            <h2 className="mt-3 text-white font-semibold text-sm">Picasso</h2>
            <p style={{ color: "#4187A2" }} className="font-semibold text-xs mt-1">
              Alchemist I
            </p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
          Mastery Titles
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-md">
          Mastery Titles show what kind of growth beast you are. Once you hit
          10,000 XP, your top life aspect (the one you&apos;ve grinded the
          most XP in) becomes your mastery path, and you earn a special title
          to match
        </p>
        <button
          type="button"
          onClick={() => (onContinue ?? onClose)()}
          className="mastery-info-continue mt-8 px-8 py-2 bg-black dark:bg-white dark:text-black dark:hover:bg-gray-100 cursor-pointer float-right text-white rounded-xl hover:bg-gray-900 transition"
        >
          Grind
        </button>
      </div>
    </div>
  );
}
