import { GoogleGenerativeAI } from '@google/generative-ai';
import { CourseGenerationRequest, CourseOutlineResponse, SubtopicContentRequest, SubtopicContentResponse, TopicQuizRequest, TopicQuizResponse, DoubtRequest, DoubtResponse } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY as string);

// Helper function to remove markdown code blocks
function cleanMarkdownResponse(text: string): string {
  let cleanText = text.trim();
  
  // Create markers using character codes to avoid parsing issues
  const backtick = String.fromCharCode(96);
  const jsonMarker = backtick + backtick + backtick + 'json';
  const codeMarker = backtick + backtick + backtick;
  
  if (cleanText.startsWith(jsonMarker)) {
    cleanText = cleanText.substring(jsonMarker.length).trim();
    if (cleanText.endsWith(codeMarker)) {
      cleanText = cleanText.substring(0, cleanText.length - codeMarker.length).trim();
    }
  } else if (cleanText.startsWith(codeMarker)) {
    cleanText = cleanText.substring(codeMarker.length).trim();
    if (cleanText.endsWith(codeMarker)) {
      cleanText = cleanText.substring(0, cleanText.length - codeMarker.length).trim();
    }
  }
  
  return cleanText;
}

// Course Generation Prompts
const COURSE_OUTLINE_SYSTEM_PROMPT = 'You are an expert MentorVerse that creates comprehensive course outlines and syllabi. You must output content in strict JSON format. Your goal is to create a well-structured learning syllabus that includes: 1. A comprehensive course overview with clear learning objectives 2. Detailed topic breakdown with logical progression 3. Subtopics with clear descriptions and learning goals 4. Duration estimates and difficulty assessment. Focus on creating a clear, logical learning path without generating detailed content yet. The detailed explanations and questions will be generated separately for each subtopic.';

const SUBTOPIC_CONTENT_SYSTEM_PROMPT = 'You are an expert MentorVerse creating detailed learning content for a specific subtopic. You must output content in strict JSON format. Your goal is to create comprehensive, engaging content that includes: 1. Detailed explanations with practical examples and real-world applications 2. Step-by-step processes or technical details where appropriate 3. Practice questions for immediate understanding 4. Key takeaways and important notes. Make the content practical, engaging, and appropriate for the user level.';

const TOPIC_QUIZ_SYSTEM_PROMPT = 'You are an expert MentorVerse creating comprehensive quiz questions for a complete topic. You must output content in strict JSON format. Your goal is to create assessment questions that: 1. Test comprehensive understanding of the entire topic 2. Cover all important concepts from the subtopics 3. Include questions of varying difficulty 4. Provide clear explanations for correct answers. Create questions that truly assess mastery of the topic.';

const DOUBT_CLARIFICATION_SYSTEM_PROMPT = 'You are an MentorVerse helping students clarify their doubts. Provide clear, concise explanations based on the context provided. Answer in a conversational, encouraging tone. Keep your response focused and helpful.';

