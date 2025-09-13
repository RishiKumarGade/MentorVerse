'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import Avatar from './Avatar';
import DoubtPanel from './DoubtPanel';
import { Course, MCQ, AvatarState } from '@/types';
import { ChevronLeftIcon, ChevronRightIcon, BookOpenIcon, HelpCircleIcon, CheckCircleIcon, XCircleIcon, ClockIcon, BookIcon, PlayIcon, CheckIcon, CircleIcon, SparklesIcon } from 'lucide-react';

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
  const [showSyllabus, setShowSyllabus] = useState(true);
  const [avatarPosition, setAvatarPosition] = useState<'left' | 'right'>('right');

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
        const updatedCourse = { ...course };
        updatedCourse.syllabus[topicIndex].subtopics[subtopicIndex] = {
          ...updatedCourse.syllabus[topicIndex].subtopics[subtopicIndex],
          content: data.content,
          contentGenerated: true
        };
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
      if (!currentQuestion?.explanation) {
        setIsLoadingSuggestion(true);
        try {
          const response = await fetch('/api/mcq-suggestion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              question: currentQuestion!.question,
              correctAnswer: currentQuestion!.options[currentQuestion!.correct],
              userAnswer: currentQuestion!.options[answerIndex],
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
      if (!currentMCQ?.explanation) {
        setIsLoadingSuggestion(true);
        try {
          const response = await fetch('/api/mcq-suggestion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              question: currentMCQ!.question,
              correctAnswer: currentMCQ!.options[currentMCQ!.correct],
              userAnswer: currentMCQ!.options[answerIndex],
              context: [
                currentTopic.topic,
                ...currentTopic.subtopics.flatMap(st => st.content?.explanations || [])
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
      setSessionComplete(true);
    }
  };

  if (sessionComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-8 -left-8 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400/10 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>

        <div className="max-w-2xl w-full relative z-10">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center border border-white/20">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-lg opacity-75 animate-pulse"></div>
                <Avatar size="xl" className="relative z-10" />
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-4">
              <SparklesIcon className="w-8 h-8 text-yellow-500 animate-spin" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Course Completed!
              </h1>
              <SparklesIcon className="w-8 h-8 text-yellow-500 animate-spin" />
            </div>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              🎉 Congratulations! You've successfully completed <span className="font-semibold text-purple-600">"{course.title}"</span>. 
              You're now ready to apply what you've learned!
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => window.location.href = '/'}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Start New Course
              </button>
              <button
                onClick={onExit}
                className="px-8 py-3 bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl border border-gray-200"
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-white/20 mx-auto"></div>
          </div>
          <p className="text-white text-lg font-medium">Loading course content...</p>
        </div>
      </div>
    );
  }

  // Theme-based styling
  const themeColors = currentTheme.colors;
  const primaryColor = themeColors.primary;
  const secondaryColor = themeColors.secondary;
  const accentColor = themeColors.accent;

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}15 0%, ${secondaryColor}15 50%, ${accentColor}15 100%)`
      }}
    >
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-10 w-64 h-64 rounded-full blur-3xl animate-float"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)`
          }}
        ></div>
        <div
          className="absolute top-96 right-20 w-96 h-96 rounded-full blur-3xl animate-float-delayed"
          style={{
            background: `linear-gradient(135deg, ${secondaryColor}15, ${accentColor}15)`
          }}
        ></div>
        <div
          className="absolute bottom-32 left-1/3 w-80 h-80 rounded-full blur-3xl animate-float-slow"
          style={{
            background: `linear-gradient(135deg, ${accentColor}15, ${primaryColor}15)`
          }}
        ></div>
      </div>

      {/* Header - Simplified */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onExit}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1
                  className="text-xl font-semibold bg-clip-text text"
                  // style={{
                  //   background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                  // }}
                >
                  {course.title}
                </h1>
                <p className="text-sm text-gray-600">
                  {currentTopic.topic}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSyllabus(!showSyllabus)}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${secondaryColor}, ${accentColor})`
                }}
              >
                <BookIcon className="w-4 h-4" />
                <span className="text-sm">{showSyllabus ? 'Hide' : 'Show'} Syllabus</span>
              </button>

              <button
                onClick={() => setShowDoubtPanel(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105"
              >
                <HelpCircleIcon className="w-4 h-4" />
                <span className="text-sm">Help</span>
              </button>

              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 min-w-[2.5rem]">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Simplified layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        <div className={`grid gap-6 ${showSyllabus ? 'lg:grid-cols-12' : 'lg:grid-cols-1'}`}>
          {/* Syllabus Sidebar - Simplified */}
          {showSyllabus && (
            <div className="lg:col-span-3 transition-all duration-300 ease-in-out">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 sticky top-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <div className="p-4 border-b border-gray-100">
                  <h2
                    className="text-lg font-semibold bg-clip-text text-transparent mb-2 flex items-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                    }}
                  >
                    <BookIcon className="w-5 h-5" style={{ color: secondaryColor }} />
                    Syllabus
                  </h2>
                  {course.totalDuration && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <ClockIcon className="w-4 h-4" />
                      {course.totalDuration}
                    </div>
                  )}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                      }}
                    />
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    {Math.round(progress)}% Complete
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  {course.syllabus.map((topic, topicIdx) => {
                    const isCurrentTopic = topicIdx === currentTopicIndex;
                    const isCompletedTopic = topicIdx < currentTopicIndex;

                    return (
                      <div key={topicIdx} className="space-y-2">
                        <div
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                            isCurrentTopic
                              ? 'shadow-md'
                              : isCompletedTopic
                              ? 'shadow-sm'
                              : 'hover:shadow-sm'
                          }`}
                          style={{
                            background: isCurrentTopic
                              ? `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)`
                              : isCompletedTopic
                              ? `linear-gradient(135deg, #10b98110, #05966910)`
                              : undefined,
                            borderLeft: isCurrentTopic
                              ? `4px solid ${secondaryColor}`
                              : isCompletedTopic
                              ? `4px solid #10b981`
                              : undefined
                          }}
                        >
                          <div className="flex-shrink-0">
                            {isCompletedTopic ? (
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{
                                  background: `linear-gradient(135deg, #10b981, #059669)`
                                }}
                              >
                                <CheckIcon className="w-4 h-4 text-white" />
                              </div>
                            ) : isCurrentTopic ? (
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center animate-pulse"
                                style={{
                                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                                }}
                              >
                                <PlayIcon className="w-3 h-3 text-white ml-0.5" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                <CircleIcon className="w-3 h-3 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-sm font-semibold truncate ${
                              isCurrentTopic
                                ? 'text-gray-900'
                                : isCompletedTopic
                                ? 'text-green-900'
                                : 'text-gray-700'
                            }`}>
                              {topicIdx + 1}. {topic.topic}
                            </h3>
                            {topic.duration && (
                              <p className="text-xs text-gray-500 mt-1">{topic.duration}</p>
                            )}
                          </div>
                        </div>

                        <div className="ml-8 space-y-1">
                          {topic.subtopics.map((subtopic, subtopicIdx) => {
                            const isCurrentSubtopic = isCurrentTopic && subtopicIdx === currentSubtopicIndex;
                            const isCompletedSubtopic = isCompletedTopic ||
                              (isCurrentTopic && subtopicIdx < currentSubtopicIndex);

                            return (
                              <div
                                key={subtopicIdx}
                                className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-all duration-300 ${
                                  isCurrentSubtopic
                                    ? 'shadow-sm'
                                    : isCompletedSubtopic
                                    ? 'text-green-700'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                                style={{
                                  background: isCurrentSubtopic
                                    ? `${secondaryColor}15`
                                    : isCompletedSubtopic
                                    ? '#10b98115'
                                    : undefined
                                }}
                              >
                                <div className="flex-shrink-0">
                                  {isCompletedSubtopic ? (
                                    <CheckIcon className="w-3 h-3" />
                                  ) : isCurrentSubtopic ? (
                                    <PlayIcon className="w-3 h-3 animate-pulse" />
                                  ) : (
                                    <CircleIcon className="w-3 h-3 text-gray-300" />
                                  )}
                                </div>
                                <span className="truncate font-medium">
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
          )}

          {/* Content Section - Dynamic column span based on syllabus visibility */}
          <div className={`${showSyllabus ? 'lg:col-span-9 lg:pr-40 xl:pr-48' : 'lg:col-span-12'} transition-all duration-300 ease-in-out`}>
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="p-8">
                {!showQuestions && !showMCQs && (
                  <div>
                    <div className="mb-8">
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                          <BookOpenIcon className="w-6 h-6 text-white" />
                        </div>
                        {currentSubtopic.name}
                      </h2>
                      <p className="text-gray-600 text-lg leading-relaxed">{currentSubtopic.description}</p>
                    </div>
                    
                    <div className="mb-8">
                      {isLoadingContent ? (
                        <div className="flex flex-col items-center justify-center py-16">
                          <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/30 border-t-blue-500 mb-6"></div>
                            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-blue-400/20"></div>
                          </div>
                          <p className="text-gray-600 font-medium">Loading content...</p>
                        </div>
                      ) : currentSubtopic.content?.explanations ? (
                        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border-2 border-blue-100 shadow-inner">
                          <div className="prose prose-lg max-w-none">
                            <p className="text-xl leading-relaxed text-gray-800 font-medium">
                              {currentSubtopic.content.explanations[currentExplanationIndex]}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-gray-500 text-lg font-medium">Content not available yet</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                        <span className="text-gray-600 font-medium">Step {currentExplanationIndex + 1} of {totalExplanations}</span>
                      </div>
                      <button
                        onClick={nextExplanation}
                        disabled={isLoadingContent}
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        {currentExplanationIndex < totalExplanations - 1 ? 'Next' : 'Practice Questions'}
                        <ChevronRightIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {showQuestions && !showMCQs && (
                  <div>
                    <div className="mb-8">
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                          <HelpCircleIcon className="w-6 h-6 text-white" />
                        </div>
                        Practice Time! 🎯
                      </h2>
                      <p className="text-gray-600 text-lg">Test your understanding with these practice questions</p>
                    </div>
                    
                    {(() => {
                      const currentQuestion = currentSubtopic.content?.questions?.[currentQuestionIndex];
                      if (!currentQuestion) return <div className="text-gray-600 text-lg font-medium">Loading question...</div>;

                      return (
                        <div className="mb-8">
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 mb-6 shadow-inner">
                            <p className="text-xl font-semibold text-gray-900 leading-relaxed">
                              {currentQuestion.question}
                            </p>
                          </div>
                          <div className="space-y-4">
                            {currentQuestion.options.map((option, index) => (
                              <button
                                key={index}
                                onClick={() => !showAnswer && handlePracticeAnswer(index)}
                                disabled={showAnswer}
                                className={`w-full p-5 text-left rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${
                                  showAnswer
                                    ? index === currentQuestion.correct
                                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 text-green-900 shadow-lg'
                                      : index === selectedAnswer
                                      ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-400 text-red-900 shadow-lg'
                                      : 'bg-gray-50 border-gray-300 text-gray-500'
                                    : selectedAnswer === index
                                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400 text-blue-900 shadow-lg'
                                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:border-blue-300 shadow-md hover:shadow-lg'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                    showAnswer
                                      ? index === currentQuestion.correct
                                        ? 'bg-green-500 text-white shadow-lg'
                                        : index === selectedAnswer
                                        ? 'bg-red-500 text-white shadow-lg'
                                        : 'bg-gray-400 text-white'
                                      : selectedAnswer === index
                                      ? 'bg-blue-500 text-white shadow-md'
                                      : 'bg-gray-300 text-gray-700'
                                  }`}>
                                    {String.fromCharCode(65 + index)}
                                  </span>
                                  <span className="flex-1 font-medium text-lg">{option}</span>
                                  {showAnswer && index === currentQuestion.correct && (
                                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                  )}
                                  {showAnswer && index === selectedAnswer && index !== currentQuestion.correct && (
                                    <XCircleIcon className="w-6 h-6 text-red-500" />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>

                          {showAnswer && (
                            <div className="mt-6">
                              <div className={`p-6 rounded-2xl border-2 shadow-lg ${
                                selectedAnswer === currentQuestion.correct 
                                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                                  : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
                              }`}>
                                <p className={`font-bold text-xl mb-3 ${
                                  selectedAnswer === currentQuestion.correct
                                    ? 'text-green-800'
                                    : 'text-red-800'
                                }`}>
                                  {selectedAnswer === currentQuestion.correct ? '🎉 Excellent! Well done!' : '💡 Not quite right, but great effort!'}
                                </p>
                                
                                {currentQuestion.explanation && selectedAnswer !== currentQuestion.correct && (
                                  <div className="mt-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-amber-200 shadow-md">
                                    <div className="flex items-start gap-3">
                                      <span className="text-amber-600 text-lg">📝</span>
                                      <div>
                                        <p className="text-sm font-semibold text-amber-800 mb-2">Explanation:</p>
                                        <p className="text-sm text-amber-700 leading-relaxed">{currentQuestion.explanation}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {aiSuggestion && !currentQuestion.explanation && (
                                  <div className="mt-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-200 shadow-md">
                                    <div className="flex items-start gap-3">
                                      <span className="text-blue-600 text-lg">💡</span>
                                      <div>
                                        <p className="text-sm font-semibold text-blue-800 mb-2">AI Tutor Says:</p>
                                        <p className="text-sm text-blue-700 leading-relaxed">{aiSuggestion}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {isLoadingSuggestion && (
                                  <div className="mt-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-200 shadow-md">
                                    <div className="flex items-center gap-3">
                                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400/30 border-t-blue-600"></div>
                                      <span className="text-sm text-blue-600 font-medium">AI tutor is thinking...</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="flex justify-between items-center mt-6">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-gray-600 font-medium">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                      </div>
                      {!showAnswer && (
                        <div className="flex items-center gap-2 text-gray-500 font-medium">
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
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                          <CheckCircleIcon className="w-6 h-6 text-white" />
                        </div>
                        Quiz Challenge! 🎆
                      </h2>
                      <p className="text-gray-600 text-lg">Show what you've learned with this comprehensive quiz</p>
                    </div>
                
                    {isLoadingQuiz ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-500 mb-6"></div>
                          <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-purple-400/20"></div>
                        </div>
                        <p className="text-gray-600 font-medium">Loading quiz...</p>
                      </div>
                    ) : (() => {
                      const mcq = getCurrentMCQ();
                      if (!mcq) return (
                        <div className="text-center py-12">
                          <p className="text-gray-500 text-lg font-medium">No quiz questions available</p>
                        </div>
                      );

                      return (
                        <div className="mb-8">
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 mb-6 shadow-inner">
                            <p className="text-xl font-semibold text-gray-900 leading-relaxed">
                              {mcq.question}
                            </p>
                          </div>
                          
                          <div className="space-y-4 mb-6">
                            {mcq.options.map((option, index) => (
                              <button
                                key={index}
                                onClick={() => !showQuizAnswer && handleMCQAnswer(index)}
                                disabled={showQuizAnswer}
                                className={`w-full p-5 text-left rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${
                                  showQuizAnswer
                                    ? index === mcq.correct
                                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 text-green-900 shadow-lg'
                                      : index === selectedQuizAnswer
                                      ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-400 text-red-900 shadow-lg'
                                      : 'bg-gray-50 border-gray-300 text-gray-500'
                                    : selectedQuizAnswer === index
                                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-400 text-purple-900 shadow-lg'
                                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50 hover:border-purple-300 shadow-md hover:shadow-lg'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                    showQuizAnswer
                                      ? index === mcq.correct
                                        ? 'bg-green-500 text-white shadow-lg'
                                        : index === selectedQuizAnswer
                                        ? 'bg-red-500 text-white shadow-lg'
                                        : 'bg-gray-400 text-white'
                                      : selectedQuizAnswer === index
                                      ? 'bg-purple-500 text-white shadow-md'
                                      : 'bg-gray-300 text-gray-700'
                                  }`}>
                                    {String.fromCharCode(65 + index)}
                                  </span>
                                  <span className="flex-1 font-medium text-lg">{option}</span>
                                  {showQuizAnswer && index === mcq.correct && (
                                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                  )}
                                  {showQuizAnswer && index === selectedQuizAnswer && index !== mcq.correct && (
                                    <XCircleIcon className="w-6 h-6 text-red-500" />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                              <span className="text-gray-600 font-medium">Question {currentMCQIndex + 1} of {totalMCQs}</span>
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

      {/* Floating Avatar - Repositioned to left side */}
      <div className="fixed left-6 bottom-6 z-40 hidden lg:block">
        <div className="relative group">
          <div className="transform transition-all duration-300 hover:scale-110 animate-float">
            <div
              className="absolute -inset-4 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity animate-pulse"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}50, ${secondaryColor}50)`
              }}
            ></div>

            {/* Removed bg-white/95 and made it transparent */}
            <div className="relative backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300">
              <div className="w-20 h-20 relative">
                <Avatar size="character" showAsCharacter={true} className="w-full h-full" />
              </div>
            </div>

            <div className="absolute -right-44 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
              <div className="bg-black/80 backdrop-blur-xl rounded-xl p-3 shadow-xl border border-white/10 max-w-xs">
                <div className="text-xs text-white font-medium">
                  {avatarState === 'loading' && "Let me think about this..."}
                  {avatarState === 'explaining' && "Let me explain this concept! 📚"}
                  {avatarState === 'asking' && "Ready for a question? 🤔"}
                  {avatarState === 'praising' && "Excellent work! 🎉✨"}
                  {avatarState === 'consoling' && "Don't worry, let's try again! 💪"}
                </div>
                <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-0 h-0 border-r-4 border-r-black/80 border-y-4 border-y-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      
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

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-1deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(0.5deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
