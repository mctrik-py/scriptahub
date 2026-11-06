import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

export default function VerifyEmail() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // We need to send the email along with the code, but since we are not logged in,
      // we can't use the authenticated endpoint. Let's use a public endpoint.
      const email = localStorage.getItem("pending_email");
      if (!email) {
        toast.error("Email not found. Please sign up again.");
        navigate("/signup");
        return;
      }

      const res = await api.post("/auth/verify-email/", { email, code });
      
      localStorage.setItem("access", res.data.tokens.access);
      localStorage.setItem("refresh", res.data.tokens.refresh);
      localStorage.removeItem("pending_email");
      
      toast.success("Email verified! Welcome to ScriptaHub.");
      navigate(res.data.role === "mentor" ? "/mentor/dashboard" : "/student/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="card w-full max-w-md text-center">
        <ShieldCheck size={48} className="text-accent mx-auto mb-4" />
        <h1 className="text-xl font-semibold">Verify Your Email</h1>
        <p className="text-muted text-sm mt-2">
          We sent a 6-digit code to your email. Enter it below to activate your account.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input 
            type="text" 
            required 
            placeholder="123456" 
            value={code} 
            onChange={(e) => setCode(e.target.value)}
            className="w-full text-center text-2xl tracking-widest bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent" 
            maxLength={6}
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>
      </div>
    </div>
  );
}
