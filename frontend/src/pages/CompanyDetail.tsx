import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { companiesAPI } from '../services/api';
import { CompanyResearch } from '../types';
import { ArrowLeft, Building2, Star, MapPin, Globe, Linkedin, Users, Calendar, Bookmark, BookmarkCheck, ThumbsUp, ThumbsDown } from 'lucide-react';

const CompanyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyResearch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompany();
  }, [id]);

  const fetchCompany = async () => {
    try {
      const response = await companiesAPI.getOne(id!);
      setCompany(response.data);
    } catch (error) {
      console.error('Failed to fetch company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!company) return;
    try {
      await companiesAPI.toggleBookmark(company.id);
      setCompany({ ...company, isBookmarked: !company.isBookmarked });
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  if (!company) {
    return <div className="text-center py-12">Company not found</div>;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/companies')} className="flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-5 h-5 mr-2" />Back to Companies
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{company.companyName}</h1>
                  <div className="flex items-center space-x-3 mt-1 text-gray-500">
                    {company.industry && <span>{company.industry}</span>}
                    {company.size && <span className="capitalize">• {company.size}</span>}
                  </div>
                </div>
              </div>
              <button onClick={handleBookmark} className={`p-3 rounded-lg ${company.isBookmarked ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                {company.isBookmarked ? <BookmarkCheck className="w-6 h-6" /> : <Bookmark className="w-6 h-6" />}
              </button>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {company.headquarters && (
                <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" />{company.headquarters}</span>
              )}
              {company.founded && (
                <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" />Founded {company.founded}</span>
              )}
              {company.employeeCount && (
                <span className="flex items-center"><Users className="w-4 h-4 mr-1" />{company.employeeCount} employees</span>
              )}
              {company.glassdoorRating && (
                <span className="flex items-center"><Star className="w-4 h-4 mr-1 text-yellow-500" />{company.glassdoorRating} rating</span>
              )}
            </div>

            <div className="flex space-x-3 mt-4">
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm flex items-center">
                  <Globe className="w-4 h-4 mr-2" />Website
                </a>
              )}
              {company.linkedinUrl && (
                <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm flex items-center">
                  <Linkedin className="w-4 h-4 mr-2" />LinkedIn
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          {company.description && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold mb-4">About</h2>
              <p className="text-gray-700 whitespace-pre-line">{company.description}</p>
            </div>
          )}

          {/* Culture */}
          {company.culture && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold mb-4">Culture</h2>
              <p className="text-gray-700 whitespace-pre-line">{company.culture}</p>
            </div>
          )}

          {/* Interview Process */}
          {company.interviewProcess && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold mb-4">Interview Process</h2>
              <p className="text-gray-700 whitespace-pre-line">{company.interviewProcess}</p>
            </div>
          )}

          {/* Pros & Cons */}
          {(company.prosNotes || company.consNotes) && (
            <div className="grid md:grid-cols-2 gap-6">
              {company.prosNotes && (
                <div className="bg-green-50 rounded-xl border border-green-200 p-6">
                  <h2 className="font-semibold mb-4 flex items-center text-green-800">
                    <ThumbsUp className="w-5 h-5 mr-2" />Pros
                  </h2>
                  <p className="text-green-700 whitespace-pre-line">{company.prosNotes}</p>
                </div>
              )}
              {company.consNotes && (
                <div className="bg-red-50 rounded-xl border border-red-200 p-6">
                  <h2 className="font-semibold mb-4 flex items-center text-red-800">
                    <ThumbsDown className="w-5 h-5 mr-2" />Cons
                  </h2>
                  <p className="text-red-700 whitespace-pre-line">{company.consNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Benefits */}
          {company.benefits && company.benefits.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold mb-4">Benefits</h2>
              <div className="flex flex-wrap gap-2">
                {company.benefits.map((benefit, i) => (
                  <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">{benefit}</span>
                ))}
              </div>
            </div>
          )}

          {/* Tech Stack */}
          {company.techStack && company.techStack.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold mb-4">Tech Stack</h2>
              <div className="flex flex-wrap gap-2">
                {company.techStack.map((tech, i) => (
                  <span key={i} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">{tech}</span>
                ))}
              </div>
            </div>
          )}

          {/* Quick Facts */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">Quick Facts</h2>
            <div className="space-y-3 text-sm">
              {company.industry && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Industry</span>
                  <span className="text-gray-900">{company.industry}</span>
                </div>
              )}
              {company.size && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Company Size</span>
                  <span className="text-gray-900 capitalize">{company.size}</span>
                </div>
              )}
              {company.revenue && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Revenue</span>
                  <span className="text-gray-900">{company.revenue}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetail;
