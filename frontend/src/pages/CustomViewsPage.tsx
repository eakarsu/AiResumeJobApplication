// CustomViewsPage — "Resume Views" hub showing the 4 custom-views features
import React from 'react';
import ApplicationFunnel from '../components/ApplicationFunnel';
import SkillMatchRadar from '../components/SkillMatchRadar';
import ResumeBuilder from '../components/ResumeBuilder';
import CoverLetterBuilder from '../components/CoverLetterBuilder';

const CustomViewsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resume Views</h1>
        <p className="text-sm text-gray-600">
          Funnel analytics, skill match, ATS resume PDF, and cover letter generation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ApplicationFunnel />
        <SkillMatchRadar />
      </div>

      <ResumeBuilder />
      <CoverLetterBuilder />
    </div>
  );
};

export default CustomViewsPage;
