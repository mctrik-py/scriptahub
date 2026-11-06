import { useState, useEffect } from "react";
import { ArrowLeft, Send, Users, Upload, FileText, ExternalLink } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

export default function GroupChat() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("return") || "/groups";
  
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchGroup = async () => {
    try {
      const token = localStorage.getItem("access");
      const groupRes = await api.get(`/services/groups/${id}/detail/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroup(groupRes.data);

      const msgRes = await api.get(`/services/groups/${id}/chat/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(msgRes.data.messages || []);
    } catch (err) {
      toast.error("Failed to load group");
      navigate(returnTo);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      const token = localStorage.getItem("access");
      await api.post(`/services/groups/${id}/chat/`, { message }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage("");
      fetchGroup();
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const token = localStorage.getItem("access");
      await api.post(`/services/groups/${id}/chat/`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      toast.success("File sent!");
      setFile(null);
      document.getElementById("group-file-input").value = "";
      fetchGroup();
    } catch (err) {
      toast.error("Upload failed");
    }
  };

  if (loading) return <div className="min-h-screen bg-bg p-8 text-center text-muted">Loading...</div>;
  if (!group) return null;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="max-w-md mx-auto w-full p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(returnTo)} className="text-muted hover:text-ink">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold truncate">{group.name}</h1>
          <span className="text-xs text-muted ml-auto flex items-center gap-1">
            <Users size={14} /> {group.members.length}
          </span>
        </div>

        <div className="card mb-3">
          <div className="text-xs text-muted">Members: {group.members.map(m => m.username).join(", ")}</div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-3">
          {messages.length === 0 ? (
            <p className="text-xs text-muted text-center py-8">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg) => {
              const isFile = msg.message.startsWith("📎 Sent a file:");
              if (isFile) {
                const parts = msg.message.replace("📎 Sent a file:", "").trim().split("|");
                const fileName = parts[0];
                const fileUrl = parts[1] || "#";
                return (
                  <div key={msg.id} className="bg-surface2 p-2 rounded-lg">
                    <div className="text-xs font-semibold text-accent">{msg.sender}</div>
                    <a href={fileUrl} target="_blank" rel="noreferrer" className="text-info hover:underline flex items-center gap-2 mt-1">
                      <FileText size={16} /> {fileName} <ExternalLink size={12} />
                    </a>
                  </div>
                );
              }
              return (
                <div key={msg.id} className="bg-surface2 p-2 rounded-lg">
                  <div className="text-xs font-semibold text-accent">{msg.sender}</div>
                  <div className="text-sm">{msg.message}</div>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <input type="file" id="group-file-input" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
            <button 
              type="button" 
              onClick={() => document.getElementById("group-file-input").click()} 
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
              <button onClick={handleFileUpload} type="button" className="bg-success text-white p-2 rounded-xl">
                <Send size={18} />
              </button>
            ) : (
              <button onClick={handleSend} type="button" className="bg-accent text-white p-2 rounded-xl">
                <Send size={18} />
              </button>
            )}
          </div>
          {file && <p className="text-xs text-muted">Selected: {file.name}</p>}
        </div>
      </div>
    </div>
  );
}
