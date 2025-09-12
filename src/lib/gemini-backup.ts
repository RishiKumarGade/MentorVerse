import { GoogleGenerativeAI } from '@google/generative-ai';
import { CourseGenerationRequest, CourseOutlineResponse, SubtopicContentRequest, SubtopicContentResponse, TopicQuizRequest, TopicQuizResponse, DoubtRequest, DoubtResponse } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY as string);

// Course Generation Prompts
const COURSE_OUTLINE_SYSTEM_PROMPT = `You are an expert AI tutor that creates comprehensive course outlines and syllabi.
You must output content in strict JSON format.

Your goal is to create a well-structured learning syllabus that includes:
1. A comprehensive course overview with clear learning objectives
2. Detailed topic breakdown with logical progression
3. Subtopics with clear descriptions and learning goals
4. Duration estimates and difficulty assessment

Focus on creating a clear, logical learning path without generating detailed content yet.
The detailed explanations and questions will be generated separately for each subtopic.`;

const SUBTOPIC_CONTENT_SYSTEM_PROMPT = `You are an expert AI tutor creating detailed learning content for a specific subtopic.
You must output content in strict JSON format.

Your goal is to create comprehensive, engaging content that includes:
1. Detailed explanations with practical examples and real-world applications
2. Step-by-step processes or technical details where appropriate
3. Practice questions for immediate understanding
4. Key takeaways and important notes

Make the content practical, engaging, and appropriate for the user's level.`;

const TOPIC_QUIZ_SYSTEM_PROMPT = `You are an expert AI tutor creating comprehensive quiz questions for a complete topic.
You must output content in strict JSON format.

Your goal is to create assessment questions that:
1. Test comprehensive understanding of the entire topic
2. Cover all important concepts from the subtopics
3. Include questions of varying difficulty
4. Provide clear explanations for correct answers

Create questions that truly assess mastery of the topic.`;

const DOUBT_CLARIFICATION_SYSTEM_PROMPT = `You are an AI tutor helping students clarify their doubts. 
Provide clear, concise explanations based on the context provided.
Answer in a conversational, encouraging tone.
Keep your response focused and helpful.`;

export async function generateCourseOutline(request: CourseGenerationRequest): Promise<CourseOutlineResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `${COURSE_OUTLINE_SYSTEM_PROMPT}

User wants to learn: ${request.topic}
${request.situation ? `Situation: ${request.situation}` : ''}
Level: ${request.level || 'beginner'}

Generate a comprehensive course outline in JSON format:
{
  "courseTitle": "Complete Course Title",
  "courseDescription": "Brief description of what students will learn and achieve",
  "totalDuration": "Estimated completion time (e.g., '6-8 hours')",
  "difficulty": "beginner|intermediate|advanced",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "topics": [
    {
      "topic": "Topic Name",
      "description": "What this topic covers and why it's important for the overall learning goal",
      "duration": "Estimated time for this topic (e.g., '2 hours')",
      "subtopics": [
        {
          "name": "Subtopic Name",
          "description": "Clear description of what will be learned in this subtopic",
          "estimatedDuration": "Time estimate (e.g., '30 minutes')"
        }
      ]
    }
  ]
}

IMPORTANT REQUIREMENTS:
- Create 3-4 main topics with logical progression
- Each topic should have 2-4 subtopics
- All descriptions should be clear and informative
- Include realistic duration estimates
- Topics should build upon each other logically
- Subtopics should cover all essential concepts for mastery
- Match the user's specified level and situation
- Tags should be relevant and comprehensive (5 tags)
- Focus on creating a complete learning path

Return ONLY valid JSON, no other text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      // Clean the response by removing markdown code blocks
      let cleanText = text.trim();
      
      // Remove markdown code blocks using character codes to avoid parsing issues
      const backtick = String.fromCharCode(96); // backtick character
      const jsonPrefix = backtick + backtick + backtick + 'json';
      const codePrefix = backtick + backtick + backtick;
      const codeSuffix = backtick + backtick + backtick;
      
      if (cleanText.startsWith(jsonPrefix)) {
        cleanText = cleanText.substring(jsonPrefix.length).trim();
        if (cleanText.endsWith(codeSuffix)) {
          cleanText = cleanText.substring(0, cleanText.length - codeSuffix.length).trim();
        }
      } else if (cleanText.startsWith(codePrefix)) {
        cleanText = cleanText.substring(codePrefix.length).trim();
        if (cleanText.endsWith(codeSuffix)) {
          cleanText = cleanText.substring(0, cleanText.length - codeSuffix.length).trim();
        }
      }
      
      // Trim any remaining whitespace
      cleanText = cleanText.trim();
      
      console.log('Cleaned Gemini response length:', cleanText.length);
      
      const parsedResponse = JSON.parse(cleanText);
      
      // Validate the response structure
      if (!parsedResponse.courseTitle || !parsedResponse.topics || !Array.isArray(parsedResponse.topics)) {
        throw new Error('Invalid course outline structure received from Gemini');
      }

      return parsedResponse as CourseOutlineResponse;
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse course generation response');
    }
  } catch (error) {
    console.error('Error generating course:', error);
    throw new Error('Failed to generate course outline. Please try again.');
  }
}

export async function generateSubtopicContent(request: SubtopicContentRequest): Promise<SubtopicContentResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `${SUBTOPIC_CONTENT_SYSTEM_PROMPT}

