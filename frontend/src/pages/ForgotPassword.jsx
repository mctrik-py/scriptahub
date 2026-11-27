import { useState } from "react";
import { ArrowLeft, KeyRound, CheckCircle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Send request
      await api.post("/auth/password-reset/", { email });
      
      // If we get here, it worked
      toast.success("Reset code sent to your email.");
      setStep(2); // Move to step 2
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to send reset code.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/password-reset/confirm/", { 
        email, 
        code, 
        new_password: newPassword 
      });
      toast.success("Password reset successful! Please log in.");
      navigate("/login");
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Invalid code or failed to reset password.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative">
      <div className="card w-full max-w-md relative">
        <button onClick={() => navigate("/login")} className="absolute top-6 left-6 text-muted hover:text-ink">
          <ArrowLeft size={20} />
        </button>
        
        <div className="text-center mt-4">
          {step === 1 ? (
            <>
              <KeyRound size={40} className="text-accent mx-auto mb-4" />
              <h1 className="text-2xl font-semibold">Reset Password</h1>
              <p className="text-muted text-sm mt-1">Enter your email to receive a reset code.</p>
            </>
          ) : (
            <>
              <CheckCircle size={40} className="text-success mx-auto mb-4" />
              <h1 className="text-2xl font-semibold">Enter Reset Code</h1>
              <p className="text-muted text-sm mt-1">We sent a 6-digit code to <strong className="text-ink">{email}</strong></p>
            </>
          )}
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequestCode} className="mt-6 space-y-3">
            <label className="block">
              <span className="text-xs text-muted">Email</span>
              <input 
                type="email" 
                required 
                placeholder="you@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent" 
              />
            </label>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="mt-6 space-y-3">
            <label className="block">
              <span className="text-xs text-muted">6-Digit Code</span>
              <input 
                type="text" 
                required 
                placeholder="123456" 
                maxLength={6} 
                value={code} 
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink text-center tracking-widest text-xl focus:outline-none focus:border-accent" 
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted">New Password</span>
              <input 
                type="password" 
                required 
                placeholder="Min 8 characters" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent" 
              />
            </label>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Resetting..." : "Set New Password"}
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