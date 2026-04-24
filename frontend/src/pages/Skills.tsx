import React, { useState, useEffect } from 'react';
import { skillsAPI, aiAPI } from '../services/api';
import { UserSkill, Skill } from '../types';
import { Plus, Award, TrendingUp, Sparkles, Loader2, Trash2, CheckCircle, Database, ChevronDown, ChevronUp, Clock, Target, Eye } from 'lucide-react';

interface GapAnalysis {
  id: string;
  targetRole: string;
  industry?: string;
  currentSkills: string[];
  missingSkills: string[];
  learningPath: string[];
  resources: string[];
  timeline?: string;
  createdAt: string;
  skillsGapAnalysisId?: string;
}

const Skills: React.FC = () => {
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [trending, setTrending] = useState<Skill[]>([]);
  const [savedAnalyses, setSavedAnalyses] = useState<GapAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showGapModal, setShowGapModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
  const [viewingAnalysis, setViewingAnalysis] = useState<GapAnalysis | null>(null);
  const [targetRole, setTargetRole] = useState('');
  const [formData, setFormData] = useState({ skillName: '', proficiency: 'intermediate', yearsExperience: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSavedSection, setShowSavedSection] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, allRes, trendingRes, analysesRes] = await Promise.all([
        skillsAPI.getUserSkills(),
        skillsAPI.getAll(),
        skillsAPI.getTrending(),
        skillsAPI.getGapAnalyses().catch(() => ({ data: [] }))
      ]);
      setUserSkills(userRes.data);
      setAllSkills(allRes.data);
      setTrending(trendingRes.data);
      setSavedAnalyses(analysesRes.data);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!formData.skillName) return;
    try {
      const response = await skillsAPI.addUserSkill({
        skillName: formData.skillName,
        proficiency: formData.proficiency,
        yearsExperience: formData.yearsExperience ? parseFloat(formData.yearsExperience) : undefined
      });
      setUserSkills([...userSkills, response.data]);
      setShowModal(false);
      setFormData({ skillName: '', proficiency: 'intermediate', yearsExperience: '' });
    } catch (error) {
      console.error('Failed to add skill:', error);
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    try {
      await skillsAPI.removeUserSkill(skillId);
      setUserSkills(userSkills.filter(us => us.skillId !== skillId));
    } catch (error) {
      console.error('Failed to remove skill:', error);
    }
  };

  const handleAnalyzeGap = async () => {
    if (!targetRole) return;
    setAnalyzing(true);
    setMessage({ type: '', text: '' });
    try {
      const currentSkills = userSkills.map(us => us.skill.name);
      const response = await aiAPI.analyzeSkillsGap(currentSkills, targetRole);
      setGapAnalysis(response.data);
      const saved = response.data.skillsGapAnalysisId;
      setMessage({
        type: 'success',
        text: saved
          ? 'Skills gap analysis complete! Results saved to database.'
          : 'Skills gap analysis complete! (Could not save to database)'
      });
      // Refresh saved analyses list
      if (saved) {
        skillsAPI.getGapAnalyses().then(res => setSavedAnalyses(res.data)).catch(() => {});
      }
    } catch (error: any) {
      console.error('Failed to analyze skills gap:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to analyze skills gap. Check your OpenRouter API key.' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteAnalysis = async (id: string) => {
    try {
      await skillsAPI.deleteGapAnalysis(id);
      setSavedAnalyses(savedAnalyses.filter(a => a.id !== id));
    } catch (error) {
      console.error('Failed to delete analysis:', error);
    }
  };

  const loadTestData = () => {
    setTargetRole('Senior Full Stack Developer');
  };

  const getProficiencyColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-gray-200', intermediate: 'bg-blue-200', advanced: 'bg-green-200', expert: 'bg-purple-200'
    };
    return colors[level] || 'bg-gray-200';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Skills</h1>
          <p className="text-gray-500">Manage your skills and identify gaps</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setShowGapModal(true)} className="btn-secondary flex items-center space-x-2">
            <Sparkles className="w-5 h-5" /><span>Skills Gap Analysis</span>
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" /><span>Add Skill</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* My Skills */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">My Skills ({userSkills.length})</h2>
            {userSkills.length === 0 ? (
              <div className="text-center py-8">
                <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No skills added yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {userSkills.map((us) => (
                  <div key={us.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{us.skill.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getProficiencyColor(us.proficiency)}`}>{us.proficiency}</span>
                        {us.yearsExperience && <span className="text-xs text-gray-500">{us.yearsExperience} years</span>}
                      </div>
                    </div>
                    <button onClick={() => handleRemoveSkill(us.skillId)} className="p-2 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trending Skills */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
              Trending Skills
            </h2>
            <div className="space-y-3">
              {trending.slice(0, 10).map((skill) => (
                <div key={skill.id} className="flex items-center justify-between">
                  <span className="text-gray-700">{skill.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${skill.demandScore}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{skill.demandScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Saved AI Gap Analyses */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <button
          onClick={() => setShowSavedSection(!showSavedSection)}
          className="flex items-center justify-between w-full"
        >
          <h2 className="font-semibold flex items-center">
            <Database className="w-5 h-5 mr-2 text-primary-600" />
            Saved AI Gap Analyses ({savedAnalyses.length})
          </h2>
          {showSavedSection ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {showSavedSection && (
          <div className="mt-4">
            {savedAnalyses.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No saved analyses yet</p>
                <p className="text-gray-400 text-sm mt-1">Run a Skills Gap Analysis to see results here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedAnalyses.map((analysis) => (
                  <div key={analysis.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Target className="w-5 h-5 text-primary-600 flex-shrink-0" />
                          <div>
                            <h3 className="font-medium text-gray-900">{analysis.targetRole}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDate(analysis.createdAt)}
                              </span>
                              {analysis.industry && (
                                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{analysis.industry}</span>
                              )}
                              <span className="text-red-500 font-medium">{analysis.missingSkills?.length || 0} missing skills</span>
                            </div>
                          </div>
                        </div>
                        {/* Quick preview of missing skills */}
                        {analysis.missingSkills?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
                            {analysis.missingSkills.slice(0, 5).map((skill, i) => (
                              <span key={i} className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs">{skill}</span>
                            ))}
                            {analysis.missingSkills.length > 5 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{analysis.missingSkills.length - 5} more</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => setViewingAnalysis(analysis)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="View full analysis"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAnalysis(analysis.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete analysis"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Skill Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add Skill</h2>
            <div className="space-y-4">
              <input type="text" value={formData.skillName} onChange={(e) => setFormData({ ...formData, skillName: e.target.value })} placeholder="Skill name" className="input-field" list="skills-list" />
              <datalist id="skills-list">
                {allSkills.map(s => <option key={s.id} value={s.name} />)}
              </datalist>
              <select value={formData.proficiency} onChange={(e) => setFormData({ ...formData, proficiency: e.target.value })} className="input-field">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
              <input type="number" step="0.5" value={formData.yearsExperience} onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })} placeholder="Years of experience" className="input-field" />
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleAddSkill} disabled={!formData.skillName} className="btn-primary flex-1">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Gap Analysis Modal (New Analysis) */}
      {showGapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Skills Gap Analysis</h2>
            {message.text && (
              <div className={`p-3 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}
            {!gapAnalysis ? (
              <>
                <input type="text" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Target role (e.g., Senior Frontend Developer)" className="input-field mb-2" />
                <button onClick={loadTestData} className="text-sm text-primary-600 hover:underline mb-4">Load Test Data</button>
                <div className="flex space-x-3">
                  <button onClick={() => { setShowGapModal(false); setMessage({ type: '', text: '' }); }} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleAnalyzeGap} disabled={!targetRole || analyzing} className="btn-primary flex-1 flex items-center justify-center">
                    {analyzing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Analyze
                  </button>
                </div>
              </>
            ) : (
              <>
                {gapAnalysis.skillsGapAnalysisId && (
                  <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    <Database className="w-4 h-4" />
                    <span>Saved to database</span>
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
                <GapAnalysisDetails analysis={gapAnalysis} />
                <button onClick={() => { setGapAnalysis(null); setShowGapModal(false); setMessage({ type: '', text: '' }); }} className="btn-primary w-full mt-6">Close</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* View Saved Analysis Modal */}
      {viewingAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Gap Analysis: {viewingAnalysis.targetRole}</h2>
              <span className="text-xs text-gray-500">{formatDate(viewingAnalysis.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
              <Database className="w-4 h-4" />
              <span>Loaded from database</span>
            </div>
            <GapAnalysisDetails analysis={viewingAnalysis} />
            <button onClick={() => setViewingAnalysis(null)} className="btn-primary w-full mt-6">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable component for displaying gap analysis details
const GapAnalysisDetails: React.FC<{ analysis: GapAnalysis }> = ({ analysis }) => (
  <div className="space-y-6">
    {analysis.missingSkills?.length > 0 && (
      <div>
        <h3 className="font-medium mb-2 text-red-600">Missing Skills ({analysis.missingSkills.length})</h3>
        <div className="flex flex-wrap gap-2">
          {analysis.missingSkills.map((skill: string, i: number) => (
            <span key={i} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">{skill}</span>
          ))}
        </div>
      </div>
    )}
    {analysis.currentSkills?.length > 0 && (
      <div>
        <h3 className="font-medium mb-2 text-green-600">Current Skills ({analysis.currentSkills.length})</h3>
        <div className="flex flex-wrap gap-2">
          {analysis.currentSkills.map((skill: string, i: number) => (
            <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">{skill}</span>
          ))}
        </div>
      </div>
    )}
    {analysis.learningPath?.length > 0 && (
      <div>
        <h3 className="font-medium mb-2">Learning Path</h3>
        <ol className="list-decimal pl-5 space-y-2">
          {analysis.learningPath.map((step: string, i: number) => (
            <li key={i} className="text-gray-700">{step}</li>
          ))}
        </ol>
      </div>
    )}
    {analysis.resources?.length > 0 && (
      <div>
        <h3 className="font-medium mb-2">Resources</h3>
        <ul className="list-disc pl-5 space-y-1">
          {analysis.resources.map((res: string, i: number) => (
            <li key={i} className="text-gray-600">{res}</li>
          ))}
        </ul>
      </div>
    )}
    {analysis.timeline && (
      <div className="bg-primary-50 rounded-lg p-4">
        <h3 className="font-medium mb-1">Estimated Timeline</h3>
        <p className="text-gray-700">{analysis.timeline}</p>
      </div>
    )}
  </div>
);

export default Skills;
