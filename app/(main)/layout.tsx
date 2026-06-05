import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { Providers } from "../providers";
import { Sidebar } from "../../src/components/Sidebar";
import MasteryPopupWrapper from "../../src/components/MasteryPopupWrapper";
import { PopupProvider } from "../../src/context/PopupContext";
import { AuthProvider } from "@/src/context/AuthContext";
import { AuthGuard } from "@/src/components/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

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
            <AuthGuard>
              <PopupProvider>
                <div className="flex h-screen overflow-hidden">
                  {/* ✅ Client wrapper handles state */}
                  <MasteryPopupWrapper />

                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">{children}</main>
                </div>
              </PopupProvider>
            </AuthGuard>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
