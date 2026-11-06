import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login/", { email, password, role: "admin" });
      
      // Admin receives tokens directly (no verification)
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      
      toast.success("Welcome Admin");
      navigate("/admin/dashboard");
    } catch (err) {
      const errorMsg = err.response?.data?.detail?.[0] || err.response?.data?.detail || "Invalid admin credentials";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md space-y-4">
        <div className="card relative border-accent">
          <button onClick={() => navigate("/login")} className="absolute top-6 left-6 text-muted hover:text-ink">
            <ArrowLeft size={20} />
          </button>
          
          <div className="text-center mt-4">
            <h1 className="text-2xl font-semibold flex items-center justify-center gap-2">
              <ShieldCheck className="text-accent" /> Admin Portal
            </h1>
            <p className="text-muted text-sm mt-1">Authorized access only</p>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off" className="mt-8 space-y-3">
            <label className="block">
              <span className="text-xs text-muted">Admin Email</span>
              <input 
                type="email" 
                required 
                placeholder="admin@scriptahub.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink placeholder:text-neutral-500 focus:outline-none focus:border-accent" 
              />
            </label>

            <label className="block">
              <span className="text-xs text-muted">Password</span>
              <div className="relative mt-1">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  placeholder="Admin password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 pr-12 text-ink placeholder:text-neutral-500 focus:outline-none focus:border-accent" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-muted hover:text-ink"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
              {loading ? "Authenticating..." : "Log In as Admin"}
            </button>
          </form>
        </div>

        <p className="text-center text-muted text-sm mt-4">
          Not an admin? <Link to="/login" className="text-ink underline">Go to User Login</Link>
        </p>
      </div>
    </div>
  );
}
