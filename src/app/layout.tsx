import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import React from "react";
import { Toaster } from 'react-hot-toast';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "SPARK SKOOL - Educational Platform",
  description: "AI-powered educational platform for teachers and students",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scrollbar-hide">
      <body className="flex flex-col h-screen overflow-hidden">
        <Toaster position="top-right" />
        <div className="flex-1 overflow-y-auto invisible-scrollbar">
          {children}
        </div>
      </body>
    </html>
  );
}
