import { useState, useEffect } from "react";
import { ArrowLeft, Send, Upload, FileText, Trash2, ExternalLink, Edit2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

export default function MentorProjectDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [editingMsg, setEditingMsg] = useState(null);
  const [editText, setEditText] = useState("");

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await api.get(`/services/engagements/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(res.data);
      setStatusUpdate(res.data.status);
    } catch (err) {
      toast.error("Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      const token = localStorage.getItem("access");
      await api.post(`/services/engagements/${id}/chat/`, { message }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("");
      fetchProject();
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a file first");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("access");
      await api.post(`/services/engagements/${id}/upload/`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      toast.success("File sent to student!");
      setFile(null);
      document.getElementById("mentor-file-input").value = "";
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.error || "Upload failed.");
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      const token = localStorage.getItem("access");
      await api.delete(`/services/chat/${msgId}/`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Message deleted");
      fetchProject();
    } catch (err) {
      toast.error("Failed to delete message");
    }
  };

  const handleEditMessage = async (msgId) => {
    if (!editText.trim()) return;
    try {
      const token = localStorage.getItem("access");
      await api.put(`/services/chat/${msgId}/`, { message: editText }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Message updated");
      setEditingMsg(null);
      setEditText("");
      fetchProject();
    } catch (err) {
      toast.error("Failed to edit message");
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const token = localStorage.getItem("access");
      await api.post(`/services/mentor/update-status/${id}/`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Project status updated!");
      fetchProject();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "completed": return "border-success text-success";
      case "in_progress": return "border-warn text-warn";
      case "review": return "border-info text-info";
      default: return "border-border text-muted";
    }
  };

  if (loading) return <div className="min-h-screen bg-bg p-8 text-center text-muted">Loading...</div>;
  if (!project) return <div className="min-h-screen bg-bg p-8 text-center text-muted">Project not found.</div>;

  return (
    <div className="min-h-screen bg-bg p-4 pb-24">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/mentor/dashboard")} className="text-muted hover:text-ink"><ArrowLeft size={20} /></button>
          <h1 className="text-xl font-semibold truncate">{project.title}</h1>
        </div>

        {/* Project Info */}
        <div className="card">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium">{project.student_name || "Student"}'s Project</div>
              <div className="text-xs text-muted mt-1 flex items-center gap-2">
                Status: 
                <span className={`chip capitalize ${getStatusColor(project.status)}`}>
                  {project.status.replace("_", " ")}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted">Escrow Value</div>
              <div className="text-sm font-semibold">₦{(project.total_kobo / 100).toLocaleString()}</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs font-medium text-muted mb-2">Update Project Progress</div>
            <div className="flex gap-2">
              <select value={statusUpdate} onChange={(e) => setStatusUpdate(e.target.value)} className="flex-1 bg-surface2 border border-border rounded-xl px-3 py-2 text-sm text-ink">
                <option value="requested">Requested</option>
                <option value="in_progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="completed">Completed</option>
              </select>
              <button onClick={() => handleUpdateStatus(statusUpdate)} className="btn-primary px-4 py-2 text-sm">Save</button>
            </div>
          </div>
        </div>

        {/* Chat with File Upload */}
        <div className="card">
          <div className="text-sm font-medium text-muted mb-3">Chat with {project.student_name || "Student"}</div>
          <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
            {project.messages.length === 0 ? <p className="text-xs text-muted text-center">No messages yet.</p> : project.messages.map((msg) => {
              const isFile = msg.message.startsWith("📎 Sent a file:");
              const fileName = isFile ? msg.message.replace("📎 Sent a file:", "").trim() : "";
              const doc = project.documents.find(d => d.original_name === fileName);
              
              return (
                <div key={msg.id} className="bg-surface2 p-2 rounded-lg relative group">
                  <div className="text-xs font-semibold text-accent">{msg.sender_name}</div>
                  
                  {editingMsg === msg.id ? (
                    <div className="flex gap-2 mt-1">
                      <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} className="flex-1 bg-surface border border-border rounded-lg px-2 py-1 text-sm text-ink" />
                      <button onClick={() => handleEditMessage(msg.id)} className="text-xs bg-success text-white px-2 py-1 rounded">Save</button>
                      <button onClick={() => setEditingMsg(null)} className="text-xs bg-surface2 border border-border px-2 py-1 rounded">Cancel</button>
                    </div>
                  ) : isFile ? (
                    doc ? (
                      <a href={doc.file} target="_blank" rel="noreferrer" className="text-info hover:underline flex items-center gap-2 mt-1">
                        <FileText size={16} /> {doc.original_name} <ExternalLink size={12} />
                      </a>
                    ) : (
                      <div className="text-xs text-muted mt-1 italic">File no longer available</div>
                    )
                  ) : (
                    <div className="text-sm">{msg.message}</div>
                  )}

                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    {!isFile && (
                      <button onClick={() => { setEditingMsg(msg.id); setEditText(msg.message); }} className="text-muted hover:text-accent"><Edit2 size={14} /></button>
                    )}
                    <button onClick={() => handleDeleteMessage(msg.id)} className="text-muted hover:text-danger"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <form onSubmit={handleSendMessage} className="flex gap-2 mb-2">
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-surface2 border border-border rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent" />
            <button type="submit" className="bg-accent text-white p-2 rounded-xl"><Send size={18} /></button>
          </form>

          <div className="flex gap-2 items-center bg-surface border border-border rounded-xl p-1">
            <input type="file" id="mentor-file-input" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
            <button type="button" onClick={() => document.getElementById("mentor-file-input").click()} className="flex-1 text-xs text-muted bg-surface2 py-2 px-3 rounded-lg hover:bg-neutral-800 text-left truncate">
              {file ? file.name : "Choose a file to upload"}
            </button>
            <button onClick={handleUpload} disabled={!file} className={`p-2 rounded-xl ${!file ? "bg-surface2 text-muted" : "bg-accent text-white"}`}>
              <Upload size={16} />
            </button>
          </div>
        </div>

        {/* Documents List */}
        <div className="card">
          <div className="text-sm font-medium text-muted mb-3">Project Documents</div>
          <div className="space-y-2">
            {project.documents.length === 0 ? <p className="text-xs text-muted">No documents uploaded yet.</p> : project.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-2 text-sm">
                <a href={doc.file} target="_blank" rel="noreferrer" className="text-info hover:underline truncate flex-1 flex items-center gap-2">
                  <FileText size={16} className="text-muted shrink-0" /> {doc.original_name || "Download File"}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}