import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GraduationCap, UserCog, ArrowLeft, Upload, CheckSquare, Square } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import ThemeToggle from "../components/ThemeToggle";

export default function SignUp() {
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [form, setForm] = useState({
    email: "", username: "", password: "",
    institution: "", level: "", department: "", discipline: "",
    bio: "", expertise: "", verification_doc: null
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreedToTerms) return toast.error("You must agree to the Terms & Conditions.");
    if (form.password !== confirmPassword) return toast.error("Passwords do not match.");
    
    if (role === "student") {
      const lvl = parseInt(form.level);
      if (isNaN(lvl) || lvl < 100 || lvl > 800) {
        return toast.error("Level must be a number between 100 and 800.");
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", form.email);
      formData.append("username", form.username);
      formData.append("password", form.password);
      formData.append("role", role);

      if (role === "student") {
        formData.append("institution", form.institution || "");
        formData.append("level", form.level);
        formData.append("department", form.department || "");
      } else {
        formData.append("bio", form.bio || "");
        if (form.verification_doc) formData.append("verification_doc", form.verification_doc);
      }

      const res = await api.post("/auth/register/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      localStorage.setItem("pending_email", form.email);
      toast.success("Check your email for a verification code.");
      navigate("/verify-email");
      
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.email?.[0] || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-md space-y-4">
        <div className="card relative">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate("/login")} className="text-muted hover:text-ink"><ArrowLeft size={20} /></button>
            <h1 className="text-2xl font-semibold">Join ScriptaHub</h1>
          </div>
          <p className="text-accent font-medium text-sm ml-8 mb-1 italic">"Where Solutions Meet Thesis"</p>
          
          <div className="mt-5 space-y-3">
            <button type="button" onClick={() => setRole("student")}
              className={`w-full text-left flex gap-3 items-center p-4 rounded-2xl border-2 transition ${
                role === "student" 
                  ? "border-accent bg-surface2" 
                  : "border-border hover:border-accent/50"
              }`}>
              <div className="w-10 h-10 grid place-items-center rounded-xl bg-black/40 border border-border">
                <GraduationCap size={22} className={role === "student" ? "text-accent" : "text-ink"} />
              </div>
              <div>
                <div className="font-medium">I'm a student</div>
                <div className="text-muted text-sm">Get guidance on your project</div>
              </div>
            </button>
            
            <button type="button" onClick={() => setRole("mentor")}
              className={`w-full text-left flex gap-3 items-center p-4 rounded-2xl border-2 transition ${
                role === "mentor" 
                  ? "border-accent bg-surface2" 
                  : "border-border hover:border-accent/50"
              }`}>
              <div className="w-10 h-10 grid place-items-center rounded-xl bg-black/40 border border-border">
                <UserCog size={22} className={role === "mentor" ? "text-accent" : "text-ink"} />
              </div>
              <div>
                <div className="font-medium">I'm a mentor</div>
                <div className="text-muted text-sm">Verified writers and developers</div>
              </div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <label className="block"><span className="text-xs text-muted">Email</span>
              <input type="email" required placeholder="you@example.com" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent" /></label>
            <label className="block"><span className="text-xs text-muted">Username</span>
              <input type="text" required placeholder="johndoe" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent" /></label>
            <label className="block"><span className="text-xs text-muted">Password</span>
              <input type="password" required placeholder="Min 8 characters" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent" /></label>
            <label className="block"><span className="text-xs text-muted">Confirm Password</span>
              <input type="password" required placeholder="Retype password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent" /></label>

            {role === "student" ? (
              <>
                <label className="block"><span className="text-xs text-muted">Institution</span>
                  <input type="text" placeholder="Kwara State University" value={form.institution} onChange={(e) => setForm({...form, institution: e.target.value})} className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent" /></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block"><span className="text-xs text-muted">Level (100-800)</span>
                    <input type="number" min="100" max="800" step="100" placeholder="400" value={form.level} onChange={(e) => setForm({...form, level: e.target.value})} className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent" /></label>
                  <label className="block"><span className="text-xs text-muted">Department</span>
                    <input type="text" placeholder="Computer Science" value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent" /></label>
                </div>
              </>
            ) : (
              <>
                <label className="block"><span className="text-xs text-muted">Expertise (comma separated)</span>
                  <input type="text" placeholder="Web Dev, Python, ML/AI" value={form.expertise} onChange={(e) => setForm({...form, expertise: e.target.value})} className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent" /></label>
                <label className="block"><span className="text-xs text-muted">Short Bio</span>
                  <textarea rows="2" placeholder="I help students build scalable web apps..." value={form.bio} onChange={(e) => setForm({...form, bio: e.target.value})} className="mt-1 w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-accent resize-none" /></label>
                <label className="block">
                  <span className="text-xs text-muted">Upload a past writing or job for review</span>
                  <div className="mt-1 flex items-center justify-center w-full border-2 border-dashed border-border rounded-xl p-4 bg-surface2 hover:bg-neutral-800/50 transition cursor-pointer relative">
                    <input type="file" required onChange={(e) => setForm({...form, verification_doc: e.target.files[0]})} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="flex flex-col items-center gap-2 text-muted">
                      <Upload size={20} />
                      <span className="text-xs">{form.verification_doc ? form.verification_doc.name : "Click to upload"}</span>
                    </div>
                  </div>
                </label>
              </>
            )}

            <div className="flex items-start gap-2 mt-4">
              <button type="button" onClick={() => setAgreedToTerms(!agreedToTerms)} className="text-accent mt-0.5">
                {agreedToTerms ? <CheckSquare size={18} /> : <Square size={18} />}
              </button>
              <p className="text-xs text-muted">I agree to the <Link to="/terms" target="_blank" className="text-info underline">Terms & Conditions</Link>.</p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Creating account..." : "Continue"}
            </button>
          </form>
        </div>
        <p className="text-center text-muted text-sm mt-4">Already have an account? <Link to="/login" className="text-ink underline">Log in</Link></p>
      </div>
    </div>
  );
}