Course: ${request.courseTitle}
Topic: ${request.topicTitle}
Subtopic: ${request.subtopicTitle}
Description: ${request.subtopicDescription}
User Level: ${request.userLevel || 'beginner'}

Generate comprehensive content for this specific subtopic in JSON format:
{
  "explanations": [
    "Clear explanation with context and definition",
    "Practical example or real-world analogy",
    "Technical details or step-by-step process",
    "Common applications or use cases",
    "Important notes, tips, or best practices",
    "Key takeaway or summary point"
  ],
  "questions": [
    {
      "question": "Practice question testing immediate understanding",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 1,
      "explanation": "Why this answer is correct"
    }
  ],
  "examples": [
    "Concrete example 1",
    "Real-world scenario or application"
  ],
  "keyTakeaways": [
    "Most important point to remember",
    "Key concept or principle"
  ]
}

IMPORTANT REQUIREMENTS:
- explanations MUST be an array of 6 STRINGS (not objects)
- Each explanation string should be self-contained and complete
- 2-3 practice MCQs for immediate understanding
- Include concrete examples and real-world applications
- 2-3 key takeaways that summarize the most important points
- All MCQs have 4 meaningful options with exactly one correct answer
- MCQ correct answer is 0-indexed (0,1,2,3)
- Content should be engaging and appropriate for the user's level
- Focus on practical understanding and application
- ALL ARRAYS MUST CONTAIN STRINGS ONLY, NOT OBJECTS

Return ONLY valid JSON, no other text.

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      // Clean the response by removing markdown code blocks
      let cleanText = text.trim();
      
      // Remove markdown code blocks using character codes to avoid parsing issues
      const backtick = String.fromCharCode(96); // backtick character
      const jsonPrefix = backtick + backtick + backtick + 'json';
      const codePrefix = backtick + backtick + backtick;
      const codeSuffix = backtick + backtick + backtick;
      
      if (cleanText.startsWith(jsonPrefix)) {
        cleanText = cleanText.substring(jsonPrefix.length).trim();
        if (cleanText.endsWith(codeSuffix)) {
          cleanText = cleanText.substring(0, cleanText.length - codeSuffix.length).trim();
        }
      } else if (cleanText.startsWith(codePrefix)) {
        cleanText = cleanText.substring(codePrefix.length).trim();
        if (cleanText.endsWith(codeSuffix)) {
          cleanText = cleanText.substring(0, cleanText.length - codeSuffix.length).trim();
        }
      }
      
      cleanText = cleanText.trim();
      
      const parsedResponse = JSON.parse(cleanText);
      
      // Validate the response structure and ensure explanations are strings
      if (!Array.isArray(parsedResponse.explanations) || !Array.isArray(parsedResponse.questions)) {
        throw new Error('Invalid subtopic content structure received from Gemini');
      }
      
      // Validate that explanations are strings, not objects
      const validExplanations = parsedResponse.explanations.map((exp: any) => {
        if (typeof exp === 'string') {
          return exp;
        } else if (typeof exp === 'object' && exp.explanation) {
          // If it's an object with an explanation property, extract just the explanation text
          return exp.explanation;
        } else {
          return String(exp); // Convert to string as fallback
        }
      });
      
      // Create the properly formatted response
      const validatedResponse = {
        ...parsedResponse,
        explanations: validExplanations
      };

      return { content: validatedResponse };
    } catch (parseError) {
      console.error('Failed to parse Gemini subtopic content response:', text);
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse subtopic content response');
    }
  } catch (error) {
    console.error('Error generating subtopic content:', error);
    throw new Error('Failed to generate subtopic content. Please try again.');
  }
}

