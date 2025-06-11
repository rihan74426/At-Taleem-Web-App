"use client";

import { Table, Button, Badge, Dropdown, TextInput } from "flowbite-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { FaSearch, FaFilter, FaSort } from "react-icons/fa";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import Loader from "./Loader";
import SendEmail from "./sendEmail";
import ResponseModal from "./ResponseModal";

// Constants
const ACTIVE_THRESHOLD = 60 * 60 * 1000; // 1 hour in milliseconds
const SKELETON_ROWS = 5;

// Skeleton loader component
const TableSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded mb-4"></div>
    {[...Array(SKELETON_ROWS)].map((_, index) => (
      <div key={index} className="flex items-center space-x-4 mb-4">
        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

// User row component
const UserRow = ({
  user,
  isActive,
  email,
  selectedIds,
  onToggleSelect,
  onMakeAdmin,
  onDismissAdmin,
  onEmailClick,
  canManageAdmins,
}) => (
  <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800 cursor-pointer">
    {selectedIds.size > 0 && (
      <Table.Cell>
        <input
          type="checkbox"
          checked={selectedIds.has(user.id)}
          onChange={() => onToggleSelect(user.id)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
      </Table.Cell>
    )}
    <Table.Cell onClick={() => onToggleSelect(user.id)}>
      {format(new Date(parseInt(user.createdAt, 10)), "PP p")}
    </Table.Cell>
    <Table.Cell className="justify-items-center">
      <div className="relative w-10 h-10">
        <img
          src={user.imageUrl}
          alt={`${user.firstName ?? ""} ${user.lastName ?? ""}`}
          className="w-10 h-10 object-cover bg-gray-500 rounded-full"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/default-avatar.png";
          }}
        />
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            isActive ? "bg-green-400" : "bg-gray-400"
          }`}
        />
      </div>
    </Table.Cell>
    <Table.Cell onClick={() => onToggleSelect(user.id)}>
      {`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "—"}
    </Table.Cell>
    <Table.Cell onClick={() => onToggleSelect(user.id)}>
      {email || "—"}
    </Table.Cell>
    <Table.Cell className="text-center">
      <Badge
        className="flex-wrap place-content-center"
        color={isActive ? "success" : "gray"}
      >
        {isActive ? "Active" : "Inactive"}
      </Badge>
    </Table.Cell>
    <Table.Cell>
      <Badge
        className="flex-wrap place-content-center"
        color={user.publicMetadata?.isAdmin ? "purple" : "blue"}
      >
        {!user.publicMetadata?.isAdmin
          ? "User"
          : user.publicMetadata.supreme
          ? "Supreme"
          : "Admin"}
      </Badge>
    </Table.Cell>
    <Table.Cell>
      <div className="flex gap-2 justify-center">
        {canManageAdmins &&
          (user.publicMetadata?.isAdmin ? (
            <Button
              size="xs"
              color="failure"
              onClick={(e) => {
                e.stopPropagation();
                onDismissAdmin(user.id);
              }}
            >
              Dismiss Admin
            </Button>
          ) : (
            <Button
              size="xs"
              color="success"
              onClick={(e) => {
                e.stopPropagation();
                onMakeAdmin(user.id);
              }}
            >
              Make Admin
            </Button>
          ))}
        <Button
          size="xs"
          color="info"
          onClick={(e) => {
            e.stopPropagation();
            onEmailClick(email);
          }}
          disabled={!email}
        >
          Email
        </Button>
      </div>
    </Table.Cell>
  </Table.Row>
);

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
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    status: "",
  });

  const showModal = useCallback(
    (message, status) => setModal({ isOpen: true, message, status }),
    []
  );

  // Memoized admin status check
  const canManageAdmins = useMemo(
    () => user?.publicMetadata?.supreme && user?.publicMetadata?.isAdmin,
    [user?.publicMetadata]
  );

  // Memoized filtered and sorted users
  const processedUsers = useMemo(() => {
    let result = [...users];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower) ||
          user.emailAddresses[0]?.emailAddress
            .toLowerCase()
            .includes(searchLower)
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      const now = Date.now();
      result = result.filter((user) => {
        const lastSeen = new Date(user.lastActiveAt).getTime();
        return filterStatus === "active"
          ? now - lastSeen < ACTIVE_THRESHOLD
          : now - lastSeen >= ACTIVE_THRESHOLD;
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

      return sortDirection === "asc"
        ? aValue > bValue
          ? 1
          : -1
        : aValue < bValue
        ? 1
        : -1;
    });

    return result;
  }, [users, searchTerm, sortField, sortDirection, filterStatus, filterRole]);

  // Memoized selected emails
  const selectedEmails = useMemo(
    () =>
      users
        .filter((u) => selectedIds.has(u.id))
        .map((u) => u.emailAddresses[0]?.emailAddress)
        .filter(Boolean),
    [users, selectedIds]
  );

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/user", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users.data);
      } else {
        showModal("Failed to fetch users", "error");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showModal("Failed to fetch users", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showModal]);

  const makeAdmin = useCallback(
    async (id) => {
      if (!canManageAdmins) {
        return showModal("Only Supremes Can Make Admins", "error");
      }

      try {
        const response = await fetch(`/api/user/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicMetadata: { isAdmin: true },
          }),
        });

        if (response.ok) {
          await fetchUsers();
          showModal("User has been made admin successfully", "success");
        } else {
          showModal("Failed to make user admin", "error");
        }
      } catch (error) {
        console.error("Error making user an admin:", error);
        showModal("Failed to make user admin", "error");
      }
    },
    [canManageAdmins, fetchUsers, showModal]
  );

  const dismissAdmin = useCallback(
    async (id) => {
      if (!canManageAdmins) {
        return showModal("Only Supremes Can Dismiss Admins", "error");
      }

      try {
        const response = await fetch(`/api/user/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicMetadata: { isAdmin: false },
          }),
        });

        if (response.ok) {
          await fetchUsers();
          showModal("Admin has been dismissed successfully", "success");
        } else {
          showModal("Failed to dismiss admin", "error");
        }
      } catch (error) {
        console.error("Error dismissing admin:", error);
        showModal("Failed to dismiss admin", "error");
      }
    },
    [canManageAdmins, fetchUsers, showModal]
  );

  const toggleSelect = useCallback(
    (id) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectAll(newSet.size === users.length);
        return newSet;
      });
    },
    [users.length]
  );

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const newSet = selectAll ? new Set() : new Set(users.map((u) => u.id));
      setSelectAll(!selectAll);
      return newSet;
    });
  }, [selectAll, users]);

  const handleSort = useCallback((field) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
      } else {
        setSortDirection("desc");
      }
      return field;
    });
  }, []);

  const handleEmailClick = useCallback((email) => {
    setShowEmailModal(true);
    setRecipientEmail(email);
  }, []);

  const handleEmailAll = useCallback(() => {
    setRecipientEmail(selectedEmails);
    setShowEmailModal(true);
  }, [selectedEmails]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (!user?.publicMetadata?.isAdmin && isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full py-7">
        <h1 className="text-2xl font-semibold">You are not an admin!</h1>
      </div>
    );
  }

  return (
    <div className="table-auto md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500">
      {isLoading ? (
        <TableSkeleton />
      ) : users.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="font-bold text-3xl">Users Management</h1>
            <div className="flex gap-2">
              <TextInput
                icon={() => <FaSearch className="h-5 w-5" />}
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Dropdown
                label="Filter"
                renderTrigger={() => (
                  <Button>
                    <FaFilter className="h-5 w-5 mr-2" />
                    Filter
                  </Button>
                )}
              >
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
                onClick={handleEmailAll}
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
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
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
                    className={`h-4 w-4 ${
                      sortField === "createdAt" ? "text-blue-500" : ""
                    }`}
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
                    className={`h-4 w-4 ${
                      sortField === "firstName" ? "text-blue-500" : ""
                    }`}
                  />
                </div>
              </Table.HeadCell>
              <Table.HeadCell>Email</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
              <Table.HeadCell>Role</Table.HeadCell>
              <Table.HeadCell>Actions</Table.HeadCell>
            </Table.Head>

            <Table.Body className="divide-y text-center">
              {processedUsers.map((user) => {
                const lastSeen = user.lastActiveAt;
                const isActive =
                  Date.now() - new Date(lastSeen).getTime() < ACTIVE_THRESHOLD;
                const email = user.emailAddresses[0]?.emailAddress || "";

                return (
                  <UserRow
                    key={user.id}
                    user={user}
                    isActive={isActive}
                    email={email}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                    onMakeAdmin={makeAdmin}
                    onDismissAdmin={dismissAdmin}
                    onEmailClick={handleEmailClick}
                    canManageAdmins={canManageAdmins}
                  />
                );
              })}
            </Table.Body>
          </Table>
        </div>
      ) : (
        <div className="flex items-center place-content-center min-h-screen">
          <h3 className="text-xl text-gray-500">No users found</h3>
        </div>
      )}
      {showEmailModal && (
        <SendEmail
          recipientEmail={recipientEmail}
          onClose={() => setShowEmailModal(false)}
        />
      )}
      <ResponseModal
        isOpen={modal.isOpen}
        message={modal.message}
        status={modal.status}
        onClose={() => setModal((m) => ({ ...m, isOpen: false }))}
      />
    </div>
  );
}
