'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useStore, useTheme } from '@/store/useStore';
import ThemeSelector from '@/components/ThemeSelector';
import Avatar, { AvatarStateIndicator } from '@/components/Avatar';
import LearningSession from '@/components/LearningSession';
import { BookOpenIcon, PlayIcon, SearchIcon, UserIcon, LogOutIcon, SparklesIcon } from 'lucide-react';
import { Course } from '@/types';

export default function Home() {
  const { data: session, status } = useSession();
  const { setUser, setAvatarState } = useStore();
  const currentTheme = useTheme();
  const [currentView, setCurrentView] = useState<'home' | 'learning'>('home');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isGeneratingCourse, setIsGeneratingCourse] = useState(false);
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setUser({
        _id: session.user.id as any,
        googleId: session.user.id as string,
        name: session.user.name as string,
        email: session.user.email as string,
        avatar: session.user.image as string,
        courses: [],
        createdAt: new Date(),
      });
    }
  }, [session, setUser]);

  useEffect(() => {
    // Set initial avatar state
    setAvatarState('loading');
    
    // Simulate loading completion
    const timer = setTimeout(() => {
      setAvatarState('explaining');
    }, 2000);

    return () => clearTimeout(timer);
  }, [setAvatarState]);

  // Fetch user courses
  useEffect(() => {
    if (session?.user) {
      fetchUserCourses();
    }
  }, [session]);

  const fetchUserCourses = async () => {
    try {
      const response = await fetch('/api/courses/generate');
      if (response.ok) {
        const data = await response.json();
        setUserCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const handleCourseGeneration = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const topic = formData.get('topic') as string;
    const situation = formData.get('situation') as string;
    const level = formData.get('level') as string;

    if (!topic.trim()) {
      alert('Please enter a learning topic');
      return;
    }

    setIsGeneratingCourse(true);
    setAvatarState('loading');

    try {
      const response = await fetch('/api/courses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          situation: situation.trim(),
          level: level || 'beginner',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedCourse(data.course);
        setCurrentView('learning');
        setAvatarState('explaining');
        
        if (!data.isExisting) {
          setUserCourses(prev => [...prev, data.course]);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to generate course');
        setAvatarState('consoling');
      }
    } catch (error) {
      console.error('Course generation error:', error);
      alert('Failed to generate course. Please try again.');
      setAvatarState('consoling');
    } finally {
      setIsGeneratingCourse(false);
    }
  };

  const startExistingCourse = (course: Course) => {
    setSelectedCourse(course);
    setCurrentView('learning');
  };

  const exitLearningSession = () => {
    setCurrentView('home');
    setSelectedCourse(null);
    setAvatarState('explaining');
  };

  // Show learning session if active
  if (currentView === 'learning' && selectedCourse) {
    return (
      <div className="min-h-screen w-full" style={{ background: `linear-gradient(to bottom right, ${currentTheme.colors.primary}20, ${currentTheme.colors.secondary}20, ${currentTheme.colors.accent}20)` }}>
        <LearningSession course={selectedCourse} onExit={exitLearningSession} />
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: currentTheme.colors.primary, borderTopColor: 'transparent' }}></div>
          <p className="text-gray-600">Loading MentorVerse...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(to bottom right, ${currentTheme.colors.primary}20, ${currentTheme.colors.secondary}20)` }}>
        <div className="max-w-md w-full mx-4">
          <div className="learning-card text-center">
            <div className="mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: `linear-gradient(to bottom right, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})` }}>
                <BookOpenIcon className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">MentorVerse</h1>
              <p className="text-gray-600">
                Personalized learning with avatar companions
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <PlayIcon className="w-4 h-4" style={{ color: currentTheme.colors.primary }} />
                <span>Interactive learning sessions</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <UserIcon className="w-4 h-4" style={{ color: currentTheme.colors.secondary }} />
                <span>Theme-based avatar companions</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <SearchIcon className="w-4 h-4" style={{ color: currentTheme.colors.accent }} />
                <span>AI-generated personalized courses</span>
              </div>
            </div>

            <button
              onClick={() => signIn('google')}
              className="w-full theme-button flex items-center justify-center gap-2"
              style={{ backgroundColor: currentTheme.colors.primary, color: 'white' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <p className="text-xs text-gray-500 mt-4">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(to bottom right, ${currentTheme.colors.primary}10, ${currentTheme.colors.secondary}10, ${currentTheme.colors.accent}10)` }}>
      {/* Header */}
      <header className="glass-card sticky top-0 z-50 border-b backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: currentTheme.colors.primary }}>
                <BookOpenIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">MentorVerse</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <AvatarStateIndicator />
              <button
                onClick={() => setShowThemeSelector(!showThemeSelector)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Change Theme"
              >
                <SparklesIcon className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <img
                  src={session.user?.image || '/default-avatar.png'}
                  alt={session.user?.name || 'User'}
                  className="w-8 h-8 rounded-full border-2 border-gray-200"
                />
                <span className="text-sm font-medium text-gray-700">
                  {session.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOutIcon className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Theme Selector Overlay */}
      {showThemeSelector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Choose Your Theme</h2>
                <button
                  onClick={() => setShowThemeSelector(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
              <ThemeSelector onThemeSelect={() => setShowThemeSelector(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Avatar size="xl" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome back, {session.user?.name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Ready to continue your learning journey? Let's make today productive!
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Course Creation */}
          <div className="lg:col-span-2">
            <div className="learning-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg" style={{ background: `linear-gradient(to right, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})` }}>
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Create New Course
                </h3>
              </div>
              
              <form onSubmit={handleCourseGeneration} className="space-y-6">
                <div>
                  <label htmlFor="topic" className="block text-sm font-semibold text-gray-800 mb-2">
                    What would you like to learn? ✨
                  </label>
                  <input
                    type="text"
                    id="topic"
                    name="topic"
                    placeholder="e.g., React Hooks, Python for Data Science, Design Patterns..."
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-lg"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="situation" className="block text-sm font-semibold text-gray-800 mb-2">
                    Tell me about your learning goals 🎯
                  </label>
                  <textarea
                    id="situation"
                    name="situation"
                    rows={3}
                    placeholder="e.g., I need this for job interviews, I'm switching careers, I want to build a project..."
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none"
                  />
                </div>

                <div>
                  <label htmlFor="level" className="block text-sm font-semibold text-gray-800 mb-2">
                    Your experience level 📈
                  </label>
                  <select
                    id="level"
                    name="level"
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-lg"
                  >
                    <option value="beginner">🌱 Beginner - I'm new to this</option>
                    <option value="intermediate">🚀 Intermediate - I know some basics</option>
                    <option value="advanced">⭐ Advanced - I want deep insights</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingCourse}
                  className="w-full theme-button py-4 text-lg font-bold flex items-center justify-center gap-3 disabled:opacity-50"
                  style={{ backgroundColor: currentTheme.colors.primary, color: 'white' }}
                >
                  {isGeneratingCourse ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      Generating Your Course...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-6 h-6" />
                      Generate My Learning Course
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Quick Stats & Actions */}
          <div className="space-y-6">
            {/* My Courses */}
            <div className="learning-card">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpenIcon className="w-5 h-5" style={{ color: currentTheme.colors.primary }} />
                My Courses ({userCourses.length})
              </h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {userCourses.length > 0 ? (
                  userCourses.slice(0, 3).map((course) => (
                    <div
                      key={course._id.toString()}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => startExistingCourse(course)}
                    >
                      <h5 className="font-medium text-gray-900 text-sm mb-1">{course.title}</h5>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>{course.syllabus.length} topics</span>
                        <span>•</span>
                        <span>{course.upvotes} upvotes</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No courses yet. Create your first course above! 🚀
                  </p>
                )}
              </div>
              {userCourses.length > 3 && (
                <button className="w-full mt-3 text-sm font-medium" style={{ color: currentTheme.colors.primary }}>
                  View all {userCourses.length} courses
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button className="animated-card text-white p-4 rounded-xl text-center" style={{ background: `linear-gradient(to bottom right, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})` }}>
                <PlayIcon className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm font-medium">Continue Learning</div>
              </button>
              <button className="animated-card text-white p-4 rounded-xl text-center" style={{ background: `linear-gradient(to bottom right, ${currentTheme.colors.secondary}, ${currentTheme.colors.accent})` }}>
                <SearchIcon className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm font-medium">Explore Courses</div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {userCourses.length > 0 && (
          <div className="learning-card">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <UserIcon className="w-6 h-6" style={{ color: currentTheme.colors.primary }} />
              Your Learning Journey
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userCourses.slice(0, 6).map((course) => (
                <div
                  key={course._id.toString()}
                  className="animated-card bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl cursor-pointer"
                  onClick={() => startExistingCourse(course)}
                >
                  <h4 className="font-bold text-gray-900 mb-2">{course.title}</h4>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.situation || 'No description'}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-2">
                      {course.tags.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: currentTheme.colors.primary + '20', color: currentTheme.colors.primary }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-gray-500">{course.syllabus.length} topics</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
