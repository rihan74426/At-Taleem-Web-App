"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  BsBook,
  BsCalendarEvent,
  BsQuestionCircle,
  BsVideo,
  BsShop,
  BsBell,
  BsArrowRight,
  BsCheckCircle,
  BsWhatsapp,
  BsLinkedin,
  BsInbox,
} from "react-icons/bs";
import { FaVideo } from "react-icons/fa";
import SendEmailModal from "../Components/sendEmail";
import { useUser } from "@clerk/nextjs";

export default function CallToAction() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const { user } = useUser();

  // Mouse move effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Features data
  const features = [
    {
      icon: <FaVideo className="w-8 h-8" />,
      title: "বয়ানের ভিডিও",
      description: "হুজুরের রেকর্ডকৃত তালিম ও জুমার ভিডিও দেখুন টপিক আকারে।",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: <BsQuestionCircle className="w-8 h-8" />,
      title: "প্রশ্নোত্তর পর্ব",
      description:
        "দৈনন্দিন জীবনের নানা ব্যবহারিক শরীয়তের হুকুম আহকাম নিয়ে প্রশ্ন করতে পারবেন। নাম গোপন রেখেও প্রশ্ন করার সুযোগ রয়েছে।",
      color: "from-green-500 to-green-600",
    },
    {
      icon: <BsBook className="w-8 h-8" />,
      title: "ই-বুক সিস্টেম",
      description:
        "আধুনিক পিডিএফ রিডার দিয়ে সবধরণের ডিভাইসে তালিমের সকল বইয়ের ডিজিটাল কপি ফ্রিতে পড়তে পারবেন।",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: <BsCalendarEvent className="w-8 h-8" />,
      title: "কর্মসূচী পরিচালনা",
      description:
        "সাপ্তাহিক, মাসিক, ও বাৎসরিকসহ সমস্ত মাহফিলের নোটিফিকেশন পান এবং মাহফিলের রেগুলার আপডেট পেতে থাকুন।",
      color: "from-red-500 to-red-600",
    },
    {
      icon: <BsBell className="w-8 h-8" />,
      title: "নিজের বক্তব্য প্রকাশ",
      description:
        "তালিমে আসার পর শত শত মানুষের জীবনাচরণ, ভাবভঙ্গি ও দ্বীন নিয়ে চিন্তাভাবনা পাল্টে যায়। আপনার গল্পটিও লিখুন।",
      color: "from-pink-500 to-pink-600",
    },
    {
      icon: <BsShop className="w-8 h-8" />,
      title: "মাসআলা জানা ও বোঝা",
      description:
        "আমাদের গবেষণাকৃত মানুষের দৈনন্দিন জীবনের কিছু কর্মে শরীয়তের দৃষ্টিভঙ্গি ও হুকুম-আহকাম দলীল সহকারে জানার সুযোগ।",
      color: "from-yellow-500 to-yellow-600",
    },
  ];

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gray-900 text-white overflow-hidden"
    >
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center">
        {/* Animated background */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-teal-900/20 to-purple-900/20"
          style={{
            backgroundImage: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(20, 184, 166, 0.15) 0%, transparent 50%)`,
          }}
        />

        <div className="relative z-10 text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-purple-400"
          >
            At-Taleem Platform
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
          >
            ইসলাম ও কুরআন-হাদিসকে কাছ থেকে জানার ও বোঝার সহজতম প্রক্রিয়া
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link
              href="/contact"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-teal-500 to-purple-500 rounded-full text-lg font-semibold hover:from-teal-600 hover:to-purple-600 transition-all transform hover:scale-105"
            >
              Get Started
              <BsArrowRight className="ml-2" />
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <motion.div
              animate={{
                y: [0, 12, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
              }}
              className="w-1 h-2 bg-white rounded-full mt-2"
            />
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold text-center mb-16"
          >
            Key Features
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="relative group"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl`}
                />
                <div className="relative p-8 bg-gray-800 rounded-2xl border border-gray-700">
                  <div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="py-20 px-4 bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold text-center mb-16"
          >
            Built with Modern Technology
          </motion.h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              "Next.js",
              "React",
              "MongoDB",
              "Tailwind CSS",
              "Framer Motion",
              "Clerk Auth",
              "Node.js",
              "Nodemailer",
            ].map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center justify-center p-6 bg-gray-700 rounded-xl"
              >
                <span className="text-lg font-medium">{tech}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-20 px-4 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold mb-8 text-white"
          >
            আপনার ব্যবসার জন্য একটি অনলাইন প্ল্যাটফর্ম চান?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-300 mb-8"
          >
            আপনার প্রতিষ্ঠানের জন্য একটি অনলাইন প্ল্যাটফর্ম তৈরি করতে চান? অথবা
            এই ধরনের একটি ওয়েবসাইট কিনতে চান? আপনার প্রয়োজন অনুযায়ী আমরা একটি
            অনলাইন প্ল্যাটফর্ম অফার করছি। যা আপনার প্রতিষ্ঠানের কার্যাবলিকে
            অটোমেটিক এবং প্রফেশনাল করে তুলবে।
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="flex items-center gap-4 bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <Image
                src="https://media.licdn.com/dms/image/v2/D4E03AQGgYs8dM3foKQ/profile-displayphoto-shrink_800_800/B4EZRpjlj4HAAc-/0/1736937727428?e=1755129600&v=beta&t=-9KiGNzmpqJaysY4hib2SNZKLvkcSLoHkDvtqCd1qPo"
                alt="Developer"
                width={150}
                height={150}
                rel="noopener noreferrer"
                className="rounded-full ring-4 ring-teal-500"
              />
              <div className="text-left">
                <h3 className="text-xl font-semibold text-white mb-1">
                  নুরুদ্দীন মোহাম্মদ রায়হান
                </h3>
                <p className="text-gray-400">Full Stack Developer</p>
                <p className="text-sm text-gray-500 mt-2">
                  আপনার প্রয়োজন ব্যাখ্যা করুন, সমাধান আমরা খুঁজে দেব ইনশাআল্লাহ!
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/+8801866042393"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-teal-500 rounded-full text-lg font-semibold hover:from-green-600 hover:to-teal-600 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <BsWhatsapp className="w-5 h-5" />
                WhatsApp
              </a>
              <a
                href="https://linkedin.com/in/rihan74426"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full text-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <BsLinkedin className="w-5 h-5" />
                LinkedIn
              </a>
              <button
                onClick={() => setEmailModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-700 rounded-full text-lg font-semibold hover:from-red-600 hover:to-orange-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <BsInbox className="w-5 h-5" />
                E-mail Now!
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      {emailModal && (
        <SendEmailModal
          defaultHeader={`This is ${
            user?.fullName || "'Your Name'"
          } from the At-taleem web`}
          defaultBody="আস্সালামু আলাইকুম!"
          defaultFooter="Thank you for your time and consideration."
          recipientEmail="rihannjna@gmail.com"
          onClose={() => setEmailModal(false)}
        />
      )}
    </div>
  );
}
