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
      <section className="relative bg-gradient-to-r from-teal-500 to-blue-600 rounded-lg overflow-hidden text-white p-12 flex flex-col md:flex-row items-center gap-8">
        <div className="md:flex-1">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            সন্তানের দ্বীনি জ্ঞানের স্বপ্নযাত্রায় স্বাগতম!
          </h1>
          <p className="text-lg md:text-xl">
            আমাদের প্রতিষ্ঠানগুলোর মান যাচাই করুন, এবং ঘুরে দেখুন কোনটি আপনার
            সন্তানের জন্য উপযুক্ত হয়!
          </p>
        </div>
        <div className="md:flex-1 flex justify-center">
          <Image
            src="/campus-hero.png"
            alt="Campus illustration"
            width={400}
            height={300}
            className="object-contain"
          />
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-gray-700">
        {[
          {
            icon: <FiMapPin size={32} className="text-teal-500" />,
            title: "প্রধান কার্যালয়",
            desc: "প্রাতিষ্ঠানিক কার্যক্রম সম্পর্কে বিস্তারিত জানতে ভিজিট করুনঃ ৩৭০ বি, বাইতুচ ছালাম ভবন, আল-আমীন রোড, শুলকবহর, বহদ্দারহাট, চট্টগ্রাম।",
          },
          {
            icon: <FiUsers size={32} className="text-blue-500" />,
            title: "তালিম কমিউনিটি",
            desc: "তালিমের সমাজে যোগ দিয়ে নিজেই পর্যবেক্ষণ করুন সন্তানকে দ্বীনের কোনমূখী শিক্ষা প্রদান করবেন!",
          },
          {
            icon: <FiBookOpen size={32} className="text-purple-500" />,
            title: "বৃহত্তর শিক্ষা কার্যক্রম",
            desc: "এখানে নূরানী, কিতাব, হেফজ, মহিলা হেফজসহ আরও অনেক কোর্সে সন্তানের পাঠ নিশ্চিত করতে পারবেন!",
          },
        ].map((f, i) => (
          <div
            key={i}
            className="flex flex-col items-center text-center bg-white shadow-md rounded-lg p-6 hover:shadow-xl transition"
          >
            {f.icon}
            <h3 className="mt-4 text-xl font-semibold">{f.title}</h3>
            <p className="mt-2">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Institutions Grid */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-center">
          আমাদের প্রতিষ্ঠানসমূহ
        </h2>
        {loading ? (
          <div className="flex place-content-center">
            <Loader />
          </div>
        ) : institutions?.length === 0 ? (
          <p className="text-center text-gray-500">No institutions found.</p>
        ) : (
          <main className="space-y-16 px-6 py-12">
            {(!institutions || institutions.length === 0) && (
              <p className="text-center text-gray-500">
                No institutions to display.
              </p>
            )}

            {institutions?.map((inst) => (
              <section
                key={inst._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
              >
                {/* Hero: logo, title, code */}
                <div className="flex flex-col md:flex-row items-center bg-gradient-to-r from-teal-500 to-blue-600 p-6 text-white">
                  {inst.logoUrl ? (
                    <div className="w-32 h-32 relative flex-shrink-0">
                      <Image
                        src={inst.logoUrl}
                        alt={inst.title + " logo"}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-full text-gray-500">
                      No Logo
                    </div>
                  )}
                  <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left">
                    <h2 className="text-3xl font-bold">{inst.title}</h2>
                    <p className="mt-1 uppercase tracking-wide text-sm">
                      {inst.code}
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Description & Address */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">সম্পর্কে</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        {inst.description || "No description available."}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">অবস্থান</h3>
                      <p className="flex items-center text-gray-700 dark:text-gray-300">
                        <FiMapPin className="mr-2" /> {inst.address}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-1  sm:grid-cols-3 gap-6">
                    <div className="flex items-center place-content-center text-gray-700 dark:text-gray-300">
                      <FiUsers size={24} className="mr-3 text-teal-500" />
                      <div>
                        <p className="font-semibold">{inst.studentCount}</p>
                        <p className="text-sm">শিক্ষার্থী</p>
                      </div>
                    </div>
                    <div className="flex items-center place-content-center text-gray-700 dark:text-gray-300">
                      <FiBookOpen size={24} className="mr-3 text-blue-500" />
                      <div>
                        <p className="font-semibold">
                          {inst.departments.length}
                        </p>
                        <p className="text-sm">বিভাগ</p>
                      </div>
                    </div>
                    <div className="flex items-center place-content-center text-gray-700 dark:text-gray-300">
                      <FaGraduationCap
                        size={24}
                        className="mr-3 text-orange-500"
                      />
                      <div>
                        <p className="font-semibold">
                          {inst.establishedAt
                            ? new Date(inst.establishedAt).getFullYear()
                            : "N/A"}
                        </p>
                        <p className="text-sm">স্থাপিত</p>
                      </div>
                    </div>
                  </div>

                  {/* Departments list */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">বিভাগসমূহ</h3>
                      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                        {inst.departments.length > 0 ? (
                          inst.departments.map((d, i) => (
                            <li key={i}>{d.name}</li>
                          ))
                        ) : (
                          <li>কোন বিভাগ যুক্ত করা হয়নি</li>
                        )}
                      </ul>
                      {/* Contact */}
                      <div className="space-y-3 mt-5">
                        <h3 className="text-xl font-semibold">যোগাযোগ</h3>
                        <p className="flex items-center text-gray-700 dark:text-gray-300">
                          <FiMail className="mr-2" /> {inst.email}
                        </p>
                        <button
                          onClick={() => {
                            if (!user.isSignedIn)
                              return showModal(
                                "প্রতিষ্ঠানকে মেসেজ করার জন্য দয়া করে লগিন করুন!",
                                "error"
                              );
                            setEmailModal(true);
                          }}
                          className="inline-flex items-center px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded"
                        >
                          <FiMail className="mr-2" /> প্রতিষ্ঠানকে মেইল পাঠান
                        </button>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">ভর্তি</h3>
                      <h3 className="text-lg font-medium m-3">
                        ভর্তি শুরুর তারিখঃ{" "}
                        <span className="font-semibold">
                          {format(
                            new Date(inst.admissionPeriod.openDate),
                            "dd/MMM/yyyy"
                          )}
                        </span>
                      </h3>
                      <h3 className="text-lg font-medium m-3">
                        ভর্তি শেষের তারিখ:{" "}
                        <span className="font-semibold">
                          {format(
                            new Date(inst.admissionPeriod.closeDate),
                            "dd/MMM/yyyy"
                          )}
                        </span>
                      </h3>

                      {/* Contact & Admission */}

                      {/* Admission notify */}
                      <div className="space-y-3">
                        {inst.admissionStatus ? (
                          // OPEN: show your apply button/link
                          <>
                            <p className="text-gray-700 dark:text-gray-300">
                              এখন ভর্তি চলছে! ভর্তি প্রক্রিয়ার জন্য নিচে ক্লিক
                              করুন!
                            </p>
                            <button
                              onClick={() =>
                                (window.location.href =
                                  inst.applyLink || "/apply")
                              }
                              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                            >
                              <FiBell className="mr-1" /> এখনি আবেদন করুন
                            </button>
                          </>
                        ) : (
                          // CLOSED: allow notification signup
                          <>
                            <p className="text-gray-700 dark:text-gray-300">
                              নোটঃ এখন ভর্তি কার্যক্রম বন্ধ। আপনার ইমেইল ঠিকানা
                              নিচে দিয়ে রাখুন। ভর্তি কার্যক্রম চালু হলে আপনাকে
                              জানানো হবে।
                            </p>
                            {inst.interestedEmails?.some(
                              (e) =>
                                e ===
                                user?.user?.emailAddresses?.[0]?.emailAddress
                            ) ? (
                              <div>
                                <span className="px-4 py-2 bg-green-100 text-green-800 rounded">
                                  আপনাকে জানানো হবে
                                </span>
                              </div>
                            ) : (
                              <div className="flex space-x-2">
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
                                    className="flex-1 p-2 border rounded bg-white dark:bg-gray-900"
                                  />
                                )}
                                <button
                                  onClick={() => handleNotify(inst._id)}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded inline-flex items-center"
                                >
                                  <FiBell className="mr-1" /> আমাকে জানানো হোক
                                </button>
                              </div>
                            )}
                            {notifyStatus[inst._id] && (
                              <p className="text-sm text-teal-600">
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
                    defaultHeader={`This is from ${user.user.fullName} from the At-taleem`}
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
