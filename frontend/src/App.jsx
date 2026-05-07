import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Dashboard from "./components/Dashboard";
import { LogOut } from "lucide-react";

function App() {
  const { user, signOut } = useAuth();

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
              <header className="flex items-center justify-between px-4 py-3 bg-slate-900/60 backdrop-blur-md border-b border-slate-700/30">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-400 font-serif">{user?.email}</span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-md transition active:scale-[0.97] duration-150 ease-out-expo"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
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
