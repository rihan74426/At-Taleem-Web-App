"use client";
import {
  Button,
  DarkThemeToggle,
  Navbar,
  TextInput,
  useThemeMode,
} from "flowbite-react";
import Link from "next/link";
import { AiOutlineSearch } from "react-icons/ai";
import { FaMoon, FaSun } from "react-icons/fa";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { dark, light } from "@clerk/themes";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import AnimatedDropdown from "./AnimatedDropdown";
export default function Header() {
  const path = usePathname();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { user, isSignedIn } = useUser();
  const collapseRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (collapseRef.current && !collapseRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);
  const { toggleMode } = useThemeMode();

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search); // Use window.location.search
    urlParams.set("searchTerm", searchTerm);
    router.push(`/search?${urlParams.toString()}`);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(searchParams);
    const searchTermFromUrl = urlParams.get("searchTerm");
    if (searchTermFromUrl) {
      setSearchTerm(searchTermFromUrl);
    }
  }, [searchParams]);
  return (
    <Navbar
      fluid
      rounded
      className="anek-bangla-font text-center bg-blue-300 dark:bg-gray-800"
    >
      <Navbar.Brand href="/">
        <Image
          alt="Logo"
          src="/favicon.png"
          width={36}
          height={36}
          className="rounded-full mx-2 object-contain"
        />

        <span className="self-center mirzaFont hidden sm:inline whitespace-nowrap text-xl font-semibold dark:text-white">
          At-Taleem
        </span>
      </Navbar.Brand>
      <form onSubmit={handleSubmit}>
        <TextInput
          type="text"
          placeholder="Search..."
          rightIcon={AiOutlineSearch}
          className="w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>

      <div className="lg:order-2 hidden sm:flex items-center">
        <DarkThemeToggle onClick={toggleMode} className="m-2" color="red" />
        <SignedIn>
          <UserButton appearance={{ baseTheme: dark }} />
        </SignedIn>
        <SignedOut>
          <div className="mr-2 rounded-lg px-2 py-2 text-sm font-medium bg-blue-400 dark:bg-black text-gray-800 hover:bg-blue-800 hover:text-white dark:text-white dark:hover:bg-gray-700">
            <SignInButton mode="modal" />
          </div>
          <div className="mr-2 rounded-lg px-2 py-2 text-sm font-medium bg-blue-400 dark:bg-black text-gray-800 hover:bg-blue-800 hover:text-white dark:text-white dark:hover:bg-gray-700">
            <SignUpButton mode="modal" />
          </div>
        </SignedOut>
      </div>
      <Navbar.Toggle />
      <Navbar.Collapse>
        <div
          onClick={toggleMode}
          className="flex py-2 sm:hidden place-content-center items-center pl-3 pr-4 md:p-0 border-b hover:cursor-pointer border-gray-100 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:border-0 md:hover:bg-transparent md:hover:text-cyan-700 md:dark:hover:bg-transparent md:dark:hover:text-white"
        >
          <DarkThemeToggle className="m-1" color="red" />
          <p>Light/Dark Mode</p>
        </div>
        <Link href="/">
          <Navbar.Link active={path === "/"} as={"div"}>
            অবতরনিকা
          </Navbar.Link>
        </Link>
        <AnimatedDropdown
          title="ভিডিও  "
          id="videos"
          items={[
            { label: "তালিমের ভিডিও", href: "/taleem-videos" },
            { label: "জুমার ভিডিও", href: "/juma-videos" },
          ]}
        />
        <Link href="/questionnaires" passHref>
          <Navbar.Link active={path === "/questionnaires"} as={"div"}>
            প্রশ্নোত্তরসমূহ
          </Navbar.Link>
        </Link>
        <AnimatedDropdown
          title="আমাদের  "
          id="about"
          items={[
            { label: "প্রকাশিত বইসমূহ", href: "/published-books" },
            { label: "কর্মসূচী", href: "/programme" },
            { label: "সম্পর্কে", href: "/about-us" },
          ]}
        />
        {isSignedIn && (
          <Link href="/dashboard" passHref>
            <Navbar.Link active={path === "/dashboard"} as={"div"}>
              ড্যাশবোর্ড
            </Navbar.Link>
          </Link>
        )}
        <div className="inline w-full sm:hidden place-content-center self-center items-center">
          <SignedIn
            children={
              <div className="m-1 rounded-lg px-2 py-2 text-sm font-medium bg-blue-400 dark:bg-gray-900 text-gray-800 hover:bg-blue-800 hover:text-white dark:text-white dark:hover:bg-gray-700">
                <UserButton appearance={{ baseTheme: dark }} />
              </div>
            }
          />

          <SignedOut>
            <SignInButton
              children={
                <div className="m-1 rounded-lg px-2 py-2 text-sm font-medium border bg-blue-400 dark:bg-black text-gray-800 hover:bg-blue-800 hover:text-white dark:text-white dark:hover:bg-gray-700">
                  Log In
                </div>
              }
              mode="modal"
            />

            <SignUpButton
              children={
                <div className="m-1 rounded-lg px-2 py-2 text-sm font-medium border bg-blue-400 dark:bg-black text-gray-800 hover:bg-blue-800 hover:text-white dark:text-white dark:hover:bg-gray-700">
                  Sign Up
                </div>
              }
              mode="modal"
            />
          </SignedOut>
        </div>
      </Navbar.Collapse>
    </Navbar>
  );
}
