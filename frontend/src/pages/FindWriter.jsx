import { useEffect, useState } from "react";
import { ArrowLeft, Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getPublicSettings } from "../services/api";

export default function FindWriter() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [service, setService] = useState("Chapter Writing");
  const [loading, setLoading] = useState(false);

  const [checking, setChecking] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [lockedMessage, setLockedMessage] = useState(
    "Find a Writer is coming soon. We'll notify you when it's live."
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getPublicSettings();
        if (cancelled) return;
        setEnabled(Boolean(data.find_writer_enabled));
        if (data.find_writer_message) setLockedMessage(data.find_writer_message);
      } catch {
        if (!cancelled) setEnabled(true);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLockedTap = () => {
    toast(lockedMessage, { icon: "🔒" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!enabled) {
      handleLockedTap();
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      await api.post(
        "/services/projects/request/",
        {
          request_type: "find_writer",
          title: topic,
          description: `Looking for a mentor for ${service}`,
        },
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

  const isLocked = !checking && !enabled;

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="max-w-md mx-auto card relative overflow-hidden">
        <button
          onClick={() => navigate("/student/dashboard")}
          className="text-muted mb-4"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-xl font-semibold flex items-center gap-2">
          Find a Writer
          {isLocked && (
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-accent/15 text-accent px-2 py-0.5 rounded-full border border-accent/30 flex items-center gap-1">
              <Sparkles size={10} /> Coming Soon
            </span>
          )}
        </h1>
        <p className="text-sm text-muted mt-2">
          We will match you with a verified mentor based on your department and needs.
        </p>

        <div className="relative mt-6">
          <form
            onSubmit={handleSubmit}
            className={`space-y-3 transition-all duration-300 ${
              isLocked ? "blur-[3px] pointer-events-none select-none" : ""
            }`}
            aria-hidden={isLocked}
          >
            <input
              type="text"
              placeholder="Your Topic"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink"
            />
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink"
            >
              <option>Chapter Writing</option>
              <option>Data Analysis</option>
              <option>Implementation</option>
            </select>
            <button
              type="submit"
              disabled={loading || isLocked}
              className="btn-primary w-full"
            >
              {loading ? "Submitting..." : "Find Match"}
            </button>
          </form>

          {isLocked && (
            <button
              type="button"
              onClick={handleLockedTap}
              className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-3
                         bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20
                         shadow-[0_8px_30px_rgba(0,0,0,0.12)] cursor-not-allowed"
              aria-label="Find a Writer is coming soon"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center
                              bg-accent/20 border border-accent/40 text-accent">
                <Lock size={22} />
              </div>
              <div className="text-center px-6">
                <div className="text-sm font-semibold text-ink">Coming Soon</div>
                <div className="text-xs text-muted mt-1 max-w-[260px]">
                  {lockedMessage}
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}