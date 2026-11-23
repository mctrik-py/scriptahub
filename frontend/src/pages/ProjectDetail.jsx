import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Upload, FileText, Trash2, ExternalLink, Edit2, Sparkles, Users, Mic, RotateCcw, Play, Pause, CheckCircle, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

// Custom Audio Player Component
const AudioPlayer = ({ src, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration || 1;
    setProgress((current / duration) * 100);
  };

  return (
    <div className={`flex items-center gap-3 py-1 min-w-[180px] ${isMe ? "text-white" : "text-ink"}`}>
      <audio ref={audioRef} src={src} onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} className="hidden" />
      <button onClick={togglePlay} className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isMe ? "bg-white text-accent" : "bg-accent text-white"}`}>
        {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>
      <div className="flex-1 flex items-center gap-0.5 h-6 relative">
        {[...Array(20)].map((_, i) => (
          <div key={i} className={`w-1 rounded-full ${isMe ? "bg-white/40" : "bg-accent/40"}`} style={{ height: `${Math.random() * 16 + 4}px` }} />
        ))}
        <div className={`absolute top-0 left-0 h-full pointer-events-none ${isMe ? "bg-white/80" : "bg-accent/80"} mix-blend-overlay`} style={{ width: `${progress}%` }} />
      </div>
      <span className="text-[10px] opacity-70 w-8 text-right font-mono">{audioRef.current ? Math.floor(audioRef.current.duration || 0) : 0}s</span>
    </div>
  );
};

export default function ProjectDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editText, setEditText] = useState("");
  const [groupList, setGroupList] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  
  const [showProfile, setShowProfile] = useState(false);
  
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
    } catch (err) {}
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  useEffect(() => {
    if (project) fetchGroups();
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [project]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const audioFile = new File([blob], `voice_note.webm`, { type: "audio/webm" });
        setFile(audioFile);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      toast.error("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

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
      toast.success("Sent!");
      setFile(null);
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

  const getStatusColor = (status) => {
    switch(status) {
      case "completed": return "border-green-500 text-green-500 bg-green-500/10";
      case "in_progress": return "border-orange-500 text-orange-500 bg-orange-500/10";
      case "review": return "border-blue-500 text-blue-500 bg-blue-500/10";
      case "cancelled": return "border-red-500 text-red-500 bg-red-500/10";
      default: return "border-gray-500 text-gray-400 bg-gray-500/10";
    }
  };

  const formatLastSeen = (dateString) => {
    if (!dateString) return "Offline";
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffSec < 60) return "Online";
    if (diffMin < 60) return `Last seen ${diffMin}m ago`;
    if (diffHrs < 24) return `Last seen ${diffHrs}h ago`;
    if (diffDays < 7) return `Last seen ${diffDays}d ago`;
    return `Last seen ${past.toLocaleDateString('en-GB')}`;
  };

  if (loading) return <div className="min-h-screen bg-bg p-8 text-center text-muted">Loading...</div>;
  if (!project) return <div className="min-h-screen bg-bg p-8 text-center text-muted">Project not found.</div>;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="app-container flex-1 flex flex-col pb-4">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pt-2">
          <button onClick={() => navigate("/my-projects")} className="text-accent hover:text-white transition">
            <ArrowLeft size={24} />
          </button>
          
          <div onClick={() => setShowProfile(true)} className="flex items-center gap-3 cursor-pointer flex-1">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
              {project.mentor_name ? project.mentor_name.charAt(0).toUpperCase() : "M"}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h1 className="text-lg font-semibold truncate">{project.mentor_name || "Unassigned"}</h1>
                {project.mentor_name && project.mentor_name !== "Unassigned" && (
                  <CheckCircle size={16} className="text-blue-500 shrink-0" fill="currentColor" />
                )}
              </div>
              <div className="text-xs text-muted flex items-center gap-1">
                {formatLastSeen(project.mentor_last_active)} • <span className={`chip border ${getStatusColor(project.status)}`}>{project.status.replace("_", " ")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {project.messages.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">No messages yet. Send a message to start!</p>
          ) : (
            project.messages.map((msg) => {
              const isMe = msg.sender_name === currentUser;
              const isVoice = msg.message.startsWith("🎤 Voice note:");
              const isFile = msg.message.startsWith("📎 Sent a file:") || isVoice;
              const fileName = isFile ? msg.message.split(":")[1].trim() : "";
              const doc = project.documents.find(d => d.original_name === fileName);
              const isImage = fileName.match(/\.(jpeg|jpg|gif|png)$/) != null;

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} relative group`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl relative ${
                    isMe ? "bg-accent text-white rounded-br-sm" : "bg-surface2 text-ink border border-border rounded-bl-sm"
                  }`}>
                    {editingMsg === msg.id ? (
                      <div className="flex gap-2">
                        <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} className="flex-1 bg-black/20 text-white rounded px-2 py-1 text-sm" />
                        <button onClick={() => handleEditMessage(msg.id)} className="text-xs bg-green-600 px-2 py-1 rounded">Save</button>
                        <button onClick={() => setEditingMsg(null)} className="text-xs bg-white/20 px-2 py-1 rounded">Cancel</button>
                      </div>
                    ) : isImage && doc ? (
                      <img src={doc.file} alt="sent" className="max-w-full rounded-lg mt-1" />
                    ) : isVoice && doc ? (
                      <AudioPlayer src={doc.file} isMe={isMe} />
                    ) : isFile && doc ? (
                      <a href={doc.file} target="_blank" rel="noreferrer" className={`flex items-center gap-2 underline ${isMe ? "text-white" : "text-blue-400"}`}>
                        <FileText size={16} /> {doc.original_name} <ExternalLink size={12} />
                      </a>
                    ) : (
                      <div className="text-[15px] leading-snug">{msg.message}</div>
                    )}
                  </div>

                  <div className={`text-[10px] text-muted mt-1 flex items-center gap-1 ${isMe ? "pr-1" : "pl-1"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMe && <span className="text-accent">✓✓</span>}
                  </div>

                  <div className={`absolute top-0 ${isMe ? "-left-12" : "-right-12"} flex gap-2 opacity-0 group-hover:opacity-100 transition bg-bg p-1 rounded-lg`}>
                    {!isFile && <button onClick={() => { setEditingMsg(msg.id); setEditText(msg.message); }} className="text-muted hover:text-accent"><Edit2 size={14} /></button>}
                    <button onClick={() => handleDeleteMessage(msg.id)} className="text-muted hover:text-danger"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex gap-2 items-end bg-surface border border-border rounded-2xl p-1.5">
          <input type="file" id="student-file-input" onChange={(e) => setFile(e.target.files[0])} className="hidden" accept="image/*,application/pdf,.doc,.docx" />
          <button onClick={() => document.getElementById("student-file-input").click()} className="text-muted hover:text-ink p-2">
            <Upload size={22} />
          </button>
          
          {file ? (
            <div className="flex-1 flex items-center justify-between text-sm text-ink py-2 bg-surface2 px-3 rounded-lg border border-border">
              <span className="truncate max-w-[150px] text-accent font-medium">
                {file.name.endsWith(".webm") ? "Voice note ready" : file.name}
              </span>
              <button onClick={() => setFile(null)} className="text-red-400 text-xs px-2 hover:underline">Cancel</button>
            </div>
          ) : (
            <input 
              type="text" value={message} onChange={(e) => setMessage(e.target.value)} 
              placeholder={isRecording ? "Recording audio..." : "Message..."} disabled={isRecording}
              className="flex-1 bg-transparent text-ink py-2 text-[15px] focus:outline-none" 
            />
          )}

          {file ? (
            <button onClick={handleUpload} className="bg-accent text-white p-2 rounded-full mb-0.5"><Send size={16} className="-ml-0.5" /></button>
          ) : message.trim() ? (
            <button onClick={handleSendMessage} className="bg-accent text-white p-2 rounded-full mb-0.5"><Send size={16} className="-ml-0.5" /></button>
          ) : (
            <button onClick={isRecording ? stopRecording : startRecording} className={`p-2 rounded-full mb-0.5 transition ${isRecording ? "bg-red-500 text-white animate-pulse" : "text-muted hover:text-ink"}`}>
              {isRecording ? <div className="w-4 h-4 bg-white rounded-sm" /> : <Mic size={22} />}
            </button>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md relative">
            <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 text-muted hover:text-ink">
              <X size={20} />
            </button>
            <div className="flex flex-col items-center mb-6 mt-4">
              <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-3xl mb-3">
                {project.mentor_name ? project.mentor_name.charAt(0).toUpperCase() : "M"}
              </div>
              <h2 className="text-xl font-bold flex items-center gap-1">
                {project.mentor_name || "Unassigned"}
                {project.mentor_name && project.mentor_name !== "Unassigned" && (
                  <CheckCircle size={18} className="text-blue-500" fill="currentColor" />
                )}
              </h2>
              <p className="text-xs text-muted mt-1">Verified Mentor</p>
            </div>

            <div className="text-sm font-medium text-muted mb-3 border-t border-border pt-4">Project Documents</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {project.documents.length === 0 ? <p className="text-xs text-muted">No documents uploaded yet.</p> : project.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-2 text-sm">
                  <a href={doc.file} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate flex-1 flex items-center gap-2">
                    <FileText size={16} className="text-muted shrink-0" /> {doc.original_name || "Download File"}
                  </a>
                </div>
              ))}
            </div>

            <button 
              onClick={() => navigate(`/groups?engagement=${id}&mentor=${project.mentor_id || ""}&return=/project/${id}`)}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm mt-6"
            >
              <Users size={16} /> Create Group with Mentor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}