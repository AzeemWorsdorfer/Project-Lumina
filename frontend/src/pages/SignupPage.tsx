import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { BookOpen } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email, password);
      toast.success("Account created! You can now sign in.");
      navigate("/login");
    } catch (error) {
      toast.error((error as Error).message || "Failed to create account");
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
          <p className="text-secondary font-serif italic text-base">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-glass-strong rounded-xl p-6 space-y-4 shadow-theme-xl">
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-secondary mb-1">Email</label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-primary border border-default rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition duration-150 ease-out-expo"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-secondary mb-1">Password</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-primary border border-default rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition duration-150 ease-out-expo"
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div>
            <label htmlFor="signup-confirm" className="block text-sm font-medium text-secondary mb-1">Confirm Password</label>
            <input
              id="signup-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-primary border border-default rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition duration-150 ease-out-expo"
              placeholder="Confirm your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-accent hover:bg-accent-hover disabled:opacity-50 text-on-accent font-medium rounded-lg transition duration-150 ease-out-expo active:scale-[0.98] shadow-theme-lg"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-muted mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-accent hover:text-accent-hover transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
