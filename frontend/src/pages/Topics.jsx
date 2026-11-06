import { useEffect, useState } from "react";
import { Search, MoreHorizontal, ArrowLeft, X, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

export default function Topics() {
  const [topics, setTopics] = useState([]);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [requestText, setRequestText] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/topics/")
       .then((r) => setTopics(r.data.results || r.data))
       .catch(() => toast.error("Failed to load topics"));
  }, []);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestText.trim()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      await api.post("/projects/topics/request/", 
        { description: requestText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Custom topic requested successfully!");
      setIsModalOpen(false);
      setRequestText("");
    } catch (err) {
      toast.error("Failed to submit request. Are you logged in?");
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredTopics = topics.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(q.toLowerCase());
    const matchesDept = dept === "" || (t.department?.code === dept);
    const matchesDiff = difficulty === "" || (t.difficulty === difficulty);
    return matchesSearch && matchesDept && matchesDiff;
  });

  return (
    <div className="min-h-screen bg-bg pb-24 relative">
      <div className="app-container space-y-4">
        <div className="card">
          <div className="flex items-center justify-between mb-3 relative">
            <button onClick={() => navigate("/student/dashboard")} className="text-muted hover:text-ink">
              <ArrowLeft size={20} />
            </button>
            <h2 className="font-semibold text-lg">Topics</h2>
            <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="text-muted hover:text-ink">
              <MoreHorizontal size={18} />
            </button>

            {showMoreMenu && (
              <div className="absolute top-8 right-0 bg-surface border border-border rounded-xl shadow-xl w-40 z-10 overflow-hidden">
                <button onClick={() => { setQ(""); setDept(""); setDifficulty(""); setShowMoreMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-surface2 text-muted">
                  Clear Filters
                </button>
                <button onClick={() => { navigate("/student/dashboard"); setShowMoreMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-surface2 text-muted">
                  Back to Dashboard
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-3.5 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search topics"
              className="w-full bg-surface2 border border-border rounded-xl pl-9 pr-3 py-3
                         text-ink placeholder:text-neutral-500 focus:outline-none focus:border-accent" />
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <button onClick={() => setDept(dept === "cs" ? "" : "cs")}
              className={`chip flex items-center gap-1 ${dept === "cs" ? "border-info text-info" : "text-muted"}`}>
              <Filter size={10} /> Computer Science
            </button>
            <button onClick={() => setDifficulty(difficulty === "advanced" ? "" : "advanced")}
              className={`chip flex items-center gap-1 ${difficulty === "advanced" ? "border-info text-info" : "text-muted"}`}>
              <Filter size={10} /> Advanced
            </button>
            <button className="chip text-muted">2026</button>
          </div>
        </div>

        {filteredTopics.length === 0 ? (
          <div className="text-center text-muted py-8">No topics found.</div>
        ) : (
          filteredTopics.map((t) => <TopicCard key={t.id} topic={t} />)
        )}

        <button onClick={() => setIsModalOpen(true)} className="btn-primary w-full">
          Request a custom topic
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-muted hover:text-ink">
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold">Request Custom Topic</h2>
            <p className="text-sm text-muted mt-1">Describe what you want to build or research.</p>
            
            <form onSubmit={handleRequestSubmit} className="mt-4 space-y-3">
              <textarea 
                required rows="4" placeholder="e.g., A machine learning model to detect fake news in Nigeria..."
                value={requestText} onChange={(e) => setRequestText(e.target.value)}
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink placeholder:text-neutral-500 focus:outline-none focus:border-accent resize-none" 
              />
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TopicCard({ topic }) {
  const diffColor = {
    beginner: "text-success",
    intermediate: "text-warn",
    advanced: "text-info",
  }[topic.difficulty] || "text-muted";

  return (
    <div className="card">
      <p className="font-medium">{topic.title}</p>
      <p className="text-sm text-muted mt-1 line-clamp-2">{topic.description}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className={`${diffColor} capitalize`}>{topic.difficulty}</span>
        {topic.tech_stack?.map((s) => (
          <span key={s} className="chip text-muted">{s}</span>
        ))}
      </div>
    </div>
  );
}
