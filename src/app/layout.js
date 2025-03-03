import "./globals.css";
import Header from "./Components/Header";
import { Footer, ThemeModeScript } from "flowbite-react";
import ThemeProvider from "./Components/ThemeProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Anek_Bangla } from "next/font/google";
import ThemeCom from "./components/ThemeCom";

import localFont from "next/font/local";

const geistSans = localFont({
  src: "../public/fonts/Geist-Regular.woff2", // Adjust path based on your file location
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "../public/fonts/GeistMono-Regular.woff2",
  variable: "--font-geist-mono",
});

const anekBanglaFont = Anek_Bangla({
  variable: "--font-anek-bangla",
  subsets: ["bengali"],
});

export const metadata = {
  title: "At-Taleem",
  description: "A Quran learning and understanding platform for the community",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ This ensures the correct theme mode is loaded before hydration */}
        <ThemeModeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${anekBanglaFont.variable} antialiased`}
      >
        <ClerkProvider>
          <ThemeProvider>
            <ThemeCom>
              <Header />
              {children}
              <Footer />
            </ThemeCom>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
