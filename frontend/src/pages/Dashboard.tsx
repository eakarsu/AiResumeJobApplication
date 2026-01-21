import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI, applicationsAPI, interviewsAPI, jobsAPI } from '../services/api';
import {
  FileText,
  Mail,
  Briefcase,
  ClipboardList,
  Calendar,
  Award,
  DollarSign,
  Building2,
  Users,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { DashboardStats, JobApplication, Interview, Job } from '../types';

const featureCards = [
  { name: 'Resumes', icon: FileText, href: '/resumes', color: 'bg-blue-500', description: 'Create AI-powered resumes' },
  { name: 'Cover Letters', icon: Mail, href: '/cover-letters', color: 'bg-purple-500', description: 'Generate custom letters' },
  { name: 'Jobs', icon: Briefcase, href: '/jobs', color: 'bg-green-500', description: 'Browse job listings' },
  { name: 'Applications', icon: ClipboardList, href: '/applications', color: 'bg-orange-500', description: 'Track applications' },
  { name: 'Interviews', icon: Calendar, href: '/interviews', color: 'bg-pink-500', description: 'Manage interviews' },
  { name: 'Interview Prep', icon: Sparkles, href: '/interview-prep', color: 'bg-indigo-500', description: 'AI interview coaching' },
  { name: 'Skills', icon: Award, href: '/skills', color: 'bg-yellow-500', description: 'Assess your skills' },
  { name: 'Salary', icon: DollarSign, href: '/salary', color: 'bg-emerald-500', description: 'Research salaries' },
  { name: 'Companies', icon: Building2, href: '/companies', color: 'bg-cyan-500', description: 'Research companies' },
  { name: 'Network', icon: Users, href: '/network', color: 'bg-rose-500', description: 'Manage contacts' },
  { name: 'Analytics', icon: BarChart3, href: '/analytics', color: 'bg-violet-500', description: 'View insights' },
];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApplications, setRecentApplications] = useState<JobApplication[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, appsRes, interviewsRes, jobsRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        applicationsAPI.getAll({ limit: 5 }),
        interviewsAPI.getAll({ upcoming: 'true' }),
        jobsAPI.getRecommended().catch(() => ({ data: [] }))
      ]);

      setStats(statsRes.data);
      setRecentApplications(appsRes.data.applications);
      setUpcomingInterviews(interviewsRes.data.slice(0, 5));
      setRecommendedJobs(jobsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      applied: 'status-applied',
      screening: 'status-screening',
      interview: 'status-interview',
      offer: 'status-offer',
      rejected: 'status-rejected',
      accepted: 'status-accepted',
      withdrawn: 'status-withdrawn'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user?.firstName}!</h1>
        <p className="mt-2 text-primary-100">
          Here's your career journey overview. Let's land that dream job!
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-primary-100 text-sm">Applications</p>
            <p className="text-3xl font-bold">{stats?.overview.totalApplications || 0}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-primary-100 text-sm">Interviews</p>
            <p className="text-3xl font-bold">{stats?.overview.upcomingInterviews || 0}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-primary-100 text-sm">Resumes</p>
            <p className="text-3xl font-bold">{stats?.overview.totalResumes || 0}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-primary-100 text-sm">Contacts</p>
            <p className="text-3xl font-bold">{stats?.overview.totalContacts || 0}</p>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {featureCards.map((card) => (
            <Link
              key={card.name}
              to={card.href}
              className="bg-white rounded-xl p-4 card-hover border border-gray-100"
            >
              <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center mb-3`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-medium text-gray-900">{card.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Applications</h2>
            <Link to="/applications" className="text-primary-600 text-sm hover:text-primary-700 flex items-center">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentApplications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No applications yet</p>
                <Link to="/jobs" className="text-primary-600 text-sm hover:underline">
                  Browse jobs to get started
                </Link>
              </div>
            ) : (
              recentApplications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => navigate(`/applications/${app.id}`)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{app.position}</p>
                      <p className="text-sm text-gray-500">{app.companyName}</p>
                    </div>
                    <span className={`status-badge ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Upcoming Interviews</h2>
            <Link to="/interviews" className="text-primary-600 text-sm hover:text-primary-700 flex items-center">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {upcomingInterviews.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No upcoming interviews</p>
                <Link to="/interview-prep" className="text-primary-600 text-sm hover:underline">
                  Practice with AI interview prep
                </Link>
              </div>
            ) : (
              upcomingInterviews.map((interview) => (
                <div
                  key={interview.id}
                  onClick={() => navigate(`/interviews/${interview.id}`)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{interview.position}</p>
                      <p className="text-sm text-gray-500">{interview.companyName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(interview.scheduledDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{interview.interviewType}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recommended Jobs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden lg:col-span-2">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recommended Jobs</h2>
            <Link to="/jobs" className="text-primary-600 text-sm hover:text-primary-700 flex items-center">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {recommendedJobs.length === 0 ? (
              <div className="p-8 text-center text-gray-500 col-span-full">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Add skills to your resume to get job recommendations</p>
              </div>
            ) : (
              recommendedJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    {job.companyLogo ? (
                      <img src={job.companyLogo} alt={job.company} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{job.title}</p>
                      <p className="text-sm text-gray-500">{job.company}</p>
                      <p className="text-xs text-gray-400 mt-1">{job.location}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Application Stats */}
      {stats && Object.keys(stats.applicationsByStatus).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Application Status Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(stats.applicationsByStatus).map(([status, count]) => (
              <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-500 capitalize">{status}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
