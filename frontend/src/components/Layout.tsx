import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ToastContainer from './ToastContainer';
import ErrorBoundary from './ErrorBoundary';
import {
  LayoutDashboard,
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
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  Target,
  Search,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Resumes', href: '/resumes', icon: FileText },
  { name: 'Cover Letters', href: '/cover-letters', icon: Mail },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Applications', href: '/applications', icon: ClipboardList },
  { name: 'Interviews', href: '/interviews', icon: Calendar },
  { name: 'Skills', href: '/skills', icon: Award },
  { name: 'Salary', href: '/salary', icon: DollarSign },
  { name: 'Companies', href: '/companies', icon: Building2 },
  { name: 'Network', href: '/network', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

const aiNavigation = [
  { name: 'Job Matcher', href: '/ai-job-matcher', icon: Target },
  { name: 'Keyword Optimizer', href: '/ai-keyword-optimizer', icon: Search },
  { name: 'Cover Letter AI', href: '/ai-cover-letter', icon: Mail },
  { name: 'Interview Prep', href: '/interview-prep', icon: MessageSquare },
  { name: 'Salary Negotiator', href: '/ai-salary-negotiator', icon: DollarSign },
];

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { addToast } = useToast();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleResendVerification = async () => {
    try {
      const { authAPI } = await import('../services/api');
      await authAPI.resendVerification();
      addToast('success', 'Verification email sent. Check your console (dev mode).');
    } catch {
      addToast('error', 'Failed to resend verification email.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">AI Resume Pro</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : ''}`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}

          {/* AI Tools Section */}
          <div className="pt-4 mt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>AI Tools</span>
            </div>
            {aiNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : ''}`} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Email verification banner */}
        {user && (user as any).isEmailVerified === false && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center justify-between print:hidden">
            <div className="flex items-center space-x-2 text-yellow-800 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Your email is not verified. Please check your inbox.</span>
            </div>
            <button
              onClick={handleResendVerification}
              className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
            >
              Resend
            </button>
          </div>
        )}

        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 lg:flex-none" />

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-medium">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors rounded-t-lg"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors rounded-b-lg"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default Layout;