export async function generateTopicQuiz(request: TopicQuizRequest): Promise<TopicQuizResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `${TOPIC_QUIZ_SYSTEM_PROMPT}

Course: ${request.courseTitle}
Topic: ${request.topicTitle}
Topic Description: ${request.topicDescription}
Subtopics covered: ${request.subtopicTitles.join(', ')}
User Level: ${request.userLevel || 'beginner'}

Generate comprehensive quiz questions for this entire topic in JSON format:
{
  "mcqs": [
    {
      "question": "Comprehensive question testing topic understanding",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 2,
      "explanation": "Detailed explanation of why this answer is correct"
    }
  ]
}

IMPORTANT REQUIREMENTS:
- Create 4-6 comprehensive quiz questions
- Questions should test understanding of the entire topic
- Include questions covering different subtopics
- Vary difficulty levels within the questions
- All MCQs have 4 meaningful options with exactly one correct answer
- MCQ correct answer is 0-indexed (0,1,2,3)
- Include detailed explanations for correct answers
- Questions should assess mastery, not just recall
- Match the user's specified level

Return ONLY valid JSON, no other text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      // Clean the response by removing markdown code blocks
      let cleanText = text.trim();
      
      // Remove markdown code blocks using character codes to avoid parsing issues
      const backtick = String.fromCharCode(96); // backtick character
      const jsonPrefix = backtick + backtick + backtick + 'json';
      const codePrefix = backtick + backtick + backtick;
      const codeSuffix = backtick + backtick + backtick;
      
      if (cleanText.startsWith(jsonPrefix)) {
        cleanText = cleanText.substring(jsonPrefix.length).trim();
        if (cleanText.endsWith(codeSuffix)) {
          cleanText = cleanText.substring(0, cleanText.length - codeSuffix.length).trim();
        }
      } else if (cleanText.startsWith(codePrefix)) {
        cleanText = cleanText.substring(codePrefix.length).trim();
        if (cleanText.endsWith(codeSuffix)) {
          cleanText = cleanText.substring(0, cleanText.length - codeSuffix.length).trim();
        }
      }
      
      cleanText = cleanText.trim();
      
      const parsedResponse = JSON.parse(cleanText);
      
      // Validate the response structure
      if (!Array.isArray(parsedResponse.mcqs)) {
        throw new Error('Invalid topic quiz structure received from Gemini');
      }

      return { quizContent: parsedResponse };
    } catch (parseError) {
      console.error('Failed to parse Gemini topic quiz response:', text);
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse topic quiz response');
    }
  } catch (error) {
    console.error('Error generating topic quiz:', error);
    throw new Error('Failed to generate topic quiz. Please try again.');
  }
}

export async function generateMCQSuggestion(request: {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  context: string[];
}): Promise<{ suggestion: string }> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const contextText = request.context.join(' ');
    
    const prompt = `You are a helpful AI tutor providing personalized learning guidance.

Context: ${contextText}

Question: ${request.question}
Correct Answer: ${request.correctAnswer}
Student's Answer: ${request.userAnswer}

The student selected the wrong answer. Provide a brief, encouraging explanation that:
1. Explains why their answer was incorrect (without being negative)
2. Clarifies the correct concept
3. Gives a helpful tip to remember this concept
4. Encourages them to keep learning

Keep the response to 2-3 sentences, friendly and supportive tone.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      suggestion: text.trim()
    };
  } catch (error) {
    console.error('Error generating MCQ suggestion:', error);
    return {
      suggestion: "Don't worry! Learning involves making mistakes. Review the explanation and try to understand the key concept. You're doing great by practicing!"
    };
  }
}

export async function clarifyDoubt(request: DoubtRequest): Promise<DoubtResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const contextText = request.context.join(' ');
    
    const prompt = `${DOUBT_CLARIFICATION_SYSTEM_PROMPT}

The student is learning about this context:
"${contextText}"

Student's doubt: "${request.doubt}"

Please provide a clear, helpful explanation to resolve their doubt. Keep it concise but thorough.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      answer: text.trim()
    };
  } catch (error) {
    console.error('Error clarifying doubt:', error);
    throw new Error('Failed to clarify doubt. Please try again.');
  }
}

// Utility function to check if similar course exists
export async function findSimilarCourse(title: string): Promise<boolean> {
  // This would typically query the database
  // For now, we'll implement a simple check
  // You can enhance this with vector similarity or text matching
  return false;
}

// Function to validate course content before saving
export function validateCourseContent(course: CourseGenerationResponse): boolean {
  try {
    // Check basic structure
    if (!course.courseTitle || !course.topics || !Array.isArray(course.topics)) {
      return false;
    }

    // Check each topic
    for (const topic of course.topics) {
      if (!topic.topic || !topic.subtopics || !Array.isArray(topic.subtopics)) {
        return false;
      }

        // Check each subtopic
        for (const subtopic of topic.subtopics) {
          if (!subtopic.name || 
              !subtopic.description || 
              !Array.isArray(subtopic.explanations) ||
              !Array.isArray(subtopic.questions) ||
              !Array.isArray(subtopic.mcqs)) {
            return false;
          }

          // Check practice questions (now MCQs)
          for (const question of subtopic.questions) {
            if (!question.question || 
                !Array.isArray(question.options) || 
                question.options.length !== 4 ||
                typeof question.correct !== 'number' ||
                question.correct < 0 || 
                question.correct > 3) {
              return false;
            }
            // Explanation is optional but should be string if present
            if (question.explanation && typeof question.explanation !== 'string') {
              return false;
            }
          }

          // Check quiz MCQs
          for (const mcq of subtopic.mcqs) {
            if (!mcq.question || 
                !Array.isArray(mcq.options) || 
                mcq.options.length !== 4 ||
                typeof mcq.correct !== 'number' ||
                mcq.correct < 0 || 
                mcq.correct > 3) {
              return false;
            }
            // Explanation is optional but should be string if present
            if (mcq.explanation && typeof mcq.explanation !== 'string') {
              return false;
            }
          }
      }
    }

    return true;
  } catch (error) {
    console.error('Error validating course content:', error);
    return false;
  }
}

// Function to estimate reading time for content
export function estimateReadingTime(explanations: string[]): number {
  const wordsPerMinute = 200;
  const totalWords = explanations.join(' ').split(' ').length;
  return Math.ceil(totalWords / wordsPerMinute);
}