export async function generateCourseOutline(request: CourseGenerationRequest): Promise<CourseOutlineResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const promptText = COURSE_OUTLINE_SYSTEM_PROMPT + '\n\n' +
      'User wants to learn: ' + request.topic + '\n' +
      (request.situation ? 'Situation: ' + request.situation + '\n' : '') +
      'Level: ' + (request.level || 'beginner') + '\n\n' +
      'Generate a comprehensive course outline in JSON format:\n' +
      '{\n' +
      '  "courseTitle": "Complete Course Title",\n' +
      '  "courseDescription": "Brief description of what students will learn and achieve",\n' +
      '  "totalDuration": "Estimated completion time (e.g., 6-8 hours)",\n' +
      '  "difficulty": "beginner|intermediate|advanced",\n' +
      '  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],\n' +
      '  "topics": [\n' +
      '    {\n' +
      '      "topic": "Topic Name",\n' +
      '      "description": "What this topic covers and why it is important for the overall learning goal",\n' +
      '      "duration": "Estimated time for this topic (e.g., 2 hours)",\n' +
      '      "subtopics": [\n' +
      '        {\n' +
      '          "name": "Subtopic Name",\n' +
      '          "description": "Clear description of what will be learned in this subtopic",\n' +
      '          "estimatedDuration": "Time estimate (e.g., 30 minutes)"\n' +
      '        }\n' +
      '      ]\n' +
      '    }\n' +
      '  ]\n' +
      '}\n\n' +
      'IMPORTANT REQUIREMENTS:\n' +
      '- Create 3-4 main topics with logical progression\n' +
      '- Each topic should have 2-4 subtopics\n' +
      '- All descriptions should be clear and informative\n' +
      '- Include realistic duration estimates\n' +
      '- Topics should build upon each other logically\n' +
      '- Subtopics should cover all essential concepts for mastery\n' +
      '- Match the user specified level and situation\n' +
      '- Tags should be relevant and comprehensive (5 tags)\n' +
      '- Focus on creating a complete learning path\n\n' +
      'Return ONLY valid JSON, no other text.';

    const result = await model.generateContent(promptText);
    const response = await result.response;
    const text = response.text();

    try {
      const cleanText = cleanMarkdownResponse(text);
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
    
    const promptText = SUBTOPIC_CONTENT_SYSTEM_PROMPT + '\n\n' +
      'Course: ' + request.courseTitle + '\n' +
      'Topic: ' + request.topicTitle + '\n' +
      'Subtopic: ' + request.subtopicTitle + '\n' +
      'Description: ' + request.subtopicDescription + '\n' +
      'User Level: ' + (request.userLevel || 'beginner') + '\n\n' +
      'Generate comprehensive content for this specific subtopic in JSON format:\n' +
      '{\n' +
      '  "explanations": [\n' +
      '    "Clear explanation with context and definition",\n' +
      '    "Practical example or real-world analogy",\n' +
      '    "Technical details or step-by-step process",\n' +
      '    "Common applications or use cases",\n' +
      '    "Important notes, tips, or best practices",\n' +
      '    "Key takeaway or summary point"\n' +
      '  ],\n' +
      '  "questions": [\n' +
      '    {\n' +
      '      "question": "Practice question testing immediate understanding",\n' +
      '      "options": ["Option A", "Option B", "Option C", "Option D"],\n' +
      '      "correct": 1,\n' +
      '      "explanation": "Why this answer is correct"\n' +
      '    }\n' +
      '  ],\n' +
      '  "examples": [\n' +
      '    "Concrete example 1",\n' +
      '    "Real-world scenario or application"\n' +
      '  ],\n' +
      '  "keyTakeaways": [\n' +
      '    "Most important point to remember",\n' +
      '    "Key concept or principle"\n' +
      '  ]\n' +
      '}\n\n' +
      'IMPORTANT REQUIREMENTS:\n' +
      '- explanations MUST be an array of 6 STRINGS (not objects)\n' +
      '- Each explanation string should be self-contained and complete\n' +
      '- 2-3 practice MCQs for immediate understanding\n' +
      '- Include concrete examples and real-world applications\n' +
      '- 2-3 key takeaways that summarize the most important points\n' +
      '- All MCQs have 4 meaningful options with exactly one correct answer\n' +
      '- MCQ correct answer is 0-indexed (0,1,2,3)\n' +
      '- Content should be engaging and appropriate for the user level\n' +
      '- Focus on practical understanding and application\n' +
      '- ALL ARRAYS MUST CONTAIN STRINGS ONLY, NOT OBJECTS\n\n' +
      'Return ONLY valid JSON, no other text.';

    const result = await model.generateContent(promptText);
    const response = await result.response;
    const text = response.text();

    try {
      const cleanText = cleanMarkdownResponse(text);
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
    
    const promptText = TOPIC_QUIZ_SYSTEM_PROMPT + '\n\n' +
      'Course: ' + request.courseTitle + '\n' +
      'Topic: ' + request.topicTitle + '\n' +
      'Topic Description: ' + request.topicDescription + '\n' +
      'Subtopics covered: ' + request.subtopicTitles.join(', ') + '\n' +
      'User Level: ' + (request.userLevel || 'beginner') + '\n\n' +
      'Generate comprehensive quiz questions for this entire topic in JSON format:\n' +
      '{\n' +
      '  "mcqs": [\n' +
      '    {\n' +
      '      "question": "Comprehensive question testing topic understanding",\n' +
      '      "options": ["Option A", "Option B", "Option C", "Option D"],\n' +
      '      "correct": 2,\n' +
      '      "explanation": "Detailed explanation of why this answer is correct"\n' +
      '    }\n' +
      '  ]\n' +
      '}\n\n' +
      'IMPORTANT REQUIREMENTS:\n' +
      '- Create 4-6 comprehensive quiz questions\n' +
      '- Questions should test understanding of the entire topic\n' +
      '- Include questions covering different subtopics\n' +
      '- Vary difficulty levels within the questions\n' +
      '- All MCQs have 4 meaningful options with exactly one correct answer\n' +
      '- MCQ correct answer is 0-indexed (0,1,2,3)\n' +
      '- Include detailed explanations for correct answers\n' +
      '- Questions should assess mastery, not just recall\n' +
      '- Match the user specified level\n\n' +
      'Return ONLY valid JSON, no other text.';

    const result = await model.generateContent(promptText);
    const response = await result.response;
    const text = response.text();

    try {
      const cleanText = cleanMarkdownResponse(text);
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
    
    const promptText = 'You are a helpful MentorVerse providing personalized learning guidance.\n\n' +
      'Context: ' + contextText + '\n\n' +
      'Question: ' + request.question + '\n' +
      'Correct Answer: ' + request.correctAnswer + '\n' +
      'Student Answer: ' + request.userAnswer + '\n\n' +
      'The student selected the wrong answer. Provide a brief, encouraging explanation that:\n' +
      '1. Explains why their answer was incorrect (without being negative)\n' +
      '2. Clarifies the correct concept\n' +
      '3. Gives a helpful tip to remember this concept\n' +
      '4. Encourages them to keep learning\n\n' +
      'Keep the response to 2-3 sentences, friendly and supportive tone.';

    const result = await model.generateContent(promptText);
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
    
    const promptText = DOUBT_CLARIFICATION_SYSTEM_PROMPT + '\n\n' +
      'The student is learning about this context:\n' +
      '"' + contextText + '"\n\n' +
      'Student doubt: "' + request.doubt + '"\n\n' +
      'Please provide a clear, helpful explanation to resolve their doubt. Keep it concise but thorough.';

    const result = await model.generateContent(promptText);
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
