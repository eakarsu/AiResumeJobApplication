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
import ResumeUpload from './pages/ResumeUpload';
import Autopilot from './pages/Autopilot';
import LinkedinSync from './pages/LinkedinSync';
import CompensationTracker from './pages/CompensationTracker';
import VoiceInterviewPrep from './pages/VoiceInterviewPrep';
import AIRejectionAnalysis from './pages/AIRejectionAnalysis';
import AIOfferNegotiationSimulator from './pages/AIOfferNegotiationSimulator';
import AICareerTrajectoryAnalyzer from './pages/AICareerTrajectoryAnalyzer';
import AIApplicationTracker from './pages/AIApplicationTracker';
import AIInterviewSchedulingOptimizer from './pages/AIInterviewSchedulingOptimizer';

// === Batch 07 Gaps & Frontend Mounts ===
import CfAgenticApplicationSuite from './pages/CfAgenticApplicationSuite';
import CfInterviewCoachingWithRecording from './pages/CfInterviewCoachingWithRecording';
import CfOfferNegotiationCoach from './pages/CfOfferNegotiationCoach';
import CfCareerGoalRoadmap from './pages/CfCareerGoalRoadmap';
import CfCompanyCultureFitAssessment from './pages/CfCompanyCultureFitAssessment';
import CfRecruiterRelationshipBuilder from './pages/CfRecruiterRelationshipBuilder';
import GapNoRejectionanalysisWhyRejected from './pages/GapNoRejectionanalysisWhyRejected';
import GapNoInterviewschedulingoptimizer from './pages/GapNoInterviewschedulingoptimizer';
import GapNoOffernegotiationsimulator from './pages/GapNoOffernegotiationsimulator';
import GapNoCareertrajectoryanalyzerPathPrediction from './pages/GapNoCareertrajectoryanalyzerPathPrediction';
import GapNoVideorecordingAnalysisEyeContactPace from './pages/GapNoVideorecordingAnalysisEyeContactPace';
import GapLimitedLinkedinIntegrationStubOnlyNoRe from './pages/GapLimitedLinkedinIntegrationStubOnlyNoRe';
import GapNoInterviewPanelFeedbackCollection from './pages/GapNoInterviewPanelFeedbackCollection';
import GapNoOfferComparisonToolBenefitsEquity from './pages/GapNoOfferComparisonToolBenefitsEquity';
import GapNoBackgroundCheckStatusTracker from './pages/GapNoBackgroundCheckStatusTracker';
import GapNoBrowserExtensionForOneclickApply from './pages/GapNoBrowserExtensionForOneclickApply';
import GapNoNotificationsemailAutomation from './pages/GapNoNotificationsemailAutomation';
import GapNoPublicWebhooks from './pages/GapNoPublicWebhooks';
// === End Batch 07 ===


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
        {/* NEW pages */}
        <Route path="resume-upload" element={<ResumeUpload />} />
        <Route path="autopilot" element={<Autopilot />} />
        <Route path="linkedin-sync" element={<LinkedinSync />} />
        <Route path="compensation" element={<CompensationTracker />} />
        <Route path="voice-prep" element={<VoiceInterviewPrep />} />
        <Route path="ai-rejection-analysis" element={<AIRejectionAnalysis />} />
        <Route path="ai-offer-negotiation" element={<AIOfferNegotiationSimulator />} />
        <Route path="ai-career-trajectory" element={<AICareerTrajectoryAnalyzer />} />
        <Route path="ai-application-tracker" element={<AIApplicationTracker />} />
        <Route path="ai-interview-scheduling" element={<AIInterviewSchedulingOptimizer />} />
      </Route>
          // === Batch 07 Gaps & Frontend Mounts ===
          <Route path='/cf-agentic-application-suite' element={<CfAgenticApplicationSuite />} />
          <Route path='/cf-interview-coaching-with-recording' element={<CfInterviewCoachingWithRecording />} />
          <Route path='/cf-offer-negotiation-coach' element={<CfOfferNegotiationCoach />} />
          <Route path='/cf-career-goal-roadmap' element={<CfCareerGoalRoadmap />} />
          <Route path='/cf-company-culture-fit-assessment' element={<CfCompanyCultureFitAssessment />} />
          <Route path='/cf-recruiter-relationship-builder' element={<CfRecruiterRelationshipBuilder />} />
          <Route path='/gap-no-rejectionanalysis-why-rejected' element={<GapNoRejectionanalysisWhyRejected />} />
          <Route path='/gap-no-interviewschedulingoptimizer' element={<GapNoInterviewschedulingoptimizer />} />
          <Route path='/gap-no-offernegotiationsimulator' element={<GapNoOffernegotiationsimulator />} />
          <Route path='/gap-no-careertrajectoryanalyzer-path-prediction' element={<GapNoCareertrajectoryanalyzerPathPrediction />} />
          <Route path='/gap-no-videorecording-analysis-eye-contact-pace' element={<GapNoVideorecordingAnalysisEyeContactPace />} />
          <Route path='/gap-limited-linkedin-integration-stub-only-no-re' element={<GapLimitedLinkedinIntegrationStubOnlyNoRe />} />
          <Route path='/gap-no-interview-panel-feedback-collection' element={<GapNoInterviewPanelFeedbackCollection />} />
          <Route path='/gap-no-offer-comparison-tool-benefits-equity' element={<GapNoOfferComparisonToolBenefitsEquity />} />
          <Route path='/gap-no-background-check-status-tracker' element={<GapNoBackgroundCheckStatusTracker />} />
          <Route path='/gap-no-browser-extension-for-oneclick-apply' element={<GapNoBrowserExtensionForOneclickApply />} />
          <Route path='/gap-no-notificationsemail-automation' element={<GapNoNotificationsemailAutomation />} />
          <Route path='/gap-no-public-webhooks' element={<GapNoPublicWebhooks />} />
          // === End Batch 07 ===
    </Routes>
  );
}

export default App;
