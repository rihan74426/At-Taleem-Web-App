"use client";

import { Table, Button, Badge, Dropdown, TextInput } from "flowbite-react";
import { useEffect, useState } from "react";
import { FaCheck, FaTimes, FaSearch, FaFilter, FaSort } from "react-icons/fa";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import Loader from "./Loader";
import { SendEmailModal } from "./orderModals";
import SendEmail from "./sendEmail";

export default function DashUsers() {
  const { user, isLoaded } = useUser();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, inactive
  const [filterRole, setFilterRole] = useState("all"); // all, admin, user

  // Filter and sort users
  useEffect(() => {
    let result = [...users];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (user) =>
          user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.emailAddresses[0]?.emailAddress
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      const now = Date.now();
      result = result.filter((user) => {
        const lastSeen = new Date(user.lastActiveAt).getTime();
        return filterStatus === "active"
          ? now - lastSeen < 60 * 60 * 1000
          : now - lastSeen >= 60 * 60 * 1000;
      });
    }

    // Apply role filter
    if (filterRole !== "all") {
      result = result.filter((user) =>
        filterRole === "admin"
          ? user.publicMetadata?.isAdmin
          : !user.publicMetadata?.isAdmin
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === "createdAt") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

    setFilteredUsers(result);
  }, [users, searchTerm, sortField, sortDirection, filterStatus, filterRole]);

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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
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
          <div className="flex justify-between items-center mb-4">
            <h1 className="font-bold text-3xl">Users Management</h1>
            <div className="flex gap-2">
              <TextInput
                icon={FaSearch}
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Dropdown label="Filter" icon={FaFilter}>
                <Dropdown.Item onClick={() => setFilterStatus("all")}>
                  All Status
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterStatus("active")}>
                  Active
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterStatus("inactive")}>
                  Inactive
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => setFilterRole("all")}>
                  All Roles
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterRole("admin")}>
                  Admins
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterRole("user")}>
                  Users
                </Dropdown.Item>
              </Dropdown>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="fixed top-20 right-4 shadow p-3 z-50">
              <Button
                onClick={emailAll}
                disabled={selectedIds.size === 0}
                gradientDuoTone="purpleToPink"
              >
                Email Selected ({selectedIds.size})
              </Button>
            </div>
          )}

          <Table hoverable className="shadow-md w-full table-auto">
            <Table.Head className="bg-gray-100 text-gray-600 text-sm uppercase leading-normal text-center">
              {selectedIds.size > 0 && (
                <Table.HeadCell>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                  />
                </Table.HeadCell>
              )}
              <Table.HeadCell
                className="cursor-pointer"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center justify-center gap-2">
                  Date Created
                  <FaSort
                    className={sortField === "createdAt" ? "text-blue-500" : ""}
                  />
                </div>
              </Table.HeadCell>
              <Table.HeadCell>User Image</Table.HeadCell>
              <Table.HeadCell
                className="cursor-pointer"
                onClick={() => handleSort("firstName")}
              >
                <div className="flex items-center justify-center gap-2">
                  Username
                  <FaSort
                    className={sortField === "firstName" ? "text-blue-500" : ""}
                  />
                </div>
              </Table.HeadCell>
              <Table.HeadCell>Email</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
              <Table.HeadCell>Role</Table.HeadCell>
              <Table.HeadCell>Actions</Table.HeadCell>
            </Table.Head>

            <Table.Body className="divide-y text-center">
              {filteredUsers.map((user) => {
                const lastSeen = user.lastActiveAt;
                const isActive =
                  Date.now() - new Date(lastSeen).getTime() < 60 * 60 * 1000;
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
                    <Table.Cell onClick={() => toggleSelect(user.id)}>
                      {format(new Date(parseInt(user.createdAt, 10)), "PP p")}
                    </Table.Cell>
                    <Table.Cell className="justify-items-center">
                      <div className="relative w-10 h-10">
                        <img
                          src={user.imageUrl}
                          alt={`${user.firstName ?? ""} ${user.lastName ?? ""}`}
                          className="w-10 h-10 object-cover bg-gray-500 rounded-full"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            isActive ? "bg-green-400" : "bg-gray-400"
                          }`}
                        />
                      </div>
                    </Table.Cell>
                    <Table.Cell onClick={() => toggleSelect(user.id)}>
                      {`${user.firstName ?? ""} ${
                        user.lastName ?? ""
                      }`.trim() || "—"}
                    </Table.Cell>
                    <Table.Cell onClick={() => toggleSelect(user.id)}>
                      {email || "—"}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={isActive ? "success" : "gray"}>
                        {isActive ? "Active" : "Inactive"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        color={user.publicMetadata?.isAdmin ? "purple" : "blue"}
                      >
                        {user.publicMetadata?.isAdmin ? "Admin" : "User"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex gap-2 justify-center">
                        {user.publicMetadata?.isAdmin ? (
                          <Button
                            size="xs"
                            color="failure"
                            onClick={() => dismissAdmin(user.id)}
                          >
                            Dismiss Admin
                          </Button>
                        ) : (
                          <Button
                            size="xs"
                            color="success"
                            onClick={() => makeAdmin(user.id)}
                          >
                            Make Admin
                          </Button>
                        )}
                        <Button
                          size="xs"
                          color="info"
                          onClick={() => {
                            setShowEmailModal(true);
                            setRecipientEmail(email);
                          }}
                          disabled={!email}
                        >
                          Email
                        </Button>
                      </div>
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
