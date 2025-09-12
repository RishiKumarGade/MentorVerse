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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HelpCircleIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Ask Your Doubt</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {!doubtAnswer ? (
            /* Doubt Input Form */
            <form onSubmit={handleSubmitDoubt} className="space-y-4">
              <div>
                <label htmlFor="doubt" className="block text-sm font-medium text-gray-700 mb-2">
                  What would you like to clarify? 🤔
                </label>
                <textarea
                  id="doubt"
                  value={doubtQuestion}
                  onChange={(e) => setDoubtQuestion(e.target.value)}
                  placeholder="e.g., I don't understand how this concept works in practice..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                  rows={4}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading || !doubtQuestion.trim()}
                  className="flex-1 theme-button primary-button py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Getting Clarification...
                    </>
                  ) : (
                    <>
                      <SendIcon className="w-4 h-4" />
                      Ask Doubt
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* Doubt Answer Display */
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Your Question:</h4>
                <p className="text-blue-800">{doubtQuestion}</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                  💡 Clarification:
                </h4>
                <div className="text-green-800 whitespace-pre-wrap leading-relaxed">
                  {doubtAnswer}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDoubtAnswer('');
                    setDoubtQuestion('');
                  }}
                  className="flex-1 theme-button secondary-button py-3"
                >
                  Ask Another Question
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 theme-button primary-button py-3"
                >
                  Continue Learning
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Context Info */}
        <div className="p-4 bg-gray-50 border-t">
          <p className="text-xs text-gray-600">
            💡 Your AI tutor has context from the current lesson to provide relevant clarifications.
          </p>
        </div>
      </div>
    </div>
  );
}
