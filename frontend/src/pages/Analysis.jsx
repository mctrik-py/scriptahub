import { useState } from "react";
import { ArrowLeft, Users, PenTool, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

export default function Analysis() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = Choice, 2 = Details
  const [requestType, setRequestType] = useState("find_analyst"); // "find_analyst" or "we_analyze"
  const [tool, setTool] = useState("SPSS");
  const [dataLevel, setDataLevel] = useState("Primary Data (Questionnaires)");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      await api.post("/services/projects/request/", 
        { 
          request_type: requestType === "find_analyst" ? "find_writer" : "write_for_me", 
          title: `Data Analysis: ${tool}`, 
          description: `${dataLevel}. ${description}` 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Analysis request submitted! Awaiting approval.");
      navigate("/student/dashboard");
    } catch (err) {
      toast.error("Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-bg p-4">
        <div className="max-w-md mx-auto card">
          <button onClick={() => navigate("/student/dashboard")} className="text-muted mb-4"><ArrowLeft size={20} /></button>
          <h1 className="text-xl font-semibold">Data Analysis</h1>
          <p className="text-sm text-muted mt-2">How would you like us to handle your data?</p>
          
          <div className="mt-6 space-y-3">
            <button onClick={() => { setRequestType("find_analyst"); setStep(2); }}
              className="w-full text-left flex gap-3 items-center p-4 rounded-2xl border border-border hover:border-accent transition bg-surface2">
              <Users size={24} className="text-accent" />
              <div>
                <div className="font-medium text-sm">Find an Analyst</div>
                <div className="text-xs text-muted mt-1">We match you with a verified data expert.</div>
              </div>
            </button>

            <button onClick={() => { setRequestType("we_analyze"); setStep(2); }}
              className="w-full text-left flex gap-3 items-center p-4 rounded-2xl border border-border hover:border-info transition bg-surface2">
              <PenTool size={24} className="text-info" />
              <div>
                <div className="font-medium text-sm">We Analyze for You</div>
                <div className="text-xs text-muted mt-1">Our team runs the analysis and sends you the results.</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="max-w-md mx-auto card">
        <button onClick={() => setStep(1)} className="text-muted mb-4"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-semibold">Analysis Details</h1>
        <p className="text-sm text-muted mt-2">Provide your requirements. You will be able to upload your dataset after payment is confirmed.</p>
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs text-muted">Data Level</span>
            <select value={dataLevel} onChange={(e) => setDataLevel(e.target.value)} className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent">
              <option>Primary Data (Questionnaires)</option>
              <option>Secondary Data (Existing Records)</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-muted">Preferred Tool</span>
            <select value={tool} onChange={(e) => setTool(e.target.value)} className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent">
              <option>SPSS</option>
              <option>Python (Pandas/Seaborn)</option>
              <option>Excel</option>
              <option>R</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-muted">Describe your data (e.g., sample size, variables)</span>
            <textarea 
              rows="3" required
              value={description} onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink placeholder:text-neutral-500 focus:outline-none focus:border-accent resize-none" 
              placeholder="I have 200 responses from..."
            />
          </label>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
}