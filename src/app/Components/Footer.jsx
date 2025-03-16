"use client";

import { Footer } from "flowbite-react";
import Image from "next/image";
import Link from "next/link";
import {
  BsFacebook,
  BsInstagram,
  BsTwitter,
  BsGithub,
  BsDribbble,
  BsYoutube,
} from "react-icons/bs";
export default function FooterCom() {
  return (
    <Footer container className="border border-t-8 bg-blue-300 border-teal-500">
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid w-full justify-between sm:flex md:grid-cols-1">
          <div className="mt-5">
            <Image
              alt="Logo"
              src="/favicon.png"
              width={72}
              height={72}
              className="rounded-full mx-2 object-contain"
            />
          </div>
          <div className="grid grid-cols-2 gap-8 mt-4 sm:grid-cols-3 sm:gap-6">
            <div>
              <Footer.Title title="About" />
              <Footer.LinkGroup col>
                <Footer.Link href="/" target="_blank" rel="noopener noreferrer">
                  A link
                </Footer.Link>
                <Footer.Link
                  href="/about"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  At-Taleem
                </Footer.Link>
              </Footer.LinkGroup>
            </div>
            <div>
              <Footer.Title title="Follow us" />
              <Footer.LinkGroup col>
                <Footer.Link
                  href="https://www.facebook.com/profile.php?id=100064076645371"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Facebook
                </Footer.Link>
                <Footer.Link href="https://www.youtube.com/@%E0%A6%A4%E0%A6%BE%E0%A6%B2%E0%A6%BF%E0%A6%AE%E0%A6%AC%E0%A6%B9%E0%A6%A6%E0%A7%8D%E0%A6%A6%E0%A6%BE%E0%A6%B0%E0%A6%B9%E0%A6%BE%E0%A6%9F%E0%A6%9A%E0%A6%9F%E0%A7%8D%E0%A6%9F%E0%A6%97%E0%A7%8D%E0%A6%B0%E0%A6%BE%E0%A6%AE">
                  YouTube
                </Footer.Link>
              </Footer.LinkGroup>
            </div>
            <div>
              <Footer.Title title="Legal" />
              <Footer.LinkGroup col>
                <Footer.Link href="#">Privacy Policy</Footer.Link>
                <Footer.Link href="#">Terms &amp; Conditions</Footer.Link>
              </Footer.LinkGroup>
            </div>
          </div>
        </div>
        <Footer.Divider />
        <div className="w-full sm:flex sm:items-center sm:justify-between">
          <Footer.Copyright
            href="#"
            by="At-Taleem"
            year={new Date().getFullYear()}
          />
          <div className="flex gap-6 sm:mt-0 mt-4 sm:justify-center">
            <Footer.Icon
              href="https://www.facebook.com/profile.php?id=100064076645371"
              icon={BsFacebook}
            />
            <Footer.Icon
              href="https://www.youtube.com/@%E0%A6%A4%E0%A6%BE%E0%A6%B2%E0%A6%BF%E0%A6%AE%E0%A6%AC%E0%A6%B9%E0%A6%A6%E0%A7%8D%E0%A6%A6%E0%A6%BE%E0%A6%B0%E0%A6%B9%E0%A6%BE%E0%A6%9F%E0%A6%9A%E0%A6%9F%E0%A7%8D%E0%A6%9F%E0%A6%97%E0%A7%8D%E0%A6%B0%E0%A6%BE%E0%A6%AE"
              icon={BsYoutube}
            />
          </div>
        </div>
      </div>
    </Footer>
  );
}
