import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GraduationCap, UserCog, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import ThemeToggle from "../components/ThemeToggle";

export default function Login() {
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login/", { email, password });
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      
      const userRes = await api.get("/auth/me/", { headers: { Authorization: `Bearer ${res.data.access}` } });

      toast.success("Welcome back!");
      navigate(userRes.data.role === "mentor" ? "/mentor/dashboard" : "/student/dashboard");
    } catch (err) {
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-4">
        <div className="card relative">
          <button onClick={() => navigate("/signup")} className="absolute top-6 left-6 text-muted hover:text-ink">
            <ArrowLeft size={20} />
          </button>
          
          <div className="text-center mt-4">
            <h1 className="text-2xl font-semibold">Login ThesisHub</h1>
            <p className="text-muted text-sm mt-1">Choose how you'll use it</p>
          </div>

          <div className="mt-5 space-y-3">
            <button type="button" onClick={() => setRole("student")}
              className={`w-full text-left flex gap-3 items-center p-4 rounded-2xl border transition
                ${role === "student" ? "border-accent bg-surface2" : "border-border hover:border-neutral-600"}`}>
              <div className="w-10 h-10 grid place-items-center rounded-xl bg-black/40 border border-border">
                <GraduationCap size={22} />
              </div>
              <div>
                <div className="font-medium">I'm a student</div>
                <div className="text-muted text-sm">Get guidance on your project</div>
              </div>
            </button>

            <button type="button" onClick={() => setRole("mentor")}
              className={`w-full text-left flex gap-3 items-center p-4 rounded-2xl border transition
                ${role === "mentor" ? "border-accent bg-surface2" : "border-border hover:border-neutral-600"}`}>
              <div className="w-10 h-10 grid place-items-center rounded-xl bg-black/40 border border-border">
                <UserCog size={22} />
              </div>
              <div>
                <div className="font-medium">I'm a mentor</div>
                <div className="text-muted text-sm">Verified writers and developers</div>
              </div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <label className="block">
              <span className="text-xs text-muted">Email</span>
              <input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink placeholder:text-neutral-500 focus:outline-none focus:border-accent" />
            </label>
            <label className="block">
              <span className="text-xs text-muted">Password</span>
              <input type="password" required placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink placeholder:text-neutral-500 focus:outline-none focus:border-accent" />
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>
        </div>

        <p className="text-center text-muted text-sm mt-4">
          Don't have an account? <Link to="/signup" className="text-ink underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}