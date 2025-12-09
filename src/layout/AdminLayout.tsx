import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  TruckIcon,
  UsersIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = [
    { 
      name: "Dashboard", 
      to: "/dashboard", 
      icon: HomeIcon 
    },
    { 
      name: "Buses", 
      to: "/buses", 
      icon: TruckIcon 
    },
    { 
      name: "Users", 
      to: "/users", 
      icon: UsersIcon 
    },
    { 
      name: "Profile", 
      to: "/profile", 
      icon: UserCircleIcon 
    },
  ];

  // const currentPage = links.find((link) => link.to === location.pathname)?.name || "";

  // Get first letter of user name
  const profileLetter = user?.name?.[0]?.toUpperCase() || "?";

  return (
    <div className="w-full flex min-h-screen bg-[#121414]">
      {/* Mobile Header */}
      <header className="bg-[#0b0f0b] text-white flex items-center justify-between p-4 md:hidden w-full fixed top-0 z-20">
        <h2 className="text-xl font-bold text-green-600">Admin Panel</h2>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 bg-[#0b0f0b] text-white p-6 flex flex-col z-30
          transform transition-transform duration-300 ease-in-out
          md:translate-x-0 md:relative md:flex shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <h2 className="text-2xl font-bold mb-8 text-green-600">Admin Panel</h2>

        <nav className="flex-1 space-y-2">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            const Icon = link.icon;
            
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-green-600 text-white"
                    : "text-gray-300 hover:bg-green-600 hover:text-white"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="mt-auto flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg transition font-medium"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-10"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col w-full h-screen overflow-hidden border">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between bg-white text-white p-4 border-b border-green-600/30">
          <h1 className="text-2xl font-bold text-green-600">{"Smart Bus Tracker"}</h1>

          {/* Profile Circle */}
          <div
            className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold cursor-pointer"
            title={user?.name}
          >
            {profileLetter}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-2 overflow-auto bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}