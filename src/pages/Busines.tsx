import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

interface Notification {
  id: number;
  message: string;
  type: "success" | "error";
}

interface Business {
  id: number;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  total_users: number;
  total_buses: number;
}

export default function BusinessTable() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [newBusinessName, setNewBusinessName] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [operatorEmail, setOperatorEmail] = useState("");

  const [editBusiness, setEditBusiness] = useState<Business | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10); // rows per page
  const [totalPages, setTotalPages] = useState(1);

  // Notifications
  const addNotification = (message: string, type: "success" | "error") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setNotifications((prev) => prev.filter((n) => n.id !== id)),
      5000,
    );
  };

  // Fetch businesses with pagination
  const fetchBusinesses = async (page = 1) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/business`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, per_page: perPage }, // send pagination params
      });

      setBusinesses(res.data.data); // paginated businesses
      setTotalPages(res.data.total_pages); // API should return total pages
      setCurrentPage(page);
    } catch (err: any) {
      console.error(err);
      addNotification("Failed to fetch businesses", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    fetchBusinesses(page);
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  // Add business + operator
  const handleAddBusiness = async () => {
    if (!newBusinessName || !operatorName || !operatorEmail) {
      addNotification("Please fill in all fields", "error");
      return;
    }

    try {
      setSubmitting(true);

      // 1️⃣ Create business
      const res = await axios.post(
        `${API_URL}/business`,
        { name: newBusinessName, status: true },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const businessId = res.data.data.id;

      // 2️⃣ Register operator
      await axios.post(
        `${API_URL}/auth/register`,
        {
          name: operatorName,
          email: operatorEmail,
          password: "password",
          role: "operator",
          business_id: businessId,
          status: true,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      addNotification("Business and operator added successfully", "success");
      setNewBusinessName("");
      setOperatorName("");
      setOperatorEmail("");
      setShowAdd(false);
      fetchBusinesses();
    } catch (err: any) {
      console.error(err);
      addNotification(
        err.response?.data?.message || "Failed to add business",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Edit business
  const handleEditClick = (b: Business) => {
    setEditBusiness(b);
    setShowEdit(true);
  };

  const handleUpdateBusiness = async () => {
    if (!editBusiness) return;

    try {
      setSubmitting(true);
      await axios.put(
        `${API_URL}/business/${editBusiness.id}`,
        { name: editBusiness.name, status: editBusiness.status },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      addNotification("Business updated successfully", "success");
      setShowEdit(false);
      setEditBusiness(null);
      fetchBusinesses();
    } catch (err: any) {
      console.error(err);
      addNotification(
        err.response?.data?.message || "Failed to update business",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full mt-12 p-2">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-lg shadow-lg ${
              n.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {n.message}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <p className="text-gray-600 text-xs font-medium">Total Businesses</p>
          <p className="text-xl font-bold mt-1">
            {loading ? "..." : businesses.length}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <p className="text-gray-600 text-xs font-medium">Active Businesses</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            {loading ? "..." : businesses.filter((b) => b.status).length}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <p className="text-gray-600 text-xs font-medium">
            Inactive Businesses
          </p>
          <p className="text-xl font-bold text-amber-600 mt-1">
            {loading ? "..." : businesses.filter((b) => !b.status).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex justify-between items-center px-4 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Business Overview
          </h2>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Add New Business
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-gray-700">ID</th>
                <th className="px-4 py-3 text-left text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-gray-700">
                  Registered User
                </th>
                <th className="px-4 py-3 text-left text-gray-700">
                  Registered Bus
                </th>
                <th className="px-4 py-3 text-left text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-gray-700">Created</th>
                <th className="px-4 py-3 text-left text-gray-700">Updated</th>
                <th className="px-4 py-3 text-left text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    Loading...
                  </td>
                </tr>
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No businesses found.
                  </td>
                </tr>
              ) : (
                businesses.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3">{b.id}</td>
                    <td className="px-4 py-3">{b.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-white text-xs font-bold ${
                          b.total_users > 0
                            ? "bg-green-600 text-emerald-700 border border-green-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {b.total_users}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-white text-xs font-bold ${
                          b.total_buses > 0
                            ? "bg-green-600 text-emerald-700 border border-green-200"
                            : "bg-red-500 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {b.total_buses > 0 ? b.total_buses : "0"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          b.status
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {b.status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(b.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleEditClick(b)}
                        className="px-2 py-1 bg-green-600 text-white rounded-lg hover:bg-blue-700 text-xs"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Prev
            </button>

            <span className="px-2">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Business Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Add New Business</h2>
            <div>
              <label htmlFor="">Business Name</label>
              <input
                type="text"
                placeholder="Business Name"
                className="w-full border border-green-400 p-2 rounded-lg mb-2"
                value={newBusinessName}
                onChange={(e) => setNewBusinessName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="">Operator Name</label>
              <input
                type="text"
                placeholder="Operator Name"
                className="w-full border border-green-400 p-2 rounded-lg mb-2"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="">Operator Email</label>
              <input
                type="email"
                placeholder="Operator Email"
                className="w-full border border-green-400 p-2 rounded-lg mb-4"
                value={operatorEmail}
                onChange={(e) => setOperatorEmail(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBusiness}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Add Business"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Business Modal */}
      {showEdit && editBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-green-700 uppercase text-lg font-bold mb-4">Edit Business</h2>
            <div>
              <label htmlFor="">Business Name</label>
              <input
                type="text"
                className="w-full border border-gray-300 p-2 rounded-lg mb-4"
                value={editBusiness.name}
                onChange={(e) =>
                  setEditBusiness({ ...editBusiness, name: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm font-medium">Status:</label>
              <select
                className="border border-gray-300 p-2 rounded-lg"
                value={editBusiness.status ? "active" : "inactive"}
                onChange={(e) =>
                  setEditBusiness({
                    ...editBusiness,
                    status: e.target.value === "active",
                  })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowEdit(false);
                  setEditBusiness(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateBusiness}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
