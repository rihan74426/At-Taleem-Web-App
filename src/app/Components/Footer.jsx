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
    <footer className="bg-blue-400 dark:bg-gray-900 text-gray-800 dark:text-gray-300 transition-colors duration-300">
      {/* Top Separator */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gray-50 dark:bg-gray-900 px-6 text-3xl font-bold text-blue-600 dark:text-teal-500 transition-colors duration-300">
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
              <span className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                At‑Taleem
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 transition-colors duration-300">
              দ্বীনি শিক্ষার আলো ছড়িয়ে দিতে আমাদের সাথে যুক্ত হোন। আপনার
              সন্তানের জন্য সঠিক শিক্ষা প্রতিষ্ঠান খুঁজে নিন।
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://www.facebook.com/profile.php?id=100064076645371"
                target="_blank"
                className="p-2 bg-gray-200 dark:bg-gray-800 hover:bg-blue-600 dark:hover:bg-teal-600 rounded-full transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-white"
              >
                <BsFacebook className="w-5 h-5" />
              </Link>
              <Link
                href="https://www.youtube.com/@%E0%A6%A4%E0%A6%BE%E0%A6%B2%E0%A6%BF%E0%A6%AE%E0%A6%AC%E0%A6%B9%E0%A6%A6%E0%A7%8D%E0%A6%A6%E0%A6%BE%E0%A6%B0%E0%A6%B9%E0%A6%BE%E0%A6%9F%E0%A6%9A%E0%A6%9F%E0%A7%8D%E0%A6%9F%E0%A6%97%E0%A7%8D%E0%A6%B0%E0%A6%BE%E0%A6%AE"
                target="_blank"
                className="p-2 bg-gray-200 dark:bg-gray-800 hover:bg-red-600 dark:hover:bg-teal-600 rounded-full transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-white"
              >
                <BsYoutube className="w-5 h-5" />
              </Link>
              <Link
                href="https://wa.me/+8801821408314"
                target="_blank"
                className="p-2 bg-gray-200 dark:bg-gray-800 hover:bg-green-600 dark:hover:bg-teal-600 rounded-full transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-white"
              >
                <BsWhatsapp className="w-5 h-5" />
              </Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
              © {new Date().getFullYear()} At‑Taleem. সর্বস্বত্ব সংরক্ষিত।
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
              দ্রুত লিংক
            </h3>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/published-books"
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-all duration-300 group"
                >
                  <BsArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  প্রকাশিত বইসমূহ
                </Link>
              </li>
              <li>
                <Link
                  href="/taleem-videos"
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-all duration-300 group"
                >
                  <BsArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  ভিডিও
                </Link>
              </li>
              <li>
                <Link
                  href="/questionnaires"
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-all duration-300 group"
                >
                  <BsArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  প্রশ্নোত্তর
                </Link>
              </li>
              <li>
                <Link
                  href="/institutions"
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-all duration-300 group"
                >
                  <BsArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  প্রতিষ্ঠানসমূহ
                </Link>
              </li>
              <li>
                <Link
                  href="/masalah"
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-all duration-300 group"
                >
                  <BsArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  মাসআলা-মাসায়েল
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
              যোগাযোগ
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <BsTelephone className="w-5 h-5 text-blue-600 dark:text-teal-500 mt-1 transition-colors duration-300" />
                <span className="text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  01845697963
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <BsEnvelope className="w-5 h-5 text-blue-600 dark:text-teal-500 mt-1 transition-colors duration-300" />
                <span className="text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  attaleemofficial@gmail.com
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <BsGeoAlt className="w-5 h-5 text-blue-600 dark:text-teal-500 mt-1 transition-colors duration-300" />
                <span className="text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  বহদ্দারহাট জামে মসজিদ, চট্টগ্রাম
                </span>
              </li>
            </ul>
          </div>

          {/* Developer Contact */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
              ডেভেলপার
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                এই ওয়েবসাইটটি তৈরি করেছেন
              </p>
              <div className="bg-white dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500/50 dark:hover:border-teal-500/50 transition-all duration-300 shadow-sm dark:shadow-none">
                <div className="flex items-center space-x-4 mb-5">
                  <div className="relative group">
                    <a
                      href="https://github.com/rihan74426"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Image
                        src="/favicon.png"
                        alt="At-Taleem Team"
                        width={52}
                        height={52}
                        className="rounded-full ring-2 ring-blue-500 dark:ring-teal-500 group-hover:ring-orange-500 transition-all duration-300"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 dark:bg-teal-500 group-hover:bg-orange-500 rounded-full p-1.5 transition-colors duration-300">
                        <BsGithub className="w-3.5 h-3.5 text-white" />
                      </div>
                    </a>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-lg mb-0.5 transition-colors duration-300">
                      Team At-Taleem
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                      Development Team
                    </p>
                  </div>
                </div>
                <div className="space-y-3.5">
                  <Link
                    href="/call-to-action"
                    target="blank"
                    className="flex items-center justify-center gap-2 w-full p-3 bg-gradient-to-r from-blue-500 to-green-600 hover:from-green-600 hover:to-blue-700 rounded-md text-white font-medium transition-all duration-300 shadow-lg hover:shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <BsEnvelope className="w-4 h-4" />
                    Contact Developer
                  </Link>
                  <p className="text-center text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1.5 transition-colors duration-300">
                    Made with{" "}
                    <span className="text-red-500 animate-pulse">❤</span> by{" "}
                    <span className="text-blue-600 dark:text-teal-400 transition-colors duration-300">
                      Team At-Taleem
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
