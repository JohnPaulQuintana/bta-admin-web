import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

interface Bus {
  id: number;
  bus_name: string;
  driver_name: string;
  license_plate: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Notification {
  id: number;
  message: string;
  type: "success" | "error";
}

export default function Buses() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [showDelete, setShowDelete] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedBus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // Number of buses per page

  const { token } = useAuth();

  const [form, setForm] = useState({
    bus_name: "",
    driver_name: "",
    license_plate: "",
    is_active: true,
  });

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
  const fetchBuses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/buses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBuses(response.data.data || response.data);
      addNotification("Buses loaded successfully", "success");
    } catch (err) {
      console.error("Failed to fetch buses:", err);
      addNotification("Failed to fetch buses. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (token) {
      fetchBuses();
    }
  }, [token]);

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/buses/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBuses(buses.filter((b) => b.id !== id));
      setShowDelete(false);
      addNotification("Bus deleted successfully", "success");
    } catch (err) {
      console.error("Failed to delete bus:", err);
      addNotification("Failed to delete bus. Please try again.", "error");
    }
  };

  const handleAddSubmit = async () => {
    if (!form.bus_name.trim()) {
      addNotification("Please fill in all required fields", "error");
      setShowAdd(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/buses`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const newBus = response.data;
      setBuses([...buses, newBus]);
      setShowAdd(false);
      setForm({
        bus_name: "",
        driver_name: "",
        license_plate: "",
        is_active: true,
      });
      addNotification("Bus added successfully", "success");
      fetchBuses();
    } catch (err: any) {
      console.error("Failed to add bus:", err);
      const errorMsg =
        err.response?.data?.message || "Failed to add bus. Please try again.";
      addNotification(errorMsg, "error");
    }
  };

  const handleEditSubmit = async () => {
    if (!editingBus) return;

    if (!editingBus.bus_name.trim()) {
      addNotification("Please fill in all required fields", "error");
      return;
    }

    try {
      await axios.post(`${API_URL}/buses/${editingBus.id}`, editingBus, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Alternative: Update the bus in state manually
      setBuses((prevBuses) =>
        prevBuses.map((bus) =>
          bus.id === editingBus.id
            ? {
                ...bus,
                ...editingBus, // Spread the edited data
                updated_at: new Date().toISOString(), // Update timestamp
              }
            : bus
        )
      );

      setShowEdit(false);
      setEditingBus(null);
      addNotification("Bus updated successfully", "success");
      fetchBuses();
    } catch (err: any) {
      console.error("Failed to update bus:", err);
      const errorMsg =
        err.response?.data?.message ||
        "Failed to update bus. Please try again.";
      addNotification(errorMsg, "error");
    }
  };

  const handleEditClick = (bus: Bus) => {
    setEditingBus({ ...bus });
    setShowEdit(true);
  };

  const toggleBusStatus = async (bus: Bus) => {
    try {
      const updatedBus = { ...bus, is_active: !bus.is_active };
      const response = await axios.put(
        `${API_URL}/buses/${bus.id}`,
        updatedBus,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBuses(buses.map((b) => (b.id === bus.id ? response.data : b)));
      addNotification(
        `Bus ${!bus.is_active ? "activated" : "deactivated"} successfully`,
        "success"
      );
    } catch (err: any) {
      console.error("Failed to update bus status:", err);
      const errorMsg =
        err.response?.data?.message ||
        "Failed to update bus status. Please try again.";
      addNotification(errorMsg, "error");
    }
  };

  const paginatedBuses = buses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(buses.length / pageSize);

  return (
    <div className="w-full mt-12 md:mt-0 p-2">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
              notification.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 w-5 h-5 mt-0.5 ${
                  notification.type === "success"
                    ? "text-emerald-500"
                    : "text-red-500"
                }`}
              >
                {notification.type === "success" ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
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
                )}
              </div>
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-200">
          <p className="text-gray-600 text-xs md:text-sm font-medium">
            Total Buses
          </p>
          <p className="text-xl md:text-2xl font-bold text-gray-800 mt-1 md:mt-2">
            {loading ? "..." : buses.length}
          </p>
        </div>
        <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-200">
          <p className="text-gray-600 text-xs md:text-sm font-medium">
            Active Buses
          </p>
          <p className="text-xl md:text-2xl font-bold text-emerald-600 mt-1 md:mt-2">
            {loading ? "..." : buses.filter((b) => b.is_active).length}
          </p>
        </div>
        {/* <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-200">
          <p className="text-gray-600 text-xs md:text-sm font-medium">
            Drivers Assigned
          </p>
          <p className="text-xl md:text-2xl font-bold text-blue-600 mt-1 md:mt-2">
            {loading
              ? "..."
              : new Set(buses.map((b) => b.driver_name).filter(Boolean)).size}
          </p>
        </div> */}
        <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-200">
          <p className="text-gray-600 text-xs md:text-sm font-medium">
            Inactive
          </p>
          <p className="text-xl md:text-2xl font-bold text-amber-600 mt-1 md:mt-2">
            {loading ? "..." : buses.filter((b) => !b.is_active).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center justify-between px-4 md:px-6 py-4 md:py-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              Fleet Overview
            </h2>
            <p className="text-gray-600 text-xs md:text-sm mt-1">
              All registered buses in the system
            </p>
          </div>

          <div>
            <button
              onClick={() => setShowAdd(true)}
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
              Add New Bus
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-4 md:px-6 py-3 md:py-4 text-left min-w-[120px]">
                  <span className="uppercase text-gray-600 font-medium text-xs md:text-sm tracking-wider">
                    arduino endpoint
                  </span>
                </th>

                {/* <th className="px-4 md:px-6 py-3 md:py-4 text-left min-w-[80px]">
                  <span className="text-gray-600 font-medium text-xs md:text-sm tracking-wider">
                    ID
                  </span>
                </th> */}
                <th className="px-4 md:px-6 py-3 md:py-4 text-left min-w-[180px]">
                  <span className="text-gray-600 font-medium text-xs md:text-sm tracking-wider">
                    BUS NAME
                  </span>
                </th>
                {/* <th className="px-4 md:px-6 py-3 md:py-4 text-left min-w-[180px]">
                  <span className="text-gray-600 font-medium text-xs md:text-sm tracking-wider">
                    DRIVER
                  </span>
                </th> */}
                <th className="px-4 md:px-6 py-3 md:py-4 text-left min-w-[150px]">
                  <span className="text-gray-600 font-medium text-xs md:text-sm tracking-wider">
                    LICENSE PLATE
                  </span>
                </th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left min-w-[120px]">
                  <span className="text-gray-600 font-medium text-xs md:text-sm tracking-wider">
                    STATUS
                  </span>
                </th>

                <th className="px-4 md:px-6 py-3 md:py-4 text-left min-w-[150px]">
                  <span className="text-gray-600 font-medium text-xs md:text-sm tracking-wider">
                    CREATED
                  </span>
                </th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left min-w-[150px]">
                  <span className="text-gray-600 font-medium text-xs md:text-sm tracking-wider">
                    UPDATED
                  </span>
                </th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left min-w-[180px]">
                  <span className="text-gray-600 font-medium text-xs md:text-sm tracking-wider">
                    ACTIONS
                  </span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 md:px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                    <p className="text-gray-500 mt-2">Loading buses...</p>
                  </td>
                </tr>
              ) : buses.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 md:px-6 py-8 text-center text-gray-500"
                  >
                    No buses found. Add your first bus!
                  </td>
                </tr>
              ) : (
                paginatedBuses.map((bus) => (
                  <tr
                    key={bus.id}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <span className="text-green-800 text-sm">
                        {`https://ex-en.tech/api/buses/${bus.id}/location`}
                      </span>
                    </td>

                    {/* <td className="px-4 md:px-6 py-3 md:py-4">
                      <span className="inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gray-100 text-gray-700 font-medium text-xs md:text-sm">
                        {bus.id}
                      </span>
                    </td> */}
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 md:w-5 md:h-5 text-emerald-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                            />
                          </svg>
                        </div>
                        <span className="font-medium text-gray-800 text-sm md:text-base">
                          {bus.bus_name}
                        </span>
                      </div>
                    </td>
                    {/* <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <svg
                            className="w-3 h-3 md:w-4 md:h-4 text-gray-500"
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
                        <span className="text-gray-700 text-sm md:text-base">
                          {bus.driver_name || "—"}
                        </span>
                      </div>
                    </td> */}
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <span className="px-2 py-1 md:px-3 md:py-1.5 bg-gray-100 rounded-lg text-gray-700 font-mono text-xs md:text-sm border border-gray-200">
                        {bus.license_plate || "—"}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <button
                        onClick={() => toggleBusStatus(bus)}
                        className={`inline-flex items-center px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm font-medium cursor-pointer transition-colors ${
                          bus.is_active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                        }`}
                        title="Click to toggle status"
                      >
                        <span
                          className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full mr-1.5 md:mr-2 ${
                            bus.is_active ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        ></span>
                        {bus.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="text-gray-700">
                        <div className="font-medium text-sm md:text-base">
                          {bus.created_at
                            ? new Date(bus.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "—"}
                        </div>
                        <div className="text-xs text-gray-500">Date added</div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="text-gray-700">
                        <div className="font-medium text-sm md:text-base">
                          {bus.updated_at
                            ? new Date(bus.updated_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Last updated
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="flex items-center gap-1 md:gap-2">
                        <button
                          onClick={() => handleEditClick(bus)}
                          className="flex items-center gap-1 px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <svg
                            className="w-3 h-3 md:w-4 md:h-4"
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
                          Edit
                        </button>
                        {/* <button
                          onClick={() => {
                            setSelectedBus(bus.id);
                            setShowDelete(true);
                          }}
                          className="flex items-center gap-1 px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          <svg
                            className="w-3 h-3 md:w-4 md:h-4"
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
                          Delete
                        </button> */}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && buses.length > 0 && (
          <div className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-gray-500 text-xs md:text-sm">
              Showing {(currentPage - 1) * pageSize + 1} -{" "}
              {Math.min(currentPage * pageSize, buses.length)} of {buses.length}{" "}
              buses
            </span>
            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-white bg-green-600 rounded-lg">
                {currentPage}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Bus Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white rounded-xl border border-gray-200 p-6 w-full max-w-md shadow-xl z-10">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-6">
              Add New Bus
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bus Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter bus name"
                  value={form.bus_name}
                  onChange={(e) =>
                    setForm({ ...form, bus_name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Driver Name
                </label>
                <input
                  type="text"
                  placeholder="Enter driver name"
                  value={form.driver_name}
                  onChange={(e) =>
                    setForm({ ...form, driver_name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Plate <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter license plate"
                  value={form.license_plate}
                  onChange={(e) =>
                    setForm({ ...form, license_plate: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active_add"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <label
                  htmlFor="is_active_add"
                  className="text-sm text-gray-700"
                >
                  Active
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubmit}
                className="px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-all duration-300"
              >
                Add Bus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bus Modal */}
      {showEdit && editingBus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setShowEdit(false)}
          />
          <div className="relative bg-white rounded-xl border border-gray-200 p-6 w-full max-w-md shadow-xl z-10">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-6">
              Edit Bus
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bus Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter bus name"
                  value={editingBus.bus_name}
                  onChange={(e) =>
                    setEditingBus({ ...editingBus, bus_name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Driver Name
                </label>
                <input
                  type="text"
                  placeholder="Enter driver name"
                  value={editingBus.driver_name}
                  onChange={(e) =>
                    setEditingBus({
                      ...editingBus,
                      driver_name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Plate <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter license plate"
                  value={editingBus.license_plate}
                  onChange={(e) =>
                    setEditingBus({
                      ...editingBus,
                      license_plate: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active_edit"
                  checked={editingBus.is_active}
                  onChange={(e) =>
                    setEditingBus({
                      ...editingBus,
                      is_active: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <label
                  htmlFor="is_active_edit"
                  className="text-sm text-gray-700"
                >
                  Active
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setShowEdit(false)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-300"
              >
                Update Bus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDelete && selectedBus !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setShowDelete(false)}
          />
          <div className="relative bg-white rounded-xl border border-gray-200 p-6 w-full max-w-md shadow-xl z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-500"
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
                  Delete Bus
                </h2>
                <p className="text-gray-600 text-sm">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-8">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                {buses.find((b) => b.id === selectedBus)?.bus_name}
              </span>
              ? All associated data will be permanently removed.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(selectedBus)}
                className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-all duration-300"
              >
                Delete Bus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
