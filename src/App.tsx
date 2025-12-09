import AppRouter from "./router/AppRouter";

export default function App() {
  // utils/logger.ts
  if (import.meta.env.MODE === "production") {
    // Disable all console methods in production
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
    console.info = () => {};
    console.debug = () => {};
  }

  return <AppRouter />;
}
