import { ObjectId } from 'mongodb';

// User Types
export interface User {
  _id: ObjectId;
  googleId: string;
  name: string;
  email: string;
  avatar: string;
  courses: ObjectId[];
  createdAt: Date;
}

// Course Types
export interface MCQ {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;  // Added explanation for better learning
}

export interface SubtopicOutline {
  name: string;
  description: string;
  estimatedDuration?: string;
}

export interface SubtopicContent {
  explanations: string[];
  questions: MCQ[];  // Practice questions
  examples?: string[];
  keyTakeaways?: string[];
}

export interface Subtopic extends SubtopicOutline {
  content?: SubtopicContent;  // Generated on-demand
  contentGenerated?: boolean; // Track if content has been generated
}

export interface TopicOutline {
  topic: string;
  description: string;     // What this topic covers
  duration?: string;       // Estimated time for topic
  subtopics: SubtopicOutline[];
}

export interface TopicQuizContent {
  mcqs: MCQ[];  // Quiz questions for the entire topic
}

export interface Topic extends TopicOutline {
  subtopics: Subtopic[];
  quizContent?: TopicQuizContent;  // Generated on-demand
  quizGenerated?: boolean;         // Track if quiz has been generated
}

export interface Course {
  _id: ObjectId;
  title: string;
  courseDescription?: string;  // Brief description of the course
  totalDuration?: string;      // Estimated completion time
  difficulty?: string;         // beginner|intermediate|advanced
  situation: string;
  tags: string[];
  syllabus: Topic[];
  createdBy: ObjectId;
  upvotes: number;
  createdAt: Date;
}

// Progress Types
export interface Checkpoint {
  topicIndex: number;
  subtopicIndex: number;
  position: number;
}

export interface Progress {
  _id: ObjectId;
  userId: ObjectId;
  courseId: ObjectId;
  checkpoint: Checkpoint;
  createdAt: Date;
  updatedAt: Date;
}

// Theme Types
export interface ThemeImages {
  loading?: string;
  explaining?: string;
  asking?: string;
  praising?: string;
  consoling?: string;
}

export interface Theme {
  id: string;
  name: string;
  displayName: string;
  images: ThemeImages;
  audio?: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// Learning Session Types
export type AvatarState = 'loading' | 'explaining' | 'asking' | 'praising' | 'consoling';

export interface LearningSession {
  courseId: string;
  currentTopic: number;
  currentSubtopic: number;
  currentPosition: number;
  isActive: boolean;
  doubts: Doubt[];
}

export interface Doubt {
  id: string;
  question: string;
  context: string[];
  answer?: string;
  timestamp: Date;
}

// API Response Types
export interface CourseGenerationRequest {
  topic: string;
  situation?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  userId: string;
}

export interface CourseOutlineResponse {
  courseTitle: string;
  courseDescription?: string;
  totalDuration?: string;
  difficulty?: string;
  tags: string[];
  topics: TopicOutline[];
}

export interface SubtopicContentRequest {
  courseId: string;
  topicIndex: number;
  subtopicIndex: number;
  courseTitle: string;
  topicTitle: string;
  subtopicTitle: string;
  subtopicDescription: string;
  userLevel?: string;
}

export interface SubtopicContentResponse {
  content: SubtopicContent;
}

export interface TopicQuizRequest {
  courseId: string;
  topicIndex: number;
  courseTitle: string;
  topicTitle: string;
  topicDescription: string;
  subtopicTitles: string[];
  userLevel?: string;
}

export interface TopicQuizResponse {
  quizContent: TopicQuizContent;
}

export interface DoubtRequest {
  courseId: string;
  context: string[];
  doubt: string;
}

export interface DoubtResponse {
  answer: string;
}

// UI State Types
export interface AppState {
  user: User | null;
  currentTheme: Theme;
  currentSession: LearningSession | null;
  isLoading: boolean;
  error: string | null;
}

// Search and Discovery
export interface CourseSearchFilters {
  query?: string;
  tags?: string[];
  level?: string;
  sortBy?: 'recent' | 'popular' | 'title';
}

export interface CoursePreview {
  _id: string;
  title: string;
  situation: string;
  tags: string[];
  upvotes: number;
  createdAt: Date;
  author: {
    name: string;
    avatar: string;
  };
}
