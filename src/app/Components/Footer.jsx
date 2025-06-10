"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  BsFacebook,
  BsYoutube,
  BsWhatsapp,
  BsGithub,
  BsLinkedin,
  BsEnvelope,
  BsTelephone,
  BsGeoAlt,
  BsArrowRight,
} from "react-icons/bs";

export default function FooterCom() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    setLoading(true);
    try {
      // Add your newsletter subscription logic here
      toast.success("Thank you for subscribing!");
      setEmail("");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Top Separator */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-800"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gray-900 px-6 text-3xl font-bold text-teal-500">
            At‑Taleem
          </span>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Image
                src="/favicon.png"
                alt="At-Taleem Logo"
                width={48}
                height={48}
                className="rounded-full"
              />
              <span className="text-2xl font-bold text-white">At‑Taleem</span>
            </div>
            <p className="text-sm leading-relaxed">
              দ্বীনি শিক্ষার আলো ছড়িয়ে দিতে আমাদের সাথে যুক্ত হোন। আপনার
              সন্তানের জন্য সঠিক শিক্ষা প্রতিষ্ঠান খুঁজে নিন।
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://www.facebook.com/profile.php?id=100064076645371"
                target="_blank"
                className="p-2 bg-gray-800 hover:bg-teal-600 rounded-full transition-colors"
              >
                <BsFacebook className="w-5 h-5" />
              </Link>
              <Link
                href="https://www.youtube.com/@%E0%A6%A4%E0%A6%BE%E0%A6%B2%E0%A6%BF%E0%A6%AE%E0%A6%AC%E0%A6%B9%E0%A6%A6%E0%A7%8D%E0%A6%A6%E0%A6%BE%E0%A6%B0%E0%A6%B9%E0%A6%BE%E0%A6%9F%E0%A6%9A%E0%A6%9F%E0%A7%8D%E0%A6%9F%E0%A6%97%E0%A7%8D%E0%A6%B0%E0%A6%BE%E0%A6%AE"
                target="_blank"
                className="p-2 bg-gray-800 hover:bg-teal-600 rounded-full transition-colors"
              >
                <BsYoutube className="w-5 h-5" />
              </Link>
              <Link
                href="https://wa.me/+8801821408314"
                target="_blank"
                className="p-2 bg-gray-800 hover:bg-teal-600 rounded-full transition-colors"
              >
                <BsWhatsapp className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">
              দ্রুত লিংক
            </h3>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/published-books"
                  className="flex items-center text-gray-400 hover:text-white transition-colors group"
                >
                  <BsArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  প্রকাশিত বইসমূহ
                </Link>
              </li>
              <li>
                <Link
                  href="/taleem-videos"
                  className="flex items-center text-gray-400 hover:text-white transition-colors group"
                >
                  <BsArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  ভিডিও লেকচার
                </Link>
              </li>
              <li>
                <Link
                  href="/questionnaires"
                  className="flex items-center text-gray-400 hover:text-white transition-colors group"
                >
                  <BsArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  প্রশ্নোত্তর
                </Link>
              </li>
              <li>
                <Link
                  href="/institutions"
                  className="flex items-center text-gray-400 hover:text-white transition-colors group"
                >
                  <BsArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  প্রতিষ্ঠানসমূহ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">যোগাযোগ</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <BsTelephone className="w-5 h-5 text-teal-500 mt-1" />
                <span>01845697963</span>
              </li>
              <li className="flex items-start space-x-3">
                <BsEnvelope className="w-5 h-5 text-teal-500 mt-1" />
                <span>attaleemofficial@gmail.com</span>
              </li>
              <li className="flex items-start space-x-3">
                <BsGeoAlt className="w-5 h-5 text-teal-500 mt-1" />
                <span>বহদ্দারহাট জামে মসজিদ, চট্টগ্রাম</span>
              </li>
            </ul>
          </div>

          {/* Developer Contact */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">ডেভেলপার</h3>
            <div className="space-y-4">
              <p className="text-sm">এই ওয়েবসাইটটি তৈরি করেছেন</p>
              <div className="flex items-center space-x-3">
                <Image
                  src="/developer.jpg"
                  alt="Developer"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <h4 className="font-medium text-white">
                    আব্দুল্লাহ আল মামুন
                  </h4>
                  <p className="text-sm text-gray-400">Full Stack Developer</p>
                </div>
              </div>
              <div className="flex space-x-4">
                <Link
                  href="https://github.com/yourusername"
                  target="_blank"
                  className="p-2 bg-gray-800 hover:bg-teal-600 rounded-full transition-colors"
                >
                  <BsGithub className="w-5 h-5" />
                </Link>
                <Link
                  href="https://linkedin.com/in/yourusername"
                  target="_blank"
                  className="p-2 bg-gray-800 hover:bg-teal-600 rounded-full transition-colors"
                >
                  <BsLinkedin className="w-5 h-5" />
                </Link>
                <Link
                  href="mailto:your.email@example.com"
                  className="p-2 bg-gray-800 hover:bg-teal-600 rounded-full transition-colors"
                >
                  <BsEnvelope className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} At‑Taleem. সর্বস্বত্ব সংরক্ষিত।
            </p>
            <div className="flex space-x-6">
              <Link
                href="/privacy"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                গোপনীয়তা নীতি
              </Link>
              <Link
                href="/terms"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                শর্তাবলী
              </Link>
              <Link
                href="/contact"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                যোগাযোগ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
