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
import { dark } from "@clerk/themes";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import AnimatedDropdown from "./AnimatedDropdown";
import SearchSuggestions from "./SearchSuggestions";

// Memoized navigation items to prevent unnecessary re-renders
const NAV_ITEMS = {
  videos: [
    { label: "তালিমের ভিডিও", href: "/taleem-videos" },
    { label: "জুমার ভিডিও", href: "/juma-videos" },
  ],
  about: [
    { label: "প্রকাশিত বইসমূহ", href: "/published-books" },
    { label: "প্রতিষ্ঠানসমূহ", href: "/institutions" },
    { label: "আমাদের সম্পর্কে", href: "/about-us" },
    { label: "গুরুত্বপূর্ণ মাসায়েল", href: "/masalah" },
  ],
};

export default function Header() {
  const path = usePathname();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { user, isSignedIn } = useUser();
  const collapseRef = useRef(null);

  // Memoize click outside handler
  const handleClickOutside = useCallback((event) => {
    if (collapseRef.current && !collapseRef.current.contains(event.target)) {
      setIsOpen(false);
    }
    if (
      searchInputRef.current &&
      !searchInputRef.current.contains(event.target)
    ) {
      setShowSuggestions(false);
    }
  }, []);

  // Setup click outside listener
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  // Handle theme mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  const { toggleMode } = useThemeMode();

  // Search functionality
  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    (query) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(query);
      }, 300);
    },
    [handleSearch]
  );

  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchTerm(value);
      debouncedSearch(value);
      setShowSuggestions(true);
    },
    [debouncedSearch]
  );

  const handleInputFocus = useCallback(() => {
    setShowSuggestions(true);
  }, []);

  const handleSearchSelect = useCallback((result) => {
    setSearchTerm("");
    setSearchResults([]);
    setShowSuggestions(false);
  }, []);

  const handleSearchClose = useCallback(() => {
    setShowSuggestions(false);
  }, []);

  // Memoize search handler
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleSearchSelect(searchResults[0]);
      }
    },
    [searchResults, handleSearchSelect]
  );

  // Update search term from URL
  useEffect(() => {
    const searchTermFromUrl = searchParams.get("searchTerm");
    if (searchTermFromUrl) {
      setSearchTerm(searchTermFromUrl);
    }
  }, [searchParams]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [path]);

  // Memoize theme toggle handler
  const handleThemeToggle = useCallback(() => {
    toggleMode();
  }, [toggleMode]);

  // Memoize mobile menu toggle
  const handleMobileMenuToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Memoize auth buttons
  const AuthButtons = useMemo(
    () => (
      <>
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
      </>
    ),
    []
  );

  // Memoize mobile auth buttons
  const MobileAuthButtons = useMemo(
    () => (
      <div className="inline w-full sm:hidden place-content-center self-center items-center">
        <SignedIn>
          <div className="m-1 rounded-lg px-2 py-2 text-sm font-medium bg-blue-400 dark:bg-gray-900 text-gray-800 hover:bg-blue-800 hover:text-white dark:text-white dark:hover:bg-gray-700">
            <UserButton appearance={{ baseTheme: dark }} />
          </div>
        </SignedIn>
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
    ),
    []
  );

  if (!mounted) return null;

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
          priority
        />
        <span className="self-center mirzaFont hidden sm:inline whitespace-nowrap text-xl font-semibold dark:text-white">
          At-Taleem
        </span>
      </Navbar.Brand>

      <div className="flex-1 max-w-md mx-4 relative" ref={searchInputRef}>
        <form onSubmit={handleSubmit}>
          <TextInput
            type="text"
            placeholder="সার্চ করুন..."
            rightIcon={AiOutlineSearch}
            className="w-full"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={handleInputFocus}
          />
        </form>
        <SearchSuggestions
          results={searchResults}
          isOpen={showSuggestions}
          onClose={handleSearchClose}
          onSelect={handleSearchSelect}
          searchTerm={searchTerm}
          isSearching={isSearching}
        />
      </div>

      <div className="lg:order-2 hidden sm:flex items-center">
        <DarkThemeToggle
          onClick={handleThemeToggle}
          className="m-2"
          color="red"
        />
        {AuthButtons}
      </div>

      <Navbar.Toggle
        onClick={handleMobileMenuToggle}
        onMouseEnter={() => setIsOpen(true)}
      />

      <Navbar.Collapse
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        ref={collapseRef}
        className={`${isOpen ? "block" : "hidden"} lg:flex`}
      >
        <div
          onClick={handleThemeToggle}
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

        <AnimatedDropdown title="ভিডিও" id="videos" items={NAV_ITEMS.videos} />

        <Link href="/questionnaires" passHref>
          <Navbar.Link active={path === "/questionnaires"} as={"div"}>
            প্রশ্নোত্তরসমূহ
          </Navbar.Link>
        </Link>

        <Link href="/programme" passHref>
          <Navbar.Link active={path === "/programme"} as={"div"}>
            কর্মসূচীসমূহ
          </Navbar.Link>
        </Link>

        <AnimatedDropdown title="আমাদের" id="about" items={NAV_ITEMS.about} />

        {isSignedIn && (
          <Link href="/dashboard" passHref>
            <Navbar.Link active={path === "/dashboard"} as={"div"}>
              ড্যাশবোর্ড
            </Navbar.Link>
          </Link>
        )}

        {user?.publicMetadata.isAdmin && (
          <Link href="/admin/orders" passHref>
            <Navbar.Link active={path === "/orders"} as={"div"}>
              অর্ডারসমূহ
            </Navbar.Link>
          </Link>
        )}

        {MobileAuthButtons}
      </Navbar.Collapse>
    </Navbar>
  );
}
