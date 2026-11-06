import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg p-4 pb-24">
      <div className="max-w-md mx-auto card">
        <div className="flex items-center gap-3 mb-6 sticky top-0 bg-surface py-2 z-10">
          <button onClick={() => navigate(-1)} className="text-muted hover:text-ink">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold">Terms & Conditions</h1>
        </div>

        <div className="space-y-4 text-sm text-muted leading-relaxed">
          <h1 className="text-lg font-bold text-ink">ScriptaHub Terms of Service & Academic Integrity Policy</h1>
          <p className="text-xs">Last Updated: October 2026 | Effective Date: October 2026</p>

          <h2 className="font-semibold text-ink mt-4">1. Introduction and Acceptance of Terms</h2>
          <p>Welcome to ScriptaHub ("the Platform"). These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and ScriptaHub regarding your access to and use of our services. By creating an account, accessing, or using the Platform in any manner, you acknowledge that you have read, understood, and agree to be bound by these Terms in their entirety. If you do not agree to these Terms, you must immediately cease all use of the Platform and its Services.</p>
          <p>We reserve the right to modify, amend, or update these Terms at any time. Material changes will be communicated via email or prominent notice on the Platform. Your continued use of the Services following such notification constitutes acceptance of the revised Terms.</p>

          <h2 className="font-semibold text-ink mt-4">2. Definitions</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Platform:</strong> The ScriptaHub website, mobile applications, and all related services.</li>
            <li><strong>User:</strong> Any individual or entity accessing or using the Platform, including Students, Individuals, organizations, and Mentors.</li>
            <li><strong>Student:</strong> Any final-year student, individual, or organization seeking mentorship, guidance, writing support, development assistance, or data analysis services.</li>
            <li><strong>Mentor:</strong> Any verified writer, developer, data analyst, or subject-matter expert providing guidance and support services through the Platform. This includes both Public Mentors and Company Professionals.</li>
            <li><strong>Company Professionals:</strong> Dedicated, in-house professional accounts managed by ScriptaHub to handle "Write For Me" service requests.</li>
            <li><strong>Project:</strong> Any academic, professional, or personal undertaking for which a Student engages a Mentor.</li>
            <li><strong>Milestone:</strong> A defined deliverable or phase of a Project agreed upon between the Student and Mentor.</li>
            <li><strong>Escrow:</strong> Secure holding of funds by ScriptaHub until specified conditions are met.</li>
            <li><strong>NDPA:</strong> The Nigeria Data Protection Act and subsidiary regulations.</li>
          </ul>

          <h2 className="font-semibold text-ink mt-4">3. Platform Purpose and Scope</h2>
          <p><strong>3.1 Nature of Services:</strong> ScriptaHub is a two-sided marketplace that connects Students, individuals, and organizations with Mentors, writers, developers, and data analysts. The Platform serves as a facilitator and escrow agent only.</p>
          <p><strong>3.2 Service Types:</strong> The Platform offers two primary engagement models: (1) "Find a Writer" where requests are broadcast to Public Mentors, and (2) "Write For Me" which is automatically routed to Company Professionals.</p>
          <p><strong>3.3 No Academic Institution Status:</strong> ScriptaHub is NOT an academic institution, does not grant degrees, and is not affiliated with any educational establishment. We do not guarantee academic outcomes.</p>
          <p><strong>3.4 Limitation of Liability:</strong> ScriptaHub acts solely as an intermediary. We are not responsible for the quality, accuracy, or completeness of any work exchanged between Users.</p>

          <h2 className="font-semibold text-ink mt-4">4. Academic Integrity Policy (Zero Tolerance)</h2>
          <p><strong>4.1 Mentorship and Guidance Only:</strong> ScriptaHub operates strictly as a mentorship, guidance, and educational support platform.</p>
          <p><strong>4.2 Prohibited Conduct:</strong> The following are strictly prohibited: Ghostwriting (writing full chapters/theses for submission), Academic Fraud, Submission of Purchased Work, and Contract Cheating.</p>
          <p><strong>4.3 Permitted Services:</strong> Reviewing drafts, explaining concepts, debugging code, guiding methodology, providing examples, and assisting with data analysis interpretation.</p>
          <p><strong>4.4 Consequences:</strong> Violation will result in permanent account termination without refund. ScriptaHub reserves the right to report misconduct to educational institutions.</p>

          <h2 className="font-semibold text-ink mt-4">5. Payments, Escrow, and Fees</h2>
          <p><strong>5.1 Escrow System:</strong> All Project funds must be deposited into escrow before work commences.</p>
          <p><strong>5.2 Money Split and Platform Fee:</strong> Upon the Mentor's acceptance, the total Project value is split: 10% Platform Fee deducted automatically, and 90% Escrow Hold for the duration of the Project. The 90% is further split: 60% upon commencement and 30% after completion.</p>
          <p><strong>5.3 Fund Release:</strong> The 90% is released upon Student approval of a Milestone or successful completion of the Project.</p>
          <p><strong>5.4 Off-Platform Payments:</strong> Negotiating payments outside the Platform will result in immediate account suspension.</p>
          <p><strong>5.5 Currency:</strong> All payments shall be made in Nigerian Naira (₦). Users are responsible for applicable taxes.</p>

          <h2 className="font-semibold text-ink mt-4">6. Data Privacy (NDPA Compliance)</h2>
          <p><strong>6.1 Compliance:</strong> ScriptaHub processes data in strict accordance with the Nigeria Data Protection Act (NDPA).</p>
          <p><strong>6.2 Storage:</strong> Data is securely stored using Cloudinary (media files) and PostgreSQL (structured data).</p>
          <p><strong>6.3 Sharing:</strong> We do not sell your data. We only share necessary information with the assigned Mentor or Student.</p>
          <p><strong>6.4 User Rights:</strong> You have the right to access, correct, or request deletion of your data, and to lodge complaints with the Nigeria Data Protection Commission.</p>

          <h2 className="font-semibold text-ink mt-4">7. Dispute Resolution and Refunds</h2>
          <p><strong>7.1 Raising a Dispute:</strong> Disputes must be raised through the "Support & Complaints" section.</p>
          <p><strong>7.2 Refund Policy:</strong> Refunds are subject to Admin review. Once funds are released to a Mentor, they cannot be reversed unless fraud is proven.</p>
          <p><strong>7.3 Finality:</strong> Admin decisions are final and binding.</p>
          <p><strong>7.4 Limitation Period:</strong> Disputes must be raised within 30 days of the event.</p>

          <h2 className="font-semibold text-ink mt-4">8. Account Suspension and Termination</h2>
          <p>We reserve the right to suspend accounts that violate these Terms, engage in plagiarism, harass users, circumvent escrow, or provide false information.</p>
          <p><strong>8.2 Mentor Verification:</strong> All Mentor applications are subject to Admin review. Rejected applications result in deactivation.</p>
          <p><strong>8.4 Appeals:</strong> Users may appeal termination within 14 days.</p>

          <h2 className="font-semibold text-ink mt-4">9. Student-Specific Terms</h2>
          <p><strong>9.1 Own-Work Acknowledgment:</strong> You are the primary author of your Project. You will use the Platform as a guide, not a replacement for your own intellectual effort.</p>
          <p><strong>9.2 Payment Obligations:</strong> Fund escrow before work begins and do not withhold payment for successfully delivered Milestones.</p>

          <h2 className="font-semibold text-ink mt-4">10. Mentor-Specific Terms</h2>
          <p><strong>10.1 Code of Conduct:</strong> No Ghostwriting, strict Confidentiality, Originality of guidance, and Professionalism.</p>
          <p><strong>10.2 Verification:</strong> Submit valid credentials for Admin review before accepting Projects.</p>
          <p><strong>10.3 Commission:</strong> ScriptaHub deducts a 10% commission fee from the total Project value upon acceptance.</p>
          <p><strong>10.4 Independent Contractor:</strong> Mentors are independent contractors, not employees of ScriptaHub.</p>

          <h2 className="font-semibold text-ink mt-4">11. Intellectual Property</h2>
          <p>All Platform content is the property of ScriptaHub. Users retain ownership of original content uploaded. Upon full payment, work product ownership transfers to the Student.</p>

          <h2 className="font-semibold text-ink mt-4">12. Limitation of Liability</h2>
          <p>The Platform is provided "as is" without warranties. ScriptaHub's total liability shall not exceed the fees paid in the twelve (12) months preceding the claim.</p>

          <h2 className="font-semibold text-ink mt-4">13. Indemnification</h2>
          <p>You agree to indemnify ScriptaHub from any claims arising from your violation of these Terms or applicable laws.</p>

          <h2 className="font-semibold text-ink mt-4">14. Governing Law</h2>
          <p>These Terms are governed by the laws of the Federal Republic of Nigeria.</p>

          <h2 className="font-semibold text-ink mt-4">15. General Provisions</h2>
          <p>Entire Agreement, Severability, Waiver, Assignment, and Force Majeure clauses apply as standard.</p>

          <h2 className="font-semibold text-ink mt-4">16. Contact Information</h2>
          <p>Email: support@scriptahub.com<br/>Website: www.scriptahub.com</p>

          <h2 className="font-semibold text-ink mt-4">17. Acknowledgment</h2>
          <p className="font-medium text-ink">BY CREATING AN ACCOUNT, ACCESSING, OR USING THE SCRIPTAHUB PLATFORM, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE AND THE ACADEMIC INTEGRITY POLICY.</p>
        </div>
      </div>
    </div>
  );
}
