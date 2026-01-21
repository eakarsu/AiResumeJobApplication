import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { salaryAPI } from '../services/api';
import { SalaryResearch } from '../types';
import { ArrowLeft, DollarSign, MapPin, Briefcase, TrendingUp } from 'lucide-react';

const SalaryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [salary, setSalary] = useState<SalaryResearch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalary();
  }, [id]);

  const fetchSalary = async () => {
    try {
      const response = await salaryAPI.getOne(id!);
      setSalary(response.data);
    } catch (error) {
      console.error('Failed to fetch salary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (amount: number) => `$${amount.toLocaleString()}`;

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  if (!salary) {
    return <div className="text-center py-12">Salary data not found</div>;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/salary')} className="flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-5 h-5 mr-2" />Back to Salary Research
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{salary.jobTitle}</h1>
            <div className="flex items-center space-x-4 mt-2 text-gray-500">
              <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" />{salary.location}</span>
              <span className="flex items-center"><Briefcase className="w-4 h-4 mr-1 capitalize" />{salary.experienceLevel}</span>
              {salary.industry && <span>{salary.industry}</span>}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-500 mb-2">Minimum</p>
            <p className="text-3xl font-bold text-gray-900">{formatSalary(salary.salaryMin)}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-6 text-center">
            <p className="text-sm text-green-600 mb-2">Median</p>
            <p className="text-3xl font-bold text-green-600">{formatSalary(salary.salaryMedian)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-500 mb-2">Maximum</p>
            <p className="text-3xl font-bold text-gray-900">{formatSalary(salary.salaryMax)}</p>
          </div>
        </div>

        {/* Salary Range Visualization */}
        <div className="mb-6">
          <h2 className="font-semibold mb-4">Salary Range</h2>
          <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 via-green-500 to-blue-500" style={{ width: '100%' }} />
            <div className="absolute inset-y-0 flex items-center justify-center w-full">
              <div className="relative w-full px-4">
                <div className="absolute left-0 transform -translate-x-1/2 text-xs text-white font-medium bg-black/30 px-2 py-1 rounded">{formatSalary(salary.salaryMin)}</div>
                <div className="absolute left-1/2 transform -translate-x-1/2 text-xs text-white font-bold bg-black/50 px-2 py-1 rounded">{formatSalary(salary.salaryMedian)}</div>
                <div className="absolute right-0 transform translate-x-1/2 text-xs text-white font-medium bg-black/30 px-2 py-1 rounded">{formatSalary(salary.salaryMax)}</div>
              </div>
            </div>
          </div>
        </div>

        {salary.company && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-2">Company</h3>
            <p className="text-gray-700">{salary.company}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryDetail;
