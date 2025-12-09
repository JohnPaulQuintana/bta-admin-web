import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import HomeImage from "../assets/home.png";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

interface PopupProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "success" | "error" | "info";
  onConfirm?: () => void;
  onCancel?: () => void;
}

const Popup: React.FC<PopupProps> = ({ isOpen, title, message, type = "info", onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full z-10">
        <div className="flex items-center gap-3 mb-4">
          {type === "success" ? (
            <CheckCircle className="text-emerald-400" size={24} />
          ) : (
            <AlertCircle className="text-red-400" size={24} />
          )}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="mb-6">{message}</p>
        <button
          onClick={onConfirm || onCancel}
          className={`w-full py-2 px-4 ${
            type === "success"
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          } rounded-lg font-medium transition`}
        >
          OK
        </button>
      </div>
    </div>
  );
};

// Separate PasswordInput component
const PasswordInput: React.FC<{
  label: string;
  field: "new_password" | "confirm_password";
  value: string;
  show: boolean;
  onChange: (field: "new_password" | "confirm_password", value: string) => void;
  onToggleShow: (field: "new_password" | "confirm_password") => void;
}> = ({ label, field, value, show, onChange, onToggleShow }) => {
  const handleToggleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleShow(field);
  };

  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-800 mb-2">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 outline-none pr-12 transition-all"
          placeholder={`Enter ${label.toLowerCase()}`}
        />
        <button
          type="button"
          onClick={handleToggleClick}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "reset">("email");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    new_password: "",
    confirm_password: "",
  });
  
  const [showPassword, setShowPassword] = useState({
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
  ) => setPopup({ isOpen: true, title, message, type, onConfirm });

  const closePopup = () => setPopup(prev => ({ ...prev, isOpen: false }));

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showPopup("Error", "Please enter your email", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/update/forgot-password`, {
        email,
      });

      setToken(res.data.token);

      showPopup(
        "Success",
        "Email validated! You can now reset your password.",
        "success",
        () => {
          closePopup();
          setStep("reset");
        }
      );
    } catch (err: any) {
      showPopup(
        "Error",
        err.response?.data?.message || "Failed to validate email",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showPopup("Error", "Passwords do not match", "error");
      return;
    }
    if (passwordForm.new_password.length < 6) {
      showPopup("Error", "Password must be at least 6 characters", "error");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/update/reset-password`, {
        token,
        password: passwordForm.new_password,
        password_confirmation: passwordForm.confirm_password,
      });

      showPopup(
        "Success",
        "Password reset successful! Please login with your new password.",
        "success",
        () => navigate("/login")
      );
    } catch (err: any) {
      showPopup(
        "Error",
        err.response?.data?.message || "Failed to reset password",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handler functions
  const handlePasswordChange = (field: "new_password" | "confirm_password", value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleShowPassword = (field: "new_password" | "confirm_password") => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f0b] px-4">
      <Popup
        isOpen={popup.isOpen}
        title={popup.title}
        message={popup.message}
        type={popup.type}
        onConfirm={popup.onConfirm || closePopup}
        onCancel={closePopup}
      />
      
      <form
        onSubmit={step === "email" ? handleSendEmail : handleResetPassword}
        className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-green-600/20"
      >
        <div className="flex justify-center mb-2">
          <img
            src={HomeImage}
            alt="Home"
            className="w-24 h-24 object-contain"
          />
        </div>

        <h1 className="text-3xl font-semibold mb-6 text-center text-green-700 tracking-wide">
          {step === "email" ? "Reset Password" : "Set New Password"}
        </h1>

        {step === "email" ? (
          <>
            <label className="block mb-4">
              <span className="text-gray-800 font-medium">Email</span>
              <input
                type="email"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg mt-4 transition font-medium text-lg disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </>
        ) : (
          <>
            <PasswordInput
              label="New Password"
              field="new_password"
              value={passwordForm.new_password}
              show={showPassword.new_password}
              onChange={handlePasswordChange}
              onToggleShow={handleToggleShowPassword}
            />
            <PasswordInput
              label="Confirm Password"
              field="confirm_password"
              value={passwordForm.confirm_password}
              show={showPassword.confirm_password}
              onChange={handlePasswordChange}
              onToggleShow={handleToggleShowPassword}
            />
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg mt-4 transition font-medium text-lg disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </>
        )}

        <Link
          to="/login"
          className="block text-green-700 hover:text-green-500 mt-4 text-center font-medium"
        >
          Back to Login
        </Link>
      </form>
    </div>
  );
}