"use client";

import { UserProfile, useUser } from "@clerk/nextjs";
import { dark, light } from "@clerk/themes";
import { useTheme } from "next-themes";
import { Card, Button, Tabs } from "flowbite-react";
import { HiUser, HiCog, HiBell, HiShieldCheck } from "react-icons/hi";
import { useState } from "react";

export default function DashProfile() {
  const { theme } = useTheme();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      title: "Profile",
      icon: HiUser,
      content: (
        <div className="flex justify-center items-center w-full">
          <UserProfile
            appearance={{
              baseTheme: theme === "dark" && dark,
            }}
            routing="hash"
          />
        </div>
      ),
    },
    {
      title: "Settings",
      icon: HiCog,
      content: (
        <Card className="max-w-2xl mx-auto">
          <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            Account Settings
          </h5>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h6 className="text-lg font-semibold">Email Notifications</h6>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive email updates about your account
                </p>
              </div>
              <Button size="sm" color="gray">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h6 className="text-lg font-semibold">
                  Two-Factor Authentication
                </h6>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button size="sm" color="gray">
                Enable
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h6 className="text-lg font-semibold">Privacy Settings</h6>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage your privacy preferences
                </p>
              </div>
              <Button size="sm" color="gray">
                Manage
              </Button>
            </div>
          </div>
        </Card>
      ),
    },
    {
      title: "Notifications",
      icon: HiBell,
      content: (
        <Card className="max-w-2xl mx-auto">
          <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            Notification Preferences
          </h5>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h6 className="text-lg font-semibold">Push Notifications</h6>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive notifications in your browser
                </p>
              </div>
              <Button size="sm" color="gray">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h6 className="text-lg font-semibold">Email Digest</h6>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get a daily summary of your activity
                </p>
              </div>
              <Button size="sm" color="gray">
                Enable
              </Button>
            </div>
          </div>
        </Card>
      ),
    },
    {
      title: "Security",
      icon: HiShieldCheck,
      content: (
        <Card className="max-w-2xl mx-auto">
          <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            Security Settings
          </h5>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h6 className="text-lg font-semibold">Password</h6>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Change your password
                </p>
              </div>
              <Button size="sm" color="gray">
                Change
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h6 className="text-lg font-semibold">Active Sessions</h6>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage your active sessions
                </p>
              </div>
              <Button size="sm" color="gray">
                View
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h6 className="text-lg font-semibold">Login History</h6>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  View your login history
                </p>
              </div>
              <Button size="sm" color="gray">
                View
              </Button>
            </div>
          </div>
        </Card>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Profile Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs aria-label="Profile tabs" onActiveTabChange={setActiveTab}>
          {tabs.map((tab, index) => (
            <Tabs.Item
              key={index}
              active={activeTab === index}
              icon={tab.icon}
              title={tab.title}
            >
              {tab.content}
            </Tabs.Item>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
