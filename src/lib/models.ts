import mongoose, { Schema, model, models, Model } from 'mongoose';
import { User, Course, Progress, MCQ, Subtopic, Topic, SubtopicContent, TopicQuizContent } from '@/types';

// MCQ Schema
const MCQSchema = new Schema<MCQ>({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correct: { type: Number, required: true },
  explanation: { type: String, default: '' }  // Added explanation field
});

// Subtopic Content Schema (generated on-demand)
const SubtopicContentSchema = new Schema<SubtopicContent>({
  explanations: { type: [String], default: [] },
  questions: { type: [MCQSchema], default: [] },
  examples: { type: [String], default: [] },
  keyTakeaways: { type: [String], default: [] }
});

// Subtopic Schema
const SubtopicSchema = new Schema<Subtopic>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  estimatedDuration: { type: String, default: '' },
  content: { type: SubtopicContentSchema, default: null },
  contentGenerated: { type: Boolean, default: false }
});

// Topic Quiz Content Schema (generated on-demand)
const TopicQuizContentSchema = new Schema<TopicQuizContent>({
  mcqs: { type: [MCQSchema], default: [] }
});

// Topic Schema
const TopicSchema = new Schema<Topic>({
  topic: { type: String, required: true },
  description: { type: String, required: true },  // Topic description
  duration: { type: String, default: '' },       // Estimated duration
  subtopics: { type: [SubtopicSchema], required: true },
  quizContent: { type: TopicQuizContentSchema, default: null },
  quizGenerated: { type: Boolean, default: false }
});

// User Schema
const UserSchema = new Schema<User>({
  googleId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  avatar: { type: String, required: true },
  courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }]
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false }
});

// Course Schema
const CourseSchema = new Schema<Course>({
  title: { type: String, required: true },
  courseDescription: { type: String, default: '' },  // Course description
  totalDuration: { type: String, default: '' },      // Estimated total duration
  difficulty: { type: String, default: 'beginner' }, // Difficulty level
  situation: { type: String, default: '' },
  tags: { type: [String], default: [], index: true },
  syllabus: { type: [TopicSchema], required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  upvotes: { type: Number, default: 0, index: -1 }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false }
});

// Progress Schema
const ProgressSchema = new Schema<Progress>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  checkpoint: {
    topicIndex: { type: Number, default: 0 },
    subtopicIndex: { type: Number, default: 0 },
    position: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Create compound index for progress
ProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Export models with proper typing
export const UserModel: Model<User> = models.User || model<User>('User', UserSchema);
export const CourseModel: Model<Course> = models.Course || model<Course>('Course', CourseSchema);
export const ProgressModel: Model<Progress> = models.Progress || model<Progress>('Progress', ProgressSchema);
