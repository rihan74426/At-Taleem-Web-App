"use client";

import { Footer } from "flowbite-react";
import Image from "next/image";
import Link from "next/link";
import {
  BsFacebook,
  BsInstagram,
  BsTwitter,
  BsGithub,
  BsYoutube,
} from "react-icons/bs";

export default function FooterCom() {
  return (
    <Footer container className="bg-gray-900 text-gray-300 pt-12">
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12 pb-8">
        {/* Branding */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Image
              src="/favicon.png"
              alt="At-Taleem Logo"
              width={56}
              height={56}
              className="rounded-full"
            />
            <span className="text-2xl font-bold text-white">At‑Taleem</span>
          </div>
          <p className="text-sm leading-relaxed ">
            Empowering your learning journey with curated content and a vibrant
            community.
          </p>
        </div>

        {/* Explore */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-4 ">Explore</h3>
          <ul className="space-y-3 ">
            <li>
              <Link
                href="/published-books"
                className="hover:text-white transition"
              >
                Books
              </Link>
            </li>
            <li>
              <Link
                href="/taleem-videos"
                className="hover:text-white transition"
              >
                Videos
              </Link>
            </li>
            <li>
              <Link
                href="/questionnaires"
                className="hover:text-white transition"
              >
                Q&A
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Legal & Support
          </h3>
          <ul className="space-y-3">
            <li>
              <Link href="/privacy" className="hover:text-white transition">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white transition">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white transition">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Social & Newsletter */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            Stay Connected
          </h3>
          <div className="flex space-x-4 text-xl">
            <Link
              href="https://www.facebook.com/profile.php?id=100064076645371"
              className="hover:text-white transition"
            >
              <BsFacebook />
            </Link>

            <Link
              href="https://www.youtube.com/@%E0%A6%A4%E0%A6%BE%E0%A6%B2%E0%A6%BF%E0%A6%AE%E0%A6%AC%E0%A6%B9%E0%A6%A6%E0%A7%8D%E0%A6%A6%E0%A6%BE%E0%A6%B0%E0%A6%B9%E0%A6%BE%E0%A6%9F%E0%A6%9A%E0%A6%9F%E0%A7%8D%E0%A6%9F%E0%A6%97%E0%A7%8D%E0%A6%B0%E0%A6%BE%E0%A6%AE"
              className="hover:text-white transition"
            >
              <BsYoutube />
            </Link>
          </div>
          <form className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
            <input
              type="email"
              placeholder="Your email"
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-teal-500 hover:bg-teal-600 rounded text-white text-sm transition"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
        <span>
          © {new Date().getFullYear()} At‑Taleem. All rights reserved.
        </span>
        <span className="mt-2 sm:mt-0">Made with ❤️ by the At‑Taleem Team</span>
      </div>
    </Footer>
  );
}
