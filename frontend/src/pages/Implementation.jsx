import { useState } from "react";
import { ArrowLeft, Upload, PenTool, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Implementation() {
  const navigate = useNavigate();
  const [requestType, setRequestType] = useState("build");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description && !file) {
      toast.error("Please describe the implementation or upload a methodology document.");
      return;
    }
    toast.success("Implementation request submitted! We will contact you shortly.");
    navigate("/student/dashboard");
  };

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="max-w-md mx-auto card relative">
        <button onClick={() => navigate("/student/dashboard")} className="text-muted hover:text-ink mb-4">
          <ArrowLeft size={20} />
        </button>
        
        <h1 className="text-xl font-semibold">Implementation Request</h1>
        <p className="text-sm text-muted mt-1">Tell us what you need built or reviewed.</p>
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          
          {/* Description / Upload */}
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-muted">Describe your implementation needs</span>
              <textarea 
                rows="4" 
                placeholder="e.g., I need a Python backend to handle user authentication and file uploads..."
                value={description} onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink placeholder:text-neutral-500 focus:outline-none focus:border-accent resize-none" 
              />
            </label>

            <label className="block">
              <span className="text-xs text-muted">Or upload your Methodology / System Design</span>
              <div className="mt-1 flex items-center justify-center w-full border-2 border-dashed border-border rounded-xl p-6 bg-surface2 hover:bg-neutral-800/50 transition cursor-pointer relative">
                <input type="file" onChange={(e) => setFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                <div className="flex flex-col items-center gap-2 text-muted">
                  <Upload size={24} />
                  <span className="text-xs">{file ? file.name : "Click to upload (.pdf, .docx)"}</span>
                </div>
              </div>
            </label>
          </div>

          {/* Choice: Build vs Mentor */}
          <div className="space-y-3">
            <span className="text-xs text-muted">How would you like us to handle this?</span>
            
            <button type="button" onClick={() => setRequestType("build")}
              className={`w-full text-left flex gap-3 items-center p-4 rounded-2xl border transition
                ${requestType === "build" ? "border-accent bg-surface2" : "border-border hover:border-neutral-600"}`}>
              <PenTool size={22} className={requestType === "build" ? "text-accent" : "text-muted"} />
              <div>
                <div className="font-medium text-sm">Build it for me</div>
                <div className="text-xs text-muted mt-1">Our expert team will implement the code directly for you.</div>
              </div>
            </button>

            <button type="button" onClick={() => setRequestType("mentor")}
              className={`w-full text-left flex gap-3 items-center p-4 rounded-2xl border transition
                ${requestType === "mentor" ? "border-accent bg-surface2" : "border-border hover:border-neutral-600"}`}>
              <Users size={22} className={requestType === "mentor" ? "text-accent" : "text-muted"} />
              <div>
                <div className="font-medium text-sm">Find a Mentor</div>
                <div className="text-xs text-muted mt-1">We'll match you with a verified developer to guide you.</div>
              </div>
            </button>
          </div>

          <button type="submit" className="btn-primary w-full mt-4">
            Submit Request
          </button>
        </form>
      </div>
    </div>
  );
}