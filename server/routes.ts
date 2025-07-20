import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { openaiService } from "./services/openai";
import { speechService } from "./services/speech";
import { cefrAssessmentService } from "./services/cefr-assessment";
import { setupAuth, requireAuth, getCurrentUser, type AuthUser } from "./auth";
import { insertUserSchema, insertSessionSchema, insertMessageSchema, insertQuizSchema, type CEFRLevel } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Authentication routes
  app.get("/api/auth/user", getCurrentUser);

  // For development - fallback to demo user if not authenticated
  const getDemoUser = async () => {
    let defaultUser = await storage.getUserByEmail("demo@example.com");
    if (!defaultUser) {
      defaultUser = await storage.createUser({
        email: "demo@example.com",
        name: "Demo User",
        cefrLevel: "B1",
        wordsLearned: 247,
        accuracy: 87,
        streak: 12,
        totalTime: 1680 // 28 hours in minutes
      });
    }
    return defaultUser;
  };

  // User routes - support both authenticated users and demo mode
  app.get("/api/user", async (req, res) => {
    try {
      if (req.isAuthenticated()) {
        res.json(req.user);
      } else {
        // Fallback to demo user for development
        const demoUser = await getDemoUser();
        res.json(demoUser);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Helper function to get current user (authenticated or demo)
  const getCurrentUserForRequest = async (req: any) => {
    if (req.isAuthenticated()) {
      return req.user;
    } else {
      return await getDemoUser();
    }
  };

  app.patch("/api/user", async (req, res) => {
    try {
      const updates = req.body;
      const currentUser = await getCurrentUserForRequest(req);
      const updatedUser = await storage.updateUser(currentUser.id, updates);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Chat routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, sessionId, mode = "chat" } = req.body;
      const currentUser = await getCurrentUserForRequest(req);
      
      let session;
      if (sessionId) {
        session = await storage.getSession(sessionId);
      } else {
        session = await storage.createSession({
          userId: currentUser.id,
          sessionType: mode === "dialogue" ? "dialogue" : mode === "pronunciation" ? "pronunciation" : mode === "grammar" ? "chat" : "chat",
          cefrLevelAtStart: currentUser.cefrLevel,
          endTime: null,
          score: null,
          wordsUsed: 0,
          mistakes: [],
          cefrLevelAtEnd: null
        });
      }

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Save user message
      await storage.createMessage({
        sessionId: session.id,
        text: message,
        lang: "et",
        source: "user",
        corrected: false,
        correctionExplanation: null,
        audioUrl: null
      });

      // Get conversation history
      const messages = await storage.getSessionMessages(session.id);
      const conversationHistory = messages.map(msg => ({
        role: msg.source === "user" ? "user" as const : "assistant" as const,
        content: msg.text
      }));

      // Get AI response based on mode
      const tutorResponse = await openaiService.getChatResponse(
        message,
        conversationHistory,
        currentUser.cefrLevel,
        mode
      );

      // Clean message for TTS (remove markdown formatting)
      const cleanMessageForTTS = tutorResponse.message
        .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold** formatting
        .replace(/\*(.*?)\*/g, '$1')      // Remove *italic* formatting
        .replace(/`([^`]+)`/g, '$1');     // Remove `code` formatting
      
      // Generate TTS for response with proper language detection
      const hasEstonian = /[õäöüšž]|mis|kes|kus|kuidas|tere|tänan|palun/i.test(cleanMessageForTTS);
      console.log('Language detection:', hasEstonian ? 'Estonian detected' : 'Spanish only', 'Text:', cleanMessageForTTS.substring(0, 100));
      
      const tts = hasEstonian 
        ? await speechService.synthesizeSpeech(cleanMessageForTTS, "et-EE")
        : await speechService.synthesizeSpeech(cleanMessageForTTS, "es-HN");

      // Save assistant message
      const assistantMessage = await storage.createMessage({
        sessionId: session.id,
        text: tutorResponse.message,
        lang: "es",
        source: "assistant",
        corrected: false,
        correctionExplanation: null,
        audioUrl: tts.audioUrl
      });

      res.json({
        sessionId: session.id,
        message: tutorResponse,
        audioUrl: tts.audioUrl,
        messageId: assistantMessage.id
      });

    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Speech routes
  app.post("/api/speech/transcribe", async (req, res) => {
    try {
      const { audioData, language = "es-HN" } = req.body;
      
      // Convert base64 to blob
      const audioBuffer = Buffer.from(audioData, 'base64');
      const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
      
      const transcription = await speechService.transcribeAudio(audioBlob, language);
      res.json(transcription);
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });

  app.post("/api/speech/synthesize", async (req, res) => {
    try {
      const { text, language = "et-EE" } = req.body;
      const tts = await speechService.synthesizeSpeech(text, language);
      res.json(tts);
    } catch (error) {
      console.error("Speech synthesis error:", error);
      res.status(500).json({ error: "Failed to synthesize speech" });
    }
  });

  app.post("/api/speech/analyze-pronunciation", async (req, res) => {
    try {
      const { audioData, expectedText } = req.body;
      
      const audioBuffer = Buffer.from(audioData, 'base64');
      const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
      
      const analysis = await speechService.analyzePronunciation(audioBlob, expectedText);
      res.json(analysis);
    } catch (error) {
      console.error("Pronunciation analysis error:", error);
      res.status(500).json({ error: "Failed to analyze pronunciation" });
    }
  });

  // Quiz routes
  app.post("/api/quiz/generate", async (req, res) => {
    try {
      const { cefrLevel, category } = req.body;
      const currentUser = await getCurrentUserForRequest(req);
      const quiz = await openaiService.generateQuiz(cefrLevel || currentUser.cefrLevel, category);
      
      // Create session for quiz
      const session = await storage.createSession({
        userId: currentUser.id,
        sessionType: "quiz",
        cefrLevelAtStart: currentUser.cefrLevel,
        endTime: null,
        score: null,
        wordsUsed: 0,
        mistakes: [],
        cefrLevelAtEnd: null
      });

      res.json({
        sessionId: session.id,
        quiz
      });
    } catch (error) {
      console.error("Quiz generation error:", error);
      res.status(500).json({ error: "Failed to generate quiz" });
    }
  });

  app.post("/api/quiz/submit", async (req, res) => {
    try {
      const { sessionId, answers, responseTime } = req.body;
      const currentUser = await getCurrentUserForRequest(req);
      
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Calculate score
      let correctCount = 0;
      const totalQuestions = answers.length;

      // Save quiz results and calculate score
      for (const answer of answers) {
        const isCorrect = answer.userAnswer === answer.correctAnswer;
        if (isCorrect) correctCount++;

        await storage.createQuiz({
          sessionId,
          question: answer.question,
          questionType: answer.type,
          options: answer.options,
          correctAnswer: answer.correctAnswer,
          userAnswer: answer.userAnswer,
          isCorrect,
          explanation: answer.explanation,
          cefrLevel: answer.cefrLevel,
          responseTime: responseTime[answers.indexOf(answer)]
        });
      }

      const score = Math.round((correctCount / totalQuestions) * 100);

      // Update session
      await storage.updateSession(sessionId, {
        endTime: new Date(),
        score
      });

      // Assess CEFR level
      const userResponses = answers.map((a: any) => a.userAnswer);
      const responseTimes = responseTime;
      
      const assessment = await cefrAssessmentService.assessAndUpdateUserLevel(
        currentUser.id,
        userResponses,
        responseTimes,
        score
      );

      res.json({
        score,
        correctCount,
        totalQuestions,
        assessment
      });
    } catch (error) {
      console.error("Quiz submit error:", error);
      res.status(500).json({ error: "Failed to submit quiz" });
    }
  });

  // Dialogue routes
  app.post("/api/dialogue/generate", async (req, res) => {
    try {
      const { scenario, cefrLevel } = req.body;
      const currentUser = await getCurrentUserForRequest(req);
      const dialogue = await openaiService.generateDialogue(
        scenario,
        cefrLevel || currentUser.cefrLevel
      );
      res.json(dialogue);
    } catch (error) {
      console.error("Dialogue generation error:", error);
      res.status(500).json({ error: "Failed to generate dialogue" });
    }
  });

  // CEFR assessment routes
  app.post("/api/cefr/adjust", async (req, res) => {
    try {
      const { direction } = req.body;
      const currentUser = await getCurrentUserForRequest(req);
      const newLevel = await cefrAssessmentService.manualLevelAdjustment(
        currentUser.id,
        direction
      );
      
      res.json({ newLevel });
    } catch (error) {
      console.error("CEFR adjustment error:", error);
      res.status(500).json({ error: "Failed to adjust CEFR level" });
    }
  });

  app.get("/api/cefr/recommendations", async (req, res) => {
    try {
      const currentUser = await getCurrentUserForRequest(req);
      const recommendations = await cefrAssessmentService.getAdaptiveDifficultyContent(currentUser.id);
      res.json(recommendations);
    } catch (error) {
      console.error("CEFR recommendations error:", error);
      res.status(500).json({ error: "Failed to get recommendations" });
    }
  });

  // Progress routes
  app.get("/api/progress", async (req, res) => {
    try {
      const currentUser = await getCurrentUserForRequest(req);
      const sessions = await storage.getUserSessions(currentUser.id);
      const recentSessions = sessions.slice(0, 10).map(session => ({
        id: session.id,
        type: session.sessionType,
        score: session.score,
        startTime: session.startTime,
        duration: session.endTime 
          ? Math.round((session.endTime.getTime() - (session.startTime?.getTime() || 0)) / 60000) 
          : null
      }));

      res.json({
        user: currentUser,
        recentSessions
      });
    } catch (error) {
      console.error("Progress error:", error);
      res.status(500).json({ error: "Failed to get progress" });
    }
  });

  // Vocabulary routes
  app.get("/api/vocabulary", async (req, res) => {
    try {
      const { level, category } = req.query;
      
      let vocabulary;
      if (level) {
        vocabulary = await storage.getVocabularyByLevel(level as CEFRLevel);
      } else if (category) {
        vocabulary = await storage.getVocabularyByCategory(category as string);
      } else {
        vocabulary = await storage.getAllVocabulary();
      }
      
      res.json(vocabulary);
    } catch (error) {
      console.error("Vocabulary error:", error);
      res.status(500).json({ error: "Failed to get vocabulary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
