import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import ForgotPassword from "./pages/ForgotPassword";
import Terms from "./pages/Terms";
import StudentDashboard from "./pages/StudentDashboard";
import MentorDashboard from "./pages/MentorDashboard";
import Topics from "./pages/Topics";
import Engagement from "./pages/Engagement";
import Wallet from "./pages/Wallet";
import Complaint from "./pages/Complaint";
import Profile from "./pages/Profile";
import FindWriter from "./pages/FindWriter";
import WriteForMe from "./pages/WriteForMe";
import Analysis from "./pages/Analysis";
import Implementation from "./pages/Implementation";
import MyProjects from "./pages/MyProjects";
import ProjectDetail from "./pages/ProjectDetail";
import AiChat from "./pages/AiChat";
import Notifications from "./pages/Notifications";
import MentorProjectDetail from "./pages/MentorProjectDetail";
import AdminDashboard from "./pages/AdminDashboard";
import PendingApproval from "./pages/PendingApproval";
import Plagiarism from "./pages/Plagiarism";
import Groups from "./pages/Groups";
import GroupManage from "./pages/GroupManage";
import GroupChat from "./pages/GroupChat";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/mentor/dashboard" element={<MentorDashboard />} />
        <Route path="/mentor/project/:id" element={<MentorProjectDetail />} />
        
        <Route path="/topics" element={<Topics />} />
        <Route path="/engagement" element={<Engagement />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/complaint" element={<Complaint />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/find-writer" element={<FindWriter />} />
        <Route path="/write-for-me" element={<WriteForMe />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/implementation" element={<Implementation />} />
        <Route path="/my-projects" element={<MyProjects />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/ai-chat" element={<AiChat />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/plagiarism" element={<Plagiarism />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        
        {/* Groups */}
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/manage/:id" element={<GroupManage />} />
        <Route path="/group/:id" element={<GroupChat />} />
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
