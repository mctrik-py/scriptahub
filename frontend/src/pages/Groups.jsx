import { useState, useEffect } from "react";
import { ArrowLeft, Search, Plus, Users, Trash2, Settings } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

export default function Groups() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const returnTo = searchParams.get("return") || "/student/dashboard";
  const engagementId = searchParams.get("engagement");
  const mentorId = searchParams.get("mentor");
  
  const [query, setQuery] = useState(initialQuery);
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(!!engagementId);
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchMyGroups = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await api.get("/services/groups/my-groups/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyGroups(res.data);
    } catch (err) {}
  };

  const handleSearch = async (searchQuery = query) => {
    try {
      const token = localStorage.getItem("access");
      const res = await api.get(`/services/groups/search/?q=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setGroups(data);
      setSearched(true);
    } catch (err) {
      toast.error("Search failed");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      const payload = { 
        name: newGroup.name,
        description: newGroup.description,
        engagement_id: engagementId || null,
        mentor_id: mentorId || null,
      };
      const res = await api.post("/services/groups/create/", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.mentor_added ? "Group created with mentor!" : "Group created!");
      setShowCreate(false);
      setNewGroup({ name: "", description: "" });
      if (engagementId) {
        navigate(returnTo);
      } else {
        fetchMyGroups();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (groupId) => {
    try {
      const token = localStorage.getItem("access");
      await api.post(`/services/groups/${groupId}/join/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Join request sent!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to join");
    }
  };

  const handleDelete = async (groupId) => {
    if (!window.confirm("Delete this group permanently?")) return;
    try {
      const token = localStorage.getItem("access");
      await api.delete(`/services/groups/${groupId}/delete/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Group deleted");
      fetchMyGroups();
      handleSearch();
    } catch (err) {
      toast.error("Failed to delete group");
    }
  };

  useEffect(() => {
    fetchMyGroups();
    handleSearch(initialQuery);
  }, []);

  return (
    <div className="min-h-screen bg-bg p-4 pb-24">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(returnTo)} className="text-muted hover:text-ink">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold">Groups</h1>
          <button onClick={() => setShowCreate(!showCreate)} className="text-accent">
            <Plus size={20} />
          </button>
        </div>

        {showCreate && (
          <div className="card">
            <h3 className="font-semibold mb-3">
              {engagementId ? "Create Group with Mentor" : "Create New Group"}
            </h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input 
                type="text" required placeholder="Group Name (e.g., Team Alpha)"
                value={newGroup.name} onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:border-accent" 
              />
              <textarea 
                rows="2" placeholder="Description (optional)"
                value={newGroup.description} onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm text-ink resize-none focus:outline-none focus:border-accent" 
              />
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Creating..." : "Create Group"}
              </button>
            </form>
          </div>
        )}

        <div className="card">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3.5 text-muted" />
            <input 
              type="text" placeholder="Search public groups..."
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-surface2 border border-border rounded-xl pl-9 pr-3 py-3 text-sm text-ink focus:outline-none focus:border-accent" 
            />
          </div>
          <button onClick={() => handleSearch()} className="btn-primary w-full mt-2 text-sm py-2">Search</button>
        </div>

        {myGroups.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-medium text-muted mb-2">My Groups ({myGroups.length})</h3>
            {myGroups.map((g) => (
              <div key={g.id} className="card-inner flex justify-between items-center mb-2">
                <div onClick={() => navigate(`/group/${g.id}?return=${encodeURIComponent(returnTo)}`)} className="cursor-pointer flex-1">
                  <div className="font-medium text-sm">{g.name}</div>
                  <div className="text-xs text-muted">{g.role} | {g.members_count} members</div>
                </div>
                {g.role === "admin" && (
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/groups/manage/${g.id}`)} className="text-accent">
                      <Settings size={16} />
                    </button>
                    <button onClick={() => handleDelete(g.id)} className="text-danger">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="card">
          <h3 className="text-sm font-medium text-muted mb-2">
            {searched ? `Search Results (${groups.length})` : "Public Groups"}
          </h3>
          {groups.length === 0 && searched ? (
            <div className="text-center py-6">
              <p className="text-xs text-muted">No groups found for "{query}"</p>
              <p className="text-xs text-muted mt-1">Try a different name or create a new group.</p>
            </div>
          ) : groups.length === 0 ? (
            <p className="text-xs text-muted">No groups available. Be the first to create one!</p>
          ) : (
            groups.map((g) => (
              <div key={g.id} className="card-inner mb-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{g.name}</div>
                    <div className="text-xs text-muted">{g.description}</div>
                    <div className="text-xs text-muted mt-1">
                      Admin: {g.admin_name} | {g.members_count} members
                    </div>
                  </div>
                  <button onClick={() => handleJoin(g.id)} className="btn-primary px-3 py-1 text-xs">Join</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
