"use client";

import { Navbar, Button, Dropdown, DarkThemeToggle, useThemeMode } from "flowbite-react";
import Image from "next/image";

export default function Header() {
  const { mode, toggleMode } = useThemeMode();

  return (
    <Navbar fluid rounded className="anek-bangla-font">
      <Navbar.Brand href="/">
        <Image alt="Logo" src="/favicon.svg" width={36} height={36} />
        <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
          At-Taleem
        </span>
      </Navbar.Brand>
      <div className="order-2 hidden items-center md:flex">
        <DarkThemeToggle onClick={toggleMode} />
        <a
          href="#"
          className="mr-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700"
        >
          লগ ইন করুন
        </a>
        <Button href="#">সাইন আপ করুন</Button>
      </div>
      <Navbar.Toggle />
      <Navbar.Collapse>
        <Navbar.Link href="#" active>
          অবতরনিকা
        </Navbar.Link>
        <Dropdown label="প্রতিষ্ঠানসমূহ" inline>
          <Dropdown.Item href="#">About Us</Dropdown.Item>
          <Dropdown.Item href="#">Library</Dropdown.Item>
          <Dropdown.Item href="#">Resources</Dropdown.Item>
          <Dropdown.Item href="#">Pro Version</Dropdown.Item>
          <Dropdown.Item href="#">Contact Us</Dropdown.Item>
          <Dropdown.Item href="#">Support Center</Dropdown.Item>
          <Dropdown.Item href="#">Terms</Dropdown.Item>
          <Dropdown.Item href="#">Blog</Dropdown.Item>
        </Dropdown>
        <Navbar.Link href="#">তালিমের ভিডিও</Navbar.Link>
        <Navbar.Link href="#">জুমার ভিডিও</Navbar.Link>
        <Navbar.Link href="#">প্রশ্নোত্তরসমূহ</Navbar.Link>
        <Navbar.Link href="#">প্রকাশিত বইসমূহ</Navbar.Link>
      </Navbar.Collapse>
    </Navbar>
  );
}
