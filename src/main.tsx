import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      {/* Toast notifications container */}
      <Toaster position="top-right" reverseOrder={false} />
      <App />
    </AuthProvider>
  </StrictMode>,
);
