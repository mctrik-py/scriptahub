import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, LogOut, ChevronDown, ChevronUp, DollarSign, Megaphone, FileText, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
      console.error("Admin fetch error:", err.response?.data);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      toast.error(err.response?.data?.error || "Failed to approve mentor");
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
      toast.error(err.response?.data?.error || "Failed to reject mentor");
    }
  };

  const handleToggleUser = async (id, isActive) => {
    try {
      const token = localStorage.getItem("access");
      await api.post(`/auth/admin/deactivate-user/${id}/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(isActive ? "User deactivated" : "User activated");
      fetchData();
    } catch (err) {
      toast.error("Failed to update user");
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
  const approvedMentors = users.filter(u => u.role === "mentor" && u.is_verified);
  const rejectedMentors = users.filter(u => u.role === "mentor" && u.is_rejected);

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

        {/* Stats */}
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

        {/* 1. Pending Mentors */}
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

        {/* 1b. Approved Mentors */}
        <div className="card">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection("approved")}>
            <div className="font-medium text-sm text-success">Approved Mentors ({approvedMentors.length})</div>
            {openSection === "approved" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {openSection === "approved" && (
            <div className="mt-4 space-y-2">
              {approvedMentors.length === 0 ? <p className="text-xs text-muted">No approved mentors yet.</p> : approvedMentors.map(m => (
                <div key={m.id} className="card-inner flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">{m.username}</div>
                    <div className="text-xs text-muted">{m.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-success flex items-center gap-1"><CheckCircle size={12} /> Verified</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 1c. Rejected Mentors */}
        {rejectedMentors.length > 0 && (
          <div className="card">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection("rejected")}>
              <div className="font-medium text-sm text-danger">Rejected Mentors ({rejectedMentors.length})</div>
              {openSection === "rejected" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            {openSection === "rejected" && (
              <div className="mt-4 space-y-2">
                {rejectedMentors.map(m => (
                  <div key={m.id} className="card-inner flex justify-between items-center opacity-70">
                    <div>
                      <div className="font-medium text-sm">{m.username}</div>
                      <div className="text-xs text-muted">{m.email}</div>
                    </div>
                    <span className="text-xs text-danger font-medium">Rejected</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. Complaints */}
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
                    {c.refund_requested && (
                      <button onClick={() => handleApproveRefund(c.id)} className="text-xs px-2 py-1 bg-warn text-white rounded">Approve Refund</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. All Users */}
        <div className="card">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection("users")}>
            <div className="font-medium text-sm">All Users ({users.length})</div>
            {openSection === "users" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {openSection === "users" && (
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {users.map(u => (
                <div key={u.id} className="card-inner flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">{u.username}</div>
                    <div className="text-xs text-muted capitalize">{u.role}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`chip ${u.is_active ? "border-success text-success" : "border-danger text-danger"}`}>
                      {u.is_active ? "Active" : "Deactivated"}
                    </span>
                    <button 
                      onClick={() => handleToggleUser(u.id, u.is_active)} 
                      className="text-xs px-2 py-1 border border-border rounded hover:bg-surface2"
                    >
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Broadcast */}
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

      {/* Complaint Reply Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md relative">
            <button onClick={() => setSelectedComplaint(null)} className="absolute top-4 right-4 text-muted hover:text-ink">✕</button>
            <h2 className="font-semibold mb-2">Reply to Complaint #{selectedComplaint.id}</h2>
            <p className="text-xs text-muted mb-4">{selectedComplaint.subject}</p>
            <form onSubmit={handleReplyComplaint}>
              <textarea required rows="3" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your response..." className="w-full bg-surface2 border border-border rounded-xl px-4 py-2 text-sm resize-none mb-3" />
              <button type="submit" className="btn-primary w-full py-2 text-sm">Send Reply</button>
            </form>
          </div>
        </div>
      )}

      {/* Mentor Document Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md relative">
            <button onClick={() => setSelectedMentor(null)} className="absolute top-4 right-4 text-muted hover:text-ink">✕</button>
            <h2 className="font-semibold mb-2">Mentor Verification</h2>
            <p className="text-xs text-muted mb-4">{selectedMentor.username}</p>
            <div className="card-inner mb-4 text-center">
              <FileText size={32} className="mx-auto text-muted mb-2" />
              <p className="text-xs text-muted">Document submitted for review</p>
              {selectedMentor.verification_doc ? (
                <a href={selectedMentor.verification_doc} target="_blank" rel="noreferrer" className="text-info text-xs underline mt-2 block">
                  View Uploaded PDF
                </a>
              ) : (
                <p className="text-xs text-muted mt-2">No document uploaded</p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { handleRejectMentor(selectedMentor.id); setSelectedMentor(null); }} className="btn-ghost flex-1 text-danger py-2 text-sm">Reject</button>
              <button onClick={() => { handleApproveMentor(selectedMentor.id); setSelectedMentor(null); }} className="btn-primary flex-1 py-2 text-sm">Approve</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}