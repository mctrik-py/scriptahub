import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/password-reset/", { email });
      toast.success("Reset code sent to your email");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/password-reset/confirm/", { 
        email, 
        code, 
        new_password: newPassword 
      });
      toast.success("Password reset successfully! Please log in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.error || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative">
      <div className="card w-full max-w-md relative">
        <button 
          onClick={() => step === 1 ? navigate("/login") : setStep(1)} 
          className="absolute top-6 left-6 text-muted hover:text-ink"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="text-center mt-4 mb-6">
          <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound size={24} className="text-accent" />
          </div>
          <h1 className="text-xl font-semibold">Reset Password</h1>
          <p className="text-xs text-muted mt-1">
            {step === 1 ? "Enter your email to receive a 6-digit code" : "Enter the code and your new password"}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequest} className="space-y-3">
            <label className="block">
              <span className="text-xs text-muted">Email</span>
              <input 
                type="email" 
                required 
                placeholder="you@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent" 
              />
            </label>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-3">
            <label className="block">
              <span className="text-xs text-muted">6-digit Code</span>
              <input 
                type="text" 
                required 
                maxLength={6}
                placeholder="123456" 
                value={code} 
                onChange={e => setCode(e.target.value)} 
                className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink text-center tracking-widest text-lg focus:outline-none focus:border-accent" 
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted">New Password</span>
              <div className="relative mt-1">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  minLength={8}
                  placeholder="Min 8 characters" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 pr-12 text-ink focus:outline-none focus:border-accent" 
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
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <p className="text-center text-muted text-sm mt-6">
          Remembered it? <Link to="/login" className="text-ink underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}