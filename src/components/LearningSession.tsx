'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import Avatar from './Avatar';
import DoubtPanel from './DoubtPanel';
import { Course, MCQ, AvatarState } from '@/types';
import { ChevronLeftIcon, ChevronRightIcon, BookOpenIcon, HelpCircleIcon, CheckCircleIcon, XCircleIcon, ClockIcon, BookIcon, PlayIcon, CheckIcon, CircleIcon } from 'lucide-react';

interface LearningSessionProps {
  course: Course;
  onExit: () => void;
}

export default function LearningSession({ course, onExit }: LearningSessionProps) {
  const { setAvatarState, avatarState, currentTheme } = useStore();
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [currentSubtopicIndex, setCurrentSubtopicIndex] = useState(0);
  const [currentExplanationIndex, setCurrentExplanationIndex] = useState(0);
  const [showQuestions, setShowQuestions] = useState(false);
  const [showMCQs, setShowMCQs] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentMCQIndex, setCurrentMCQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showQuizAnswer, setShowQuizAnswer] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [quizAiSuggestion, setQuizAiSuggestion] = useState<string>('');
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showDoubtPanel, setShowDoubtPanel] = useState(false);

  const currentTopic = course.syllabus[currentTopicIndex];
  const currentSubtopic = currentTopic?.subtopics[currentSubtopicIndex];
  const totalExplanations = currentSubtopic?.content?.explanations?.length || 0;
  const totalQuestions = currentSubtopic?.content?.questions?.length || 0;
  const totalMCQs = currentTopic?.quizContent?.mcqs?.length || 0;

  // Calculate overall progress
  useEffect(() => {
    const totalTopics = course.syllabus.length;
    const currentProgress = ((currentTopicIndex * 100) / totalTopics) + 
                           (((currentSubtopicIndex + 1) * 100) / (totalTopics * (currentTopic?.subtopics.length || 1)));
    setProgress(Math.min(currentProgress, 100));
  }, [currentTopicIndex, currentSubtopicIndex, course.syllabus.length, currentTopic?.subtopics.length]);

  // Set avatar states based on session state
  useEffect(() => {
    if (sessionComplete) {
      setAvatarState('praising');
    } else if (showMCQs) {
      setAvatarState('asking');
    } else if (showQuestions) {
      setAvatarState('asking');
    } else {
      setAvatarState('explaining');
    }
  }, [sessionComplete, showMCQs, showQuestions, setAvatarState]);

  // Save progress automatically
  useEffect(() => {
    const saveProgress = async () => {
      try {
        await fetch(`/api/progress/${course._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            checkpoint: {
              topicIndex: currentTopicIndex,
              subtopicIndex: currentSubtopicIndex,
              position: currentExplanationIndex,
            },
          }),
        });
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    };

    // Debounce progress saving
    const timeoutId = setTimeout(saveProgress, 1000);
    return () => clearTimeout(timeoutId);
  }, [course._id, currentTopicIndex, currentSubtopicIndex, currentExplanationIndex]);

  // Load subtopic content on-demand
  const loadSubtopicContent = async (topicIndex: number, subtopicIndex: number) => {
    setIsLoadingContent(true);
    try {
      const response = await fetch(`/api/subtopic/${course._id}/${topicIndex}/${subtopicIndex}`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        // Update course data with loaded content
        const updatedCourse = { ...course };
        updatedCourse.syllabus[topicIndex].subtopics[subtopicIndex] = {
          ...updatedCourse.syllabus[topicIndex].subtopics[subtopicIndex],
          content: data.content,
          contentGenerated: true
        };
        // You might want to use a state management solution for this
        // For now, we'll trigger a re-render by updating a local state
      }
    } catch (error) {
      console.error('Failed to load subtopic content:', error);
    } finally {
      setIsLoadingContent(false);
    }
  };

  // Load topic quiz on-demand
  const loadTopicQuiz = async (topicIndex: number) => {
    setIsLoadingQuiz(true);
    try {
      const response = await fetch(`/api/quiz/${course._id}/${topicIndex}`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        // Update course data with loaded quiz
        const updatedCourse = { ...course };
        updatedCourse.syllabus[topicIndex] = {
          ...updatedCourse.syllabus[topicIndex],
          quizContent: data.quizContent,
          quizGenerated: true
        };
      }
    } catch (error) {
      console.error('Failed to load topic quiz:', error);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  // Load content when subtopic changes
  useEffect(() => {
    if (currentSubtopic && !currentSubtopic.contentGenerated) {
      loadSubtopicContent(currentTopicIndex, currentSubtopicIndex);
    }
  }, [currentTopicIndex, currentSubtopicIndex]);

  // Load quiz when moving to MCQs
  useEffect(() => {
    if (showMCQs && currentTopic && !currentTopic.quizGenerated) {
      loadTopicQuiz(currentTopicIndex);
    }
  }, [showMCQs, currentTopicIndex]);

  const nextExplanation = () => {
    if (currentExplanationIndex < totalExplanations - 1) {
      setCurrentExplanationIndex(currentExplanationIndex + 1);
    } else {
      // Move to questions
      setShowQuestions(true);
      setCurrentQuestionIndex(0);
    }
  };

  const handlePracticeAnswer = async (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowAnswer(true);
    
    const currentQuestion = currentSubtopic.content?.questions?.[currentQuestionIndex];
    if (currentQuestion && answerIndex === currentQuestion.correct) {
      setAvatarState('praising');
      setAiSuggestion('');
    } else {
      setAvatarState('consoling');
      // Generate AI suggestion for wrong answer only if no built-in explanation
      if (!currentQuestion.explanation) {
        setIsLoadingSuggestion(true);
        try {
          const response = await fetch('/api/mcq-suggestion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              question: currentQuestion.question,
              correctAnswer: currentQuestion.options[currentQuestion.correct],
              userAnswer: currentQuestion.options[answerIndex],
            context: [
              currentSubtopic.description,
              ...(currentSubtopic.content?.explanations || [])
            ]
            }),
          });
          if (response.ok) {
            const data = await response.json();
            setAiSuggestion(data.suggestion);
          }
        } catch (error) {
          console.error('Failed to get AI suggestion:', error);
        } finally {
          setIsLoadingSuggestion(false);
        }
      }
    }

    // Auto-advance after 3 seconds
    setTimeout(() => {
      nextQuestion();
    }, 3000);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setAiSuggestion('');
      setAvatarState('asking');
    } else {
      // Move to MCQs for the entire topic
      setShowQuestions(false);
      setShowMCQs(true);
      setCurrentMCQIndex(0);
    }
  };

  const handleMCQAnswer = async (answerIndex: number) => {
    setSelectedQuizAnswer(answerIndex);
    setShowQuizAnswer(true);
    
    const currentMCQ = getCurrentMCQ();
    if (currentMCQ && answerIndex === currentMCQ.correct) {
      setAvatarState('praising');
      setQuizAiSuggestion('');
    } else {
      setAvatarState('consoling');
      // Generate AI suggestion for wrong answer only if no built-in explanation
      if (!currentMCQ.explanation) {
        setIsLoadingSuggestion(true);
        try {
          const response = await fetch('/api/mcq-suggestion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              question: currentMCQ.question,
              correctAnswer: currentMCQ.options[currentMCQ.correct],
              userAnswer: currentMCQ.options[answerIndex],
              context: [
                currentTopic.topic,
                ...currentTopic.subtopics.flatMap(st => st.explanations)
              ]
            }),
          });
          if (response.ok) {
            const data = await response.json();
            setQuizAiSuggestion(data.suggestion);
          }
        } catch (error) {
          console.error('Failed to get AI suggestion:', error);
        } finally {
          setIsLoadingSuggestion(false);
        }
      }
    }

    // Auto-advance after 4 seconds to give time to read suggestion
    setTimeout(() => {
      nextMCQ();
    }, 4000);
  };

  const getCurrentMCQ = () => {
    if (!currentTopic.quizContent?.mcqs) return null;
    return currentTopic.quizContent.mcqs[currentMCQIndex] || null;
  };

  const nextMCQ = () => {
    if (currentMCQIndex < totalMCQs - 1) {
      setCurrentMCQIndex(currentMCQIndex + 1);
      setSelectedQuizAnswer(null);
      setShowQuizAnswer(false);
      setQuizAiSuggestion('');
      setAvatarState('asking');
    } else {
      // Move to next subtopic or topic
      nextSubtopic();
    }
  };

  const nextSubtopic = () => {
    if (currentSubtopicIndex < currentTopic.subtopics.length - 1) {
      setCurrentSubtopicIndex(currentSubtopicIndex + 1);
      setCurrentExplanationIndex(0);
      setShowQuestions(false);
      setShowMCQs(false);
      setCurrentQuestionIndex(0);
      setCurrentMCQIndex(0);
      setSelectedAnswer(null);
      setSelectedQuizAnswer(null);
      setShowAnswer(false);
      setShowQuizAnswer(false);
      setAiSuggestion('');
      setQuizAiSuggestion('');
    } else {
      nextTopic();
    }
  };

  const nextTopic = () => {
    if (currentTopicIndex < course.syllabus.length - 1) {
      setCurrentTopicIndex(currentTopicIndex + 1);
      setCurrentSubtopicIndex(0);
      setCurrentExplanationIndex(0);
      setShowQuestions(false);
      setShowMCQs(false);
      setCurrentQuestionIndex(0);
      setCurrentMCQIndex(0);
      setSelectedAnswer(null);
      setSelectedQuizAnswer(null);
      setShowAnswer(false);
      setShowQuizAnswer(false);
      setAiSuggestion('');
      setQuizAiSuggestion('');
    } else {
      // Course complete!
      setSessionComplete(true);
    }
  };

  if (sessionComplete) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="learning-card text-center">
            <div className="flex justify-center mb-6">
              <Avatar size="xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">🎉 Course Completed!</h1>
            <p className="text-xl text-gray-600 mb-8">
              Congratulations! You've successfully completed "{course.title}". 
              You're now ready to apply what you've learned!
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/'}
                className="theme-button primary-button"
              >
                Start New Course
              </button>
              <button
                onClick={onExit}
                className="theme-button secondary-button"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentSubtopic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onExit}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {course.title}
                </h1>
                <p className="text-sm text-gray-500">
                  {currentTopic.topic}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowDoubtPanel(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                title="Ask a doubt"
              >
                <HelpCircleIcon className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">Need Help?</span>
              </button>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-600">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Syllabus Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-8 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <BookIcon className="w-5 h-5 text-blue-500" />
                  Syllabus
                </h2>
                {course.totalDuration && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <ClockIcon className="w-4 h-4" />
                    {course.totalDuration}
                  </div>
                )}
                <div className="w-full bg-gray-200 rounded-full h-1 mb-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs font-medium text-gray-600 mb-4">
                  {Math.round(progress)}% Complete
                </div>
              </div>
              
              <div className="p-4 space-y-2">
                {course.syllabus.map((topic, topicIdx) => {
                  const isCurrentTopic = topicIdx === currentTopicIndex;
                  const isCompletedTopic = topicIdx < currentTopicIndex;
                  
                  return (
                    <div key={topicIdx} className="space-y-1">
                      <div className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                        isCurrentTopic 
                          ? 'bg-blue-50 border-l-2 border-blue-500'
                          : isCompletedTopic
                          ? 'bg-green-50 border-l-2 border-green-500'
                          : 'hover:bg-gray-50'
                      }`}>
                        <div className="flex-shrink-0">
                          {isCompletedTopic ? (
                            <CheckIcon className="w-4 h-4 text-green-600" />
                          ) : isCurrentTopic ? (
                            <PlayIcon className="w-4 h-4 text-blue-600" />
                          ) : (
                            <CircleIcon className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-sm font-medium truncate ${
                            isCurrentTopic
                              ? 'text-blue-900'
                              : isCompletedTopic
                              ? 'text-green-900'
                              : 'text-gray-700'
                          }`}>
                            {topicIdx + 1}. {topic.topic}
                          </h3>
                          {topic.duration && (
                            <p className="text-xs text-gray-500">{topic.duration}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Subtopics */}
                      <div className="ml-6 space-y-1">
                        {topic.subtopics.map((subtopic, subtopicIdx) => {
                          const isCurrentSubtopic = isCurrentTopic && subtopicIdx === currentSubtopicIndex;
                          const isCompletedSubtopic = isCompletedTopic || 
                            (isCurrentTopic && subtopicIdx < currentSubtopicIndex);
                          
                          return (
                            <div 
                              key={subtopicIdx} 
                              className={`flex items-center gap-2 p-1 rounded text-xs transition-colors ${
                                isCurrentSubtopic
                                  ? 'bg-blue-100 text-blue-800'
                                  : isCompletedSubtopic
                                  ? 'bg-green-100 text-green-700'
                                  : 'text-gray-600'
                              }`}
                            >
                              <div className="flex-shrink-0">
                                {isCompletedSubtopic ? (
                                  <CheckIcon className="w-3 h-3" />
                                ) : isCurrentSubtopic ? (
                                  <PlayIcon className="w-3 h-3" />
                                ) : (
                                  <CircleIcon className="w-3 h-3 text-gray-300" />
                                )}
                              </div>
                              <span className="truncate">
                                {subtopicIdx + 1}. {subtopic.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
            
            {/* Avatar Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-4">
                    <Avatar size="character" showAsCharacter={true} className="w-full h-full" />
                  </div>
                  <div className="text-center">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-sm text-gray-700">
                        {avatarState === 'loading' && "Let me think about this..."}
                        {avatarState === 'explaining' && "Let me explain this concept!"}
                        {avatarState === 'asking' && "Ready for a question?"}
                        {avatarState === 'praising' && "Excellent work! 🎉"}
                        {avatarState === 'consoling' && "Don't worry, let's try again!"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  {!showQuestions && !showMCQs && (
                    <div>
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                          <BookOpenIcon className="w-6 h-6 text-blue-500" />
                          {currentSubtopic.name}
                        </h2>
                        <p className="text-gray-600">{currentSubtopic.description}</p>
                      </div>
                      
                      <div className="mb-6">
                        {isLoadingContent ? (
                          <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500/30 border-t-blue-500 mb-4"></div>
                            <p className="text-gray-600">Loading content...</p>
                          </div>
                        ) : currentSubtopic.content?.explanations ? (
                          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                            <p className="text-lg leading-relaxed text-gray-800">
                              {currentSubtopic.content.explanations[currentExplanationIndex]}
                            </p>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="text-4xl mb-2">📚</div>
                            <p className="text-gray-500">Content not available yet</p>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-gray-500 text-sm flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Step {currentExplanationIndex + 1} of {totalExplanations}
                        </div>
                        <button
                          onClick={nextExplanation}
                          disabled={isLoadingContent}
                          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {currentExplanationIndex < totalExplanations - 1 ? 'Next' : 'Practice Questions'}
                          <ChevronRightIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {showQuestions && !showMCQs && (
                    <div>
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                          <HelpCircleIcon className="w-6 h-6 text-green-500" />
                          Practice Time! 🎯
                        </h2>
                        <p className="text-gray-600">Test your understanding with these practice questions</p>
                      </div>
                      
                      {(() => {
                        const currentQuestion = currentSubtopic.content?.questions?.[currentQuestionIndex];
                        if (!currentQuestion) return <div className="text-gray-600">Loading question...</div>;

                        return (
                          <div className="mb-6">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                              <p className="text-lg font-medium text-gray-900">
                                {currentQuestion.question}
                              </p>
                            </div>
                            <div className="space-y-3">
                              {currentQuestion.options.map((option, index) => (
                                <button
                                  key={index}
                                  onClick={() => !showAnswer && handlePracticeAnswer(index)}
                                  disabled={showAnswer}
                                  className={`w-full p-4 text-left rounded-lg border transition-colors ${
                                    showAnswer
                                      ? index === currentQuestion.correct
                                        ? 'bg-green-50 border-green-500 text-green-900'
                                        : index === selectedAnswer
                                        ? 'bg-red-50 border-red-500 text-red-900'
                                        : 'bg-gray-50 border-gray-300 text-gray-500'
                                      : selectedAnswer === index
                                      ? 'bg-blue-50 border-blue-500 text-blue-900'
                                      : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                      showAnswer
                                        ? index === currentQuestion.correct
                                          ? 'bg-green-500 text-white'
                                          : index === selectedAnswer
                                          ? 'bg-red-500 text-white'
                                          : 'bg-gray-400 text-white'
                                        : selectedAnswer === index
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-300 text-gray-700'
                                    }`}>
                                      {String.fromCharCode(65 + index)}
                                    </span>
                                    <span className="flex-1">{option}</span>
                                    {showAnswer && index === currentQuestion.correct && (
                                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                    )}
                                    {showAnswer && index === selectedAnswer && index !== currentQuestion.correct && (
                                      <XCircleIcon className="w-5 h-5 text-red-500" />
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>

                            {showAnswer && (
                              <div className="mt-4">
                                <div className={`p-4 rounded-lg border ${
                                  selectedAnswer === currentQuestion.correct 
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-red-50 border-red-200'
                                }`}>
                                  <p className={`font-bold mb-2 ${
                                    selectedAnswer === currentQuestion.correct
                                      ? 'text-green-800'
                                      : 'text-red-800'
                                  }`}>
                                    {selectedAnswer === currentQuestion.correct ? '🎉 Correct! Well done!' : '💡 Not quite right, but that\'s okay!'}
                                  </p>
                                  {/* Show explanation from MCQ if available, otherwise AI suggestion */}
                                  {currentQuestion.explanation && selectedAnswer !== currentQuestion.correct && (
                                    <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                      <div className="flex items-start gap-2">
                                        <span className="text-amber-600 text-sm mt-0.5">📝</span>
                                        <div>
                                          <p className="text-sm font-semibold text-amber-800 mb-1">Explanation:</p>
                                          <p className="text-sm text-amber-700">{currentQuestion.explanation}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {aiSuggestion && !currentQuestion.explanation && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                      <div className="flex items-start gap-2">
                                        <span className="text-blue-600 text-sm mt-0.5">💡</span>
                                        <div>
                                          <p className="text-sm font-semibold text-blue-800 mb-1">AI Tutor Says:</p>
                                          <p className="text-sm text-blue-700">{aiSuggestion}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {isLoadingSuggestion && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                      <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400/30 border-t-blue-600"></div>
                                        <span className="text-sm text-blue-600">AI tutor is thinking...</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="flex justify-between items-center mt-4">
                        <div className="text-gray-500 text-sm flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Question {currentQuestionIndex + 1} of {totalQuestions}
                        </div>
                        {!showAnswer && (
                          <div className="text-gray-500 text-sm flex items-center gap-2">
                            <span className="animate-pulse">💭</span>
                            Select an answer to continue
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showMCQs && (
                    <div>
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                          <CheckCircleIcon className="w-6 h-6 text-purple-500" />
                          Quiz Challenge! 🎆
                        </h2>
                        <p className="text-gray-600">Show what you've learned with this comprehensive quiz</p>
                      </div>
                  
                      {isLoadingQuiz ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500/30 border-t-purple-500 mb-4"></div>
                          <p className="text-gray-600">Loading quiz...</p>
                        </div>
                      ) : (() => {
                        const mcq = getCurrentMCQ();
                        if (!mcq) return (
                          <div className="text-center py-8">
                            <div className="text-4xl mb-2">🤔</div>
                            <p className="text-gray-500">No quiz questions available</p>
                          </div>
                        );

                        return (
                          <div className="mb-6">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                              <p className="text-lg font-medium text-gray-900">
                                {mcq.question}
                              </p>
                            </div>
                            {/* MCQ Options similar to practice questions */}
                            <div className="space-y-3 mb-4">
                              {mcq.options.map((option, index) => (
                                <button
                                  key={index}
                                  onClick={() => !showQuizAnswer && handleMCQAnswer(index)}
                                  disabled={showQuizAnswer}
                                  className={`w-full p-4 text-left rounded-lg border transition-colors ${
                                    showQuizAnswer
                                      ? index === mcq.correct
                                        ? 'bg-green-50 border-green-500 text-green-900'
                                        : index === selectedQuizAnswer
                                        ? 'bg-red-50 border-red-500 text-red-900'
                                        : 'bg-gray-50 border-gray-300 text-gray-500'
                                      : selectedQuizAnswer === index
                                      ? 'bg-purple-50 border-purple-500 text-purple-900'
                                      : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                      showQuizAnswer
                                        ? index === mcq.correct
                                          ? 'bg-green-500 text-white'
                                          : index === selectedQuizAnswer
                                          ? 'bg-red-500 text-white'
                                          : 'bg-gray-400 text-white'
                                        : selectedQuizAnswer === index
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-gray-300 text-gray-700'
                                    }`}>
                                      {String.fromCharCode(65 + index)}
                                    </span>
                                    <span className="flex-1">{option}</span>
                                    {showQuizAnswer && index === mcq.correct && (
                                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                    )}
                                    {showQuizAnswer && index === selectedQuizAnswer && index !== mcq.correct && (
                                      <XCircleIcon className="w-5 h-5 text-red-500" />
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>

                            <div className="flex justify-between items-center">
                              <div className="text-gray-500 text-sm flex items-center gap-2">
                                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                Question {currentMCQIndex + 1} of {totalMCQs}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
      </main>
      
      {/* Doubt Panel */}
      <DoubtPanel
        courseId={course._id.toString()}
        context={[
          currentSubtopic.description,
          ...(currentSubtopic.content?.explanations?.slice(0, currentExplanationIndex + 1) || [])
        ]}
        isOpen={showDoubtPanel}
        onClose={() => setShowDoubtPanel(false)}
      />
    </div>
  );
}
