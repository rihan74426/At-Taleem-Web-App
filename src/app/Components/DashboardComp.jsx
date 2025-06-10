"use client";

import {
  HiArrowNarrowUp,
  HiOutlineUserGroup,
  HiBookOpen,
  HiVideoCamera,
  HiCalendar,
  HiAcademicCap,
  HiQuestionMarkCircle,
  HiChatAlt2,
  HiStar,
} from "react-icons/hi";
import { Button, Table } from "flowbite-react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Loader from "./Loader";
import { ErrorBoundary } from "./ErrorBoundary";
import { useDashboardData } from "../hooks/useDashboardData";

// Loading skeleton component
const TableSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"
      ></div>
    ))}
  </div>
);

// Stat Card Component
const StatCard = ({
  title,
  value,
  lastMonthValue,
  icon: Icon,
  iconBgColor,
}) => (
  <div className="flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md">
    <div className="flex justify-between">
      <div>
        <h3 className="text-gray-500 text-md uppercase">{title}</h3>
        <p className="text-2xl">{value}</p>
      </div>
      <Icon
        className={`${iconBgColor} text-white rounded-full text-5xl p-3 shadow-lg`}
      />
    </div>
    <div className="flex gap-2 text-sm">
      <span className="text-green-500 flex items-center">
        <HiArrowNarrowUp />
        {lastMonthValue}
      </span>
      <div className="text-gray-500">গত মাসে</div>
    </div>
  </div>
);

// Recent Data Table Component
const RecentDataTable = ({ title, data, columns, linkTo, loading }) => (
  <div className="flex flex-col w-full md:w-auto shadow-md p-2 rounded-md dark:bg-gray-800">
    <div className="flex justify-between p-3 text-sm font-semibold">
      <h1 className="text-center p-2">{title}</h1>
      <Button outline gradientDuoTone="purpleToPink">
        <Link href={linkTo}>সব দেখুন</Link>
      </Button>
    </div>
    {loading ? (
      <TableSkeleton />
    ) : (
      <Table hoverable>
        <Table.Head>
          {columns.map((column) => (
            <Table.HeadCell key={column.key}>{column.label}</Table.HeadCell>
          ))}
        </Table.Head>
        {data.slice(0, 5).map((item) => (
          <Table.Body key={item._id || item.id} className="divide-y">
            <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
              {columns.map((column) => (
                <Table.Cell key={column.key}>
                  {column.render ? column.render(item) : item[column.key]}
                </Table.Cell>
              ))}
            </Table.Row>
          </Table.Body>
        ))}
      </Table>
    )}
  </div>
);

export default function DashboardComp() {
  const { data, stats, loading, error } = useDashboardData();
  const { user } = useUser();

  if (error) {
    return (
      <div className="text-center p-4">
        <h2 className="text-red-600 text-xl font-semibold mb-2">
          ডাটা লোড করতে সমস্যা হয়েছে
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          দয়া করে পেজটি রিফ্রেশ করে আবার চেষ্টা করুন
        </p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-3 md:mx-auto">
        <div className="flex-wrap flex gap-4 justify-center">
          <StatCard
            title="মোট ব্যবহারকারী"
            value={stats.totalUsers}
            lastMonthValue={stats.lastMonthUsers}
            icon={HiOutlineUserGroup}
            iconBgColor="bg-teal-600"
          />
          <StatCard
            title="মোট ভিডিও"
            value={stats.totalVideos}
            lastMonthValue={stats.lastMonthVideos}
            icon={HiVideoCamera}
            iconBgColor="bg-blue-600"
          />
          <StatCard
            title="মোট বই"
            value={stats.totalBooks}
            lastMonthValue={stats.lastMonthBooks}
            icon={HiBookOpen}
            iconBgColor="bg-purple-600"
          />
          <StatCard
            title="মোট ইভেন্ট"
            value={stats.totalEvents}
            lastMonthValue={stats.lastMonthEvents}
            icon={HiCalendar}
            iconBgColor="bg-red-600"
          />
          <StatCard
            title="মোট প্রতিষ্ঠান"
            value={stats.totalInstitutions}
            lastMonthValue={stats.lastMonthInstitutions}
            icon={HiAcademicCap}
            iconBgColor="bg-yellow-600"
          />
          <StatCard
            title="মোট প্রশ্ন"
            value={stats.totalQuestions}
            lastMonthValue={stats.lastMonthQuestions}
            icon={HiQuestionMarkCircle}
            iconBgColor="bg-indigo-600"
          />
          <StatCard
            title="মোট মন্তব্য"
            value={stats.totalComments}
            lastMonthValue={stats.lastMonthComments}
            icon={HiChatAlt2}
            iconBgColor="bg-green-600"
          />
          <StatCard
            title="মোট রিভিউ"
            value={stats.totalReviews}
            lastMonthValue={stats.lastMonthReviews}
            icon={HiStar}
            iconBgColor="bg-orange-600"
          />
        </div>

        <div className="flex flex-wrap gap-4 py-3 mx-auto justify-center">
          <RecentDataTable
            title="সাম্প্রতিক ব্যবহারকারী"
            data={data.users}
            columns={[
              {
                key: "imageUrl",
                label: "ছবি",
                render: (user) => (
                  <img
                    src={user.imageUrl}
                    alt="user"
                    className="w-10 h-10 rounded-full bg-gray-500"
                  />
                ),
              },
              {
                key: "name",
                label: "নাম",
                render: (user) => `${user.firstName} ${user.lastName}`,
              },
            ]}
            linkTo="/dashboard?tab=users"
            loading={loading}
          />

          <RecentDataTable
            title="সাম্প্রতিক ভিডিও"
            data={data.videos}
            columns={[
              { key: "title", label: "শিরোনাম" },
              { key: "category", label: "ক্যাটাগরি" },
            ]}
            linkTo="/taleem-videos"
            loading={loading}
          />

          <RecentDataTable
            title="সাম্প্রতিক প্রশ্ন"
            data={data.questions}
            columns={[
              { key: "title", label: "প্রশ্ন" },
              { key: "status", label: "স্ট্যাটাস" },
            ]}
            linkTo="/questionnaires"
            loading={loading}
          />

          <RecentDataTable
            title="সাম্প্রতিক কমেন্ট"
            data={data.comments}
            columns={[
              { key: "content", label: "কমেন্ট" },
              {
                key: "createdAt",
                label: "তারিখ",
                render: (comment) =>
                  new Date(comment.createdAt).toLocaleDateString(),
              },
            ]}
            linkTo="/dashboard"
            loading={loading}
          />

          <RecentDataTable
            title="সাম্প্রতিক রিভিউ"
            data={data.reviews}
            columns={[
              {
                key: "userName",
                label: "নাম",
                render: (review) => `${review.userName}`,
              },
              {
                key: "reviewText",
                label: "রিভিউ",
                render: (review) => `${review.reviewText.substring(0, 50)}...`,
              },
            ]}
            linkTo="/dashboard?tab=reviews"
            loading={loading}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
