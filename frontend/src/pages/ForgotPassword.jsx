import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/password-reset/", { email });
      toast.success("If this email exists, a reset link has been sent.");
      navigate("/login");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative">
      <div className="card w-full max-w-md relative">
        <button onClick={() => navigate("/login")} className="absolute top-6 left-6 text-muted hover:text-ink">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center mt-4">
          <h1 className="text-2xl font-semibold">Reset Password</h1>
          <p className="text-muted text-sm mt-1">Enter your email to receive a reset link.</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input 
            type="email" 
            required 
            placeholder="you@example.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent" 
          />
          <button type="submit" className="btn-primary w-full">Send Reset Link</button>
        </form>
        <p className="text-center text-muted text-sm mt-4">
          Remembered it? <Link to="/login" className="text-ink underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}