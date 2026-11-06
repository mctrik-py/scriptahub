import { useEffect, useState } from "react";
import { ArrowLeft, MessageSquare, Upload, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

export default function Complaint() {
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // New complaint state
  const [isCreating, setIsCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [newFile, setNewFile] = useState(null);

  // Reply state
  const [reply, setReply] = useState("");
  const [replyFile, setReplyFile] = useState(null);

  // Toggle state for the active complaint
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);

  const fetchComplaint = async () => {
    try {
      const res = await api.get("/support/complaints/");
      if (res.data.length > 0) {
        setComplaint(res.data[0]);
      } else {
        setComplaint(null);
      }
    } catch (err) {
      toast.error("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("subject", subject);
    formData.append("body", body);
    if (newFile) formData.append("attachment", newFile);

    try {
      await api.post("/support/complaints/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Complaint logged successfully");
      setIsCreating(false);
      setSubject(""); setBody(""); setNewFile(null);
      fetchComplaint();
    } catch (err) {
      toast.error("Failed to log complaint");
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() && !replyFile) return;

    const formData = new FormData();
    formData.append("body", reply);
    if (replyFile) formData.append("attachment", replyFile);

    try {
      await api.post(`/support/complaints/${complaint.id}/messages/`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Reply sent");
      setReply("");
      setReplyFile(null);
      fetchComplaint();
    } catch (err) {
      toast.error("Failed to send reply");
    }
  };

  const handleRefund = async () => {
    if (window.confirm("Are you sure you want to request a refund for this project?")) {
      try {
        await api.post(`/support/complaints/${complaint.id}/refund/`);
        toast.success("Refund requested. Admin will review.");
        fetchComplaint();
      } catch (err) {
        toast.error("Failed to request refund");
      }
    }
  };

  if (loading) return <div className="min-h-screen bg-bg p-8 text-center text-muted">Loading...</div>;

  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="app-container space-y-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate("/student/dashboard")} className="text-muted hover:text-ink">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold">Support & Complaints</h2>
          <div className="w-5"></div>
        </div>

        {isCreating ? (
          <div className="card">
            <h3 className="font-semibold mb-3">Log New Complaint</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input 
                type="text" required placeholder="Subject (e.g., Mentor not responding)"
                value={subject} onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:border-accent" 
              />
              <textarea 
                rows="3" required placeholder="Explain the issue in detail..."
                value={body} onChange={(e) => setBody(e.target.value)}
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm text-ink resize-none focus:outline-none focus:border-accent" 
              />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-muted cursor-pointer bg-surface2 border border-border rounded-xl px-3 py-2 hover:bg-neutral-800">
                  <Upload size={14} /> Upload Screenshot
                  <input type="file" onChange={(e) => setNewFile(e.target.files[0])} className="hidden" />
                </label>
                {newFile && <span className="text-xs text-success truncate max-w-[150px]">{newFile.name}</span>}
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsCreating(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Submit</button>
              </div>
            </form>
          </div>
        ) : (
          <button onClick={() => setIsCreating(true)} className="card w-full flex items-center justify-center gap-2 py-4 border-dashed border-2 hover:bg-surface2 transition">
            <Plus size={18} className="text-accent" />
            <span className="font-medium text-sm">Log a New Complaint</span>
          </button>
        )}

        {complaint ? (
          <div className="card">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setIsComplaintOpen(!isComplaintOpen)}
            >
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Ticket #{complaint.id}</h2>
                <span className={`chip ${complaint.status === "open" ? "border-success text-success" : "text-muted"}`}>
                  {complaint.status.replace("_", " ")}
                </span>
              </div>
              {isComplaintOpen ? <ChevronUp size={20} className="text-muted" /> : <ChevronDown size={20} className="text-muted" />}
            </div>

            {isComplaintOpen && (
              <div className="mt-4 space-y-4">
                <div className="card-inner">
                  <div className="text-xs text-muted">Subject</div>
                  <div className="mt-1 text-sm font-medium">{complaint.subject}</div>
                  {complaint.attachment && (
                    <a href={complaint.attachment} target="_blank" rel="noreferrer" className="text-xs text-info mt-2 block hover:underline">View Attached File</a>
                  )}
                </div>

                <div className="space-y-3">
                  {complaint.messages.map((msg) => (
                    <div key={msg.id} className={`card-inner ${msg.is_admin ? "border-l-2 border-l-info" : ""}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-ink">{msg.author_name}</span>
                        <span className="text-xs text-muted">{new Date(msg.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-muted">{msg.body}</p>
                      {msg.attachment && (
                        <a href={msg.attachment} target="_blank" rel="noreferrer" className="text-xs text-info mt-2 block hover:underline">View Attachment</a>
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleReply} className="pt-4 border-t border-border space-y-3">
                  <textarea 
                    rows="2" placeholder="Type your reply..."
                    value={reply} onChange={(e) => setReply(e.target.value)}
                    className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm text-ink resize-none focus:outline-none focus:border-accent" 
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-muted cursor-pointer bg-surface2 border border-border rounded-xl px-3 py-2 hover:bg-neutral-800">
                      <Upload size={14} /> Attach File
                      <input type="file" onChange={(e) => setReplyFile(e.target.files[0])} className="hidden" />
                    </label>
                    {replyFile && <span className="text-xs text-success truncate max-w-[150px]">{replyFile.name}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                      <MessageSquare size={16} /> Reply
                    </button>
                    <button type="button" onClick={handleRefund} className="btn-ghost flex-1">Request refund</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : !isCreating && (
          <div className="text-center py-8">
            <p className="text-muted text-sm">No active complaints.</p>
          </div>
        )}
      </div>
    </div>
  );
}
