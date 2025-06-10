// src/app/institutions/page.jsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Loader from "@/app/Components/Loader";
import { FiMapPin, FiUsers, FiBookOpen, FiMail, FiBell } from "react-icons/fi";
import SendEmailModal from "../Components/sendEmail";
import { useUser } from "@clerk/nextjs";
import ResponseModal from "../Components/ResponseModal";
import { format } from "date-fns";
import { FaGraduationCap } from "react-icons/fa";

// Add InstitutionSkeleton component
const InstitutionSkeleton = () => (
  <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-pulse">
    {/* Header skeleton */}
    <div className="flex flex-col md:flex-row items-center bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 p-8">
      <div className="w-32 h-32 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      <div className="mt-4 md:mt-0 md:ml-8">
        <div className="h-8 w-48 bg-gray-300 dark:bg-gray-600 rounded"></div>
        <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded mt-2"></div>
      </div>
    </div>

    <div className="p-8 space-y-8">
      {/* Description & Address skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
          <div className="h-6 w-24 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
          <div className="h-6 w-24 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
          <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl flex items-center justify-center"
          >
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full mr-3"></div>
            <div>
              <div className="h-6 w-12 bg-gray-300 dark:bg-gray-600 rounded mb-1"></div>
              <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Departments & Admission skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
          <div className="h-6 w-32 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-4 w-3/4 bg-gray-300 dark:bg-gray-600 rounded"
              ></div>
            ))}
          </div>
          <div className="mt-6">
            <div className="h-6 w-24 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
            <div className="h-10 w-48 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
          <div className="h-6 w-24 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
            <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
          <div className="mt-6">
            <div className="h-4 w-full bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
            <div className="h-10 w-full bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState({});
  const [notifyStatus, setNotifyStatus] = useState({});
  const [emailModal, setEmailModal] = useState(false);
  const user = useUser();
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });
  const showModal = (m, s) => setModal({ isOpen: true, message: m, status: s });

  const fetchInstitutions = async () => {
    await fetch("/api/institutions")
      .then((res) => res.json())
      .then(({ institutions }) => setInstitutions(institutions))
      .catch(() => setInstitutions([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    fetchInstitutions();
  }, []);

  const handleNotify = async (institutionId) => {
    const email = user.isSignedIn
      ? user.user.emailAddresses[0]?.emailAddress.trim()
      : notifyEmail[institutionId]?.trim();
    if (!email) {
      setNotifyStatus((s) => ({ ...s, [institutionId]: "Enter your email" }));
      return;
    }

    const res = await fetch(`/api/institutions/${institutionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setNotifyStatus((s) => ({ ...s, [institutionId]: "Subscribed!" }));
      fetchInstitutions();
    } else {
      const { error } = await res.json();
      setNotifyStatus((s) => ({ ...s, [institutionId]: error || "Failed" }));
    }
  };

  return (
    <main className="space-y-20 px-4 py-12 md:px-8 lg:px-16">
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl overflow-hidden text-white p-12 flex flex-col md:flex-row items-center gap-8 shadow-xl">
        <div className="md:flex-1 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            সন্তানের দ্বীনি জ্ঞানের স্বপ্নযাত্রায় স্বাগতম!
          </h1>
          <p className="text-lg md:text-xl text-gray-100">
            আমাদের প্রতিষ্ঠানগুলোর মান যাচাই করুন, এবং ঘুরে দেখুন কোনটি আপনার
            সন্তানের জন্য উপযুক্ত হয়!
          </p>
          <div className="flex gap-4 mt-6">
            <button className="px-6 py-3 bg-white text-teal-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              প্রতিষ্ঠান খুঁজুন
            </button>
            <button className="px-6 py-3 bg-teal-700 text-white rounded-lg font-semibold hover:bg-teal-800 transition-colors">
              ভর্তি প্রক্রিয়া
            </button>
          </div>
        </div>
        <div className="md:flex-1 flex justify-center">
          <Image
            src="/campus-hero.png"
            alt="Campus illustration"
            width={400}
            height={300}
            className="object-contain transform hover:scale-105 transition-transform duration-300"
          />
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-gray-700">
        {[
          {
            icon: <FiMapPin size={32} className="text-teal-500" />,
            title: "প্রধান কার্যালয়",
            desc: "প্রাতিষ্ঠানিক কার্যক্রম সম্পর্কে বিস্তারিত জানতে ভিজিট করুনঃ ৩৭০ বি, বাইতুচ ছালাম ভবন, আল-আমীন রোড, শুলকবহর, বহদ্দারহাট, চট্টগ্রাম।",
          },
          {
            icon: <FiUsers size={32} className="text-blue-500" />,
            title: "তালিম কমিউনিটি",
            desc: "তালিমের সমাজে যোগ দিয়ে নিজেই পর্যবেক্ষণ করুন সন্তানকে দ্বীনের কোনমূখী শিক্ষা প্রদান করবেন!",
          },
          {
            icon: <FiBookOpen size={32} className="text-purple-500" />,
            title: "বৃহত্তর শিক্ষা কার্যক্রম",
            desc: "এখানে নূরানী, কিতাব, হেফজ, মহিলা হেফজসহ আরও অনেক কোর্সে সন্তানের পাঠ নিশ্চিত করতে পারবেন!",
          },
        ].map((f, i) => (
          <div
            key={i}
            className="flex flex-col items-center text-center bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-full mb-4">
              {f.icon}
            </div>
            <h3 className="mt-4 text-xl font-semibold">{f.title}</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Institutions Grid */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-center">
            আমাদের প্রতিষ্ঠানসমূহ
          </h2>
        </div>
        {loading ? (
          <div className="space-y-16">
            {[1, 2, 3].map((i) => (
              <InstitutionSkeleton key={i} />
            ))}
          </div>
        ) : institutions?.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <p className="text-gray-500 text-lg">
              কোন প্রতিষ্ঠান পাওয়া যায়নি।
            </p>
          </div>
        ) : (
          <main className="space-y-16">
            {institutions?.map((inst) => (
              <section
                key={inst._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                {/* Hero: logo, title, code */}
                <div className="flex flex-col md:flex-row items-center bg-gradient-to-r from-teal-500 to-blue-600 p-8 text-white">
                  {inst.logoUrl ? (
                    <div className="w-32 h-32 relative flex-shrink-0 bg-white rounded-full p-2 shadow-lg">
                      <Image
                        src={inst.logoUrl}
                        alt={inst.title + " logo"}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-gray-500 shadow-lg">
                      No Logo
                    </div>
                  )}
                  <div className="mt-4 md:mt-0 md:ml-8 text-center md:text-left">
                    <h2 className="text-3xl font-bold">{inst.title}</h2>
                    <p className="mt-1 uppercase tracking-wide text-sm opacity-90">
                      {inst.code}
                    </p>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  {/* Description & Address */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
                      <h3 className="text-xl font-semibold mb-4">বিবরণ</h3>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {inst.description || "No description available."}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
                      <h3 className="text-xl font-semibold mb-4">অবস্থান</h3>
                      <p className="flex items-center text-gray-700 dark:text-gray-300">
                        <FiMapPin className="mr-2 text-teal-500" />{" "}
                        {inst.address}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <FiUsers size={24} className="mr-3 text-teal-500" />
                      <div>
                        <p className="font-semibold text-xl">
                          {inst.studentCount}
                        </p>
                        <p className="text-sm">শিক্ষার্থী</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <FiBookOpen size={24} className="mr-3 text-blue-500" />
                      <div>
                        <p className="font-semibold text-xl">
                          {inst.departments.length}
                        </p>
                        <p className="text-sm">বিভাগ</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-300">
                      <FaGraduationCap
                        size={24}
                        className="mr-3 text-orange-500"
                      />
                      <div>
                        <p className="font-semibold text-xl">
                          {inst.establishedAt
                            ? new Date(inst.establishedAt).getFullYear()
                            : "N/A"}
                        </p>
                        <p className="text-sm">স্থাপিত</p>
                      </div>
                    </div>
                  </div>

                  {/* Departments list */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
                      <h3 className="text-xl font-semibold mb-4">বিভাগসমূহ</h3>
                      <ul className="space-y-2">
                        {inst.departments.length > 0 ? (
                          inst.departments.map((d, i) => (
                            <li
                              key={i}
                              className="flex items-center text-gray-700 dark:text-gray-300"
                            >
                              <span className="w-2 h-2 bg-teal-500 rounded-full mr-2"></span>
                              {d.name}
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-500">
                            কোন বিভাগ যুক্ত করা হয়নি
                          </li>
                        )}
                      </ul>
                      {/* Contact */}
                      <div className="space-y-4 mt-6">
                        <h3 className="text-xl font-semibold">যোগাযোগ</h3>
                        <p className="flex items-center text-gray-700 dark:text-gray-300">
                          <FiMail className="mr-2 text-teal-500" /> {inst.email}
                        </p>
                        <button
                          onClick={() => {
                            if (!user.isSignedIn)
                              return showModal(
                                "প্রতিষ্ঠানকে মেসেজ করার জন্য দয়া করে লগিন করুন!",
                                "error"
                              );
                            setEmailModal(true);
                          }}
                          className="inline-flex items-center px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition-colors"
                        >
                          <FiMail className="mr-2" /> প্রতিষ্ঠানকে মেইল পাঠান
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
                      <h3 className="text-xl font-semibold mb-4">ভর্তি</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                          <span className="text-gray-600 dark:text-gray-300">
                            ভর্তি শুরুর তারিখ
                          </span>
                          <span className="font-semibold">
                            {format(
                              new Date(inst.admissionPeriod.openDate),
                              "dd/MMM/yyyy"
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                          <span className="text-gray-600 dark:text-gray-300">
                            ভর্তি শেষের তারিখ
                          </span>
                          <span className="font-semibold">
                            {format(
                              new Date(inst.admissionPeriod.closeDate),
                              "dd/MMM/yyyy"
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Admission notify */}
                      <div className="mt-6 space-y-4">
                        {inst.admissionStatus ? (
                          <>
                            <p className="text-gray-700 dark:text-gray-300">
                              এখন ভর্তি চলছে! ভর্তি প্রক্রিয়ার জন্য নিচে ক্লিক
                              করুন!
                            </p>
                            <button
                              onClick={() =>
                                (window.location.href =
                                  inst.applyLink || "/apply")
                              }
                              className="w-full inline-flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                            >
                              <FiBell className="mr-2" /> এখনি আবেদন করুন
                            </button>
                          </>
                        ) : (
                          <>
                            <p className="text-gray-700 dark:text-gray-300">
                              নোটঃ এখন ভর্তি কার্যক্রম বন্ধ। আপনার ইমেইল ঠিকানা
                              নিচে দিয়ে রাখুন। ভর্তি কার্যক্রম চালু হলে আপনাকে
                              জানানো হবে।
                            </p>
                            {inst.interestedEmails?.some(
                              (e) =>
                                e ===
                                user?.user?.emailAddresses?.[0]?.emailAddress
                            ) ? (
                              <div className="p-4 bg-green-100 text-green-800 rounded-lg text-center">
                                আপনাকে জানানো হবে
                              </div>
                            ) : (
                              <div className="flex gap-4">
                                {!user.isSignedIn && (
                                  <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={notifyEmail[inst._id] || ""}
                                    onChange={(e) =>
                                      setNotifyEmail((s) => ({
                                        ...s,
                                        [inst._id]: e.target.value,
                                      }))
                                    }
                                    className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  />
                                )}
                                <button
                                  onClick={() => handleNotify(inst._id)}
                                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors inline-flex items-center"
                                >
                                  <FiBell className="mr-2" /> আমাকে জানানো হোক
                                </button>
                              </div>
                            )}
                            {notifyStatus[inst._id] && (
                              <p className="text-sm text-teal-600 mt-2">
                                {notifyStatus[inst._id]}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {emailModal && (
                  <SendEmailModal
                    defaultHeader={`This is from ${user.user.fullName} from the At-taleem web`}
                    defaultBody="আস্সালামু আলাইকুম!"
                    defaultFooter="Thank you for your time and consideration."
                    recipientEmail={inst.email}
                    onClose={() => setEmailModal(false)}
                  />
                )}
              </section>
            ))}
          </main>
        )}
      </section>
      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal((m) => ({ ...m, isOpen: false }))}
      />
    </main>
  );
}
