import "./globals.css";
import Header from "./Components/Header";
import { ThemeModeScript } from "flowbite-react";
import ThemeProvider from "./Components/ThemeProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Anek_Bangla, Mirza } from "next/font/google";
import ThemeCom from "./Components/ThemeCom";

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
  title: "At-Taleem",
  description: "A Quran learning and understanding platform for the community",
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
              <Header />
              {children}
              {/* <Footer /> */}
            </ThemeCom>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
