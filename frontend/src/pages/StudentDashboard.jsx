import { useState, useEffect } from "react";
import { Bell, Home, Sparkles, Wallet, User, Lightbulb, ListTree, FileSearch, LogOut, RefreshCw, AlertCircle, X, Sun, Moon, PenTool, Users, BarChart, Code2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiResults, setAiResults] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);
  
  const [department, setDepartment] = useState("Computer Science");
  const [discipline, setDiscipline] = useState("Software Engineering");
  const [interests, setInterests] = useState("");
  const [outlineTopic, setOutlineTopic] = useState("");
  const [aiMode, setAiMode] = useState("topics"); 
  
  const [userName, setUserName] = useState("Student");
  const [greeting, setGreeting] = useState("Good morning");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [notifCount, setNotifCount] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access");
        const userRes = await api.get("/auth/me/", { headers: { Authorization: `Bearer ${token}` } });
        setUserName(userRes.data.username || "Student");

        const notifRes = await api.get("/auth/notifications/", { headers: { Authorization: `Bearer ${token}` } });
        const unread = notifRes.data.filter(n => !n.is_read).length;
        setNotifCount(unread);
      } catch (err) {}
    };
    fetchData();

    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  const handleGenerate = async (mode = aiMode) => {
    setLoadingAi(true);
    setAiResults([]);
    try {
      const token = localStorage.getItem("access");
      let res;
      
      if (mode === "topics") {
        res = await api.post("/tools/ai/topics/", 
          { department, discipline, interests },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAiResults(res.data.topics);
      } else {
        res = await api.post("/tools/ai/outline/", 
          { topic: outlineTopic || "General Project" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAiResults(res.data.outline);
      }
      toast.success(`Generated successfully!`);
    } catch (err) {
      toast.error("Failed to generate");
    } finally {
      setLoadingAi(false);
    }
  };

  const openAiModal = (mode) => {
    setAiMode(mode);
    setShowAiModal(true);
    if (mode === "topics") handleGenerate("topics");
    else setAiResults([]);
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/groups?q=${searchQuery}`);
    } else {
      navigate("/groups");
    }
  };

  return (
    <div className="min-h-screen bg-bg pb-24 relative">
      <div className="app-container space-y-4">
        
        <div className="card relative">
          
          <div className="flex items-center justify-between">
            <span className="text-muted text-sm">{greeting}, <span className="font-semibold text-ink">{userName}</span></span>
            <div className="flex items-center gap-4">
              <button onClick={toggleTheme} className="text-muted hover:text-ink transition">
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              <button onClick={() => navigate("/notifications")} className="relative text-muted hover:text-ink transition">
                <Bell size={18} />
                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {notifCount}
                  </span>
                )}
              </button>
              
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="text-muted hover:text-ink transition"><User size={18} /></button>
                {showMenu && (
                  <div className="absolute top-8 right-0 bg-surface border border-border rounded-xl shadow-xl w-48 overflow-hidden z-10">
                    <button onClick={handleSwitchAccount} className="w-full text-left px-4 py-3 text-sm hover:bg-surface2 flex items-center gap-2"><RefreshCw size={16} /> Switch Account</button>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-danger hover:bg-surface2 flex items-center gap-2"><LogOut size={16} /> Log Out</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <h1 className="text-xl font-semibold mt-3">Your project</h1>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button onClick={() => navigate("/find-writer")} className="card-inner flex flex-col items-center justify-center gap-3 py-6 hover:opacity-80 transition border-accent">
              <Users size={28} className="text-accent" />
              <span className="font-semibold text-sm">Find a Writer</span>
            </button>
            <button onClick={() => navigate("/write-for-me")} className="card-inner flex flex-col items-center justify-center gap-3 py-6 hover:opacity-80 transition border-info">
              <PenTool size={28} className="text-info" />
              <span className="font-semibold text-sm">Write For Me</span>
            </button>
          </div>

          <div className="mt-5 text-sm text-muted">Services</div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div onClick={() => navigate("/analysis")} className="card-inner cursor-pointer hover:opacity-80 transition flex items-center gap-3">
              <BarChart size={20} className="text-success" />
              <div className="text-sm font-medium">Data Analysis</div>
            </div>
            <div onClick={() => navigate("/implementation")} className="card-inner cursor-pointer hover:opacity-80 transition flex items-center gap-3">
              <Code2 size={20} className="text-warn" />
              <div className="text-sm font-medium">Implementation</div>
            </div>
          </div>

          <div className="mt-5 text-sm text-muted">Quick tools</div>
          <div className="mt-2 grid grid-cols-3 gap-3">
            <ToolButton icon={<Lightbulb size={18} />} label="Topics" onClick={() => openAiModal("topics")} />
            <ToolButton icon={<ListTree size={18} />} label="Outline" onClick={() => openAiModal("outline")} />
            <ToolButton icon={<FileSearch size={18} />} label="Check" onClick={() => navigate("/plagiarism")} />
          </div>
        </div>

        <div onClick={() => navigate("/my-projects")} className="card cursor-pointer hover:opacity-80 transition flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">My Projects</div>
            <div className="text-xs text-muted mt-1">View your active and past jobs</div>
          </div>
          <AlertCircle size={20} className="text-accent" />
        </div>

        <div onClick={() => navigate("/complaint")} className="card cursor-pointer hover:opacity-80 transition flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Support & Complaints</div>
            <div className="text-xs text-muted mt-1">View your active tickets</div>
          </div>
          <AlertCircle size={20} className="text-warn" />
        </div>
      </div>
      
      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md relative max-h-[80vh] overflow-y-auto">
            <button onClick={() => setShowAiModal(false)} className="absolute top-4 right-4 text-muted hover:text-ink">
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles size={20} className="text-accent" /> AI {aiMode === "topics" ? "Topic Generator" : "Outline Generator"}
            </h2>
            
            <div className="mt-4 space-y-3">
              {aiMode === "topics" ? (
                <>
                  <input type="text" placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink placeholder:text-neutral-500 focus:outline-none focus:border-accent" />
                  <input type="text" placeholder="Discipline" value={discipline} onChange={(e) => setDiscipline(e.target.value)} className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink placeholder:text-neutral-500 focus:outline-none focus:border-accent" />
                  <input type="text" placeholder="Specific interests" value={interests} onChange={(e) => setInterests(e.target.value)} className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink placeholder:text-neutral-500 focus:outline-none focus:border-accent" />
                  <button onClick={() => handleGenerate("topics")} disabled={loadingAi} className="btn-primary w-full flex items-center justify-center gap-2">
                    {loadingAi ? "Generating..." : <><Sparkles size={16} /> Regenerate</>}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted">Enter a topic to generate a Chapter 1-5 outline.</p>
                  <input type="text" placeholder="e.g., IoT Smart Classroom Monitor" value={outlineTopic} onChange={(e) => setOutlineTopic(e.target.value)} className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink placeholder:text-neutral-500 focus:outline-none focus:border-accent" />
                  <button onClick={() => handleGenerate("outline")} disabled={loadingAi} className="btn-primary w-full flex items-center justify-center gap-2">
                    {loadingAi ? "Generating..." : <><Sparkles size={16} /> Generate Outline</>}
                  </button>
                </>
              )}
            </div>

            {loadingAi && aiResults.length === 0 && (
              <div className="mt-6 text-center text-sm text-muted animate-pulse">Asking AI for ideas...</div>
            )}

            {aiResults.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="text-sm font-medium text-muted">Results</div>
                {aiResults.map((item, i) => (
                  <details key={i} className="card-inner text-sm cursor-pointer">
                    <summary className="font-medium text-ink list-none flex justify-between items-center">
                      {item.split(":")[0]}
                      <span className="text-xs text-muted">▼</span>
                    </summary>
                    <p className="text-muted mt-2 text-xs leading-relaxed">
                      {item.split(":")[1] || "This chapter covers the foundational elements, literature, and methodology required for your project."}
                    </p>
                  </details>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Bottom Nav with Integrated Search */}
      <nav className="fixed bottom-0 inset-x-0 bg-surface border-t border-border">
        <div className="max-w-md mx-auto">
          {/* Expanding Search Input */}
          <div className={`transition-all duration-300 overflow-hidden ${showSearchInput ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}`}>
            <form onSubmit={handleSearchSubmit} className="flex gap-2 p-3 border-b border-border">
              <input 
                type="text" 
                placeholder="Search groups..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-surface2 border border-border rounded-xl px-3 py-2 text-sm text-ink placeholder:text-neutral-500 focus:outline-none focus:border-accent" 
                autoFocus
              />
              <button type="submit" className="btn-primary px-3 py-2 text-sm">
                <Search size={14} />
              </button>
            </form>
          </div>

          {/* Nav Icons */}
          <div className="flex justify-around py-3">
            <button onClick={() => navigate("/student/dashboard")} className="p-2 rounded-xl text-ink"><Home size={20} /></button>
            <button onClick={() => navigate("/ai-chat")} className="p-2 rounded-xl text-muted hover:text-ink transition"><Sparkles size={20} /></button>
            <button onClick={() => navigate("/wallet")} className="p-2 rounded-xl text-muted hover:text-ink transition"><Wallet size={20} /></button>
            <button onClick={() => setShowSearchInput(!showSearchInput)} className="p-2 rounded-xl text-muted hover:text-ink transition">
              <Search size={20} />
            </button>
            <button onClick={() => navigate("/profile")} className="p-2 rounded-xl text-muted hover:text-ink transition"><User size={20} /></button>
          </div>
        </div>
      </nav>
    </div>
  );
}

function ToolButton({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="card-inner flex flex-col items-center gap-2 py-4 hover:opacity-80 transition">
      <span className="text-ink">{icon}</span>
      <span className="text-xs text-muted">{label}</span>
    </button>
  );
}
