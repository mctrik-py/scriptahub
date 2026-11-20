
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  GraduationCap,
  UserCog,
  ArrowLeft,
  Eye,
  EyeOff
} from "lucide-react";
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

  const redirectUser = (userRole) => {
    if (userRole === "admin") {
      navigate("/admin/dashboard");
    } else if (userRole === "mentor") {
      navigate("/mentor/dashboard");
    } else {
      navigate("/student/dashboard");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const loginEmail = email.trim().toLowerCase();

      console.log("LOGIN DIAGNOSTICS:", {
        email: loginEmail,
        passwordLength: password.length,
        role,
        browser: navigator.userAgent
      });

      const res = await api.post("/auth/login/", {
        email: loginEmail,
        password: password,
        role: role
      });

      console.log("LOGIN RESPONSE:", res.data);

      if (res.data.verification_required) {
        setShowVerify(true);
        toast.success("Verification code sent to your email.");
        return;
      }

      if (!res.data.access || !res.data.refresh) {
        toast.error("Unexpected response from server.");
        return;
      }

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      toast.success("Welcome back!");

      redirectUser(res.data.role || role);

    } catch (err) {
      console.error("LOGIN STATUS:", err.response?.status);
      console.error("LOGIN ERROR:", err.response?.data || err.message);

      const detail = err.response?.data?.detail;

      toast.error(
        typeof detail === "string"
          ? detail
          : "Invalid email or password."
      );

    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLogin = async () => {
    if (!verifyCode.trim()) {
      toast.error("Enter your verification code.");
      return;
    }

    try {
      const res = await api.post("/auth/confirm-login/", {
        email: email.trim().toLowerCase(),
        code: verifyCode.trim()
      });

      if (!res.data.tokens?.access || !res.data.tokens?.refresh) {
        toast.error("Invalid verification response.");
        return;
      }

      localStorage.setItem("access", res.data.tokens.access);
      localStorage.setItem("refresh", res.data.tokens.refresh);

      toast.success("Login successful!");
      redirectUser(res.data.role || role);

    } catch (err) {
      console.error("VERIFY ERROR:", err.response?.data || err.message);

      toast.error(
        err.response?.data?.error || "Invalid verification code."
      );
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative">

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-4">

        <div className="card relative">

          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="absolute top-6 left-6 text-muted hover:text-ink"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="text-center mt-4">
            <h1 className="text-2xl font-semibold">
              Login ScriptaHub
            </h1>

            <p className="text-accent font-medium text-sm mt-1 italic">
              "Where Solutions Meet Thesis"
            </p>

            <p className="text-muted text-sm mt-1">
              Choose how you'll use it
            </p>
          </div>

          <div className="mt-5 space-y-3">

            <button
              type="button"
              onClick={() => setRole("student")}
              className={`w-full text-left flex gap-3 items-center p-4 rounded-2xl border-2 transition ${
                role === "student"
                  ? "border-accent bg-surface2"
                  : "border-border hover:border-accent/50"
              }`}
            >
              <div className="w-10 h-10 grid place-items-center rounded-xl bg-black/40 border border-border">
                <GraduationCap
                  size={22}
                  className={role === "student" ? "text-accent" : "text-ink"}
                />
              </div>

              <div>
                <div className="font-medium">I'm a student</div>
                <div className="text-muted text-sm">
                  Get guidance on your project
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole("mentor")}
              className={`w-full text-left flex gap-3 items-center p-4 rounded-2xl border-2 transition ${
                role === "mentor"
                  ? "border-accent bg-surface2"
                  : "border-border hover:border-accent/50"
              }`}
            >
              <div className="w-10 h-10 grid place-items-center rounded-xl bg-black/40 border border-border">
                <UserCog
                  size={22}
                  className={role === "mentor" ? "text-accent" : "text-ink"}
                />
              </div>

              <div>
                <div className="font-medium">I'm a mentor</div>
                <div className="text-muted text-sm">
                  Verified writers and developers
                </div>
              </div>
            </button>

          </div>

          <form
            onSubmit={handleSubmit}
            autoComplete="on"
            noValidate
            className="mt-6 space-y-3"
          >

            <label className="block">
              <span className="text-xs text-muted">Email</span>

              <input
                type="email"
                required
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="email"
                placeholder="you@example.com"
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
                  name="password"
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 pr-12 text-ink placeholder:text-neutral-500 focus:outline-none focus:border-accent"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-muted hover:text-ink"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>

            <div className="flex justify-between items-center px-1 mt-2">
              <Link
                to="/forgot-password"
                className="text-xs text-muted hover:text-ink underline"
              >
                Forgot Password?
              </Link>

              <Link
                to="/admin-login"
                className="text-xs text-muted hover:text-accent underline"
              >
                Admin Login
              </Link>
            </div>

          </form>
        </div>

        <p className="text-center text-muted text-sm mt-4">
          Don't have an account?{" "}
          <Link to="/signup" className="text-ink underline">
            Sign up
          </Link>
        </p>

      </div>

      {showVerify && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md text-center">

            <h2 className="text-xl font-semibold mb-2">
              Verify Login
            </h2>

            <p className="text-sm text-muted mb-4">
              We sent a verification code to{" "}
              <strong className="text-ink">{email}</strong>.
            </p>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="w-full text-center text-2xl tracking-widest bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent mb-4"
            />

            <button
              onClick={handleVerifyLogin}
              className="btn-primary w-full"
            >
              Confirm Login
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
