import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, LogOut, ChevronDown, ChevronUp, DollarSign, Megaphone, FileText, Lock, Unlock, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  const [openSection, setOpenSection] = useState(null); 
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("access");
      const headers = { Authorization: `Bearer ${token}` };
      
      const usersRes = await api.get("/auth/admin/users/", { headers });
      setUsers(usersRes.data);

      const compRes = await api.get("/support/admin/complaints/", { headers });
      setComplaints(compRes.data);

      const revRes = await api.get("/auth/admin/revenue/", { headers });
      setRevenue(revRes.data);

      const settingsRes = await api.get("/auth/admin/platform-settings/", { headers });
      setIsLocked(settingsRes.data.is_find_writer_locked);
    } catch (err) {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleLock = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await api.post("/auth/admin/toggle-find-writer/", {}, { headers: { Authorization: `Bearer ${token}` } });
      setIsLocked(res.data.is_find_writer_locked);
      toast.success(res.data.is_find_writer_locked ? "Find a Writer locked" : "Find a Writer unlocked");
    } catch (err) {
      toast.error("Failed to toggle lock");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      navigate("/login");
    }
  };

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleApproveMentor = async (id) => {
    try {
      const token = localStorage.getItem("access");
      await api.post(`/auth/admin/approve-mentor/${id}/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Mentor approved!");
      fetchData();
    } catch (err) {
      toast.error("Failed to approve mentor");
    }
  };

  const handleRejectMentor = async (id) => {
    if (!window.confirm("Are you sure you want to reject this mentor?")) return;
    try {
      const token = localStorage.getItem("access");
      await api.post(`/auth/admin/reject-mentor/${id}/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Mentor rejected and deactivated.");
      fetchData();
    } catch (err) {
      toast.error("Failed to reject mentor");
    }
  };

  const handleReplyComplaint = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      const token = localStorage.getItem("access");
      await api.post(`/support/complaints/${selectedComplaint.id}/messages/`, 
        { body: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Reply sent to student");
      setReplyText("");
      setSelectedComplaint(null);
      fetchData();
    } catch (err) {
      toast.error("Failed to send reply");
    }
  };

  const handleApproveRefund = async (id) => {
    if (!window.confirm("Are you sure you want to approve this refund?")) return;
    try {
      const token = localStorage.getItem("access");
      await api.post(`/support/admin/complaints/${id}/approve-refund/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Refund processed!");
      fetchData();
    } catch (err) {
      toast.error("Failed to process refund");
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("access");
      await api.post("/auth/admin/broadcast/", 
        { title: broadcastTitle, message: broadcastText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Announcement sent to all users!");
      setBroadcastText("");
      setBroadcastTitle("");
    } catch (err) {
      toast.error("Failed to send broadcast");
    }
  };

  if (loading) return <div className="min-h-screen bg-bg p-8 text-center text-muted">Loading Admin...</div>;

  const pendingMentors = users.filter(u => u.role === "mentor" && !u.is_verified && !u.is_rejected);
  const rejectedMentors = users.filter(u => u.role === "mentor" && u.is_rejected);
  const approvedMentors = users.filter(u => u.role === "mentor" && u.is_verified);

  return (
    <div className="min-h-screen bg-bg p-4 pb-24">
      <div className="max-w-md mx-auto space-y-4">
        
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <ShieldCheck className="text-accent" /> Admin Dashboard
          </h1>
          <button onClick={handleLogout} className="text-danger flex items-center gap-1 text-sm">
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Stats (Moved to top) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card border-success">
            <div className="text-xs text-muted flex items-center gap-1"><DollarSign size={12}/> Total Escrow</div>
            <div className="text-lg font-bold mt-1">₦{((revenue?.total_escrow || 0) / 100).toLocaleString()}</div>
          </div>
          <div className="card border-accent">
            <div className="text-xs text-muted flex items-center gap-1"><DollarSign size={12}/> Total Revenue</div>
            <div className="text-lg font-bold mt-1">₦{((revenue?.estimated_revenue || 0) / 100).toLocaleString()}</div>
          </div>
        </div>

        {/* Find Writer Lock Control (Moved below Stats) */}
        <div className="card flex justify-between items-center border-warn">
          <div>
            <div className="font-medium text-sm">Find a Writer Lock</div>
            <div className="text-xs text-muted">Lock or unlock the feature for students</div>
          </div>
          <button onClick={handleToggleLock} className={`p-3 rounded-xl transition ${isLocked ? "bg-danger text-white" : "bg-success text-white"}`}>
            {isLocked ? <Lock size={20} /> : <Unlock size={20} />}
          </button>
        </div>

        {/* Pending Mentors */}
        <div className="card">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection("mentors")}>
            <div className="font-medium text-sm text-warn">Pending Mentor Approvals ({pendingMentors.length})</div>
            {openSection === "mentors" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {openSection === "mentors" && (
            <div className="mt-4 space-y-2">
              {pendingMentors.length === 0 ? <p className="text-xs text-muted">No pending approvals.</p> : pendingMentors.map(m => (
                <div key={m.id} className="card-inner flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">{m.username}</div>
                    <div className="text-xs text-muted">{m.email}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedMentor(m)} className="text-xs px-2 py-1 border border-border rounded">View Doc</button>
                    <button onClick={() => handleApproveMentor(m.id)} className="text-xs px-2 py-1 bg-success text-white rounded">Approve</button>
                    <button onClick={() => handleRejectMentor(m.id)} className="text-xs px-2 py-1 bg-danger text-white rounded">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved Mentors */}
        <div className="card">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection("approved")}>
            <div className="font-medium text-sm text-success">Approved Mentors ({approvedMentors.length})</div>
            {openSection === "approved" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {openSection === "approved" && (
            <div className="mt-4 space-y-2">
              {approvedMentors.map(m => (
                <div key={m.id} className="card-inner flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm flex items-center gap-1">
                      {m.username} <CheckCircle size={14} className="text-success" />
                    </div>
                    <div className="text-xs text-muted">{m.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Complaints */}
        <div className="card">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection("complaints")}>
            <div className="font-medium text-sm text-danger">Active Complaints ({complaints.length})</div>
            {openSection === "complaints" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {openSection === "complaints" && (
            <div className="mt-4 space-y-2">
              {complaints.map(c => (
                <div key={c.id} className="card-inner">
                  <div className="font-medium text-sm">{c.subject}</div>
                  <div className="text-xs text-muted mt-1">{c.body}</div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setSelectedComplaint(c)} className="text-xs px-2 py-1 bg-accent text-white rounded">Reply</button>
                    {c.refund_requested && <button onClick={() => handleApproveRefund(c.id)} className="text-xs px-2 py-1 bg-warn text-white rounded">Approve Refund</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Broadcast */}
        <div className="card">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection("broadcast")}>
            <div className="font-medium text-sm flex items-center gap-2"><Megaphone size={16}/> Send Announcement</div>
            {openSection === "broadcast" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {openSection === "broadcast" && (
            <form onSubmit={handleBroadcast} className="mt-4 space-y-2">
              <input required placeholder="Title" value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} className="w-full bg-surface2 border border-border rounded-xl px-4 py-2 text-sm" />
              <textarea required rows="2" placeholder="Message to all users..." value={broadcastText} onChange={e => setBroadcastText(e.target.value)} className="w-full bg-surface2 border border-border rounded-xl px-4 py-2 text-sm resize-none" />
              <button type="submit" className="btn-primary w-full py-2 text-sm">Send Broadcast</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}