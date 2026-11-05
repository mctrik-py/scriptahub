import { useState } from "react";
import { ArrowLeft, Upload, FileSearch, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

export default function Plagiarism() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please upload a file");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      const res = await api.post("/tools/plagiarism/check/", formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        }
      });
      setResult(res.data);
      toast.success("Check completed!");
    } catch (err) {
      toast.error("Failed to check document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="max-w-md mx-auto card">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/student/dashboard")} className="text-muted hover:text-ink">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <FileSearch size={20} className="text-accent" /> Plagiarism Checker
          </h1>
        </div>
        <p className="text-sm text-muted mb-6">Upload your draft to check for similarity and AI content.</p>

        <form onSubmit={handleCheck} className="space-y-4">
          <div className="flex items-center justify-center w-full border-2 border-dashed border-border rounded-xl p-8 bg-surface2 hover:bg-neutral-800/50 transition cursor-pointer relative">
            <input type="file" required onChange={(e) => setFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
            <div className="flex flex-col items-center gap-2 text-muted">
              <Upload size={32} />
              <span className="text-sm font-medium">{file ? file.name : "Click to upload (.pdf, .docx)"}</span>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Checking..." : "Check Document"}
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-4 rounded-xl border ${result.score > 20 ? "border-danger bg-danger/10" : "border-success bg-success/10"}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.score > 20 ? <AlertCircle size={20} className="text-danger" /> : <CheckCircle size={20} className="text-success" />}
              <h3 className="font-semibold">Result</h3>
            </div>
            <p className="text-2xl font-bold">{result.score}% Similarity</p>
            <p className="text-sm mt-1">{result.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}