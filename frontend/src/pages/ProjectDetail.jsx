import { useState, useEffect } from "react";
import { ArrowLeft, Send, Upload, FileText, Trash2, ExternalLink, Edit2, Sparkles, UserCheck, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

export default function ProjectDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editText, setEditText] = useState("");
  const [matches, setMatches] = useState(null);
  const [groupList, setGroupList] = useState([]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await api.get(`/services/engagements/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(res.data);
    } catch (err) {
      toast.error("Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await api.get(`/services/groups/by-project/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroupList(res.data);
    } catch (err) {
      console.error("Group fetch error:", err);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  useEffect(() => {
    if (project) fetchGroups();
  }, [project]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      const token = localStorage.getItem("access");
      await api.post(`/services/engagements/${id}/chat/`, 
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
      toast.success("File sent to mentor!");
      setFile(null);
      document.getElementById("student-file-input").value = "";
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

  const handleAIMatch = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await api.post(`/services/match/${id}/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.matched_mentors && res.data.matched_mentors.length > 0) {
        setMatches(res.data.matched_mentors);
        toast.success(`Found ${res.data.matched_mentors.length} top matches!`);
      } else {
        toast.success("No public mentors available. Using ScriptaHub mentors.");
        await api.post(`/services/student/assign-company/${id}/`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchProject();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Matching failed. Please try again.");
    }
  };

  const handleSelectMentor = async (mentorId) => {
    if (!window.confirm("Do you want to assign this mentor to your project?")) return;
    try {
      const token = localStorage.getItem("access");
      await api.post(`/services/student/assign-mentor/${id}/`, { mentor_id: mentorId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Mentor assigned successfully!");
      fetchProject();
      setMatches(null);
    } catch (err) {
      toast.error("Failed to assign mentor.");
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
          <button onClick={() => navigate("/my-projects")} className="text-muted hover:text-ink"><ArrowLeft size={20} /></button>
          <h1 className="text-xl font-semibold truncate">{project.title}</h1>
        </div>

        {/* Mentor & Status */}
        <div className="card">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium flex items-center gap-2">
                Mentor: {project.mentor_name}
                {project.mentor_last_active ? (
                  (() => {
                    const lastActive = new Date(project.mentor_last_active);
                    const diffMins = Math.floor((new Date() - lastActive) / 60000);
                    if (diffMins < 5) return <span className="text-xs text-success flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success"></span> Online</span>;
                    else if (diffMins < 60) return <span className="text-xs text-muted">Last seen {diffMins}m ago</span>;
                    else if (diffMins < 1440) return <span className="text-xs text-muted">Last seen {Math.floor(diffMins / 60)}h ago</span>;
                    else return <span className="text-xs text-muted">Last seen {Math.floor(diffMins / 1440)} days ago</span>;
                  })()
                ) : <span className="text-xs text-muted">Offline</span>}
              </div>
              <div className="text-xs text-muted mt-1 flex items-center gap-2">
                Status: 
                <span className={`chip capitalize ${getStatusColor(project.status)}`}>
                  {project.status.replace("_", " ")}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted">Total Escrow</div>
              <div className="text-sm font-semibold">₦{(project.total_kobo / 100).toLocaleString()}</div>
            </div>
          </div>

          {(!project.mentor_name || project.mentor_name === "Unassigned") && (
            <div className="mt-4">
              <button onClick={handleAIMatch} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                <Sparkles size={16} /> Find Best Mentor
              </button>
              {matches && matches.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-muted">Top Matches:</p>
                  {matches.map((m) => (
                    <div key={m.id} className="card-inner">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm flex items-center gap-2">
                            {m.name} <UserCheck size={14} className="text-success" />
                          </div>
                          <div className="text-xs text-muted mt-1">{m.specialization || "General"}</div>
                          {m.tools && <div className="text-xs text-muted">Tools: {m.tools}</div>}
                          {m.bio && <div className="text-xs text-muted mt-1 line-clamp-2">{m.bio}</div>}
                        </div>
                        <button onClick={() => handleSelectMentor(m.id)} className="btn-primary px-3 py-1 text-xs">Select</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Milestones */}
        <div className="card">
          <div className="text-sm font-medium text-muted mb-3">Project Progress</div>
          <div className="space-y-2">
            {project.milestones.map((m) => (
              <div key={m.id} className="card-inner flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{m.title}</div>
                  <div className="text-xs text-muted">Due: {m.due_date || "N/A"}</div>
                </div>
                <span className={`chip capitalize ${m.status === "released" ? "border-success text-success" : m.status === "submitted" ? "border-warn text-warn" : "border-border text-muted"}`}>{m.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chat with File Upload */}
        <div className="card">
          <div className="text-sm font-medium text-muted mb-3">Chat with Mentor</div>
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
          
          {/* Chat Input with Upload beside Send */}
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <input 
                type="file" 
                id="student-file-input" 
                onChange={(e) => setFile(e.target.files[0])} 
                className="hidden" 
              />
              <button 
                type="button" 
                onClick={() => document.getElementById("student-file-input").click()} 
                className="bg-surface2 border border-border p-2 rounded-xl hover:bg-neutral-800"
              >
                <Upload size={18} />
              </button>
              <input 
                type="text" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="Type a message..." 
                className="flex-1 bg-surface2 border border-border rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent" 
              />
              {file ? (
                <button onClick={handleUpload} type="button" className="bg-success text-white p-2 rounded-xl">
                  <Send size={18} />
                </button>
              ) : (
                <button onClick={handleSendMessage} type="button" className="bg-accent text-white p-2 rounded-xl">
                  <Send size={18} />
                </button>
              )}
            </div>
            {file && <p className="text-xs text-muted">Selected: {file.name}</p>}
          </div>
        </div>

        {/* Groups Under Chat with Mentor */}
        <div className="card">
          <div className="text-sm font-medium text-muted mb-3 flex items-center gap-2">
            <Users size={16} /> Group Project
          </div>
          
          {groupList.length > 0 ? (
            <div className="space-y-2 mb-3">
              {groupList.map((g) => (
                <div key={g.id} onClick={() => navigate(`/group/${g.id}?return=${encodeURIComponent(`/project/${id}`)}`)} className="card-inner cursor-pointer hover:bg-surface2 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">{g.name}</div>
                    <div className="text-xs text-muted">{g.members_count} members</div>
                  </div>
                  <span className="text-xs text-muted">→</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted mb-3">No groups yet for this project.</p>
          )}
          
          <button 
            onClick={() => navigate(`/groups?engagement=${id}&mentor=${project.mentor_id || ""}&return=/project/${id}`)}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
          >
            <Users size={16} /> Create Group with Mentor
          </button>
        </div>

        {/* Documents List */}
        <div className="card">
          <div className="text-sm font-medium text-muted mb-3">Project Documents</div>
          <div className="space-y-2">
            {project.documents.length === 0 ? <p className="text-xs text-muted">No documents uploaded.</p> : project.documents.map((doc) => (
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