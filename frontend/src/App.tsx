import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Resumes from './pages/Resumes';
import ResumeDetail from './pages/ResumeDetail';
import CoverLetters from './pages/CoverLetters';
import CoverLetterDetail from './pages/CoverLetterDetail';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import Interviews from './pages/Interviews';
import InterviewDetail from './pages/InterviewDetail';
import InterviewPrep from './pages/InterviewPrep';
import Skills from './pages/Skills';
import Salary from './pages/Salary';
import SalaryDetail from './pages/SalaryDetail';
import Companies from './pages/Companies';
import CompanyDetail from './pages/CompanyDetail';
import Network from './pages/Network';
import ContactDetail from './pages/ContactDetail';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import AIJobMatcher from './pages/AIJobMatcher';
import AIKeywordOptimizer from './pages/AIKeywordOptimizer';
import AICoverLetterPersonalizer from './pages/AICoverLetterPersonalizer';
import AISalaryNegotiator from './pages/AISalaryNegotiator';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="resumes" element={<Resumes />} />
        <Route path="resumes/:id" element={<ResumeDetail />} />
        <Route path="cover-letters" element={<CoverLetters />} />
        <Route path="cover-letters/:id" element={<CoverLetterDetail />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="applications" element={<Applications />} />
        <Route path="applications/:id" element={<ApplicationDetail />} />
        <Route path="interviews" element={<Interviews />} />
        <Route path="interviews/:id" element={<InterviewDetail />} />
        <Route path="interview-prep" element={<InterviewPrep />} />
        <Route path="ai-job-matcher" element={<AIJobMatcher />} />
        <Route path="ai-keyword-optimizer" element={<AIKeywordOptimizer />} />
        <Route path="ai-cover-letter" element={<AICoverLetterPersonalizer />} />
        <Route path="ai-salary-negotiator" element={<AISalaryNegotiator />} />
        <Route path="skills" element={<Skills />} />
        <Route path="salary" element={<Salary />} />
        <Route path="salary/:id" element={<SalaryDetail />} />
        <Route path="companies" element={<Companies />} />
        <Route path="companies/:id" element={<CompanyDetail />} />
        <Route path="network" element={<Network />} />
        <Route path="network/:id" element={<ContactDetail />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;
