import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Upload, FileText, Trash2, ExternalLink, Edit2, Mic } from "lucide-react";
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
  const [currentUser, setCurrentUser] = useState(null);
  const chatEndRef = useRef(null);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem("access");
      const userRes = await api.get("/auth/me/", { headers: { Authorization: `Bearer ${token}` } });
      setCurrentUser(userRes.data.username);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [project]);

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
      toast.success("File sent!");
      setFile(null);
      document.getElementById("mentor-file-input").value = "";
      fetchProject();
    } catch (err) {
      toast.error("Upload failed.");
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

  if (loading) return <div className="min-h-screen bg-bg p-8 text-center text-muted">Loading...</div>;
  if (!project) return <div className="min-h-screen bg-bg p-8 text-center text-muted">Project not found.</div>;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="app-container flex-1 flex flex-col pb-4">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pt-2">
          <button onClick={() => navigate("/mentor/dashboard")} className="text-accent hover:text-white transition">
            <ArrowLeft size={24} />
          </button>
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
            {project.student_name ? project.student_name.charAt(0).toUpperCase() : "S"}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold truncate">{project.student_name || "Student"}</h1>
            <div className="text-xs text-muted flex items-center gap-1">
               <span className="capitalize">{project.status.replace("_", " ")}</span>
            </div>
          </div>
          {/* Status Update Dropdown */}
          <select value={statusUpdate} onChange={(e) => { setStatusUpdate(e.target.value); handleUpdateStatus(e.target.value); }} className="bg-surface2 border border-border rounded-lg px-2 py-1 text-xs text-ink">
            <option value="requested">Requested</option>
            <option value="in_progress">In Progress</option>
            <option value="review">In Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {project.messages.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">No messages yet. Send a message to start!</p>
          ) : (
            project.messages.map((msg) => {
              const isMe = msg.sender_name === currentUser;
              const isFile = msg.message.startsWith("📎 Sent a file:");
              const fileName = isFile ? msg.message.replace("📎 Sent a file:", "").trim() : "";
              const doc = project.documents.find(d => d.original_name === fileName);

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} relative group`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl relative ${
                    isMe 
                      ? "bg-accent text-white rounded-br-sm" 
                      : "bg-surface2 text-ink border border-border rounded-bl-sm"
                  }`}>
                    
                    {editingMsg === msg.id ? (
                      <div className="flex gap-2">
                        <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} className="flex-1 bg-black/20 text-white rounded px-2 py-1 text-sm" />
                        <button onClick={() => handleEditMessage(msg.id)} className="text-xs bg-success px-2 py-1 rounded">Save</button>
                        <button onClick={() => setEditingMsg(null)} className="text-xs bg-white/20 px-2 py-1 rounded">Cancel</button>
                      </div>
                    ) : isFile ? (
                      doc ? (
                        <a href={doc.file} target="_blank" rel="noreferrer" className={`flex items-center gap-2 underline ${isMe ? "text-white" : "text-info"}`}>
                          <FileText size={16} /> {doc.original_name} <ExternalLink size={12} />
                        </a>
                      ) : (
                        <div className="text-sm italic opacity-70">File no longer available</div>
                      )
                    ) : (
                      <div className="text-[15px] leading-snug">{msg.message}</div>
                    )}
                  </div>

                  {/* Timestamp & Read Receipts */}
                  <div className={`text-[10px] text-muted mt-1 flex items-center gap-1 ${isMe ? "pr-1" : "pl-1"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMe && <span className="text-accent">✓✓</span>}
                  </div>

                  {/* Edit/Delete actions */}
                  <div className={`absolute top-0 ${isMe ? "-left-12" : "-right-12"} flex gap-2 opacity-0 group-hover:opacity-100 transition bg-bg p-1 rounded-lg`}>
                    {!isFile && (
                      <button onClick={() => { setEditingMsg(msg.id); setEditText(msg.message); }} className="text-muted hover:text-accent"><Edit2 size={14} /></button>
                    )}
                    <button onClick={() => handleDeleteMessage(msg.id)} className="text-muted hover:text-danger"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area (iMessage style) */}
        <div className="flex gap-2 items-end bg-surface border border-border rounded-2xl p-1.5">
          <input type="file" id="mentor-file-input" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
          <button 
            type="button" 
            onClick={() => document.getElementById("mentor-file-input").click()} 
            className="text-muted hover:text-ink p-2"
          >
            <Upload size={22} />
          </button>
          
          <input 
            type="text" 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            placeholder="Message..." 
            className="flex-1 bg-transparent text-ink py-2 text-[15px] focus:outline-none" 
          />

          {message.trim() || file ? (
            <button onClick={file ? handleUpload : handleSendMessage} className="bg-accent text-white p-2 rounded-full mb-0.5">
              <Send size={16} className="-ml-0.5" />
            </button>
          ) : (
            <button className="text-muted hover:text-ink p-2">
              <Mic size={22} />
            </button>
          )}
        </div>

        {/* Project Documents (below the chat) */}
        <div className="card mt-6">
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