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
} from "@clerk/nextjs";
import { dark, light } from "@clerk/themes";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
export default function Header() {
  const path = usePathname();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

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
    <Navbar fluid rounded className="anek-bangla-font">
      <Navbar.Brand href="/">
        <Image
          alt="Logo"
          src="/favicon.png"
          width={36}
          height={36}
          className=" rounded-full mx-2"
        />
        <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
          At-Taleem
        </span>
      </Navbar.Brand>
      <form onSubmit={handleSubmit}>
        <TextInput
          type="text"
          placeholder="Search..."
          rightIcon={AiOutlineSearch}
          className="hidden lg:inline"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>
      <Button className="w-12 h-10 lg:hidden" color="gray" pill>
        <AiOutlineSearch />
      </Button>
      <div className="order-2 hidden items-center md:flex">
        <DarkThemeToggle onClick={toggleMode} />
        <SignedIn>
          <UserButton appearance={{ baseTheme: dark }} />
        </SignedIn>
        <SignedOut>
          <div className="mr-2 rounded-lg px-2 py-2 text-sm font-medium bg-blue-400 dark:bg-black text-gray-800 hover:bg-blue-800 hover:text-white dark:text-white dark:hover:bg-gray-700">
            <SignInButton />
          </div>
          <div className="mr-2 rounded-lg px-2 py-2 text-sm font-medium bg-blue-400 dark:bg-black text-gray-800 hover:bg-blue-800 hover:text-white dark:text-white dark:hover:bg-gray-700">
            <SignUpButton />
          </div>
        </SignedOut>
      </div>
      <Navbar.Toggle />
      <Navbar.Collapse>
        <Navbar.Link href="/" active>
          অবতরনিকা
        </Navbar.Link>

        <Navbar.Link href="#">তালিমের ভিডিও</Navbar.Link>
        <Navbar.Link href="#">জুমার ভিডিও</Navbar.Link>
        <Navbar.Link href="#">প্রশ্নোত্তরসমূহ</Navbar.Link>
        <Navbar.Link href="#">প্রকাশিত বইসমূহ</Navbar.Link>
      </Navbar.Collapse>
    </Navbar>
  );
}
