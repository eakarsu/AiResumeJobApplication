import React, { useState } from 'react';
import { aiAPI } from '../services/api';
import { Sparkles, Loader2, MessageSquare, ThumbsUp, ThumbsDown, Send } from 'lucide-react';

const InterviewPrep: React.FC = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [interviewType, setInterviewType] = useState('behavioral');
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<any>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadTestData = () => {
    setJobTitle('Senior Software Engineer');
    setCompany('Google');
    setInterviewType('behavioral');
  };

  const handleGenerate = async () => {
    if (!jobTitle) return;
    setLoading(true);
    setQuestions([]);
    setSelectedQuestion(null);
    setMessage({ type: '', text: '' });
    try {
      const response = await aiAPI.generateInterviewQuestions({ jobTitle, company, interviewType, count: 10 });
      setQuestions(response.data.questions || response.data);
      setMessage({ type: 'success', text: `Generated ${(response.data.questions || response.data).length} interview questions!` });
    } catch (error: any) {
      console.error('Failed to generate questions:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to generate questions. Check your OpenRouter API key.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!selectedQuestion || !userAnswer) return;
    setEvaluating(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await aiAPI.evaluateAnswer(selectedQuestion.question, userAnswer, `Role: ${jobTitle} at ${company}`);
      setEvaluation(response.data);
      setMessage({ type: 'success', text: 'Answer evaluated!' });
    } catch (error: any) {
      console.error('Failed to evaluate:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to evaluate answer. Check your OpenRouter API key.' });
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Interview Prep</h1>
        <p className="text-gray-500">Practice with AI-generated interview questions</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Setup */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Generate Practice Questions</h2>
          <button onClick={loadTestData} className="text-sm text-primary-600 hover:underline">Load Test Data</button>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Job Title *" className="input-field" />
          <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company (optional)" className="input-field" />
          <select value={interviewType} onChange={(e) => setInterviewType(e.target.value)} className="input-field">
            <option value="behavioral">Behavioral</option>
            <option value="technical">Technical</option>
            <option value="situational">Situational</option>
            <option value="general">General</option>
          </select>
          <button onClick={handleGenerate} disabled={!jobTitle || loading} className="btn-primary flex items-center justify-center">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 mr-2" />Generate</>}
          </button>
        </div>
      </div>

      {/* Questions */}
      {questions.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Question List */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">Questions ({questions.length})</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {questions.map((q, index) => (
                <div
                  key={index}
                  onClick={() => { setSelectedQuestion(q); setUserAnswer(''); setEvaluation(null); }}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedQuestion === q ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-primary-600">Q{index + 1}</span>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{q.difficulty}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">{q.category}</span>
                    </div>
                  </div>
                  <p className="text-gray-900">{q.question}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Practice Area */}
          <div className="space-y-6">
            {selectedQuestion ? (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="font-semibold mb-4">Practice Your Answer</h2>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="font-medium text-gray-900">{selectedQuestion.question}</p>
                  </div>
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="input-field min-h-[150px] mb-4"
                  />
                  <button onClick={handleEvaluate} disabled={!userAnswer || evaluating} className="btn-primary w-full flex items-center justify-center">
                    {evaluating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5 mr-2" />Get AI Feedback</>}
                  </button>
                </div>

                {/* Evaluation */}
                {evaluation && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-semibold mb-4">AI Feedback</h2>
                    <div className="flex items-center justify-center mb-4">
                      <div className={`text-5xl font-bold ${evaluation.score >= 7 ? 'text-green-600' : evaluation.score >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {evaluation.score}/10
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4">{evaluation.feedback}</p>
                    {evaluation.improvements?.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-2">Suggestions:</h3>
                        <ul className="list-disc pl-5 text-gray-600 space-y-1">
                          {evaluation.improvements.map((imp: string, i: number) => (
                            <li key={i}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Suggested Answer */}
                {selectedQuestion.suggestedAnswer && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-semibold mb-4">Suggested Approach</h2>
                    <p className="text-gray-700 mb-4">{selectedQuestion.suggestedAnswer}</p>
                    {selectedQuestion.tips && (
                      <div className="bg-primary-50 rounded-lg p-4">
                        <p className="text-primary-700"><strong>Tip:</strong> {selectedQuestion.tips}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a question</h3>
                <p className="text-gray-500">Click on a question to practice your answer</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && questions.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to practice?</h3>
          <p className="text-gray-500">Enter a job title and generate AI-powered interview questions</p>
        </div>
      )}
    </div>
  );
};

export default InterviewPrep;
