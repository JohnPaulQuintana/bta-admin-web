import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
const API_URL = import.meta.env.VITE_API_URL;

interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;

  // Static field we add in frontend only
  status: "Active" | "Inactive" | string;
}

interface Notification {
  id: number;
  message: string;
  type: "success" | "error";
}
const initialUsers = [
  {
    id: 1,
    name: "Admin Account",
    email: "admin@app.com",
    role: "admin",
    created_at: "2025-01-15",
    status: "active",
  },
  {
    id: 2,
    name: "User One",
    email: "user1@app.com",
    role: "user",
    created_at: "2025-02-20",
    status: "active",
  },
  {
    id: 3,
    name: "User Two",
    email: "user2@app.com",
    role: "user",
    created_at: "2025-03-10",
    status: "inactive",
  },
];

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { token } = useAuth();

  const handleDelete = (id: number) => {
    setUsers(users.filter((user) => user.id !== id));
    setShowDelete(false);
  };

  const handleAdd = () => {
    const name = prompt("User Name");
    const email = prompt("Email");
    const role = prompt("Role (admin/user)");
    if (!name || !email || !role) return;

    const newUser = {
      id: users.length + 1,
      name: name,
      email: email,
      role: role.toLowerCase(),
      created_at: new Date().toISOString().split("T")[0],
      status: "active",
    };
    setUsers([...users, newUser]);
  };

  // Add notification
  const addNotification = (message: string, type: "success" | "error") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  // Fetch buses on mount
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/bta/users?page=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const apiUsers = response.data.data.data;
      console.log(apiUsers);
      const formatted = apiUsers.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role?.name || "user",
        status: "active",
        created_at: u.created_at,
        updated_at: u.updated_at,
      }));
      console.log(formatted);
      setUsers(formatted);
      setCurrentPage(response.data.data.current_page);
      setLastPage(response.data.data.last_page);
      setTotal(response.data.data.total);

      addNotification("Users loaded successfully", "success");
    } catch (err) {
      console.error("Failed to fetch users:", err);
      addNotification("Failed to fetch users. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers(currentPage);
    }
  }, [token, currentPage]);

  return (
    <div className="p-2 mt-12 md:mt-0 w-full">
      {/* Header */}
      {/* <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            User Management
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Manage system users and permissions
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-lg md:rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 w-full md:w-auto justify-center"
        >
          <svg
            className="w-4 h-4 md:w-5 md:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add New User
        </button>
      </div> */}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-200">
          <p className="text-gray-600 text-xs md:text-sm font-medium">
            Total Users
          </p>
          <p className="text-xl md:text-2xl font-bold text-gray-800 mt-1 md:mt-2">
            {users.length}
          </p>
        </div>
        {/* <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-200">
          <p className="text-gray-600 text-xs md:text-sm font-medium">Admins</p>
          <p className="text-xl md:text-2xl font-bold text-purple-600 mt-1 md:mt-2">
            {users.filter((user) => user.role === "admin").length}
          </p>
        </div> */}
        {/* <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-200">
          <p className="text-gray-600 text-xs md:text-sm font-medium">
            Regular Users
          </p>
          <p className="text-xl md:text-2xl font-bold text-blue-600 mt-1 md:mt-2">
            {users.filter((user) => user.role === "user").length}
          </p>
        </div> */}
        <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-200">
          <p className="text-gray-600 text-xs md:text-sm font-medium">
            Active Users
          </p>
          <p className="text-xl md:text-2xl font-bold text-emerald-600 mt-1 md:mt-2">
            {users.filter((user) => user.status === "active").length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-4 md:px-6 py-4 md:py-6 border-b border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">
            All Users
          </h2>
          <p className="text-gray-600 text-xs md:text-sm mt-1">
            Manage user accounts and permissions
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                  <span className="text-gray-600 font-medium text-xs md:text-sm tracking-wider">
                    ID
                  </span>
                </th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                  <span className="text-gray-600 font-medium text-xs md:text-sm tracking-wider">
                    USER
                  </span>
                </th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                  <span className="text-gray-600 font-medium text-xs md:text-sm tracking-wider">
                    EMAIL
                  </span>
                </th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                  <span className="text-gray-600 font-medium text-xs md:text-sm tracking-wider">
                    ROLE
                  </span>
                </th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                  <span className="text-gray-600 font-medium text-xs md:text-sm tracking-wider">
                    STATUS
                  </span>
                </th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                  <span className="text-gray-600 font-medium text-xs md:text-sm tracking-wider">
                    JOINED
                  </span>
                </th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                  <span className="text-gray-600 font-medium text-xs md:text-sm tracking-wider">
                    ACTIONS
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <span className="inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gray-100 text-gray-700 font-medium text-xs md:text-sm">
                      {user.id}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 border border-purple-200 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 md:w-5 md:h-5 text-purple-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div>
                        <span className="font-medium text-gray-800 text-sm md:text-base block">
                          {user.name}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <div className="text-gray-700">
                      <div className="font-medium text-sm md:text-base">
                        {user.email}
                      </div>
                      {/* <div className="text-xs text-gray-500">Email address</div> */}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm font-medium bg-blue-50 text-emerald-500 border border-blue-200`}
                    >
                      <span
                        className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full mr-1.5 md:mr-2 ${
                          user.status === "active"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                      ></span>

                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm font-medium ${
                        user.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full mr-1.5 md:mr-2 ${
                          user.status === "active"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                      ></span>
                      {user.status.charAt(0).toUpperCase() +
                        user.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <div className="text-gray-700">
                      <div className="font-medium text-sm">
                        {new Date(user.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>

                      <div className="text-xs text-gray-500">
                        Registration date
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-1 md:gap-2">
                      {/* <button className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700">
                        <svg
                          className="w-4 h-4 md:w-5 md:h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button> */}
                      <button
                        onClick={() => {
                          setSelectedUser(user.id);
                          setShowDelete(true);
                        }}
                        className="p-1.5 md:p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-500 hover:text-red-600"
                      >
                        <svg
                          className="w-4 h-4 md:w-5 md:h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="text-gray-500 text-xs md:text-sm">
            Showing page {currentPage} of {lastPage} — Total {total} users
          </span>

          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-lg transition-colors
        ${
          currentPage === 1
            ? "text-gray-300 bg-gray-100"
            : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
        }
      `}
            >
              Previous
            </button>

            <span className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-white bg-green-600 rounded-lg">
              {currentPage}
            </span>

            <button
              onClick={() =>
                currentPage < lastPage && setCurrentPage(currentPage + 1)
              }
              disabled={currentPage === lastPage}
              className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-lg transition-colors
                ${
                  currentPage === lastPage
                    ? "text-gray-300 bg-gray-100"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                }
              `}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDelete && selectedUser !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setShowDelete(false)}
          />
          <div className="relative bg-white rounded-xl border border-gray-200 p-6 w-full max-w-md shadow-xl z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-800">
                  Delete User
                </h2>
                <p className="text-gray-600 text-sm">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-6 md:mb-8">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                {users.find((u) => u.id === selectedUser)?.name}
              </span>
              ? All user data will be permanently removed.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 px-4 py-2.5 md:px-6 md:py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(selectedUser)}
                className="flex-1 px-4 py-2.5 md:px-6 md:py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-all duration-300"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
