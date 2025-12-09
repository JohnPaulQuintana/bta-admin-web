import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import HomeImage from "../assets/home.png";

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth(); // include isAuthenticated
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) navigate("/dashboard", { replace: true });
    else setError("Invalid email or password");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f0b] px-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-green-600/20"
      >
        {/* Image */}
        <div className="flex justify-center mb-2">
          <img src={HomeImage} alt="Home" className="w-24 h-24 object-contain" />
        </div>

        <h1 className="text-3xl font-semibold mb-6 text-center text-green-700 tracking-wide">
          Smart Bus Tracker
        </h1>

        {error && (
          <p className="text-red-500 mb-3 text-center font-medium">{error}</p>
        )}

        {/* Email */}
        <label className="block mb-4">
          <span className="text-gray-800 font-medium">Email</span>
          <input
            type="email"
            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        {/* Password */}
        <label className="block mb-4 relative">
          <span className="text-gray-800 font-medium">Password</span>
          <input
            type={showPassword ? "text" : "password"}
            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none transition-all pr-12"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 bottom-3 text-gray-600 hover:text-green-600 transition"
          >
            {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
          </button>
        </label>

        {/* Button */}
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg mt-4 transition font-medium text-lg"
        >
          Login
        </button>

        {/* Forgot Password */}
        <Link
          to="/forgot-password"
          className="block text-green-700 hover:text-green-500 mt-4 text-center font-medium"
        >
          Forgot Password?
        </Link>
      </form>
    </div>
  );
}
