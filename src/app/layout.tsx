import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./Components/Header";
import { ThemeModeScript } from "flowbite-react";
import ThemeProvider from "./Components/ThemeProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Anek_Bangla } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const anekBanglaFont = Anek_Bangla({
  variable: "--font-anek-bangla",
  subsets: ["bengali"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "At-Taleem",
  description: "A Quran learning and understanding platform for the community",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ✅ This ensures the correct theme mode is loaded before hydration */}
        <ThemeModeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${anekBanglaFont.variable} antialiased`}
      >
        <ClerkProvider>
          <ThemeProvider>
            <Header />
            {children}
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
