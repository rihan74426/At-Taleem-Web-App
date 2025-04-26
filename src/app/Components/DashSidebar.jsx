"use client";

import { Sidebar } from "flowbite-react";
import {
  HiUser,
  HiArrowSmRight,
  HiDocumentText,
  HiOutlineUserGroup,
  HiChartPie,
  HiBookOpen,
} from "react-icons/hi";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { AiOutlineVideoCamera } from "react-icons/ai";
import { BsQuestionOctagon } from "react-icons/bs";
export default function DashSidebar() {
  const [tab, setTab] = useState("");
  const searchParams = useSearchParams();
  const { user, isSignedIn } = useUser();
  useEffect(() => {
    const urlParams = new URLSearchParams(searchParams);
    const tabFromUrl = urlParams.get("tab");
    if (tabFromUrl) {
      setTab(tabFromUrl);
    }
  }, [searchParams]);

  if (!isSignedIn) {
    return null;
  }

  return (
    <Sidebar className="w-full md:w-56">
      <Sidebar.Items>
        <Sidebar.ItemGroup className="flex flex-col gap-1">
          {user?.publicMetadata?.isAdmin && (
            <Link href="/dashboard?tab=dash">
              <Sidebar.Item
                active={tab === "dash" || !tab}
                icon={HiChartPie}
                as="div"
              >
                Dashboard
              </Sidebar.Item>
            </Link>
          )}
          <Link href="/dashboard?tab=profile">
            <Sidebar.Item
              active={tab === "profile"}
              icon={HiUser}
              label={user?.publicMetadata?.isAdmin ? "Admin" : "User"}
              labelColor="dark"
              as="div"
            >
              Profile
            </Sidebar.Item>
          </Link>
          <Link href="/dashboard?tab=review">
            <Sidebar.Item
              active={tab === "review"}
              icon={HiUser}
              labelColor="dark"
              as="div"
            >
              My Review
            </Sidebar.Item>
          </Link>
          {user?.publicMetadata?.isAdmin && (
            <Link href="/dashboard?tab=posts">
              <Sidebar.Item
                active={tab === "posts"}
                icon={HiDocumentText}
                as="div"
              >
                Posts
              </Sidebar.Item>
            </Link>
          )}
          {user?.publicMetadata?.isAdmin && (
            <Link href="/dashboard?tab=users">
              <Sidebar.Item
                active={tab === "users"}
                icon={HiOutlineUserGroup}
                as="div"
              >
                Users
              </Sidebar.Item>
            </Link>
          )}
          {user?.publicMetadata?.isAdmin && (
            <Link href="/dashboard?tab=addVideo">
              <Sidebar.Item
                active={tab === "addVideo"}
                icon={HiOutlineUserGroup}
                as="div"
              >
                Add New Video
              </Sidebar.Item>
            </Link>
          )}
          {user?.publicMetadata?.isAdmin && (
            <Link href="/dashboard?tab=addBooks">
              <Sidebar.Item
                active={tab === "addBooks"}
                icon={HiBookOpen}
                as="div"
              >
                Add a Book
              </Sidebar.Item>
            </Link>
          )}
          <Link href="/dashboard?tab=askQuestion">
            <Sidebar.Item
              active={tab === "askQuestion"}
              icon={BsQuestionOctagon}
              labelColor="dark"
              as="div"
            >
              Ask a question
            </Sidebar.Item>
          </Link>
          <Sidebar.Item icon={HiArrowSmRight} className="cursor-pointer">
            <SignOutButton />
          </Sidebar.Item>
        </Sidebar.ItemGroup>
      </Sidebar.Items>
    </Sidebar>
  );
}
