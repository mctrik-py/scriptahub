import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

export default function FindWriter() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [service, setService] = useState("Chapter Writing");
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-bg p-4">
      <div className="max-w-md mx-auto card">
        <button onClick={() => navigate("/student/dashboard")} className="text-muted mb-4"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-semibold">Find a Writer</h1>
        <p className="text-sm text-muted mt-2">We will match you with a verified mentor based on your department and needs.</p>
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input 
            type="text" 
            placeholder="Your Topic" 
            required
            value={topic} onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink" 
          />
          <select 
            value={service} onChange={(e) => setService(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink"
          >
            <option>Chapter Writing</option>
            <option>Data Analysis</option>
            <option>Implementation</option>
          </select>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Submitting..." : "Find Match"}
          </button>
        </form>
      </div>
    </div>
  );
}
