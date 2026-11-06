import { useState, useEffect } from "react";
import { ArrowLeft, Save, LogOut, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [role, setRole] = useState("student");
  const [showEmailVerify, setShowEmailVerify] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("access");
        const res = await api.get("/auth/me/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setForm({ username: res.data.username, email: res.data.email, password: "" });
        setRole(res.data.role);
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("access");
      const res = await api.patch("/auth/me/", form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.email_change_pending) {
        setPendingEmail(res.data.old_email);  // Show OLD email
        setShowEmailVerify(true);
        toast.success("Verification code sent to your current email.");
      } else {
        toast.success("Profile updated successfully!");
        navigate(role === "mentor" ? "/mentor/dashboard" : "/student/dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyEmailChange = async () => {
    try {
      const token = localStorage.getItem("access");
      await api.post("/auth/confirm-email-change/", { code: verifyCode }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Email updated successfully!");
      setShowEmailVerify(false);
      setVerifyCode("");
      navigate(role === "mentor" ? "/mentor/dashboard" : "/student/dashboard");
    } catch (err) {
      toast.error("Invalid verification code.");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      toast.success("Logged out");
      navigate("/login");
    }
  };

  const handleSwitchAccount = () => {
    if (window.confirm("Switch to a different account?")) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      navigate("/login");
    }
  };

  if (loading) return <div className="min-h-screen bg-bg p-8 text-center text-muted">Loading...</div>;

  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="app-container space-y-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <button 
              onClick={() => navigate(role === "mentor" ? "/mentor/dashboard" : "/student/dashboard")} 
              className="text-muted hover:text-ink"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold">Edit Profile</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs text-muted">Username</span>
              <input type="text" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})}
                className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent" />
            </label>
            <label className="block">
              <span className="text-xs text-muted">Email</span>
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent" />
            </label>
            <label className="block">
              <span className="text-xs text-muted">New Password (leave blank to keep current)</span>
              <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})}
                className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent" />
            </label>

            <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
              <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Account Actions */}
        <div className="card space-y-3">
          <div className="text-sm font-medium text-muted mb-2">Account Actions</div>
          <button onClick={handleSwitchAccount} className="w-full text-left px-4 py-3 text-sm bg-surface2 rounded-xl hover:bg-neutral-800 flex items-center gap-2">
            <RefreshCw size={16} /> Switch Account
          </button>
          <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm bg-surface2 rounded-xl hover:bg-neutral-800 text-danger flex items-center gap-2">
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </div>

      {/* Email Verification Modal */}
      {showEmailVerify && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md text-center">
            <h2 className="text-xl font-semibold mb-2">Verify Email Change</h2>
            <p className="text-sm text-muted mb-4">
              We sent a 6-digit code to your <strong className="text-ink">current email ({pendingEmail})</strong>. Enter it below to confirm the change.
            </p>
            <input 
              type="text" 
              value={verifyCode} 
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="w-full text-center text-2xl tracking-widest bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent mb-4" 
            />
            <button onClick={handleVerifyEmailChange} className="btn-primary w-full">Confirm Email Change</button>
          </div>
        </div>
      )}
    </div>
  );
}
