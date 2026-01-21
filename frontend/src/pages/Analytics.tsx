import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { BarChart3, TrendingUp, Target, Users, Calendar, Clock, CheckCircle, XCircle, Activity } from 'lucide-react';

const Analytics: React.FC = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [responseRate, setResponseRate] = useState<any>(null);
  const [skillsData, setSkillsData] = useState<any>(null);
  const [weeklyStats, setWeeklyStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [dashboardRes, responseRes, skillsRes, weeklyRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getResponseRate(),
        analyticsAPI.getSkillsAnalytics(),
        analyticsAPI.getWeeklySummary()
      ]);
      setDashboard(dashboardRes.data);
      setResponseRate(responseRes.data);
      setSkillsData(skillsRes.data);
      setWeeklyStats(weeklyRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500">Track your job search progress</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{dashboard?.overview.totalApplications || 0}</p>
          <p className="text-sm text-gray-500">Total Applications</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{responseRate?.responseRate || 0}%</p>
          <p className="text-sm text-gray-500">Response Rate</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{responseRate?.interviews || 0}</p>
          <p className="text-sm text-gray-500">Interviews</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{responseRate?.offers || 0}</p>
          <p className="text-sm text-gray-500">Offers</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Application Status Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold mb-4">Application Status</h2>
          {dashboard?.applicationsByStatus && Object.keys(dashboard.applicationsByStatus).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(dashboard.applicationsByStatus).map(([status, count]: [string, any]) => {
                const total = dashboard.overview.totalApplications;
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                const colors: Record<string, string> = {
                  applied: 'bg-blue-500', screening: 'bg-yellow-500', interview: 'bg-purple-500',
                  offer: 'bg-green-500', rejected: 'bg-red-500', accepted: 'bg-emerald-500', withdrawn: 'bg-gray-500'
                };
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-gray-700">{status}</span>
                      <span className="text-gray-500">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${colors[status] || 'bg-gray-400'}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No application data yet</p>
          )}
        </div>

        {/* Funnel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold mb-4">Application Funnel</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-full bg-blue-100 rounded-lg p-4 text-center" style={{ width: '100%' }}>
                <p className="text-2xl font-bold text-blue-700">{responseRate?.total || 0}</p>
                <p className="text-sm text-blue-600">Applications</p>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[15px] border-t-blue-200"></div>
            </div>
            <div className="flex items-center justify-center">
              <div className="bg-purple-100 rounded-lg p-4 text-center" style={{ width: '70%' }}>
                <p className="text-2xl font-bold text-purple-700">{responseRate?.responded || 0}</p>
                <p className="text-sm text-purple-600">Responses ({responseRate?.responseRate || 0}%)</p>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[15px] border-t-purple-200"></div>
            </div>
            <div className="flex items-center justify-center">
              <div className="bg-yellow-100 rounded-lg p-4 text-center" style={{ width: '50%' }}>
                <p className="text-2xl font-bold text-yellow-700">{responseRate?.interviews || 0}</p>
                <p className="text-sm text-yellow-600">Interviews ({responseRate?.interviewRate || 0}%)</p>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[15px] border-t-yellow-200"></div>
            </div>
            <div className="flex items-center justify-center">
              <div className="bg-green-100 rounded-lg p-4 text-center" style={{ width: '30%' }}>
                <p className="text-2xl font-bold text-green-700">{responseRate?.offers || 0}</p>
                <p className="text-sm text-green-600">Offers ({responseRate?.offerRate || 0}%)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Summary */}
        {weeklyStats && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">This Week</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{weeklyStats.applications}</p>
                <p className="text-sm text-blue-600">Applications</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-700">{weeklyStats.interviews}</p>
                <p className="text-sm text-purple-600">Interviews</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{weeklyStats.networkingActivities}</p>
                <p className="text-sm text-green-600">Networking</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-yellow-700">{weeklyStats.resumesCreated}</p>
                <p className="text-sm text-yellow-600">Resumes</p>
              </div>
            </div>
          </div>
        )}

        {/* Skills Analysis */}
        {skillsData && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">Skills Gap Analysis</h2>
            {skillsData.skillGaps && skillsData.skillGaps.length > 0 ? (
              <>
                <p className="text-sm text-gray-500 mb-4">Skills frequently requested in jobs you've applied for:</p>
                <div className="space-y-3">
                  {skillsData.mostRequestedSkills?.slice(0, 5).map(([skill, count]: [string, number]) => (
                    <div key={skill} className="flex items-center justify-between">
                      <span className="text-gray-700">{skill}</span>
                      <span className="text-sm text-gray-500">{count} jobs</span>
                    </div>
                  ))}
                </div>
                {skillsData.skillGaps.length > 0 && (
                  <>
                    <h3 className="font-medium mt-6 mb-3 text-red-600">Missing Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {skillsData.skillGaps.slice(0, 8).map(([skill, count]: [string, number]) => (
                        <span key={skill} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">{skill}</span>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-center py-8">Apply to more jobs to see skills analysis</p>
            )}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {dashboard?.recentActivity && dashboard.recentActivity.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {dashboard.recentActivity.map((activity: any) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Activity className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900">{activity.action.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-gray-500">{new Date(activity.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
