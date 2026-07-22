import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { BookOpen } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back!");
      navigate("/app");
    } catch (error) {
      toast.error((error as Error).message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'var(--bg-gradient)'}}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-accent-light rounded-2xl mb-4">
            <BookOpen className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-4xl font-bold text-accent mb-2 font-serif tracking-tight">Lumina</h1>
          <p className="text-secondary font-serif italic text-base">Sign in to your learning journey</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-glass-strong rounded-xl p-6 space-y-4 shadow-theme-xl">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-secondary mb-1">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-primary border border-default rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition duration-150 ease-out-expo"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-secondary mb-1">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-primary border border-default rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition duration-150 ease-out-expo"
              placeholder="Your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-accent hover:bg-accent-hover disabled:opacity-50 text-on-accent font-medium rounded-lg transition duration-150 ease-out-expo active:scale-[0.98] shadow-theme-lg"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-muted mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-accent hover:text-accent-hover transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
