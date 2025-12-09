import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  Eye,
  EyeOff,
  User,
  Lock,
  LogOut,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

interface PasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface PopupProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "success" | "error" | "info";
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
}

const Popup: React.FC<PopupProps> = ({
  isOpen,
  title,
  message,
  type = "info",
  onConfirm,
  onCancel,
  confirmText = "Confirm",
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    success: {
      icon: CheckCircle,
      bgColor: "bg-emerald-900/90 border-emerald-800",
      iconColor: "text-emerald-400",
      buttonColor: "bg-emerald-600 hover:bg-emerald-700",
    },
    error: {
      icon: AlertCircle,
      bgColor: "bg-red-900/90 border-red-800",
      iconColor: "text-red-400",
      buttonColor: "bg-red-600 hover:bg-red-700",
    },
    info: {
      icon: AlertCircle,
      bgColor: "bg-blue-900/90 border-blue-800",
      iconColor: "text-blue-400",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
    },
  };

  const Icon = typeStyles[type].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div
        className={`relative w-full max-w-md ${typeStyles[type].bgColor} border rounded-xl shadow-2xl p-6 z-10`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Icon className={typeStyles[type].iconColor} size={24} />
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
        </div>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex gap-3">
          {onCancel && type === "info" && (
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onConfirm || onCancel}
            className={`flex-1 py-2.5 px-4 ${typeStyles[type].buttonColor} text-white rounded-lg font-medium`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Separate PasswordInput component outside to prevent re-renders
const PasswordInput: React.FC<{
  label: string;
  value: string;
  field: keyof PasswordForm;
  show: boolean;
  onChange: (field: keyof PasswordForm, value: string) => void;
  onToggleShow: (field: keyof PasswordForm) => void;
}> = ({ label, value, field, show, onChange, onToggleShow }) => {
  // Prevent form submission when clicking the eye icon
  const handleToggleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleShow(field);
  };

  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          className="w-full p-3.5 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-12 text-white transition-all"
          placeholder={`Enter ${label.toLowerCase()}`}
        />
        <button
          type="button"
          onClick={handleToggleClick}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1.5"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
};

export default function Profile() {
  const { token, user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const [editPassword, setEditPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState({
    current_password: false,
    new_password: false,
    confirm_password: false,
  });

  const [popup, setPopup] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showPopup = (
    title: string,
    message: string,
    type: "success" | "error" | "info",
    onConfirm?: () => void
  ) => {
    setPopup({ isOpen: true, title, message, type, onConfirm });
  };

  const closePopup = () => setPopup((prev) => ({ ...prev, isOpen: false }));

  const handleUpdateProfile = async () => {
    if (!name.trim() || !email.trim()) {
      showPopup("Error", "Please fill in all fields", "error");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/update/info`,
        { name, email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showPopup("Success", "Profile updated successfully", "success");
    } catch (err: any) {
      showPopup(
        "Error",
        err.response?.data?.message || "Failed to update profile",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showPopup("Error", "Passwords don't match", "error");
      return;
    }
    if (passwordForm.new_password.length < 6) {
      showPopup("Error", "Password must be at least 6 characters", "error");
      return;
    }

    setPasswordLoading(true);
    try {
      await axios.post(
        `${API_URL}/bta/direct/password`,
        {
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
          new_password_confirmation: passwordForm.confirm_password,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showPopup(
        "Success",
        "Password changed successfully. You will be logged out.",
        "success",
        () => {
          setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
          setEditPassword(false);
          logout();
        }
      );
    } catch (err: any) {
      showPopup(
        "Error",
        err.response?.data?.message || "Failed to change password",
        "error"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    showPopup("Logout", "Are you sure you want to logout?", "info", logout);
  };

  // Handler functions for PasswordInput
  const handlePasswordChange = (field: keyof PasswordForm, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleShowPassword = (field: keyof PasswordForm) => {
    console.log("Toggling field:", field); // Debug log
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No user found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border py-2 mt-14 md:mt-0 rounded-sm">
      <Popup
        isOpen={popup.isOpen}
        title={popup.title}
        message={popup.message}
        type={popup.type}
        onConfirm={popup.onConfirm || closePopup}
        onCancel={closePopup}
        confirmText={popup.type === "info" ? "Logout" : "OK"}
      />

      <div className="w-full px-4">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-600 mb-2">Profile Settings</h1>
          <p className="text-gray-400">Manage your account information</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Profile Card */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-900/30 rounded-lg">
                <User className="text-blue-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Personal Information</h2>
                <p className="text-sm text-gray-400">Update your name and email</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3.5 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-white"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3.5 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-white"
                  placeholder="Enter your email"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>

          {/* Logout Card */}
          <div className="bg-red-900/60 border border-red-800/30 rounded-xl p-6 min-h-[200px]">
            <div className="flex items-center gap-3 mb-4">
              <LogOut className="text-red-800" size={20} />
              <h3 className="text-lg font-semibold text-white">Logout on Bus Tracker</h3>
            </div>
            <p className="text-gray-200 mb-4">
              Sign out of your account. Make sure you have saved all your progress before logging out.
            </p>
            <p className="text-gray-200 mb-4">
              Logging out will end your current session and you will need to log in again to continue.
            </p>
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-red-600/70 hover:bg-red-700/70 border border-red-800/30 text-white rounded-lg font-medium transition-colors"
            >
              Logout Account
            </button>
          </div>

          {/* Password Card */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-900/30 rounded-lg">
                  <Lock className="text-purple-400" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Password & Security</h2>
                  <p className="text-sm text-gray-400">Change your password</p>
                </div>
              </div>

              <button
                onClick={() => setEditPassword(!editPassword)}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
              >
                {editPassword ? "Cancel" : "Change Password"}
              </button>
            </div>

            {editPassword && (
              <div className="pt-4 border-t border-gray-800">
                <div className="max-w-md mx-auto">
                  <PasswordInput
                    label="Current Password"
                    value={passwordForm.current_password}
                    field="current_password"
                    show={showPassword.current_password}
                    onChange={handlePasswordChange}
                    onToggleShow={handleToggleShowPassword}
                  />
                  <PasswordInput
                    label="New Password"
                    value={passwordForm.new_password}
                    field="new_password"
                    show={showPassword.new_password}
                    onChange={handlePasswordChange}
                    onToggleShow={handleToggleShowPassword}
                  />
                  <PasswordInput
                    label="Confirm New Password"
                    value={passwordForm.confirm_password}
                    field="confirm_password"
                    show={showPassword.confirm_password}
                    onChange={handlePasswordChange}
                    onToggleShow={handleToggleShowPassword}
                  />

                  <div className="mb-6 p-4 bg-gray-800/30 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Password Requirements</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {passwordForm.new_password.length >= 6 ? (
                          <CheckCircle className="text-emerald-400" size={16} />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-gray-600" />
                        )}
                        <span className={`text-sm ${passwordForm.new_password.length >= 6 ? "text-emerald-400" : "text-gray-400"}`}>
                          At least 6 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordForm.new_password === passwordForm.confirm_password &&
                        passwordForm.new_password.length > 0 ? (
                          <CheckCircle className="text-emerald-400" size={16} />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-gray-600" />
                        )}
                        <span className={`text-sm ${passwordForm.new_password === passwordForm.confirm_password && passwordForm.new_password.length > 0 ? "text-emerald-400" : "text-gray-400"}`}>
                          Passwords match
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleChangePassword}
                      disabled={
                        passwordLoading ||
                        !passwordForm.current_password ||
                        !passwordForm.new_password
                      }
                      className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {passwordLoading ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}