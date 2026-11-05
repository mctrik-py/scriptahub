import { useState } from "react";
import { ArrowLeft, CheckCircle2, Code2, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Engagement() {
  const navigate = useNavigate();
  
  // Mock data simulating what comes from the database
  const engagement = {
    title: "Final Year Thesis Project",
    mentor_name: "Ada O.",
    service_type: "Chapter Writing & Implementation",
    specific_chapter: "Chapter 3: Methodology",
    is_implementation: true,
    milestones: [
      { id: 1, title: "Milestone 1 of 3", meta: "Architecture review", status: "released" },
      { id: 2, title: "", meta: "Code review", status: "submitted" },
      { id: 3, title: "", meta: "Final testing", status: "pending" },
    ],
    activity: [
      { id: 1, text: "Draft uploaded by you", time: "2 hours ago" },
      { id: 2, text: "Feedback from mentor, today", time: "1 hour ago" },
    ]
  };

  const handleApprove = () => {
    if (window.confirm("Approve this milestone and release funds to the mentor?")) {
      toast.success("Milestone approved! Funds released to mentor.");
    }
  };

  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="max-w-md mx-auto p-4 space-y-4">
        
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate("/student/dashboard")} className="text-muted hover:text-ink">
              <ArrowLeft size={20} />
            </button>
            <span className="text-sm font-medium text-muted">Engagement Details</span>
            <div className="w-5"></div>
          </div>

          <div className="text-muted text-sm">{engagement.title}</div>
          <h1 className="text-xl font-semibold mt-1">Mentor: {engagement.mentor_name}</h1>

          {/* Service Details Card */}
          <div className="mt-4 bg-surface2 border border-border rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-ink">
              <FileText size={16} className="text-accent" />
              <span>{engagement.service_type}</span>
            </div>
            {engagement.specific_chapter && (
              <div className="flex items-center gap-2 text-sm text-muted pl-6">
                <span>Focus: {engagement.specific_chapter}</span>
              </div>
            )}
            {engagement.is_implementation && (
              <div className="flex items-center gap-2 text-sm text-info pl-6">
                <Code2 size={14} />
                <span>Includes Implementation (Code)</span>
              </div>
            )}
          </div>

          <div className="mt-5 text-sm font-medium text-muted">Milestones</div>
          <div className="mt-2 space-y-2">
            {engagement.milestones.map((m) => (
              <div key={m.id} className="card-inner flex items-center justify-between">
                <div>
                  {m.title && <div className="font-medium text-sm">{m.title}</div>}
                  <div className={m.title ? "text-sm text-muted" : "font-medium text-sm"}>{m.meta}</div>
                </div>
                <StatusPill status={m.status} />
              </div>
            ))}
          </div>

          <div className="mt-5 text-sm font-medium text-muted">Activity Log</div>
          <div className="mt-2 card-inner space-y-3">
            {engagement.activity.map((a) => (
              <div key={a.id} className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-success mt-0.5" />
                <div>
                  <p className="text-sm">{a.text}</p>
                  <p className="text-xs text-muted">{a.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={() => navigate("/complaint")} className="btn-ghost flex-1">Message</button>
            <button onClick={handleApprove} className="btn-primary flex-1">Approve</button>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    released: "border-success text-success",
    submitted: "border-warn text-warn",
    pending: "border-border text-muted",
    disputed: "border-danger text-danger",
  }[status] || "border-border text-muted";
  
  return <span className={`chip capitalize ${map}`}>{status}</span>;
}