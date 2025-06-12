import "./globals.css";
import Header from "./Components/Header";
import { ThemeModeScript } from "flowbite-react";
import ThemeProvider from "./Components/ThemeProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Anek_Bangla, Mirza } from "next/font/google";
import ThemeCom from "./Components/ThemeCom";
import FooterCom from "./Components/Footer";
import PageLoader from "./Components/PageLoader";

const anekBanglaFont = Anek_Bangla({
  variable: "--font-anek-bangla",
  subsets: ["bengali"],
});

const mirzaFont = Mirza({
  variable: "--font-mirza",
  subsets: ["latin"],
  weight: "600",
  // fontWeight: 600,
});

export const metadata = {
  title: {
    default: "At-Taleem - Quran Learning Platform",
    template: "%s | At-Taleem",
  },
  description:
    "A comprehensive Quran & Hadith learning and understanding platform for the community. Access educational content, videos, and resources for Islamic studies.",
  keywords: [
    "Quran learning",
    "Hadith learning",
    "Islamic education",
    "Taleem",
    "Islamic studies",
    "Quran videos",
    "Islamic books",
    "Islamic Shariyah Questions",
  ],
  authors: [{ name: "At-Taleem" }],
  creator: "At-Taleem",
  publisher: "At-Taleem",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL), // Replace with your actual domain
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "At-Taleem - Quran & Hadith Learning Platform",
    description:
      "A comprehensive Quran & Hadith learning and understanding platform for the community. Access educational content, videos, and resources for Islamic studies.",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "At-Taleem",
    images: [
      {
        url: "/og-image.jpg", // You'll need to add this image to your public folder
        width: 1200,
        height: 630,
        alt: "At-Taleem Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "At-Taleem - Quran & Hadith Learning Platform",
    description:
      "A comprehensive Quran learning and understanding platform for the community.",
    images: ["/og-image.jpg"], // Same image as OpenGraph
    creator: "@at-taleem", // Replace with your Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ✅ This ensures the correct theme mode is loaded before hydration */}
        <ThemeModeScript />
        <link rel="icon" href="/favicon.png" type="image/png" />

        <title>At-Taleem</title>
      </head>
      <body
        className={`${anekBanglaFont.variable} ${mirzaFont.variable} antialiased`}
      >
        <ClerkProvider dynamic>
          <ThemeProvider>
            <ThemeCom>
              <PageLoader />
              <Header />
              {children}
              <FooterCom />
            </ThemeCom>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
