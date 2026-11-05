import { useState, useEffect } from "react";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

export default function MyProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("access");
        const res = await api.get("/services/engagements/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProjects(res.data);
      } catch (err) {
        toast.error("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/student/dashboard")} className="text-muted hover:text-ink">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold">My Projects</h1>
        </div>

        {loading ? (
          <div className="text-center text-muted">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="card text-center py-12">
            <FolderOpen size={48} className="text-muted mx-auto mb-4" />
            <p className="text-muted">You have no active projects yet.</p>
          </div>
        ) : (
          projects.map((proj) => (
            <div 
              key={proj.id} 
              onClick={() => navigate(`/project/${proj.id}`)}
              className="card cursor-pointer hover:opacity-80 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{proj.title}</h3>
                  <p className="text-xs text-muted mt-1">Mentor: {proj.mentor_name}</p>
                </div>
                <span className="chip border-info text-info capitalize">{proj.status.replace("_", " ")}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}