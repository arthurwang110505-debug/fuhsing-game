import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  title: "復興檔案：時光的邀請｜FUHSING CHRONICLES",
  description:
    "臺北市私立復興實驗高級中學 校園探索解謎互動體驗 — 透過八道校園謎題與記憶碎片，探索復興的建築、校史、生態與火炬精神。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#F2F6FD",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* 手寫字體：霞鶩文楷 LXGW WenKai TC（離線時自動降級為系統手寫／楷體字） */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- app router root layout 全站生效；本專案僅單一路由 */}
        <link
          href="https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F2F6FD] text-[#213155] font-sans antialiased selection:bg-[#F9CF00]/50 selection:text-[#213155]">
        {children}
      </body>
    </html>
  );
}
