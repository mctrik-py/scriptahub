import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GraduationCap, UserCog, ArrowLeft, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import ThemeToggle from "../components/ThemeToggle";

export default function Login() {
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login/", { 
        email: email.trim(), 
        password: password.trim(), 
        role 
      });

      if (res.data.verification_required) {
        setShowVerify(true);
        toast.success("Verification code sent to your email.");
      } else {
        localStorage.setItem("access", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);
        toast.success("Welcome back!");
        
        if (res.data.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate(res.data.role === "mentor" ? "/mentor/dashboard" : "/student/dashboard");
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail?.[0] || err.response?.data?.detail || "Invalid email or password";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLogin = async () => {
    try {
      const res = await api.post("/auth/confirm-login/", { email, code: verifyCode });
      localStorage.setItem("access", res.data.tokens.access);
      localStorage.setItem("refresh", res.data.tokens.refresh);
      
      toast.success("Login successful!");
      if (res.data.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate(res.data.role === "mentor" ? "/mentor/dashboard" : "/student/dashboard");
      }
    } catch (err) {
      toast.error("Invalid verification code.");
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-md space-y-4">
        <div className="card relative">
          <button onClick={() => navigate("/signup")} className="absolute top-6 left-6 text-muted hover:text-ink"><ArrowLeft size={20} /></button>
          
          <div className="text-center mt-4">
            <h1 className="text-2xl font-semibold">Login ScriptaHub</h1>
            <p className="text-accent font-medium text-sm mt-1 italic">"Where Solutions Meet Thesis"</p>
            <p className="text-muted text-sm mt-1">Choose how you'll use it</p>
          </div>

          <div className="mt-5 space-y-3">
            <button type="button" onClick={() => setRole("student")}
              className={`w-full text-left flex gap-3 items-center p-4 rounded-2xl border transition ${role === "student" ? "border-accent bg-surface2" : "border-border hover:border-neutral-600"}`}>
              <div className="w-10 h-10 grid place-items-center rounded-xl bg-black/40 border border-border"><GraduationCap size={22} /></div>
              <div><div className="font-medium">I'm a student</div><div className="text-muted text-sm">Get guidance on your project</div></div>
            </button>
            <button type="button" onClick={() => setRole("mentor")}
              className={`w-full text-left flex gap-3 items-center p-4 rounded-2xl border transition ${role === "mentor" ? "border-accent bg-surface2" : "border-border hover:border-neutral-600"}`}>
              <div className="w-10 h-10 grid place-items-center rounded-xl bg-black/40 border border-border"><UserCog size={22} /></div>
              <div><div className="font-medium">I'm a mentor</div><div className="text-muted text-sm">Verified writers and developers</div></div>
            </button>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off" noValidate className="mt-6 space-y-3">
            <label className="block">
              <span className="text-xs text-muted">Email</span>
              <input type="email" name="email_input" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink placeholder:text-neutral-500 focus:outline-none focus:border-accent" />
            </label>
            <label className="block">
              <span className="text-xs text-muted">Password</span>
              <div className="relative mt-1">
                <input type={showPassword ? "text" : "password"} name="password_input" required placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 pr-12 text-ink placeholder:text-neutral-500 focus:outline-none focus:border-accent" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-muted hover:text-ink">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Logging in..." : "Log In"}
            </button>
            <div className="flex justify-between items-center px-1 mt-2">
              <Link to="/forgot-password" className="text-xs text-muted hover:text-ink underline">Forgot Password?</Link>
              <Link to="/admin-login" className="text-xs text-muted hover:text-accent underline">Admin Login</Link>
            </div>
          </form>
        </div>
        <p className="text-center text-muted text-sm mt-4">Don't have an account? <Link to="/signup" className="text-ink underline">Sign up</Link></p>
      </div>

      {showVerify && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md text-center">
            <h2 className="text-xl font-semibold mb-2">Verify Login</h2>
            <p className="text-sm text-muted mb-4">We sent a 6-digit code to <strong className="text-ink">{email}</strong>. Enter it below.</p>
            <input type="text" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} placeholder="123456" maxLength={6}
              className="w-full text-center text-2xl tracking-widest bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent mb-4" />
            <button onClick={handleVerifyLogin} className="btn-primary w-full">Confirm Login</button>
          </div>
        </div>
      )}
    </div>
  );
}