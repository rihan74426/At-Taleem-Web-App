"use client";

import { Table } from "flowbite-react";
import { useEffect, useState } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import Loader from "./Loader";
import { SendEmailModal } from "./orderModals";
import SendEmail from "./sendEmail";
export default function DashUsers() {
  const { user, isLoaded } = useUser();
  const [users, setUsers] = useState([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
    if (newSet.size !== users.length) setSelectAll(false);
    else setSelectAll(true);
  };
  const selectedEmails = users
    .filter((u) => selectedIds.has(u.id))
    .map((u) => u.emailAddresses[0]?.emailAddress)
    .filter(Boolean);

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)));
    }
    setSelectAll(!selectAll);
  };

  const emailAll = () => {
    setRecipientEmail(selectedEmails);
    setShowEmailModal(true);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/user", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users.data);
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);
  const makeAdmin = async (id) => {
    try {
      const user = await fetch(`/api/user/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicMetadata: { isAdmin: true },
        }),
      });
      if (user.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.log("Error making user an admin:", error.message);
    }
  };
  const dismissAdmin = async (id) => {
    try {
      const user = await fetch(`/api/user/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicMetadata: { isAdmin: false },
        }),
      });
      if (user.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.log("Error making user an admin:", error.message);
    }
  };
  if (!user?.publicMetadata?.isAdmin && isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full py-7">
        <h1 className="text-2xl font-semibold">You are not an admin!</h1>
      </div>
    );
  }
  return (
    <div className="table-auto md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500">
      {users.length > 0 ? (
        <div className="overflow-x-auto">
          <h1 className=" font-bold text-3xl text-center p-6">
            Users Management
          </h1>
          {selectedIds.size > 0 && (
            <div className="fixed top-20 right-4 shadow p-3  z-50">
              <button
                onClick={emailAll}
                disabled={selectedIds.size === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
              >
                Email Selected ({selectedIds.size})
              </button>
            </div>
          )}
          <Table hoverable className="shadow-md w-full table-auto">
            <Table.Head className="bg-gray-100 text-gray-600 text-sm uppercase leading-normal text-center ">
              {selectedIds.size > 0 && (
                <Table.HeadCell>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                  />
                </Table.HeadCell>
              )}
              <Table.HeadCell>Date Created</Table.HeadCell>
              <Table.HeadCell>User Image</Table.HeadCell>
              <Table.HeadCell>Username</Table.HeadCell>
              <Table.HeadCell>Email</Table.HeadCell>
              <Table.HeadCell>Admin</Table.HeadCell>
              <Table.HeadCell>Actions</Table.HeadCell>
            </Table.Head>

            <Table.Body className="divide-y text-center">
              {users.map((user) => {
                // Consider a user "active" if they signed in within the last 5 minutes
                const lastSeen = user.lastActiveAt;
                const isActive =
                  Date.now() - new Date(lastSeen).getTime() < 60 * 60 * 1000; // 1 hour
                const email = user.emailAddresses[0]?.emailAddress || "";

                return (
                  <Table.Row
                    key={user.id}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800 cursor-pointer"
                  >
                    {selectedIds.size > 0 && (
                      <Table.Cell>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(user.id)}
                          onChange={() => toggleSelect(user.id)}
                        />
                      </Table.Cell>
                    )}
                    {/* Date created */}
                    <Table.Cell onClick={() => toggleSelect(user.id)}>
                      {format(new Date(parseInt(user.createdAt, 10)), "PP p")}
                    </Table.Cell>

                    {/* Profile image with active status indicator */}
                    <Table.Cell
                      className="justify-items-center"
                      onClick={() => toggleSelect(user.id)}
                    >
                      <div className="relative w-10 h-10">
                        <img
                          src={user.imageUrl}
                          alt={`${user.firstName ?? ""} ${user.lastName ?? ""}`}
                          className="w-10 h-10 object-cover bg-gray-500 rounded-full"
                        />
                        <span
                          className={
                            `absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ` +
                            (isActive ? "bg-green-400" : "bg-gray-400")
                          }
                        />
                      </div>
                    </Table.Cell>

                    {/* Username (first & last name) */}
                    <Table.Cell onClick={() => toggleSelect(user.id)}>
                      {`${user.firstName ?? ""} ${
                        user.lastName ?? ""
                      }`.trim() || "—"}
                    </Table.Cell>

                    {/* Primary email */}
                    <Table.Cell onClick={() => toggleSelect(user.id)}>
                      {email || "—"}
                    </Table.Cell>

                    {/* Admin status */}
                    <Table.Cell className="justify-items-center p-1">
                      {user.publicMetadata?.isAdmin ? (
                        <>
                          <FaCheck className="text-green-500 m-1" />
                          <button
                            onClick={() => dismissAdmin(user.id)}
                            className="p-1 bg-blue-500 text-white rounded"
                          >
                            Dismiss Admin
                          </button>
                        </>
                      ) : (
                        <>
                          <FaTimes className="text-red-500 m-1" />
                          <button
                            onClick={() => makeAdmin(user.id)}
                            className="p-1 bg-green-500 text-white rounded"
                          >
                            Make Admin
                          </button>
                        </>
                      )}
                    </Table.Cell>

                    {/* Email button */}
                    <Table.Cell>
                      <button
                        onClick={() => {
                          setShowEmailModal(true);
                          setRecipientEmail(email);
                        }}
                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        disabled={!email}
                      >
                        Email
                      </button>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        </div>
      ) : (
        <div className="flex items-center place-content-center min-h-screen">
          <Loader />
        </div>
      )}
      {showEmailModal && (
        <SendEmail
          recipientEmail={recipientEmail}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </div>
  );
}
