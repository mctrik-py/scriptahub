import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

export default function WriteForMe() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      await api.post("/services/projects/request/", 
        { request_type: "write_for_me", title, description },
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
    <div className="min-h-screen bg-bg p-4">
      <div className="max-w-md mx-auto card">
        <button onClick={() => navigate("/student/dashboard")} className="text-muted mb-4"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-semibold">Write For Me</h1>
        <p className="text-sm text-muted mt-2">Submit your topic and our verified writers will handle everything.</p>
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input 
            type="text" 
            placeholder="Project Title" 
            required
            value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink" 
          />
          <textarea 
            placeholder="Full Project Description & Requirements" 
            rows="4" 
            required
            value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink resize-none" 
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
}