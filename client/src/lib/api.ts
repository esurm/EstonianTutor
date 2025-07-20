import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  username: string;
  cefrLevel: string;
  wordsLearned: number;
  accuracy: number;
  streak: number;
  totalTime: number;
  createdAt?: Date;
}

export interface ChatMessage {
  id: number;
  text: string;
  lang: "es" | "et";
  source: "user" | "assistant";
  timestamp: Date;
  audioUrl?: string;
  correctionExplanation?: string;
}

export interface TutorResponse {
  message: string;
  corrections?: {
    original: string;
    corrected: string;
    explanation: string;
  }[];
  grammarNotes?: string;
  culturalContext?: string;
  encouragement?: string;
}

export interface QuizQuestion {
  question: string;
  type: "multiple_choice" | "fill_blank";
  options?: string[];
  correctAnswer: string;
  explanation: string;
  cefrLevel: string;
}

export interface Quiz {
  questions: QuizQuestion[];
}

export interface SpeechResult {
  text: string;
  confidence: number;
  language: string;
}

export interface TTSResult {
  audioUrl: string;
  duration: number;
}

export interface PronunciationAnalysis {
  score: number;
  feedback: string;
  suggestions: string[];
}

export const api = {
  // User endpoints
  async getUser(): Promise<User> {
    const res = await apiRequest("GET", "/api/user");
    return res.json();
  },

  async updateUser(updates: Partial<User>): Promise<User> {
    const res = await apiRequest("PATCH", "/api/user", updates);
    return res.json();
  },

  // Chat endpoints
  async sendChatMessage(message: string, sessionId?: number, mode?: string): Promise<{
    sessionId: number;
    message: TutorResponse;
    audioUrl: string;
    messageId: number;
  }> {
    const res = await apiRequest("POST", "/api/chat", { message, sessionId, mode });
    return res.json();
  },

  // Speech endpoints
  async transcribeAudio(audioData: string, language: string = "es-HN"): Promise<SpeechResult> {
    const res = await apiRequest("POST", "/api/speech/transcribe", { audioData, language });
    return res.json();
  },

  async synthesizeSpeech(text: string, language: string = "et-EE"): Promise<TTSResult> {
    const res = await apiRequest("POST", "/api/speech/synthesize", { text, language });
    return res.json();
  },

  async analyzePronunciation(audioData: string, expectedText: string): Promise<PronunciationAnalysis> {
    const res = await apiRequest("POST", "/api/speech/analyze-pronunciation", { audioData, expectedText });
    return res.json();
  },

  // Quiz endpoints
  async generateQuiz(cefrLevel?: string, category?: string): Promise<{
    sessionId: number;
    quiz: Quiz;
  }> {
    const res = await apiRequest("POST", "/api/quiz/generate", { cefrLevel, category });
    return res.json();
  },

  async submitQuiz(sessionId: number, answers: any[], responseTime: number[]): Promise<{
    score: number;
    correctCount: number;
    totalQuestions: number;
    assessment: any;
  }> {
    const res = await apiRequest("POST", "/api/quiz/submit", { sessionId, answers, responseTime });
    return res.json();
  },

  // Dialogue endpoints
  async generateDialogue(scenario: string, cefrLevel?: string): Promise<{
    scenario: string;
    turns: {
      speaker: "user" | "other";
      estonian: string;
      spanish: string;
      audioPrompt?: boolean;
    }[];
    culturalNotes?: string;
  }> {
    const res = await apiRequest("POST", "/api/dialogue/generate", { scenario, cefrLevel });
    return res.json();
  },

  // CEFR endpoints
  async adjustCEFRLevel(direction: "increase" | "decrease"): Promise<{ newLevel: string }> {
    const res = await apiRequest("POST", "/api/cefr/adjust", { direction });
    return res.json();
  },

  async getCEFRRecommendations(): Promise<{
    recommendedLevel: string;
    vocabularyCategories: string[];
    grammarTopics: string[];
    exerciseTypes: string[];
  }> {
    const res = await apiRequest("GET", "/api/cefr/recommendations");
    return res.json();
  },

  // Progress endpoints
  async getProgress(): Promise<{
    user: User;
    recentSessions: {
      id: number;
      type: string;
      score?: number;
      startTime: Date;
      duration?: number;
    }[];
  }> {
    const res = await apiRequest("GET", "/api/progress");
    return res.json();
  },

  // Vocabulary endpoints
  async getVocabulary(level?: string, category?: string): Promise<{
    id: number;
    estonianWord: string;
    spanishTranslation: string;
    cefrLevel: string;
    category?: string;
    pronunciation?: string;
    exampleSentence?: string;
    culturalNote?: string;
  }[]> {
    const params = new URLSearchParams();
    if (level) params.append("level", level);
    if (category) params.append("category", category);
    
    const res = await apiRequest("GET", `/api/vocabulary?${params}`);
    return res.json();
  }
};
