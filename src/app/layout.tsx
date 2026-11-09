import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Noto_Sans_TC, Noto_Serif_TC } from "next/font/google";
import "./globals.css";

const notoSansTc = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-tc",
  display: "swap",
});

const notoSerifTc = Noto_Serif_TC({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-serif-tc",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-en",
  display: "swap",
});

export const metadata: Metadata = {
  title: "復興檔案：時光的邀請｜FUHSING CHRONICLES",
  description:
    "臺北市私立復興實驗高級中學 校園探索解謎互動體驗 — 透過八道校園謎題與記憶碎片，探索復興的建築、校史、生態與火炬精神。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#101827",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="zh-Hant"
      className={`${notoSansTc.variable} ${notoSerifTc.variable} ${cormorant.variable}`}
    >
      <body className="min-h-screen bg-[#101827] text-[#F3F1EA] font-sans antialiased selection:bg-[#D9B978]/30 selection:text-[#F3F1EA]">
        {children}
      </body>
    </html>
  );
}
