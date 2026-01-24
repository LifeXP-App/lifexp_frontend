import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { Providers } from "../providers";
import { Sidebar } from "../../src/components/Sidebar";
import MasteryPopupWrapper from "../../src/components/MasteryPopupWrapper";
import { PopupProvider } from "../../src/context/PopupContext";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
import { AuthProvider } from "@/src/context/AuthContext";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LifeXP",
  description: "Redefine your Life",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <AuthProvider>
          <PopupProvider>
          <div className="flex h-screen overflow-hidden">
            {/* ✅ Client wrapper handles state */}
            <MasteryPopupWrapper />

            <Sidebar />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
          </PopupProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
