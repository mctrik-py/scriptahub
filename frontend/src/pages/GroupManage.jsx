import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

export default function GroupManage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchGroup = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await api.get(`/services/groups/${id}/manage/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroup(res.data);
    } catch (err) {
      toast.error("Failed to load group");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [id]);

  const handleApprove = async (memberId) => {
    try {
      const token = localStorage.getItem("access");
      await api.post(`/services/groups/${id}/approve/${memberId}/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Member approved!");
      fetchGroup();
    } catch (err) {
      toast.error("Failed to approve");
    }
  };

  const handleReject = async (memberId) => {
    try {
      const token = localStorage.getItem("access");
      await api.post(`/services/groups/${id}/reject/${memberId}/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Member rejected");
      fetchGroup();
    } catch (err) {
      toast.error("Failed to reject");
    }
  };

  if (loading) return <div className="min-h-screen bg-bg p-8 text-center text-muted">Loading...</div>;
  if (!group) return <div className="min-h-screen bg-bg p-8 text-center text-muted">Group not found.</div>;

  return (
    <div className="min-h-screen bg-bg p-4 pb-24">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/groups")} className="text-muted hover:text-ink"><ArrowLeft size={20} /></button>
          <h1 className="text-xl font-semibold truncate">{group.name}</h1>
        </div>

        <div className="card">
          <div className="text-sm text-muted">{group.description}</div>
        </div>

        {/* Pending Requests */}
        <div className="card">
          <h3 className="text-sm font-medium text-warn mb-2">Pending Requests ({group.pending_requests.length})</h3>
          {group.pending_requests.length === 0 ? (
            <p className="text-xs text-muted">No pending requests.</p>
          ) : (
            group.pending_requests.map((req) => (
              <div key={req.id} className="card-inner flex justify-between items-center mb-2">
                <div className="font-medium text-sm">{req.student}</div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(req.id)} className="text-success"><CheckCircle size={18} /></button>
                  <button onClick={() => handleReject(req.id)} className="text-danger"><XCircle size={18} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Current Members */}
        <div className="card">
          <h3 className="text-sm font-medium text-muted mb-2">Members ({group.members.length})</h3>
          {group.members.map((m) => (
            <div key={m.id} className="card-inner flex justify-between items-center mb-2">
              <div className="font-medium text-sm">{m.username}</div>
              {m.is_admin && <span className="text-xs text-accent">Admin</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}