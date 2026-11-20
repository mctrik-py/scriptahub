import { useState, useEffect } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

export default function FindWriter() {
  const navigate = useNavigate();
  const [isLocked, setIsLocked] = useState(false);
  const [topic, setTopic] = useState("");
  const [service, setService] = useState("Chapter Writing");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkLock = async () => {
      try {
        // Correct URL with /admin/ prefix
        const res = await api.get("/auth/admin/platform-settings/");
        setIsLocked(res.data.is_find_writer_locked);
      } catch (err) {
        console.error("Failed to check lock status", err);
      }
    };
    checkLock();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      await api.post("/services/projects/request/", 
        { request_type: "find_writer", title: topic, description: `Looking for a mentor for ${service}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Request submitted! Check your notifications for approval.");
      navigate("/student/dashboard");
    } catch (err) {
      toast.error("Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg p-4 relative">
      <div className="max-w-md mx-auto card">
        <button onClick={() => navigate("/student/dashboard")} className="text-muted mb-4"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-semibold">Find a Writer</h1>
        
        <div className="bg-warn/10 border border-warn/30 rounded-xl p-3 mt-4 mb-6">
          <p className="text-xs text-warn font-medium">⚠️ Strict Mentorship Policy</p>
          <p className="text-xs text-muted mt-1">
            We only match students with verified mentors under strict conditions. We provide guidance and support only; we do not take over or write your full project. Academic integrity applies.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input 
            type="text" placeholder="Your Topic" required
            value={topic} onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink" 
          />
          <select value={service} onChange={(e) => setService(e.target.value)} className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink">
            <option>Chapter Writing</option>
            <option>Data Analysis</option>
            <option>Implementation</option>
          </select>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Submitting..." : "Request Mentor"}
          </button>
        </form>
      </div>

      {/* Glassmorphic Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/40">
          <div className="bg-surface/80 border border-white/20 rounded-3xl p-8 text-center max-w-xs shadow-2xl">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Coming Soon</h2>
            <p className="text-sm text-white/70">
              "Find a Writer" is temporarily closed. Please use our verified Company Professionals for "Write For Me" projects.
            </p>
            <button onClick={() => navigate("/student/dashboard")} className="mt-6 w-full bg-white text-black font-semibold py-2 rounded-xl">
              Go Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}