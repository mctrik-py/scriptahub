import { useEffect, useState } from "react";
import { ArrowLeft, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("student");

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const token = localStorage.getItem("access");
        const userRes = await api.get("/auth/me/", { headers: { Authorization: `Bearer ${token}` } });
        setRole(userRes.data.role);

        const res = await api.get("/auth/notifications/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="max-w-md mx-auto card">
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => navigate(role === "mentor" ? "/mentor/dashboard" : "/student/dashboard")} 
            className="text-muted hover:text-ink"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold">Notifications</h1>
        </div>

        {loading ? (
          <p className="text-muted text-center">Loading...</p>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={48} className="text-muted mx-auto mb-4" />
            <p className="text-muted">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className={`card-inner ${!n.is_read ? "border-l-2 border-l-accent" : ""}`}>
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-sm">{n.title}</h3>
                  <span className="text-xs text-muted">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-muted mt-1">{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
