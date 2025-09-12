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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Immersive Header */}
      <header className="relative z-50">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="relative backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={onExit}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 group"
                >
                  <ChevronLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {course.title}
                  </h1>
                  <p className="text-sm text-gray-400">
                    {currentTopic.topic}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowDoubtPanel(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl hover:from-amber-500/30 hover:to-orange-500/30 transition-all duration-300"
                  title="Ask a doubt"
                >
                  <HelpCircleIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Need Help?</span>
                </button>
                <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-300">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative min-h-screen">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-40 right-20 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-green-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Compact Syllabus Sidebar */}
            <div className="lg:col-span-1">
              <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl sticky top-8 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <div className="p-4 mb-6">
                <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <BookIcon className="w-5 h-5 text-blue-400" />
                  Syllabus
                </h2>
                {course.totalDuration && (
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <ClockIcon className="w-4 h-4" />
                    {course.totalDuration}
                  </div>
                )}
                <div className="w-full bg-white/10 rounded-full h-1 mb-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs font-medium text-gray-300 mb-4">
                  {Math.round(progress)}% Complete
                </div>
              </div>
              
              <div className="px-4 pb-4 space-y-2">
                {course.syllabus.map((topic, topicIdx) => {
                  const isCurrentTopic = topicIdx === currentTopicIndex;
                  const isCompletedTopic = topicIdx < currentTopicIndex;
                  
                  return (
                    <div key={topicIdx} className="space-y-1">
                      <div className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                        isCurrentTopic 
                          ? 'bg-blue-500/20 border-l-2 border-blue-400'
                          : isCompletedTopic
                          ? 'bg-green-500/20 border-l-2 border-green-400'
                          : 'bg-white/5'
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
                          <h3 className={`text-xs font-medium truncate ${
                            isCurrentTopic
                              ? 'text-blue-300'
                              : isCompletedTopic
                              ? 'text-green-300'
                              : 'text-gray-400'
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
                              className={`flex items-center gap-2 p-1 rounded text-xs transition-all ${
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
            
            {/* Character Tutor Section */}
            <div className="lg:col-span-1">
              <div className="relative h-96 flex items-end justify-center">
                <Avatar size="character" showAsCharacter={true} className="drop-shadow-2xl" />
                
                {/* Character Speech Bubble */}
                <div className="absolute top-8 right-4 max-w-xs">
                  <div className="relative">
                    <div className="backdrop-blur-sm bg-white/90 text-gray-800 p-3 rounded-2xl rounded-br-sm shadow-xl">
                      <p className="text-sm font-medium">
                        {avatarState === 'loading' && "Let me think about this..."}
                        {avatarState === 'explaining' && "Let me explain this concept!"}
                        {avatarState === 'asking' && "Ready for a question?"}
                        {avatarState === 'praising' && "Excellent work! 🎉"}
                        {avatarState === 'consoling' && "Don't worry, let's try again!"}
                      </p>
                    </div>
                    <div className="absolute bottom-0 right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/90"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Content Section */}
            <div className="lg:col-span-2">
              <div className="relative">
                {/* Content Background */}
                <div className="absolute inset-0 backdrop-blur-sm bg-white/5 border border-white/10 rounded-3xl"></div>
                
                <div className="relative z-10 p-8">
              {!showQuestions && !showMCQs && (
                <div>
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-3 flex items-center gap-3">
                      <BookOpenIcon className="w-8 h-8 text-blue-400" />
                      {currentSubtopic.name}
                    </h2>
                    <p className="text-white/70 text-lg">{currentSubtopic.description}</p>
                  </div>
                  
                  <div className="relative">
                    {isLoadingContent ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/30 border-t-blue-400"></div>
                          <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-blue-400/20"></div>
                        </div>
                        <p className="mt-6 text-white/70 text-lg">Loading content...</p>
                        <div className="mt-2 flex space-x-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-200"></div>
                          <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse animation-delay-400"></div>
                        </div>
                      </div>
                    ) : currentSubtopic.content?.explanations ? (
                      <div className="relative">
                        <div className="absolute inset-0 backdrop-blur-sm bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 rounded-3xl"></div>
                        <div className="relative z-10 p-8">
                          <p className="text-xl leading-relaxed text-white/90 mb-8 font-light">
                            {currentSubtopic.content.explanations[currentExplanationIndex]}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📚</div>
                        <p className="text-white/60 text-lg">Content not available yet</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-8">
                    <div className="text-white/60 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      Step {currentExplanationIndex + 1} of {totalExplanations}
                    </div>
                    <button
                      onClick={nextExplanation}
                      disabled={isLoadingContent}
                      className="group relative overflow-hidden px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                    >
                      <span className="relative z-10">
                        {currentExplanationIndex < totalExplanations - 1 ? 'Next' : 'Practice Questions'}
                      </span>
                      <ChevronRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                      <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                    </button>
                  </div>
                </div>
              )}

              {showQuestions && !showMCQs && (
                <div>
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent mb-3 flex items-center gap-3">
                      <HelpCircleIcon className="w-8 h-8 text-green-400" />
                      Practice Time! 🎯
                    </h2>
                    <p className="text-white/70 text-lg">Test your understanding with these practice questions</p>
                  </div>
                  
                  {(() => {
                    const currentQuestion = currentSubtopic.content?.questions?.[currentQuestionIndex];
                    if (!currentQuestion) return <div>Loading question...</div>;

                    return (
                      <div className="mb-8">
                        <div className="relative mb-8">
                          <div className="absolute inset-0 backdrop-blur-sm bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-white/10 rounded-3xl"></div>
                          <div className="relative z-10 p-6">
                            <p className="text-xl font-medium text-white/90 leading-relaxed">
                              {currentQuestion.question}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {currentQuestion.options.map((option, index) => (
                            <button
                              key={index}
                              onClick={() => !showAnswer && handlePracticeAnswer(index)}
                              disabled={showAnswer}
                              className={`group relative w-full p-5 text-left rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
                                showAnswer
                                  ? index === currentQuestion.correct
                                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400 text-white shadow-lg shadow-green-500/20'
                                    : index === selectedAnswer
                                    ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-2 border-red-400 text-white shadow-lg shadow-red-500/20'
                                    : 'bg-white/5 border border-white/10 text-white/60'
                                  : selectedAnswer === index
                                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                                  : 'bg-white/5 border border-white/10 text-white/90 hover:bg-white/10 hover:border-white/20'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                  showAnswer
                                    ? index === currentQuestion.correct
                                      ? 'bg-green-500 text-white'
                                      : index === selectedAnswer
                                      ? 'bg-red-500 text-white'
                                      : 'bg-white/10 text-white/50'
                                    : selectedAnswer === index
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white/10 text-white/80 group-hover:bg-white/20'
                                }`}>
                                  {String.fromCharCode(65 + index)}
                                </span>
                                <span className="flex-1 text-base font-medium">{option}</span>
                                {showAnswer && index === currentQuestion.correct && (
                                  <CheckCircleIcon className="w-6 h-6 text-green-400 animate-bounce" />
                                )}
                                {showAnswer && index === selectedAnswer && index !== currentQuestion.correct && (
                                  <XCircleIcon className="w-6 h-6 text-red-400 animate-pulse" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>

                        {showAnswer && (
                          <div className="mt-6">
                            <div className={`relative overflow-hidden p-6 rounded-2xl ${
                              selectedAnswer === currentQuestion.correct 
                                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30'
                                : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30'
                            }`}>
                              <p className={`text-lg font-bold mb-4 ${
                                selectedAnswer === currentQuestion.correct
                                  ? 'text-green-100'
                                  : 'text-red-100'
                              }`}>
                                {selectedAnswer === currentQuestion.correct ? '🎉 Correct! Well done!' : '💡 Not quite right, but that\'s okay!'}
                              </p>
                              {/* Show explanation from MCQ if available, otherwise AI suggestion */}
                              {currentQuestion.explanation && selectedAnswer !== currentQuestion.correct && (
                                <div className="mt-4 p-4 bg-amber-500/20 rounded-xl border border-amber-400/30">
                                  <div className="flex items-start gap-3">
                                    <span className="text-amber-300 text-lg mt-0.5">📝</span>
                                    <div>
                                      <p className="text-sm font-bold text-amber-200 mb-2">Explanation:</p>
                                      <p className="text-sm text-amber-100 leading-relaxed">{currentQuestion.explanation}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {aiSuggestion && !currentQuestion.explanation && (
                                <div className="mt-4 p-4 bg-blue-500/20 rounded-xl border border-blue-400/30">
                                  <div className="flex items-start gap-3">
                                    <span className="text-blue-300 text-lg mt-0.5">💡</span>
                                    <div>
                                      <p className="text-sm font-bold text-blue-200 mb-2">AI Tutor Says:</p>
                                      <p className="text-sm text-blue-100 leading-relaxed">{aiSuggestion}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {isLoadingSuggestion && (
                                <div className="mt-4 p-4 bg-blue-500/20 rounded-xl border border-blue-400/30">
                                  <div className="flex items-center gap-3">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400/30 border-t-blue-300"></div>
                                    <span className="text-sm text-blue-200">AI tutor is thinking...</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex justify-between items-center mt-8">
                    <div className="text-white/60 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      Question {currentQuestionIndex + 1} of {totalQuestions}
                    </div>
                    {!showAnswer && (
                      <div className="text-white/50 text-sm flex items-center gap-2">
                        <span className="animate-pulse">💭</span>
                        Select an answer to continue
                      </div>
                    )}
                  </div>
                </div>
              )}

              {showMCQs && (
                <div>
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500 bg-clip-text text-transparent mb-3 flex items-center gap-3">
                      <CheckCircleIcon className="w-8 h-8 text-purple-400" />
                      Quiz Challenge! 🎆
                    </h2>
                    <p className="text-white/70 text-lg">Show what you've learned with this comprehensive quiz</p>
                  </div>
                  
                  {isLoadingQuiz ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-400"></div>
                        <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-purple-400/20"></div>
                      </div>
                      <p className="mt-6 text-white/70 text-lg">Loading quiz...</p>
                      <div className="mt-2 flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse animation-delay-200"></div>
                        <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse animation-delay-400"></div>
                      </div>
                    </div>
                  ) : (() => {
                    const mcq = getCurrentMCQ();
                    if (!mcq) return (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🤔</div>
                        <p className="text-white/60 text-lg">No quiz questions available</p>
                      </div>
                    );

                    return (
                      <div className="mb-8">
                        <div className="relative mb-8">
                          <div className="absolute inset-0 backdrop-blur-sm bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10 border border-white/10 rounded-3xl"></div>
                          <div className="relative z-10 p-6">
                            <p className="text-xl font-medium text-white/90 leading-relaxed">
                              {mcq.question}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {mcq.options.map((option, index) => (
                            <button
                              key={index}
                              onClick={() => !showQuizAnswer && handleMCQAnswer(index)}
                              disabled={showQuizAnswer}
                              className={`group relative w-full p-5 text-left rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
                                showQuizAnswer
                                  ? index === mcq.correct
                                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400 text-white shadow-lg shadow-green-500/20'
                                    : index === selectedQuizAnswer
                                    ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-2 border-red-400 text-white shadow-lg shadow-red-500/20'
                                    : 'bg-white/5 border border-white/10 text-white/60'
                                  : selectedQuizAnswer === index
                                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-400 text-white shadow-lg shadow-purple-500/20'
                                  : 'bg-white/5 border border-white/10 text-white/90 hover:bg-white/10 hover:border-white/20'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                  showQuizAnswer
                                    ? index === mcq.correct
                                      ? 'bg-green-500 text-white'
                                      : index === selectedQuizAnswer
                                      ? 'bg-red-500 text-white'
                                      : 'bg-white/10 text-white/50'
                                    : selectedQuizAnswer === index
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-white/10 text-white/80 group-hover:bg-white/20'
                                }`}>
                                  {String.fromCharCode(65 + index)}
                                </span>
                                <span className="flex-1 text-base font-medium">{option}</span>
                                {showQuizAnswer && index === mcq.correct && (
                                  <CheckCircleIcon className="w-6 h-6 text-green-400 animate-bounce" />
                                )}
                                {showQuizAnswer && index === selectedQuizAnswer && index !== mcq.correct && (
                                  <XCircleIcon className="w-6 h-6 text-red-400 animate-pulse" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>

                        {showQuizAnswer && (
                          <div className="mt-6">
                            <div className={`relative overflow-hidden p-6 rounded-2xl ${
                              selectedQuizAnswer === mcq.correct 
                                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30'
                                : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30'
                            }`}>
                              <p className={`text-lg font-bold mb-4 ${
                                selectedQuizAnswer === mcq.correct
                                  ? 'text-green-100'
                                  : 'text-red-100'
                              }`}>
                                {selectedQuizAnswer === mcq.correct ? '🎉 Excellent! You nailed it!' : '🎯 Good try! Let\'s learn from this.'}
                              </p>
                              {/* Show explanation from MCQ if available, otherwise AI suggestion */}
                              {(() => {
                                const mcq = getCurrentMCQ();
                                return mcq?.explanation && selectedQuizAnswer !== mcq.correct ? (
                                  <div className="mt-4 p-4 bg-amber-500/20 rounded-xl border border-amber-400/30">
                                    <div className="flex items-start gap-3">
                                      <span className="text-amber-300 text-lg mt-0.5">📝</span>
                                      <div>
                                        <p className="text-sm font-bold text-amber-200 mb-2">Explanation:</p>
                                        <p className="text-sm text-amber-100 leading-relaxed">{mcq.explanation}</p>
                                      </div>
                                    </div>
                                  </div>
                                ) : quizAiSuggestion ? (
                                  <div className="mt-4 p-4 bg-purple-500/20 rounded-xl border border-purple-400/30">
                                    <div className="flex items-start gap-3">
                                      <span className="text-purple-300 text-lg mt-0.5">🎓</span>
                                      <div>
                                        <p className="text-sm font-bold text-purple-200 mb-2">AI Tutor Explains:</p>
                                        <p className="text-sm text-purple-100 leading-relaxed">{quizAiSuggestion}</p>
                                      </div>
                                    </div>
                                  </div>
                                ) : null;
                              })()}
                              {isLoadingSuggestion && (
                                <div className="mt-4 p-4 bg-purple-500/20 rounded-xl border border-purple-400/30">
                                  <div className="flex items-center gap-3">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-400/30 border-t-purple-300"></div>
                                    <span className="text-sm text-purple-200">AI tutor is preparing an explanation...</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex justify-between items-center mt-8">
                    <div className="text-white/60 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                      Question {currentMCQIndex + 1} of {totalMCQs}
                    </div>
                  </div>
                </div>
              )}
                </div>
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
