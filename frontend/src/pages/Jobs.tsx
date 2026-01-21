import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI } from '../services/api';
import { Job } from '../types';
import { Briefcase, MapPin, DollarSign, Building2, Search, Filter, Bookmark, BookmarkCheck } from 'lucide-react';

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    locationType: '',
    employmentType: '',
    experienceLevel: ''
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async (page = 1) => {
    setLoading(true);
    try {
      const response = await jobsAPI.getAll({
        page,
        search,
        ...filters
      });
      setJobs(response.data.jobs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleSaveJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const job = jobs.find(j => j.id === jobId);
      if (job?.isSaved) {
        await jobsAPI.unsave(jobId);
      } else {
        await jobsAPI.save(jobId);
      }
      setJobs(jobs.map(j => j.id === jobId ? { ...j, isSaved: !j.isSaved } : j));
    } catch (error) {
      console.error('Failed to save job:', error);
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    const format = (n: number) => `$${(n / 1000).toFixed(0)}k`;
    if (min && max) return `${format(min)} - ${format(max)}`;
    if (min) return `From ${format(min)}`;
    if (max) return `Up to ${format(max)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <p className="text-gray-500">Find your next opportunity</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs, companies..."
              className="input-with-icon"
            />
          </div>
          <button type="submit" className="btn-primary px-6 flex items-center gap-2 whitespace-nowrap">
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </form>
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.locationType}
            onChange={(e) => setFilters({ ...filters, locationType: e.target.value })}
            className="input-field w-auto min-w-[140px]"
          >
            <option value="">All Locations</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </select>
          <select
            value={filters.employmentType}
            onChange={(e) => setFilters({ ...filters, employmentType: e.target.value })}
            className="input-field w-auto min-w-[140px]"
          >
            <option value="">All Types</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
          </select>
          <select
            value={filters.experienceLevel}
            onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
            className="input-field w-auto min-w-[140px]"
          >
            <option value="">All Levels</option>
            <option value="entry">Entry</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-500">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => navigate(`/jobs/${job.id}`)}
              className="bg-white rounded-xl border border-gray-200 p-5 card-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {job.companyLogo ? (
                    <img src={job.companyLogo} alt={job.company} className="w-14 h-14 rounded-lg object-cover" />
                  ) : (
                    <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-7 h-7 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{job.title}</h3>
                    <p className="text-gray-600">{job.company}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {job.location}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full capitalize">{job.locationType}</span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full capitalize">{job.employmentType}</span>
                      {formatSalary(job.salaryMin, job.salaryMax) && (
                        <span className="flex items-center text-green-600">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {formatSalary(job.salaryMin, job.salaryMax)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => handleSaveJob(job.id, e)}
                  className={`p-2 rounded-lg ${job.isSaved ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:bg-gray-100'}`}
                >
                  {job.isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {job.skills.slice(0, 5).map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
                {job.skills.length > 5 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    +{job.skills.length - 5} more
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center space-x-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchJobs(page)}
                  className={`px-4 py-2 rounded-lg ${
                    page === pagination.page
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Jobs;
