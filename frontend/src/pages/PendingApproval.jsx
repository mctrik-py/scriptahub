import { useNavigate } from "react-router-dom";
import { Clock, LogOut } from "lucide-react";

export default function PendingApproval() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="card w-full max-w-md text-center">
        <div className="w-16 h-16 bg-warn/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock size={32} className="text-warn" />
        </div>
        <h1 className="text-xl font-semibold">Application Received</h1>
        <p className="text-muted text-sm mt-2">
          Thank you for applying to be a ScriptaHub mentor. Your credentials and document are currently under review by our admin team.
        </p>
        <p className="text-muted text-sm mt-2">
          You will receive an email notification once your account is approved. You cannot log in until then.
        </p>
        <button onClick={handleLogout} className="btn-ghost w-full mt-6 flex items-center justify-center gap-2">
          <LogOut size={16} /> Back to Login
        </button>
      </div>
    </div>
  );
}