"use client";

import { useState } from "react";
import {
  BsAward,
  BsCalendar,
  BsChevronRight,
  BsClock,
  BsHeart,
  BsHeartFill,
  BsPhone,
  BsStar,
} from "react-icons/bs";
import { FaBookOpen, FaMapPin, FaQuran, FaUsers } from "react-icons/fa";
import { FiMail } from "react-icons/fi";
import { motion } from "framer-motion";
import AboutUsPage from "../Components/ReviewCard";

export default function AtTaleemAbout() {
  const [activeTab, setActiveTab] = useState("mission");

  // Animation classes for smooth transitions
  const fadeInUp =
    "opacity-0 translate-y-8 animate-[fadeInUp_0.8s_ease-out_forwards]";
  const fadeIn = "opacity-0 animate-[fadeIn_1s_ease-out_forwards]";
  const slideInLeft =
    "opacity-0 -translate-x-8 animate-[slideInLeft_0.8s_ease-out_forwards]";

  const stats = [
    {
      icon: FaUsers,
      number: "5,000+",
      label: "সদস্য",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: FaBookOpen,
      number: "5+",
      label: "প্রতিষ্ঠান",
      color: "text-green-600 dark:text-green-400",
    },
    {
      icon: BsCalendar,
      number: "18",
      label: "বছরের অভিজ্ঞতা",
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      icon: BsAward,
      number: "500+",
      label: "সফল স্নাতক",
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  const principles = [
    "কুরআন ও সুন্নাহর আলোকে শিক্ষা",
    "গরিব ও অসহায়দের জন্য স্কলারশীপ",
    "নবী (সা.) এর আদর্শ অনুসরণ",
    "সমাজের সর্বস্তরে ইসলামি জ্ঞান বিতরণ",
    "চরিত্র গঠন ও নৈতিক উন্নয়ন",
    "পারস্পরিক সহযোগিতা ও ভ্রাতৃত্ব",
  ];

  const events = [
    {
      title: "সাপ্তাহিক তালিম",
      description: "প্রতি শুক্রবার মাগরিবের পর",
      icon: BsCalendar,
    },
    {
      title: "মাসিক জিকির মাহফিল",
      description: "প্রতি চন্দ্র মাসে একবার",
      icon: FaUsers,
    },
    {
      title: "হিফজুল কুরআন প্রতিযোগিতা",
      description: "বার্ষিক আয়োজন",
      icon: BsStar,
    },
    {
      title: "ফোরকানিয়া মাদ্রাসা",
      description: "ফজরের পর এলাকার ছোটবড় সকলের জন্য কুরআন শিক্ষা",
      icon: FaQuran,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 dark:from-emerald-800 dark:via-teal-900 dark:to-cyan-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20 dark:opacity-30"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300 opacity-10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-6 py-24 text-center">
          <h1
            className={`text-5xl md:text-7xl font-bold mb-6 ${fadeIn}`}
            style={{ animationDelay: "0.2s" }}
          >
            আত-তালীম
          </h1>
          <p
            className={`text-xl md:text-2xl mb-8 max-w-4xl mx-auto leading-relaxed ${fadeInUp}`}
            style={{ animationDelay: "0.4s" }}
          >
            ২০০৬ সাল থেকে সাধারণ মানুষ ও স্থানীয় ব্যবসায়ীদের ইসলামের মৌলিক
            শিক্ষা ও দৈনন্দিন জীবনে ইসলাম চর্চার জ্ঞান প্রদানে নিবেদিত
          </p>
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center ${fadeInUp}`}
            style={{ animationDelay: "0.6s" }}
          >
            <button className="bg-white text-emerald-700 dark:bg-gray-800 dark:text-emerald-300 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2">
              আমাদের সাথে যুক্ত হন
              <BsChevronRight size={20} />
            </button>
            <button className="border-2 border-white text-white dark:border-gray-300 dark:text-gray-300 px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-emerald-700 dark:hover:bg-gray-700 dark:hover:text-emerald-300 transition-all">
              আরও জানুন
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center group ${fadeInUp}`}
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              >
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl hover:shadow-lg transition-all group-hover:scale-105">
                  <stat.icon
                    className={`mx-auto mb-4 ${stat.color}`}
                    size={48}
                  />
                  <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {stat.number}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision Tabs */}
      <section className="py-16 bg-gray-100 dark:bg-gray-700">
        <div className="container mx-auto px-6">
          <h2
            className={`text-4xl font-bold text-center mb-12 text-gray-800 dark:text-gray-100 ${fadeIn}`}
          >
            আমাদের লক্ষ্য ও উদ্দেশ্য
          </h2>

          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <div className="relative bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg">
                {/* Sliding Indicator */}
                <motion.div
                  className="absolute top-0 left-0 h-full w-1/2 bg-emerald-600 dark:bg-emerald-500 rounded-full"
                  initial={false}
                  animate={{ x: activeTab === "mission" ? "0%" : "100%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                {/* Buttons */}
                <div className="relative z-10 flex">
                  <motion.button
                    onClick={() => setActiveTab("mission")}
                    className={`px-8 py-3 rounded-full font-semibold transition-colors ${
                      activeTab === "mission"
                        ? "text-white dark:text-gray-900"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    whileHover={{ scale: 1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    মিশন
                  </motion.button>
                  <motion.button
                    onClick={() => setActiveTab("vision")}
                    className={`px-8 py-3 rounded-full font-semibold transition-colors ${
                      activeTab === "vision"
                        ? "text-white dark:text-gray-900"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    whileHover={{ scale: 1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    ভিশন
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              {activeTab === "mission" ? (
                <div className={fadeIn}>
                  <h3 className="text-2xl font-bold mb-6 text-emerald-700 dark:text-emerald-300">
                    আমাদের মিশন
                  </h3>
                  <p className="text-gray-700 dark:text-gray-200 leading-relaxed text-lg mb-6">
                    অশিক্ষিত সাধারণ মানুষ ও স্থানীয় ব্যবসায়ীদের ইসলামের মৌলিক
                    ও মূল আদর্শ সম্পর্কে শিক্ষা প্রদান এবং তাদের দৈনন্দিন জীবনে
                    ইসলাম চর্চা ও বাধ্যতামূলক ইবাদত-বন্দেগি সম্পাদনের জন্য
                    প্রয়োজনীয় জ্ঞান প্রদান করা।
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 p-6 rounded-xl">
                      <FaBookOpen
                        className="text-emerald-600 dark:text-emerald-400 mb-3"
                        size={32}
                      />
                      <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">
                        শিক্ষা বিস্তার
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        গরিব ও সত্যিকারের ইসলামি জনগণের সন্তানদের জন্য
                        প্রতিষ্ঠান স্থাপন
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-xl">
                      <BsHeartFill
                        className="text-blue-600 dark:text-blue-400 mb-3"
                        size={32}
                      />
                      <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">
                        নবী (সা.) এর আদর্শ
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        রাসূলুল্লাহ (সা.) এর শিক্ষা ও আদর্শের ভিত্তিতে শিক্ষা
                        প্রদান
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={fadeIn}>
                  <h3 className="text-2xl font-bold mb-6 text-emerald-700 dark:text-emerald-300">
                    আমাদের ভিশন
                  </h3>
                  <p className="text-gray-700 dark:text-gray-200 leading-relaxed text-lg mb-6">
                    একটি ইসলামি জ্ঞানভিত্তিক সমাজ গড়ে তোলা যেখানে প্রতিটি
                    মুসলিম তার দৈনন্দিন জীবনে ইসলামের প্রকৃত শিক্ষা অনুসরণ করবে
                    এবং আল্লাহ ও তাঁর রাসূলের (সা.) হুকুম অনুযায়ী জীবন যাপন
                    করবে।
                  </p>
                  <div className="bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 p-6 rounded-xl">
                    <div className="flex items-center mb-4">
                      <BsStar
                        className="text-yellow-500 dark:text-yellow-300 mr-2"
                        size={24}
                      />
                      <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                        আমাদের স্বপ্ন
                      </h4>
                    </div>
                    <p className="text-gray-700 dark:text-gray-200">
                      সমাজের সকল স্তরের মানুষের কাছে ইসলামি জ্ঞানের আলো পৌঁছে
                      দেওয়া এবং একটি আদর্শ ইসলামি সমাজ প্রতিষ্ঠা করা।
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Principles Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-6">
          <h2
            className={`text-4xl font-bold text-center mb-12 text-gray-800 dark:text-gray-100 ${fadeIn}`}
          >
            আমাদের মূলনীতি
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {principles.map((principle, index) => (
                <div
                  key={index}
                  className={`flex items-center bg-gray-50 dark:bg-gray-700 p-6 rounded-xl hover:shadow-md transition-all group ${slideInLeft}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="bg-emerald-100 dark:bg-emerald-900 p-3 rounded-full mr-4 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800 transition-colors">
                    <FaBookOpen
                      className="text-emerald-600 dark:text-emerald-400"
                      size={24}
                    />
                  </div>
                  <p className="text-gray-700 dark:text-gray-200 font-medium">
                    {principle}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Foundation Story */}
      <section className="py-16 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2
              className={`text-4xl font-bold mb-8 text-gray-800 dark:text-gray-100 ${fadeIn}`}
            >
              আমাদের প্রতিষ্ঠার ইতিহাস
            </h2>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-emerald-100 dark:bg-emerald-900 p-4 rounded-full">
                  <BsClock
                    className="text-emerald-600 dark:text-emerald-400"
                    size={32}
                  />
                </div>
              </div>
              <p
                className={`text-gray-700 dark:text-gray-200 text-lg leading-relaxed mb-6 ${fadeInUp}`}
                style={{ animationDelay: "0.3s" }}
              >
                ২০০৬ সালে আত-তালীম প্রতিষ্ঠিত হয়েছিল সমাজের অশিক্ষিত ও অসহায়
                মানুষদের ইসলামি শিক্ষার আলোয় আলোকিত করার মহান উদ্দেশ্যে।
                প্রতিষ্ঠার পর থেকে আমরা নিরলসভাবে কাজ করে যাচ্ছি গরিব ও
                প্রান্তিক জনগোষ্ঠীর কাছে ইসলামের প্রকৃত শিক্ষা পৌঁছে দিতে।
              </p>
              <p
                className={`text-gray-600 dark:text-gray-300 leading-relaxed ${fadeInUp}`}
                style={{ animationDelay: "0.5s" }}
              >
                আমাদের যাত্রা শুরু হয়েছিল কয়েকজন ইসলামি শিক্ষাবিদ ও সমাজসেবকের
                হাত ধরে, যারা স্বপ্ন দেখেছিলেন একটি শিক্ষিত ও ধর্মপ্রাণ সমাজের।
                আজ ১৮ বছর পর আমরা গর্বের সাথে বলতে পারি যে হাজার হাজার মানুষ
                আমাদের শিক্ষায় উপকৃত হয়েছেন।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Events & Programs */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-6">
          <h2
            className={`text-4xl font-bold text-center mb-12 text-gray-800 dark:text-gray-100 ${fadeIn}`}
          >
            আমাদের কার্যক্রম
          </h2>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {events.map((event, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900 dark:to-teal-900 p-6 rounded-2xl border border-emerald-100 dark/tutorials dark:border-emerald-800 hover:shadow-lg transition-all group ${fadeInUp}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="bg-emerald-100 dark:bg-emerald-800 p-3 rounded-full w-fit mb-4 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-700 transition-colors">
                    <event.icon
                      className="text-emerald-600 dark:text-emerald-400"
                      size={24}
                    />
                  </div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {event.description}
                  </p>
                  <div className="mt-4 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                    বিনামূল্যে সবার জন্য
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <p
                className={`text-gray-600 dark:text-gray-300 text-lg mb-6 ${fadeIn}`}
              >
                আমাদের সকল কার্যক্রম সম্পূর্ণ বিনামূল্যে এবং সবার জন্য উন্মুক্ত
              </p>
              <button
                className={`bg-emerald-600 text-white dark:bg-emerald-500 dark:text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all transform hover:scale-105 ${fadeInUp}`}
                style={{ animationDelay: "0.3s" }}
              >
                কার্যক্রমে অংশগ্রহণ করুন
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <AboutUsPage />
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-100 dark:bg-gray-700">
        <div className="container mx-auto px-6">
          <h2
            className={`text-4xl font-bold text-center mb-12 text-gray-800 dark:text-gray-100 ${fadeIn}`}
          >
            যোগাযোগ করুন
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div
                className={`text-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg ${fadeInUp}`}
                style={{ animationDelay: "0.2s" }}
              >
                <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full w-fit mx-auto mb-4">
                  <BsPhone
                    className="text-blue-600 dark:text-blue-400"
                    size={24}
                  />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">
                  ফোন
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  +৮৮০ ১৮৪৫৬৯৭৯৬৩
                </p>
              </div>

              <div
                className={`text-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg ${fadeInUp}`}
                style={{ animationDelay: "0.4s" }}
              >
                <div className="bg-green-100 dark:bg-green-900 p-4 rounded-full w-fit mx-auto mb-4">
                  <FiMail
                    className="text-green-600 dark:text-green-400"
                    size={24}
                  />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">
                  ইমেইল
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  attaleemofficial@gmail.com
                </p>
              </div>

              <div
                className={`text-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg ${fadeInUp}`}
                style={{ animationDelay: "0.6s" }}
              >
                <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-full w-fit mx-auto mb-4">
                  <FaMapPin
                    className="text-purple-600 dark:text-purple-400"
                    size={24}
                  />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">
                  ঠিকানা
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  বহদ্দারহাট, চট্টগ্রাম
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-800 dark:to-teal-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className={`text-4xl font-bold mb-6 ${fadeIn}`}>
            আজই আমাদের সাথে যুক্ত হন
          </h2>
          <p
            className={`text-xl mb-8 max-w-2xl mx-auto ${fadeInUp}`}
            style={{ animationDelay: "0.2s" }}
          >
            ইসলামি জ্ঞান অর্জন করুন এবং আপনার জীবনকে আলোকিত করুন আল্লাহর হুকুম
            অনুযায়ী এবং দাওয়াতী কার্যক্রমে অংশ নিয়ে আল্লাহর সন্তুষ্টি হাসিল
            করুন
          </p>
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center ${fadeInUp}`}
            style={{ animationDelay: "0.4s" }}
          >
            <button className="bg-white text-emerald-700 dark:bg-gray-800 dark:text-emerald-300 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all transform hover:scale-105">
              নিবন্ধন করুন
            </button>
            <button className="border-2 border-white text-white dark:border-gray-300 dark:text-gray-300 px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-emerald-700 dark:hover:bg-gray-700 dark:hover:text-emerald-300 transition-all">
              আরও তথ্য জানুন
            </button>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(2rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-2rem);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
