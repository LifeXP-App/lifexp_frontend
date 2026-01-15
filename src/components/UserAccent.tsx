import React from "react";

type Accent = {
	primary: string;
	text: string;
	secondary: string;
	gradStart: string;
	gradEnd: string;
	rgba: (hex: string, a?: number) => string;
};

const FALLBACKS: Record<string, { primary: string; text: string; secondary: string }> = {
	rookie: { primary: "#4168e2", text: "#9aa0ae", secondary: "#4168e2" },
	warrior: { primary: "#8d2e2e", text: "#8d2e2e", secondary: "#eaafaf" },
	protagonist: { primary: "#c49352", text: "#c49352", secondary: "#fdf099" },
	prodigy: { primary: "#713599", text: "#713599", secondary: "#baafea" },
	alchemist: { primary: "#4187a2", text: "#4187a2", secondary: "#afd9ea" },
	diplomat: { primary: "#31784e", text: "#31784e", secondary: "#afeac7" },
};

export function hexToRgba(hex: string, alpha = 1) {
	const cleaned = hex.replace("#", "");
	const fullHex =
		cleaned.length === 3
			? cleaned
					.split("")
					.map((c) => c + c)
					.join("")
			: cleaned;
	const intVal = parseInt(fullHex, 16);
	const r = (intVal >> 16) & 255;
	const g = (intVal >> 8) & 255;
	const b = intVal & 255;
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function readCssVar(name: string) {
	if (typeof window === "undefined") return "";
	const val = getComputedStyle(document.documentElement).getPropertyValue(name);
	return val ? val.trim() : "";
}

export default function getAccentColors(masterTitle: string): Accent {
	const slug = (masterTitle || "rookie").toLowerCase().replace(/\s+/g, "-");
	// Try CSS variables first: --mastery-{slug}-primary / --mastery-{slug}-secondary
	const primaryVar = readCssVar(`--mastery-${slug}-primary`);
	const textVar = readCssVar(`--mastery-${slug}-text`);
	const secondaryVar = readCssVar(`--mastery-${slug}-secondary`);

	const primary =
		primaryVar || FALLBACKS[slug as keyof typeof FALLBACKS]?.primary || FALLBACKS.rookie.primary;
	const secondary =
		secondaryVar || FALLBACKS[slug as keyof typeof FALLBACKS]?.secondary || FALLBACKS.rookie.secondary;
	const text =
		textVar || FALLBACKS[slug as keyof typeof FALLBACKS]?.text || FALLBACKS.rookie.text;
	return {
		primary,
		text,
		secondary,
		gradStart: primary,
		gradEnd: secondary,
		rgba: hexToRgba,
	};
}
