import { useState, useEffect } from "react";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

export default function AiChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Load Chat History on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("access");
        const res = await api.get("/tools/ai/chat/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(res.data.messages);
      } catch (err) {
        toast.error("Failed to load chat history");
      } finally {
        setFetching(false);
      }
    };
    fetchHistory();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("access");
      const res = await api.post("/tools/ai/chat/", 
        { message: userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) => [...prev, { role: "ai", text: res.data.reply }]);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Unknown error occurred";
      setMessages((prev) => [...prev, { role: "ai", text: `ERROR: ${errorMsg}` }]);
      toast.error("AI failed to respond");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="min-h-screen bg-bg p-8 text-center text-muted">Loading chat...</div>;

  return (
    <div className="min-h-screen bg-bg pb-24 flex flex-col">
      <div className="max-w-md mx-auto w-full p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/student/dashboard")} className="text-muted hover:text-ink">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles size={20} className="text-accent" /> AI Assistant
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user" ? "bg-accent text-white" : "bg-surface2 border border-border text-ink"
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && <div className="text-muted text-xs animate-pulse">AI is typing...</div>}
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..." 
            className="flex-1 bg-surface2 border border-border rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:border-accent" 
          />
          <button type="submit" className="bg-accent text-white p-3 rounded-xl hover:opacity-80">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}