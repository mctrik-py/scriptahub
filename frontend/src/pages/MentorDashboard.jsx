import { useState, useEffect } from "react";
import { Bell, Home, Wallet, User, CheckCircle, ArrowRight, Sun, Moon, LogOut, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

export default function MentorDashboard() {
  const navigate = useNavigate();
  const [engagements, setEngagements] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Mentor");
  const [greeting, setGreeting] = useState("Good morning");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [showMenu, setShowMenu] = useState(false);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false); 

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("access");
      const userRes = await api.get("/auth/me/", { headers: { Authorization: `Bearer ${token}` } });
      setUserName(userRes.data.username || "Mentor");

      const engRes = await api.get("/services/mentor/engagements/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEngagements(engRes.data);

      const unassignedRes = await api.get("/services/mentor/unassigned/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnassigned(unassignedRes.data);
    } catch (err) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    fetchData();

    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const handleAccept = async (id) => {
    try {
      const token = localStorage.getItem("access");
      await api.post(`/services/mentor/accept/${id}/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Project accepted!");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to accept project");
    }
  };

  const handleReject = async (id) => {
    try {
      const token = localStorage.getItem("access");
      await api.post(`/services/mentor/reject/${id}/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Project rejected");
      fetchData(); 
    } catch (err) {
      toast.error("Failed to reject project");
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

  const activeJobs = engagements.filter(e => e.status !== "completed");
  const pastJobs = engagements.filter(e => e.status === "completed");

  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="app-container space-y-4">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <span className="text-muted text-sm">{greeting}, <span className="font-semibold text-ink">{userName}</span></span>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="text-muted hover:text-ink transition">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => navigate("/notifications")} className="text-muted hover:text-ink transition">
              <Bell size={18} />
            </button>
            
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="text-muted hover:text-ink transition">
                <User size={18} />
              </button>
              {showMenu && (
                <div className="absolute top-8 right-0 bg-surface border border-border rounded-xl shadow-xl w-48 overflow-hidden z-10">
                  <button onClick={handleSwitchAccount} className="w-full text-left px-4 py-3 text-sm hover:bg-surface2 flex items-center gap-2">
                    <RefreshCw size={16} /> Switch Account
                  </button>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-danger hover:bg-surface2 flex items-center gap-2">
                    <LogOut size={16} /> Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <h1 className="text-xl font-semibold">Mentor Dashboard</h1>

        {/* Job Requests Dropdown */}
        {unassigned.length > 0 && (
          <div className="card border-accent">
            <div 
              onClick={() => setIsRequestsOpen(!isRequestsOpen)}
              className="flex justify-between items-center cursor-pointer"
            >
              <div className="text-sm font-medium text-accent">
                New Job Requests ({unassigned.length})
              </div>
              {isRequestsOpen ? <ChevronUp size={18} className="text-accent" /> : <ChevronDown size={18} className="text-accent" />}
            </div>
            
            {isRequestsOpen && (
              <div className="mt-4 space-y-3">
                {unassigned.map(job => (
                  <div key={job.id} className="card-inner">
                    <div className="font-medium text-sm">{job.title}</div>
                    <p className="text-xs text-muted mt-1 mb-3">{job.description || "No description provided."}</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleAccept(job.id)} className="btn-primary flex-1 py-1 text-sm">Accept</button>
                      <button onClick={() => handleReject(job.id)} className="btn-ghost flex-1 py-1 text-sm border-danger text-danger hover:bg-danger/10">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center text-muted py-4">Loading...</div>
        ) : (
          <>
            <div className="mt-6 space-y-3">
              <div className="text-sm font-medium text-muted">Active Projects ({activeJobs.length})</div>
              {activeJobs.length === 0 ? <p className="text-xs text-muted">No active jobs.</p> : activeJobs.map((eng) => (
                <div key={eng.id} onClick={() => navigate(`/mentor/project/${eng.id}`)} className="card cursor-pointer hover:opacity-80 transition flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{eng.title}</div>
                    <div className="text-xs text-muted mt-1 capitalize">{eng.status.replace("_", " ")}</div>
                  </div>
                  <ArrowRight size={16} className="text-muted" />
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <div className="text-sm font-medium text-muted">Past Jobs ({pastJobs.length})</div>
              {pastJobs.length === 0 ? <p className="text-xs text-muted">No past jobs yet.</p> : pastJobs.map((eng) => (
                <div key={eng.id} className="card flex items-center justify-between opacity-70">
                  <div>
                    <div className="font-medium text-sm">{eng.title}</div>
                    <div className="text-xs text-muted mt-1">Completed</div>
                  </div>
                  <CheckCircle size={16} className="text-success" />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-surface border-t border-border">
        <div className="max-w-md mx-auto flex justify-around py-3">
          <button onClick={() => navigate("/mentor/dashboard")} className="p-2 rounded-xl text-ink"><Home size={20} /></button>
          <button onClick={() => navigate("/wallet")} className="p-2 rounded-xl text-muted hover:text-ink transition"><Wallet size={20} /></button>
          <button onClick={() => navigate("/profile")} className="p-2 rounded-xl text-muted hover:text-ink transition"><User size={20} /></button>
        </div>
      </nav>
    </div>
  );
}
