import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { useTheme } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Dashboard from "./components/Dashboard";
import { LogOut, Sun, Moon } from "lucide-react";

function App() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/app" /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/app" /> : <SignupPage />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <div className="flex flex-col h-screen">
              <header className="flex items-center justify-between px-4 py-3 bg-glass border-b border-default">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-secondary font-serif">{user?.email}</span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-secondary hover:text-primary hover:bg-secondary rounded-md transition active:scale-[0.97] duration-150 ease-out-expo"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
                <button
                  onClick={toggleTheme}
                  className="p-2 text-secondary hover:text-primary hover:bg-secondary rounded-md transition active:scale-[0.97] duration-150 ease-out-expo"
                  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                >
                  {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </header>
              <Dashboard />
            </div>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/app" />} />
      <Route path="*" element={<Navigate to="/app" />} />
    </Routes>
  );
}

export default App;
