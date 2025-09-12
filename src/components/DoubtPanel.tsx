'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { HelpCircleIcon, XIcon, SendIcon } from 'lucide-react';

interface DoubtPanelProps {
  courseId: string;
  context: string[];
  isOpen: boolean;
  onClose: () => void;
}

export default function DoubtPanel({ courseId, context, isOpen, onClose }: DoubtPanelProps) {
  const { setAvatarState } = useStore();
  const [doubtQuestion, setDoubtQuestion] = useState('');
  const [doubtAnswer, setDoubtAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmitDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!doubtQuestion.trim()) {
      setError('Please enter your doubt');
      return;
    }

    setIsLoading(true);
    setError('');
    setAvatarState('loading');

    try {
      const response = await fetch(`/api/courses/${courseId}/doubt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doubt: doubtQuestion.trim(),
          context: context,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDoubtAnswer(data.answer);
        setAvatarState('explaining');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to get clarification');
        setAvatarState('consoling');
      }
    } catch (error) {
      console.error('Doubt clarification error:', error);
      setError('Failed to get clarification. Please try again.');
      setAvatarState('consoling');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setDoubtQuestion('');
    setDoubtAnswer('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-blue-500/5 to-purple-500/5 rounded-3xl" />
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/20 rounded-xl blur-sm" />
              <div className="relative p-3 bg-gradient-to-br from-amber-400/20 to-orange-400/20 border border-amber-400/30 rounded-xl">
                <HelpCircleIcon className="w-7 h-7 text-amber-400" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Ask Your Doubt</h2>
              <p className="text-white/60 text-sm mt-1">Get instant clarification from your AI tutor</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-3 hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-110 group"
          >
            <XIcon className="w-6 h-6 text-white/70 group-hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 p-6 overflow-y-auto">
          {!doubtAnswer ? (
            /* Doubt Input Form */
            <form onSubmit={handleSubmitDoubt} className="space-y-6">
              <div>
                <label htmlFor="doubt" className="block text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">🤔</span>
                  What would you like to clarify?
                </label>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 rounded-2xl blur-sm" />
                  <textarea
                    id="doubt"
                    value={doubtQuestion}
                    onChange={(e) => setDoubtQuestion(e.target.value)}
                    placeholder="e.g., I don't understand how this concept works in practice..."
                    className="relative w-full px-6 py-4 bg-white/5 border border-white/20 rounded-2xl focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 outline-none transition-all duration-300 resize-none text-white placeholder-white/50 backdrop-blur-sm"
                    rows={4}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/10 rounded-2xl blur-sm" />
                  <div className="relative p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-2xl">
                    <p className="text-red-200 flex items-center gap-2">
                      <span className="text-xl">⚠️</span>
                      {error}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isLoading || !doubtQuestion.trim()}
                  className="group relative flex-1 py-4 px-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 shadow-lg shadow-amber-500/25"
                >
                  <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-2xl" />
                  <span className="relative z-10 flex items-center gap-3">
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                        Getting Clarification...
                      </>
                    ) : (
                      <>
                        <SendIcon className="w-5 h-5" />
                        Ask Doubt
                      </>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-8 py-4 bg-white/5 border border-white/20 hover:bg-white/10 hover:border-white/30 text-white rounded-2xl font-medium transition-all duration-300 transform hover:scale-105"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* Doubt Answer Display */
            <div className="space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-sm" />
                <div className="relative p-6 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-2xl">
                  <h4 className="font-bold text-blue-200 mb-3 flex items-center gap-2 text-lg">
                    <span className="text-2xl">🤔</span>
                    Your Question:
                  </h4>
                  <p className="text-blue-100 leading-relaxed">{doubtQuestion}</p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-green-500/10 rounded-2xl blur-sm" />
                <div className="relative p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-2xl">
                  <h4 className="font-bold text-green-200 mb-4 flex items-center gap-2 text-lg">
                    <span className="text-2xl">💡</span>
                    AI Tutor's Clarification:
                  </h4>
                  <div className="text-green-100 whitespace-pre-wrap leading-relaxed text-base">
                    {doubtAnswer}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setDoubtAnswer('');
                    setDoubtQuestion('');
                  }}
                  className="group relative flex-1 py-4 px-6 bg-white/5 border border-white/20 hover:bg-white/10 hover:border-white/30 text-white rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3"
                >
                  <span className="text-xl">❓</span>
                  Ask Another Question
                </button>
                <button
                  onClick={handleClose}
                  className="group relative flex-1 py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 shadow-lg shadow-green-500/25"
                >
                  <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-2xl" />
                  <span className="relative z-10 flex items-center gap-3">
                    <span className="text-xl">🚀</span>
                    Continue Learning
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Context Info */}
        <div className="relative z-10 p-4 border-t border-white/10 bg-gradient-to-r from-white/5 to-white/10">
          <p className="text-sm text-white/70 flex items-center gap-2">
            <span className="text-amber-400">🧠</span>
            Your AI tutor has context from the current lesson to provide relevant clarifications.
          </p>
        </div>
      </div>
    </div>
  );
}
